// Plugin for rendering a plain Node in SVG.

(function() {
  'use strict';

  class D3svg_Node {
    constructor(d3svg) {
      this.d3svg = d3svg;  // our parent, the renderer instance
      this.chart = d3svg.chart;
      this.options = d3svg.options;
      this.frame = d3svg.frame;

      // Add the defs that we need for the node. Note that this
      // produces a nested <defs>, but that's okay, and prevents
      // us from clobbering some other module's defs, or vice-versa.
      d3svg.defs.append('defs').html(D3svg_Node.dropShadowFilter);
    }

    draw(nodes) {
      const self = this;
      const opts = this.options;
      const chart = this.chart;

      const update = this.frame.selectAll('g.node')
        .data(nodes, function(node) {
          // Call with this == the <g> node sometimes and `node` == our data
          // sometimes
          return this.id || node.__id || null;
        });

      update.enter()[0].forEach(function(item) {
        self.enterNode(item.__data__);
      });

      // Move the elements to their locations according to the layout
      update.each(function(node) {
        self.updateNode(this, node);
      });

      // Transition exiting links to the parent's new positions.
      update.exit().transition()
        .duration(opts.duration)
        .attr('transform', function(node) {
          const xid = node ? node.__id : this.id;
          const targetId = chart.firstRemainingAncestorId(xid);
          const tpos = chart.absAnchorOut(targetId);
          return `translate(${tpos.x}, ${tpos.y}) scale(0, 1)`;
        })
        .remove();
    }


    updateNode(elem, node) {
      const opts = this.options;
      d3.select(elem).transition().duration(opts.duration)
      .attr({
          'transform': `translate(${node.x}, ${node.y})`,
      });
    }

    enterNode(node) {
      const opts = this.options;
      const nopts = node.opts;
      const lastTreeData = this.d3svg.chart.lastTreeData;

      // for now: transition in from (0,0)
      var x = 0; 
      var y = 0;

      const parent = node.parent || null;
      if (parent && lastTreeData) {
        const last = lastTreeData[parent.__id];
        if (last) {
          x = last.position.x + last.anchorOut.x;
          y = last.position.y + last.anchorOut.y;
        }
      }

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
          'data-id': node.__id,
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

