//----------------------------------------------------------------
// header.js - this has to come first in the test bundle
// Remove the "node nature" of this running environment. This necessary
// so that libraries, like chai for example, export their stuff to globals.

exports = undefined;
module = undefined;
if (typeof window === 'undefined' && typeof global !== 'undefined')
  window = global;
__node = (typeof require === 'function');
