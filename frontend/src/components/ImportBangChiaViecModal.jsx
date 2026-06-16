import { useState } from "react"
import { api } from "../api"
import { TRANG_THAI } from "../constants"

export default function ImportBangChiaViecModal({ onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [reviews, setReviews] = useState([])
  const [saving, setSaving] = useState(false)

  async function handleImport() {
    if (!file) return
    setLoading(true)
    try {
      const res = await api.importBangChiaViec(file)
      setResult(res)
      setReviews(
        res.items.map((item) => ({
          id: item.id,
          don_vi: item.don_vi,
          noi_dung: item.noi_dung,
          tuan_nay: item.tuan_nay,
          trang_thai: item.trang_thai,
          hoan_thanh: false,
        }))
      )
    } catch (e) {
      alert("Lỗi: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  function setReview(id, field, value) {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const today = new Date()
      const ngay = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
      await Promise.all(
        reviews.map((r) =>
          api.update(r.id, {
            trang_thai: r.trang_thai,
            hoan_thanh: r.hoan_thanh,
            ngay_hoan_thanh: r.hoan_thanh ? ngay : null,
          })
        )
      )
      onDone()
    } catch (e) {
      alert("Lỗi: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">
            Import kết quả bảng chia việc
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Chọn file Excel bảng chia việc đã được KTAT / KHVT điền vào cột{" "}
                <strong>Kết quả cập nhật</strong> (cột F).
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Đang import..." : "Import"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-green-700 font-medium mb-4">
                ✅ {result.message} — Duyệt trạng thái và hoàn thành bên dưới:
              </p>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Không có KN nào được cập nhật (cột F trống hoặc Mã KN không khớp).
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left w-28">Mã KN</th>
                        <th className="px-3 py-2 text-left w-16">Đơn vị</th>
                        <th className="px-3 py-2 text-left">Kết quả cập nhật</th>
                        <th className="px-3 py-2 text-left w-52">Trạng thái</th>
                        <th className="px-3 py-2 text-center w-24">Hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reviews.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                        >
                          <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.id}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {r.don_vi}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-700 whitespace-pre-wrap text-xs leading-relaxed max-w-xs">
                            {r.tuan_nay || (
                              <span className="text-gray-300 italic">Trống</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {r.hoan_thanh ? (
                              <span className="text-xs text-green-600 font-medium">Hoàn thành</span>
                            ) : (
                              <select
                                value={r.trang_thai}
                                onChange={(e) => setReview(r.id, "trang_thai", e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                              >
                                {Object.entries(TRANG_THAI).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={r.hoan_thanh}
                              onChange={(e) => setReview(r.id, "hoan_thanh", e.target.checked)}
                              className="w-4 h-4 accent-green-600 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {result && reviews.length === 0 ? "Đóng" : "Hủy"}
          </button>
          {result && reviews.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu kết quả duyệt"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
