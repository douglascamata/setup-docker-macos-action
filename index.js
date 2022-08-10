const core = require('@actions/core')
const exec = require('@actions/exec')
const io = require('@actions/io')
const cache = require('@actions/cache')
const brewCache = require('./cache.js')

async function run() {
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

    let cacheHit = undefined
    let cacheKey = ''
    const binTools = ['colima', 'lima', 'qemu', 'docker']
    if (cacheDeps === true) {
      const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps)
      const cacheKeyPromise = brewCache.cacheKey(binTools, colimaDeps)
      await Promise.all([cacheFolderPromise, cacheKeyPromise]).then(
        async ([toCache, cacheKey]) => {
          cacheHit = await cache.restoreCache(toCache, cacheKey)
        },
      )
    }

    if (cacheHit === undefined) {
      const installResult = await exec.exec(
        'brew',
        ['install', 'colima', 'docker'],
        {
          env: {
            HOMEBREW_NO_AUTO_UPDATE: '1',
            HOMEBREW_NO_INSTALL_CLEANUP: '1',
            HOMEBREW_NO_INSTALL_UPGRADE: '1',
          },
        },
      )
      checkCommandFailure(
        installResult,
        'Cannot install Colima and Docker client.',
      )

      if (cacheDeps === true) {
        await cache.saveCache(
          await brewCache.cacheFolder(binTools, colimaDeps),
          cacheKey,
        )
      }
    } else {
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
  } catch (error) {
    core.setFailed(error.message)
    if (core.getBooleanInput('debug') === true) {
      throw error
    }
  }
}

function checkCommandFailure(result, errMsg) {
  if (result === 1) {
    throw errMsg
  }
}

run()
