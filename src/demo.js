// The main loop is controlled by a timer that emits poisson process events,
// random events with an average frequency of `speed` Hz.
// The timer is always going; when the looping is disabled, we just ignore it.

const Demo = (function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;


  class _Demo {
    // Instantiate a set of new Demos from a query selector. Makes one Demo
    // instance per matched element.
    static start(_opts = {}) {
      const opts = C1.extend(_Demo.defaults, _opts);
      const elems = Array.from(
        document.querySelectorAll(opts.selector) || []);

      console.log('elems: ', elems);

      // Instantiate new demos on those elements that don't already have one
      const newDemos = elems
        .filter(elem => !(_Demo.binder in elem))
        .map(elem => new _Demo(opts, elem));

      return newDemos;
    }


    // Constructor - don't use directly; use the start() factory 
    // method. The opts passed in here have already been extended from 
    // defaults.
    constructor(opts, element) {
      // Give this a unique id
      this.id = _Demo.nextId;

      // Keep a list of all the demos
      _Demo.list.push(this);

      // Assign the options to this instance itself
      Object.assign(this, opts);

      // double bind
      this.element = element;
      element[_Demo.binder] = this;

      // FIXME: instantiate a chart instance here

      // Set event listeners
      const self = this;
      this.listeners.forEach(spec => {
        const dispatch = evt => 
          spec.filter(evt) && spec.listener.call(self, evt);
        document.addEventListener(spec.type, dispatch);
      });

      // Start
      this.ticker();
    }

    static get nextId() {
      return _Demo._nextId++;
    }


    get ticker() {
      return () => {
        if (this.enabled) this.tick();
        setTimeout(this.ticker, this.nextDelay());
      };
    }

    tick() {
      console.log(this + ': tick');
    }

    toString() {
      return 'TreeChart demo #' + this.id;
    }
  };

  _Demo._nextId = 1;

  // This property is added to DOM elements to bind them to the Demo instance.
  _Demo.binder = Symbol('tree-chart-demo');

  _Demo.list = [];

  // In the case of this class, the options define the initial state of an
  // instance. All of the functions here get bound to the instance when it
  // is constructed. 

  _Demo.defaults = {
    selector: '#chart',
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

  return _Demo;
})();
