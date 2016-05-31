// This is a little test library I implemented for doing inline testing
// of functions. But, I've since decided that I don't really like that
// style - it makes the program too cluttered.
const {test, report} = tester({ debug: true, haltOnError: false });





//-------------------------------------------------------------

// walk the tree, applying pre- and post-traversal functions. If pre is defined
// and returns false, then the children of the current node are skipped.
// FIXME: make this into an iterator
// FIXME: add this to the tree library itself
const walk = R.curry(function(pre, post, node) {
  console.log(':walk');
  const skipKids = pre && !pre(node);
  if (!skipKids && 'children' in node) 
    node.children.forEach(child => walk(pre, post, child));
  if (post) post(node);
});





const treeDemo = function(chartElem) {
  const chartId = chartElem.getAttribute('id');
  if (!chartId) return;
  const chart = new TreeChart({
    select: '#' + chartId,
    sameNode: compareNodes,
  });

  getWords.then(words => {

    // Function that picks a random word
    const randomWord = pickRandom(words);

    // Create the initial random tree
    //--------------------------------

    // Generate a new tree node with a random word
    const newNode = R.compose(wordNode, randomWord);

    // Generate a random number of nodes
    const numNodes = random(10) + 5;
    const nodes = R.range(0, numNodes).map(newNode);

    // For each one except the first, assign a parent at random
    nodes.slice(1).forEach(function(node, i) {
      const thisNum = i + 1;  // because of the slice
      const parentNum = random(thisNum);
      const parent = nodes[parentNum];
      parent.children.push(node);
      node.parent = parent;
    });
    const tree = nodes[0];

    // Draw the tree
    chart.draw(tree);

    // Define the functions to morph the tree - create a new tree of nodes
    // with various random changes

    // Creates a function that, every time it is called, has a given
    // chance of calling the f1. If f1 is not called, and f2, is given,
    // then f2 is called instead.
    const withOdds = R.curry(function(percent, f1, f2) {
      console.log(':withOdds');
      if (random(100) < percent) return f1();
      if (typeof f2 === 'function') return f2();
      return f2 || null;
    });

    // count the number of nodes in a (sub)tree
    // FIXME: make a treeReduce to do this
    var kidCount = R.reduce((acc, b) => acc + nodeCount(b), 0);
    var nodeCount = node => 1 + kidCount(node.children);


    const morphNode = node => copyNode(node, withOdds(90, randomWord));

    // This function takes a (sub)tree, and produces a new tree that is a
    // morphed version
    const morphTree = function(tree) {
      const newTree = morphNode(tree);
      tree.children.forEach(child => {
        newTree.children.push(morphNode(child));
      });
      return newTree;
    };


    // Make a new copy of the tree, changed. For each node, with a random
    // probability, change the label, the color, add children, other features. 
    // After walking the tree, then, delete a random number of leaves.
    const morph = function(cb) {
      console.log(':morph');
      const newTree = morphTree(tree);


/*
      // change the text at random
      walk(spinText, null, tree);

      // generate new kids at random
      // change the text at random
      walk(null, sow, tree);

      // cull excess kids
      //while (nodeCount(tree) > 15) {
      //  killOne(tree);
      //}
*/      
      chart.draw(newTree);
      cb();
    };

    makeLooper(2000, morph);
  });


};

// Create the charts

const chartElems = document.getElementsByClassName('tree-demo');
for (var i = 0; i < chartElems.length; ++i) {
  treeDemo(chartElems[i]);
}
