/*
 * @Author: AT-bear 1509109728@qq.com
 * @Date: 2024-12-22 17:02:15
 * @LastEditors: AT-bear 1509109728@qq.com
 * @LastEditTime: 2024-12-28 21:54:41
 * @FilePath: \技术要点\文件上传\js\hash-work.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
importScripts('spark-md5.min.js')

self.onmessage = async function(e) {
    const { files } = e.data;  // 获取文件数组
    try {
        // 使用 Promise.all 同时处理多个文件
        const md5List = await Promise.all(files.map(file => calculateMd5(file)));
        self.postMessage({ md5: md5List });  // 将计算结果返回给主线程
    } catch (error) {
        self.postMessage({ error: 'Error calculating MD5', details: error });  // 错误处理
    }
};

function calculateMd5(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function(e) {
            const content = e.target.result;
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(content);
            const md5 = spark.end();
            resolve(md5);  // 计算完成后返回 MD5
        };
        reader.onerror = function(e) {
            reject(e);  // 发生错误时返回错误
        };
        reader.readAsArrayBuffer(file);  // 以 ArrayBuffer 形式读取文件
    });
};
