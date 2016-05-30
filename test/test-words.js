//----------------------------------------------------------------
// test-words.js

(function() {
  'use strict';

  TreeChart.testWords = function(assert) {

    // Instantiate a word list synchronously

    const words = new TreeChart.Words(TreeChart.WordList);
    assert(words.length > 100000, 'word list seems too short');

    // Test that if we pick ten random words, we'll get at least nine different
    // ones. Not sure what the odds are, but should be pretty high
    const randomWords = {};
    for (let i = 0; i < 10; ++i) {
      const w = words.pick();
      //console.log('got random word: ' + w);
      randomWords[w] = true;
    }
    assert(Object.keys(randomWords).length >= 9, 'words aren\'t random enough');

    // Async from a file (Node.js only)
    if (typeof module !== 'undefined') {
      console.log('===== NODE =====');

      assert.promise(
        TreeChart.Words.fromFile('/path/to/words.json')
        .then(function(words) {
          console.log('aok');
          return true;
        })
        .catch(function(err) {
          return assert.fail(null, null, 'Expected to get word list: ' + err);
        })
      );


    }


    return assert.results;
  };
})();