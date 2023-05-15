import {dirname} from 'node:path'
import {promisify} from 'node:util'
import {isBuiltin} from 'node:module'
import {pathToFileURL, fileURLToPath} from 'node:url'

import _resolve from 'resolve'
import {resolve as resolveTs} from 'ts-node/esm'
import {loadConfig, createMatchPath} from 'tsconfig-paths'

const resolveAsync = promisify(_resolve)
const {absoluteBaseUrl, paths} = loadConfig()
const matchPath = createMatchPath(absoluteBaseUrl, paths)

export async function resolve(specifier, ctx, next) {
  if (isBuiltin(specifier)) return next(specifier, ctx)

  const {parentURL} = ctx

  let match = matchPath(specifier)

  if (match) specifier = match

  if (parentURL) {
    await resolveAsync(specifier, {
      basedir: dirname(fileURLToPath(parentURL)),
      extensions: ['.ts', '.js', '.mjs', '.node']
    }).then(v => specifier = v).catch(() => {})
  }

  match = matchPath(specifier)

  return match ? resolveTs(pathToFileURL(`${match}`).href, ctx, next) : resolveTs(specifier, ctx, next)
}

export {load, transformSource} from 'ts-node/esm'
