# QuanLyKienNghi – Project Context

## Mô tả
Phần mềm quản lý Kiến nghị hàng tuần cho Chuyên viên Kiệt.
Kiệt tổng hợp nội dung từ các đơn vị (Hoàng Anh, Thanh Tuấn, các Phân xưởng)
→ cập nhật trạng thái từng kiến nghị → xuất báo cáo Excel trình Tổ Trưởng Hoàng.

## Stack
- Frontend  : React Vite + TailwindCSS v4 (`@tailwindcss/vite`)
- Backend   : FastAPI (Python 3.9)
- Database  : JSON file (`backend/data.json`)
- Xuất file : openpyxl
- Dev       : máy Kiệt – localhost (frontend :5173, backend :8000)
- Production: server cơ quan – truy cập qua LAN (`http://192.168.x.x:8000`)

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

## Cấu trúc thư mục

```
D:\TaskApp_kiet\QuanLyKienNghi\
├── venv\                          ← Python venv riêng (KHÔNG dùng chung với TaskApp PyQt5)
├── backend\
│   ├── main.py                    ← FastAPI app (CRUD + xuất Excel + thống kê)
│   ├── data.json                  ← Database JSON
│   └── requirements.txt           ← fastapi, uvicorn, openpyxl, python-multipart
├── frontend\
│   ├── src\
│   │   ├── main.jsx
│   │   ├── App.jsx                ← Layout, Router, header buttons
│   │   ├── index.css              ← Tailwind + utility classes (input, label, btn-*)
│   │   ├── constants.js           ← Nhãn trạng thái, màu badge, danh sách đơn vị
│   │   ├── api.js                 ← Fetch wrapper cho toàn bộ API
│   │   ├── components\
│   │   │   ├── TrangThaiBadge.jsx ← Badge màu hiển thị trạng thái
│   │   │   ├── KienNghiForm.jsx   ← Modal thêm / sửa kiến nghị
│   │   │   └── ThongKeDashboard.jsx ← 6 cards thống kê phía trên bảng
│   │   └── pages\
│   │       ├── ChuaHoanThanh.jsx  ← Bảng + Thêm / Sửa / Xóa / Hoàn thành
│   │       └── DaHoanThanh.jsx    ← Bảng + Khôi phục
│   └── package.json
├── CONTEXT.md
└── README.md
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v1/kien-nghi` | Lấy danh sách (query: `?hoan_thanh=true/false`) |
| GET | `/api/v1/kien-nghi/{id}` | Lấy 1 kiến nghị |
| POST | `/api/v1/kien-nghi` | Thêm kiến nghị mới |
| PUT | `/api/v1/kien-nghi/{id}` | Cập nhật kiến nghị |
| DELETE | `/api/v1/kien-nghi/{id}` | Xóa kiến nghị |
| POST | `/api/v1/cap-nhat-tuan-moi` | Kế thừa `tuan_nay` → `tuan_truoc`, xóa trắng `tuan_nay` |
| GET | `/api/v1/thong-ke` | Thống kê tổng / theo trạng thái |
| GET | `/api/v1/xuat-excel` | Xuất file `.xlsx` 2 sheet (Chưa HT + Đã HT) |
| POST | `/api/v1/import-excel` | Import từ file `.xlsx` (multipart), bỏ qua ID trùng |

## Nghiệp vụ cốt lõi

### Luồng hàng tuần
1. Các đơn vị gửi nội dung cập nhật về cho Kiệt
2. Kiệt nhập/cập nhật từng kiến nghị vào app
3. Kiệt quyết định kiến nghị nào "Hoàn thành" trong tuần
4. Bấm **Xuất Excel** → nhận file 2 sheet → trình Tổ Trưởng Hoàng
5. Đầu tuần sau: bấm **Cập nhật tuần mới** để kế thừa nội dung sang cột Tuần trước

### Các đơn vị kiến nghị
- PXVH (Phân xưởng Vận hành)
- PXNL (Phân xưởng Nhiên liệu)
- PKT  (Phòng Kỹ thuật)
- Hoàng Anh
- Thanh Tuấn

### Trạng thái kiến nghị
Kiến nghị chưa hoàn thành gồm 4 loại:
  1. `phong_ktat_len_phieu` — Phòng KTAT đang lên phiếu yêu cầu
  2. `da_sua_chua_theo_doi` — Đã sửa chữa, hiện đang theo dõi thông số
  3. `da_cap_vat_tu` — Đã cấp vật tư
  4. `cho_vat_tu` — Đợi cấp vật tư – có 5 mức thời hạn (`thoi_han_vt`):
     - `duoi_1_thang` — < 1 tháng
     - `2_3_thang` — 2–3 tháng
     - `3_6_thang` — 3–6 tháng
     - `tren_6_thang` — > 6 tháng
     - `chua_co_han` — Chưa có hạn

Kiến nghị hoàn thành: do Kiệt chủ động đánh dấu sau khi xác nhận đã xử lý xong.

### Cấu trúc 1 kiến nghị (JSON)
```json
{
  "id": "KN-2026-001",
  "don_vi": "PXVH",
  "noi_dung": "Mô tả kiến nghị...",
  "tuan_truoc": "Nội dung xử lý tuần trước...",
  "tuan_nay": "Nội dung cập nhật tuần này...",
  "trang_thai": "cho_vat_tu",
  "thoi_han_vt": "2_3_thang",
  "tuan_phat_sinh": "Tuần 23/2026",
  "hoan_thanh": false,
  "ngay_hoan_thanh": null,
  "lich_su": []
}
```

## Tiến độ thực hiện
- [x] Khởi tạo project (venv, FastAPI, React Vite, Tailwind)
- [x] Cấu trúc data.json
- [x] API CRUD kiến nghị (FastAPI)
- [x] Giao diện danh sách kiến nghị chưa hoàn thành
- [x] Giao diện danh sách kiến nghị đã hoàn thành
- [x] Form thêm / sửa kiến nghị
- [x] Chức năng cập nhật tuần mới (kế thừa tuan_nay → tuan_truoc)
- [x] Thống kê theo nhóm trạng thái (Dashboard nhỏ)
- [x] Xuất Excel 2 danh sách (openpyxl)
- [x] Sửa bug ID trùng (id_counter trong data.json)
- [x] Import Excel từ file báo cáo cũ (POST /api/v1/import-excel + button frontend)
- [ ] Kiểm thử thực tế với dữ liệu tuần 24/2026
<!-- - [ ] Deploy lên server cơ quan -->

## Vấn đề tồn đọng

### Buổi 15/06/2026 — ĐÃ GIẢI QUYẾT
- ~~**Import Excel chưa làm**~~ → Đã thêm endpoint `POST /api/v1/import-excel` + button "📤 Import Excel" trên header.
- ~~**ID có thể trùng**~~ → Đã dùng `id_counter` trong `data.json` thay vì `len()`.
- **Deploy tạm bỏ qua** — sẽ bổ sung sau khi kiểm thử xong.
- **`dev.bat` đã tạo** tại thư mục gốc để khởi động nhanh cả 2 server.

### Lưu ý Import Excel
Import đọc theo format xuất của app (2 sheet: "Chưa hoàn thành" + "Đã hoàn thành").
- Cột B = Mã KN (dùng làm key dedup).
- Dòng không bắt đầu bằng `KN-` (dòng thống kê ở cuối sheet 1) bị bỏ qua tự động.
- Nếu file Excel cũ của Kiệt có format **khác** (cột khác thứ tự), cần điều chỉnh lại hàm `import_excel` trong `main.py`.

## Kế hoạch làm việc buổi tiếp theo

1. **Kiểm thử thực tế** — mở app, bấm "📤 Import Excel", chọn file Excel tuần 24/2026 của Kiệt, kiểm tra dữ liệu hiển thị đúng, rồi bấm "📥 Xuất Excel" xác nhận đầu ra.
2. **Điều chỉnh mapping cột nếu cần** — nếu file Excel Kiệt có cột khác vị trí so với format app, sửa `_parse_trang_thai` và index cột trong `import_excel`.
3. **Deploy lên server LAN** — chạy uvicorn bind `0.0.0.0:8000`, cập nhật CORS origin, truy cập từ máy khác qua IP cơ quan.

## Quy ước code
- API prefix: `/api/v1/`
- Date format: `DD/MM/YYYY`
- Tuần format: `"Tuần XX/YYYY"`
- Encoding: UTF-8 toàn bộ
- Tên biến Python/JSON: tiếng Việt không dấu (`don_vi`, `tuan_nay`, `hoan_thanh`)

## Người dùng
- Hiếu  : người code
- Kiệt  : chuyên viên dùng app, nhập liệu chính
- Hoàng : Tổ Trưởng, nhận báo cáo
