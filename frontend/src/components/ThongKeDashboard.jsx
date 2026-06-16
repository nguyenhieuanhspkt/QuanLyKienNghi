import { useEffect, useState } from "react"
import { api } from "../api"

function SummaryCard({ label, count, textColor = "text-gray-800", borderColor = "border-gray-200" }) {
  return (
    <div className={`bg-white rounded-lg border ${borderColor} p-3 text-center`}>
      <p className={`text-2xl font-bold ${textColor}`}>{count ?? 0}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function StatusCard({ label, count, textColor = "text-gray-700", borderColor = "border-gray-200" }) {
  return (
    <div className={`bg-white rounded-lg border ${borderColor} p-3 text-center`}>
      <p className={`text-xl font-bold ${textColor}`}>{count ?? 0}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

const THOI_HAN = [
  { key: "duoi_1_thang", label: "< 1 tháng",   bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
  { key: "2_3_thang",    label: "2–3 tháng",    bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  { key: "3_6_thang",    label: "3–6 tháng",    bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  { key: "tren_6_thang", label: "> 6 tháng",    bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700"    },
  { key: "chua_co_han",  label: "Chưa có hạn",  bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-500"   },
]

export default function ThongKeDashboard({ refreshKey }) {
  const [tk, setTk] = useState(null)

  useEffect(() => {
    api.thongKe().then(setTk).catch(() => {})
  }, [refreshKey])

  if (!tk) return null

  const tt  = tk.theo_trang_thai          || {}
  const cvt = tk.cho_vat_tu_theo_thoi_han || {}

  return (
    <div className="space-y-3 mb-5">

      {/* Tổng quan */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Tổng kiến nghị"  count={tk.tong}            textColor="text-gray-800"   borderColor="border-gray-200"  />
        <SummaryCard label="Chưa hoàn thành" count={tk.chua_hoan_thanh} textColor="text-red-600"    borderColor="border-red-200"   />
        <SummaryCard label="Đã hoàn thành"   count={tk.da_hoan_thanh}   textColor="text-green-600"  borderColor="border-green-200" />
      </div>

      {/* Trạng thái đơn */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusCard label="P.KTAT đang lên phiếu" count={tt.phong_ktat_len_phieu || 0} textColor="text-yellow-700" borderColor="border-yellow-200" />
        <StatusCard label="Đã sửa chữa, theo dõi" count={tt.da_sua_chua_theo_doi  || 0} textColor="text-blue-700"   borderColor="border-blue-200"   />
        <StatusCard label="KTAT đã có PYC"         count={tt.ktat_co_pyc           || 0} textColor="text-purple-700" borderColor="border-purple-200" />
        <StatusCard label="Đã cấp vật tư"          count={tt.da_cap_vat_tu         || 0} textColor="text-teal-700"   borderColor="border-teal-200"   />
      </div>

      {/* Nested card — Đợi cấp vật tư */}
      <div className="bg-white rounded-lg border border-red-200 p-3">
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="text-sm font-semibold text-red-700">Đợi cấp vật tư</p>
          <p className="text-2xl font-bold text-red-700">{tt.cho_vat_tu || 0}</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {THOI_HAN.map(({ key, label, bg, border, text }) => (
            <div key={key} className={`rounded-md border ${border} ${bg} p-2 text-center`}>
              <p className={`text-lg font-bold ${text}`}>{cvt[key] || 0}</p>
              <p className={`text-xs mt-0.5 leading-tight ${text} opacity-90`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
