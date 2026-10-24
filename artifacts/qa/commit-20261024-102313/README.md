# 2026-10-24 本地提交前验证

用户要求提交全部本地改动，以便跨电脑接续。当前分支`codex/npr-farm-sample`，开始HEAD为`a45116b`；本轮只做本地提交，不推送或部署。

- `verify.log`：完整`npm run verify`退出1。typecheck/lint、369单测通过；78项E2E中76通过，两项失败，尾部build未运行。
- `keyboard-startup-failure/`：旧键盘用例在启动阶段遇到`nprVegetation.ts`的`net::ERR_NO_BUFFER_SPACE`。直接失败点已由trace确认，系统原因未知；未改该测试或应用。
- `subpath-old-assertion-failure/`：子路径预览已实际加载派生骨架，旧断言仍要求`static`。本轮只将该期望改为当前默认契约`derived-skeleton`，全部素材/错误/外源/链接断言保留。
- `e2e-recheck.log`：原键盘用例与修正后的子路径用例定向复验2/2通过（8.6秒），没有超时放宽或增加重试。
- `build.log`：另行运行`npm run build`退出0，含typecheck与Worker；保留既有500KB警告。
- `assets-verify.log`：模型、MediaPipe同版运行文件、原创图集/叶枝、CC0原型及两份用户FBX校验退出0。
- `staged-assets-red.json`：初次暂存的3份原始CC0许可受Git行尾转换影响，检出后字节/SHA校验失败。本轮新增`.gitattributes`冻结`public/assets/character-motion/**`字节，未改来源哈希或素材内容。
- `staged-assets-green.json`：以`core.autocrlf=false/true`分别从暂存区检出9份素材，18/18字节数和SHA一致，之后再次素材校验通过。
- `source-diff-check.json`：应用、测试、脚本及项目文档的暂存空白检查exit0；全量检查另报告原始QA输出与冻结许可中的尾空格/末尾空行，这些原文保留，不声称全量空白检查通过。
- `regression/`：本轮全套测试重生成的33份历史路径结果；`qa-restoration.json`记录新旧SHA。1,131份历史QA逐文件核对，所有覆盖文件已恢复原字节。

78项浏览器用例仅分批通过，不声称本轮某一次78/78或完整verify退出0。没有重新安装依赖或采集真人摄像头/手机/性能数据，原人工待验项和P01 fail保留。

提交清单经只读核查：未发现超过100MB单文件或依赖/构建/密钥文件误入；文本及历史trace凭据规则扫描未命中。历史QA脚本`user-grip/plot-hands.py`和`user-models/preview-source.mjs`仍使用旧机输入绝对路径，单独复跑需要调整，不影响应用及npm验证链。用户FBX仅获本地使用与本次本地提交授权，公开再分发许可未补齐。
