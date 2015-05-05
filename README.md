# unused

Report unused ES6 imports in JS / JSX files. Supports output of vim commands that highlight all unused imports.

Sample output:

```bash
$ cat test.js
```

```js
import foo from 'bar';
import { foo as fooz } from 'bar';

//fooz.execute(foo);
//foo.fooz();
fooz.foo();
```
```bash
$ unused test.js
foo      (test.js 1:7)
  total 1
```

There is also a raw mode which outputs json:

```bash
$ unused --raw=true test.js
```
```js
[ { start: { line: 1, column: 7 },
    end: { line: 1, column: 10 },
    name: 'foo' } ]
```


Vim output mode:

```bash
$ unused -v true test.js
```
```vim
:call matchadd('Error', '\%1l\%<11v.\%>8v')
```
