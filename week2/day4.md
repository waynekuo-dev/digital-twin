# Day 4: Infrastructure as Code with Terraform

## From Manual to Automated Deployment

Welcome to Day 4! Today marks a significant shift in how we deploy our Digital Twin. We're moving from manual AWS Console operations to Infrastructure as Code (IaC) using Terraform. This transformation brings version control, repeatability, and the ability to deploy multiple environments with a single command. By the end of today, you'll be managing dev, test, and production environments like a professional DevOps engineer!

## What You'll Learn Today

- **Terraform fundamentals** - Infrastructure as Code concepts
- **State management** - How Terraform tracks your resources
- **Workspaces** - Managing multiple environments
- **Automated deployment** - One-command infrastructure provisioning
- **Environment isolation** - Separate dev, test, and production
- **Optional: Custom domains** - Professional DNS configuration

## Part 1: Clean Slate - Remove Manual Resources

Before we embrace automation, let's clean up all the resources we created manually in Days 2 and 3. This final console tour will help reinforce what Terraform will manage for us.

### Step 1: Delete Lambda Function

1. Sign in to AWS Console as `aiengineer`
2. Navigate to **Lambda**
3. Select `twin-api` function
4. Click **Actions** → **Delete**
5. Type "delete" to confirm
6. Click **Delete**

### Step 2: Delete API Gateway

1. Navigate to **API Gateway**
2. Click on `twin-api-gateway`
3. Click **Actions** → **Delete**
4. Type the API name to confirm
5. Click **Delete**

### Step 3: Empty and Delete S3 Buckets

**Memory Bucket:**

1. Navigate to **S3**
2. Click on your memory bucket (e.g., `twin-memory-xyz`)
3. Click **Empty**
4. Type "permanently delete" to confirm
5. Click **Empty**
6. After emptying, click **Delete**
7. Type the bucket name to confirm
8. Click **Delete bucket**

**Frontend Bucket:**

1. Click on your frontend bucket (e.g., `twin-frontend-xyz`)
2. Repeat the empty and delete process

### Step 4: Delete CloudFront Distribution

1. Navigate to **CloudFront**
2. Select your distribution
3. Click **Disable** (if it's enabled)
4. Wait for status to change to "Deployed" (5-10 minutes)
5. Once disabled, click **Delete**
6. Click **Delete** to confirm

### Step 5: Verify Clean State

1. Check each service to ensure no twin-related resources remain:
   - Lambda: No `twin-api` functions
   - API Gateway: No `twin-api-gateway` APIs
   - S3: No `twin-` prefixed buckets
   - CloudFront: No distributions for your twin

✅ **Checkpoint**: You now have a clean AWS account, ready for Terraform to manage everything!

## Part 2: Understanding Terraform

### What is Infrastructure as Code?

Infrastructure as Code (IaC) treats your infrastructure configuration as source code. Instead of clicking through console interfaces, you define your infrastructure in text files that can be:

- **Version controlled** - Track changes over time
- **Reviewed** - Use pull requests for infrastructure changes
- **Automated** - Deploy with CI/CD pipelines
- **Repeatable** - Create identical environments

### Key Terraform Concepts

**1. Resources**: The building blocks - each AWS service you want to create

在 Terraform 裡，**Resources（資源）**指的是你要在雲端（如 AWS）建立、管理的具體服務實體，例如 S3 bucket、Lambda 函數、API Gateway、CloudFront 等。每一個 resource 區塊都代表一個實際會被建立的雲端資源。

簡單來說，resources 就是你用程式碼描述、讓 Terraform 幫你自動建立的雲端服務元件，是基礎設施自動化的核心單位。

```hcl
# 宣告一個 AWS S3 bucket 資源，名稱為 example
resource "aws_s3_bucket" "example" {
  # 指定 bucket 的名稱
  bucket = "my-bucket-name"
}
```

**2. State**: Terraform's record of what it has created

- Stored in `terraform.tfstate` file
- Maps your configuration to real resources
- Critical for updates and deletions

State 在 Terraform 中是指「狀態檔」，用來記錄目前已經建立的所有雲端資源的實際狀態（例如 S3 bucket、Lambda 等），通常儲存在 terraform.tfstate 檔案裡。
它的作用是讓 Terraform 能追蹤、比對、更新和刪除資源，確保程式碼和雲端環境一致。

簡單說：state 就是 Terraform 管理雲端資源的「記憶體」和「對照表」。

**3. Providers**: Plugins that interact with cloud providers

在 Terraform 中，**providers（提供者）**是用來連接和管理不同雲端平台或服務的外掛程式。每個 provider 讓 Terraform 能夠建立、修改、刪除該平台上的資源。例如，aws provider 讓你管理 AWS 上的 S3、Lambda、EC2 等服務。

重點整理：<br>
(1)Provider 是 Terraform 與雲端服務的橋樑。<br>
(2)必須在設定檔中指定要用哪個 provider（如 AWS、Azure、GCP）。<br>
(3)可以同時使用多個 provider，甚至同一 provider 的不同區域（用 alias）。<br>
(4)Provider 會根據你的設定（如帳號、區域）來操作資源。

簡單說：provider 就是讓 Terraform 能「聽得懂」並操作各種雲端服務的插件。

```hcl
# 設定 AWS 提供者，讓 Terraform 能管理 AWS 資源
provider "aws" {
  region = "us-east-1"  # 指定 AWS 區域為美東 1
}
```

**4. Variables**: Parameterize your configuration

在 Terraform 中，**variables（變數）**用來參數化你的基礎設施設定。你可以把會變動的值（如專案名稱、環境、區域等）抽出來寫成變數，讓同一份程式碼能重複用在不同情境（dev/test/prod），也方便管理和修改。

重點整理：<br>
(1)變數讓設定檔更彈性、可重複使用。<br>
(2)支援型別、預設值、描述、驗證條件。<br>
(3)可以用 -var、.tfvars 檔案或互動輸入來指定值。<br>

簡單說：variables 就是讓你「不用硬寫死」參數，讓基礎設施程式碼更靈活好維護。

```hcl
# 宣告一個變數，用來指定環境名稱（如 dev, test, prod）
variable "environment" {
  description = "Environment name"  # 變數說明
  type        = string              # 變數型別為字串
}
```

**5. Workspaces**: Separate state for different environments

- Each workspace has its own state file
- Perfect for dev/test/prod separation

在 Terraform 中，**workspaces（工作區）**用來隔離不同環境的狀態檔（state file）。每個 workspace 都有自己獨立的 state，讓你能用同一份程式碼，分別管理 dev、test、prod 等多個環境，互不干擾。

重點整理：<br>
(1)每個 workspace 有自己的 terraform.tfstate 檔案。<br>
(2)適合用來分隔開發、測試、正式等多套資源。<br>
(3)切換 workspace 後，apply/destroy 只影響該環境的資源。

簡單說：workspaces 就是讓你「一套程式碼，多個獨立環境」的關鍵機制。

### Step 1: Install Terraform

As of August 2025, Terraform installation has changed due to licensing updates. We'll use the official distribution.

**Mac (using Homebrew):**

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Mac/Linux (manual):**

1. Visit: https://developer.hashicorp.com/terraform/install
2. Download the appropriate package for your system
3. Extract and move to PATH:

```bash
# Example for Mac (adjust URL for your system)
curl -O https://releases.hashicorp.com/terraform/1.10.0/terraform_1.10.0_darwin_amd64.zip
unzip terraform_1.10.0_darwin_amd64.zip
sudo mv terraform /usr/local/bin/
```

**Windows:**

1. Visit: https://developer.hashicorp.com/terraform/install
2. Download the Windows package
3. Extract the .exe file
4. Add to your PATH:
   - Right-click "This PC" → Properties
   - Advanced system settings → Environment Variables
   - Edit PATH and add the Terraform directory

**Verify Installation:**

```bash
terraform --version
```

You should see something like: `Terraform v1.10.0` (version may vary)

### Step 2: Update .gitignore

Add Terraform-specific entries to your `.gitignore`:

```gitignore
# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl
terraform.tfstate.d/
*.tfvars
!terraform.tfvars
!prod.tfvars

# Lambda packages
lambda-deployment.zip
lambda-package/

# Environment files
.env
.env.*

# Node
node_modules/
out/
.next/

# Python
__pycache__/
*.pyc
.venv/
uv.lock

# IDE
.vscode/
.idea/
*.swp
.DS_Store
```

## Part 3: Create Terraform Configuration

### Step 1: Create Terraform Directory Structure

In Cursor's file explorer (the left sidebar):

1. Right-click in the file explorer in the blank space below all the files
2. Select **New Folder**
3. Name it `terraform`

Your project structure should now have:

```
twin/
├── backend/
├── frontend/
├── memory/
└── terraform/   (new)
```

### Step 2: Create Provider Configuration

Create `terraform/versions.tf`:

versions.tf 這個檔案主要用來設定 Terraform 的版本要求，以及指定要用哪些 provider（例如 AWS），還能限制 provider 的版本範圍。這樣可以確保團隊每個人、CI/CD 或自動化流程都用相同的 Terraform 和 provider 版本，避免因版本不一致導致部署失敗或行為不同。

重點：<br>
(1)required_version：限制 Terraform 主程式的最低版本。<br>
(2)required_providers：指定要用哪些 provider 及其來源、版本範圍。<br>
(3)provider 區塊：設定 provider 的細節（如 AWS 區域、別名等）。

簡單說：versions.tf 是「專案相容性與穩定性」的守門員，確保大家都用對的版本和 provider。

```hcl
terraform {
  required_version = ">= 1.0"  # 指定 Terraform 版本需大於等於 1.0

  required_providers {
    aws = {
      source  = "hashicorp/aws"   # 指定 AWS provider 來源
      version = "~> 6.0"          # 指定 AWS provider 版本，6.x 皆可
    }
  }
}

provider "aws" {
  # Uses AWS CLI configuration (aws configure)
  # 這個 provider 會使用你本機 AWS CLI 設定的帳號與預設區域
  # 適合大多數資源在預設區域（如 ap-northeast-1, us-west-2 等）時使用
}

provider "aws" {
  alias  = "us_east_1"         # 設定一個別名，方便在同一份 Terraform 配置中使用多個區域
  region = "us-east-1"         # 指定這個 provider 的區域為美東 1（us-east-1）
  # 這通常用於 AWS 服務有區域限制時（如 ACM 憑證必須在 us-east-1 申請給 CloudFront 用）
}
```

### Step 3: Define Variables

Create `terraform/variables.tf`:

variables.tf 這個檔案是用來定義所有 Terraform 專案會用到的變數（variables）。它讓你可以把會變動的參數（像專案名稱、環境、模型 ID、逾時秒數等）抽出來集中管理，不用寫死在主程式碼裡。

重點：

(1)宣告每個變數的名稱、型別、說明、預設值、驗證條件。<br>
(2)讓同一份基礎設施程式碼能彈性套用到不同情境（dev/test/prod）。<br>
(3)方便團隊協作、維護和自動化部署。<br>

簡單說：variables.tf 就是「參數集中管理中心」，讓你的 Terraform 專案更彈性、好維護。

```hcl
variable "project_name" {
  description = "Name prefix for all resources"  # 所有 AWS 資源的名稱前綴（如 twin-dev-api）
  type        = string                           # 變數型別為字串
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))  # 檢查 project_name 是否只包含小寫字母、數字和 -
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."  # 不符合時的錯誤訊息
  }
}

variable "environment" {
  description = "Environment name (dev, test, prod)"  # 指定環境名稱（開發、測試、正式）
  type        = string                                # 變數型別為字串
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)  # 必須是 dev、test 或 prod 其中之一
    error_message = "Environment must be one of: dev, test, prod."      # 不符合時的錯誤訊息
  }
}

variable "bedrock_model_id" {
  description = "Bedrock model ID"    # AWS Bedrock 模型 ID（用於 AI 服務）
  type        = string                # 型別為字串
  default     = "amazon.nova-micro-v1:0"  # 預設值為 Nova Micro 模型（最便宜）
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"  # Lambda 執行逾時秒數
  type        = number                                # 型別為數字
  default     = 60                                    # 預設 60 秒
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"  # API Gateway 爆發流量限制（同時最大請求數）
  type        = number                             # 型別為數字
  default     = 10                                 # 預設 10
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"  # API Gateway 平均流量限制（每秒最大請求數）
  type        = number                            # 型別為數字
  default     = 5                                 # 預設 5
}

variable "use_custom_domain" {
  description = "Attach a custom domain to CloudFront"  # 是否啟用自訂網域（true/false）
  type        = bool                                    # 型別為布林值
  default     = false                                   # 預設不啟用
}

variable "root_domain" {
  description = "Apex domain name, e.g. mydomain.com"  # 頂級網域名稱（如 mydomain.com）
  type        = string                                # 型別為字串
  default     = ""                                    # 預設空字串（不使用自訂網域）
}
```

### Step 4: Create Main Infrastructure

Create `terraform/main.tf`:

main.tf 這個檔案是 Terraform 專案的「主基礎設施定義檔」，用來描述要建立哪些雲端資源，以及它們之間的關聯和設定細節。

重點：<br>
(1)宣告所有 AWS 資源（如 S3、Lambda、API Gateway、CloudFront、IAM 等）的建立方式與參數。<br>
(2)使用變數（var.xxx）和本地變數（locals）來統一命名、標籤、環境隔離。<br>
(3)設定資源之間的依賴關係（如 depends_on）。<br>
(4)包含條件式、for_each、count 等進階語法，讓資源建立更彈性。<br>
(5)是「你要 AWS 幫你自動化建立什麼」的完整藍圖。

簡單說：main.tf 就是「雲端基礎設施的施工圖」，Terraform 會根據這份檔案自動建立、管理所有雲端資源。

```hcl
# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}
# 取得目前 AWS 帳號資訊，常用於資源命名，確保 S3 bucket 名稱全域唯一
# 這個 data source 會回傳 account_id、user_id、arn 等資訊，可用於資源唯一性與權限設定

locals {
  # 如果啟用自訂網域且有設定 root_domain，則 CloudFront 會有這些別名
  aliases = var.use_custom_domain && var.root_domain != "" ? [
    var.root_domain,
    "www.${var.root_domain}"
  ] : []
  # 這個 local 變數會根據 use_custom_domain 與 root_domain 決定 CloudFront 是否要綁定自訂網域與 www 子網域

  # 統一命名前綴，方便多環境（dev/test/prod）資源隔離
  name_prefix = "${var.project_name}-${var.environment}"
  # 例如 twin-dev、twin-prod，讓所有資源名稱有一致的前綴，避免不同環境互相干擾

  # 所有資源共用的標籤，方便日後查詢與成本控管
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  # 這些 tags 會自動加到所有 AWS 資源上，方便在 AWS Console 查詢、分帳、審計
}

# S3 bucket for conversation memory
resource "aws_s3_bucket" "memory" {
  # S3 bucket 名稱包含專案、環境與帳號 ID，確保唯一
  bucket = "${local.name_prefix}-memory-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
  # 這個 bucket 用來存放對話記憶資料，名稱設計可避免與他人衝突
}

resource "aws_s3_bucket_public_access_block" "memory" {
  bucket = aws_s3_bucket.memory.id

  block_public_acls       = true   # 阻擋公開 ACL
  block_public_policy     = true   # 阻擋公開政策
  ignore_public_acls      = true   # 忽略公開 ACL
  restrict_public_buckets = true   # 限制公開 bucket
  # 這些設定確保記憶用的 S3 bucket 完全不對外公開
  # 強烈建議所有敏感資料的 bucket 都這樣設
}

resource "aws_s3_bucket_ownership_controls" "memory" {
  bucket = aws_s3_bucket.memory.id

  rule {
    object_ownership = "BucketOwnerEnforced"  # 強制 bucket 擁有者擁有所有物件
    # 防止外部帳號上傳物件後變成物件擁有者，提升安全性
  }
}

# S3 bucket for frontend static website
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
  # 這個 bucket 用來存放前端靜態網站檔案
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false  # 前端網站需公開，這裡允許公開 ACL
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
  # 允許公開，讓 CloudFront 及使用者能直接存取網站內容
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"  # 預設首頁
  }

  error_document {
    key = "404.html"       # 錯誤頁面
  }
  # 設定 S3 靜態網站主頁與錯誤頁
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      },
    ]
  })
  # 允許所有人讀取前端網站的靜態檔案
  # 這是公開網站必備的 policy

  depends_on = [aws_s3_bucket_public_access_block.frontend]
  # 確保 public access block 設定完成後再建立 policy
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  tags = local.common_tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
  # Lambda 角色信任政策，允許 Lambda 服務扮演此角色
  # 這是 Lambda 必備的 assume role policy
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
  # 附加 AWS 預設 Lambda 執行權限（寫 log 等）
  # 讓 Lambda 可以寫 CloudWatch Logs
}

resource "aws_iam_role_policy_attachment" "lambda_bedrock" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
  role       = aws_iam_role.lambda_role.name
  # 附加 Bedrock AI 服務存取權限
  # 讓 Lambda 可以呼叫 Bedrock API
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  role       = aws_iam_role.lambda_role.name
  # 附加 S3 完整存取權限
  # 讓 Lambda 可以存取 S3 bucket
}

# Lambda function
resource "aws_lambda_function" "api" {
  filename         = "${path.module}/../backend/lambda-deployment.zip"  # Lambda 程式碼壓縮檔路徑
  function_name    = "${local.name_prefix}-api"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_handler.handler"  # 進入點
  source_code_hash = filebase64sha256("${path.module}/../backend/lambda-deployment.zip")
  runtime          = "python3.12"
  architectures    = ["x86_64"]
  timeout          = var.lambda_timeout
  tags             = local.common_tags

  environment {
    variables = {
      CORS_ORIGINS     = var.use_custom_domain ? "https://${var.root_domain},https://www.${var.root_domain}" : "https://${aws_cloudfront_distribution.main.domain_name}"
      S3_BUCKET        = aws_s3_bucket.memory.id
      USE_S3           = "true"
      BEDROCK_MODEL_ID = var.bedrock_model_id
    }
    # 設定 Lambda 執行時的環境變數，包含 CORS、S3 bucket 名稱、Bedrock 模型 ID 等
  }

  # Ensure Lambda waits for the distribution to exist
  depends_on = [aws_cloudfront_distribution.main]
  # 確保 CloudFront 建立後才建立 Lambda（避免環境變數引用失敗）
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api-gateway"
  protocol_type = "HTTP"
  tags          = local.common_tags

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods     = ["GET", "POST", "OPTIONS"]
    allow_origins     = ["*"]
    max_age           = 300
    # 設定 CORS，允許所有來源與常見方法
    # 這樣前端網站才能直接呼叫 API
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
  tags        = local.common_tags

  default_route_settings {
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
    # 設定 API Gateway 的流量限制
    # burst_limit 是瞬間最大請求數，rate_limit 是平均每秒
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api.invoke_arn
  # 將 API Gateway 事件直接 proxy 給 Lambda
  # 這是最常見的 serverless API 架構
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "get_root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  # GET / 路由，對應 Lambda
}

resource "aws_apigatewayv2_route" "post_chat" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /chat"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  # POST /chat 路由，對應 Lambda
}

resource "aws_apigatewayv2_route" "get_health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  # GET /health 路由，對應 Lambda
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
  # 允許 API Gateway 呼叫 Lambda
  # 沒有這個 permission，API Gateway 會 500
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  aliases = local.aliases  # 綁定自訂網域（如有）

  viewer_certificate {
    acm_certificate_arn            = var.use_custom_domain ? aws_acm_certificate.site[0].arn : null
    cloudfront_default_certificate = var.use_custom_domain ? false : true
    ssl_support_method             = var.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
    # 設定 SSL 憑證，若有自訂網域則用 ACM，否則用預設
    # CloudFront 綁定自訂網域時必須用 us-east-1 的 ACM 憑證
  }

  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      # 設定來源為 S3 靜態網站
      # 必須用 custom_origin_config，因為 S3 靜態網站 endpoint 只支援 http
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  tags                = local.common_tags

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    # 設定快取行為與允許的方法
    # 只快取 GET/HEAD，其他請求會直送 Lambda
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      # 不限制地區
    }
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
    # 404 時回傳 index.html，支援 SPA 前端路由
  }
}

# Optional: Custom domain configuration (only created when use_custom_domain = true)
data "aws_route53_zone" "root" {
  count        = var.use_custom_domain ? 1 : 0
  name         = var.root_domain
  private_zone = false
  # 查詢 Route53 公有 hosted zone
  # 只在 use_custom_domain 為 true 時建立
}

resource "aws_acm_certificate" "site" {
  count                     = var.use_custom_domain ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = var.root_domain
  subject_alternative_names = ["www.${var.root_domain}"]
  validation_method         = "DNS"
  lifecycle { create_before_destroy = true }
  tags = local.common_tags
  # 申請 ACM 憑證（必須在 us-east-1）
  # 只在 use_custom_domain 為 true 時建立
}

resource "aws_route53_record" "site_validation" {
  for_each = var.use_custom_domain ? {
    for dvo in aws_acm_certificate.site[0].domain_validation_options :
    dvo.domain_name => dvo
  } : {}

  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  ttl     = 300
  records = [each.value.resource_record_value]
  # 建立 DNS 驗證記錄，讓 ACM 憑證自動通過驗證
}

resource "aws_acm_certificate_validation" "site" {
  count           = var.use_custom_domain ? 1 : 0
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [
    for r in aws_route53_record.site_validation : r.fqdn
  ]
  # 等待 DNS 驗證完成
}

resource "aws_route53_record" "alias_root" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = var.root_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
  # 建立 A 記錄，將 root domain 指向 CloudFront
}

resource "aws_route53_record" "alias_root_ipv6" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = var.root_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
  # 建立 AAAA 記錄，支援 IPv6
}

resource "aws_route53_record" "alias_www" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = "www.${var.root_domain}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
  # 建立 www 子網域的 A 記錄
}

resource "aws_route53_record" "alias_www_ipv6" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = "www.${var.root_domain}"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
  # 建立 www 子網域的 AAAA 記錄
}
```

### Step 5: Define Outputs

Create `terraform/outputs.tf`:

outputs.tf 這個檔案的作用是「定義輸出變數」，讓你在部署完基礎設施後，能直接取得重要資源的資訊（如 API Gateway、CloudFront、S3 bucket、Lambda 名稱、自訂網域網址等）。這些輸出值方便前端部署、測試、查詢或自動化腳本使用。

重點整理：<br>
(1) 用 output 區塊宣告要輸出的資源屬性。<br>
(2) description 說明每個輸出的用途。<br>
(3) value 指定實際要輸出的值（通常是某個資源的屬性）。<br>
(4) 輸出結果可用 terraform output 指令查詢，也能被其他自動化流程引用。<br>

簡單說：outputs.tf 就是「把 AWS 關鍵資源資訊自動輸出，方便後續部署和查詢」的地方。

```hcl
output "api_gateway_url" {
  description = "URL of the API Gateway"  # 輸出 API Gateway 的網址，前端/測試可直接呼叫
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "cloudfront_url" {
  description = "URL of the CloudFront distribution"  # 輸出 CloudFront 的網址，前端網站的公開入口
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "s3_frontend_bucket" {
  description = "Name of the S3 bucket for frontend"  # 輸出前端靜態網站 S3 bucket 名稱，部署時會用到
  value       = aws_s3_bucket.frontend.id
}

output "s3_memory_bucket" {
  description = "Name of the S3 bucket for memory storage"  # 輸出對話記憶 S3 bucket 名稱，Lambda 會存取
  value       = aws_s3_bucket.memory.id
}

output "lambda_function_name" {
  description = "Name of the Lambda function"  # 輸出 Lambda 函數名稱，方便查詢或手動測試
  value       = aws_lambda_function.api.function_name
}

output "custom_domain_url" {
  description = "Root URL of the production site"  # 輸出自訂網域的網址（僅 production 且有設定時才有值）
  value       = var.use_custom_domain ? "https://${var.root_domain}" : ""
}
```

### Step 6: Create Default Variable Values

Create `terraform/terraform.tfvars`:

terraform.tfvars 這個檔案是「變數值設定檔」，用來集中填寫所有 variables.tf 定義的變數實際值（如專案名稱、環境、模型 ID、逾時秒數等）。這樣你不用每次 apply 都手動輸入參數，也能輕鬆切換不同環境或設定。

重點整理：<br>
(1) 直接指定每個變數的值，讓部署自動化。<br>
(2) 支援多份 tfvars（如 dev、test、prod），方便多環境切換。<br>
(3) 讓團隊協作、CI/CD、腳本部署都能用同一套參數。<br>

簡單說：terraform.tfvars 就是「把所有參數值集中填好，讓 Terraform 自動帶入」的地方。

```hcl
project_name             = "twin"      # 專案名稱前綴，所有 AWS 資源都會加上這個字首（如 twin-dev-api）
environment              = "dev"       # 環境名稱（dev 開發、test 測試、prod 正式），用於資源隔離
bedrock_model_id         = "amazon.nova-micro-v1:0"  # AWS Bedrock AI 模型 ID，預設使用最便宜的 Nova Micro 模型
lambda_timeout           = 60          # Lambda 函數逾時秒數，單位為秒（預設 60 秒）
api_throttle_burst_limit = 10          # API Gateway 爆發流量限制，瞬間最大同時請求數（預設 10）
api_throttle_rate_limit  = 5           # API Gateway 平均流量限制，每秒最大請求數（預設 5）
use_custom_domain        = false       # 是否啟用自訂網域（CloudFront 綁定自有網域），預設不啟用
root_domain              = ""          # 頂級網域名稱（如 mydomain.com），預設空字串表示不使用自訂網域
```

### Step 7: Update Frontend to Use Environment Variables

Before we create our deployment scripts, we need to update the frontend to use environment variables for the API URL instead of hardcoding it.

Update `frontend/components/twin.tsx` - find the fetch call (around line 43) and replace:

```typescript
// Find this line:
const response = await fetch('http://localhost:8000/chat', {

// Replace with:
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat`, {
```

This change allows the frontend to:

- Use `http://localhost:8000` during local development
- Use the production API URL (set via environment variable) when deployed

**Note**: Next.js requires environment variables accessible in the browser to be prefixed with `NEXT_PUBLIC_`.

## Part 4: Create Deployment Scripts

### Step 1: Create Scripts Directory

In Cursor's file explorer (the left sidebar):

1. Right-click in the File Explorer in the blank space under the files
2. Select **New Folder**
3. Name it `scripts`

### Step 2: Create Shell Script for Mac/Linux

**Important**: All students (including Windows users) need to create this file, as it will be used by GitHub Actions on Day 5.

Create `scripts/deploy.sh`:

deploy.sh 這支腳本是「一鍵自動部署」整個專案到 AWS 的自動化流程。

主要功能如下：<br>
(1)打包 Lambda 程式碼（進入 backend，執行 deploy.py，產生 Lambda zip 檔）。<br>
(2)進入 terraform 資料夾，初始化 Terraform，建立或切換 workspace（dev/test/prod），自動 apply 所有雲端資源（S3、Lambda、API Gateway、CloudFront 等）。<br>
(3)取得部署後的 API Gateway、S3 bucket、CloudFront、自訂網域等網址。<br>
(4)進入 frontend，設定 API URL，安裝 npm 套件、建置前端，並將靜態網站同步到 S3 bucket。<br>
(5)最後顯示所有重要網址，方便測試與存取。

簡單說：deploy.sh 讓你只要執行一次腳本，就能自動完成後端打包、基礎設施部署、前端建置與上傳，省去繁瑣手動操作。

```bash
#!/bin/bash
set -e  # 當腳本遇到錯誤時立即停止執行，避免後續步驟出錯

ENVIRONMENT=${1:-dev}          # dev | test | prod
# 取得第一個參數作為部署環境（預設 dev），可選 dev、test、prod
PROJECT_NAME=${2:-twin}
# 取得第二個參數作為專案名稱（預設 twin），會用於資源命名

echo "🚀 Deploying ${PROJECT_NAME} to ${ENVIRONMENT}..."
# 顯示部署開始訊息

# 1. Build Lambda package
cd "$(dirname "$0")/.."        # project root
# 切換到專案根目錄，確保後續路徑正確
echo "📦 Building Lambda package..."
# 顯示正在打包 Lambda 訊息
(cd backend && uv run deploy.py)
# 進入 backend 資料夾，執行 deploy.py（用 uv 執行），將 Lambda 程式碼與依賴打包成 zip 檔

# 2. Terraform workspace & apply
cd terraform
# 進入 terraform 資料夾，準備進行基礎設施部署
terraform init -input=false
# 初始化 Terraform，下載 provider、建立 .terraform 設定資料夾

if ! terraform workspace list | grep -q "$ENVIRONMENT"; then
  terraform workspace new "$ENVIRONMENT"
  # 若 workspace 尚未存在，則新建一個（如 dev/test/prod）
else
  terraform workspace select "$ENVIRONMENT"
  # 若已存在，則切換到指定 workspace，確保狀態檔分離
fi

# Use prod.tfvars for production environment
if [ "$ENVIRONMENT" = "prod" ]; then
  TF_APPLY_CMD=(terraform apply -var-file=prod.tfvars -var="project_name=$PROJECT_NAME" -var="environment=$ENVIRONMENT" -auto-approve)
  # 若是 prod 環境，使用 prod.tfvars 作為參數檔，並帶入專案名稱與環境變數，自動同意所有變更
else
  TF_APPLY_CMD=(terraform apply -var="project_name=$PROJECT_NAME" -var="environment=$ENVIRONMENT" -auto-approve)
  # 其他環境直接帶入參數，自動同意所有變更
fi

echo "🎯 Applying Terraform..."
# 顯示正在套用 Terraform 訊息
"${TF_APPLY_CMD[@]}"
# 執行 terraform apply，根據上面組合的指令部署所有 AWS 資源

API_URL=$(terraform output -raw api_gateway_url)
# 取得 API Gateway 的網址，供前端或測試用
FRONTEND_BUCKET=$(terraform output -raw s3_frontend_bucket)
# 取得前端 S3 bucket 名稱，供靜態網站部署用
CUSTOM_URL=$(terraform output -raw custom_domain_url 2>/dev/null || true)
# 取得自訂網域網址（若有啟用），失敗時不報錯

# 3. Build + deploy frontend
cd ../frontend
# 切換到 frontend 資料夾，準備建置前端

# Create production environment file with API URL
echo "📝 Setting API URL for production..."
# 顯示正在設定 API URL 訊息
echo "NEXT_PUBLIC_API_URL=$API_URL" > .env.production
# 建立 .env.production 檔案，將 API URL 寫入，讓 Next.js 前端能正確呼叫 API

npm install
# 安裝前端所需 npm 套件
npm run build
# 建置前端專案，產生靜態網站檔案
aws s3 sync ./out "s3://$FRONTEND_BUCKET/" --delete
# 將建置好的靜態網站同步上傳到 S3 bucket，--delete 代表移除 S3 上已刪除的檔案
cd ..
# 回到專案根目錄

# 4. Final messages
echo -e "\n✅ Deployment complete!"
# 顯示部署完成訊息
echo "🌐 CloudFront URL : $(terraform -chdir=terraform output -raw cloudfront_url)"
# 顯示 CloudFront 網址（前端網站入口）
if [ -n "$CUSTOM_URL" ]; then
  echo "🔗 Custom domain  : $CUSTOM_URL"
  # 若有自訂網域，顯示自訂網域網址
fi
echo "📡 API Gateway    : $API_URL"
# 顯示 API Gateway 網址，方便測試或前端設定
```

**For Mac/Linux users only** - make it executable:

```bash
chmod +x scripts/deploy.sh
```

**Windows users**: You don't need to run the chmod command, just create the file.

### Step 3: Create PowerShell Script for Windows

**Mac/Linux users**: You can skip this step - it's only needed for Windows users.

Create `scripts/deploy.ps1`:

deploy.ps1 是 Windows PowerShell 版的「一鍵自動部署」腳本。

主要功能如下：<br>
(1)打包 Lambda 程式碼（切到 backend，執行 deploy.py，產生 Lambda zip 檔）。<br>
(2)進入 terraform 資料夾，初始化 Terraform，建立或切換 workspace（dev/test/prod），自動 apply 所有 AWS 雲端資源。<br>
(3)取得 API Gateway、S3 bucket、自訂網域等部署後的網址。<br>
(4)進入 frontend，設定 API URL，安裝 npm 套件、建置前端，並將靜態網站同步到 S3 bucket。<br>
(5)最後顯示 CloudFront、API Gateway、自訂網域等重要網址，方便測試與存取。

簡單說：deploy.ps1 讓 Windows 使用者只要執行一次腳本，就能自動完成後端打包、基礎設施部署、前端建置與上傳，無需手動操作 AWS Console。

```powershell
param(
    [string]$Environment = "dev",   # dev | test | prod
    # 指定要部署的環境（預設 dev），可選 dev、test、prod
    [string]$ProjectName = "twin"
    # 指定專案名稱（預設 twin），會用於 AWS 資源命名
)
$ErrorActionPreference = "Stop"
# 發生錯誤時立即停止腳本執行，避免後續步驟出錯

Write-Host "Deploying $ProjectName to $Environment ..." -ForegroundColor Green
# 顯示部署開始訊息

# 1. Build Lambda package
Set-Location (Split-Path $PSScriptRoot -Parent)   # project root
# 切換到專案根目錄，確保路徑正確
Write-Host "Building Lambda package..." -ForegroundColor Yellow
# 顯示正在打包 Lambda 訊息
Set-Location backend
# 進入 backend 資料夾
uv run deploy.py
# 執行 deploy.py（用 uv 執行），將 Lambda 程式碼與依賴打包成 zip 檔
Set-Location ..
# 回到專案根目錄

# 2. Terraform workspace & apply
Set-Location terraform
# 進入 terraform 資料夾，準備進行基礎設施部署
terraform init -input=false
# 初始化 Terraform，下載 provider、建立 .terraform 設定資料夾

if (-not (terraform workspace list | Select-String $Environment)) {
    terraform workspace new $Environment
    # 若 workspace 尚未存在，則新建一個（如 dev/test/prod）
} else {
    terraform workspace select $Environment
    # 若已存在，則切換到指定 workspace，確保狀態檔分離
}

if ($Environment -eq "prod") {
    terraform apply -var-file=prod.tfvars -var="project_name=$ProjectName" -var="environment=$Environment" -auto-approve
    # 若是 prod 環境，使用 prod.tfvars 作為參數檔，並帶入專案名稱與環境，自動同意所有變更
} else {
    terraform apply -var="project_name=$ProjectName" -var="environment=$Environment" -auto-approve
    # 其他環境直接帶入參數，自動同意所有變更
}

$ApiUrl        = terraform output -raw api_gateway_url
# 取得 API Gateway 的網址，供前端或測試用
$FrontendBucket = terraform output -raw s3_frontend_bucket
# 取得前端 S3 bucket 名稱，供靜態網站部署用
try { $CustomUrl = terraform output -raw custom_domain_url } catch { $CustomUrl = "" }
# 取得自訂網域網址（若有啟用），失敗時不報錯

# 3. Build + deploy frontend
Set-Location ..\frontend
# 切換到 frontend 資料夾，準備建置前端

# Create production environment file with API URL
Write-Host "Setting API URL for production..." -ForegroundColor Yellow
# 顯示正在設定 API URL 訊息
"NEXT_PUBLIC_API_URL=$ApiUrl" | Out-File .env.production -Encoding utf8
# 建立 .env.production 檔案，將 API URL 寫入，讓 Next.js 前端能正確呼叫 API

npm install
# 安裝前端所需 npm 套件
npm run build
# 建置前端專案，產生靜態網站檔案
aws s3 sync .\out "s3://$FrontendBucket/" --delete
# 將建置好的靜態網站同步上傳到 S3 bucket，--delete 代表移除 S3 上已刪除的檔案
Set-Location ..
# 回到專案根目錄

# 4. Final summary
$CfUrl = terraform -chdir=terraform output -raw cloudfront_url
# 取得 CloudFront 網址（前端網站入口）
Write-Host "Deployment complete!" -ForegroundColor Green
# 顯示部署完成訊息
Write-Host "CloudFront URL : $CfUrl" -ForegroundColor Cyan
# 顯示 CloudFront 網址
if ($CustomUrl) {
    Write-Host "Custom domain  : $CustomUrl" -ForegroundColor Cyan
    # 若有自訂網域，顯示自訂網域網址
}
Write-Host "API Gateway    : $ApiUrl" -ForegroundColor Cyan
# 顯示 API Gateway 網址，方便測試或前端設定

```

## Part 5: Deploy Development Environment

### Step 1: Initialize Terraform

```bash
cd terraform
terraform init
```

terraform init說明：

這會在 terraform 資料夾裡執行，目的是下載所需的 provider（例如 AWS）、建立本地的 .terraform 設定資料夾，並準備好後續的部署操作。
第一次使用或每次換新 provider、搬移專案時都要執行一次。
執行後會看到「Initializing provider plugins...」等訊息，代表 Terraform 已經準備好可以管理你的雲端資源了。
簡單來說，就是「讓 Terraform 準備好，開始管理 AWS 資源的第一步」

You should see:

```
Initializing the backend...
Initializing provider plugins...
- Installing hashicorp/aws v6.x.x...
Terraform has been successfully initialized!
```

### Step 2: Deploy Using the Script

**Mac/Linux from the project root:**

```bash
./scripts/deploy.sh dev
```

**Windows (PowerShell) from the project root:**

```powershell
.\scripts\deploy.ps1 -Environment dev
```

The script will:

1. Build the Lambda package
2. Create a `dev` workspace in Terraform
3. Deploy all infrastructure
4. Build and deploy the frontend
5. Display the URLs

這會啟動 scripts\deploy.ps1 這個 PowerShell 腳本，並指定要部署 dev（開發）環境。

### Step 3: Test Your Development Environment

1. Visit the CloudFront URL shown in the output
2. Test the chat functionality
3. Verify everything works as before

✅ **Checkpoint**: Your dev environment is now deployed via Terraform!

## Part 6: Deploy Test Environment

Now let's deploy a completely separate test environment:

### Step 1: Deploy Test Environment

**Mac/Linux:**

```bash
./scripts/deploy.sh test
```

**Windows (PowerShell):**

```powershell
.\scripts\deploy.ps1 -Environment test
```

### Step 2: Verify Separate Resources

Check the AWS Console - you'll see separate resources for test:

- `twin-test-api` Lambda function
- `twin-test-memory` S3 bucket
- `twin-test-frontend` S3 bucket
- `twin-test-api-gateway` API Gateway
- Separate CloudFront distribution

### Step 3: Test Both Environments

1. Open dev CloudFront URL in one browser tab
2. Open test CloudFront URL in another tab
3. Have different conversations - they're completely isolated!

## Part 7: Destroying Infrastructure

When you're done with an environment, you need to properly clean it up. Since S3 buckets must be empty before deletion, we'll create scripts to handle this automatically.

### Step 1: Create Destroy Script for Mac/Linux

Create `scripts/destroy.sh`:

```bash
#!/bin/bash
set -e

# Check if environment parameter is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Environment parameter is required"
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev"
    echo "Available environments: dev, test, prod"
    exit 1
fi

ENVIRONMENT=$1
PROJECT_NAME=${2:-twin}

echo "🗑️ Preparing to destroy ${PROJECT_NAME}-${ENVIRONMENT} infrastructure..."

# Navigate to terraform directory
cd "$(dirname "$0")/../terraform"

# Check if workspace exists
if ! terraform workspace list | grep -q "$ENVIRONMENT"; then
    echo "❌ Error: Workspace '$ENVIRONMENT' does not exist"
    echo "Available workspaces:"
    terraform workspace list
    exit 1
fi

# Select the workspace
terraform workspace select "$ENVIRONMENT"

echo "📦 Emptying S3 buckets..."

# Get AWS Account ID for bucket names
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get bucket names with account ID
FRONTEND_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-frontend-${AWS_ACCOUNT_ID}"
MEMORY_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-memory-${AWS_ACCOUNT_ID}"

# Empty frontend bucket if it exists
if aws s3 ls "s3://$FRONTEND_BUCKET" 2>/dev/null; then
    echo "  Emptying $FRONTEND_BUCKET..."
    aws s3 rm "s3://$FRONTEND_BUCKET" --recursive
else
    echo "  Frontend bucket not found or already empty"
fi

# Empty memory bucket if it exists
if aws s3 ls "s3://$MEMORY_BUCKET" 2>/dev/null; then
    echo "  Emptying $MEMORY_BUCKET..."
    aws s3 rm "s3://$MEMORY_BUCKET" --recursive
else
    echo "  Memory bucket not found or already empty"
fi

echo "🔥 Running terraform destroy..."

# Run terraform destroy with auto-approve
if [ "$ENVIRONMENT" = "prod" ] && [ -f "prod.tfvars" ]; then
    terraform destroy -var-file=prod.tfvars -var="project_name=$PROJECT_NAME" -var="environment=$ENVIRONMENT" -auto-approve
else
    terraform destroy -var="project_name=$PROJECT_NAME" -var="environment=$ENVIRONMENT" -auto-approve
fi

echo "✅ Infrastructure for ${ENVIRONMENT} has been destroyed!"
echo ""
echo "💡 To remove the workspace completely, run:"
echo "   terraform workspace select default"
echo "   terraform workspace delete $ENVIRONMENT"
```

Make it executable:

```bash
chmod +x scripts/destroy.sh
```

### Step 2: Create Destroy Script for Windows

Create `scripts/destroy.ps1`:

destroy.ps1 是 Windows PowerShell 版的「一鍵自動清除」腳本。

主要功能如下：<br>
(1)切換到指定的 Terraform workspace（dev/test/prod），確保只清除目標環境的資源。<br>
(2)取得 AWS 帳號 ID，組出 S3 bucket 名稱。<br>
(3)自動清空 frontend 和 memory 兩個 S3 bucket（因為 S3 bucket 必須空才能刪除）。<br>
(4)執行 terraform destroy，刪除該環境所有 AWS 資源（Lambda、API Gateway、S3、CloudFront、IAM、Route53、ACM 等）。<br>
(5)最後提示如何完全刪除 workspace。<br>

簡單說：destroy.ps1 讓你只要執行一次腳本，就能自動清空 S3 並移除整個環境的所有 AWS 資源，避免手動操作遺漏或出錯。

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$Environment,           # 指定要清除的環境（必填，dev/test/prod）
    [string]$ProjectName = "twin"   # 專案名稱（預設 twin），用於資源命名
)

# Validate environment parameter
if ($Environment -notmatch '^(dev|test|prod)$') {
    Write-Host "Error: Invalid environment '$Environment'" -ForegroundColor Red
    # 若環境參數不是 dev/test/prod，顯示錯誤訊息
    Write-Host "Available environments: dev, test, prod" -ForegroundColor Yellow
    # 顯示可用環境選項
    exit 1
    # 結束腳本
}

Write-Host "Preparing to destroy $ProjectName-$Environment infrastructure..." -ForegroundColor Yellow
# 顯示準備清除指定環境資源的訊息

# Navigate to terraform directory
Set-Location (Join-Path (Split-Path $PSScriptRoot -Parent) "terraform")
# 切換到 terraform 資料夾，準備執行資源清除

# Check if workspace exists
$workspaces = terraform workspace list
if (-not ($workspaces | Select-String $Environment)) {
    Write-Host "Error: Workspace '$Environment' does not exist" -ForegroundColor Red
    # 若 workspace 不存在，顯示錯誤訊息
    Write-Host "Available workspaces:" -ForegroundColor Yellow
    terraform workspace list
    # 顯示所有可用 workspace
    exit 1
    # 結束腳本
}

# Select the workspace
terraform workspace select $Environment
# 切換到指定的 workspace，確保只清除目標環境的資源

Write-Host "Emptying S3 buckets..." -ForegroundColor Yellow
# 顯示正在清空 S3 bucket 的訊息

# Get AWS Account ID for bucket names
$awsAccountId = aws sts get-caller-identity --query Account --output text
# 取得 AWS 帳號 ID，組出 S3 bucket 的完整名稱（避免名稱衝突）

# Define bucket names with account ID
$FrontendBucket = "$ProjectName-$Environment-frontend-$awsAccountId"
# 前端 S3 bucket 名稱（依專案、環境、帳號組成）
$MemoryBucket = "$ProjectName-$Environment-memory-$awsAccountId"
# 記憶 S3 bucket 名稱（依專案、環境、帳號組成）

# Empty frontend bucket if it exists
try {
    aws s3 ls "s3://$FrontendBucket" 2>$null | Out-Null
    # 檢查 frontend bucket 是否存在
    Write-Host "  Emptying $FrontendBucket..." -ForegroundColor Gray
    # 顯示正在清空 frontend bucket
    aws s3 rm "s3://$FrontendBucket" --recursive
    # 遞迴刪除 bucket 內所有檔案（S3 bucket 必須空才能刪除）
} catch {
    Write-Host "  Frontend bucket not found or already empty" -ForegroundColor Gray
    # 若 bucket 不存在或已空，顯示提示訊息
}

# Empty memory bucket if it exists
try {
    aws s3 ls "s3://$MemoryBucket" 2>$null | Out-Null
    # 檢查 memory bucket 是否存在
    Write-Host "  Emptying $MemoryBucket..." -ForegroundColor Gray
    # 顯示正在清空 memory bucket
    aws s3 rm "s3://$MemoryBucket" --recursive
    # 遞迴刪除 bucket 內所有檔案
} catch {
    Write-Host "  Memory bucket not found or already empty" -ForegroundColor Gray
    # 若 bucket 不存在或已空，顯示提示訊息
}

Write-Host "Running terraform destroy..." -ForegroundColor Yellow
# 顯示正在執行 terraform destroy 的訊息

# Run terraform destroy with auto-approve
if ($Environment -eq "prod" -and (Test-Path "prod.tfvars")) {
    terraform destroy -var-file=prod.tfvars -var="project_name=$ProjectName" -var="environment=$Environment" -auto-approve
    # 若是 prod 環境且有 prod.tfvars，使用 prod.tfvars 作為參數檔，自動同意所有變更
} else {
    terraform destroy -var="project_name=$ProjectName" -var="environment=$Environment" -auto-approve
    # 其他環境直接帶入參數，自動同意所有變更
}

Write-Host "Infrastructure for $Environment has been destroyed!" -ForegroundColor Green
# 顯示指定環境資源已清除完成

Write-Host ""
Write-Host "  To remove the workspace completely, run:" -ForegroundColor Cyan
# 顯示如何完全刪除 workspace 的提示
Write-Host "   terraform workspace select default" -ForegroundColor White
# 切回 default workspace
Write-Host "   terraform workspace delete $Environment" -ForegroundColor White
# 刪除指定 workspace（完全移除狀態檔）
```

### Step 3: Using the Destroy Scripts

To destroy a specific environment:

**Mac/Linux:**

```bash
# Destroy dev environment
./scripts/destroy.sh dev

# Destroy test environment
./scripts/destroy.sh test

# Destroy prod environment
./scripts/destroy.sh prod
```

**Windows (PowerShell):**

```powershell
# Destroy dev environment
.\scripts\destroy.ps1 -Environment dev

# Destroy test environment
.\scripts\destroy.ps1 -Environment test

# Destroy prod environment
.\scripts\destroy.ps1 -Environment prod
```

### What Gets Destroyed

The destroy scripts will:

1. Empty S3 buckets (frontend and memory)
2. Delete all AWS resources created by Terraform:
   - Lambda functions
   - API Gateway
   - S3 buckets
   - CloudFront distributions
   - IAM roles and policies
   - Route 53 records (if custom domain)
   - ACM certificates (if custom domain)

### Important Notes

- **CloudFront**: Distributions can take 5-15 minutes to fully delete
- **Workspaces**: The scripts destroy resources but keep the workspace. To fully remove a workspace:
  ```bash
  terraform workspace select default
  terraform workspace delete dev  # or test, prod
  ```
- **Cost Savings**: Always destroy unused environments to avoid charges

## Part 8: OPTIONAL - Add a Custom Domain

If you want a professional domain for your production twin, follow these steps.

### Step 1: Register a Domain (if needed)

**Important**: Domain registration requires billing permissions, so you'll need to sign in as the **root user** for this step.

**Option A: Register through AWS Route 53**

1. Sign out of your IAM user account
2. Sign in to AWS Console as the **root user**
3. Go to Route 53 in AWS Console
4. Click **Registered domains** → **Register domain**
5. Search for your desired domain
6. Add to cart and complete purchase (typically $12-40/year depending on domain)
7. Wait for registration (5-30 minutes)
8. Once registered, sign back in as your IAM user (`aiengineer`) to continue

**Option B: Use existing domain**

- If you already own a domain elsewhere:
  - Transfer DNS to Route 53, or
  - Create a hosted zone and update nameservers at your registrar

### Step 2: Create Hosted Zone (if not auto-created)

If Route 53 didn't auto-create a hosted zone:

1. Go to Route 53 → **Hosted zones**
2. Click **Create hosted zone**
3. Enter your domain name
4. Type: Public hosted zone
5. Click **Create**

### Step 3: Create Production Configuration

Create `terraform/prod.tfvars`:

```hcl
project_name             = "twin"
environment              = "prod"
bedrock_model_id         = "amazon.nova-lite-v1:0"  # Use better model for production
lambda_timeout           = 60
api_throttle_burst_limit = 20
api_throttle_rate_limit  = 10
use_custom_domain        = true
root_domain              = "yourdomain.com"  # Replace with your actual domain
```

### Step 4: Deploy Production with Domain

**Mac/Linux:**

```bash
./scripts/deploy.sh prod
```

**Windows (PowerShell):**

```powershell
.\scripts\deploy.ps1 -Environment prod
```

The deployment will:

1. Create SSL certificate in ACM (在 AWS ACM 申請 SSL 憑證（讓網站支援 HTTPS）)
2. Validate domain ownership via DNS (透過 DNS 驗證你的網域擁有權（自動建立驗證記錄）)
3. Configure CloudFront with your domain (設定 CloudFront 讓它綁定你的自訂網域並使用 SSL)
4. Set up Route 53 records 在 Route 53 (建立網域相關的 DNS 記錄（A/AAAA），讓你的網域能正確指向 CloudFront)

**Note**: Certificate validation can take 5-30 minutes. The script will wait.

### Step 5: Test Your Custom Domain

Once deployed:

1. Visit `https://yourdomain.com`
2. Visit `https://www.yourdomain.com`
3. Both should show your Digital Twin!

## Understanding Terraform Workspaces

### How Workspaces Isolate Environments

Each workspace maintains its own state file:

```
terraform.tfstate.d/
├── dev/
│   └── terraform.tfstate
├── test/
│   └── terraform.tfstate
└── prod/
    └── terraform.tfstate
```

### Managing Workspaces

**List workspaces:**

```bash
terraform workspace list
```

**Switch workspace:**

```bash
terraform workspace select dev
```

**Show current workspace:**

```bash
terraform workspace show
```

### Resource Naming

Resources are named with environment prefix:

- Dev: `twin-dev-api`, `twin-dev-memory`
- Test: `twin-test-api`, `twin-test-memory`
- Prod: `twin-prod-api`, `twin-prod-memory`

## Cost Optimization

### Environment-Specific Settings

Our configuration uses different settings per environment:

**Development:**

- Nova Micro model (cheapest)
- Lower API throttling
- No custom domain

**Test:**

- Nova Micro model
- Standard throttling
- No custom domain

**Production:**

- Nova Lite model (better quality)
- Higher throttling limits
- Custom domain with SSL

### Cost-Saving Tips

1. **Destroy unused environments** - Don't leave test running
2. **Use appropriate models** - Nova Micro for dev/test
3. **Set API throttling** - Prevent runaway costs
4. **Monitor with tags** - All resources tagged with environment

## Troubleshooting

### Terraform State Issues

If Terraform gets confused about resources:

```bash
# Refresh state from AWS
terraform refresh

# If resource exists in AWS but not state
terraform import aws_lambda_function.api twin-dev-api
```

### Deployment Script Failures

**"Lambda package not found"**

- Ensure Docker is running
- Run `cd backend && uv run deploy.py` manually

**"S3 bucket already exists"**

- Bucket names must be globally unique
- Change project_name in terraform.tfvars

**"Certificate validation timeout"**

- Check Route 53 has the validation records
- Wait longer (can take up to 30 minutes)

### Frontend Not Updating

After deployment, CloudFront may cache old content:

```bash
# Get distribution ID
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='twin-dev'].Id" --output text

# Create invalidation
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Best Practices

### 1. Version Control

Always commit your Terraform files:

```bash
git add terraform/*.tf terraform/*.tfvars
git commit -m "Add Terraform infrastructure"
```

Never commit:

- `terraform.tfstate` files
- `.terraform/` directory
- AWS credentials

### 2. Plan Before Apply

Review changes before applying:

```bash
terraform plan
```

### 3. Use Variables

Don't hardcode values - use variables:

```hcl
# Good
bucket = "${local.name_prefix}-memory"

# Bad
bucket = "twin-dev-memory"
```

### 4. Tag Everything

Our configuration tags all resources:

```hcl
tags = {
  Project     = var.project_name
  Environment = var.environment
  ManagedBy   = "terraform"
}
```

## What You've Accomplished Today!

- ✅ Learned Infrastructure as Code with Terraform
- ✅ Automated entire AWS deployment
- ✅ Created multiple isolated environments
- ✅ Implemented one-command deployment
- ✅ Set up professional deployment scripts
- ✅ Optional: Configured custom domain with SSL

## Architecture Summary

Your Terraform manages:

```
Terraform Configuration
    ├── S3 Buckets (Frontend + Memory)
    ├── Lambda Function with IAM Role
    ├── API Gateway with Routes
    ├── CloudFront Distribution
    └── Optional: Route 53 + ACM Certificate

Managed via Workspaces:
    ├── dev/   (Development environment)
    ├── test/  (Testing environment)
    └── prod/  (Production with custom domain)
```

## Next Steps

Tomorrow (Day 5), we'll add CI/CD with GitHub Actions:

- Automated testing on pull requests
- Deployment pipelines for each environment
- Infrastructure change reviews
- Automated rollbacks
- Complete infrastructure teardown

Your Digital Twin now has professional Infrastructure as Code that any team can deploy and manage!

## Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

Congratulations on automating your infrastructure deployment! 🚀
