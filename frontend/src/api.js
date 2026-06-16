const BASE = "/api/v1"

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || "Lỗi không xác định")
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getDanhSach: (hoanThanh) => {
    const q = hoanThanh !== undefined ? `?hoan_thanh=${hoanThanh}` : ""
    return request(`/kien-nghi${q}`)
  },
  getOne: (id) => request(`/kien-nghi/${id}`),
  create: (body) => request("/kien-nghi", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/kien-nghi/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => request(`/kien-nghi/${id}`, { method: "DELETE" }),
  capNhatTuanMoi: () => request("/cap-nhat-tuan-moi", { method: "POST" }),
  thongKe: () => request("/thong-ke"),
  previewExcel: async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/v1/preview-excel", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "Lỗi không xác định")
    }
    return res.json()
  },
  importExcel: async (file, mapping = null) => {
    const formData = new FormData()
    formData.append("file", file)
    if (mapping) formData.append("mapping", JSON.stringify(mapping))
    const res = await fetch("/api/v1/import-excel", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "Lỗi không xác định")
    }
    return res.json()
  },
  importWord: async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/v1/import-word", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "Lỗi không xác định")
    }
    return res.json()
  },
  importWordXacNhan: async (body) => {
    const res = await fetch("/api/v1/import-word/xac-nhan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "Lỗi không xác định")
    }
    return res.json()
  },
  importBangChiaViec: async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/v1/import-bang-chia-viec", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "Lỗi không xác định")
    }
    return res.json()
  },
  xuatBangChiaViec: async (body) => {
    const res = await fetch("/api/v1/xuat-bang-chia-viec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "Lỗi không xác định")
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const cd = res.headers.get("Content-Disposition") || ""
    const match = cd.match(/filename\*=UTF-8''(.+)/)
    a.download = match ? decodeURIComponent(match[1]) : "BangChiaViec.xlsx"
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  },
  xuatExcel: async () => {
    const res = await fetch("/api/v1/xuat-excel")
    if (!res.ok) throw new Error("Xuất Excel thất bại")
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const cd = res.headers.get("Content-Disposition") || ""
    const match = cd.match(/filename\*=UTF-8''(.+)/)
    a.download = match ? decodeURIComponent(match[1]) : "BaoCaoKienNghi.xlsx"
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  },
}
