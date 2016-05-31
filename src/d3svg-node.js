// Plugin for rendering a plain Node in SVG.

(function() {
  'use strict';

  class D3svg_Node {
    constructor(d3svg) {
      this.d3svg = d3svg;  // our parent, the renderer instance
      const opts = this.options = d3svg.options;

      // Add the defs that we need for the node. Note that this
      // produces a nested <defs>, but that's okay, and prevents
      // us from clobbering some other module's defs, or vice-versa.
      d3svg.defs.append('defs').html(D3svg_Node.dropShadowFilter);
    }

    drawEnter(node) {
      const nopts = this.options.node;

      const nodeG = this.nodeG = this.d3svg.frame.append("g")
        .attr({
          'id': node.__id,
          'class': 'node',
          filter: 'url(#dropshadow)',
        });

      // the rect

      /* testing
      node['content-width'] = 10;
      node['content-height'] = 10;
      node.padding = 50;
      node.border = 50;
      node['margin-top'] = 0;
      node['margin-right'] = 0;
      node['margin-bottom'] = 0;
      node['margin-left'] = 0; */

      const contentWidth = nopts['content-width'](node);
      const contentHeight = nopts['content-height'](node);
      const padding = nopts.padding(node);
      const border = nopts.border(node);
      const marginTop = nopts['margin-top'](node);
      const marginBottom = nopts['margin-bottom'](node);
      const marginLeft = nopts['margin-left'](node);
      const fill = nopts.fill(node);
      const borderColor = nopts['border-color'](node);

      const rectWidth = border + 2 * padding + contentWidth;
      const rectHeight = border + 2 * padding + contentHeight;
      const rectX = marginLeft + border / 2;
      const rectY = (marginTop - marginBottom - contentHeight - border) / 2 - padding;

      /* testing
      console.log('rectWidth: ', rectWidth);
      console.log('rectHeight: ', rectHeight);
      console.log('rectX: ', rectX);
      console.log('rectY: ', rectY); */

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
          stroke: borderColor,
          fill: fill,
        });

      // transition
      nodeG.attr({
        'transform': `translate(${node.x}, ${node.y})`,
      })
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

