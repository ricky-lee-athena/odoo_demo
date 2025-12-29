# Google OAuth 整合設定指南

## 已完成的檔案

### ✅ Odoo 後端 (已建立)
- `F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/__init__.py`
- `F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/__manifest__.py`
- `F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/models/__init__.py`
- `F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/models/res_users.py` ⭐
- `F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/controllers/__init__.py`
- `F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/controllers/main.py` ⭐
- `F:/dev/odoo/odoo19/addons/auth_oauth_api_bridge/security/ir.model.access.csv`

### ✅ 前端檔案 (已建立)
- `F:/dev/odoo/frontend/app/types/auth.ts`
- `F:/dev/odoo/frontend/app/composables/useAuth.ts` ⭐
- `F:/dev/odoo/frontend/app/middleware/auth.ts`
- `F:/dev/odoo/frontend/app/pages/login.vue`
- `F:/dev/odoo/frontend/app/pages/oauth-callback.vue` ⭐
- `F:/dev/odoo/frontend/app/layouts/default.vue`
- `F:/dev/odoo/frontend/server/api/auth/session.get.ts`
- `F:/dev/odoo/frontend/server/api/auth/logout.post.ts`

---

## 🔧 需要手動修改的檔案 (共 3 個)

### 1. `frontend/server/api/odoo.post.ts`

**修改位置：第 15 行**

```typescript
// 原本
const apiKey = config.odooApiKey

// 修改為
// 從 cookie 讀取 API key (優先)，fallback 到環境變數(向後相容)
const apiKey = getCookie(event, 'odoo_api_key') || config.odooApiKey
```

**修改位置：第 19-24 行**

```typescript
// 原本
if (!apiKey) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Odoo API key not configured on server'
  })
}

// 修改為
if (!apiKey) {
  throw createError({
    statusCode: 401,
    statusMessage: 'Not authenticated. Please login.'
  })
}
```

**修改位置：第 49-57 行 (在 catch 區塊內)**

```typescript
// 原本
catch (error: any) {
  console.error('Odoo API Error:', error)

  throw createError({
    statusCode: error.statusCode || 500,
    statusMessage: error.message || 'Failed to connect to Odoo',
    data: error.data
  })
}

// 修改為
catch (error: any) {
  console.error('Odoo API Error:', error)

  // 處理 401 specifically to prompt re-login
  if (error.statusCode === 401 || error.status === 401) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API key expired or invalid. Please login again.'
    })
  }

  throw createError({
    statusCode: error.statusCode || 500,
    statusMessage: error.message || 'Failed to connect to Odoo',
    data: error.data
  })
}
```

---

### 2. `frontend/nuxt.config.ts`

**修改位置：第 12-15 行**

```typescript
// 原本
public: {
  odooBaseUrl: process.env.NUXT_ODOO_BASE_URL || 'http://localhost:8069',
  odooDatabase: process.env.NUXT_ODOO_DATABASE || ''
}

// 修改為
public: {
  odooBaseUrl: process.env.NUXT_ODOO_BASE_URL || 'http://localhost:8069',
  odooDatabase: process.env.NUXT_ODOO_DATABASE || '',
  googleOAuthProviderId: process.env.NUXT_GOOGLE_OAUTH_PROVIDER_ID || '3'
}
```

---

### 3. `frontend/app/pages/salespersons/index.vue`

**修改位置：第 43-46 行**

```typescript
// 原本
definePageMeta({
  title: 'Salespersons'
})

// 修改為
definePageMeta({
  title: 'Salespersons',
  middleware: ['auth']  // Require authentication
})
```

---

## 📝 環境變數設定

### `frontend/.env`

```bash
NUXT_ODOO_BASE_URL=http://localhost:8069
NUXT_ODOO_DATABASE=odoo19
NUXT_GOOGLE_OAUTH_PROVIDER_ID=3

# Optional: Fallback API key for development
NUXT_ODOO_API_KEY=your_manual_api_key_for_dev
```

---

## 🚀 安裝步驟

### 階段一：Odoo 後端設定

#### 1. 安裝自訂模組

```bash
cd F:/dev/odoo
# 重啟 Odoo 並更新模組
odoo-venv/Scripts/python.exe odoo19/odoo-bin -c odoo.conf -u auth_oauth_api_bridge -d odoo19
```

或透過 UI：
1. 進入 Odoo → Apps
2. 點擊 "Update Apps List"
3. 搜尋 "OAuth API Bridge"
4. 點擊 Install

#### 2. 設定 Google OAuth Provider

1. 進入 Odoo → Settings → Integrations
2. 啟用 "OAuth Authentication"
3. 啟用 "Google Authentication"
4. 設定 Google Client ID (稍後從 Google Console 取得)

---

### 階段二：Google Cloud Console 設定

#### 1. 建立 OAuth 2.0 Client ID

1. 前往 https://console.cloud.google.com/apis/credentials
2. 建立專案 (如果還沒有)
3. 建立 OAuth 2.0 Client ID
   - **Application type**: Web application
   - **Name**: Odoo Frontend OAuth
   - **Authorized redirect URIs**:
     - `http://localhost:8069/auth_oauth/api_signin` (開發環境)
     - `https://your-domain.com/auth_oauth/api_signin` (生產環境)

4. 複製 Client ID 和 Client Secret

#### 2. 在 Odoo 設定 Client ID

1. Odoo → Settings → Integrations → Google Authentication
2. 輸入 Google Client ID
3. Save

---
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
### 階段三：前端設定

#### 1. 更新環境變數

編輯 `frontend/.env`:

```bash
NUXT_ODOO_BASE_URL=http://localhost:8069
NUXT_ODOO_DATABASE=odoo19
NUXT_GOOGLE_OAUTH_PROVIDER_ID=3
```

#### 2. 安裝依賴 (如果需要)

```bash
cd frontend
npm install
```

#### 3. 重啟前端

```bash
npm run dev
```

---

## ✅ 測試步驟

### 1. 測試登入流程

1. 瀏覽器開啟 `http://localhost:3000`
2. 應該自動重導向到 `/login`
3. 點擊 "使用 Google 登入"
4. 應該重導向到 Google 登入頁面
5. 登入後應回到 `/oauth-callback`
6. 然後自動導向 `/salespersons`

### 2. 檢查 Cookie

在瀏覽器 DevTools → Application → Cookies 中，應該看到：
- `odoo_api_key` (HTTP-only)

### 3. 測試 API 呼叫

在 `/salespersons` 頁面：
- 應該能正常顯示業務員列表
- 使用現有的搜尋和篩選功能

### 4. 測試登出

1. 點擊右上角的登出按鈕
2. 應該重導向到 `/login`
3. Cookie 應該被清除

---

## 🐛 故障排除

### 問題 1: "Not authenticated" 錯誤

**原因**: Cookie 未正確設定

**解決方案**:
1. 檢查 Odoo OAuth callback 是否成功
2. 查看 Odoo logs: `python odoo-bin -c odoo.conf --log-level=debug`
3. 確認瀏覽器允許 cookies

### 問題 2: OAuth redirect URL 不匹配

**原因**: Google Console 的 redirect URI 與實際不符

**解決方案**:
1. 確保 Google Console 中的 redirect URI 為: `http://localhost:8069/auth_oauth/api_signin`
2. 檢查 Odoo 的 base URL 設定

### 問題 3: "Provider not found" 錯誤

**原因**: Google OAuth Provider 未啟用或 ID 不正確

**解決方案**:
1. 進入 Odoo → Settings → OAuth Providers
2. 確認 Google OAuth2 provider 存在且啟用
3. 記下 provider ID（通常是 3）
4. 更新 `NUXT_GOOGLE_OAUTH_PROVIDER_ID` 環境變數

### 問題 4: API Key 未產生

**原因**: 自訂模組未正確安裝

**解決方案**:
1. 確認模組在 `odoo19/addons/auth_oauth_api_bridge/` 路徑下
2. 重新安裝模組: `python odoo-bin -u auth_oauth_api_bridge -d odoo19`
3. 檢查 Odoo logs 中的錯誤訊息

---

## 🔒 安全性檢查清單

- [ ] Cookie 設定為 HTTP-only ✓ (已設定)
- [ ] 生產環境使用 HTTPS
- [ ] 生產環境 cookie secure flag 設為 True (需修改 `controllers/main.py:114`)
- [ ] SameSite 屬性設定為 Lax ✓ (已設定)
- [ ] Google OAuth redirect URI 使用 HTTPS (生產環境)
- [ ] API Key 過期時間設定合理 (預設 30 天)

---

## 📊 架構流程圖

```
┌─────────────┐
│   使用者    │
└──────┬──────┘
       │
       │ 1. 訪問 /
       ▼
┌─────────────────┐
│  Frontend       │
│  未登入偵測     │
└──────┬──────────┘
       │
       │ 2. 重導向 /login
       ▼
┌─────────────────┐
│  Login Page     │
│  Google 按鈕    │
└──────┬──────────┘
       │
       │ 3. 點擊登入
       ▼
┌─────────────────┐
│  Google OAuth   │
│  認證頁面       │
└──────┬──────────┘
       │
       │ 4. 認證成功
       ▼
┌─────────────────┐
│  Odoo Callback  │
│  /auth_oauth/   │
│  api_signin     │
└──────┬──────────┘
       │
       │ 5. 驗證 token
       │ 6. 建立/配對使用者
       │ 7. 產生 API Key
       │ 8. 設定 cookie
       ▼
┌─────────────────┐
│  Frontend       │
│  /oauth-        │
│  callback       │
└──────┬──────────┘
       │
       │ 9. 驗證登入
       ▼
┌─────────────────┐
│  Salespersons   │
│  Page           │
│  (已登入)       │
└─────────────────┘
```

---

## 📚 重要檔案說明

### Odoo 核心檔案

**`models/res_users.py`**
- `_generate_api_key_for_oauth()`: 程式化產生 API Key
- `revoke_oauth_api_keys()`: 登出時撤銷 API Key

**`controllers/main.py`**
- `/auth_oauth/api_signin`: OAuth 回調端點
- 驗證 token、產生 API Key、設定 cookie

### 前端核心檔案

**`composables/useAuth.ts`**
- `loginWithGoogle()`: 觸發 OAuth 流程
- `checkAuth()`: 檢查登入狀態
- `logout()`: 登出並清除 cookie

**`server/api/odoo.post.ts`**
- API proxy，從 cookie 讀取 API Key
- 轉發請求到 Odoo JSON-2 API

**`server/api/auth/session.get.ts`**
- 驗證 cookie 中的 API Key
- 回傳使用者資訊

---

## 🎯 下一步

完成設定後，您可以：

1. **測試完整流程**：從登入到查詢業務員
2. **自訂樣式**：修改登入頁面和 layout 的 UI
3. **調整 API Key 過期時間**：在 `controllers/main.py:85` 修改
4. **設定生產環境**：
   - 使用 HTTPS
   - 設定 secure cookie flag
   - 設定正確的 Google OAuth redirect URI
   - 使用環境變數管理敏感資訊

---

## 📞 支援

如果遇到問題：
1. 查看 Odoo logs: `python odoo-bin -c odoo.conf --log-level=debug`
2. 查看瀏覽器 Console 和 Network tab
3. 檢查本文件的故障排除章節
4. 確認所有 3 個手動修改的檔案都已正確修改

---

**最後更新**: 2025-12-29
**版本**: 1.0
