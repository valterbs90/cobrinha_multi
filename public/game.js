// Seleciona o elemento canvas do HTML
const canvas = document.getElementById("gameCanvas");

// Obtém o contexto 2D para desenhar no canvas
const ctx = canvas.getContext("2d");

// Define o tamanho da "caixinha" do grid (tamanho do quadrado da cobra e comida)
const box = 15;
canvas.width = 600;
canvas.height = 400;

// Inicializa a conexão com o servidor via socket.io
const socket = io();

// Variável para armazenar o estado do jogo enviado pelo servidor
let gameState = null;

// Captura eventos de tecla pressionada no teclado
document.addEventListener("keydown", (e) => {
    const key = e.key; // tecla pressionada

    // Verifica se a tecla é uma seta de direção
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {

        // Envia a direção para o servidor,
        // removendo a palavra "Arrow" e transformando em maiúscula (ex: ArrowUp -> UP)
        socket.emit("direction", key.replace("Arrow", "").toUpperCase());
    }
});

document.getElementById("controls").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const dir = e.target.getAttribute("data-dir");
    if (dir) {
      socket.emit("direction", dir);
    }
  }
});


// Quando a conexão com o servidor é estabelecida
socket.on("connect", () => {
    // Atualiza o status na tela para mostrar que está conectado
    document.getElementById("status").innerText = "Conectado!";
});

// Quando o servidor envia o estado do jogo
socket.on("gameState", (state) => {
    gameState = state; // salva o estado na variável
    draw(); // chama a função que desenha o jogo na tela
});

function drawGrid() {
    const gridSize = box * 2; // espaçamento entre linhas do grid

    ctx.strokeStyle = '#333'; // cor das linhas do grid
    ctx.lineWidth = 1; // espessura da linha

    // linhas verticais
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // linhas horizontais
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Função que desenha o estado atual do jogo no canvas
function draw() {
    if (!gameState) return; // Se não tem estado, não desenha nada

    // Limpa todo o canvas para desenhar o próximo frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha o grid
    drawGrid();

    // Define cor vermelha para a comida
    ctx.fillStyle = "#f00";

    // Desenha a comida no canvas,
    // multiplicando x e y pelo tamanho da caixa para alinhar no grid
    ctx.fillRect(gameState.food.x * box, gameState.food.y * box, box, box);

    // Para cada jogador no objeto players (id => jogador)
    for (const [id, player] of Object.entries(gameState.players)) {
        const snake = player.snake; // array dos segmentos da cobra

        // Usa a cor do jogador recebida do servidor
        ctx.fillStyle = player.color || "#00f"; // azul padrão se não tiver cor

        // Desenha cada segmento da cobra
        for (let segment of snake) {
            ctx.fillRect(segment.x * box, segment.y * box, box, box);
        }
    }
}
