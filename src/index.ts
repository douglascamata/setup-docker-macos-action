import core from '@actions/core'
import exec from '@actions/exec'
import cache from '@actions/cache'
import * as brewCache from './cache'

async function run(): Promise<void> {
  const debug = core.getBooleanInput('debug')
  try {
    const cacheDeps = core.getBooleanInput('cache-homebrew-deps')
    const updateResults = await exec.getExecOutput('brew', [
      'update',
      '--preinstall',
    ])
    checkCommandFailure(updateResults, 'Cannot update Homebrew.')

    const colimaDepsResult = await exec.getExecOutput('brew', [
      'deps',
      'colima',
    ])
    checkCommandFailure(colimaDepsResult, 'Cannot get Colima deps.')
    const colimaDeps = colimaDepsResult.stdout.trim().split('\n')

    let cacheHit = false
    let cacheKey = ''
    const binTools = ['colima', 'lima', 'qemu', 'docker']
    if (cacheDeps === true) {
      const cacheKeyPromise = brewCache.cacheKey(binTools, colimaDeps)
      const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps)
      const [folders, key] = await Promise.all([
        cacheFolderPromise,
        cacheKeyPromise,
      ])
      cacheKey = key
      cacheHit = Boolean(await cache.restoreCache(folders, key))
      if (debug === true) {
        core.info('Cache restoration results:')
        core.info(`\tCache hit: ${cacheHit}`)
        core.info(`\tCache key: ${cacheKey}`)
      }
    }

    if (cacheHit === false) {
      const installArgs = ['install', '-f', 'colima', 'docker']
      if (debug === true) {
        installArgs.splice(1, 0, '-v')
      }
      const installResult = await exec.getExecOutput('brew', installArgs)
      checkCommandFailure(
        installResult,
        'Cannot install Colima and Docker client.',
      )

      if (cacheDeps === true) {
        const toCache = await brewCache.cacheFolder(binTools, colimaDeps)
        await cache.saveCache(toCache, cacheKey)
        core.info('Cache save results:')
        core.info(`\tCache folders: ${toCache}`)
        core.info(`\tCache key: ${cacheKey}`)
      }
    } else {
      core.info('Homebrew formulae restored from cache. Relinking.')
      const linkResult = await exec.getExecOutput('brew', ['link', ...binTools])
      checkCommandFailure(linkResult, 'Cannot link Homebrew formulae.')
    }

    const startResult = await exec.getExecOutput('colima', ['start'])
    checkCommandFailure(startResult, 'Cannot started Colima.')

    const dockerVersionResult = await exec.getExecOutput('docker', ['version'])
    checkCommandFailure(
      dockerVersionResult,
      'Cannot get Docker client version.',
    )
    core.setOutput('docker-client-version', dockerVersionResult.stdout.trim())

    const colimaVersionResult = await exec.getExecOutput('colima', ['version'])
    checkCommandFailure(colimaVersionResult, 'Cannot get Colima version.')
    core.setOutput('colima-version', colimaVersionResult.stdout.trim())
  } catch (error: unknown) {
    core.setFailed((error as Error).message)
    if (debug === true) {
      throw error
    }
  }
}

function checkCommandFailure(result: exec.ExecOutput, errMsg: string): void {
  if (result.exitCode === 1) {
    throw errMsg
  }
}

run()
