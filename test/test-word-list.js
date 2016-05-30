//----------------------------------------------------------------
// test-word-list.js

(function() {
  'use strict';

  TreeChart.testWordList = function(assert) {
    const WordList = TreeChart.WordList;
    assert(WordList.length > 10000, 'word list is too small');
    return assert.results;
  };
})();