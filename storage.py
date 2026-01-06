"""
数据存储模块

负责电量数据的持久化存储和管理
"""
import json
import logging
from datetime import datetime
from glob import glob
from os import makedirs, path
from typing import Dict, List, Optional, Union

import pytz

from config import DATA_DIR, TIME_FILE, LAST_RECORDS_FILE, TIMEZONE

logger = logging.getLogger(__name__)


def get_cst_time(fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    获取中国标准时间字符串

    Args:
        fmt: 时间格式

    Returns:
        格式化的时间字符串
    """
    tz = pytz.timezone(TIMEZONE)
    return datetime.now(tz).strftime(fmt)


def load_json(file_path: str) -> Optional[Union[List, Dict]]:
    """
    从 JSON 文件加载数据

    Args:
        file_path: 文件路径

    Returns:
        JSON 数据或 None
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning(f"加载 JSON 文件失败 {file_path}: {e}")
        return None


def save_json(data: Union[List, Dict], file_path: str, indent: int = 2) -> bool:
    """
    保存数据到 JSON 文件

    Args:
        data: 要保存的数据
        file_path: 文件路径
        indent: 缩进空格数

    Returns:
        是否成功
    """
    try:
        dir_path = path.dirname(file_path)
        if dir_path and not path.exists(dir_path):
            makedirs(dir_path, exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=indent)

        logger.info(f"数据已保存: {file_path}")
        return True
    except Exception as e:
        logger.error(f"保存数据失败: {e}")
        return False


def record_energy_data(data: Dict) -> Optional[List[Dict]]:
    """
    记录电量数据到当月文件

    Args:
        data: 电量数据 {"time": "...", "light_Balance": ..., "ac_Balance": ...}

    Returns:
        当月所有数据
    """
    month_str = get_cst_time("%Y-%m")
    file_path = path.join(DATA_DIR, f"{month_str}.json")

    existing_data = load_json(file_path) or []
    existing_data.append(data)
    save_json(existing_data, file_path)

    return existing_data


def update_time_list() -> List[str]:
    """
    更新时间列表文件

    Returns:
        时间列表（按时间倒序）
    """
    if not path.exists(DATA_DIR):
        raise FileNotFoundError(f"数据目录不存在: {DATA_DIR}")

    # 查找所有月份文件
    pattern = path.join(DATA_DIR, "????-??.json")
    json_files = [
        path.splitext(path.basename(f))[0]
        for f in glob(pattern)
    ]

    # 按时间倒序排列
    json_files = sorted(
        json_files,
        key=lambda x: datetime.strptime(x, "%Y-%m"),
        reverse=True
    )

    save_json(json_files, TIME_FILE)
    logger.info("时间列表已更新")

    return json_files


def update_last_records(current_month_data: Optional[List[Dict]] = None) -> None:
    """
    更新最近 30 条记录文件

    Args:
        current_month_data: 当月数据（可选）
    """
    time_list = update_time_list()

    # 获取当月数据
    if current_month_data is None and time_list:
        current_month_file = path.join(DATA_DIR, f"{time_list[0]}.json")
        current_month_data = load_json(current_month_file) or []

    current_count = len(current_month_data) if current_month_data else 0

    # 如果当月数据不足 30 条，从上月补充
    if current_count < 30 and len(time_list) > 1:
        prev_month_file = path.join(DATA_DIR, f"{time_list[1]}.json")
        prev_month_data = load_json(prev_month_file) or []

        need_count = min(30 - current_count, len(prev_month_data))
        combined_data = prev_month_data[-need_count:] + (current_month_data or [])
    else:
        combined_data = current_month_data or []

    # 只保留最近 30 条
    last_30 = combined_data[-30:]
    save_json(last_30, LAST_RECORDS_FILE)

    logger.info("最近 30 条记录已更新")
