//----------------------------------------------------------------
// test-node.js

(function() {
  'use strict';

  new AssertionsPlus('text node', function(assert) {
    const Node = TreeChart.Node;
    const newNode = Node.getFactory({});

    const z = newNode();
    assert.isAbove(z.__id, 0);
    assert.isDefined(z.children);
    assert.equal(z.children.length, 0);

    const y = newNode(null, z);
    assert.equal(y.__id, z.__id);
    assert.isDefined(y.children);
    assert.equal(y.children.length, 0);

    assert.isTrue(z.same(y));

    return assert.results;
  });
})();