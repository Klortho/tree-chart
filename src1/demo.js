// This is a little test library I implemented for doing inline testing
// of functions. But, I've since decided that I don't really like that
// style - it makes the program too cluttered.
const {test, report} = tester({ debug: true, haltOnError: false });


//---------------------------------------------------
// WordNode class

// Constructor
// word => tree node representing that word
const wordNode = (() => {
  let idCounter = 1;
  return word => ({
    __id: idCounter++,
    text: word,
    children: [],
  });
})();
test('wordNode', assert => {
  const z = wordNode('zorumbus');
  assert(z.__id == 1);
  assert(z.text == 'zorumbus');
  assert(z.children.length == 0);
});

// Copy a word node, without it's children, and with or without changing 
// the word. This produces a new 
// object that's identified as the same in the tree drawing
const copyNode = (orig, word=null) => ({
  __id: orig.__id,
  text: word || orig.text,
  children: [],
});

const compareNodes = (n1, n2) => {
  if (!n1.__id || !n2.__id) throw Error('bad id');
  return n1.__id === n2.__id;
};


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


document.onkeydown = function (evt) {
  console.log('onkeydown evt: ', evt);
  const evtName = 
    evt.keyCode == 27 ? 'escape' :
    evt.keyCode == 32 ? 'space' :
    null;
  if (evtName) document.dispatchEvent(new Event('escape'));
};


// Create a looper, with shortcut keys:
// - <esc> - stop
// - <space> - restart
// The function should call cb when it's done.

const makeLooper = function(delay, func) {
  const cb = () => { /* does nothing yet */ };

  var intervalId = null;
  const start = () => {
    if (intervalId == null) {
      console.log('starting');
      intervalId = setInterval(() => func(cb), delay);
    }
    else console.log('already started');  
    document.getElementById('state').innerHTML = 'running';
  };
  const stop = () => {
    if (intervalId) {
      console.log('stopping');
      clearInterval(intervalId);
    }
    else console.log('already stopped');
    intervalId = null;
    document.getElementById('state').innerHTML = 'stopped';
  };
  
  document.addEventListener('escape', stop);
  document.addEventListener('space', start);

  start();
};

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

/*
// word => tree node representing that word
const wordNode = (() => {
  let idCounter = 1;
  return word => ({
    id: idCounter++,
    text: word,
    children: [],
  });
})();
*/


/*
    // FIXME: instead of this, create a new node, using the tree-chart's
    // id functionality to identify it as the same logical node
    // This function changes the text of node at random
    const spinText = node => {
      console.log(':spinText');
      withOdds(50, () => { node.text = randomWord(); })
    };

    // have some kids at random
    const sow = node => {
      console.log(':sow');
      // have some new kids
      withOdds(25, () => {
        const kid = newNode();
        node.children.push(newNode());
        kid.parent = node;
      });
    };

    const killOne = function(tree) {
      console.log(':killOne');
      const nodes = [];
      walk(n => {nodes.push(n);}, null, tree);
      const i = Math.floor(Math.random() * nodes.length);
      const kid = nodes[i];
      if (kid.parent) {  // don't delete the root!
        const sibs = kid.parent.children;
        const sibi = sibs.indexOf(kid);
        sibs.splice(sibi, 1);
      }
    };
*/    

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
