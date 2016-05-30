//----------------------------------------------------------------
// test-module.js  [Use this as a template for new tests]

(function() {
  'use strict';

  new AssertionsPlus('text node', function(assert) {
    const TextNode = TreeChart.TextNode;

    const z = new TextNode('zorumbus');
    assert.equal(z.__id, 1);
    assert.equal(z.text, 'zorumbus');
    assert.equal(z.children.length, 0);

    const y = z.copy();
    assert.equal(y.__id, 1);
    assert.equal(y.text, 'zorumbus');
    assert.equal(y.children.length, 0);

    assert.isTrue(z.same(y));

    return assert.results;
  });
})();