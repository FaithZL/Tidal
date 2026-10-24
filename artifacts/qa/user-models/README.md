# 用户人物与房屋模型替换 · 2026-10-22

交付前仅修正“返回农场”链接：真实导航RED发现旧`/`没有用户模型，改至既有`?art=npr-sample`后，`return-farm-green.log`6/6用户E2E通过（10.5秒）。`build-delivered.log`含typecheck/build通过、`lint-delivered.log`通过、`capture-delivered.log`为最后实拍。下表34项未因仅链接修改再次全跑；`build-final.log/capture-final.log`是修链接前记录，`final/`现在对应交付版`index-C8z6hSw_.js/userModelSample-CkaiOMLw.js`，前一次捕获元数据留在`capture-before-return.json`。

本轮只替换现有局部预览与NPR局部玩家/房屋。原始用户FBX逐字节复制，结构/来源见`inspection.md/inspection.json`和`public/assets/user-models/provenance.json`。人物固定砍姿，无rig/skin/clip；真实人物/房屋替换不等于连续动画绑定完成，旧骨骼样片明确切`model=prototype`。

## 实际命令和结果

| 命令 | 日志 | 结果 |
|---|---|---|
| `npm run typecheck` | `typecheck-final.log` | exit0 |
| `npm run lint` | `lint-final.log` | exit0 |
| `npm run test:unit` | `unit-final.log` | 320/320、45文件、2.30秒 |
| `npm run test:e2e -- tests/e2e/user-models.spec.ts tests/e2e/npr-sample.spec.ts tests/e2e/character-motion.spec.ts tests/e2e/deployment.spec.ts` | `e2e-final.log` | 34/34、1.7分钟 |
| `npm run build` | `build-final.log` | exit0 |
| `npm run assets:verify` | `assets-final.log` | exit0，含两用户FBX及原9项CC0文件 |
| `node artifacts/qa/user-models/capture-models.mjs` | `capture-final.log` | 实际dist/4176，0异常/外源 |

依赖/锁文件未改；没有本轮npm ci、全E2E/verify、真人摄像头或新性能测试。共享642.99KB块的>500KB提示保留；FBXLoader的ShininessExponent/ReflectionFactor贴图警告也保留，Soft Toon有意忽略镜面，不称完整PBR。

## RED与回归边界

- `baseline-*`：实际307/307单测及typecheck通过。
- `model-red.log`、`house-red.log`、`character-red.log`：准备/挂载/取消/静态适配尚未实现时真实失败，后有对应GREEN。
- `invalid-model-red.log`、`failure-kind-red.log`、`stream-kind-red.log`：NaN几何未释放、人物网络/响应体错误缺少kind前缀；最小修正后模型7项/新增总13项通过。独立只读审查P2已关闭，见`final-review.md`。
- `e2e-red.log`：新默认人物/房屋预览和人物加载门禁不存在，3失败/1通过。
- `e2e-green.log`名字不代表全绿：实际33/34通过；原半挥砍重置用例在资产未明确ready时点击接受，准备页没有打开。trace显示早期点击经历inert/加载状态变化，该轮还发生源文件修正导致Vite重载。`e2e-initial-failure/`保留trace/上下文。用例补真实ready等待，原首帧锚点/无成果断言不动；冻结后34项完整相关重跑通过。
- 原头部/肩袖/动作负例全部保留，浏览器相关动作测试显式选择旧prototype；新人物静态标签与原动作测试是不同证据。
- 新用户用例实际验证8个嵌入图片URL全部创建/解码后撤销，以及上下文丢失后迟到模型不恢复界面。默认模拟、显式真实摄像头失败不回模拟、资源释放/库存/结算与本地子路径的既有断言继续有效。

## 画面与启动

`final/capture.json`记录入口`index-C8z6hSw_.js`、Chromium156.0.8078.4；用户预览`userModelSample-CkaiOMLw.js`、加载器`userModel-Cnyt4fJP.js`。

- `final/together.png/character.png/house.png/character-back.png`：实际Three模型、内嵌贴图及相机镜头，没有生成图替代。
- `final/farm-local.png`：导入玩家与房屋在原NPR局部场景，零库存、手动偏好；普通`/`仍旧版。
- `final/narrow-390x844.png`：桌面Chromium窄屏视口，完整容纳房屋/风车；不是实机手机。
- `source-preview/`为导入前只读预览，用原Phong材质；`first-look/`为初步Soft Toon图，窄屏裁切和房屋顶杆边界随后修正。不能混用作最终图。
- 首次capture connection refused是4176服务未运行，失败日志`capture-first-look.log`保留；执行`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`后重试成功。
- `deployment/`备份本轮测试重生成的5项已跟踪QA，原路径恢复HEAD。原NPR用例重生成4张未跟踪旧路径PNG，没有可恢复的旧字节副本，现以`regression/`保存本次图并在原目录README更正来源；不能将当前4PNG作上一轮美术证明。

预览`http://127.0.0.1:4176/?art=character-motion&rev=5`，或开发`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`后5173同查询。局部农场`?art=npr-sample`，原动作对照`?art=character-motion&model=prototype`。捕获脚本可用`TIDAL_MODEL_QA_DIR`输出新目录；不要与GPU测试并行。

模型原字节和纹理未改，原作者/公开再分发许可尚未提供，本轮未购买/上传/提交/push/部署。人物连续动作需另做绑定/拆分斧头/权重/重定向与接触修正；固定握点只为当前静态外观适配，不等于自然手指握持。摄像头真机、硬件GPU、真实手机、最终美术继续manual_pending，原P01 fail不变。
