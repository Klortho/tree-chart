// Plugin for rendering a link in SVG with D3

(function() {
  'use strict';


  // Functions for generating the diagonals. These are the lines between the 
  // boxes.
  // See https://github.com/mbostock/d3/wiki/SVG-Shapes#diagonal.

  // This sums up an absolute and relative position, and then swaps the x
  // and y.
  const diagEndpoint = function(position, anchor) {
    return {
      y: position.x + anchor.x,
      x: position.y + anchor.y,
    };
  }

  // The function that, when given the link, returns the x, y of the source
  // of the link
  const diagSource = link => 
    diagEndpoint(link.source, link.source.opts['anchor-out']);

  // Function that returns the target x, y for th diagonal of a link.
  const diagTarget = link => 
    diagEndpoint(link.target, link.target.opts['anchor-in']);

  // The standard diagonal generator for the finished layout. It takes a 
  // link (with source and target) and returns an SVG path string.
  const diagonalPath = d3.svg.diagonal()
      .source(diagSource)
      .target(diagTarget)
      .projection(d => [d.y, d.x]);


  // The enter diag function takes a link and returns the svg path corresponding
  // to the beginning of its transition. So, first we need the function that
  // computes that beginning point from a link.

  const makeEnterPoint = function(lastTreeData) {
    return function(link) {
      const target = link.target;

      var ancestor;
      if (lastTreeData) {
        ancestor = target.getParent();
        while (ancestor && !(ancestor.__id in lastTreeData))
          ancestor = ancestor.getParent();
      }
      else {
        ancestor = null;
      }

      var zeroNode;
      if (ancestor) {
        const ancestorLastPos = lastTreeData[ancestor.__id];
        return diagEndpoint(ancestorLastPos.position, ancestorLastPos.anchorOut)
      }
      else {
        return { x: 0, y: 0 };
      }
    };
  };

  // The same function is passed to source 
  // and target, and it returns the origin of the link.
  // In this case, the link springs from the 
  // nearest existing ancesor's current anchor-out position.

  const enterDiagPath = function(lastTreeData) {
    // Get the function that returns the enter point (maybe this data could
    // be a static value?)
    const enterPoint = makeEnterPoint(lastTreeData);

    return d3.svg.diagonal()
      .source(enterPoint)
      .target(enterPoint)
      .projection(d => [d.y, d.x]);
  };


  class D3svg_Link {
    constructor(d3svg) {
      this.d3svg = d3svg;
      this.options = d3svg.options;
      this.frame = d3svg.frame;
      this.lastTreeData = d3svg.chart.lastTreeData;
    }

    draw(links) {
      console.log('draw(links)');
      const opts = this.options;

      //const _try = this.startDiag(links[0]);

      const links_selection = this.frame.selectAll("path.link")
        .data(links, function(d) { return d.target.__id; });


      const linksEnter = links_selection.enter()
      .insert("path", "g")
        .attr({
          id: d => d.target.__id,
          'class': 'link',
          d: enterDiagPath(this.lastTreeData),
        })
        .style({
          fill: 'none',
          stroke: opts.links.color,
          'stroke-width': opts.links['stroke-width'] + 'pt',
        });

      console.log('duration: ', opts.duration);
      linksEnter.transition()
        .duration(opts.duration)
        .attr('d', diagonalPath);


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


  TreeChart.D3svg_Link = D3svg_Link;
})();

