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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importDefault(require("@actions/core"));
const exec_1 = __importDefault(require("@actions/exec"));
const cache_1 = __importDefault(require("@actions/cache"));
const brewCache = __importStar(require("./cache"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const debug = core_1.default.getBooleanInput('debug');
        try {
            const cacheDeps = core_1.default.getBooleanInput('cache-homebrew-deps');
            const updateResults = yield exec_1.default.exec('brew', ['update', '--preinstall']);
            checkCommandFailure(updateResults, 'Cannot update Homebrew.');
            const colimaDepsResult = yield exec_1.default.getExecOutput('brew', [
                'deps',
                'colima',
            ]);
            checkCommandFailure(colimaDepsResult.exitCode, 'Cannot get Colima deps.');
            const colimaDeps = colimaDepsResult.stdout.trim().split('\n');
            let cacheHit = false;
            let cacheKey = '';
            const binTools = ['colima', 'lima', 'qemu', 'docker'];
            if (cacheDeps === true) {
                const cacheKeyPromise = brewCache
                    .cacheKey(binTools, colimaDeps)
                    .then((key) => {
                    console.log(`Returned key: ${key}`);
                    cacheKey = key;
                    console.log(`Updated cacheKey: ${cacheKey}`);
                    return key;
                });
                const cacheFolderPromise = brewCache.cacheFolder(binTools, colimaDeps);
                const [folders, key] = yield Promise.all([
                    cacheFolderPromise,
                    cacheKeyPromise,
                ]);
                cacheHit = Boolean(yield cache_1.default.restoreCache(folders, key));
                if (debug === true) {
                    console.log('Cache restoration results:');
                    console.log(`\tCache hit: ${cacheHit}`);
                    console.log(`\tCache key: ${cacheKey}`);
                }
            }
            if (cacheHit === false) {
                const installArgs = ['install', '-f', 'colima', 'docker'];
                if (debug === true) {
                    installArgs.splice(1, 0, '-v');
                }
                const installResult = yield exec_1.default.exec('brew', installArgs);
                checkCommandFailure(installResult, 'Cannot install Colima and Docker client.');
                if (cacheDeps === true) {
                    yield brewCache.cacheFolder(binTools, colimaDeps).then((toCache) => {
                        cache_1.default.saveCache(toCache, cacheKey);
                        console.log('Cache save results:');
                        console.log(`\tCache folders: ${toCache}`);
                        console.log(`\tCache key: ${cacheKey}`);
                    });
                }
            }
            else {
                console.log('Homebrew formulae restored from cache. Relinking.');
                const linkResult = yield exec_1.default.getExecOutput('brew', ['link', ...binTools]);
                checkCommandFailure(linkResult.exitCode, 'Cannot link Homebrew formulae.');
            }
            const startResult = yield exec_1.default.exec('colima', ['start']);
            checkCommandFailure(startResult, 'Cannot started Colima.');
            exec_1.default.getExecOutput('docker', ['version']).then((values) => {
                checkCommandFailure(values.exitCode, 'Cannot get Docker client version.');
                core_1.default.setOutput('docker-client-version', values.stdout.trim());
            });
            exec_1.default.getExecOutput('colima', ['version']).then((values) => {
                checkCommandFailure(values.exitCode, 'Cannot get Colima version.');
                core_1.default.setOutput('colima-version', values.stdout.trim());
            });
        }
        catch (error) {
            core_1.default.setFailed(error.message);
            if (debug === true) {
                throw error;
            }
        }
    });
}
function checkCommandFailure(result, errMsg) {
    if (result === 1) {
        throw errMsg;
    }
}
run();
