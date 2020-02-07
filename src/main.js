const program = require('commander');
const path = require('path');
const colors = require('colors');

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

// 如果命令后面未带任何参数，则默认输出 -h 命令的内容
function makeRed(txt) {
  return colors.green(txt); // display the help text in red on the console
}
if (!process.argv.slice(2).length) {
  program.outputHelp(makeRed);
}
program.version(version).parse(process.argv);
