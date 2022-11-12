"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache = __importStar(require("@actions/cache"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const brewCache = __importStar(require("./cache"));
async function run() {
    const debug = core.getBooleanInput('debug');
    const cacheDeps = core.getBooleanInput('cache-homebrew-deps');
    try {
        core.startGroup('Updating Homebrew');
        const updateResults = await exec.getExecOutput('brew', ['update', '--preinstall'], { silent: !debug });
        checkCommandFailure(updateResults, 'Error updating Homebrew.');
        core.endGroup();
        core.startGroup("Fetching list of Colima's brew deps.");
        const colimaDepsResult = await exec.getExecOutput('brew', ['deps', 'colima'], { silent: !debug });
        checkCommandFailure(colimaDepsResult, "Error getting Colima's brew deps.");
        const colimaDeps = colimaDepsResult.stdout.trim().split('\n');
        core.endGroup();
        let cacheHit = false;
        let cacheKey = '';
        const binTools = ['colima', 'lima', 'qemu', 'docker'];
        if (cacheDeps) {
            core.startGroup('Preparing to restore cache.');
            const cacheKeyPromise = brewCache.cacheKey(binTools, colimaDeps);
            const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps);
            const [folders, key] = await Promise.all([
                cacheFolderPromise,
                cacheKeyPromise,
            ]);
            core.endGroup();
            core.startGroup('Attempting to restore cache.');
            const restoredKey = await cache.restoreCache(folders, key);
            core.info(`Trying to restore with key: ${key}. Got back key: ${restoredKey}`);
            cacheHit = Boolean(restoredKey);
            cacheKey = key;
            if (debug) {
                core.info('Cache restoration results:');
                core.info(`\tCache hit: ${cacheHit}`);
                core.info(`\tCache folders: ${folders}`);
                core.info(`\tCache key: ${cacheKey}`);
            }
            core.endGroup();
        }
        if (!cacheHit) {
            core.startGroup('Installing Colima and Docker Client');
            const installResult = await exec.getExecOutput('brew', ['install', '-f', 'colima', 'docker'], {
                silent: !debug,
                env: {
                    HOMEBREW_NO_AUTO_UPDATE: '1',
                    HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK: '1',
                    ...process.env,
                },
            });
            checkCommandFailure(installResult, 'Error installing Colima and Docker client.');
            core.endGroup();
            if (cacheDeps) {
                core.startGroup('Preparing to save cache.');
                const toCache = await brewCache.cacheFolder(binTools, colimaDeps);
                await cache.saveCache(toCache, cacheKey);
                core.info('Cache save results:');
                core.info(`\tCache folders: ${toCache}`);
                core.info(`\tCache key: ${cacheKey}`);
                core.endGroup();
            }
        }
        else {
            core.startGroup('Relinking formulae after cache restoration.');
            core.info('Homebrew formulae restored from cache. Relinking.');
            const linkResult = await exec.getExecOutput('brew', ['link', '--overwrite', ...binTools], { silent: !debug });
            checkCommandFailure(linkResult, 'Error relinking Homebrew formulae.');
            core.endGroup();
        }
        core.startGroup('Starting Colima.');
        const startResult = await exec.getExecOutput('colima', ['start']);
        checkCommandFailure(startResult, 'Error starting Colima.');
        core.endGroup();
        core.startGroup('Setting outputs');
        const dockerVersionResult = await exec.getExecOutput('docker', ['version']);
        checkCommandFailure(dockerVersionResult, 'Error getting Docker client version.');
        core.setOutput('docker-client-version', dockerVersionResult.stdout.trim());
        const colimaVersionResult = await exec.getExecOutput('colima', ['version']);
        checkCommandFailure(colimaVersionResult, 'Error getting Colima version.');
        core.setOutput('colima-version', colimaVersionResult.stdout.trim());
        core.endGroup();
    }
    catch (error) {
        core.setFailed(error.message);
        if (debug === true) {
            throw error;
        }
    }
}
function checkCommandFailure(result, errMsg) {
    if (result.exitCode === 1) {
        throw errMsg;
    }
}
run();
