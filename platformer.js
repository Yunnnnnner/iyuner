class WatercolorRenderer {
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
            imageData.data[i + 3] = 20;
        }
        ctx.putImageData(imageData, 0, 0);
    }
    
    clear(color = '#87CEEB') {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#a8d8ea');
        gradient.addColorStop(0.5, '#d4f1f4');
        gradient.addColorStop(1, '#f7f9fc');
        this.ctx.fillStyle = gradient;
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
    
    drawPlatform(x, y, width, height, color) {
        const ctx = this.ctx;
        
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, this.hexToRgba(color, 0.9));
        gradient.addColorStop(0.5, this.hexToRgba(color, 0.7));
        gradient.addColorStop(1, this.hexToRgba(color, 0.5));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        
        ctx.strokeStyle = this.hexToRgba(color, 0.8);
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = this.hexToRgba('#ffffff', 0.3);
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 5, width - 10, height / 3, 5);
        ctx.fill();
    }
    
    drawCloudPlatform(x, y, width, height) {
        const ctx = this.ctx;
        
        this.drawWatercolorBlob(x + width / 2, y + height / 2, width / 2, '#ffffff', 0.8);
        this.drawWatercolorBlob(x + width * 0.3, y + height * 0.4, width * 0.25, '#e8f4ff', 0.6);
        this.drawWatercolorBlob(x + width * 0.7, y + height * 0.5, width * 0.2, '#d4f1f4', 0.5);
    }
    
    drawPlayer(x, y, width, height, facing, isJumping, frame) {
        const ctx = this.ctx;
        const s = width / 36; // 缩放比例（36是默认尺寸）
        
        this.drawGlow(x + width / 2, y + height / 2, 40 * s, '#ffd700', 0.4);
        
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.scale(facing * s, s);
        
        const floatY = Math.sin(frame * 0.1) * 2;
        
        const bodyGradient = ctx.createRadialGradient(0, floatY, 0, 0, floatY, 20);
        bodyGradient.addColorStop(0, 'rgba(255, 250, 240, 0.95)');
        bodyGradient.addColorStop(0.5, 'rgba(255, 240, 220, 0.9)');
        bodyGradient.addColorStop(1, 'rgba(255, 230, 200, 0.8)');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(0, floatY, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
        ctx.beginPath();
        ctx.arc(-5, floatY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        if (!isJumping) {
            const wingOffset = Math.sin(frame * 0.2) * 5;
            ctx.fillStyle = 'rgba(255, 240, 200, 0.7)';
            ctx.beginPath();
            ctx.ellipse(-15, floatY + wingOffset, 8, 15, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(15, floatY - wingOffset, 8, 15, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawEnemy(x, y, type, frame) {
        const ctx = this.ctx;
        
        if (type === 'ink') {
            const wobble = Math.sin(frame * 0.02) * 0.6;
            this.drawWatercolorBlob(x + 20, y + 20 + wobble, 20, '#4a4a6a', 0.8);
            this.drawWatercolorBlob(x + 15, y + 15 + wobble, 8, '#2a2a4a', 0.9);
            this.drawWatercolorBlob(x + 25, y + 15 + wobble, 8, '#2a2a4a', 0.9);
        } else if (type === 'mist') {
            const drift = Math.sin(frame * 0.01) * 1;
            this.drawSoftCircle(x + 25 + drift, y + 25, 25, '#a8c8e8', 0.6);
            this.drawSoftCircle(x + 20 + drift, y + 20, 15, '#d4e8f4', 0.5);
        } else if (type === 'bomb') {
            // 炸弹怪 - 红色圆形，带闪烁效果
            const pulse = 1 + Math.sin(frame * 0.1) * 0.1;
            const wobble = Math.sin(frame * 0.02) * 0.6;
            
            // 外圈发光
            this.drawGlow(x + 20, y + 20 + wobble, 25 * pulse, '#ff4444', 0.6);
            
            // 炸弹主体
            this.drawWatercolorBlob(x + 20, y + 20 + wobble, 18, '#cc3333', 0.85);
            
            // 闪烁的眼睛
            ctx.fillStyle = `rgba(255, 200, 100, ${0.8 + Math.sin(frame * 0.15) * 0.2})`;
            ctx.beginPath();
            ctx.arc(x + 15, y + 18 + wobble, 3, 0, Math.PI * 2);
            ctx.arc(x + 25, y + 18 + wobble, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 导火索
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 20, y + 5 + wobble);
            ctx.quadraticCurveTo(x + 25, y - 5 + wobble, x + 28, y - 8 + wobble);
            ctx.stroke();
            
            // 火花
            if (Math.sin(frame * 0.2) > 0) {
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(x + 28, y - 8 + wobble, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'flying') {
            // 飞行怪 - 在空中上下飞行
            const hoverY = Math.sin(frame * 0.05) * 10;
            this.drawWatercolorBlob(x + 20, y + 20 + hoverY, 18, '#6a4a8a', 0.8);
            // 翅膀
            ctx.fillStyle = 'rgba(200, 180, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(x + 8, y + 20 + hoverY, 10, 6, -0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 32, y + 20 + hoverY, 10, 6, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawObstacle(x, y, width, height, type) {
        const ctx = this.ctx;
        
        if (type === 'spike') {
            // 尖刺陷阱
            ctx.fillStyle = 'rgba(180, 100, 100, 0.8)';
            ctx.beginPath();
            ctx.moveTo(x, y + height);
            ctx.lineTo(x + width / 2, y);
            ctx.lineTo(x + width, y + height);
            ctx.closePath();
            ctx.fill();
        } else if (type === 'thorn') {
            // 荆棘
            ctx.fillStyle = 'rgba(139, 119, 101, 0.8)';
            for (let i = 0; i < 3; i++) {
                const tx = x + i * (width / 2);
                ctx.beginPath();
                ctx.moveTo(tx, y + height);
                ctx.lineTo(tx + width / 4, y);
                ctx.lineTo(tx + width / 2, y + height);
                ctx.fill();
            }
        }
    }
    
    drawPowerUp(x, y, type, frame) {
        const floatY = Math.sin(frame * 0.006) * 1;
        
        let color = '#ff66ff';
        let icon = '⚡';
        
        if (type === 'speed') {
            color = '#ffaa00';
            icon = '⚡';
        } else if (type === 'jump') {
            color = '#00ffaa';
            icon = '⬆';
        } else if (type === 'shield') {
            color = '#00aaff';
            icon = '🛡';
        } else if (type === 'life') {
            color = '#ff5555';
            icon = '❤';
        } else if (type === 'magnet') {
            color = '#aa55ff';
            icon = '🧲';
        } else if (type === 'big') {
            color = '#ff8800';
            icon = '🔼';
        } else if (type === 'freeze') {
            color = '#88ddff';
            icon = '❄';
        } else if (type === 'mini') {
            color = '#ff88cc';
            icon = '🔽';
        }
        
        this.drawGlow(x + 15, y + 15 + floatY, 25, color, 0.5);
        
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + 15, y + 15 + floatY, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // 外圈
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + 15, y + 15 + floatY);
    }
    
    drawCollectible(x, y, type, frame) {
        const floatY = Math.sin(frame * 0.006) * 1;
        
        if (type === 'star') {
            this.drawGlow(x, y + floatY, 30, '#ffd700', 0.6);
            
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(x, y + floatY);
            ctx.rotate(frame * 0.002);
            
            const gradient = ctx.createLinearGradient(-10, -10, 10, 10);
            gradient.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 200, 80, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 180, 60, 0.5)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const outerR = 12;
                const innerR = 5;
                const outerX = Math.cos(angle) * outerR;
                const outerY = Math.sin(angle) * outerR;
                const innerAngle = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
                const innerX = Math.cos(innerAngle) * innerR;
                const innerY = Math.sin(innerAngle) * innerR;
                
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (type === 'feather') {
            // 更轻柔飘逸的羽毛效果
            const swayX = Math.sin(frame * 0.03) * 3;
            const swayY = Math.cos(frame * 0.025) * 2;
            const rotation = Math.sin(frame * 0.02) * 0.15;
            
            this.drawGlow(x + swayX, y + floatY + swayY, 35, '#a0f0ff', 0.4);
            
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(x + swayX, y + floatY + swayY);
            ctx.rotate(rotation);
            
            // 羽毛主体 - 更轻盈飘逸的形状
            const gradient = ctx.createLinearGradient(-8, -20, 8, 18);
            gradient.addColorStop(0, 'rgba(200, 250, 255, 0.85)');
            gradient.addColorStop(0.3, 'rgba(150, 235, 255, 0.75)');
            gradient.addColorStop(0.7, 'rgba(100, 215, 245, 0.65)');
            gradient.addColorStop(1, 'rgba(80, 195, 235, 0.55)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            // 羽毛尖端 - 更细长
            ctx.moveTo(0, -22);
            ctx.bezierCurveTo(5, -16, 7, -8, 6, 0);
            // 羽毛右侧 - 柔和曲线
            ctx.bezierCurveTo(5, 8, 4, 14, 2, 18);
            // 羽毛底部 - 轻盈散开
            ctx.bezierCurveTo(1, 16, 0, 15, 0, 14);
            ctx.bezierCurveTo(0, 15, -1, 16, -2, 18);
            // 羽毛左侧
            ctx.bezierCurveTo(-4, 14, -5, 8, -6, 0);
            ctx.bezierCurveTo(-7, -8, -5, -16, 0, -22);
            ctx.fill();
            
            // 羽毛中心线 - 更细更淡
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.quadraticCurveTo(1, -5, 0, 12);
            ctx.stroke();
            
            // 羽毛纹理 - 更细腻的羽枝效果
            ctx.strokeStyle = 'rgba(220, 250, 255, 0.35)';
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 6; i++) {
                const ty = -15 + i * 5;
                const length = 4 + Math.sin(i * 0.5) * 2;
                // 右侧羽枝
                ctx.beginPath();
                ctx.moveTo(0, ty);
                ctx.quadraticCurveTo(length * 0.7, ty - 3, length, ty - 1);
                ctx.stroke();
                // 左侧羽枝
                ctx.beginPath();
                ctx.moveTo(0, ty);
                ctx.quadraticCurveTo(-length * 0.7, ty - 3, -length, ty - 1);
                ctx.stroke();
            }
            
            // 添加飘动的光点效果
            const sparkleY = Math.sin(frame * 0.05) * 8;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(3, -5 + sparkleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    drawGoal(x, y, height, frame) {
        const ctx = this.ctx;
        const sway = Math.sin(frame * 0.03) * 3;
        const balloonY = y + 40;
        const stringLength = height - 80;
        
        // 绘制气球线
        ctx.strokeStyle = 'rgba(200, 180, 160, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + sway, balloonY);
        // 线随风轻微摆动
        for (let i = 0; i <= 10; i++) {
            const lineY = balloonY + (stringLength * i) / 10;
            const lineSway = sway * (1 - i / 10) * 0.5;
            ctx.lineTo(x + lineSway, lineY);
        }
        ctx.stroke();
        
        // 气球主体
        const gradient = ctx.createRadialGradient(
            x + sway - 15, balloonY - 15, 0,
            x + sway, balloonY, 40
        );
        gradient.addColorStop(0, 'rgba(255, 150, 150, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 100, 100, 0.85)');
        gradient.addColorStop(0.8, 'rgba(220, 80, 80, 0.8)');
        gradient.addColorStop(1, 'rgba(180, 60, 60, 0.7)');
        
        // 气球发光效果
        this.drawGlow(x + sway, balloonY, 50, '#ff6666', 0.4);
        
        // 气球主体
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x + sway, balloonY, 35, 42, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 气球高光
        ctx.fillStyle = 'rgba(255, 220, 220, 0.6)';
        ctx.beginPath();
        ctx.ellipse(x + sway - 12, balloonY - 15, 10, 15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 气球底部小结
        ctx.fillStyle = 'rgba(220, 80, 80, 0.9)';
        ctx.beginPath();
        ctx.moveTo(x + sway - 5, balloonY + 40);
        ctx.lineTo(x + sway + 5, balloonY + 40);
        ctx.lineTo(x + sway, balloonY + 48);
        ctx.fill();
        
        // 提示文字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px "Noto Serif SC"';
        ctx.textAlign = 'center';
        ctx.fillText('终点', x + sway, balloonY + 5);
    }
    
    drawBackgroundLayer(cameraX, parallaxFactor, color, heightOffset) {
        const ctx = this.ctx;
        const offsetX = -(cameraX * parallaxFactor) % this.width;
        
        for (let i = -1; i < 2; i++) {
            const x = offsetX + i * this.width;
            this.drawWatercolorBlob(
                x + this.width / 2,
                this.height - heightOffset,
                this.width * 0.6,
                color,
                0.3
            );
        }
    }
    
    hexToRgba(hex, alpha) {
        if (hex && hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // Handle rgba/rgb format strings (including incomplete ones like 'rgba(255, 200, 200,')
        if (hex) {
            const match = hex.match(/(\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
            }
        }
        return `rgba(0, 0, 0, ${alpha})`;
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
}

class PlatformerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new WatercolorRenderer(this.canvas);
        
        this.gameState = {
            isPlaying: false,
            currentLevel: 1,
            totalLevels: 3,
            stars: 0,
            lives: 5, // 初始生命值5
            score: 0,
            feathers: 0,
            timeLimit: 120, // 关卡时间限制（秒）
            timeRemaining: 120
        };
        
        this.camera = { x: 0, y: 0 };
        this.player = null;
        this.currentLevel = null;
        this.particles = [];
        
        this.input = {
            keys: {},
            left: false,
            right: false,
            jump: false,
            jumpPressed: false
        };
        
        this.lastTime = 0;
        this.frame = 0;
        
        this.gravity = 1000;
        this.jumpPower = 750;
        this.moveSpeed = 280;
        
        // Mario-style jump improvements
        this.coyoteTime = 0;        // 离开平台后仍可跳跃的宽限时间
        this.coyoteTimeMax = 0.08;  // 80ms
        this.jumpBufferTime = 0;    // 落地前提前按跳跃的缓冲时间
        this.jumpBufferMax = 0.1;   // 100ms
        this.stompCombo = 0;        // 连续踩踏敌人的连击计数
        this.stompComboTimer = 0;   // 连击计时器
        
        this.init();
    }
    
    init() {
        this.setupInput();
        this.setupUI();
        this.createPlayer();
        
        window.addEventListener('resize', () => this.onResize());
        
        this.animate(0);
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.input.keys[e.code] = true;
            
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (!this.input.jump) {
                    this.input.jumpPressed = true;
                }
                this.input.jump = true;
                e.preventDefault();
            }
            
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.input.left = true;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.input.right = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.input.keys[e.code] = false;
            
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.input.jump = false;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.input.left = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.input.right = false;
            }
        });
        
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        const leftBtn = document.getElementById('mobileLeft');
        const rightBtn = document.getElementById('mobileRight');
        const jumpBtn = document.getElementById('mobileJump');
        
        if (!leftBtn || window.innerWidth > 768) return;
        
        const addTouch = (btn, key) => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.input[key] = true;
                if (key === 'jump') {
                    this.input.jumpPressed = true;
                }
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.input[key] = false;
            });
        };
        
        addTouch(leftBtn, 'left');
        addTouch(rightBtn, 'right');
        addTouch(jumpBtn, 'jump');
    }
    
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.retryLevel();
        });
    }
    
    startGame() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('loading').style.display = 'flex';
        
        // 重置游戏状态
        this.gameState.lives = 5;
        this.gameState.score = 0;
        this.gameState.stars = 0;
        this.gameState.feathers = 0;
        this.gameState.currentLevel = 1;
        
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            this.gameState.isPlaying = true;
            this.loadLevel(1);
        }, 1000);
    }
    
    createPlayer() {
        this.player = {
            x: 100,
            y: 300,
            vx: 0,
            vy: 0,
            width: 36,
            height: 36,
            facing: 1,
            onGround: false,
            isJumping: false,
            invincible: 0,
            dead: false,
            magnet: false,
            doubleScore: false,
            freeze: false,
            onMovingPlatform: null,
            balloonRising: false
        };
    }
    
    loadLevel(levelNum) {
        this.gameState.currentLevel = levelNum;
        this.currentLevel = new Level(levelNum);

        this.player.x = this.currentLevel.spawnX;
        this.player.y = this.currentLevel.spawnY;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.dead = false;
        this.player.invincible = 0;
        this.player.onGround = false;
        this.player.isJumping = false;
        this.player.balloonRising = false;
        this.player.magnet = false;
        this.player.doubleScore = false;
        this.player.freeze = false;
        this.player.onMovingPlatform = null;
        this.player.width = 36;
        this.player.height = 36;

        // 设置关卡时间限制（后续关卡时间更紧）
        this.gameState.timeLimit = levelNum === 1 ? 150 : (levelNum === 2 ? 120 : 100);
        this.gameState.timeRemaining = this.gameState.timeLimit;

        // 重置帧计数器和粒子
        this.frame = 0;
        this.particles = [];

        // 重置移速和跳跃力（可能被道具改变）
        this.moveSpeed = 280;
        this.jumpPower = 750;

        this.camera.x = 0;
        this.camera.y = 0;

        this.updateUI();
    }
    
    nextLevel() {
        if (this.gameState.currentLevel < this.gameState.totalLevels) {
            document.getElementById('levelComplete').style.display = 'none';
            this.gameState.isPlaying = true;
            this.loadLevel(this.gameState.currentLevel + 1);
        } else {
            this.triggerGameComplete();
        }
    }
    
    retryLevel() {
        document.getElementById('gameOver').style.display = 'none';
        // 重置所有游戏状态
        this.gameState.lives = 5;
        this.gameState.score = 0;
        this.gameState.stars = 0;
        this.gameState.feathers = 0;
        this.gameState.currentLevel = 1;
        this.gameState.isPlaying = true;
        this.loadLevel(1);
    }
    
    update(deltaTime) {
        if (!this.gameState.isPlaying) return;

        this.frame++;

        // 气球上升状态：跳过正常游戏逻辑
        if (this.player.balloonRising) {
            this.updateBalloonRise(deltaTime);
            this.updateParticles(deltaTime);
            this.updateCamera();
            return;
        }

        // 时间倒计时
        this.gameState.timeRemaining -= deltaTime;
        if (this.gameState.timeRemaining <= 0) {
            this.gameState.timeRemaining = 0;
            this.playerDeath();
            this.showNotification('时间到！');
            return;
        }

        // 每秒钟更新一次UI
        if (Math.floor(this.frame / 60) !== Math.floor((this.frame - 1) / 60)) {
            this.updateUI();
        }

        if (!this.player.dead) {
            this.updatePlayer(deltaTime);
            this.updateEnemies(deltaTime);
            this.updateCollectibles(deltaTime);
            this.currentLevel.updateMovingPlatforms(deltaTime);
            this.checkCollisions(deltaTime);
            this.checkObstacles();
            this.checkPowerUps();
            this.checkGoal();
        }

        this.updateParticles(deltaTime);
        this.updateCamera();
    }
    
    updatePlayer(deltaTime) {
        const p = this.player;
        
        // Mario-style acceleration/deceleration
        if (this.input.left) {
            p.vx = -this.moveSpeed;
            p.facing = -1;
        } else if (this.input.right) {
            p.vx = this.moveSpeed;
            p.facing = 1;
        } else {
            p.vx *= 0.8;
        }
        
        // Coyote time: track time since last on ground
        if (p.onGround) {
            this.coyoteTime = this.coyoteTimeMax;
        } else {
            this.coyoteTime -= deltaTime;
        }
        
        // Jump buffer: remember jump press
        if (this.input.jumpPressed) {
            this.jumpBufferTime = this.jumpBufferMax;
        }
        this.input.jumpPressed = false;
        this.jumpBufferTime -= deltaTime;
        
        // Stomp combo timer
        if (this.stompComboTimer > 0) {
            this.stompComboTimer -= deltaTime;
            if (this.stompComboTimer <= 0) {
                this.stompCombo = 0;
            }
        }
        
        // Jump: use coyote time + jump buffer for responsive Mario-style jumping
        const canJump = p.onGround || this.coyoteTime > 0;
        if (this.jumpBufferTime > 0 && canJump) {
            p.vy = -this.jumpPower;
            p.onGround = false;
            p.isJumping = true;
            this.coyoteTime = 0;
            this.jumpBufferTime = 0;
            this.createJumpParticles(p.x + p.width / 2, p.y + p.height);
        }
        
        // Variable jump height: release jump key to cut jump short
        if (!this.input.jump && p.vy < 0) {
            p.vy *= 0.8;
        }
        
        p.vy += this.gravity * deltaTime;
        
        // 如果站在移动平台上，跟随平台移动
        if (p.onMovingPlatform && p.onGround) {
            if (p.onMovingPlatform.axis === 'x') {
                p.x += p.onMovingPlatform.speed * p.onMovingPlatform.direction * deltaTime;
            } else {
                p.y += p.onMovingPlatform.speed * p.onMovingPlatform.direction * deltaTime;
            }
        }
        
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        
        // 重置移动平台状态
        p.onMovingPlatform = null;
        
        if (p.invincible > 0) {
            p.invincible -= deltaTime;
        }
        
        if (p.y > this.currentLevel.height + 200) {
            this.playerDeath();
        }
    }
    
    updateEnemies(deltaTime) {
        if (!this.currentLevel) return;
        
        // 冰冻效果：敌人停止移动
        if (this.player.freeze) {
            this.currentLevel.enemies.forEach(enemy => {
                enemy.frame += 1;
            });
            return;
        }
        
        this.currentLevel.enemies.forEach(enemy => {
            enemy.x += enemy.vx * deltaTime;
            
            // 飞行怪特殊处理：水平+垂直移动，大范围飞行
            if (enemy.type === 'flying' && enemy.flyOriginX !== undefined) {
                enemy.y += (enemy.vy || 0) * deltaTime;
                
                // 水平飞行范围限制
                if (Math.abs(enemy.x - enemy.flyOriginX) > enemy.flyRange) {
                    enemy.vx *= -1;
                    enemy.x = enemy.flyOriginX + Math.sign(enemy.x - enemy.flyOriginX) * enemy.flyRange;
                }
                // 垂直飞行范围限制
                if (Math.abs(enemy.y - enemy.flyOriginY) > enemy.flyRange * 0.6) {
                    enemy.vy *= -1;
                    enemy.y = enemy.flyOriginY + Math.sign(enemy.y - enemy.flyOriginY) * enemy.flyRange * 0.6;
                }
                // 不飞出屏幕
                if (enemy.y < 50) { enemy.y = 50; enemy.vy = Math.abs(enemy.vy); }
                if (enemy.y > 700) { enemy.y = 700; enemy.vy = -Math.abs(enemy.vy); }
                
                enemy.frame += 1;
                return;
            }
            
            // 如果敌人有所属平台，限制在平台范围内巡逻
            if (enemy.platform) {
                const platformLeft = enemy.platform.x;
                const platformRight = enemy.platform.x + enemy.platform.width;
                
                if (enemy.x <= platformLeft + 10) {
                    enemy.x = platformLeft + 10;
                    enemy.vx = Math.abs(enemy.vx);
                } else if (enemy.x + enemy.width >= platformRight - 10) {
                    enemy.x = platformRight - 10 - enemy.width;
                    enemy.vx = -Math.abs(enemy.vx);
                }
            } else {
                enemy.patrolTimer += deltaTime;
                if (enemy.patrolTimer > enemy.patrolDuration) {
                    enemy.vx *= -1;
                    enemy.patrolTimer = 0;
                }
            }
            
            enemy.frame += 1;
        });
    }
    
    updateCollectibles(deltaTime) {
        if (!this.currentLevel) return;
        
        const p = this.player;
        
        this.currentLevel.collectibles.forEach(item => {
            if (!item.collected) {
                item.frame += 1;
                
                // 磁铁效果：吸引星星和羽毛 - 范围增加到250
                if (p.magnet && (item.type === 'star' || item.type === 'feather')) {
                    const dx = (p.x + p.width / 2) - item.x;
                    const dy = (p.y + p.height / 2) - item.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 250 && dist > 10) {
                        item.x += (dx / dist) * 300 * deltaTime;
                        item.y += (dy / dist) * 300 * deltaTime;
                    }
                }
            }
        });
    }
    
    checkCollisions(deltaTime) {
        const p = this.player;
        p.onGround = false;
        
        this.currentLevel.platforms.forEach(platform => {
            if (this.rectIntersect(p.x, p.y, p.width, p.height,
                                   platform.x, platform.y, platform.width, platform.height)) {
                
                const overlapX = (p.x + p.width / 2) - (platform.x + platform.width / 2);
                const overlapY = (p.y + p.height / 2) - (platform.y + platform.height / 2);
                
                const combinedHalfWidths = p.width / 2 + platform.width / 2;
                const combinedHalfHeights = p.height / 2 + platform.height / 2;
                
                const overlapDepthX = combinedHalfWidths - Math.abs(overlapX);
                const overlapDepthY = combinedHalfHeights - Math.abs(overlapY);
                
                if (overlapDepthX < overlapDepthY) {
                    if (overlapX > 0) {
                        p.x = platform.x + platform.width;
                    } else {
                        p.x = platform.x - p.width;
                    }
                    p.vx = 0;
                } else {
                    if (overlapY > 0) {
                        p.y = platform.y + platform.height;
                        p.vy = 0;
                    } else {
                        p.y = platform.y - p.height;
                        p.vy = 0;
                        p.onGround = true;
                        p.isJumping = false;
                        
                        // 如果站在移动平台上，跟随平台移动
                        if (platform.type === 'moving') {
                            p.onMovingPlatform = platform;
                        }
                    }
                }
            }
        });
        
        this.currentLevel.enemies.forEach(enemy => {
            if (this.rectIntersect(p.x, p.y, p.width, p.height,
                                   enemy.x, enemy.y, enemy.width, enemy.height)) {
                
                // 炸弹怪 - 接触即爆炸，爆炸后消失
                if (enemy.type === 'bomb') {
                    if (!enemy.exploded) {
                        enemy.exploded = true;
                        this.createExplosionEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        if (p.invincible <= 0) {
                            this.playerHit();
                        }
                        // 爆炸后敌人消失
                        enemy.dead = true;
                    }
                } else if (p.vy > 0 && p.y + p.height - p.vy * deltaTime < enemy.y + enemy.height / 2) {
                    enemy.dead = true;
                    p.vy = -this.jumpPower * 0.75;
                    // Mario-style stomp combo: consecutive stomps give increasing score
                    this.stompCombo++;
                    this.stompComboTimer = 2.0;
                    const comboScore = 100 * this.stompCombo;
                    this.gameState.score += comboScore;
                    if (this.stompCombo > 1) {
                        this.showNotification(`${this.stompCombo}连击！+${comboScore}`);
                    }
                    this.createEnemyDefeatParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                } else if (p.invincible <= 0) {
                    this.playerHit();
                }
            }
        });
        
        this.currentLevel.enemies = this.currentLevel.enemies.filter(e => !e.dead);
        
        this.currentLevel.collectibles.forEach(item => {
            if (!item.collected && this.rectIntersect(p.x, p.y, p.width, p.height,
                                                       item.x - 15, item.y - 15, 30, 30)) {
                item.collected = true;
                
                // 双倍分数效果
                const scoreMultiplier = p.doubleScore ? 2 : 1;
                
                if (item.type === 'star') {
                    this.gameState.stars++;
                    this.gameState.score += 50 * scoreMultiplier;
                    this.createCollectParticles(item.x, item.y, '#ffd700');
                } else if (item.type === 'feather') {
                    this.gameState.feathers++;
                    // 羽毛恢复1/3生命值（向上取整）
                    const healAmount = Math.ceil(5 / 3);
                    this.gameState.lives = Math.min(5, this.gameState.lives + healAmount);
                    this.gameState.score += 200 * scoreMultiplier;
                    this.createCollectParticles(item.x, item.y, '#00ffff');
                    this.showNotification('恢复生命！');
                }
                
                this.updateUI();
            }
        });
    }
    
    checkGoal() {
        const p = this.player;
        const goal = this.currentLevel.goal;
        
        if (!this.player.balloonRising && this.rectIntersect(p.x, p.y, p.width, p.height,
                               goal.x - 40, goal.y, 80, goal.height)) {
            this.startBalloonRise();
        }
    }
    
    startBalloonRise() {
        // 开始气球上升特效（动画在update中处理）
        this.player.balloonRising = true;
        this.showNotification('🎈 气球带你飞向下一关！');
    }
    
    updateBalloonRise(deltaTime) {
        const p = this.player;
        // 平滑上升（约480px/s）
        p.y -= 480 * deltaTime;
        p.vx = 0;
        p.vy = 0;
        
        // 创建上升粒子效果
        if (Math.random() < 0.3) {
            this.particles.push({
                x: p.x + p.width / 2 + (Math.random() - 0.5) * 30,
                y: p.y + p.height,
                vx: (Math.random() - 0.5) * 50,
                vy: -50 - Math.random() * 50,
                life: 0.8,
                decay: 1.5,
                size: 3 + Math.random() * 4,
                color: '#ffc8c8',
                type: 'normal'
            });
        }
        
        // 当玩家飞出屏幕上方，进入下一关
        if (p.y < -100) {
            p.balloonRising = false;
            this.levelComplete();
        }
    }
    
    checkObstacles() {
        const p = this.player;
        
        this.currentLevel.obstacles.forEach(obstacle => {
            if (this.rectIntersect(p.x, p.y, p.width, p.height,
                                   obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
                if (p.invincible <= 0) {
                    this.playerHit();
                }
            }
        });
    }
    
    checkPowerUps() {
        const p = this.player;
        
        this.currentLevel.powerUps.forEach(powerUp => {
            if (!powerUp.collected && this.rectIntersect(p.x, p.y, p.width, p.height,
                                                          powerUp.x, powerUp.y, powerUp.width, powerUp.height)) {
                powerUp.collected = true;
                this.applyPowerUp(powerUp.type);
                this.createCollectParticles(powerUp.x + 15, powerUp.y + 15, '#ff66ff');
            }
        });
    }
    
    applyPowerUp(type) {
        switch(type) {
            case 'speed':
                this.moveSpeed = 400;
                setTimeout(() => { this.moveSpeed = 280; }, 15000);
                this.showNotification('速度提升！(15秒)');
                break;
            case 'jump':
                this.jumpPower = 950;
                setTimeout(() => { this.jumpPower = 750; }, 15000);
                this.showNotification('超级跳跃！(15秒)');
                break;
            case 'shield':
                this.player.invincible = 15;
                this.showNotification('无敌护盾！(15秒)');
                break;
            case 'life':
                this.gameState.lives = Math.min(5, this.gameState.lives + 1);
                this.showNotification('生命+1！');
                break;
            case 'magnet':
                this.player.magnet = true;
                setTimeout(() => { this.player.magnet = false; }, 15000);
                this.showNotification('磁铁吸引！(15秒)');
                break;
            case 'big':
                this.player.width = 108;
                this.player.height = 108;
                setTimeout(() => { 
                    this.player.width = 36;
                    this.player.height = 36;
                }, 15000);
                this.showNotification('3倍变大！(15秒)');
                break;
            case 'freeze':
                this.player.freeze = true;
                setTimeout(() => { this.player.freeze = false; }, 15000);
                this.showNotification('冰冻敌人！(15秒)');
                break;
            case 'mini':
                this.player.width = 12;
                this.player.height = 12;
                setTimeout(() => { 
                    this.player.width = 36;
                    this.player.height = 36;
                }, 15000);
                this.showNotification('3倍变小！(15秒)');
                break;
        }
        this.gameState.score += 50;
        this.updateUI();
    }
    
    showNotification(text) {
        // 简单的通知显示
        const notif = document.createElement('div');
        notif.textContent = text;
        notif.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 15px 30px;
            border-radius: 25px;
            color: #4a6a7a;
            font-size: 18px;
            z-index: 1000;
            animation: fadeOut 2s forwards;
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }
    
    createExplosionEffect(x, y) {
        // 创建爆炸粒子效果
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 100 + Math.random() * 150;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 1.5 + Math.random(),
                size: 8 + Math.random() * 8,
                color: '#ff' + Math.floor(100 + Math.random() * 100).toString(16).padStart(2, '0') + '32',
                type: 'explosion'
            });
        }
        
        // 添加冲击波效果
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                life: 0.5,
                decay: 1.0,
                size: 30 + i * 20,
                color: '#ff6432',
                type: 'shockwave'
            });
        }
        
        this.showNotification('💥 炸弹爆炸！');
    }
    
    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    playerHit() {
        this.player.invincible = 2;
        this.gameState.lives--;
        
        this.createHitParticles(this.player.x + this.player.width / 2, 
                                this.player.y + this.player.height / 2);
        
        if (this.gameState.lives <= 0) {
            this.playerDeath();
        } else {
            this.player.vy = -300;
            this.player.vx = this.player.facing * -200;
        }
        
        this.updateUI();
    }
    
    playerDeath() {
        this.player.dead = true;
        this.gameState.isPlaying = false;
        document.getElementById('finalScore').textContent = this.gameState.score;
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    levelComplete() {
        this.gameState.isPlaying = false;
        
        const starBonus = this.gameState.stars * 100;
        const timeBonus = Math.max(0, Math.floor(this.gameState.timeRemaining) * 10);
        this.gameState.score += starBonus + timeBonus;
        
        this.updateUI();
        
        // 直接跳转下一关，不显示中间界面
        if (this.gameState.currentLevel < this.gameState.totalLevels) {
            this.showNotification(`第${this.gameState.currentLevel}关完成！进入下一关...`);
            setTimeout(() => {
                this.gameState.isPlaying = true;
                this.loadLevel(this.gameState.currentLevel + 1);
            }, 1200);
        } else {
            this.triggerGameComplete();
        }
    }
    
    triggerGameComplete() {
        document.getElementById('levelComplete').style.display = 'none';
        document.getElementById('totalScore').textContent = this.gameState.score;
        document.getElementById('totalStars').textContent = this.gameState.stars;
        document.getElementById('gameComplete').style.display = 'flex';
    }
    
    updateCamera() {
        const targetX = this.player.x - this.renderer.width / 3;
        const targetY = this.player.y - this.renderer.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.currentLevel.width - this.renderer.width));
        this.camera.y = Math.max(-200, Math.min(this.camera.y, this.currentLevel.height - this.renderer.height));
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime * 2;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 200 * deltaTime;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    createJumpParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: -50 - Math.random() * 50,
                life: 0.5,
                color: '#ffffff',
                size: 3 + Math.random() * 3
            });
        }
    }
    
    createCollectParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100 - 50,
                life: 0.8,
                color: color,
                size: 4 + Math.random() * 3
            });
        }
    }
    
    createEnemyDefeatParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.6,
                color: '#4a4a6a',
                size: 5 + Math.random() * 5
            });
        }
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.4,
                color: '#ff6666',
                size: 4 + Math.random() * 4
            });
        }
    }
    
    render() {
        this.renderer.clear();
        
        if (this.currentLevel) {
            this.renderBackground();
            this.renderLevel();
            this.renderPlayer();
            this.renderParticles();
        }
        
        this.renderer.applyWatercolorEffect();
    }
    
    renderBackground() {
        this.renderer.drawBackgroundLayer(this.camera.x, 0.1, '#b8d4e8', 100);
        this.renderer.drawBackgroundLayer(this.camera.x, 0.3, '#d4e8f4', 200);
    }
    
    renderLevel() {
        const ctx = this.renderer.ctx;
        
        this.currentLevel.platforms.forEach(platform => {
            const screenX = platform.x - this.camera.x;
            const screenY = platform.y - this.camera.y;
            
            if (screenX + platform.width > 0 && screenX < this.renderer.width) {
                if (platform.type === 'cloud') {
                    this.renderer.drawCloudPlatform(screenX, screenY, platform.width, platform.height);
                } else {
                    this.renderer.drawPlatform(screenX, screenY, platform.width, platform.height, platform.color);
                }
            }
        });
        
        this.currentLevel.enemies.forEach(enemy => {
            const screenX = enemy.x - this.camera.x;
            const screenY = enemy.y - this.camera.y;
            
            if (screenX + enemy.width > 0 && screenX < this.renderer.width) {
                this.renderer.drawEnemy(screenX, screenY, enemy.type, enemy.frame);
            }
        });
        
        this.currentLevel.collectibles.forEach(item => {
            if (!item.collected) {
                const screenX = item.x - this.camera.x;
                const screenY = item.y - this.camera.y;
                
                if (screenX + 30 > 0 && screenX - 30 < this.renderer.width) {
                    this.renderer.drawCollectible(screenX, screenY, item.type, item.frame);
                }
            }
        });
        
        // 渲染障碍物
        this.currentLevel.obstacles.forEach(obstacle => {
            const screenX = obstacle.x - this.camera.x;
            const screenY = obstacle.y - this.camera.y;
            
            if (screenX + obstacle.width > 0 && screenX < this.renderer.width) {
                this.renderer.drawObstacle(screenX, screenY, obstacle.width, obstacle.height, obstacle.type);
            }
        });
        
        // 渲染道具
        this.currentLevel.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const screenX = powerUp.x - this.camera.x;
                const screenY = powerUp.y - this.camera.y;
                
                if (screenX + 30 > 0 && screenX - 30 < this.renderer.width) {
                    this.renderer.drawPowerUp(screenX, screenY, powerUp.type, powerUp.frame);
                }
            }
        });
        
        // 只有玩家不在气球上升状态时才渲染终点气球
        if (!this.player.balloonRising) {
            const goal = this.currentLevel.goal;
            const goalScreenX = goal.x - this.camera.x;
            const goalScreenY = goal.y - this.camera.y;
            
            if (goalScreenX + 60 > 0 && goalScreenX - 60 < this.renderer.width) {
                this.renderer.drawGoal(goalScreenX, goalScreenY, goal.height, this.frame);
            }
        }
    }
    
    renderPlayer() {
        const p = this.player;
        const screenX = p.x - this.camera.x;
        const screenY = p.y - this.camera.y;
        
        if (p.invincible > 0 && Math.floor(this.frame / 4) % 2 === 0) {
            return;
        }
        
        // 如果正在气球上升，绘制气球和线
        if (p.balloonRising) {
            const ctx = this.renderer.ctx;
            const sway = Math.sin(this.frame * 0.05) * 3;
            const balloonX = screenX + p.width / 2 + sway;
            const balloonY = screenY - 50;
            
            // 绘制线
            ctx.strokeStyle = 'rgba(200, 180, 160, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX + p.width / 2, screenY);
            ctx.lineTo(balloonX, balloonY + 40);
            ctx.stroke();
            
            // 绘制气球
            const gradient = ctx.createRadialGradient(
                balloonX - 10, balloonY - 10, 0,
                balloonX, balloonY, 30
            );
            gradient.addColorStop(0, 'rgba(255, 150, 150, 0.95)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 100, 0.9)');
            gradient.addColorStop(1, 'rgba(200, 60, 60, 0.8)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(balloonX, balloonY, 25, 32, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // 气球高光
            ctx.fillStyle = 'rgba(255, 220, 220, 0.7)';
            ctx.beginPath();
            ctx.ellipse(balloonX - 8, balloonY - 10, 8, 12, -0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // 气球底部小结
            ctx.fillStyle = 'rgba(200, 60, 60, 0.95)';
            ctx.beginPath();
            ctx.moveTo(balloonX - 4, balloonY + 30);
            ctx.lineTo(balloonX + 4, balloonY + 30);
            ctx.lineTo(balloonX, balloonY + 36);
            ctx.fill();
        }
        
        this.renderer.drawPlayer(screenX, screenY, p.width, p.height, 
                                 p.facing, p.isJumping, this.frame);
    }
    
    renderParticles() {
        this.particles.forEach(p => {
            const screenX = p.x - this.camera.x;
            const screenY = p.y - this.camera.y;
            
            this.renderer.drawSoftCircle(screenX, screenY, p.size * p.life, p.color, p.life);
        });
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('stars').textContent = this.gameState.stars;
        document.getElementById('level').textContent = this.gameState.currentLevel;
        document.getElementById('feathers').textContent = this.gameState.feathers;
        document.getElementById('time').textContent = Math.ceil(this.gameState.timeRemaining);
        
        // 更新爱心生命值图标
        const lives = this.gameState.lives;
        const maxLives = 5;
        let hearts = '';
        
        // 完整的心
        const fullHearts = Math.floor(lives);
        for (let i = 0; i < fullHearts; i++) {
            hearts += '❤';
        }
        
        // 半心（当生命值为小数时）
        if (lives % 1 >= 0.5) {
            hearts += '💔';
        }
        
        // 空心
        const emptyHearts = maxLives - Math.ceil(lives);
        for (let i = 0; i < emptyHearts; i++) {
            hearts += '🤍';
        }
        
        document.getElementById('lifeIcons').textContent = hearts;
    }
    
    animate(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.animate(time));
    }
    
    onResize() {
        this.renderer.resize();
    }
}

class Level {
    constructor(levelNum) {
        this.levelNum = levelNum;
        // 大幅增加关卡长度
        this.width = 5000 + levelNum * 2000;
        this.height = 800;
        this.spawnX = 100;
        this.spawnY = 500;
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.obstacles = []; // 新：障碍物
        this.powerUps = []; // 新：道具
        this.movingPlatforms = []; // 新：移动平台
        // 终点位置根据关卡调整，碰撞区域延伸到地面
        const goalY = levelNum === 1 ? 300 : 200;
        this.goal = { x: this.width - 100, y: goalY, height: this.height - goalY };
        
        this.generate();
    }
    
    generate() {
        this.generateGround();
        this.generatePlatforms();
        this.generateMovingPlatforms(); // 新
        this.generateObstacles(); // 新
        this.generatePowerUps(); // 新
        this.generateEnemies();
        this.generateCollectibles();
        this.clearSpawnArea(); // 清除初始点附近的障碍、道具和怪物
    }
    
    clearSpawnArea() {
        // 初始点安全区域半径
        const safeRadius = 400;
        const sx = this.spawnX;
        const sy = this.spawnY;
        
        const inSafeZone = (x, y) => {
            const dx = x - sx;
            const dy = y - sy;
            return Math.sqrt(dx * dx + dy * dy) < safeRadius;
        };
        
        this.enemies = this.enemies.filter(e => !inSafeZone(e.x, e.y));
        this.obstacles = this.obstacles.filter(o => !inSafeZone(o.x, o.y));
        this.powerUps = this.powerUps.filter(p => !inSafeZone(p.x, p.y));
    }
    
    generateGround() {
        const groundSegments = Math.ceil(this.width / 200);
        // 随着关卡增加，地面缺口更多
        const gapChance = this.levelNum === 1 ? 0.08 : (this.levelNum === 2 ? 0.15 : 0.22);
        let prevWasGap = false; // 防止连续缺口导致跳不过去
        
        for (let i = 0; i < groundSegments; i++) {
            const x = i * 200;
            // 关卡越高，缺口越多；但绝不允许连续缺口
            const hasGap = !prevWasGap && Math.random() < gapChance && i > 3 && i < groundSegments - 3;
            
            if (!hasGap) {
                this.platforms.push({
                    x: x,
                    y: this.height - 50,
                    width: 200,
                    height: 50,
                    type: 'ground',
                    color: '#8fbc8f'
                });
                prevWasGap = false;
            } else {
                prevWasGap = true;
            }
        }
    }
    
    generatePlatforms() {
        // 关卡越高普通平台越少（第三关大量替换为滑动平台）
        const platformCount = this.levelNum === 1 ? 35 : (this.levelNum === 2 ? 22 : 15);
        
        // 定义多个高度层级，低层权重更高（更容易跳上去）
        const heightLevels = [
            { min: 580, max: 650, name: 'near-ground', weight: 4 },  // 紧贴地面层（容易从地面跳上）
            { min: 480, max: 570, name: 'low', weight: 3 },          // 低层
            { min: 380, max: 470, name: 'mid-low', weight: 2 },      // 中低层
            { min: 280, max: 370, name: 'mid', weight: 1 },          // 中层
            { min: 180, max: 270, name: 'high', weight: 1 }          // 高层
        ];
        
        // 构建加权选择数组
        const weightedLevels = [];
        for (const level of heightLevels) {
            for (let w = 0; w < level.weight; w++) {
                weightedLevels.push(level);
            }
        }
        
        for (let i = 0; i < platformCount; i++) {
            const level = weightedLevels[Math.floor(Math.random() * weightedLevels.length)];
            
            const x = 300 + Math.random() * (this.width - 600);
            const y = level.min + Math.random() * (level.max - level.min);
            const width = 80 + Math.random() * 100;
            
            // 检查与其他平台的距离，避免过于密集
            let tooClose = false;
            for (let platform of this.platforms) {
                if (platform.type === 'ground') continue;
                const dx = platform.x - x;
                const dy = platform.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 90) {
                    tooClose = true;
                    break;
                }
            }
            
            if (tooClose) continue;
            
            const isCloud = Math.random() < (0.2 + this.levelNum * 0.05);
            
            this.platforms.push({
                x: x,
                y: y,
                width: width,
                height: 30,
                type: isCloud ? 'cloud' : 'normal',
                color: isCloud ? '#e8f4ff' : '#d4a574'
            });
        }
        
        // 每隔一段水平距离放置阶梯平台链（从地面到高层的跳板）
        this.generateSteppingStones();
        
        // 确保有从低到高的路径
        this.ensurePathToGoal();
    }
    
    generateSteppingStones() {
        // 每隔约700px放置一组阶梯平台，确保玩家能从地面逐步跳到高处
        const stepInterval = 700;
        const steps = Math.floor(this.width / stepInterval);
        
        for (let i = 1; i < steps - 1; i++) {
            const baseX = i * stepInterval + (Math.random() - 0.5) * 100;
            
            // 阶梯：从低到高，每级差约120px高度、80-150px水平偏移
            const stepHeights = [620, 500, 390, 280];
            
            for (let s = 0; s < stepHeights.length; s++) {
                const sx = baseX + (Math.random() - 0.5) * 120;
                const sy = stepHeights[s] + (Math.random() - 0.5) * 30;
                const sw = 80 + Math.random() * 60;
                
                // 检查是否与已有平台重叠
                let overlap = false;
                for (let platform of this.platforms) {
                    if (platform.type === 'ground') continue;
                    const dx = platform.x - sx;
                    const dy = platform.y - sy;
                    if (Math.abs(dx) < 80 && Math.abs(dy) < 40) {
                        overlap = true;
                        break;
                    }
                }
                
                if (!overlap) {
                    this.platforms.push({
                        x: sx,
                        y: sy,
                        width: sw,
                        height: 30,
                        type: 'normal',
                        color: '#d4a574'
                    });
                }
            }
        }
    }
    
    ensurePathToGoal() {
        // 在终点附近添加一个可达的平台
        const goalX = this.width - 200;
        const goalY = this.levelNum === 1 ? 500 : 400;
        
        // 检查是否已有平台在终点附近
        let hasPlatformNearGoal = false;
        for (let platform of this.platforms) {
            const dx = platform.x - goalX;
            const dy = platform.y - goalY;
            if (Math.abs(dx) < 150 && Math.abs(dy) < 100) {
                hasPlatformNearGoal = true;
                break;
            }
        }
        
        if (!hasPlatformNearGoal) {
            this.platforms.push({
                x: goalX,
                y: goalY,
                width: 100,
                height: 30,
                type: 'normal',
                color: '#d4a574'
            });
        }
    }
    
    generateMovingPlatforms() {
        // 第一关无滑动平台，第二关开始出现，第三关大量
        if (this.levelNum < 2) return;
        const movingCount = this.levelNum === 2 ? 8 : 20;
        
        for (let i = 0; i < movingCount; i++) {
            const x = 500 + Math.random() * (this.width - 1000);
            // 滑动平台分布在各高度层
            const y = 200 + Math.random() * 450;
            const width = 80 + Math.random() * 60;
            
            // 关卡越高，移动范围和速度越大
            const rangeMultiplier = 1 + (this.levelNum - 1) * 0.4;
            const speedMultiplier = 1 + (this.levelNum - 1) * 0.3;
            
            this.movingPlatforms.push({
                x: x,
                y: y,
                width: width,
                height: 25,
                startX: x,
                startY: y,
                moveRange: (100 + Math.random() * 150) * rangeMultiplier,
                speed: (30 + Math.random() * 40) * speedMultiplier,
                direction: 1,
                axis: Math.random() < 0.7 ? 'x' : 'y',
                type: 'moving',
                color: '#c8a8e8'
            });
        }
        
        // 将移动平台加入主平台列表用于碰撞检测
        this.platforms.push(...this.movingPlatforms);
    }
    
    generateObstacles() {
        // 第二关开始出现障碍物 - 只生成荆棘，不生成尖刺
        if (this.levelNum < 2) return;
        
        const obstacleCount = this.levelNum === 2 ? 5 : 12;
        
        for (let i = 0; i < obstacleCount; i++) {
            const x = 400 + Math.random() * (this.width - 800);
            // 只生成荆棘类型
            const type = 'thorn';
            
            // 找到最近的地面来放置障碍物
            const ground = this.platforms.find(p => 
                p.type === 'ground' && Math.abs(p.x - x) < 200
            );
            
            if (ground) {
                this.obstacles.push({
                    x: ground.x + Math.random() * (ground.width - 40),
                    y: ground.y - 30,
                    width: 30,
                    height: 30,
                    type: type,
                    damage: 1
                });
            }
        }
    }
    
    generatePowerUps() {
        // 第一关多道具帮助新手，后续递减
        const powerUpCount = this.levelNum === 1 ? 8 : (this.levelNum === 2 ? 6 : 5);
        
        // 按关卡调整道具概率
        const typePool = [];
        if (this.levelNum === 1) {
            // 第一关：偏向护盾、跳跃等辅助道具
            typePool.push('shield', 'shield', 'jump', 'jump', 'speed', 'speed', 'magnet', 'magnet');
        } else if (this.levelNum === 2) {
            // 第二关：均衡分布
            typePool.push('shield', 'jump', 'speed', 'magnet', 'big', 'freeze', 'mini', 'shield');
        } else {
            // 第三关：偏向强力道具（冰冻、变大）但也有变小风险
            typePool.push('shield', 'freeze', 'freeze', 'big', 'big', 'magnet', 'mini', 'speed');
        }
        
        for (let i = 0; i < powerUpCount; i++) {
            const x = 400 + Math.random() * (this.width - 800);
            const y = 200 + Math.random() * 300;
            const type = typePool[Math.floor(Math.random() * typePool.length)];
            
            this.powerUps.push({
                x: x,
                y: y,
                width: 30,
                height: 30,
                type: type,
                collected: false,
                frame: Math.random() * 100
            });
        }
    }
    
    generateEnemies() {
        // 三个关卡难度递增：敌人数量逐步增加
        const baseEnemyCount = this.levelNum === 1 ? 10 : (this.levelNum === 2 ? 22 : 35);
        
        const mistCount = Math.floor(baseEnemyCount * 0.25);
        const inkCount = Math.floor(mistCount * 3);
        
        // 第一关：无飞行怪无炸弹，第二关：炸弹但无飞行怪，第三关：飞行怪+炸弹
        const flyingCount = this.levelNum <= 2 ? 0 : 12;
        const bombCount = this.levelNum === 1 ? 0 : (this.levelNum === 2 ? 6 : 8);
        
        const enemyConfigs = [];
        
        for (let i = 0; i < inkCount; i++) {
            enemyConfigs.push({ type: 'ink' });
        }
        
        for (let i = 0; i < mistCount; i++) {
            enemyConfigs.push({ type: 'mist' });
        }
        
        for (let i = 0; i < flyingCount; i++) {
            enemyConfigs.push({ type: 'flying' });
        }
        
        for (let i = 0; i < bombCount; i++) {
            enemyConfigs.push({ type: 'bomb' });
        }
        
        // 获取所有地面平台
        const groundPlatforms = this.platforms.filter(p => p.type === 'ground');
        
        // 生成敌人
        enemyConfigs.forEach(config => {
            const speedMultiplier = 0.8 + this.levelNum * 0.25;
            
            // 飞行怪特殊处理：不绑定平台，自由飞行
            if (config.type === 'flying') {
                const x = 500 + Math.random() * (this.width - 1000);
                const y = 100 + Math.random() * 350; // 在空中较高位置
                const flySpeed = (60 + Math.random() * 60) * speedMultiplier;
                // 飞行范围随关卡递增
                const flyRange = (150 + this.levelNum * 80) + Math.random() * 100;
                
                this.enemies.push({
                    x: x,
                    y: y,
                    width: 40,
                    height: 40,
                    vx: flySpeed * (Math.random() < 0.5 ? 1 : -1),
                    vy: (20 + Math.random() * 30) * (Math.random() < 0.5 ? 1 : -1),
                    type: 'flying',
                    patrolTimer: 0,
                    patrolDuration: 2 + Math.random() * 2,
                    frame: 0,
                    dead: false,
                    exploded: false,
                    platform: null,
                    flyOriginX: x,
                    flyOriginY: y,
                    flyRange: flyRange
                });
                return;
            }
            
            // 地面/平台敌人
            const onGround = Math.random() < 0.75;
            let platform;
            
            if (onGround && groundPlatforms.length > 0) {
                platform = groundPlatforms[Math.floor(Math.random() * groundPlatforms.length)];
            } else {
                const otherPlatforms = this.platforms.filter(p => p.type !== 'ground');
                if (otherPlatforms.length > 0) {
                    platform = otherPlatforms[Math.floor(Math.random() * otherPlatforms.length)];
                } else if (groundPlatforms.length > 0) {
                    platform = groundPlatforms[Math.floor(Math.random() * groundPlatforms.length)];
                }
            }
            
            if (!platform) return;
            
            const x = platform.x + 20 + Math.random() * (platform.width - 60);
            const y = platform.y - 40;
            
            // 炸弹怪固定不动
            const baseSpeed = config.type === 'bomb' ? 0 : (50 + Math.random() * 50);
            
            this.enemies.push({
                x: x,
                y: y,
                width: 40,
                height: 40,
                vx: baseSpeed * speedMultiplier * (Math.random() < 0.5 ? 1 : -1),
                type: config.type,
                patrolTimer: 0,
                patrolDuration: 2 + Math.random() * 2,
                frame: 0,
                dead: false,
                exploded: false,
                platform: platform
            });
        });
    }
    
    generateCollectibles() {
        const starCount = 30 + this.levelNum * 15;
        
        const allPlatforms = this.platforms.filter(p => p.type !== 'ground');
        const allPlatformsIncGround = this.platforms;
        
        for (let i = 0; i < starCount; i++) {
            let x, y;
            // 80% 的星星放在平台上方（确保可达），20% 放在地面平台上方
            if (allPlatforms.length > 0 && Math.random() < 0.8) {
                const platform = allPlatforms[Math.floor(Math.random() * allPlatforms.length)];
                x = platform.x + Math.random() * platform.width;
                y = platform.y - 30 - Math.random() * 50; // 平台上方30~80px
            } else {
                const platform = allPlatformsIncGround[Math.floor(Math.random() * allPlatformsIncGround.length)];
                x = platform.x + Math.random() * platform.width;
                y = platform.y - 30 - Math.random() * 60;
            }
            
            this.collectibles.push({
                x: x,
                y: y,
                type: 'star',
                collected: false,
                frame: Math.random() * 100
            });
        }
        
        const featherCount = 3 + this.levelNum * 1; // 羽毛数量减半
        
        for (let i = 0; i < featherCount; i++) {
            let x, y;
            // 所有羽毛都放在平台上方，确保可达
            if (allPlatforms.length > 0) {
                const platform = allPlatforms[Math.floor(Math.random() * allPlatforms.length)];
                x = platform.x + platform.width / 2;
                y = platform.y - 40 - Math.random() * 40;
            } else {
                const platform = allPlatformsIncGround[Math.floor(Math.random() * allPlatformsIncGround.length)];
                x = platform.x + platform.width / 2;
                y = platform.y - 40 - Math.random() * 40;
            }
            
            this.collectibles.push({
                x: x,
                y: y,
                type: 'feather',
                collected: false,
                frame: Math.random() * 100
            });
        }
    }
    
    // 更新移动平台
    updateMovingPlatforms(deltaTime) {
        this.movingPlatforms.forEach(platform => {
            if (platform.axis === 'x') {
                platform.x += platform.speed * platform.direction * deltaTime;
                
                if (platform.x > platform.startX + platform.moveRange ||
                    platform.x < platform.startX - platform.moveRange) {
                    platform.direction *= -1;
                }
            } else {
                platform.y += platform.speed * platform.direction * deltaTime;
                
                if (platform.y > platform.startY + platform.moveRange ||
                    platform.y < platform.startY - platform.moveRange) {
                    platform.direction *= -1;
                }
            }
        });
    }
}

const game = new PlatformerGame();
