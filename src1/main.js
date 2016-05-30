
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
      });
    }
  };

  return TreeChart;
})();





