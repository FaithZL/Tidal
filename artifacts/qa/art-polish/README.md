# 温暖卡通3D美术精修证据

2026-10-21，基线`d60e59e`、初始工作区干净。最终应用`index-CYPYbaQo.js`，Three0.186.1，依赖/锁文件、SessionController、编排、输入与识别器未变。所有图片均实际由浏览器获取；没有物理摄像头，不把合成骨架、键盘或自动模拟写成真人通过。

## 建议查看

- `before-{home,hero}.png`：旧版真实生产截图，`before-capture.json`记录bundle与画布。首次4175连接失败保留`before-server-retry.log`，启动服务后重试成功。
- `delivered-{home,hero}.png`：最终CYPYbaQo真实生产静态截图，1366×900、DPR1、3D比例1；对应JSON/log。手动键盘入口、正常倒计时、零计数，无摄像头。静态画质不是动态帧率证据。
- `replay/01..15-*.png`、`visual-replay.json`：最终材质版完整七阶段/倒树/推车/抛木/绑绳/运送/结果回放。实际键盘事件，浏览器受控时钟；验证暂停冻结、计数与库存，不测fps。
- `production-{setup,running,carry,results}.png`：最终构建正常时长自动演示；运送截图实际3D比例0.512、699×460铺满1366×900，文字和PiP保留原尺寸。训练/运送/结果图片已查看，边缘软化可见。
- `full-suite/`：草捆修正前DEI构建的49项完整回归所生成的首页/Orbit/结果、三尺寸、十轮资源与子路径证据。`camera-pip-synthetic.png`为合成视频，不是真人。

`after/refined/final-*`保留逐次材质、树冠阴影和草地改良时的真实截图，各capture JSON指定版本；不是最终CYPYbaQo的替代图。旧轮次被测试重生成的跟踪文件已恢复原样，本轮单独保存。

## 验证与版本

| 记录 | 实际结果/范围 |
|---|---|
| `baseline.log` | 实际typecheck、原183单测通过 |
| `resources/path-uv/actors/actors-shadow/ground-contact/scenery/meadow-*-red/green.log` | 材质/释放/圆角、道路平铺、演员接口、抬高道路上的阴影、环境保全/预算与顶点草地的实际RED→GREEN；不是摄像头测试 |
| `visual-version-red.log` | 旧v1美术断言实际失败；仅更新v2标记，保留所有动作/暂停/守恒负例 |
| `verify-interrupted.log` | 已知过时断言处运行前主动中断，非通过记录 |
| `verify-final.log` | DEI构建208单测、49E2E（6.3分钟）、typecheck/lint/build通过 |
| `material-final.log` | 截图发现草捆误用年轮，改为已有纵向纹理后208单测、完整视觉E2E1项、typecheck/lint/build/assets:verify通过；CYPYbaQo |
| `review.md` | 一次独立只读审查1 Important已实际RED→GREEN解决，无重复审查 |
| `restored-build.log` | 远景试验恢复原纹理后重新build；精确核对仍为已验证CYPYbaQo |
| `actor-budgets.mjs/json/log`、`meadow-metrics.json` | 实际Three对象几何预算；环境138绘制对象/1169部件/40624三角，保持150/42k上限 |

49项全套在唯一最终草捆材质修正**前**执行；修正后有上述定向回归和正常生产整局，没有声称重新全跑49项。恢复无收益候选后产物哈希完全相同，不伪造新测试。

## 性能口径

所有采样为Windows/Chromium156.0.8078.4、1366×900 CSS、DPR1、**ANGLE SwiftShader软件渲染**，正常时钟与自动模拟，未测硬件GPU或真人推理。fps来自rAF间隔；WebGL COLOR清除只计pass，CPU提交耗时不是GPU执行耗时。静态图和受控回放不作性能证据。

- `profile.json/log`：首版含纹理60秒55.00fps，非最终版本。
- `diagnose-textures.mjs/json/log`：首休息8秒52.39fps；诊断性取消全部纹理采样60.00fps。仅成本定位，未把这种去材质画面交付或当验收。
- `sampler-profile.json/log`：改mip采样后的8秒57.39fps，草地主面仍采样，不是60秒验收。
- `final-profile.json/log`：改草地为顶点色后的DEI版，预热10秒后3500样本/60.0142秒，58.32fps，p50 16.7/p95 16.8/max66.6ms，>50ms1次；比例0.8→0.5，683×450；0异常/外源。此后草捆才做最终修正。
- `production-auto-flow.json/log`：最终CYPYbaQo正常整局142.227秒完成15/15/60、15段到家、100/100奖励和重置，0异常/外源/姿态资源请求。预热后7338样本/131.6948秒，**55.72fps、p50 16.7/p95 33.3/max33.5ms，>50ms0**。浏览器阻断外源不是物理断网。
- `forest-{before,after}-profile.json/log`、`forest-build.log`：正常首休息相同8秒，CYPYbaQo/比例0.5的58.13fps→试验DHs-04PK/比例0.512的57.88fps，未显示明确收益且分辨率不同，不推断因果；远景去纹理候选已恢复，不提交该候选。

**稳定约60fps尚未达到，P01保守记fail。** 当前49验收ID为33 pass、1 fail、15 manual_pending，见`report-audit.json`（仅核对文档ID/证据存在，非真人或产品签字）。不借用前轮59.74fps/58.63fps。不声称锁60、同分辨率成绩、真人准确率或硬件性能；3D自适应带来清晰度代价。

## 复测

先按仓库README安装本地依赖/资源。`npm run verify`、`npm run assets:verify`；正式`npm run build`→`npm run preview -- --port 4175 --strictPort`。另一终端：

```powershell
$env:TIDAL_QA_DIR='artifacts/qa/art-polish'
$env:TIDAL_BLOCK_EXTERNAL='1'
node scripts/verify-auto-demo.mjs
$env:TIDAL_PROFILE_OUTPUT='artifacts/qa/art-polish/new-profile.json'
$env:TIDAL_PROFILE_WINDOW_MS='60000'
$env:TIDAL_PROFILE_WARMUP_MS='10000'
node scripts/profile-demo.mjs
$env:TIDAL_ART_LABEL='new-capture'
node scripts/capture-art.mjs
```

不要同时运行其他浏览器回归与性能采样。本轮无外部素材/模型/字体/购买/图片服务；11种原创128×128 DataTexture在本地生成、按种类共享并释放，Three官方附加几何沿用其MIT许可。真机标定、识别、PiP、真人整局、端到端、硬件GPU、物理断网与最终审美批准继续按DEMO_RUNBOOK人工验证。
