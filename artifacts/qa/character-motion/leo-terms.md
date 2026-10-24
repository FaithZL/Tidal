# Leo 购买前格式与许可核查

核查日期：2026-10-22。只读查看官方商店、公开 Package Content、Unity 条款与帮助；没有购买、登录、下载付费包、联系作者或上传文件。未改应用代码。结论仅覆盖公开证据，不能代替购入后文件检查。

## 结论

**模型 FBX 已由官方目录确认；现成 GLB/BLEND 未确认。Three.js 使用在标准许可下原则上可行，但公开原始/派生模型再分发未获许可，暂不建议按现有公开静态资源方案购买并接入。**

- 引擎许可与资源交付格式是两件事：可在其他引擎使用，不代表作者承诺 Three.js 即插即用。
- 公开 GitHub 不能包含该付费 FBX、贴图或转换后的 GLB。转换格式不消除原资源许可。
- Three.js 网页通常要向浏览器发送可取回的模型文件；Unity 官方帮助明确限制访问/提取原始资源。未发现针对本项目这种 GLB 分发方式的额外授权，不能写成“网页发布许可已确认”。

## 格式的直接证据

来源：[Leo 官方商品页 — Package Content](https://assetstore.unity.com/packages/3d/characters/humanoids/humans/leo-young-adult-313183#content)。本轮实际在浏览器点击“资源包内容”，逐层展开 `NekoLegends → Humans → Leo_YoungAdult`。无需账户、购买或文件下载。目录显示 104.9 MB、78 文件、版本 1.0。

| 已实际看到的路径（相对 `NekoLegends/Humans/Leo_YoungAdult/`） | 能证明什么 / 不能证明什么 |
|---|---|
| `Models/Leo_YoungAdult.fbx` | 明确包含 FBX；不是仅凭 Humanoid 标签推断。没有下载，尚未验证 FBX 内部骨骼、蒙皮、材质、blendshape 或导出质量。 |
| `Models/Leo_YoungAdultAvatar_Body.asset`、`Leo_YoungAdultAvatar_FaceMask.mask` | 另有 Unity Avatar/Mask 配置；不能当作 glTF 骨骼映射文件。 |
| `Animations/NL_Idle.anim`、`NL_WalkInPlace.anim`、`NL_WalkInPlaceHandInHoodlePocket.anim`、`Tpose.anim` | 动作目录实际列的是 Unity `.anim`，还包括 `Leo Animator Controller.controller`；没有看到独立动画 FBX/GLB 的承诺。 |
| `MaterialsAndTextures/Body.png`、`Face.png`、`Hair.png`、多套 `Top*.png`、`Bottom*.png`，以及配套 `.mat` | 有独立 PNG 图像；Unity 材质并非已验证的 Three.js 材质。 |
| `Addon_DynamicBone.unitypackage`、`Addon_HairPhysics.unitypackage`、`Neko Legends - Leo.pdf` | 有附加 Unity 包和文档文件名；本轮未取得其内容。 |

公开 `Models` 目录仅列上述一个 FBX 与两项 Unity 配置；没有看到 `.blend`、`.glb` 或 `.gltf`。这不构成对未下载归档内部内容的完整否定，也不保证作者另售/另提供其他格式。

商品页另写明 Humanoid、44 blendshapes 与三段待机/走路动作；它们是作者规格，不是本项目已实测结果。URP 演示材质依赖应重建；本轮没有验证该 FBX 转 GLB 后的眼睛、透明头发、表情或动画是否保真。

当前实际浏览器显示标准 Unity Asset Store EULA、Single Entity（“一个实体”）；静态检索文本曾将侧栏误列为 Extension Asset，与实际交互页不同，购买前以真实订单/许可项复核。浏览器标价为 $20.90 含税，网页提取为 $19 未税；未进入结账页，不作最终价格承诺。

## 许可的官方依据与适用边界

1. [Unity 官方帮助：Can I use assets from the Asset Store with other engines?](https://support.unity.com/hc/en-us/articles/34387186019988-Can-I-use-assets-from-the-Asset-Store-with-other-engines)（页面更新 2025-07-02）：允许遵守 EULA 的跨引擎使用；同时明确不能把资源作为可下载资源分享，也不能让用户访问或提取原始资源。这直接影响公开 GLB 服务方式，不只是售卖模型的问题。
2. [Unity Asset Store Terms / EULA](https://unity.com/legal/as-terms)（页面标示更新 2024-12-04），Appendix 1 §2.2.1(a)(b)(e)：允许在具有大量原创内容、用途超出展示资源的 Licensed Product 中嵌入、修改和分发；§2.2.1.1(d) 不授予范围外的分发权。**据此判断**：独立 FBX/PNG/GLB 进公开 GitHub 或作为通用下载资源，不属于已确认的嵌入式产品分发。
3. [Unity 官方帮助：Can I use assets from the Asset Store in my commercial game?](https://support.unity.com/hc/en-us/articles/205623589-Can-I-use-assets-from-the-Asset-Store-in-my-commercial-game)（更新 2025-08-13）：一般资源可用于商业游戏，但不得作为独立资源再分发；Restricted/Non-standard/随包特定条款仍需核对。本轮没有购买，因此不能检查包内许可文件。

这里没有断言所有 WebGL 游戏都被禁止。可确认的是跨引擎使用的一般授权；**无法确认的是 Tidal 拟用的可提取 GLB、公开仓库和静态网页交付方式是否得到许可**。改名、压缩、混淆或 `.gitignore` 单独使用，都不是作者对公网模型交付的书面授权。排除 Git 提交可解决仓库再分发问题，不能自动解决公网资源 URL 的问题。

## 购买前仍需明确的具体事项

- 作者是否明确允许把从该 FBX 转出的 GLB 作为 Three.js 网页运行资源发送到浏览器；若需保护，认可何种交付方式。
- 是否允许项目公开源码，且将付费模型/贴图/派生 GLB 排除于公开仓库；是否需要额外许可。**若要求连模型也随公开仓库发布，标准 EULA 证据不足。**
- 角色 FBX 是否包含可用的蒙皮骨架和全部 44 表情；三个 `.anim` 能否提供非 Unity 动画文件或由买方烘焙导出。当前目录仅证明文件名存在。

建议保留 Leo 为造型方向；本轮先停在“FBX 目录确认 / 网页分发许可待明确”，不产生付款承诺。若后续用户授权联系作者，可围绕上述具体用途取得可留档答复；本轮没有发送任何询问。模型小样、动作自然度、GLB 材质重建与硬件性能均未验证。

## 本轮验证范围

实际操作：官方网页检索/打开、浏览器公开目录展开、官方许可交叉阅读、`git diff --check`。纯调研没有运行单测、类型检查或构建，不沿用历史测试为新模型兼容性证据。
