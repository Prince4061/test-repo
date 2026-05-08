const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score-val');
const healthEl = document.getElementById('health-val');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');

// Audio Setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, dur) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

let GAME_STATE = 'MENU';
let score = 0, health = 100, frame = 0;
let bullets = [], enemies = [], stars = [];

const player = { x: 0, y: 0, w: 40, h: 45, speed: 8 };

// Initialize Stars
for(let i=0; i<100; i++) {
    stars.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, s: Math.random()*2 });
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width/2 - 20;
    player.y = canvas.height - 80;
}
window.addEventListener('resize', resize);
resize();

// Controls
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Mobile Controls Logic
const touchBtn = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
};
touchBtn('touch-left', 'ArrowLeft'); touchBtn('touch-right', 'ArrowRight'); touchBtn('touch-fire', 'Space');

function shoot() {
    bullets.push({ x: player.x + 18, y: player.y, w: 4, h: 12 });
    playSound(600, 'sawtooth', 0.1);
}

function update() {
    if(GAME_STATE !== 'PLAYING') return;
    frame++;

    if(keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if(keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;
    if(keys['Space'] && frame % 15 === 0) shoot();

    // Move Bullets
    bullets.forEach((b, i) => {
        b.y -= 10;
        if(b.y < 0) bullets.splice(i, 1);
    });

    // Spawn Enemies
    if(frame % 40 === 0) {
        enemies.push({ x: Math.random()*(canvas.width-30), y: -30, w: 30, h: 30 });
    }

    // Move Enemies & Collision
    enemies.forEach((en, i) => {
        en.y += 4;
        if(en.y > canvas.height) enemies.splice(i, 1);

        // Player Collision
        if(player.x < en.x + en.w && player.x + player.w > en.x && player.y < en.y + en.h && player.y + player.h > en.y) {
            health -= 20;
            enemies.splice(i, 1);
            playSound(100, 'square', 0.3);
            if(health <= 0) {
                GAME_STATE = 'MENU';
                overlay.style.display = 'flex';
                document.getElementById('title-text').innerText = "MISSION FAILED";
            }
        }

        // Bullet Collision
        bullets.forEach((b, bi) => {
            if(b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y) {
                enemies.splice(i, 1);
                bullets.splice(bi, 1);
                score += 10;
                playSound(200, 'sine', 0.1);
            }
        });
    });

    scoreEl.innerText = score;
    healthEl.innerText = health + '%';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Stars
    ctx.fillStyle = "white";
    stars.forEach(s => {
        s.y += 0.5;
        if(s.y > canvas.height) s.y = 0;
        ctx.fillRect(s.x, s.y, s.s, s.s);
    });

    // Draw Player Spaceship (PURE RED)
    ctx.shadowBlur = 15;
    ctx.shadowColor = "red";
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y); // Nose
    ctx.lineTo(player.x + 40, player.y + 45); // Right
    ctx.lineTo(player.x + 20, player.y + 35); // Center back
    ctx.lineTo(player.x, player.y + 45); // Left
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Bullets (Red Lasers)
    ctx.fillStyle = "#ff5555";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Draw Enemies (Square blocks)
    ctx.strokeStyle = "white";
    enemies.forEach(en => ctx.strokeRect(en.x, en.y, en.w, en.h));
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    score = 0; health = 100; enemies = []; bullets = [];
    GAME_STATE = 'PLAYING';
    overlay.style.display = 'none';
});

gameLoop();