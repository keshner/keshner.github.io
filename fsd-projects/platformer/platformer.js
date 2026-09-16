var cannonImage;

const winStreakStorageKey = "platformerWinStreak";
const checkpointStorageKey = "platformerCheckpoint";
const startingTime = 120;
const startingFlightFuel = 420;
const powerUpIntervalFrames = frameRate * 30;
const powerUpDurationFrames = frameRate * 15;
let winStreak = Number(localStorage.getItem(winStreakStorageKey)) || 0;
let winStreakRecordedForCurrentGame = false;
let timeRemaining = startingTime;
let flightFuel = startingFlightFuel;
let comboCount = 0;
let comboScore = 0;
let checkpointReached = false;
let finalChallengeComplete = false;
let secretEndingFound = false;
let secretWinAnimation = false;
let secretQuestionAnswered = false;
let featureFrameCount = 0;
let restartGame;
let winCheatBuffer = "";
let gamePaused = false;
let nextPowerUpFrame = powerUpIntervalFrames;
let invincibilityFrames = 0;
const movingEnemy = {
  x: 1040,
  y: 370,
  width: 42,
  height: 42,
  minX: 1000,
  maxX: 1160,
  speed: 2.2,
};
const finalChallenge = { x: 1170, y: 350, width: 36, height: 100 };
const secretEnding = { x: 1280, y: 600, width: 120, height: 100 };

function recordWinStreak() {
  if (winStreakRecordedForCurrentGame) {
    return;
  }

  winStreak += 1;
  winStreakRecordedForCurrentGame = true;
  localStorage.setItem(winStreakStorageKey, winStreak);
}

function resetWinStreak() {
  winStreak = 0;
  winStreakRecordedForCurrentGame = false;
  localStorage.removeItem(winStreakStorageKey);
}

function clearCheckpoint() {
  localStorage.removeItem(checkpointStorageKey);
}

function getSavedCheckpoint() {
  const savedCheckpoint = localStorage.getItem(checkpointStorageKey);
  return savedCheckpoint ? JSON.parse(savedCheckpoint) : null;
}

function breakCombo() {
  comboCount = 0;
}

function registerCollectablePickup() {
  comboCount += 1;
  comboScore += comboCount * 100;
}

function showPowerUpChoice() {
  gamePaused = true;
  $("#powerUpChoice").prop("hidden", false);
}

function applyPowerUp(choice) {
  if (choice === "shield") {
    invincibilityFrames = powerUpDurationFrames;
  }

  if (choice === "boost") {
    timeRemaining = Math.min(startingTime, timeRemaining + 20);
    flightFuel = startingFlightFuel;
    comboScore += 500;
  }

  if (choice === "risk") {
    clearCheckpoint();
    checkpointReached = false;
    comboCount = 0;
    comboScore = 0;
    timeRemaining = Math.max(0, timeRemaining - 20);
    player.x = 50;
    player.y = 100;
  }

  gamePaused = false;
  $("#powerUpChoice").prop("hidden", true);
}

function handleWinCheat(event) {
  if (event.key.length !== 1) {
    return;
  }

  winCheatBuffer = (winCheatBuffer + event.key.toLowerCase()).slice(-3);
  if (winCheatBuffer === "win") {
    winCheatBuffer = "";
    event.preventDefault();
    gamePaused = false;
    $("#secretQuestion").prop("hidden", true);
    $("#powerUpChoice").prop("hidden", true);
    player.deadAndDeathAnimationDone = false;
    currentAnimationType = animationTypes.frontIdle;
    secretEndingFound = false;
    timeRemaining = Math.max(timeRemaining, 1);
    player.winConditionMet = true;
  }
}

function showSecretQuestion() {
  $("#secretQuestion").prop("hidden", false);
  $("#secretAnswer").trigger("focus");
}

function updatePlatformerFeatures() {
  if (currentAnimationType === animationTypes.frontDeath) {
    return;
  }

  featureFrameCount += 1;
  timeRemaining -= 1 / frameRate;

  if (featureFrameCount >= nextPowerUpFrame) {
    nextPowerUpFrame += powerUpIntervalFrames;
    showPowerUpChoice();
    return;
  }

  if (invincibilityFrames > 0) {
    invincibilityFrames -= 1;
  }

  if (timeRemaining <= 0) {
    timeRemaining = 0;
    currentAnimationType = animationTypes.frontDeath;
    frameIndex = 0;
    breakCombo();
    return;
  }

  if (player.canFly && !player.onGround && (keyPress.up || keyPress.space)) {
    flightFuel = Math.max(0, flightFuel - 1);
  }

  if (player.x >= 900 && !checkpointReached) {
    checkpointReached = true;
    localStorage.setItem(
      checkpointStorageKey,
      JSON.stringify({ x: 900, y: 220 }),
    );
  }

  movingEnemy.x += movingEnemy.speed;
  if (movingEnemy.x >= movingEnemy.maxX || movingEnemy.x <= movingEnemy.minX) {
    movingEnemy.speed *= -1;
  }

  if (
    player.x + hitBoxWidth > movingEnemy.x &&
    player.x < movingEnemy.x + movingEnemy.width &&
    player.y + hitBoxHeight > movingEnemy.y &&
    player.y < movingEnemy.y + movingEnemy.height &&
    invincibilityFrames === 0
  ) {
    currentAnimationType = animationTypes.frontDeath;
    frameIndex = 0;
    breakCombo();
  }

  if (
    player.x + hitBoxWidth > finalChallenge.x &&
    player.x < finalChallenge.x + finalChallenge.width &&
    player.y + hitBoxHeight > finalChallenge.y &&
    player.y < finalChallenge.y + finalChallenge.height
  ) {
    finalChallengeComplete = true;
    checkForWin();
  }

  if (
    player.x + hitBoxWidth > secretEnding.x &&
    player.x < secretEnding.x + secretEnding.width &&
    player.y + hitBoxHeight > secretEnding.y &&
    player.y < secretEnding.y + secretEnding.height &&
    player.x + hitBoxWidth >= canvas.width - 2
  ) {
    if (!secretQuestionAnswered) {
      secretQuestionAnswered = true;
      showSecretQuestion();
    }
  }

  if (featureFrameCount % (frameRate * 10) === 0) {
    for (let i = 0; i < cannons.length; i++) {
      cannons[i].timeBetweenShots = Math.max(
        24,
        cannons[i].timeBetweenShots - 2,
      );
    }
  }
}

function drawFeatureHUD() {
  ctx.fillStyle = "#202737";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(`Time: ${Math.ceil(timeRemaining)}`, 24, 64);
  ctx.fillText(
    `Flight: ${Math.ceil((flightFuel / startingFlightFuel) * 100)}%`,
    24,
    88,
  );
  ctx.fillText(`Combo: ${comboCount}`, 24, 112);
  ctx.fillText(`Bonus: ${comboScore}`, 24, 136);
  if (checkpointReached) {
    ctx.fillText("Checkpoint reached", 24, 160);
  }
}

function drawPlatformerFeatures() {
  ctx.fillStyle = "#d94f4f";
  ctx.fillRect(
    movingEnemy.x,
    movingEnemy.y,
    movingEnemy.width,
    movingEnemy.height,
  );
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(
    finalChallenge.x,
    finalChallenge.y,
    finalChallenge.width,
    finalChallenge.height,
  );
  ctx.fillStyle = "#202737";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("FINAL", finalChallenge.x - 2, finalChallenge.y - 8);
  ctx.fillStyle = "rgba(242, 193, 78, 0.05)";
  ctx.fillRect(
    secretEnding.x,
    secretEnding.y,
    secretEnding.width,
    secretEnding.height,
  );
  ctx.strokeStyle = "rgba(242, 193, 78, 0.14)";
  ctx.strokeRect(
    secretEnding.x,
    secretEnding.y,
    secretEnding.width,
    secretEnding.height,
  );
}

function drawWinStreak() {
  ctx.fillStyle = "#202737";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(`Win streak: ${winStreak}`, 24, 38);
}

$(function () {
  // initialize canvas and context when able to
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  cannonImage = document.getElementById("cannon");
  window.addEventListener("load", loadJson);

  function setup() {
    if (firstTimeSetup) {
      halleImage = document.getElementById("player");
      projectileImage = document.getElementById("projectile");
      $(document).on("keydown", handleKeyDown);
      $(document).on("keydown", handleWinCheat);
      $(document).on("keyup", handleKeyUp);
      $("#restartButton").on("click", function () {
        resetWinStreak();
        clearCheckpoint();
        restartGame();
      });
      $("#fullscreenButton").on("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.querySelector(".game-shell").requestFullscreen();
        }
      });
      document.addEventListener("fullscreenchange", function () {
        $("#fullscreenButton").text(
          document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen",
        );
      });
      $("#secretQuestionForm").on("submit", function (event) {
        event.preventDefault();
        const answer = $("#secretAnswer").val().trim();
        if (!answer) {
          $("#secretAnswer").trigger("focus");
          return;
        }
        $("#secretQuestion").prop("hidden", true);
        if (answer === "67") {
          const checkpoint = getSavedCheckpoint() || { x: 900, y: 220 };
          player.x = checkpoint.x;
          player.y = checkpoint.y;
          player.speedX = 0;
          player.speedY = 0;
          checkpointReached = true;
          secretQuestionAnswered = false;
          return;
        }
        if (answer.toLowerCase() === "i am jus goated") {
          secretWinAnimation = true;
          secretEndingFound = true;
          player.winConditionMet = true;
          return;
        }
        secretWinAnimation = false;
        secretEndingFound = false;
        player.winConditionMet = false;
        currentAnimationType = animationTypes.frontDeath;
        frameIndex = 0;
      });
      $(".power-up-option").on("click", function () {
        applyPowerUp($(this).data("powerUp"));
      });
      firstTimeSetup = false;
      //start game
      setInterval(main, 1000 / frameRate);
    }

    // Create walls - do not delete or modify this code
    createPlatform(-50, -50, canvas.width + 100, 50); // top wall
    createPlatform(
      -50,
      canvas.height - 10,
      canvas.width + 100,
      200,
      "rgb(118, 0, 233)",
    ); // bottom wall
    createPlatform(-50, -50, 50, canvas.height + 500); // left wall
    createPlatform(canvas.width, -50, 50, canvas.height + 100); // right wall

    //////////////////////////////////
    // ONLY CHANGE BELOW THIS POINT //
    //////////////////////////////////

    const savedCheckpoint = getSavedCheckpoint();
    if (savedCheckpoint) {
      player.x = savedCheckpoint.x;
      player.y = savedCheckpoint.y;
      checkpointReached = true;
    }

    // TODO 1 - Enable the Grid
    toggleGrid();

    // TODO 2 - Create Platforms
    // A stepped route leads from the spawn point to the diamond.
    createPlatform(0, 700, 230, 40, "#52616b");
    createPlatform(300, 625, 150, 25, "#52616b");
    createPlatform(530, 550, 150, 25, "#52616b");
    createPlatform(760, 475, 150, 25, "#52616b");
    createPlatform(980, 430, 200, 25, "#52616b");
    createPlatform(830, 315, 150, 25, "#52616b");
    createPlatform(600, 240, 150, 25, "#52616b");
    createPlatform(330, 170, 180, 25, "#52616b");
    createPlatform(440, 485, 110, 10, "#6c8796", 400, 520, 1.4, 485, 485, 0);
    createBadPlatform(455, 685, 75, 15, "#d94f4f");
    createBadPlatform(605, 395, 70, 15, "#d94f4f");

    // TODO 3 - Create Collectables
    createCollectable("diamond", 390, 115);
    createCollectable("grace", 1020, 375, 0, 1, 990, 1120, 1.2);
    createCollectable("max", 870, 260);
    createCollectable("steve", 650, 185);

    // Secret hidden above the upper route — reaching it takes an extra jump.
    createSecret(790, 245, 22, 22, "rgba(155, 175, 195, 0.08)");

    // TODO 4 - Create Cannons
    createCannon("top", 680, 1050, 24, 24, 500, 900, 1.2);
    createCannon("right", 300, 1400, 24, 24, 250, 550, 1);
    createCannon("left", 470, 1800, 24, 24, 300, 650, 0.9);

    //////////////////////////////////
    // ONLY CHANGE ABOVE THIS POINT //
    //////////////////////////////////
  }

  restartGame = function () {
    player.x = 50;
    player.y = 100;
    player.speedX = 0;
    player.speedY = 0;
    player.onGround = false;
    player.facingRight = true;
    player.deadAndDeathAnimationDone = false;
    player.winConditionMet = false;
    player.canFly = false;
    currentAnimationType = animationTypes.run;
    frameIndex = 0;
    timeRemaining = startingTime;
    flightFuel = startingFlightFuel;
    comboCount = 0;
    comboScore = 0;
    winStreakRecordedForCurrentGame = false;
    checkpointReached = false;
    finalChallengeComplete = false;
    secretEndingFound = false;
    secretWinAnimation = false;
    secretQuestionAnswered = false;
    gamePaused = false;
    nextPowerUpFrame = powerUpIntervalFrames;
    invincibilityFrames = 0;
    $("#secretQuestion").prop("hidden", true);
    $("#secretAnswer").val("");
    $("#powerUpChoice").prop("hidden", true);
    featureFrameCount = 0;
    movingEnemy.x = 1040;
    movingEnemy.speed = 2.2;
    platforms = [];
    fakePlatforms = [];
    badPlatforms = [];
    secrets = [];
    cannons = [];
    projectiles = [];
    collectables = [];
    setup();
  };

  registerSetup(setup);
});
