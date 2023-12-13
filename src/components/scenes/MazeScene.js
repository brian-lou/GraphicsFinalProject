import * as Dat from 'dat.gui';
import { Scene, Color, AxesHelper } from 'three';
import { Player, Maze, Enemy } from 'objects';
import { BasicLights } from 'lights';
// import { Enemy } from 'enemies';

class MazeScene extends Scene {
    constructor(keypress, camera) {
        // Call parent Scene() constructor
        super();
        this.keypress = keypress;
        this.camera = camera;
        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 0,
            updateList: Array(),
        };

        // Set background to a nice color
        this.background = new Color(0x92bdd9);

        // Add meshes to scene
        const maze = new Maze(this);
        const player = new Player(this, maze, keypress);
        // const enemy = new Enemy(this, maze, keypress);
        // this.enemy = enemy;
        this.player = player;
        const lights = new BasicLights(player, camera);
        this.lights = lights;
        // const axesHelper = new AxesHelper(5);
        this.enemies = [];
        for (let i = 0; i < 20; i++) { 
            const enemy = new Enemy(this, maze, keypress);
            this.enemies.push(enemy);
            this.add(enemy);}
        this.add(player, maze, lights);
       // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', 0, 0 );
    }
    getPlayer(){
        return this.player;
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(playerX, playerZ, deltaT) {
        // Call update for each object in the updateList
        for (const obj of this.state.updateList) {
            if (obj instanceof Maze) {
                obj.update(playerX, playerZ);
            } else if (obj instanceof Player) {
                obj.update(deltaT);
            } else if(obj instanceof Enemy){
                obj.update(deltaT);
            }
        }
        this.lights.updateSpotlight();
    }
}

export default MazeScene;
