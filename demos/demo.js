// Base class for demo pages

const Demo = (function() {
  'use strict';
  console.log('hey from demo')
  const C1 = TreeChart.config1;


  const list = [];

  // Get the key code of a keydown event
  const keyCode = evt => evt.keyCode || evt.which;

  // Returns a predicate that returns true if the event keycode matches the given
  const isKey = code => evt => keyCode(evt) === code;

  const defaults = {
    selector: '#chart',
    verbose: false,
    enabled: true,
    speed: 0.8,
    nodesToStart: () => Math.floor(Math.random() * 8) + 5,
    nextDelay: function() { 
      return -1000 * Math.log(Math.random()) / this.speed; 
    },
    oddsToRemove: demo => demo.numNodes()/10 - 0.5,
    removeBox: C1(X=> demo => (Math.random() < X.oddsToRemove(demo))),

    listeners: [
      //// for checking key codes:
      //{ type: 'keydown',
      //  filter: () => true,
      //  listener: evt => console.log('got evt: ', evt, ', key code: ', keyCode(evt)) },

      // `s` - log current state
      { type: 'keydown',
        filter: isKey(83),
        listener: function() { this.status(); }
      },

      // `v` - toggle verbose
      { type: 'keydown',
        filter: isKey(86),
        listener: function() { this.verbose = !this.verbose; }
      },

      // `a` - add a node
      { type: 'keydown',
        filter: isKey(65),
        listener: function() { this.addNode(); }
      },

      // `x` - delete a node at random (and its descendants)
      { type: 'keydown',
        filter: isKey(88),
        listener: function() { this.deleteNode(); }
      },

      // escape - suspend dynamic updates
      { type: 'keydown',
        filter: isKey(27),  // escape
        listener: function() { this.enabled = false; },
      },

      // space - restart dynamic updates
      { type: 'keydown',
        filter: isKey(32),  // space
        listener: function() { this.enabled = true; },
      },

      // `-` - slow down
      { type: 'keydown',
        filter: isKey(189),  // `-`
        listener: function() { this.speed *= 1.1; },
      },

      // `=` / `+` = speed up
      { type: 'keydown',
        filter: isKey(187),  // `=`
        listener: function() { this.speed /= 1.1; },
      },
    ],
  };



  class Demo {
    constructor(opts) {
      // Give this a unique id
      this.id = TreeChart.nextId;

      // Keep a list of all the demos
      Demo.list.push(this);

    }
  };

  Demo.list = list;
  Demo.keyCode = keyCode;
  Demo.isKey = isKey;
  Demo.defaults = defaults;




  return Demo;
})();
