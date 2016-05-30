//----------------------------------------------------------------
// test-main.js  [Use this as a template for new tests]

(function() {
  'use strict';

  TreeChart.testMain = function(assert) {

    const chart = new TreeChart();
    assert.isDefined(chart);
    assert.equal(chart.options.renderer.select, 'd3svg');

    return assert.results;
  };
})();