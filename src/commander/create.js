const axios = require('axios');
const ora = require('ora');
const path = require('path');
const {
  promisify,
} = require('util'); // 为方法构造返回promise
const fs = require('fs');
const Inquirer = require('inquirer'); // 命令提示
const MetalSmith = require('metalsmith');
let {
  render,
} = require('consolidate').ejs; // 模版渲染库，统一模版渲染

render = promisify(render);

let downloadGitRepo = require('download-git-repo'); // 下载仓库代码

downloadGitRepo = promisify(downloadGitRepo);

let ncp = require('ncp'); // 拷贝下载后仓库代码到到指定位置

ncp = promisify(ncp);

const {
  downloadDictory,
} = require('../tools/constant');

// 拉取仓库列表
const fetchReportList = async function () {
  const {
    data,
  } = await axios.get(
    'https://api.github.com/orgs/tao-cli/repos',
  );
  return data;
};

// 拉取仓库对应 tag 列表
const fetchReportTags = async function (repo) {
  const {
    data,
  } = await axios.get(
    `https://api.github.com/repos/tao-cli/${repo}/tags`,
  );
  return data;
};

// 通用 loading 方法
const loadFn = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const data = await fn(...args);
  spinner.succeed();
  return data;
};
// 下载仓库文件
const download = async (repo, tag) => {
  let api = `tao-cli/${repo}`; // 下载路径为用户名（组织名）加仓库
  if (tag) {
    // 如果有选tag则添加tag路径
    api += `#${tag}`;
  }
  const dest = `${downloadDictory}/${repo}`; // 目标存放路径
  await downloadGitRepo(api, dest);
  return dest;
};
module.exports = async (projectName) => {
  // 1.拉取对应组织内所有仓库列表
  // 2.允许用户选择具体哪一个仓库进行创建
  // const spinner = ora('loading template...');
  // spinner.start();
  // let reports = await fetchReportList();
  // spinner.succeed();
  let reports = await loadFn(fetchReportList, 'loading template...')();
  reports = reports.map((item) => item.name);

  const {
    report,
  } = await Inquirer.prompt({
    name: 'report',
    type: 'list',
    choices: reports,
    message: '请选择模板创建一个项目',
  });
  console.log('repots complete:', report);

  let tags = await loadFn(fetchReportTags, 'loading tags...')(report);
  tags = tags.map((item) => item.name);

  let iTag = null;
  // 仓库存在版本信息才需选择版本号下载
  if (tags && tags.length) {
    iTag = await Inquirer.prompt({
      name: 'tag',
      type: 'list',
      choices: tags,
      message: '请选择版本号下载',
    });
    console.log('tags complete:', iTag.tag);
  }
  // 根据选择的分支和版本下载仓库内容
  const result = await loadFn(download, 'download repot...')(
    report,
    iTag ? iTag.tag : null,
  );
  console.log('download complete:', result);

  // 下载完成后根据项目情况判断是否需要渲染模版
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    ncp(result, path.resolve(projectName));
  } else {
    console.log('复杂模版');
    // 1.使用 metalSmith 遍历下载后的模版，选择文件进行处理
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname)
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, meta, done) => {
          // console.log('files:', files);
          // 从 ask.js 文件里取出配置信息问答用户输入内容
          const args = require(path.join(result, 'ask.js'));
          const iConfig = await Inquirer.prompt(args);
          const idata = meta.metadata();
          Object.assign(idata, iConfig);
          delete files['ask.js'];
          done();
        })
        .use(async (files, meta, done) => {
          const metal = meta.metadata();
          // 根据用户输入的问答信息渲染符合条件的文件内容，如果文件中有对应字段则会自动匹配上
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.match(/[.js|.json]/)) {
              // 取出每个文件的 contents 信息，即文件内容
              let iCont = files[file].contents.toString();
              if (iCont.match('<%')) { // 针对包含有 ejs 语法的字段使用 conslidate 渲染替换
                iCont = await render(iCont, metal);
                files[file].contents = Buffer.from(iCont);
              }
            }
          });
          done();
        })
        .build((e) => {
          if (e) {
            reject();
          } else {
            resolve();
          }
        });
    });
  }
};
