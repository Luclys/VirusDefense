class StageInventory {
    constructor(virus_array, turrets_array) {
        this.life = 5;
        this.coins = 70;
        this.virus_array = virus_array; //array when we put all virus
        this.turrets_array = turrets_array; //array when we put all turrets
    }

    buildTurretOnMesh(originalTurret, pickedMesh, material = null) {
        //Update the "placeholder" mesh under the turret from "Buildable" to "TurretLv1".
        pickedMesh.state = "Turret";

        // We copy the Original Turret to create a new fresh one.
        let turret = Object.assign(new Turret(), originalTurret);

        turret.model = originalTurret.model.clone("TurretOn" + pickedMesh.name);
        turret.model.position.copyFrom(pickedMesh.position);
        turret.model.isVisible = true;
        if (material != null) turret.model.material = material;

        // Building the Turret's detection ring
        turret.createDetectionRing();

        // The turret is paid then added in the list
        turret.level = 1;
        let amount = originalTurret.cost * turret.level
        this.coins -= amount;
        turret.value += amount;

        let index = this.turrets_array.push(turret);
        turret.model.state = index - 1;
    }

    levelUpTurret(index, turretLevelMaterial = null) {
        let turret = this.turrets_array[index];
        if (turretLevelMaterial != null) turret.model.material = turretLevelMaterial;
        turret.model.position.y += 3;
        turret.level++

        turret.power += 5
        turret.fireRate += 10;
        turret.projectileSpeed += 10;
        turret.detectionRange += 50;
        turret.updateDetectionRing();

        // The level up is paid
        let amount = turret.cost * turret.level
        this.coins -= amount;
        turret.value += amount;
    }

    refundTurret(index) {
        let turret = this.turrets_array[index];
        turret.model.dispose();
        turret.detectionRingMesh.dispose();
        this.coins += turret.value;
        this.turrets_array[index] = null;
    }

    canBuildTurret(originalTurret, level) {
        return this.coins >= originalTurret.cost * level;
    }

    canUpTurret(index) {
        let turret = this.turrets_array[index];
        if (turret.level + 1 <= turret.levelMax) {
            return this.canBuildTurret(turret, turret.level + 1);
        } else return false;
    }

    looseLife(virus) {
        console.log("Le virus " + virus.model.name + " a atteint la base, vous perdez 1 point de vie.");
        this.life--;
        if (this.life <= 0) {
            console.log("You loose");
        }
    }
}

class Virus {
    constructor(model, life, speed, pathPoints) {
        this.model = model;
        this.life = life;
        this.speed = speed;
        this.pathPoints = pathPoints;
        this.stepPathI = 0;
        this.animation = null;
    }

    initiateFollowPath(stageInventory) {
        let onfulfilled = () => {
            let fromDest = Object.assign(new BABYLON.Vector3(), this.pathPoints[this.stepPathI]);
            let towards = Object.assign(new BABYLON.Vector3(), this.pathPoints[this.stepPathI + 1]);
            fromDest._y += 5;
            towards._y += 5;

            if (this.pathPoints.length - 1 > this.stepPathI) {
                this.stepPathI++;
                this.animation = BABYLON.Animation.CreateAndStartAnimation("anim", this.model, "position", this.speed, 60, fromDest, towards, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                this.animation.waitAsync().then(onfulfilled);
            } else {
                this.model.dispose();
                stageInventory.looseLife(this);
            }
        };
        onfulfilled();
    }
}

class Turret {
    constructor(model, cost, levelMax, power, fireRate, projectileSpeed, detectionRange) {
        this.model = model;
        this.cost = cost;
        this.levelMax = levelMax;
        this.power = power;
        this.fireRate = fireRate;
        this.projectileSpeed = projectileSpeed;
        this.detectionRange = detectionRange;
        this.value = 0;
        this.level = 0;
        this.detectionRingMesh = null;
    }

    createDetectionRing() {
        let scene = this.model.scene;
        this.detectionRingMesh = BABYLON.Mesh.CreateTorus("torus", this.detectionRange, 0.1, 10, scene, true);
        this.detectionRingMesh.position.copyFrom(this.model.position);
        this.detectionRingMesh.position.y = 2.5;
    }

    updateDetectionRing() {
        if (this.detectionRingMesh.diameter !== this.detectionRange) {
            this.detectionRingMesh.dispose();
            this.createDetectionRing();
        }
    }
}

function createClonedVirus(scene, originalVirus, virusMaterial, stageInventory) {
    return function () {
        if (!scene.isReady()) return;
        let virusCopy = Object.assign(new Virus, originalVirus);
        virusCopy.model = originalVirus.model.clone("Virus " + stageInventory.virus_array.length);
        virusCopy.model.isVisible = true;
        virusCopy.model.material = virusMaterial;
        virusCopy.initiateFollowPath(stageInventory);
        stageInventory.virus_array.push(virusCopy);
    };
}

window.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById('render_canvas');
    var engine = new BABYLON.Engine(canvas, true);

    var createScene = function () {
        let gridSize = 10;
        let hexHeightSize = 3;
        let hexLength = 7;
        let hexSpacing = 0.01;
        // Not actually Spacing... more like reducing the size to make the illusion it is separated. My math aren't good enough.
        let hexWidthDistance = (Math.sqrt(3) * hexLength);
        let hexHeightDistance = (2 * hexLength);
        let rowLengthAddition = 0;


        // SCENE
        var scene = new BABYLON.Scene(engine);

        // LIGHT
        new BABYLON.PointLight("light", new BABYLON.Vector3(50, 30, 30), scene);
        new BABYLON.PointLight("light2", new BABYLON.Vector3(-230, 30, 180), scene);

        // GRAVITY
        scene.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // CAMERA
        const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 50, 0), scene);
        // Enable Collisions
        camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
        scene.collisionsEnabled = true;
        camera.checkCollisions = false;

        // Custom Controls
        camera.attachControl(scene, true);
        camera.keysUp.push(90);    // Z
        camera.keysLeft.push(81);  // Q
        camera.keysDown.push(83);  // S
        camera.keysRight.push(68); // D
        camera.keysUpward.push(32); // SpaceBar
        camera.keysDownward.push(16); // Shift

        // CONSTRUCTIONS
        // Materials
        var turretLevel1Material = new BABYLON.StandardMaterial("material", scene);
        turretLevel1Material.emissiveColor = new BABYLON.Color3(0.9, 0.4, 0.9);

        var turretLevel2Material = new BABYLON.StandardMaterial("material", scene);
        turretLevel2Material.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.9);

        var testMaterial = new BABYLON.StandardMaterial("material", scene);
        testMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.4, 0.3);

        //create the hex grid
        createHexGrid(gridSize, hexHeightSize, hexWidthDistance, hexHeightDistance, rowLengthAddition, hexSpacing, scene);

        // VIRUSES' PATH
        let pathPoints = [];
        let hexSelectedPath = ["hexTile_18-3", "hexTile_17-4", "hexTile_17-5", "hexTile_17-6", "hexTile_16-7", "hexTile_16-8", "hexTile_15-9", "hexTile_15-10", "hexTile_14-11", "hexTile_13-12", "hexTile_13-13", "hexTile_12-14", "hexTile_11-15", "hexTile_10-15", "hexTile_9-16", "hexTile_8-15", "hexTile_8-14", "hexTile_9-14", "hexTile_10-13", "hexTile_10-12", "hexTile_11-11", "hexTile_11-10", "hexTile_12-9", "hexTile_12-8", "hexTile_13-7", "hexTile_13-6", "hexTile_13-5", "hexTile_12-5", "hexTile_11-6", "hexTile_10-7", "hexTile_9-8", "hexTile_9-9", "hexTile_8-9", "hexTile_7-9", "hexTile_6-8", "hexTile_5-8", "hexTile_4-7", "hexTile_4-6", "hexTile_3-5", "hexTile_2-4", "hexTile_2-3", "hexTile_1-2", "hexTile_1-1", "hexTile_0-0"];
        for (let meshName of hexSelectedPath) {
            let mesh = scene.getMeshByName(meshName);
            mesh.material = testMaterial;
            mesh.state = "path";
            pathPoints.push(mesh.position);
        }

        // VIRUS
        // first virus (used for cloning)
        let originalVirusMesh = BABYLON.MeshBuilder.CreateBox("virus_ORIGINAL", {size: 6}, scene); //make a box
        originalVirusMesh.isVisible = false;
        let originalVirus = new Virus(originalVirusMesh, 20, 300, pathPoints); //Instantiate an object to save more information

        //clone virus and put the copies into virus_array 10 times with 1000 ms delay
        setIntervalX(createClonedVirus(scene, originalVirus, turretLevel1Material, stageInventory), 1000, 10);


        // TURRETS
        // first turret lv1 (used for cloning)
        let originalTurretMesh = BABYLON.MeshBuilder.CreateCylinder("turretLv1_ORIGINAL", {
            height: hexHeightSize * 3,
            diameter: (hexHeightDistance - hexSpacing) * 0.20,
            tessellation: 6,
            updatable: true
        }, scene);
        originalTurretMesh.isVisible = false;
        var originalTurret = new Turret(originalTurretMesh, 5, 5, 5, 4, 9, 50);//create an object to save more information

        //handling of hex tile picking
        scene.onPointerDown = function (event, pickResult) {
            let pickedMesh = pickResult.pickedMesh
            // If a Mesh is picked with Left clic (main button)
            // 1 -> Middle Clic, 2 -> right Clic
            if (pickedMesh && (event.button === 0 || event.button === 2)) {
                let state = pickedMesh.state;
                console.log("You picked the " + pickedMesh.name + " it has the state : " + state, "Current coins : " + stageInventory.coins);
                switch (state) {
                    case "Buildable" :
                        if (stageInventory.canBuildTurret(originalTurret, 1)) {
                            console.log("On peut build la turret")
                            stageInventory.buildTurretOnMesh(originalTurret, pickedMesh, turretLevel1Material)
                        }
                        break;
                    case "Turret" :
                        let index = scene.getMeshByName("TurretOn" + pickedMesh.name).state;
                        if (event.button === 0) {
                            if (stageInventory.canUpTurret(index)) {
                                console.log("On peut lvlup la turret")
                                stageInventory.levelUpTurret(index, turretLevel2Material)
                            }
                        } else {
                            pickedMesh.state = "Buildable";
                            stageInventory.refundTurret(index);
                        }
                        break;
                }
                console.log("new State = " + pickedMesh.state + "Current coins : " + stageInventory.coins);
            }
        };

        // Code in this function will run ~60 times per second
        scene.registerBeforeRender(function () {
        });


        return scene;
    };

    var virus_array = new Array(Virus); //array when we put all virus
    var turrets_array = new Array(Turret); //array when we put all turrets

    var stageInventory = new StageInventory(virus_array, turrets_array);

    let scene = createScene();

    engine.runRenderLoop(function () {
        scene.render();
    });
});

//Can make actions every x milliseconds y times
function setIntervalX(callback, delay, repetition) {
    var x = 0;
    var intervalID = setInterval(function () {
        callback()
        if (++x === repetition) {
            clearInterval(intervalID);
        }
    }, delay);
}
