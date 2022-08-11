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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importDefault(require("@actions/core"));
const exec_1 = __importDefault(require("@actions/exec"));
const cache_1 = __importDefault(require("@actions/cache"));
const brewCache = __importStar(require("./cache"));
async function run() {
    const debug = core_1.default.getBooleanInput('debug');
    try {
        const cacheDeps = core_1.default.getBooleanInput('cache-homebrew-deps');
        const updateResults = await exec_1.default.getExecOutput('brew', [
            'update',
            '--preinstall',
        ]);
        checkCommandFailure(updateResults, 'Cannot update Homebrew.');
        const colimaDepsResult = await exec_1.default.getExecOutput('brew', [
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
            cacheKey = key;
            cacheHit = Boolean(await cache_1.default.restoreCache(folders, key));
            if (debug === true) {
                core_1.default.info('Cache restoration results:');
                core_1.default.info(`\tCache hit: ${cacheHit}`);
                core_1.default.info(`\tCache key: ${cacheKey}`);
            }
        }
        if (cacheHit === false) {
            const installArgs = ['install', '-f', 'colima', 'docker'];
            if (debug === true) {
                installArgs.splice(1, 0, '-v');
            }
            const installResult = await exec_1.default.getExecOutput('brew', installArgs);
            checkCommandFailure(installResult, 'Cannot install Colima and Docker client.');
            if (cacheDeps === true) {
                const toCache = await brewCache.cacheFolder(binTools, colimaDeps);
                await cache_1.default.saveCache(toCache, cacheKey);
                core_1.default.info('Cache save results:');
                core_1.default.info(`\tCache folders: ${toCache}`);
                core_1.default.info(`\tCache key: ${cacheKey}`);
            }
        }
        else {
            core_1.default.info('Homebrew formulae restored from cache. Relinking.');
            const linkResult = await exec_1.default.getExecOutput('brew', ['link', ...binTools]);
            checkCommandFailure(linkResult, 'Cannot link Homebrew formulae.');
        }
        const startResult = await exec_1.default.getExecOutput('colima', ['start']);
        checkCommandFailure(startResult, 'Cannot started Colima.');
        const dockerVersionResult = await exec_1.default.getExecOutput('docker', ['version']);
        checkCommandFailure(dockerVersionResult, 'Cannot get Docker client version.');
        core_1.default.setOutput('docker-client-version', dockerVersionResult.stdout.trim());
        const colimaVersionResult = await exec_1.default.getExecOutput('colima', ['version']);
        checkCommandFailure(colimaVersionResult, 'Cannot get Colima version.');
        core_1.default.setOutput('colima-version', colimaVersionResult.stdout.trim());
    }
    catch (error) {
        core_1.default.setFailed(error.message);
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