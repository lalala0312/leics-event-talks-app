# BigQuery Release Pulse 🚀

[English](#english) | [中文](#中文-1)

---

## 中文

**BigQuery Release Pulse** 是一个精美的单页 Web 仪表盘，利用 **Python Flask** 结合原生的 **HTML5, CSS3, JavaScript** 构建。它能够从 Google Cloud 官方订阅源实时抓取 BigQuery 的最新发布日志（Release Notes），对条目进行智能分类拆分，并提供一键分享到 X (Twitter) 的推文编写器。

### ✨ 主要特性

*   **实时数据解析**：自动解析官方 Atom XML 订阅源，按日期和主题拆分，并用精致的卡片呈现。
*   **智能分类徽章**：自动标记并渲染不同的分类标签：
    *   🟢 `Feature` (特性)
    *   🟡 `Change` (变更)
    *   🔵 `Announcement` (公告)
    *   🔴 `Deprecated` (弃用)
*   **即时筛选**：支持输入关键字模糊查询，并可使用分类按钮组合过滤。
*   **推文编写器 (X / Twitter Composer)**：
    *   点击任意更新卡片，自动提取重点生成推文草稿，附带 `#BigQuery #GoogleCloud` 话题及文档链接。
    *   模态框实时预览字数限制（280 字），配有动态 SVG 环形进度条。
    *   一键唤起官方 Web Intent 发推。
*   **高鲁棒性设计**：支持内存缓存，在官方数据源请求失败时进行优雅降级展示。
*   **骨架屏渲染**：网络请求期间，显示闪烁加载态（Skeleton screen）。

### 📂 项目结构

*   `app.py`：Flask 后端核心，负责路由分发、XML 解析、HTML 纯文本转换及降级缓存。
*   `templates/index.html`：前端单页结构，结合 Google 字体与 FontAwesome 图标库。
*   `static/css/style.css`：极简暗色系美学、玻璃悬浮效果（Glassmorphism）、微交互及渐变动效。
*   `static/js/app.js`：前端业务逻辑，负责渲染卡片、本地过滤、模态框交互和推文处理。
*   `requirements.txt`：项目运行所必须的依赖包。
*   `.gitignore`：排除本地 Python 缓存和虚拟环境等。

### 🛠️ 快速开始

#### 1. 克隆与初始化环境
```bash
# 克隆项目并进入目录
cd bq-release-notes

# 创建 Python 虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# .\venv\Scripts\activate # Windows
```

#### 2. 安装依赖并启动
```bash
# 安装必要包
pip install -r requirements.txt

# 运行 Flask 项目
python app.py
```
运行成功后，在浏览器访问 **http://127.0.0.1:5001** 即可。

---

## English

**BigQuery Release Pulse** is a premium, responsive single-page web dashboard built with **Python Flask** and vanilla **HTML5, CSS3, and JavaScript**. It fetches the latest Google BigQuery release notes from the official RSS/Atom feed, parses and splits combined entries into distinct update cards, and enables a seamless workflow to preview, edit, and share key updates directly to X (Twitter).

### ✨ Features

*   **Smart Feed Parser**: Automates XML parsing from Google Cloud and reorganizes combined updates into individual, easy-to-read cards grouped by date.
*   **Color-Coded Badges**: Automatically categorizes notes into status tags:
    *   🟢 `Feature` (Emerald)
    *   🟡 `Change` (Amber)
    *   🔵 `Announcement` (Indigo)
    *   🔴 `Deprecated` (Rose)
*   **Instant Search & Filters**: Offers a real-time keyword search bar and clickable category pill filters.
*   **Interactive Tweet Composer**:
    *   Click any card to select it, then click **Tweet Update** to generate a formatted draft containing category, date, brief description, hashtags `#BigQuery #GoogleCloud`, and the source documentation link.
    *   A character counter validating the 280-character limit with a dynamic SVG progress ring.
    *   Opens the official Twitter Web Intent in a new tab for seamless tweeting.
*   **Graceful Cache Fallback**: Uses in-memory cache to display historical updates if the external Google feed is unreachable.
*   **Premium Dark UI**: A glassmorphism layout complete with grid responsiveness, ambient backdrop glows, smooth hover scaling, and skeleton loaders.

### 📂 Project Layout

*   `app.py`: Flask entrypoint managing endpoint routers, XML structure parsing, HTML tag stripping, and cache fallbacks.
*   `templates/index.html`: Semantic layout integrating Google Outfit/Plus Jakarta Sans fonts and FontAwesome icons.
*   `static/css/style.css`: Design stylesheet carrying color schemas, glowing effects, and micro-animations.
*   `static/js/app.js`: Front-end state handling, interactive modal composition, and Twitter API intent bindings.
*   `requirements.txt`: Python package requirement dependencies.
*   `.gitignore`: Prevents temporary system and compilation files from being tracked.

### 🛠️ Quick Start

#### 1. Setup Environment
```bash
# Navigate to the repository
cd bq-release-notes

# Initialize Python virtual environment
python3 -m venv venv

# Activate the environment
source venv/bin/activate
```

#### 2. Install Packages & Run
```bash
# Install dependencies
pip install -r requirements.txt

# Start the Flask app
python app.py
```
Open **http://127.0.0.1:5001** in your browser to run the application.
