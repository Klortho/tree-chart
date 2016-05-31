//----------------------------------------------------------------
// [Use this template for new stand-alone modules/classes.]
// module.js


const Module = function() {
  'use strict';

  class Module {
    constructor(_opts=null) {
      const C1 = TreeChart.config1;
      this.options = C1.extend(Module.defaults, (_opts || {}));
    }
  };

  Module.defaults = {
  };

  return Module;
}();
