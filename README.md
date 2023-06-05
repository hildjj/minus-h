# minus-h

Add help generation to APIs created with Node's
[util.parseArgs()](https://nodejs.org/api/util.html#utilparseargsconfig)
function.

## Installation

```sh
npm install minus-h
```

### API

`parseArgsWithHelp()` is a function that wraps `util.parseArgs()`, adding
a "-h,--help" argument.  It takes one or two arguments.  The first argument is
an augmented version of the options passed to `util.parseArgs()`, with
descriptions provided for options as well as the command as a whole.  The second
optional argument is [options](https://github.com/cto-af/linewrap#options) for
line wrapping.  The wrapping width defaults to your terminal width (via
[process.stdout.columns](https://nodejs.org/api/tty.html#writestreamcolumns)).

```js
import {parseArgsWithHelp} from 'minus-h'

parseArgsWithHelp({
  description: 'A command that does something very interesting',
  argumentName: 'files',
  argumentDescription: 'the files to be processed',
  allowPositionals: true,
  options: {
    encoding: {
      type: 'string',
      argumentName: 'encoding',
      description: 'encoding for files read or written',
    },
  },
}, { width: 80 })
```

`node example.js --help` outputs the following to stderr, before exiting with
exit code 64:

```
Usage: example [options] [files]

A command that does something very interesting

Arguments:
  files                  the files to be processed

Options:
  --encoding <encoding>  encoding for files read or written
  -h,--help              display help for command
```

The `usage()` function takes the same two parameters.  It always writes
help information to output, then exits.  It is useful if you've detected a
higher level error condition with your input parameters, and want to re-iterate
the usage information to users as if they had used `--help`.

## Testing

Two more parameters may be added to the configuration parameter:

- `outputStream`: a writable stream to write the help text to.  Defaults to
  `process.stderr`.  Only the `write` method is ever called.
- `exit()`: a function that takes a number that is called when output is
   complete.  Defaults to `process.exit`.

These options are useful during testing so that you can catch the help text
that would have been written, and prevent your test harness from actually
exiting.

---
badges
