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
    try {
        const cacheDeps = core.getBooleanInput('cache-homebrew-deps');
        const updateResults = await exec.getExecOutput('brew', [
            'update',
            '--preinstall',
        ]);
        checkCommandFailure(updateResults, 'Cannot update Homebrew.');
        const colimaDepsResult = await exec.getExecOutput('brew', [
            'deps',
            'colima',
        ]);
        checkCommandFailure(colimaDepsResult, 'Cannot get Colima deps.');
        const colimaDeps = colimaDepsResult.stdout.trim().split('\n');
        let cacheHit = false;
        let cacheKey = '';
        const binTools = ['colima', 'lima', 'qemu', 'docker'];
        if (cacheDeps === true) {
            const cacheKeyPromise = brewCache.cacheKey(binTools, colimaDeps);
            const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps);
            const [folders, key] = await Promise.all([
                cacheFolderPromise,
                cacheKeyPromise,
            ]);
            const restoredKey = await cache.restoreCache(folders, key);
            if (typeof restoredKey == 'string') {
                cacheHit = true;
                cacheKey = restoredKey;
            }
            if (debug === true) {
                core.info('Cache restoration results:');
                core.info(`\tCache hit: ${cacheHit}`);
                core.info(`\tCache key: ${cacheKey}`);
            }
        }
        if (!cacheHit) {
            const installArgs = ['install', '-f', 'colima', 'docker'];
            if (debug === true) {
                installArgs.splice(1, 0, '-v');
            }
            const installResult = await exec.getExecOutput('brew', installArgs);
            checkCommandFailure(installResult, 'Cannot install Colima and Docker client.');
            if (cacheDeps) {
                const toCache = await brewCache.cacheFolder(binTools, colimaDeps);
                await cache.saveCache(toCache, cacheKey);
                core.info('Cache save results:');
                core.info(`\tCache folders: ${toCache}`);
                core.info(`\tCache key: ${cacheKey}`);
            }
        }
        else {
            core.info('Homebrew formulae restored from cache. Relinking.');
            const linkResult = await exec.getExecOutput('brew', ['link', ...binTools]);
            checkCommandFailure(linkResult, 'Cannot link Homebrew formulae.');
        }
        const startResult = await exec.getExecOutput('colima', ['start']);
        checkCommandFailure(startResult, 'Cannot started Colima.');
        const dockerVersionResult = await exec.getExecOutput('docker', ['version']);
        checkCommandFailure(dockerVersionResult, 'Cannot get Docker client version.');
        core.setOutput('docker-client-version', dockerVersionResult.stdout.trim());
        const colimaVersionResult = await exec.getExecOutput('colima', ['version']);
        checkCommandFailure(colimaVersionResult, 'Cannot get Colima version.');
        core.setOutput('colima-version', colimaVersionResult.stdout.trim());
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
