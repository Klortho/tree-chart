//----------------------------------------------------------------
// test-node.js

(function() {
  'use strict';

  new AssertionsPlus('text cnode', function(assert) {
    const CNode = TreeChart.CNode;

    assert.isDefined(CNode.genGuid());
    assert.equal(CNode.genGuid().length, 36);

    // test the constructor with no args throws an exception
    const testFunc = () => new CNode();
    assert.throws(testFunc, Error);


    const cnode = new CNode(5);
    assert.equal(cnode.guid.length, 36);


    return assert.results;
  });
})();