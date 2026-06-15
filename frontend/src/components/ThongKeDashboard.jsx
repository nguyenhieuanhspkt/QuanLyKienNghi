import { useEffect, useState } from "react"
import { api } from "../api"
import { TRANG_THAI, TRANG_THAI_COLOR } from "../constants"

export default function ThongKeDashboard({ refreshKey }) {
  const [tk, setTk] = useState(null)

  useEffect(() => {
    api.thongKe().then(setTk).catch(() => {})
  }, [refreshKey])

  if (!tk) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
        <p className="text-2xl font-bold text-gray-800">{tk.chua_hoan_thanh}</p>
        <p className="text-xs text-gray-500 mt-0.5">Chưa hoàn thành</p>
      </div>
      <div className="bg-white rounded-lg border border-green-200 p-3 text-center">
        <p className="text-2xl font-bold text-green-700">{tk.da_hoan_thanh}</p>
        <p className="text-xs text-gray-500 mt-0.5">Đã hoàn thành</p>
      </div>
      {Object.entries(TRANG_THAI).map(([key, label]) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{tk.theo_trang_thai[key] || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
        </div>
      ))}
    </div>
  )
}
