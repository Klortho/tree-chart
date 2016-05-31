//----------------------------------------------------------------
// test-main.js  [Use this as a template for new tests]

(function() {
  'use strict';

  new AssertionsPlus('main', function(assert) {

    const chart = new TreeChart();
    assert.isDefined(chart);
    assert.equal(chart.options.renderer.selected.name, 'd3svg');

    return assert.results;
  });
})();