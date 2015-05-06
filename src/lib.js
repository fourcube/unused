"use strict";

var acorn   = require('acorn-jsx'),
    jsx     = require('react-tools'),
    esquery = require('esquery'),
    fs      = require('fs');

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
  var selector = esquery.parse(":matches(ImportDefaultSpecifier,ImportSpecifier, ImportNamespaceSpecifier)"),
      res      = esquery.match(ast, selector);

  return res.map(_boundaries);
}

function hasNoUsage(ast, x) {
  var memberExpr = esquery.parse(":matches(MemberExpression[object.name=" + x.name + "], :matches(CallExpression, Property, ArrayExpression) > Identifier[name=" + x.name + "], VariableDeclarator > Identifier.init[name=" + x.name + "], ExpressionStatement > MemberExpression > Identifier.property[name=" + x.name + "])");
  return esquery.match(ast, memberExpr).length == 0;
}

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

function _ins(o) {
  var util = require('util');
  console.log(util.inspect(o, false, null));
}

function parseForUnusedImports(path, cb) {
  parseFile(path, (err, ast) => {
    let declaredImports,
        unusedImports;
    
    // Debug output
    //_ins(esquery.match(ast, esquery.parse("*")));
    if(err) {
      return cb(err, null);
    }

    declaredImports = getImports(ast)
    unusedImports = declaredImports.filter(hasNoUsage.bind(this, ast))
    cb(null, unusedImports)
  });

}
module.exports = {
  padRight: padRight,
  findIndentLevel: findIndentLevel,
  parseFile: parseFile,
  outputVim: outputVim,
  hasNoUsage: hasNoUsage,
  getImports: getImports,
  formatPosition: formatPosition,
  parseForUnusedImports: parseForUnusedImports
};
