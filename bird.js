// Canvas and game board setup
let board, context;
let boardWidth = Math.min(window.innerWidth, 1000); // Max width capped at 1000px for responsiveness
let boardHeight = window.innerHeight;               // Full height of device screen

// Bird setup
let bird = {
  x: boardWidth / 8,                      // Horizontal position
  y: boardHeight / 2,                     // Vertical start position (centered)
  width: 44,
  height: 34
};
let birdImg = new Image();
birdImg.src = "Images/bird.png";

// Pipe setup
let topPipeImg = new Image();
topPipeImg.src = "./Images/top.jpeg";
let bottomPipeImg = new Image();
bottomPipeImg.src = "./Images/bottom.jpeg";

let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;

// Game physics
let velocityX = -2;     // Speed at which pipes move left
let velocityY = 0;      // Bird's vertical velocity (affected by jump and gravity)
let gravity = 0.2;

// Score tracking
let score = 0;
let highScore = 0;
let highScorePlayer = "Unknown";
let gameOver = false;

// Firebase variables
let playerName = "";
let playerId = "";
let db, scoresRef;

// Sound effects
let wingSound = new Audio("Images/flap-101soundboards.mp3");
let hitSound = new Audio("Images/flappy-bird-hit-sound-101soundboards.mp3");
let bgm = new Audio("Images/untitled_3.mp3");

// Called when user clicks "Start Game"
function startGame() {
  const nameInput = document.getElementById("playerName");
  playerName = nameInput.value.trim();
  if (!playerName) return alert("Please enter your name!");

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("board").style.display = "block";

  // Firebase configuration
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

  // Fetch highest score from Firebase
  scoresRef.orderByChild("score").limitToLast(1).once("value", snapshot => {
    snapshot.forEach(child => {
      highScore = child.val().score;
      highScorePlayer = child.val().name;
    });
  });

  initGame();
}

// Initialize game canvas and listeners
function initGame() {
  board = document.getElementById("board");
  board.width = boardWidth;
  board.height = boardHeight;
  context = board.getContext("2d");

  // Controls
  document.addEventListener("keydown", moveBird);
  document.addEventListener("touchstart", moveBird, { passive: false });

  requestAnimationFrame(update); // Start game loop
  startPipeSpawner();            // Start pipe generation loop
}

// Main game loop
function update() {
  if (gameOver) return;

  // Increase pipe speed as score increases
  if (score > 15) velocityX = -4;
  else if (score > 5) velocityX = -3;
  else velocityX = -2;

  // Gravity effect on bird
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0); // Prevent bird from going above screen

  if (bird.y > boardHeight) {
    handleGameOver(); // Bird falls below screen
    return;
  }

  // Clear canvas for redraw
  context.clearRect(0, 0, board.width, board.height);

  // Draw bird
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // Move and draw pipes
  for (let pipe of pipeArray) {
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    // Increase score if bird passes pipe
    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5;
      pipe.passed = true;
    }

    // Collision detection
    if (detectCollision(bird, pipe)) {
      handleGameOver();
      return;
    }
  }

  // Remove off-screen pipes
  pipeArray = pipeArray.filter(pipe => pipe.x > -pipeWidth);

  // Display scores
  context.fillStyle = "white";
  context.font = "20px Arial";
  context.fillText(`Score: ${Math.floor(score)}`, 10, 30);
  context.fillText(`High: ${highScore} (${highScorePlayer})`, 10, 55);

  requestAnimationFrame(update); // Continue loop
}

// Generate pipe pairs
function placePipes() {
  if (gameOver) return;

  // Adjust vertical gap based on difficulty
  let gap = boardHeight / 3.2;
  if (score > 25) gap = boardHeight / 4; // smaller gap => harder

  let pipeY = Math.random() * (-pipeHeight / 2);

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

// Bird movement (jump)
function moveBird(event) {
  if (event.cancelable) event.preventDefault();

  // Restart game if over
  if (gameOver) {
    restartGame();
    return;
  }

  // Flap on space, arrow up, or tap
  if (event.code === "Space" || event.code === "ArrowUp" || event.type === "touchstart") {
    wingSound.currentTime = 0;
    wingSound.play();
    bgm.play();
    velocityY = -4; // jump
  }
}

// Collision detection using bounding box
function detectCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// End game logic
function handleGameOver() {
  if (gameOver) return;
  gameOver = true;

  // Stop sounds
  bgm.pause();
  bgm.currentTime = 0;
  wingSound.pause();
  wingSound.currentTime = 0;
  hitSound.play();

  // Save score to Firebase
  db.ref("scores/" + playerId).set({
    name: playerName,
    score: Math.floor(score),
    timestamp: Date.now()
  });

  if (score > highScore) {
    highScore = Math.floor(score);
    highScorePlayer = playerName;
  }

  // Show game over message
  setTimeout(() => {
    context.fillStyle = "white";
    context.font = "24px Arial";
    context.fillText("GAME OVER! Tap or press to restart", boardWidth / 2 - 160, boardHeight / 2);
  }, 100);
}

// Reset all values and restart game
function restartGame() {
  bird.y = boardHeight / 2;
  pipeArray = [];
  score = 0;
  velocityY = 0;
  gameOver = false;

  bgm.pause();
  bgm.currentTime = 0;
  bgm.play();

  requestAnimationFrame(update);
}

// Pipe spawning loop (calls placePipes repeatedly)
function startPipeSpawner() {
  function spawn() {
    if (!gameOver) placePipes();

    // Reduce pipe spawn interval for challenge
    let interval = 1500;
    if (score > 16) interval = 1100;
    if (score > 25) interval = 900;

    setTimeout(spawn, interval);
  }

  spawn();
}
