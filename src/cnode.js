// CNode is an immutable class that's used to "tag" nodes (the sloppy, source
// kind) to identify what tree views they belong to.

// The constructor here creates the entire subtree of CNode instances at once.


(function() {
  'use strict';
  const C1 = TreeChart.config1;

  // Import some functions and variables
  const genGuid = TreeChart.genGuid; 
  const metaSymbol = TreeChart.metaSymbol;
  const getMeta = TreeChart.getMeta;
  const setMeta = TreeChart.setMeta;

  const defaults = {
    // Default function for getting the id of a node:
    getId: node => {
      // Validate as we go. If we can't get an id, we can't use it.
      if (typeof node === 'undefined') 
        throw Error('Source node for the tree cannot be undefined');

      return (node.hasOwnProperty('id')) ? node.id :
          (getMeta('id', node) || setNodeId(node));
    },

    // Default function for getting the children of a node. The result must
    // be an array of nodes.
    getChildren: node => {
      // Validation is here in both places, since either might be overridden
      if (typeof node === 'undefined') 
        throw Error('Source node for the tree cannot be undefined');

      return (node.hasOwnProperty('children')) ? node.children : [];
    }
  };

  // FIXME: how can we avoid having to extend opts with every single incarnation
  // of cnode? It should be stipulated that a given chart can only have one
  // kind of cnode.

  const CNode = TreeChart.CNode = class {

    constructor(opts, node) {
      this.options = C1.extend(defaults, opts);
      this.guid = genGuid();
      this._sourceNode = node;
      this._nodeId = this.options.getId(node);

      this.children = this.options.getChildren(node).map(child =>
        new CNode(opts, node));
    }

    get sourceNode() {
      return this._sourceNode;
    }

    get nodeId() {
      return this._nodeId;
    }
  }

  // Helper to generate a new node id, set it on the node's metadata, and
  // return it
  const setNodeId = function(node) {
    const id = genGuid();
    setMeta('id', id, node);
    return id;
  }



  CNode.defaults = defaults;


})();
