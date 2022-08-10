const exec = require('@actions/exec')
const glob = require('@actions/glob')
const path = require('path')

/**
 * @param binTools {string[]}
 * @param deps {string[]}
 * @returns {string[]}
 **/
exports.cacheKey = async function homebrewCacheKey(binTools, deps) {
  const brewRepositoryResult = await exec.getExecOutput('brew', [
    '--repository',
  ])
  if (brewRepositoryResult.exitCode === 1) {
    throw "Cannot determine Homebrew's repository path."
  }
  const repository = brewRepositoryResult.stdout.trim()
  const cacheKeyFiles = binTools.concat(deps).map((value) => {
    path.join(
      repository,
      'Library',
      'Taps',
      'homebrew',
      'homebrew-core',
      'Formula',
      `${value}.rb`,
    )
  })

  return `brew-formulae-test-${await glob.hashFiles(cacheKeyFiles.join('\n'))}`
}

/**
 * @returns {string[]}
 **/
exports.cacheFolder = async function homebrewCacheFolder(binTools, deps) {
  const toCache = []
  const brewCellarResult = await exec.getExecOutput('brew', ['--cellar'])
  if (brewCellarResult.exitCode === 1) {
    throw "Cannot determine Homebrew's cellar path."
  }

  const cellar = brewCellarResult.stdout.trim()
  const binCacheFolders = binTools.map((value) => {
    path.join(cellar, value)
  })
  toCache.push(...binCacheFolders)

  const globber = await glob.create(
    deps.map((dep) => path.join(cellar, dep, '*', 'lib')).join('\n'),
  )
  toCache.push(...(await globber.glob()))

  return toCache
}
