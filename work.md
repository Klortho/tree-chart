To do:

# Stack

* Color computations



* Plain boxes demo
* Random words demo


## Nice to haves

* randomly change the colors and/or other style attributes, on the fly
* slow motion
* add a "legend" with:
    * current state
    * description of keyboard shortcuts


# Current work

* Animations - updating the tree



    * Transition in the nodes











* Text nodes
* Words demo
* New tree type for modeling JS objects.
* Presentation material







# Implementation notes

## Class hierarchy

The original node/tree data: this doesn't even know that it is being rendered.
No wrappers, I don't think. We can use a Symbol to add metadata, if needed
(but for now just add it directly).

* `Node` - plain trees with rectangular boxes, but no text.
* `TextNode` - boxes for nodes, with text
* others will be needed for modeling config-one

Layout management and delegation. This is the "controller":

* `TreeChart` - handles layout management, but doesn't know how
  to draw; it delegates to a renderer. `TreeChart` takes the place of the old
  `LayoutEngine`

Renderers

* `D3svg` - Gets events from TreeChart, manages the frame
* `D3svg_Node` - draws things specific to the Node
* `D3svg_TextNode`


## Data binding

* Every `Node` object has an __id.
* The master SVG `<g>` element for a Node has a matching @id attribute.
* Child elements of that `<g>` each also have a @data-id attribute with the
  same value


* links are identified by their *targets*, since every link has only one
  target.
* They have a <path> element (no containing <g>) with @id = 'link-#' and class 'link'




