//----------------------------------------------------------------
// node.js
// Some notes about "identity". Each TextNode instance has an __id value, but
// it is *not* true that there's only one instance with a given __id. When
// a new instance is created through copy(), it gets the same __id.

(function() {
  'use strict';

  const Node = TreeChart.Node = class {

    // Constructor. Creates a new Node object, which might or might not have
    // the same __id as another.
    constructor(id=TreeChart.nextId) {
      this.__id = id;
      this.children = [];
    }

    // Copy a node, without its children. This produces a new 
    // object that has the same __id, so it is identified as the same 
    // in the tree drawing, for purposes of transitions.
    copy() {
      return new Node(this.__id);
    }

    // Is this node the same as the other? 
    same(other) {
      return this.__id === other.__id;
    }
  };

})();
