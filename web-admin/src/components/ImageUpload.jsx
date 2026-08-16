import { useState, useRef } from 'react'
import { uploadImage } from '../api.js'

export default function ImageUpload({ value, onChange, placeholder = 'https://...' }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await uploadImage(file)
      onChange(data.full_url)
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          className="btn-ghost flex-shrink-0 flex items-center gap-1.5 text-xs whitespace-nowrap disabled:opacity-50"
        >
          {uploading
            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          }
          {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <img
          src={value}
          alt=""
          className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-gray-50"
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
    </div>
  )
}
