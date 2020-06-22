const {Volume, createFsFromVolume} = require('memfs');

const volume = new Volume();
const fs = createFsFromVolume(volume);
fs.__volume = volume;

module.exports = fs;
