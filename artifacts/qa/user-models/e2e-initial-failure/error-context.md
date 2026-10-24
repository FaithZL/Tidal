# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: npr-sample.spec.ts >> reset during a partial swing immediately snaps the rendered hands to the new home pose
- Location: tests\e2e\npr-sample.spec.ts:100:1

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [active]:
  - generic [ref=f1e1]:
    - banner:
      - generic:
        - generic:
          - text: T
          - generic: ✦
        - generic:
          - generic: TIDAL FARM
          - generic: 每一次运动，都让世界生长
      - generic [ref=f1e2]:
        - generic [ref=f1e3]: ⌨ 键盘演示 · 非真实动作识别
        - switch "无摄像头测试：关" [ref=f1e4] [cursor=pointer]
        - button "开启音效" [ref=f1e5] [cursor=pointer]
        - button "重新开始" [ref=f1e6] [cursor=pointer]
    - main [ref=f1e7]:
      - generic [ref=f1e8]:
        - generic:
          - generic:
            - generic: YOUR LITTLE WORLD
            - heading "一座农场，等待你的第一步" [level=1]
          - generic: 今日劳作 · 体验计划
        - generic [ref=f1e9]:
          - img "可旋转三维农场。地面0、车上0、到家0。" [ref=f1e10]:
            - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=f1e11]
            - generic:
              - text: 原动作人物对照 · 导入房屋
              - link "查看导入人物" [ref=f1e12] [cursor=pointer]:
                - /url: /?art=npr-sample
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
      - complementary [ref=f1e13]:
        - generic [ref=f1e14]:
          - generic [ref=f1e15]: MISSION CONTROL
          - generic [ref=f1e16]: 未开始
        - heading "农场计划" [level=2] [ref=f1e17]
        - generic [ref=f1e18]:
          - generic [ref=f1e19]: 准备开始今天的劳作。
          - button "等待任务开始" [disabled] [ref=f1e20]
          - paragraph [ref=f1e21]: 按 Space 完成一次动作循环（禁用自动重复）
    - generic "三维视角控制" [ref=f1e22]:
      - generic [ref=f1e23]: 拖拽旋转 · 滚轮缩放
      - button "向左旋转视角" [ref=f1e24] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=f1e25] [cursor=pointer]: ↷
      - button "全景视角" [ref=f1e26] [cursor=pointer]
    - contentinfo:
      - status: 会话 session-1 · 未开始
  - dialog [ref=f1e27]:
    - generic [ref=f1e28]:
      - generic [ref=f1e29]: 禾
      - generic [ref=f1e30]:
        - text: 禾禾 · 农场管家
        - generic [ref=f1e31]: A LITTLE EVERY DAY
      - generic [ref=f1e32]: 今日
    - heading "农场今日劳作" [level=2] [ref=f1e33]
    - paragraph [ref=f1e34]: 从林间到谷仓，让每一次运动都留下收获。
    - generic [ref=f1e35]:
      - generic [ref=f1e36]: "01"
      - generic [ref=f1e37]:
        - generic [ref=f1e38]: 砍伐杉树
        - generic [ref=f1e39]: 挥砍 5 次 × 3 棵 · 共 15 次
    - generic [ref=f1e40]:
      - generic [ref=f1e41]: "02"
      - generic [ref=f1e42]:
        - generic [ref=f1e43]: 收集木材
        - generic [ref=f1e44]: 深蹲推举 15 次 · 装车 15 份木材
    - generic [ref=f1e45]:
      - generic [ref=f1e46]: "03"
      - generic [ref=f1e47]:
        - generic [ref=f1e48]: 推车回家
        - generic [ref=f1e49]: 持续持姿 60 秒 · 返回农场
    - generic [ref=f1e50]: 今日为预设训练计划 · 概念演示，非 AI 自动规划。
    - generic [ref=f1e51]:
      - button "稍后再说" [ref=f1e52] [cursor=pointer]
      - button "接受今天的任务 →" [ref=f1e53] [cursor=pointer]
```