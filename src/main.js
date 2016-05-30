//----------------------------------------------------------------
// main.js
// This must be included first -- this defines the TreeChart object.

const TreeChart = function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;

  return class {
    constructor(_opts = {}) {
      this.options = C1.extend(TreeChart.Defaults.value, _opts);
    }
  };
}();
