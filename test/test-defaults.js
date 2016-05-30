//----------------------------------------------------------------
// test-defaults.js

(function() {
  'use strict';

  TreeChart.testDefaults = function(assert) {
    if (assert(typeof config1 !== 'undefined', 'Where\'s C1?')) {
      const C1 = config1;
      const defaults = TreeChart.Defaults.value;
      assert(defaults.chart.width == 800, 'Default chart width should be 800');
    }
    return assert.results;
  };
})();