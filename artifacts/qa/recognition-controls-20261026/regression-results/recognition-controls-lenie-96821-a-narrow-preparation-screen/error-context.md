# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recognition-controls.spec.ts >> leniency is bounded, saved independently and accessible on a narrow preparation screen
- Location: tests/e2e/recognition-controls.spec.ts:22:1

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [active]:
  - generic [ref=e1]:
    - banner:
      - generic:
        - generic:
          - text: T
          - generic: ✦
        - generic:
          - generic: TIDAL FARM
          - generic: 每一次运动，都让世界生长
      - generic [ref=e2]:
        - generic [ref=e3]: 本地测试加速模式
        - generic [ref=e4]: ⌨ 键盘演示 · 非真实动作识别
        - switch "无摄像头测试：关" [ref=e5] [cursor=pointer]
        - button "摄像头识别" [ref=e6] [cursor=pointer]
        - button "停止动画" [ref=e7] [cursor=pointer]
        - button "动作教学" [ref=e8] [cursor=pointer]
        - button "开启音效" [ref=e9] [cursor=pointer]
        - button "重新开始" [ref=e10] [cursor=pointer]
    - main [ref=e11]:
      - generic [ref=e12]:
        - generic:
          - generic:
            - generic: YOUR LITTLE WORLD
            - heading "一座农场，等待你的第一步" [level=1]
          - generic: 今日劳作 · 体验计划
        - generic [ref=e13]:
          - img "可旋转三维农场。地面0、车上0、到家0。" [ref=e14]:
            - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e15]
            - generic:
              - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
              - link "原动作对照" [ref=e16] [cursor=pointer]:
                - /url: /?art=npr-sample&model=prototype
          - generic:
            - generic: 从一件小事开始，让这座农场苏醒。
            - generic: 0%
        - generic "训练任务阶段":
          - generic:
            - generic: 🪓
            - generic:
              - text: 砍伐杉树
              - generic: 壶铃挥砍
          - generic:
            - generic: 🪵
            - generic:
              - text: 木材装车
              - generic: 深蹲推举
          - generic:
            - generic: 🛒
            - generic:
              - text: 运输木材
              - generic: 持续持姿
      - complementary [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: MISSION CONTROL
          - generic [ref=e20]: 未开始
        - heading "农场计划" [level=2] [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: 准备开始今天的劳作。
          - button "等待任务开始" [disabled] [ref=e24]
          - paragraph [ref=e25]: 按 Space 完成一次动作循环（禁用自动重复）
    - generic "三维视角控制" [ref=e26]:
      - generic [ref=e27]: 拖拽旋转 · 滚轮缩放
      - button "向左旋转视角" [ref=e28] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=e29] [cursor=pointer]: ↷
      - button "城堡近景" [ref=e30] [cursor=pointer]
      - button "全景视角" [ref=e31] [cursor=pointer]
    - contentinfo:
      - status: 会话 session-1 · 未开始
  - dialog [ref=e32]:
    - generic [ref=e33]:
      - generic [ref=e34]: 禾
      - generic [ref=e35]:
        - text: 禾禾 · 农场管家
        - generic [ref=e36]: A LITTLE EVERY DAY
      - generic [ref=e37]: 今日
    - heading "农场今日劳作" [level=2] [ref=e38]
    - paragraph [ref=e39]: 从林间到谷仓，让每一次运动都留下收获。
    - generic [ref=e40]:
      - generic [ref=e41]: "01"
      - generic [ref=e42]:
        - generic [ref=e43]: 砍伐杉树
        - generic [ref=e44]: 挥砍 5 次 × 3 棵 · 共 15 次
    - generic [ref=e45]:
      - generic [ref=e46]: "02"
      - generic [ref=e47]:
        - generic [ref=e48]: 收集木材
        - generic [ref=e49]: 深蹲推举 15 次 · 装车 15 份木材
    - generic [ref=e50]:
      - generic [ref=e51]: "03"
      - generic [ref=e52]:
        - generic [ref=e53]: 推车回家
        - generic [ref=e54]: 持续持姿 2 秒 · 返回农场
    - generic [ref=e55]: 今日为预设训练计划 · 概念演示，非 AI 自动规划。
    - button "先看动作教学" [ref=e56] [cursor=pointer]
    - generic [ref=e57]:
      - button "稍后再说" [ref=e58] [cursor=pointer]
      - button "接受今天的任务 →" [ref=e59] [cursor=pointer]
```