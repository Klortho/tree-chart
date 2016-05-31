//----------------------------------------------------------------
// [Use this template for new stand-alone modules/classes.]
// module.js


const Module = function() {
  'use strict';

  // const C1 = require('config-one');
  const C1 = config1;

  class Module {
    constructor(_opts=null) {
      this.options = C1.extend(Module.defaults, (_opts || {}));
    }
  };

  Module.defaults = {
  };

  return Module;
}();
