//----------------------------------------------------------------
// footer.js

(function() {
  'use strict';

  // This predicate returns true if a TreeChart property value is a test func
  const isTest = key => 
    key.substr(0, 4) == 'test' && typeof TreeChart[key] === 'function';

  // Function to print results
  const printResults = (r, indent='') =>
    console.log(`${indent}Ran: ${r.ran}, passed: ${r.passed}`);

  // This function runs a test and returns its results object
  const runTest = key => {
    console.log('Running test ' + key);
    const results = TreeChart[key](TreeChart.makeAssert());
    printResults(results, '  ');
    return results;
  };

  const allResults = Object.keys(TreeChart).filter(isTest).map(runTest);





  // Flatten the array of arrays of promises
  const promises = allResults
    .map(res => res.promises).reduce((a, b) => a.concat(b), []);

  // Wait for all the promises, but use `map`, because we want to catch
  // exceptions individually, and let all of them run to completion.
  Promise.all(
    promises.map(p => {

      return p.then(() => {
        // Aggregator function - adds `ran` and `passed` into the accumulator
        const addResult = (acc, result) => {
          acc.ran += result.ran;
          acc.passed += result.passed;
          return acc;
        };

        // Aggregate all the results
        const aggregated = allResults.reduce(addResult, {ran: 0, passed: 0});
        console.log('Ran: ' + aggregated.ran + '; passed: ' + aggregated.passed);
      })
      .catch(err => {
        console.error('Exception in individual promise: ', err);
      });



    })
  )
  .catch(err => {
    console.error('Uncaught exception: ', err);
  });



})();
