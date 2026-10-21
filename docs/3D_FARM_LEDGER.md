# SDD ledger — plan: docs/3D_FARM_IMPLEMENTATION.md

2026-10-21；基线0baf882（应用30e36e3）。用户已批准设计、执行清单与当前目录直接执行；使用feature/3d-farm-experience，不另建worktree。按executing-plans原生执行，最终一次独立全分支审查。

Pre-flight: Task1配置→Task2视觉库存，统一初始0/每树5；单木段夹具明确覆盖为1。
Pre-flight: Task2 WorldFrame→Task3真实网格，手部世界锚点由渲染器回传，表现不拥有领域写接口。
Pre-flight: Task3 GameView→Task4 DOM，destroy/rotate/resetView/setInteractionEnabled保持单一接口；相机不接管Space。
Pre-flight: Task4 PiP→Task5生命周期，共用同一video/srcObject/Worker；不按阶段重新调用设备start。

Task 1: complete — 默认0/5与第5/10/15次产5/10/15测试先3失败；改配置、单木段夹具明确覆盖1后156/156单测及typecheck通过。原领域实现未改。证据artifacts/qa/3d/quantities-{red,green}.log。

Task 2: in progress — 三维表现数据，手锚点与库存归属测试。
