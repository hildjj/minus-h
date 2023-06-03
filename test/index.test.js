import assert from 'assert/strict'
import {parseArgsWithHelp} from '../lib/index.js'
import {EOL} from 'os'

function addEOL(array) {
  return
}
function assertHelp(config, expectedHelp, opts) {
  return new Promise(resolve => {
    const stderr = []
    parseArgsWithHelp({
      args: ["-h"],
      outputStream: {
        write(chunk) {
          stderr.push(chunk)
        }
      },
      exit(code) {
        assert.equal(code, 64)
        assert.deepEqual(stderr.filter(s => s !== EOL), expectedHelp)
        resolve()
      },
      ...config
    }, opts)
  })
}

describe('parseArgsWithHelp', () => {
  it('works with no options', () => {
    assert.deepEqual(parseArgsWithHelp({args: []}), {
      positionals: [],
      values: Object.setPrototypeOf({}, null),
    })
    assert.throws(() => parseArgsWithHelp({args: ['foo', 'bar']}))

    // In case mocha has other params passed in.
    if (process.argv.length === 2) {
      assert.deepEqual(parseArgsWithHelp(), {
        positionals: [],
        values: Object.setPrototypeOf({}, null),
      })
    }
  })

  it('generates help', async() => {
    await assertHelp({}, [
      'Usage: mocha [options]',
      '',
      'Options:',
      '  -h,--help  display help for command'
    ])
    await assertHelp({ allowPositionals: true }, [
      'Usage: mocha [options] [arguments]',
      '',
      'Options:',
      '  -h,--help  display help for command'
    ])
    await assertHelp({ description: 'foo bar baz' }, [
      'Usage: mocha [options]',
      '',
      'foo bar baz',
      '',
      'Options:',
      '  -h,--help  display help for command'
    ])
    await assertHelp({
      allowPositionals: true,
      argumentDescription: 'foo bar baz',
      argumentName: 'looble'
    }, [
      'Usage: mocha [options] [looble]',
      '',
      'Arguments:',
      '  looble     foo bar baz',
      '',
      'Options:',
      '  -h,--help  display help for command'
    ])
    await assertHelp({
      options: {
        'ignore': {
          type: 'boolean',
        },
        'apple': {
          type: 'string',
          short: 'a',
          default: 'banana',
        },
        'pear': {
          type: 'string',
          default: 'pair',
          description: 'oh.  pear.',
          argumentName: 'pit'
        }
      }
    }, [
      'Usage: mocha [options]',
      '',
      'Options:',
      '  -a,--apple <string>  Default: "banana"',
      '  -h,--help            display help for command',
      '  --ignore',
      '  --pear <pit>         oh.  pear. Default: "pair"'
    ])
  })

  it('handles narrow terms', async() => {
    await assertHelp({}, [
      'Usage: mocha [options]',
      '',
      'Options:',
      '  -h,--help  display',
      '             help',
      '             for',
      '             command'
    ], { width: 10 })
  })
})
