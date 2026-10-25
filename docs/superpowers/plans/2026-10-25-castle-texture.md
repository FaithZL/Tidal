# Castle texture implementation plan

> **For agentic workers:** Implement the small approved visual change inline; use independent review. No commits or external delivery.

**Goal:** 为现有城堡补做柔和卡通石墙、木门与带少量苔藓的山岩贴图。

**Architecture:** 生成本地材质素材并离线烘焙到原UV。运行时仅加载最终颜色图集，复用现有模型门禁与材质释放。

**Tech Stack:** Three.js 0.186.1、strict TypeScript、Vite、原生DOM、npm锁文件。

**Spec:** ../specs/2026-10-25-castle-texture-design.md

## Global constraints

- 原FBX/几何/UV字节不变，全部既有未提交工作保留；不提交、推送或部署。
- 不改变SessionController、输入、计数、计时、依赖或旧测试断言。
- 新图集本地化，记录生成来源/提示词/SHA；不是原作者材质或CC0。

## Review focus

- UV方向与接缝、山岩/建筑遮罩、门窗误涂：生产正反面实际检查。
- 延迟/404贴图：既有开始门禁保持关闭，显式报错。
- 贴图只释放一次；取消/迟到返回复用已有生命周期。
- 普通/NPR与窄屏近景可见；旧角色/房屋不改。

## Steps

- [x] 生成柔和石墙/山岩/木板素材；离线烘焙原UV，保存图集及复现脚本。
- [x] 为真实城堡贴图加载、失败门禁与释放补充失败测试并运行。
- [x] 最小接入loadUserModel及来源/校验；运行相关单测、15项模型E2E和最终6项城堡E2E。
- [x] 类型/lint、构建/素材校验；生产桌面/窄屏/背面截图及独立审查。
- [x] 更新PROGRESS，核对旧工作/素材SHA；保留上一轮未解决失败，不提交推送。
