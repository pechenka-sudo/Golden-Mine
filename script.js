let miner = document.getElementById("miner");
let gold = document.getElementById("gold");
let scoreText = document.getElementById("score");
let goldSound = document.getElementById("goldSound");

let score = 0;

// Случайная позиция золота
function placeGold() {
    let x = Math.floor(Math.random() * 370);
    let y = Math.floor(Math.random() * 370);
    gold.style.left = x + "px";
    gold.style.top = y + "px";
}

// Управление шахтёром
document.addEventListener("keydown", function(e) {
    let minerPos = miner.getBoundingClientRect();
    let gamePos = document.getElementById("game").getBoundingClientRect();

    if (e.key === "ArrowLeft" && miner.offsetLeft > 0) miner.style.left = miner.offsetLeft - 10 + "px";
    if (e.key === "ArrowRight" && miner.offsetLeft < 350) miner.style.left = miner.offsetLeft + 10 + "px";
    if (e.key === "ArrowUp" && miner.offsetTop > 0) miner.style.top = miner.offsetTop - 10 + "px";
    if (e.key === "ArrowDown" && miner.offsetTop < 350) miner.style.top = miner.offsetTop + 10 + "px";

    checkCollision();
});

// Проверка столкновения
function checkCollision() {
    let minerRect = miner.getBoundingClientRect();
    let goldRect = gold.getBoundingClientRect();

    if (
        minerRect.x < goldRect.x + goldRect.width &&
        minerRect.x + minerRect.width > goldRect.x &&
        minerRect.y < goldRect.y + goldRect.height &&
        minerRect.y + minerRect.height > goldRect.y
    ) {
        score++;
        scoreText.innerText = "Золота: " + score;
        goldSound.play();
        placeGold();
    }
}

placeGold();
