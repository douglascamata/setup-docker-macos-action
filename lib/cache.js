"use strict";
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
exports.cacheFolder = exports.cacheKey = void 0;
const exec_1 = __importDefault(require("@actions/exec"));
const glob_1 = __importDefault(require("@actions/glob"));
const core_1 = __importDefault(require("@actions/core"));
const io_1 = __importDefault(require("@actions/io"));
function cacheKey(binTools, deps) {
    return __awaiter(this, void 0, void 0, function* () {
        const brewRepositoryResult = yield exec_1.default.getExecOutput('brew', [
            '--repository',
        ]);
        if (brewRepositoryResult.exitCode === 1) {
            throw "Cannot determine Homebrew's repository path.";
        }
        const repository = brewRepositoryResult.stdout.trim();
        const cacheKeyFiles = yield Promise.all(binTools.concat(deps).map((value) => {
            var _a;
            const originalFile = core_1.default.toPlatformPath(`${repository}/Library/Taps/homebrew/homebrew-core/Formula/${value}.rb`);
            const githubWorkspace = (_a = process.env['GITHUB_WORKSPACE']) !== null && _a !== void 0 ? _a : process.cwd();
            const destinationFile = core_1.default.toPlatformPath(`${githubWorkspace}/brew-cache-${value}.rb`);
            io_1.default.cp(originalFile, destinationFile);
            return destinationFile;
        }));
        const cacheHash = yield glob_1.default.hashFiles(cacheKeyFiles.join('\n'));
        return `brew-formulae-test-${cacheHash}`;
    });
}
exports.cacheKey = cacheKey;
function cacheFolder(binTools, deps) {
    return __awaiter(this, void 0, void 0, function* () {
        const toCache = [];
        const brewCellarResult = yield exec_1.default.getExecOutput('brew', ['--cellar']);
        if (brewCellarResult.exitCode === 1) {
            throw "Cannot determine Homebrew's cellar path.";
        }
        const cellar = brewCellarResult.stdout.trim();
        const binCacheFolders = binTools.map((value) => {
            return core_1.default.toPlatformPath(`${cellar}/${value}`);
        });
        toCache.push(...binCacheFolders);
        const libFolders = deps.map((dep) => __awaiter(this, void 0, void 0, function* () {
            return findLibFolder(core_1.default.toPlatformPath(`${cellar}/${dep}`));
        }));
        toCache.push(...(yield Promise.all(libFolders)));
        return toCache.filter((result) => result);
    });
}
exports.cacheFolder = cacheFolder;
function findLibFolder(root) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
