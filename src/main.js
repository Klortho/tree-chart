//----------------------------------------------------------------
// main.js
// This must be included first -- this defines the TreeChart object.

const TreeChart = function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;

  class TreeChart {

    constructor(_opts=null, element) {
      const opts = this.options = C1.extend(TreeChart.defaults, (_opts || {}));
      this.tree = null;


      // Initialize the DOM element and SVG
      this.container = d3.select(element);
      const svg = this.svg = this.container.append("svg")
        .attr({
          xmlns: "http://www.w3.org/2000/svg",
          xlink: "http://www.w3.org/1999/xlink",
          width: opts.width,
          height: opts.height,
        });
        //.style(opts.svg.style);



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

    }

  };

  TreeChart._nextId = 1;

  return TreeChart;
}();
