import os  # 用於檔案與目錄操作
import shutil  # 用於檔案與目錄複製、刪除
import zipfile  # 用於建立 zip 壓縮檔
import subprocess  # 用於執行外部指令（如 docker）


def main():
    print("Creating Lambda deployment package...")  # 建立 Lambda 部署套件

    # Clean up
    # 清理舊的 lambda-package 資料夾與 lambda-deployment.zip 壓縮檔
    if os.path.exists("lambda-package"):
        shutil.rmtree("lambda-package")
    if os.path.exists("lambda-deployment.zip"):
        os.remove("lambda-deployment.zip")

    # Create package directory
    # 建立新的 lambda-package 資料夾，作為部署檔案暫存區
    os.makedirs("lambda-package")

    # Install dependencies using Docker with Lambda runtime image
    # 安裝 Lambda 執行環境相容的相依套件
    print("Installing dependencies for Lambda runtime...")

    # Use the official AWS Lambda Python 3.12 image
    # This ensures compatibility with Lambda's runtime environment
    # 使用 AWS Lambda 官方 Python 3.12 映像檔，確保安裝的套件與 Lambda 執行環境相容
    subprocess.run(
        [
            "docker",
            "run",
            "--rm",  # 執行完自動移除容器
            "-v",
            f"{os.getcwd()}:/var/task",  # 掛載目前目錄到容器 /var/task
            "--platform",
            "linux/amd64",  # Force x86_64 architecture 強制使用 x86_64 架構
            "--entrypoint",
            "",  # Override the default entrypoint 覆蓋預設 entrypoint
            "public.ecr.aws/lambda/python:3.12",  # Lambda 官方 Python 3.12 映像檔
            "/bin/sh",
            "-c",
            # 在容器內執行 pip 安裝，將 requirements.txt 內容安裝到 lambda-package 資料夾
            "pip install --target /var/task/lambda-package -r /var/task/requirements.txt --platform manylinux2014_x86_64 --only-binary=:all: --upgrade",
        ],
        check=True,
    )

    # Copy application files
    print("Copying application files...")  # 複製應用程式檔案到 lambda-package
    for file in ["server.py", "lambda_handler.py", "context.py", "resources.py"]:
        if os.path.exists(file):
            shutil.copy2(file, "lambda-package/")  # 複製檔案（保留原檔案屬性）

    # Copy data directory
    # 複製 data 資料夾（如果存在）到 lambda-package
    if os.path.exists("data"):
        shutil.copytree("data", "lambda-package/data")

    # Create zip
    print("Creating zip file...")  # 建立壓縮檔
    with zipfile.ZipFile("lambda-deployment.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("lambda-package"):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(
                    file_path, "lambda-package")  # 壓縮檔案時移除根目錄
                zipf.write(file_path, arcname)

    # Show package size
    # 顯示壓縮檔大小（MB）
    size_mb = os.path.getsize("lambda-deployment.zip") / (1024 * 1024)
    print(f"✓ Created lambda-deployment.zip ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()  # 直接執行時，開始部署流程
