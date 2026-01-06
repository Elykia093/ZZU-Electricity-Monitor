"""配置常量模块"""
import os

# 电量阈值
THRESHOLD = 10.0  # 低电量警告阈值
EXCELLENT_THRESHOLD = 100.0  # 充足电量阈值

# 文件路径
DATA_DIR = "./page/data"
TOKEN_FILE = os.path.join(DATA_DIR, "tokens.json")
TOKEN_ENC_FILE = os.path.join(DATA_DIR, "tokens.enc")
TIME_FILE = os.path.join(DATA_DIR, "time.json")
LAST_RECORDS_FILE = os.path.join(DATA_DIR, "last_30_records.json")

# 重试配置
RETRY_ATTEMPTS = 5
RETRY_MULTIPLIER = 1
INITIAL_WAIT = 15
MAX_WAIT = 120

# 时区
TIMEZONE = "Asia/Shanghai"

# ==================== 基础环境变量 ====================
ACCOUNT = os.getenv("ACCOUNT")
PASSWORD = os.getenv("PASSWORD")
LIGHT_ROOM = os.getenv("LIGHT_ROOM")  # 照明电量房间号
AC_ROOM = os.getenv("AC_ROOM")  # 空调电量房间号

# ==================== 通知渠道配置 ====================

# Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Server酱
SERVERCHAN_KEYS = os.getenv("SERVERCHAN_KEYS")

# 邮件
EMAIL = os.getenv("EMAIL")
SMTP_CODE = os.getenv("SMTP_CODE")
SMTP_SERVER = os.getenv("SMTP_SERVER")

# Bark (iOS)
BARK_URL = os.getenv("BARK_URL")  # 可选，默认 https://api.day.app
BARK_KEY = os.getenv("BARK_KEY")

# 钉钉机器人
DINGTALK_WEBHOOK = os.getenv("DINGTALK_WEBHOOK")
DINGTALK_SECRET = os.getenv("DINGTALK_SECRET")  # 可选，加签密钥

# 飞书机器人
FEISHU_WEBHOOK = os.getenv("FEISHU_WEBHOOK")
FEISHU_SECRET = os.getenv("FEISHU_SECRET")  # 可选，加签密钥

# go-cqhttp
GOCQHTTP_URL = os.getenv("GOCQHTTP_URL")
GOCQHTTP_TOKEN = os.getenv("GOCQHTTP_TOKEN")  # 可选
GOCQHTTP_TARGET = os.getenv("GOCQHTTP_TARGET")  # QQ号

# Gotify
GOTIFY_URL = os.getenv("GOTIFY_URL")
GOTIFY_TOKEN = os.getenv("GOTIFY_TOKEN")

# iGot
IGOT_KEY = os.getenv("IGOT_KEY")

# PushDeer
PUSHDEER_KEY = os.getenv("PUSHDEER_KEY")

# Synology Chat
SYNOLOGY_CHAT_URL = os.getenv("SYNOLOGY_CHAT_URL")
SYNOLOGY_CHAT_TOKEN = os.getenv("SYNOLOGY_CHAT_TOKEN")

# PushPlus
PUSHPLUS_TOKEN = os.getenv("PUSHPLUS_TOKEN")

# 企业微信
WECOM_CORP_ID = os.getenv("WECOM_CORP_ID")
WECOM_AGENT_ID = os.getenv("WECOM_AGENT_ID")
WECOM_SECRET = os.getenv("WECOM_SECRET")
WECOM_TOUSER = os.getenv("WECOM_TOUSER")  # 可选，默认 @all

# Qmsg酱
QMSG_KEY = os.getenv("QMSG_KEY")
QMSG_QQ = os.getenv("QMSG_QQ")  # 可选

# 智能微秘书 (Aibotk)
AIBOTK_KEY = os.getenv("AIBOTK_KEY")
AIBOTK_TARGET = os.getenv("AIBOTK_TARGET")

# PushMe
PUSHME_KEY = os.getenv("PUSHME_KEY")

# Chronocat
CHRONOCAT_URL = os.getenv("CHRONOCAT_URL")
CHRONOCAT_TOKEN = os.getenv("CHRONOCAT_TOKEN")  # 可选
CHRONOCAT_TARGET = os.getenv("CHRONOCAT_TARGET")  # QQ号

# ntfy
NTFY_URL = os.getenv("NTFY_URL")  # 可选，默认 https://ntfy.sh
NTFY_TOPIC = os.getenv("NTFY_TOPIC")
NTFY_TOKEN = os.getenv("NTFY_TOKEN")  # 可选

# 自定义 Webhook
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
WEBHOOK_METHOD = os.getenv("WEBHOOK_METHOD")  # 可选，默认 POST
WEBHOOK_HEADERS = os.getenv("WEBHOOK_HEADERS")  # 可选，JSON 格式
WEBHOOK_BODY_TEMPLATE = os.getenv("WEBHOOK_BODY_TEMPLATE")  # 可选，支持 {{title}} {{content}}
