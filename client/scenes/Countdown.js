export default class Countdown {
  scene;
  label; //text
  timerEvent;

  duration = 0;

  constructor(scene, label) {
    this.scene = scene;
    this.label = label;
  }

  //20 seconds in milliseconds
  start(callback, duration = 20000) {
    this.stop();

    this.finishedCallback = callback;
    this.duration = duration;

    this.timerEvent = this.scene.time.addEvent({
      delay: duration,
      callback: () => {
        this.label.text = "0";

        this.stop();

        if (callback) {
          callback();
        }
      },
    });
  }

  //stops timer
  stop() {
    if (this.timerEvent) {
      this.timerEvent.destroy(); //if there's already a timer, destroy it
      this.timerEvent = undefined;
    }
  }

  //updates timer
  update() {
    if (!this.timerEvent || this.duration <= 0) {
      return;
    }

    const elapsed = this.timerEvent.getElapsed();
    const remaining = this.duration - elapsed;
    const seconds = remaining / 1000;

    this.label.text = seconds.toFixed(2);
  }
}
