import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'

import * as brewCache from './cache'

async function run(): Promise<void> {
  const debug = core.getBooleanInput('debug')
  try {
    const cacheDeps = core.getBooleanInput('cache-homebrew-deps')
    core.startGroup('Updating Homebrew')
    const updateResults = await exec.getExecOutput(
      'brew',
      ['update', '--preinstall'],
      { silent: !debug },
    )

    checkCommandFailure(updateResults, 'Cannot update Homebrew.')
    core.endGroup()

    core.startGroup("Fetching list of Colima's dependencies")
    const colimaDepsResult = await exec.getExecOutput(
      'brew',
      ['deps', 'colima'],
      { silent: !debug },
    )
    checkCommandFailure(colimaDepsResult, 'Cannot get Colima deps.')
    const colimaDeps = colimaDepsResult.stdout.trim().split('\n')
    core.endGroup()

    let cacheHit = false
    let cacheKey = ''
    const binTools = ['colima', 'lima', 'qemu', 'docker']
    if (cacheDeps) {
      core.startGroup('Preparing to restore cache.')
      const cacheKeyPromise = brewCache.cacheKey(binTools, colimaDeps)
      const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps)
      const [folders, key] = await Promise.all([
        cacheFolderPromise,
        cacheKeyPromise,
      ])
      core.endGroup()

      core.startGroup('Attempt to restore cache.')
      await Promise.all(folders.map(async (folder) => io.rmRF(folder)))
      const restoredKey = await cache.restoreCache(folders, key)
      core.info(
        `Trying to store with key: ${key}. Got back key: ${restoredKey}`,
      )
      cacheHit = Boolean(restoredKey)
      cacheKey = key
      if (debug) {
        core.info('Cache restoration results:')
        core.info(`\tCache hit: ${cacheHit}`)
        core.info(`\tCache key: ${cacheKey}`)
        core.info(`\tCache folders: ${folders}`)
      }
      core.endGroup()
    }

    if (!cacheHit) {
      core.startGroup('Installing Colima and Docker Client')
      const installResult = await exec.getExecOutput(
        'brew',
        ['install', '-f', 'colima', 'docker'],
        {
          silent: !debug,
          env: { HOMEBREW_NO_AUTO_UPDATE: '1', ...process.env },
        },
      )
      checkCommandFailure(
        installResult,
        'Cannot install Colima and Docker client.',
      )
      core.endGroup()

      if (cacheDeps) {
        core.startGroup('Preparing to save cache.')
        const toCache = await brewCache.cacheFolder(binTools, colimaDeps)
        await cache.saveCache(toCache, cacheKey)
        core.info('Cache save results:')
        core.info(`\tCache folders: ${toCache}`)
        core.info(`\tCache key: ${cacheKey}`)
        core.endGroup()
      }
    } else {
      core.startGroup('Relinking formulae after cache restoration.')
      core.info('Homebrew formulae restored from cache. Relinking.')
      const linkResult = await exec.getExecOutput(
        'brew',
        ['link', '--overwrite', ...binTools, ...colimaDeps],
        { silent: !debug },
      )
      checkCommandFailure(linkResult, 'Cannot link Homebrew formulae.')
      core.endGroup()
    }

    core.startGroup('Starting Colima.')
    const startResult = await exec.getExecOutput('colima', ['start'])
    checkCommandFailure(startResult, 'Cannot started Colima.')
    core.endGroup()

    core.startGroup('Setting outputs')
    const dockerVersionResult = await exec.getExecOutput('docker', ['version'])
    checkCommandFailure(
      dockerVersionResult,
      'Cannot get Docker client version.',
    )
    core.setOutput('docker-client-version', dockerVersionResult.stdout.trim())

    const colimaVersionResult = await exec.getExecOutput('colima', ['version'])
    checkCommandFailure(colimaVersionResult, 'Cannot get Colima version.')
    core.setOutput('colima-version', colimaVersionResult.stdout.trim())
    core.endGroup()
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
