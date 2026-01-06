# ZZU Electricity Monitor

郑州大学宿舍电量监控系统

## 功能特性

- 定时自动获取照明/空调电量
- 低电量多渠道通知 (20+ 渠道)
- 现代化前端，支持深色模式
- AES-256-GCM 加密存储
- GitHub Actions 全自动运行

## 快速开始

### 第一步：Fork 仓库

点击右上角 Fork 按钮，将本仓库复制到你的账号下。

### 第二步：配置 Secrets

进入你 Fork 的仓库，点击 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**，添加以下必填配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ACCOUNT` | 郑州大学统一认证账号 | 学号 |
| `PASSWORD` | 统一认证密码 | 你的密码 |
| `LIGHT_ROOM` | 照明电量房间号 | [获取方法](https://blog.elykia.cn/posts/22) |
| `AC_ROOM` | 空调电量房间号 | [获取方法](https://blog.elykia.cn/posts/22) |

### 第三步：启用 Actions

进入 **Actions** 页面，点击 **I understand my workflows, go ahead and enable them** 启用工作流。

**定时触发方式（二选一）：**

- **方式一：GitHub Actions 定时**（简单，但可能有 10-60 分钟延迟）

  编辑 `.github/workflows/static.yml`，取消注释 schedule 部分：
  ```yaml
  on:
    schedule:
      - cron: '0 16,20,0,4,8,12 * * *'  # UTC 时间，对应北京 0,4,8,12,16,20 点
    workflow_dispatch:
  ```

- **方式二：Pipedream 精确定时**（推荐，无延迟）

  参考下方 [Pipedream 精确定时](#pipedream-精确定时推荐) 配置。

你也可以点击 **Run workflow** 手动触发运行。

### 第四步：配置通知渠道（可选）

至少配置一个通知渠道以接收电量提醒。推荐使用 Telegram，无发送次数限制。

## 通知渠道配置

### Telegram（推荐）

每次运行都会发送通知，无发送次数限制。

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | Bot Token，从 @BotFather 获取 | 是 |
| `TELEGRAM_CHAT_ID` | Chat ID，从 @userinfobot 获取 | 是 |

**获取方法：**
1. 在 Telegram 搜索 @BotFather，发送 `/newbot` 创建机器人，获取 Token
2. 搜索 @userinfobot，发送任意消息获取你的 Chat ID
3. 给你创建的机器人发送一条消息（激活对话）

### Server酱

仅在电量不足时发送，节约每日 5 条的免费额度。

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `SERVERCHAN_KEY` | SendKey，从 sct.ftqq.com 获取 | 是 |
| `SERVERCHAN_KEY2` | 备用 SendKey | 否 |
| `SERVERCHAN_KEY3` | 备用 SendKey | 否 |

### 邮件通知

仅在电量不足时发送。

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `EMAIL` | 邮箱地址（发送和接收） | 是 |
| `SMTP_CODE` | SMTP 授权码（非邮箱密码） | 是 |
| `SMTP_SERVER` | SMTP 服务器地址 | 是 |

**常用 SMTP 服务器：**
- QQ邮箱：`smtp.qq.com`
- 163邮箱：`smtp.163.com`
- Gmail：`smtp.gmail.com`

### Bark（iOS）

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `BARK_KEY` | Bark 推送密钥 | 是 |
| `BARK_URL` | 自建服务器地址 | 否 |

### 钉钉机器人

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `DINGTALK_WEBHOOK` | 机器人 Webhook 地址 | 是 |
| `DINGTALK_SECRET` | 加签密钥 | 否 |

### 飞书机器人

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `FEISHU_WEBHOOK` | 机器人 Webhook 地址 | 是 |
| `FEISHU_SECRET` | 加签密钥 | 否 |

### 企业微信

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `WECOM_CORP_ID` | 企业 ID | 是 |
| `WECOM_AGENT_ID` | 应用 AgentId | 是 |
| `WECOM_SECRET` | 应用 Secret | 是 |
| `WECOM_TOUSER` | 接收用户，默认 @all | 否 |

### PushPlus

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `PUSHPLUS_TOKEN` | 推送 Token | 是 |

### go-cqhttp

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `GOCQHTTP_URL` | go-cqhttp 服务地址 | 是 |
| `GOCQHTTP_TOKEN` | 访问令牌 | 否 |
| `GOCQHTTP_TARGET` | 目标 QQ 号 | 是 |

### Gotify

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `GOTIFY_URL` | Gotify 服务器地址 | 是 |
| `GOTIFY_TOKEN` | 应用 Token | 是 |

### iGot

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `IGOT_KEY` | iGot 推送密钥 | 是 |

### PushDeer

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `PUSHDEER_KEY` | PushDeer 推送密钥 | 是 |

### Synology Chat

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `SYNOLOGY_CHAT_URL` | Synology Chat 服务器地址 | 是 |
| `SYNOLOGY_CHAT_TOKEN` | Incoming Webhook Token | 是 |

### Qmsg酱

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `QMSG_KEY` | Qmsg 密钥 | 是 |
| `QMSG_QQ` | 指定接收的 QQ 号 | 否 |

### 智能微秘书

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `AIBOTK_KEY` | API Key | 是 |
| `AIBOTK_TARGET` | 目标用户或群 | 是 |

### PushMe

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `PUSHME_KEY` | PushMe 推送密钥 | 是 |

### Chronocat

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `CHRONOCAT_URL` | Chronocat 服务地址 | 是 |
| `CHRONOCAT_TOKEN` | 访问令牌 | 否 |
| `CHRONOCAT_TARGET` | 目标 QQ 号 | 是 |

### ntfy

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NTFY_TOPIC` | ntfy 主题名称 | 是 |
| `NTFY_URL` | 自建服务器地址 | 否 |
| `NTFY_TOKEN` | 访问令牌 | 否 |

### 自定义 Webhook

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `WEBHOOK_URL` | Webhook 地址 | 是 |
| `WEBHOOK_METHOD` | 请求方法，默认 POST | 否 |
| `WEBHOOK_HEADERS` | 请求头，JSON 格式 | 否 |
| `WEBHOOK_BODY_TEMPLATE` | 请求体模板，支持 `{{title}}` 和 `{{content}}` 占位符 | 否 |

## 通知逻辑

| 渠道 | 触发条件 | 说明 |
|------|----------|------|
| Telegram | 每次运行 | 无发送限制，推荐作为主要通知渠道 |
| 其他渠道 | 仅低电量 | 电量低于 10 度时发送，避免频繁打扰 |

## 通知示例

**电量充足时（仅 Telegram 收到）：**
```
🏠宿舍电量通报🏠

💡 照明剩余电量：125.0 度（充足）
❄️ 空调剩余电量：80.0 度（偏低）

当前电量充足，请保持关注。
```

**电量不足时（所有渠道都会收到）：**
```
⚠️宿舍电量预警⚠️

💡 照明剩余电量：8.5 度（警告）
❄️ 空调剩余电量：5.0 度（警告）

⚠️ 电量不足，请尽快充电！
```

## 项目结构

```
ZZU-Electricity-Monitor/
├── main.py              # 主程序入口
├── monitor.py           # 电量监控模块，负责获取电量数据
├── notify.py            # 通知模块，支持 20+ 通知渠道
├── storage.py           # 数据存储模块，管理电量历史记录
├── crypto.py            # 加密模块，AES-256-GCM 加密
├── config.py            # 配置模块，环境变量读取
├── markdown.py          # Markdown 报告生成
├── requirements.txt     # Python 依赖
├── .github/workflows/
│   └── static.yml       # GitHub Actions 工作流
└── page/                # 前端页面
    ├── index.html       # 主页面，数据可视化
    ├── style.css        # 样式文件，支持深色模式
    └── data/            # 电量数据（page 分支）
```

## 分支说明

| 分支 | 用途 | 说明 |
|------|------|------|
| `main` | 源代码 | Python 后端、GitHub Actions 工作流、前端模板 |
| `page` | 部署分支 | GitHub Pages 静态资源、电量数据、加密令牌 |

**为什么分两个分支？**

- **数据持久化**：电量数据存储在 `page` 分支，代码更新不会丢失历史数据
- **独立部署**：前端资源与后端代码分离，GitHub Pages 直接部署 `page` 分支
- **安全隔离**：加密的认证令牌 (`tokens.enc`) 仅存在于 `page` 分支
- **快速加载**：`page` 分支仅包含静态资源，访问速度更快

## 技术栈

- **Python 3.14** - 主程序语言
- **ZZU.Py** - 郑州大学统一认证 API 封装
- **ECharts 6.0** - 数据可视化图表
- **GitHub Actions** - CI/CD 自动化
- **GitHub Pages** - 静态页面托管
- **AES-256-GCM** - 数据加密

## 常见问题

### 如何获取房间号？

参考教程：[郑州大学宿舍电量监控：ZZU-Electricity-Monitor](https://blog.elykia.cn/posts/22)

### 为什么没有收到通知？

1. 检查 Secrets 配置是否正确
2. 检查 Actions 是否启用
3. 查看 Actions 运行日志排查错误

### 如何修改运行频率？

编辑 `.github/workflows/static.yml` 文件中的 cron 表达式：

```yaml
schedule:
  - cron: '0 16,20,0,4,8,12 * * *'  # UTC 时间，对应北京时间 0,4,8,12,16,20 点
```

### Pipedream 精确定时（推荐）

GitHub Actions 定时任务存在延迟，如需精确定时可使用 [Pipedream](https://pipedream.com/)：

1. **创建 GitHub Token**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 勾选 `repo` 和 `workflow` 权限，生成并保存 Token

2. **配置 Pipedream**
   - 注册 Pipedream，创建新 Workflow
   - 触发器选择 **Schedule**，设置 cron: `0 0,4,8,12,16,20 * * *`（时区选 Asia/Shanghai）
   - 添加 **Send POST Request** 步骤：
     - URL: `https://api.github.com/repos/你的用户名/ZZU-Electricity-Monitor/actions/workflows/static.yml/dispatches`
     - Authorization: 选择 **Bearer Token**，填入你的 GitHub Token
     - Headers: 添加 `Accept` = `application/vnd.github.v3+json`
     - Body: `{"ref": "main"}`

3. **部署并启用 Workflow**

配置完成后，Pipedream 会在精确时间触发 GitHub Actions，无延迟。

### 如何修改电量阈值？

编辑 `config.py` 文件：

```python
THRESHOLD = 10.0           # 低电量警告阈值
EXCELLENT_THRESHOLD = 100.0  # 充足电量阈值
```

## 致谢

- [ZZU.Py](https://github.com/Illustar0/ZZU.Py)
- [ZZU-Electricity](https://github.com/TorCroft/ZZU-Electricity)

## License

[MIT License](LICENSE)
