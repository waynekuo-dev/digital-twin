from mangum import Mangum  # 匯入 Mangum，將 ASGI 應用轉換為 AWS Lambda 可用的 handler
from server import app  # 匯入 FastAPI 應用主體

# Create the Lambda handler
handler = Mangum(app)  # 建立 Lambda handler，讓 FastAPI 應用可在 AWS Lambda 上執行
