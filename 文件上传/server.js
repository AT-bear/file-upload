/*
 * @Author: AT-bear 1509109728@qq.com
 * @Date: 2024-12-22 15:24:39
 * @LastEditors: AT-bear 1509109728@qq.com
 * @LastEditTime: 2024-12-28 18:33:55
 * @FilePath: \技术要点\文件上传\server\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require("express");
const app = express();
const path = require('path');
const fse = require("fs-extra");
const multiparty = require('multiparty');
const uploadFiles = require('./config/upload.js');


// 用于存储文件的目录
const uploadDir = path.join(__dirname, '/public/uploads');

// 创建大文件上传目录（如果不存在）
if (!fse.ensureDir(uploadDir)) {
  fse.mkdirs(uploadDir);
}

// 先添加请求体解析中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 设置跨域和缓存
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // 允许所有来源
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Requested-With, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // 禁用缓存
  res.setHeader('Expires', '-1'); // 设置为过去的时间，确保浏览器不缓存
  res.setHeader('Pragma', 'no-cache'); // 为兼容 HTTP/1.0 客户端
  next();
});

// get方法获取上传页面
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 模拟一个文件 MD5 索引数据库（可以换成数据库存储）
const fileMd5Index = new Map(); // 用于存储文件MD5值和上传状态的映射




// post方法上传文件
app.post('/api/upload', (req, res) => {
  new multiparty.Form().parse(req, (err, fields, files) => {
    const clientMD5s = fields.md5;
    if (!clientMD5s || clientMD5s.length === 0) {
      return res.status(400).send({ error: '缺少MD5值' });
    }
    const existingFiles = clientMD5s.filter(md5 => fileMd5Index.has(md5));
    if (existingFiles.length === clientMD5s.length) {
      return res.json({ success: true, message: '所有文件已经存在，跳过上传' });
    }
    uploadFiles(fields, files, fileMd5Index,uploadDir).then((results) => {
      res.json(results);
    }).catch((err) => {
      res.status(err.status || 500).json({ error: err.error });
    });
  });
});

// 错误处理
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message });
});

// 设置静态资源目录
app.use(express.static(__dirname + '/public')); // 设置上传文件目录

// 启动服务
const port = process.env.PORT || 2121;
app.listen(port, () => console.log(`Server is running, port: ${port}`));