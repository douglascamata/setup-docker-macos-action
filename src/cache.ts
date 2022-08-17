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
  return `docker-setup-homebrew-cache-${cacheHash}`
}

export async function cacheFolder(
  binTools: string[],
  deps: string[],
): Promise<string[]> {
  core.startGroup('Calculating folders to cache.')
  const toCache: string[] = []
  const brewPrefixResult = await exec.getExecOutput('brew', ['--prefix'])
  if (brewPrefixResult.exitCode === 1) {
    throw new Error("Cannot determine Homebrew's cellar path.")
  }
  const brewPrefix = brewPrefixResult.stdout.trim()

  const brewOpt = core.toPlatformPath(`${brewPrefix}/opt`)
  toCache.push(brewOpt)

  const cellar = core.toPlatformPath(`${brewPrefix}/Cellar`)
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
