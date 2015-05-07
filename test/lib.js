import assert from 'assert';
import lib    from '../src/lib';

describe('unused', () => {
  it('should error when an invalid file is supplied', (done) => {
    lib.parseForUnusedImports('doesntexist.js', (err, _) => {
      assert.ok(err != null);
      done();
    });
  });
});
