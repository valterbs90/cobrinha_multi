const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
app.use(express.static("public"));

const canvasWidth = 600;
const canvasHeight = 450;
const box = 15;
const totalCols = 40;
const totalRows = 30;

let topPlayers = [];
const players = {};
let food = generateFood();

const directionsMap = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y: 1 },
  LEFT:  { x: -1, y: 0 },
  RIGHT: { x: 1,  y: 0 },
};

function updateRanking(player) {
  const score = player.snake.length;

  topPlayers.push({
    name: player.name || "Anon",
    score: score,
    timestamp: Date.now()
  });

  topPlayers.sort((a, b) => b.score - a.score);
  topPlayers = topPlayers.slice(0, 6);
}

function generateFood() {
  let newFood, collision;

  do {
    collision = false;
    newFood = {
      x: Math.floor(Math.random() * totalCols),
      y: Math.floor(Math.random() * totalRows),
    };

    for (const player of Object.values(players)) {
      if (player.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        collision = true;
        break;
      }
    }
  } while (collision);

  return newFood;
}

function createInitialSnake() {
  const startX = Math.floor(Math.random() * totalCols);
  const startY = Math.floor(Math.random() * totalRows);
  const initialLength = 5;
  const snake = [];

  for (let i = 0; i < initialLength; i++) {
    snake.push({ x: startX - i, y: startY });
  }

  return snake;
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function resetPlayerState(id) {
  if (players[id]) {
    updateRanking(players[id]);
    players[id].snake = createInitialSnake();
    players[id].dir = { x: 1, y: 0 };
    players[id].alive = true;
    players[id].score = 0;
  }
}

io.on("connection", (socket) => {
  console.log("Novo jogador:", socket.id);

  players[socket.id] = {
    snake: createInitialSnake(),
    dir: { x: 1, y: 0 },
    score: 0,
    color: getRandomColor(),
    name: "Jogs",
    alive: true,
  };

  socket.on("setName", (name) => {
    if (players[socket.id]) {
      players[socket.id].name = name.substring(0, 4);
    }
  });

  socket.on("direction", (dir) => {
    const player = players[socket.id];
    if (!player) return;

    const newDir = directionsMap[dir];
    if (!newDir) return;

    const currDir = player.dir;
    if (currDir.x + newDir.x === 0 && currDir.y + newDir.y === 0) return;

    player.dir = newDir;
  });

  socket.on("resetPlayer", () => {
    resetPlayerState(socket.id);
  });

  socket.on("retry", () => {
    resetPlayerState(socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Saiu:", socket.id);
    delete players[socket.id];
  });
});

function gameLoop() {
  for (let id in players) {
    const player = players[id];
    const snake = player.snake;
    const dir = player.dir;

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    head.x = (head.x + totalCols) % totalCols;
    head.y = (head.y + totalRows) % totalRows;

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      console.log(`Jogador ${id} colidiu e foi removido`);
      io.to(id).emit("playerDied");
      delete players[id];
      continue;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      player.score++;
      food = generateFood();
    } else {
      snake.pop();
    }
  }

  io.emit("gameState", { food, players });
  io.emit("rankingUpdate", topPlayers);
}

setInterval(gameLoop, 100);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ouvindo em todas interfaces na porta ${PORT}`);
});
