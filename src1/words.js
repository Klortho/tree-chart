// Some functions related to the word list used in the demo. This is not 
// included in the distribution. 
// Works in browsers only; and only tested in Chrome.

// The main thing this is used for is to make an iterator that produces a new
// random word from the list with every iteration.

WordList = (function() {
  'use strict';

  // FIXME
  // I'm cheating and storing the words here after the promise resolves, so
  // that other methods don't have to return promises
  var _wordList = null;

  const WordList = class {

    // 
    // Generator that creates an iterator that produces a sequence of random 
    // numbers between min (inclusive) - max (non-inclusive)
    // Usage:
    //   var guesser = WordList.random(0, 100);
    //   var guess = guesser.next().value;
    static get random() {
      function* _random(max, min=0) {
        while(true) yield Math.floor(Math.random() * (max-min) + min);
      };
      return _random;
    }

    // Generator that picks a random item from a list.
    // Usage:
    //   var picker = WordList.pick(['rock', 'paper', 'scissor']);
    //   var play = picker.next().value;
    static get pick() {
      function* pickGen(list) {
        const picker = WordList.random(0, list.length);
        while(true) {
          const nextNum = picker.next().value;
          yield list[nextNum];
        }
      };
      return pickGen;
    }

/*
    constructor(_opts = {}) {
      this.options = config1.extend(WordList.defaults, _opts);

      // Promise to get the words.
      this.words = 
        fetch('base/node_modules/word-list-json/words.json')
          .then(response => response.json())
          .then(json => {
            console.log('fetch.then.then->json: keys:', Object.keys(json));
            console.log('_wordList: ', _wordList);
            _wordList = json.words;
            return _wordList;
          })
          .catch(err => StackTrace.fromError(err).then(trace => {
            console.error('Error: ', err);
            console.error(trace);
          }));


      // Generator that returns a random word every time.
      // array => function that produces random word from the array
      this.wordGenerator = (() => {
        console.log('getting randomNum generator');
        const randomNum = WordList.randomGen(0, _wordList.length);
        console.log('done getting randomNum generator');

        function* worder() {
          while(true) yield _wordList[randomNum.next().value];
        }
        return worder;
      })();
    }

    static get defaults() {
      return {
        path: 'base/node_modules/word-list-json/words.json',
      };
    }
*/

/*


    const picker = pickRandom(myList);
    */
  };

  return WordList;
})();


