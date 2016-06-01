// The main loop is controlled by a timer that emits poisson process events,
// random events with an average frequency of `speed` Hz.
// The timer is always going; when the looping is disabled, we just ignore it.

const DemoWords = (function() {
  'use strict';

  const C1 = TreeChart.config1;

  class DemoWords {

    // Instantiate a set of new Demos from a query selector. Makes one Demo
    // instance per matched element.
    static start(_opts=null) {
      const opts = C1.extend(DemoBoxes.defaults, DemoWords.defaults, (_opts || {}));
      const chartElems = Array.from(
        document.querySelectorAll(opts.selector) || []);

      // Instantiate new demos on those elements that don't already have one
      const newDemos = chartElems
        .filter(elem => !(DemoWords.binder in elem))
        .map(elem => new DemoWords(opts, elem));

      return newDemos;
    }


    // Constructor - one "demo" instance per chart.
    // Don't use directly; use the start() factory 
    // method. The opts passed in here have already been extended from 
    // defaults.
    constructor(opts, chartElem) {
      console.log('constructor: opts.words: ', opts.words);
      // Give this a unique id
      this.id = TreeChart.nextId;

      // Keep a list of all the demos
      DemoWords.list.push(this);

      // Assign the options to this instance itself
      Object.assign(this, opts);

      // double bind
      this.chartElem = chartElem;
      chartElem[DemoWords.binder] = this;

      // Create the chart
      const chart = this.chart = new TreeChart(null, chartElem);

      this.tree = null;


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
      this.removeBox(this) ? this.deleteNode() : this.addNode();
      console.log(this.pickWord());
    }

    numNodes() {
      const n = (this.chart && this.chart.nodes) ? this.chart.nodes.length : 0;
      return n;
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

    randomNode() {
      const chart = this.chart;
      return chart.newNode({
        'content-height': 10 + Math.floor(Math.random() * 50),
        'content-width': 10 + Math.floor(Math.random() * 50),
        color: new Microcolor(tinycolor.random()),
      });
    }

    // Add a random node to the tree
    addNode() {
      const n = this.randomNode();
      if (!this.tree) {
        this.tree = n;
      }
      else {
        const nodes = this.chart.nodes
        const p = Math.floor(Math.random() * nodes.length);
        nodes[p].addChild(n);
      }
      this.chart.draw(this.tree);        
    }

    // Delete a random node
    deleteNode() {
      if (!this.chart || !this.chart.nodes) return;
      const nodes = this.chart.nodes;
      if (nodes.length == 1) return;
      const x = Math.floor(Math.random() * (nodes.length - 1)) + 1;
      const nx = nodes[x];
      nx.parent.deleteChild(nx);
      chart.draw(this.tree);
    }

  };

  // This property is added to DOM elements to bind them to the DemoWords instance.
  DemoWords.binder = Symbol('tree-chart-demo');

  DemoWords.list = [];

  // Get the key code of a keydown event
  const keyCode = evt => evt.keyCode || evt.which;

  // Returns a predicate that returns true if the event keycode matches the given
  const isKey = code => evt => keyCode(evt) === code;

  // In the case of this class, the options define the initial state of an
  // instance. All of the functions here get bound to the instance when it
  // is constructed. 

  DemoWords.defaults = {
    treeChart: {
      chart: {
        spacing: 0
      }
    },
  };

  return DemoWords;
})();
