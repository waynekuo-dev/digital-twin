from pypdf import PdfReader  # 匯入 pypdf 的 PdfReader，用於讀取 PDF 檔案
import json  # 匯入 json 模組，用於處理 JSON 檔案

# Read LinkedIn PDF
try:
    # 嘗試讀取 LinkedIn PDF 檔案，並將所有頁面的文字合併成一個字串
    reader = PdfReader("./data/linkedin.pdf")
    linkedin = ""
    for page in reader.pages:
        text = page.extract_text()  # 從每一頁提取文字
        if text:
            linkedin += text  # 累加所有頁面的文字
except FileNotFoundError:
    # 若找不到檔案，則設為預設訊息
    linkedin = "LinkedIn profile not available"

# Read other data files
# 讀取 summary.txt，取得個人摘要內容
with open("./data/summary.txt", "r", encoding="utf-8") as f:
    summary = f.read()

# 讀取 style.txt，取得個人風格描述
with open("./data/style.txt", "r", encoding="utf-8") as f:
    style = f.read()

# 讀取 facts.json，取得個人事實資料（以 dict 形式儲存）
with open("./data/facts.json", "r", encoding="utf-8") as f:
    facts = json.load(f)
