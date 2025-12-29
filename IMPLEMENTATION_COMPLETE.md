# ✅ Google OAuth 整合實作完成

**完成日期**: 2025-12-29

---

## 📋 實作摘要

### ✅ 已完成的工作

#### 1. Odoo 後端 (7 個檔案)

**自訂模組**: `auth_oauth_api_bridge`

- ✅ `__init__.py` - 模組初始化
- ✅ `__manifest__.py` - 模組配置
- ✅ `models/__init__.py` - 模型初始化
- ✅ `models/res_users.py` - **核心**: API Key 程式化產生邏輯
- ✅ `controllers/__init__.py` - 控制器初始化
- ✅ `controllers/main.py` - **核心**: OAuth 回調處理和 Cookie 設定
- ✅ `security/ir.model.access.csv` - 權限設定

**關鍵功能**:
- `_generate_api_key_for_oauth()` - 為 OAuth 登入的使用者自動產生 API Key
- `revoke_oauth_api_keys()` - 登出時撤銷 API Keys
- `/auth_oauth/api_signin` - 自訂 OAuth 回調端點

#### 2. 前端檔案 (10 個檔案)

**認證相關**:
- ✅ `app/types/auth.ts` - 型別定義
- ✅ `app/composables/useAuth.ts` - **核心**: 認證邏輯 (login, checkAuth, logout)
- ✅ `app/middleware/auth.ts` - 認證中介層

**頁面和版型**:
- ✅ `app/pages/login.vue` - 登入頁面（Google 登入按鈕）
- ✅ `app/pages/oauth-callback.vue` - **核心**: OAuth 回調處理頁面
- ✅ `app/layouts/default.vue` - 預設版型（含使用者資訊和登出）

**Server API**:
- ✅ `server/api/auth/session.get.ts` - 檢查登入狀態
- ✅ `server/api/auth/logout.post.ts` - 登出處理
- ✅ `server/api/odoo.post.ts` - **已修改**: 從 cookie 讀取 API Key

**設定檔**:
- ✅ `nuxt.config.ts` - **已修改**: 新增 Google OAuth Provider ID 設定
- ✅ `app/pages/salespersons/index.vue` - **已修改**: 加入認證保護

---

## 🔍 修改驗證

### 檔案 1: `server/api/odoo.post.ts`

**修改內容**:
```typescript
// ✅ 第 15-16 行：從 cookie 讀取 API key
// 從 cookie 讀取 API key (優先)，fallback 到環境變數(向後相容)
const apiKey = getCookie(event, 'odoo_api_key') || config.odooApiKey

// ✅ 第 21-23 行：錯誤代碼改為 401
throw createError({
  statusCode: 401,  // 原本是 500
  statusMessage: 'Not authenticated. Please login.'
})

// ✅ 第 49-56 行：新增 401 錯誤處理
if (error.statusCode === 401 || error.status === 401) {
  throw createError({
    statusCode: 401,
    statusMessage: 'API key expired or invalid. Please login again.'
  })
}
```

### 檔案 2: `nuxt.config.ts`

**修改內容**:
```typescript
// ✅ 第 14 行：新增 Google OAuth Provider ID
public: {
  odooBaseUrl: process.env.NUXT_ODOO_BASE_URL || 'http://localhost:8069',
  odooDatabase: process.env.NUXT_ODOO_DATABASE || '',
  googleOAuthProviderId: process.env.NUXT_GOOGLE_OAUTH_PROVIDER_ID || '3'  // 新增
}
```

### 檔案 3: `app/pages/salespersons/index.vue`

**修改內容**:
```typescript
// ✅ 第 45 行：新增認證 middleware
definePageMeta({
  title: 'Salespersons',
  middleware: ['auth']  // 新增
})
```

---

## 🚀 後續步驟

### 階段一：安裝 Odoo 模組

```bash
cd F:/dev/odoo
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo.conf -u auth_oauth_api_bridge -d odoo19
```

**預期結果**:
- 模組安裝成功
- 沒有錯誤訊息
- Odoo 正常啟動

---

### 階段二：設定 Google Cloud Console

#### 1. 建立專案（如果沒有）
前往: https://console.cloud.google.com/

#### 2. 啟用 Google+ API
- APIs & Services → Library
- 搜尋 "Google+ API"
- 點擊 Enable

#### 3. 建立 OAuth 2.0 Client ID
- APIs & Services → Credentials
- Create Credentials → OAuth 2.0 Client ID
- Application type: **Web application**
- Name: `Odoo Frontend OAuth`
- Authorized redirect URIs:
  ```
  http://localhost:8069/auth_oauth/api_signin
  ```
  (生產環境使用 `https://your-domain.com/auth_oauth/api_signin`)

#### 4. 取得憑證
複製以下資訊：
- ✅ Client ID (類似: `xxxxx.apps.googleusercontent.com`)
- ✅ Client Secret

---

### 階段三：設定 Odoo

#### 1. 啟用 OAuth Authentication

1. 登入 Odoo (`http://localhost:8069`)
2. 進入 **Settings** → **Integrations**
3. 找到 **OAuth Authentication**
4. 點擊 **Enable** (如果尚未啟用)
5. **Save**

#### 2. 設定 Google OAuth Provider

1. 在 Settings 頁面，找到 **Google Authentication**
2. 點擊 **Enable**
3. 在 **Client ID** 欄位輸入從 Google Console 複製的 Client ID
4. **Save**

#### 3. 設定 Client Secret (透過 System Parameters)

1. 進入 **Settings** → **Technical** → **Parameters** → **System Parameters**
2. 找到或建立參數：
   - Key: `auth_oauth.google_client_secret`
   - Value: `YOUR_GOOGLE_CLIENT_SECRET`
3. **Save**

---

### 階段四：設定前端環境變數

編輯 `frontend/.env`:

```bash
NUXT_ODOO_BASE_URL=http://localhost:8069
NUXT_ODOO_DATABASE=odoo19
NUXT_GOOGLE_OAUTH_PROVIDER_ID=3

# Optional: Fallback API key for development
# NUXT_ODOO_API_KEY=your_manual_api_key
```

---

### 階段五：測試

#### 1. 啟動 Odoo (如果尚未執行)

```bash
cd F:/dev/odoo
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo.conf
```

#### 2. 啟動前端

```bash
cd F:/dev/odoo/frontend
npm run dev
```

#### 3. 測試登入流程

1. **開啟瀏覽器**: `http://localhost:3000`
2. **預期行為**: 自動重導向到 `/login`
3. **點擊**: "使用 Google 登入" 按鈕
4. **預期行為**: 重導向到 Google 登入頁面
5. **登入 Google**: 使用您的 Google 帳號
6. **預期行為**:
   - 重導向回 Odoo (`/auth_oauth/api_signin`)
   - Odoo 產生 API Key 並設定 cookie
   - 重導向到 `/oauth-callback`
   - 最後導向 `/salespersons`

#### 4. 驗證認證狀態

**在瀏覽器 DevTools**:
- Application → Cookies → `http://localhost:3000`
- 應該看到 `odoo_api_key` (值為 HTTP-only，無法在此看到完整內容)

**在 `/salespersons` 頁面**:
- 右上角應顯示使用者名稱和頭像
- 可以正常使用搜尋和篩選功能
- 業務員列表正常顯示

#### 5. 測試登出

1. 點擊右上角的 "登出" 按鈕
2. 確認對話框
3. **預期行為**:
   - 重導向到 `/login`
   - Cookie `odoo_api_key` 被清除
   - 嘗試訪問 `/salespersons` 會重導向到 `/login`

---

## 🐛 故障排除

### 問題 1: "Module auth_oauth_api_bridge not found"

**原因**: 模組路徑不正確

**解決方案**:
```bash
# 確認模組存在
ls F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/

# 確認包含 __manifest__.py
ls F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/__manifest__.py
```

### 問題 2: "redirect_uri_mismatch" 錯誤

**原因**: Google Console 的 redirect URI 與實際不符

**解決方案**:
1. 檢查 Google Console 中的 redirect URI 是否完全一致:
   ```
   http://localhost:8069/auth_oauth/api_signin
   ```
2. 注意不要有尾隨斜線
3. 確認 protocol (http vs https)

### 問題 3: "Provider not found" 或 "Invalid provider"

**原因**: Google OAuth Provider ID 不正確

**解決方案**:
1. 在 Odoo 中檢查 provider ID:
   - Settings → Technical → Authentication → OAuth Providers
   - 找到 "Google OAuth2"
   - 記下 ID (通常是 3)
2. 更新 `frontend/.env`:
   ```bash
   NUXT_GOOGLE_OAUTH_PROVIDER_ID=3  # 使用正確的 ID
   ```

### 問題 4: Cookie 未設定

**原因**:
- Odoo 回調失敗
- 網域不匹配

**解決方案**:
1. 檢查 Odoo logs:
   ```bash
   # 以 debug 模式啟動 Odoo
   odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo.conf --log-level=debug
   ```
2. 查看 "OAuth API signin successful" 訊息
3. 確認前端和 Odoo 在同一網域或正確設定 CORS

### 問題 5: "Not authenticated" 錯誤

**原因**:
- Cookie 未正確讀取
- API Key 無效

**解決方案**:
1. 檢查瀏覽器 Console 是否有錯誤
2. 檢查 Network tab 中的 `/api/odoo` 請求
3. 確認 Cookie header 是否包含在請求中
4. 嘗試清除 cookies 後重新登入

---

## 🔒 生產環境檢查清單

部署到生產環境前，請確認：

- [ ] 使用 HTTPS (不要使用 HTTP)
- [ ] 修改 `controllers/main.py` 第 114 行:
  ```python
  secure=True,  # 原本是 False
  ```
- [ ] Google Console redirect URI 使用 HTTPS:
  ```
  https://your-domain.com/auth_oauth/api_signin
  ```
- [ ] 更新 `frontend/.env`:
  ```bash
  NUXT_ODOO_BASE_URL=https://your-odoo-domain.com
  ```
- [ ] 設定適當的 API Key 過期時間
- [ ] 啟用 CORS (如果前端和 Odoo 在不同網域)
- [ ] 設定防火牆規則
- [ ] 定期輪換 Google Client Secret
- [ ] 監控 API Key 使用情況

---

## 📊 架構概覽

```
使用者瀏覽器
    │
    ├─> 1. GET http://localhost:3000/
    │      └─> 偵測未登入 → 重導向 /login
    │
    ├─> 2. 點擊「使用 Google 登入」
    │      └─> loginWithGoogle()
    │          └─> window.location.href = 'http://localhost:8069/auth_oauth/signin?state={...}'
    │
    ├─> 3. Google OAuth 頁面
    │      └─> 使用者登入 Google
    │          └─> Google redirect: http://localhost:8069/auth_oauth/api_signin#access_token=...
    │
    ├─> 4. Odoo OAuth Callback
    │      auth_oauth_api_bridge/controllers/main.py
    │      ├─> 驗證 access_token
    │      ├─> 建立/配對 Odoo 使用者
    │      ├─> 呼叫 _generate_api_key_for_oauth()
    │      ├─> 設定 HTTP-only cookie: odoo_api_key
    │      └─> 重導向: http://localhost:3000/oauth-callback
    │
    ├─> 5. Frontend OAuth Callback
    │      app/pages/oauth-callback.vue
    │      ├─> 呼叫 checkAuth()
    │      │   └─> GET /api/auth/session (讀取 cookie)
    │      └─> 重導向: /salespersons
    │
    └─> 6. Salespersons Page
           app/pages/salespersons/index.vue
           ├─> Middleware: auth ✓
           ├─> API 呼叫: POST /api/odoo
           │   └─> server/api/odoo.post.ts
           │       ├─> 讀取 cookie: odoo_api_key
           │       ├─> 轉發到 Odoo: /json/2/crm.team.member/search_read
           │       └─> Authorization: bearer {API_KEY}
           └─> 顯示業務員列表 ✓
```

---

## 📚 重要檔案參考

### 最關鍵的 5 個檔案

1. **`odoo19/addons/auth_oauth_api_bridge/models/res_users.py`**
   - 核心邏輯：API Key 程式化產生
   - 方法：`_generate_api_key_for_oauth()`, `revoke_oauth_api_keys()`

2. **`odoo19/addons/auth_oauth_api_bridge/controllers/main.py`**
   - OAuth 回調處理
   - Cookie 設定
   - 路由：`/auth_oauth/api_signin`

3. **`frontend/app/composables/useAuth.ts`**
   - 前端認證邏輯
   - 方法：`loginWithGoogle()`, `checkAuth()`, `logout()`

4. **`frontend/server/api/odoo.post.ts`**
   - API 代理
   - Cookie 讀取
   - Odoo API 轉發

5. **`frontend/app/pages/oauth-callback.vue`**
   - OAuth 流程完成處理
   - 錯誤處理
   - 重導向邏輯

---

## 🎯 功能特性

### ✅ 已實現

- [x] Google OAuth 登入整合
- [x] 自動 API Key 產生
- [x] HTTP-only Cookie 儲存 (防 XSS)
- [x] 登入狀態管理
- [x] 認證 Middleware
- [x] 登出功能（含 API Key 撤銷）
- [x] 使用者資訊顯示
- [x] 頭像顯示
- [x] 錯誤處理
- [x] 現有業務員查詢功能相容
- [x] 向後相容（fallback 到環境變數 API Key）

### 🔜 後續優化 (選項)

- [ ] API Key 自動更新機制
- [ ] 記住登入狀態 (Remember me)
- [ ] 多因素認證 (MFA) 整合
- [ ] OAuth 登入紀錄和審計
- [ ] API Key 使用率儀表板
- [ ] 更細緻的權限控制
- [ ] 登入失敗重試機制
- [ ] Session timeout 設定

---

## 📞 支援資源

- **完整設定指南**: `F:/dev/odoo/GOOGLE_OAUTH_SETUP_GUIDE.md`
- **本文件**: `F:/dev/odoo/IMPLEMENTATION_COMPLETE.md`
- **Odoo 官方文件**: https://www.odoo.com/documentation/19.0/applications/general/users/google.html
- **Odoo External API**: https://www.odoo.com/documentation/19.0/developer/reference/external_api.html

---

**實作完成日期**: 2025-12-29
**實作者**: Claude AI Assistant
**版本**: 1.0
**狀態**: ✅ 就緒待測試
