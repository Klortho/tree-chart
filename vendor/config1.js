var config1 =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Since config-one uses itself to manage its own options, there is a
	 * bit of a chicken-egg problem. The `seed.js` module contains all of the
	 * code that doesn't depend on default options (almost all). Both `main.js`,
	 * here and `defaults.js` require `seed.js`.
	 */
	"use strict";
	
	const seed = __webpack_require__(1);
	const defaults = __webpack_require__(9)();
	
	seed.private.defaults = defaults;
	
	const config1 = seed.new(defaults);
	module.exports = config1;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const path = __webpack_require__(2);
	const process = __webpack_require__(3);
	const R = __webpack_require__(4);
	const util = __webpack_require__(5);
	
	const log = __webpack_require__(8)({id: 'root'});
	log.disable();
	
	
	// template - private - This function is copied for new c1 instances. The body
	// of this function implements the main user API.
	const template = function(...args) {
	  const c1 = this.c1,
	        opts = this.options;
	
	  log.enter('seed:template: welcome my son, num args: ' + args.length);
	  var ret;
	
	  // If there's just one argument that is a Function, then this is being used
	  // as a shortcut for `recipe`.
	  if (args.length == 1 &&
	      args[0] instanceof Function && nodeType(args[0]) !== 'recipe') {
	    ret = recipe(args[0]);
	  }
	  else {
	    log.enter('calling read');
	    ret = c1.read.apply(c1, c1.options.sources);
	  }
	
	  log.exit();
	  return ret;
	};
	
	// clone() - private - Create a new c1 object, by making a copy of template
	// with a new binding. This does not set the options.
	const clone = function() {
	  // Bind c1 to a "back" object so it can find itself when invoked.
	  const back = {};
	  const c1 = template.bind(back);
	  back.c1 = c1;
	  
	  // Mix in properties and bind methods
	  R.keys(Config1).map(key => {
	    const v = Config1[key];
	    c1[key] = (v instanceof Function) ? v.bind(c1) : v;
	  });
	  return c1;
	};
	
	// c1.new(opts) - Create a new c1 object from an existing one, overriding options
	const _new = function(opts) {
	  const c1 = this;
	  const next = clone();
	
	  // If no opts were given, use an empty object. This forces the library to
	  // create a new view, which means all recipes (which might depend on env.
	  // variables, for instance) will get re-evaluated.
	  next.options = c1.extend(c1.options, (opts || {}));
	  return next;
	};
	
	// Traverse-type utilities. 
	// FIXME: I want to make sure that all of the routines here use the same
	// lower-level functions, so that they all agree on exactly how they deal
	// with various properties and attributes.
	
	// visit every node in a config object (without evaluating recipes) or
	// a view, running pre- and post-traversal functions on each.
	const walk = R.curry((pre, post, tree) => {
	  pre(tree);
	  Object.keys(tree).map(walk(pre, post));
	  post(tree);
	});
	
	// Quick and dirty deep equals.
	
	// compare types, considering view and object to be the same
	const cmpType = function(item) {
	  const t = nodeType(item);
	  return t == 'view' ? 'object' : t;
	};
	
	const deepEqual = (actual, expected) => {
	  const ta = cmpType(actual),
	        tb = cmpType(expected);
	  if (ta !== tb) return false;
	  if (ta === 'recipe') return actual === expected;
	  if (ta === 'atom') {
	    return (actual == expected);
	  }
	
	  const aKeys = Object.keys(actual);
	  const eKeys = Object.keys(expected);
	  if (aKeys.length != eKeys.length) return false;
	  aKeys.map(function(k) {
	    if (!(k in expected)) return false;
	    if (!deepEqual(actual[k], expected[k])) return false;
	  });
	  return true;
	};
	
	// ✓ has test.
	// Create a new array if it doesn't exist already, and push a value into it.
	const aggregate = function(acc, value) {
	  const _acc = acc || [];
	  _acc.push(value);
	  return _acc;
	};
	
	// ✓ test-low-level
	// For every key in obj, aggregates it with the corresponding value in the
	// accumulator. The accumulator's values are arrays
	const aggObjects = function(acc, obj) {
	  R.keys(obj).map(key => {
	    acc[key] = aggregate(acc[key], obj[key]);
	  });
	  return acc;
	};
	
	// ✓ test-low-level
	// Given a list of objects, return a new object whose keys are the union of
	// all of the keys in the list, and whose values are arrays of all the values
	// that occur for that key. In other words, this turns an array of objects into
	// an object of arrays.
	const aggAllObjects = function(objects) {
	  return R.reduce(
	    function (acc, obj) {
	      return aggObjects(acc, obj);
	    }, {}, objects
	  );
	};
	
	// ✓ test-low-level
	// Creates a mapping of an array of objects. The set of keys is the union of
	// the sets of all of the keys in objects. The values are arrays of the values
	// from the objects that have those keys.
	const _mapping = function(objects) {
	  return aggAllObjects(objects);
	};
	
	// c1.read(...sourceSpecifiers) - Construct a new root view from a list
	// of source specifiers. This is called when the user invokes the main module
	// function with no arguments. In that case, the sourceSpecifiers are generated
	// from the default options.
	// Sources are in the order from defaults to
	// overrides. (That's per the user API. The first thing we do is reverse them;
	// internally they are always in the order of highest-precedence override
	// first.)
	// If none of the sources resolve to any config data objects, this returns null.
	const read = function(...specs) {
	  const c1 = this;
	
	  // Reverse them, to get them into "internal" order
	  const rspecs = R.reverse(specs);
	
	  // Fetch the real sources from the user-supplied source-specifiers.
	  const _sources = rspecs.map(spec => c1.options.fetchSource(spec));
	  const sources = _sources.filter(s => !!s);
	
	  const root = (sources.length == 0) ? null : (()=> {
	    const _root = newView(null, sources, null, 0);
	
	    const data = _root.__config1__;
	    data.root = _root;
	    data.c1 = c1;
	    return _root;    
	  })();
	
	  return root;
	};
	
	// c1.extend(...configs) - the arguments are config objects, that are merged
	// together in order from defaults to higher-precedence overrides.
	const extend = function(...configs) {
	  const c1 = this;
	
	  // Reverse them, to get them into "internal" order
	  const rconfigs = R.reverse(configs);
	
	  // If an item is a view, replace it with its original sources
	  const getSources = item =>
	    (nodeType(item) === 'view') ? item.__config1__.sources : item;
	
	  // If any are views, replace them with their original sources
	  const sourceGroups = R.map(getSources, rconfigs);
	
	  // Flatten into a single array
	  const sources = R.flatten(sourceGroups);
	
	  // Wrap them in a view
	  const root = newView(null, sources, null, 0),
	        data = root.__config1__;
	  data.root = root;
	  data.c1 = c1;
	  return root;
	};
	
	// If srcnode is of `recipe` type, evaluate it recursively, until you get
	// something that's not.
	const cook = function(root, srcnode) {
	  const t = nodeType(srcnode);
	  const cooked = (t === 'recipe') ?
	    // use `.call(root, root)` so `root` is bound to `this` inside the recipe
	    cook(root, srcnode.eval.call(root, root)) : srcnode;
	  return cooked;
	};
	
	// Cook all the recipes inside a set of sources
	const cookAll = function(root, sources) {
	  const cooked = sources.map(srcnode => cook(root, srcnode))
	  return cooked;
	};
	
	// newView - the heart of the algorithm for managing the view.
	// Sources are in "internal" order: highest precedence first. The source nodes
	// can be of any type: atom, object, recipe, or vnode.
	const newView = function(root, sources, key, depth) {
	  // Cook the recipes, for all of the top-level nodes of each of the sources
	  // in the list
	  // FIXME: for now, recipes cannot be at the root. I'd like to make that an
	  // option. If so, the context will be the c1 object itself.
	  const cooked = root ? cookAll(root, sources) : sources;
	
	  // FIXME: Make an option for the user to pass in a validator that gets applied
	  // here. One "canned" validator might be one that 
	  // made sure that an item is not getting overridden by 
	  // something of a different type
	  const item = cooked[0];
	  const t = nodeType(item);
	
	  // The node must be either an atom, view, or object. If it's an atom or view,
	  // we'll just return it as-is. Otherwise ...
	  const vnode = (
	    t !== 'object' ? item :
	      item instanceof Array ? [] : {}
	  );
	
	  if (t === 'object') {
	    // Determine the real root
	    const _root = root ? root : vnode;
	
	    // Make the mapping for all of the keys to the lists of sources for that key.
	    const mapping = _mapping(cooked);
	
	    // Add a non-enumerable property __config1__ to the view, to store various
	    // data, and keep it from colliding with the source's property names.
	    // FIXME: use an ES6 Symbol for this -- are there good polyfills?
	    const data = {
	      root: _root,
	      key: key,
	      depth: depth,
	      mapping: mapping,
	      sources: sources,
	    };
	    Object.defineProperty(vnode, '__config1__', {
	      __proto__: null,
	      value: data,
	    });
	
	    // Make the getters.
	    // Contract: a getter always returns an atom or a view (never
	    // a source object or a recipe).
	    const memos = {};  // memoize results
	    R.keys(mapping).map(function (childKey) {
	      Object.defineProperty(vnode, childKey, {
	        __proto__: null,
	        enumerable: true,
	        configurable: false,
	        get: function () {
	          if (!(childKey in memos)) {
	            memos[childKey] =
	              newView(_root, mapping[childKey], childKey, depth + 1);
	          }
	          return memos[childKey];
	        }
	      });
	    });
	  }
	  return vnode;
	};
	
	// nodeType - determine the type of a node; one of: atom,
	// object, recipe, or view.
	const nodeType = function(node) {
	  if (!node || typeof node !== 'object') return 'atom';
	  if (typeof node === 'object' && '__config1__' in node) return 'view';
	  if (node instanceof Date) return 'atom';
	  // The test for Recipe addresses the concern in this PR (but it's not
	  // a complete fix): https://github.com/lorenwest/node-config/pull/205.
	  // FIXME: I think using an ES6 Symbol would work here.
	  if (node instanceof Recipe ||
	    (('constructor' in node) && (node.constructor.name === 'Recipe')))
	    return 'recipe';
	  return 'object';
	};
	
	// Recipe class
	var Recipe = function(func) {
	  this.eval = func;
	};
	
	// recipe(func) function - part of the API.
	// This is a Recipe factory, it is exposed for use in the source data tree to
	// wrap functions, turning them into recipes.
	var recipe = function(func) {
	  recipeCount++;
	  return new Recipe(func);
	};
	
	// Keep a count of the total number of recipes created
	// FIXME: put back in the feature that checks for this, and if it's zero,
	// doesn't walk the tree.
	var recipeCount = 0;
	
	
	// Utilities
	//----------
	
	// freeze
	
	// FIXME: this is not thoroughly tested yet.
	var freeze = function(cfg) {
	  return (function _freeze(cfg, key) {
	    var t = nodeType(cfg);
	    const keystr = (key ? `${key}: ` : '');
	    var ret = cfg;
	
	    if (t === 'atom') {
	    }
	
	    else if (t === 'view') {
	      // FIXME: need to clone a function maybe
	      ret = (cfg instanceof Array) ? [] : {};
	      Object.keys(cfg).forEach(function(k) {
	        ret[k] = _freeze(cfg[k], k);
	      });
	    }
	
	    // should be none of these:
	    else if (t === 'object' || t == 'recipe') {
	      console.error('Very strange indeed!');
	    }
	
	    return ret;
	  })(cfg);
	};
	
	// Pretty-printer
	
	// config object -> string
	const ppString = obj => 
	  util.inspect(obj, {showHidden: true, depth: null});  
	
	// config object -> print to stdout
	const ppConsole = cfg => {
	  console.log(ppString(freeze(cfg)));
	};
	
	
	// Prepare exports
	
	// Expose the private functions in a `private` property, for unit tests
	const _private = {
	  aggAllObjects: aggAllObjects,
	  aggObjects: aggObjects,
	  aggregate: aggregate,
	  clone: clone,
	  mapping: _mapping,
	  Recipe: Recipe,
	  recipeCount: recipeCount,
	  template: template,
	  nodeType: nodeType,
	};
	
	const Config1 = {
	  extend: extend,
	  new: _new,
	  read: read,
	  private: _private,
	  recipe: recipe,
	  freeze: freeze,
	  ppString: ppString,
	  ppConsole: ppConsole,
	  walk: walk,
	  deepEqual: deepEqual,
	};
	
	// C1.seed - The original C1 object, from which all others derive. This is the
	// the export of this module. This has to come last, after Config1 has been
	// initialized.
	const seed = clone();
	seed.options = {};
	_private.seed = seed;
	
	module.exports = seed;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }
	
	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }
	
	  return parts;
	}
	
	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};
	
	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;
	
	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();
	
	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }
	
	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }
	
	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)
	
	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');
	
	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};
	
	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';
	
	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');
	
	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }
	
	  return (isAbsolute ? '/' : '') + path;
	};
	
	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};
	
	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};
	
	
	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);
	
	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }
	
	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }
	
	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }
	
	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));
	
	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }
	
	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }
	
	  outputParts = outputParts.concat(toParts.slice(samePartsLength));
	
	  return outputParts.join('/');
	};
	
	exports.sep = '/';
	exports.delimiter = ':';
	
	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];
	
	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }
	
	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }
	
	  return root + dir;
	};
	
	
	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};
	
	
	exports.extname = function(path) {
	  return splitPath(path)[3];
	};
	
	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}
	
	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ },
/* 3 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	//  Ramda v0.21.0
	//  https://github.com/ramda/ramda
	//  (c) 2013-2016 Scott Sauyet, Michael Hurley, and David Chambers
	//  Ramda may be freely distributed under the MIT license.
	
	;(function() {
	
	  'use strict';
	
	  /**
	     * A special placeholder value used to specify "gaps" within curried functions,
	     * allowing partial application of any combination of arguments, regardless of
	     * their positions.
	     *
	     * If `g` is a curried ternary function and `_` is `R.__`, the following are
	     * equivalent:
	     *
	     *   - `g(1, 2, 3)`
	     *   - `g(_, 2, 3)(1)`
	     *   - `g(_, _, 3)(1)(2)`
	     *   - `g(_, _, 3)(1, 2)`
	     *   - `g(_, 2, _)(1, 3)`
	     *   - `g(_, 2)(1)(3)`
	     *   - `g(_, 2)(1, 3)`
	     *   - `g(_, 2)(_, 3)(1)`
	     *
	     * @constant
	     * @memberOf R
	     * @since v0.6.0
	     * @category Function
	     * @example
	     *
	     *      var greet = R.replace('{name}', R.__, 'Hello, {name}!');
	     *      greet('Alice'); //=> 'Hello, Alice!'
	     */
	    var __ = { '@@functional/placeholder': true };
	
	    /* eslint-disable no-unused-vars */
	    var _arity = function _arity(n, fn) {
	        /* eslint-disable no-unused-vars */
	        switch (n) {
	        case 0:
	            return function () {
	                return fn.apply(this, arguments);
	            };
	        case 1:
	            return function (a0) {
	                return fn.apply(this, arguments);
	            };
	        case 2:
	            return function (a0, a1) {
	                return fn.apply(this, arguments);
	            };
	        case 3:
	            return function (a0, a1, a2) {
	                return fn.apply(this, arguments);
	            };
	        case 4:
	            return function (a0, a1, a2, a3) {
	                return fn.apply(this, arguments);
	            };
	        case 5:
	            return function (a0, a1, a2, a3, a4) {
	                return fn.apply(this, arguments);
	            };
	        case 6:
	            return function (a0, a1, a2, a3, a4, a5) {
	                return fn.apply(this, arguments);
	            };
	        case 7:
	            return function (a0, a1, a2, a3, a4, a5, a6) {
	                return fn.apply(this, arguments);
	            };
	        case 8:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7) {
	                return fn.apply(this, arguments);
	            };
	        case 9:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
	                return fn.apply(this, arguments);
	            };
	        case 10:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
	                return fn.apply(this, arguments);
	            };
	        default:
	            throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
	        }
	    };
	
	    var _arrayFromIterator = function _arrayFromIterator(iter) {
	        var list = [];
	        var next;
	        while (!(next = iter.next()).done) {
	            list.push(next.value);
	        }
	        return list;
	    };
	
	    var _arrayOf = function _arrayOf() {
	        return Array.prototype.slice.call(arguments);
	    };
	
	    var _cloneRegExp = function _cloneRegExp(pattern) {
	        return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
	    };
	
	    var _complement = function _complement(f) {
	        return function () {
	            return !f.apply(this, arguments);
	        };
	    };
	
	    /**
	     * Private `concat` function to merge two array-like objects.
	     *
	     * @private
	     * @param {Array|Arguments} [set1=[]] An array-like object.
	     * @param {Array|Arguments} [set2=[]] An array-like object.
	     * @return {Array} A new, merged array.
	     * @example
	     *
	     *      _concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	     */
	    var _concat = function _concat(set1, set2) {
	        set1 = set1 || [];
	        set2 = set2 || [];
	        var idx;
	        var len1 = set1.length;
	        var len2 = set2.length;
	        var result = [];
	        idx = 0;
	        while (idx < len1) {
	            result[result.length] = set1[idx];
	            idx += 1;
	        }
	        idx = 0;
	        while (idx < len2) {
	            result[result.length] = set2[idx];
	            idx += 1;
	        }
	        return result;
	    };
	
	    var _containsWith = function _containsWith(pred, x, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            if (pred(x, list[idx])) {
	                return true;
	            }
	            idx += 1;
	        }
	        return false;
	    };
	
	    var _filter = function _filter(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [];
	        while (idx < len) {
	            if (fn(list[idx])) {
	                result[result.length] = list[idx];
	            }
	            idx += 1;
	        }
	        return result;
	    };
	
	    var _forceReduced = function _forceReduced(x) {
	        return {
	            '@@transducer/value': x,
	            '@@transducer/reduced': true
	        };
	    };
	
	    // String(x => x) evaluates to "x => x", so the pattern may not match.
	    var _functionName = function _functionName(f) {
	        // String(x => x) evaluates to "x => x", so the pattern may not match.
	        var match = String(f).match(/^function (\w*)/);
	        return match == null ? '' : match[1];
	    };
	
	    var _has = function _has(prop, obj) {
	        return Object.prototype.hasOwnProperty.call(obj, prop);
	    };
	
	    var _identity = function _identity(x) {
	        return x;
	    };
	
	    var _isArguments = function () {
	        var toString = Object.prototype.toString;
	        return toString.call(arguments) === '[object Arguments]' ? function _isArguments(x) {
	            return toString.call(x) === '[object Arguments]';
	        } : function _isArguments(x) {
	            return _has('callee', x);
	        };
	    }();
	
	    /**
	     * Tests whether or not an object is an array.
	     *
	     * @private
	     * @param {*} val The object to test.
	     * @return {Boolean} `true` if `val` is an array, `false` otherwise.
	     * @example
	     *
	     *      _isArray([]); //=> true
	     *      _isArray(null); //=> false
	     *      _isArray({}); //=> false
	     */
	    var _isArray = Array.isArray || function _isArray(val) {
	        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
	    };
	
	    var _isFunction = function _isNumber(x) {
	        return Object.prototype.toString.call(x) === '[object Function]';
	    };
	
	    /**
	     * Determine if the passed argument is an integer.
	     *
	     * @private
	     * @param {*} n
	     * @category Type
	     * @return {Boolean}
	     */
	    var _isInteger = Number.isInteger || function _isInteger(n) {
	        return n << 0 === n;
	    };
	
	    var _isNumber = function _isNumber(x) {
	        return Object.prototype.toString.call(x) === '[object Number]';
	    };
	
	    var _isObject = function _isObject(x) {
	        return Object.prototype.toString.call(x) === '[object Object]';
	    };
	
	    var _isPlaceholder = function _isPlaceholder(a) {
	        return a != null && typeof a === 'object' && a['@@functional/placeholder'] === true;
	    };
	
	    var _isRegExp = function _isRegExp(x) {
	        return Object.prototype.toString.call(x) === '[object RegExp]';
	    };
	
	    var _isString = function _isString(x) {
	        return Object.prototype.toString.call(x) === '[object String]';
	    };
	
	    var _isTransformer = function _isTransformer(obj) {
	        return typeof obj['@@transducer/step'] === 'function';
	    };
	
	    var _map = function _map(fn, functor) {
	        var idx = 0;
	        var len = functor.length;
	        var result = Array(len);
	        while (idx < len) {
	            result[idx] = fn(functor[idx]);
	            idx += 1;
	        }
	        return result;
	    };
	
	    // Based on https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	    var _objectAssign = function _objectAssign(target) {
	        if (target == null) {
	            throw new TypeError('Cannot convert undefined or null to object');
	        }
	        var output = Object(target);
	        var idx = 1;
	        var length = arguments.length;
	        while (idx < length) {
	            var source = arguments[idx];
	            if (source != null) {
	                for (var nextKey in source) {
	                    if (_has(nextKey, source)) {
	                        output[nextKey] = source[nextKey];
	                    }
	                }
	            }
	            idx += 1;
	        }
	        return output;
	    };
	
	    var _of = function _of(x) {
	        return [x];
	    };
	
	    var _pipe = function _pipe(f, g) {
	        return function () {
	            return g.call(this, f.apply(this, arguments));
	        };
	    };
	
	    var _pipeP = function _pipeP(f, g) {
	        return function () {
	            var ctx = this;
	            return f.apply(ctx, arguments).then(function (x) {
	                return g.call(ctx, x);
	            });
	        };
	    };
	
	    // \b matches word boundary; [\b] matches backspace
	    var _quote = function _quote(s) {
	        var escaped = s.replace(/\\/g, '\\\\').replace(/[\b]/g, '\\b')    // \b matches word boundary; [\b] matches backspace
	    .replace(/\f/g, '\\f').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\v/g, '\\v').replace(/\0/g, '\\0');
	        return '"' + escaped.replace(/"/g, '\\"') + '"';
	    };
	
	    var _reduced = function _reduced(x) {
	        return x && x['@@transducer/reduced'] ? x : {
	            '@@transducer/value': x,
	            '@@transducer/reduced': true
	        };
	    };
	
	    /**
	     * An optimized, private array `slice` implementation.
	     *
	     * @private
	     * @param {Arguments|Array} args The array or arguments object to consider.
	     * @param {Number} [from=0] The array index to slice from, inclusive.
	     * @param {Number} [to=args.length] The array index to slice to, exclusive.
	     * @return {Array} A new, sliced array.
	     * @example
	     *
	     *      _slice([1, 2, 3, 4, 5], 1, 3); //=> [2, 3]
	     *
	     *      var firstThreeArgs = function(a, b, c, d) {
	     *        return _slice(arguments, 0, 3);
	     *      };
	     *      firstThreeArgs(1, 2, 3, 4); //=> [1, 2, 3]
	     */
	    var _slice = function _slice(args, from, to) {
	        switch (arguments.length) {
	        case 1:
	            return _slice(args, 0, args.length);
	        case 2:
	            return _slice(args, from, args.length);
	        default:
	            var list = [];
	            var idx = 0;
	            var len = Math.max(0, Math.min(args.length, to) - from);
	            while (idx < len) {
	                list[idx] = args[from + idx];
	                idx += 1;
	            }
	            return list;
	        }
	    };
	
	    /**
	     * Polyfill from <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString>.
	     */
	    var _toISOString = function () {
	        var pad = function pad(n) {
	            return (n < 10 ? '0' : '') + n;
	        };
	        return typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
	            return d.toISOString();
	        } : function _toISOString(d) {
	            return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
	        };
	    }();
	
	    var _xfBase = {
	        init: function () {
	            return this.xf['@@transducer/init']();
	        },
	        result: function (result) {
	            return this.xf['@@transducer/result'](result);
	        }
	    };
	
	    var _xwrap = function () {
	        function XWrap(fn) {
	            this.f = fn;
	        }
	        XWrap.prototype['@@transducer/init'] = function () {
	            throw new Error('init not implemented on XWrap');
	        };
	        XWrap.prototype['@@transducer/result'] = function (acc) {
	            return acc;
	        };
	        XWrap.prototype['@@transducer/step'] = function (acc, x) {
	            return this.f(acc, x);
	        };
	        return function _xwrap(fn) {
	            return new XWrap(fn);
	        };
	    }();
	
	    var _aperture = function _aperture(n, list) {
	        var idx = 0;
	        var limit = list.length - (n - 1);
	        var acc = new Array(limit >= 0 ? limit : 0);
	        while (idx < limit) {
	            acc[idx] = _slice(list, idx, idx + n);
	            idx += 1;
	        }
	        return acc;
	    };
	
	    var _assign = typeof Object.assign === 'function' ? Object.assign : _objectAssign;
	
	    /**
	     * Similar to hasMethod, this checks whether a function has a [methodname]
	     * function. If it isn't an array it will execute that function otherwise it
	     * will default to the ramda implementation.
	     *
	     * @private
	     * @param {Function} fn ramda implemtation
	     * @param {String} methodname property to check for a custom implementation
	     * @return {Object} Whatever the return value of the method is.
	     */
	    var _checkForMethod = function _checkForMethod(methodname, fn) {
	        return function () {
	            var length = arguments.length;
	            if (length === 0) {
	                return fn();
	            }
	            var obj = arguments[length - 1];
	            return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
	        };
	    };
	
	    /**
	     * Optimized internal one-arity curry function.
	     *
	     * @private
	     * @category Function
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curry1 = function _curry1(fn) {
	        return function f1(a) {
	            if (arguments.length === 0 || _isPlaceholder(a)) {
	                return f1;
	            } else {
	                return fn.apply(this, arguments);
	            }
	        };
	    };
	
	    /**
	     * Optimized internal two-arity curry function.
	     *
	     * @private
	     * @category Function
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curry2 = function _curry2(fn) {
	        return function f2(a, b) {
	            switch (arguments.length) {
	            case 0:
	                return f2;
	            case 1:
	                return _isPlaceholder(a) ? f2 : _curry1(function (_b) {
	                    return fn(a, _b);
	                });
	            default:
	                return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function (_a) {
	                    return fn(_a, b);
	                }) : _isPlaceholder(b) ? _curry1(function (_b) {
	                    return fn(a, _b);
	                }) : fn(a, b);
	            }
	        };
	    };
	
	    /**
	     * Optimized internal three-arity curry function.
	     *
	     * @private
	     * @category Function
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curry3 = function _curry3(fn) {
	        return function f3(a, b, c) {
	            switch (arguments.length) {
	            case 0:
	                return f3;
	            case 1:
	                return _isPlaceholder(a) ? f3 : _curry2(function (_b, _c) {
	                    return fn(a, _b, _c);
	                });
	            case 2:
	                return _isPlaceholder(a) && _isPlaceholder(b) ? f3 : _isPlaceholder(a) ? _curry2(function (_a, _c) {
	                    return fn(_a, b, _c);
	                }) : _isPlaceholder(b) ? _curry2(function (_b, _c) {
	                    return fn(a, _b, _c);
	                }) : _curry1(function (_c) {
	                    return fn(a, b, _c);
	                });
	            default:
	                return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c) ? f3 : _isPlaceholder(a) && _isPlaceholder(b) ? _curry2(function (_a, _b) {
	                    return fn(_a, _b, c);
	                }) : _isPlaceholder(a) && _isPlaceholder(c) ? _curry2(function (_a, _c) {
	                    return fn(_a, b, _c);
	                }) : _isPlaceholder(b) && _isPlaceholder(c) ? _curry2(function (_b, _c) {
	                    return fn(a, _b, _c);
	                }) : _isPlaceholder(a) ? _curry1(function (_a) {
	                    return fn(_a, b, c);
	                }) : _isPlaceholder(b) ? _curry1(function (_b) {
	                    return fn(a, _b, c);
	                }) : _isPlaceholder(c) ? _curry1(function (_c) {
	                    return fn(a, b, _c);
	                }) : fn(a, b, c);
	            }
	        };
	    };
	
	    /**
	     * Internal curryN function.
	     *
	     * @private
	     * @category Function
	     * @param {Number} length The arity of the curried function.
	     * @param {Array} received An array of arguments received thus far.
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curryN = function _curryN(length, received, fn) {
	        return function () {
	            var combined = [];
	            var argsIdx = 0;
	            var left = length;
	            var combinedIdx = 0;
	            while (combinedIdx < received.length || argsIdx < arguments.length) {
	                var result;
	                if (combinedIdx < received.length && (!_isPlaceholder(received[combinedIdx]) || argsIdx >= arguments.length)) {
	                    result = received[combinedIdx];
	                } else {
	                    result = arguments[argsIdx];
	                    argsIdx += 1;
	                }
	                combined[combinedIdx] = result;
	                if (!_isPlaceholder(result)) {
	                    left -= 1;
	                }
	                combinedIdx += 1;
	            }
	            return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
	        };
	    };
	
	    /**
	     * Returns a function that dispatches with different strategies based on the
	     * object in list position (last argument). If it is an array, executes [fn].
	     * Otherwise, if it has a function with [methodname], it will execute that
	     * function (functor case). Otherwise, if it is a transformer, uses transducer
	     * [xf] to return a new transformer (transducer case). Otherwise, it will
	     * default to executing [fn].
	     *
	     * @private
	     * @param {String} methodname property to check for a custom implementation
	     * @param {Function} xf transducer to initialize if object is transformer
	     * @param {Function} fn default ramda implementation
	     * @return {Function} A function that dispatches on object in list position
	     */
	    var _dispatchable = function _dispatchable(methodname, xf, fn) {
	        return function () {
	            var length = arguments.length;
	            if (length === 0) {
	                return fn();
	            }
	            var obj = arguments[length - 1];
	            if (!_isArray(obj)) {
	                var args = _slice(arguments, 0, length - 1);
	                if (typeof obj[methodname] === 'function') {
	                    return obj[methodname].apply(obj, args);
	                }
	                if (_isTransformer(obj)) {
	                    var transducer = xf.apply(null, args);
	                    return transducer(obj);
	                }
	            }
	            return fn.apply(this, arguments);
	        };
	    };
	
	    var _dropLastWhile = function dropLastWhile(pred, list) {
	        var idx = list.length - 1;
	        while (idx >= 0 && pred(list[idx])) {
	            idx -= 1;
	        }
	        return _slice(list, 0, idx + 1);
	    };
	
	    var _xall = function () {
	        function XAll(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.all = true;
	        }
	        XAll.prototype['@@transducer/init'] = _xfBase.init;
	        XAll.prototype['@@transducer/result'] = function (result) {
	            if (this.all) {
	                result = this.xf['@@transducer/step'](result, true);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XAll.prototype['@@transducer/step'] = function (result, input) {
	            if (!this.f(input)) {
	                this.all = false;
	                result = _reduced(this.xf['@@transducer/step'](result, false));
	            }
	            return result;
	        };
	        return _curry2(function _xall(f, xf) {
	            return new XAll(f, xf);
	        });
	    }();
	
	    var _xany = function () {
	        function XAny(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.any = false;
	        }
	        XAny.prototype['@@transducer/init'] = _xfBase.init;
	        XAny.prototype['@@transducer/result'] = function (result) {
	            if (!this.any) {
	                result = this.xf['@@transducer/step'](result, false);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XAny.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f(input)) {
	                this.any = true;
	                result = _reduced(this.xf['@@transducer/step'](result, true));
	            }
	            return result;
	        };
	        return _curry2(function _xany(f, xf) {
	            return new XAny(f, xf);
	        });
	    }();
	
	    var _xaperture = function () {
	        function XAperture(n, xf) {
	            this.xf = xf;
	            this.pos = 0;
	            this.full = false;
	            this.acc = new Array(n);
	        }
	        XAperture.prototype['@@transducer/init'] = _xfBase.init;
	        XAperture.prototype['@@transducer/result'] = function (result) {
	            this.acc = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XAperture.prototype['@@transducer/step'] = function (result, input) {
	            this.store(input);
	            return this.full ? this.xf['@@transducer/step'](result, this.getCopy()) : result;
	        };
	        XAperture.prototype.store = function (input) {
	            this.acc[this.pos] = input;
	            this.pos += 1;
	            if (this.pos === this.acc.length) {
	                this.pos = 0;
	                this.full = true;
	            }
	        };
	        XAperture.prototype.getCopy = function () {
	            return _concat(_slice(this.acc, this.pos), _slice(this.acc, 0, this.pos));
	        };
	        return _curry2(function _xaperture(n, xf) {
	            return new XAperture(n, xf);
	        });
	    }();
	
	    var _xdrop = function () {
	        function XDrop(n, xf) {
	            this.xf = xf;
	            this.n = n;
	        }
	        XDrop.prototype['@@transducer/init'] = _xfBase.init;
	        XDrop.prototype['@@transducer/result'] = _xfBase.result;
	        XDrop.prototype['@@transducer/step'] = function (result, input) {
	            if (this.n > 0) {
	                this.n -= 1;
	                return result;
	            }
	            return this.xf['@@transducer/step'](result, input);
	        };
	        return _curry2(function _xdrop(n, xf) {
	            return new XDrop(n, xf);
	        });
	    }();
	
	    var _xdropLast = function () {
	        function XDropLast(n, xf) {
	            this.xf = xf;
	            this.pos = 0;
	            this.full = false;
	            this.acc = new Array(n);
	        }
	        XDropLast.prototype['@@transducer/init'] = _xfBase.init;
	        XDropLast.prototype['@@transducer/result'] = function (result) {
	            this.acc = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XDropLast.prototype['@@transducer/step'] = function (result, input) {
	            if (this.full) {
	                result = this.xf['@@transducer/step'](result, this.acc[this.pos]);
	            }
	            this.store(input);
	            return result;
	        };
	        XDropLast.prototype.store = function (input) {
	            this.acc[this.pos] = input;
	            this.pos += 1;
	            if (this.pos === this.acc.length) {
	                this.pos = 0;
	                this.full = true;
	            }
	        };
	        return _curry2(function _xdropLast(n, xf) {
	            return new XDropLast(n, xf);
	        });
	    }();
	
	    var _xdropRepeatsWith = function () {
	        function XDropRepeatsWith(pred, xf) {
	            this.xf = xf;
	            this.pred = pred;
	            this.lastValue = undefined;
	            this.seenFirstValue = false;
	        }
	        XDropRepeatsWith.prototype['@@transducer/init'] = function () {
	            return this.xf['@@transducer/init']();
	        };
	        XDropRepeatsWith.prototype['@@transducer/result'] = function (result) {
	            return this.xf['@@transducer/result'](result);
	        };
	        XDropRepeatsWith.prototype['@@transducer/step'] = function (result, input) {
	            var sameAsLast = false;
	            if (!this.seenFirstValue) {
	                this.seenFirstValue = true;
	            } else if (this.pred(this.lastValue, input)) {
	                sameAsLast = true;
	            }
	            this.lastValue = input;
	            return sameAsLast ? result : this.xf['@@transducer/step'](result, input);
	        };
	        return _curry2(function _xdropRepeatsWith(pred, xf) {
	            return new XDropRepeatsWith(pred, xf);
	        });
	    }();
	
	    var _xdropWhile = function () {
	        function XDropWhile(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XDropWhile.prototype['@@transducer/init'] = _xfBase.init;
	        XDropWhile.prototype['@@transducer/result'] = _xfBase.result;
	        XDropWhile.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f) {
	                if (this.f(input)) {
	                    return result;
	                }
	                this.f = null;
	            }
	            return this.xf['@@transducer/step'](result, input);
	        };
	        return _curry2(function _xdropWhile(f, xf) {
	            return new XDropWhile(f, xf);
	        });
	    }();
	
	    var _xfilter = function () {
	        function XFilter(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XFilter.prototype['@@transducer/init'] = _xfBase.init;
	        XFilter.prototype['@@transducer/result'] = _xfBase.result;
	        XFilter.prototype['@@transducer/step'] = function (result, input) {
	            return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
	        };
	        return _curry2(function _xfilter(f, xf) {
	            return new XFilter(f, xf);
	        });
	    }();
	
	    var _xfind = function () {
	        function XFind(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.found = false;
	        }
	        XFind.prototype['@@transducer/init'] = _xfBase.init;
	        XFind.prototype['@@transducer/result'] = function (result) {
	            if (!this.found) {
	                result = this.xf['@@transducer/step'](result, void 0);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XFind.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f(input)) {
	                this.found = true;
	                result = _reduced(this.xf['@@transducer/step'](result, input));
	            }
	            return result;
	        };
	        return _curry2(function _xfind(f, xf) {
	            return new XFind(f, xf);
	        });
	    }();
	
	    var _xfindIndex = function () {
	        function XFindIndex(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.idx = -1;
	            this.found = false;
	        }
	        XFindIndex.prototype['@@transducer/init'] = _xfBase.init;
	        XFindIndex.prototype['@@transducer/result'] = function (result) {
	            if (!this.found) {
	                result = this.xf['@@transducer/step'](result, -1);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XFindIndex.prototype['@@transducer/step'] = function (result, input) {
	            this.idx += 1;
	            if (this.f(input)) {
	                this.found = true;
	                result = _reduced(this.xf['@@transducer/step'](result, this.idx));
	            }
	            return result;
	        };
	        return _curry2(function _xfindIndex(f, xf) {
	            return new XFindIndex(f, xf);
	        });
	    }();
	
	    var _xfindLast = function () {
	        function XFindLast(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XFindLast.prototype['@@transducer/init'] = _xfBase.init;
	        XFindLast.prototype['@@transducer/result'] = function (result) {
	            return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.last));
	        };
	        XFindLast.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f(input)) {
	                this.last = input;
	            }
	            return result;
	        };
	        return _curry2(function _xfindLast(f, xf) {
	            return new XFindLast(f, xf);
	        });
	    }();
	
	    var _xfindLastIndex = function () {
	        function XFindLastIndex(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.idx = -1;
	            this.lastIdx = -1;
	        }
	        XFindLastIndex.prototype['@@transducer/init'] = _xfBase.init;
	        XFindLastIndex.prototype['@@transducer/result'] = function (result) {
	            return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.lastIdx));
	        };
	        XFindLastIndex.prototype['@@transducer/step'] = function (result, input) {
	            this.idx += 1;
	            if (this.f(input)) {
	                this.lastIdx = this.idx;
	            }
	            return result;
	        };
	        return _curry2(function _xfindLastIndex(f, xf) {
	            return new XFindLastIndex(f, xf);
	        });
	    }();
	
	    var _xmap = function () {
	        function XMap(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XMap.prototype['@@transducer/init'] = _xfBase.init;
	        XMap.prototype['@@transducer/result'] = _xfBase.result;
	        XMap.prototype['@@transducer/step'] = function (result, input) {
	            return this.xf['@@transducer/step'](result, this.f(input));
	        };
	        return _curry2(function _xmap(f, xf) {
	            return new XMap(f, xf);
	        });
	    }();
	
	    var _xtake = function () {
	        function XTake(n, xf) {
	            this.xf = xf;
	            this.n = n;
	        }
	        XTake.prototype['@@transducer/init'] = _xfBase.init;
	        XTake.prototype['@@transducer/result'] = _xfBase.result;
	        XTake.prototype['@@transducer/step'] = function (result, input) {
	            if (this.n === 0) {
	                return _reduced(result);
	            } else {
	                this.n -= 1;
	                return this.xf['@@transducer/step'](result, input);
	            }
	        };
	        return _curry2(function _xtake(n, xf) {
	            return new XTake(n, xf);
	        });
	    }();
	
	    var _xtakeWhile = function () {
	        function XTakeWhile(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XTakeWhile.prototype['@@transducer/init'] = _xfBase.init;
	        XTakeWhile.prototype['@@transducer/result'] = _xfBase.result;
	        XTakeWhile.prototype['@@transducer/step'] = function (result, input) {
	            return this.f(input) ? this.xf['@@transducer/step'](result, input) : _reduced(result);
	        };
	        return _curry2(function _xtakeWhile(f, xf) {
	            return new XTakeWhile(f, xf);
	        });
	    }();
	
	    /**
	     * Adds two values.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a
	     * @param {Number} b
	     * @return {Number}
	     * @see R.subtract
	     * @example
	     *
	     *      R.add(2, 3);       //=>  5
	     *      R.add(7)(10);      //=> 17
	     */
	    var add = _curry2(function add(a, b) {
	        return Number(a) + Number(b);
	    });
	
	    /**
	     * Applies a function to the value at the given index of an array, returning a
	     * new copy of the array with the element at the given index replaced with the
	     * result of the function application.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig (a -> a) -> Number -> [a] -> [a]
	     * @param {Function} fn The function to apply.
	     * @param {Number} idx The index.
	     * @param {Array|Arguments} list An array-like object whose value
	     *        at the supplied index will be replaced.
	     * @return {Array} A copy of the supplied array-like object with
	     *         the element at index `idx` replaced with the value
	     *         returned by applying `fn` to the existing element.
	     * @see R.update
	     * @example
	     *
	     *      R.adjust(R.add(10), 1, [0, 1, 2]);     //=> [0, 11, 2]
	     *      R.adjust(R.add(10))(1)([0, 1, 2]);     //=> [0, 11, 2]
	     */
	    var adjust = _curry3(function adjust(fn, idx, list) {
	        if (idx >= list.length || idx < -list.length) {
	            return list;
	        }
	        var start = idx < 0 ? list.length : 0;
	        var _idx = start + idx;
	        var _list = _concat(list);
	        _list[_idx] = fn(list[_idx]);
	        return _list;
	    });
	
	    /**
	     * Returns `true` if all elements of the list match the predicate, `false` if
	     * there are any that don't.
	     *
	     * Dispatches to the `all` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Boolean
	     * @param {Function} fn The predicate function.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the predicate is satisfied by every element, `false`
	     *         otherwise.
	     * @see R.any, R.none, R.transduce
	     * @example
	     *
	     *      var lessThan2 = R.flip(R.lt)(2);
	     *      var lessThan3 = R.flip(R.lt)(3);
	     *      R.all(lessThan2)([1, 2]); //=> false
	     *      R.all(lessThan3)([1, 2]); //=> true
	     */
	    var all = _curry2(_dispatchable('all', _xall, function all(fn, list) {
	        var idx = 0;
	        while (idx < list.length) {
	            if (!fn(list[idx])) {
	                return false;
	            }
	            idx += 1;
	        }
	        return true;
	    }));
	
	    /**
	     * Returns a function that always returns the given value. Note that for
	     * non-primitives the value returned is a reference to the original value.
	     *
	     * This function is known as `const`, `constant`, or `K` (for K combinator) in
	     * other languages and libraries.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig a -> (* -> a)
	     * @param {*} val The value to wrap in a function
	     * @return {Function} A Function :: * -> val.
	     * @example
	     *
	     *      var t = R.always('Tee');
	     *      t(); //=> 'Tee'
	     */
	    var always = _curry1(function always(val) {
	        return function () {
	            return val;
	        };
	    });
	
	    /**
	     * Returns `true` if both arguments are `true`; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig * -> * -> *
	     * @param {Boolean} a A boolean value
	     * @param {Boolean} b A boolean value
	     * @return {Boolean} `true` if both arguments are `true`, `false` otherwise
	     * @see R.both
	     * @example
	     *
	     *      R.and(true, true); //=> true
	     *      R.and(true, false); //=> false
	     *      R.and(false, true); //=> false
	     *      R.and(false, false); //=> false
	     */
	    var and = _curry2(function and(a, b) {
	        return a && b;
	    });
	
	    /**
	     * Returns `true` if at least one of elements of the list match the predicate,
	     * `false` otherwise.
	     *
	     * Dispatches to the `any` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Boolean
	     * @param {Function} fn The predicate function.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the predicate is satisfied by at least one element, `false`
	     *         otherwise.
	     * @see R.all, R.none, R.transduce
	     * @example
	     *
	     *      var lessThan0 = R.flip(R.lt)(0);
	     *      var lessThan2 = R.flip(R.lt)(2);
	     *      R.any(lessThan0)([1, 2]); //=> false
	     *      R.any(lessThan2)([1, 2]); //=> true
	     */
	    var any = _curry2(_dispatchable('any', _xany, function any(fn, list) {
	        var idx = 0;
	        while (idx < list.length) {
	            if (fn(list[idx])) {
	                return true;
	            }
	            idx += 1;
	        }
	        return false;
	    }));
	
	    /**
	     * Returns a new list, composed of n-tuples of consecutive elements If `n` is
	     * greater than the length of the list, an empty list is returned.
	     *
	     * Dispatches to the `aperture` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig Number -> [a] -> [[a]]
	     * @param {Number} n The size of the tuples to create
	     * @param {Array} list The list to split into `n`-tuples
	     * @return {Array} The new list.
	     * @see R.transduce
	     * @example
	     *
	     *      R.aperture(2, [1, 2, 3, 4, 5]); //=> [[1, 2], [2, 3], [3, 4], [4, 5]]
	     *      R.aperture(3, [1, 2, 3, 4, 5]); //=> [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
	     *      R.aperture(7, [1, 2, 3, 4, 5]); //=> []
	     */
	    var aperture = _curry2(_dispatchable('aperture', _xaperture, _aperture));
	
	    /**
	     * Returns a new list containing the contents of the given list, followed by
	     * the given element.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> [a]
	     * @param {*} el The element to add to the end of the new list.
	     * @param {Array} list The list whose contents will be added to the beginning of the output
	     *        list.
	     * @return {Array} A new list containing the contents of the old list followed by `el`.
	     * @see R.prepend
	     * @example
	     *
	     *      R.append('tests', ['write', 'more']); //=> ['write', 'more', 'tests']
	     *      R.append('tests', []); //=> ['tests']
	     *      R.append(['tests'], ['write', 'more']); //=> ['write', 'more', ['tests']]
	     */
	    var append = _curry2(function append(el, list) {
	        return _concat(list, [el]);
	    });
	
	    /**
	     * Applies function `fn` to the argument list `args`. This is useful for
	     * creating a fixed-arity function from a variadic function. `fn` should be a
	     * bound function if context is significant.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Function
	     * @sig (*... -> a) -> [*] -> a
	     * @param {Function} fn
	     * @param {Array} args
	     * @return {*}
	     * @see R.call, R.unapply
	     * @example
	     *
	     *      var nums = [1, 2, 3, -99, 42, 6, 7];
	     *      R.apply(Math.max, nums); //=> 42
	     */
	    var apply = _curry2(function apply(fn, args) {
	        return fn.apply(this, args);
	    });
	
	    /**
	     * Makes a shallow clone of an object, setting or overriding the specified
	     * property with the given value. Note that this copies and flattens prototype
	     * properties onto the new object as well. All non-primitive properties are
	     * copied by reference.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @sig String -> a -> {k: v} -> {k: v}
	     * @param {String} prop the property name to set
	     * @param {*} val the new value
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object similar to the original except for the specified property.
	     * @see R.dissoc
	     * @example
	     *
	     *      R.assoc('c', 3, {a: 1, b: 2}); //=> {a: 1, b: 2, c: 3}
	     */
	    var assoc = _curry3(function assoc(prop, val, obj) {
	        var result = {};
	        for (var p in obj) {
	            result[p] = obj[p];
	        }
	        result[prop] = val;
	        return result;
	    });
	
	    /**
	     * Makes a shallow clone of an object, setting or overriding the nodes required
	     * to create the given path, and placing the specific value at the tail end of
	     * that path. Note that this copies and flattens prototype properties onto the
	     * new object as well. All non-primitive properties are copied by reference.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @sig [String] -> a -> {k: v} -> {k: v}
	     * @param {Array} path the path to set
	     * @param {*} val the new value
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object similar to the original except along the specified path.
	     * @see R.dissocPath
	     * @example
	     *
	     *      R.assocPath(['a', 'b', 'c'], 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
	     */
	    var assocPath = _curry3(function assocPath(path, val, obj) {
	        switch (path.length) {
	        case 0:
	            return val;
	        case 1:
	            return assoc(path[0], val, obj);
	        default:
	            return assoc(path[0], assocPath(_slice(path, 1), val, Object(obj[path[0]])), obj);
	        }
	    });
	
	    /**
	     * Creates a function that is bound to a context.
	     * Note: `R.bind` does not provide the additional argument-binding capabilities of
	     * [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category Function
	     * @category Object
	     * @sig (* -> *) -> {*} -> (* -> *)
	     * @param {Function} fn The function to bind to context
	     * @param {Object} thisObj The context to bind `fn` to
	     * @return {Function} A function that will execute in the context of `thisObj`.
	     * @see R.partial
	     */
	    var bind = _curry2(function bind(fn, thisObj) {
	        return _arity(fn.length, function () {
	            return fn.apply(thisObj, arguments);
	        });
	    });
	
	    /**
	     * Restricts a number to be within a range.
	     *
	     * Also works for other ordered types such as Strings and Dates.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Relation
	     * @sig Ord a => a -> a -> a -> a
	     * @param {Number} minimum number
	     * @param {Number} maximum number
	     * @param {Number} value to be clamped
	     * @return {Number} Returns the clamped value
	     * @example
	     *
	     *      R.clamp(1, 10, -1) // => 1
	     *      R.clamp(1, 10, 11) // => 10
	     *      R.clamp(1, 10, 4)  // => 4
	     */
	    var clamp = _curry3(function clamp(min, max, value) {
	        if (min > max) {
	            throw new Error('min must not be greater than max in clamp(min, max, value)');
	        }
	        return value < min ? min : value > max ? max : value;
	    });
	
	    /**
	     * Makes a comparator function out of a function that reports whether the first
	     * element is less than the second.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a, b -> Boolean) -> (a, b -> Number)
	     * @param {Function} pred A predicate function of arity two.
	     * @return {Function} A Function :: a -> b -> Int that returns `-1` if a < b, `1` if b < a, otherwise `0`.
	     * @example
	     *
	     *      var cmp = R.comparator((a, b) => a.age < b.age);
	     *      var people = [
	     *        // ...
	     *      ];
	     *      R.sort(cmp, people);
	     */
	    var comparator = _curry1(function comparator(pred) {
	        return function (a, b) {
	            return pred(a, b) ? -1 : pred(b, a) ? 1 : 0;
	        };
	    });
	
	    /**
	     * Returns a curried equivalent of the provided function, with the specified
	     * arity. The curried function has two unusual capabilities. First, its
	     * arguments needn't be provided one at a time. If `g` is `R.curryN(3, f)`, the
	     * following are equivalent:
	     *
	     *   - `g(1)(2)(3)`
	     *   - `g(1)(2, 3)`
	     *   - `g(1, 2)(3)`
	     *   - `g(1, 2, 3)`
	     *
	     * Secondly, the special placeholder value `R.__` may be used to specify
	     * "gaps", allowing partial application of any combination of arguments,
	     * regardless of their positions. If `g` is as above and `_` is `R.__`, the
	     * following are equivalent:
	     *
	     *   - `g(1, 2, 3)`
	     *   - `g(_, 2, 3)(1)`
	     *   - `g(_, _, 3)(1)(2)`
	     *   - `g(_, _, 3)(1, 2)`
	     *   - `g(_, 2)(1)(3)`
	     *   - `g(_, 2)(1, 3)`
	     *   - `g(_, 2)(_, 3)(1)`
	     *
	     * @func
	     * @memberOf R
	     * @since v0.5.0
	     * @category Function
	     * @sig Number -> (* -> a) -> (* -> a)
	     * @param {Number} length The arity for the returned function.
	     * @param {Function} fn The function to curry.
	     * @return {Function} A new, curried function.
	     * @see R.curry
	     * @example
	     *
	     *      var sumArgs = (...args) => R.sum(args);
	     *
	     *      var curriedAddFourNumbers = R.curryN(4, sumArgs);
	     *      var f = curriedAddFourNumbers(1, 2);
	     *      var g = f(3);
	     *      g(4); //=> 10
	     */
	    var curryN = _curry2(function curryN(length, fn) {
	        if (length === 1) {
	            return _curry1(fn);
	        }
	        return _arity(length, _curryN(length, [], fn));
	    });
	
	    /**
	     * Decrements its argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Math
	     * @sig Number -> Number
	     * @param {Number} n
	     * @return {Number}
	     * @see R.inc
	     * @example
	     *
	     *      R.dec(42); //=> 41
	     */
	    var dec = add(-1);
	
	    /**
	     * Returns the second argument if it is not `null`, `undefined` or `NaN`
	     * otherwise the first argument is returned.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Logic
	     * @sig a -> b -> a | b
	     * @param {a} val The default value.
	     * @param {b} val The value to return if it is not null or undefined
	     * @return {*} The the second value or the default value
	     * @example
	     *
	     *      var defaultTo42 = R.defaultTo(42);
	     *
	     *      defaultTo42(null);  //=> 42
	     *      defaultTo42(undefined);  //=> 42
	     *      defaultTo42('Ramda');  //=> 'Ramda'
	     *      defaultTo42(parseInt('string')); //=> 42
	     */
	    var defaultTo = _curry2(function defaultTo(d, v) {
	        return v == null || v !== v ? d : v;
	    });
	
	    /**
	     * Finds the set (i.e. no duplicates) of all elements in the first list not
	     * contained in the second list. Duplication is determined according to the
	     * value returned by applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` that are not in `list2`.
	     * @see R.difference
	     * @example
	     *
	     *      var cmp = (x, y) => x.a === y.a;
	     *      var l1 = [{a: 1}, {a: 2}, {a: 3}];
	     *      var l2 = [{a: 3}, {a: 4}];
	     *      R.differenceWith(cmp, l1, l2); //=> [{a: 1}, {a: 2}]
	     */
	    var differenceWith = _curry3(function differenceWith(pred, first, second) {
	        var out = [];
	        var idx = 0;
	        var firstLen = first.length;
	        while (idx < firstLen) {
	            if (!_containsWith(pred, first[idx], second) && !_containsWith(pred, first[idx], out)) {
	                out.push(first[idx]);
	            }
	            idx += 1;
	        }
	        return out;
	    });
	
	    /**
	     * Returns a new object that does not contain a `prop` property.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Object
	     * @sig String -> {k: v} -> {k: v}
	     * @param {String} prop the name of the property to dissociate
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object similar to the original but without the specified property
	     * @see R.assoc
	     * @example
	     *
	     *      R.dissoc('b', {a: 1, b: 2, c: 3}); //=> {a: 1, c: 3}
	     */
	    var dissoc = _curry2(function dissoc(prop, obj) {
	        var result = {};
	        for (var p in obj) {
	            if (p !== prop) {
	                result[p] = obj[p];
	            }
	        }
	        return result;
	    });
	
	    /**
	     * Makes a shallow clone of an object, omitting the property at the given path.
	     * Note that this copies and flattens prototype properties onto the new object
	     * as well. All non-primitive properties are copied by reference.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.11.0
	     * @category Object
	     * @sig [String] -> {k: v} -> {k: v}
	     * @param {Array} path the path to set
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object without the property at path
	     * @see R.assocPath
	     * @example
	     *
	     *      R.dissocPath(['a', 'b', 'c'], {a: {b: {c: 42}}}); //=> {a: {b: {}}}
	     */
	    var dissocPath = _curry2(function dissocPath(path, obj) {
	        switch (path.length) {
	        case 0:
	            return obj;
	        case 1:
	            return dissoc(path[0], obj);
	        default:
	            var head = path[0];
	            var tail = _slice(path, 1);
	            return obj[head] == null ? obj : assoc(head, dissocPath(tail, obj[head]), obj);
	        }
	    });
	
	    /**
	     * Divides two numbers. Equivalent to `a / b`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The first value.
	     * @param {Number} b The second value.
	     * @return {Number} The result of `a / b`.
	     * @see R.multiply
	     * @example
	     *
	     *      R.divide(71, 100); //=> 0.71
	     *
	     *      var half = R.divide(R.__, 2);
	     *      half(42); //=> 21
	     *
	     *      var reciprocal = R.divide(1);
	     *      reciprocal(4);   //=> 0.25
	     */
	    var divide = _curry2(function divide(a, b) {
	        return a / b;
	    });
	
	    /**
	     * Returns a new list containing the last `n` elements of a given list, passing
	     * each value to the supplied predicate function, skipping elements while the
	     * predicate function returns `true`. The predicate function is passed one
	     * argument: *(value)*.
	     *
	     * Dispatches to the `dropWhile` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.takeWhile, R.transduce, R.addIndex
	     * @example
	     *
	     *      var lteTwo = x => x <= 2;
	     *
	     *      R.dropWhile(lteTwo, [1, 2, 3, 4, 3, 2, 1]); //=> [3, 4, 3, 2, 1]
	     */
	    var dropWhile = _curry2(_dispatchable('dropWhile', _xdropWhile, function dropWhile(pred, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len && pred(list[idx])) {
	            idx += 1;
	        }
	        return _slice(list, idx);
	    }));
	
	    /**
	     * Returns the empty value of its argument's type. Ramda defines the empty
	     * value of Array (`[]`), Object (`{}`), String (`''`), and Arguments. Other
	     * types are supported if they define `<Type>.empty` and/or
	     * `<Type>.prototype.empty`.
	     *
	     * Dispatches to the `empty` method of the first argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Function
	     * @sig a -> a
	     * @param {*} x
	     * @return {*}
	     * @example
	     *
	     *      R.empty(Just(42));      //=> Nothing()
	     *      R.empty([1, 2, 3]);     //=> []
	     *      R.empty('unicorns');    //=> ''
	     *      R.empty({x: 1, y: 2});  //=> {}
	     */
	    // else
	    var empty = _curry1(function empty(x) {
	        return x != null && typeof x.empty === 'function' ? x.empty() : x != null && x.constructor != null && typeof x.constructor.empty === 'function' ? x.constructor.empty() : _isArray(x) ? [] : _isString(x) ? '' : _isObject(x) ? {} : _isArguments(x) ? function () {
	            return arguments;
	        }() : // else
	        void 0;
	    });
	
	    /**
	     * Creates a new object by recursively evolving a shallow copy of `object`,
	     * according to the `transformation` functions. All non-primitive properties
	     * are copied by reference.
	     *
	     * A `transformation` function will not be invoked if its corresponding key
	     * does not exist in the evolved object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig {k: (v -> v)} -> {k: v} -> {k: v}
	     * @param {Object} transformations The object specifying transformation functions to apply
	     *        to the object.
	     * @param {Object} object The object to be transformed.
	     * @return {Object} The transformed object.
	     * @example
	     *
	     *      var tomato  = {firstName: '  Tomato ', data: {elapsed: 100, remaining: 1400}, id:123};
	     *      var transformations = {
	     *        firstName: R.trim,
	     *        lastName: R.trim, // Will not get invoked.
	     *        data: {elapsed: R.add(1), remaining: R.add(-1)}
	     *      };
	     *      R.evolve(transformations, tomato); //=> {firstName: 'Tomato', data: {elapsed: 101, remaining: 1399}, id:123}
	     */
	    var evolve = _curry2(function evolve(transformations, object) {
	        var result = {};
	        var transformation, key, type;
	        for (key in object) {
	            transformation = transformations[key];
	            type = typeof transformation;
	            result[key] = type === 'function' ? transformation(object[key]) : type === 'object' ? evolve(transformations[key], object[key]) : object[key];
	        }
	        return result;
	    });
	
	    /**
	     * Returns the first element of the list which matches the predicate, or
	     * `undefined` if no element matches.
	     *
	     * Dispatches to the `find` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> a | undefined
	     * @param {Function} fn The predicate function used to determine if the element is the
	     *        desired one.
	     * @param {Array} list The array to consider.
	     * @return {Object} The element found, or `undefined`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1}, {a: 2}, {a: 3}];
	     *      R.find(R.propEq('a', 2))(xs); //=> {a: 2}
	     *      R.find(R.propEq('a', 4))(xs); //=> undefined
	     */
	    var find = _curry2(_dispatchable('find', _xfind, function find(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            if (fn(list[idx])) {
	                return list[idx];
	            }
	            idx += 1;
	        }
	    }));
	
	    /**
	     * Returns the index of the first element of the list which matches the
	     * predicate, or `-1` if no element matches.
	     *
	     * Dispatches to the `findIndex` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Number
	     * @param {Function} fn The predicate function used to determine if the element is the
	     * desired one.
	     * @param {Array} list The array to consider.
	     * @return {Number} The index of the element found, or `-1`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1}, {a: 2}, {a: 3}];
	     *      R.findIndex(R.propEq('a', 2))(xs); //=> 1
	     *      R.findIndex(R.propEq('a', 4))(xs); //=> -1
	     */
	    var findIndex = _curry2(_dispatchable('findIndex', _xfindIndex, function findIndex(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            if (fn(list[idx])) {
	                return idx;
	            }
	            idx += 1;
	        }
	        return -1;
	    }));
	
	    /**
	     * Returns the last element of the list which matches the predicate, or
	     * `undefined` if no element matches.
	     *
	     * Dispatches to the `findLast` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> a | undefined
	     * @param {Function} fn The predicate function used to determine if the element is the
	     * desired one.
	     * @param {Array} list The array to consider.
	     * @return {Object} The element found, or `undefined`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
	     *      R.findLast(R.propEq('a', 1))(xs); //=> {a: 1, b: 1}
	     *      R.findLast(R.propEq('a', 4))(xs); //=> undefined
	     */
	    var findLast = _curry2(_dispatchable('findLast', _xfindLast, function findLast(fn, list) {
	        var idx = list.length - 1;
	        while (idx >= 0) {
	            if (fn(list[idx])) {
	                return list[idx];
	            }
	            idx -= 1;
	        }
	    }));
	
	    /**
	     * Returns the index of the last element of the list which matches the
	     * predicate, or `-1` if no element matches.
	     *
	     * Dispatches to the `findLastIndex` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Number
	     * @param {Function} fn The predicate function used to determine if the element is the
	     * desired one.
	     * @param {Array} list The array to consider.
	     * @return {Number} The index of the element found, or `-1`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
	     *      R.findLastIndex(R.propEq('a', 1))(xs); //=> 1
	     *      R.findLastIndex(R.propEq('a', 4))(xs); //=> -1
	     */
	    var findLastIndex = _curry2(_dispatchable('findLastIndex', _xfindLastIndex, function findLastIndex(fn, list) {
	        var idx = list.length - 1;
	        while (idx >= 0) {
	            if (fn(list[idx])) {
	                return idx;
	            }
	            idx -= 1;
	        }
	        return -1;
	    }));
	
	    /**
	     * Iterate over an input `list`, calling a provided function `fn` for each
	     * element in the list.
	     *
	     * `fn` receives one argument: *(value)*.
	     *
	     * Note: `R.forEach` does not skip deleted or unassigned indices (sparse
	     * arrays), unlike the native `Array.prototype.forEach` method. For more
	     * details on this behavior, see:
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Description
	     *
	     * Also note that, unlike `Array.prototype.forEach`, Ramda's `forEach` returns
	     * the original array. In some libraries this function is named `each`.
	     *
	     * Dispatches to the `forEach` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> *) -> [a] -> [a]
	     * @param {Function} fn The function to invoke. Receives one argument, `value`.
	     * @param {Array} list The list to iterate over.
	     * @return {Array} The original list.
	     * @see R.addIndex
	     * @example
	     *
	     *      var printXPlusFive = x => console.log(x + 5);
	     *      R.forEach(printXPlusFive, [1, 2, 3]); //=> [1, 2, 3]
	     *      //-> 6
	     *      //-> 7
	     *      //-> 8
	     */
	    var forEach = _curry2(_checkForMethod('forEach', function forEach(fn, list) {
	        var len = list.length;
	        var idx = 0;
	        while (idx < len) {
	            fn(list[idx]);
	            idx += 1;
	        }
	        return list;
	    }));
	
	    /**
	     * Creates a new object out of a list key-value pairs.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig [[k,v]] -> {k: v}
	     * @param {Array} pairs An array of two-element arrays that will be the keys and values of the output object.
	     * @return {Object} The object made by pairing up `keys` and `values`.
	     * @see R.toPairs, R.pair
	     * @example
	     *
	     *      R.fromPairs([['a', 1], ['b', 2],  ['c', 3]]); //=> {a: 1, b: 2, c: 3}
	     */
	    var fromPairs = _curry1(function fromPairs(pairs) {
	        var idx = 0;
	        var len = pairs.length;
	        var out = {};
	        while (idx < len) {
	            if (_isArray(pairs[idx]) && pairs[idx].length) {
	                out[pairs[idx][0]] = pairs[idx][1];
	            }
	            idx += 1;
	        }
	        return out;
	    });
	
	    /**
	     * Takes a list and returns a list of lists where each sublist's elements are
	     * all "equal" according to the provided equality function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.21.0
	     * @category List
	     * @sig (a, a -> Boolean) -> [a] -> [[a]]
	     * @param {Function} fn Function for determining whether two given (adjacent)
	     *        elements should be in the same group
	     * @param {Array} list The array to group. Also accepts a string, which will be
	     *        treated as a list of characters.
	     * @return {List} A list that contains sublists of equal elements,
	     *         whose concatenations is equal to the original list.
	     * @example
	     *
	     *    groupWith(R.equals, [0, 1, 1, 2, 3, 5, 8, 13, 21])
	     *    // [[0], [1, 1], [2, 3, 5, 8, 13, 21]]
	     *
	     *    groupWith((a, b) => a % 2 === b % 2, [0, 1, 1, 2, 3, 5, 8, 13, 21])
	     *    // [[0], [1, 1], [2], [3, 5], [8], [13, 21]]
	     *
	     *    R.groupWith(R.eqBy(isVowel), 'aestiou')
	     *    // ['ae', 'st', 'iou']
	     */
	    var groupWith = _curry2(function (fn, list) {
	        var res = [];
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            var nextidx = idx + 1;
	            while (nextidx < len && fn(list[idx], list[nextidx])) {
	                nextidx += 1;
	            }
	            res.push(list.slice(idx, nextidx));
	            idx = nextidx;
	        }
	        return res;
	    });
	
	    /**
	     * Returns `true` if the first argument is greater than the second; `false`
	     * otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @see R.lt
	     * @example
	     *
	     *      R.gt(2, 1); //=> true
	     *      R.gt(2, 2); //=> false
	     *      R.gt(2, 3); //=> false
	     *      R.gt('a', 'z'); //=> false
	     *      R.gt('z', 'a'); //=> true
	     */
	    var gt = _curry2(function gt(a, b) {
	        return a > b;
	    });
	
	    /**
	     * Returns `true` if the first argument is greater than or equal to the second;
	     * `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {Number} a
	     * @param {Number} b
	     * @return {Boolean}
	     * @see R.lte
	     * @example
	     *
	     *      R.gte(2, 1); //=> true
	     *      R.gte(2, 2); //=> true
	     *      R.gte(2, 3); //=> false
	     *      R.gte('a', 'z'); //=> false
	     *      R.gte('z', 'a'); //=> true
	     */
	    var gte = _curry2(function gte(a, b) {
	        return a >= b;
	    });
	
	    /**
	     * Returns whether or not an object has an own property with the specified name
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Object
	     * @sig s -> {s: x} -> Boolean
	     * @param {String} prop The name of the property to check for.
	     * @param {Object} obj The object to query.
	     * @return {Boolean} Whether the property exists.
	     * @example
	     *
	     *      var hasName = R.has('name');
	     *      hasName({name: 'alice'});   //=> true
	     *      hasName({name: 'bob'});     //=> true
	     *      hasName({});                //=> false
	     *
	     *      var point = {x: 0, y: 0};
	     *      var pointHas = R.has(R.__, point);
	     *      pointHas('x');  //=> true
	     *      pointHas('y');  //=> true
	     *      pointHas('z');  //=> false
	     */
	    var has = _curry2(_has);
	
	    /**
	     * Returns whether or not an object or its prototype chain has a property with
	     * the specified name
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Object
	     * @sig s -> {s: x} -> Boolean
	     * @param {String} prop The name of the property to check for.
	     * @param {Object} obj The object to query.
	     * @return {Boolean} Whether the property exists.
	     * @example
	     *
	     *      function Rectangle(width, height) {
	     *        this.width = width;
	     *        this.height = height;
	     *      }
	     *      Rectangle.prototype.area = function() {
	     *        return this.width * this.height;
	     *      };
	     *
	     *      var square = new Rectangle(2, 2);
	     *      R.hasIn('width', square);  //=> true
	     *      R.hasIn('area', square);  //=> true
	     */
	    var hasIn = _curry2(function hasIn(prop, obj) {
	        return prop in obj;
	    });
	
	    /**
	     * Returns true if its arguments are identical, false otherwise. Values are
	     * identical if they reference the same memory. `NaN` is identical to `NaN`;
	     * `0` and `-0` are not identical.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category Relation
	     * @sig a -> a -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @example
	     *
	     *      var o = {};
	     *      R.identical(o, o); //=> true
	     *      R.identical(1, 1); //=> true
	     *      R.identical(1, '1'); //=> false
	     *      R.identical([], []); //=> false
	     *      R.identical(0, -0); //=> false
	     *      R.identical(NaN, NaN); //=> true
	     */
	    // SameValue algorithm
	    // Steps 1-5, 7-10
	    // Steps 6.b-6.e: +0 != -0
	    // Step 6.a: NaN == NaN
	    var identical = _curry2(function identical(a, b) {
	        // SameValue algorithm
	        if (a === b) {
	            // Steps 1-5, 7-10
	            // Steps 6.b-6.e: +0 != -0
	            return a !== 0 || 1 / a === 1 / b;
	        } else {
	            // Step 6.a: NaN == NaN
	            return a !== a && b !== b;
	        }
	    });
	
	    /**
	     * A function that does nothing but return the parameter supplied to it. Good
	     * as a default or placeholder function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig a -> a
	     * @param {*} x The value to return.
	     * @return {*} The input value, `x`.
	     * @example
	     *
	     *      R.identity(1); //=> 1
	     *
	     *      var obj = {};
	     *      R.identity(obj) === obj; //=> true
	     */
	    var identity = _curry1(_identity);
	
	    /**
	     * Creates a function that will process either the `onTrue` or the `onFalse`
	     * function depending upon the result of the `condition` predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Logic
	     * @sig (*... -> Boolean) -> (*... -> *) -> (*... -> *) -> (*... -> *)
	     * @param {Function} condition A predicate function
	     * @param {Function} onTrue A function to invoke when the `condition` evaluates to a truthy value.
	     * @param {Function} onFalse A function to invoke when the `condition` evaluates to a falsy value.
	     * @return {Function} A new unary function that will process either the `onTrue` or the `onFalse`
	     *                    function depending upon the result of the `condition` predicate.
	     * @see R.unless, R.when
	     * @example
	     *
	     *      var incCount = R.ifElse(
	     *        R.has('count'),
	     *        R.over(R.lensProp('count'), R.inc),
	     *        R.assoc('count', 1)
	     *      );
	     *      incCount({});           //=> { count: 1 }
	     *      incCount({ count: 1 }); //=> { count: 2 }
	     */
	    var ifElse = _curry3(function ifElse(condition, onTrue, onFalse) {
	        return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
	            return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
	        });
	    });
	
	    /**
	     * Increments its argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Math
	     * @sig Number -> Number
	     * @param {Number} n
	     * @return {Number}
	     * @see R.dec
	     * @example
	     *
	     *      R.inc(42); //=> 43
	     */
	    var inc = add(1);
	
	    /**
	     * Inserts the supplied element into the list, at index `index`. _Note that
	     * this is not destructive_: it returns a copy of the list with the changes.
	     * <small>No lists have been harmed in the application of this function.</small>
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.2
	     * @category List
	     * @sig Number -> a -> [a] -> [a]
	     * @param {Number} index The position to insert the element
	     * @param {*} elt The element to insert into the Array
	     * @param {Array} list The list to insert into
	     * @return {Array} A new Array with `elt` inserted at `index`.
	     * @example
	     *
	     *      R.insert(2, 'x', [1,2,3,4]); //=> [1,2,'x',3,4]
	     */
	    var insert = _curry3(function insert(idx, elt, list) {
	        idx = idx < list.length && idx >= 0 ? idx : list.length;
	        var result = _slice(list);
	        result.splice(idx, 0, elt);
	        return result;
	    });
	
	    /**
	     * Inserts the sub-list into the list, at index `index`. _Note that this is not
	     * destructive_: it returns a copy of the list with the changes.
	     * <small>No lists have been harmed in the application of this function.</small>
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category List
	     * @sig Number -> [a] -> [a] -> [a]
	     * @param {Number} index The position to insert the sub-list
	     * @param {Array} elts The sub-list to insert into the Array
	     * @param {Array} list The list to insert the sub-list into
	     * @return {Array} A new Array with `elts` inserted starting at `index`.
	     * @example
	     *
	     *      R.insertAll(2, ['x','y','z'], [1,2,3,4]); //=> [1,2,'x','y','z',3,4]
	     */
	    var insertAll = _curry3(function insertAll(idx, elts, list) {
	        idx = idx < list.length && idx >= 0 ? idx : list.length;
	        return _concat(_concat(_slice(list, 0, idx), elts), _slice(list, idx));
	    });
	
	    /**
	     * Creates a new list with the separator interposed between elements.
	     *
	     * Dispatches to the `intersperse` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig a -> [a] -> [a]
	     * @param {*} separator The element to add to the list.
	     * @param {Array} list The list to be interposed.
	     * @return {Array} The new list.
	     * @example
	     *
	     *      R.intersperse('n', ['ba', 'a', 'a']); //=> ['ba', 'n', 'a', 'n', 'a']
	     */
	    var intersperse = _curry2(_checkForMethod('intersperse', function intersperse(separator, list) {
	        var out = [];
	        var idx = 0;
	        var length = list.length;
	        while (idx < length) {
	            if (idx === length - 1) {
	                out.push(list[idx]);
	            } else {
	                out.push(list[idx], separator);
	            }
	            idx += 1;
	        }
	        return out;
	    }));
	
	    /**
	     * See if an object (`val`) is an instance of the supplied constructor. This
	     * function will check up the inheritance chain, if any.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Type
	     * @sig (* -> {*}) -> a -> Boolean
	     * @param {Object} ctor A constructor
	     * @param {*} val The value to test
	     * @return {Boolean}
	     * @example
	     *
	     *      R.is(Object, {}); //=> true
	     *      R.is(Number, 1); //=> true
	     *      R.is(Object, 1); //=> false
	     *      R.is(String, 's'); //=> true
	     *      R.is(String, new String('')); //=> true
	     *      R.is(Object, new String('')); //=> true
	     *      R.is(Object, 's'); //=> false
	     *      R.is(Number, {}); //=> false
	     */
	    var is = _curry2(function is(Ctor, val) {
	        return val != null && val.constructor === Ctor || val instanceof Ctor;
	    });
	
	    /**
	     * Tests whether or not an object is similar to an array.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.5.0
	     * @category Type
	     * @category List
	     * @sig * -> Boolean
	     * @param {*} x The object to test.
	     * @return {Boolean} `true` if `x` has a numeric length property and extreme indices defined; `false` otherwise.
	     * @example
	     *
	     *      R.isArrayLike([]); //=> true
	     *      R.isArrayLike(true); //=> false
	     *      R.isArrayLike({}); //=> false
	     *      R.isArrayLike({length: 10}); //=> false
	     *      R.isArrayLike({0: 'zero', 9: 'nine', length: 10}); //=> true
	     */
	    var isArrayLike = _curry1(function isArrayLike(x) {
	        if (_isArray(x)) {
	            return true;
	        }
	        if (!x) {
	            return false;
	        }
	        if (typeof x !== 'object') {
	            return false;
	        }
	        if (x instanceof String) {
	            return false;
	        }
	        if (x.nodeType === 1) {
	            return !!x.length;
	        }
	        if (x.length === 0) {
	            return true;
	        }
	        if (x.length > 0) {
	            return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
	        }
	        return false;
	    });
	
	    /**
	     * Checks if the input value is `null` or `undefined`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Type
	     * @sig * -> Boolean
	     * @param {*} x The value to test.
	     * @return {Boolean} `true` if `x` is `undefined` or `null`, otherwise `false`.
	     * @example
	     *
	     *      R.isNil(null); //=> true
	     *      R.isNil(undefined); //=> true
	     *      R.isNil(0); //=> false
	     *      R.isNil([]); //=> false
	     */
	    var isNil = _curry1(function isNil(x) {
	        return x == null;
	    });
	
	    /**
	     * Returns a list containing the names of all the enumerable own properties of
	     * the supplied object.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {k: v} -> [k]
	     * @param {Object} obj The object to extract properties from
	     * @return {Array} An array of the object's own properties.
	     * @example
	     *
	     *      R.keys({a: 1, b: 2, c: 3}); //=> ['a', 'b', 'c']
	     */
	    // cover IE < 9 keys issues
	    // Safari bug
	    var keys = function () {
	        // cover IE < 9 keys issues
	        var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
	        var nonEnumerableProps = [
	            'constructor',
	            'valueOf',
	            'isPrototypeOf',
	            'toString',
	            'propertyIsEnumerable',
	            'hasOwnProperty',
	            'toLocaleString'
	        ];
	        // Safari bug
	        var hasArgsEnumBug = function () {
	            'use strict';
	            return arguments.propertyIsEnumerable('length');
	        }();
	        var contains = function contains(list, item) {
	            var idx = 0;
	            while (idx < list.length) {
	                if (list[idx] === item) {
	                    return true;
	                }
	                idx += 1;
	            }
	            return false;
	        };
	        return typeof Object.keys === 'function' && !hasArgsEnumBug ? _curry1(function keys(obj) {
	            return Object(obj) !== obj ? [] : Object.keys(obj);
	        }) : _curry1(function keys(obj) {
	            if (Object(obj) !== obj) {
	                return [];
	            }
	            var prop, nIdx;
	            var ks = [];
	            var checkArgsLength = hasArgsEnumBug && _isArguments(obj);
	            for (prop in obj) {
	                if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
	                    ks[ks.length] = prop;
	                }
	            }
	            if (hasEnumBug) {
	                nIdx = nonEnumerableProps.length - 1;
	                while (nIdx >= 0) {
	                    prop = nonEnumerableProps[nIdx];
	                    if (_has(prop, obj) && !contains(ks, prop)) {
	                        ks[ks.length] = prop;
	                    }
	                    nIdx -= 1;
	                }
	            }
	            return ks;
	        });
	    }();
	
	    /**
	     * Returns a list containing the names of all the properties of the supplied
	     * object, including prototype properties.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Object
	     * @sig {k: v} -> [k]
	     * @param {Object} obj The object to extract properties from
	     * @return {Array} An array of the object's own and prototype properties.
	     * @example
	     *
	     *      var F = function() { this.x = 'X'; };
	     *      F.prototype.y = 'Y';
	     *      var f = new F();
	     *      R.keysIn(f); //=> ['x', 'y']
	     */
	    var keysIn = _curry1(function keysIn(obj) {
	        var prop;
	        var ks = [];
	        for (prop in obj) {
	            ks[ks.length] = prop;
	        }
	        return ks;
	    });
	
	    /**
	     * Returns the number of elements in the array by returning `list.length`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig [a] -> Number
	     * @param {Array} list The array to inspect.
	     * @return {Number} The length of the array.
	     * @example
	     *
	     *      R.length([]); //=> 0
	     *      R.length([1, 2, 3]); //=> 3
	     */
	    var length = _curry1(function length(list) {
	        return list != null && is(Number, list.length) ? list.length : NaN;
	    });
	
	    /**
	     * Returns `true` if the first argument is less than the second; `false`
	     * otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @see R.gt
	     * @example
	     *
	     *      R.lt(2, 1); //=> false
	     *      R.lt(2, 2); //=> false
	     *      R.lt(2, 3); //=> true
	     *      R.lt('a', 'z'); //=> true
	     *      R.lt('z', 'a'); //=> false
	     */
	    var lt = _curry2(function lt(a, b) {
	        return a < b;
	    });
	
	    /**
	     * Returns `true` if the first argument is less than or equal to the second;
	     * `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {Number} a
	     * @param {Number} b
	     * @return {Boolean}
	     * @see R.gte
	     * @example
	     *
	     *      R.lte(2, 1); //=> false
	     *      R.lte(2, 2); //=> true
	     *      R.lte(2, 3); //=> true
	     *      R.lte('a', 'z'); //=> true
	     *      R.lte('z', 'a'); //=> false
	     */
	    var lte = _curry2(function lte(a, b) {
	        return a <= b;
	    });
	
	    /**
	     * The mapAccum function behaves like a combination of map and reduce; it
	     * applies a function to each element of a list, passing an accumulating
	     * parameter from left to right, and returning a final value of this
	     * accumulator together with the new list.
	     *
	     * The iterator function receives two arguments, *acc* and *value*, and should
	     * return a tuple *[acc, value]*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
	     * @param {Function} fn The function to be called on every element of the input `list`.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.addIndex
	     * @example
	     *
	     *      var digits = ['1', '2', '3', '4'];
	     *      var appender = (a, b) => [a + b, a + b];
	     *
	     *      R.mapAccum(appender, 0, digits); //=> ['01234', ['01', '012', '0123', '01234']]
	     */
	    var mapAccum = _curry3(function mapAccum(fn, acc, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [];
	        var tuple = [acc];
	        while (idx < len) {
	            tuple = fn(tuple[0], list[idx]);
	            result[idx] = tuple[1];
	            idx += 1;
	        }
	        return [
	            tuple[0],
	            result
	        ];
	    });
	
	    /**
	     * The mapAccumRight function behaves like a combination of map and reduce; it
	     * applies a function to each element of a list, passing an accumulating
	     * parameter from right to left, and returning a final value of this
	     * accumulator together with the new list.
	     *
	     * Similar to `mapAccum`, except moves through the input list from the right to
	     * the left.
	     *
	     * The iterator function receives two arguments, *acc* and *value*, and should
	     * return a tuple *[acc, value]*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
	     * @param {Function} fn The function to be called on every element of the input `list`.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.addIndex
	     * @example
	     *
	     *      var digits = ['1', '2', '3', '4'];
	     *      var append = (a, b) => [a + b, a + b];
	     *
	     *      R.mapAccumRight(append, 0, digits); //=> ['04321', ['04321', '0432', '043', '04']]
	     */
	    var mapAccumRight = _curry3(function mapAccumRight(fn, acc, list) {
	        var idx = list.length - 1;
	        var result = [];
	        var tuple = [acc];
	        while (idx >= 0) {
	            tuple = fn(tuple[0], list[idx]);
	            result[idx] = tuple[1];
	            idx -= 1;
	        }
	        return [
	            tuple[0],
	            result
	        ];
	    });
	
	    /**
	     * Tests a regular expression against a String. Note that this function will
	     * return an empty array when there are no matches. This differs from
	     * [`String.prototype.match`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
	     * which returns `null` when there are no matches.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category String
	     * @sig RegExp -> String -> [String | Undefined]
	     * @param {RegExp} rx A regular expression.
	     * @param {String} str The string to match against
	     * @return {Array} The list of matches or empty array.
	     * @see R.test
	     * @example
	     *
	     *      R.match(/([a-z]a)/g, 'bananas'); //=> ['ba', 'na', 'na']
	     *      R.match(/a/, 'b'); //=> []
	     *      R.match(/a/, null); //=> TypeError: null does not have a method named "match"
	     */
	    var match = _curry2(function match(rx, str) {
	        return str.match(rx) || [];
	    });
	
	    /**
	     * mathMod behaves like the modulo operator should mathematically, unlike the
	     * `%` operator (and by extension, R.modulo). So while "-17 % 5" is -2,
	     * mathMod(-17, 5) is 3. mathMod requires Integer arguments, and returns NaN
	     * when the modulus is zero or negative.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} m The dividend.
	     * @param {Number} p the modulus.
	     * @return {Number} The result of `b mod a`.
	     * @example
	     *
	     *      R.mathMod(-17, 5);  //=> 3
	     *      R.mathMod(17, 5);   //=> 2
	     *      R.mathMod(17, -5);  //=> NaN
	     *      R.mathMod(17, 0);   //=> NaN
	     *      R.mathMod(17.2, 5); //=> NaN
	     *      R.mathMod(17, 5.3); //=> NaN
	     *
	     *      var clock = R.mathMod(R.__, 12);
	     *      clock(15); //=> 3
	     *      clock(24); //=> 0
	     *
	     *      var seventeenMod = R.mathMod(17);
	     *      seventeenMod(3);  //=> 2
	     *      seventeenMod(4);  //=> 1
	     *      seventeenMod(10); //=> 7
	     */
	    var mathMod = _curry2(function mathMod(m, p) {
	        if (!_isInteger(m)) {
	            return NaN;
	        }
	        if (!_isInteger(p) || p < 1) {
	            return NaN;
	        }
	        return (m % p + p) % p;
	    });
	
	    /**
	     * Returns the larger of its two arguments.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> a
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.maxBy, R.min
	     * @example
	     *
	     *      R.max(789, 123); //=> 789
	     *      R.max('a', 'b'); //=> 'b'
	     */
	    var max = _curry2(function max(a, b) {
	        return b > a ? b : a;
	    });
	
	    /**
	     * Takes a function and two values, and returns whichever value produces the
	     * larger result when passed to the provided function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Relation
	     * @sig Ord b => (a -> b) -> a -> a -> a
	     * @param {Function} f
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.max, R.minBy
	     * @example
	     *
	     *      //  square :: Number -> Number
	     *      var square = n => n * n;
	     *
	     *      R.maxBy(square, -3, 2); //=> -3
	     *
	     *      R.reduce(R.maxBy(square), 0, [3, -5, 4, 1, -2]); //=> -5
	     *      R.reduce(R.maxBy(square), 0, []); //=> 0
	     */
	    var maxBy = _curry3(function maxBy(f, a, b) {
	        return f(b) > f(a) ? b : a;
	    });
	
	    /**
	     * Create a new object with the own properties of the first object merged with
	     * the own properties of the second object. If a key exists in both objects,
	     * the value from the second object will be used.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {k: v} -> {k: v} -> {k: v}
	     * @param {Object} l
	     * @param {Object} r
	     * @return {Object}
	     * @see R.mergeWith, R.mergeWithKey
	     * @example
	     *
	     *      R.merge({ 'name': 'fred', 'age': 10 }, { 'age': 40 });
	     *      //=> { 'name': 'fred', 'age': 40 }
	     *
	     *      var resetToDefault = R.merge(R.__, {x: 0});
	     *      resetToDefault({x: 5, y: 2}); //=> {x: 0, y: 2}
	     */
	    var merge = _curry2(function merge(l, r) {
	        return _assign({}, l, r);
	    });
	
	    /**
	     * Merges a list of objects together into one object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig [{k: v}] -> {k: v}
	     * @param {Array} list An array of objects
	     * @return {Object} A merged object.
	     * @see R.reduce
	     * @example
	     *
	     *      R.mergeAll([{foo:1},{bar:2},{baz:3}]); //=> {foo:1,bar:2,baz:3}
	     *      R.mergeAll([{foo:1},{foo:2},{bar:2}]); //=> {foo:2,bar:2}
	     */
	    var mergeAll = _curry1(function mergeAll(list) {
	        return _assign.apply(null, [{}].concat(list));
	    });
	
	    /**
	     * Creates a new object with the own properties of the two provided objects. If
	     * a key exists in both objects, the provided function is applied to the key
	     * and the values associated with the key in each object, with the result being
	     * used as the value associated with the key in the returned object. The key
	     * will be excluded from the returned object if the resulting value is
	     * `undefined`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Object
	     * @sig (String -> a -> a -> a) -> {a} -> {a} -> {a}
	     * @param {Function} fn
	     * @param {Object} l
	     * @param {Object} r
	     * @return {Object}
	     * @see R.merge, R.mergeWith
	     * @example
	     *
	     *      let concatValues = (k, l, r) => k == 'values' ? R.concat(l, r) : r
	     *      R.mergeWithKey(concatValues,
	     *                     { a: true, thing: 'foo', values: [10, 20] },
	     *                     { b: true, thing: 'bar', values: [15, 35] });
	     *      //=> { a: true, b: true, thing: 'bar', values: [10, 20, 15, 35] }
	     */
	    var mergeWithKey = _curry3(function mergeWithKey(fn, l, r) {
	        var result = {};
	        var k;
	        for (k in l) {
	            if (_has(k, l)) {
	                result[k] = _has(k, r) ? fn(k, l[k], r[k]) : l[k];
	            }
	        }
	        for (k in r) {
	            if (_has(k, r) && !_has(k, result)) {
	                result[k] = r[k];
	            }
	        }
	        return result;
	    });
	
	    /**
	     * Returns the smaller of its two arguments.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> a
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.minBy, R.max
	     * @example
	     *
	     *      R.min(789, 123); //=> 123
	     *      R.min('a', 'b'); //=> 'a'
	     */
	    var min = _curry2(function min(a, b) {
	        return b < a ? b : a;
	    });
	
	    /**
	     * Takes a function and two values, and returns whichever value produces the
	     * smaller result when passed to the provided function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Relation
	     * @sig Ord b => (a -> b) -> a -> a -> a
	     * @param {Function} f
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.min, R.maxBy
	     * @example
	     *
	     *      //  square :: Number -> Number
	     *      var square = n => n * n;
	     *
	     *      R.minBy(square, -3, 2); //=> 2
	     *
	     *      R.reduce(R.minBy(square), Infinity, [3, -5, 4, 1, -2]); //=> 1
	     *      R.reduce(R.minBy(square), Infinity, []); //=> Infinity
	     */
	    var minBy = _curry3(function minBy(f, a, b) {
	        return f(b) < f(a) ? b : a;
	    });
	
	    /**
	     * Divides the second parameter by the first and returns the remainder. Note
	     * that this function preserves the JavaScript-style behavior for modulo. For
	     * mathematical modulo see `mathMod`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The value to the divide.
	     * @param {Number} b The pseudo-modulus
	     * @return {Number} The result of `b % a`.
	     * @see R.mathMod
	     * @example
	     *
	     *      R.modulo(17, 3); //=> 2
	     *      // JS behavior:
	     *      R.modulo(-17, 3); //=> -2
	     *      R.modulo(17, -3); //=> 2
	     *
	     *      var isOdd = R.modulo(R.__, 2);
	     *      isOdd(42); //=> 0
	     *      isOdd(21); //=> 1
	     */
	    var modulo = _curry2(function modulo(a, b) {
	        return a % b;
	    });
	
	    /**
	     * Multiplies two numbers. Equivalent to `a * b` but curried.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The first value.
	     * @param {Number} b The second value.
	     * @return {Number} The result of `a * b`.
	     * @see R.divide
	     * @example
	     *
	     *      var double = R.multiply(2);
	     *      var triple = R.multiply(3);
	     *      double(3);       //=>  6
	     *      triple(4);       //=> 12
	     *      R.multiply(2, 5);  //=> 10
	     */
	    var multiply = _curry2(function multiply(a, b) {
	        return a * b;
	    });
	
	    /**
	     * Wraps a function of any arity (including nullary) in a function that accepts
	     * exactly `n` parameters. Any extraneous parameters will not be passed to the
	     * supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig Number -> (* -> a) -> (* -> a)
	     * @param {Number} n The desired arity of the new function.
	     * @param {Function} fn The function to wrap.
	     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	     *         arity `n`.
	     * @example
	     *
	     *      var takesTwoArgs = (a, b) => [a, b];
	     *
	     *      takesTwoArgs.length; //=> 2
	     *      takesTwoArgs(1, 2); //=> [1, 2]
	     *
	     *      var takesOneArg = R.nAry(1, takesTwoArgs);
	     *      takesOneArg.length; //=> 1
	     *      // Only `n` arguments are passed to the wrapped function
	     *      takesOneArg(1, 2); //=> [1, undefined]
	     */
	    var nAry = _curry2(function nAry(n, fn) {
	        switch (n) {
	        case 0:
	            return function () {
	                return fn.call(this);
	            };
	        case 1:
	            return function (a0) {
	                return fn.call(this, a0);
	            };
	        case 2:
	            return function (a0, a1) {
	                return fn.call(this, a0, a1);
	            };
	        case 3:
	            return function (a0, a1, a2) {
	                return fn.call(this, a0, a1, a2);
	            };
	        case 4:
	            return function (a0, a1, a2, a3) {
	                return fn.call(this, a0, a1, a2, a3);
	            };
	        case 5:
	            return function (a0, a1, a2, a3, a4) {
	                return fn.call(this, a0, a1, a2, a3, a4);
	            };
	        case 6:
	            return function (a0, a1, a2, a3, a4, a5) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5);
	            };
	        case 7:
	            return function (a0, a1, a2, a3, a4, a5, a6) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
	            };
	        case 8:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
	            };
	        case 9:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
	            };
	        case 10:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
	            };
	        default:
	            throw new Error('First argument to nAry must be a non-negative integer no greater than ten');
	        }
	    });
	
	    /**
	     * Negates its argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Math
	     * @sig Number -> Number
	     * @param {Number} n
	     * @return {Number}
	     * @example
	     *
	     *      R.negate(42); //=> -42
	     */
	    var negate = _curry1(function negate(n) {
	        return -n;
	    });
	
	    /**
	     * Returns `true` if no elements of the list match the predicate, `false`
	     * otherwise.
	     *
	     * Dispatches to the `any` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Boolean
	     * @param {Function} fn The predicate function.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the predicate is not satisfied by every element, `false` otherwise.
	     * @see R.all, R.any
	     * @example
	     *
	     *      var isEven = n => n % 2 === 0;
	     *
	     *      R.none(isEven, [1, 3, 5, 7, 9, 11]); //=> true
	     *      R.none(isEven, [1, 3, 5, 7, 8, 11]); //=> false
	     */
	    var none = _curry2(_complement(_dispatchable('any', _xany, any)));
	
	    /**
	     * A function that returns the `!` of its argument. It will return `true` when
	     * passed false-y value, and `false` when passed a truth-y one.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig * -> Boolean
	     * @param {*} a any value
	     * @return {Boolean} the logical inverse of passed argument.
	     * @see R.complement
	     * @example
	     *
	     *      R.not(true); //=> false
	     *      R.not(false); //=> true
	     *      R.not(0); => true
	     *      R.not(1); => false
	     */
	    var not = _curry1(function not(a) {
	        return !a;
	    });
	
	    /**
	     * Returns the nth element of the given list or string. If n is negative the
	     * element at index length + n is returned.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> [a] -> a | Undefined
	     * @sig Number -> String -> String
	     * @param {Number} offset
	     * @param {*} list
	     * @return {*}
	     * @example
	     *
	     *      var list = ['foo', 'bar', 'baz', 'quux'];
	     *      R.nth(1, list); //=> 'bar'
	     *      R.nth(-1, list); //=> 'quux'
	     *      R.nth(-99, list); //=> undefined
	     *
	     *      R.nth(2, 'abc'); //=> 'c'
	     *      R.nth(3, 'abc'); //=> ''
	     */
	    var nth = _curry2(function nth(offset, list) {
	        var idx = offset < 0 ? list.length + offset : offset;
	        return _isString(list) ? list.charAt(idx) : list[idx];
	    });
	
	    /**
	     * Returns a function which returns its nth argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig Number -> *... -> *
	     * @param {Number} n
	     * @return {Function}
	     * @example
	     *
	     *      R.nthArg(1)('a', 'b', 'c'); //=> 'b'
	     *      R.nthArg(-1)('a', 'b', 'c'); //=> 'c'
	     */
	    var nthArg = _curry1(function nthArg(n) {
	        return function () {
	            return nth(n, arguments);
	        };
	    });
	
	    /**
	     * Creates an object containing a single key:value pair.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Object
	     * @sig String -> a -> {String:a}
	     * @param {String} key
	     * @param {*} val
	     * @return {Object}
	     * @see R.pair
	     * @example
	     *
	     *      var matchPhrases = R.compose(
	     *        R.objOf('must'),
	     *        R.map(R.objOf('match_phrase'))
	     *      );
	     *      matchPhrases(['foo', 'bar', 'baz']); //=> {must: [{match_phrase: 'foo'}, {match_phrase: 'bar'}, {match_phrase: 'baz'}]}
	     */
	    var objOf = _curry2(function objOf(key, val) {
	        var obj = {};
	        obj[key] = val;
	        return obj;
	    });
	
	    /**
	     * Returns a singleton array containing the value provided.
	     *
	     * Note this `of` is different from the ES6 `of`; See
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Function
	     * @sig a -> [a]
	     * @param {*} x any value
	     * @return {Array} An array wrapping `x`.
	     * @example
	     *
	     *      R.of(null); //=> [null]
	     *      R.of([42]); //=> [[42]]
	     */
	    var of = _curry1(_of);
	
	    /**
	     * Accepts a function `fn` and returns a function that guards invocation of
	     * `fn` such that `fn` can only ever be called once, no matter how many times
	     * the returned function is invoked. The first value calculated is returned in
	     * subsequent invocations.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a... -> b) -> (a... -> b)
	     * @param {Function} fn The function to wrap in a call-only-once wrapper.
	     * @return {Function} The wrapped function.
	     * @example
	     *
	     *      var addOneOnce = R.once(x => x + 1);
	     *      addOneOnce(10); //=> 11
	     *      addOneOnce(addOneOnce(50)); //=> 11
	     */
	    var once = _curry1(function once(fn) {
	        var called = false;
	        var result;
	        return _arity(fn.length, function () {
	            if (called) {
	                return result;
	            }
	            called = true;
	            result = fn.apply(this, arguments);
	            return result;
	        });
	    });
	
	    /**
	     * Returns `true` if one or both of its arguments are `true`. Returns `false`
	     * if both arguments are `false`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig * -> * -> *
	     * @param {Boolean} a A boolean value
	     * @param {Boolean} b A boolean value
	     * @return {Boolean} `true` if one or both arguments are `true`, `false` otherwise
	     * @see R.either
	     * @example
	     *
	     *      R.or(true, true); //=> true
	     *      R.or(true, false); //=> true
	     *      R.or(false, true); //=> true
	     *      R.or(false, false); //=> false
	     */
	    var or = _curry2(function or(a, b) {
	        return a || b;
	    });
	
	    /**
	     * Returns the result of "setting" the portion of the given data structure
	     * focused by the given lens to the result of applying the given function to
	     * the focused value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Lens s a -> (a -> a) -> s -> s
	     * @param {Lens} lens
	     * @param {*} v
	     * @param {*} x
	     * @return {*}
	     * @see R.prop, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var headLens = R.lensIndex(0);
	     *
	     *      R.over(headLens, R.toUpper, ['foo', 'bar', 'baz']); //=> ['FOO', 'bar', 'baz']
	     */
	    // `Identity` is a functor that holds a single value, where `map` simply
	    // transforms the held value with the provided function.
	    // The value returned by the getter function is first transformed with `f`,
	    // then set as the value of an `Identity`. This is then mapped over with the
	    // setter function of the lens.
	    var over = function () {
	        // `Identity` is a functor that holds a single value, where `map` simply
	        // transforms the held value with the provided function.
	        var Identity = function (x) {
	            return {
	                value: x,
	                map: function (f) {
	                    return Identity(f(x));
	                }
	            };
	        };
	        return _curry3(function over(lens, f, x) {
	            // The value returned by the getter function is first transformed with `f`,
	            // then set as the value of an `Identity`. This is then mapped over with the
	            // setter function of the lens.
	            return lens(function (y) {
	                return Identity(f(y));
	            })(x).value;
	        });
	    }();
	
	    /**
	     * Takes two arguments, `fst` and `snd`, and returns `[fst, snd]`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category List
	     * @sig a -> b -> (a,b)
	     * @param {*} fst
	     * @param {*} snd
	     * @return {Array}
	     * @see R.objOf, R.of
	     * @example
	     *
	     *      R.pair('foo', 'bar'); //=> ['foo', 'bar']
	     */
	    var pair = _curry2(function pair(fst, snd) {
	        return [
	            fst,
	            snd
	        ];
	    });
	
	    /**
	     * Retrieve the value at a given path.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Object
	     * @sig [String] -> {k: v} -> v | Undefined
	     * @param {Array} path The path to use.
	     * @param {Object} obj The object to retrieve the nested property from.
	     * @return {*} The data at `path`.
	     * @example
	     *
	     *      R.path(['a', 'b'], {a: {b: 2}}); //=> 2
	     *      R.path(['a', 'b'], {c: {b: 2}}); //=> undefined
	     */
	    var path = _curry2(function path(paths, obj) {
	        var val = obj;
	        var idx = 0;
	        while (idx < paths.length) {
	            if (val == null) {
	                return;
	            }
	            val = val[paths[idx]];
	            idx += 1;
	        }
	        return val;
	    });
	
	    /**
	     * If the given, non-null object has a value at the given path, returns the
	     * value at that path. Otherwise returns the provided default value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Object
	     * @sig a -> [String] -> Object -> a
	     * @param {*} d The default value.
	     * @param {Array} p The path to use.
	     * @param {Object} obj The object to retrieve the nested property from.
	     * @return {*} The data at `path` of the supplied object or the default value.
	     * @example
	     *
	     *      R.pathOr('N/A', ['a', 'b'], {a: {b: 2}}); //=> 2
	     *      R.pathOr('N/A', ['a', 'b'], {c: {b: 2}}); //=> "N/A"
	     */
	    var pathOr = _curry3(function pathOr(d, p, obj) {
	        return defaultTo(d, path(p, obj));
	    });
	
	    /**
	     * Returns `true` if the specified object property at given path satisfies the
	     * given predicate; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Logic
	     * @sig (a -> Boolean) -> [String] -> Object -> Boolean
	     * @param {Function} pred
	     * @param {Array} propPath
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.propSatisfies, R.path
	     * @example
	     *
	     *      R.pathSatisfies(y => y > 0, ['x', 'y'], {x: {y: 2}}); //=> true
	     */
	    var pathSatisfies = _curry3(function pathSatisfies(pred, propPath, obj) {
	        return propPath.length > 0 && pred(path(propPath, obj));
	    });
	
	    /**
	     * Returns a partial copy of an object containing only the keys specified. If
	     * the key does not exist, the property is ignored.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [k] -> {k: v} -> {k: v}
	     * @param {Array} names an array of String property names to copy onto a new object
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with only properties from `names` on it.
	     * @see R.omit, R.props
	     * @example
	     *
	     *      R.pick(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
	     *      R.pick(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1}
	     */
	    var pick = _curry2(function pick(names, obj) {
	        var result = {};
	        var idx = 0;
	        while (idx < names.length) {
	            if (names[idx] in obj) {
	                result[names[idx]] = obj[names[idx]];
	            }
	            idx += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Similar to `pick` except that this one includes a `key: undefined` pair for
	     * properties that don't exist.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [k] -> {k: v} -> {k: v}
	     * @param {Array} names an array of String property names to copy onto a new object
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with only properties from `names` on it.
	     * @see R.pick
	     * @example
	     *
	     *      R.pickAll(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
	     *      R.pickAll(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, e: undefined, f: undefined}
	     */
	    var pickAll = _curry2(function pickAll(names, obj) {
	        var result = {};
	        var idx = 0;
	        var len = names.length;
	        while (idx < len) {
	            var name = names[idx];
	            result[name] = obj[name];
	            idx += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Returns a partial copy of an object containing only the keys that satisfy
	     * the supplied predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @sig (v, k -> Boolean) -> {k: v} -> {k: v}
	     * @param {Function} pred A predicate to determine whether or not a key
	     *        should be included on the output object.
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with only properties that satisfy `pred`
	     *         on it.
	     * @see R.pick, R.filter
	     * @example
	     *
	     *      var isUpperCase = (val, key) => key.toUpperCase() === key;
	     *      R.pickBy(isUpperCase, {a: 1, b: 2, A: 3, B: 4}); //=> {A: 3, B: 4}
	     */
	    var pickBy = _curry2(function pickBy(test, obj) {
	        var result = {};
	        for (var prop in obj) {
	            if (test(obj[prop], prop, obj)) {
	                result[prop] = obj[prop];
	            }
	        }
	        return result;
	    });
	
	    /**
	     * Returns a new list with the given element at the front, followed by the
	     * contents of the list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> [a]
	     * @param {*} el The item to add to the head of the output list.
	     * @param {Array} list The array to add to the tail of the output list.
	     * @return {Array} A new array.
	     * @see R.append
	     * @example
	     *
	     *      R.prepend('fee', ['fi', 'fo', 'fum']); //=> ['fee', 'fi', 'fo', 'fum']
	     */
	    var prepend = _curry2(function prepend(el, list) {
	        return _concat([el], list);
	    });
	
	    /**
	     * Returns a function that when supplied an object returns the indicated
	     * property of that object, if it exists.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig s -> {s: a} -> a | Undefined
	     * @param {String} p The property name
	     * @param {Object} obj The object to query
	     * @return {*} The value at `obj.p`.
	     * @example
	     *
	     *      R.prop('x', {x: 100}); //=> 100
	     *      R.prop('x', {}); //=> undefined
	     */
	    var prop = _curry2(function prop(p, obj) {
	        return obj[p];
	    });
	
	    /**
	     * If the given, non-null object has an own property with the specified name,
	     * returns the value of that property. Otherwise returns the provided default
	     * value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category Object
	     * @sig a -> String -> Object -> a
	     * @param {*} val The default value.
	     * @param {String} p The name of the property to return.
	     * @param {Object} obj The object to query.
	     * @return {*} The value of given property of the supplied object or the default value.
	     * @example
	     *
	     *      var alice = {
	     *        name: 'ALICE',
	     *        age: 101
	     *      };
	     *      var favorite = R.prop('favoriteLibrary');
	     *      var favoriteWithDefault = R.propOr('Ramda', 'favoriteLibrary');
	     *
	     *      favorite(alice);  //=> undefined
	     *      favoriteWithDefault(alice);  //=> 'Ramda'
	     */
	    var propOr = _curry3(function propOr(val, p, obj) {
	        return obj != null && _has(p, obj) ? obj[p] : val;
	    });
	
	    /**
	     * Returns `true` if the specified object property satisfies the given
	     * predicate; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Logic
	     * @sig (a -> Boolean) -> String -> {String: a} -> Boolean
	     * @param {Function} pred
	     * @param {String} name
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.propEq, R.propIs
	     * @example
	     *
	     *      R.propSatisfies(x => x > 0, 'x', {x: 1, y: 2}); //=> true
	     */
	    var propSatisfies = _curry3(function propSatisfies(pred, name, obj) {
	        return pred(obj[name]);
	    });
	
	    /**
	     * Acts as multiple `prop`: array of keys in, array of values out. Preserves
	     * order.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [k] -> {k: v} -> [v]
	     * @param {Array} ps The property names to fetch
	     * @param {Object} obj The object to query
	     * @return {Array} The corresponding values or partially applied function.
	     * @example
	     *
	     *      R.props(['x', 'y'], {x: 1, y: 2}); //=> [1, 2]
	     *      R.props(['c', 'a', 'b'], {b: 2, a: 1}); //=> [undefined, 1, 2]
	     *
	     *      var fullName = R.compose(R.join(' '), R.props(['first', 'last']));
	     *      fullName({last: 'Bullet-Tooth', age: 33, first: 'Tony'}); //=> 'Tony Bullet-Tooth'
	     */
	    var props = _curry2(function props(ps, obj) {
	        var len = ps.length;
	        var out = [];
	        var idx = 0;
	        while (idx < len) {
	            out[idx] = obj[ps[idx]];
	            idx += 1;
	        }
	        return out;
	    });
	
	    /**
	     * Returns a list of numbers from `from` (inclusive) to `to` (exclusive).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> Number -> [Number]
	     * @param {Number} from The first number in the list.
	     * @param {Number} to One more than the last number in the list.
	     * @return {Array} The list of numbers in tthe set `[a, b)`.
	     * @example
	     *
	     *      R.range(1, 5);    //=> [1, 2, 3, 4]
	     *      R.range(50, 53);  //=> [50, 51, 52]
	     */
	    var range = _curry2(function range(from, to) {
	        if (!(_isNumber(from) && _isNumber(to))) {
	            throw new TypeError('Both arguments to range must be numbers');
	        }
	        var result = [];
	        var n = from;
	        while (n < to) {
	            result.push(n);
	            n += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Returns a single item by iterating through the list, successively calling
	     * the iterator function and passing it an accumulator value and the current
	     * value from the array, and then passing the result to the next call.
	     *
	     * Similar to `reduce`, except moves through the input list from the right to
	     * the left.
	     *
	     * The iterator function receives two values: *(acc, value)*
	     *
	     * Note: `R.reduceRight` does not skip deleted or unassigned indices (sparse
	     * arrays), unlike the native `Array.prototype.reduce` method. For more details
	     * on this behavior, see:
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight#Description
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a,b -> a) -> a -> [b] -> a
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.addIndex
	     * @example
	     *
	     *      var pairs = [ ['a', 1], ['b', 2], ['c', 3] ];
	     *      var flattenPairs = (acc, pair) => acc.concat(pair);
	     *
	     *      R.reduceRight(flattenPairs, [], pairs); //=> [ 'c', 3, 'b', 2, 'a', 1 ]
	     */
	    var reduceRight = _curry3(function reduceRight(fn, acc, list) {
	        var idx = list.length - 1;
	        while (idx >= 0) {
	            acc = fn(acc, list[idx]);
	            idx -= 1;
	        }
	        return acc;
	    });
	
	    /**
	     * Returns a value wrapped to indicate that it is the final value of the reduce
	     * and transduce functions. The returned value should be considered a black
	     * box: the internal structure is not guaranteed to be stable.
	     *
	     * Note: this optimization is unavailable to functions not explicitly listed
	     * above. For instance, it is not currently supported by reduceRight.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category List
	     * @sig a -> *
	     * @param {*} x The final value of the reduce.
	     * @return {*} The wrapped value.
	     * @see R.reduce, R.transduce
	     * @example
	     *
	     *      R.reduce(
	     *        R.pipe(R.add, R.when(R.gte(R.__, 10), R.reduced)),
	     *        0,
	     *        [1, 2, 3, 4, 5]) // 10
	     */
	    var reduced = _curry1(_reduced);
	
	    /**
	     * Removes the sub-list of `list` starting at index `start` and containing
	     * `count` elements. _Note that this is not destructive_: it returns a copy of
	     * the list with the changes.
	     * <small>No lists have been harmed in the application of this function.</small>
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.2
	     * @category List
	     * @sig Number -> Number -> [a] -> [a]
	     * @param {Number} start The position to start removing elements
	     * @param {Number} count The number of elements to remove
	     * @param {Array} list The list to remove from
	     * @return {Array} A new Array with `count` elements from `start` removed.
	     * @example
	     *
	     *      R.remove(2, 3, [1,2,3,4,5,6,7,8]); //=> [1,2,6,7,8]
	     */
	    var remove = _curry3(function remove(start, count, list) {
	        return _concat(_slice(list, 0, Math.min(start, list.length)), _slice(list, Math.min(list.length, start + count)));
	    });
	
	    /**
	     * Replace a substring or regex match in a string with a replacement.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category String
	     * @sig RegExp|String -> String -> String -> String
	     * @param {RegExp|String} pattern A regular expression or a substring to match.
	     * @param {String} replacement The string to replace the matches with.
	     * @param {String} str The String to do the search and replacement in.
	     * @return {String} The result.
	     * @example
	     *
	     *      R.replace('foo', 'bar', 'foo foo foo'); //=> 'bar foo foo'
	     *      R.replace(/foo/, 'bar', 'foo foo foo'); //=> 'bar foo foo'
	     *
	     *      // Use the "g" (global) flag to replace all occurrences:
	     *      R.replace(/foo/g, 'bar', 'foo foo foo'); //=> 'bar bar bar'
	     */
	    var replace = _curry3(function replace(regex, replacement, str) {
	        return str.replace(regex, replacement);
	    });
	
	    /**
	     * Returns a new list or string with the elements or characters in reverse
	     * order.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a]
	     * @sig String -> String
	     * @param {Array|String} list
	     * @return {Array|String}
	     * @example
	     *
	     *      R.reverse([1, 2, 3]);  //=> [3, 2, 1]
	     *      R.reverse([1, 2]);     //=> [2, 1]
	     *      R.reverse([1]);        //=> [1]
	     *      R.reverse([]);         //=> []
	     *
	     *      R.reverse('abc');      //=> 'cba'
	     *      R.reverse('ab');       //=> 'ba'
	     *      R.reverse('a');        //=> 'a'
	     *      R.reverse('');         //=> ''
	     */
	    var reverse = _curry1(function reverse(list) {
	        return _isString(list) ? list.split('').reverse().join('') : _slice(list).reverse();
	    });
	
	    /**
	     * Scan is similar to reduce, but returns a list of successively reduced values
	     * from the left
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (a,b -> a) -> a -> [b] -> [a]
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {Array} A list of all intermediately reduced values.
	     * @example
	     *
	     *      var numbers = [1, 2, 3, 4];
	     *      var factorials = R.scan(R.multiply, 1, numbers); //=> [1, 1, 2, 6, 24]
	     */
	    var scan = _curry3(function scan(fn, acc, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [acc];
	        while (idx < len) {
	            acc = fn(acc, list[idx]);
	            result[idx + 1] = acc;
	            idx += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Returns the result of "setting" the portion of the given data structure
	     * focused by the given lens to the given value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Lens s a -> a -> s -> s
	     * @param {Lens} lens
	     * @param {*} v
	     * @param {*} x
	     * @return {*}
	     * @see R.prop, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var xLens = R.lensProp('x');
	     *
	     *      R.set(xLens, 4, {x: 1, y: 2});  //=> {x: 4, y: 2}
	     *      R.set(xLens, 8, {x: 1, y: 2});  //=> {x: 8, y: 2}
	     */
	    var set = _curry3(function set(lens, v, x) {
	        return over(lens, always(v), x);
	    });
	
	    /**
	     * Returns the elements of the given list or string (or object with a `slice`
	     * method) from `fromIndex` (inclusive) to `toIndex` (exclusive).
	     *
	     * Dispatches to the `slice` method of the third argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.4
	     * @category List
	     * @sig Number -> Number -> [a] -> [a]
	     * @sig Number -> Number -> String -> String
	     * @param {Number} fromIndex The start index (inclusive).
	     * @param {Number} toIndex The end index (exclusive).
	     * @param {*} list
	     * @return {*}
	     * @example
	     *
	     *      R.slice(1, 3, ['a', 'b', 'c', 'd']);        //=> ['b', 'c']
	     *      R.slice(1, Infinity, ['a', 'b', 'c', 'd']); //=> ['b', 'c', 'd']
	     *      R.slice(0, -1, ['a', 'b', 'c', 'd']);       //=> ['a', 'b', 'c']
	     *      R.slice(-3, -1, ['a', 'b', 'c', 'd']);      //=> ['b', 'c']
	     *      R.slice(0, 3, 'ramda');                     //=> 'ram'
	     */
	    var slice = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
	        return Array.prototype.slice.call(list, fromIndex, toIndex);
	    }));
	
	    /**
	     * Returns a copy of the list, sorted according to the comparator function,
	     * which should accept two values at a time and return a negative number if the
	     * first value is smaller, a positive number if it's larger, and zero if they
	     * are equal. Please note that this is a **copy** of the list. It does not
	     * modify the original.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a,a -> Number) -> [a] -> [a]
	     * @param {Function} comparator A sorting function :: a -> b -> Int
	     * @param {Array} list The list to sort
	     * @return {Array} a new array with its elements sorted by the comparator function.
	     * @example
	     *
	     *      var diff = function(a, b) { return a - b; };
	     *      R.sort(diff, [4,2,7,5]); //=> [2, 4, 5, 7]
	     */
	    var sort = _curry2(function sort(comparator, list) {
	        return _slice(list).sort(comparator);
	    });
	
	    /**
	     * Sorts the list according to the supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord b => (a -> b) -> [a] -> [a]
	     * @param {Function} fn
	     * @param {Array} list The list to sort.
	     * @return {Array} A new list sorted by the keys generated by `fn`.
	     * @example
	     *
	     *      var sortByFirstItem = R.sortBy(R.prop(0));
	     *      var sortByNameCaseInsensitive = R.sortBy(R.compose(R.toLower, R.prop('name')));
	     *      var pairs = [[-1, 1], [-2, 2], [-3, 3]];
	     *      sortByFirstItem(pairs); //=> [[-3, 3], [-2, 2], [-1, 1]]
	     *      var alice = {
	     *        name: 'ALICE',
	     *        age: 101
	     *      };
	     *      var bob = {
	     *        name: 'Bob',
	     *        age: -10
	     *      };
	     *      var clara = {
	     *        name: 'clara',
	     *        age: 314.159
	     *      };
	     *      var people = [clara, bob, alice];
	     *      sortByNameCaseInsensitive(people); //=> [alice, bob, clara]
	     */
	    var sortBy = _curry2(function sortBy(fn, list) {
	        return _slice(list).sort(function (a, b) {
	            var aa = fn(a);
	            var bb = fn(b);
	            return aa < bb ? -1 : aa > bb ? 1 : 0;
	        });
	    });
	
	    /**
	     * Splits a given list or string at a given index.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig Number -> [a] -> [[a], [a]]
	     * @sig Number -> String -> [String, String]
	     * @param {Number} index The index where the array/string is split.
	     * @param {Array|String} array The array/string to be split.
	     * @return {Array}
	     * @example
	     *
	     *      R.splitAt(1, [1, 2, 3]);          //=> [[1], [2, 3]]
	     *      R.splitAt(5, 'hello world');      //=> ['hello', ' world']
	     *      R.splitAt(-1, 'foobar');          //=> ['fooba', 'r']
	     */
	    var splitAt = _curry2(function splitAt(index, array) {
	        return [
	            slice(0, index, array),
	            slice(index, length(array), array)
	        ];
	    });
	
	    /**
	     * Splits a collection into slices of the specified length.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig Number -> [a] -> [[a]]
	     * @sig Number -> String -> [String]
	     * @param {Number} n
	     * @param {Array} list
	     * @return {Array}
	     * @example
	     *
	     *      R.splitEvery(3, [1, 2, 3, 4, 5, 6, 7]); //=> [[1, 2, 3], [4, 5, 6], [7]]
	     *      R.splitEvery(3, 'foobarbaz'); //=> ['foo', 'bar', 'baz']
	     */
	    var splitEvery = _curry2(function splitEvery(n, list) {
	        if (n <= 0) {
	            throw new Error('First argument to splitEvery must be a positive integer');
	        }
	        var result = [];
	        var idx = 0;
	        while (idx < list.length) {
	            result.push(slice(idx, idx += n, list));
	        }
	        return result;
	    });
	
	    /**
	     * Takes a list and a predicate and returns a pair of lists with the following properties:
	     *
	     *  - the result of concatenating the two output lists is equivalent to the input list;
	     *  - none of the elements of the first output list satisfies the predicate; and
	     *  - if the second output list is non-empty, its first element satisfies the predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [[a], [a]]
	     * @param {Function} pred The predicate that determines where the array is split.
	     * @param {Array} list The array to be split.
	     * @return {Array}
	     * @example
	     *
	     *      R.splitWhen(R.equals(2), [1, 2, 3, 1, 2, 3]);   //=> [[1], [2, 3, 1, 2, 3]]
	     */
	    var splitWhen = _curry2(function splitWhen(pred, list) {
	        var idx = 0;
	        var len = list.length;
	        var prefix = [];
	        while (idx < len && !pred(list[idx])) {
	            prefix.push(list[idx]);
	            idx += 1;
	        }
	        return [
	            prefix,
	            _slice(list, idx)
	        ];
	    });
	
	    /**
	     * Subtracts its second argument from its first argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The first value.
	     * @param {Number} b The second value.
	     * @return {Number} The result of `a - b`.
	     * @see R.add
	     * @example
	     *
	     *      R.subtract(10, 8); //=> 2
	     *
	     *      var minus5 = R.subtract(R.__, 5);
	     *      minus5(17); //=> 12
	     *
	     *      var complementaryAngle = R.subtract(90);
	     *      complementaryAngle(30); //=> 60
	     *      complementaryAngle(72); //=> 18
	     */
	    var subtract = _curry2(function subtract(a, b) {
	        return Number(a) - Number(b);
	    });
	
	    /**
	     * Returns all but the first element of the given list or string (or object
	     * with a `tail` method).
	     *
	     * Dispatches to the `slice` method of the first argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a]
	     * @sig String -> String
	     * @param {*} list
	     * @return {*}
	     * @see R.head, R.init, R.last
	     * @example
	     *
	     *      R.tail([1, 2, 3]);  //=> [2, 3]
	     *      R.tail([1, 2]);     //=> [2]
	     *      R.tail([1]);        //=> []
	     *      R.tail([]);         //=> []
	     *
	     *      R.tail('abc');  //=> 'bc'
	     *      R.tail('ab');   //=> 'b'
	     *      R.tail('a');    //=> ''
	     *      R.tail('');     //=> ''
	     */
	    var tail = _checkForMethod('tail', slice(1, Infinity));
	
	    /**
	     * Returns the first `n` elements of the given list, string, or
	     * transducer/transformer (or object with a `take` method).
	     *
	     * Dispatches to the `take` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n
	     * @param {*} list
	     * @return {*}
	     * @see R.drop
	     * @example
	     *
	     *      R.take(1, ['foo', 'bar', 'baz']); //=> ['foo']
	     *      R.take(2, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
	     *      R.take(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.take(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.take(3, 'ramda');               //=> 'ram'
	     *
	     *      var personnel = [
	     *        'Dave Brubeck',
	     *        'Paul Desmond',
	     *        'Eugene Wright',
	     *        'Joe Morello',
	     *        'Gerry Mulligan',
	     *        'Bob Bates',
	     *        'Joe Dodge',
	     *        'Ron Crotty'
	     *      ];
	     *
	     *      var takeFive = R.take(5);
	     *      takeFive(personnel);
	     *      //=> ['Dave Brubeck', 'Paul Desmond', 'Eugene Wright', 'Joe Morello', 'Gerry Mulligan']
	     */
	    var take = _curry2(_dispatchable('take', _xtake, function take(n, xs) {
	        return slice(0, n < 0 ? Infinity : n, xs);
	    }));
	
	    /**
	     * Returns a new list containing the last `n` elements of a given list, passing
	     * each value to the supplied predicate function, and terminating when the
	     * predicate function returns `false`. Excludes the element that caused the
	     * predicate function to fail. The predicate function is passed one argument:
	     * *(value)*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.dropLastWhile, R.addIndex
	     * @example
	     *
	     *      var isNotOne = x => x !== 1;
	     *
	     *      R.takeLastWhile(isNotOne, [1, 2, 3, 4]); //=> [2, 3, 4]
	     */
	    var takeLastWhile = _curry2(function takeLastWhile(fn, list) {
	        var idx = list.length - 1;
	        while (idx >= 0 && fn(list[idx])) {
	            idx -= 1;
	        }
	        return _slice(list, idx + 1, Infinity);
	    });
	
	    /**
	     * Returns a new list containing the first `n` elements of a given list,
	     * passing each value to the supplied predicate function, and terminating when
	     * the predicate function returns `false`. Excludes the element that caused the
	     * predicate function to fail. The predicate function is passed one argument:
	     * *(value)*.
	     *
	     * Dispatches to the `takeWhile` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.dropWhile, R.transduce, R.addIndex
	     * @example
	     *
	     *      var isNotFour = x => x !== 4;
	     *
	     *      R.takeWhile(isNotFour, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3]
	     */
	    var takeWhile = _curry2(_dispatchable('takeWhile', _xtakeWhile, function takeWhile(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len && fn(list[idx])) {
	            idx += 1;
	        }
	        return _slice(list, 0, idx);
	    }));
	
	    /**
	     * Runs the given function with the supplied object, then returns the object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a -> *) -> a -> a
	     * @param {Function} fn The function to call with `x`. The return value of `fn` will be thrown away.
	     * @param {*} x
	     * @return {*} `x`.
	     * @example
	     *
	     *      var sayX = x => console.log('x is ' + x);
	     *      R.tap(sayX, 100); //=> 100
	     *      //-> 'x is 100'
	     */
	    var tap = _curry2(function tap(fn, x) {
	        fn(x);
	        return x;
	    });
	
	    /**
	     * Calls an input function `n` times, returning an array containing the results
	     * of those function calls.
	     *
	     * `fn` is passed one argument: The current value of `n`, which begins at `0`
	     * and is gradually incremented to `n - 1`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.3
	     * @category List
	     * @sig (Number -> a) -> Number -> [a]
	     * @param {Function} fn The function to invoke. Passed one argument, the current value of `n`.
	     * @param {Number} n A value between `0` and `n - 1`. Increments after each function call.
	     * @return {Array} An array containing the return values of all calls to `fn`.
	     * @example
	     *
	     *      R.times(R.identity, 5); //=> [0, 1, 2, 3, 4]
	     */
	    var times = _curry2(function times(fn, n) {
	        var len = Number(n);
	        var idx = 0;
	        var list;
	        if (len < 0 || isNaN(len)) {
	            throw new RangeError('n must be a non-negative number');
	        }
	        list = new Array(len);
	        while (idx < len) {
	            list[idx] = fn(idx);
	            idx += 1;
	        }
	        return list;
	    });
	
	    /**
	     * Converts an object into an array of key, value arrays. Only the object's
	     * own properties are used.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.0
	     * @category Object
	     * @sig {String: *} -> [[String,*]]
	     * @param {Object} obj The object to extract from
	     * @return {Array} An array of key, value arrays from the object's own properties.
	     * @see R.fromPairs
	     * @example
	     *
	     *      R.toPairs({a: 1, b: 2, c: 3}); //=> [['a', 1], ['b', 2], ['c', 3]]
	     */
	    var toPairs = _curry1(function toPairs(obj) {
	        var pairs = [];
	        for (var prop in obj) {
	            if (_has(prop, obj)) {
	                pairs[pairs.length] = [
	                    prop,
	                    obj[prop]
	                ];
	            }
	        }
	        return pairs;
	    });
	
	    /**
	     * Converts an object into an array of key, value arrays. The object's own
	     * properties and prototype properties are used. Note that the order of the
	     * output array is not guaranteed to be consistent across different JS
	     * platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.0
	     * @category Object
	     * @sig {String: *} -> [[String,*]]
	     * @param {Object} obj The object to extract from
	     * @return {Array} An array of key, value arrays from the object's own
	     *         and prototype properties.
	     * @example
	     *
	     *      var F = function() { this.x = 'X'; };
	     *      F.prototype.y = 'Y';
	     *      var f = new F();
	     *      R.toPairsIn(f); //=> [['x','X'], ['y','Y']]
	     */
	    var toPairsIn = _curry1(function toPairsIn(obj) {
	        var pairs = [];
	        for (var prop in obj) {
	            pairs[pairs.length] = [
	                prop,
	                obj[prop]
	            ];
	        }
	        return pairs;
	    });
	
	    /**
	     * Transposes the rows and columns of a 2D list.
	     * When passed a list of `n` lists of length `x`,
	     * returns a list of `x` lists of length `n`.
	     *
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig [[a]] -> [[a]]
	     * @param {Array} list A 2D list
	     * @return {Array} A 2D list
	     * @example
	     *
	     *      R.transpose([[1, 'a'], [2, 'b'], [3, 'c']]) //=> [[1, 2, 3], ['a', 'b', 'c']]
	     *      R.transpose([[1, 2, 3], ['a', 'b', 'c']]) //=> [[1, 'a'], [2, 'b'], [3, 'c']]
	     *
	     * If some of the rows are shorter than the following rows, their elements are skipped:
	     *
	     *      R.transpose([[10, 11], [20], [], [30, 31, 32]]) //=> [[10, 20, 30], [11, 31], [32]]
	     */
	    var transpose = _curry1(function transpose(outerlist) {
	        var i = 0;
	        var result = [];
	        while (i < outerlist.length) {
	            var innerlist = outerlist[i];
	            var j = 0;
	            while (j < innerlist.length) {
	                if (typeof result[j] === 'undefined') {
	                    result[j] = [];
	                }
	                result[j].push(innerlist[j]);
	                j += 1;
	            }
	            i += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Removes (strips) whitespace from both ends of the string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category String
	     * @sig String -> String
	     * @param {String} str The string to trim.
	     * @return {String} Trimmed version of `str`.
	     * @example
	     *
	     *      R.trim('   xyz  '); //=> 'xyz'
	     *      R.map(R.trim, R.split(',', 'x, y, z')); //=> ['x', 'y', 'z']
	     */
	    var trim = function () {
	        var ws = '\t\n\x0B\f\r \xA0\u1680\u180E\u2000\u2001\u2002\u2003' + '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' + '\u2029\uFEFF';
	        var zeroWidth = '\u200B';
	        var hasProtoTrim = typeof String.prototype.trim === 'function';
	        if (!hasProtoTrim || (ws.trim() || !zeroWidth.trim())) {
	            return _curry1(function trim(str) {
	                var beginRx = new RegExp('^[' + ws + '][' + ws + ']*');
	                var endRx = new RegExp('[' + ws + '][' + ws + ']*$');
	                return str.replace(beginRx, '').replace(endRx, '');
	            });
	        } else {
	            return _curry1(function trim(str) {
	                return str.trim();
	            });
	        }
	    }();
	
	    /**
	     * `tryCatch` takes two functions, a `tryer` and a `catcher`. The returned
	     * function evaluates the `tryer`; if it does not throw, it simply returns the
	     * result. If the `tryer` *does* throw, the returned function evaluates the
	     * `catcher` function and returns its result. Note that for effective
	     * composition with this function, both the `tryer` and `catcher` functions
	     * must return the same type of results.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Function
	     * @sig (...x -> a) -> ((e, ...x) -> a) -> (...x -> a)
	     * @param {Function} tryer The function that may throw.
	     * @param {Function} catcher The function that will be evaluated if `tryer` throws.
	     * @return {Function} A new function that will catch exceptions and send then to the catcher.
	     * @example
	     *
	     *      R.tryCatch(R.prop('x'), R.F, {x: true}); //=> true
	     *      R.tryCatch(R.prop('x'), R.F, null);      //=> false
	     */
	    var tryCatch = _curry2(function _tryCatch(tryer, catcher) {
	        return _arity(tryer.length, function () {
	            try {
	                return tryer.apply(this, arguments);
	            } catch (e) {
	                return catcher.apply(this, _concat([e], arguments));
	            }
	        });
	    });
	
	    /**
	     * Gives a single-word string description of the (native) type of a value,
	     * returning such answers as 'Object', 'Number', 'Array', or 'Null'. Does not
	     * attempt to distinguish user Object types any further, reporting them all as
	     * 'Object'.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Type
	     * @sig (* -> {*}) -> String
	     * @param {*} val The value to test
	     * @return {String}
	     * @example
	     *
	     *      R.type({}); //=> "Object"
	     *      R.type(1); //=> "Number"
	     *      R.type(false); //=> "Boolean"
	     *      R.type('s'); //=> "String"
	     *      R.type(null); //=> "Null"
	     *      R.type([]); //=> "Array"
	     *      R.type(/[A-z]/); //=> "RegExp"
	     */
	    var type = _curry1(function type(val) {
	        return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
	    });
	
	    /**
	     * Takes a function `fn`, which takes a single array argument, and returns a
	     * function which:
	     *
	     *   - takes any number of positional arguments;
	     *   - passes these arguments to `fn` as an array; and
	     *   - returns the result.
	     *
	     * In other words, R.unapply derives a variadic function from a function which
	     * takes an array. R.unapply is the inverse of R.apply.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Function
	     * @sig ([*...] -> a) -> (*... -> a)
	     * @param {Function} fn
	     * @return {Function}
	     * @see R.apply
	     * @example
	     *
	     *      R.unapply(JSON.stringify)(1, 2, 3); //=> '[1,2,3]'
	     */
	    var unapply = _curry1(function unapply(fn) {
	        return function () {
	            return fn(_slice(arguments));
	        };
	    });
	
	    /**
	     * Wraps a function of any arity (including nullary) in a function that accepts
	     * exactly 1 parameter. Any extraneous parameters will not be passed to the
	     * supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Function
	     * @sig (* -> b) -> (a -> b)
	     * @param {Function} fn The function to wrap.
	     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	     *         arity 1.
	     * @example
	     *
	     *      var takesTwoArgs = function(a, b) {
	     *        return [a, b];
	     *      };
	     *      takesTwoArgs.length; //=> 2
	     *      takesTwoArgs(1, 2); //=> [1, 2]
	     *
	     *      var takesOneArg = R.unary(takesTwoArgs);
	     *      takesOneArg.length; //=> 1
	     *      // Only 1 argument is passed to the wrapped function
	     *      takesOneArg(1, 2); //=> [1, undefined]
	     */
	    var unary = _curry1(function unary(fn) {
	        return nAry(1, fn);
	    });
	
	    /**
	     * Returns a function of arity `n` from a (manually) curried function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Function
	     * @sig Number -> (a -> b) -> (a -> c)
	     * @param {Number} length The arity for the returned function.
	     * @param {Function} fn The function to uncurry.
	     * @return {Function} A new function.
	     * @see R.curry
	     * @example
	     *
	     *      var addFour = a => b => c => d => a + b + c + d;
	     *
	     *      var uncurriedAddFour = R.uncurryN(4, addFour);
	     *      uncurriedAddFour(1, 2, 3, 4); //=> 10
	     */
	    var uncurryN = _curry2(function uncurryN(depth, fn) {
	        return curryN(depth, function () {
	            var currentDepth = 1;
	            var value = fn;
	            var idx = 0;
	            var endIdx;
	            while (currentDepth <= depth && typeof value === 'function') {
	                endIdx = currentDepth === depth ? arguments.length : idx + value.length;
	                value = value.apply(this, _slice(arguments, idx, endIdx));
	                currentDepth += 1;
	                idx = endIdx;
	            }
	            return value;
	        });
	    });
	
	    /**
	     * Builds a list from a seed value. Accepts an iterator function, which returns
	     * either false to stop iteration or an array of length 2 containing the value
	     * to add to the resulting list and the seed to be used in the next call to the
	     * iterator function.
	     *
	     * The iterator function receives one argument: *(seed)*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (a -> [b]) -> * -> [b]
	     * @param {Function} fn The iterator function. receives one argument, `seed`, and returns
	     *        either false to quit iteration or an array of length two to proceed. The element
	     *        at index 0 of this array will be added to the resulting array, and the element
	     *        at index 1 will be passed to the next call to `fn`.
	     * @param {*} seed The seed value.
	     * @return {Array} The final list.
	     * @example
	     *
	     *      var f = n => n > 50 ? false : [-n, n + 10];
	     *      R.unfold(f, 10); //=> [-10, -20, -30, -40, -50]
	     */
	    var unfold = _curry2(function unfold(fn, seed) {
	        var pair = fn(seed);
	        var result = [];
	        while (pair && pair.length) {
	            result[result.length] = pair[0];
	            pair = fn(pair[1]);
	        }
	        return result;
	    });
	
	    /**
	     * Returns a new list containing only one copy of each element in the original
	     * list, based upon the value returned by applying the supplied predicate to
	     * two list elements. Prefers the first item if two items compare equal based
	     * on the predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category List
	     * @sig (a, a -> Boolean) -> [a] -> [a]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of unique items.
	     * @example
	     *
	     *      var strEq = R.eqBy(String);
	     *      R.uniqWith(strEq)([1, '1', 2, 1]); //=> [1, 2]
	     *      R.uniqWith(strEq)([{}, {}]);       //=> [{}]
	     *      R.uniqWith(strEq)([1, '1', 1]);    //=> [1]
	     *      R.uniqWith(strEq)(['1', 1, 1]);    //=> ['1']
	     */
	    var uniqWith = _curry2(function uniqWith(pred, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [];
	        var item;
	        while (idx < len) {
	            item = list[idx];
	            if (!_containsWith(pred, item, result)) {
	                result[result.length] = item;
	            }
	            idx += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Tests the final argument by passing it to the given predicate function. If
	     * the predicate is not satisfied, the function will return the result of
	     * calling the `whenFalseFn` function with the same argument. If the predicate
	     * is satisfied, the argument is returned as is.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Logic
	     * @sig (a -> Boolean) -> (a -> a) -> a -> a
	     * @param {Function} pred        A predicate function
	     * @param {Function} whenFalseFn A function to invoke when the `pred` evaluates
	     *                               to a falsy value.
	     * @param {*}        x           An object to test with the `pred` function and
	     *                               pass to `whenFalseFn` if necessary.
	     * @return {*} Either `x` or the result of applying `x` to `whenFalseFn`.
	     * @see R.ifElse, R.when
	     * @example
	     *
	     *      // coerceArray :: (a|[a]) -> [a]
	     *      var coerceArray = R.unless(R.isArrayLike, R.of);
	     *      coerceArray([1, 2, 3]); //=> [1, 2, 3]
	     *      coerceArray(1);         //=> [1]
	     */
	    var unless = _curry3(function unless(pred, whenFalseFn, x) {
	        return pred(x) ? x : whenFalseFn(x);
	    });
	
	    /**
	     * Takes a predicate, a transformation function, and an initial value,
	     * and returns a value of the same type as the initial value.
	     * It does so by applying the transformation until the predicate is satisfied,
	     * at which point it returns the satisfactory value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Logic
	     * @sig (a -> Boolean) -> (a -> a) -> a -> a
	     * @param {Function} pred A predicate function
	     * @param {Function} fn The iterator function
	     * @param {*} init Initial value
	     * @return {*} Final value that satisfies predicate
	     * @example
	     *
	     *      R.until(R.gt(R.__, 100), R.multiply(2))(1) // => 128
	     */
	    var until = _curry3(function until(pred, fn, init) {
	        var val = init;
	        while (!pred(val)) {
	            val = fn(val);
	        }
	        return val;
	    });
	
	    /**
	     * Returns a new copy of the array with the element at the provided index
	     * replaced with the given value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig Number -> a -> [a] -> [a]
	     * @param {Number} idx The index to update.
	     * @param {*} x The value to exist at the given index of the returned array.
	     * @param {Array|Arguments} list The source array-like object to be updated.
	     * @return {Array} A copy of `list` with the value at index `idx` replaced with `x`.
	     * @see R.adjust
	     * @example
	     *
	     *      R.update(1, 11, [0, 1, 2]);     //=> [0, 11, 2]
	     *      R.update(1)(11)([0, 1, 2]);     //=> [0, 11, 2]
	     */
	    var update = _curry3(function update(idx, x, list) {
	        return adjust(always(x), idx, list);
	    });
	
	    /**
	     * Accepts a function `fn` and a list of transformer functions and returns a
	     * new curried function. When the new function is invoked, it calls the
	     * function `fn` with parameters consisting of the result of calling each
	     * supplied handler on successive arguments to the new function.
	     *
	     * If more arguments are passed to the returned function than transformer
	     * functions, those arguments are passed directly to `fn` as additional
	     * parameters. If you expect additional arguments that don't need to be
	     * transformed, although you can ignore them, it's best to pass an identity
	     * function so that the new function reports the correct arity.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (x1 -> x2 -> ... -> z) -> [(a -> x1), (b -> x2), ...] -> (a -> b -> ... -> z)
	     * @param {Function} fn The function to wrap.
	     * @param {Array} transformers A list of transformer functions
	     * @return {Function} The wrapped function.
	     * @example
	     *
	     *      R.useWith(Math.pow, [R.identity, R.identity])(3, 4); //=> 81
	     *      R.useWith(Math.pow, [R.identity, R.identity])(3)(4); //=> 81
	     *      R.useWith(Math.pow, [R.dec, R.inc])(3, 4); //=> 32
	     *      R.useWith(Math.pow, [R.dec, R.inc])(3)(4); //=> 32
	     */
	    var useWith = _curry2(function useWith(fn, transformers) {
	        return curryN(transformers.length, function () {
	            var args = [];
	            var idx = 0;
	            while (idx < transformers.length) {
	                args.push(transformers[idx].call(this, arguments[idx]));
	                idx += 1;
	            }
	            return fn.apply(this, args.concat(_slice(arguments, transformers.length)));
	        });
	    });
	
	    /**
	     * Returns a list of all the enumerable own properties of the supplied object.
	     * Note that the order of the output array is not guaranteed across different
	     * JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {k: v} -> [v]
	     * @param {Object} obj The object to extract values from
	     * @return {Array} An array of the values of the object's own properties.
	     * @example
	     *
	     *      R.values({a: 1, b: 2, c: 3}); //=> [1, 2, 3]
	     */
	    var values = _curry1(function values(obj) {
	        var props = keys(obj);
	        var len = props.length;
	        var vals = [];
	        var idx = 0;
	        while (idx < len) {
	            vals[idx] = obj[props[idx]];
	            idx += 1;
	        }
	        return vals;
	    });
	
	    /**
	     * Returns a list of all the properties, including prototype properties, of the
	     * supplied object.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Object
	     * @sig {k: v} -> [v]
	     * @param {Object} obj The object to extract values from
	     * @return {Array} An array of the values of the object's own and prototype properties.
	     * @example
	     *
	     *      var F = function() { this.x = 'X'; };
	     *      F.prototype.y = 'Y';
	     *      var f = new F();
	     *      R.valuesIn(f); //=> ['X', 'Y']
	     */
	    var valuesIn = _curry1(function valuesIn(obj) {
	        var prop;
	        var vs = [];
	        for (prop in obj) {
	            vs[vs.length] = obj[prop];
	        }
	        return vs;
	    });
	
	    /**
	     * Returns a "view" of the given data structure, determined by the given lens.
	     * The lens's focus determines which portion of the data structure is visible.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Lens s a -> s -> a
	     * @param {Lens} lens
	     * @param {*} x
	     * @return {*}
	     * @see R.prop, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var xLens = R.lensProp('x');
	     *
	     *      R.view(xLens, {x: 1, y: 2});  //=> 1
	     *      R.view(xLens, {x: 4, y: 2});  //=> 4
	     */
	    // `Const` is a functor that effectively ignores the function given to `map`.
	    // Using `Const` effectively ignores the setter function of the `lens`,
	    // leaving the value returned by the getter function unmodified.
	    var view = function () {
	        // `Const` is a functor that effectively ignores the function given to `map`.
	        var Const = function (x) {
	            return {
	                value: x,
	                map: function () {
	                    return this;
	                }
	            };
	        };
	        return _curry2(function view(lens, x) {
	            // Using `Const` effectively ignores the setter function of the `lens`,
	            // leaving the value returned by the getter function unmodified.
	            return lens(Const)(x).value;
	        });
	    }();
	
	    /**
	     * Tests the final argument by passing it to the given predicate function. If
	     * the predicate is satisfied, the function will return the result of calling
	     * the `whenTrueFn` function with the same argument. If the predicate is not
	     * satisfied, the argument is returned as is.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Logic
	     * @sig (a -> Boolean) -> (a -> a) -> a -> a
	     * @param {Function} pred       A predicate function
	     * @param {Function} whenTrueFn A function to invoke when the `condition`
	     *                              evaluates to a truthy value.
	     * @param {*}        x          An object to test with the `pred` function and
	     *                              pass to `whenTrueFn` if necessary.
	     * @return {*} Either `x` or the result of applying `x` to `whenTrueFn`.
	     * @see R.ifElse, R.unless
	     * @example
	     *
	     *      // truncate :: String -> String
	     *      var truncate = R.when(
	     *        R.propSatisfies(R.gt(R.__, 10), 'length'),
	     *        R.pipe(R.take(10), R.append('…'), R.join(''))
	     *      );
	     *      truncate('12345');         //=> '12345'
	     *      truncate('0123456789ABC'); //=> '0123456789…'
	     */
	    var when = _curry3(function when(pred, whenTrueFn, x) {
	        return pred(x) ? whenTrueFn(x) : x;
	    });
	
	    /**
	     * Takes a spec object and a test object; returns true if the test satisfies
	     * the spec. Each of the spec's own properties must be a predicate function.
	     * Each predicate is applied to the value of the corresponding property of the
	     * test object. `where` returns true if all the predicates return true, false
	     * otherwise.
	     *
	     * `where` is well suited to declaratively expressing constraints for other
	     * functions such as `filter` and `find`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category Object
	     * @sig {String: (* -> Boolean)} -> {String: *} -> Boolean
	     * @param {Object} spec
	     * @param {Object} testObj
	     * @return {Boolean}
	     * @example
	     *
	     *      // pred :: Object -> Boolean
	     *      var pred = R.where({
	     *        a: R.equals('foo'),
	     *        b: R.complement(R.equals('bar')),
	     *        x: R.gt(_, 10),
	     *        y: R.lt(_, 20)
	     *      });
	     *
	     *      pred({a: 'foo', b: 'xxx', x: 11, y: 19}); //=> true
	     *      pred({a: 'xxx', b: 'xxx', x: 11, y: 19}); //=> false
	     *      pred({a: 'foo', b: 'bar', x: 11, y: 19}); //=> false
	     *      pred({a: 'foo', b: 'xxx', x: 10, y: 19}); //=> false
	     *      pred({a: 'foo', b: 'xxx', x: 11, y: 20}); //=> false
	     */
	    var where = _curry2(function where(spec, testObj) {
	        for (var prop in spec) {
	            if (_has(prop, spec) && !spec[prop](testObj[prop])) {
	                return false;
	            }
	        }
	        return true;
	    });
	
	    /**
	     * Wrap a function inside another to allow you to make adjustments to the
	     * parameters, or do other processing either before the internal function is
	     * called or with its results.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a... -> b) -> ((a... -> b) -> a... -> c) -> (a... -> c)
	     * @param {Function} fn The function to wrap.
	     * @param {Function} wrapper The wrapper function.
	     * @return {Function} The wrapped function.
	     * @example
	     *
	     *      var greet = name => 'Hello ' + name;
	     *
	     *      var shoutedGreet = R.wrap(greet, (gr, name) => gr(name).toUpperCase());
	     *
	     *      shoutedGreet("Kathy"); //=> "HELLO KATHY"
	     *
	     *      var shortenedGreet = R.wrap(greet, function(gr, name) {
	     *        return gr(name.substring(0, 3));
	     *      });
	     *      shortenedGreet("Robert"); //=> "Hello Rob"
	     */
	    var wrap = _curry2(function wrap(fn, wrapper) {
	        return curryN(fn.length, function () {
	            return wrapper.apply(this, _concat([fn], arguments));
	        });
	    });
	
	    /**
	     * Creates a new list out of the two supplied by creating each possible pair
	     * from the lists.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [b] -> [[a,b]]
	     * @param {Array} as The first list.
	     * @param {Array} bs The second list.
	     * @return {Array} The list made by combining each possible pair from
	     *         `as` and `bs` into pairs (`[a, b]`).
	     * @example
	     *
	     *      R.xprod([1, 2], ['a', 'b']); //=> [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
	     */
	    // = xprodWith(prepend); (takes about 3 times as long...)
	    var xprod = _curry2(function xprod(a, b) {
	        // = xprodWith(prepend); (takes about 3 times as long...)
	        var idx = 0;
	        var ilen = a.length;
	        var j;
	        var jlen = b.length;
	        var result = [];
	        while (idx < ilen) {
	            j = 0;
	            while (j < jlen) {
	                result[result.length] = [
	                    a[idx],
	                    b[j]
	                ];
	                j += 1;
	            }
	            idx += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Creates a new list out of the two supplied by pairing up equally-positioned
	     * items from both lists. The returned list is truncated to the length of the
	     * shorter of the two input lists.
	     * Note: `zip` is equivalent to `zipWith(function(a, b) { return [a, b] })`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [b] -> [[a,b]]
	     * @param {Array} list1 The first array to consider.
	     * @param {Array} list2 The second array to consider.
	     * @return {Array} The list made by pairing up same-indexed elements of `list1` and `list2`.
	     * @example
	     *
	     *      R.zip([1, 2, 3], ['a', 'b', 'c']); //=> [[1, 'a'], [2, 'b'], [3, 'c']]
	     */
	    var zip = _curry2(function zip(a, b) {
	        var rv = [];
	        var idx = 0;
	        var len = Math.min(a.length, b.length);
	        while (idx < len) {
	            rv[idx] = [
	                a[idx],
	                b[idx]
	            ];
	            idx += 1;
	        }
	        return rv;
	    });
	
	    /**
	     * Creates a new object out of a list of keys and a list of values.
	     * Key/value pairing is truncated to the length of the shorter of the two lists.
	     * Note: `zipObj` is equivalent to `pipe(zipWith(pair), fromPairs)`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig [String] -> [*] -> {String: *}
	     * @param {Array} keys The array that will be properties on the output object.
	     * @param {Array} values The list of values on the output object.
	     * @return {Object} The object made by pairing up same-indexed elements of `keys` and `values`.
	     * @example
	     *
	     *      R.zipObj(['a', 'b', 'c'], [1, 2, 3]); //=> {a: 1, b: 2, c: 3}
	     */
	    var zipObj = _curry2(function zipObj(keys, values) {
	        var idx = 0;
	        var len = Math.min(keys.length, values.length);
	        var out = {};
	        while (idx < len) {
	            out[keys[idx]] = values[idx];
	            idx += 1;
	        }
	        return out;
	    });
	
	    /**
	     * Creates a new list out of the two supplied by applying the function to each
	     * equally-positioned pair in the lists. The returned list is truncated to the
	     * length of the shorter of the two input lists.
	     *
	     * @function
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a,b -> c) -> [a] -> [b] -> [c]
	     * @param {Function} fn The function used to combine the two elements into one value.
	     * @param {Array} list1 The first array to consider.
	     * @param {Array} list2 The second array to consider.
	     * @return {Array} The list made by combining same-indexed elements of `list1` and `list2`
	     *         using `fn`.
	     * @example
	     *
	     *      var f = (x, y) => {
	     *        // ...
	     *      };
	     *      R.zipWith(f, [1, 2, 3], ['a', 'b', 'c']);
	     *      //=> [f(1, 'a'), f(2, 'b'), f(3, 'c')]
	     */
	    var zipWith = _curry3(function zipWith(fn, a, b) {
	        var rv = [];
	        var idx = 0;
	        var len = Math.min(a.length, b.length);
	        while (idx < len) {
	            rv[idx] = fn(a[idx], b[idx]);
	            idx += 1;
	        }
	        return rv;
	    });
	
	    /**
	     * A function that always returns `false`. Any passed in parameters are ignored.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig * -> Boolean
	     * @param {*}
	     * @return {Boolean}
	     * @see R.always, R.T
	     * @example
	     *
	     *      R.F(); //=> false
	     */
	    var F = always(false);
	
	    /**
	     * A function that always returns `true`. Any passed in parameters are ignored.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig * -> Boolean
	     * @param {*}
	     * @return {Boolean}
	     * @see R.always, R.F
	     * @example
	     *
	     *      R.T(); //=> true
	     */
	    var T = always(true);
	
	    /**
	     * Copies an object.
	     *
	     * @private
	     * @param {*} value The value to be copied
	     * @param {Array} refFrom Array containing the source references
	     * @param {Array} refTo Array containing the copied source references
	     * @param {Boolean} deep Whether or not to perform deep cloning.
	     * @return {*} The copied value.
	     */
	    var _clone = function _clone(value, refFrom, refTo, deep) {
	        var copy = function copy(copiedValue) {
	            var len = refFrom.length;
	            var idx = 0;
	            while (idx < len) {
	                if (value === refFrom[idx]) {
	                    return refTo[idx];
	                }
	                idx += 1;
	            }
	            refFrom[idx + 1] = value;
	            refTo[idx + 1] = copiedValue;
	            for (var key in value) {
	                copiedValue[key] = deep ? _clone(value[key], refFrom, refTo, true) : value[key];
	            }
	            return copiedValue;
	        };
	        switch (type(value)) {
	        case 'Object':
	            return copy({});
	        case 'Array':
	            return copy([]);
	        case 'Date':
	            return new Date(value.valueOf());
	        case 'RegExp':
	            return _cloneRegExp(value);
	        default:
	            return value;
	        }
	    };
	
	    var _createPartialApplicator = function _createPartialApplicator(concat) {
	        return _curry2(function (fn, args) {
	            return _arity(Math.max(0, fn.length - args.length), function () {
	                return fn.apply(this, concat(args, arguments));
	            });
	        });
	    };
	
	    var _dropLast = function dropLast(n, xs) {
	        return take(n < xs.length ? xs.length - n : 0, xs);
	    };
	
	    // Values of other types are only equal if identical.
	    var _equals = function _equals(a, b, stackA, stackB) {
	        if (identical(a, b)) {
	            return true;
	        }
	        if (type(a) !== type(b)) {
	            return false;
	        }
	        if (a == null || b == null) {
	            return false;
	        }
	        if (typeof a.equals === 'function' || typeof b.equals === 'function') {
	            return typeof a.equals === 'function' && a.equals(b) && typeof b.equals === 'function' && b.equals(a);
	        }
	        switch (type(a)) {
	        case 'Arguments':
	        case 'Array':
	        case 'Object':
	            if (typeof a.constructor === 'function' && _functionName(a.constructor) === 'Promise') {
	                return a === b;
	            }
	            break;
	        case 'Boolean':
	        case 'Number':
	        case 'String':
	            if (!(typeof a === typeof b && identical(a.valueOf(), b.valueOf()))) {
	                return false;
	            }
	            break;
	        case 'Date':
	            if (!identical(a.valueOf(), b.valueOf())) {
	                return false;
	            }
	            break;
	        case 'Error':
	            return a.name === b.name && a.message === b.message;
	        case 'RegExp':
	            if (!(a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode)) {
	                return false;
	            }
	            break;
	        case 'Map':
	        case 'Set':
	            if (!_equals(_arrayFromIterator(a.entries()), _arrayFromIterator(b.entries()), stackA, stackB)) {
	                return false;
	            }
	            break;
	        case 'Int8Array':
	        case 'Uint8Array':
	        case 'Uint8ClampedArray':
	        case 'Int16Array':
	        case 'Uint16Array':
	        case 'Int32Array':
	        case 'Uint32Array':
	        case 'Float32Array':
	        case 'Float64Array':
	            break;
	        case 'ArrayBuffer':
	            break;
	        default:
	            // Values of other types are only equal if identical.
	            return false;
	        }
	        var keysA = keys(a);
	        if (keysA.length !== keys(b).length) {
	            return false;
	        }
	        var idx = stackA.length - 1;
	        while (idx >= 0) {
	            if (stackA[idx] === a) {
	                return stackB[idx] === b;
	            }
	            idx -= 1;
	        }
	        stackA.push(a);
	        stackB.push(b);
	        idx = keysA.length - 1;
	        while (idx >= 0) {
	            var key = keysA[idx];
	            if (!(_has(key, b) && _equals(b[key], a[key], stackA, stackB))) {
	                return false;
	            }
	            idx -= 1;
	        }
	        stackA.pop();
	        stackB.pop();
	        return true;
	    };
	
	    /**
	     * `_makeFlat` is a helper function that returns a one-level or fully recursive
	     * function based on the flag passed in.
	     *
	     * @private
	     */
	    var _makeFlat = function _makeFlat(recursive) {
	        return function flatt(list) {
	            var value, jlen, j;
	            var result = [];
	            var idx = 0;
	            var ilen = list.length;
	            while (idx < ilen) {
	                if (isArrayLike(list[idx])) {
	                    value = recursive ? flatt(list[idx]) : list[idx];
	                    j = 0;
	                    jlen = value.length;
	                    while (j < jlen) {
	                        result[result.length] = value[j];
	                        j += 1;
	                    }
	                } else {
	                    result[result.length] = list[idx];
	                }
	                idx += 1;
	            }
	            return result;
	        };
	    };
	
	    var _reduce = function () {
	        function _arrayReduce(xf, acc, list) {
	            var idx = 0;
	            var len = list.length;
	            while (idx < len) {
	                acc = xf['@@transducer/step'](acc, list[idx]);
	                if (acc && acc['@@transducer/reduced']) {
	                    acc = acc['@@transducer/value'];
	                    break;
	                }
	                idx += 1;
	            }
	            return xf['@@transducer/result'](acc);
	        }
	        function _iterableReduce(xf, acc, iter) {
	            var step = iter.next();
	            while (!step.done) {
	                acc = xf['@@transducer/step'](acc, step.value);
	                if (acc && acc['@@transducer/reduced']) {
	                    acc = acc['@@transducer/value'];
	                    break;
	                }
	                step = iter.next();
	            }
	            return xf['@@transducer/result'](acc);
	        }
	        function _methodReduce(xf, acc, obj) {
	            return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
	        }
	        var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
	        return function _reduce(fn, acc, list) {
	            if (typeof fn === 'function') {
	                fn = _xwrap(fn);
	            }
	            if (isArrayLike(list)) {
	                return _arrayReduce(fn, acc, list);
	            }
	            if (typeof list.reduce === 'function') {
	                return _methodReduce(fn, acc, list);
	            }
	            if (list[symIterator] != null) {
	                return _iterableReduce(fn, acc, list[symIterator]());
	            }
	            if (typeof list.next === 'function') {
	                return _iterableReduce(fn, acc, list);
	            }
	            throw new TypeError('reduce: list must be array or iterable');
	        };
	    }();
	
	    var _stepCat = function () {
	        var _stepCatArray = {
	            '@@transducer/init': Array,
	            '@@transducer/step': function (xs, x) {
	                xs.push(x);
	                return xs;
	            },
	            '@@transducer/result': _identity
	        };
	        var _stepCatString = {
	            '@@transducer/init': String,
	            '@@transducer/step': function (a, b) {
	                return a + b;
	            },
	            '@@transducer/result': _identity
	        };
	        var _stepCatObject = {
	            '@@transducer/init': Object,
	            '@@transducer/step': function (result, input) {
	                return _assign(result, isArrayLike(input) ? objOf(input[0], input[1]) : input);
	            },
	            '@@transducer/result': _identity
	        };
	        return function _stepCat(obj) {
	            if (_isTransformer(obj)) {
	                return obj;
	            }
	            if (isArrayLike(obj)) {
	                return _stepCatArray;
	            }
	            if (typeof obj === 'string') {
	                return _stepCatString;
	            }
	            if (typeof obj === 'object') {
	                return _stepCatObject;
	            }
	            throw new Error('Cannot create transformer for ' + obj);
	        };
	    }();
	
	    var _xdropLastWhile = function () {
	        function XDropLastWhile(fn, xf) {
	            this.f = fn;
	            this.retained = [];
	            this.xf = xf;
	        }
	        XDropLastWhile.prototype['@@transducer/init'] = _xfBase.init;
	        XDropLastWhile.prototype['@@transducer/result'] = function (result) {
	            this.retained = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XDropLastWhile.prototype['@@transducer/step'] = function (result, input) {
	            return this.f(input) ? this.retain(result, input) : this.flush(result, input);
	        };
	        XDropLastWhile.prototype.flush = function (result, input) {
	            result = _reduce(this.xf['@@transducer/step'], result, this.retained);
	            this.retained = [];
	            return this.xf['@@transducer/step'](result, input);
	        };
	        XDropLastWhile.prototype.retain = function (result, input) {
	            this.retained.push(input);
	            return result;
	        };
	        return _curry2(function _xdropLastWhile(fn, xf) {
	            return new XDropLastWhile(fn, xf);
	        });
	    }();
	
	    var _xgroupBy = function () {
	        function XGroupBy(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.inputs = {};
	        }
	        XGroupBy.prototype['@@transducer/init'] = _xfBase.init;
	        XGroupBy.prototype['@@transducer/result'] = function (result) {
	            var key;
	            for (key in this.inputs) {
	                if (_has(key, this.inputs)) {
	                    result = this.xf['@@transducer/step'](result, this.inputs[key]);
	                    if (result['@@transducer/reduced']) {
	                        result = result['@@transducer/value'];
	                        break;
	                    }
	                }
	            }
	            this.inputs = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XGroupBy.prototype['@@transducer/step'] = function (result, input) {
	            var key = this.f(input);
	            this.inputs[key] = this.inputs[key] || [
	                key,
	                []
	            ];
	            this.inputs[key][1] = append(input, this.inputs[key][1]);
	            return result;
	        };
	        return _curry2(function _xgroupBy(f, xf) {
	            return new XGroupBy(f, xf);
	        });
	    }();
	
	    /**
	     * Creates a new list iteration function from an existing one by adding two new
	     * parameters to its callback function: the current index, and the entire list.
	     *
	     * This would turn, for instance, Ramda's simple `map` function into one that
	     * more closely resembles `Array.prototype.map`. Note that this will only work
	     * for functions in which the iteration callback function is the first
	     * parameter, and where the list is the last parameter. (This latter might be
	     * unimportant if the list parameter is not used.)
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category Function
	     * @category List
	     * @sig ((a ... -> b) ... -> [a] -> *) -> (a ..., Int, [a] -> b) ... -> [a] -> *)
	     * @param {Function} fn A list iteration function that does not pass index or list to its callback
	     * @return {Function} An altered list iteration function that passes (item, index, list) to its callback
	     * @example
	     *
	     *      var mapIndexed = R.addIndex(R.map);
	     *      mapIndexed((val, idx) => idx + '-' + val, ['f', 'o', 'o', 'b', 'a', 'r']);
	     *      //=> ['0-f', '1-o', '2-o', '3-b', '4-a', '5-r']
	     */
	    var addIndex = _curry1(function addIndex(fn) {
	        return curryN(fn.length, function () {
	            var idx = 0;
	            var origFn = arguments[0];
	            var list = arguments[arguments.length - 1];
	            var args = _slice(arguments);
	            args[0] = function () {
	                var result = origFn.apply(this, _concat(arguments, [
	                    idx,
	                    list
	                ]));
	                idx += 1;
	                return result;
	            };
	            return fn.apply(this, args);
	        });
	    });
	
	    /**
	     * Wraps a function of any arity (including nullary) in a function that accepts
	     * exactly 2 parameters. Any extraneous parameters will not be passed to the
	     * supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Function
	     * @sig (* -> c) -> (a, b -> c)
	     * @param {Function} fn The function to wrap.
	     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	     *         arity 2.
	     * @example
	     *
	     *      var takesThreeArgs = function(a, b, c) {
	     *        return [a, b, c];
	     *      };
	     *      takesThreeArgs.length; //=> 3
	     *      takesThreeArgs(1, 2, 3); //=> [1, 2, 3]
	     *
	     *      var takesTwoArgs = R.binary(takesThreeArgs);
	     *      takesTwoArgs.length; //=> 2
	     *      // Only 2 arguments are passed to the wrapped function
	     *      takesTwoArgs(1, 2, 3); //=> [1, 2, undefined]
	     */
	    var binary = _curry1(function binary(fn) {
	        return nAry(2, fn);
	    });
	
	    /**
	     * Creates a deep copy of the value which may contain (nested) `Array`s and
	     * `Object`s, `Number`s, `String`s, `Boolean`s and `Date`s. `Function`s are not
	     * copied, but assigned by their reference.
	     *
	     * Dispatches to a `clone` method if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {*} -> {*}
	     * @param {*} value The object or array to clone
	     * @return {*} A new object or array.
	     * @example
	     *
	     *      var objects = [{}, {}, {}];
	     *      var objectsClone = R.clone(objects);
	     *      objects[0] === objectsClone[0]; //=> false
	     */
	    var clone = _curry1(function clone(value) {
	        return value != null && typeof value.clone === 'function' ? value.clone() : _clone(value, [], [], true);
	    });
	
	    /**
	     * Returns a curried equivalent of the provided function. The curried function
	     * has two unusual capabilities. First, its arguments needn't be provided one
	     * at a time. If `f` is a ternary function and `g` is `R.curry(f)`, the
	     * following are equivalent:
	     *
	     *   - `g(1)(2)(3)`
	     *   - `g(1)(2, 3)`
	     *   - `g(1, 2)(3)`
	     *   - `g(1, 2, 3)`
	     *
	     * Secondly, the special placeholder value `R.__` may be used to specify
	     * "gaps", allowing partial application of any combination of arguments,
	     * regardless of their positions. If `g` is as above and `_` is `R.__`, the
	     * following are equivalent:
	     *
	     *   - `g(1, 2, 3)`
	     *   - `g(_, 2, 3)(1)`
	     *   - `g(_, _, 3)(1)(2)`
	     *   - `g(_, _, 3)(1, 2)`
	     *   - `g(_, 2)(1)(3)`
	     *   - `g(_, 2)(1, 3)`
	     *   - `g(_, 2)(_, 3)(1)`
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (* -> a) -> (* -> a)
	     * @param {Function} fn The function to curry.
	     * @return {Function} A new, curried function.
	     * @see R.curryN
	     * @example
	     *
	     *      var addFourNumbers = (a, b, c, d) => a + b + c + d;
	     *
	     *      var curriedAddFourNumbers = R.curry(addFourNumbers);
	     *      var f = curriedAddFourNumbers(1, 2);
	     *      var g = f(3);
	     *      g(4); //=> 10
	     */
	    var curry = _curry1(function curry(fn) {
	        return curryN(fn.length, fn);
	    });
	
	    /**
	     * Returns all but the first `n` elements of the given list, string, or
	     * transducer/transformer (or object with a `drop` method).
	     *
	     * Dispatches to the `drop` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n
	     * @param {*} list
	     * @return {*}
	     * @see R.take, R.transduce
	     * @example
	     *
	     *      R.drop(1, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
	     *      R.drop(2, ['foo', 'bar', 'baz']); //=> ['baz']
	     *      R.drop(3, ['foo', 'bar', 'baz']); //=> []
	     *      R.drop(4, ['foo', 'bar', 'baz']); //=> []
	     *      R.drop(3, 'ramda');               //=> 'da'
	     */
	    var drop = _curry2(_dispatchable('drop', _xdrop, function drop(n, xs) {
	        return slice(Math.max(0, n), Infinity, xs);
	    }));
	
	    /**
	     * Returns a list containing all but the last `n` elements of the given `list`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n The number of elements of `xs` to skip.
	     * @param {Array} xs The collection to consider.
	     * @return {Array}
	     * @see R.takeLast
	     * @example
	     *
	     *      R.dropLast(1, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
	     *      R.dropLast(2, ['foo', 'bar', 'baz']); //=> ['foo']
	     *      R.dropLast(3, ['foo', 'bar', 'baz']); //=> []
	     *      R.dropLast(4, ['foo', 'bar', 'baz']); //=> []
	     *      R.dropLast(3, 'ramda');               //=> 'ra'
	     */
	    var dropLast = _curry2(_dispatchable('dropLast', _xdropLast, _dropLast));
	
	    /**
	     * Returns a new list containing all but last the`n` elements of a given list,
	     * passing each value from the right to the supplied predicate function,
	     * skipping elements while the predicate function returns `true`. The predicate
	     * function is passed one argument: (value)*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.takeLastWhile, R.addIndex
	     * @example
	     *
	     *      var lteThree = x => x <= 3;
	     *
	     *      R.dropLastWhile(lteThree, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3, 4]
	     */
	    var dropLastWhile = _curry2(_dispatchable('dropLastWhile', _xdropLastWhile, _dropLastWhile));
	
	    /**
	     * Returns `true` if its arguments are equivalent, `false` otherwise. Handles
	     * cyclical data structures.
	     *
	     * Dispatches symmetrically to the `equals` methods of both arguments, if
	     * present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category Relation
	     * @sig a -> b -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @example
	     *
	     *      R.equals(1, 1); //=> true
	     *      R.equals(1, '1'); //=> false
	     *      R.equals([1, 2, 3], [1, 2, 3]); //=> true
	     *
	     *      var a = {}; a.v = a;
	     *      var b = {}; b.v = b;
	     *      R.equals(a, b); //=> true
	     */
	    var equals = _curry2(function equals(a, b) {
	        return _equals(a, b, [], []);
	    });
	
	    /**
	     * Takes a predicate and a "filterable", and returns a new filterable of the
	     * same type containing the members of the given filterable which satisfy the
	     * given predicate.
	     *
	     * Dispatches to the `filter` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Filterable f => (a -> Boolean) -> f a -> f a
	     * @param {Function} pred
	     * @param {Array} filterable
	     * @return {Array}
	     * @see R.reject, R.transduce, R.addIndex
	     * @example
	     *
	     *      var isEven = n => n % 2 === 0;
	     *
	     *      R.filter(isEven, [1, 2, 3, 4]); //=> [2, 4]
	     *
	     *      R.filter(isEven, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
	     */
	    // else
	    var filter = _curry2(_dispatchable('filter', _xfilter, function (pred, filterable) {
	        return _isObject(filterable) ? _reduce(function (acc, key) {
	            if (pred(filterable[key])) {
	                acc[key] = filterable[key];
	            }
	            return acc;
	        }, {}, keys(filterable)) : // else
	        _filter(pred, filterable);
	    }));
	
	    /**
	     * Returns a new list by pulling every item out of it (and all its sub-arrays)
	     * and putting them in a new array, depth-first.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [b]
	     * @param {Array} list The array to consider.
	     * @return {Array} The flattened list.
	     * @see R.unnest
	     * @example
	     *
	     *      R.flatten([1, 2, [3, 4], 5, [6, [7, 8, [9, [10, 11], 12]]]]);
	     *      //=> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	     */
	    var flatten = _curry1(_makeFlat(true));
	
	    /**
	     * Returns a new function much like the supplied one, except that the first two
	     * arguments' order is reversed.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a -> b -> c -> ... -> z) -> (b -> a -> c -> ... -> z)
	     * @param {Function} fn The function to invoke with its first two parameters reversed.
	     * @return {*} The result of invoking `fn` with its first two parameters' order reversed.
	     * @example
	     *
	     *      var mergeThree = (a, b, c) => [].concat(a, b, c);
	     *
	     *      mergeThree(1, 2, 3); //=> [1, 2, 3]
	     *
	     *      R.flip(mergeThree)(1, 2, 3); //=> [2, 1, 3]
	     */
	    var flip = _curry1(function flip(fn) {
	        return curry(function (a, b) {
	            var args = _slice(arguments);
	            args[0] = b;
	            args[1] = a;
	            return fn.apply(this, args);
	        });
	    });
	
	    /**
	     * Returns the first element of the given list or string. In some libraries
	     * this function is named `first`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> a | Undefined
	     * @sig String -> String
	     * @param {Array|String} list
	     * @return {*}
	     * @see R.tail, R.init, R.last
	     * @example
	     *
	     *      R.head(['fi', 'fo', 'fum']); //=> 'fi'
	     *      R.head([]); //=> undefined
	     *
	     *      R.head('abc'); //=> 'a'
	     *      R.head(''); //=> ''
	     */
	    var head = nth(0);
	
	    /**
	     * Returns all but the last element of the given list or string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category List
	     * @sig [a] -> [a]
	     * @sig String -> String
	     * @param {*} list
	     * @return {*}
	     * @see R.last, R.head, R.tail
	     * @example
	     *
	     *      R.init([1, 2, 3]);  //=> [1, 2]
	     *      R.init([1, 2]);     //=> [1]
	     *      R.init([1]);        //=> []
	     *      R.init([]);         //=> []
	     *
	     *      R.init('abc');  //=> 'ab'
	     *      R.init('ab');   //=> 'a'
	     *      R.init('a');    //=> ''
	     *      R.init('');     //=> ''
	     */
	    var init = slice(0, -1);
	
	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of those
	     * elements common to both lists. Duplication is determined according to the
	     * value returned by applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
	     * @param {Function} pred A predicate function that determines whether
	     *        the two supplied elements are equal.
	     * @param {Array} list1 One list of items to compare
	     * @param {Array} list2 A second list of items to compare
	     * @return {Array} A new list containing those elements common to both lists.
	     * @see R.intersection
	     * @example
	     *
	     *      var buffaloSpringfield = [
	     *        {id: 824, name: 'Richie Furay'},
	     *        {id: 956, name: 'Dewey Martin'},
	     *        {id: 313, name: 'Bruce Palmer'},
	     *        {id: 456, name: 'Stephen Stills'},
	     *        {id: 177, name: 'Neil Young'}
	     *      ];
	     *      var csny = [
	     *        {id: 204, name: 'David Crosby'},
	     *        {id: 456, name: 'Stephen Stills'},
	     *        {id: 539, name: 'Graham Nash'},
	     *        {id: 177, name: 'Neil Young'}
	     *      ];
	     *
	     *      R.intersectionWith(R.eqBy(R.prop('id')), buffaloSpringfield, csny);
	     *      //=> [{id: 456, name: 'Stephen Stills'}, {id: 177, name: 'Neil Young'}]
	     */
	    var intersectionWith = _curry3(function intersectionWith(pred, list1, list2) {
	        var lookupList, filteredList;
	        if (list1.length > list2.length) {
	            lookupList = list1;
	            filteredList = list2;
	        } else {
	            lookupList = list2;
	            filteredList = list1;
	        }
	        var results = [];
	        var idx = 0;
	        while (idx < filteredList.length) {
	            if (_containsWith(pred, filteredList[idx], lookupList)) {
	                results[results.length] = filteredList[idx];
	            }
	            idx += 1;
	        }
	        return uniqWith(pred, results);
	    });
	
	    /**
	     * Transforms the items of the list with the transducer and appends the
	     * transformed items to the accumulator using an appropriate iterator function
	     * based on the accumulator type.
	     *
	     * The accumulator can be an array, string, object or a transformer. Iterated
	     * items will be appended to arrays and concatenated to strings. Objects will
	     * be merged directly or 2-item arrays will be merged as key, value pairs.
	     *
	     * The accumulator can also be a transformer object that provides a 2-arity
	     * reducing iterator function, step, 0-arity initial value function, init, and
	     * 1-arity result extraction function result. The step function is used as the
	     * iterator function in reduce. The result function is used to convert the
	     * final accumulator into the return type and in most cases is R.identity. The
	     * init function is used to provide the initial accumulator.
	     *
	     * The iteration is performed with R.reduce after initializing the transducer.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig a -> (b -> b) -> [c] -> a
	     * @param {*} acc The initial accumulator value.
	     * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @example
	     *
	     *      var numbers = [1, 2, 3, 4];
	     *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
	     *
	     *      R.into([], transducer, numbers); //=> [2, 3]
	     *
	     *      var intoArray = R.into([]);
	     *      intoArray(transducer, numbers); //=> [2, 3]
	     */
	    var into = _curry3(function into(acc, xf, list) {
	        return _isTransformer(acc) ? _reduce(xf(acc), acc['@@transducer/init'](), list) : _reduce(xf(_stepCat(acc)), _clone(acc, [], [], false), list);
	    });
	
	    /**
	     * Same as R.invertObj, however this accounts for objects with duplicate values
	     * by putting the values into an array.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig {s: x} -> {x: [ s, ... ]}
	     * @param {Object} obj The object or array to invert
	     * @return {Object} out A new object with keys
	     * in an array.
	     * @example
	     *
	     *      var raceResultsByFirstName = {
	     *        first: 'alice',
	     *        second: 'jake',
	     *        third: 'alice',
	     *      };
	     *      R.invert(raceResultsByFirstName);
	     *      //=> { 'alice': ['first', 'third'], 'jake':['second'] }
	     */
	    var invert = _curry1(function invert(obj) {
	        var props = keys(obj);
	        var len = props.length;
	        var idx = 0;
	        var out = {};
	        while (idx < len) {
	            var key = props[idx];
	            var val = obj[key];
	            var list = _has(val, out) ? out[val] : out[val] = [];
	            list[list.length] = key;
	            idx += 1;
	        }
	        return out;
	    });
	
	    /**
	     * Returns a new object with the keys of the given object as values, and the
	     * values of the given object, which are coerced to strings, as keys. Note
	     * that the last key found is preferred when handling the same value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig {s: x} -> {x: s}
	     * @param {Object} obj The object or array to invert
	     * @return {Object} out A new object
	     * @example
	     *
	     *      var raceResults = {
	     *        first: 'alice',
	     *        second: 'jake'
	     *      };
	     *      R.invertObj(raceResults);
	     *      //=> { 'alice': 'first', 'jake':'second' }
	     *
	     *      // Alternatively:
	     *      var raceResults = ['alice', 'jake'];
	     *      R.invertObj(raceResults);
	     *      //=> { 'alice': '0', 'jake':'1' }
	     */
	    var invertObj = _curry1(function invertObj(obj) {
	        var props = keys(obj);
	        var len = props.length;
	        var idx = 0;
	        var out = {};
	        while (idx < len) {
	            var key = props[idx];
	            out[obj[key]] = key;
	            idx += 1;
	        }
	        return out;
	    });
	
	    /**
	     * Returns `true` if the given value is its type's empty value; `false`
	     * otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig a -> Boolean
	     * @param {*} x
	     * @return {Boolean}
	     * @see R.empty
	     * @example
	     *
	     *      R.isEmpty([1, 2, 3]);   //=> false
	     *      R.isEmpty([]);          //=> true
	     *      R.isEmpty('');          //=> true
	     *      R.isEmpty(null);        //=> false
	     *      R.isEmpty({});          //=> true
	     *      R.isEmpty({length: 0}); //=> false
	     */
	    var isEmpty = _curry1(function isEmpty(x) {
	        return x != null && equals(x, empty(x));
	    });
	
	    /**
	     * Returns the last element of the given list or string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.4
	     * @category List
	     * @sig [a] -> a | Undefined
	     * @sig String -> String
	     * @param {*} list
	     * @return {*}
	     * @see R.init, R.head, R.tail
	     * @example
	     *
	     *      R.last(['fi', 'fo', 'fum']); //=> 'fum'
	     *      R.last([]); //=> undefined
	     *
	     *      R.last('abc'); //=> 'c'
	     *      R.last(''); //=> ''
	     */
	    var last = nth(-1);
	
	    /**
	     * Returns the position of the last occurrence of an item in an array, or -1 if
	     * the item is not included in the array. `R.equals` is used to determine
	     * equality.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> Number
	     * @param {*} target The item to find.
	     * @param {Array} xs The array to search in.
	     * @return {Number} the index of the target, or -1 if the target is not found.
	     * @see R.indexOf
	     * @example
	     *
	     *      R.lastIndexOf(3, [-1,3,3,0,1,2,3,4]); //=> 6
	     *      R.lastIndexOf(10, [1,2,3,4]); //=> -1
	     */
	    var lastIndexOf = _curry2(function lastIndexOf(target, xs) {
	        if (typeof xs.lastIndexOf === 'function' && !_isArray(xs)) {
	            return xs.lastIndexOf(target);
	        } else {
	            var idx = xs.length - 1;
	            while (idx >= 0) {
	                if (equals(xs[idx], target)) {
	                    return idx;
	                }
	                idx -= 1;
	            }
	            return -1;
	        }
	    });
	
	    /**
	     * Takes a function and
	     * a [functor](https://github.com/fantasyland/fantasy-land#functor),
	     * applies the function to each of the functor's values, and returns
	     * a functor of the same shape.
	     *
	     * Ramda provides suitable `map` implementations for `Array` and `Object`,
	     * so this function may be applied to `[1, 2, 3]` or `{x: 1, y: 2, z: 3}`.
	     *
	     * Dispatches to the `map` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * Also treats functions as functors and will compose them together.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Functor f => (a -> b) -> f a -> f b
	     * @param {Function} fn The function to be called on every element of the input `list`.
	     * @param {Array} list The list to be iterated over.
	     * @return {Array} The new list.
	     * @see R.transduce, R.addIndex
	     * @example
	     *
	     *      var double = x => x * 2;
	     *
	     *      R.map(double, [1, 2, 3]); //=> [2, 4, 6]
	     *
	     *      R.map(double, {x: 1, y: 2, z: 3}); //=> {x: 2, y: 4, z: 6}
	     */
	    var map = _curry2(_dispatchable('map', _xmap, function map(fn, functor) {
	        switch (Object.prototype.toString.call(functor)) {
	        case '[object Function]':
	            return curryN(functor.length, function () {
	                return fn.call(this, functor.apply(this, arguments));
	            });
	        case '[object Object]':
	            return _reduce(function (acc, key) {
	                acc[key] = fn(functor[key]);
	                return acc;
	            }, {}, keys(functor));
	        default:
	            return _map(fn, functor);
	        }
	    }));
	
	    /**
	     * An Object-specific version of `map`. The function is applied to three
	     * arguments: *(value, key, obj)*. If only the value is significant, use
	     * `map` instead.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig ((*, String, Object) -> *) -> Object -> Object
	     * @param {Function} fn
	     * @param {Object} obj
	     * @return {Object}
	     * @see R.map
	     * @example
	     *
	     *      var values = { x: 1, y: 2, z: 3 };
	     *      var prependKeyAndDouble = (num, key, obj) => key + (num * 2);
	     *
	     *      R.mapObjIndexed(prependKeyAndDouble, values); //=> { x: 'x2', y: 'y4', z: 'z6' }
	     */
	    var mapObjIndexed = _curry2(function mapObjIndexed(fn, obj) {
	        return _reduce(function (acc, key) {
	            acc[key] = fn(obj[key], key, obj);
	            return acc;
	        }, {}, keys(obj));
	    });
	
	    /**
	     * Creates a new object with the own properties of the two provided objects. If
	     * a key exists in both objects, the provided function is applied to the values
	     * associated with the key in each object, with the result being used as the
	     * value associated with the key in the returned object. The key will be
	     * excluded from the returned object if the resulting value is `undefined`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Object
	     * @sig (a -> a -> a) -> {a} -> {a} -> {a}
	     * @param {Function} fn
	     * @param {Object} l
	     * @param {Object} r
	     * @return {Object}
	     * @see R.merge, R.mergeWithKey
	     * @example
	     *
	     *      R.mergeWith(R.concat,
	     *                  { a: true, values: [10, 20] },
	     *                  { b: true, values: [15, 35] });
	     *      //=> { a: true, b: true, values: [10, 20, 15, 35] }
	     */
	    var mergeWith = _curry3(function mergeWith(fn, l, r) {
	        return mergeWithKey(function (_, _l, _r) {
	            return fn(_l, _r);
	        }, l, r);
	    });
	
	    /**
	     * Takes a function `f` and a list of arguments, and returns a function `g`.
	     * When applied, `g` returns the result of applying `f` to the arguments
	     * provided initially followed by the arguments provided to `g`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((a, b, c, ..., n) -> x) -> [a, b, c, ...] -> ((d, e, f, ..., n) -> x)
	     * @param {Function} f
	     * @param {Array} args
	     * @return {Function}
	     * @see R.partialRight
	     * @example
	     *
	     *      var multiply = (a, b) => a * b;
	     *      var double = R.partial(multiply, [2]);
	     *      double(2); //=> 4
	     *
	     *      var greet = (salutation, title, firstName, lastName) =>
	     *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
	     *
	     *      var sayHello = R.partial(greet, ['Hello']);
	     *      var sayHelloToMs = R.partial(sayHello, ['Ms.']);
	     *      sayHelloToMs('Jane', 'Jones'); //=> 'Hello, Ms. Jane Jones!'
	     */
	    var partial = _createPartialApplicator(_concat);
	
	    /**
	     * Takes a function `f` and a list of arguments, and returns a function `g`.
	     * When applied, `g` returns the result of applying `f` to the arguments
	     * provided to `g` followed by the arguments provided initially.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((a, b, c, ..., n) -> x) -> [d, e, f, ..., n] -> ((a, b, c, ...) -> x)
	     * @param {Function} f
	     * @param {Array} args
	     * @return {Function}
	     * @see R.partial
	     * @example
	     *
	     *      var greet = (salutation, title, firstName, lastName) =>
	     *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
	     *
	     *      var greetMsJaneJones = R.partialRight(greet, ['Ms.', 'Jane', 'Jones']);
	     *
	     *      greetMsJaneJones('Hello'); //=> 'Hello, Ms. Jane Jones!'
	     */
	    var partialRight = _createPartialApplicator(flip(_concat));
	
	    /**
	     * Determines whether a nested path on an object has a specific value, in
	     * `R.equals` terms. Most likely used to filter a list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Relation
	     * @sig [String] -> * -> {String: *} -> Boolean
	     * @param {Array} path The path of the nested property to use
	     * @param {*} val The value to compare the nested property with
	     * @param {Object} obj The object to check the nested property in
	     * @return {Boolean} `true` if the value equals the nested object property,
	     *         `false` otherwise.
	     * @example
	     *
	     *      var user1 = { address: { zipCode: 90210 } };
	     *      var user2 = { address: { zipCode: 55555 } };
	     *      var user3 = { name: 'Bob' };
	     *      var users = [ user1, user2, user3 ];
	     *      var isFamous = R.pathEq(['address', 'zipCode'], 90210);
	     *      R.filter(isFamous, users); //=> [ user1 ]
	     */
	    var pathEq = _curry3(function pathEq(_path, val, obj) {
	        return equals(path(_path, obj), val);
	    });
	
	    /**
	     * Returns a new list by plucking the same named property off all objects in
	     * the list supplied.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig k -> [{k: v}] -> [v]
	     * @param {Number|String} key The key name to pluck off of each object.
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of values for the given key.
	     * @see R.props
	     * @example
	     *
	     *      R.pluck('a')([{a: 1}, {a: 2}]); //=> [1, 2]
	     *      R.pluck(0)([[1, 2], [3, 4]]);   //=> [1, 3]
	     */
	    var pluck = _curry2(function pluck(p, list) {
	        return map(prop(p), list);
	    });
	
	    /**
	     * Reasonable analog to SQL `select` statement.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @category Relation
	     * @sig [k] -> [{k: v}] -> [{k: v}]
	     * @param {Array} props The property names to project
	     * @param {Array} objs The objects to query
	     * @return {Array} An array of objects with just the `props` properties.
	     * @example
	     *
	     *      var abby = {name: 'Abby', age: 7, hair: 'blond', grade: 2};
	     *      var fred = {name: 'Fred', age: 12, hair: 'brown', grade: 7};
	     *      var kids = [abby, fred];
	     *      R.project(['name', 'grade'], kids); //=> [{name: 'Abby', grade: 2}, {name: 'Fred', grade: 7}]
	     */
	    // passing `identity` gives correct arity
	    var project = useWith(_map, [
	        pickAll,
	        identity
	    ]);
	
	    /**
	     * Returns `true` if the specified object property is equal, in `R.equals`
	     * terms, to the given value; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig String -> a -> Object -> Boolean
	     * @param {String} name
	     * @param {*} val
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.equals, R.propSatisfies
	     * @example
	     *
	     *      var abby = {name: 'Abby', age: 7, hair: 'blond'};
	     *      var fred = {name: 'Fred', age: 12, hair: 'brown'};
	     *      var rusty = {name: 'Rusty', age: 10, hair: 'brown'};
	     *      var alois = {name: 'Alois', age: 15, disposition: 'surly'};
	     *      var kids = [abby, fred, rusty, alois];
	     *      var hasBrownHair = R.propEq('hair', 'brown');
	     *      R.filter(hasBrownHair, kids); //=> [fred, rusty]
	     */
	    var propEq = _curry3(function propEq(name, val, obj) {
	        return propSatisfies(equals(val), name, obj);
	    });
	
	    /**
	     * Returns `true` if the specified object property is of the given type;
	     * `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Type
	     * @sig Type -> String -> Object -> Boolean
	     * @param {Function} type
	     * @param {String} name
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.is, R.propSatisfies
	     * @example
	     *
	     *      R.propIs(Number, 'x', {x: 1, y: 2});  //=> true
	     *      R.propIs(Number, 'x', {x: 'foo'});    //=> false
	     *      R.propIs(Number, 'x', {});            //=> false
	     */
	    var propIs = _curry3(function propIs(type, name, obj) {
	        return propSatisfies(is(type), name, obj);
	    });
	
	    /**
	     * Returns a single item by iterating through the list, successively calling
	     * the iterator function and passing it an accumulator value and the current
	     * value from the array, and then passing the result to the next call.
	     *
	     * The iterator function receives two values: *(acc, value)*. It may use
	     * `R.reduced` to shortcut the iteration.
	     *
	     * Note: `R.reduce` does not skip deleted or unassigned indices (sparse
	     * arrays), unlike the native `Array.prototype.reduce` method. For more details
	     * on this behavior, see:
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Description
	     *
	     * Dispatches to the `reduce` method of the third argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig ((a, b) -> a) -> a -> [b] -> a
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.reduced, R.addIndex
	     * @example
	     *
	     *      var numbers = [1, 2, 3];
	     *      var add = (a, b) => a + b;
	     *
	     *      R.reduce(add, 10, numbers); //=> 16
	     */
	    var reduce = _curry3(_reduce);
	
	    /**
	     * Groups the elements of the list according to the result of calling
	     * the String-returning function `keyFn` on each element and reduces the elements
	     * of each group to a single value via the reducer function `valueFn`.
	     *
	     * This function is basically a more general `groupBy` function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category List
	     * @sig ((a, b) -> a) -> a -> (b -> String) -> [b] -> {String: a}
	     * @param {Function} valueFn The function that reduces the elements of each group to a single
	     *        value. Receives two values, accumulator for a particular group and the current element.
	     * @param {*} acc The (initial) accumulator value for each group.
	     * @param {Function} keyFn The function that maps the list's element into a key.
	     * @param {Array} list The array to group.
	     * @return {Object} An object with the output of `keyFn` for keys, mapped to the output of
	     *         `valueFn` for elements which produced that key when passed to `keyFn`.
	     * @see R.groupBy, R.reduce
	     * @example
	     *
	     *      var reduceToNamesBy = R.reduceBy((acc, student) => acc.concat(student.name), []);
	     *      var namesByGrade = reduceToNamesBy(function(student) {
	     *        var score = student.score;
	     *        return score < 65 ? 'F' :
	     *               score < 70 ? 'D' :
	     *               score < 80 ? 'C' :
	     *               score < 90 ? 'B' : 'A';
	     *      });
	     *      var students = [{name: 'Lucy', score: 92},
	     *                      {name: 'Drew', score: 85},
	     *                      // ...
	     *                      {name: 'Bart', score: 62}];
	     *      namesByGrade(students);
	     *      // {
	     *      //   'A': ['Lucy'],
	     *      //   'B': ['Drew']
	     *      //   // ...,
	     *      //   'F': ['Bart']
	     *      // }
	     */
	    var reduceBy = _curryN(4, [], function reduceBy(valueFn, valueAcc, keyFn, list) {
	        return _reduce(function (acc, elt) {
	            var key = keyFn(elt);
	            acc[key] = valueFn(_has(key, acc) ? acc[key] : valueAcc, elt);
	            return acc;
	        }, {}, list);
	    });
	
	    /**
	     * The complement of `filter`.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Filterable f => (a -> Boolean) -> f a -> f a
	     * @param {Function} pred
	     * @param {Array} filterable
	     * @return {Array}
	     * @see R.filter, R.transduce, R.addIndex
	     * @example
	     *
	     *      var isOdd = (n) => n % 2 === 1;
	     *
	     *      R.reject(isOdd, [1, 2, 3, 4]); //=> [2, 4]
	     *
	     *      R.reject(isOdd, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
	     */
	    var reject = _curry2(function reject(pred, filterable) {
	        return filter(_complement(pred), filterable);
	    });
	
	    /**
	     * Returns a fixed list of size `n` containing a specified identical value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig a -> n -> [a]
	     * @param {*} value The value to repeat.
	     * @param {Number} n The desired size of the output list.
	     * @return {Array} A new array containing `n` `value`s.
	     * @example
	     *
	     *      R.repeat('hi', 5); //=> ['hi', 'hi', 'hi', 'hi', 'hi']
	     *
	     *      var obj = {};
	     *      var repeatedObjs = R.repeat(obj, 5); //=> [{}, {}, {}, {}, {}]
	     *      repeatedObjs[0] === repeatedObjs[1]; //=> true
	     */
	    var repeat = _curry2(function repeat(value, n) {
	        return times(always(value), n);
	    });
	
	    /**
	     * Adds together all the elements of a list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list An array of numbers
	     * @return {Number} The sum of all the numbers in the list.
	     * @see R.reduce
	     * @example
	     *
	     *      R.sum([2,4,6,8,100,1]); //=> 121
	     */
	    var sum = reduce(add, 0);
	
	    /**
	     * Returns a new list containing the last `n` elements of the given list.
	     * If `n > list.length`, returns a list of `list.length` elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n The number of elements to return.
	     * @param {Array} xs The collection to consider.
	     * @return {Array}
	     * @see R.dropLast
	     * @example
	     *
	     *      R.takeLast(1, ['foo', 'bar', 'baz']); //=> ['baz']
	     *      R.takeLast(2, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
	     *      R.takeLast(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.takeLast(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.takeLast(3, 'ramda');               //=> 'mda'
	     */
	    var takeLast = _curry2(function takeLast(n, xs) {
	        return drop(n >= 0 ? xs.length - n : 0, xs);
	    });
	
	    /**
	     * Initializes a transducer using supplied iterator function. Returns a single
	     * item by iterating through the list, successively calling the transformed
	     * iterator function and passing it an accumulator value and the current value
	     * from the array, and then passing the result to the next call.
	     *
	     * The iterator function receives two values: *(acc, value)*. It will be
	     * wrapped as a transformer to initialize the transducer. A transformer can be
	     * passed directly in place of an iterator function. In both cases, iteration
	     * may be stopped early with the `R.reduced` function.
	     *
	     * A transducer is a function that accepts a transformer and returns a
	     * transformer and can be composed directly.
	     *
	     * A transformer is an an object that provides a 2-arity reducing iterator
	     * function, step, 0-arity initial value function, init, and 1-arity result
	     * extraction function, result. The step function is used as the iterator
	     * function in reduce. The result function is used to convert the final
	     * accumulator into the return type and in most cases is R.identity. The init
	     * function can be used to provide an initial accumulator, but is ignored by
	     * transduce.
	     *
	     * The iteration is performed with R.reduce after initializing the transducer.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig (c -> c) -> (a,b -> a) -> a -> [b] -> a
	     * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array. Wrapped as transformer, if necessary, and used to
	     *        initialize the transducer
	     * @param {*} acc The initial accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.reduce, R.reduced, R.into
	     * @example
	     *
	     *      var numbers = [1, 2, 3, 4];
	     *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
	     *
	     *      R.transduce(transducer, R.flip(R.append), [], numbers); //=> [2, 3]
	     */
	    var transduce = curryN(4, function transduce(xf, fn, acc, list) {
	        return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
	    });
	
	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of the elements
	     * of each list. Duplication is determined according to the value returned by
	     * applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The first and second lists concatenated, with
	     *         duplicates removed.
	     * @see R.union
	     * @example
	     *
	     *      var l1 = [{a: 1}, {a: 2}];
	     *      var l2 = [{a: 1}, {a: 4}];
	     *      R.unionWith(R.eqBy(R.prop('a')), l1, l2); //=> [{a: 1}, {a: 2}, {a: 4}]
	     */
	    var unionWith = _curry3(function unionWith(pred, list1, list2) {
	        return uniqWith(pred, _concat(list1, list2));
	    });
	
	    /**
	     * Takes a spec object and a test object; returns true if the test satisfies
	     * the spec, false otherwise. An object satisfies the spec if, for each of the
	     * spec's own properties, accessing that property of the object gives the same
	     * value (in `R.equals` terms) as accessing that property of the spec.
	     *
	     * `whereEq` is a specialization of [`where`](#where).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Object
	     * @sig {String: *} -> {String: *} -> Boolean
	     * @param {Object} spec
	     * @param {Object} testObj
	     * @return {Boolean}
	     * @see R.where
	     * @example
	     *
	     *      // pred :: Object -> Boolean
	     *      var pred = R.whereEq({a: 1, b: 2});
	     *
	     *      pred({a: 1});              //=> false
	     *      pred({a: 1, b: 2});        //=> true
	     *      pred({a: 1, b: 2, c: 3});  //=> true
	     *      pred({a: 1, b: 1});        //=> false
	     */
	    var whereEq = _curry2(function whereEq(spec, testObj) {
	        return where(map(equals, spec), testObj);
	    });
	
	    var _flatCat = function () {
	        var preservingReduced = function (xf) {
	            return {
	                '@@transducer/init': _xfBase.init,
	                '@@transducer/result': function (result) {
	                    return xf['@@transducer/result'](result);
	                },
	                '@@transducer/step': function (result, input) {
	                    var ret = xf['@@transducer/step'](result, input);
	                    return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
	                }
	            };
	        };
	        return function _xcat(xf) {
	            var rxf = preservingReduced(xf);
	            return {
	                '@@transducer/init': _xfBase.init,
	                '@@transducer/result': function (result) {
	                    return rxf['@@transducer/result'](result);
	                },
	                '@@transducer/step': function (result, input) {
	                    return !isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
	                }
	            };
	        };
	    }();
	
	    // Array.prototype.indexOf doesn't exist below IE9
	    // manually crawl the list to distinguish between +0 and -0
	    // NaN
	    // non-zero numbers can utilise Set
	    // all these types can utilise Set
	    // null can utilise Set
	    // anything else not covered above, defer to R.equals
	    var _indexOf = function _indexOf(list, a, idx) {
	        var inf, item;
	        // Array.prototype.indexOf doesn't exist below IE9
	        if (typeof list.indexOf === 'function') {
	            switch (typeof a) {
	            case 'number':
	                if (a === 0) {
	                    // manually crawl the list to distinguish between +0 and -0
	                    inf = 1 / a;
	                    while (idx < list.length) {
	                        item = list[idx];
	                        if (item === 0 && 1 / item === inf) {
	                            return idx;
	                        }
	                        idx += 1;
	                    }
	                    return -1;
	                } else if (a !== a) {
	                    // NaN
	                    while (idx < list.length) {
	                        item = list[idx];
	                        if (typeof item === 'number' && item !== item) {
	                            return idx;
	                        }
	                        idx += 1;
	                    }
	                    return -1;
	                }
	                // non-zero numbers can utilise Set
	                return list.indexOf(a, idx);
	            // all these types can utilise Set
	            case 'string':
	            case 'boolean':
	            case 'function':
	            case 'undefined':
	                return list.indexOf(a, idx);
	            case 'object':
	                if (a === null) {
	                    // null can utilise Set
	                    return list.indexOf(a, idx);
	                }
	            }
	        }
	        // anything else not covered above, defer to R.equals
	        while (idx < list.length) {
	            if (equals(list[idx], a)) {
	                return idx;
	            }
	            idx += 1;
	        }
	        return -1;
	    };
	
	    var _xchain = _curry2(function _xchain(f, xf) {
	        return map(f, _flatCat(xf));
	    });
	
	    /**
	     * Takes a list of predicates and returns a predicate that returns true for a
	     * given list of arguments if every one of the provided predicates is satisfied
	     * by those arguments.
	     *
	     * The function returned is a curried function whose arity matches that of the
	     * highest-arity predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Logic
	     * @sig [(*... -> Boolean)] -> (*... -> Boolean)
	     * @param {Array} preds
	     * @return {Function}
	     * @see R.anyPass
	     * @example
	     *
	     *      var isQueen = R.propEq('rank', 'Q');
	     *      var isSpade = R.propEq('suit', '♠︎');
	     *      var isQueenOfSpades = R.allPass([isQueen, isSpade]);
	     *
	     *      isQueenOfSpades({rank: 'Q', suit: '♣︎'}); //=> false
	     *      isQueenOfSpades({rank: 'Q', suit: '♠︎'}); //=> true
	     */
	    var allPass = _curry1(function allPass(preds) {
	        return curryN(reduce(max, 0, pluck('length', preds)), function () {
	            var idx = 0;
	            var len = preds.length;
	            while (idx < len) {
	                if (!preds[idx].apply(this, arguments)) {
	                    return false;
	                }
	                idx += 1;
	            }
	            return true;
	        });
	    });
	
	    /**
	     * Returns `true` if all elements are unique, in `R.equals` terms, otherwise
	     * `false`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category List
	     * @sig [a] -> Boolean
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if all elements are unique, else `false`.
	     * @deprecated since v0.20.0
	     * @example
	     *
	     *      R.allUniq(['1', 1]); //=> true
	     *      R.allUniq([1, 1]);   //=> false
	     *      R.allUniq([[42], [42]]); //=> false
	     */
	    var allUniq = _curry1(function allUniq(list) {
	        var len = list.length;
	        var idx = 0;
	        while (idx < len) {
	            if (_indexOf(list, list[idx], idx + 1) >= 0) {
	                return false;
	            }
	            idx += 1;
	        }
	        return true;
	    });
	
	    /**
	     * Takes a list of predicates and returns a predicate that returns true for a
	     * given list of arguments if at least one of the provided predicates is
	     * satisfied by those arguments.
	     *
	     * The function returned is a curried function whose arity matches that of the
	     * highest-arity predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Logic
	     * @sig [(*... -> Boolean)] -> (*... -> Boolean)
	     * @param {Array} preds
	     * @return {Function}
	     * @see R.allPass
	     * @example
	     *
	     *      var gte = R.anyPass([R.gt, R.equals]);
	     *
	     *      gte(3, 2); //=> true
	     *      gte(2, 2); //=> true
	     *      gte(2, 3); //=> false
	     */
	    var anyPass = _curry1(function anyPass(preds) {
	        return curryN(reduce(max, 0, pluck('length', preds)), function () {
	            var idx = 0;
	            var len = preds.length;
	            while (idx < len) {
	                if (preds[idx].apply(this, arguments)) {
	                    return true;
	                }
	                idx += 1;
	            }
	            return false;
	        });
	    });
	
	    /**
	     * ap applies a list of functions to a list of values.
	     *
	     * Dispatches to the `ap` method of the second argument, if present. Also
	     * treats functions as applicatives.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Function
	     * @sig [f] -> [a] -> [f a]
	     * @param {Array} fns An array of functions
	     * @param {Array} vs An array of values
	     * @return {Array} An array of results of applying each of `fns` to all of `vs` in turn.
	     * @example
	     *
	     *      R.ap([R.multiply(2), R.add(3)], [1,2,3]); //=> [2, 4, 6, 4, 5, 6]
	     */
	    // else
	    var ap = _curry2(function ap(applicative, fn) {
	        return typeof applicative.ap === 'function' ? applicative.ap(fn) : typeof applicative === 'function' ? curryN(Math.max(applicative.length, fn.length), function () {
	            return applicative.apply(this, arguments)(fn.apply(this, arguments));
	        }) : // else
	        _reduce(function (acc, f) {
	            return _concat(acc, map(f, fn));
	        }, [], applicative);
	    });
	
	    /**
	     * Given a spec object recursively mapping properties to functions, creates a
	     * function producing an object of the same structure, by mapping each property
	     * to the result of calling its associated function with the supplied arguments.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Function
	     * @sig {k: ((a, b, ..., m) -> v)} -> ((a, b, ..., m) -> {k: v})
	     * @param {Object} spec an object recursively mapping properties to functions for
	     *        producing the values for these properties.
	     * @return {Function} A function that returns an object of the same structure
	     * as `spec', with each property set to the value returned by calling its
	     * associated function with the supplied arguments.
	     * @see R.juxt
	     * @example
	     *
	     *      var getMetrics = R.applySpec({
	     *                                      sum: R.add,
	     *                                      nested: { mul: R.multiply }
	     *                                   });
	     *      getMetrics(2, 4); // => { sum: 6, nested: { mul: 8 } }
	     */
	    var applySpec = _curry1(function applySpec(spec) {
	        spec = map(function (v) {
	            return typeof v == 'function' ? v : applySpec(v);
	        }, spec);
	        return curryN(reduce(max, 0, pluck('length', values(spec))), function () {
	            var args = arguments;
	            return map(function (f) {
	                return apply(f, args);
	            }, spec);
	        });
	    });
	
	    /**
	     * Returns the result of calling its first argument with the remaining
	     * arguments. This is occasionally useful as a converging function for
	     * `R.converge`: the left branch can produce a function while the right branch
	     * produces a value to be passed to that function as an argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig (*... -> a),*... -> a
	     * @param {Function} fn The function to apply to the remaining arguments.
	     * @param {...*} args Any number of positional arguments.
	     * @return {*}
	     * @see R.apply
	     * @example
	     *
	     *      var indentN = R.pipe(R.times(R.always(' ')),
	     *                           R.join(''),
	     *                           R.replace(/^(?!$)/gm));
	     *
	     *      var format = R.converge(R.call, [
	     *                                  R.pipe(R.prop('indent'), indentN),
	     *                                  R.prop('value')
	     *                              ]);
	     *
	     *      format({indent: 2, value: 'foo\nbar\nbaz\n'}); //=> '  foo\n  bar\n  baz\n'
	     */
	    var call = curry(function call(fn) {
	        return fn.apply(this, _slice(arguments, 1));
	    });
	
	    /**
	     * `chain` maps a function over a list and concatenates the results. `chain`
	     * is also known as `flatMap` in some libraries
	     *
	     * Dispatches to the `chain` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig (a -> [b]) -> [a] -> [b]
	     * @param {Function} fn
	     * @param {Array} list
	     * @return {Array}
	     * @example
	     *
	     *      var duplicate = n => [n, n];
	     *      R.chain(duplicate, [1, 2, 3]); //=> [1, 1, 2, 2, 3, 3]
	     */
	    var chain = _curry2(_dispatchable('chain', _xchain, function chain(fn, monad) {
	        if (typeof monad === 'function') {
	            return function () {
	                return monad.call(this, fn.apply(this, arguments)).apply(this, arguments);
	            };
	        }
	        return _makeFlat(false)(map(fn, monad));
	    }));
	
	    /**
	     * Returns a function, `fn`, which encapsulates if/else-if/else logic.
	     * `R.cond` takes a list of [predicate, transform] pairs. All of the arguments
	     * to `fn` are applied to each of the predicates in turn until one returns a
	     * "truthy" value, at which point `fn` returns the result of applying its
	     * arguments to the corresponding transformer. If none of the predicates
	     * matches, `fn` returns undefined.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category Logic
	     * @sig [[(*... -> Boolean),(*... -> *)]] -> (*... -> *)
	     * @param {Array} pairs
	     * @return {Function}
	     * @example
	     *
	     *      var fn = R.cond([
	     *        [R.equals(0),   R.always('water freezes at 0°C')],
	     *        [R.equals(100), R.always('water boils at 100°C')],
	     *        [R.T,           temp => 'nothing special happens at ' + temp + '°C']
	     *      ]);
	     *      fn(0); //=> 'water freezes at 0°C'
	     *      fn(50); //=> 'nothing special happens at 50°C'
	     *      fn(100); //=> 'water boils at 100°C'
	     */
	    var cond = _curry1(function cond(pairs) {
	        var arity = reduce(max, 0, map(function (pair) {
	            return pair[0].length;
	        }, pairs));
	        return _arity(arity, function () {
	            var idx = 0;
	            while (idx < pairs.length) {
	                if (pairs[idx][0].apply(this, arguments)) {
	                    return pairs[idx][1].apply(this, arguments);
	                }
	                idx += 1;
	            }
	        });
	    });
	
	    /**
	     * Wraps a constructor function inside a curried function that can be called
	     * with the same arguments and returns the same type. The arity of the function
	     * returned is specified to allow using variadic constructor functions.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.0
	     * @category Function
	     * @sig Number -> (* -> {*}) -> (* -> {*})
	     * @param {Number} n The arity of the constructor function.
	     * @param {Function} Fn The constructor function to wrap.
	     * @return {Function} A wrapped, curried constructor function.
	     * @example
	     *
	     *      // Variadic constructor function
	     *      var Widget = () => {
	     *        this.children = Array.prototype.slice.call(arguments);
	     *        // ...
	     *      };
	     *      Widget.prototype = {
	     *        // ...
	     *      };
	     *      var allConfigs = [
	     *        // ...
	     *      ];
	     *      R.map(R.constructN(1, Widget), allConfigs); // a list of Widgets
	     */
	    var constructN = _curry2(function constructN(n, Fn) {
	        if (n > 10) {
	            throw new Error('Constructor with greater than ten arguments');
	        }
	        if (n === 0) {
	            return function () {
	                return new Fn();
	            };
	        }
	        return curry(nAry(n, function ($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
	            switch (arguments.length) {
	            case 1:
	                return new Fn($0);
	            case 2:
	                return new Fn($0, $1);
	            case 3:
	                return new Fn($0, $1, $2);
	            case 4:
	                return new Fn($0, $1, $2, $3);
	            case 5:
	                return new Fn($0, $1, $2, $3, $4);
	            case 6:
	                return new Fn($0, $1, $2, $3, $4, $5);
	            case 7:
	                return new Fn($0, $1, $2, $3, $4, $5, $6);
	            case 8:
	                return new Fn($0, $1, $2, $3, $4, $5, $6, $7);
	            case 9:
	                return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8);
	            case 10:
	                return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8, $9);
	            }
	        }));
	    });
	
	    /**
	     * Accepts a converging function and a list of branching functions and returns
	     * a new function. When invoked, this new function is applied to some
	     * arguments, each branching function is applied to those same arguments. The
	     * results of each branching function are passed as arguments to the converging
	     * function to produce the return value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.2
	     * @category Function
	     * @sig (x1 -> x2 -> ... -> z) -> [(a -> b -> ... -> x1), (a -> b -> ... -> x2), ...] -> (a -> b -> ... -> z)
	     * @param {Function} after A function. `after` will be invoked with the return values of
	     *        `fn1` and `fn2` as its arguments.
	     * @param {Array} functions A list of functions.
	     * @return {Function} A new function.
	     * @example
	     *
	     *      var add = (a, b) => a + b;
	     *      var multiply = (a, b) => a * b;
	     *      var subtract = (a, b) => a - b;
	     *
	     *      //≅ multiply( add(1, 2), subtract(1, 2) );
	     *      R.converge(multiply, [add, subtract])(1, 2); //=> -3
	     *
	     *      var add3 = (a, b, c) => a + b + c;
	     *      R.converge(add3, [multiply, add, subtract])(1, 2); //=> 4
	     */
	    var converge = _curry2(function converge(after, fns) {
	        return curryN(reduce(max, 0, pluck('length', fns)), function () {
	            var args = arguments;
	            var context = this;
	            return after.apply(context, _map(function (fn) {
	                return fn.apply(context, args);
	            }, fns));
	        });
	    });
	
	    /**
	     * Counts the elements of a list according to how many match each value of a
	     * key generated by the supplied function. Returns an object mapping the keys
	     * produced by `fn` to the number of occurrences in the list. Note that all
	     * keys are coerced to strings because of how JavaScript objects work.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> String) -> [a] -> {*}
	     * @param {Function} fn The function used to map values to keys.
	     * @param {Array} list The list to count elements from.
	     * @return {Object} An object mapping keys to number of occurrences in the list.
	     * @example
	     *
	     *      var numbers = [1.0, 1.1, 1.2, 2.0, 3.0, 2.2];
	     *      var letters = R.split('', 'abcABCaaaBBc');
	     *      R.countBy(Math.floor)(numbers);    //=> {'1': 3, '2': 2, '3': 1}
	     *      R.countBy(R.toLower)(letters);   //=> {'a': 5, 'b': 4, 'c': 3}
	     */
	    var countBy = reduceBy(function (acc, elem) {
	        return acc + 1;
	    }, 0);
	
	    /**
	     * Returns a new list without any consecutively repeating elements. Equality is
	     * determined by applying the supplied predicate two consecutive elements. The
	     * first element in a series of equal element is the one being preserved.
	     *
	     * Dispatches to the `dropRepeatsWith` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig (a, a -> Boolean) -> [a] -> [a]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list The array to consider.
	     * @return {Array} `list` without repeating elements.
	     * @see R.transduce
	     * @example
	     *
	     *      var l = [1, -1, 1, 3, 4, -4, -4, -5, 5, 3, 3];
	     *      R.dropRepeatsWith(R.eqBy(Math.abs), l); //=> [1, 3, 4, -5, 3]
	     */
	    var dropRepeatsWith = _curry2(_dispatchable('dropRepeatsWith', _xdropRepeatsWith, function dropRepeatsWith(pred, list) {
	        var result = [];
	        var idx = 1;
	        var len = list.length;
	        if (len !== 0) {
	            result[0] = list[0];
	            while (idx < len) {
	                if (!pred(last(result), list[idx])) {
	                    result[result.length] = list[idx];
	                }
	                idx += 1;
	            }
	        }
	        return result;
	    }));
	
	    /**
	     * Takes a function and two values in its domain and returns `true` if the
	     * values map to the same value in the codomain; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Relation
	     * @sig (a -> b) -> a -> a -> Boolean
	     * @param {Function} f
	     * @param {*} x
	     * @param {*} y
	     * @return {Boolean}
	     * @example
	     *
	     *      R.eqBy(Math.abs, 5, -5); //=> true
	     */
	    var eqBy = _curry3(function eqBy(f, x, y) {
	        return equals(f(x), f(y));
	    });
	
	    /**
	     * Reports whether two objects have the same value, in `R.equals` terms, for
	     * the specified property. Useful as a curried predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig k -> {k: v} -> {k: v} -> Boolean
	     * @param {String} prop The name of the property to compare
	     * @param {Object} obj1
	     * @param {Object} obj2
	     * @return {Boolean}
	     *
	     * @example
	     *
	     *      var o1 = { a: 1, b: 2, c: 3, d: 4 };
	     *      var o2 = { a: 10, b: 20, c: 3, d: 40 };
	     *      R.eqProps('a', o1, o2); //=> false
	     *      R.eqProps('c', o1, o2); //=> true
	     */
	    var eqProps = _curry3(function eqProps(prop, obj1, obj2) {
	        return equals(obj1[prop], obj2[prop]);
	    });
	
	    /**
	     * Splits a list into sub-lists stored in an object, based on the result of
	     * calling a String-returning function on each element, and grouping the
	     * results according to values returned.
	     *
	     * Dispatches to the `groupBy` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> String) -> [a] -> {String: [a]}
	     * @param {Function} fn Function :: a -> String
	     * @param {Array} list The array to group
	     * @return {Object} An object with the output of `fn` for keys, mapped to arrays of elements
	     *         that produced that key when passed to `fn`.
	     * @see R.transduce
	     * @example
	     *
	     *      var byGrade = R.groupBy(function(student) {
	     *        var score = student.score;
	     *        return score < 65 ? 'F' :
	     *               score < 70 ? 'D' :
	     *               score < 80 ? 'C' :
	     *               score < 90 ? 'B' : 'A';
	     *      });
	     *      var students = [{name: 'Abby', score: 84},
	     *                      {name: 'Eddy', score: 58},
	     *                      // ...
	     *                      {name: 'Jack', score: 69}];
	     *      byGrade(students);
	     *      // {
	     *      //   'A': [{name: 'Dianne', score: 99}],
	     *      //   'B': [{name: 'Abby', score: 84}]
	     *      //   // ...,
	     *      //   'F': [{name: 'Eddy', score: 58}]
	     *      // }
	     */
	    var groupBy = _curry2(_dispatchable('groupBy', _xgroupBy, reduceBy(function (acc, item) {
	        if (acc == null) {
	            acc = [];
	        }
	        acc.push(item);
	        return acc;
	    }, null)));
	
	    /**
	     * Given a function that generates a key, turns a list of objects into an
	     * object indexing the objects by the given key. Note that if multiple
	     * objects generate the same value for the indexing key only the last value
	     * will be included in the generated object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (a -> String) -> [{k: v}] -> {k: {k: v}}
	     * @param {Function} fn Function :: a -> String
	     * @param {Array} array The array of objects to index
	     * @return {Object} An object indexing each array element by the given property.
	     * @example
	     *
	     *      var list = [{id: 'xyz', title: 'A'}, {id: 'abc', title: 'B'}];
	     *      R.indexBy(R.prop('id'), list);
	     *      //=> {abc: {id: 'abc', title: 'B'}, xyz: {id: 'xyz', title: 'A'}}
	     */
	    var indexBy = reduceBy(function (acc, elem) {
	        return elem;
	    }, null);
	
	    /**
	     * Returns the position of the first occurrence of an item in an array, or -1
	     * if the item is not included in the array. `R.equals` is used to determine
	     * equality.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> Number
	     * @param {*} target The item to find.
	     * @param {Array} xs The array to search in.
	     * @return {Number} the index of the target, or -1 if the target is not found.
	     * @see R.lastIndexOf
	     * @example
	     *
	     *      R.indexOf(3, [1,2,3,4]); //=> 2
	     *      R.indexOf(10, [1,2,3,4]); //=> -1
	     */
	    var indexOf = _curry2(function indexOf(target, xs) {
	        return typeof xs.indexOf === 'function' && !_isArray(xs) ? xs.indexOf(target) : _indexOf(xs, target, 0);
	    });
	
	    /**
	     * juxt applies a list of functions to a list of values.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Function
	     * @sig [(a, b, ..., m) -> n] -> ((a, b, ..., m) -> [n])
	     * @param {Array} fns An array of functions
	     * @return {Function} A function that returns a list of values after applying each of the original `fns` to its parameters.
	     * @see R.applySpec
	     * @example
	     *
	     *      var range = R.juxt([Math.min, Math.max]);
	     *      range(3, 4, 9, -3); //=> [-3, 9]
	     */
	    var juxt = _curry1(function juxt(fns) {
	        return converge(_arrayOf, fns);
	    });
	
	    /**
	     * Returns a lens for the given getter and setter functions. The getter "gets"
	     * the value of the focus; the setter "sets" the value of the focus. The setter
	     * should not mutate the data structure.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig (s -> a) -> ((a, s) -> s) -> Lens s a
	     * @param {Function} getter
	     * @param {Function} setter
	     * @return {Lens}
	     * @see R.view, R.set, R.over, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var xLens = R.lens(R.prop('x'), R.assoc('x'));
	     *
	     *      R.view(xLens, {x: 1, y: 2});            //=> 1
	     *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
	     *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
	     */
	    var lens = _curry2(function lens(getter, setter) {
	        return function (toFunctorFn) {
	            return function (target) {
	                return map(function (focus) {
	                    return setter(focus, target);
	                }, toFunctorFn(getter(target)));
	            };
	        };
	    });
	
	    /**
	     * Returns a lens whose focus is the specified index.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Number -> Lens s a
	     * @param {Number} n
	     * @return {Lens}
	     * @see R.view, R.set, R.over
	     * @example
	     *
	     *      var headLens = R.lensIndex(0);
	     *
	     *      R.view(headLens, ['a', 'b', 'c']);            //=> 'a'
	     *      R.set(headLens, 'x', ['a', 'b', 'c']);        //=> ['x', 'b', 'c']
	     *      R.over(headLens, R.toUpper, ['a', 'b', 'c']); //=> ['A', 'b', 'c']
	     */
	    var lensIndex = _curry1(function lensIndex(n) {
	        return lens(nth(n), update(n));
	    });
	
	    /**
	     * Returns a lens whose focus is the specified path.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig [String] -> Lens s a
	     * @param {Array} path The path to use.
	     * @return {Lens}
	     * @see R.view, R.set, R.over
	     * @example
	     *
	     *      var xyLens = R.lensPath(['x', 'y']);
	     *
	     *      R.view(xyLens, {x: {y: 2, z: 3}});            //=> 2
	     *      R.set(xyLens, 4, {x: {y: 2, z: 3}});          //=> {x: {y: 4, z: 3}}
	     *      R.over(xyLens, R.negate, {x: {y: 2, z: 3}});  //=> {x: {y: -2, z: 3}}
	     */
	    var lensPath = _curry1(function lensPath(p) {
	        return lens(path(p), assocPath(p));
	    });
	
	    /**
	     * Returns a lens whose focus is the specified property.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig String -> Lens s a
	     * @param {String} k
	     * @return {Lens}
	     * @see R.view, R.set, R.over
	     * @example
	     *
	     *      var xLens = R.lensProp('x');
	     *
	     *      R.view(xLens, {x: 1, y: 2});            //=> 1
	     *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
	     *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
	     */
	    var lensProp = _curry1(function lensProp(k) {
	        return lens(prop(k), assoc(k));
	    });
	
	    /**
	     * "lifts" a function to be the specified arity, so that it may "map over" that
	     * many lists, Functions or other objects that satisfy the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Function
	     * @sig Number -> (*... -> *) -> ([*]... -> [*])
	     * @param {Function} fn The function to lift into higher context
	     * @return {Function} The lifted function.
	     * @see R.lift, R.ap
	     * @example
	     *
	     *      var madd3 = R.liftN(3, R.curryN(3, (...args) => R.sum(args)));
	     *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
	     */
	    var liftN = _curry2(function liftN(arity, fn) {
	        var lifted = curryN(arity, fn);
	        return curryN(arity, function () {
	            return _reduce(ap, map(lifted, arguments[0]), _slice(arguments, 1));
	        });
	    });
	
	    /**
	     * Returns the mean of the given list of numbers.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list
	     * @return {Number}
	     * @example
	     *
	     *      R.mean([2, 7, 9]); //=> 6
	     *      R.mean([]); //=> NaN
	     */
	    var mean = _curry1(function mean(list) {
	        return sum(list) / list.length;
	    });
	
	    /**
	     * Returns the median of the given list of numbers.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list
	     * @return {Number}
	     * @example
	     *
	     *      R.median([2, 9, 7]); //=> 7
	     *      R.median([7, 2, 10, 9]); //=> 8
	     *      R.median([]); //=> NaN
	     */
	    var median = _curry1(function median(list) {
	        var len = list.length;
	        if (len === 0) {
	            return NaN;
	        }
	        var width = 2 - len % 2;
	        var idx = (len - width) / 2;
	        return mean(_slice(list).sort(function (a, b) {
	            return a < b ? -1 : a > b ? 1 : 0;
	        }).slice(idx, idx + width));
	    });
	
	    /**
	     * Takes a predicate and a list or other "filterable" object and returns the
	     * pair of filterable objects of the same type of elements which do and do not
	     * satisfy, the predicate, respectively.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.4
	     * @category List
	     * @sig Filterable f => (a -> Boolean) -> f a -> [f a, f a]
	     * @param {Function} pred A predicate to determine which side the element belongs to.
	     * @param {Array} filterable the list (or other filterable) to partition.
	     * @return {Array} An array, containing first the subset of elements that satisfy the
	     *         predicate, and second the subset of elements that do not satisfy.
	     * @see R.filter, R.reject
	     * @example
	     *
	     *      R.partition(R.contains('s'), ['sss', 'ttt', 'foo', 'bars']);
	     *      // => [ [ 'sss', 'bars' ],  [ 'ttt', 'foo' ] ]
	     *
	     *      R.partition(R.contains('s'), { a: 'sss', b: 'ttt', foo: 'bars' });
	     *      // => [ { a: 'sss', foo: 'bars' }, { b: 'ttt' }  ]
	     */
	    var partition = juxt([
	        filter,
	        reject
	    ]);
	
	    /**
	     * Performs left-to-right function composition. The leftmost function may have
	     * any arity; the remaining functions must be unary.
	     *
	     * In some libraries this function is named `sequence`.
	     *
	     * **Note:** The result of pipe is not automatically curried.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (((a, b, ..., n) -> o), (o -> p), ..., (x -> y), (y -> z)) -> ((a, b, ..., n) -> z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.compose
	     * @example
	     *
	     *      var f = R.pipe(Math.pow, R.negate, R.inc);
	     *
	     *      f(3, 4); // -(3^4) + 1
	     */
	    var pipe = function pipe() {
	        if (arguments.length === 0) {
	            throw new Error('pipe requires at least one argument');
	        }
	        return _arity(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
	    };
	
	    /**
	     * Performs left-to-right composition of one or more Promise-returning
	     * functions. The leftmost function may have any arity; the remaining functions
	     * must be unary.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((a -> Promise b), (b -> Promise c), ..., (y -> Promise z)) -> (a -> Promise z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.composeP
	     * @example
	     *
	     *      //  followersForUser :: String -> Promise [User]
	     *      var followersForUser = R.pipeP(db.getUserById, db.getFollowers);
	     */
	    var pipeP = function pipeP() {
	        if (arguments.length === 0) {
	            throw new Error('pipeP requires at least one argument');
	        }
	        return _arity(arguments[0].length, reduce(_pipeP, arguments[0], tail(arguments)));
	    };
	
	    /**
	     * Multiplies together all the elements of a list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list An array of numbers
	     * @return {Number} The product of all the numbers in the list.
	     * @see R.reduce
	     * @example
	     *
	     *      R.product([2,4,6,8,100,1]); //=> 38400
	     */
	    var product = reduce(multiply, 1);
	
	    /**
	     * Transforms a [Traversable](https://github.com/fantasyland/fantasy-land#traversable)
	     * of [Applicative](https://github.com/fantasyland/fantasy-land#applicative) into an
	     * Applicative of Traversable.
	     *
	     * Dispatches to the `sequence` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (Applicative f, Traversable t) => (a -> f a) -> t (f a) -> f (t a)
	     * @param {Function} of
	     * @param {*} traversable
	     * @return {*}
	     * @see R.traverse
	     * @example
	     *
	     *      R.sequence(Maybe.of, [Just(1), Just(2), Just(3)]);   //=> Just([1, 2, 3])
	     *      R.sequence(Maybe.of, [Just(1), Just(2), Nothing()]); //=> Nothing()
	     *
	     *      R.sequence(R.of, Just([1, 2, 3])); //=> [Just(1), Just(2), Just(3)]
	     *      R.sequence(R.of, Nothing());       //=> [Nothing()]
	     */
	    var sequence = _curry2(function sequence(of, traversable) {
	        return typeof traversable.sequence === 'function' ? traversable.sequence(of) : reduceRight(function (acc, x) {
	            return ap(map(prepend, x), acc);
	        }, of([]), traversable);
	    });
	
	    /**
	     * Maps an [Applicative](https://github.com/fantasyland/fantasy-land#applicative)-returning
	     * function over a [Traversable](https://github.com/fantasyland/fantasy-land#traversable),
	     * then uses [`sequence`](#sequence) to transform the resulting Traversable of Applicative
	     * into an Applicative of Traversable.
	     *
	     * Dispatches to the `sequence` method of the third argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (Applicative f, Traversable t) => (a -> f a) -> (a -> f b) -> t a -> f (t b)
	     * @param {Function} of
	     * @param {Function} f
	     * @param {*} traversable
	     * @return {*}
	     * @see R.sequence
	     * @example
	     *
	     *      // Returns `Nothing` if the given divisor is `0`
	     *      safeDiv = n => d => d === 0 ? Nothing() : Just(n / d)
	     *
	     *      R.traverse(Maybe.of, safeDiv(10), [2, 4, 5]); //=> Just([5, 2.5, 2])
	     *      R.traverse(Maybe.of, safeDiv(10), [2, 0, 5]); //=> Nothing
	     */
	    var traverse = _curry3(function traverse(of, f, traversable) {
	        return sequence(of, map(f, traversable));
	    });
	
	    /**
	     * Shorthand for `R.chain(R.identity)`, which removes one level of nesting from
	     * any [Chain](https://github.com/fantasyland/fantasy-land#chain).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig Chain c => c (c a) -> c a
	     * @param {*} list
	     * @return {*}
	     * @see R.flatten, R.chain
	     * @example
	     *
	     *      R.unnest([1, [2], [[3]]]); //=> [1, 2, [3]]
	     *      R.unnest([[1, 2], [3, 4], [5, 6]]); //=> [1, 2, 3, 4, 5, 6]
	     */
	    var unnest = chain(_identity);
	
	    var _contains = function _contains(a, list) {
	        return _indexOf(list, a, 0) >= 0;
	    };
	
	    //  mapPairs :: (Object, [String]) -> [String]
	    var _toString = function _toString(x, seen) {
	        var recur = function recur(y) {
	            var xs = seen.concat([x]);
	            return _contains(y, xs) ? '<Circular>' : _toString(y, xs);
	        };
	        //  mapPairs :: (Object, [String]) -> [String]
	        var mapPairs = function (obj, keys) {
	            return _map(function (k) {
	                return _quote(k) + ': ' + recur(obj[k]);
	            }, keys.slice().sort());
	        };
	        switch (Object.prototype.toString.call(x)) {
	        case '[object Arguments]':
	            return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
	        case '[object Array]':
	            return '[' + _map(recur, x).concat(mapPairs(x, reject(function (k) {
	                return /^\d+$/.test(k);
	            }, keys(x)))).join(', ') + ']';
	        case '[object Boolean]':
	            return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
	        case '[object Date]':
	            return 'new Date(' + (isNaN(x.valueOf()) ? recur(NaN) : _quote(_toISOString(x))) + ')';
	        case '[object Null]':
	            return 'null';
	        case '[object Number]':
	            return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
	        case '[object String]':
	            return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
	        case '[object Undefined]':
	            return 'undefined';
	        default:
	            if (typeof x.toString === 'function') {
	                var repr = x.toString();
	                if (repr !== '[object Object]') {
	                    return repr;
	                }
	            }
	            return '{' + mapPairs(x, keys(x)).join(', ') + '}';
	        }
	    };
	
	    /**
	     * Performs right-to-left function composition. The rightmost function may have
	     * any arity; the remaining functions must be unary.
	     *
	     * **Note:** The result of compose is not automatically curried.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig ((y -> z), (x -> y), ..., (o -> p), ((a, b, ..., n) -> o)) -> ((a, b, ..., n) -> z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.pipe
	     * @example
	     *
	     *      var f = R.compose(R.inc, R.negate, Math.pow);
	     *
	     *      f(3, 4); // -(3^4) + 1
	     */
	    var compose = function compose() {
	        if (arguments.length === 0) {
	            throw new Error('compose requires at least one argument');
	        }
	        return pipe.apply(this, reverse(arguments));
	    };
	
	    /**
	     * Returns the right-to-left Kleisli composition of the provided functions,
	     * each of which must return a value of a type supported by [`chain`](#chain).
	     *
	     * `R.composeK(h, g, f)` is equivalent to `R.compose(R.chain(h), R.chain(g), R.chain(f))`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Function
	     * @sig Chain m => ((y -> m z), (x -> m y), ..., (a -> m b)) -> (m a -> m z)
	     * @param {...Function}
	     * @return {Function}
	     * @see R.pipeK
	     * @example
	     *
	     *      //  parseJson :: String -> Maybe *
	     *      //  get :: String -> Object -> Maybe *
	     *
	     *      //  getStateCode :: Maybe String -> Maybe String
	     *      var getStateCode = R.composeK(
	     *        R.compose(Maybe.of, R.toUpper),
	     *        get('state'),
	     *        get('address'),
	     *        get('user'),
	     *        parseJson
	     *      );
	     *
	     *      getStateCode(Maybe.of('{"user":{"address":{"state":"ny"}}}'));
	     *      //=> Just('NY')
	     *      getStateCode(Maybe.of('[Invalid JSON]'));
	     *      //=> Nothing()
	     */
	    var composeK = function composeK() {
	        return compose.apply(this, prepend(identity, map(chain, arguments)));
	    };
	
	    /**
	     * Performs right-to-left composition of one or more Promise-returning
	     * functions. The rightmost function may have any arity; the remaining
	     * functions must be unary.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((y -> Promise z), (x -> Promise y), ..., (a -> Promise b)) -> (a -> Promise z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.pipeP
	     * @example
	     *
	     *      //  followersForUser :: String -> Promise [User]
	     *      var followersForUser = R.composeP(db.getFollowers, db.getUserById);
	     */
	    var composeP = function composeP() {
	        if (arguments.length === 0) {
	            throw new Error('composeP requires at least one argument');
	        }
	        return pipeP.apply(this, reverse(arguments));
	    };
	
	    /**
	     * Wraps a constructor function inside a curried function that can be called
	     * with the same arguments and returns the same type.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (* -> {*}) -> (* -> {*})
	     * @param {Function} Fn The constructor function to wrap.
	     * @return {Function} A wrapped, curried constructor function.
	     * @example
	     *
	     *      // Constructor function
	     *      var Widget = config => {
	     *        // ...
	     *      };
	     *      Widget.prototype = {
	     *        // ...
	     *      };
	     *      var allConfigs = [
	     *        // ...
	     *      ];
	     *      R.map(R.construct(Widget), allConfigs); // a list of Widgets
	     */
	    var construct = _curry1(function construct(Fn) {
	        return constructN(Fn.length, Fn);
	    });
	
	    /**
	     * Returns `true` if the specified value is equal, in `R.equals` terms, to at
	     * least one element of the given list; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> Boolean
	     * @param {Object} a The item to compare against.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the item is in the list, `false` otherwise.
	     * @see R.any
	     * @example
	     *
	     *      R.contains(3, [1, 2, 3]); //=> true
	     *      R.contains(4, [1, 2, 3]); //=> false
	     *      R.contains([42], [[42]]); //=> true
	     */
	    var contains = _curry2(_contains);
	
	    /**
	     * Finds the set (i.e. no duplicates) of all elements in the first list not
	     * contained in the second list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` that are not in `list2`.
	     * @see R.differenceWith
	     * @example
	     *
	     *      R.difference([1,2,3,4], [7,6,5,4,3]); //=> [1,2]
	     *      R.difference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5]
	     */
	    var difference = _curry2(function difference(first, second) {
	        var out = [];
	        var idx = 0;
	        var firstLen = first.length;
	        while (idx < firstLen) {
	            if (!_contains(first[idx], second) && !_contains(first[idx], out)) {
	                out[out.length] = first[idx];
	            }
	            idx += 1;
	        }
	        return out;
	    });
	
	    /**
	     * Returns a new list without any consecutively repeating elements. `R.equals`
	     * is used to determine equality.
	     *
	     * Dispatches to the `dropRepeats` method of the first argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig [a] -> [a]
	     * @param {Array} list The array to consider.
	     * @return {Array} `list` without repeating elements.
	     * @see R.transduce
	     * @example
	     *
	     *     R.dropRepeats([1, 1, 1, 2, 3, 4, 4, 2, 2]); //=> [1, 2, 3, 4, 2]
	     */
	    var dropRepeats = _curry1(_dispatchable('dropRepeats', _xdropRepeatsWith(equals), dropRepeatsWith(equals)));
	
	    /**
	     * "lifts" a function of arity > 1 so that it may "map over" a list, Function or other
	     * object that satisfies the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Function
	     * @sig (*... -> *) -> ([*]... -> [*])
	     * @param {Function} fn The function to lift into higher context
	     * @return {Function} The lifted function.
	     * @see R.liftN
	     * @example
	     *
	     *      var madd3 = R.lift(R.curry((a, b, c) => a + b + c));
	     *
	     *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
	     *
	     *      var madd5 = R.lift(R.curry((a, b, c, d, e) => a + b + c + d + e));
	     *
	     *      madd5([1,2], [3], [4, 5], [6], [7, 8]); //=> [21, 22, 22, 23, 22, 23, 23, 24]
	     */
	    var lift = _curry1(function lift(fn) {
	        return liftN(fn.length, fn);
	    });
	
	    /**
	     * Returns a partial copy of an object omitting the keys specified.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [String] -> {String: *} -> {String: *}
	     * @param {Array} names an array of String property names to omit from the new object
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with properties from `names` not on it.
	     * @see R.pick
	     * @example
	     *
	     *      R.omit(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, c: 3}
	     */
	    var omit = _curry2(function omit(names, obj) {
	        var result = {};
	        for (var prop in obj) {
	            if (!_contains(prop, names)) {
	                result[prop] = obj[prop];
	            }
	        }
	        return result;
	    });
	
	    /**
	     * Returns the left-to-right Kleisli composition of the provided functions,
	     * each of which must return a value of a type supported by [`chain`](#chain).
	     *
	     * `R.pipeK(f, g, h)` is equivalent to `R.pipe(R.chain(f), R.chain(g), R.chain(h))`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Function
	     * @sig Chain m => ((a -> m b), (b -> m c), ..., (y -> m z)) -> (m a -> m z)
	     * @param {...Function}
	     * @return {Function}
	     * @see R.composeK
	     * @example
	     *
	     *      //  parseJson :: String -> Maybe *
	     *      //  get :: String -> Object -> Maybe *
	     *
	     *      //  getStateCode :: Maybe String -> Maybe String
	     *      var getStateCode = R.pipeK(
	     *        parseJson,
	     *        get('user'),
	     *        get('address'),
	     *        get('state'),
	     *        R.compose(Maybe.of, R.toUpper)
	     *      );
	     *
	     *      getStateCode(Maybe.of('{"user":{"address":{"state":"ny"}}}'));
	     *      //=> Just('NY')
	     *      getStateCode(Maybe.of('[Invalid JSON]'));
	     *      //=> Nothing()
	     */
	    var pipeK = function pipeK() {
	        return composeK.apply(this, reverse(arguments));
	    };
	
	    /**
	     * Returns the string representation of the given value. `eval`'ing the output
	     * should result in a value equivalent to the input value. Many of the built-in
	     * `toString` methods do not satisfy this requirement.
	     *
	     * If the given value is an `[object Object]` with a `toString` method other
	     * than `Object.prototype.toString`, this method is invoked with no arguments
	     * to produce the return value. This means user-defined constructor functions
	     * can provide a suitable `toString` method. For example:
	     *
	     *     function Point(x, y) {
	     *       this.x = x;
	     *       this.y = y;
	     *     }
	     *
	     *     Point.prototype.toString = function() {
	     *       return 'new Point(' + this.x + ', ' + this.y + ')';
	     *     };
	     *
	     *     R.toString(new Point(1, 2)); //=> 'new Point(1, 2)'
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category String
	     * @sig * -> String
	     * @param {*} val
	     * @return {String}
	     * @example
	     *
	     *      R.toString(42); //=> '42'
	     *      R.toString('abc'); //=> '"abc"'
	     *      R.toString([1, 2, 3]); //=> '[1, 2, 3]'
	     *      R.toString({foo: 1, bar: 2, baz: 3}); //=> '{"bar": 2, "baz": 3, "foo": 1}'
	     *      R.toString(new Date('2001-02-03T04:05:06Z')); //=> 'new Date("2001-02-03T04:05:06.000Z")'
	     */
	    var toString = _curry1(function toString(val) {
	        return _toString(val, []);
	    });
	
	    /**
	     * Returns a new list without values in the first argument.
	     * `R.equals` is used to determine equality.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig [a] -> [a] -> [a]
	     * @param {Array} list1 The values to be removed from `list2`.
	     * @param {Array} list2 The array to remove values from.
	     * @return {Array} The new array without values in `list1`.
	     * @see R.transduce
	     * @example
	     *
	     *      R.without([1, 2], [1, 2, 1, 3, 4]); //=> [3, 4]
	     */
	    var without = _curry2(function (xs, list) {
	        return reject(flip(_contains)(xs), list);
	    });
	
	    // A simple Set type that honours R.equals semantics
	    /* globals Set */
	    /**
	       * Combines the logic for checking whether an item is a member of the set and
	       * for adding a new item to the set.
	       *
	       * @param item       The item to check or add to the Set instance.
	       * @param shouldAdd  If true, the item will be added to the set if it doesn't
	       *                   already exist.
	       * @param set        The set instance to check or add to.
	       * @return {boolean} When shouldAdd is true, this will return true when a new
	       *                   item was added otherwise false. When shouldAdd is false,
	       *                   this will return true if the item already exists, otherwise
	       *                   false.
	       */
	    // distinguish between +0 and -0
	    // these types can all utilise Set
	    // set._items['boolean'] holds a two element array
	    // representing [ falseExists, trueExists ]
	    // compare functions for reference equality
	    /* falls through */
	    // reduce the search size of heterogeneous sets by creating buckets
	    // for each type.
	    // scan through all previously applied items
	    var _Set = function () {
	        function _Set() {
	            /* globals Set */
	            this._nativeSet = typeof Set === 'function' ? new Set() : null;
	            this._items = {};
	        }
	        _Set.prototype.add = function (item) {
	            return hasOrAdd(item, true, this);
	        };
	        _Set.prototype.has = function (item) {
	            return hasOrAdd(item, false, this);
	        };
	        /**
	       * Combines the logic for checking whether an item is a member of the set and
	       * for adding a new item to the set.
	       *
	       * @param item       The item to check or add to the Set instance.
	       * @param shouldAdd  If true, the item will be added to the set if it doesn't
	       *                   already exist.
	       * @param set        The set instance to check or add to.
	       * @return {boolean} When shouldAdd is true, this will return true when a new
	       *                   item was added otherwise false. When shouldAdd is false,
	       *                   this will return true if the item already exists, otherwise
	       *                   false.
	       */
	        function hasOrAdd(item, shouldAdd, set) {
	            var type = typeof item;
	            var prevSize, newSize;
	            switch (type) {
	            case 'string':
	            case 'number':
	                // distinguish between +0 and -0
	                if (item === 0 && !set._items['-0'] && 1 / item === -Infinity) {
	                    if (shouldAdd) {
	                        set._items['-0'] = true;
	                    }
	                    return shouldAdd;
	                }
	                // these types can all utilise Set
	                if (set._nativeSet !== null) {
	                    if (shouldAdd) {
	                        prevSize = set._nativeSet.size;
	                        set._nativeSet.add(item);
	                        newSize = set._nativeSet.size;
	                        return newSize > prevSize;
	                    } else {
	                        return set._nativeSet.has(item);
	                    }
	                } else {
	                    if (!(type in set._items)) {
	                        if (shouldAdd) {
	                            set._items[type] = {};
	                            set._items[type][item] = true;
	                        }
	                        return shouldAdd;
	                    } else if (item in set._items[type]) {
	                        return !shouldAdd;
	                    } else {
	                        if (shouldAdd) {
	                            set._items[type][item] = true;
	                        }
	                        return shouldAdd;
	                    }
	                }
	            case 'boolean':
	                // set._items['boolean'] holds a two element array
	                // representing [ falseExists, trueExists ]
	                if (type in set._items) {
	                    var bIdx = item ? 1 : 0;
	                    if (set._items[type][bIdx]) {
	                        return !shouldAdd;
	                    } else {
	                        if (shouldAdd) {
	                            set._items[type][bIdx] = true;
	                        }
	                        return shouldAdd;
	                    }
	                } else {
	                    if (shouldAdd) {
	                        set._items[type] = item ? [
	                            false,
	                            true
	                        ] : [
	                            true,
	                            false
	                        ];
	                    }
	                    return shouldAdd;
	                }
	            case 'function':
	                // compare functions for reference equality
	                if (set._nativeSet !== null) {
	                    if (shouldAdd) {
	                        prevSize = set._nativeSet.size;
	                        set._nativeSet.add(item);
	                        newSize = set._nativeSet.size;
	                        return newSize > prevSize;
	                    } else {
	                        return set._nativeSet.has(item);
	                    }
	                } else {
	                    if (!(type in set._items)) {
	                        if (shouldAdd) {
	                            set._items[type] = [item];
	                        }
	                        return shouldAdd;
	                    }
	                    if (!_contains(item, set._items[type])) {
	                        if (shouldAdd) {
	                            set._items[type].push(item);
	                        }
	                        return shouldAdd;
	                    }
	                }
	                return !shouldAdd;
	            case 'undefined':
	                if (set._items[type]) {
	                    return !shouldAdd;
	                } else {
	                    if (shouldAdd) {
	                        set._items[type] = true;
	                    }
	                    return shouldAdd;
	                }
	            case 'object':
	                if (item === null) {
	                    if (!set._items['null']) {
	                        if (shouldAdd) {
	                            set._items['null'] = true;
	                        }
	                        return shouldAdd;
	                    }
	                    return !shouldAdd;
	                }
	            /* falls through */
	            default:
	                // reduce the search size of heterogeneous sets by creating buckets
	                // for each type.
	                type = Object.prototype.toString.call(item);
	                if (!(type in set._items)) {
	                    if (shouldAdd) {
	                        set._items[type] = [item];
	                    }
	                    return shouldAdd;
	                }
	                // scan through all previously applied items
	                if (!_contains(item, set._items[type])) {
	                    if (shouldAdd) {
	                        set._items[type].push(item);
	                    }
	                    return shouldAdd;
	                }
	                return !shouldAdd;
	            }
	        }
	        return _Set;
	    }();
	
	    /**
	     * A function wrapping calls to the two functions in an `&&` operation,
	     * returning the result of the first function if it is false-y and the result
	     * of the second function otherwise. Note that this is short-circuited,
	     * meaning that the second function will not be invoked if the first returns a
	     * false-y value.
	     *
	     * In addition to functions, `R.both` also accepts any fantasy-land compatible
	     * applicative functor.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category Logic
	     * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
	     * @param {Function} f a predicate
	     * @param {Function} g another predicate
	     * @return {Function} a function that applies its arguments to `f` and `g` and `&&`s their outputs together.
	     * @see R.and
	     * @example
	     *
	     *      var gt10 = x => x > 10;
	     *      var even = x => x % 2 === 0;
	     *      var f = R.both(gt10, even);
	     *      f(100); //=> true
	     *      f(101); //=> false
	     */
	    var both = _curry2(function both(f, g) {
	        return _isFunction(f) ? function _both() {
	            return f.apply(this, arguments) && g.apply(this, arguments);
	        } : lift(and)(f, g);
	    });
	
	    /**
	     * Takes a function `f` and returns a function `g` such that:
	     *
	     *   - applying `g` to zero or more arguments will give __true__ if applying
	     *     the same arguments to `f` gives a logical __false__ value; and
	     *
	     *   - applying `g` to zero or more arguments will give __false__ if applying
	     *     the same arguments to `f` gives a logical __true__ value.
	     *
	     * `R.complement` will work on all other functors as well.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category Logic
	     * @sig (*... -> *) -> (*... -> Boolean)
	     * @param {Function} f
	     * @return {Function}
	     * @see R.not
	     * @example
	     *
	     *      var isEven = n => n % 2 === 0;
	     *      var isOdd = R.complement(isEven);
	     *      isOdd(21); //=> true
	     *      isOdd(42); //=> false
	     */
	    var complement = lift(not);
	
	    /**
	     * A function wrapping calls to the two functions in an `||` operation,
	     * returning the result of the first function if it is truth-y and the result
	     * of the second function otherwise. Note that this is short-circuited,
	     * meaning that the second function will not be invoked if the first returns a
	     * truth-y value.
	     *
	     * In addition to functions, `R.either` also accepts any fantasy-land compatible
	     * applicative functor.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category Logic
	     * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
	     * @param {Function} f a predicate
	     * @param {Function} g another predicate
	     * @return {Function} a function that applies its arguments to `f` and `g` and `||`s their outputs together.
	     * @see R.or
	     * @example
	     *
	     *      var gt10 = x => x > 10;
	     *      var even = x => x % 2 === 0;
	     *      var f = R.either(gt10, even);
	     *      f(101); //=> true
	     *      f(8); //=> true
	     */
	    var either = _curry2(function either(f, g) {
	        return _isFunction(f) ? function _either() {
	            return f.apply(this, arguments) || g.apply(this, arguments);
	        } : lift(or)(f, g);
	    });
	
	    /**
	     * Turns a named method with a specified arity into a function that can be
	     * called directly supplied with arguments and a target object.
	     *
	     * The returned function is curried and accepts `arity + 1` parameters where
	     * the final parameter is the target object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig Number -> String -> (a -> b -> ... -> n -> Object -> *)
	     * @param {Number} arity Number of arguments the returned function should take
	     *        before the target object.
	     * @param {String} method Name of the method to call.
	     * @return {Function} A new curried function.
	     * @example
	     *
	     *      var sliceFrom = R.invoker(1, 'slice');
	     *      sliceFrom(6, 'abcdefghijklm'); //=> 'ghijklm'
	     *      var sliceFrom6 = R.invoker(2, 'slice')(6);
	     *      sliceFrom6(8, 'abcdefghijklm'); //=> 'gh'
	     */
	    var invoker = _curry2(function invoker(arity, method) {
	        return curryN(arity + 1, function () {
	            var target = arguments[arity];
	            if (target != null && is(Function, target[method])) {
	                return target[method].apply(target, _slice(arguments, 0, arity));
	            }
	            throw new TypeError(toString(target) + ' does not have a method named "' + method + '"');
	        });
	    });
	
	    /**
	     * Returns a string made by inserting the `separator` between each element and
	     * concatenating all the elements into a single string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig String -> [a] -> String
	     * @param {Number|String} separator The string used to separate the elements.
	     * @param {Array} xs The elements to join into a string.
	     * @return {String} str The string made by concatenating `xs` with `separator`.
	     * @see R.split
	     * @example
	     *
	     *      var spacer = R.join(' ');
	     *      spacer(['a', 2, 3.4]);   //=> 'a 2 3.4'
	     *      R.join('|', [1, 2, 3]);    //=> '1|2|3'
	     */
	    var join = invoker(1, 'join');
	
	    /**
	     * Creates a new function that, when invoked, caches the result of calling `fn`
	     * for a given argument set and returns the result. Subsequent calls to the
	     * memoized `fn` with the same argument set will not result in an additional
	     * call to `fn`; instead, the cached result for that set of arguments will be
	     * returned.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (*... -> a) -> (*... -> a)
	     * @param {Function} fn The function to memoize.
	     * @return {Function} Memoized version of `fn`.
	     * @example
	     *
	     *      var count = 0;
	     *      var factorial = R.memoize(n => {
	     *        count += 1;
	     *        return R.product(R.range(1, n + 1));
	     *      });
	     *      factorial(5); //=> 120
	     *      factorial(5); //=> 120
	     *      factorial(5); //=> 120
	     *      count; //=> 1
	     */
	    var memoize = _curry1(function memoize(fn) {
	        var cache = {};
	        return _arity(fn.length, function () {
	            var key = toString(arguments);
	            if (!_has(key, cache)) {
	                cache[key] = fn.apply(this, arguments);
	            }
	            return cache[key];
	        });
	    });
	
	    /**
	     * Splits a string into an array of strings based on the given
	     * separator.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category String
	     * @sig (String | RegExp) -> String -> [String]
	     * @param {String|RegExp} sep The pattern.
	     * @param {String} str The string to separate into an array.
	     * @return {Array} The array of strings from `str` separated by `str`.
	     * @see R.join
	     * @example
	     *
	     *      var pathComponents = R.split('/');
	     *      R.tail(pathComponents('/usr/local/bin/node')); //=> ['usr', 'local', 'bin', 'node']
	     *
	     *      R.split('.', 'a.b.c.xyz.d'); //=> ['a', 'b', 'c', 'xyz', 'd']
	     */
	    var split = invoker(1, 'split');
	
	    /**
	     * Determines whether a given string matches a given regular expression.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category String
	     * @sig RegExp -> String -> Boolean
	     * @param {RegExp} pattern
	     * @param {String} str
	     * @return {Boolean}
	     * @see R.match
	     * @example
	     *
	     *      R.test(/^x/, 'xyz'); //=> true
	     *      R.test(/^y/, 'xyz'); //=> false
	     */
	    var test = _curry2(function test(pattern, str) {
	        if (!_isRegExp(pattern)) {
	            throw new TypeError('\u2018test\u2019 requires a value of type RegExp as its first argument; received ' + toString(pattern));
	        }
	        return _cloneRegExp(pattern).test(str);
	    });
	
	    /**
	     * The lower case version of a string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category String
	     * @sig String -> String
	     * @param {String} str The string to lower case.
	     * @return {String} The lower case version of `str`.
	     * @see R.toUpper
	     * @example
	     *
	     *      R.toLower('XYZ'); //=> 'xyz'
	     */
	    var toLower = invoker(0, 'toLowerCase');
	
	    /**
	     * The upper case version of a string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category String
	     * @sig String -> String
	     * @param {String} str The string to upper case.
	     * @return {String} The upper case version of `str`.
	     * @see R.toLower
	     * @example
	     *
	     *      R.toUpper('abc'); //=> 'ABC'
	     */
	    var toUpper = invoker(0, 'toUpperCase');
	
	    /**
	     * Returns a new list containing only one copy of each element in the original
	     * list, based upon the value returned by applying the supplied function to
	     * each list element. Prefers the first item if the supplied function produces
	     * the same value on two items. `R.equals` is used for comparison.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig (a -> b) -> [a] -> [a]
	     * @param {Function} fn A function used to produce a value to use during comparisons.
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of unique items.
	     * @example
	     *
	     *      R.uniqBy(Math.abs, [-1, -5, 2, 10, 1, 2]); //=> [-1, -5, 2, 10]
	     */
	    var uniqBy = _curry2(function uniqBy(fn, list) {
	        var set = new _Set();
	        var result = [];
	        var idx = 0;
	        var appliedItem, item;
	        while (idx < list.length) {
	            item = list[idx];
	            appliedItem = fn(item);
	            if (set.add(appliedItem)) {
	                result.push(item);
	            }
	            idx += 1;
	        }
	        return result;
	    });
	
	    /**
	     * Returns the result of concatenating the given lists or strings.
	     *
	     * Dispatches to the `concat` method of the first argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a] -> [a]
	     * @sig String -> String -> String
	     * @param {Array|String} a
	     * @param {Array|String} b
	     * @return {Array|String}
	     *
	     * @example
	     *
	     *      R.concat([], []); //=> []
	     *      R.concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	     *      R.concat('ABC', 'DEF'); // 'ABCDEF'
	     */
	    var concat = flip(invoker(1, 'concat'));
	
	    /**
	     * Finds the set (i.e. no duplicates) of all elements contained in the first or
	     * second list, but not both.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` or `list2`, but not both.
	     * @see R.symmetricDifferenceWith
	     * @example
	     *
	     *      R.symmetricDifference([1,2,3,4], [7,6,5,4,3]); //=> [1,2,7,6,5]
	     *      R.symmetricDifference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5,1,2]
	     */
	    var symmetricDifference = _curry2(function symmetricDifference(list1, list2) {
	        return concat(difference(list1, list2), difference(list2, list1));
	    });
	
	    /**
	     * Finds the set (i.e. no duplicates) of all elements contained in the first or
	     * second list, but not both. Duplication is determined according to the value
	     * returned by applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [a] -> [a] -> [a]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` or `list2`, but not both.
	     * @see R.symmetricDifference
	     * @example
	     *
	     *      var eqA = R.eqBy(R.prop('a'));
	     *      var l1 = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
	     *      var l2 = [{a: 3}, {a: 4}, {a: 5}, {a: 6}];
	     *      R.symmetricDifferenceWith(eqA, l1, l2); //=> [{a: 1}, {a: 2}, {a: 5}, {a: 6}]
	     */
	    var symmetricDifferenceWith = _curry3(function symmetricDifferenceWith(pred, list1, list2) {
	        return concat(differenceWith(pred, list1, list2), differenceWith(pred, list2, list1));
	    });
	
	    /**
	     * Returns a new list containing only one copy of each element in the original
	     * list. `R.equals` is used to determine equality.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a]
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of unique items.
	     * @example
	     *
	     *      R.uniq([1, 1, 2, 1]); //=> [1, 2]
	     *      R.uniq([1, '1']);     //=> [1, '1']
	     *      R.uniq([[42], [42]]); //=> [[42]]
	     */
	    var uniq = uniqBy(identity);
	
	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of those
	     * elements common to both lists.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The list of elements found in both `list1` and `list2`.
	     * @see R.intersectionWith
	     * @example
	     *
	     *      R.intersection([1,2,3,4], [7,6,5,4,3]); //=> [4, 3]
	     */
	    var intersection = _curry2(function intersection(list1, list2) {
	        var lookupList, filteredList;
	        if (list1.length > list2.length) {
	            lookupList = list1;
	            filteredList = list2;
	        } else {
	            lookupList = list2;
	            filteredList = list1;
	        }
	        return uniq(_filter(flip(_contains)(lookupList), filteredList));
	    });
	
	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of the elements
	     * of each list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} as The first list.
	     * @param {Array} bs The second list.
	     * @return {Array} The first and second lists concatenated, with
	     *         duplicates removed.
	     * @example
	     *
	     *      R.union([1, 2, 3], [2, 3, 4]); //=> [1, 2, 3, 4]
	     */
	    var union = _curry2(compose(uniq, _concat));
	
	    var R = {
	        F: F,
	        T: T,
	        __: __,
	        add: add,
	        addIndex: addIndex,
	        adjust: adjust,
	        all: all,
	        allPass: allPass,
	        allUniq: allUniq,
	        always: always,
	        and: and,
	        any: any,
	        anyPass: anyPass,
	        ap: ap,
	        aperture: aperture,
	        append: append,
	        apply: apply,
	        applySpec: applySpec,
	        assoc: assoc,
	        assocPath: assocPath,
	        binary: binary,
	        bind: bind,
	        both: both,
	        call: call,
	        chain: chain,
	        clamp: clamp,
	        clone: clone,
	        comparator: comparator,
	        complement: complement,
	        compose: compose,
	        composeK: composeK,
	        composeP: composeP,
	        concat: concat,
	        cond: cond,
	        construct: construct,
	        constructN: constructN,
	        contains: contains,
	        converge: converge,
	        countBy: countBy,
	        curry: curry,
	        curryN: curryN,
	        dec: dec,
	        defaultTo: defaultTo,
	        difference: difference,
	        differenceWith: differenceWith,
	        dissoc: dissoc,
	        dissocPath: dissocPath,
	        divide: divide,
	        drop: drop,
	        dropLast: dropLast,
	        dropLastWhile: dropLastWhile,
	        dropRepeats: dropRepeats,
	        dropRepeatsWith: dropRepeatsWith,
	        dropWhile: dropWhile,
	        either: either,
	        empty: empty,
	        eqBy: eqBy,
	        eqProps: eqProps,
	        equals: equals,
	        evolve: evolve,
	        filter: filter,
	        find: find,
	        findIndex: findIndex,
	        findLast: findLast,
	        findLastIndex: findLastIndex,
	        flatten: flatten,
	        flip: flip,
	        forEach: forEach,
	        fromPairs: fromPairs,
	        groupBy: groupBy,
	        groupWith: groupWith,
	        gt: gt,
	        gte: gte,
	        has: has,
	        hasIn: hasIn,
	        head: head,
	        identical: identical,
	        identity: identity,
	        ifElse: ifElse,
	        inc: inc,
	        indexBy: indexBy,
	        indexOf: indexOf,
	        init: init,
	        insert: insert,
	        insertAll: insertAll,
	        intersection: intersection,
	        intersectionWith: intersectionWith,
	        intersperse: intersperse,
	        into: into,
	        invert: invert,
	        invertObj: invertObj,
	        invoker: invoker,
	        is: is,
	        isArrayLike: isArrayLike,
	        isEmpty: isEmpty,
	        isNil: isNil,
	        join: join,
	        juxt: juxt,
	        keys: keys,
	        keysIn: keysIn,
	        last: last,
	        lastIndexOf: lastIndexOf,
	        length: length,
	        lens: lens,
	        lensIndex: lensIndex,
	        lensPath: lensPath,
	        lensProp: lensProp,
	        lift: lift,
	        liftN: liftN,
	        lt: lt,
	        lte: lte,
	        map: map,
	        mapAccum: mapAccum,
	        mapAccumRight: mapAccumRight,
	        mapObjIndexed: mapObjIndexed,
	        match: match,
	        mathMod: mathMod,
	        max: max,
	        maxBy: maxBy,
	        mean: mean,
	        median: median,
	        memoize: memoize,
	        merge: merge,
	        mergeAll: mergeAll,
	        mergeWith: mergeWith,
	        mergeWithKey: mergeWithKey,
	        min: min,
	        minBy: minBy,
	        modulo: modulo,
	        multiply: multiply,
	        nAry: nAry,
	        negate: negate,
	        none: none,
	        not: not,
	        nth: nth,
	        nthArg: nthArg,
	        objOf: objOf,
	        of: of,
	        omit: omit,
	        once: once,
	        or: or,
	        over: over,
	        pair: pair,
	        partial: partial,
	        partialRight: partialRight,
	        partition: partition,
	        path: path,
	        pathEq: pathEq,
	        pathOr: pathOr,
	        pathSatisfies: pathSatisfies,
	        pick: pick,
	        pickAll: pickAll,
	        pickBy: pickBy,
	        pipe: pipe,
	        pipeK: pipeK,
	        pipeP: pipeP,
	        pluck: pluck,
	        prepend: prepend,
	        product: product,
	        project: project,
	        prop: prop,
	        propEq: propEq,
	        propIs: propIs,
	        propOr: propOr,
	        propSatisfies: propSatisfies,
	        props: props,
	        range: range,
	        reduce: reduce,
	        reduceBy: reduceBy,
	        reduceRight: reduceRight,
	        reduced: reduced,
	        reject: reject,
	        remove: remove,
	        repeat: repeat,
	        replace: replace,
	        reverse: reverse,
	        scan: scan,
	        sequence: sequence,
	        set: set,
	        slice: slice,
	        sort: sort,
	        sortBy: sortBy,
	        split: split,
	        splitAt: splitAt,
	        splitEvery: splitEvery,
	        splitWhen: splitWhen,
	        subtract: subtract,
	        sum: sum,
	        symmetricDifference: symmetricDifference,
	        symmetricDifferenceWith: symmetricDifferenceWith,
	        tail: tail,
	        take: take,
	        takeLast: takeLast,
	        takeLastWhile: takeLastWhile,
	        takeWhile: takeWhile,
	        tap: tap,
	        test: test,
	        times: times,
	        toLower: toLower,
	        toPairs: toPairs,
	        toPairsIn: toPairsIn,
	        toString: toString,
	        toUpper: toUpper,
	        transduce: transduce,
	        transpose: transpose,
	        traverse: traverse,
	        trim: trim,
	        tryCatch: tryCatch,
	        type: type,
	        unapply: unapply,
	        unary: unary,
	        uncurryN: uncurryN,
	        unfold: unfold,
	        union: union,
	        unionWith: unionWith,
	        uniq: uniq,
	        uniqBy: uniqBy,
	        uniqWith: uniqWith,
	        unless: unless,
	        unnest: unnest,
	        until: until,
	        update: update,
	        useWith: useWith,
	        values: values,
	        valuesIn: valuesIn,
	        view: view,
	        when: when,
	        where: where,
	        whereEq: whereEq,
	        without: without,
	        wrap: wrap,
	        xprod: xprod,
	        zip: zip,
	        zipObj: zipObj,
	        zipWith: zipWith
	    };
	  /* eslint-env amd */
	
	  /* TEST_ENTRY_POINT */
	
	  if (true) {
	    module.exports = R;
	  } else if (typeof define === 'function' && define.amd) {
	    define(function() { return R; });
	  } else {
	    this.R = R;
	  }
	
	}.call(this));


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }
	
	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};
	
	
	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }
	
	  if (process.noDeprecation === true) {
	    return fn;
	  }
	
	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }
	
	  return deprecated;
	};
	
	
	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};
	
	
	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;
	
	
	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};
	
	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};
	
	
	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];
	
	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}
	
	
	function stylizeNoColor(str, styleType) {
	  return str;
	}
	
	
	function arrayToHash(array) {
	  var hash = {};
	
	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });
	
	  return hash;
	}
	
	
	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }
	
	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }
	
	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);
	
	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }
	
	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }
	
	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }
	
	  var base = '', array = false, braces = ['{', '}'];
	
	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }
	
	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }
	
	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }
	
	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }
	
	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }
	
	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }
	
	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }
	
	  ctx.seen.push(value);
	
	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }
	
	  ctx.seen.pop();
	
	  return reduceToSingleString(output, base, braces);
	}
	
	
	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}
	
	
	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}
	
	
	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}
	
	
	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }
	
	  return name + ': ' + str;
	}
	
	
	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);
	
	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }
	
	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}
	
	
	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;
	
	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;
	
	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;
	
	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;
	
	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;
	
	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;
	
	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;
	
	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;
	
	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;
	
	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;
	
	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;
	
	exports.isBuffer = __webpack_require__(6);
	
	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	
	
	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}
	
	
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];
	
	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}
	
	
	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};
	
	
	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(7);
	
	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;
	
	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};
	
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(3)))

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 7 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	// FIXME: replace this with a real logging library -- winston?
	// log is a function that logs messages, and has a simple indent (.enter()) and
	// unindent (.exit()) feature.
	//
	// Usage:
	//   var log = require('./log.js')();
	//   log.enter('starting');
	//   ...
	//   log('another message');
	//   log.exit();  
	
	const logs = {};
	
	// Make a new logger, or return an existing one
	
	module.exports = function(_opts) {
	  opts = _opts || {};
	  const braces = ('braces' in opts) ? opts.braces : false;
	  const id = ('id' in opts) ? opts.id : Math.floor(Math.random() * 100000);
	  if (id in logs) return logs[id];
	
	  var log = function(...args) {
	    if (!log.enabled) return;
	    args.unshift('  '.repeat(log.indent));
	    console.log.apply(console, args);
	  };
	
	  log.indent = 0;
	  log.enabled = true;
	
	  log.enable = function() {
	    log.enabled = true;
	  };
	  log.disable = function() {
	    log.enabled = false;
	  };
	
	  log.enter = function(...args) {
	    if (!log.enabled) return;
	    if (braces) args.push('{');
	    log(...args);
	    log.indent++;
	  };
	
	  log.exit = function() {
	    if (!log.enabled) return;
	    log.indent--;
	    if (braces) log('}');
	  };
	
	  logs[id] = log;
	  return log;
	}
	
	


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// FIXME: When in a browser, defaults will be different (maybe, no defaults)
	"use strict";
	
	const C1 = __webpack_require__(1);
	const recipe = C1.recipe;
	const R = __webpack_require__(4);
	const process = __webpack_require__(3);
	const path = __webpack_require__(2);
	
	const log = __webpack_require__(8)({id: 'root'});
	log.disable();
	
	
	// Given a base directory, returns a function that resolves a path relative
	// to that base
	const resolveFrom = base => R.partial(path.resolve, [base]);
	
	module.exports = function() {
	  return {
	    configDirEnv: 'CONFIG1_DIR',
	
	    configDir: recipe(X=> {
	      const env = X.configDirEnv;
	      const rel = process.env[env] || process.cwd();
	      return path.resolve(rel);
	    }),
	
	    // The list of config filenames that are searched for first, in order from
	    // defaults -> overrides
	    basenames: [ 'config', 'config-local' ],
	
	    // List of valid filename suffixes
	    suffixes: [ '.js', '.json' ],
	
	    // List of filenames, which is the every combination of basenames and suffixes
	    filenames: recipe(X=> {
	      const mapcat2 = R.lift(R.curry((a, b) => a + b));
	      return mapcat2(X.basenames, X.suffixes);
	    }),
	
	    // List of absolute pathnames
	    pathnames: recipe(X=> {
	      const resolve = resolveFrom(X.configDir);
	      return R.map(resolve, X.filenames)
	    }),
	
	    // Environent variables. Setting this to the empty string or null will 
	    // disable looking for config info in the environment  
	    envPrefix: 'CONFIG1_',
	
	    // The source specification types we understand. The `sources` option is
	    // a list of source specifications, each of which is a plain object with a
	    // type property that matches the key here.
	    sourceTypes: {
	      file: {
	        makeSpec: pathname => {
	          return {
	            type: 'file',
	            pathname: pathname
	          };
	        },
	        specs: recipe(X=> {
	          const self = X.sourceTypes.file;
	          return X.pathnames ? R.map(self.makeSpec, X.pathnames) : null;
	        }),
	        fetch: function(srcspec) {
	          try {
	            return __webpack_require__(10)(srcspec.pathname);
	          }
	          catch(err) {}
	        },
	      },
	
	      envPrefix: {
	        makeSpec: prefix => ({
	          type: 'envPrefix',
	          prefix: prefix
	        }),
	        specs: recipe(X=> {
	          const self = X.sourceTypes.envPrefix;
	          return X.envPrefix ? [self.makeSpec(X.envPrefix)] : null;
	        }),
	        fetch: function(srcspec) {
	          // FIXME: implement!
	        },
	      },
	
	      envJson: {
	        makeSpec: name => ({
	          type: 'envJson',
	          name: name
	        }),
	        specs: recipe(X=> {
	          const self = X.sourceTypes.envJson;
	          return X.envJson ? [self.makeSpec(X.envPrefix)] : null;
	        }),
	        fetch: function(srcspec) {
	          // FIXME: implement!
	        },
	      },
	    },
	
	    // Put them all together
	    sources: recipe(X=> {
	      // FIXME: this needs to concatenate all the specs, rather than just these two
	      const stypes = X.sourceTypes;
	      const srcs = stypes.file.specs.concat(stypes.envPrefix.specs);
	      return srcs;
	    }),
	
	    // Function to take any source specification, and return the config data
	    // for that source. This closes over the root view -- I'm pretty
	    // sure that won't be a problem!
	    fetchSource: recipe(X=>
	      function(srcspec) {
	        const type = srcspec.type,
	              fetch = X.sourceTypes[type].fetch;
	        return fetch(srcspec);
	      }
	    ),
	  };
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./defaults": 9,
		"./defaults.js": 9,
		"./get-all-property-names": 11,
		"./get-all-property-names.js": 11,
		"./log": 8,
		"./log.js": 8,
		"./seed": 1,
		"./seed.js": 1
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 10;


/***/ },
/* 11 */
/***/ function(module, exports) {

	// This is a test file, used for study/experimentation.
	//
	// How much should we worry about inherited and/or non-enumerable properties?
	// Here's a function that gets all the properties of an object. There are a
	// lot. On the other hand, most of them probably come from Object.prototype,
	// and probably we could implement using the same mechanism: i.e. instantiate
	// a view_prototype for every c1.prototype, and append that to the *view's*
	// prototype chain.
	//
	// If we do proxy them, then the rule is that non-enumerable properties and 
	// inherited properties are always *atoms*.
	
	function getAllPropertyNames( obj ) {
	  var keys = {};
	  do {
	    Object.getOwnPropertyNames(obj).forEach(function(key) {
	      keys[key] = true;
	    });
	  } while (obj = Object.getPrototypeOf(obj));
	  return Object.keys(keys);
	}
	
	var A = function() { 
	  this.a_prop = 10; 
	  Object.defineProperty(this, 'a_nonEnum', {
	    enumerable: false, 
	    value: 25,
	  });
	};
	var Ap = A.prototype = {
	  ap_prop: 5, 
	};
	Object.defineProperty(Ap, 'ap_nonEnum', {
	  enumerable: false, 
	  value: 30,
	});
	
	var a = new A();
	console.log(getAllPropertyNames(a));


/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZTI4NTM5ZTgwNzE3MzVhNjZjNmIiLCJ3ZWJwYWNrOi8vLy4vc3JjL21haW4uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlZWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9wYXRoLWJyb3dzZXJpZnkvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9wcm9jZXNzL2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9kaXN0L3JhbWRhLmpzIiwid2VicGFjazovLy8uL34vdXRpbC91dGlsLmpzIiwid2VicGFjazovLy8uL34vdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIndlYnBhY2s6Ly8vLi9+L2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xvZy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZGVmYXVsdHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjIF5cXC5cXC8uKiQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2dldC1hbGwtcHJvcGVydHktbmFtZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7Ozs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEscUNBQWlDLFdBQVc7QUFDNUM7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtREFBa0Q7QUFDbEQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLLElBQUk7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrQjtBQUNBLElBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBLHNCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1AsTUFBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQSw0Q0FBMkM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBNkIsSUFBSTtBQUNqQzs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxJQUFHO0FBQ0g7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLHNCQUFxQiw4QkFBOEIsRTs7QUFFbkQ7QUFDQTtBQUNBO0FBQ0E7OztBQUdBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7O0FDM1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNULE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFlLE1BQU07QUFDckIsZ0JBQWUsUUFBUTtBQUN2QixpQkFBZ0IsRUFBRTtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTBCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiLFVBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNULE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZSxTQUFTO0FBQ3hCLGlCQUFnQixTQUFTO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxJQUFHO0FBQ0gsd0JBQXVCLFVBQVUsRUFBRTtBQUNuQyxJQUFHO0FBQ0g7QUFDQTs7QUFFQSxFQUFDOzs7Ozs7O0FDL2tSRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW1CLHNCQUFzQjtBQUN6QztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSCx3QkFBdUIsU0FBUztBQUNoQztBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw2Q0FBNEMsS0FBSzs7QUFFakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0EsTUFBSztBQUNMOztBQUVBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBLG9DQUFtQyxPQUFPO0FBQzFDO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQSwwREFBeUQ7QUFDekQ7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXO0FBQ1gsVUFBUztBQUNUO0FBQ0E7QUFDQSxZQUFXO0FBQ1g7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLFNBQVM7QUFDcEI7QUFDQSxZQUFXLFNBQVM7QUFDcEI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7OztBQ3prQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEU7Ozs7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQSxFQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNkJBQTRCO0FBQzVCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1QkFBc0I7QUFDdEI7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7QUNwREE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHFDQUFpQyxXQUFXO0FBQzVDOzs7QUFHQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLOztBQUVMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxRQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0EsVUFBUztBQUNULFFBQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsUUFBTztBQUNQLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFpQyx1REFBdUQ7QUFDeEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMLElBQUc7QUFDSDtBQUNBOztBQUVBLHFCO0FBQ0Esb0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFDOztBQUVEO0FBQ0EiLCJmaWxlIjoiY29uZmlnMS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgZTI4NTM5ZTgwNzE3MzVhNjZjNmJcbiAqKi8iLCIvKipcbiAqIFNpbmNlIGNvbmZpZy1vbmUgdXNlcyBpdHNlbGYgdG8gbWFuYWdlIGl0cyBvd24gb3B0aW9ucywgdGhlcmUgaXMgYVxuICogYml0IG9mIGEgY2hpY2tlbi1lZ2cgcHJvYmxlbS4gVGhlIGBzZWVkLmpzYCBtb2R1bGUgY29udGFpbnMgYWxsIG9mIHRoZVxuICogY29kZSB0aGF0IGRvZXNuJ3QgZGVwZW5kIG9uIGRlZmF1bHQgb3B0aW9ucyAoYWxtb3N0IGFsbCkuIEJvdGggYG1haW4uanNgLFxuICogaGVyZSBhbmQgYGRlZmF1bHRzLmpzYCByZXF1aXJlIGBzZWVkLmpzYC5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IHNlZWQgPSByZXF1aXJlKCcuL3NlZWQuanMnKTtcbmNvbnN0IGRlZmF1bHRzID0gcmVxdWlyZSgnLi9kZWZhdWx0cy5qcycpKCk7XG5cbnNlZWQucHJpdmF0ZS5kZWZhdWx0cyA9IGRlZmF1bHRzO1xuXG5jb25zdCBjb25maWcxID0gc2VlZC5uZXcoZGVmYXVsdHMpO1xubW9kdWxlLmV4cG9ydHMgPSBjb25maWcxO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9tYWluLmpzXG4gKiogbW9kdWxlIGlkID0gMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgcHJvY2VzcyA9IHJlcXVpcmUoJ3Byb2Nlc3MnKTtcbmNvbnN0IFIgPSByZXF1aXJlKCdyYW1kYScpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuY29uc3QgbG9nID0gcmVxdWlyZSgnLi9sb2cuanMnKSh7aWQ6ICdyb290J30pO1xubG9nLmRpc2FibGUoKTtcblxuXG4vLyB0ZW1wbGF0ZSAtIHByaXZhdGUgLSBUaGlzIGZ1bmN0aW9uIGlzIGNvcGllZCBmb3IgbmV3IGMxIGluc3RhbmNlcy4gVGhlIGJvZHlcbi8vIG9mIHRoaXMgZnVuY3Rpb24gaW1wbGVtZW50cyB0aGUgbWFpbiB1c2VyIEFQSS5cbmNvbnN0IHRlbXBsYXRlID0gZnVuY3Rpb24oLi4uYXJncykge1xuICBjb25zdCBjMSA9IHRoaXMuYzEsXG4gICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgbG9nLmVudGVyKCdzZWVkOnRlbXBsYXRlOiB3ZWxjb21lIG15IHNvbiwgbnVtIGFyZ3M6ICcgKyBhcmdzLmxlbmd0aCk7XG4gIHZhciByZXQ7XG5cbiAgLy8gSWYgdGhlcmUncyBqdXN0IG9uZSBhcmd1bWVudCB0aGF0IGlzIGEgRnVuY3Rpb24sIHRoZW4gdGhpcyBpcyBiZWluZyB1c2VkXG4gIC8vIGFzIGEgc2hvcnRjdXQgZm9yIGByZWNpcGVgLlxuICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJlxuICAgICAgYXJnc1swXSBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIG5vZGVUeXBlKGFyZ3NbMF0pICE9PSAncmVjaXBlJykge1xuICAgIHJldCA9IHJlY2lwZShhcmdzWzBdKTtcbiAgfVxuICBlbHNlIHtcbiAgICBsb2cuZW50ZXIoJ2NhbGxpbmcgcmVhZCcpO1xuICAgIHJldCA9IGMxLnJlYWQuYXBwbHkoYzEsIGMxLm9wdGlvbnMuc291cmNlcyk7XG4gIH1cblxuICBsb2cuZXhpdCgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuLy8gY2xvbmUoKSAtIHByaXZhdGUgLSBDcmVhdGUgYSBuZXcgYzEgb2JqZWN0LCBieSBtYWtpbmcgYSBjb3B5IG9mIHRlbXBsYXRlXG4vLyB3aXRoIGEgbmV3IGJpbmRpbmcuIFRoaXMgZG9lcyBub3Qgc2V0IHRoZSBvcHRpb25zLlxuY29uc3QgY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgLy8gQmluZCBjMSB0byBhIFwiYmFja1wiIG9iamVjdCBzbyBpdCBjYW4gZmluZCBpdHNlbGYgd2hlbiBpbnZva2VkLlxuICBjb25zdCBiYWNrID0ge307XG4gIGNvbnN0IGMxID0gdGVtcGxhdGUuYmluZChiYWNrKTtcbiAgYmFjay5jMSA9IGMxO1xuICBcbiAgLy8gTWl4IGluIHByb3BlcnRpZXMgYW5kIGJpbmQgbWV0aG9kc1xuICBSLmtleXMoQ29uZmlnMSkubWFwKGtleSA9PiB7XG4gICAgY29uc3QgdiA9IENvbmZpZzFba2V5XTtcbiAgICBjMVtrZXldID0gKHYgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB2LmJpbmQoYzEpIDogdjtcbiAgfSk7XG4gIHJldHVybiBjMTtcbn07XG5cbi8vIGMxLm5ldyhvcHRzKSAtIENyZWF0ZSBhIG5ldyBjMSBvYmplY3QgZnJvbSBhbiBleGlzdGluZyBvbmUsIG92ZXJyaWRpbmcgb3B0aW9uc1xuY29uc3QgX25ldyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgY29uc3QgYzEgPSB0aGlzO1xuICBjb25zdCBuZXh0ID0gY2xvbmUoKTtcblxuICAvLyBJZiBubyBvcHRzIHdlcmUgZ2l2ZW4sIHVzZSBhbiBlbXB0eSBvYmplY3QuIFRoaXMgZm9yY2VzIHRoZSBsaWJyYXJ5IHRvXG4gIC8vIGNyZWF0ZSBhIG5ldyB2aWV3LCB3aGljaCBtZWFucyBhbGwgcmVjaXBlcyAod2hpY2ggbWlnaHQgZGVwZW5kIG9uIGVudi5cbiAgLy8gdmFyaWFibGVzLCBmb3IgaW5zdGFuY2UpIHdpbGwgZ2V0IHJlLWV2YWx1YXRlZC5cbiAgbmV4dC5vcHRpb25zID0gYzEuZXh0ZW5kKGMxLm9wdGlvbnMsIChvcHRzIHx8IHt9KSk7XG4gIHJldHVybiBuZXh0O1xufTtcblxuLy8gVHJhdmVyc2UtdHlwZSB1dGlsaXRpZXMuIFxuLy8gRklYTUU6IEkgd2FudCB0byBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlIHJvdXRpbmVzIGhlcmUgdXNlIHRoZSBzYW1lXG4vLyBsb3dlci1sZXZlbCBmdW5jdGlvbnMsIHNvIHRoYXQgdGhleSBhbGwgYWdyZWUgb24gZXhhY3RseSBob3cgdGhleSBkZWFsXG4vLyB3aXRoIHZhcmlvdXMgcHJvcGVydGllcyBhbmQgYXR0cmlidXRlcy5cblxuLy8gdmlzaXQgZXZlcnkgbm9kZSBpbiBhIGNvbmZpZyBvYmplY3QgKHdpdGhvdXQgZXZhbHVhdGluZyByZWNpcGVzKSBvclxuLy8gYSB2aWV3LCBydW5uaW5nIHByZS0gYW5kIHBvc3QtdHJhdmVyc2FsIGZ1bmN0aW9ucyBvbiBlYWNoLlxuY29uc3Qgd2FsayA9IFIuY3VycnkoKHByZSwgcG9zdCwgdHJlZSkgPT4ge1xuICBwcmUodHJlZSk7XG4gIE9iamVjdC5rZXlzKHRyZWUpLm1hcCh3YWxrKHByZSwgcG9zdCkpO1xuICBwb3N0KHRyZWUpO1xufSk7XG5cbi8vIFF1aWNrIGFuZCBkaXJ0eSBkZWVwIGVxdWFscy5cblxuLy8gY29tcGFyZSB0eXBlcywgY29uc2lkZXJpbmcgdmlldyBhbmQgb2JqZWN0IHRvIGJlIHRoZSBzYW1lXG5jb25zdCBjbXBUeXBlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjb25zdCB0ID0gbm9kZVR5cGUoaXRlbSk7XG4gIHJldHVybiB0ID09ICd2aWV3JyA/ICdvYmplY3QnIDogdDtcbn07XG5cbmNvbnN0IGRlZXBFcXVhbCA9IChhY3R1YWwsIGV4cGVjdGVkKSA9PiB7XG4gIGNvbnN0IHRhID0gY21wVHlwZShhY3R1YWwpLFxuICAgICAgICB0YiA9IGNtcFR5cGUoZXhwZWN0ZWQpO1xuICBpZiAodGEgIT09IHRiKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0YSA9PT0gJ3JlY2lwZScpIHJldHVybiBhY3R1YWwgPT09IGV4cGVjdGVkO1xuICBpZiAodGEgPT09ICdhdG9tJykge1xuICAgIHJldHVybiAoYWN0dWFsID09IGV4cGVjdGVkKTtcbiAgfVxuXG4gIGNvbnN0IGFLZXlzID0gT2JqZWN0LmtleXMoYWN0dWFsKTtcbiAgY29uc3QgZUtleXMgPSBPYmplY3Qua2V5cyhleHBlY3RlZCk7XG4gIGlmIChhS2V5cy5sZW5ndGggIT0gZUtleXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIGFLZXlzLm1hcChmdW5jdGlvbihrKSB7XG4gICAgaWYgKCEoayBpbiBleHBlY3RlZCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIWRlZXBFcXVhbChhY3R1YWxba10sIGV4cGVjdGVkW2tdKSkgcmV0dXJuIGZhbHNlO1xuICB9KTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyDinJMgaGFzIHRlc3QuXG4vLyBDcmVhdGUgYSBuZXcgYXJyYXkgaWYgaXQgZG9lc24ndCBleGlzdCBhbHJlYWR5LCBhbmQgcHVzaCBhIHZhbHVlIGludG8gaXQuXG5jb25zdCBhZ2dyZWdhdGUgPSBmdW5jdGlvbihhY2MsIHZhbHVlKSB7XG4gIGNvbnN0IF9hY2MgPSBhY2MgfHwgW107XG4gIF9hY2MucHVzaCh2YWx1ZSk7XG4gIHJldHVybiBfYWNjO1xufTtcblxuLy8g4pyTIHRlc3QtbG93LWxldmVsXG4vLyBGb3IgZXZlcnkga2V5IGluIG9iaiwgYWdncmVnYXRlcyBpdCB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlIGluIHRoZVxuLy8gYWNjdW11bGF0b3IuIFRoZSBhY2N1bXVsYXRvcidzIHZhbHVlcyBhcmUgYXJyYXlzXG5jb25zdCBhZ2dPYmplY3RzID0gZnVuY3Rpb24oYWNjLCBvYmopIHtcbiAgUi5rZXlzKG9iaikubWFwKGtleSA9PiB7XG4gICAgYWNjW2tleV0gPSBhZ2dyZWdhdGUoYWNjW2tleV0sIG9ialtrZXldKTtcbiAgfSk7XG4gIHJldHVybiBhY2M7XG59O1xuXG4vLyDinJMgdGVzdC1sb3ctbGV2ZWxcbi8vIEdpdmVuIGEgbGlzdCBvZiBvYmplY3RzLCByZXR1cm4gYSBuZXcgb2JqZWN0IHdob3NlIGtleXMgYXJlIHRoZSB1bmlvbiBvZlxuLy8gYWxsIG9mIHRoZSBrZXlzIGluIHRoZSBsaXN0LCBhbmQgd2hvc2UgdmFsdWVzIGFyZSBhcnJheXMgb2YgYWxsIHRoZSB2YWx1ZXNcbi8vIHRoYXQgb2NjdXIgZm9yIHRoYXQga2V5LiBJbiBvdGhlciB3b3JkcywgdGhpcyB0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIGludG9cbi8vIGFuIG9iamVjdCBvZiBhcnJheXMuXG5jb25zdCBhZ2dBbGxPYmplY3RzID0gZnVuY3Rpb24ob2JqZWN0cykge1xuICByZXR1cm4gUi5yZWR1Y2UoXG4gICAgZnVuY3Rpb24gKGFjYywgb2JqKSB7XG4gICAgICByZXR1cm4gYWdnT2JqZWN0cyhhY2MsIG9iaik7XG4gICAgfSwge30sIG9iamVjdHNcbiAgKTtcbn07XG5cbi8vIOKckyB0ZXN0LWxvdy1sZXZlbFxuLy8gQ3JlYXRlcyBhIG1hcHBpbmcgb2YgYW4gYXJyYXkgb2Ygb2JqZWN0cy4gVGhlIHNldCBvZiBrZXlzIGlzIHRoZSB1bmlvbiBvZlxuLy8gdGhlIHNldHMgb2YgYWxsIG9mIHRoZSBrZXlzIGluIG9iamVjdHMuIFRoZSB2YWx1ZXMgYXJlIGFycmF5cyBvZiB0aGUgdmFsdWVzXG4vLyBmcm9tIHRoZSBvYmplY3RzIHRoYXQgaGF2ZSB0aG9zZSBrZXlzLlxuY29uc3QgX21hcHBpbmcgPSBmdW5jdGlvbihvYmplY3RzKSB7XG4gIHJldHVybiBhZ2dBbGxPYmplY3RzKG9iamVjdHMpO1xufTtcblxuLy8gYzEucmVhZCguLi5zb3VyY2VTcGVjaWZpZXJzKSAtIENvbnN0cnVjdCBhIG5ldyByb290IHZpZXcgZnJvbSBhIGxpc3Rcbi8vIG9mIHNvdXJjZSBzcGVjaWZpZXJzLiBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGludm9rZXMgdGhlIG1haW4gbW9kdWxlXG4vLyBmdW5jdGlvbiB3aXRoIG5vIGFyZ3VtZW50cy4gSW4gdGhhdCBjYXNlLCB0aGUgc291cmNlU3BlY2lmaWVycyBhcmUgZ2VuZXJhdGVkXG4vLyBmcm9tIHRoZSBkZWZhdWx0IG9wdGlvbnMuXG4vLyBTb3VyY2VzIGFyZSBpbiB0aGUgb3JkZXIgZnJvbSBkZWZhdWx0cyB0b1xuLy8gb3ZlcnJpZGVzLiAoVGhhdCdzIHBlciB0aGUgdXNlciBBUEkuIFRoZSBmaXJzdCB0aGluZyB3ZSBkbyBpcyByZXZlcnNlIHRoZW07XG4vLyBpbnRlcm5hbGx5IHRoZXkgYXJlIGFsd2F5cyBpbiB0aGUgb3JkZXIgb2YgaGlnaGVzdC1wcmVjZWRlbmNlIG92ZXJyaWRlXG4vLyBmaXJzdC4pXG4vLyBJZiBub25lIG9mIHRoZSBzb3VyY2VzIHJlc29sdmUgdG8gYW55IGNvbmZpZyBkYXRhIG9iamVjdHMsIHRoaXMgcmV0dXJucyBudWxsLlxuY29uc3QgcmVhZCA9IGZ1bmN0aW9uKC4uLnNwZWNzKSB7XG4gIGNvbnN0IGMxID0gdGhpcztcblxuICAvLyBSZXZlcnNlIHRoZW0sIHRvIGdldCB0aGVtIGludG8gXCJpbnRlcm5hbFwiIG9yZGVyXG4gIGNvbnN0IHJzcGVjcyA9IFIucmV2ZXJzZShzcGVjcyk7XG5cbiAgLy8gRmV0Y2ggdGhlIHJlYWwgc291cmNlcyBmcm9tIHRoZSB1c2VyLXN1cHBsaWVkIHNvdXJjZS1zcGVjaWZpZXJzLlxuICBjb25zdCBfc291cmNlcyA9IHJzcGVjcy5tYXAoc3BlYyA9PiBjMS5vcHRpb25zLmZldGNoU291cmNlKHNwZWMpKTtcbiAgY29uc3Qgc291cmNlcyA9IF9zb3VyY2VzLmZpbHRlcihzID0+ICEhcyk7XG5cbiAgY29uc3Qgcm9vdCA9IChzb3VyY2VzLmxlbmd0aCA9PSAwKSA/IG51bGwgOiAoKCk9PiB7XG4gICAgY29uc3QgX3Jvb3QgPSBuZXdWaWV3KG51bGwsIHNvdXJjZXMsIG51bGwsIDApO1xuXG4gICAgY29uc3QgZGF0YSA9IF9yb290Ll9fY29uZmlnMV9fO1xuICAgIGRhdGEucm9vdCA9IF9yb290O1xuICAgIGRhdGEuYzEgPSBjMTtcbiAgICByZXR1cm4gX3Jvb3Q7ICAgIFxuICB9KSgpO1xuXG4gIHJldHVybiByb290O1xufTtcblxuLy8gYzEuZXh0ZW5kKC4uLmNvbmZpZ3MpIC0gdGhlIGFyZ3VtZW50cyBhcmUgY29uZmlnIG9iamVjdHMsIHRoYXQgYXJlIG1lcmdlZFxuLy8gdG9nZXRoZXIgaW4gb3JkZXIgZnJvbSBkZWZhdWx0cyB0byBoaWdoZXItcHJlY2VkZW5jZSBvdmVycmlkZXMuXG5jb25zdCBleHRlbmQgPSBmdW5jdGlvbiguLi5jb25maWdzKSB7XG4gIGNvbnN0IGMxID0gdGhpcztcblxuICAvLyBSZXZlcnNlIHRoZW0sIHRvIGdldCB0aGVtIGludG8gXCJpbnRlcm5hbFwiIG9yZGVyXG4gIGNvbnN0IHJjb25maWdzID0gUi5yZXZlcnNlKGNvbmZpZ3MpO1xuXG4gIC8vIElmIGFuIGl0ZW0gaXMgYSB2aWV3LCByZXBsYWNlIGl0IHdpdGggaXRzIG9yaWdpbmFsIHNvdXJjZXNcbiAgY29uc3QgZ2V0U291cmNlcyA9IGl0ZW0gPT5cbiAgICAobm9kZVR5cGUoaXRlbSkgPT09ICd2aWV3JykgPyBpdGVtLl9fY29uZmlnMV9fLnNvdXJjZXMgOiBpdGVtO1xuXG4gIC8vIElmIGFueSBhcmUgdmlld3MsIHJlcGxhY2UgdGhlbSB3aXRoIHRoZWlyIG9yaWdpbmFsIHNvdXJjZXNcbiAgY29uc3Qgc291cmNlR3JvdXBzID0gUi5tYXAoZ2V0U291cmNlcywgcmNvbmZpZ3MpO1xuXG4gIC8vIEZsYXR0ZW4gaW50byBhIHNpbmdsZSBhcnJheVxuICBjb25zdCBzb3VyY2VzID0gUi5mbGF0dGVuKHNvdXJjZUdyb3Vwcyk7XG5cbiAgLy8gV3JhcCB0aGVtIGluIGEgdmlld1xuICBjb25zdCByb290ID0gbmV3VmlldyhudWxsLCBzb3VyY2VzLCBudWxsLCAwKSxcbiAgICAgICAgZGF0YSA9IHJvb3QuX19jb25maWcxX187XG4gIGRhdGEucm9vdCA9IHJvb3Q7XG4gIGRhdGEuYzEgPSBjMTtcbiAgcmV0dXJuIHJvb3Q7XG59O1xuXG4vLyBJZiBzcmNub2RlIGlzIG9mIGByZWNpcGVgIHR5cGUsIGV2YWx1YXRlIGl0IHJlY3Vyc2l2ZWx5LCB1bnRpbCB5b3UgZ2V0XG4vLyBzb21ldGhpbmcgdGhhdCdzIG5vdC5cbmNvbnN0IGNvb2sgPSBmdW5jdGlvbihyb290LCBzcmNub2RlKSB7XG4gIGNvbnN0IHQgPSBub2RlVHlwZShzcmNub2RlKTtcbiAgY29uc3QgY29va2VkID0gKHQgPT09ICdyZWNpcGUnKSA/XG4gICAgLy8gdXNlIGAuY2FsbChyb290LCByb290KWAgc28gYHJvb3RgIGlzIGJvdW5kIHRvIGB0aGlzYCBpbnNpZGUgdGhlIHJlY2lwZVxuICAgIGNvb2socm9vdCwgc3Jjbm9kZS5ldmFsLmNhbGwocm9vdCwgcm9vdCkpIDogc3Jjbm9kZTtcbiAgcmV0dXJuIGNvb2tlZDtcbn07XG5cbi8vIENvb2sgYWxsIHRoZSByZWNpcGVzIGluc2lkZSBhIHNldCBvZiBzb3VyY2VzXG5jb25zdCBjb29rQWxsID0gZnVuY3Rpb24ocm9vdCwgc291cmNlcykge1xuICBjb25zdCBjb29rZWQgPSBzb3VyY2VzLm1hcChzcmNub2RlID0+IGNvb2socm9vdCwgc3Jjbm9kZSkpXG4gIHJldHVybiBjb29rZWQ7XG59O1xuXG4vLyBuZXdWaWV3IC0gdGhlIGhlYXJ0IG9mIHRoZSBhbGdvcml0aG0gZm9yIG1hbmFnaW5nIHRoZSB2aWV3LlxuLy8gU291cmNlcyBhcmUgaW4gXCJpbnRlcm5hbFwiIG9yZGVyOiBoaWdoZXN0IHByZWNlZGVuY2UgZmlyc3QuIFRoZSBzb3VyY2Ugbm9kZXNcbi8vIGNhbiBiZSBvZiBhbnkgdHlwZTogYXRvbSwgb2JqZWN0LCByZWNpcGUsIG9yIHZub2RlLlxuY29uc3QgbmV3VmlldyA9IGZ1bmN0aW9uKHJvb3QsIHNvdXJjZXMsIGtleSwgZGVwdGgpIHtcbiAgLy8gQ29vayB0aGUgcmVjaXBlcywgZm9yIGFsbCBvZiB0aGUgdG9wLWxldmVsIG5vZGVzIG9mIGVhY2ggb2YgdGhlIHNvdXJjZXNcbiAgLy8gaW4gdGhlIGxpc3RcbiAgLy8gRklYTUU6IGZvciBub3csIHJlY2lwZXMgY2Fubm90IGJlIGF0IHRoZSByb290LiBJJ2QgbGlrZSB0byBtYWtlIHRoYXQgYW5cbiAgLy8gb3B0aW9uLiBJZiBzbywgdGhlIGNvbnRleHQgd2lsbCBiZSB0aGUgYzEgb2JqZWN0IGl0c2VsZi5cbiAgY29uc3QgY29va2VkID0gcm9vdCA/IGNvb2tBbGwocm9vdCwgc291cmNlcykgOiBzb3VyY2VzO1xuXG4gIC8vIEZJWE1FOiBNYWtlIGFuIG9wdGlvbiBmb3IgdGhlIHVzZXIgdG8gcGFzcyBpbiBhIHZhbGlkYXRvciB0aGF0IGdldHMgYXBwbGllZFxuICAvLyBoZXJlLiBPbmUgXCJjYW5uZWRcIiB2YWxpZGF0b3IgbWlnaHQgYmUgb25lIHRoYXQgXG4gIC8vIG1hZGUgc3VyZSB0aGF0IGFuIGl0ZW0gaXMgbm90IGdldHRpbmcgb3ZlcnJpZGRlbiBieSBcbiAgLy8gc29tZXRoaW5nIG9mIGEgZGlmZmVyZW50IHR5cGVcbiAgY29uc3QgaXRlbSA9IGNvb2tlZFswXTtcbiAgY29uc3QgdCA9IG5vZGVUeXBlKGl0ZW0pO1xuXG4gIC8vIFRoZSBub2RlIG11c3QgYmUgZWl0aGVyIGFuIGF0b20sIHZpZXcsIG9yIG9iamVjdC4gSWYgaXQncyBhbiBhdG9tIG9yIHZpZXcsXG4gIC8vIHdlJ2xsIGp1c3QgcmV0dXJuIGl0IGFzLWlzLiBPdGhlcndpc2UgLi4uXG4gIGNvbnN0IHZub2RlID0gKFxuICAgIHQgIT09ICdvYmplY3QnID8gaXRlbSA6XG4gICAgICBpdGVtIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9XG4gICk7XG5cbiAgaWYgKHQgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSByZWFsIHJvb3RcbiAgICBjb25zdCBfcm9vdCA9IHJvb3QgPyByb290IDogdm5vZGU7XG5cbiAgICAvLyBNYWtlIHRoZSBtYXBwaW5nIGZvciBhbGwgb2YgdGhlIGtleXMgdG8gdGhlIGxpc3RzIG9mIHNvdXJjZXMgZm9yIHRoYXQga2V5LlxuICAgIGNvbnN0IG1hcHBpbmcgPSBfbWFwcGluZyhjb29rZWQpO1xuXG4gICAgLy8gQWRkIGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgX19jb25maWcxX18gdG8gdGhlIHZpZXcsIHRvIHN0b3JlIHZhcmlvdXNcbiAgICAvLyBkYXRhLCBhbmQga2VlcCBpdCBmcm9tIGNvbGxpZGluZyB3aXRoIHRoZSBzb3VyY2UncyBwcm9wZXJ0eSBuYW1lcy5cbiAgICAvLyBGSVhNRTogdXNlIGFuIEVTNiBTeW1ib2wgZm9yIHRoaXMgLS0gYXJlIHRoZXJlIGdvb2QgcG9seWZpbGxzP1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICByb290OiBfcm9vdCxcbiAgICAgIGtleToga2V5LFxuICAgICAgZGVwdGg6IGRlcHRoLFxuICAgICAgbWFwcGluZzogbWFwcGluZyxcbiAgICAgIHNvdXJjZXM6IHNvdXJjZXMsXG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodm5vZGUsICdfX2NvbmZpZzFfXycsIHtcbiAgICAgIF9fcHJvdG9fXzogbnVsbCxcbiAgICAgIHZhbHVlOiBkYXRhLFxuICAgIH0pO1xuXG4gICAgLy8gTWFrZSB0aGUgZ2V0dGVycy5cbiAgICAvLyBDb250cmFjdDogYSBnZXR0ZXIgYWx3YXlzIHJldHVybnMgYW4gYXRvbSBvciBhIHZpZXcgKG5ldmVyXG4gICAgLy8gYSBzb3VyY2Ugb2JqZWN0IG9yIGEgcmVjaXBlKS5cbiAgICBjb25zdCBtZW1vcyA9IHt9OyAgLy8gbWVtb2l6ZSByZXN1bHRzXG4gICAgUi5rZXlzKG1hcHBpbmcpLm1hcChmdW5jdGlvbiAoY2hpbGRLZXkpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bm9kZSwgY2hpbGRLZXksIHtcbiAgICAgICAgX19wcm90b19fOiBudWxsLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoIShjaGlsZEtleSBpbiBtZW1vcykpIHtcbiAgICAgICAgICAgIG1lbW9zW2NoaWxkS2V5XSA9XG4gICAgICAgICAgICAgIG5ld1ZpZXcoX3Jvb3QsIG1hcHBpbmdbY2hpbGRLZXldLCBjaGlsZEtleSwgZGVwdGggKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1lbW9zW2NoaWxkS2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHZub2RlO1xufTtcblxuLy8gbm9kZVR5cGUgLSBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgYSBub2RlOyBvbmUgb2Y6IGF0b20sXG4vLyBvYmplY3QsIHJlY2lwZSwgb3Igdmlldy5cbmNvbnN0IG5vZGVUeXBlID0gZnVuY3Rpb24obm9kZSkge1xuICBpZiAoIW5vZGUgfHwgdHlwZW9mIG5vZGUgIT09ICdvYmplY3QnKSByZXR1cm4gJ2F0b20nO1xuICBpZiAodHlwZW9mIG5vZGUgPT09ICdvYmplY3QnICYmICdfX2NvbmZpZzFfXycgaW4gbm9kZSkgcmV0dXJuICd2aWV3JztcbiAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gJ2F0b20nO1xuICAvLyBUaGUgdGVzdCBmb3IgUmVjaXBlIGFkZHJlc3NlcyB0aGUgY29uY2VybiBpbiB0aGlzIFBSIChidXQgaXQncyBub3RcbiAgLy8gYSBjb21wbGV0ZSBmaXgpOiBodHRwczovL2dpdGh1Yi5jb20vbG9yZW53ZXN0L25vZGUtY29uZmlnL3B1bGwvMjA1LlxuICAvLyBGSVhNRTogSSB0aGluayB1c2luZyBhbiBFUzYgU3ltYm9sIHdvdWxkIHdvcmsgaGVyZS5cbiAgaWYgKG5vZGUgaW5zdGFuY2VvZiBSZWNpcGUgfHxcbiAgICAoKCdjb25zdHJ1Y3RvcicgaW4gbm9kZSkgJiYgKG5vZGUuY29uc3RydWN0b3IubmFtZSA9PT0gJ1JlY2lwZScpKSlcbiAgICByZXR1cm4gJ3JlY2lwZSc7XG4gIHJldHVybiAnb2JqZWN0Jztcbn07XG5cbi8vIFJlY2lwZSBjbGFzc1xudmFyIFJlY2lwZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgdGhpcy5ldmFsID0gZnVuYztcbn07XG5cbi8vIHJlY2lwZShmdW5jKSBmdW5jdGlvbiAtIHBhcnQgb2YgdGhlIEFQSS5cbi8vIFRoaXMgaXMgYSBSZWNpcGUgZmFjdG9yeSwgaXQgaXMgZXhwb3NlZCBmb3IgdXNlIGluIHRoZSBzb3VyY2UgZGF0YSB0cmVlIHRvXG4vLyB3cmFwIGZ1bmN0aW9ucywgdHVybmluZyB0aGVtIGludG8gcmVjaXBlcy5cbnZhciByZWNpcGUgPSBmdW5jdGlvbihmdW5jKSB7XG4gIHJlY2lwZUNvdW50Kys7XG4gIHJldHVybiBuZXcgUmVjaXBlKGZ1bmMpO1xufTtcblxuLy8gS2VlcCBhIGNvdW50IG9mIHRoZSB0b3RhbCBudW1iZXIgb2YgcmVjaXBlcyBjcmVhdGVkXG4vLyBGSVhNRTogcHV0IGJhY2sgaW4gdGhlIGZlYXR1cmUgdGhhdCBjaGVja3MgZm9yIHRoaXMsIGFuZCBpZiBpdCdzIHplcm8sXG4vLyBkb2Vzbid0IHdhbGsgdGhlIHRyZWUuXG52YXIgcmVjaXBlQ291bnQgPSAwO1xuXG5cbi8vIFV0aWxpdGllc1xuLy8tLS0tLS0tLS0tXG5cbi8vIGZyZWV6ZVxuXG4vLyBGSVhNRTogdGhpcyBpcyBub3QgdGhvcm91Z2hseSB0ZXN0ZWQgeWV0LlxudmFyIGZyZWV6ZSA9IGZ1bmN0aW9uKGNmZykge1xuICByZXR1cm4gKGZ1bmN0aW9uIF9mcmVlemUoY2ZnLCBrZXkpIHtcbiAgICB2YXIgdCA9IG5vZGVUeXBlKGNmZyk7XG4gICAgY29uc3Qga2V5c3RyID0gKGtleSA/IGAke2tleX06IGAgOiAnJyk7XG4gICAgdmFyIHJldCA9IGNmZztcblxuICAgIGlmICh0ID09PSAnYXRvbScpIHtcbiAgICB9XG5cbiAgICBlbHNlIGlmICh0ID09PSAndmlldycpIHtcbiAgICAgIC8vIEZJWE1FOiBuZWVkIHRvIGNsb25lIGEgZnVuY3Rpb24gbWF5YmVcbiAgICAgIHJldCA9IChjZmcgaW5zdGFuY2VvZiBBcnJheSkgPyBbXSA6IHt9O1xuICAgICAgT2JqZWN0LmtleXMoY2ZnKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgICAgcmV0W2tdID0gX2ZyZWV6ZShjZmdba10sIGspO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gc2hvdWxkIGJlIG5vbmUgb2YgdGhlc2U6XG4gICAgZWxzZSBpZiAodCA9PT0gJ29iamVjdCcgfHwgdCA9PSAncmVjaXBlJykge1xuICAgICAgY29uc29sZS5lcnJvcignVmVyeSBzdHJhbmdlIGluZGVlZCEnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KShjZmcpO1xufTtcblxuLy8gUHJldHR5LXByaW50ZXJcblxuLy8gY29uZmlnIG9iamVjdCAtPiBzdHJpbmdcbmNvbnN0IHBwU3RyaW5nID0gb2JqID0+IFxuICB1dGlsLmluc3BlY3Qob2JqLCB7c2hvd0hpZGRlbjogdHJ1ZSwgZGVwdGg6IG51bGx9KTsgIFxuXG4vLyBjb25maWcgb2JqZWN0IC0+IHByaW50IHRvIHN0ZG91dFxuY29uc3QgcHBDb25zb2xlID0gY2ZnID0+IHtcbiAgY29uc29sZS5sb2cocHBTdHJpbmcoZnJlZXplKGNmZykpKTtcbn07XG5cblxuLy8gUHJlcGFyZSBleHBvcnRzXG5cbi8vIEV4cG9zZSB0aGUgcHJpdmF0ZSBmdW5jdGlvbnMgaW4gYSBgcHJpdmF0ZWAgcHJvcGVydHksIGZvciB1bml0IHRlc3RzXG5jb25zdCBfcHJpdmF0ZSA9IHtcbiAgYWdnQWxsT2JqZWN0czogYWdnQWxsT2JqZWN0cyxcbiAgYWdnT2JqZWN0czogYWdnT2JqZWN0cyxcbiAgYWdncmVnYXRlOiBhZ2dyZWdhdGUsXG4gIGNsb25lOiBjbG9uZSxcbiAgbWFwcGluZzogX21hcHBpbmcsXG4gIFJlY2lwZTogUmVjaXBlLFxuICByZWNpcGVDb3VudDogcmVjaXBlQ291bnQsXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgbm9kZVR5cGU6IG5vZGVUeXBlLFxufTtcblxuY29uc3QgQ29uZmlnMSA9IHtcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIG5ldzogX25ldyxcbiAgcmVhZDogcmVhZCxcbiAgcHJpdmF0ZTogX3ByaXZhdGUsXG4gIHJlY2lwZTogcmVjaXBlLFxuICBmcmVlemU6IGZyZWV6ZSxcbiAgcHBTdHJpbmc6IHBwU3RyaW5nLFxuICBwcENvbnNvbGU6IHBwQ29uc29sZSxcbiAgd2Fsazogd2FsayxcbiAgZGVlcEVxdWFsOiBkZWVwRXF1YWwsXG59O1xuXG4vLyBDMS5zZWVkIC0gVGhlIG9yaWdpbmFsIEMxIG9iamVjdCwgZnJvbSB3aGljaCBhbGwgb3RoZXJzIGRlcml2ZS4gVGhpcyBpcyB0aGVcbi8vIHRoZSBleHBvcnQgb2YgdGhpcyBtb2R1bGUuIFRoaXMgaGFzIHRvIGNvbWUgbGFzdCwgYWZ0ZXIgQ29uZmlnMSBoYXMgYmVlblxuLy8gaW5pdGlhbGl6ZWQuXG5jb25zdCBzZWVkID0gY2xvbmUoKTtcbnNlZWQub3B0aW9ucyA9IHt9O1xuX3ByaXZhdGUuc2VlZCA9IHNlZWQ7XG5cbm1vZHVsZS5leHBvcnRzID0gc2VlZDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc2VlZC5qc1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxudmFyIHNwbGl0UGF0aFJlID1cbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcbnZhciBzcGxpdFBhdGggPSBmdW5jdGlvbihmaWxlbmFtZSkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XG59O1xuXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGFuZCBpbnZhbGlkIGVudHJpZXNcbiAgICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5yZXNvbHZlIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLyc7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBpc0Fic29sdXRlID0gZXhwb3J0cy5pc0Fic29sdXRlKHBhdGgpLFxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHN1YnN0cihwYXRoLCAtMSkgPT09ICcvJztcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBwICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0pLmpvaW4oJy8nKSk7XG59O1xuXG5cbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgZnJvbSA9IGV4cG9ydHMucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XG4gIHRvID0gZXhwb3J0cy5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XG5cbiAgZnVuY3Rpb24gdHJpbShhcnIpIHtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIGZvciAoOyBzdGFydCA8IGFyci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICAgIGlmIChhcnJbc3RhcnRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgdmFyIGVuZCA9IGFyci5sZW5ndGggLSAxO1xuICAgIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcbiAgICAgIGlmIChhcnJbZW5kXSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGFydCA+IGVuZCkgcmV0dXJuIFtdO1xuICAgIHJldHVybiBhcnIuc2xpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0ICsgMSk7XG4gIH1cblxuICB2YXIgZnJvbVBhcnRzID0gdHJpbShmcm9tLnNwbGl0KCcvJykpO1xuICB2YXIgdG9QYXJ0cyA9IHRyaW0odG8uc3BsaXQoJy8nKSk7XG5cbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XG4gIH1cblxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xuXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XG59O1xuXG5leHBvcnRzLnNlcCA9ICcvJztcbmV4cG9ydHMuZGVsaW1pdGVyID0gJzonO1xuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBzcGxpdFBhdGgocGF0aCksXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xuXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGlmIChkaXIpIHtcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHJvb3QgKyBkaXI7XG59O1xuXG5cbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcbiAgdmFyIGYgPSBzcGxpdFBhdGgocGF0aClbMl07XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoKHBhdGgpWzNdO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9wcm9jZXNzL2Jyb3dzZXIuanNcbiAqKiBtb2R1bGUgaWQgPSAzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyAgUmFtZGEgdjAuMjEuMFxuLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9yYW1kYS9yYW1kYVxuLy8gIChjKSAyMDEzLTIwMTYgU2NvdHQgU2F1eWV0LCBNaWNoYWVsIEh1cmxleSwgYW5kIERhdmlkIENoYW1iZXJzXG4vLyAgUmFtZGEgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbjsoZnVuY3Rpb24oKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgICAqIEEgc3BlY2lhbCBwbGFjZWhvbGRlciB2YWx1ZSB1c2VkIHRvIHNwZWNpZnkgXCJnYXBzXCIgd2l0aGluIGN1cnJpZWQgZnVuY3Rpb25zLFxuICAgICAqIGFsbG93aW5nIHBhcnRpYWwgYXBwbGljYXRpb24gb2YgYW55IGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cywgcmVnYXJkbGVzcyBvZlxuICAgICAqIHRoZWlyIHBvc2l0aW9ucy5cbiAgICAgKlxuICAgICAqIElmIGBnYCBpcyBhIGN1cnJpZWQgdGVybmFyeSBmdW5jdGlvbiBhbmQgYF9gIGlzIGBSLl9fYCwgdGhlIGZvbGxvd2luZyBhcmVcbiAgICAgKiBlcXVpdmFsZW50OlxuICAgICAqXG4gICAgICogICAtIGBnKDEsIDIsIDMpYFxuICAgICAqICAgLSBgZyhfLCAyLCAzKSgxKWBcbiAgICAgKiAgIC0gYGcoXywgXywgMykoMSkoMilgXG4gICAgICogICAtIGBnKF8sIF8sIDMpKDEsIDIpYFxuICAgICAqICAgLSBgZyhfLCAyLCBfKSgxLCAzKWBcbiAgICAgKiAgIC0gYGcoXywgMikoMSkoMylgXG4gICAgICogICAtIGBnKF8sIDIpKDEsIDMpYFxuICAgICAqICAgLSBgZyhfLCAyKShfLCAzKSgxKWBcbiAgICAgKlxuICAgICAqIEBjb25zdGFudFxuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjYuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBncmVldCA9IFIucmVwbGFjZSgne25hbWV9JywgUi5fXywgJ0hlbGxvLCB7bmFtZX0hJyk7XG4gICAgICogICAgICBncmVldCgnQWxpY2UnKTsgLy89PiAnSGVsbG8sIEFsaWNlISdcbiAgICAgKi9cbiAgICB2YXIgX18gPSB7ICdAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInOiB0cnVlIH07XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xuICAgIHZhciBfYXJpdHkgPSBmdW5jdGlvbiBfYXJpdHkobiwgZm4pIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbiAgICAgICAgc3dpdGNoIChuKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwLCBhMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzLCBhNCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcsIGE4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcsIGE4LCBhOSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gX2FyaXR5IG11c3QgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlciBubyBncmVhdGVyIHRoYW4gdGVuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIF9hcnJheUZyb21JdGVyYXRvciA9IGZ1bmN0aW9uIF9hcnJheUZyb21JdGVyYXRvcihpdGVyKSB7XG4gICAgICAgIHZhciBsaXN0ID0gW107XG4gICAgICAgIHZhciBuZXh0O1xuICAgICAgICB3aGlsZSAoIShuZXh0ID0gaXRlci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgICAgIGxpc3QucHVzaChuZXh0LnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9O1xuXG4gICAgdmFyIF9hcnJheU9mID0gZnVuY3Rpb24gX2FycmF5T2YoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICB2YXIgX2Nsb25lUmVnRXhwID0gZnVuY3Rpb24gX2Nsb25lUmVnRXhwKHBhdHRlcm4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAocGF0dGVybi5zb3VyY2UsIChwYXR0ZXJuLmdsb2JhbCA/ICdnJyA6ICcnKSArIChwYXR0ZXJuLmlnbm9yZUNhc2UgPyAnaScgOiAnJykgKyAocGF0dGVybi5tdWx0aWxpbmUgPyAnbScgOiAnJykgKyAocGF0dGVybi5zdGlja3kgPyAneScgOiAnJykgKyAocGF0dGVybi51bmljb2RlID8gJ3UnIDogJycpKTtcbiAgICB9O1xuXG4gICAgdmFyIF9jb21wbGVtZW50ID0gZnVuY3Rpb24gX2NvbXBsZW1lbnQoZikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICFmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgYGNvbmNhdGAgZnVuY3Rpb24gdG8gbWVyZ2UgdHdvIGFycmF5LWxpa2Ugb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcnJheXxBcmd1bWVudHN9IFtzZXQxPVtdXSBBbiBhcnJheS1saWtlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fEFyZ3VtZW50c30gW3NldDI9W11dIEFuIGFycmF5LWxpa2Ugb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldywgbWVyZ2VkIGFycmF5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIF9jb25jYXQoWzQsIDUsIDZdLCBbMSwgMiwgM10pOyAvLz0+IFs0LCA1LCA2LCAxLCAyLCAzXVxuICAgICAqL1xuICAgIHZhciBfY29uY2F0ID0gZnVuY3Rpb24gX2NvbmNhdChzZXQxLCBzZXQyKSB7XG4gICAgICAgIHNldDEgPSBzZXQxIHx8IFtdO1xuICAgICAgICBzZXQyID0gc2V0MiB8fCBbXTtcbiAgICAgICAgdmFyIGlkeDtcbiAgICAgICAgdmFyIGxlbjEgPSBzZXQxLmxlbmd0aDtcbiAgICAgICAgdmFyIGxlbjIgPSBzZXQyLmxlbmd0aDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuMSkge1xuICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gc2V0MVtpZHhdO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbjIpIHtcbiAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHNldDJbaWR4XTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIHZhciBfY29udGFpbnNXaXRoID0gZnVuY3Rpb24gX2NvbnRhaW5zV2l0aChwcmVkLCB4LCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChwcmVkKHgsIGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIF9maWx0ZXIgPSBmdW5jdGlvbiBfZmlsdGVyKGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGZuKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBsaXN0W2lkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICB2YXIgX2ZvcmNlUmVkdWNlZCA9IGZ1bmN0aW9uIF9mb3JjZVJlZHVjZWQoeCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci92YWx1ZSc6IHgsXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3JlZHVjZWQnOiB0cnVlXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIFN0cmluZyh4ID0+IHgpIGV2YWx1YXRlcyB0byBcInggPT4geFwiLCBzbyB0aGUgcGF0dGVybiBtYXkgbm90IG1hdGNoLlxuICAgIHZhciBfZnVuY3Rpb25OYW1lID0gZnVuY3Rpb24gX2Z1bmN0aW9uTmFtZShmKSB7XG4gICAgICAgIC8vIFN0cmluZyh4ID0+IHgpIGV2YWx1YXRlcyB0byBcInggPT4geFwiLCBzbyB0aGUgcGF0dGVybiBtYXkgbm90IG1hdGNoLlxuICAgICAgICB2YXIgbWF0Y2ggPSBTdHJpbmcoZikubWF0Y2goL15mdW5jdGlvbiAoXFx3KikvKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoID09IG51bGwgPyAnJyA6IG1hdGNoWzFdO1xuICAgIH07XG5cbiAgICB2YXIgX2hhcyA9IGZ1bmN0aW9uIF9oYXMocHJvcCwgb2JqKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbiAgICB9O1xuXG4gICAgdmFyIF9pZGVudGl0eSA9IGZ1bmN0aW9uIF9pZGVudGl0eSh4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG5cbiAgICB2YXIgX2lzQXJndW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuICAgICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcmd1bWVudHMpID09PSAnW29iamVjdCBBcmd1bWVudHNdJyA/IGZ1bmN0aW9uIF9pc0FyZ3VtZW50cyh4KSB7XG4gICAgICAgICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG4gICAgICAgIH0gOiBmdW5jdGlvbiBfaXNBcmd1bWVudHMoeCkge1xuICAgICAgICAgICAgcmV0dXJuIF9oYXMoJ2NhbGxlZScsIHgpO1xuICAgICAgICB9O1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHdoZXRoZXIgb3Igbm90IGFuIG9iamVjdCBpcyBhbiBhcnJheS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWwgVGhlIG9iamVjdCB0byB0ZXN0LlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBgdmFsYCBpcyBhbiBhcnJheSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgX2lzQXJyYXkoW10pOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIF9pc0FycmF5KG51bGwpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBfaXNBcnJheSh7fSk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIF9pc0FycmF5KHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsICE9IG51bGwgJiYgdmFsLmxlbmd0aCA+PSAwICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICB2YXIgX2lzRnVuY3Rpb24gPSBmdW5jdGlvbiBfaXNOdW1iZXIoeCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgaWYgdGhlIHBhc3NlZCBhcmd1bWVudCBpcyBhbiBpbnRlZ2VyLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0geyp9IG5cbiAgICAgKiBAY2F0ZWdvcnkgVHlwZVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgdmFyIF9pc0ludGVnZXIgPSBOdW1iZXIuaXNJbnRlZ2VyIHx8IGZ1bmN0aW9uIF9pc0ludGVnZXIobikge1xuICAgICAgICByZXR1cm4gbiA8PCAwID09PSBuO1xuICAgIH07XG5cbiAgICB2YXIgX2lzTnVtYmVyID0gZnVuY3Rpb24gX2lzTnVtYmVyKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgTnVtYmVyXSc7XG4gICAgfTtcblxuICAgIHZhciBfaXNPYmplY3QgPSBmdW5jdGlvbiBfaXNPYmplY3QoeCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBPYmplY3RdJztcbiAgICB9O1xuXG4gICAgdmFyIF9pc1BsYWNlaG9sZGVyID0gZnVuY3Rpb24gX2lzUGxhY2Vob2xkZXIoYSkge1xuICAgICAgICByZXR1cm4gYSAhPSBudWxsICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIF9pc1JlZ0V4cCA9IGZ1bmN0aW9uIF9pc1JlZ0V4cCh4KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xuICAgIH07XG5cbiAgICB2YXIgX2lzU3RyaW5nID0gZnVuY3Rpb24gX2lzU3RyaW5nKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG4gICAgfTtcblxuICAgIHZhciBfaXNUcmFuc2Zvcm1lciA9IGZ1bmN0aW9uIF9pc1RyYW5zZm9ybWVyKG9iaikge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG9ialsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9O1xuXG4gICAgdmFyIF9tYXAgPSBmdW5jdGlvbiBfbWFwKGZuLCBmdW5jdG9yKSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gZnVuY3Rvci5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBBcnJheShsZW4pO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICByZXN1bHRbaWR4XSA9IGZuKGZ1bmN0b3JbaWR4XSk7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvLyBCYXNlZCBvbiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvYXNzaWduXG4gICAgdmFyIF9vYmplY3RBc3NpZ24gPSBmdW5jdGlvbiBfb2JqZWN0QXNzaWduKHRhcmdldCkge1xuICAgICAgICBpZiAodGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvdXRwdXQgPSBPYmplY3QodGFyZ2V0KTtcbiAgICAgICAgdmFyIGlkeCA9IDE7XG4gICAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2lkeF07XG4gICAgICAgICAgICBpZiAoc291cmNlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuZXh0S2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2hhcyhuZXh0S2V5LCBzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRbbmV4dEtleV0gPSBzb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG5cbiAgICB2YXIgX29mID0gZnVuY3Rpb24gX29mKHgpIHtcbiAgICAgICAgcmV0dXJuIFt4XTtcbiAgICB9O1xuXG4gICAgdmFyIF9waXBlID0gZnVuY3Rpb24gX3BpcGUoZiwgZykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGcuY2FsbCh0aGlzLCBmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgX3BpcGVQID0gZnVuY3Rpb24gX3BpcGVQKGYsIGcpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjdHggPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIGYuYXBwbHkoY3R4LCBhcmd1bWVudHMpLnRoZW4oZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZy5jYWxsKGN0eCwgeCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gXFxiIG1hdGNoZXMgd29yZCBib3VuZGFyeTsgW1xcYl0gbWF0Y2hlcyBiYWNrc3BhY2VcbiAgICB2YXIgX3F1b3RlID0gZnVuY3Rpb24gX3F1b3RlKHMpIHtcbiAgICAgICAgdmFyIGVzY2FwZWQgPSBzLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykucmVwbGFjZSgvW1xcYl0vZywgJ1xcXFxiJykgICAgLy8gXFxiIG1hdGNoZXMgd29yZCBib3VuZGFyeTsgW1xcYl0gbWF0Y2hlcyBiYWNrc3BhY2VcbiAgICAucmVwbGFjZSgvXFxmL2csICdcXFxcZicpLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKS5yZXBsYWNlKC9cXHIvZywgJ1xcXFxyJykucmVwbGFjZSgvXFx0L2csICdcXFxcdCcpLnJlcGxhY2UoL1xcdi9nLCAnXFxcXHYnKS5yZXBsYWNlKC9cXDAvZywgJ1xcXFwwJyk7XG4gICAgICAgIHJldHVybiAnXCInICsgZXNjYXBlZC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgKyAnXCInO1xuICAgIH07XG5cbiAgICB2YXIgX3JlZHVjZWQgPSBmdW5jdGlvbiBfcmVkdWNlZCh4KSB7XG4gICAgICAgIHJldHVybiB4ICYmIHhbJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJ10gPyB4IDoge1xuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci92YWx1ZSc6IHgsXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3JlZHVjZWQnOiB0cnVlXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFuIG9wdGltaXplZCwgcHJpdmF0ZSBhcnJheSBgc2xpY2VgIGltcGxlbWVudGF0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge0FyZ3VtZW50c3xBcnJheX0gYXJncyBUaGUgYXJyYXkgb3IgYXJndW1lbnRzIG9iamVjdCB0byBjb25zaWRlci5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW2Zyb209MF0gVGhlIGFycmF5IGluZGV4IHRvIHNsaWNlIGZyb20sIGluY2x1c2l2ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gW3RvPWFyZ3MubGVuZ3RoXSBUaGUgYXJyYXkgaW5kZXggdG8gc2xpY2UgdG8sIGV4Y2x1c2l2ZS5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcsIHNsaWNlZCBhcnJheS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBfc2xpY2UoWzEsIDIsIDMsIDQsIDVdLCAxLCAzKTsgLy89PiBbMiwgM11cbiAgICAgKlxuICAgICAqICAgICAgdmFyIGZpcnN0VGhyZWVBcmdzID0gZnVuY3Rpb24oYSwgYiwgYywgZCkge1xuICAgICAqICAgICAgICByZXR1cm4gX3NsaWNlKGFyZ3VtZW50cywgMCwgMyk7XG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgZmlyc3RUaHJlZUFyZ3MoMSwgMiwgMywgNCk7IC8vPT4gWzEsIDIsIDNdXG4gICAgICovXG4gICAgdmFyIF9zbGljZSA9IGZ1bmN0aW9uIF9zbGljZShhcmdzLCBmcm9tLCB0bykge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIF9zbGljZShhcmdzLCAwLCBhcmdzLmxlbmd0aCk7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiBfc2xpY2UoYXJncywgZnJvbSwgYXJncy5sZW5ndGgpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGxpc3QgPSBbXTtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgdmFyIGxlbiA9IE1hdGgubWF4KDAsIE1hdGgubWluKGFyZ3MubGVuZ3RoLCB0bykgLSBmcm9tKTtcbiAgICAgICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgICAgICBsaXN0W2lkeF0gPSBhcmdzW2Zyb20gKyBpZHhdO1xuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUG9seWZpbGwgZnJvbSA8aHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZS90b0lTT1N0cmluZz4uXG4gICAgICovXG4gICAgdmFyIF90b0lTT1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhZCA9IGZ1bmN0aW9uIHBhZChuKSB7XG4gICAgICAgICAgICByZXR1cm4gKG4gPCAxMCA/ICcwJyA6ICcnKSArIG47XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0eXBlb2YgRGF0ZS5wcm90b3R5cGUudG9JU09TdHJpbmcgPT09ICdmdW5jdGlvbicgPyBmdW5jdGlvbiBfdG9JU09TdHJpbmcoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQudG9JU09TdHJpbmcoKTtcbiAgICAgICAgfSA6IGZ1bmN0aW9uIF90b0lTT1N0cmluZyhkKSB7XG4gICAgICAgICAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICsgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICsgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArICdUJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICsgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgKyAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSkgKyAnWic7XG4gICAgICAgIH07XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZkJhc2UgPSB7XG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvaW5pdCddKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBfeHdyYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhXcmFwKGZuKSB7XG4gICAgICAgICAgICB0aGlzLmYgPSBmbjtcbiAgICAgICAgfVxuICAgICAgICBYV3JhcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luaXQgbm90IGltcGxlbWVudGVkIG9uIFhXcmFwJyk7XG4gICAgICAgIH07XG4gICAgICAgIFhXcmFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKGFjYykge1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfTtcbiAgICAgICAgWFdyYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZihhY2MsIHgpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gX3h3cmFwKGZuKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhXcmFwKGZuKTtcbiAgICAgICAgfTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX2FwZXJ0dXJlID0gZnVuY3Rpb24gX2FwZXJ0dXJlKG4sIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsaW1pdCA9IGxpc3QubGVuZ3RoIC0gKG4gLSAxKTtcbiAgICAgICAgdmFyIGFjYyA9IG5ldyBBcnJheShsaW1pdCA+PSAwID8gbGltaXQgOiAwKTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxpbWl0KSB7XG4gICAgICAgICAgICBhY2NbaWR4XSA9IF9zbGljZShsaXN0LCBpZHgsIGlkeCArIG4pO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9O1xuXG4gICAgdmFyIF9hc3NpZ24gPSB0eXBlb2YgT2JqZWN0LmFzc2lnbiA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5hc3NpZ24gOiBfb2JqZWN0QXNzaWduO1xuXG4gICAgLyoqXG4gICAgICogU2ltaWxhciB0byBoYXNNZXRob2QsIHRoaXMgY2hlY2tzIHdoZXRoZXIgYSBmdW5jdGlvbiBoYXMgYSBbbWV0aG9kbmFtZV1cbiAgICAgKiBmdW5jdGlvbi4gSWYgaXQgaXNuJ3QgYW4gYXJyYXkgaXQgd2lsbCBleGVjdXRlIHRoYXQgZnVuY3Rpb24gb3RoZXJ3aXNlIGl0XG4gICAgICogd2lsbCBkZWZhdWx0IHRvIHRoZSByYW1kYSBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gcmFtZGEgaW1wbGVtdGF0aW9uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZG5hbWUgcHJvcGVydHkgdG8gY2hlY2sgZm9yIGEgY3VzdG9tIGltcGxlbWVudGF0aW9uXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBXaGF0ZXZlciB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBtZXRob2QgaXMuXG4gICAgICovXG4gICAgdmFyIF9jaGVja0Zvck1ldGhvZCA9IGZ1bmN0aW9uIF9jaGVja0Zvck1ldGhvZChtZXRob2RuYW1lLCBmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2xlbmd0aCAtIDFdO1xuICAgICAgICAgICAgcmV0dXJuIF9pc0FycmF5KG9iaikgfHwgdHlwZW9mIG9ialttZXRob2RuYW1lXSAhPT0gJ2Z1bmN0aW9uJyA/IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiBvYmpbbWV0aG9kbmFtZV0uYXBwbHkob2JqLCBfc2xpY2UoYXJndW1lbnRzLCAwLCBsZW5ndGggLSAxKSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9wdGltaXplZCBpbnRlcm5hbCBvbmUtYXJpdHkgY3VycnkgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgdmFyIF9jdXJyeTEgPSBmdW5jdGlvbiBfY3VycnkxKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBmMShhKSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCB8fCBfaXNQbGFjZWhvbGRlcihhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9wdGltaXplZCBpbnRlcm5hbCB0d28tYXJpdHkgY3VycnkgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgdmFyIF9jdXJyeTIgPSBmdW5jdGlvbiBfY3VycnkyKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBmMihhLCBiKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICByZXR1cm4gZjI7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc1BsYWNlaG9sZGVyKGEpID8gZjIgOiBfY3VycnkxKGZ1bmN0aW9uIChfYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oYSwgX2IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gX2lzUGxhY2Vob2xkZXIoYSkgJiYgX2lzUGxhY2Vob2xkZXIoYikgPyBmMiA6IF9pc1BsYWNlaG9sZGVyKGEpID8gX2N1cnJ5MShmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKF9hLCBiKTtcbiAgICAgICAgICAgICAgICB9KSA6IF9pc1BsYWNlaG9sZGVyKGIpID8gX2N1cnJ5MShmdW5jdGlvbiAoX2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKGEsIF9iKTtcbiAgICAgICAgICAgICAgICB9KSA6IGZuKGEsIGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcHRpbWl6ZWQgaW50ZXJuYWwgdGhyZWUtYXJpdHkgY3VycnkgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgdmFyIF9jdXJyeTMgPSBmdW5jdGlvbiBfY3VycnkzKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBmMyhhLCBiLCBjKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICByZXR1cm4gZjM7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc1BsYWNlaG9sZGVyKGEpID8gZjMgOiBfY3VycnkyKGZ1bmN0aW9uIChfYiwgX2MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKGEsIF9iLCBfYyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc1BsYWNlaG9sZGVyKGEpICYmIF9pc1BsYWNlaG9sZGVyKGIpID8gZjMgOiBfaXNQbGFjZWhvbGRlcihhKSA/IF9jdXJyeTIoZnVuY3Rpb24gKF9hLCBfYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oX2EsIGIsIF9jKTtcbiAgICAgICAgICAgICAgICB9KSA6IF9pc1BsYWNlaG9sZGVyKGIpID8gX2N1cnJ5MihmdW5jdGlvbiAoX2IsIF9jKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihhLCBfYiwgX2MpO1xuICAgICAgICAgICAgICAgIH0pIDogX2N1cnJ5MShmdW5jdGlvbiAoX2MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIF9jKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc1BsYWNlaG9sZGVyKGEpICYmIF9pc1BsYWNlaG9sZGVyKGIpICYmIF9pc1BsYWNlaG9sZGVyKGMpID8gZjMgOiBfaXNQbGFjZWhvbGRlcihhKSAmJiBfaXNQbGFjZWhvbGRlcihiKSA/IF9jdXJyeTIoZnVuY3Rpb24gKF9hLCBfYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oX2EsIF9iLCBjKTtcbiAgICAgICAgICAgICAgICB9KSA6IF9pc1BsYWNlaG9sZGVyKGEpICYmIF9pc1BsYWNlaG9sZGVyKGMpID8gX2N1cnJ5MihmdW5jdGlvbiAoX2EsIF9jKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihfYSwgYiwgX2MpO1xuICAgICAgICAgICAgICAgIH0pIDogX2lzUGxhY2Vob2xkZXIoYikgJiYgX2lzUGxhY2Vob2xkZXIoYykgPyBfY3VycnkyKGZ1bmN0aW9uIChfYiwgX2MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKGEsIF9iLCBfYyk7XG4gICAgICAgICAgICAgICAgfSkgOiBfaXNQbGFjZWhvbGRlcihhKSA/IF9jdXJyeTEoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihfYSwgYiwgYyk7XG4gICAgICAgICAgICAgICAgfSkgOiBfaXNQbGFjZWhvbGRlcihiKSA/IF9jdXJyeTEoZnVuY3Rpb24gKF9iKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihhLCBfYiwgYyk7XG4gICAgICAgICAgICAgICAgfSkgOiBfaXNQbGFjZWhvbGRlcihjKSA/IF9jdXJyeTEoZnVuY3Rpb24gKF9jKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihhLCBiLCBfYyk7XG4gICAgICAgICAgICAgICAgfSkgOiBmbihhLCBiLCBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgY3VycnlOIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbGVuZ3RoIFRoZSBhcml0eSBvZiB0aGUgY3VycmllZCBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSByZWNlaXZlZCBBbiBhcnJheSBvZiBhcmd1bWVudHMgcmVjZWl2ZWQgdGh1cyBmYXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGN1cnJ5LlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgY3VycmllZCBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICB2YXIgX2N1cnJ5TiA9IGZ1bmN0aW9uIF9jdXJyeU4obGVuZ3RoLCByZWNlaXZlZCwgZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb21iaW5lZCA9IFtdO1xuICAgICAgICAgICAgdmFyIGFyZ3NJZHggPSAwO1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgY29tYmluZWRJZHggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGNvbWJpbmVkSWR4IDwgcmVjZWl2ZWQubGVuZ3RoIHx8IGFyZ3NJZHggPCBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgICAgICBpZiAoY29tYmluZWRJZHggPCByZWNlaXZlZC5sZW5ndGggJiYgKCFfaXNQbGFjZWhvbGRlcihyZWNlaXZlZFtjb21iaW5lZElkeF0pIHx8IGFyZ3NJZHggPj0gYXJndW1lbnRzLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVjZWl2ZWRbY29tYmluZWRJZHhdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFyZ3VtZW50c1thcmdzSWR4XTtcbiAgICAgICAgICAgICAgICAgICAgYXJnc0lkeCArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb21iaW5lZFtjb21iaW5lZElkeF0gPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgaWYgKCFfaXNQbGFjZWhvbGRlcihyZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQgLT0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29tYmluZWRJZHggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsZWZ0IDw9IDAgPyBmbi5hcHBseSh0aGlzLCBjb21iaW5lZCkgOiBfYXJpdHkobGVmdCwgX2N1cnJ5TihsZW5ndGgsIGNvbWJpbmVkLCBmbikpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBkaXNwYXRjaGVzIHdpdGggZGlmZmVyZW50IHN0cmF0ZWdpZXMgYmFzZWQgb24gdGhlXG4gICAgICogb2JqZWN0IGluIGxpc3QgcG9zaXRpb24gKGxhc3QgYXJndW1lbnQpLiBJZiBpdCBpcyBhbiBhcnJheSwgZXhlY3V0ZXMgW2ZuXS5cbiAgICAgKiBPdGhlcndpc2UsIGlmIGl0IGhhcyBhIGZ1bmN0aW9uIHdpdGggW21ldGhvZG5hbWVdLCBpdCB3aWxsIGV4ZWN1dGUgdGhhdFxuICAgICAqIGZ1bmN0aW9uIChmdW5jdG9yIGNhc2UpLiBPdGhlcndpc2UsIGlmIGl0IGlzIGEgdHJhbnNmb3JtZXIsIHVzZXMgdHJhbnNkdWNlclxuICAgICAqIFt4Zl0gdG8gcmV0dXJuIGEgbmV3IHRyYW5zZm9ybWVyICh0cmFuc2R1Y2VyIGNhc2UpLiBPdGhlcndpc2UsIGl0IHdpbGxcbiAgICAgKiBkZWZhdWx0IHRvIGV4ZWN1dGluZyBbZm5dLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kbmFtZSBwcm9wZXJ0eSB0byBjaGVjayBmb3IgYSBjdXN0b20gaW1wbGVtZW50YXRpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSB4ZiB0cmFuc2R1Y2VyIHRvIGluaXRpYWxpemUgaWYgb2JqZWN0IGlzIHRyYW5zZm9ybWVyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gZGVmYXVsdCByYW1kYSBpbXBsZW1lbnRhdGlvblxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRoYXQgZGlzcGF0Y2hlcyBvbiBvYmplY3QgaW4gbGlzdCBwb3NpdGlvblxuICAgICAqL1xuICAgIHZhciBfZGlzcGF0Y2hhYmxlID0gZnVuY3Rpb24gX2Rpc3BhdGNoYWJsZShtZXRob2RuYW1lLCB4ZiwgZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1tsZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkob2JqKSkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gX3NsaWNlKGFyZ3VtZW50cywgMCwgbGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmpbbWV0aG9kbmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialttZXRob2RuYW1lXS5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoX2lzVHJhbnNmb3JtZXIob2JqKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNkdWNlciA9IHhmLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcihvYmopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgX2Ryb3BMYXN0V2hpbGUgPSBmdW5jdGlvbiBkcm9wTGFzdFdoaWxlKHByZWQsIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IGxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgd2hpbGUgKGlkeCA+PSAwICYmIHByZWQobGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgaWR4IC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9zbGljZShsaXN0LCAwLCBpZHggKyAxKTtcbiAgICB9O1xuXG4gICAgdmFyIF94YWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYQWxsKGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICAgICAgdGhpcy5hbGwgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFhBbGwucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYQWxsLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuYWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICBYQWxsLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZihpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFsbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IF9yZWR1Y2VkKHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBmYWxzZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hhbGwoZiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWEFsbChmLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGFueSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWEFueShmLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5mID0gZjtcbiAgICAgICAgICAgIHRoaXMuYW55ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgWEFueS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhBbnkucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWEFueS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZihpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFueSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gX3JlZHVjZWQodGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRydWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94YW55KGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhBbnkoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hhcGVydHVyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWEFwZXJ0dXJlKG4sIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLnBvcyA9IDA7XG4gICAgICAgICAgICB0aGlzLmZ1bGwgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuYWNjID0gbmV3IEFycmF5KG4pO1xuICAgICAgICB9XG4gICAgICAgIFhBcGVydHVyZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhBcGVydHVyZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMuYWNjID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWEFwZXJ0dXJlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICB0aGlzLnN0b3JlKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZ1bGwgPyB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdGhpcy5nZXRDb3B5KCkpIDogcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICBYQXBlcnR1cmUucHJvdG90eXBlLnN0b3JlID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmFjY1t0aGlzLnBvc10gPSBpbnB1dDtcbiAgICAgICAgICAgIHRoaXMucG9zICs9IDE7XG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPT09IHRoaXMuYWNjLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmZ1bGwgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBYQXBlcnR1cmUucHJvdG90eXBlLmdldENvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX2NvbmNhdChfc2xpY2UodGhpcy5hY2MsIHRoaXMucG9zKSwgX3NsaWNlKHRoaXMuYWNjLCAwLCB0aGlzLnBvcykpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGFwZXJ0dXJlKG4sIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhBcGVydHVyZShuLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGRyb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhEcm9wKG4sIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLm4gPSBuO1xuICAgICAgICB9XG4gICAgICAgIFhEcm9wLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWERyb3AucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBfeGZCYXNlLnJlc3VsdDtcbiAgICAgICAgWERyb3AucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm4gPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uIC09IDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGRyb3AobiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWERyb3AobiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hkcm9wTGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWERyb3BMYXN0KG4sIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLnBvcyA9IDA7XG4gICAgICAgICAgICB0aGlzLmZ1bGwgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuYWNjID0gbmV3IEFycmF5KG4pO1xuICAgICAgICB9XG4gICAgICAgIFhEcm9wTGFzdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhEcm9wTGFzdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMuYWNjID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWERyb3BMYXN0LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5mdWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMuYWNjW3RoaXMucG9zXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0b3JlKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIFhEcm9wTGFzdC5wcm90b3R5cGUuc3RvcmUgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuYWNjW3RoaXMucG9zXSA9IGlucHV0O1xuICAgICAgICAgICAgdGhpcy5wb3MgKz0gMTtcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA9PT0gdGhpcy5hY2MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3MgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuZnVsbCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94ZHJvcExhc3QobiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWERyb3BMYXN0KG4sIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZHJvcFJlcGVhdHNXaXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYRHJvcFJlcGVhdHNXaXRoKHByZWQsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLnByZWQgPSBwcmVkO1xuICAgICAgICAgICAgdGhpcy5sYXN0VmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLnNlZW5GaXJzdFZhbHVlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgWERyb3BSZXBlYXRzV2l0aC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xuICAgICAgICB9O1xuICAgICAgICBYRHJvcFJlcGVhdHNXaXRoLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICBYRHJvcFJlcGVhdHNXaXRoLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc2FtZUFzTGFzdCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnNlZW5GaXJzdFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWVuRmlyc3RWYWx1ZSA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucHJlZCh0aGlzLmxhc3RWYWx1ZSwgaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgc2FtZUFzTGFzdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxhc3RWYWx1ZSA9IGlucHV0O1xuICAgICAgICAgICAgcmV0dXJuIHNhbWVBc0xhc3QgPyByZXN1bHQgOiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGRyb3BSZXBlYXRzV2l0aChwcmVkLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRHJvcFJlcGVhdHNXaXRoKHByZWQsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZHJvcFdoaWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYRHJvcFdoaWxlKGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICB9XG4gICAgICAgIFhEcm9wV2hpbGUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYRHJvcFdoaWxlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gICAgICAgIFhEcm9wV2hpbGUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmYpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mKGlucHV0KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmYgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBpbnB1dCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94ZHJvcFdoaWxlKGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhEcm9wV2hpbGUoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hmaWx0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhGaWx0ZXIoZiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgICAgIHRoaXMuZiA9IGY7XG4gICAgICAgIH1cbiAgICAgICAgWEZpbHRlci5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhGaWx0ZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBfeGZCYXNlLnJlc3VsdDtcbiAgICAgICAgWEZpbHRlci5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZihpbnB1dCkgPyB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpIDogcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGZpbHRlcihmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRmlsdGVyKGYsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWEZpbmQoZiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgICAgIHRoaXMuZiA9IGY7XG4gICAgICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgWEZpbmQucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYRmluZC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5mb3VuZCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCB2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICBYRmluZC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZihpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBfcmVkdWNlZCh0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94ZmluZChmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRmluZChmLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGZpbmRJbmRleCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWEZpbmRJbmRleChmLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5mID0gZjtcbiAgICAgICAgICAgIHRoaXMuaWR4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgWEZpbmRJbmRleC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhGaW5kSW5kZXgucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZm91bmQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgLTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICBYRmluZEluZGV4LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmlkeCArPSAxO1xuICAgICAgICAgICAgaWYgKHRoaXMuZihpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBfcmVkdWNlZCh0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdGhpcy5pZHgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94ZmluZEluZGV4KGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhGaW5kSW5kZXgoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hmaW5kTGFzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWEZpbmRMYXN0KGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICB9XG4gICAgICAgIFhGaW5kTGFzdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhGaW5kTGFzdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10odGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMubGFzdCkpO1xuICAgICAgICB9O1xuICAgICAgICBYRmluZExhc3QucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmYoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0ID0gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGZpbmRMYXN0KGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhGaW5kTGFzdChmLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGZpbmRMYXN0SW5kZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhGaW5kTGFzdEluZGV4KGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICAgICAgdGhpcy5pZHggPSAtMTtcbiAgICAgICAgICAgIHRoaXMubGFzdElkeCA9IC0xO1xuICAgICAgICB9XG4gICAgICAgIFhGaW5kTGFzdEluZGV4LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWEZpbmRMYXN0SW5kZXgucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCB0aGlzLmxhc3RJZHgpKTtcbiAgICAgICAgfTtcbiAgICAgICAgWEZpbmRMYXN0SW5kZXgucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuaWR4ICs9IDE7XG4gICAgICAgICAgICBpZiAodGhpcy5mKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdElkeCA9IHRoaXMuaWR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hmaW5kTGFzdEluZGV4KGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhGaW5kTGFzdEluZGV4KGYsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94bWFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYTWFwKGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICB9XG4gICAgICAgIFhNYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gICAgICAgIFhNYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdGhpcy5mKGlucHV0KSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94bWFwKGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhNYXAoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3h0YWtlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYVGFrZShuLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5uID0gbjtcbiAgICAgICAgfVxuICAgICAgICBYVGFrZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhUYWtlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gICAgICAgIFhUYWtlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5uID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9yZWR1Y2VkKHJlc3VsdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubiAtPSAxO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeHRha2UobiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWFRha2UobiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3h0YWtlV2hpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhUYWtlV2hpbGUoZiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgICAgIHRoaXMuZiA9IGY7XG4gICAgICAgIH1cbiAgICAgICAgWFRha2VXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhUYWtlV2hpbGUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBfeGZCYXNlLnJlc3VsdDtcbiAgICAgICAgWFRha2VXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZihpbnB1dCkgPyB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpIDogX3JlZHVjZWQocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3h0YWtlV2hpbGUoZiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWFRha2VXaGlsZShmLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgdHdvIHZhbHVlcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGFcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYlxuICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgKiBAc2VlIFIuc3VidHJhY3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmFkZCgyLCAzKTsgICAgICAgLy89PiAgNVxuICAgICAqICAgICAgUi5hZGQoNykoMTApOyAgICAgIC8vPT4gMTdcbiAgICAgKi9cbiAgICB2YXIgYWRkID0gX2N1cnJ5MihmdW5jdGlvbiBhZGQoYSwgYikge1xuICAgICAgICByZXR1cm4gTnVtYmVyKGEpICsgTnVtYmVyKGIpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQXBwbGllcyBhIGZ1bmN0aW9uIHRvIHRoZSB2YWx1ZSBhdCB0aGUgZ2l2ZW4gaW5kZXggb2YgYW4gYXJyYXksIHJldHVybmluZyBhXG4gICAgICogbmV3IGNvcHkgb2YgdGhlIGFycmF5IHdpdGggdGhlIGVsZW1lbnQgYXQgdGhlIGdpdmVuIGluZGV4IHJlcGxhY2VkIHdpdGggdGhlXG4gICAgICogcmVzdWx0IG9mIHRoZSBmdW5jdGlvbiBhcHBsaWNhdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBhKSAtPiBOdW1iZXIgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBhcHBseS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IFRoZSBpbmRleC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fEFyZ3VtZW50c30gbGlzdCBBbiBhcnJheS1saWtlIG9iamVjdCB3aG9zZSB2YWx1ZVxuICAgICAqICAgICAgICBhdCB0aGUgc3VwcGxpZWQgaW5kZXggd2lsbCBiZSByZXBsYWNlZC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBjb3B5IG9mIHRoZSBzdXBwbGllZCBhcnJheS1saWtlIG9iamVjdCB3aXRoXG4gICAgICogICAgICAgICB0aGUgZWxlbWVudCBhdCBpbmRleCBgaWR4YCByZXBsYWNlZCB3aXRoIHRoZSB2YWx1ZVxuICAgICAqICAgICAgICAgcmV0dXJuZWQgYnkgYXBwbHlpbmcgYGZuYCB0byB0aGUgZXhpc3RpbmcgZWxlbWVudC5cbiAgICAgKiBAc2VlIFIudXBkYXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5hZGp1c3QoUi5hZGQoMTApLCAxLCBbMCwgMSwgMl0pOyAgICAgLy89PiBbMCwgMTEsIDJdXG4gICAgICogICAgICBSLmFkanVzdChSLmFkZCgxMCkpKDEpKFswLCAxLCAyXSk7ICAgICAvLz0+IFswLCAxMSwgMl1cbiAgICAgKi9cbiAgICB2YXIgYWRqdXN0ID0gX2N1cnJ5MyhmdW5jdGlvbiBhZGp1c3QoZm4sIGlkeCwgbGlzdCkge1xuICAgICAgICBpZiAoaWR4ID49IGxpc3QubGVuZ3RoIHx8IGlkeCA8IC1saXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0YXJ0ID0gaWR4IDwgMCA/IGxpc3QubGVuZ3RoIDogMDtcbiAgICAgICAgdmFyIF9pZHggPSBzdGFydCArIGlkeDtcbiAgICAgICAgdmFyIF9saXN0ID0gX2NvbmNhdChsaXN0KTtcbiAgICAgICAgX2xpc3RbX2lkeF0gPSBmbihsaXN0W19pZHhdKTtcbiAgICAgICAgcmV0dXJuIF9saXN0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgYWxsIGVsZW1lbnRzIG9mIHRoZSBsaXN0IG1hdGNoIHRoZSBwcmVkaWNhdGUsIGBmYWxzZWAgaWZcbiAgICAgKiB0aGVyZSBhcmUgYW55IHRoYXQgZG9uJ3QuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgYWxsYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIHByZWRpY2F0ZSBpcyBzYXRpc2ZpZWQgYnkgZXZlcnkgZWxlbWVudCwgYGZhbHNlYFxuICAgICAqICAgICAgICAgb3RoZXJ3aXNlLlxuICAgICAqIEBzZWUgUi5hbnksIFIubm9uZSwgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbGVzc1RoYW4yID0gUi5mbGlwKFIubHQpKDIpO1xuICAgICAqICAgICAgdmFyIGxlc3NUaGFuMyA9IFIuZmxpcChSLmx0KSgzKTtcbiAgICAgKiAgICAgIFIuYWxsKGxlc3NUaGFuMikoWzEsIDJdKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5hbGwobGVzc1RoYW4zKShbMSwgMl0pOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgYWxsID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdhbGwnLCBfeGFsbCwgZnVuY3Rpb24gYWxsKGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICghZm4obGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIHRoZSBnaXZlbiB2YWx1ZS4gTm90ZSB0aGF0IGZvclxuICAgICAqIG5vbi1wcmltaXRpdmVzIHRoZSB2YWx1ZSByZXR1cm5lZCBpcyBhIHJlZmVyZW5jZSB0byB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGtub3duIGFzIGBjb25zdGAsIGBjb25zdGFudGAsIG9yIGBLYCAoZm9yIEsgY29tYmluYXRvcikgaW5cbiAgICAgKiBvdGhlciBsYW5ndWFnZXMgYW5kIGxpYnJhcmllcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBhIC0+ICgqIC0+IGEpXG4gICAgICogQHBhcmFtIHsqfSB2YWwgVGhlIHZhbHVlIHRvIHdyYXAgaW4gYSBmdW5jdGlvblxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIEZ1bmN0aW9uIDo6ICogLT4gdmFsLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB0ID0gUi5hbHdheXMoJ1RlZScpO1xuICAgICAqICAgICAgdCgpOyAvLz0+ICdUZWUnXG4gICAgICovXG4gICAgdmFyIGFsd2F5cyA9IF9jdXJyeTEoZnVuY3Rpb24gYWx3YXlzKHZhbCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGJvdGggYXJndW1lbnRzIGFyZSBgdHJ1ZWA7IGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnICogLT4gKiAtPiAqXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBhIEEgYm9vbGVhbiB2YWx1ZVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gYiBBIGJvb2xlYW4gdmFsdWVcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYm90aCBhcmd1bWVudHMgYXJlIGB0cnVlYCwgYGZhbHNlYCBvdGhlcndpc2VcbiAgICAgKiBAc2VlIFIuYm90aFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYW5kKHRydWUsIHRydWUpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuYW5kKHRydWUsIGZhbHNlKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5hbmQoZmFsc2UsIHRydWUpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmFuZChmYWxzZSwgZmFsc2UpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGFuZCA9IF9jdXJyeTIoZnVuY3Rpb24gYW5kKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEgJiYgYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGF0IGxlYXN0IG9uZSBvZiBlbGVtZW50cyBvZiB0aGUgbGlzdCBtYXRjaCB0aGUgcHJlZGljYXRlLFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGFueWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBwcmVkaWNhdGUgaXMgc2F0aXNmaWVkIGJ5IGF0IGxlYXN0IG9uZSBlbGVtZW50LCBgZmFsc2VgXG4gICAgICogICAgICAgICBvdGhlcndpc2UuXG4gICAgICogQHNlZSBSLmFsbCwgUi5ub25lLCBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBsZXNzVGhhbjAgPSBSLmZsaXAoUi5sdCkoMCk7XG4gICAgICogICAgICB2YXIgbGVzc1RoYW4yID0gUi5mbGlwKFIubHQpKDIpO1xuICAgICAqICAgICAgUi5hbnkobGVzc1RoYW4wKShbMSwgMl0pOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmFueShsZXNzVGhhbjIpKFsxLCAyXSk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBhbnkgPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2FueScsIF94YW55LCBmdW5jdGlvbiBhbnkoZm4sIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGZuKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGxpc3QsIGNvbXBvc2VkIG9mIG4tdHVwbGVzIG9mIGNvbnNlY3V0aXZlIGVsZW1lbnRzIElmIGBuYCBpc1xuICAgICAqIGdyZWF0ZXIgdGhhbiB0aGUgbGVuZ3RoIG9mIHRoZSBsaXN0LCBhbiBlbXB0eSBsaXN0IGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGFwZXJ0dXJlYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTIuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IFtbYV1dXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gVGhlIHNpemUgb2YgdGhlIHR1cGxlcyB0byBjcmVhdGVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIHNwbGl0IGludG8gYG5gLXR1cGxlc1xuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbmV3IGxpc3QuXG4gICAgICogQHNlZSBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYXBlcnR1cmUoMiwgWzEsIDIsIDMsIDQsIDVdKTsgLy89PiBbWzEsIDJdLCBbMiwgM10sIFszLCA0XSwgWzQsIDVdXVxuICAgICAqICAgICAgUi5hcGVydHVyZSgzLCBbMSwgMiwgMywgNCwgNV0pOyAvLz0+IFtbMSwgMiwgM10sIFsyLCAzLCA0XSwgWzMsIDQsIDVdXVxuICAgICAqICAgICAgUi5hcGVydHVyZSg3LCBbMSwgMiwgMywgNCwgNV0pOyAvLz0+IFtdXG4gICAgICovXG4gICAgdmFyIGFwZXJ0dXJlID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdhcGVydHVyZScsIF94YXBlcnR1cmUsIF9hcGVydHVyZSkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnRhaW5pbmcgdGhlIGNvbnRlbnRzIG9mIHRoZSBnaXZlbiBsaXN0LCBmb2xsb3dlZCBieVxuICAgICAqIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgYSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHsqfSBlbCBUaGUgZWxlbWVudCB0byBhZGQgdG8gdGhlIGVuZCBvZiB0aGUgbmV3IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB3aG9zZSBjb250ZW50cyB3aWxsIGJlIGFkZGVkIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG91dHB1dFxuICAgICAqICAgICAgICBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBsaXN0IGNvbnRhaW5pbmcgdGhlIGNvbnRlbnRzIG9mIHRoZSBvbGQgbGlzdCBmb2xsb3dlZCBieSBgZWxgLlxuICAgICAqIEBzZWUgUi5wcmVwZW5kXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5hcHBlbmQoJ3Rlc3RzJywgWyd3cml0ZScsICdtb3JlJ10pOyAvLz0+IFsnd3JpdGUnLCAnbW9yZScsICd0ZXN0cyddXG4gICAgICogICAgICBSLmFwcGVuZCgndGVzdHMnLCBbXSk7IC8vPT4gWyd0ZXN0cyddXG4gICAgICogICAgICBSLmFwcGVuZChbJ3Rlc3RzJ10sIFsnd3JpdGUnLCAnbW9yZSddKTsgLy89PiBbJ3dyaXRlJywgJ21vcmUnLCBbJ3Rlc3RzJ11dXG4gICAgICovXG4gICAgdmFyIGFwcGVuZCA9IF9jdXJyeTIoZnVuY3Rpb24gYXBwZW5kKGVsLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfY29uY2F0KGxpc3QsIFtlbF0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQXBwbGllcyBmdW5jdGlvbiBgZm5gIHRvIHRoZSBhcmd1bWVudCBsaXN0IGBhcmdzYC4gVGhpcyBpcyB1c2VmdWwgZm9yXG4gICAgICogY3JlYXRpbmcgYSBmaXhlZC1hcml0eSBmdW5jdGlvbiBmcm9tIGEgdmFyaWFkaWMgZnVuY3Rpb24uIGBmbmAgc2hvdWxkIGJlIGFcbiAgICAgKiBib3VuZCBmdW5jdGlvbiBpZiBjb250ZXh0IGlzIHNpZ25pZmljYW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC43LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgqLi4uIC0+IGEpIC0+IFsqXSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcmdzXG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIuY2FsbCwgUi51bmFwcGx5XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG51bXMgPSBbMSwgMiwgMywgLTk5LCA0MiwgNiwgN107XG4gICAgICogICAgICBSLmFwcGx5KE1hdGgubWF4LCBudW1zKTsgLy89PiA0MlxuICAgICAqL1xuICAgIHZhciBhcHBseSA9IF9jdXJyeTIoZnVuY3Rpb24gYXBwbHkoZm4sIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTWFrZXMgYSBzaGFsbG93IGNsb25lIG9mIGFuIG9iamVjdCwgc2V0dGluZyBvciBvdmVycmlkaW5nIHRoZSBzcGVjaWZpZWRcbiAgICAgKiBwcm9wZXJ0eSB3aXRoIHRoZSBnaXZlbiB2YWx1ZS4gTm90ZSB0aGF0IHRoaXMgY29waWVzIGFuZCBmbGF0dGVucyBwcm90b3R5cGVcbiAgICAgKiBwcm9wZXJ0aWVzIG9udG8gdGhlIG5ldyBvYmplY3QgYXMgd2VsbC4gQWxsIG5vbi1wcmltaXRpdmUgcHJvcGVydGllcyBhcmVcbiAgICAgKiBjb3BpZWQgYnkgcmVmZXJlbmNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC44LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBTdHJpbmcgLT4gYSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3AgdGhlIHByb3BlcnR5IG5hbWUgdG8gc2V0XG4gICAgICogQHBhcmFtIHsqfSB2YWwgdGhlIG5ldyB2YWx1ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogdGhlIG9iamVjdCB0byBjbG9uZVxuICAgICAqIEByZXR1cm4ge09iamVjdH0gYSBuZXcgb2JqZWN0IHNpbWlsYXIgdG8gdGhlIG9yaWdpbmFsIGV4Y2VwdCBmb3IgdGhlIHNwZWNpZmllZCBwcm9wZXJ0eS5cbiAgICAgKiBAc2VlIFIuZGlzc29jXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5hc3NvYygnYycsIDMsIHthOiAxLCBiOiAyfSk7IC8vPT4ge2E6IDEsIGI6IDIsIGM6IDN9XG4gICAgICovXG4gICAgdmFyIGFzc29jID0gX2N1cnJ5MyhmdW5jdGlvbiBhc3NvYyhwcm9wLCB2YWwsIG9iaikge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAodmFyIHAgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXN1bHRbcF0gPSBvYmpbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W3Byb3BdID0gdmFsO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTWFrZXMgYSBzaGFsbG93IGNsb25lIG9mIGFuIG9iamVjdCwgc2V0dGluZyBvciBvdmVycmlkaW5nIHRoZSBub2RlcyByZXF1aXJlZFxuICAgICAqIHRvIGNyZWF0ZSB0aGUgZ2l2ZW4gcGF0aCwgYW5kIHBsYWNpbmcgdGhlIHNwZWNpZmljIHZhbHVlIGF0IHRoZSB0YWlsIGVuZCBvZlxuICAgICAqIHRoYXQgcGF0aC4gTm90ZSB0aGF0IHRoaXMgY29waWVzIGFuZCBmbGF0dGVucyBwcm90b3R5cGUgcHJvcGVydGllcyBvbnRvIHRoZVxuICAgICAqIG5ldyBvYmplY3QgYXMgd2VsbC4gQWxsIG5vbi1wcmltaXRpdmUgcHJvcGVydGllcyBhcmUgY29waWVkIGJ5IHJlZmVyZW5jZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgW1N0cmluZ10gLT4gYSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtBcnJheX0gcGF0aCB0aGUgcGF0aCB0byBzZXRcbiAgICAgKiBAcGFyYW0geyp9IHZhbCB0aGUgbmV3IHZhbHVlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiB0aGUgb2JqZWN0IHRvIGNsb25lXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBhIG5ldyBvYmplY3Qgc2ltaWxhciB0byB0aGUgb3JpZ2luYWwgZXhjZXB0IGFsb25nIHRoZSBzcGVjaWZpZWQgcGF0aC5cbiAgICAgKiBAc2VlIFIuZGlzc29jUGF0aFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYXNzb2NQYXRoKFsnYScsICdiJywgJ2MnXSwgNDIsIHthOiB7Yjoge2M6IDB9fX0pOyAvLz0+IHthOiB7Yjoge2M6IDQyfX19XG4gICAgICovXG4gICAgdmFyIGFzc29jUGF0aCA9IF9jdXJyeTMoZnVuY3Rpb24gYXNzb2NQYXRoKHBhdGgsIHZhbCwgb2JqKSB7XG4gICAgICAgIHN3aXRjaCAocGF0aC5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIGFzc29jKHBhdGhbMF0sIHZhbCwgb2JqKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBhc3NvYyhwYXRoWzBdLCBhc3NvY1BhdGgoX3NsaWNlKHBhdGgsIDEpLCB2YWwsIE9iamVjdChvYmpbcGF0aFswXV0pKSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaXMgYm91bmQgdG8gYSBjb250ZXh0LlxuICAgICAqIE5vdGU6IGBSLmJpbmRgIGRvZXMgbm90IHByb3ZpZGUgdGhlIGFkZGl0aW9uYWwgYXJndW1lbnQtYmluZGluZyBjYXBhYmlsaXRpZXMgb2ZcbiAgICAgKiBbRnVuY3Rpb24ucHJvdG90eXBlLmJpbmRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Z1bmN0aW9uL2JpbmQpLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC42LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyAoKiAtPiAqKSAtPiB7Kn0gLT4gKCogLT4gKilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYmluZCB0byBjb250ZXh0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IHRoaXNPYmogVGhlIGNvbnRleHQgdG8gYmluZCBgZm5gIHRvXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdGhhdCB3aWxsIGV4ZWN1dGUgaW4gdGhlIGNvbnRleHQgb2YgYHRoaXNPYmpgLlxuICAgICAqIEBzZWUgUi5wYXJ0aWFsXG4gICAgICovXG4gICAgdmFyIGJpbmQgPSBfY3VycnkyKGZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNPYmopIHtcbiAgICAgICAgcmV0dXJuIF9hcml0eShmbi5sZW5ndGgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzT2JqLCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJlc3RyaWN0cyBhIG51bWJlciB0byBiZSB3aXRoaW4gYSByYW5nZS5cbiAgICAgKlxuICAgICAqIEFsc28gd29ya3MgZm9yIG90aGVyIG9yZGVyZWQgdHlwZXMgc3VjaCBhcyBTdHJpbmdzIGFuZCBEYXRlcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMjAuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgT3JkIGEgPT4gYSAtPiBhIC0+IGEgLT4gYVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtaW5pbXVtIG51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXhpbXVtIG51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSB0byBiZSBjbGFtcGVkXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBSZXR1cm5zIHRoZSBjbGFtcGVkIHZhbHVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5jbGFtcCgxLCAxMCwgLTEpIC8vID0+IDFcbiAgICAgKiAgICAgIFIuY2xhbXAoMSwgMTAsIDExKSAvLyA9PiAxMFxuICAgICAqICAgICAgUi5jbGFtcCgxLCAxMCwgNCkgIC8vID0+IDRcbiAgICAgKi9cbiAgICB2YXIgY2xhbXAgPSBfY3VycnkzKGZ1bmN0aW9uIGNsYW1wKG1pbiwgbWF4LCB2YWx1ZSkge1xuICAgICAgICBpZiAobWluID4gbWF4KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pbiBtdXN0IG5vdCBiZSBncmVhdGVyIHRoYW4gbWF4IGluIGNsYW1wKG1pbiwgbWF4LCB2YWx1ZSknKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUgPCBtaW4gPyBtaW4gOiB2YWx1ZSA+IG1heCA/IG1heCA6IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTWFrZXMgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIG91dCBvZiBhIGZ1bmN0aW9uIHRoYXQgcmVwb3J0cyB3aGV0aGVyIHRoZSBmaXJzdFxuICAgICAqIGVsZW1lbnQgaXMgbGVzcyB0aGFuIHRoZSBzZWNvbmQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKGEsIGIgLT4gQm9vbGVhbikgLT4gKGEsIGIgLT4gTnVtYmVyKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgQSBwcmVkaWNhdGUgZnVuY3Rpb24gb2YgYXJpdHkgdHdvLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIEZ1bmN0aW9uIDo6IGEgLT4gYiAtPiBJbnQgdGhhdCByZXR1cm5zIGAtMWAgaWYgYSA8IGIsIGAxYCBpZiBiIDwgYSwgb3RoZXJ3aXNlIGAwYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgY21wID0gUi5jb21wYXJhdG9yKChhLCBiKSA9PiBhLmFnZSA8IGIuYWdlKTtcbiAgICAgKiAgICAgIHZhciBwZW9wbGUgPSBbXG4gICAgICogICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgXTtcbiAgICAgKiAgICAgIFIuc29ydChjbXAsIHBlb3BsZSk7XG4gICAgICovXG4gICAgdmFyIGNvbXBhcmF0b3IgPSBfY3VycnkxKGZ1bmN0aW9uIGNvbXBhcmF0b3IocHJlZCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmVkKGEsIGIpID8gLTEgOiBwcmVkKGIsIGEpID8gMSA6IDA7XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgY3VycmllZCBlcXVpdmFsZW50IG9mIHRoZSBwcm92aWRlZCBmdW5jdGlvbiwgd2l0aCB0aGUgc3BlY2lmaWVkXG4gICAgICogYXJpdHkuIFRoZSBjdXJyaWVkIGZ1bmN0aW9uIGhhcyB0d28gdW51c3VhbCBjYXBhYmlsaXRpZXMuIEZpcnN0LCBpdHNcbiAgICAgKiBhcmd1bWVudHMgbmVlZG4ndCBiZSBwcm92aWRlZCBvbmUgYXQgYSB0aW1lLiBJZiBgZ2AgaXMgYFIuY3VycnlOKDMsIGYpYCwgdGhlXG4gICAgICogZm9sbG93aW5nIGFyZSBlcXVpdmFsZW50OlxuICAgICAqXG4gICAgICogICAtIGBnKDEpKDIpKDMpYFxuICAgICAqICAgLSBgZygxKSgyLCAzKWBcbiAgICAgKiAgIC0gYGcoMSwgMikoMylgXG4gICAgICogICAtIGBnKDEsIDIsIDMpYFxuICAgICAqXG4gICAgICogU2Vjb25kbHksIHRoZSBzcGVjaWFsIHBsYWNlaG9sZGVyIHZhbHVlIGBSLl9fYCBtYXkgYmUgdXNlZCB0byBzcGVjaWZ5XG4gICAgICogXCJnYXBzXCIsIGFsbG93aW5nIHBhcnRpYWwgYXBwbGljYXRpb24gb2YgYW55IGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyxcbiAgICAgKiByZWdhcmRsZXNzIG9mIHRoZWlyIHBvc2l0aW9ucy4gSWYgYGdgIGlzIGFzIGFib3ZlIGFuZCBgX2AgaXMgYFIuX19gLCB0aGVcbiAgICAgKiBmb2xsb3dpbmcgYXJlIGVxdWl2YWxlbnQ6XG4gICAgICpcbiAgICAgKiAgIC0gYGcoMSwgMiwgMylgXG4gICAgICogICAtIGBnKF8sIDIsIDMpKDEpYFxuICAgICAqICAgLSBgZyhfLCBfLCAzKSgxKSgyKWBcbiAgICAgKiAgIC0gYGcoXywgXywgMykoMSwgMilgXG4gICAgICogICAtIGBnKF8sIDIpKDEpKDMpYFxuICAgICAqICAgLSBgZyhfLCAyKSgxLCAzKWBcbiAgICAgKiAgIC0gYGcoXywgMikoXywgMykoMSlgXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjUuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgTnVtYmVyIC0+ICgqIC0+IGEpIC0+ICgqIC0+IGEpXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCBUaGUgYXJpdHkgZm9yIHRoZSByZXR1cm5lZCBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3LCBjdXJyaWVkIGZ1bmN0aW9uLlxuICAgICAqIEBzZWUgUi5jdXJyeVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzdW1BcmdzID0gKC4uLmFyZ3MpID0+IFIuc3VtKGFyZ3MpO1xuICAgICAqXG4gICAgICogICAgICB2YXIgY3VycmllZEFkZEZvdXJOdW1iZXJzID0gUi5jdXJyeU4oNCwgc3VtQXJncyk7XG4gICAgICogICAgICB2YXIgZiA9IGN1cnJpZWRBZGRGb3VyTnVtYmVycygxLCAyKTtcbiAgICAgKiAgICAgIHZhciBnID0gZigzKTtcbiAgICAgKiAgICAgIGcoNCk7IC8vPT4gMTBcbiAgICAgKi9cbiAgICB2YXIgY3VycnlOID0gX2N1cnJ5MihmdW5jdGlvbiBjdXJyeU4obGVuZ3RoLCBmbikge1xuICAgICAgICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gX2N1cnJ5MShmbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9hcml0eShsZW5ndGgsIF9jdXJyeU4obGVuZ3RoLCBbXSwgZm4pKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIERlY3JlbWVudHMgaXRzIGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgTWF0aFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAgICogQHJldHVybiB7TnVtYmVyfVxuICAgICAqIEBzZWUgUi5pbmNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmRlYyg0Mik7IC8vPT4gNDFcbiAgICAgKi9cbiAgICB2YXIgZGVjID0gYWRkKC0xKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNlY29uZCBhcmd1bWVudCBpZiBpdCBpcyBub3QgYG51bGxgLCBgdW5kZWZpbmVkYCBvciBgTmFOYFxuICAgICAqIG90aGVyd2lzZSB0aGUgZmlyc3QgYXJndW1lbnQgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnIGEgLT4gYiAtPiBhIHwgYlxuICAgICAqIEBwYXJhbSB7YX0gdmFsIFRoZSBkZWZhdWx0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7Yn0gdmFsIFRoZSB2YWx1ZSB0byByZXR1cm4gaWYgaXQgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICogQHJldHVybiB7Kn0gVGhlIHRoZSBzZWNvbmQgdmFsdWUgb3IgdGhlIGRlZmF1bHQgdmFsdWVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZGVmYXVsdFRvNDIgPSBSLmRlZmF1bHRUbyg0Mik7XG4gICAgICpcbiAgICAgKiAgICAgIGRlZmF1bHRUbzQyKG51bGwpOyAgLy89PiA0MlxuICAgICAqICAgICAgZGVmYXVsdFRvNDIodW5kZWZpbmVkKTsgIC8vPT4gNDJcbiAgICAgKiAgICAgIGRlZmF1bHRUbzQyKCdSYW1kYScpOyAgLy89PiAnUmFtZGEnXG4gICAgICogICAgICBkZWZhdWx0VG80MihwYXJzZUludCgnc3RyaW5nJykpOyAvLz0+IDQyXG4gICAgICovXG4gICAgdmFyIGRlZmF1bHRUbyA9IF9jdXJyeTIoZnVuY3Rpb24gZGVmYXVsdFRvKGQsIHYpIHtcbiAgICAgICAgcmV0dXJuIHYgPT0gbnVsbCB8fCB2ICE9PSB2ID8gZCA6IHY7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgc2V0IChpLmUuIG5vIGR1cGxpY2F0ZXMpIG9mIGFsbCBlbGVtZW50cyBpbiB0aGUgZmlyc3QgbGlzdCBub3RcbiAgICAgKiBjb250YWluZWQgaW4gdGhlIHNlY29uZCBsaXN0LiBEdXBsaWNhdGlvbiBpcyBkZXRlcm1pbmVkIGFjY29yZGluZyB0byB0aGVcbiAgICAgKiB2YWx1ZSByZXR1cm5lZCBieSBhcHBseWluZyB0aGUgc3VwcGxpZWQgcHJlZGljYXRlIHRvIHR3byBsaXN0IGVsZW1lbnRzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIChhIC0+IGEgLT4gQm9vbGVhbikgLT4gWypdIC0+IFsqXSAtPiBbKl1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIEEgcHJlZGljYXRlIHVzZWQgdG8gdGVzdCB3aGV0aGVyIHR3byBpdGVtcyBhcmUgZXF1YWwuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDEgVGhlIGZpcnN0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDIgVGhlIHNlY29uZCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgZWxlbWVudHMgaW4gYGxpc3QxYCB0aGF0IGFyZSBub3QgaW4gYGxpc3QyYC5cbiAgICAgKiBAc2VlIFIuZGlmZmVyZW5jZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBjbXAgPSAoeCwgeSkgPT4geC5hID09PSB5LmE7XG4gICAgICogICAgICB2YXIgbDEgPSBbe2E6IDF9LCB7YTogMn0sIHthOiAzfV07XG4gICAgICogICAgICB2YXIgbDIgPSBbe2E6IDN9LCB7YTogNH1dO1xuICAgICAqICAgICAgUi5kaWZmZXJlbmNlV2l0aChjbXAsIGwxLCBsMik7IC8vPT4gW3thOiAxfSwge2E6IDJ9XVxuICAgICAqL1xuICAgIHZhciBkaWZmZXJlbmNlV2l0aCA9IF9jdXJyeTMoZnVuY3Rpb24gZGlmZmVyZW5jZVdpdGgocHJlZCwgZmlyc3QsIHNlY29uZCkge1xuICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgZmlyc3RMZW4gPSBmaXJzdC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHggPCBmaXJzdExlbikge1xuICAgICAgICAgICAgaWYgKCFfY29udGFpbnNXaXRoKHByZWQsIGZpcnN0W2lkeF0sIHNlY29uZCkgJiYgIV9jb250YWluc1dpdGgocHJlZCwgZmlyc3RbaWR4XSwgb3V0KSkge1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGZpcnN0W2lkeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgb2JqZWN0IHRoYXQgZG9lcyBub3QgY29udGFpbiBhIGBwcm9wYCBwcm9wZXJ0eS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIFN0cmluZyAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3AgdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGRpc3NvY2lhdGVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIHRoZSBvYmplY3QgdG8gY2xvbmVcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IGEgbmV3IG9iamVjdCBzaW1pbGFyIHRvIHRoZSBvcmlnaW5hbCBidXQgd2l0aG91dCB0aGUgc3BlY2lmaWVkIHByb3BlcnR5XG4gICAgICogQHNlZSBSLmFzc29jXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5kaXNzb2MoJ2InLCB7YTogMSwgYjogMiwgYzogM30pOyAvLz0+IHthOiAxLCBjOiAzfVxuICAgICAqL1xuICAgIHZhciBkaXNzb2MgPSBfY3VycnkyKGZ1bmN0aW9uIGRpc3NvYyhwcm9wLCBvYmopIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICBmb3IgKHZhciBwIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHAgIT09IHByb3ApIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbcF0gPSBvYmpbcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGEgc2hhbGxvdyBjbG9uZSBvZiBhbiBvYmplY3QsIG9taXR0aW5nIHRoZSBwcm9wZXJ0eSBhdCB0aGUgZ2l2ZW4gcGF0aC5cbiAgICAgKiBOb3RlIHRoYXQgdGhpcyBjb3BpZXMgYW5kIGZsYXR0ZW5zIHByb3RvdHlwZSBwcm9wZXJ0aWVzIG9udG8gdGhlIG5ldyBvYmplY3RcbiAgICAgKiBhcyB3ZWxsLiBBbGwgbm9uLXByaW1pdGl2ZSBwcm9wZXJ0aWVzIGFyZSBjb3BpZWQgYnkgcmVmZXJlbmNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgW1N0cmluZ10gLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhdGggdGhlIHBhdGggdG8gc2V0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiB0aGUgb2JqZWN0IHRvIGNsb25lXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBhIG5ldyBvYmplY3Qgd2l0aG91dCB0aGUgcHJvcGVydHkgYXQgcGF0aFxuICAgICAqIEBzZWUgUi5hc3NvY1BhdGhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmRpc3NvY1BhdGgoWydhJywgJ2InLCAnYyddLCB7YToge2I6IHtjOiA0Mn19fSk7IC8vPT4ge2E6IHtiOiB7fX19XG4gICAgICovXG4gICAgdmFyIGRpc3NvY1BhdGggPSBfY3VycnkyKGZ1bmN0aW9uIGRpc3NvY1BhdGgocGF0aCwgb2JqKSB7XG4gICAgICAgIHN3aXRjaCAocGF0aC5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIGRpc3NvYyhwYXRoWzBdLCBvYmopO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGhlYWQgPSBwYXRoWzBdO1xuICAgICAgICAgICAgdmFyIHRhaWwgPSBfc2xpY2UocGF0aCwgMSk7XG4gICAgICAgICAgICByZXR1cm4gb2JqW2hlYWRdID09IG51bGwgPyBvYmogOiBhc3NvYyhoZWFkLCBkaXNzb2NQYXRoKHRhaWwsIG9ialtoZWFkXSksIG9iaik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIERpdmlkZXMgdHdvIG51bWJlcnMuIEVxdWl2YWxlbnQgdG8gYGEgLyBiYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGEgVGhlIGZpcnN0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBiIFRoZSBzZWNvbmQgdmFsdWUuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgcmVzdWx0IG9mIGBhIC8gYmAuXG4gICAgICogQHNlZSBSLm11bHRpcGx5XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5kaXZpZGUoNzEsIDEwMCk7IC8vPT4gMC43MVxuICAgICAqXG4gICAgICogICAgICB2YXIgaGFsZiA9IFIuZGl2aWRlKFIuX18sIDIpO1xuICAgICAqICAgICAgaGFsZig0Mik7IC8vPT4gMjFcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHJlY2lwcm9jYWwgPSBSLmRpdmlkZSgxKTtcbiAgICAgKiAgICAgIHJlY2lwcm9jYWwoNCk7ICAgLy89PiAwLjI1XG4gICAgICovXG4gICAgdmFyIGRpdmlkZSA9IF9jdXJyeTIoZnVuY3Rpb24gZGl2aWRlKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEgLyBiO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnRhaW5pbmcgdGhlIGxhc3QgYG5gIGVsZW1lbnRzIG9mIGEgZ2l2ZW4gbGlzdCwgcGFzc2luZ1xuICAgICAqIGVhY2ggdmFsdWUgdG8gdGhlIHN1cHBsaWVkIHByZWRpY2F0ZSBmdW5jdGlvbiwgc2tpcHBpbmcgZWxlbWVudHMgd2hpbGUgdGhlXG4gICAgICogcHJlZGljYXRlIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgLiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIGlzIHBhc3NlZCBvbmVcbiAgICAgKiBhcmd1bWVudDogKih2YWx1ZSkqLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGRyb3BXaGlsZWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBhcnJheS5cbiAgICAgKiBAc2VlIFIudGFrZVdoaWxlLCBSLnRyYW5zZHVjZSwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBsdGVUd28gPSB4ID0+IHggPD0gMjtcbiAgICAgKlxuICAgICAqICAgICAgUi5kcm9wV2hpbGUobHRlVHdvLCBbMSwgMiwgMywgNCwgMywgMiwgMV0pOyAvLz0+IFszLCA0LCAzLCAyLCAxXVxuICAgICAqL1xuICAgIHZhciBkcm9wV2hpbGUgPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2Ryb3BXaGlsZScsIF94ZHJvcFdoaWxlLCBmdW5jdGlvbiBkcm9wV2hpbGUocHJlZCwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuICYmIHByZWQobGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9zbGljZShsaXN0LCBpZHgpO1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGVtcHR5IHZhbHVlIG9mIGl0cyBhcmd1bWVudCdzIHR5cGUuIFJhbWRhIGRlZmluZXMgdGhlIGVtcHR5XG4gICAgICogdmFsdWUgb2YgQXJyYXkgKGBbXWApLCBPYmplY3QgKGB7fWApLCBTdHJpbmcgKGAnJ2ApLCBhbmQgQXJndW1lbnRzLiBPdGhlclxuICAgICAqIHR5cGVzIGFyZSBzdXBwb3J0ZWQgaWYgdGhleSBkZWZpbmUgYDxUeXBlPi5lbXB0eWAgYW5kL29yXG4gICAgICogYDxUeXBlPi5wcm90b3R5cGUuZW1wdHlgLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGVtcHR5YCBtZXRob2Qgb2YgdGhlIGZpcnN0IGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4zLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIGEgLT4gYVxuICAgICAqIEBwYXJhbSB7Kn0geFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5lbXB0eShKdXN0KDQyKSk7ICAgICAgLy89PiBOb3RoaW5nKClcbiAgICAgKiAgICAgIFIuZW1wdHkoWzEsIDIsIDNdKTsgICAgIC8vPT4gW11cbiAgICAgKiAgICAgIFIuZW1wdHkoJ3VuaWNvcm5zJyk7ICAgIC8vPT4gJydcbiAgICAgKiAgICAgIFIuZW1wdHkoe3g6IDEsIHk6IDJ9KTsgIC8vPT4ge31cbiAgICAgKi9cbiAgICAvLyBlbHNlXG4gICAgdmFyIGVtcHR5ID0gX2N1cnJ5MShmdW5jdGlvbiBlbXB0eSh4KSB7XG4gICAgICAgIHJldHVybiB4ICE9IG51bGwgJiYgdHlwZW9mIHguZW1wdHkgPT09ICdmdW5jdGlvbicgPyB4LmVtcHR5KCkgOiB4ICE9IG51bGwgJiYgeC5jb25zdHJ1Y3RvciAhPSBudWxsICYmIHR5cGVvZiB4LmNvbnN0cnVjdG9yLmVtcHR5ID09PSAnZnVuY3Rpb24nID8geC5jb25zdHJ1Y3Rvci5lbXB0eSgpIDogX2lzQXJyYXkoeCkgPyBbXSA6IF9pc1N0cmluZyh4KSA/ICcnIDogX2lzT2JqZWN0KHgpID8ge30gOiBfaXNBcmd1bWVudHMoeCkgPyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzO1xuICAgICAgICB9KCkgOiAvLyBlbHNlXG4gICAgICAgIHZvaWQgMDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgb2JqZWN0IGJ5IHJlY3Vyc2l2ZWx5IGV2b2x2aW5nIGEgc2hhbGxvdyBjb3B5IG9mIGBvYmplY3RgLFxuICAgICAqIGFjY29yZGluZyB0byB0aGUgYHRyYW5zZm9ybWF0aW9uYCBmdW5jdGlvbnMuIEFsbCBub24tcHJpbWl0aXZlIHByb3BlcnRpZXNcbiAgICAgKiBhcmUgY29waWVkIGJ5IHJlZmVyZW5jZS5cbiAgICAgKlxuICAgICAqIEEgYHRyYW5zZm9ybWF0aW9uYCBmdW5jdGlvbiB3aWxsIG5vdCBiZSBpbnZva2VkIGlmIGl0cyBjb3JyZXNwb25kaW5nIGtleVxuICAgICAqIGRvZXMgbm90IGV4aXN0IGluIHRoZSBldm9sdmVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge2s6ICh2IC0+IHYpfSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtPYmplY3R9IHRyYW5zZm9ybWF0aW9ucyBUaGUgb2JqZWN0IHNwZWNpZnlpbmcgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zIHRvIGFwcGx5XG4gICAgICogICAgICAgIHRvIHRoZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGJlIHRyYW5zZm9ybWVkLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIHRyYW5zZm9ybWVkIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgdG9tYXRvICA9IHtmaXJzdE5hbWU6ICcgIFRvbWF0byAnLCBkYXRhOiB7ZWxhcHNlZDogMTAwLCByZW1haW5pbmc6IDE0MDB9LCBpZDoxMjN9O1xuICAgICAqICAgICAgdmFyIHRyYW5zZm9ybWF0aW9ucyA9IHtcbiAgICAgKiAgICAgICAgZmlyc3ROYW1lOiBSLnRyaW0sXG4gICAgICogICAgICAgIGxhc3ROYW1lOiBSLnRyaW0sIC8vIFdpbGwgbm90IGdldCBpbnZva2VkLlxuICAgICAqICAgICAgICBkYXRhOiB7ZWxhcHNlZDogUi5hZGQoMSksIHJlbWFpbmluZzogUi5hZGQoLTEpfVxuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIFIuZXZvbHZlKHRyYW5zZm9ybWF0aW9ucywgdG9tYXRvKTsgLy89PiB7Zmlyc3ROYW1lOiAnVG9tYXRvJywgZGF0YToge2VsYXBzZWQ6IDEwMSwgcmVtYWluaW5nOiAxMzk5fSwgaWQ6MTIzfVxuICAgICAqL1xuICAgIHZhciBldm9sdmUgPSBfY3VycnkyKGZ1bmN0aW9uIGV2b2x2ZSh0cmFuc2Zvcm1hdGlvbnMsIG9iamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIHZhciB0cmFuc2Zvcm1hdGlvbiwga2V5LCB0eXBlO1xuICAgICAgICBmb3IgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uID0gdHJhbnNmb3JtYXRpb25zW2tleV07XG4gICAgICAgICAgICB0eXBlID0gdHlwZW9mIHRyYW5zZm9ybWF0aW9uO1xuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB0eXBlID09PSAnZnVuY3Rpb24nID8gdHJhbnNmb3JtYXRpb24ob2JqZWN0W2tleV0pIDogdHlwZSA9PT0gJ29iamVjdCcgPyBldm9sdmUodHJhbnNmb3JtYXRpb25zW2tleV0sIG9iamVjdFtrZXldKSA6IG9iamVjdFtrZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBsaXN0IHdoaWNoIG1hdGNoZXMgdGhlIHByZWRpY2F0ZSwgb3JcbiAgICAgKiBgdW5kZWZpbmVkYCBpZiBubyBlbGVtZW50IG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZmluZGAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gYSB8IHVuZGVmaW5lZFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIGVsZW1lbnQgaXMgdGhlXG4gICAgICogICAgICAgIGRlc2lyZWQgb25lLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGVsZW1lbnQgZm91bmQsIG9yIGB1bmRlZmluZWRgLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgeHMgPSBbe2E6IDF9LCB7YTogMn0sIHthOiAzfV07XG4gICAgICogICAgICBSLmZpbmQoUi5wcm9wRXEoJ2EnLCAyKSkoeHMpOyAvLz0+IHthOiAyfVxuICAgICAqICAgICAgUi5maW5kKFIucHJvcEVxKCdhJywgNCkpKHhzKTsgLy89PiB1bmRlZmluZWRcbiAgICAgKi9cbiAgICB2YXIgZmluZCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZmluZCcsIF94ZmluZCwgZnVuY3Rpb24gZmluZChmbiwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoZm4obGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0W2lkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBsaXN0IHdoaWNoIG1hdGNoZXMgdGhlXG4gICAgICogcHJlZGljYXRlLCBvciBgLTFgIGlmIG5vIGVsZW1lbnQgbWF0Y2hlcy5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBmaW5kSW5kZXhgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjFcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIGVsZW1lbnQgaXMgdGhlXG4gICAgICogZGVzaXJlZCBvbmUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgZm91bmQsIG9yIGAtMWAuXG4gICAgICogQHNlZSBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB4cyA9IFt7YTogMX0sIHthOiAyfSwge2E6IDN9XTtcbiAgICAgKiAgICAgIFIuZmluZEluZGV4KFIucHJvcEVxKCdhJywgMikpKHhzKTsgLy89PiAxXG4gICAgICogICAgICBSLmZpbmRJbmRleChSLnByb3BFcSgnYScsIDQpKSh4cyk7IC8vPT4gLTFcbiAgICAgKi9cbiAgICB2YXIgZmluZEluZGV4ID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdmaW5kSW5kZXgnLCBfeGZpbmRJbmRleCwgZnVuY3Rpb24gZmluZEluZGV4KGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChmbihsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIGxpc3Qgd2hpY2ggbWF0Y2hlcyB0aGUgcHJlZGljYXRlLCBvclxuICAgICAqIGB1bmRlZmluZWRgIGlmIG5vIGVsZW1lbnQgbWF0Y2hlcy5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBmaW5kTGFzdGAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMVxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gYSB8IHVuZGVmaW5lZFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIGVsZW1lbnQgaXMgdGhlXG4gICAgICogZGVzaXJlZCBvbmUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgZWxlbWVudCBmb3VuZCwgb3IgYHVuZGVmaW5lZGAuXG4gICAgICogQHNlZSBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB4cyA9IFt7YTogMSwgYjogMH0sIHthOjEsIGI6IDF9XTtcbiAgICAgKiAgICAgIFIuZmluZExhc3QoUi5wcm9wRXEoJ2EnLCAxKSkoeHMpOyAvLz0+IHthOiAxLCBiOiAxfVxuICAgICAqICAgICAgUi5maW5kTGFzdChSLnByb3BFcSgnYScsIDQpKSh4cyk7IC8vPT4gdW5kZWZpbmVkXG4gICAgICovXG4gICAgdmFyIGZpbmRMYXN0ID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdmaW5kTGFzdCcsIF94ZmluZExhc3QsIGZ1bmN0aW9uIGZpbmRMYXN0KGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpZHggPj0gMCkge1xuICAgICAgICAgICAgaWYgKGZuKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdFtpZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4IC09IDE7XG4gICAgICAgIH1cbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBsaXN0IHdoaWNoIG1hdGNoZXMgdGhlXG4gICAgICogcHJlZGljYXRlLCBvciBgLTFgIGlmIG5vIGVsZW1lbnQgbWF0Y2hlcy5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBmaW5kTGFzdEluZGV4YCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4xXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBlbGVtZW50IGlzIHRoZVxuICAgICAqIGRlc2lyZWQgb25lLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGZvdW5kLCBvciBgLTFgLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgeHMgPSBbe2E6IDEsIGI6IDB9LCB7YToxLCBiOiAxfV07XG4gICAgICogICAgICBSLmZpbmRMYXN0SW5kZXgoUi5wcm9wRXEoJ2EnLCAxKSkoeHMpOyAvLz0+IDFcbiAgICAgKiAgICAgIFIuZmluZExhc3RJbmRleChSLnByb3BFcSgnYScsIDQpKSh4cyk7IC8vPT4gLTFcbiAgICAgKi9cbiAgICB2YXIgZmluZExhc3RJbmRleCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZmluZExhc3RJbmRleCcsIF94ZmluZExhc3RJbmRleCwgZnVuY3Rpb24gZmluZExhc3RJbmRleChmbiwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gbGlzdC5sZW5ndGggLSAxO1xuICAgICAgICB3aGlsZSAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIGlmIChmbihsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBJdGVyYXRlIG92ZXIgYW4gaW5wdXQgYGxpc3RgLCBjYWxsaW5nIGEgcHJvdmlkZWQgZnVuY3Rpb24gYGZuYCBmb3IgZWFjaFxuICAgICAqIGVsZW1lbnQgaW4gdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBgZm5gIHJlY2VpdmVzIG9uZSBhcmd1bWVudDogKih2YWx1ZSkqLlxuICAgICAqXG4gICAgICogTm90ZTogYFIuZm9yRWFjaGAgZG9lcyBub3Qgc2tpcCBkZWxldGVkIG9yIHVuYXNzaWduZWQgaW5kaWNlcyAoc3BhcnNlXG4gICAgICogYXJyYXlzKSwgdW5saWtlIHRoZSBuYXRpdmUgYEFycmF5LnByb3RvdHlwZS5mb3JFYWNoYCBtZXRob2QuIEZvciBtb3JlXG4gICAgICogZGV0YWlscyBvbiB0aGlzIGJlaGF2aW9yLCBzZWU6XG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZm9yRWFjaCNEZXNjcmlwdGlvblxuICAgICAqXG4gICAgICogQWxzbyBub3RlIHRoYXQsIHVubGlrZSBgQXJyYXkucHJvdG90eXBlLmZvckVhY2hgLCBSYW1kYSdzIGBmb3JFYWNoYCByZXR1cm5zXG4gICAgICogdGhlIG9yaWdpbmFsIGFycmF5LiBJbiBzb21lIGxpYnJhcmllcyB0aGlzIGZ1bmN0aW9uIGlzIG5hbWVkIGBlYWNoYC5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBmb3JFYWNoYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4xXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+ICopIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gaW52b2tlLiBSZWNlaXZlcyBvbmUgYXJndW1lbnQsIGB2YWx1ZWAuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBvcmlnaW5hbCBsaXN0LlxuICAgICAqIEBzZWUgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBwcmludFhQbHVzRml2ZSA9IHggPT4gY29uc29sZS5sb2coeCArIDUpO1xuICAgICAqICAgICAgUi5mb3JFYWNoKHByaW50WFBsdXNGaXZlLCBbMSwgMiwgM10pOyAvLz0+IFsxLCAyLCAzXVxuICAgICAqICAgICAgLy8tPiA2XG4gICAgICogICAgICAvLy0+IDdcbiAgICAgKiAgICAgIC8vLT4gOFxuICAgICAqL1xuICAgIHZhciBmb3JFYWNoID0gX2N1cnJ5MihfY2hlY2tGb3JNZXRob2QoJ2ZvckVhY2gnLCBmdW5jdGlvbiBmb3JFYWNoKGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGZuKGxpc3RbaWR4XSk7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IG9iamVjdCBvdXQgb2YgYSBsaXN0IGtleS12YWx1ZSBwYWlycy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFtbayx2XV0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtBcnJheX0gcGFpcnMgQW4gYXJyYXkgb2YgdHdvLWVsZW1lbnQgYXJyYXlzIHRoYXQgd2lsbCBiZSB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIHRoZSBvdXRwdXQgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIG9iamVjdCBtYWRlIGJ5IHBhaXJpbmcgdXAgYGtleXNgIGFuZCBgdmFsdWVzYC5cbiAgICAgKiBAc2VlIFIudG9QYWlycywgUi5wYWlyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5mcm9tUGFpcnMoW1snYScsIDFdLCBbJ2InLCAyXSwgIFsnYycsIDNdXSk7IC8vPT4ge2E6IDEsIGI6IDIsIGM6IDN9XG4gICAgICovXG4gICAgdmFyIGZyb21QYWlycyA9IF9jdXJyeTEoZnVuY3Rpb24gZnJvbVBhaXJzKHBhaXJzKSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gcGFpcnMubGVuZ3RoO1xuICAgICAgICB2YXIgb3V0ID0ge307XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChfaXNBcnJheShwYWlyc1tpZHhdKSAmJiBwYWlyc1tpZHhdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG91dFtwYWlyc1tpZHhdWzBdXSA9IHBhaXJzW2lkeF1bMV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBsaXN0IGFuZCByZXR1cm5zIGEgbGlzdCBvZiBsaXN0cyB3aGVyZSBlYWNoIHN1Ymxpc3QncyBlbGVtZW50cyBhcmVcbiAgICAgKiBhbGwgXCJlcXVhbFwiIGFjY29yZGluZyB0byB0aGUgcHJvdmlkZWQgZXF1YWxpdHkgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIxLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEsIGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IFtbYV1dXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gZm9yIGRldGVybWluaW5nIHdoZXRoZXIgdHdvIGdpdmVuIChhZGphY2VudClcbiAgICAgKiAgICAgICAgZWxlbWVudHMgc2hvdWxkIGJlIGluIHRoZSBzYW1lIGdyb3VwXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gZ3JvdXAuIEFsc28gYWNjZXB0cyBhIHN0cmluZywgd2hpY2ggd2lsbCBiZVxuICAgICAqICAgICAgICB0cmVhdGVkIGFzIGEgbGlzdCBvZiBjaGFyYWN0ZXJzLlxuICAgICAqIEByZXR1cm4ge0xpc3R9IEEgbGlzdCB0aGF0IGNvbnRhaW5zIHN1Ymxpc3RzIG9mIGVxdWFsIGVsZW1lbnRzLFxuICAgICAqICAgICAgICAgd2hvc2UgY29uY2F0ZW5hdGlvbnMgaXMgZXF1YWwgdG8gdGhlIG9yaWdpbmFsIGxpc3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgIGdyb3VwV2l0aChSLmVxdWFscywgWzAsIDEsIDEsIDIsIDMsIDUsIDgsIDEzLCAyMV0pXG4gICAgICogICAgLy8gW1swXSwgWzEsIDFdLCBbMiwgMywgNSwgOCwgMTMsIDIxXV1cbiAgICAgKlxuICAgICAqICAgIGdyb3VwV2l0aCgoYSwgYikgPT4gYSAlIDIgPT09IGIgJSAyLCBbMCwgMSwgMSwgMiwgMywgNSwgOCwgMTMsIDIxXSlcbiAgICAgKiAgICAvLyBbWzBdLCBbMSwgMV0sIFsyXSwgWzMsIDVdLCBbOF0sIFsxMywgMjFdXVxuICAgICAqXG4gICAgICogICAgUi5ncm91cFdpdGgoUi5lcUJ5KGlzVm93ZWwpLCAnYWVzdGlvdScpXG4gICAgICogICAgLy8gWydhZScsICdzdCcsICdpb3UnXVxuICAgICAqL1xuICAgIHZhciBncm91cFdpdGggPSBfY3VycnkyKGZ1bmN0aW9uIChmbiwgbGlzdCkge1xuICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIHZhciBuZXh0aWR4ID0gaWR4ICsgMTtcbiAgICAgICAgICAgIHdoaWxlIChuZXh0aWR4IDwgbGVuICYmIGZuKGxpc3RbaWR4XSwgbGlzdFtuZXh0aWR4XSkpIHtcbiAgICAgICAgICAgICAgICBuZXh0aWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMucHVzaChsaXN0LnNsaWNlKGlkeCwgbmV4dGlkeCkpO1xuICAgICAgICAgICAgaWR4ID0gbmV4dGlkeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIGdyZWF0ZXIgdGhhbiB0aGUgc2Vjb25kOyBgZmFsc2VgXG4gICAgICogb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBhID0+IGEgLT4gYSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSBhXG4gICAgICogQHBhcmFtIHsqfSBiXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAc2VlIFIubHRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmd0KDIsIDEpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuZ3QoMiwgMik7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuZ3QoMiwgMyk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuZ3QoJ2EnLCAneicpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmd0KCd6JywgJ2EnKTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGd0ID0gX2N1cnJ5MihmdW5jdGlvbiBndChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhID4gYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHNlY29uZDtcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBPcmQgYSA9PiBhIC0+IGEgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGJcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5sdGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmd0ZSgyLCAxKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmd0ZSgyLCAyKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmd0ZSgyLCAzKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5ndGUoJ2EnLCAneicpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmd0ZSgneicsICdhJyk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBndGUgPSBfY3VycnkyKGZ1bmN0aW9uIGd0ZShhLCBiKSB7XG4gICAgICAgIHJldHVybiBhID49IGI7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IGFuIG9iamVjdCBoYXMgYW4gb3duIHByb3BlcnR5IHdpdGggdGhlIHNwZWNpZmllZCBuYW1lXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjcuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHMgLT4ge3M6IHh9IC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcCBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gY2hlY2sgZm9yLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBxdWVyeS5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBXaGV0aGVyIHRoZSBwcm9wZXJ0eSBleGlzdHMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGhhc05hbWUgPSBSLmhhcygnbmFtZScpO1xuICAgICAqICAgICAgaGFzTmFtZSh7bmFtZTogJ2FsaWNlJ30pOyAgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgaGFzTmFtZSh7bmFtZTogJ2JvYid9KTsgICAgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgaGFzTmFtZSh7fSk7ICAgICAgICAgICAgICAgIC8vPT4gZmFsc2VcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHBvaW50ID0ge3g6IDAsIHk6IDB9O1xuICAgICAqICAgICAgdmFyIHBvaW50SGFzID0gUi5oYXMoUi5fXywgcG9pbnQpO1xuICAgICAqICAgICAgcG9pbnRIYXMoJ3gnKTsgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgcG9pbnRIYXMoJ3knKTsgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgcG9pbnRIYXMoJ3onKTsgIC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgaGFzID0gX2N1cnJ5MihfaGFzKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgd2hldGhlciBvciBub3QgYW4gb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW4gaGFzIGEgcHJvcGVydHkgd2l0aFxuICAgICAqIHRoZSBzcGVjaWZpZWQgbmFtZVxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC43LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBzIC0+IHtzOiB4fSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3AgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGNoZWNrIGZvci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciB0aGUgcHJvcGVydHkgZXhpc3RzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIGZ1bmN0aW9uIFJlY3RhbmdsZSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICogICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgKiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICogICAgICB9XG4gICAgICogICAgICBSZWN0YW5nbGUucHJvdG90eXBlLmFyZWEgPSBmdW5jdGlvbigpIHtcbiAgICAgKiAgICAgICAgcmV0dXJuIHRoaXMud2lkdGggKiB0aGlzLmhlaWdodDtcbiAgICAgKiAgICAgIH07XG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzcXVhcmUgPSBuZXcgUmVjdGFuZ2xlKDIsIDIpO1xuICAgICAqICAgICAgUi5oYXNJbignd2lkdGgnLCBzcXVhcmUpOyAgLy89PiB0cnVlXG4gICAgICogICAgICBSLmhhc0luKCdhcmVhJywgc3F1YXJlKTsgIC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBoYXNJbiA9IF9jdXJyeTIoZnVuY3Rpb24gaGFzSW4ocHJvcCwgb2JqKSB7XG4gICAgICAgIHJldHVybiBwcm9wIGluIG9iajtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiBpdHMgYXJndW1lbnRzIGFyZSBpZGVudGljYWwsIGZhbHNlIG90aGVyd2lzZS4gVmFsdWVzIGFyZVxuICAgICAqIGlkZW50aWNhbCBpZiB0aGV5IHJlZmVyZW5jZSB0aGUgc2FtZSBtZW1vcnkuIGBOYU5gIGlzIGlkZW50aWNhbCB0byBgTmFOYDtcbiAgICAgKiBgMGAgYW5kIGAtMGAgYXJlIG5vdCBpZGVudGljYWwuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE1LjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIGEgLT4gYSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSBhXG4gICAgICogQHBhcmFtIHsqfSBiXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbyA9IHt9O1xuICAgICAqICAgICAgUi5pZGVudGljYWwobywgbyk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pZGVudGljYWwoMSwgMSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pZGVudGljYWwoMSwgJzEnKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pZGVudGljYWwoW10sIFtdKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pZGVudGljYWwoMCwgLTApOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmlkZW50aWNhbChOYU4sIE5hTik7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIC8vIFNhbWVWYWx1ZSBhbGdvcml0aG1cbiAgICAvLyBTdGVwcyAxLTUsIDctMTBcbiAgICAvLyBTdGVwcyA2LmItNi5lOiArMCAhPSAtMFxuICAgIC8vIFN0ZXAgNi5hOiBOYU4gPT0gTmFOXG4gICAgdmFyIGlkZW50aWNhbCA9IF9jdXJyeTIoZnVuY3Rpb24gaWRlbnRpY2FsKGEsIGIpIHtcbiAgICAgICAgLy8gU2FtZVZhbHVlIGFsZ29yaXRobVxuICAgICAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICAgICAgLy8gU3RlcHMgMS01LCA3LTEwXG4gICAgICAgICAgICAvLyBTdGVwcyA2LmItNi5lOiArMCAhPSAtMFxuICAgICAgICAgICAgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT09IDEgLyBiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gU3RlcCA2LmE6IE5hTiA9PSBOYU5cbiAgICAgICAgICAgIHJldHVybiBhICE9PSBhICYmIGIgIT09IGI7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEEgZnVuY3Rpb24gdGhhdCBkb2VzIG5vdGhpbmcgYnV0IHJldHVybiB0aGUgcGFyYW1ldGVyIHN1cHBsaWVkIHRvIGl0LiBHb29kXG4gICAgICogYXMgYSBkZWZhdWx0IG9yIHBsYWNlaG9sZGVyIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIGEgLT4gYVxuICAgICAqIEBwYXJhbSB7Kn0geCBUaGUgdmFsdWUgdG8gcmV0dXJuLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSBpbnB1dCB2YWx1ZSwgYHhgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuaWRlbnRpdHkoMSk7IC8vPT4gMVxuICAgICAqXG4gICAgICogICAgICB2YXIgb2JqID0ge307XG4gICAgICogICAgICBSLmlkZW50aXR5KG9iaikgPT09IG9iajsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGlkZW50aXR5ID0gX2N1cnJ5MShfaWRlbnRpdHkpO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9jZXNzIGVpdGhlciB0aGUgYG9uVHJ1ZWAgb3IgdGhlIGBvbkZhbHNlYFxuICAgICAqIGZ1bmN0aW9uIGRlcGVuZGluZyB1cG9uIHRoZSByZXN1bHQgb2YgdGhlIGBjb25kaXRpb25gIHByZWRpY2F0ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOC4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyAoKi4uLiAtPiBCb29sZWFuKSAtPiAoKi4uLiAtPiAqKSAtPiAoKi4uLiAtPiAqKSAtPiAoKi4uLiAtPiAqKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbmRpdGlvbiBBIHByZWRpY2F0ZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uVHJ1ZSBBIGZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBgY29uZGl0aW9uYCBldmFsdWF0ZXMgdG8gYSB0cnV0aHkgdmFsdWUuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25GYWxzZSBBIGZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBgY29uZGl0aW9uYCBldmFsdWF0ZXMgdG8gYSBmYWxzeSB2YWx1ZS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgdW5hcnkgZnVuY3Rpb24gdGhhdCB3aWxsIHByb2Nlc3MgZWl0aGVyIHRoZSBgb25UcnVlYCBvciB0aGUgYG9uRmFsc2VgXG4gICAgICogICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGRlcGVuZGluZyB1cG9uIHRoZSByZXN1bHQgb2YgdGhlIGBjb25kaXRpb25gIHByZWRpY2F0ZS5cbiAgICAgKiBAc2VlIFIudW5sZXNzLCBSLndoZW5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaW5jQ291bnQgPSBSLmlmRWxzZShcbiAgICAgKiAgICAgICAgUi5oYXMoJ2NvdW50JyksXG4gICAgICogICAgICAgIFIub3ZlcihSLmxlbnNQcm9wKCdjb3VudCcpLCBSLmluYyksXG4gICAgICogICAgICAgIFIuYXNzb2MoJ2NvdW50JywgMSlcbiAgICAgKiAgICAgICk7XG4gICAgICogICAgICBpbmNDb3VudCh7fSk7ICAgICAgICAgICAvLz0+IHsgY291bnQ6IDEgfVxuICAgICAqICAgICAgaW5jQ291bnQoeyBjb3VudDogMSB9KTsgLy89PiB7IGNvdW50OiAyIH1cbiAgICAgKi9cbiAgICB2YXIgaWZFbHNlID0gX2N1cnJ5MyhmdW5jdGlvbiBpZkVsc2UoY29uZGl0aW9uLCBvblRydWUsIG9uRmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5TihNYXRoLm1heChjb25kaXRpb24ubGVuZ3RoLCBvblRydWUubGVuZ3RoLCBvbkZhbHNlLmxlbmd0aCksIGZ1bmN0aW9uIF9pZkVsc2UoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZGl0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgPyBvblRydWUuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IG9uRmFsc2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBJbmNyZW1lbnRzIGl0cyBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gblxuICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgKiBAc2VlIFIuZGVjXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5pbmMoNDIpOyAvLz0+IDQzXG4gICAgICovXG4gICAgdmFyIGluYyA9IGFkZCgxKTtcblxuICAgIC8qKlxuICAgICAqIEluc2VydHMgdGhlIHN1cHBsaWVkIGVsZW1lbnQgaW50byB0aGUgbGlzdCwgYXQgaW5kZXggYGluZGV4YC4gX05vdGUgdGhhdFxuICAgICAqIHRoaXMgaXMgbm90IGRlc3RydWN0aXZlXzogaXQgcmV0dXJucyBhIGNvcHkgb2YgdGhlIGxpc3Qgd2l0aCB0aGUgY2hhbmdlcy5cbiAgICAgKiA8c21hbGw+Tm8gbGlzdHMgaGF2ZSBiZWVuIGhhcm1lZCBpbiB0aGUgYXBwbGljYXRpb24gb2YgdGhpcyBmdW5jdGlvbi48L3NtYWxsPlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yLjJcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IGEgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleCBUaGUgcG9zaXRpb24gdG8gaW5zZXJ0IHRoZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHsqfSBlbHQgVGhlIGVsZW1lbnQgdG8gaW5zZXJ0IGludG8gdGhlIEFycmF5XG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpbnNlcnQgaW50b1xuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBBcnJheSB3aXRoIGBlbHRgIGluc2VydGVkIGF0IGBpbmRleGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5pbnNlcnQoMiwgJ3gnLCBbMSwyLDMsNF0pOyAvLz0+IFsxLDIsJ3gnLDMsNF1cbiAgICAgKi9cbiAgICB2YXIgaW5zZXJ0ID0gX2N1cnJ5MyhmdW5jdGlvbiBpbnNlcnQoaWR4LCBlbHQsIGxpc3QpIHtcbiAgICAgICAgaWR4ID0gaWR4IDwgbGlzdC5sZW5ndGggJiYgaWR4ID49IDAgPyBpZHggOiBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IF9zbGljZShsaXN0KTtcbiAgICAgICAgcmVzdWx0LnNwbGljZShpZHgsIDAsIGVsdCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBJbnNlcnRzIHRoZSBzdWItbGlzdCBpbnRvIHRoZSBsaXN0LCBhdCBpbmRleCBgaW5kZXhgLiBfTm90ZSB0aGF0IHRoaXMgaXMgbm90XG4gICAgICogZGVzdHJ1Y3RpdmVfOiBpdCByZXR1cm5zIGEgY29weSBvZiB0aGUgbGlzdCB3aXRoIHRoZSBjaGFuZ2VzLlxuICAgICAqIDxzbWFsbD5ObyBsaXN0cyBoYXZlIGJlZW4gaGFybWVkIGluIHRoZSBhcHBsaWNhdGlvbiBvZiB0aGlzIGZ1bmN0aW9uLjwvc21hbGw+XG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXggVGhlIHBvc2l0aW9uIHRvIGluc2VydCB0aGUgc3ViLWxpc3RcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBlbHRzIFRoZSBzdWItbGlzdCB0byBpbnNlcnQgaW50byB0aGUgQXJyYXlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGluc2VydCB0aGUgc3ViLWxpc3QgaW50b1xuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBBcnJheSB3aXRoIGBlbHRzYCBpbnNlcnRlZCBzdGFydGluZyBhdCBgaW5kZXhgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuaW5zZXJ0QWxsKDIsIFsneCcsJ3knLCd6J10sIFsxLDIsMyw0XSk7IC8vPT4gWzEsMiwneCcsJ3knLCd6JywzLDRdXG4gICAgICovXG4gICAgdmFyIGluc2VydEFsbCA9IF9jdXJyeTMoZnVuY3Rpb24gaW5zZXJ0QWxsKGlkeCwgZWx0cywgbGlzdCkge1xuICAgICAgICBpZHggPSBpZHggPCBsaXN0Lmxlbmd0aCAmJiBpZHggPj0gMCA/IGlkeCA6IGxpc3QubGVuZ3RoO1xuICAgICAgICByZXR1cm4gX2NvbmNhdChfY29uY2F0KF9zbGljZShsaXN0LCAwLCBpZHgpLCBlbHRzKSwgX3NsaWNlKGxpc3QsIGlkeCkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBsaXN0IHdpdGggdGhlIHNlcGFyYXRvciBpbnRlcnBvc2VkIGJldHdlZW4gZWxlbWVudHMuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgaW50ZXJzcGVyc2VgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNC4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGEgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7Kn0gc2VwYXJhdG9yIFRoZSBlbGVtZW50IHRvIGFkZCB0byB0aGUgbGlzdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGJlIGludGVycG9zZWQuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBuZXcgbGlzdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmludGVyc3BlcnNlKCduJywgWydiYScsICdhJywgJ2EnXSk7IC8vPT4gWydiYScsICduJywgJ2EnLCAnbicsICdhJ11cbiAgICAgKi9cbiAgICB2YXIgaW50ZXJzcGVyc2UgPSBfY3VycnkyKF9jaGVja0Zvck1ldGhvZCgnaW50ZXJzcGVyc2UnLCBmdW5jdGlvbiBpbnRlcnNwZXJzZShzZXBhcmF0b3IsIGxpc3QpIHtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaWR4ID09PSBsZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gobGlzdFtpZHhdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gobGlzdFtpZHhdLCBzZXBhcmF0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBTZWUgaWYgYW4gb2JqZWN0IChgdmFsYCkgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIHN1cHBsaWVkIGNvbnN0cnVjdG9yLiBUaGlzXG4gICAgICogZnVuY3Rpb24gd2lsbCBjaGVjayB1cCB0aGUgaW5oZXJpdGFuY2UgY2hhaW4sIGlmIGFueS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IFR5cGVcbiAgICAgKiBAc2lnICgqIC0+IHsqfSkgLT4gYSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGN0b3IgQSBjb25zdHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7Kn0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmlzKE9iamVjdCwge30pOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaXMoTnVtYmVyLCAxKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzKE9iamVjdCwgMSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuaXMoU3RyaW5nLCAncycpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaXMoU3RyaW5nLCBuZXcgU3RyaW5nKCcnKSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pcyhPYmplY3QsIG5ldyBTdHJpbmcoJycpKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzKE9iamVjdCwgJ3MnKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pcyhOdW1iZXIsIHt9KTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBpcyA9IF9jdXJyeTIoZnVuY3Rpb24gaXMoQ3RvciwgdmFsKSB7XG4gICAgICAgIHJldHVybiB2YWwgIT0gbnVsbCAmJiB2YWwuY29uc3RydWN0b3IgPT09IEN0b3IgfHwgdmFsIGluc3RhbmNlb2YgQ3RvcjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHdoZXRoZXIgb3Igbm90IGFuIG9iamVjdCBpcyBzaW1pbGFyIHRvIGFuIGFycmF5LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC41LjBcbiAgICAgKiBAY2F0ZWdvcnkgVHlwZVxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAqIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0geyp9IHggVGhlIG9iamVjdCB0byB0ZXN0LlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBgeGAgaGFzIGEgbnVtZXJpYyBsZW5ndGggcHJvcGVydHkgYW5kIGV4dHJlbWUgaW5kaWNlcyBkZWZpbmVkOyBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmlzQXJyYXlMaWtlKFtdKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzQXJyYXlMaWtlKHRydWUpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmlzQXJyYXlMaWtlKHt9KTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pc0FycmF5TGlrZSh7bGVuZ3RoOiAxMH0pOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmlzQXJyYXlMaWtlKHswOiAnemVybycsIDk6ICduaW5lJywgbGVuZ3RoOiAxMH0pOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgaXNBcnJheUxpa2UgPSBfY3VycnkxKGZ1bmN0aW9uIGlzQXJyYXlMaWtlKHgpIHtcbiAgICAgICAgaWYgKF9pc0FycmF5KHgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeC5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuICEheC5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHgubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4geC5oYXNPd25Qcm9wZXJ0eSgwKSAmJiB4Lmhhc093blByb3BlcnR5KHgubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBpbnB1dCB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBUeXBlXG4gICAgICogQHNpZyAqIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0geyp9IHggVGhlIHZhbHVlIHRvIHRlc3QuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIGB4YCBpcyBgdW5kZWZpbmVkYCBvciBgbnVsbGAsIG90aGVyd2lzZSBgZmFsc2VgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuaXNOaWwobnVsbCk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pc05pbCh1bmRlZmluZWQpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaXNOaWwoMCk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuaXNOaWwoW10pOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGlzTmlsID0gX2N1cnJ5MShmdW5jdGlvbiBpc05pbCh4KSB7XG4gICAgICAgIHJldHVybiB4ID09IG51bGw7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBjb250YWluaW5nIHRoZSBuYW1lcyBvZiBhbGwgdGhlIGVudW1lcmFibGUgb3duIHByb3BlcnRpZXMgb2ZcbiAgICAgKiB0aGUgc3VwcGxpZWQgb2JqZWN0LlxuICAgICAqIE5vdGUgdGhhdCB0aGUgb3JkZXIgb2YgdGhlIG91dHB1dCBhcnJheSBpcyBub3QgZ3VhcmFudGVlZCB0byBiZSBjb25zaXN0ZW50XG4gICAgICogYWNyb3NzIGRpZmZlcmVudCBKUyBwbGF0Zm9ybXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtrOiB2fSAtPiBba11cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZXh0cmFjdCBwcm9wZXJ0aWVzIGZyb21cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgb2YgdGhlIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIua2V5cyh7YTogMSwgYjogMiwgYzogM30pOyAvLz0+IFsnYScsICdiJywgJ2MnXVxuICAgICAqL1xuICAgIC8vIGNvdmVyIElFIDwgOSBrZXlzIGlzc3Vlc1xuICAgIC8vIFNhZmFyaSBidWdcbiAgICB2YXIga2V5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY292ZXIgSUUgPCA5IGtleXMgaXNzdWVzXG4gICAgICAgIHZhciBoYXNFbnVtQnVnID0gIXsgdG9TdHJpbmc6IG51bGwgfS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKTtcbiAgICAgICAgdmFyIG5vbkVudW1lcmFibGVQcm9wcyA9IFtcbiAgICAgICAgICAgICdjb25zdHJ1Y3RvcicsXG4gICAgICAgICAgICAndmFsdWVPZicsXG4gICAgICAgICAgICAnaXNQcm90b3R5cGVPZicsXG4gICAgICAgICAgICAndG9TdHJpbmcnLFxuICAgICAgICAgICAgJ3Byb3BlcnR5SXNFbnVtZXJhYmxlJyxcbiAgICAgICAgICAgICdoYXNPd25Qcm9wZXJ0eScsXG4gICAgICAgICAgICAndG9Mb2NhbGVTdHJpbmcnXG4gICAgICAgIF07XG4gICAgICAgIC8vIFNhZmFyaSBidWdcbiAgICAgICAgdmFyIGhhc0FyZ3NFbnVtQnVnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5wcm9wZXJ0eUlzRW51bWVyYWJsZSgnbGVuZ3RoJyk7XG4gICAgICAgIH0oKTtcbiAgICAgICAgdmFyIGNvbnRhaW5zID0gZnVuY3Rpb24gY29udGFpbnMobGlzdCwgaXRlbSkge1xuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAobGlzdFtpZHhdID09PSBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJyAmJiAhaGFzQXJnc0VudW1CdWcgPyBfY3VycnkxKGZ1bmN0aW9uIGtleXMob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0KG9iaikgIT09IG9iaiA/IFtdIDogT2JqZWN0LmtleXMob2JqKTtcbiAgICAgICAgfSkgOiBfY3VycnkxKGZ1bmN0aW9uIGtleXMob2JqKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0KG9iaikgIT09IG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwcm9wLCBuSWR4O1xuICAgICAgICAgICAgdmFyIGtzID0gW107XG4gICAgICAgICAgICB2YXIgY2hlY2tBcmdzTGVuZ3RoID0gaGFzQXJnc0VudW1CdWcgJiYgX2lzQXJndW1lbnRzKG9iaik7XG4gICAgICAgICAgICBmb3IgKHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9oYXMocHJvcCwgb2JqKSAmJiAoIWNoZWNrQXJnc0xlbmd0aCB8fCBwcm9wICE9PSAnbGVuZ3RoJykpIHtcbiAgICAgICAgICAgICAgICAgICAga3Nba3MubGVuZ3RoXSA9IHByb3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhhc0VudW1CdWcpIHtcbiAgICAgICAgICAgICAgICBuSWR4ID0gbm9uRW51bWVyYWJsZVByb3BzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG5JZHggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wID0gbm9uRW51bWVyYWJsZVByb3BzW25JZHhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2hhcyhwcm9wLCBvYmopICYmICFjb250YWlucyhrcywgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtzW2tzLmxlbmd0aF0gPSBwcm9wO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5JZHggLT0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ga3M7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsaXN0IGNvbnRhaW5pbmcgdGhlIG5hbWVzIG9mIGFsbCB0aGUgcHJvcGVydGllcyBvZiB0aGUgc3VwcGxpZWRcbiAgICAgKiBvYmplY3QsIGluY2x1ZGluZyBwcm90b3R5cGUgcHJvcGVydGllcy5cbiAgICAgKiBOb3RlIHRoYXQgdGhlIG9yZGVyIG9mIHRoZSBvdXRwdXQgYXJyYXkgaXMgbm90IGd1YXJhbnRlZWQgdG8gYmUgY29uc2lzdGVudFxuICAgICAqIGFjcm9zcyBkaWZmZXJlbnQgSlMgcGxhdGZvcm1zLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7azogdn0gLT4gW2tdXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGV4dHJhY3QgcHJvcGVydGllcyBmcm9tXG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIHRoZSBvYmplY3QncyBvd24gYW5kIHByb3RvdHlwZSBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBGID0gZnVuY3Rpb24oKSB7IHRoaXMueCA9ICdYJzsgfTtcbiAgICAgKiAgICAgIEYucHJvdG90eXBlLnkgPSAnWSc7XG4gICAgICogICAgICB2YXIgZiA9IG5ldyBGKCk7XG4gICAgICogICAgICBSLmtleXNJbihmKTsgLy89PiBbJ3gnLCAneSddXG4gICAgICovXG4gICAgdmFyIGtleXNJbiA9IF9jdXJyeTEoZnVuY3Rpb24ga2V5c0luKG9iaikge1xuICAgICAgICB2YXIgcHJvcDtcbiAgICAgICAgdmFyIGtzID0gW107XG4gICAgICAgIGZvciAocHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGtzW2tzLmxlbmd0aF0gPSBwcm9wO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrcztcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgYXJyYXkgYnkgcmV0dXJuaW5nIGBsaXN0Lmxlbmd0aGAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gaW5zcGVjdC5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBsZW5ndGggb2YgdGhlIGFycmF5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubGVuZ3RoKFtdKTsgLy89PiAwXG4gICAgICogICAgICBSLmxlbmd0aChbMSwgMiwgM10pOyAvLz0+IDNcbiAgICAgKi9cbiAgICB2YXIgbGVuZ3RoID0gX2N1cnJ5MShmdW5jdGlvbiBsZW5ndGgobGlzdCkge1xuICAgICAgICByZXR1cm4gbGlzdCAhPSBudWxsICYmIGlzKE51bWJlciwgbGlzdC5sZW5ndGgpID8gbGlzdC5sZW5ndGggOiBOYU47XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZmlyc3QgYXJndW1lbnQgaXMgbGVzcyB0aGFuIHRoZSBzZWNvbmQ7IGBmYWxzZWBcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgT3JkIGEgPT4gYSAtPiBhIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0geyp9IGFcbiAgICAgKiBAcGFyYW0geyp9IGJcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5ndFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubHQoMiwgMSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIubHQoMiwgMik7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIubHQoMiwgMyk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5sdCgnYScsICd6Jyk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5sdCgneicsICdhJyk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgbHQgPSBfY3VycnkyKGZ1bmN0aW9uIGx0KGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEgPCBiO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgc2Vjb25kO1xuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBhID0+IGEgLT4gYSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGFcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLmd0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubHRlKDIsIDEpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmx0ZSgyLCAyKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmx0ZSgyLCAzKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmx0ZSgnYScsICd6Jyk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5sdGUoJ3onLCAnYScpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGx0ZSA9IF9jdXJyeTIoZnVuY3Rpb24gbHRlKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEgPD0gYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXBBY2N1bSBmdW5jdGlvbiBiZWhhdmVzIGxpa2UgYSBjb21iaW5hdGlvbiBvZiBtYXAgYW5kIHJlZHVjZTsgaXRcbiAgICAgKiBhcHBsaWVzIGEgZnVuY3Rpb24gdG8gZWFjaCBlbGVtZW50IG9mIGEgbGlzdCwgcGFzc2luZyBhbiBhY2N1bXVsYXRpbmdcbiAgICAgKiBwYXJhbWV0ZXIgZnJvbSBsZWZ0IHRvIHJpZ2h0LCBhbmQgcmV0dXJuaW5nIGEgZmluYWwgdmFsdWUgb2YgdGhpc1xuICAgICAqIGFjY3VtdWxhdG9yIHRvZ2V0aGVyIHdpdGggdGhlIG5ldyBsaXN0LlxuICAgICAqXG4gICAgICogVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIHJlY2VpdmVzIHR3byBhcmd1bWVudHMsICphY2MqIGFuZCAqdmFsdWUqLCBhbmQgc2hvdWxkXG4gICAgICogcmV0dXJuIGEgdHVwbGUgKlthY2MsIHZhbHVlXSouXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGFjYyAtPiB4IC0+IChhY2MsIHkpKSAtPiBhY2MgLT4gW3hdIC0+IChhY2MsIFt5XSlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhlIGlucHV0IGBsaXN0YC5cbiAgICAgKiBAcGFyYW0geyp9IGFjYyBUaGUgYWNjdW11bGF0b3IgdmFsdWUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGZpbmFsLCBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAc2VlIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZGlnaXRzID0gWycxJywgJzInLCAnMycsICc0J107XG4gICAgICogICAgICB2YXIgYXBwZW5kZXIgPSAoYSwgYikgPT4gW2EgKyBiLCBhICsgYl07XG4gICAgICpcbiAgICAgKiAgICAgIFIubWFwQWNjdW0oYXBwZW5kZXIsIDAsIGRpZ2l0cyk7IC8vPT4gWycwMTIzNCcsIFsnMDEnLCAnMDEyJywgJzAxMjMnLCAnMDEyMzQnXV1cbiAgICAgKi9cbiAgICB2YXIgbWFwQWNjdW0gPSBfY3VycnkzKGZ1bmN0aW9uIG1hcEFjY3VtKGZuLCBhY2MsIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgdHVwbGUgPSBbYWNjXTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgdHVwbGUgPSBmbih0dXBsZVswXSwgbGlzdFtpZHhdKTtcbiAgICAgICAgICAgIHJlc3VsdFtpZHhdID0gdHVwbGVbMV07XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdHVwbGVbMF0sXG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgXTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBtYXBBY2N1bVJpZ2h0IGZ1bmN0aW9uIGJlaGF2ZXMgbGlrZSBhIGNvbWJpbmF0aW9uIG9mIG1hcCBhbmQgcmVkdWNlOyBpdFxuICAgICAqIGFwcGxpZXMgYSBmdW5jdGlvbiB0byBlYWNoIGVsZW1lbnQgb2YgYSBsaXN0LCBwYXNzaW5nIGFuIGFjY3VtdWxhdGluZ1xuICAgICAqIHBhcmFtZXRlciBmcm9tIHJpZ2h0IHRvIGxlZnQsIGFuZCByZXR1cm5pbmcgYSBmaW5hbCB2YWx1ZSBvZiB0aGlzXG4gICAgICogYWNjdW11bGF0b3IgdG9nZXRoZXIgd2l0aCB0aGUgbmV3IGxpc3QuXG4gICAgICpcbiAgICAgKiBTaW1pbGFyIHRvIGBtYXBBY2N1bWAsIGV4Y2VwdCBtb3ZlcyB0aHJvdWdoIHRoZSBpbnB1dCBsaXN0IGZyb20gdGhlIHJpZ2h0IHRvXG4gICAgICogdGhlIGxlZnQuXG4gICAgICpcbiAgICAgKiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24gcmVjZWl2ZXMgdHdvIGFyZ3VtZW50cywgKmFjYyogYW5kICp2YWx1ZSosIGFuZCBzaG91bGRcbiAgICAgKiByZXR1cm4gYSB0dXBsZSAqW2FjYywgdmFsdWVdKi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYWNjIC0+IHggLT4gKGFjYywgeSkpIC0+IGFjYyAtPiBbeF0gLT4gKGFjYywgW3ldKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gZXZlcnkgZWxlbWVudCBvZiB0aGUgaW5wdXQgYGxpc3RgLlxuICAgICAqIEBwYXJhbSB7Kn0gYWNjIFRoZSBhY2N1bXVsYXRvciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgZmluYWwsIGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgICAqIEBzZWUgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBkaWdpdHMgPSBbJzEnLCAnMicsICczJywgJzQnXTtcbiAgICAgKiAgICAgIHZhciBhcHBlbmQgPSAoYSwgYikgPT4gW2EgKyBiLCBhICsgYl07XG4gICAgICpcbiAgICAgKiAgICAgIFIubWFwQWNjdW1SaWdodChhcHBlbmQsIDAsIGRpZ2l0cyk7IC8vPT4gWycwNDMyMScsIFsnMDQzMjEnLCAnMDQzMicsICcwNDMnLCAnMDQnXV1cbiAgICAgKi9cbiAgICB2YXIgbWFwQWNjdW1SaWdodCA9IF9jdXJyeTMoZnVuY3Rpb24gbWFwQWNjdW1SaWdodChmbiwgYWNjLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIHR1cGxlID0gW2FjY107XG4gICAgICAgIHdoaWxlIChpZHggPj0gMCkge1xuICAgICAgICAgICAgdHVwbGUgPSBmbih0dXBsZVswXSwgbGlzdFtpZHhdKTtcbiAgICAgICAgICAgIHJlc3VsdFtpZHhdID0gdHVwbGVbMV07XG4gICAgICAgICAgICBpZHggLT0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgdHVwbGVbMF0sXG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgXTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRlc3RzIGEgcmVndWxhciBleHByZXNzaW9uIGFnYWluc3QgYSBTdHJpbmcuIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIHdpbGxcbiAgICAgKiByZXR1cm4gYW4gZW1wdHkgYXJyYXkgd2hlbiB0aGVyZSBhcmUgbm8gbWF0Y2hlcy4gVGhpcyBkaWZmZXJzIGZyb21cbiAgICAgKiBbYFN0cmluZy5wcm90b3R5cGUubWF0Y2hgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcvbWF0Y2gpXG4gICAgICogd2hpY2ggcmV0dXJucyBgbnVsbGAgd2hlbiB0aGVyZSBhcmUgbm8gbWF0Y2hlcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFN0cmluZ1xuICAgICAqIEBzaWcgUmVnRXhwIC0+IFN0cmluZyAtPiBbU3RyaW5nIHwgVW5kZWZpbmVkXVxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSByeCBBIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gbWF0Y2ggYWdhaW5zdFxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBvZiBtYXRjaGVzIG9yIGVtcHR5IGFycmF5LlxuICAgICAqIEBzZWUgUi50ZXN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5tYXRjaCgvKFthLXpdYSkvZywgJ2JhbmFuYXMnKTsgLy89PiBbJ2JhJywgJ25hJywgJ25hJ11cbiAgICAgKiAgICAgIFIubWF0Y2goL2EvLCAnYicpOyAvLz0+IFtdXG4gICAgICogICAgICBSLm1hdGNoKC9hLywgbnVsbCk7IC8vPT4gVHlwZUVycm9yOiBudWxsIGRvZXMgbm90IGhhdmUgYSBtZXRob2QgbmFtZWQgXCJtYXRjaFwiXG4gICAgICovXG4gICAgdmFyIG1hdGNoID0gX2N1cnJ5MihmdW5jdGlvbiBtYXRjaChyeCwgc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIubWF0Y2gocngpIHx8IFtdO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogbWF0aE1vZCBiZWhhdmVzIGxpa2UgdGhlIG1vZHVsbyBvcGVyYXRvciBzaG91bGQgbWF0aGVtYXRpY2FsbHksIHVubGlrZSB0aGVcbiAgICAgKiBgJWAgb3BlcmF0b3IgKGFuZCBieSBleHRlbnNpb24sIFIubW9kdWxvKS4gU28gd2hpbGUgXCItMTcgJSA1XCIgaXMgLTIsXG4gICAgICogbWF0aE1vZCgtMTcsIDUpIGlzIDMuIG1hdGhNb2QgcmVxdWlyZXMgSW50ZWdlciBhcmd1bWVudHMsIGFuZCByZXR1cm5zIE5hTlxuICAgICAqIHdoZW4gdGhlIG1vZHVsdXMgaXMgemVybyBvciBuZWdhdGl2ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG0gVGhlIGRpdmlkZW5kLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBwIHRoZSBtb2R1bHVzLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIHJlc3VsdCBvZiBgYiBtb2QgYWAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5tYXRoTW9kKC0xNywgNSk7ICAvLz0+IDNcbiAgICAgKiAgICAgIFIubWF0aE1vZCgxNywgNSk7ICAgLy89PiAyXG4gICAgICogICAgICBSLm1hdGhNb2QoMTcsIC01KTsgIC8vPT4gTmFOXG4gICAgICogICAgICBSLm1hdGhNb2QoMTcsIDApOyAgIC8vPT4gTmFOXG4gICAgICogICAgICBSLm1hdGhNb2QoMTcuMiwgNSk7IC8vPT4gTmFOXG4gICAgICogICAgICBSLm1hdGhNb2QoMTcsIDUuMyk7IC8vPT4gTmFOXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBjbG9jayA9IFIubWF0aE1vZChSLl9fLCAxMik7XG4gICAgICogICAgICBjbG9jaygxNSk7IC8vPT4gM1xuICAgICAqICAgICAgY2xvY2soMjQpOyAvLz0+IDBcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNldmVudGVlbk1vZCA9IFIubWF0aE1vZCgxNyk7XG4gICAgICogICAgICBzZXZlbnRlZW5Nb2QoMyk7ICAvLz0+IDJcbiAgICAgKiAgICAgIHNldmVudGVlbk1vZCg0KTsgIC8vPT4gMVxuICAgICAqICAgICAgc2V2ZW50ZWVuTW9kKDEwKTsgLy89PiA3XG4gICAgICovXG4gICAgdmFyIG1hdGhNb2QgPSBfY3VycnkyKGZ1bmN0aW9uIG1hdGhNb2QobSwgcCkge1xuICAgICAgICBpZiAoIV9pc0ludGVnZXIobSkpIHtcbiAgICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFfaXNJbnRlZ2VyKHApIHx8IHAgPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAobSAlIHAgKyBwKSAlIHA7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsYXJnZXIgb2YgaXRzIHR3byBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgT3JkIGEgPT4gYSAtPiBhIC0+IGFcbiAgICAgKiBAcGFyYW0geyp9IGFcbiAgICAgKiBAcGFyYW0geyp9IGJcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5tYXhCeSwgUi5taW5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1heCg3ODksIDEyMyk7IC8vPT4gNzg5XG4gICAgICogICAgICBSLm1heCgnYScsICdiJyk7IC8vPT4gJ2InXG4gICAgICovXG4gICAgdmFyIG1heCA9IF9jdXJyeTIoZnVuY3Rpb24gbWF4KGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIgPiBhID8gYiA6IGE7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGZ1bmN0aW9uIGFuZCB0d28gdmFsdWVzLCBhbmQgcmV0dXJucyB3aGljaGV2ZXIgdmFsdWUgcHJvZHVjZXMgdGhlXG4gICAgICogbGFyZ2VyIHJlc3VsdCB3aGVuIHBhc3NlZCB0byB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjguMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgT3JkIGIgPT4gKGEgLT4gYikgLT4gYSAtPiBhIC0+IGFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmXG4gICAgICogQHBhcmFtIHsqfSBhXG4gICAgICogQHBhcmFtIHsqfSBiXG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIubWF4LCBSLm1pbkJ5XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gIHNxdWFyZSA6OiBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogICAgICB2YXIgc3F1YXJlID0gbiA9PiBuICogbjtcbiAgICAgKlxuICAgICAqICAgICAgUi5tYXhCeShzcXVhcmUsIC0zLCAyKTsgLy89PiAtM1xuICAgICAqXG4gICAgICogICAgICBSLnJlZHVjZShSLm1heEJ5KHNxdWFyZSksIDAsIFszLCAtNSwgNCwgMSwgLTJdKTsgLy89PiAtNVxuICAgICAqICAgICAgUi5yZWR1Y2UoUi5tYXhCeShzcXVhcmUpLCAwLCBbXSk7IC8vPT4gMFxuICAgICAqL1xuICAgIHZhciBtYXhCeSA9IF9jdXJyeTMoZnVuY3Rpb24gbWF4QnkoZiwgYSwgYikge1xuICAgICAgICByZXR1cm4gZihiKSA+IGYoYSkgPyBiIDogYTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBvYmplY3Qgd2l0aCB0aGUgb3duIHByb3BlcnRpZXMgb2YgdGhlIGZpcnN0IG9iamVjdCBtZXJnZWQgd2l0aFxuICAgICAqIHRoZSBvd24gcHJvcGVydGllcyBvZiB0aGUgc2Vjb25kIG9iamVjdC4gSWYgYSBrZXkgZXhpc3RzIGluIGJvdGggb2JqZWN0cyxcbiAgICAgKiB0aGUgdmFsdWUgZnJvbSB0aGUgc2Vjb25kIG9iamVjdCB3aWxsIGJlIHVzZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtrOiB2fSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gclxuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKiBAc2VlIFIubWVyZ2VXaXRoLCBSLm1lcmdlV2l0aEtleVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubWVyZ2UoeyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDEwIH0sIHsgJ2FnZSc6IDQwIH0pO1xuICAgICAqICAgICAgLy89PiB7ICduYW1lJzogJ2ZyZWQnLCAnYWdlJzogNDAgfVxuICAgICAqXG4gICAgICogICAgICB2YXIgcmVzZXRUb0RlZmF1bHQgPSBSLm1lcmdlKFIuX18sIHt4OiAwfSk7XG4gICAgICogICAgICByZXNldFRvRGVmYXVsdCh7eDogNSwgeTogMn0pOyAvLz0+IHt4OiAwLCB5OiAyfVxuICAgICAqL1xuICAgIHZhciBtZXJnZSA9IF9jdXJyeTIoZnVuY3Rpb24gbWVyZ2UobCwgcikge1xuICAgICAgICByZXR1cm4gX2Fzc2lnbih7fSwgbCwgcik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBNZXJnZXMgYSBsaXN0IG9mIG9iamVjdHMgdG9nZXRoZXIgaW50byBvbmUgb2JqZWN0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMC4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFt7azogdn1dIC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgQW4gYXJyYXkgb2Ygb2JqZWN0c1xuICAgICAqIEByZXR1cm4ge09iamVjdH0gQSBtZXJnZWQgb2JqZWN0LlxuICAgICAqIEBzZWUgUi5yZWR1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1lcmdlQWxsKFt7Zm9vOjF9LHtiYXI6Mn0se2JhejozfV0pOyAvLz0+IHtmb286MSxiYXI6MixiYXo6M31cbiAgICAgKiAgICAgIFIubWVyZ2VBbGwoW3tmb286MX0se2ZvbzoyfSx7YmFyOjJ9XSk7IC8vPT4ge2ZvbzoyLGJhcjoyfVxuICAgICAqL1xuICAgIHZhciBtZXJnZUFsbCA9IF9jdXJyeTEoZnVuY3Rpb24gbWVyZ2VBbGwobGlzdCkge1xuICAgICAgICByZXR1cm4gX2Fzc2lnbi5hcHBseShudWxsLCBbe31dLmNvbmNhdChsaXN0KSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIHRoZSBvd24gcHJvcGVydGllcyBvZiB0aGUgdHdvIHByb3ZpZGVkIG9iamVjdHMuIElmXG4gICAgICogYSBrZXkgZXhpc3RzIGluIGJvdGggb2JqZWN0cywgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uIGlzIGFwcGxpZWQgdG8gdGhlIGtleVxuICAgICAqIGFuZCB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUga2V5IGluIGVhY2ggb2JqZWN0LCB3aXRoIHRoZSByZXN1bHQgYmVpbmdcbiAgICAgKiB1c2VkIGFzIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggdGhlIGtleSBpbiB0aGUgcmV0dXJuZWQgb2JqZWN0LiBUaGUga2V5XG4gICAgICogd2lsbCBiZSBleGNsdWRlZCBmcm9tIHRoZSByZXR1cm5lZCBvYmplY3QgaWYgdGhlIHJlc3VsdGluZyB2YWx1ZSBpc1xuICAgICAqIGB1bmRlZmluZWRgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgKFN0cmluZyAtPiBhIC0+IGEgLT4gYSkgLT4ge2F9IC0+IHthfSAtPiB7YX1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICogQHNlZSBSLm1lcmdlLCBSLm1lcmdlV2l0aFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIGxldCBjb25jYXRWYWx1ZXMgPSAoaywgbCwgcikgPT4gayA9PSAndmFsdWVzJyA/IFIuY29uY2F0KGwsIHIpIDogclxuICAgICAqICAgICAgUi5tZXJnZVdpdGhLZXkoY29uY2F0VmFsdWVzLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgeyBhOiB0cnVlLCB0aGluZzogJ2ZvbycsIHZhbHVlczogWzEwLCAyMF0gfSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgIHsgYjogdHJ1ZSwgdGhpbmc6ICdiYXInLCB2YWx1ZXM6IFsxNSwgMzVdIH0pO1xuICAgICAqICAgICAgLy89PiB7IGE6IHRydWUsIGI6IHRydWUsIHRoaW5nOiAnYmFyJywgdmFsdWVzOiBbMTAsIDIwLCAxNSwgMzVdIH1cbiAgICAgKi9cbiAgICB2YXIgbWVyZ2VXaXRoS2V5ID0gX2N1cnJ5MyhmdW5jdGlvbiBtZXJnZVdpdGhLZXkoZm4sIGwsIHIpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICB2YXIgaztcbiAgICAgICAgZm9yIChrIGluIGwpIHtcbiAgICAgICAgICAgIGlmIChfaGFzKGssIGwpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2tdID0gX2hhcyhrLCByKSA/IGZuKGssIGxba10sIHJba10pIDogbFtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGsgaW4gcikge1xuICAgICAgICAgICAgaWYgKF9oYXMoaywgcikgJiYgIV9oYXMoaywgcmVzdWx0KSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrXSA9IHJba107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNtYWxsZXIgb2YgaXRzIHR3byBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgT3JkIGEgPT4gYSAtPiBhIC0+IGFcbiAgICAgKiBAcGFyYW0geyp9IGFcbiAgICAgKiBAcGFyYW0geyp9IGJcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5taW5CeSwgUi5tYXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1pbig3ODksIDEyMyk7IC8vPT4gMTIzXG4gICAgICogICAgICBSLm1pbignYScsICdiJyk7IC8vPT4gJ2EnXG4gICAgICovXG4gICAgdmFyIG1pbiA9IF9jdXJyeTIoZnVuY3Rpb24gbWluKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIgPCBhID8gYiA6IGE7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGZ1bmN0aW9uIGFuZCB0d28gdmFsdWVzLCBhbmQgcmV0dXJucyB3aGljaGV2ZXIgdmFsdWUgcHJvZHVjZXMgdGhlXG4gICAgICogc21hbGxlciByZXN1bHQgd2hlbiBwYXNzZWQgdG8gdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC44LjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBiID0+IChhIC0+IGIpIC0+IGEgLT4gYSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZlxuICAgICAqIEBwYXJhbSB7Kn0gYVxuICAgICAqIEBwYXJhbSB7Kn0gYlxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLm1pbiwgUi5tYXhCeVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vICBzcXVhcmUgOjogTnVtYmVyIC0+IE51bWJlclxuICAgICAqICAgICAgdmFyIHNxdWFyZSA9IG4gPT4gbiAqIG47XG4gICAgICpcbiAgICAgKiAgICAgIFIubWluQnkoc3F1YXJlLCAtMywgMik7IC8vPT4gMlxuICAgICAqXG4gICAgICogICAgICBSLnJlZHVjZShSLm1pbkJ5KHNxdWFyZSksIEluZmluaXR5LCBbMywgLTUsIDQsIDEsIC0yXSk7IC8vPT4gMVxuICAgICAqICAgICAgUi5yZWR1Y2UoUi5taW5CeShzcXVhcmUpLCBJbmZpbml0eSwgW10pOyAvLz0+IEluZmluaXR5XG4gICAgICovXG4gICAgdmFyIG1pbkJ5ID0gX2N1cnJ5MyhmdW5jdGlvbiBtaW5CeShmLCBhLCBiKSB7XG4gICAgICAgIHJldHVybiBmKGIpIDwgZihhKSA/IGIgOiBhO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRGl2aWRlcyB0aGUgc2Vjb25kIHBhcmFtZXRlciBieSB0aGUgZmlyc3QgYW5kIHJldHVybnMgdGhlIHJlbWFpbmRlci4gTm90ZVxuICAgICAqIHRoYXQgdGhpcyBmdW5jdGlvbiBwcmVzZXJ2ZXMgdGhlIEphdmFTY3JpcHQtc3R5bGUgYmVoYXZpb3IgZm9yIG1vZHVsby4gRm9yXG4gICAgICogbWF0aGVtYXRpY2FsIG1vZHVsbyBzZWUgYG1hdGhNb2RgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjFcbiAgICAgKiBAY2F0ZWdvcnkgTWF0aFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IE51bWJlciAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYSBUaGUgdmFsdWUgdG8gdGhlIGRpdmlkZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYiBUaGUgcHNldWRvLW1vZHVsdXNcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSByZXN1bHQgb2YgYGIgJSBhYC5cbiAgICAgKiBAc2VlIFIubWF0aE1vZFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubW9kdWxvKDE3LCAzKTsgLy89PiAyXG4gICAgICogICAgICAvLyBKUyBiZWhhdmlvcjpcbiAgICAgKiAgICAgIFIubW9kdWxvKC0xNywgMyk7IC8vPT4gLTJcbiAgICAgKiAgICAgIFIubW9kdWxvKDE3LCAtMyk7IC8vPT4gMlxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNPZGQgPSBSLm1vZHVsbyhSLl9fLCAyKTtcbiAgICAgKiAgICAgIGlzT2RkKDQyKTsgLy89PiAwXG4gICAgICogICAgICBpc09kZCgyMSk7IC8vPT4gMVxuICAgICAqL1xuICAgIHZhciBtb2R1bG8gPSBfY3VycnkyKGZ1bmN0aW9uIG1vZHVsbyhhLCBiKSB7XG4gICAgICAgIHJldHVybiBhICUgYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE11bHRpcGxpZXMgdHdvIG51bWJlcnMuIEVxdWl2YWxlbnQgdG8gYGEgKiBiYCBidXQgY3VycmllZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGEgVGhlIGZpcnN0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBiIFRoZSBzZWNvbmQgdmFsdWUuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgcmVzdWx0IG9mIGBhICogYmAuXG4gICAgICogQHNlZSBSLmRpdmlkZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBkb3VibGUgPSBSLm11bHRpcGx5KDIpO1xuICAgICAqICAgICAgdmFyIHRyaXBsZSA9IFIubXVsdGlwbHkoMyk7XG4gICAgICogICAgICBkb3VibGUoMyk7ICAgICAgIC8vPT4gIDZcbiAgICAgKiAgICAgIHRyaXBsZSg0KTsgICAgICAgLy89PiAxMlxuICAgICAqICAgICAgUi5tdWx0aXBseSgyLCA1KTsgIC8vPT4gMTBcbiAgICAgKi9cbiAgICB2YXIgbXVsdGlwbHkgPSBfY3VycnkyKGZ1bmN0aW9uIG11bHRpcGx5KGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEgKiBiO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYSBmdW5jdGlvbiBvZiBhbnkgYXJpdHkgKGluY2x1ZGluZyBudWxsYXJ5KSBpbiBhIGZ1bmN0aW9uIHRoYXQgYWNjZXB0c1xuICAgICAqIGV4YWN0bHkgYG5gIHBhcmFtZXRlcnMuIEFueSBleHRyYW5lb3VzIHBhcmFtZXRlcnMgd2lsbCBub3QgYmUgcGFzc2VkIHRvIHRoZVxuICAgICAqIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIE51bWJlciAtPiAoKiAtPiBhKSAtPiAoKiAtPiBhKVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIFRoZSBkZXNpcmVkIGFyaXR5IG9mIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHdyYXBwaW5nIGBmbmAuIFRoZSBuZXcgZnVuY3Rpb24gaXMgZ3VhcmFudGVlZCB0byBiZSBvZlxuICAgICAqICAgICAgICAgYXJpdHkgYG5gLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB0YWtlc1R3b0FyZ3MgPSAoYSwgYikgPT4gW2EsIGJdO1xuICAgICAqXG4gICAgICogICAgICB0YWtlc1R3b0FyZ3MubGVuZ3RoOyAvLz0+IDJcbiAgICAgKiAgICAgIHRha2VzVHdvQXJncygxLCAyKTsgLy89PiBbMSwgMl1cbiAgICAgKlxuICAgICAqICAgICAgdmFyIHRha2VzT25lQXJnID0gUi5uQXJ5KDEsIHRha2VzVHdvQXJncyk7XG4gICAgICogICAgICB0YWtlc09uZUFyZy5sZW5ndGg7IC8vPT4gMVxuICAgICAqICAgICAgLy8gT25seSBgbmAgYXJndW1lbnRzIGFyZSBwYXNzZWQgdG8gdGhlIHdyYXBwZWQgZnVuY3Rpb25cbiAgICAgKiAgICAgIHRha2VzT25lQXJnKDEsIDIpOyAvLz0+IFsxLCB1bmRlZmluZWRdXG4gICAgICovXG4gICAgdmFyIG5BcnkgPSBfY3VycnkyKGZ1bmN0aW9uIG5BcnkobiwgZm4pIHtcbiAgICAgICAgc3dpdGNoIChuKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBhMCwgYTEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExLCBhMik7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExLCBhMiwgYTMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBhMCwgYTEsIGEyLCBhMywgYTQpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcsIGE4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3LCBhOCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcsIGE4LCBhOSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNywgYTgsIGE5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIG5BcnkgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyIG5vIGdyZWF0ZXIgdGhhbiB0ZW4nKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTmVnYXRlcyBpdHMgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5uZWdhdGUoNDIpOyAvLz0+IC00MlxuICAgICAqL1xuICAgIHZhciBuZWdhdGUgPSBfY3VycnkxKGZ1bmN0aW9uIG5lZ2F0ZShuKSB7XG4gICAgICAgIHJldHVybiAtbjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIG5vIGVsZW1lbnRzIG9mIHRoZSBsaXN0IG1hdGNoIHRoZSBwcmVkaWNhdGUsIGBmYWxzZWBcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgYW55YCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTIuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBwcmVkaWNhdGUgaXMgbm90IHNhdGlzZmllZCBieSBldmVyeSBlbGVtZW50LCBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKiBAc2VlIFIuYWxsLCBSLmFueVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBpc0V2ZW4gPSBuID0+IG4gJSAyID09PSAwO1xuICAgICAqXG4gICAgICogICAgICBSLm5vbmUoaXNFdmVuLCBbMSwgMywgNSwgNywgOSwgMTFdKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLm5vbmUoaXNFdmVuLCBbMSwgMywgNSwgNywgOCwgMTFdKTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBub25lID0gX2N1cnJ5MihfY29tcGxlbWVudChfZGlzcGF0Y2hhYmxlKCdhbnknLCBfeGFueSwgYW55KSkpO1xuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGAhYCBvZiBpdHMgYXJndW1lbnQuIEl0IHdpbGwgcmV0dXJuIGB0cnVlYCB3aGVuXG4gICAgICogcGFzc2VkIGZhbHNlLXkgdmFsdWUsIGFuZCBgZmFsc2VgIHdoZW4gcGFzc2VkIGEgdHJ1dGgteSBvbmUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKiAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSBhIGFueSB2YWx1ZVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHRoZSBsb2dpY2FsIGludmVyc2Ugb2YgcGFzc2VkIGFyZ3VtZW50LlxuICAgICAqIEBzZWUgUi5jb21wbGVtZW50XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5ub3QodHJ1ZSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIubm90KGZhbHNlKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLm5vdCgwKTsgPT4gdHJ1ZVxuICAgICAqICAgICAgUi5ub3QoMSk7ID0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIG5vdCA9IF9jdXJyeTEoZnVuY3Rpb24gbm90KGEpIHtcbiAgICAgICAgcmV0dXJuICFhO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbnRoIGVsZW1lbnQgb2YgdGhlIGdpdmVuIGxpc3Qgb3Igc3RyaW5nLiBJZiBuIGlzIG5lZ2F0aXZlIHRoZVxuICAgICAqIGVsZW1lbnQgYXQgaW5kZXggbGVuZ3RoICsgbiBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBbYV0gLT4gYSB8IFVuZGVmaW5lZFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0XG4gICAgICogQHBhcmFtIHsqfSBsaXN0XG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbGlzdCA9IFsnZm9vJywgJ2JhcicsICdiYXonLCAncXV1eCddO1xuICAgICAqICAgICAgUi5udGgoMSwgbGlzdCk7IC8vPT4gJ2JhcidcbiAgICAgKiAgICAgIFIubnRoKC0xLCBsaXN0KTsgLy89PiAncXV1eCdcbiAgICAgKiAgICAgIFIubnRoKC05OSwgbGlzdCk7IC8vPT4gdW5kZWZpbmVkXG4gICAgICpcbiAgICAgKiAgICAgIFIubnRoKDIsICdhYmMnKTsgLy89PiAnYydcbiAgICAgKiAgICAgIFIubnRoKDMsICdhYmMnKTsgLy89PiAnJ1xuICAgICAqL1xuICAgIHZhciBudGggPSBfY3VycnkyKGZ1bmN0aW9uIG50aChvZmZzZXQsIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IG9mZnNldCA8IDAgPyBsaXN0Lmxlbmd0aCArIG9mZnNldCA6IG9mZnNldDtcbiAgICAgICAgcmV0dXJuIF9pc1N0cmluZyhsaXN0KSA/IGxpc3QuY2hhckF0KGlkeCkgOiBsaXN0W2lkeF07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBpdHMgbnRoIGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIE51bWJlciAtPiAqLi4uIC0+ICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gblxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubnRoQXJnKDEpKCdhJywgJ2InLCAnYycpOyAvLz0+ICdiJ1xuICAgICAqICAgICAgUi5udGhBcmcoLTEpKCdhJywgJ2InLCAnYycpOyAvLz0+ICdjJ1xuICAgICAqL1xuICAgIHZhciBudGhBcmcgPSBfY3VycnkxKGZ1bmN0aW9uIG50aEFyZyhuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnRoKG4sIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIG9iamVjdCBjb250YWluaW5nIGEgc2luZ2xlIGtleTp2YWx1ZSBwYWlyLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgU3RyaW5nIC0+IGEgLT4ge1N0cmluZzphfVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICAgKiBAcGFyYW0geyp9IHZhbFxuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKiBAc2VlIFIucGFpclxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtYXRjaFBocmFzZXMgPSBSLmNvbXBvc2UoXG4gICAgICogICAgICAgIFIub2JqT2YoJ211c3QnKSxcbiAgICAgKiAgICAgICAgUi5tYXAoUi5vYmpPZignbWF0Y2hfcGhyYXNlJykpXG4gICAgICogICAgICApO1xuICAgICAqICAgICAgbWF0Y2hQaHJhc2VzKFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4ge211c3Q6IFt7bWF0Y2hfcGhyYXNlOiAnZm9vJ30sIHttYXRjaF9waHJhc2U6ICdiYXInfSwge21hdGNoX3BocmFzZTogJ2Jheid9XX1cbiAgICAgKi9cbiAgICB2YXIgb2JqT2YgPSBfY3VycnkyKGZ1bmN0aW9uIG9iak9mKGtleSwgdmFsKSB7XG4gICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgICAgb2JqW2tleV0gPSB2YWw7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc2luZ2xldG9uIGFycmF5IGNvbnRhaW5pbmcgdGhlIHZhbHVlIHByb3ZpZGVkLlxuICAgICAqXG4gICAgICogTm90ZSB0aGlzIGBvZmAgaXMgZGlmZmVyZW50IGZyb20gdGhlIEVTNiBgb2ZgOyBTZWVcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9vZlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4zLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIGEgLT4gW2FdXG4gICAgICogQHBhcmFtIHsqfSB4IGFueSB2YWx1ZVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSB3cmFwcGluZyBgeGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5vZihudWxsKTsgLy89PiBbbnVsbF1cbiAgICAgKiAgICAgIFIub2YoWzQyXSk7IC8vPT4gW1s0Ml1dXG4gICAgICovXG4gICAgdmFyIG9mID0gX2N1cnJ5MShfb2YpO1xuXG4gICAgLyoqXG4gICAgICogQWNjZXB0cyBhIGZ1bmN0aW9uIGBmbmAgYW5kIHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGd1YXJkcyBpbnZvY2F0aW9uIG9mXG4gICAgICogYGZuYCBzdWNoIHRoYXQgYGZuYCBjYW4gb25seSBldmVyIGJlIGNhbGxlZCBvbmNlLCBubyBtYXR0ZXIgaG93IG1hbnkgdGltZXNcbiAgICAgKiB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gaXMgaW52b2tlZC4gVGhlIGZpcnN0IHZhbHVlIGNhbGN1bGF0ZWQgaXMgcmV0dXJuZWQgaW5cbiAgICAgKiBzdWJzZXF1ZW50IGludm9jYXRpb25zLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIChhLi4uIC0+IGIpIC0+IChhLi4uIC0+IGIpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHdyYXAgaW4gYSBjYWxsLW9ubHktb25jZSB3cmFwcGVyLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgd3JhcHBlZCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYWRkT25lT25jZSA9IFIub25jZSh4ID0+IHggKyAxKTtcbiAgICAgKiAgICAgIGFkZE9uZU9uY2UoMTApOyAvLz0+IDExXG4gICAgICogICAgICBhZGRPbmVPbmNlKGFkZE9uZU9uY2UoNTApKTsgLy89PiAxMVxuICAgICAqL1xuICAgIHZhciBvbmNlID0gX2N1cnJ5MShmdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgICAgIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgcmV0dXJuIF9hcml0eShmbi5sZW5ndGgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjYWxsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIG9uZSBvciBib3RoIG9mIGl0cyBhcmd1bWVudHMgYXJlIGB0cnVlYC4gUmV0dXJucyBgZmFsc2VgXG4gICAgICogaWYgYm90aCBhcmd1bWVudHMgYXJlIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKiAtPiAqIC0+ICpcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGEgQSBib29sZWFuIHZhbHVlXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBiIEEgYm9vbGVhbiB2YWx1ZVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBvbmUgb3IgYm90aCBhcmd1bWVudHMgYXJlIGB0cnVlYCwgYGZhbHNlYCBvdGhlcndpc2VcbiAgICAgKiBAc2VlIFIuZWl0aGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5vcih0cnVlLCB0cnVlKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLm9yKHRydWUsIGZhbHNlKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLm9yKGZhbHNlLCB0cnVlKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLm9yKGZhbHNlLCBmYWxzZSk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgb3IgPSBfY3VycnkyKGZ1bmN0aW9uIG9yKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEgfHwgYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJlc3VsdCBvZiBcInNldHRpbmdcIiB0aGUgcG9ydGlvbiBvZiB0aGUgZ2l2ZW4gZGF0YSBzdHJ1Y3R1cmVcbiAgICAgKiBmb2N1c2VkIGJ5IHRoZSBnaXZlbiBsZW5zIHRvIHRoZSByZXN1bHQgb2YgYXBwbHlpbmcgdGhlIGdpdmVuIGZ1bmN0aW9uIHRvXG4gICAgICogdGhlIGZvY3VzZWQgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE2LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHR5cGVkZWZuIExlbnMgcyBhID0gRnVuY3RvciBmID0+IChhIC0+IGYgYSkgLT4gcyAtPiBmIHNcbiAgICAgKiBAc2lnIExlbnMgcyBhIC0+IChhIC0+IGEpIC0+IHMgLT4gc1xuICAgICAqIEBwYXJhbSB7TGVuc30gbGVuc1xuICAgICAqIEBwYXJhbSB7Kn0gdlxuICAgICAqIEBwYXJhbSB7Kn0geFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLnByb3AsIFIubGVuc0luZGV4LCBSLmxlbnNQcm9wXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGhlYWRMZW5zID0gUi5sZW5zSW5kZXgoMCk7XG4gICAgICpcbiAgICAgKiAgICAgIFIub3ZlcihoZWFkTGVucywgUi50b1VwcGVyLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFsnRk9PJywgJ2JhcicsICdiYXonXVxuICAgICAqL1xuICAgIC8vIGBJZGVudGl0eWAgaXMgYSBmdW5jdG9yIHRoYXQgaG9sZHMgYSBzaW5nbGUgdmFsdWUsIHdoZXJlIGBtYXBgIHNpbXBseVxuICAgIC8vIHRyYW5zZm9ybXMgdGhlIGhlbGQgdmFsdWUgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uXG4gICAgLy8gVGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoZSBnZXR0ZXIgZnVuY3Rpb24gaXMgZmlyc3QgdHJhbnNmb3JtZWQgd2l0aCBgZmAsXG4gICAgLy8gdGhlbiBzZXQgYXMgdGhlIHZhbHVlIG9mIGFuIGBJZGVudGl0eWAuIFRoaXMgaXMgdGhlbiBtYXBwZWQgb3ZlciB3aXRoIHRoZVxuICAgIC8vIHNldHRlciBmdW5jdGlvbiBvZiB0aGUgbGVucy5cbiAgICB2YXIgb3ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gYElkZW50aXR5YCBpcyBhIGZ1bmN0b3IgdGhhdCBob2xkcyBhIHNpbmdsZSB2YWx1ZSwgd2hlcmUgYG1hcGAgc2ltcGx5XG4gICAgICAgIC8vIHRyYW5zZm9ybXMgdGhlIGhlbGQgdmFsdWUgd2l0aCB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uXG4gICAgICAgIHZhciBJZGVudGl0eSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHZhbHVlOiB4LFxuICAgICAgICAgICAgICAgIG1hcDogZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIElkZW50aXR5KGYoeCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkzKGZ1bmN0aW9uIG92ZXIobGVucywgZiwgeCkge1xuICAgICAgICAgICAgLy8gVGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoZSBnZXR0ZXIgZnVuY3Rpb24gaXMgZmlyc3QgdHJhbnNmb3JtZWQgd2l0aCBgZmAsXG4gICAgICAgICAgICAvLyB0aGVuIHNldCBhcyB0aGUgdmFsdWUgb2YgYW4gYElkZW50aXR5YC4gVGhpcyBpcyB0aGVuIG1hcHBlZCBvdmVyIHdpdGggdGhlXG4gICAgICAgICAgICAvLyBzZXR0ZXIgZnVuY3Rpb24gb2YgdGhlIGxlbnMuXG4gICAgICAgICAgICByZXR1cm4gbGVucyhmdW5jdGlvbiAoeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBJZGVudGl0eShmKHkpKTtcbiAgICAgICAgICAgIH0pKHgpLnZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyB0d28gYXJndW1lbnRzLCBgZnN0YCBhbmQgYHNuZGAsIGFuZCByZXR1cm5zIGBbZnN0LCBzbmRdYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTguMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBhIC0+IGIgLT4gKGEsYilcbiAgICAgKiBAcGFyYW0geyp9IGZzdFxuICAgICAqIEBwYXJhbSB7Kn0gc25kXG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICogQHNlZSBSLm9iak9mLCBSLm9mXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wYWlyKCdmb28nLCAnYmFyJyk7IC8vPT4gWydmb28nLCAnYmFyJ11cbiAgICAgKi9cbiAgICB2YXIgcGFpciA9IF9jdXJyeTIoZnVuY3Rpb24gcGFpcihmc3QsIHNuZCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgZnN0LFxuICAgICAgICAgICAgc25kXG4gICAgICAgIF07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZSB0aGUgdmFsdWUgYXQgYSBnaXZlbiBwYXRoLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBbU3RyaW5nXSAtPiB7azogdn0gLT4gdiB8IFVuZGVmaW5lZFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhdGggVGhlIHBhdGggdG8gdXNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byByZXRyaWV2ZSB0aGUgbmVzdGVkIHByb3BlcnR5IGZyb20uXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGRhdGEgYXQgYHBhdGhgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucGF0aChbJ2EnLCAnYiddLCB7YToge2I6IDJ9fSk7IC8vPT4gMlxuICAgICAqICAgICAgUi5wYXRoKFsnYScsICdiJ10sIHtjOiB7YjogMn19KTsgLy89PiB1bmRlZmluZWRcbiAgICAgKi9cbiAgICB2YXIgcGF0aCA9IF9jdXJyeTIoZnVuY3Rpb24gcGF0aChwYXRocywgb2JqKSB7XG4gICAgICAgIHZhciB2YWwgPSBvYmo7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgcGF0aHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodmFsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWwgPSB2YWxbcGF0aHNbaWR4XV07XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogSWYgdGhlIGdpdmVuLCBub24tbnVsbCBvYmplY3QgaGFzIGEgdmFsdWUgYXQgdGhlIGdpdmVuIHBhdGgsIHJldHVybnMgdGhlXG4gICAgICogdmFsdWUgYXQgdGhhdCBwYXRoLiBPdGhlcndpc2UgcmV0dXJucyB0aGUgcHJvdmlkZWQgZGVmYXVsdCB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTguMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIGEgLT4gW1N0cmluZ10gLT4gT2JqZWN0IC0+IGFcbiAgICAgKiBAcGFyYW0geyp9IGQgVGhlIGRlZmF1bHQgdmFsdWUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gcCBUaGUgcGF0aCB0byB1c2UuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHJldHJpZXZlIHRoZSBuZXN0ZWQgcHJvcGVydHkgZnJvbS5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgZGF0YSBhdCBgcGF0aGAgb2YgdGhlIHN1cHBsaWVkIG9iamVjdCBvciB0aGUgZGVmYXVsdCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnBhdGhPcignTi9BJywgWydhJywgJ2InXSwge2E6IHtiOiAyfX0pOyAvLz0+IDJcbiAgICAgKiAgICAgIFIucGF0aE9yKCdOL0EnLCBbJ2EnLCAnYiddLCB7Yzoge2I6IDJ9fSk7IC8vPT4gXCJOL0FcIlxuICAgICAqL1xuICAgIHZhciBwYXRoT3IgPSBfY3VycnkzKGZ1bmN0aW9uIHBhdGhPcihkLCBwLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRUbyhkLCBwYXRoKHAsIG9iaikpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHNwZWNpZmllZCBvYmplY3QgcHJvcGVydHkgYXQgZ2l2ZW4gcGF0aCBzYXRpc2ZpZXMgdGhlXG4gICAgICogZ2l2ZW4gcHJlZGljYXRlOyBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW1N0cmluZ10gLT4gT2JqZWN0IC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkXG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcFBhdGhcbiAgICAgKiBAcGFyYW0geyp9IG9ialxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLnByb3BTYXRpc2ZpZXMsIFIucGF0aFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucGF0aFNhdGlzZmllcyh5ID0+IHkgPiAwLCBbJ3gnLCAneSddLCB7eDoge3k6IDJ9fSk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBwYXRoU2F0aXNmaWVzID0gX2N1cnJ5MyhmdW5jdGlvbiBwYXRoU2F0aXNmaWVzKHByZWQsIHByb3BQYXRoLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIHByb3BQYXRoLmxlbmd0aCA+IDAgJiYgcHJlZChwYXRoKHByb3BQYXRoLCBvYmopKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBwYXJ0aWFsIGNvcHkgb2YgYW4gb2JqZWN0IGNvbnRhaW5pbmcgb25seSB0aGUga2V5cyBzcGVjaWZpZWQuIElmXG4gICAgICogdGhlIGtleSBkb2VzIG5vdCBleGlzdCwgdGhlIHByb3BlcnR5IGlzIGlnbm9yZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIFtrXSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtBcnJheX0gbmFtZXMgYW4gYXJyYXkgb2YgU3RyaW5nIHByb3BlcnR5IG5hbWVzIHRvIGNvcHkgb250byBhIG5ldyBvYmplY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gY29weSBmcm9tXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBBIG5ldyBvYmplY3Qgd2l0aCBvbmx5IHByb3BlcnRpZXMgZnJvbSBgbmFtZXNgIG9uIGl0LlxuICAgICAqIEBzZWUgUi5vbWl0LCBSLnByb3BzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5waWNrKFsnYScsICdkJ10sIHthOiAxLCBiOiAyLCBjOiAzLCBkOiA0fSk7IC8vPT4ge2E6IDEsIGQ6IDR9XG4gICAgICogICAgICBSLnBpY2soWydhJywgJ2UnLCAnZiddLCB7YTogMSwgYjogMiwgYzogMywgZDogNH0pOyAvLz0+IHthOiAxfVxuICAgICAqL1xuICAgIHZhciBwaWNrID0gX2N1cnJ5MihmdW5jdGlvbiBwaWNrKG5hbWVzLCBvYmopIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKG5hbWVzW2lkeF0gaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W25hbWVzW2lkeF1dID0gb2JqW25hbWVzW2lkeF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFNpbWlsYXIgdG8gYHBpY2tgIGV4Y2VwdCB0aGF0IHRoaXMgb25lIGluY2x1ZGVzIGEgYGtleTogdW5kZWZpbmVkYCBwYWlyIGZvclxuICAgICAqIHByb3BlcnRpZXMgdGhhdCBkb24ndCBleGlzdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgW2tdIC0+IHtrOiB2fSAtPiB7azogdn1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBuYW1lcyBhbiBhcnJheSBvZiBTdHJpbmcgcHJvcGVydHkgbmFtZXMgdG8gY29weSBvbnRvIGEgbmV3IG9iamVjdFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBjb3B5IGZyb21cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgbmV3IG9iamVjdCB3aXRoIG9ubHkgcHJvcGVydGllcyBmcm9tIGBuYW1lc2Agb24gaXQuXG4gICAgICogQHNlZSBSLnBpY2tcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnBpY2tBbGwoWydhJywgJ2QnXSwge2E6IDEsIGI6IDIsIGM6IDMsIGQ6IDR9KTsgLy89PiB7YTogMSwgZDogNH1cbiAgICAgKiAgICAgIFIucGlja0FsbChbJ2EnLCAnZScsICdmJ10sIHthOiAxLCBiOiAyLCBjOiAzLCBkOiA0fSk7IC8vPT4ge2E6IDEsIGU6IHVuZGVmaW5lZCwgZjogdW5kZWZpbmVkfVxuICAgICAqL1xuICAgIHZhciBwaWNrQWxsID0gX2N1cnJ5MihmdW5jdGlvbiBwaWNrQWxsKG5hbWVzLCBvYmopIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpZHhdO1xuICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBwYXJ0aWFsIGNvcHkgb2YgYW4gb2JqZWN0IGNvbnRhaW5pbmcgb25seSB0aGUga2V5cyB0aGF0IHNhdGlzZnlcbiAgICAgKiB0aGUgc3VwcGxpZWQgcHJlZGljYXRlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC44LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyAodiwgayAtPiBCb29sZWFuKSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBBIHByZWRpY2F0ZSB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSBrZXlcbiAgICAgKiAgICAgICAgc2hvdWxkIGJlIGluY2x1ZGVkIG9uIHRoZSBvdXRwdXQgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBjb3B5IGZyb21cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgbmV3IG9iamVjdCB3aXRoIG9ubHkgcHJvcGVydGllcyB0aGF0IHNhdGlzZnkgYHByZWRgXG4gICAgICogICAgICAgICBvbiBpdC5cbiAgICAgKiBAc2VlIFIucGljaywgUi5maWx0ZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNVcHBlckNhc2UgPSAodmFsLCBrZXkpID0+IGtleS50b1VwcGVyQ2FzZSgpID09PSBrZXk7XG4gICAgICogICAgICBSLnBpY2tCeShpc1VwcGVyQ2FzZSwge2E6IDEsIGI6IDIsIEE6IDMsIEI6IDR9KTsgLy89PiB7QTogMywgQjogNH1cbiAgICAgKi9cbiAgICB2YXIgcGlja0J5ID0gX2N1cnJ5MihmdW5jdGlvbiBwaWNrQnkodGVzdCwgb2JqKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICh0ZXN0KG9ialtwcm9wXSwgcHJvcCwgb2JqKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtwcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IHdpdGggdGhlIGdpdmVuIGVsZW1lbnQgYXQgdGhlIGZyb250LCBmb2xsb3dlZCBieSB0aGVcbiAgICAgKiBjb250ZW50cyBvZiB0aGUgbGlzdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGEgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7Kn0gZWwgVGhlIGl0ZW0gdG8gYWRkIHRvIHRoZSBoZWFkIG9mIHRoZSBvdXRwdXQgbGlzdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBhZGQgdG8gdGhlIHRhaWwgb2YgdGhlIG91dHB1dCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBhcnJheS5cbiAgICAgKiBAc2VlIFIuYXBwZW5kXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wcmVwZW5kKCdmZWUnLCBbJ2ZpJywgJ2ZvJywgJ2Z1bSddKTsgLy89PiBbJ2ZlZScsICdmaScsICdmbycsICdmdW0nXVxuICAgICAqL1xuICAgIHZhciBwcmVwZW5kID0gX2N1cnJ5MihmdW5jdGlvbiBwcmVwZW5kKGVsLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfY29uY2F0KFtlbF0sIGxpc3QpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2hlbiBzdXBwbGllZCBhbiBvYmplY3QgcmV0dXJucyB0aGUgaW5kaWNhdGVkXG4gICAgICogcHJvcGVydHkgb2YgdGhhdCBvYmplY3QsIGlmIGl0IGV4aXN0cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgcyAtPiB7czogYX0gLT4gYSB8IFVuZGVmaW5lZFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwIFRoZSBwcm9wZXJ0eSBuYW1lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHF1ZXJ5XG4gICAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlIGF0IGBvYmoucGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wcm9wKCd4Jywge3g6IDEwMH0pOyAvLz0+IDEwMFxuICAgICAqICAgICAgUi5wcm9wKCd4Jywge30pOyAvLz0+IHVuZGVmaW5lZFxuICAgICAqL1xuICAgIHZhciBwcm9wID0gX2N1cnJ5MihmdW5jdGlvbiBwcm9wKHAsIG9iaikge1xuICAgICAgICByZXR1cm4gb2JqW3BdO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogSWYgdGhlIGdpdmVuLCBub24tbnVsbCBvYmplY3QgaGFzIGFuIG93biBwcm9wZXJ0eSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZSxcbiAgICAgKiByZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGF0IHByb3BlcnR5LiBPdGhlcndpc2UgcmV0dXJucyB0aGUgcHJvdmlkZWQgZGVmYXVsdFxuICAgICAqIHZhbHVlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC42LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBhIC0+IFN0cmluZyAtPiBPYmplY3QgLT4gYVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsIFRoZSBkZWZhdWx0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byByZXR1cm4uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBvZiBnaXZlbiBwcm9wZXJ0eSBvZiB0aGUgc3VwcGxpZWQgb2JqZWN0IG9yIHRoZSBkZWZhdWx0IHZhbHVlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBhbGljZSA9IHtcbiAgICAgKiAgICAgICAgbmFtZTogJ0FMSUNFJyxcbiAgICAgKiAgICAgICAgYWdlOiAxMDFcbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICB2YXIgZmF2b3JpdGUgPSBSLnByb3AoJ2Zhdm9yaXRlTGlicmFyeScpO1xuICAgICAqICAgICAgdmFyIGZhdm9yaXRlV2l0aERlZmF1bHQgPSBSLnByb3BPcignUmFtZGEnLCAnZmF2b3JpdGVMaWJyYXJ5Jyk7XG4gICAgICpcbiAgICAgKiAgICAgIGZhdm9yaXRlKGFsaWNlKTsgIC8vPT4gdW5kZWZpbmVkXG4gICAgICogICAgICBmYXZvcml0ZVdpdGhEZWZhdWx0KGFsaWNlKTsgIC8vPT4gJ1JhbWRhJ1xuICAgICAqL1xuICAgIHZhciBwcm9wT3IgPSBfY3VycnkzKGZ1bmN0aW9uIHByb3BPcih2YWwsIHAsIG9iaikge1xuICAgICAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgX2hhcyhwLCBvYmopID8gb2JqW3BdIDogdmFsO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHNwZWNpZmllZCBvYmplY3QgcHJvcGVydHkgc2F0aXNmaWVzIHRoZSBnaXZlblxuICAgICAqIHByZWRpY2F0ZTsgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE2LjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFN0cmluZyAtPiB7U3RyaW5nOiBhfSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHsqfSBvYmpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5wcm9wRXEsIFIucHJvcElzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wcm9wU2F0aXNmaWVzKHggPT4geCA+IDAsICd4Jywge3g6IDEsIHk6IDJ9KTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIHByb3BTYXRpc2ZpZXMgPSBfY3VycnkzKGZ1bmN0aW9uIHByb3BTYXRpc2ZpZXMocHJlZCwgbmFtZSwgb2JqKSB7XG4gICAgICAgIHJldHVybiBwcmVkKG9ialtuYW1lXSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBBY3RzIGFzIG11bHRpcGxlIGBwcm9wYDogYXJyYXkgb2Yga2V5cyBpbiwgYXJyYXkgb2YgdmFsdWVzIG91dC4gUHJlc2VydmVzXG4gICAgICogb3JkZXIuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIFtrXSAtPiB7azogdn0gLT4gW3ZdXG4gICAgICogQHBhcmFtIHtBcnJheX0gcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIGZldGNoXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHF1ZXJ5XG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcyBvciBwYXJ0aWFsbHkgYXBwbGllZCBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnByb3BzKFsneCcsICd5J10sIHt4OiAxLCB5OiAyfSk7IC8vPT4gWzEsIDJdXG4gICAgICogICAgICBSLnByb3BzKFsnYycsICdhJywgJ2InXSwge2I6IDIsIGE6IDF9KTsgLy89PiBbdW5kZWZpbmVkLCAxLCAyXVxuICAgICAqXG4gICAgICogICAgICB2YXIgZnVsbE5hbWUgPSBSLmNvbXBvc2UoUi5qb2luKCcgJyksIFIucHJvcHMoWydmaXJzdCcsICdsYXN0J10pKTtcbiAgICAgKiAgICAgIGZ1bGxOYW1lKHtsYXN0OiAnQnVsbGV0LVRvb3RoJywgYWdlOiAzMywgZmlyc3Q6ICdUb255J30pOyAvLz0+ICdUb255IEJ1bGxldC1Ub290aCdcbiAgICAgKi9cbiAgICB2YXIgcHJvcHMgPSBfY3VycnkyKGZ1bmN0aW9uIHByb3BzKHBzLCBvYmopIHtcbiAgICAgICAgdmFyIGxlbiA9IHBzLmxlbmd0aDtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgb3V0W2lkeF0gPSBvYmpbcHNbaWR4XV07XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxpc3Qgb2YgbnVtYmVycyBmcm9tIGBmcm9tYCAoaW5jbHVzaXZlKSB0byBgdG9gIChleGNsdXNpdmUpLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IE51bWJlciAtPiBbTnVtYmVyXVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBmcm9tIFRoZSBmaXJzdCBudW1iZXIgaW4gdGhlIGxpc3QuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRvIE9uZSBtb3JlIHRoYW4gdGhlIGxhc3QgbnVtYmVyIGluIHRoZSBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBvZiBudW1iZXJzIGluIHR0aGUgc2V0IGBbYSwgYilgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucmFuZ2UoMSwgNSk7ICAgIC8vPT4gWzEsIDIsIDMsIDRdXG4gICAgICogICAgICBSLnJhbmdlKDUwLCA1Myk7ICAvLz0+IFs1MCwgNTEsIDUyXVxuICAgICAqL1xuICAgIHZhciByYW5nZSA9IF9jdXJyeTIoZnVuY3Rpb24gcmFuZ2UoZnJvbSwgdG8pIHtcbiAgICAgICAgaWYgKCEoX2lzTnVtYmVyKGZyb20pICYmIF9pc051bWJlcih0bykpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCb3RoIGFyZ3VtZW50cyB0byByYW5nZSBtdXN0IGJlIG51bWJlcnMnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHZhciBuID0gZnJvbTtcbiAgICAgICAgd2hpbGUgKG4gPCB0bykge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobik7XG4gICAgICAgICAgICBuICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBzaW5nbGUgaXRlbSBieSBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgbGlzdCwgc3VjY2Vzc2l2ZWx5IGNhbGxpbmdcbiAgICAgKiB0aGUgaXRlcmF0b3IgZnVuY3Rpb24gYW5kIHBhc3NpbmcgaXQgYW4gYWNjdW11bGF0b3IgdmFsdWUgYW5kIHRoZSBjdXJyZW50XG4gICAgICogdmFsdWUgZnJvbSB0aGUgYXJyYXksIGFuZCB0aGVuIHBhc3NpbmcgdGhlIHJlc3VsdCB0byB0aGUgbmV4dCBjYWxsLlxuICAgICAqXG4gICAgICogU2ltaWxhciB0byBgcmVkdWNlYCwgZXhjZXB0IG1vdmVzIHRocm91Z2ggdGhlIGlucHV0IGxpc3QgZnJvbSB0aGUgcmlnaHQgdG9cbiAgICAgKiB0aGUgbGVmdC5cbiAgICAgKlxuICAgICAqIFRoZSBpdGVyYXRvciBmdW5jdGlvbiByZWNlaXZlcyB0d28gdmFsdWVzOiAqKGFjYywgdmFsdWUpKlxuICAgICAqXG4gICAgICogTm90ZTogYFIucmVkdWNlUmlnaHRgIGRvZXMgbm90IHNraXAgZGVsZXRlZCBvciB1bmFzc2lnbmVkIGluZGljZXMgKHNwYXJzZVxuICAgICAqIGFycmF5cyksIHVubGlrZSB0aGUgbmF0aXZlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYCBtZXRob2QuIEZvciBtb3JlIGRldGFpbHNcbiAgICAgKiBvbiB0aGlzIGJlaGF2aW9yLCBzZWU6XG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvcmVkdWNlUmlnaHQjRGVzY3JpcHRpb25cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhLGIgLT4gYSkgLT4gYSAtPiBbYl0gLT4gYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBpdGVyYXRvciBmdW5jdGlvbi4gUmVjZWl2ZXMgdHdvIHZhbHVlcywgdGhlIGFjY3VtdWxhdG9yIGFuZCB0aGVcbiAgICAgKiAgICAgICAgY3VycmVudCBlbGVtZW50IGZyb20gdGhlIGFycmF5LlxuICAgICAqIEBwYXJhbSB7Kn0gYWNjIFRoZSBhY2N1bXVsYXRvciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgZmluYWwsIGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgICAqIEBzZWUgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBwYWlycyA9IFsgWydhJywgMV0sIFsnYicsIDJdLCBbJ2MnLCAzXSBdO1xuICAgICAqICAgICAgdmFyIGZsYXR0ZW5QYWlycyA9IChhY2MsIHBhaXIpID0+IGFjYy5jb25jYXQocGFpcik7XG4gICAgICpcbiAgICAgKiAgICAgIFIucmVkdWNlUmlnaHQoZmxhdHRlblBhaXJzLCBbXSwgcGFpcnMpOyAvLz0+IFsgJ2MnLCAzLCAnYicsIDIsICdhJywgMSBdXG4gICAgICovXG4gICAgdmFyIHJlZHVjZVJpZ2h0ID0gX2N1cnJ5MyhmdW5jdGlvbiByZWR1Y2VSaWdodChmbiwgYWNjLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpZHggPj0gMCkge1xuICAgICAgICAgICAgYWNjID0gZm4oYWNjLCBsaXN0W2lkeF0pO1xuICAgICAgICAgICAgaWR4IC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSB2YWx1ZSB3cmFwcGVkIHRvIGluZGljYXRlIHRoYXQgaXQgaXMgdGhlIGZpbmFsIHZhbHVlIG9mIHRoZSByZWR1Y2VcbiAgICAgKiBhbmQgdHJhbnNkdWNlIGZ1bmN0aW9ucy4gVGhlIHJldHVybmVkIHZhbHVlIHNob3VsZCBiZSBjb25zaWRlcmVkIGEgYmxhY2tcbiAgICAgKiBib3g6IHRoZSBpbnRlcm5hbCBzdHJ1Y3R1cmUgaXMgbm90IGd1YXJhbnRlZWQgdG8gYmUgc3RhYmxlLlxuICAgICAqXG4gICAgICogTm90ZTogdGhpcyBvcHRpbWl6YXRpb24gaXMgdW5hdmFpbGFibGUgdG8gZnVuY3Rpb25zIG5vdCBleHBsaWNpdGx5IGxpc3RlZFxuICAgICAqIGFib3ZlLiBGb3IgaW5zdGFuY2UsIGl0IGlzIG5vdCBjdXJyZW50bHkgc3VwcG9ydGVkIGJ5IHJlZHVjZVJpZ2h0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGEgLT4gKlxuICAgICAqIEBwYXJhbSB7Kn0geCBUaGUgZmluYWwgdmFsdWUgb2YgdGhlIHJlZHVjZS5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgd3JhcHBlZCB2YWx1ZS5cbiAgICAgKiBAc2VlIFIucmVkdWNlLCBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucmVkdWNlKFxuICAgICAqICAgICAgICBSLnBpcGUoUi5hZGQsIFIud2hlbihSLmd0ZShSLl9fLCAxMCksIFIucmVkdWNlZCkpLFxuICAgICAqICAgICAgICAwLFxuICAgICAqICAgICAgICBbMSwgMiwgMywgNCwgNV0pIC8vIDEwXG4gICAgICovXG4gICAgdmFyIHJlZHVjZWQgPSBfY3VycnkxKF9yZWR1Y2VkKTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIHN1Yi1saXN0IG9mIGBsaXN0YCBzdGFydGluZyBhdCBpbmRleCBgc3RhcnRgIGFuZCBjb250YWluaW5nXG4gICAgICogYGNvdW50YCBlbGVtZW50cy4gX05vdGUgdGhhdCB0aGlzIGlzIG5vdCBkZXN0cnVjdGl2ZV86IGl0IHJldHVybnMgYSBjb3B5IG9mXG4gICAgICogdGhlIGxpc3Qgd2l0aCB0aGUgY2hhbmdlcy5cbiAgICAgKiA8c21hbGw+Tm8gbGlzdHMgaGF2ZSBiZWVuIGhhcm1lZCBpbiB0aGUgYXBwbGljYXRpb24gb2YgdGhpcyBmdW5jdGlvbi48L3NtYWxsPlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yLjJcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IE51bWJlciAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHN0YXJ0IFRoZSBwb3NpdGlvbiB0byBzdGFydCByZW1vdmluZyBlbGVtZW50c1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIHJlbW92ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gcmVtb3ZlIGZyb21cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgQXJyYXkgd2l0aCBgY291bnRgIGVsZW1lbnRzIGZyb20gYHN0YXJ0YCByZW1vdmVkLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucmVtb3ZlKDIsIDMsIFsxLDIsMyw0LDUsNiw3LDhdKTsgLy89PiBbMSwyLDYsNyw4XVxuICAgICAqL1xuICAgIHZhciByZW1vdmUgPSBfY3VycnkzKGZ1bmN0aW9uIHJlbW92ZShzdGFydCwgY291bnQsIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIF9jb25jYXQoX3NsaWNlKGxpc3QsIDAsIE1hdGgubWluKHN0YXJ0LCBsaXN0Lmxlbmd0aCkpLCBfc2xpY2UobGlzdCwgTWF0aC5taW4obGlzdC5sZW5ndGgsIHN0YXJ0ICsgY291bnQpKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXBsYWNlIGEgc3Vic3RyaW5nIG9yIHJlZ2V4IG1hdGNoIGluIGEgc3RyaW5nIHdpdGggYSByZXBsYWNlbWVudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNy4wXG4gICAgICogQGNhdGVnb3J5IFN0cmluZ1xuICAgICAqIEBzaWcgUmVnRXhwfFN0cmluZyAtPiBTdHJpbmcgLT4gU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7UmVnRXhwfFN0cmluZ30gcGF0dGVybiBBIHJlZ3VsYXIgZXhwcmVzc2lvbiBvciBhIHN1YnN0cmluZyB0byBtYXRjaC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcmVwbGFjZW1lbnQgVGhlIHN0cmluZyB0byByZXBsYWNlIHRoZSBtYXRjaGVzIHdpdGguXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgU3RyaW5nIHRvIGRvIHRoZSBzZWFyY2ggYW5kIHJlcGxhY2VtZW50IGluLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHJlc3VsdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnJlcGxhY2UoJ2ZvbycsICdiYXInLCAnZm9vIGZvbyBmb28nKTsgLy89PiAnYmFyIGZvbyBmb28nXG4gICAgICogICAgICBSLnJlcGxhY2UoL2Zvby8sICdiYXInLCAnZm9vIGZvbyBmb28nKTsgLy89PiAnYmFyIGZvbyBmb28nXG4gICAgICpcbiAgICAgKiAgICAgIC8vIFVzZSB0aGUgXCJnXCIgKGdsb2JhbCkgZmxhZyB0byByZXBsYWNlIGFsbCBvY2N1cnJlbmNlczpcbiAgICAgKiAgICAgIFIucmVwbGFjZSgvZm9vL2csICdiYXInLCAnZm9vIGZvbyBmb28nKTsgLy89PiAnYmFyIGJhciBiYXInXG4gICAgICovXG4gICAgdmFyIHJlcGxhY2UgPSBfY3VycnkzKGZ1bmN0aW9uIHJlcGxhY2UocmVnZXgsIHJlcGxhY2VtZW50LCBzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKHJlZ2V4LCByZXBsYWNlbWVudCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGxpc3Qgb3Igc3RyaW5nIHdpdGggdGhlIGVsZW1lbnRzIG9yIGNoYXJhY3RlcnMgaW4gcmV2ZXJzZVxuICAgICAqIG9yZGVyLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFthXVxuICAgICAqIEBzaWcgU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBsaXN0XG4gICAgICogQHJldHVybiB7QXJyYXl8U3RyaW5nfVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucmV2ZXJzZShbMSwgMiwgM10pOyAgLy89PiBbMywgMiwgMV1cbiAgICAgKiAgICAgIFIucmV2ZXJzZShbMSwgMl0pOyAgICAgLy89PiBbMiwgMV1cbiAgICAgKiAgICAgIFIucmV2ZXJzZShbMV0pOyAgICAgICAgLy89PiBbMV1cbiAgICAgKiAgICAgIFIucmV2ZXJzZShbXSk7ICAgICAgICAgLy89PiBbXVxuICAgICAqXG4gICAgICogICAgICBSLnJldmVyc2UoJ2FiYycpOyAgICAgIC8vPT4gJ2NiYSdcbiAgICAgKiAgICAgIFIucmV2ZXJzZSgnYWInKTsgICAgICAgLy89PiAnYmEnXG4gICAgICogICAgICBSLnJldmVyc2UoJ2EnKTsgICAgICAgIC8vPT4gJ2EnXG4gICAgICogICAgICBSLnJldmVyc2UoJycpOyAgICAgICAgIC8vPT4gJydcbiAgICAgKi9cbiAgICB2YXIgcmV2ZXJzZSA9IF9jdXJyeTEoZnVuY3Rpb24gcmV2ZXJzZShsaXN0KSB7XG4gICAgICAgIHJldHVybiBfaXNTdHJpbmcobGlzdCkgPyBsaXN0LnNwbGl0KCcnKS5yZXZlcnNlKCkuam9pbignJykgOiBfc2xpY2UobGlzdCkucmV2ZXJzZSgpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU2NhbiBpcyBzaW1pbGFyIHRvIHJlZHVjZSwgYnV0IHJldHVybnMgYSBsaXN0IG9mIHN1Y2Nlc3NpdmVseSByZWR1Y2VkIHZhbHVlc1xuICAgICAqIGZyb20gdGhlIGxlZnRcbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSxiIC0+IGEpIC0+IGEgLT4gW2JdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBpdGVyYXRvciBmdW5jdGlvbi4gUmVjZWl2ZXMgdHdvIHZhbHVlcywgdGhlIGFjY3VtdWxhdG9yIGFuZCB0aGVcbiAgICAgKiAgICAgICAgY3VycmVudCBlbGVtZW50IGZyb20gdGhlIGFycmF5XG4gICAgICogQHBhcmFtIHsqfSBhY2MgVGhlIGFjY3VtdWxhdG9yIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIGxpc3Qgb2YgYWxsIGludGVybWVkaWF0ZWx5IHJlZHVjZWQgdmFsdWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBudW1iZXJzID0gWzEsIDIsIDMsIDRdO1xuICAgICAqICAgICAgdmFyIGZhY3RvcmlhbHMgPSBSLnNjYW4oUi5tdWx0aXBseSwgMSwgbnVtYmVycyk7IC8vPT4gWzEsIDEsIDIsIDYsIDI0XVxuICAgICAqL1xuICAgIHZhciBzY2FuID0gX2N1cnJ5MyhmdW5jdGlvbiBzY2FuKGZuLCBhY2MsIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFthY2NdO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBhY2MgPSBmbihhY2MsIGxpc3RbaWR4XSk7XG4gICAgICAgICAgICByZXN1bHRbaWR4ICsgMV0gPSBhY2M7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcmVzdWx0IG9mIFwic2V0dGluZ1wiIHRoZSBwb3J0aW9uIG9mIHRoZSBnaXZlbiBkYXRhIHN0cnVjdHVyZVxuICAgICAqIGZvY3VzZWQgYnkgdGhlIGdpdmVuIGxlbnMgdG8gdGhlIGdpdmVuIHZhbHVlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEB0eXBlZGVmbiBMZW5zIHMgYSA9IEZ1bmN0b3IgZiA9PiAoYSAtPiBmIGEpIC0+IHMgLT4gZiBzXG4gICAgICogQHNpZyBMZW5zIHMgYSAtPiBhIC0+IHMgLT4gc1xuICAgICAqIEBwYXJhbSB7TGVuc30gbGVuc1xuICAgICAqIEBwYXJhbSB7Kn0gdlxuICAgICAqIEBwYXJhbSB7Kn0geFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLnByb3AsIFIubGVuc0luZGV4LCBSLmxlbnNQcm9wXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHhMZW5zID0gUi5sZW5zUHJvcCgneCcpO1xuICAgICAqXG4gICAgICogICAgICBSLnNldCh4TGVucywgNCwge3g6IDEsIHk6IDJ9KTsgIC8vPT4ge3g6IDQsIHk6IDJ9XG4gICAgICogICAgICBSLnNldCh4TGVucywgOCwge3g6IDEsIHk6IDJ9KTsgIC8vPT4ge3g6IDgsIHk6IDJ9XG4gICAgICovXG4gICAgdmFyIHNldCA9IF9jdXJyeTMoZnVuY3Rpb24gc2V0KGxlbnMsIHYsIHgpIHtcbiAgICAgICAgcmV0dXJuIG92ZXIobGVucywgYWx3YXlzKHYpLCB4KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGVsZW1lbnRzIG9mIHRoZSBnaXZlbiBsaXN0IG9yIHN0cmluZyAob3Igb2JqZWN0IHdpdGggYSBgc2xpY2VgXG4gICAgICogbWV0aG9kKSBmcm9tIGBmcm9tSW5kZXhgIChpbmNsdXNpdmUpIHRvIGB0b0luZGV4YCAoZXhjbHVzaXZlKS5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBzbGljZWAgbWV0aG9kIG9mIHRoZSB0aGlyZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS40XG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gW2FdIC0+IFthXVxuICAgICAqIEBzaWcgTnVtYmVyIC0+IE51bWJlciAtPiBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGZyb21JbmRleCBUaGUgc3RhcnQgaW5kZXggKGluY2x1c2l2ZSkuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRvSW5kZXggVGhlIGVuZCBpbmRleCAoZXhjbHVzaXZlKS5cbiAgICAgKiBAcGFyYW0geyp9IGxpc3RcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuc2xpY2UoMSwgMywgWydhJywgJ2InLCAnYycsICdkJ10pOyAgICAgICAgLy89PiBbJ2InLCAnYyddXG4gICAgICogICAgICBSLnNsaWNlKDEsIEluZmluaXR5LCBbJ2EnLCAnYicsICdjJywgJ2QnXSk7IC8vPT4gWydiJywgJ2MnLCAnZCddXG4gICAgICogICAgICBSLnNsaWNlKDAsIC0xLCBbJ2EnLCAnYicsICdjJywgJ2QnXSk7ICAgICAgIC8vPT4gWydhJywgJ2InLCAnYyddXG4gICAgICogICAgICBSLnNsaWNlKC0zLCAtMSwgWydhJywgJ2InLCAnYycsICdkJ10pOyAgICAgIC8vPT4gWydiJywgJ2MnXVxuICAgICAqICAgICAgUi5zbGljZSgwLCAzLCAncmFtZGEnKTsgICAgICAgICAgICAgICAgICAgICAvLz0+ICdyYW0nXG4gICAgICovXG4gICAgdmFyIHNsaWNlID0gX2N1cnJ5MyhfY2hlY2tGb3JNZXRob2QoJ3NsaWNlJywgZnVuY3Rpb24gc2xpY2UoZnJvbUluZGV4LCB0b0luZGV4LCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChsaXN0LCBmcm9tSW5kZXgsIHRvSW5kZXgpO1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBsaXN0LCBzb3J0ZWQgYWNjb3JkaW5nIHRvIHRoZSBjb21wYXJhdG9yIGZ1bmN0aW9uLFxuICAgICAqIHdoaWNoIHNob3VsZCBhY2NlcHQgdHdvIHZhbHVlcyBhdCBhIHRpbWUgYW5kIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciBpZiB0aGVcbiAgICAgKiBmaXJzdCB2YWx1ZSBpcyBzbWFsbGVyLCBhIHBvc2l0aXZlIG51bWJlciBpZiBpdCdzIGxhcmdlciwgYW5kIHplcm8gaWYgdGhleVxuICAgICAqIGFyZSBlcXVhbC4gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGlzIGEgKipjb3B5Kiogb2YgdGhlIGxpc3QuIEl0IGRvZXMgbm90XG4gICAgICogbW9kaWZ5IHRoZSBvcmlnaW5hbC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhLGEgLT4gTnVtYmVyKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcGFyYXRvciBBIHNvcnRpbmcgZnVuY3Rpb24gOjogYSAtPiBiIC0+IEludFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gc29ydFxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhIG5ldyBhcnJheSB3aXRoIGl0cyBlbGVtZW50cyBzb3J0ZWQgYnkgdGhlIGNvbXBhcmF0b3IgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGRpZmYgPSBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYjsgfTtcbiAgICAgKiAgICAgIFIuc29ydChkaWZmLCBbNCwyLDcsNV0pOyAvLz0+IFsyLCA0LCA1LCA3XVxuICAgICAqL1xuICAgIHZhciBzb3J0ID0gX2N1cnJ5MihmdW5jdGlvbiBzb3J0KGNvbXBhcmF0b3IsIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIF9zbGljZShsaXN0KS5zb3J0KGNvbXBhcmF0b3IpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU29ydHMgdGhlIGxpc3QgYWNjb3JkaW5nIHRvIHRoZSBzdXBwbGllZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBPcmQgYiA9PiAoYSAtPiBiKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIHNvcnQuXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgbmV3IGxpc3Qgc29ydGVkIGJ5IHRoZSBrZXlzIGdlbmVyYXRlZCBieSBgZm5gLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzb3J0QnlGaXJzdEl0ZW0gPSBSLnNvcnRCeShSLnByb3AoMCkpO1xuICAgICAqICAgICAgdmFyIHNvcnRCeU5hbWVDYXNlSW5zZW5zaXRpdmUgPSBSLnNvcnRCeShSLmNvbXBvc2UoUi50b0xvd2VyLCBSLnByb3AoJ25hbWUnKSkpO1xuICAgICAqICAgICAgdmFyIHBhaXJzID0gW1stMSwgMV0sIFstMiwgMl0sIFstMywgM11dO1xuICAgICAqICAgICAgc29ydEJ5Rmlyc3RJdGVtKHBhaXJzKTsgLy89PiBbWy0zLCAzXSwgWy0yLCAyXSwgWy0xLCAxXV1cbiAgICAgKiAgICAgIHZhciBhbGljZSA9IHtcbiAgICAgKiAgICAgICAgbmFtZTogJ0FMSUNFJyxcbiAgICAgKiAgICAgICAgYWdlOiAxMDFcbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICB2YXIgYm9iID0ge1xuICAgICAqICAgICAgICBuYW1lOiAnQm9iJyxcbiAgICAgKiAgICAgICAgYWdlOiAtMTBcbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICB2YXIgY2xhcmEgPSB7XG4gICAgICogICAgICAgIG5hbWU6ICdjbGFyYScsXG4gICAgICogICAgICAgIGFnZTogMzE0LjE1OVxuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIHZhciBwZW9wbGUgPSBbY2xhcmEsIGJvYiwgYWxpY2VdO1xuICAgICAqICAgICAgc29ydEJ5TmFtZUNhc2VJbnNlbnNpdGl2ZShwZW9wbGUpOyAvLz0+IFthbGljZSwgYm9iLCBjbGFyYV1cbiAgICAgKi9cbiAgICB2YXIgc29ydEJ5ID0gX2N1cnJ5MihmdW5jdGlvbiBzb3J0QnkoZm4sIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIF9zbGljZShsaXN0KS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICB2YXIgYWEgPSBmbihhKTtcbiAgICAgICAgICAgIHZhciBiYiA9IGZuKGIpO1xuICAgICAgICAgICAgcmV0dXJuIGFhIDwgYmIgPyAtMSA6IGFhID4gYmIgPyAxIDogMDtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBTcGxpdHMgYSBnaXZlbiBsaXN0IG9yIHN0cmluZyBhdCBhIGdpdmVuIGluZGV4LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBbYV0gLT4gW1thXSwgW2FdXVxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiBbU3RyaW5nLCBTdHJpbmddXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IFRoZSBpbmRleCB3aGVyZSB0aGUgYXJyYXkvc3RyaW5nIGlzIHNwbGl0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBhcnJheSBUaGUgYXJyYXkvc3RyaW5nIHRvIGJlIHNwbGl0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuc3BsaXRBdCgxLCBbMSwgMiwgM10pOyAgICAgICAgICAvLz0+IFtbMV0sIFsyLCAzXV1cbiAgICAgKiAgICAgIFIuc3BsaXRBdCg1LCAnaGVsbG8gd29ybGQnKTsgICAgICAvLz0+IFsnaGVsbG8nLCAnIHdvcmxkJ11cbiAgICAgKiAgICAgIFIuc3BsaXRBdCgtMSwgJ2Zvb2JhcicpOyAgICAgICAgICAvLz0+IFsnZm9vYmEnLCAnciddXG4gICAgICovXG4gICAgdmFyIHNwbGl0QXQgPSBfY3VycnkyKGZ1bmN0aW9uIHNwbGl0QXQoaW5kZXgsIGFycmF5KSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBzbGljZSgwLCBpbmRleCwgYXJyYXkpLFxuICAgICAgICAgICAgc2xpY2UoaW5kZXgsIGxlbmd0aChhcnJheSksIGFycmF5KVxuICAgICAgICBdO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU3BsaXRzIGEgY29sbGVjdGlvbiBpbnRvIHNsaWNlcyBvZiB0aGUgc3BlY2lmaWVkIGxlbmd0aC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IFtbYV1dXG4gICAgICogQHNpZyBOdW1iZXIgLT4gU3RyaW5nIC0+IFtTdHJpbmddXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0XG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5zcGxpdEV2ZXJ5KDMsIFsxLCAyLCAzLCA0LCA1LCA2LCA3XSk7IC8vPT4gW1sxLCAyLCAzXSwgWzQsIDUsIDZdLCBbN11dXG4gICAgICogICAgICBSLnNwbGl0RXZlcnkoMywgJ2Zvb2JhcmJheicpOyAvLz0+IFsnZm9vJywgJ2JhcicsICdiYXonXVxuICAgICAqL1xuICAgIHZhciBzcGxpdEV2ZXJ5ID0gX2N1cnJ5MihmdW5jdGlvbiBzcGxpdEV2ZXJ5KG4sIGxpc3QpIHtcbiAgICAgICAgaWYgKG4gPD0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byBzcGxpdEV2ZXJ5IG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChzbGljZShpZHgsIGlkeCArPSBuLCBsaXN0KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgbGlzdCBhbmQgYSBwcmVkaWNhdGUgYW5kIHJldHVybnMgYSBwYWlyIG9mIGxpc3RzIHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgICAqXG4gICAgICogIC0gdGhlIHJlc3VsdCBvZiBjb25jYXRlbmF0aW5nIHRoZSB0d28gb3V0cHV0IGxpc3RzIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGlucHV0IGxpc3Q7XG4gICAgICogIC0gbm9uZSBvZiB0aGUgZWxlbWVudHMgb2YgdGhlIGZpcnN0IG91dHB1dCBsaXN0IHNhdGlzZmllcyB0aGUgcHJlZGljYXRlOyBhbmRcbiAgICAgKiAgLSBpZiB0aGUgc2Vjb25kIG91dHB1dCBsaXN0IGlzIG5vbi1lbXB0eSwgaXRzIGZpcnN0IGVsZW1lbnQgc2F0aXNmaWVzIHRoZSBwcmVkaWNhdGUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IFtbYV0sIFthXV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIFRoZSBwcmVkaWNhdGUgdGhhdCBkZXRlcm1pbmVzIHdoZXJlIHRoZSBhcnJheSBpcyBzcGxpdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBiZSBzcGxpdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnNwbGl0V2hlbihSLmVxdWFscygyKSwgWzEsIDIsIDMsIDEsIDIsIDNdKTsgICAvLz0+IFtbMV0sIFsyLCAzLCAxLCAyLCAzXV1cbiAgICAgKi9cbiAgICB2YXIgc3BsaXRXaGVuID0gX2N1cnJ5MihmdW5jdGlvbiBzcGxpdFdoZW4ocHJlZCwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgcHJlZml4ID0gW107XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4gJiYgIXByZWQobGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgcHJlZml4LnB1c2gobGlzdFtpZHhdKTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBwcmVmaXgsXG4gICAgICAgICAgICBfc2xpY2UobGlzdCwgaWR4KVxuICAgICAgICBdO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU3VidHJhY3RzIGl0cyBzZWNvbmQgYXJndW1lbnQgZnJvbSBpdHMgZmlyc3QgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhIFRoZSBmaXJzdCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYiBUaGUgc2Vjb25kIHZhbHVlLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIHJlc3VsdCBvZiBgYSAtIGJgLlxuICAgICAqIEBzZWUgUi5hZGRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnN1YnRyYWN0KDEwLCA4KTsgLy89PiAyXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtaW51czUgPSBSLnN1YnRyYWN0KFIuX18sIDUpO1xuICAgICAqICAgICAgbWludXM1KDE3KTsgLy89PiAxMlxuICAgICAqXG4gICAgICogICAgICB2YXIgY29tcGxlbWVudGFyeUFuZ2xlID0gUi5zdWJ0cmFjdCg5MCk7XG4gICAgICogICAgICBjb21wbGVtZW50YXJ5QW5nbGUoMzApOyAvLz0+IDYwXG4gICAgICogICAgICBjb21wbGVtZW50YXJ5QW5nbGUoNzIpOyAvLz0+IDE4XG4gICAgICovXG4gICAgdmFyIHN1YnRyYWN0ID0gX2N1cnJ5MihmdW5jdGlvbiBzdWJ0cmFjdChhLCBiKSB7XG4gICAgICAgIHJldHVybiBOdW1iZXIoYSkgLSBOdW1iZXIoYik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFsbCBidXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGdpdmVuIGxpc3Qgb3Igc3RyaW5nIChvciBvYmplY3RcbiAgICAgKiB3aXRoIGEgYHRhaWxgIG1ldGhvZCkuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgc2xpY2VgIG1ldGhvZCBvZiB0aGUgZmlyc3QgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gW2FdXG4gICAgICogQHNpZyBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHsqfSBsaXN0XG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIuaGVhZCwgUi5pbml0LCBSLmxhc3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnRhaWwoWzEsIDIsIDNdKTsgIC8vPT4gWzIsIDNdXG4gICAgICogICAgICBSLnRhaWwoWzEsIDJdKTsgICAgIC8vPT4gWzJdXG4gICAgICogICAgICBSLnRhaWwoWzFdKTsgICAgICAgIC8vPT4gW11cbiAgICAgKiAgICAgIFIudGFpbChbXSk7ICAgICAgICAgLy89PiBbXVxuICAgICAqXG4gICAgICogICAgICBSLnRhaWwoJ2FiYycpOyAgLy89PiAnYmMnXG4gICAgICogICAgICBSLnRhaWwoJ2FiJyk7ICAgLy89PiAnYidcbiAgICAgKiAgICAgIFIudGFpbCgnYScpOyAgICAvLz0+ICcnXG4gICAgICogICAgICBSLnRhaWwoJycpOyAgICAgLy89PiAnJ1xuICAgICAqL1xuICAgIHZhciB0YWlsID0gX2NoZWNrRm9yTWV0aG9kKCd0YWlsJywgc2xpY2UoMSwgSW5maW5pdHkpKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGZpcnN0IGBuYCBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gbGlzdCwgc3RyaW5nLCBvclxuICAgICAqIHRyYW5zZHVjZXIvdHJhbnNmb3JtZXIgKG9yIG9iamVjdCB3aXRoIGEgYHRha2VgIG1ldGhvZCkuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgdGFrZWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IFthXVxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gblxuICAgICAqIEBwYXJhbSB7Kn0gbGlzdFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLmRyb3BcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnRha2UoMSwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2ZvbyddXG4gICAgICogICAgICBSLnRha2UoMiwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2ZvbycsICdiYXInXVxuICAgICAqICAgICAgUi50YWtlKDMsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydmb28nLCAnYmFyJywgJ2JheiddXG4gICAgICogICAgICBSLnRha2UoNCwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2ZvbycsICdiYXInLCAnYmF6J11cbiAgICAgKiAgICAgIFIudGFrZSgzLCAncmFtZGEnKTsgICAgICAgICAgICAgICAvLz0+ICdyYW0nXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBwZXJzb25uZWwgPSBbXG4gICAgICogICAgICAgICdEYXZlIEJydWJlY2snLFxuICAgICAqICAgICAgICAnUGF1bCBEZXNtb25kJyxcbiAgICAgKiAgICAgICAgJ0V1Z2VuZSBXcmlnaHQnLFxuICAgICAqICAgICAgICAnSm9lIE1vcmVsbG8nLFxuICAgICAqICAgICAgICAnR2VycnkgTXVsbGlnYW4nLFxuICAgICAqICAgICAgICAnQm9iIEJhdGVzJyxcbiAgICAgKiAgICAgICAgJ0pvZSBEb2RnZScsXG4gICAgICogICAgICAgICdSb24gQ3JvdHR5J1xuICAgICAqICAgICAgXTtcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHRha2VGaXZlID0gUi50YWtlKDUpO1xuICAgICAqICAgICAgdGFrZUZpdmUocGVyc29ubmVsKTtcbiAgICAgKiAgICAgIC8vPT4gWydEYXZlIEJydWJlY2snLCAnUGF1bCBEZXNtb25kJywgJ0V1Z2VuZSBXcmlnaHQnLCAnSm9lIE1vcmVsbG8nLCAnR2VycnkgTXVsbGlnYW4nXVxuICAgICAqL1xuICAgIHZhciB0YWtlID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCd0YWtlJywgX3h0YWtlLCBmdW5jdGlvbiB0YWtlKG4sIHhzKSB7XG4gICAgICAgIHJldHVybiBzbGljZSgwLCBuIDwgMCA/IEluZmluaXR5IDogbiwgeHMpO1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIHRoZSBsYXN0IGBuYCBlbGVtZW50cyBvZiBhIGdpdmVuIGxpc3QsIHBhc3NpbmdcbiAgICAgKiBlYWNoIHZhbHVlIHRvIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgZnVuY3Rpb24sIGFuZCB0ZXJtaW5hdGluZyB3aGVuIHRoZVxuICAgICAqIHByZWRpY2F0ZSBmdW5jdGlvbiByZXR1cm5zIGBmYWxzZWAuIEV4Y2x1ZGVzIHRoZSBlbGVtZW50IHRoYXQgY2F1c2VkIHRoZVxuICAgICAqIHByZWRpY2F0ZSBmdW5jdGlvbiB0byBmYWlsLiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIGlzIHBhc3NlZCBvbmUgYXJndW1lbnQ6XG4gICAgICogKih2YWx1ZSkqLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgbmV3IGFycmF5LlxuICAgICAqIEBzZWUgUi5kcm9wTGFzdFdoaWxlLCBSLmFkZEluZGV4XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGlzTm90T25lID0geCA9PiB4ICE9PSAxO1xuICAgICAqXG4gICAgICogICAgICBSLnRha2VMYXN0V2hpbGUoaXNOb3RPbmUsIFsxLCAyLCAzLCA0XSk7IC8vPT4gWzIsIDMsIDRdXG4gICAgICovXG4gICAgdmFyIHRha2VMYXN0V2hpbGUgPSBfY3VycnkyKGZ1bmN0aW9uIHRha2VMYXN0V2hpbGUoZm4sIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IGxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgd2hpbGUgKGlkeCA+PSAwICYmIGZuKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgIGlkeCAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfc2xpY2UobGlzdCwgaWR4ICsgMSwgSW5maW5pdHkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnRhaW5pbmcgdGhlIGZpcnN0IGBuYCBlbGVtZW50cyBvZiBhIGdpdmVuIGxpc3QsXG4gICAgICogcGFzc2luZyBlYWNoIHZhbHVlIHRvIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgZnVuY3Rpb24sIGFuZCB0ZXJtaW5hdGluZyB3aGVuXG4gICAgICogdGhlIHByZWRpY2F0ZSBmdW5jdGlvbiByZXR1cm5zIGBmYWxzZWAuIEV4Y2x1ZGVzIHRoZSBlbGVtZW50IHRoYXQgY2F1c2VkIHRoZVxuICAgICAqIHByZWRpY2F0ZSBmdW5jdGlvbiB0byBmYWlsLiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIGlzIHBhc3NlZCBvbmUgYXJndW1lbnQ6XG4gICAgICogKih2YWx1ZSkqLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYHRha2VXaGlsZWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBhcnJheS5cbiAgICAgKiBAc2VlIFIuZHJvcFdoaWxlLCBSLnRyYW5zZHVjZSwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBpc05vdEZvdXIgPSB4ID0+IHggIT09IDQ7XG4gICAgICpcbiAgICAgKiAgICAgIFIudGFrZVdoaWxlKGlzTm90Rm91ciwgWzEsIDIsIDMsIDQsIDMsIDIsIDFdKTsgLy89PiBbMSwgMiwgM11cbiAgICAgKi9cbiAgICB2YXIgdGFrZVdoaWxlID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCd0YWtlV2hpbGUnLCBfeHRha2VXaGlsZSwgZnVuY3Rpb24gdGFrZVdoaWxlKGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4gJiYgZm4obGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9zbGljZShsaXN0LCAwLCBpZHgpO1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJ1bnMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggdGhlIHN1cHBsaWVkIG9iamVjdCwgdGhlbiByZXR1cm5zIHRoZSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKGEgLT4gKikgLT4gYSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2l0aCBgeGAuIFRoZSByZXR1cm4gdmFsdWUgb2YgYGZuYCB3aWxsIGJlIHRocm93biBhd2F5LlxuICAgICAqIEBwYXJhbSB7Kn0geFxuICAgICAqIEByZXR1cm4geyp9IGB4YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgc2F5WCA9IHggPT4gY29uc29sZS5sb2coJ3ggaXMgJyArIHgpO1xuICAgICAqICAgICAgUi50YXAoc2F5WCwgMTAwKTsgLy89PiAxMDBcbiAgICAgKiAgICAgIC8vLT4gJ3ggaXMgMTAwJ1xuICAgICAqL1xuICAgIHZhciB0YXAgPSBfY3VycnkyKGZ1bmN0aW9uIHRhcChmbiwgeCkge1xuICAgICAgICBmbih4KTtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDYWxscyBhbiBpbnB1dCBmdW5jdGlvbiBgbmAgdGltZXMsIHJldHVybmluZyBhbiBhcnJheSBjb250YWluaW5nIHRoZSByZXN1bHRzXG4gICAgICogb2YgdGhvc2UgZnVuY3Rpb24gY2FsbHMuXG4gICAgICpcbiAgICAgKiBgZm5gIGlzIHBhc3NlZCBvbmUgYXJndW1lbnQ6IFRoZSBjdXJyZW50IHZhbHVlIG9mIGBuYCwgd2hpY2ggYmVnaW5zIGF0IGAwYFxuICAgICAqIGFuZCBpcyBncmFkdWFsbHkgaW5jcmVtZW50ZWQgdG8gYG4gLSAxYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4zXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChOdW1iZXIgLT4gYSkgLT4gTnVtYmVyIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBpbnZva2UuIFBhc3NlZCBvbmUgYXJndW1lbnQsIHRoZSBjdXJyZW50IHZhbHVlIG9mIGBuYC5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiBBIHZhbHVlIGJldHdlZW4gYDBgIGFuZCBgbiAtIDFgLiBJbmNyZW1lbnRzIGFmdGVyIGVhY2ggZnVuY3Rpb24gY2FsbC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgY29udGFpbmluZyB0aGUgcmV0dXJuIHZhbHVlcyBvZiBhbGwgY2FsbHMgdG8gYGZuYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnRpbWVzKFIuaWRlbnRpdHksIDUpOyAvLz0+IFswLCAxLCAyLCAzLCA0XVxuICAgICAqL1xuICAgIHZhciB0aW1lcyA9IF9jdXJyeTIoZnVuY3Rpb24gdGltZXMoZm4sIG4pIHtcbiAgICAgICAgdmFyIGxlbiA9IE51bWJlcihuKTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsaXN0O1xuICAgICAgICBpZiAobGVuIDwgMCB8fCBpc05hTihsZW4pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignbiBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlcicpO1xuICAgICAgICB9XG4gICAgICAgIGxpc3QgPSBuZXcgQXJyYXkobGVuKTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgbGlzdFtpZHhdID0gZm4oaWR4KTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaXN0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYW4gb2JqZWN0IGludG8gYW4gYXJyYXkgb2Yga2V5LCB2YWx1ZSBhcnJheXMuIE9ubHkgdGhlIG9iamVjdCdzXG4gICAgICogb3duIHByb3BlcnRpZXMgYXJlIHVzZWQuXG4gICAgICogTm90ZSB0aGF0IHRoZSBvcmRlciBvZiB0aGUgb3V0cHV0IGFycmF5IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGNvbnNpc3RlbnRcbiAgICAgKiBhY3Jvc3MgZGlmZmVyZW50IEpTIHBsYXRmb3Jtcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge1N0cmluZzogKn0gLT4gW1tTdHJpbmcsKl1dXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGV4dHJhY3QgZnJvbVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiBrZXksIHZhbHVlIGFycmF5cyBmcm9tIHRoZSBvYmplY3QncyBvd24gcHJvcGVydGllcy5cbiAgICAgKiBAc2VlIFIuZnJvbVBhaXJzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50b1BhaXJzKHthOiAxLCBiOiAyLCBjOiAzfSk7IC8vPT4gW1snYScsIDFdLCBbJ2InLCAyXSwgWydjJywgM11dXG4gICAgICovXG4gICAgdmFyIHRvUGFpcnMgPSBfY3VycnkxKGZ1bmN0aW9uIHRvUGFpcnMob2JqKSB7XG4gICAgICAgIHZhciBwYWlycyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKF9oYXMocHJvcCwgb2JqKSkge1xuICAgICAgICAgICAgICAgIHBhaXJzW3BhaXJzLmxlbmd0aF0gPSBbXG4gICAgICAgICAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhaXJzO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYW4gb2JqZWN0IGludG8gYW4gYXJyYXkgb2Yga2V5LCB2YWx1ZSBhcnJheXMuIFRoZSBvYmplY3QncyBvd25cbiAgICAgKiBwcm9wZXJ0aWVzIGFuZCBwcm90b3R5cGUgcHJvcGVydGllcyBhcmUgdXNlZC4gTm90ZSB0aGF0IHRoZSBvcmRlciBvZiB0aGVcbiAgICAgKiBvdXRwdXQgYXJyYXkgaXMgbm90IGd1YXJhbnRlZWQgdG8gYmUgY29uc2lzdGVudCBhY3Jvc3MgZGlmZmVyZW50IEpTXG4gICAgICogcGxhdGZvcm1zLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC40LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7U3RyaW5nOiAqfSAtPiBbW1N0cmluZywqXV1cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZXh0cmFjdCBmcm9tXG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIGtleSwgdmFsdWUgYXJyYXlzIGZyb20gdGhlIG9iamVjdCdzIG93blxuICAgICAqICAgICAgICAgYW5kIHByb3RvdHlwZSBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBGID0gZnVuY3Rpb24oKSB7IHRoaXMueCA9ICdYJzsgfTtcbiAgICAgKiAgICAgIEYucHJvdG90eXBlLnkgPSAnWSc7XG4gICAgICogICAgICB2YXIgZiA9IG5ldyBGKCk7XG4gICAgICogICAgICBSLnRvUGFpcnNJbihmKTsgLy89PiBbWyd4JywnWCddLCBbJ3knLCdZJ11dXG4gICAgICovXG4gICAgdmFyIHRvUGFpcnNJbiA9IF9jdXJyeTEoZnVuY3Rpb24gdG9QYWlyc0luKG9iaikge1xuICAgICAgICB2YXIgcGFpcnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIHBhaXJzW3BhaXJzLmxlbmd0aF0gPSBbXG4gICAgICAgICAgICAgICAgcHJvcCxcbiAgICAgICAgICAgICAgICBvYmpbcHJvcF1cbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhaXJzO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVHJhbnNwb3NlcyB0aGUgcm93cyBhbmQgY29sdW1ucyBvZiBhIDJEIGxpc3QuXG4gICAgICogV2hlbiBwYXNzZWQgYSBsaXN0IG9mIGBuYCBsaXN0cyBvZiBsZW5ndGggYHhgLFxuICAgICAqIHJldHVybnMgYSBsaXN0IG9mIGB4YCBsaXN0cyBvZiBsZW5ndGggYG5gLlxuICAgICAqXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW1thXV0gLT4gW1thXV1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IEEgMkQgbGlzdFxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIDJEIGxpc3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnRyYW5zcG9zZShbWzEsICdhJ10sIFsyLCAnYiddLCBbMywgJ2MnXV0pIC8vPT4gW1sxLCAyLCAzXSwgWydhJywgJ2InLCAnYyddXVxuICAgICAqICAgICAgUi50cmFuc3Bvc2UoW1sxLCAyLCAzXSwgWydhJywgJ2InLCAnYyddXSkgLy89PiBbWzEsICdhJ10sIFsyLCAnYiddLCBbMywgJ2MnXV1cbiAgICAgKlxuICAgICAqIElmIHNvbWUgb2YgdGhlIHJvd3MgYXJlIHNob3J0ZXIgdGhhbiB0aGUgZm9sbG93aW5nIHJvd3MsIHRoZWlyIGVsZW1lbnRzIGFyZSBza2lwcGVkOlxuICAgICAqXG4gICAgICogICAgICBSLnRyYW5zcG9zZShbWzEwLCAxMV0sIFsyMF0sIFtdLCBbMzAsIDMxLCAzMl1dKSAvLz0+IFtbMTAsIDIwLCAzMF0sIFsxMSwgMzFdLCBbMzJdXVxuICAgICAqL1xuICAgIHZhciB0cmFuc3Bvc2UgPSBfY3VycnkxKGZ1bmN0aW9uIHRyYW5zcG9zZShvdXRlcmxpc3QpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHdoaWxlIChpIDwgb3V0ZXJsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGlubmVybGlzdCA9IG91dGVybGlzdFtpXTtcbiAgICAgICAgICAgIHZhciBqID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChqIDwgaW5uZXJsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0W2pdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbal0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0W2pdLnB1c2goaW5uZXJsaXN0W2pdKTtcbiAgICAgICAgICAgICAgICBqICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgKHN0cmlwcykgd2hpdGVzcGFjZSBmcm9tIGJvdGggZW5kcyBvZiB0aGUgc3RyaW5nLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC42LjBcbiAgICAgKiBAY2F0ZWdvcnkgU3RyaW5nXG4gICAgICogQHNpZyBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIHRyaW0uXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUcmltbWVkIHZlcnNpb24gb2YgYHN0cmAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50cmltKCcgICB4eXogICcpOyAvLz0+ICd4eXonXG4gICAgICogICAgICBSLm1hcChSLnRyaW0sIFIuc3BsaXQoJywnLCAneCwgeSwgeicpKTsgLy89PiBbJ3gnLCAneScsICd6J11cbiAgICAgKi9cbiAgICB2YXIgdHJpbSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHdzID0gJ1xcdFxcblxceDBCXFxmXFxyIFxceEEwXFx1MTY4MFxcdTE4MEVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzJyArICdcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBBXFx1MjAyRlxcdTIwNUZcXHUzMDAwXFx1MjAyOCcgKyAnXFx1MjAyOVxcdUZFRkYnO1xuICAgICAgICB2YXIgemVyb1dpZHRoID0gJ1xcdTIwMEInO1xuICAgICAgICB2YXIgaGFzUHJvdG9UcmltID0gdHlwZW9mIFN0cmluZy5wcm90b3R5cGUudHJpbSA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgICAgaWYgKCFoYXNQcm90b1RyaW0gfHwgKHdzLnRyaW0oKSB8fCAhemVyb1dpZHRoLnRyaW0oKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBfY3VycnkxKGZ1bmN0aW9uIHRyaW0oc3RyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJlZ2luUnggPSBuZXcgUmVnRXhwKCdeWycgKyB3cyArICddWycgKyB3cyArICddKicpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRSeCA9IG5ldyBSZWdFeHAoJ1snICsgd3MgKyAnXVsnICsgd3MgKyAnXSokJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKGJlZ2luUngsICcnKS5yZXBsYWNlKGVuZFJ4LCAnJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfY3VycnkxKGZ1bmN0aW9uIHRyaW0oc3RyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ci50cmltKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIGB0cnlDYXRjaGAgdGFrZXMgdHdvIGZ1bmN0aW9ucywgYSBgdHJ5ZXJgIGFuZCBhIGBjYXRjaGVyYC4gVGhlIHJldHVybmVkXG4gICAgICogZnVuY3Rpb24gZXZhbHVhdGVzIHRoZSBgdHJ5ZXJgOyBpZiBpdCBkb2VzIG5vdCB0aHJvdywgaXQgc2ltcGx5IHJldHVybnMgdGhlXG4gICAgICogcmVzdWx0LiBJZiB0aGUgYHRyeWVyYCAqZG9lcyogdGhyb3csIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlXG4gICAgICogYGNhdGNoZXJgIGZ1bmN0aW9uIGFuZCByZXR1cm5zIGl0cyByZXN1bHQuIE5vdGUgdGhhdCBmb3IgZWZmZWN0aXZlXG4gICAgICogY29tcG9zaXRpb24gd2l0aCB0aGlzIGZ1bmN0aW9uLCBib3RoIHRoZSBgdHJ5ZXJgIGFuZCBgY2F0Y2hlcmAgZnVuY3Rpb25zXG4gICAgICogbXVzdCByZXR1cm4gdGhlIHNhbWUgdHlwZSBvZiByZXN1bHRzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yMC4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoLi4ueCAtPiBhKSAtPiAoKGUsIC4uLngpIC0+IGEpIC0+ICguLi54IC0+IGEpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gdHJ5ZXIgVGhlIGZ1bmN0aW9uIHRoYXQgbWF5IHRocm93LlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhdGNoZXIgVGhlIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBldmFsdWF0ZWQgaWYgYHRyeWVyYCB0aHJvd3MuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHRoYXQgd2lsbCBjYXRjaCBleGNlcHRpb25zIGFuZCBzZW5kIHRoZW4gdG8gdGhlIGNhdGNoZXIuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50cnlDYXRjaChSLnByb3AoJ3gnKSwgUi5GLCB7eDogdHJ1ZX0pOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIudHJ5Q2F0Y2goUi5wcm9wKCd4JyksIFIuRiwgbnVsbCk7ICAgICAgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciB0cnlDYXRjaCA9IF9jdXJyeTIoZnVuY3Rpb24gX3RyeUNhdGNoKHRyeWVyLCBjYXRjaGVyKSB7XG4gICAgICAgIHJldHVybiBfYXJpdHkodHJ5ZXIubGVuZ3RoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnllci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXRjaGVyLmFwcGx5KHRoaXMsIF9jb25jYXQoW2VdLCBhcmd1bWVudHMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBHaXZlcyBhIHNpbmdsZS13b3JkIHN0cmluZyBkZXNjcmlwdGlvbiBvZiB0aGUgKG5hdGl2ZSkgdHlwZSBvZiBhIHZhbHVlLFxuICAgICAqIHJldHVybmluZyBzdWNoIGFuc3dlcnMgYXMgJ09iamVjdCcsICdOdW1iZXInLCAnQXJyYXknLCBvciAnTnVsbCcuIERvZXMgbm90XG4gICAgICogYXR0ZW1wdCB0byBkaXN0aW5ndWlzaCB1c2VyIE9iamVjdCB0eXBlcyBhbnkgZnVydGhlciwgcmVwb3J0aW5nIHRoZW0gYWxsIGFzXG4gICAgICogJ09iamVjdCcuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjguMFxuICAgICAqIEBjYXRlZ29yeSBUeXBlXG4gICAgICogQHNpZyAoKiAtPiB7Kn0pIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7Kn0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudHlwZSh7fSk7IC8vPT4gXCJPYmplY3RcIlxuICAgICAqICAgICAgUi50eXBlKDEpOyAvLz0+IFwiTnVtYmVyXCJcbiAgICAgKiAgICAgIFIudHlwZShmYWxzZSk7IC8vPT4gXCJCb29sZWFuXCJcbiAgICAgKiAgICAgIFIudHlwZSgncycpOyAvLz0+IFwiU3RyaW5nXCJcbiAgICAgKiAgICAgIFIudHlwZShudWxsKTsgLy89PiBcIk51bGxcIlxuICAgICAqICAgICAgUi50eXBlKFtdKTsgLy89PiBcIkFycmF5XCJcbiAgICAgKiAgICAgIFIudHlwZSgvW0Etel0vKTsgLy89PiBcIlJlZ0V4cFwiXG4gICAgICovXG4gICAgdmFyIHR5cGUgPSBfY3VycnkxKGZ1bmN0aW9uIHR5cGUodmFsKSB7XG4gICAgICAgIHJldHVybiB2YWwgPT09IG51bGwgPyAnTnVsbCcgOiB2YWwgPT09IHVuZGVmaW5lZCA/ICdVbmRlZmluZWQnIDogT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbCkuc2xpY2UoOCwgLTEpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBmdW5jdGlvbiBgZm5gLCB3aGljaCB0YWtlcyBhIHNpbmdsZSBhcnJheSBhcmd1bWVudCwgYW5kIHJldHVybnMgYVxuICAgICAqIGZ1bmN0aW9uIHdoaWNoOlxuICAgICAqXG4gICAgICogICAtIHRha2VzIGFueSBudW1iZXIgb2YgcG9zaXRpb25hbCBhcmd1bWVudHM7XG4gICAgICogICAtIHBhc3NlcyB0aGVzZSBhcmd1bWVudHMgdG8gYGZuYCBhcyBhbiBhcnJheTsgYW5kXG4gICAgICogICAtIHJldHVybnMgdGhlIHJlc3VsdC5cbiAgICAgKlxuICAgICAqIEluIG90aGVyIHdvcmRzLCBSLnVuYXBwbHkgZGVyaXZlcyBhIHZhcmlhZGljIGZ1bmN0aW9uIGZyb20gYSBmdW5jdGlvbiB3aGljaFxuICAgICAqIHRha2VzIGFuIGFycmF5LiBSLnVuYXBwbHkgaXMgdGhlIGludmVyc2Ugb2YgUi5hcHBseS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOC4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoWyouLi5dIC0+IGEpIC0+ICgqLi4uIC0+IGEpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIuYXBwbHlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnVuYXBwbHkoSlNPTi5zdHJpbmdpZnkpKDEsIDIsIDMpOyAvLz0+ICdbMSwyLDNdJ1xuICAgICAqL1xuICAgIHZhciB1bmFwcGx5ID0gX2N1cnJ5MShmdW5jdGlvbiB1bmFwcGx5KGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oX3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYSBmdW5jdGlvbiBvZiBhbnkgYXJpdHkgKGluY2x1ZGluZyBudWxsYXJ5KSBpbiBhIGZ1bmN0aW9uIHRoYXQgYWNjZXB0c1xuICAgICAqIGV4YWN0bHkgMSBwYXJhbWV0ZXIuIEFueSBleHRyYW5lb3VzIHBhcmFtZXRlcnMgd2lsbCBub3QgYmUgcGFzc2VkIHRvIHRoZVxuICAgICAqIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgqIC0+IGIpIC0+IChhIC0+IGIpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHdyYXBwaW5nIGBmbmAuIFRoZSBuZXcgZnVuY3Rpb24gaXMgZ3VhcmFudGVlZCB0byBiZSBvZlxuICAgICAqICAgICAgICAgYXJpdHkgMS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgdGFrZXNUd29BcmdzID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAqICAgICAgICByZXR1cm4gW2EsIGJdO1xuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIHRha2VzVHdvQXJncy5sZW5ndGg7IC8vPT4gMlxuICAgICAqICAgICAgdGFrZXNUd29BcmdzKDEsIDIpOyAvLz0+IFsxLCAyXVxuICAgICAqXG4gICAgICogICAgICB2YXIgdGFrZXNPbmVBcmcgPSBSLnVuYXJ5KHRha2VzVHdvQXJncyk7XG4gICAgICogICAgICB0YWtlc09uZUFyZy5sZW5ndGg7IC8vPT4gMVxuICAgICAqICAgICAgLy8gT25seSAxIGFyZ3VtZW50IGlzIHBhc3NlZCB0byB0aGUgd3JhcHBlZCBmdW5jdGlvblxuICAgICAqICAgICAgdGFrZXNPbmVBcmcoMSwgMik7IC8vPT4gWzEsIHVuZGVmaW5lZF1cbiAgICAgKi9cbiAgICB2YXIgdW5hcnkgPSBfY3VycnkxKGZ1bmN0aW9uIHVuYXJ5KGZuKSB7XG4gICAgICAgIHJldHVybiBuQXJ5KDEsIGZuKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiBvZiBhcml0eSBgbmAgZnJvbSBhIChtYW51YWxseSkgY3VycmllZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgTnVtYmVyIC0+IChhIC0+IGIpIC0+IChhIC0+IGMpXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCBUaGUgYXJpdHkgZm9yIHRoZSByZXR1cm5lZCBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gdW5jdXJyeS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24uXG4gICAgICogQHNlZSBSLmN1cnJ5XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGFkZEZvdXIgPSBhID0+IGIgPT4gYyA9PiBkID0+IGEgKyBiICsgYyArIGQ7XG4gICAgICpcbiAgICAgKiAgICAgIHZhciB1bmN1cnJpZWRBZGRGb3VyID0gUi51bmN1cnJ5Tig0LCBhZGRGb3VyKTtcbiAgICAgKiAgICAgIHVuY3VycmllZEFkZEZvdXIoMSwgMiwgMywgNCk7IC8vPT4gMTBcbiAgICAgKi9cbiAgICB2YXIgdW5jdXJyeU4gPSBfY3VycnkyKGZ1bmN0aW9uIHVuY3VycnlOKGRlcHRoLCBmbikge1xuICAgICAgICByZXR1cm4gY3VycnlOKGRlcHRoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudERlcHRoID0gMTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuO1xuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB2YXIgZW5kSWR4O1xuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnREZXB0aCA8PSBkZXB0aCAmJiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBlbmRJZHggPSBjdXJyZW50RGVwdGggPT09IGRlcHRoID8gYXJndW1lbnRzLmxlbmd0aCA6IGlkeCArIHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmFwcGx5KHRoaXMsIF9zbGljZShhcmd1bWVudHMsIGlkeCwgZW5kSWR4KSk7XG4gICAgICAgICAgICAgICAgY3VycmVudERlcHRoICs9IDE7XG4gICAgICAgICAgICAgICAgaWR4ID0gZW5kSWR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhIGxpc3QgZnJvbSBhIHNlZWQgdmFsdWUuIEFjY2VwdHMgYW4gaXRlcmF0b3IgZnVuY3Rpb24sIHdoaWNoIHJldHVybnNcbiAgICAgKiBlaXRoZXIgZmFsc2UgdG8gc3RvcCBpdGVyYXRpb24gb3IgYW4gYXJyYXkgb2YgbGVuZ3RoIDIgY29udGFpbmluZyB0aGUgdmFsdWVcbiAgICAgKiB0byBhZGQgdG8gdGhlIHJlc3VsdGluZyBsaXN0IGFuZCB0aGUgc2VlZCB0byBiZSB1c2VkIGluIHRoZSBuZXh0IGNhbGwgdG8gdGhlXG4gICAgICogaXRlcmF0b3IgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24gcmVjZWl2ZXMgb25lIGFyZ3VtZW50OiAqKHNlZWQpKi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBbYl0pIC0+ICogLT4gW2JdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uLiByZWNlaXZlcyBvbmUgYXJndW1lbnQsIGBzZWVkYCwgYW5kIHJldHVybnNcbiAgICAgKiAgICAgICAgZWl0aGVyIGZhbHNlIHRvIHF1aXQgaXRlcmF0aW9uIG9yIGFuIGFycmF5IG9mIGxlbmd0aCB0d28gdG8gcHJvY2VlZC4gVGhlIGVsZW1lbnRcbiAgICAgKiAgICAgICAgYXQgaW5kZXggMCBvZiB0aGlzIGFycmF5IHdpbGwgYmUgYWRkZWQgdG8gdGhlIHJlc3VsdGluZyBhcnJheSwgYW5kIHRoZSBlbGVtZW50XG4gICAgICogICAgICAgIGF0IGluZGV4IDEgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIG5leHQgY2FsbCB0byBgZm5gLlxuICAgICAqIEBwYXJhbSB7Kn0gc2VlZCBUaGUgc2VlZCB2YWx1ZS5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGZpbmFsIGxpc3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGYgPSBuID0+IG4gPiA1MCA/IGZhbHNlIDogWy1uLCBuICsgMTBdO1xuICAgICAqICAgICAgUi51bmZvbGQoZiwgMTApOyAvLz0+IFstMTAsIC0yMCwgLTMwLCAtNDAsIC01MF1cbiAgICAgKi9cbiAgICB2YXIgdW5mb2xkID0gX2N1cnJ5MihmdW5jdGlvbiB1bmZvbGQoZm4sIHNlZWQpIHtcbiAgICAgICAgdmFyIHBhaXIgPSBmbihzZWVkKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB3aGlsZSAocGFpciAmJiBwYWlyLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gcGFpclswXTtcbiAgICAgICAgICAgIHBhaXIgPSBmbihwYWlyWzFdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnRhaW5pbmcgb25seSBvbmUgY29weSBvZiBlYWNoIGVsZW1lbnQgaW4gdGhlIG9yaWdpbmFsXG4gICAgICogbGlzdCwgYmFzZWQgdXBvbiB0aGUgdmFsdWUgcmV0dXJuZWQgYnkgYXBwbHlpbmcgdGhlIHN1cHBsaWVkIHByZWRpY2F0ZSB0b1xuICAgICAqIHR3byBsaXN0IGVsZW1lbnRzLiBQcmVmZXJzIHRoZSBmaXJzdCBpdGVtIGlmIHR3byBpdGVtcyBjb21wYXJlIGVxdWFsIGJhc2VkXG4gICAgICogb24gdGhlIHByZWRpY2F0ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhLCBhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIEEgcHJlZGljYXRlIHVzZWQgdG8gdGVzdCB3aGV0aGVyIHR3byBpdGVtcyBhcmUgZXF1YWwuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBsaXN0IG9mIHVuaXF1ZSBpdGVtcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgc3RyRXEgPSBSLmVxQnkoU3RyaW5nKTtcbiAgICAgKiAgICAgIFIudW5pcVdpdGgoc3RyRXEpKFsxLCAnMScsIDIsIDFdKTsgLy89PiBbMSwgMl1cbiAgICAgKiAgICAgIFIudW5pcVdpdGgoc3RyRXEpKFt7fSwge31dKTsgICAgICAgLy89PiBbe31dXG4gICAgICogICAgICBSLnVuaXFXaXRoKHN0ckVxKShbMSwgJzEnLCAxXSk7ICAgIC8vPT4gWzFdXG4gICAgICogICAgICBSLnVuaXFXaXRoKHN0ckVxKShbJzEnLCAxLCAxXSk7ICAgIC8vPT4gWycxJ11cbiAgICAgKi9cbiAgICB2YXIgdW5pcVdpdGggPSBfY3VycnkyKGZ1bmN0aW9uIHVuaXFXaXRoKHByZWQsIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaWR4XTtcbiAgICAgICAgICAgIGlmICghX2NvbnRhaW5zV2l0aChwcmVkLCBpdGVtLCByZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB0aGUgZmluYWwgYXJndW1lbnQgYnkgcGFzc2luZyBpdCB0byB0aGUgZ2l2ZW4gcHJlZGljYXRlIGZ1bmN0aW9uLiBJZlxuICAgICAqIHRoZSBwcmVkaWNhdGUgaXMgbm90IHNhdGlzZmllZCwgdGhlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSByZXN1bHQgb2ZcbiAgICAgKiBjYWxsaW5nIHRoZSBgd2hlbkZhbHNlRm5gIGZ1bmN0aW9uIHdpdGggdGhlIHNhbWUgYXJndW1lbnQuIElmIHRoZSBwcmVkaWNhdGVcbiAgICAgKiBpcyBzYXRpc2ZpZWQsIHRoZSBhcmd1bWVudCBpcyByZXR1cm5lZCBhcyBpcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTguMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gKGEgLT4gYSkgLT4gYSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCAgICAgICAgQSBwcmVkaWNhdGUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSB3aGVuRmFsc2VGbiBBIGZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBgcHJlZGAgZXZhbHVhdGVzXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gYSBmYWxzeSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0geyp9ICAgICAgICB4ICAgICAgICAgICBBbiBvYmplY3QgdG8gdGVzdCB3aXRoIHRoZSBgcHJlZGAgZnVuY3Rpb24gYW5kXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzcyB0byBgd2hlbkZhbHNlRm5gIGlmIG5lY2Vzc2FyeS5cbiAgICAgKiBAcmV0dXJuIHsqfSBFaXRoZXIgYHhgIG9yIHRoZSByZXN1bHQgb2YgYXBwbHlpbmcgYHhgIHRvIGB3aGVuRmFsc2VGbmAuXG4gICAgICogQHNlZSBSLmlmRWxzZSwgUi53aGVuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gY29lcmNlQXJyYXkgOjogKGF8W2FdKSAtPiBbYV1cbiAgICAgKiAgICAgIHZhciBjb2VyY2VBcnJheSA9IFIudW5sZXNzKFIuaXNBcnJheUxpa2UsIFIub2YpO1xuICAgICAqICAgICAgY29lcmNlQXJyYXkoWzEsIDIsIDNdKTsgLy89PiBbMSwgMiwgM11cbiAgICAgKiAgICAgIGNvZXJjZUFycmF5KDEpOyAgICAgICAgIC8vPT4gWzFdXG4gICAgICovXG4gICAgdmFyIHVubGVzcyA9IF9jdXJyeTMoZnVuY3Rpb24gdW5sZXNzKHByZWQsIHdoZW5GYWxzZUZuLCB4KSB7XG4gICAgICAgIHJldHVybiBwcmVkKHgpID8geCA6IHdoZW5GYWxzZUZuKHgpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBwcmVkaWNhdGUsIGEgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb24sIGFuZCBhbiBpbml0aWFsIHZhbHVlLFxuICAgICAqIGFuZCByZXR1cm5zIGEgdmFsdWUgb2YgdGhlIHNhbWUgdHlwZSBhcyB0aGUgaW5pdGlhbCB2YWx1ZS5cbiAgICAgKiBJdCBkb2VzIHNvIGJ5IGFwcGx5aW5nIHRoZSB0cmFuc2Zvcm1hdGlvbiB1bnRpbCB0aGUgcHJlZGljYXRlIGlzIHNhdGlzZmllZCxcbiAgICAgKiBhdCB3aGljaCBwb2ludCBpdCByZXR1cm5zIHRoZSBzYXRpc2ZhY3RvcnkgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIwLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IChhIC0+IGEpIC0+IGEgLT4gYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgQSBwcmVkaWNhdGUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0geyp9IGluaXQgSW5pdGlhbCB2YWx1ZVxuICAgICAqIEByZXR1cm4geyp9IEZpbmFsIHZhbHVlIHRoYXQgc2F0aXNmaWVzIHByZWRpY2F0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudW50aWwoUi5ndChSLl9fLCAxMDApLCBSLm11bHRpcGx5KDIpKSgxKSAvLyA9PiAxMjhcbiAgICAgKi9cbiAgICB2YXIgdW50aWwgPSBfY3VycnkzKGZ1bmN0aW9uIHVudGlsKHByZWQsIGZuLCBpbml0KSB7XG4gICAgICAgIHZhciB2YWwgPSBpbml0O1xuICAgICAgICB3aGlsZSAoIXByZWQodmFsKSkge1xuICAgICAgICAgICAgdmFsID0gZm4odmFsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBjb3B5IG9mIHRoZSBhcnJheSB3aXRoIHRoZSBlbGVtZW50IGF0IHRoZSBwcm92aWRlZCBpbmRleFxuICAgICAqIHJlcGxhY2VkIHdpdGggdGhlIGdpdmVuIHZhbHVlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNC4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBhIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IFRoZSBpbmRleCB0byB1cGRhdGUuXG4gICAgICogQHBhcmFtIHsqfSB4IFRoZSB2YWx1ZSB0byBleGlzdCBhdCB0aGUgZ2l2ZW4gaW5kZXggb2YgdGhlIHJldHVybmVkIGFycmF5LlxuICAgICAqIEBwYXJhbSB7QXJyYXl8QXJndW1lbnRzfSBsaXN0IFRoZSBzb3VyY2UgYXJyYXktbGlrZSBvYmplY3QgdG8gYmUgdXBkYXRlZC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBjb3B5IG9mIGBsaXN0YCB3aXRoIHRoZSB2YWx1ZSBhdCBpbmRleCBgaWR4YCByZXBsYWNlZCB3aXRoIGB4YC5cbiAgICAgKiBAc2VlIFIuYWRqdXN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi51cGRhdGUoMSwgMTEsIFswLCAxLCAyXSk7ICAgICAvLz0+IFswLCAxMSwgMl1cbiAgICAgKiAgICAgIFIudXBkYXRlKDEpKDExKShbMCwgMSwgMl0pOyAgICAgLy89PiBbMCwgMTEsIDJdXG4gICAgICovXG4gICAgdmFyIHVwZGF0ZSA9IF9jdXJyeTMoZnVuY3Rpb24gdXBkYXRlKGlkeCwgeCwgbGlzdCkge1xuICAgICAgICByZXR1cm4gYWRqdXN0KGFsd2F5cyh4KSwgaWR4LCBsaXN0KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEFjY2VwdHMgYSBmdW5jdGlvbiBgZm5gIGFuZCBhIGxpc3Qgb2YgdHJhbnNmb3JtZXIgZnVuY3Rpb25zIGFuZCByZXR1cm5zIGFcbiAgICAgKiBuZXcgY3VycmllZCBmdW5jdGlvbi4gV2hlbiB0aGUgbmV3IGZ1bmN0aW9uIGlzIGludm9rZWQsIGl0IGNhbGxzIHRoZVxuICAgICAqIGZ1bmN0aW9uIGBmbmAgd2l0aCBwYXJhbWV0ZXJzIGNvbnNpc3Rpbmcgb2YgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGVhY2hcbiAgICAgKiBzdXBwbGllZCBoYW5kbGVyIG9uIHN1Y2Nlc3NpdmUgYXJndW1lbnRzIHRvIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBJZiBtb3JlIGFyZ3VtZW50cyBhcmUgcGFzc2VkIHRvIHRoZSByZXR1cm5lZCBmdW5jdGlvbiB0aGFuIHRyYW5zZm9ybWVyXG4gICAgICogZnVuY3Rpb25zLCB0aG9zZSBhcmd1bWVudHMgYXJlIHBhc3NlZCBkaXJlY3RseSB0byBgZm5gIGFzIGFkZGl0aW9uYWxcbiAgICAgKiBwYXJhbWV0ZXJzLiBJZiB5b3UgZXhwZWN0IGFkZGl0aW9uYWwgYXJndW1lbnRzIHRoYXQgZG9uJ3QgbmVlZCB0byBiZVxuICAgICAqIHRyYW5zZm9ybWVkLCBhbHRob3VnaCB5b3UgY2FuIGlnbm9yZSB0aGVtLCBpdCdzIGJlc3QgdG8gcGFzcyBhbiBpZGVudGl0eVxuICAgICAqIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIG5ldyBmdW5jdGlvbiByZXBvcnRzIHRoZSBjb3JyZWN0IGFyaXR5LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICh4MSAtPiB4MiAtPiAuLi4gLT4geikgLT4gWyhhIC0+IHgxKSwgKGIgLT4geDIpLCAuLi5dIC0+IChhIC0+IGIgLT4gLi4uIC0+IHopXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gICAgICogQHBhcmFtIHtBcnJheX0gdHJhbnNmb3JtZXJzIEEgbGlzdCBvZiB0cmFuc2Zvcm1lciBmdW5jdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHdyYXBwZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi51c2VXaXRoKE1hdGgucG93LCBbUi5pZGVudGl0eSwgUi5pZGVudGl0eV0pKDMsIDQpOyAvLz0+IDgxXG4gICAgICogICAgICBSLnVzZVdpdGgoTWF0aC5wb3csIFtSLmlkZW50aXR5LCBSLmlkZW50aXR5XSkoMykoNCk7IC8vPT4gODFcbiAgICAgKiAgICAgIFIudXNlV2l0aChNYXRoLnBvdywgW1IuZGVjLCBSLmluY10pKDMsIDQpOyAvLz0+IDMyXG4gICAgICogICAgICBSLnVzZVdpdGgoTWF0aC5wb3csIFtSLmRlYywgUi5pbmNdKSgzKSg0KTsgLy89PiAzMlxuICAgICAqL1xuICAgIHZhciB1c2VXaXRoID0gX2N1cnJ5MihmdW5jdGlvbiB1c2VXaXRoKGZuLCB0cmFuc2Zvcm1lcnMpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5Tih0cmFuc2Zvcm1lcnMubGVuZ3RoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaWR4IDwgdHJhbnNmb3JtZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh0cmFuc2Zvcm1lcnNbaWR4XS5jYWxsKHRoaXMsIGFyZ3VtZW50c1tpZHhdKSk7XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncy5jb25jYXQoX3NsaWNlKGFyZ3VtZW50cywgdHJhbnNmb3JtZXJzLmxlbmd0aCkpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIGVudW1lcmFibGUgb3duIHByb3BlcnRpZXMgb2YgdGhlIHN1cHBsaWVkIG9iamVjdC5cbiAgICAgKiBOb3RlIHRoYXQgdGhlIG9yZGVyIG9mIHRoZSBvdXRwdXQgYXJyYXkgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzIGRpZmZlcmVudFxuICAgICAqIEpTIHBsYXRmb3Jtcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge2s6IHZ9IC0+IFt2XVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBleHRyYWN0IHZhbHVlcyBmcm9tXG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIHRoZSB2YWx1ZXMgb2YgdGhlIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudmFsdWVzKHthOiAxLCBiOiAyLCBjOiAzfSk7IC8vPT4gWzEsIDIsIDNdXG4gICAgICovXG4gICAgdmFyIHZhbHVlcyA9IF9jdXJyeTEoZnVuY3Rpb24gdmFsdWVzKG9iaikge1xuICAgICAgICB2YXIgcHJvcHMgPSBrZXlzKG9iaik7XG4gICAgICAgIHZhciBsZW4gPSBwcm9wcy5sZW5ndGg7XG4gICAgICAgIHZhciB2YWxzID0gW107XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICB2YWxzW2lkeF0gPSBvYmpbcHJvcHNbaWR4XV07XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFscztcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgcHJvcGVydGllcywgaW5jbHVkaW5nIHByb3RvdHlwZSBwcm9wZXJ0aWVzLCBvZiB0aGVcbiAgICAgKiBzdXBwbGllZCBvYmplY3QuXG4gICAgICogTm90ZSB0aGF0IHRoZSBvcmRlciBvZiB0aGUgb3V0cHV0IGFycmF5IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGNvbnNpc3RlbnRcbiAgICAgKiBhY3Jvc3MgZGlmZmVyZW50IEpTIHBsYXRmb3Jtcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge2s6IHZ9IC0+IFt2XVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBleHRyYWN0IHZhbHVlcyBmcm9tXG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIHRoZSB2YWx1ZXMgb2YgdGhlIG9iamVjdCdzIG93biBhbmQgcHJvdG90eXBlIHByb3BlcnRpZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIEYgPSBmdW5jdGlvbigpIHsgdGhpcy54ID0gJ1gnOyB9O1xuICAgICAqICAgICAgRi5wcm90b3R5cGUueSA9ICdZJztcbiAgICAgKiAgICAgIHZhciBmID0gbmV3IEYoKTtcbiAgICAgKiAgICAgIFIudmFsdWVzSW4oZik7IC8vPT4gWydYJywgJ1knXVxuICAgICAqL1xuICAgIHZhciB2YWx1ZXNJbiA9IF9jdXJyeTEoZnVuY3Rpb24gdmFsdWVzSW4ob2JqKSB7XG4gICAgICAgIHZhciBwcm9wO1xuICAgICAgICB2YXIgdnMgPSBbXTtcbiAgICAgICAgZm9yIChwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgdnNbdnMubGVuZ3RoXSA9IG9ialtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdnM7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgXCJ2aWV3XCIgb2YgdGhlIGdpdmVuIGRhdGEgc3RydWN0dXJlLCBkZXRlcm1pbmVkIGJ5IHRoZSBnaXZlbiBsZW5zLlxuICAgICAqIFRoZSBsZW5zJ3MgZm9jdXMgZGV0ZXJtaW5lcyB3aGljaCBwb3J0aW9uIG9mIHRoZSBkYXRhIHN0cnVjdHVyZSBpcyB2aXNpYmxlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEB0eXBlZGVmbiBMZW5zIHMgYSA9IEZ1bmN0b3IgZiA9PiAoYSAtPiBmIGEpIC0+IHMgLT4gZiBzXG4gICAgICogQHNpZyBMZW5zIHMgYSAtPiBzIC0+IGFcbiAgICAgKiBAcGFyYW0ge0xlbnN9IGxlbnNcbiAgICAgKiBAcGFyYW0geyp9IHhcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5wcm9wLCBSLmxlbnNJbmRleCwgUi5sZW5zUHJvcFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB4TGVucyA9IFIubGVuc1Byb3AoJ3gnKTtcbiAgICAgKlxuICAgICAqICAgICAgUi52aWV3KHhMZW5zLCB7eDogMSwgeTogMn0pOyAgLy89PiAxXG4gICAgICogICAgICBSLnZpZXcoeExlbnMsIHt4OiA0LCB5OiAyfSk7ICAvLz0+IDRcbiAgICAgKi9cbiAgICAvLyBgQ29uc3RgIGlzIGEgZnVuY3RvciB0aGF0IGVmZmVjdGl2ZWx5IGlnbm9yZXMgdGhlIGZ1bmN0aW9uIGdpdmVuIHRvIGBtYXBgLlxuICAgIC8vIFVzaW5nIGBDb25zdGAgZWZmZWN0aXZlbHkgaWdub3JlcyB0aGUgc2V0dGVyIGZ1bmN0aW9uIG9mIHRoZSBgbGVuc2AsXG4gICAgLy8gbGVhdmluZyB0aGUgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIGdldHRlciBmdW5jdGlvbiB1bm1vZGlmaWVkLlxuICAgIHZhciB2aWV3ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBgQ29uc3RgIGlzIGEgZnVuY3RvciB0aGF0IGVmZmVjdGl2ZWx5IGlnbm9yZXMgdGhlIGZ1bmN0aW9uIGdpdmVuIHRvIGBtYXBgLlxuICAgICAgICB2YXIgQ29uc3QgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogeCxcbiAgICAgICAgICAgICAgICBtYXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gdmlldyhsZW5zLCB4KSB7XG4gICAgICAgICAgICAvLyBVc2luZyBgQ29uc3RgIGVmZmVjdGl2ZWx5IGlnbm9yZXMgdGhlIHNldHRlciBmdW5jdGlvbiBvZiB0aGUgYGxlbnNgLFxuICAgICAgICAgICAgLy8gbGVhdmluZyB0aGUgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIGdldHRlciBmdW5jdGlvbiB1bm1vZGlmaWVkLlxuICAgICAgICAgICAgcmV0dXJuIGxlbnMoQ29uc3QpKHgpLnZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB0aGUgZmluYWwgYXJndW1lbnQgYnkgcGFzc2luZyBpdCB0byB0aGUgZ2l2ZW4gcHJlZGljYXRlIGZ1bmN0aW9uLiBJZlxuICAgICAqIHRoZSBwcmVkaWNhdGUgaXMgc2F0aXNmaWVkLCB0aGUgZnVuY3Rpb24gd2lsbCByZXR1cm4gdGhlIHJlc3VsdCBvZiBjYWxsaW5nXG4gICAgICogdGhlIGB3aGVuVHJ1ZUZuYCBmdW5jdGlvbiB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50LiBJZiB0aGUgcHJlZGljYXRlIGlzIG5vdFxuICAgICAqIHNhdGlzZmllZCwgdGhlIGFyZ3VtZW50IGlzIHJldHVybmVkIGFzIGlzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOC4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiAoYSAtPiBhKSAtPiBhIC0+IGFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkICAgICAgIEEgcHJlZGljYXRlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gd2hlblRydWVGbiBBIGZ1bmN0aW9uIHRvIGludm9rZSB3aGVuIHRoZSBgY29uZGl0aW9uYFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZhbHVhdGVzIHRvIGEgdHJ1dGh5IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7Kn0gICAgICAgIHggICAgICAgICAgQW4gb2JqZWN0IHRvIHRlc3Qgd2l0aCB0aGUgYHByZWRgIGZ1bmN0aW9uIGFuZFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzcyB0byBgd2hlblRydWVGbmAgaWYgbmVjZXNzYXJ5LlxuICAgICAqIEByZXR1cm4geyp9IEVpdGhlciBgeGAgb3IgdGhlIHJlc3VsdCBvZiBhcHBseWluZyBgeGAgdG8gYHdoZW5UcnVlRm5gLlxuICAgICAqIEBzZWUgUi5pZkVsc2UsIFIudW5sZXNzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gdHJ1bmNhdGUgOjogU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqICAgICAgdmFyIHRydW5jYXRlID0gUi53aGVuKFxuICAgICAqICAgICAgICBSLnByb3BTYXRpc2ZpZXMoUi5ndChSLl9fLCAxMCksICdsZW5ndGgnKSxcbiAgICAgKiAgICAgICAgUi5waXBlKFIudGFrZSgxMCksIFIuYXBwZW5kKCfigKYnKSwgUi5qb2luKCcnKSlcbiAgICAgKiAgICAgICk7XG4gICAgICogICAgICB0cnVuY2F0ZSgnMTIzNDUnKTsgICAgICAgICAvLz0+ICcxMjM0NSdcbiAgICAgKiAgICAgIHRydW5jYXRlKCcwMTIzNDU2Nzg5QUJDJyk7IC8vPT4gJzAxMjM0NTY3ODnigKYnXG4gICAgICovXG4gICAgdmFyIHdoZW4gPSBfY3VycnkzKGZ1bmN0aW9uIHdoZW4ocHJlZCwgd2hlblRydWVGbiwgeCkge1xuICAgICAgICByZXR1cm4gcHJlZCh4KSA/IHdoZW5UcnVlRm4oeCkgOiB4O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBzcGVjIG9iamVjdCBhbmQgYSB0ZXN0IG9iamVjdDsgcmV0dXJucyB0cnVlIGlmIHRoZSB0ZXN0IHNhdGlzZmllc1xuICAgICAqIHRoZSBzcGVjLiBFYWNoIG9mIHRoZSBzcGVjJ3Mgb3duIHByb3BlcnRpZXMgbXVzdCBiZSBhIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICAgKiBFYWNoIHByZWRpY2F0ZSBpcyBhcHBsaWVkIHRvIHRoZSB2YWx1ZSBvZiB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBvZiB0aGVcbiAgICAgKiB0ZXN0IG9iamVjdC4gYHdoZXJlYCByZXR1cm5zIHRydWUgaWYgYWxsIHRoZSBwcmVkaWNhdGVzIHJldHVybiB0cnVlLCBmYWxzZVxuICAgICAqIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIGB3aGVyZWAgaXMgd2VsbCBzdWl0ZWQgdG8gZGVjbGFyYXRpdmVseSBleHByZXNzaW5nIGNvbnN0cmFpbnRzIGZvciBvdGhlclxuICAgICAqIGZ1bmN0aW9ucyBzdWNoIGFzIGBmaWx0ZXJgIGFuZCBgZmluZGAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMVxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtTdHJpbmc6ICgqIC0+IEJvb2xlYW4pfSAtPiB7U3RyaW5nOiAqfSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNwZWNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gdGVzdE9ialxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gcHJlZCA6OiBPYmplY3QgLT4gQm9vbGVhblxuICAgICAqICAgICAgdmFyIHByZWQgPSBSLndoZXJlKHtcbiAgICAgKiAgICAgICAgYTogUi5lcXVhbHMoJ2ZvbycpLFxuICAgICAqICAgICAgICBiOiBSLmNvbXBsZW1lbnQoUi5lcXVhbHMoJ2JhcicpKSxcbiAgICAgKiAgICAgICAgeDogUi5ndChfLCAxMCksXG4gICAgICogICAgICAgIHk6IFIubHQoXywgMjApXG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqICAgICAgcHJlZCh7YTogJ2ZvbycsIGI6ICd4eHgnLCB4OiAxMSwgeTogMTl9KTsgLy89PiB0cnVlXG4gICAgICogICAgICBwcmVkKHthOiAneHh4JywgYjogJ3h4eCcsIHg6IDExLCB5OiAxOX0pOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBwcmVkKHthOiAnZm9vJywgYjogJ2JhcicsIHg6IDExLCB5OiAxOX0pOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBwcmVkKHthOiAnZm9vJywgYjogJ3h4eCcsIHg6IDEwLCB5OiAxOX0pOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBwcmVkKHthOiAnZm9vJywgYjogJ3h4eCcsIHg6IDExLCB5OiAyMH0pOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIHdoZXJlID0gX2N1cnJ5MihmdW5jdGlvbiB3aGVyZShzcGVjLCB0ZXN0T2JqKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc3BlYykge1xuICAgICAgICAgICAgaWYgKF9oYXMocHJvcCwgc3BlYykgJiYgIXNwZWNbcHJvcF0odGVzdE9ialtwcm9wXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBXcmFwIGEgZnVuY3Rpb24gaW5zaWRlIGFub3RoZXIgdG8gYWxsb3cgeW91IHRvIG1ha2UgYWRqdXN0bWVudHMgdG8gdGhlXG4gICAgICogcGFyYW1ldGVycywgb3IgZG8gb3RoZXIgcHJvY2Vzc2luZyBlaXRoZXIgYmVmb3JlIHRoZSBpbnRlcm5hbCBmdW5jdGlvbiBpc1xuICAgICAqIGNhbGxlZCBvciB3aXRoIGl0cyByZXN1bHRzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIChhLi4uIC0+IGIpIC0+ICgoYS4uLiAtPiBiKSAtPiBhLi4uIC0+IGMpIC0+IChhLi4uIC0+IGMpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gd3JhcHBlciBUaGUgd3JhcHBlciBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHdyYXBwZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGdyZWV0ID0gbmFtZSA9PiAnSGVsbG8gJyArIG5hbWU7XG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzaG91dGVkR3JlZXQgPSBSLndyYXAoZ3JlZXQsIChnciwgbmFtZSkgPT4gZ3IobmFtZSkudG9VcHBlckNhc2UoKSk7XG4gICAgICpcbiAgICAgKiAgICAgIHNob3V0ZWRHcmVldChcIkthdGh5XCIpOyAvLz0+IFwiSEVMTE8gS0FUSFlcIlxuICAgICAqXG4gICAgICogICAgICB2YXIgc2hvcnRlbmVkR3JlZXQgPSBSLndyYXAoZ3JlZXQsIGZ1bmN0aW9uKGdyLCBuYW1lKSB7XG4gICAgICogICAgICAgIHJldHVybiBncihuYW1lLnN1YnN0cmluZygwLCAzKSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKiAgICAgIHNob3J0ZW5lZEdyZWV0KFwiUm9iZXJ0XCIpOyAvLz0+IFwiSGVsbG8gUm9iXCJcbiAgICAgKi9cbiAgICB2YXIgd3JhcCA9IF9jdXJyeTIoZnVuY3Rpb24gd3JhcChmbiwgd3JhcHBlcikge1xuICAgICAgICByZXR1cm4gY3VycnlOKGZuLmxlbmd0aCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwbHkodGhpcywgX2NvbmNhdChbZm5dLCBhcmd1bWVudHMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGxpc3Qgb3V0IG9mIHRoZSB0d28gc3VwcGxpZWQgYnkgY3JlYXRpbmcgZWFjaCBwb3NzaWJsZSBwYWlyXG4gICAgICogZnJvbSB0aGUgbGlzdHMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gW2JdIC0+IFtbYSxiXV1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcyBUaGUgZmlyc3QgbGlzdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBicyBUaGUgc2Vjb25kIGxpc3QuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBsaXN0IG1hZGUgYnkgY29tYmluaW5nIGVhY2ggcG9zc2libGUgcGFpciBmcm9tXG4gICAgICogICAgICAgICBgYXNgIGFuZCBgYnNgIGludG8gcGFpcnMgKGBbYSwgYl1gKS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnhwcm9kKFsxLCAyXSwgWydhJywgJ2InXSk7IC8vPT4gW1sxLCAnYSddLCBbMSwgJ2InXSwgWzIsICdhJ10sIFsyLCAnYiddXVxuICAgICAqL1xuICAgIC8vID0geHByb2RXaXRoKHByZXBlbmQpOyAodGFrZXMgYWJvdXQgMyB0aW1lcyBhcyBsb25nLi4uKVxuICAgIHZhciB4cHJvZCA9IF9jdXJyeTIoZnVuY3Rpb24geHByb2QoYSwgYikge1xuICAgICAgICAvLyA9IHhwcm9kV2l0aChwcmVwZW5kKTsgKHRha2VzIGFib3V0IDMgdGltZXMgYXMgbG9uZy4uLilcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBpbGVuID0gYS5sZW5ndGg7XG4gICAgICAgIHZhciBqO1xuICAgICAgICB2YXIgamxlbiA9IGIubGVuZ3RoO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHdoaWxlIChpZHggPCBpbGVuKSB7XG4gICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChqIDwgamxlbikge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IFtcbiAgICAgICAgICAgICAgICAgICAgYVtpZHhdLFxuICAgICAgICAgICAgICAgICAgICBiW2pdXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBqICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBsaXN0IG91dCBvZiB0aGUgdHdvIHN1cHBsaWVkIGJ5IHBhaXJpbmcgdXAgZXF1YWxseS1wb3NpdGlvbmVkXG4gICAgICogaXRlbXMgZnJvbSBib3RoIGxpc3RzLiBUaGUgcmV0dXJuZWQgbGlzdCBpcyB0cnVuY2F0ZWQgdG8gdGhlIGxlbmd0aCBvZiB0aGVcbiAgICAgKiBzaG9ydGVyIG9mIHRoZSB0d28gaW5wdXQgbGlzdHMuXG4gICAgICogTm90ZTogYHppcGAgaXMgZXF1aXZhbGVudCB0byBgemlwV2l0aChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBbYSwgYl0gfSlgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFtiXSAtPiBbW2EsYl1dXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDEgVGhlIGZpcnN0IGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBzZWNvbmQgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBsaXN0IG1hZGUgYnkgcGFpcmluZyB1cCBzYW1lLWluZGV4ZWQgZWxlbWVudHMgb2YgYGxpc3QxYCBhbmQgYGxpc3QyYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnppcChbMSwgMiwgM10sIFsnYScsICdiJywgJ2MnXSk7IC8vPT4gW1sxLCAnYSddLCBbMiwgJ2InXSwgWzMsICdjJ11dXG4gICAgICovXG4gICAgdmFyIHppcCA9IF9jdXJyeTIoZnVuY3Rpb24gemlwKGEsIGIpIHtcbiAgICAgICAgdmFyIHJ2ID0gW107XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gTWF0aC5taW4oYS5sZW5ndGgsIGIubGVuZ3RoKTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgcnZbaWR4XSA9IFtcbiAgICAgICAgICAgICAgICBhW2lkeF0sXG4gICAgICAgICAgICAgICAgYltpZHhdXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBvYmplY3Qgb3V0IG9mIGEgbGlzdCBvZiBrZXlzIGFuZCBhIGxpc3Qgb2YgdmFsdWVzLlxuICAgICAqIEtleS92YWx1ZSBwYWlyaW5nIGlzIHRydW5jYXRlZCB0byB0aGUgbGVuZ3RoIG9mIHRoZSBzaG9ydGVyIG9mIHRoZSB0d28gbGlzdHMuXG4gICAgICogTm90ZTogYHppcE9iamAgaXMgZXF1aXZhbGVudCB0byBgcGlwZSh6aXBXaXRoKHBhaXIpLCBmcm9tUGFpcnMpYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFtTdHJpbmddIC0+IFsqXSAtPiB7U3RyaW5nOiAqfVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGtleXMgVGhlIGFycmF5IHRoYXQgd2lsbCBiZSBwcm9wZXJ0aWVzIG9uIHRoZSBvdXRwdXQgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBUaGUgbGlzdCBvZiB2YWx1ZXMgb24gdGhlIG91dHB1dCBvYmplY3QuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgb2JqZWN0IG1hZGUgYnkgcGFpcmluZyB1cCBzYW1lLWluZGV4ZWQgZWxlbWVudHMgb2YgYGtleXNgIGFuZCBgdmFsdWVzYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnppcE9iaihbJ2EnLCAnYicsICdjJ10sIFsxLCAyLCAzXSk7IC8vPT4ge2E6IDEsIGI6IDIsIGM6IDN9XG4gICAgICovXG4gICAgdmFyIHppcE9iaiA9IF9jdXJyeTIoZnVuY3Rpb24gemlwT2JqKGtleXMsIHZhbHVlcykge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGtleXMubGVuZ3RoLCB2YWx1ZXMubGVuZ3RoKTtcbiAgICAgICAgdmFyIG91dCA9IHt9O1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBvdXRba2V5c1tpZHhdXSA9IHZhbHVlc1tpZHhdO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgbGlzdCBvdXQgb2YgdGhlIHR3byBzdXBwbGllZCBieSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gZWFjaFxuICAgICAqIGVxdWFsbHktcG9zaXRpb25lZCBwYWlyIGluIHRoZSBsaXN0cy4gVGhlIHJldHVybmVkIGxpc3QgaXMgdHJ1bmNhdGVkIHRvIHRoZVxuICAgICAqIGxlbmd0aCBvZiB0aGUgc2hvcnRlciBvZiB0aGUgdHdvIGlucHV0IGxpc3RzLlxuICAgICAqXG4gICAgICogQGZ1bmN0aW9uXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhLGIgLT4gYykgLT4gW2FdIC0+IFtiXSAtPiBbY11cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdXNlZCB0byBjb21iaW5lIHRoZSB0d28gZWxlbWVudHMgaW50byBvbmUgdmFsdWUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDEgVGhlIGZpcnN0IGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBzZWNvbmQgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBsaXN0IG1hZGUgYnkgY29tYmluaW5nIHNhbWUtaW5kZXhlZCBlbGVtZW50cyBvZiBgbGlzdDFgIGFuZCBgbGlzdDJgXG4gICAgICogICAgICAgICB1c2luZyBgZm5gLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBmID0gKHgsIHkpID0+IHtcbiAgICAgKiAgICAgICAgLy8gLi4uXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgUi56aXBXaXRoKGYsIFsxLCAyLCAzXSwgWydhJywgJ2InLCAnYyddKTtcbiAgICAgKiAgICAgIC8vPT4gW2YoMSwgJ2EnKSwgZigyLCAnYicpLCBmKDMsICdjJyldXG4gICAgICovXG4gICAgdmFyIHppcFdpdGggPSBfY3VycnkzKGZ1bmN0aW9uIHppcFdpdGgoZm4sIGEsIGIpIHtcbiAgICAgICAgdmFyIHJ2ID0gW107XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gTWF0aC5taW4oYS5sZW5ndGgsIGIubGVuZ3RoKTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgcnZbaWR4XSA9IGZuKGFbaWR4XSwgYltpZHhdKTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyBgZmFsc2VgLiBBbnkgcGFzc2VkIGluIHBhcmFtZXRlcnMgYXJlIGlnbm9yZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKiAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLmFsd2F5cywgUi5UXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5GKCk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgRiA9IGFsd2F5cyhmYWxzZSk7XG5cbiAgICAvKipcbiAgICAgKiBBIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgYHRydWVgLiBBbnkgcGFzc2VkIGluIHBhcmFtZXRlcnMgYXJlIGlnbm9yZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKiAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLmFsd2F5cywgUi5GXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5UKCk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBUID0gYWx3YXlzKHRydWUpO1xuXG4gICAgLyoqXG4gICAgICogQ29waWVzIGFuIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gYmUgY29waWVkXG4gICAgICogQHBhcmFtIHtBcnJheX0gcmVmRnJvbSBBcnJheSBjb250YWluaW5nIHRoZSBzb3VyY2UgcmVmZXJlbmNlc1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IHJlZlRvIEFycmF5IGNvbnRhaW5pbmcgdGhlIGNvcGllZCBzb3VyY2UgcmVmZXJlbmNlc1xuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gZGVlcCBXaGV0aGVyIG9yIG5vdCB0byBwZXJmb3JtIGRlZXAgY2xvbmluZy5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgY29waWVkIHZhbHVlLlxuICAgICAqL1xuICAgIHZhciBfY2xvbmUgPSBmdW5jdGlvbiBfY2xvbmUodmFsdWUsIHJlZkZyb20sIHJlZlRvLCBkZWVwKSB7XG4gICAgICAgIHZhciBjb3B5ID0gZnVuY3Rpb24gY29weShjb3BpZWRWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIGxlbiA9IHJlZkZyb20ubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSByZWZGcm9tW2lkeF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZlRvW2lkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVmRnJvbVtpZHggKyAxXSA9IHZhbHVlO1xuICAgICAgICAgICAgcmVmVG9baWR4ICsgMV0gPSBjb3BpZWRWYWx1ZTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvcGllZFZhbHVlW2tleV0gPSBkZWVwID8gX2Nsb25lKHZhbHVlW2tleV0sIHJlZkZyb20sIHJlZlRvLCB0cnVlKSA6IHZhbHVlW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29waWVkVmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIHN3aXRjaCAodHlwZSh2YWx1ZSkpIHtcbiAgICAgICAgY2FzZSAnT2JqZWN0JzpcbiAgICAgICAgICAgIHJldHVybiBjb3B5KHt9KTtcbiAgICAgICAgY2FzZSAnQXJyYXknOlxuICAgICAgICAgICAgcmV0dXJuIGNvcHkoW10pO1xuICAgICAgICBjYXNlICdEYXRlJzpcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSh2YWx1ZS52YWx1ZU9mKCkpO1xuICAgICAgICBjYXNlICdSZWdFeHAnOlxuICAgICAgICAgICAgcmV0dXJuIF9jbG9uZVJlZ0V4cCh2YWx1ZSk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIF9jcmVhdGVQYXJ0aWFsQXBwbGljYXRvciA9IGZ1bmN0aW9uIF9jcmVhdGVQYXJ0aWFsQXBwbGljYXRvcihjb25jYXQpIHtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gX2FyaXR5KE1hdGgubWF4KDAsIGZuLmxlbmd0aCAtIGFyZ3MubGVuZ3RoKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBjb25jYXQoYXJncywgYXJndW1lbnRzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBfZHJvcExhc3QgPSBmdW5jdGlvbiBkcm9wTGFzdChuLCB4cykge1xuICAgICAgICByZXR1cm4gdGFrZShuIDwgeHMubGVuZ3RoID8geHMubGVuZ3RoIC0gbiA6IDAsIHhzKTtcbiAgICB9O1xuXG4gICAgLy8gVmFsdWVzIG9mIG90aGVyIHR5cGVzIGFyZSBvbmx5IGVxdWFsIGlmIGlkZW50aWNhbC5cbiAgICB2YXIgX2VxdWFscyA9IGZ1bmN0aW9uIF9lcXVhbHMoYSwgYiwgc3RhY2tBLCBzdGFja0IpIHtcbiAgICAgICAgaWYgKGlkZW50aWNhbChhLCBiKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUoYSkgIT09IHR5cGUoYikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYS5lcXVhbHMgPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGIuZXF1YWxzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGEuZXF1YWxzID09PSAnZnVuY3Rpb24nICYmIGEuZXF1YWxzKGIpICYmIHR5cGVvZiBiLmVxdWFscyA9PT0gJ2Z1bmN0aW9uJyAmJiBiLmVxdWFscyhhKTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHR5cGUoYSkpIHtcbiAgICAgICAgY2FzZSAnQXJndW1lbnRzJzpcbiAgICAgICAgY2FzZSAnQXJyYXknOlxuICAgICAgICBjYXNlICdPYmplY3QnOlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhLmNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nICYmIF9mdW5jdGlvbk5hbWUoYS5jb25zdHJ1Y3RvcikgPT09ICdQcm9taXNlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0Jvb2xlYW4nOlxuICAgICAgICBjYXNlICdOdW1iZXInOlxuICAgICAgICBjYXNlICdTdHJpbmcnOlxuICAgICAgICAgICAgaWYgKCEodHlwZW9mIGEgPT09IHR5cGVvZiBiICYmIGlkZW50aWNhbChhLnZhbHVlT2YoKSwgYi52YWx1ZU9mKCkpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdEYXRlJzpcbiAgICAgICAgICAgIGlmICghaWRlbnRpY2FsKGEudmFsdWVPZigpLCBiLnZhbHVlT2YoKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnRXJyb3InOlxuICAgICAgICAgICAgcmV0dXJuIGEubmFtZSA9PT0gYi5uYW1lICYmIGEubWVzc2FnZSA9PT0gYi5tZXNzYWdlO1xuICAgICAgICBjYXNlICdSZWdFeHAnOlxuICAgICAgICAgICAgaWYgKCEoYS5zb3VyY2UgPT09IGIuc291cmNlICYmIGEuZ2xvYmFsID09PSBiLmdsb2JhbCAmJiBhLmlnbm9yZUNhc2UgPT09IGIuaWdub3JlQ2FzZSAmJiBhLm11bHRpbGluZSA9PT0gYi5tdWx0aWxpbmUgJiYgYS5zdGlja3kgPT09IGIuc3RpY2t5ICYmIGEudW5pY29kZSA9PT0gYi51bmljb2RlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdNYXAnOlxuICAgICAgICBjYXNlICdTZXQnOlxuICAgICAgICAgICAgaWYgKCFfZXF1YWxzKF9hcnJheUZyb21JdGVyYXRvcihhLmVudHJpZXMoKSksIF9hcnJheUZyb21JdGVyYXRvcihiLmVudHJpZXMoKSksIHN0YWNrQSwgc3RhY2tCKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdJbnQ4QXJyYXknOlxuICAgICAgICBjYXNlICdVaW50OEFycmF5JzpcbiAgICAgICAgY2FzZSAnVWludDhDbGFtcGVkQXJyYXknOlxuICAgICAgICBjYXNlICdJbnQxNkFycmF5JzpcbiAgICAgICAgY2FzZSAnVWludDE2QXJyYXknOlxuICAgICAgICBjYXNlICdJbnQzMkFycmF5JzpcbiAgICAgICAgY2FzZSAnVWludDMyQXJyYXknOlxuICAgICAgICBjYXNlICdGbG9hdDMyQXJyYXknOlxuICAgICAgICBjYXNlICdGbG9hdDY0QXJyYXknOlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0FycmF5QnVmZmVyJzpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVmFsdWVzIG9mIG90aGVyIHR5cGVzIGFyZSBvbmx5IGVxdWFsIGlmIGlkZW50aWNhbC5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5c0EgPSBrZXlzKGEpO1xuICAgICAgICBpZiAoa2V5c0EubGVuZ3RoICE9PSBrZXlzKGIpLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpZHggPSBzdGFja0EubGVuZ3RoIC0gMTtcbiAgICAgICAgd2hpbGUgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICBpZiAoc3RhY2tBW2lkeF0gPT09IGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhY2tCW2lkeF0gPT09IGI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggLT0gMTtcbiAgICAgICAgfVxuICAgICAgICBzdGFja0EucHVzaChhKTtcbiAgICAgICAgc3RhY2tCLnB1c2goYik7XG4gICAgICAgIGlkeCA9IGtleXNBLmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpZHggPj0gMCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNBW2lkeF07XG4gICAgICAgICAgICBpZiAoIShfaGFzKGtleSwgYikgJiYgX2VxdWFscyhiW2tleV0sIGFba2V5XSwgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrQS5wb3AoKTtcbiAgICAgICAgc3RhY2tCLnBvcCgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogYF9tYWtlRmxhdGAgaXMgYSBoZWxwZXIgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgb25lLWxldmVsIG9yIGZ1bGx5IHJlY3Vyc2l2ZVxuICAgICAqIGZ1bmN0aW9uIGJhc2VkIG9uIHRoZSBmbGFnIHBhc3NlZCBpbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdmFyIF9tYWtlRmxhdCA9IGZ1bmN0aW9uIF9tYWtlRmxhdChyZWN1cnNpdmUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGZsYXR0KGxpc3QpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgamxlbiwgajtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgdmFyIGlsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpZHggPCBpbGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXlMaWtlKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByZWN1cnNpdmUgPyBmbGF0dChsaXN0W2lkeF0pIDogbGlzdFtpZHhdO1xuICAgICAgICAgICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgICAgICAgICAgamxlbiA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGogPCBqbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSB2YWx1ZVtqXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGogKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IGxpc3RbaWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgX3JlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gX2FycmF5UmVkdWNlKHhmLCBhY2MsIGxpc3QpIHtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgICAgIGFjYyA9IHhmWydAQHRyYW5zZHVjZXIvc3RlcCddKGFjYywgbGlzdFtpZHhdKTtcbiAgICAgICAgICAgICAgICBpZiAoYWNjICYmIGFjY1snQEB0cmFuc2R1Y2VyL3JlZHVjZWQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSBhY2NbJ0BAdHJhbnNkdWNlci92YWx1ZSddO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShhY2MpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9pdGVyYWJsZVJlZHVjZSh4ZiwgYWNjLCBpdGVyKSB7XG4gICAgICAgICAgICB2YXIgc3RlcCA9IGl0ZXIubmV4dCgpO1xuICAgICAgICAgICAgd2hpbGUgKCFzdGVwLmRvbmUpIHtcbiAgICAgICAgICAgICAgICBhY2MgPSB4ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShhY2MsIHN0ZXAudmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChhY2MgJiYgYWNjWydAQHRyYW5zZHVjZXIvcmVkdWNlZCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IGFjY1snQEB0cmFuc2R1Y2VyL3ZhbHVlJ107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdGVwID0gaXRlci5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShhY2MpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9tZXRob2RSZWR1Y2UoeGYsIGFjYywgb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4geGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShvYmoucmVkdWNlKGJpbmQoeGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10sIHhmKSwgYWNjKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN5bUl0ZXJhdG9yID0gdHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgPyBTeW1ib2wuaXRlcmF0b3IgOiAnQEBpdGVyYXRvcic7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBfcmVkdWNlKGZuLCBhY2MsIGxpc3QpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBmbiA9IF94d3JhcChmbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNBcnJheUxpa2UobGlzdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2FycmF5UmVkdWNlKGZuLCBhY2MsIGxpc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0LnJlZHVjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfbWV0aG9kUmVkdWNlKGZuLCBhY2MsIGxpc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxpc3Rbc3ltSXRlcmF0b3JdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2l0ZXJhYmxlUmVkdWNlKGZuLCBhY2MsIGxpc3Rbc3ltSXRlcmF0b3JdKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBsaXN0Lm5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2l0ZXJhYmxlUmVkdWNlKGZuLCBhY2MsIGxpc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncmVkdWNlOiBsaXN0IG11c3QgYmUgYXJyYXkgb3IgaXRlcmFibGUnKTtcbiAgICAgICAgfTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3N0ZXBDYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfc3RlcENhdEFycmF5ID0ge1xuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9pbml0JzogQXJyYXksXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3N0ZXAnOiBmdW5jdGlvbiAoeHMsIHgpIHtcbiAgICAgICAgICAgICAgICB4cy5wdXNoKHgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB4cztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3Jlc3VsdCc6IF9pZGVudGl0eVxuICAgICAgICB9O1xuICAgICAgICB2YXIgX3N0ZXBDYXRTdHJpbmcgPSB7XG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL2luaXQnOiBTdHJpbmcsXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3N0ZXAnOiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhICsgYjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3Jlc3VsdCc6IF9pZGVudGl0eVxuICAgICAgICB9O1xuICAgICAgICB2YXIgX3N0ZXBDYXRPYmplY3QgPSB7XG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL2luaXQnOiBPYmplY3QsXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3N0ZXAnOiBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfYXNzaWduKHJlc3VsdCwgaXNBcnJheUxpa2UoaW5wdXQpID8gb2JqT2YoaW5wdXRbMF0sIGlucHV0WzFdKSA6IGlucHV0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3Jlc3VsdCc6IF9pZGVudGl0eVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gX3N0ZXBDYXQob2JqKSB7XG4gICAgICAgICAgICBpZiAoX2lzVHJhbnNmb3JtZXIob2JqKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RlcENhdEFycmF5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zdGVwQ2F0U3RyaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zdGVwQ2F0T2JqZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIHRyYW5zZm9ybWVyIGZvciAnICsgb2JqKTtcbiAgICAgICAgfTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hkcm9wTGFzdFdoaWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYRHJvcExhc3RXaGlsZShmbiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMuZiA9IGZuO1xuICAgICAgICAgICAgdGhpcy5yZXRhaW5lZCA9IFtdO1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICB9XG4gICAgICAgIFhEcm9wTGFzdFdoaWxlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWERyb3BMYXN0V2hpbGUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLnJldGFpbmVkID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWERyb3BMYXN0V2hpbGUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmYoaW5wdXQpID8gdGhpcy5yZXRhaW4ocmVzdWx0LCBpbnB1dCkgOiB0aGlzLmZsdXNoKHJlc3VsdCwgaW5wdXQpO1xuICAgICAgICB9O1xuICAgICAgICBYRHJvcExhc3RXaGlsZS5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gX3JlZHVjZSh0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddLCByZXN1bHQsIHRoaXMucmV0YWluZWQpO1xuICAgICAgICAgICAgdGhpcy5yZXRhaW5lZCA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBpbnB1dCk7XG4gICAgICAgIH07XG4gICAgICAgIFhEcm9wTGFzdFdoaWxlLnByb3RvdHlwZS5yZXRhaW4gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5yZXRhaW5lZC5wdXNoKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94ZHJvcExhc3RXaGlsZShmbiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWERyb3BMYXN0V2hpbGUoZm4sIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94Z3JvdXBCeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWEdyb3VwQnkoZiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgICAgIHRoaXMuZiA9IGY7XG4gICAgICAgICAgICB0aGlzLmlucHV0cyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIFhHcm91cEJ5LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWEdyb3VwQnkucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICB2YXIga2V5O1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gdGhpcy5pbnB1dHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoX2hhcyhrZXksIHRoaXMuaW5wdXRzKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdGhpcy5pbnB1dHNba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRbJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdFsnQEB0cmFuc2R1Y2VyL3ZhbHVlJ107XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW5wdXRzID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWEdyb3VwQnkucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSB0aGlzLmYoaW5wdXQpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHNba2V5XSA9IHRoaXMuaW5wdXRzW2tleV0gfHwgW1xuICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICBbXVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzW2tleV1bMV0gPSBhcHBlbmQoaW5wdXQsIHRoaXMuaW5wdXRzW2tleV1bMV0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hncm91cEJ5KGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhHcm91cEJ5KGYsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBsaXN0IGl0ZXJhdGlvbiBmdW5jdGlvbiBmcm9tIGFuIGV4aXN0aW5nIG9uZSBieSBhZGRpbmcgdHdvIG5ld1xuICAgICAqIHBhcmFtZXRlcnMgdG8gaXRzIGNhbGxiYWNrIGZ1bmN0aW9uOiB0aGUgY3VycmVudCBpbmRleCwgYW5kIHRoZSBlbnRpcmUgbGlzdC5cbiAgICAgKlxuICAgICAqIFRoaXMgd291bGQgdHVybiwgZm9yIGluc3RhbmNlLCBSYW1kYSdzIHNpbXBsZSBgbWFwYCBmdW5jdGlvbiBpbnRvIG9uZSB0aGF0XG4gICAgICogbW9yZSBjbG9zZWx5IHJlc2VtYmxlcyBgQXJyYXkucHJvdG90eXBlLm1hcGAuIE5vdGUgdGhhdCB0aGlzIHdpbGwgb25seSB3b3JrXG4gICAgICogZm9yIGZ1bmN0aW9ucyBpbiB3aGljaCB0aGUgaXRlcmF0aW9uIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIHRoZSBmaXJzdFxuICAgICAqIHBhcmFtZXRlciwgYW5kIHdoZXJlIHRoZSBsaXN0IGlzIHRoZSBsYXN0IHBhcmFtZXRlci4gKFRoaXMgbGF0dGVyIG1pZ2h0IGJlXG4gICAgICogdW5pbXBvcnRhbnQgaWYgdGhlIGxpc3QgcGFyYW1ldGVyIGlzIG5vdCB1c2VkLilcbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTUuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoKGEgLi4uIC0+IGIpIC4uLiAtPiBbYV0gLT4gKikgLT4gKGEgLi4uLCBJbnQsIFthXSAtPiBiKSAuLi4gLT4gW2FdIC0+ICopXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQSBsaXN0IGl0ZXJhdGlvbiBmdW5jdGlvbiB0aGF0IGRvZXMgbm90IHBhc3MgaW5kZXggb3IgbGlzdCB0byBpdHMgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQW4gYWx0ZXJlZCBsaXN0IGl0ZXJhdGlvbiBmdW5jdGlvbiB0aGF0IHBhc3NlcyAoaXRlbSwgaW5kZXgsIGxpc3QpIHRvIGl0cyBjYWxsYmFja1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtYXBJbmRleGVkID0gUi5hZGRJbmRleChSLm1hcCk7XG4gICAgICogICAgICBtYXBJbmRleGVkKCh2YWwsIGlkeCkgPT4gaWR4ICsgJy0nICsgdmFsLCBbJ2YnLCAnbycsICdvJywgJ2InLCAnYScsICdyJ10pO1xuICAgICAqICAgICAgLy89PiBbJzAtZicsICcxLW8nLCAnMi1vJywgJzMtYicsICc0LWEnLCAnNS1yJ11cbiAgICAgKi9cbiAgICB2YXIgYWRkSW5kZXggPSBfY3VycnkxKGZ1bmN0aW9uIGFkZEluZGV4KGZuKSB7XG4gICAgICAgIHJldHVybiBjdXJyeU4oZm4ubGVuZ3RoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHZhciBvcmlnRm4gPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICB2YXIgbGlzdCA9IGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICB2YXIgYXJncyA9IF9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICAgICAgYXJnc1swXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gb3JpZ0ZuLmFwcGx5KHRoaXMsIF9jb25jYXQoYXJndW1lbnRzLCBbXG4gICAgICAgICAgICAgICAgICAgIGlkeCxcbiAgICAgICAgICAgICAgICAgICAgbGlzdFxuICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBXcmFwcyBhIGZ1bmN0aW9uIG9mIGFueSBhcml0eSAoaW5jbHVkaW5nIG51bGxhcnkpIGluIGEgZnVuY3Rpb24gdGhhdCBhY2NlcHRzXG4gICAgICogZXhhY3RseSAyIHBhcmFtZXRlcnMuIEFueSBleHRyYW5lb3VzIHBhcmFtZXRlcnMgd2lsbCBub3QgYmUgcGFzc2VkIHRvIHRoZVxuICAgICAqIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgqIC0+IGMpIC0+IChhLCBiIC0+IGMpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHdyYXBwaW5nIGBmbmAuIFRoZSBuZXcgZnVuY3Rpb24gaXMgZ3VhcmFudGVlZCB0byBiZSBvZlxuICAgICAqICAgICAgICAgYXJpdHkgMi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgdGFrZXNUaHJlZUFyZ3MgPSBmdW5jdGlvbihhLCBiLCBjKSB7XG4gICAgICogICAgICAgIHJldHVybiBbYSwgYiwgY107XG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgdGFrZXNUaHJlZUFyZ3MubGVuZ3RoOyAvLz0+IDNcbiAgICAgKiAgICAgIHRha2VzVGhyZWVBcmdzKDEsIDIsIDMpOyAvLz0+IFsxLCAyLCAzXVxuICAgICAqXG4gICAgICogICAgICB2YXIgdGFrZXNUd29BcmdzID0gUi5iaW5hcnkodGFrZXNUaHJlZUFyZ3MpO1xuICAgICAqICAgICAgdGFrZXNUd29BcmdzLmxlbmd0aDsgLy89PiAyXG4gICAgICogICAgICAvLyBPbmx5IDIgYXJndW1lbnRzIGFyZSBwYXNzZWQgdG8gdGhlIHdyYXBwZWQgZnVuY3Rpb25cbiAgICAgKiAgICAgIHRha2VzVHdvQXJncygxLCAyLCAzKTsgLy89PiBbMSwgMiwgdW5kZWZpbmVkXVxuICAgICAqL1xuICAgIHZhciBiaW5hcnkgPSBfY3VycnkxKGZ1bmN0aW9uIGJpbmFyeShmbikge1xuICAgICAgICByZXR1cm4gbkFyeSgyLCBmbik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoZSB2YWx1ZSB3aGljaCBtYXkgY29udGFpbiAobmVzdGVkKSBgQXJyYXlgcyBhbmRcbiAgICAgKiBgT2JqZWN0YHMsIGBOdW1iZXJgcywgYFN0cmluZ2BzLCBgQm9vbGVhbmBzIGFuZCBgRGF0ZWBzLiBgRnVuY3Rpb25gcyBhcmUgbm90XG4gICAgICogY29waWVkLCBidXQgYXNzaWduZWQgYnkgdGhlaXIgcmVmZXJlbmNlLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byBhIGBjbG9uZWAgbWV0aG9kIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHsqfSAtPiB7Kn1cbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBvYmplY3Qgb3IgYXJyYXkgdG8gY2xvbmVcbiAgICAgKiBAcmV0dXJuIHsqfSBBIG5ldyBvYmplY3Qgb3IgYXJyYXkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG9iamVjdHMgPSBbe30sIHt9LCB7fV07XG4gICAgICogICAgICB2YXIgb2JqZWN0c0Nsb25lID0gUi5jbG9uZShvYmplY3RzKTtcbiAgICAgKiAgICAgIG9iamVjdHNbMF0gPT09IG9iamVjdHNDbG9uZVswXTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBjbG9uZSA9IF9jdXJyeTEoZnVuY3Rpb24gY2xvbmUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlLmNsb25lID09PSAnZnVuY3Rpb24nID8gdmFsdWUuY2xvbmUoKSA6IF9jbG9uZSh2YWx1ZSwgW10sIFtdLCB0cnVlKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBjdXJyaWVkIGVxdWl2YWxlbnQgb2YgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLiBUaGUgY3VycmllZCBmdW5jdGlvblxuICAgICAqIGhhcyB0d28gdW51c3VhbCBjYXBhYmlsaXRpZXMuIEZpcnN0LCBpdHMgYXJndW1lbnRzIG5lZWRuJ3QgYmUgcHJvdmlkZWQgb25lXG4gICAgICogYXQgYSB0aW1lLiBJZiBgZmAgaXMgYSB0ZXJuYXJ5IGZ1bmN0aW9uIGFuZCBgZ2AgaXMgYFIuY3VycnkoZilgLCB0aGVcbiAgICAgKiBmb2xsb3dpbmcgYXJlIGVxdWl2YWxlbnQ6XG4gICAgICpcbiAgICAgKiAgIC0gYGcoMSkoMikoMylgXG4gICAgICogICAtIGBnKDEpKDIsIDMpYFxuICAgICAqICAgLSBgZygxLCAyKSgzKWBcbiAgICAgKiAgIC0gYGcoMSwgMiwgMylgXG4gICAgICpcbiAgICAgKiBTZWNvbmRseSwgdGhlIHNwZWNpYWwgcGxhY2Vob2xkZXIgdmFsdWUgYFIuX19gIG1heSBiZSB1c2VkIHRvIHNwZWNpZnlcbiAgICAgKiBcImdhcHNcIiwgYWxsb3dpbmcgcGFydGlhbCBhcHBsaWNhdGlvbiBvZiBhbnkgY29tYmluYXRpb24gb2YgYXJndW1lbnRzLFxuICAgICAqIHJlZ2FyZGxlc3Mgb2YgdGhlaXIgcG9zaXRpb25zLiBJZiBgZ2AgaXMgYXMgYWJvdmUgYW5kIGBfYCBpcyBgUi5fX2AsIHRoZVxuICAgICAqIGZvbGxvd2luZyBhcmUgZXF1aXZhbGVudDpcbiAgICAgKlxuICAgICAqICAgLSBgZygxLCAyLCAzKWBcbiAgICAgKiAgIC0gYGcoXywgMiwgMykoMSlgXG4gICAgICogICAtIGBnKF8sIF8sIDMpKDEpKDIpYFxuICAgICAqICAgLSBgZyhfLCBfLCAzKSgxLCAyKWBcbiAgICAgKiAgIC0gYGcoXywgMikoMSkoMylgXG4gICAgICogICAtIGBnKF8sIDIpKDEsIDMpYFxuICAgICAqICAgLSBgZyhfLCAyKShfLCAzKSgxKWBcbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKiAtPiBhKSAtPiAoKiAtPiBhKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcsIGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICogQHNlZSBSLmN1cnJ5TlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBhZGRGb3VyTnVtYmVycyA9IChhLCBiLCBjLCBkKSA9PiBhICsgYiArIGMgKyBkO1xuICAgICAqXG4gICAgICogICAgICB2YXIgY3VycmllZEFkZEZvdXJOdW1iZXJzID0gUi5jdXJyeShhZGRGb3VyTnVtYmVycyk7XG4gICAgICogICAgICB2YXIgZiA9IGN1cnJpZWRBZGRGb3VyTnVtYmVycygxLCAyKTtcbiAgICAgKiAgICAgIHZhciBnID0gZigzKTtcbiAgICAgKiAgICAgIGcoNCk7IC8vPT4gMTBcbiAgICAgKi9cbiAgICB2YXIgY3VycnkgPSBfY3VycnkxKGZ1bmN0aW9uIGN1cnJ5KGZuKSB7XG4gICAgICAgIHJldHVybiBjdXJyeU4oZm4ubGVuZ3RoLCBmbik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFsbCBidXQgdGhlIGZpcnN0IGBuYCBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gbGlzdCwgc3RyaW5nLCBvclxuICAgICAqIHRyYW5zZHVjZXIvdHJhbnNmb3JtZXIgKG9yIG9iamVjdCB3aXRoIGEgYGRyb3BgIG1ldGhvZCkuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZHJvcGAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IFthXVxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gblxuICAgICAqIEBwYXJhbSB7Kn0gbGlzdFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLnRha2UsIFIudHJhbnNkdWNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5kcm9wKDEsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydiYXInLCAnYmF6J11cbiAgICAgKiAgICAgIFIuZHJvcCgyLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFsnYmF6J11cbiAgICAgKiAgICAgIFIuZHJvcCgzLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFtdXG4gICAgICogICAgICBSLmRyb3AoNCwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbXVxuICAgICAqICAgICAgUi5kcm9wKDMsICdyYW1kYScpOyAgICAgICAgICAgICAgIC8vPT4gJ2RhJ1xuICAgICAqL1xuICAgIHZhciBkcm9wID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdkcm9wJywgX3hkcm9wLCBmdW5jdGlvbiBkcm9wKG4sIHhzKSB7XG4gICAgICAgIHJldHVybiBzbGljZShNYXRoLm1heCgwLCBuKSwgSW5maW5pdHksIHhzKTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBjb250YWluaW5nIGFsbCBidXQgdGhlIGxhc3QgYG5gIGVsZW1lbnRzIG9mIHRoZSBnaXZlbiBgbGlzdGAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE2LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAc2lnIE51bWJlciAtPiBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gVGhlIG51bWJlciBvZiBlbGVtZW50cyBvZiBgeHNgIHRvIHNraXAuXG4gICAgICogQHBhcmFtIHtBcnJheX0geHMgVGhlIGNvbGxlY3Rpb24gdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICogQHNlZSBSLnRha2VMYXN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5kcm9wTGFzdCgxLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFsnZm9vJywgJ2JhciddXG4gICAgICogICAgICBSLmRyb3BMYXN0KDIsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydmb28nXVxuICAgICAqICAgICAgUi5kcm9wTGFzdCgzLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFtdXG4gICAgICogICAgICBSLmRyb3BMYXN0KDQsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gW11cbiAgICAgKiAgICAgIFIuZHJvcExhc3QoMywgJ3JhbWRhJyk7ICAgICAgICAgICAgICAgLy89PiAncmEnXG4gICAgICovXG4gICAgdmFyIGRyb3BMYXN0ID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdkcm9wTGFzdCcsIF94ZHJvcExhc3QsIF9kcm9wTGFzdCkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnRhaW5pbmcgYWxsIGJ1dCBsYXN0IHRoZWBuYCBlbGVtZW50cyBvZiBhIGdpdmVuIGxpc3QsXG4gICAgICogcGFzc2luZyBlYWNoIHZhbHVlIGZyb20gdGhlIHJpZ2h0IHRvIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgZnVuY3Rpb24sXG4gICAgICogc2tpcHBpbmcgZWxlbWVudHMgd2hpbGUgdGhlIHByZWRpY2F0ZSBmdW5jdGlvbiByZXR1cm5zIGB0cnVlYC4gVGhlIHByZWRpY2F0ZVxuICAgICAqIGZ1bmN0aW9uIGlzIHBhc3NlZCBvbmUgYXJndW1lbnQ6ICh2YWx1ZSkqLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgbmV3IGFycmF5LlxuICAgICAqIEBzZWUgUi50YWtlTGFzdFdoaWxlLCBSLmFkZEluZGV4XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGx0ZVRocmVlID0geCA9PiB4IDw9IDM7XG4gICAgICpcbiAgICAgKiAgICAgIFIuZHJvcExhc3RXaGlsZShsdGVUaHJlZSwgWzEsIDIsIDMsIDQsIDMsIDIsIDFdKTsgLy89PiBbMSwgMiwgMywgNF1cbiAgICAgKi9cbiAgICB2YXIgZHJvcExhc3RXaGlsZSA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZHJvcExhc3RXaGlsZScsIF94ZHJvcExhc3RXaGlsZSwgX2Ryb3BMYXN0V2hpbGUpKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGl0cyBhcmd1bWVudHMgYXJlIGVxdWl2YWxlbnQsIGBmYWxzZWAgb3RoZXJ3aXNlLiBIYW5kbGVzXG4gICAgICogY3ljbGljYWwgZGF0YSBzdHJ1Y3R1cmVzLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyBzeW1tZXRyaWNhbGx5IHRvIHRoZSBgZXF1YWxzYCBtZXRob2RzIG9mIGJvdGggYXJndW1lbnRzLCBpZlxuICAgICAqIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE1LjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIGEgLT4gYiAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSBhXG4gICAgICogQHBhcmFtIHsqfSBiXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmVxdWFscygxLCAxKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmVxdWFscygxLCAnMScpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmVxdWFscyhbMSwgMiwgM10sIFsxLCAyLCAzXSk7IC8vPT4gdHJ1ZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYSA9IHt9OyBhLnYgPSBhO1xuICAgICAqICAgICAgdmFyIGIgPSB7fTsgYi52ID0gYjtcbiAgICAgKiAgICAgIFIuZXF1YWxzKGEsIGIpOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgZXF1YWxzID0gX2N1cnJ5MihmdW5jdGlvbiBlcXVhbHMoYSwgYikge1xuICAgICAgICByZXR1cm4gX2VxdWFscyhhLCBiLCBbXSwgW10pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBwcmVkaWNhdGUgYW5kIGEgXCJmaWx0ZXJhYmxlXCIsIGFuZCByZXR1cm5zIGEgbmV3IGZpbHRlcmFibGUgb2YgdGhlXG4gICAgICogc2FtZSB0eXBlIGNvbnRhaW5pbmcgdGhlIG1lbWJlcnMgb2YgdGhlIGdpdmVuIGZpbHRlcmFibGUgd2hpY2ggc2F0aXNmeSB0aGVcbiAgICAgKiBnaXZlbiBwcmVkaWNhdGUuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZmlsdGVyYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIEZpbHRlcmFibGUgZiA9PiAoYSAtPiBCb29sZWFuKSAtPiBmIGEgLT4gZiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGZpbHRlcmFibGVcbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKiBAc2VlIFIucmVqZWN0LCBSLnRyYW5zZHVjZSwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBpc0V2ZW4gPSBuID0+IG4gJSAyID09PSAwO1xuICAgICAqXG4gICAgICogICAgICBSLmZpbHRlcihpc0V2ZW4sIFsxLCAyLCAzLCA0XSk7IC8vPT4gWzIsIDRdXG4gICAgICpcbiAgICAgKiAgICAgIFIuZmlsdGVyKGlzRXZlbiwge2E6IDEsIGI6IDIsIGM6IDMsIGQ6IDR9KTsgLy89PiB7YjogMiwgZDogNH1cbiAgICAgKi9cbiAgICAvLyBlbHNlXG4gICAgdmFyIGZpbHRlciA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZmlsdGVyJywgX3hmaWx0ZXIsIGZ1bmN0aW9uIChwcmVkLCBmaWx0ZXJhYmxlKSB7XG4gICAgICAgIHJldHVybiBfaXNPYmplY3QoZmlsdGVyYWJsZSkgPyBfcmVkdWNlKGZ1bmN0aW9uIChhY2MsIGtleSkge1xuICAgICAgICAgICAgaWYgKHByZWQoZmlsdGVyYWJsZVtrZXldKSkge1xuICAgICAgICAgICAgICAgIGFjY1trZXldID0gZmlsdGVyYWJsZVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSwge30sIGtleXMoZmlsdGVyYWJsZSkpIDogLy8gZWxzZVxuICAgICAgICBfZmlsdGVyKHByZWQsIGZpbHRlcmFibGUpO1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBieSBwdWxsaW5nIGV2ZXJ5IGl0ZW0gb3V0IG9mIGl0IChhbmQgYWxsIGl0cyBzdWItYXJyYXlzKVxuICAgICAqIGFuZCBwdXR0aW5nIHRoZW0gaW4gYSBuZXcgYXJyYXksIGRlcHRoLWZpcnN0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFtiXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgZmxhdHRlbmVkIGxpc3QuXG4gICAgICogQHNlZSBSLnVubmVzdFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZmxhdHRlbihbMSwgMiwgWzMsIDRdLCA1LCBbNiwgWzcsIDgsIFs5LCBbMTAsIDExXSwgMTJdXV1dKTtcbiAgICAgKiAgICAgIC8vPT4gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMSwgMTJdXG4gICAgICovXG4gICAgdmFyIGZsYXR0ZW4gPSBfY3VycnkxKF9tYWtlRmxhdCh0cnVlKSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGZ1bmN0aW9uIG11Y2ggbGlrZSB0aGUgc3VwcGxpZWQgb25lLCBleGNlcHQgdGhhdCB0aGUgZmlyc3QgdHdvXG4gICAgICogYXJndW1lbnRzJyBvcmRlciBpcyByZXZlcnNlZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoYSAtPiBiIC0+IGMgLT4gLi4uIC0+IHopIC0+IChiIC0+IGEgLT4gYyAtPiAuLi4gLT4geilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gaW52b2tlIHdpdGggaXRzIGZpcnN0IHR3byBwYXJhbWV0ZXJzIHJldmVyc2VkLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSByZXN1bHQgb2YgaW52b2tpbmcgYGZuYCB3aXRoIGl0cyBmaXJzdCB0d28gcGFyYW1ldGVycycgb3JkZXIgcmV2ZXJzZWQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG1lcmdlVGhyZWUgPSAoYSwgYiwgYykgPT4gW10uY29uY2F0KGEsIGIsIGMpO1xuICAgICAqXG4gICAgICogICAgICBtZXJnZVRocmVlKDEsIDIsIDMpOyAvLz0+IFsxLCAyLCAzXVxuICAgICAqXG4gICAgICogICAgICBSLmZsaXAobWVyZ2VUaHJlZSkoMSwgMiwgMyk7IC8vPT4gWzIsIDEsIDNdXG4gICAgICovXG4gICAgdmFyIGZsaXAgPSBfY3VycnkxKGZ1bmN0aW9uIGZsaXAoZm4pIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IF9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICAgICAgYXJnc1swXSA9IGI7XG4gICAgICAgICAgICBhcmdzWzFdID0gYTtcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBnaXZlbiBsaXN0IG9yIHN0cmluZy4gSW4gc29tZSBsaWJyYXJpZXNcbiAgICAgKiB0aGlzIGZ1bmN0aW9uIGlzIG5hbWVkIGBmaXJzdGAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gYSB8IFVuZGVmaW5lZFxuICAgICAqIEBzaWcgU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBsaXN0XG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIudGFpbCwgUi5pbml0LCBSLmxhc3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmhlYWQoWydmaScsICdmbycsICdmdW0nXSk7IC8vPT4gJ2ZpJ1xuICAgICAqICAgICAgUi5oZWFkKFtdKTsgLy89PiB1bmRlZmluZWRcbiAgICAgKlxuICAgICAqICAgICAgUi5oZWFkKCdhYmMnKTsgLy89PiAnYSdcbiAgICAgKiAgICAgIFIuaGVhZCgnJyk7IC8vPT4gJydcbiAgICAgKi9cbiAgICB2YXIgaGVhZCA9IG50aCgwKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYWxsIGJ1dCB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBnaXZlbiBsaXN0IG9yIHN0cmluZy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFthXSAtPiBbYV1cbiAgICAgKiBAc2lnIFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0geyp9IGxpc3RcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5sYXN0LCBSLmhlYWQsIFIudGFpbFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuaW5pdChbMSwgMiwgM10pOyAgLy89PiBbMSwgMl1cbiAgICAgKiAgICAgIFIuaW5pdChbMSwgMl0pOyAgICAgLy89PiBbMV1cbiAgICAgKiAgICAgIFIuaW5pdChbMV0pOyAgICAgICAgLy89PiBbXVxuICAgICAqICAgICAgUi5pbml0KFtdKTsgICAgICAgICAvLz0+IFtdXG4gICAgICpcbiAgICAgKiAgICAgIFIuaW5pdCgnYWJjJyk7ICAvLz0+ICdhYidcbiAgICAgKiAgICAgIFIuaW5pdCgnYWInKTsgICAvLz0+ICdhJ1xuICAgICAqICAgICAgUi5pbml0KCdhJyk7ICAgIC8vPT4gJydcbiAgICAgKiAgICAgIFIuaW5pdCgnJyk7ICAgICAvLz0+ICcnXG4gICAgICovXG4gICAgdmFyIGluaXQgPSBzbGljZSgwLCAtMSk7XG5cbiAgICAvKipcbiAgICAgKiBDb21iaW5lcyB0d28gbGlzdHMgaW50byBhIHNldCAoaS5lLiBubyBkdXBsaWNhdGVzKSBjb21wb3NlZCBvZiB0aG9zZVxuICAgICAqIGVsZW1lbnRzIGNvbW1vbiB0byBib3RoIGxpc3RzLiBEdXBsaWNhdGlvbiBpcyBkZXRlcm1pbmVkIGFjY29yZGluZyB0byB0aGVcbiAgICAgKiB2YWx1ZSByZXR1cm5lZCBieSBhcHBseWluZyB0aGUgc3VwcGxpZWQgcHJlZGljYXRlIHRvIHR3byBsaXN0IGVsZW1lbnRzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIChhIC0+IGEgLT4gQm9vbGVhbikgLT4gWypdIC0+IFsqXSAtPiBbKl1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIEEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgZGV0ZXJtaW5lcyB3aGV0aGVyXG4gICAgICogICAgICAgIHRoZSB0d28gc3VwcGxpZWQgZWxlbWVudHMgYXJlIGVxdWFsLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIE9uZSBsaXN0IG9mIGl0ZW1zIHRvIGNvbXBhcmVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MiBBIHNlY29uZCBsaXN0IG9mIGl0ZW1zIHRvIGNvbXBhcmVcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgbGlzdCBjb250YWluaW5nIHRob3NlIGVsZW1lbnRzIGNvbW1vbiB0byBib3RoIGxpc3RzLlxuICAgICAqIEBzZWUgUi5pbnRlcnNlY3Rpb25cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYnVmZmFsb1NwcmluZ2ZpZWxkID0gW1xuICAgICAqICAgICAgICB7aWQ6IDgyNCwgbmFtZTogJ1JpY2hpZSBGdXJheSd9LFxuICAgICAqICAgICAgICB7aWQ6IDk1NiwgbmFtZTogJ0Rld2V5IE1hcnRpbid9LFxuICAgICAqICAgICAgICB7aWQ6IDMxMywgbmFtZTogJ0JydWNlIFBhbG1lcid9LFxuICAgICAqICAgICAgICB7aWQ6IDQ1NiwgbmFtZTogJ1N0ZXBoZW4gU3RpbGxzJ30sXG4gICAgICogICAgICAgIHtpZDogMTc3LCBuYW1lOiAnTmVpbCBZb3VuZyd9XG4gICAgICogICAgICBdO1xuICAgICAqICAgICAgdmFyIGNzbnkgPSBbXG4gICAgICogICAgICAgIHtpZDogMjA0LCBuYW1lOiAnRGF2aWQgQ3Jvc2J5J30sXG4gICAgICogICAgICAgIHtpZDogNDU2LCBuYW1lOiAnU3RlcGhlbiBTdGlsbHMnfSxcbiAgICAgKiAgICAgICAge2lkOiA1MzksIG5hbWU6ICdHcmFoYW0gTmFzaCd9LFxuICAgICAqICAgICAgICB7aWQ6IDE3NywgbmFtZTogJ05laWwgWW91bmcnfVxuICAgICAqICAgICAgXTtcbiAgICAgKlxuICAgICAqICAgICAgUi5pbnRlcnNlY3Rpb25XaXRoKFIuZXFCeShSLnByb3AoJ2lkJykpLCBidWZmYWxvU3ByaW5nZmllbGQsIGNzbnkpO1xuICAgICAqICAgICAgLy89PiBbe2lkOiA0NTYsIG5hbWU6ICdTdGVwaGVuIFN0aWxscyd9LCB7aWQ6IDE3NywgbmFtZTogJ05laWwgWW91bmcnfV1cbiAgICAgKi9cbiAgICB2YXIgaW50ZXJzZWN0aW9uV2l0aCA9IF9jdXJyeTMoZnVuY3Rpb24gaW50ZXJzZWN0aW9uV2l0aChwcmVkLCBsaXN0MSwgbGlzdDIpIHtcbiAgICAgICAgdmFyIGxvb2t1cExpc3QsIGZpbHRlcmVkTGlzdDtcbiAgICAgICAgaWYgKGxpc3QxLmxlbmd0aCA+IGxpc3QyLmxlbmd0aCkge1xuICAgICAgICAgICAgbG9va3VwTGlzdCA9IGxpc3QxO1xuICAgICAgICAgICAgZmlsdGVyZWRMaXN0ID0gbGlzdDI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb29rdXBMaXN0ID0gbGlzdDI7XG4gICAgICAgICAgICBmaWx0ZXJlZExpc3QgPSBsaXN0MTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGZpbHRlcmVkTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChfY29udGFpbnNXaXRoKHByZWQsIGZpbHRlcmVkTGlzdFtpZHhdLCBsb29rdXBMaXN0KSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gZmlsdGVyZWRMaXN0W2lkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5pcVdpdGgocHJlZCwgcmVzdWx0cyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUcmFuc2Zvcm1zIHRoZSBpdGVtcyBvZiB0aGUgbGlzdCB3aXRoIHRoZSB0cmFuc2R1Y2VyIGFuZCBhcHBlbmRzIHRoZVxuICAgICAqIHRyYW5zZm9ybWVkIGl0ZW1zIHRvIHRoZSBhY2N1bXVsYXRvciB1c2luZyBhbiBhcHByb3ByaWF0ZSBpdGVyYXRvciBmdW5jdGlvblxuICAgICAqIGJhc2VkIG9uIHRoZSBhY2N1bXVsYXRvciB0eXBlLlxuICAgICAqXG4gICAgICogVGhlIGFjY3VtdWxhdG9yIGNhbiBiZSBhbiBhcnJheSwgc3RyaW5nLCBvYmplY3Qgb3IgYSB0cmFuc2Zvcm1lci4gSXRlcmF0ZWRcbiAgICAgKiBpdGVtcyB3aWxsIGJlIGFwcGVuZGVkIHRvIGFycmF5cyBhbmQgY29uY2F0ZW5hdGVkIHRvIHN0cmluZ3MuIE9iamVjdHMgd2lsbFxuICAgICAqIGJlIG1lcmdlZCBkaXJlY3RseSBvciAyLWl0ZW0gYXJyYXlzIHdpbGwgYmUgbWVyZ2VkIGFzIGtleSwgdmFsdWUgcGFpcnMuXG4gICAgICpcbiAgICAgKiBUaGUgYWNjdW11bGF0b3IgY2FuIGFsc28gYmUgYSB0cmFuc2Zvcm1lciBvYmplY3QgdGhhdCBwcm92aWRlcyBhIDItYXJpdHlcbiAgICAgKiByZWR1Y2luZyBpdGVyYXRvciBmdW5jdGlvbiwgc3RlcCwgMC1hcml0eSBpbml0aWFsIHZhbHVlIGZ1bmN0aW9uLCBpbml0LCBhbmRcbiAgICAgKiAxLWFyaXR5IHJlc3VsdCBleHRyYWN0aW9uIGZ1bmN0aW9uIHJlc3VsdC4gVGhlIHN0ZXAgZnVuY3Rpb24gaXMgdXNlZCBhcyB0aGVcbiAgICAgKiBpdGVyYXRvciBmdW5jdGlvbiBpbiByZWR1Y2UuIFRoZSByZXN1bHQgZnVuY3Rpb24gaXMgdXNlZCB0byBjb252ZXJ0IHRoZVxuICAgICAqIGZpbmFsIGFjY3VtdWxhdG9yIGludG8gdGhlIHJldHVybiB0eXBlIGFuZCBpbiBtb3N0IGNhc2VzIGlzIFIuaWRlbnRpdHkuIFRoZVxuICAgICAqIGluaXQgZnVuY3Rpb24gaXMgdXNlZCB0byBwcm92aWRlIHRoZSBpbml0aWFsIGFjY3VtdWxhdG9yLlxuICAgICAqXG4gICAgICogVGhlIGl0ZXJhdGlvbiBpcyBwZXJmb3JtZWQgd2l0aCBSLnJlZHVjZSBhZnRlciBpbml0aWFsaXppbmcgdGhlIHRyYW5zZHVjZXIuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgYSAtPiAoYiAtPiBiKSAtPiBbY10gLT4gYVxuICAgICAqIEBwYXJhbSB7Kn0gYWNjIFRoZSBpbml0aWFsIGFjY3VtdWxhdG9yIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHhmIFRoZSB0cmFuc2R1Y2VyIGZ1bmN0aW9uLiBSZWNlaXZlcyBhIHRyYW5zZm9ybWVyIGFuZCByZXR1cm5zIGEgdHJhbnNmb3JtZXIuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGZpbmFsLCBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbnVtYmVycyA9IFsxLCAyLCAzLCA0XTtcbiAgICAgKiAgICAgIHZhciB0cmFuc2R1Y2VyID0gUi5jb21wb3NlKFIubWFwKFIuYWRkKDEpKSwgUi50YWtlKDIpKTtcbiAgICAgKlxuICAgICAqICAgICAgUi5pbnRvKFtdLCB0cmFuc2R1Y2VyLCBudW1iZXJzKTsgLy89PiBbMiwgM11cbiAgICAgKlxuICAgICAqICAgICAgdmFyIGludG9BcnJheSA9IFIuaW50byhbXSk7XG4gICAgICogICAgICBpbnRvQXJyYXkodHJhbnNkdWNlciwgbnVtYmVycyk7IC8vPT4gWzIsIDNdXG4gICAgICovXG4gICAgdmFyIGludG8gPSBfY3VycnkzKGZ1bmN0aW9uIGludG8oYWNjLCB4ZiwgbGlzdCkge1xuICAgICAgICByZXR1cm4gX2lzVHJhbnNmb3JtZXIoYWNjKSA/IF9yZWR1Y2UoeGYoYWNjKSwgYWNjWydAQHRyYW5zZHVjZXIvaW5pdCddKCksIGxpc3QpIDogX3JlZHVjZSh4Zihfc3RlcENhdChhY2MpKSwgX2Nsb25lKGFjYywgW10sIFtdLCBmYWxzZSksIGxpc3QpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU2FtZSBhcyBSLmludmVydE9iaiwgaG93ZXZlciB0aGlzIGFjY291bnRzIGZvciBvYmplY3RzIHdpdGggZHVwbGljYXRlIHZhbHVlc1xuICAgICAqIGJ5IHB1dHRpbmcgdGhlIHZhbHVlcyBpbnRvIGFuIGFycmF5LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7czogeH0gLT4ge3g6IFsgcywgLi4uIF19XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IG9yIGFycmF5IHRvIGludmVydFxuICAgICAqIEByZXR1cm4ge09iamVjdH0gb3V0IEEgbmV3IG9iamVjdCB3aXRoIGtleXNcbiAgICAgKiBpbiBhbiBhcnJheS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgcmFjZVJlc3VsdHNCeUZpcnN0TmFtZSA9IHtcbiAgICAgKiAgICAgICAgZmlyc3Q6ICdhbGljZScsXG4gICAgICogICAgICAgIHNlY29uZDogJ2pha2UnLFxuICAgICAqICAgICAgICB0aGlyZDogJ2FsaWNlJyxcbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICBSLmludmVydChyYWNlUmVzdWx0c0J5Rmlyc3ROYW1lKTtcbiAgICAgKiAgICAgIC8vPT4geyAnYWxpY2UnOiBbJ2ZpcnN0JywgJ3RoaXJkJ10sICdqYWtlJzpbJ3NlY29uZCddIH1cbiAgICAgKi9cbiAgICB2YXIgaW52ZXJ0ID0gX2N1cnJ5MShmdW5jdGlvbiBpbnZlcnQob2JqKSB7XG4gICAgICAgIHZhciBwcm9wcyA9IGtleXMob2JqKTtcbiAgICAgICAgdmFyIGxlbiA9IHByb3BzLmxlbmd0aDtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBvdXQgPSB7fTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgdmFyIGtleSA9IHByb3BzW2lkeF07XG4gICAgICAgICAgICB2YXIgdmFsID0gb2JqW2tleV07XG4gICAgICAgICAgICB2YXIgbGlzdCA9IF9oYXModmFsLCBvdXQpID8gb3V0W3ZhbF0gOiBvdXRbdmFsXSA9IFtdO1xuICAgICAgICAgICAgbGlzdFtsaXN0Lmxlbmd0aF0gPSBrZXk7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBvYmplY3Qgd2l0aCB0aGUga2V5cyBvZiB0aGUgZ2l2ZW4gb2JqZWN0IGFzIHZhbHVlcywgYW5kIHRoZVxuICAgICAqIHZhbHVlcyBvZiB0aGUgZ2l2ZW4gb2JqZWN0LCB3aGljaCBhcmUgY29lcmNlZCB0byBzdHJpbmdzLCBhcyBrZXlzLiBOb3RlXG4gICAgICogdGhhdCB0aGUgbGFzdCBrZXkgZm91bmQgaXMgcHJlZmVycmVkIHdoZW4gaGFuZGxpbmcgdGhlIHNhbWUgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtzOiB4fSAtPiB7eDogc31cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3Qgb3IgYXJyYXkgdG8gaW52ZXJ0XG4gICAgICogQHJldHVybiB7T2JqZWN0fSBvdXQgQSBuZXcgb2JqZWN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHJhY2VSZXN1bHRzID0ge1xuICAgICAqICAgICAgICBmaXJzdDogJ2FsaWNlJyxcbiAgICAgKiAgICAgICAgc2Vjb25kOiAnamFrZSdcbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICBSLmludmVydE9iaihyYWNlUmVzdWx0cyk7XG4gICAgICogICAgICAvLz0+IHsgJ2FsaWNlJzogJ2ZpcnN0JywgJ2pha2UnOidzZWNvbmQnIH1cbiAgICAgKlxuICAgICAqICAgICAgLy8gQWx0ZXJuYXRpdmVseTpcbiAgICAgKiAgICAgIHZhciByYWNlUmVzdWx0cyA9IFsnYWxpY2UnLCAnamFrZSddO1xuICAgICAqICAgICAgUi5pbnZlcnRPYmoocmFjZVJlc3VsdHMpO1xuICAgICAqICAgICAgLy89PiB7ICdhbGljZSc6ICcwJywgJ2pha2UnOicxJyB9XG4gICAgICovXG4gICAgdmFyIGludmVydE9iaiA9IF9jdXJyeTEoZnVuY3Rpb24gaW52ZXJ0T2JqKG9iaikge1xuICAgICAgICB2YXIgcHJvcHMgPSBrZXlzKG9iaik7XG4gICAgICAgIHZhciBsZW4gPSBwcm9wcy5sZW5ndGg7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgb3V0ID0ge307XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBwcm9wc1tpZHhdO1xuICAgICAgICAgICAgb3V0W29ialtrZXldXSA9IGtleTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgaXRzIHR5cGUncyBlbXB0eSB2YWx1ZTsgYGZhbHNlYFxuICAgICAqIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyBhIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0geyp9IHhcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5lbXB0eVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuaXNFbXB0eShbMSwgMiwgM10pOyAgIC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuaXNFbXB0eShbXSk7ICAgICAgICAgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pc0VtcHR5KCcnKTsgICAgICAgICAgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzRW1wdHkobnVsbCk7ICAgICAgICAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmlzRW1wdHkoe30pOyAgICAgICAgICAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaXNFbXB0eSh7bGVuZ3RoOiAwfSk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgaXNFbXB0eSA9IF9jdXJyeTEoZnVuY3Rpb24gaXNFbXB0eSh4KSB7XG4gICAgICAgIHJldHVybiB4ICE9IG51bGwgJiYgZXF1YWxzKHgsIGVtcHR5KHgpKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgZ2l2ZW4gbGlzdCBvciBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuNFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gYSB8IFVuZGVmaW5lZFxuICAgICAqIEBzaWcgU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7Kn0gbGlzdFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLmluaXQsIFIuaGVhZCwgUi50YWlsXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5sYXN0KFsnZmknLCAnZm8nLCAnZnVtJ10pOyAvLz0+ICdmdW0nXG4gICAgICogICAgICBSLmxhc3QoW10pOyAvLz0+IHVuZGVmaW5lZFxuICAgICAqXG4gICAgICogICAgICBSLmxhc3QoJ2FiYycpOyAvLz0+ICdjJ1xuICAgICAqICAgICAgUi5sYXN0KCcnKTsgLy89PiAnJ1xuICAgICAqL1xuICAgIHZhciBsYXN0ID0gbnRoKC0xKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBvc2l0aW9uIG9mIHRoZSBsYXN0IG9jY3VycmVuY2Ugb2YgYW4gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTEgaWZcbiAgICAgKiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LiBgUi5lcXVhbHNgIGlzIHVzZWQgdG8gZGV0ZXJtaW5lXG4gICAgICogZXF1YWxpdHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBhIC0+IFthXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0geyp9IHRhcmdldCBUaGUgaXRlbSB0byBmaW5kLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHhzIFRoZSBhcnJheSB0byBzZWFyY2ggaW4uXG4gICAgICogQHJldHVybiB7TnVtYmVyfSB0aGUgaW5kZXggb2YgdGhlIHRhcmdldCwgb3IgLTEgaWYgdGhlIHRhcmdldCBpcyBub3QgZm91bmQuXG4gICAgICogQHNlZSBSLmluZGV4T2ZcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmxhc3RJbmRleE9mKDMsIFstMSwzLDMsMCwxLDIsMyw0XSk7IC8vPT4gNlxuICAgICAqICAgICAgUi5sYXN0SW5kZXhPZigxMCwgWzEsMiwzLDRdKTsgLy89PiAtMVxuICAgICAqL1xuICAgIHZhciBsYXN0SW5kZXhPZiA9IF9jdXJyeTIoZnVuY3Rpb24gbGFzdEluZGV4T2YodGFyZ2V0LCB4cykge1xuICAgICAgICBpZiAodHlwZW9mIHhzLmxhc3RJbmRleE9mID09PSAnZnVuY3Rpb24nICYmICFfaXNBcnJheSh4cykpIHtcbiAgICAgICAgICAgIHJldHVybiB4cy5sYXN0SW5kZXhPZih0YXJnZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlkeCA9IHhzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB3aGlsZSAoaWR4ID49IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoZXF1YWxzKHhzW2lkeF0sIHRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlkeDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4IC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgZnVuY3Rpb24gYW5kXG4gICAgICogYSBbZnVuY3Rvcl0oaHR0cHM6Ly9naXRodWIuY29tL2ZhbnRhc3lsYW5kL2ZhbnRhc3ktbGFuZCNmdW5jdG9yKSxcbiAgICAgKiBhcHBsaWVzIHRoZSBmdW5jdGlvbiB0byBlYWNoIG9mIHRoZSBmdW5jdG9yJ3MgdmFsdWVzLCBhbmQgcmV0dXJuc1xuICAgICAqIGEgZnVuY3RvciBvZiB0aGUgc2FtZSBzaGFwZS5cbiAgICAgKlxuICAgICAqIFJhbWRhIHByb3ZpZGVzIHN1aXRhYmxlIGBtYXBgIGltcGxlbWVudGF0aW9ucyBmb3IgYEFycmF5YCBhbmQgYE9iamVjdGAsXG4gICAgICogc28gdGhpcyBmdW5jdGlvbiBtYXkgYmUgYXBwbGllZCB0byBgWzEsIDIsIDNdYCBvciBge3g6IDEsIHk6IDIsIHo6IDN9YC5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBtYXBgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQWxzbyB0cmVhdHMgZnVuY3Rpb25zIGFzIGZ1bmN0b3JzIGFuZCB3aWxsIGNvbXBvc2UgdGhlbSB0b2dldGhlci5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIEZ1bmN0b3IgZiA9PiAoYSAtPiBiKSAtPiBmIGEgLT4gZiBiXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBldmVyeSBlbGVtZW50IG9mIHRoZSBpbnB1dCBgbGlzdGAuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBiZSBpdGVyYXRlZCBvdmVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbmV3IGxpc3QuXG4gICAgICogQHNlZSBSLnRyYW5zZHVjZSwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBkb3VibGUgPSB4ID0+IHggKiAyO1xuICAgICAqXG4gICAgICogICAgICBSLm1hcChkb3VibGUsIFsxLCAyLCAzXSk7IC8vPT4gWzIsIDQsIDZdXG4gICAgICpcbiAgICAgKiAgICAgIFIubWFwKGRvdWJsZSwge3g6IDEsIHk6IDIsIHo6IDN9KTsgLy89PiB7eDogMiwgeTogNCwgejogNn1cbiAgICAgKi9cbiAgICB2YXIgbWFwID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdtYXAnLCBfeG1hcCwgZnVuY3Rpb24gbWFwKGZuLCBmdW5jdG9yKSB7XG4gICAgICAgIHN3aXRjaCAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGZ1bmN0b3IpKSB7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgRnVuY3Rpb25dJzpcbiAgICAgICAgICAgIHJldHVybiBjdXJyeU4oZnVuY3Rvci5sZW5ndGgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBmdW5jdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgT2JqZWN0XSc6XG4gICAgICAgICAgICByZXR1cm4gX3JlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgICAgICAgICBhY2Nba2V5XSA9IGZuKGZ1bmN0b3Jba2V5XSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgIH0sIHt9LCBrZXlzKGZ1bmN0b3IpKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBfbWFwKGZuLCBmdW5jdG9yKTtcbiAgICAgICAgfVxuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIEFuIE9iamVjdC1zcGVjaWZpYyB2ZXJzaW9uIG9mIGBtYXBgLiBUaGUgZnVuY3Rpb24gaXMgYXBwbGllZCB0byB0aHJlZVxuICAgICAqIGFyZ3VtZW50czogKih2YWx1ZSwga2V5LCBvYmopKi4gSWYgb25seSB0aGUgdmFsdWUgaXMgc2lnbmlmaWNhbnQsIHVzZVxuICAgICAqIGBtYXBgIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnICgoKiwgU3RyaW5nLCBPYmplY3QpIC0+ICopIC0+IE9iamVjdCAtPiBPYmplY3RcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICogQHNlZSBSLm1hcFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB2YWx1ZXMgPSB7IHg6IDEsIHk6IDIsIHo6IDMgfTtcbiAgICAgKiAgICAgIHZhciBwcmVwZW5kS2V5QW5kRG91YmxlID0gKG51bSwga2V5LCBvYmopID0+IGtleSArIChudW0gKiAyKTtcbiAgICAgKlxuICAgICAqICAgICAgUi5tYXBPYmpJbmRleGVkKHByZXBlbmRLZXlBbmREb3VibGUsIHZhbHVlcyk7IC8vPT4geyB4OiAneDInLCB5OiAneTQnLCB6OiAnejYnIH1cbiAgICAgKi9cbiAgICB2YXIgbWFwT2JqSW5kZXhlZCA9IF9jdXJyeTIoZnVuY3Rpb24gbWFwT2JqSW5kZXhlZChmbiwgb2JqKSB7XG4gICAgICAgIHJldHVybiBfcmVkdWNlKGZ1bmN0aW9uIChhY2MsIGtleSkge1xuICAgICAgICAgICAgYWNjW2tleV0gPSBmbihvYmpba2V5XSwga2V5LCBvYmopO1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSwge30sIGtleXMob2JqKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIHRoZSBvd24gcHJvcGVydGllcyBvZiB0aGUgdHdvIHByb3ZpZGVkIG9iamVjdHMuIElmXG4gICAgICogYSBrZXkgZXhpc3RzIGluIGJvdGggb2JqZWN0cywgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uIGlzIGFwcGxpZWQgdG8gdGhlIHZhbHVlc1xuICAgICAqIGFzc29jaWF0ZWQgd2l0aCB0aGUga2V5IGluIGVhY2ggb2JqZWN0LCB3aXRoIHRoZSByZXN1bHQgYmVpbmcgdXNlZCBhcyB0aGVcbiAgICAgKiB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggdGhlIGtleSBpbiB0aGUgcmV0dXJuZWQgb2JqZWN0LiBUaGUga2V5IHdpbGwgYmVcbiAgICAgKiBleGNsdWRlZCBmcm9tIHRoZSByZXR1cm5lZCBvYmplY3QgaWYgdGhlIHJlc3VsdGluZyB2YWx1ZSBpcyBgdW5kZWZpbmVkYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIChhIC0+IGEgLT4gYSkgLT4ge2F9IC0+IHthfSAtPiB7YX1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICogQHNlZSBSLm1lcmdlLCBSLm1lcmdlV2l0aEtleVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubWVyZ2VXaXRoKFIuY29uY2F0LFxuICAgICAqICAgICAgICAgICAgICAgICAgeyBhOiB0cnVlLCB2YWx1ZXM6IFsxMCwgMjBdIH0sXG4gICAgICogICAgICAgICAgICAgICAgICB7IGI6IHRydWUsIHZhbHVlczogWzE1LCAzNV0gfSk7XG4gICAgICogICAgICAvLz0+IHsgYTogdHJ1ZSwgYjogdHJ1ZSwgdmFsdWVzOiBbMTAsIDIwLCAxNSwgMzVdIH1cbiAgICAgKi9cbiAgICB2YXIgbWVyZ2VXaXRoID0gX2N1cnJ5MyhmdW5jdGlvbiBtZXJnZVdpdGgoZm4sIGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIG1lcmdlV2l0aEtleShmdW5jdGlvbiAoXywgX2wsIF9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oX2wsIF9yKTtcbiAgICAgICAgfSwgbCwgcik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGZ1bmN0aW9uIGBmYCBhbmQgYSBsaXN0IG9mIGFyZ3VtZW50cywgYW5kIHJldHVybnMgYSBmdW5jdGlvbiBgZ2AuXG4gICAgICogV2hlbiBhcHBsaWVkLCBgZ2AgcmV0dXJucyB0aGUgcmVzdWx0IG9mIGFwcGx5aW5nIGBmYCB0byB0aGUgYXJndW1lbnRzXG4gICAgICogcHJvdmlkZWQgaW5pdGlhbGx5IGZvbGxvd2VkIGJ5IHRoZSBhcmd1bWVudHMgcHJvdmlkZWQgdG8gYGdgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMC4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKGEsIGIsIGMsIC4uLiwgbikgLT4geCkgLT4gW2EsIGIsIGMsIC4uLl0gLT4gKChkLCBlLCBmLCAuLi4sIG4pIC0+IHgpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIucGFydGlhbFJpZ2h0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG11bHRpcGx5ID0gKGEsIGIpID0+IGEgKiBiO1xuICAgICAqICAgICAgdmFyIGRvdWJsZSA9IFIucGFydGlhbChtdWx0aXBseSwgWzJdKTtcbiAgICAgKiAgICAgIGRvdWJsZSgyKTsgLy89PiA0XG4gICAgICpcbiAgICAgKiAgICAgIHZhciBncmVldCA9IChzYWx1dGF0aW9uLCB0aXRsZSwgZmlyc3ROYW1lLCBsYXN0TmFtZSkgPT5cbiAgICAgKiAgICAgICAgc2FsdXRhdGlvbiArICcsICcgKyB0aXRsZSArICcgJyArIGZpcnN0TmFtZSArICcgJyArIGxhc3ROYW1lICsgJyEnO1xuICAgICAqXG4gICAgICogICAgICB2YXIgc2F5SGVsbG8gPSBSLnBhcnRpYWwoZ3JlZXQsIFsnSGVsbG8nXSk7XG4gICAgICogICAgICB2YXIgc2F5SGVsbG9Ub01zID0gUi5wYXJ0aWFsKHNheUhlbGxvLCBbJ01zLiddKTtcbiAgICAgKiAgICAgIHNheUhlbGxvVG9NcygnSmFuZScsICdKb25lcycpOyAvLz0+ICdIZWxsbywgTXMuIEphbmUgSm9uZXMhJ1xuICAgICAqL1xuICAgIHZhciBwYXJ0aWFsID0gX2NyZWF0ZVBhcnRpYWxBcHBsaWNhdG9yKF9jb25jYXQpO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBmdW5jdGlvbiBgZmAgYW5kIGEgbGlzdCBvZiBhcmd1bWVudHMsIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gYGdgLlxuICAgICAqIFdoZW4gYXBwbGllZCwgYGdgIHJldHVybnMgdGhlIHJlc3VsdCBvZiBhcHBseWluZyBgZmAgdG8gdGhlIGFyZ3VtZW50c1xuICAgICAqIHByb3ZpZGVkIHRvIGBnYCBmb2xsb3dlZCBieSB0aGUgYXJndW1lbnRzIHByb3ZpZGVkIGluaXRpYWxseS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKChhLCBiLCBjLCAuLi4sIG4pIC0+IHgpIC0+IFtkLCBlLCBmLCAuLi4sIG5dIC0+ICgoYSwgYiwgYywgLi4uKSAtPiB4KVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcmdzXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQHNlZSBSLnBhcnRpYWxcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZ3JlZXQgPSAoc2FsdXRhdGlvbiwgdGl0bGUsIGZpcnN0TmFtZSwgbGFzdE5hbWUpID0+XG4gICAgICogICAgICAgIHNhbHV0YXRpb24gKyAnLCAnICsgdGl0bGUgKyAnICcgKyBmaXJzdE5hbWUgKyAnICcgKyBsYXN0TmFtZSArICchJztcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGdyZWV0TXNKYW5lSm9uZXMgPSBSLnBhcnRpYWxSaWdodChncmVldCwgWydNcy4nLCAnSmFuZScsICdKb25lcyddKTtcbiAgICAgKlxuICAgICAqICAgICAgZ3JlZXRNc0phbmVKb25lcygnSGVsbG8nKTsgLy89PiAnSGVsbG8sIE1zLiBKYW5lIEpvbmVzISdcbiAgICAgKi9cbiAgICB2YXIgcGFydGlhbFJpZ2h0ID0gX2NyZWF0ZVBhcnRpYWxBcHBsaWNhdG9yKGZsaXAoX2NvbmNhdCkpO1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgbmVzdGVkIHBhdGggb24gYW4gb2JqZWN0IGhhcyBhIHNwZWNpZmljIHZhbHVlLCBpblxuICAgICAqIGBSLmVxdWFsc2AgdGVybXMuIE1vc3QgbGlrZWx5IHVzZWQgdG8gZmlsdGVyIGEgbGlzdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNy4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBbU3RyaW5nXSAtPiAqIC0+IHtTdHJpbmc6ICp9IC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBuZXN0ZWQgcHJvcGVydHkgdG8gdXNlXG4gICAgICogQHBhcmFtIHsqfSB2YWwgVGhlIHZhbHVlIHRvIGNvbXBhcmUgdGhlIG5lc3RlZCBwcm9wZXJ0eSB3aXRoXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGNoZWNrIHRoZSBuZXN0ZWQgcHJvcGVydHkgaW5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIHZhbHVlIGVxdWFscyB0aGUgbmVzdGVkIG9iamVjdCBwcm9wZXJ0eSxcbiAgICAgKiAgICAgICAgIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB1c2VyMSA9IHsgYWRkcmVzczogeyB6aXBDb2RlOiA5MDIxMCB9IH07XG4gICAgICogICAgICB2YXIgdXNlcjIgPSB7IGFkZHJlc3M6IHsgemlwQ29kZTogNTU1NTUgfSB9O1xuICAgICAqICAgICAgdmFyIHVzZXIzID0geyBuYW1lOiAnQm9iJyB9O1xuICAgICAqICAgICAgdmFyIHVzZXJzID0gWyB1c2VyMSwgdXNlcjIsIHVzZXIzIF07XG4gICAgICogICAgICB2YXIgaXNGYW1vdXMgPSBSLnBhdGhFcShbJ2FkZHJlc3MnLCAnemlwQ29kZSddLCA5MDIxMCk7XG4gICAgICogICAgICBSLmZpbHRlcihpc0ZhbW91cywgdXNlcnMpOyAvLz0+IFsgdXNlcjEgXVxuICAgICAqL1xuICAgIHZhciBwYXRoRXEgPSBfY3VycnkzKGZ1bmN0aW9uIHBhdGhFcShfcGF0aCwgdmFsLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIGVxdWFscyhwYXRoKF9wYXRoLCBvYmopLCB2YWwpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGJ5IHBsdWNraW5nIHRoZSBzYW1lIG5hbWVkIHByb3BlcnR5IG9mZiBhbGwgb2JqZWN0cyBpblxuICAgICAqIHRoZSBsaXN0IHN1cHBsaWVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgayAtPiBbe2s6IHZ9XSAtPiBbdl1cbiAgICAgKiBAcGFyYW0ge051bWJlcnxTdHJpbmd9IGtleSBUaGUga2V5IG5hbWUgdG8gcGx1Y2sgb2ZmIG9mIGVhY2ggb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBvZiB2YWx1ZXMgZm9yIHRoZSBnaXZlbiBrZXkuXG4gICAgICogQHNlZSBSLnByb3BzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wbHVjaygnYScpKFt7YTogMX0sIHthOiAyfV0pOyAvLz0+IFsxLCAyXVxuICAgICAqICAgICAgUi5wbHVjaygwKShbWzEsIDJdLCBbMywgNF1dKTsgICAvLz0+IFsxLCAzXVxuICAgICAqL1xuICAgIHZhciBwbHVjayA9IF9jdXJyeTIoZnVuY3Rpb24gcGx1Y2socCwgbGlzdCkge1xuICAgICAgICByZXR1cm4gbWFwKHByb3AocCksIGxpc3QpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmVhc29uYWJsZSBhbmFsb2cgdG8gU1FMIGBzZWxlY3RgIHN0YXRlbWVudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgW2tdIC0+IFt7azogdn1dIC0+IFt7azogdn1dXG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcHMgVGhlIHByb3BlcnR5IG5hbWVzIHRvIHByb2plY3RcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBvYmpzIFRoZSBvYmplY3RzIHRvIHF1ZXJ5XG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIG9iamVjdHMgd2l0aCBqdXN0IHRoZSBgcHJvcHNgIHByb3BlcnRpZXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGFiYnkgPSB7bmFtZTogJ0FiYnknLCBhZ2U6IDcsIGhhaXI6ICdibG9uZCcsIGdyYWRlOiAyfTtcbiAgICAgKiAgICAgIHZhciBmcmVkID0ge25hbWU6ICdGcmVkJywgYWdlOiAxMiwgaGFpcjogJ2Jyb3duJywgZ3JhZGU6IDd9O1xuICAgICAqICAgICAgdmFyIGtpZHMgPSBbYWJieSwgZnJlZF07XG4gICAgICogICAgICBSLnByb2plY3QoWyduYW1lJywgJ2dyYWRlJ10sIGtpZHMpOyAvLz0+IFt7bmFtZTogJ0FiYnknLCBncmFkZTogMn0sIHtuYW1lOiAnRnJlZCcsIGdyYWRlOiA3fV1cbiAgICAgKi9cbiAgICAvLyBwYXNzaW5nIGBpZGVudGl0eWAgZ2l2ZXMgY29ycmVjdCBhcml0eVxuICAgIHZhciBwcm9qZWN0ID0gdXNlV2l0aChfbWFwLCBbXG4gICAgICAgIHBpY2tBbGwsXG4gICAgICAgIGlkZW50aXR5XG4gICAgXSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgc3BlY2lmaWVkIG9iamVjdCBwcm9wZXJ0eSBpcyBlcXVhbCwgaW4gYFIuZXF1YWxzYFxuICAgICAqIHRlcm1zLCB0byB0aGUgZ2l2ZW4gdmFsdWU7IGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIFN0cmluZyAtPiBhIC0+IE9iamVjdCAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICAgKiBAcGFyYW0geyp9IHZhbFxuICAgICAqIEBwYXJhbSB7Kn0gb2JqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAc2VlIFIuZXF1YWxzLCBSLnByb3BTYXRpc2ZpZXNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYWJieSA9IHtuYW1lOiAnQWJieScsIGFnZTogNywgaGFpcjogJ2Jsb25kJ307XG4gICAgICogICAgICB2YXIgZnJlZCA9IHtuYW1lOiAnRnJlZCcsIGFnZTogMTIsIGhhaXI6ICdicm93bid9O1xuICAgICAqICAgICAgdmFyIHJ1c3R5ID0ge25hbWU6ICdSdXN0eScsIGFnZTogMTAsIGhhaXI6ICdicm93bid9O1xuICAgICAqICAgICAgdmFyIGFsb2lzID0ge25hbWU6ICdBbG9pcycsIGFnZTogMTUsIGRpc3Bvc2l0aW9uOiAnc3VybHknfTtcbiAgICAgKiAgICAgIHZhciBraWRzID0gW2FiYnksIGZyZWQsIHJ1c3R5LCBhbG9pc107XG4gICAgICogICAgICB2YXIgaGFzQnJvd25IYWlyID0gUi5wcm9wRXEoJ2hhaXInLCAnYnJvd24nKTtcbiAgICAgKiAgICAgIFIuZmlsdGVyKGhhc0Jyb3duSGFpciwga2lkcyk7IC8vPT4gW2ZyZWQsIHJ1c3R5XVxuICAgICAqL1xuICAgIHZhciBwcm9wRXEgPSBfY3VycnkzKGZ1bmN0aW9uIHByb3BFcShuYW1lLCB2YWwsIG9iaikge1xuICAgICAgICByZXR1cm4gcHJvcFNhdGlzZmllcyhlcXVhbHModmFsKSwgbmFtZSwgb2JqKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBzcGVjaWZpZWQgb2JqZWN0IHByb3BlcnR5IGlzIG9mIHRoZSBnaXZlbiB0eXBlO1xuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IFR5cGVcbiAgICAgKiBAc2lnIFR5cGUgLT4gU3RyaW5nIC0+IE9iamVjdCAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gdHlwZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHsqfSBvYmpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5pcywgUi5wcm9wU2F0aXNmaWVzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wcm9wSXMoTnVtYmVyLCAneCcsIHt4OiAxLCB5OiAyfSk7ICAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIucHJvcElzKE51bWJlciwgJ3gnLCB7eDogJ2Zvbyd9KTsgICAgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5wcm9wSXMoTnVtYmVyLCAneCcsIHt9KTsgICAgICAgICAgICAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIHByb3BJcyA9IF9jdXJyeTMoZnVuY3Rpb24gcHJvcElzKHR5cGUsIG5hbWUsIG9iaikge1xuICAgICAgICByZXR1cm4gcHJvcFNhdGlzZmllcyhpcyh0eXBlKSwgbmFtZSwgb2JqKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBzaW5nbGUgaXRlbSBieSBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgbGlzdCwgc3VjY2Vzc2l2ZWx5IGNhbGxpbmdcbiAgICAgKiB0aGUgaXRlcmF0b3IgZnVuY3Rpb24gYW5kIHBhc3NpbmcgaXQgYW4gYWNjdW11bGF0b3IgdmFsdWUgYW5kIHRoZSBjdXJyZW50XG4gICAgICogdmFsdWUgZnJvbSB0aGUgYXJyYXksIGFuZCB0aGVuIHBhc3NpbmcgdGhlIHJlc3VsdCB0byB0aGUgbmV4dCBjYWxsLlxuICAgICAqXG4gICAgICogVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIHJlY2VpdmVzIHR3byB2YWx1ZXM6ICooYWNjLCB2YWx1ZSkqLiBJdCBtYXkgdXNlXG4gICAgICogYFIucmVkdWNlZGAgdG8gc2hvcnRjdXQgdGhlIGl0ZXJhdGlvbi5cbiAgICAgKlxuICAgICAqIE5vdGU6IGBSLnJlZHVjZWAgZG9lcyBub3Qgc2tpcCBkZWxldGVkIG9yIHVuYXNzaWduZWQgaW5kaWNlcyAoc3BhcnNlXG4gICAgICogYXJyYXlzKSwgdW5saWtlIHRoZSBuYXRpdmUgYEFycmF5LnByb3RvdHlwZS5yZWR1Y2VgIG1ldGhvZC4gRm9yIG1vcmUgZGV0YWlsc1xuICAgICAqIG9uIHRoaXMgYmVoYXZpb3IsIHNlZTpcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9yZWR1Y2UjRGVzY3JpcHRpb25cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGByZWR1Y2VgIG1ldGhvZCBvZiB0aGUgdGhpcmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoKGEsIGIpIC0+IGEpIC0+IGEgLT4gW2JdIC0+IGFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24uIFJlY2VpdmVzIHR3byB2YWx1ZXMsIHRoZSBhY2N1bXVsYXRvciBhbmQgdGhlXG4gICAgICogICAgICAgIGN1cnJlbnQgZWxlbWVudCBmcm9tIHRoZSBhcnJheS5cbiAgICAgKiBAcGFyYW0geyp9IGFjYyBUaGUgYWNjdW11bGF0b3IgdmFsdWUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGZpbmFsLCBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAc2VlIFIucmVkdWNlZCwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBudW1iZXJzID0gWzEsIDIsIDNdO1xuICAgICAqICAgICAgdmFyIGFkZCA9IChhLCBiKSA9PiBhICsgYjtcbiAgICAgKlxuICAgICAqICAgICAgUi5yZWR1Y2UoYWRkLCAxMCwgbnVtYmVycyk7IC8vPT4gMTZcbiAgICAgKi9cbiAgICB2YXIgcmVkdWNlID0gX2N1cnJ5MyhfcmVkdWNlKTtcblxuICAgIC8qKlxuICAgICAqIEdyb3VwcyB0aGUgZWxlbWVudHMgb2YgdGhlIGxpc3QgYWNjb3JkaW5nIHRvIHRoZSByZXN1bHQgb2YgY2FsbGluZ1xuICAgICAqIHRoZSBTdHJpbmctcmV0dXJuaW5nIGZ1bmN0aW9uIGBrZXlGbmAgb24gZWFjaCBlbGVtZW50IGFuZCByZWR1Y2VzIHRoZSBlbGVtZW50c1xuICAgICAqIG9mIGVhY2ggZ3JvdXAgdG8gYSBzaW5nbGUgdmFsdWUgdmlhIHRoZSByZWR1Y2VyIGZ1bmN0aW9uIGB2YWx1ZUZuYC5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gaXMgYmFzaWNhbGx5IGEgbW9yZSBnZW5lcmFsIGBncm91cEJ5YCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMjAuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoKGEsIGIpIC0+IGEpIC0+IGEgLT4gKGIgLT4gU3RyaW5nKSAtPiBbYl0gLT4ge1N0cmluZzogYX1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSB2YWx1ZUZuIFRoZSBmdW5jdGlvbiB0aGF0IHJlZHVjZXMgdGhlIGVsZW1lbnRzIG9mIGVhY2ggZ3JvdXAgdG8gYSBzaW5nbGVcbiAgICAgKiAgICAgICAgdmFsdWUuIFJlY2VpdmVzIHR3byB2YWx1ZXMsIGFjY3VtdWxhdG9yIGZvciBhIHBhcnRpY3VsYXIgZ3JvdXAgYW5kIHRoZSBjdXJyZW50IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHsqfSBhY2MgVGhlIChpbml0aWFsKSBhY2N1bXVsYXRvciB2YWx1ZSBmb3IgZWFjaCBncm91cC5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBrZXlGbiBUaGUgZnVuY3Rpb24gdGhhdCBtYXBzIHRoZSBsaXN0J3MgZWxlbWVudCBpbnRvIGEga2V5LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGdyb3VwLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQW4gb2JqZWN0IHdpdGggdGhlIG91dHB1dCBvZiBga2V5Rm5gIGZvciBrZXlzLCBtYXBwZWQgdG8gdGhlIG91dHB1dCBvZlxuICAgICAqICAgICAgICAgYHZhbHVlRm5gIGZvciBlbGVtZW50cyB3aGljaCBwcm9kdWNlZCB0aGF0IGtleSB3aGVuIHBhc3NlZCB0byBga2V5Rm5gLlxuICAgICAqIEBzZWUgUi5ncm91cEJ5LCBSLnJlZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciByZWR1Y2VUb05hbWVzQnkgPSBSLnJlZHVjZUJ5KChhY2MsIHN0dWRlbnQpID0+IGFjYy5jb25jYXQoc3R1ZGVudC5uYW1lKSwgW10pO1xuICAgICAqICAgICAgdmFyIG5hbWVzQnlHcmFkZSA9IHJlZHVjZVRvTmFtZXNCeShmdW5jdGlvbihzdHVkZW50KSB7XG4gICAgICogICAgICAgIHZhciBzY29yZSA9IHN0dWRlbnQuc2NvcmU7XG4gICAgICogICAgICAgIHJldHVybiBzY29yZSA8IDY1ID8gJ0YnIDpcbiAgICAgKiAgICAgICAgICAgICAgIHNjb3JlIDwgNzAgPyAnRCcgOlxuICAgICAqICAgICAgICAgICAgICAgc2NvcmUgPCA4MCA/ICdDJyA6XG4gICAgICogICAgICAgICAgICAgICBzY29yZSA8IDkwID8gJ0InIDogJ0EnO1xuICAgICAqICAgICAgfSk7XG4gICAgICogICAgICB2YXIgc3R1ZGVudHMgPSBbe25hbWU6ICdMdWN5Jywgc2NvcmU6IDkyfSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICB7bmFtZTogJ0RyZXcnLCBzY29yZTogODV9LFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgIHtuYW1lOiAnQmFydCcsIHNjb3JlOiA2Mn1dO1xuICAgICAqICAgICAgbmFtZXNCeUdyYWRlKHN0dWRlbnRzKTtcbiAgICAgKiAgICAgIC8vIHtcbiAgICAgKiAgICAgIC8vICAgJ0EnOiBbJ0x1Y3knXSxcbiAgICAgKiAgICAgIC8vICAgJ0InOiBbJ0RyZXcnXVxuICAgICAqICAgICAgLy8gICAvLyAuLi4sXG4gICAgICogICAgICAvLyAgICdGJzogWydCYXJ0J11cbiAgICAgKiAgICAgIC8vIH1cbiAgICAgKi9cbiAgICB2YXIgcmVkdWNlQnkgPSBfY3VycnlOKDQsIFtdLCBmdW5jdGlvbiByZWR1Y2VCeSh2YWx1ZUZuLCB2YWx1ZUFjYywga2V5Rm4sIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIF9yZWR1Y2UoZnVuY3Rpb24gKGFjYywgZWx0KSB7XG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5Rm4oZWx0KTtcbiAgICAgICAgICAgIGFjY1trZXldID0gdmFsdWVGbihfaGFzKGtleSwgYWNjKSA/IGFjY1trZXldIDogdmFsdWVBY2MsIGVsdCk7XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LCB7fSwgbGlzdCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY29tcGxlbWVudCBvZiBgZmlsdGVyYC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIEZpbHRlcmFibGUgZiA9PiAoYSAtPiBCb29sZWFuKSAtPiBmIGEgLT4gZiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGZpbHRlcmFibGVcbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKiBAc2VlIFIuZmlsdGVyLCBSLnRyYW5zZHVjZSwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBpc09kZCA9IChuKSA9PiBuICUgMiA9PT0gMTtcbiAgICAgKlxuICAgICAqICAgICAgUi5yZWplY3QoaXNPZGQsIFsxLCAyLCAzLCA0XSk7IC8vPT4gWzIsIDRdXG4gICAgICpcbiAgICAgKiAgICAgIFIucmVqZWN0KGlzT2RkLCB7YTogMSwgYjogMiwgYzogMywgZDogNH0pOyAvLz0+IHtiOiAyLCBkOiA0fVxuICAgICAqL1xuICAgIHZhciByZWplY3QgPSBfY3VycnkyKGZ1bmN0aW9uIHJlamVjdChwcmVkLCBmaWx0ZXJhYmxlKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIoX2NvbXBsZW1lbnQocHJlZCksIGZpbHRlcmFibGUpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZpeGVkIGxpc3Qgb2Ygc2l6ZSBgbmAgY29udGFpbmluZyBhIHNwZWNpZmllZCBpZGVudGljYWwgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMVxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBhIC0+IG4gLT4gW2FdXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcmVwZWF0LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIFRoZSBkZXNpcmVkIHNpemUgb2YgdGhlIG91dHB1dCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBhcnJheSBjb250YWluaW5nIGBuYCBgdmFsdWVgcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnJlcGVhdCgnaGknLCA1KTsgLy89PiBbJ2hpJywgJ2hpJywgJ2hpJywgJ2hpJywgJ2hpJ11cbiAgICAgKlxuICAgICAqICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAqICAgICAgdmFyIHJlcGVhdGVkT2JqcyA9IFIucmVwZWF0KG9iaiwgNSk7IC8vPT4gW3t9LCB7fSwge30sIHt9LCB7fV1cbiAgICAgKiAgICAgIHJlcGVhdGVkT2Jqc1swXSA9PT0gcmVwZWF0ZWRPYmpzWzFdOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgcmVwZWF0ID0gX2N1cnJ5MihmdW5jdGlvbiByZXBlYXQodmFsdWUsIG4pIHtcbiAgICAgICAgcmV0dXJuIHRpbWVzKGFsd2F5cyh2YWx1ZSksIG4pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQWRkcyB0b2dldGhlciBhbGwgdGhlIGVsZW1lbnRzIG9mIGEgbGlzdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIFtOdW1iZXJdIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgQW4gYXJyYXkgb2YgbnVtYmVyc1xuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIHN1bSBvZiBhbGwgdGhlIG51bWJlcnMgaW4gdGhlIGxpc3QuXG4gICAgICogQHNlZSBSLnJlZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuc3VtKFsyLDQsNiw4LDEwMCwxXSk7IC8vPT4gMTIxXG4gICAgICovXG4gICAgdmFyIHN1bSA9IHJlZHVjZShhZGQsIDApO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnRhaW5pbmcgdGhlIGxhc3QgYG5gIGVsZW1lbnRzIG9mIHRoZSBnaXZlbiBsaXN0LlxuICAgICAqIElmIGBuID4gbGlzdC5sZW5ndGhgLCByZXR1cm5zIGEgbGlzdCBvZiBgbGlzdC5sZW5ndGhgIGVsZW1lbnRzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBbYV0gLT4gW2FdXG4gICAgICogQHNpZyBOdW1iZXIgLT4gU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgdG8gcmV0dXJuLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHhzIFRoZSBjb2xsZWN0aW9uIHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAqIEBzZWUgUi5kcm9wTGFzdFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudGFrZUxhc3QoMSwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2JheiddXG4gICAgICogICAgICBSLnRha2VMYXN0KDIsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydiYXInLCAnYmF6J11cbiAgICAgKiAgICAgIFIudGFrZUxhc3QoMywgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2ZvbycsICdiYXInLCAnYmF6J11cbiAgICAgKiAgICAgIFIudGFrZUxhc3QoNCwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2ZvbycsICdiYXInLCAnYmF6J11cbiAgICAgKiAgICAgIFIudGFrZUxhc3QoMywgJ3JhbWRhJyk7ICAgICAgICAgICAgICAgLy89PiAnbWRhJ1xuICAgICAqL1xuICAgIHZhciB0YWtlTGFzdCA9IF9jdXJyeTIoZnVuY3Rpb24gdGFrZUxhc3QobiwgeHMpIHtcbiAgICAgICAgcmV0dXJuIGRyb3AobiA+PSAwID8geHMubGVuZ3RoIC0gbiA6IDAsIHhzKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGEgdHJhbnNkdWNlciB1c2luZyBzdXBwbGllZCBpdGVyYXRvciBmdW5jdGlvbi4gUmV0dXJucyBhIHNpbmdsZVxuICAgICAqIGl0ZW0gYnkgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGxpc3QsIHN1Y2Nlc3NpdmVseSBjYWxsaW5nIHRoZSB0cmFuc2Zvcm1lZFxuICAgICAqIGl0ZXJhdG9yIGZ1bmN0aW9uIGFuZCBwYXNzaW5nIGl0IGFuIGFjY3VtdWxhdG9yIHZhbHVlIGFuZCB0aGUgY3VycmVudCB2YWx1ZVxuICAgICAqIGZyb20gdGhlIGFycmF5LCBhbmQgdGhlbiBwYXNzaW5nIHRoZSByZXN1bHQgdG8gdGhlIG5leHQgY2FsbC5cbiAgICAgKlxuICAgICAqIFRoZSBpdGVyYXRvciBmdW5jdGlvbiByZWNlaXZlcyB0d28gdmFsdWVzOiAqKGFjYywgdmFsdWUpKi4gSXQgd2lsbCBiZVxuICAgICAqIHdyYXBwZWQgYXMgYSB0cmFuc2Zvcm1lciB0byBpbml0aWFsaXplIHRoZSB0cmFuc2R1Y2VyLiBBIHRyYW5zZm9ybWVyIGNhbiBiZVxuICAgICAqIHBhc3NlZCBkaXJlY3RseSBpbiBwbGFjZSBvZiBhbiBpdGVyYXRvciBmdW5jdGlvbi4gSW4gYm90aCBjYXNlcywgaXRlcmF0aW9uXG4gICAgICogbWF5IGJlIHN0b3BwZWQgZWFybHkgd2l0aCB0aGUgYFIucmVkdWNlZGAgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBBIHRyYW5zZHVjZXIgaXMgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSB0cmFuc2Zvcm1lciBhbmQgcmV0dXJucyBhXG4gICAgICogdHJhbnNmb3JtZXIgYW5kIGNhbiBiZSBjb21wb3NlZCBkaXJlY3RseS5cbiAgICAgKlxuICAgICAqIEEgdHJhbnNmb3JtZXIgaXMgYW4gYW4gb2JqZWN0IHRoYXQgcHJvdmlkZXMgYSAyLWFyaXR5IHJlZHVjaW5nIGl0ZXJhdG9yXG4gICAgICogZnVuY3Rpb24sIHN0ZXAsIDAtYXJpdHkgaW5pdGlhbCB2YWx1ZSBmdW5jdGlvbiwgaW5pdCwgYW5kIDEtYXJpdHkgcmVzdWx0XG4gICAgICogZXh0cmFjdGlvbiBmdW5jdGlvbiwgcmVzdWx0LiBUaGUgc3RlcCBmdW5jdGlvbiBpcyB1c2VkIGFzIHRoZSBpdGVyYXRvclxuICAgICAqIGZ1bmN0aW9uIGluIHJlZHVjZS4gVGhlIHJlc3VsdCBmdW5jdGlvbiBpcyB1c2VkIHRvIGNvbnZlcnQgdGhlIGZpbmFsXG4gICAgICogYWNjdW11bGF0b3IgaW50byB0aGUgcmV0dXJuIHR5cGUgYW5kIGluIG1vc3QgY2FzZXMgaXMgUi5pZGVudGl0eS4gVGhlIGluaXRcbiAgICAgKiBmdW5jdGlvbiBjYW4gYmUgdXNlZCB0byBwcm92aWRlIGFuIGluaXRpYWwgYWNjdW11bGF0b3IsIGJ1dCBpcyBpZ25vcmVkIGJ5XG4gICAgICogdHJhbnNkdWNlLlxuICAgICAqXG4gICAgICogVGhlIGl0ZXJhdGlvbiBpcyBwZXJmb3JtZWQgd2l0aCBSLnJlZHVjZSBhZnRlciBpbml0aWFsaXppbmcgdGhlIHRyYW5zZHVjZXIuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGMgLT4gYykgLT4gKGEsYiAtPiBhKSAtPiBhIC0+IFtiXSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0geGYgVGhlIHRyYW5zZHVjZXIgZnVuY3Rpb24uIFJlY2VpdmVzIGEgdHJhbnNmb3JtZXIgYW5kIHJldHVybnMgYSB0cmFuc2Zvcm1lci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24uIFJlY2VpdmVzIHR3byB2YWx1ZXMsIHRoZSBhY2N1bXVsYXRvciBhbmQgdGhlXG4gICAgICogICAgICAgIGN1cnJlbnQgZWxlbWVudCBmcm9tIHRoZSBhcnJheS4gV3JhcHBlZCBhcyB0cmFuc2Zvcm1lciwgaWYgbmVjZXNzYXJ5LCBhbmQgdXNlZCB0b1xuICAgICAqICAgICAgICBpbml0aWFsaXplIHRoZSB0cmFuc2R1Y2VyXG4gICAgICogQHBhcmFtIHsqfSBhY2MgVGhlIGluaXRpYWwgYWNjdW11bGF0b3IgdmFsdWUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGZpbmFsLCBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAc2VlIFIucmVkdWNlLCBSLnJlZHVjZWQsIFIuaW50b1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBudW1iZXJzID0gWzEsIDIsIDMsIDRdO1xuICAgICAqICAgICAgdmFyIHRyYW5zZHVjZXIgPSBSLmNvbXBvc2UoUi5tYXAoUi5hZGQoMSkpLCBSLnRha2UoMikpO1xuICAgICAqXG4gICAgICogICAgICBSLnRyYW5zZHVjZSh0cmFuc2R1Y2VyLCBSLmZsaXAoUi5hcHBlbmQpLCBbXSwgbnVtYmVycyk7IC8vPT4gWzIsIDNdXG4gICAgICovXG4gICAgdmFyIHRyYW5zZHVjZSA9IGN1cnJ5Tig0LCBmdW5jdGlvbiB0cmFuc2R1Y2UoeGYsIGZuLCBhY2MsIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIF9yZWR1Y2UoeGYodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nID8gX3h3cmFwKGZuKSA6IGZuKSwgYWNjLCBsaXN0KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENvbWJpbmVzIHR3byBsaXN0cyBpbnRvIGEgc2V0IChpLmUuIG5vIGR1cGxpY2F0ZXMpIGNvbXBvc2VkIG9mIHRoZSBlbGVtZW50c1xuICAgICAqIG9mIGVhY2ggbGlzdC4gRHVwbGljYXRpb24gaXMgZGV0ZXJtaW5lZCBhY2NvcmRpbmcgdG8gdGhlIHZhbHVlIHJldHVybmVkIGJ5XG4gICAgICogYXBwbHlpbmcgdGhlIHN1cHBsaWVkIHByZWRpY2F0ZSB0byB0d28gbGlzdCBlbGVtZW50cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyAoYSAtPiBhIC0+IEJvb2xlYW4pIC0+IFsqXSAtPiBbKl0gLT4gWypdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBBIHByZWRpY2F0ZSB1c2VkIHRvIHRlc3Qgd2hldGhlciB0d28gaXRlbXMgYXJlIGVxdWFsLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSBmaXJzdCBsaXN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBzZWNvbmQgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGZpcnN0IGFuZCBzZWNvbmQgbGlzdHMgY29uY2F0ZW5hdGVkLCB3aXRoXG4gICAgICogICAgICAgICBkdXBsaWNhdGVzIHJlbW92ZWQuXG4gICAgICogQHNlZSBSLnVuaW9uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGwxID0gW3thOiAxfSwge2E6IDJ9XTtcbiAgICAgKiAgICAgIHZhciBsMiA9IFt7YTogMX0sIHthOiA0fV07XG4gICAgICogICAgICBSLnVuaW9uV2l0aChSLmVxQnkoUi5wcm9wKCdhJykpLCBsMSwgbDIpOyAvLz0+IFt7YTogMX0sIHthOiAyfSwge2E6IDR9XVxuICAgICAqL1xuICAgIHZhciB1bmlvbldpdGggPSBfY3VycnkzKGZ1bmN0aW9uIHVuaW9uV2l0aChwcmVkLCBsaXN0MSwgbGlzdDIpIHtcbiAgICAgICAgcmV0dXJuIHVuaXFXaXRoKHByZWQsIF9jb25jYXQobGlzdDEsIGxpc3QyKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIHNwZWMgb2JqZWN0IGFuZCBhIHRlc3Qgb2JqZWN0OyByZXR1cm5zIHRydWUgaWYgdGhlIHRlc3Qgc2F0aXNmaWVzXG4gICAgICogdGhlIHNwZWMsIGZhbHNlIG90aGVyd2lzZS4gQW4gb2JqZWN0IHNhdGlzZmllcyB0aGUgc3BlYyBpZiwgZm9yIGVhY2ggb2YgdGhlXG4gICAgICogc3BlYydzIG93biBwcm9wZXJ0aWVzLCBhY2Nlc3NpbmcgdGhhdCBwcm9wZXJ0eSBvZiB0aGUgb2JqZWN0IGdpdmVzIHRoZSBzYW1lXG4gICAgICogdmFsdWUgKGluIGBSLmVxdWFsc2AgdGVybXMpIGFzIGFjY2Vzc2luZyB0aGF0IHByb3BlcnR5IG9mIHRoZSBzcGVjLlxuICAgICAqXG4gICAgICogYHdoZXJlRXFgIGlzIGEgc3BlY2lhbGl6YXRpb24gb2YgW2B3aGVyZWBdKCN3aGVyZSkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7U3RyaW5nOiAqfSAtPiB7U3RyaW5nOiAqfSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNwZWNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gdGVzdE9ialxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLndoZXJlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gcHJlZCA6OiBPYmplY3QgLT4gQm9vbGVhblxuICAgICAqICAgICAgdmFyIHByZWQgPSBSLndoZXJlRXEoe2E6IDEsIGI6IDJ9KTtcbiAgICAgKlxuICAgICAqICAgICAgcHJlZCh7YTogMX0pOyAgICAgICAgICAgICAgLy89PiBmYWxzZVxuICAgICAqICAgICAgcHJlZCh7YTogMSwgYjogMn0pOyAgICAgICAgLy89PiB0cnVlXG4gICAgICogICAgICBwcmVkKHthOiAxLCBiOiAyLCBjOiAzfSk7ICAvLz0+IHRydWVcbiAgICAgKiAgICAgIHByZWQoe2E6IDEsIGI6IDF9KTsgICAgICAgIC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgd2hlcmVFcSA9IF9jdXJyeTIoZnVuY3Rpb24gd2hlcmVFcShzcGVjLCB0ZXN0T2JqKSB7XG4gICAgICAgIHJldHVybiB3aGVyZShtYXAoZXF1YWxzLCBzcGVjKSwgdGVzdE9iaik7XG4gICAgfSk7XG5cbiAgICB2YXIgX2ZsYXRDYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcmVzZXJ2aW5nUmVkdWNlZCA9IGZ1bmN0aW9uICh4Zikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL2luaXQnOiBfeGZCYXNlLmluaXQsXG4gICAgICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9yZXN1bHQnOiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL3N0ZXAnOiBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmV0ID0geGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBpbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRbJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJ10gPyBfZm9yY2VSZWR1Y2VkKHJldCkgOiByZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIF94Y2F0KHhmKSB7XG4gICAgICAgICAgICB2YXIgcnhmID0gcHJlc2VydmluZ1JlZHVjZWQoeGYpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAnQEB0cmFuc2R1Y2VyL2luaXQnOiBfeGZCYXNlLmluaXQsXG4gICAgICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9yZXN1bHQnOiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByeGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9zdGVwJzogZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFpc0FycmF5TGlrZShpbnB1dCkgPyBfcmVkdWNlKHJ4ZiwgcmVzdWx0LCBbaW5wdXRdKSA6IF9yZWR1Y2UocnhmLCByZXN1bHQsIGlucHV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH0oKTtcblxuICAgIC8vIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIGRvZXNuJ3QgZXhpc3QgYmVsb3cgSUU5XG4gICAgLy8gbWFudWFsbHkgY3Jhd2wgdGhlIGxpc3QgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiArMCBhbmQgLTBcbiAgICAvLyBOYU5cbiAgICAvLyBub24temVybyBudW1iZXJzIGNhbiB1dGlsaXNlIFNldFxuICAgIC8vIGFsbCB0aGVzZSB0eXBlcyBjYW4gdXRpbGlzZSBTZXRcbiAgICAvLyBudWxsIGNhbiB1dGlsaXNlIFNldFxuICAgIC8vIGFueXRoaW5nIGVsc2Ugbm90IGNvdmVyZWQgYWJvdmUsIGRlZmVyIHRvIFIuZXF1YWxzXG4gICAgdmFyIF9pbmRleE9mID0gZnVuY3Rpb24gX2luZGV4T2YobGlzdCwgYSwgaWR4KSB7XG4gICAgICAgIHZhciBpbmYsIGl0ZW07XG4gICAgICAgIC8vIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIGRvZXNuJ3QgZXhpc3QgYmVsb3cgSUU5XG4gICAgICAgIGlmICh0eXBlb2YgbGlzdC5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGVvZiBhKSB7XG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGlmIChhID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1hbnVhbGx5IGNyYXdsIHRoZSBsaXN0IHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gKzAgYW5kIC0wXG4gICAgICAgICAgICAgICAgICAgIGluZiA9IDEgLyBhO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2lkeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSA9PT0gMCAmJiAxIC8gaXRlbSA9PT0gaW5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlkeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGEgIT09IGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTmFOXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpZHggPCBsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGxpc3RbaWR4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicgJiYgaXRlbSAhPT0gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIG5vbi16ZXJvIG51bWJlcnMgY2FuIHV0aWxpc2UgU2V0XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3QuaW5kZXhPZihhLCBpZHgpO1xuICAgICAgICAgICAgLy8gYWxsIHRoZXNlIHR5cGVzIGNhbiB1dGlsaXNlIFNldFxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdC5pbmRleE9mKGEsIGlkeCk7XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgICAgIGlmIChhID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG51bGwgY2FuIHV0aWxpc2UgU2V0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsaXN0LmluZGV4T2YoYSwgaWR4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gYW55dGhpbmcgZWxzZSBub3QgY292ZXJlZCBhYm92ZSwgZGVmZXIgdG8gUi5lcXVhbHNcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoZXF1YWxzKGxpc3RbaWR4XSwgYSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWR4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbiAgICB2YXIgX3hjaGFpbiA9IF9jdXJyeTIoZnVuY3Rpb24gX3hjaGFpbihmLCB4Zikge1xuICAgICAgICByZXR1cm4gbWFwKGYsIF9mbGF0Q2F0KHhmKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGxpc3Qgb2YgcHJlZGljYXRlcyBhbmQgcmV0dXJucyBhIHByZWRpY2F0ZSB0aGF0IHJldHVybnMgdHJ1ZSBmb3IgYVxuICAgICAqIGdpdmVuIGxpc3Qgb2YgYXJndW1lbnRzIGlmIGV2ZXJ5IG9uZSBvZiB0aGUgcHJvdmlkZWQgcHJlZGljYXRlcyBpcyBzYXRpc2ZpZWRcbiAgICAgKiBieSB0aG9zZSBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBUaGUgZnVuY3Rpb24gcmV0dXJuZWQgaXMgYSBjdXJyaWVkIGZ1bmN0aW9uIHdob3NlIGFyaXR5IG1hdGNoZXMgdGhhdCBvZiB0aGVcbiAgICAgKiBoaWdoZXN0LWFyaXR5IHByZWRpY2F0ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyBbKCouLi4gLT4gQm9vbGVhbildIC0+ICgqLi4uIC0+IEJvb2xlYW4pXG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJlZHNcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIuYW55UGFzc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBpc1F1ZWVuID0gUi5wcm9wRXEoJ3JhbmsnLCAnUScpO1xuICAgICAqICAgICAgdmFyIGlzU3BhZGUgPSBSLnByb3BFcSgnc3VpdCcsICfimaDvuI4nKTtcbiAgICAgKiAgICAgIHZhciBpc1F1ZWVuT2ZTcGFkZXMgPSBSLmFsbFBhc3MoW2lzUXVlZW4sIGlzU3BhZGVdKTtcbiAgICAgKlxuICAgICAqICAgICAgaXNRdWVlbk9mU3BhZGVzKHtyYW5rOiAnUScsIHN1aXQ6ICfimaPvuI4nfSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIGlzUXVlZW5PZlNwYWRlcyh7cmFuazogJ1EnLCBzdWl0OiAn4pmg77iOJ30pOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgYWxsUGFzcyA9IF9jdXJyeTEoZnVuY3Rpb24gYWxsUGFzcyhwcmVkcykge1xuICAgICAgICByZXR1cm4gY3VycnlOKHJlZHVjZShtYXgsIDAsIHBsdWNrKCdsZW5ndGgnLCBwcmVkcykpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHZhciBsZW4gPSBwcmVkcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwcmVkc1tpZHhdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGFsbCBlbGVtZW50cyBhcmUgdW5pcXVlLCBpbiBgUi5lcXVhbHNgIHRlcm1zLCBvdGhlcndpc2VcbiAgICAgKiBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOC4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFthXSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIGFsbCBlbGVtZW50cyBhcmUgdW5pcXVlLCBlbHNlIGBmYWxzZWAuXG4gICAgICogQGRlcHJlY2F0ZWQgc2luY2UgdjAuMjAuMFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYWxsVW5pcShbJzEnLCAxXSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5hbGxVbmlxKFsxLCAxXSk7ICAgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5hbGxVbmlxKFtbNDJdLCBbNDJdXSk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgYWxsVW5pcSA9IF9jdXJyeTEoZnVuY3Rpb24gYWxsVW5pcShsaXN0KSB7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChfaW5kZXhPZihsaXN0LCBsaXN0W2lkeF0sIGlkeCArIDEpID49IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgbGlzdCBvZiBwcmVkaWNhdGVzIGFuZCByZXR1cm5zIGEgcHJlZGljYXRlIHRoYXQgcmV0dXJucyB0cnVlIGZvciBhXG4gICAgICogZ2l2ZW4gbGlzdCBvZiBhcmd1bWVudHMgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBwcm92aWRlZCBwcmVkaWNhdGVzIGlzXG4gICAgICogc2F0aXNmaWVkIGJ5IHRob3NlIGFyZ3VtZW50cy5cbiAgICAgKlxuICAgICAqIFRoZSBmdW5jdGlvbiByZXR1cm5lZCBpcyBhIGN1cnJpZWQgZnVuY3Rpb24gd2hvc2UgYXJpdHkgbWF0Y2hlcyB0aGF0IG9mIHRoZVxuICAgICAqIGhpZ2hlc3QtYXJpdHkgcHJlZGljYXRlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnIFsoKi4uLiAtPiBCb29sZWFuKV0gLT4gKCouLi4gLT4gQm9vbGVhbilcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwcmVkc1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBzZWUgUi5hbGxQYXNzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGd0ZSA9IFIuYW55UGFzcyhbUi5ndCwgUi5lcXVhbHNdKTtcbiAgICAgKlxuICAgICAqICAgICAgZ3RlKDMsIDIpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIGd0ZSgyLCAyKTsgLy89PiB0cnVlXG4gICAgICogICAgICBndGUoMiwgMyk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgYW55UGFzcyA9IF9jdXJyeTEoZnVuY3Rpb24gYW55UGFzcyhwcmVkcykge1xuICAgICAgICByZXR1cm4gY3VycnlOKHJlZHVjZShtYXgsIDAsIHBsdWNrKCdsZW5ndGgnLCBwcmVkcykpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHZhciBsZW4gPSBwcmVkcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWRzW2lkeF0uYXBwbHkodGhpcywgYXJndW1lbnRzKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogYXAgYXBwbGllcyBhIGxpc3Qgb2YgZnVuY3Rpb25zIHRvIGEgbGlzdCBvZiB2YWx1ZXMuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgYXBgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LiBBbHNvXG4gICAgICogdHJlYXRzIGZ1bmN0aW9ucyBhcyBhcHBsaWNhdGl2ZXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgW2ZdIC0+IFthXSAtPiBbZiBhXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGZucyBBbiBhcnJheSBvZiBmdW5jdGlvbnNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB2cyBBbiBhcnJheSBvZiB2YWx1ZXNcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgb2YgcmVzdWx0cyBvZiBhcHBseWluZyBlYWNoIG9mIGBmbnNgIHRvIGFsbCBvZiBgdnNgIGluIHR1cm4uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5hcChbUi5tdWx0aXBseSgyKSwgUi5hZGQoMyldLCBbMSwyLDNdKTsgLy89PiBbMiwgNCwgNiwgNCwgNSwgNl1cbiAgICAgKi9cbiAgICAvLyBlbHNlXG4gICAgdmFyIGFwID0gX2N1cnJ5MihmdW5jdGlvbiBhcChhcHBsaWNhdGl2ZSwgZm4pIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBhcHBsaWNhdGl2ZS5hcCA9PT0gJ2Z1bmN0aW9uJyA/IGFwcGxpY2F0aXZlLmFwKGZuKSA6IHR5cGVvZiBhcHBsaWNhdGl2ZSA9PT0gJ2Z1bmN0aW9uJyA/IGN1cnJ5TihNYXRoLm1heChhcHBsaWNhdGl2ZS5sZW5ndGgsIGZuLmxlbmd0aCksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhcHBsaWNhdGl2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgICAgICB9KSA6IC8vIGVsc2VcbiAgICAgICAgX3JlZHVjZShmdW5jdGlvbiAoYWNjLCBmKSB7XG4gICAgICAgICAgICByZXR1cm4gX2NvbmNhdChhY2MsIG1hcChmLCBmbikpO1xuICAgICAgICB9LCBbXSwgYXBwbGljYXRpdmUpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBzcGVjIG9iamVjdCByZWN1cnNpdmVseSBtYXBwaW5nIHByb3BlcnRpZXMgdG8gZnVuY3Rpb25zLCBjcmVhdGVzIGFcbiAgICAgKiBmdW5jdGlvbiBwcm9kdWNpbmcgYW4gb2JqZWN0IG9mIHRoZSBzYW1lIHN0cnVjdHVyZSwgYnkgbWFwcGluZyBlYWNoIHByb3BlcnR5XG4gICAgICogdG8gdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGl0cyBhc3NvY2lhdGVkIGZ1bmN0aW9uIHdpdGggdGhlIHN1cHBsaWVkIGFyZ3VtZW50cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMjAuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcge2s6ICgoYSwgYiwgLi4uLCBtKSAtPiB2KX0gLT4gKChhLCBiLCAuLi4sIG0pIC0+IHtrOiB2fSlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3BlYyBhbiBvYmplY3QgcmVjdXJzaXZlbHkgbWFwcGluZyBwcm9wZXJ0aWVzIHRvIGZ1bmN0aW9ucyBmb3JcbiAgICAgKiAgICAgICAgcHJvZHVjaW5nIHRoZSB2YWx1ZXMgZm9yIHRoZXNlIHByb3BlcnRpZXMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIG9iamVjdCBvZiB0aGUgc2FtZSBzdHJ1Y3R1cmVcbiAgICAgKiBhcyBgc3BlYycsIHdpdGggZWFjaCBwcm9wZXJ0eSBzZXQgdG8gdGhlIHZhbHVlIHJldHVybmVkIGJ5IGNhbGxpbmcgaXRzXG4gICAgICogYXNzb2NpYXRlZCBmdW5jdGlvbiB3aXRoIHRoZSBzdXBwbGllZCBhcmd1bWVudHMuXG4gICAgICogQHNlZSBSLmp1eHRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZ2V0TWV0cmljcyA9IFIuYXBwbHlTcGVjKHtcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtOiBSLmFkZCxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVzdGVkOiB7IG11bDogUi5tdWx0aXBseSB9XG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAqICAgICAgZ2V0TWV0cmljcygyLCA0KTsgLy8gPT4geyBzdW06IDYsIG5lc3RlZDogeyBtdWw6IDggfSB9XG4gICAgICovXG4gICAgdmFyIGFwcGx5U3BlYyA9IF9jdXJyeTEoZnVuY3Rpb24gYXBwbHlTcGVjKHNwZWMpIHtcbiAgICAgICAgc3BlYyA9IG1hcChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2ID09ICdmdW5jdGlvbicgPyB2IDogYXBwbHlTcGVjKHYpO1xuICAgICAgICB9LCBzcGVjKTtcbiAgICAgICAgcmV0dXJuIGN1cnJ5TihyZWR1Y2UobWF4LCAwLCBwbHVjaygnbGVuZ3RoJywgdmFsdWVzKHNwZWMpKSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgcmV0dXJuIG1hcChmdW5jdGlvbiAoZikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcHBseShmLCBhcmdzKTtcbiAgICAgICAgICAgIH0sIHNwZWMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGl0cyBmaXJzdCBhcmd1bWVudCB3aXRoIHRoZSByZW1haW5pbmdcbiAgICAgKiBhcmd1bWVudHMuIFRoaXMgaXMgb2NjYXNpb25hbGx5IHVzZWZ1bCBhcyBhIGNvbnZlcmdpbmcgZnVuY3Rpb24gZm9yXG4gICAgICogYFIuY29udmVyZ2VgOiB0aGUgbGVmdCBicmFuY2ggY2FuIHByb2R1Y2UgYSBmdW5jdGlvbiB3aGlsZSB0aGUgcmlnaHQgYnJhbmNoXG4gICAgICogcHJvZHVjZXMgYSB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gdGhhdCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKi4uLiAtPiBhKSwqLi4uIC0+IGFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYXBwbHkgdG8gdGhlIHJlbWFpbmluZyBhcmd1bWVudHMuXG4gICAgICogQHBhcmFtIHsuLi4qfSBhcmdzIEFueSBudW1iZXIgb2YgcG9zaXRpb25hbCBhcmd1bWVudHMuXG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIuYXBwbHlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaW5kZW50TiA9IFIucGlwZShSLnRpbWVzKFIuYWx3YXlzKCcgJykpLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgUi5qb2luKCcnKSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIFIucmVwbGFjZSgvXig/ISQpL2dtKSk7XG4gICAgICpcbiAgICAgKiAgICAgIHZhciBmb3JtYXQgPSBSLmNvbnZlcmdlKFIuY2FsbCwgW1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIucGlwZShSLnByb3AoJ2luZGVudCcpLCBpbmRlbnROKSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSLnByb3AoJ3ZhbHVlJylcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAqXG4gICAgICogICAgICBmb3JtYXQoe2luZGVudDogMiwgdmFsdWU6ICdmb29cXG5iYXJcXG5iYXpcXG4nfSk7IC8vPT4gJyAgZm9vXFxuICBiYXJcXG4gIGJhelxcbidcbiAgICAgKi9cbiAgICB2YXIgY2FsbCA9IGN1cnJ5KGZ1bmN0aW9uIGNhbGwoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIF9zbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIGBjaGFpbmAgbWFwcyBhIGZ1bmN0aW9uIG92ZXIgYSBsaXN0IGFuZCBjb25jYXRlbmF0ZXMgdGhlIHJlc3VsdHMuIGBjaGFpbmBcbiAgICAgKiBpcyBhbHNvIGtub3duIGFzIGBmbGF0TWFwYCBpbiBzb21lIGxpYnJhcmllc1xuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGNoYWluYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IFtiXSkgLT4gW2FdIC0+IFtiXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdFxuICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBkdXBsaWNhdGUgPSBuID0+IFtuLCBuXTtcbiAgICAgKiAgICAgIFIuY2hhaW4oZHVwbGljYXRlLCBbMSwgMiwgM10pOyAvLz0+IFsxLCAxLCAyLCAyLCAzLCAzXVxuICAgICAqL1xuICAgIHZhciBjaGFpbiA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnY2hhaW4nLCBfeGNoYWluLCBmdW5jdGlvbiBjaGFpbihmbiwgbW9uYWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtb25hZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9uYWQuY2FsbCh0aGlzLCBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX21ha2VGbGF0KGZhbHNlKShtYXAoZm4sIG1vbmFkKSk7XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uLCBgZm5gLCB3aGljaCBlbmNhcHN1bGF0ZXMgaWYvZWxzZS1pZi9lbHNlIGxvZ2ljLlxuICAgICAqIGBSLmNvbmRgIHRha2VzIGEgbGlzdCBvZiBbcHJlZGljYXRlLCB0cmFuc2Zvcm1dIHBhaXJzLiBBbGwgb2YgdGhlIGFyZ3VtZW50c1xuICAgICAqIHRvIGBmbmAgYXJlIGFwcGxpZWQgdG8gZWFjaCBvZiB0aGUgcHJlZGljYXRlcyBpbiB0dXJuIHVudGlsIG9uZSByZXR1cm5zIGFcbiAgICAgKiBcInRydXRoeVwiIHZhbHVlLCBhdCB3aGljaCBwb2ludCBgZm5gIHJldHVybnMgdGhlIHJlc3VsdCBvZiBhcHBseWluZyBpdHNcbiAgICAgKiBhcmd1bWVudHMgdG8gdGhlIGNvcnJlc3BvbmRpbmcgdHJhbnNmb3JtZXIuIElmIG5vbmUgb2YgdGhlIHByZWRpY2F0ZXNcbiAgICAgKiBtYXRjaGVzLCBgZm5gIHJldHVybnMgdW5kZWZpbmVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC42LjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnIFtbKCouLi4gLT4gQm9vbGVhbiksKCouLi4gLT4gKildXSAtPiAoKi4uLiAtPiAqKVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhaXJzXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGZuID0gUi5jb25kKFtcbiAgICAgKiAgICAgICAgW1IuZXF1YWxzKDApLCAgIFIuYWx3YXlzKCd3YXRlciBmcmVlemVzIGF0IDDCsEMnKV0sXG4gICAgICogICAgICAgIFtSLmVxdWFscygxMDApLCBSLmFsd2F5cygnd2F0ZXIgYm9pbHMgYXQgMTAwwrBDJyldLFxuICAgICAqICAgICAgICBbUi5ULCAgICAgICAgICAgdGVtcCA9PiAnbm90aGluZyBzcGVjaWFsIGhhcHBlbnMgYXQgJyArIHRlbXAgKyAnwrBDJ11cbiAgICAgKiAgICAgIF0pO1xuICAgICAqICAgICAgZm4oMCk7IC8vPT4gJ3dhdGVyIGZyZWV6ZXMgYXQgMMKwQydcbiAgICAgKiAgICAgIGZuKDUwKTsgLy89PiAnbm90aGluZyBzcGVjaWFsIGhhcHBlbnMgYXQgNTDCsEMnXG4gICAgICogICAgICBmbigxMDApOyAvLz0+ICd3YXRlciBib2lscyBhdCAxMDDCsEMnXG4gICAgICovXG4gICAgdmFyIGNvbmQgPSBfY3VycnkxKGZ1bmN0aW9uIGNvbmQocGFpcnMpIHtcbiAgICAgICAgdmFyIGFyaXR5ID0gcmVkdWNlKG1heCwgMCwgbWFwKGZ1bmN0aW9uIChwYWlyKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFpclswXS5sZW5ndGg7XG4gICAgICAgIH0sIHBhaXJzKSk7XG4gICAgICAgIHJldHVybiBfYXJpdHkoYXJpdHksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IHBhaXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmIChwYWlyc1tpZHhdWzBdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhaXJzW2lkeF1bMV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBpbnNpZGUgYSBjdXJyaWVkIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIGNhbGxlZFxuICAgICAqIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzIGFuZCByZXR1cm5zIHRoZSBzYW1lIHR5cGUuIFRoZSBhcml0eSBvZiB0aGUgZnVuY3Rpb25cbiAgICAgKiByZXR1cm5lZCBpcyBzcGVjaWZpZWQgdG8gYWxsb3cgdXNpbmcgdmFyaWFkaWMgY29uc3RydWN0b3IgZnVuY3Rpb25zLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC40LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIE51bWJlciAtPiAoKiAtPiB7Kn0pIC0+ICgqIC0+IHsqfSlcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiBUaGUgYXJpdHkgb2YgdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IEZuIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiB0byB3cmFwLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIHdyYXBwZWQsIGN1cnJpZWQgY29uc3RydWN0b3IgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gVmFyaWFkaWMgY29uc3RydWN0b3IgZnVuY3Rpb25cbiAgICAgKiAgICAgIHZhciBXaWRnZXQgPSAoKSA9PiB7XG4gICAgICogICAgICAgIHRoaXMuY2hpbGRyZW4gPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAqICAgICAgICAvLyAuLi5cbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICBXaWRnZXQucHJvdG90eXBlID0ge1xuICAgICAqICAgICAgICAvLyAuLi5cbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICB2YXIgYWxsQ29uZmlncyA9IFtcbiAgICAgKiAgICAgICAgLy8gLi4uXG4gICAgICogICAgICBdO1xuICAgICAqICAgICAgUi5tYXAoUi5jb25zdHJ1Y3ROKDEsIFdpZGdldCksIGFsbENvbmZpZ3MpOyAvLyBhIGxpc3Qgb2YgV2lkZ2V0c1xuICAgICAqL1xuICAgIHZhciBjb25zdHJ1Y3ROID0gX2N1cnJ5MihmdW5jdGlvbiBjb25zdHJ1Y3ROKG4sIEZuKSB7XG4gICAgICAgIGlmIChuID4gMTApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uc3RydWN0b3Igd2l0aCBncmVhdGVyIHRoYW4gdGVuIGFyZ3VtZW50cycpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRm4oKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnJ5KG5BcnkobiwgZnVuY3Rpb24gKCQwLCAkMSwgJDIsICQzLCAkNCwgJDUsICQ2LCAkNywgJDgsICQ5KSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZuKCQwKTtcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZuKCQwLCAkMSk7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyKTtcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZuKCQwLCAkMSwgJDIsICQzKTtcbiAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZuKCQwLCAkMSwgJDIsICQzLCAkNCk7XG4gICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyLCAkMywgJDQsICQ1KTtcbiAgICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZuKCQwLCAkMSwgJDIsICQzLCAkNCwgJDUsICQ2KTtcbiAgICAgICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZuKCQwLCAkMSwgJDIsICQzLCAkNCwgJDUsICQ2LCAkNyk7XG4gICAgICAgICAgICBjYXNlIDk6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyLCAkMywgJDQsICQ1LCAkNiwgJDcsICQ4KTtcbiAgICAgICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyLCAkMywgJDQsICQ1LCAkNiwgJDcsICQ4LCAkOSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEFjY2VwdHMgYSBjb252ZXJnaW5nIGZ1bmN0aW9uIGFuZCBhIGxpc3Qgb2YgYnJhbmNoaW5nIGZ1bmN0aW9ucyBhbmQgcmV0dXJuc1xuICAgICAqIGEgbmV3IGZ1bmN0aW9uLiBXaGVuIGludm9rZWQsIHRoaXMgbmV3IGZ1bmN0aW9uIGlzIGFwcGxpZWQgdG8gc29tZVxuICAgICAqIGFyZ3VtZW50cywgZWFjaCBicmFuY2hpbmcgZnVuY3Rpb24gaXMgYXBwbGllZCB0byB0aG9zZSBzYW1lIGFyZ3VtZW50cy4gVGhlXG4gICAgICogcmVzdWx0cyBvZiBlYWNoIGJyYW5jaGluZyBmdW5jdGlvbiBhcmUgcGFzc2VkIGFzIGFyZ3VtZW50cyB0byB0aGUgY29udmVyZ2luZ1xuICAgICAqIGZ1bmN0aW9uIHRvIHByb2R1Y2UgdGhlIHJldHVybiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNC4yXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoeDEgLT4geDIgLT4gLi4uIC0+IHopIC0+IFsoYSAtPiBiIC0+IC4uLiAtPiB4MSksIChhIC0+IGIgLT4gLi4uIC0+IHgyKSwgLi4uXSAtPiAoYSAtPiBiIC0+IC4uLiAtPiB6KVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGFmdGVyIEEgZnVuY3Rpb24uIGBhZnRlcmAgd2lsbCBiZSBpbnZva2VkIHdpdGggdGhlIHJldHVybiB2YWx1ZXMgb2ZcbiAgICAgKiAgICAgICAgYGZuMWAgYW5kIGBmbjJgIGFzIGl0cyBhcmd1bWVudHMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gZnVuY3Rpb25zIEEgbGlzdCBvZiBmdW5jdGlvbnMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBhZGQgPSAoYSwgYikgPT4gYSArIGI7XG4gICAgICogICAgICB2YXIgbXVsdGlwbHkgPSAoYSwgYikgPT4gYSAqIGI7XG4gICAgICogICAgICB2YXIgc3VidHJhY3QgPSAoYSwgYikgPT4gYSAtIGI7XG4gICAgICpcbiAgICAgKiAgICAgIC8v4omFIG11bHRpcGx5KCBhZGQoMSwgMiksIHN1YnRyYWN0KDEsIDIpICk7XG4gICAgICogICAgICBSLmNvbnZlcmdlKG11bHRpcGx5LCBbYWRkLCBzdWJ0cmFjdF0pKDEsIDIpOyAvLz0+IC0zXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBhZGQzID0gKGEsIGIsIGMpID0+IGEgKyBiICsgYztcbiAgICAgKiAgICAgIFIuY29udmVyZ2UoYWRkMywgW211bHRpcGx5LCBhZGQsIHN1YnRyYWN0XSkoMSwgMik7IC8vPT4gNFxuICAgICAqL1xuICAgIHZhciBjb252ZXJnZSA9IF9jdXJyeTIoZnVuY3Rpb24gY29udmVyZ2UoYWZ0ZXIsIGZucykge1xuICAgICAgICByZXR1cm4gY3VycnlOKHJlZHVjZShtYXgsIDAsIHBsdWNrKCdsZW5ndGgnLCBmbnMpKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gYWZ0ZXIuYXBwbHkoY29udGV4dCwgX21hcChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICB9LCBmbnMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDb3VudHMgdGhlIGVsZW1lbnRzIG9mIGEgbGlzdCBhY2NvcmRpbmcgdG8gaG93IG1hbnkgbWF0Y2ggZWFjaCB2YWx1ZSBvZiBhXG4gICAgICoga2V5IGdlbmVyYXRlZCBieSB0aGUgc3VwcGxpZWQgZnVuY3Rpb24uIFJldHVybnMgYW4gb2JqZWN0IG1hcHBpbmcgdGhlIGtleXNcbiAgICAgKiBwcm9kdWNlZCBieSBgZm5gIHRvIHRoZSBudW1iZXIgb2Ygb2NjdXJyZW5jZXMgaW4gdGhlIGxpc3QuIE5vdGUgdGhhdCBhbGxcbiAgICAgKiBrZXlzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgYmVjYXVzZSBvZiBob3cgSmF2YVNjcmlwdCBvYmplY3RzIHdvcmsuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgKGEgLT4gU3RyaW5nKSAtPiBbYV0gLT4geyp9XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHVzZWQgdG8gbWFwIHZhbHVlcyB0byBrZXlzLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gY291bnQgZWxlbWVudHMgZnJvbS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEFuIG9iamVjdCBtYXBwaW5nIGtleXMgdG8gbnVtYmVyIG9mIG9jY3VycmVuY2VzIGluIHRoZSBsaXN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBudW1iZXJzID0gWzEuMCwgMS4xLCAxLjIsIDIuMCwgMy4wLCAyLjJdO1xuICAgICAqICAgICAgdmFyIGxldHRlcnMgPSBSLnNwbGl0KCcnLCAnYWJjQUJDYWFhQkJjJyk7XG4gICAgICogICAgICBSLmNvdW50QnkoTWF0aC5mbG9vcikobnVtYmVycyk7ICAgIC8vPT4geycxJzogMywgJzInOiAyLCAnMyc6IDF9XG4gICAgICogICAgICBSLmNvdW50QnkoUi50b0xvd2VyKShsZXR0ZXJzKTsgICAvLz0+IHsnYSc6IDUsICdiJzogNCwgJ2MnOiAzfVxuICAgICAqL1xuICAgIHZhciBjb3VudEJ5ID0gcmVkdWNlQnkoZnVuY3Rpb24gKGFjYywgZWxlbSkge1xuICAgICAgICByZXR1cm4gYWNjICsgMTtcbiAgICB9LCAwKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCB3aXRob3V0IGFueSBjb25zZWN1dGl2ZWx5IHJlcGVhdGluZyBlbGVtZW50cy4gRXF1YWxpdHkgaXNcbiAgICAgKiBkZXRlcm1pbmVkIGJ5IGFwcGx5aW5nIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgdHdvIGNvbnNlY3V0aXZlIGVsZW1lbnRzLiBUaGVcbiAgICAgKiBmaXJzdCBlbGVtZW50IGluIGEgc2VyaWVzIG9mIGVxdWFsIGVsZW1lbnQgaXMgdGhlIG9uZSBiZWluZyBwcmVzZXJ2ZWQuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZHJvcFJlcGVhdHNXaXRoYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSwgYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBBIHByZWRpY2F0ZSB1c2VkIHRvIHRlc3Qgd2hldGhlciB0d28gaXRlbXMgYXJlIGVxdWFsLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBgbGlzdGAgd2l0aG91dCByZXBlYXRpbmcgZWxlbWVudHMuXG4gICAgICogQHNlZSBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBsID0gWzEsIC0xLCAxLCAzLCA0LCAtNCwgLTQsIC01LCA1LCAzLCAzXTtcbiAgICAgKiAgICAgIFIuZHJvcFJlcGVhdHNXaXRoKFIuZXFCeShNYXRoLmFicyksIGwpOyAvLz0+IFsxLCAzLCA0LCAtNSwgM11cbiAgICAgKi9cbiAgICB2YXIgZHJvcFJlcGVhdHNXaXRoID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdkcm9wUmVwZWF0c1dpdGgnLCBfeGRyb3BSZXBlYXRzV2l0aCwgZnVuY3Rpb24gZHJvcFJlcGVhdHNXaXRoKHByZWQsIGxpc3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMTtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICBpZiAobGVuICE9PSAwKSB7XG4gICAgICAgICAgICByZXN1bHRbMF0gPSBsaXN0WzBdO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgICAgIGlmICghcHJlZChsYXN0KHJlc3VsdCksIGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gbGlzdFtpZHhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgZnVuY3Rpb24gYW5kIHR3byB2YWx1ZXMgaW4gaXRzIGRvbWFpbiBhbmQgcmV0dXJucyBgdHJ1ZWAgaWYgdGhlXG4gICAgICogdmFsdWVzIG1hcCB0byB0aGUgc2FtZSB2YWx1ZSBpbiB0aGUgY29kb21haW47IGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOC4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyAoYSAtPiBiKSAtPiBhIC0+IGEgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZcbiAgICAgKiBAcGFyYW0geyp9IHhcbiAgICAgKiBAcGFyYW0geyp9IHlcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZXFCeShNYXRoLmFicywgNSwgLTUpOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgZXFCeSA9IF9jdXJyeTMoZnVuY3Rpb24gZXFCeShmLCB4LCB5KSB7XG4gICAgICAgIHJldHVybiBlcXVhbHMoZih4KSwgZih5KSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXBvcnRzIHdoZXRoZXIgdHdvIG9iamVjdHMgaGF2ZSB0aGUgc2FtZSB2YWx1ZSwgaW4gYFIuZXF1YWxzYCB0ZXJtcywgZm9yXG4gICAgICogdGhlIHNwZWNpZmllZCBwcm9wZXJ0eS4gVXNlZnVsIGFzIGEgY3VycmllZCBwcmVkaWNhdGUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIGsgLT4ge2s6IHZ9IC0+IHtrOiB2fSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3AgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGNvbXBhcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqMVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmoyXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBvMSA9IHsgYTogMSwgYjogMiwgYzogMywgZDogNCB9O1xuICAgICAqICAgICAgdmFyIG8yID0geyBhOiAxMCwgYjogMjAsIGM6IDMsIGQ6IDQwIH07XG4gICAgICogICAgICBSLmVxUHJvcHMoJ2EnLCBvMSwgbzIpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmVxUHJvcHMoJ2MnLCBvMSwgbzIpOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgZXFQcm9wcyA9IF9jdXJyeTMoZnVuY3Rpb24gZXFQcm9wcyhwcm9wLCBvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiBlcXVhbHMob2JqMVtwcm9wXSwgb2JqMltwcm9wXSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBTcGxpdHMgYSBsaXN0IGludG8gc3ViLWxpc3RzIHN0b3JlZCBpbiBhbiBvYmplY3QsIGJhc2VkIG9uIHRoZSByZXN1bHQgb2ZcbiAgICAgKiBjYWxsaW5nIGEgU3RyaW5nLXJldHVybmluZyBmdW5jdGlvbiBvbiBlYWNoIGVsZW1lbnQsIGFuZCBncm91cGluZyB0aGVcbiAgICAgKiByZXN1bHRzIGFjY29yZGluZyB0byB2YWx1ZXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZ3JvdXBCeWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBTdHJpbmcpIC0+IFthXSAtPiB7U3RyaW5nOiBbYV19XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gOjogYSAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBncm91cFxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQW4gb2JqZWN0IHdpdGggdGhlIG91dHB1dCBvZiBgZm5gIGZvciBrZXlzLCBtYXBwZWQgdG8gYXJyYXlzIG9mIGVsZW1lbnRzXG4gICAgICogICAgICAgICB0aGF0IHByb2R1Y2VkIHRoYXQga2V5IHdoZW4gcGFzc2VkIHRvIGBmbmAuXG4gICAgICogQHNlZSBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBieUdyYWRlID0gUi5ncm91cEJ5KGZ1bmN0aW9uKHN0dWRlbnQpIHtcbiAgICAgKiAgICAgICAgdmFyIHNjb3JlID0gc3R1ZGVudC5zY29yZTtcbiAgICAgKiAgICAgICAgcmV0dXJuIHNjb3JlIDwgNjUgPyAnRicgOlxuICAgICAqICAgICAgICAgICAgICAgc2NvcmUgPCA3MCA/ICdEJyA6XG4gICAgICogICAgICAgICAgICAgICBzY29yZSA8IDgwID8gJ0MnIDpcbiAgICAgKiAgICAgICAgICAgICAgIHNjb3JlIDwgOTAgPyAnQicgOiAnQSc7XG4gICAgICogICAgICB9KTtcbiAgICAgKiAgICAgIHZhciBzdHVkZW50cyA9IFt7bmFtZTogJ0FiYnknLCBzY29yZTogODR9LFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgIHtuYW1lOiAnRWRkeScsIHNjb3JlOiA1OH0sXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgLy8gLi4uXG4gICAgICogICAgICAgICAgICAgICAgICAgICAge25hbWU6ICdKYWNrJywgc2NvcmU6IDY5fV07XG4gICAgICogICAgICBieUdyYWRlKHN0dWRlbnRzKTtcbiAgICAgKiAgICAgIC8vIHtcbiAgICAgKiAgICAgIC8vICAgJ0EnOiBbe25hbWU6ICdEaWFubmUnLCBzY29yZTogOTl9XSxcbiAgICAgKiAgICAgIC8vICAgJ0InOiBbe25hbWU6ICdBYmJ5Jywgc2NvcmU6IDg0fV1cbiAgICAgKiAgICAgIC8vICAgLy8gLi4uLFxuICAgICAqICAgICAgLy8gICAnRic6IFt7bmFtZTogJ0VkZHknLCBzY29yZTogNTh9XVxuICAgICAqICAgICAgLy8gfVxuICAgICAqL1xuICAgIHZhciBncm91cEJ5ID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdncm91cEJ5JywgX3hncm91cEJ5LCByZWR1Y2VCeShmdW5jdGlvbiAoYWNjLCBpdGVtKSB7XG4gICAgICAgIGlmIChhY2MgPT0gbnVsbCkge1xuICAgICAgICAgICAgYWNjID0gW107XG4gICAgICAgIH1cbiAgICAgICAgYWNjLnB1c2goaXRlbSk7XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgbnVsbCkpKTtcblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgZnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgYSBrZXksIHR1cm5zIGEgbGlzdCBvZiBvYmplY3RzIGludG8gYW5cbiAgICAgKiBvYmplY3QgaW5kZXhpbmcgdGhlIG9iamVjdHMgYnkgdGhlIGdpdmVuIGtleS4gTm90ZSB0aGF0IGlmIG11bHRpcGxlXG4gICAgICogb2JqZWN0cyBnZW5lcmF0ZSB0aGUgc2FtZSB2YWx1ZSBmb3IgdGhlIGluZGV4aW5nIGtleSBvbmx5IHRoZSBsYXN0IHZhbHVlXG4gICAgICogd2lsbCBiZSBpbmNsdWRlZCBpbiB0aGUgZ2VuZXJhdGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBTdHJpbmcpIC0+IFt7azogdn1dIC0+IHtrOiB7azogdn19XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gOjogYSAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgb2Ygb2JqZWN0cyB0byBpbmRleFxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQW4gb2JqZWN0IGluZGV4aW5nIGVhY2ggYXJyYXkgZWxlbWVudCBieSB0aGUgZ2l2ZW4gcHJvcGVydHkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGxpc3QgPSBbe2lkOiAneHl6JywgdGl0bGU6ICdBJ30sIHtpZDogJ2FiYycsIHRpdGxlOiAnQid9XTtcbiAgICAgKiAgICAgIFIuaW5kZXhCeShSLnByb3AoJ2lkJyksIGxpc3QpO1xuICAgICAqICAgICAgLy89PiB7YWJjOiB7aWQ6ICdhYmMnLCB0aXRsZTogJ0InfSwgeHl6OiB7aWQ6ICd4eXonLCB0aXRsZTogJ0EnfX1cbiAgICAgKi9cbiAgICB2YXIgaW5kZXhCeSA9IHJlZHVjZUJ5KGZ1bmN0aW9uIChhY2MsIGVsZW0pIHtcbiAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgfSwgbnVsbCk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhbiBpdGVtIGluIGFuIGFycmF5LCBvciAtMVxuICAgICAqIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuIGBSLmVxdWFsc2AgaXMgdXNlZCB0byBkZXRlcm1pbmVcbiAgICAgKiBlcXVhbGl0eS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGEgLT4gW2FdIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7Kn0gdGFyZ2V0IFRoZSBpdGVtIHRvIGZpbmQuXG4gICAgICogQHBhcmFtIHtBcnJheX0geHMgVGhlIGFycmF5IHRvIHNlYXJjaCBpbi5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBpbmRleCBvZiB0aGUgdGFyZ2V0LCBvciAtMSBpZiB0aGUgdGFyZ2V0IGlzIG5vdCBmb3VuZC5cbiAgICAgKiBAc2VlIFIubGFzdEluZGV4T2ZcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmluZGV4T2YoMywgWzEsMiwzLDRdKTsgLy89PiAyXG4gICAgICogICAgICBSLmluZGV4T2YoMTAsIFsxLDIsMyw0XSk7IC8vPT4gLTFcbiAgICAgKi9cbiAgICB2YXIgaW5kZXhPZiA9IF9jdXJyeTIoZnVuY3Rpb24gaW5kZXhPZih0YXJnZXQsIHhzKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgeHMuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJyAmJiAhX2lzQXJyYXkoeHMpID8geHMuaW5kZXhPZih0YXJnZXQpIDogX2luZGV4T2YoeHMsIHRhcmdldCwgMCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBqdXh0IGFwcGxpZXMgYSBsaXN0IG9mIGZ1bmN0aW9ucyB0byBhIGxpc3Qgb2YgdmFsdWVzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBbKGEsIGIsIC4uLiwgbSkgLT4gbl0gLT4gKChhLCBiLCAuLi4sIG0pIC0+IFtuXSlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBmbnMgQW4gYXJyYXkgb2YgZnVuY3Rpb25zXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgbGlzdCBvZiB2YWx1ZXMgYWZ0ZXIgYXBwbHlpbmcgZWFjaCBvZiB0aGUgb3JpZ2luYWwgYGZuc2AgdG8gaXRzIHBhcmFtZXRlcnMuXG4gICAgICogQHNlZSBSLmFwcGx5U3BlY1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciByYW5nZSA9IFIuanV4dChbTWF0aC5taW4sIE1hdGgubWF4XSk7XG4gICAgICogICAgICByYW5nZSgzLCA0LCA5LCAtMyk7IC8vPT4gWy0zLCA5XVxuICAgICAqL1xuICAgIHZhciBqdXh0ID0gX2N1cnJ5MShmdW5jdGlvbiBqdXh0KGZucykge1xuICAgICAgICByZXR1cm4gY29udmVyZ2UoX2FycmF5T2YsIGZucyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGVucyBmb3IgdGhlIGdpdmVuIGdldHRlciBhbmQgc2V0dGVyIGZ1bmN0aW9ucy4gVGhlIGdldHRlciBcImdldHNcIlxuICAgICAqIHRoZSB2YWx1ZSBvZiB0aGUgZm9jdXM7IHRoZSBzZXR0ZXIgXCJzZXRzXCIgdGhlIHZhbHVlIG9mIHRoZSBmb2N1cy4gVGhlIHNldHRlclxuICAgICAqIHNob3VsZCBub3QgbXV0YXRlIHRoZSBkYXRhIHN0cnVjdHVyZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEB0eXBlZGVmbiBMZW5zIHMgYSA9IEZ1bmN0b3IgZiA9PiAoYSAtPiBmIGEpIC0+IHMgLT4gZiBzXG4gICAgICogQHNpZyAocyAtPiBhKSAtPiAoKGEsIHMpIC0+IHMpIC0+IExlbnMgcyBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZ2V0dGVyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gc2V0dGVyXG4gICAgICogQHJldHVybiB7TGVuc31cbiAgICAgKiBAc2VlIFIudmlldywgUi5zZXQsIFIub3ZlciwgUi5sZW5zSW5kZXgsIFIubGVuc1Byb3BcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgeExlbnMgPSBSLmxlbnMoUi5wcm9wKCd4JyksIFIuYXNzb2MoJ3gnKSk7XG4gICAgICpcbiAgICAgKiAgICAgIFIudmlldyh4TGVucywge3g6IDEsIHk6IDJ9KTsgICAgICAgICAgICAvLz0+IDFcbiAgICAgKiAgICAgIFIuc2V0KHhMZW5zLCA0LCB7eDogMSwgeTogMn0pOyAgICAgICAgICAvLz0+IHt4OiA0LCB5OiAyfVxuICAgICAqICAgICAgUi5vdmVyKHhMZW5zLCBSLm5lZ2F0ZSwge3g6IDEsIHk6IDJ9KTsgIC8vPT4ge3g6IC0xLCB5OiAyfVxuICAgICAqL1xuICAgIHZhciBsZW5zID0gX2N1cnJ5MihmdW5jdGlvbiBsZW5zKGdldHRlciwgc2V0dGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodG9GdW5jdG9yRm4pIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcChmdW5jdGlvbiAoZm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcihmb2N1cywgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB9LCB0b0Z1bmN0b3JGbihnZXR0ZXIodGFyZ2V0KSkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsZW5zIHdob3NlIGZvY3VzIGlzIHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHR5cGVkZWZuIExlbnMgcyBhID0gRnVuY3RvciBmID0+IChhIC0+IGYgYSkgLT4gcyAtPiBmIHNcbiAgICAgKiBAc2lnIE51bWJlciAtPiBMZW5zIHMgYVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAgICogQHJldHVybiB7TGVuc31cbiAgICAgKiBAc2VlIFIudmlldywgUi5zZXQsIFIub3ZlclxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBoZWFkTGVucyA9IFIubGVuc0luZGV4KDApO1xuICAgICAqXG4gICAgICogICAgICBSLnZpZXcoaGVhZExlbnMsIFsnYScsICdiJywgJ2MnXSk7ICAgICAgICAgICAgLy89PiAnYSdcbiAgICAgKiAgICAgIFIuc2V0KGhlYWRMZW5zLCAneCcsIFsnYScsICdiJywgJ2MnXSk7ICAgICAgICAvLz0+IFsneCcsICdiJywgJ2MnXVxuICAgICAqICAgICAgUi5vdmVyKGhlYWRMZW5zLCBSLnRvVXBwZXIsIFsnYScsICdiJywgJ2MnXSk7IC8vPT4gWydBJywgJ2InLCAnYyddXG4gICAgICovXG4gICAgdmFyIGxlbnNJbmRleCA9IF9jdXJyeTEoZnVuY3Rpb24gbGVuc0luZGV4KG4pIHtcbiAgICAgICAgcmV0dXJuIGxlbnMobnRoKG4pLCB1cGRhdGUobikpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxlbnMgd2hvc2UgZm9jdXMgaXMgdGhlIHNwZWNpZmllZCBwYXRoLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEB0eXBlZGVmbiBMZW5zIHMgYSA9IEZ1bmN0b3IgZiA9PiAoYSAtPiBmIGEpIC0+IHMgLT4gZiBzXG4gICAgICogQHNpZyBbU3RyaW5nXSAtPiBMZW5zIHMgYVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhdGggVGhlIHBhdGggdG8gdXNlLlxuICAgICAqIEByZXR1cm4ge0xlbnN9XG4gICAgICogQHNlZSBSLnZpZXcsIFIuc2V0LCBSLm92ZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgeHlMZW5zID0gUi5sZW5zUGF0aChbJ3gnLCAneSddKTtcbiAgICAgKlxuICAgICAqICAgICAgUi52aWV3KHh5TGVucywge3g6IHt5OiAyLCB6OiAzfX0pOyAgICAgICAgICAgIC8vPT4gMlxuICAgICAqICAgICAgUi5zZXQoeHlMZW5zLCA0LCB7eDoge3k6IDIsIHo6IDN9fSk7ICAgICAgICAgIC8vPT4ge3g6IHt5OiA0LCB6OiAzfX1cbiAgICAgKiAgICAgIFIub3Zlcih4eUxlbnMsIFIubmVnYXRlLCB7eDoge3k6IDIsIHo6IDN9fSk7ICAvLz0+IHt4OiB7eTogLTIsIHo6IDN9fVxuICAgICAqL1xuICAgIHZhciBsZW5zUGF0aCA9IF9jdXJyeTEoZnVuY3Rpb24gbGVuc1BhdGgocCkge1xuICAgICAgICByZXR1cm4gbGVucyhwYXRoKHApLCBhc3NvY1BhdGgocCkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxlbnMgd2hvc2UgZm9jdXMgaXMgdGhlIHNwZWNpZmllZCBwcm9wZXJ0eS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAdHlwZWRlZm4gTGVucyBzIGEgPSBGdW5jdG9yIGYgPT4gKGEgLT4gZiBhKSAtPiBzIC0+IGYgc1xuICAgICAqIEBzaWcgU3RyaW5nIC0+IExlbnMgcyBhXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtcbiAgICAgKiBAcmV0dXJuIHtMZW5zfVxuICAgICAqIEBzZWUgUi52aWV3LCBSLnNldCwgUi5vdmVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHhMZW5zID0gUi5sZW5zUHJvcCgneCcpO1xuICAgICAqXG4gICAgICogICAgICBSLnZpZXcoeExlbnMsIHt4OiAxLCB5OiAyfSk7ICAgICAgICAgICAgLy89PiAxXG4gICAgICogICAgICBSLnNldCh4TGVucywgNCwge3g6IDEsIHk6IDJ9KTsgICAgICAgICAgLy89PiB7eDogNCwgeTogMn1cbiAgICAgKiAgICAgIFIub3Zlcih4TGVucywgUi5uZWdhdGUsIHt4OiAxLCB5OiAyfSk7ICAvLz0+IHt4OiAtMSwgeTogMn1cbiAgICAgKi9cbiAgICB2YXIgbGVuc1Byb3AgPSBfY3VycnkxKGZ1bmN0aW9uIGxlbnNQcm9wKGspIHtcbiAgICAgICAgcmV0dXJuIGxlbnMocHJvcChrKSwgYXNzb2MoaykpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogXCJsaWZ0c1wiIGEgZnVuY3Rpb24gdG8gYmUgdGhlIHNwZWNpZmllZCBhcml0eSwgc28gdGhhdCBpdCBtYXkgXCJtYXAgb3ZlclwiIHRoYXRcbiAgICAgKiBtYW55IGxpc3RzLCBGdW5jdGlvbnMgb3Igb3RoZXIgb2JqZWN0cyB0aGF0IHNhdGlzZnkgdGhlIFtGYW50YXN5TGFuZCBBcHBseSBzcGVjXShodHRwczovL2dpdGh1Yi5jb20vZmFudGFzeWxhbmQvZmFudGFzeS1sYW5kI2FwcGx5KS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNy4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBOdW1iZXIgLT4gKCouLi4gLT4gKikgLT4gKFsqXS4uLiAtPiBbKl0pXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGxpZnQgaW50byBoaWdoZXIgY29udGV4dFxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgbGlmdGVkIGZ1bmN0aW9uLlxuICAgICAqIEBzZWUgUi5saWZ0LCBSLmFwXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG1hZGQzID0gUi5saWZ0TigzLCBSLmN1cnJ5TigzLCAoLi4uYXJncykgPT4gUi5zdW0oYXJncykpKTtcbiAgICAgKiAgICAgIG1hZGQzKFsxLDIsM10sIFsxLDIsM10sIFsxXSk7IC8vPT4gWzMsIDQsIDUsIDQsIDUsIDYsIDUsIDYsIDddXG4gICAgICovXG4gICAgdmFyIGxpZnROID0gX2N1cnJ5MihmdW5jdGlvbiBsaWZ0Tihhcml0eSwgZm4pIHtcbiAgICAgICAgdmFyIGxpZnRlZCA9IGN1cnJ5Tihhcml0eSwgZm4pO1xuICAgICAgICByZXR1cm4gY3VycnlOKGFyaXR5LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX3JlZHVjZShhcCwgbWFwKGxpZnRlZCwgYXJndW1lbnRzWzBdKSwgX3NsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG1lYW4gb2YgdGhlIGdpdmVuIGxpc3Qgb2YgbnVtYmVycy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBbTnVtYmVyXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0XG4gICAgICogQHJldHVybiB7TnVtYmVyfVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubWVhbihbMiwgNywgOV0pOyAvLz0+IDZcbiAgICAgKiAgICAgIFIubWVhbihbXSk7IC8vPT4gTmFOXG4gICAgICovXG4gICAgdmFyIG1lYW4gPSBfY3VycnkxKGZ1bmN0aW9uIG1lYW4obGlzdCkge1xuICAgICAgICByZXR1cm4gc3VtKGxpc3QpIC8gbGlzdC5sZW5ndGg7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBtZWRpYW4gb2YgdGhlIGdpdmVuIGxpc3Qgb2YgbnVtYmVycy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBbTnVtYmVyXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0XG4gICAgICogQHJldHVybiB7TnVtYmVyfVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubWVkaWFuKFsyLCA5LCA3XSk7IC8vPT4gN1xuICAgICAqICAgICAgUi5tZWRpYW4oWzcsIDIsIDEwLCA5XSk7IC8vPT4gOFxuICAgICAqICAgICAgUi5tZWRpYW4oW10pOyAvLz0+IE5hTlxuICAgICAqL1xuICAgIHZhciBtZWRpYW4gPSBfY3VycnkxKGZ1bmN0aW9uIG1lZGlhbihsaXN0KSB7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIE5hTjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgd2lkdGggPSAyIC0gbGVuICUgMjtcbiAgICAgICAgdmFyIGlkeCA9IChsZW4gLSB3aWR0aCkgLyAyO1xuICAgICAgICByZXR1cm4gbWVhbihfc2xpY2UobGlzdCkuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICB9KS5zbGljZShpZHgsIGlkeCArIHdpZHRoKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIHByZWRpY2F0ZSBhbmQgYSBsaXN0IG9yIG90aGVyIFwiZmlsdGVyYWJsZVwiIG9iamVjdCBhbmQgcmV0dXJucyB0aGVcbiAgICAgKiBwYWlyIG9mIGZpbHRlcmFibGUgb2JqZWN0cyBvZiB0aGUgc2FtZSB0eXBlIG9mIGVsZW1lbnRzIHdoaWNoIGRvIGFuZCBkbyBub3RcbiAgICAgKiBzYXRpc2Z5LCB0aGUgcHJlZGljYXRlLCByZXNwZWN0aXZlbHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuNFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBGaWx0ZXJhYmxlIGYgPT4gKGEgLT4gQm9vbGVhbikgLT4gZiBhIC0+IFtmIGEsIGYgYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIEEgcHJlZGljYXRlIHRvIGRldGVybWluZSB3aGljaCBzaWRlIHRoZSBlbGVtZW50IGJlbG9uZ3MgdG8uXG4gICAgICogQHBhcmFtIHtBcnJheX0gZmlsdGVyYWJsZSB0aGUgbGlzdCAob3Igb3RoZXIgZmlsdGVyYWJsZSkgdG8gcGFydGl0aW9uLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSwgY29udGFpbmluZyBmaXJzdCB0aGUgc3Vic2V0IG9mIGVsZW1lbnRzIHRoYXQgc2F0aXNmeSB0aGVcbiAgICAgKiAgICAgICAgIHByZWRpY2F0ZSwgYW5kIHNlY29uZCB0aGUgc3Vic2V0IG9mIGVsZW1lbnRzIHRoYXQgZG8gbm90IHNhdGlzZnkuXG4gICAgICogQHNlZSBSLmZpbHRlciwgUi5yZWplY3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnBhcnRpdGlvbihSLmNvbnRhaW5zKCdzJyksIFsnc3NzJywgJ3R0dCcsICdmb28nLCAnYmFycyddKTtcbiAgICAgKiAgICAgIC8vID0+IFsgWyAnc3NzJywgJ2JhcnMnIF0sICBbICd0dHQnLCAnZm9vJyBdIF1cbiAgICAgKlxuICAgICAqICAgICAgUi5wYXJ0aXRpb24oUi5jb250YWlucygncycpLCB7IGE6ICdzc3MnLCBiOiAndHR0JywgZm9vOiAnYmFycycgfSk7XG4gICAgICogICAgICAvLyA9PiBbIHsgYTogJ3NzcycsIGZvbzogJ2JhcnMnIH0sIHsgYjogJ3R0dCcgfSAgXVxuICAgICAqL1xuICAgIHZhciBwYXJ0aXRpb24gPSBqdXh0KFtcbiAgICAgICAgZmlsdGVyLFxuICAgICAgICByZWplY3RcbiAgICBdKTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGxlZnQtdG8tcmlnaHQgZnVuY3Rpb24gY29tcG9zaXRpb24uIFRoZSBsZWZ0bW9zdCBmdW5jdGlvbiBtYXkgaGF2ZVxuICAgICAqIGFueSBhcml0eTsgdGhlIHJlbWFpbmluZyBmdW5jdGlvbnMgbXVzdCBiZSB1bmFyeS5cbiAgICAgKlxuICAgICAqIEluIHNvbWUgbGlicmFyaWVzIHRoaXMgZnVuY3Rpb24gaXMgbmFtZWQgYHNlcXVlbmNlYC5cbiAgICAgKlxuICAgICAqICoqTm90ZToqKiBUaGUgcmVzdWx0IG9mIHBpcGUgaXMgbm90IGF1dG9tYXRpY2FsbHkgY3VycmllZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKChhLCBiLCAuLi4sIG4pIC0+IG8pLCAobyAtPiBwKSwgLi4uLCAoeCAtPiB5KSwgKHkgLT4geikpIC0+ICgoYSwgYiwgLi4uLCBuKSAtPiB6KVxuICAgICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZ1bmN0aW9uc1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBzZWUgUi5jb21wb3NlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGYgPSBSLnBpcGUoTWF0aC5wb3csIFIubmVnYXRlLCBSLmluYyk7XG4gICAgICpcbiAgICAgKiAgICAgIGYoMywgNCk7IC8vIC0oM140KSArIDFcbiAgICAgKi9cbiAgICB2YXIgcGlwZSA9IGZ1bmN0aW9uIHBpcGUoKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BpcGUgcmVxdWlyZXMgYXQgbGVhc3Qgb25lIGFyZ3VtZW50Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9hcml0eShhcmd1bWVudHNbMF0ubGVuZ3RoLCByZWR1Y2UoX3BpcGUsIGFyZ3VtZW50c1swXSwgdGFpbChhcmd1bWVudHMpKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGxlZnQtdG8tcmlnaHQgY29tcG9zaXRpb24gb2Ygb25lIG9yIG1vcmUgUHJvbWlzZS1yZXR1cm5pbmdcbiAgICAgKiBmdW5jdGlvbnMuIFRoZSBsZWZ0bW9zdCBmdW5jdGlvbiBtYXkgaGF2ZSBhbnkgYXJpdHk7IHRoZSByZW1haW5pbmcgZnVuY3Rpb25zXG4gICAgICogbXVzdCBiZSB1bmFyeS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKChhIC0+IFByb21pc2UgYiksIChiIC0+IFByb21pc2UgYyksIC4uLiwgKHkgLT4gUHJvbWlzZSB6KSkgLT4gKGEgLT4gUHJvbWlzZSB6KVxuICAgICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZ1bmN0aW9uc1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBzZWUgUi5jb21wb3NlUFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vICBmb2xsb3dlcnNGb3JVc2VyIDo6IFN0cmluZyAtPiBQcm9taXNlIFtVc2VyXVxuICAgICAqICAgICAgdmFyIGZvbGxvd2Vyc0ZvclVzZXIgPSBSLnBpcGVQKGRiLmdldFVzZXJCeUlkLCBkYi5nZXRGb2xsb3dlcnMpO1xuICAgICAqL1xuICAgIHZhciBwaXBlUCA9IGZ1bmN0aW9uIHBpcGVQKCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwaXBlUCByZXF1aXJlcyBhdCBsZWFzdCBvbmUgYXJndW1lbnQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2FyaXR5KGFyZ3VtZW50c1swXS5sZW5ndGgsIHJlZHVjZShfcGlwZVAsIGFyZ3VtZW50c1swXSwgdGFpbChhcmd1bWVudHMpKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE11bHRpcGxpZXMgdG9nZXRoZXIgYWxsIHRoZSBlbGVtZW50cyBvZiBhIGxpc3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBbTnVtYmVyXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IEFuIGFycmF5IG9mIG51bWJlcnNcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBwcm9kdWN0IG9mIGFsbCB0aGUgbnVtYmVycyBpbiB0aGUgbGlzdC5cbiAgICAgKiBAc2VlIFIucmVkdWNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wcm9kdWN0KFsyLDQsNiw4LDEwMCwxXSk7IC8vPT4gMzg0MDBcbiAgICAgKi9cbiAgICB2YXIgcHJvZHVjdCA9IHJlZHVjZShtdWx0aXBseSwgMSk7XG5cbiAgICAvKipcbiAgICAgKiBUcmFuc2Zvcm1zIGEgW1RyYXZlcnNhYmxlXShodHRwczovL2dpdGh1Yi5jb20vZmFudGFzeWxhbmQvZmFudGFzeS1sYW5kI3RyYXZlcnNhYmxlKVxuICAgICAqIG9mIFtBcHBsaWNhdGl2ZV0oaHR0cHM6Ly9naXRodWIuY29tL2ZhbnRhc3lsYW5kL2ZhbnRhc3ktbGFuZCNhcHBsaWNhdGl2ZSkgaW50byBhblxuICAgICAqIEFwcGxpY2F0aXZlIG9mIFRyYXZlcnNhYmxlLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYHNlcXVlbmNlYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoQXBwbGljYXRpdmUgZiwgVHJhdmVyc2FibGUgdCkgPT4gKGEgLT4gZiBhKSAtPiB0IChmIGEpIC0+IGYgKHQgYSlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvZlxuICAgICAqIEBwYXJhbSB7Kn0gdHJhdmVyc2FibGVcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi50cmF2ZXJzZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuc2VxdWVuY2UoTWF5YmUub2YsIFtKdXN0KDEpLCBKdXN0KDIpLCBKdXN0KDMpXSk7ICAgLy89PiBKdXN0KFsxLCAyLCAzXSlcbiAgICAgKiAgICAgIFIuc2VxdWVuY2UoTWF5YmUub2YsIFtKdXN0KDEpLCBKdXN0KDIpLCBOb3RoaW5nKCldKTsgLy89PiBOb3RoaW5nKClcbiAgICAgKlxuICAgICAqICAgICAgUi5zZXF1ZW5jZShSLm9mLCBKdXN0KFsxLCAyLCAzXSkpOyAvLz0+IFtKdXN0KDEpLCBKdXN0KDIpLCBKdXN0KDMpXVxuICAgICAqICAgICAgUi5zZXF1ZW5jZShSLm9mLCBOb3RoaW5nKCkpOyAgICAgICAvLz0+IFtOb3RoaW5nKCldXG4gICAgICovXG4gICAgdmFyIHNlcXVlbmNlID0gX2N1cnJ5MihmdW5jdGlvbiBzZXF1ZW5jZShvZiwgdHJhdmVyc2FibGUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB0cmF2ZXJzYWJsZS5zZXF1ZW5jZSA9PT0gJ2Z1bmN0aW9uJyA/IHRyYXZlcnNhYmxlLnNlcXVlbmNlKG9mKSA6IHJlZHVjZVJpZ2h0KGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICAgICAgICAgIHJldHVybiBhcChtYXAocHJlcGVuZCwgeCksIGFjYyk7XG4gICAgICAgIH0sIG9mKFtdKSwgdHJhdmVyc2FibGUpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTWFwcyBhbiBbQXBwbGljYXRpdmVdKGh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5bGFuZC9mYW50YXN5LWxhbmQjYXBwbGljYXRpdmUpLXJldHVybmluZ1xuICAgICAqIGZ1bmN0aW9uIG92ZXIgYSBbVHJhdmVyc2FibGVdKGh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5bGFuZC9mYW50YXN5LWxhbmQjdHJhdmVyc2FibGUpLFxuICAgICAqIHRoZW4gdXNlcyBbYHNlcXVlbmNlYF0oI3NlcXVlbmNlKSB0byB0cmFuc2Zvcm0gdGhlIHJlc3VsdGluZyBUcmF2ZXJzYWJsZSBvZiBBcHBsaWNhdGl2ZVxuICAgICAqIGludG8gYW4gQXBwbGljYXRpdmUgb2YgVHJhdmVyc2FibGUuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgc2VxdWVuY2VgIG1ldGhvZCBvZiB0aGUgdGhpcmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKEFwcGxpY2F0aXZlIGYsIFRyYXZlcnNhYmxlIHQpID0+IChhIC0+IGYgYSkgLT4gKGEgLT4gZiBiKSAtPiB0IGEgLT4gZiAodCBiKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9mXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZlxuICAgICAqIEBwYXJhbSB7Kn0gdHJhdmVyc2FibGVcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5zZXF1ZW5jZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vIFJldHVybnMgYE5vdGhpbmdgIGlmIHRoZSBnaXZlbiBkaXZpc29yIGlzIGAwYFxuICAgICAqICAgICAgc2FmZURpdiA9IG4gPT4gZCA9PiBkID09PSAwID8gTm90aGluZygpIDogSnVzdChuIC8gZClcbiAgICAgKlxuICAgICAqICAgICAgUi50cmF2ZXJzZShNYXliZS5vZiwgc2FmZURpdigxMCksIFsyLCA0LCA1XSk7IC8vPT4gSnVzdChbNSwgMi41LCAyXSlcbiAgICAgKiAgICAgIFIudHJhdmVyc2UoTWF5YmUub2YsIHNhZmVEaXYoMTApLCBbMiwgMCwgNV0pOyAvLz0+IE5vdGhpbmdcbiAgICAgKi9cbiAgICB2YXIgdHJhdmVyc2UgPSBfY3VycnkzKGZ1bmN0aW9uIHRyYXZlcnNlKG9mLCBmLCB0cmF2ZXJzYWJsZSkge1xuICAgICAgICByZXR1cm4gc2VxdWVuY2Uob2YsIG1hcChmLCB0cmF2ZXJzYWJsZSkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU2hvcnRoYW5kIGZvciBgUi5jaGFpbihSLmlkZW50aXR5KWAsIHdoaWNoIHJlbW92ZXMgb25lIGxldmVsIG9mIG5lc3RpbmcgZnJvbVxuICAgICAqIGFueSBbQ2hhaW5dKGh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5bGFuZC9mYW50YXN5LWxhbmQjY2hhaW4pLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4zLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgQ2hhaW4gYyA9PiBjIChjIGEpIC0+IGMgYVxuICAgICAqIEBwYXJhbSB7Kn0gbGlzdFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLmZsYXR0ZW4sIFIuY2hhaW5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnVubmVzdChbMSwgWzJdLCBbWzNdXV0pOyAvLz0+IFsxLCAyLCBbM11dXG4gICAgICogICAgICBSLnVubmVzdChbWzEsIDJdLCBbMywgNF0sIFs1LCA2XV0pOyAvLz0+IFsxLCAyLCAzLCA0LCA1LCA2XVxuICAgICAqL1xuICAgIHZhciB1bm5lc3QgPSBjaGFpbihfaWRlbnRpdHkpO1xuXG4gICAgdmFyIF9jb250YWlucyA9IGZ1bmN0aW9uIF9jb250YWlucyhhLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfaW5kZXhPZihsaXN0LCBhLCAwKSA+PSAwO1xuICAgIH07XG5cbiAgICAvLyAgbWFwUGFpcnMgOjogKE9iamVjdCwgW1N0cmluZ10pIC0+IFtTdHJpbmddXG4gICAgdmFyIF90b1N0cmluZyA9IGZ1bmN0aW9uIF90b1N0cmluZyh4LCBzZWVuKSB7XG4gICAgICAgIHZhciByZWN1ciA9IGZ1bmN0aW9uIHJlY3VyKHkpIHtcbiAgICAgICAgICAgIHZhciB4cyA9IHNlZW4uY29uY2F0KFt4XSk7XG4gICAgICAgICAgICByZXR1cm4gX2NvbnRhaW5zKHksIHhzKSA/ICc8Q2lyY3VsYXI+JyA6IF90b1N0cmluZyh5LCB4cyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vICBtYXBQYWlycyA6OiAoT2JqZWN0LCBbU3RyaW5nXSkgLT4gW1N0cmluZ11cbiAgICAgICAgdmFyIG1hcFBhaXJzID0gZnVuY3Rpb24gKG9iaiwga2V5cykge1xuICAgICAgICAgICAgcmV0dXJuIF9tYXAoZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3F1b3RlKGspICsgJzogJyArIHJlY3VyKG9ialtrXSk7XG4gICAgICAgICAgICB9LCBrZXlzLnNsaWNlKCkuc29ydCgpKTtcbiAgICAgICAgfTtcbiAgICAgICAgc3dpdGNoIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkpIHtcbiAgICAgICAgY2FzZSAnW29iamVjdCBBcmd1bWVudHNdJzpcbiAgICAgICAgICAgIHJldHVybiAnKGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCcgKyBfbWFwKHJlY3VyLCB4KS5qb2luKCcsICcpICsgJykpJztcbiAgICAgICAgY2FzZSAnW29iamVjdCBBcnJheV0nOlxuICAgICAgICAgICAgcmV0dXJuICdbJyArIF9tYXAocmVjdXIsIHgpLmNvbmNhdChtYXBQYWlycyh4LCByZWplY3QoZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gL15cXGQrJC8udGVzdChrKTtcbiAgICAgICAgICAgIH0sIGtleXMoeCkpKSkuam9pbignLCAnKSArICddJztcbiAgICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnID8gJ25ldyBCb29sZWFuKCcgKyByZWN1cih4LnZhbHVlT2YoKSkgKyAnKScgOiB4LnRvU3RyaW5nKCk7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgICAgICAgcmV0dXJuICduZXcgRGF0ZSgnICsgKGlzTmFOKHgudmFsdWVPZigpKSA/IHJlY3VyKE5hTikgOiBfcXVvdGUoX3RvSVNPU3RyaW5nKHgpKSkgKyAnKSc7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgTnVsbF0nOlxuICAgICAgICAgICAgcmV0dXJuICdudWxsJztcbiAgICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgPyAnbmV3IE51bWJlcignICsgcmVjdXIoeC52YWx1ZU9mKCkpICsgJyknIDogMSAvIHggPT09IC1JbmZpbml0eSA/ICctMCcgOiB4LnRvU3RyaW5nKDEwKTtcbiAgICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgPyAnbmV3IFN0cmluZygnICsgcmVjdXIoeC52YWx1ZU9mKCkpICsgJyknIDogX3F1b3RlKHgpO1xuICAgICAgICBjYXNlICdbb2JqZWN0IFVuZGVmaW5lZF0nOlxuICAgICAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKHR5cGVvZiB4LnRvU3RyaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlcHIgPSB4LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcHIgIT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXByO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAneycgKyBtYXBQYWlycyh4LCBrZXlzKHgpKS5qb2luKCcsICcpICsgJ30nO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIHJpZ2h0LXRvLWxlZnQgZnVuY3Rpb24gY29tcG9zaXRpb24uIFRoZSByaWdodG1vc3QgZnVuY3Rpb24gbWF5IGhhdmVcbiAgICAgKiBhbnkgYXJpdHk7IHRoZSByZW1haW5pbmcgZnVuY3Rpb25zIG11c3QgYmUgdW5hcnkuXG4gICAgICpcbiAgICAgKiAqKk5vdGU6KiogVGhlIHJlc3VsdCBvZiBjb21wb3NlIGlzIG5vdCBhdXRvbWF0aWNhbGx5IGN1cnJpZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKCh5IC0+IHopLCAoeCAtPiB5KSwgLi4uLCAobyAtPiBwKSwgKChhLCBiLCAuLi4sIG4pIC0+IG8pKSAtPiAoKGEsIGIsIC4uLiwgbikgLT4geilcbiAgICAgKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBmdW5jdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIucGlwZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBmID0gUi5jb21wb3NlKFIuaW5jLCBSLm5lZ2F0ZSwgTWF0aC5wb3cpO1xuICAgICAqXG4gICAgICogICAgICBmKDMsIDQpOyAvLyAtKDNeNCkgKyAxXG4gICAgICovXG4gICAgdmFyIGNvbXBvc2UgPSBmdW5jdGlvbiBjb21wb3NlKCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb21wb3NlIHJlcXVpcmVzIGF0IGxlYXN0IG9uZSBhcmd1bWVudCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwaXBlLmFwcGx5KHRoaXMsIHJldmVyc2UoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJpZ2h0LXRvLWxlZnQgS2xlaXNsaSBjb21wb3NpdGlvbiBvZiB0aGUgcHJvdmlkZWQgZnVuY3Rpb25zLFxuICAgICAqIGVhY2ggb2Ygd2hpY2ggbXVzdCByZXR1cm4gYSB2YWx1ZSBvZiBhIHR5cGUgc3VwcG9ydGVkIGJ5IFtgY2hhaW5gXSgjY2hhaW4pLlxuICAgICAqXG4gICAgICogYFIuY29tcG9zZUsoaCwgZywgZilgIGlzIGVxdWl2YWxlbnQgdG8gYFIuY29tcG9zZShSLmNoYWluKGgpLCBSLmNoYWluKGcpLCBSLmNoYWluKGYpKWAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE2LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIENoYWluIG0gPT4gKCh5IC0+IG0geiksICh4IC0+IG0geSksIC4uLiwgKGEgLT4gbSBiKSkgLT4gKG0gYSAtPiBtIHopXG4gICAgICogQHBhcmFtIHsuLi5GdW5jdGlvbn1cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIucGlwZUtcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICAvLyAgcGFyc2VKc29uIDo6IFN0cmluZyAtPiBNYXliZSAqXG4gICAgICogICAgICAvLyAgZ2V0IDo6IFN0cmluZyAtPiBPYmplY3QgLT4gTWF5YmUgKlxuICAgICAqXG4gICAgICogICAgICAvLyAgZ2V0U3RhdGVDb2RlIDo6IE1heWJlIFN0cmluZyAtPiBNYXliZSBTdHJpbmdcbiAgICAgKiAgICAgIHZhciBnZXRTdGF0ZUNvZGUgPSBSLmNvbXBvc2VLKFxuICAgICAqICAgICAgICBSLmNvbXBvc2UoTWF5YmUub2YsIFIudG9VcHBlciksXG4gICAgICogICAgICAgIGdldCgnc3RhdGUnKSxcbiAgICAgKiAgICAgICAgZ2V0KCdhZGRyZXNzJyksXG4gICAgICogICAgICAgIGdldCgndXNlcicpLFxuICAgICAqICAgICAgICBwYXJzZUpzb25cbiAgICAgKiAgICAgICk7XG4gICAgICpcbiAgICAgKiAgICAgIGdldFN0YXRlQ29kZShNYXliZS5vZigne1widXNlclwiOntcImFkZHJlc3NcIjp7XCJzdGF0ZVwiOlwibnlcIn19fScpKTtcbiAgICAgKiAgICAgIC8vPT4gSnVzdCgnTlknKVxuICAgICAqICAgICAgZ2V0U3RhdGVDb2RlKE1heWJlLm9mKCdbSW52YWxpZCBKU09OXScpKTtcbiAgICAgKiAgICAgIC8vPT4gTm90aGluZygpXG4gICAgICovXG4gICAgdmFyIGNvbXBvc2VLID0gZnVuY3Rpb24gY29tcG9zZUsoKSB7XG4gICAgICAgIHJldHVybiBjb21wb3NlLmFwcGx5KHRoaXMsIHByZXBlbmQoaWRlbnRpdHksIG1hcChjaGFpbiwgYXJndW1lbnRzKSkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyByaWdodC10by1sZWZ0IGNvbXBvc2l0aW9uIG9mIG9uZSBvciBtb3JlIFByb21pc2UtcmV0dXJuaW5nXG4gICAgICogZnVuY3Rpb25zLiBUaGUgcmlnaHRtb3N0IGZ1bmN0aW9uIG1heSBoYXZlIGFueSBhcml0eTsgdGhlIHJlbWFpbmluZ1xuICAgICAqIGZ1bmN0aW9ucyBtdXN0IGJlIHVuYXJ5LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMC4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKHkgLT4gUHJvbWlzZSB6KSwgKHggLT4gUHJvbWlzZSB5KSwgLi4uLCAoYSAtPiBQcm9taXNlIGIpKSAtPiAoYSAtPiBQcm9taXNlIHopXG4gICAgICogQHBhcmFtIHsuLi5GdW5jdGlvbn0gZnVuY3Rpb25zXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQHNlZSBSLnBpcGVQXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gIGZvbGxvd2Vyc0ZvclVzZXIgOjogU3RyaW5nIC0+IFByb21pc2UgW1VzZXJdXG4gICAgICogICAgICB2YXIgZm9sbG93ZXJzRm9yVXNlciA9IFIuY29tcG9zZVAoZGIuZ2V0Rm9sbG93ZXJzLCBkYi5nZXRVc2VyQnlJZCk7XG4gICAgICovXG4gICAgdmFyIGNvbXBvc2VQID0gZnVuY3Rpb24gY29tcG9zZVAoKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvbXBvc2VQIHJlcXVpcmVzIGF0IGxlYXN0IG9uZSBhcmd1bWVudCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwaXBlUC5hcHBseSh0aGlzLCByZXZlcnNlKGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBXcmFwcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGluc2lkZSBhIGN1cnJpZWQgZnVuY3Rpb24gdGhhdCBjYW4gYmUgY2FsbGVkXG4gICAgICogd2l0aCB0aGUgc2FtZSBhcmd1bWVudHMgYW5kIHJldHVybnMgdGhlIHNhbWUgdHlwZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKiAtPiB7Kn0pIC0+ICgqIC0+IHsqfSlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBGbiBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gdG8gd3JhcC5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSB3cmFwcGVkLCBjdXJyaWVkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vIENvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgICogICAgICB2YXIgV2lkZ2V0ID0gY29uZmlnID0+IHtcbiAgICAgKiAgICAgICAgLy8gLi4uXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgV2lkZ2V0LnByb3RvdHlwZSA9IHtcbiAgICAgKiAgICAgICAgLy8gLi4uXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgdmFyIGFsbENvbmZpZ3MgPSBbXG4gICAgICogICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgXTtcbiAgICAgKiAgICAgIFIubWFwKFIuY29uc3RydWN0KFdpZGdldCksIGFsbENvbmZpZ3MpOyAvLyBhIGxpc3Qgb2YgV2lkZ2V0c1xuICAgICAqL1xuICAgIHZhciBjb25zdHJ1Y3QgPSBfY3VycnkxKGZ1bmN0aW9uIGNvbnN0cnVjdChGbikge1xuICAgICAgICByZXR1cm4gY29uc3RydWN0TihGbi5sZW5ndGgsIEZuKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBzcGVjaWZpZWQgdmFsdWUgaXMgZXF1YWwsIGluIGBSLmVxdWFsc2AgdGVybXMsIHRvIGF0XG4gICAgICogbGVhc3Qgb25lIGVsZW1lbnQgb2YgdGhlIGdpdmVuIGxpc3Q7IGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgYSAtPiBbYV0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhIFRoZSBpdGVtIHRvIGNvbXBhcmUgYWdhaW5zdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGl0ZW0gaXMgaW4gdGhlIGxpc3QsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqIEBzZWUgUi5hbnlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmNvbnRhaW5zKDMsIFsxLCAyLCAzXSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5jb250YWlucyg0LCBbMSwgMiwgM10pOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmNvbnRhaW5zKFs0Ml0sIFtbNDJdXSk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBjb250YWlucyA9IF9jdXJyeTIoX2NvbnRhaW5zKTtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSBzZXQgKGkuZS4gbm8gZHVwbGljYXRlcykgb2YgYWxsIGVsZW1lbnRzIGluIHRoZSBmaXJzdCBsaXN0IG5vdFxuICAgICAqIGNvbnRhaW5lZCBpbiB0aGUgc2Vjb25kIGxpc3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgWypdIC0+IFsqXSAtPiBbKl1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MSBUaGUgZmlyc3QgbGlzdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MiBUaGUgc2Vjb25kIGxpc3QuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBlbGVtZW50cyBpbiBgbGlzdDFgIHRoYXQgYXJlIG5vdCBpbiBgbGlzdDJgLlxuICAgICAqIEBzZWUgUi5kaWZmZXJlbmNlV2l0aFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZGlmZmVyZW5jZShbMSwyLDMsNF0sIFs3LDYsNSw0LDNdKTsgLy89PiBbMSwyXVxuICAgICAqICAgICAgUi5kaWZmZXJlbmNlKFs3LDYsNSw0LDNdLCBbMSwyLDMsNF0pOyAvLz0+IFs3LDYsNV1cbiAgICAgKi9cbiAgICB2YXIgZGlmZmVyZW5jZSA9IF9jdXJyeTIoZnVuY3Rpb24gZGlmZmVyZW5jZShmaXJzdCwgc2Vjb25kKSB7XG4gICAgICAgIHZhciBvdXQgPSBbXTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBmaXJzdExlbiA9IGZpcnN0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGZpcnN0TGVuKSB7XG4gICAgICAgICAgICBpZiAoIV9jb250YWlucyhmaXJzdFtpZHhdLCBzZWNvbmQpICYmICFfY29udGFpbnMoZmlyc3RbaWR4XSwgb3V0KSkge1xuICAgICAgICAgICAgICAgIG91dFtvdXQubGVuZ3RoXSA9IGZpcnN0W2lkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IHdpdGhvdXQgYW55IGNvbnNlY3V0aXZlbHkgcmVwZWF0aW5nIGVsZW1lbnRzLiBgUi5lcXVhbHNgXG4gICAgICogaXMgdXNlZCB0byBkZXRlcm1pbmUgZXF1YWxpdHkuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZHJvcFJlcGVhdHNgIG1ldGhvZCBvZiB0aGUgZmlyc3QgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBgbGlzdGAgd2l0aG91dCByZXBlYXRpbmcgZWxlbWVudHMuXG4gICAgICogQHNlZSBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgUi5kcm9wUmVwZWF0cyhbMSwgMSwgMSwgMiwgMywgNCwgNCwgMiwgMl0pOyAvLz0+IFsxLCAyLCAzLCA0LCAyXVxuICAgICAqL1xuICAgIHZhciBkcm9wUmVwZWF0cyA9IF9jdXJyeTEoX2Rpc3BhdGNoYWJsZSgnZHJvcFJlcGVhdHMnLCBfeGRyb3BSZXBlYXRzV2l0aChlcXVhbHMpLCBkcm9wUmVwZWF0c1dpdGgoZXF1YWxzKSkpO1xuXG4gICAgLyoqXG4gICAgICogXCJsaWZ0c1wiIGEgZnVuY3Rpb24gb2YgYXJpdHkgPiAxIHNvIHRoYXQgaXQgbWF5IFwibWFwIG92ZXJcIiBhIGxpc3QsIEZ1bmN0aW9uIG9yIG90aGVyXG4gICAgICogb2JqZWN0IHRoYXQgc2F0aXNmaWVzIHRoZSBbRmFudGFzeUxhbmQgQXBwbHkgc3BlY10oaHR0cHM6Ly9naXRodWIuY29tL2ZhbnRhc3lsYW5kL2ZhbnRhc3ktbGFuZCNhcHBseSkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjcuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKCouLi4gLT4gKikgLT4gKFsqXS4uLiAtPiBbKl0pXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGxpZnQgaW50byBoaWdoZXIgY29udGV4dFxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgbGlmdGVkIGZ1bmN0aW9uLlxuICAgICAqIEBzZWUgUi5saWZ0TlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtYWRkMyA9IFIubGlmdChSLmN1cnJ5KChhLCBiLCBjKSA9PiBhICsgYiArIGMpKTtcbiAgICAgKlxuICAgICAqICAgICAgbWFkZDMoWzEsMiwzXSwgWzEsMiwzXSwgWzFdKTsgLy89PiBbMywgNCwgNSwgNCwgNSwgNiwgNSwgNiwgN11cbiAgICAgKlxuICAgICAqICAgICAgdmFyIG1hZGQ1ID0gUi5saWZ0KFIuY3VycnkoKGEsIGIsIGMsIGQsIGUpID0+IGEgKyBiICsgYyArIGQgKyBlKSk7XG4gICAgICpcbiAgICAgKiAgICAgIG1hZGQ1KFsxLDJdLCBbM10sIFs0LCA1XSwgWzZdLCBbNywgOF0pOyAvLz0+IFsyMSwgMjIsIDIyLCAyMywgMjIsIDIzLCAyMywgMjRdXG4gICAgICovXG4gICAgdmFyIGxpZnQgPSBfY3VycnkxKGZ1bmN0aW9uIGxpZnQoZm4pIHtcbiAgICAgICAgcmV0dXJuIGxpZnROKGZuLmxlbmd0aCwgZm4pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHBhcnRpYWwgY29weSBvZiBhbiBvYmplY3Qgb21pdHRpbmcgdGhlIGtleXMgc3BlY2lmaWVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBbU3RyaW5nXSAtPiB7U3RyaW5nOiAqfSAtPiB7U3RyaW5nOiAqfVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IG5hbWVzIGFuIGFycmF5IG9mIFN0cmluZyBwcm9wZXJ0eSBuYW1lcyB0byBvbWl0IGZyb20gdGhlIG5ldyBvYmplY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gY29weSBmcm9tXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBBIG5ldyBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIGZyb20gYG5hbWVzYCBub3Qgb24gaXQuXG4gICAgICogQHNlZSBSLnBpY2tcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm9taXQoWydhJywgJ2QnXSwge2E6IDEsIGI6IDIsIGM6IDMsIGQ6IDR9KTsgLy89PiB7YjogMiwgYzogM31cbiAgICAgKi9cbiAgICB2YXIgb21pdCA9IF9jdXJyeTIoZnVuY3Rpb24gb21pdChuYW1lcywgb2JqKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICghX2NvbnRhaW5zKHByb3AsIG5hbWVzKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtwcm9wXSA9IG9ialtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbGVmdC10by1yaWdodCBLbGVpc2xpIGNvbXBvc2l0aW9uIG9mIHRoZSBwcm92aWRlZCBmdW5jdGlvbnMsXG4gICAgICogZWFjaCBvZiB3aGljaCBtdXN0IHJldHVybiBhIHZhbHVlIG9mIGEgdHlwZSBzdXBwb3J0ZWQgYnkgW2BjaGFpbmBdKCNjaGFpbikuXG4gICAgICpcbiAgICAgKiBgUi5waXBlSyhmLCBnLCBoKWAgaXMgZXF1aXZhbGVudCB0byBgUi5waXBlKFIuY2hhaW4oZiksIFIuY2hhaW4oZyksIFIuY2hhaW4oaCkpYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgQ2hhaW4gbSA9PiAoKGEgLT4gbSBiKSwgKGIgLT4gbSBjKSwgLi4uLCAoeSAtPiBtIHopKSAtPiAobSBhIC0+IG0geilcbiAgICAgKiBAcGFyYW0gey4uLkZ1bmN0aW9ufVxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBzZWUgUi5jb21wb3NlS1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vICBwYXJzZUpzb24gOjogU3RyaW5nIC0+IE1heWJlICpcbiAgICAgKiAgICAgIC8vICBnZXQgOjogU3RyaW5nIC0+IE9iamVjdCAtPiBNYXliZSAqXG4gICAgICpcbiAgICAgKiAgICAgIC8vICBnZXRTdGF0ZUNvZGUgOjogTWF5YmUgU3RyaW5nIC0+IE1heWJlIFN0cmluZ1xuICAgICAqICAgICAgdmFyIGdldFN0YXRlQ29kZSA9IFIucGlwZUsoXG4gICAgICogICAgICAgIHBhcnNlSnNvbixcbiAgICAgKiAgICAgICAgZ2V0KCd1c2VyJyksXG4gICAgICogICAgICAgIGdldCgnYWRkcmVzcycpLFxuICAgICAqICAgICAgICBnZXQoJ3N0YXRlJyksXG4gICAgICogICAgICAgIFIuY29tcG9zZShNYXliZS5vZiwgUi50b1VwcGVyKVxuICAgICAqICAgICAgKTtcbiAgICAgKlxuICAgICAqICAgICAgZ2V0U3RhdGVDb2RlKE1heWJlLm9mKCd7XCJ1c2VyXCI6e1wiYWRkcmVzc1wiOntcInN0YXRlXCI6XCJueVwifX19JykpO1xuICAgICAqICAgICAgLy89PiBKdXN0KCdOWScpXG4gICAgICogICAgICBnZXRTdGF0ZUNvZGUoTWF5YmUub2YoJ1tJbnZhbGlkIEpTT05dJykpO1xuICAgICAqICAgICAgLy89PiBOb3RoaW5nKClcbiAgICAgKi9cbiAgICB2YXIgcGlwZUsgPSBmdW5jdGlvbiBwaXBlSygpIHtcbiAgICAgICAgcmV0dXJuIGNvbXBvc2VLLmFwcGx5KHRoaXMsIHJldmVyc2UoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gdmFsdWUuIGBldmFsYCdpbmcgdGhlIG91dHB1dFxuICAgICAqIHNob3VsZCByZXN1bHQgaW4gYSB2YWx1ZSBlcXVpdmFsZW50IHRvIHRoZSBpbnB1dCB2YWx1ZS4gTWFueSBvZiB0aGUgYnVpbHQtaW5cbiAgICAgKiBgdG9TdHJpbmdgIG1ldGhvZHMgZG8gbm90IHNhdGlzZnkgdGhpcyByZXF1aXJlbWVudC5cbiAgICAgKlxuICAgICAqIElmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBgW29iamVjdCBPYmplY3RdYCB3aXRoIGEgYHRvU3RyaW5nYCBtZXRob2Qgb3RoZXJcbiAgICAgKiB0aGFuIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYCwgdGhpcyBtZXRob2QgaXMgaW52b2tlZCB3aXRoIG5vIGFyZ3VtZW50c1xuICAgICAqIHRvIHByb2R1Y2UgdGhlIHJldHVybiB2YWx1ZS4gVGhpcyBtZWFucyB1c2VyLWRlZmluZWQgY29uc3RydWN0b3IgZnVuY3Rpb25zXG4gICAgICogY2FuIHByb3ZpZGUgYSBzdWl0YWJsZSBgdG9TdHJpbmdgIG1ldGhvZC4gRm9yIGV4YW1wbGU6XG4gICAgICpcbiAgICAgKiAgICAgZnVuY3Rpb24gUG9pbnQoeCwgeSkge1xuICAgICAqICAgICAgIHRoaXMueCA9IHg7XG4gICAgICogICAgICAgdGhpcy55ID0geTtcbiAgICAgKiAgICAgfVxuICAgICAqXG4gICAgICogICAgIFBvaW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAqICAgICAgIHJldHVybiAnbmV3IFBvaW50KCcgKyB0aGlzLnggKyAnLCAnICsgdGhpcy55ICsgJyknO1xuICAgICAqICAgICB9O1xuICAgICAqXG4gICAgICogICAgIFIudG9TdHJpbmcobmV3IFBvaW50KDEsIDIpKTsgLy89PiAnbmV3IFBvaW50KDEsIDIpJ1xuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNC4wXG4gICAgICogQGNhdGVnb3J5IFN0cmluZ1xuICAgICAqIEBzaWcgKiAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbFxuICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnRvU3RyaW5nKDQyKTsgLy89PiAnNDInXG4gICAgICogICAgICBSLnRvU3RyaW5nKCdhYmMnKTsgLy89PiAnXCJhYmNcIidcbiAgICAgKiAgICAgIFIudG9TdHJpbmcoWzEsIDIsIDNdKTsgLy89PiAnWzEsIDIsIDNdJ1xuICAgICAqICAgICAgUi50b1N0cmluZyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30pOyAvLz0+ICd7XCJiYXJcIjogMiwgXCJiYXpcIjogMywgXCJmb29cIjogMX0nXG4gICAgICogICAgICBSLnRvU3RyaW5nKG5ldyBEYXRlKCcyMDAxLTAyLTAzVDA0OjA1OjA2WicpKTsgLy89PiAnbmV3IERhdGUoXCIyMDAxLTAyLTAzVDA0OjA1OjA2LjAwMFpcIiknXG4gICAgICovXG4gICAgdmFyIHRvU3RyaW5nID0gX2N1cnJ5MShmdW5jdGlvbiB0b1N0cmluZyh2YWwpIHtcbiAgICAgICAgcmV0dXJuIF90b1N0cmluZyh2YWwsIFtdKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCB3aXRob3V0IHZhbHVlcyBpbiB0aGUgZmlyc3QgYXJndW1lbnQuXG4gICAgICogYFIuZXF1YWxzYCBpcyB1c2VkIHRvIGRldGVybWluZSBlcXVhbGl0eS5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSB2YWx1ZXMgdG8gYmUgcmVtb3ZlZCBmcm9tIGBsaXN0MmAuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDIgVGhlIGFycmF5IHRvIHJlbW92ZSB2YWx1ZXMgZnJvbS5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIG5ldyBhcnJheSB3aXRob3V0IHZhbHVlcyBpbiBgbGlzdDFgLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLndpdGhvdXQoWzEsIDJdLCBbMSwgMiwgMSwgMywgNF0pOyAvLz0+IFszLCA0XVxuICAgICAqL1xuICAgIHZhciB3aXRob3V0ID0gX2N1cnJ5MihmdW5jdGlvbiAoeHMsIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChmbGlwKF9jb250YWlucykoeHMpLCBsaXN0KTtcbiAgICB9KTtcblxuICAgIC8vIEEgc2ltcGxlIFNldCB0eXBlIHRoYXQgaG9ub3VycyBSLmVxdWFscyBzZW1hbnRpY3NcbiAgICAvKiBnbG9iYWxzIFNldCAqL1xuICAgIC8qKlxuICAgICAgICogQ29tYmluZXMgdGhlIGxvZ2ljIGZvciBjaGVja2luZyB3aGV0aGVyIGFuIGl0ZW0gaXMgYSBtZW1iZXIgb2YgdGhlIHNldCBhbmRcbiAgICAgICAqIGZvciBhZGRpbmcgYSBuZXcgaXRlbSB0byB0aGUgc2V0LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSBpdGVtICAgICAgIFRoZSBpdGVtIHRvIGNoZWNrIG9yIGFkZCB0byB0aGUgU2V0IGluc3RhbmNlLlxuICAgICAgICogQHBhcmFtIHNob3VsZEFkZCAgSWYgdHJ1ZSwgdGhlIGl0ZW0gd2lsbCBiZSBhZGRlZCB0byB0aGUgc2V0IGlmIGl0IGRvZXNuJ3RcbiAgICAgICAqICAgICAgICAgICAgICAgICAgIGFscmVhZHkgZXhpc3QuXG4gICAgICAgKiBAcGFyYW0gc2V0ICAgICAgICBUaGUgc2V0IGluc3RhbmNlIHRvIGNoZWNrIG9yIGFkZCB0by5cbiAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZW4gc2hvdWxkQWRkIGlzIHRydWUsIHRoaXMgd2lsbCByZXR1cm4gdHJ1ZSB3aGVuIGEgbmV3XG4gICAgICAgKiAgICAgICAgICAgICAgICAgICBpdGVtIHdhcyBhZGRlZCBvdGhlcndpc2UgZmFsc2UuIFdoZW4gc2hvdWxkQWRkIGlzIGZhbHNlLFxuICAgICAgICogICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIHJldHVybiB0cnVlIGlmIHRoZSBpdGVtIGFscmVhZHkgZXhpc3RzLCBvdGhlcndpc2VcbiAgICAgICAqICAgICAgICAgICAgICAgICAgIGZhbHNlLlxuICAgICAgICovXG4gICAgLy8gZGlzdGluZ3Vpc2ggYmV0d2VlbiArMCBhbmQgLTBcbiAgICAvLyB0aGVzZSB0eXBlcyBjYW4gYWxsIHV0aWxpc2UgU2V0XG4gICAgLy8gc2V0Ll9pdGVtc1snYm9vbGVhbiddIGhvbGRzIGEgdHdvIGVsZW1lbnQgYXJyYXlcbiAgICAvLyByZXByZXNlbnRpbmcgWyBmYWxzZUV4aXN0cywgdHJ1ZUV4aXN0cyBdXG4gICAgLy8gY29tcGFyZSBmdW5jdGlvbnMgZm9yIHJlZmVyZW5jZSBlcXVhbGl0eVxuICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAvLyByZWR1Y2UgdGhlIHNlYXJjaCBzaXplIG9mIGhldGVyb2dlbmVvdXMgc2V0cyBieSBjcmVhdGluZyBidWNrZXRzXG4gICAgLy8gZm9yIGVhY2ggdHlwZS5cbiAgICAvLyBzY2FuIHRocm91Z2ggYWxsIHByZXZpb3VzbHkgYXBwbGllZCBpdGVtc1xuICAgIHZhciBfU2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBfU2V0KCkge1xuICAgICAgICAgICAgLyogZ2xvYmFscyBTZXQgKi9cbiAgICAgICAgICAgIHRoaXMuX25hdGl2ZVNldCA9IHR5cGVvZiBTZXQgPT09ICdmdW5jdGlvbicgPyBuZXcgU2V0KCkgOiBudWxsO1xuICAgICAgICAgICAgdGhpcy5faXRlbXMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBfU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGhhc09yQWRkKGl0ZW0sIHRydWUsIHRoaXMpO1xuICAgICAgICB9O1xuICAgICAgICBfU2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGhhc09yQWRkKGl0ZW0sIGZhbHNlLCB0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgKiBDb21iaW5lcyB0aGUgbG9naWMgZm9yIGNoZWNraW5nIHdoZXRoZXIgYW4gaXRlbSBpcyBhIG1lbWJlciBvZiB0aGUgc2V0IGFuZFxuICAgICAgICogZm9yIGFkZGluZyBhIG5ldyBpdGVtIHRvIHRoZSBzZXQuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIGl0ZW0gICAgICAgVGhlIGl0ZW0gdG8gY2hlY2sgb3IgYWRkIHRvIHRoZSBTZXQgaW5zdGFuY2UuXG4gICAgICAgKiBAcGFyYW0gc2hvdWxkQWRkICBJZiB0cnVlLCB0aGUgaXRlbSB3aWxsIGJlIGFkZGVkIHRvIHRoZSBzZXQgaWYgaXQgZG9lc24ndFxuICAgICAgICogICAgICAgICAgICAgICAgICAgYWxyZWFkeSBleGlzdC5cbiAgICAgICAqIEBwYXJhbSBzZXQgICAgICAgIFRoZSBzZXQgaW5zdGFuY2UgdG8gY2hlY2sgb3IgYWRkIHRvLlxuICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hlbiBzaG91bGRBZGQgaXMgdHJ1ZSwgdGhpcyB3aWxsIHJldHVybiB0cnVlIHdoZW4gYSBuZXdcbiAgICAgICAqICAgICAgICAgICAgICAgICAgIGl0ZW0gd2FzIGFkZGVkIG90aGVyd2lzZSBmYWxzZS4gV2hlbiBzaG91bGRBZGQgaXMgZmFsc2UsXG4gICAgICAgKiAgICAgICAgICAgICAgICAgICB0aGlzIHdpbGwgcmV0dXJuIHRydWUgaWYgdGhlIGl0ZW0gYWxyZWFkeSBleGlzdHMsIG90aGVyd2lzZVxuICAgICAgICogICAgICAgICAgICAgICAgICAgZmFsc2UuXG4gICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaGFzT3JBZGQoaXRlbSwgc2hvdWxkQWRkLCBzZXQpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0gdHlwZW9mIGl0ZW07XG4gICAgICAgICAgICB2YXIgcHJldlNpemUsIG5ld1NpemU7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIC8vIGRpc3Rpbmd1aXNoIGJldHdlZW4gKzAgYW5kIC0wXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IDAgJiYgIXNldC5faXRlbXNbJy0wJ10gJiYgMSAvIGl0ZW0gPT09IC1JbmZpbml0eSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQuX2l0ZW1zWyctMCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGVzZSB0eXBlcyBjYW4gYWxsIHV0aWxpc2UgU2V0XG4gICAgICAgICAgICAgICAgaWYgKHNldC5fbmF0aXZlU2V0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZTaXplID0gc2V0Ll9uYXRpdmVTZXQuc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldC5fbmF0aXZlU2V0LmFkZChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1NpemUgPSBzZXQuX25hdGl2ZVNldC5zaXplO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld1NpemUgPiBwcmV2U2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXQuX25hdGl2ZVNldC5oYXMoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoISh0eXBlIGluIHNldC5faXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1t0eXBlXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV1baXRlbV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtIGluIHNldC5faXRlbXNbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV1baXRlbV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIC8vIHNldC5faXRlbXNbJ2Jvb2xlYW4nXSBob2xkcyBhIHR3byBlbGVtZW50IGFycmF5XG4gICAgICAgICAgICAgICAgLy8gcmVwcmVzZW50aW5nIFsgZmFsc2VFeGlzdHMsIHRydWVFeGlzdHMgXVxuICAgICAgICAgICAgICAgIGlmICh0eXBlIGluIHNldC5faXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJJZHggPSBpdGVtID8gMSA6IDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXQuX2l0ZW1zW3R5cGVdW2JJZHhdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQuX2l0ZW1zW3R5cGVdW2JJZHhdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQuX2l0ZW1zW3R5cGVdID0gaXRlbSA/IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBdIDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgLy8gY29tcGFyZSBmdW5jdGlvbnMgZm9yIHJlZmVyZW5jZSBlcXVhbGl0eVxuICAgICAgICAgICAgICAgIGlmIChzZXQuX25hdGl2ZVNldCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2U2l6ZSA9IHNldC5fbmF0aXZlU2V0LnNpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQuX25hdGl2ZVNldC5hZGQoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdTaXplID0gc2V0Ll9uYXRpdmVTZXQuc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdTaXplID4gcHJldlNpemU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2V0Ll9uYXRpdmVTZXQuaGFzKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodHlwZSBpbiBzZXQuX2l0ZW1zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV0gPSBbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghX2NvbnRhaW5zKGl0ZW0sIHNldC5faXRlbXNbdHlwZV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1t0eXBlXS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gIXNob3VsZEFkZDtcbiAgICAgICAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICAgICAgICAgICAgaWYgKHNldC5faXRlbXNbdHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1t0eXBlXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgICAgIGlmIChpdGVtID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2V0Ll9pdGVtc1snbnVsbCddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1snbnVsbCddID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyByZWR1Y2UgdGhlIHNlYXJjaCBzaXplIG9mIGhldGVyb2dlbmVvdXMgc2V0cyBieSBjcmVhdGluZyBidWNrZXRzXG4gICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggdHlwZS5cbiAgICAgICAgICAgICAgICB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZW0pO1xuICAgICAgICAgICAgICAgIGlmICghKHR5cGUgaW4gc2V0Ll9pdGVtcykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1t0eXBlXSA9IFtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzY2FuIHRocm91Z2ggYWxsIHByZXZpb3VzbHkgYXBwbGllZCBpdGVtc1xuICAgICAgICAgICAgICAgIGlmICghX2NvbnRhaW5zKGl0ZW0sIHNldC5faXRlbXNbdHlwZV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV0ucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gIXNob3VsZEFkZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX1NldDtcbiAgICB9KCk7XG5cbiAgICAvKipcbiAgICAgKiBBIGZ1bmN0aW9uIHdyYXBwaW5nIGNhbGxzIHRvIHRoZSB0d28gZnVuY3Rpb25zIGluIGFuIGAmJmAgb3BlcmF0aW9uLFxuICAgICAqIHJldHVybmluZyB0aGUgcmVzdWx0IG9mIHRoZSBmaXJzdCBmdW5jdGlvbiBpZiBpdCBpcyBmYWxzZS15IGFuZCB0aGUgcmVzdWx0XG4gICAgICogb2YgdGhlIHNlY29uZCBmdW5jdGlvbiBvdGhlcndpc2UuIE5vdGUgdGhhdCB0aGlzIGlzIHNob3J0LWNpcmN1aXRlZCxcbiAgICAgKiBtZWFuaW5nIHRoYXQgdGhlIHNlY29uZCBmdW5jdGlvbiB3aWxsIG5vdCBiZSBpbnZva2VkIGlmIHRoZSBmaXJzdCByZXR1cm5zIGFcbiAgICAgKiBmYWxzZS15IHZhbHVlLlxuICAgICAqXG4gICAgICogSW4gYWRkaXRpb24gdG8gZnVuY3Rpb25zLCBgUi5ib3RoYCBhbHNvIGFjY2VwdHMgYW55IGZhbnRhc3ktbGFuZCBjb21wYXRpYmxlXG4gICAgICogYXBwbGljYXRpdmUgZnVuY3Rvci5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTIuMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKCouLi4gLT4gQm9vbGVhbikgLT4gKCouLi4gLT4gQm9vbGVhbikgLT4gKCouLi4gLT4gQm9vbGVhbilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmIGEgcHJlZGljYXRlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZyBhbm90aGVyIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgYXBwbGllcyBpdHMgYXJndW1lbnRzIHRvIGBmYCBhbmQgYGdgIGFuZCBgJiZgcyB0aGVpciBvdXRwdXRzIHRvZ2V0aGVyLlxuICAgICAqIEBzZWUgUi5hbmRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZ3QxMCA9IHggPT4geCA+IDEwO1xuICAgICAqICAgICAgdmFyIGV2ZW4gPSB4ID0+IHggJSAyID09PSAwO1xuICAgICAqICAgICAgdmFyIGYgPSBSLmJvdGgoZ3QxMCwgZXZlbik7XG4gICAgICogICAgICBmKDEwMCk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgZigxMDEpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGJvdGggPSBfY3VycnkyKGZ1bmN0aW9uIGJvdGgoZiwgZykge1xuICAgICAgICByZXR1cm4gX2lzRnVuY3Rpb24oZikgPyBmdW5jdGlvbiBfYm90aCgpIHtcbiAgICAgICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgJiYgZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9IDogbGlmdChhbmQpKGYsIGcpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBmdW5jdGlvbiBgZmAgYW5kIHJldHVybnMgYSBmdW5jdGlvbiBgZ2Agc3VjaCB0aGF0OlxuICAgICAqXG4gICAgICogICAtIGFwcGx5aW5nIGBnYCB0byB6ZXJvIG9yIG1vcmUgYXJndW1lbnRzIHdpbGwgZ2l2ZSBfX3RydWVfXyBpZiBhcHBseWluZ1xuICAgICAqICAgICB0aGUgc2FtZSBhcmd1bWVudHMgdG8gYGZgIGdpdmVzIGEgbG9naWNhbCBfX2ZhbHNlX18gdmFsdWU7IGFuZFxuICAgICAqXG4gICAgICogICAtIGFwcGx5aW5nIGBnYCB0byB6ZXJvIG9yIG1vcmUgYXJndW1lbnRzIHdpbGwgZ2l2ZSBfX2ZhbHNlX18gaWYgYXBwbHlpbmdcbiAgICAgKiAgICAgdGhlIHNhbWUgYXJndW1lbnRzIHRvIGBmYCBnaXZlcyBhIGxvZ2ljYWwgX190cnVlX18gdmFsdWUuXG4gICAgICpcbiAgICAgKiBgUi5jb21wbGVtZW50YCB3aWxsIHdvcmsgb24gYWxsIG90aGVyIGZ1bmN0b3JzIGFzIHdlbGwuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnICgqLi4uIC0+ICopIC0+ICgqLi4uIC0+IEJvb2xlYW4pXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBzZWUgUi5ub3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNFdmVuID0gbiA9PiBuICUgMiA9PT0gMDtcbiAgICAgKiAgICAgIHZhciBpc09kZCA9IFIuY29tcGxlbWVudChpc0V2ZW4pO1xuICAgICAqICAgICAgaXNPZGQoMjEpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIGlzT2RkKDQyKTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBjb21wbGVtZW50ID0gbGlmdChub3QpO1xuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB3cmFwcGluZyBjYWxscyB0byB0aGUgdHdvIGZ1bmN0aW9ucyBpbiBhbiBgfHxgIG9wZXJhdGlvbixcbiAgICAgKiByZXR1cm5pbmcgdGhlIHJlc3VsdCBvZiB0aGUgZmlyc3QgZnVuY3Rpb24gaWYgaXQgaXMgdHJ1dGgteSBhbmQgdGhlIHJlc3VsdFxuICAgICAqIG9mIHRoZSBzZWNvbmQgZnVuY3Rpb24gb3RoZXJ3aXNlLiBOb3RlIHRoYXQgdGhpcyBpcyBzaG9ydC1jaXJjdWl0ZWQsXG4gICAgICogbWVhbmluZyB0aGF0IHRoZSBzZWNvbmQgZnVuY3Rpb24gd2lsbCBub3QgYmUgaW52b2tlZCBpZiB0aGUgZmlyc3QgcmV0dXJucyBhXG4gICAgICogdHJ1dGgteSB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEluIGFkZGl0aW9uIHRvIGZ1bmN0aW9ucywgYFIuZWl0aGVyYCBhbHNvIGFjY2VwdHMgYW55IGZhbnRhc3ktbGFuZCBjb21wYXRpYmxlXG4gICAgICogYXBwbGljYXRpdmUgZnVuY3Rvci5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTIuMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKCouLi4gLT4gQm9vbGVhbikgLT4gKCouLi4gLT4gQm9vbGVhbikgLT4gKCouLi4gLT4gQm9vbGVhbilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmIGEgcHJlZGljYXRlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZyBhbm90aGVyIHByZWRpY2F0ZVxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgYXBwbGllcyBpdHMgYXJndW1lbnRzIHRvIGBmYCBhbmQgYGdgIGFuZCBgfHxgcyB0aGVpciBvdXRwdXRzIHRvZ2V0aGVyLlxuICAgICAqIEBzZWUgUi5vclxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBndDEwID0geCA9PiB4ID4gMTA7XG4gICAgICogICAgICB2YXIgZXZlbiA9IHggPT4geCAlIDIgPT09IDA7XG4gICAgICogICAgICB2YXIgZiA9IFIuZWl0aGVyKGd0MTAsIGV2ZW4pO1xuICAgICAqICAgICAgZigxMDEpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIGYoOCk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBlaXRoZXIgPSBfY3VycnkyKGZ1bmN0aW9uIGVpdGhlcihmLCBnKSB7XG4gICAgICAgIHJldHVybiBfaXNGdW5jdGlvbihmKSA/IGZ1bmN0aW9uIF9laXRoZXIoKSB7XG4gICAgICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IGcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSA6IGxpZnQob3IpKGYsIGcpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVHVybnMgYSBuYW1lZCBtZXRob2Qgd2l0aCBhIHNwZWNpZmllZCBhcml0eSBpbnRvIGEgZnVuY3Rpb24gdGhhdCBjYW4gYmVcbiAgICAgKiBjYWxsZWQgZGlyZWN0bHkgc3VwcGxpZWQgd2l0aCBhcmd1bWVudHMgYW5kIGEgdGFyZ2V0IG9iamVjdC5cbiAgICAgKlxuICAgICAqIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBjdXJyaWVkIGFuZCBhY2NlcHRzIGBhcml0eSArIDFgIHBhcmFtZXRlcnMgd2hlcmVcbiAgICAgKiB0aGUgZmluYWwgcGFyYW1ldGVyIGlzIHRoZSB0YXJnZXQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIE51bWJlciAtPiBTdHJpbmcgLT4gKGEgLT4gYiAtPiAuLi4gLT4gbiAtPiBPYmplY3QgLT4gKilcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYXJpdHkgTnVtYmVyIG9mIGFyZ3VtZW50cyB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gc2hvdWxkIHRha2VcbiAgICAgKiAgICAgICAgYmVmb3JlIHRoZSB0YXJnZXQgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2QgTmFtZSBvZiB0aGUgbWV0aG9kIHRvIGNhbGwuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNsaWNlRnJvbSA9IFIuaW52b2tlcigxLCAnc2xpY2UnKTtcbiAgICAgKiAgICAgIHNsaWNlRnJvbSg2LCAnYWJjZGVmZ2hpamtsbScpOyAvLz0+ICdnaGlqa2xtJ1xuICAgICAqICAgICAgdmFyIHNsaWNlRnJvbTYgPSBSLmludm9rZXIoMiwgJ3NsaWNlJykoNik7XG4gICAgICogICAgICBzbGljZUZyb202KDgsICdhYmNkZWZnaGlqa2xtJyk7IC8vPT4gJ2doJ1xuICAgICAqL1xuICAgIHZhciBpbnZva2VyID0gX2N1cnJ5MihmdW5jdGlvbiBpbnZva2VyKGFyaXR5LCBtZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5Tihhcml0eSArIDEsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSBhcmd1bWVudHNbYXJpdHldO1xuICAgICAgICAgICAgaWYgKHRhcmdldCAhPSBudWxsICYmIGlzKEZ1bmN0aW9uLCB0YXJnZXRbbWV0aG9kXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W21ldGhvZF0uYXBwbHkodGFyZ2V0LCBfc2xpY2UoYXJndW1lbnRzLCAwLCBhcml0eSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcih0b1N0cmluZyh0YXJnZXQpICsgJyBkb2VzIG5vdCBoYXZlIGEgbWV0aG9kIG5hbWVkIFwiJyArIG1ldGhvZCArICdcIicpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBzdHJpbmcgbWFkZSBieSBpbnNlcnRpbmcgdGhlIGBzZXBhcmF0b3JgIGJldHdlZW4gZWFjaCBlbGVtZW50IGFuZFxuICAgICAqIGNvbmNhdGVuYXRpbmcgYWxsIHRoZSBlbGVtZW50cyBpbnRvIGEgc2luZ2xlIHN0cmluZy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFN0cmluZyAtPiBbYV0gLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtOdW1iZXJ8U3RyaW5nfSBzZXBhcmF0b3IgVGhlIHN0cmluZyB1c2VkIHRvIHNlcGFyYXRlIHRoZSBlbGVtZW50cy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSB4cyBUaGUgZWxlbWVudHMgdG8gam9pbiBpbnRvIGEgc3RyaW5nLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgbWFkZSBieSBjb25jYXRlbmF0aW5nIGB4c2Agd2l0aCBgc2VwYXJhdG9yYC5cbiAgICAgKiBAc2VlIFIuc3BsaXRcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgc3BhY2VyID0gUi5qb2luKCcgJyk7XG4gICAgICogICAgICBzcGFjZXIoWydhJywgMiwgMy40XSk7ICAgLy89PiAnYSAyIDMuNCdcbiAgICAgKiAgICAgIFIuam9pbignfCcsIFsxLCAyLCAzXSk7ICAgIC8vPT4gJzF8MnwzJ1xuICAgICAqL1xuICAgIHZhciBqb2luID0gaW52b2tlcigxLCAnam9pbicpO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0LCB3aGVuIGludm9rZWQsIGNhY2hlcyB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgYGZuYFxuICAgICAqIGZvciBhIGdpdmVuIGFyZ3VtZW50IHNldCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0LiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZVxuICAgICAqIG1lbW9pemVkIGBmbmAgd2l0aCB0aGUgc2FtZSBhcmd1bWVudCBzZXQgd2lsbCBub3QgcmVzdWx0IGluIGFuIGFkZGl0aW9uYWxcbiAgICAgKiBjYWxsIHRvIGBmbmA7IGluc3RlYWQsIHRoZSBjYWNoZWQgcmVzdWx0IGZvciB0aGF0IHNldCBvZiBhcmd1bWVudHMgd2lsbCBiZVxuICAgICAqIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgqLi4uIC0+IGEpIC0+ICgqLi4uIC0+IGEpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIG1lbW9pemUuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IE1lbW9pemVkIHZlcnNpb24gb2YgYGZuYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgY291bnQgPSAwO1xuICAgICAqICAgICAgdmFyIGZhY3RvcmlhbCA9IFIubWVtb2l6ZShuID0+IHtcbiAgICAgKiAgICAgICAgY291bnQgKz0gMTtcbiAgICAgKiAgICAgICAgcmV0dXJuIFIucHJvZHVjdChSLnJhbmdlKDEsIG4gKyAxKSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKiAgICAgIGZhY3RvcmlhbCg1KTsgLy89PiAxMjBcbiAgICAgKiAgICAgIGZhY3RvcmlhbCg1KTsgLy89PiAxMjBcbiAgICAgKiAgICAgIGZhY3RvcmlhbCg1KTsgLy89PiAxMjBcbiAgICAgKiAgICAgIGNvdW50OyAvLz0+IDFcbiAgICAgKi9cbiAgICB2YXIgbWVtb2l6ZSA9IF9jdXJyeTEoZnVuY3Rpb24gbWVtb2l6ZShmbikge1xuICAgICAgICB2YXIgY2FjaGUgPSB7fTtcbiAgICAgICAgcmV0dXJuIF9hcml0eShmbi5sZW5ndGgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSB0b1N0cmluZyhhcmd1bWVudHMpO1xuICAgICAgICAgICAgaWYgKCFfaGFzKGtleSwgY2FjaGUpKSB7XG4gICAgICAgICAgICAgICAgY2FjaGVba2V5XSA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVba2V5XTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBTcGxpdHMgYSBzdHJpbmcgaW50byBhbiBhcnJheSBvZiBzdHJpbmdzIGJhc2VkIG9uIHRoZSBnaXZlblxuICAgICAqIHNlcGFyYXRvci5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFN0cmluZ1xuICAgICAqIEBzaWcgKFN0cmluZyB8IFJlZ0V4cCkgLT4gU3RyaW5nIC0+IFtTdHJpbmddXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBzZXAgVGhlIHBhdHRlcm4uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIHNlcGFyYXRlIGludG8gYW4gYXJyYXkuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBhcnJheSBvZiBzdHJpbmdzIGZyb20gYHN0cmAgc2VwYXJhdGVkIGJ5IGBzdHJgLlxuICAgICAqIEBzZWUgUi5qb2luXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHBhdGhDb21wb25lbnRzID0gUi5zcGxpdCgnLycpO1xuICAgICAqICAgICAgUi50YWlsKHBhdGhDb21wb25lbnRzKCcvdXNyL2xvY2FsL2Jpbi9ub2RlJykpOyAvLz0+IFsndXNyJywgJ2xvY2FsJywgJ2JpbicsICdub2RlJ11cbiAgICAgKlxuICAgICAqICAgICAgUi5zcGxpdCgnLicsICdhLmIuYy54eXouZCcpOyAvLz0+IFsnYScsICdiJywgJ2MnLCAneHl6JywgJ2QnXVxuICAgICAqL1xuICAgIHZhciBzcGxpdCA9IGludm9rZXIoMSwgJ3NwbGl0Jyk7XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBnaXZlbiBzdHJpbmcgbWF0Y2hlcyBhIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTIuMFxuICAgICAqIEBjYXRlZ29yeSBTdHJpbmdcbiAgICAgKiBAc2lnIFJlZ0V4cCAtPiBTdHJpbmcgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSBwYXR0ZXJuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLm1hdGNoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50ZXN0KC9eeC8sICd4eXonKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLnRlc3QoL155LywgJ3h5eicpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIHRlc3QgPSBfY3VycnkyKGZ1bmN0aW9uIHRlc3QocGF0dGVybiwgc3RyKSB7XG4gICAgICAgIGlmICghX2lzUmVnRXhwKHBhdHRlcm4pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcXHUyMDE4dGVzdFxcdTIwMTkgcmVxdWlyZXMgYSB2YWx1ZSBvZiB0eXBlIFJlZ0V4cCBhcyBpdHMgZmlyc3QgYXJndW1lbnQ7IHJlY2VpdmVkICcgKyB0b1N0cmluZyhwYXR0ZXJuKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9jbG9uZVJlZ0V4cChwYXR0ZXJuKS50ZXN0KHN0cik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbG93ZXIgY2FzZSB2ZXJzaW9uIG9mIGEgc3RyaW5nLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgU3RyaW5nXG4gICAgICogQHNpZyBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIGxvd2VyIGNhc2UuXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgbG93ZXIgY2FzZSB2ZXJzaW9uIG9mIGBzdHJgLlxuICAgICAqIEBzZWUgUi50b1VwcGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50b0xvd2VyKCdYWVonKTsgLy89PiAneHl6J1xuICAgICAqL1xuICAgIHZhciB0b0xvd2VyID0gaW52b2tlcigwLCAndG9Mb3dlckNhc2UnKTtcblxuICAgIC8qKlxuICAgICAqIFRoZSB1cHBlciBjYXNlIHZlcnNpb24gb2YgYSBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBTdHJpbmdcbiAgICAgKiBAc2lnIFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gdXBwZXIgY2FzZS5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB1cHBlciBjYXNlIHZlcnNpb24gb2YgYHN0cmAuXG4gICAgICogQHNlZSBSLnRvTG93ZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnRvVXBwZXIoJ2FiYycpOyAvLz0+ICdBQkMnXG4gICAgICovXG4gICAgdmFyIHRvVXBwZXIgPSBpbnZva2VyKDAsICd0b1VwcGVyQ2FzZScpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnRhaW5pbmcgb25seSBvbmUgY29weSBvZiBlYWNoIGVsZW1lbnQgaW4gdGhlIG9yaWdpbmFsXG4gICAgICogbGlzdCwgYmFzZWQgdXBvbiB0aGUgdmFsdWUgcmV0dXJuZWQgYnkgYXBwbHlpbmcgdGhlIHN1cHBsaWVkIGZ1bmN0aW9uIHRvXG4gICAgICogZWFjaCBsaXN0IGVsZW1lbnQuIFByZWZlcnMgdGhlIGZpcnN0IGl0ZW0gaWYgdGhlIHN1cHBsaWVkIGZ1bmN0aW9uIHByb2R1Y2VzXG4gICAgICogdGhlIHNhbWUgdmFsdWUgb24gdHdvIGl0ZW1zLiBgUi5lcXVhbHNgIGlzIHVzZWQgZm9yIGNvbXBhcmlzb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE2LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gYikgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEEgZnVuY3Rpb24gdXNlZCB0byBwcm9kdWNlIGEgdmFsdWUgdG8gdXNlIGR1cmluZyBjb21wYXJpc29ucy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGxpc3Qgb2YgdW5pcXVlIGl0ZW1zLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudW5pcUJ5KE1hdGguYWJzLCBbLTEsIC01LCAyLCAxMCwgMSwgMl0pOyAvLz0+IFstMSwgLTUsIDIsIDEwXVxuICAgICAqL1xuICAgIHZhciB1bmlxQnkgPSBfY3VycnkyKGZ1bmN0aW9uIHVuaXFCeShmbiwgbGlzdCkge1xuICAgICAgICB2YXIgc2V0ID0gbmV3IF9TZXQoKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGFwcGxpZWRJdGVtLCBpdGVtO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2lkeF07XG4gICAgICAgICAgICBhcHBsaWVkSXRlbSA9IGZuKGl0ZW0pO1xuICAgICAgICAgICAgaWYgKHNldC5hZGQoYXBwbGllZEl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcmVzdWx0IG9mIGNvbmNhdGVuYXRpbmcgdGhlIGdpdmVuIGxpc3RzIG9yIHN0cmluZ3MuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgY29uY2F0YCBtZXRob2Qgb2YgdGhlIGZpcnN0IGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAc2lnIFN0cmluZyAtPiBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IGFcbiAgICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gYlxuICAgICAqIEByZXR1cm4ge0FycmF5fFN0cmluZ31cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuY29uY2F0KFtdLCBbXSk7IC8vPT4gW11cbiAgICAgKiAgICAgIFIuY29uY2F0KFs0LCA1LCA2XSwgWzEsIDIsIDNdKTsgLy89PiBbNCwgNSwgNiwgMSwgMiwgM11cbiAgICAgKiAgICAgIFIuY29uY2F0KCdBQkMnLCAnREVGJyk7IC8vICdBQkNERUYnXG4gICAgICovXG4gICAgdmFyIGNvbmNhdCA9IGZsaXAoaW52b2tlcigxLCAnY29uY2F0JykpO1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIHNldCAoaS5lLiBubyBkdXBsaWNhdGVzKSBvZiBhbGwgZWxlbWVudHMgY29udGFpbmVkIGluIHRoZSBmaXJzdCBvclxuICAgICAqIHNlY29uZCBsaXN0LCBidXQgbm90IGJvdGguXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIFsqXSAtPiBbKl0gLT4gWypdXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDEgVGhlIGZpcnN0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDIgVGhlIHNlY29uZCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgZWxlbWVudHMgaW4gYGxpc3QxYCBvciBgbGlzdDJgLCBidXQgbm90IGJvdGguXG4gICAgICogQHNlZSBSLnN5bW1ldHJpY0RpZmZlcmVuY2VXaXRoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5zeW1tZXRyaWNEaWZmZXJlbmNlKFsxLDIsMyw0XSwgWzcsNiw1LDQsM10pOyAvLz0+IFsxLDIsNyw2LDVdXG4gICAgICogICAgICBSLnN5bW1ldHJpY0RpZmZlcmVuY2UoWzcsNiw1LDQsM10sIFsxLDIsMyw0XSk7IC8vPT4gWzcsNiw1LDEsMl1cbiAgICAgKi9cbiAgICB2YXIgc3ltbWV0cmljRGlmZmVyZW5jZSA9IF9jdXJyeTIoZnVuY3Rpb24gc3ltbWV0cmljRGlmZmVyZW5jZShsaXN0MSwgbGlzdDIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmNhdChkaWZmZXJlbmNlKGxpc3QxLCBsaXN0MiksIGRpZmZlcmVuY2UobGlzdDIsIGxpc3QxKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgc2V0IChpLmUuIG5vIGR1cGxpY2F0ZXMpIG9mIGFsbCBlbGVtZW50cyBjb250YWluZWQgaW4gdGhlIGZpcnN0IG9yXG4gICAgICogc2Vjb25kIGxpc3QsIGJ1dCBub3QgYm90aC4gRHVwbGljYXRpb24gaXMgZGV0ZXJtaW5lZCBhY2NvcmRpbmcgdG8gdGhlIHZhbHVlXG4gICAgICogcmV0dXJuZWQgYnkgYXBwbHlpbmcgdGhlIHN1cHBsaWVkIHByZWRpY2F0ZSB0byB0d28gbGlzdCBlbGVtZW50cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgKGEgLT4gYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgQSBwcmVkaWNhdGUgdXNlZCB0byB0ZXN0IHdoZXRoZXIgdHdvIGl0ZW1zIGFyZSBlcXVhbC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MSBUaGUgZmlyc3QgbGlzdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MiBUaGUgc2Vjb25kIGxpc3QuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBlbGVtZW50cyBpbiBgbGlzdDFgIG9yIGBsaXN0MmAsIGJ1dCBub3QgYm90aC5cbiAgICAgKiBAc2VlIFIuc3ltbWV0cmljRGlmZmVyZW5jZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBlcUEgPSBSLmVxQnkoUi5wcm9wKCdhJykpO1xuICAgICAqICAgICAgdmFyIGwxID0gW3thOiAxfSwge2E6IDJ9LCB7YTogM30sIHthOiA0fV07XG4gICAgICogICAgICB2YXIgbDIgPSBbe2E6IDN9LCB7YTogNH0sIHthOiA1fSwge2E6IDZ9XTtcbiAgICAgKiAgICAgIFIuc3ltbWV0cmljRGlmZmVyZW5jZVdpdGgoZXFBLCBsMSwgbDIpOyAvLz0+IFt7YTogMX0sIHthOiAyfSwge2E6IDV9LCB7YTogNn1dXG4gICAgICovXG4gICAgdmFyIHN5bW1ldHJpY0RpZmZlcmVuY2VXaXRoID0gX2N1cnJ5MyhmdW5jdGlvbiBzeW1tZXRyaWNEaWZmZXJlbmNlV2l0aChwcmVkLCBsaXN0MSwgbGlzdDIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmNhdChkaWZmZXJlbmNlV2l0aChwcmVkLCBsaXN0MSwgbGlzdDIpLCBkaWZmZXJlbmNlV2l0aChwcmVkLCBsaXN0MiwgbGlzdDEpKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIG9ubHkgb25lIGNvcHkgb2YgZWFjaCBlbGVtZW50IGluIHRoZSBvcmlnaW5hbFxuICAgICAqIGxpc3QuIGBSLmVxdWFsc2AgaXMgdXNlZCB0byBkZXRlcm1pbmUgZXF1YWxpdHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBsaXN0IG9mIHVuaXF1ZSBpdGVtcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnVuaXEoWzEsIDEsIDIsIDFdKTsgLy89PiBbMSwgMl1cbiAgICAgKiAgICAgIFIudW5pcShbMSwgJzEnXSk7ICAgICAvLz0+IFsxLCAnMSddXG4gICAgICogICAgICBSLnVuaXEoW1s0Ml0sIFs0Ml1dKTsgLy89PiBbWzQyXV1cbiAgICAgKi9cbiAgICB2YXIgdW5pcSA9IHVuaXFCeShpZGVudGl0eSk7XG5cbiAgICAvKipcbiAgICAgKiBDb21iaW5lcyB0d28gbGlzdHMgaW50byBhIHNldCAoaS5lLiBubyBkdXBsaWNhdGVzKSBjb21wb3NlZCBvZiB0aG9zZVxuICAgICAqIGVsZW1lbnRzIGNvbW1vbiB0byBib3RoIGxpc3RzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIFsqXSAtPiBbKl0gLT4gWypdXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDEgVGhlIGZpcnN0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDIgVGhlIHNlY29uZCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBvZiBlbGVtZW50cyBmb3VuZCBpbiBib3RoIGBsaXN0MWAgYW5kIGBsaXN0MmAuXG4gICAgICogQHNlZSBSLmludGVyc2VjdGlvbldpdGhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmludGVyc2VjdGlvbihbMSwyLDMsNF0sIFs3LDYsNSw0LDNdKTsgLy89PiBbNCwgM11cbiAgICAgKi9cbiAgICB2YXIgaW50ZXJzZWN0aW9uID0gX2N1cnJ5MihmdW5jdGlvbiBpbnRlcnNlY3Rpb24obGlzdDEsIGxpc3QyKSB7XG4gICAgICAgIHZhciBsb29rdXBMaXN0LCBmaWx0ZXJlZExpc3Q7XG4gICAgICAgIGlmIChsaXN0MS5sZW5ndGggPiBsaXN0Mi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxvb2t1cExpc3QgPSBsaXN0MTtcbiAgICAgICAgICAgIGZpbHRlcmVkTGlzdCA9IGxpc3QyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9va3VwTGlzdCA9IGxpc3QyO1xuICAgICAgICAgICAgZmlsdGVyZWRMaXN0ID0gbGlzdDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuaXEoX2ZpbHRlcihmbGlwKF9jb250YWlucykobG9va3VwTGlzdCksIGZpbHRlcmVkTGlzdCkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ29tYmluZXMgdHdvIGxpc3RzIGludG8gYSBzZXQgKGkuZS4gbm8gZHVwbGljYXRlcykgY29tcG9zZWQgb2YgdGhlIGVsZW1lbnRzXG4gICAgICogb2YgZWFjaCBsaXN0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIFsqXSAtPiBbKl0gLT4gWypdXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXMgVGhlIGZpcnN0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gYnMgVGhlIHNlY29uZCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgZmlyc3QgYW5kIHNlY29uZCBsaXN0cyBjb25jYXRlbmF0ZWQsIHdpdGhcbiAgICAgKiAgICAgICAgIGR1cGxpY2F0ZXMgcmVtb3ZlZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnVuaW9uKFsxLCAyLCAzXSwgWzIsIDMsIDRdKTsgLy89PiBbMSwgMiwgMywgNF1cbiAgICAgKi9cbiAgICB2YXIgdW5pb24gPSBfY3VycnkyKGNvbXBvc2UodW5pcSwgX2NvbmNhdCkpO1xuXG4gICAgdmFyIFIgPSB7XG4gICAgICAgIEY6IEYsXG4gICAgICAgIFQ6IFQsXG4gICAgICAgIF9fOiBfXyxcbiAgICAgICAgYWRkOiBhZGQsXG4gICAgICAgIGFkZEluZGV4OiBhZGRJbmRleCxcbiAgICAgICAgYWRqdXN0OiBhZGp1c3QsXG4gICAgICAgIGFsbDogYWxsLFxuICAgICAgICBhbGxQYXNzOiBhbGxQYXNzLFxuICAgICAgICBhbGxVbmlxOiBhbGxVbmlxLFxuICAgICAgICBhbHdheXM6IGFsd2F5cyxcbiAgICAgICAgYW5kOiBhbmQsXG4gICAgICAgIGFueTogYW55LFxuICAgICAgICBhbnlQYXNzOiBhbnlQYXNzLFxuICAgICAgICBhcDogYXAsXG4gICAgICAgIGFwZXJ0dXJlOiBhcGVydHVyZSxcbiAgICAgICAgYXBwZW5kOiBhcHBlbmQsXG4gICAgICAgIGFwcGx5OiBhcHBseSxcbiAgICAgICAgYXBwbHlTcGVjOiBhcHBseVNwZWMsXG4gICAgICAgIGFzc29jOiBhc3NvYyxcbiAgICAgICAgYXNzb2NQYXRoOiBhc3NvY1BhdGgsXG4gICAgICAgIGJpbmFyeTogYmluYXJ5LFxuICAgICAgICBiaW5kOiBiaW5kLFxuICAgICAgICBib3RoOiBib3RoLFxuICAgICAgICBjYWxsOiBjYWxsLFxuICAgICAgICBjaGFpbjogY2hhaW4sXG4gICAgICAgIGNsYW1wOiBjbGFtcCxcbiAgICAgICAgY2xvbmU6IGNsb25lLFxuICAgICAgICBjb21wYXJhdG9yOiBjb21wYXJhdG9yLFxuICAgICAgICBjb21wbGVtZW50OiBjb21wbGVtZW50LFxuICAgICAgICBjb21wb3NlOiBjb21wb3NlLFxuICAgICAgICBjb21wb3NlSzogY29tcG9zZUssXG4gICAgICAgIGNvbXBvc2VQOiBjb21wb3NlUCxcbiAgICAgICAgY29uY2F0OiBjb25jYXQsXG4gICAgICAgIGNvbmQ6IGNvbmQsXG4gICAgICAgIGNvbnN0cnVjdDogY29uc3RydWN0LFxuICAgICAgICBjb25zdHJ1Y3ROOiBjb25zdHJ1Y3ROLFxuICAgICAgICBjb250YWluczogY29udGFpbnMsXG4gICAgICAgIGNvbnZlcmdlOiBjb252ZXJnZSxcbiAgICAgICAgY291bnRCeTogY291bnRCeSxcbiAgICAgICAgY3Vycnk6IGN1cnJ5LFxuICAgICAgICBjdXJyeU46IGN1cnJ5TixcbiAgICAgICAgZGVjOiBkZWMsXG4gICAgICAgIGRlZmF1bHRUbzogZGVmYXVsdFRvLFxuICAgICAgICBkaWZmZXJlbmNlOiBkaWZmZXJlbmNlLFxuICAgICAgICBkaWZmZXJlbmNlV2l0aDogZGlmZmVyZW5jZVdpdGgsXG4gICAgICAgIGRpc3NvYzogZGlzc29jLFxuICAgICAgICBkaXNzb2NQYXRoOiBkaXNzb2NQYXRoLFxuICAgICAgICBkaXZpZGU6IGRpdmlkZSxcbiAgICAgICAgZHJvcDogZHJvcCxcbiAgICAgICAgZHJvcExhc3Q6IGRyb3BMYXN0LFxuICAgICAgICBkcm9wTGFzdFdoaWxlOiBkcm9wTGFzdFdoaWxlLFxuICAgICAgICBkcm9wUmVwZWF0czogZHJvcFJlcGVhdHMsXG4gICAgICAgIGRyb3BSZXBlYXRzV2l0aDogZHJvcFJlcGVhdHNXaXRoLFxuICAgICAgICBkcm9wV2hpbGU6IGRyb3BXaGlsZSxcbiAgICAgICAgZWl0aGVyOiBlaXRoZXIsXG4gICAgICAgIGVtcHR5OiBlbXB0eSxcbiAgICAgICAgZXFCeTogZXFCeSxcbiAgICAgICAgZXFQcm9wczogZXFQcm9wcyxcbiAgICAgICAgZXF1YWxzOiBlcXVhbHMsXG4gICAgICAgIGV2b2x2ZTogZXZvbHZlLFxuICAgICAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICAgICAgZmluZDogZmluZCxcbiAgICAgICAgZmluZEluZGV4OiBmaW5kSW5kZXgsXG4gICAgICAgIGZpbmRMYXN0OiBmaW5kTGFzdCxcbiAgICAgICAgZmluZExhc3RJbmRleDogZmluZExhc3RJbmRleCxcbiAgICAgICAgZmxhdHRlbjogZmxhdHRlbixcbiAgICAgICAgZmxpcDogZmxpcCxcbiAgICAgICAgZm9yRWFjaDogZm9yRWFjaCxcbiAgICAgICAgZnJvbVBhaXJzOiBmcm9tUGFpcnMsXG4gICAgICAgIGdyb3VwQnk6IGdyb3VwQnksXG4gICAgICAgIGdyb3VwV2l0aDogZ3JvdXBXaXRoLFxuICAgICAgICBndDogZ3QsXG4gICAgICAgIGd0ZTogZ3RlLFxuICAgICAgICBoYXM6IGhhcyxcbiAgICAgICAgaGFzSW46IGhhc0luLFxuICAgICAgICBoZWFkOiBoZWFkLFxuICAgICAgICBpZGVudGljYWw6IGlkZW50aWNhbCxcbiAgICAgICAgaWRlbnRpdHk6IGlkZW50aXR5LFxuICAgICAgICBpZkVsc2U6IGlmRWxzZSxcbiAgICAgICAgaW5jOiBpbmMsXG4gICAgICAgIGluZGV4Qnk6IGluZGV4QnksXG4gICAgICAgIGluZGV4T2Y6IGluZGV4T2YsXG4gICAgICAgIGluaXQ6IGluaXQsXG4gICAgICAgIGluc2VydDogaW5zZXJ0LFxuICAgICAgICBpbnNlcnRBbGw6IGluc2VydEFsbCxcbiAgICAgICAgaW50ZXJzZWN0aW9uOiBpbnRlcnNlY3Rpb24sXG4gICAgICAgIGludGVyc2VjdGlvbldpdGg6IGludGVyc2VjdGlvbldpdGgsXG4gICAgICAgIGludGVyc3BlcnNlOiBpbnRlcnNwZXJzZSxcbiAgICAgICAgaW50bzogaW50byxcbiAgICAgICAgaW52ZXJ0OiBpbnZlcnQsXG4gICAgICAgIGludmVydE9iajogaW52ZXJ0T2JqLFxuICAgICAgICBpbnZva2VyOiBpbnZva2VyLFxuICAgICAgICBpczogaXMsXG4gICAgICAgIGlzQXJyYXlMaWtlOiBpc0FycmF5TGlrZSxcbiAgICAgICAgaXNFbXB0eTogaXNFbXB0eSxcbiAgICAgICAgaXNOaWw6IGlzTmlsLFxuICAgICAgICBqb2luOiBqb2luLFxuICAgICAgICBqdXh0OiBqdXh0LFxuICAgICAgICBrZXlzOiBrZXlzLFxuICAgICAgICBrZXlzSW46IGtleXNJbixcbiAgICAgICAgbGFzdDogbGFzdCxcbiAgICAgICAgbGFzdEluZGV4T2Y6IGxhc3RJbmRleE9mLFxuICAgICAgICBsZW5ndGg6IGxlbmd0aCxcbiAgICAgICAgbGVuczogbGVucyxcbiAgICAgICAgbGVuc0luZGV4OiBsZW5zSW5kZXgsXG4gICAgICAgIGxlbnNQYXRoOiBsZW5zUGF0aCxcbiAgICAgICAgbGVuc1Byb3A6IGxlbnNQcm9wLFxuICAgICAgICBsaWZ0OiBsaWZ0LFxuICAgICAgICBsaWZ0TjogbGlmdE4sXG4gICAgICAgIGx0OiBsdCxcbiAgICAgICAgbHRlOiBsdGUsXG4gICAgICAgIG1hcDogbWFwLFxuICAgICAgICBtYXBBY2N1bTogbWFwQWNjdW0sXG4gICAgICAgIG1hcEFjY3VtUmlnaHQ6IG1hcEFjY3VtUmlnaHQsXG4gICAgICAgIG1hcE9iakluZGV4ZWQ6IG1hcE9iakluZGV4ZWQsXG4gICAgICAgIG1hdGNoOiBtYXRjaCxcbiAgICAgICAgbWF0aE1vZDogbWF0aE1vZCxcbiAgICAgICAgbWF4OiBtYXgsXG4gICAgICAgIG1heEJ5OiBtYXhCeSxcbiAgICAgICAgbWVhbjogbWVhbixcbiAgICAgICAgbWVkaWFuOiBtZWRpYW4sXG4gICAgICAgIG1lbW9pemU6IG1lbW9pemUsXG4gICAgICAgIG1lcmdlOiBtZXJnZSxcbiAgICAgICAgbWVyZ2VBbGw6IG1lcmdlQWxsLFxuICAgICAgICBtZXJnZVdpdGg6IG1lcmdlV2l0aCxcbiAgICAgICAgbWVyZ2VXaXRoS2V5OiBtZXJnZVdpdGhLZXksXG4gICAgICAgIG1pbjogbWluLFxuICAgICAgICBtaW5CeTogbWluQnksXG4gICAgICAgIG1vZHVsbzogbW9kdWxvLFxuICAgICAgICBtdWx0aXBseTogbXVsdGlwbHksXG4gICAgICAgIG5Bcnk6IG5BcnksXG4gICAgICAgIG5lZ2F0ZTogbmVnYXRlLFxuICAgICAgICBub25lOiBub25lLFxuICAgICAgICBub3Q6IG5vdCxcbiAgICAgICAgbnRoOiBudGgsXG4gICAgICAgIG50aEFyZzogbnRoQXJnLFxuICAgICAgICBvYmpPZjogb2JqT2YsXG4gICAgICAgIG9mOiBvZixcbiAgICAgICAgb21pdDogb21pdCxcbiAgICAgICAgb25jZTogb25jZSxcbiAgICAgICAgb3I6IG9yLFxuICAgICAgICBvdmVyOiBvdmVyLFxuICAgICAgICBwYWlyOiBwYWlyLFxuICAgICAgICBwYXJ0aWFsOiBwYXJ0aWFsLFxuICAgICAgICBwYXJ0aWFsUmlnaHQ6IHBhcnRpYWxSaWdodCxcbiAgICAgICAgcGFydGl0aW9uOiBwYXJ0aXRpb24sXG4gICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgIHBhdGhFcTogcGF0aEVxLFxuICAgICAgICBwYXRoT3I6IHBhdGhPcixcbiAgICAgICAgcGF0aFNhdGlzZmllczogcGF0aFNhdGlzZmllcyxcbiAgICAgICAgcGljazogcGljayxcbiAgICAgICAgcGlja0FsbDogcGlja0FsbCxcbiAgICAgICAgcGlja0J5OiBwaWNrQnksXG4gICAgICAgIHBpcGU6IHBpcGUsXG4gICAgICAgIHBpcGVLOiBwaXBlSyxcbiAgICAgICAgcGlwZVA6IHBpcGVQLFxuICAgICAgICBwbHVjazogcGx1Y2ssXG4gICAgICAgIHByZXBlbmQ6IHByZXBlbmQsXG4gICAgICAgIHByb2R1Y3Q6IHByb2R1Y3QsXG4gICAgICAgIHByb2plY3Q6IHByb2plY3QsXG4gICAgICAgIHByb3A6IHByb3AsXG4gICAgICAgIHByb3BFcTogcHJvcEVxLFxuICAgICAgICBwcm9wSXM6IHByb3BJcyxcbiAgICAgICAgcHJvcE9yOiBwcm9wT3IsXG4gICAgICAgIHByb3BTYXRpc2ZpZXM6IHByb3BTYXRpc2ZpZXMsXG4gICAgICAgIHByb3BzOiBwcm9wcyxcbiAgICAgICAgcmFuZ2U6IHJhbmdlLFxuICAgICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgICAgcmVkdWNlQnk6IHJlZHVjZUJ5LFxuICAgICAgICByZWR1Y2VSaWdodDogcmVkdWNlUmlnaHQsXG4gICAgICAgIHJlZHVjZWQ6IHJlZHVjZWQsXG4gICAgICAgIHJlamVjdDogcmVqZWN0LFxuICAgICAgICByZW1vdmU6IHJlbW92ZSxcbiAgICAgICAgcmVwZWF0OiByZXBlYXQsXG4gICAgICAgIHJlcGxhY2U6IHJlcGxhY2UsXG4gICAgICAgIHJldmVyc2U6IHJldmVyc2UsXG4gICAgICAgIHNjYW46IHNjYW4sXG4gICAgICAgIHNlcXVlbmNlOiBzZXF1ZW5jZSxcbiAgICAgICAgc2V0OiBzZXQsXG4gICAgICAgIHNsaWNlOiBzbGljZSxcbiAgICAgICAgc29ydDogc29ydCxcbiAgICAgICAgc29ydEJ5OiBzb3J0QnksXG4gICAgICAgIHNwbGl0OiBzcGxpdCxcbiAgICAgICAgc3BsaXRBdDogc3BsaXRBdCxcbiAgICAgICAgc3BsaXRFdmVyeTogc3BsaXRFdmVyeSxcbiAgICAgICAgc3BsaXRXaGVuOiBzcGxpdFdoZW4sXG4gICAgICAgIHN1YnRyYWN0OiBzdWJ0cmFjdCxcbiAgICAgICAgc3VtOiBzdW0sXG4gICAgICAgIHN5bW1ldHJpY0RpZmZlcmVuY2U6IHN5bW1ldHJpY0RpZmZlcmVuY2UsXG4gICAgICAgIHN5bW1ldHJpY0RpZmZlcmVuY2VXaXRoOiBzeW1tZXRyaWNEaWZmZXJlbmNlV2l0aCxcbiAgICAgICAgdGFpbDogdGFpbCxcbiAgICAgICAgdGFrZTogdGFrZSxcbiAgICAgICAgdGFrZUxhc3Q6IHRha2VMYXN0LFxuICAgICAgICB0YWtlTGFzdFdoaWxlOiB0YWtlTGFzdFdoaWxlLFxuICAgICAgICB0YWtlV2hpbGU6IHRha2VXaGlsZSxcbiAgICAgICAgdGFwOiB0YXAsXG4gICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgIHRpbWVzOiB0aW1lcyxcbiAgICAgICAgdG9Mb3dlcjogdG9Mb3dlcixcbiAgICAgICAgdG9QYWlyczogdG9QYWlycyxcbiAgICAgICAgdG9QYWlyc0luOiB0b1BhaXJzSW4sXG4gICAgICAgIHRvU3RyaW5nOiB0b1N0cmluZyxcbiAgICAgICAgdG9VcHBlcjogdG9VcHBlcixcbiAgICAgICAgdHJhbnNkdWNlOiB0cmFuc2R1Y2UsXG4gICAgICAgIHRyYW5zcG9zZTogdHJhbnNwb3NlLFxuICAgICAgICB0cmF2ZXJzZTogdHJhdmVyc2UsXG4gICAgICAgIHRyaW06IHRyaW0sXG4gICAgICAgIHRyeUNhdGNoOiB0cnlDYXRjaCxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgdW5hcHBseTogdW5hcHBseSxcbiAgICAgICAgdW5hcnk6IHVuYXJ5LFxuICAgICAgICB1bmN1cnJ5TjogdW5jdXJyeU4sXG4gICAgICAgIHVuZm9sZDogdW5mb2xkLFxuICAgICAgICB1bmlvbjogdW5pb24sXG4gICAgICAgIHVuaW9uV2l0aDogdW5pb25XaXRoLFxuICAgICAgICB1bmlxOiB1bmlxLFxuICAgICAgICB1bmlxQnk6IHVuaXFCeSxcbiAgICAgICAgdW5pcVdpdGg6IHVuaXFXaXRoLFxuICAgICAgICB1bmxlc3M6IHVubGVzcyxcbiAgICAgICAgdW5uZXN0OiB1bm5lc3QsXG4gICAgICAgIHVudGlsOiB1bnRpbCxcbiAgICAgICAgdXBkYXRlOiB1cGRhdGUsXG4gICAgICAgIHVzZVdpdGg6IHVzZVdpdGgsXG4gICAgICAgIHZhbHVlczogdmFsdWVzLFxuICAgICAgICB2YWx1ZXNJbjogdmFsdWVzSW4sXG4gICAgICAgIHZpZXc6IHZpZXcsXG4gICAgICAgIHdoZW46IHdoZW4sXG4gICAgICAgIHdoZXJlOiB3aGVyZSxcbiAgICAgICAgd2hlcmVFcTogd2hlcmVFcSxcbiAgICAgICAgd2l0aG91dDogd2l0aG91dCxcbiAgICAgICAgd3JhcDogd3JhcCxcbiAgICAgICAgeHByb2Q6IHhwcm9kLFxuICAgICAgICB6aXA6IHppcCxcbiAgICAgICAgemlwT2JqOiB6aXBPYmosXG4gICAgICAgIHppcFdpdGg6IHppcFdpdGhcbiAgICB9O1xuICAvKiBlc2xpbnQtZW52IGFtZCAqL1xuXG4gIC8qIFRFU1RfRU5UUllfUE9JTlQgKi9cblxuICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBSO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIFI7IH0pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuUiA9IFI7XG4gIH1cblxufS5jYWxsKHRoaXMpKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3JhbWRhL2Rpc3QvcmFtZGEuanNcbiAqKiBtb2R1bGUgaWQgPSA0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi91dGlsL3V0aWwuanNcbiAqKiBtb2R1bGUgaWQgPSA1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qc1xuICoqIG1vZHVsZSBpZCA9IDZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qc1xuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIEZJWE1FOiByZXBsYWNlIHRoaXMgd2l0aCBhIHJlYWwgbG9nZ2luZyBsaWJyYXJ5IC0tIHdpbnN0b24/XG4vLyBsb2cgaXMgYSBmdW5jdGlvbiB0aGF0IGxvZ3MgbWVzc2FnZXMsIGFuZCBoYXMgYSBzaW1wbGUgaW5kZW50ICguZW50ZXIoKSkgYW5kXG4vLyB1bmluZGVudCAoLmV4aXQoKSkgZmVhdHVyZS5cbi8vXG4vLyBVc2FnZTpcbi8vICAgdmFyIGxvZyA9IHJlcXVpcmUoJy4vbG9nLmpzJykoKTtcbi8vICAgbG9nLmVudGVyKCdzdGFydGluZycpO1xuLy8gICAuLi5cbi8vICAgbG9nKCdhbm90aGVyIG1lc3NhZ2UnKTtcbi8vICAgbG9nLmV4aXQoKTsgIFxuXG5jb25zdCBsb2dzID0ge307XG5cbi8vIE1ha2UgYSBuZXcgbG9nZ2VyLCBvciByZXR1cm4gYW4gZXhpc3Rpbmcgb25lXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oX29wdHMpIHtcbiAgb3B0cyA9IF9vcHRzIHx8IHt9O1xuICBjb25zdCBicmFjZXMgPSAoJ2JyYWNlcycgaW4gb3B0cykgPyBvcHRzLmJyYWNlcyA6IGZhbHNlO1xuICBjb25zdCBpZCA9ICgnaWQnIGluIG9wdHMpID8gb3B0cy5pZCA6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAwMCk7XG4gIGlmIChpZCBpbiBsb2dzKSByZXR1cm4gbG9nc1tpZF07XG5cbiAgdmFyIGxvZyA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICBpZiAoIWxvZy5lbmFibGVkKSByZXR1cm47XG4gICAgYXJncy51bnNoaWZ0KCcgICcucmVwZWF0KGxvZy5pbmRlbnQpKTtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgfTtcblxuICBsb2cuaW5kZW50ID0gMDtcbiAgbG9nLmVuYWJsZWQgPSB0cnVlO1xuXG4gIGxvZy5lbmFibGUgPSBmdW5jdGlvbigpIHtcbiAgICBsb2cuZW5hYmxlZCA9IHRydWU7XG4gIH07XG4gIGxvZy5kaXNhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgbG9nLmVuYWJsZWQgPSBmYWxzZTtcbiAgfTtcblxuICBsb2cuZW50ZXIgPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgaWYgKCFsb2cuZW5hYmxlZCkgcmV0dXJuO1xuICAgIGlmIChicmFjZXMpIGFyZ3MucHVzaCgneycpO1xuICAgIGxvZyguLi5hcmdzKTtcbiAgICBsb2cuaW5kZW50Kys7XG4gIH07XG5cbiAgbG9nLmV4aXQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWxvZy5lbmFibGVkKSByZXR1cm47XG4gICAgbG9nLmluZGVudC0tO1xuICAgIGlmIChicmFjZXMpIGxvZygnfScpO1xuICB9O1xuXG4gIGxvZ3NbaWRdID0gbG9nO1xuICByZXR1cm4gbG9nO1xufVxuXG5cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvbG9nLmpzXG4gKiogbW9kdWxlIGlkID0gOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gRklYTUU6IFdoZW4gaW4gYSBicm93c2VyLCBkZWZhdWx0cyB3aWxsIGJlIGRpZmZlcmVudCAobWF5YmUsIG5vIGRlZmF1bHRzKVxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IEMxID0gcmVxdWlyZSgnLi9zZWVkLmpzJyk7XG5jb25zdCByZWNpcGUgPSBDMS5yZWNpcGU7XG5jb25zdCBSID0gcmVxdWlyZSgncmFtZGEnKTtcbmNvbnN0IHByb2Nlc3MgPSByZXF1aXJlKCdwcm9jZXNzJyk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5jb25zdCBsb2cgPSByZXF1aXJlKCcuL2xvZy5qcycpKHtpZDogJ3Jvb3QnfSk7XG5sb2cuZGlzYWJsZSgpO1xuXG5cbi8vIEdpdmVuIGEgYmFzZSBkaXJlY3RvcnksIHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHJlc29sdmVzIGEgcGF0aCByZWxhdGl2ZVxuLy8gdG8gdGhhdCBiYXNlXG5jb25zdCByZXNvbHZlRnJvbSA9IGJhc2UgPT4gUi5wYXJ0aWFsKHBhdGgucmVzb2x2ZSwgW2Jhc2VdKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICBjb25maWdEaXJFbnY6ICdDT05GSUcxX0RJUicsXG5cbiAgICBjb25maWdEaXI6IHJlY2lwZShYPT4ge1xuICAgICAgY29uc3QgZW52ID0gWC5jb25maWdEaXJFbnY7XG4gICAgICBjb25zdCByZWwgPSBwcm9jZXNzLmVudltlbnZdIHx8IHByb2Nlc3MuY3dkKCk7XG4gICAgICByZXR1cm4gcGF0aC5yZXNvbHZlKHJlbCk7XG4gICAgfSksXG5cbiAgICAvLyBUaGUgbGlzdCBvZiBjb25maWcgZmlsZW5hbWVzIHRoYXQgYXJlIHNlYXJjaGVkIGZvciBmaXJzdCwgaW4gb3JkZXIgZnJvbVxuICAgIC8vIGRlZmF1bHRzIC0+IG92ZXJyaWRlc1xuICAgIGJhc2VuYW1lczogWyAnY29uZmlnJywgJ2NvbmZpZy1sb2NhbCcgXSxcblxuICAgIC8vIExpc3Qgb2YgdmFsaWQgZmlsZW5hbWUgc3VmZml4ZXNcbiAgICBzdWZmaXhlczogWyAnLmpzJywgJy5qc29uJyBdLFxuXG4gICAgLy8gTGlzdCBvZiBmaWxlbmFtZXMsIHdoaWNoIGlzIHRoZSBldmVyeSBjb21iaW5hdGlvbiBvZiBiYXNlbmFtZXMgYW5kIHN1ZmZpeGVzXG4gICAgZmlsZW5hbWVzOiByZWNpcGUoWD0+IHtcbiAgICAgIGNvbnN0IG1hcGNhdDIgPSBSLmxpZnQoUi5jdXJyeSgoYSwgYikgPT4gYSArIGIpKTtcbiAgICAgIHJldHVybiBtYXBjYXQyKFguYmFzZW5hbWVzLCBYLnN1ZmZpeGVzKTtcbiAgICB9KSxcblxuICAgIC8vIExpc3Qgb2YgYWJzb2x1dGUgcGF0aG5hbWVzXG4gICAgcGF0aG5hbWVzOiByZWNpcGUoWD0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmUgPSByZXNvbHZlRnJvbShYLmNvbmZpZ0Rpcik7XG4gICAgICByZXR1cm4gUi5tYXAocmVzb2x2ZSwgWC5maWxlbmFtZXMpXG4gICAgfSksXG5cbiAgICAvLyBFbnZpcm9uZW50IHZhcmlhYmxlcy4gU2V0dGluZyB0aGlzIHRvIHRoZSBlbXB0eSBzdHJpbmcgb3IgbnVsbCB3aWxsIFxuICAgIC8vIGRpc2FibGUgbG9va2luZyBmb3IgY29uZmlnIGluZm8gaW4gdGhlIGVudmlyb25tZW50ICBcbiAgICBlbnZQcmVmaXg6ICdDT05GSUcxXycsXG5cbiAgICAvLyBUaGUgc291cmNlIHNwZWNpZmljYXRpb24gdHlwZXMgd2UgdW5kZXJzdGFuZC4gVGhlIGBzb3VyY2VzYCBvcHRpb24gaXNcbiAgICAvLyBhIGxpc3Qgb2Ygc291cmNlIHNwZWNpZmljYXRpb25zLCBlYWNoIG9mIHdoaWNoIGlzIGEgcGxhaW4gb2JqZWN0IHdpdGggYVxuICAgIC8vIHR5cGUgcHJvcGVydHkgdGhhdCBtYXRjaGVzIHRoZSBrZXkgaGVyZS5cbiAgICBzb3VyY2VUeXBlczoge1xuICAgICAgZmlsZToge1xuICAgICAgICBtYWtlU3BlYzogcGF0aG5hbWUgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnZmlsZScsXG4gICAgICAgICAgICBwYXRobmFtZTogcGF0aG5hbWVcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBzcGVjczogcmVjaXBlKFg9PiB7XG4gICAgICAgICAgY29uc3Qgc2VsZiA9IFguc291cmNlVHlwZXMuZmlsZTtcbiAgICAgICAgICByZXR1cm4gWC5wYXRobmFtZXMgPyBSLm1hcChzZWxmLm1ha2VTcGVjLCBYLnBhdGhuYW1lcykgOiBudWxsO1xuICAgICAgICB9KSxcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKHNyY3NwZWMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmUoc3Jjc3BlYy5wYXRobmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhdGNoKGVycikge31cbiAgICAgICAgfSxcbiAgICAgIH0sXG5cbiAgICAgIGVudlByZWZpeDoge1xuICAgICAgICBtYWtlU3BlYzogcHJlZml4ID0+ICh7XG4gICAgICAgICAgdHlwZTogJ2VudlByZWZpeCcsXG4gICAgICAgICAgcHJlZml4OiBwcmVmaXhcbiAgICAgICAgfSksXG4gICAgICAgIHNwZWNzOiByZWNpcGUoWD0+IHtcbiAgICAgICAgICBjb25zdCBzZWxmID0gWC5zb3VyY2VUeXBlcy5lbnZQcmVmaXg7XG4gICAgICAgICAgcmV0dXJuIFguZW52UHJlZml4ID8gW3NlbGYubWFrZVNwZWMoWC5lbnZQcmVmaXgpXSA6IG51bGw7XG4gICAgICAgIH0pLFxuICAgICAgICBmZXRjaDogZnVuY3Rpb24oc3Jjc3BlYykge1xuICAgICAgICAgIC8vIEZJWE1FOiBpbXBsZW1lbnQhXG4gICAgICAgIH0sXG4gICAgICB9LFxuXG4gICAgICBlbnZKc29uOiB7XG4gICAgICAgIG1ha2VTcGVjOiBuYW1lID0+ICh7XG4gICAgICAgICAgdHlwZTogJ2Vudkpzb24nLFxuICAgICAgICAgIG5hbWU6IG5hbWVcbiAgICAgICAgfSksXG4gICAgICAgIHNwZWNzOiByZWNpcGUoWD0+IHtcbiAgICAgICAgICBjb25zdCBzZWxmID0gWC5zb3VyY2VUeXBlcy5lbnZKc29uO1xuICAgICAgICAgIHJldHVybiBYLmVudkpzb24gPyBbc2VsZi5tYWtlU3BlYyhYLmVudlByZWZpeCldIDogbnVsbDtcbiAgICAgICAgfSksXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbihzcmNzcGVjKSB7XG4gICAgICAgICAgLy8gRklYTUU6IGltcGxlbWVudCFcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIC8vIFB1dCB0aGVtIGFsbCB0b2dldGhlclxuICAgIHNvdXJjZXM6IHJlY2lwZShYPT4ge1xuICAgICAgLy8gRklYTUU6IHRoaXMgbmVlZHMgdG8gY29uY2F0ZW5hdGUgYWxsIHRoZSBzcGVjcywgcmF0aGVyIHRoYW4ganVzdCB0aGVzZSB0d29cbiAgICAgIGNvbnN0IHN0eXBlcyA9IFguc291cmNlVHlwZXM7XG4gICAgICBjb25zdCBzcmNzID0gc3R5cGVzLmZpbGUuc3BlY3MuY29uY2F0KHN0eXBlcy5lbnZQcmVmaXguc3BlY3MpO1xuICAgICAgcmV0dXJuIHNyY3M7XG4gICAgfSksXG5cbiAgICAvLyBGdW5jdGlvbiB0byB0YWtlIGFueSBzb3VyY2Ugc3BlY2lmaWNhdGlvbiwgYW5kIHJldHVybiB0aGUgY29uZmlnIGRhdGFcbiAgICAvLyBmb3IgdGhhdCBzb3VyY2UuIFRoaXMgY2xvc2VzIG92ZXIgdGhlIHJvb3QgdmlldyAtLSBJJ20gcHJldHR5XG4gICAgLy8gc3VyZSB0aGF0IHdvbid0IGJlIGEgcHJvYmxlbSFcbiAgICBmZXRjaFNvdXJjZTogcmVjaXBlKFg9PlxuICAgICAgZnVuY3Rpb24oc3Jjc3BlYykge1xuICAgICAgICBjb25zdCB0eXBlID0gc3Jjc3BlYy50eXBlLFxuICAgICAgICAgICAgICBmZXRjaCA9IFguc291cmNlVHlwZXNbdHlwZV0uZmV0Y2g7XG4gICAgICAgIHJldHVybiBmZXRjaChzcmNzcGVjKTtcbiAgICAgIH1cbiAgICApLFxuICB9O1xufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZGVmYXVsdHMuanNcbiAqKiBtb2R1bGUgaWQgPSA5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgbWFwID0ge1xuXHRcIi4vZGVmYXVsdHNcIjogOSxcblx0XCIuL2RlZmF1bHRzLmpzXCI6IDksXG5cdFwiLi9nZXQtYWxsLXByb3BlcnR5LW5hbWVzXCI6IDExLFxuXHRcIi4vZ2V0LWFsbC1wcm9wZXJ0eS1uYW1lcy5qc1wiOiAxMSxcblx0XCIuL2xvZ1wiOiA4LFxuXHRcIi4vbG9nLmpzXCI6IDgsXG5cdFwiLi9zZWVkXCI6IDEsXG5cdFwiLi9zZWVkLmpzXCI6IDFcbn07XG5mdW5jdGlvbiB3ZWJwYWNrQ29udGV4dChyZXEpIHtcblx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18od2VicGFja0NvbnRleHRSZXNvbHZlKHJlcSkpO1xufTtcbmZ1bmN0aW9uIHdlYnBhY2tDb250ZXh0UmVzb2x2ZShyZXEpIHtcblx0cmV0dXJuIG1hcFtyZXFdIHx8IChmdW5jdGlvbigpIHsgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIHJlcSArIFwiJy5cIikgfSgpKTtcbn07XG53ZWJwYWNrQ29udGV4dC5rZXlzID0gZnVuY3Rpb24gd2VicGFja0NvbnRleHRLZXlzKCkge1xuXHRyZXR1cm4gT2JqZWN0LmtleXMobWFwKTtcbn07XG53ZWJwYWNrQ29udGV4dC5yZXNvbHZlID0gd2VicGFja0NvbnRleHRSZXNvbHZlO1xubW9kdWxlLmV4cG9ydHMgPSB3ZWJwYWNrQ29udGV4dDtcbndlYnBhY2tDb250ZXh0LmlkID0gMTA7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjIF5cXC5cXC8uKiRcbiAqKiBtb2R1bGUgaWQgPSAxMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gVGhpcyBpcyBhIHRlc3QgZmlsZSwgdXNlZCBmb3Igc3R1ZHkvZXhwZXJpbWVudGF0aW9uLlxuLy9cbi8vIEhvdyBtdWNoIHNob3VsZCB3ZSB3b3JyeSBhYm91dCBpbmhlcml0ZWQgYW5kL29yIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXM/XG4vLyBIZXJlJ3MgYSBmdW5jdGlvbiB0aGF0IGdldHMgYWxsIHRoZSBwcm9wZXJ0aWVzIG9mIGFuIG9iamVjdC4gVGhlcmUgYXJlIGFcbi8vIGxvdC4gT24gdGhlIG90aGVyIGhhbmQsIG1vc3Qgb2YgdGhlbSBwcm9iYWJseSBjb21lIGZyb20gT2JqZWN0LnByb3RvdHlwZSxcbi8vIGFuZCBwcm9iYWJseSB3ZSBjb3VsZCBpbXBsZW1lbnQgdXNpbmcgdGhlIHNhbWUgbWVjaGFuaXNtOiBpLmUuIGluc3RhbnRpYXRlXG4vLyBhIHZpZXdfcHJvdG90eXBlIGZvciBldmVyeSBjMS5wcm90b3R5cGUsIGFuZCBhcHBlbmQgdGhhdCB0byB0aGUgKnZpZXcncypcbi8vIHByb3RvdHlwZSBjaGFpbi5cbi8vXG4vLyBJZiB3ZSBkbyBwcm94eSB0aGVtLCB0aGVuIHRoZSBydWxlIGlzIHRoYXQgbm9uLWVudW1lcmFibGUgcHJvcGVydGllcyBhbmQgXG4vLyBpbmhlcml0ZWQgcHJvcGVydGllcyBhcmUgYWx3YXlzICphdG9tcyouXG5cbmZ1bmN0aW9uIGdldEFsbFByb3BlcnR5TmFtZXMoIG9iaiApIHtcbiAgdmFyIGtleXMgPSB7fTtcbiAgZG8ge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIGtleXNba2V5XSA9IHRydWU7XG4gICAgfSk7XG4gIH0gd2hpbGUgKG9iaiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopKTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGtleXMpO1xufVxuXG52YXIgQSA9IGZ1bmN0aW9uKCkgeyBcbiAgdGhpcy5hX3Byb3AgPSAxMDsgXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnYV9ub25FbnVtJywge1xuICAgIGVudW1lcmFibGU6IGZhbHNlLCBcbiAgICB2YWx1ZTogMjUsXG4gIH0pO1xufTtcbnZhciBBcCA9IEEucHJvdG90eXBlID0ge1xuICBhcF9wcm9wOiA1LCBcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQXAsICdhcF9ub25FbnVtJywge1xuICBlbnVtZXJhYmxlOiBmYWxzZSwgXG4gIHZhbHVlOiAzMCxcbn0pO1xuXG52YXIgYSA9IG5ldyBBKCk7XG5jb25zb2xlLmxvZyhnZXRBbGxQcm9wZXJ0eU5hbWVzKGEpKTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvZ2V0LWFsbC1wcm9wZXJ0eS1uYW1lcy5qc1xuICoqIG1vZHVsZSBpZCA9IDExXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9