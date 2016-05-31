//----------------------------------------------------------------
// [Use this as a template for new TreeChart plugins.]
// plugin.js

(function() {
  'use strict';

  TreeChart.Plugin = class Plugin {

    constructor(_opts=null) {
      this.options = C1.extend(Module.defaults, (_opts || {}));
    }

    static get prop1() {
      return '...';
    }
  };

})();
