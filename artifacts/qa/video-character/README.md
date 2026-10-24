# 视频角色参考 · 人物局部试作（2026-10-22）

范围为现有`?art=character-motion`，没有替换全农场、业务/输入链或购买Leo。原视频11、12、14.5秒米白衣青年是主要参考，只有侧后视，脸为同风格原创解释；蓝衣少年是另一个角色。参考裁切仅留系统TEMP，仓库只有审阅文字及本项目实际画面。

## 复验命令与实际结果

| 命令 | 日志 | 结果 |
|---|---|---|
| `npm run typecheck` | `typecheck-final.log` | exit0 |
| `npm run lint` | `lint-final.log` | exit0 |
| `npm run test:unit` | `unit-final.log` | 307/307，42文件，3.08秒 |
| `npm run test:e2e -- tests/e2e/character-motion.spec.ts tests/e2e/deployment.spec.ts` | `e2e-final.log` | 17/17，52.7秒 |
| `npm run build` | `build-final.log` | exit0，既有>500KB警告保留 |
| `npm run assets:verify` | `assets-final.log` | exit0，含9项CC0文件 |
| `node scripts/capture-character-motion.mjs` | `capture-final.log` | 实际生产4176，0异常/外源 |
| `python artifacts/qa/character-refinement/inspect_video.py artifacts/qa/video-character/final/stand-chop-recover.webm` | `video-inspection.log` | 16.72秒、1366×900、418解码帧且418不同 |

没有重新运行完整68项E2E/verify、npm ci或本轮60fps测试。E2E的模型下载失败控制台错误是主动中断资源的负例，并非捕获会话错误；真实MediaPipe CPU Worker处理的是Chromium合成视频，不是真人摄像头。

## RED与实现

- `baseline-unit.log`不是全绿：296原测试通过，2项已加入的头部新测试失败。`baseline-typecheck.log`退出0。
- `head-red.log`/`head-green-initial.log`/`head-green.log`/`head-polish-green.log`及`head-nape-{red,green}.log`：原长脸、侧轮廓单束、发壳间隙与后颈0独立发尖实际失败/修正。最终11项头部测试，保留原负例、法线/闭合/眼睛可见/资源预算。
- `costume-red.log`、`costume-retint-red.log`、`costume-drape-red.log`和`costume-harness-{red,green}.log`：缺配饰、未独立重着、披角离背6.3cm、矩形尾端/缺背带等实际失败；最终8项配饰测试。原肩袖/动作连续性负例未删。
- `first-look/second-look/`是中间实际画面；前者尚未接入服装重着色，后者背面仍缺V背带，不能作最终图。
- `visual-audit.md`为实际视频只读核查；`final-review.md`为最终独立代码/画面审阅。

## 最终实际画面

`final/capture.json`记录最终入口`index-BqtD090n.js`，配套`characterSample-DqOobiPA.js`，浏览器156.0.8078.4。`stand-chop-recover.webm`是原速连续实录，未用生成图或参考视频拼接；SHA与元数据见`video-metadata.json`。25fps为录像编码，不能推断游戏FPS。

- `standing.png/windup.png/strike.png/recovery.png`：通过页面可见时间轴准确暂停在0.80/3.40/3.95/4.95秒，并验证实际阶段与data-time。
- `portrait.png/face-three-quarter.png/face-front.png`：实际镜头变换及真实截图区域近景，未改变人物素材或合成美化。
- `back-standing.png/back-windup.png`：实际鼠标旋转后的背部/侧后视；角色动作本身仍会转体，并非四个时刻始终固定背朝相机。
- `decoded-*.png`：从最终录像实际解码的抽帧，用于确认动作与造型进入连续画面；不是真人姿态。

捕获复现：保持最终生产预览4176，运行上述脚本；可通过`TIDAL_PREVIEW_URL`、`TIDAL_ART_DIR`指定服务/新证据目录。不要与其他GPU测试同时运行。测试重生成的旧部署QA另备份到本目录`deployment/`后恢复原文件，不覆盖历史证据。

## 限制

发顶/刘海仍偏大块、颈后稍长，尚未达到参考视频成品精度。原有中央胸前衣料接触、手指包裹和水平脚底约3–4cm漂移继续待修；配饰贴合测试不是布料碰撞仿真。原默认模拟/真实摄像头切换保留，独立样片不初始化摄像头或训练。摄像头真机、硬件GPU、真实手机与最终美术继续manual_pending，原P01 fail不变。未提交/push、部署、购买或扩展全场。
