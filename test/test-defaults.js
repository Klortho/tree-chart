//----------------------------------------------------------------
// test-defaults.js

(function() {
  'use strict';

  new AssertionsPlus('defaults', function(assert) {
    if (null == assert.isDefined(config1, 'Where\'s C1?')) {
      const C1 = config1;
      const defaults = TreeChart.Defaults.value;
      assert.equal(defaults.chart.width, 800, 'Default chart width should be 800');

      const n = defaults.node;
      const mockNode = { text: 'banana' };

      assert.closeTo(n['content-width'](mockNode), 43.2, 0.0001);
      assert.closeTo(n['content-height'](mockNode), 18, 0.0001);
      assert.closeTo(n['box-width'](mockNode), 54.2, 0.0001);
      assert.closeTo(n['box-height'](mockNode), 29, 0.0001);
      assert.closeTo(n['width'](mockNode), 94.2, 0.0001);
      assert.closeTo(n['height'](mockNode), 39, 0.0001);

      assert.closeTo(n['anchor-in'](mockNode).x, 0, 0.0001);
      assert.closeTo(n['anchor-in'](mockNode).y, 19.5, 0.0001);

      assert.closeTo(n['anchor-out'](mockNode).x, 54.2, 0.0001);
      assert.closeTo(n['anchor-out'](mockNode).y, 19.5, 0.0001);
    }
    return assert.results;
  });
})();