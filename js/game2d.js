class WatercolorCanvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.noiseCanvas = document.createElement('canvas');
        this.noiseCanvas.width = 256;
        this.noiseCanvas.height = 256;
        this.generateNoise();
    }
    
    generateNoise() {
        const ctx = this.noiseCanvas.getContext('2d');
        const imageData = ctx.createImageData(256, 256);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const value = Math.random() * 255;
            imageData.data[i] = value;
            imageData.data[i + 1] = value;
            imageData.data[i + 2] = value;
            imageData.data[i + 3] = 15;
        }
        ctx.putImageData(imageData, 0, 0);
    }
    
    clear(color = '#1a1a3e') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    applyWatercolorEffect() {
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.drawImage(this.noiseCanvas, 0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    drawSoftCircle(x, y, radius, color, alpha = 0.5) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, this.hexToRgba(color, alpha));
        gradient.addColorStop(0.5, this.hexToRgba(color, alpha * 0.5));
        gradient.addColorStop(1, this.hexToRgba(color, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawWatercolorBlob(x, y, radius, color, alpha = 0.6) {
        const points = 8;
        const angleStep = (Math.PI * 2) / points;
        
        this.ctx.fillStyle = this.hexToRgba(color, alpha);
        this.ctx.beginPath();
        
        for (let i = 0; i <= points; i++) {
            const angle = i * angleStep;
            const r = radius + (Math.random() - 0.5) * radius * 0.3;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                const prevAngle = (i - 1) * angleStep;
                const cpRadius = r * 1.2;
                const cpAngle = prevAngle + angleStep * 0.5;
                const cpx = x + Math.cos(cpAngle) * cpRadius;
                const cpy = y + Math.sin(cpAngle) * cpRadius;
                this.ctx.quadraticCurveTo(cpx, cpy, px, py);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = this.hexToRgba(color, alpha * 0.5);
        this.ctx.beginPath();
        this.ctx.arc(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, radius * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSoftGradient(x, y, width, height, colors) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }
    
    drawGlow(x, y, radius, color, intensity = 1) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, this.hexToRgba(color, 0.8 * intensity));
        gradient.addColorStop(0.3, this.hexToRgba(color, 0.4 * intensity));
        gradient.addColorStop(0.7, this.hexToRgba(color, 0.1 * intensity));
        gradient.addColorStop(1, this.hexToRgba(color, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawParticle(x, y, size, color, alpha) {
        this.ctx.fillStyle = this.hexToRgba(color, alpha);
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
}

class CloudLightGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new WatercolorCanvas(this.canvas);
        
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
            collectedItems: new Set()
        };
        
        this.camera = { x: 0, y: 0 };
        this.player = null;
        this.currentMap = null;
        this.particles = [];
        this.clouds = [];
        this.portal = null;
        
        this.input = {
            keys: {},
            joystick: { x: 0, y: 0, active: false },
            fly: false
        };
        
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupInput();
        this.setupUI();
        this.createPlayer();
        this.createMaps();
        
        window.addEventListener('resize', () => this.onResize());
        
        this.animate(0);
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.input.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.input.keys[e.code] = false;
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
            this.updateJoystick(touch.clientX, touch.clientY, handle);
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (joystickActive) {
                const touch = e.touches[0];
                this.updateJoystick(touch.clientX, touch.clientY, handle);
            }
        });
        
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            joystickActive = false;
            this.input.joystick.x = 0;
            this.input.joystick.y = 0;
            this.input.joystick.active = false;
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
    
    updateJoystick(clientX, clientY, handle) {
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
        this.input.joystick.y = dy / maxRadius;
        this.input.joystick.active = true;
    }
    
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('respawnBtn').addEventListener('click', () => {
            this.respawn();
        });
        
        document.getElementById('portalBtn').addEventListener('click', () => {
            this.nextMap();
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
            this.loadMap('dawn');
            if (typeof audioManager !== 'undefined') {
                audioManager.playBGM('dawn');
            }
        }, 1500);
    }
    
    respawn() {
        if (this.currentMap) {
            this.player.x = this.currentMap.spawnX;
            this.player.y = this.currentMap.spawnY;
            this.gameState.energy = this.gameState.maxEnergy;
        }
    }
    
    nextMap() {
        const mapOrder = ['dawn', 'cloud', 'rain'];
        const currentIndex = mapOrder.indexOf(this.gameState.currentMap);
        
        if (currentIndex < mapOrder.length - 1) {
            const nextMapName = mapOrder[currentIndex + 1];
            if (!this.gameState.unlockedMaps.includes(nextMapName)) {
                this.gameState.unlockedMaps.push(nextMapName);
            }
            this.loadMap(nextMapName);
            document.getElementById('portalBtn').classList.remove('show');
        }
    }
    
    createPlayer() {
        this.player = {
            x: 0,
            y: 100,
            vx: 0,
            vy: 0,
            width: 30,
            height: 50,
            facing: 1,
            wingFrame: 0,
            glowIntensity: 0
        };
    }
    
    createMaps() {
        this.maps = {
            dawn: new DawnMap2D(this),
            cloud: new CloudMap2D(this),
            rain: new RainMap2D(this)
        };
    }
    
    loadMap(mapName) {
        this.gameState.currentMap = mapName;
        this.currentMap = this.maps[mapName];
        this.player.x = this.currentMap.spawnX;
        this.player.y = this.currentMap.spawnY;
        this.clouds = this.currentMap.generateClouds();
        this.portal = this.currentMap.portal;
        
        // 同步物品的收集状态
        this.currentMap.items.forEach(item => {
            if (this.gameState.collectedItems.has(item.id)) {
                item.collected = true;
            }
        });
        
        // 检查portal解锁状态
        this.checkPortalUnlock();
        
        if (typeof audioManager !== 'undefined') {
            audioManager.playBGM(mapName);
        }
        
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('fragments').textContent = this.gameState.fragments;
        document.getElementById('wings').textContent = this.gameState.wingLevel;
        
        const mapNames = {
            dawn: '晨曦平原',
            cloud: '云海之境',
            rain: '迷雾森林'
        };
        document.getElementById('currentMap').textContent = mapNames[this.gameState.currentMap];
        
        const energyPercent = (this.gameState.energy / this.gameState.maxEnergy) * 100;
        document.getElementById('energyFill').style.width = energyPercent + '%';
    }
    
    showCollectionNotification(text) {
        const notification = document.getElementById('collectionNotification');
        notification.textContent = text;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 1500);
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
                this.createCollectionParticles(item.x, item.y, '#ffd700');
                this.showCollectionNotification('+1 星光碎片');
                if (typeof audioManager !== 'undefined') {
                    audioManager.playCollectSound('fragment');
                }
                break;
            case 'wing':
                if (this.gameState.wingLevel < this.gameState.maxWingLevel) {
                    this.gameState.wingLevel++;
                    this.gameState.maxEnergy = 80 + this.gameState.wingLevel * 20;
                    this.gameState.energy = this.gameState.maxEnergy;
                }
                this.createCollectionParticles(item.x, item.y, '#00ffff');
                this.showCollectionNotification('羽翼升级！');
                if (typeof audioManager !== 'undefined') {
                    audioManager.playCollectSound('wing');
                }
                break;
            case 'candle':
                this.gameState.energy = Math.min(
                    this.gameState.energy + 30,
                    this.gameState.maxEnergy
                );
                this.createCollectionParticles(item.x, item.y, '#ff6600');
                this.showCollectionNotification('能量回复');
                if (typeof audioManager !== 'undefined') {
                    audioManager.playCollectSound('candle');
                }
                break;
        }
        
        this.updateUI();
        this.saveGame();
        this.checkPortalUnlock();
        
        if (this.gameState.fragments >= this.gameState.totalFragments) {
            this.triggerEnding();
        }
        
        return true;
    }
    
    checkPortalUnlock() {
        const mapRequirements = {
            dawn: 5,
            cloud: 15,
            rain: 30
        };
        
        const required = mapRequirements[this.gameState.currentMap];
        const mapFragments = this.currentMap.items.filter(item => 
            item.type === 'fragment' && this.gameState.collectedItems.has(item.id)
        ).length;
        
        if (mapFragments >= required && this.portal) {
            this.portal.unlocked = true;
            // 显示提示
            this.showCollectionNotification('传送之门已开启！');
        }
    }
    
    createCollectionParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                color: color,
                size: 3 + Math.random() * 4,
                type: 'collection'
            });
        }
    }
    
    saveGame() {
        const saveData = {
            fragments: this.gameState.fragments,
            wingLevel: this.gameState.wingLevel,
            unlockedMaps: this.gameState.unlockedMaps,
            collectedItems: Array.from(this.gameState.collectedItems),
            currentMap: this.gameState.currentMap
        };
        localStorage.setItem('cloudLightSave', JSON.stringify(saveData));
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
            <h1 style="color: #1a1a3e; font-size: 48px; margin-bottom: 20px; opacity: 0; transition: opacity 2s 1s; font-weight: 300; letter-spacing: 10px;">光明重临云间</h1>
            <p style="color: #1a1a3e; font-size: 20px; opacity: 0; transition: opacity 2s 2s; font-weight: 300;">感谢你，云间旅者</p>
            <p style="color: #1a1a3e; font-size: 16px; margin-top: 10px; opacity: 0; transition: opacity 2s 3s; font-weight: 300;">云海因你而重获光明</p>
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
    
    update(deltaTime) {
        if (!this.gameState.isPlaying) return;
        
        this.updatePlayer(deltaTime);
        this.updateParticles(deltaTime);
        this.updateClouds(deltaTime);
        this.checkCollisions();
        this.checkPortal();
        this.updateCamera();
        this.updateUI();
    }
    
    updatePlayer(deltaTime) {
        const p = this.player;
        const speed = 150 * (0.8 + this.gameState.wingLevel * 0.2);
        const flySpeed = 120 * (0.8 + this.gameState.wingLevel * 0.2);
        
        let dx = 0;
        let dy = 0;
        
        if (this.input.keys['KeyW'] || this.input.keys['ArrowUp']) dy -= 1;
        if (this.input.keys['KeyS'] || this.input.keys['ArrowDown']) dy += 1;
        if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft']) dx -= 1;
        if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) dx += 1;
        
        if (this.input.joystick.active) {
            dx = this.input.joystick.x;
            dy = this.input.joystick.y;
        }
        
        const isGliding = this.input.keys['ShiftLeft'] || this.input.keys['ShiftRight'];
        const isFlying = this.input.keys['Space'] || this.input.fly;
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 1) {
                dx /= len;
                dy /= len;
            }
            
            p.vx += dx * speed * deltaTime * 3;
            p.vy += dy * speed * deltaTime * 3;
            
            if (dx > 0) p.facing = 1;
            if (dx < 0) p.facing = -1;
        }
        
        if (isFlying && this.gameState.energy > 0) {
            p.vy -= flySpeed * deltaTime * 2;
            this.gameState.energy -= deltaTime * 15;
            p.wingFrame += deltaTime * 15;
        } else if (isGliding && this.gameState.energy > 0) {
            p.vy *= 0.95;
            this.gameState.energy -= deltaTime * 5;
            p.wingFrame += deltaTime * 8;
        } else {
            p.vy += 200 * deltaTime;
            p.wingFrame += deltaTime * 3;
        }
        
        if (this.gameState.energy <= 0) {
            p.vy += 100 * deltaTime;
        }
        
        p.vx *= 0.92;
        p.vy *= 0.95;
        
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        
        const groundY = this.currentMap ? this.currentMap.getGroundY(p.x) : 500;
        if (p.y > groundY - p.height / 2) {
            p.y = groundY - p.height / 2;
            p.vy = 0;
        }
        
        p.glowIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime * 1.5;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            if (p.type === 'collection') {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 50 * deltaTime;
            } else if (p.type === 'ambient') {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                
                if (p.x < this.camera.x - 100) p.x = this.camera.x + this.renderer.width + 100;
                if (p.x > this.camera.x + this.renderer.width + 100) p.x = this.camera.x - 100;
                if (p.y < this.camera.y - 100) p.y = this.camera.y + this.renderer.height + 100;
                if (p.y > this.camera.y + this.renderer.height + 100) p.y = this.camera.y - 100;
            }
        }
    }
    
    updateClouds(deltaTime) {
        this.clouds.forEach(cloud => {
            cloud.x += cloud.vx * deltaTime;
            cloud.y += Math.sin(Date.now() * 0.001 + cloud.offset) * 0.3;
            
            if (cloud.x < this.camera.x - 300) {
                cloud.x = this.camera.x + this.renderer.width + 300;
            }
            if (cloud.x > this.camera.x + this.renderer.width + 300) {
                cloud.x = this.camera.x - 300;
            }
        });
    }
    
    checkCollisions() {
        if (!this.currentMap) return;
        
        this.currentMap.items.forEach(item => {
            // 检查物品是否已经被收集（从存档或当前游戏状态）
            if (item.collected || this.gameState.collectedItems.has(item.id)) {
                item.collected = true;
                return;
            }
            
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 40) {
                if (this.collectItem(item)) {
                    item.collected = true;
                }
            }
        });
    }
    
    checkPortal() {
        if (!this.portal || !this.portal.unlocked) {
            document.getElementById('portalBtn').classList.remove('show');
            return;
        }
        
        const dx = this.player.x - this.portal.x;
        const dy = this.player.y - this.portal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
            document.getElementById('portalBtn').classList.add('show');
        } else {
            document.getElementById('portalBtn').classList.remove('show');
        }
    }
    
    updateCamera() {
        const targetX = this.player.x - this.renderer.width / 2;
        const targetY = this.player.y - this.renderer.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.05;
        this.camera.y += (targetY - this.camera.y) * 0.05;
    }
    
    render() {
        const ctx = this.renderer.ctx;
        
        if (this.currentMap) {
            this.currentMap.render(this.renderer, this.camera);
        } else {
            this.renderer.clear('#1a1a3e');
        }
        
        this.renderClouds();
        this.renderPortal();
        this.renderItems();
        this.renderPlayer();
        this.renderParticles();
        
        this.renderer.applyWatercolorEffect();
    }
    
    renderClouds() {
        this.clouds.forEach(cloud => {
            const screenX = cloud.x - this.camera.x;
            const screenY = cloud.y - this.camera.y;
            
            this.renderer.drawSoftCircle(
                screenX,
                screenY,
                cloud.size,
                cloud.color,
                cloud.alpha
            );
        });
    }
    
    renderPortal() {
        if (!this.portal || !this.portal.unlocked) return;
        
        const screenX = this.portal.x - this.camera.x;
        const screenY = this.portal.y - this.camera.y;
        const time = Date.now() * 0.002;
        
        const ctx = this.renderer.ctx;
        
        for (let i = 3; i >= 0; i--) {
            const radius = 40 + i * 15 + Math.sin(time + i) * 5;
            const alpha = 0.3 - i * 0.05;
            this.renderer.drawGlow(screenX, screenY, radius, '#ffd700', alpha);
        }
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(time);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 220, 150, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 35 + i * 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        
        ctx.fillStyle = 'rgba(255, 235, 200, 0.9)';
        ctx.font = '12px "Noto Serif SC"';
        ctx.textAlign = 'center';
        ctx.fillText('传送之门', screenX, screenY + 55);
    }
    
    renderItems() {
        if (!this.currentMap) return;
        
        this.currentMap.items.forEach(item => {
            if (item.collected) return;
            
            const screenX = item.x - this.camera.x;
            const screenY = item.y - this.camera.y;
            
            const floatY = Math.sin(Date.now() * 0.003 + item.id.charCodeAt(0)) * 5;
            
            switch (item.type) {
                case 'fragment':
                    this.renderFragment(screenX, screenY + floatY, item);
                    break;
                case 'wing':
                    this.renderWing(screenX, screenY + floatY, item);
                    break;
                case 'candle':
                    this.renderCandle(screenX, screenY, item);
                    break;
            }
        });
    }
    
    renderFragment(x, y, item) {
        const time = Date.now() * 0.002;
        const rotation = time + item.id.charCodeAt(0);
        
        this.renderer.drawGlow(x, y, 40, '#ffd700', 0.6);
        
        const ctx = this.renderer.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        const gradient = ctx.createLinearGradient(-10, -10, 10, 10);
        gradient.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 80, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 180, 60, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = i % 2 === 0 ? 12 : 6;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    renderWing(x, y, item) {
        this.renderer.drawGlow(x, y, 50, '#00ffff', 0.7);
        
        const ctx = this.renderer.ctx;
        const time = Date.now() * 0.003;
        
        ctx.save();
        ctx.translate(x, y);
        
        const gradient = ctx.createLinearGradient(-15, -10, 15, 10);
        gradient.addColorStop(0, 'rgba(100, 240, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(150, 250, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(200, 255, 255, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.quadraticCurveTo(20, -5, 15, 10);
        ctx.quadraticCurveTo(0, 5, -15, 10);
        ctx.quadraticCurveTo(-20, -5, 0, -15);
        ctx.fill();
        
        ctx.rotate(time);
        ctx.strokeStyle = 'rgba(200, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderCandle(x, y, item) {
        const ctx = this.renderer.ctx;
        const flicker = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        
        this.renderer.drawGlow(x, y - 15, 30 * flicker, '#ff6600', 0.5);
        
        const candleGradient = ctx.createLinearGradient(x - 6, y - 25, x + 6, y);
        candleGradient.addColorStop(0, 'rgba(139, 90, 43, 0.9)');
        candleGradient.addColorStop(1, 'rgba(160, 110, 60, 0.8)');
        
        ctx.fillStyle = candleGradient;
        ctx.beginPath();
        ctx.roundRect(x - 6, y - 25, 12, 25, 3);
        ctx.fill();
        
        const flameGradient = ctx.createRadialGradient(x, y - 28, 0, x, y - 28, 8);
        flameGradient.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
        flameGradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.8)');
        flameGradient.addColorStop(0.7, 'rgba(255, 100, 50, 0.5)');
        flameGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.ellipse(x, y - 28, 5 * flicker, 10 * flicker, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderPlayer() {
        const p = this.player;
        const screenX = p.x - this.camera.x;
        const screenY = p.y - this.camera.y;
        
        this.renderer.drawGlow(screenX, screenY - 10, 60, '#ffffaa', p.glowIntensity * 0.5);
        
        const ctx = this.renderer.ctx;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(p.facing, 1);
        
        const wingSpread = Math.sin(p.wingFrame) * 0.3 + 0.7;
        
        const wingGradient = ctx.createLinearGradient(-20, -10, -40, 10);
        wingGradient.addColorStop(0, 'rgba(255, 240, 200, 0.7)');
        wingGradient.addColorStop(0.5, 'rgba(255, 220, 150, 0.5)');
        wingGradient.addColorStop(1, 'rgba(255, 200, 100, 0.3)');
        
        ctx.fillStyle = wingGradient;
        ctx.beginPath();
        ctx.moveTo(-8, -5);
        ctx.quadraticCurveTo(-35 * wingSpread, -20, -45 * wingSpread, 5);
        ctx.quadraticCurveTo(-30 * wingSpread, 15, -8, 10);
        ctx.fill();
        
        const bodyGradient = ctx.createLinearGradient(0, -20, 0, 20);
        bodyGradient.addColorStop(0, 'rgba(255, 250, 240, 0.95)');
        bodyGradient.addColorStop(0.5, 'rgba(240, 240, 255, 0.9)');
        bodyGradient.addColorStop(1, 'rgba(230, 235, 250, 0.85)');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
        ctx.beginPath();
        ctx.arc(0, -12, 6, 0, Math.PI * 2);
        ctx.fill();
        
        const capeGradient = ctx.createLinearGradient(0, 5, 0, 30);
        capeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        capeGradient.addColorStop(0.5, 'rgba(255, 250, 240, 0.6)');
        capeGradient.addColorStop(1, 'rgba(255, 240, 220, 0.3)');
        
        ctx.fillStyle = capeGradient;
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.quadraticCurveTo(-12, 20, -10, 35);
        ctx.quadraticCurveTo(0, 38, 10, 35);
        ctx.quadraticCurveTo(12, 20, 8, 5);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderParticles() {
        this.particles.forEach(p => {
            const screenX = p.x - this.camera.x;
            const screenY = p.y - this.camera.y;
            
            this.renderer.drawParticle(
                screenX,
                screenY,
                p.size * p.life,
                p.color,
                p.life * 0.8
            );
        });
    }
    
    animate(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.animate(time));
    }
    
    onResize() {
        this.renderer.resize();
    }
}

class Map2D {
    constructor(game, name) {
        this.game = game;
        this.name = name;
        this.items = [];
        this.spawnX = 0;
        this.spawnY = 100;
        this.width = 3000;
        this.height = 1500;
        this.portal = null;
    }
    
    generateClouds() {
        return [];
    }
    
    getGroundY(x) {
        return 500;
    }
    
    render(renderer, camera) {
        renderer.clear(this.backgroundColor);
    }
}

class DawnMap2D extends Map2D {
    constructor(game) {
        super(game, 'dawn');
        this.spawnX = 100;
        this.spawnY = 300;
        this.backgroundColor = '#2d3561';
        this.groundColor = '#d4a574';
        this.items = this.generateItems();
        this.portal = {
            x: 2200,
            y: 350,
            unlocked: false
        };
    }
    
    generateItems() {
        const items = [];
        
        for (let i = 0; i < 20; i++) {
            items.push({
                id: `dawn_fragment_${i}`,
                type: 'fragment',
                x: 200 + Math.random() * 2000,
                y: 200 + Math.random() * 400,
                collected: this.game.gameState.collectedItems.has(`dawn_fragment_${i}`)
            });
        }
        
        items.push({
            id: 'dawn_wing_1',
            type: 'wing',
            x: 800,
            y: 250,
            collected: this.game.gameState.collectedItems.has('dawn_wing_1')
        });
        
        for (let i = 0; i < 5; i++) {
            items.push({
                id: `dawn_candle_${i}`,
                type: 'candle',
                x: 300 + Math.random() * 1500,
                y: 420,
                collected: this.game.gameState.collectedItems.has(`dawn_candle_${i}`)
            });
        }
        
        return items;
    }
    
    generateClouds() {
        const clouds = [];
        for (let i = 0; i < 15; i++) {
            clouds.push({
                x: Math.random() * 3000,
                y: 50 + Math.random() * 200,
                size: 80 + Math.random() * 120,
                vx: 5 + Math.random() * 10,
                color: '#ffd4a3',
                alpha: 0.15 + Math.random() * 0.1,
                offset: Math.random() * Math.PI * 2
            });
        }
        return clouds;
    }
    
    getGroundY(x) {
        return 450 + Math.sin(x * 0.002) * 30 + Math.sin(x * 0.005) * 15;
    }
    
    render(renderer, camera) {
        const ctx = renderer.ctx;
        const width = renderer.width;
        const height = renderer.height;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#1a1a3e');
        skyGradient.addColorStop(0.3, '#3d4a7a');
        skyGradient.addColorStop(0.6, '#6a7aaa');
        skyGradient.addColorStop(1, '#ffcc99');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);
        
        for (let i = 0; i < 5; i++) {
            const mountainX = i * 400 - (camera.x * 0.2) % 400;
            const mountainH = 200 + Math.sin(i * 1.5) * 50;
            
            const mountainGradient = ctx.createLinearGradient(0, height - mountainH - 100, 0, height);
            mountainGradient.addColorStop(0, 'rgba(100, 80, 120, 0.4)');
            mountainGradient.addColorStop(1, 'rgba(60, 50, 80, 0.6)');
            
            ctx.fillStyle = mountainGradient;
            ctx.beginPath();
            ctx.moveTo(mountainX - 200, height);
            ctx.lineTo(mountainX, height - mountainH - 100);
            ctx.lineTo(mountainX + 200, height);
            ctx.fill();
        }
        
        const groundY = this.getGroundY(camera.x + width / 2);
        
        const groundGradient = ctx.createLinearGradient(0, height - 200, 0, height);
        groundGradient.addColorStop(0, 'rgba(212, 165, 116, 0.9)');
        groundGradient.addColorStop(0.5, 'rgba(180, 140, 100, 0.95)');
        groundGradient.addColorStop(1, 'rgba(150, 120, 90, 1)');
        
        ctx.fillStyle = groundGradient;
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let x = 0; x <= width; x += 20) {
            const worldX = camera.x + x;
            const y = this.getGroundY(worldX) - camera.y;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        
        for (let i = 0; i < 10; i++) {
            const rockX = (i * 300 + 150 - camera.x * 0.8) % (width + 200) - 100;
            const rockY = height - 80 + Math.sin(i * 2) * 20;
            
            renderer.drawWatercolorBlob(rockX, rockY, 30 + Math.random() * 20, '#8b7355', 0.6);
        }
    }
}

class CloudMap2D extends Map2D {
    constructor(game) {
        super(game, 'cloud');
        this.spawnX = 100;
        this.spawnY = 200;
        this.backgroundColor = '#4a5a8a';
        this.items = this.generateItems();
        this.portal = {
            x: 2600,
            y: 250,
            unlocked: false
        };
    }
    
    generateItems() {
        const items = [];
        
        for (let i = 0; i < 35; i++) {
            items.push({
                id: `cloud_fragment_${i}`,
                type: 'fragment',
                x: 200 + Math.random() * 2500,
                y: 150 + Math.random() * 500,
                collected: this.game.gameState.collectedItems.has(`cloud_fragment_${i}`)
            });
        }
        
        items.push({
            id: 'cloud_wing_1',
            type: 'wing',
            x: 600,
            y: 180,
            collected: this.game.gameState.collectedItems.has('cloud_wing_1')
        });
        
        items.push({
            id: 'cloud_wing_2',
            type: 'wing',
            x: 1800,
            y: 220,
            collected: this.game.gameState.collectedItems.has('cloud_wing_2')
        });
        
        for (let i = 0; i < 8; i++) {
            items.push({
                id: `cloud_candle_${i}`,
                type: 'candle',
                x: 400 + i * 300,
                y: 350,
                collected: this.game.gameState.collectedItems.has(`cloud_candle_${i}`)
            });
        }
        
        return items;
    }
    
    generateClouds() {
        const clouds = [];
        for (let i = 0; i < 25; i++) {
            clouds.push({
                x: Math.random() * 3000,
                y: 30 + Math.random() * 300,
                size: 100 + Math.random() * 150,
                vx: 8 + Math.random() * 12,
                color: '#ffffff',
                alpha: 0.2 + Math.random() * 0.15,
                offset: Math.random() * Math.PI * 2
            });
        }
        return clouds;
    }
    
    getGroundY(x) {
        return 600;
    }
    
    render(renderer, camera) {
        const ctx = renderer.ctx;
        const width = renderer.width;
        const height = renderer.height;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#4a5a8a');
        skyGradient.addColorStop(0.4, '#7a9aba');
        skyGradient.addColorStop(0.8, '#b8d4e8');
        skyGradient.addColorStop(1, '#e8f4ff');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);
        
        for (let i = 0; i < 8; i++) {
            const islandX = (i * 500 + 200 - camera.x * 0.3) % (width + 600) - 300;
            const islandY = height - 150 + Math.sin(i * 1.2) * 30;
            
            renderer.drawWatercolorBlob(islandX, islandY, 80, '#a8c8e8', 0.5);
            renderer.drawWatercolorBlob(islandX, islandY - 20, 60, '#c8e8f8', 0.4);
            
            ctx.fillStyle = 'rgba(144, 238, 144, 0.4)';
            ctx.beginPath();
            ctx.ellipse(islandX, islandY - 30, 50, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const cloudBaseGradient = ctx.createLinearGradient(0, height - 100, 0, height);
        cloudBaseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        cloudBaseGradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
        
        ctx.fillStyle = cloudBaseGradient;
        ctx.fillRect(0, height - 100, width, 100);
    }
}

class RainMap2D extends Map2D {
    constructor(game) {
        super(game, 'rain');
        this.spawnX = 100;
        this.spawnY = 300;
        this.backgroundColor = '#1a2a1a';
        this.items = this.generateItems();
        this.portal = null;
        this.raindrops = [];
        
        for (let i = 0; i < 100; i++) {
            this.raindrops.push({
                x: Math.random() * 3000,
                y: Math.random() * 800,
                speed: 300 + Math.random() * 200,
                length: 10 + Math.random() * 15
            });
        }
    }
    
    generateItems() {
        const items = [];
        
        for (let i = 0; i < 45; i++) {
            items.push({
                id: `rain_fragment_${i}`,
                type: 'fragment',
                x: 200 + Math.random() * 2500,
                y: 200 + Math.random() * 400,
                collected: this.game.gameState.collectedItems.has(`rain_fragment_${i}`)
            });
        }
        
        items.push({
            id: 'rain_wing_1',
            type: 'wing',
            x: 1200,
            y: 250,
            collected: this.game.gameState.collectedItems.has('rain_wing_1')
        });
        
        items.push({
            id: 'rain_wing_2',
            type: 'wing',
            x: 2200,
            y: 200,
            collected: this.game.gameState.collectedItems.has('rain_wing_2')
        });
        
        for (let i = 0; i < 10; i++) {
            items.push({
                id: `rain_candle_${i}`,
                type: 'candle',
                x: 300 + Math.random() * 2200,
                y: 400,
                collected: this.game.gameState.collectedItems.has(`rain_candle_${i}`)
            });
        }
        
        return items;
    }
    
    generateClouds() {
        const clouds = [];
        for (let i = 0; i < 20; i++) {
            clouds.push({
                x: Math.random() * 3000,
                y: 20 + Math.random() * 150,
                size: 120 + Math.random() * 100,
                vx: 3 + Math.random() * 5,
                color: '#a8d5ba',
                alpha: 0.1 + Math.random() * 0.1,
                offset: Math.random() * Math.PI * 2
            });
        }
        return clouds;
    }
    
    getGroundY(x) {
        return 450 + Math.sin(x * 0.003) * 40;
    }
    
    render(renderer, camera) {
        const ctx = renderer.ctx;
        const width = renderer.width;
        const height = renderer.height;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#1a2a1a');
        skyGradient.addColorStop(0.4, '#2d4a3e');
        skyGradient.addColorStop(0.8, '#4a6a5a');
        skyGradient.addColorStop(1, '#6a8a7a');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(168, 213, 186, 0.3)';
        ctx.lineWidth = 1;
        
        this.raindrops.forEach(drop => {
            const screenX = drop.x - camera.x;
            const screenY = drop.y - camera.y;
            
            if (screenX > -10 && screenX < width + 10 && screenY > -20 && screenY < height) {
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX - 2, screenY + drop.length);
                ctx.stroke();
            }
            
            drop.y += drop.speed * 0.016;
            drop.x -= 20 * 0.016;
            
            if (drop.y > 800) {
                drop.y = -20;
                drop.x = camera.x + Math.random() * (width + 200);
            }
        });
        
        for (let i = 0; i < 15; i++) {
            const treeX = (i * 250 + 100 - camera.x * 0.5) % (width + 300) - 150;
            const treeY = height - 100 + Math.sin(i * 2) * 30;
            
            ctx.fillStyle = 'rgba(74, 90, 70, 0.8)';
            ctx.fillRect(treeX - 8, treeY - 80, 16, 80);
            
            renderer.drawWatercolorBlob(treeX, treeY - 100, 50, '#2d5a3d', 0.7);
            renderer.drawWatercolorBlob(treeX - 20, treeY - 90, 35, '#3d6a4d', 0.5);
            renderer.drawWatercolorBlob(treeX + 20, treeY - 90, 35, '#3d6a4d', 0.5);
        }
        
        const groundY = this.getGroundY(camera.x + width / 2);
        
        const groundGradient = ctx.createLinearGradient(0, height - 200, 0, height);
        groundGradient.addColorStop(0, 'rgba(61, 92, 72, 0.9)');
        groundGradient.addColorStop(0.5, 'rgba(45, 74, 62, 0.95)');
        groundGradient.addColorStop(1, 'rgba(35, 60, 52, 1)');
        
        ctx.fillStyle = groundGradient;
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let x = 0; x <= width; x += 20) {
            const worldX = camera.x + x;
            const y = this.getGroundY(worldX) - camera.y;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const mistX = (i * 400 + camera.x * 0.1) % (width + 200) - 100;
            const mistY = height - 150 + Math.sin(i + Date.now() * 0.001) * 20;
            
            renderer.drawSoftCircle(mistX, mistY, 150, '#a8d5ba', 0.15);
        }
    }
}

const game = new CloudLightGame();
