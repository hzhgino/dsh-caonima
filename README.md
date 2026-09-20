# 核动力草泥马 (dsh-caonima) 🦙⚛️

> DSH Web GUI 桌宠插件:屏幕右下角住着一只**网红草泥马**,它会随着当前 Agent 的工作状态改变行为。npm 包名即 `dsh-caonima`。

## Quick Start

```bash
# 安装（二选一，当前推荐 GitHub 源，npm 发布后即可用包名）
dsh plugin --profile web add github:hzhgino/dsh-caonima
# 或（npm 发布后）            dsh plugin --profile web add dsh-caonima

# 重启 web host 并刷新浏览器页面，草泥马出现在右下角
dsh web
```

> 需要 `dsh` v0.1.5+。卸载:`dsh plugin --profile web remove dsh-caonima`,重启后桌宠消失。

## 行为一览

| Agent / 会话状态 | 草泥马的表现 |
|---|---|
| 空闲(idle) | 沿屏幕底部**慢速散步**,时不时停下喘气、眨眼、耳朵抖动;闲置 50 秒后**打盹**(闭眼冒 zZz) |
| 正在工作(running) | **快步巡逻**,四肢走马灯,气泡实时播报正在执行的工具(`🖥️ bash…`、`🔍 grep…`),偶尔蹲下吃两口草 🌿 |
| 等待审批(approval/asked) | 原地**急跳** + 橙色警报气泡「⚠️ 需要批准」,批复后恢复工作 |
| 回合结束(turn/end) | **三连跳庆祝** 「🎉 搞定啦~ 咴儿咴儿!」(翻车时改成 😵) |
| 新消息到达 | 「📥 收到!出发~」 |

互动彩蛋:

- **戳一戳**:摇头晃脑 + 爱心/草叶粒子 + 随机「泥马语录」;打盹时被戳会惊醒 😳
- **拎起来**:可以按住拖动到任意高度松手,四肢下垂摇摆,落地带重力回弹
- 嘴上的草一直在随风摆动(致敬经典表情包)

## 工作原理

这是一个标准的 DSH 双面包(dual-face)插件:

- `lib/index.js` — 宿主(node)半:空的 `apply()`,只为让 Loader 存在一行,使 `dsh-client-modules` 扫描到本包的 `dsh.client` 声明;
- `lib/client.js` — 浏览器半:`window.__ModuleLoader__.load` 注册的可懒加载 bundle,不依赖 React(零 `require`),声明 `dsh.client.immediately: true` 使其在启动时即被物化;
- 状态来源:`ctx.sessions`(`dsh-api-session-controller` 浏览器半)
  - `sessions.list` → 当前选中会话
  - `binding.session`(ObservableSnapshot)→ `snapshot.running` → 散步/工作切换
  - `binding.eventSource`(会话事件窗口)→ 增量扫描 `tool/call`、`approval/*`、`turn/end` 等事件驱动表情与气泡(首载/重连只快进,不回放历史)

动画全部为 CSS keyframes + `requestAnimationFrame` 定位;卸载(dispose / HMR 换血)时移除节点与 `<style data-plugin>`,不留残留。

## 安装

### 推荐方式：profile bundle 正式安装

本包声明了 `dsh.bundle.patch`（`cordis.patch.yml` 按包名插入 `caonima` 行），克隆后直接：

```bash
git clone https://github.com/hzhgino/dsh-caonima.git
cd dsh-caonima
dsh plugin --profile web add "$(pwd)"     # 发布到 npm 后也可按包名 add
```

然后**重启一次 web host**（bundle 层栈的变化在启动时组装），刷新浏览器页面即可。

> 卸载:`dsh plugin --profile web remove dsh-caonima`,重启后桌宠消失。

### 免打包方式：patch 直挂（开发尝鲜，免重启）

把插件按绝对路径插入 web profile 的 patch 层，`patchReload: live` 的 profile 会让运行中的 host 热重组（无需重启，刷新页面即见）：

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- insert:
    - id: caonima
      name: /绝对路径/dsh-caonima/lib/index.js
```

> ⚠️ 二选一：两种方式同时生效时，同一 client 包会被两个 Loader 来源解析，composition 会显式拒绝——正式安装前先删掉 patch 里的路径 insert 行。

## 开发迭代(热更新)

`client-hmr` 的 node 半会轮询每个 in-graph bundle 的文件状态:
直接编辑 `lib/client.js` 并保存 → 正在打开的页面**无需刷新**即被原地换血(插件内部状态重置,连接与会话不受影响)。

## 发布到 npm（可选）

`package.json` 已设 `publishConfig` 并移除 `"private": true`，登录后即可：

```bash
npm login
npm publish
```

发布后安装就是一条命令，且支持 `update`：

```bash
dsh plugin --profile web add dsh-caonima
```

