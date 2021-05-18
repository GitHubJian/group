const path = require('path');
const {default: Group, ChunkFilenameType} = require('../dist');

const group = new Group({
    cwd: path.resolve(__dirname, '..', 'example'),
    chunkFilenameType: ChunkFilenameType.SAME_NAME,
});
// const res = group.findInitialChunks();
const res = group.findInitialChunks();
// const res = group.findCacheGroups();

// console.log(res);
console.log(res);
