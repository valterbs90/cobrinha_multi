const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 15;
canvas.width = 600;
canvas.height = 450;

const socket = io();
const bgm = document.getElementById('bgm');
bgm.playbackRate = 1.8;

document.addEventListener('click', () => {
  bgm.play().catch(() => {
    console.log('Usuário precisa interagir para tocar áudio');
  });
}, { once: true });

document.getElementById("btnReset").addEventListener("click", () => {
  socket.emit("resetPlayer");
});

document.getElementById("controls").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const dir = e.target.getAttribute("data-dir");
    if (dir) {
      socket.emit("direction", dir);
    }
  }
});

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
    socket.emit("direction", key.replace("Arrow", "").toUpperCase());
  }
});

const btnSetName = document.getElementById("btnSetName");
const inputName = document.getElementById("playerName");

btnSetName.addEventListener("click", () => {
  const name = inputName.value.trim().substring(0, 4);
  if (name.length > 0) {
    socket.emit("setName", name);
  }
});

inputName.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    btnSetName.click();
  }
});

socket.on("connect", () => {
  document.getElementById("status").innerText = "Conectado!";
});

let gameState = null;

socket.on("gameState", (state) => {
  gameState = state;
  draw();
});

socket.on("rankingUpdate", (ranking) => {
  const list = document.getElementById("rankingList");
  list.innerHTML = "";

  for (const player of ranking) {
    const item = document.createElement("li");
    item.textContent = `${player.name} - ${player.score}`;
    list.appendChild(item);
  }
});

socket.on("playerDied", showRetryButton);

function showRetryButton() {
  document.getElementById("retryBtn").style.display = "block";
}

function retryGame() {
  socket.emit("resetPlayer");
  document.getElementById("retryBtn").style.display = "none";
}

function drawGrid() {
  const gridSize = box * 2;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function draw() {
  if (!gameState) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  ctx.fillStyle = "#f00";
  ctx.fillRect(gameState.food.x * box, gameState.food.y * box, box, box);

  for (const [id, player] of Object.entries(gameState.players)) {
    const snake = player.snake;
    ctx.fillStyle = player.color || "#00f";

    for (let segment of snake) {
      ctx.fillRect(segment.x * box, segment.y * box, box, box);
    }

    const head = snake[0];
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(player.name || "Anon", head.x * box + box / 2, head.y * box - 2);
  }

  let yOffset = 15;
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  for (const player of Object.values(gameState.players)) {
    ctx.fillText(`${player.name}: ${player.score}`, 10, yOffset);
    yOffset += 15;
  }
}
