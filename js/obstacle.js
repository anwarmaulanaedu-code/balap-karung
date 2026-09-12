class Obstacle {
    constructor(worldX) {
        this.worldX = worldX;
        // Seluruh lintasan memakai palang bambu agar konsisten dengan map desa.
        this.type = 'pagar-bambu';
        this.width = 52;
        this.height = 42;
        this.y = 539; // Bottom at 560, sejajar jalur tanah
    }

    update(cameraX) {
        // Rintangan tetap pada posisinya di jalur lomba.
    }

    draw(ctx, cameraX) {
        const screenX = this.worldX - cameraX + 100;
        
        ctx.save();
        ctx.translate(screenX, this.y);
        
        if (this.type === 'pagar-bambu') {
            // Palang bambu kecil dengan pita merah-putih.
            ctx.strokeStyle = '#9a671e';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-20, 21); ctx.lineTo(-20, -20);
            ctx.moveTo(20, 21); ctx.lineTo(20, -20);
            ctx.moveTo(-25, -4); ctx.lineTo(25, -4);
            ctx.stroke();
            ctx.strokeStyle = '#e8b75e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-20, 21); ctx.lineTo(-20, -20);
            ctx.moveTo(20, 21); ctx.lineTo(20, -20);
            ctx.moveTo(-25, -4); ctx.lineTo(25, -4);
            ctx.stroke();
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-7, -9, 7, 10);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -9, 7, 10);
        }
        
        ctx.restore();
    }

    // Check AABB collision
    checkCollision(player) {
        const pLeft = player.worldX - player.width/2;
        const pRight = player.worldX + player.width/2;
        const pBottom = player.y + player.height/2; // 600
        
        // Head height calculation
        let pTop = player.y - player.height/2 - 36; 

        const oLeft = this.worldX - this.width/2;
        const oRight = this.worldX + this.width/2;
        const oBottom = this.y + this.height/2;
        const oTop = this.y - this.height/2;

        return (pLeft < oRight &&
                pRight > oLeft &&
                pTop < oBottom &&
                pBottom > oTop);
    }
}
