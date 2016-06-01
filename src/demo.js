// The main loop is controlled by a timer that emits poisson process events,
// random events with an average frequency of `speed` Hz.
// The timer is always going; when the looping is disabled, we just ignore it.

const Demo = (function() {
  'use strict';

  const C1 = TreeChart.config1;

  class Demo {

    // Instantiate a set of new Demos from a query selector. Makes one Demo
    // instance per matched element.
    static start(_opts=null) {
      const opts = C1.extend(Demo.defaults, (_opts || {}));
      const chartElems = Array.from(
        document.querySelectorAll(opts.selector) || []);

      // Instantiate new demos on those elements that don't already have one
      const newDemos = chartElems
        .filter(elem => !(Demo.binder in elem))
        .map(elem => new Demo(opts, elem));

      return newDemos;
    }


    // Constructor - one "demo" instance per chart.
    // Don't use directly; use the start() factory 
    // method. The opts passed in here have already been extended from 
    // defaults.
    constructor(opts, chartElem) {
      // Give this a unique id
      this.id = TreeChart.nextId;

      // Keep a list of all the demos
      Demo.list.push(this);

      // Assign the options to this instance itself
      Object.assign(this, opts);

      // double bind
      this.chartElem = chartElem;
      chartElem[Demo.binder] = this;

      // Create the chart
      const chart = this.chart = new TreeChart(null, chartElem);

      //--------------------------------------------------
      // Instantiate a tree
      const root = this.tree = chart.newNode();

      const k0 = chart.newNode({
        color: 'blue',
        'content-height': 10,
      });
      const k1 = chart.newNode({
        color: 'red',
        padding: 30,
      });
      const k2 = chart.newNode({
        color: 'violet',
        'content-width': 20,
        'margin-right': 20,
      });
      const k20 = chart.newNode({
        color: 'orange',
        'content-width': 20,
        'margin-right': 20,
      });

      root.addChild(k0);
      root.addChild(k1);
      root.addChild(k2);
      k2.addChild(k20);

      //--------------------------------------------------


      // Draw the tree
      this.chart.draw(this.tree);

      // Set event listeners
      const self = this;
      this.listeners.forEach(spec => {
        const dispatch = evt => 
          spec.filter(evt) && spec.listener.call(self, evt);
        document.addEventListener(spec.type, dispatch);
      });

      // Start
      this.tickTotalCount = 0;
      this.tickEnabledCount = 0;
      this.ticker();
    }

    get ticker() {
      return () => {
        this.tickTotalCount++;
        if (this.enabled) this.tick();
        setTimeout(this.ticker, this.nextDelay());
      };
    }

    tick() {
      this.tickEnabledCount++;
      if (this.verbose) { console.log(this + ': tick'); }
    }

    toString() {
      return 'TreeChart demo #' + this.id;
    }

    // pretty-print lots of info to the console. this is trigged by `s`
    status() {

      console.log(
        `ticks: total ${this.tickTotalCount}, enabled ` +
         `${this.tickEnabledCount}, rate ${this.speed}\n`
      );

      const printTree = function(node, indent) {
        const istr = '  '.repeat(indent);
        console.log(istr + 
          'node ' + node.__id + 
          ', x ' + node.x + 
          ', y ' + node.y + 
          ', width ' + node.opts.width +
          ', height ' + node.opts.height
        );
        node.children.forEach(kid => printTree(kid, indent+1));
      } 
      printTree(this.tree, 0);
    }
  };

  // This property is added to DOM elements to bind them to the Demo instance.
  Demo.binder = Symbol('tree-chart-demo');

  Demo.list = [];

  // Get the key code of a keydown event
  const keyCode = evt => evt.keyCode || evt.which;

  // Returns a predicate that returns true if the event keycode matches the given
  const isKey = code => evt => keyCode(evt) === code;

  // In the case of this class, the options define the initial state of an
  // instance. All of the functions here get bound to the instance when it
  // is constructed. 

  Demo.defaults = {
    selector: '#chart',
    verbose: false,
    enabled: true,
    speed: 1,
    nextDelay: function() { 
      return -1000 * Math.log(Math.random()) / this.speed; 
    },
    listeners: [
      //// for checking key codes:
      //{ type: 'keydown',
      //  filter: () => true,
      //  listener: evt => console.log('got evt: ', evt, ', key code: ', keyCode(evt)) },

      // `s` - log current state
      { type: 'keydown',
        filter: isKey(83),
        listener: function() {
          this.status();
        }
      },

      // `v` - toggle verbose
      { type: 'keydown',
        filter: isKey(86),
        listener: function() { this.verbose = !this.verbose; }
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

  return Demo;
})();
