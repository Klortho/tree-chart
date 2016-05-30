//----------------------------------------------------------------
// assertions.js - defines a class that we use to import chai
// and extend its functionality.

const AssertionsPlus = (function() {
  'use strict';

  const chaiAssert = chai.assert;

  // Wrap an assertion, catching any exception. The tame function returns null 
  // on success, or the error message string on failure.
  const tameAssert = assertFunc => 
    function(...args) {
      try { 
        assertFunc(...args); 
        return null;
      }
      catch(err) {
        return err.toString();
      }
    };

  // Tames a chai assertion function, given its name
  const tameChai = fname => tameAssert(chaiAssert[fname]);

  const _allTests = [];

  return class {
    constructor(description, testFunc) {
      _allTests.push(this);
      this.description = description;
      this.testFunc = testFunc;
      this.done = false;  // you can only run a test once.

      // The following record the results of the individual assertions
      this.ran = 0;
      this.passed = 0;
      this.errors = [];
      this.promises = [];

      // For every one of chai's assert functions, add a delegator method
      // FIXME: can we do this with new ES6 syntax?
      Object.keys(chaiAssert).forEach(fname => {
        this[fname] = function(...args) {
          this.delegate(tameChai(fname), ...args);
        };
      });
    }

    static get allTests() {
      return _allTests;
    }

    // Test an async promise-based function.
    // Usage:
    //   assert.promise('failed to fetch',
    //     unit.fetch(path)
    //     .then(data => {
    //       ... test using other assert functions, as normal ...
    //     }));

    get promise() {
      return (msg, unitp) => {
        // Note that the promise itself counts as a test
        const wrap = unitp
        .then(
          value => {  // resolved
            this.ran++;
            this.passed++;
            return value;
          },
          err => {    // rejected
            const errmsg = `Promise rejected: ${msg}: ${err.toString()}`;
            this.ran++;
            this.errors.push(errmsg);
            return errmsg;
          }
        );
        this.promises.push(wrap);
        return wrap;
      };
    }

    // Returns a promise that resolves when all the promise-based assertions
    // resolve. You can only run a test once.
    run() {
      if (!this.done) {
        this.done = true;
        this.testFunc(this);
      }
      return Promise.all(this.promises);
    }

    // This method delegates to a well-behaved ("tame") assertion function,
    // and records the results
    delegate(tameAssert, ...args) {
      this.ran++;
      const status = tameAssert(...args);
      status == null 
        ? this.passed++
        : this.errors.push(status);
      return status;
    }

    toString() {
      const r = this;
      var str = `Test ${this.description}: ran ${this.ran}, passed ` +
        `${this.passed}, failed ${this.errors.length}.`;
      r.errors.forEach(err => {
        str += `\n  ${err}`;
      });
      return str;
    }

    // Returns a promise that resolves when all the promises in the whole
    // suite resolve
    static runAll() {
      return Promise.all(_allTests.map(t => t.run()))
    }

    // Runs all the tests and reports the results to the console
    static runAndReportAll() {
      AssertionsPlus.runAll()
      .then(() => {
        const agg = {  // aggregated results
          ran: 0,
          passed: 0,
          failed: 0,
        }
        const report = _allTests.map(t => {
          agg.ran += t.ran;
          agg.passed += t.passed;
          agg.failed += t.errors.length;
          return t.toString();
        }).join('\n');

        console.log(report);
        console.log(`Total ran ${agg.ran}, passed ${agg.passed}, ` +
          `failed ${agg.failed}.`);
      });
    }
  };
})();

