// CANVAS SETUP
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
const ROWS = 20;
const COLS = 10;
ctx.scale(30, 30);

// ARENA (THE GRID)
const arena = createMatrix(COLS, ROWS);

// COLORS
const colors = [
  null,
  "#FF0D72",
  "#0DC2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF"
];

// PLAYER OBJECT
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  level: 1,
  visualY: 0
};

// SOUNDS
const bgMusic = new Audio("assets/Dave-ft-Tems-Raindance-(TrendyBeatz.com).mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

const clearSound = new Audio("assets/sounds/clear.mp3");
const gameOverSound = new Audio("assets/sounds/gameover.mp3");

// CREATE MATRIX
function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

// CREATE PIECES
function createPiece(type) {
  if (type === "T") return [[0,1,0],[1,1,1],[0,0,0]];
  if (type === "O") return [[2,2],[2,2]];
  if (type === "L") return [[0,0,3],[3,3,3],[0,0,0]];
  if (type === "J") return [[4,0,0],[4,4,4],[0,0,0]];
  if (type === "I") return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
  if (type === "S") return [[0,6,6],[6,6,0],[0,0,0]];
  if (type === "Z") return [[7,7,0],[0,7,7],[0,0,0]];
}

// DRAW MATRIX
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.shadowColor = colors[value];
        ctx.shadowBlur = 20; // neon glow
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        ctx.shadowBlur = 0;
      }
    });
  });
}

// DRAW
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, {x:0, y:0});
  drawMatrix(player.matrix, {x:player.pos.x, y:player.visualY});
}

// MERGE PLAYER INTO ARENA
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
    });
  });
}

// COLLISION
function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
         (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0)
        return true;
    }
  }
  return false;
}

// ARENA SWEEP (CLEAR LINES)
function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }
    const row = arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;
    updateScore();

    clearSound.currentTime = 0;
    clearSound.play();

    // Vibration on mobile
    if (navigator.vibrate) navigator.vibrate(100);
  }
}

// PLAYER MOVE
function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

// ROTATE
function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
  }
  matrix.forEach(row => row.reverse());
}

function playerRotate() {
  rotate(player.matrix);
  if (collide(arena, player)) rotate(player.matrix), rotate(player.matrix), rotate(player.matrix);
}

// PLAYER DROP
function playerDrop() {
  player.pos.y++;
  dropCounter = 0;

  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
    updateScore();
  }

  // Smooth fall
  player.visualY = player.pos.y;
}

// PLAYER RESET
function playerReset() {
  const pieces = "TJLOSZI";
  player.matrix = createPiece(pieces[Math.floor(Math.random()*pieces.length)]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  player.visualY = player.pos.y;

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    alert("Game Over!");
  }
}

// UPDATE SCORE
function updateScore() {
  document.getElementById("score").innerText = player.score;
  player.level = Math.floor(player.score / 100) + 1;
  document.getElementById("level").innerText = player.level;
  dropInterval = 1000 - (player.level - 1) * 100;
}

// GAME LOOP
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();

  draw();
  requestAnimationFrame(update);
}

// KEYBOARD CONTROLS
document.addEventListener("keydown", event => {
  if (event.keyCode === 37) playerMove(-1);
  else if (event.keyCode === 39) playerMove(1);
  else if (event.keyCode === 40) playerDrop();
  else if (event.keyCode === 38) playerRotate();
});

// SWIPE CONTROLS
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", e => {
  let dx = e.changedTouches[0].clientX - touchStartX;
  let dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) playerMove(1);
    else if (dx < -30) playerMove(-1);
  } else {
    if (dy > 30) playerDrop();
    else if (dy < -30) playerRotate();
  }
});

// MOBILE BUTTON CONTROLS
document.getElementById("leftBtn").onclick = () => playerMove(-1);
document.getElementById("rightBtn").onclick = () => playerMove(1);
document.getElementById("downBtn").onclick = () => playerDrop();
document.getElementById("rotateBtn").onclick = () => playerRotate();

// START BUTTON
const startBtn = document.getElementById("startBtn");
startBtn.addEventListener("click", () => {
  arena.forEach(row => row.fill(0));
  player.score = 0;
  player.level = 1;
  player.visualY = 0;
  updateScore();
  playerReset();

  lastTime = 0;
  dropCounter = 0;

  bgMusic.currentTime = 0;
  bgMusic.play();

  update();
  startBtn.style.display = "none"; // hide after start
});

// FULLSCREEN BUTTON
const fullscreenBtn = document.getElementById("fullscreenBtn");
fullscreenBtn.addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    if (screen.orientation && screen.orientation.lock) {
      try { await screen.orientation.lock("portrait"); } catch(e){console.log("No lock");}
    }
  } else {
    document.exitFullscreen();
  }
});

// SERVICE WORKER FOR PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");

}
