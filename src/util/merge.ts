import deepmerge from 'deepmerge';

const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]));
export function merge(source: any, target: any): any {
    return deepmerge(source, target, {
        arrayMerge: mergeArrayWithDedupe,
    });
}
