//----------------------------------------------------------------
// test-word-list.js

(function() {
  TreeChart.testWordList = function() {
    const makeAssert = () => {
      const results = {
        ran: 0,
        passed: 0,
      };
      const assert = (pred, msg) => {
        results.ran++;
        if (pred) results.passed++;
        else {
          console.error('Failed: ' + msg);
        }
      };
      assert.results = results;
      return assert;
    };
    const assert = makeAssert();

    const WordList = TreeChart.WordList;
    assert(WordList.length > 10000, 'word list is too small');
    return assert.results;
  };
})();