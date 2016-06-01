// LayoutEngine class - this encapsulates the flextree layout engine:
// - before doing a new layout, saves to old x and y values to x0 and y0
// - hides the fact that for the flextree engine, x and y are reversed.

(function() {
  if (typeof TreeChart === 'function') {

    const LayoutEngine = TreeChart.LayoutEngine = function(opts) {
      const self = this;
      self.opts = opts;

        .spacing(function(a, b) {
          return a.elem_parent === b.elem_parent ? 10 : 20;
        });
    }

    LayoutEngine.prototype.doLayout = function(tree) {
      const self = this,
            flextree = self.flextree;

      // save the original values of (x, y) to (x0, y0)
      tree.walk(node => {
        node.x0 = node.x;
        node.y0 = node.y;
      });

      // do the layout
      const nodes = self.flextree.nodes(tree);
      // swap x and y
      nodes.forEach(n => {
        const x = n.x;
        n.x = n.y;
        n.y = x;
      });

      return {
        nodes: nodes,
        links: flextree.links(nodes),
      };
    }
  }
})();
