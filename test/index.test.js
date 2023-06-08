import assert from 'assert/strict'
import {parseArgsWithHelp} from '../lib/index.js'
import {EOL} from 'os'
import {Transform} from 'stream'

// Record things written through a stream.  Only works for 16kb chunks.
class Record extends Transform {
  // eslint-disable-next-line class-methods-use-this
  _transform(chunk, encoding, callback) {
    callback(null, chunk)
  }
}

const MAGIC_JUMP = 'XXXXXXXXXXXXXX'
function run(config, opts) {
  return new Promise((resolve, reject) => {
    const res = {
      stderr: '',
      code: 0,
      results: null,
      error: null,
    }
    config.outputStream = new Record()
    config.outputStream.setEncoding('utf8')
      config.exit = (code) => {
      res.code = code
      res.stderr = config.outputStream.read()
      resolve(res)
      throw new Error(MAGIC_JUMP)
    }

    try {
      res.results = parseArgsWithHelp(config, opts)
      resolve(res)
    } catch (e) {
      if (e.message !== MAGIC_JUMP) {
        res.error = e
      }
      resolve(res)
    }
  })

}

async function assertHelp(config, expectedHelp, opts) {
  const res = await run({
    args: ['-h'],
    ...config
  }, opts)
  assert.equal(res.code, 64)
  assert.equal(res.stderr, expectedHelp.join(EOL) + EOL)
}

describe('parseArgsWithHelp', () => {
  it('works with no options', () => {
    assert.deepEqual(parseArgsWithHelp({args: []}), {
      positionals: [],
      values: Object.setPrototypeOf({}, null),
    })

    // In case mocha has other params passed in.
    if (process.argv.length === 2) {
      assert.deepEqual(parseArgsWithHelp(), {
        positionals: [],
        values: Object.setPrototypeOf({}, null),
      })
    }
  })

  it('errors on unexpected positionals', async() => {
    // Unexpected positionals
    const res = await run({
      args: ['foo', 'bar']
    })
    assert.equal(res.code, 64)
  })

  it('errors on invalid options', () => {
    assert.throws(() => {
      parseArgsWithHelp({
        options: {
          foo: {
            short: 'bar'
          }
        }
      })
    })
  })

  it('generates help', async() => {
    const opts = {
      width: 80,
    }
    await assertHelp({}, [
      'Usage: mocha [options]',
      '',
      'Options:',
      '  -h,--help  display help for command'
    ], opts)
    await assertHelp({ allowPositionals: true }, [
      'Usage: mocha [options] [arguments]',
      '',
      'Options:',
      '  -h,--help  display help for command'
    ], opts)
    await assertHelp({ description: 'foo bar baz' }, [
      'Usage: mocha [options]',
      '',
      'foo bar baz',
      '',
      'Options:',
      '  -h,--help  display help for command'
    ], opts)
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
    ], opts)
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
      '  -a,--apple <value>  Default: "banana"',
      '  -h,--help           display help for command',
      '  --ignore',
      '  --pear <pit>        oh.  pear. Default: "pair"'
    ], opts)
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

  it('handles choices', async() => {
    const config = {
      options: {
        foo: {
          type: 'string',
          choices: ['boo', 'bar'],
        }
      }
    }

    await assertHelp(config, [
      'Usage: mocha [options]',
      '',
      'Options:',
      '  --foo <value>  (choices: "boo", "bar")',
      '  -h,--help      display help for command',
    ], { width: 80 })

    config.options.foo.description = "Things"
    await assertHelp(config, [
      'Usage: mocha [options]',
      '',
      'Options:',
      '  --foo <value>  Things (choices: "boo", "bar")',
      '  -h,--help      display help for command',
    ], { width: 80 })

    const res = await run({
      ...config,
      args: ['--foo', 'boo']
    })
    assert.equal(res.code, 0)

    const res2 = await run({
      ...config,
      args: ['--foo', 'bbb']
    })
    assert.equal(res2.code, 64)
  })
})
