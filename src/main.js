//----------------------------------------------------------------
// main.js
// This must be included first -- this defines the TreeChart object.

const TreeChart = function() {
  'use strict';

  class TreeChart {

    constructor(_opts=null, chartElem) {
      TreeChart.charts.push(this);
      const C1 = TreeChart.config1;

      // Add a symbol to tinycolor, to tell C1 to treat it as atomic.
      tinycolor.prototype[C1.c1symbol] = { atomic: true };
      Microcolor.prototype[C1.c1symbol] = { atomic: true };

      const opts = this.options = C1.extend(TreeChart.defaults, (_opts || {}));
      this.tree = null;
      this.chartElem = chartElem;


      // Create the factory method for our nodes
      this.newNode = TreeChart.Node.getFactory(opts);


      // Instantiate the renderer
      this.renderer = new opts.renderer.selected(this);



      // Retrieve the flextree layout engine, and set some callbacks.
      // Note how x/y (width/height) is reversed in flextree.

      this.flextree = d3.layout.flextree()
        .nodeSize(function(node) { 
          try {   // try-catch for debugging
            return [
              node.opts.height,
              node.opts.width,
            ];
          }
          catch(err) {
            console.error(err);
            return [50, 100];
          }
        })
        .spacing(function(a, b) {
          return 10;
          //return a.elem_parent === b.elem_parent ? 10 : 20;
        });
    }

    // This method is shared by lots of modules and plugins, for convenience
    // (not because every ID has to be globally unique)
    static get nextId() {
      return TreeChart._nextId++;
    }

    // Update (or draw for the first time) the drawing, based on the new tree.
    // None, some, or all of the nodes in this new tree might have the same
    // __id's as the current tree.
    draw(newTree) {

      // FIXME: for now, just assuming that this is the first time:
      this.tree = newTree;

      // prolly going to have to save the old x and y

      // Do the layout - modifies the Tree instances in-place. 
      const nodes = this.nodes = this.flextree.nodes(this.tree);
      this.links = this.flextree.links(nodes);

      // Fix up:
      // - flextree removes empty `children` arrays for some reason. Let's put
      //   them back
      // - swap x and y
      nodes.forEach(n => {
        if (!('children' in n)) n.children = [];
        const x = n.x;
        n.x = n.y;
        n.y = x;
      });

      // We'll want to figure out enter, update, and exit here, and then
      // call transition routines explicitly, I think.
      const renderer = this.renderer;
      nodes.forEach(node => {
        renderer.drawEnter(node);
      });



    }

  };

  // const C1 = require('config-one');
  TreeChart.config1 = config1;

  // Keep a list of all charts
  TreeChart.charts = [];

  // To generate unique ids
  TreeChart._nextId = 1;

  return TreeChart;
}();
