# tree-chart

Right now this is in the middle of yet another major refactoring. 

Develop:

```
npm install
```

Test:

```
npm test
```


## State of this software

I ventured to learn and implement a lot of new tools at once, and ran into 
problems. So I backed off, and now, the files that make up this library are:

* Not in any standard module format. They each add one property to a global
  `TreeChart` object.
* Use some ES6 features, but I'm not even using Babel at the moment. So, I'm
  limiting myself to what works in Node.js version 6 and Chrome 50.0 (which
  seems like quite a lot).
* Custom test "framework" -- I just concatenate all the files, and run them,
  once in Node.js, and once in the browser by manually reloading 
  test/index.html. (See [test/README.md](test/README.md)).

The pattern I'm using for each module is:

```
(function() {
  'use strict';
  TreeChart.ModuleName = '...';
})();
```




----



Then bring up index.html in your browser to see the demo (currently broken).


## To do

* Integrate this [pan-zoom library](https://github.com/ariutta/svg-pan-zoom)


## ES6 tricks

* Use `Array.from()` to convert DOM Node lists into arrays.

* Note also that they are iterable:

    ```
     for (let node of document.querySelectorAll('···')) {
        ···
    }
    ```
    