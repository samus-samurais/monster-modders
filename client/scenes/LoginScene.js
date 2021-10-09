import Phaser from 'phaser'
import io from 'socket.io-client'

var element;

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene')
  }

  preload() {
    this.load.html('loginForm', 'assets/textHTML/loginForm.html');
    // we will replace these false images later
    this.load.image('background', 'assets/testImage/falseBackground.png');

  }

  create() {
    this.add.image(640, 360, 'background');

    var text = this.add.text(10, 10, 'Please login to play', { color: 'white', fontFamily: 'Arial', fontSize: '32px '});

    var element = this.add.dom(640, 360).createFromCache('loginform');

    element.setPerspective(800);

    element.addListener('click');

    element.on('click', function (event) {

        if (event.target.name === 'loginButton')
        {
            var inputUsername = this.getChildByName('username');
            var inputPassword = this.getChildByName('password');

            //  Have they entered anything?
            if (inputUsername.value !== '' && inputPassword.value !== '')
            {
                //  Turn off the click events
                this.removeListener('click');

                //  Tween the login form out
                this.scene.tweens.add({ targets: element.rotate3d, x: 1, w: 90, duration: 3000, ease: 'Power3' });

                this.scene.tweens.add({ targets: element, scaleX: 2, scaleY: 2, y: 700, duration: 3000, ease: 'Power3',
                    onComplete: function ()
                    {
                        element.setVisible(false);
                    }
                });

                //  Populate the text with whatever they typed in as the username!
                text.setText('Welcome ' + inputUsername.value);
            }
            else
            {
                //  Flash the prompt
                this.scene.tweens.add({ targets: text, alpha: 0.1, duration: 200, ease: 'Power3', yoyo: true });
            }
        }

    });

    this.tweens.add({
        targets: element,
        y: 300,
        duration: 3000,
        ease: 'Power3'
    });

  }

}
