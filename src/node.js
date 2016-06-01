//----------------------------------------------------------------
// node.js
// Some notes about "identity". Each TextNode instance has an __id value, but
// it is *not* true that there's only one instance with a given __id. When
// a new instance is created through copy(), it gets the same __id.

(function() {
  'use strict';
  const C1 = TreeChart.config1;

  const Node = TreeChart.Node = class {

    // Constructor - private. Use a factory instead.
    constructor() {
      this.parent = null;
    }

    // Get a Node factory for your chart, using your config settings as the
    // defaults for every new Node. Both arguments are optional.
    //
    // Usage:
    //   const newNode = Node.getFactory(defaults);
    //   const node1 = newNode(opts);        // create a brand-new node
    //   const node2 = newNode(null, node1)  // copy, with or w/o overrides

    static getFactory(defaults) {
      const factory = function(_opts, origNode) {
        const newNode = new Node();

        // If this is a copy, reuse the same __id.
        newNode.__id = 
          (typeof origNode !== 'undefined' && origNode && '__id' in origNode) ? 
          origNode.__id : TreeChart.nextId;

        // No children to start
        newNode.children = [];

        // Normalize the options argument - it needs to be relative to the
        // root config
        const opts = _opts && typeof _opts === 'object' ? { node: _opts } : null;

        // Attach the options -- only do extend if `_opts` was given
        const finalOpts = opts ? C1.extend(defaults, opts) : defaults;
        newNode.opts = finalOpts.node; 

        return newNode;
      };

      return factory;
    }

    // Is this node the same as the other? 
    same(other) {
      return this.__id === other.__id;
    }

    addChild(kid) {
      this.children.push(kid);
      kid.parent = this;
    }

    deleteChild(kid) {
      const newKids = [];
      this.children.forEach(sib => {
        if (sib !== kid && sib.__id !== kid.__id) newKids.push(sib);
      });
      this.children = newKids;
    }

    getParent() {
      if (('parent' in this) && this.parent && (this.parent instanceof Node))
        return this.parent;
      else 
        return null;
    }
  };
})();
