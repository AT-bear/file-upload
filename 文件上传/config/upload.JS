const path = require('path');
const fse = require("fs-extra");
const crypto = require('crypto');
const Lock = require('async-lock'); // 引入锁机制
const fileMd5IndexLock = new Lock();
// 上传文件函数
const uploadFiles = (fields, files, fileMd5Index,uploadDir) => {
    console.log('开始上传文件');
    console.log(fields);
    console.log(files);
    
    return new Promise((resolve, reject) => {
      const clientMD5s = fields.md5;
      const uploadPromises = clientMD5s.map((clientMD5, index) => {
        return new Promise((resolve, reject) => {
          fileMd5IndexLock.acquire(clientMD5, async () => {
            const file = files.file[index];
            if (!file || !clientMD5) {
              return reject({ status: 400, error: '缺少文件或MD5值' });
            }
            const hash = crypto.createHash('md5');
            const fileStream = fse.createReadStream(file.path);
            fileStream.on('data', (data) => {
              hash.update(data);
            });
            fileStream.on('end', () => {
              const serverMD5 = hash.digest('hex');
              if (serverMD5 === clientMD5) {
                const FilePath = path.join(uploadDir, serverMD5 + path.extname(file.originalFilename));
                try {
                  fse.move(file.path, FilePath);
                  fileMd5Index.set(clientMD5, FilePath);
                  resolve({ success: true, message: '文件上传成功' });
                } catch (err) {
                  fileMd5Index.delete(clientMD5);
                  reject({ status: 500, error: '文件重命名保存出现错误: ' + err.message });
                }
              } else {
                fse.removeSync(file.path);
                reject({ status: 400, error: '文件上传失败，MD5值不匹配' });
              }
            });
            fileStream.on('error', (err) => {
              reject({ status: 500, error: '文件流读取出现错误: ' + err.message });
            });
          }).then(() => {
            // 释放锁
            
          });
        });
      });
  
      Promise.all(uploadPromises)
        .then(results => resolve(results))
        .catch(err => reject(err));
    });
  };


module.exports = uploadFiles;