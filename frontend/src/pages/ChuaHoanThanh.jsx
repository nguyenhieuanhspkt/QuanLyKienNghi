import { useEffect, useState } from "react"
import { api } from "../api"
import TrangThaiBadge from "../components/TrangThaiBadge"
import KienNghiForm from "../components/KienNghiForm"

export default function ChuaHoanThanh({ refreshKey }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const items = await api.getDanhSach(false)
      setData(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [refreshKey])

  async function handleHoanThanh(id) {
    const hom_nay = new Date()
    const ngay = `${String(hom_nay.getDate()).padStart(2,"0")}/${String(hom_nay.getMonth()+1).padStart(2,"0")}/${hom_nay.getFullYear()}`
    await api.update(id, { hoan_thanh: true, ngay_hoan_thanh: ngay })
    setConfirmId(null)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm("Xóa kiến nghị này?")) return
    await api.delete(id)
    load()
  }

  function openEdit(item) {
    setEditing(item)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">
          Kiến nghị chưa hoàn thành
          <span className="ml-2 text-sm font-normal text-gray-500">({data.length} mục)</span>
        </h2>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Thêm kiến nghị
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Chưa có kiến nghị nào.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 text-left w-[100px]">Mã KN</th>
                <th className="px-3 py-3 text-left w-[90px]">Đơn vị</th>
                <th className="px-3 py-3 text-left">Nội dung</th>
                <th className="px-3 py-3 text-left w-[160px]">Tuần trước</th>
                <th className="px-3 py-3 text-left w-[160px]">Tuần này</th>
                <th className="px-3 py-3 text-left w-[160px]">Trạng thái</th>
                <th className="px-3 py-3 text-left w-[100px]">Phát sinh</th>
                <th className="px-3 py-3 text-left w-[130px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((kn, idx) => (
                <tr key={kn.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-3 font-mono text-xs text-gray-500">{kn.id}</td>
                  <td className="px-3 py-3 font-medium text-gray-700">{kn.don_vi}</td>
                  <td className="px-3 py-3 text-gray-800 max-w-[220px]">
                    <p className="line-clamp-3 whitespace-pre-wrap">{kn.noi_dung}</p>
                  </td>
                  <td className="px-3 py-3 text-gray-600 max-w-[160px]">
                    <p className="line-clamp-3 whitespace-pre-wrap text-xs">{kn.tuan_truoc || "—"}</p>
                  </td>
                  <td className="px-3 py-3 text-gray-600 max-w-[160px]">
                    <p className="line-clamp-3 whitespace-pre-wrap text-xs">{kn.tuan_nay || "—"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <TrangThaiBadge trangThai={kn.trang_thai} thoiHanVt={kn.thoi_han_vt} />
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{kn.tuan_phat_sinh}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <button className="btn-ghost text-left" onClick={() => openEdit(kn)}>✏️ Sửa</button>
                      {confirmId === kn.id ? (
                        <div className="flex gap-1">
                          <button className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            onClick={() => handleHoanThanh(kn.id)}>Xác nhận</button>
                          <button className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                            onClick={() => setConfirmId(null)}>Hủy</button>
                        </div>
                      ) : (
                        <button className="btn-ghost text-left text-green-700 hover:bg-green-50"
                          onClick={() => setConfirmId(kn.id)}>✅ Hoàn thành</button>
                      )}
                      <button className="btn-danger text-left" onClick={() => handleDelete(kn.id)}>🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <KienNghiForm
          item={editing}
          onClose={closeForm}
          onSaved={() => { closeForm(); load() }}
        />
      )}
    </div>
  )
}
