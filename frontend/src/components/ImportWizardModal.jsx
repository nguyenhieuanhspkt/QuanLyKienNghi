import { useState } from "react"
import { api } from "../api"
import { DON_VI, TRANG_THAI, THOI_HAN_VT } from "../constants"

const COL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
function colLetter(i) { return i < 26 ? COL_LETTERS[i] : String(i + 1) }

function ColSelect({ value, onChange, options, placeholder = "(Không chọn)" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[220px] bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 font-normal text-xs ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export default function ImportWizardModal({ onClose, onDone }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Bước 1
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)     // [{name, rows}]
  const [sheetIdx, setSheetIdx] = useState(0)

  // Bước 2
  const [headerRow, setHeaderRow] = useState(1)
  const [hoanThanh, setHoanThanh] = useState(false)
  const [colNoidung, setColNoidung] = useState("")
  const [donViMode, setDonViMode] = useState("fixed") // "fixed" | "col"
  const [colDonvi, setColDonvi] = useState("")
  const [donViFixed, setDonViFixed] = useState("PXVH")
  const [colMakn, setColMakn] = useState("")
  const [colTuantruoc, setColTuantruoc] = useState("")
  const [colTuannay, setColTuannay] = useState("")
  const [trangThaiMode, setTrangThaiMode] = useState("fixed") // "fixed" | "col"
  const [colTrangthai, setColTrangthai] = useState("")
  const [trangThaiFixed, setTrangThaiFixed] = useState("cho_vat_tu")
  const [thoiHanFixed, setThoiHanFixed] = useState("")
  const [colTuanphatsinh, setColTuanphatsinh] = useState("")
  const [colNgayhoanthanh, setColNgayhoanthanh] = useState("")

  // Bước 3
  const [result, setResult] = useState(null)

  // Tính danh sách cột từ preview (dùng header_row để lấy tên cột)
  const sheetData = preview?.[sheetIdx]
  const headerRowData = sheetData?.rows[headerRow - 1] || []
  const colOptions = headerRowData.map((h, i) => ({
    value: String(i + 1),
    label: `Cột ${colLetter(i)}${h ? ` — ${h}` : ""}`,
  }))

  async function handleFileChange(e) {
    const f = e.target.files[0]
    e.target.value = ""
    if (!f) return
    setFile(f)
    setLoading(true)
    setError("")
    try {
      const data = await api.previewExcel(f)
      setPreview(data)
      setSheetIdx(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!colNoidung) { setError("Vui lòng chọn cột Nội dung kiến nghị"); return }
    if (donViMode === "col" && !colDonvi) { setError("Vui lòng chọn cột Đơn vị"); return }
    setLoading(true)
    setError("")
    try {
      const mapping = {
        sheet_index: sheetIdx,
        header_row: headerRow,
        hoan_thanh: hoanThanh,
        col_ma_kn: colMakn ? Number(colMakn) : null,
        col_don_vi: donViMode === "col" ? Number(colDonvi) : null,
        don_vi_fixed: donViMode === "fixed" ? donViFixed : null,
        col_noi_dung: Number(colNoidung),
        col_tuan_truoc: colTuantruoc ? Number(colTuantruoc) : null,
        col_tuan_nay: colTuannay ? Number(colTuannay) : null,
        col_trang_thai: trangThaiMode === "col" ? (colTrangthai ? Number(colTrangthai) : null) : null,
        trang_thai_fixed: trangThaiMode === "fixed" ? trangThaiFixed : null,
        thoi_han_vt_fixed: trangThaiMode === "fixed" && trangThaiFixed === "cho_vat_tu" && thoiHanFixed ? thoiHanFixed : null,
        col_tuan_phat_sinh: colTuanphatsinh ? Number(colTuanphatsinh) : null,
        col_ngay_hoan_thanh: colNgayhoanthanh ? Number(colNgayhoanthanh) : null,
      }
      const res = await api.importExcel(file, mapping)
      setResult(res)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const steps = ["1. Tải file", "2. Khai báo cột", "3. Kết quả"]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-gray-800">📤 Import Excel</h2>
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <span key={i} className={`px-3 py-1 text-xs rounded-full ${step === i + 1 ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-400"}`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Bước 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Chọn file Excel (.xlsx) chứa dữ liệu kiến nghị cần import.</p>
              <label className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2 text-sm rounded border border-blue-400 text-blue-600 hover:bg-blue-50 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
                📂 {file ? file.name : "Chọn file .xlsx"}
                <input type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
              </label>

              {loading && <p className="text-sm text-gray-500">Đang đọc file...</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}

              {preview && (
                <div className="space-y-3">
                  {/* Sheet selector */}
                  {preview.length > 1 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Chọn sheet cần import:</p>
                      <div className="flex gap-2 flex-wrap">
                        {preview.map((s, i) => (
                          <button key={i}
                            className={`px-3 py-1 text-sm rounded border transition-colors ${sheetIdx === i ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}
                            onClick={() => setSheetIdx(i)}
                          >{s.name}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview table */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Xem trước {sheetData.rows.length} dòng đầu của sheet <strong>{sheetData.name}</strong>:</p>
                    <div className="overflow-x-auto border rounded">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-2 py-1 text-gray-400 border-r font-normal w-8">#</th>
                            {(sheetData.rows[0] || []).map((_, ci) => (
                              <th key={ci} className="px-2 py-1 border-r text-gray-500 font-medium">{colLetter(ci)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sheetData.rows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-2 py-1 border-r text-gray-400 text-center">{ri + 1}</td>
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-2 py-1 border-r border-b max-w-[160px] truncate" title={cell}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Bước 2 ── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Header row */}
              <Field label="Hàng tiêu đề (header) là hàng số mấy?" hint="Dữ liệu sẽ đọc từ hàng kế tiếp trở đi">
                <input type="number" min="1" value={headerRow}
                  onChange={(e) => setHeaderRow(Number(e.target.value) || 1)}
                  className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm" />
                <p className="text-xs text-gray-400 mt-1">
                  Hàng {headerRow} hiện tại:{" "}
                  <span className="font-mono">{(sheetData?.rows[headerRow - 1] || []).filter(Boolean).join(" | ") || "(trống)"}</span>
                </p>
              </Field>

              {/* Hoan thanh */}
              <Field label="Các kiến nghị này thuộc danh sách nào?">
                <div className="flex gap-4">
                  {[false, true].map((v) => (
                    <label key={String(v)} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={hoanThanh === v} onChange={() => setHoanThanh(v)} />
                      {v ? "Đã hoàn thành" : "Chưa hoàn thành"}
                    </label>
                  ))}
                </div>
              </Field>

              {/* Noi dung */}
              <Field label="Cột Nội dung kiến nghị" required>
                <ColSelect value={colNoidung} onChange={setColNoidung} options={colOptions} placeholder="— Chọn cột —" />
              </Field>

              {/* Don vi */}
              <Field label="Đơn vị">
                <div className="flex gap-4 mb-2">
                  {[["fixed", "Tất cả cùng một đơn vị:"], ["col", "Lấy từ cột trong file"]].map(([v, lbl]) => (
                    <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={donViMode === v} onChange={() => setDonViMode(v)} /> {lbl}
                    </label>
                  ))}
                </div>
                {donViMode === "fixed" ? (
                  <select value={donViFixed} onChange={(e) => setDonViFixed(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                    {DON_VI.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <ColSelect value={colDonvi} onChange={setColDonvi} options={colOptions} />
                )}
              </Field>

              {/* Ma KN */}
              <Field label="Cột Mã KN" hint="(để trống = tự sinh ID mới)">
                <ColSelect value={colMakn} onChange={setColMakn} options={colOptions} />
              </Field>

              {/* Tuan truoc */}
              <Field label="Cột Xử lý tuần trước" hint="(tùy chọn)">
                <ColSelect value={colTuantruoc} onChange={setColTuantruoc} options={colOptions} />
              </Field>

              {/* Tuan nay */}
              <Field label="Cột Cập nhật tuần này" hint="(tùy chọn)">
                <ColSelect value={colTuannay} onChange={setColTuannay} options={colOptions} />
              </Field>

              {/* Trang thai */}
              <Field label="Trạng thái">
                <div className="flex gap-4 mb-2">
                  {[["fixed", "Mặc định cho tất cả:"], ["col", "Lấy từ cột trong file"]].map(([v, lbl]) => (
                    <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={trangThaiMode === v} onChange={() => setTrangThaiMode(v)} /> {lbl}
                    </label>
                  ))}
                </div>
                {trangThaiMode === "fixed" ? (
                  <div className="space-y-2">
                    <select value={trangThaiFixed} onChange={(e) => setTrangThaiFixed(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                      {Object.entries(TRANG_THAI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {trangThaiFixed === "cho_vat_tu" && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Thời hạn vật tư:</label>
                        <select value={thoiHanFixed} onChange={(e) => setThoiHanFixed(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                          <option value="">(Chưa có hạn)</option>
                          {Object.entries(THOI_HAN_VT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <ColSelect value={colTrangthai} onChange={setColTrangthai} options={colOptions} />
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ tên tiếng Việt hoặc key nội bộ (vd: <code>cho_vat_tu</code>)</p>
                  </div>
                )}
              </Field>

              {/* Tuan phat sinh */}
              <Field label="Cột Tuần phát sinh" hint="(tùy chọn)">
                <ColSelect value={colTuanphatsinh} onChange={setColTuanphatsinh} options={colOptions} />
              </Field>

              {/* Ngay hoan thanh - chỉ hiện khi đã hoàn thành */}
              {hoanThanh && (
                <Field label="Cột Ngày hoàn thành" hint="(tùy chọn)">
                  <ColSelect value={colNgayhoanthanh} onChange={setColNgayhoanthanh} options={colOptions} />
                </Field>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}

          {/* ── Bước 3 ── */}
          {step === 3 && result && (
            <div className="space-y-2">
              <p className="text-green-700 font-semibold text-base">✅ Import hoàn tất!</p>
              <p className="text-sm text-gray-700">Nhập thành công: <strong className="text-green-700">{result.imported}</strong> kiến nghị</p>
              {result.skipped_dup > 0 && (
                <p className="text-sm text-orange-600">Bỏ qua trùng ID: <strong>{result.skipped_dup}</strong></p>
              )}
              {result.skipped_empty > 0 && (
                <p className="text-sm text-gray-500">Bỏ qua dòng không có nội dung: <strong>{result.skipped_empty}</strong></p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-between items-center shrink-0">
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            onClick={step === 1 || step === 3 ? onClose : () => { setError(""); setStep((s) => s - 1) }}
          >
            {step === 3 ? "Đóng" : step === 1 ? "Hủy" : "← Quay lại"}
          </button>
          <div className="flex gap-2">
            {step === 1 && preview && (
              <button className="px-5 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => { setError(""); setStep(2) }}>
                Tiếp theo →
              </button>
            )}
            {step === 2 && (
              <button
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
                onClick={handleImport}
              >
                {loading ? "Đang import..." : "Bắt đầu Import →"}
              </button>
            )}
            {step === 3 && (
              <button className="px-5 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={onDone}>
                ✓ Xong
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
