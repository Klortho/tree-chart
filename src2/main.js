// Structure of the DOM nodes comprising the drawing:
//
// <div> - `container` - element specified by the user
//   <svg> - `svg`
//     <defs> - `defs`
//     <g> - `frame` - graphical context for the whole drawing
//       <g class='node'> - one node in the tree
//         ...
//
// The tree data passed in is not mutated, but is wrapped in a shadow tree,
// of class Tree. An instance of Tree is hierarchical: each node is a separate
// Tree instance.


// Export a global variable `TreeChart`
TreeChart = typeof TreeChart !== 'undefined' ? TreeChart : function() {
  'use strict';


  // FIXME: Partition this well. The generic stuff in the defaults, and
  // stuff related to config-one demo in overrides.
  var defaults = config1.extend(
    { duration: 800,
      color: color({h: 200, s: 0.43, l: 0.49}),
      // function used to tell if two nodes are the same
      sameNode: (n1, n2) => n1 === n2,
      defaults: {
        link: {
          style: {
            fill: 'none',
            stroke: '#ccc',
            'stroke-width': '1.5pt',
          }
        }
      },
      string: config1(X=> X.defaults),
      stringkey: config1(X=> X.defaults),
      recipe: config1(X=> X.defaults),
    },

    {
      string: {
        color: color({h: 0, s: 0.43, l: 0.49}),
        node: {
          style: {
            rect: {
              stroke: config1(X=> X.string.color),
              fill: config1(X=> brighten(X.string.color))
            },
            text: {
              fill: config1(X=> X.string.color),
              'font-family': 'monospace',
              'font-size': '90%',          
            }
          }
        },
      },
      stringkey: {
        node: {
          'margin-x': 0,  // diagonals
        }
      },
      recipe: {
        color: color({h: 90, s: 0.43, l: 0.49}),
        node: {
          style: {
            rect: {
              stroke: config1(X=> X.recipe.color),
              fill: config1(X=> brighten(X.recipe.color))
            },
            text: {
              fill: config1(X=> X.recipe.color),
              'font-family': 'monospace',
              'font-size': '100%',          
            }
          }
        },
      }
    },
    { // FIXME: turn into a automatic harvesting function
      // Aggregate all the CSS rules from above
      style: {
        svg: config1(X=> X.svg.style),
        '.node rect': config1(X=> X.defaults.node.style.rect),
        '.node text': config1(X=> X.defaults.node.style.text),
        '.link': config1(X=> X.defaults.link.style),
        '.node.string rect': config1(X=> X.string.node.style.rect),
        '.node.string text': config1(X=> X.string.node.style.text),
        '.node.recipe rect': config1(X=> X.recipe.node.style.rect),
        '.node.recipe text': config1(X=> X.recipe.node.style.text),
      }      
    }
  );

  // FIXME: freezing this for now, until more testing
  defaults = config1.freeze(defaults);


  ///////////////////////////////////////////////////////////////////////
  // Constructor - same as the exported `TreeChart`.
  // No tree data is given here.

  const TreeChart = function(_opts) {
    const chart = this;
    TreeChart.charts.push(this); 
    const opts = chart.opts = config1.extend(defaults, _opts);

    // FIXME: move this into a utils module, and test it independently:
    // Function that serializes css rules
    const serializedCss = function(style) {
      return Object.keys(style).map(sel => {
        const ruleObj = style[sel];
        const rules = Object.keys(ruleObj).map(property => {
          return property + ': ' + ruleObj[property] + ';\n  ';
        }).join('');

        return sel + ' {\n  ' + rules + '}\n';
      });
    };
    const css = serializedCss(opts.style);

    // FIXME: how portable is this? Look again for a library
    var stylesheet = document.styleSheets[0];
    if (stylesheet) {
      css.forEach(rule => {
        stylesheet.insertRule(rule, 0);
      });
    }



  };



  // List of all tree charts
  TreeChart.charts = [];


  ///////////////////////////////////////////////////////////////////////
  // draw
  // This either draws the initial tree, or updates the drawing, depending
  // on whether or not its been drawn before

  TreeChart.prototype.draw = function(orig) {
    const chart = this;
    const opts = chart.opts;


    // Wrap the original data nodes in Tree instances. Note that TreeChart
    // doesn't keep track of orig nodes. That is bookkeepping done by Tree.
    const oldTree = chart.tree;
    const tree = new TreeChart.Tree(chart.frame, opts, orig, oldTree);




    // Prepare for layout - get dimensions
    tree.getDimensions();

    // Do the layout - modifies the Tree instances in-place; returns an 
    // object with nodes (a flattened array of Trees) and links (the connectors
    // between the nodes). 
    const layout = chart.layout = chart.engine.doLayout(tree),
          nodes = layout.nodes,
          links = layout.links;

    // Bind the node objects to their elements; returns a list that's divided
    // into three sets (per D3's way of doing things):
    // - enter - haven't been bound before
    // - exit - on their way out
    // - update - all
    const update = chart.update = 
      chart.frame.selectAll(TreeChart.Tree.selector).data(nodes, 
        function(d) {
          return this.id || d.id || null;
        }
      );

    // Move the elements to their locations according to the layout
    update.each(function(d) {
      d.update();
    });

    update.exit().transition().duration(opts.duration)
      .attr('transform', node => {
        const parent = node.parent,
              x = parent && ('x' in parent) ? parent.x : 0,
              y = parent && ('y' in parent) ? parent.y : 0;
        return `translate(${x}, ${y}) scale(0, 1)`;
      })
      .remove();

    // Links
    const links_selection = chart.frame.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });
    const diagonal = chart.diagonal;

    // Function to make a diagonal function for entering and exiting 
    // transitions of the links
    const zeroDiag = function(d) {
      const parent = d.target.parent,
            x = parent && ('x' in parent) ? parent.x : 0,
            y = parent && ('y' in parent) ? parent.y : 0,
            dummyNode = { x: x, y: y, width: () => 0, };
      return diagonal({
        source: dummyNode, 
        target: dummyNode
      });
    };

    links_selection.enter().insert("path", "g")
      .attr({
        id: d => d.target.id,
        'class': 'link',
        d: zeroDiag,
      });

    links_selection.transition()
      .duration(opts.duration)
      .attr('d', diagonal);

    const cb = d => {
      console.log('cb, d: ', d);
    };

    // Transition exiting links to the parent's new positions.
    links_selection.exit().transition()
      .duration(opts.duration)
      .attr('d', zeroDiag)
      .each('end', cb)
      .remove();
  };


  //----------------------------------------------------------------------
  // D3 hack, from: http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2

  d3.selection.prototype.moveToFront = function() {  
    return this.each(function() {
      this.parentNode.appendChild(this);
    });
  };

  return TreeChart;

}();
