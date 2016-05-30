// LayoutEngine class - this encapsulates the flextree layout engine:
// - before doing a new layout, saves to old x and y values to x0 and y0
// - hides the fact that for the flextree engine, x and y are reversed.

(function() {
  if (typeof TreeChart === 'function') {

    const LayoutEngine = TreeChart.LayoutEngine = function(opts) {
      const self = this;
      self.opts = opts;

      self.flextree = d3.layout.flextree()
        .nodeSize(function(node) { 
          try {
            const h = node.height();
            const w = node.width();
            if ((typeof h !== 'number') || (typeof w !== 'number'))
              throw Error('bad value for width and/or height');

            const orig = node.orig;
            var nopts = null;
            //console.log('orig: ', orig);
            if (orig && 'class' in orig) {
              const cls = orig['class'];
              //console.log('class: ', cls);

              if (opts && cls in opts) {
                const classOpts = opts[cls];
                //console.log('classOpts: ', classOpts);

                if (classOpts && (typeof classOpts === 'object') &&
                    ('node' in classOpts)) {
                  nopts = classOpts.node;
                  //console.log('nopts: ', nopts);
                }
              }
            }
            if (!nopts) {
              nopts = opts.defaults.node;
              //console.log('nopts using defaults: ', nopts);
            }

            var marginX = 0;
            if (nopts && typeof nopts == 'object' && 'margin-x' in nopts ) {
              marginX = nopts['margin-x'];
            }
            else {
              marginX = 40;
            }
            //console.log('got marginX: ' + marginX);

            var marginY = 0;
            if (nopts && typeof nopts == 'object' && 'margin-y' in nopts ) {
              marginY = nopts['margin-y'];
            }
            else {
              throw Error('couldnt find marginY');
            }
            //console.log('got marginY: ' + marginY);

            return [h + marginY, w + marginX];

/*
            return [
              node.height() + nopts['margin-y'], 
              node.width() + nopts['margin-x']
            ];
*/

          }
          catch(err) {
            console.error(err);
            return [50, 100];
          }
        })
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
