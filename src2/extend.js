// extend
// FIXME: this will be replace by config-one. This is like jQuery's `extend`,
// merging any number of objects, except that it always returns a new object.

(function() {

  // Merge any number of objects into a new object
  const extend = function(...args) {
    const dest = {};
    args.map(src => extendTwo(dest, src));
    return dest;
  };

  // Merge two objects, the second into the first.
  const extendTwo = function(dest, src) {
    Object.keys(src).forEach(function(k) {
      if (typeof dest[k] === 'undefined') {
        dest[k] = src[k];
        return;
      }
      const t = typeOf(dest[k]);
      if (typeOf(src[k]) !== t) {
        throw Error('invalid `extend`: types don\'t match');
      }
      if (t === 'function' || t === 'array') {
        throw Error('I can only merge objects');
      }
      if (t !== 'object') {
        dest[k] = src[k];  // atomic
        return;
      }
      // recurse
      extendTwo(dest[k], src[k]);
    });
  };

  // A modified `typeof` operation
  const typeOf = function(obj) {
    const t = typeof obj;
    if (t != 'object') return t;
    if (!t) return 'null';
    if (t instanceof Array) return 'array';
    return 'object';
  };

  // Make it a global in the browser
  if (typeof window !== 'undefined') window.extend = extend;
})();
