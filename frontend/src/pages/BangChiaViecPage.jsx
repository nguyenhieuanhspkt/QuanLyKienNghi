import { useState, useEffect } from "react"
import { api } from "../api"
import ImportBangChiaViecModal from "../components/ImportBangChiaViecModal"
import TrangThaiBadge from "../components/TrangThaiBadge"

const PHAN_CONG_OPTIONS = [
  { value: "KTAT", label: "P.KTAT" },
  { value: "KHVT", label: "P.KHVT" },
]

// Suy phân công mặc định từ trạng thái KN
function defaultPhanCong(trangThai) {
  return ["ktat_co_pyc", "cho_vat_tu"].includes(trangThai) ? "KHVT" : "KTAT"
}

export default function BangChiaViecPage({ refreshKey }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    load()
  }, [refreshKey])

  async function load() {
    setLoading(true)
    setResult(null)
    try {
      const list = await api.getDanhSach(false)
      setItems(
        list.map((kn) => ({
          kn,
          selected: true,
          phanCong: defaultPhanCong(kn.trang_thai),
          deleted: false,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  function toggle(id) {
    setItems((prev) =>
      prev.map((it) => (it.kn.id === id ? { ...it, selected: !it.selected } : it))
    )
  }

  function setPhanCong(id, val) {
    setItems((prev) =>
      prev.map((it) => (it.kn.id === id ? { ...it, phanCong: val } : it))
    )
  }

  function markDeleted(id) {
    setItems((prev) =>
      prev.map((it) => (it.kn.id === id ? { ...it, deleted: true } : it))
    )
  }

  function undoAllDeleted() {
    setItems((prev) => prev.map((it) => ({ ...it, deleted: false })))
  }

  async function handleXuat() {
    setExporting(true)
    setResult(null)
    try {
      const xuat = items
        .filter((it) => !it.deleted && it.selected)
        .map((it) => ({ id: it.kn.id, don_vi_phan_cong: it.phanCong }))
      const hoan_thanh = items
        .filter((it) => !it.deleted && !it.selected)
        .map((it) => it.kn.id)
      const xoa = items.filter((it) => it.deleted).map((it) => it.kn.id)

      await api.xuatBangChiaViec({ xuat, hoan_thanh, xoa })
      setResult({
        ok: true,
        msg: `Xuất thành công ${xuat.length} KN. Đã hoàn thành: ${hoan_thanh.length}. Đã xóa: ${xoa.length}.`,
      })
      load()
    } catch (e) {
      setResult({ ok: false, msg: e.message })
    } finally {
      setExporting(false)
    }
  }

  const visible = items.filter((it) => !it.deleted)
  const selectedCount = visible.filter((it) => it.selected).length
  const htCount = visible.filter((it) => !it.selected).length
  const xoaCount = items.filter((it) => it.deleted).length

  const q = query.trim().toLowerCase()
  const displayItems = q
    ? visible.filter((it) =>
        [it.kn.id, it.kn.don_vi, it.kn.noi_dung, it.kn.tuan_truoc]
          .some((f) => f && f.toLowerCase().includes(q))
      )
    : visible

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Đang tải...</div>
  }

  return (
    <div>
      {/* Tiêu đề + nút xuất */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Bảng chia việc</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Duyệt kiến nghị trước khi xuất Excel gửi P.KTAT / P.KHVT
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex gap-3 text-sm">
            <span className="text-blue-600 font-medium">📋 Xuất: {selectedCount}</span>
            <span className="text-green-600 font-medium">✅ Hoàn thành: {htCount}</span>
            {xoaCount > 0 && (
              <span className="text-red-500 font-medium">🗑 Xóa: {xoaCount}</span>
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 w-52"
          />
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-300 text-sm rounded font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap"
          >
            📥 Import kết quả
          </button>
          <button
            onClick={handleXuat}
            disabled={exporting || selectedCount === 0}
            className="px-5 py-2 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {exporting ? "Đang xuất..." : "📋 Xuất Excel bảng chia việc"}
          </button>
        </div>
      </div>

      {/* Thông báo kết quả */}
      {result && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            result.ok
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.ok ? "✅" : "❌"} {result.msg}
        </div>
      )}

      {/* Cảnh báo xóa */}
      {xoaCount > 0 && (
        <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
          <span>
            ⚠️ <strong>{xoaCount}</strong> kiến nghị sẽ bị{" "}
            <strong>xóa vĩnh viễn</strong> khi bấm Xuất Excel.
          </span>
          <button onClick={undoAllDeleted} className="underline ml-4 hover:text-red-800">
            Hoàn tác tất cả
          </button>
        </div>
      )}

      {/* Bảng */}
      {/* Legend */}
      <div className="mb-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-300"></span>
          Hàng vàng — P.KTAT điền
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-100 border border-blue-300"></span>
          Hàng xanh — P.KHVT điền
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <th className="px-3 py-3 text-center w-10">☑</th>
              <th className="px-3 py-3 text-left w-28">Mã KN</th>
              <th className="px-3 py-3 text-left w-20">Đơn vị</th>
              <th className="px-3 py-3 text-left">Nội dung kiến nghị</th>
              <th className="px-3 py-3 text-left w-60">Kết quả tuần trước</th>
              <th className="px-3 py-3 text-left w-48">Lý do phân công</th>
              <th className="px-3 py-3 text-center w-36">Phân công</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 italic">
                  {q ? "Không tìm thấy kiến nghị nào." : "Không có kiến nghị nào chưa hoàn thành."}
                </td>
              </tr>
            )}
            {displayItems.map((it) => (
              <tr
                key={it.kn.id}
                className={`border-b border-gray-100 transition-colors ${
                  !it.selected
                    ? "bg-green-50/60"
                    : it.phanCong === "KTAT"
                    ? "bg-yellow-50/60"
                    : "bg-blue-50/60"
                }`}
              >
                {/* Checkbox */}
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={it.selected}
                    onChange={() => toggle(it.kn.id)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </td>

                {/* Mã KN */}
                <td className="px-3 py-3 font-mono text-xs text-gray-500">{it.kn.id}</td>

                {/* Đơn vị */}
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {it.kn.don_vi}
                  </span>
                </td>

                {/* Nội dung */}
                <td className="px-3 py-3 text-gray-800 leading-relaxed">
                  {it.kn.noi_dung}
                </td>

                {/* Kết quả tuần trước */}
                <td className="px-3 py-3 text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                  {it.kn.tuan_truoc || (
                    <span className="italic text-gray-300">Chưa có</span>
                  )}
                </td>

                {/* Lý do phân công */}
                <td className="px-3 py-3">
                  <TrangThaiBadge trangThai={it.kn.trang_thai} thoiHanVt={it.kn.thoi_han_vt} />
                </td>

                {/* Phân công */}
                <td className="px-3 py-3 text-center">
                  {it.selected ? (
                    <select
                      value={it.phanCong}
                      onChange={(e) => setPhanCong(it.kn.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {PHAN_CONG_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">
                      → Hoàn thành
                    </span>
                  )}
                </td>

                {/* Xóa */}
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => markDeleted(it.kn.id)}
                    title="Xóa khỏi DB"
                    className="text-gray-300 hover:text-red-500 transition-colors text-base"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showImport && (
        <ImportBangChiaViecModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); load() }}
        />
      )}
    </div>
  )
}
