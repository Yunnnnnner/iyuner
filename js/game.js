class SkyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.clock = new THREE.Clock();
        
        this.gameState = {
            isPlaying: false,
            currentMap: 'dawn',
            fragments: 0,
            totalFragments: 100,
            wingLevel: 1,
            maxWingLevel: 5,
            energy: 100,
            maxEnergy: 100,
            unlockedMaps: ['dawn'],
            collectedItems: new Set(),
            playerPosition: new THREE.Vector3(0, 5, 0)
        };
        
        this.input = {
            keys: {},
            mouse: { x: 0, y: 0, dx: 0, dy: 0 },
            joystick: { x: 0, y: 0, active: false },
            fly: false
        };
        
        this.maps = {};
        this.collectibles = [];
        this.particles = [];
        this.lights = [];
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupPlayer();
        this.setupMaps();
        this.setupInput();
        this.setupUI();
        this.animate();
        
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupRenderer() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 200);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffd700, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        this.sunLight = sunLight;
    }
    
    setupPlayer() {
        this.player = new Player(this);
        this.scene.add(this.player.mesh);
    }
    
    setupMaps() {
        this.maps.dawn = new DawnIsland(this);
        this.maps.cloud = new CloudField(this);
        this.maps.rain = new RainForest(this);
        
        this.loadMap('dawn');
    }
    
    loadMap(mapName) {
        if (this.currentMapObj) {
            this.currentMapObj.unload();
        }
        
        this.gameState.currentMap = mapName;
        this.currentMapObj = this.maps[mapName];
        this.currentMapObj.load();
        
        const spawnPos = this.currentMapObj.getSpawnPoint();
        this.player.setPosition(spawnPos);
        
        if (typeof audioManager !== 'undefined' && this.gameState.isPlaying) {
            audioManager.playBGM(mapName);
        }
        
        this.updateUI();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.input.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.input.keys[e.code] = false;
        });
        
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        document.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && this.gameState.isPlaying) {
                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;
                this.input.mouse.dx = dx * 0.005;
                this.input.mouse.dy = dy * 0.005;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
        });
        
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('mobileControls');
        const handle = document.getElementById('joystickHandle');
        const flyBtn = document.getElementById('flyBtn');
        
        if (!joystick || window.innerWidth > 768) return;
        
        let joystickActive = false;
        let joystickCenter = { x: 0, y: 0 };
        
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            joystickActive = true;
            this.updateJoystick(touch.clientX, touch.clientY);
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (joystickActive) {
                const touch = e.touches[0];
                this.updateJoystick(touch.clientX, touch.clientY);
            }
        });
        
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            joystickActive = false;
            this.input.joystick.x = 0;
            this.input.joystick.y = 0;
            handle.style.transform = `translate(-50%, -50%)`;
        });
        
        flyBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.input.fly = true;
        });
        
        flyBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.input.fly = false;
        });
    }
    
    updateJoystick(clientX, clientY) {
        const handle = document.getElementById('joystickHandle');
        const maxRadius = 35;
        
        let dx = clientX - this.joystickCenter.x;
        let dy = clientY - this.joystickCenter.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }
        
        handle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        this.input.joystick.x = dx / maxRadius;
        this.input.joystick.y = -dy / maxRadius;
        this.input.joystick.active = true;
    }
    
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('respawnBtn').addEventListener('click', () => {
            this.respawn();
        });
    }
    
    startGame() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('loading').style.display = 'flex';
        
        if (typeof audioManager !== 'undefined') {
            audioManager.resume();
        }
        
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            this.gameState.isPlaying = true;
            this.loadSaveData();
            if (typeof audioManager !== 'undefined') {
                audioManager.playBGM(this.gameState.currentMap);
            }
        }, 1500);
    }
    
    respawn() {
        if (this.currentMapObj) {
            const spawnPos = this.currentMapObj.getSpawnPoint();
            this.player.setPosition(spawnPos);
            this.gameState.energy = this.gameState.maxEnergy;
        }
    }
    
    updateUI() {
        document.getElementById('fragments').textContent = this.gameState.fragments;
        document.getElementById('wings').textContent = this.gameState.wingLevel;
        
        const mapNames = {
            dawn: '晨岛',
            cloud: '云野',
            rain: '雨林'
        };
        document.getElementById('currentMap').textContent = mapNames[this.gameState.currentMap];
        
        const energyPercent = (this.gameState.energy / this.gameState.maxEnergy) * 100;
        document.getElementById('energyFill').style.width = energyPercent + '%';
    }
    
    saveGame() {
        const saveData = {
            fragments: this.gameState.fragments,
            wingLevel: this.gameState.wingLevel,
            unlockedMaps: this.gameState.unlockedMaps,
            collectedItems: Array.from(this.gameState.collectedItems),
            currentMap: this.gameState.currentMap
        };
        localStorage.setItem('skyGameSave', JSON.stringify(saveData));
    }
    
    loadSaveData() {
        const saveData = localStorage.getItem('skyGameSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.gameState.fragments = data.fragments || 0;
            this.gameState.wingLevel = data.wingLevel || 1;
            this.gameState.unlockedMaps = data.unlockedMaps || ['dawn'];
            this.gameState.collectedItems = new Set(data.collectedItems || []);
            
            this.gameState.maxEnergy = 80 + this.gameState.wingLevel * 20;
            this.gameState.energy = this.gameState.maxEnergy;
            
            if (data.currentMap && this.gameState.unlockedMaps.includes(data.currentMap)) {
                this.loadMap(data.currentMap);
            }
        }
    }
    
    collectItem(item) {
        if (this.gameState.collectedItems.has(item.id)) return false;
        
        this.gameState.collectedItems.add(item.id);
        
        switch (item.type) {
            case 'fragment':
                this.gameState.fragments++;
                this.gameState.energy = Math.min(
                    this.gameState.energy + 15,
                    this.gameState.maxEnergy
                );
                this.createCollectionEffect(item.position, 0xffd700);
                if (typeof audioManager !== 'undefined') {
                    audioManager.playCollectSound('fragment');
                }
                break;
            case 'wing':
                if (this.gameState.wingLevel < this.gameState.maxWingLevel) {
                    this.gameState.wingLevel++;
                    this.gameState.maxEnergy = 80 + this.gameState.wingLevel * 20;
                    this.gameState.energy = this.gameState.maxEnergy;
                    this.player.upgradeWings();
                }
                this.createCollectionEffect(item.position, 0x00ffff);
                if (typeof audioManager !== 'undefined') {
                    audioManager.playCollectSound('wing');
                }
                break;
            case 'candle':
                this.gameState.energy = Math.min(
                    this.gameState.energy + 30,
                    this.gameState.maxEnergy
                );
                this.createCollectionEffect(item.position, 0xff6600);
                if (typeof audioManager !== 'undefined') {
                    audioManager.playCollectSound('candle');
                }
                break;
        }
        
        this.updateUI();
        this.saveGame();
        
        if (this.gameState.fragments >= this.gameState.totalFragments) {
            this.triggerEnding();
        }
        
        return true;
    }
    
    createCollectionEffect(position, color) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            velocities.push({
                x: (Math.random() - 0.5) * 0.5,
                y: Math.random() * 0.5,
                z: (Math.random() - 0.5) * 0.5
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.3,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        this.particles.push({
            mesh: particles,
            velocities: velocities,
            life: 1.0
        });
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime * 2;
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }
            
            const positions = p.mesh.geometry.attributes.position.array;
            for (let j = 0; j < p.velocities.length; j++) {
                positions[j * 3] += p.velocities[j].x * deltaTime;
                positions[j * 3 + 1] += p.velocities[j].y * deltaTime;
                positions[j * 3 + 2] += p.velocities[j].z * deltaTime;
            }
            p.mesh.geometry.attributes.position.needsUpdate = true;
            p.mesh.material.opacity = p.life;
        }
    }
    
    triggerEnding() {
        this.gameState.isPlaying = false;
        
        if (typeof audioManager !== 'undefined') {
            audioManager.playEndingMusic();
        }
        
        const endingDiv = document.createElement('div');
        endingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #ffd700 0%, #ffed4e 50%, #ffffff 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 3s;
        `;
        endingDiv.innerHTML = `
            <h1 style="color: #1a1a3e; font-size: 48px; margin-bottom: 20px; opacity: 0; transition: opacity 2s 1s;">光明重临云间</h1>
            <p style="color: #1a1a3e; font-size: 20px; opacity: 0; transition: opacity 2s 2s;">感谢你，云间微光旅者</p>
            <p style="color: #1a1a3e; font-size: 16px; margin-top: 10px; opacity: 0; transition: opacity 2s 3s;">云海王国因你而重获光明</p>
        `;
        document.body.appendChild(endingDiv);
        
        setTimeout(() => {
            endingDiv.style.opacity = '1';
            setTimeout(() => {
                endingDiv.querySelector('h1').style.opacity = '1';
                endingDiv.querySelectorAll('p')[0].style.opacity = '1';
                endingDiv.querySelectorAll('p')[1].style.opacity = '1';
            }, 100);
        }, 100);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        if (this.gameState.isPlaying) {
            this.player.update(deltaTime);
            this.updateParticles(deltaTime);
            
            if (this.currentMapObj) {
                this.currentMapObj.update(deltaTime);
            }
            
            this.updateUI();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.speed = 10;
        this.verticalSpeed = 8;
        this.glideFactor = 1;
        
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.ConeGeometry(0.3, 1, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x222244,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        const capeGeometry = new THREE.PlaneGeometry(0.8, 1.2, 4, 4);
        const capeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        this.cape = new THREE.Mesh(capeGeometry, capeMaterial);
        this.cape.position.set(0, -0.3, -0.3);
        this.cape.rotation.x = 0.3;
        group.add(this.cape);
        
        this.wings = [];
        for (let i = 0; i < 2; i++) {
            const wingGeometry = new THREE.PlaneGeometry(0.6, 0.4, 3, 2);
            const wingMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffaa,
                emissive: 0x444422,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.position.set(i === 0 ? -0.4 : 0.4, 0.2, -0.2);
            wing.rotation.y = i === 0 ? 0.5 : -0.5;
            wing.rotation.z = i === 0 ? 0.3 : -0.3;
            group.add(wing);
            this.wings.push(wing);
        }
        
        const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.3;
        group.add(glow);
        
        this.light = new THREE.PointLight(0xffffaa, 1, 10);
        this.light.position.y = 0.5;
        group.add(this.light);
        
        this.mesh = group;
        this.mesh.position.set(0, 5, 0);
    }
    
    upgradeWings() {
        const wingLevel = this.game.gameState.wingLevel;
        this.wings.forEach(wing => {
            wing.scale.setScalar(1 + wingLevel * 0.2);
            wing.material.emissiveIntensity = 0.5 + wingLevel * 0.2;
        });
    }
    
    setPosition(pos) {
        this.mesh.position.copy(pos);
        this.velocity.set(0, 0, 0);
    }
    
    update(deltaTime) {
        const input = this.game.input;
        const state = this.game.gameState;
        
        let moveX = 0;
        let moveZ = 0;
        let moveY = 0;
        
        if (input.keys['KeyW'] || input.keys['ArrowUp']) moveZ -= 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) moveZ += 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;
        
        if (input.joystick.active) {
            moveX = input.joystick.x;
            moveZ = -input.joystick.y;
        }
        
        const isGliding = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
        const isFlying = input.keys['Space'] || input.fly;
        
        if (isFlying && state.energy > 0) {
            moveY = 1;
            state.energy -= deltaTime * 8;
        } else if (isGliding && state.energy > 0) {
            this.glideFactor = 0.3;
            state.energy -= deltaTime * 2;
        } else {
            this.glideFactor = 1;
            moveY = -0.5;
        }
        
        if (state.energy <= 0) {
            moveY = -1;
        }
        
        const wingMultiplier = 0.8 + state.wingLevel * 0.2;
        const targetVelocity = new THREE.Vector3(
            moveX * this.speed * wingMultiplier,
            moveY * this.verticalSpeed * wingMultiplier,
            moveZ * this.speed * wingMultiplier
        );
        
        this.velocity.lerp(targetVelocity, deltaTime * 3);
        
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        if (this.mesh.position.y < 1) {
            this.mesh.position.y = 1;
            this.velocity.y = 0;
        }
        
        this.mesh.rotation.y -= input.mouse.dx;
        this.mesh.rotation.x = Math.max(-0.5, Math.min(0.5, this.mesh.rotation.x + input.mouse.dy));
        
        input.mouse.dx = 0;
        input.mouse.dy = 0;
        
        this.updateCamera();
        this.animateWings(deltaTime, isFlying || isGliding);
        this.checkCollectibles();
    }
    
    updateCamera() {
        const offset = new THREE.Vector3(0, 5, 12);
        offset.applyEuler(this.mesh.rotation);
        
        const targetPos = this.mesh.position.clone().add(offset);
        this.game.camera.position.lerp(targetPos, 0.1);
        this.game.camera.lookAt(this.mesh.position);
    }
    
    animateWings(deltaTime, isFlying) {
        const time = Date.now() * 0.005;
        const flapSpeed = isFlying ? 15 : 5;
        const flapRange = isFlying ? 0.5 : 0.2;
        
        this.wings.forEach((wing, i) => {
            const offset = i === 0 ? 0 : Math.PI;
            wing.rotation.z = (i === 0 ? 0.3 : -0.3) + Math.sin(time * flapSpeed + offset) * flapRange;
        });
        
        if (this.cape) {
            this.cape.rotation.x = 0.3 + Math.sin(time * 3) * 0.1;
        }
    }
    
    checkCollectibles() {
        const playerPos = this.mesh.position;
        
        this.game.collectibles.forEach(item => {
            if (!item.collected) {
                const distance = playerPos.distanceTo(item.mesh.position);
                if (distance < 2) {
                    if (this.game.collectItem(item)) {
                        item.collected = true;
                        this.game.scene.remove(item.mesh);
                    }
                }
            }
        });
    }
}

class MapBase {
    constructor(game, name) {
        this.game = game;
        this.name = name;
        this.objects = [];
        this.collectibles = [];
        this.spawnPoint = new THREE.Vector3(0, 5, 0);
    }
    
    load() {
        this.createTerrain();
        this.createCollectibles();
        this.createDecorations();
    }
    
    unload() {
        this.objects.forEach(obj => this.game.scene.remove(obj));
        this.collectibles.forEach(item => {
            if (!item.collected) {
                this.game.scene.remove(item.mesh);
            }
        });
        this.objects = [];
        this.collectibles = [];
        this.game.collectibles = [];
    }
    
    getSpawnPoint() {
        return this.spawnPoint.clone();
    }
    
    update(deltaTime) {
        this.collectibles.forEach(item => {
            if (!item.collected && item.update) {
                item.update(deltaTime);
            }
        });
    }
    
    createTerrain() {}
    createCollectibles() {}
    createDecorations() {}
}

class DawnIsland extends MapBase {
    constructor(game) {
        super(game, 'dawn');
        this.spawnPoint = new THREE.Vector3(0, 5, 0);
    }
    
    createTerrain() {
        this.game.scene.fog.color.setHex(0xffaa66);
        this.game.sunLight.color.setHex(0xffd4a3);
        this.game.sunLight.intensity = 1.2;
        
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8c9a0,
            roughness: 0.9
        });
        
        const positions = groundGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            positions[i + 2] = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3 +
                              Math.sin(x * 0.1) * Math.sin(y * 0.1) * 1;
        }
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.game.scene.add(ground);
        this.objects.push(ground);
        
        for (let i = 0; i < 15; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0xc4a77d,
                roughness: 0.8
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                (Math.random() - 0.5) * 80,
                Math.random() * 2,
                (Math.random() - 0.5) * 80
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.game.scene.add(rock);
            this.objects.push(rock);
        }
        
        for (let i = 0; i < 8; i++) {
            const hillGeometry = new THREE.ConeGeometry(8 + Math.random() * 5, 15 + Math.random() * 10, 6);
            const hillMaterial = new THREE.MeshStandardMaterial({
                color: 0xd4b896,
                roughness: 0.9
            });
            const hill = new THREE.Mesh(hillGeometry, hillMaterial);
            hill.position.set(
                (Math.random() - 0.5) * 120,
                -5,
                (Math.random() - 0.5) * 120
            );
            hill.receiveShadow = true;
            this.game.scene.add(hill);
            this.objects.push(hill);
        }
    }
    
    createCollectibles() {
        for (let i = 0; i < 20; i++) {
            this.createFragment(
                (Math.random() - 0.5) * 60,
                3 + Math.random() * 8,
                (Math.random() - 0.5) * 60,
                `dawn_fragment_${i}`
            );
        }
        
        this.createWing(25, 8, 20, 'dawn_wing_1');
        
        for (let i = 0; i < 5; i++) {
            this.createCandle(
                (Math.random() - 0.5) * 40,
                2,
                (Math.random() - 0.5) * 40,
                `dawn_candle_${i}`
            );
        }
    }
    
    createFragment(x, y, z, id) {
        const geometry = new THREE.OctahedronGeometry(0.4, 0);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const light = new THREE.PointLight(0xffd700, 0.5, 5);
        light.position.copy(mesh.position);
        this.game.scene.add(light);
        this.objects.push(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'fragment',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                mesh.rotation.y += deltaTime * 2;
                mesh.rotation.x += deltaTime;
                mesh.position.y = y + Math.sin(Date.now() * 0.002) * 0.3;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createWing(x, y, z, id) {
        const geometry = new THREE.PlaneGeometry(0.8, 0.5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const light = new THREE.PointLight(0x00ffff, 0.8, 8);
        light.position.copy(mesh.position);
        this.game.scene.add(light);
        this.objects.push(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'wing',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                mesh.rotation.y += deltaTime * 3;
                mesh.position.y = y + Math.sin(Date.now() * 0.003) * 0.5;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createCandle(x, y, z, id) {
        const geometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 0.5;
        mesh.add(flame);
        
        const light = new THREE.PointLight(0xff6600, 1, 10);
        light.position.set(0, 1, 0);
        mesh.add(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'candle',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                flame.scale.setScalar(scale);
                light.intensity = 0.8 + Math.sin(Date.now() * 0.008) * 0.2;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createDecorations() {
        const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4
        });
        
        for (let i = 0; i < 30; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 150,
                15 + Math.random() * 20,
                (Math.random() - 0.5) * 150
            );
            cloud.scale.set(
                3 + Math.random() * 4,
                1.5 + Math.random() * 2,
                2 + Math.random() * 3
            );
            this.game.scene.add(cloud);
            this.objects.push(cloud);
        }
    }
}

class CloudField extends MapBase {
    constructor(game) {
        super(game, 'cloud');
        this.spawnPoint = new THREE.Vector3(0, 15, 0);
    }
    
    createTerrain() {
        this.game.scene.fog.color.setHex(0xe8f4ff);
        this.game.sunLight.color.setHex(0xffffff);
        this.game.sunLight.intensity = 1.0;
        
        const cloudBaseGeometry = new THREE.PlaneGeometry(300, 300, 30, 30);
        const cloudBaseMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        
        const cloudBase = new THREE.Mesh(cloudBaseGeometry, cloudBaseMaterial);
        cloudBase.rotation.x = -Math.PI / 2;
        cloudBase.position.y = -10;
        this.game.scene.add(cloudBase);
        this.objects.push(cloudBase);
        
        for (let i = 0; i < 25; i++) {
            const islandGeometry = new THREE.CylinderGeometry(
                5 + Math.random() * 8,
                3 + Math.random() * 5,
                8 + Math.random() * 12,
                7
            );
            const islandMaterial = new THREE.MeshStandardMaterial({
                color: 0xf0f8ff,
                roughness: 0.8
            });
            const island = new THREE.Mesh(islandGeometry, islandMaterial);
            island.position.set(
                (Math.random() - 0.5) * 150,
                -15 + Math.random() * 5,
                (Math.random() - 0.5) * 150
            );
            island.receiveShadow = true;
            this.game.scene.add(island);
            this.objects.push(island);
            
            const topGeometry = new THREE.CylinderGeometry(
                islandGeometry.parameters.radiusTop * 1.2,
                islandGeometry.parameters.radiusTop,
                2,
                7
            );
            const topMaterial = new THREE.MeshStandardMaterial({
                color: 0x90ee90,
                roughness: 0.9
            });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.y = islandGeometry.parameters.height / 2 + 1;
            island.add(top);
        }
    }
    
    createCollectibles() {
        for (let i = 0; i < 35; i++) {
            this.createFragment(
                (Math.random() - 0.5) * 100,
                10 + Math.random() * 20,
                (Math.random() - 0.5) * 100,
                `cloud_fragment_${i}`
            );
        }
        
        this.createWing(-30, 25, -40, 'cloud_wing_1');
        this.createWing(50, 30, 30, 'cloud_wing_2');
        
        for (let i = 0; i < 8; i++) {
            this.createCandle(
                (Math.random() - 0.5) * 80,
                8 + Math.random() * 5,
                (Math.random() - 0.5) * 80,
                `cloud_candle_${i}`
            );
        }
    }
    
    createFragment(x, y, z, id) {
        const geometry = new THREE.OctahedronGeometry(0.4, 0);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const light = new THREE.PointLight(0xffd700, 0.5, 5);
        light.position.copy(mesh.position);
        this.game.scene.add(light);
        this.objects.push(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'fragment',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                mesh.rotation.y += deltaTime * 2;
                mesh.rotation.x += deltaTime;
                mesh.position.y = y + Math.sin(Date.now() * 0.002 + x) * 0.3;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createWing(x, y, z, id) {
        const geometry = new THREE.PlaneGeometry(0.8, 0.5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const light = new THREE.PointLight(0x00ffff, 0.8, 8);
        light.position.copy(mesh.position);
        this.game.scene.add(light);
        this.objects.push(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'wing',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                mesh.rotation.y += deltaTime * 3;
                mesh.position.y = y + Math.sin(Date.now() * 0.003) * 0.5;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createCandle(x, y, z, id) {
        const geometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 0.5;
        mesh.add(flame);
        
        const light = new THREE.PointLight(0xff6600, 1, 10);
        light.position.set(0, 1, 0);
        mesh.add(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'candle',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                flame.scale.setScalar(scale);
                light.intensity = 0.8 + Math.sin(Date.now() * 0.008) * 0.2;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createDecorations() {
        const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        
        for (let i = 0; i < 50; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 200,
                Math.random() * 30,
                (Math.random() - 0.5) * 200
            );
            cloud.scale.set(
                4 + Math.random() * 6,
                2 + Math.random() * 3,
                3 + Math.random() * 5
            );
            this.game.scene.add(cloud);
            this.objects.push(cloud);
        }
    }
}

class RainForest extends MapBase {
    constructor(game) {
        super(game, 'rain');
        this.spawnPoint = new THREE.Vector3(0, 5, 50);
    }
    
    createTerrain() {
        this.game.scene.fog.color.setHex(0x2d4a3e);
        this.game.sunLight.color.setHex(0xa8d5ba);
        this.game.sunLight.intensity = 0.7;
        
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d5c48,
            roughness: 0.95
        });
        
        const positions = groundGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            positions[i + 2] = Math.sin(x * 0.03) * Math.cos(y * 0.03) * 5 +
                              Math.random() * 0.5;
        }
        groundGeometry.computeVertexNormals();
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.game.scene.add(ground);
        this.objects.push(ground);
        
        for (let i = 0; i < 40; i++) {
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8 + Math.random() * 6, 6);
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a3728,
                roughness: 0.9
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            
            const x = (Math.random() - 0.5) * 120;
            const z = (Math.random() - 0.5) * 120;
            trunk.position.set(x, trunkGeometry.parameters.height / 2, z);
            trunk.castShadow = true;
            this.game.scene.add(trunk);
            this.objects.push(trunk);
            
            const leavesGeometry = new THREE.ConeGeometry(4 + Math.random() * 3, 8 + Math.random() * 4, 6);
            const leavesMaterial = new THREE.MeshStandardMaterial({
                color: 0x2d5a3d,
                roughness: 0.8
            });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = trunkGeometry.parameters.height / 2 + 3;
            trunk.add(leaves);
            
            const leaves2 = new THREE.Mesh(
                new THREE.ConeGeometry(3 + Math.random() * 2, 6 + Math.random() * 3, 6),
                leavesMaterial
            );
            leaves2.position.y = 4;
            leaves.add(leaves2);
        }
        
        for (let i = 0; i < 10; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(2 + Math.random() * 2);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x5a5a5a,
                roughness: 0.9
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                (Math.random() - 0.5) * 100,
                1,
                (Math.random() - 0.5) * 100
            );
            rock.castShadow = true;
            this.game.scene.add(rock);
            this.objects.push(rock);
        }
    }
    
    createCollectibles() {
        for (let i = 0; i < 45; i++) {
            this.createFragment(
                (Math.random() - 0.5) * 100,
                3 + Math.random() * 15,
                (Math.random() - 0.5) * 100,
                `rain_fragment_${i}`
            );
        }
        
        this.createWing(40, 20, -30, 'rain_wing_1');
        this.createWing(-35, 18, 40, 'rain_wing_2');
        
        for (let i = 0; i < 10; i++) {
            this.createCandle(
                (Math.random() - 0.5) * 90,
                2 + Math.random() * 3,
                (Math.random() - 0.5) * 90,
                `rain_candle_${i}`
            );
        }
    }
    
    createFragment(x, y, z, id) {
        const geometry = new THREE.OctahedronGeometry(0.4, 0);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const light = new THREE.PointLight(0xffd700, 0.5, 5);
        light.position.copy(mesh.position);
        this.game.scene.add(light);
        this.objects.push(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'fragment',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                mesh.rotation.y += deltaTime * 2;
                mesh.rotation.x += deltaTime;
                mesh.position.y = y + Math.sin(Date.now() * 0.002) * 0.3;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createWing(x, y, z, id) {
        const geometry = new THREE.PlaneGeometry(0.8, 0.5);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const light = new THREE.PointLight(0x00ffff, 0.8, 8);
        light.position.copy(mesh.position);
        this.game.scene.add(light);
        this.objects.push(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'wing',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                mesh.rotation.y += deltaTime * 3;
                mesh.position.y = y + Math.sin(Date.now() * 0.003) * 0.5;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createCandle(x, y, z, id) {
        const geometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 0.5;
        mesh.add(flame);
        
        const light = new THREE.PointLight(0xff6600, 1, 10);
        light.position.set(0, 1, 0);
        mesh.add(light);
        
        this.game.scene.add(mesh);
        
        const item = {
            id: id,
            type: 'candle',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            collected: this.game.gameState.collectedItems.has(id),
            update: (deltaTime) => {
                const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                flame.scale.setScalar(scale);
                light.intensity = 0.8 + Math.sin(Date.now() * 0.008) * 0.2;
            }
        };
        
        this.collectibles.push(item);
        this.game.collectibles.push(item);
    }
    
    createDecorations() {
        const mistGeometry = new THREE.SphereGeometry(1, 8, 8);
        const mistMaterial = new THREE.MeshBasicMaterial({
            color: 0xa8d5ba,
            transparent: true,
            opacity: 0.2
        });
        
        for (let i = 0; i < 40; i++) {
            const mist = new THREE.Mesh(mistGeometry, mistMaterial);
            mist.position.set(
                (Math.random() - 0.5) * 150,
                Math.random() * 10,
                (Math.random() - 0.5) * 150
            );
            mist.scale.set(
                5 + Math.random() * 8,
                2 + Math.random() * 3,
                5 + Math.random() * 8
            );
            this.game.scene.add(mist);
            this.objects.push(mist);
        }
        
        this.createRain();
    }
    
    createRain() {
        const rainCount = 2000;
        const rainGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        
        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xa8d5ba,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        this.rain = new THREE.Points(rainGeometry, rainMaterial);
        this.game.scene.add(this.rain);
        this.objects.push(this.rain);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.rain) {
            const positions = this.rain.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 20 * deltaTime;
                if (positions[i + 1] < 0) {
                    positions[i + 1] = 100;
                }
            }
            this.rain.geometry.attributes.position.needsUpdate = true;
        }
    }
}

const game = new SkyGame();
