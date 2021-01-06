/*
* hexSpacing isn't really a borderSpacing, it reduce the actual size of the hexagons...
*
* A well written and interactive article about hexagonal grids :
* https://www.redblobgames.com/grids/hexagons
* */
function createHexGrid(gridSize, hexHeightSize, hexWidthDistance, hexHeightDistance, rowLengthAddition, hexSpacing, scene) {
    let gridStart = new BABYLON.Vector3(0, 0, 0);
    let originalHexagon = BABYLON.MeshBuilder.CreateCylinder("hex", {
        height: hexHeightSize,
        diameter: hexHeightDistance - hexSpacing,
        tessellation: 6,
        updatable: true
    }, scene)
    originalHexagon.rotation.y += Math.PI / 6;
    originalHexagon.checkCollisions = true;
    originalHexagon.state = "Buildable";
    originalHexagon.isVisible = false;


    for (let i = 0; i < (gridSize * 2) - 1; i++) {
        for (let y = 0; y < gridSize + rowLengthAddition; y++) {
            //hexagon.material.diffuseTexture = new BABYLON.Texture("assets/images/blue.png", scene);
            let hexagon = originalHexagon.clone("hexTile" + i + y);
            hexagon.isVisible = true;
            hexagon.position.copyFrom(gridStart);
            hexagon.position.x -= hexWidthDistance * y;
        }

        if (i >= gridSize - 1) {
            rowLengthAddition -= 1;
            gridStart.x -= (hexWidthDistance / 2);
            gridStart.z += (hexHeightDistance * 0.75);
        } else {
            rowLengthAddition += 1;
            gridStart.x += hexWidthDistance / 2;
            gridStart.z += hexHeightDistance * 0.75;
        }
    }
}

