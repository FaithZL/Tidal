# 人物局部第二轮 QA（2026-10-22）

入口 `?art=character-motion`。原创青年头部与本地CC0农夫服装/动画，**非Leo模型，未购买**；没有训练、摄像头、计数或全农场扩展。本目录只记录本轮增量，上一轮证据在`../character-motion/`；`first-look/second-look/`与`source-*`是中间版本，最终交付看`final/`。

## 实际验证

- `npm run typecheck`、`npm run test:unit`：接手基线271单测通过，见`baseline-*.log`。
- `npx vitest run tests/unit/characterSampleClock.test.ts`：真实RED→GREEN，见`motion-red.log/strike-speed-red.log/motion-green.log`。改为0.5秒平滑下挥、低位卸力，不再重复举斧。
- `npx playwright test tests/e2e/character-motion.spec.ts --grep 'face inspection'`：面部按钮缺失RED→实际镜头变化GREEN，见`face-view-*.log`；暂停时间与模拟偏好不变。
- 头部形状/轮廓/鼻长及真实蒙皮肩袖RED→GREEN见`head-*.log/shoulder-*.log`。`elbow-continuity-red.log`实际复现15.45/13.51cm跳动；修正后`elbow-continuity-green.log`通过。保留原未裁接袖子与硬切动作的负例控制。
- **`npm run verify`完整退出0**，`verify-final.log`：typecheck/lint、296单测（41文件）、68E2E（8.0分钟）、构建通过。包含原领域、农场完整流程、默认模拟、真实模式失败处理、释放与子路径等软件回归。
- `npm run assets:verify`退出0，见`assets-final.log`。磁盘9项CC0文件/许可哈希保持；未改依赖和锁文件，没有本轮npm ci。
- `git diff --check`通过，既有`web/world.css` CRLF归一化提示保留。回归重生成的旧QA图/JSON恢复接手值，没有覆盖成新一轮历史证据。

最终入口`index-D7jOxtRS.js`，人物块`characterSample-LWW3LInk.js`；共享652.95KB块的>500KB提示保留。构建成功不代表60fps或真机通过。

## 实际画面

`node scripts/capture-character-motion.mjs`退出0，默认写本目录`final/`，可用`TIDAL_ART_DIR`和`TIDAL_PREVIEW_URL`覆盖；不会默认覆写上一轮目录。拍摄既有4176生产预览，未操作用户的浏览器上下文。`capture-final.log/final/capture.json`记录**0页面/控制台异常、0外源请求**。

| 文件 | 实际内容 |
|---|---|
| `final/stand-chop-recover.webm` | 原速连续两轮站立→举斧→下挥→卸力，含载入共16.64秒；没有加速或插入虚构画面 |
| `final/standing.png` | 滑杆暂停在0.8000秒，idle |
| `final/windup.png` | 3.4000秒，prepare |
| `final/strike.png` | 3.9500秒，strike，下挥近木桩 |
| `final/recovery.png` | 4.9500秒，recover，副手卸力 |
| `final/face-three-quarter.png`、`final/face-front.png` | 可见面部按钮与Orbit操作得到的真实近景 |
| `final/portrait.png` | 同一页面直接截取脸部区域，无美化或生成图替换 |
| `final/shoulder-*.png` | 正/背三分之四与低角度，共4张；`angle-audit.json`记录3.4000秒 |
| `final/mobile-face.png` | 桌面Chromium390×844视口，仅验证窄屏构图，不是手机真机 |

`python artifacts/qa/character-refinement/inspect_video.py artifacts/qa/character-refinement/final/stand-chop-recover.webm`实际解码416帧，416帧内容不同，1366×900，3,753,282字节。25fps是录像编码规格，**不是游戏帧率**；SHA256与时长见`final/video-metadata.json`。已查看近景、下挥、回收、四角度和录像抽帧。未录制/上传摄像头视频。

## 已知边界

详见`shoulder-diagnosis.md`。肩帽区域由源袖根/upperarm绑定推导，保留同一区域原始未裁接网格失败的控制；72个时钟点及额外边界无肩帽穿插、全前臂皮肤无穿袖。全身原始扫描仍保留：3.0–3.9秒中央胸前有手臂/衣物接触（10/72点，最多43条原始相交边），不能称整个角色无碰撞。最终四角度实拍已审阅，原碎片式前臂/肩口条纹消失；棕带白色菱形是原五金。

手指尚未完全包柄；水平脚底约3–4cm漂移，未做完整脚锁；脸、头发、颈比例和最终自然度需用户审阅。真实摄像头、硬件GPU、真实手机与最终美术继续`manual_pending`；原P01 fail不变。样片不代替摄像头识别验收。

继续方式：`npm run dev`后打开`http://127.0.0.1:5173/?art=character-motion`；生产`npm run build`、`npm run preview -- --port 4176 --strictPort`。先审阅本人物局部，不自动扩展全场。未购买Leo、提交、推送、合并或部署。
