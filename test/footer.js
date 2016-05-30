//----------------------------------------------------------------
// footer.js

(function() {
  'use strict';
  const results = {
    ran: 0,
    passed: 0,
  };

  // Find and run all the tests
  Object.keys(TreeChart).forEach(key => {
    if (key.substr(0, 4) == 'test' && typeof TreeChart[key] === 'function') {
      console.log('Running ' + key + '\n');

      const testResults = TreeChart[key](TreeChart.makeAssert());
      results.ran += testResults.ran;
      results.passed += testResults.passed;
    }
  });
  console.log('Ran: ' + results.ran + '; passed: ' + results.passed);
})();
