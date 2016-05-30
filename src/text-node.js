//----------------------------------------------------------------
// text-node.js
// Some notes about "identity". Each TextNode instance has an __id value, but
// it is *not* true that there's only one instance with a given __id. When
// a new instance is created through copy(), it gets the same __id.

(function() {
  'use strict';

  let _nextId = 1;

  const TextNode = TreeChart.TextNode = class {

    // Constructor
    // string => text node representing that string of text, with no children
    constructor(text, id=TextNode.nextId) {
      this.__id = id;
      this.text = text;
      this.children = [];
    }

    static get nextId() {
      return _nextId++;
    }


    // Copy a node, without its children, and with or without changing 
    // the text. This produces a new 
    // object that's identified as the same in the tree drawing.
    copy(text=null) {
      return new TextNode(this.text, this.__id);
    }



  };

})();
