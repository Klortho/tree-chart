// The main loop is controlled by a timer that emits poisson process events,
// random events with an average frequency of `speed` Hz.
// The timer is always going; when the looping is disabled, we just ignore it.


const DemoBoxes = (function() {
  'use strict';
  const C1 = TreeChart.config1;

  const defaults = C1.extend(Demo.defaults, {});


  class DemoBoxes extends Demo {

    // Instantiate a set of new Demos from a query selector. Makes one DemoBoxes
    // instance per matched element.
    static start(_opts=null) {
      const opts = C1.extend(DemoBoxes.defaults, (_opts || {}));
      const chartElems = Array.from(
        document.querySelectorAll(opts.selector) || []);

      // Instantiate new demos on those elements that don't already have one
      const newDemos = chartElems
        .filter(elem => !(DemoBoxes.binder in elem))
        .map(elem => new DemoBoxes(opts, elem));

      return newDemos;
    }

    // Constructor - one "demo" instance per chart.
    // Don't use directly; use the start() factory 
    // method. The opts passed in here have already been extended from 
    // defaults.
    constructor(opts, chartElem) {

      // FIXME: Get options off of the @data-demo attribute of the element.
      // Then, the ov

      super();

      //console.log('super defaults:');
      //C1.ppConsole(C1.extend(super.defaults));
      //console.log('our defaults:');
      //C1.ppConsole(C1.extend(defaults));
      //console.log('super.options = super.defaults <- defaults:');
      //C1.ppConsole(super.options);

      // Then use the superclass options as our defaults
      this._options = C1.extend(super.options, opts);

      //console.log('our options = super.options <- opts:');
      //C1.ppConsole(this.options);

      // FIXME: I think this is a bad idea:
      // Assign the options to this instance itself
      Object.assign(this, this.options);

      // double bind
      this.chartElem = chartElem;
      chartElem[DemoBoxes.binder] = this;

      // Create the chart
      // FIXME: need a systematic way of conveying all relevatn opts.
      console.log('opts height: ', opts.height);
      const chart = this.chart = new TreeChart({
        speed: opts.speed,
        scale: opts.scale,
        chart: {
          width: opts.width,
          height: opts.height,          
        }
      }, chartElem);

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

    get defaults() {
      return defaults;
    }

    get options() {
      return this._options;
    }

    get ticker() {
      return () => {
        this.tickTotalCount++;
        if (this.enabled) this.tick();
        setTimeout(this.ticker, this.nextDelay());
      };
    }

    tick() {
      if (this.verbose) { console.log(this + ': tick'); }
      if (!this.tickEnabledCount++) {
        var num = this.nodesToStart();
        while (num--) this.addNode();
      }
      else {
        this.removeBox(this) ? this.deleteNode() : this.addNode();      
      }
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
      this.chart.draw(this.tree);
    }

  };

  // This property is added to DOM elements to bind them to the DemoBoxes instance.
  DemoBoxes.binder = Symbol('tree-chart-demo');

  // In the case of this class, the options define the initial state of an
  // instance. All of the functions here get bound to the instance when it
  // is constructed. 

  const isKey = Demo.isKey;


  DemoBoxes.defaults = defaults;


  return DemoBoxes;
})();
