"""
ZZU 宿舍电量监控 - 主入口

功能:
1. 获取宿舍电量信息
2. 记录电量数据
3. 发送通知
"""
import logging
import os
import sys
import threading
import time

from config import ACCOUNT, PASSWORD, LIGHT_ROOM, AC_ROOM
from monitor import EnergyMonitor
from storage import record_energy_data, update_time_list, update_last_records
from notify import notify

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_cst_time_str(format_str: str) -> str:
    """获取中国标准时间字符串"""
    import pytz
    from datetime import datetime

    cst_tz = pytz.timezone("Asia/Shanghai")
    return datetime.now(cst_tz).strftime(format_str)


def main():
    """主函数"""
    logger.info("启动宿舍电量监控程序...")

    # 检查必要的环境变量
    required_env_vars = ["ACCOUNT", "PASSWORD", "LIGHT_ROOM", "AC_ROOM"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"缺少必要的环境变量: {', '.join(missing_vars)}")
        sys.exit(1)

    # 获取电量信息
    monitor = EnergyMonitor()
    try:
        balances = monitor.get_balance()
    except Exception as e:
        logger.error(f"获取电量失败: {e}")
        sys.exit(1)

    logger.info(
        f"照明剩余电量: {balances['light_Balance']} 度, "
        f"空调剩余电量: {balances['ac_Balance']} 度"
    )

    # 发送通知
    notify(balances)

    # 记录数据
    latest_record = {
        "time": get_cst_time_str("%m-%d %H:%M:%S"),
        "light_Balance": balances["light_Balance"],
        "ac_Balance": balances["ac_Balance"],
    }

    record_energy_data(latest_record)
    update_time_list()
    update_last_records()

    logger.info("程序运行结束")


if __name__ == "__main__":
    main()

    # 打印存活线程，辅助调试
    for t in threading.enumerate():
        print(f"存活线程: {t.name}, daemon={t.daemon}")

    # 优雅退出
    logging.shutdown()
    time.sleep(0.5)
    os._exit(0)
