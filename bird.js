let board, context;
let boardWidth = Math.min(window.innerWidth, 1000);
let boardHeight = window.innerHeight;

let bird = { x: boardWidth / 8, y: boardHeight / 2, width: 44, height: 34 };
let birdImg = new Image();
birdImg.src = "Images/bird.png";

let topPipeImg = new Image();
topPipeImg.src = "Images/top.jpeg";

let bottomPipeImg = new Image();
bottomPipeImg.src = "Images/bottom.jpeg";

let pipeArray = [];
let pipeWidth = 64, pipeHeight = 512;
let velocityX = -2, velocityY = 0, gravity = 0.2;

let score = 0, highScore = 0, gameOver = false;
let highScorePlayer = "Unknown";
let playerName = "", playerId = "", db, scoresRef;

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
  startPipeSpawner();
}

function update() {
    if (gameOver) return;

  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);
  if (bird.y > boardHeight) {
    handleGameOver();
    return;
  }

  context.clearRect(0, 0, board.width, board.height);
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  for (let pipe of pipeArray) {
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5;
      pipe.passed = true;
    }
    if (detectCollision(bird, pipe)) {
        handleGameOver();
        return;
      }
  }

  pipeArray = pipeArray.filter(pipe => pipe.x > -pipeWidth);

  // Score
  context.fillStyle = "white";
  context.font = "20px Arial";
  context.fillText(`Score: ${Math.floor(score)}`, 10, 30);
  context.fillText(`High: ${highScore} (${highScorePlayer})`, 10, 55);

  if (gameOver) {
    context.fillText("GAME OVER!", boardWidth / 2 - 70, boardHeight / 2);
  }

  requestAnimationFrame(update);
}

function placePipes() {
  if (gameOver) return;
  let gap = boardHeight / 3.2;
  let pipeY = Math.random() * (-pipeHeight / 2);

  pipeArray.push({ img: topPipeImg, x: boardWidth, y: pipeY, width: pipeWidth, height: pipeHeight, passed: false });
  pipeArray.push({ img: bottomPipeImg, x: boardWidth, y: pipeY + pipeHeight + gap, width: pipeWidth, height: pipeHeight, passed: false });
}

function moveBird(event) {
    // Restart game if over
    if (gameOver) {
      restartGame();
      return;
    }
  
    // Bird jump logic
    if (event.code === "Space" || event.code === "ArrowUp" || event.type === "touchstart") {
      wingSound.currentTime = 0;
      wingSound.play();
  
      bgm.play();
      velocityY = -4;
    }
  }
  function restartGame() {
    bird.y = boardHeight / 2;
    pipeArray = [];
    score = 0;
    velocityY = 0;
    gameOver = false;
  
    wingSound.pause();
    wingSound.currentTime = 0;
  
    bgm.pause();
    bgm.currentTime = 0;
    bgm.play();
  
    requestAnimationFrame(update);
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
  bgm.timestamp = 0;
  hitSound.play();

  db.ref("scores/" + playerId).set({
    name: playerName,
    score: Math.floor(score),
    timestamp: Date.now()
  });

  if (score > highScore) {
    highScore = Math.floor(score);
    highScorePlayer = playerName;
  }
}

function startPipeSpawner() {
  function spawn() {
    if (!gameOver) placePipes();
    setTimeout(spawn, 1300);
  }
  spawn();
}
