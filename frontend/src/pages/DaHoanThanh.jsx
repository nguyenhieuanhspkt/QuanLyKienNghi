import { useEffect, useState } from "react"
import { api } from "../api"

export default function DaHoanThanh({ refreshKey }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const items = await api.getDanhSach(true)
      setData(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [refreshKey])

  async function handleHoiPhuc(id) {
    if (!window.confirm("Khôi phục kiến nghị này về chưa hoàn thành?")) return
    await api.update(id, { hoan_thanh: false, ngay_hoan_thanh: null })
    load()
  }

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">
          Kiến nghị đã hoàn thành
          <span className="ml-2 text-sm font-normal text-gray-500">({data.length} mục)</span>
        </h2>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Chưa có kiến nghị nào đã hoàn thành.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 text-left w-[100px]">Mã KN</th>
                <th className="px-3 py-3 text-left w-[90px]">Đơn vị</th>
                <th className="px-3 py-3 text-left">Nội dung</th>
                <th className="px-3 py-3 text-left w-[160px]">Xử lý tuần này</th>
                <th className="px-3 py-3 text-left w-[100px]">Phát sinh</th>
                <th className="px-3 py-3 text-left w-[110px]">Ngày HT</th>
                <th className="px-3 py-3 text-left w-[110px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((kn, idx) => (
                <tr key={kn.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-3 font-mono text-xs text-gray-500">{kn.id}</td>
                  <td className="px-3 py-3 font-medium text-gray-700">{kn.don_vi}</td>
                  <td className="px-3 py-3 text-gray-800 max-w-[240px]">
                    <p className="line-clamp-3 whitespace-pre-wrap">{kn.noi_dung}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 max-w-[160px]">
                    <p className="line-clamp-3 whitespace-pre-wrap">{kn.tuan_nay || "—"}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{kn.tuan_phat_sinh}</td>
                  <td className="px-3 py-3 text-xs font-medium text-green-700">{kn.ngay_hoan_thanh || "—"}</td>
                  <td className="px-3 py-3">
                    <button className="btn-ghost text-orange-600 hover:bg-orange-50 text-left"
                      onClick={() => handleHoiPhuc(kn.id)}>
                      ↩ Khôi phục
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
