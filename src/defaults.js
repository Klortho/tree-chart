//----------------------------------------------------------------
// defaults.js
// The settings here are very flexible. The default settings are designed to be
// useful as-is. They define a horizontal tree display, where each node is a
// rectangular box with a word in it.

(function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;

  // Some functions for manipulating colors. Colors are given in the config
  // as an object specifying HSL values. The tinycolor2 library can manipulate
  // these nicely.
  const brighten = colorObj => tinycolor(colorObj).brighten(70).toString();

  TreeChart.defaults = {

    renderer: {
      // Note that this one has to be in a recipe, because .D3svg hasn't been
      // assigned
      selected: C1(X=> TreeChart.D3svg),
      nodeRenderer: C1(X=> TreeChart.D3svg_Node),
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

    /* taking text-related stuff out for now
      // These calculations of the width and height use estimates based on 
      // the fixed-width courier-new font. The d3svg renderer uses the actual
      // bounding box. Note that these are recipes that return functions
      // that are called on each data item at layout time.
      'content-width': C1(X=> 
        d => 86.4 * d.text.length / X.chart['font-size']),
      'content-height': C1(X=> d => 1.5 * X.chart['font-size']),
      'content-width': C1(X=> 
        d => 86.4 * d.text.length / X.chart['font-size']),
      'content-height': C1(X=> d => 1.5 * X.chart['font-size']),
    */

      'content-width': 50,
      'content-height': 30,
      padding: 4,
      border: 1.5,
      'margin-top': 5,
      'margin-right': 40,
      'margin-bottom': 5,
      'margin-left': 0,

      // The following node settings are required by the API

      // width - required - overall width of the box used in layout
      width: C1(X=> d => {
        const n = X.node;
        return n['margin-left'](d) + 2 * n.border(d) + n['content-width'](d) +
          2 * n.padding(d) + n['margin-right'](d);
      }),

      // height - required
      height: C1(X=> d => {
        const n = X.node;
        return n['margin-top'](d) + 2 * n.border(d) + n['content-height'](d) +
          2 * n.padding(d) + n['margin-bottom'](d);
      }),

      // anchor-in - required.
      // Point within the boxes where the line from the parent node
      // connects to this node.
      'anchor-in': C1(X=> d => ({
        x: X.node['margin-left'](d),
        y: (X.node['margin-top'](d) - X.node['margin-bottom'](d)) / 2,
      })),

      // anchor-out - required - Point from which the lines connecting this
      // node to its children originates.
      'anchor-out': C1(X=> d => ({ 
        x: X.node.width(d) - X.node['margin-left'](d),
        y: (X.node['margin-top'](d) - X.node['margin-bottom'](d)) / 2,
      })),


      fill: 'red',

      'border-color': 'blue',
    }
  };

})();
