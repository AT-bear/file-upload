### 文件上传

------

#### 1.**秒传**

秒传就是几乎瞬间完成文件上传的过程

**原理**：通过计算文件的哈希值（如MD5或SHA-1、SHA-256）然后将这个唯一的标识符发送给服务器，如果服务器已经存在相同的文件，则直接返回成功的信息。

**好处**:节省宽带，提高用户体验

#### 2.断点续传

断点续传就是在网络不稳定或者用户主动中断上传后，能够从上次中断的地方继续上传，不需要重新开始整个过程

**好处**:有效防止因为网络问题而导致的上传失败，同时也能节约用户的流量和时间

#### 3.分片上传

分片上传是将一个大文件分割成多个小块分别上传，最后再由服务器合并成完整的文件

**好处**:可以并行处理多个小文件，提高上传效率；同时，如果某一部分上传失败，只需要重传这一部分，不影响其他部分



### WEB WORKER

------

[阮一峰web weorker教程](https://www.ruanyifeng.com/blog/2018/07/web-worker.html)

在 JavaScript 中，`Web Worker` 是通过 `postMessage` 方法与主线程进行通信的。`postMessage` 方法可以传递基本数据类型（如字符串、数字）以及支持结构化克隆的对象类型（如数组、普通对象等）。但如果尝试将包含引用类型（例如文件对象、DOM 节点等）或复杂类型的对象数组一次性传递给 worker 时，有一些限制和注意事项。

使用 Web Worker 主要是为了避免主线程被阻塞，提升页面的响应性，尤其在进行计算密集型或 I/O 密集型操作时。

文件处理、图像压缩、批量文件上传和处理等场景中，Web Worker 是非常适用的。

常见的做法是将文件内容读取成 `ArrayBuffer` 或 `Data URL` 后传递给 Worker，或者使用 `OffscreenCanvas` 进行图像处理等任务。

#### 1. **结构化克隆算法**：

`postMessage` 会使用结构化克隆算法来复制对象。当你传递对象数组给 worker 时，主线程会创建一个对象的深拷贝，并将这个拷贝传递给 worker。**但是，某些类型的数据，如 File 对象、Blob 对象或某些 DOM 对象，并不会直接被克隆**。这些对象会被传递为“移交”，意味着在主线程中会被释放，只有 worker 中的副本可用。

#### 2. **文件对象的特殊处理**：

如果你的 `uploadFiles` 数组包含 `File` 对象或 `Blob` 对象，你可以传递它们给 worker，但需要注意它们会被“转移”（move）到 worker 中，主线程无法再访问这些对象。如果你需要在主线程中保留对文件的访问，可以通过将文件转换为 `ArrayBuffer` 或 `Data URL` 的方式来传递。

#### 3. **示例：传递包含文件的对象数组给 Worker**：

```javascript
// 主线程中
const uploadFiles = [
  new File(["content"], "file1.txt", { type: "text/plain" }),
  new File(["another content"], "file2.txt", { type: "text/plain" })
];

// 创建 Worker
const worker = new Worker("worker.js");

// 传递文件数组给 Worker
worker.postMessage(uploadFiles);

// Worker 中的代码
self.onmessage = function (event) {
  const files = event.data;
  console.log(files);  // 这里可以处理文件
};
```

#### 4. **避免丢失文件引用**：

如果你确实需要将文件对象传递给 worker 并且希望主线程仍能访问它们，可以考虑以下两种方案：

- **将文件转换为 ArrayBuffer**，然后传递给 worker（避免转移文件）。

  ```javascript
  const reader = new FileReader();
  reader.onload = function () {
    worker.postMessage(reader.result);  // 传递文件内容（ArrayBuffer）
  };
  reader.readAsArrayBuffer(uploadFiles[0]);
  ```

- **将文件转换为 Data URL**，同样可以传递内容而不丢失引用。

  ```javascript
  const reader = new FileReader();
  reader.onload = function () {
    worker.postMessage(reader.result);  // 传递文件内容（Data URL）
  };
  reader.readAsDataURL(uploadFiles[0]);
  ```

#### 5.常见的做法和场景包括以下几种：

##### 1.文件上传和处理：

在 Web 开发中，常见的需求是上传文件并进行一些异步处理，如文件压缩、格式转换、图像处理等。Web Worker 主要用于处理大量计算密集型的任务，避免阻塞主线程，从而保证页面的流畅性。

##### 场景：

- **图像处理：** 上传的图片可能需要进行压缩、裁剪、格式转换等操作。将图像数据传递给 Web Worker，可以在后台处理图像，而不影响页面的交互性。
- **文件验证：** 对上传的文件进行类型检查、大小验证等。
- **多文件上传：** 将多个文件传递给 Web Worker 进行并行处理，如同时上传多个文件或批量数据处理。

##### 常见做法：

- 使用 `FileReader` 读取文件内容。
- 将文件内容转换为 `ArrayBuffer` 或 `Data URL` 后传递给 worker。
- 将处理后的结果（如图像压缩后的数据）返回给主线程，并显示结果。

##### 代码示例：

```javascript
// 主线程：处理文件上传和传递给 Web Worker
const uploadFiles = [
  new File(["file1 content"], "file1.txt", { type: "text/plain" }),
  new File(["file2 content"], "file2.txt", { type: "text/plain" })
];

const worker = new Worker("worker.js");

// 使用 FileReader 读取文件内容并传递给 Worker
const fileReaders = uploadFiles.map(file => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);  // 读取完成后返回文件内容
    reader.readAsArrayBuffer(file);  // 读取文件为 ArrayBuffer
  });
});

Promise.all(fileReaders).then((fileDataArray) => {
  // 将文件内容数组传递给 Worker
  worker.postMessage(fileDataArray);
});

// Worker 代码：处理传入的数据
// worker.js
onmessage = function(e) {
  const fileDataArray = e.data;

  fileDataArray.forEach((fileData, index) => {
    // 在 worker 中对文件内容进行处理
    console.log(`Processing file ${index + 1}...`);
    // 这里可以进行文件的解压、转换、压缩等操作
  });
};
```

##### **2.图像处理场景：**

Web Worker 在图像处理场景中非常常见，尤其是涉及到大量数据处理的情况，如图像缩放、滤镜应用、图像格式转换等。主线程通过 Web Worker 实现异步操作，而无需阻塞 UI 线程。

##### 场景：

- **图像压缩与裁剪：** 在上传之前，需要压缩图像文件，或将其裁剪成特定尺寸，避免页面卡顿。
- **图像特效：** 在浏览器中应用图像滤镜，用户上传图像并实时预览效果。

##### 常见做法：

- 使用 `Canvas` API 或 `OffscreenCanvas` API 来处理图像。
- 将图像内容传递给 Web Worker 进行计算，并将处理结果传回主线程显示。

##### 代码示例：

```javascript
// 主线程：处理图像上传并传递给 Web Worker
const imageInput = document.querySelector("#fileInput");
const worker = new Worker("imageWorker.js");

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // 传递图像数据给 Worker
        worker.postMessage({ imageData: img, fileName: file.name });
      };
      img.src = e.target.result;  // 读取图像为 Data URL
    };
    reader.readAsDataURL(file);  // 读取图像为 Data URL
  }
});

// Worker：图像处理
// imageWorker.js
onmessage = function (e) {
  const { imageData, fileName } = e.data;

  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageData, 0, 0);

  // 对图像进行处理，例如应用滤镜
  ctx.filter = "grayscale(100%)";
  ctx.drawImage(imageData, 0, 0);

  canvas.convertToBlob().then((blob) => {
    postMessage({ blob, fileName });  // 将处理后的图像返回给主线程
  });
};
```

##### 3. **文件批量处理：**

如果需要批量上传并处理多个文件，Web Worker 可以帮助分配每个文件的处理任务，实现并行处理，从而提高效率，避免因大量文件的同步操作导致页面卡顿。

##### 场景：

- **批量文件上传：** 用户上传多个文件时，可以使用 Web Worker 来处理每个文件的验证、转换等任务。
- **批量数据处理：** 如批量数据导入、日志文件分析、批量图像转换等。

##### 常见做法：

- 创建多个 worker，每个 worker 处理一个文件。
- 将每个文件的数据分别传递给不同的 worker。

##### 代码示例：

```javascript
// 主线程：批量文件处理
const files = [/* 上传的文件数组 */];
const workers = [];

files.forEach((file, index) => {
  const worker = new Worker("fileWorker.js");

  worker.postMessage(file);  // 传递每个文件给单独的 Worker

  worker.onmessage = function (e) {
    console.log(`File ${index + 1} processed:`, e.data);
  };

  workers.push(worker);
});

// Worker 代码：处理单个文件
// fileWorker.js
onmessage = function (e) {
  const file = e.data;
  
  // 文件处理逻辑，如验证、转换等
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    // 假设我们对文件内容进行一些处理
    const result = event.target.result;
    postMessage(result);  // 返回处理结果
  };
  fileReader.readAsText(file);
};
```

#### 6. **主线程与 Worker 之间的通信模式：**

- **postMessage 的异步性：** `postMessage` 是异步的，主线程和 Worker 之间的通信是非阻塞的。文件处理完成后，worker 会通过 `postMessage` 返回结果给主线程。

- **数据传输模式：**

  - **数据传递（传值）：** 使用 `postMessage` 将数据传递给 worker。数据传递是复制的，worker 接收到的只是数据的副本。

  - **“转移”数据（Transferable Objects）：** 例如，传递 `ArrayBuffer` 或 `Blob` 时，可以通过 `postMessage` 的第二个参数指定 `transfer`，实现数据的“转移”，避免了额外的内存开销。一旦转移，主线程就无法再使用这些二进制数据了，这是为了防止出现多个线程同时修改数据的麻烦局面。这种转移数据的方法，叫做[Transferable Objects](http://www.w3.org/html/wg/drafts/html/master/infrastructure.html#transferable-objects)

    ```javascript
    // Transferable Objects 格式
    worker.postMessage(arrayBuffer, [arrayBuffer]);
    ```

