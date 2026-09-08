[[ 简体中文 ]](https://github.com/liandu2024/AnGe-Panel/blob/main/README.md) |
[[ English ]](https://github.com/liandu2024/AnGe-Panel/blob/main/README_EN.md)

<div align=center>

<img src="./doc/images/main-preview.jpg" width="100%" />

# AnGe-Panel

[![Github](https://img.shields.io/badge/Github-123456?logo=github&labelColor=242424)](https://github.com/liandu2024/AnGe-Panel)
[![docker](https://img.shields.io/badge/docker-123456?logo=docker&logoColor=fff&labelColor=1c7aed)](https://github.com/liandu2024/AnGe-Panel/pkgs/container/ange-panel) 
[![Telegram](https://img.shields.io/badge/Telegram-123456?logo=telegram&labelColor=229ED9)](https://t.me/angeworld2024)
<br>

</div>

A perfect website navigation + webpage bookmarks panel.

完美的网站导航 + 网页收藏夹。

---

## 主要功能

### 1) 左侧分组目录条（快速定位）
![](./doc/images/sidebar-nav.jpg)

- 页面左侧新增"分组目录条"，点击圆点可 **一键跳转** 到对应分组。
- 分组多的时候，不用一直往下滑找。

### 2) 网站 + 网页 两种收藏模式
- **网站**：适合收藏「一个站点」和它的入口（比如 NAS、博客、后台管理）。
- **网页**：适合收藏「一篇文章 / 一个页面」的链接（比如知乎文章、头条链接、教程页面）。
- 你可以在"网站 / 网页"之间切换，搜索条件也会保持，不会丢。

### 3) 网页收藏更好用
![](./doc/images/webbookmarks.jpg)

- 网页列表支持：一键置顶/取消置顶、快速编辑、快速删除。
- 置顶/新建/修改/删除 **不会整页刷新**，界面不会"闪一下/跳一下"。

### 4) 图标 / 壁纸 分开管理，支持复用
- 上传图片时区分"图标"和"壁纸"，避免混在一起不好找。
- 已上传的图标/壁纸可以在历史里 **重复选择复用**，不需要每次重新上传。

### 5) 一些贴心的体验优化
- 链接去重校验（避免重复收藏同一 URL）。
- 列表标题自动省略、需要时再悬停看全名。
- 移动端体验优化（更紧凑、更清爽）。

![](./doc/images/mobile-1.jpg)
![](./doc/images/mobile-2.jpg)

### 6) 访问令牌 — 免密码登录
- 每个用户可以生成多个"个人访问令牌"，在 URL 追加 `?accessToken=xxx` 即可自动登录，无需每次输入账号密码。
- 令牌通过 SHA256 哈希存库，明文仅创建时展示一次，可随时在设置 → 访问令牌中吊销。

### 7) Chrome 浏览器插件 — 一键收藏

配合 Chrome 扩展（`chrome-extension/` 目录），可以在浏览网页时一键保存到 AnGe-Panel：

- **首次使用**：填写服务器地址和个人访问令牌即可连接
- **分类分组**：支持选择"网站导航"/"网页收藏"及对应的分组
- **自动获取**：自动读取当前页面标题和 favicon 图标
- **自定义标题**：保存前可修改标题，确认后再保存

安装方式：打开 `chrome://extensions` → 开发者模式 → 加载已解压的扩展 → 选择 `chrome-extension/` 目录。

> 注意：插件使用个人访问令牌认证，需先在面板「设置 → 访问令牌」中生成一个令牌。

## 源码部署

### 环境要求

| 工具 | 最低版本 |
|------|---------|
| Go | 1.20 |
| Node.js | 16+ |
| pnpm | 8+ |

### 编译

```bash
# 1. 后端
CGO_ENABLED=0 go build -o ange-panel ./main.go

# 2. 前端（如需要修改前端源码）
pnpm install
npx vite build

# 3. 准备前端静态文件（构建产物在 dist/，创建软链接到web，后端托管目录为web）
ln -s $(pwd)/dist $(pwd)/web

# 4. 运行
./ange-panel
```



## 🔐 首次登录

登录网址：http://[部署设备的IP]:3005

- **默认管理员账号**：`admin`
- **默认管理员密码**：`admin`

首次启动时会自动创建示例分组和示例网站/网页链接，方便快速体验功能。

> ⚠️ 首次登录后请尽快修改密码！



## ❤️ 感谢

- 本项目 fork 自 [AnGe-Panel](https://github.com/liandu2024/AnGe-Panel)，感谢原作者的设计与开发。
- 底层基于 [Sun-Panel v1.3.0 开源版](https://github.com/hslr-s/sun-panel)，感谢原项目的辛勤付出。

---


