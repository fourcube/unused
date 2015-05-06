#!/usr/bin/env node
"use strict";

let argv = require('yargs')
            .usage('Usage: $0 [options] <file>')
            .alias('r', 'raw')
            .describe('r', 'Output raw json data')
            .alias('v', 'vim')
            .describe('v', 'Output vim matchers')
            .demand(1)
            .argv,
    lib  = require('./lib'),
    inputFile = argv._[0];

lib.parseForUnusedImports(inputFile, function (err, unusedImports) {

  if(err) {
    console.error(err);
    return;
  }

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
    lib.outputVim(unusedImports);
    return;
  }

  // Output in terminal friendly mode
  var indentLevel = lib.findIndentLevel(unusedImports);
  for (var unusedImport of unusedImports) {
    let name     = unusedImport.name,
        startPos = unusedImport.start,
        endPos   = unusedImport.end;

    var output = `${lib.padRight(name, indentLevel)}(${inputFile} ${lib.formatPosition(startPos, endPos)})`;
    console.log(output);
  }

  console.log("  " + "total " + unusedImports.length);
});

