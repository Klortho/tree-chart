//----------------------------------------------------------------
// words.js
// Defines a function that returns a random word every time it's called. 
// I had implemented this using the new ES6 generators, but then found out 
// that they are not supported yet by Babel, without some extra work.

(function() {
  'use strict';

  const Words = TreeChart.Words = class {

    static get list() {
      return TreeChart.WordList;
    }

    static get length() {
      return Words.list.length;
    }

    static get pick() {
      return () => {
        const num = Math.floor(Math.random() * Words.length);
        return Words.list[num];
      };
    }
  };

})();
