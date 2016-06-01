// Plugin for rendering the tree chart in SVG with D3.
// This has separate classes for separating the data related to rendering
// different kinds of data. Right now, D3svg_Node and D3svg_TextNode.

(function() {
  'use strict';

  class D3svg {
    static get name() { return 'd3svg';}

    // This is instantiated by TreeChart. Options are overridden there.
    // This class uses those by reference.
    constructor(chart) {
      this.chart = chart;
      const opts = this.options = chart.options;

      // Initialize the DOM element and SVG
      this.chartSelection = d3.select(chart.chartElem);
      const svg = this.svg = this.chartSelection.append("svg")
        .attr({
          xmlns: "http://www.w3.org/2000/svg",
          xlink: "http://www.w3.org/1999/xlink",
          width: opts.chart.width,
          height: opts.chart.height,
        })
        .style({
          'font-size': opts.chart['font-size'],
          'font-family': opts.chart['font-family'],
        });

      // frame - the graphical context for the whole drawing
      this.frame = svg.append('g')
        .attr('transform', `translate(0, ${opts.chart.height/2})`);

      // Add a <defs> element to hold definitions like gradients
      this.defs = svg.append('defs');

      this.nodeRenderer = new opts.renderer.nodeRenderer(this);
      this.linkRenderer = new opts.renderer.linkRenderer(this);
    }

    draw(nodes, links) {
      this.nodeRenderer.draw(nodes);
      this.linkRenderer.draw(links);
    }
  }

  TreeChart.D3svg = D3svg;
})();

