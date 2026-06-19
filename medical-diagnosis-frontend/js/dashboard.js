/* ============================================================
   MediDiagnose - Dashboard JS
   Patient & Doctor Dashboard logic, charts, tables, search
   ============================================================ */

'use strict';

/* ── Mock Data ── */
const MOCK_REPORTS = [
  { id: 'r001', name: 'Blood Test Report',        date: '2024-06-10', status: 'analyzed',  size: '1.2 MB', type: 'PDF' },
  { id: 'r002', name: 'Chest X-Ray Analysis',     date: '2024-06-08', status: 'pending',   size: '2.8 MB', type: 'PDF' },
  { id: 'r003', name: 'MRI Scan Results',         date: '2024-06-05', status: 'analyzed',  size: '5.1 MB', type: 'PDF' },
  { id: 'r004', name: 'ECG Report',               date: '2024-06-01', status: 'reviewed',  size: '0.8 MB', type: 'TXT' },
  { id: 'r005', name: 'Urine Analysis',           date: '2024-05-28', status: 'analyzed',  size: '0.5 MB', type: 'TXT' },
  { id: 'r006', name: 'Lipid Panel Results',      date: '2024-05-20', status: 'pending',   size: '0.9 MB', type: 'PDF' },
];

const MOCK_DIAGNOSES = [
  {
    id: 'dx001',
    date: '2024-06-10 09:30',
    report: 'Blood Test Report',
    question: 'What do my hemoglobin levels indicate?',
    diagnosis: 'Your hemoglobin level of 11.5 g/dL is slightly below the normal range (13.5-17.5 g/dL for men). This indicates mild anemia, likely iron-deficiency. Recommend iron-rich diet and possible supplementation. Follow up with your healthcare provider.',
    severity: 'moderate',
    tags: ['Anemia', 'Iron Deficiency']
  },
  {
    id: 'dx002',
    date: '2024-06-05 14:15',
    report: 'MRI Scan Results',
    question: 'Are there any abnormalities in my MRI scan?',
    diagnosis: 'The MRI scan shows no significant structural abnormalities in the brain parenchyma. Ventricles and sulci appear normal for age. No evidence of mass lesions, hemorrhage, or infarction. Recommend routine follow-up as advised by your neurologist.',
    severity: 'normal',
    tags: ['Neurology', 'MRI']
  },
  {
    id: 'dx003',
    date: '2024-06-01 11:00',
    report: 'ECG Report',
    question: 'Is my heart rhythm normal?',
    diagnosis: 'ECG shows sinus rhythm with a heart rate of 72 bpm. QRS complexes and P-waves appear normal. No ST elevation or depression noted. QTc interval within normal limits. Overall ECG appears within normal parameters.',
    severity: 'normal',
    tags: ['Cardiology', 'ECG']
  },
  {
    id: 'dx004',
    date: '2024-05-28 16:45',
    report: 'Urine Analysis',
    question: 'What does my urine analysis show?',
    diagnosis: 'Urinalysis reveals trace protein (1+) and slightly elevated WBC count (10-15/hpf), which may suggest early urinary tract infection or kidney inflammation. Recommend antibiotic sensitivity testing and hydration. Please consult your physician promptly.',
    severity: 'warning',
    tags: ['Nephrology', 'UTI']
  },
];

const MOCK_PATIENTS = [
  { id: 'p001', name: 'Alex Johnson',    email: 'alex@email.com',   username: 'alexj',  reports: 6, diagnoses: 4, lastActive: '2024-06-10', status: 'active' },
  { id: 'p002', name: 'Maria Santos',    email: 'maria@email.com',  username: 'marias', reports: 3, diagnoses: 2, lastActive: '2024-06-09', status: 'active' },
  { id: 'p003', name: 'David Kim',       email: 'david@email.com',  username: 'davidk', reports: 8, diagnoses: 7, lastActive: '2024-06-07', status: 'active' },
  { id: 'p004', name: 'Emma Wilson',     email: 'emma@email.com',   username: 'emmaw',  reports: 2, diagnoses: 1, lastActive: '2024-06-05', status: 'inactive' },
  { id: 'p005', name: 'James Martinez',  email: 'james@email.com',  username: 'jamesm', reports: 5, diagnoses: 5, lastActive: '2024-06-10', status: 'active' },
  { id: 'p006', name: 'Sophie Turner',   email: 'sophie@email.com', username: 'sopht',  reports: 4, diagnoses: 3, lastActive: '2024-06-08', status: 'active' },
  { id: 'p007', name: 'Carlos Reyes',    email: 'carlos@email.com', username: 'carlosr',reports: 1, diagnoses: 0, lastActive: '2024-06-01', status: 'inactive' },
  { id: 'p008', name: 'Lily Chen',       email: 'lily@email.com',   username: 'lilyc',  reports: 9, diagnoses: 8, lastActive: '2024-06-10', status: 'active' },
];

const MOCK_ACTIVITIES = [
  { icon: '📄', type: 'blue',   title: 'Report Uploaded',       desc: 'Blood Test Report uploaded successfully', time: '2 hours ago' },
  { icon: '🔬', type: 'green',  title: 'Diagnosis Generated',   desc: 'AI analysis completed for MRI scan',      time: '5 hours ago' },
  { icon: '👨‍⚕️', type: 'yellow', title: 'Doctor Review',         desc: 'Dr. Chen reviewed your ECG report',       time: '1 day ago' },
  { icon: '⚠️', type: 'red',    title: 'Attention Required',    desc: 'Follow-up recommended for urine test',    time: '2 days ago' },
  { icon: '✅', type: 'green',  title: 'Report Analyzed',       desc: 'Lipid panel results are ready',           time: '3 days ago' },
];

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

  const statusBadge = s => ({
    analyzed: '<span class="badge badge-success">Analyzed</span>',
    pending:  '<span class="badge badge-warning">Pending</span>',
    reviewed: '<span class="badge badge-primary">Reviewed</span>',
  }[s] || '<span class="badge badge-gray">Unknown</span>');

  tbody.innerHTML = reports.map(r => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.6rem">
          <div class="file-icon ${r.type.toLowerCase()}" style="width:32px;height:32px;font-size:.85rem">
            ${r.type === 'PDF' ? '📄' : '📝'}
          </div>
          <div>
            <div style="font-weight:600;font-size:.875rem">${r.name}</div>
            <div style="font-size:.72rem;color:var(--text-muted)">${r.size}</div>
          </div>
        </div>
      </td>
      <td>${formatDate(r.date)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewReport('${r.id}')">View</button>
        ${r.status === 'analyzed' ? `<button class="btn btn-ghost btn-sm" style="color:var(--primary)">Diagnose</button>` : ''}
      </td>
    </tr>`).join('');
}

function viewReport(id) {
  const r = MOCK_REPORTS.find(r => r.id === id);
  if (!r) return;
  Toast.info(`Opening report: ${r.name}`);
  // In a real app, navigate to report detail
}

/* ── Activity Feed ── */
function renderActivity(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
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
let filteredPatients = [...MOCK_PATIENTS];
let currentPage = 1;
const PER_PAGE = 6;

function renderPatientCards(data) {
  const grid = document.getElementById('patientGrid');
  if (!grid) return;

  if (!data.length) {
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
        <div class="avatar-placeholder md">${p.name.split(' ').map(n=>n[0]).join('')}</div>
        <div>
          <div class="patient-card-name">${p.name}</div>
          <div class="patient-card-email">${p.email}</div>
          <span class="badge ${p.status==='active'?'badge-success':'badge-gray'}" style="margin-top:.3rem">${p.status}</span>
        </div>
      </div>
      <div class="patient-card-stats">
        <div class="patient-mini-stat">
          <div class="patient-mini-stat-val">${p.reports}</div>
          <div class="patient-mini-stat-label">Reports</div>
        </div>
        <div class="patient-mini-stat">
          <div class="patient-mini-stat-val">${p.diagnoses}</div>
          <div class="patient-mini-stat-label">Diagnoses</div>
        </div>
      </div>
      <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.85rem">Last active: ${formatDate(p.lastActive)}</div>
      <a href="patient-history.html?id=${p.id}" class="btn btn-primary btn-sm btn-full">View History</a>
    </div>`).join('');
}

function initPatientSearch() {
  const searchInput  = document.getElementById('patientSearch');
  const filterStatus = document.getElementById('filterStatus');
  const paginationEl = document.getElementById('pagination');

  if (!searchInput) return;

  function applyFilters() {
    const q      = searchInput.value.toLowerCase().trim();
    const status = filterStatus?.value || '';

    filteredPatients = MOCK_PATIENTS.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) ||
                     p.email.toLowerCase().includes(q) ||
                     p.username.toLowerCase().includes(q);
      const matchStatus = !status || p.status === status;
      return matchQ && matchStatus;
    });

    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    const start = (currentPage - 1) * PER_PAGE;
    renderPatientCards(filteredPatients.slice(start, start + PER_PAGE));
    if (paginationEl) {
      createPagination(paginationEl, filteredPatients.length, PER_PAGE, currentPage, p => {
        currentPage = p;
        renderPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  searchInput.addEventListener('input', debounce(applyFilters, 300));
  filterStatus?.addEventListener('change', applyFilters);
  renderPatientCards(MOCK_PATIENTS.slice(0, PER_PAGE));
  if (paginationEl) createPagination(paginationEl, MOCK_PATIENTS.length, PER_PAGE, 1, p => { currentPage = p; renderPage(); });
}

/* ── Diagnosis History ── */
let dxPage = 1;
let filteredDx = [...MOCK_DIAGNOSES];

function renderHistoryTable(data) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const severityBadge = s => ({
    normal:   '<span class="badge badge-success">Normal</span>',
    moderate: '<span class="badge badge-warning">Moderate</span>',
    warning:  '<span class="badge badge-danger">Warning</span>',
  }[s] || '<span class="badge badge-gray">Unknown</span>');

  if (!data.length) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-state-icon">🔬</div>
          <h4>No diagnoses found</h4>
          <p>Upload a report and ask a question to get started</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(dx => `
    <tr>
      <td>${formatDate(dx.date)}</td>
      <td><span style="font-weight:600">${dx.report}</span></td>
      <td style="max-width:220px"><span class="truncate" style="display:block;max-width:220px" title="${dx.question}">${dx.question}</span></td>
      <td>${severityBadge(dx.severity)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" style="color:var(--primary)"
                onclick="openDiagnosisModal('${dx.id}')">View</button>
      </td>
    </tr>`).join('');
}

function openDiagnosisModal(id) {
  const dx = MOCK_DIAGNOSES.find(d => d.id === id);
  if (!dx) return;

  const modal = document.getElementById('diagnosisModal');
  if (!modal) return;

  modal.querySelector('#modalDate').textContent     = formatDate(dx.date);
  modal.querySelector('#modalReport').textContent   = dx.report;
  modal.querySelector('#modalQuestion').textContent = dx.question;
  modal.querySelector('#modalDiagnosis').textContent = dx.diagnosis;
  modal.querySelector('#modalTags').innerHTML = dx.tags.map(t => `<span class="tag">${t}</span>`).join('');

  Modal.open('diagnosisModal');
}

function initHistory() {
  const searchInput = document.getElementById('historySearch');
  const filterSev   = document.getElementById('filterSeverity');
  const paginEl     = document.getElementById('historyPagination');

  renderHistoryTable(filteredDx);

  function applyFilters() {
    const q   = searchInput?.value.toLowerCase().trim() || '';
    const sev = filterSev?.value || '';
    filteredDx = MOCK_DIAGNOSES.filter(dx => {
      const matchQ   = !q || dx.report.toLowerCase().includes(q) || dx.question.toLowerCase().includes(q);
      const matchSev = !sev || dx.severity === sev;
      return matchQ && matchSev;
    });
    dxPage = 1;
    renderPage();
  }

  function renderPage() {
    const start = (dxPage - 1) * 5;
    renderHistoryTable(filteredDx.slice(start, start + 5));
    if (paginEl) {
      createPagination(paginEl, filteredDx.length, 5, dxPage, p => {
        dxPage = p; renderPage();
      });
    }
  }

  searchInput?.addEventListener('input', debounce(applyFilters, 300));
  filterSev?.addEventListener('change', applyFilters);

  if (paginEl) createPagination(paginEl, filteredDx.length, 5, 1, p => { dxPage = p; renderPage(); });
}

/* ── Patient History Page ── */
function initPatientHistory() {
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('id') || 'p001';
  const patient = MOCK_PATIENTS.find(p => p.id === patientId) || MOCK_PATIENTS[0];

  // Fill patient info
  const infoEl = document.getElementById('patientInfoCard');
  if (infoEl) {
    infoEl.querySelector('[data-patient-name]')?.setAttribute('data-text', patient.name);
    document.querySelectorAll('[data-patient-name]').forEach(el => el.textContent = patient.name);
    document.querySelectorAll('[data-patient-email]').forEach(el => el.textContent = patient.email);
    document.querySelectorAll('[data-patient-username]').forEach(el => el.textContent = '@' + patient.username);
    document.querySelectorAll('[data-patient-reports]').forEach(el => el.textContent = patient.reports);
    document.querySelectorAll('[data-patient-diagnoses]').forEach(el => el.textContent = patient.diagnoses);
  }

  // Timeline
  const timelineEl = document.getElementById('diagnosisTimeline');
  if (timelineEl) {
    timelineEl.innerHTML = MOCK_DIAGNOSES.slice(0, 4).map((dx, i) => `
      <div class="timeline-item" style="animation-delay:${i*.1}s">
        <div class="timeline-dot"></div>
        <div class="timeline-date">${formatDate(dx.date)}</div>
        <div class="timeline-content">
          <div class="timeline-title">${dx.report}</div>
          <div class="timeline-text">${dx.diagnosis.substring(0, 120)}…</div>
          <div style="display:flex;gap:.4rem;margin-top:.5rem;flex-wrap:wrap">
            ${dx.tags.map(t=>`<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      </div>`).join('');
  }

  // Reports list
  const reportsEl = document.getElementById('patientReportsList');
  if (reportsEl) {
    reportsEl.innerHTML = MOCK_REPORTS.map(r => `
      <div class="file-card">
        <div class="file-icon ${r.type.toLowerCase()}">${r.type==='PDF'?'📄':'📝'}</div>
        <div class="file-info">
          <div class="file-name">${r.name}</div>
          <div class="file-size">${r.size} · ${formatDate(r.date)}</div>
        </div>
        <span class="badge ${r.status==='analyzed'?'badge-success':r.status==='pending'?'badge-warning':'badge-primary'}">${r.status}</span>
      </div>`).join('');
  }
}

/* ── Doctor Dashboard charts ── */
function initDoctorCharts() {
  renderBarChart('patientGrowthChart',
    [12, 19, 15, 28, 22, 35, 30, 41, 38, 45, 42, 50],
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  );
  renderBarChart('diagnosisChart',
    [8, 14, 11, 20, 18, 25, 22, 30, 27, 32, 29, 38],
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  );
  renderDonutChart('diagnosisDonut', 78, 'Analysis Completion');
}

/* ── Patient Dashboard charts ── */
function initPatientCharts() {
  renderBarChart('activityChart',
    [1, 3, 2, 5, 4, 3, 6, 2, 4, 5, 3, 6],
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
    renderReportsTable('recentReportsTable', MOCK_REPORTS.slice(0, 5));
    renderActivity('activityFeed', MOCK_ACTIVITIES);
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
