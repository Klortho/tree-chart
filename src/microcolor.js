//----------------------------------------------------------------
// microcolor.js
// A thin wrapper around tinycolor, because it mutates.
// (https://github.com/bgrins/TinyColor/issues/95).

// Didn't add class methods:
//   "fromRatio", "equals", "random", "mix", "readability", "isReadable", 
//   "mostReadable", "names", "hexNames"


const Microcolor = function() {
  'use strict';

  const shallowCopy = obj => {
    const copy = {};
    Object.keys(obj).forEach(k => {
      copy[k] = obj[k];
    });
    return copy;
  }

  class Microcolor {

    // Construct from either a string or another "cc" object. Won't mutate
    // anything.
    constructor(src) {
      this.tc = 
          src instanceof Microcolor ? src.tc.clone()
        : src instanceof tinycolor ? src.clone()
        : typeof src === 'string' ? tinycolor(src)
        : typeof src === 'object' ? tinycolor(shallowCopy(src))
        : tinycolor('black');
    }
  };

  // add instance methods, such that they don't mutate anything
  Object.keys(tinycolor.prototype).forEach(method => {
    Microcolor.prototype[method] = function(...args) {
      //console.log('======> this: ', this);
      const target = this.tc.clone();
      const result = tinycolor.prototype[method].call(target, ...args);
      if (target === result) {
        return new Microcolor(result);
      }
      return result;
    }
  });

  return Microcolor;
}();


// test
debug = false;
if (typeof debug !== 'undefined' && debug) { 
  (function() {
    const assert = function(pred) {
      if (!pred) throw Error('bad');
    }
    const c1 = new Microcolor('red');
    assert(c1.toString() === 'red');

    const c2 = c1.brighten(100);
    assert(c2 !== c1);    
    assert(c1.toString() === 'red');
    assert(c2.toString() === 'white');

    const c3 = new Microcolor({h: 90, s: 0.43, l: 0.49});
    assert(c3.toString().substr(0, 3) === 'hsl');

  })();
}


