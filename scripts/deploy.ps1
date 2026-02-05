param(
    [string]$Environment = "dev",   # dev | test | prod
    [string]$ProjectName = "twin"
)
$ErrorActionPreference = "Stop"

Write-Host "Deploying $ProjectName to $Environment ..." -ForegroundColor Green

# 1. Build Lambda package
Set-Location (Split-Path $PSScriptRoot -Parent)   # project root
Write-Host "Building Lambda package..." -ForegroundColor Yellow
Set-Location backend
uv run deploy.py  # 執行 deploy.py，將 Lambda 需要的程式碼與相依套件打包成 zip 檔（lambda-deployment.zip），供 AWS Lambda 上傳使用
Set-Location ..   # 回到專案根目錄

# 2. Terraform workspace & apply
Set-Location terraform  # 進入 terraform 資料夾，準備進行基礎設施部署
terraform init -input=false  # 初始化 Terraform，下載 provider 並建立本地設定

# 檢查 workspace 是否存在，若不存在則建立，否則切換到指定 workspace
if (-not (terraform workspace list | Select-String $Environment)) {
    terraform workspace new $Environment  # 建立新的 workspace（dev/test/prod），用於多環境隔離
} else {
    terraform workspace select $Environment  # 切換到指定的 workspace
}

# 根據環境選擇變數檔案並自動部署
if ($Environment -eq "prod") {
    terraform apply -var-file=prod.tfvars -var="project_name=$ProjectName" -var="environment=$Environment" -auto-approve
    # 正式環境會用 prod.tfvars，並自動帶入專案名稱與環境變數，-auto-approve 代表自動同意所有變更
} else {
    terraform apply -var="project_name=$ProjectName" -var="environment=$Environment" -auto-approve
    # dev/test 環境直接用預設變數
}

# 取得部署後的各項資源資訊
$ApiUrl        = terraform output -raw api_gateway_url         # 取得 API Gateway 的網址
$FrontendBucket = terraform output -raw s3_frontend_bucket     # 取得前端 S3 bucket 名稱
try { $CustomUrl = terraform output -raw custom_domain_url } catch { $CustomUrl = "" }  # 取得自訂網域（如有）

# 3. Build + deploy frontend
Set-Location ..\frontend  # 進入 frontend 資料夾，準備建置與部署前端網站

# Create production environment file with API URL
Write-Host "Setting API URL for production..." -ForegroundColor Yellow
"NEXT_PUBLIC_API_URL=$ApiUrl" | Out-File .env.production -Encoding utf8
# 產生 .env.production 檔案，讓 Next.js 前端在建置時能取得正確的 API Gateway 網址

npm install  # 安裝前端相依套件
npm run build  # 建置前端靜態網站（產生 out 資料夾）
aws s3 sync .\out "s3://$FrontendBucket/" --delete  # 將建置好的靜態網站同步上傳到 S3 bucket，--delete 代表移除 S3 上多餘的檔案
Set-Location ..  # 回到專案根目錄

# 4. Final summary
$CfUrl = terraform -chdir=terraform output -raw cloudfront_url  # 取得 CloudFront 的網址
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "CloudFront URL : $CfUrl" -ForegroundColor Cyan  # 顯示 CloudFront 網址（前端網站入口）
if ($CustomUrl) {
    Write-Host "Custom domain  : $CustomUrl" -ForegroundColor Cyan  # 顯示自訂網域（如有）
}
Write-Host "API Gateway    : $ApiUrl" -ForegroundColor Cyan  # 顯示 API Gateway 網址