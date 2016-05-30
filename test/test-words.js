//----------------------------------------------------------------
// test-words.js

(function() {
  'use strict';

  TreeChart.testWords = function(assert) {
    assert(2 == 2, 'uh oh');
    const words = TreeChart.Words;
    assert(words.length > 100000, 'word list seems too short');

    // Test that if we pick ten random words, we'll get at least nine different
    // ones. Not sure what the odds are, but should be pretty high
    const randomWords = {};
    for (let i = 0; i < 10; ++i) {
      const w = words.pick();
      //console.log('got random word: ' + w);
      randomWords[w] = true;
    }
    assert(Object.keys(randomWords).length >= 9, 
      'words don\'t seem random enough');

    return assert.results;
  };
})();