# Testing

This is a very primitive, custom test framework, for testing both in Node.js
version 6 and in a browser.

- First concatenate all the files listed in tester-files.txt into 
  tester-bundle.js. These include:
    - tester-head.js - defines assert, and 
    - tester-foot.js - runs all the defined tests
- Then, run tester-bundle.js for testing in Node.js
- Bring up, or reload, tester.html, for testing in the browser.

