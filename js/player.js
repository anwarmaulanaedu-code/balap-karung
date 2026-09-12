const playerSprite = new Image();
playerSprite.src = 'asset/karakter1/lompat.png';

class Player {
    constructor(id, color, name, isCPU = false) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isCPU = isCPU;
        
        this.worldX = 0;
        this.y = 540; // Garis tanah pada map Desa Merdeka
        this.width = 40;
        this.height = 60;
        
        this.vy = 0;
        this.vx = 0;
        this.gravity = 0.6;
        this.friction = 0.9; // Horizontal friction in air
        
        this.isJumping = false;
        this.isStunned = false;
        this.stunTimer = 0;
        
        this.cpuTimer = 0;
        this.finished = false;
    }

    jump(power, boost = 1) {
        if (!this.isJumping && !this.isStunned && !this.finished) {
            this.isJumping = true;
            // Power determines both height and forward distance
            // power ranges from 0 to 1 (0 = bad, 1 = perfect)
            // Boost helps trailing players catch up
            this.vy = -12 - (power * 6); // Steeper jump height! (Max -18)
            this.vx = (3 + (power * 7)) * boost; // Slower forward to clear tall obstacles
            if (window.SoundFX) SoundFX.jump();
        }
    }

    stun() {
        if (!this.isStunned && !this.finished) {
            this.isStunned = true;
            this.stunTimer = 60; // 60 frames = ~1 second at 60fps
            this.vx = 0; // Stop moving forward
            // Small bounce back
            this.vy = -5;
            this.worldX -= 20;
            if (window.SoundFX) SoundFX.hit();
        }
    }

    update() {
        if (this.finished) return;

        // Apply stun
        if (this.isStunned) {
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
        }

        // Apply velocity to position
        this.worldX += this.vx;
        this.y += this.vy;

        // Apply gravity
        if (this.y < 540) {
            this.vy += this.gravity;
        } else {
            // Hit the ground
            this.y = 540;
            this.vy = 0;
            this.vx = 0;
            this.isJumping = false;
        }
    }

    draw(ctx, cameraX) {
        let screenX = this.worldX - cameraX + 100; // Offset by 100 so they aren't at the very edge

        // If player falls too far behind, clamp their visual representation to the left edge 
        // so they don't completely disappear, and make them semi-transparent.
        let isOffScreen = false;
        if (screenX < 20) {
            screenX = 20;
            isOffScreen = true;
        }

        ctx.save();
        ctx.translate(screenX, this.y);

        // If stunned or off-screen, add a visual effect (shake or blink/transparency)
        if (this.isStunned) {
            ctx.globalAlpha = Math.sin(Date.now() / 50) > 0 ? 1 : 0.5;
        } else if (isOffScreen) {
            ctx.globalAlpha = 0.5; // Transparent if clamped to edge
            
            // Draw a warning arrow pointing right
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(30, -this.height/2);
            ctx.lineTo(40, -this.height/2 - 10);
            ctx.lineTo(30, -this.height/2 - 20);
            ctx.fill();
        }

        // Gunakan aset karakter utama jika sudah siap dimuat. Posisi gambar
        // dipasang pada garis tanah agar ukuran sprite tetap proporsional.
        if (playerSprite.complete && playerSprite.naturalWidth) {
            const spriteHeight = 132;
            const spriteWidth = spriteHeight * (playerSprite.naturalWidth / playerSprite.naturalHeight);
            ctx.save();
            if (this.id === 2) {
                ctx.filter = 'grayscale(1) brightness(1.25) contrast(0.9)';
            }
            ctx.drawImage(playerSprite, -spriteWidth / 2, 30 - spriteHeight, spriteWidth, spriteHeight);
            ctx.restore();

            ctx.fillStyle = '#111827';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, 0, -118);
            ctx.restore();
            return;
        }

        // Fallback sederhana jika aset belum selesai dimuat.
        // --- DRAW ARMS (Back arm)
        ctx.fillStyle = '#f1c27d'; // Skin tone
        ctx.beginPath();
        ctx.arc(-15, -this.height/2 - 5, 5, 0, Math.PI*2);
        ctx.fill();
        
        // --- DRAW SACK
        let squash = this.isJumping ? 1.1 : (this.isStunned ? 0.9 : 1.0);
        const sackHeight = this.height * squash;
        const sackWidth = this.width / squash;
        
        ctx.fillStyle = '#cda47b'; // Base karung color
        ctx.beginPath();
        // Rounded bottom for sack
        ctx.roundRect(-sackWidth/2, -sackHeight/2 + (this.height - sackHeight), sackWidth, sackHeight, [5, 5, 15, 15]);
        ctx.fill();
        
        // Sack folds / texture
        ctx.strokeStyle = '#b08d6a';
        ctx.lineWidth = 1.5;
        for(let i = -sackWidth/2 + 5; i < sackWidth/2; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, -sackHeight/2 + 10);
            ctx.lineTo(i, sackHeight/2 - 5);
            ctx.stroke();
        }
        for(let i = -sackHeight/2 + 15; i < sackHeight/2; i += 8) {
            ctx.beginPath();
            ctx.moveTo(-sackWidth/2 + 2, i);
            ctx.lineTo(sackWidth/2 - 2, i);
            ctx.stroke();
        }
        
        // Sack top fold
        ctx.fillStyle = '#d4aa7f';
        ctx.beginPath();
        ctx.ellipse(0, -sackHeight/2 + (this.height - sackHeight), sackWidth/2 + 2, 5, 0, 0, Math.PI*2);
        ctx.fill();

        // --- DRAW SHIRT
        ctx.fillStyle = this.color;
        // Body bounds above sack
        ctx.beginPath();
        ctx.moveTo(-12, -sackHeight/2 + (this.height - sackHeight));
        ctx.lineTo(12, -sackHeight/2 + (this.height - sackHeight));
        ctx.lineTo(10, -this.height/2 - 15);
        ctx.lineTo(-10, -this.height/2 - 15);
        ctx.fill();
        
        // Collar
        ctx.fillStyle = '#fff';
        ctx.fillRect(-5, -this.height/2 - 16, 10, 3);
        
        // --- DRAW ARMS (Front arm) gripping sack
        ctx.strokeStyle = '#f1c27d'; // Skin tone arm
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2 - 10);
        ctx.lineTo(12, -sackHeight/2 + (this.height - sackHeight) - 5); // Elbow
        ctx.lineTo(8, -sackHeight/2 + (this.height - sackHeight) + 2); // Hand on sack
        ctx.stroke();

        // Hand
        ctx.fillStyle = '#f1c27d';
        ctx.beginPath();
        ctx.arc(8, -sackHeight/2 + (this.height - sackHeight) + 2, 4, 0, Math.PI*2);
        ctx.fill();

        // --- DRAW HEAD
        let headY = -this.height/2 - 22;

        ctx.fillStyle = '#f1c27d'; // Skin tone
        ctx.beginPath();
        ctx.arc(0, headY, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(0, headY - 4, 15, Math.PI, 0);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(4, headY - 2, 4, 0, Math.PI*2); // Right eye
        ctx.arc(-4, headY - 2, 4, 0, Math.PI*2); // Left eye
        ctx.fill();
        
        ctx.fillStyle = '#000';
        // If stunned, draw X eyes
        if (this.isStunned) {
            ctx.font = '10px Arial';
            ctx.fillText('x', 4, headY + 2);
            ctx.fillText('x', -4, headY + 2);
        } else {
            ctx.beginPath();
            ctx.arc(5, headY - 2, 2, 0, Math.PI*2); // Pupil facing right
            ctx.arc(-3, headY - 2, 2, 0, Math.PI*2); 
            ctx.fill();
        }
        
        // Headband (Ikat kepala merah putih)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-14, headY - 12, 28, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-14, headY - 8, 28, 4);
        
        // Tie of headband flying back
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(-14, headY - 10);
        ctx.lineTo(-25, headY - 15);
        ctx.lineTo(-22, headY - 5);
        ctx.fill();

        // Player Name
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, headY - 25);

        ctx.restore();
    }
}
