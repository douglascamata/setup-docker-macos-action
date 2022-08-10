"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheFolder = exports.cacheKey = void 0;
const exec_1 = __importDefault(require("@actions/exec"));
const glob_1 = __importDefault(require("@actions/glob"));
const core_1 = __importDefault(require("@actions/core"));
const io_1 = __importDefault(require("@actions/io"));
async function cacheKey(binTools, deps) {
    const brewRepositoryResult = await exec_1.default.getExecOutput('brew', [
        '--repository',
    ]);
    if (brewRepositoryResult.exitCode === 1) {
        throw "Cannot determine Homebrew's repository path.";
    }
    const repository = brewRepositoryResult.stdout.trim();
    const cacheKeyFiles = await Promise.all(binTools.concat(deps).map((value) => {
        const originalFile = core_1.default.toPlatformPath(`${repository}/Library/Taps/homebrew/homebrew-core/Formula/${value}.rb`);
        const githubWorkspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
        const destinationFile = core_1.default.toPlatformPath(`${githubWorkspace}/brew-cache-${value}.rb`);
        io_1.default.cp(originalFile, destinationFile);
        return destinationFile;
    }));
    const cacheHash = await glob_1.default.hashFiles(cacheKeyFiles.join('\n'));
    return `brew-formulae-test-${cacheHash}`;
}
exports.cacheKey = cacheKey;
async function cacheFolder(binTools, deps) {
    const toCache = [];
    const brewCellarResult = await exec_1.default.getExecOutput('brew', ['--cellar']);
    if (brewCellarResult.exitCode === 1) {
        throw "Cannot determine Homebrew's cellar path.";
    }
    const cellar = brewCellarResult.stdout.trim();
    const binCacheFolders = binTools.map((value) => {
        return core_1.default.toPlatformPath(`${cellar}/${value}`);
    });
    toCache.push(...binCacheFolders);
    const libFolders = deps.map(async (dep) => {
        return findLibFolder(core_1.default.toPlatformPath(`${cellar}/${dep}`));
    });
    toCache.push(...(await Promise.all(libFolders)));
    return toCache.filter((result) => result);
}
exports.cacheFolder = cacheFolder;
async function findLibFolder(root) {
    return exec_1.default
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
        return value.stdout;
    })
        .catch(() => {
        return '';
    });
}
