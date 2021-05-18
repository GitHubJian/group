import path from 'path';
import fs from 'fs';

export function isTsRepo(rootDir: string): boolean {
    const tsconfigFilePath = path.relative(rootDir, 'tsconfig.json');

    return (
        fs.existsSync(tsconfigFilePath) &&
        fs.statSync(tsconfigFilePath).isFile()
    );
}
