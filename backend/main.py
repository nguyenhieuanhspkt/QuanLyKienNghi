import io
import json
from datetime import date
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from pydantic import BaseModel

app = FastAPI(title="QuanLyKienNghi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "data.json"

DON_VI_LIST = ["PXVH", "PXNL", "PKT", "Hoàng Anh", "Thanh Tuấn"]
TRANG_THAI_LIST = [
    "phong_ktat_len_phieu",
    "da_sua_chua_theo_doi",
    "da_cap_vat_tu",
    "cho_vat_tu",
]
THOI_HAN_VT_LIST = [
    "duoi_1_thang",
    "2_3_thang",
    "3_6_thang",
    "tren_6_thang",
    "chua_co_han",
]


def doc_data() -> dict:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def ghi_data(data: dict):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class KienNghiCreate(BaseModel):
    don_vi: str
    noi_dung: str
    tuan_truoc: Optional[str] = ""
    tuan_nay: Optional[str] = ""
    trang_thai: str
    thoi_han_vt: Optional[str] = None
    tuan_phat_sinh: str


class KienNghiUpdate(BaseModel):
    don_vi: Optional[str] = None
    noi_dung: Optional[str] = None
    tuan_truoc: Optional[str] = None
    tuan_nay: Optional[str] = None
    trang_thai: Optional[str] = None
    thoi_han_vt: Optional[str] = None
    tuan_phat_sinh: Optional[str] = None
    hoan_thanh: Optional[bool] = None
    ngay_hoan_thanh: Optional[str] = None


# ─── CRUD ────────────────────────────────────────────────────────────────────

@app.get("/api/v1/kien-nghi", summary="Lấy danh sách kiến nghị")
def get_all(hoan_thanh: Optional[bool] = None):
    data = doc_data()
    items = data["kien_nghi"]
    if hoan_thanh is not None:
        items = [kn for kn in items if kn["hoan_thanh"] == hoan_thanh]
    return items


@app.get("/api/v1/kien-nghi/{kn_id}", summary="Lấy 1 kiến nghị")
def get_one(kn_id: str):
    data = doc_data()
    for kn in data["kien_nghi"]:
        if kn["id"] == kn_id:
            return kn
    raise HTTPException(404, "Không tìm thấy kiến nghị")


@app.post("/api/v1/kien-nghi", status_code=201, summary="Thêm kiến nghị mới")
def create(body: KienNghiCreate):
    data = doc_data()
    # Backward compat: khởi tạo id_counter từ max ID hiện có nếu thiếu
    if "id_counter" not in data:
        max_num = 0
        for kn in data["kien_nghi"]:
            try:
                max_num = max(max_num, int(kn["id"].split("-")[2]))
            except (IndexError, ValueError):
                pass
        data["id_counter"] = max_num
    data["id_counter"] += 1
    so_thu_tu = data["id_counter"]
    nam = date.today().year
    kn = {
        "id": f"KN-{nam}-{so_thu_tu:03d}",
        "don_vi": body.don_vi,
        "noi_dung": body.noi_dung,
        "tuan_truoc": body.tuan_truoc or "",
        "tuan_nay": body.tuan_nay or "",
        "trang_thai": body.trang_thai,
        "thoi_han_vt": body.thoi_han_vt,
        "tuan_phat_sinh": body.tuan_phat_sinh,
        "hoan_thanh": False,
        "ngay_hoan_thanh": None,
        "lich_su": [],
    }
    data["kien_nghi"].append(kn)
    ghi_data(data)
    return kn


@app.put("/api/v1/kien-nghi/{kn_id}", summary="Cập nhật kiến nghị")
def update(kn_id: str, body: KienNghiUpdate):
    data = doc_data()
    for idx, kn in enumerate(data["kien_nghi"]):
        if kn["id"] == kn_id:
            update_fields = body.model_dump(exclude_unset=True)
            # Lưu lịch sử trước khi cập nhật
            if any(k in update_fields for k in ("tuan_nay", "trang_thai", "hoan_thanh")):
                snapshot = {k: kn[k] for k in ("tuan_nay", "trang_thai", "hoan_thanh")}
                kn["lich_su"].append(snapshot)
            kn.update(update_fields)
            data["kien_nghi"][idx] = kn
            ghi_data(data)
            return kn
    raise HTTPException(404, "Không tìm thấy kiến nghị")


@app.delete("/api/v1/kien-nghi/{kn_id}", status_code=204, summary="Xóa kiến nghị")
def delete(kn_id: str):
    data = doc_data()
    before = len(data["kien_nghi"])
    data["kien_nghi"] = [kn for kn in data["kien_nghi"] if kn["id"] != kn_id]
    if len(data["kien_nghi"]) == before:
        raise HTTPException(404, "Không tìm thấy kiến nghị")
    ghi_data(data)


# ─── Cập nhật tuần mới ───────────────────────────────────────────────────────

@app.post("/api/v1/cap-nhat-tuan-moi", summary="Kế thừa tuan_nay → tuan_truoc cho tuần tiếp")
def cap_nhat_tuan_moi():
    data = doc_data()
    count = 0
    for kn in data["kien_nghi"]:
        if not kn["hoan_thanh"]:
            kn["tuan_truoc"] = kn["tuan_nay"]
            kn["tuan_nay"] = ""
            count += 1
    ghi_data(data)
    return {"message": f"Đã cập nhật {count} kiến nghị chưa hoàn thành"}


# ─── Xuất Excel ──────────────────────────────────────────────────────────────

LABEL_TRANG_THAI = {
    "phong_ktat_len_phieu": "Phòng KTAT đang lên phiếu YC",
    "da_sua_chua_theo_doi": "Đã sửa chữa, đang theo dõi",
    "da_cap_vat_tu": "Đã cấp vật tư",
    "cho_vat_tu": "Đợi cấp vật tư",
}
LABEL_THOI_HAN = {
    "duoi_1_thang": "< 1 tháng",
    "2_3_thang": "2–3 tháng",
    "3_6_thang": "3–6 tháng",
    "tren_6_thang": "> 6 tháng",
    "chua_co_han": "Chưa có hạn",
}

def _cell_border():
    s = Side(style="thin")
    return Border(left=s, right=s, top=s, bottom=s)

def _header_fill():
    return PatternFill("solid", fgColor="1E3A5F")

def _set_col_widths(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

def _write_header_row(ws, headers):
    border = _cell_border()
    fill = _header_fill()
    font = Font(bold=True, color="FFFFFF", name="Arial", size=10)
    align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.font = font
        cell.fill = fill
        cell.alignment = align
        cell.border = border
    ws.row_dimensions[1].height = 30

def _wrap_cell(cell, value):
    cell.value = value
    cell.alignment = Alignment(wrap_text=True, vertical="top")
    cell.border = _cell_border()
    cell.font = Font(name="Arial", size=10)

def _build_sheet_chua_ht(ws, items):
    headers = ["STT", "Mã KN", "Đơn vị", "Nội dung kiến nghị",
               "Xử lý tuần trước", "Cập nhật tuần này",
               "Trạng thái", "Tuần phát sinh"]
    _write_header_row(ws, headers)
    _set_col_widths(ws, [5, 13, 10, 40, 30, 30, 28, 14])

    alt_fill = PatternFill("solid", fgColor="EFF6FF")
    for i, kn in enumerate(items, 1):
        row = i + 1
        tt = LABEL_TRANG_THAI.get(kn["trang_thai"], kn["trang_thai"])
        if kn["trang_thai"] == "cho_vat_tu" and kn.get("thoi_han_vt"):
            tt += f"\n({LABEL_THOI_HAN.get(kn['thoi_han_vt'], kn['thoi_han_vt'])})"

        values = [i, kn["id"], kn["don_vi"], kn["noi_dung"],
                  kn.get("tuan_truoc", ""), kn.get("tuan_nay", ""),
                  tt, kn["tuan_phat_sinh"]]
        for col, val in enumerate(values, 1):
            cell = ws.cell(row=row, column=col)
            _wrap_cell(cell, val)
            if i % 2 == 0:
                cell.fill = alt_fill
        ws.row_dimensions[row].height = 55

    # Thống kê theo nhóm
    from collections import Counter
    nhom = Counter(kn["trang_thai"] for kn in items)
    stat_row = len(items) + 3
    ws.cell(row=stat_row, column=1, value="THỐNG KÊ THEO TRẠNG THÁI").font = Font(bold=True, name="Arial", size=10)
    for j, (key, label) in enumerate(LABEL_TRANG_THAI.items(), 1):
        r = stat_row + j
        ws.cell(row=r, column=1, value=label).font = Font(name="Arial", size=10)
        ws.cell(row=r, column=2, value=nhom.get(key, 0)).font = Font(bold=True, name="Arial", size=10)
    ws.cell(row=stat_row + len(LABEL_TRANG_THAI) + 1, column=1, value="Tổng cộng").font = Font(bold=True, name="Arial", size=10)
    ws.cell(row=stat_row + len(LABEL_TRANG_THAI) + 1, column=2, value=len(items)).font = Font(bold=True, name="Arial", size=10)

def _build_sheet_da_ht(ws, items):
    headers = ["STT", "Mã KN", "Đơn vị", "Nội dung kiến nghị",
               "Xử lý cuối", "Tuần phát sinh", "Ngày hoàn thành"]
    _write_header_row(ws, headers)
    _set_col_widths(ws, [5, 13, 10, 45, 35, 14, 14])

    alt_fill = PatternFill("solid", fgColor="F0FDF4")
    for i, kn in enumerate(items, 1):
        row = i + 1
        values = [i, kn["id"], kn["don_vi"], kn["noi_dung"],
                  kn.get("tuan_nay", ""), kn["tuan_phat_sinh"],
                  kn.get("ngay_hoan_thanh", "")]
        for col, val in enumerate(values, 1):
            cell = ws.cell(row=row, column=col)
            _wrap_cell(cell, val)
            if i % 2 == 0:
                cell.fill = alt_fill
        ws.row_dimensions[row].height = 55


@app.get("/api/v1/xuat-excel", summary="Xuất báo cáo Excel 2 danh sách")
def xuat_excel():
    data = doc_data()
    items = data["kien_nghi"]
    chua_ht = [kn for kn in items if not kn["hoan_thanh"]]
    da_ht = [kn for kn in items if kn["hoan_thanh"]]

    today = date.today().strftime("%d/%m/%Y")
    wb = Workbook()

    ws1 = wb.active
    ws1.title = "Chưa hoàn thành"
    ws1.sheet_properties.tabColor = "2563EB"
    _build_sheet_chua_ht(ws1, chua_ht)

    ws2 = wb.create_sheet("Đã hoàn thành")
    ws2.sheet_properties.tabColor = "16A34A"
    _build_sheet_da_ht(ws2, da_ht)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    ten_file = f"BaoCaoKienNghi_{date.today().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{ten_file}"},
    )


# ─── Import / Preview Excel ──────────────────────────────────────────────────

_LABEL_TO_TRANG_THAI = {v: k for k, v in LABEL_TRANG_THAI.items()}
_LABEL_TO_THOI_HAN = {v: k for k, v in LABEL_THOI_HAN.items()}
# Alias cho key không chuẩn từ hệ thống khác
_TRANG_THAI_ALIAS = {
    "dang_theo_doi": "da_sua_chua_theo_doi",
    "theo_doi": "da_sua_chua_theo_doi",
}


def _parse_trang_thai(cell_value):
    """Chuyển nhãn / key trạng thái → (trang_thai_key, thoi_han_vt_key)."""
    if not cell_value:
        return "cho_vat_tu", None
    s = str(cell_value).strip()
    if s in TRANG_THAI_LIST:
        return s, None
    if s in _TRANG_THAI_ALIAS:
        return _TRANG_THAI_ALIAS[s], None
    thoi_han = None
    if "\n" in s:
        label, rest = s.split("\n", 1)
        thoi_han = _LABEL_TO_THOI_HAN.get(rest.strip().strip("()"))
    else:
        label = s
    return _LABEL_TO_TRANG_THAI.get(label.strip(), "cho_vat_tu"), thoi_han


def _cell_str(row_values, col_1based: int) -> str:
    """Lấy giá trị ô (1-based index) từ tuple values_only, trả về str."""
    if not col_1based or col_1based < 1 or col_1based > len(row_values):
        return ""
    val = row_values[col_1based - 1]
    return str(val).strip() if val is not None else ""


def _ensure_id_counter(data: dict):
    if "id_counter" not in data:
        max_num = 0
        for kn in data["kien_nghi"]:
            try:
                max_num = max(max_num, int(kn["id"].split("-")[2]))
            except (IndexError, ValueError):
                pass
        data["id_counter"] = max_num


@app.post("/api/v1/preview-excel", summary="Xem trước file Excel trước khi import")
async def preview_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(400, "Chỉ hỗ trợ file .xlsx")
    content = await file.read()
    try:
        wb = load_workbook(io.BytesIO(content), data_only=True)
    except Exception:
        raise HTTPException(400, "Không đọc được file Excel")

    result = []
    for ws in wb.worksheets:
        rows = []
        for i, row in enumerate(ws.iter_rows(min_row=1, values_only=True)):
            if i >= 7:
                break
            rows.append([str(c).strip() if c is not None else "" for c in row])
        result.append({"name": ws.title, "rows": rows})
    return result


@app.post("/api/v1/import-excel", summary="Import kiến nghị từ file Excel (.xlsx)")
async def import_excel(
    file: UploadFile = File(...),
    mapping: str = Form(default=None),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(400, "Chỉ hỗ trợ file .xlsx")
    content = await file.read()
    try:
        wb = load_workbook(io.BytesIO(content), data_only=True)
    except Exception:
        raise HTTPException(400, "Không đọc được file Excel")

    data = doc_data()
    _ensure_id_counter(data)
    existing_ids = {kn["id"] for kn in data["kien_nghi"]}
    imported = skipped_dup = skipped_empty = 0

    if mapping:
        mp = json.loads(mapping)
        sheet_idx = int(mp.get("sheet_index", 0))
        header_row = int(mp.get("header_row", 1))
        hoan_thanh = bool(mp.get("hoan_thanh", False))
        col_ma_kn = mp.get("col_ma_kn")
        col_don_vi = mp.get("col_don_vi")
        don_vi_fixed = mp.get("don_vi_fixed")
        col_noi_dung = mp.get("col_noi_dung")
        col_tuan_truoc = mp.get("col_tuan_truoc")
        col_tuan_nay = mp.get("col_tuan_nay")
        col_trang_thai = mp.get("col_trang_thai")
        trang_thai_fixed = mp.get("trang_thai_fixed", "cho_vat_tu")
        thoi_han_vt_fixed = mp.get("thoi_han_vt_fixed")
        col_tuan_phat_sinh = mp.get("col_tuan_phat_sinh")
        col_ngay_hoan_thanh = mp.get("col_ngay_hoan_thanh")

        ws = wb.worksheets[sheet_idx] if sheet_idx < len(wb.worksheets) else wb.worksheets[0]

        for row_num, row_vals in enumerate(ws.iter_rows(min_row=1, values_only=True), start=1):
            if row_num <= header_row:
                continue
            noi_dung = _cell_str(row_vals, col_noi_dung)
            if not noi_dung:
                skipped_empty += 1
                continue

            ma_kn = _cell_str(row_vals, col_ma_kn) if col_ma_kn else ""
            if not ma_kn:
                data["id_counter"] += 1
                ma_kn = f"KN-{date.today().year}-{data['id_counter']:03d}"
            if ma_kn in existing_ids:
                skipped_dup += 1
                continue

            don_vi = don_vi_fixed or _cell_str(row_vals, col_don_vi) or ""

            if col_trang_thai:
                trang_thai, thoi_han = _parse_trang_thai(_cell_str(row_vals, col_trang_thai))
            else:
                trang_thai = trang_thai_fixed or "cho_vat_tu"
                thoi_han = thoi_han_vt_fixed if trang_thai == "cho_vat_tu" else None

            kn = {
                "id": ma_kn,
                "don_vi": don_vi,
                "noi_dung": noi_dung,
                "tuan_truoc": _cell_str(row_vals, col_tuan_truoc),
                "tuan_nay": _cell_str(row_vals, col_tuan_nay),
                "trang_thai": trang_thai,
                "thoi_han_vt": thoi_han or None,
                "tuan_phat_sinh": _cell_str(row_vals, col_tuan_phat_sinh),
                "hoan_thanh": hoan_thanh,
                "ngay_hoan_thanh": _cell_str(row_vals, col_ngay_hoan_thanh) if hoan_thanh else None,
                "lich_su": [],
            }
            data["kien_nghi"].append(kn)
            existing_ids.add(ma_kn)
            imported += 1
    else:
        # Fallback: format cố định (format xuất của app)
        for sheet_idx, hoan_thanh in [(0, False), (1, True)]:
            if sheet_idx >= len(wb.worksheets):
                break
            ws = wb.worksheets[sheet_idx]
            for row_vals in ws.iter_rows(min_row=2, values_only=True):
                ma_kn = _cell_str(row_vals, 2)
                if not ma_kn or not ma_kn.startswith("KN-"):
                    skipped_empty += 1
                    continue
                if ma_kn in existing_ids:
                    skipped_dup += 1
                    continue
                if not hoan_thanh:
                    trang_thai, thoi_han = _parse_trang_thai(_cell_str(row_vals, 7))
                    kn = {
                        "id": ma_kn, "don_vi": _cell_str(row_vals, 3),
                        "noi_dung": _cell_str(row_vals, 4), "tuan_truoc": _cell_str(row_vals, 5),
                        "tuan_nay": _cell_str(row_vals, 6), "trang_thai": trang_thai,
                        "thoi_han_vt": thoi_han, "tuan_phat_sinh": _cell_str(row_vals, 8),
                        "hoan_thanh": False, "ngay_hoan_thanh": None, "lich_su": [],
                    }
                else:
                    kn = {
                        "id": ma_kn, "don_vi": _cell_str(row_vals, 3),
                        "noi_dung": _cell_str(row_vals, 4), "tuan_truoc": "",
                        "tuan_nay": _cell_str(row_vals, 5), "trang_thai": "da_cap_vat_tu",
                        "thoi_han_vt": None, "tuan_phat_sinh": _cell_str(row_vals, 6),
                        "hoan_thanh": True, "ngay_hoan_thanh": _cell_str(row_vals, 7), "lich_su": [],
                    }
                data["kien_nghi"].append(kn)
                existing_ids.add(ma_kn)
                imported += 1

    # Sync id_counter với max ID thực tế
    for kn in data["kien_nghi"]:
        try:
            data["id_counter"] = max(data["id_counter"], int(kn["id"].split("-")[2]))
        except (IndexError, ValueError):
            pass

    ghi_data(data)
    return {
        "imported": imported,
        "skipped_dup": skipped_dup,
        "skipped_empty": skipped_empty,
        "message": f"Import thành công {imported} kiến nghị, bỏ qua {skipped_dup} trùng ID.",
    }


# ─── Thống kê ────────────────────────────────────────────────────────────────

@app.get("/api/v1/thong-ke", summary="Thống kê theo trạng thái")
def thong_ke():
    data = doc_data()
    items = data["kien_nghi"]
    chua_ht = [kn for kn in items if not kn["hoan_thanh"]]
    da_ht = [kn for kn in items if kn["hoan_thanh"]]

    nhom = {}
    for kn in chua_ht:
        tt = kn["trang_thai"]
        nhom[tt] = nhom.get(tt, 0) + 1

    return {
        "tong": len(items),
        "chua_hoan_thanh": len(chua_ht),
        "da_hoan_thanh": len(da_ht),
        "theo_trang_thai": nhom,
    }
