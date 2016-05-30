// TreeChart.Tree class
// This is used to wrap a user-supplied tree of objects.
// Each Tree instance is hierarchical: each descendent node is a separate
// Tree instance.

(function() {
  if (typeof TreeChart === 'function') {
    const svgUtils = TreeChart.svgUtils;


    // Constructor - instantiates just one node. orig and parent are optional
    const Tree = TreeChart.Tree = function(frame, opts, orig, oldTree) {
      const self = this;
      self.id = Tree.nextId();
      Tree.list.push(self);
      self.orig = orig;
      self.opts = opts;
      self.frame = frame;
      self.parent = parent;

      // Draw the svg elements in zero state
      self.draw(true);
      const x = parent && ('x' in parent) ? parent.x : 0;
      const y = parent && ('y' in parent) ? parent.y : 0;
      self.x = x;
      self.y = y;
      self.elem.attr('transform', `translate(${x}, ${y}) scale(0, 1)`);
      //self.elem.attr('transform', 'scale(0, 1)');
    };

    // List of all instances
    // FIXME: the list should be attached to the chart
    Tree.list = [];

    // Given an original node, find the wrapper Tree, if there is one
    Tree.findTree = function(orig) {
      const isWrapper = (tree) => opts.sameNode(tree.orig, orig);
      return Tree.list.find(isWrapper) || null;
    }



    // Wraps the whole original tree structure, one Tree instance for each node.
    // Also draws the initial (hidden) elements, and sets all the dimensions.
    // This is a class method, and acts as the externally-facing constructor.
    Tree.wrap = function(frame, opts, orig, parent) {
      const tree = Tree.findTree(orig) || new Tree(frame, opts, orig, parent);

      // `children` is always a (possibly empty) array
      tree.children = 'children' in orig ? 
        orig.children.map(child => Tree.wrap(frame, opts, child, tree)) : [];

      return tree;
    };

    // svg definitions -- this is the drop-shadow
    Tree.defs = [
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
        </filter>`];

    // the selector for the svg elements corresponding to these
    Tree.selector = 'g.node';

    Tree.prototype.width = function() {
      return this._width;
    };

    Tree.prototype.height = function() {
      return this._height;
    };



    // draws the text, and gets the dimensions
    Tree.prototype.drawText = function(nodeElem) {
      const self = this,
            nopts = self.opts.defaults.node;

      // The text - draw it, then measure its width
      const textElem = nodeElem.append("text")
        .attr({
          x: nopts['padding-x'],
          y: 0,
          "text-anchor": "start",  // shouldn't this be start?
          "alignment-baseline": "middle",
        })
        .text(self.orig.text);

      const boundingBox = textElem[0][0].getBBox();
      self._width = boundingBox.width + 2 * nopts['padding-x'];
      self._height = boundingBox.height + 2 * nopts['padding-y'];
      return textElem;
    };

    // Instantiate the initially hidden svg elements for the root node of the 
    // tree. Typically, the size of a node can't be known until this is done,
    // since it depends on the text's bounding box.
    Tree.prototype.draw = function() {
      const self = this,
            opts = self.opts,
            nopts = opts.defaults.node
            frame = self.frame;


      //if ('morphTo' in self) {
      //  console.log('removing ', self.morphTo);
      //  self.morphTo.remove();
      //}

      // parent svg element
      const _class = 'node ' + (self.orig['class'] || '');
      const nodeElem = self.elem = frame.append("g")
        .attr({
          'class': _class,
          filter: 'url(#dropshadow)',
        });
      nodeElem.attr('id', self.id);

      self.textElem = self.drawText(nodeElem);

      // the rect
      self.boxElem = nodeElem.append("rect")
        .attr({
          'data-id': self.id,
          width: self._width,
          height: self._height,
          y: -self._height / 2,
          rx: 2.5,
          ry: 2.5,
        });

      self.textElem.moveToFront();
      return nodeElem;
    };


    Tree.prototype.getDimensions = function() {
      const self = this;

      self.newTextElem = self.drawText(self.elem);
      self.newTextElem.attr('opacity', 0);

      //newTextElem.remove();

      self.children.forEach(child => child.getDimensions());
    };

    // Move the node into place
    Tree.prototype.update = function() {
      const self = this,
            opts = self.opts;

      self.elem.transition()
        .duration(opts.duration)
        .attr('transform', `translate(${self.x}, ${self.y})`);

      self.textElem.transition()
        .duration(opts.duration)
        .attr('opacity', 0)
        .remove();

      self.newTextElem.transition()
        .duration(opts.duration)
        .attr('opacity', 1.0);

      self.boxElem.transition()
        .duration(opts.duration)
        .attr({
          width: self._width,
          height: self._height,
        });

      self.textElem = self.newTextElem;
    }

    // Apply pre- and/or post-order function(s) to every node in the tree
    Tree.prototype.walk = function(pre, post) {
      const self = this;
      if (pre) pre(self);
      self.children.forEach(child => child.walk(pre, post));
      if (post) post(self);
    };

    // Use one "global" unique id generator
    Tree.nextId = function() {
      let nextId = 1;  // start with 1 so that they are all truthy
      return function() {
        return nextId++;
      };
    }();

  }
})();


