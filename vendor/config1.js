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
	
	
	// We can use this symbol to store metadata on objects.
	console.log('c1: defining symbol');
	const c1symbol = Symbol('config-one');
	
	// template - private - This function is copied for new c1 instances. The body
	// of this function implements the main user API.
	const template = function(...args) {
	  const c1 = this.c1,
	        opts = this.options;
	
	  log.enter('seed:template: welcome my son, num args: ' + args.length);
	
	  // If there's just one argument that is a Function, then this is being used
	  // as a shortcut for `recipe`.
	  const isRecipe = (args.length == 1 &&
	      args[0] instanceof Function && nodeType(args[0]) !== 'recipe');
	
	  const ret = isRecipe ? recipe(args[0]) :
	    c1.read.apply(c1, c1.options.sources);
	
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
	
	  // FIXME: experiment making tinycolor an atom
	  //if (typeof node === 'object' && '_originalInput' in node) return 'atom';
	  if (c1symbol in node && node[c1symbol].atomic) return 'atom';
	
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
	  aggAllObjects,
	  aggObjects,
	  aggregate,
	  clone,
	  Recipe,
	  recipeCount,
	  template,
	  nodeType,
	  // FIXME: rename this
	  mapping: _mapping,
	};
	
	const Config1 = {
	  c1symbol,
	  extend,
	  read,
	  recipe,
	  freeze,
	  ppString,
	  ppConsole,
	  walk,
	  deepEqual,
	  // FIXME: rename these
	  new: _new,
	  private: _private,
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
	
	    // Add predicate functions here to tell config1 that certain types of
	    // objects should be treated as atomic.
	    atomTests: [],
	
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNDBiODkyNDc3ZWMzMzFmY2Y0MDAiLCJ3ZWJwYWNrOi8vLy4vc3JjL21haW4uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NlZWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9wYXRoLWJyb3dzZXJpZnkvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9wcm9jZXNzL2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9kaXN0L3JhbWRhLmpzIiwid2VicGFjazovLy8uL34vdXRpbC91dGlsLmpzIiwid2VicGFjazovLy8uL34vdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIndlYnBhY2s6Ly8vLi9+L2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xvZy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZGVmYXVsdHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjIF5cXC5cXC8uKiQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2dldC1hbGwtcHJvcGVydHktbmFtZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7Ozs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEscUNBQWlDLFdBQVc7QUFDNUM7OztBQUdBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbURBQWtEO0FBQ2xEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBQzs7QUFFRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSyxJQUFJO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esa0I7QUFDQSxJQUFHOztBQUVIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQSxzQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQLE1BQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUEsNENBQTJDO0FBQzNDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBNkIsSUFBSTtBQUNqQzs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxJQUFHO0FBQ0g7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLHNCQUFxQiw4QkFBOEIsRTs7QUFFbkQ7QUFDQTtBQUNBO0FBQ0E7OztBQUdBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7O0FDblpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFDVCxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNULE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVCxNQUFLOztBQUVMO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNULE1BQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZSxTQUFTO0FBQ3hCLGlCQUFnQixTQUFTO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxJQUFHO0FBQ0gsd0JBQXVCLFVBQVUsRUFBRTtBQUNuQyxJQUFHO0FBQ0g7QUFDQTs7QUFFQSxFQUFDOzs7Ozs7O0FDL2tSRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW1CLHNCQUFzQjtBQUN6QztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSCx3QkFBdUIsU0FBUztBQUNoQztBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0EsUUFBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUc7O0FBRUg7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw2Q0FBNEMsS0FBSzs7QUFFakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0EsTUFBSztBQUNMOztBQUVBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBLG9DQUFtQyxPQUFPO0FBQzFDO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBRztBQUNIO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQSwwREFBeUQ7QUFDekQ7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQSxJQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXO0FBQ1gsVUFBUztBQUNUO0FBQ0E7QUFDQSxZQUFXO0FBQ1g7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLFNBQVM7QUFDcEI7QUFDQSxZQUFXLFNBQVM7QUFDcEI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7OztBQ3prQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEU7Ozs7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQSxFQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNkJBQTRCO0FBQzVCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1QkFBc0I7QUFDdEI7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7QUNwREE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHFDQUFpQyxXQUFXO0FBQzVDOzs7QUFHQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLOztBQUVMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7O0FBRUw7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNULFFBQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7QUFDQSxVQUFTO0FBQ1QsUUFBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTtBQUNBLFVBQVM7QUFDVCxRQUFPO0FBQ1AsTUFBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWlDLHVEQUF1RDtBQUN4RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0wsSUFBRztBQUNIO0FBQ0E7O0FBRUEscUI7QUFDQSxvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUM7O0FBRUQ7QUFDQSIsImZpbGUiOiJjb25maWcxLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCA0MGI4OTI0NzdlYzMzMWZjZjQwMFxuICoqLyIsIi8qKlxuICogU2luY2UgY29uZmlnLW9uZSB1c2VzIGl0c2VsZiB0byBtYW5hZ2UgaXRzIG93biBvcHRpb25zLCB0aGVyZSBpcyBhXG4gKiBiaXQgb2YgYSBjaGlja2VuLWVnZyBwcm9ibGVtLiBUaGUgYHNlZWQuanNgIG1vZHVsZSBjb250YWlucyBhbGwgb2YgdGhlXG4gKiBjb2RlIHRoYXQgZG9lc24ndCBkZXBlbmQgb24gZGVmYXVsdCBvcHRpb25zIChhbG1vc3QgYWxsKS4gQm90aCBgbWFpbi5qc2AsXG4gKiBoZXJlIGFuZCBgZGVmYXVsdHMuanNgIHJlcXVpcmUgYHNlZWQuanNgLlxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3Qgc2VlZCA9IHJlcXVpcmUoJy4vc2VlZC5qcycpO1xuY29uc3QgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzLmpzJykoKTtcblxuc2VlZC5wcml2YXRlLmRlZmF1bHRzID0gZGVmYXVsdHM7XG5cbmNvbnN0IGNvbmZpZzEgPSBzZWVkLm5ldyhkZWZhdWx0cyk7XG5tb2R1bGUuZXhwb3J0cyA9IGNvbmZpZzE7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL21haW4uanNcbiAqKiBtb2R1bGUgaWQgPSAwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBwcm9jZXNzID0gcmVxdWlyZSgncHJvY2VzcycpO1xuY29uc3QgUiA9IHJlcXVpcmUoJ3JhbWRhJyk7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5jb25zdCBsb2cgPSByZXF1aXJlKCcuL2xvZy5qcycpKHtpZDogJ3Jvb3QnfSk7XG5sb2cuZGlzYWJsZSgpO1xuXG5cbi8vIFdlIGNhbiB1c2UgdGhpcyBzeW1ib2wgdG8gc3RvcmUgbWV0YWRhdGEgb24gb2JqZWN0cy5cbmNvbnNvbGUubG9nKCdjMTogZGVmaW5pbmcgc3ltYm9sJyk7XG5jb25zdCBjMXN5bWJvbCA9IFN5bWJvbCgnY29uZmlnLW9uZScpO1xuXG4vLyB0ZW1wbGF0ZSAtIHByaXZhdGUgLSBUaGlzIGZ1bmN0aW9uIGlzIGNvcGllZCBmb3IgbmV3IGMxIGluc3RhbmNlcy4gVGhlIGJvZHlcbi8vIG9mIHRoaXMgZnVuY3Rpb24gaW1wbGVtZW50cyB0aGUgbWFpbiB1c2VyIEFQSS5cbmNvbnN0IHRlbXBsYXRlID0gZnVuY3Rpb24oLi4uYXJncykge1xuICBjb25zdCBjMSA9IHRoaXMuYzEsXG4gICAgICAgIG9wdHMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgbG9nLmVudGVyKCdzZWVkOnRlbXBsYXRlOiB3ZWxjb21lIG15IHNvbiwgbnVtIGFyZ3M6ICcgKyBhcmdzLmxlbmd0aCk7XG5cbiAgLy8gSWYgdGhlcmUncyBqdXN0IG9uZSBhcmd1bWVudCB0aGF0IGlzIGEgRnVuY3Rpb24sIHRoZW4gdGhpcyBpcyBiZWluZyB1c2VkXG4gIC8vIGFzIGEgc2hvcnRjdXQgZm9yIGByZWNpcGVgLlxuICBjb25zdCBpc1JlY2lwZSA9IChhcmdzLmxlbmd0aCA9PSAxICYmXG4gICAgICBhcmdzWzBdIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgbm9kZVR5cGUoYXJnc1swXSkgIT09ICdyZWNpcGUnKTtcblxuICBjb25zdCByZXQgPSBpc1JlY2lwZSA/IHJlY2lwZShhcmdzWzBdKSA6XG4gICAgYzEucmVhZC5hcHBseShjMSwgYzEub3B0aW9ucy5zb3VyY2VzKTtcblxuICBsb2cuZXhpdCgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuLy8gY2xvbmUoKSAtIHByaXZhdGUgLSBDcmVhdGUgYSBuZXcgYzEgb2JqZWN0LCBieSBtYWtpbmcgYSBjb3B5IG9mIHRlbXBsYXRlXG4vLyB3aXRoIGEgbmV3IGJpbmRpbmcuIFRoaXMgZG9lcyBub3Qgc2V0IHRoZSBvcHRpb25zLlxuY29uc3QgY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgLy8gQmluZCBjMSB0byBhIFwiYmFja1wiIG9iamVjdCBzbyBpdCBjYW4gZmluZCBpdHNlbGYgd2hlbiBpbnZva2VkLlxuICBjb25zdCBiYWNrID0ge307XG4gIGNvbnN0IGMxID0gdGVtcGxhdGUuYmluZChiYWNrKTtcbiAgYmFjay5jMSA9IGMxO1xuICBcbiAgLy8gTWl4IGluIHByb3BlcnRpZXMgYW5kIGJpbmQgbWV0aG9kc1xuICBSLmtleXMoQ29uZmlnMSkubWFwKGtleSA9PiB7XG4gICAgY29uc3QgdiA9IENvbmZpZzFba2V5XTtcbiAgICBjMVtrZXldID0gKHYgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB2LmJpbmQoYzEpIDogdjtcbiAgfSk7XG4gIHJldHVybiBjMTtcbn07XG5cbi8vIGMxLm5ldyhvcHRzKSAtIENyZWF0ZSBhIG5ldyBjMSBvYmplY3QgZnJvbSBhbiBleGlzdGluZyBvbmUsIG92ZXJyaWRpbmcgb3B0aW9uc1xuY29uc3QgX25ldyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgY29uc3QgYzEgPSB0aGlzO1xuICBjb25zdCBuZXh0ID0gY2xvbmUoKTtcblxuICAvLyBJZiBubyBvcHRzIHdlcmUgZ2l2ZW4sIHVzZSBhbiBlbXB0eSBvYmplY3QuIFRoaXMgZm9yY2VzIHRoZSBsaWJyYXJ5IHRvXG4gIC8vIGNyZWF0ZSBhIG5ldyB2aWV3LCB3aGljaCBtZWFucyBhbGwgcmVjaXBlcyAod2hpY2ggbWlnaHQgZGVwZW5kIG9uIGVudi5cbiAgLy8gdmFyaWFibGVzLCBmb3IgaW5zdGFuY2UpIHdpbGwgZ2V0IHJlLWV2YWx1YXRlZC5cbiAgbmV4dC5vcHRpb25zID0gYzEuZXh0ZW5kKGMxLm9wdGlvbnMsIChvcHRzIHx8IHt9KSk7XG4gIHJldHVybiBuZXh0O1xufTtcblxuLy8gVHJhdmVyc2UtdHlwZSB1dGlsaXRpZXMuIFxuLy8gRklYTUU6IEkgd2FudCB0byBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlIHJvdXRpbmVzIGhlcmUgdXNlIHRoZSBzYW1lXG4vLyBsb3dlci1sZXZlbCBmdW5jdGlvbnMsIHNvIHRoYXQgdGhleSBhbGwgYWdyZWUgb24gZXhhY3RseSBob3cgdGhleSBkZWFsXG4vLyB3aXRoIHZhcmlvdXMgcHJvcGVydGllcyBhbmQgYXR0cmlidXRlcy5cblxuLy8gdmlzaXQgZXZlcnkgbm9kZSBpbiBhIGNvbmZpZyBvYmplY3QgKHdpdGhvdXQgZXZhbHVhdGluZyByZWNpcGVzKSBvclxuLy8gYSB2aWV3LCBydW5uaW5nIHByZS0gYW5kIHBvc3QtdHJhdmVyc2FsIGZ1bmN0aW9ucyBvbiBlYWNoLlxuY29uc3Qgd2FsayA9IFIuY3VycnkoKHByZSwgcG9zdCwgdHJlZSkgPT4ge1xuICBwcmUodHJlZSk7XG4gIE9iamVjdC5rZXlzKHRyZWUpLm1hcCh3YWxrKHByZSwgcG9zdCkpO1xuICBwb3N0KHRyZWUpO1xufSk7XG5cbi8vIFF1aWNrIGFuZCBkaXJ0eSBkZWVwIGVxdWFscy5cblxuLy8gY29tcGFyZSB0eXBlcywgY29uc2lkZXJpbmcgdmlldyBhbmQgb2JqZWN0IHRvIGJlIHRoZSBzYW1lXG5jb25zdCBjbXBUeXBlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjb25zdCB0ID0gbm9kZVR5cGUoaXRlbSk7XG4gIHJldHVybiB0ID09ICd2aWV3JyA/ICdvYmplY3QnIDogdDtcbn07XG5cbmNvbnN0IGRlZXBFcXVhbCA9IChhY3R1YWwsIGV4cGVjdGVkKSA9PiB7XG4gIGNvbnN0IHRhID0gY21wVHlwZShhY3R1YWwpLFxuICAgICAgICB0YiA9IGNtcFR5cGUoZXhwZWN0ZWQpO1xuICBpZiAodGEgIT09IHRiKSByZXR1cm4gZmFsc2U7XG4gIGlmICh0YSA9PT0gJ3JlY2lwZScpIHJldHVybiBhY3R1YWwgPT09IGV4cGVjdGVkO1xuICBpZiAodGEgPT09ICdhdG9tJykge1xuICAgIHJldHVybiAoYWN0dWFsID09IGV4cGVjdGVkKTtcbiAgfVxuXG4gIGNvbnN0IGFLZXlzID0gT2JqZWN0LmtleXMoYWN0dWFsKTtcbiAgY29uc3QgZUtleXMgPSBPYmplY3Qua2V5cyhleHBlY3RlZCk7XG4gIGlmIChhS2V5cy5sZW5ndGggIT0gZUtleXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIGFLZXlzLm1hcChmdW5jdGlvbihrKSB7XG4gICAgaWYgKCEoayBpbiBleHBlY3RlZCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIWRlZXBFcXVhbChhY3R1YWxba10sIGV4cGVjdGVkW2tdKSkgcmV0dXJuIGZhbHNlO1xuICB9KTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyDinJMgaGFzIHRlc3QuXG4vLyBDcmVhdGUgYSBuZXcgYXJyYXkgaWYgaXQgZG9lc24ndCBleGlzdCBhbHJlYWR5LCBhbmQgcHVzaCBhIHZhbHVlIGludG8gaXQuXG5jb25zdCBhZ2dyZWdhdGUgPSBmdW5jdGlvbihhY2MsIHZhbHVlKSB7XG4gIGNvbnN0IF9hY2MgPSBhY2MgfHwgW107XG4gIF9hY2MucHVzaCh2YWx1ZSk7XG4gIHJldHVybiBfYWNjO1xufTtcblxuLy8g4pyTIHRlc3QtbG93LWxldmVsXG4vLyBGb3IgZXZlcnkga2V5IGluIG9iaiwgYWdncmVnYXRlcyBpdCB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlIGluIHRoZVxuLy8gYWNjdW11bGF0b3IuIFRoZSBhY2N1bXVsYXRvcidzIHZhbHVlcyBhcmUgYXJyYXlzXG5jb25zdCBhZ2dPYmplY3RzID0gZnVuY3Rpb24oYWNjLCBvYmopIHtcbiAgUi5rZXlzKG9iaikubWFwKGtleSA9PiB7XG4gICAgYWNjW2tleV0gPSBhZ2dyZWdhdGUoYWNjW2tleV0sIG9ialtrZXldKTtcbiAgfSk7XG4gIHJldHVybiBhY2M7XG59O1xuXG4vLyDinJMgdGVzdC1sb3ctbGV2ZWxcbi8vIEdpdmVuIGEgbGlzdCBvZiBvYmplY3RzLCByZXR1cm4gYSBuZXcgb2JqZWN0IHdob3NlIGtleXMgYXJlIHRoZSB1bmlvbiBvZlxuLy8gYWxsIG9mIHRoZSBrZXlzIGluIHRoZSBsaXN0LCBhbmQgd2hvc2UgdmFsdWVzIGFyZSBhcnJheXMgb2YgYWxsIHRoZSB2YWx1ZXNcbi8vIHRoYXQgb2NjdXIgZm9yIHRoYXQga2V5LiBJbiBvdGhlciB3b3JkcywgdGhpcyB0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIGludG9cbi8vIGFuIG9iamVjdCBvZiBhcnJheXMuXG5jb25zdCBhZ2dBbGxPYmplY3RzID0gZnVuY3Rpb24ob2JqZWN0cykge1xuICByZXR1cm4gUi5yZWR1Y2UoXG4gICAgZnVuY3Rpb24gKGFjYywgb2JqKSB7XG4gICAgICByZXR1cm4gYWdnT2JqZWN0cyhhY2MsIG9iaik7XG4gICAgfSwge30sIG9iamVjdHNcbiAgKTtcbn07XG5cbi8vIOKckyB0ZXN0LWxvdy1sZXZlbFxuLy8gQ3JlYXRlcyBhIG1hcHBpbmcgb2YgYW4gYXJyYXkgb2Ygb2JqZWN0cy4gVGhlIHNldCBvZiBrZXlzIGlzIHRoZSB1bmlvbiBvZlxuLy8gdGhlIHNldHMgb2YgYWxsIG9mIHRoZSBrZXlzIGluIG9iamVjdHMuIFRoZSB2YWx1ZXMgYXJlIGFycmF5cyBvZiB0aGUgdmFsdWVzXG4vLyBmcm9tIHRoZSBvYmplY3RzIHRoYXQgaGF2ZSB0aG9zZSBrZXlzLlxuY29uc3QgX21hcHBpbmcgPSBmdW5jdGlvbihvYmplY3RzKSB7XG4gIHJldHVybiBhZ2dBbGxPYmplY3RzKG9iamVjdHMpO1xufTtcblxuLy8gYzEucmVhZCguLi5zb3VyY2VTcGVjaWZpZXJzKSAtIENvbnN0cnVjdCBhIG5ldyByb290IHZpZXcgZnJvbSBhIGxpc3Rcbi8vIG9mIHNvdXJjZSBzcGVjaWZpZXJzLiBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGludm9rZXMgdGhlIG1haW4gbW9kdWxlXG4vLyBmdW5jdGlvbiB3aXRoIG5vIGFyZ3VtZW50cy4gSW4gdGhhdCBjYXNlLCB0aGUgc291cmNlU3BlY2lmaWVycyBhcmUgZ2VuZXJhdGVkXG4vLyBmcm9tIHRoZSBkZWZhdWx0IG9wdGlvbnMuXG4vLyBTb3VyY2VzIGFyZSBpbiB0aGUgb3JkZXIgZnJvbSBkZWZhdWx0cyB0b1xuLy8gb3ZlcnJpZGVzLiAoVGhhdCdzIHBlciB0aGUgdXNlciBBUEkuIFRoZSBmaXJzdCB0aGluZyB3ZSBkbyBpcyByZXZlcnNlIHRoZW07XG4vLyBpbnRlcm5hbGx5IHRoZXkgYXJlIGFsd2F5cyBpbiB0aGUgb3JkZXIgb2YgaGlnaGVzdC1wcmVjZWRlbmNlIG92ZXJyaWRlXG4vLyBmaXJzdC4pXG4vLyBJZiBub25lIG9mIHRoZSBzb3VyY2VzIHJlc29sdmUgdG8gYW55IGNvbmZpZyBkYXRhIG9iamVjdHMsIHRoaXMgcmV0dXJucyBudWxsLlxuY29uc3QgcmVhZCA9IGZ1bmN0aW9uKC4uLnNwZWNzKSB7XG4gIGNvbnN0IGMxID0gdGhpcztcblxuICAvLyBSZXZlcnNlIHRoZW0sIHRvIGdldCB0aGVtIGludG8gXCJpbnRlcm5hbFwiIG9yZGVyXG4gIGNvbnN0IHJzcGVjcyA9IFIucmV2ZXJzZShzcGVjcyk7XG5cbiAgLy8gRmV0Y2ggdGhlIHJlYWwgc291cmNlcyBmcm9tIHRoZSB1c2VyLXN1cHBsaWVkIHNvdXJjZS1zcGVjaWZpZXJzLlxuICBjb25zdCBfc291cmNlcyA9IHJzcGVjcy5tYXAoc3BlYyA9PiBjMS5vcHRpb25zLmZldGNoU291cmNlKHNwZWMpKTtcbiAgY29uc3Qgc291cmNlcyA9IF9zb3VyY2VzLmZpbHRlcihzID0+ICEhcyk7XG5cbiAgY29uc3Qgcm9vdCA9IChzb3VyY2VzLmxlbmd0aCA9PSAwKSA/IG51bGwgOiAoKCk9PiB7XG4gICAgY29uc3QgX3Jvb3QgPSBuZXdWaWV3KG51bGwsIHNvdXJjZXMsIG51bGwsIDApO1xuXG4gICAgY29uc3QgZGF0YSA9IF9yb290Ll9fY29uZmlnMV9fO1xuICAgIGRhdGEucm9vdCA9IF9yb290O1xuICAgIGRhdGEuYzEgPSBjMTtcbiAgICByZXR1cm4gX3Jvb3Q7ICAgIFxuICB9KSgpO1xuXG4gIHJldHVybiByb290O1xufTtcblxuLy8gYzEuZXh0ZW5kKC4uLmNvbmZpZ3MpIC0gdGhlIGFyZ3VtZW50cyBhcmUgY29uZmlnIG9iamVjdHMsIHRoYXQgYXJlIG1lcmdlZFxuLy8gdG9nZXRoZXIgaW4gb3JkZXIgZnJvbSBkZWZhdWx0cyB0byBoaWdoZXItcHJlY2VkZW5jZSBvdmVycmlkZXMuXG5jb25zdCBleHRlbmQgPSBmdW5jdGlvbiguLi5jb25maWdzKSB7XG4gIGNvbnN0IGMxID0gdGhpcztcblxuICAvLyBSZXZlcnNlIHRoZW0sIHRvIGdldCB0aGVtIGludG8gXCJpbnRlcm5hbFwiIG9yZGVyXG4gIGNvbnN0IHJjb25maWdzID0gUi5yZXZlcnNlKGNvbmZpZ3MpO1xuXG4gIC8vIElmIGFuIGl0ZW0gaXMgYSB2aWV3LCByZXBsYWNlIGl0IHdpdGggaXRzIG9yaWdpbmFsIHNvdXJjZXNcbiAgY29uc3QgZ2V0U291cmNlcyA9IGl0ZW0gPT5cbiAgICAobm9kZVR5cGUoaXRlbSkgPT09ICd2aWV3JykgPyBpdGVtLl9fY29uZmlnMV9fLnNvdXJjZXMgOiBpdGVtO1xuXG4gIC8vIElmIGFueSBhcmUgdmlld3MsIHJlcGxhY2UgdGhlbSB3aXRoIHRoZWlyIG9yaWdpbmFsIHNvdXJjZXNcbiAgY29uc3Qgc291cmNlR3JvdXBzID0gUi5tYXAoZ2V0U291cmNlcywgcmNvbmZpZ3MpO1xuXG4gIC8vIEZsYXR0ZW4gaW50byBhIHNpbmdsZSBhcnJheVxuICBjb25zdCBzb3VyY2VzID0gUi5mbGF0dGVuKHNvdXJjZUdyb3Vwcyk7XG5cbiAgLy8gV3JhcCB0aGVtIGluIGEgdmlld1xuICBjb25zdCByb290ID0gbmV3VmlldyhudWxsLCBzb3VyY2VzLCBudWxsLCAwKSxcbiAgICAgICAgZGF0YSA9IHJvb3QuX19jb25maWcxX187XG4gIGRhdGEucm9vdCA9IHJvb3Q7XG4gIGRhdGEuYzEgPSBjMTtcbiAgcmV0dXJuIHJvb3Q7XG59O1xuXG4vLyBJZiBzcmNub2RlIGlzIG9mIGByZWNpcGVgIHR5cGUsIGV2YWx1YXRlIGl0IHJlY3Vyc2l2ZWx5LCB1bnRpbCB5b3UgZ2V0XG4vLyBzb21ldGhpbmcgdGhhdCdzIG5vdC5cbmNvbnN0IGNvb2sgPSBmdW5jdGlvbihyb290LCBzcmNub2RlKSB7XG4gIGNvbnN0IHQgPSBub2RlVHlwZShzcmNub2RlKTtcbiAgY29uc3QgY29va2VkID0gKHQgPT09ICdyZWNpcGUnKSA/XG4gICAgLy8gdXNlIGAuY2FsbChyb290LCByb290KWAgc28gYHJvb3RgIGlzIGJvdW5kIHRvIGB0aGlzYCBpbnNpZGUgdGhlIHJlY2lwZVxuICAgIGNvb2socm9vdCwgc3Jjbm9kZS5ldmFsLmNhbGwocm9vdCwgcm9vdCkpIDogc3Jjbm9kZTtcbiAgcmV0dXJuIGNvb2tlZDtcbn07XG5cbi8vIENvb2sgYWxsIHRoZSByZWNpcGVzIGluc2lkZSBhIHNldCBvZiBzb3VyY2VzXG5jb25zdCBjb29rQWxsID0gZnVuY3Rpb24ocm9vdCwgc291cmNlcykge1xuICBjb25zdCBjb29rZWQgPSBzb3VyY2VzLm1hcChzcmNub2RlID0+IGNvb2socm9vdCwgc3Jjbm9kZSkpXG4gIHJldHVybiBjb29rZWQ7XG59O1xuXG4vLyBuZXdWaWV3IC0gdGhlIGhlYXJ0IG9mIHRoZSBhbGdvcml0aG0gZm9yIG1hbmFnaW5nIHRoZSB2aWV3LlxuLy8gU291cmNlcyBhcmUgaW4gXCJpbnRlcm5hbFwiIG9yZGVyOiBoaWdoZXN0IHByZWNlZGVuY2UgZmlyc3QuIFRoZSBzb3VyY2Ugbm9kZXNcbi8vIGNhbiBiZSBvZiBhbnkgdHlwZTogYXRvbSwgb2JqZWN0LCByZWNpcGUsIG9yIHZub2RlLlxuY29uc3QgbmV3VmlldyA9IGZ1bmN0aW9uKHJvb3QsIHNvdXJjZXMsIGtleSwgZGVwdGgpIHtcbiAgLy8gQ29vayB0aGUgcmVjaXBlcywgZm9yIGFsbCBvZiB0aGUgdG9wLWxldmVsIG5vZGVzIG9mIGVhY2ggb2YgdGhlIHNvdXJjZXNcbiAgLy8gaW4gdGhlIGxpc3RcbiAgLy8gRklYTUU6IGZvciBub3csIHJlY2lwZXMgY2Fubm90IGJlIGF0IHRoZSByb290LiBJJ2QgbGlrZSB0byBtYWtlIHRoYXQgYW5cbiAgLy8gb3B0aW9uLiBJZiBzbywgdGhlIGNvbnRleHQgd2lsbCBiZSB0aGUgYzEgb2JqZWN0IGl0c2VsZi5cbiAgY29uc3QgY29va2VkID0gcm9vdCA/IGNvb2tBbGwocm9vdCwgc291cmNlcykgOiBzb3VyY2VzO1xuXG4gIC8vIEZJWE1FOiBNYWtlIGFuIG9wdGlvbiBmb3IgdGhlIHVzZXIgdG8gcGFzcyBpbiBhIHZhbGlkYXRvciB0aGF0IGdldHMgYXBwbGllZFxuICAvLyBoZXJlLiBPbmUgXCJjYW5uZWRcIiB2YWxpZGF0b3IgbWlnaHQgYmUgb25lIHRoYXQgXG4gIC8vIG1hZGUgc3VyZSB0aGF0IGFuIGl0ZW0gaXMgbm90IGdldHRpbmcgb3ZlcnJpZGRlbiBieSBcbiAgLy8gc29tZXRoaW5nIG9mIGEgZGlmZmVyZW50IHR5cGVcbiAgY29uc3QgaXRlbSA9IGNvb2tlZFswXTtcbiAgY29uc3QgdCA9IG5vZGVUeXBlKGl0ZW0pO1xuXG4gIC8vIFRoZSBub2RlIG11c3QgYmUgZWl0aGVyIGFuIGF0b20sIHZpZXcsIG9yIG9iamVjdC4gSWYgaXQncyBhbiBhdG9tIG9yIHZpZXcsXG4gIC8vIHdlJ2xsIGp1c3QgcmV0dXJuIGl0IGFzLWlzLiBPdGhlcndpc2UgLi4uXG4gIGNvbnN0IHZub2RlID0gKFxuICAgIHQgIT09ICdvYmplY3QnID8gaXRlbSA6XG4gICAgICBpdGVtIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9XG4gICk7XG5cbiAgaWYgKHQgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSByZWFsIHJvb3RcbiAgICBjb25zdCBfcm9vdCA9IHJvb3QgPyByb290IDogdm5vZGU7XG5cbiAgICAvLyBNYWtlIHRoZSBtYXBwaW5nIGZvciBhbGwgb2YgdGhlIGtleXMgdG8gdGhlIGxpc3RzIG9mIHNvdXJjZXMgZm9yIHRoYXQga2V5LlxuICAgIGNvbnN0IG1hcHBpbmcgPSBfbWFwcGluZyhjb29rZWQpO1xuXG4gICAgLy8gQWRkIGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgX19jb25maWcxX18gdG8gdGhlIHZpZXcsIHRvIHN0b3JlIHZhcmlvdXNcbiAgICAvLyBkYXRhLCBhbmQga2VlcCBpdCBmcm9tIGNvbGxpZGluZyB3aXRoIHRoZSBzb3VyY2UncyBwcm9wZXJ0eSBuYW1lcy5cbiAgICAvLyBGSVhNRTogdXNlIGFuIEVTNiBTeW1ib2wgZm9yIHRoaXMgLS0gYXJlIHRoZXJlIGdvb2QgcG9seWZpbGxzP1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICByb290OiBfcm9vdCxcbiAgICAgIGtleToga2V5LFxuICAgICAgZGVwdGg6IGRlcHRoLFxuICAgICAgbWFwcGluZzogbWFwcGluZyxcbiAgICAgIHNvdXJjZXM6IHNvdXJjZXMsXG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodm5vZGUsICdfX2NvbmZpZzFfXycsIHtcbiAgICAgIF9fcHJvdG9fXzogbnVsbCxcbiAgICAgIHZhbHVlOiBkYXRhLFxuICAgIH0pO1xuXG4gICAgLy8gTWFrZSB0aGUgZ2V0dGVycy5cbiAgICAvLyBDb250cmFjdDogYSBnZXR0ZXIgYWx3YXlzIHJldHVybnMgYW4gYXRvbSBvciBhIHZpZXcgKG5ldmVyXG4gICAgLy8gYSBzb3VyY2Ugb2JqZWN0IG9yIGEgcmVjaXBlKS5cbiAgICBjb25zdCBtZW1vcyA9IHt9OyAgLy8gbWVtb2l6ZSByZXN1bHRzXG4gICAgUi5rZXlzKG1hcHBpbmcpLm1hcChmdW5jdGlvbiAoY2hpbGRLZXkpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bm9kZSwgY2hpbGRLZXksIHtcbiAgICAgICAgX19wcm90b19fOiBudWxsLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoIShjaGlsZEtleSBpbiBtZW1vcykpIHtcbiAgICAgICAgICAgIG1lbW9zW2NoaWxkS2V5XSA9XG4gICAgICAgICAgICAgIG5ld1ZpZXcoX3Jvb3QsIG1hcHBpbmdbY2hpbGRLZXldLCBjaGlsZEtleSwgZGVwdGggKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1lbW9zW2NoaWxkS2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHZub2RlO1xufTtcblxuLy8gbm9kZVR5cGUgLSBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgYSBub2RlOyBvbmUgb2Y6IGF0b20sXG4vLyBvYmplY3QsIHJlY2lwZSwgb3Igdmlldy5cbmNvbnN0IG5vZGVUeXBlID0gZnVuY3Rpb24obm9kZSkge1xuICBpZiAoIW5vZGUgfHwgdHlwZW9mIG5vZGUgIT09ICdvYmplY3QnKSByZXR1cm4gJ2F0b20nO1xuXG4gIC8vIEZJWE1FOiBleHBlcmltZW50IG1ha2luZyB0aW55Y29sb3IgYW4gYXRvbVxuICAvL2lmICh0eXBlb2Ygbm9kZSA9PT0gJ29iamVjdCcgJiYgJ19vcmlnaW5hbElucHV0JyBpbiBub2RlKSByZXR1cm4gJ2F0b20nO1xuICBpZiAoYzFzeW1ib2wgaW4gbm9kZSAmJiBub2RlW2Mxc3ltYm9sXS5hdG9taWMpIHJldHVybiAnYXRvbSc7XG5cbiAgaWYgKHR5cGVvZiBub2RlID09PSAnb2JqZWN0JyAmJiAnX19jb25maWcxX18nIGluIG5vZGUpIHJldHVybiAndmlldyc7XG4gIGlmIChub2RlIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuICdhdG9tJztcbiAgLy8gVGhlIHRlc3QgZm9yIFJlY2lwZSBhZGRyZXNzZXMgdGhlIGNvbmNlcm4gaW4gdGhpcyBQUiAoYnV0IGl0J3Mgbm90XG4gIC8vIGEgY29tcGxldGUgZml4KTogaHR0cHM6Ly9naXRodWIuY29tL2xvcmVud2VzdC9ub2RlLWNvbmZpZy9wdWxsLzIwNS5cbiAgLy8gRklYTUU6IEkgdGhpbmsgdXNpbmcgYW4gRVM2IFN5bWJvbCB3b3VsZCB3b3JrIGhlcmUuXG4gIGlmIChub2RlIGluc3RhbmNlb2YgUmVjaXBlIHx8XG4gICAgKCgnY29uc3RydWN0b3InIGluIG5vZGUpICYmIChub2RlLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdSZWNpcGUnKSkpXG4gICAgcmV0dXJuICdyZWNpcGUnO1xuICByZXR1cm4gJ29iamVjdCc7XG59O1xuXG4vLyBSZWNpcGUgY2xhc3NcbnZhciBSZWNpcGUgPSBmdW5jdGlvbihmdW5jKSB7XG4gIHRoaXMuZXZhbCA9IGZ1bmM7XG59O1xuXG4vLyByZWNpcGUoZnVuYykgZnVuY3Rpb24gLSBwYXJ0IG9mIHRoZSBBUEkuXG4vLyBUaGlzIGlzIGEgUmVjaXBlIGZhY3RvcnksIGl0IGlzIGV4cG9zZWQgZm9yIHVzZSBpbiB0aGUgc291cmNlIGRhdGEgdHJlZSB0b1xuLy8gd3JhcCBmdW5jdGlvbnMsIHR1cm5pbmcgdGhlbSBpbnRvIHJlY2lwZXMuXG52YXIgcmVjaXBlID0gZnVuY3Rpb24oZnVuYykge1xuICByZWNpcGVDb3VudCsrO1xuICByZXR1cm4gbmV3IFJlY2lwZShmdW5jKTtcbn07XG5cbi8vIEtlZXAgYSBjb3VudCBvZiB0aGUgdG90YWwgbnVtYmVyIG9mIHJlY2lwZXMgY3JlYXRlZFxuLy8gRklYTUU6IHB1dCBiYWNrIGluIHRoZSBmZWF0dXJlIHRoYXQgY2hlY2tzIGZvciB0aGlzLCBhbmQgaWYgaXQncyB6ZXJvLFxuLy8gZG9lc24ndCB3YWxrIHRoZSB0cmVlLlxudmFyIHJlY2lwZUNvdW50ID0gMDtcblxuXG4vLyBVdGlsaXRpZXNcbi8vLS0tLS0tLS0tLVxuXG4vLyBmcmVlemVcblxuLy8gRklYTUU6IHRoaXMgaXMgbm90IHRob3JvdWdobHkgdGVzdGVkIHlldC5cbnZhciBmcmVlemUgPSBmdW5jdGlvbihjZmcpIHtcbiAgcmV0dXJuIChmdW5jdGlvbiBfZnJlZXplKGNmZywga2V5KSB7XG4gICAgdmFyIHQgPSBub2RlVHlwZShjZmcpO1xuICAgIGNvbnN0IGtleXN0ciA9IChrZXkgPyBgJHtrZXl9OiBgIDogJycpO1xuICAgIHZhciByZXQgPSBjZmc7XG5cbiAgICBpZiAodCA9PT0gJ2F0b20nKSB7XG4gICAgfVxuXG4gICAgZWxzZSBpZiAodCA9PT0gJ3ZpZXcnKSB7XG4gICAgICAvLyBGSVhNRTogbmVlZCB0byBjbG9uZSBhIGZ1bmN0aW9uIG1heWJlXG4gICAgICByZXQgPSAoY2ZnIGluc3RhbmNlb2YgQXJyYXkpID8gW10gOiB7fTtcbiAgICAgIE9iamVjdC5rZXlzKGNmZykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICAgIHJldFtrXSA9IF9mcmVlemUoY2ZnW2tdLCBrKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHNob3VsZCBiZSBub25lIG9mIHRoZXNlOlxuICAgIGVsc2UgaWYgKHQgPT09ICdvYmplY3QnIHx8IHQgPT0gJ3JlY2lwZScpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1Zlcnkgc3RyYW5nZSBpbmRlZWQhJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfSkoY2ZnKTtcbn07XG5cbi8vIFByZXR0eS1wcmludGVyXG5cbi8vIGNvbmZpZyBvYmplY3QgLT4gc3RyaW5nXG5jb25zdCBwcFN0cmluZyA9IG9iaiA9PiBcbiAgdXRpbC5pbnNwZWN0KG9iaiwge3Nob3dIaWRkZW46IHRydWUsIGRlcHRoOiBudWxsfSk7ICBcblxuLy8gY29uZmlnIG9iamVjdCAtPiBwcmludCB0byBzdGRvdXRcbmNvbnN0IHBwQ29uc29sZSA9IGNmZyA9PiB7XG4gIGNvbnNvbGUubG9nKHBwU3RyaW5nKGZyZWV6ZShjZmcpKSk7XG59O1xuXG5cbi8vIFByZXBhcmUgZXhwb3J0c1xuXG4vLyBFeHBvc2UgdGhlIHByaXZhdGUgZnVuY3Rpb25zIGluIGEgYHByaXZhdGVgIHByb3BlcnR5LCBmb3IgdW5pdCB0ZXN0c1xuY29uc3QgX3ByaXZhdGUgPSB7XG4gIGFnZ0FsbE9iamVjdHMsXG4gIGFnZ09iamVjdHMsXG4gIGFnZ3JlZ2F0ZSxcbiAgY2xvbmUsXG4gIFJlY2lwZSxcbiAgcmVjaXBlQ291bnQsXG4gIHRlbXBsYXRlLFxuICBub2RlVHlwZSxcbiAgLy8gRklYTUU6IHJlbmFtZSB0aGlzXG4gIG1hcHBpbmc6IF9tYXBwaW5nLFxufTtcblxuY29uc3QgQ29uZmlnMSA9IHtcbiAgYzFzeW1ib2wsXG4gIGV4dGVuZCxcbiAgcmVhZCxcbiAgcmVjaXBlLFxuICBmcmVlemUsXG4gIHBwU3RyaW5nLFxuICBwcENvbnNvbGUsXG4gIHdhbGssXG4gIGRlZXBFcXVhbCxcbiAgLy8gRklYTUU6IHJlbmFtZSB0aGVzZVxuICBuZXc6IF9uZXcsXG4gIHByaXZhdGU6IF9wcml2YXRlLFxufTtcblxuLy8gQzEuc2VlZCAtIFRoZSBvcmlnaW5hbCBDMSBvYmplY3QsIGZyb20gd2hpY2ggYWxsIG90aGVycyBkZXJpdmUuIFRoaXMgaXMgdGhlXG4vLyB0aGUgZXhwb3J0IG9mIHRoaXMgbW9kdWxlLiBUaGlzIGhhcyB0byBjb21lIGxhc3QsIGFmdGVyIENvbmZpZzEgaGFzIGJlZW5cbi8vIGluaXRpYWxpemVkLlxuY29uc3Qgc2VlZCA9IGNsb25lKCk7XG5zZWVkLm9wdGlvbnMgPSB7fTtcbl9wcml2YXRlLnNlZWQgPSBzZWVkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlZWQ7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3NlZWQuanNcbiAqKiBtb2R1bGUgaWQgPSAxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vcHJvY2Vzcy9icm93c2VyLmpzXG4gKiogbW9kdWxlIGlkID0gM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gIFJhbWRhIHYwLjIxLjBcbi8vICBodHRwczovL2dpdGh1Yi5jb20vcmFtZGEvcmFtZGFcbi8vICAoYykgMjAxMy0yMDE2IFNjb3R0IFNhdXlldCwgTWljaGFlbCBIdXJsZXksIGFuZCBEYXZpZCBDaGFtYmVyc1xuLy8gIFJhbWRhIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG47KGZ1bmN0aW9uKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICAgKiBBIHNwZWNpYWwgcGxhY2Vob2xkZXIgdmFsdWUgdXNlZCB0byBzcGVjaWZ5IFwiZ2Fwc1wiIHdpdGhpbiBjdXJyaWVkIGZ1bmN0aW9ucyxcbiAgICAgKiBhbGxvd2luZyBwYXJ0aWFsIGFwcGxpY2F0aW9uIG9mIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMsIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgKiB0aGVpciBwb3NpdGlvbnMuXG4gICAgICpcbiAgICAgKiBJZiBgZ2AgaXMgYSBjdXJyaWVkIHRlcm5hcnkgZnVuY3Rpb24gYW5kIGBfYCBpcyBgUi5fX2AsIHRoZSBmb2xsb3dpbmcgYXJlXG4gICAgICogZXF1aXZhbGVudDpcbiAgICAgKlxuICAgICAqICAgLSBgZygxLCAyLCAzKWBcbiAgICAgKiAgIC0gYGcoXywgMiwgMykoMSlgXG4gICAgICogICAtIGBnKF8sIF8sIDMpKDEpKDIpYFxuICAgICAqICAgLSBgZyhfLCBfLCAzKSgxLCAyKWBcbiAgICAgKiAgIC0gYGcoXywgMiwgXykoMSwgMylgXG4gICAgICogICAtIGBnKF8sIDIpKDEpKDMpYFxuICAgICAqICAgLSBgZyhfLCAyKSgxLCAzKWBcbiAgICAgKiAgIC0gYGcoXywgMikoXywgMykoMSlgXG4gICAgICpcbiAgICAgKiBAY29uc3RhbnRcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC42LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZ3JlZXQgPSBSLnJlcGxhY2UoJ3tuYW1lfScsIFIuX18sICdIZWxsbywge25hbWV9IScpO1xuICAgICAqICAgICAgZ3JlZXQoJ0FsaWNlJyk7IC8vPT4gJ0hlbGxvLCBBbGljZSEnXG4gICAgICovXG4gICAgdmFyIF9fID0geyAnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJzogdHJ1ZSB9O1xuXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbiAgICB2YXIgX2FyaXR5ID0gZnVuY3Rpb24gX2FyaXR5KG4sIGZuKSB7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG4gICAgICAgIHN3aXRjaCAobikge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3LCBhOCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3LCBhOCwgYTkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIF9hcml0eSBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIgbm8gZ3JlYXRlciB0aGFuIHRlbicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBfYXJyYXlGcm9tSXRlcmF0b3IgPSBmdW5jdGlvbiBfYXJyYXlGcm9tSXRlcmF0b3IoaXRlcikge1xuICAgICAgICB2YXIgbGlzdCA9IFtdO1xuICAgICAgICB2YXIgbmV4dDtcbiAgICAgICAgd2hpbGUgKCEobmV4dCA9IGl0ZXIubmV4dCgpKS5kb25lKSB7XG4gICAgICAgICAgICBsaXN0LnB1c2gobmV4dC52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfTtcblxuICAgIHZhciBfYXJyYXlPZiA9IGZ1bmN0aW9uIF9hcnJheU9mKCkge1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgdmFyIF9jbG9uZVJlZ0V4cCA9IGZ1bmN0aW9uIF9jbG9uZVJlZ0V4cChwYXR0ZXJuKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHBhdHRlcm4uc291cmNlLCAocGF0dGVybi5nbG9iYWwgPyAnZycgOiAnJykgKyAocGF0dGVybi5pZ25vcmVDYXNlID8gJ2knIDogJycpICsgKHBhdHRlcm4ubXVsdGlsaW5lID8gJ20nIDogJycpICsgKHBhdHRlcm4uc3RpY2t5ID8gJ3knIDogJycpICsgKHBhdHRlcm4udW5pY29kZSA/ICd1JyA6ICcnKSk7XG4gICAgfTtcblxuICAgIHZhciBfY29tcGxlbWVudCA9IGZ1bmN0aW9uIF9jb21wbGVtZW50KGYpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIGBjb25jYXRgIGZ1bmN0aW9uIHRvIG1lcmdlIHR3byBhcnJheS1saWtlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7QXJyYXl8QXJndW1lbnRzfSBbc2V0MT1bXV0gQW4gYXJyYXktbGlrZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtBcnJheXxBcmd1bWVudHN9IFtzZXQyPVtdXSBBbiBhcnJheS1saWtlIG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcsIG1lcmdlZCBhcnJheS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBfY29uY2F0KFs0LCA1LCA2XSwgWzEsIDIsIDNdKTsgLy89PiBbNCwgNSwgNiwgMSwgMiwgM11cbiAgICAgKi9cbiAgICB2YXIgX2NvbmNhdCA9IGZ1bmN0aW9uIF9jb25jYXQoc2V0MSwgc2V0Mikge1xuICAgICAgICBzZXQxID0gc2V0MSB8fCBbXTtcbiAgICAgICAgc2V0MiA9IHNldDIgfHwgW107XG4gICAgICAgIHZhciBpZHg7XG4gICAgICAgIHZhciBsZW4xID0gc2V0MS5sZW5ndGg7XG4gICAgICAgIHZhciBsZW4yID0gc2V0Mi5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbjEpIHtcbiAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHNldDFbaWR4XTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4yKSB7XG4gICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBzZXQyW2lkeF07XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICB2YXIgX2NvbnRhaW5zV2l0aCA9IGZ1bmN0aW9uIF9jb250YWluc1dpdGgocHJlZCwgeCwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAocHJlZCh4LCBsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBfZmlsdGVyID0gZnVuY3Rpb24gX2ZpbHRlcihmbiwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChmbihsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gbGlzdFtpZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgdmFyIF9mb3JjZVJlZHVjZWQgPSBmdW5jdGlvbiBfZm9yY2VSZWR1Y2VkKHgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdAQHRyYW5zZHVjZXIvdmFsdWUnOiB4LFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJzogdHJ1ZVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyBTdHJpbmcoeCA9PiB4KSBldmFsdWF0ZXMgdG8gXCJ4ID0+IHhcIiwgc28gdGhlIHBhdHRlcm4gbWF5IG5vdCBtYXRjaC5cbiAgICB2YXIgX2Z1bmN0aW9uTmFtZSA9IGZ1bmN0aW9uIF9mdW5jdGlvbk5hbWUoZikge1xuICAgICAgICAvLyBTdHJpbmcoeCA9PiB4KSBldmFsdWF0ZXMgdG8gXCJ4ID0+IHhcIiwgc28gdGhlIHBhdHRlcm4gbWF5IG5vdCBtYXRjaC5cbiAgICAgICAgdmFyIG1hdGNoID0gU3RyaW5nKGYpLm1hdGNoKC9eZnVuY3Rpb24gKFxcdyopLyk7XG4gICAgICAgIHJldHVybiBtYXRjaCA9PSBudWxsID8gJycgOiBtYXRjaFsxXTtcbiAgICB9O1xuXG4gICAgdmFyIF9oYXMgPSBmdW5jdGlvbiBfaGFzKHByb3AsIG9iaikge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG4gICAgfTtcblxuICAgIHZhciBfaWRlbnRpdHkgPSBmdW5jdGlvbiBfaWRlbnRpdHkoeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9O1xuXG4gICAgdmFyIF9pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbiAgICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoYXJndW1lbnRzKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXScgPyBmdW5jdGlvbiBfaXNBcmd1bWVudHMoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuICAgICAgICB9IDogZnVuY3Rpb24gX2lzQXJndW1lbnRzKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBfaGFzKCdjYWxsZWUnLCB4KTtcbiAgICAgICAgfTtcbiAgICB9KCk7XG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB3aGV0aGVyIG9yIG5vdCBhbiBvYmplY3QgaXMgYW4gYXJyYXkuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsIFRoZSBvYmplY3QgdG8gdGVzdC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYHZhbGAgaXMgYW4gYXJyYXksIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIF9pc0FycmF5KFtdKTsgLy89PiB0cnVlXG4gICAgICogICAgICBfaXNBcnJheShudWxsKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgX2lzQXJyYXkoe30pOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiBfaXNBcnJheSh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHZhbCAhPSBudWxsICYmIHZhbC5sZW5ndGggPj0gMCAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuXG4gICAgdmFyIF9pc0Z1bmN0aW9uID0gZnVuY3Rpb24gX2lzTnVtYmVyKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIGlmIHRoZSBwYXNzZWQgYXJndW1lbnQgaXMgYW4gaW50ZWdlci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHsqfSBuXG4gICAgICogQGNhdGVnb3J5IFR5cGVcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIHZhciBfaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCBmdW5jdGlvbiBfaXNJbnRlZ2VyKG4pIHtcbiAgICAgICAgcmV0dXJuIG4gPDwgMCA9PT0gbjtcbiAgICB9O1xuXG4gICAgdmFyIF9pc051bWJlciA9IGZ1bmN0aW9uIF9pc051bWJlcih4KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IE51bWJlcl0nO1xuICAgIH07XG5cbiAgICB2YXIgX2lzT2JqZWN0ID0gZnVuY3Rpb24gX2lzT2JqZWN0KHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG4gICAgfTtcblxuICAgIHZhciBfaXNQbGFjZWhvbGRlciA9IGZ1bmN0aW9uIF9pc1BsYWNlaG9sZGVyKGEpIHtcbiAgICAgICAgcmV0dXJuIGEgIT0gbnVsbCAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWU7XG4gICAgfTtcblxuICAgIHZhciBfaXNSZWdFeHAgPSBmdW5jdGlvbiBfaXNSZWdFeHAoeCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBSZWdFeHBdJztcbiAgICB9O1xuXG4gICAgdmFyIF9pc1N0cmluZyA9IGZ1bmN0aW9uIF9pc1N0cmluZyh4KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xuICAgIH07XG5cbiAgICB2YXIgX2lzVHJhbnNmb3JtZXIgPSBmdW5jdGlvbiBfaXNUcmFuc2Zvcm1lcihvYmopIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmpbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPT09ICdmdW5jdGlvbic7XG4gICAgfTtcblxuICAgIHZhciBfbWFwID0gZnVuY3Rpb24gX21hcChmbiwgZnVuY3Rvcikge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGZ1bmN0b3IubGVuZ3RoO1xuICAgICAgICB2YXIgcmVzdWx0ID0gQXJyYXkobGVuKTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgcmVzdWx0W2lkeF0gPSBmbihmdW5jdG9yW2lkeF0pO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLy8gQmFzZWQgb24gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2Fzc2lnblxuICAgIHZhciBfb2JqZWN0QXNzaWduID0gZnVuY3Rpb24gX29iamVjdEFzc2lnbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3V0cHV0ID0gT2JqZWN0KHRhcmdldCk7XG4gICAgICAgIHZhciBpZHggPSAxO1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpZHhdO1xuICAgICAgICAgICAgaWYgKHNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9oYXMobmV4dEtleSwgc291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xuXG4gICAgdmFyIF9vZiA9IGZ1bmN0aW9uIF9vZih4KSB7XG4gICAgICAgIHJldHVybiBbeF07XG4gICAgfTtcblxuICAgIHZhciBfcGlwZSA9IGZ1bmN0aW9uIF9waXBlKGYsIGcpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnLmNhbGwodGhpcywgZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIF9waXBlUCA9IGZ1bmN0aW9uIF9waXBlUChmLCBnKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY3R4ID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBmLmFwcGx5KGN0eCwgYXJndW1lbnRzKS50aGVuKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGcuY2FsbChjdHgsIHgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIFxcYiBtYXRjaGVzIHdvcmQgYm91bmRhcnk7IFtcXGJdIG1hdGNoZXMgYmFja3NwYWNlXG4gICAgdmFyIF9xdW90ZSA9IGZ1bmN0aW9uIF9xdW90ZShzKSB7XG4gICAgICAgIHZhciBlc2NhcGVkID0gcy5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpLnJlcGxhY2UoL1tcXGJdL2csICdcXFxcYicpICAgIC8vIFxcYiBtYXRjaGVzIHdvcmQgYm91bmRhcnk7IFtcXGJdIG1hdGNoZXMgYmFja3NwYWNlXG4gICAgLnJlcGxhY2UoL1xcZi9nLCAnXFxcXGYnKS5yZXBsYWNlKC9cXG4vZywgJ1xcXFxuJykucmVwbGFjZSgvXFxyL2csICdcXFxccicpLnJlcGxhY2UoL1xcdC9nLCAnXFxcXHQnKS5yZXBsYWNlKC9cXHYvZywgJ1xcXFx2JykucmVwbGFjZSgvXFwwL2csICdcXFxcMCcpO1xuICAgICAgICByZXR1cm4gJ1wiJyArIGVzY2FwZWQucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpICsgJ1wiJztcbiAgICB9O1xuXG4gICAgdmFyIF9yZWR1Y2VkID0gZnVuY3Rpb24gX3JlZHVjZWQoeCkge1xuICAgICAgICByZXR1cm4geCAmJiB4WydAQHRyYW5zZHVjZXIvcmVkdWNlZCddID8geCA6IHtcbiAgICAgICAgICAgICdAQHRyYW5zZHVjZXIvdmFsdWUnOiB4LFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJzogdHJ1ZVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbiBvcHRpbWl6ZWQsIHByaXZhdGUgYXJyYXkgYHNsaWNlYCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtBcmd1bWVudHN8QXJyYXl9IGFyZ3MgVGhlIGFycmF5IG9yIGFyZ3VtZW50cyBvYmplY3QgdG8gY29uc2lkZXIuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtmcm9tPTBdIFRoZSBhcnJheSBpbmRleCB0byBzbGljZSBmcm9tLCBpbmNsdXNpdmUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFt0bz1hcmdzLmxlbmd0aF0gVGhlIGFycmF5IGluZGV4IHRvIHNsaWNlIHRvLCBleGNsdXNpdmUuXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgbmV3LCBzbGljZWQgYXJyYXkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgX3NsaWNlKFsxLCAyLCAzLCA0LCA1XSwgMSwgMyk7IC8vPT4gWzIsIDNdXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBmaXJzdFRocmVlQXJncyA9IGZ1bmN0aW9uKGEsIGIsIGMsIGQpIHtcbiAgICAgKiAgICAgICAgcmV0dXJuIF9zbGljZShhcmd1bWVudHMsIDAsIDMpO1xuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIGZpcnN0VGhyZWVBcmdzKDEsIDIsIDMsIDQpOyAvLz0+IFsxLCAyLCAzXVxuICAgICAqL1xuICAgIHZhciBfc2xpY2UgPSBmdW5jdGlvbiBfc2xpY2UoYXJncywgZnJvbSwgdG8pIHtcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiBfc2xpY2UoYXJncywgMCwgYXJncy5sZW5ndGgpO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gX3NsaWNlKGFyZ3MsIGZyb20sIGFyZ3MubGVuZ3RoKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBsaXN0ID0gW107XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHZhciBsZW4gPSBNYXRoLm1heCgwLCBNYXRoLm1pbihhcmdzLmxlbmd0aCwgdG8pIC0gZnJvbSk7XG4gICAgICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgbGlzdFtpZHhdID0gYXJnc1tmcm9tICsgaWR4XTtcbiAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaXN0O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFBvbHlmaWxsIGZyb20gPGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGUvdG9JU09TdHJpbmc+LlxuICAgICAqL1xuICAgIHZhciBfdG9JU09TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYWQgPSBmdW5jdGlvbiBwYWQobikge1xuICAgICAgICAgICAgcmV0dXJuIChuIDwgMTAgPyAnMCcgOiAnJykgKyBuO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdHlwZW9mIERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nID09PSAnZnVuY3Rpb24nID8gZnVuY3Rpb24gX3RvSVNPU3RyaW5nKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIH0gOiBmdW5jdGlvbiBfdG9JU09TdHJpbmcoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQuZ2V0VVRDRnVsbFllYXIoKSArICctJyArIHBhZChkLmdldFVUQ01vbnRoKCkgKyAxKSArICctJyArIHBhZChkLmdldFVUQ0RhdGUoKSkgKyAnVCcgKyBwYWQoZC5nZXRVVENIb3VycygpKSArICc6JyArIHBhZChkLmdldFVUQ01pbnV0ZXMoKSkgKyAnOicgKyBwYWQoZC5nZXRVVENTZWNvbmRzKCkpICsgJy4nICsgKGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgLyAxMDAwKS50b0ZpeGVkKDMpLnNsaWNlKDIsIDUpICsgJ1onO1xuICAgICAgICB9O1xuICAgIH0oKTtcblxuICAgIHZhciBfeGZCYXNlID0ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xuICAgICAgICB9LFxuICAgICAgICByZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgX3h3cmFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYV3JhcChmbikge1xuICAgICAgICAgICAgdGhpcy5mID0gZm47XG4gICAgICAgIH1cbiAgICAgICAgWFdyYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbml0IG5vdCBpbXBsZW1lbnRlZCBvbiBYV3JhcCcpO1xuICAgICAgICB9O1xuICAgICAgICBYV3JhcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uIChhY2MpIHtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH07XG4gICAgICAgIFhXcmFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmYoYWNjLCB4KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIF94d3JhcChmbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYV3JhcChmbik7XG4gICAgICAgIH07XG4gICAgfSgpO1xuXG4gICAgdmFyIF9hcGVydHVyZSA9IGZ1bmN0aW9uIF9hcGVydHVyZShuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGltaXQgPSBsaXN0Lmxlbmd0aCAtIChuIC0gMSk7XG4gICAgICAgIHZhciBhY2MgPSBuZXcgQXJyYXkobGltaXQgPj0gMCA/IGxpbWl0IDogMCk7XG4gICAgICAgIHdoaWxlIChpZHggPCBsaW1pdCkge1xuICAgICAgICAgICAgYWNjW2lkeF0gPSBfc2xpY2UobGlzdCwgaWR4LCBpZHggKyBuKTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfTtcblxuICAgIHZhciBfYXNzaWduID0gdHlwZW9mIE9iamVjdC5hc3NpZ24gPT09ICdmdW5jdGlvbicgPyBPYmplY3QuYXNzaWduIDogX29iamVjdEFzc2lnbjtcblxuICAgIC8qKlxuICAgICAqIFNpbWlsYXIgdG8gaGFzTWV0aG9kLCB0aGlzIGNoZWNrcyB3aGV0aGVyIGEgZnVuY3Rpb24gaGFzIGEgW21ldGhvZG5hbWVdXG4gICAgICogZnVuY3Rpb24uIElmIGl0IGlzbid0IGFuIGFycmF5IGl0IHdpbGwgZXhlY3V0ZSB0aGF0IGZ1bmN0aW9uIG90aGVyd2lzZSBpdFxuICAgICAqIHdpbGwgZGVmYXVsdCB0byB0aGUgcmFtZGEgaW1wbGVtZW50YXRpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIHJhbWRhIGltcGxlbXRhdGlvblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RuYW1lIHByb3BlcnR5IHRvIGNoZWNrIGZvciBhIGN1c3RvbSBpbXBsZW1lbnRhdGlvblxuICAgICAqIEByZXR1cm4ge09iamVjdH0gV2hhdGV2ZXIgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgbWV0aG9kIGlzLlxuICAgICAqL1xuICAgIHZhciBfY2hlY2tGb3JNZXRob2QgPSBmdW5jdGlvbiBfY2hlY2tGb3JNZXRob2QobWV0aG9kbmFtZSwgZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1tsZW5ndGggLSAxXTtcbiAgICAgICAgICAgIHJldHVybiBfaXNBcnJheShvYmopIHx8IHR5cGVvZiBvYmpbbWV0aG9kbmFtZV0gIT09ICdmdW5jdGlvbicgPyBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogb2JqW21ldGhvZG5hbWVdLmFwcGx5KG9iaiwgX3NsaWNlKGFyZ3VtZW50cywgMCwgbGVuZ3RoIC0gMSkpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcHRpbWl6ZWQgaW50ZXJuYWwgb25lLWFyaXR5IGN1cnJ5IGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBjdXJyaWVkIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIHZhciBfY3VycnkxID0gZnVuY3Rpb24gX2N1cnJ5MShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZjEoYSkge1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDAgfHwgX2lzUGxhY2Vob2xkZXIoYSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZjE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcHRpbWl6ZWQgaW50ZXJuYWwgdHdvLWFyaXR5IGN1cnJ5IGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBjdXJyaWVkIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIHZhciBfY3VycnkyID0gZnVuY3Rpb24gX2N1cnJ5Mihmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZjIoYSwgYikge1xuICAgICAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYyO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHJldHVybiBfaXNQbGFjZWhvbGRlcihhKSA/IGYyIDogX2N1cnJ5MShmdW5jdGlvbiAoX2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKGEsIF9iKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc1BsYWNlaG9sZGVyKGEpICYmIF9pc1BsYWNlaG9sZGVyKGIpID8gZjIgOiBfaXNQbGFjZWhvbGRlcihhKSA/IF9jdXJyeTEoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihfYSwgYik7XG4gICAgICAgICAgICAgICAgfSkgOiBfaXNQbGFjZWhvbGRlcihiKSA/IF9jdXJyeTEoZnVuY3Rpb24gKF9iKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihhLCBfYik7XG4gICAgICAgICAgICAgICAgfSkgOiBmbihhLCBiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogT3B0aW1pemVkIGludGVybmFsIHRocmVlLWFyaXR5IGN1cnJ5IGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBjdXJyaWVkIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIHZhciBfY3VycnkzID0gZnVuY3Rpb24gX2N1cnJ5Myhmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZjMoYSwgYiwgYykge1xuICAgICAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYzO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHJldHVybiBfaXNQbGFjZWhvbGRlcihhKSA/IGYzIDogX2N1cnJ5MihmdW5jdGlvbiAoX2IsIF9jKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihhLCBfYiwgX2MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIHJldHVybiBfaXNQbGFjZWhvbGRlcihhKSAmJiBfaXNQbGFjZWhvbGRlcihiKSA/IGYzIDogX2lzUGxhY2Vob2xkZXIoYSkgPyBfY3VycnkyKGZ1bmN0aW9uIChfYSwgX2MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKF9hLCBiLCBfYyk7XG4gICAgICAgICAgICAgICAgfSkgOiBfaXNQbGFjZWhvbGRlcihiKSA/IF9jdXJyeTIoZnVuY3Rpb24gKF9iLCBfYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oYSwgX2IsIF9jKTtcbiAgICAgICAgICAgICAgICB9KSA6IF9jdXJyeTEoZnVuY3Rpb24gKF9jKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihhLCBiLCBfYyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBfaXNQbGFjZWhvbGRlcihhKSAmJiBfaXNQbGFjZWhvbGRlcihiKSAmJiBfaXNQbGFjZWhvbGRlcihjKSA/IGYzIDogX2lzUGxhY2Vob2xkZXIoYSkgJiYgX2lzUGxhY2Vob2xkZXIoYikgPyBfY3VycnkyKGZ1bmN0aW9uIChfYSwgX2IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZuKF9hLCBfYiwgYyk7XG4gICAgICAgICAgICAgICAgfSkgOiBfaXNQbGFjZWhvbGRlcihhKSAmJiBfaXNQbGFjZWhvbGRlcihjKSA/IF9jdXJyeTIoZnVuY3Rpb24gKF9hLCBfYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oX2EsIGIsIF9jKTtcbiAgICAgICAgICAgICAgICB9KSA6IF9pc1BsYWNlaG9sZGVyKGIpICYmIF9pc1BsYWNlaG9sZGVyKGMpID8gX2N1cnJ5MihmdW5jdGlvbiAoX2IsIF9jKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihhLCBfYiwgX2MpO1xuICAgICAgICAgICAgICAgIH0pIDogX2lzUGxhY2Vob2xkZXIoYSkgPyBfY3VycnkxKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oX2EsIGIsIGMpO1xuICAgICAgICAgICAgICAgIH0pIDogX2lzUGxhY2Vob2xkZXIoYikgPyBfY3VycnkxKGZ1bmN0aW9uIChfYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oYSwgX2IsIGMpO1xuICAgICAgICAgICAgICAgIH0pIDogX2lzUGxhY2Vob2xkZXIoYykgPyBfY3VycnkxKGZ1bmN0aW9uIChfYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgX2MpO1xuICAgICAgICAgICAgICAgIH0pIDogZm4oYSwgYiwgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIGN1cnJ5TiBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCBUaGUgYXJpdHkgb2YgdGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtBcnJheX0gcmVjZWl2ZWQgQW4gYXJyYXkgb2YgYXJndW1lbnRzIHJlY2VpdmVkIHRodXMgZmFyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgdmFyIF9jdXJyeU4gPSBmdW5jdGlvbiBfY3VycnlOKGxlbmd0aCwgcmVjZWl2ZWQsIGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29tYmluZWQgPSBbXTtcbiAgICAgICAgICAgIHZhciBhcmdzSWR4ID0gMDtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gbGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGNvbWJpbmVkSWR4ID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChjb21iaW5lZElkeCA8IHJlY2VpdmVkLmxlbmd0aCB8fCBhcmdzSWR4IDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICAgICAgaWYgKGNvbWJpbmVkSWR4IDwgcmVjZWl2ZWQubGVuZ3RoICYmICghX2lzUGxhY2Vob2xkZXIocmVjZWl2ZWRbY29tYmluZWRJZHhdKSB8fCBhcmdzSWR4ID49IGFyZ3VtZW50cy5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlY2VpdmVkW2NvbWJpbmVkSWR4XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBhcmd1bWVudHNbYXJnc0lkeF07XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NJZHggKz0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29tYmluZWRbY29tYmluZWRJZHhdID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmICghX2lzUGxhY2Vob2xkZXIocmVzdWx0KSkge1xuICAgICAgICAgICAgICAgICAgICBsZWZ0IC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbWJpbmVkSWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGVmdCA8PSAwID8gZm4uYXBwbHkodGhpcywgY29tYmluZWQpIDogX2FyaXR5KGxlZnQsIF9jdXJyeU4obGVuZ3RoLCBjb21iaW5lZCwgZm4pKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgZGlzcGF0Y2hlcyB3aXRoIGRpZmZlcmVudCBzdHJhdGVnaWVzIGJhc2VkIG9uIHRoZVxuICAgICAqIG9iamVjdCBpbiBsaXN0IHBvc2l0aW9uIChsYXN0IGFyZ3VtZW50KS4gSWYgaXQgaXMgYW4gYXJyYXksIGV4ZWN1dGVzIFtmbl0uXG4gICAgICogT3RoZXJ3aXNlLCBpZiBpdCBoYXMgYSBmdW5jdGlvbiB3aXRoIFttZXRob2RuYW1lXSwgaXQgd2lsbCBleGVjdXRlIHRoYXRcbiAgICAgKiBmdW5jdGlvbiAoZnVuY3RvciBjYXNlKS4gT3RoZXJ3aXNlLCBpZiBpdCBpcyBhIHRyYW5zZm9ybWVyLCB1c2VzIHRyYW5zZHVjZXJcbiAgICAgKiBbeGZdIHRvIHJldHVybiBhIG5ldyB0cmFuc2Zvcm1lciAodHJhbnNkdWNlciBjYXNlKS4gT3RoZXJ3aXNlLCBpdCB3aWxsXG4gICAgICogZGVmYXVsdCB0byBleGVjdXRpbmcgW2ZuXS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZG5hbWUgcHJvcGVydHkgdG8gY2hlY2sgZm9yIGEgY3VzdG9tIGltcGxlbWVudGF0aW9uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0geGYgdHJhbnNkdWNlciB0byBpbml0aWFsaXplIGlmIG9iamVjdCBpcyB0cmFuc2Zvcm1lclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIGRlZmF1bHQgcmFtZGEgaW1wbGVtZW50YXRpb25cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0aGF0IGRpc3BhdGNoZXMgb24gb2JqZWN0IGluIGxpc3QgcG9zaXRpb25cbiAgICAgKi9cbiAgICB2YXIgX2Rpc3BhdGNoYWJsZSA9IGZ1bmN0aW9uIF9kaXNwYXRjaGFibGUobWV0aG9kbmFtZSwgeGYsIGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbbGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KG9iaikpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IF9zbGljZShhcmd1bWVudHMsIDAsIGxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqW21ldGhvZG5hbWVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpbbWV0aG9kbmFtZV0uYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9pc1RyYW5zZm9ybWVyKG9iaikpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZHVjZXIgPSB4Zi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXIob2JqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIF9kcm9wTGFzdFdoaWxlID0gZnVuY3Rpb24gZHJvcExhc3RXaGlsZShwcmVkLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpZHggPj0gMCAmJiBwcmVkKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgIGlkeCAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfc2xpY2UobGlzdCwgMCwgaWR4ICsgMSk7XG4gICAgfTtcblxuICAgIHZhciBfeGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWEFsbChmLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5mID0gZjtcbiAgICAgICAgICAgIHRoaXMuYWxsID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBYQWxsLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWEFsbC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFsbCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWEFsbC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmYoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBfcmVkdWNlZCh0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgZmFsc2UpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94YWxsKGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhBbGwoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hhbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhBbnkoZiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgICAgIHRoaXMuZiA9IGY7XG4gICAgICAgICAgICB0aGlzLmFueSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIFhBbnkucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYQW55LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmFueSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIFhBbnkucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmYoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbnkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IF9yZWR1Y2VkKHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCB0cnVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGFueShmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYQW55KGYsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94YXBlcnR1cmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhBcGVydHVyZShuLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5wb3MgPSAwO1xuICAgICAgICAgICAgdGhpcy5mdWxsID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmFjYyA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgfVxuICAgICAgICBYQXBlcnR1cmUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYQXBlcnR1cmUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLmFjYyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIFhBcGVydHVyZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5zdG9yZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mdWxsID8gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMuZ2V0Q29weSgpKSA6IHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgWEFwZXJ0dXJlLnByb3RvdHlwZS5zdG9yZSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5hY2NbdGhpcy5wb3NdID0gaW5wdXQ7XG4gICAgICAgICAgICB0aGlzLnBvcyArPSAxO1xuICAgICAgICAgICAgaWYgKHRoaXMucG9zID09PSB0aGlzLmFjYy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvcyA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5mdWxsID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgWEFwZXJ0dXJlLnByb3RvdHlwZS5nZXRDb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jb25jYXQoX3NsaWNlKHRoaXMuYWNjLCB0aGlzLnBvcyksIF9zbGljZSh0aGlzLmFjYywgMCwgdGhpcy5wb3MpKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hhcGVydHVyZShuLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYQXBlcnR1cmUobiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hkcm9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYRHJvcChuLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5uID0gbjtcbiAgICAgICAgfVxuICAgICAgICBYRHJvcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhEcm9wLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gICAgICAgIFhEcm9wLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5uID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubiAtPSAxO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hkcm9wKG4sIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhEcm9wKG4sIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZHJvcExhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhEcm9wTGFzdChuLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5wb3MgPSAwO1xuICAgICAgICAgICAgdGhpcy5mdWxsID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmFjYyA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgfVxuICAgICAgICBYRHJvcExhc3QucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYRHJvcExhc3QucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLmFjYyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIFhEcm9wTGFzdC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCB0aGlzLmFjY1t0aGlzLnBvc10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdG9yZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICBYRHJvcExhc3QucHJvdG90eXBlLnN0b3JlID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmFjY1t0aGlzLnBvc10gPSBpbnB1dDtcbiAgICAgICAgICAgIHRoaXMucG9zICs9IDE7XG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPT09IHRoaXMuYWNjLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmZ1bGwgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGRyb3BMYXN0KG4sIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhEcm9wTGFzdChuLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGRyb3BSZXBlYXRzV2l0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWERyb3BSZXBlYXRzV2l0aChwcmVkLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5wcmVkID0gcHJlZDtcbiAgICAgICAgICAgIHRoaXMubGFzdFZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5zZWVuRmlyc3RWYWx1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIFhEcm9wUmVwZWF0c1dpdGgucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbiAgICAgICAgfTtcbiAgICAgICAgWERyb3BSZXBlYXRzV2l0aC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWERyb3BSZXBlYXRzV2l0aC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHNhbWVBc0xhc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5zZWVuRmlyc3RWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VlbkZpcnN0VmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByZWQodGhpcy5sYXN0VmFsdWUsIGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHNhbWVBc0xhc3QgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5sYXN0VmFsdWUgPSBpbnB1dDtcbiAgICAgICAgICAgIHJldHVybiBzYW1lQXNMYXN0ID8gcmVzdWx0IDogdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hkcm9wUmVwZWF0c1dpdGgocHJlZCwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWERyb3BSZXBlYXRzV2l0aChwcmVkLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGRyb3BXaGlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWERyb3BXaGlsZShmLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5mID0gZjtcbiAgICAgICAgfVxuICAgICAgICBYRHJvcFdoaWxlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWERyb3BXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IF94ZkJhc2UucmVzdWx0O1xuICAgICAgICBYRHJvcFdoaWxlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5mKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZihpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5mID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGRyb3BXaGlsZShmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRHJvcFdoaWxlKGYsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZmlsdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYRmlsdGVyKGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICB9XG4gICAgICAgIFhGaWx0ZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYRmlsdGVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gICAgICAgIFhGaWx0ZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmYoaW5wdXQpID8gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KSA6IHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hmaWx0ZXIoZiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWEZpbHRlcihmLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGZpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhGaW5kKGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICAgICAgdGhpcy5mb3VuZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIFhGaW5kLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWEZpbmQucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZm91bmQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdm9pZCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWEZpbmQucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmYoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gX3JlZHVjZWQodGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGZpbmQoZiwgeGYpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWEZpbmQoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hmaW5kSW5kZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhGaW5kSW5kZXgoZiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgICAgIHRoaXMuZiA9IGY7XG4gICAgICAgICAgICB0aGlzLmlkeCA9IC0xO1xuICAgICAgICAgICAgdGhpcy5mb3VuZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIFhGaW5kSW5kZXgucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYRmluZEluZGV4LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmZvdW5kKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIC0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWEZpbmRJbmRleC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5pZHggKz0gMTtcbiAgICAgICAgICAgIGlmICh0aGlzLmYoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gX3JlZHVjZWQodGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMuaWR4KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGZpbmRJbmRleChmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRmluZEluZGV4KGYsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZmluZExhc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhGaW5kTGFzdChmLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5mID0gZjtcbiAgICAgICAgfVxuICAgICAgICBYRmluZExhc3QucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYRmluZExhc3QucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHRoaXMueGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10ocmVzdWx0LCB0aGlzLmxhc3QpKTtcbiAgICAgICAgfTtcbiAgICAgICAgWEZpbmRMYXN0LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5mKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdCA9IGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3hmaW5kTGFzdChmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRmluZExhc3QoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICB2YXIgX3hmaW5kTGFzdEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYRmluZExhc3RJbmRleChmLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5mID0gZjtcbiAgICAgICAgICAgIHRoaXMuaWR4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmxhc3RJZHggPSAtMTtcbiAgICAgICAgfVxuICAgICAgICBYRmluZExhc3RJbmRleC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhGaW5kTGFzdEluZGV4LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdGhpcy5sYXN0SWR4KSk7XG4gICAgICAgIH07XG4gICAgICAgIFhGaW5kTGFzdEluZGV4LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmlkeCArPSAxO1xuICAgICAgICAgICAgaWYgKHRoaXMuZihpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RJZHggPSB0aGlzLmlkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94ZmluZExhc3RJbmRleChmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRmluZExhc3RJbmRleChmLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeG1hcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWE1hcChmLCB4Zikge1xuICAgICAgICAgICAgdGhpcy54ZiA9IHhmO1xuICAgICAgICAgICAgdGhpcy5mID0gZjtcbiAgICAgICAgfVxuICAgICAgICBYTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgICAgICAgWE1hcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IF94ZkJhc2UucmVzdWx0O1xuICAgICAgICBYTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMuZihpbnB1dCkpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeG1hcChmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYTWFwKGYsIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94dGFrZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWFRha2UobiwgeGYpIHtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgICAgIHRoaXMubiA9IG47XG4gICAgICAgIH1cbiAgICAgICAgWFRha2UucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYVGFrZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IF94ZkJhc2UucmVzdWx0O1xuICAgICAgICBYVGFrZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbiAocmVzdWx0LCBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubiA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfcmVkdWNlZChyZXN1bHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm4gLT0gMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3h0YWtlKG4sIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhUYWtlKG4sIHhmKTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgdmFyIF94dGFrZVdoaWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBYVGFrZVdoaWxlKGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICB9XG4gICAgICAgIFhUYWtlV2hpbGUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICAgICAgICBYVGFrZVdoaWxlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gICAgICAgIFhUYWtlV2hpbGUucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmYoaW5wdXQpID8gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KSA6IF9yZWR1Y2VkKHJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94dGFrZVdoaWxlKGYsIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhUYWtlV2hpbGUoZiwgeGYpO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIHR3byB2YWx1ZXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XG4gICAgICogQHNlZSBSLnN1YnRyYWN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5hZGQoMiwgMyk7ICAgICAgIC8vPT4gIDVcbiAgICAgKiAgICAgIFIuYWRkKDcpKDEwKTsgICAgICAvLz0+IDE3XG4gICAgICovXG4gICAgdmFyIGFkZCA9IF9jdXJyeTIoZnVuY3Rpb24gYWRkKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIE51bWJlcihhKSArIE51bWJlcihiKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEFwcGxpZXMgYSBmdW5jdGlvbiB0byB0aGUgdmFsdWUgYXQgdGhlIGdpdmVuIGluZGV4IG9mIGFuIGFycmF5LCByZXR1cm5pbmcgYVxuICAgICAqIG5ldyBjb3B5IG9mIHRoZSBhcnJheSB3aXRoIHRoZSBlbGVtZW50IGF0IHRoZSBnaXZlbiBpbmRleCByZXBsYWNlZCB3aXRoIHRoZVxuICAgICAqIHJlc3VsdCBvZiB0aGUgZnVuY3Rpb24gYXBwbGljYXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gYSkgLT4gTnVtYmVyIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYXBwbHkuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGlkeCBUaGUgaW5kZXguXG4gICAgICogQHBhcmFtIHtBcnJheXxBcmd1bWVudHN9IGxpc3QgQW4gYXJyYXktbGlrZSBvYmplY3Qgd2hvc2UgdmFsdWVcbiAgICAgKiAgICAgICAgYXQgdGhlIHN1cHBsaWVkIGluZGV4IHdpbGwgYmUgcmVwbGFjZWQuXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgY29weSBvZiB0aGUgc3VwcGxpZWQgYXJyYXktbGlrZSBvYmplY3Qgd2l0aFxuICAgICAqICAgICAgICAgdGhlIGVsZW1lbnQgYXQgaW5kZXggYGlkeGAgcmVwbGFjZWQgd2l0aCB0aGUgdmFsdWVcbiAgICAgKiAgICAgICAgIHJldHVybmVkIGJ5IGFwcGx5aW5nIGBmbmAgdG8gdGhlIGV4aXN0aW5nIGVsZW1lbnQuXG4gICAgICogQHNlZSBSLnVwZGF0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYWRqdXN0KFIuYWRkKDEwKSwgMSwgWzAsIDEsIDJdKTsgICAgIC8vPT4gWzAsIDExLCAyXVxuICAgICAqICAgICAgUi5hZGp1c3QoUi5hZGQoMTApKSgxKShbMCwgMSwgMl0pOyAgICAgLy89PiBbMCwgMTEsIDJdXG4gICAgICovXG4gICAgdmFyIGFkanVzdCA9IF9jdXJyeTMoZnVuY3Rpb24gYWRqdXN0KGZuLCBpZHgsIGxpc3QpIHtcbiAgICAgICAgaWYgKGlkeCA+PSBsaXN0Lmxlbmd0aCB8fCBpZHggPCAtbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBsaXN0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdGFydCA9IGlkeCA8IDAgPyBsaXN0Lmxlbmd0aCA6IDA7XG4gICAgICAgIHZhciBfaWR4ID0gc3RhcnQgKyBpZHg7XG4gICAgICAgIHZhciBfbGlzdCA9IF9jb25jYXQobGlzdCk7XG4gICAgICAgIF9saXN0W19pZHhdID0gZm4obGlzdFtfaWR4XSk7XG4gICAgICAgIHJldHVybiBfbGlzdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGFsbCBlbGVtZW50cyBvZiB0aGUgbGlzdCBtYXRjaCB0aGUgcHJlZGljYXRlLCBgZmFsc2VgIGlmXG4gICAgICogdGhlcmUgYXJlIGFueSB0aGF0IGRvbid0LlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGFsbGAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBwcmVkaWNhdGUgaXMgc2F0aXNmaWVkIGJ5IGV2ZXJ5IGVsZW1lbnQsIGBmYWxzZWBcbiAgICAgKiAgICAgICAgIG90aGVyd2lzZS5cbiAgICAgKiBAc2VlIFIuYW55LCBSLm5vbmUsIFIudHJhbnNkdWNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGxlc3NUaGFuMiA9IFIuZmxpcChSLmx0KSgyKTtcbiAgICAgKiAgICAgIHZhciBsZXNzVGhhbjMgPSBSLmZsaXAoUi5sdCkoMyk7XG4gICAgICogICAgICBSLmFsbChsZXNzVGhhbjIpKFsxLCAyXSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuYWxsKGxlc3NUaGFuMykoWzEsIDJdKTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGFsbCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnYWxsJywgX3hhbGwsIGZ1bmN0aW9uIGFsbChmbiwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoIWZuKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGUgZ2l2ZW4gdmFsdWUuIE5vdGUgdGhhdCBmb3JcbiAgICAgKiBub24tcHJpbWl0aXZlcyB0aGUgdmFsdWUgcmV0dXJuZWQgaXMgYSByZWZlcmVuY2UgdG8gdGhlIG9yaWdpbmFsIHZhbHVlLlxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiBpcyBrbm93biBhcyBgY29uc3RgLCBgY29uc3RhbnRgLCBvciBgS2AgKGZvciBLIGNvbWJpbmF0b3IpIGluXG4gICAgICogb3RoZXIgbGFuZ3VhZ2VzIGFuZCBsaWJyYXJpZXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgYSAtPiAoKiAtPiBhKVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsIFRoZSB2YWx1ZSB0byB3cmFwIGluIGEgZnVuY3Rpb25cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBGdW5jdGlvbiA6OiAqIC0+IHZhbC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgdCA9IFIuYWx3YXlzKCdUZWUnKTtcbiAgICAgKiAgICAgIHQoKTsgLy89PiAnVGVlJ1xuICAgICAqL1xuICAgIHZhciBhbHdheXMgPSBfY3VycnkxKGZ1bmN0aW9uIGFsd2F5cyh2YWwpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBib3RoIGFyZ3VtZW50cyBhcmUgYHRydWVgOyBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyAqIC0+ICogLT4gKlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gYSBBIGJvb2xlYW4gdmFsdWVcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGIgQSBib29sZWFuIHZhbHVlXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIGJvdGggYXJndW1lbnRzIGFyZSBgdHJ1ZWAsIGBmYWxzZWAgb3RoZXJ3aXNlXG4gICAgICogQHNlZSBSLmJvdGhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmFuZCh0cnVlLCB0cnVlKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmFuZCh0cnVlLCBmYWxzZSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuYW5kKGZhbHNlLCB0cnVlKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5hbmQoZmFsc2UsIGZhbHNlKTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBhbmQgPSBfY3VycnkyKGZ1bmN0aW9uIGFuZChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhICYmIGI7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBhdCBsZWFzdCBvbmUgb2YgZWxlbWVudHMgb2YgdGhlIGxpc3QgbWF0Y2ggdGhlIHByZWRpY2F0ZSxcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBhbnlgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgcHJlZGljYXRlIGlzIHNhdGlzZmllZCBieSBhdCBsZWFzdCBvbmUgZWxlbWVudCwgYGZhbHNlYFxuICAgICAqICAgICAgICAgb3RoZXJ3aXNlLlxuICAgICAqIEBzZWUgUi5hbGwsIFIubm9uZSwgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbGVzc1RoYW4wID0gUi5mbGlwKFIubHQpKDApO1xuICAgICAqICAgICAgdmFyIGxlc3NUaGFuMiA9IFIuZmxpcChSLmx0KSgyKTtcbiAgICAgKiAgICAgIFIuYW55KGxlc3NUaGFuMCkoWzEsIDJdKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5hbnkobGVzc1RoYW4yKShbMSwgMl0pOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgYW55ID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdhbnknLCBfeGFueSwgZnVuY3Rpb24gYW55KGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChmbihsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0LCBjb21wb3NlZCBvZiBuLXR1cGxlcyBvZiBjb25zZWN1dGl2ZSBlbGVtZW50cyBJZiBgbmAgaXNcbiAgICAgKiBncmVhdGVyIHRoYW4gdGhlIGxlbmd0aCBvZiB0aGUgbGlzdCwgYW4gZW1wdHkgbGlzdCBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBhcGVydHVyZWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFthXSAtPiBbW2FdXVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIFRoZSBzaXplIG9mIHRoZSB0dXBsZXMgdG8gY3JlYXRlXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBzcGxpdCBpbnRvIGBuYC10dXBsZXNcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIG5ldyBsaXN0LlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmFwZXJ0dXJlKDIsIFsxLCAyLCAzLCA0LCA1XSk7IC8vPT4gW1sxLCAyXSwgWzIsIDNdLCBbMywgNF0sIFs0LCA1XV1cbiAgICAgKiAgICAgIFIuYXBlcnR1cmUoMywgWzEsIDIsIDMsIDQsIDVdKTsgLy89PiBbWzEsIDIsIDNdLCBbMiwgMywgNF0sIFszLCA0LCA1XV1cbiAgICAgKiAgICAgIFIuYXBlcnR1cmUoNywgWzEsIDIsIDMsIDQsIDVdKTsgLy89PiBbXVxuICAgICAqL1xuICAgIHZhciBhcGVydHVyZSA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnYXBlcnR1cmUnLCBfeGFwZXJ0dXJlLCBfYXBlcnR1cmUpKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIHRoZSBjb250ZW50cyBvZiB0aGUgZ2l2ZW4gbGlzdCwgZm9sbG93ZWQgYnlcbiAgICAgKiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGEgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7Kn0gZWwgVGhlIGVsZW1lbnQgdG8gYWRkIHRvIHRoZSBlbmQgb2YgdGhlIG5ldyBsaXN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3Qgd2hvc2UgY29udGVudHMgd2lsbCBiZSBhZGRlZCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBvdXRwdXRcbiAgICAgKiAgICAgICAgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgbGlzdCBjb250YWluaW5nIHRoZSBjb250ZW50cyBvZiB0aGUgb2xkIGxpc3QgZm9sbG93ZWQgYnkgYGVsYC5cbiAgICAgKiBAc2VlIFIucHJlcGVuZFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYXBwZW5kKCd0ZXN0cycsIFsnd3JpdGUnLCAnbW9yZSddKTsgLy89PiBbJ3dyaXRlJywgJ21vcmUnLCAndGVzdHMnXVxuICAgICAqICAgICAgUi5hcHBlbmQoJ3Rlc3RzJywgW10pOyAvLz0+IFsndGVzdHMnXVxuICAgICAqICAgICAgUi5hcHBlbmQoWyd0ZXN0cyddLCBbJ3dyaXRlJywgJ21vcmUnXSk7IC8vPT4gWyd3cml0ZScsICdtb3JlJywgWyd0ZXN0cyddXVxuICAgICAqL1xuICAgIHZhciBhcHBlbmQgPSBfY3VycnkyKGZ1bmN0aW9uIGFwcGVuZChlbCwgbGlzdCkge1xuICAgICAgICByZXR1cm4gX2NvbmNhdChsaXN0LCBbZWxdKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEFwcGxpZXMgZnVuY3Rpb24gYGZuYCB0byB0aGUgYXJndW1lbnQgbGlzdCBgYXJnc2AuIFRoaXMgaXMgdXNlZnVsIGZvclxuICAgICAqIGNyZWF0aW5nIGEgZml4ZWQtYXJpdHkgZnVuY3Rpb24gZnJvbSBhIHZhcmlhZGljIGZ1bmN0aW9uLiBgZm5gIHNob3VsZCBiZSBhXG4gICAgICogYm91bmQgZnVuY3Rpb24gaWYgY29udGV4dCBpcyBzaWduaWZpY2FudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNy4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKi4uLiAtPiBhKSAtPiBbKl0gLT4gYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJnc1xuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLmNhbGwsIFIudW5hcHBseVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBudW1zID0gWzEsIDIsIDMsIC05OSwgNDIsIDYsIDddO1xuICAgICAqICAgICAgUi5hcHBseShNYXRoLm1heCwgbnVtcyk7IC8vPT4gNDJcbiAgICAgKi9cbiAgICB2YXIgYXBwbHkgPSBfY3VycnkyKGZ1bmN0aW9uIGFwcGx5KGZuLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGEgc2hhbGxvdyBjbG9uZSBvZiBhbiBvYmplY3QsIHNldHRpbmcgb3Igb3ZlcnJpZGluZyB0aGUgc3BlY2lmaWVkXG4gICAgICogcHJvcGVydHkgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUuIE5vdGUgdGhhdCB0aGlzIGNvcGllcyBhbmQgZmxhdHRlbnMgcHJvdG90eXBlXG4gICAgICogcHJvcGVydGllcyBvbnRvIHRoZSBuZXcgb2JqZWN0IGFzIHdlbGwuIEFsbCBub24tcHJpbWl0aXZlIHByb3BlcnRpZXMgYXJlXG4gICAgICogY29waWVkIGJ5IHJlZmVyZW5jZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgU3RyaW5nIC0+IGEgLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wIHRoZSBwcm9wZXJ0eSBuYW1lIHRvIHNldFxuICAgICAqIEBwYXJhbSB7Kn0gdmFsIHRoZSBuZXcgdmFsdWVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIHRoZSBvYmplY3QgdG8gY2xvbmVcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IGEgbmV3IG9iamVjdCBzaW1pbGFyIHRvIHRoZSBvcmlnaW5hbCBleGNlcHQgZm9yIHRoZSBzcGVjaWZpZWQgcHJvcGVydHkuXG4gICAgICogQHNlZSBSLmRpc3NvY1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYXNzb2MoJ2MnLCAzLCB7YTogMSwgYjogMn0pOyAvLz0+IHthOiAxLCBiOiAyLCBjOiAzfVxuICAgICAqL1xuICAgIHZhciBhc3NvYyA9IF9jdXJyeTMoZnVuY3Rpb24gYXNzb2MocHJvcCwgdmFsLCBvYmopIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICBmb3IgKHZhciBwIGluIG9iaikge1xuICAgICAgICAgICAgcmVzdWx0W3BdID0gb2JqW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFtwcm9wXSA9IHZhbDtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGEgc2hhbGxvdyBjbG9uZSBvZiBhbiBvYmplY3QsIHNldHRpbmcgb3Igb3ZlcnJpZGluZyB0aGUgbm9kZXMgcmVxdWlyZWRcbiAgICAgKiB0byBjcmVhdGUgdGhlIGdpdmVuIHBhdGgsIGFuZCBwbGFjaW5nIHRoZSBzcGVjaWZpYyB2YWx1ZSBhdCB0aGUgdGFpbCBlbmQgb2ZcbiAgICAgKiB0aGF0IHBhdGguIE5vdGUgdGhhdCB0aGlzIGNvcGllcyBhbmQgZmxhdHRlbnMgcHJvdG90eXBlIHByb3BlcnRpZXMgb250byB0aGVcbiAgICAgKiBuZXcgb2JqZWN0IGFzIHdlbGwuIEFsbCBub24tcHJpbWl0aXZlIHByb3BlcnRpZXMgYXJlIGNvcGllZCBieSByZWZlcmVuY2UuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjguMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIFtTdHJpbmddIC0+IGEgLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhdGggdGhlIHBhdGggdG8gc2V0XG4gICAgICogQHBhcmFtIHsqfSB2YWwgdGhlIG5ldyB2YWx1ZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogdGhlIG9iamVjdCB0byBjbG9uZVxuICAgICAqIEByZXR1cm4ge09iamVjdH0gYSBuZXcgb2JqZWN0IHNpbWlsYXIgdG8gdGhlIG9yaWdpbmFsIGV4Y2VwdCBhbG9uZyB0aGUgc3BlY2lmaWVkIHBhdGguXG4gICAgICogQHNlZSBSLmRpc3NvY1BhdGhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmFzc29jUGF0aChbJ2EnLCAnYicsICdjJ10sIDQyLCB7YToge2I6IHtjOiAwfX19KTsgLy89PiB7YToge2I6IHtjOiA0Mn19fVxuICAgICAqL1xuICAgIHZhciBhc3NvY1BhdGggPSBfY3VycnkzKGZ1bmN0aW9uIGFzc29jUGF0aChwYXRoLCB2YWwsIG9iaikge1xuICAgICAgICBzd2l0Y2ggKHBhdGgubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiBhc3NvYyhwYXRoWzBdLCB2YWwsIG9iaik7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gYXNzb2MocGF0aFswXSwgYXNzb2NQYXRoKF9zbGljZShwYXRoLCAxKSwgdmFsLCBPYmplY3Qob2JqW3BhdGhbMF1dKSksIG9iaik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGlzIGJvdW5kIHRvIGEgY29udGV4dC5cbiAgICAgKiBOb3RlOiBgUi5iaW5kYCBkb2VzIG5vdCBwcm92aWRlIHRoZSBhZGRpdGlvbmFsIGFyZ3VtZW50LWJpbmRpbmcgY2FwYWJpbGl0aWVzIG9mXG4gICAgICogW0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9iaW5kKS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNi4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgKCogLT4gKikgLT4geyp9IC0+ICgqIC0+ICopXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGJpbmQgdG8gY29udGV4dFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0aGlzT2JqIFRoZSBjb250ZXh0IHRvIGJpbmQgYGZuYCB0b1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBleGVjdXRlIGluIHRoZSBjb250ZXh0IG9mIGB0aGlzT2JqYC5cbiAgICAgKiBAc2VlIFIucGFydGlhbFxuICAgICAqL1xuICAgIHZhciBiaW5kID0gX2N1cnJ5MihmdW5jdGlvbiBiaW5kKGZuLCB0aGlzT2JqKSB7XG4gICAgICAgIHJldHVybiBfYXJpdHkoZm4ubGVuZ3RoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpc09iaiwgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXN0cmljdHMgYSBudW1iZXIgdG8gYmUgd2l0aGluIGEgcmFuZ2UuXG4gICAgICpcbiAgICAgKiBBbHNvIHdvcmtzIGZvciBvdGhlciBvcmRlcmVkIHR5cGVzIHN1Y2ggYXMgU3RyaW5ncyBhbmQgRGF0ZXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIwLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBhID0+IGEgLT4gYSAtPiBhIC0+IGFcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWluaW11bSBudW1iZXJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF4aW11bSBudW1iZXJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdmFsdWUgdG8gYmUgY2xhbXBlZFxuICAgICAqIEByZXR1cm4ge051bWJlcn0gUmV0dXJucyB0aGUgY2xhbXBlZCB2YWx1ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuY2xhbXAoMSwgMTAsIC0xKSAvLyA9PiAxXG4gICAgICogICAgICBSLmNsYW1wKDEsIDEwLCAxMSkgLy8gPT4gMTBcbiAgICAgKiAgICAgIFIuY2xhbXAoMSwgMTAsIDQpICAvLyA9PiA0XG4gICAgICovXG4gICAgdmFyIGNsYW1wID0gX2N1cnJ5MyhmdW5jdGlvbiBjbGFtcChtaW4sIG1heCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKG1pbiA+IG1heCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaW4gbXVzdCBub3QgYmUgZ3JlYXRlciB0aGFuIG1heCBpbiBjbGFtcChtaW4sIG1heCwgdmFsdWUpJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgbWluID8gbWluIDogdmFsdWUgPiBtYXggPyBtYXggOiB2YWx1ZTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE1ha2VzIGEgY29tcGFyYXRvciBmdW5jdGlvbiBvdXQgb2YgYSBmdW5jdGlvbiB0aGF0IHJlcG9ydHMgd2hldGhlciB0aGUgZmlyc3RcbiAgICAgKiBlbGVtZW50IGlzIGxlc3MgdGhhbiB0aGUgc2Vjb25kLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIChhLCBiIC0+IEJvb2xlYW4pIC0+IChhLCBiIC0+IE51bWJlcilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIEEgcHJlZGljYXRlIGZ1bmN0aW9uIG9mIGFyaXR5IHR3by5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBGdW5jdGlvbiA6OiBhIC0+IGIgLT4gSW50IHRoYXQgcmV0dXJucyBgLTFgIGlmIGEgPCBiLCBgMWAgaWYgYiA8IGEsIG90aGVyd2lzZSBgMGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGNtcCA9IFIuY29tcGFyYXRvcigoYSwgYikgPT4gYS5hZ2UgPCBiLmFnZSk7XG4gICAgICogICAgICB2YXIgcGVvcGxlID0gW1xuICAgICAqICAgICAgICAvLyAuLi5cbiAgICAgKiAgICAgIF07XG4gICAgICogICAgICBSLnNvcnQoY21wLCBwZW9wbGUpO1xuICAgICAqL1xuICAgIHZhciBjb21wYXJhdG9yID0gX2N1cnJ5MShmdW5jdGlvbiBjb21wYXJhdG9yKHByZWQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlZChhLCBiKSA/IC0xIDogcHJlZChiLCBhKSA/IDEgOiAwO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGN1cnJpZWQgZXF1aXZhbGVudCBvZiB0aGUgcHJvdmlkZWQgZnVuY3Rpb24sIHdpdGggdGhlIHNwZWNpZmllZFxuICAgICAqIGFyaXR5LiBUaGUgY3VycmllZCBmdW5jdGlvbiBoYXMgdHdvIHVudXN1YWwgY2FwYWJpbGl0aWVzLiBGaXJzdCwgaXRzXG4gICAgICogYXJndW1lbnRzIG5lZWRuJ3QgYmUgcHJvdmlkZWQgb25lIGF0IGEgdGltZS4gSWYgYGdgIGlzIGBSLmN1cnJ5TigzLCBmKWAsIHRoZVxuICAgICAqIGZvbGxvd2luZyBhcmUgZXF1aXZhbGVudDpcbiAgICAgKlxuICAgICAqICAgLSBgZygxKSgyKSgzKWBcbiAgICAgKiAgIC0gYGcoMSkoMiwgMylgXG4gICAgICogICAtIGBnKDEsIDIpKDMpYFxuICAgICAqICAgLSBgZygxLCAyLCAzKWBcbiAgICAgKlxuICAgICAqIFNlY29uZGx5LCB0aGUgc3BlY2lhbCBwbGFjZWhvbGRlciB2YWx1ZSBgUi5fX2AgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeVxuICAgICAqIFwiZ2Fwc1wiLCBhbGxvd2luZyBwYXJ0aWFsIGFwcGxpY2F0aW9uIG9mIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMsXG4gICAgICogcmVnYXJkbGVzcyBvZiB0aGVpciBwb3NpdGlvbnMuIElmIGBnYCBpcyBhcyBhYm92ZSBhbmQgYF9gIGlzIGBSLl9fYCwgdGhlXG4gICAgICogZm9sbG93aW5nIGFyZSBlcXVpdmFsZW50OlxuICAgICAqXG4gICAgICogICAtIGBnKDEsIDIsIDMpYFxuICAgICAqICAgLSBgZyhfLCAyLCAzKSgxKWBcbiAgICAgKiAgIC0gYGcoXywgXywgMykoMSkoMilgXG4gICAgICogICAtIGBnKF8sIF8sIDMpKDEsIDIpYFxuICAgICAqICAgLSBgZyhfLCAyKSgxKSgzKWBcbiAgICAgKiAgIC0gYGcoXywgMikoMSwgMylgXG4gICAgICogICAtIGBnKF8sIDIpKF8sIDMpKDEpYFxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC41LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIE51bWJlciAtPiAoKiAtPiBhKSAtPiAoKiAtPiBhKVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggVGhlIGFyaXR5IGZvciB0aGUgcmV0dXJuZWQgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGN1cnJ5LlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldywgY3VycmllZCBmdW5jdGlvbi5cbiAgICAgKiBAc2VlIFIuY3VycnlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgc3VtQXJncyA9ICguLi5hcmdzKSA9PiBSLnN1bShhcmdzKTtcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGN1cnJpZWRBZGRGb3VyTnVtYmVycyA9IFIuY3VycnlOKDQsIHN1bUFyZ3MpO1xuICAgICAqICAgICAgdmFyIGYgPSBjdXJyaWVkQWRkRm91ck51bWJlcnMoMSwgMik7XG4gICAgICogICAgICB2YXIgZyA9IGYoMyk7XG4gICAgICogICAgICBnKDQpOyAvLz0+IDEwXG4gICAgICovXG4gICAgdmFyIGN1cnJ5TiA9IF9jdXJyeTIoZnVuY3Rpb24gY3VycnlOKGxlbmd0aCwgZm4pIHtcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIF9jdXJyeTEoZm4pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfYXJpdHkobGVuZ3RoLCBfY3VycnlOKGxlbmd0aCwgW10sIGZuKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBEZWNyZW1lbnRzIGl0cyBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gblxuICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgKiBAc2VlIFIuaW5jXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5kZWMoNDIpOyAvLz0+IDQxXG4gICAgICovXG4gICAgdmFyIGRlYyA9IGFkZCgtMSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzZWNvbmQgYXJndW1lbnQgaWYgaXQgaXMgbm90IGBudWxsYCwgYHVuZGVmaW5lZGAgb3IgYE5hTmBcbiAgICAgKiBvdGhlcndpc2UgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMC4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyBhIC0+IGIgLT4gYSB8IGJcbiAgICAgKiBAcGFyYW0ge2F9IHZhbCBUaGUgZGVmYXVsdCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge2J9IHZhbCBUaGUgdmFsdWUgdG8gcmV0dXJuIGlmIGl0IGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAqIEByZXR1cm4geyp9IFRoZSB0aGUgc2Vjb25kIHZhbHVlIG9yIHRoZSBkZWZhdWx0IHZhbHVlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGRlZmF1bHRUbzQyID0gUi5kZWZhdWx0VG8oNDIpO1xuICAgICAqXG4gICAgICogICAgICBkZWZhdWx0VG80MihudWxsKTsgIC8vPT4gNDJcbiAgICAgKiAgICAgIGRlZmF1bHRUbzQyKHVuZGVmaW5lZCk7ICAvLz0+IDQyXG4gICAgICogICAgICBkZWZhdWx0VG80MignUmFtZGEnKTsgIC8vPT4gJ1JhbWRhJ1xuICAgICAqICAgICAgZGVmYXVsdFRvNDIocGFyc2VJbnQoJ3N0cmluZycpKTsgLy89PiA0MlxuICAgICAqL1xuICAgIHZhciBkZWZhdWx0VG8gPSBfY3VycnkyKGZ1bmN0aW9uIGRlZmF1bHRUbyhkLCB2KSB7XG4gICAgICAgIHJldHVybiB2ID09IG51bGwgfHwgdiAhPT0gdiA/IGQgOiB2O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIHNldCAoaS5lLiBubyBkdXBsaWNhdGVzKSBvZiBhbGwgZWxlbWVudHMgaW4gdGhlIGZpcnN0IGxpc3Qgbm90XG4gICAgICogY29udGFpbmVkIGluIHRoZSBzZWNvbmQgbGlzdC4gRHVwbGljYXRpb24gaXMgZGV0ZXJtaW5lZCBhY2NvcmRpbmcgdG8gdGhlXG4gICAgICogdmFsdWUgcmV0dXJuZWQgYnkgYXBwbHlpbmcgdGhlIHN1cHBsaWVkIHByZWRpY2F0ZSB0byB0d28gbGlzdCBlbGVtZW50cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyAoYSAtPiBhIC0+IEJvb2xlYW4pIC0+IFsqXSAtPiBbKl0gLT4gWypdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBBIHByZWRpY2F0ZSB1c2VkIHRvIHRlc3Qgd2hldGhlciB0d28gaXRlbXMgYXJlIGVxdWFsLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSBmaXJzdCBsaXN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBzZWNvbmQgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGVsZW1lbnRzIGluIGBsaXN0MWAgdGhhdCBhcmUgbm90IGluIGBsaXN0MmAuXG4gICAgICogQHNlZSBSLmRpZmZlcmVuY2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgY21wID0gKHgsIHkpID0+IHguYSA9PT0geS5hO1xuICAgICAqICAgICAgdmFyIGwxID0gW3thOiAxfSwge2E6IDJ9LCB7YTogM31dO1xuICAgICAqICAgICAgdmFyIGwyID0gW3thOiAzfSwge2E6IDR9XTtcbiAgICAgKiAgICAgIFIuZGlmZmVyZW5jZVdpdGgoY21wLCBsMSwgbDIpOyAvLz0+IFt7YTogMX0sIHthOiAyfV1cbiAgICAgKi9cbiAgICB2YXIgZGlmZmVyZW5jZVdpdGggPSBfY3VycnkzKGZ1bmN0aW9uIGRpZmZlcmVuY2VXaXRoKHByZWQsIGZpcnN0LCBzZWNvbmQpIHtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGZpcnN0TGVuID0gZmlyc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgZmlyc3RMZW4pIHtcbiAgICAgICAgICAgIGlmICghX2NvbnRhaW5zV2l0aChwcmVkLCBmaXJzdFtpZHhdLCBzZWNvbmQpICYmICFfY29udGFpbnNXaXRoKHByZWQsIGZpcnN0W2lkeF0sIG91dCkpIHtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChmaXJzdFtpZHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IG9iamVjdCB0aGF0IGRvZXMgbm90IGNvbnRhaW4gYSBgcHJvcGAgcHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBTdHJpbmcgLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wIHRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBkaXNzb2NpYXRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiB0aGUgb2JqZWN0IHRvIGNsb25lXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBhIG5ldyBvYmplY3Qgc2ltaWxhciB0byB0aGUgb3JpZ2luYWwgYnV0IHdpdGhvdXQgdGhlIHNwZWNpZmllZCBwcm9wZXJ0eVxuICAgICAqIEBzZWUgUi5hc3NvY1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZGlzc29jKCdiJywge2E6IDEsIGI6IDIsIGM6IDN9KTsgLy89PiB7YTogMSwgYzogM31cbiAgICAgKi9cbiAgICB2YXIgZGlzc29jID0gX2N1cnJ5MihmdW5jdGlvbiBkaXNzb2MocHJvcCwgb2JqKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChwICE9PSBwcm9wKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W3BdID0gb2JqW3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhIHNoYWxsb3cgY2xvbmUgb2YgYW4gb2JqZWN0LCBvbWl0dGluZyB0aGUgcHJvcGVydHkgYXQgdGhlIGdpdmVuIHBhdGguXG4gICAgICogTm90ZSB0aGF0IHRoaXMgY29waWVzIGFuZCBmbGF0dGVucyBwcm90b3R5cGUgcHJvcGVydGllcyBvbnRvIHRoZSBuZXcgb2JqZWN0XG4gICAgICogYXMgd2VsbC4gQWxsIG5vbi1wcmltaXRpdmUgcHJvcGVydGllcyBhcmUgY29waWVkIGJ5IHJlZmVyZW5jZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIFtTdHJpbmddIC0+IHtrOiB2fSAtPiB7azogdn1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXRoIHRoZSBwYXRoIHRvIHNldFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogdGhlIG9iamVjdCB0byBjbG9uZVxuICAgICAqIEByZXR1cm4ge09iamVjdH0gYSBuZXcgb2JqZWN0IHdpdGhvdXQgdGhlIHByb3BlcnR5IGF0IHBhdGhcbiAgICAgKiBAc2VlIFIuYXNzb2NQYXRoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5kaXNzb2NQYXRoKFsnYScsICdiJywgJ2MnXSwge2E6IHtiOiB7YzogNDJ9fX0pOyAvLz0+IHthOiB7Yjoge319fVxuICAgICAqL1xuICAgIHZhciBkaXNzb2NQYXRoID0gX2N1cnJ5MihmdW5jdGlvbiBkaXNzb2NQYXRoKHBhdGgsIG9iaikge1xuICAgICAgICBzd2l0Y2ggKHBhdGgubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiBkaXNzb2MocGF0aFswXSwgb2JqKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBoZWFkID0gcGF0aFswXTtcbiAgICAgICAgICAgIHZhciB0YWlsID0gX3NsaWNlKHBhdGgsIDEpO1xuICAgICAgICAgICAgcmV0dXJuIG9ialtoZWFkXSA9PSBudWxsID8gb2JqIDogYXNzb2MoaGVhZCwgZGlzc29jUGF0aCh0YWlsLCBvYmpbaGVhZF0pLCBvYmopO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBEaXZpZGVzIHR3byBudW1iZXJzLiBFcXVpdmFsZW50IHRvIGBhIC8gYmAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhIFRoZSBmaXJzdCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYiBUaGUgc2Vjb25kIHZhbHVlLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIHJlc3VsdCBvZiBgYSAvIGJgLlxuICAgICAqIEBzZWUgUi5tdWx0aXBseVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZGl2aWRlKDcxLCAxMDApOyAvLz0+IDAuNzFcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGhhbGYgPSBSLmRpdmlkZShSLl9fLCAyKTtcbiAgICAgKiAgICAgIGhhbGYoNDIpOyAvLz0+IDIxXG4gICAgICpcbiAgICAgKiAgICAgIHZhciByZWNpcHJvY2FsID0gUi5kaXZpZGUoMSk7XG4gICAgICogICAgICByZWNpcHJvY2FsKDQpOyAgIC8vPT4gMC4yNVxuICAgICAqL1xuICAgIHZhciBkaXZpZGUgPSBfY3VycnkyKGZ1bmN0aW9uIGRpdmlkZShhLCBiKSB7XG4gICAgICAgIHJldHVybiBhIC8gYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIHRoZSBsYXN0IGBuYCBlbGVtZW50cyBvZiBhIGdpdmVuIGxpc3QsIHBhc3NpbmdcbiAgICAgKiBlYWNoIHZhbHVlIHRvIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgZnVuY3Rpb24sIHNraXBwaW5nIGVsZW1lbnRzIHdoaWxlIHRoZVxuICAgICAqIHByZWRpY2F0ZSBmdW5jdGlvbiByZXR1cm5zIGB0cnVlYC4gVGhlIHByZWRpY2F0ZSBmdW5jdGlvbiBpcyBwYXNzZWQgb25lXG4gICAgICogYXJndW1lbnQ6ICoodmFsdWUpKi5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBkcm9wV2hpbGVgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgYXJyYXkuXG4gICAgICogQHNlZSBSLnRha2VXaGlsZSwgUi50cmFuc2R1Y2UsIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbHRlVHdvID0geCA9PiB4IDw9IDI7XG4gICAgICpcbiAgICAgKiAgICAgIFIuZHJvcFdoaWxlKGx0ZVR3bywgWzEsIDIsIDMsIDQsIDMsIDIsIDFdKTsgLy89PiBbMywgNCwgMywgMiwgMV1cbiAgICAgKi9cbiAgICB2YXIgZHJvcFdoaWxlID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdkcm9wV2hpbGUnLCBfeGRyb3BXaGlsZSwgZnVuY3Rpb24gZHJvcFdoaWxlKHByZWQsIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbiAmJiBwcmVkKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfc2xpY2UobGlzdCwgaWR4KTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBlbXB0eSB2YWx1ZSBvZiBpdHMgYXJndW1lbnQncyB0eXBlLiBSYW1kYSBkZWZpbmVzIHRoZSBlbXB0eVxuICAgICAqIHZhbHVlIG9mIEFycmF5IChgW11gKSwgT2JqZWN0IChge31gKSwgU3RyaW5nIChgJydgKSwgYW5kIEFyZ3VtZW50cy4gT3RoZXJcbiAgICAgKiB0eXBlcyBhcmUgc3VwcG9ydGVkIGlmIHRoZXkgZGVmaW5lIGA8VHlwZT4uZW1wdHlgIGFuZC9vclxuICAgICAqIGA8VHlwZT4ucHJvdG90eXBlLmVtcHR5YC5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBlbXB0eWAgbWV0aG9kIG9mIHRoZSBmaXJzdCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBhIC0+IGFcbiAgICAgKiBAcGFyYW0geyp9IHhcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZW1wdHkoSnVzdCg0MikpOyAgICAgIC8vPT4gTm90aGluZygpXG4gICAgICogICAgICBSLmVtcHR5KFsxLCAyLCAzXSk7ICAgICAvLz0+IFtdXG4gICAgICogICAgICBSLmVtcHR5KCd1bmljb3JucycpOyAgICAvLz0+ICcnXG4gICAgICogICAgICBSLmVtcHR5KHt4OiAxLCB5OiAyfSk7ICAvLz0+IHt9XG4gICAgICovXG4gICAgLy8gZWxzZVxuICAgIHZhciBlbXB0eSA9IF9jdXJyeTEoZnVuY3Rpb24gZW1wdHkoeCkge1xuICAgICAgICByZXR1cm4geCAhPSBudWxsICYmIHR5cGVvZiB4LmVtcHR5ID09PSAnZnVuY3Rpb24nID8geC5lbXB0eSgpIDogeCAhPSBudWxsICYmIHguY29uc3RydWN0b3IgIT0gbnVsbCAmJiB0eXBlb2YgeC5jb25zdHJ1Y3Rvci5lbXB0eSA9PT0gJ2Z1bmN0aW9uJyA/IHguY29uc3RydWN0b3IuZW1wdHkoKSA6IF9pc0FycmF5KHgpID8gW10gOiBfaXNTdHJpbmcoeCkgPyAnJyA6IF9pc09iamVjdCh4KSA/IHt9IDogX2lzQXJndW1lbnRzKHgpID8gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cztcbiAgICAgICAgfSgpIDogLy8gZWxzZVxuICAgICAgICB2b2lkIDA7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IG9iamVjdCBieSByZWN1cnNpdmVseSBldm9sdmluZyBhIHNoYWxsb3cgY29weSBvZiBgb2JqZWN0YCxcbiAgICAgKiBhY2NvcmRpbmcgdG8gdGhlIGB0cmFuc2Zvcm1hdGlvbmAgZnVuY3Rpb25zLiBBbGwgbm9uLXByaW1pdGl2ZSBwcm9wZXJ0aWVzXG4gICAgICogYXJlIGNvcGllZCBieSByZWZlcmVuY2UuXG4gICAgICpcbiAgICAgKiBBIGB0cmFuc2Zvcm1hdGlvbmAgZnVuY3Rpb24gd2lsbCBub3QgYmUgaW52b2tlZCBpZiBpdHMgY29ycmVzcG9uZGluZyBrZXlcbiAgICAgKiBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZXZvbHZlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtrOiAodiAtPiB2KX0gLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB0cmFuc2Zvcm1hdGlvbnMgVGhlIG9iamVjdCBzcGVjaWZ5aW5nIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9ucyB0byBhcHBseVxuICAgICAqICAgICAgICB0byB0aGUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBiZSB0cmFuc2Zvcm1lZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSB0cmFuc2Zvcm1lZCBvYmplY3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHRvbWF0byAgPSB7Zmlyc3ROYW1lOiAnICBUb21hdG8gJywgZGF0YToge2VsYXBzZWQ6IDEwMCwgcmVtYWluaW5nOiAxNDAwfSwgaWQ6MTIzfTtcbiAgICAgKiAgICAgIHZhciB0cmFuc2Zvcm1hdGlvbnMgPSB7XG4gICAgICogICAgICAgIGZpcnN0TmFtZTogUi50cmltLFxuICAgICAqICAgICAgICBsYXN0TmFtZTogUi50cmltLCAvLyBXaWxsIG5vdCBnZXQgaW52b2tlZC5cbiAgICAgKiAgICAgICAgZGF0YToge2VsYXBzZWQ6IFIuYWRkKDEpLCByZW1haW5pbmc6IFIuYWRkKC0xKX1cbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICBSLmV2b2x2ZSh0cmFuc2Zvcm1hdGlvbnMsIHRvbWF0byk7IC8vPT4ge2ZpcnN0TmFtZTogJ1RvbWF0bycsIGRhdGE6IHtlbGFwc2VkOiAxMDEsIHJlbWFpbmluZzogMTM5OX0sIGlkOjEyM31cbiAgICAgKi9cbiAgICB2YXIgZXZvbHZlID0gX2N1cnJ5MihmdW5jdGlvbiBldm9sdmUodHJhbnNmb3JtYXRpb25zLCBvYmplY3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICB2YXIgdHJhbnNmb3JtYXRpb24sIGtleSwgdHlwZTtcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbiA9IHRyYW5zZm9ybWF0aW9uc1trZXldO1xuICAgICAgICAgICAgdHlwZSA9IHR5cGVvZiB0cmFuc2Zvcm1hdGlvbjtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdHlwZSA9PT0gJ2Z1bmN0aW9uJyA/IHRyYW5zZm9ybWF0aW9uKG9iamVjdFtrZXldKSA6IHR5cGUgPT09ICdvYmplY3QnID8gZXZvbHZlKHRyYW5zZm9ybWF0aW9uc1trZXldLCBvYmplY3Rba2V5XSkgOiBvYmplY3Rba2V5XTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgbGlzdCB3aGljaCBtYXRjaGVzIHRoZSBwcmVkaWNhdGUsIG9yXG4gICAgICogYHVuZGVmaW5lZGAgaWYgbm8gZWxlbWVudCBtYXRjaGVzLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGZpbmRgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IGEgfCB1bmRlZmluZWRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBlbGVtZW50IGlzIHRoZVxuICAgICAqICAgICAgICBkZXNpcmVkIG9uZS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBlbGVtZW50IGZvdW5kLCBvciBgdW5kZWZpbmVkYC5cbiAgICAgKiBAc2VlIFIudHJhbnNkdWNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHhzID0gW3thOiAxfSwge2E6IDJ9LCB7YTogM31dO1xuICAgICAqICAgICAgUi5maW5kKFIucHJvcEVxKCdhJywgMikpKHhzKTsgLy89PiB7YTogMn1cbiAgICAgKiAgICAgIFIuZmluZChSLnByb3BFcSgnYScsIDQpKSh4cyk7IC8vPT4gdW5kZWZpbmVkXG4gICAgICovXG4gICAgdmFyIGZpbmQgPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2ZpbmQnLCBfeGZpbmQsIGZ1bmN0aW9uIGZpbmQoZm4sIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGZuKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdFtpZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgbGlzdCB3aGljaCBtYXRjaGVzIHRoZVxuICAgICAqIHByZWRpY2F0ZSwgb3IgYC0xYCBpZiBubyBlbGVtZW50IG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZmluZEluZGV4YCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4xXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBlbGVtZW50IGlzIHRoZVxuICAgICAqIGRlc2lyZWQgb25lLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGZvdW5kLCBvciBgLTFgLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgeHMgPSBbe2E6IDF9LCB7YTogMn0sIHthOiAzfV07XG4gICAgICogICAgICBSLmZpbmRJbmRleChSLnByb3BFcSgnYScsIDIpKSh4cyk7IC8vPT4gMVxuICAgICAqICAgICAgUi5maW5kSW5kZXgoUi5wcm9wRXEoJ2EnLCA0KSkoeHMpOyAvLz0+IC0xXG4gICAgICovXG4gICAgdmFyIGZpbmRJbmRleCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZmluZEluZGV4JywgX3hmaW5kSW5kZXgsIGZ1bmN0aW9uIGZpbmRJbmRleChmbiwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoZm4obGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpZHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBsaXN0IHdoaWNoIG1hdGNoZXMgdGhlIHByZWRpY2F0ZSwgb3JcbiAgICAgKiBgdW5kZWZpbmVkYCBpZiBubyBlbGVtZW50IG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZmluZExhc3RgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjFcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IGEgfCB1bmRlZmluZWRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBlbGVtZW50IGlzIHRoZVxuICAgICAqIGRlc2lyZWQgb25lLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGVsZW1lbnQgZm91bmQsIG9yIGB1bmRlZmluZWRgLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgeHMgPSBbe2E6IDEsIGI6IDB9LCB7YToxLCBiOiAxfV07XG4gICAgICogICAgICBSLmZpbmRMYXN0KFIucHJvcEVxKCdhJywgMSkpKHhzKTsgLy89PiB7YTogMSwgYjogMX1cbiAgICAgKiAgICAgIFIuZmluZExhc3QoUi5wcm9wRXEoJ2EnLCA0KSkoeHMpOyAvLz0+IHVuZGVmaW5lZFxuICAgICAqL1xuICAgIHZhciBmaW5kTGFzdCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZmluZExhc3QnLCBfeGZpbmRMYXN0LCBmdW5jdGlvbiBmaW5kTGFzdChmbiwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gbGlzdC5sZW5ndGggLSAxO1xuICAgICAgICB3aGlsZSAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIGlmIChmbihsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RbaWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCAtPSAxO1xuICAgICAgICB9XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgbGlzdCB3aGljaCBtYXRjaGVzIHRoZVxuICAgICAqIHByZWRpY2F0ZSwgb3IgYC0xYCBpZiBubyBlbGVtZW50IG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZmluZExhc3RJbmRleGAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMVxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIHByZWRpY2F0ZSBmdW5jdGlvbiB1c2VkIHRvIGRldGVybWluZSBpZiB0aGUgZWxlbWVudCBpcyB0aGVcbiAgICAgKiBkZXNpcmVkIG9uZS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBmb3VuZCwgb3IgYC0xYC5cbiAgICAgKiBAc2VlIFIudHJhbnNkdWNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHhzID0gW3thOiAxLCBiOiAwfSwge2E6MSwgYjogMX1dO1xuICAgICAqICAgICAgUi5maW5kTGFzdEluZGV4KFIucHJvcEVxKCdhJywgMSkpKHhzKTsgLy89PiAxXG4gICAgICogICAgICBSLmZpbmRMYXN0SW5kZXgoUi5wcm9wRXEoJ2EnLCA0KSkoeHMpOyAvLz0+IC0xXG4gICAgICovXG4gICAgdmFyIGZpbmRMYXN0SW5kZXggPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2ZpbmRMYXN0SW5kZXgnLCBfeGZpbmRMYXN0SW5kZXgsIGZ1bmN0aW9uIGZpbmRMYXN0SW5kZXgoZm4sIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IGxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgd2hpbGUgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICBpZiAoZm4obGlzdFtpZHhdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpZHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggLT0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZSBvdmVyIGFuIGlucHV0IGBsaXN0YCwgY2FsbGluZyBhIHByb3ZpZGVkIGZ1bmN0aW9uIGBmbmAgZm9yIGVhY2hcbiAgICAgKiBlbGVtZW50IGluIHRoZSBsaXN0LlxuICAgICAqXG4gICAgICogYGZuYCByZWNlaXZlcyBvbmUgYXJndW1lbnQ6ICoodmFsdWUpKi5cbiAgICAgKlxuICAgICAqIE5vdGU6IGBSLmZvckVhY2hgIGRvZXMgbm90IHNraXAgZGVsZXRlZCBvciB1bmFzc2lnbmVkIGluZGljZXMgKHNwYXJzZVxuICAgICAqIGFycmF5cyksIHVubGlrZSB0aGUgbmF0aXZlIGBBcnJheS5wcm90b3R5cGUuZm9yRWFjaGAgbWV0aG9kLiBGb3IgbW9yZVxuICAgICAqIGRldGFpbHMgb24gdGhpcyBiZWhhdmlvciwgc2VlOlxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2gjRGVzY3JpcHRpb25cbiAgICAgKlxuICAgICAqIEFsc28gbm90ZSB0aGF0LCB1bmxpa2UgYEFycmF5LnByb3RvdHlwZS5mb3JFYWNoYCwgUmFtZGEncyBgZm9yRWFjaGAgcmV0dXJuc1xuICAgICAqIHRoZSBvcmlnaW5hbCBhcnJheS4gSW4gc29tZSBsaWJyYXJpZXMgdGhpcyBmdW5jdGlvbiBpcyBuYW1lZCBgZWFjaGAuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgZm9yRWFjaGAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMVxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiAqKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGludm9rZS4gUmVjZWl2ZXMgb25lIGFyZ3VtZW50LCBgdmFsdWVgLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgb3JpZ2luYWwgbGlzdC5cbiAgICAgKiBAc2VlIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgcHJpbnRYUGx1c0ZpdmUgPSB4ID0+IGNvbnNvbGUubG9nKHggKyA1KTtcbiAgICAgKiAgICAgIFIuZm9yRWFjaChwcmludFhQbHVzRml2ZSwgWzEsIDIsIDNdKTsgLy89PiBbMSwgMiwgM11cbiAgICAgKiAgICAgIC8vLT4gNlxuICAgICAqICAgICAgLy8tPiA3XG4gICAgICogICAgICAvLy0+IDhcbiAgICAgKi9cbiAgICB2YXIgZm9yRWFjaCA9IF9jdXJyeTIoX2NoZWNrRm9yTWV0aG9kKCdmb3JFYWNoJywgZnVuY3Rpb24gZm9yRWFjaChmbiwgbGlzdCkge1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBmbihsaXN0W2lkeF0pO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBvYmplY3Qgb3V0IG9mIGEgbGlzdCBrZXktdmFsdWUgcGFpcnMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbW2ssdl1dIC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhaXJzIEFuIGFycmF5IG9mIHR3by1lbGVtZW50IGFycmF5cyB0aGF0IHdpbGwgYmUgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiB0aGUgb3V0cHV0IG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBvYmplY3QgbWFkZSBieSBwYWlyaW5nIHVwIGBrZXlzYCBhbmQgYHZhbHVlc2AuXG4gICAgICogQHNlZSBSLnRvUGFpcnMsIFIucGFpclxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZnJvbVBhaXJzKFtbJ2EnLCAxXSwgWydiJywgMl0sICBbJ2MnLCAzXV0pOyAvLz0+IHthOiAxLCBiOiAyLCBjOiAzfVxuICAgICAqL1xuICAgIHZhciBmcm9tUGFpcnMgPSBfY3VycnkxKGZ1bmN0aW9uIGZyb21QYWlycyhwYWlycykge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IHBhaXJzLmxlbmd0aDtcbiAgICAgICAgdmFyIG91dCA9IHt9O1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoX2lzQXJyYXkocGFpcnNbaWR4XSkgJiYgcGFpcnNbaWR4XS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBvdXRbcGFpcnNbaWR4XVswXV0gPSBwYWlyc1tpZHhdWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgbGlzdCBhbmQgcmV0dXJucyBhIGxpc3Qgb2YgbGlzdHMgd2hlcmUgZWFjaCBzdWJsaXN0J3MgZWxlbWVudHMgYXJlXG4gICAgICogYWxsIFwiZXF1YWxcIiBhY2NvcmRpbmcgdG8gdGhlIHByb3ZpZGVkIGVxdWFsaXR5IGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhLCBhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBbW2FdXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIGZvciBkZXRlcm1pbmluZyB3aGV0aGVyIHR3byBnaXZlbiAoYWRqYWNlbnQpXG4gICAgICogICAgICAgIGVsZW1lbnRzIHNob3VsZCBiZSBpbiB0aGUgc2FtZSBncm91cFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGdyb3VwLiBBbHNvIGFjY2VwdHMgYSBzdHJpbmcsIHdoaWNoIHdpbGwgYmVcbiAgICAgKiAgICAgICAgdHJlYXRlZCBhcyBhIGxpc3Qgb2YgY2hhcmFjdGVycy5cbiAgICAgKiBAcmV0dXJuIHtMaXN0fSBBIGxpc3QgdGhhdCBjb250YWlucyBzdWJsaXN0cyBvZiBlcXVhbCBlbGVtZW50cyxcbiAgICAgKiAgICAgICAgIHdob3NlIGNvbmNhdGVuYXRpb25zIGlzIGVxdWFsIHRvIHRoZSBvcmlnaW5hbCBsaXN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICBncm91cFdpdGgoUi5lcXVhbHMsIFswLCAxLCAxLCAyLCAzLCA1LCA4LCAxMywgMjFdKVxuICAgICAqICAgIC8vIFtbMF0sIFsxLCAxXSwgWzIsIDMsIDUsIDgsIDEzLCAyMV1dXG4gICAgICpcbiAgICAgKiAgICBncm91cFdpdGgoKGEsIGIpID0+IGEgJSAyID09PSBiICUgMiwgWzAsIDEsIDEsIDIsIDMsIDUsIDgsIDEzLCAyMV0pXG4gICAgICogICAgLy8gW1swXSwgWzEsIDFdLCBbMl0sIFszLCA1XSwgWzhdLCBbMTMsIDIxXV1cbiAgICAgKlxuICAgICAqICAgIFIuZ3JvdXBXaXRoKFIuZXFCeShpc1Zvd2VsKSwgJ2Flc3Rpb3UnKVxuICAgICAqICAgIC8vIFsnYWUnLCAnc3QnLCAnaW91J11cbiAgICAgKi9cbiAgICB2YXIgZ3JvdXBXaXRoID0gX2N1cnJ5MihmdW5jdGlvbiAoZm4sIGxpc3QpIHtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICB2YXIgbmV4dGlkeCA9IGlkeCArIDE7XG4gICAgICAgICAgICB3aGlsZSAobmV4dGlkeCA8IGxlbiAmJiBmbihsaXN0W2lkeF0sIGxpc3RbbmV4dGlkeF0pKSB7XG4gICAgICAgICAgICAgICAgbmV4dGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnB1c2gobGlzdC5zbGljZShpZHgsIG5leHRpZHgpKTtcbiAgICAgICAgICAgIGlkeCA9IG5leHRpZHg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBncmVhdGVyIHRoYW4gdGhlIHNlY29uZDsgYGZhbHNlYFxuICAgICAqIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBPcmQgYSA9PiBhIC0+IGEgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7Kn0gYVxuICAgICAqIEBwYXJhbSB7Kn0gYlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLmx0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5ndCgyLCAxKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmd0KDIsIDIpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmd0KDIsIDMpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmd0KCdhJywgJ3onKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5ndCgneicsICdhJyk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBndCA9IF9jdXJyeTIoZnVuY3Rpb24gZ3QoYSwgYikge1xuICAgICAgICByZXR1cm4gYSA+IGI7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZmlyc3QgYXJndW1lbnQgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSBzZWNvbmQ7XG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgT3JkIGEgPT4gYSAtPiBhIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBiXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAc2VlIFIubHRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5ndGUoMiwgMSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5ndGUoMiwgMik7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5ndGUoMiwgMyk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuZ3RlKCdhJywgJ3onKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5ndGUoJ3onLCAnYScpOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgZ3RlID0gX2N1cnJ5MihmdW5jdGlvbiBndGUoYSwgYikge1xuICAgICAgICByZXR1cm4gYSA+PSBiO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCBhbiBvYmplY3QgaGFzIGFuIG93biBwcm9wZXJ0eSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZVxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC43LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBzIC0+IHtzOiB4fSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3AgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGNoZWNrIGZvci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciB0aGUgcHJvcGVydHkgZXhpc3RzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBoYXNOYW1lID0gUi5oYXMoJ25hbWUnKTtcbiAgICAgKiAgICAgIGhhc05hbWUoe25hbWU6ICdhbGljZSd9KTsgICAvLz0+IHRydWVcbiAgICAgKiAgICAgIGhhc05hbWUoe25hbWU6ICdib2InfSk7ICAgICAvLz0+IHRydWVcbiAgICAgKiAgICAgIGhhc05hbWUoe30pOyAgICAgICAgICAgICAgICAvLz0+IGZhbHNlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBwb2ludCA9IHt4OiAwLCB5OiAwfTtcbiAgICAgKiAgICAgIHZhciBwb2ludEhhcyA9IFIuaGFzKFIuX18sIHBvaW50KTtcbiAgICAgKiAgICAgIHBvaW50SGFzKCd4Jyk7ICAvLz0+IHRydWVcbiAgICAgKiAgICAgIHBvaW50SGFzKCd5Jyk7ICAvLz0+IHRydWVcbiAgICAgKiAgICAgIHBvaW50SGFzKCd6Jyk7ICAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGhhcyA9IF9jdXJyeTIoX2hhcyk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IGFuIG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluIGhhcyBhIHByb3BlcnR5IHdpdGhcbiAgICAgKiB0aGUgc3BlY2lmaWVkIG5hbWVcbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNy4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgcyAtPiB7czogeH0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBjaGVjayBmb3IuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0cy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBmdW5jdGlvbiBSZWN0YW5nbGUod2lkdGgsIGhlaWdodCkge1xuICAgICAqICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICogICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAqICAgICAgfVxuICAgICAqICAgICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5hcmVhID0gZnVuY3Rpb24oKSB7XG4gICAgICogICAgICAgIHJldHVybiB0aGlzLndpZHRoICogdGhpcy5oZWlnaHQ7XG4gICAgICogICAgICB9O1xuICAgICAqXG4gICAgICogICAgICB2YXIgc3F1YXJlID0gbmV3IFJlY3RhbmdsZSgyLCAyKTtcbiAgICAgKiAgICAgIFIuaGFzSW4oJ3dpZHRoJywgc3F1YXJlKTsgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5oYXNJbignYXJlYScsIHNxdWFyZSk7ICAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgaGFzSW4gPSBfY3VycnkyKGZ1bmN0aW9uIGhhc0luKHByb3AsIG9iaikge1xuICAgICAgICByZXR1cm4gcHJvcCBpbiBvYmo7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgaXRzIGFyZ3VtZW50cyBhcmUgaWRlbnRpY2FsLCBmYWxzZSBvdGhlcndpc2UuIFZhbHVlcyBhcmVcbiAgICAgKiBpZGVudGljYWwgaWYgdGhleSByZWZlcmVuY2UgdGhlIHNhbWUgbWVtb3J5LiBgTmFOYCBpcyBpZGVudGljYWwgdG8gYE5hTmA7XG4gICAgICogYDBgIGFuZCBgLTBgIGFyZSBub3QgaWRlbnRpY2FsLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBhIC0+IGEgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7Kn0gYVxuICAgICAqIEBwYXJhbSB7Kn0gYlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG8gPSB7fTtcbiAgICAgKiAgICAgIFIuaWRlbnRpY2FsKG8sIG8pOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaWRlbnRpY2FsKDEsIDEpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaWRlbnRpY2FsKDEsICcxJyk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuaWRlbnRpY2FsKFtdLCBbXSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuaWRlbnRpY2FsKDAsIC0wKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pZGVudGljYWwoTmFOLCBOYU4pOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICAvLyBTYW1lVmFsdWUgYWxnb3JpdGhtXG4gICAgLy8gU3RlcHMgMS01LCA3LTEwXG4gICAgLy8gU3RlcHMgNi5iLTYuZTogKzAgIT0gLTBcbiAgICAvLyBTdGVwIDYuYTogTmFOID09IE5hTlxuICAgIHZhciBpZGVudGljYWwgPSBfY3VycnkyKGZ1bmN0aW9uIGlkZW50aWNhbChhLCBiKSB7XG4gICAgICAgIC8vIFNhbWVWYWx1ZSBhbGdvcml0aG1cbiAgICAgICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgICAgIC8vIFN0ZXBzIDEtNSwgNy0xMFxuICAgICAgICAgICAgLy8gU3RlcHMgNi5iLTYuZTogKzAgIT0gLTBcbiAgICAgICAgICAgIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09PSAxIC8gYjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFN0ZXAgNi5hOiBOYU4gPT0gTmFOXG4gICAgICAgICAgICByZXR1cm4gYSAhPT0gYSAmJiBiICE9PSBiO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBBIGZ1bmN0aW9uIHRoYXQgZG9lcyBub3RoaW5nIGJ1dCByZXR1cm4gdGhlIHBhcmFtZXRlciBzdXBwbGllZCB0byBpdC4gR29vZFxuICAgICAqIGFzIGEgZGVmYXVsdCBvciBwbGFjZWhvbGRlciBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBhIC0+IGFcbiAgICAgKiBAcGFyYW0geyp9IHggVGhlIHZhbHVlIHRvIHJldHVybi5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgaW5wdXQgdmFsdWUsIGB4YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmlkZW50aXR5KDEpOyAvLz0+IDFcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG9iaiA9IHt9O1xuICAgICAqICAgICAgUi5pZGVudGl0eShvYmopID09PSBvYmo7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBpZGVudGl0eSA9IF9jdXJyeTEoX2lkZW50aXR5KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgcHJvY2VzcyBlaXRoZXIgdGhlIGBvblRydWVgIG9yIHRoZSBgb25GYWxzZWBcbiAgICAgKiBmdW5jdGlvbiBkZXBlbmRpbmcgdXBvbiB0aGUgcmVzdWx0IG9mIHRoZSBgY29uZGl0aW9uYCBwcmVkaWNhdGUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjguMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKCouLi4gLT4gQm9vbGVhbikgLT4gKCouLi4gLT4gKikgLT4gKCouLi4gLT4gKikgLT4gKCouLi4gLT4gKilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25kaXRpb24gQSBwcmVkaWNhdGUgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvblRydWUgQSBmdW5jdGlvbiB0byBpbnZva2Ugd2hlbiB0aGUgYGNvbmRpdGlvbmAgZXZhbHVhdGVzIHRvIGEgdHJ1dGh5IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uRmFsc2UgQSBmdW5jdGlvbiB0byBpbnZva2Ugd2hlbiB0aGUgYGNvbmRpdGlvbmAgZXZhbHVhdGVzIHRvIGEgZmFsc3kgdmFsdWUuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IHVuYXJ5IGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9jZXNzIGVpdGhlciB0aGUgYG9uVHJ1ZWAgb3IgdGhlIGBvbkZhbHNlYFxuICAgICAqICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBkZXBlbmRpbmcgdXBvbiB0aGUgcmVzdWx0IG9mIHRoZSBgY29uZGl0aW9uYCBwcmVkaWNhdGUuXG4gICAgICogQHNlZSBSLnVubGVzcywgUi53aGVuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGluY0NvdW50ID0gUi5pZkVsc2UoXG4gICAgICogICAgICAgIFIuaGFzKCdjb3VudCcpLFxuICAgICAqICAgICAgICBSLm92ZXIoUi5sZW5zUHJvcCgnY291bnQnKSwgUi5pbmMpLFxuICAgICAqICAgICAgICBSLmFzc29jKCdjb3VudCcsIDEpXG4gICAgICogICAgICApO1xuICAgICAqICAgICAgaW5jQ291bnQoe30pOyAgICAgICAgICAgLy89PiB7IGNvdW50OiAxIH1cbiAgICAgKiAgICAgIGluY0NvdW50KHsgY291bnQ6IDEgfSk7IC8vPT4geyBjb3VudDogMiB9XG4gICAgICovXG4gICAgdmFyIGlmRWxzZSA9IF9jdXJyeTMoZnVuY3Rpb24gaWZFbHNlKGNvbmRpdGlvbiwgb25UcnVlLCBvbkZhbHNlKSB7XG4gICAgICAgIHJldHVybiBjdXJyeU4oTWF0aC5tYXgoY29uZGl0aW9uLmxlbmd0aCwgb25UcnVlLmxlbmd0aCwgb25GYWxzZS5sZW5ndGgpLCBmdW5jdGlvbiBfaWZFbHNlKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpID8gb25UcnVlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiBvbkZhbHNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogSW5jcmVtZW50cyBpdHMgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XG4gICAgICogQHNlZSBSLmRlY1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuaW5jKDQyKTsgLy89PiA0M1xuICAgICAqL1xuICAgIHZhciBpbmMgPSBhZGQoMSk7XG5cbiAgICAvKipcbiAgICAgKiBJbnNlcnRzIHRoZSBzdXBwbGllZCBlbGVtZW50IGludG8gdGhlIGxpc3QsIGF0IGluZGV4IGBpbmRleGAuIF9Ob3RlIHRoYXRcbiAgICAgKiB0aGlzIGlzIG5vdCBkZXN0cnVjdGl2ZV86IGl0IHJldHVybnMgYSBjb3B5IG9mIHRoZSBsaXN0IHdpdGggdGhlIGNoYW5nZXMuXG4gICAgICogPHNtYWxsPk5vIGxpc3RzIGhhdmUgYmVlbiBoYXJtZWQgaW4gdGhlIGFwcGxpY2F0aW9uIG9mIHRoaXMgZnVuY3Rpb24uPC9zbWFsbD5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4yXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBhIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaW5kZXggVGhlIHBvc2l0aW9uIHRvIGluc2VydCB0aGUgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7Kn0gZWx0IFRoZSBlbGVtZW50IHRvIGluc2VydCBpbnRvIHRoZSBBcnJheVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gaW5zZXJ0IGludG9cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgQXJyYXkgd2l0aCBgZWx0YCBpbnNlcnRlZCBhdCBgaW5kZXhgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuaW5zZXJ0KDIsICd4JywgWzEsMiwzLDRdKTsgLy89PiBbMSwyLCd4JywzLDRdXG4gICAgICovXG4gICAgdmFyIGluc2VydCA9IF9jdXJyeTMoZnVuY3Rpb24gaW5zZXJ0KGlkeCwgZWx0LCBsaXN0KSB7XG4gICAgICAgIGlkeCA9IGlkeCA8IGxpc3QubGVuZ3RoICYmIGlkeCA+PSAwID8gaWR4IDogbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBfc2xpY2UobGlzdCk7XG4gICAgICAgIHJlc3VsdC5zcGxpY2UoaWR4LCAwLCBlbHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogSW5zZXJ0cyB0aGUgc3ViLWxpc3QgaW50byB0aGUgbGlzdCwgYXQgaW5kZXggYGluZGV4YC4gX05vdGUgdGhhdCB0aGlzIGlzIG5vdFxuICAgICAqIGRlc3RydWN0aXZlXzogaXQgcmV0dXJucyBhIGNvcHkgb2YgdGhlIGxpc3Qgd2l0aCB0aGUgY2hhbmdlcy5cbiAgICAgKiA8c21hbGw+Tm8gbGlzdHMgaGF2ZSBiZWVuIGhhcm1lZCBpbiB0aGUgYXBwbGljYXRpb24gb2YgdGhpcyBmdW5jdGlvbi48L3NtYWxsPlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFthXSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IFRoZSBwb3NpdGlvbiB0byBpbnNlcnQgdGhlIHN1Yi1saXN0XG4gICAgICogQHBhcmFtIHtBcnJheX0gZWx0cyBUaGUgc3ViLWxpc3QgdG8gaW5zZXJ0IGludG8gdGhlIEFycmF5XG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpbnNlcnQgdGhlIHN1Yi1saXN0IGludG9cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgQXJyYXkgd2l0aCBgZWx0c2AgaW5zZXJ0ZWQgc3RhcnRpbmcgYXQgYGluZGV4YC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmluc2VydEFsbCgyLCBbJ3gnLCd5JywneiddLCBbMSwyLDMsNF0pOyAvLz0+IFsxLDIsJ3gnLCd5JywneicsMyw0XVxuICAgICAqL1xuICAgIHZhciBpbnNlcnRBbGwgPSBfY3VycnkzKGZ1bmN0aW9uIGluc2VydEFsbChpZHgsIGVsdHMsIGxpc3QpIHtcbiAgICAgICAgaWR4ID0gaWR4IDwgbGlzdC5sZW5ndGggJiYgaWR4ID49IDAgPyBpZHggOiBsaXN0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIF9jb25jYXQoX2NvbmNhdChfc2xpY2UobGlzdCwgMCwgaWR4KSwgZWx0cyksIF9zbGljZShsaXN0LCBpZHgpKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgbGlzdCB3aXRoIHRoZSBzZXBhcmF0b3IgaW50ZXJwb3NlZCBiZXR3ZWVuIGVsZW1lbnRzLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGludGVyc3BlcnNlYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBhIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0geyp9IHNlcGFyYXRvciBUaGUgZWxlbWVudCB0byBhZGQgdG8gdGhlIGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBiZSBpbnRlcnBvc2VkLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbmV3IGxpc3QuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5pbnRlcnNwZXJzZSgnbicsIFsnYmEnLCAnYScsICdhJ10pOyAvLz0+IFsnYmEnLCAnbicsICdhJywgJ24nLCAnYSddXG4gICAgICovXG4gICAgdmFyIGludGVyc3BlcnNlID0gX2N1cnJ5MihfY2hlY2tGb3JNZXRob2QoJ2ludGVyc3BlcnNlJywgZnVuY3Rpb24gaW50ZXJzcGVyc2Uoc2VwYXJhdG9yLCBsaXN0KSB7XG4gICAgICAgIHZhciBvdXQgPSBbXTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGlkeCA9PT0gbGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGxpc3RbaWR4XSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGxpc3RbaWR4XSwgc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogU2VlIGlmIGFuIG9iamVjdCAoYHZhbGApIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBzdXBwbGllZCBjb25zdHJ1Y3Rvci4gVGhpc1xuICAgICAqIGZ1bmN0aW9uIHdpbGwgY2hlY2sgdXAgdGhlIGluaGVyaXRhbmNlIGNoYWluLCBpZiBhbnkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBUeXBlXG4gICAgICogQHNpZyAoKiAtPiB7Kn0pIC0+IGEgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjdG9yIEEgY29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0geyp9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5pcyhPYmplY3QsIHt9KTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzKE51bWJlciwgMSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pcyhPYmplY3QsIDEpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmlzKFN0cmluZywgJ3MnKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzKFN0cmluZywgbmV3IFN0cmluZygnJykpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaXMoT2JqZWN0LCBuZXcgU3RyaW5nKCcnKSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pcyhPYmplY3QsICdzJyk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuaXMoTnVtYmVyLCB7fSk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgaXMgPSBfY3VycnkyKGZ1bmN0aW9uIGlzKEN0b3IsIHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsICE9IG51bGwgJiYgdmFsLmNvbnN0cnVjdG9yID09PSBDdG9yIHx8IHZhbCBpbnN0YW5jZW9mIEN0b3I7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB3aGV0aGVyIG9yIG5vdCBhbiBvYmplY3QgaXMgc2ltaWxhciB0byBhbiBhcnJheS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNS4wXG4gICAgICogQGNhdGVnb3J5IFR5cGVcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKiAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSB4IFRoZSBvYmplY3QgdG8gdGVzdC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYHhgIGhhcyBhIG51bWVyaWMgbGVuZ3RoIHByb3BlcnR5IGFuZCBleHRyZW1lIGluZGljZXMgZGVmaW5lZDsgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5pc0FycmF5TGlrZShbXSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pc0FycmF5TGlrZSh0cnVlKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pc0FycmF5TGlrZSh7fSk7IC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuaXNBcnJheUxpa2Uoe2xlbmd0aDogMTB9KTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pc0FycmF5TGlrZSh7MDogJ3plcm8nLCA5OiAnbmluZScsIGxlbmd0aDogMTB9KTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGlzQXJyYXlMaWtlID0gX2N1cnJ5MShmdW5jdGlvbiBpc0FycmF5TGlrZSh4KSB7XG4gICAgICAgIGlmIChfaXNBcnJheSh4KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF4KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4IGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHgubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXgubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHgubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHguaGFzT3duUHJvcGVydHkoMCkgJiYgeC5oYXNPd25Qcm9wZXJ0eSh4Lmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgaW5wdXQgdmFsdWUgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgVHlwZVxuICAgICAqIEBzaWcgKiAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSB4IFRoZSB2YWx1ZSB0byB0ZXN0LlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBgeGAgaXMgYHVuZGVmaW5lZGAgb3IgYG51bGxgLCBvdGhlcndpc2UgYGZhbHNlYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmlzTmlsKG51bGwpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaXNOaWwodW5kZWZpbmVkKTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzTmlsKDApOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmlzTmlsKFtdKTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBpc05pbCA9IF9jdXJyeTEoZnVuY3Rpb24gaXNOaWwoeCkge1xuICAgICAgICByZXR1cm4geCA9PSBudWxsO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxpc3QgY29udGFpbmluZyB0aGUgbmFtZXMgb2YgYWxsIHRoZSBlbnVtZXJhYmxlIG93biBwcm9wZXJ0aWVzIG9mXG4gICAgICogdGhlIHN1cHBsaWVkIG9iamVjdC5cbiAgICAgKiBOb3RlIHRoYXQgdGhlIG9yZGVyIG9mIHRoZSBvdXRwdXQgYXJyYXkgaXMgbm90IGd1YXJhbnRlZWQgdG8gYmUgY29uc2lzdGVudFxuICAgICAqIGFjcm9zcyBkaWZmZXJlbnQgSlMgcGxhdGZvcm1zLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7azogdn0gLT4gW2tdXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGV4dHJhY3QgcHJvcGVydGllcyBmcm9tXG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIHRoZSBvYmplY3QncyBvd24gcHJvcGVydGllcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmtleXMoe2E6IDEsIGI6IDIsIGM6IDN9KTsgLy89PiBbJ2EnLCAnYicsICdjJ11cbiAgICAgKi9cbiAgICAvLyBjb3ZlciBJRSA8IDkga2V5cyBpc3N1ZXNcbiAgICAvLyBTYWZhcmkgYnVnXG4gICAgdmFyIGtleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGNvdmVyIElFIDwgOSBrZXlzIGlzc3Vlc1xuICAgICAgICB2YXIgaGFzRW51bUJ1ZyA9ICF7IHRvU3RyaW5nOiBudWxsIH0ucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyk7XG4gICAgICAgIHZhciBub25FbnVtZXJhYmxlUHJvcHMgPSBbXG4gICAgICAgICAgICAnY29uc3RydWN0b3InLFxuICAgICAgICAgICAgJ3ZhbHVlT2YnLFxuICAgICAgICAgICAgJ2lzUHJvdG90eXBlT2YnLFxuICAgICAgICAgICAgJ3RvU3RyaW5nJyxcbiAgICAgICAgICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsXG4gICAgICAgICAgICAnaGFzT3duUHJvcGVydHknLFxuICAgICAgICAgICAgJ3RvTG9jYWxlU3RyaW5nJ1xuICAgICAgICBdO1xuICAgICAgICAvLyBTYWZhcmkgYnVnXG4gICAgICAgIHZhciBoYXNBcmdzRW51bUJ1ZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMucHJvcGVydHlJc0VudW1lcmFibGUoJ2xlbmd0aCcpO1xuICAgICAgICB9KCk7XG4gICAgICAgIHZhciBjb250YWlucyA9IGZ1bmN0aW9uIGNvbnRhaW5zKGxpc3QsIGl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IGxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpc3RbaWR4XSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicgJiYgIWhhc0FyZ3NFbnVtQnVnID8gX2N1cnJ5MShmdW5jdGlvbiBrZXlzKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdChvYmopICE9PSBvYmogPyBbXSA6IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIH0pIDogX2N1cnJ5MShmdW5jdGlvbiBrZXlzKG9iaikge1xuICAgICAgICAgICAgaWYgKE9iamVjdChvYmopICE9PSBvYmopIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcHJvcCwgbklkeDtcbiAgICAgICAgICAgIHZhciBrcyA9IFtdO1xuICAgICAgICAgICAgdmFyIGNoZWNrQXJnc0xlbmd0aCA9IGhhc0FyZ3NFbnVtQnVnICYmIF9pc0FyZ3VtZW50cyhvYmopO1xuICAgICAgICAgICAgZm9yIChwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgICAgIGlmIChfaGFzKHByb3AsIG9iaikgJiYgKCFjaGVja0FyZ3NMZW5ndGggfHwgcHJvcCAhPT0gJ2xlbmd0aCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGtzW2tzLmxlbmd0aF0gPSBwcm9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoYXNFbnVtQnVnKSB7XG4gICAgICAgICAgICAgICAgbklkeCA9IG5vbkVudW1lcmFibGVQcm9wcy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIHdoaWxlIChuSWR4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcCA9IG5vbkVudW1lcmFibGVQcm9wc1tuSWR4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9oYXMocHJvcCwgb2JqKSAmJiAhY29udGFpbnMoa3MsIHByb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrc1trcy5sZW5ndGhdID0gcHJvcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuSWR4IC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGtzO1xuICAgICAgICB9KTtcbiAgICB9KCk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBjb250YWluaW5nIHRoZSBuYW1lcyBvZiBhbGwgdGhlIHByb3BlcnRpZXMgb2YgdGhlIHN1cHBsaWVkXG4gICAgICogb2JqZWN0LCBpbmNsdWRpbmcgcHJvdG90eXBlIHByb3BlcnRpZXMuXG4gICAgICogTm90ZSB0aGF0IHRoZSBvcmRlciBvZiB0aGUgb3V0cHV0IGFycmF5IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGNvbnNpc3RlbnRcbiAgICAgKiBhY3Jvc3MgZGlmZmVyZW50IEpTIHBsYXRmb3Jtcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge2s6IHZ9IC0+IFtrXVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBleHRyYWN0IHByb3BlcnRpZXMgZnJvbVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiB0aGUgb2JqZWN0J3Mgb3duIGFuZCBwcm90b3R5cGUgcHJvcGVydGllcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgRiA9IGZ1bmN0aW9uKCkgeyB0aGlzLnggPSAnWCc7IH07XG4gICAgICogICAgICBGLnByb3RvdHlwZS55ID0gJ1knO1xuICAgICAqICAgICAgdmFyIGYgPSBuZXcgRigpO1xuICAgICAqICAgICAgUi5rZXlzSW4oZik7IC8vPT4gWyd4JywgJ3knXVxuICAgICAqL1xuICAgIHZhciBrZXlzSW4gPSBfY3VycnkxKGZ1bmN0aW9uIGtleXNJbihvYmopIHtcbiAgICAgICAgdmFyIHByb3A7XG4gICAgICAgIHZhciBrcyA9IFtdO1xuICAgICAgICBmb3IgKHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICBrc1trcy5sZW5ndGhdID0gcHJvcDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga3M7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gdGhlIGFycmF5IGJ5IHJldHVybmluZyBgbGlzdC5sZW5ndGhgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4zLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbGVuZ3RoIG9mIHRoZSBhcnJheS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmxlbmd0aChbXSk7IC8vPT4gMFxuICAgICAqICAgICAgUi5sZW5ndGgoWzEsIDIsIDNdKTsgLy89PiAzXG4gICAgICovXG4gICAgdmFyIGxlbmd0aCA9IF9jdXJyeTEoZnVuY3Rpb24gbGVuZ3RoKGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIGxpc3QgIT0gbnVsbCAmJiBpcyhOdW1iZXIsIGxpc3QubGVuZ3RoKSA/IGxpc3QubGVuZ3RoIDogTmFOO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIGxlc3MgdGhhbiB0aGUgc2Vjb25kOyBgZmFsc2VgXG4gICAgICogb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBhID0+IGEgLT4gYSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSBhXG4gICAgICogQHBhcmFtIHsqfSBiXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAc2VlIFIuZ3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmx0KDIsIDEpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmx0KDIsIDIpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmx0KDIsIDMpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIubHQoJ2EnLCAneicpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIubHQoJ3onLCAnYScpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGx0ID0gX2N1cnJ5MihmdW5jdGlvbiBsdChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhIDwgYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHNlY29uZDtcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBPcmQgYSA9PiBhIC0+IGEgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGJcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5ndGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmx0ZSgyLCAxKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5sdGUoMiwgMik7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5sdGUoMiwgMyk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5sdGUoJ2EnLCAneicpOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIubHRlKCd6JywgJ2EnKTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBsdGUgPSBfY3VycnkyKGZ1bmN0aW9uIGx0ZShhLCBiKSB7XG4gICAgICAgIHJldHVybiBhIDw9IGI7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWFwQWNjdW0gZnVuY3Rpb24gYmVoYXZlcyBsaWtlIGEgY29tYmluYXRpb24gb2YgbWFwIGFuZCByZWR1Y2U7IGl0XG4gICAgICogYXBwbGllcyBhIGZ1bmN0aW9uIHRvIGVhY2ggZWxlbWVudCBvZiBhIGxpc3QsIHBhc3NpbmcgYW4gYWNjdW11bGF0aW5nXG4gICAgICogcGFyYW1ldGVyIGZyb20gbGVmdCB0byByaWdodCwgYW5kIHJldHVybmluZyBhIGZpbmFsIHZhbHVlIG9mIHRoaXNcbiAgICAgKiBhY2N1bXVsYXRvciB0b2dldGhlciB3aXRoIHRoZSBuZXcgbGlzdC5cbiAgICAgKlxuICAgICAqIFRoZSBpdGVyYXRvciBmdW5jdGlvbiByZWNlaXZlcyB0d28gYXJndW1lbnRzLCAqYWNjKiBhbmQgKnZhbHVlKiwgYW5kIHNob3VsZFxuICAgICAqIHJldHVybiBhIHR1cGxlICpbYWNjLCB2YWx1ZV0qLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMC4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhY2MgLT4geCAtPiAoYWNjLCB5KSkgLT4gYWNjIC0+IFt4XSAtPiAoYWNjLCBbeV0pXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBldmVyeSBlbGVtZW50IG9mIHRoZSBpbnB1dCBgbGlzdGAuXG4gICAgICogQHBhcmFtIHsqfSBhY2MgVGhlIGFjY3VtdWxhdG9yIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSBmaW5hbCwgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAgICogQHNlZSBSLmFkZEluZGV4XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGRpZ2l0cyA9IFsnMScsICcyJywgJzMnLCAnNCddO1xuICAgICAqICAgICAgdmFyIGFwcGVuZGVyID0gKGEsIGIpID0+IFthICsgYiwgYSArIGJdO1xuICAgICAqXG4gICAgICogICAgICBSLm1hcEFjY3VtKGFwcGVuZGVyLCAwLCBkaWdpdHMpOyAvLz0+IFsnMDEyMzQnLCBbJzAxJywgJzAxMicsICcwMTIzJywgJzAxMjM0J11dXG4gICAgICovXG4gICAgdmFyIG1hcEFjY3VtID0gX2N1cnJ5MyhmdW5jdGlvbiBtYXBBY2N1bShmbiwgYWNjLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIHR1cGxlID0gW2FjY107XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIHR1cGxlID0gZm4odHVwbGVbMF0sIGxpc3RbaWR4XSk7XG4gICAgICAgICAgICByZXN1bHRbaWR4XSA9IHR1cGxlWzFdO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHR1cGxlWzBdLFxuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgIF07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWFwQWNjdW1SaWdodCBmdW5jdGlvbiBiZWhhdmVzIGxpa2UgYSBjb21iaW5hdGlvbiBvZiBtYXAgYW5kIHJlZHVjZTsgaXRcbiAgICAgKiBhcHBsaWVzIGEgZnVuY3Rpb24gdG8gZWFjaCBlbGVtZW50IG9mIGEgbGlzdCwgcGFzc2luZyBhbiBhY2N1bXVsYXRpbmdcbiAgICAgKiBwYXJhbWV0ZXIgZnJvbSByaWdodCB0byBsZWZ0LCBhbmQgcmV0dXJuaW5nIGEgZmluYWwgdmFsdWUgb2YgdGhpc1xuICAgICAqIGFjY3VtdWxhdG9yIHRvZ2V0aGVyIHdpdGggdGhlIG5ldyBsaXN0LlxuICAgICAqXG4gICAgICogU2ltaWxhciB0byBgbWFwQWNjdW1gLCBleGNlcHQgbW92ZXMgdGhyb3VnaCB0aGUgaW5wdXQgbGlzdCBmcm9tIHRoZSByaWdodCB0b1xuICAgICAqIHRoZSBsZWZ0LlxuICAgICAqXG4gICAgICogVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIHJlY2VpdmVzIHR3byBhcmd1bWVudHMsICphY2MqIGFuZCAqdmFsdWUqLCBhbmQgc2hvdWxkXG4gICAgICogcmV0dXJuIGEgdHVwbGUgKlthY2MsIHZhbHVlXSouXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGFjYyAtPiB4IC0+IChhY2MsIHkpKSAtPiBhY2MgLT4gW3hdIC0+IChhY2MsIFt5XSlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhlIGlucHV0IGBsaXN0YC5cbiAgICAgKiBAcGFyYW0geyp9IGFjYyBUaGUgYWNjdW11bGF0b3IgdmFsdWUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGZpbmFsLCBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAc2VlIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZGlnaXRzID0gWycxJywgJzInLCAnMycsICc0J107XG4gICAgICogICAgICB2YXIgYXBwZW5kID0gKGEsIGIpID0+IFthICsgYiwgYSArIGJdO1xuICAgICAqXG4gICAgICogICAgICBSLm1hcEFjY3VtUmlnaHQoYXBwZW5kLCAwLCBkaWdpdHMpOyAvLz0+IFsnMDQzMjEnLCBbJzA0MzIxJywgJzA0MzInLCAnMDQzJywgJzA0J11dXG4gICAgICovXG4gICAgdmFyIG1hcEFjY3VtUmlnaHQgPSBfY3VycnkzKGZ1bmN0aW9uIG1hcEFjY3VtUmlnaHQoZm4sIGFjYywgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gbGlzdC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIHZhciB0dXBsZSA9IFthY2NdO1xuICAgICAgICB3aGlsZSAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIHR1cGxlID0gZm4odHVwbGVbMF0sIGxpc3RbaWR4XSk7XG4gICAgICAgICAgICByZXN1bHRbaWR4XSA9IHR1cGxlWzFdO1xuICAgICAgICAgICAgaWR4IC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHR1cGxlWzBdLFxuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgIF07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhZ2FpbnN0IGEgU3RyaW5nLiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiB3aWxsXG4gICAgICogcmV0dXJuIGFuIGVtcHR5IGFycmF5IHdoZW4gdGhlcmUgYXJlIG5vIG1hdGNoZXMuIFRoaXMgZGlmZmVycyBmcm9tXG4gICAgICogW2BTdHJpbmcucHJvdG90eXBlLm1hdGNoYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL21hdGNoKVxuICAgICAqIHdoaWNoIHJldHVybnMgYG51bGxgIHdoZW4gdGhlcmUgYXJlIG5vIG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBTdHJpbmdcbiAgICAgKiBAc2lnIFJlZ0V4cCAtPiBTdHJpbmcgLT4gW1N0cmluZyB8IFVuZGVmaW5lZF1cbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gcnggQSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIG1hdGNoIGFnYWluc3RcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGxpc3Qgb2YgbWF0Y2hlcyBvciBlbXB0eSBhcnJheS5cbiAgICAgKiBAc2VlIFIudGVzdFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubWF0Y2goLyhbYS16XWEpL2csICdiYW5hbmFzJyk7IC8vPT4gWydiYScsICduYScsICduYSddXG4gICAgICogICAgICBSLm1hdGNoKC9hLywgJ2InKTsgLy89PiBbXVxuICAgICAqICAgICAgUi5tYXRjaCgvYS8sIG51bGwpOyAvLz0+IFR5cGVFcnJvcjogbnVsbCBkb2VzIG5vdCBoYXZlIGEgbWV0aG9kIG5hbWVkIFwibWF0Y2hcIlxuICAgICAqL1xuICAgIHZhciBtYXRjaCA9IF9jdXJyeTIoZnVuY3Rpb24gbWF0Y2gocngsIHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLm1hdGNoKHJ4KSB8fCBbXTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIG1hdGhNb2QgYmVoYXZlcyBsaWtlIHRoZSBtb2R1bG8gb3BlcmF0b3Igc2hvdWxkIG1hdGhlbWF0aWNhbGx5LCB1bmxpa2UgdGhlXG4gICAgICogYCVgIG9wZXJhdG9yIChhbmQgYnkgZXh0ZW5zaW9uLCBSLm1vZHVsbykuIFNvIHdoaWxlIFwiLTE3ICUgNVwiIGlzIC0yLFxuICAgICAqIG1hdGhNb2QoLTE3LCA1KSBpcyAzLiBtYXRoTW9kIHJlcXVpcmVzIEludGVnZXIgYXJndW1lbnRzLCBhbmQgcmV0dXJucyBOYU5cbiAgICAgKiB3aGVuIHRoZSBtb2R1bHVzIGlzIHplcm8gb3IgbmVnYXRpdmUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtIFRoZSBkaXZpZGVuZC5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcCB0aGUgbW9kdWx1cy5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSByZXN1bHQgb2YgYGIgbW9kIGFgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubWF0aE1vZCgtMTcsIDUpOyAgLy89PiAzXG4gICAgICogICAgICBSLm1hdGhNb2QoMTcsIDUpOyAgIC8vPT4gMlxuICAgICAqICAgICAgUi5tYXRoTW9kKDE3LCAtNSk7ICAvLz0+IE5hTlxuICAgICAqICAgICAgUi5tYXRoTW9kKDE3LCAwKTsgICAvLz0+IE5hTlxuICAgICAqICAgICAgUi5tYXRoTW9kKDE3LjIsIDUpOyAvLz0+IE5hTlxuICAgICAqICAgICAgUi5tYXRoTW9kKDE3LCA1LjMpOyAvLz0+IE5hTlxuICAgICAqXG4gICAgICogICAgICB2YXIgY2xvY2sgPSBSLm1hdGhNb2QoUi5fXywgMTIpO1xuICAgICAqICAgICAgY2xvY2soMTUpOyAvLz0+IDNcbiAgICAgKiAgICAgIGNsb2NrKDI0KTsgLy89PiAwXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzZXZlbnRlZW5Nb2QgPSBSLm1hdGhNb2QoMTcpO1xuICAgICAqICAgICAgc2V2ZW50ZWVuTW9kKDMpOyAgLy89PiAyXG4gICAgICogICAgICBzZXZlbnRlZW5Nb2QoNCk7ICAvLz0+IDFcbiAgICAgKiAgICAgIHNldmVudGVlbk1vZCgxMCk7IC8vPT4gN1xuICAgICAqL1xuICAgIHZhciBtYXRoTW9kID0gX2N1cnJ5MihmdW5jdGlvbiBtYXRoTW9kKG0sIHApIHtcbiAgICAgICAgaWYgKCFfaXNJbnRlZ2VyKG0pKSB7XG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgICB9XG4gICAgICAgIGlmICghX2lzSW50ZWdlcihwKSB8fCBwIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIE5hTjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKG0gJSBwICsgcCkgJSBwO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbGFyZ2VyIG9mIGl0cyB0d28gYXJndW1lbnRzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBhID0+IGEgLT4gYSAtPiBhXG4gICAgICogQHBhcmFtIHsqfSBhXG4gICAgICogQHBhcmFtIHsqfSBiXG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIubWF4QnksIFIubWluXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5tYXgoNzg5LCAxMjMpOyAvLz0+IDc4OVxuICAgICAqICAgICAgUi5tYXgoJ2EnLCAnYicpOyAvLz0+ICdiJ1xuICAgICAqL1xuICAgIHZhciBtYXggPSBfY3VycnkyKGZ1bmN0aW9uIG1heChhLCBiKSB7XG4gICAgICAgIHJldHVybiBiID4gYSA/IGIgOiBhO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBmdW5jdGlvbiBhbmQgdHdvIHZhbHVlcywgYW5kIHJldHVybnMgd2hpY2hldmVyIHZhbHVlIHByb2R1Y2VzIHRoZVxuICAgICAqIGxhcmdlciByZXN1bHQgd2hlbiBwYXNzZWQgdG8gdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC44LjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBiID0+IChhIC0+IGIpIC0+IGEgLT4gYSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZlxuICAgICAqIEBwYXJhbSB7Kn0gYVxuICAgICAqIEBwYXJhbSB7Kn0gYlxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLm1heCwgUi5taW5CeVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vICBzcXVhcmUgOjogTnVtYmVyIC0+IE51bWJlclxuICAgICAqICAgICAgdmFyIHNxdWFyZSA9IG4gPT4gbiAqIG47XG4gICAgICpcbiAgICAgKiAgICAgIFIubWF4Qnkoc3F1YXJlLCAtMywgMik7IC8vPT4gLTNcbiAgICAgKlxuICAgICAqICAgICAgUi5yZWR1Y2UoUi5tYXhCeShzcXVhcmUpLCAwLCBbMywgLTUsIDQsIDEsIC0yXSk7IC8vPT4gLTVcbiAgICAgKiAgICAgIFIucmVkdWNlKFIubWF4Qnkoc3F1YXJlKSwgMCwgW10pOyAvLz0+IDBcbiAgICAgKi9cbiAgICB2YXIgbWF4QnkgPSBfY3VycnkzKGZ1bmN0aW9uIG1heEJ5KGYsIGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGYoYikgPiBmKGEpID8gYiA6IGE7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgb2JqZWN0IHdpdGggdGhlIG93biBwcm9wZXJ0aWVzIG9mIHRoZSBmaXJzdCBvYmplY3QgbWVyZ2VkIHdpdGhcbiAgICAgKiB0aGUgb3duIHByb3BlcnRpZXMgb2YgdGhlIHNlY29uZCBvYmplY3QuIElmIGEga2V5IGV4aXN0cyBpbiBib3RoIG9iamVjdHMsXG4gICAgICogdGhlIHZhbHVlIGZyb20gdGhlIHNlY29uZCBvYmplY3Qgd2lsbCBiZSB1c2VkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7azogdn0gLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICogQHNlZSBSLm1lcmdlV2l0aCwgUi5tZXJnZVdpdGhLZXlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1lcmdlKHsgJ25hbWUnOiAnZnJlZCcsICdhZ2UnOiAxMCB9LCB7ICdhZ2UnOiA0MCB9KTtcbiAgICAgKiAgICAgIC8vPT4geyAnbmFtZSc6ICdmcmVkJywgJ2FnZSc6IDQwIH1cbiAgICAgKlxuICAgICAqICAgICAgdmFyIHJlc2V0VG9EZWZhdWx0ID0gUi5tZXJnZShSLl9fLCB7eDogMH0pO1xuICAgICAqICAgICAgcmVzZXRUb0RlZmF1bHQoe3g6IDUsIHk6IDJ9KTsgLy89PiB7eDogMCwgeTogMn1cbiAgICAgKi9cbiAgICB2YXIgbWVyZ2UgPSBfY3VycnkyKGZ1bmN0aW9uIG1lcmdlKGwsIHIpIHtcbiAgICAgICAgcmV0dXJuIF9hc3NpZ24oe30sIGwsIHIpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTWVyZ2VzIGEgbGlzdCBvZiBvYmplY3RzIHRvZ2V0aGVyIGludG8gb25lIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbe2s6IHZ9XSAtPiB7azogdn1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IEFuIGFycmF5IG9mIG9iamVjdHNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgbWVyZ2VkIG9iamVjdC5cbiAgICAgKiBAc2VlIFIucmVkdWNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5tZXJnZUFsbChbe2ZvbzoxfSx7YmFyOjJ9LHtiYXo6M31dKTsgLy89PiB7Zm9vOjEsYmFyOjIsYmF6OjN9XG4gICAgICogICAgICBSLm1lcmdlQWxsKFt7Zm9vOjF9LHtmb286Mn0se2JhcjoyfV0pOyAvLz0+IHtmb286MixiYXI6Mn1cbiAgICAgKi9cbiAgICB2YXIgbWVyZ2VBbGwgPSBfY3VycnkxKGZ1bmN0aW9uIG1lcmdlQWxsKGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIF9hc3NpZ24uYXBwbHkobnVsbCwgW3t9XS5jb25jYXQobGlzdCkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBvYmplY3Qgd2l0aCB0aGUgb3duIHByb3BlcnRpZXMgb2YgdGhlIHR3byBwcm92aWRlZCBvYmplY3RzLiBJZlxuICAgICAqIGEga2V5IGV4aXN0cyBpbiBib3RoIG9iamVjdHMsIHRoZSBwcm92aWRlZCBmdW5jdGlvbiBpcyBhcHBsaWVkIHRvIHRoZSBrZXlcbiAgICAgKiBhbmQgdGhlIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGtleSBpbiBlYWNoIG9iamVjdCwgd2l0aCB0aGUgcmVzdWx0IGJlaW5nXG4gICAgICogdXNlZCBhcyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBrZXkgaW4gdGhlIHJldHVybmVkIG9iamVjdC4gVGhlIGtleVxuICAgICAqIHdpbGwgYmUgZXhjbHVkZWQgZnJvbSB0aGUgcmV0dXJuZWQgb2JqZWN0IGlmIHRoZSByZXN1bHRpbmcgdmFsdWUgaXNcbiAgICAgKiBgdW5kZWZpbmVkYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIChTdHJpbmcgLT4gYSAtPiBhIC0+IGEpIC0+IHthfSAtPiB7YX0gLT4ge2F9XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByXG4gICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAqIEBzZWUgUi5tZXJnZSwgUi5tZXJnZVdpdGhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBsZXQgY29uY2F0VmFsdWVzID0gKGssIGwsIHIpID0+IGsgPT0gJ3ZhbHVlcycgPyBSLmNvbmNhdChsLCByKSA6IHJcbiAgICAgKiAgICAgIFIubWVyZ2VXaXRoS2V5KGNvbmNhdFZhbHVlcyxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgIHsgYTogdHJ1ZSwgdGhpbmc6ICdmb28nLCB2YWx1ZXM6IFsxMCwgMjBdIH0sXG4gICAgICogICAgICAgICAgICAgICAgICAgICB7IGI6IHRydWUsIHRoaW5nOiAnYmFyJywgdmFsdWVzOiBbMTUsIDM1XSB9KTtcbiAgICAgKiAgICAgIC8vPT4geyBhOiB0cnVlLCBiOiB0cnVlLCB0aGluZzogJ2JhcicsIHZhbHVlczogWzEwLCAyMCwgMTUsIDM1XSB9XG4gICAgICovXG4gICAgdmFyIG1lcmdlV2l0aEtleSA9IF9jdXJyeTMoZnVuY3Rpb24gbWVyZ2VXaXRoS2V5KGZuLCBsLCByKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgdmFyIGs7XG4gICAgICAgIGZvciAoayBpbiBsKSB7XG4gICAgICAgICAgICBpZiAoX2hhcyhrLCBsKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtrXSA9IF9oYXMoaywgcikgPyBmbihrLCBsW2tdLCByW2tdKSA6IGxba107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChrIGluIHIpIHtcbiAgICAgICAgICAgIGlmIChfaGFzKGssIHIpICYmICFfaGFzKGssIHJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRba10gPSByW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzbWFsbGVyIG9mIGl0cyB0d28gYXJndW1lbnRzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIE9yZCBhID0+IGEgLT4gYSAtPiBhXG4gICAgICogQHBhcmFtIHsqfSBhXG4gICAgICogQHBhcmFtIHsqfSBiXG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIubWluQnksIFIubWF4XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5taW4oNzg5LCAxMjMpOyAvLz0+IDEyM1xuICAgICAqICAgICAgUi5taW4oJ2EnLCAnYicpOyAvLz0+ICdhJ1xuICAgICAqL1xuICAgIHZhciBtaW4gPSBfY3VycnkyKGZ1bmN0aW9uIG1pbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBiIDwgYSA/IGIgOiBhO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBmdW5jdGlvbiBhbmQgdHdvIHZhbHVlcywgYW5kIHJldHVybnMgd2hpY2hldmVyIHZhbHVlIHByb2R1Y2VzIHRoZVxuICAgICAqIHNtYWxsZXIgcmVzdWx0IHdoZW4gcGFzc2VkIHRvIHRoZSBwcm92aWRlZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOC4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBPcmQgYiA9PiAoYSAtPiBiKSAtPiBhIC0+IGEgLT4gYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZcbiAgICAgKiBAcGFyYW0geyp9IGFcbiAgICAgKiBAcGFyYW0geyp9IGJcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5taW4sIFIubWF4QnlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICAvLyAgc3F1YXJlIDo6IE51bWJlciAtPiBOdW1iZXJcbiAgICAgKiAgICAgIHZhciBzcXVhcmUgPSBuID0+IG4gKiBuO1xuICAgICAqXG4gICAgICogICAgICBSLm1pbkJ5KHNxdWFyZSwgLTMsIDIpOyAvLz0+IDJcbiAgICAgKlxuICAgICAqICAgICAgUi5yZWR1Y2UoUi5taW5CeShzcXVhcmUpLCBJbmZpbml0eSwgWzMsIC01LCA0LCAxLCAtMl0pOyAvLz0+IDFcbiAgICAgKiAgICAgIFIucmVkdWNlKFIubWluQnkoc3F1YXJlKSwgSW5maW5pdHksIFtdKTsgLy89PiBJbmZpbml0eVxuICAgICAqL1xuICAgIHZhciBtaW5CeSA9IF9jdXJyeTMoZnVuY3Rpb24gbWluQnkoZiwgYSwgYikge1xuICAgICAgICByZXR1cm4gZihiKSA8IGYoYSkgPyBiIDogYTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIERpdmlkZXMgdGhlIHNlY29uZCBwYXJhbWV0ZXIgYnkgdGhlIGZpcnN0IGFuZCByZXR1cm5zIHRoZSByZW1haW5kZXIuIE5vdGVcbiAgICAgKiB0aGF0IHRoaXMgZnVuY3Rpb24gcHJlc2VydmVzIHRoZSBKYXZhU2NyaXB0LXN0eWxlIGJlaGF2aW9yIGZvciBtb2R1bG8uIEZvclxuICAgICAqIG1hdGhlbWF0aWNhbCBtb2R1bG8gc2VlIGBtYXRoTW9kYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4xXG4gICAgICogQGNhdGVnb3J5IE1hdGhcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGEgVGhlIHZhbHVlIHRvIHRoZSBkaXZpZGUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGIgVGhlIHBzZXVkby1tb2R1bHVzXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgcmVzdWx0IG9mIGBiICUgYWAuXG4gICAgICogQHNlZSBSLm1hdGhNb2RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1vZHVsbygxNywgMyk7IC8vPT4gMlxuICAgICAqICAgICAgLy8gSlMgYmVoYXZpb3I6XG4gICAgICogICAgICBSLm1vZHVsbygtMTcsIDMpOyAvLz0+IC0yXG4gICAgICogICAgICBSLm1vZHVsbygxNywgLTMpOyAvLz0+IDJcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGlzT2RkID0gUi5tb2R1bG8oUi5fXywgMik7XG4gICAgICogICAgICBpc09kZCg0Mik7IC8vPT4gMFxuICAgICAqICAgICAgaXNPZGQoMjEpOyAvLz0+IDFcbiAgICAgKi9cbiAgICB2YXIgbW9kdWxvID0gX2N1cnJ5MihmdW5jdGlvbiBtb2R1bG8oYSwgYikge1xuICAgICAgICByZXR1cm4gYSAlIGI7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBNdWx0aXBsaWVzIHR3byBudW1iZXJzLiBFcXVpdmFsZW50IHRvIGBhICogYmAgYnV0IGN1cnJpZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBhIFRoZSBmaXJzdCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYiBUaGUgc2Vjb25kIHZhbHVlLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIHJlc3VsdCBvZiBgYSAqIGJgLlxuICAgICAqIEBzZWUgUi5kaXZpZGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZG91YmxlID0gUi5tdWx0aXBseSgyKTtcbiAgICAgKiAgICAgIHZhciB0cmlwbGUgPSBSLm11bHRpcGx5KDMpO1xuICAgICAqICAgICAgZG91YmxlKDMpOyAgICAgICAvLz0+ICA2XG4gICAgICogICAgICB0cmlwbGUoNCk7ICAgICAgIC8vPT4gMTJcbiAgICAgKiAgICAgIFIubXVsdGlwbHkoMiwgNSk7ICAvLz0+IDEwXG4gICAgICovXG4gICAgdmFyIG11bHRpcGx5ID0gX2N1cnJ5MihmdW5jdGlvbiBtdWx0aXBseShhLCBiKSB7XG4gICAgICAgIHJldHVybiBhICogYjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFdyYXBzIGEgZnVuY3Rpb24gb2YgYW55IGFyaXR5IChpbmNsdWRpbmcgbnVsbGFyeSkgaW4gYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHNcbiAgICAgKiBleGFjdGx5IGBuYCBwYXJhbWV0ZXJzLiBBbnkgZXh0cmFuZW91cyBwYXJhbWV0ZXJzIHdpbGwgbm90IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgKiBzdXBwbGllZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBOdW1iZXIgLT4gKCogLT4gYSkgLT4gKCogLT4gYSlcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiBUaGUgZGVzaXJlZCBhcml0eSBvZiB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB3cmFwcGluZyBgZm5gLiBUaGUgbmV3IGZ1bmN0aW9uIGlzIGd1YXJhbnRlZWQgdG8gYmUgb2ZcbiAgICAgKiAgICAgICAgIGFyaXR5IGBuYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgdGFrZXNUd29BcmdzID0gKGEsIGIpID0+IFthLCBiXTtcbiAgICAgKlxuICAgICAqICAgICAgdGFrZXNUd29BcmdzLmxlbmd0aDsgLy89PiAyXG4gICAgICogICAgICB0YWtlc1R3b0FyZ3MoMSwgMik7IC8vPT4gWzEsIDJdXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB0YWtlc09uZUFyZyA9IFIubkFyeSgxLCB0YWtlc1R3b0FyZ3MpO1xuICAgICAqICAgICAgdGFrZXNPbmVBcmcubGVuZ3RoOyAvLz0+IDFcbiAgICAgKiAgICAgIC8vIE9ubHkgYG5gIGFyZ3VtZW50cyBhcmUgcGFzc2VkIHRvIHRoZSB3cmFwcGVkIGZ1bmN0aW9uXG4gICAgICogICAgICB0YWtlc09uZUFyZygxLCAyKTsgLy89PiBbMSwgdW5kZWZpbmVkXVxuICAgICAqL1xuICAgIHZhciBuQXJ5ID0gX2N1cnJ5MihmdW5jdGlvbiBuQXJ5KG4sIGZuKSB7XG4gICAgICAgIHN3aXRjaCAobikge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGEwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGEwLCBhMSwgYTIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGEwLCBhMSwgYTIsIGEzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExLCBhMiwgYTMsIGE0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3LCBhOCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNywgYTgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3LCBhOCwgYTkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcsIGE4LCBhOSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byBuQXJ5IG11c3QgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlciBubyBncmVhdGVyIHRoYW4gdGVuJyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE5lZ2F0ZXMgaXRzIGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgTWF0aFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IE51bWJlclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAgICogQHJldHVybiB7TnVtYmVyfVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubmVnYXRlKDQyKTsgLy89PiAtNDJcbiAgICAgKi9cbiAgICB2YXIgbmVnYXRlID0gX2N1cnJ5MShmdW5jdGlvbiBuZWdhdGUobikge1xuICAgICAgICByZXR1cm4gLW47XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBubyBlbGVtZW50cyBvZiB0aGUgbGlzdCBtYXRjaCB0aGUgcHJlZGljYXRlLCBgZmFsc2VgXG4gICAgICogb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGFueWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgcHJlZGljYXRlIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgcHJlZGljYXRlIGlzIG5vdCBzYXRpc2ZpZWQgYnkgZXZlcnkgZWxlbWVudCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICogQHNlZSBSLmFsbCwgUi5hbnlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNFdmVuID0gbiA9PiBuICUgMiA9PT0gMDtcbiAgICAgKlxuICAgICAqICAgICAgUi5ub25lKGlzRXZlbiwgWzEsIDMsIDUsIDcsIDksIDExXSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5ub25lKGlzRXZlbiwgWzEsIDMsIDUsIDcsIDgsIDExXSk7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgbm9uZSA9IF9jdXJyeTIoX2NvbXBsZW1lbnQoX2Rpc3BhdGNoYWJsZSgnYW55JywgX3hhbnksIGFueSkpKTtcblxuICAgIC8qKlxuICAgICAqIEEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBgIWAgb2YgaXRzIGFyZ3VtZW50LiBJdCB3aWxsIHJldHVybiBgdHJ1ZWAgd2hlblxuICAgICAqIHBhc3NlZCBmYWxzZS15IHZhbHVlLCBhbmQgYGZhbHNlYCB3aGVuIHBhc3NlZCBhIHRydXRoLXkgb25lLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnICogLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7Kn0gYSBhbnkgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0aGUgbG9naWNhbCBpbnZlcnNlIG9mIHBhc3NlZCBhcmd1bWVudC5cbiAgICAgKiBAc2VlIFIuY29tcGxlbWVudFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubm90KHRydWUpOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLm5vdChmYWxzZSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5ub3QoMCk7ID0+IHRydWVcbiAgICAgKiAgICAgIFIubm90KDEpOyA9PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBub3QgPSBfY3VycnkxKGZ1bmN0aW9uIG5vdChhKSB7XG4gICAgICAgIHJldHVybiAhYTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG50aCBlbGVtZW50IG9mIHRoZSBnaXZlbiBsaXN0IG9yIHN0cmluZy4gSWYgbiBpcyBuZWdhdGl2ZSB0aGVcbiAgICAgKiBlbGVtZW50IGF0IGluZGV4IGxlbmd0aCArIG4gaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IGEgfCBVbmRlZmluZWRcbiAgICAgKiBAc2lnIE51bWJlciAtPiBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldFxuICAgICAqIEBwYXJhbSB7Kn0gbGlzdFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGxpc3QgPSBbJ2ZvbycsICdiYXInLCAnYmF6JywgJ3F1dXgnXTtcbiAgICAgKiAgICAgIFIubnRoKDEsIGxpc3QpOyAvLz0+ICdiYXInXG4gICAgICogICAgICBSLm50aCgtMSwgbGlzdCk7IC8vPT4gJ3F1dXgnXG4gICAgICogICAgICBSLm50aCgtOTksIGxpc3QpOyAvLz0+IHVuZGVmaW5lZFxuICAgICAqXG4gICAgICogICAgICBSLm50aCgyLCAnYWJjJyk7IC8vPT4gJ2MnXG4gICAgICogICAgICBSLm50aCgzLCAnYWJjJyk7IC8vPT4gJydcbiAgICAgKi9cbiAgICB2YXIgbnRoID0gX2N1cnJ5MihmdW5jdGlvbiBudGgob2Zmc2V0LCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSBvZmZzZXQgPCAwID8gbGlzdC5sZW5ndGggKyBvZmZzZXQgOiBvZmZzZXQ7XG4gICAgICAgIHJldHVybiBfaXNTdHJpbmcobGlzdCkgPyBsaXN0LmNoYXJBdChpZHgpIDogbGlzdFtpZHhdO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgaXRzIG50aCBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBOdW1iZXIgLT4gKi4uLiAtPiAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm50aEFyZygxKSgnYScsICdiJywgJ2MnKTsgLy89PiAnYidcbiAgICAgKiAgICAgIFIubnRoQXJnKC0xKSgnYScsICdiJywgJ2MnKTsgLy89PiAnYydcbiAgICAgKi9cbiAgICB2YXIgbnRoQXJnID0gX2N1cnJ5MShmdW5jdGlvbiBudGhBcmcobikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG50aChuLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBvYmplY3QgY29udGFpbmluZyBhIHNpbmdsZSBrZXk6dmFsdWUgcGFpci5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTguMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIFN0cmluZyAtPiBhIC0+IHtTdHJpbmc6YX1cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gICAgICogQHBhcmFtIHsqfSB2YWxcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICogQHNlZSBSLnBhaXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbWF0Y2hQaHJhc2VzID0gUi5jb21wb3NlKFxuICAgICAqICAgICAgICBSLm9iak9mKCdtdXN0JyksXG4gICAgICogICAgICAgIFIubWFwKFIub2JqT2YoJ21hdGNoX3BocmFzZScpKVxuICAgICAqICAgICAgKTtcbiAgICAgKiAgICAgIG1hdGNoUGhyYXNlcyhbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IHttdXN0OiBbe21hdGNoX3BocmFzZTogJ2Zvbyd9LCB7bWF0Y2hfcGhyYXNlOiAnYmFyJ30sIHttYXRjaF9waHJhc2U6ICdiYXonfV19XG4gICAgICovXG4gICAgdmFyIG9iak9mID0gX2N1cnJ5MihmdW5jdGlvbiBvYmpPZihrZXksIHZhbCkge1xuICAgICAgICB2YXIgb2JqID0ge307XG4gICAgICAgIG9ialtrZXldID0gdmFsO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHNpbmdsZXRvbiBhcnJheSBjb250YWluaW5nIHRoZSB2YWx1ZSBwcm92aWRlZC5cbiAgICAgKlxuICAgICAqIE5vdGUgdGhpcyBgb2ZgIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBFUzYgYG9mYDsgU2VlXG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvb2ZcbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBhIC0+IFthXVxuICAgICAqIEBwYXJhbSB7Kn0geCBhbnkgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgd3JhcHBpbmcgYHhgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIub2YobnVsbCk7IC8vPT4gW251bGxdXG4gICAgICogICAgICBSLm9mKFs0Ml0pOyAvLz0+IFtbNDJdXVxuICAgICAqL1xuICAgIHZhciBvZiA9IF9jdXJyeTEoX29mKTtcblxuICAgIC8qKlxuICAgICAqIEFjY2VwdHMgYSBmdW5jdGlvbiBgZm5gIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBndWFyZHMgaW52b2NhdGlvbiBvZlxuICAgICAqIGBmbmAgc3VjaCB0aGF0IGBmbmAgY2FuIG9ubHkgZXZlciBiZSBjYWxsZWQgb25jZSwgbm8gbWF0dGVyIGhvdyBtYW55IHRpbWVzXG4gICAgICogdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGludm9rZWQuIFRoZSBmaXJzdCB2YWx1ZSBjYWxjdWxhdGVkIGlzIHJldHVybmVkIGluXG4gICAgICogc3Vic2VxdWVudCBpbnZvY2F0aW9ucy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoYS4uLiAtPiBiKSAtPiAoYS4uLiAtPiBiKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB3cmFwIGluIGEgY2FsbC1vbmx5LW9uY2Ugd3JhcHBlci5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHdyYXBwZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGFkZE9uZU9uY2UgPSBSLm9uY2UoeCA9PiB4ICsgMSk7XG4gICAgICogICAgICBhZGRPbmVPbmNlKDEwKTsgLy89PiAxMVxuICAgICAqICAgICAgYWRkT25lT25jZShhZGRPbmVPbmNlKDUwKSk7IC8vPT4gMTFcbiAgICAgKi9cbiAgICB2YXIgb25jZSA9IF9jdXJyeTEoZnVuY3Rpb24gb25jZShmbikge1xuICAgICAgICB2YXIgY2FsbGVkID0gZmFsc2U7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHJldHVybiBfYXJpdHkoZm4ubGVuZ3RoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICByZXN1bHQgPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBvbmUgb3IgYm90aCBvZiBpdHMgYXJndW1lbnRzIGFyZSBgdHJ1ZWAuIFJldHVybnMgYGZhbHNlYFxuICAgICAqIGlmIGJvdGggYXJndW1lbnRzIGFyZSBgZmFsc2VgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnICogLT4gKiAtPiAqXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBhIEEgYm9vbGVhbiB2YWx1ZVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gYiBBIGJvb2xlYW4gdmFsdWVcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgb25lIG9yIGJvdGggYXJndW1lbnRzIGFyZSBgdHJ1ZWAsIGBmYWxzZWAgb3RoZXJ3aXNlXG4gICAgICogQHNlZSBSLmVpdGhlclxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIub3IodHJ1ZSwgdHJ1ZSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5vcih0cnVlLCBmYWxzZSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5vcihmYWxzZSwgdHJ1ZSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5vcihmYWxzZSwgZmFsc2UpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIG9yID0gX2N1cnJ5MihmdW5jdGlvbiBvcihhLCBiKSB7XG4gICAgICAgIHJldHVybiBhIHx8IGI7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByZXN1bHQgb2YgXCJzZXR0aW5nXCIgdGhlIHBvcnRpb24gb2YgdGhlIGdpdmVuIGRhdGEgc3RydWN0dXJlXG4gICAgICogZm9jdXNlZCBieSB0aGUgZ2l2ZW4gbGVucyB0byB0aGUgcmVzdWx0IG9mIGFwcGx5aW5nIHRoZSBnaXZlbiBmdW5jdGlvbiB0b1xuICAgICAqIHRoZSBmb2N1c2VkIHZhbHVlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEB0eXBlZGVmbiBMZW5zIHMgYSA9IEZ1bmN0b3IgZiA9PiAoYSAtPiBmIGEpIC0+IHMgLT4gZiBzXG4gICAgICogQHNpZyBMZW5zIHMgYSAtPiAoYSAtPiBhKSAtPiBzIC0+IHNcbiAgICAgKiBAcGFyYW0ge0xlbnN9IGxlbnNcbiAgICAgKiBAcGFyYW0geyp9IHZcbiAgICAgKiBAcGFyYW0geyp9IHhcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5wcm9wLCBSLmxlbnNJbmRleCwgUi5sZW5zUHJvcFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBoZWFkTGVucyA9IFIubGVuc0luZGV4KDApO1xuICAgICAqXG4gICAgICogICAgICBSLm92ZXIoaGVhZExlbnMsIFIudG9VcHBlciwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ0ZPTycsICdiYXInLCAnYmF6J11cbiAgICAgKi9cbiAgICAvLyBgSWRlbnRpdHlgIGlzIGEgZnVuY3RvciB0aGF0IGhvbGRzIGEgc2luZ2xlIHZhbHVlLCB3aGVyZSBgbWFwYCBzaW1wbHlcbiAgICAvLyB0cmFuc2Zvcm1zIHRoZSBoZWxkIHZhbHVlIHdpdGggdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICAgIC8vIFRoZSB2YWx1ZSByZXR1cm5lZCBieSB0aGUgZ2V0dGVyIGZ1bmN0aW9uIGlzIGZpcnN0IHRyYW5zZm9ybWVkIHdpdGggYGZgLFxuICAgIC8vIHRoZW4gc2V0IGFzIHRoZSB2YWx1ZSBvZiBhbiBgSWRlbnRpdHlgLiBUaGlzIGlzIHRoZW4gbWFwcGVkIG92ZXIgd2l0aCB0aGVcbiAgICAvLyBzZXR0ZXIgZnVuY3Rpb24gb2YgdGhlIGxlbnMuXG4gICAgdmFyIG92ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGBJZGVudGl0eWAgaXMgYSBmdW5jdG9yIHRoYXQgaG9sZHMgYSBzaW5nbGUgdmFsdWUsIHdoZXJlIGBtYXBgIHNpbXBseVxuICAgICAgICAvLyB0cmFuc2Zvcm1zIHRoZSBoZWxkIHZhbHVlIHdpdGggdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICAgICAgICB2YXIgSWRlbnRpdHkgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogeCxcbiAgICAgICAgICAgICAgICBtYXA6IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBJZGVudGl0eShmKHgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MyhmdW5jdGlvbiBvdmVyKGxlbnMsIGYsIHgpIHtcbiAgICAgICAgICAgIC8vIFRoZSB2YWx1ZSByZXR1cm5lZCBieSB0aGUgZ2V0dGVyIGZ1bmN0aW9uIGlzIGZpcnN0IHRyYW5zZm9ybWVkIHdpdGggYGZgLFxuICAgICAgICAgICAgLy8gdGhlbiBzZXQgYXMgdGhlIHZhbHVlIG9mIGFuIGBJZGVudGl0eWAuIFRoaXMgaXMgdGhlbiBtYXBwZWQgb3ZlciB3aXRoIHRoZVxuICAgICAgICAgICAgLy8gc2V0dGVyIGZ1bmN0aW9uIG9mIHRoZSBsZW5zLlxuICAgICAgICAgICAgcmV0dXJuIGxlbnMoZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSWRlbnRpdHkoZih5KSk7XG4gICAgICAgICAgICB9KSh4KS52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgdHdvIGFyZ3VtZW50cywgYGZzdGAgYW5kIGBzbmRgLCBhbmQgcmV0dXJucyBgW2ZzdCwgc25kXWAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE4LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgYSAtPiBiIC0+IChhLGIpXG4gICAgICogQHBhcmFtIHsqfSBmc3RcbiAgICAgKiBAcGFyYW0geyp9IHNuZFxuICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAqIEBzZWUgUi5vYmpPZiwgUi5vZlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucGFpcignZm9vJywgJ2JhcicpOyAvLz0+IFsnZm9vJywgJ2JhciddXG4gICAgICovXG4gICAgdmFyIHBhaXIgPSBfY3VycnkyKGZ1bmN0aW9uIHBhaXIoZnN0LCBzbmQpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGZzdCxcbiAgICAgICAgICAgIHNuZFxuICAgICAgICBdO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmUgdGhlIHZhbHVlIGF0IGEgZ2l2ZW4gcGF0aC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgW1N0cmluZ10gLT4ge2s6IHZ9IC0+IHYgfCBVbmRlZmluZWRcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXRoIFRoZSBwYXRoIHRvIHVzZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcmV0cmlldmUgdGhlIG5lc3RlZCBwcm9wZXJ0eSBmcm9tLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSBkYXRhIGF0IGBwYXRoYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnBhdGgoWydhJywgJ2InXSwge2E6IHtiOiAyfX0pOyAvLz0+IDJcbiAgICAgKiAgICAgIFIucGF0aChbJ2EnLCAnYiddLCB7Yzoge2I6IDJ9fSk7IC8vPT4gdW5kZWZpbmVkXG4gICAgICovXG4gICAgdmFyIHBhdGggPSBfY3VycnkyKGZ1bmN0aW9uIHBhdGgocGF0aHMsIG9iaikge1xuICAgICAgICB2YXIgdmFsID0gb2JqO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IHBhdGhzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsID0gdmFsW3BhdGhzW2lkeF1dO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIElmIHRoZSBnaXZlbiwgbm9uLW51bGwgb2JqZWN0IGhhcyBhIHZhbHVlIGF0IHRoZSBnaXZlbiBwYXRoLCByZXR1cm5zIHRoZVxuICAgICAqIHZhbHVlIGF0IHRoYXQgcGF0aC4gT3RoZXJ3aXNlIHJldHVybnMgdGhlIHByb3ZpZGVkIGRlZmF1bHQgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE4LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBhIC0+IFtTdHJpbmddIC0+IE9iamVjdCAtPiBhXG4gICAgICogQHBhcmFtIHsqfSBkIFRoZSBkZWZhdWx0IHZhbHVlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHAgVGhlIHBhdGggdG8gdXNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byByZXRyaWV2ZSB0aGUgbmVzdGVkIHByb3BlcnR5IGZyb20uXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGRhdGEgYXQgYHBhdGhgIG9mIHRoZSBzdXBwbGllZCBvYmplY3Qgb3IgdGhlIGRlZmF1bHQgdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wYXRoT3IoJ04vQScsIFsnYScsICdiJ10sIHthOiB7YjogMn19KTsgLy89PiAyXG4gICAgICogICAgICBSLnBhdGhPcignTi9BJywgWydhJywgJ2InXSwge2M6IHtiOiAyfX0pOyAvLz0+IFwiTi9BXCJcbiAgICAgKi9cbiAgICB2YXIgcGF0aE9yID0gX2N1cnJ5MyhmdW5jdGlvbiBwYXRoT3IoZCwgcCwgb2JqKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VG8oZCwgcGF0aChwLCBvYmopKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBzcGVjaWZpZWQgb2JqZWN0IHByb3BlcnR5IGF0IGdpdmVuIHBhdGggc2F0aXNmaWVzIHRoZVxuICAgICAqIGdpdmVuIHByZWRpY2F0ZTsgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFtTdHJpbmddIC0+IE9iamVjdCAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BQYXRoXG4gICAgICogQHBhcmFtIHsqfSBvYmpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5wcm9wU2F0aXNmaWVzLCBSLnBhdGhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnBhdGhTYXRpc2ZpZXMoeSA9PiB5ID4gMCwgWyd4JywgJ3knXSwge3g6IHt5OiAyfX0pOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgcGF0aFNhdGlzZmllcyA9IF9jdXJyeTMoZnVuY3Rpb24gcGF0aFNhdGlzZmllcyhwcmVkLCBwcm9wUGF0aCwgb2JqKSB7XG4gICAgICAgIHJldHVybiBwcm9wUGF0aC5sZW5ndGggPiAwICYmIHByZWQocGF0aChwcm9wUGF0aCwgb2JqKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgcGFydGlhbCBjb3B5IG9mIGFuIG9iamVjdCBjb250YWluaW5nIG9ubHkgdGhlIGtleXMgc3BlY2lmaWVkLiBJZlxuICAgICAqIHRoZSBrZXkgZG9lcyBub3QgZXhpc3QsIHRoZSBwcm9wZXJ0eSBpcyBpZ25vcmVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBba10gLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IG5hbWVzIGFuIGFycmF5IG9mIFN0cmluZyBwcm9wZXJ0eSBuYW1lcyB0byBjb3B5IG9udG8gYSBuZXcgb2JqZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGNvcHkgZnJvbVxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQSBuZXcgb2JqZWN0IHdpdGggb25seSBwcm9wZXJ0aWVzIGZyb20gYG5hbWVzYCBvbiBpdC5cbiAgICAgKiBAc2VlIFIub21pdCwgUi5wcm9wc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucGljayhbJ2EnLCAnZCddLCB7YTogMSwgYjogMiwgYzogMywgZDogNH0pOyAvLz0+IHthOiAxLCBkOiA0fVxuICAgICAqICAgICAgUi5waWNrKFsnYScsICdlJywgJ2YnXSwge2E6IDEsIGI6IDIsIGM6IDMsIGQ6IDR9KTsgLy89PiB7YTogMX1cbiAgICAgKi9cbiAgICB2YXIgcGljayA9IF9jdXJyeTIoZnVuY3Rpb24gcGljayhuYW1lcywgb2JqKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChuYW1lc1tpZHhdIGluIG9iaikge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtuYW1lc1tpZHhdXSA9IG9ialtuYW1lc1tpZHhdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBTaW1pbGFyIHRvIGBwaWNrYCBleGNlcHQgdGhhdCB0aGlzIG9uZSBpbmNsdWRlcyBhIGBrZXk6IHVuZGVmaW5lZGAgcGFpciBmb3JcbiAgICAgKiBwcm9wZXJ0aWVzIHRoYXQgZG9uJ3QgZXhpc3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIFtrXSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gICAgICogQHBhcmFtIHtBcnJheX0gbmFtZXMgYW4gYXJyYXkgb2YgU3RyaW5nIHByb3BlcnR5IG5hbWVzIHRvIGNvcHkgb250byBhIG5ldyBvYmplY3RcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gY29weSBmcm9tXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBBIG5ldyBvYmplY3Qgd2l0aCBvbmx5IHByb3BlcnRpZXMgZnJvbSBgbmFtZXNgIG9uIGl0LlxuICAgICAqIEBzZWUgUi5waWNrXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5waWNrQWxsKFsnYScsICdkJ10sIHthOiAxLCBiOiAyLCBjOiAzLCBkOiA0fSk7IC8vPT4ge2E6IDEsIGQ6IDR9XG4gICAgICogICAgICBSLnBpY2tBbGwoWydhJywgJ2UnLCAnZiddLCB7YTogMSwgYjogMiwgYzogMywgZDogNH0pOyAvLz0+IHthOiAxLCBlOiB1bmRlZmluZWQsIGY6IHVuZGVmaW5lZH1cbiAgICAgKi9cbiAgICB2YXIgcGlja0FsbCA9IF9jdXJyeTIoZnVuY3Rpb24gcGlja0FsbChuYW1lcywgb2JqKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaWR4XTtcbiAgICAgICAgICAgIHJlc3VsdFtuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgcGFydGlhbCBjb3B5IG9mIGFuIG9iamVjdCBjb250YWluaW5nIG9ubHkgdGhlIGtleXMgdGhhdCBzYXRpc2Z5XG4gICAgICogdGhlIHN1cHBsaWVkIHByZWRpY2F0ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgKHYsIGsgLT4gQm9vbGVhbikgLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgQSBwcmVkaWNhdGUgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IGEga2V5XG4gICAgICogICAgICAgIHNob3VsZCBiZSBpbmNsdWRlZCBvbiB0aGUgb3V0cHV0IG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gY29weSBmcm9tXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBBIG5ldyBvYmplY3Qgd2l0aCBvbmx5IHByb3BlcnRpZXMgdGhhdCBzYXRpc2Z5IGBwcmVkYFxuICAgICAqICAgICAgICAgb24gaXQuXG4gICAgICogQHNlZSBSLnBpY2ssIFIuZmlsdGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGlzVXBwZXJDYXNlID0gKHZhbCwga2V5KSA9PiBrZXkudG9VcHBlckNhc2UoKSA9PT0ga2V5O1xuICAgICAqICAgICAgUi5waWNrQnkoaXNVcHBlckNhc2UsIHthOiAxLCBiOiAyLCBBOiAzLCBCOiA0fSk7IC8vPT4ge0E6IDMsIEI6IDR9XG4gICAgICovXG4gICAgdmFyIHBpY2tCeSA9IF9jdXJyeTIoZnVuY3Rpb24gcGlja0J5KHRlc3QsIG9iaikge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAodGVzdChvYmpbcHJvcF0sIHByb3AsIG9iaikpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCB3aXRoIHRoZSBnaXZlbiBlbGVtZW50IGF0IHRoZSBmcm9udCwgZm9sbG93ZWQgYnkgdGhlXG4gICAgICogY29udGVudHMgb2YgdGhlIGxpc3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBhIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0geyp9IGVsIFRoZSBpdGVtIHRvIGFkZCB0byB0aGUgaGVhZCBvZiB0aGUgb3V0cHV0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gYWRkIHRvIHRoZSB0YWlsIG9mIHRoZSBvdXRwdXQgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgYXJyYXkuXG4gICAgICogQHNlZSBSLmFwcGVuZFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucHJlcGVuZCgnZmVlJywgWydmaScsICdmbycsICdmdW0nXSk7IC8vPT4gWydmZWUnLCAnZmknLCAnZm8nLCAnZnVtJ11cbiAgICAgKi9cbiAgICB2YXIgcHJlcGVuZCA9IF9jdXJyeTIoZnVuY3Rpb24gcHJlcGVuZChlbCwgbGlzdCkge1xuICAgICAgICByZXR1cm4gX2NvbmNhdChbZWxdLCBsaXN0KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdoZW4gc3VwcGxpZWQgYW4gb2JqZWN0IHJldHVybnMgdGhlIGluZGljYXRlZFxuICAgICAqIHByb3BlcnR5IG9mIHRoYXQgb2JqZWN0LCBpZiBpdCBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHMgLT4ge3M6IGF9IC0+IGEgfCBVbmRlZmluZWRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcCBUaGUgcHJvcGVydHkgbmFtZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBxdWVyeVxuICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBhdCBgb2JqLnBgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucHJvcCgneCcsIHt4OiAxMDB9KTsgLy89PiAxMDBcbiAgICAgKiAgICAgIFIucHJvcCgneCcsIHt9KTsgLy89PiB1bmRlZmluZWRcbiAgICAgKi9cbiAgICB2YXIgcHJvcCA9IF9jdXJyeTIoZnVuY3Rpb24gcHJvcChwLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIG9ialtwXTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIElmIHRoZSBnaXZlbiwgbm9uLW51bGwgb2JqZWN0IGhhcyBhbiBvd24gcHJvcGVydHkgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUsXG4gICAgICogcmV0dXJucyB0aGUgdmFsdWUgb2YgdGhhdCBwcm9wZXJ0eS4gT3RoZXJ3aXNlIHJldHVybnMgdGhlIHByb3ZpZGVkIGRlZmF1bHRcbiAgICAgKiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNi4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgYSAtPiBTdHJpbmcgLT4gT2JqZWN0IC0+IGFcbiAgICAgKiBAcGFyYW0geyp9IHZhbCBUaGUgZGVmYXVsdCB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcCBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gcmV0dXJuLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBxdWVyeS5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgdmFsdWUgb2YgZ2l2ZW4gcHJvcGVydHkgb2YgdGhlIHN1cHBsaWVkIG9iamVjdCBvciB0aGUgZGVmYXVsdCB2YWx1ZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYWxpY2UgPSB7XG4gICAgICogICAgICAgIG5hbWU6ICdBTElDRScsXG4gICAgICogICAgICAgIGFnZTogMTAxXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgdmFyIGZhdm9yaXRlID0gUi5wcm9wKCdmYXZvcml0ZUxpYnJhcnknKTtcbiAgICAgKiAgICAgIHZhciBmYXZvcml0ZVdpdGhEZWZhdWx0ID0gUi5wcm9wT3IoJ1JhbWRhJywgJ2Zhdm9yaXRlTGlicmFyeScpO1xuICAgICAqXG4gICAgICogICAgICBmYXZvcml0ZShhbGljZSk7ICAvLz0+IHVuZGVmaW5lZFxuICAgICAqICAgICAgZmF2b3JpdGVXaXRoRGVmYXVsdChhbGljZSk7ICAvLz0+ICdSYW1kYSdcbiAgICAgKi9cbiAgICB2YXIgcHJvcE9yID0gX2N1cnJ5MyhmdW5jdGlvbiBwcm9wT3IodmFsLCBwLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIF9oYXMocCwgb2JqKSA/IG9ialtwXSA6IHZhbDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBzcGVjaWZpZWQgb2JqZWN0IHByb3BlcnR5IHNhdGlzZmllcyB0aGUgZ2l2ZW5cbiAgICAgKiBwcmVkaWNhdGU7IGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBTdHJpbmcgLT4ge1N0cmluZzogYX0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICAgICAqIEBwYXJhbSB7Kn0gb2JqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAc2VlIFIucHJvcEVxLCBSLnByb3BJc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucHJvcFNhdGlzZmllcyh4ID0+IHggPiAwLCAneCcsIHt4OiAxLCB5OiAyfSk7IC8vPT4gdHJ1ZVxuICAgICAqL1xuICAgIHZhciBwcm9wU2F0aXNmaWVzID0gX2N1cnJ5MyhmdW5jdGlvbiBwcm9wU2F0aXNmaWVzKHByZWQsIG5hbWUsIG9iaikge1xuICAgICAgICByZXR1cm4gcHJlZChvYmpbbmFtZV0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQWN0cyBhcyBtdWx0aXBsZSBgcHJvcGA6IGFycmF5IG9mIGtleXMgaW4sIGFycmF5IG9mIHZhbHVlcyBvdXQuIFByZXNlcnZlc1xuICAgICAqIG9yZGVyLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBba10gLT4ge2s6IHZ9IC0+IFt2XVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBzIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBmZXRjaFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBxdWVyeVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgY29ycmVzcG9uZGluZyB2YWx1ZXMgb3IgcGFydGlhbGx5IGFwcGxpZWQgZnVuY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wcm9wcyhbJ3gnLCAneSddLCB7eDogMSwgeTogMn0pOyAvLz0+IFsxLCAyXVxuICAgICAqICAgICAgUi5wcm9wcyhbJ2MnLCAnYScsICdiJ10sIHtiOiAyLCBhOiAxfSk7IC8vPT4gW3VuZGVmaW5lZCwgMSwgMl1cbiAgICAgKlxuICAgICAqICAgICAgdmFyIGZ1bGxOYW1lID0gUi5jb21wb3NlKFIuam9pbignICcpLCBSLnByb3BzKFsnZmlyc3QnLCAnbGFzdCddKSk7XG4gICAgICogICAgICBmdWxsTmFtZSh7bGFzdDogJ0J1bGxldC1Ub290aCcsIGFnZTogMzMsIGZpcnN0OiAnVG9ueSd9KTsgLy89PiAnVG9ueSBCdWxsZXQtVG9vdGgnXG4gICAgICovXG4gICAgdmFyIHByb3BzID0gX2N1cnJ5MihmdW5jdGlvbiBwcm9wcyhwcywgb2JqKSB7XG4gICAgICAgIHZhciBsZW4gPSBwcy5sZW5ndGg7XG4gICAgICAgIHZhciBvdXQgPSBbXTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIG91dFtpZHhdID0gb2JqW3BzW2lkeF1dO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIG51bWJlcnMgZnJvbSBgZnJvbWAgKGluY2x1c2l2ZSkgdG8gYHRvYCAoZXhjbHVzaXZlKS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gW051bWJlcl1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZnJvbSBUaGUgZmlyc3QgbnVtYmVyIGluIHRoZSBsaXN0LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0byBPbmUgbW9yZSB0aGFuIHRoZSBsYXN0IG51bWJlciBpbiB0aGUgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGxpc3Qgb2YgbnVtYmVycyBpbiB0dGhlIHNldCBgW2EsIGIpYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnJhbmdlKDEsIDUpOyAgICAvLz0+IFsxLCAyLCAzLCA0XVxuICAgICAqICAgICAgUi5yYW5nZSg1MCwgNTMpOyAgLy89PiBbNTAsIDUxLCA1Ml1cbiAgICAgKi9cbiAgICB2YXIgcmFuZ2UgPSBfY3VycnkyKGZ1bmN0aW9uIHJhbmdlKGZyb20sIHRvKSB7XG4gICAgICAgIGlmICghKF9pc051bWJlcihmcm9tKSAmJiBfaXNOdW1iZXIodG8pKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm90aCBhcmd1bWVudHMgdG8gcmFuZ2UgbXVzdCBiZSBudW1iZXJzJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgbiA9IGZyb207XG4gICAgICAgIHdoaWxlIChuIDwgdG8pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKG4pO1xuICAgICAgICAgICAgbiArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc2luZ2xlIGl0ZW0gYnkgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGxpc3QsIHN1Y2Nlc3NpdmVseSBjYWxsaW5nXG4gICAgICogdGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIGFuZCBwYXNzaW5nIGl0IGFuIGFjY3VtdWxhdG9yIHZhbHVlIGFuZCB0aGUgY3VycmVudFxuICAgICAqIHZhbHVlIGZyb20gdGhlIGFycmF5LCBhbmQgdGhlbiBwYXNzaW5nIHRoZSByZXN1bHQgdG8gdGhlIG5leHQgY2FsbC5cbiAgICAgKlxuICAgICAqIFNpbWlsYXIgdG8gYHJlZHVjZWAsIGV4Y2VwdCBtb3ZlcyB0aHJvdWdoIHRoZSBpbnB1dCBsaXN0IGZyb20gdGhlIHJpZ2h0IHRvXG4gICAgICogdGhlIGxlZnQuXG4gICAgICpcbiAgICAgKiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24gcmVjZWl2ZXMgdHdvIHZhbHVlczogKihhY2MsIHZhbHVlKSpcbiAgICAgKlxuICAgICAqIE5vdGU6IGBSLnJlZHVjZVJpZ2h0YCBkb2VzIG5vdCBza2lwIGRlbGV0ZWQgb3IgdW5hc3NpZ25lZCBpbmRpY2VzIChzcGFyc2VcbiAgICAgKiBhcnJheXMpLCB1bmxpa2UgdGhlIG5hdGl2ZSBgQXJyYXkucHJvdG90eXBlLnJlZHVjZWAgbWV0aG9kLiBGb3IgbW9yZSBkZXRhaWxzXG4gICAgICogb24gdGhpcyBiZWhhdmlvciwgc2VlOlxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L3JlZHVjZVJpZ2h0I0Rlc2NyaXB0aW9uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSxiIC0+IGEpIC0+IGEgLT4gW2JdIC0+IGFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24uIFJlY2VpdmVzIHR3byB2YWx1ZXMsIHRoZSBhY2N1bXVsYXRvciBhbmQgdGhlXG4gICAgICogICAgICAgIGN1cnJlbnQgZWxlbWVudCBmcm9tIHRoZSBhcnJheS5cbiAgICAgKiBAcGFyYW0geyp9IGFjYyBUaGUgYWNjdW11bGF0b3IgdmFsdWUuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGZpbmFsLCBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICAgKiBAc2VlIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgcGFpcnMgPSBbIFsnYScsIDFdLCBbJ2InLCAyXSwgWydjJywgM10gXTtcbiAgICAgKiAgICAgIHZhciBmbGF0dGVuUGFpcnMgPSAoYWNjLCBwYWlyKSA9PiBhY2MuY29uY2F0KHBhaXIpO1xuICAgICAqXG4gICAgICogICAgICBSLnJlZHVjZVJpZ2h0KGZsYXR0ZW5QYWlycywgW10sIHBhaXJzKTsgLy89PiBbICdjJywgMywgJ2InLCAyLCAnYScsIDEgXVxuICAgICAqL1xuICAgIHZhciByZWR1Y2VSaWdodCA9IF9jdXJyeTMoZnVuY3Rpb24gcmVkdWNlUmlnaHQoZm4sIGFjYywgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gbGlzdC5sZW5ndGggLSAxO1xuICAgICAgICB3aGlsZSAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIGFjYyA9IGZuKGFjYywgbGlzdFtpZHhdKTtcbiAgICAgICAgICAgIGlkeCAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgdmFsdWUgd3JhcHBlZCB0byBpbmRpY2F0ZSB0aGF0IGl0IGlzIHRoZSBmaW5hbCB2YWx1ZSBvZiB0aGUgcmVkdWNlXG4gICAgICogYW5kIHRyYW5zZHVjZSBmdW5jdGlvbnMuIFRoZSByZXR1cm5lZCB2YWx1ZSBzaG91bGQgYmUgY29uc2lkZXJlZCBhIGJsYWNrXG4gICAgICogYm94OiB0aGUgaW50ZXJuYWwgc3RydWN0dXJlIGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHN0YWJsZS5cbiAgICAgKlxuICAgICAqIE5vdGU6IHRoaXMgb3B0aW1pemF0aW9uIGlzIHVuYXZhaWxhYmxlIHRvIGZ1bmN0aW9ucyBub3QgZXhwbGljaXRseSBsaXN0ZWRcbiAgICAgKiBhYm92ZS4gRm9yIGluc3RhbmNlLCBpdCBpcyBub3QgY3VycmVudGx5IHN1cHBvcnRlZCBieSByZWR1Y2VSaWdodC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTUuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBhIC0+ICpcbiAgICAgKiBAcGFyYW0geyp9IHggVGhlIGZpbmFsIHZhbHVlIG9mIHRoZSByZWR1Y2UuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIHdyYXBwZWQgdmFsdWUuXG4gICAgICogQHNlZSBSLnJlZHVjZSwgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnJlZHVjZShcbiAgICAgKiAgICAgICAgUi5waXBlKFIuYWRkLCBSLndoZW4oUi5ndGUoUi5fXywgMTApLCBSLnJlZHVjZWQpKSxcbiAgICAgKiAgICAgICAgMCxcbiAgICAgKiAgICAgICAgWzEsIDIsIDMsIDQsIDVdKSAvLyAxMFxuICAgICAqL1xuICAgIHZhciByZWR1Y2VkID0gX2N1cnJ5MShfcmVkdWNlZCk7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBzdWItbGlzdCBvZiBgbGlzdGAgc3RhcnRpbmcgYXQgaW5kZXggYHN0YXJ0YCBhbmQgY29udGFpbmluZ1xuICAgICAqIGBjb3VudGAgZWxlbWVudHMuIF9Ob3RlIHRoYXQgdGhpcyBpcyBub3QgZGVzdHJ1Y3RpdmVfOiBpdCByZXR1cm5zIGEgY29weSBvZlxuICAgICAqIHRoZSBsaXN0IHdpdGggdGhlIGNoYW5nZXMuXG4gICAgICogPHNtYWxsPk5vIGxpc3RzIGhhdmUgYmVlbiBoYXJtZWQgaW4gdGhlIGFwcGxpY2F0aW9uIG9mIHRoaXMgZnVuY3Rpb24uPC9zbWFsbD5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4yXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzdGFydCBUaGUgcG9zaXRpb24gdG8gc3RhcnQgcmVtb3ZpbmcgZWxlbWVudHNcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBlbGVtZW50cyB0byByZW1vdmVcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIHJlbW92ZSBmcm9tXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgbmV3IEFycmF5IHdpdGggYGNvdW50YCBlbGVtZW50cyBmcm9tIGBzdGFydGAgcmVtb3ZlZC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnJlbW92ZSgyLCAzLCBbMSwyLDMsNCw1LDYsNyw4XSk7IC8vPT4gWzEsMiw2LDcsOF1cbiAgICAgKi9cbiAgICB2YXIgcmVtb3ZlID0gX2N1cnJ5MyhmdW5jdGlvbiByZW1vdmUoc3RhcnQsIGNvdW50LCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfY29uY2F0KF9zbGljZShsaXN0LCAwLCBNYXRoLm1pbihzdGFydCwgbGlzdC5sZW5ndGgpKSwgX3NsaWNlKGxpc3QsIE1hdGgubWluKGxpc3QubGVuZ3RoLCBzdGFydCArIGNvdW50KSkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSBhIHN1YnN0cmluZyBvciByZWdleCBtYXRjaCBpbiBhIHN0cmluZyB3aXRoIGEgcmVwbGFjZW1lbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjcuMFxuICAgICAqIEBjYXRlZ29yeSBTdHJpbmdcbiAgICAgKiBAc2lnIFJlZ0V4cHxTdHJpbmcgLT4gU3RyaW5nIC0+IFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cHxTdHJpbmd9IHBhdHRlcm4gQSByZWd1bGFyIGV4cHJlc3Npb24gb3IgYSBzdWJzdHJpbmcgdG8gbWF0Y2guXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlcGxhY2VtZW50IFRoZSBzdHJpbmcgdG8gcmVwbGFjZSB0aGUgbWF0Y2hlcyB3aXRoLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIFN0cmluZyB0byBkbyB0aGUgc2VhcmNoIGFuZCByZXBsYWNlbWVudCBpbi5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZXN1bHQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5yZXBsYWNlKCdmb28nLCAnYmFyJywgJ2ZvbyBmb28gZm9vJyk7IC8vPT4gJ2JhciBmb28gZm9vJ1xuICAgICAqICAgICAgUi5yZXBsYWNlKC9mb28vLCAnYmFyJywgJ2ZvbyBmb28gZm9vJyk7IC8vPT4gJ2JhciBmb28gZm9vJ1xuICAgICAqXG4gICAgICogICAgICAvLyBVc2UgdGhlIFwiZ1wiIChnbG9iYWwpIGZsYWcgdG8gcmVwbGFjZSBhbGwgb2NjdXJyZW5jZXM6XG4gICAgICogICAgICBSLnJlcGxhY2UoL2Zvby9nLCAnYmFyJywgJ2ZvbyBmb28gZm9vJyk7IC8vPT4gJ2JhciBiYXIgYmFyJ1xuICAgICAqL1xuICAgIHZhciByZXBsYWNlID0gX2N1cnJ5MyhmdW5jdGlvbiByZXBsYWNlKHJlZ2V4LCByZXBsYWNlbWVudCwgc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShyZWdleCwgcmVwbGFjZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBsaXN0IG9yIHN0cmluZyB3aXRoIHRoZSBlbGVtZW50cyBvciBjaGFyYWN0ZXJzIGluIHJldmVyc2VcbiAgICAgKiBvcmRlci5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFthXSAtPiBbYV1cbiAgICAgKiBAc2lnIFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gbGlzdFxuICAgICAqIEByZXR1cm4ge0FycmF5fFN0cmluZ31cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnJldmVyc2UoWzEsIDIsIDNdKTsgIC8vPT4gWzMsIDIsIDFdXG4gICAgICogICAgICBSLnJldmVyc2UoWzEsIDJdKTsgICAgIC8vPT4gWzIsIDFdXG4gICAgICogICAgICBSLnJldmVyc2UoWzFdKTsgICAgICAgIC8vPT4gWzFdXG4gICAgICogICAgICBSLnJldmVyc2UoW10pOyAgICAgICAgIC8vPT4gW11cbiAgICAgKlxuICAgICAqICAgICAgUi5yZXZlcnNlKCdhYmMnKTsgICAgICAvLz0+ICdjYmEnXG4gICAgICogICAgICBSLnJldmVyc2UoJ2FiJyk7ICAgICAgIC8vPT4gJ2JhJ1xuICAgICAqICAgICAgUi5yZXZlcnNlKCdhJyk7ICAgICAgICAvLz0+ICdhJ1xuICAgICAqICAgICAgUi5yZXZlcnNlKCcnKTsgICAgICAgICAvLz0+ICcnXG4gICAgICovXG4gICAgdmFyIHJldmVyc2UgPSBfY3VycnkxKGZ1bmN0aW9uIHJldmVyc2UobGlzdCkge1xuICAgICAgICByZXR1cm4gX2lzU3RyaW5nKGxpc3QpID8gbGlzdC5zcGxpdCgnJykucmV2ZXJzZSgpLmpvaW4oJycpIDogX3NsaWNlKGxpc3QpLnJldmVyc2UoKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFNjYW4gaXMgc2ltaWxhciB0byByZWR1Y2UsIGJ1dCByZXR1cm5zIGEgbGlzdCBvZiBzdWNjZXNzaXZlbHkgcmVkdWNlZCB2YWx1ZXNcbiAgICAgKiBmcm9tIHRoZSBsZWZ0XG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEsYiAtPiBhKSAtPiBhIC0+IFtiXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24uIFJlY2VpdmVzIHR3byB2YWx1ZXMsIHRoZSBhY2N1bXVsYXRvciBhbmQgdGhlXG4gICAgICogICAgICAgIGN1cnJlbnQgZWxlbWVudCBmcm9tIHRoZSBhcnJheVxuICAgICAqIEBwYXJhbSB7Kn0gYWNjIFRoZSBhY2N1bXVsYXRvciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBsaXN0IG9mIGFsbCBpbnRlcm1lZGlhdGVseSByZWR1Y2VkIHZhbHVlcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbnVtYmVycyA9IFsxLCAyLCAzLCA0XTtcbiAgICAgKiAgICAgIHZhciBmYWN0b3JpYWxzID0gUi5zY2FuKFIubXVsdGlwbHksIDEsIG51bWJlcnMpOyAvLz0+IFsxLCAxLCAyLCA2LCAyNF1cbiAgICAgKi9cbiAgICB2YXIgc2NhbiA9IF9jdXJyeTMoZnVuY3Rpb24gc2NhbihmbiwgYWNjLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBbYWNjXTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgYWNjID0gZm4oYWNjLCBsaXN0W2lkeF0pO1xuICAgICAgICAgICAgcmVzdWx0W2lkeCArIDFdID0gYWNjO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJlc3VsdCBvZiBcInNldHRpbmdcIiB0aGUgcG9ydGlvbiBvZiB0aGUgZ2l2ZW4gZGF0YSBzdHJ1Y3R1cmVcbiAgICAgKiBmb2N1c2VkIGJ5IHRoZSBnaXZlbiBsZW5zIHRvIHRoZSBnaXZlbiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAdHlwZWRlZm4gTGVucyBzIGEgPSBGdW5jdG9yIGYgPT4gKGEgLT4gZiBhKSAtPiBzIC0+IGYgc1xuICAgICAqIEBzaWcgTGVucyBzIGEgLT4gYSAtPiBzIC0+IHNcbiAgICAgKiBAcGFyYW0ge0xlbnN9IGxlbnNcbiAgICAgKiBAcGFyYW0geyp9IHZcbiAgICAgKiBAcGFyYW0geyp9IHhcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5wcm9wLCBSLmxlbnNJbmRleCwgUi5sZW5zUHJvcFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB4TGVucyA9IFIubGVuc1Byb3AoJ3gnKTtcbiAgICAgKlxuICAgICAqICAgICAgUi5zZXQoeExlbnMsIDQsIHt4OiAxLCB5OiAyfSk7ICAvLz0+IHt4OiA0LCB5OiAyfVxuICAgICAqICAgICAgUi5zZXQoeExlbnMsIDgsIHt4OiAxLCB5OiAyfSk7ICAvLz0+IHt4OiA4LCB5OiAyfVxuICAgICAqL1xuICAgIHZhciBzZXQgPSBfY3VycnkzKGZ1bmN0aW9uIHNldChsZW5zLCB2LCB4KSB7XG4gICAgICAgIHJldHVybiBvdmVyKGxlbnMsIGFsd2F5cyh2KSwgeCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gbGlzdCBvciBzdHJpbmcgKG9yIG9iamVjdCB3aXRoIGEgYHNsaWNlYFxuICAgICAqIG1ldGhvZCkgZnJvbSBgZnJvbUluZGV4YCAoaW5jbHVzaXZlKSB0byBgdG9JbmRleGAgKGV4Y2x1c2l2ZSkuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgc2xpY2VgIG1ldGhvZCBvZiB0aGUgdGhpcmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuNFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBmcm9tSW5kZXggVGhlIHN0YXJ0IGluZGV4IChpbmNsdXNpdmUpLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0b0luZGV4IFRoZSBlbmQgaW5kZXggKGV4Y2x1c2l2ZSkuXG4gICAgICogQHBhcmFtIHsqfSBsaXN0XG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnNsaWNlKDEsIDMsIFsnYScsICdiJywgJ2MnLCAnZCddKTsgICAgICAgIC8vPT4gWydiJywgJ2MnXVxuICAgICAqICAgICAgUi5zbGljZSgxLCBJbmZpbml0eSwgWydhJywgJ2InLCAnYycsICdkJ10pOyAvLz0+IFsnYicsICdjJywgJ2QnXVxuICAgICAqICAgICAgUi5zbGljZSgwLCAtMSwgWydhJywgJ2InLCAnYycsICdkJ10pOyAgICAgICAvLz0+IFsnYScsICdiJywgJ2MnXVxuICAgICAqICAgICAgUi5zbGljZSgtMywgLTEsIFsnYScsICdiJywgJ2MnLCAnZCddKTsgICAgICAvLz0+IFsnYicsICdjJ11cbiAgICAgKiAgICAgIFIuc2xpY2UoMCwgMywgJ3JhbWRhJyk7ICAgICAgICAgICAgICAgICAgICAgLy89PiAncmFtJ1xuICAgICAqL1xuICAgIHZhciBzbGljZSA9IF9jdXJyeTMoX2NoZWNrRm9yTWV0aG9kKCdzbGljZScsIGZ1bmN0aW9uIHNsaWNlKGZyb21JbmRleCwgdG9JbmRleCwgbGlzdCkge1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwobGlzdCwgZnJvbUluZGV4LCB0b0luZGV4KTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGUgbGlzdCwgc29ydGVkIGFjY29yZGluZyB0byB0aGUgY29tcGFyYXRvciBmdW5jdGlvbixcbiAgICAgKiB3aGljaCBzaG91bGQgYWNjZXB0IHR3byB2YWx1ZXMgYXQgYSB0aW1lIGFuZCByZXR1cm4gYSBuZWdhdGl2ZSBudW1iZXIgaWYgdGhlXG4gICAgICogZmlyc3QgdmFsdWUgaXMgc21hbGxlciwgYSBwb3NpdGl2ZSBudW1iZXIgaWYgaXQncyBsYXJnZXIsIGFuZCB6ZXJvIGlmIHRoZXlcbiAgICAgKiBhcmUgZXF1YWwuIFBsZWFzZSBub3RlIHRoYXQgdGhpcyBpcyBhICoqY29weSoqIG9mIHRoZSBsaXN0LiBJdCBkb2VzIG5vdFxuICAgICAqIG1vZGlmeSB0aGUgb3JpZ2luYWwuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSxhIC0+IE51bWJlcikgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgQSBzb3J0aW5nIGZ1bmN0aW9uIDo6IGEgLT4gYiAtPiBJbnRcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIHNvcnRcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gYSBuZXcgYXJyYXkgd2l0aCBpdHMgZWxlbWVudHMgc29ydGVkIGJ5IHRoZSBjb21wYXJhdG9yIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBkaWZmID0gZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGI7IH07XG4gICAgICogICAgICBSLnNvcnQoZGlmZiwgWzQsMiw3LDVdKTsgLy89PiBbMiwgNCwgNSwgN11cbiAgICAgKi9cbiAgICB2YXIgc29ydCA9IF9jdXJyeTIoZnVuY3Rpb24gc29ydChjb21wYXJhdG9yLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfc2xpY2UobGlzdCkuc29ydChjb21wYXJhdG9yKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFNvcnRzIHRoZSBsaXN0IGFjY29yZGluZyB0byB0aGUgc3VwcGxpZWQgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgT3JkIGIgPT4gKGEgLT4gYikgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBzb3J0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBsaXN0IHNvcnRlZCBieSB0aGUga2V5cyBnZW5lcmF0ZWQgYnkgYGZuYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgc29ydEJ5Rmlyc3RJdGVtID0gUi5zb3J0QnkoUi5wcm9wKDApKTtcbiAgICAgKiAgICAgIHZhciBzb3J0QnlOYW1lQ2FzZUluc2Vuc2l0aXZlID0gUi5zb3J0QnkoUi5jb21wb3NlKFIudG9Mb3dlciwgUi5wcm9wKCduYW1lJykpKTtcbiAgICAgKiAgICAgIHZhciBwYWlycyA9IFtbLTEsIDFdLCBbLTIsIDJdLCBbLTMsIDNdXTtcbiAgICAgKiAgICAgIHNvcnRCeUZpcnN0SXRlbShwYWlycyk7IC8vPT4gW1stMywgM10sIFstMiwgMl0sIFstMSwgMV1dXG4gICAgICogICAgICB2YXIgYWxpY2UgPSB7XG4gICAgICogICAgICAgIG5hbWU6ICdBTElDRScsXG4gICAgICogICAgICAgIGFnZTogMTAxXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgdmFyIGJvYiA9IHtcbiAgICAgKiAgICAgICAgbmFtZTogJ0JvYicsXG4gICAgICogICAgICAgIGFnZTogLTEwXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgdmFyIGNsYXJhID0ge1xuICAgICAqICAgICAgICBuYW1lOiAnY2xhcmEnLFxuICAgICAqICAgICAgICBhZ2U6IDMxNC4xNTlcbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICB2YXIgcGVvcGxlID0gW2NsYXJhLCBib2IsIGFsaWNlXTtcbiAgICAgKiAgICAgIHNvcnRCeU5hbWVDYXNlSW5zZW5zaXRpdmUocGVvcGxlKTsgLy89PiBbYWxpY2UsIGJvYiwgY2xhcmFdXG4gICAgICovXG4gICAgdmFyIHNvcnRCeSA9IF9jdXJyeTIoZnVuY3Rpb24gc29ydEJ5KGZuLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfc2xpY2UobGlzdCkuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgdmFyIGFhID0gZm4oYSk7XG4gICAgICAgICAgICB2YXIgYmIgPSBmbihiKTtcbiAgICAgICAgICAgIHJldHVybiBhYSA8IGJiID8gLTEgOiBhYSA+IGJiID8gMSA6IDA7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU3BsaXRzIGEgZ2l2ZW4gbGlzdCBvciBzdHJpbmcgYXQgYSBnaXZlbiBpbmRleC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IFtbYV0sIFthXV1cbiAgICAgKiBAc2lnIE51bWJlciAtPiBTdHJpbmcgLT4gW1N0cmluZywgU3RyaW5nXVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleCBUaGUgaW5kZXggd2hlcmUgdGhlIGFycmF5L3N0cmluZyBpcyBzcGxpdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gYXJyYXkgVGhlIGFycmF5L3N0cmluZyB0byBiZSBzcGxpdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnNwbGl0QXQoMSwgWzEsIDIsIDNdKTsgICAgICAgICAgLy89PiBbWzFdLCBbMiwgM11dXG4gICAgICogICAgICBSLnNwbGl0QXQoNSwgJ2hlbGxvIHdvcmxkJyk7ICAgICAgLy89PiBbJ2hlbGxvJywgJyB3b3JsZCddXG4gICAgICogICAgICBSLnNwbGl0QXQoLTEsICdmb29iYXInKTsgICAgICAgICAgLy89PiBbJ2Zvb2JhJywgJ3InXVxuICAgICAqL1xuICAgIHZhciBzcGxpdEF0ID0gX2N1cnJ5MihmdW5jdGlvbiBzcGxpdEF0KGluZGV4LCBhcnJheSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgc2xpY2UoMCwgaW5kZXgsIGFycmF5KSxcbiAgICAgICAgICAgIHNsaWNlKGluZGV4LCBsZW5ndGgoYXJyYXkpLCBhcnJheSlcbiAgICAgICAgXTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFNwbGl0cyBhIGNvbGxlY3Rpb24gaW50byBzbGljZXMgb2YgdGhlIHNwZWNpZmllZCBsZW5ndGguXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE2LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFthXSAtPiBbW2FdXVxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiBbU3RyaW5nXVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdFxuICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuc3BsaXRFdmVyeSgzLCBbMSwgMiwgMywgNCwgNSwgNiwgN10pOyAvLz0+IFtbMSwgMiwgM10sIFs0LCA1LCA2XSwgWzddXVxuICAgICAqICAgICAgUi5zcGxpdEV2ZXJ5KDMsICdmb29iYXJiYXonKTsgLy89PiBbJ2ZvbycsICdiYXInLCAnYmF6J11cbiAgICAgKi9cbiAgICB2YXIgc3BsaXRFdmVyeSA9IF9jdXJyeTIoZnVuY3Rpb24gc3BsaXRFdmVyeShuLCBsaXN0KSB7XG4gICAgICAgIGlmIChuIDw9IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gc3BsaXRFdmVyeSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcicpO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goc2xpY2UoaWR4LCBpZHggKz0gbiwgbGlzdCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGxpc3QgYW5kIGEgcHJlZGljYXRlIGFuZCByZXR1cm5zIGEgcGFpciBvZiBsaXN0cyB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICAgKlxuICAgICAqICAtIHRoZSByZXN1bHQgb2YgY29uY2F0ZW5hdGluZyB0aGUgdHdvIG91dHB1dCBsaXN0cyBpcyBlcXVpdmFsZW50IHRvIHRoZSBpbnB1dCBsaXN0O1xuICAgICAqICAtIG5vbmUgb2YgdGhlIGVsZW1lbnRzIG9mIHRoZSBmaXJzdCBvdXRwdXQgbGlzdCBzYXRpc2ZpZXMgdGhlIHByZWRpY2F0ZTsgYW5kXG4gICAgICogIC0gaWYgdGhlIHNlY29uZCBvdXRwdXQgbGlzdCBpcyBub24tZW1wdHksIGl0cyBmaXJzdCBlbGVtZW50IHNhdGlzZmllcyB0aGUgcHJlZGljYXRlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBbW2FdLCBbYV1dXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBUaGUgcHJlZGljYXRlIHRoYXQgZGV0ZXJtaW5lcyB3aGVyZSB0aGUgYXJyYXkgaXMgc3BsaXQuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gYmUgc3BsaXQuXG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5zcGxpdFdoZW4oUi5lcXVhbHMoMiksIFsxLCAyLCAzLCAxLCAyLCAzXSk7ICAgLy89PiBbWzFdLCBbMiwgMywgMSwgMiwgM11dXG4gICAgICovXG4gICAgdmFyIHNwbGl0V2hlbiA9IF9jdXJyeTIoZnVuY3Rpb24gc3BsaXRXaGVuKHByZWQsIGxpc3QpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIHByZWZpeCA9IFtdO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuICYmICFwcmVkKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgIHByZWZpeC5wdXNoKGxpc3RbaWR4XSk7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgcHJlZml4LFxuICAgICAgICAgICAgX3NsaWNlKGxpc3QsIGlkeClcbiAgICAgICAgXTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFN1YnRyYWN0cyBpdHMgc2Vjb25kIGFyZ3VtZW50IGZyb20gaXRzIGZpcnN0IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTWF0aFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IE51bWJlciAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYSBUaGUgZmlyc3QgdmFsdWUuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGIgVGhlIHNlY29uZCB2YWx1ZS5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSByZXN1bHQgb2YgYGEgLSBiYC5cbiAgICAgKiBAc2VlIFIuYWRkXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5zdWJ0cmFjdCgxMCwgOCk7IC8vPT4gMlxuICAgICAqXG4gICAgICogICAgICB2YXIgbWludXM1ID0gUi5zdWJ0cmFjdChSLl9fLCA1KTtcbiAgICAgKiAgICAgIG1pbnVzNSgxNyk7IC8vPT4gMTJcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGNvbXBsZW1lbnRhcnlBbmdsZSA9IFIuc3VidHJhY3QoOTApO1xuICAgICAqICAgICAgY29tcGxlbWVudGFyeUFuZ2xlKDMwKTsgLy89PiA2MFxuICAgICAqICAgICAgY29tcGxlbWVudGFyeUFuZ2xlKDcyKTsgLy89PiAxOFxuICAgICAqL1xuICAgIHZhciBzdWJ0cmFjdCA9IF9jdXJyeTIoZnVuY3Rpb24gc3VidHJhY3QoYSwgYikge1xuICAgICAgICByZXR1cm4gTnVtYmVyKGEpIC0gTnVtYmVyKGIpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbGwgYnV0IHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBnaXZlbiBsaXN0IG9yIHN0cmluZyAob3Igb2JqZWN0XG4gICAgICogd2l0aCBhIGB0YWlsYCBtZXRob2QpLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYHNsaWNlYCBtZXRob2Qgb2YgdGhlIGZpcnN0IGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFthXVxuICAgICAqIEBzaWcgU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7Kn0gbGlzdFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLmhlYWQsIFIuaW5pdCwgUi5sYXN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50YWlsKFsxLCAyLCAzXSk7ICAvLz0+IFsyLCAzXVxuICAgICAqICAgICAgUi50YWlsKFsxLCAyXSk7ICAgICAvLz0+IFsyXVxuICAgICAqICAgICAgUi50YWlsKFsxXSk7ICAgICAgICAvLz0+IFtdXG4gICAgICogICAgICBSLnRhaWwoW10pOyAgICAgICAgIC8vPT4gW11cbiAgICAgKlxuICAgICAqICAgICAgUi50YWlsKCdhYmMnKTsgIC8vPT4gJ2JjJ1xuICAgICAqICAgICAgUi50YWlsKCdhYicpOyAgIC8vPT4gJ2InXG4gICAgICogICAgICBSLnRhaWwoJ2EnKTsgICAgLy89PiAnJ1xuICAgICAqICAgICAgUi50YWlsKCcnKTsgICAgIC8vPT4gJydcbiAgICAgKi9cbiAgICB2YXIgdGFpbCA9IF9jaGVja0Zvck1ldGhvZCgndGFpbCcsIHNsaWNlKDEsIEluZmluaXR5KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBmaXJzdCBgbmAgZWxlbWVudHMgb2YgdGhlIGdpdmVuIGxpc3QsIHN0cmluZywgb3JcbiAgICAgKiB0cmFuc2R1Y2VyL3RyYW5zZm9ybWVyIChvciBvYmplY3Qgd2l0aCBhIGB0YWtlYCBtZXRob2QpLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYHRha2VgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAc2lnIE51bWJlciAtPiBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAgICAgKiBAcGFyYW0geyp9IGxpc3RcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5kcm9wXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50YWtlKDEsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydmb28nXVxuICAgICAqICAgICAgUi50YWtlKDIsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydmb28nLCAnYmFyJ11cbiAgICAgKiAgICAgIFIudGFrZSgzLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFsnZm9vJywgJ2JhcicsICdiYXonXVxuICAgICAqICAgICAgUi50YWtlKDQsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydmb28nLCAnYmFyJywgJ2JheiddXG4gICAgICogICAgICBSLnRha2UoMywgJ3JhbWRhJyk7ICAgICAgICAgICAgICAgLy89PiAncmFtJ1xuICAgICAqXG4gICAgICogICAgICB2YXIgcGVyc29ubmVsID0gW1xuICAgICAqICAgICAgICAnRGF2ZSBCcnViZWNrJyxcbiAgICAgKiAgICAgICAgJ1BhdWwgRGVzbW9uZCcsXG4gICAgICogICAgICAgICdFdWdlbmUgV3JpZ2h0JyxcbiAgICAgKiAgICAgICAgJ0pvZSBNb3JlbGxvJyxcbiAgICAgKiAgICAgICAgJ0dlcnJ5IE11bGxpZ2FuJyxcbiAgICAgKiAgICAgICAgJ0JvYiBCYXRlcycsXG4gICAgICogICAgICAgICdKb2UgRG9kZ2UnLFxuICAgICAqICAgICAgICAnUm9uIENyb3R0eSdcbiAgICAgKiAgICAgIF07XG4gICAgICpcbiAgICAgKiAgICAgIHZhciB0YWtlRml2ZSA9IFIudGFrZSg1KTtcbiAgICAgKiAgICAgIHRha2VGaXZlKHBlcnNvbm5lbCk7XG4gICAgICogICAgICAvLz0+IFsnRGF2ZSBCcnViZWNrJywgJ1BhdWwgRGVzbW9uZCcsICdFdWdlbmUgV3JpZ2h0JywgJ0pvZSBNb3JlbGxvJywgJ0dlcnJ5IE11bGxpZ2FuJ11cbiAgICAgKi9cbiAgICB2YXIgdGFrZSA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgndGFrZScsIF94dGFrZSwgZnVuY3Rpb24gdGFrZShuLCB4cykge1xuICAgICAgICByZXR1cm4gc2xpY2UoMCwgbiA8IDAgPyBJbmZpbml0eSA6IG4sIHhzKTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGxpc3QgY29udGFpbmluZyB0aGUgbGFzdCBgbmAgZWxlbWVudHMgb2YgYSBnaXZlbiBsaXN0LCBwYXNzaW5nXG4gICAgICogZWFjaCB2YWx1ZSB0byB0aGUgc3VwcGxpZWQgcHJlZGljYXRlIGZ1bmN0aW9uLCBhbmQgdGVybWluYXRpbmcgd2hlbiB0aGVcbiAgICAgKiBwcmVkaWNhdGUgZnVuY3Rpb24gcmV0dXJucyBgZmFsc2VgLiBFeGNsdWRlcyB0aGUgZWxlbWVudCB0aGF0IGNhdXNlZCB0aGVcbiAgICAgKiBwcmVkaWNhdGUgZnVuY3Rpb24gdG8gZmFpbC4gVGhlIHByZWRpY2F0ZSBmdW5jdGlvbiBpcyBwYXNzZWQgb25lIGFyZ3VtZW50OlxuICAgICAqICoodmFsdWUpKi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBhcnJheS5cbiAgICAgKiBAc2VlIFIuZHJvcExhc3RXaGlsZSwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBpc05vdE9uZSA9IHggPT4geCAhPT0gMTtcbiAgICAgKlxuICAgICAqICAgICAgUi50YWtlTGFzdFdoaWxlKGlzTm90T25lLCBbMSwgMiwgMywgNF0pOyAvLz0+IFsyLCAzLCA0XVxuICAgICAqL1xuICAgIHZhciB0YWtlTGFzdFdoaWxlID0gX2N1cnJ5MihmdW5jdGlvbiB0YWtlTGFzdFdoaWxlKGZuLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpZHggPj0gMCAmJiBmbihsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICBpZHggLT0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3NsaWNlKGxpc3QsIGlkeCArIDEsIEluZmluaXR5KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIHRoZSBmaXJzdCBgbmAgZWxlbWVudHMgb2YgYSBnaXZlbiBsaXN0LFxuICAgICAqIHBhc3NpbmcgZWFjaCB2YWx1ZSB0byB0aGUgc3VwcGxpZWQgcHJlZGljYXRlIGZ1bmN0aW9uLCBhbmQgdGVybWluYXRpbmcgd2hlblxuICAgICAqIHRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gcmV0dXJucyBgZmFsc2VgLiBFeGNsdWRlcyB0aGUgZWxlbWVudCB0aGF0IGNhdXNlZCB0aGVcbiAgICAgKiBwcmVkaWNhdGUgZnVuY3Rpb24gdG8gZmFpbC4gVGhlIHByZWRpY2F0ZSBmdW5jdGlvbiBpcyBwYXNzZWQgb25lIGFyZ3VtZW50OlxuICAgICAqICoodmFsdWUpKi5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGB0YWtlV2hpbGVgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgYXJyYXkuXG4gICAgICogQHNlZSBSLmRyb3BXaGlsZSwgUi50cmFuc2R1Y2UsIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNOb3RGb3VyID0geCA9PiB4ICE9PSA0O1xuICAgICAqXG4gICAgICogICAgICBSLnRha2VXaGlsZShpc05vdEZvdXIsIFsxLCAyLCAzLCA0LCAzLCAyLCAxXSk7IC8vPT4gWzEsIDIsIDNdXG4gICAgICovXG4gICAgdmFyIHRha2VXaGlsZSA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgndGFrZVdoaWxlJywgX3h0YWtlV2hpbGUsIGZ1bmN0aW9uIHRha2VXaGlsZShmbiwgbGlzdCkge1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuICYmIGZuKGxpc3RbaWR4XSkpIHtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfc2xpY2UobGlzdCwgMCwgaWR4KTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiB3aXRoIHRoZSBzdXBwbGllZCBvYmplY3QsIHRoZW4gcmV0dXJucyB0aGUgb2JqZWN0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIChhIC0+ICopIC0+IGEgLT4gYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdpdGggYHhgLiBUaGUgcmV0dXJuIHZhbHVlIG9mIGBmbmAgd2lsbCBiZSB0aHJvd24gYXdheS5cbiAgICAgKiBAcGFyYW0geyp9IHhcbiAgICAgKiBAcmV0dXJuIHsqfSBgeGAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNheVggPSB4ID0+IGNvbnNvbGUubG9nKCd4IGlzICcgKyB4KTtcbiAgICAgKiAgICAgIFIudGFwKHNheVgsIDEwMCk7IC8vPT4gMTAwXG4gICAgICogICAgICAvLy0+ICd4IGlzIDEwMCdcbiAgICAgKi9cbiAgICB2YXIgdGFwID0gX2N1cnJ5MihmdW5jdGlvbiB0YXAoZm4sIHgpIHtcbiAgICAgICAgZm4oeCk7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ2FsbHMgYW4gaW5wdXQgZnVuY3Rpb24gYG5gIHRpbWVzLCByZXR1cm5pbmcgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgcmVzdWx0c1xuICAgICAqIG9mIHRob3NlIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAqXG4gICAgICogYGZuYCBpcyBwYXNzZWQgb25lIGFyZ3VtZW50OiBUaGUgY3VycmVudCB2YWx1ZSBvZiBgbmAsIHdoaWNoIGJlZ2lucyBhdCBgMGBcbiAgICAgKiBhbmQgaXMgZ3JhZHVhbGx5IGluY3JlbWVudGVkIHRvIGBuIC0gMWAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIuM1xuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoTnVtYmVyIC0+IGEpIC0+IE51bWJlciAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gaW52b2tlLiBQYXNzZWQgb25lIGFyZ3VtZW50LCB0aGUgY3VycmVudCB2YWx1ZSBvZiBgbmAuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gQSB2YWx1ZSBiZXR3ZWVuIGAwYCBhbmQgYG4gLSAxYC4gSW5jcmVtZW50cyBhZnRlciBlYWNoIGZ1bmN0aW9uIGNhbGwuXG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHJldHVybiB2YWx1ZXMgb2YgYWxsIGNhbGxzIHRvIGBmbmAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50aW1lcyhSLmlkZW50aXR5LCA1KTsgLy89PiBbMCwgMSwgMiwgMywgNF1cbiAgICAgKi9cbiAgICB2YXIgdGltZXMgPSBfY3VycnkyKGZ1bmN0aW9uIHRpbWVzKGZuLCBuKSB7XG4gICAgICAgIHZhciBsZW4gPSBOdW1iZXIobik7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGlzdDtcbiAgICAgICAgaWYgKGxlbiA8IDAgfHwgaXNOYU4obGVuKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ24gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXInKTtcbiAgICAgICAgfVxuICAgICAgICBsaXN0ID0gbmV3IEFycmF5KGxlbik7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGxpc3RbaWR4XSA9IGZuKGlkeCk7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGFuIG9iamVjdCBpbnRvIGFuIGFycmF5IG9mIGtleSwgdmFsdWUgYXJyYXlzLiBPbmx5IHRoZSBvYmplY3Qnc1xuICAgICAqIG93biBwcm9wZXJ0aWVzIGFyZSB1c2VkLlxuICAgICAqIE5vdGUgdGhhdCB0aGUgb3JkZXIgb2YgdGhlIG91dHB1dCBhcnJheSBpcyBub3QgZ3VhcmFudGVlZCB0byBiZSBjb25zaXN0ZW50XG4gICAgICogYWNyb3NzIGRpZmZlcmVudCBKUyBwbGF0Zm9ybXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjQuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtTdHJpbmc6ICp9IC0+IFtbU3RyaW5nLCpdXVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBleHRyYWN0IGZyb21cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgb2Yga2V5LCB2YWx1ZSBhcnJheXMgZnJvbSB0aGUgb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMuXG4gICAgICogQHNlZSBSLmZyb21QYWlyc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudG9QYWlycyh7YTogMSwgYjogMiwgYzogM30pOyAvLz0+IFtbJ2EnLCAxXSwgWydiJywgMl0sIFsnYycsIDNdXVxuICAgICAqL1xuICAgIHZhciB0b1BhaXJzID0gX2N1cnJ5MShmdW5jdGlvbiB0b1BhaXJzKG9iaikge1xuICAgICAgICB2YXIgcGFpcnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChfaGFzKHByb3AsIG9iaikpIHtcbiAgICAgICAgICAgICAgICBwYWlyc1twYWlycy5sZW5ndGhdID0gW1xuICAgICAgICAgICAgICAgICAgICBwcm9wLFxuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYWlycztcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENvbnZlcnRzIGFuIG9iamVjdCBpbnRvIGFuIGFycmF5IG9mIGtleSwgdmFsdWUgYXJyYXlzLiBUaGUgb2JqZWN0J3Mgb3duXG4gICAgICogcHJvcGVydGllcyBhbmQgcHJvdG90eXBlIHByb3BlcnRpZXMgYXJlIHVzZWQuIE5vdGUgdGhhdCB0aGUgb3JkZXIgb2YgdGhlXG4gICAgICogb3V0cHV0IGFycmF5IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIGNvbnNpc3RlbnQgYWNyb3NzIGRpZmZlcmVudCBKU1xuICAgICAqIHBsYXRmb3Jtcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge1N0cmluZzogKn0gLT4gW1tTdHJpbmcsKl1dXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGV4dHJhY3QgZnJvbVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiBrZXksIHZhbHVlIGFycmF5cyBmcm9tIHRoZSBvYmplY3QncyBvd25cbiAgICAgKiAgICAgICAgIGFuZCBwcm90b3R5cGUgcHJvcGVydGllcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgRiA9IGZ1bmN0aW9uKCkgeyB0aGlzLnggPSAnWCc7IH07XG4gICAgICogICAgICBGLnByb3RvdHlwZS55ID0gJ1knO1xuICAgICAqICAgICAgdmFyIGYgPSBuZXcgRigpO1xuICAgICAqICAgICAgUi50b1BhaXJzSW4oZik7IC8vPT4gW1sneCcsJ1gnXSwgWyd5JywnWSddXVxuICAgICAqL1xuICAgIHZhciB0b1BhaXJzSW4gPSBfY3VycnkxKGZ1bmN0aW9uIHRvUGFpcnNJbihvYmopIHtcbiAgICAgICAgdmFyIHBhaXJzID0gW107XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICBwYWlyc1twYWlycy5sZW5ndGhdID0gW1xuICAgICAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICAgICAgb2JqW3Byb3BdXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYWlycztcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRyYW5zcG9zZXMgdGhlIHJvd3MgYW5kIGNvbHVtbnMgb2YgYSAyRCBsaXN0LlxuICAgICAqIFdoZW4gcGFzc2VkIGEgbGlzdCBvZiBgbmAgbGlzdHMgb2YgbGVuZ3RoIGB4YCxcbiAgICAgKiByZXR1cm5zIGEgbGlzdCBvZiBgeGAgbGlzdHMgb2YgbGVuZ3RoIGBuYC5cbiAgICAgKlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFtbYV1dIC0+IFtbYV1dXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBBIDJEIGxpc3RcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSAyRCBsaXN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50cmFuc3Bvc2UoW1sxLCAnYSddLCBbMiwgJ2InXSwgWzMsICdjJ11dKSAvLz0+IFtbMSwgMiwgM10sIFsnYScsICdiJywgJ2MnXV1cbiAgICAgKiAgICAgIFIudHJhbnNwb3NlKFtbMSwgMiwgM10sIFsnYScsICdiJywgJ2MnXV0pIC8vPT4gW1sxLCAnYSddLCBbMiwgJ2InXSwgWzMsICdjJ11dXG4gICAgICpcbiAgICAgKiBJZiBzb21lIG9mIHRoZSByb3dzIGFyZSBzaG9ydGVyIHRoYW4gdGhlIGZvbGxvd2luZyByb3dzLCB0aGVpciBlbGVtZW50cyBhcmUgc2tpcHBlZDpcbiAgICAgKlxuICAgICAqICAgICAgUi50cmFuc3Bvc2UoW1sxMCwgMTFdLCBbMjBdLCBbXSwgWzMwLCAzMSwgMzJdXSkgLy89PiBbWzEwLCAyMCwgMzBdLCBbMTEsIDMxXSwgWzMyXV1cbiAgICAgKi9cbiAgICB2YXIgdHJhbnNwb3NlID0gX2N1cnJ5MShmdW5jdGlvbiB0cmFuc3Bvc2Uob3V0ZXJsaXN0KSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB3aGlsZSAoaSA8IG91dGVybGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBpbm5lcmxpc3QgPSBvdXRlcmxpc3RbaV07XG4gICAgICAgICAgICB2YXIgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaiA8IGlubmVybGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdFtqXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2pdID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdFtqXS5wdXNoKGlubmVybGlzdFtqXSk7XG4gICAgICAgICAgICAgICAgaiArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIChzdHJpcHMpIHdoaXRlc3BhY2UgZnJvbSBib3RoIGVuZHMgb2YgdGhlIHN0cmluZy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNi4wXG4gICAgICogQGNhdGVnb3J5IFN0cmluZ1xuICAgICAqIEBzaWcgU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byB0cmltLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVHJpbW1lZCB2ZXJzaW9uIG9mIGBzdHJgLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudHJpbSgnICAgeHl6ICAnKTsgLy89PiAneHl6J1xuICAgICAqICAgICAgUi5tYXAoUi50cmltLCBSLnNwbGl0KCcsJywgJ3gsIHksIHonKSk7IC8vPT4gWyd4JywgJ3knLCAneiddXG4gICAgICovXG4gICAgdmFyIHRyaW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB3cyA9ICdcXHRcXG5cXHgwQlxcZlxcciBcXHhBMFxcdTE2ODBcXHUxODBFXFx1MjAwMFxcdTIwMDFcXHUyMDAyXFx1MjAwMycgKyAnXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwQVxcdTIwMkZcXHUyMDVGXFx1MzAwMFxcdTIwMjgnICsgJ1xcdTIwMjlcXHVGRUZGJztcbiAgICAgICAgdmFyIHplcm9XaWR0aCA9ICdcXHUyMDBCJztcbiAgICAgICAgdmFyIGhhc1Byb3RvVHJpbSA9IHR5cGVvZiBTdHJpbmcucHJvdG90eXBlLnRyaW0gPT09ICdmdW5jdGlvbic7XG4gICAgICAgIGlmICghaGFzUHJvdG9UcmltIHx8ICh3cy50cmltKCkgfHwgIXplcm9XaWR0aC50cmltKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gX2N1cnJ5MShmdW5jdGlvbiB0cmltKHN0cikge1xuICAgICAgICAgICAgICAgIHZhciBiZWdpblJ4ID0gbmV3IFJlZ0V4cCgnXlsnICsgd3MgKyAnXVsnICsgd3MgKyAnXSonKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kUnggPSBuZXcgUmVnRXhwKCdbJyArIHdzICsgJ11bJyArIHdzICsgJ10qJCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZShiZWdpblJ4LCAnJykucmVwbGFjZShlbmRSeCwgJycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gX2N1cnJ5MShmdW5jdGlvbiB0cmltKHN0cikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHIudHJpbSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KCk7XG5cbiAgICAvKipcbiAgICAgKiBgdHJ5Q2F0Y2hgIHRha2VzIHR3byBmdW5jdGlvbnMsIGEgYHRyeWVyYCBhbmQgYSBgY2F0Y2hlcmAuIFRoZSByZXR1cm5lZFxuICAgICAqIGZ1bmN0aW9uIGV2YWx1YXRlcyB0aGUgYHRyeWVyYDsgaWYgaXQgZG9lcyBub3QgdGhyb3csIGl0IHNpbXBseSByZXR1cm5zIHRoZVxuICAgICAqIHJlc3VsdC4gSWYgdGhlIGB0cnllcmAgKmRvZXMqIHRocm93LCB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gZXZhbHVhdGVzIHRoZVxuICAgICAqIGBjYXRjaGVyYCBmdW5jdGlvbiBhbmQgcmV0dXJucyBpdHMgcmVzdWx0LiBOb3RlIHRoYXQgZm9yIGVmZmVjdGl2ZVxuICAgICAqIGNvbXBvc2l0aW9uIHdpdGggdGhpcyBmdW5jdGlvbiwgYm90aCB0aGUgYHRyeWVyYCBhbmQgYGNhdGNoZXJgIGZ1bmN0aW9uc1xuICAgICAqIG11c3QgcmV0dXJuIHRoZSBzYW1lIHR5cGUgb2YgcmVzdWx0cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMjAuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKC4uLnggLT4gYSkgLT4gKChlLCAuLi54KSAtPiBhKSAtPiAoLi4ueCAtPiBhKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHRyeWVyIFRoZSBmdW5jdGlvbiB0aGF0IG1heSB0aHJvdy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYXRjaGVyIFRoZSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXZhbHVhdGVkIGlmIGB0cnllcmAgdGhyb3dzLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB0aGF0IHdpbGwgY2F0Y2ggZXhjZXB0aW9ucyBhbmQgc2VuZCB0aGVuIHRvIHRoZSBjYXRjaGVyLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudHJ5Q2F0Y2goUi5wcm9wKCd4JyksIFIuRiwge3g6IHRydWV9KTsgLy89PiB0cnVlXG4gICAgICogICAgICBSLnRyeUNhdGNoKFIucHJvcCgneCcpLCBSLkYsIG51bGwpOyAgICAgIC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgdHJ5Q2F0Y2ggPSBfY3VycnkyKGZ1bmN0aW9uIF90cnlDYXRjaCh0cnllciwgY2F0Y2hlcikge1xuICAgICAgICByZXR1cm4gX2FyaXR5KHRyeWVyLmxlbmd0aCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ5ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2F0Y2hlci5hcHBseSh0aGlzLCBfY29uY2F0KFtlXSwgYXJndW1lbnRzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogR2l2ZXMgYSBzaW5nbGUtd29yZCBzdHJpbmcgZGVzY3JpcHRpb24gb2YgdGhlIChuYXRpdmUpIHR5cGUgb2YgYSB2YWx1ZSxcbiAgICAgKiByZXR1cm5pbmcgc3VjaCBhbnN3ZXJzIGFzICdPYmplY3QnLCAnTnVtYmVyJywgJ0FycmF5Jywgb3IgJ051bGwnLiBEb2VzIG5vdFxuICAgICAqIGF0dGVtcHQgdG8gZGlzdGluZ3Vpc2ggdXNlciBPYmplY3QgdHlwZXMgYW55IGZ1cnRoZXIsIHJlcG9ydGluZyB0aGVtIGFsbCBhc1xuICAgICAqICdPYmplY3QnLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC44LjBcbiAgICAgKiBAY2F0ZWdvcnkgVHlwZVxuICAgICAqIEBzaWcgKCogLT4geyp9KSAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0geyp9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnR5cGUoe30pOyAvLz0+IFwiT2JqZWN0XCJcbiAgICAgKiAgICAgIFIudHlwZSgxKTsgLy89PiBcIk51bWJlclwiXG4gICAgICogICAgICBSLnR5cGUoZmFsc2UpOyAvLz0+IFwiQm9vbGVhblwiXG4gICAgICogICAgICBSLnR5cGUoJ3MnKTsgLy89PiBcIlN0cmluZ1wiXG4gICAgICogICAgICBSLnR5cGUobnVsbCk7IC8vPT4gXCJOdWxsXCJcbiAgICAgKiAgICAgIFIudHlwZShbXSk7IC8vPT4gXCJBcnJheVwiXG4gICAgICogICAgICBSLnR5cGUoL1tBLXpdLyk7IC8vPT4gXCJSZWdFeHBcIlxuICAgICAqL1xuICAgIHZhciB0eXBlID0gX2N1cnJ5MShmdW5jdGlvbiB0eXBlKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsID09PSBudWxsID8gJ051bGwnIDogdmFsID09PSB1bmRlZmluZWQgPyAnVW5kZWZpbmVkJyA6IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpLnNsaWNlKDgsIC0xKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgZnVuY3Rpb24gYGZuYCwgd2hpY2ggdGFrZXMgYSBzaW5nbGUgYXJyYXkgYXJndW1lbnQsIGFuZCByZXR1cm5zIGFcbiAgICAgKiBmdW5jdGlvbiB3aGljaDpcbiAgICAgKlxuICAgICAqICAgLSB0YWtlcyBhbnkgbnVtYmVyIG9mIHBvc2l0aW9uYWwgYXJndW1lbnRzO1xuICAgICAqICAgLSBwYXNzZXMgdGhlc2UgYXJndW1lbnRzIHRvIGBmbmAgYXMgYW4gYXJyYXk7IGFuZFxuICAgICAqICAgLSByZXR1cm5zIHRoZSByZXN1bHQuXG4gICAgICpcbiAgICAgKiBJbiBvdGhlciB3b3JkcywgUi51bmFwcGx5IGRlcml2ZXMgYSB2YXJpYWRpYyBmdW5jdGlvbiBmcm9tIGEgZnVuY3Rpb24gd2hpY2hcbiAgICAgKiB0YWtlcyBhbiBhcnJheS4gUi51bmFwcGx5IGlzIHRoZSBpbnZlcnNlIG9mIFIuYXBwbHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjguMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKFsqLi4uXSAtPiBhKSAtPiAoKi4uLiAtPiBhKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQHNlZSBSLmFwcGx5XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi51bmFwcGx5KEpTT04uc3RyaW5naWZ5KSgxLCAyLCAzKTsgLy89PiAnWzEsMiwzXSdcbiAgICAgKi9cbiAgICB2YXIgdW5hcHBseSA9IF9jdXJyeTEoZnVuY3Rpb24gdW5hcHBseShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZuKF9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFdyYXBzIGEgZnVuY3Rpb24gb2YgYW55IGFyaXR5IChpbmNsdWRpbmcgbnVsbGFyeSkgaW4gYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHNcbiAgICAgKiBleGFjdGx5IDEgcGFyYW1ldGVyLiBBbnkgZXh0cmFuZW91cyBwYXJhbWV0ZXJzIHdpbGwgbm90IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgKiBzdXBwbGllZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKiAtPiBiKSAtPiAoYSAtPiBiKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB3cmFwcGluZyBgZm5gLiBUaGUgbmV3IGZ1bmN0aW9uIGlzIGd1YXJhbnRlZWQgdG8gYmUgb2ZcbiAgICAgKiAgICAgICAgIGFyaXR5IDEuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHRha2VzVHdvQXJncyA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgKiAgICAgICAgcmV0dXJuIFthLCBiXTtcbiAgICAgKiAgICAgIH07XG4gICAgICogICAgICB0YWtlc1R3b0FyZ3MubGVuZ3RoOyAvLz0+IDJcbiAgICAgKiAgICAgIHRha2VzVHdvQXJncygxLCAyKTsgLy89PiBbMSwgMl1cbiAgICAgKlxuICAgICAqICAgICAgdmFyIHRha2VzT25lQXJnID0gUi51bmFyeSh0YWtlc1R3b0FyZ3MpO1xuICAgICAqICAgICAgdGFrZXNPbmVBcmcubGVuZ3RoOyAvLz0+IDFcbiAgICAgKiAgICAgIC8vIE9ubHkgMSBhcmd1bWVudCBpcyBwYXNzZWQgdG8gdGhlIHdyYXBwZWQgZnVuY3Rpb25cbiAgICAgKiAgICAgIHRha2VzT25lQXJnKDEsIDIpOyAvLz0+IFsxLCB1bmRlZmluZWRdXG4gICAgICovXG4gICAgdmFyIHVuYXJ5ID0gX2N1cnJ5MShmdW5jdGlvbiB1bmFyeShmbikge1xuICAgICAgICByZXR1cm4gbkFyeSgxLCBmbik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gb2YgYXJpdHkgYG5gIGZyb20gYSAobWFudWFsbHkpIGN1cnJpZWQgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIE51bWJlciAtPiAoYSAtPiBiKSAtPiAoYSAtPiBjKVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggVGhlIGFyaXR5IGZvciB0aGUgcmV0dXJuZWQgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHVuY3VycnkuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uLlxuICAgICAqIEBzZWUgUi5jdXJyeVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBhZGRGb3VyID0gYSA9PiBiID0+IGMgPT4gZCA9PiBhICsgYiArIGMgKyBkO1xuICAgICAqXG4gICAgICogICAgICB2YXIgdW5jdXJyaWVkQWRkRm91ciA9IFIudW5jdXJyeU4oNCwgYWRkRm91cik7XG4gICAgICogICAgICB1bmN1cnJpZWRBZGRGb3VyKDEsIDIsIDMsIDQpOyAvLz0+IDEwXG4gICAgICovXG4gICAgdmFyIHVuY3VycnlOID0gX2N1cnJ5MihmdW5jdGlvbiB1bmN1cnJ5TihkZXB0aCwgZm4pIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5TihkZXB0aCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnREZXB0aCA9IDE7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbjtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgdmFyIGVuZElkeDtcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50RGVwdGggPD0gZGVwdGggJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZW5kSWR4ID0gY3VycmVudERlcHRoID09PSBkZXB0aCA/IGFyZ3VtZW50cy5sZW5ndGggOiBpZHggKyB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5hcHBseSh0aGlzLCBfc2xpY2UoYXJndW1lbnRzLCBpZHgsIGVuZElkeCkpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnREZXB0aCArPSAxO1xuICAgICAgICAgICAgICAgIGlkeCA9IGVuZElkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgYSBsaXN0IGZyb20gYSBzZWVkIHZhbHVlLiBBY2NlcHRzIGFuIGl0ZXJhdG9yIGZ1bmN0aW9uLCB3aGljaCByZXR1cm5zXG4gICAgICogZWl0aGVyIGZhbHNlIHRvIHN0b3AgaXRlcmF0aW9uIG9yIGFuIGFycmF5IG9mIGxlbmd0aCAyIGNvbnRhaW5pbmcgdGhlIHZhbHVlXG4gICAgICogdG8gYWRkIHRvIHRoZSByZXN1bHRpbmcgbGlzdCBhbmQgdGhlIHNlZWQgdG8gYmUgdXNlZCBpbiB0aGUgbmV4dCBjYWxsIHRvIHRoZVxuICAgICAqIGl0ZXJhdG9yIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIHJlY2VpdmVzIG9uZSBhcmd1bWVudDogKihzZWVkKSouXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gW2JdKSAtPiAqIC0+IFtiXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBpdGVyYXRvciBmdW5jdGlvbi4gcmVjZWl2ZXMgb25lIGFyZ3VtZW50LCBgc2VlZGAsIGFuZCByZXR1cm5zXG4gICAgICogICAgICAgIGVpdGhlciBmYWxzZSB0byBxdWl0IGl0ZXJhdGlvbiBvciBhbiBhcnJheSBvZiBsZW5ndGggdHdvIHRvIHByb2NlZWQuIFRoZSBlbGVtZW50XG4gICAgICogICAgICAgIGF0IGluZGV4IDAgb2YgdGhpcyBhcnJheSB3aWxsIGJlIGFkZGVkIHRvIHRoZSByZXN1bHRpbmcgYXJyYXksIGFuZCB0aGUgZWxlbWVudFxuICAgICAqICAgICAgICBhdCBpbmRleCAxIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBuZXh0IGNhbGwgdG8gYGZuYC5cbiAgICAgKiBAcGFyYW0geyp9IHNlZWQgVGhlIHNlZWQgdmFsdWUuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBmaW5hbCBsaXN0LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBmID0gbiA9PiBuID4gNTAgPyBmYWxzZSA6IFstbiwgbiArIDEwXTtcbiAgICAgKiAgICAgIFIudW5mb2xkKGYsIDEwKTsgLy89PiBbLTEwLCAtMjAsIC0zMCwgLTQwLCAtNTBdXG4gICAgICovXG4gICAgdmFyIHVuZm9sZCA9IF9jdXJyeTIoZnVuY3Rpb24gdW5mb2xkKGZuLCBzZWVkKSB7XG4gICAgICAgIHZhciBwYWlyID0gZm4oc2VlZCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgd2hpbGUgKHBhaXIgJiYgcGFpci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHBhaXJbMF07XG4gICAgICAgICAgICBwYWlyID0gZm4ocGFpclsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIG9ubHkgb25lIGNvcHkgb2YgZWFjaCBlbGVtZW50IGluIHRoZSBvcmlnaW5hbFxuICAgICAqIGxpc3QsIGJhc2VkIHVwb24gdGhlIHZhbHVlIHJldHVybmVkIGJ5IGFwcGx5aW5nIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgdG9cbiAgICAgKiB0d28gbGlzdCBlbGVtZW50cy4gUHJlZmVycyB0aGUgZmlyc3QgaXRlbSBpZiB0d28gaXRlbXMgY29tcGFyZSBlcXVhbCBiYXNlZFxuICAgICAqIG9uIHRoZSBwcmVkaWNhdGUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSwgYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBBIHByZWRpY2F0ZSB1c2VkIHRvIHRlc3Qgd2hldGhlciB0d28gaXRlbXMgYXJlIGVxdWFsLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBvZiB1bmlxdWUgaXRlbXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHN0ckVxID0gUi5lcUJ5KFN0cmluZyk7XG4gICAgICogICAgICBSLnVuaXFXaXRoKHN0ckVxKShbMSwgJzEnLCAyLCAxXSk7IC8vPT4gWzEsIDJdXG4gICAgICogICAgICBSLnVuaXFXaXRoKHN0ckVxKShbe30sIHt9XSk7ICAgICAgIC8vPT4gW3t9XVxuICAgICAqICAgICAgUi51bmlxV2l0aChzdHJFcSkoWzEsICcxJywgMV0pOyAgICAvLz0+IFsxXVxuICAgICAqICAgICAgUi51bmlxV2l0aChzdHJFcSkoWycxJywgMSwgMV0pOyAgICAvLz0+IFsnMSddXG4gICAgICovXG4gICAgdmFyIHVuaXFXaXRoID0gX2N1cnJ5MihmdW5jdGlvbiB1bmlxV2l0aChwcmVkLCBsaXN0KSB7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2lkeF07XG4gICAgICAgICAgICBpZiAoIV9jb250YWluc1dpdGgocHJlZCwgaXRlbSwgcmVzdWx0KSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IGl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGVzdHMgdGhlIGZpbmFsIGFyZ3VtZW50IGJ5IHBhc3NpbmcgaXQgdG8gdGhlIGdpdmVuIHByZWRpY2F0ZSBmdW5jdGlvbi4gSWZcbiAgICAgKiB0aGUgcHJlZGljYXRlIGlzIG5vdCBzYXRpc2ZpZWQsIHRoZSBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgcmVzdWx0IG9mXG4gICAgICogY2FsbGluZyB0aGUgYHdoZW5GYWxzZUZuYCBmdW5jdGlvbiB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50LiBJZiB0aGUgcHJlZGljYXRlXG4gICAgICogaXMgc2F0aXNmaWVkLCB0aGUgYXJndW1lbnQgaXMgcmV0dXJuZWQgYXMgaXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE4LjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IChhIC0+IGEpIC0+IGEgLT4gYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgICAgICAgIEEgcHJlZGljYXRlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gd2hlbkZhbHNlRm4gQSBmdW5jdGlvbiB0byBpbnZva2Ugd2hlbiB0aGUgYHByZWRgIGV2YWx1YXRlc1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIGEgZmFsc3kgdmFsdWUuXG4gICAgICogQHBhcmFtIHsqfSAgICAgICAgeCAgICAgICAgICAgQW4gb2JqZWN0IHRvIHRlc3Qgd2l0aCB0aGUgYHByZWRgIGZ1bmN0aW9uIGFuZFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3MgdG8gYHdoZW5GYWxzZUZuYCBpZiBuZWNlc3NhcnkuXG4gICAgICogQHJldHVybiB7Kn0gRWl0aGVyIGB4YCBvciB0aGUgcmVzdWx0IG9mIGFwcGx5aW5nIGB4YCB0byBgd2hlbkZhbHNlRm5gLlxuICAgICAqIEBzZWUgUi5pZkVsc2UsIFIud2hlblxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vIGNvZXJjZUFycmF5IDo6IChhfFthXSkgLT4gW2FdXG4gICAgICogICAgICB2YXIgY29lcmNlQXJyYXkgPSBSLnVubGVzcyhSLmlzQXJyYXlMaWtlLCBSLm9mKTtcbiAgICAgKiAgICAgIGNvZXJjZUFycmF5KFsxLCAyLCAzXSk7IC8vPT4gWzEsIDIsIDNdXG4gICAgICogICAgICBjb2VyY2VBcnJheSgxKTsgICAgICAgICAvLz0+IFsxXVxuICAgICAqL1xuICAgIHZhciB1bmxlc3MgPSBfY3VycnkzKGZ1bmN0aW9uIHVubGVzcyhwcmVkLCB3aGVuRmFsc2VGbiwgeCkge1xuICAgICAgICByZXR1cm4gcHJlZCh4KSA/IHggOiB3aGVuRmFsc2VGbih4KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgcHJlZGljYXRlLCBhIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9uLCBhbmQgYW4gaW5pdGlhbCB2YWx1ZSxcbiAgICAgKiBhbmQgcmV0dXJucyBhIHZhbHVlIG9mIHRoZSBzYW1lIHR5cGUgYXMgdGhlIGluaXRpYWwgdmFsdWUuXG4gICAgICogSXQgZG9lcyBzbyBieSBhcHBseWluZyB0aGUgdHJhbnNmb3JtYXRpb24gdW50aWwgdGhlIHByZWRpY2F0ZSBpcyBzYXRpc2ZpZWQsXG4gICAgICogYXQgd2hpY2ggcG9pbnQgaXQgcmV0dXJucyB0aGUgc2F0aXNmYWN0b3J5IHZhbHVlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4yMC4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiAoYSAtPiBhKSAtPiBhIC0+IGFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIEEgcHJlZGljYXRlIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHsqfSBpbml0IEluaXRpYWwgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHsqfSBGaW5hbCB2YWx1ZSB0aGF0IHNhdGlzZmllcyBwcmVkaWNhdGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnVudGlsKFIuZ3QoUi5fXywgMTAwKSwgUi5tdWx0aXBseSgyKSkoMSkgLy8gPT4gMTI4XG4gICAgICovXG4gICAgdmFyIHVudGlsID0gX2N1cnJ5MyhmdW5jdGlvbiB1bnRpbChwcmVkLCBmbiwgaW5pdCkge1xuICAgICAgICB2YXIgdmFsID0gaW5pdDtcbiAgICAgICAgd2hpbGUgKCFwcmVkKHZhbCkpIHtcbiAgICAgICAgICAgIHZhbCA9IGZuKHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgY29weSBvZiB0aGUgYXJyYXkgd2l0aCB0aGUgZWxlbWVudCBhdCB0aGUgcHJvdmlkZWQgaW5kZXhcbiAgICAgKiByZXBsYWNlZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gYSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGlkeCBUaGUgaW5kZXggdG8gdXBkYXRlLlxuICAgICAqIEBwYXJhbSB7Kn0geCBUaGUgdmFsdWUgdG8gZXhpc3QgYXQgdGhlIGdpdmVuIGluZGV4IG9mIHRoZSByZXR1cm5lZCBhcnJheS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fEFyZ3VtZW50c30gbGlzdCBUaGUgc291cmNlIGFycmF5LWxpa2Ugb2JqZWN0IHRvIGJlIHVwZGF0ZWQuXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgY29weSBvZiBgbGlzdGAgd2l0aCB0aGUgdmFsdWUgYXQgaW5kZXggYGlkeGAgcmVwbGFjZWQgd2l0aCBgeGAuXG4gICAgICogQHNlZSBSLmFkanVzdFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudXBkYXRlKDEsIDExLCBbMCwgMSwgMl0pOyAgICAgLy89PiBbMCwgMTEsIDJdXG4gICAgICogICAgICBSLnVwZGF0ZSgxKSgxMSkoWzAsIDEsIDJdKTsgICAgIC8vPT4gWzAsIDExLCAyXVxuICAgICAqL1xuICAgIHZhciB1cGRhdGUgPSBfY3VycnkzKGZ1bmN0aW9uIHVwZGF0ZShpZHgsIHgsIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIGFkanVzdChhbHdheXMoeCksIGlkeCwgbGlzdCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBBY2NlcHRzIGEgZnVuY3Rpb24gYGZuYCBhbmQgYSBsaXN0IG9mIHRyYW5zZm9ybWVyIGZ1bmN0aW9ucyBhbmQgcmV0dXJucyBhXG4gICAgICogbmV3IGN1cnJpZWQgZnVuY3Rpb24uIFdoZW4gdGhlIG5ldyBmdW5jdGlvbiBpcyBpbnZva2VkLCBpdCBjYWxscyB0aGVcbiAgICAgKiBmdW5jdGlvbiBgZm5gIHdpdGggcGFyYW1ldGVycyBjb25zaXN0aW5nIG9mIHRoZSByZXN1bHQgb2YgY2FsbGluZyBlYWNoXG4gICAgICogc3VwcGxpZWQgaGFuZGxlciBvbiBzdWNjZXNzaXZlIGFyZ3VtZW50cyB0byB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogSWYgbW9yZSBhcmd1bWVudHMgYXJlIHBhc3NlZCB0byB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gdGhhbiB0cmFuc2Zvcm1lclxuICAgICAqIGZ1bmN0aW9ucywgdGhvc2UgYXJndW1lbnRzIGFyZSBwYXNzZWQgZGlyZWN0bHkgdG8gYGZuYCBhcyBhZGRpdGlvbmFsXG4gICAgICogcGFyYW1ldGVycy4gSWYgeW91IGV4cGVjdCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0aGF0IGRvbid0IG5lZWQgdG8gYmVcbiAgICAgKiB0cmFuc2Zvcm1lZCwgYWx0aG91Z2ggeW91IGNhbiBpZ25vcmUgdGhlbSwgaXQncyBiZXN0IHRvIHBhc3MgYW4gaWRlbnRpdHlcbiAgICAgKiBmdW5jdGlvbiBzbyB0aGF0IHRoZSBuZXcgZnVuY3Rpb24gcmVwb3J0cyB0aGUgY29ycmVjdCBhcml0eS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoeDEgLT4geDIgLT4gLi4uIC0+IHopIC0+IFsoYSAtPiB4MSksIChiIC0+IHgyKSwgLi4uXSAtPiAoYSAtPiBiIC0+IC4uLiAtPiB6KVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHRyYW5zZm9ybWVycyBBIGxpc3Qgb2YgdHJhbnNmb3JtZXIgZnVuY3Rpb25zXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSB3cmFwcGVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudXNlV2l0aChNYXRoLnBvdywgW1IuaWRlbnRpdHksIFIuaWRlbnRpdHldKSgzLCA0KTsgLy89PiA4MVxuICAgICAqICAgICAgUi51c2VXaXRoKE1hdGgucG93LCBbUi5pZGVudGl0eSwgUi5pZGVudGl0eV0pKDMpKDQpOyAvLz0+IDgxXG4gICAgICogICAgICBSLnVzZVdpdGgoTWF0aC5wb3csIFtSLmRlYywgUi5pbmNdKSgzLCA0KTsgLy89PiAzMlxuICAgICAqICAgICAgUi51c2VXaXRoKE1hdGgucG93LCBbUi5kZWMsIFIuaW5jXSkoMykoNCk7IC8vPT4gMzJcbiAgICAgKi9cbiAgICB2YXIgdXNlV2l0aCA9IF9jdXJyeTIoZnVuY3Rpb24gdXNlV2l0aChmbiwgdHJhbnNmb3JtZXJzKSB7XG4gICAgICAgIHJldHVybiBjdXJyeU4odHJhbnNmb3JtZXJzLmxlbmd0aCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IHRyYW5zZm9ybWVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2godHJhbnNmb3JtZXJzW2lkeF0uY2FsbCh0aGlzLCBhcmd1bWVudHNbaWR4XSkpO1xuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MuY29uY2F0KF9zbGljZShhcmd1bWVudHMsIHRyYW5zZm9ybWVycy5sZW5ndGgpKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIHRoZSBlbnVtZXJhYmxlIG93biBwcm9wZXJ0aWVzIG9mIHRoZSBzdXBwbGllZCBvYmplY3QuXG4gICAgICogTm90ZSB0aGF0IHRoZSBvcmRlciBvZiB0aGUgb3V0cHV0IGFycmF5IGlzIG5vdCBndWFyYW50ZWVkIGFjcm9zcyBkaWZmZXJlbnRcbiAgICAgKiBKUyBwbGF0Zm9ybXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtrOiB2fSAtPiBbdl1cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZXh0cmFjdCB2YWx1ZXMgZnJvbVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiB0aGUgdmFsdWVzIG9mIHRoZSBvYmplY3QncyBvd24gcHJvcGVydGllcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnZhbHVlcyh7YTogMSwgYjogMiwgYzogM30pOyAvLz0+IFsxLCAyLCAzXVxuICAgICAqL1xuICAgIHZhciB2YWx1ZXMgPSBfY3VycnkxKGZ1bmN0aW9uIHZhbHVlcyhvYmopIHtcbiAgICAgICAgdmFyIHByb3BzID0ga2V5cyhvYmopO1xuICAgICAgICB2YXIgbGVuID0gcHJvcHMubGVuZ3RoO1xuICAgICAgICB2YXIgdmFscyA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgdmFsc1tpZHhdID0gb2JqW3Byb3BzW2lkeF1dO1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHM7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIHByb3BlcnRpZXMsIGluY2x1ZGluZyBwcm90b3R5cGUgcHJvcGVydGllcywgb2YgdGhlXG4gICAgICogc3VwcGxpZWQgb2JqZWN0LlxuICAgICAqIE5vdGUgdGhhdCB0aGUgb3JkZXIgb2YgdGhlIG91dHB1dCBhcnJheSBpcyBub3QgZ3VhcmFudGVlZCB0byBiZSBjb25zaXN0ZW50XG4gICAgICogYWNyb3NzIGRpZmZlcmVudCBKUyBwbGF0Zm9ybXMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAc2lnIHtrOiB2fSAtPiBbdl1cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZXh0cmFjdCB2YWx1ZXMgZnJvbVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiB0aGUgdmFsdWVzIG9mIHRoZSBvYmplY3QncyBvd24gYW5kIHByb3RvdHlwZSBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBGID0gZnVuY3Rpb24oKSB7IHRoaXMueCA9ICdYJzsgfTtcbiAgICAgKiAgICAgIEYucHJvdG90eXBlLnkgPSAnWSc7XG4gICAgICogICAgICB2YXIgZiA9IG5ldyBGKCk7XG4gICAgICogICAgICBSLnZhbHVlc0luKGYpOyAvLz0+IFsnWCcsICdZJ11cbiAgICAgKi9cbiAgICB2YXIgdmFsdWVzSW4gPSBfY3VycnkxKGZ1bmN0aW9uIHZhbHVlc0luKG9iaikge1xuICAgICAgICB2YXIgcHJvcDtcbiAgICAgICAgdmFyIHZzID0gW107XG4gICAgICAgIGZvciAocHJvcCBpbiBvYmopIHtcbiAgICAgICAgICAgIHZzW3ZzLmxlbmd0aF0gPSBvYmpbcHJvcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZzO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIFwidmlld1wiIG9mIHRoZSBnaXZlbiBkYXRhIHN0cnVjdHVyZSwgZGV0ZXJtaW5lZCBieSB0aGUgZ2l2ZW4gbGVucy5cbiAgICAgKiBUaGUgbGVucydzIGZvY3VzIGRldGVybWluZXMgd2hpY2ggcG9ydGlvbiBvZiB0aGUgZGF0YSBzdHJ1Y3R1cmUgaXMgdmlzaWJsZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAdHlwZWRlZm4gTGVucyBzIGEgPSBGdW5jdG9yIGYgPT4gKGEgLT4gZiBhKSAtPiBzIC0+IGYgc1xuICAgICAqIEBzaWcgTGVucyBzIGEgLT4gcyAtPiBhXG4gICAgICogQHBhcmFtIHtMZW5zfSBsZW5zXG4gICAgICogQHBhcmFtIHsqfSB4XG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIucHJvcCwgUi5sZW5zSW5kZXgsIFIubGVuc1Byb3BcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgeExlbnMgPSBSLmxlbnNQcm9wKCd4Jyk7XG4gICAgICpcbiAgICAgKiAgICAgIFIudmlldyh4TGVucywge3g6IDEsIHk6IDJ9KTsgIC8vPT4gMVxuICAgICAqICAgICAgUi52aWV3KHhMZW5zLCB7eDogNCwgeTogMn0pOyAgLy89PiA0XG4gICAgICovXG4gICAgLy8gYENvbnN0YCBpcyBhIGZ1bmN0b3IgdGhhdCBlZmZlY3RpdmVseSBpZ25vcmVzIHRoZSBmdW5jdGlvbiBnaXZlbiB0byBgbWFwYC5cbiAgICAvLyBVc2luZyBgQ29uc3RgIGVmZmVjdGl2ZWx5IGlnbm9yZXMgdGhlIHNldHRlciBmdW5jdGlvbiBvZiB0aGUgYGxlbnNgLFxuICAgIC8vIGxlYXZpbmcgdGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoZSBnZXR0ZXIgZnVuY3Rpb24gdW5tb2RpZmllZC5cbiAgICB2YXIgdmlldyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gYENvbnN0YCBpcyBhIGZ1bmN0b3IgdGhhdCBlZmZlY3RpdmVseSBpZ25vcmVzIHRoZSBmdW5jdGlvbiBnaXZlbiB0byBgbWFwYC5cbiAgICAgICAgdmFyIENvbnN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHgsXG4gICAgICAgICAgICAgICAgbWFwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIHZpZXcobGVucywgeCkge1xuICAgICAgICAgICAgLy8gVXNpbmcgYENvbnN0YCBlZmZlY3RpdmVseSBpZ25vcmVzIHRoZSBzZXR0ZXIgZnVuY3Rpb24gb2YgdGhlIGBsZW5zYCxcbiAgICAgICAgICAgIC8vIGxlYXZpbmcgdGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoZSBnZXR0ZXIgZnVuY3Rpb24gdW5tb2RpZmllZC5cbiAgICAgICAgICAgIHJldHVybiBsZW5zKENvbnN0KSh4KS52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogVGVzdHMgdGhlIGZpbmFsIGFyZ3VtZW50IGJ5IHBhc3NpbmcgaXQgdG8gdGhlIGdpdmVuIHByZWRpY2F0ZSBmdW5jdGlvbi4gSWZcbiAgICAgKiB0aGUgcHJlZGljYXRlIGlzIHNhdGlzZmllZCwgdGhlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSByZXN1bHQgb2YgY2FsbGluZ1xuICAgICAqIHRoZSBgd2hlblRydWVGbmAgZnVuY3Rpb24gd2l0aCB0aGUgc2FtZSBhcmd1bWVudC4gSWYgdGhlIHByZWRpY2F0ZSBpcyBub3RcbiAgICAgKiBzYXRpc2ZpZWQsIHRoZSBhcmd1bWVudCBpcyByZXR1cm5lZCBhcyBpcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTguMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgKGEgLT4gQm9vbGVhbikgLT4gKGEgLT4gYSkgLT4gYSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCAgICAgICBBIHByZWRpY2F0ZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHdoZW5UcnVlRm4gQSBmdW5jdGlvbiB0byBpbnZva2Ugd2hlbiB0aGUgYGNvbmRpdGlvbmBcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2YWx1YXRlcyB0byBhIHRydXRoeSB2YWx1ZS5cbiAgICAgKiBAcGFyYW0geyp9ICAgICAgICB4ICAgICAgICAgIEFuIG9iamVjdCB0byB0ZXN0IHdpdGggdGhlIGBwcmVkYCBmdW5jdGlvbiBhbmRcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3MgdG8gYHdoZW5UcnVlRm5gIGlmIG5lY2Vzc2FyeS5cbiAgICAgKiBAcmV0dXJuIHsqfSBFaXRoZXIgYHhgIG9yIHRoZSByZXN1bHQgb2YgYXBwbHlpbmcgYHhgIHRvIGB3aGVuVHJ1ZUZuYC5cbiAgICAgKiBAc2VlIFIuaWZFbHNlLCBSLnVubGVzc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vIHRydW5jYXRlIDo6IFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiAgICAgIHZhciB0cnVuY2F0ZSA9IFIud2hlbihcbiAgICAgKiAgICAgICAgUi5wcm9wU2F0aXNmaWVzKFIuZ3QoUi5fXywgMTApLCAnbGVuZ3RoJyksXG4gICAgICogICAgICAgIFIucGlwZShSLnRha2UoMTApLCBSLmFwcGVuZCgn4oCmJyksIFIuam9pbignJykpXG4gICAgICogICAgICApO1xuICAgICAqICAgICAgdHJ1bmNhdGUoJzEyMzQ1Jyk7ICAgICAgICAgLy89PiAnMTIzNDUnXG4gICAgICogICAgICB0cnVuY2F0ZSgnMDEyMzQ1Njc4OUFCQycpOyAvLz0+ICcwMTIzNDU2Nzg54oCmJ1xuICAgICAqL1xuICAgIHZhciB3aGVuID0gX2N1cnJ5MyhmdW5jdGlvbiB3aGVuKHByZWQsIHdoZW5UcnVlRm4sIHgpIHtcbiAgICAgICAgcmV0dXJuIHByZWQoeCkgPyB3aGVuVHJ1ZUZuKHgpIDogeDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgc3BlYyBvYmplY3QgYW5kIGEgdGVzdCBvYmplY3Q7IHJldHVybnMgdHJ1ZSBpZiB0aGUgdGVzdCBzYXRpc2ZpZXNcbiAgICAgKiB0aGUgc3BlYy4gRWFjaCBvZiB0aGUgc3BlYydzIG93biBwcm9wZXJ0aWVzIG11c3QgYmUgYSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAgICogRWFjaCBwcmVkaWNhdGUgaXMgYXBwbGllZCB0byB0aGUgdmFsdWUgb2YgdGhlIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgb2YgdGhlXG4gICAgICogdGVzdCBvYmplY3QuIGB3aGVyZWAgcmV0dXJucyB0cnVlIGlmIGFsbCB0aGUgcHJlZGljYXRlcyByZXR1cm4gdHJ1ZSwgZmFsc2VcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBgd2hlcmVgIGlzIHdlbGwgc3VpdGVkIHRvIGRlY2xhcmF0aXZlbHkgZXhwcmVzc2luZyBjb25zdHJhaW50cyBmb3Igb3RoZXJcbiAgICAgKiBmdW5jdGlvbnMgc3VjaCBhcyBgZmlsdGVyYCBhbmQgYGZpbmRgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjFcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7U3RyaW5nOiAoKiAtPiBCb29sZWFuKX0gLT4ge1N0cmluZzogKn0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcGVjXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHRlc3RPYmpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vIHByZWQgOjogT2JqZWN0IC0+IEJvb2xlYW5cbiAgICAgKiAgICAgIHZhciBwcmVkID0gUi53aGVyZSh7XG4gICAgICogICAgICAgIGE6IFIuZXF1YWxzKCdmb28nKSxcbiAgICAgKiAgICAgICAgYjogUi5jb21wbGVtZW50KFIuZXF1YWxzKCdiYXInKSksXG4gICAgICogICAgICAgIHg6IFIuZ3QoXywgMTApLFxuICAgICAqICAgICAgICB5OiBSLmx0KF8sIDIwKVxuICAgICAqICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIHByZWQoe2E6ICdmb28nLCBiOiAneHh4JywgeDogMTEsIHk6IDE5fSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgcHJlZCh7YTogJ3h4eCcsIGI6ICd4eHgnLCB4OiAxMSwgeTogMTl9KTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgcHJlZCh7YTogJ2ZvbycsIGI6ICdiYXInLCB4OiAxMSwgeTogMTl9KTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgcHJlZCh7YTogJ2ZvbycsIGI6ICd4eHgnLCB4OiAxMCwgeTogMTl9KTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgcHJlZCh7YTogJ2ZvbycsIGI6ICd4eHgnLCB4OiAxMSwgeTogMjB9KTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciB3aGVyZSA9IF9jdXJyeTIoZnVuY3Rpb24gd2hlcmUoc3BlYywgdGVzdE9iaikge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNwZWMpIHtcbiAgICAgICAgICAgIGlmIChfaGFzKHByb3AsIHNwZWMpICYmICFzcGVjW3Byb3BdKHRlc3RPYmpbcHJvcF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogV3JhcCBhIGZ1bmN0aW9uIGluc2lkZSBhbm90aGVyIHRvIGFsbG93IHlvdSB0byBtYWtlIGFkanVzdG1lbnRzIHRvIHRoZVxuICAgICAqIHBhcmFtZXRlcnMsIG9yIGRvIG90aGVyIHByb2Nlc3NpbmcgZWl0aGVyIGJlZm9yZSB0aGUgaW50ZXJuYWwgZnVuY3Rpb24gaXNcbiAgICAgKiBjYWxsZWQgb3Igd2l0aCBpdHMgcmVzdWx0cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoYS4uLiAtPiBiKSAtPiAoKGEuLi4gLT4gYikgLT4gYS4uLiAtPiBjKSAtPiAoYS4uLiAtPiBjKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHdyYXBwZXIgVGhlIHdyYXBwZXIgZnVuY3Rpb24uXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSB3cmFwcGVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBncmVldCA9IG5hbWUgPT4gJ0hlbGxvICcgKyBuYW1lO1xuICAgICAqXG4gICAgICogICAgICB2YXIgc2hvdXRlZEdyZWV0ID0gUi53cmFwKGdyZWV0LCAoZ3IsIG5hbWUpID0+IGdyKG5hbWUpLnRvVXBwZXJDYXNlKCkpO1xuICAgICAqXG4gICAgICogICAgICBzaG91dGVkR3JlZXQoXCJLYXRoeVwiKTsgLy89PiBcIkhFTExPIEtBVEhZXCJcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNob3J0ZW5lZEdyZWV0ID0gUi53cmFwKGdyZWV0LCBmdW5jdGlvbihnciwgbmFtZSkge1xuICAgICAqICAgICAgICByZXR1cm4gZ3IobmFtZS5zdWJzdHJpbmcoMCwgMykpO1xuICAgICAqICAgICAgfSk7XG4gICAgICogICAgICBzaG9ydGVuZWRHcmVldChcIlJvYmVydFwiKTsgLy89PiBcIkhlbGxvIFJvYlwiXG4gICAgICovXG4gICAgdmFyIHdyYXAgPSBfY3VycnkyKGZ1bmN0aW9uIHdyYXAoZm4sIHdyYXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5Tihmbi5sZW5ndGgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyLmFwcGx5KHRoaXMsIF9jb25jYXQoW2ZuXSwgYXJndW1lbnRzKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBsaXN0IG91dCBvZiB0aGUgdHdvIHN1cHBsaWVkIGJ5IGNyZWF0aW5nIGVhY2ggcG9zc2libGUgcGFpclxuICAgICAqIGZyb20gdGhlIGxpc3RzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFtiXSAtPiBbW2EsYl1dXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXMgVGhlIGZpcnN0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gYnMgVGhlIHNlY29uZCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBtYWRlIGJ5IGNvbWJpbmluZyBlYWNoIHBvc3NpYmxlIHBhaXIgZnJvbVxuICAgICAqICAgICAgICAgYGFzYCBhbmQgYGJzYCBpbnRvIHBhaXJzIChgW2EsIGJdYCkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi54cHJvZChbMSwgMl0sIFsnYScsICdiJ10pOyAvLz0+IFtbMSwgJ2EnXSwgWzEsICdiJ10sIFsyLCAnYSddLCBbMiwgJ2InXV1cbiAgICAgKi9cbiAgICAvLyA9IHhwcm9kV2l0aChwcmVwZW5kKTsgKHRha2VzIGFib3V0IDMgdGltZXMgYXMgbG9uZy4uLilcbiAgICB2YXIgeHByb2QgPSBfY3VycnkyKGZ1bmN0aW9uIHhwcm9kKGEsIGIpIHtcbiAgICAgICAgLy8gPSB4cHJvZFdpdGgocHJlcGVuZCk7ICh0YWtlcyBhYm91dCAzIHRpbWVzIGFzIGxvbmcuLi4pXG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgaWxlbiA9IGEubGVuZ3RoO1xuICAgICAgICB2YXIgajtcbiAgICAgICAgdmFyIGpsZW4gPSBiLmxlbmd0aDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICB3aGlsZSAoaWR4IDwgaWxlbikge1xuICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaiA8IGpsZW4pIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBbXG4gICAgICAgICAgICAgICAgICAgIGFbaWR4XSxcbiAgICAgICAgICAgICAgICAgICAgYltqXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgaiArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgbGlzdCBvdXQgb2YgdGhlIHR3byBzdXBwbGllZCBieSBwYWlyaW5nIHVwIGVxdWFsbHktcG9zaXRpb25lZFxuICAgICAqIGl0ZW1zIGZyb20gYm90aCBsaXN0cy4gVGhlIHJldHVybmVkIGxpc3QgaXMgdHJ1bmNhdGVkIHRvIHRoZSBsZW5ndGggb2YgdGhlXG4gICAgICogc2hvcnRlciBvZiB0aGUgdHdvIGlucHV0IGxpc3RzLlxuICAgICAqIE5vdGU6IGB6aXBgIGlzIGVxdWl2YWxlbnQgdG8gYHppcFdpdGgoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gW2EsIGJdIH0pYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFthXSAtPiBbYl0gLT4gW1thLGJdXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSBmaXJzdCBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MiBUaGUgc2Vjb25kIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBtYWRlIGJ5IHBhaXJpbmcgdXAgc2FtZS1pbmRleGVkIGVsZW1lbnRzIG9mIGBsaXN0MWAgYW5kIGBsaXN0MmAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi56aXAoWzEsIDIsIDNdLCBbJ2EnLCAnYicsICdjJ10pOyAvLz0+IFtbMSwgJ2EnXSwgWzIsICdiJ10sIFszLCAnYyddXVxuICAgICAqL1xuICAgIHZhciB6aXAgPSBfY3VycnkyKGZ1bmN0aW9uIHppcChhLCBiKSB7XG4gICAgICAgIHZhciBydiA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGEubGVuZ3RoLCBiLmxlbmd0aCk7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIHJ2W2lkeF0gPSBbXG4gICAgICAgICAgICAgICAgYVtpZHhdLFxuICAgICAgICAgICAgICAgIGJbaWR4XVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydjtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgb2JqZWN0IG91dCBvZiBhIGxpc3Qgb2Yga2V5cyBhbmQgYSBsaXN0IG9mIHZhbHVlcy5cbiAgICAgKiBLZXkvdmFsdWUgcGFpcmluZyBpcyB0cnVuY2F0ZWQgdG8gdGhlIGxlbmd0aCBvZiB0aGUgc2hvcnRlciBvZiB0aGUgdHdvIGxpc3RzLlxuICAgICAqIE5vdGU6IGB6aXBPYmpgIGlzIGVxdWl2YWxlbnQgdG8gYHBpcGUoemlwV2l0aChwYWlyKSwgZnJvbVBhaXJzKWAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbU3RyaW5nXSAtPiBbKl0gLT4ge1N0cmluZzogKn1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBrZXlzIFRoZSBhcnJheSB0aGF0IHdpbGwgYmUgcHJvcGVydGllcyBvbiB0aGUgb3V0cHV0IG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgVGhlIGxpc3Qgb2YgdmFsdWVzIG9uIHRoZSBvdXRwdXQgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIG9iamVjdCBtYWRlIGJ5IHBhaXJpbmcgdXAgc2FtZS1pbmRleGVkIGVsZW1lbnRzIG9mIGBrZXlzYCBhbmQgYHZhbHVlc2AuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi56aXBPYmooWydhJywgJ2InLCAnYyddLCBbMSwgMiwgM10pOyAvLz0+IHthOiAxLCBiOiAyLCBjOiAzfVxuICAgICAqL1xuICAgIHZhciB6aXBPYmogPSBfY3VycnkyKGZ1bmN0aW9uIHppcE9iaihrZXlzLCB2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBNYXRoLm1pbihrZXlzLmxlbmd0aCwgdmFsdWVzLmxlbmd0aCk7XG4gICAgICAgIHZhciBvdXQgPSB7fTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgb3V0W2tleXNbaWR4XV0gPSB2YWx1ZXNbaWR4XTtcbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGxpc3Qgb3V0IG9mIHRoZSB0d28gc3VwcGxpZWQgYnkgYXBwbHlpbmcgdGhlIGZ1bmN0aW9uIHRvIGVhY2hcbiAgICAgKiBlcXVhbGx5LXBvc2l0aW9uZWQgcGFpciBpbiB0aGUgbGlzdHMuIFRoZSByZXR1cm5lZCBsaXN0IGlzIHRydW5jYXRlZCB0byB0aGVcbiAgICAgKiBsZW5ndGggb2YgdGhlIHNob3J0ZXIgb2YgdGhlIHR3byBpbnB1dCBsaXN0cy5cbiAgICAgKlxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSxiIC0+IGMpIC0+IFthXSAtPiBbYl0gLT4gW2NdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHVzZWQgdG8gY29tYmluZSB0aGUgdHdvIGVsZW1lbnRzIGludG8gb25lIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSBmaXJzdCBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MiBUaGUgc2Vjb25kIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBtYWRlIGJ5IGNvbWJpbmluZyBzYW1lLWluZGV4ZWQgZWxlbWVudHMgb2YgYGxpc3QxYCBhbmQgYGxpc3QyYFxuICAgICAqICAgICAgICAgdXNpbmcgYGZuYC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZiA9ICh4LCB5KSA9PiB7XG4gICAgICogICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIFIuemlwV2l0aChmLCBbMSwgMiwgM10sIFsnYScsICdiJywgJ2MnXSk7XG4gICAgICogICAgICAvLz0+IFtmKDEsICdhJyksIGYoMiwgJ2InKSwgZigzLCAnYycpXVxuICAgICAqL1xuICAgIHZhciB6aXBXaXRoID0gX2N1cnJ5MyhmdW5jdGlvbiB6aXBXaXRoKGZuLCBhLCBiKSB7XG4gICAgICAgIHZhciBydiA9IFtdO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGEubGVuZ3RoLCBiLmxlbmd0aCk7XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIHJ2W2lkeF0gPSBmbihhW2lkeF0sIGJbaWR4XSk7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnY7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBBIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgYGZhbHNlYC4gQW55IHBhc3NlZCBpbiBwYXJhbWV0ZXJzIGFyZSBpZ25vcmVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICogLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7Kn1cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5hbHdheXMsIFIuVFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuRigpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIEYgPSBhbHdheXMoZmFsc2UpO1xuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIGB0cnVlYC4gQW55IHBhc3NlZCBpbiBwYXJhbWV0ZXJzIGFyZSBpZ25vcmVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICogLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7Kn1cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5hbHdheXMsIFIuRlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuVCgpOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgVCA9IGFsd2F5cyh0cnVlKTtcblxuICAgIC8qKlxuICAgICAqIENvcGllcyBhbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGJlIGNvcGllZFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHJlZkZyb20gQXJyYXkgY29udGFpbmluZyB0aGUgc291cmNlIHJlZmVyZW5jZXNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSByZWZUbyBBcnJheSBjb250YWluaW5nIHRoZSBjb3BpZWQgc291cmNlIHJlZmVyZW5jZXNcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGRlZXAgV2hldGhlciBvciBub3QgdG8gcGVyZm9ybSBkZWVwIGNsb25pbmcuXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGNvcGllZCB2YWx1ZS5cbiAgICAgKi9cbiAgICB2YXIgX2Nsb25lID0gZnVuY3Rpb24gX2Nsb25lKHZhbHVlLCByZWZGcm9tLCByZWZUbywgZGVlcCkge1xuICAgICAgICB2YXIgY29weSA9IGZ1bmN0aW9uIGNvcHkoY29waWVkVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBsZW4gPSByZWZGcm9tLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gcmVmRnJvbVtpZHhdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWZUb1tpZHhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlZkZyb21baWR4ICsgMV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJlZlRvW2lkeCArIDFdID0gY29waWVkVmFsdWU7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb3BpZWRWYWx1ZVtrZXldID0gZGVlcCA/IF9jbG9uZSh2YWx1ZVtrZXldLCByZWZGcm9tLCByZWZUbywgdHJ1ZSkgOiB2YWx1ZVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvcGllZFZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICBzd2l0Y2ggKHR5cGUodmFsdWUpKSB7XG4gICAgICAgIGNhc2UgJ09iamVjdCc6XG4gICAgICAgICAgICByZXR1cm4gY29weSh7fSk7XG4gICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgICAgIHJldHVybiBjb3B5KFtdKTtcbiAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUodmFsdWUudmFsdWVPZigpKTtcbiAgICAgICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgICAgICAgIHJldHVybiBfY2xvbmVSZWdFeHAodmFsdWUpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBfY3JlYXRlUGFydGlhbEFwcGxpY2F0b3IgPSBmdW5jdGlvbiBfY3JlYXRlUGFydGlhbEFwcGxpY2F0b3IoY29uY2F0KSB7XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIF9hcml0eShNYXRoLm1heCgwLCBmbi5sZW5ndGggLSBhcmdzLmxlbmd0aCksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgY29uY2F0KGFyZ3MsIGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgX2Ryb3BMYXN0ID0gZnVuY3Rpb24gZHJvcExhc3QobiwgeHMpIHtcbiAgICAgICAgcmV0dXJuIHRha2UobiA8IHhzLmxlbmd0aCA/IHhzLmxlbmd0aCAtIG4gOiAwLCB4cyk7XG4gICAgfTtcblxuICAgIC8vIFZhbHVlcyBvZiBvdGhlciB0eXBlcyBhcmUgb25seSBlcXVhbCBpZiBpZGVudGljYWwuXG4gICAgdmFyIF9lcXVhbHMgPSBmdW5jdGlvbiBfZXF1YWxzKGEsIGIsIHN0YWNrQSwgc3RhY2tCKSB7XG4gICAgICAgIGlmIChpZGVudGljYWwoYSwgYikpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlKGEpICE9PSB0eXBlKGIpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGEuZXF1YWxzID09PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBiLmVxdWFscyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBhLmVxdWFscyA9PT0gJ2Z1bmN0aW9uJyAmJiBhLmVxdWFscyhiKSAmJiB0eXBlb2YgYi5lcXVhbHMgPT09ICdmdW5jdGlvbicgJiYgYi5lcXVhbHMoYSk7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoICh0eXBlKGEpKSB7XG4gICAgICAgIGNhc2UgJ0FyZ3VtZW50cyc6XG4gICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgY2FzZSAnT2JqZWN0JzpcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYS5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJyAmJiBfZnVuY3Rpb25OYW1lKGEuY29uc3RydWN0b3IpID09PSAnUHJvbWlzZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdCb29sZWFuJzpcbiAgICAgICAgY2FzZSAnTnVtYmVyJzpcbiAgICAgICAgY2FzZSAnU3RyaW5nJzpcbiAgICAgICAgICAgIGlmICghKHR5cGVvZiBhID09PSB0eXBlb2YgYiAmJiBpZGVudGljYWwoYS52YWx1ZU9mKCksIGIudmFsdWVPZigpKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnRGF0ZSc6XG4gICAgICAgICAgICBpZiAoIWlkZW50aWNhbChhLnZhbHVlT2YoKSwgYi52YWx1ZU9mKCkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0Vycm9yJzpcbiAgICAgICAgICAgIHJldHVybiBhLm5hbWUgPT09IGIubmFtZSAmJiBhLm1lc3NhZ2UgPT09IGIubWVzc2FnZTtcbiAgICAgICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgICAgICAgIGlmICghKGEuc291cmNlID09PSBiLnNvdXJjZSAmJiBhLmdsb2JhbCA9PT0gYi5nbG9iYWwgJiYgYS5pZ25vcmVDYXNlID09PSBiLmlnbm9yZUNhc2UgJiYgYS5tdWx0aWxpbmUgPT09IGIubXVsdGlsaW5lICYmIGEuc3RpY2t5ID09PSBiLnN0aWNreSAmJiBhLnVuaWNvZGUgPT09IGIudW5pY29kZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTWFwJzpcbiAgICAgICAgY2FzZSAnU2V0JzpcbiAgICAgICAgICAgIGlmICghX2VxdWFscyhfYXJyYXlGcm9tSXRlcmF0b3IoYS5lbnRyaWVzKCkpLCBfYXJyYXlGcm9tSXRlcmF0b3IoYi5lbnRyaWVzKCkpLCBzdGFja0EsIHN0YWNrQikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnSW50OEFycmF5JzpcbiAgICAgICAgY2FzZSAnVWludDhBcnJheSc6XG4gICAgICAgIGNhc2UgJ1VpbnQ4Q2xhbXBlZEFycmF5JzpcbiAgICAgICAgY2FzZSAnSW50MTZBcnJheSc6XG4gICAgICAgIGNhc2UgJ1VpbnQxNkFycmF5JzpcbiAgICAgICAgY2FzZSAnSW50MzJBcnJheSc6XG4gICAgICAgIGNhc2UgJ1VpbnQzMkFycmF5JzpcbiAgICAgICAgY2FzZSAnRmxvYXQzMkFycmF5JzpcbiAgICAgICAgY2FzZSAnRmxvYXQ2NEFycmF5JzpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdBcnJheUJ1ZmZlcic6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFZhbHVlcyBvZiBvdGhlciB0eXBlcyBhcmUgb25seSBlcXVhbCBpZiBpZGVudGljYWwuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleXNBID0ga2V5cyhhKTtcbiAgICAgICAgaWYgKGtleXNBLmxlbmd0aCAhPT0ga2V5cyhiKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWR4ID0gc3RhY2tBLmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpZHggPj0gMCkge1xuICAgICAgICAgICAgaWYgKHN0YWNrQVtpZHhdID09PSBhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YWNrQltpZHhdID09PSBiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4IC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tBLnB1c2goYSk7XG4gICAgICAgIHN0YWNrQi5wdXNoKGIpO1xuICAgICAgICBpZHggPSBrZXlzQS5sZW5ndGggLSAxO1xuICAgICAgICB3aGlsZSAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzQVtpZHhdO1xuICAgICAgICAgICAgaWYgKCEoX2hhcyhrZXksIGIpICYmIF9lcXVhbHMoYltrZXldLCBhW2tleV0sIHN0YWNrQSwgc3RhY2tCKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZHggLT0gMTtcbiAgICAgICAgfVxuICAgICAgICBzdGFja0EucG9wKCk7XG4gICAgICAgIHN0YWNrQi5wb3AoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGBfbWFrZUZsYXRgIGlzIGEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIG9uZS1sZXZlbCBvciBmdWxseSByZWN1cnNpdmVcbiAgICAgKiBmdW5jdGlvbiBiYXNlZCBvbiB0aGUgZmxhZyBwYXNzZWQgaW4uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHZhciBfbWFrZUZsYXQgPSBmdW5jdGlvbiBfbWFrZUZsYXQocmVjdXJzaXZlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBmbGF0dChsaXN0KSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUsIGpsZW4sIGo7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHZhciBpbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaWR4IDwgaWxlbikge1xuICAgICAgICAgICAgICAgIGlmIChpc0FycmF5TGlrZShsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcmVjdXJzaXZlID8gZmxhdHQobGlzdFtpZHhdKSA6IGxpc3RbaWR4XTtcbiAgICAgICAgICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGpsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChqIDwgamxlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gdmFsdWVbal07XG4gICAgICAgICAgICAgICAgICAgICAgICBqICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBsaXN0W2lkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIF9yZWR1Y2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIF9hcnJheVJlZHVjZSh4ZiwgYWNjLCBsaXN0KSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgICAgICBhY2MgPSB4ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShhY2MsIGxpc3RbaWR4XSk7XG4gICAgICAgICAgICAgICAgaWYgKGFjYyAmJiBhY2NbJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gYWNjWydAQHRyYW5zZHVjZXIvdmFsdWUnXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10oYWNjKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfaXRlcmFibGVSZWR1Y2UoeGYsIGFjYywgaXRlcikge1xuICAgICAgICAgICAgdmFyIHN0ZXAgPSBpdGVyLm5leHQoKTtcbiAgICAgICAgICAgIHdoaWxlICghc3RlcC5kb25lKSB7XG4gICAgICAgICAgICAgICAgYWNjID0geGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10oYWNjLCBzdGVwLnZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoYWNjICYmIGFjY1snQEB0cmFuc2R1Y2VyL3JlZHVjZWQnXSkge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSBhY2NbJ0BAdHJhbnNkdWNlci92YWx1ZSddO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RlcCA9IGl0ZXIubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10oYWNjKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfbWV0aG9kUmVkdWNlKHhmLCBhY2MsIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ob2JqLnJlZHVjZShiaW5kKHhmWydAQHRyYW5zZHVjZXIvc3RlcCddLCB4ZiksIGFjYykpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzeW1JdGVyYXRvciA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnID8gU3ltYm9sLml0ZXJhdG9yIDogJ0BAaXRlcmF0b3InO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gX3JlZHVjZShmbiwgYWNjLCBsaXN0KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZm4gPSBfeHdyYXAoZm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzQXJyYXlMaWtlKGxpc3QpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hcnJheVJlZHVjZShmbiwgYWNjLCBsaXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbGlzdC5yZWR1Y2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX21ldGhvZFJlZHVjZShmbiwgYWNjLCBsaXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsaXN0W3N5bUl0ZXJhdG9yXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pdGVyYWJsZVJlZHVjZShmbiwgYWNjLCBsaXN0W3N5bUl0ZXJhdG9yXSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbGlzdC5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pdGVyYWJsZVJlZHVjZShmbiwgYWNjLCBsaXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3JlZHVjZTogbGlzdCBtdXN0IGJlIGFycmF5IG9yIGl0ZXJhYmxlJyk7XG4gICAgICAgIH07XG4gICAgfSgpO1xuXG4gICAgdmFyIF9zdGVwQ2F0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3N0ZXBDYXRBcnJheSA9IHtcbiAgICAgICAgICAgICdAQHRyYW5zZHVjZXIvaW5pdCc6IEFycmF5LFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9zdGVwJzogZnVuY3Rpb24gKHhzLCB4KSB7XG4gICAgICAgICAgICAgICAgeHMucHVzaCh4KTtcbiAgICAgICAgICAgICAgICByZXR1cm4geHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9yZXN1bHQnOiBfaWRlbnRpdHlcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9zdGVwQ2F0U3RyaW5nID0ge1xuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9pbml0JzogU3RyaW5nLFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9zdGVwJzogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSArIGI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9yZXN1bHQnOiBfaWRlbnRpdHlcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9zdGVwQ2F0T2JqZWN0ID0ge1xuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9pbml0JzogT2JqZWN0LFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9zdGVwJzogZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Fzc2lnbihyZXN1bHQsIGlzQXJyYXlMaWtlKGlucHV0KSA/IG9iak9mKGlucHV0WzBdLCBpbnB1dFsxXSkgOiBpbnB1dCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9yZXN1bHQnOiBfaWRlbnRpdHlcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIF9zdGVwQ2F0KG9iaikge1xuICAgICAgICAgICAgaWYgKF9pc1RyYW5zZm9ybWVyKG9iaikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N0ZXBDYXRBcnJheTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RlcENhdFN0cmluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RlcENhdE9iamVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSB0cmFuc2Zvcm1lciBmb3IgJyArIG9iaik7XG4gICAgICAgIH07XG4gICAgfSgpO1xuXG4gICAgdmFyIF94ZHJvcExhc3RXaGlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gWERyb3BMYXN0V2hpbGUoZm4sIHhmKSB7XG4gICAgICAgICAgICB0aGlzLmYgPSBmbjtcbiAgICAgICAgICAgIHRoaXMucmV0YWluZWQgPSBbXTtcbiAgICAgICAgICAgIHRoaXMueGYgPSB4ZjtcbiAgICAgICAgfVxuICAgICAgICBYRHJvcExhc3RXaGlsZS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhEcm9wTGFzdFdoaWxlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgdGhpcy5yZXRhaW5lZCA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIFhEcm9wTGFzdFdoaWxlLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mKGlucHV0KSA/IHRoaXMucmV0YWluKHJlc3VsdCwgaW5wdXQpIDogdGhpcy5mbHVzaChyZXN1bHQsIGlucHV0KTtcbiAgICAgICAgfTtcbiAgICAgICAgWERyb3BMYXN0V2hpbGUucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IF9yZWR1Y2UodGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSwgcmVzdWx0LCB0aGlzLnJldGFpbmVkKTtcbiAgICAgICAgICAgIHRoaXMucmV0YWluZWQgPSBbXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpO1xuICAgICAgICB9O1xuICAgICAgICBYRHJvcExhc3RXaGlsZS5wcm90b3R5cGUucmV0YWluID0gZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMucmV0YWluZWQucHVzaChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGRyb3BMYXN0V2hpbGUoZm4sIHhmKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhEcm9wTGFzdFdoaWxlKGZuLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIHZhciBfeGdyb3VwQnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFhHcm91cEJ5KGYsIHhmKSB7XG4gICAgICAgICAgICB0aGlzLnhmID0geGY7XG4gICAgICAgICAgICB0aGlzLmYgPSBmO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBYR3JvdXBCeS5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9pbml0J10gPSBfeGZCYXNlLmluaXQ7XG4gICAgICAgIFhHcm91cEJ5LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgdmFyIGtleTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIHRoaXMuaW5wdXRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9oYXMoa2V5LCB0aGlzLmlucHV0cykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMuaW5wdXRzW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0WydAQHRyYW5zZHVjZXIvcmVkdWNlZCddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRbJ0BAdHJhbnNkdWNlci92YWx1ZSddO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmlucHV0cyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIFhHcm91cEJ5LnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gdGhpcy5mKGlucHV0KTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRzW2tleV0gPSB0aGlzLmlucHV0c1trZXldIHx8IFtcbiAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgW11cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICB0aGlzLmlucHV0c1trZXldWzFdID0gYXBwZW5kKGlucHV0LCB0aGlzLmlucHV0c1trZXldWzFdKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94Z3JvdXBCeShmLCB4Zikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYR3JvdXBCeShmLCB4Zik7XG4gICAgICAgIH0pO1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgbGlzdCBpdGVyYXRpb24gZnVuY3Rpb24gZnJvbSBhbiBleGlzdGluZyBvbmUgYnkgYWRkaW5nIHR3byBuZXdcbiAgICAgKiBwYXJhbWV0ZXJzIHRvIGl0cyBjYWxsYmFjayBmdW5jdGlvbjogdGhlIGN1cnJlbnQgaW5kZXgsIGFuZCB0aGUgZW50aXJlIGxpc3QuXG4gICAgICpcbiAgICAgKiBUaGlzIHdvdWxkIHR1cm4sIGZvciBpbnN0YW5jZSwgUmFtZGEncyBzaW1wbGUgYG1hcGAgZnVuY3Rpb24gaW50byBvbmUgdGhhdFxuICAgICAqIG1vcmUgY2xvc2VseSByZXNlbWJsZXMgYEFycmF5LnByb3RvdHlwZS5tYXBgLiBOb3RlIHRoYXQgdGhpcyB3aWxsIG9ubHkgd29ya1xuICAgICAqIGZvciBmdW5jdGlvbnMgaW4gd2hpY2ggdGhlIGl0ZXJhdGlvbiBjYWxsYmFjayBmdW5jdGlvbiBpcyB0aGUgZmlyc3RcbiAgICAgKiBwYXJhbWV0ZXIsIGFuZCB3aGVyZSB0aGUgbGlzdCBpcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIChUaGlzIGxhdHRlciBtaWdodCBiZVxuICAgICAqIHVuaW1wb3J0YW50IGlmIHRoZSBsaXN0IHBhcmFtZXRlciBpcyBub3QgdXNlZC4pXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE1LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKChhIC4uLiAtPiBiKSAuLi4gLT4gW2FdIC0+ICopIC0+IChhIC4uLiwgSW50LCBbYV0gLT4gYikgLi4uIC0+IFthXSAtPiAqKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEEgbGlzdCBpdGVyYXRpb24gZnVuY3Rpb24gdGhhdCBkb2VzIG5vdCBwYXNzIGluZGV4IG9yIGxpc3QgdG8gaXRzIGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEFuIGFsdGVyZWQgbGlzdCBpdGVyYXRpb24gZnVuY3Rpb24gdGhhdCBwYXNzZXMgKGl0ZW0sIGluZGV4LCBsaXN0KSB0byBpdHMgY2FsbGJhY2tcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbWFwSW5kZXhlZCA9IFIuYWRkSW5kZXgoUi5tYXApO1xuICAgICAqICAgICAgbWFwSW5kZXhlZCgodmFsLCBpZHgpID0+IGlkeCArICctJyArIHZhbCwgWydmJywgJ28nLCAnbycsICdiJywgJ2EnLCAnciddKTtcbiAgICAgKiAgICAgIC8vPT4gWycwLWYnLCAnMS1vJywgJzItbycsICczLWInLCAnNC1hJywgJzUtciddXG4gICAgICovXG4gICAgdmFyIGFkZEluZGV4ID0gX2N1cnJ5MShmdW5jdGlvbiBhZGRJbmRleChmbikge1xuICAgICAgICByZXR1cm4gY3VycnlOKGZuLmxlbmd0aCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB2YXIgb3JpZ0ZuID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgdmFyIGxpc3QgPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBfc2xpY2UoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGFyZ3NbMF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG9yaWdGbi5hcHBseSh0aGlzLCBfY29uY2F0KGFyZ3VtZW50cywgW1xuICAgICAgICAgICAgICAgICAgICBpZHgsXG4gICAgICAgICAgICAgICAgICAgIGxpc3RcbiAgICAgICAgICAgICAgICBdKSk7XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYSBmdW5jdGlvbiBvZiBhbnkgYXJpdHkgKGluY2x1ZGluZyBudWxsYXJ5KSBpbiBhIGZ1bmN0aW9uIHRoYXQgYWNjZXB0c1xuICAgICAqIGV4YWN0bHkgMiBwYXJhbWV0ZXJzLiBBbnkgZXh0cmFuZW91cyBwYXJhbWV0ZXJzIHdpbGwgbm90IGJlIHBhc3NlZCB0byB0aGVcbiAgICAgKiBzdXBwbGllZCBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMi4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKiAtPiBjKSAtPiAoYSwgYiAtPiBjKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB3cmFwcGluZyBgZm5gLiBUaGUgbmV3IGZ1bmN0aW9uIGlzIGd1YXJhbnRlZWQgdG8gYmUgb2ZcbiAgICAgKiAgICAgICAgIGFyaXR5IDIuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHRha2VzVGhyZWVBcmdzID0gZnVuY3Rpb24oYSwgYiwgYykge1xuICAgICAqICAgICAgICByZXR1cm4gW2EsIGIsIGNdO1xuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIHRha2VzVGhyZWVBcmdzLmxlbmd0aDsgLy89PiAzXG4gICAgICogICAgICB0YWtlc1RocmVlQXJncygxLCAyLCAzKTsgLy89PiBbMSwgMiwgM11cbiAgICAgKlxuICAgICAqICAgICAgdmFyIHRha2VzVHdvQXJncyA9IFIuYmluYXJ5KHRha2VzVGhyZWVBcmdzKTtcbiAgICAgKiAgICAgIHRha2VzVHdvQXJncy5sZW5ndGg7IC8vPT4gMlxuICAgICAqICAgICAgLy8gT25seSAyIGFyZ3VtZW50cyBhcmUgcGFzc2VkIHRvIHRoZSB3cmFwcGVkIGZ1bmN0aW9uXG4gICAgICogICAgICB0YWtlc1R3b0FyZ3MoMSwgMiwgMyk7IC8vPT4gWzEsIDIsIHVuZGVmaW5lZF1cbiAgICAgKi9cbiAgICB2YXIgYmluYXJ5ID0gX2N1cnJ5MShmdW5jdGlvbiBiaW5hcnkoZm4pIHtcbiAgICAgICAgcmV0dXJuIG5BcnkoMiwgZm4pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGUgdmFsdWUgd2hpY2ggbWF5IGNvbnRhaW4gKG5lc3RlZCkgYEFycmF5YHMgYW5kXG4gICAgICogYE9iamVjdGBzLCBgTnVtYmVyYHMsIGBTdHJpbmdgcywgYEJvb2xlYW5gcyBhbmQgYERhdGVgcy4gYEZ1bmN0aW9uYHMgYXJlIG5vdFxuICAgICAqIGNvcGllZCwgYnV0IGFzc2lnbmVkIGJ5IHRoZWlyIHJlZmVyZW5jZS5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gYSBgY2xvbmVgIG1ldGhvZCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7Kn0gLT4geyp9XG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgb2JqZWN0IG9yIGFycmF5IHRvIGNsb25lXG4gICAgICogQHJldHVybiB7Kn0gQSBuZXcgb2JqZWN0IG9yIGFycmF5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBvYmplY3RzID0gW3t9LCB7fSwge31dO1xuICAgICAqICAgICAgdmFyIG9iamVjdHNDbG9uZSA9IFIuY2xvbmUob2JqZWN0cyk7XG4gICAgICogICAgICBvYmplY3RzWzBdID09PSBvYmplY3RzQ2xvbmVbMF07IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgY2xvbmUgPSBfY3VycnkxKGZ1bmN0aW9uIGNsb25lKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS5jbG9uZSA9PT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLmNsb25lKCkgOiBfY2xvbmUodmFsdWUsIFtdLCBbXSwgdHJ1ZSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgY3VycmllZCBlcXVpdmFsZW50IG9mIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhlIGN1cnJpZWQgZnVuY3Rpb25cbiAgICAgKiBoYXMgdHdvIHVudXN1YWwgY2FwYWJpbGl0aWVzLiBGaXJzdCwgaXRzIGFyZ3VtZW50cyBuZWVkbid0IGJlIHByb3ZpZGVkIG9uZVxuICAgICAqIGF0IGEgdGltZS4gSWYgYGZgIGlzIGEgdGVybmFyeSBmdW5jdGlvbiBhbmQgYGdgIGlzIGBSLmN1cnJ5KGYpYCwgdGhlXG4gICAgICogZm9sbG93aW5nIGFyZSBlcXVpdmFsZW50OlxuICAgICAqXG4gICAgICogICAtIGBnKDEpKDIpKDMpYFxuICAgICAqICAgLSBgZygxKSgyLCAzKWBcbiAgICAgKiAgIC0gYGcoMSwgMikoMylgXG4gICAgICogICAtIGBnKDEsIDIsIDMpYFxuICAgICAqXG4gICAgICogU2Vjb25kbHksIHRoZSBzcGVjaWFsIHBsYWNlaG9sZGVyIHZhbHVlIGBSLl9fYCBtYXkgYmUgdXNlZCB0byBzcGVjaWZ5XG4gICAgICogXCJnYXBzXCIsIGFsbG93aW5nIHBhcnRpYWwgYXBwbGljYXRpb24gb2YgYW55IGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyxcbiAgICAgKiByZWdhcmRsZXNzIG9mIHRoZWlyIHBvc2l0aW9ucy4gSWYgYGdgIGlzIGFzIGFib3ZlIGFuZCBgX2AgaXMgYFIuX19gLCB0aGVcbiAgICAgKiBmb2xsb3dpbmcgYXJlIGVxdWl2YWxlbnQ6XG4gICAgICpcbiAgICAgKiAgIC0gYGcoMSwgMiwgMylgXG4gICAgICogICAtIGBnKF8sIDIsIDMpKDEpYFxuICAgICAqICAgLSBgZyhfLCBfLCAzKSgxKSgyKWBcbiAgICAgKiAgIC0gYGcoXywgXywgMykoMSwgMilgXG4gICAgICogICAtIGBnKF8sIDIpKDEpKDMpYFxuICAgICAqICAgLSBgZyhfLCAyKSgxLCAzKWBcbiAgICAgKiAgIC0gYGcoXywgMikoXywgMykoMSlgXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKCogLT4gYSkgLT4gKCogLT4gYSlcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3LCBjdXJyaWVkIGZ1bmN0aW9uLlxuICAgICAqIEBzZWUgUi5jdXJyeU5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYWRkRm91ck51bWJlcnMgPSAoYSwgYiwgYywgZCkgPT4gYSArIGIgKyBjICsgZDtcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGN1cnJpZWRBZGRGb3VyTnVtYmVycyA9IFIuY3VycnkoYWRkRm91ck51bWJlcnMpO1xuICAgICAqICAgICAgdmFyIGYgPSBjdXJyaWVkQWRkRm91ck51bWJlcnMoMSwgMik7XG4gICAgICogICAgICB2YXIgZyA9IGYoMyk7XG4gICAgICogICAgICBnKDQpOyAvLz0+IDEwXG4gICAgICovXG4gICAgdmFyIGN1cnJ5ID0gX2N1cnJ5MShmdW5jdGlvbiBjdXJyeShmbikge1xuICAgICAgICByZXR1cm4gY3VycnlOKGZuLmxlbmd0aCwgZm4pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbGwgYnV0IHRoZSBmaXJzdCBgbmAgZWxlbWVudHMgb2YgdGhlIGdpdmVuIGxpc3QsIHN0cmluZywgb3JcbiAgICAgKiB0cmFuc2R1Y2VyL3RyYW5zZm9ybWVyIChvciBvYmplY3Qgd2l0aCBhIGBkcm9wYCBtZXRob2QpLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGRyb3BgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAc2lnIE51bWJlciAtPiBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG5cbiAgICAgKiBAcGFyYW0geyp9IGxpc3RcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi50YWtlLCBSLnRyYW5zZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZHJvcCgxLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFsnYmFyJywgJ2JheiddXG4gICAgICogICAgICBSLmRyb3AoMiwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2JheiddXG4gICAgICogICAgICBSLmRyb3AoMywgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbXVxuICAgICAqICAgICAgUi5kcm9wKDQsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gW11cbiAgICAgKiAgICAgIFIuZHJvcCgzLCAncmFtZGEnKTsgICAgICAgICAgICAgICAvLz0+ICdkYSdcbiAgICAgKi9cbiAgICB2YXIgZHJvcCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZHJvcCcsIF94ZHJvcCwgZnVuY3Rpb24gZHJvcChuLCB4cykge1xuICAgICAgICByZXR1cm4gc2xpY2UoTWF0aC5tYXgoMCwgbiksIEluZmluaXR5LCB4cyk7XG4gICAgfSkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxpc3QgY29udGFpbmluZyBhbGwgYnV0IHRoZSBsYXN0IGBuYCBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gYGxpc3RgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIE51bWJlciAtPiBbYV0gLT4gW2FdXG4gICAgICogQHNpZyBOdW1iZXIgLT4gU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBuIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgb2YgYHhzYCB0byBza2lwLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHhzIFRoZSBjb2xsZWN0aW9uIHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAqIEBzZWUgUi50YWtlTGFzdFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuZHJvcExhc3QoMSwgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbJ2ZvbycsICdiYXInXVxuICAgICAqICAgICAgUi5kcm9wTGFzdCgyLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFsnZm9vJ11cbiAgICAgKiAgICAgIFIuZHJvcExhc3QoMywgWydmb28nLCAnYmFyJywgJ2JheiddKTsgLy89PiBbXVxuICAgICAqICAgICAgUi5kcm9wTGFzdCg0LCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFtdXG4gICAgICogICAgICBSLmRyb3BMYXN0KDMsICdyYW1kYScpOyAgICAgICAgICAgICAgIC8vPT4gJ3JhJ1xuICAgICAqL1xuICAgIHZhciBkcm9wTGFzdCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZHJvcExhc3QnLCBfeGRyb3BMYXN0LCBfZHJvcExhc3QpKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIGFsbCBidXQgbGFzdCB0aGVgbmAgZWxlbWVudHMgb2YgYSBnaXZlbiBsaXN0LFxuICAgICAqIHBhc3NpbmcgZWFjaCB2YWx1ZSBmcm9tIHRoZSByaWdodCB0byB0aGUgc3VwcGxpZWQgcHJlZGljYXRlIGZ1bmN0aW9uLFxuICAgICAqIHNraXBwaW5nIGVsZW1lbnRzIHdoaWxlIHRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gcmV0dXJucyBgdHJ1ZWAuIFRoZSBwcmVkaWNhdGVcbiAgICAgKiBmdW5jdGlvbiBpcyBwYXNzZWQgb25lIGFyZ3VtZW50OiAodmFsdWUpKi5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBCb29sZWFuKSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBIG5ldyBhcnJheS5cbiAgICAgKiBAc2VlIFIudGFrZUxhc3RXaGlsZSwgUi5hZGRJbmRleFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBsdGVUaHJlZSA9IHggPT4geCA8PSAzO1xuICAgICAqXG4gICAgICogICAgICBSLmRyb3BMYXN0V2hpbGUobHRlVGhyZWUsIFsxLCAyLCAzLCA0LCAzLCAyLCAxXSk7IC8vPT4gWzEsIDIsIDMsIDRdXG4gICAgICovXG4gICAgdmFyIGRyb3BMYXN0V2hpbGUgPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2Ryb3BMYXN0V2hpbGUnLCBfeGRyb3BMYXN0V2hpbGUsIF9kcm9wTGFzdFdoaWxlKSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBpdHMgYXJndW1lbnRzIGFyZSBlcXVpdmFsZW50LCBgZmFsc2VgIG90aGVyd2lzZS4gSGFuZGxlc1xuICAgICAqIGN5Y2xpY2FsIGRhdGEgc3RydWN0dXJlcy5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgc3ltbWV0cmljYWxseSB0byB0aGUgYGVxdWFsc2AgbWV0aG9kcyBvZiBib3RoIGFyZ3VtZW50cywgaWZcbiAgICAgKiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBhIC0+IGIgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7Kn0gYVxuICAgICAqIEBwYXJhbSB7Kn0gYlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5lcXVhbHMoMSwgMSk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5lcXVhbHMoMSwgJzEnKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5lcXVhbHMoWzEsIDIsIDNdLCBbMSwgMiwgM10pOyAvLz0+IHRydWVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGEgPSB7fTsgYS52ID0gYTtcbiAgICAgKiAgICAgIHZhciBiID0ge307IGIudiA9IGI7XG4gICAgICogICAgICBSLmVxdWFscyhhLCBiKTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGVxdWFscyA9IF9jdXJyeTIoZnVuY3Rpb24gZXF1YWxzKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIF9lcXVhbHMoYSwgYiwgW10sIFtdKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgcHJlZGljYXRlIGFuZCBhIFwiZmlsdGVyYWJsZVwiLCBhbmQgcmV0dXJucyBhIG5ldyBmaWx0ZXJhYmxlIG9mIHRoZVxuICAgICAqIHNhbWUgdHlwZSBjb250YWluaW5nIHRoZSBtZW1iZXJzIG9mIHRoZSBnaXZlbiBmaWx0ZXJhYmxlIHdoaWNoIHNhdGlzZnkgdGhlXG4gICAgICogZ2l2ZW4gcHJlZGljYXRlLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGZpbHRlcmAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBGaWx0ZXJhYmxlIGYgPT4gKGEgLT4gQm9vbGVhbikgLT4gZiBhIC0+IGYgYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBmaWx0ZXJhYmxlXG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICogQHNlZSBSLnJlamVjdCwgUi50cmFuc2R1Y2UsIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNFdmVuID0gbiA9PiBuICUgMiA9PT0gMDtcbiAgICAgKlxuICAgICAqICAgICAgUi5maWx0ZXIoaXNFdmVuLCBbMSwgMiwgMywgNF0pOyAvLz0+IFsyLCA0XVxuICAgICAqXG4gICAgICogICAgICBSLmZpbHRlcihpc0V2ZW4sIHthOiAxLCBiOiAyLCBjOiAzLCBkOiA0fSk7IC8vPT4ge2I6IDIsIGQ6IDR9XG4gICAgICovXG4gICAgLy8gZWxzZVxuICAgIHZhciBmaWx0ZXIgPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2ZpbHRlcicsIF94ZmlsdGVyLCBmdW5jdGlvbiAocHJlZCwgZmlsdGVyYWJsZSkge1xuICAgICAgICByZXR1cm4gX2lzT2JqZWN0KGZpbHRlcmFibGUpID8gX3JlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgICAgIGlmIChwcmVkKGZpbHRlcmFibGVba2V5XSkpIHtcbiAgICAgICAgICAgICAgICBhY2Nba2V5XSA9IGZpbHRlcmFibGVba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sIHt9LCBrZXlzKGZpbHRlcmFibGUpKSA6IC8vIGVsc2VcbiAgICAgICAgX2ZpbHRlcihwcmVkLCBmaWx0ZXJhYmxlKTtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGxpc3QgYnkgcHVsbGluZyBldmVyeSBpdGVtIG91dCBvZiBpdCAoYW5kIGFsbCBpdHMgc3ViLWFycmF5cylcbiAgICAgKiBhbmQgcHV0dGluZyB0aGVtIGluIGEgbmV3IGFycmF5LCBkZXB0aC1maXJzdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFthXSAtPiBbYl1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGZsYXR0ZW5lZCBsaXN0LlxuICAgICAqIEBzZWUgUi51bm5lc3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmZsYXR0ZW4oWzEsIDIsIFszLCA0XSwgNSwgWzYsIFs3LCA4LCBbOSwgWzEwLCAxMV0sIDEyXV1dXSk7XG4gICAgICogICAgICAvLz0+IFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMCwgMTEsIDEyXVxuICAgICAqL1xuICAgIHZhciBmbGF0dGVuID0gX2N1cnJ5MShfbWFrZUZsYXQodHJ1ZSkpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIG5ldyBmdW5jdGlvbiBtdWNoIGxpa2UgdGhlIHN1cHBsaWVkIG9uZSwgZXhjZXB0IHRoYXQgdGhlIGZpcnN0IHR3b1xuICAgICAqIGFyZ3VtZW50cycgb3JkZXIgaXMgcmV2ZXJzZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKGEgLT4gYiAtPiBjIC0+IC4uLiAtPiB6KSAtPiAoYiAtPiBhIC0+IGMgLT4gLi4uIC0+IHopXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGludm9rZSB3aXRoIGl0cyBmaXJzdCB0d28gcGFyYW1ldGVycyByZXZlcnNlZC5cbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgcmVzdWx0IG9mIGludm9raW5nIGBmbmAgd2l0aCBpdHMgZmlyc3QgdHdvIHBhcmFtZXRlcnMnIG9yZGVyIHJldmVyc2VkLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtZXJnZVRocmVlID0gKGEsIGIsIGMpID0+IFtdLmNvbmNhdChhLCBiLCBjKTtcbiAgICAgKlxuICAgICAqICAgICAgbWVyZ2VUaHJlZSgxLCAyLCAzKTsgLy89PiBbMSwgMiwgM11cbiAgICAgKlxuICAgICAqICAgICAgUi5mbGlwKG1lcmdlVGhyZWUpKDEsIDIsIDMpOyAvLz0+IFsyLCAxLCAzXVxuICAgICAqL1xuICAgIHZhciBmbGlwID0gX2N1cnJ5MShmdW5jdGlvbiBmbGlwKGZuKSB7XG4gICAgICAgIHJldHVybiBjdXJyeShmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBfc2xpY2UoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGFyZ3NbMF0gPSBiO1xuICAgICAgICAgICAgYXJnc1sxXSA9IGE7XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgZ2l2ZW4gbGlzdCBvciBzdHJpbmcuIEluIHNvbWUgbGlicmFyaWVzXG4gICAgICogdGhpcyBmdW5jdGlvbiBpcyBuYW1lZCBgZmlyc3RgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IGEgfCBVbmRlZmluZWRcbiAgICAgKiBAc2lnIFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gbGlzdFxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLnRhaWwsIFIuaW5pdCwgUi5sYXN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5oZWFkKFsnZmknLCAnZm8nLCAnZnVtJ10pOyAvLz0+ICdmaSdcbiAgICAgKiAgICAgIFIuaGVhZChbXSk7IC8vPT4gdW5kZWZpbmVkXG4gICAgICpcbiAgICAgKiAgICAgIFIuaGVhZCgnYWJjJyk7IC8vPT4gJ2EnXG4gICAgICogICAgICBSLmhlYWQoJycpOyAvLz0+ICcnXG4gICAgICovXG4gICAgdmFyIGhlYWQgPSBudGgoMCk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFsbCBidXQgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgZ2l2ZW4gbGlzdCBvciBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gW2FdXG4gICAgICogQHNpZyBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHsqfSBsaXN0XG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIubGFzdCwgUi5oZWFkLCBSLnRhaWxcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmluaXQoWzEsIDIsIDNdKTsgIC8vPT4gWzEsIDJdXG4gICAgICogICAgICBSLmluaXQoWzEsIDJdKTsgICAgIC8vPT4gWzFdXG4gICAgICogICAgICBSLmluaXQoWzFdKTsgICAgICAgIC8vPT4gW11cbiAgICAgKiAgICAgIFIuaW5pdChbXSk7ICAgICAgICAgLy89PiBbXVxuICAgICAqXG4gICAgICogICAgICBSLmluaXQoJ2FiYycpOyAgLy89PiAnYWInXG4gICAgICogICAgICBSLmluaXQoJ2FiJyk7ICAgLy89PiAnYSdcbiAgICAgKiAgICAgIFIuaW5pdCgnYScpOyAgICAvLz0+ICcnXG4gICAgICogICAgICBSLmluaXQoJycpOyAgICAgLy89PiAnJ1xuICAgICAqL1xuICAgIHZhciBpbml0ID0gc2xpY2UoMCwgLTEpO1xuXG4gICAgLyoqXG4gICAgICogQ29tYmluZXMgdHdvIGxpc3RzIGludG8gYSBzZXQgKGkuZS4gbm8gZHVwbGljYXRlcykgY29tcG9zZWQgb2YgdGhvc2VcbiAgICAgKiBlbGVtZW50cyBjb21tb24gdG8gYm90aCBsaXN0cy4gRHVwbGljYXRpb24gaXMgZGV0ZXJtaW5lZCBhY2NvcmRpbmcgdG8gdGhlXG4gICAgICogdmFsdWUgcmV0dXJuZWQgYnkgYXBwbHlpbmcgdGhlIHN1cHBsaWVkIHByZWRpY2F0ZSB0byB0d28gbGlzdCBlbGVtZW50cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyAoYSAtPiBhIC0+IEJvb2xlYW4pIC0+IFsqXSAtPiBbKl0gLT4gWypdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBBIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGRldGVybWluZXMgd2hldGhlclxuICAgICAqICAgICAgICB0aGUgdHdvIHN1cHBsaWVkIGVsZW1lbnRzIGFyZSBlcXVhbC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MSBPbmUgbGlzdCBvZiBpdGVtcyB0byBjb21wYXJlXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDIgQSBzZWNvbmQgbGlzdCBvZiBpdGVtcyB0byBjb21wYXJlXG4gICAgICogQHJldHVybiB7QXJyYXl9IEEgbmV3IGxpc3QgY29udGFpbmluZyB0aG9zZSBlbGVtZW50cyBjb21tb24gdG8gYm90aCBsaXN0cy5cbiAgICAgKiBAc2VlIFIuaW50ZXJzZWN0aW9uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGJ1ZmZhbG9TcHJpbmdmaWVsZCA9IFtcbiAgICAgKiAgICAgICAge2lkOiA4MjQsIG5hbWU6ICdSaWNoaWUgRnVyYXknfSxcbiAgICAgKiAgICAgICAge2lkOiA5NTYsIG5hbWU6ICdEZXdleSBNYXJ0aW4nfSxcbiAgICAgKiAgICAgICAge2lkOiAzMTMsIG5hbWU6ICdCcnVjZSBQYWxtZXInfSxcbiAgICAgKiAgICAgICAge2lkOiA0NTYsIG5hbWU6ICdTdGVwaGVuIFN0aWxscyd9LFxuICAgICAqICAgICAgICB7aWQ6IDE3NywgbmFtZTogJ05laWwgWW91bmcnfVxuICAgICAqICAgICAgXTtcbiAgICAgKiAgICAgIHZhciBjc255ID0gW1xuICAgICAqICAgICAgICB7aWQ6IDIwNCwgbmFtZTogJ0RhdmlkIENyb3NieSd9LFxuICAgICAqICAgICAgICB7aWQ6IDQ1NiwgbmFtZTogJ1N0ZXBoZW4gU3RpbGxzJ30sXG4gICAgICogICAgICAgIHtpZDogNTM5LCBuYW1lOiAnR3JhaGFtIE5hc2gnfSxcbiAgICAgKiAgICAgICAge2lkOiAxNzcsIG5hbWU6ICdOZWlsIFlvdW5nJ31cbiAgICAgKiAgICAgIF07XG4gICAgICpcbiAgICAgKiAgICAgIFIuaW50ZXJzZWN0aW9uV2l0aChSLmVxQnkoUi5wcm9wKCdpZCcpKSwgYnVmZmFsb1NwcmluZ2ZpZWxkLCBjc255KTtcbiAgICAgKiAgICAgIC8vPT4gW3tpZDogNDU2LCBuYW1lOiAnU3RlcGhlbiBTdGlsbHMnfSwge2lkOiAxNzcsIG5hbWU6ICdOZWlsIFlvdW5nJ31dXG4gICAgICovXG4gICAgdmFyIGludGVyc2VjdGlvbldpdGggPSBfY3VycnkzKGZ1bmN0aW9uIGludGVyc2VjdGlvbldpdGgocHJlZCwgbGlzdDEsIGxpc3QyKSB7XG4gICAgICAgIHZhciBsb29rdXBMaXN0LCBmaWx0ZXJlZExpc3Q7XG4gICAgICAgIGlmIChsaXN0MS5sZW5ndGggPiBsaXN0Mi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxvb2t1cExpc3QgPSBsaXN0MTtcbiAgICAgICAgICAgIGZpbHRlcmVkTGlzdCA9IGxpc3QyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9va3VwTGlzdCA9IGxpc3QyO1xuICAgICAgICAgICAgZmlsdGVyZWRMaXN0ID0gbGlzdDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBmaWx0ZXJlZExpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoX2NvbnRhaW5zV2l0aChwcmVkLCBmaWx0ZXJlZExpc3RbaWR4XSwgbG9va3VwTGlzdCkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoXSA9IGZpbHRlcmVkTGlzdFtpZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuaXFXaXRoKHByZWQsIHJlc3VsdHMpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVHJhbnNmb3JtcyB0aGUgaXRlbXMgb2YgdGhlIGxpc3Qgd2l0aCB0aGUgdHJhbnNkdWNlciBhbmQgYXBwZW5kcyB0aGVcbiAgICAgKiB0cmFuc2Zvcm1lZCBpdGVtcyB0byB0aGUgYWNjdW11bGF0b3IgdXNpbmcgYW4gYXBwcm9wcmlhdGUgaXRlcmF0b3IgZnVuY3Rpb25cbiAgICAgKiBiYXNlZCBvbiB0aGUgYWNjdW11bGF0b3IgdHlwZS5cbiAgICAgKlxuICAgICAqIFRoZSBhY2N1bXVsYXRvciBjYW4gYmUgYW4gYXJyYXksIHN0cmluZywgb2JqZWN0IG9yIGEgdHJhbnNmb3JtZXIuIEl0ZXJhdGVkXG4gICAgICogaXRlbXMgd2lsbCBiZSBhcHBlbmRlZCB0byBhcnJheXMgYW5kIGNvbmNhdGVuYXRlZCB0byBzdHJpbmdzLiBPYmplY3RzIHdpbGxcbiAgICAgKiBiZSBtZXJnZWQgZGlyZWN0bHkgb3IgMi1pdGVtIGFycmF5cyB3aWxsIGJlIG1lcmdlZCBhcyBrZXksIHZhbHVlIHBhaXJzLlxuICAgICAqXG4gICAgICogVGhlIGFjY3VtdWxhdG9yIGNhbiBhbHNvIGJlIGEgdHJhbnNmb3JtZXIgb2JqZWN0IHRoYXQgcHJvdmlkZXMgYSAyLWFyaXR5XG4gICAgICogcmVkdWNpbmcgaXRlcmF0b3IgZnVuY3Rpb24sIHN0ZXAsIDAtYXJpdHkgaW5pdGlhbCB2YWx1ZSBmdW5jdGlvbiwgaW5pdCwgYW5kXG4gICAgICogMS1hcml0eSByZXN1bHQgZXh0cmFjdGlvbiBmdW5jdGlvbiByZXN1bHQuIFRoZSBzdGVwIGZ1bmN0aW9uIGlzIHVzZWQgYXMgdGhlXG4gICAgICogaXRlcmF0b3IgZnVuY3Rpb24gaW4gcmVkdWNlLiBUaGUgcmVzdWx0IGZ1bmN0aW9uIGlzIHVzZWQgdG8gY29udmVydCB0aGVcbiAgICAgKiBmaW5hbCBhY2N1bXVsYXRvciBpbnRvIHRoZSByZXR1cm4gdHlwZSBhbmQgaW4gbW9zdCBjYXNlcyBpcyBSLmlkZW50aXR5LiBUaGVcbiAgICAgKiBpbml0IGZ1bmN0aW9uIGlzIHVzZWQgdG8gcHJvdmlkZSB0aGUgaW5pdGlhbCBhY2N1bXVsYXRvci5cbiAgICAgKlxuICAgICAqIFRoZSBpdGVyYXRpb24gaXMgcGVyZm9ybWVkIHdpdGggUi5yZWR1Y2UgYWZ0ZXIgaW5pdGlhbGl6aW5nIHRoZSB0cmFuc2R1Y2VyLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGEgLT4gKGIgLT4gYikgLT4gW2NdIC0+IGFcbiAgICAgKiBAcGFyYW0geyp9IGFjYyBUaGUgaW5pdGlhbCBhY2N1bXVsYXRvciB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSB4ZiBUaGUgdHJhbnNkdWNlciBmdW5jdGlvbi4gUmVjZWl2ZXMgYSB0cmFuc2Zvcm1lciBhbmQgcmV0dXJucyBhIHRyYW5zZm9ybWVyLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSBmaW5hbCwgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIG51bWJlcnMgPSBbMSwgMiwgMywgNF07XG4gICAgICogICAgICB2YXIgdHJhbnNkdWNlciA9IFIuY29tcG9zZShSLm1hcChSLmFkZCgxKSksIFIudGFrZSgyKSk7XG4gICAgICpcbiAgICAgKiAgICAgIFIuaW50byhbXSwgdHJhbnNkdWNlciwgbnVtYmVycyk7IC8vPT4gWzIsIDNdXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBpbnRvQXJyYXkgPSBSLmludG8oW10pO1xuICAgICAqICAgICAgaW50b0FycmF5KHRyYW5zZHVjZXIsIG51bWJlcnMpOyAvLz0+IFsyLCAzXVxuICAgICAqL1xuICAgIHZhciBpbnRvID0gX2N1cnJ5MyhmdW5jdGlvbiBpbnRvKGFjYywgeGYsIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIF9pc1RyYW5zZm9ybWVyKGFjYykgPyBfcmVkdWNlKHhmKGFjYyksIGFjY1snQEB0cmFuc2R1Y2VyL2luaXQnXSgpLCBsaXN0KSA6IF9yZWR1Y2UoeGYoX3N0ZXBDYXQoYWNjKSksIF9jbG9uZShhY2MsIFtdLCBbXSwgZmFsc2UpLCBsaXN0KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFNhbWUgYXMgUi5pbnZlcnRPYmosIGhvd2V2ZXIgdGhpcyBhY2NvdW50cyBmb3Igb2JqZWN0cyB3aXRoIGR1cGxpY2F0ZSB2YWx1ZXNcbiAgICAgKiBieSBwdXR0aW5nIHRoZSB2YWx1ZXMgaW50byBhbiBhcnJheS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge3M6IHh9IC0+IHt4OiBbIHMsIC4uLiBdfVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCBvciBhcnJheSB0byBpbnZlcnRcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IG91dCBBIG5ldyBvYmplY3Qgd2l0aCBrZXlzXG4gICAgICogaW4gYW4gYXJyYXkuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHJhY2VSZXN1bHRzQnlGaXJzdE5hbWUgPSB7XG4gICAgICogICAgICAgIGZpcnN0OiAnYWxpY2UnLFxuICAgICAqICAgICAgICBzZWNvbmQ6ICdqYWtlJyxcbiAgICAgKiAgICAgICAgdGhpcmQ6ICdhbGljZScsXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgUi5pbnZlcnQocmFjZVJlc3VsdHNCeUZpcnN0TmFtZSk7XG4gICAgICogICAgICAvLz0+IHsgJ2FsaWNlJzogWydmaXJzdCcsICd0aGlyZCddLCAnamFrZSc6WydzZWNvbmQnXSB9XG4gICAgICovXG4gICAgdmFyIGludmVydCA9IF9jdXJyeTEoZnVuY3Rpb24gaW52ZXJ0KG9iaikge1xuICAgICAgICB2YXIgcHJvcHMgPSBrZXlzKG9iaik7XG4gICAgICAgIHZhciBsZW4gPSBwcm9wcy5sZW5ndGg7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgb3V0ID0ge307XG4gICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBwcm9wc1tpZHhdO1xuICAgICAgICAgICAgdmFyIHZhbCA9IG9ialtrZXldO1xuICAgICAgICAgICAgdmFyIGxpc3QgPSBfaGFzKHZhbCwgb3V0KSA/IG91dFt2YWxdIDogb3V0W3ZhbF0gPSBbXTtcbiAgICAgICAgICAgIGxpc3RbbGlzdC5sZW5ndGhdID0ga2V5O1xuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgb2JqZWN0IHdpdGggdGhlIGtleXMgb2YgdGhlIGdpdmVuIG9iamVjdCBhcyB2YWx1ZXMsIGFuZCB0aGVcbiAgICAgKiB2YWx1ZXMgb2YgdGhlIGdpdmVuIG9iamVjdCwgd2hpY2ggYXJlIGNvZXJjZWQgdG8gc3RyaW5ncywgYXMga2V5cy4gTm90ZVxuICAgICAqIHRoYXQgdGhlIGxhc3Qga2V5IGZvdW5kIGlzIHByZWZlcnJlZCB3aGVuIGhhbmRsaW5nIHRoZSBzYW1lIHZhbHVlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyB7czogeH0gLT4ge3g6IHN9XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IG9yIGFycmF5IHRvIGludmVydFxuICAgICAqIEByZXR1cm4ge09iamVjdH0gb3V0IEEgbmV3IG9iamVjdFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciByYWNlUmVzdWx0cyA9IHtcbiAgICAgKiAgICAgICAgZmlyc3Q6ICdhbGljZScsXG4gICAgICogICAgICAgIHNlY29uZDogJ2pha2UnXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgUi5pbnZlcnRPYmoocmFjZVJlc3VsdHMpO1xuICAgICAqICAgICAgLy89PiB7ICdhbGljZSc6ICdmaXJzdCcsICdqYWtlJzonc2Vjb25kJyB9XG4gICAgICpcbiAgICAgKiAgICAgIC8vIEFsdGVybmF0aXZlbHk6XG4gICAgICogICAgICB2YXIgcmFjZVJlc3VsdHMgPSBbJ2FsaWNlJywgJ2pha2UnXTtcbiAgICAgKiAgICAgIFIuaW52ZXJ0T2JqKHJhY2VSZXN1bHRzKTtcbiAgICAgKiAgICAgIC8vPT4geyAnYWxpY2UnOiAnMCcsICdqYWtlJzonMScgfVxuICAgICAqL1xuICAgIHZhciBpbnZlcnRPYmogPSBfY3VycnkxKGZ1bmN0aW9uIGludmVydE9iaihvYmopIHtcbiAgICAgICAgdmFyIHByb3BzID0ga2V5cyhvYmopO1xuICAgICAgICB2YXIgbGVuID0gcHJvcHMubGVuZ3RoO1xuICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgdmFyIG91dCA9IHt9O1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gcHJvcHNbaWR4XTtcbiAgICAgICAgICAgIG91dFtvYmpba2V5XV0gPSBrZXk7XG4gICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGl0cyB0eXBlJ3MgZW1wdHkgdmFsdWU7IGBmYWxzZWBcbiAgICAgKiBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgYSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHsqfSB4XG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAc2VlIFIuZW1wdHlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmlzRW1wdHkoWzEsIDIsIDNdKTsgICAvLz0+IGZhbHNlXG4gICAgICogICAgICBSLmlzRW1wdHkoW10pOyAgICAgICAgICAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuaXNFbXB0eSgnJyk7ICAgICAgICAgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi5pc0VtcHR5KG51bGwpOyAgICAgICAgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5pc0VtcHR5KHt9KTsgICAgICAgICAgLy89PiB0cnVlXG4gICAgICogICAgICBSLmlzRW1wdHkoe2xlbmd0aDogMH0pOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGlzRW1wdHkgPSBfY3VycnkxKGZ1bmN0aW9uIGlzRW1wdHkoeCkge1xuICAgICAgICByZXR1cm4geCAhPSBudWxsICYmIGVxdWFscyh4LCBlbXB0eSh4KSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIGdpdmVuIGxpc3Qgb3Igc3RyaW5nLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjRcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IGEgfCBVbmRlZmluZWRcbiAgICAgKiBAc2lnIFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0geyp9IGxpc3RcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5pbml0LCBSLmhlYWQsIFIudGFpbFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIubGFzdChbJ2ZpJywgJ2ZvJywgJ2Z1bSddKTsgLy89PiAnZnVtJ1xuICAgICAqICAgICAgUi5sYXN0KFtdKTsgLy89PiB1bmRlZmluZWRcbiAgICAgKlxuICAgICAqICAgICAgUi5sYXN0KCdhYmMnKTsgLy89PiAnYydcbiAgICAgKiAgICAgIFIubGFzdCgnJyk7IC8vPT4gJydcbiAgICAgKi9cbiAgICB2YXIgbGFzdCA9IG50aCgtMSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwb3NpdGlvbiBvZiB0aGUgbGFzdCBvY2N1cnJlbmNlIG9mIGFuIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmXG4gICAgICogdGhlIGl0ZW0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBhcnJheS4gYFIuZXF1YWxzYCBpcyB1c2VkIHRvIGRldGVybWluZVxuICAgICAqIGVxdWFsaXR5LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgYSAtPiBbYV0gLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHsqfSB0YXJnZXQgVGhlIGl0ZW0gdG8gZmluZC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSB4cyBUaGUgYXJyYXkgdG8gc2VhcmNoIGluLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gdGhlIGluZGV4IG9mIHRoZSB0YXJnZXQsIG9yIC0xIGlmIHRoZSB0YXJnZXQgaXMgbm90IGZvdW5kLlxuICAgICAqIEBzZWUgUi5pbmRleE9mXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5sYXN0SW5kZXhPZigzLCBbLTEsMywzLDAsMSwyLDMsNF0pOyAvLz0+IDZcbiAgICAgKiAgICAgIFIubGFzdEluZGV4T2YoMTAsIFsxLDIsMyw0XSk7IC8vPT4gLTFcbiAgICAgKi9cbiAgICB2YXIgbGFzdEluZGV4T2YgPSBfY3VycnkyKGZ1bmN0aW9uIGxhc3RJbmRleE9mKHRhcmdldCwgeHMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB4cy5sYXN0SW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJyAmJiAhX2lzQXJyYXkoeHMpKSB7XG4gICAgICAgICAgICByZXR1cm4geHMubGFzdEluZGV4T2YodGFyZ2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpZHggPSB4cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVxdWFscyh4c1tpZHhdLCB0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpZHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeCAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGZ1bmN0aW9uIGFuZFxuICAgICAqIGEgW2Z1bmN0b3JdKGh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5bGFuZC9mYW50YXN5LWxhbmQjZnVuY3RvciksXG4gICAgICogYXBwbGllcyB0aGUgZnVuY3Rpb24gdG8gZWFjaCBvZiB0aGUgZnVuY3RvcidzIHZhbHVlcywgYW5kIHJldHVybnNcbiAgICAgKiBhIGZ1bmN0b3Igb2YgdGhlIHNhbWUgc2hhcGUuXG4gICAgICpcbiAgICAgKiBSYW1kYSBwcm92aWRlcyBzdWl0YWJsZSBgbWFwYCBpbXBsZW1lbnRhdGlvbnMgZm9yIGBBcnJheWAgYW5kIGBPYmplY3RgLFxuICAgICAqIHNvIHRoaXMgZnVuY3Rpb24gbWF5IGJlIGFwcGxpZWQgdG8gYFsxLCAyLCAzXWAgb3IgYHt4OiAxLCB5OiAyLCB6OiAzfWAuXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgbWFwYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEFsc28gdHJlYXRzIGZ1bmN0aW9ucyBhcyBmdW5jdG9ycyBhbmQgd2lsbCBjb21wb3NlIHRoZW0gdG9nZXRoZXIuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBGdW5jdG9yIGYgPT4gKGEgLT4gYikgLT4gZiBhIC0+IGYgYlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gZXZlcnkgZWxlbWVudCBvZiB0aGUgaW5wdXQgYGxpc3RgLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gYmUgaXRlcmF0ZWQgb3Zlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIG5ldyBsaXN0LlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2UsIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZG91YmxlID0geCA9PiB4ICogMjtcbiAgICAgKlxuICAgICAqICAgICAgUi5tYXAoZG91YmxlLCBbMSwgMiwgM10pOyAvLz0+IFsyLCA0LCA2XVxuICAgICAqXG4gICAgICogICAgICBSLm1hcChkb3VibGUsIHt4OiAxLCB5OiAyLCB6OiAzfSk7IC8vPT4ge3g6IDIsIHk6IDQsIHo6IDZ9XG4gICAgICovXG4gICAgdmFyIG1hcCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnbWFwJywgX3htYXAsIGZ1bmN0aW9uIG1hcChmbiwgZnVuY3Rvcikge1xuICAgICAgICBzd2l0Y2ggKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChmdW5jdG9yKSkge1xuICAgICAgICBjYXNlICdbb2JqZWN0IEZ1bmN0aW9uXSc6XG4gICAgICAgICAgICByZXR1cm4gY3VycnlOKGZ1bmN0b3IubGVuZ3RoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZnVuY3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBjYXNlICdbb2JqZWN0IE9iamVjdF0nOlxuICAgICAgICAgICAgcmV0dXJuIF9yZWR1Y2UoZnVuY3Rpb24gKGFjYywga2V5KSB7XG4gICAgICAgICAgICAgICAgYWNjW2tleV0gPSBmbihmdW5jdG9yW2tleV0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9LCB7fSwga2V5cyhmdW5jdG9yKSk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gX21hcChmbiwgZnVuY3Rvcik7XG4gICAgICAgIH1cbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBBbiBPYmplY3Qtc3BlY2lmaWMgdmVyc2lvbiBvZiBgbWFwYC4gVGhlIGZ1bmN0aW9uIGlzIGFwcGxpZWQgdG8gdGhyZWVcbiAgICAgKiBhcmd1bWVudHM6ICoodmFsdWUsIGtleSwgb2JqKSouIElmIG9ubHkgdGhlIHZhbHVlIGlzIHNpZ25pZmljYW50LCB1c2VcbiAgICAgKiBgbWFwYCBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyAoKCosIFN0cmluZywgT2JqZWN0KSAtPiAqKSAtPiBPYmplY3QgLT4gT2JqZWN0XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAqIEBzZWUgUi5tYXBcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgdmFsdWVzID0geyB4OiAxLCB5OiAyLCB6OiAzIH07XG4gICAgICogICAgICB2YXIgcHJlcGVuZEtleUFuZERvdWJsZSA9IChudW0sIGtleSwgb2JqKSA9PiBrZXkgKyAobnVtICogMik7XG4gICAgICpcbiAgICAgKiAgICAgIFIubWFwT2JqSW5kZXhlZChwcmVwZW5kS2V5QW5kRG91YmxlLCB2YWx1ZXMpOyAvLz0+IHsgeDogJ3gyJywgeTogJ3k0JywgejogJ3o2JyB9XG4gICAgICovXG4gICAgdmFyIG1hcE9iakluZGV4ZWQgPSBfY3VycnkyKGZ1bmN0aW9uIG1hcE9iakluZGV4ZWQoZm4sIG9iaikge1xuICAgICAgICByZXR1cm4gX3JlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgICAgIGFjY1trZXldID0gZm4ob2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sIHt9LCBrZXlzKG9iaikpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBvYmplY3Qgd2l0aCB0aGUgb3duIHByb3BlcnRpZXMgb2YgdGhlIHR3byBwcm92aWRlZCBvYmplY3RzLiBJZlxuICAgICAqIGEga2V5IGV4aXN0cyBpbiBib3RoIG9iamVjdHMsIHRoZSBwcm92aWRlZCBmdW5jdGlvbiBpcyBhcHBsaWVkIHRvIHRoZSB2YWx1ZXNcbiAgICAgKiBhc3NvY2lhdGVkIHdpdGggdGhlIGtleSBpbiBlYWNoIG9iamVjdCwgd2l0aCB0aGUgcmVzdWx0IGJlaW5nIHVzZWQgYXMgdGhlXG4gICAgICogdmFsdWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBrZXkgaW4gdGhlIHJldHVybmVkIG9iamVjdC4gVGhlIGtleSB3aWxsIGJlXG4gICAgICogZXhjbHVkZWQgZnJvbSB0aGUgcmV0dXJuZWQgb2JqZWN0IGlmIHRoZSByZXN1bHRpbmcgdmFsdWUgaXMgYHVuZGVmaW5lZGAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyAoYSAtPiBhIC0+IGEpIC0+IHthfSAtPiB7YX0gLT4ge2F9XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByXG4gICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAqIEBzZWUgUi5tZXJnZSwgUi5tZXJnZVdpdGhLZXlcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1lcmdlV2l0aChSLmNvbmNhdCxcbiAgICAgKiAgICAgICAgICAgICAgICAgIHsgYTogdHJ1ZSwgdmFsdWVzOiBbMTAsIDIwXSB9LFxuICAgICAqICAgICAgICAgICAgICAgICAgeyBiOiB0cnVlLCB2YWx1ZXM6IFsxNSwgMzVdIH0pO1xuICAgICAqICAgICAgLy89PiB7IGE6IHRydWUsIGI6IHRydWUsIHZhbHVlczogWzEwLCAyMCwgMTUsIDM1XSB9XG4gICAgICovXG4gICAgdmFyIG1lcmdlV2l0aCA9IF9jdXJyeTMoZnVuY3Rpb24gbWVyZ2VXaXRoKGZuLCBsLCByKSB7XG4gICAgICAgIHJldHVybiBtZXJnZVdpdGhLZXkoZnVuY3Rpb24gKF8sIF9sLCBfcikge1xuICAgICAgICAgICAgcmV0dXJuIGZuKF9sLCBfcik7XG4gICAgICAgIH0sIGwsIHIpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBmdW5jdGlvbiBgZmAgYW5kIGEgbGlzdCBvZiBhcmd1bWVudHMsIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gYGdgLlxuICAgICAqIFdoZW4gYXBwbGllZCwgYGdgIHJldHVybnMgdGhlIHJlc3VsdCBvZiBhcHBseWluZyBgZmAgdG8gdGhlIGFyZ3VtZW50c1xuICAgICAqIHByb3ZpZGVkIGluaXRpYWxseSBmb2xsb3dlZCBieSB0aGUgYXJndW1lbnRzIHByb3ZpZGVkIHRvIGBnYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKChhLCBiLCBjLCAuLi4sIG4pIC0+IHgpIC0+IFthLCBiLCBjLCAuLi5dIC0+ICgoZCwgZSwgZiwgLi4uLCBuKSAtPiB4KVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcmdzXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQHNlZSBSLnBhcnRpYWxSaWdodFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtdWx0aXBseSA9IChhLCBiKSA9PiBhICogYjtcbiAgICAgKiAgICAgIHZhciBkb3VibGUgPSBSLnBhcnRpYWwobXVsdGlwbHksIFsyXSk7XG4gICAgICogICAgICBkb3VibGUoMik7IC8vPT4gNFxuICAgICAqXG4gICAgICogICAgICB2YXIgZ3JlZXQgPSAoc2FsdXRhdGlvbiwgdGl0bGUsIGZpcnN0TmFtZSwgbGFzdE5hbWUpID0+XG4gICAgICogICAgICAgIHNhbHV0YXRpb24gKyAnLCAnICsgdGl0bGUgKyAnICcgKyBmaXJzdE5hbWUgKyAnICcgKyBsYXN0TmFtZSArICchJztcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNheUhlbGxvID0gUi5wYXJ0aWFsKGdyZWV0LCBbJ0hlbGxvJ10pO1xuICAgICAqICAgICAgdmFyIHNheUhlbGxvVG9NcyA9IFIucGFydGlhbChzYXlIZWxsbywgWydNcy4nXSk7XG4gICAgICogICAgICBzYXlIZWxsb1RvTXMoJ0phbmUnLCAnSm9uZXMnKTsgLy89PiAnSGVsbG8sIE1zLiBKYW5lIEpvbmVzISdcbiAgICAgKi9cbiAgICB2YXIgcGFydGlhbCA9IF9jcmVhdGVQYXJ0aWFsQXBwbGljYXRvcihfY29uY2F0KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgZnVuY3Rpb24gYGZgIGFuZCBhIGxpc3Qgb2YgYXJndW1lbnRzLCBhbmQgcmV0dXJucyBhIGZ1bmN0aW9uIGBnYC5cbiAgICAgKiBXaGVuIGFwcGxpZWQsIGBnYCByZXR1cm5zIHRoZSByZXN1bHQgb2YgYXBwbHlpbmcgYGZgIHRvIHRoZSBhcmd1bWVudHNcbiAgICAgKiBwcm92aWRlZCB0byBgZ2AgZm9sbG93ZWQgYnkgdGhlIGFyZ3VtZW50cyBwcm92aWRlZCBpbml0aWFsbHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgoYSwgYiwgYywgLi4uLCBuKSAtPiB4KSAtPiBbZCwgZSwgZiwgLi4uLCBuXSAtPiAoKGEsIGIsIGMsIC4uLikgLT4geClcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJnc1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBzZWUgUi5wYXJ0aWFsXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGdyZWV0ID0gKHNhbHV0YXRpb24sIHRpdGxlLCBmaXJzdE5hbWUsIGxhc3ROYW1lKSA9PlxuICAgICAqICAgICAgICBzYWx1dGF0aW9uICsgJywgJyArIHRpdGxlICsgJyAnICsgZmlyc3ROYW1lICsgJyAnICsgbGFzdE5hbWUgKyAnISc7XG4gICAgICpcbiAgICAgKiAgICAgIHZhciBncmVldE1zSmFuZUpvbmVzID0gUi5wYXJ0aWFsUmlnaHQoZ3JlZXQsIFsnTXMuJywgJ0phbmUnLCAnSm9uZXMnXSk7XG4gICAgICpcbiAgICAgKiAgICAgIGdyZWV0TXNKYW5lSm9uZXMoJ0hlbGxvJyk7IC8vPT4gJ0hlbGxvLCBNcy4gSmFuZSBKb25lcyEnXG4gICAgICovXG4gICAgdmFyIHBhcnRpYWxSaWdodCA9IF9jcmVhdGVQYXJ0aWFsQXBwbGljYXRvcihmbGlwKF9jb25jYXQpKTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgd2hldGhlciBhIG5lc3RlZCBwYXRoIG9uIGFuIG9iamVjdCBoYXMgYSBzcGVjaWZpYyB2YWx1ZSwgaW5cbiAgICAgKiBgUi5lcXVhbHNgIHRlcm1zLiBNb3N0IGxpa2VseSB1c2VkIHRvIGZpbHRlciBhIGxpc3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjcuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgW1N0cmluZ10gLT4gKiAtPiB7U3RyaW5nOiAqfSAtPiBCb29sZWFuXG4gICAgICogQHBhcmFtIHtBcnJheX0gcGF0aCBUaGUgcGF0aCBvZiB0aGUgbmVzdGVkIHByb3BlcnR5IHRvIHVzZVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsIFRoZSB2YWx1ZSB0byBjb21wYXJlIHRoZSBuZXN0ZWQgcHJvcGVydHkgd2l0aFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBjaGVjayB0aGUgbmVzdGVkIHByb3BlcnR5IGluXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSB2YWx1ZSBlcXVhbHMgdGhlIG5lc3RlZCBvYmplY3QgcHJvcGVydHksXG4gICAgICogICAgICAgICBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgdXNlcjEgPSB7IGFkZHJlc3M6IHsgemlwQ29kZTogOTAyMTAgfSB9O1xuICAgICAqICAgICAgdmFyIHVzZXIyID0geyBhZGRyZXNzOiB7IHppcENvZGU6IDU1NTU1IH0gfTtcbiAgICAgKiAgICAgIHZhciB1c2VyMyA9IHsgbmFtZTogJ0JvYicgfTtcbiAgICAgKiAgICAgIHZhciB1c2VycyA9IFsgdXNlcjEsIHVzZXIyLCB1c2VyMyBdO1xuICAgICAqICAgICAgdmFyIGlzRmFtb3VzID0gUi5wYXRoRXEoWydhZGRyZXNzJywgJ3ppcENvZGUnXSwgOTAyMTApO1xuICAgICAqICAgICAgUi5maWx0ZXIoaXNGYW1vdXMsIHVzZXJzKTsgLy89PiBbIHVzZXIxIF1cbiAgICAgKi9cbiAgICB2YXIgcGF0aEVxID0gX2N1cnJ5MyhmdW5jdGlvbiBwYXRoRXEoX3BhdGgsIHZhbCwgb2JqKSB7XG4gICAgICAgIHJldHVybiBlcXVhbHMocGF0aChfcGF0aCwgb2JqKSwgdmFsKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBieSBwbHVja2luZyB0aGUgc2FtZSBuYW1lZCBwcm9wZXJ0eSBvZmYgYWxsIG9iamVjdHMgaW5cbiAgICAgKiB0aGUgbGlzdCBzdXBwbGllZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGsgLT4gW3trOiB2fV0gLT4gW3ZdXG4gICAgICogQHBhcmFtIHtOdW1iZXJ8U3RyaW5nfSBrZXkgVGhlIGtleSBuYW1lIHRvIHBsdWNrIG9mZiBvZiBlYWNoIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGxpc3Qgb2YgdmFsdWVzIGZvciB0aGUgZ2l2ZW4ga2V5LlxuICAgICAqIEBzZWUgUi5wcm9wc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucGx1Y2soJ2EnKShbe2E6IDF9LCB7YTogMn1dKTsgLy89PiBbMSwgMl1cbiAgICAgKiAgICAgIFIucGx1Y2soMCkoW1sxLCAyXSwgWzMsIDRdXSk7ICAgLy89PiBbMSwgM11cbiAgICAgKi9cbiAgICB2YXIgcGx1Y2sgPSBfY3VycnkyKGZ1bmN0aW9uIHBsdWNrKHAsIGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIG1hcChwcm9wKHApLCBsaXN0KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJlYXNvbmFibGUgYW5hbG9nIHRvIFNRTCBgc2VsZWN0YCBzdGF0ZW1lbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIFtrXSAtPiBbe2s6IHZ9XSAtPiBbe2s6IHZ9XVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByb3BzIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBwcm9qZWN0XG4gICAgICogQHBhcmFtIHtBcnJheX0gb2JqcyBUaGUgb2JqZWN0cyB0byBxdWVyeVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiBvYmplY3RzIHdpdGgganVzdCB0aGUgYHByb3BzYCBwcm9wZXJ0aWVzLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBhYmJ5ID0ge25hbWU6ICdBYmJ5JywgYWdlOiA3LCBoYWlyOiAnYmxvbmQnLCBncmFkZTogMn07XG4gICAgICogICAgICB2YXIgZnJlZCA9IHtuYW1lOiAnRnJlZCcsIGFnZTogMTIsIGhhaXI6ICdicm93bicsIGdyYWRlOiA3fTtcbiAgICAgKiAgICAgIHZhciBraWRzID0gW2FiYnksIGZyZWRdO1xuICAgICAqICAgICAgUi5wcm9qZWN0KFsnbmFtZScsICdncmFkZSddLCBraWRzKTsgLy89PiBbe25hbWU6ICdBYmJ5JywgZ3JhZGU6IDJ9LCB7bmFtZTogJ0ZyZWQnLCBncmFkZTogN31dXG4gICAgICovXG4gICAgLy8gcGFzc2luZyBgaWRlbnRpdHlgIGdpdmVzIGNvcnJlY3QgYXJpdHlcbiAgICB2YXIgcHJvamVjdCA9IHVzZVdpdGgoX21hcCwgW1xuICAgICAgICBwaWNrQWxsLFxuICAgICAgICBpZGVudGl0eVxuICAgIF0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHNwZWNpZmllZCBvYmplY3QgcHJvcGVydHkgaXMgZXF1YWwsIGluIGBSLmVxdWFsc2BcbiAgICAgKiB0ZXJtcywgdG8gdGhlIGdpdmVuIHZhbHVlOyBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBTdHJpbmcgLT4gYSAtPiBPYmplY3QgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHsqfSB2YWxcbiAgICAgKiBAcGFyYW0geyp9IG9ialxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQHNlZSBSLmVxdWFscywgUi5wcm9wU2F0aXNmaWVzXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGFiYnkgPSB7bmFtZTogJ0FiYnknLCBhZ2U6IDcsIGhhaXI6ICdibG9uZCd9O1xuICAgICAqICAgICAgdmFyIGZyZWQgPSB7bmFtZTogJ0ZyZWQnLCBhZ2U6IDEyLCBoYWlyOiAnYnJvd24nfTtcbiAgICAgKiAgICAgIHZhciBydXN0eSA9IHtuYW1lOiAnUnVzdHknLCBhZ2U6IDEwLCBoYWlyOiAnYnJvd24nfTtcbiAgICAgKiAgICAgIHZhciBhbG9pcyA9IHtuYW1lOiAnQWxvaXMnLCBhZ2U6IDE1LCBkaXNwb3NpdGlvbjogJ3N1cmx5J307XG4gICAgICogICAgICB2YXIga2lkcyA9IFthYmJ5LCBmcmVkLCBydXN0eSwgYWxvaXNdO1xuICAgICAqICAgICAgdmFyIGhhc0Jyb3duSGFpciA9IFIucHJvcEVxKCdoYWlyJywgJ2Jyb3duJyk7XG4gICAgICogICAgICBSLmZpbHRlcihoYXNCcm93bkhhaXIsIGtpZHMpOyAvLz0+IFtmcmVkLCBydXN0eV1cbiAgICAgKi9cbiAgICB2YXIgcHJvcEVxID0gX2N1cnJ5MyhmdW5jdGlvbiBwcm9wRXEobmFtZSwgdmFsLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIHByb3BTYXRpc2ZpZXMoZXF1YWxzKHZhbCksIG5hbWUsIG9iaik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgc3BlY2lmaWVkIG9iamVjdCBwcm9wZXJ0eSBpcyBvZiB0aGUgZ2l2ZW4gdHlwZTtcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBUeXBlXG4gICAgICogQHNpZyBUeXBlIC0+IFN0cmluZyAtPiBPYmplY3QgLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHR5cGVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICAgICAqIEBwYXJhbSB7Kn0gb2JqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAc2VlIFIuaXMsIFIucHJvcFNhdGlzZmllc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucHJvcElzKE51bWJlciwgJ3gnLCB7eDogMSwgeTogMn0pOyAgLy89PiB0cnVlXG4gICAgICogICAgICBSLnByb3BJcyhOdW1iZXIsICd4Jywge3g6ICdmb28nfSk7ICAgIC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIucHJvcElzKE51bWJlciwgJ3gnLCB7fSk7ICAgICAgICAgICAgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBwcm9wSXMgPSBfY3VycnkzKGZ1bmN0aW9uIHByb3BJcyh0eXBlLCBuYW1lLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIHByb3BTYXRpc2ZpZXMoaXModHlwZSksIG5hbWUsIG9iaik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc2luZ2xlIGl0ZW0gYnkgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGxpc3QsIHN1Y2Nlc3NpdmVseSBjYWxsaW5nXG4gICAgICogdGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIGFuZCBwYXNzaW5nIGl0IGFuIGFjY3VtdWxhdG9yIHZhbHVlIGFuZCB0aGUgY3VycmVudFxuICAgICAqIHZhbHVlIGZyb20gdGhlIGFycmF5LCBhbmQgdGhlbiBwYXNzaW5nIHRoZSByZXN1bHQgdG8gdGhlIG5leHQgY2FsbC5cbiAgICAgKlxuICAgICAqIFRoZSBpdGVyYXRvciBmdW5jdGlvbiByZWNlaXZlcyB0d28gdmFsdWVzOiAqKGFjYywgdmFsdWUpKi4gSXQgbWF5IHVzZVxuICAgICAqIGBSLnJlZHVjZWRgIHRvIHNob3J0Y3V0IHRoZSBpdGVyYXRpb24uXG4gICAgICpcbiAgICAgKiBOb3RlOiBgUi5yZWR1Y2VgIGRvZXMgbm90IHNraXAgZGVsZXRlZCBvciB1bmFzc2lnbmVkIGluZGljZXMgKHNwYXJzZVxuICAgICAqIGFycmF5cyksIHVubGlrZSB0aGUgbmF0aXZlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYCBtZXRob2QuIEZvciBtb3JlIGRldGFpbHNcbiAgICAgKiBvbiB0aGlzIGJlaGF2aW9yLCBzZWU6XG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvcmVkdWNlI0Rlc2NyaXB0aW9uXG4gICAgICpcbiAgICAgKiBEaXNwYXRjaGVzIHRvIHRoZSBgcmVkdWNlYCBtZXRob2Qgb2YgdGhlIHRoaXJkIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKChhLCBiKSAtPiBhKSAtPiBhIC0+IFtiXSAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uLiBSZWNlaXZlcyB0d28gdmFsdWVzLCB0aGUgYWNjdW11bGF0b3IgYW5kIHRoZVxuICAgICAqICAgICAgICBjdXJyZW50IGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gICAgICogQHBhcmFtIHsqfSBhY2MgVGhlIGFjY3VtdWxhdG9yIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSBmaW5hbCwgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAgICogQHNlZSBSLnJlZHVjZWQsIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbnVtYmVycyA9IFsxLCAyLCAzXTtcbiAgICAgKiAgICAgIHZhciBhZGQgPSAoYSwgYikgPT4gYSArIGI7XG4gICAgICpcbiAgICAgKiAgICAgIFIucmVkdWNlKGFkZCwgMTAsIG51bWJlcnMpOyAvLz0+IDE2XG4gICAgICovXG4gICAgdmFyIHJlZHVjZSA9IF9jdXJyeTMoX3JlZHVjZSk7XG5cbiAgICAvKipcbiAgICAgKiBHcm91cHMgdGhlIGVsZW1lbnRzIG9mIHRoZSBsaXN0IGFjY29yZGluZyB0byB0aGUgcmVzdWx0IG9mIGNhbGxpbmdcbiAgICAgKiB0aGUgU3RyaW5nLXJldHVybmluZyBmdW5jdGlvbiBga2V5Rm5gIG9uIGVhY2ggZWxlbWVudCBhbmQgcmVkdWNlcyB0aGUgZWxlbWVudHNcbiAgICAgKiBvZiBlYWNoIGdyb3VwIHRvIGEgc2luZ2xlIHZhbHVlIHZpYSB0aGUgcmVkdWNlciBmdW5jdGlvbiBgdmFsdWVGbmAuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGJhc2ljYWxseSBhIG1vcmUgZ2VuZXJhbCBgZ3JvdXBCeWAgZnVuY3Rpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIwLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKChhLCBiKSAtPiBhKSAtPiBhIC0+IChiIC0+IFN0cmluZykgLT4gW2JdIC0+IHtTdHJpbmc6IGF9XG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gdmFsdWVGbiBUaGUgZnVuY3Rpb24gdGhhdCByZWR1Y2VzIHRoZSBlbGVtZW50cyBvZiBlYWNoIGdyb3VwIHRvIGEgc2luZ2xlXG4gICAgICogICAgICAgIHZhbHVlLiBSZWNlaXZlcyB0d28gdmFsdWVzLCBhY2N1bXVsYXRvciBmb3IgYSBwYXJ0aWN1bGFyIGdyb3VwIGFuZCB0aGUgY3VycmVudCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7Kn0gYWNjIFRoZSAoaW5pdGlhbCkgYWNjdW11bGF0b3IgdmFsdWUgZm9yIGVhY2ggZ3JvdXAuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0ga2V5Rm4gVGhlIGZ1bmN0aW9uIHRoYXQgbWFwcyB0aGUgbGlzdCdzIGVsZW1lbnQgaW50byBhIGtleS5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBncm91cC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEFuIG9iamVjdCB3aXRoIHRoZSBvdXRwdXQgb2YgYGtleUZuYCBmb3Iga2V5cywgbWFwcGVkIHRvIHRoZSBvdXRwdXQgb2ZcbiAgICAgKiAgICAgICAgIGB2YWx1ZUZuYCBmb3IgZWxlbWVudHMgd2hpY2ggcHJvZHVjZWQgdGhhdCBrZXkgd2hlbiBwYXNzZWQgdG8gYGtleUZuYC5cbiAgICAgKiBAc2VlIFIuZ3JvdXBCeSwgUi5yZWR1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgcmVkdWNlVG9OYW1lc0J5ID0gUi5yZWR1Y2VCeSgoYWNjLCBzdHVkZW50KSA9PiBhY2MuY29uY2F0KHN0dWRlbnQubmFtZSksIFtdKTtcbiAgICAgKiAgICAgIHZhciBuYW1lc0J5R3JhZGUgPSByZWR1Y2VUb05hbWVzQnkoZnVuY3Rpb24oc3R1ZGVudCkge1xuICAgICAqICAgICAgICB2YXIgc2NvcmUgPSBzdHVkZW50LnNjb3JlO1xuICAgICAqICAgICAgICByZXR1cm4gc2NvcmUgPCA2NSA/ICdGJyA6XG4gICAgICogICAgICAgICAgICAgICBzY29yZSA8IDcwID8gJ0QnIDpcbiAgICAgKiAgICAgICAgICAgICAgIHNjb3JlIDwgODAgPyAnQycgOlxuICAgICAqICAgICAgICAgICAgICAgc2NvcmUgPCA5MCA/ICdCJyA6ICdBJztcbiAgICAgKiAgICAgIH0pO1xuICAgICAqICAgICAgdmFyIHN0dWRlbnRzID0gW3tuYW1lOiAnTHVjeScsIHNjb3JlOiA5Mn0sXG4gICAgICogICAgICAgICAgICAgICAgICAgICAge25hbWU6ICdEcmV3Jywgc2NvcmU6IDg1fSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAvLyAuLi5cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICB7bmFtZTogJ0JhcnQnLCBzY29yZTogNjJ9XTtcbiAgICAgKiAgICAgIG5hbWVzQnlHcmFkZShzdHVkZW50cyk7XG4gICAgICogICAgICAvLyB7XG4gICAgICogICAgICAvLyAgICdBJzogWydMdWN5J10sXG4gICAgICogICAgICAvLyAgICdCJzogWydEcmV3J11cbiAgICAgKiAgICAgIC8vICAgLy8gLi4uLFxuICAgICAqICAgICAgLy8gICAnRic6IFsnQmFydCddXG4gICAgICogICAgICAvLyB9XG4gICAgICovXG4gICAgdmFyIHJlZHVjZUJ5ID0gX2N1cnJ5Tig0LCBbXSwgZnVuY3Rpb24gcmVkdWNlQnkodmFsdWVGbiwgdmFsdWVBY2MsIGtleUZuLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfcmVkdWNlKGZ1bmN0aW9uIChhY2MsIGVsdCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleUZuKGVsdCk7XG4gICAgICAgICAgICBhY2Nba2V5XSA9IHZhbHVlRm4oX2hhcyhrZXksIGFjYykgPyBhY2Nba2V5XSA6IHZhbHVlQWNjLCBlbHQpO1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSwge30sIGxpc3QpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNvbXBsZW1lbnQgb2YgYGZpbHRlcmAuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBGaWx0ZXJhYmxlIGYgPT4gKGEgLT4gQm9vbGVhbikgLT4gZiBhIC0+IGYgYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBmaWx0ZXJhYmxlXG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICogQHNlZSBSLmZpbHRlciwgUi50cmFuc2R1Y2UsIFIuYWRkSW5kZXhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNPZGQgPSAobikgPT4gbiAlIDIgPT09IDE7XG4gICAgICpcbiAgICAgKiAgICAgIFIucmVqZWN0KGlzT2RkLCBbMSwgMiwgMywgNF0pOyAvLz0+IFsyLCA0XVxuICAgICAqXG4gICAgICogICAgICBSLnJlamVjdChpc09kZCwge2E6IDEsIGI6IDIsIGM6IDMsIGQ6IDR9KTsgLy89PiB7YjogMiwgZDogNH1cbiAgICAgKi9cbiAgICB2YXIgcmVqZWN0ID0gX2N1cnJ5MihmdW5jdGlvbiByZWplY3QocHJlZCwgZmlsdGVyYWJsZSkge1xuICAgICAgICByZXR1cm4gZmlsdGVyKF9jb21wbGVtZW50KHByZWQpLCBmaWx0ZXJhYmxlKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmaXhlZCBsaXN0IG9mIHNpemUgYG5gIGNvbnRhaW5pbmcgYSBzcGVjaWZpZWQgaWRlbnRpY2FsIHZhbHVlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjFcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgYSAtPiBuIC0+IFthXVxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHJlcGVhdC5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiBUaGUgZGVzaXJlZCBzaXplIG9mIHRoZSBvdXRwdXQgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgYXJyYXkgY29udGFpbmluZyBgbmAgYHZhbHVlYHMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5yZXBlYXQoJ2hpJywgNSk7IC8vPT4gWydoaScsICdoaScsICdoaScsICdoaScsICdoaSddXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgKiAgICAgIHZhciByZXBlYXRlZE9ianMgPSBSLnJlcGVhdChvYmosIDUpOyAvLz0+IFt7fSwge30sIHt9LCB7fSwge31dXG4gICAgICogICAgICByZXBlYXRlZE9ianNbMF0gPT09IHJlcGVhdGVkT2Jqc1sxXTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIHJlcGVhdCA9IF9jdXJyeTIoZnVuY3Rpb24gcmVwZWF0KHZhbHVlLCBuKSB7XG4gICAgICAgIHJldHVybiB0aW1lcyhhbHdheXModmFsdWUpLCBuKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgdG9nZXRoZXIgYWxsIHRoZSBlbGVtZW50cyBvZiBhIGxpc3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBNYXRoXG4gICAgICogQHNpZyBbTnVtYmVyXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IEFuIGFycmF5IG9mIG51bWJlcnNcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBzdW0gb2YgYWxsIHRoZSBudW1iZXJzIGluIHRoZSBsaXN0LlxuICAgICAqIEBzZWUgUi5yZWR1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnN1bShbMiw0LDYsOCwxMDAsMV0pOyAvLz0+IDEyMVxuICAgICAqL1xuICAgIHZhciBzdW0gPSByZWR1Y2UoYWRkLCAwKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIHRoZSBsYXN0IGBuYCBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gbGlzdC5cbiAgICAgKiBJZiBgbiA+IGxpc3QubGVuZ3RoYCwgcmV0dXJucyBhIGxpc3Qgb2YgYGxpc3QubGVuZ3RoYCBlbGVtZW50cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTYuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBOdW1iZXIgLT4gW2FdIC0+IFthXVxuICAgICAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiBTdHJpbmdcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIHJldHVybi5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSB4cyBUaGUgY29sbGVjdGlvbiB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKiBAc2VlIFIuZHJvcExhc3RcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnRha2VMYXN0KDEsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydiYXonXVxuICAgICAqICAgICAgUi50YWtlTGFzdCgyLCBbJ2ZvbycsICdiYXInLCAnYmF6J10pOyAvLz0+IFsnYmFyJywgJ2JheiddXG4gICAgICogICAgICBSLnRha2VMYXN0KDMsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydmb28nLCAnYmFyJywgJ2JheiddXG4gICAgICogICAgICBSLnRha2VMYXN0KDQsIFsnZm9vJywgJ2JhcicsICdiYXonXSk7IC8vPT4gWydmb28nLCAnYmFyJywgJ2JheiddXG4gICAgICogICAgICBSLnRha2VMYXN0KDMsICdyYW1kYScpOyAgICAgICAgICAgICAgIC8vPT4gJ21kYSdcbiAgICAgKi9cbiAgICB2YXIgdGFrZUxhc3QgPSBfY3VycnkyKGZ1bmN0aW9uIHRha2VMYXN0KG4sIHhzKSB7XG4gICAgICAgIHJldHVybiBkcm9wKG4gPj0gMCA/IHhzLmxlbmd0aCAtIG4gOiAwLCB4cyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyBhIHRyYW5zZHVjZXIgdXNpbmcgc3VwcGxpZWQgaXRlcmF0b3IgZnVuY3Rpb24uIFJldHVybnMgYSBzaW5nbGVcbiAgICAgKiBpdGVtIGJ5IGl0ZXJhdGluZyB0aHJvdWdoIHRoZSBsaXN0LCBzdWNjZXNzaXZlbHkgY2FsbGluZyB0aGUgdHJhbnNmb3JtZWRcbiAgICAgKiBpdGVyYXRvciBmdW5jdGlvbiBhbmQgcGFzc2luZyBpdCBhbiBhY2N1bXVsYXRvciB2YWx1ZSBhbmQgdGhlIGN1cnJlbnQgdmFsdWVcbiAgICAgKiBmcm9tIHRoZSBhcnJheSwgYW5kIHRoZW4gcGFzc2luZyB0aGUgcmVzdWx0IHRvIHRoZSBuZXh0IGNhbGwuXG4gICAgICpcbiAgICAgKiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24gcmVjZWl2ZXMgdHdvIHZhbHVlczogKihhY2MsIHZhbHVlKSouIEl0IHdpbGwgYmVcbiAgICAgKiB3cmFwcGVkIGFzIGEgdHJhbnNmb3JtZXIgdG8gaW5pdGlhbGl6ZSB0aGUgdHJhbnNkdWNlci4gQSB0cmFuc2Zvcm1lciBjYW4gYmVcbiAgICAgKiBwYXNzZWQgZGlyZWN0bHkgaW4gcGxhY2Ugb2YgYW4gaXRlcmF0b3IgZnVuY3Rpb24uIEluIGJvdGggY2FzZXMsIGl0ZXJhdGlvblxuICAgICAqIG1heSBiZSBzdG9wcGVkIGVhcmx5IHdpdGggdGhlIGBSLnJlZHVjZWRgIGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQSB0cmFuc2R1Y2VyIGlzIGEgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIGEgdHJhbnNmb3JtZXIgYW5kIHJldHVybnMgYVxuICAgICAqIHRyYW5zZm9ybWVyIGFuZCBjYW4gYmUgY29tcG9zZWQgZGlyZWN0bHkuXG4gICAgICpcbiAgICAgKiBBIHRyYW5zZm9ybWVyIGlzIGFuIGFuIG9iamVjdCB0aGF0IHByb3ZpZGVzIGEgMi1hcml0eSByZWR1Y2luZyBpdGVyYXRvclxuICAgICAqIGZ1bmN0aW9uLCBzdGVwLCAwLWFyaXR5IGluaXRpYWwgdmFsdWUgZnVuY3Rpb24sIGluaXQsIGFuZCAxLWFyaXR5IHJlc3VsdFxuICAgICAqIGV4dHJhY3Rpb24gZnVuY3Rpb24sIHJlc3VsdC4gVGhlIHN0ZXAgZnVuY3Rpb24gaXMgdXNlZCBhcyB0aGUgaXRlcmF0b3JcbiAgICAgKiBmdW5jdGlvbiBpbiByZWR1Y2UuIFRoZSByZXN1bHQgZnVuY3Rpb24gaXMgdXNlZCB0byBjb252ZXJ0IHRoZSBmaW5hbFxuICAgICAqIGFjY3VtdWxhdG9yIGludG8gdGhlIHJldHVybiB0eXBlIGFuZCBpbiBtb3N0IGNhc2VzIGlzIFIuaWRlbnRpdHkuIFRoZSBpbml0XG4gICAgICogZnVuY3Rpb24gY2FuIGJlIHVzZWQgdG8gcHJvdmlkZSBhbiBpbml0aWFsIGFjY3VtdWxhdG9yLCBidXQgaXMgaWdub3JlZCBieVxuICAgICAqIHRyYW5zZHVjZS5cbiAgICAgKlxuICAgICAqIFRoZSBpdGVyYXRpb24gaXMgcGVyZm9ybWVkIHdpdGggUi5yZWR1Y2UgYWZ0ZXIgaW5pdGlhbGl6aW5nIHRoZSB0cmFuc2R1Y2VyLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChjIC0+IGMpIC0+IChhLGIgLT4gYSkgLT4gYSAtPiBbYl0gLT4gYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHhmIFRoZSB0cmFuc2R1Y2VyIGZ1bmN0aW9uLiBSZWNlaXZlcyBhIHRyYW5zZm9ybWVyIGFuZCByZXR1cm5zIGEgdHJhbnNmb3JtZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uLiBSZWNlaXZlcyB0d28gdmFsdWVzLCB0aGUgYWNjdW11bGF0b3IgYW5kIHRoZVxuICAgICAqICAgICAgICBjdXJyZW50IGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuIFdyYXBwZWQgYXMgdHJhbnNmb3JtZXIsIGlmIG5lY2Vzc2FyeSwgYW5kIHVzZWQgdG9cbiAgICAgKiAgICAgICAgaW5pdGlhbGl6ZSB0aGUgdHJhbnNkdWNlclxuICAgICAqIEBwYXJhbSB7Kn0gYWNjIFRoZSBpbml0aWFsIGFjY3VtdWxhdG9yIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgICAqIEByZXR1cm4geyp9IFRoZSBmaW5hbCwgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAgICogQHNlZSBSLnJlZHVjZSwgUi5yZWR1Y2VkLCBSLmludG9cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbnVtYmVycyA9IFsxLCAyLCAzLCA0XTtcbiAgICAgKiAgICAgIHZhciB0cmFuc2R1Y2VyID0gUi5jb21wb3NlKFIubWFwKFIuYWRkKDEpKSwgUi50YWtlKDIpKTtcbiAgICAgKlxuICAgICAqICAgICAgUi50cmFuc2R1Y2UodHJhbnNkdWNlciwgUi5mbGlwKFIuYXBwZW5kKSwgW10sIG51bWJlcnMpOyAvLz0+IFsyLCAzXVxuICAgICAqL1xuICAgIHZhciB0cmFuc2R1Y2UgPSBjdXJyeU4oNCwgZnVuY3Rpb24gdHJhbnNkdWNlKHhmLCBmbiwgYWNjLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiBfcmVkdWNlKHhmKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyA/IF94d3JhcChmbikgOiBmbiksIGFjYywgbGlzdCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBDb21iaW5lcyB0d28gbGlzdHMgaW50byBhIHNldCAoaS5lLiBubyBkdXBsaWNhdGVzKSBjb21wb3NlZCBvZiB0aGUgZWxlbWVudHNcbiAgICAgKiBvZiBlYWNoIGxpc3QuIER1cGxpY2F0aW9uIGlzIGRldGVybWluZWQgYWNjb3JkaW5nIHRvIHRoZSB2YWx1ZSByZXR1cm5lZCBieVxuICAgICAqIGFwcGx5aW5nIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgdG8gdHdvIGxpc3QgZWxlbWVudHMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgKGEgLT4gYSAtPiBCb29sZWFuKSAtPiBbKl0gLT4gWypdIC0+IFsqXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgQSBwcmVkaWNhdGUgdXNlZCB0byB0ZXN0IHdoZXRoZXIgdHdvIGl0ZW1zIGFyZSBlcXVhbC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MSBUaGUgZmlyc3QgbGlzdC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MiBUaGUgc2Vjb25kIGxpc3QuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBmaXJzdCBhbmQgc2Vjb25kIGxpc3RzIGNvbmNhdGVuYXRlZCwgd2l0aFxuICAgICAqICAgICAgICAgZHVwbGljYXRlcyByZW1vdmVkLlxuICAgICAqIEBzZWUgUi51bmlvblxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBsMSA9IFt7YTogMX0sIHthOiAyfV07XG4gICAgICogICAgICB2YXIgbDIgPSBbe2E6IDF9LCB7YTogNH1dO1xuICAgICAqICAgICAgUi51bmlvbldpdGgoUi5lcUJ5KFIucHJvcCgnYScpKSwgbDEsIGwyKTsgLy89PiBbe2E6IDF9LCB7YTogMn0sIHthOiA0fV1cbiAgICAgKi9cbiAgICB2YXIgdW5pb25XaXRoID0gX2N1cnJ5MyhmdW5jdGlvbiB1bmlvbldpdGgocHJlZCwgbGlzdDEsIGxpc3QyKSB7XG4gICAgICAgIHJldHVybiB1bmlxV2l0aChwcmVkLCBfY29uY2F0KGxpc3QxLCBsaXN0MikpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBzcGVjIG9iamVjdCBhbmQgYSB0ZXN0IG9iamVjdDsgcmV0dXJucyB0cnVlIGlmIHRoZSB0ZXN0IHNhdGlzZmllc1xuICAgICAqIHRoZSBzcGVjLCBmYWxzZSBvdGhlcndpc2UuIEFuIG9iamVjdCBzYXRpc2ZpZXMgdGhlIHNwZWMgaWYsIGZvciBlYWNoIG9mIHRoZVxuICAgICAqIHNwZWMncyBvd24gcHJvcGVydGllcywgYWNjZXNzaW5nIHRoYXQgcHJvcGVydHkgb2YgdGhlIG9iamVjdCBnaXZlcyB0aGUgc2FtZVxuICAgICAqIHZhbHVlIChpbiBgUi5lcXVhbHNgIHRlcm1zKSBhcyBhY2Nlc3NpbmcgdGhhdCBwcm9wZXJ0eSBvZiB0aGUgc3BlYy5cbiAgICAgKlxuICAgICAqIGB3aGVyZUVxYCBpcyBhIHNwZWNpYWxpemF0aW9uIG9mIFtgd2hlcmVgXSgjd2hlcmUpLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcge1N0cmluZzogKn0gLT4ge1N0cmluZzogKn0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcGVjXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHRlc3RPYmpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi53aGVyZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vIHByZWQgOjogT2JqZWN0IC0+IEJvb2xlYW5cbiAgICAgKiAgICAgIHZhciBwcmVkID0gUi53aGVyZUVxKHthOiAxLCBiOiAyfSk7XG4gICAgICpcbiAgICAgKiAgICAgIHByZWQoe2E6IDF9KTsgICAgICAgICAgICAgIC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIHByZWQoe2E6IDEsIGI6IDJ9KTsgICAgICAgIC8vPT4gdHJ1ZVxuICAgICAqICAgICAgcHJlZCh7YTogMSwgYjogMiwgYzogM30pOyAgLy89PiB0cnVlXG4gICAgICogICAgICBwcmVkKHthOiAxLCBiOiAxfSk7ICAgICAgICAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIHdoZXJlRXEgPSBfY3VycnkyKGZ1bmN0aW9uIHdoZXJlRXEoc3BlYywgdGVzdE9iaikge1xuICAgICAgICByZXR1cm4gd2hlcmUobWFwKGVxdWFscywgc3BlYyksIHRlc3RPYmopO1xuICAgIH0pO1xuXG4gICAgdmFyIF9mbGF0Q2F0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcHJlc2VydmluZ1JlZHVjZWQgPSBmdW5jdGlvbiAoeGYpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9pbml0JzogX3hmQmFzZS5pbml0LFxuICAgICAgICAgICAgICAgICdAQHRyYW5zZHVjZXIvcmVzdWx0JzogZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9zdGVwJzogZnVuY3Rpb24gKHJlc3VsdCwgaW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IHhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgaW5wdXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0WydAQHRyYW5zZHVjZXIvcmVkdWNlZCddID8gX2ZvcmNlUmVkdWNlZChyZXQpIDogcmV0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBfeGNhdCh4Zikge1xuICAgICAgICAgICAgdmFyIHJ4ZiA9IHByZXNlcnZpbmdSZWR1Y2VkKHhmKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJ0BAdHJhbnNkdWNlci9pbml0JzogX3hmQmFzZS5pbml0LFxuICAgICAgICAgICAgICAgICdAQHRyYW5zZHVjZXIvcmVzdWx0JzogZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICdAQHRyYW5zZHVjZXIvc3RlcCc6IGZ1bmN0aW9uIChyZXN1bHQsIGlucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhaXNBcnJheUxpa2UoaW5wdXQpID8gX3JlZHVjZShyeGYsIHJlc3VsdCwgW2lucHV0XSkgOiBfcmVkdWNlKHJ4ZiwgcmVzdWx0LCBpbnB1dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9KCk7XG5cbiAgICAvLyBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiBkb2Vzbid0IGV4aXN0IGJlbG93IElFOVxuICAgIC8vIG1hbnVhbGx5IGNyYXdsIHRoZSBsaXN0IHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gKzAgYW5kIC0wXG4gICAgLy8gTmFOXG4gICAgLy8gbm9uLXplcm8gbnVtYmVycyBjYW4gdXRpbGlzZSBTZXRcbiAgICAvLyBhbGwgdGhlc2UgdHlwZXMgY2FuIHV0aWxpc2UgU2V0XG4gICAgLy8gbnVsbCBjYW4gdXRpbGlzZSBTZXRcbiAgICAvLyBhbnl0aGluZyBlbHNlIG5vdCBjb3ZlcmVkIGFib3ZlLCBkZWZlciB0byBSLmVxdWFsc1xuICAgIHZhciBfaW5kZXhPZiA9IGZ1bmN0aW9uIF9pbmRleE9mKGxpc3QsIGEsIGlkeCkge1xuICAgICAgICB2YXIgaW5mLCBpdGVtO1xuICAgICAgICAvLyBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiBkb2Vzbid0IGV4aXN0IGJlbG93IElFOVxuICAgICAgICBpZiAodHlwZW9mIGxpc3QuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc3dpdGNoICh0eXBlb2YgYSkge1xuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICBpZiAoYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYW51YWxseSBjcmF3bCB0aGUgbGlzdCB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuICswIGFuZCAtMFxuICAgICAgICAgICAgICAgICAgICBpbmYgPSAxIC8gYTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGlkeCA8IGxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gbGlzdFtpZHhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IDAgJiYgMSAvIGl0ZW0gPT09IGluZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZHggKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhICE9PSBhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5hTlxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2lkeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInICYmIGl0ZW0gIT09IGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBub24temVybyBudW1iZXJzIGNhbiB1dGlsaXNlIFNldFxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0LmluZGV4T2YoYSwgaWR4KTtcbiAgICAgICAgICAgIC8vIGFsbCB0aGVzZSB0eXBlcyBjYW4gdXRpbGlzZSBTZXRcbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3QuaW5kZXhPZihhLCBpZHgpO1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICBpZiAoYSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBudWxsIGNhbiB1dGlsaXNlIFNldFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGlzdC5pbmRleE9mKGEsIGlkeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGFueXRoaW5nIGVsc2Ugbm90IGNvdmVyZWQgYWJvdmUsIGRlZmVyIHRvIFIuZXF1YWxzXG4gICAgICAgIHdoaWxlIChpZHggPCBsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGVxdWFscyhsaXN0W2lkeF0sIGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG4gICAgdmFyIF94Y2hhaW4gPSBfY3VycnkyKGZ1bmN0aW9uIF94Y2hhaW4oZiwgeGYpIHtcbiAgICAgICAgcmV0dXJuIG1hcChmLCBfZmxhdENhdCh4ZikpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBsaXN0IG9mIHByZWRpY2F0ZXMgYW5kIHJldHVybnMgYSBwcmVkaWNhdGUgdGhhdCByZXR1cm5zIHRydWUgZm9yIGFcbiAgICAgKiBnaXZlbiBsaXN0IG9mIGFyZ3VtZW50cyBpZiBldmVyeSBvbmUgb2YgdGhlIHByb3ZpZGVkIHByZWRpY2F0ZXMgaXMgc2F0aXNmaWVkXG4gICAgICogYnkgdGhvc2UgYXJndW1lbnRzLlxuICAgICAqXG4gICAgICogVGhlIGZ1bmN0aW9uIHJldHVybmVkIGlzIGEgY3VycmllZCBmdW5jdGlvbiB3aG9zZSBhcml0eSBtYXRjaGVzIHRoYXQgb2YgdGhlXG4gICAgICogaGlnaGVzdC1hcml0eSBwcmVkaWNhdGUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBMb2dpY1xuICAgICAqIEBzaWcgWygqLi4uIC0+IEJvb2xlYW4pXSAtPiAoKi4uLiAtPiBCb29sZWFuKVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHByZWRzXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQHNlZSBSLmFueVBhc3NcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaXNRdWVlbiA9IFIucHJvcEVxKCdyYW5rJywgJ1EnKTtcbiAgICAgKiAgICAgIHZhciBpc1NwYWRlID0gUi5wcm9wRXEoJ3N1aXQnLCAn4pmg77iOJyk7XG4gICAgICogICAgICB2YXIgaXNRdWVlbk9mU3BhZGVzID0gUi5hbGxQYXNzKFtpc1F1ZWVuLCBpc1NwYWRlXSk7XG4gICAgICpcbiAgICAgKiAgICAgIGlzUXVlZW5PZlNwYWRlcyh7cmFuazogJ1EnLCBzdWl0OiAn4pmj77iOJ30pOyAvLz0+IGZhbHNlXG4gICAgICogICAgICBpc1F1ZWVuT2ZTcGFkZXMoe3Jhbms6ICdRJywgc3VpdDogJ+KZoO+4jid9KTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGFsbFBhc3MgPSBfY3VycnkxKGZ1bmN0aW9uIGFsbFBhc3MocHJlZHMpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5TihyZWR1Y2UobWF4LCAwLCBwbHVjaygnbGVuZ3RoJywgcHJlZHMpKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB2YXIgbGVuID0gcHJlZHMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgICAgIGlmICghcHJlZHNbaWR4XS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBhbGwgZWxlbWVudHMgYXJlIHVuaXF1ZSwgaW4gYFIuZXF1YWxzYCB0ZXJtcywgb3RoZXJ3aXNlXG4gICAgICogYGZhbHNlYC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTguMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBbYV0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBhbGwgZWxlbWVudHMgYXJlIHVuaXF1ZSwgZWxzZSBgZmFsc2VgLlxuICAgICAqIEBkZXByZWNhdGVkIHNpbmNlIHYwLjIwLjBcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmFsbFVuaXEoWycxJywgMV0pOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuYWxsVW5pcShbMSwgMV0pOyAgIC8vPT4gZmFsc2VcbiAgICAgKiAgICAgIFIuYWxsVW5pcShbWzQyXSwgWzQyXV0pOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGFsbFVuaXEgPSBfY3VycnkxKGZ1bmN0aW9uIGFsbFVuaXEobGlzdCkge1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoX2luZGV4T2YobGlzdCwgbGlzdFtpZHhdLCBpZHggKyAxKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGxpc3Qgb2YgcHJlZGljYXRlcyBhbmQgcmV0dXJucyBhIHByZWRpY2F0ZSB0aGF0IHJldHVybnMgdHJ1ZSBmb3IgYVxuICAgICAqIGdpdmVuIGxpc3Qgb2YgYXJndW1lbnRzIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgcHJvdmlkZWQgcHJlZGljYXRlcyBpc1xuICAgICAqIHNhdGlzZmllZCBieSB0aG9zZSBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBUaGUgZnVuY3Rpb24gcmV0dXJuZWQgaXMgYSBjdXJyaWVkIGZ1bmN0aW9uIHdob3NlIGFyaXR5IG1hdGNoZXMgdGhhdCBvZiB0aGVcbiAgICAgKiBoaWdoZXN0LWFyaXR5IHByZWRpY2F0ZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyBbKCouLi4gLT4gQm9vbGVhbildIC0+ICgqLi4uIC0+IEJvb2xlYW4pXG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJlZHNcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIuYWxsUGFzc1xuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBndGUgPSBSLmFueVBhc3MoW1IuZ3QsIFIuZXF1YWxzXSk7XG4gICAgICpcbiAgICAgKiAgICAgIGd0ZSgzLCAyKTsgLy89PiB0cnVlXG4gICAgICogICAgICBndGUoMiwgMik7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgZ3RlKDIsIDMpOyAvLz0+IGZhbHNlXG4gICAgICovXG4gICAgdmFyIGFueVBhc3MgPSBfY3VycnkxKGZ1bmN0aW9uIGFueVBhc3MocHJlZHMpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5TihyZWR1Y2UobWF4LCAwLCBwbHVjaygnbGVuZ3RoJywgcHJlZHMpKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB2YXIgbGVuID0gcHJlZHMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICAgICAgICAgIGlmIChwcmVkc1tpZHhdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIGFwIGFwcGxpZXMgYSBsaXN0IG9mIGZ1bmN0aW9ucyB0byBhIGxpc3Qgb2YgdmFsdWVzLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGFwYCBtZXRob2Qgb2YgdGhlIHNlY29uZCBhcmd1bWVudCwgaWYgcHJlc2VudC4gQWxzb1xuICAgICAqIHRyZWF0cyBmdW5jdGlvbnMgYXMgYXBwbGljYXRpdmVzLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4zLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIFtmXSAtPiBbYV0gLT4gW2YgYV1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBmbnMgQW4gYXJyYXkgb2YgZnVuY3Rpb25zXG4gICAgICogQHBhcmFtIHtBcnJheX0gdnMgQW4gYXJyYXkgb2YgdmFsdWVzXG4gICAgICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIHJlc3VsdHMgb2YgYXBwbHlpbmcgZWFjaCBvZiBgZm5zYCB0byBhbGwgb2YgYHZzYCBpbiB0dXJuLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuYXAoW1IubXVsdGlwbHkoMiksIFIuYWRkKDMpXSwgWzEsMiwzXSk7IC8vPT4gWzIsIDQsIDYsIDQsIDUsIDZdXG4gICAgICovXG4gICAgLy8gZWxzZVxuICAgIHZhciBhcCA9IF9jdXJyeTIoZnVuY3Rpb24gYXAoYXBwbGljYXRpdmUsIGZuKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgYXBwbGljYXRpdmUuYXAgPT09ICdmdW5jdGlvbicgPyBhcHBsaWNhdGl2ZS5hcChmbikgOiB0eXBlb2YgYXBwbGljYXRpdmUgPT09ICdmdW5jdGlvbicgPyBjdXJyeU4oTWF0aC5tYXgoYXBwbGljYXRpdmUubGVuZ3RoLCBmbi5sZW5ndGgpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXBwbGljYXRpdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKShmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgICAgfSkgOiAvLyBlbHNlXG4gICAgICAgIF9yZWR1Y2UoZnVuY3Rpb24gKGFjYywgZikge1xuICAgICAgICAgICAgcmV0dXJuIF9jb25jYXQoYWNjLCBtYXAoZiwgZm4pKTtcbiAgICAgICAgfSwgW10sIGFwcGxpY2F0aXZlKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgc3BlYyBvYmplY3QgcmVjdXJzaXZlbHkgbWFwcGluZyBwcm9wZXJ0aWVzIHRvIGZ1bmN0aW9ucywgY3JlYXRlcyBhXG4gICAgICogZnVuY3Rpb24gcHJvZHVjaW5nIGFuIG9iamVjdCBvZiB0aGUgc2FtZSBzdHJ1Y3R1cmUsIGJ5IG1hcHBpbmcgZWFjaCBwcm9wZXJ0eVxuICAgICAqIHRvIHRoZSByZXN1bHQgb2YgY2FsbGluZyBpdHMgYXNzb2NpYXRlZCBmdW5jdGlvbiB3aXRoIHRoZSBzdXBwbGllZCBhcmd1bWVudHMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjIwLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIHtrOiAoKGEsIGIsIC4uLiwgbSkgLT4gdil9IC0+ICgoYSwgYiwgLi4uLCBtKSAtPiB7azogdn0pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNwZWMgYW4gb2JqZWN0IHJlY3Vyc2l2ZWx5IG1hcHBpbmcgcHJvcGVydGllcyB0byBmdW5jdGlvbnMgZm9yXG4gICAgICogICAgICAgIHByb2R1Y2luZyB0aGUgdmFsdWVzIGZvciB0aGVzZSBwcm9wZXJ0aWVzLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBvYmplY3Qgb2YgdGhlIHNhbWUgc3RydWN0dXJlXG4gICAgICogYXMgYHNwZWMnLCB3aXRoIGVhY2ggcHJvcGVydHkgc2V0IHRvIHRoZSB2YWx1ZSByZXR1cm5lZCBieSBjYWxsaW5nIGl0c1xuICAgICAqIGFzc29jaWF0ZWQgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzLlxuICAgICAqIEBzZWUgUi5qdXh0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGdldE1ldHJpY3MgPSBSLmFwcGx5U3BlYyh7XG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bTogUi5hZGQsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5lc3RlZDogeyBtdWw6IFIubXVsdGlwbHkgfVxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgKiAgICAgIGdldE1ldHJpY3MoMiwgNCk7IC8vID0+IHsgc3VtOiA2LCBuZXN0ZWQ6IHsgbXVsOiA4IH0gfVxuICAgICAqL1xuICAgIHZhciBhcHBseVNwZWMgPSBfY3VycnkxKGZ1bmN0aW9uIGFwcGx5U3BlYyhzcGVjKSB7XG4gICAgICAgIHNwZWMgPSBtYXAoZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdiA9PSAnZnVuY3Rpb24nID8gdiA6IGFwcGx5U3BlYyh2KTtcbiAgICAgICAgfSwgc3BlYyk7XG4gICAgICAgIHJldHVybiBjdXJyeU4ocmVkdWNlKG1heCwgMCwgcGx1Y2soJ2xlbmd0aCcsIHZhbHVlcyhzcGVjKSkpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgIHJldHVybiBtYXAoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwbHkoZiwgYXJncyk7XG4gICAgICAgICAgICB9LCBzcGVjKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByZXN1bHQgb2YgY2FsbGluZyBpdHMgZmlyc3QgYXJndW1lbnQgd2l0aCB0aGUgcmVtYWluaW5nXG4gICAgICogYXJndW1lbnRzLiBUaGlzIGlzIG9jY2FzaW9uYWxseSB1c2VmdWwgYXMgYSBjb252ZXJnaW5nIGZ1bmN0aW9uIGZvclxuICAgICAqIGBSLmNvbnZlcmdlYDogdGhlIGxlZnQgYnJhbmNoIGNhbiBwcm9kdWNlIGEgZnVuY3Rpb24gd2hpbGUgdGhlIHJpZ2h0IGJyYW5jaFxuICAgICAqIHByb2R1Y2VzIGEgdmFsdWUgdG8gYmUgcGFzc2VkIHRvIHRoYXQgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjkuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKCouLi4gLT4gYSksKi4uLiAtPiBhXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGFwcGx5IHRvIHRoZSByZW1haW5pbmcgYXJndW1lbnRzLlxuICAgICAqIEBwYXJhbSB7Li4uKn0gYXJncyBBbnkgbnVtYmVyIG9mIHBvc2l0aW9uYWwgYXJndW1lbnRzLlxuICAgICAqIEByZXR1cm4geyp9XG4gICAgICogQHNlZSBSLmFwcGx5XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGluZGVudE4gPSBSLnBpcGUoUi50aW1lcyhSLmFsd2F5cygnICcpKSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIFIuam9pbignJyksXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBSLnJlcGxhY2UoL14oPyEkKS9nbSkpO1xuICAgICAqXG4gICAgICogICAgICB2YXIgZm9ybWF0ID0gUi5jb252ZXJnZShSLmNhbGwsIFtcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSLnBpcGUoUi5wcm9wKCdpbmRlbnQnKSwgaW5kZW50TiksXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUi5wcm9wKCd2YWx1ZScpXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgKlxuICAgICAqICAgICAgZm9ybWF0KHtpbmRlbnQ6IDIsIHZhbHVlOiAnZm9vXFxuYmFyXFxuYmF6XFxuJ30pOyAvLz0+ICcgIGZvb1xcbiAgYmFyXFxuICBiYXpcXG4nXG4gICAgICovXG4gICAgdmFyIGNhbGwgPSBjdXJyeShmdW5jdGlvbiBjYWxsKGZuKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBgY2hhaW5gIG1hcHMgYSBmdW5jdGlvbiBvdmVyIGEgbGlzdCBhbmQgY29uY2F0ZW5hdGVzIHRoZSByZXN1bHRzLiBgY2hhaW5gXG4gICAgICogaXMgYWxzbyBrbm93biBhcyBgZmxhdE1hcGAgaW4gc29tZSBsaWJyYXJpZXNcbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBjaGFpbmAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjMuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyAoYSAtPiBbYl0pIC0+IFthXSAtPiBbYl1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3RcbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZHVwbGljYXRlID0gbiA9PiBbbiwgbl07XG4gICAgICogICAgICBSLmNoYWluKGR1cGxpY2F0ZSwgWzEsIDIsIDNdKTsgLy89PiBbMSwgMSwgMiwgMiwgMywgM11cbiAgICAgKi9cbiAgICB2YXIgY2hhaW4gPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2NoYWluJywgX3hjaGFpbiwgZnVuY3Rpb24gY2hhaW4oZm4sIG1vbmFkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbW9uYWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbmFkLmNhbGwodGhpcywgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9tYWtlRmxhdChmYWxzZSkobWFwKGZuLCBtb25hZCkpO1xuICAgIH0pKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiwgYGZuYCwgd2hpY2ggZW5jYXBzdWxhdGVzIGlmL2Vsc2UtaWYvZWxzZSBsb2dpYy5cbiAgICAgKiBgUi5jb25kYCB0YWtlcyBhIGxpc3Qgb2YgW3ByZWRpY2F0ZSwgdHJhbnNmb3JtXSBwYWlycy4gQWxsIG9mIHRoZSBhcmd1bWVudHNcbiAgICAgKiB0byBgZm5gIGFyZSBhcHBsaWVkIHRvIGVhY2ggb2YgdGhlIHByZWRpY2F0ZXMgaW4gdHVybiB1bnRpbCBvbmUgcmV0dXJucyBhXG4gICAgICogXCJ0cnV0aHlcIiB2YWx1ZSwgYXQgd2hpY2ggcG9pbnQgYGZuYCByZXR1cm5zIHRoZSByZXN1bHQgb2YgYXBwbHlpbmcgaXRzXG4gICAgICogYXJndW1lbnRzIHRvIHRoZSBjb3JyZXNwb25kaW5nIHRyYW5zZm9ybWVyLiBJZiBub25lIG9mIHRoZSBwcmVkaWNhdGVzXG4gICAgICogbWF0Y2hlcywgYGZuYCByZXR1cm5zIHVuZGVmaW5lZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNi4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyBbWygqLi4uIC0+IEJvb2xlYW4pLCgqLi4uIC0+ICopXV0gLT4gKCouLi4gLT4gKilcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYWlyc1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBmbiA9IFIuY29uZChbXG4gICAgICogICAgICAgIFtSLmVxdWFscygwKSwgICBSLmFsd2F5cygnd2F0ZXIgZnJlZXplcyBhdCAwwrBDJyldLFxuICAgICAqICAgICAgICBbUi5lcXVhbHMoMTAwKSwgUi5hbHdheXMoJ3dhdGVyIGJvaWxzIGF0IDEwMMKwQycpXSxcbiAgICAgKiAgICAgICAgW1IuVCwgICAgICAgICAgIHRlbXAgPT4gJ25vdGhpbmcgc3BlY2lhbCBoYXBwZW5zIGF0ICcgKyB0ZW1wICsgJ8KwQyddXG4gICAgICogICAgICBdKTtcbiAgICAgKiAgICAgIGZuKDApOyAvLz0+ICd3YXRlciBmcmVlemVzIGF0IDDCsEMnXG4gICAgICogICAgICBmbig1MCk7IC8vPT4gJ25vdGhpbmcgc3BlY2lhbCBoYXBwZW5zIGF0IDUwwrBDJ1xuICAgICAqICAgICAgZm4oMTAwKTsgLy89PiAnd2F0ZXIgYm9pbHMgYXQgMTAwwrBDJ1xuICAgICAqL1xuICAgIHZhciBjb25kID0gX2N1cnJ5MShmdW5jdGlvbiBjb25kKHBhaXJzKSB7XG4gICAgICAgIHZhciBhcml0eSA9IHJlZHVjZShtYXgsIDAsIG1hcChmdW5jdGlvbiAocGFpcikge1xuICAgICAgICAgICAgcmV0dXJuIHBhaXJbMF0ubGVuZ3RoO1xuICAgICAgICB9LCBwYWlycykpO1xuICAgICAgICByZXR1cm4gX2FyaXR5KGFyaXR5LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChpZHggPCBwYWlycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFpcnNbaWR4XVswXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYWlyc1tpZHhdWzFdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkeCArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFdyYXBzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24gaW5zaWRlIGEgY3VycmllZCBmdW5jdGlvbiB0aGF0IGNhbiBiZSBjYWxsZWRcbiAgICAgKiB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50cyBhbmQgcmV0dXJucyB0aGUgc2FtZSB0eXBlLiBUaGUgYXJpdHkgb2YgdGhlIGZ1bmN0aW9uXG4gICAgICogcmV0dXJuZWQgaXMgc3BlY2lmaWVkIHRvIGFsbG93IHVzaW5nIHZhcmlhZGljIGNvbnN0cnVjdG9yIGZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuNC4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBOdW1iZXIgLT4gKCogLT4geyp9KSAtPiAoKiAtPiB7Kn0pXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG4gVGhlIGFyaXR5IG9mIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBGbiBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gdG8gd3JhcC5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSB3cmFwcGVkLCBjdXJyaWVkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vIFZhcmlhZGljIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgICogICAgICB2YXIgV2lkZ2V0ID0gKCkgPT4ge1xuICAgICAqICAgICAgICB0aGlzLmNoaWxkcmVuID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgKiAgICAgICAgLy8gLi4uXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgV2lkZ2V0LnByb3RvdHlwZSA9IHtcbiAgICAgKiAgICAgICAgLy8gLi4uXG4gICAgICogICAgICB9O1xuICAgICAqICAgICAgdmFyIGFsbENvbmZpZ3MgPSBbXG4gICAgICogICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgXTtcbiAgICAgKiAgICAgIFIubWFwKFIuY29uc3RydWN0TigxLCBXaWRnZXQpLCBhbGxDb25maWdzKTsgLy8gYSBsaXN0IG9mIFdpZGdldHNcbiAgICAgKi9cbiAgICB2YXIgY29uc3RydWN0TiA9IF9jdXJyeTIoZnVuY3Rpb24gY29uc3RydWN0TihuLCBGbikge1xuICAgICAgICBpZiAobiA+IDEwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnN0cnVjdG9yIHdpdGggZ3JlYXRlciB0aGFuIHRlbiBhcmd1bWVudHMnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZuKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyeShuQXJ5KG4sIGZ1bmN0aW9uICgkMCwgJDEsICQyLCAkMywgJDQsICQ1LCAkNiwgJDcsICQ4LCAkOSkge1xuICAgICAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCk7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEpO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRm4oJDAsICQxLCAkMik7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyLCAkMyk7XG4gICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyLCAkMywgJDQpO1xuICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRm4oJDAsICQxLCAkMiwgJDMsICQ0LCAkNSk7XG4gICAgICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyLCAkMywgJDQsICQ1LCAkNik7XG4gICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGbigkMCwgJDEsICQyLCAkMywgJDQsICQ1LCAkNiwgJDcpO1xuICAgICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRm4oJDAsICQxLCAkMiwgJDMsICQ0LCAkNSwgJDYsICQ3LCAkOCk7XG4gICAgICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRm4oJDAsICQxLCAkMiwgJDMsICQ0LCAkNSwgJDYsICQ3LCAkOCwgJDkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBBY2NlcHRzIGEgY29udmVyZ2luZyBmdW5jdGlvbiBhbmQgYSBsaXN0IG9mIGJyYW5jaGluZyBmdW5jdGlvbnMgYW5kIHJldHVybnNcbiAgICAgKiBhIG5ldyBmdW5jdGlvbi4gV2hlbiBpbnZva2VkLCB0aGlzIG5ldyBmdW5jdGlvbiBpcyBhcHBsaWVkIHRvIHNvbWVcbiAgICAgKiBhcmd1bWVudHMsIGVhY2ggYnJhbmNoaW5nIGZ1bmN0aW9uIGlzIGFwcGxpZWQgdG8gdGhvc2Ugc2FtZSBhcmd1bWVudHMuIFRoZVxuICAgICAqIHJlc3VsdHMgb2YgZWFjaCBicmFuY2hpbmcgZnVuY3Rpb24gYXJlIHBhc3NlZCBhcyBhcmd1bWVudHMgdG8gdGhlIGNvbnZlcmdpbmdcbiAgICAgKiBmdW5jdGlvbiB0byBwcm9kdWNlIHRoZSByZXR1cm4gdmFsdWUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjQuMlxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKHgxIC0+IHgyIC0+IC4uLiAtPiB6KSAtPiBbKGEgLT4gYiAtPiAuLi4gLT4geDEpLCAoYSAtPiBiIC0+IC4uLiAtPiB4MiksIC4uLl0gLT4gKGEgLT4gYiAtPiAuLi4gLT4geilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBhZnRlciBBIGZ1bmN0aW9uLiBgYWZ0ZXJgIHdpbGwgYmUgaW52b2tlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWVzIG9mXG4gICAgICogICAgICAgIGBmbjFgIGFuZCBgZm4yYCBhcyBpdHMgYXJndW1lbnRzLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGZ1bmN0aW9ucyBBIGxpc3Qgb2YgZnVuY3Rpb25zLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYWRkID0gKGEsIGIpID0+IGEgKyBiO1xuICAgICAqICAgICAgdmFyIG11bHRpcGx5ID0gKGEsIGIpID0+IGEgKiBiO1xuICAgICAqICAgICAgdmFyIHN1YnRyYWN0ID0gKGEsIGIpID0+IGEgLSBiO1xuICAgICAqXG4gICAgICogICAgICAvL+KJhSBtdWx0aXBseSggYWRkKDEsIDIpLCBzdWJ0cmFjdCgxLCAyKSApO1xuICAgICAqICAgICAgUi5jb252ZXJnZShtdWx0aXBseSwgW2FkZCwgc3VidHJhY3RdKSgxLCAyKTsgLy89PiAtM1xuICAgICAqXG4gICAgICogICAgICB2YXIgYWRkMyA9IChhLCBiLCBjKSA9PiBhICsgYiArIGM7XG4gICAgICogICAgICBSLmNvbnZlcmdlKGFkZDMsIFttdWx0aXBseSwgYWRkLCBzdWJ0cmFjdF0pKDEsIDIpOyAvLz0+IDRcbiAgICAgKi9cbiAgICB2YXIgY29udmVyZ2UgPSBfY3VycnkyKGZ1bmN0aW9uIGNvbnZlcmdlKGFmdGVyLCBmbnMpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJ5TihyZWR1Y2UobWF4LCAwLCBwbHVjaygnbGVuZ3RoJywgZm5zKSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIGFmdGVyLmFwcGx5KGNvbnRleHQsIF9tYXAoZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSwgZm5zKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQ291bnRzIHRoZSBlbGVtZW50cyBvZiBhIGxpc3QgYWNjb3JkaW5nIHRvIGhvdyBtYW55IG1hdGNoIGVhY2ggdmFsdWUgb2YgYVxuICAgICAqIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHN1cHBsaWVkIGZ1bmN0aW9uLiBSZXR1cm5zIGFuIG9iamVjdCBtYXBwaW5nIHRoZSBrZXlzXG4gICAgICogcHJvZHVjZWQgYnkgYGZuYCB0byB0aGUgbnVtYmVyIG9mIG9jY3VycmVuY2VzIGluIHRoZSBsaXN0LiBOb3RlIHRoYXQgYWxsXG4gICAgICoga2V5cyBhcmUgY29lcmNlZCB0byBzdHJpbmdzIGJlY2F1c2Ugb2YgaG93IEphdmFTY3JpcHQgb2JqZWN0cyB3b3JrLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIChhIC0+IFN0cmluZykgLT4gW2FdIC0+IHsqfVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB1c2VkIHRvIG1hcCB2YWx1ZXMgdG8ga2V5cy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGNvdW50IGVsZW1lbnRzIGZyb20uXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBBbiBvYmplY3QgbWFwcGluZyBrZXlzIHRvIG51bWJlciBvZiBvY2N1cnJlbmNlcyBpbiB0aGUgbGlzdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbnVtYmVycyA9IFsxLjAsIDEuMSwgMS4yLCAyLjAsIDMuMCwgMi4yXTtcbiAgICAgKiAgICAgIHZhciBsZXR0ZXJzID0gUi5zcGxpdCgnJywgJ2FiY0FCQ2FhYUJCYycpO1xuICAgICAqICAgICAgUi5jb3VudEJ5KE1hdGguZmxvb3IpKG51bWJlcnMpOyAgICAvLz0+IHsnMSc6IDMsICcyJzogMiwgJzMnOiAxfVxuICAgICAqICAgICAgUi5jb3VudEJ5KFIudG9Mb3dlcikobGV0dGVycyk7ICAgLy89PiB7J2EnOiA1LCAnYic6IDQsICdjJzogM31cbiAgICAgKi9cbiAgICB2YXIgY291bnRCeSA9IHJlZHVjZUJ5KGZ1bmN0aW9uIChhY2MsIGVsZW0pIHtcbiAgICAgICAgcmV0dXJuIGFjYyArIDE7XG4gICAgfSwgMCk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGxpc3Qgd2l0aG91dCBhbnkgY29uc2VjdXRpdmVseSByZXBlYXRpbmcgZWxlbWVudHMuIEVxdWFsaXR5IGlzXG4gICAgICogZGV0ZXJtaW5lZCBieSBhcHBseWluZyB0aGUgc3VwcGxpZWQgcHJlZGljYXRlIHR3byBjb25zZWN1dGl2ZSBlbGVtZW50cy4gVGhlXG4gICAgICogZmlyc3QgZWxlbWVudCBpbiBhIHNlcmllcyBvZiBlcXVhbCBlbGVtZW50IGlzIHRoZSBvbmUgYmVpbmcgcHJlc2VydmVkLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGRyb3BSZXBlYXRzV2l0aGAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEsIGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWQgQSBwcmVkaWNhdGUgdXNlZCB0byB0ZXN0IHdoZXRoZXIgdHdvIGl0ZW1zIGFyZSBlcXVhbC5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gYGxpc3RgIHdpdGhvdXQgcmVwZWF0aW5nIGVsZW1lbnRzLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbCA9IFsxLCAtMSwgMSwgMywgNCwgLTQsIC00LCAtNSwgNSwgMywgM107XG4gICAgICogICAgICBSLmRyb3BSZXBlYXRzV2l0aChSLmVxQnkoTWF0aC5hYnMpLCBsKTsgLy89PiBbMSwgMywgNCwgLTUsIDNdXG4gICAgICovXG4gICAgdmFyIGRyb3BSZXBlYXRzV2l0aCA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZHJvcFJlcGVhdHNXaXRoJywgX3hkcm9wUmVwZWF0c1dpdGgsIGZ1bmN0aW9uIGRyb3BSZXBlYXRzV2l0aChwcmVkLCBsaXN0KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIGlkeCA9IDE7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbiAhPT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0WzBdID0gbGlzdFswXTtcbiAgICAgICAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIXByZWQobGFzdChyZXN1bHQpLCBsaXN0W2lkeF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IGxpc3RbaWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KSk7XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGZ1bmN0aW9uIGFuZCB0d28gdmFsdWVzIGluIGl0cyBkb21haW4gYW5kIHJldHVybnMgYHRydWVgIGlmIHRoZVxuICAgICAqIHZhbHVlcyBtYXAgdG8gdGhlIHNhbWUgdmFsdWUgaW4gdGhlIGNvZG9tYWluOyBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTguMFxuICAgICAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICAgICAqIEBzaWcgKGEgLT4gYikgLT4gYSAtPiBhIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmXG4gICAgICogQHBhcmFtIHsqfSB4XG4gICAgICogQHBhcmFtIHsqfSB5XG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmVxQnkoTWF0aC5hYnMsIDUsIC01KTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGVxQnkgPSBfY3VycnkzKGZ1bmN0aW9uIGVxQnkoZiwgeCwgeSkge1xuICAgICAgICByZXR1cm4gZXF1YWxzKGYoeCksIGYoeSkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmVwb3J0cyB3aGV0aGVyIHR3byBvYmplY3RzIGhhdmUgdGhlIHNhbWUgdmFsdWUsIGluIGBSLmVxdWFsc2AgdGVybXMsIGZvclxuICAgICAqIHRoZSBzcGVjaWZpZWQgcHJvcGVydHkuIFVzZWZ1bCBhcyBhIGN1cnJpZWQgcHJlZGljYXRlLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHNpZyBrIC0+IHtrOiB2fSAtPiB7azogdn0gLT4gQm9vbGVhblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byBjb21wYXJlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iajFcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqMlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbzEgPSB7IGE6IDEsIGI6IDIsIGM6IDMsIGQ6IDQgfTtcbiAgICAgKiAgICAgIHZhciBvMiA9IHsgYTogMTAsIGI6IDIwLCBjOiAzLCBkOiA0MCB9O1xuICAgICAqICAgICAgUi5lcVByb3BzKCdhJywgbzEsIG8yKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5lcVByb3BzKCdjJywgbzEsIG8yKTsgLy89PiB0cnVlXG4gICAgICovXG4gICAgdmFyIGVxUHJvcHMgPSBfY3VycnkzKGZ1bmN0aW9uIGVxUHJvcHMocHJvcCwgb2JqMSwgb2JqMikge1xuICAgICAgICByZXR1cm4gZXF1YWxzKG9iajFbcHJvcF0sIG9iajJbcHJvcF0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU3BsaXRzIGEgbGlzdCBpbnRvIHN1Yi1saXN0cyBzdG9yZWQgaW4gYW4gb2JqZWN0LCBiYXNlZCBvbiB0aGUgcmVzdWx0IG9mXG4gICAgICogY2FsbGluZyBhIFN0cmluZy1yZXR1cm5pbmcgZnVuY3Rpb24gb24gZWFjaCBlbGVtZW50LCBhbmQgZ3JvdXBpbmcgdGhlXG4gICAgICogcmVzdWx0cyBhY2NvcmRpbmcgdG8gdmFsdWVzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGdyb3VwQnlgIG1ldGhvZCBvZiB0aGUgc2Vjb25kIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gU3RyaW5nKSAtPiBbYV0gLT4ge1N0cmluZzogW2FdfVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIDo6IGEgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gZ3JvdXBcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEFuIG9iamVjdCB3aXRoIHRoZSBvdXRwdXQgb2YgYGZuYCBmb3Iga2V5cywgbWFwcGVkIHRvIGFycmF5cyBvZiBlbGVtZW50c1xuICAgICAqICAgICAgICAgdGhhdCBwcm9kdWNlZCB0aGF0IGtleSB3aGVuIHBhc3NlZCB0byBgZm5gLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgYnlHcmFkZSA9IFIuZ3JvdXBCeShmdW5jdGlvbihzdHVkZW50KSB7XG4gICAgICogICAgICAgIHZhciBzY29yZSA9IHN0dWRlbnQuc2NvcmU7XG4gICAgICogICAgICAgIHJldHVybiBzY29yZSA8IDY1ID8gJ0YnIDpcbiAgICAgKiAgICAgICAgICAgICAgIHNjb3JlIDwgNzAgPyAnRCcgOlxuICAgICAqICAgICAgICAgICAgICAgc2NvcmUgPCA4MCA/ICdDJyA6XG4gICAgICogICAgICAgICAgICAgICBzY29yZSA8IDkwID8gJ0InIDogJ0EnO1xuICAgICAqICAgICAgfSk7XG4gICAgICogICAgICB2YXIgc3R1ZGVudHMgPSBbe25hbWU6ICdBYmJ5Jywgc2NvcmU6IDg0fSxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICB7bmFtZTogJ0VkZHknLCBzY29yZTogNTh9LFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgIHtuYW1lOiAnSmFjaycsIHNjb3JlOiA2OX1dO1xuICAgICAqICAgICAgYnlHcmFkZShzdHVkZW50cyk7XG4gICAgICogICAgICAvLyB7XG4gICAgICogICAgICAvLyAgICdBJzogW3tuYW1lOiAnRGlhbm5lJywgc2NvcmU6IDk5fV0sXG4gICAgICogICAgICAvLyAgICdCJzogW3tuYW1lOiAnQWJieScsIHNjb3JlOiA4NH1dXG4gICAgICogICAgICAvLyAgIC8vIC4uLixcbiAgICAgKiAgICAgIC8vICAgJ0YnOiBbe25hbWU6ICdFZGR5Jywgc2NvcmU6IDU4fV1cbiAgICAgKiAgICAgIC8vIH1cbiAgICAgKi9cbiAgICB2YXIgZ3JvdXBCeSA9IF9jdXJyeTIoX2Rpc3BhdGNoYWJsZSgnZ3JvdXBCeScsIF94Z3JvdXBCeSwgcmVkdWNlQnkoZnVuY3Rpb24gKGFjYywgaXRlbSkge1xuICAgICAgICBpZiAoYWNjID09IG51bGwpIHtcbiAgICAgICAgICAgIGFjYyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGFjYy5wdXNoKGl0ZW0pO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIG51bGwpKSk7XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIGZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGEga2V5LCB0dXJucyBhIGxpc3Qgb2Ygb2JqZWN0cyBpbnRvIGFuXG4gICAgICogb2JqZWN0IGluZGV4aW5nIHRoZSBvYmplY3RzIGJ5IHRoZSBnaXZlbiBrZXkuIE5vdGUgdGhhdCBpZiBtdWx0aXBsZVxuICAgICAqIG9iamVjdHMgZ2VuZXJhdGUgdGhlIHNhbWUgdmFsdWUgZm9yIHRoZSBpbmRleGluZyBrZXkgb25seSB0aGUgbGFzdCB2YWx1ZVxuICAgICAqIHdpbGwgYmUgaW5jbHVkZWQgaW4gdGhlIGdlbmVyYXRlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKGEgLT4gU3RyaW5nKSAtPiBbe2s6IHZ9XSAtPiB7azoge2s6IHZ9fVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIDo6IGEgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IG9mIG9iamVjdHMgdG8gaW5kZXhcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEFuIG9iamVjdCBpbmRleGluZyBlYWNoIGFycmF5IGVsZW1lbnQgYnkgdGhlIGdpdmVuIHByb3BlcnR5LlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBsaXN0ID0gW3tpZDogJ3h5eicsIHRpdGxlOiAnQSd9LCB7aWQ6ICdhYmMnLCB0aXRsZTogJ0InfV07XG4gICAgICogICAgICBSLmluZGV4QnkoUi5wcm9wKCdpZCcpLCBsaXN0KTtcbiAgICAgKiAgICAgIC8vPT4ge2FiYzoge2lkOiAnYWJjJywgdGl0bGU6ICdCJ30sIHh5ejoge2lkOiAneHl6JywgdGl0bGU6ICdBJ319XG4gICAgICovXG4gICAgdmFyIGluZGV4QnkgPSByZWR1Y2VCeShmdW5jdGlvbiAoYWNjLCBlbGVtKSB7XG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgIH0sIG51bGwpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYW4gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTFcbiAgICAgKiBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LiBgUi5lcXVhbHNgIGlzIHVzZWQgdG8gZGV0ZXJtaW5lXG4gICAgICogZXF1YWxpdHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBhIC0+IFthXSAtPiBOdW1iZXJcbiAgICAgKiBAcGFyYW0geyp9IHRhcmdldCBUaGUgaXRlbSB0byBmaW5kLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHhzIFRoZSBhcnJheSB0byBzZWFyY2ggaW4uXG4gICAgICogQHJldHVybiB7TnVtYmVyfSB0aGUgaW5kZXggb2YgdGhlIHRhcmdldCwgb3IgLTEgaWYgdGhlIHRhcmdldCBpcyBub3QgZm91bmQuXG4gICAgICogQHNlZSBSLmxhc3RJbmRleE9mXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5pbmRleE9mKDMsIFsxLDIsMyw0XSk7IC8vPT4gMlxuICAgICAqICAgICAgUi5pbmRleE9mKDEwLCBbMSwyLDMsNF0pOyAvLz0+IC0xXG4gICAgICovXG4gICAgdmFyIGluZGV4T2YgPSBfY3VycnkyKGZ1bmN0aW9uIGluZGV4T2YodGFyZ2V0LCB4cykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHhzLmluZGV4T2YgPT09ICdmdW5jdGlvbicgJiYgIV9pc0FycmF5KHhzKSA/IHhzLmluZGV4T2YodGFyZ2V0KSA6IF9pbmRleE9mKHhzLCB0YXJnZXQsIDApO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICoganV4dCBhcHBsaWVzIGEgbGlzdCBvZiBmdW5jdGlvbnMgdG8gYSBsaXN0IG9mIHZhbHVlcy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgWyhhLCBiLCAuLi4sIG0pIC0+IG5dIC0+ICgoYSwgYiwgLi4uLCBtKSAtPiBbbl0pXG4gICAgICogQHBhcmFtIHtBcnJheX0gZm5zIEFuIGFycmF5IG9mIGZ1bmN0aW9uc1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGxpc3Qgb2YgdmFsdWVzIGFmdGVyIGFwcGx5aW5nIGVhY2ggb2YgdGhlIG9yaWdpbmFsIGBmbnNgIHRvIGl0cyBwYXJhbWV0ZXJzLlxuICAgICAqIEBzZWUgUi5hcHBseVNwZWNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgcmFuZ2UgPSBSLmp1eHQoW01hdGgubWluLCBNYXRoLm1heF0pO1xuICAgICAqICAgICAgcmFuZ2UoMywgNCwgOSwgLTMpOyAvLz0+IFstMywgOV1cbiAgICAgKi9cbiAgICB2YXIganV4dCA9IF9jdXJyeTEoZnVuY3Rpb24ganV4dChmbnMpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcmdlKF9hcnJheU9mLCBmbnMpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGxlbnMgZm9yIHRoZSBnaXZlbiBnZXR0ZXIgYW5kIHNldHRlciBmdW5jdGlvbnMuIFRoZSBnZXR0ZXIgXCJnZXRzXCJcbiAgICAgKiB0aGUgdmFsdWUgb2YgdGhlIGZvY3VzOyB0aGUgc2V0dGVyIFwic2V0c1wiIHRoZSB2YWx1ZSBvZiB0aGUgZm9jdXMuIFRoZSBzZXR0ZXJcbiAgICAgKiBzaG91bGQgbm90IG11dGF0ZSB0aGUgZGF0YSBzdHJ1Y3R1cmUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjguMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAdHlwZWRlZm4gTGVucyBzIGEgPSBGdW5jdG9yIGYgPT4gKGEgLT4gZiBhKSAtPiBzIC0+IGYgc1xuICAgICAqIEBzaWcgKHMgLT4gYSkgLT4gKChhLCBzKSAtPiBzKSAtPiBMZW5zIHMgYVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGdldHRlclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHNldHRlclxuICAgICAqIEByZXR1cm4ge0xlbnN9XG4gICAgICogQHNlZSBSLnZpZXcsIFIuc2V0LCBSLm92ZXIsIFIubGVuc0luZGV4LCBSLmxlbnNQcm9wXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHhMZW5zID0gUi5sZW5zKFIucHJvcCgneCcpLCBSLmFzc29jKCd4JykpO1xuICAgICAqXG4gICAgICogICAgICBSLnZpZXcoeExlbnMsIHt4OiAxLCB5OiAyfSk7ICAgICAgICAgICAgLy89PiAxXG4gICAgICogICAgICBSLnNldCh4TGVucywgNCwge3g6IDEsIHk6IDJ9KTsgICAgICAgICAgLy89PiB7eDogNCwgeTogMn1cbiAgICAgKiAgICAgIFIub3Zlcih4TGVucywgUi5uZWdhdGUsIHt4OiAxLCB5OiAyfSk7ICAvLz0+IHt4OiAtMSwgeTogMn1cbiAgICAgKi9cbiAgICB2YXIgbGVucyA9IF9jdXJyeTIoZnVuY3Rpb24gbGVucyhnZXR0ZXIsIHNldHRlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRvRnVuY3RvckZuKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXAoZnVuY3Rpb24gKGZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXR0ZXIoZm9jdXMsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgfSwgdG9GdW5jdG9yRm4oZ2V0dGVyKHRhcmdldCkpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbGVucyB3aG9zZSBmb2N1cyBpcyB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNC4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEB0eXBlZGVmbiBMZW5zIHMgYSA9IEZ1bmN0b3IgZiA9PiAoYSAtPiBmIGEpIC0+IHMgLT4gZiBzXG4gICAgICogQHNpZyBOdW1iZXIgLT4gTGVucyBzIGFcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gblxuICAgICAqIEByZXR1cm4ge0xlbnN9XG4gICAgICogQHNlZSBSLnZpZXcsIFIuc2V0LCBSLm92ZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgaGVhZExlbnMgPSBSLmxlbnNJbmRleCgwKTtcbiAgICAgKlxuICAgICAqICAgICAgUi52aWV3KGhlYWRMZW5zLCBbJ2EnLCAnYicsICdjJ10pOyAgICAgICAgICAgIC8vPT4gJ2EnXG4gICAgICogICAgICBSLnNldChoZWFkTGVucywgJ3gnLCBbJ2EnLCAnYicsICdjJ10pOyAgICAgICAgLy89PiBbJ3gnLCAnYicsICdjJ11cbiAgICAgKiAgICAgIFIub3ZlcihoZWFkTGVucywgUi50b1VwcGVyLCBbJ2EnLCAnYicsICdjJ10pOyAvLz0+IFsnQScsICdiJywgJ2MnXVxuICAgICAqL1xuICAgIHZhciBsZW5zSW5kZXggPSBfY3VycnkxKGZ1bmN0aW9uIGxlbnNJbmRleChuKSB7XG4gICAgICAgIHJldHVybiBsZW5zKG50aChuKSwgdXBkYXRlKG4pKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsZW5zIHdob3NlIGZvY3VzIGlzIHRoZSBzcGVjaWZpZWQgcGF0aC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTkuMFxuICAgICAqIEBjYXRlZ29yeSBPYmplY3RcbiAgICAgKiBAdHlwZWRlZm4gTGVucyBzIGEgPSBGdW5jdG9yIGYgPT4gKGEgLT4gZiBhKSAtPiBzIC0+IGYgc1xuICAgICAqIEBzaWcgW1N0cmluZ10gLT4gTGVucyBzIGFcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXRoIFRoZSBwYXRoIHRvIHVzZS5cbiAgICAgKiBAcmV0dXJuIHtMZW5zfVxuICAgICAqIEBzZWUgUi52aWV3LCBSLnNldCwgUi5vdmVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHh5TGVucyA9IFIubGVuc1BhdGgoWyd4JywgJ3knXSk7XG4gICAgICpcbiAgICAgKiAgICAgIFIudmlldyh4eUxlbnMsIHt4OiB7eTogMiwgejogM319KTsgICAgICAgICAgICAvLz0+IDJcbiAgICAgKiAgICAgIFIuc2V0KHh5TGVucywgNCwge3g6IHt5OiAyLCB6OiAzfX0pOyAgICAgICAgICAvLz0+IHt4OiB7eTogNCwgejogM319XG4gICAgICogICAgICBSLm92ZXIoeHlMZW5zLCBSLm5lZ2F0ZSwge3g6IHt5OiAyLCB6OiAzfX0pOyAgLy89PiB7eDoge3k6IC0yLCB6OiAzfX1cbiAgICAgKi9cbiAgICB2YXIgbGVuc1BhdGggPSBfY3VycnkxKGZ1bmN0aW9uIGxlbnNQYXRoKHApIHtcbiAgICAgICAgcmV0dXJuIGxlbnMocGF0aChwKSwgYXNzb2NQYXRoKHApKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsZW5zIHdob3NlIGZvY3VzIGlzIHRoZSBzcGVjaWZpZWQgcHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgT2JqZWN0XG4gICAgICogQHR5cGVkZWZuIExlbnMgcyBhID0gRnVuY3RvciBmID0+IChhIC0+IGYgYSkgLT4gcyAtPiBmIHNcbiAgICAgKiBAc2lnIFN0cmluZyAtPiBMZW5zIHMgYVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrXG4gICAgICogQHJldHVybiB7TGVuc31cbiAgICAgKiBAc2VlIFIudmlldywgUi5zZXQsIFIub3ZlclxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciB4TGVucyA9IFIubGVuc1Byb3AoJ3gnKTtcbiAgICAgKlxuICAgICAqICAgICAgUi52aWV3KHhMZW5zLCB7eDogMSwgeTogMn0pOyAgICAgICAgICAgIC8vPT4gMVxuICAgICAqICAgICAgUi5zZXQoeExlbnMsIDQsIHt4OiAxLCB5OiAyfSk7ICAgICAgICAgIC8vPT4ge3g6IDQsIHk6IDJ9XG4gICAgICogICAgICBSLm92ZXIoeExlbnMsIFIubmVnYXRlLCB7eDogMSwgeTogMn0pOyAgLy89PiB7eDogLTEsIHk6IDJ9XG4gICAgICovXG4gICAgdmFyIGxlbnNQcm9wID0gX2N1cnJ5MShmdW5jdGlvbiBsZW5zUHJvcChrKSB7XG4gICAgICAgIHJldHVybiBsZW5zKHByb3AoayksIGFzc29jKGspKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFwibGlmdHNcIiBhIGZ1bmN0aW9uIHRvIGJlIHRoZSBzcGVjaWZpZWQgYXJpdHksIHNvIHRoYXQgaXQgbWF5IFwibWFwIG92ZXJcIiB0aGF0XG4gICAgICogbWFueSBsaXN0cywgRnVuY3Rpb25zIG9yIG90aGVyIG9iamVjdHMgdGhhdCBzYXRpc2Z5IHRoZSBbRmFudGFzeUxhbmQgQXBwbHkgc3BlY10oaHR0cHM6Ly9naXRodWIuY29tL2ZhbnRhc3lsYW5kL2ZhbnRhc3ktbGFuZCNhcHBseSkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjcuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgTnVtYmVyIC0+ICgqLi4uIC0+ICopIC0+IChbKl0uLi4gLT4gWypdKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBsaWZ0IGludG8gaGlnaGVyIGNvbnRleHRcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGxpZnRlZCBmdW5jdGlvbi5cbiAgICAgKiBAc2VlIFIubGlmdCwgUi5hcFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtYWRkMyA9IFIubGlmdE4oMywgUi5jdXJyeU4oMywgKC4uLmFyZ3MpID0+IFIuc3VtKGFyZ3MpKSk7XG4gICAgICogICAgICBtYWRkMyhbMSwyLDNdLCBbMSwyLDNdLCBbMV0pOyAvLz0+IFszLCA0LCA1LCA0LCA1LCA2LCA1LCA2LCA3XVxuICAgICAqL1xuICAgIHZhciBsaWZ0TiA9IF9jdXJyeTIoZnVuY3Rpb24gbGlmdE4oYXJpdHksIGZuKSB7XG4gICAgICAgIHZhciBsaWZ0ZWQgPSBjdXJyeU4oYXJpdHksIGZuKTtcbiAgICAgICAgcmV0dXJuIGN1cnJ5Tihhcml0eSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF9yZWR1Y2UoYXAsIG1hcChsaWZ0ZWQsIGFyZ3VtZW50c1swXSksIF9zbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBtZWFuIG9mIHRoZSBnaXZlbiBsaXN0IG9mIG51bWJlcnMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgTWF0aFxuICAgICAqIEBzaWcgW051bWJlcl0gLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdFxuICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1lYW4oWzIsIDcsIDldKTsgLy89PiA2XG4gICAgICogICAgICBSLm1lYW4oW10pOyAvLz0+IE5hTlxuICAgICAqL1xuICAgIHZhciBtZWFuID0gX2N1cnJ5MShmdW5jdGlvbiBtZWFuKGxpc3QpIHtcbiAgICAgICAgcmV0dXJuIHN1bShsaXN0KSAvIGxpc3QubGVuZ3RoO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbWVkaWFuIG9mIHRoZSBnaXZlbiBsaXN0IG9mIG51bWJlcnMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE0LjBcbiAgICAgKiBAY2F0ZWdvcnkgTWF0aFxuICAgICAqIEBzaWcgW051bWJlcl0gLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdFxuICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLm1lZGlhbihbMiwgOSwgN10pOyAvLz0+IDdcbiAgICAgKiAgICAgIFIubWVkaWFuKFs3LCAyLCAxMCwgOV0pOyAvLz0+IDhcbiAgICAgKiAgICAgIFIubWVkaWFuKFtdKTsgLy89PiBOYU5cbiAgICAgKi9cbiAgICB2YXIgbWVkaWFuID0gX2N1cnJ5MShmdW5jdGlvbiBtZWRpYW4obGlzdCkge1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdpZHRoID0gMiAtIGxlbiAlIDI7XG4gICAgICAgIHZhciBpZHggPSAobGVuIC0gd2lkdGgpIC8gMjtcbiAgICAgICAgcmV0dXJuIG1lYW4oX3NsaWNlKGxpc3QpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfSkuc2xpY2UoaWR4LCBpZHggKyB3aWR0aCkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBwcmVkaWNhdGUgYW5kIGEgbGlzdCBvciBvdGhlciBcImZpbHRlcmFibGVcIiBvYmplY3QgYW5kIHJldHVybnMgdGhlXG4gICAgICogcGFpciBvZiBmaWx0ZXJhYmxlIG9iamVjdHMgb2YgdGhlIHNhbWUgdHlwZSBvZiBlbGVtZW50cyB3aGljaCBkbyBhbmQgZG8gbm90XG4gICAgICogc2F0aXNmeSwgdGhlIHByZWRpY2F0ZSwgcmVzcGVjdGl2ZWx5LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjRcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgRmlsdGVyYWJsZSBmID0+IChhIC0+IEJvb2xlYW4pIC0+IGYgYSAtPiBbZiBhLCBmIGFdXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZCBBIHByZWRpY2F0ZSB0byBkZXRlcm1pbmUgd2hpY2ggc2lkZSB0aGUgZWxlbWVudCBiZWxvbmdzIHRvLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGZpbHRlcmFibGUgdGhlIGxpc3QgKG9yIG90aGVyIGZpbHRlcmFibGUpIHRvIHBhcnRpdGlvbi5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXksIGNvbnRhaW5pbmcgZmlyc3QgdGhlIHN1YnNldCBvZiBlbGVtZW50cyB0aGF0IHNhdGlzZnkgdGhlXG4gICAgICogICAgICAgICBwcmVkaWNhdGUsIGFuZCBzZWNvbmQgdGhlIHN1YnNldCBvZiBlbGVtZW50cyB0aGF0IGRvIG5vdCBzYXRpc2Z5LlxuICAgICAqIEBzZWUgUi5maWx0ZXIsIFIucmVqZWN0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5wYXJ0aXRpb24oUi5jb250YWlucygncycpLCBbJ3NzcycsICd0dHQnLCAnZm9vJywgJ2JhcnMnXSk7XG4gICAgICogICAgICAvLyA9PiBbIFsgJ3NzcycsICdiYXJzJyBdLCAgWyAndHR0JywgJ2ZvbycgXSBdXG4gICAgICpcbiAgICAgKiAgICAgIFIucGFydGl0aW9uKFIuY29udGFpbnMoJ3MnKSwgeyBhOiAnc3NzJywgYjogJ3R0dCcsIGZvbzogJ2JhcnMnIH0pO1xuICAgICAqICAgICAgLy8gPT4gWyB7IGE6ICdzc3MnLCBmb286ICdiYXJzJyB9LCB7IGI6ICd0dHQnIH0gIF1cbiAgICAgKi9cbiAgICB2YXIgcGFydGl0aW9uID0ganV4dChbXG4gICAgICAgIGZpbHRlcixcbiAgICAgICAgcmVqZWN0XG4gICAgXSk7XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBsZWZ0LXRvLXJpZ2h0IGZ1bmN0aW9uIGNvbXBvc2l0aW9uLiBUaGUgbGVmdG1vc3QgZnVuY3Rpb24gbWF5IGhhdmVcbiAgICAgKiBhbnkgYXJpdHk7IHRoZSByZW1haW5pbmcgZnVuY3Rpb25zIG11c3QgYmUgdW5hcnkuXG4gICAgICpcbiAgICAgKiBJbiBzb21lIGxpYnJhcmllcyB0aGlzIGZ1bmN0aW9uIGlzIG5hbWVkIGBzZXF1ZW5jZWAuXG4gICAgICpcbiAgICAgKiAqKk5vdGU6KiogVGhlIHJlc3VsdCBvZiBwaXBlIGlzIG5vdCBhdXRvbWF0aWNhbGx5IGN1cnJpZWQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKCgoYSwgYiwgLi4uLCBuKSAtPiBvKSwgKG8gLT4gcCksIC4uLiwgKHggLT4geSksICh5IC0+IHopKSAtPiAoKGEsIGIsIC4uLiwgbikgLT4geilcbiAgICAgKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBmdW5jdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIuY29tcG9zZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBmID0gUi5waXBlKE1hdGgucG93LCBSLm5lZ2F0ZSwgUi5pbmMpO1xuICAgICAqXG4gICAgICogICAgICBmKDMsIDQpOyAvLyAtKDNeNCkgKyAxXG4gICAgICovXG4gICAgdmFyIHBpcGUgPSBmdW5jdGlvbiBwaXBlKCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwaXBlIHJlcXVpcmVzIGF0IGxlYXN0IG9uZSBhcmd1bWVudCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfYXJpdHkoYXJndW1lbnRzWzBdLmxlbmd0aCwgcmVkdWNlKF9waXBlLCBhcmd1bWVudHNbMF0sIHRhaWwoYXJndW1lbnRzKSkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyBsZWZ0LXRvLXJpZ2h0IGNvbXBvc2l0aW9uIG9mIG9uZSBvciBtb3JlIFByb21pc2UtcmV0dXJuaW5nXG4gICAgICogZnVuY3Rpb25zLiBUaGUgbGVmdG1vc3QgZnVuY3Rpb24gbWF5IGhhdmUgYW55IGFyaXR5OyB0aGUgcmVtYWluaW5nIGZ1bmN0aW9uc1xuICAgICAqIG11c3QgYmUgdW5hcnkuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEwLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgoYSAtPiBQcm9taXNlIGIpLCAoYiAtPiBQcm9taXNlIGMpLCAuLi4sICh5IC0+IFByb21pc2UgeikpIC0+IChhIC0+IFByb21pc2UgeilcbiAgICAgKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBmdW5jdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIuY29tcG9zZVBcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICAvLyAgZm9sbG93ZXJzRm9yVXNlciA6OiBTdHJpbmcgLT4gUHJvbWlzZSBbVXNlcl1cbiAgICAgKiAgICAgIHZhciBmb2xsb3dlcnNGb3JVc2VyID0gUi5waXBlUChkYi5nZXRVc2VyQnlJZCwgZGIuZ2V0Rm9sbG93ZXJzKTtcbiAgICAgKi9cbiAgICB2YXIgcGlwZVAgPSBmdW5jdGlvbiBwaXBlUCgpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncGlwZVAgcmVxdWlyZXMgYXQgbGVhc3Qgb25lIGFyZ3VtZW50Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9hcml0eShhcmd1bWVudHNbMF0ubGVuZ3RoLCByZWR1Y2UoX3BpcGVQLCBhcmd1bWVudHNbMF0sIHRhaWwoYXJndW1lbnRzKSkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNdWx0aXBsaWVzIHRvZ2V0aGVyIGFsbCB0aGUgZWxlbWVudHMgb2YgYSBsaXN0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTWF0aFxuICAgICAqIEBzaWcgW051bWJlcl0gLT4gTnVtYmVyXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBBbiBhcnJheSBvZiBudW1iZXJzXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgcHJvZHVjdCBvZiBhbGwgdGhlIG51bWJlcnMgaW4gdGhlIGxpc3QuXG4gICAgICogQHNlZSBSLnJlZHVjZVxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIucHJvZHVjdChbMiw0LDYsOCwxMDAsMV0pOyAvLz0+IDM4NDAwXG4gICAgICovXG4gICAgdmFyIHByb2R1Y3QgPSByZWR1Y2UobXVsdGlwbHksIDEpO1xuXG4gICAgLyoqXG4gICAgICogVHJhbnNmb3JtcyBhIFtUcmF2ZXJzYWJsZV0oaHR0cHM6Ly9naXRodWIuY29tL2ZhbnRhc3lsYW5kL2ZhbnRhc3ktbGFuZCN0cmF2ZXJzYWJsZSlcbiAgICAgKiBvZiBbQXBwbGljYXRpdmVdKGh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5bGFuZC9mYW50YXN5LWxhbmQjYXBwbGljYXRpdmUpIGludG8gYW5cbiAgICAgKiBBcHBsaWNhdGl2ZSBvZiBUcmF2ZXJzYWJsZS5cbiAgICAgKlxuICAgICAqIERpc3BhdGNoZXMgdG8gdGhlIGBzZXF1ZW5jZWAgbWV0aG9kIG9mIHRoZSBzZWNvbmQgYXJndW1lbnQsIGlmIHByZXNlbnQuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgKEFwcGxpY2F0aXZlIGYsIFRyYXZlcnNhYmxlIHQpID0+IChhIC0+IGYgYSkgLT4gdCAoZiBhKSAtPiBmICh0IGEpXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb2ZcbiAgICAgKiBAcGFyYW0geyp9IHRyYXZlcnNhYmxlXG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIudHJhdmVyc2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnNlcXVlbmNlKE1heWJlLm9mLCBbSnVzdCgxKSwgSnVzdCgyKSwgSnVzdCgzKV0pOyAgIC8vPT4gSnVzdChbMSwgMiwgM10pXG4gICAgICogICAgICBSLnNlcXVlbmNlKE1heWJlLm9mLCBbSnVzdCgxKSwgSnVzdCgyKSwgTm90aGluZygpXSk7IC8vPT4gTm90aGluZygpXG4gICAgICpcbiAgICAgKiAgICAgIFIuc2VxdWVuY2UoUi5vZiwgSnVzdChbMSwgMiwgM10pKTsgLy89PiBbSnVzdCgxKSwgSnVzdCgyKSwgSnVzdCgzKV1cbiAgICAgKiAgICAgIFIuc2VxdWVuY2UoUi5vZiwgTm90aGluZygpKTsgICAgICAgLy89PiBbTm90aGluZygpXVxuICAgICAqL1xuICAgIHZhciBzZXF1ZW5jZSA9IF9jdXJyeTIoZnVuY3Rpb24gc2VxdWVuY2Uob2YsIHRyYXZlcnNhYmxlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdHJhdmVyc2FibGUuc2VxdWVuY2UgPT09ICdmdW5jdGlvbicgPyB0cmF2ZXJzYWJsZS5zZXF1ZW5jZShvZikgOiByZWR1Y2VSaWdodChmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgICAgICAgICByZXR1cm4gYXAobWFwKHByZXBlbmQsIHgpLCBhY2MpO1xuICAgICAgICB9LCBvZihbXSksIHRyYXZlcnNhYmxlKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gW0FwcGxpY2F0aXZlXShodHRwczovL2dpdGh1Yi5jb20vZmFudGFzeWxhbmQvZmFudGFzeS1sYW5kI2FwcGxpY2F0aXZlKS1yZXR1cm5pbmdcbiAgICAgKiBmdW5jdGlvbiBvdmVyIGEgW1RyYXZlcnNhYmxlXShodHRwczovL2dpdGh1Yi5jb20vZmFudGFzeWxhbmQvZmFudGFzeS1sYW5kI3RyYXZlcnNhYmxlKSxcbiAgICAgKiB0aGVuIHVzZXMgW2BzZXF1ZW5jZWBdKCNzZXF1ZW5jZSkgdG8gdHJhbnNmb3JtIHRoZSByZXN1bHRpbmcgVHJhdmVyc2FibGUgb2YgQXBwbGljYXRpdmVcbiAgICAgKiBpbnRvIGFuIEFwcGxpY2F0aXZlIG9mIFRyYXZlcnNhYmxlLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYHNlcXVlbmNlYCBtZXRob2Qgb2YgdGhlIHRoaXJkIGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChBcHBsaWNhdGl2ZSBmLCBUcmF2ZXJzYWJsZSB0KSA9PiAoYSAtPiBmIGEpIC0+IChhIC0+IGYgYikgLT4gdCBhIC0+IGYgKHQgYilcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvZlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZcbiAgICAgKiBAcGFyYW0geyp9IHRyYXZlcnNhYmxlXG4gICAgICogQHJldHVybiB7Kn1cbiAgICAgKiBAc2VlIFIuc2VxdWVuY2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICAvLyBSZXR1cm5zIGBOb3RoaW5nYCBpZiB0aGUgZ2l2ZW4gZGl2aXNvciBpcyBgMGBcbiAgICAgKiAgICAgIHNhZmVEaXYgPSBuID0+IGQgPT4gZCA9PT0gMCA/IE5vdGhpbmcoKSA6IEp1c3QobiAvIGQpXG4gICAgICpcbiAgICAgKiAgICAgIFIudHJhdmVyc2UoTWF5YmUub2YsIHNhZmVEaXYoMTApLCBbMiwgNCwgNV0pOyAvLz0+IEp1c3QoWzUsIDIuNSwgMl0pXG4gICAgICogICAgICBSLnRyYXZlcnNlKE1heWJlLm9mLCBzYWZlRGl2KDEwKSwgWzIsIDAsIDVdKTsgLy89PiBOb3RoaW5nXG4gICAgICovXG4gICAgdmFyIHRyYXZlcnNlID0gX2N1cnJ5MyhmdW5jdGlvbiB0cmF2ZXJzZShvZiwgZiwgdHJhdmVyc2FibGUpIHtcbiAgICAgICAgcmV0dXJuIHNlcXVlbmNlKG9mLCBtYXAoZiwgdHJhdmVyc2FibGUpKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFNob3J0aGFuZCBmb3IgYFIuY2hhaW4oUi5pZGVudGl0eSlgLCB3aGljaCByZW1vdmVzIG9uZSBsZXZlbCBvZiBuZXN0aW5nIGZyb21cbiAgICAgKiBhbnkgW0NoYWluXShodHRwczovL2dpdGh1Yi5jb20vZmFudGFzeWxhbmQvZmFudGFzeS1sYW5kI2NoYWluKS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMy4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIENoYWluIGMgPT4gYyAoYyBhKSAtPiBjIGFcbiAgICAgKiBAcGFyYW0geyp9IGxpc3RcbiAgICAgKiBAcmV0dXJuIHsqfVxuICAgICAqIEBzZWUgUi5mbGF0dGVuLCBSLmNoYWluXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi51bm5lc3QoWzEsIFsyXSwgW1szXV1dKTsgLy89PiBbMSwgMiwgWzNdXVxuICAgICAqICAgICAgUi51bm5lc3QoW1sxLCAyXSwgWzMsIDRdLCBbNSwgNl1dKTsgLy89PiBbMSwgMiwgMywgNCwgNSwgNl1cbiAgICAgKi9cbiAgICB2YXIgdW5uZXN0ID0gY2hhaW4oX2lkZW50aXR5KTtcblxuICAgIHZhciBfY29udGFpbnMgPSBmdW5jdGlvbiBfY29udGFpbnMoYSwgbGlzdCkge1xuICAgICAgICByZXR1cm4gX2luZGV4T2YobGlzdCwgYSwgMCkgPj0gMDtcbiAgICB9O1xuXG4gICAgLy8gIG1hcFBhaXJzIDo6IChPYmplY3QsIFtTdHJpbmddKSAtPiBbU3RyaW5nXVxuICAgIHZhciBfdG9TdHJpbmcgPSBmdW5jdGlvbiBfdG9TdHJpbmcoeCwgc2Vlbikge1xuICAgICAgICB2YXIgcmVjdXIgPSBmdW5jdGlvbiByZWN1cih5KSB7XG4gICAgICAgICAgICB2YXIgeHMgPSBzZWVuLmNvbmNhdChbeF0pO1xuICAgICAgICAgICAgcmV0dXJuIF9jb250YWlucyh5LCB4cykgPyAnPENpcmN1bGFyPicgOiBfdG9TdHJpbmcoeSwgeHMpO1xuICAgICAgICB9O1xuICAgICAgICAvLyAgbWFwUGFpcnMgOjogKE9iamVjdCwgW1N0cmluZ10pIC0+IFtTdHJpbmddXG4gICAgICAgIHZhciBtYXBQYWlycyA9IGZ1bmN0aW9uIChvYmosIGtleXMpIHtcbiAgICAgICAgICAgIHJldHVybiBfbWFwKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9xdW90ZShrKSArICc6ICcgKyByZWN1cihvYmpba10pO1xuICAgICAgICAgICAgfSwga2V5cy5zbGljZSgpLnNvcnQoKSk7XG4gICAgICAgIH07XG4gICAgICAgIHN3aXRjaCAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpKSB7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgQXJndW1lbnRzXSc6XG4gICAgICAgICAgICByZXR1cm4gJyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgnICsgX21hcChyZWN1ciwgeCkuam9pbignLCAnKSArICcpKSc7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgQXJyYXldJzpcbiAgICAgICAgICAgIHJldHVybiAnWycgKyBfbWFwKHJlY3VyLCB4KS5jb25jYXQobWFwUGFpcnMoeCwgcmVqZWN0KGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC9eXFxkKyQvLnRlc3Qoayk7XG4gICAgICAgICAgICB9LCBrZXlzKHgpKSkpLmpvaW4oJywgJykgKyAnXSc7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyA/ICduZXcgQm9vbGVhbignICsgcmVjdXIoeC52YWx1ZU9mKCkpICsgJyknIDogeC50b1N0cmluZygpO1xuICAgICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgICAgICAgIHJldHVybiAnbmV3IERhdGUoJyArIChpc05hTih4LnZhbHVlT2YoKSkgPyByZWN1cihOYU4pIDogX3F1b3RlKF90b0lTT1N0cmluZyh4KSkpICsgJyknO1xuICAgICAgICBjYXNlICdbb2JqZWN0IE51bGxdJzpcbiAgICAgICAgICAgIHJldHVybiAnbnVsbCc7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnID8gJ25ldyBOdW1iZXIoJyArIHJlY3VyKHgudmFsdWVPZigpKSArICcpJyA6IDEgLyB4ID09PSAtSW5maW5pdHkgPyAnLTAnIDogeC50b1N0cmluZygxMCk7XG4gICAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnID8gJ25ldyBTdHJpbmcoJyArIHJlY3VyKHgudmFsdWVPZigpKSArICcpJyA6IF9xdW90ZSh4KTtcbiAgICAgICAgY2FzZSAnW29iamVjdCBVbmRlZmluZWRdJzpcbiAgICAgICAgICAgIHJldHVybiAndW5kZWZpbmVkJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICh0eXBlb2YgeC50b1N0cmluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHZhciByZXByID0geC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmIChyZXByICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVwcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ3snICsgbWFwUGFpcnMoeCwga2V5cyh4KSkuam9pbignLCAnKSArICd9JztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyByaWdodC10by1sZWZ0IGZ1bmN0aW9uIGNvbXBvc2l0aW9uLiBUaGUgcmlnaHRtb3N0IGZ1bmN0aW9uIG1heSBoYXZlXG4gICAgICogYW55IGFyaXR5OyB0aGUgcmVtYWluaW5nIGZ1bmN0aW9ucyBtdXN0IGJlIHVuYXJ5LlxuICAgICAqXG4gICAgICogKipOb3RlOioqIFRoZSByZXN1bHQgb2YgY29tcG9zZSBpcyBub3QgYXV0b21hdGljYWxseSBjdXJyaWVkLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgoeSAtPiB6KSwgKHggLT4geSksIC4uLiwgKG8gLT4gcCksICgoYSwgYiwgLi4uLCBuKSAtPiBvKSkgLT4gKChhLCBiLCAuLi4sIG4pIC0+IHopXG4gICAgICogQHBhcmFtIHsuLi5GdW5jdGlvbn0gZnVuY3Rpb25zXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQHNlZSBSLnBpcGVcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZiA9IFIuY29tcG9zZShSLmluYywgUi5uZWdhdGUsIE1hdGgucG93KTtcbiAgICAgKlxuICAgICAqICAgICAgZigzLCA0KTsgLy8gLSgzXjQpICsgMVxuICAgICAqL1xuICAgIHZhciBjb21wb3NlID0gZnVuY3Rpb24gY29tcG9zZSgpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY29tcG9zZSByZXF1aXJlcyBhdCBsZWFzdCBvbmUgYXJndW1lbnQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGlwZS5hcHBseSh0aGlzLCByZXZlcnNlKGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSByaWdodC10by1sZWZ0IEtsZWlzbGkgY29tcG9zaXRpb24gb2YgdGhlIHByb3ZpZGVkIGZ1bmN0aW9ucyxcbiAgICAgKiBlYWNoIG9mIHdoaWNoIG11c3QgcmV0dXJuIGEgdmFsdWUgb2YgYSB0eXBlIHN1cHBvcnRlZCBieSBbYGNoYWluYF0oI2NoYWluKS5cbiAgICAgKlxuICAgICAqIGBSLmNvbXBvc2VLKGgsIGcsIGYpYCBpcyBlcXVpdmFsZW50IHRvIGBSLmNvbXBvc2UoUi5jaGFpbihoKSwgUi5jaGFpbihnKSwgUi5jaGFpbihmKSlgLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBDaGFpbiBtID0+ICgoeSAtPiBtIHopLCAoeCAtPiBtIHkpLCAuLi4sIChhIC0+IG0gYikpIC0+IChtIGEgLT4gbSB6KVxuICAgICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259XG4gICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICogQHNlZSBSLnBpcGVLXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgLy8gIHBhcnNlSnNvbiA6OiBTdHJpbmcgLT4gTWF5YmUgKlxuICAgICAqICAgICAgLy8gIGdldCA6OiBTdHJpbmcgLT4gT2JqZWN0IC0+IE1heWJlICpcbiAgICAgKlxuICAgICAqICAgICAgLy8gIGdldFN0YXRlQ29kZSA6OiBNYXliZSBTdHJpbmcgLT4gTWF5YmUgU3RyaW5nXG4gICAgICogICAgICB2YXIgZ2V0U3RhdGVDb2RlID0gUi5jb21wb3NlSyhcbiAgICAgKiAgICAgICAgUi5jb21wb3NlKE1heWJlLm9mLCBSLnRvVXBwZXIpLFxuICAgICAqICAgICAgICBnZXQoJ3N0YXRlJyksXG4gICAgICogICAgICAgIGdldCgnYWRkcmVzcycpLFxuICAgICAqICAgICAgICBnZXQoJ3VzZXInKSxcbiAgICAgKiAgICAgICAgcGFyc2VKc29uXG4gICAgICogICAgICApO1xuICAgICAqXG4gICAgICogICAgICBnZXRTdGF0ZUNvZGUoTWF5YmUub2YoJ3tcInVzZXJcIjp7XCJhZGRyZXNzXCI6e1wic3RhdGVcIjpcIm55XCJ9fX0nKSk7XG4gICAgICogICAgICAvLz0+IEp1c3QoJ05ZJylcbiAgICAgKiAgICAgIGdldFN0YXRlQ29kZShNYXliZS5vZignW0ludmFsaWQgSlNPTl0nKSk7XG4gICAgICogICAgICAvLz0+IE5vdGhpbmcoKVxuICAgICAqL1xuICAgIHZhciBjb21wb3NlSyA9IGZ1bmN0aW9uIGNvbXBvc2VLKCkge1xuICAgICAgICByZXR1cm4gY29tcG9zZS5hcHBseSh0aGlzLCBwcmVwZW5kKGlkZW50aXR5LCBtYXAoY2hhaW4sIGFyZ3VtZW50cykpKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgcmlnaHQtdG8tbGVmdCBjb21wb3NpdGlvbiBvZiBvbmUgb3IgbW9yZSBQcm9taXNlLXJldHVybmluZ1xuICAgICAqIGZ1bmN0aW9ucy4gVGhlIHJpZ2h0bW9zdCBmdW5jdGlvbiBtYXkgaGF2ZSBhbnkgYXJpdHk7IHRoZSByZW1haW5pbmdcbiAgICAgKiBmdW5jdGlvbnMgbXVzdCBiZSB1bmFyeS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTAuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKCh5IC0+IFByb21pc2UgeiksICh4IC0+IFByb21pc2UgeSksIC4uLiwgKGEgLT4gUHJvbWlzZSBiKSkgLT4gKGEgLT4gUHJvbWlzZSB6KVxuICAgICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZ1bmN0aW9uc1xuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAqIEBzZWUgUi5waXBlUFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIC8vICBmb2xsb3dlcnNGb3JVc2VyIDo6IFN0cmluZyAtPiBQcm9taXNlIFtVc2VyXVxuICAgICAqICAgICAgdmFyIGZvbGxvd2Vyc0ZvclVzZXIgPSBSLmNvbXBvc2VQKGRiLmdldEZvbGxvd2VycywgZGIuZ2V0VXNlckJ5SWQpO1xuICAgICAqL1xuICAgIHZhciBjb21wb3NlUCA9IGZ1bmN0aW9uIGNvbXBvc2VQKCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb21wb3NlUCByZXF1aXJlcyBhdCBsZWFzdCBvbmUgYXJndW1lbnQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGlwZVAuYXBwbHkodGhpcywgcmV2ZXJzZShhcmd1bWVudHMpKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogV3JhcHMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBpbnNpZGUgYSBjdXJyaWVkIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIGNhbGxlZFxuICAgICAqIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzIGFuZCByZXR1cm5zIHRoZSBzYW1lIHR5cGUuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICAgICAqIEBzaWcgKCogLT4geyp9KSAtPiAoKiAtPiB7Kn0pXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gRm4gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIHdyYXAuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IEEgd3JhcHBlZCwgY3VycmllZCBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICAvLyBDb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgICAqICAgICAgdmFyIFdpZGdldCA9IGNvbmZpZyA9PiB7XG4gICAgICogICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIFdpZGdldC5wcm90b3R5cGUgPSB7XG4gICAgICogICAgICAgIC8vIC4uLlxuICAgICAqICAgICAgfTtcbiAgICAgKiAgICAgIHZhciBhbGxDb25maWdzID0gW1xuICAgICAqICAgICAgICAvLyAuLi5cbiAgICAgKiAgICAgIF07XG4gICAgICogICAgICBSLm1hcChSLmNvbnN0cnVjdChXaWRnZXQpLCBhbGxDb25maWdzKTsgLy8gYSBsaXN0IG9mIFdpZGdldHNcbiAgICAgKi9cbiAgICB2YXIgY29uc3RydWN0ID0gX2N1cnJ5MShmdW5jdGlvbiBjb25zdHJ1Y3QoRm4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnN0cnVjdE4oRm4ubGVuZ3RoLCBGbik7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgc3BlY2lmaWVkIHZhbHVlIGlzIGVxdWFsLCBpbiBgUi5lcXVhbHNgIHRlcm1zLCB0byBhdFxuICAgICAqIGxlYXN0IG9uZSBlbGVtZW50IG9mIHRoZSBnaXZlbiBsaXN0OyBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIGEgLT4gW2FdIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYSBUaGUgaXRlbSB0byBjb21wYXJlIGFnYWluc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBpdGVtIGlzIGluIHRoZSBsaXN0LCBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICAgKiBAc2VlIFIuYW55XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5jb250YWlucygzLCBbMSwgMiwgM10pOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIFIuY29udGFpbnMoNCwgWzEsIDIsIDNdKTsgLy89PiBmYWxzZVxuICAgICAqICAgICAgUi5jb250YWlucyhbNDJdLCBbWzQyXV0pOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgY29udGFpbnMgPSBfY3VycnkyKF9jb250YWlucyk7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgc2V0IChpLmUuIG5vIGR1cGxpY2F0ZXMpIG9mIGFsbCBlbGVtZW50cyBpbiB0aGUgZmlyc3QgbGlzdCBub3RcbiAgICAgKiBjb250YWluZWQgaW4gdGhlIHNlY29uZCBsaXN0LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIFsqXSAtPiBbKl0gLT4gWypdXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDEgVGhlIGZpcnN0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDIgVGhlIHNlY29uZCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgZWxlbWVudHMgaW4gYGxpc3QxYCB0aGF0IGFyZSBub3QgaW4gYGxpc3QyYC5cbiAgICAgKiBAc2VlIFIuZGlmZmVyZW5jZVdpdGhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmRpZmZlcmVuY2UoWzEsMiwzLDRdLCBbNyw2LDUsNCwzXSk7IC8vPT4gWzEsMl1cbiAgICAgKiAgICAgIFIuZGlmZmVyZW5jZShbNyw2LDUsNCwzXSwgWzEsMiwzLDRdKTsgLy89PiBbNyw2LDVdXG4gICAgICovXG4gICAgdmFyIGRpZmZlcmVuY2UgPSBfY3VycnkyKGZ1bmN0aW9uIGRpZmZlcmVuY2UoZmlyc3QsIHNlY29uZCkge1xuICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgIHZhciBpZHggPSAwO1xuICAgICAgICB2YXIgZmlyc3RMZW4gPSBmaXJzdC5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpZHggPCBmaXJzdExlbikge1xuICAgICAgICAgICAgaWYgKCFfY29udGFpbnMoZmlyc3RbaWR4XSwgc2Vjb25kKSAmJiAhX2NvbnRhaW5zKGZpcnN0W2lkeF0sIG91dCkpIHtcbiAgICAgICAgICAgICAgICBvdXRbb3V0Lmxlbmd0aF0gPSBmaXJzdFtpZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCB3aXRob3V0IGFueSBjb25zZWN1dGl2ZWx5IHJlcGVhdGluZyBlbGVtZW50cy4gYFIuZXF1YWxzYFxuICAgICAqIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGVxdWFsaXR5LlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGRyb3BSZXBlYXRzYCBtZXRob2Qgb2YgdGhlIGZpcnN0IGFyZ3VtZW50LCBpZiBwcmVzZW50LlxuICAgICAqXG4gICAgICogQWN0cyBhcyBhIHRyYW5zZHVjZXIgaWYgYSB0cmFuc2Zvcm1lciBpcyBnaXZlbiBpbiBsaXN0IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNC4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBhcnJheSB0byBjb25zaWRlci5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gYGxpc3RgIHdpdGhvdXQgcmVwZWF0aW5nIGVsZW1lbnRzLlxuICAgICAqIEBzZWUgUi50cmFuc2R1Y2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgIFIuZHJvcFJlcGVhdHMoWzEsIDEsIDEsIDIsIDMsIDQsIDQsIDIsIDJdKTsgLy89PiBbMSwgMiwgMywgNCwgMl1cbiAgICAgKi9cbiAgICB2YXIgZHJvcFJlcGVhdHMgPSBfY3VycnkxKF9kaXNwYXRjaGFibGUoJ2Ryb3BSZXBlYXRzJywgX3hkcm9wUmVwZWF0c1dpdGgoZXF1YWxzKSwgZHJvcFJlcGVhdHNXaXRoKGVxdWFscykpKTtcblxuICAgIC8qKlxuICAgICAqIFwibGlmdHNcIiBhIGZ1bmN0aW9uIG9mIGFyaXR5ID4gMSBzbyB0aGF0IGl0IG1heSBcIm1hcCBvdmVyXCIgYSBsaXN0LCBGdW5jdGlvbiBvciBvdGhlclxuICAgICAqIG9iamVjdCB0aGF0IHNhdGlzZmllcyB0aGUgW0ZhbnRhc3lMYW5kIEFwcGx5IHNwZWNdKGh0dHBzOi8vZ2l0aHViLmNvbS9mYW50YXN5bGFuZC9mYW50YXN5LWxhbmQjYXBwbHkpLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC43LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnICgqLi4uIC0+ICopIC0+IChbKl0uLi4gLT4gWypdKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBsaWZ0IGludG8gaGlnaGVyIGNvbnRleHRcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGxpZnRlZCBmdW5jdGlvbi5cbiAgICAgKiBAc2VlIFIubGlmdE5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgbWFkZDMgPSBSLmxpZnQoUi5jdXJyeSgoYSwgYiwgYykgPT4gYSArIGIgKyBjKSk7XG4gICAgICpcbiAgICAgKiAgICAgIG1hZGQzKFsxLDIsM10sIFsxLDIsM10sIFsxXSk7IC8vPT4gWzMsIDQsIDUsIDQsIDUsIDYsIDUsIDYsIDddXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBtYWRkNSA9IFIubGlmdChSLmN1cnJ5KChhLCBiLCBjLCBkLCBlKSA9PiBhICsgYiArIGMgKyBkICsgZSkpO1xuICAgICAqXG4gICAgICogICAgICBtYWRkNShbMSwyXSwgWzNdLCBbNCwgNV0sIFs2XSwgWzcsIDhdKTsgLy89PiBbMjEsIDIyLCAyMiwgMjMsIDIyLCAyMywgMjMsIDI0XVxuICAgICAqL1xuICAgIHZhciBsaWZ0ID0gX2N1cnJ5MShmdW5jdGlvbiBsaWZ0KGZuKSB7XG4gICAgICAgIHJldHVybiBsaWZ0Tihmbi5sZW5ndGgsIGZuKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBwYXJ0aWFsIGNvcHkgb2YgYW4gb2JqZWN0IG9taXR0aW5nIHRoZSBrZXlzIHNwZWNpZmllZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IE9iamVjdFxuICAgICAqIEBzaWcgW1N0cmluZ10gLT4ge1N0cmluZzogKn0gLT4ge1N0cmluZzogKn1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBuYW1lcyBhbiBhcnJheSBvZiBTdHJpbmcgcHJvcGVydHkgbmFtZXMgdG8gb21pdCBmcm9tIHRoZSBuZXcgb2JqZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGNvcHkgZnJvbVxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQSBuZXcgb2JqZWN0IHdpdGggcHJvcGVydGllcyBmcm9tIGBuYW1lc2Agbm90IG9uIGl0LlxuICAgICAqIEBzZWUgUi5waWNrXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5vbWl0KFsnYScsICdkJ10sIHthOiAxLCBiOiAyLCBjOiAzLCBkOiA0fSk7IC8vPT4ge2I6IDIsIGM6IDN9XG4gICAgICovXG4gICAgdmFyIG9taXQgPSBfY3VycnkyKGZ1bmN0aW9uIG9taXQobmFtZXMsIG9iaikge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoIV9jb250YWlucyhwcm9wLCBuYW1lcykpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGxlZnQtdG8tcmlnaHQgS2xlaXNsaSBjb21wb3NpdGlvbiBvZiB0aGUgcHJvdmlkZWQgZnVuY3Rpb25zLFxuICAgICAqIGVhY2ggb2Ygd2hpY2ggbXVzdCByZXR1cm4gYSB2YWx1ZSBvZiBhIHR5cGUgc3VwcG9ydGVkIGJ5IFtgY2hhaW5gXSgjY2hhaW4pLlxuICAgICAqXG4gICAgICogYFIucGlwZUsoZiwgZywgaClgIGlzIGVxdWl2YWxlbnQgdG8gYFIucGlwZShSLmNoYWluKGYpLCBSLmNoYWluKGcpLCBSLmNoYWluKGgpKWAuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE2LjBcbiAgICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAgICAgKiBAc2lnIENoYWluIG0gPT4gKChhIC0+IG0gYiksIChiIC0+IG0gYyksIC4uLiwgKHkgLT4gbSB6KSkgLT4gKG0gYSAtPiBtIHopXG4gICAgICogQHBhcmFtIHsuLi5GdW5jdGlvbn1cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIuY29tcG9zZUtcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICAvLyAgcGFyc2VKc29uIDo6IFN0cmluZyAtPiBNYXliZSAqXG4gICAgICogICAgICAvLyAgZ2V0IDo6IFN0cmluZyAtPiBPYmplY3QgLT4gTWF5YmUgKlxuICAgICAqXG4gICAgICogICAgICAvLyAgZ2V0U3RhdGVDb2RlIDo6IE1heWJlIFN0cmluZyAtPiBNYXliZSBTdHJpbmdcbiAgICAgKiAgICAgIHZhciBnZXRTdGF0ZUNvZGUgPSBSLnBpcGVLKFxuICAgICAqICAgICAgICBwYXJzZUpzb24sXG4gICAgICogICAgICAgIGdldCgndXNlcicpLFxuICAgICAqICAgICAgICBnZXQoJ2FkZHJlc3MnKSxcbiAgICAgKiAgICAgICAgZ2V0KCdzdGF0ZScpLFxuICAgICAqICAgICAgICBSLmNvbXBvc2UoTWF5YmUub2YsIFIudG9VcHBlcilcbiAgICAgKiAgICAgICk7XG4gICAgICpcbiAgICAgKiAgICAgIGdldFN0YXRlQ29kZShNYXliZS5vZigne1widXNlclwiOntcImFkZHJlc3NcIjp7XCJzdGF0ZVwiOlwibnlcIn19fScpKTtcbiAgICAgKiAgICAgIC8vPT4gSnVzdCgnTlknKVxuICAgICAqICAgICAgZ2V0U3RhdGVDb2RlKE1heWJlLm9mKCdbSW52YWxpZCBKU09OXScpKTtcbiAgICAgKiAgICAgIC8vPT4gTm90aGluZygpXG4gICAgICovXG4gICAgdmFyIHBpcGVLID0gZnVuY3Rpb24gcGlwZUsoKSB7XG4gICAgICAgIHJldHVybiBjb21wb3NlSy5hcHBseSh0aGlzLCByZXZlcnNlKGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIHZhbHVlLiBgZXZhbGAnaW5nIHRoZSBvdXRwdXRcbiAgICAgKiBzaG91bGQgcmVzdWx0IGluIGEgdmFsdWUgZXF1aXZhbGVudCB0byB0aGUgaW5wdXQgdmFsdWUuIE1hbnkgb2YgdGhlIGJ1aWx0LWluXG4gICAgICogYHRvU3RyaW5nYCBtZXRob2RzIGRvIG5vdCBzYXRpc2Z5IHRoaXMgcmVxdWlyZW1lbnQuXG4gICAgICpcbiAgICAgKiBJZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYW4gYFtvYmplY3QgT2JqZWN0XWAgd2l0aCBhIGB0b1N0cmluZ2AgbWV0aG9kIG90aGVyXG4gICAgICogdGhhbiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AsIHRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2l0aCBubyBhcmd1bWVudHNcbiAgICAgKiB0byBwcm9kdWNlIHRoZSByZXR1cm4gdmFsdWUuIFRoaXMgbWVhbnMgdXNlci1kZWZpbmVkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uc1xuICAgICAqIGNhbiBwcm92aWRlIGEgc3VpdGFibGUgYHRvU3RyaW5nYCBtZXRob2QuIEZvciBleGFtcGxlOlxuICAgICAqXG4gICAgICogICAgIGZ1bmN0aW9uIFBvaW50KHgsIHkpIHtcbiAgICAgKiAgICAgICB0aGlzLnggPSB4O1xuICAgICAqICAgICAgIHRoaXMueSA9IHk7XG4gICAgICogICAgIH1cbiAgICAgKlxuICAgICAqICAgICBQb2ludC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgKiAgICAgICByZXR1cm4gJ25ldyBQb2ludCgnICsgdGhpcy54ICsgJywgJyArIHRoaXMueSArICcpJztcbiAgICAgKiAgICAgfTtcbiAgICAgKlxuICAgICAqICAgICBSLnRvU3RyaW5nKG5ldyBQb2ludCgxLCAyKSk7IC8vPT4gJ25ldyBQb2ludCgxLCAyKSdcbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMTQuMFxuICAgICAqIEBjYXRlZ29yeSBTdHJpbmdcbiAgICAgKiBAc2lnICogLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHsqfSB2YWxcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50b1N0cmluZyg0Mik7IC8vPT4gJzQyJ1xuICAgICAqICAgICAgUi50b1N0cmluZygnYWJjJyk7IC8vPT4gJ1wiYWJjXCInXG4gICAgICogICAgICBSLnRvU3RyaW5nKFsxLCAyLCAzXSk7IC8vPT4gJ1sxLCAyLCAzXSdcbiAgICAgKiAgICAgIFIudG9TdHJpbmcoe2ZvbzogMSwgYmFyOiAyLCBiYXo6IDN9KTsgLy89PiAne1wiYmFyXCI6IDIsIFwiYmF6XCI6IDMsIFwiZm9vXCI6IDF9J1xuICAgICAqICAgICAgUi50b1N0cmluZyhuZXcgRGF0ZSgnMjAwMS0wMi0wM1QwNDowNTowNlonKSk7IC8vPT4gJ25ldyBEYXRlKFwiMjAwMS0wMi0wM1QwNDowNTowNi4wMDBaXCIpJ1xuICAgICAqL1xuICAgIHZhciB0b1N0cmluZyA9IF9jdXJyeTEoZnVuY3Rpb24gdG9TdHJpbmcodmFsKSB7XG4gICAgICAgIHJldHVybiBfdG9TdHJpbmcodmFsLCBbXSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGxpc3Qgd2l0aG91dCB2YWx1ZXMgaW4gdGhlIGZpcnN0IGFyZ3VtZW50LlxuICAgICAqIGBSLmVxdWFsc2AgaXMgdXNlZCB0byBkZXRlcm1pbmUgZXF1YWxpdHkuXG4gICAgICpcbiAgICAgKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0MSBUaGUgdmFsdWVzIHRvIGJlIHJlbW92ZWQgZnJvbSBgbGlzdDJgLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBhcnJheSB0byByZW1vdmUgdmFsdWVzIGZyb20uXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgd2l0aG91dCB2YWx1ZXMgaW4gYGxpc3QxYC5cbiAgICAgKiBAc2VlIFIudHJhbnNkdWNlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi53aXRob3V0KFsxLCAyXSwgWzEsIDIsIDEsIDMsIDRdKTsgLy89PiBbMywgNF1cbiAgICAgKi9cbiAgICB2YXIgd2l0aG91dCA9IF9jdXJyeTIoZnVuY3Rpb24gKHhzLCBsaXN0KSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZmxpcChfY29udGFpbnMpKHhzKSwgbGlzdCk7XG4gICAgfSk7XG5cbiAgICAvLyBBIHNpbXBsZSBTZXQgdHlwZSB0aGF0IGhvbm91cnMgUi5lcXVhbHMgc2VtYW50aWNzXG4gICAgLyogZ2xvYmFscyBTZXQgKi9cbiAgICAvKipcbiAgICAgICAqIENvbWJpbmVzIHRoZSBsb2dpYyBmb3IgY2hlY2tpbmcgd2hldGhlciBhbiBpdGVtIGlzIGEgbWVtYmVyIG9mIHRoZSBzZXQgYW5kXG4gICAgICAgKiBmb3IgYWRkaW5nIGEgbmV3IGl0ZW0gdG8gdGhlIHNldC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0gaXRlbSAgICAgICBUaGUgaXRlbSB0byBjaGVjayBvciBhZGQgdG8gdGhlIFNldCBpbnN0YW5jZS5cbiAgICAgICAqIEBwYXJhbSBzaG91bGRBZGQgIElmIHRydWUsIHRoZSBpdGVtIHdpbGwgYmUgYWRkZWQgdG8gdGhlIHNldCBpZiBpdCBkb2Vzbid0XG4gICAgICAgKiAgICAgICAgICAgICAgICAgICBhbHJlYWR5IGV4aXN0LlxuICAgICAgICogQHBhcmFtIHNldCAgICAgICAgVGhlIHNldCBpbnN0YW5jZSB0byBjaGVjayBvciBhZGQgdG8uXG4gICAgICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGVuIHNob3VsZEFkZCBpcyB0cnVlLCB0aGlzIHdpbGwgcmV0dXJuIHRydWUgd2hlbiBhIG5ld1xuICAgICAgICogICAgICAgICAgICAgICAgICAgaXRlbSB3YXMgYWRkZWQgb3RoZXJ3aXNlIGZhbHNlLiBXaGVuIHNob3VsZEFkZCBpcyBmYWxzZSxcbiAgICAgICAqICAgICAgICAgICAgICAgICAgIHRoaXMgd2lsbCByZXR1cm4gdHJ1ZSBpZiB0aGUgaXRlbSBhbHJlYWR5IGV4aXN0cywgb3RoZXJ3aXNlXG4gICAgICAgKiAgICAgICAgICAgICAgICAgICBmYWxzZS5cbiAgICAgICAqL1xuICAgIC8vIGRpc3Rpbmd1aXNoIGJldHdlZW4gKzAgYW5kIC0wXG4gICAgLy8gdGhlc2UgdHlwZXMgY2FuIGFsbCB1dGlsaXNlIFNldFxuICAgIC8vIHNldC5faXRlbXNbJ2Jvb2xlYW4nXSBob2xkcyBhIHR3byBlbGVtZW50IGFycmF5XG4gICAgLy8gcmVwcmVzZW50aW5nIFsgZmFsc2VFeGlzdHMsIHRydWVFeGlzdHMgXVxuICAgIC8vIGNvbXBhcmUgZnVuY3Rpb25zIGZvciByZWZlcmVuY2UgZXF1YWxpdHlcbiAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgLy8gcmVkdWNlIHRoZSBzZWFyY2ggc2l6ZSBvZiBoZXRlcm9nZW5lb3VzIHNldHMgYnkgY3JlYXRpbmcgYnVja2V0c1xuICAgIC8vIGZvciBlYWNoIHR5cGUuXG4gICAgLy8gc2NhbiB0aHJvdWdoIGFsbCBwcmV2aW91c2x5IGFwcGxpZWQgaXRlbXNcbiAgICB2YXIgX1NldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gX1NldCgpIHtcbiAgICAgICAgICAgIC8qIGdsb2JhbHMgU2V0ICovXG4gICAgICAgICAgICB0aGlzLl9uYXRpdmVTZXQgPSB0eXBlb2YgU2V0ID09PSAnZnVuY3Rpb24nID8gbmV3IFNldCgpIDogbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2l0ZW1zID0ge307XG4gICAgICAgIH1cbiAgICAgICAgX1NldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBoYXNPckFkZChpdGVtLCB0cnVlLCB0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgX1NldC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBoYXNPckFkZChpdGVtLCBmYWxzZSwgdGhpcyk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICogQ29tYmluZXMgdGhlIGxvZ2ljIGZvciBjaGVja2luZyB3aGV0aGVyIGFuIGl0ZW0gaXMgYSBtZW1iZXIgb2YgdGhlIHNldCBhbmRcbiAgICAgICAqIGZvciBhZGRpbmcgYSBuZXcgaXRlbSB0byB0aGUgc2V0LlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSBpdGVtICAgICAgIFRoZSBpdGVtIHRvIGNoZWNrIG9yIGFkZCB0byB0aGUgU2V0IGluc3RhbmNlLlxuICAgICAgICogQHBhcmFtIHNob3VsZEFkZCAgSWYgdHJ1ZSwgdGhlIGl0ZW0gd2lsbCBiZSBhZGRlZCB0byB0aGUgc2V0IGlmIGl0IGRvZXNuJ3RcbiAgICAgICAqICAgICAgICAgICAgICAgICAgIGFscmVhZHkgZXhpc3QuXG4gICAgICAgKiBAcGFyYW0gc2V0ICAgICAgICBUaGUgc2V0IGluc3RhbmNlIHRvIGNoZWNrIG9yIGFkZCB0by5cbiAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZW4gc2hvdWxkQWRkIGlzIHRydWUsIHRoaXMgd2lsbCByZXR1cm4gdHJ1ZSB3aGVuIGEgbmV3XG4gICAgICAgKiAgICAgICAgICAgICAgICAgICBpdGVtIHdhcyBhZGRlZCBvdGhlcndpc2UgZmFsc2UuIFdoZW4gc2hvdWxkQWRkIGlzIGZhbHNlLFxuICAgICAgICogICAgICAgICAgICAgICAgICAgdGhpcyB3aWxsIHJldHVybiB0cnVlIGlmIHRoZSBpdGVtIGFscmVhZHkgZXhpc3RzLCBvdGhlcndpc2VcbiAgICAgICAqICAgICAgICAgICAgICAgICAgIGZhbHNlLlxuICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGhhc09yQWRkKGl0ZW0sIHNob3VsZEFkZCwgc2V0KSB7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBpdGVtO1xuICAgICAgICAgICAgdmFyIHByZXZTaXplLCBuZXdTaXplO1xuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICAvLyBkaXN0aW5ndWlzaCBiZXR3ZWVuICswIGFuZCAtMFxuICAgICAgICAgICAgICAgIGlmIChpdGVtID09PSAwICYmICFzZXQuX2l0ZW1zWyctMCddICYmIDEgLyBpdGVtID09PSAtSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1snLTAnXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gdGhlc2UgdHlwZXMgY2FuIGFsbCB1dGlsaXNlIFNldFxuICAgICAgICAgICAgICAgIGlmIChzZXQuX25hdGl2ZVNldCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2U2l6ZSA9IHNldC5fbmF0aXZlU2V0LnNpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQuX25hdGl2ZVNldC5hZGQoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdTaXplID0gc2V0Ll9uYXRpdmVTZXQuc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdTaXplID4gcHJldlNpemU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2V0Ll9uYXRpdmVTZXQuaGFzKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodHlwZSBpbiBzZXQuX2l0ZW1zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQuX2l0ZW1zW3R5cGVdW2l0ZW1dID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbSBpbiBzZXQuX2l0ZW1zW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQuX2l0ZW1zW3R5cGVdW2l0ZW1dID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAvLyBzZXQuX2l0ZW1zWydib29sZWFuJ10gaG9sZHMgYSB0d28gZWxlbWVudCBhcnJheVxuICAgICAgICAgICAgICAgIC8vIHJlcHJlc2VudGluZyBbIGZhbHNlRXhpc3RzLCB0cnVlRXhpc3RzIF1cbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbiBzZXQuX2l0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiSWR4ID0gaXRlbSA/IDEgOiAwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0Ll9pdGVtc1t0eXBlXVtiSWR4XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1t0eXBlXVtiSWR4XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9pdGVtc1t0eXBlXSA9IGl0ZW0gPyBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXSA6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIC8vIGNvbXBhcmUgZnVuY3Rpb25zIGZvciByZWZlcmVuY2UgZXF1YWxpdHlcbiAgICAgICAgICAgICAgICBpZiAoc2V0Ll9uYXRpdmVTZXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlNpemUgPSBzZXQuX25hdGl2ZVNldC5zaXplO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Ll9uYXRpdmVTZXQuYWRkKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U2l6ZSA9IHNldC5fbmF0aXZlU2V0LnNpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3U2l6ZSA+IHByZXZTaXplO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldC5fbmF0aXZlU2V0LmhhcyhpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHR5cGUgaW4gc2V0Ll9pdGVtcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXQuX2l0ZW1zW3R5cGVdID0gW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIV9jb250YWlucyhpdGVtLCBzZXQuX2l0ZW1zW3R5cGVdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV0ucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICFzaG91bGRBZGQ7XG4gICAgICAgICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICAgICAgICAgIGlmIChzZXQuX2l0ZW1zW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRBZGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNldC5faXRlbXNbJ251bGwnXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbJ251bGwnXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhc2hvdWxkQWRkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gcmVkdWNlIHRoZSBzZWFyY2ggc2l6ZSBvZiBoZXRlcm9nZW5lb3VzIHNldHMgYnkgY3JlYXRpbmcgYnVja2V0c1xuICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIHR5cGUuXG4gICAgICAgICAgICAgICAgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpdGVtKTtcbiAgICAgICAgICAgICAgICBpZiAoISh0eXBlIGluIHNldC5faXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldC5faXRlbXNbdHlwZV0gPSBbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gc2NhbiB0aHJvdWdoIGFsbCBwcmV2aW91c2x5IGFwcGxpZWQgaXRlbXNcbiAgICAgICAgICAgICAgICBpZiAoIV9jb250YWlucyhpdGVtLCBzZXQuX2l0ZW1zW3R5cGVdKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQuX2l0ZW1zW3R5cGVdLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNob3VsZEFkZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICFzaG91bGRBZGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9TZXQ7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB3cmFwcGluZyBjYWxscyB0byB0aGUgdHdvIGZ1bmN0aW9ucyBpbiBhbiBgJiZgIG9wZXJhdGlvbixcbiAgICAgKiByZXR1cm5pbmcgdGhlIHJlc3VsdCBvZiB0aGUgZmlyc3QgZnVuY3Rpb24gaWYgaXQgaXMgZmFsc2UteSBhbmQgdGhlIHJlc3VsdFxuICAgICAqIG9mIHRoZSBzZWNvbmQgZnVuY3Rpb24gb3RoZXJ3aXNlLiBOb3RlIHRoYXQgdGhpcyBpcyBzaG9ydC1jaXJjdWl0ZWQsXG4gICAgICogbWVhbmluZyB0aGF0IHRoZSBzZWNvbmQgZnVuY3Rpb24gd2lsbCBub3QgYmUgaW52b2tlZCBpZiB0aGUgZmlyc3QgcmV0dXJucyBhXG4gICAgICogZmFsc2UteSB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEluIGFkZGl0aW9uIHRvIGZ1bmN0aW9ucywgYFIuYm90aGAgYWxzbyBhY2NlcHRzIGFueSBmYW50YXN5LWxhbmQgY29tcGF0aWJsZVxuICAgICAqIGFwcGxpY2F0aXZlIGZ1bmN0b3IuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnICgqLi4uIC0+IEJvb2xlYW4pIC0+ICgqLi4uIC0+IEJvb2xlYW4pIC0+ICgqLi4uIC0+IEJvb2xlYW4pXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZiBhIHByZWRpY2F0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGcgYW5vdGhlciBwcmVkaWNhdGVcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGFwcGxpZXMgaXRzIGFyZ3VtZW50cyB0byBgZmAgYW5kIGBnYCBhbmQgYCYmYHMgdGhlaXIgb3V0cHV0cyB0b2dldGhlci5cbiAgICAgKiBAc2VlIFIuYW5kXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGd0MTAgPSB4ID0+IHggPiAxMDtcbiAgICAgKiAgICAgIHZhciBldmVuID0geCA9PiB4ICUgMiA9PT0gMDtcbiAgICAgKiAgICAgIHZhciBmID0gUi5ib3RoKGd0MTAsIGV2ZW4pO1xuICAgICAqICAgICAgZigxMDApOyAvLz0+IHRydWVcbiAgICAgKiAgICAgIGYoMTAxKTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciBib3RoID0gX2N1cnJ5MihmdW5jdGlvbiBib3RoKGYsIGcpIHtcbiAgICAgICAgcmV0dXJuIF9pc0Z1bmN0aW9uKGYpID8gZnVuY3Rpb24gX2JvdGgoKSB7XG4gICAgICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpICYmIGcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSA6IGxpZnQoYW5kKShmLCBnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgZnVuY3Rpb24gYGZgIGFuZCByZXR1cm5zIGEgZnVuY3Rpb24gYGdgIHN1Y2ggdGhhdDpcbiAgICAgKlxuICAgICAqICAgLSBhcHBseWluZyBgZ2AgdG8gemVybyBvciBtb3JlIGFyZ3VtZW50cyB3aWxsIGdpdmUgX190cnVlX18gaWYgYXBwbHlpbmdcbiAgICAgKiAgICAgdGhlIHNhbWUgYXJndW1lbnRzIHRvIGBmYCBnaXZlcyBhIGxvZ2ljYWwgX19mYWxzZV9fIHZhbHVlOyBhbmRcbiAgICAgKlxuICAgICAqICAgLSBhcHBseWluZyBgZ2AgdG8gemVybyBvciBtb3JlIGFyZ3VtZW50cyB3aWxsIGdpdmUgX19mYWxzZV9fIGlmIGFwcGx5aW5nXG4gICAgICogICAgIHRoZSBzYW1lIGFyZ3VtZW50cyB0byBgZmAgZ2l2ZXMgYSBsb2dpY2FsIF9fdHJ1ZV9fIHZhbHVlLlxuICAgICAqXG4gICAgICogYFIuY29tcGxlbWVudGAgd2lsbCB3b3JrIG9uIGFsbCBvdGhlciBmdW5jdG9ycyBhcyB3ZWxsLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xMi4wXG4gICAgICogQGNhdGVnb3J5IExvZ2ljXG4gICAgICogQHNpZyAoKi4uLiAtPiAqKSAtPiAoKi4uLiAtPiBCb29sZWFuKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICAgKiBAc2VlIFIubm90XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGlzRXZlbiA9IG4gPT4gbiAlIDIgPT09IDA7XG4gICAgICogICAgICB2YXIgaXNPZGQgPSBSLmNvbXBsZW1lbnQoaXNFdmVuKTtcbiAgICAgKiAgICAgIGlzT2RkKDIxKTsgLy89PiB0cnVlXG4gICAgICogICAgICBpc09kZCg0Mik7IC8vPT4gZmFsc2VcbiAgICAgKi9cbiAgICB2YXIgY29tcGxlbWVudCA9IGxpZnQobm90KTtcblxuICAgIC8qKlxuICAgICAqIEEgZnVuY3Rpb24gd3JhcHBpbmcgY2FsbHMgdG8gdGhlIHR3byBmdW5jdGlvbnMgaW4gYW4gYHx8YCBvcGVyYXRpb24sXG4gICAgICogcmV0dXJuaW5nIHRoZSByZXN1bHQgb2YgdGhlIGZpcnN0IGZ1bmN0aW9uIGlmIGl0IGlzIHRydXRoLXkgYW5kIHRoZSByZXN1bHRcbiAgICAgKiBvZiB0aGUgc2Vjb25kIGZ1bmN0aW9uIG90aGVyd2lzZS4gTm90ZSB0aGF0IHRoaXMgaXMgc2hvcnQtY2lyY3VpdGVkLFxuICAgICAqIG1lYW5pbmcgdGhhdCB0aGUgc2Vjb25kIGZ1bmN0aW9uIHdpbGwgbm90IGJlIGludm9rZWQgaWYgdGhlIGZpcnN0IHJldHVybnMgYVxuICAgICAqIHRydXRoLXkgdmFsdWUuXG4gICAgICpcbiAgICAgKiBJbiBhZGRpdGlvbiB0byBmdW5jdGlvbnMsIGBSLmVpdGhlcmAgYWxzbyBhY2NlcHRzIGFueSBmYW50YXN5LWxhbmQgY29tcGF0aWJsZVxuICAgICAqIGFwcGxpY2F0aXZlIGZ1bmN0b3IuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgTG9naWNcbiAgICAgKiBAc2lnICgqLi4uIC0+IEJvb2xlYW4pIC0+ICgqLi4uIC0+IEJvb2xlYW4pIC0+ICgqLi4uIC0+IEJvb2xlYW4pXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZiBhIHByZWRpY2F0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGcgYW5vdGhlciBwcmVkaWNhdGVcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGFwcGxpZXMgaXRzIGFyZ3VtZW50cyB0byBgZmAgYW5kIGBnYCBhbmQgYHx8YHMgdGhlaXIgb3V0cHV0cyB0b2dldGhlci5cbiAgICAgKiBAc2VlIFIub3JcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZ3QxMCA9IHggPT4geCA+IDEwO1xuICAgICAqICAgICAgdmFyIGV2ZW4gPSB4ID0+IHggJSAyID09PSAwO1xuICAgICAqICAgICAgdmFyIGYgPSBSLmVpdGhlcihndDEwLCBldmVuKTtcbiAgICAgKiAgICAgIGYoMTAxKTsgLy89PiB0cnVlXG4gICAgICogICAgICBmKDgpOyAvLz0+IHRydWVcbiAgICAgKi9cbiAgICB2YXIgZWl0aGVyID0gX2N1cnJ5MihmdW5jdGlvbiBlaXRoZXIoZiwgZykge1xuICAgICAgICByZXR1cm4gX2lzRnVuY3Rpb24oZikgPyBmdW5jdGlvbiBfZWl0aGVyKCkge1xuICAgICAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCBnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gOiBsaWZ0KG9yKShmLCBnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFR1cm5zIGEgbmFtZWQgbWV0aG9kIHdpdGggYSBzcGVjaWZpZWQgYXJpdHkgaW50byBhIGZ1bmN0aW9uIHRoYXQgY2FuIGJlXG4gICAgICogY2FsbGVkIGRpcmVjdGx5IHN1cHBsaWVkIHdpdGggYXJndW1lbnRzIGFuZCBhIHRhcmdldCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBUaGUgcmV0dXJuZWQgZnVuY3Rpb24gaXMgY3VycmllZCBhbmQgYWNjZXB0cyBgYXJpdHkgKyAxYCBwYXJhbWV0ZXJzIHdoZXJlXG4gICAgICogdGhlIGZpbmFsIHBhcmFtZXRlciBpcyB0aGUgdGFyZ2V0IG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyBOdW1iZXIgLT4gU3RyaW5nIC0+IChhIC0+IGIgLT4gLi4uIC0+IG4gLT4gT2JqZWN0IC0+ICopXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGFyaXR5IE51bWJlciBvZiBhcmd1bWVudHMgdGhlIHJldHVybmVkIGZ1bmN0aW9uIHNob3VsZCB0YWtlXG4gICAgICogICAgICAgIGJlZm9yZSB0aGUgdGFyZ2V0IG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kIE5hbWUgb2YgdGhlIG1ldGhvZCB0byBjYWxsLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBjdXJyaWVkIGZ1bmN0aW9uLlxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzbGljZUZyb20gPSBSLmludm9rZXIoMSwgJ3NsaWNlJyk7XG4gICAgICogICAgICBzbGljZUZyb20oNiwgJ2FiY2RlZmdoaWprbG0nKTsgLy89PiAnZ2hpamtsbSdcbiAgICAgKiAgICAgIHZhciBzbGljZUZyb202ID0gUi5pbnZva2VyKDIsICdzbGljZScpKDYpO1xuICAgICAqICAgICAgc2xpY2VGcm9tNig4LCAnYWJjZGVmZ2hpamtsbScpOyAvLz0+ICdnaCdcbiAgICAgKi9cbiAgICB2YXIgaW52b2tlciA9IF9jdXJyeTIoZnVuY3Rpb24gaW52b2tlcihhcml0eSwgbWV0aG9kKSB7XG4gICAgICAgIHJldHVybiBjdXJyeU4oYXJpdHkgKyAxLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gYXJndW1lbnRzW2FyaXR5XTtcbiAgICAgICAgICAgIGlmICh0YXJnZXQgIT0gbnVsbCAmJiBpcyhGdW5jdGlvbiwgdGFyZ2V0W21ldGhvZF0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFttZXRob2RdLmFwcGx5KHRhcmdldCwgX3NsaWNlKGFyZ3VtZW50cywgMCwgYXJpdHkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IodG9TdHJpbmcodGFyZ2V0KSArICcgZG9lcyBub3QgaGF2ZSBhIG1ldGhvZCBuYW1lZCBcIicgKyBtZXRob2QgKyAnXCInKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc3RyaW5nIG1hZGUgYnkgaW5zZXJ0aW5nIHRoZSBgc2VwYXJhdG9yYCBiZXR3ZWVuIGVhY2ggZWxlbWVudCBhbmRcbiAgICAgKiBjb25jYXRlbmF0aW5nIGFsbCB0aGUgZWxlbWVudHMgaW50byBhIHNpbmdsZSBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBMaXN0XG4gICAgICogQHNpZyBTdHJpbmcgLT4gW2FdIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfFN0cmluZ30gc2VwYXJhdG9yIFRoZSBzdHJpbmcgdXNlZCB0byBzZXBhcmF0ZSB0aGUgZWxlbWVudHMuXG4gICAgICogQHBhcmFtIHtBcnJheX0geHMgVGhlIGVsZW1lbnRzIHRvIGpvaW4gaW50byBhIHN0cmluZy5cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIG1hZGUgYnkgY29uY2F0ZW5hdGluZyBgeHNgIHdpdGggYHNlcGFyYXRvcmAuXG4gICAgICogQHNlZSBSLnNwbGl0XG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIHNwYWNlciA9IFIuam9pbignICcpO1xuICAgICAqICAgICAgc3BhY2VyKFsnYScsIDIsIDMuNF0pOyAgIC8vPT4gJ2EgMiAzLjQnXG4gICAgICogICAgICBSLmpvaW4oJ3wnLCBbMSwgMiwgM10pOyAgICAvLz0+ICcxfDJ8MydcbiAgICAgKi9cbiAgICB2YXIgam9pbiA9IGludm9rZXIoMSwgJ2pvaW4nKTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCwgd2hlbiBpbnZva2VkLCBjYWNoZXMgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGBmbmBcbiAgICAgKiBmb3IgYSBnaXZlbiBhcmd1bWVudCBzZXQgYW5kIHJldHVybnMgdGhlIHJlc3VsdC4gU3Vic2VxdWVudCBjYWxscyB0byB0aGVcbiAgICAgKiBtZW1vaXplZCBgZm5gIHdpdGggdGhlIHNhbWUgYXJndW1lbnQgc2V0IHdpbGwgbm90IHJlc3VsdCBpbiBhbiBhZGRpdGlvbmFsXG4gICAgICogY2FsbCB0byBgZm5gOyBpbnN0ZWFkLCB0aGUgY2FjaGVkIHJlc3VsdCBmb3IgdGhhdCBzZXQgb2YgYXJndW1lbnRzIHdpbGwgYmVcbiAgICAgKiByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gICAgICogQHNpZyAoKi4uLiAtPiBhKSAtPiAoKi4uLiAtPiBhKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBtZW1vaXplLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBNZW1vaXplZCB2ZXJzaW9uIG9mIGBmbmAuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgKiAgICAgIHZhciBmYWN0b3JpYWwgPSBSLm1lbW9pemUobiA9PiB7XG4gICAgICogICAgICAgIGNvdW50ICs9IDE7XG4gICAgICogICAgICAgIHJldHVybiBSLnByb2R1Y3QoUi5yYW5nZSgxLCBuICsgMSkpO1xuICAgICAqICAgICAgfSk7XG4gICAgICogICAgICBmYWN0b3JpYWwoNSk7IC8vPT4gMTIwXG4gICAgICogICAgICBmYWN0b3JpYWwoNSk7IC8vPT4gMTIwXG4gICAgICogICAgICBmYWN0b3JpYWwoNSk7IC8vPT4gMTIwXG4gICAgICogICAgICBjb3VudDsgLy89PiAxXG4gICAgICovXG4gICAgdmFyIG1lbW9pemUgPSBfY3VycnkxKGZ1bmN0aW9uIG1lbW9pemUoZm4pIHtcbiAgICAgICAgdmFyIGNhY2hlID0ge307XG4gICAgICAgIHJldHVybiBfYXJpdHkoZm4ubGVuZ3RoLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gdG9TdHJpbmcoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGlmICghX2hhcyhrZXksIGNhY2hlKSkge1xuICAgICAgICAgICAgICAgIGNhY2hlW2tleV0gPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlW2tleV07XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogU3BsaXRzIGEgc3RyaW5nIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncyBiYXNlZCBvbiB0aGUgZ2l2ZW5cbiAgICAgKiBzZXBhcmF0b3IuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEuMFxuICAgICAqIEBjYXRlZ29yeSBTdHJpbmdcbiAgICAgKiBAc2lnIChTdHJpbmcgfCBSZWdFeHApIC0+IFN0cmluZyAtPiBbU3RyaW5nXVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gc2VwIFRoZSBwYXR0ZXJuLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBzZXBhcmF0ZSBpbnRvIGFuIGFycmF5LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgYXJyYXkgb2Ygc3RyaW5ncyBmcm9tIGBzdHJgIHNlcGFyYXRlZCBieSBgc3RyYC5cbiAgICAgKiBAc2VlIFIuam9pblxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBwYXRoQ29tcG9uZW50cyA9IFIuc3BsaXQoJy8nKTtcbiAgICAgKiAgICAgIFIudGFpbChwYXRoQ29tcG9uZW50cygnL3Vzci9sb2NhbC9iaW4vbm9kZScpKTsgLy89PiBbJ3VzcicsICdsb2NhbCcsICdiaW4nLCAnbm9kZSddXG4gICAgICpcbiAgICAgKiAgICAgIFIuc3BsaXQoJy4nLCAnYS5iLmMueHl6LmQnKTsgLy89PiBbJ2EnLCAnYicsICdjJywgJ3h5eicsICdkJ11cbiAgICAgKi9cbiAgICB2YXIgc3BsaXQgPSBpbnZva2VyKDEsICdzcGxpdCcpO1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgZ2l2ZW4gc3RyaW5nIG1hdGNoZXMgYSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjEyLjBcbiAgICAgKiBAY2F0ZWdvcnkgU3RyaW5nXG4gICAgICogQHNpZyBSZWdFeHAgLT4gU3RyaW5nIC0+IEJvb2xlYW5cbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gcGF0dGVyblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBzZWUgUi5tYXRjaFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudGVzdCgvXngvLCAneHl6Jyk7IC8vPT4gdHJ1ZVxuICAgICAqICAgICAgUi50ZXN0KC9eeS8sICd4eXonKTsgLy89PiBmYWxzZVxuICAgICAqL1xuICAgIHZhciB0ZXN0ID0gX2N1cnJ5MihmdW5jdGlvbiB0ZXN0KHBhdHRlcm4sIHN0cikge1xuICAgICAgICBpZiAoIV9pc1JlZ0V4cChwYXR0ZXJuKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXFx1MjAxOHRlc3RcXHUyMDE5IHJlcXVpcmVzIGEgdmFsdWUgb2YgdHlwZSBSZWdFeHAgYXMgaXRzIGZpcnN0IGFyZ3VtZW50OyByZWNlaXZlZCAnICsgdG9TdHJpbmcocGF0dGVybikpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfY2xvbmVSZWdFeHAocGF0dGVybikudGVzdChzdHIpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGxvd2VyIGNhc2UgdmVyc2lvbiBvZiBhIHN0cmluZy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuOS4wXG4gICAgICogQGNhdGVnb3J5IFN0cmluZ1xuICAgICAqIEBzaWcgU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBsb3dlciBjYXNlLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGxvd2VyIGNhc2UgdmVyc2lvbiBvZiBgc3RyYC5cbiAgICAgKiBAc2VlIFIudG9VcHBlclxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIudG9Mb3dlcignWFlaJyk7IC8vPT4gJ3h5eidcbiAgICAgKi9cbiAgICB2YXIgdG9Mb3dlciA9IGludm9rZXIoMCwgJ3RvTG93ZXJDYXNlJyk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdXBwZXIgY2FzZSB2ZXJzaW9uIG9mIGEgc3RyaW5nLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC45LjBcbiAgICAgKiBAY2F0ZWdvcnkgU3RyaW5nXG4gICAgICogQHNpZyBTdHJpbmcgLT4gU3RyaW5nXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIHVwcGVyIGNhc2UuXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgdXBwZXIgY2FzZSB2ZXJzaW9uIG9mIGBzdHJgLlxuICAgICAqIEBzZWUgUi50b0xvd2VyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi50b1VwcGVyKCdhYmMnKTsgLy89PiAnQUJDJ1xuICAgICAqL1xuICAgIHZhciB0b1VwcGVyID0gaW52b2tlcigwLCAndG9VcHBlckNhc2UnKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIG9ubHkgb25lIGNvcHkgb2YgZWFjaCBlbGVtZW50IGluIHRoZSBvcmlnaW5hbFxuICAgICAqIGxpc3QsIGJhc2VkIHVwb24gdGhlIHZhbHVlIHJldHVybmVkIGJ5IGFwcGx5aW5nIHRoZSBzdXBwbGllZCBmdW5jdGlvbiB0b1xuICAgICAqIGVhY2ggbGlzdCBlbGVtZW50LiBQcmVmZXJzIHRoZSBmaXJzdCBpdGVtIGlmIHRoZSBzdXBwbGllZCBmdW5jdGlvbiBwcm9kdWNlc1xuICAgICAqIHRoZSBzYW1lIHZhbHVlIG9uIHR3byBpdGVtcy4gYFIuZXF1YWxzYCBpcyB1c2VkIGZvciBjb21wYXJpc29uLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xNi4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIChhIC0+IGIpIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBBIGZ1bmN0aW9uIHVzZWQgdG8gcHJvZHVjZSBhIHZhbHVlIHRvIHVzZSBkdXJpbmcgY29tcGFyaXNvbnMuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgYXJyYXkgdG8gY29uc2lkZXIuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBsaXN0IG9mIHVuaXF1ZSBpdGVtcy5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLnVuaXFCeShNYXRoLmFicywgWy0xLCAtNSwgMiwgMTAsIDEsIDJdKTsgLy89PiBbLTEsIC01LCAyLCAxMF1cbiAgICAgKi9cbiAgICB2YXIgdW5pcUJ5ID0gX2N1cnJ5MihmdW5jdGlvbiB1bmlxQnkoZm4sIGxpc3QpIHtcbiAgICAgICAgdmFyIHNldCA9IG5ldyBfU2V0KCk7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgIHZhciBhcHBsaWVkSXRlbSwgaXRlbTtcbiAgICAgICAgd2hpbGUgKGlkeCA8IGxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpZHhdO1xuICAgICAgICAgICAgYXBwbGllZEl0ZW0gPSBmbihpdGVtKTtcbiAgICAgICAgICAgIGlmIChzZXQuYWRkKGFwcGxpZWRJdGVtKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWR4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHJlc3VsdCBvZiBjb25jYXRlbmF0aW5nIHRoZSBnaXZlbiBsaXN0cyBvciBzdHJpbmdzLlxuICAgICAqXG4gICAgICogRGlzcGF0Y2hlcyB0byB0aGUgYGNvbmNhdGAgbWV0aG9kIG9mIHRoZSBmaXJzdCBhcmd1bWVudCwgaWYgcHJlc2VudC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IExpc3RcbiAgICAgKiBAc2lnIFthXSAtPiBbYV0gLT4gW2FdXG4gICAgICogQHNpZyBTdHJpbmcgLT4gU3RyaW5nIC0+IFN0cmluZ1xuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBhXG4gICAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IGJcbiAgICAgKiBAcmV0dXJuIHtBcnJheXxTdHJpbmd9XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICBSLmNvbmNhdChbXSwgW10pOyAvLz0+IFtdXG4gICAgICogICAgICBSLmNvbmNhdChbNCwgNSwgNl0sIFsxLCAyLCAzXSk7IC8vPT4gWzQsIDUsIDYsIDEsIDIsIDNdXG4gICAgICogICAgICBSLmNvbmNhdCgnQUJDJywgJ0RFRicpOyAvLyAnQUJDREVGJ1xuICAgICAqL1xuICAgIHZhciBjb25jYXQgPSBmbGlwKGludm9rZXIoMSwgJ2NvbmNhdCcpKTtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSBzZXQgKGkuZS4gbm8gZHVwbGljYXRlcykgb2YgYWxsIGVsZW1lbnRzIGNvbnRhaW5lZCBpbiB0aGUgZmlyc3Qgb3JcbiAgICAgKiBzZWNvbmQgbGlzdCwgYnV0IG5vdCBib3RoLlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xOS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBbKl0gLT4gWypdIC0+IFsqXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSBmaXJzdCBsaXN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBzZWNvbmQgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGVsZW1lbnRzIGluIGBsaXN0MWAgb3IgYGxpc3QyYCwgYnV0IG5vdCBib3RoLlxuICAgICAqIEBzZWUgUi5zeW1tZXRyaWNEaWZmZXJlbmNlV2l0aFxuICAgICAqIEBleGFtcGxlXG4gICAgICpcbiAgICAgKiAgICAgIFIuc3ltbWV0cmljRGlmZmVyZW5jZShbMSwyLDMsNF0sIFs3LDYsNSw0LDNdKTsgLy89PiBbMSwyLDcsNiw1XVxuICAgICAqICAgICAgUi5zeW1tZXRyaWNEaWZmZXJlbmNlKFs3LDYsNSw0LDNdLCBbMSwyLDMsNF0pOyAvLz0+IFs3LDYsNSwxLDJdXG4gICAgICovXG4gICAgdmFyIHN5bW1ldHJpY0RpZmZlcmVuY2UgPSBfY3VycnkyKGZ1bmN0aW9uIHN5bW1ldHJpY0RpZmZlcmVuY2UobGlzdDEsIGxpc3QyKSB7XG4gICAgICAgIHJldHVybiBjb25jYXQoZGlmZmVyZW5jZShsaXN0MSwgbGlzdDIpLCBkaWZmZXJlbmNlKGxpc3QyLCBsaXN0MSkpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIHNldCAoaS5lLiBubyBkdXBsaWNhdGVzKSBvZiBhbGwgZWxlbWVudHMgY29udGFpbmVkIGluIHRoZSBmaXJzdCBvclxuICAgICAqIHNlY29uZCBsaXN0LCBidXQgbm90IGJvdGguIER1cGxpY2F0aW9uIGlzIGRldGVybWluZWQgYWNjb3JkaW5nIHRvIHRoZSB2YWx1ZVxuICAgICAqIHJldHVybmVkIGJ5IGFwcGx5aW5nIHRoZSBzdXBwbGllZCBwcmVkaWNhdGUgdG8gdHdvIGxpc3QgZWxlbWVudHMuXG4gICAgICpcbiAgICAgKiBAZnVuY1xuICAgICAqIEBtZW1iZXJPZiBSXG4gICAgICogQHNpbmNlIHYwLjE5LjBcbiAgICAgKiBAY2F0ZWdvcnkgUmVsYXRpb25cbiAgICAgKiBAc2lnIChhIC0+IGEgLT4gQm9vbGVhbikgLT4gW2FdIC0+IFthXSAtPiBbYV1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkIEEgcHJlZGljYXRlIHVzZWQgdG8gdGVzdCB3aGV0aGVyIHR3byBpdGVtcyBhcmUgZXF1YWwuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDEgVGhlIGZpcnN0IGxpc3QuXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGlzdDIgVGhlIHNlY29uZCBsaXN0LlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgZWxlbWVudHMgaW4gYGxpc3QxYCBvciBgbGlzdDJgLCBidXQgbm90IGJvdGguXG4gICAgICogQHNlZSBSLnN5bW1ldHJpY0RpZmZlcmVuY2VcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogICAgICB2YXIgZXFBID0gUi5lcUJ5KFIucHJvcCgnYScpKTtcbiAgICAgKiAgICAgIHZhciBsMSA9IFt7YTogMX0sIHthOiAyfSwge2E6IDN9LCB7YTogNH1dO1xuICAgICAqICAgICAgdmFyIGwyID0gW3thOiAzfSwge2E6IDR9LCB7YTogNX0sIHthOiA2fV07XG4gICAgICogICAgICBSLnN5bW1ldHJpY0RpZmZlcmVuY2VXaXRoKGVxQSwgbDEsIGwyKTsgLy89PiBbe2E6IDF9LCB7YTogMn0sIHthOiA1fSwge2E6IDZ9XVxuICAgICAqL1xuICAgIHZhciBzeW1tZXRyaWNEaWZmZXJlbmNlV2l0aCA9IF9jdXJyeTMoZnVuY3Rpb24gc3ltbWV0cmljRGlmZmVyZW5jZVdpdGgocHJlZCwgbGlzdDEsIGxpc3QyKSB7XG4gICAgICAgIHJldHVybiBjb25jYXQoZGlmZmVyZW5jZVdpdGgocHJlZCwgbGlzdDEsIGxpc3QyKSwgZGlmZmVyZW5jZVdpdGgocHJlZCwgbGlzdDIsIGxpc3QxKSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgbmV3IGxpc3QgY29udGFpbmluZyBvbmx5IG9uZSBjb3B5IG9mIGVhY2ggZWxlbWVudCBpbiB0aGUgb3JpZ2luYWxcbiAgICAgKiBsaXN0LiBgUi5lcXVhbHNgIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGVxdWFsaXR5LlxuICAgICAqXG4gICAgICogQGZ1bmNcbiAgICAgKiBAbWVtYmVyT2YgUlxuICAgICAqIEBzaW5jZSB2MC4xLjBcbiAgICAgKiBAY2F0ZWdvcnkgTGlzdFxuICAgICAqIEBzaWcgW2FdIC0+IFthXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSBUaGUgbGlzdCBvZiB1bmlxdWUgaXRlbXMuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi51bmlxKFsxLCAxLCAyLCAxXSk7IC8vPT4gWzEsIDJdXG4gICAgICogICAgICBSLnVuaXEoWzEsICcxJ10pOyAgICAgLy89PiBbMSwgJzEnXVxuICAgICAqICAgICAgUi51bmlxKFtbNDJdLCBbNDJdXSk7IC8vPT4gW1s0Ml1dXG4gICAgICovXG4gICAgdmFyIHVuaXEgPSB1bmlxQnkoaWRlbnRpdHkpO1xuXG4gICAgLyoqXG4gICAgICogQ29tYmluZXMgdHdvIGxpc3RzIGludG8gYSBzZXQgKGkuZS4gbm8gZHVwbGljYXRlcykgY29tcG9zZWQgb2YgdGhvc2VcbiAgICAgKiBlbGVtZW50cyBjb21tb24gdG8gYm90aCBsaXN0cy5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBbKl0gLT4gWypdIC0+IFsqXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSBmaXJzdCBsaXN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBzZWNvbmQgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGxpc3Qgb2YgZWxlbWVudHMgZm91bmQgaW4gYm90aCBgbGlzdDFgIGFuZCBgbGlzdDJgLlxuICAgICAqIEBzZWUgUi5pbnRlcnNlY3Rpb25XaXRoXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi5pbnRlcnNlY3Rpb24oWzEsMiwzLDRdLCBbNyw2LDUsNCwzXSk7IC8vPT4gWzQsIDNdXG4gICAgICovXG4gICAgdmFyIGludGVyc2VjdGlvbiA9IF9jdXJyeTIoZnVuY3Rpb24gaW50ZXJzZWN0aW9uKGxpc3QxLCBsaXN0Mikge1xuICAgICAgICB2YXIgbG9va3VwTGlzdCwgZmlsdGVyZWRMaXN0O1xuICAgICAgICBpZiAobGlzdDEubGVuZ3RoID4gbGlzdDIubGVuZ3RoKSB7XG4gICAgICAgICAgICBsb29rdXBMaXN0ID0gbGlzdDE7XG4gICAgICAgICAgICBmaWx0ZXJlZExpc3QgPSBsaXN0MjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvb2t1cExpc3QgPSBsaXN0MjtcbiAgICAgICAgICAgIGZpbHRlcmVkTGlzdCA9IGxpc3QxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmlxKF9maWx0ZXIoZmxpcChfY29udGFpbnMpKGxvb2t1cExpc3QpLCBmaWx0ZXJlZExpc3QpKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIENvbWJpbmVzIHR3byBsaXN0cyBpbnRvIGEgc2V0IChpLmUuIG5vIGR1cGxpY2F0ZXMpIGNvbXBvc2VkIG9mIHRoZSBlbGVtZW50c1xuICAgICAqIG9mIGVhY2ggbGlzdC5cbiAgICAgKlxuICAgICAqIEBmdW5jXG4gICAgICogQG1lbWJlck9mIFJcbiAgICAgKiBAc2luY2UgdjAuMS4wXG4gICAgICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gICAgICogQHNpZyBbKl0gLT4gWypdIC0+IFsqXVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFzIFRoZSBmaXJzdCBsaXN0LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGJzIFRoZSBzZWNvbmQgbGlzdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gVGhlIGZpcnN0IGFuZCBzZWNvbmQgbGlzdHMgY29uY2F0ZW5hdGVkLCB3aXRoXG4gICAgICogICAgICAgICBkdXBsaWNhdGVzIHJlbW92ZWQuXG4gICAgICogQGV4YW1wbGVcbiAgICAgKlxuICAgICAqICAgICAgUi51bmlvbihbMSwgMiwgM10sIFsyLCAzLCA0XSk7IC8vPT4gWzEsIDIsIDMsIDRdXG4gICAgICovXG4gICAgdmFyIHVuaW9uID0gX2N1cnJ5Mihjb21wb3NlKHVuaXEsIF9jb25jYXQpKTtcblxuICAgIHZhciBSID0ge1xuICAgICAgICBGOiBGLFxuICAgICAgICBUOiBULFxuICAgICAgICBfXzogX18sXG4gICAgICAgIGFkZDogYWRkLFxuICAgICAgICBhZGRJbmRleDogYWRkSW5kZXgsXG4gICAgICAgIGFkanVzdDogYWRqdXN0LFxuICAgICAgICBhbGw6IGFsbCxcbiAgICAgICAgYWxsUGFzczogYWxsUGFzcyxcbiAgICAgICAgYWxsVW5pcTogYWxsVW5pcSxcbiAgICAgICAgYWx3YXlzOiBhbHdheXMsXG4gICAgICAgIGFuZDogYW5kLFxuICAgICAgICBhbnk6IGFueSxcbiAgICAgICAgYW55UGFzczogYW55UGFzcyxcbiAgICAgICAgYXA6IGFwLFxuICAgICAgICBhcGVydHVyZTogYXBlcnR1cmUsXG4gICAgICAgIGFwcGVuZDogYXBwZW5kLFxuICAgICAgICBhcHBseTogYXBwbHksXG4gICAgICAgIGFwcGx5U3BlYzogYXBwbHlTcGVjLFxuICAgICAgICBhc3NvYzogYXNzb2MsXG4gICAgICAgIGFzc29jUGF0aDogYXNzb2NQYXRoLFxuICAgICAgICBiaW5hcnk6IGJpbmFyeSxcbiAgICAgICAgYmluZDogYmluZCxcbiAgICAgICAgYm90aDogYm90aCxcbiAgICAgICAgY2FsbDogY2FsbCxcbiAgICAgICAgY2hhaW46IGNoYWluLFxuICAgICAgICBjbGFtcDogY2xhbXAsXG4gICAgICAgIGNsb25lOiBjbG9uZSxcbiAgICAgICAgY29tcGFyYXRvcjogY29tcGFyYXRvcixcbiAgICAgICAgY29tcGxlbWVudDogY29tcGxlbWVudCxcbiAgICAgICAgY29tcG9zZTogY29tcG9zZSxcbiAgICAgICAgY29tcG9zZUs6IGNvbXBvc2VLLFxuICAgICAgICBjb21wb3NlUDogY29tcG9zZVAsXG4gICAgICAgIGNvbmNhdDogY29uY2F0LFxuICAgICAgICBjb25kOiBjb25kLFxuICAgICAgICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdCxcbiAgICAgICAgY29uc3RydWN0TjogY29uc3RydWN0TixcbiAgICAgICAgY29udGFpbnM6IGNvbnRhaW5zLFxuICAgICAgICBjb252ZXJnZTogY29udmVyZ2UsXG4gICAgICAgIGNvdW50Qnk6IGNvdW50QnksXG4gICAgICAgIGN1cnJ5OiBjdXJyeSxcbiAgICAgICAgY3VycnlOOiBjdXJyeU4sXG4gICAgICAgIGRlYzogZGVjLFxuICAgICAgICBkZWZhdWx0VG86IGRlZmF1bHRUbyxcbiAgICAgICAgZGlmZmVyZW5jZTogZGlmZmVyZW5jZSxcbiAgICAgICAgZGlmZmVyZW5jZVdpdGg6IGRpZmZlcmVuY2VXaXRoLFxuICAgICAgICBkaXNzb2M6IGRpc3NvYyxcbiAgICAgICAgZGlzc29jUGF0aDogZGlzc29jUGF0aCxcbiAgICAgICAgZGl2aWRlOiBkaXZpZGUsXG4gICAgICAgIGRyb3A6IGRyb3AsXG4gICAgICAgIGRyb3BMYXN0OiBkcm9wTGFzdCxcbiAgICAgICAgZHJvcExhc3RXaGlsZTogZHJvcExhc3RXaGlsZSxcbiAgICAgICAgZHJvcFJlcGVhdHM6IGRyb3BSZXBlYXRzLFxuICAgICAgICBkcm9wUmVwZWF0c1dpdGg6IGRyb3BSZXBlYXRzV2l0aCxcbiAgICAgICAgZHJvcFdoaWxlOiBkcm9wV2hpbGUsXG4gICAgICAgIGVpdGhlcjogZWl0aGVyLFxuICAgICAgICBlbXB0eTogZW1wdHksXG4gICAgICAgIGVxQnk6IGVxQnksXG4gICAgICAgIGVxUHJvcHM6IGVxUHJvcHMsXG4gICAgICAgIGVxdWFsczogZXF1YWxzLFxuICAgICAgICBldm9sdmU6IGV2b2x2ZSxcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICAgIGZpbmQ6IGZpbmQsXG4gICAgICAgIGZpbmRJbmRleDogZmluZEluZGV4LFxuICAgICAgICBmaW5kTGFzdDogZmluZExhc3QsXG4gICAgICAgIGZpbmRMYXN0SW5kZXg6IGZpbmRMYXN0SW5kZXgsXG4gICAgICAgIGZsYXR0ZW46IGZsYXR0ZW4sXG4gICAgICAgIGZsaXA6IGZsaXAsXG4gICAgICAgIGZvckVhY2g6IGZvckVhY2gsXG4gICAgICAgIGZyb21QYWlyczogZnJvbVBhaXJzLFxuICAgICAgICBncm91cEJ5OiBncm91cEJ5LFxuICAgICAgICBncm91cFdpdGg6IGdyb3VwV2l0aCxcbiAgICAgICAgZ3Q6IGd0LFxuICAgICAgICBndGU6IGd0ZSxcbiAgICAgICAgaGFzOiBoYXMsXG4gICAgICAgIGhhc0luOiBoYXNJbixcbiAgICAgICAgaGVhZDogaGVhZCxcbiAgICAgICAgaWRlbnRpY2FsOiBpZGVudGljYWwsXG4gICAgICAgIGlkZW50aXR5OiBpZGVudGl0eSxcbiAgICAgICAgaWZFbHNlOiBpZkVsc2UsXG4gICAgICAgIGluYzogaW5jLFxuICAgICAgICBpbmRleEJ5OiBpbmRleEJ5LFxuICAgICAgICBpbmRleE9mOiBpbmRleE9mLFxuICAgICAgICBpbml0OiBpbml0LFxuICAgICAgICBpbnNlcnQ6IGluc2VydCxcbiAgICAgICAgaW5zZXJ0QWxsOiBpbnNlcnRBbGwsXG4gICAgICAgIGludGVyc2VjdGlvbjogaW50ZXJzZWN0aW9uLFxuICAgICAgICBpbnRlcnNlY3Rpb25XaXRoOiBpbnRlcnNlY3Rpb25XaXRoLFxuICAgICAgICBpbnRlcnNwZXJzZTogaW50ZXJzcGVyc2UsXG4gICAgICAgIGludG86IGludG8sXG4gICAgICAgIGludmVydDogaW52ZXJ0LFxuICAgICAgICBpbnZlcnRPYmo6IGludmVydE9iaixcbiAgICAgICAgaW52b2tlcjogaW52b2tlcixcbiAgICAgICAgaXM6IGlzLFxuICAgICAgICBpc0FycmF5TGlrZTogaXNBcnJheUxpa2UsXG4gICAgICAgIGlzRW1wdHk6IGlzRW1wdHksXG4gICAgICAgIGlzTmlsOiBpc05pbCxcbiAgICAgICAgam9pbjogam9pbixcbiAgICAgICAganV4dDoganV4dCxcbiAgICAgICAga2V5czoga2V5cyxcbiAgICAgICAga2V5c0luOiBrZXlzSW4sXG4gICAgICAgIGxhc3Q6IGxhc3QsXG4gICAgICAgIGxhc3RJbmRleE9mOiBsYXN0SW5kZXhPZixcbiAgICAgICAgbGVuZ3RoOiBsZW5ndGgsXG4gICAgICAgIGxlbnM6IGxlbnMsXG4gICAgICAgIGxlbnNJbmRleDogbGVuc0luZGV4LFxuICAgICAgICBsZW5zUGF0aDogbGVuc1BhdGgsXG4gICAgICAgIGxlbnNQcm9wOiBsZW5zUHJvcCxcbiAgICAgICAgbGlmdDogbGlmdCxcbiAgICAgICAgbGlmdE46IGxpZnROLFxuICAgICAgICBsdDogbHQsXG4gICAgICAgIGx0ZTogbHRlLFxuICAgICAgICBtYXA6IG1hcCxcbiAgICAgICAgbWFwQWNjdW06IG1hcEFjY3VtLFxuICAgICAgICBtYXBBY2N1bVJpZ2h0OiBtYXBBY2N1bVJpZ2h0LFxuICAgICAgICBtYXBPYmpJbmRleGVkOiBtYXBPYmpJbmRleGVkLFxuICAgICAgICBtYXRjaDogbWF0Y2gsXG4gICAgICAgIG1hdGhNb2Q6IG1hdGhNb2QsXG4gICAgICAgIG1heDogbWF4LFxuICAgICAgICBtYXhCeTogbWF4QnksXG4gICAgICAgIG1lYW46IG1lYW4sXG4gICAgICAgIG1lZGlhbjogbWVkaWFuLFxuICAgICAgICBtZW1vaXplOiBtZW1vaXplLFxuICAgICAgICBtZXJnZTogbWVyZ2UsXG4gICAgICAgIG1lcmdlQWxsOiBtZXJnZUFsbCxcbiAgICAgICAgbWVyZ2VXaXRoOiBtZXJnZVdpdGgsXG4gICAgICAgIG1lcmdlV2l0aEtleTogbWVyZ2VXaXRoS2V5LFxuICAgICAgICBtaW46IG1pbixcbiAgICAgICAgbWluQnk6IG1pbkJ5LFxuICAgICAgICBtb2R1bG86IG1vZHVsbyxcbiAgICAgICAgbXVsdGlwbHk6IG11bHRpcGx5LFxuICAgICAgICBuQXJ5OiBuQXJ5LFxuICAgICAgICBuZWdhdGU6IG5lZ2F0ZSxcbiAgICAgICAgbm9uZTogbm9uZSxcbiAgICAgICAgbm90OiBub3QsXG4gICAgICAgIG50aDogbnRoLFxuICAgICAgICBudGhBcmc6IG50aEFyZyxcbiAgICAgICAgb2JqT2Y6IG9iak9mLFxuICAgICAgICBvZjogb2YsXG4gICAgICAgIG9taXQ6IG9taXQsXG4gICAgICAgIG9uY2U6IG9uY2UsXG4gICAgICAgIG9yOiBvcixcbiAgICAgICAgb3Zlcjogb3ZlcixcbiAgICAgICAgcGFpcjogcGFpcixcbiAgICAgICAgcGFydGlhbDogcGFydGlhbCxcbiAgICAgICAgcGFydGlhbFJpZ2h0OiBwYXJ0aWFsUmlnaHQsXG4gICAgICAgIHBhcnRpdGlvbjogcGFydGl0aW9uLFxuICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICBwYXRoRXE6IHBhdGhFcSxcbiAgICAgICAgcGF0aE9yOiBwYXRoT3IsXG4gICAgICAgIHBhdGhTYXRpc2ZpZXM6IHBhdGhTYXRpc2ZpZXMsXG4gICAgICAgIHBpY2s6IHBpY2ssXG4gICAgICAgIHBpY2tBbGw6IHBpY2tBbGwsXG4gICAgICAgIHBpY2tCeTogcGlja0J5LFxuICAgICAgICBwaXBlOiBwaXBlLFxuICAgICAgICBwaXBlSzogcGlwZUssXG4gICAgICAgIHBpcGVQOiBwaXBlUCxcbiAgICAgICAgcGx1Y2s6IHBsdWNrLFxuICAgICAgICBwcmVwZW5kOiBwcmVwZW5kLFxuICAgICAgICBwcm9kdWN0OiBwcm9kdWN0LFxuICAgICAgICBwcm9qZWN0OiBwcm9qZWN0LFxuICAgICAgICBwcm9wOiBwcm9wLFxuICAgICAgICBwcm9wRXE6IHByb3BFcSxcbiAgICAgICAgcHJvcElzOiBwcm9wSXMsXG4gICAgICAgIHByb3BPcjogcHJvcE9yLFxuICAgICAgICBwcm9wU2F0aXNmaWVzOiBwcm9wU2F0aXNmaWVzLFxuICAgICAgICBwcm9wczogcHJvcHMsXG4gICAgICAgIHJhbmdlOiByYW5nZSxcbiAgICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICAgIHJlZHVjZUJ5OiByZWR1Y2VCeSxcbiAgICAgICAgcmVkdWNlUmlnaHQ6IHJlZHVjZVJpZ2h0LFxuICAgICAgICByZWR1Y2VkOiByZWR1Y2VkLFxuICAgICAgICByZWplY3Q6IHJlamVjdCxcbiAgICAgICAgcmVtb3ZlOiByZW1vdmUsXG4gICAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgICAgICByZXZlcnNlOiByZXZlcnNlLFxuICAgICAgICBzY2FuOiBzY2FuLFxuICAgICAgICBzZXF1ZW5jZTogc2VxdWVuY2UsXG4gICAgICAgIHNldDogc2V0LFxuICAgICAgICBzbGljZTogc2xpY2UsXG4gICAgICAgIHNvcnQ6IHNvcnQsXG4gICAgICAgIHNvcnRCeTogc29ydEJ5LFxuICAgICAgICBzcGxpdDogc3BsaXQsXG4gICAgICAgIHNwbGl0QXQ6IHNwbGl0QXQsXG4gICAgICAgIHNwbGl0RXZlcnk6IHNwbGl0RXZlcnksXG4gICAgICAgIHNwbGl0V2hlbjogc3BsaXRXaGVuLFxuICAgICAgICBzdWJ0cmFjdDogc3VidHJhY3QsXG4gICAgICAgIHN1bTogc3VtLFxuICAgICAgICBzeW1tZXRyaWNEaWZmZXJlbmNlOiBzeW1tZXRyaWNEaWZmZXJlbmNlLFxuICAgICAgICBzeW1tZXRyaWNEaWZmZXJlbmNlV2l0aDogc3ltbWV0cmljRGlmZmVyZW5jZVdpdGgsXG4gICAgICAgIHRhaWw6IHRhaWwsXG4gICAgICAgIHRha2U6IHRha2UsXG4gICAgICAgIHRha2VMYXN0OiB0YWtlTGFzdCxcbiAgICAgICAgdGFrZUxhc3RXaGlsZTogdGFrZUxhc3RXaGlsZSxcbiAgICAgICAgdGFrZVdoaWxlOiB0YWtlV2hpbGUsXG4gICAgICAgIHRhcDogdGFwLFxuICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICB0aW1lczogdGltZXMsXG4gICAgICAgIHRvTG93ZXI6IHRvTG93ZXIsXG4gICAgICAgIHRvUGFpcnM6IHRvUGFpcnMsXG4gICAgICAgIHRvUGFpcnNJbjogdG9QYWlyc0luLFxuICAgICAgICB0b1N0cmluZzogdG9TdHJpbmcsXG4gICAgICAgIHRvVXBwZXI6IHRvVXBwZXIsXG4gICAgICAgIHRyYW5zZHVjZTogdHJhbnNkdWNlLFxuICAgICAgICB0cmFuc3Bvc2U6IHRyYW5zcG9zZSxcbiAgICAgICAgdHJhdmVyc2U6IHRyYXZlcnNlLFxuICAgICAgICB0cmltOiB0cmltLFxuICAgICAgICB0cnlDYXRjaDogdHJ5Q2F0Y2gsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIHVuYXBwbHk6IHVuYXBwbHksXG4gICAgICAgIHVuYXJ5OiB1bmFyeSxcbiAgICAgICAgdW5jdXJyeU46IHVuY3VycnlOLFxuICAgICAgICB1bmZvbGQ6IHVuZm9sZCxcbiAgICAgICAgdW5pb246IHVuaW9uLFxuICAgICAgICB1bmlvbldpdGg6IHVuaW9uV2l0aCxcbiAgICAgICAgdW5pcTogdW5pcSxcbiAgICAgICAgdW5pcUJ5OiB1bmlxQnksXG4gICAgICAgIHVuaXFXaXRoOiB1bmlxV2l0aCxcbiAgICAgICAgdW5sZXNzOiB1bmxlc3MsXG4gICAgICAgIHVubmVzdDogdW5uZXN0LFxuICAgICAgICB1bnRpbDogdW50aWwsXG4gICAgICAgIHVwZGF0ZTogdXBkYXRlLFxuICAgICAgICB1c2VXaXRoOiB1c2VXaXRoLFxuICAgICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgICAgdmFsdWVzSW46IHZhbHVlc0luLFxuICAgICAgICB2aWV3OiB2aWV3LFxuICAgICAgICB3aGVuOiB3aGVuLFxuICAgICAgICB3aGVyZTogd2hlcmUsXG4gICAgICAgIHdoZXJlRXE6IHdoZXJlRXEsXG4gICAgICAgIHdpdGhvdXQ6IHdpdGhvdXQsXG4gICAgICAgIHdyYXA6IHdyYXAsXG4gICAgICAgIHhwcm9kOiB4cHJvZCxcbiAgICAgICAgemlwOiB6aXAsXG4gICAgICAgIHppcE9iajogemlwT2JqLFxuICAgICAgICB6aXBXaXRoOiB6aXBXaXRoXG4gICAgfTtcbiAgLyogZXNsaW50LWVudiBhbWQgKi9cblxuICAvKiBURVNUX0VOVFJZX1BPSU5UICovXG5cbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gUjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBSOyB9KTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLlIgPSBSO1xuICB9XG5cbn0uY2FsbCh0aGlzKSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9yYW1kYS9kaXN0L3JhbWRhLmpzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vdXRpbC91dGlsLmpzXG4gKiogbW9kdWxlIGlkID0gNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufVxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanNcbiAqKiBtb2R1bGUgaWQgPSA2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanNcbiAqKiBtb2R1bGUgaWQgPSA3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvLyBGSVhNRTogcmVwbGFjZSB0aGlzIHdpdGggYSByZWFsIGxvZ2dpbmcgbGlicmFyeSAtLSB3aW5zdG9uP1xuLy8gbG9nIGlzIGEgZnVuY3Rpb24gdGhhdCBsb2dzIG1lc3NhZ2VzLCBhbmQgaGFzIGEgc2ltcGxlIGluZGVudCAoLmVudGVyKCkpIGFuZFxuLy8gdW5pbmRlbnQgKC5leGl0KCkpIGZlYXR1cmUuXG4vL1xuLy8gVXNhZ2U6XG4vLyAgIHZhciBsb2cgPSByZXF1aXJlKCcuL2xvZy5qcycpKCk7XG4vLyAgIGxvZy5lbnRlcignc3RhcnRpbmcnKTtcbi8vICAgLi4uXG4vLyAgIGxvZygnYW5vdGhlciBtZXNzYWdlJyk7XG4vLyAgIGxvZy5leGl0KCk7ICBcblxuY29uc3QgbG9ncyA9IHt9O1xuXG4vLyBNYWtlIGEgbmV3IGxvZ2dlciwgb3IgcmV0dXJuIGFuIGV4aXN0aW5nIG9uZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKF9vcHRzKSB7XG4gIG9wdHMgPSBfb3B0cyB8fCB7fTtcbiAgY29uc3QgYnJhY2VzID0gKCdicmFjZXMnIGluIG9wdHMpID8gb3B0cy5icmFjZXMgOiBmYWxzZTtcbiAgY29uc3QgaWQgPSAoJ2lkJyBpbiBvcHRzKSA/IG9wdHMuaWQgOiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDApO1xuICBpZiAoaWQgaW4gbG9ncykgcmV0dXJuIGxvZ3NbaWRdO1xuXG4gIHZhciBsb2cgPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgaWYgKCFsb2cuZW5hYmxlZCkgcmV0dXJuO1xuICAgIGFyZ3MudW5zaGlmdCgnICAnLnJlcGVhdChsb2cuaW5kZW50KSk7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gIH07XG5cbiAgbG9nLmluZGVudCA9IDA7XG4gIGxvZy5lbmFibGVkID0gdHJ1ZTtcblxuICBsb2cuZW5hYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgbG9nLmVuYWJsZWQgPSB0cnVlO1xuICB9O1xuICBsb2cuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGxvZy5lbmFibGVkID0gZmFsc2U7XG4gIH07XG5cbiAgbG9nLmVudGVyID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgIGlmICghbG9nLmVuYWJsZWQpIHJldHVybjtcbiAgICBpZiAoYnJhY2VzKSBhcmdzLnB1c2goJ3snKTtcbiAgICBsb2coLi4uYXJncyk7XG4gICAgbG9nLmluZGVudCsrO1xuICB9O1xuXG4gIGxvZy5leGl0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFsb2cuZW5hYmxlZCkgcmV0dXJuO1xuICAgIGxvZy5pbmRlbnQtLTtcbiAgICBpZiAoYnJhY2VzKSBsb2coJ30nKTtcbiAgfTtcblxuICBsb2dzW2lkXSA9IGxvZztcbiAgcmV0dXJuIGxvZztcbn1cblxuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2xvZy5qc1xuICoqIG1vZHVsZSBpZCA9IDhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIEZJWE1FOiBXaGVuIGluIGEgYnJvd3NlciwgZGVmYXVsdHMgd2lsbCBiZSBkaWZmZXJlbnQgKG1heWJlLCBubyBkZWZhdWx0cylcblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBDMSA9IHJlcXVpcmUoJy4vc2VlZC5qcycpO1xuY29uc3QgcmVjaXBlID0gQzEucmVjaXBlO1xuY29uc3QgUiA9IHJlcXVpcmUoJ3JhbWRhJyk7XG5jb25zdCBwcm9jZXNzID0gcmVxdWlyZSgncHJvY2VzcycpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuY29uc3QgbG9nID0gcmVxdWlyZSgnLi9sb2cuanMnKSh7aWQ6ICdyb290J30pO1xubG9nLmRpc2FibGUoKTtcblxuXG4vLyBHaXZlbiBhIGJhc2UgZGlyZWN0b3J5LCByZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyBhIHBhdGggcmVsYXRpdmVcbi8vIHRvIHRoYXQgYmFzZVxuY29uc3QgcmVzb2x2ZUZyb20gPSBiYXNlID0+IFIucGFydGlhbChwYXRoLnJlc29sdmUsIFtiYXNlXSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG5cbiAgICAvLyBBZGQgcHJlZGljYXRlIGZ1bmN0aW9ucyBoZXJlIHRvIHRlbGwgY29uZmlnMSB0aGF0IGNlcnRhaW4gdHlwZXMgb2ZcbiAgICAvLyBvYmplY3RzIHNob3VsZCBiZSB0cmVhdGVkIGFzIGF0b21pYy5cbiAgICBhdG9tVGVzdHM6IFtdLFxuXG4gICAgY29uZmlnRGlyRW52OiAnQ09ORklHMV9ESVInLFxuXG4gICAgY29uZmlnRGlyOiByZWNpcGUoWD0+IHtcbiAgICAgIGNvbnN0IGVudiA9IFguY29uZmlnRGlyRW52O1xuICAgICAgY29uc3QgcmVsID0gcHJvY2Vzcy5lbnZbZW52XSB8fCBwcm9jZXNzLmN3ZCgpO1xuICAgICAgcmV0dXJuIHBhdGgucmVzb2x2ZShyZWwpO1xuICAgIH0pLFxuXG4gICAgLy8gVGhlIGxpc3Qgb2YgY29uZmlnIGZpbGVuYW1lcyB0aGF0IGFyZSBzZWFyY2hlZCBmb3IgZmlyc3QsIGluIG9yZGVyIGZyb21cbiAgICAvLyBkZWZhdWx0cyAtPiBvdmVycmlkZXNcbiAgICBiYXNlbmFtZXM6IFsgJ2NvbmZpZycsICdjb25maWctbG9jYWwnIF0sXG5cbiAgICAvLyBMaXN0IG9mIHZhbGlkIGZpbGVuYW1lIHN1ZmZpeGVzXG4gICAgc3VmZml4ZXM6IFsgJy5qcycsICcuanNvbicgXSxcblxuICAgIC8vIExpc3Qgb2YgZmlsZW5hbWVzLCB3aGljaCBpcyB0aGUgZXZlcnkgY29tYmluYXRpb24gb2YgYmFzZW5hbWVzIGFuZCBzdWZmaXhlc1xuICAgIGZpbGVuYW1lczogcmVjaXBlKFg9PiB7XG4gICAgICBjb25zdCBtYXBjYXQyID0gUi5saWZ0KFIuY3VycnkoKGEsIGIpID0+IGEgKyBiKSk7XG4gICAgICByZXR1cm4gbWFwY2F0MihYLmJhc2VuYW1lcywgWC5zdWZmaXhlcyk7XG4gICAgfSksXG5cbiAgICAvLyBMaXN0IG9mIGFic29sdXRlIHBhdGhuYW1lc1xuICAgIHBhdGhuYW1lczogcmVjaXBlKFg9PiB7XG4gICAgICBjb25zdCByZXNvbHZlID0gcmVzb2x2ZUZyb20oWC5jb25maWdEaXIpO1xuICAgICAgcmV0dXJuIFIubWFwKHJlc29sdmUsIFguZmlsZW5hbWVzKVxuICAgIH0pLFxuXG4gICAgLy8gRW52aXJvbmVudCB2YXJpYWJsZXMuIFNldHRpbmcgdGhpcyB0byB0aGUgZW1wdHkgc3RyaW5nIG9yIG51bGwgd2lsbCBcbiAgICAvLyBkaXNhYmxlIGxvb2tpbmcgZm9yIGNvbmZpZyBpbmZvIGluIHRoZSBlbnZpcm9ubWVudCAgXG4gICAgZW52UHJlZml4OiAnQ09ORklHMV8nLFxuXG4gICAgLy8gVGhlIHNvdXJjZSBzcGVjaWZpY2F0aW9uIHR5cGVzIHdlIHVuZGVyc3RhbmQuIFRoZSBgc291cmNlc2Agb3B0aW9uIGlzXG4gICAgLy8gYSBsaXN0IG9mIHNvdXJjZSBzcGVjaWZpY2F0aW9ucywgZWFjaCBvZiB3aGljaCBpcyBhIHBsYWluIG9iamVjdCB3aXRoIGFcbiAgICAvLyB0eXBlIHByb3BlcnR5IHRoYXQgbWF0Y2hlcyB0aGUga2V5IGhlcmUuXG4gICAgc291cmNlVHlwZXM6IHtcbiAgICAgIGZpbGU6IHtcbiAgICAgICAgbWFrZVNwZWM6IHBhdGhuYW1lID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ2ZpbGUnLFxuICAgICAgICAgICAgcGF0aG5hbWU6IHBhdGhuYW1lXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgc3BlY3M6IHJlY2lwZShYPT4ge1xuICAgICAgICAgIGNvbnN0IHNlbGYgPSBYLnNvdXJjZVR5cGVzLmZpbGU7XG4gICAgICAgICAgcmV0dXJuIFgucGF0aG5hbWVzID8gUi5tYXAoc2VsZi5tYWtlU3BlYywgWC5wYXRobmFtZXMpIDogbnVsbDtcbiAgICAgICAgfSksXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbihzcmNzcGVjKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiByZXF1aXJlKHNyY3NwZWMucGF0aG5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYXRjaChlcnIpIHt9XG4gICAgICAgIH0sXG4gICAgICB9LFxuXG4gICAgICBlbnZQcmVmaXg6IHtcbiAgICAgICAgbWFrZVNwZWM6IHByZWZpeCA9PiAoe1xuICAgICAgICAgIHR5cGU6ICdlbnZQcmVmaXgnLFxuICAgICAgICAgIHByZWZpeDogcHJlZml4XG4gICAgICAgIH0pLFxuICAgICAgICBzcGVjczogcmVjaXBlKFg9PiB7XG4gICAgICAgICAgY29uc3Qgc2VsZiA9IFguc291cmNlVHlwZXMuZW52UHJlZml4O1xuICAgICAgICAgIHJldHVybiBYLmVudlByZWZpeCA/IFtzZWxmLm1ha2VTcGVjKFguZW52UHJlZml4KV0gOiBudWxsO1xuICAgICAgICB9KSxcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKHNyY3NwZWMpIHtcbiAgICAgICAgICAvLyBGSVhNRTogaW1wbGVtZW50IVxuICAgICAgICB9LFxuICAgICAgfSxcblxuICAgICAgZW52SnNvbjoge1xuICAgICAgICBtYWtlU3BlYzogbmFtZSA9PiAoe1xuICAgICAgICAgIHR5cGU6ICdlbnZKc29uJyxcbiAgICAgICAgICBuYW1lOiBuYW1lXG4gICAgICAgIH0pLFxuICAgICAgICBzcGVjczogcmVjaXBlKFg9PiB7XG4gICAgICAgICAgY29uc3Qgc2VsZiA9IFguc291cmNlVHlwZXMuZW52SnNvbjtcbiAgICAgICAgICByZXR1cm4gWC5lbnZKc29uID8gW3NlbGYubWFrZVNwZWMoWC5lbnZQcmVmaXgpXSA6IG51bGw7XG4gICAgICAgIH0pLFxuICAgICAgICBmZXRjaDogZnVuY3Rpb24oc3Jjc3BlYykge1xuICAgICAgICAgIC8vIEZJWE1FOiBpbXBsZW1lbnQhXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBQdXQgdGhlbSBhbGwgdG9nZXRoZXJcbiAgICBzb3VyY2VzOiByZWNpcGUoWD0+IHtcbiAgICAgIC8vIEZJWE1FOiB0aGlzIG5lZWRzIHRvIGNvbmNhdGVuYXRlIGFsbCB0aGUgc3BlY3MsIHJhdGhlciB0aGFuIGp1c3QgdGhlc2UgdHdvXG4gICAgICBjb25zdCBzdHlwZXMgPSBYLnNvdXJjZVR5cGVzO1xuICAgICAgY29uc3Qgc3JjcyA9IHN0eXBlcy5maWxlLnNwZWNzLmNvbmNhdChzdHlwZXMuZW52UHJlZml4LnNwZWNzKTtcbiAgICAgIHJldHVybiBzcmNzO1xuICAgIH0pLFxuXG4gICAgLy8gRnVuY3Rpb24gdG8gdGFrZSBhbnkgc291cmNlIHNwZWNpZmljYXRpb24sIGFuZCByZXR1cm4gdGhlIGNvbmZpZyBkYXRhXG4gICAgLy8gZm9yIHRoYXQgc291cmNlLiBUaGlzIGNsb3NlcyBvdmVyIHRoZSByb290IHZpZXcgLS0gSSdtIHByZXR0eVxuICAgIC8vIHN1cmUgdGhhdCB3b24ndCBiZSBhIHByb2JsZW0hXG4gICAgZmV0Y2hTb3VyY2U6IHJlY2lwZShYPT5cbiAgICAgIGZ1bmN0aW9uKHNyY3NwZWMpIHtcbiAgICAgICAgY29uc3QgdHlwZSA9IHNyY3NwZWMudHlwZSxcbiAgICAgICAgICAgICAgZmV0Y2ggPSBYLnNvdXJjZVR5cGVzW3R5cGVdLmZldGNoO1xuICAgICAgICByZXR1cm4gZmV0Y2goc3Jjc3BlYyk7XG4gICAgICB9XG4gICAgKSxcbiAgfTtcbn07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2RlZmF1bHRzLmpzXG4gKiogbW9kdWxlIGlkID0gOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIG1hcCA9IHtcblx0XCIuL2RlZmF1bHRzXCI6IDksXG5cdFwiLi9kZWZhdWx0cy5qc1wiOiA5LFxuXHRcIi4vZ2V0LWFsbC1wcm9wZXJ0eS1uYW1lc1wiOiAxMSxcblx0XCIuL2dldC1hbGwtcHJvcGVydHktbmFtZXMuanNcIjogMTEsXG5cdFwiLi9sb2dcIjogOCxcblx0XCIuL2xvZy5qc1wiOiA4LFxuXHRcIi4vc2VlZFwiOiAxLFxuXHRcIi4vc2VlZC5qc1wiOiAxXG59O1xuZnVuY3Rpb24gd2VicGFja0NvbnRleHQocmVxKSB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKHdlYnBhY2tDb250ZXh0UmVzb2x2ZShyZXEpKTtcbn07XG5mdW5jdGlvbiB3ZWJwYWNrQ29udGV4dFJlc29sdmUocmVxKSB7XG5cdHJldHVybiBtYXBbcmVxXSB8fCAoZnVuY3Rpb24oKSB7IHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyByZXEgKyBcIicuXCIpIH0oKSk7XG59O1xud2VicGFja0NvbnRleHQua2V5cyA9IGZ1bmN0aW9uIHdlYnBhY2tDb250ZXh0S2V5cygpIHtcblx0cmV0dXJuIE9iamVjdC5rZXlzKG1hcCk7XG59O1xud2VicGFja0NvbnRleHQucmVzb2x2ZSA9IHdlYnBhY2tDb250ZXh0UmVzb2x2ZTtcbm1vZHVsZS5leHBvcnRzID0gd2VicGFja0NvbnRleHQ7XG53ZWJwYWNrQ29udGV4dC5pZCA9IDEwO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYyBeXFwuXFwvLiokXG4gKiogbW9kdWxlIGlkID0gMTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8vIFRoaXMgaXMgYSB0ZXN0IGZpbGUsIHVzZWQgZm9yIHN0dWR5L2V4cGVyaW1lbnRhdGlvbi5cbi8vXG4vLyBIb3cgbXVjaCBzaG91bGQgd2Ugd29ycnkgYWJvdXQgaW5oZXJpdGVkIGFuZC9vciBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzP1xuLy8gSGVyZSdzIGEgZnVuY3Rpb24gdGhhdCBnZXRzIGFsbCB0aGUgcHJvcGVydGllcyBvZiBhbiBvYmplY3QuIFRoZXJlIGFyZSBhXG4vLyBsb3QuIE9uIHRoZSBvdGhlciBoYW5kLCBtb3N0IG9mIHRoZW0gcHJvYmFibHkgY29tZSBmcm9tIE9iamVjdC5wcm90b3R5cGUsXG4vLyBhbmQgcHJvYmFibHkgd2UgY291bGQgaW1wbGVtZW50IHVzaW5nIHRoZSBzYW1lIG1lY2hhbmlzbTogaS5lLiBpbnN0YW50aWF0ZVxuLy8gYSB2aWV3X3Byb3RvdHlwZSBmb3IgZXZlcnkgYzEucHJvdG90eXBlLCBhbmQgYXBwZW5kIHRoYXQgdG8gdGhlICp2aWV3J3MqXG4vLyBwcm90b3R5cGUgY2hhaW4uXG4vL1xuLy8gSWYgd2UgZG8gcHJveHkgdGhlbSwgdGhlbiB0aGUgcnVsZSBpcyB0aGF0IG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgYW5kIFxuLy8gaW5oZXJpdGVkIHByb3BlcnRpZXMgYXJlIGFsd2F5cyAqYXRvbXMqLlxuXG5mdW5jdGlvbiBnZXRBbGxQcm9wZXJ0eU5hbWVzKCBvYmogKSB7XG4gIHZhciBrZXlzID0ge307XG4gIGRvIHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICBrZXlzW2tleV0gPSB0cnVlO1xuICAgIH0pO1xuICB9IHdoaWxlIChvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSk7XG4gIHJldHVybiBPYmplY3Qua2V5cyhrZXlzKTtcbn1cblxudmFyIEEgPSBmdW5jdGlvbigpIHsgXG4gIHRoaXMuYV9wcm9wID0gMTA7IFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2Ffbm9uRW51bScsIHtcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSwgXG4gICAgdmFsdWU6IDI1LFxuICB9KTtcbn07XG52YXIgQXAgPSBBLnByb3RvdHlwZSA9IHtcbiAgYXBfcHJvcDogNSwgXG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEFwLCAnYXBfbm9uRW51bScsIHtcbiAgZW51bWVyYWJsZTogZmFsc2UsIFxuICB2YWx1ZTogMzAsXG59KTtcblxudmFyIGEgPSBuZXcgQSgpO1xuY29uc29sZS5sb2coZ2V0QWxsUHJvcGVydHlOYW1lcyhhKSk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2dldC1hbGwtcHJvcGVydHktbmFtZXMuanNcbiAqKiBtb2R1bGUgaWQgPSAxMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==