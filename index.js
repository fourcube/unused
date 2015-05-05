#!/usr/bin/env node

var acorn   = require('acorn-jsx'),
    jsx     = require('react-tools'),
    esquery = require('esquery'),
    fs      = require('fs')
    argv    = require('yargs')
                .usage('Usage: $0 [--raw=true] <file>')
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
  var declaredImports;

  if(err) {
    console.error(err);
    return;
  }

  //console.log(esquery.match(ast, esquery.parse("*")));
  declaredImports = getImports(ast);
  unusedImports = declaredImports.filter(hasNoUsage.bind(this, ast));

  if(unusedImports.length == 0) {
    return;
  }

  // Output JSON if raw mode is requested
  if(argv.raw) {
    console.log(unusedImports);
    return;
  }

  var indentLevel = findIndentLevel(unusedImports);
  unusedImports.forEach(function (x) {
    console.log(padRight(x.name, indentLevel) +  "(" + inputFile + " " + formatPosition(x.start, x.end) + ")");
  });

  console.log("  " + "total " + unusedImports.length);
});

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
  return start.line + ":" + start.column ;
};
