// Master Node.js script that:
// - Concatenates the files into test-all.js, and runs them under Node.js.
// - Note that the index.html page also includes test-all.js in a script tag,
//   for in-browser testing.
'use strict';

// List of all files; both units-under-test, and test files. All paths are
// relative to the location of this file.

// Each one should populate one property of the global TC variable.

const allFiles = 
  [ 'tester.js',
    'test-tester.js', ];

const fs = require('fs');
const path = require('path');
const abspath = subpath => path.resolve(__dirname, subpath);

const testAll = abspath('test-all.js');
try { fs.unlinkSync(testAll); } catch(err) { }

const preamble = 
  '// This is a product file; do not edit.\n' + 
  'const TC = {};\n';
fs.writeFileSync(testAll, preamble, { encoding: 'utf8' });

// This function concatenates all of the files in a list starting with the
// given index. It first contenates the indicated one, and then recurses.
// (Doing it this way because, for some unknown reason, the readFileSync 
// method was giving me errors.)
const concatRest = function(next) {
  const pathname = abspath(allFiles[next]);
  fs.readFile(pathname, { encoding: 'utf8' }, (err, contents) => {
    if (err) throw err;
    fs.appendFileSync(testAll, 
      '//=============================================\n' +
      '// ' + pathname + '\n\n' + contents + '\n',
      { encoding: 'utf8' }
    );

    return next + 1 < allFiles.length ? concatRest(next + 1) : concatDone();
  });
};
concatRest(0);

function concatDone() {
  const footer = 
    `Object.keys(TC).forEach(key => {\n` +
    `  if (key.substr(0,4) == 'test' && typeof TC[key] === 'function') {\n` +
    `    console.log('Running ' + key + '\\n');\n` +
    `    TC[key]();\n` +
    `  }\n` +
    `});\n`;

  fs.appendFileSync(testAll, footer, { encoding: 'utf8' });
  console.log('Done. Output in ' + testAll);
}
