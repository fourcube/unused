#!/usr/bin/env node
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

'use strict';

var argv = require('yargs').usage('Usage: $0 [options] <file>').alias('r', 'raw').describe('r', 'Output raw json data').alias('v', 'vim').describe('v', 'Output vim matchers').alias('q', 'quiet').describe('q', 'Do not output results').epilog('unused will exit with code 0 when no unused imports were found. Otherwise the exit code is -1.').demand(1).argv,
    lib = require('./lib'),
    inputFile = argv._[0];

lib.parseForUnusedImports(inputFile, function (err, unusedImports) {
  if (err) {
    console.error(err);
    return;
  }

  // We will exit with 0 on success, -1 otherwise. 
  _process2['default'].exitCode = unusedImports.length == 0 ? 0 : -1;

  // Nothing to do here, the file looks fine
  if (unusedImports.length == 0) {
    return;
  }

  // Output JSON if raw mode is requested
  if (argv.r) {
    console.log(unusedImports);
    return;
  }

  // Output vim 'matchadd' code if vim mode is requested
  if (argv.v) {
    lib.outputVim(unusedImports);
    return;
  }

  // Output in terminal friendly mode
  var indentLevel = lib.findIndentLevel(unusedImports);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = unusedImports[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var unusedImport = _step.value;

      var _name = unusedImport.name,
          startPos = unusedImport.start,
          endPos = unusedImport.end;

      var output = '' + lib.padRight(_name, indentLevel) + '(' + inputFile + ' ' + lib.formatPosition(startPos, endPos) + ')';
      console.log(output);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  console.log('  ' + 'total ' + unusedImports.length);
});