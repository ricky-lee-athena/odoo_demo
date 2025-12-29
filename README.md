# Odoo 19 安裝說明

本專案使用 Python 虛擬環境 (venv) 安裝 Odoo 19，搭配 Docker PostgreSQL 資料庫。

## 系統需求

- Python 3.11.9
- PostgreSQL (Docker)
- Git

## 目錄結構

```
F:\dev\odoo\
├── odoo-venv/          # Python 虛擬環境
├── odoo19/             # Odoo 19 原始碼
├── odoo19.conf         # Odoo 配置檔案
├── odoo19.log          # 執行日誌
├── start_odoo.bat      # Windows 啟動腳本
└── README.md           # 本說明文件
```

## 安裝步驟

### 1. 建立 Python 虛擬環境

```bash
python3 -m venv odoo-venv
```

### 2. 下載 Odoo 19

```bash
git clone https://github.com/odoo/odoo.git --depth 1 --branch 19.0 --single-branch odoo19
```

### 3. 安裝 Python 依賴套件

```bash
odoo-venv/Scripts/python.exe -m pip install --upgrade pip
odoo-venv/Scripts/python.exe -m pip install -r odoo19/requirements.txt
```

### 4. 啟動 PostgreSQL (Docker)

```bash
wsl sudo docker start postgres
```

確認容器執行狀態：
```bash
wsl sudo docker ps
```

### 5. 建立 Odoo 資料庫使用者

```bash
odoo-venv/Scripts/python.exe -c "import psycopg2; conn = psycopg2.connect(host='localhost', port=5432, user='postgres', password='sql', dbname='postgres'); conn.autocommit = True; cur = conn.cursor(); cur.execute(\"CREATE USER odoo WITH PASSWORD 'odoo' CREATEDB;\"); cur.close(); conn.close()"
```

### 6. 初始化 Odoo 資料庫

```bash
odoo-venv/Scripts/python.exe odoo19/odoo-bin --db_host=localhost --db_port=5432 --db_user=odoo --db_password=odoo --db-filter=^odoo19$ --init=base --stop-after-init -d odoo19
```

## 啟動 Odoo

### 方法 1：使用啟動腳本（推薦）

Windows 環境下，直接執行：
```bash
start_odoo.bat
```

### 方法 2：手動啟動

```bash
# 1. 啟動虛擬環境
odoo-venv\Scripts\activate

# 2. 執行 Odoo
python odoo19\odoo-bin -c odoo19.conf -d odoo19
```

### 方法 3：完整命令

```bash
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo19.conf -d odoo19
```

### 開發模式啟動

```bash
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo19.conf -d odoo19 --dev=all
```

## 訪問 Odoo

啟動成功後，在瀏覽器開啟：

```
http://localhost:8069
```

### 預設管理員帳號

- **Email**: `admin`
- **Password**: `admin` （首次登入時會要求設定新密碼）

## 資料庫配置

### PostgreSQL 設定

| 設定項目 | 值 |
|---------|-----|
| 主機 | localhost |
| 連接埠 | 5432 |
| 使用者 | odoo |
| 密碼 | odoo |
| 資料庫 | odoo19 |

### Docker 容器資訊

```
容器名稱: postgres
映像檔: postgres
連接埠: 0.0.0.0:5432->5432/tcp
```

## 常用操作

### 啟動 PostgreSQL

```bash
wsl sudo docker start postgres
```

### 停止 PostgreSQL

```bash
wsl sudo docker stop postgres
```

### 停止 Odoo

在執行 Odoo 的終端機按 `Ctrl+C`

### 查看日誌

```bash
tail -f odoo19.log
```

或直接開啟 `odoo19.log` 檔案

### 重建資料庫

```bash
# 1. 刪除現有資料庫（透過 Odoo 介面或 SQL）
# 2. 重新初始化
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo19.conf --init=base --stop-after-init -d odoo19
```

### 更新模組

```bash
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo19.conf -d odoo19 -u module_name
```

### 安裝新模組

```bash
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo19.conf -d odoo19 -i module_name
```

## 配置檔案說明

`odoo19.conf` 主要設定：

```ini
[options]
; 資料庫設定
db_host = localhost
db_port = 5432
db_user = odoo
db_password = odoo

; 伺服器設定
http_port = 8069
http_interface = 0.0.0.0

; 路徑設定
addons_path = F:\dev\odoo\odoo19\addons

; 日誌設定
log_level = info
logfile = F:\dev\odoo\odoo19.log

; 效能設定
workers = 0
max_cron_threads = 1
```

## 常見問題

### Q1: 無法連接到資料庫

確認 PostgreSQL Docker 容器是否正在運行：
```bash
wsl sudo docker ps | grep postgres
```

### Q2: 密碼認證失敗

檢查配置檔案中的資料庫密碼是否正確，或重新建立 odoo 使用者。

### Q3: 模組載入錯誤

確認 `addons_path` 設定正確，並重啟 Odoo。

### Q4: 連接埠被佔用

修改 `odoo19.conf` 中的 `http_port` 為其他埠號（如 8070）。

### Q5: 效能問題

在正式環境中，調整 `workers` 參數（建議為 CPU 核心數 × 2 + 1）。

## 下一步

### 基本設定

1. **安裝模組**: Settings → Apps → 搜尋並安裝所需模組
2. **建立使用者**: Settings → Users & Companies → Users
3. **配置公司資訊**: Settings → General Settings → Companies

### 開發設定

1. **啟用開發者模式**: Settings → Activate the developer mode
2. **建立自訂模組**: 在 `addons` 目錄下建立新模組
3. **啟用除錯**: 使用 `--dev=all` 參數啟動

### 學習資源

- [Odoo 官方文件](https://www.odoo.com/documentation/19.0/)
- [Odoo 開發者文件](https://www.odoo.com/documentation/19.0/developer.html)
- [Odoo GitHub](https://github.com/odoo/odoo)

## 版本資訊

- **Odoo 版本**: 19.0
- **Python 版本**: 3.11.9
- **PostgreSQL 版本**: Latest (Docker)

## 授權

Odoo 遵循 LGPL-3.0 授權條款。

## 技術支援

如有問題，請參考 [Odoo 官方論壇](https://www.odoo.com/forum) 或 [GitHub Issues](https://github.com/odoo/odoo/issues)。

---

最後更新: 2025-12-27
