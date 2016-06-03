//----------------------------------------------------------------
// test-main.js  [Use this as a template for new tests]

(function() {
  'use strict';

  new AssertionsPlus('main', function(assert) {

    const chart = new TreeChart();
    assert.isDefined(chart);
    assert.equal(chart.options.renderer.selected.name, 'd3svg');


    //--------------------------------------- end phase 2 code

    const genGuid = TreeChart.genGuid; 
    const metaSymbol = TreeChart.metaSymbol;
    const getMeta = TreeChart.getMeta;
    const setMeta = TreeChart.setMeta;

    assert.isDefined(genGuid());
    assert.equal(genGuid().length, 36);

    const obj = {};
    assert.notProperty(obj, metaSymbol);
    assert.isNull(getMeta('snee', obj));
    setMeta('snee', 'thnad', obj);
    assert.equal(getMeta('snee', obj), 'thnad')

    // Check currying
    const getSnee = getMeta('snee');
    assert.equal(getSnee(obj), 'thnad');



    //--------------------------------------- end phase 2 code



    return assert.results;
  });
})();