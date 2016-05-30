//----------------------------------------------------------------
// header.js - this has to come first.

// Remove the "node nature" of this running environment. This necessary
// so that libraries, like chai for example, export their stuff to globals.
exports = undefined;


const TreeChart = (function() {
  'use strict';

  // const assert = require('chai').assert;

  return {


    // Create a new `assert` function that closes around a results object.
    // It also wraps all the chai assertions, so we can use those.
    makeAssert: () => {
      const results = {
        ran: 0,
        passed: 0,
      };

      const cassert = chai.assert;

      // Wrap an assertion so we catch its exception if there is one. 
      // Returns null if assertion is true (passed), or the error message string
      const tameAssert = function(assertFunc, ...args) {
        const errmsg = (() => {
          try { 
            assertFunc.apply(assertFunc, args); 
            return null;
          }
          catch(err) {
            return err.toString();
          }
        })();
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
        callChai('', ...args);
      };

      // For every one of chai's assert functions, add a delegator to ours
      Object.keys(cassert).forEach(fname => {
        //console.log('fname: ', fname);
        assert[fname] = function(...args) {
          callChai(fname, ...args);
        };
      });

      assert.results = results;
      return assert;
    },

  };
})();
