"""
AES-256-GCM 加密模块

用于安全存储 tokens.json 文件
"""
import os
import sys
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

from config import TOKEN_FILE, TOKEN_ENC_FILE, PASSWORD

# 固定盐值（用于密钥派生）
SALT = b"ZZU-Electricity-Monitor-Salt-v1"
ITERATIONS = 100000


def derive_key(password: str) -> bytes:
    """
    使用 PBKDF2 从密码派生 256 位密钥

    Args:
        password: 用户密码

    Returns:
        32 字节的密钥
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=ITERATIONS,
    )
    return kdf.derive(password.encode("utf-8"))


def encrypt_file(input_path: str, output_path: str, password: str) -> bool:
    """
    使用 AES-256-GCM 加密文件

    Args:
        input_path: 输入文件路径
        output_path: 输出文件路径
        password: 加密密码

    Returns:
        是否成功
    """
    try:
        # 派生密钥
        key = derive_key(password)

        # 生成随机 nonce（12 字节）
        nonce = os.urandom(12)

        # 创建 AESGCM 实例
        aesgcm = AESGCM(key)

        # 读取明文
        with open(input_path, "rb") as f:
            plaintext = f.read()

        # 加密
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)

        # 将 nonce + ciphertext 进行 base64 编码后保存
        encrypted_data = base64.b64encode(nonce + ciphertext)

        with open(output_path, "wb") as f:
            f.write(encrypted_data)

        print(f"✅ 加密成功: {input_path} -> {output_path}")
        return True

    except Exception as e:
        print(f"❌ 加密失败: {e}")
        return False


def decrypt_file(input_path: str, output_path: str, password: str) -> bool:
    """
    使用 AES-256-GCM 解密文件

    Args:
        input_path: 加密文件路径
        output_path: 输出文件路径
        password: 解密密码

    Returns:
        是否成功
    """
    try:
        # 读取加密数据
        with open(input_path, "rb") as f:
            encrypted_data = f.read()

        # Base64 解码
        data = base64.b64decode(encrypted_data)

        # 分离 nonce 和 ciphertext
        nonce = data[:12]
        ciphertext = data[12:]

        # 派生密钥
        key = derive_key(password)

        # 创建 AESGCM 实例并解密
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)

        # 保存明文
        with open(output_path, "wb") as f:
            f.write(plaintext)

        print(f"✅ 解密成功: {input_path} -> {output_path}")
        return True

    except Exception as e:
        print(f"❌ 解密失败: {e}")
        return False


def main():
    """命令行入口"""
    if len(sys.argv) < 2:
        print("用法: python crypto.py [encrypt|decrypt]")
        sys.exit(1)

    command = sys.argv[1].lower()

    if not PASSWORD:
        print("❌ 未设置 PASSWORD 环境变量")
        sys.exit(1)

    if command == "encrypt":
        if not os.path.exists(TOKEN_FILE):
            print(f"⚠️ 文件不存在: {TOKEN_FILE}")
            sys.exit(0)
        success = encrypt_file(TOKEN_FILE, TOKEN_ENC_FILE, PASSWORD)
        sys.exit(0 if success else 1)

    elif command == "decrypt":
        if not os.path.exists(TOKEN_ENC_FILE):
            print(f"⚠️ 文件不存在: {TOKEN_ENC_FILE}")
            sys.exit(0)
        success = decrypt_file(TOKEN_ENC_FILE, TOKEN_FILE, PASSWORD)
        sys.exit(0 if success else 1)

    else:
        print(f"❌ 未知命令: {command}")
        print("用法: python crypto.py [encrypt|decrypt]")
        sys.exit(1)


if __name__ == "__main__":
    main()
