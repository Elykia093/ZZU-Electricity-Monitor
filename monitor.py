"""
电量监控模块

负责获取宿舍电量信息
"""
import json
import logging
from os import makedirs, path
from typing import Dict, Optional

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    wait_chain,
    wait_fixed,
    retry_if_exception_type,
)
from zzupy.app import CASClient, ECardClient

from config import (
    ACCOUNT, PASSWORD, LIGHT_ROOM, AC_ROOM,
    TOKEN_FILE, DATA_DIR,
    RETRY_ATTEMPTS, RETRY_MULTIPLIER, INITIAL_WAIT, MAX_WAIT,
)
from storage import get_cst_time

logger = logging.getLogger(__name__)


def create_retry_decorator(stop_attempts: int = RETRY_ATTEMPTS, wait_strategy=None):
    """
    创建统一的重试装饰器

    Args:
        stop_attempts: 最大重试次数
        wait_strategy: 等待策略

    Returns:
        重试装饰器
    """
    if wait_strategy is None:
        wait_strategy = wait_exponential(
            multiplier=RETRY_MULTIPLIER,
            min=INITIAL_WAIT,
            max=MAX_WAIT
        )

    return retry(
        stop=stop_after_attempt(stop_attempts),
        wait=wait_strategy,
        retry=retry_if_exception_type(Exception),
        reraise=True
    )


# 请求重试装饰器（带链式等待）
request_retry = create_retry_decorator(
    wait_strategy=wait_chain(
        wait_fixed(15),
        wait_fixed(30),
        wait_exponential(multiplier=1, min=45, max=120)
    )
)


class TokenManager:
    """Token 管理器"""

    @staticmethod
    def save(user_token: str, refresh_token: str) -> None:
        """保存 token 到文件"""
        try:
            token_data = {
                "user_token": user_token,
                "refresh_token": refresh_token,
                "saved_at": get_cst_time()
            }

            dir_path = path.dirname(TOKEN_FILE)
            if dir_path and not path.exists(dir_path):
                makedirs(dir_path, exist_ok=True)

            with open(TOKEN_FILE, "w", encoding="utf-8") as f:
                json.dump(token_data, f, ensure_ascii=False, indent=2)

            logger.info(f"Token 已保存: {TOKEN_FILE}")
        except Exception as e:
            logger.error(f"保存 Token 失败: {e}")
            raise

    @staticmethod
    def load() -> Optional[Dict[str, str]]:
        """从文件加载 token"""
        try:
            if not path.exists(TOKEN_FILE):
                logger.info("Token 文件不存在，将使用账号密码登录")
                return None

            with open(TOKEN_FILE, "r", encoding="utf-8") as f:
                token_data = json.load(f)

            logger.info(f"Token 加载成功，保存时间: {token_data.get('saved_at', '未知')}")
            return token_data

        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.warning(f"读取 Token 文件失败: {e}")
            return None


class EnergyMonitor:
    """电量监控器"""

    def __init__(self):
        self.cas_client = CASClient(ACCOUNT, PASSWORD)
        self.get_balance = create_retry_decorator()(self._get_balance)

    def _init_cas_client(self) -> bool:
        """初始化 CAS 客户端"""
        token_data = TokenManager.load()

        # 尝试使用已保存的 token 登录
        if token_data and token_data.get("user_token") and token_data.get("refresh_token"):
            try:
                logger.info("尝试使用已保存的 Token 登录...")
                self.cas_client.set_token(
                    token_data["user_token"],
                    token_data["refresh_token"]
                )
                self.cas_client.login()

                if self.cas_client.logged_in:
                    logger.info("Token 登录成功")
                    return True
                else:
                    logger.warning("Token 已失效，将使用账号密码登录")
            except Exception as e:
                logger.warning(f"Token 登录失败: {e}")

        # 使用账号密码登录
        logger.info("使用账号密码进行 CAS 认证...")
        self.cas_client.login()

        if self.cas_client.logged_in:
            logger.info("CAS 认证成功")
            try:
                TokenManager.save(
                    self.cas_client.user_token,
                    self.cas_client.refresh_token
                )
            except Exception as e:
                logger.error(f"保存 Token 失败: {e}")
            return True
        else:
            logger.error("CAS 认证失败")
            return False

    def _get_balance(self) -> Dict[str, float]:
        """获取电量余额"""
        if not self._init_cas_client():
            raise Exception("CAS 认证失败，无法获取电量信息")

        logger.info("创建一卡通客户端...")
        with ECardClient(self.cas_client) as ecard:
            ecard.login()
            logger.info("一卡通登录成功")

            logger.info("获取电量余额...")
            light_balance = ecard.get_remaining_energy(room=LIGHT_ROOM)
            ac_balance = ecard.get_remaining_energy(room=AC_ROOM)

            logger.info(f"照明: {light_balance} 度, 空调: {ac_balance} 度")

            return {
                "light_Balance": light_balance,
                "ac_Balance": ac_balance
            }
