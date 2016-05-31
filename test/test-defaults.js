//----------------------------------------------------------------
// test-defaults.js

(function() {
  'use strict';

  new AssertionsPlus('defaults', function(assert) {
    if (null == assert.isDefined(config1, 'Where\'s C1?')) {
      const C1 = config1;
      const defaults = C1.extend(TreeChart.defaults);
      assert.equal(defaults.chart.width, 800, 'Default chart width should be 800');

      const n = defaults.node;
      const mockNode = { text: 'banana' };

      assert.closeTo(n['content-width'], 50, 0.0001);
      assert.closeTo(n['content-height'], 30, 0.0001);
      assert.closeTo(n['width'], 106, 0.0001);
      assert.closeTo(n['height'], 56, 0.0001);

      assert.closeTo(n['anchor-in'].x, 0, 0.0001);
      assert.closeTo(n['anchor-in'].y, 0, 0.0001);

      assert.closeTo(n['anchor-out'].x, 106, 0.0001);
      assert.closeTo(n['anchor-out'].y, 0, 0.0001);
    }
    return assert.results;
  });
})();