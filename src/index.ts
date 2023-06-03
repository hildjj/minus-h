import * as path from 'path'
import { EOL } from 'os'
import { LineWrap } from '@cto.af/linewrap'
import { parseArgs } from 'util'

import type { Writable } from 'stream'

type LineWrapOptions = ConstructorParameters<typeof LineWrap>[0]

// This is copied in from
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/e858f398c44ef759a64dd49854fd3470e6b65731/types/node/util.d.ts#L1254
//
// The original types there do not export enough of the intermediate types so
// that the new properties can be grafted on more easily than this.

interface ParseArgsOptionConfig {
  /**
   * Type of argument.
   */
  type: 'boolean' | 'string';
  /**
   * Whether this option can be provided multiple times.
   * If `true`, all values will be collected in an array.
   * If `false`, values for the option are last-wins.
   * @default false.
   */
  multiple?: boolean | undefined;
  /**
   * A single character alias for the option.
   */
  short?: string | undefined;
  /**
   * The default option value when it is not set by args.
   * It must be of the same type as the the `type` property.
   * When `multiple` is `true`, it must be an array.
   * @since v18.11.0
   */
  default?: boolean[] | string[] | boolean | string | undefined;
  /**
   * Description of the argument, for generating help text.
   * @since minus-h
   */
  description?: string | undefined;
  /**
   * If the type is 'string, what should the argument be called in the
   * documentation?
   * @since minus-h
   */
  argumentName?: string | undefined;
}
interface ParseArgsOptionsConfig {
  [longOption: string]: ParseArgsOptionConfig;
}
export interface ParseArgsConfig {
  /**
   * Array of argument strings.
   */
  args?: string[] | undefined;
  /**
   * Used to describe arguments known to the parser.
   */
  options?: ParseArgsOptionsConfig | undefined;
  /**
   * Should an error be thrown when unknown arguments are encountered,
   * or when arguments are passed that do not match the `type` configured in `options`.
   * @default true
   */
  strict?: boolean | undefined;
  /**
   * Whether this command accepts positional arguments.
   */
  allowPositionals?: boolean | undefined;
  /**
   * Return the parsed tokens. This is useful for extending the built-in behavior,
   * from adding additional checks through to reprocessing the tokens in different ways.
   * @default false
   */
  tokens?: boolean | undefined;

  /**
   * Description of the script as a whole, for generating help text.
   * @since minus-h
   */
  description?: string | undefined;
  /**
   * If positiionals are allowed, what name should be used to refer to them in
   * the documentation?  Defaults to "arguments".
   *
   * @since minus-h
   */
  argumentName?: string | undefined;
  /**
   * Long description for the positional arguments.
   *
   * @since minus-h
   */
  argumentDescription?: string | undefined;
  /**
   * Where to output help?  Useful for testing.  Defaults to stderr.
   */
  outputStream?: Writable;
  /**
   * What to do after writing help to outputStream.  Useful for testing.
   * Defaults to process.exit.  Called with 64 as the only parameter.
   */
  exit?: typeof process.exit;
}

export function *generateHelp<T extends ParseArgsConfig>(
  config: T,
  opts: LineWrapOptions
): Generator<string> {
  const lw = new LineWrap({
    width: process.stdout.columns,
    ...opts,
  })

  const { name } = path.parse(process.argv[1])
  let usage = `Usage: ${name}`
  let max = -Infinity
  if (config.options) {
    usage += ' [options]'
    for (const [long, info] of Object.entries(config.options)) {
      let len = long.length + 2 // --
      if (info.short) {
        len += 3 // ,-s
      }
      if (info.type === 'string') {
        const argName = info.argumentName ?? 'string'
        len += argName.length + 3
      }
      max = Math.max(len, max)
    }
  }
  if (config.allowPositionals || (config.strict === false)) {
    const argName = config.argumentName ?? 'arguments'
    usage += ` [${argName}]`
    max = Math.max(argName.length, max)
  }
  yield usage
  yield ''

  if (config.description) {
    yield *lw.lines(config.description)
    yield ''
  }

  max += 4 // 2 on each side
  const w = opts?.width ?? process.stdout.columns
  const indented = new LineWrap({
    ...opts,
    indent: max,
    indentFirst: false,
    width: Math.max(max + 2, w),  // At least two chars per line
  })

  if (config.argumentDescription) {
    yield 'Arguments:'
    const wrapped = indented.lines(config.argumentDescription)
    yield `  ${config.argumentName}`.padEnd(max, ' ') + wrapped.next().value
    yield *wrapped
    yield ''
  }

  if (config.options) {
    yield 'Options:'
    const sorted = Object
      .entries(config.options)
      .sort(([longA, infoA], [longB, infoB]) => {
        const a = infoA.short ?? longA
        const b = infoB.short ?? longB
        return a.localeCompare(b)
      })
    for (const [long, info] of sorted) {
      let param = `--${long}`
      if (info.short) {
        param = `-${info.short},${param}`
      }
      if (info.type === 'string') {
        const argName = info.argumentName ?? 'string'
        param += ` <${argName}>`
      }
      param = `  ${param}`
      let desc = info.description ?? ''
      if (info.default != null) {
        if (desc) {
          desc += ' '
        }
        desc += `Default: ${JSON.stringify(info.default)}`
      }
      if (desc) {
        const wrapped = indented.lines(desc)
        yield param.padEnd(max, ' ') + wrapped.next().value
        yield *wrapped
      } else {
        yield param
      }
    }
  }
}

type ParsedResults<T extends ParseArgsConfig> = ReturnType<typeof parseArgs<T>>
interface HelpResult {
  help: boolean;
}

export function parseArgsWithHelp<T extends ParseArgsConfig>(
  config?: T,
  options?: LineWrapOptions
): ParsedResults<T> {
  if (!config) {
    config = {} as T
  }
  if (!config.options) {
    config.options = {}
  }
  if (!config.options.help) {
    config.options.help = {
      short: 'h',
      type: 'boolean',
      description: 'display help for command',
    }
  }
  const results = parseArgs(config)
  if ((results.values as HelpResult).help) {
    config.outputStream ??= process.stderr
    config.exit ??= process.exit
    for (const line of generateHelp<T>(config, options)) {
      config.outputStream.write(line)
      config.outputStream.write(EOL)
    }
    config.exit(64)
  }
  return results
}
