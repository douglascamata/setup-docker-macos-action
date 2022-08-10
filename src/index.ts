import core from '@actions/core'
import exec from '@actions/exec'
import cache from '@actions/cache'
import * as brewCache from './cache'

async function run(): Promise<void> {
  const debug = core.getBooleanInput('debug')
  try {
    const cacheDeps = core.getBooleanInput('cache-homebrew-deps')
    const updateResults = await exec.exec('brew', ['update', '--preinstall'])
    checkCommandFailure(updateResults, 'Cannot update Homebrew.')

    const colimaDepsResult = await exec.getExecOutput('brew', [
      'deps',
      'colima',
    ])
    checkCommandFailure(colimaDepsResult.exitCode, 'Cannot get Colima deps.')
    const colimaDeps = colimaDepsResult.stdout.trim().split('\n')

    let cacheHit = false
    let cacheKey = ''
    const binTools = ['colima', 'lima', 'qemu', 'docker']
    if (cacheDeps === true) {
      const cacheKeyPromise = brewCache
        .cacheKey(binTools, colimaDeps)
        .then((key) => {
          console.log(`Returned key: ${key}`)
          cacheKey = key
          console.log(`Updated cacheKey: ${cacheKey}`)
          return key
        })
      const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps)
      const [folders, key] = await Promise.all([
        cacheFolderPromise,
        cacheKeyPromise,
      ])
      cacheHit = Boolean(await cache.restoreCache(folders, key))
      if (debug === true) {
        console.log('Cache restoration results:')
        console.log(`\tCache hit: ${cacheHit}`)
        console.log(`\tCache key: ${cacheKey}`)
      }
    }

    if (cacheHit === false) {
      const installArgs = ['install', '-f', 'colima', 'docker']
      if (debug === true) {
        installArgs.splice(1, 0, '-v')
      }
      const installResult = await exec.exec('brew', installArgs)
      checkCommandFailure(
        installResult,
        'Cannot install Colima and Docker client.',
      )

      if (cacheDeps === true) {
        await brewCache.cacheFolder(binTools, colimaDeps).then((toCache) => {
          cache.saveCache(toCache, cacheKey)
          console.log('Cache save results:')
          console.log(`\tCache folders: ${toCache}`)
          console.log(`\tCache key: ${cacheKey}`)
        })
      }
    } else {
      console.log('Homebrew formulae restored from cache. Relinking.')
      const linkResult = await exec.getExecOutput('brew', ['link', ...binTools])
      checkCommandFailure(linkResult.exitCode, 'Cannot link Homebrew formulae.')
    }

    const startResult = await exec.exec('colima', ['start'])
    checkCommandFailure(startResult, 'Cannot started Colima.')

    exec.getExecOutput('docker', ['version']).then((values) => {
      checkCommandFailure(values.exitCode, 'Cannot get Docker client version.')
      core.setOutput('docker-client-version', values.stdout.trim())
    })

    exec.getExecOutput('colima', ['version']).then((values) => {
      checkCommandFailure(values.exitCode, 'Cannot get Colima version.')
      core.setOutput('colima-version', values.stdout.trim())
    })
  } catch (error: unknown) {
    core.setFailed((error as Error).message)
    if (debug === true) {
      throw error
    }
  }
}

function checkCommandFailure(result: number, errMsg: string): void {
  if (result === 1) {
    throw errMsg
  }
}

run()
