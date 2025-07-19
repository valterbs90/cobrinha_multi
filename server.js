// Importa o framework Express para servir arquivos estáticos e criar servidor web
const express = require("express");
// Importa o módulo HTTP para criar o servidor
const http = require("http");
// Importa o Socket.IO para comunicação em tempo real WebSocket
const { Server } = require("socket.io");

// Cria a aplicação Express
const app = express();
// Cria o servidor HTTP usando o Express
const server = http.createServer(app);
// Inicializa o Socket.IO atrelado ao servidor HTTP
const io = new Server(server);

// Porta que o servidor vai escutar
const PORT = 3000;

// Serve os arquivos estáticos da pasta "public" (onde ficam index.html, css, js)
app.use(express.static("public"));

// Define dimensões da "área de jogo"
const canvasWidth = 600;
const canvasHeight = 400;
// Tamanho da célula do grid (quadrado)
const box = 15;
// Quantidade de linhas e colunas no grid (canvas dividido pelo tamanho da célula)
const totalCols = 30;
const totalRows = 20;




// Função que gera uma posição aleatória válida para a comida no grid
function generateFood() {
  let newFood;
  let collision;

  do {
    collision = false;
    newFood = {
      x: Math.floor(Math.random() * totalCols),
      y: Math.floor(Math.random() * totalRows),
    };

    // Verifica se a comida cai dentro de alguma cobra
    for (const player of Object.values(players)) {
      if (player.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        collision = true;
        break;
      }
    }
  } while (collision);

  return newFood;
}
// Objeto que guarda todos os jogadores conectados
const players = {};
// Variável global que guarda a posição atual da comida
let food = generateFood();




// Função que cria a cobra inicial para um novo jogador
function createSnake() {
  return [
    { x: 5, y: 5 }, // cabeça da cobra
    { x: 4, y: 5 }, // segmento 1
    { x: 3, y: 5 }, // segmento 2 (cauda)
  ];
}


  // Ouve o evento "direction" enviado pelo cliente para atualizar a direção da cobra
// Mapeia as strings enviadas pelo cliente para vetores de direção
const directionsMap = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y: 1 },
  LEFT:  { x: -1, y: 0 },
  RIGHT: { x: 1,  y: 0 },
};

// Evento que dispara quando um cliente conecta via Socket.IO
io.on("connection", (socket) => {
  console.log("Novo jogador:", socket.id);

  // Inicializa o novo jogador com uma cobra, direção, pontuação e cor aleatória
  players[socket.id] = {
    snake: createSnake(), // array de segmentos
    dir: { x: 1, y: 0 },  // direção inicial (para direita)
    score: 0,
    color: getRandomColor(), // cor única para o jogador
    name: "Jogs", // nome padrão
  };

  // Ouve o evento setName do cliente para atualizar o nome
  socket.on("setName", (name) => {
      if (players[socket.id]) {
          players[socket.id].name = name.substring(0, 4); // Segurança extra
      }
  });
  
  socket.on("direction", (dir) => {
    const player = players[socket.id];
    if (!player) return;

  const newDir = directionsMap[dir];
  if (!newDir) return; // direção inválida ignorada

  // Bloqueia direção oposta para evitar a cobra se "morder"
  const currDir = player.dir;
  if (currDir.x + newDir.x === 0 && currDir.y + newDir.y === 0) {
    // se somar zero, significa que são opostas (ex: esquerda + direita)
    return; // ignora essa mudança
  }

  // Atualiza a direção para a nova direção válida
  player.dir = newDir;
});

  // Remove jogador e sua cobra ao desconectar
  socket.on("disconnect", () => {
    console.log("Saiu:", socket.id);
    delete players[socket.id];
  });
});

// Função que atualiza o estado do jogo em intervalos regulares (game loop)
function gameLoop() {
  for (let id in players) {
    const player = players[id];
    const snake = player.snake;
    const dir = player.dir;

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wrap-around
    head.x = (head.x + totalCols) % totalCols;
    head.y = (head.y + totalRows) % totalRows;

    // Verifica colisão com o próprio corpo
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      // Jogador colidiu consigo mesmo, remove ou reinicia a cobra
      console.log(`Jogador ${id} colidiu e foi removido`);
      delete players[id];
      continue; // pula para o próximo jogador
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      player.score++;
      food = generateFood();
    } else {
      snake.pop();
    }
  }

  io.emit("gameState", {
    food,
    players,
  });
}


// Chama a função gameLoop a cada 100 ms para atualizar o jogo (10 FPS)
setInterval(gameLoop, 100);

// Função para gerar uma cor hexadecimal aleatória para identificar os jogadores
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Inicia o servidor HTTP na porta definida e exibe mensagem no console
server.listen(3000, '0.0.0.0', () => {
  console.log("Servidor ouvindo em todas interfaces na porta 3000");
});

