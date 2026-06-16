import { useState, useRef } from "react"
import { api } from "../api"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DON_VI_COLORS = {
  PXVH: "bg-blue-100 text-blue-700",
  PXNL: "bg-orange-100 text-orange-700",
  PKT:  "bg-purple-100 text-purple-700",
}

function DonViBadge({ donVi }) {
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${DON_VI_COLORS[donVi] || "bg-gray-100 text-gray-700"}`}>
      {donVi}
    </span>
  )
}

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 75 ? "text-green-700" : pct >= 45 ? "text-yellow-700" : "text-gray-500"
  return <span className={`text-xs font-semibold ${color}`}>{pct}%</span>
}

function ActionBtn({ active, variant, onClick, children }) {
  const base = "px-3 py-1.5 text-xs font-medium rounded border transition-colors"
  const styles = {
    green: active ? "bg-green-600 text-white border-green-600" : "bg-white text-green-700 border-green-300 hover:bg-green-50",
    blue:  active ? "bg-blue-600 text-white border-blue-600"   : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50",
    gray:  active ? "bg-gray-500 text-white border-gray-500"   : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50",
  }
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick}>
      {children}
    </button>
  )
}

function TuanNayMoiBlock({ tuanNayMoi, ketQuaKhvt }) {
  const [expanded, setExpanded] = useState(false)
  if (!tuanNayMoi && !ketQuaKhvt) return null
  const isLong = (tuanNayMoi || "").length > 200
  return (
    <div className="mt-2 rounded bg-gray-50 border border-gray-200 text-xs text-gray-600">
      <div className={`p-2 whitespace-pre-wrap font-mono ${!expanded && isLong ? "max-h-20 overflow-hidden" : ""}`}>
        {tuanNayMoi || "—"}
      </div>
      {isLong && (
        <button
          className="w-full text-center text-xs text-blue-500 hover:text-blue-700 py-1 border-t border-gray-200"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? "Thu gọn ▲" : "Xem đầy đủ ▼"}
        </button>
      )}
      {ketQuaKhvt && (
        <div className="px-2 pb-2 pt-1 border-t border-gray-200 text-green-700 font-medium">
          ✅ Kết quả KHVT: {ketQuaKhvt}
        </div>
      )}
    </div>
  )
}

// ─── KN Search Input ─────────────────────────────────────────────────────────
// Tìm KN theo nội dung — user gõ chữ, app gợi ý danh sách KN khớp

function KNSearchInput({ allKN, selectedKnId, onSelect, placeholder = "Gõ để tìm KN theo nội dung..." }) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef()

  const selectedKN = allKN?.find(kn => kn.id === selectedKnId)

  const results = query.length >= 2
    ? (allKN || [])
        .filter(kn => kn.noi_dung.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (a.hoan_thanh === b.hoan_thanh ? 0 : a.hoan_thanh ? 1 : -1))
        .slice(0, 8)
    : []

  function handleClear() {
    onSelect(null)
    setQuery("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="relative">
      {selectedKN ? (
        // Đang có KN được chọn → hiển thị dạng chip
        <div className={`flex items-start gap-2 p-2 rounded text-xs border
          ${selectedKN.hoan_thanh
            ? "bg-amber-50 border-amber-300"
            : "bg-blue-50 border-blue-300"}`}>
          <span className="font-mono font-bold text-blue-700 flex-shrink-0 mt-0.5">{selectedKN.id}</span>
          {selectedKN.hoan_thanh && (
            <span className="bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded text-xs flex-shrink-0 font-medium">
              Đã HT → sẽ kích hoạt lại
            </span>
          )}
          <span className="text-gray-700 flex-1 leading-relaxed">{selectedKN.noi_dung}</span>
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-1 text-sm leading-none"
          >✕</button>
        </div>
      ) : (
        // Chưa chọn → hiện ô tìm kiếm
        <input
          ref={inputRef}
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400 placeholder-gray-400"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      )}

      {/* Dropdown kết quả */}
      {open && !selectedKN && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
          {results.length > 0 ? (
            <div className="max-h-52 overflow-y-auto">
              {results.map(kn => (
                <div
                  key={kn.id}
                  className={`flex items-start gap-2 px-3 py-2 cursor-pointer text-xs border-b border-gray-100 last:border-0
                    ${kn.hoan_thanh ? "hover:bg-amber-50" : "hover:bg-blue-50"}`}
                  onMouseDown={() => { onSelect(kn.id); setQuery(""); setOpen(false) }}
                >
                  <span className="font-mono font-bold text-blue-600 flex-shrink-0 mt-0.5">{kn.id}</span>
                  {kn.hoan_thanh && (
                    <span className="bg-amber-100 text-amber-700 border border-amber-200 px-1 py-0.5 rounded text-xs flex-shrink-0 whitespace-nowrap">
                      Đã HT
                    </span>
                  )}
                  <span className={`leading-relaxed ${kn.hoan_thanh ? "text-gray-400" : "text-gray-700"}`}>
                    {kn.noi_dung}
                  </span>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="px-3 py-2.5 text-xs text-gray-400 italic">
              Không tìm thấy KN nào khớp với &ldquo;{query}&rdquo;
            </div>
          ) : query.length > 0 ? (
            <div className="px-3 py-2.5 text-xs text-gray-400">Gõ ít nhất 2 ký tự...</div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─── ChacChan Card ────────────────────────────────────────────────────────────

function ChacChanCard({ item, act, allKN, onSetAction }) {
  const [showSearch, setShowSearch] = useState(false)

  // KN hiện đang được chọn (có thể khác với auto-match nếu user tìm lại)
  const isAutoMatch = act?.kn_id === item.match?.kn_id
  const customSelectedKN = !isAutoMatch && act?.kn_id ? allKN?.find(kn => kn.id === act.kn_id) : null

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <div className="flex items-start gap-2 mb-1">
        <DonViBadge donVi={item.don_vi} />
        <p className="text-sm font-medium text-gray-800 flex-1">{item.noi_dung_word}</p>
      </div>
      <TuanNayMoiBlock tuanNayMoi={item.tuan_nay_moi} ketQuaKhvt={item.ket_qua_khvt} />

      {/* KN auto-match */}
      {isAutoMatch && (
        <div className="mt-3 p-2.5 bg-white rounded border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-green-700">🎯 Khớp với:</span>
            <span className="text-xs font-mono font-bold text-gray-700">{item.match.kn_id}</span>
            <ScoreBadge score={item.match.score} />
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{item.match.noi_dung}</p>
          {item.match.tuan_nay_hien_tai && (
            <p className="text-xs text-gray-400 mt-1 italic">Tuần này: {item.match.tuan_nay_hien_tai}</p>
          )}
        </div>
      )}

      {/* KN được chọn thay thế qua tìm kiếm */}
      {customSelectedKN && (
        <div className="mt-3 p-2.5 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-blue-700">🔗 Đã chọn:</span>
            <span className="text-xs font-mono font-bold text-gray-700">{customSelectedKN.id}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{customSelectedKN.noi_dung}</p>
        </div>
      )}

      {/* Tìm KN khác */}
      {showSearch && (
        <div className="mt-3">
          <KNSearchInput
            allKN={allKN}
            selectedKnId={!isAutoMatch ? act?.kn_id : null}
            onSelect={knId => {
              if (knId) onSetAction({ action: "merge", kn_id: knId })
              else onSetAction({ action: "merge", kn_id: item.match.kn_id })
              setShowSearch(false)
            }}
            placeholder="Tìm KN khác theo nội dung..."
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <ActionBtn variant="green" active={act?.action === "merge"}
          onClick={() => { onSetAction({ action: "merge", kn_id: act?.kn_id || item.match.kn_id }); setShowSearch(false) }}>
          ✅ Merge
        </ActionBtn>
        <ActionBtn variant="blue" active={act?.action === "tao_moi"}
          onClick={() => { onSetAction({ action: "tao_moi", kn_id: null }); setShowSearch(false) }}>
          ➕ Tạo mới
        </ActionBtn>
        <ActionBtn variant="gray" active={act?.action === "skip"}
          onClick={() => { onSetAction({ action: "skip", kn_id: null }); setShowSearch(false) }}>
          ⏭ Bỏ qua
        </ActionBtn>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors
            ${showSearch ? "bg-gray-100 border-gray-400 text-gray-700" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}
          onClick={() => setShowSearch(s => !s)}
        >
          🔍 Chọn KN khác
        </button>
      </div>
    </div>
  )
}

// ─── KhongChac Card ──────────────────────────────────────────────────────────

function KhongChacCard({ item, act, allKN, onSetAction }) {
  const top3Ids = new Set((item.top3_matches || []).map(m => m.kn_id))
  const isCustomSelected = act?.action === "merge" && act?.kn_id && !top3Ids.has(act?.kn_id)

  function selectKn(knId) {
    onSetAction({ action: "merge", kn_id: knId })
  }

  return (
    <div className="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
      <div className="flex items-start gap-2 mb-1">
        <DonViBadge donVi={item.don_vi} />
        <p className="text-sm font-medium text-gray-800 flex-1">{item.noi_dung_word}</p>
        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-medium flex-shrink-0">
          Cần chọn
        </span>
      </div>
      <TuanNayMoiBlock tuanNayMoi={item.tuan_nay_moi} ketQuaKhvt={item.ket_qua_khvt} />

      <div className="mt-3 space-y-1.5">
        <p className="text-xs text-yellow-800 font-semibold mb-2">Chọn KN phù hợp:</p>

        {/* Top 3 gợi ý */}
        {(item.top3_matches || []).map(m => {
          const isSelected = act?.action === "merge" && act?.kn_id === m.kn_id
          return (
            <div
              key={m.kn_id}
              className={`flex items-start gap-2 p-2 rounded cursor-pointer text-xs transition-colors
                ${isSelected
                  ? "bg-yellow-200 border border-yellow-500"
                  : "bg-white border border-gray-200 hover:bg-yellow-100 hover:border-yellow-300"}`}
              onClick={() => selectKn(m.kn_id)}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 flex-shrink-0
                ${isSelected ? "border-yellow-600 bg-yellow-600" : "border-gray-300 bg-white"}`}
              />
              <span className="font-mono font-bold text-gray-700 flex-shrink-0">{m.kn_id}</span>
              <span className="text-gray-600 flex-1 leading-relaxed">{m.noi_dung}</span>
              <ScoreBadge score={m.score} />
            </div>
          )
        })}

        {/* Tìm KN theo nội dung */}
        <div className={`p-2 rounded border text-xs transition-colors
          ${isCustomSelected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"}`}>
          <p className="text-gray-500 mb-1.5">
            {isCustomSelected ? "✅ Đã chọn từ tìm kiếm:" : "🔍 Hoặc tìm KN theo nội dung:"}
          </p>
          <KNSearchInput
            allKN={allKN}
            selectedKnId={isCustomSelected ? act.kn_id : null}
            onSelect={knId => {
              if (knId) selectKn(knId)
              else onSetAction({ action: "skip", kn_id: null })
            }}
            placeholder="Gõ từ khóa nội dung KN để tìm..."
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <ActionBtn variant="blue" active={act?.action === "tao_moi"}
          onClick={() => onSetAction({ action: "tao_moi", kn_id: null })}>
          ➕ Tạo mới
        </ActionBtn>
        <ActionBtn variant="gray" active={act?.action === "skip"}
          onClick={() => onSetAction({ action: "skip", kn_id: null })}>
          ⏭ Bỏ qua
        </ActionBtn>
      </div>
    </div>
  )
}

// ─── KhongKhop Card ──────────────────────────────────────────────────────────

function KhongKhopCard({ item, act, allKN, onSetAction }) {
  const selectedKN = act?.action === "merge" && act?.kn_id
    ? allKN?.find(kn => kn.id === act.kn_id)
    : null

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <div className="flex items-start gap-2 mb-1">
        <DonViBadge donVi={item.don_vi} />
        <p className="text-sm font-medium text-gray-800 flex-1">{item.noi_dung_word}</p>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium flex-shrink-0">
          Không khớp
        </span>
      </div>
      <TuanNayMoiBlock tuanNayMoi={item.tuan_nay_moi} ketQuaKhvt={item.ket_qua_khvt} />

      {/* Gán vào KN có sẵn — luôn hiển thị ô tìm kiếm */}
      <div className="mt-3">
        <p className="text-xs text-gray-600 mb-1.5">
          🔍 Gán vào KN có sẵn <span className="text-gray-400">(hoặc chọn "Tạo mới" bên dưới)</span>:
        </p>
        <KNSearchInput
          allKN={allKN}
          selectedKnId={act?.action === "merge" ? act?.kn_id : null}
          onSelect={knId => {
            if (knId) onSetAction({ action: "merge", kn_id: knId })
            else onSetAction({ action: "tao_moi", kn_id: null })
          }}
          placeholder="Gõ từ khóa nội dung KN để tìm và gán..."
        />
        {selectedKN && (
          <p className="text-xs text-blue-600 mt-1">
            ✅ Sẽ merge nội dung Word vào <strong>{selectedKN.id}</strong>
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <ActionBtn variant="blue" active={act?.action === "tao_moi"}
          onClick={() => onSetAction({ action: "tao_moi", kn_id: null })}>
          ➕ Tạo mới
        </ActionBtn>
        <ActionBtn variant="gray" active={act?.action === "skip"}
          onClick={() => onSetAction({ action: "skip", kn_id: null })}>
          ⏭ Bỏ qua
        </ActionBtn>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ImportWordModal({ onClose, onDone }) {
  const [stage, setStage] = useState("upload")
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState(null)
  const [allKN, setAllKN] = useState([])
  const [actions, setActions] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef()

  function initActions(data) {
    const acts = {}
    const add = (item, action, knId = null) => {
      acts[item.word_index] = {
        action,
        kn_id: knId,
        don_vi: item.don_vi,
        noi_dung_word: item.noi_dung_word,
        tuan_nay_moi: item.tuan_nay_moi,
        ket_qua_khvt: item.ket_qua_khvt,
      }
    }
    data.chac_chan.forEach(item => add(item, "merge", item.match.kn_id))
    data.khong_chac.forEach(item => add(item, "skip"))
    data.khong_khop.forEach(item => add(item, "tao_moi"))
    return acts
  }

  function setAction(wordIndex, updates) {
    setActions(prev => ({
      ...prev,
      [wordIndex]: { ...prev[wordIndex], ...updates },
    }))
  }

  async function handleAnalyze() {
    if (!file) { setError("Chưa chọn file .docx"); return }
    setLoading(true)
    setError("")
    try {
      const [wordData, knList] = await Promise.all([
        api.importWord(file),
        api.getDanhSach(),   // tất cả KN: cả chưa HT lẫn đã HT
      ])
      setPreview(wordData)
      setAllKN(knList)
      setActions(initActions(wordData))
      setStage("review")
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    const actList = Object.entries(actions)
      .filter(([, v]) => v.action !== "skip")
      .map(([wi, v]) => ({
        word_index: parseInt(wi),
        action: v.action,
        kn_id: v.action === "merge" ? v.kn_id : null,
        don_vi: v.don_vi,
        noi_dung_word: v.noi_dung_word,
        tuan_nay_moi: v.tuan_nay_moi,
        ket_qua_khvt: v.ket_qua_khvt,
      }))

    const invalidMerge = actList.filter(a => a.action === "merge" && !a.kn_id)
    if (invalidMerge.length > 0) {
      setError(`${invalidMerge.length} mục chọn "Merge" nhưng chưa chọn KN. Vui lòng chọn KN hoặc đổi sang "Tạo mới".`)
      return
    }

    setSubmitting(true)
    setError("")
    try {
      const res = await api.importWordXacNhan({ actions: actList })
      setResult(res)
      setStage("done")
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith(".docx")) { setFile(f); setError("") }
    else setError("Chỉ hỗ trợ file .docx")
  }

  const skipCount = Object.values(actions).filter(v => v.action === "skip").length
  const pendingKhongChac = preview?.khong_chac.filter(
    item => actions[item.word_index]?.action === "skip"
  ).length ?? 0
  const totalItems = preview
    ? preview.chac_chan.length + preview.khong_chac.length + preview.khong_khop.length
    : 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-800">📄 Import Word — Báo cáo KHVT</h2>
            {stage === "review" && (
              <p className="text-xs text-gray-500 mt-0.5">{totalItems} tồn tại từ Word · {file?.name}</p>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-600 text-xl leading-none" onClick={onClose}>✕</button>
        </div>

        <div className="p-6">
          {/* ── Stage: upload ─────────────────────────────────────── */}
          {stage === "upload" && (
            <div className="max-w-md mx-auto">
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                  ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"}`}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-4xl mb-3">📄</div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-blue-700">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Click để chọn file khác</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Kéo thả file Word vào đây</p>
                    <p className="text-xs text-gray-400 mt-1">hoặc click để chọn file · Chỉ hỗ trợ .docx</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0]
                    if (f) { setFile(f); setError("") }
                    e.target.value = ""
                  }}
                />
              </div>

              {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  onClick={onClose}
                >Hủy</button>
                <button
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                  disabled={!file || loading}
                  onClick={handleAnalyze}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Đang đọc và so khớp...
                    </>
                  ) : "🔍 Phân tích file"}
                </button>
              </div>
            </div>
          )}

          {/* ── Stage: review ─────────────────────────────────────── */}
          {stage === "review" && preview && (
            <div>
              {/* Summary bar */}
              <div className="flex flex-wrap gap-4 mb-5 p-3 bg-gray-50 rounded-lg text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                  <strong>{preview.chac_chan.length}</strong> khớp chắc chắn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
                  <strong>{preview.khong_chac.length}</strong> không chắc
                  {pendingKhongChac > 0 && (
                    <span className="text-yellow-600 font-semibold">({pendingKhongChac} chưa chọn)</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"/>
                  <strong>{preview.khong_khop.length}</strong> không khớp
                </span>
                {skipCount > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
                    {skipCount} bỏ qua
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {preview.chac_chan.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"/>
                      Khớp chắc chắn ({preview.chac_chan.length})
                    </h3>
                    <div className="space-y-3">
                      {preview.chac_chan.map(item => (
                        <ChacChanCard key={item.word_index} item={item}
                          act={actions[item.word_index]} allKN={allKN}
                          onSetAction={u => setAction(item.word_index, u)} />
                      ))}
                    </div>
                  </section>
                )}

                {preview.khong_chac.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"/>
                      Không chắc — cần chọn ({preview.khong_chac.length})
                    </h3>
                    <div className="space-y-3">
                      {preview.khong_chac.map(item => (
                        <KhongChacCard key={item.word_index} item={item}
                          act={actions[item.word_index]} allKN={allKN}
                          onSetAction={u => setAction(item.word_index, u)} />
                      ))}
                    </div>
                  </section>
                )}

                {preview.khong_khop.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"/>
                      Không khớp ({preview.khong_khop.length})
                    </h3>
                    <div className="space-y-3">
                      {preview.khong_khop.map(item => (
                        <KhongKhopCard key={item.word_index} item={item}
                          act={actions[item.word_index]} allKN={allKN}
                          onSetAction={u => setAction(item.word_index, u)} />
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-xs text-gray-500">
                  {pendingKhongChac > 0 && (
                    <span className="text-yellow-600">
                      ⚠️ {pendingKhongChac} mục "Không chắc" chưa chọn — sẽ bỏ qua khi xác nhận
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => setStage("upload")}
                  >← Quay lại</button>
                  <button
                    className="px-5 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Đang lưu..." : "✅ Xác nhận import"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Stage: done ───────────────────────────────────────── */}
          {stage === "done" && result && (
            <div className="py-10 text-center">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-base font-semibold text-gray-800 mb-1">Import hoàn tất!</p>
              <p className="text-sm text-gray-600">{result.message}</p>
              <div className="mt-6">
                <button
                  className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={onDone}
                >Đóng và làm mới</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
