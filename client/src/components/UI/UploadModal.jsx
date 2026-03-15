import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../utils/api.js'
import './UploadModal.css'

export default function UploadModal({ onClose, onSuccess }) {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0]
    if (!file) return
    setStatus('uploading')
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      setResult(data)
      setStatus('success')
    } catch (err) {
      setError(err.message || 'Upload failed')
      setStatus('error')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: status === 'uploading',
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Upload CSV Dataset</h2>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal__body">
          {status === 'idle' && (
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}>
              <input {...getInputProps()} />
              <Upload size={32} color="var(--accent)" />
              <p className="dropzone__title">Drop your CSV here</p>
              <p className="dropzone__sub">or click to browse · max 50 MB</p>
            </div>
          )}

          {status === 'uploading' && (
            <div className="upload-status">
              <div className="spinner" />
              <p>Importing dataset…</p>
              <p className="upload-status__sub">Inferring types and inserting rows</p>
            </div>
          )}

          {status === 'success' && result && (
            <div className="upload-status">
              <CheckCircle size={40} color="var(--success)" />
              <p className="upload-status__title">Dataset Ready!</p>
              <div className="upload-result">
                <div className="upload-result__row"><span>Table</span><code>{result.tableName}</code></div>
                <div className="upload-result__row"><span>Rows</span><strong>{result.rowCount?.toLocaleString()}</strong></div>
                <div className="upload-result__row"><span>Columns</span><strong>{result.columns?.length}</strong></div>
              </div>
              <div className="upload-cols">
                {result.columns?.map(c => (
                  <span key={c.name} className="col-badge">{c.name} <em>{c.type}</em></span>
                ))}
              </div>
              <button className="btn-primary" onClick={() => onSuccess(result)}>Start Querying</button>
            </div>
          )}

          {status === 'error' && (
            <div className="upload-status">
              <AlertCircle size={40} color="var(--danger)" />
              <p className="upload-status__title">Upload Failed</p>
              <p className="upload-status__sub">{error}</p>
              <button className="btn-secondary" onClick={() => setStatus('idle')}>Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
