class Virus {
    constructor(model, life, speed) {
        this.model = model;
        this.life = life;
        this.speed = speed;
        this.stepPathI = -1;
    }

    moveToNextPathStep(pathPoints) {
        this.stepPathI++
        if (pathPoints.length > this.stepPathI) {
            this.model.position.x = pathPoints[this.stepPathI].x;
            this.model.position.z = pathPoints[this.stepPathI].z;
        } else {
            this.model.isVisible = false;
        }
    }
}

//Can make actions every x milleseconds y times
function setIntervalX(callback, delay, repetition) {
    var x = 0;
    var intervalID = setInterval(function () {
        callback()
        if (++x === repetition) {
            clearInterval(intervalID);
        }
    }, delay);
}

function createClonedVirus(scene, originalVirus, towerLevel1, virus_array) {
    return function () {
        if (!scene.isReady()) return;
        let virusCopy = Object.assign(new Virus, originalVirus);
        virusCopy.model = originalVirus.model.clone("Virus " + virus_array.length);
        virusCopy.model.isVisible = true;
        virusCopy.model.material = towerLevel1;
        virus_array.push(virusCopy);
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
        engine.enableOfflineSupport = false;

        // LIGHT
        new BABYLON.PointLight("light", new BABYLON.Vector3(50, 30, 30), scene);
        new BABYLON.PointLight("light2", new BABYLON.Vector3(-230, 30, 180), scene);

        // GRAVITY
        scene.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // CAMERA
        const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 50, 0), scene);
        camera.cameraDirection = new BABYLON.Vector3(5, 0, 10)

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
        camera.keysUpward.push(32) // SpaceBar
        camera.keysDownward.push(16) // Shift


        // CONSTRUCTIONS
        // Materials
        var turretLevel1 = new BABYLON.StandardMaterial("material", scene);
        turretLevel1.emissiveColor = new BABYLON.Color3(0.9, 0.4, 0.9);

        var towerLevel2 = new BABYLON.StandardMaterial("material", scene);
        towerLevel2.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.9);

        var testMaterial = new BABYLON.StandardMaterial("material", scene);
        testMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.4, 0.3);


        //create the hex grid
        createHexGrid(gridSize, hexHeightSize, hexWidthDistance, hexHeightDistance, rowLengthAddition, hexSpacing, scene);

        let firstHexaMesh = scene.getMeshByName("hexTile_0-0");
        //firstHexaMesh.material = testMaterial;
        let middleHexaMesh = scene.getMeshByName("hexTile_" + (gridSize - 1) + "-" + (gridSize - 1));
        //middleHexaMesh.material = testMaterial;

        // VIRUS' PATH
        let points = [];
        let hexSelectedPath = ["hexTile_18-3", "hexTile_17-4", "hexTile_17-5", "hexTile_17-6", "hexTile_16-7", "hexTile_16-8", "hexTile_15-9", "hexTile_15-10", "hexTile_14-11", "hexTile_13-12", "hexTile_13-13", "hexTile_12-14", "hexTile_11-15", "hexTile_10-15", "hexTile_9-16", "hexTile_8-15", "hexTile_8-14", "hexTile_9-14", "hexTile_10-13", "hexTile_10-12", "hexTile_11-11", "hexTile_11-10", "hexTile_12-9", "hexTile_12-8", "hexTile_13-7", "hexTile_13-6", "hexTile_13-5", "hexTile_12-5", "hexTile_11-6", "hexTile_10-7", "hexTile_9-8", "hexTile_9-9", "hexTile_8-9", "hexTile_7-9", "hexTile_6-8", "hexTile_5-8", "hexTile_4-7", "hexTile_4-6", "hexTile_3-5", "hexTile_2-4", "hexTile_2-3", "hexTile_1-2", "hexTile_1-1", "hexTile_0-0"]
        for (let meshName of hexSelectedPath) {
            let mesh = scene.getMeshByName(meshName);
            mesh.material = testMaterial;
            points.push(mesh.position);
        }

        //VIRUS
        //first virus (used for cloning)
        let virusSize = 6;
        let originalVirusMesh = BABYLON.MeshBuilder.CreateBox("virus_ORIGINAL", {size: virusSize}, scene); //make a box
        let originalVirus = new Virus(originalVirusMesh, 20, 4) //Instantiate an object to save more information
        originalVirus.model.position = middleHexaMesh.position.clone(); //put the box at the middle of the map
        originalVirus.model.position.y = hexHeightSize / 2 + virusSize / 2;
        originalVirus.model.isVisible = false;


        //clone virus and put the copies into virus_array 50 times with 100 ms delay
        setIntervalX(createClonedVirus(scene, originalVirus, turretLevel1, virus_array), 100, 50);


        //first turret lv1 (used for cloning)
        let turretSize = hexHeightSize * 3;
        let originalTurretMesh = BABYLON.MeshBuilder.CreateCylinder("turretLv1_ORIGINAL", {
            height: turretSize,
            diameter: (hexHeightDistance - hexSpacing) * 0.20,
            tessellation: 6,
            updatable: true
        }, scene);
        var originalTurret = {model: originalTurretMesh, power: 5, fireRate: 4, projectileSpeed: 9}; //create an object to save more information
        originalTurret.model.position = middleHexaMesh.position.clone(); //put the box at the middle of the map
        originalTurret.model.position.y = hexHeightSize / 2 + turretSize / 2;
        originalTurret.model.isVisible = false;

        //handling of hex tile picking
        scene.onPointerDown = function (event, pickResult) {
            let pickedMesh = pickResult.pickedMesh
            // If a Mesh is picked with Left clic (main button)
            // 1 -> Middle Clic, 2 -> right Clic
            if (pickedMesh && event.button === 0) {
                let state = pickedMesh.state;
                console.log("You picked the " + pickedMesh.name + " it has the state : " + state);
                switch (pickedMesh.state) {
                    case "Buildable" :
                        // We copy the Original Turret to create a new fresh one.
                        let turretCopy = Object.assign({}, originalTurret);
                        turretCopy.model = originalTurret.model.clone("turretLv1On" + pickedMesh.name)
                        turretCopy.model.position.copyFrom(pickedMesh.position);
                        turretCopy.model.material = turretLevel1;
                        turretCopy.model.isVisible = true;

                        turrets_array.push(turretCopy);

                        //Update the "placeholder" mesh under the turret from "Buildable" to "TurretLv1".
                        pickedMesh.state = "TurretLv1";
                        //console.log("Building a Level 1 turret on top of " + pickedMesh.name)
                        break;
                    case "TurretLv1" :
                        let turretLv1 = scene.getMeshByName("turretLv1On" + pickedMesh.name);
                        turretLv1.name = "turretLv2On" + pickedMesh.name;
                        turretLv1.material = towerLevel2;
                        turretLv1.position.y += hexHeightSize;

                        //Update the "placeholder" mesh under the turret from "TurretLv1" to "TurretLv2".
                        pickedMesh.state = "TurretLv2";
                        //console.log("Building a Level 2 turret on top of " + pickedMesh.name)
                        break;
                    case "TurretLv2" :
                        console.log("You can't upgrade this turret");
                }

                if (state !== pickedMesh.state) {
                    console.log("new State = " + pickedMesh.state);
                }

            }
        };

        // Code in this function will run ~60 times per second
        scene.registerBeforeRender(function () {
            // Move all viruses
            for (let virus of virus_array) {
                virus.moveToNextPathStep(points);
            }
        });


        return scene;
    };

    var virus_array = []; //array when we put all virus
    var turrets_array = []; //array when we put all turrets

    let scene = createScene();

    engine.runRenderLoop(function () {
        scene.render();
    });
});
