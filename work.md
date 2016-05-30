To do tonight:

# tree-chart

To do:

* Separate out, and test, the word list utilities
    * first get my tests passing
* randomly change the colors
* slow motion
* add a key with:
    * current state
    * description of shortcuts

* make sure it is rock-solidly robust.
    * check for memory leaks
* get it to work from webpack
* Move tester.js into a separate library, funcutils.

# Work

Strategy:

* Use ES6 classes, but no modularization: everything is global!!
* Don't use any features that aren't support both by node 6 and the version of 
  Chrome you're using
* Test:
    * My test runner is: tester! No tweaking!
    * chai assertions
    * In Node v.6: concat everything, run through babel, and then (maybe mocha)
    * In Chrome, use a test.html file.

* Directory structure:
    - src
        - index.html - demo page
        - demo.js - driver
        - tree-chart.js - main class
        - ...
    - src1 - last iteration's
    - src2 - one before that
    - vendor - put all deps here, hopefully the same ones work in browser and node.


* Get tester working first
    * In node: 6.2.0



