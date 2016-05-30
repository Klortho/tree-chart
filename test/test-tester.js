// Test the Tester


TC.testTester = function() {

  const testCases = {
    'the universe is big': true,
    'violets are green': false,
    'this message should show up in the console': false,
    'but not this one': true,
  };

  // custom reporter
  const reporter = function(msg, pred) {
    if ( (Object.keys(testCases).indexOf(msg) == -1) ||
         (pred != testCases[msg]) ) {
      throw Error("Severe: something is wrong with the tester.");
    }
  };

  const mockTester = TC.Tester.constructor({reporters: [reporter]});
  const {test, report} = mockTester;

  test('check some math', assert => {
    assert('the universe is big', true);
    assert('violets are green', false);
  });

  test(assert => {
    assert('this message should show up in the console', false);
    assert('but not this one', true);
  });
};

