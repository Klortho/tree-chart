# tree-chart

This is intended to be a very easy-to-use version of d3-flextree, as well as
a demonstration of some of the features of 
[config-one](https://github.com/klortho/config-one).



## Develop

```
npm install
```

Then bring up index.html in your browser to see the demo.


To test (currently not passing):

```
npm test
```


See also [implementation.md](implementation.md) for some notes.


# To do

* Eliminate redundancy between demo*.js.
* More stuff into settings -- parameterize all the things!
* New tree type for modeling JS objects.

## Nice-to-have:

* Add other renderers; for example, a simple HTML/CSS renderer that uses boxes
  and absolute positions. (Straight-line diagonals could even be drawn with
  one border of a div that's rotated).


