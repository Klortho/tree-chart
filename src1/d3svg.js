// Plugin for rendering the tree chart in SVG with D3.

(function() {
  'use strict';
  if (typeof TreeChart !== 'function') return;
  const C1 = config1;

  const D3svg = TreeChart.D3svg = class {
    static get name() { return 'd3svg';}

    constructor(_opts = {}) {
      this.options = config1.extend(D3svg.defaultOptions, _opts);
    }

    static get defaultOptions() {
      return C1.extend({
      });
    }

  };


})();
