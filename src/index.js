#!/usr/bin/env node
"use strict";

var acorn   = require('acorn-jsx'),
    jsx     = require('react-tools'),
    esquery = require('esquery'),
    fs      = require('fs'),
    argv    = require('yargs')
                .usage('Usage: $0 [options] <file>')
                .alias('r', 'raw')
                .describe('r', 'Output raw json data')
                .alias('v', 'vim')
                .describe('v', 'Output vim matchers')
                .demand(1)
                .argv,
    inputFile = argv._[0];


// parseFile at path
function parseFile(path, cb) {
  fs.readFile(path, {encoding: 'utf-8'}, function(err, data) {
    if(err) {
      return cb(err, null);
    }
    // first apply a jsx transformation
    data = jsx.transform(data, {
      harmony: true,
      es6module: true
    });

    cb(null, acorn.parse(data, {
      sourceType: 'module',
      ecmaVersion: "6",
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
    end: node.local.loc .end,
    name: node.local.name
  };
}

function getImports(ast) {
  //var selector = esquery.parse("[type=ImportSpecifier]");
  var selector = esquery.parse(":matches(ImportDefaultSpecifier,ImportSpecifier)"),
      res      = esquery.match(ast, selector);

  return res.map(_boundaries);
}

function hasNoUsage(ast, x) {
  var memberExpr = esquery.parse(":matches(MemberExpression[object.name=" + x.name + "], :matches(CallExpression, Property, ArrayExpression) > Identifier[name=" + x.name + "])");
  return esquery.match(ast, memberExpr).length == 0;
}

parseFile(inputFile, function (err, ast) {
  let declaredImports,
      unusedImports;

  if(err) {
    console.error(err);
    return;
  }

  declaredImports = getImports(ast);
  unusedImports = declaredImports.filter(hasNoUsage.bind(this, ast));

  // Nothing to do here, the file looks fine
  if(unusedImports.length == 0) {
    return;
  }

  // Output JSON if raw mode is requested
  if(argv.r) {
    console.log(unusedImports);
    return;
  }

  // Output vim 'matchadd' code if vim mode is requested
  if(argv.v) {
    outputVim(unusedImports);
    return;
  }

  // Output in terminal friendly mode
  var indentLevel = findIndentLevel(unusedImports);
  for (var unusedImport of unusedImports) {
    let name     = unusedImport.name,
        startPos = unusedImport.start,
        endPos   = unusedImport.end;

    var output = `${padRight(name, indentLevel)}(${inputFile} ${formatPosition(startPos, endPos)})`;
    console.log(output);
  }

  console.log("  " + "total " + unusedImports.length);
});

function outputVim(unusedImports) {
  var commands = [];
  for (var unusedImport of unusedImports) {
    let name      = unusedImport.name,
        startLine = unusedImport.start.line,
        startPos  = parseInt(unusedImport.start.column)+1,
        endPos    = parseInt(unusedImport.end.column)+1,
        output;

    output = `call matchadd('Error', '\\%${startLine}l\\%<${endPos}v.\\%>${startPos}v')`;
    commands.push(output);
  }

  console.log(':' + commands.join(' | '));
}

function padRight(str, expectedLength) {
  var pad = str;
  for(var i=str.length - expectedLength; i++; i<expectedLength) {
    pad += " ";
  }
  return pad;
}

function findIndentLevel(nodes) {
 return nodes.map(function (n) {return n.name.length}).sort(function (a,b) { return a < b})[0] + 5;
}

function formatPosition(start, end) {
  return `${start.line}:${start.column}`;
};
