import { useEffect, useState } from "react"
import { api } from "../api"

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

export default function ThongKePage({ refreshKey }) {
  const [tk, setTk] = useState(null)

  useEffect(() => {
    api.thongKe().then(setTk).catch(() => {})
  }, [refreshKey])

  if (!tk) return <p className="text-sm text-gray-400 mt-6 text-center">Đang tải...</p>

  const tt  = tk.theo_trang_thai          || {}
  const cvt = tk.cho_vat_tu_theo_thoi_han || {}

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

          {/* Row 1: Hoàn thành */}
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

          {/* Row 2.1 */}
          <tr>
            <td className={TNUM}>2.1</td>
            <td className={TD}>Phòng KTAT đang lên phiếu yêu cầu</td>
            <td className={TCNT}>{tt.phong_ktat_len_phieu || 0}</td>
          </tr>

          {/* Row 2.2 — ktat_co_pyc (mới) */}
          <tr>
            <td className={TNUM}>2.2</td>
            <td className={TD}>KTAT đã có PYC, chờ KHVT tiếp nhận</td>
            <td className={TCNT}>{tt.ktat_co_pyc || 0}</td>
          </tr>

          {/* Row 2.3 */}
          <tr>
            <td className={TNUM}>2.3</td>
            <td className={TD}>Đã sửa chữa, hiện đang theo dõi thông số</td>
            <td className={TCNT}>{tt.da_sua_chua_theo_doi || 0}</td>
          </tr>

          {/* Row 2.4 */}
          <tr>
            <td className={TNUM}>2.4</td>
            <td className={TD}>Đã cấp vật tư</td>
            <td className={TCNT}>{tt.da_cap_vat_tu || 0}</td>
          </tr>

          {/* Row 2.5 — Đợi cấp vật tư (nested cards) */}
          <tr>
            <td className={TNUM}>2.5</td>
            <td className={`${TD}`} colSpan={2}>
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="font-semibold">Đợi cấp vật tư + thời gian dự kiến cấp</span>
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

        </tbody>
      </table>
    </div>
  )
}
