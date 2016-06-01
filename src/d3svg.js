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
      const C1 = TreeChart.config1;
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

      // Diagonal generator. `diagonal` is a function that
      // draws the lines between the boxes.
      // See https://github.com/mbostock/d3/wiki/SVG-Shapes#diagonal.

      this.diagSource = link => ({
        y: link.source.x + link.source.opts['anchor-out'].x,
        x: link.source.y + link.source.opts['anchor-out'].y,
      });
      this.diagTarget = link => ({
        y: link.target.x + link.target.opts['anchor-in'].x,
        x: link.target.y + link.target.opts['anchor-in'].y,
      });

      this.diagonal = d3.svg.diagonal()
        .source(this.diagSource)
        .target(this.diagTarget)
        .projection(d => [d.y, d.x]);

      // frame - the graphical context for the whole drawing
      this.frame = svg.append('g')
        .attr('transform', `translate(0, ${opts.chart.height/2})`);

      // Add a <defs> element to hold definitions like gradients
      this.defs = svg.append('defs');

      this.nodeRenderer = new opts.renderer.nodeRenderer(this);
    }

    drawEnter(node) {
      this.nodeRenderer.drawEnter(node);
    }

    //--------------------------------------------------
    // links

    drawLinks(links) {
      const opts = this.options;
      console.log('hey, links: ', links);

      const links_selection = this.frame.selectAll("path.link")
        .data(links, function(d) { return d.target.__id; });
      const diagonal = this.diagonal;

      links_selection.enter().insert("path", "g")
        .attr({
          id: function(d) {
            console.log('calling id func with d: ', d);
            return d.target.__id;
          },
          'class': 'link',
          d: diagonal,
        })
        .style({
          fill: 'none',
          stroke: opts.links.color,
          'stroke-width': opts.links['stroke-width'] + 'pt',
        });



/*

      // Function to make a diagonal function for entering and exiting 
      // transitions of the links
      const zeroDiag = function(d) {
        const parent = d.target.parent,
              x = parent && ('x' in parent) ? parent.x : 0,
              y = parent && ('y' in parent) ? parent.y : 0,
              dummyNode = { x: x, y: y, width: () => 0, };
        return diagonal({
          source: dummyNode, 
          target: dummyNode
        });
      };

      links_selection.enter().insert("path", "g")
        .attr({
          id: d => d.target.id,
          'class': 'link',
          d: zeroDiag,
        });

      links_selection.transition()
        .duration(opts.duration)
        .attr('d', diagonal);

      const cb = d => {
        console.log('cb, d: ', d);
      };

      // Transition exiting links to the parent's new positions.
      links_selection.exit().transition()
        .duration(opts.duration)
        .attr('d', zeroDiag)
        .each('end', cb)
        .remove();
*/
    }
  }

  // Class data goes here
  //D3svg.flingle = 'dorbut';


  TreeChart.D3svg = D3svg;
})();

