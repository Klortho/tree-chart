//----------------------------------------------------------------
// header.js - this has to come first.

const TreeChart = (function() {
  'use strict';
  return {

    // Create a new `assert` function that closes around a results object.
    makeAssert: () => {
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
        return pred;
      };
      assert.results = results;
      return assert;
    },

  };
})();
