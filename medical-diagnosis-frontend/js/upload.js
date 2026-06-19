/* ============================================================
   MediDiagnose - Upload JS
   File drag-drop, preview, progress bar, recent uploads
   ============================================================ */

'use strict';

const UploadManager = (() => {
  const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
  const ALLOWED_EXT   = ['.pdf', '.txt'];
  let selectedFile = null;

  const uploadZone    = document.getElementById('uploadZone');
  const fileInput     = document.getElementById('fileInput');
  const filePreview   = document.getElementById('filePreview');
  const progressWrap  = document.getElementById('progressWrap');
  const progressFill  = document.getElementById('progressFill');
  const progressPct   = document.getElementById('progressPct');
  const uploadBtn     = document.getElementById('uploadBtn');

  function validateFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      Toast.error('Only PDF and TXT files are supported');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) { // 20MB
      Toast.error('File size must be under 20MB');
      return false;
    }
    return true;
  }

  function formatBytes(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function getFileIcon(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return { icon: '📄', cls: 'pdf' };
    if (ext === 'txt') return { icon: '📝', cls: 'txt' };
    return { icon: '📎', cls: 'img' };
  }

  function showPreview(file) {
    if (!filePreview) return;
    const { icon, cls } = getFileIcon(file);
    filePreview.innerHTML = `
      <div class="file-card">
        <div class="file-icon ${cls}">${icon}</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatBytes(file.size)} · ${file.type || 'Unknown type'}</div>
        </div>
        <button class="file-remove btn btn-icon" id="removeFileBtn" title="Remove file">🗑️</button>
      </div>`;
    filePreview.classList.remove('hidden');
    filePreview.querySelector('#removeFileBtn').addEventListener('click', clearFile);
    if (uploadBtn) uploadBtn.disabled = false;
  }

  function clearFile() {
    selectedFile = null;
    if (filePreview)  { filePreview.innerHTML = ''; filePreview.classList.add('hidden'); }
    if (progressWrap) progressWrap.classList.add('hidden');
    if (fileInput)    fileInput.value = '';
    if (uploadBtn)    uploadBtn.disabled = true;
  }

  function simulateUpload() {
    if (!selectedFile) { Toast.warning('Please select a file first'); return; }

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (uploadBtn)    { uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading…'; }

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 15;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        onUploadComplete();
      }
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressPct)  progressPct.textContent  = Math.round(pct) + '%';
    }, 150);
  }

  function onUploadComplete() {
    if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = 'Upload Report'; }
    Toast.success(`"${selectedFile.name}" uploaded successfully! 🎉`);

    // Add to recent uploads
    addToRecentUploads(selectedFile);
    clearFile();
  }

  function addToRecentUploads(file) {
    const container = document.getElementById('recentUploadsList');
    if (!container) return;
    const { icon, cls } = getFileIcon(file);
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const item = document.createElement('div');
    item.className = 'file-card';
    item.style.animation = 'slideUp .3s ease';
    item.innerHTML = `
      <div class="file-icon ${cls}">${icon}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${formatBytes(file.size)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem">
        <span class="badge badge-warning">Pending</span>
        <span style="font-size:.72rem;color:var(--text-muted)">Just now</span>
      </div>`;
    container.prepend(item);
  }

  function initDragDrop() {
    if (!uploadZone) return;

    ['dragenter', 'dragover'].forEach(ev => {
      uploadZone.addEventListener(ev, e => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(ev => {
      uploadZone.addEventListener(ev, e => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
      });
    });

    uploadZone.addEventListener('drop', e => {
      const file = e.dataTransfer?.files?.[0];
      if (file && validateFile(file)) {
        selectedFile = file;
        showPreview(file);
      }
    });

    uploadZone.addEventListener('click', () => fileInput?.click());
  }

  function initFileInput() {
    if (!fileInput) return;
    fileInput.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        selectedFile = file;
        showPreview(file);
      }
    });
  }

  function initUploadBtn() {
    if (!uploadBtn) return;
    uploadBtn.disabled = true;
    uploadBtn.addEventListener('click', simulateUpload);
  }

  function init() {
    initDragDrop();
    initFileInput();
    initUploadBtn();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => UploadManager.init());
