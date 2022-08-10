const exec = require('@actions/exec')
const glob = require('@actions/glob')
const core = require('@actions/core')
const io = require('@actions/io')

/**
 * @param binTools {string[]}
 * @param deps {string[]}
 **/
exports.cacheKey = async function homebrewCacheKey(binTools, deps) {
  const brewRepositoryResult = await exec.getExecOutput('brew', [
    '--repository',
  ])
  if (brewRepositoryResult.exitCode === 1) {
    throw "Cannot determine Homebrew's repository path."
  }
  const repository = brewRepositoryResult.stdout.trim()
  const cacheKeyFiles = await Promise.all(
    binTools.concat(deps).map((value) => {
      const originalFile = core.toPlatformPath(
        `${repository}/Library/Taps/homebrew/homebrew-core/Formula/${value}.rb`,
      )
      const githubWorkspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd()
      const destinationFile = core.toPlatformPath(
        `${githubWorkspace}/brew-cache-${value}.rb`,
      )
      io.cp(originalFile, destinationFile)
      return destinationFile
    }),
  )
  const cacheHash = await glob.hashFiles(cacheKeyFiles.join('\n'), null, true)
  return `brew-formulae-test-${cacheHash}`
}

/**
 * @param binTools {string[]}
 * @param deps {string[]}
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
    return core.toPlatformPath(`${cellar}/${value}`)
  })
  toCache.push(...binCacheFolders)

  const libFolders = deps.map((dep) => {
    return findLibFolder(core.toPlatformPath(`${cellar}/${dep}`))
  })
  toCache.push(...(await Promise.all(libFolders)))

  return toCache.filter((result) => result)
}

/**
 * @param root {string}
 **/
async function findLibFolder(root) {
  return exec
    .getExecOutput('find', [
      root,
      '-type',
      'd',
      '-maxdepth',
      '2',
      '-iname',
      'lib',
    ])
    .then((value) => {
      return value.stdout
    })
    .catch(() => {
      return ''
    })
}
