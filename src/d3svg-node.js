// Plugin for rendering a plain Node in SVG.

(function() {
  'use strict';

  class D3svg_Node {
    constructor(d3svg) {
      this.d3svg = d3svg;  // our parent, the renderer instance
      this.options = d3svg.options;
      this.frame = d3svg.frame;
      this.lastTreeData = d3svg.chart.lastTreeData;

      // Add the defs that we need for the node. Note that this
      // produces a nested <defs>, but that's okay, and prevents
      // us from clobbering some other module's defs, or vice-versa.
      d3svg.defs.append('defs').html(D3svg_Node.dropShadowFilter);
    }

    draw(nodes) {
      console.log('draw(nodes)');
      const selection = this.frame.selectAll('g.node')
        .data(nodes, node => node.__id);
      selection.enter()[0].forEach(item => this.drawEnter(item));
    }


    drawEnter(selItem) {
      const opts = this.options;
      const node = selItem.__data__;
      const nopts = node.opts;

      // for now: transition in from (0,0)
      const x = 0; const y = 0;

      // Add a <g> element container for this node.
      const nodeG = this.nodeG = this.d3svg.frame.append("g")
        .attr({
          'id': node.__id,
          'class': 'node',
          filter: 'url(#dropshadow)',
          transform: `translate(${x}, ${y}) scale(0, 1)`,
        });

      const contentHeight = nopts['content-height'];
      const padding = nopts.padding;
      const border = nopts.border;

      const rectWidth = border + 2 * padding + nopts['content-width'];
      const rectHeight = border + 2 * padding + contentHeight;
      const rectX = nopts['margin-left'] + border / 2;
      const rectY = (nopts['margin-top'] - nopts['margin-bottom'] - 
        contentHeight - border) / 2 - padding;

      nodeG.append("rect")
        .attr({
          'data-id': node.id,
          width: rectWidth,
          height: rectHeight,
          x: rectX,
          y: rectY,
          rx: 2.5,
          ry: 2.5,
        })
        .style({
          'stroke-width': border + 'px',
          stroke: nopts['border-color'],
          fill: nopts.fill,
        });

      // transition
      nodeG.transition()
        .duration(opts.duration)
        .attr({
          'transform': `translate(${node.x}, ${node.y})`,
        });
    }
  }

  // Drop-shadow
  D3svg_Node.dropShadowFilter = 
    ` <filter id='dropshadow' height='130%'>
        <feGaussianBlur in='SourceAlpha' stdDeviation='3'/>
        <feOffset dx='2' dy='2' result='offsetblur'/>
        <feComponentTransfer>
          <feFuncA type='linear' slope='.5'/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in='SourceGraphic'/>
        </feMerge>
      </filter>`;



  TreeChart.D3svg_Node = D3svg_Node;
})();

