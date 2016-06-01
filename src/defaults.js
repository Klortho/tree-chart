//----------------------------------------------------------------
// defaults.js
// The settings here are very flexible. The default settings are designed to be
// useful as-is. They define a horizontal tree display, where each node is a
// rectangular box with a word in it.
// Use instances of Microcolor to manipulate color values.

(function() {
  'use strict';

  const C1 = TreeChart.config1;


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
      'spacing': (a, b) => a.parent === b.parent ? 0 : 30,
    },

    // The node settings are designed to be flexible enough that you can
    // draw anything you want for a node. 
    //
    // The required items are those that the layout and drawing functions 
    // access, and are indicated below. Other settings are based on the
    // default implementation as boxes.
    //
    // Some names are borrowed from CSS, but there's nothing as sophisticated
    // as the box model.

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
      border: 4,
      'margin-top': 5,
      'margin-right': 40,
      'margin-bottom': 5,
      'margin-left': 0,

      // The following node settings are required by the API

      // width - required - overall width of the box used in layout
      width: C1(X=> {
        const n = X.node;
        return n['margin-left'] + 2 * n.border + n['content-width'] +
          2 * n.padding + n['margin-right'];
      }),

      // height - required
      height: C1(X=> {
        const n = X.node;
        return n['margin-top'] + 2 * n.border + n['content-height'] +
          2 * n.padding + n['margin-bottom'];
      }),

      // anchor-in - required.
      // Point within the boxes where the line from the parent node
      // connects to this node.
      'anchor-in': C1(X=> {
        const n = X.node;
        return {
          x: n['margin-left'],
          y: (n['margin-top'] - n['margin-bottom']) / 2,
        };
      }),

      // anchor-out - required - Point from which the lines connecting this
      // node to its children originates.
      'anchor-out': C1(X=> { 
        const n = X.node;
        return {
          x: n.width - n['margin-right'],
          y: (n['margin-top'] - n['margin-bottom']) / 2,
        };
      }),


      // `color` forms the basis of our computed color scheme. Note that
      // microcolor objects are declared to config-one as atomic, so you can
      // use them without worrying about them losing their prototypes.
      color: {h: 90, s: 0.43, l: 0.49},

      'border-color': C1(X=> new Microcolor(X.node.color)),

      // Make sure you use `clone()` with tinycolor!
      fill: C1(X=> new Microcolor(X.node['border-color']).brighten(60)),
    },

    links: {
      color: '#888',
      'stroke-width': 1.5,
    },
  };

})();
