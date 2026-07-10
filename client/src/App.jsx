import React, { useState, useRef, useCallback } from 'react';

const API = '/api';

// ─── Utility: format file size ─────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── Utility: file type icon ───────────────────────────────────────────────
function fileIcon(name = '', mime = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️';
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return '🎬';
  if (['mp3','wav','ogg','flac'].includes(ext)) return '🎵';
  if (['pdf'].includes(ext)) return '📄';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return '🗜️';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx','csv'].includes(ext)) return '📊';
  if (['ppt','pptx'].includes(ext)) return '📋';
  if (['js','ts','jsx','tsx','html','css','json','py','java'].includes(ext)) return '💻';
  return '📁';
}

// ─── Upload Tab ────────────────────────────────────────────────────────────
function UploadTab() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      setError('File exceeds 50 MB limit.');
      return;
    }
    setError('');
    setResult(null);
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress with XHR for real upload progress
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API}/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(JSON.parse(xhr.responseText)?.error || 'Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      setProgress(100);
      setResult(data);
      setFile(null);
    } catch (err) {
      setError(err.message || 'Upload failed. Is the server running?');
    } finally {
      setUploading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setProgress(0);
    setError('');
  };

  if (result) {
    const expiry = new Date(result.expiresAt);
    return (
      <div className="code-success">
        <div className="success-icon">✓</div>
        <div>
          <div className="success-title">File Uploaded!</div>
          <div className="success-sub">
            Share this 4-digit code with anyone.<br />
            They can download it within 24 hours.
          </div>
        </div>

        <div className="code-box" style={{ width: '100%' }}>
          <div className="code-label">Your Share Code</div>
          <div className="code-digits">
            {result.code.split('').map((d, i) => (
              <div key={i} className="code-digit">{d}</div>
            ))}
          </div>
          <div className="code-expiry">
            ⏰ Expires at {expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {expiry.toLocaleDateString()}
          </div>
          <button
            id="copy-code-btn"
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={copyCode}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        <div style={{ width: '100%' }}>
          <div className="file-info-card" style={{ marginBottom: 0 }}>
            <div className="file-info-icon">{fileIcon(result.originalName)}</div>
            <div className="file-info-details">
              <div className="file-info-name">{result.originalName}</div>
              <div className="file-info-meta">
                <span className="meta-chip">📦 {formatSize(result.size)}</span>
              </div>
            </div>
          </div>
        </div>

        <button id="upload-another-btn" className="btn btn-secondary" onClick={reset}>
          ↑ Upload Another File
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        id="upload-dropzone"
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !file && inputRef.current.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop zone for file upload"
      >
        <input
          ref={inputRef}
          type="file"
          className="file-input"
          id="file-input"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="upload-icon">📤</div>
        <div className="upload-title">Drop your file here</div>
        <div className="upload-sub">
          or <span onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>browse files</span>
        </div>
        <div className="size-note">Maximum file size: 50 MB</div>
      </div>

      {file && (
        <div className="file-preview">
          <div className="file-preview-icon">{fileIcon(file.name)}</div>
          <div className="file-preview-info">
            <div className="file-preview-name">{file.name}</div>
            <div className="file-preview-size">{formatSize(file.size)}</div>
          </div>
          <button
            className="file-preview-remove"
            onClick={() => setFile(null)}
            aria-label="Remove file"
            title="Remove file"
          >✕</button>
        </div>
      )}

      {error && (
        <div className="message message-error">
          ⚠️ {error}
        </div>
      )}

      {uploading && (
        <div className="upload-progress" style={{ marginTop: 16 }}>
          <div className="progress-label">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button
        id="upload-btn"
        className="btn btn-primary"
        onClick={upload}
        disabled={!file || uploading}
      >
        {uploading ? '⏳ Uploading…' : '🚀 Upload & Get Code'}
      </button>
    </div>
  );
}

// ─── Download Tab ──────────────────────────────────────────────────────────
function DownloadTab() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [fileInfo, setFileInfo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  const code = digits.join('');

  const handleDigit = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setFileInfo(null);
    setError('');
    if (v && i < 3) inputRefs[i + 1].current.focus();
    if (!v && i > 0) inputRefs[i - 1].current.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs[i - 1].current.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs[i - 1].current.focus();
    if (e.key === 'ArrowRight' && i < 3) inputRefs[i + 1].current.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const next = ['', '', '', ''];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    setFileInfo(null);
    setError('');
    const focus = Math.min(pasted.length, 3);
    inputRefs[focus].current.focus();
  };

  const lookupCode = async () => {
    if (code.length !== 4) return;
    setChecking(true);
    setError('');
    setFileInfo(null);
    try {
      const res = await fetch(`${API}/info/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setFileInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const downloadFile = () => {
    // API is same-origin (via Vite proxy), so `link.download` is fully respected.
    const link = document.createElement('a');
    link.href = `${API}/download/${code}`;
    link.download = fileInfo?.originalName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
  };

  const expiry = fileInfo ? new Date(fileInfo.expiresAt) : null;

  return (
    <div>
      <div className="section-title">Enter Share Code</div>
      <div className="section-sub">
        Enter the 4-digit code shared with you to download the file.
      </div>

      <div className="code-inputs">
        {digits.map((d, i) => (
          <input
            key={i}
            id={`digit-input-${i}`}
            ref={inputRefs[i]}
            className="digit-input"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            placeholder="·"
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoComplete="off"
          />
        ))}
      </div>

      {error && (
        <div className="message message-error">
          ⚠️ {error}
        </div>
      )}

      {fileInfo && (
        <div className="file-info-card">
          <div className="file-info-icon">{fileIcon(fileInfo.originalName, fileInfo.mimetype)}</div>
          <div className="file-info-details">
            <div className="file-info-name">{fileInfo.originalName}</div>
            <div className="file-info-meta">
              <span className="meta-chip">📦 {formatSize(fileInfo.size)}</span>
              <span className="meta-chip">⏰ Expires {expiry.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {!fileInfo ? (
        <button
          id="lookup-btn"
          className="btn btn-primary"
          onClick={lookupCode}
          disabled={code.length !== 4 || checking}
        >
          {checking ? '🔍 Looking up…' : '🔍 Find File'}
        </button>
      ) : (
        <>
          <button
            id="download-btn"
            className="btn btn-primary"
            onClick={downloadFile}
            disabled={downloading}
          >
            {downloading ? '⏳ Downloading…' : '⬇️ Download File'}
          </button>
          <button
            id="try-another-code-btn"
            className="btn btn-secondary"
            onClick={() => { setDigits(['','','','']); setFileInfo(null); setError(''); }}
          >
            Try Another Code
          </button>
        </>
      )}
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('upload');

  return (
    <div className="app">
      {/* Ambient background blobs */}
      <div className="bg-blobs" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">📤</div>
          <div>
            <div className="logo-text">ShareEZ</div>
            <div className="logo-tagline">Simple · Secure · Instant</div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="tab-bar" role="tablist" aria-label="Upload or Download">
        <button
          id="tab-upload"
          role="tab"
          aria-selected={tab === 'upload'}
          className={`tab-btn ${tab === 'upload' ? 'active' : ''}`}
          onClick={() => setTab('upload')}
        >
          📤 Upload
        </button>
        <button
          id="tab-download"
          role="tab"
          aria-selected={tab === 'download'}
          className={`tab-btn ${tab === 'download' ? 'active' : ''}`}
          onClick={() => setTab('download')}
        >
          ⬇️ Download
        </button>
      </nav>

      {/* Main card */}
      <main className="main">
        <div className="card">
          {tab === 'upload' ? <UploadTab /> : <DownloadTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-dev">Developed by Gayatri</div>
        <div className="footer-sub">ShareEZ — Files expire automatically after 24 hours</div>
      </footer>
    </div>
  );
}
