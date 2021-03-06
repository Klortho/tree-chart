//----------------------------------------------------------------
// tree-chart.js
// This must be included first -- this defines the TreeChart object.

const TreeChart = function() {
  'use strict';

  class TreeChart {

    // FIXME: chartElem does not belong here. This class won't know anything
    // at all about renderers. It will emit events that the renderers will
    // pick up.
    constructor(_opts=null, chartElem) {
      TreeChart.charts.push(this);
      const C1 = TreeChart.config1;


      // FIXME: this will go away too. I'm going to make all functions atomic
      // by default.
      // Add a symbol to tinycolor, to tell C1 to treat it as atomic.
      tinycolor.prototype[C1.c1symbol] = { atomic: true };
      Microcolor.prototype[C1.c1symbol] = { atomic: true };

      const opts = this.options = C1.extend(TreeChart.defaults, (_opts || {}));

      this.tree = null;
      this.lastTreeData = null;

      this.chartElem = chartElem;

      // Create the factory method for our nodes
      this.newNode = TreeChart.Node.getFactory(opts);

      // Instantiate the renderer
      this.renderer = new opts.renderer.selected(this);

      // Retrieve the flextree layout engine, and set some callbacks.
      // Note how x/y (width/height) is reversed in flextree.

      this.flextree = d3.layout.flextree()
        .nodeSize(opts.renderer.flextree.nodeSize)
        .spacing(opts.chart.spacing);
    }

    // This method is shared by lots of modules and plugins, for convenience
    // (not because every ID has to be globally unique)
    static get nextId() {
      return TreeChart._nextId++;
    }


    // Stores the important geometry from the current tree display, before we
    // render a new one. This is indexed by __id. Stores the parent's __id,
    // the absolute position (x, y) and the relative anchorOut (x, y).
    // Actually anchor position should stay relative.
    storeTreeData() {
      const chart = this;
      chart.lastTreeData = {};
      if (!chart.tree) return;

      function storeNode(node) {
        const anchorOut = node.opts['anchor-out'];

        const parent = node.getParent()
        const data = {
          __id: node.__id,
          parentId: parent ? parent.__id : 0,
          position: {
            x: node.x,
            y: node.y,
          },
          anchorOut: anchorOut,
        };

        chart.lastTreeData[node.__id] = data;
        node.children.forEach(kid => storeNode(kid));
      }
      storeNode(chart.tree);
      return chart.lastTreeData;
    }

    // Get the absolute anchor-out position for a node recorded in the store
    absAnchorOut(nid) {
      const ltd = this.lastTreeData;
      if (ltd && (nid in ltd)) {
        const ndata = ltd[nid];
        return {
          x: ndata.position.x + ndata.anchorOut.x,
          y: ndata.position.y + ndata.anchorOut.y
        }
      }
      return {x: 0, y: 0};
    }

    // For nodes that are exiting, they will transition to the new anchor
    // out of the first ancestor that is still in the tree.
    firstRemainingAncestorId(xid) {
      const ltd = this.lastTreeData;
      if (!ltd) return;

      const getParentData = function(id) {
        if (!(id in ltd)) return null;
        const data = ltd[id];
        if (!('parentId' in data)) return null;
        const pid = data.parentId;
        if (!pid || !(pid in ltd)) return null;
        return ltd[pid];
      }

      var adata = getParentData(xid);
      while (adata && !(this.findNode(adata.__id))) {
        adata = getParentData(adata.__id);
      }
      return adata ? adata.__id : 0;
    }

    findNode(id) {
      return this.nodes.find(node => node.__id == id);
    }

    // Update (or draw for the first time) the drawing, based on the new tree.
    // None, some, or all of the nodes in this new tree might have the same
    // __id's as the current tree.
    draw(newTree) {

      // Switch to the new tree (might be the same)
      this.tree = newTree;

      // Do the layout - modifies the Tree instances in-place. 
      const nodes = this.nodes = this.flextree.nodes(this.tree);
      const links = this.links = this.flextree.links(nodes);

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

      // Draw
      this.renderer.draw(nodes, links);

      // Save important data that we'll need for transitions next time
      this.storeTreeData();
    }
  };

  //--------------------------------------- phase 2 code

  // Generate a globally unique identifier, that conforms to
  // RFC4122 UUIDS.

  // This is from https://github.com/broofa/node-uuid, which links to this
  // fun gist: https://gist.github.com/jed/982883
  function b(a) {
    return a ? ( a^Math.random() * 16 >> a/4).toString(16) :
      ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, b);
  }

  TreeChart.genGuid = () => b();


  // FIXME: Let's move some of these library-type validation/checking routines 
  // into config-one. They are a constant source of pain.


  // Use this symbol as needed (only if needed) to attach metadata to nodes
  TreeChart.metaSymbol = Symbol('TreeChart meta');
  const metaSymbol = TreeChart.metaSymbol;

  // Utility function to get an "own" property value from an item, or else null.
  // This should be safe, in that if the value is of any type except undefined,
  // it won't throw an exception
  TreeChart.getProp = R.curry((key, obj) => {
    if (typeof obj === 'undefined') 
      throw Error('Can\'t get a property from an undefined value');
    return obj.hasOwnProperty(key) ? obj[key] : null;
  });
  const getProp = TreeChart.getProp;


  // Test to see if a variable is of a type that can hold properties.
  TreeChart.isObject = val =>
    (val !== null) &&
    ( (typeof val === 'function') || (typeof val === 'object') );
  const isObject = TreeChart.isObject;


  // Attach the metaSymbol key to an object, if it's not there already, and
  // returns it's value. 
  // `obj` must be of a type that allows properties (`isObject`).
  TreeChart.getMetaObject = function(obj) {
    if (!isObject(obj)) 
      throw Error('Can\'t get metadata information from a non-object');
    if (!obj.hasOwnProperty(metaSymbol)) obj[metaSymbol] = {};
    return obj[metaSymbol];
  }
  const getMetaObject = TreeChart.getMetaObject;

  // Get a single metadata property. If the metaSymbol object has not been 
  // attached, or if it doesn't have the given property, then this returns null.
  TreeChart.getMeta = R.curry((key, obj) => {
    const meta = getMetaObject(obj);
    return meta.hasOwnProperty(key) ? meta[key] : null;
  });


  // Set a metadata item, returns the object.
  // `obj` must be of a type that allows properties.
  TreeChart.setMeta = R.curry((key, value, obj) => {
    const meta = getMetaObject(obj);
    meta[key] = value;
    return obj;
  });

  //--------------------------------------- end phase 2 code



  // const C1 = require('config-one');
  TreeChart.config1 = config1;

  // Keep a list of all charts
  TreeChart.charts = [];

  // To generate unique ids
  TreeChart._nextId = 1;

  return TreeChart;
}();
