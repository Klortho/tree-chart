//----------------------------------------------------------------
// test-defaults.js

(function() {
  'use strict';

  TreeChart.testDefaults = function(assert) {
    if (null == assert(typeof config1 !== 'undefined', 'Where\'s C1?')) {
      const C1 = config1;
      const defaults = TreeChart.Defaults.value;
      assert(defaults.chart.width == 800, 'Default chart width should be 800');

      const n = defaults.node;
      const mockNode = { text: 'banana' };

      assert.equal(n['content-width'](mockNode), 43.2);
      assert.equal(n['content-height'](mockNode), 18);
      assert.equal(n['box-width'](mockNode), 54.2);
      assert.equal(n['box-height'](mockNode), 29);
      assert.equal(n['width'](mockNode), 94.2);
      assert.equal(n['height'](mockNode), 39);
      assert.deepEqual(n['anchor-in'](mockNode), { x: 0, y: 19.5 });
      assert.deepEqual(n['anchor-out'](mockNode), { x: 54.2, y: 19.5 });
    }
    return assert.results;
  };
})();