/* ============================================================
   MediDiagnose - Core App JS
   Global utilities, dark mode, sidebar, toast, modals
   ============================================================ */

'use strict';

/* ── Theme ── */
const ThemeManager = (() => {
  const KEY = 'medi-theme';
  let isDark = localStorage.getItem(KEY) === 'dark';

  function apply() {
    document.body.classList.toggle('dark', isDark);
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.textContent = isDark ? '☀️' : '🌙';
    });
  }

  function toggle() {
    isDark = !isDark;
    localStorage.setItem(KEY, isDark ? 'dark' : 'light');
    apply();
  }

  function init() {
    apply();
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { init, toggle, isDark: () => isDark };
})();

/* ── Sidebar ── */
const SidebarManager = (() => {
  let isOpen = window.innerWidth >= 1024;

  function toggle() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    if (window.innerWidth < 1024) {
      isOpen = !isOpen;
      sidebar.classList.toggle('open', isOpen);
      if (overlay) overlay.classList.toggle('show', isOpen);
    } else {
      isOpen = !isOpen;
      sidebar.classList.toggle('collapsed', !isOpen);
      const main = document.getElementById('mainContent');
      if (main) main.style.marginLeft = isOpen ? 'var(--sidebar-w)' : '0';
    }
  }

  function init() {
    document.querySelectorAll('[data-sidebar-toggle]').forEach(btn => {
      btn.addEventListener('click', toggle);
    });

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        isOpen = false;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    }

    // Auto-collapse on resize
    window.addEventListener('resize', () => {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      if (window.innerWidth >= 1024) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
        sidebar.classList.remove('collapsed');
      }
    });
  }

  return { init, toggle };
})();

/* ── Toast Notifications ── */
const Toast = (() => {
  function show(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Close">✕</button>
    `;

    container.appendChild(toast);

    const remove = () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, duration);
  }

  return { show,
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d),
    warning: (m, d) => show(m, 'warning', d),
    info:    (m, d) => show(m, 'info', d),
  };
})();

/* ── Modal ── */
const Modal = (() => {
  function open(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function close(id) {
    const overlay = typeof id === 'string' ? document.getElementById(id) : id;
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function init() {
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) close(overlay);
      });
    });

    // Close buttons
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) close(overlay);
      });
    });

    // Open buttons
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
      btn.addEventListener('click', () => open(btn.dataset.modalOpen));
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(close);
      }
    });
  }

  return { init, open, close };
})();

/* ── Active Nav Link ── */
function setActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === path || href.endsWith(path))) {
      link.classList.add('active');
    }
  });
}

/* ── Format Date ── */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

/* ── Ripple Effect for Buttons ── */
function addRippleEffect() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        background:rgba(255,255,255,.3); transform:scale(0);
        animation:ripple .5s linear; left:${x}px; top:${y}px;
        width:10px; height:10px; margin:-5px;
      `;
      this.style.overflow = 'hidden';
      this.style.position = 'relative';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* ── Intersection Observer for animations ── */
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-slide-up');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.observe-anim').forEach(el => obs.observe(el));
}

/* ── Skeleton Loader ── */
function showSkeleton(container, rows = 3) {
  container.innerHTML = Array.from({ length: rows }, () => `
    <div style="padding:.75rem 0;border-bottom:1px solid var(--border)">
      <div class="skeleton skeleton-title" style="width:${40+Math.random()*30}%"></div>
      <div class="skeleton skeleton-text" style="width:${60+Math.random()*30}%"></div>
      <div class="skeleton skeleton-text" style="width:${30+Math.random()*20}%"></div>
    </div>
  `).join('');
}

/* ── Mock User Session ── */
const Session = (() => {
  const KEY = 'medi-user';

  const defaultUser = {
    id: 'p001',
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    username: 'alexj',
    role: 'patient',
    avatar: null,
    joined: '2024-01-15'
  };

  function get() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || defaultUser;
    } catch { return defaultUser; }
  }

  function set(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  }

  function initUI() {
    const user = get();
    // Fill user name/role in sidebar
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);
    document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.role);
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);

    // Avatar initials
    document.querySelectorAll('[data-user-avatar]').forEach(el => {
      const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
      el.textContent = initials;
    });
  }

  return { get, set, initUI };
})();

/* ── Pagination ── */
function createPagination(container, total, perPage, page, onChange) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" data-page="${Math.max(1,page-1)}" ${page===1?'disabled':''}>‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
      html += `<button class="page-btn ${i===page?'active':''}" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - page) === 2) {
      html += `<span class="page-btn" style="cursor:default">…</span>`;
    }
  }
  html += `<button class="page-btn" data-page="${Math.min(pages,page+1)}" ${page===pages?'disabled':''}>›</button>`;
  container.innerHTML = html;

  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      if (!isNaN(p) && p !== page) onChange(p);
    });
  });
}

/* ── Init Everything ── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  SidebarManager.init();
  Modal.init();
  Session.initUI();
  setActiveNavLink();
  addRippleEffect();
  initScrollAnimations();
});

// Add CSS for ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple {
    to { transform: scale(30); opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);
