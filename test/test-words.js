//----------------------------------------------------------------
// test-words.js

(function() {
  'use strict';

  new AssertionsPlus('words', function(assert) {

    function wordsTest(words) {
      assert.isAbove(words.length, 100000, 'word list seems too short');

      // Test that if we pick ten random words, we'll get at least nine different
      // ones. Not sure what the odds are, but should be pretty high
      const randomWords = {};
      for (let i = 0; i < 10; ++i) {
        const w = words.pick();
        //console.log('got random word: ' + w);
        randomWords[w] = true;
      }
      assert.isAtLeast(Object.keys(randomWords).length, 9, 
        'words aren\'t random enough');
    }

    // Synchronous
    wordsTest(new TreeChart.Words(TreeChart.WordList));

    const relPath = '../node_modules/word-list-json/words.json';

    // Async from a file (Node.js only)
    if (typeof module !== 'undefined') {
      assert.promise('failed to get words from filesystem',
        TreeChart.Words.fromFile(relPath)
          .then(wordsTest)
      );
    }
    else {
      assert.promise('failed to fetch words',
        TreeChart.Words.fromFetch(relPath)
          .then(wordsTest)
      );
    }

    return assert.results;
  });
})();