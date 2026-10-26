# Exercise Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Pure model and SVG rendering have independent file ownership; the parent integrates and runs browser checks. Steps use checkboxes.

**Goal:** 可在训练前与训练中反复查看的三动作分步/慢放教学。

**Architecture:** 原生DOM对话框使用独立TutorialClock及SVG人体图；浏览器装配只调用已有暂停命令，教学数据不流入识别器/控制器。既有3D渲染和摄像头单一所有者不变。

**Tech Stack:** TypeScript strict、原生DOM/SVG/CSS、Vite/npm，无新依赖/媒体。

**Spec:** ../specs/2026-10-26-exercise-tutorial-design.md；用户已确认范围与人体图形式。

## Global Constraints

- SessionController保持状态/计时/库存唯一写入者；不改识别门限、seq/epoch或输入事件。
- 教学不计成果、不申请摄像头、不存真人数据、不改模拟偏好。
- 训练中打开用现有user暂停，关闭不自动继续；后台/长间隔不补播放。
- 保留原53行PROGRESS及74份旧QA/trace；运行重生成测试前备份、转存后恢复历史SHA。
- 本机main基线增量，无重装、素材/许可/依赖升级，无commit/push/部署。

## Review Focus

1. 在自动模拟首次资源就绪前打开，后台不能开局（任务3）。
2. 持姿/半次动作中打开，关闭后不能倒填时间或重复计次（任务3）。
3. 摄像头跟踪失效时教学仍可重看，不能清除tracking暂停或绕过标定（任务3）。
4. Escape/Space/P/Tab不能穿透教学操作训练，关闭恢复焦点（任务3）。
5. 暂停、变速、步骤选择、后台与销毁时，独立时钟不跳或泄漏（任务1–3）。

## Task 1: 教学内容与纯播放模型

Files: src/ui/exerciseTutorialModel.ts、tests/unit/exerciseTutorialModel.test.ts。子代理独立所有。

Interfaces: exports TutorialJoint（14个命名关节）、TutorialPoint={x:number;y:number}、TutorialSpeed=.25|.5|1、TutorialStep={title,cue,tips:readonly string[],durationMs,points:Record<TutorialJoint,TutorialPoint>,highlight:readonly TutorialJoint[]}、TutorialLesson={id:TaskKind,title,summary,steps:readonly TutorialStep[]}、tutorialLessons；TutorialFrame={task,stepIndex,stepProgress,playing,speed,elapsedMs,totalMs,points,highlight}。TutorialClock提供get frame、setTask(task)、setSpeed(speed)、selectStep(index)、play()、pause()、replay()、advance(deltaMs)。

- [x] 写三项教学次序/实际关节点变化、完整复位、慢速相同比例、暂停/非法间隔/选择/重播/结束边界测试并实际RED。
- [x] 内容来自现有标定文字及识别契约；图形原创程序点位，非真人/标准负重示范。
- [x] selectStep立即定格该步骤目标并暂停；再次play从该步起点开始；普通暂停继续保留时间。advance仅接受0<delta<=200有限值，结束停在最后一步。
- [x] GREEN及父代理全单测；模型不import任何运行时控制器/摄像头。

## Task 2: 人体图与关节强调

Files: src/ui/tutorialFigure.ts。子代理独立所有。

Interfaces: class TutorialFigure(svg:SVGSVGElement).draw(frame:TutorialFrame):void，dispose():void。命名关节：head,neck,leftShoulder,leftElbow,leftWrist,rightShoulder,rightElbow,rightWrist,leftHip,rightHip,leftKnee,leftAnkle,rightKnee,rightAnkle。点位归一化0..1，画面viewBox适配。

- [x] 在任务3入口RED之后实现SVG人体、关节高亮和图例；不另建3D渲染器/请求媒体/持有rAF。
- [x] SVG实际circle使用data-joint，便于可访问说明及观测几何；不是只改标签。
- [x] 浏览器验证三动作关节改变、暂停不动，图和说明在390×844及桌面可见。

## Task 3: 对话框、训练边界与回归

Files: src/ui/exerciseTutorialPanel.ts、index.html、web/world.css、src/browser.ts、tests/e2e/exercise-tutorial.spec.ts；docs/PROGRESS.md、SOURCES.md、artifacts/qa/exercise-tutorial-20261026/。

- [x] RED：计划页/顶栏找不到教学；写并实际运行浏览器失败断言。
- [x] 统一入口、三动作按钮、步骤与要点、播放/暂停/重播/前后步/速度；只在打开时rAF，暂停不重复绘制，关闭/隐藏无补时。
- [x] 打开running任务停止按住输入并user暂停；关闭保留暂停，更新交互门禁，训练前打开不创建会话/不改偏好；阻止自动开局穿透。
- [x] inert背景、Tab焦点循环、Escape关闭、训练快捷键隔离与关闭焦点恢复；异常标定/其他暂停沿用原逻辑。
- [x] 类型/lint/全部unit、新教学E2E、相关默认演示/摄像头与现有动画E2E、assets/build；保留既有完整verify截图失败限制。
- [x] 正常生产构建实际查看三动作、慢放/步骤/暂停，保存合成截图；独立只读审查、历史QA恢复与原工作SHA核对。
- [x] 更新真实进度和未验项，保留本机预览，不提交/推送/部署。
