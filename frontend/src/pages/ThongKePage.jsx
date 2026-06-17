import { useEffect, useState } from "react"
import { api } from "../api"
import { THOI_HAN_VT } from "../constants"

const THOI_HAN = [
  { key: "duoi_1_thang", label: "< 1 tháng",   bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
  { key: "2_3_thang",    label: "2–3 tháng",    bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  { key: "3_6_thang",    label: "3–6 tháng",    bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  { key: "tren_6_thang", label: "> 6 tháng",    bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700"    },
  { key: "chua_co_han",  label: "Chưa có hạn",  bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-500"   },
]

const TD   = "border border-gray-400 px-3 py-2 text-sm"
const TNUM = `${TD} text-center text-gray-500 w-14 whitespace-nowrap`
const TCNT = `${TD} text-center font-semibold w-16`

function KNDetailTable({ kns, showThoiHan = false }) {
  if (kns.length === 0)
    return <p className="text-xs text-gray-400 px-4 py-2 italic">Không có kiến nghị</p>
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-gray-100 text-gray-500 font-medium">
          <th className="px-3 py-1.5 text-left w-28">Mã KN</th>
          <th className="px-3 py-1.5 text-left w-16">Đơn vị</th>
          <th className="px-3 py-1.5 text-left">Nội dung kiến nghị</th>
          {showThoiHan && <th className="px-3 py-1.5 text-left w-28">Thời hạn</th>}
        </tr>
      </thead>
      <tbody>
        {kns.map((kn, i) => (
          <tr key={kn.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
            <td className="px-3 py-1.5 font-mono text-gray-400">{kn.id}</td>
            <td className="px-3 py-1.5">
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{kn.don_vi}</span>
            </td>
            <td className="px-3 py-1.5 text-gray-700 leading-relaxed">{kn.noi_dung}</td>
            {showThoiHan && (
              <td className="px-3 py-1.5 text-gray-500">
                {THOI_HAN_VT[kn.thoi_han_vt] || <span className="italic text-gray-300">—</span>}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ToggleIcon({ open }) {
  return (
    <span className={`inline-block mr-2 text-gray-400 transition-transform duration-150 ${open ? "rotate-90" : ""}`}>
      ▶
    </span>
  )
}

export default function ThongKePage({ refreshKey }) {
  const [tk, setTk]         = useState(null)
  const [kns, setKns]       = useState([])
  const [expanded, setExp]  = useState(new Set())

  useEffect(() => {
    api.thongKe().then(setTk).catch(() => {})
    api.getDanhSach(false).then(setKns).catch(() => {})
  }, [refreshKey])

  if (!tk) return <p className="text-sm text-gray-400 mt-6 text-center">Đang tải...</p>

  const tt  = tk.theo_trang_thai          || {}
  const cvt = tk.cho_vat_tu_theo_thoi_han || {}

  const byTT = {}
  for (const kn of kns) {
    if (!byTT[kn.trang_thai]) byTT[kn.trang_thai] = []
    byTT[kn.trang_thai].push(kn)
  }

  function toggle(key) {
    setExp(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function DetailRow({ groupKey, showThoiHan = false }) {
    if (!expanded.has(groupKey)) return null
    return (
      <tr>
        <td colSpan={3} className="border border-gray-400 p-0">
          <KNDetailTable kns={byTT[groupKey] || []} showThoiHan={showThoiHan} />
        </td>
      </tr>
    )
  }

  const ROWS = [
    { num: "2.1", key: "phong_ktat_len_phieu", label: "Phòng KTAT đang lên phiếu yêu cầu" },
    { num: "2.2", key: "ktat_co_pyc",           label: "KTAT đã có PYC, chờ KHVT tiếp nhận" },
    { num: "2.3", key: "da_sua_chua_theo_doi",  label: "Đã sửa chữa, hiện đang theo dõi thông số" },
    { num: "2.4", key: "da_cap_vat_tu",         label: "Đã cấp vật tư" },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Thống kê kiến nghị</h2>

      <table className="w-full border-collapse border border-gray-400 text-sm">
        <tbody>

          {/* Header: Tổng cộng */}
          <tr className="bg-gray-100">
            <td className={`${TD} font-bold`} colSpan={2}>Tổng cộng kiến nghị đầu tuần:</td>
            <td className={`${TCNT} font-bold text-gray-800`}>{tk.tong}</td>
          </tr>

          {/* Row 1: Hoàn thành — không expand (KN đã HT không load ở đây) */}
          <tr>
            <td className={TNUM}>1</td>
            <td className={`${TD} font-bold`}>Số kiến nghị hoàn thành trong tuần:</td>
            <td className={`${TCNT} text-green-700`}>{tk.da_hoan_thanh}</td>
          </tr>

          {/* Row 2: Chưa hoàn thành */}
          <tr>
            <td className={TNUM}>2</td>
            <td className={`${TD} font-bold`}>Số kiến nghị chưa hoàn thành, bao gồm:</td>
            <td className={`${TCNT} text-red-700`}>{tk.chua_hoan_thanh}</td>
          </tr>

          {/* Rows 2.1–2.4 */}
          {ROWS.map(({ num, key, label }) => (
            <>
              <tr
                key={key}
                className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                onClick={() => toggle(key)}
              >
                <td className={TNUM}>{num}</td>
                <td className={TD}>
                  <ToggleIcon open={expanded.has(key)} />
                  {label}
                </td>
                <td className={TCNT}>{tt[key] || 0}</td>
              </tr>
              <DetailRow key={key + "_detail"} groupKey={key} />
            </>
          ))}

          {/* Row 2.5 — Đợi cấp vật tư */}
          <tr
            className="cursor-pointer hover:bg-blue-50/40 transition-colors"
            onClick={() => toggle("cho_vat_tu")}
          >
            <td className={TNUM}>2.5</td>
            <td className={`${TD}`} colSpan={2}>
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="font-semibold">
                  <ToggleIcon open={expanded.has("cho_vat_tu")} />
                  Đợi cấp vật tư + thời gian dự kiến cấp
                </span>
                <span className="text-base font-bold text-red-700 ml-4">{tt.cho_vat_tu || 0}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {THOI_HAN.map(({ key, label, bg, border, text }) => (
                  <div key={key} className={`rounded-md border ${border} ${bg} p-2 text-center`}>
                    <p className={`text-lg font-bold ${text}`}>{cvt[key] || 0}</p>
                    <p className={`text-xs mt-0.5 leading-tight ${text} opacity-90`}>{label}</p>
                  </div>
                ))}
              </div>
            </td>
          </tr>
          {expanded.has("cho_vat_tu") && (
            <tr>
              <td colSpan={3} className="border border-gray-400 p-0">
                <KNDetailTable kns={byTT["cho_vat_tu"] || []} showThoiHan />
              </td>
            </tr>
          )}

        </tbody>
      </table>
    </div>
  )
}
