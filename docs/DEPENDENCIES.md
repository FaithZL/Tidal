# 依赖与资源记录（2026-10-16）

本机：Windows，Node 24.14.0，npm 11.9.0。全部直接依赖精确锁定，间接依赖由 `package-lock.json` 固定。

| 依赖 | 安装版本 | 用途 |
|---|---|---|
| phaser | 3.90.0 | 2D 场景 |
| @mediapipe/tasks-vision | 0.10.32 | 本地 VIDEO 姿态推理 |
| typescript | 5.8.3 | strict 类型检查，保留原版本 |
| vite | 8.3.4 | 开发、Worker 打包、生产构建 |
| vitest | 5.0.4 | 单元测试 |
| @playwright/test | 1.64.1 | Chromium 浏览器测试 |
| eslint / @eslint/js | 10.12.0 / 10.0.1 | 静态检查 |
| typescript-eslint | 8.71.2 | TypeScript 规范 |
| @types/node | 24.7.2 | Node 类型 |

浏览器实际版本：Chrome for Testing / Chromium 156.0.8078.4。安装命令：`npx playwright install chromium`。

## 模型、WASM与许可

- 模型：Pose Landmarker Lite，float16，版本路径 `1`。[官方模型说明](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker)。
- [固定下载地址](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task)。
- 模型 SHA-256：`59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`。
- 模型许可：[官方模型卡第2页](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20BlazePose%20GHUM%203D.pdf) 列出 Apache License 2.0。
- MediaPipe JS/WASM：同一 `@mediapipe/tasks-vision@0.10.32` npm 包，Apache-2.0；许可副本 `public/licenses/mediapipe-LICENSE.txt`，来源 [v0.10.32 LICENSE](https://github.com/google-ai-edge/mediapipe/blob/v0.10.32/LICENSE)。
- Phaser：MIT；许可副本 `public/licenses/phaser-LICENSE.md`，来自锁定 npm 包。
- T04 的几何占位已在 T05 替换为原创矢量场景与分层角色，未使用外部人物截图、付费素材、音频或网络字体，见下方补充。
- 4个WASM运行文件及SHA-256见 `public/mediapipe/manifest.json`。`assets:verify`同时比对本地资源、manifest和已安装npm包；模型校验值写死在同步脚本，下载不符即拒绝。
- T10新增声音由`src/ui/audioFeedback.ts`原生Web Audio正弦振荡器合成，无新增依赖/第三方录音；来源见SOURCES。锁文件保持，2026-10-16干净`npm ci`成功（137包，npm报告0漏洞）。

## 已验证的集成决策

最初试装 MediaPipe 1.1.1，浏览器网络回归发现其关闭实例时请求 `https://odml.pa.googleapis.com/v1/log`。未使用真人视频进行该测试。该版本未用于最终交付；改为0.10.32后，同一合成视频初始化/推理/关闭测试未发现外部网络请求。

0.10.32通过`importScripts`载入WASM，故由`vite.worker.config.ts`预先打包为classic Worker（`public/worker/pose.js`）。开发启动和生产构建都会重建Worker，避免开发可用、生产失效的差异。CPU路径被显式选择并显示，不宣称GPU或真机性能已通过；主线程没有降级推理。

模型、WASM和Worker均相对应用base加载。运行时不依赖CDN。离线首次安装需要预先具备npm依赖与模型；离线演示仍需本地HTTP服务。

初装旧lint依赖时出现9个high开发依赖告警，更新到上表兼容组合后`npm audit`为0漏洞；未使用`--force`或忽略peer依赖。
## T05 原创美术补充（2026-10-15）

本轮未改变 npm 依赖或锁文件。新增 `public/assets/farm-landscape.svg`、`harvest-shirt.svg` 与 Phaser 代码绘制的角色/道具；均为本任务原创，没有引入第三方游戏资产或外部字体。清单、来源与使用边界见 `public/assets/README.md`；两份 SVG 的 SHA256 锁定在 `public/assets/manifest.json`，由 `npm run assets:verify` 检查。Phaser SVG loader 会生成并释放同源 blob 地址进行本地栅格化，该地址不代表外发请求。

