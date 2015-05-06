"use strict";
import assert from 'assert';
import lib    from '../src/lib';
import {Test} from 'mocha';

const POSITIVE = 'positive',
      NEGATIVE = 'negative',

      DEFAULT_NEGATIVE_CONFIG = {
        type: NEGATIVE,
        expected: 1,
        name: "foo"
      },
      DEFAULT_POSITIVE_CONFIG = {
        type: POSITIVE
      };

let data = new Map();
// Test config
data.set("./test/fixtures/import_decl.js", DEFAULT_NEGATIVE_CONFIG);
data.set("./test/fixtures/import_decl_used.js", DEFAULT_POSITIVE_CONFIG);
data.set("./test/fixtures/import_default_decl.js", DEFAULT_NEGATIVE_CONFIG);
data.set("./test/fixtures/import_default_decl_used.js", DEFAULT_POSITIVE_CONFIG);
data.set("./test/fixtures/import_wildcard_decl.js", DEFAULT_NEGATIVE_CONFIG);
data.set("./test/fixtures/import_wildcard_decl_used.js", DEFAULT_POSITIVE_CONFIG);
data.set("./test/fixtures/import_decl_jsx.js", DEFAULT_NEGATIVE_CONFIG);
data.set("./test/fixtures/import_decl_jsx_used.js", DEFAULT_POSITIVE_CONFIG);

var suite = describe('unused', () => {
  before((done) => {
    for (let [file, config] of data) {
      var test = new Test(`should ${config.type == NEGATIVE ? '':'not '}report an unused import in ${file}`, (done) => {
        lib.parseForUnusedImports(file, (err, unused) => {
          // There should never be an error
          assert.equal(err, null);
          if(config.type == NEGATIVE) {
            assert.equal(unused.length, config.expected);
            // Import name verification is optional
            if (config.name) {
              assert.equal(unused[0].name, config.name);
            }
            done();
            return;

          }

          assert.equal(unused.length, 0);
          done();
        })
      })

      suite.addTest(test);
    }
    done();
  })

  it("(trigger for dynamic tests)", () => { })
});
