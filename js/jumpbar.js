class JumpBar {
    constructor(x, y, width, height, playerColor) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.playerColor = playerColor;
        
        this.cursorX = 0;
        this.direction = 1; // 1 for right, -1 for left
        this.speed = 5 + Math.random() * 2; // Randomize speed slightly
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;

        this.cursorX += this.speed * this.direction;

        if (this.cursorX <= 0) {
            this.cursorX = 0;
            this.direction = 1;
        } else if (this.cursorX >= this.width) {
            this.cursorX = this.width;
            this.direction = -1;
        }
    }

    // Stop the bar and return a power value between 0 and 1
    stop() {
        this.isActive = false;
        
        // Calculate power based on how close cursor is to the center
        const center = this.width / 2;
        const distanceToCenter = Math.abs(this.cursorX - center);
        
        // Normalize distance (0 is center, 1 is edge)
        const normalizedDistance = distanceToCenter / center;
        
        // Power is inversely proportional to distance (1 = perfect, 0 = worst)
        let power = 1 - normalizedDistance;
        
        return Math.max(0, power); // Ensure it's not negative
    }

    reset() {
        this.isActive = true;
        this.speed = 5 + Math.random() * 3; // Randomize speed for unpredictability
    }

    draw(ctx) {
        // Draw border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw zones (Red, Yellow, Green, Yellow, Red)
        // Red: 0-20%, Yellow: 20-40%, Green: 40-60%, Yellow: 60-80%, Red: 80-100%
        const w20 = this.width * 0.2;
        
        ctx.fillStyle = '#e74c3c'; // Red
        ctx.fillRect(this.x, this.y, w20, this.height);
        ctx.fillRect(this.x + this.width - w20, this.y, w20, this.height);
        
        ctx.fillStyle = '#f1c40f'; // Yellow
        ctx.fillRect(this.x + w20, this.y, w20, this.height);
        ctx.fillRect(this.x + this.width - 2 * w20, this.y, w20, this.height);
        
        ctx.fillStyle = '#2ecc71'; // Green
        ctx.fillRect(this.x + 2 * w20, this.y, w20, this.height);

        // Draw Cursor
        ctx.fillStyle = this.playerColor;
        // Shadow for cursor
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x + this.cursorX - 2, this.y - 5, 4, this.height + 10);
        ctx.shadowBlur = 0;
    }
}
