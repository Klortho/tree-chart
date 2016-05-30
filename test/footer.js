//----------------------------------------------------------------
// footer.js

(function() {
  const results = {
    ran: 0,
    passed: 0,
  };

  Object.keys(TC).forEach(key => {
    if (key.substr(0, 4) == 'test' && typeof TC[key] === 'function') {
      console.log('Running ' + key + '\n');
      const testResults = TC[key]();
      results.ran += testResults.ran;
      results.passed += testResults.passed;
    }
  });
  console.log('Ran: ' + results.ran + '; passed: ' + results.passed);
})();
