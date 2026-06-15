import { useEffect, useState } from "react"
import { DON_VI, TRANG_THAI, THOI_HAN_VT } from "../constants"
import { api } from "../api"

const EMPTY = {
  don_vi: DON_VI[0],
  noi_dung: "",
  tuan_truoc: "",
  tuan_nay: "",
  trang_thai: "phong_ktat_len_phieu",
  thoi_han_vt: null,
  tuan_phat_sinh: "",
}

function tuanHienTai() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
  return `Tuần ${week}/${now.getFullYear()}`
}

export default function KienNghiForm({ item, onClose, onSaved }) {
  const isEdit = !!item
  const [form, setForm] = useState(
    isEdit
      ? { ...item }
      : { ...EMPTY, tuan_phat_sinh: tuanHienTai() }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.noi_dung.trim()) { setError("Vui lòng nhập nội dung kiến nghị"); return }
    setLoading(true)
    setError("")
    try {
      if (isEdit) {
        await api.update(item.id, form)
      } else {
        await api.create(form)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? `Sửa kiến nghị ${item.id}` : "Thêm kiến nghị mới"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Đơn vị + Tuần phát sinh */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Đơn vị</label>
              <select className="input" value={form.don_vi} onChange={(e) => set("don_vi", e.target.value)}>
                {DON_VI.map((dv) => <option key={dv}>{dv}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tuần phát sinh</label>
              <input className="input" value={form.tuan_phat_sinh}
                onChange={(e) => set("tuan_phat_sinh", e.target.value)}
                placeholder="Tuần 24/2026" />
            </div>
          </div>

          {/* Nội dung */}
          <div>
            <label className="label">Nội dung kiến nghị <span className="text-red-500">*</span></label>
            <textarea className="input min-h-[80px]" value={form.noi_dung}
              onChange={(e) => set("noi_dung", e.target.value)}
              placeholder="Mô tả kiến nghị..." />
          </div>

          {/* Xử lý tuần trước */}
          <div>
            <label className="label">Xử lý tuần trước</label>
            <textarea className="input min-h-[64px]" value={form.tuan_truoc}
              onChange={(e) => set("tuan_truoc", e.target.value)} />
          </div>

          {/* Cập nhật tuần này */}
          <div>
            <label className="label">Cập nhật tuần này</label>
            <textarea className="input min-h-[64px]" value={form.tuan_nay}
              onChange={(e) => set("tuan_nay", e.target.value)} />
          </div>

          {/* Trạng thái */}
          <div>
            <label className="label">Trạng thái</label>
            <select className="input" value={form.trang_thai} onChange={(e) => set("trang_thai", e.target.value)}>
              {Object.entries(TRANG_THAI).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Thời hạn vật tư – chỉ hiện khi cho_vat_tu */}
          {form.trang_thai === "cho_vat_tu" && (
            <div>
              <label className="label">Thời hạn cấp vật tư</label>
              <select className="input" value={form.thoi_han_vt || ""}
                onChange={(e) => set("thoi_han_vt", e.target.value || null)}>
                <option value="">-- chọn --</option>
                {Object.entries(THOI_HAN_VT).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
