//----------------------------------------------------------------
// assertions.js - defines a function that we use to import chai
// and extend its functionality.
// All of the assert functions push their results onto a locally bound
// `results` array. They also all return either `null` on success, or an
// error message string on failure.

// We would have this (but it's already included):
// const assert = require('chai').assert;

(function() {
  'use strict';

  // Create a new `assert` function that closes around a results object.
  // It also wraps all the chai assertions, so we can use those.
  TreeChart.makeAssert = function() {
    const results = {
      ran: 0,
      passed: 0,
      promises: [],
    };

    const cassert = chai.assert;

    // Wrap an assertion so we catch its exception if there is one. 
    // Returns null if assertion is true (passed), or the error message string
    const tameAssert = function(assertFunc, ...args) {
      try { 
        assertFunc.apply(assertFunc, args); 
        return null;
      }
      catch(err) {
        return err.toString();
      }
    };

    // Delegate a call to assert or one of it's pals, via tameAssert. This
    // records the results.
    const callChai = function(fname, ...args) {
      results.ran++;
      const chaiFunc = fname == '' ? cassert : cassert[fname];
      const errmsg = tameAssert(chaiFunc, ...args);
      if (!errmsg) {
        results.passed++;
      }
      else {
        console.error(errmsg);
      }
    };

    // Here's our new assert function
    const assert = function(...args) {
      return callChai('', ...args);
    };

    // For every one of chai's assert functions, add a delegator to ours
    Object.keys(cassert).forEach(fname => {
      //console.log('fname: ', fname);
      assert[fname] = function(...args) {
        return callChai(fname, ...args);
      };
    });

    // To test promises:
    //   assert.promise(
    //     unit.asyncFunc()
    //     .then(data => {
    //       ... test using other assert functions, as normal ...
    //     })
    //     .catch(err => {
    //       assert.fail(null, null, 'unit async failed: ' + err)
    //     })
    //   );
    assert.promise = function(p) {
      results.promises.push(p);
      return p;
    }

    assert.results = results;
    return assert;
  };
})();
