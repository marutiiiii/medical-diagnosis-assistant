/* ============================================================
   MediDiagnose - Dashboard JS
   Patient & Doctor Dashboard logic, charts, tables, search
   ============================================================ */

'use strict';

/* ── Charts ── */
function renderBarChart(containerId, data, labels) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const max = Math.max(...data, 1);
  container.innerHTML = `
    <div class="chart-bars">
      ${data.map((val, i) => `
        <div class="chart-bar-wrap">
          <span class="chart-bar-val">${val}</span>
          <div class="chart-bar"
               style="height:${(val/max)*130}px"
               title="${labels[i]}: ${val}"></div>
          <span class="chart-bar-label">${labels[i]}</span>
        </div>
      `).join('')}
    </div>`;
}

function renderDonutChart(containerId, percentage, label) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="donut-chart" style="background:conic-gradient(var(--primary) 0% ${percentage}%, var(--surface-2) ${percentage}% 100%)">
      <div class="donut-inner">${percentage}%</div>
    </div>
    <p style="text-align:center;margin-top:.5rem;font-size:.78rem;color:var(--text-muted)">${label}</p>`;
}

/* ── Recent Reports Table ── */
function renderReportsTable(tableId, reports) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  if (!reports || reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted)">No reports found. <a href="upload-report.html" style="color:var(--primary)">Upload your first report →</a></td></tr>`;
    return;
  }

  const statusBadge = s => ({
    analyzed: '<span class="badge badge-success">Analyzed</span>',
    pending:  '<span class="badge badge-warning">Pending</span>',
    reviewed: '<span class="badge badge-primary">Reviewed</span>',
  }[s] || '<span class="badge badge-gray">Unknown</span>');

  tbody.innerHTML = reports.map(r => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.6rem">
          <div class="file-icon ${(r.type || 'pdf').toLowerCase()}" style="width:32px;height:32px;font-size:.85rem">
            ${(r.type || '').toUpperCase() === 'PDF' ? '📄' : '📝'}
          </div>
          <div>
            <div style="font-weight:600;font-size:.875rem">${r.name || r.file_name || 'Report'}</div>
            <div style="font-size:.72rem;color:var(--text-muted)">${r.size || ''}</div>
          </div>
        </div>
      </td>
      <td>${formatDate(r.date || r.created_at)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewReport('${r.id}')">View</button>
      </td>
    </tr>`).join('');
}

function viewReport(id) {
  Toast.info(`Opening report: ${id}`);
}

/* ── Activity Feed ── */
function renderActivity(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!items || items.length === 0) {
    el.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-muted)">No recent activity.</div>`;
    return;
  }

  el.innerHTML = items.map(item => `
    <div class="activity-item">
      <div class="activity-dot ${item.type}">${item.icon}</div>
      <div class="activity-info">
        <div class="activity-title">${item.title}</div>
        <div class="activity-desc">${item.desc}</div>
        <div class="activity-time">${item.time}</div>
      </div>
    </div>`).join('');
}

/* ── Patient Search ── */
let filteredPatients = [];
let currentPage = 1;
const PER_PAGE = 6;

function renderPatientCards(data) {
  const grid = document.getElementById('patientGrid');
  if (!grid) return;

  if (!data || !data.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🔍</div>
        <h4>No patients found</h4>
        <p>Try adjusting your search filters</p>
      </div>`;
    return;
  }

  grid.innerHTML = data.map((p, i) => `
    <div class="patient-card" style="animation-delay:${i*.05}s">
      <div class="patient-card-header">
        <div class="avatar-placeholder md">${(p.full_name || p.name || '?').split(' ').map(n=>n[0]).join('')}</div>
        <div>
          <div class="patient-card-name">${p.full_name || p.name || ''}</div>
          <div class="patient-card-email">${p.email || ''}</div>
          <span class="badge ${p.status==='active'?'badge-success':'badge-gray'}" style="margin-top:.3rem">${p.status || 'active'}</span>
        </div>
      </div>
      <div class="patient-card-stats">
        <div class="patient-mini-stat">
          <div class="patient-mini-stat-val">${p.reports || 0}</div>
          <div class="patient-mini-stat-label">Reports</div>
        </div>
        <div class="patient-mini-stat">
          <div class="patient-mini-stat-val">${p.diagnoses || 0}</div>
          <div class="patient-mini-stat-label">Diagnoses</div>
        </div>
      </div>
      <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.85rem">Last active: ${formatDate(p.lastActive || p.last_active || p.created_at)}</div>
      <a href="patient-history.html?id=${p.id}" class="btn btn-primary btn-sm btn-full">View History</a>
    </div>`).join('');
}

function initPatientSearch() {
  const searchInput  = document.getElementById('patientSearch');
  const filterStatus = document.getElementById('filterStatus');
  const paginationEl = document.getElementById('pagination');
  const resultCount  = document.getElementById('resultCount');

  if (!searchInput) return;

  // Show loading state
  const grid = document.getElementById('patientGrid');
  if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">Loading patients…</div>`;

  function applyFilters() {
    const q      = searchInput.value.toLowerCase().trim();
    const status = filterStatus?.value || '';

    const filtered = filteredPatients.filter(p => {
      const name = (p.full_name || p.name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const matchQ = !q || name.includes(q) || email.includes(q);
      const matchStatus = !status || (p.status || 'active') === status;
      return matchQ && matchStatus;
    });

    currentPage = 1;
    if (resultCount) resultCount.textContent = filtered.length;
    renderPatientCards(filtered.slice(0, PER_PAGE));
    if (paginationEl) {
      createPagination(paginationEl, filtered.length, PER_PAGE, 1, p => {
        currentPage = p;
        renderPatientCards(filtered.slice((p-1)*PER_PAGE, p*PER_PAGE));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  searchInput.addEventListener('input', debounce(applyFilters, 300));
  filterStatus?.addEventListener('change', applyFilters);

  // Initial: show empty state — data will come from backend
  renderPatientCards([]);
  if (resultCount) resultCount.textContent = '0';
}

/* ── Diagnosis History ── */
let dxPage = 1;
let allDiagnoses = [];

function renderHistoryTable(data) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const severityBadge = s => ({
    normal:   '<span class="badge badge-success">Normal</span>',
    moderate: '<span class="badge badge-warning">Moderate</span>',
    warning:  '<span class="badge badge-danger">Warning</span>',
  }[s] || '<span class="badge badge-gray">Unknown</span>');

  if (!data || !data.length) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-state-icon">🔬</div>
          <h4>No diagnoses yet</h4>
          <p>Upload a report and ask a question to get started</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(dx => `
    <tr>
      <td>${formatDate(dx.date || dx.created_at)}</td>
      <td><span style="font-weight:600">${dx.report || dx.report_name || ''}</span></td>
      <td style="max-width:220px"><span class="truncate" style="display:block;max-width:220px" title="${dx.question || ''}">${dx.question || ''}</span></td>
      <td>${severityBadge(dx.severity)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" style="color:var(--primary)"
                onclick="openDiagnosisModal('${dx.id}')">View</button>
      </td>
    </tr>`).join('');
}

function openDiagnosisModal(id) {
  const dx = allDiagnoses.find(d => d.id === id);
  if (!dx) return;

  const modal = document.getElementById('diagnosisModal');
  if (!modal) return;

  modal.querySelector('#modalDate').textContent      = formatDate(dx.date || dx.created_at);
  modal.querySelector('#modalReport').textContent    = dx.report || dx.report_name || '';
  modal.querySelector('#modalQuestion').textContent  = dx.question || '';
  modal.querySelector('#modalDiagnosis').textContent = dx.diagnosis || dx.result || '';
  modal.querySelector('#modalTags').innerHTML        = (dx.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

  Modal.open('diagnosisModal');
}

function initHistory() {
  const searchInput = document.getElementById('historySearch');
  const filterSev   = document.getElementById('filterSeverity');
  const paginEl     = document.getElementById('historyPagination');

  // Show empty state until data loads from API
  renderHistoryTable([]);

  // Update summary stats
  function updateHistoryStats(data) {
    const total  = data.length;
    const normal = data.filter(d => d.severity === 'normal').length;
    const attn   = data.filter(d => d.severity !== 'normal').length;
    const elTotal  = document.getElementById('statTotalDx');
    const elNormal = document.getElementById('statNormalDx');
    const elAttn   = document.getElementById('statAttnDx');
    if (elTotal)  elTotal.textContent  = total;
    if (elNormal) elNormal.textContent = normal;
    if (elAttn)   elAttn.textContent   = attn;
  }

  function applyFilters() {
    const q   = searchInput?.value.toLowerCase().trim() || '';
    const sev = filterSev?.value || '';
    const filtered = allDiagnoses.filter(dx => {
      const matchQ   = !q || (dx.report || '').toLowerCase().includes(q) || (dx.question || '').toLowerCase().includes(q);
      const matchSev = !sev || dx.severity === sev;
      return matchQ && matchSev;
    });
    dxPage = 1;
    renderHistoryTable(filtered.slice(0, 5));
    if (paginEl) {
      createPagination(paginEl, filtered.length, 5, 1, p => {
        dxPage = p;
        renderHistoryTable(filtered.slice((p-1)*5, p*5));
      });
    }
  }

  searchInput?.addEventListener('input', debounce(applyFilters, 300));
  filterSev?.addEventListener('change', applyFilters);
}

/* ── Patient History Page ── */
function initPatientHistory() {
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('id');

  const timelineEl  = document.getElementById('diagnosisTimeline');
  const reportsEl   = document.getElementById('patientReportsList');

  // Show loading state
  if (timelineEl) timelineEl.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--text-muted)">Loading timeline…</div>`;
  if (reportsEl)  reportsEl.innerHTML  = `<div style="text-align:center;padding:1rem;color:var(--text-muted)">Loading reports…</div>`;

  if (!patientId) {
    if (timelineEl) timelineEl.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--text-muted)">No patient selected.</div>`;
    if (reportsEl)  reportsEl.innerHTML  = `<div style="text-align:center;padding:1rem;color:var(--text-muted)">No patient selected.</div>`;
    return;
  }
}

/* ── Doctor Dashboard charts ── */
function initDoctorCharts() {
  // Charts use placeholder zeros — will be replaced by real API data
  renderBarChart('patientGrowthChart',
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  );
  renderBarChart('diagnosisChart',
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  );
  renderDonutChart('diagnosisDonut', 0, 'Analysis Completion');
}

/* ── Patient Dashboard charts ── */
function initPatientCharts() {
  renderBarChart('activityChart',
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  );
}

/* ── Debounce ── */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  // Patient dashboard
  if (document.getElementById('recentReportsTable')) {
    renderReportsTable('recentReportsTable', []);
    renderActivity('activityFeed', []);
    initPatientCharts();
  }

  // Doctor dashboard
  if (document.getElementById('patientGrowthChart') || document.getElementById('diagnosisChart')) {
    initDoctorCharts();
  }

  // Patient search
  if (document.getElementById('patientGrid')) {
    initPatientSearch();
  }

  // History
  if (document.getElementById('historyTableBody')) {
    initHistory();
  }

  // Patient history detail
  if (document.getElementById('diagnosisTimeline') || document.getElementById('patientReportsList')) {
    initPatientHistory();
  }
});
