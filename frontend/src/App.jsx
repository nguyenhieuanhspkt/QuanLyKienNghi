import { useState } from "react"
import { BrowserRouter, NavLink, Routes, Route, Navigate } from "react-router-dom"
import ChuaHoanThanh from "./pages/ChuaHoanThanh"
import DaHoanThanh from "./pages/DaHoanThanh"
import ImportWizardModal from "./components/ImportWizardModal"
import { api } from "./api"

function ConfirmCapNhatTuan({ onClose, onDone }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")

  async function handle() {
    setLoading(true)
    try {
      const res = await api.capNhatTuanMoi()
      setResult(res.message)
    } catch (e) {
      setResult("Lỗi: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Cập nhật tuần mới</h2>
        {!result ? (
          <>
            <p className="text-sm text-gray-600 mb-1">
              Thao tác này sẽ chuyển toàn bộ nội dung <strong>Tuần này</strong> sang <strong>Tuần trước</strong>
              {" "}và xóa trắng cột Tuần này cho tất cả kiến nghị chưa hoàn thành.
            </p>
            <p className="text-sm text-orange-600 font-medium mb-4">Không thể hoàn tác. Chắc chắn tiếp tục?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-sm border rounded hover:bg-gray-50" onClick={onClose}>Hủy</button>
              <button
                className="px-5 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60"
                disabled={loading}
                onClick={handle}
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-green-700 font-medium mb-4">✅ {result}</p>
            <div className="flex justify-end">
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={onDone}>Đóng</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Layout() {
  const [showCapNhat, setShowCapNhat] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try { await api.xuatExcel() } catch (e) { alert(e.message) } finally { setExporting(false) }
  }

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded font-medium text-sm transition-colors ${
      isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`

  function handleDone() {
    setShowCapNhat(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <h1 className="text-lg font-bold text-blue-700 whitespace-nowrap">Quản Lý Kiến Nghị</h1>
          <nav className="flex gap-2 flex-1">
            <NavLink to="/chua-hoan-thanh" className={linkClass}>Chưa hoàn thành</NavLink>
            <NavLink to="/da-hoan-thanh" className={linkClass}>Đã hoàn thành</NavLink>
          </nav>
          <div className="flex gap-2">
            <button
              className="whitespace-nowrap px-4 py-2 text-sm rounded border border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => setShowImport(true)}
            >
              📤 Import Excel
            </button>
            <button
              className="whitespace-nowrap px-4 py-2 text-sm rounded border border-green-500 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-60"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Đang xuất..." : "📥 Xuất Excel"}
            </button>
            <button
              className="whitespace-nowrap px-4 py-2 text-sm rounded border border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors"
              onClick={() => setShowCapNhat(true)}
            >
              🔄 Cập nhật tuần mới
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/chua-hoan-thanh" replace />} />
          <Route path="/chua-hoan-thanh" element={<ChuaHoanThanh refreshKey={refreshKey} />} />
          <Route path="/da-hoan-thanh" element={<DaHoanThanh refreshKey={refreshKey} />} />
        </Routes>
      </main>
      {showCapNhat && (
        <ConfirmCapNhatTuan onClose={() => setShowCapNhat(false)} onDone={handleDone} />
      )}
      {showImport && (
        <ImportWizardModal
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); setRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
