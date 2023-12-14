/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MazeScene } from 'scenes';
import {
    handleKeyDown,
    handleKeyUp,
    updateScore,
    updateAttributes,
    handleMenus,
    updateStats,
} from './js/handlers';
import * as pages from './js/pages.js';
import './styles.css';
import globalVars from './js/globalVars.js';

// ******** Global Vars ***********
const keypress = {
    ' ': 0,
    up: 0,
    down: 0,
    left: 0,
    right: 0,
}; // dict that stores which keys are pressed
//dict storing menus
const menus = {
    main: true,
    lose: false,
    win: false,
    pause: false,
};

// ******** Initialize Core ThreeJS components ***********

const camera = new PerspectiveCamera(65);
const scene = new MazeScene(keypress, camera);
const renderer = new WebGLRenderer({ antialias: true });

// ******** Camera ***********
const cameraOffset = new Vector3(-5, 10, 0);
camera.position.add(cameraOffset);
// camera.lookAt(new Vector3(40, 40, 40));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// ******** Controls ***********
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
// disable camera panning by user
controls.enabled = true;
controls.minDistance = 4;
controls.maxDistance = 16;
controls.update();

// ******** Render Loop ***********
let prevTimestamp = 0;
const onAnimationFrameHandler = (timeStamp) => {
    controls.update();

    // Update scene based on player movement
    let playerPosition = new Vector3();
    let player = scene.getPlayer();
    player.getWorldPosition(playerPosition);
    scene.update &&
        scene.update(
            Math.round(playerPosition.x),
            Math.round(playerPosition.z),
            timeStamp - prevTimestamp,
            renderer
        );

    camera.position.copy(playerPosition).add(cameraOffset);
    camera.lookAt(playerPosition);
    renderer.render(scene, camera);

    // update score and attributes
    if (!(menus['main'] || menus['lose'] || menus['win'] || menus['pause'])) {
        updateStats(document);
    }
    window.requestAnimationFrame(onAnimationFrameHandler);
    prevTimestamp = timeStamp;
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
// ******** Handlers ***********
window.addEventListener('resize', windowResizeHandler, false);
window.addEventListener(
    'keydown',
    (event) => handleKeyDown(event, keypress),
    false
);
window.addEventListener(
    'keyup',
    (event) => handleKeyUp(event, keypress),
    false
);
window.addEventListener(
    'keydown',
    (event) => handleMenus(document, event, menus, canvas),
    false
);
// ******** INIT ***********
pages.initIcons(document);
//pages.game(document, canvas);
pages.main(document);
