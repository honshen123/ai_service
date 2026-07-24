# AI 客服移动端 — UniApp

Vue3 + TypeScript + UniApp，支持 **H5 / App / 微信小程序** 多端打包。

## 技术栈变更

| 原方案 | 现方案 |
|--------|--------|
| Vue3 + Vite + Vant + vue-router | **UniApp + Pinia + uni.request** |
| `views/` + TabLayout | `pages/` + `pages.json` TabBar |
| axios + localStorage | uni.request + uni.setStorageSync |

## 功能模块

| 入口 | 路径 | 功能 |
|------|------|------|
| 登录 | `pages/login` | JWT 登录 |
| 消息 | `pages/messages` | 会话列表、筛选、跳转聊天 |
| 工单 | `pages/tickets` | 列表、新建、详情 |
| 数据 | `pages/statistics` | 概览 / 渠道 / 质检 |
| 计费 | `pages/billing` | 钱包、套餐、支付 |
| 我的 | `pages/profile` | 租户信息、深色模式、入口 |
| 聊天 | `pages/chat` | 接管/释放、AI 推荐、摘要 |
| 知识库 | `pages/knowledge` | 新建、入库、删除 |
| 店铺 | `pages/platforms` | 绑定店铺 |

## 本地开发

```bash
cd mobile
npm install --legacy-peer-deps

# H5（端口 5180，/tenant 代理到 8000）
npm run dev:h5
# 浏览器打开终端里显示的 Local 地址，例如 http://localhost:5180/

# 微信小程序
npm run dev:mp-weixin

# App
npm run dev:app
```

## 生产构建

```bash
npm run build:h5          # → dist/build/h5
npm run build:mp-weixin   # → dist/build/mp-weixin
npm run build:app         # → 供 HBuilderX 云打包
```

## 演示登录

- 租户编码：`demo`
- 用户名：`demo_agent`
- 密码：`Demo@123456`

## 目录结构

```
mobile/
├── src/
│   ├── pages/           # 页面（UniApp 路由）
│   ├── components/      # PageHeader、SessionCard
│   ├── api/             # tenant.ts + uni.request 封装
│   ├── store/           # auth、theme（Pinia）
│   ├── composables/     # useApp（导航/Toast/主题）
│   ├── styles/          # global.scss + tokens.scss
│   ├── pages.json       # 路由 + TabBar
│   └── manifest.json    # H5 代理 / App 权限 / 小程序 appid
├── static/tab/          # TabBar 图标（可替换为设计稿）
├── index.html
├── vite.config.ts
└── package.json
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_API_PREFIX` | API 前缀；开发留空，走 manifest.json H5 代理 |

## 多端打包说明

- **H5**：`npm run build:h5`，部署 `dist/build/h5` 到 Nginx
- **App**：HBuilderX 打开项目 → 发行 → 原生 App 云打包
- **小程序**：填写 `manifest.json → mp-weixin.appid`，构建后导入微信开发者工具

## TabBar 图标

当前 `static/tab/` 为占位图标，建议替换为 81×81 px 的设计稿（普通/选中各一套）。

## H5 开发常见问题

### 白屏 + `Uncaught SyntaxError: Invalid or unexpected token (at index.js:1:1)`

通常是 **JS 请求返回了 HTML**（首字符 `<`），常见原因：

1. **端口不一致**：`5174` 与 `frontend/admin` 冲突；若 5180 已被占用，`strictPort` 会直接报错，请先结束旧进程再启动。
2. **浏览器缓存**：曾打开过 `dist/build/h5` 生产包，缓存的 `index.html` 仍引用 `/assets/index-*.js`，在 dev 模式下会 404 并回落为 HTML。请 **硬刷新**（Ctrl+Shift+R）或清空站点缓存。
3. **地址栏端口**：务必使用 `npm run dev:h5` 终端输出的 `Local:` 地址（默认 `http://localhost:5180/`）。
