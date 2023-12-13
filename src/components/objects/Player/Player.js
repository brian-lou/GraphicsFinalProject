import { Group, Vector3, Box3, Box3Helper} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import MODEL from './pacman.glb';
import GLOBALVARS from '../../../js/globalVars';
import {MOVEMENT_EPS, MOVEMENT_FACTOR} from '../../../js/constants'

class Player extends Group {
    constructor(parent, mazeObj, keypress) {
        // Call parent Group() constructor
        super();
        this.keypress = keypress;
        this.mazeObj = mazeObj;
        // Init state
        this.state = {
            gui: parent.state.gui,
            bob: true,
            spin: (() => this.spin()), // or this.spin.bind(this)
            twirl: 0,
        };
        this.boxSize = new Vector3(0.7, 0.7, 0.7);
        this.playerBox = new Box3().setFromCenterAndSize(
            this.position,
            this.boxSize
        );
        this.helper = new Box3Helper(this.playerBox, 0x000000);
        this.renderOrder = 10;
        this.add(this.helper);
        this.add(this.playerBox)
        // Set random spawn point (for now)
        let [x,z] = mazeObj.getSpawnPoint();
        this.position.set(x, 0, z);

        this.primaryDirection = true;

        // Load object
        const loader = new GLTFLoader();
        this.name = 'player';
        loader.load(MODEL, (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.4, 0.4, 0.4);
            model.rotation.y = - Math.PI / 2; // Rotates 180 degrees around the Y axis

            // Compute bounding box for the player
            model.traverse((child) => {
                if (child.isMesh) {
                    // child.geometry.computeBoundingBox();
                }
            });
            this.add(model);
        });
        // Add self to parent's update list
        parent.addToUpdateList(this);

        // Populate GUI
        this.state.gui.add(this.state, 'bob');
        this.state.gui.add(this.state, 'spin');
    }

    spin() {
        // Add a simple twirl
        this.state.twirl += 6 * Math.PI;

        // Use timing library for more precice "bounce" animation
        // TweenJS guide: http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
        // Possible easings: http://sole.github.io/tween.js/examples/03_graphs.html
        const jumpUp = new TWEEN.Tween(this.position)
            .to({ y: this.position.y + 1 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out);
        const fallDown = new TWEEN.Tween(this.position)
            .to({ y: 0 }, 300)
            .easing(TWEEN.Easing.Quadratic.In);

        // Fall down after jumping up
        jumpUp.onComplete(() => fallDown.start());

        // Start animation
        jumpUp.start();
    }

    update(deltaT) {
        if (this.state.twirl > 0) {
            // Lazy implementation of twirl
            this.state.twirl -= Math.PI / 8;
            this.rotation.y += Math.PI / 8;
        }

        // Get most recent direction of movement
        let offset = new Vector3(0,0,0);
        let dir = "";
        let updateTime = 0;
        for (let [k,v] of Object.entries(this.keypress)){
            if (v > updateTime){
                updateTime = v;
                dir = k;
            }
        }
        if (dir == " ") return;
        let dxdz = null;
        if (dir == "up"){
            offset = new Vector3((GLOBALVARS.movementSpeed / MOVEMENT_FACTOR) * deltaT,0,0);
            dxdz = [1, 0];
        } else if (dir == "left"){
            offset = new Vector3(0,0,-(GLOBALVARS.movementSpeed / MOVEMENT_FACTOR) * deltaT);
            dxdz = [0, -1];
        } else if (dir == "right"){
            offset = new Vector3(0,0,(GLOBALVARS.movementSpeed / MOVEMENT_FACTOR) * deltaT);
            dxdz = [0, 1];
        } else if (dir == "down"){
            offset = new Vector3(-(GLOBALVARS.movementSpeed / MOVEMENT_FACTOR) * deltaT,0,0);
            dxdz = [-1, 0];
        }
        let checkSecondary = true;
        if (dxdz != null &&
            this.playerBox != null && 
            this.mazeObj.getAllowedPosition(
            this.position,
            offset,
            dxdz,
            this.playerBox
        )){
            let startingPos = this.position.clone();
            checkSecondary = false;
            this.lookAt(this.position.x + dxdz[0], this.position.y, this.position.z + dxdz[1]);
            this.position.add(offset);
            
            // smooth turning: add code handling each of the 8 cases here 
            // (L->U, R->U, L->D, R->D, U->L, U->R, D->L, D->R)
            // that gracefully moves the player to an integer coordinate
            if (this.previousOffset != null && this.previousDxDz != null){
                let prevDxDz = this.previousDxDz;
                let p = this.position;
                let prevPos = this.position.clone();
                if (prevDxDz[1] == -1 && dxdz[0] == 1){
                    this.position.set(p.x, p.y, Math.round(p.z));
                } else if (prevDxDz[1] == 1 && dxdz[0] == 1){
                    this.position.set(p.x, p.y, Math.round(p.z));
                } else if (prevDxDz[1] == -1 && dxdz[0] == -1){
                    this.position.set(p.x, p.y, Math.round(p.z));
                } else if (prevDxDz[1] == 1 && dxdz[0] == -1){
                    this.position.set(p.x, p.y, Math.round(p.z));
                } else if (prevDxDz[0] == 1 && dxdz[1] == -1){
                    this.position.set(Math.round(p.x), p.y, p.z);
                } else if (prevDxDz[0] == 1 && dxdz[1] == 1){
                    this.position.set(Math.round(p.x), p.y, p.z);
                } else if (prevDxDz[0] == -1 && dxdz[1] == -1){
                    this.position.set(Math.round(p.x), p.y, p.z);
                } else if (prevDxDz[0] == -1 && dxdz[1] == 1){
                    this.position.set(Math.round(p.x), p.y, p.z);
                }
                let dist = Math.abs(prevPos.distanceTo(this.position));
                if (dist > MOVEMENT_EPS * GLOBALVARS.movementSpeed){
                    this.position.set(startingPos.x, startingPos.y, startingPos.z);
                    checkSecondary = true;
                } else {
                    this.previousDxDz = dxdz;
                    this.previousOffset = offset;
                }
            } else {
                this.previousDxDz = dxdz;
                this.previousOffset = offset;
            }
        } 
        if (checkSecondary && this.previousOffset != null && this.previousDxDz != null){
            let prevOffset = this.previousOffset.clone();
            let prevDxDz = this.previousDxDz;
            if (this.mazeObj.getAllowedPosition(
                this.position,
                prevOffset,
                prevDxDz,
                this.playerBox
            )){
                this.position.add(prevOffset);
            }
        }
        
    }
}

export default Player;
