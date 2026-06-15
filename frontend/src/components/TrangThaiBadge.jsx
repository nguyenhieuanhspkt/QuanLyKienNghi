import { TRANG_THAI, TRANG_THAI_COLOR, THOI_HAN_VT } from "../constants"

export default function TrangThaiBadge({ trangThai, thoiHanVt }) {
  const label = TRANG_THAI[trangThai] || trangThai
  const color = TRANG_THAI_COLOR[trangThai] || "bg-gray-100 text-gray-700"
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {label}
      </span>
      {trangThai === "cho_vat_tu" && thoiHanVt && (
        <span className="text-xs text-gray-500">{THOI_HAN_VT[thoiHanVt] || thoiHanVt}</span>
      )}
    </div>
  )
}
