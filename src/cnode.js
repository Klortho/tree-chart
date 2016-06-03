// Create a new class, CNode, and try to shift functionality into it gradually,,
// while keeping everything working

(function() {
  'use strict';

  const CNode = TreeChart.CNode = class {

    constructor(node) {
      if (typeof node === 'undefined') 
        throw Error('Can\'t instantiate a CNode without a node');
      this.guid = CNode.genGuid();
      this._sourceNode = node;
    }

    get sourceNode() {
      return this._sourceNode;
    }


  }

  // This is from https://github.com/broofa/node-uuid, which links to this
  // fun gist: https://gist.github.com/jed/982883
  CNode.genGuid = function() {
    function b(a) {
      return a ? ( a^Math.random() * 16 >> a/4).toString(16) :
        ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, b);
    }
    return b();
  };




})();
