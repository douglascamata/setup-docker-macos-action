import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as io from '@actions/io'

export async function cacheKey(
  binTools: string[],
  deps: string[],
): Promise<string> {
  core.startGroup('Calculating cache key.')
  const brewRepositoryResult = await exec.getExecOutput('brew', [
    '--repository',
  ])
  if (brewRepositoryResult.exitCode === 1) {
    throw new Error("Cannot determine Homebrew's repository path.")
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
  const cacheHash = await glob.hashFiles(cacheKeyFiles.join('\n'))
  core.endGroup()
  return `homebrew-formulae-cache-${cacheHash}`
}

export async function cacheFolder(
  binTools: string[],
  deps: string[],
): Promise<string[]> {
  core.startGroup('Calculating folders to cache.')
  const toCache: string[] = []
  const brewCellarResult = await exec.getExecOutput('brew', ['--cellar'])
  if (brewCellarResult.exitCode === 1) {
    throw new Error("Cannot determine Homebrew's cellar path.")
  }

  const cellar = brewCellarResult.stdout.trim()
  const binCacheFolders = binTools.map((value) => {
    return core.toPlatformPath(`${cellar}/${value}`)
  })
  toCache.push(...binCacheFolders)

  const libFolders = deps.map(async (dep) => {
    return core.toPlatformPath(`${cellar}/${dep}`)
  })
  toCache.push(...(await Promise.all(libFolders)))

  core.endGroup()
  return toCache.filter((result) => result)
}
