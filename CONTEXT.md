# QuanLyKienNghi – Project Context

## Mô tả
Phần mềm quản lý Kiến nghị (khiếm khuyết thiết bị) hàng tuần cho Chuyên viên Kiệt (TTĐ).
- **Người dùng duy nhất của app**: Kiệt — nhập liệu, điều phối, xuất báo cáo
- Kiệt phối hợp với P.KTAT và P.KHVT qua file Excel trên OneDrive (họ không dùng app trực tiếp)
- Kết quả trình Tổ Trưởng Hoàng mỗi tuần dưới dạng báo cáo Excel

## Stack
- Frontend   : React Vite + TailwindCSS v4 (`@tailwindcss/vite`)
- Backend    : FastAPI (Python 3.9)
- Database   : JSON file (`backend/data.json`)
- Xuất Excel : openpyxl
- Đọc Word   : python-docx
- Fuzzy match: difflib (stdlib Python — không cần cài thêm)
- Dev        : máy Kiệt – localhost (frontend :5173, backend :8000)
- Production : server cơ quan – truy cập qua LAN (`http://192.168.x.x:8000`)

## Cách chạy dev

```bash
# Terminal 1 — Backend
cd D:\TaskApp_kiet\QuanLyKienNghi\backend
..\venv\Scripts\uvicorn main:app --reload

# Terminal 2 — Frontend
cd D:\TaskApp_kiet\QuanLyKienNghi\frontend
npm run dev
```

Mở trình duyệt: http://localhost:5173  
API docs (Swagger): http://localhost:8000/docs  
Khởi động nhanh: chạy `dev.bat` ở thư mục gốc

## Cấu trúc thư mục

```
D:\TaskApp_kiet\QuanLyKienNghi\
├── venv\                           ← Python venv riêng (KHÔNG dùng chung với TaskApp PyQt5)
├── backend\
│   ├── main.py                     ← FastAPI app (CRUD + import/xuất Excel + Word + thống kê)
│   ├── data.json                   ← Database JSON
│   └── requirements.txt            ← fastapi, uvicorn, openpyxl, python-multipart, python-docx
├── frontend\
│   ├── src\
│   │   ├── main.jsx
│   │   ├── App.jsx                 ← Layout, Router, header buttons
│   │   ├── index.css               ← Tailwind + utility classes (input, label, btn-*)
│   │   ├── constants.js            ← Nhãn trạng thái, màu badge, danh sách đơn vị
│   │   ├── api.js                  ← Fetch wrapper cho toàn bộ API
│   │   ├── components\
│   │   │   ├── TrangThaiBadge.jsx  ← Badge màu hiển thị trạng thái
│   │   │   ├── KienNghiForm.jsx    ← Modal thêm / sửa kiến nghị
│   │   │   └── ThongKeDashboard.jsx← Dashboard dạng cây phân cấp
│   │   └── pages\
│   │       ├── ChuaHoanThanh.jsx   ← Bảng + Thêm / Sửa / Xóa / Hoàn thành
│   │       └── DaHoanThanh.jsx     ← Bảng + Khôi phục
│   └── package.json
├── dev.bat                         ← Khởi động nhanh cả 2 server
├── CONTEXT.md
└── README.md
```

---

## Vòng lặp tuần hoàn của Kiệt

```
┌──────────────────────────────────────────────────────────────┐
│                       VÒNG LẶP TUẦN                         │
│                                                              │
│  [1] Import Word (đầu tuần)                                 │
│      Kiệt upload file Word từ các đơn vị                    │
│      App đọc bảng → fuzzy match nội dung → update DB        │
│      Kiệt xác nhận preview trước khi lưu                    │
│                        ↓                                     │
│  [2] Xuất bảng chia việc                                    │
│      App xuất 1 Excel (cột A–K) toàn bộ KN chưa HT         │
│      Kiệt upload lên OneDrive                               │
│      P.KTAT điền cột F–H, P.KHVT điền cột I–K              │
│                        ↓                                     │
│  [3] Import bảng chia việc đã điền                          │
│      Kiệt download Excel từ OneDrive → import vào App       │
│      App cập nhật kết quả KTAT/KHVT vào DB                  │
│      Kiệt duyệt từng KN → Hoàn thành / Chưa hoàn thành     │
│      KN chưa HT → chọn trạng thái chi tiết                  │
│                        ↓                                     │
│  [4] Xuất báo cáo cho Hoàng                                 │
│      Excel 2 sheet: Chưa HT + Đã HT → trình Tổ Trưởng      │
└──────────────────────────────────────────────────────────────┘
```

---

## Trạng thái kiến nghị

### Vòng đời

```
Tạo mới (import Word hoặc nhập tay)
    ↓ trang_thai: phong_ktat_len_phieu
    │
    ├── KTAT xử lý xong, không cần VT
    │       ↓ trang_thai: da_sua_chua_theo_doi → hoan_thanh
    │
    └── KTAT có PYC → chuyển KHVT
            ↓ trang_thai: ktat_co_pyc
            │
            ├── KHVT chưa cấp → cho_vat_tu (+ thoi_han_vt)
            └── KHVT đã cấp  → da_cap_vat_tu → hoan_thanh
```

### Bảng trạng thái

| Code | Hiển thị | Giai đoạn |
|------|----------|-----------|
| `phong_ktat_len_phieu` | Phòng KTAT đang lên phiếu | KTAT đang xử lý |
| `da_sua_chua_theo_doi` | Đã sửa chữa, đang theo dõi | KTAT theo dõi sau sửa |
| `ktat_co_pyc` | KTAT đã có PYC | Chờ KHVT tiếp nhận |
| `cho_vat_tu` | Đợi cấp vật tư | KHVT đang xử lý |
| `da_cap_vat_tu` | Đã cấp vật tư | Chờ Kiệt xác nhận kết thúc |

Trạng thái `cho_vat_tu` có sub-field `thoi_han_vt`:
- `duoi_1_thang` — < 1 tháng
- `2_3_thang`    — 2–3 tháng
- `3_6_thang`    — 3–6 tháng
- `tren_6_thang` — > 6 tháng
- `chua_co_han`  — Chưa có hạn

---

## Tab Thống kê (`/thong-ke`)

Tab riêng, là trang mặc định khi mở app (`/` redirect → `/thong-ke`).

Bảng báo cáo dạng tài liệu chính thức (theo format Word Kiệt đang dùng):

| STT | Nội dung | Số lượng |
|-----|----------|----------|
| | **Tổng cộng kiến nghị đầu tuần** | N |
| 1 | **Số KN hoàn thành trong tuần** | M |
| 2 | **Số KN chưa hoàn thành, bao gồm:** | N–M |
| 2.1 | Phòng KTAT đang lên phiếu yêu cầu | … |
| 2.2 | KTAT đã có PYC, chờ KHVT tiếp nhận | … |
| 2.3 | Đã sửa chữa, hiện đang theo dõi thông số | … |
| 2.4 | Đã cấp vật tư | … |
| 2.5 | Đợi cấp vật tư *(nested cards 5 mức thời hạn)* | … |

Row 2.5 hiển thị nested cards màu bên trong ô bảng:
`< 1 tháng 🟢` `2–3 tháng 🟡` `3–6 tháng 🟠` `> 6 tháng 🔴` `Chưa có hạn ⚪`

**File:** `frontend/src/pages/ThongKePage.jsx`

---

## Format Excel "Bảng chia việc" (gửi đi OneDrive)

| Cột | Nội dung | Ai điền |
|-----|----------|---------|
| A | STT | App tạo |
| B | Mã KN | App tạo |
| C | Đơn vị phát sinh | App tạo |
| D | Nội dung kiến nghị | App tạo |
| E | Kết quả tuần trước | App tạo |
| F | Tình hình KTAT xử lý | **P.KTAT điền** |
| G | Đã có PYC chưa? (Có/Không) | **P.KTAT điền** |
| H | Số PYC | **P.KTAT điền** |
| I | Thời hạn cấp VT ước tính | **P.KHVT điền** |
| J | Tình trạng cấp VT | **P.KHVT điền** |
| K | Ghi chú KHVT | **P.KHVT điền** |

Cột A–E: nền trắng (App điền sẵn)  
Cột F–H: nền vàng nhạt (vùng KTAT)  
Cột I–K: nền xanh nhạt (vùng KHVT)

---

## Cấu trúc 1 kiến nghị (JSON)

```json
{
  "id": "KN-2026-001",
  "don_vi": "PXVH",
  "noi_dung": "Mô tả kiến nghị...",
  "tuan_truoc": "Nội dung xử lý tuần trước...",
  "tuan_nay": "Nội dung cập nhật tuần này...",
  "trang_thai": "cho_vat_tu",
  "thoi_han_vt": "2_3_thang",
  "so_pyc": null,
  "ket_qua_ktat": "",
  "ket_qua_khvt": "",
  "tuan_phat_sinh": "Tuần 23/2026",
  "hoan_thanh": false,
  "ngay_hoan_thanh": null,
  "lich_su": []
}
```

---

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v1/kien-nghi` | Lấy danh sách (`?hoan_thanh=true/false`) |
| GET | `/api/v1/kien-nghi/{id}` | Lấy 1 kiến nghị |
| POST | `/api/v1/kien-nghi` | Thêm kiến nghị mới |
| PUT | `/api/v1/kien-nghi/{id}` | Cập nhật kiến nghị |
| DELETE | `/api/v1/kien-nghi/{id}` | Xóa kiến nghị |
| POST | `/api/v1/cap-nhat-tuan-moi` | Kế thừa `tuan_nay` → `tuan_truoc`, xóa trắng `tuan_nay` |
| GET | `/api/v1/thong-ke` | Thống kê phân cấp theo trạng thái |
| GET | `/api/v1/xuat-excel` | Xuất báo cáo `.xlsx` 2 sheet (Chưa HT + Đã HT) |
| GET | `/api/v1/xuat-bang-chia-viec` | Xuất Excel bảng chia việc cột A–K |
| POST | `/api/v1/import-excel` | Import báo cáo cũ (dedup theo Mã KN cột B) |
| POST | `/api/v1/import-bang-chia-viec` | Import Excel bảng chia việc đã điền (cột F–K) |
| POST | `/api/v1/import-word` | Phân tích file Word, fuzzy match → trả preview 3 nhóm |
| POST | `/api/v1/import-word/xac-nhan` | Xác nhận import: merge vào KN có sẵn hoặc tạo mới |

---

## Các đơn vị phát sinh kiến nghị

- PXVH (Phân xưởng Vận hành)
- PXNL (Phân xưởng Nhiên liệu)
- PKT  (Phòng Kỹ thuật)

---

## Tiến độ thực hiện

### Đã xong
- [x] Khởi tạo project (venv, FastAPI, React Vite, Tailwind)
- [x] Cấu trúc data.json + id_counter (sửa bug ID trùng)
- [x] API CRUD kiến nghị
- [x] Giao diện Chưa hoàn thành (Thêm / Sửa / Xóa / Hoàn thành)
- [x] Giao diện Đã hoàn thành (Khôi phục)
- [x] Form thêm / sửa kiến nghị
- [x] Cập nhật tuần mới (kế thừa tuan_nay → tuan_truoc)
- [x] Xuất Excel báo cáo 2 sheet
- [x] Import Excel từ file báo cáo cũ
- [x] **Buổi 15/06/2026** — Thêm trạng thái `ktat_co_pyc` vào `constants.js` + `TRANG_THAI_COLOR`
- [x] **Buổi 15/06/2026** — API `/thong-ke` trả thêm `cho_vat_tu_theo_thoi_han` (breakdown 5 mức)
- [x] **Buổi 15/06/2026** — Tab **Thống kê** (`/thong-ke`) riêng biệt, là trang mặc định
- [x] **Buổi 15/06/2026** — `ThongKePage.jsx` — bảng báo cáo dạng tài liệu + nested cards row 2.5
- [x] **Buổi 15/06/2026** — Gỡ `ThongKeDashboard` khỏi `ChuaHoanThanh.jsx`
- [x] **Buổi 15/06/2026** — **Import Word** — `python-docx` + `difflib`, 2 endpoints, `ImportWordModal.jsx`
- [x] **Buổi 15/06/2026** — Import Word: tìm KN theo nội dung (search autocomplete), hỗ trợ gán vào KN đã HT → kích hoạt lại

### Cần làm (theo thứ tự ưu tiên)
- [ ] **Xuất Excel bảng chia việc** — endpoint `GET /api/v1/xuat-bang-chia-viec`, cột A–K, tô màu vùng KTAT (vàng) / KHVT (xanh)
- [ ] **Import Excel bảng chia việc** — endpoint `POST /api/v1/import-bang-chia-viec`, đọc cột F–K, cập nhật `ket_qua_ktat`, `so_pyc`, `ket_qua_khvt`, `thoi_han_vt`
- [ ] **UI duyệt trạng thái** — sau import bảng chia việc, Kiệt chọn HT / chưa HT + trạng thái chi tiết cho từng KN
- [ ] Deploy lên server LAN (sau khi kiểm thử xong)

---

## Vấn đề tồn đọng / Lưu ý kỹ thuật

### Buổi 15/06/2026 — ĐÃ GIẢI QUYẾT
- Import Excel báo cáo cũ → đã làm (`POST /api/v1/import-excel`)
- ID trùng → đã dùng `id_counter` trong `data.json`
- `dev.bat` đã tạo tại thư mục gốc

### Lưu ý Import Excel báo cáo cũ
- Cột B = Mã KN (key dedup)
- Dòng không bắt đầu bằng `KN-` bị bỏ qua tự động
- Nếu format file cũ khác thứ tự cột → sửa `import_excel` trong `main.py`

### Lưu ý Import Word (đã xong 15/06/2026)

**Cấu trúc file Word thực tế** (BC tuần KHVT):
- File có **4 bảng**: letterhead · BGĐ giao · tồn tại đơn vị · chữ ký
- Parser đọc `doc.tables[2]` (index 2, 0-based) — Bảng tồn tại đơn vị

**Nhận diện đơn vị** — dùng **exact match** (case-insensitive), không dùng substring:
- `"Phân xưởng Vận hành"` → `PXVH`
- `"Phân xưởng nhiên liệu"` → `PXNL`
- `"Phòng Kỹ thuật và An toàn"` → `PKT`
- Các section khác ("Phân xưởng vận hành điện Mặt trời Phước Thái", "Phòng HC-LĐ"…) → `current_don_vi = None` → bỏ qua

**Ngưỡng fuzzy match** (`difflib.SequenceMatcher`):
- `>= 0.75` → `chac_chan`: merge tự động (Kiệt vẫn có thể đổi)
- `0.45–0.75` → `khong_chac`: Kiệt chọn trong top-3 hoặc nhập mã KN khác
- `< 0.45` → `khong_khop`: mặc định tạo KN mới

**Merge action — KN chưa HT**: chỉ ghi đè `tuan_nay` + `ket_qua_khvt`, KHÔNG đổi `trang_thai`  
**Merge action — KN đã HT**: ghi đè `tuan_nay` + `ket_qua_khvt`, đồng thời set `hoan_thanh=False`, `ngay_hoan_thanh=None`, `trang_thai="phong_ktat_len_phieu"` → KN vào lại vòng đời  
**Tạo mới**: `trang_thai = "phong_ktat_len_phieu"`, `tuan_phat_sinh` lấy tuần ISO hiện tại

**KNSearchInput (UI)**: tìm KN theo từ khóa nội dung (client-side, toàn bộ KN đã load), chưa HT hiện trước, đã HT hiện sau với badge vàng "Đã HT". Chip chọn KN đã HT hiện "Đã HT → sẽ kích hoạt lại".

---

## Kế hoạch buổi tiếp theo

### 1. Xuất Excel bảng chia việc
- Endpoint: `GET /api/v1/xuat-bang-chia-viec`
- Cột A–E: app điền sẵn (nền trắng) — STT · Mã KN · Đơn vị · Nội dung · Kết quả tuần trước
- Cột F–H: nền vàng nhạt, để trống → P.KTAT điền (Tình hình KTAT · Đã có PYC? · Số PYC)
- Cột I–K: nền xanh nhạt, để trống → P.KHVT điền (Thời hạn VT · Tình trạng cấp VT · Ghi chú)
- Frontend: nút **"📋 Xuất bảng chia việc"** trên header, cạnh "📥 Xuất Excel"

### 2. Import Excel bảng chia việc đã điền
- Endpoint: `POST /api/v1/import-bang-chia-viec`
- Đọc cột B (Mã KN, key match) + cột F–K
- Cập nhật DB: `ket_qua_ktat` (F), `so_pyc` (H), `thoi_han_vt` (I), `ket_qua_khvt` (J+K)
- Tự động suy trang thái từ dữ liệu: có PYC → `ktat_co_pyc`; đã cấp VT → `da_cap_vat_tu`; chưa cấp → `cho_vat_tu`
- Frontend: nút **"📥 Import bảng chia việc"** → modal upload 1 bước (không cần review phức tạp, Mã KN là key chắc chắn)

### 3. UI duyệt trạng thái sau import
- Sau khi import bảng chia việc, Kiệt review từng KN: chọn Hoàn thành / Chưa hoàn thành + trạng thái chi tiết
- Có thể tích hợp vào trang Chưa hoàn thành (highlight những KN vừa được cập nhật)

### 4. Deploy LAN
- Chạy backend trực tiếp trên máy chủ cơ quan, frontend build static
- Địa chỉ: `http://192.168.x.x:8000` (backend serve luôn frontend hoặc nginx đơn giản)

---

## Quy ước code
- API prefix: `/api/v1/`
- Date format: `DD/MM/YYYY`
- Tuần format: `"Tuần XX/YYYY"`
- Encoding: UTF-8 toàn bộ
- Tên biến Python/JSON: tiếng Việt không dấu (`don_vi`, `tuan_nay`, `hoan_thanh`)

---

## Người dùng

| Tên | Vai trò | Tương tác với App |
|-----|---------|-------------------|
| Hiếu | Người code | — |
| **Kiệt** (TTĐ) | Người dùng duy nhất | Toàn bộ thao tác trong App |
| P.KTAT | Điền cột F–H bảng chia việc | Offline qua OneDrive |
| P.KHVT (Thanh Tuấn, Hoàng Anh) | Điền cột I–K bảng chia việc | Offline qua OneDrive |
| Hoàng (Tổ Trưởng) | Nhận báo cáo cuối tuần | Nhận file Excel, không dùng App |
