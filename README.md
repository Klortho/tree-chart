# tree-chart

Right now this is in the middle of yet another major refactoring. Recent, 
mostly-working code is in old-src. New stuff (not working at all yet) is in
src.

Develop:

```
npm install
```

Then bring up index.html in your browser to see the demo (currently broken).

Test with

```
karma start karma.conf.js
```

## To do

* Integrate this [pan-zoom library](https://github.com/ariutta/svg-pan-zoom)
* Get the 3rd-party stuff out of the VCS! 
* Figure out whether or not to keep tester.js. It is supposed to be a clean
  way to define inline tests. But after writing a few, I decided I didn't
  like having the tests inline, after all. Nevertheless, this is a cute little
  module.
* Switch to using webpack. Will that eliminate the need for karma?

## Testing framework

Current setup is:

* karma
* mocha
* karma-chrome-launcher
* chai - http://chaijs.com/api/assert/

I tried Jasmine, and I don't like this natural-language like assertion stuff.
I just want to use `assert`.


## ES6 tricks

* Use `Array.from()` to convert DOM Node lists into arrays.

* Note also that they are iterable:

    ```
     for (let node of document.querySelectorAll('···')) {
        ···
    }
    ```
    