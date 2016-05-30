// In order to be iterable, an object must have a property with a 
// `Symbol.iterator` key

const genIterFunc = function(generator) {

  let mi = (function() {
    let iter = null; // the iterator to use when called as a function
    return function() {
      if (iter == null) iter = mi[Symbol.iterator]();
      next = iter.next().value;
      console.log('gen new value: ' + next);
      return next;
    };
  })();

  mi[Symbol.iterator] = generator;

  return mi;
};

const generator = function* () {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
      yield 5;
      
  };


const mi = genIterFunc(generator);

console.log('first value: ' + mi());
console.log('second value: ' + mi());
console.log('third value: ' + mi());
console.log('fourth value: ' + mi());
console.log('fifth value: ' + mi());

 // console.log('next: ' + mi[Symbol.iterator]().next().value);

 // console.log('calling the function: ', mi());

  console.log([...mi]);


