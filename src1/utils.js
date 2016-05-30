// Utility functions

// NOT USED!
// FOR NOW, IT SEEMS SUPPORT FOR GENERATORS IS POOR.

// So, I'm going to shelve these implementations for now, and write
// some quick-and-dirty functions that provide the same basic functionality,
// if the need arises.

/*
Utils = (function() {
  'use strict';

  const Utils = class {

    // Generator that returns an iterator for a range of numbers. With no
    // arguments, generates an infinite sequence (this is used for the id
    // generator, below)
    // Usage:
    //   const nums = Utils.range(10);
    //   const zeroToNine = [...nums];   //=> [0, 1, 2, ..., 9]

    static get range() {
      function* _range(end = null, begin = 0, step = 1) {
        for (let i = begin; end == null || i < end; i += step) {
          yield i;
        }
      }
      return _range;
    }

    // Returns a new ID generator. The ID values start at 1, so that they are
    // all truthy. 
    // The ID generator is both an iterator and a function. As a function, it
    // returns the next value every time it's called.
    // Usage:
    //   const idGen = Utils.idGenerator();
    //   // Use as a function:
    //   const newObject = { id: idGen(), ... };
    //   // As an iterator:
    //   

    static get idGenerator() {
      return function() {
        const gen = Utils.range(null, 1);
        return () => gen.next().value;
      }
    }

    // Create an array that is a range of numbers (note that in most cases,
    // though, what you really want is the iterator)

    // Another way:
    //   > Array.from(new Array(5), (x, i) => i)
    //   [ 0, 1, 2, 3, 4 ]

    static get rangeArray() {
      return function(end, begin = 0, step = 1) {
        return Array.from(Utils.range(end, begin, step));
      };
    }


  };
  
  return Utils;
})();


const nums = Utils.range(10);
console.log([...Utils.range(10)])
