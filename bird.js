let board, context;
let boardWidth = 550, boardHeight = 650;

let bird = {
    x: boardWidth / 8,
    y: boardHeight / 2,
    width: 44,
    height: 34
};

let birdImg = new Image();
birdImg.src = 'Images/bird.png';

let pipeArray = [];
let pipeWidth = 64, pipeHeight = 512;
let velocityX = -2, velocityY = 0, gravity = 0.2;

let score = 0, highScore = 0;
let gameOver = false;
let highScorePlayer = "Unknown";

let topPipeImg = new Image();
topPipeImg.src = "Images/top.jpeg";

let bottomPipeImg = new Image();
bottomPipeImg.src = "Images/bottom.jpeg";

let playerName = "";
let playerId = "";
let db, scoresRef;

// Sounds
let wingSound = new Audio("Images/flap-101soundboards.mp3");
let hitSound = new Audio("Images/flappy-bird-hit-sound-101soundboards.mp3");
let bgm = new Audio("Images/untitled_3.mp3");

function startGame() {
    const nameInput = document.getElementById("playerName");
    playerName = nameInput.value.trim();
    if (!playerName) return alert("Please enter your name!");

    document.getElementById("startScreen").style.display = "none";
    document.getElementById("board").style.display = "block";

    // ✅ Firebase Config and Initialization
    const firebaseConfig = {
        apiKey: "AIzaSyCgD6u1ynK5BK5KlesHBcGfrwmlAR5_BqY",
        authDomain: "flippy-bird-d5e72.firebaseapp.com",
        databaseURL: "https://flippy-bird-d5e72-default-rtdb.firebaseio.com",
        projectId: "flippy-bird-d5e72",
        storageBucket: "flippy-bird-d5e72.appspot.com",
        messagingSenderId: "485763166501",
        appId: "1:485763166501:web:8e3888ff051e0f82002acc"
    };

    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    scoresRef = db.ref("scores");

    playerId = scoresRef.push().key;

    scoresRef.orderByChild("score").limitToLast(1).once("value", snapshot => {
        snapshot.forEach(child => {
            highScore = child.val().score;
            highScorePlayer = child.val().name;
        });
    });

    initGame();
}

function initGame() {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    document.addEventListener("keydown", moveBird);
    document.addEventListener("touchstart", moveBird);

    requestAnimationFrame(update);
    startPipeSpawner(); // ✅ starts dynamic spawning loop
}

function update() {
    // Adjust pipe speed based on score
    if (score > 5 && score <= 13) {
        velocityX = -3;
    } else if (score > 13 && score <= 25) {
        velocityX = -3.5;
    } else if (score > 25) {
        velocityX = -4;
    } else {
        velocityX = -2;
    }

    requestAnimationFrame(update);
    if (gameOver) return;

    context.clearRect(0, 0, board.width, board.height);

    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) handleGameOver();

    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) handleGameOver();
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Draw score
    context.fillStyle = "white";
    context.font = "28px sans-serif";
    context.fillText("Score: " + score, 15, 30);
    context.fillText("High: " + highScore + " (" + highScorePlayer + ")", 15, 60);

    if (gameOver) {
        context.fillText("GAME OVER!", 140, 300);
    }
}

function placePipes() {
    if (gameOver) return;

    // Adjust gap based on score
    let gap;
    if (score > 25) {
        gap = board.height / 3.8;
    } else if (score > 13) {
        gap = board.height / 3.5;
    } else {
        gap = board.height / 3;
    }

    let pipeY = 0 - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

    pipeArray.push({
        img: topPipeImg,
        x: boardWidth,
        y: pipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    });

    pipeArray.push({
        img: bottomPipeImg,
        x: boardWidth,
        y: pipeY + pipeHeight + gap,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    });
}

function moveBird(event) {
    bgm.play();
    if (event.code === "Space" || event.code === "ArrowUp" || event.type === "touchstart") {
        wingSound.play();
        velocityY = -4;
    }

    if (gameOver) {
        bird.y = boardHeight / 2;
        pipeArray = [];
        score = 0;
        velocityY = 0;
        gameOver = false;
        bgm.currentTime = 0;
        bgm.play();
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function handleGameOver() {
    gameOver = true;
    bgm.pause();
    wingSound.pause();
    hitSound.play();

    //  Delay writing to Firebase to ensure final score is accurate
    setTimeout(() => {
        db.ref("scores/" + playerId).set({
            name: playerName,
            score: score,
            timestamp: Date.now()
        });

        //  Update local high score
        if (score > highScore) {
            highScore = score;
            highScorePlayer = playerName;
        }
    }, 300); // delay of 300ms
}


function startPipeSpawner() {
    function spawn() {
        if (!gameOver) placePipes();

        // Adjust pipe spawn speed
        let delay = 1500;
        if (score > 5 && score <= 13) delay = 1200;
        else if (score > 13 && score <= 25) delay = 1000;
        else if (score > 25) delay = 800;

        setTimeout(spawn, delay);
    }

    spawn();
}
