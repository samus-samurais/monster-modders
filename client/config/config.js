import 'phaser'

export default {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: 1280,
        height: 736,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        max: {
            width: 1920,
            height: 1080
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    parent: "monster-modders",
    pixelArt: true,
    dom: {
        createContainer: true
    }
};
