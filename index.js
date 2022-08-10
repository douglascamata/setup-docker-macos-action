const core = require('@actions/core');
const exec = require('@actions/exec')
const cache = require('@actions/cache')
const glob = require('@actions/glob')
const path = require("path");

async function run() {
    try {
        const cacheDeps = core.getInput('cache-homebrew-deps');
        const updateResults = await exec.exec("brew", ["update", "--preinstall"])
        if (updateResults === 1) {
            throw("Cannot update Homebrew.")
        }

        let restoredKey = undefined
        if (cacheDeps === "true") {
            const colimaDeps = exec.getExecOutput("brew", ["deps", "colima"])
            const brewCellar = exec.getExecOutput("brew", ["--cellar"])
            const brewRepository = exec.getExecOutput("brew", ["--repository"])

            await Promise.all([colimaDeps, brewCellar, brewRepository]).then(async (values) => {
                const [colimaDepsResult, brewCellarResult, brewRepositoryResult] = values
                if (colimaDepsResult.exitCode === 1) {
                    throw("Cannot determine Colima's deps.")
                }
                if (brewCellarResult.exitCode === 1) {
                    throw("Cannot determine Homebrew's cellar path.")
                }
                if (brewRepositoryResult.exitCode === 1) {
                    throw("Cannot determine Homebrew's repository path.")
                }

                const cellar = brewCellarResult.stdout.trim()
                const deps = colimaDepsResult.stdout.trim().replaceAll("\n", " ")
                const repository = brewRepositoryResult.stdout.trim()

                const toCache = []
                const cacheKeyFiles = []
                for (let dep of deps) {
                    const depPath = path.join(cellar, dep)
                    const libPathGlobber = await glob.create(`${depPath}/*/lib`)
                    toCache.push(...await libPathGlobber.glob())
                    const formulaPath = path.join(repository, "Library", "Taps", "homebrew", "homebrew-core", "Formula", `${dep}.rb`)
                    cacheKeyFiles.push(formulaPath)
                }
                const cacheKey = `brew-deps-${await glob.hashFiles(cacheKeyFiles)}`
                restoredKey = await cache.restoreCache(toCache, cacheKey)
            }).catch(reason => throw(reason))
        }

        if (restoredKey === undefined) {
            const installResult = await exec.exec("brew", ["install", "colima", "docker-client"])
            if (installResult === 1) {
                throw("Cannot install Colima and Docker client.")
            }
        }
        await cache.saveCache(toCache, cacheKey)

        exec.getExecOutput("docker", ["version"]).then(values => {
            if (values.exitCode === 1) {
                throw("Cannot get Docker client version.")
            }
            core.setOutput("docker-client-version", values.stdout.trim())
        })

        exec.getExecOutput("colima", ["version"]).then(values => {
            if (values.exitCode === 1) {
                throw("Cannot get Colima version.")
            }
            core.setOutput("colima-version", values.stdout.trim())
        })

        const startResult = await exec.exec("colima", ["start"])
        if (startResult === 1) {
            throw("Cannot started Colima.")
        }

        core.setOutput("docker-client", time);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run()