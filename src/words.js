//----------------------------------------------------------------
// words.js
// Defines a function that returns a random word every time it's called. 
// I had implemented this using the new ES6 generators, but then found out 
// that they are not supported yet by Babel, without some extra work.
// 
// Three ways to instantiate: two that are asyncronous and use promises, and
// one syncronous.
//
// On Node.js, synchronous:
//
//   const wordList = require('word-list-json');
//   const words = TreeChart.Words(wordList);
//
// On Node.js, async:
//
//   TreeChart.Words.fromFile('/path/to/words.json')
//   then(function(words) {
//     ...
//   });
//
// In browser, async (uses fetch):
//
//   TreeChart.Words.fromFetch('path/to/words.json')
//   then(function(words) {
//     ...
//   })

(function() {
  'use strict';

  const Words = TreeChart.Words = class {

    constructor(wordList) {
      this.list = wordList;
    }

    // Node.js only. Uses `fs-promise`
    static fromFile(path) {
      if (typeof require === 'function') {
        const fsp = require('fs-promise');
        return fsp.readJson(path)
          .then(json => new Words(json.words));
      }
    }

    // In the browser, instantiate using fetch
    static fromFetch(url) {
      return fetch(url)
        .then(response => response.json())
        .then(json => new Words(json.words));
    }

    get length() {
      return this.list.length;
    }

    get pick() {
      return () => {
        const num = Math.floor(Math.random() * this.list.length);
        return this.list[num];
      };
    }
  };

})();
