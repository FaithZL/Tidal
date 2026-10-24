# 2026-10-24 main集成证据

用户授权将`codex/npr-farm-sample`酌情合入main并推送，以便新电脑接续。

- 集成前main：`a45116b8fea9d696f482c936a4aabaf79c597f0c`。
- 受测开发分支：`8b96cb91fb0da5c8eea0d25c69edec08b96be791`。
- 所有历史分支均是其祖先；选择快进，不重复合并旧功能或重写历史，保留开发分支。
- `verify.log`：一次完整`npm run verify`退出0，typecheck/lint、369单测、78E2E（8.2分钟）、build通过。
- `assets-verify.log`与`assets-after-merge.log`：合并前及快进检出后本地素材校验通过。
- `merge-context.json`、`merged-tree.json`：祖先关系与快进后完全相同的受测Git树。
- `production-capture.log`、`production/`：当前dist经独立临时4176预览实际打开，六阶段/手肘/旋转/房屋/窄屏自动抓图共15张，无页面/控制台错误或外源；没有录像。预览会话在检查后关闭。
- `regression/`及`qa-restoration.json`：本轮测试重生成的33份历史路径结果，旧文件按原SHA恢复；测试前历史QA共1,177份。
- `review.md`：两席只读审查均无Critical/Important；两个旧prototype生命周期Minor保留后续复现。

本轮未改应用、输入、领域、配置、依赖或锁文件，也未重新npm ci/assets:sync。实际生产构建与子路径浏览器验证不替代真人摄像头、真实手机、硬件GPU、60fps或最终美术签字，旧manual_pending与P01 fail保留。
