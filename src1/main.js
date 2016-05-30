// The settings here are very flexible. The default settings are designed to be
// useful as-is. They define a horizontal tree display, where each node is a
// rectangular box with a word in it.

// The data model looks like this:
// { id: 1,
//   text: 'subglobose',
//   color: 'blue',
//   children: [
//     { id: 2,
//       text: 'upgushings', }
//     ...
//   ]
// }

// I'm trying to design this so that it could accommodate rendererers other than
// D3-SVG, but as that's the only rendering I'm working with, the separation
// won't be perfect.

TreeChart = (function() {
  'use strict';
  const C1 = config1;

  const TreeChart = class {

    constructor(_opts = {}) {
      this.options = config1.extend(TreeChart.defaultOptions, _opts);
    }

    // FIXME: do we have to use `extend` here?
    static get defaultOptions() {
      return C1.extend({
        renderer: {
          select: 'd3svg',
          available: {
            d3svg: TreeChart.D3svg,
          },
          selected: C1(X=> X.renderer.available[X.renderer.select]),
        },

        // settings that apply to the drawing as a whole
        chart: {
          orientation: 'horizontal',
          width: 800,
          height: 400,
          'font-size': '12px',
          'font-family': 'courier',
          'text-anchor': 'start',
          'alignment-baseline': 'middle',
        },

        node: {
          // Dimensions. These names are the same as are used by CSS, but 
          // there's no claim this is an implementation of the box model.
          // Note that this is a pretty brain-dead way of computing the node
          // width. In the d3svg renderer, it does a better job.
          'content-height': 14,
          'content-width': C1(X=> d => 
            86.4 * d.text.length / X.chart['font-size']),

          padding: 4,
          border: 1.5,
          'margin-top': 5,
          'margin-right': 40,
          'margin-bottom': 5,
          'margin-left': 0,

          // Recipe that produces a function that is evaluated per-node, at
          // render time
          width: C1(X=> d => {
            const n = X.node;
            return n['anchor-out'](d) + n['margin-right'];
          }),
          // In contrast, this is a constant for all nodes
          height: C1(X=> {
            const n = X.node;
            return n['content-height'] + 2 * n.padding + 2 * n.border +
              n['margin-bottom'] + n['margin-bottom'];
          }),

          // These are the points within the boxes where the "diagonal" lines
          // connect
          'anchor-in': { x: 0, y: 0 },
          'anchor-out': C1(X=> d => ({ 
            x: n['content-width'](d) + 2 * n.padding + 2 * n.border + 
               n['margin-left'], 
            y: 0
          }))
        },
      });
    }
  };

  return TreeChart;
})();





