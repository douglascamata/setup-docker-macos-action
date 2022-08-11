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
exports.cacheFolder = exports.cacheKey = void 0;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const glob = __importStar(require("@actions/glob"));
const io = __importStar(require("@actions/io"));
async function cacheKey(binTools, deps) {
    const brewRepositoryResult = await exec.getExecOutput('brew', [
        '--repository',
    ]);
    if (brewRepositoryResult.exitCode === 1) {
        throw new Error("Cannot determine Homebrew's repository path.");
    }
    const repository = brewRepositoryResult.stdout.trim();
    const cacheKeyFiles = await Promise.all(binTools.concat(deps).map((value) => {
        const originalFile = core.toPlatformPath(`${repository}/Library/Taps/homebrew/homebrew-core/Formula/${value}.rb`);
        const githubWorkspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
        const destinationFile = core.toPlatformPath(`${githubWorkspace}/brew-cache-${value}.rb`);
        io.cp(originalFile, destinationFile);
        return destinationFile;
    }));
    const cacheHash = await glob.hashFiles(cacheKeyFiles.join('\n'));
    return `brew-formulae-test-${cacheHash}`;
}
exports.cacheKey = cacheKey;
async function cacheFolder(binTools, deps) {
    const toCache = [];
    const brewCellarResult = await exec.getExecOutput('brew', ['--cellar']);
    if (brewCellarResult.exitCode === 1) {
        throw new Error("Cannot determine Homebrew's cellar path.");
    }
    const cellar = brewCellarResult.stdout.trim();
    const binCacheFolders = binTools.map((value) => {
        return core.toPlatformPath(`${cellar}/${value}`);
    });
    toCache.push(...binCacheFolders);
    const libFolders = deps.map(async (dep) => {
        return findLibFolder(core.toPlatformPath(`${cellar}/${dep}`));
    });
    toCache.push(...(await Promise.all(libFolders)));
    return toCache.filter((result) => result);
}
exports.cacheFolder = cacheFolder;
async function findLibFolder(root) {
    let result;
    try {
        result = await exec.getExecOutput('find', [
            root,
            '-type',
            'd',
            '-maxdepth',
            '2',
            '-iname',
            'lib',
        ]);
    }
    catch (error) {
        return '';
    }
    return result.stdout;
}
