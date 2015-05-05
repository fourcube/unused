# unused

Report unused ES6 imports in JS / JSX files.

Sample output:

```
$ cat test.js
import foo from 'bar';
import { foo as fooz } from 'bar';

//fooz.execute(foo);
//foo.fooz();
fooz.foo();

$ unused test.js
foo      (test.js 1:7)
  total 1
```

There is also a raw mode which outputs json:

```
$ unused --raw=true test.js
[ { start: { line: 1, column: 7 },
    end: { line: 1, column: 10 },
    name: 'foo' } ]
```

