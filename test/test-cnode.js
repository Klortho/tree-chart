//----------------------------------------------------------------
// test-node.js

(function() {
  'use strict';

  new AssertionsPlus('text cnode', function(assert) {
    const CNode = TreeChart.CNode;

    // test the constructor with no args throws an exception
    const testFunc = () => new CNode(null);
    console.log('expecting an exception');
    var gotException = false;
    assert.throws(testFunc, Error);

    const cnode = new CNode(null, {});
    assert.equal(cnode.guid.length, 36);

    const obj = {};
    const cobj = new CNode(null, obj);
    assert.equal(cobj.nodeId.length, 36);


    return assert.results;
  });
})();