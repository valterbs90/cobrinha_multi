
// Seleciona o canvas e define o contexto para desenho 2D
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Define o tamanho de cada quadrado (bloco do grid)
const box = 15;

// Define o tamanho total do canvas
const canvasWidth = 800;
const canvasHeight = 500;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

const rows = canvasHeight / box;
const columns = canvasWidth / box;

// Cria a cobrinha como uma lista de posições (segmentos)
let snake = [{ x: 9 * box, y: 9 * box }]; // começa no centro do canvas
let direction = "RIGHT"; // direção inicial
let score = 0;

// Gera uma posição aleatória para a comida
let food = {
    x: Math.floor(Math.random() * columns) * box,
    y: Math.floor(Math.random() * rows) * box,
};

// Adiciona um ouvinte de tecla para mudar a direção da cobrinha
document.addEventListener("keydown", changeDirection);

// Função que altera a direção com base na tecla pressionada
function changeDirection(event) {
    const key = event.key;
    if (key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    if (key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    if (key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    if (key === "ArrowDown" && direction !== "UP") direction = "DOWN";
}


function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * columns) * box,
            y: Math.floor(Math.random() * rows) * box,
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}



// Função principal de desenho que é chamada em loop
function draw() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Desenha o grid com linhas verdes escuras
    ctx.strokeStyle = "#064006"; // verde escuro
    ctx.lineWidth = 1;

    const gridSize = box * 2;

    // Desenha linhas verticais
    for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }

    // Desenha linhas horizontais
    for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }

    // Desenha a cobrinha
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "#0f0" : "#0a0"; // cabeça mais clara
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    // Desenha a comida
    ctx.fillStyle = "#f00"; // vermelha
    ctx.fillRect(food.x, food.y, box, box);

    // Calcula a nova posição da cabeça da cobrinha
    let headX = snake[0].x;
    let headY = snake[0].y;

    if (direction === "LEFT") headX -= box;
    if (direction === "UP") headY -= box;
    if (direction === "RIGHT") headX += box;
    if (direction === "DOWN") headY += box;

    // Faz a cobrinha atravessar as bordas (efeito portal)
    if (headX < 0) headX = canvasWidth  - box;
    if (headX >= canvasWidth) headX = 0;
    if (headY < 0) headY = canvasHeight  - box;
    if (headY >= canvasHeight) headY = 0;

    // Verifica apenas colisão com o próprio corpo
    if (snake.some((segment, index) => index !== 0 && segment.x === headX && segment.y === headY)) {
        clearInterval(game);
        alert("💀 Game Over! Pontuação: " + score);
        return;
    }

    // Cria a nova cabeça e adiciona ao início do array da cobrinha
    let newHead = { x: headX, y: headY };
    snake.unshift(newHead);

    // Verifica se a cobrinha comeu a comida
    if (headX === food.x && headY === food.y) {
        score++;
        document.getElementById("score").innerText = "Pontuação: " + score;

        // Gera nova comida em posição aleatória
        food =  generateFood();
    } else {
        // Remove o último segmento da cobrinha (ela anda sem crescer)
        snake.pop();
    }
}

// Inicia o loop do jogo, chamando draw() a cada 100ms
let game = setInterval(draw, 100);
