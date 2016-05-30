'use strict';


(function () {
  'use strict';
  if (typeof TreeChart !== 'function') return;
  // chai assertion reference: http://chaijs.com/api/assert/
  const assert = chai.assert;

  describe('TreeChart', function() {
    it('Should be perfect in every way', function () {
      assert.equal(typeof TreeChart, 'function');
      assert.isDefined(TreeChart.defaultOptions);
      const defopts = TreeChart.defaultOptions;

      assert.equal(TreeChart.D3svg.name, 'd3svg');
      assert.equal(defopts.renderer.select, 'd3svg');
      assert.equal(defopts.renderer.available.d3svg.name, 'd3svg');
      assert.equal(defopts.renderer.selected.name, 'd3svg');
    });

    it('Chart can be instantiated with options', function() {
      const chart = new TreeChart();
      assert.isDefined(chart.options);
    });

    it('Can compute node sizes correctly', function() {
      const chart = new TreeChart();
      //drawBox('splazle')
    });
  });

  describe('D3svg', function() {
    const D3svg = TreeChart.D3svg;

    it('Should work', function () {
      assert.equal(D3svg.name, 'd3svg');
      assert.equal(typeof D3svg, 'function');
      assert.isDefined(D3svg.defaultOptions);
      const defopts = D3svg.defaultOptions;


    })
  })



})();
