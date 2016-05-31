//----------------------------------------------------------------
// defaults.js
// The settings here are very flexible. The default settings are designed to be
// useful as-is. They define a horizontal tree display, where each node is a
// rectangular box with a word in it.

(function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;

  TreeChart.defaults = {

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
      'font-size': 12,
      'font-family': 'courier',
      'text-anchor': 'start',
      'alignment-baseline': 'middle',
    },

    // The node settings are designed to be flexible enough that you can
    // draw anything you want for a node. 
    //
    // The required items are those that the layout and drawing functions 
    // access, and those are indicated. Other settings are based on the
    // default implementation as boxes.
    //
    // The names for some dimensions are borrowed from CSS, but it's not an
    // implementation of the box model.
    node: {
      // These calculations of the width and height use estimates based on 
      // the fixed-width courier-new font. The d3svg renderer uses the actual
      // bounding box. Note that these are recipes that return functions
      // that are called on each data item at layout time.
      'content-width': C1(X=> 
        d => 86.4 * d.text.length / X.chart['font-size']),
      'content-height': C1(X=> d => 1.5 * X.chart['font-size']),

      padding: 4,
      border: 1.5,
      'margin-top': 5,
      'margin-right': 40,
      'margin-bottom': 5,
      'margin-left': 0,

      // box-width and box-height - derived quantities
      'box-width': C1(X=> d=> {
        const n = X.node;
        return 2 * n.border + 2 * n.padding + n['content-width'](d);
      }),
      'box-height': C1(X=> d=> {
        const n = X.node;
        return 2 * n.border + 2 * n.padding + n['content-height'](d);
      }),

      // The following node settings are required by the API

      // width - required - overall width of the box used in layout
      width: C1(X=> d => {
        const n = X.node;
        return n['margin-left'] + n['box-width'](d) + n['margin-right'];
      }),

      // height - required
      height: C1(X=> d => {
        const n = X.node;
        return n['margin-top'] + n['box-height'](d) + n['margin-bottom'];
      }),

      // anchor-in - required.
      // Point within the boxes where the line from the parent node
      // connects to this node.
      'anchor-in': C1(X=> d => ({
        x: X.node['margin-left'],
        y: X.node['margin-bottom'] + X.node['box-height'](d) / 2
      })),

      // anchor-out - required - Point from which the lines connecting this
      // node to its children originates.
      'anchor-out': C1(X=> d => ({ 
        x: X.node['margin-left'] + X.node['box-width'](d),
        y: X.node['margin-bottom'] + X.node['box-height'](d) / 2
      })),
    }
  };

})();
