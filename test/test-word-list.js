//----------------------------------------------------------------
// test-word-list.js

(function() {
  'use strict';

  new AssertionsPlus('word list', function(assert) {
    const WordList = TreeChart.WordList;
    assert.isAbove(WordList.length, 100000, 'word list is too small');
    return assert.results;
  });

})();