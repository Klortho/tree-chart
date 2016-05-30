// Test utility. Run this either from the command-line with node (v6) or in
// Google Chrome.

'use strict';

// This exports a single object. Individual test files are written like this:
//
//   const {test, report} = TC.Tester;
//   ... write some code here ...
//   test('check some math', assert => {
//     assert('math is hard', 1 + 1 == 2.1);
//     assert(5 == 5);
//   });
//
// At any time during the testing, report has the array of results so far:
// [ { test: 'check some math',
//     report: [
//       { passed: false, msg: 'math is hard' }, 
//       { passed; true, msg: '#1' },   // default msg is the assertion number
//     ]
//   }, 
// ]

// Reporters get notified of every assertion, whether they pass or fail.
// Inside the reporter function, `this` is bound to this test's report
// object.

TC.Tester = (function() {
  const TesterClass = function(_opts) {
    const report = [];

    const defaultReporter = function(msg, pred) {
      if (!pred) console.error(
        `Error in test '${this.desc}', failed assertion '${msg}'`);
      this.report.push({
        passed: pred,
        msg: msg,
      });
    };

    //const defaults = {
    const defaults = {
      debug: true,
      haltOnError: true,
      reporters: [ defaultReporter ],
      extraReporters: [],
    };
    const opts = Object.assign(Object.assign({}, defaults), _opts);
    //opts.reporters = opts.reporters.concat(opts.extraReporters);

    const assertTemplate = function(...args) {
      const msg = args.length == 2 ? args[0] : '#' + this.report.length;
      const pred = args.length == 2 ? args[1] : args[0];
      this.reporters.forEach(r => r(msg, pred));
    };

    // test makes a new testContext object, and then makes re-bound 
    // copies of each of the reporters and the assert function.
    // run() takes an assert argument which it should use for its assertions.
    const test = function(...args) {
      const desc = args.length == 2 ? args[0] : '#' + report.length;
      const run = args.length == 2 ? args[1] : args[0];

      const testReport = {
        desc: desc,
        report: [],
      };
      report.push(testReport);

      // Make new bound copies of assert and the reporters
      const assert = assertTemplate.bind({
        report: testReport.report,
        reporters: opts.reporters.map(r => r.bind(testReport)),
      });

      // run the test
      run(assert);
    };

    // If debug is false, the test routine does nothing at all
    return {
      test: opts.debug ? test : () => {},
      report: report,
    };
  };

  // Return the one and only instance of TesterClass
  const singleton = TesterClass();
  singleton.constructor = TesterClass;
  return singleton;
})();


