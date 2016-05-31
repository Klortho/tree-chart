//----------------------------------------------------------------
// test-node.js

(function() {
  'use strict';

  new AssertionsPlus('text node', function(assert) {
    const Node = TreeChart.Node;

    const z = new Node();
    assert.isAbove(z.__id, 0);
    assert.equal(z.children.length, 0);

    const y = z.copy();
    assert.equal(y.__id, z.__id);
    assert.equal(y.children.length, 0);

    assert.isTrue(z.same(y));

    return assert.results;
  });
})();