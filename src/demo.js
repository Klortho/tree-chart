

// The main loop is controlled by a timer that emits poisson process events,
// random events with an average frequency of `speed` Hz.
// The timer is always going; when the looping is disabled, we just ignore it.

const Demo = (function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;

  // In the case of this class, the options define the initial state of an
  // instance. All of the functions here get bound to the instance when it
  // is constructed. 

  const defaults = {
    enabled: true,
    speed: 1,
    nextDelay: function() { 
      return -1000 * Math.log(Math.random()) / this.speed; 
    },
    listeners: [
      { type: 'keydown',
        filter: evt => evt.keyCode == 27,  // escape
        listener: function() { 
          console.log('escape: enabled = ' + this.enabled);
          this.enabled = false; },
      },
      { type: 'keydown',
        filter: evt => evt.keyCode == 32,  // space
        listener: function() { this.enabled = true; },
      },
      { type: 'keydown',
        filter: evt => evt.keyCode == 189,  // `-`
        listener: function() { this.speed *= 1.1; },
      },
      { type: 'keydown',
        filter: evt => evt.keyCode == 187,  // `=` or `+`
        listener: function() { this.speed /= 1.1; },
      },
    ],
  };

  return class {
    constructor(_opts = {}) {
      this.options = C1.extend(defaults, _opts);
      // Assign the options to this instance itself
      Object.assign(this, this.options);

      // Set event listeners
      const self = this;
      this.listeners.forEach(spec => {
        const dispatch = evt => 
          spec.filter(evt) && spec.listener.call(self, evt);
        document.addEventListener(spec.type, dispatch);
      });
    }

    get ticker() {
      return () => {
        if (this.enabled) this.tick();
        setTimeout(this.ticker, this.nextDelay());
      };
    }

    start() {
      this.ticker();
    }

    tick() {
      console.log('tick');
    }
  };
})();
