//----------------------------------------------------------------
// main.js
// This must be included first -- this defines the TreeChart object.

const TreeChart = function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;

  class TreeChart {

    constructor(_opts=null, chartElem) {
      const opts = this.options = C1.extend(TreeChart.defaults, (_opts || {}));
      this.tree = null;
      this.chartElem = chartElem;

      // Instantiate the renderer
      this.renderer = new opts.renderer.selected(this);


      // Retrieve the flextree layout engine
      this.flextree = d3.layout.flextree()
        .nodeSize(function(node) { 
          try {   // try-catch for debugging
            return [
              100, //node.height() + nopts['margin-y'], 
              30,  //node.width() + nopts['margin-x']
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
      console.log('tree: ', newTree);

      // prolly going to have to save the old x and y

      // Do the layout - modifies the Tree instances in-place. 
      const nodes = this.nodes = this.flextree.nodes(this.tree);
      this.links = this.flextree.links(nodes);

      // swap x and y
      nodes.forEach(n => {
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

  TreeChart._nextId = 1;

  return TreeChart;
}();
