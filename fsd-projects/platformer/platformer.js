var cannonImage;

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
      $(document).on("keyup", handleKeyUp);
      $("#restartButton").on("click", function () {
        window.location.reload();
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

    // TODO 3 - Create Collectables
    createCollectable("diamond", 390, 115);

    // Secret hidden in the sky — blends into the background and grants flight
    // Place it just above a reachable platform so it can be discovered naturally.
    createSecret(1010, 390, 22, 22, "rgba(155, 175, 195, 0.55)");

    // TODO 4 - Create Cannons
    createCannon("top", 680, 1100, 24, 24, 500, 900, 1.2);
    createCannon("right", 300, 1500, 24, 24, 250, 550, 1);
    createCannon("left", 470, 1900, 24, 24, 300, 650, 0.9);

    //////////////////////////////////
    // ONLY CHANGE ABOVE THIS POINT //
    //////////////////////////////////
  }

  registerSetup(setup);
});
