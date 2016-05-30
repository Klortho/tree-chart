//----------------------------------------------------------------
// footer.js

(function() {
  const results = {
    ran: 0,
    passed: 0,
  };

  Object.keys(TreeChart).forEach(key => {
    if (key.substr(0, 4) == 'test' && typeof TreeChart[key] === 'function') {
      console.log('Running ' + key + '\n');
      const testResults = TreeChart[key]();
      results.ran += testResults.ran;
      results.passed += testResults.passed;
    }
  });
  console.log('Ran: ' + results.ran + '; passed: ' + results.passed);
})();
