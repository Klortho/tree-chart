// Fetch the word list

fetch('node_modules/word-list-json/words.json')
.then(response => {
  if (response.status !== 200) {
    console.error('Problem fetching word list');
    return;
  }
  return response.json();
})
.then(wordsJson => {
  TreeChart.WordList = wordsJson.words;
  treeDemo();
})
.catch(err => {
  console.error('Error while fetching word list: ', err);
});



// The main loop is controlled by a timer that emits poisson process events,
// random events with an average frequency of `speed` Hz.
// The timer is always going; when the looping is disabled, we just ignore it.

class Looper {
  constructor() {
    this.enabled = true;
    this.speed = 0.5;
    this.nextEvent = () => -1000 * Math.log(Math.random()) / this.speed;
    this.listen();
    this.ticker();
  }

  get ticker() {
    return () => {
      if (this.enabled) this.tick();
      setTimeout(this.ticker, this.nextEvent());
    };
  }

  tick() {
    console.log(TreeChart.Words.pick());
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }

  faster() {
    this.speed *= 1.1;
  }

  slower() {
    this.speed /= 1.1;
  }

  listen() {
    document.onkeydown = evt => {
      if (evt.keyCode == 27) this.disable();  // esc
      if (evt.keyCode == 32) this.enable();   // space
      if (evt.keyCode == 189) this.slower();  // -
      if (evt.keyCode == 187) this.faster();  // = or + key
      console.log(evt);
    };
  };
};


// Main entry point

function treeDemo() {
  console.log('Number of words: ' + TreeChart.Words.length);
  const looper = new Looper();
}

