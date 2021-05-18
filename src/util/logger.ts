import padStart from 'string.prototype.padstart';
import chalk from 'chalk';

function format(label: string, msg: string): string {
    return msg
        .split('\n')
        .map((line, i) => {
            return i === 0
                ? `${label} ${line}`
                : padStart(line, chalk.reset(label).length);
        })
        .join('\n');
}

function chalkTag(msg: string): string {
    return chalk.bgBlackBright.white.dim(` ${msg} `);
}

export function warn(msg: string, tag: string | null = null) {
    console.warn(
        format(
            chalk.bgYellow.black(' WARN ') + (tag ? chalkTag(tag) : ''),
            chalk.yellow(msg)
        )
    );
}

export function error(msg: string | Error, tag: string | null = null): void {
    console.error(
        format(
            chalk.bgRed(' ERROR ') + (tag ? chalkTag(tag) : ''),
            chalk.red(msg)
        )
    );

    if (msg instanceof Error) {
        console.error(msg.stack);
    }
}
