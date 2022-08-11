import core from '@actions/core'
import exec from '@actions/exec'
import glob from '@actions/glob'
import io from '@actions/io'

export async function cacheKey(
  binTools: string[],
  deps: string[],
): Promise<string> {
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
  return `brew-formulae-test-${cacheHash}`
}

export async function cacheFolder(
  binTools: string[],
  deps: string[],
): Promise<string[]> {
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
    return findLibFolder(core.toPlatformPath(`${cellar}/${dep}`))
  })
  toCache.push(...(await Promise.all(libFolders)))

  return toCache.filter((result) => result)
}

async function findLibFolder(root: string): Promise<string> {
  let result: exec.ExecOutput
  try {
    result = await exec.getExecOutput('find', [
      root,
      '-type',
      'd',
      '-maxdepth',
      '2',
      '-iname',
      'lib',
    ])
  } catch (error) {
    return ''
  }
  return result.stdout
}
