# 用户授权合入主分支

2026-10-21，用户明确要求“合入到主分支吧”，授权本轮合入并推送main，不对外部署。保留开发分支历史，没有force push、重写历史或删除分支。

fetch后的主分支为`753c841`（PR #1），开发分支为`daf2af1`；本地main先快进至远端，再以`git merge --no-ff --no-commit feature/3d-farm-experience`无冲突合并。`merge-context.json`记录初始合并索引树完全等于开发分支（`6720a7d...`）。随后仅改本轮授权/分支文档、测试输入同步与新增采样边界负例，未改应用源码/依赖/锁文件。

## 验证记录

| 文件 | 命令与实际结果 |
|---|---|
| `verify-first.log` | 首轮npm run verify：typecheck/lint/208单测通过，E2E48通过/1失败（6.4分钟）；因失败未继续build/assets |
| `stalled-error-context.md` | 第13次Chop期望13/15而实际12/15；首轮trace在重跑时被Playwright清理，未保留逐帧证据 |
| `stalled-reproduce.log` | 原代码定向重跑该用例通过：1项，用例39.2秒/总44秒；未稳定复现首轮 |
| `chop-sampling-boundary.log` | npx vitest run tests/unit/chopRecognizer.test.ts：12/12通过，实际证明66ms采样下450ms输入窗口可形成396ms周期而合法不计数；延长对照计1次 |
| `stalled-synchronized.log` | 测试等待实际ready/down并保持最短周期后，原停帧用例1项通过：48.3秒/总53.3秒 |
| `diagnosis.md` | 数据路径、可实测边界与首轮证据局限；不把推导或候选原因当成首轮因果证明 |

两个完整合成摄像头Chop循环现在共享`completeSyntheticChop`，保持全部阶段/计数/停帧/旧回调负例。没有调低生产最短周期或跟踪门槛，没有重试、假计数或新增模拟入口。

最终共享辅助函数合并树的`npm run verify`退出0：**209/209单测、49/49 E2E（6.6分钟）、typecheck/lint/build通过**，原停帧用例46.6秒通过。随后`npm run assets:verify`通过；最终bundle仍为`index-CYPYbaQo.js`693.52KB/gzip183.83KB，保留体积提示。完整日志`verify-final.log`、`assets-verify.log`；`application-diff.log`核对本轮与开发分支的应用/依赖/脚本零差异。开发分支旧日志没有冒充本次重新验证。

## 保留边界

本轮没有重新采集性能或生产整局；应用仍是已交付的CYPYbaQo美术版，历史正常整局55.72fps，P01继续fail，49验收ID为33 pass/1 fail/15 manual_pending。合入main不等于60fps目标、真机标定/识别/PiP/整局、硬件GPU、端到端或最终美术验收通过。

本轮未改锁文件，不重复npm ci或assets:sync；新环境仍按README执行`npm ci`→`npm run assets:sync`→`npm run assets:verify`。开发`npm run dev`，正式`npm run build`→`npm run preview -- --port 4175 --strictPort`。测试产生的历史跟踪截图/JSON恢复原值，本轮保留日志和诊断，不回写旧证据。
