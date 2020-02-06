const program = require('commander');
const path = require('path');

const {
  version,
} = require('../src/tools/constant');
const commanders = require('../src/tools/names');

// program.parse(process.argv);

// console.log(Reflect.ownKeys(commanders));

Reflect.ownKeys(commanders).forEach((name) => {
  program
    .command(name)
    .alias(commanders[name].alias)
    .description(commanders[name].description)
    .action(() => {
      require(path.resolve(`${__dirname}/commander/`, name))(...process.argv.slice(3));
    });
});
program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(commanders).forEach((name) => {
    commanders[name].examples.forEach((item) => {
      console.log(`  ${item}\n`);
    });
  });
});
program.version(version).parse(process.argv);
