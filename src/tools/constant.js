const {
  version,
} = require('../../package.json');

const {
  platform,
} = process;
const downloadDictory = `${process.env[platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template/`;

module.exports = {
  version,
  downloadDictory,
};
