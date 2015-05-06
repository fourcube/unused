#!/usr/bin/env node

'use strict';

var acorn = require('acorn-jsx'),
    jsx = require('react-tools'),
    esquery = require('esquery'),
    fs = require('fs'),
    argv = require('yargs').usage('Usage: $0 [options] <file>').alias('r', 'raw').describe('r', 'Output raw json data').alias('v', 'vim').describe('v', 'Output vim matchers').demand(1).argv,
    inputFile = argv._[0];

// parseFile at path
function parseFile(path, cb) {
  fs.readFile(path, { encoding: 'utf-8' }, function (err, data) {
    if (err) {
      return cb(err, null);
    }
    // first apply a jsx transformation
    data = jsx.transform(data, {
      harmony: true,
      es6module: true
    });

    cb(null, acorn.parse(data, {
      sourceType: 'module',
      ecmaVersion: '6',
      locations: true,
      plugins: {
        'jsx': true
      }
    }));
  });
}

function _boundaries(node) {
  return {
    start: node.local.loc.start,
    end: node.local.loc.end,
    name: node.local.name
  };
}

function getImports(ast) {
  //var selector = esquery.parse("[type=ImportSpecifier]");
  var selector = esquery.parse(':matches(ImportDefaultSpecifier,ImportSpecifier)'),
      res = esquery.match(ast, selector);

  return res.map(_boundaries);
}

function hasNoUsage(ast, x) {
  var memberExpr = esquery.parse(':matches(MemberExpression[object.name=' + x.name + '], :matches(CallExpression, Property, ArrayExpression) > Identifier[name=' + x.name + '])');
  return esquery.match(ast, memberExpr).length == 0;
}

parseFile(inputFile, function (err, ast) {
  var declaredImports = undefined,
      unusedImports = undefined;

  if (err) {
    console.error(err);
    return;
  }

  declaredImports = getImports(ast);
  unusedImports = declaredImports.filter(hasNoUsage.bind(this, ast));

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
    outputVim(unusedImports);
    return;
  }

  // Output in terminal friendly mode
  var indentLevel = findIndentLevel(unusedImports);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = unusedImports[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var unusedImport = _step.value;

      var _name = unusedImport.name,
          startPos = unusedImport.start,
          endPos = unusedImport.end;

      var output = '' + padRight(_name, indentLevel) + '(' + inputFile + ' ' + formatPosition(startPos, endPos) + ')';
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

function outputVim(unusedImports) {
  var commands = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = unusedImports[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var unusedImport = _step2.value;

      var _name2 = unusedImport.name,
          startLine = unusedImport.start.line,
          startPos = parseInt(unusedImport.start.column) + 1,
          endPos = parseInt(unusedImport.end.column) + 1,
          output = undefined;

      output = 'call matchadd(\'Error\', \'\\%' + startLine + 'l\\%<' + endPos + 'v.\\%>' + startPos + 'v\')';
      commands.push(output);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  console.log(':' + commands.join(' | '));
}

function padRight(str, expectedLength) {
  var pad = str;
  for (var i = str.length - expectedLength; i++; i < expectedLength) {
    pad += ' ';
  }
  return pad;
}

function findIndentLevel(nodes) {
  return nodes.map(function (n) {
    return n.name.length;
  }).sort(function (a, b) {
    return a < b;
  })[0] + 5;
}

function formatPosition(start, end) {
  return '' + start.line + ':' + start.column;
};
