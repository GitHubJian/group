import path from 'path';
import fs from 'fs';
import ValidatorError from './validator-error';
import {error, exit, isTsRepo, merge, warn} from './util';

const INDEX_FILE_NAME_WITHOUT_EXT = 'index';

export enum ChunkFilenameType {
    INDEX = 'index',
    SAME_NAME = 'same-name',
}

interface GroupOptions {
    cwd: string;
    initialChunkPath: string;
    nonInitialChunkPaths: string[];
    chunkExtensions: string[];
    chunkFilenameType: ChunkFilenameType;
}

const defaults = {
    cwd: process.cwd(),
    initialChunkPath: './src/page',
    nonInitialChunkPaths: ['./src/lib'],
    chunkExtensions: [],
    chunkFilenameType: ChunkFilenameType.INDEX,
};

export default class Group {
    options: GroupOptions;
    nonInitialChunks: Map<string, string>;

    constructor(options: Partial<GroupOptions> = {}) {
        this.options = merge(defaults, options);

        this.nonInitialChunks = new Map<string, string>();
        this.init();
    }

    /**
     * 获取符合规范的 webpack.entry
     *
     * @returns {Record<string, string>} 符合规范的 Entry
     */
    findInitialChunks() {
        return this.findChunks(this.options.initialChunkPath);
    }

    /**
     * 获取符合规范的 group.entry
     *
     * @returns {Record<string, string>} 符合规范的 Entry
     */
    findNoninitialChunks(): Map<string, string> {
        if (this.nonInitialChunks.size !== 0) {
            return this.nonInitialChunks;
        }

        const {cwd, nonInitialChunkPaths} = this.options;
        const nonInitialChunks = new Map<string, string>();

        nonInitialChunkPaths.forEach(nonInitialChunkRelativePath => {
            let currentNonInitialChunks = {};

            try {
                currentNonInitialChunks = this.findChunks(
                    nonInitialChunkRelativePath
                );
            } catch (err) {
                warn(err.message);

                return;
            }

            Object.keys(currentNonInitialChunks).forEach(nonInitialChunk => {
                if (this.nonInitialChunks.get(nonInitialChunk)) {
                    error(`存在同名 '${nonInitialChunk}' 缓存文件`);

                    exit(0);
                }

                const chunkFilePath = path.resolve(
                    cwd,
                    currentNonInitialChunks[nonInitialChunk]
                );

                nonInitialChunks.set(nonInitialChunk, chunkFilePath);
            });
        });

        this.nonInitialChunks = nonInitialChunks;

        return this.nonInitialChunks;
    }

    /**
     * 获取符合规范的 webpack.SplitChunks.cacheGroups
     *
     * @returns {Record<string, string>} 符合规范的 Entry
     */
    findCacheGroups() {
        const nonInitialChunks = this.findNoninitialChunks();
        const cacheGroups: Record<
            string,
            {
                name: string;
                test: (module) => boolean;
                reuseExistingChunk: true;
                minChunks: 1;
                priority: -5;
            }
        > = {};

        nonInitialChunks.forEach((value, key) => {
            cacheGroups[key] = {
                name: key,
                test: function (module: {context: string}): boolean {
                    return module?.context.indexOf(value) > -1;
                },
                reuseExistingChunk: true,
                minChunks: 1,
                priority: -5,
            };
        });

        return cacheGroups;
    }

    private init() {
        if (this.options.chunkExtensions.length === 0) {
            if (isTsRepo(this.options.cwd)) {
                this.options.chunkExtensions = ['.ts'];
            } else {
                this.options.chunkExtensions = ['.js'];
            }
        }
    }

    private findChunks(
        chunkFolderRelativePath: string
    ): Record<string, string> {
        const chunks = {};
        const projectRootPath = this.options.cwd;

        if (!fs.existsSync(projectRootPath)) {
            error(`项目根目录[${projectRootPath}]不存在.`);

            exit();
        }

        const chunkFolderPath = path.resolve(
            projectRootPath,
            chunkFolderRelativePath
        );
        if (!fs.existsSync(chunkFolderPath)) {
            throw new ValidatorError(`分组目录[${chunkFolderPath}]不存在.`);
        } else {
            const chunkNames = fs
                .readdirSync(chunkFolderPath)
                // 过滤掉以 . 开头的隐藏文件
                .filter(chunkName => !chunkName.startsWith('.'));

            chunkNames.forEach(chunkName => {
                const chunkPath = this.findChunkFile(
                    chunkFolderPath,
                    chunkName
                );

                const chunkRelativePath =
                    './' + path.relative(projectRootPath, chunkPath as string);

                chunks[chunkName] = chunkRelativePath;
            });

            return chunks;
        }
    }

    /**
     *
     * @param chunkAbsoultePath 所在的文件夹
     * @param chunkName 名称
     * @returns
     */
    private findChunkFile(
        chunkAbsoultePath: string,
        chunkName: string
    ): string | undefined {
        const {chunkFilenameType, chunkExtensions} = this.options;
        const chunkFolderpath = path.resolve(chunkAbsoultePath, chunkName);
        const chunkFilenameNonExtensions =
            chunkFilenameType === ChunkFilenameType.SAME_NAME
                ? chunkName
                : INDEX_FILE_NAME_WITHOUT_EXT;

        for (const ext of chunkExtensions) {
            const chunkFilename = chunkFilenameNonExtensions + ext;

            const chunkFilepath = path.resolve(chunkFolderpath, chunkFilename);
            debugger;
            if (
                fs.existsSync(chunkFilepath) &&
                fs.statSync(chunkFilepath).isFile()
            ) {
                return chunkFilepath;
            }
        }

        throw new ValidatorError('');
    }
}
