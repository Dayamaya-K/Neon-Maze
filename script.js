const canvas = document.getElementById('maze-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const winScreen = document.getElementById('win-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const diffBtns = document.querySelectorAll('.diff-btn');
const controlsHint = document.getElementById('controls-hint');

// Game State
let mazeSize = 15; // default
let cellSize;
let maze = [];
let player = { x: 0, y: 0 };
let goal = { x: 0, y: 0 };
let isPlaying = false;
let animationId;
let pulseAngle = 0;

// Setup difficulties
diffBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        diffBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        mazeSize = parseInt(e.target.getAttribute('data-size'));
    });
});

startBtn.addEventListener('click', () => startGame());
nextBtn.addEventListener('click', () => {
    mazeSize = Math.min(mazeSize + 5, 40); // Increase difficulty
    startGame();
});

function resizeCanvas() {
    // Leave some margin
    const minDim = Math.min(window.innerWidth, window.innerHeight) * 0.95;
    canvas.width = minDim;
    canvas.height = minDim;
    cellSize = minDim / mazeSize;
    if (isPlaying) draw(true);
}

window.addEventListener('resize', resizeCanvas);

function startGame() {
    startScreen.classList.remove('active');
    winScreen.classList.remove('active');
    
    // hint fade in then out
    controlsHint.style.opacity = '1';
    setTimeout(() => { controlsHint.style.opacity = '0'; }, 3000);
    
    resizeCanvas();
    generateMaze();
    player = { x: 0, y: 0 };
    goal = { x: mazeSize - 1, y: mazeSize - 1 };
    isPlaying = true;
    
    if(!animationId) animationLoop();
}

function generateMaze() {
    maze = Array(mazeSize).fill().map(() => Array(mazeSize).fill().map(() => ({
        top: true, right: true, bottom: true, left: true, visited: false
    })));

    let current = { x: 0, y: 0 };
    maze[0][0].visited = true;
    let stack = [current];

    while (stack.length > 0) {
        let unvisitedNeighbors = getUnvisitedNeighbors(current);
        
        if (unvisitedNeighbors.length > 0) {
            let next = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
            stack.push(current);
            removeWalls(current, next);
            current = next;
            maze[current.y][current.x].visited = true;
        } else {
            current = stack.pop();
        }
    }
}

function getUnvisitedNeighbors(cell) {
    let neighbors = [];
    let { x, y } = cell;

    if (y > 0 && !maze[y - 1][x].visited) neighbors.push({ x, y: y - 1, dir: 'top' });
    if (x < mazeSize - 1 && !maze[y][x + 1].visited) neighbors.push({ x: x + 1, y, dir: 'right' });
    if (y < mazeSize - 1 && !maze[y + 1][x].visited) neighbors.push({ x, y: y + 1, dir: 'bottom' });
    if (x > 0 && !maze[y][x - 1].visited) neighbors.push({ x: x - 1, y, dir: 'left' });

    return neighbors;
}

function removeWalls(a, b) {
    let dx = a.x - b.x;
    if (dx === 1) { maze[a.y][a.x].left = false; maze[b.y][b.x].right = false; }
    else if (dx === -1) { maze[a.y][a.x].right = false; maze[b.y][b.x].left = false; }

    let dy = a.y - b.y;
    if (dy === 1) { maze[a.y][a.x].top = false; maze[b.y][b.x].bottom = false; }
    else if (dy === -1) { maze[a.y][a.x].bottom = false; maze[b.y][b.x].top = false; }
}

function drawPath(startX, startY, endX, endY) {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
}

function draw(force = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Maze walls
    ctx.strokeStyle = '#66FCF1';
    ctx.lineWidth = Math.max(2, cellSize / 8);
    ctx.lineCap = 'round';
    
    // Add neon glow only for walls that need it, caching could be used but canvas is fast enough on mobile for 40x40
    ctx.shadowColor = '#66FCF1';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    for (let y = 0; y < mazeSize; y++) {
        for (let x = 0; x < mazeSize; x++) {
            let cell = maze[y][x];
            let cx = x * cellSize;
            let cy = y * cellSize;

            if (cell.top) drawPath(cx, cy, cx + cellSize, cy);
            if (cell.right) drawPath(cx + cellSize, cy, cx + cellSize, cy + cellSize);
            if (cell.bottom) drawPath(cx, cy + cellSize, cx + cellSize, cy + cellSize);
            if (cell.left) drawPath(cx, cy, cx, cy + cellSize);
        }
    }
    ctx.stroke();

    // Draw Goal (pulsing)
    pulseAngle += 0.08;
    let pulseRadius = (cellSize * 0.25) + Math.sin(pulseAngle) * (cellSize * 0.08);
    ctx.fillStyle = '#7209b7';
    ctx.shadowColor = '#7209b7';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(goal.x * cellSize + cellSize / 2, goal.y * cellSize + cellSize / 2, Math.max(2, pulseRadius), 0, Math.PI * 2);
    ctx.fill();

    // Draw Player
    let playerRadius = cellSize * 0.3;
    ctx.fillStyle = '#f72585';
    ctx.shadowColor = '#f72585';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2, Math.max(2, playerRadius), 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function animationLoop() {
    if (isPlaying) {
        draw();
    } else {
        // Draw static state before game starts for cool background
        if(!maze.length) {
            // we could draw an empty grid or just keep it blank
        }
    }
    animationId = requestAnimationFrame(animationLoop);
}

// Movement Logic
function movePlayer(dx, dy) {
    if (!isPlaying) return;

    let cell = maze[player.y][player.x];
    
    if (dx === 1 && !cell.right) player.x++;
    else if (dx === -1 && !cell.left) player.x--;
    else if (dy === 1 && !cell.bottom) player.y++;
    else if (dy === -1 && !cell.top) player.y--;
    
    checkWin();
}

function checkWin() {
    if (player.x === goal.x && player.y === goal.y) {
        isPlaying = false;
        setTimeout(() => {
            winScreen.classList.add('active');
            let txt = winScreen.querySelector('h2');
            txt.innerText = 'Level Complete!';
            winScreen.querySelector('p').innerText = `Completed ${mazeSize}x${mazeSize} maze.`;
        }, 300);
    }
}

// Input Handling - Keyboard
window.addEventListener('keydown', (e) => {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(0, -1);
    if (e.key === 'ArrowDown' || e.key === 's') movePlayer(0, 1);
    if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1, 0);
    if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1, 0);
});

// Input Handling - Swipe
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: false});

// Prevent default mostly prevents pull to refresh and elastic scrolling on mobile web
window.addEventListener('touchmove', e => {
    // Only prevent default if target is not a button to allow button clicks!
    if(e.target.tagName !== 'BUTTON') {
        e.preventDefault(); 
    }
}, {passive: false});

window.addEventListener('touchend', e => {
    if(!isPlaying) return;
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
});

function handleSwipe(startX, startY, endX, endY) {
    const dx = endX - startX;
    const dy = endY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 25) { // minimum swipe distance
        if (absDx > absDy) {
            // Horizontal
            if (dx > 0) movePlayer(1, 0);
            else movePlayer(-1, 0);
        } else {
            // Vertical
            if (dy > 0) movePlayer(0, 1);
            else movePlayer(0, -1);
        }
    }
}

// Draw initial decorative maze for main menu background
mazeSize = 10;
resizeCanvas();
generateMaze();
draw();
