const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mapBackground = new Image();
mapBackground.src = 'asset/map/desa-merdeka.png';
const finishGate = new Image();
finishGate.src = 'asset/finish/gapura-finis.png';

// Game State
let gameState = 'MENU'; // MENU, COUNTDOWN, PLAYING, GAMEOVER
let isPvP = false;
let animationId;
let countdownStartedAt = 0;
const COUNTDOWN_DURATION = 4000;
let countdownValue = 3;
let countdownInterval = null;

// Gamepad State
const gamepadState = {
    0: { buttonPressed: false },
    1: { buttonPressed: false }
};

// UI Elements
const mainMenu = document.getElementById('main-menu');
const gameOverMenu = document.getElementById('game-over');
const btnPvC = document.getElementById('btn-pvc');
const btnPvP = document.getElementById('btn-pvp');
const btnRestart = document.getElementById('btn-restart');
const winnerText = document.getElementById('winner-text');
const btnSound = document.getElementById('btn-sound');
const soundIcon = document.getElementById('sound-icon');

// Game Objects
let player1, player2;
let p1JumpBar, p2JumpBar;
let obstacles = [];
const FINISH_LINE = 5000; // Finish line at 5000 pixels

// Input handling
const keys = {
    Space: false,
    Enter: false
};

// Event Listeners for UI
btnPvC.addEventListener('click', () => startGame(false));
btnPvP.addEventListener('click', () => startGame(true));
btnRestart.addEventListener('click', () => {
    gameOverMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

if (btnSound) {
    btnSound.addEventListener('click', () => {
        if (window.bgm && window.menuBgm) {
            const isMuted = bgm.toggleMute();
            menuBgm.isMuted = isMuted; // Sync mute state
            
            if (isMuted) {
                menuBgm.stop();
                soundIcon.className = "fa-solid fa-volume-xmark";
                btnSound.classList.replace('text-white', 'text-gray-400');
            } else {
                if (gameState === 'MENU') menuBgm.play();
                soundIcon.className = "fa-solid fa-volume-high";
                btnSound.classList.replace('text-gray-400', 'text-white');
            }
        }
    });
}

// Event Listeners for Input
window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;

    if (e.code === 'Space' && !keys.Space) {
        keys.Space = true;
        if (!player1.isJumping && !player1.isStunned) {
            const power = p1JumpBar.stop();
            let boost = 1;
            if (player2.worldX - player1.worldX > 300) boost = 1.3;
            if (player2.worldX - player1.worldX > 600) boost = 1.6;
            player1.jump(power, boost);
        }
    }
    if (e.code === 'Enter' && !keys.Enter) {
        keys.Enter = true;
        if (isPvP && !player2.isJumping && !player2.isStunned) {
            const power = p2JumpBar.stop();
            let boost = 1;
            if (player1.worldX - player2.worldX > 300) boost = 1.3;
            if (player1.worldX - player2.worldX > 600) boost = 1.6;
            player2.jump(power, boost);
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') keys.Space = false;
    if (e.code === 'Enter') keys.Enter = false;
    
});

function checkGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    // Check Player 1 (Gamepad 0)
    if (gamepads[0]) {
        const gp = gamepads[0];
        const isJumpPressed = gp.buttons[0].pressed; // A button
        
        // Jump
        if (isJumpPressed && !gamepadState[0].buttonPressed) {
            gamepadState[0].buttonPressed = true;
            if (!player1.isJumping && !player1.isStunned) {
                const power = p1JumpBar.stop();
                let boost = 1;
                if (player2.worldX - player1.worldX > 300) boost = 1.3;
                if (player2.worldX - player1.worldX > 600) boost = 1.6;
                player1.jump(power, boost);
            }
        } else if (!isJumpPressed) {
            gamepadState[0].buttonPressed = false;
        }

    }
    
    // Check Player 2 (Gamepad 1)
    if (gamepads[1] && isPvP) {
        const gp = gamepads[1];
        const isJumpPressed = gp.buttons[0].pressed;
        
        // Jump
        if (isJumpPressed && !gamepadState[1].buttonPressed) {
            gamepadState[1].buttonPressed = true;
            if (!player2.isJumping && !player2.isStunned) {
                const power = p2JumpBar.stop();
                let boost = 1;
                if (player1.worldX - player2.worldX > 300) boost = 1.3;
                if (player1.worldX - player2.worldX > 600) boost = 1.6;
                player2.jump(power, boost);
            }
        } else if (!isJumpPressed) {
            gamepadState[1].buttonPressed = false;
        }

    }
}

function initGame() {
    // Initialize Players
    player1 = new Player(1, '#e74c3c', 'Player 1');
    player2 = new Player(2, '#ecf0f1', isPvP ? 'Player 2' : 'Komputer', !isPvP);
    
    // Players start at slightly different Z to differentiate them
    // but in 2D we just draw them. Let's make Player 1 slightly in front of Player 2 in terms of drawing order.
    
    // Initialize JumpBars (x, y, width, height, color)
    const jumpBarY = canvas.height - 65; // Matches uiY (620) + 35
    p1JumpBar = new JumpBar(50, jumpBarY, 300, 20, player1.color);
    p2JumpBar = new JumpBar(canvas.width - 350, jumpBarY, 300, 20, player2.color);

    // Rintangan baru dibuat setelah hitung mundur selesai supaya arena awal bersih.
    obstacles = [];
}

function createObstacles() {
    obstacles = [];
    // Setiap permainan memiliki jumlah dan lokasi palang bambu berbeda.
    const obstacleCount = 6 + Math.floor(Math.random() * 6); // 6–11 palang
    const firstObstacleX = 750;
    const lastObstacleX = FINISH_LINE - 400;
    const sectionWidth = (lastObstacleX - firstObstacleX) / obstacleCount;

    for (let i = 0; i < obstacleCount; i++) {
        const randomOffset = (Math.random() - 0.5) * sectionWidth * 0.5;
        const worldX = firstObstacleX + (i + 0.5) * sectionWidth + randomOffset;
        obstacles.push(new Obstacle(worldX));
    }
}

function startGame(pvpMode) {
    isPvP = pvpMode;
    gameState = 'COUNTDOWN';
    mainMenu.classList.add('hidden');
    initGame();
    
    if (window.menuBgm) menuBgm.stop();

    countdownValue = 3;
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
    
    if (window.SoundFX) SoundFX.beep();
    
    countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue > 0) {
            if (window.SoundFX) SoundFX.beep();
        } else if (countdownValue === 0) {
            if (window.SoundFX) SoundFX.go();
            createObstacles();
            gameState = 'PLAYING';
            if (window.bgm) bgm.play();
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function endGame(winner) {
    gameState = 'GAMEOVER';
    winnerText.innerText = winner.name + " Menang!";
    winnerText.style.color = winner.color;
    gameOverMenu.classList.remove('hidden');
    if (window.SoundFX) SoundFX.win();
    if (window.bgm) bgm.stop();
}

function update() {
    if (gameState !== 'PLAYING') return;

    // Check Gamepad inputs
    checkGamepads();

    // Update JumpBars
    p1JumpBar.update();
    p2JumpBar.update();

    // Reset jump bar if player lands
    if (!player1.isJumping && !p1JumpBar.isActive) p1JumpBar.reset();
    if (!player2.isJumping && !p2JumpBar.isActive) p2JumpBar.reset();

    // CPU Logic
    if (player2.isCPU && !player2.isJumping && !player2.isStunned && !player2.finished) {
        player2.cpuTimer--;
        if (player2.cpuTimer <= 0) {
            const center = p2JumpBar.width / 2;
            const diff = Math.abs(p2JumpBar.cursorX - center);
            
            if (diff < 40 || Math.random() < 0.05) {
                const power = p2JumpBar.stop();
                let boost = 1;
                if (player1.worldX - player2.worldX > 300) boost = 1.3;
                if (player1.worldX - player2.worldX > 600) boost = 1.6;
                player2.jump(power, boost);
                player2.cpuTimer = 30 + Math.random() * 60; // Next jump delay
            }
        }
    }

    // Update Players
    player1.update();
    player2.update();

    // Check Obstacle Collisions
    // We get the leadingX to determine camera
    const leadingX = Math.max(player1.worldX, player2.worldX);
    const cameraX = leadingX;

    obstacles.forEach(obs => {
        obs.update(cameraX);
        
        // Only collide if player is visible on screen (screenX > -50).
        // If they are off-screen to the left, they pass through rocks to let them catch up.
        const p1ScreenX = player1.worldX - cameraX + 100;
        const p2ScreenX = player2.worldX - cameraX + 100;

        if (!player1.isStunned && p1ScreenX > -50 && obs.checkCollision(player1)) {
            player1.stun();
        }
        if (!player2.isStunned && p2ScreenX > -50 && obs.checkCollision(player2)) {
            player2.stun();
        }
    });

    // Check Finish Line
    if (player1.worldX >= FINISH_LINE && !player1.finished) {
        player1.finished = true;
        player1.worldX = FINISH_LINE; // Cap at finish line
        if (!player2.finished) endGame(player1);
    }
    if (player2.worldX >= FINISH_LINE && !player2.finished) {
        player2.finished = true;
        player2.worldX = FINISH_LINE;
        if (!player1.finished) endGame(player2);
    }

    // Update HTML Progress Bar
    document.getElementById('p1-progress').style.width = Math.min(100, (player1.worldX / FINISH_LINE) * 100) + '%';
    document.getElementById('p2-progress').style.width = Math.min(100, (player2.worldX / FINISH_LINE) * 100) + '%';
    
    // Update Gamepad Status UI
    document.getElementById('gp1-status').innerHTML = `<i class="fa-solid fa-gamepad"></i> P1: ${navigator.getGamepads()[0] ? 'Connected' : 'Off'}`;
    if (isPvP) {
        document.getElementById('gp2-status').innerHTML = `<i class="fa-solid fa-gamepad"></i> P2: ${navigator.getGamepads()[1] ? 'Connected' : 'Off'}`;
    }
}

function drawBackground(cameraX) {
    if (mapBackground.complete && mapBackground.naturalWidth) {
        // Peta asli lebih lebar dari area tampilan. Kamera mengambil bagian
        // berbeda dari satu gambar yang sama, sehingga tidak ada sambungan
        // berulang yang terlihat di tengah permainan.
        const sourceWidth = mapBackground.naturalWidth;
        const sourceHeight = mapBackground.naturalHeight;
        // Sedikit diperbesar agar tersedia ruang untuk pergeseran kamera
        // tanpa perlu mengulang gambar di sisi lain.
        const zoom = 0.88;
        const viewWidth = sourceWidth * zoom;
        const viewHeight = sourceHeight * zoom;
        const maxPan = Math.max(0, sourceWidth - viewWidth);
        const panCycle = maxPan * 2 || 1;
        const panPosition = (cameraX * 0.12) % panCycle;
        const sourceX = panPosition <= maxPan ? panPosition : panCycle - panPosition;
        const sourceY = (sourceHeight - viewHeight) / 2;
        ctx.drawImage(mapBackground, sourceX, sourceY, viewWidth, viewHeight, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#55b4ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(0, 500, canvas.width, canvas.height - 500);
    }

    // Finish Line
    const screenFinishX = FINISH_LINE - cameraX + 100;
    if (screenFinishX > -220 && screenFinishX < canvas.width + 220) {
        if (finishGate.complete && finishGate.naturalWidth) {
            // Titik finish berada di tengah gapura dan sejajar dengan jalur lari.
            ctx.drawImage(finishGate, screenFinishX - 180, 240, 360, 320);
        } else {
            ctx.strokeStyle = '#9a671e';
            ctx.lineWidth = 18;
            ctx.beginPath();
            ctx.moveTo(screenFinishX - 120, 560);
            ctx.lineTo(screenFinishX - 120, 290);
            ctx.lineTo(screenFinishX + 120, 290);
            ctx.lineTo(screenFinishX + 120, 560);
            ctx.stroke();
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(screenFinishX - 100, 305, 200, 40);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GARIS FINIS', screenFinishX, 333);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Camera follows the leading player, but doesn't go backwards
    const leadingX = Math.max(player1.worldX, player2.worldX);
    let cameraX = leadingX;

    drawBackground(cameraX);

    // Draw Obstacles
    obstacles.forEach(obs => obs.draw(ctx, cameraX));

    // Draw Players (draw one behind the other based on Y or just fixed order)
    player2.draw(ctx, cameraX);
    player1.draw(ctx, cameraX);

    // Draw UI (JumpBars) with dark rounded background at bottom corners
    const uiY = canvas.height - 100;
    
    ctx.fillStyle = 'rgba(26, 28, 41, 0.8)';
    ctx.beginPath();
    ctx.roundRect(30, uiY, 340, 70, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText("[SPASI / A] TEKAN SAAT HIJAU!", 50, uiY + 25);
    p1JumpBar.draw(ctx);

    ctx.fillStyle = 'rgba(26, 28, 41, 0.8)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 370, uiY, 340, 70, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText("[ENTER / A] TEKAN SAAT HIJAU!", canvas.width - 50, uiY + 25);
    p2JumpBar.draw(ctx);

    // Draw Countdown
    if (gameState === 'COUNTDOWN') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#f1c40f'; // Yellow
        ctx.font = 'bold 200px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        if (countdownValue > 0) {
            ctx.fillText(countdownValue, canvas.width/2, canvas.height/2 - 50);
        }
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else if (gameState === 'PLAYING' && countdownValue === 0) {
        // Draw GO! for a short time
        ctx.fillStyle = '#e74c3c'; // Red
        ctx.font = 'bold 200px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 30;
        
        ctx.fillText("GO!", canvas.width/2, canvas.height/2 - 50);
        
        ctx.shadowBlur = 0;
        
        // Hide GO! after 1 second
        setTimeout(() => {
            if (countdownValue === 0) countdownValue = -1;
        }, 1000);
    }
}


function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Initial draw for menu background
drawBackground(0);
