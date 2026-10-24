# 用户 FBX 只读检查（2026-10-22）

## 确认结论

| 文件 | 内容 | 原始大小 | 三角面 | 骨骼 / Skin / 动画 |
|---|---|---:|---:|---|
| `modelf23d8a6f4b3801.fbx` | 蓝衣、棕发人物；原始模型为带斧的固定砍树姿态 | 3,149,804 B | 4,900 | **均为 0** |
| `model4e87ceb4739501.fbx` | 红瓦、白墙木梁房屋 | 3,391,244 B | 4,430 | **均为 0** |

内容识别使用实际内嵌 basecolor 图集查看；固定砍姿和带斧由父代理的实际 Three.js 浏览器首次预览再次确认，见 `source-preview/`。不能把人物固定姿态称为已有站立 / 挥砍 / 回收动画。

两份都是 **FBX 7400 binary**，Creator 为 `Blender (stable FBX IO) - 5.0.1 - 5.14.0`。每份恰有 1 个 `Geometry: Mesh`、1 个 `Model: Mesh`、1 个材质、4 个 Texture、4 个 Video。没有 `Deformer`，没有 `Model: LimbNode`，没有 AnimationStack / Layer / Curve / CurveNode。Three.js FBXLoader CPU 解析均为普通 `Mesh`，无 `skinIndex` / `skinWeight`，`animations.length === 0`。

因此：房屋可作为静态环境素材；人物可直接呈现原始造型，但接入自然肢体动作需要另外绑定/适配，不能仅通过换资源路径就继承旧角色骨骼动画。

## 几何和坐标证据

| 项 | 人物 f23… | 房屋 4e87… |
|---|---:|---:|
| FBX control points | 2,479 | 2,475 |
| FBX polygons（全部三角） | 4,900 | 4,430 |
| Three 展开后 position / normal / UV 数 | 14,700 / 14,700 / 14,700 | 13,290 / 13,290 / 13,290 |
| Three world extent X / Y / Z | 0.998046875 / 0.865234395 / 0.466796913 | 0.791015625 / 0.630859448 / 0.998046903 |
| position / normal / UV 数值 | 全部 finite | 全部 finite |

GlobalSettings 声明 Y-up、UnitScaleFactor 100，两个 Model 均有约 `Lcl Rotation X = -90°`。原始 control-point bounds **不是最终站立坐标**；上表采用 FBXLoader 应用对象变换后的 bounds。导入时应按实际 bounds 缩放并把底部放到地面，不能仅凭源顶点最长轴再次旋转。

## 贴图完整性与材质限制

每份含 4 张 **2048×2048** 内嵌贴图：

- `tripo_model_basecolor.JPEG`
- `tripo_model_normal.PNG`
- `tripo_model_roughness.JPEG`
- `tripo_model_metallic.JPEG`

8 个 Video Content 二进制均非空，SHA-256 详见 `inspection.json`，OpenCV 实际逐张解码成功，均为 2048×2048×3，见 `texture-decode.json`。原 FBX 记录的是 `/mnt/pfs/server/...` 的转换服务器路径，但对应图像已经内嵌；无需访问该外部目录才能显示。检查未发现这 8 张图缺失。

Three.js 0.186.1 FBXLoader 实际产生 `MeshPhongMaterial`，basecolor → `map`、normal → `normalMap` 已连接。加载器明确警告 `ShininessExponent map is not supported` 与 `ReflectionFactor map is not supported`，因此导入后 **roughness / metallic 不能声称自动生效**；若项目转为 Standard/Toon 材质，须显式映射或保留原图并说明取舍。法线贴图约定是否匹配和最终美术观感仍需实际渲染检查，finite 数据不能证明视觉完全正确。

## 来源和授权范围

这两份是用户在本会话提供、要求替换的本地文件，可在本任务内作为用户提供素材处理。文件内部对象名 / 贴图名含 `tripo_*`，这是元数据事实，**不等于许可证明**。未在 FBX 中发现许可文本；作者、生成平台授权条款、商用/再分发权尚未由这次结构检查确认。没有购买、下载素材、上传原文件或联系第三方。

## 复现命令和产物

在 `D:/work/corona/Tidal` 实际运行，退出码均为 0：

```powershell
node artifacts/qa/user-models/inspect-fbx.mjs 'C:/Users/Zero/xwechat_files/zhuling6376_d513/msg/file/2026-10/modelf23d8a6f4b3801.fbx' 'C:/Users/Zero/xwechat_files/zhuling6376_d513/msg/file/2026-10/model4e87ceb4739501.fbx'
```

`inspect-fbx.mjs` 只读解析源文件：自写 binary node / property / zlib array 解析，以及仓库已有 Three.js FBXLoader CPU 复核。后者临时 stub `TextureLoader.load` 返回空 Texture，以避免 DOM、图片加载和网络；它只证明几何/变换/材质连接可解析，**不是浏览器渲染验收**。脚本只写本 QA 目录和系统 TEMP。脚本未修改 public / 产品源码 / 原文件，没有安装依赖。

内嵌图像只读提取到：`C:/Users/Zero/AppData/Local/Temp/tidal-user-fbx-inspection-20261022/`，没有自动收入程序素材。逐张图片解码采用本机已有 Python + OpenCV 4.12.0；结果保存在 `texture-decode.json`。完整原路径、原文件 SHA、贴图 SHA、骨骼/动画缺失及 Three 解析数据见 `inspection.json`。

原文件 SHA-256：

- 人物：`de65c08a0c332fa1701e3d2f578f12cdc6d3bf61d19d8514cfda41fa83af1717`
- 房屋：`e6bec4ad925df0dbd165b363452d95ad72047de56e1a7c8a0910e60d8ede34f7`

