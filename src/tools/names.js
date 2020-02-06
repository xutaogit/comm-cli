module.exports = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'sl-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project',
    examples: [
      'sl-cli config add <key> <value>',
      'sl-cli config get <key>',
    ],
  },
  '*': {
    alias: '',
    description: 'cannot find command',
    examples: [],
  },
};
