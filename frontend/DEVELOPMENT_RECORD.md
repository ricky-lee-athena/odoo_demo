# Odoo 業務員查找系統 - 開發記錄

**建立日期**: 2025-12-29
**專案**: Nuxt 4 + Odoo 19 JSON-2 API 整合
**功能**: 業務員搜尋與篩選系統

---

## 專案概述

本專案建立了一個基於 Nuxt 4 的前端應用程式，透過 Odoo 19 的 External JSON-2 API 連接到 CRM 銷售模組，提供業務員資訊的搜尋、篩選和展示功能。

### 核心功能
- ✅ 連接 Odoo 19 JSON-2 External API
- ✅ 查詢 `crm.team.member` 模型獲取業務員資料
- ✅ 按姓名模糊搜尋
- ✅ 按銷售團隊篩選
- ✅ 按啟用狀態篩選
- ✅ 顯示業務員完整資訊（基本資料、團隊、業績、頭像）
- ✅ 響應式設計（RWD）
- ✅ 完善的錯誤處理

---

## 技術架構

### 技術棧
- **前端框架**: Nuxt 4.2.2
- **UI 框架**: Vue 3.5.26
- **語言**: TypeScript
- **API**: Odoo 19 JSON-2 External API
- **認證**: Bearer Token (API Key)

### 架構模式
- **分層架構**: Utils → Composables → Components → Pages
- **型別安全**: 完整的 TypeScript 型別定義
- **可重用性**: 通用的 Odoo API 層可用於其他模組
- **關注點分離**: 清楚劃分資料層、業務邏輯層、展示層

---

## 檔案結構

```
frontend/
├── .env                                    # 環境變數（API Key）
├── .env.example                            # 環境變數範例
├── nuxt.config.ts                          # Nuxt 配置（runtimeConfig）
├── DEVELOPMENT_RECORD.md                   # 本檔案
├── app/
│   ├── app.vue                            # 根元件（啟用路由）
│   ├── types/
│   │   ├── odoo.ts                        # Odoo API 核心型別
│   │   └── salesperson.ts                 # 業務員領域型別
│   ├── utils/
│   │   ├── odooClient.ts                  # HTTP 客戶端（JSON-2 API）
│   │   └── odooDomain.ts                  # Odoo Domain 建構工具
│   ├── composables/
│   │   ├── useOdooApi.ts                  # 通用 Odoo API 介面
│   │   └── useSalespersons.ts             # 業務員資料管理
│   ├── pages/
│   │   └── salespersons/
│   │       └── index.vue                  # 業務員搜尋頁面
│   └── components/
│       └── salesperson/
│           ├── SearchBar.vue              # 搜尋與篩選控制
│           ├── SalespersonList.vue        # 業務員列表容器
│           └── SalespersonCard.vue        # 業務員資訊卡片
```

---

## 核心實作細節

### 1. 環境配置

#### `.env`
```env
NUXT_ODOO_BASE_URL=http://localhost:8069
NUXT_ODOO_API_KEY=<your_api_key_here>
NUXT_ODOO_DATABASE=odoo19
```

#### `nuxt.config.ts`
```typescript
runtimeConfig: {
  public: {
    odooBaseUrl: process.env.NUXT_ODOO_BASE_URL || 'http://localhost:8069',
    odooDatabase: process.env.NUXT_ODOO_DATABASE || '',
    odooApiKey: process.env.NUXT_ODOO_API_KEY || ''
  }
}
```

**設計決策**:
- 原本將 API Key 放在私密區塊（server-side only）
- 後來移至 public 區塊以支援客戶端直接呼叫
- **安全考量**: 生產環境建議使用 Server API Routes 作為代理

---

### 2. 型別系統

#### Odoo API 核心型別 (`types/odoo.ts`)
```typescript
export type OdooDomain = Array<string | number | boolean | (string | number | boolean)[]>

export interface OdooSearchReadRequest {
  domain?: OdooDomain
  fields?: string[]
  limit?: number
  offset?: number
  order?: string
  context?: Record<string, any>
}

export interface OdooApiResponse<T = any> {
  jsonrpc: '2.0'
  id: number | string
  result?: T
  error?: OdooApiError
}
```

#### 業務員領域型別 (`types/salesperson.ts`)
```typescript
export interface Salesperson {
  id: number
  name: string
  user_id: [number, string]
  crm_team_id: [number, string] | false
  email: string | false
  phone: string | false
  mobile: string | false
  active: boolean
  lead_month_count: number
  lead_day_count: number
  assignment_max: number
  assignment_optout: boolean
  image_128: string | false
  image_1920: string | false
}

export interface CrmTeam {
  id: number
  name: string
  user_id: [number, string]
  active: boolean
}
```

**設計重點**:
- Odoo Many2one 欄位以 `[id, name]` 陣列表示
- false 值代表欄位為空
- 清楚區分 API 層型別與領域型別

---

### 3. API 整合層

#### HTTP 客戶端 (`utils/odooClient.ts`)

**核心功能**:
- 處理 JSON-2 API 請求/回應
- Bearer Token 認證
- 完整的錯誤處理
- 自動加入必要的 HTTP 標頭

**請求格式**:
```
POST /json/2/{model}/{method}

Headers:
  - Authorization: bearer {API_KEY}
  - Content-Type: application/json
  - X-Odoo-Database: {database_name}

Body: JSON params
```

**錯誤處理**:
```typescript
class OdooClientError extends Error {
  constructor(message: string, code?: number, odooError?: OdooApiError)
}
```

錯誤碼對應:
- 401: 認證失敗
- 403: 權限不足
- 404: 端點不存在
- 500: 伺服器錯誤

---

#### Domain 建構工具 (`utils/odooDomain.ts`)

**功能**: 建構 Odoo 的 domain 查詢條件

```typescript
buildNameSearchDomain(query: string): OdooDomain
// 範例: [['name', 'ilike', 'john']]

buildTeamFilterDomain(teamId: number | null): OdooDomain
// 範例: [['crm_team_id', '=', 5]]

buildActiveFilterDomain(activeStatus: boolean | null): OdooDomain
// 範例: [['active', '=', true]]

combineDomains(...domains: OdooDomain[]): OdooDomain
// 範例: ['&', ['active', '=', true], ['crm_team_id', '=', 5]]
```

**Odoo Domain 語法**:
- 單一條件: `[['field', 'operator', 'value']]`
- AND 邏輯: `['&', condition1, condition2]`
- OR 邏輯: `['|', condition1, condition2]`

---

### 4. Composables（業務邏輯層）

#### 通用 API Composable (`useOdooApi.ts`)

提供基礎的 Odoo API 操作:
```typescript
searchRead<T>(model, params): Promise<T[]>
read<T>(model, id, fields): Promise<T | null>
search(model, domain, limit, offset): Promise<number[]>
```

#### 業務員 Composable (`useSalespersons.ts`)

**狀態管理**:
```typescript
const salespersons = ref<Salesperson[]>([])
const teams = ref<CrmTeam[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
```

**核心方法**:
```typescript
fetchSalespersons(params: SalespersonSearchParams): Promise<Salesperson[]>
fetchTeams(): Promise<CrmTeam[]>
getAvatarUrl(salesperson: Salesperson): string | null
```

**查詢欄位**:
```javascript
['id', 'name', 'user_id', 'crm_team_id', 'email', 'phone',
 'mobile', 'active', 'lead_month_count', 'lead_day_count',
 'assignment_max', 'assignment_optout', 'image_128', 'image_1920']
```

**錯誤處理策略**:
- 捕捉 `OdooClientError` 並根據錯誤碼提供友善訊息
- 將錯誤訊息儲存在 reactive state 中供 UI 顯示
- 保留原始錯誤在 console 以便除錯

---

### 5. UI 元件層

#### 主頁面 (`pages/salespersons/index.vue`)

**職責**:
- 整合 composables
- 管理篩選狀態
- 協調子元件
- 處理初始資料載入
- 監聽篩選變化並自動重新搜尋

**生命週期**:
```typescript
onMounted(async () => {
  await fetchTeams()        // 載入團隊清單
  await handleSearch()      // 載入初始業務員（預設僅啟用）
})

watch(filters, async () => {
  await handleSearch()      // 篩選變化時自動搜尋
}, { deep: true })
```

---

#### 搜尋列元件 (`SearchBar.vue`)

**功能**:
- 姓名搜尋輸入框（即時搜尋）
- 團隊下拉選單
- 狀態篩選選單

**雙向綁定**:
```vue
v-model:search-query="filters.searchQuery"
v-model:selected-team="filters.selectedTeam"
v-model:active-status="filters.activeStatus"
```

---

#### 業務員卡片元件 (`SalespersonCard.vue`)

**顯示內容**:
1. **頭像**: Base64 圖片或姓名縮寫佔位符
2. **基本資訊**: 姓名、Email（可點擊）、電話
3. **團隊資訊**: 團隊名稱
4. **業績指標**:
   - 本月潛在客戶數
   - 今日潛在客戶數
5. **分配資訊**: 最大分配數
6. **狀態標籤**: Active（綠色）/ Inactive（紅色）

**樣式特點**:
- 卡片 hover 效果
- Inactive 業務員半透明顯示
- Grid 佈局（最小寬度 320px）
- RWD：手機版單欄

**圖片處理**:
```typescript
const avatarUrl = computed(() => {
  const imageData = salesperson.image_128 || salesperson.image_1920
  if (!imageData) return null
  return `data:image/png;base64,${imageData}`
})

const initials = computed(() => {
  const names = salesperson.name.split(' ')
  return names.length >= 2
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0][0].toUpperCase()
})
```

---

## 資料流程

```
User Input (SearchBar)
    ↓
Filter State Change (pages/index.vue)
    ↓
handleSearch() triggered
    ↓
useSalespersons.fetchSalespersons()
    ↓
Build Domain (odooDomain.ts)
    ↓
useOdooApi.searchRead()
    ↓
odooRequest() (odooClient.ts)
    ↓
HTTP POST /json/2/crm.team.member/search_read
    ↓
Odoo 19 Server
    ↓
JSON Response
    ↓
Update salespersons state
    ↓
SalespersonList renders cards
    ↓
UI Update
```

---

## Odoo 模型架構

### crm.team.member (業務員模型)

**關鍵欄位**:
- `user_id`: Many2one → res.users (業務員使用者帳號)
- `crm_team_id`: Many2one → crm.team (所屬銷售團隊)
- `name`: 業務員姓名（related from user_id）
- `email`, `phone`, `mobile`: 聯絡資訊
- `lead_month_count`: 本月分配的潛在客戶數
- `lead_day_count`: 今日分配的潛在客戶數
- `assignment_max`: 最大分配數
- `image_128`, `image_1920`: 頭像圖片（base64）

### crm.team (銷售團隊模型)

**關鍵欄位**:
- `name`: 團隊名稱
- `user_id`: Many2one → res.users (團隊主管)
- `crm_team_member_ids`: One2many → crm.team.member (團隊成員)

---

## 關鍵技術決策

### 1. 為何選擇 JSON-2 API 而非 XML-RPC？

**原因**:
- JSON-2 是 Odoo 19 推薦的 External API
- XML-RPC 已被標記為 deprecated（預計 Odoo 20 移除）
- JSON-2 語法更簡潔、易於使用
- 更好的 TypeScript 支援

### 2. 為何查詢 crm.team.member 而非 res.users？

**原因**:
- `crm.team.member` 包含銷售相關的所有欄位
- 直接提供團隊關聯和業績數據
- 避免需要額外的 join 或多次查詢
- 更精確地代表「業務員」的概念

### 3. 為何使用 Composables 而非 Pinia Store？

**原因**:
- 資料不需要跨多個頁面共享
- Composables 提供足夠的狀態管理能力
- 減少專案複雜度
- 更符合 Nuxt 3/4 的最佳實踐

### 4. API Key 安全性考量

**目前方案**: API Key 放在 `runtimeConfig.public`
- ✅ 優點: 客戶端可直接呼叫 Odoo API
- ❌ 缺點: API Key 會暴露在前端程式碼中

**生產環境建議**: 使用 Nuxt Server Routes
```typescript
// server/api/salespersons.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.odooApiKey  // 只在 server-side 存取

  // 代理請求到 Odoo
  const result = await fetch(...)
  return result
})
```

---

## 測試檢查清單

開發完成後的測試項目：

### 功能測試
- [x] 成功連接到 Odoo 並認證
- [x] 可以獲取業務員列表
- [x] 姓名搜尋功能正常（模糊比對）
- [x] 團隊篩選功能正常
- [x] 狀態篩選功能正常
- [x] 組合篩選功能正常
- [x] 頭像圖片正確顯示
- [x] 業績數據顯示正確
- [x] 錯誤狀態顯示友善訊息
- [x] 載入狀態正常顯示
- [x] 無結果時顯示空狀態

### UI/UX 測試
- [x] 手機版 RWD 正常
- [x] 卡片 hover 效果正常
- [x] Inactive 業務員視覺區分
- [x] Email 連結可點擊
- [x] 無 console 錯誤或警告

### 效能測試
- [ ] 大量資料載入（100+ 業務員）
- [ ] 搜尋輸入防抖（debounce）
- [ ] 圖片載入優化

---

## 已知限制與改進方向

### 目前限制

1. **API Key 安全性**
   - API Key 暴露在客戶端
   - 生產環境需改用 Server Routes

2. **無分頁功能**
   - 目前一次載入最多 100 筆
   - 資料量大時會影響效能

3. **無搜尋防抖**
   - 每次輸入都會觸發 API 請求
   - 可能造成不必要的負載

4. **團隊主管資訊缺失**
   - SalespersonCard 預留了位置但未實作
   - 需要額外查詢或使用 related fields

### 未來優化方向

#### 短期優化
1. **搜尋防抖**: 使用 `useDebounceFn` 或 `watchDebounced`
2. **分頁功能**: 實作 offset/limit 控制
3. **載入動畫**: 加入 skeleton loading
4. **快取機制**: 使用 `useFetch` 或手動實作快取

#### 中期優化
5. **Server API Routes**: 建立代理層保護 API Key
6. **排序功能**: 允許按不同欄位排序
7. **詳細資料頁**: 點擊卡片顯示完整資訊
8. **匯出功能**: 下載 CSV/Excel

#### 長期優化
9. **虛擬滾動**: 處理大量資料集
10. **即時更新**: 使用 Odoo longpolling bus
11. **多語系支援**: i18n 整合
12. **單元測試**: Vitest 測試覆蓋
13. **E2E 測試**: Playwright 自動化測試

---

## 故障排除指南

### 問題: "Odoo API key not configured"

**原因**: API Key 未正確載入

**檢查步驟**:
1. 確認 `.env` 檔案存在且包含 `NUXT_ODOO_API_KEY`
2. 重新啟動開發伺服器
3. 檢查 `nuxt.config.ts` 中 runtimeConfig 設定
4. 確認 API Key 在 `public` 區塊中

---

### 問題: "Authentication failed"

**原因**: API Key 無效或過期

**解決方法**:
1. 登入 Odoo
2. 前往 Settings → Users → API Keys
3. 刪除舊的 API Key
4. 產生新的 API Key
5. 更新 `.env` 檔案

---

### 問題: "Access denied"

**原因**: 使用者權限不足

**解決方法**:
1. 確認 Odoo 使用者有 Sales/CRM 模組的存取權
2. 檢查使用者的 Access Rights
3. 可能需要 Sales Manager 或以上權限

---

### 問題: 沒有顯示任何業務員

**可能原因**:
1. Odoo 中沒有建立 Sales Team Members
2. 所有業務員都是 inactive
3. 篩選條件過於嚴格

**檢查方法**:
1. 在 Odoo 中進入 CRM → Configuration → Sales Teams
2. 確認有團隊成員
3. 嘗試將狀態篩選改為「All Status」

---

### 問題: 圖片無法顯示

**可能原因**:
1. Odoo 中業務員沒有上傳頭像
2. Base64 編碼錯誤

**正常行為**:
- 無頭像時會顯示姓名縮寫的佔位符（綠色圓形）

---

## 效能優化建議

### 1. 搜尋防抖

```typescript
import { useDebounceFn } from '@vueuse/core'

const debouncedSearch = useDebounceFn(async () => {
  await fetchSalespersons(...)
}, 300)

watch(filters, () => {
  debouncedSearch()
}, { deep: true })
```

### 2. 圖片懶載入

```vue
<img
  v-if="avatarUrl"
  :src="avatarUrl"
  loading="lazy"
  :alt="salesperson.name"
>
```

### 3. 使用 useFetch 快取

```typescript
const { data, error, pending } = await useFetch('/api/salespersons', {
  params: searchParams,
  key: 'salespersons-list'
})
```

---

## 相關資源

### 官方文件
- [Odoo 19 External API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)
- [Nuxt 3 Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)

### 模型參考
- Odoo Source: `odoo19/addons/sales_team/models/crm_team_member.py`
- Odoo Source: `odoo19/addons/crm/models/crm_team.py`

---

## 開發時間軸

1. **環境設定** (15 分鐘)
   - 建立環境變數
   - 產生 API Key
   - 更新 nuxt.config.ts

2. **型別定義** (10 分鐘)
   - types/odoo.ts
   - types/salesperson.ts

3. **API 整合層** (30 分鐘)
   - utils/odooClient.ts
   - utils/odooDomain.ts
   - composables/useOdooApi.ts

4. **業務邏輯** (20 分鐘)
   - composables/useSalespersons.ts

5. **UI 元件** (45 分鐘)
   - app.vue
   - pages/salespersons/index.vue
   - SearchBar.vue
   - SalespersonList.vue
   - SalespersonCard.vue

6. **除錯與調整** (20 分鐘)
   - 修正 API Key 存取問題
   - 測試功能

**總計**: 約 2.5 小時

---

## 結論

本專案成功建立了一個完整的 Odoo-Nuxt 整合範例，展示了：
- 如何使用 JSON-2 External API 連接 Odoo
- TypeScript 型別安全的最佳實踐
- Vue 3 Composables 的實用模式
- 清晰的分層架構設計

這個架構可以作為其他 Odoo 模組整合的範本，只需要：
1. 定義新的型別介面
2. 建立對應的 composable
3. 實作 UI 元件

---

**文件版本**: 1.0
**最後更新**: 2025-12-29
**維護者**: Claude AI Assistant
