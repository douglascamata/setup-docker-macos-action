const core = require('@actions/core')
const exec = require('@actions/exec')
const io = require('@actions/io')
const cache = require('@actions/cache')
const brewCache = require('./cache.js')

debug = core.getBooleanInput('debug')

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
      const cacheKeyPromise = brewCache.cacheKey(binTools, colimaDeps)
      cacheKeyPromise.then((key) => {
        cacheKey = key
      })
      const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps)
      const [folders, key] = await Promise.all([
        cacheFolderPromise,
        cacheKeyPromise,
      ])
      await cache.restoreCache(folders, key).then((restoredKey) => {
        cacheHit = restoredKey
      })
      if (debug === true) {
        console.log('Cache restoration results:')
        console.log(`\tCache hit: ${cacheHit}`)
        console.log(`\tCache key: ${cacheKey}`)
      }
    }

    if (cacheHit === undefined) {
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
        const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps)
        await cacheFolderPromise.then((toCache) => {
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
  } catch (error) {
    core.setFailed(error.message)
    if (debug === true) {
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
