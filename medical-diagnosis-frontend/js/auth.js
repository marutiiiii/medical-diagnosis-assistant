/* ============================================================
   MediDiagnose - Auth JS
   Login, Signup, Validation, Password strength
   ============================================================ */

'use strict';

/* ── Mock Users DB ── */
const MOCK_USERS = [
  { id: 'p001', name: 'Alex Johnson',   email: 'patient@demo.com',  username: 'alexj',  password: 'Patient@123', role: 'patient' },
  { id: 'd001', name: 'Dr. Sarah Chen', email: 'doctor@demo.com',   username: 'drchen', password: 'Doctor@123',  role: 'doctor'  },
];

/* ── Form Validation Helpers ── */
const Validator = {
  email(v)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  minLen(v, n) { return v.length >= n; },
  match(a, b)  { return a === b; },
  hasUpper(v)  { return /[A-Z]/.test(v); },
  hasNumber(v) { return /[0-9]/.test(v); },
  hasSpecial(v){ return /[^a-zA-Z0-9]/.test(v); },

  showError(field, msg) {
    const group = field.closest('.form-group');
    if (!group) return;
    field.classList.add('error');
    field.classList.remove('success');
    const err = group.querySelector('.form-error');
    if (err) { err.textContent = msg; err.classList.add('show'); }
  },

  showSuccess(field) {
    const group = field.closest('.form-group');
    if (!group) return;
    field.classList.remove('error');
    field.classList.add('success');
    const err = group.querySelector('.form-error');
    if (err) err.classList.remove('show');
  },

  clear(field) {
    field.classList.remove('error', 'success');
    const group = field.closest('.form-group');
    if (!group) return;
    const err = group.querySelector('.form-error');
    if (err) err.classList.remove('show');
  }
};

/* ── Password Visibility Toggle ── */
function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.togglePassword;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁️' : '🙈';
    });
  });
}

/* ── Password Strength Meter ── */
function initPasswordStrength() {
  const pwInput = document.getElementById('password');
  const segments = document.querySelectorAll('.strength-seg');
  const label = document.querySelector('.strength-label');
  if (!pwInput || !segments.length) return;

  pwInput.addEventListener('input', () => {
    const v = pwInput.value;
    let score = 0;
    if (v.length >= 8)         score++;
    if (Validator.hasUpper(v)) score++;
    if (Validator.hasNumber(v)) score++;
    if (Validator.hasSpecial(v)) score++;

    const levels = ['', 'weak', 'medium', 'medium', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong 🔒'];
    const colors = ['', 'weak', 'medium', 'medium', 'strong'];

    segments.forEach((seg, i) => {
      seg.classList.remove('active', 'weak', 'medium', 'strong');
      if (i < score) seg.classList.add('active', colors[score]);
    });
    if (label) label.textContent = v.length ? labels[score] : '';
  });
}

/* ── Login Form ── */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const passInput  = document.getElementById('password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    // Validate email
    if (!emailInput.value.trim()) {
      Validator.showError(emailInput, 'Email is required');
      valid = false;
    } else if (!Validator.email(emailInput.value)) {
      Validator.showError(emailInput, 'Enter a valid email address');
      valid = false;
    } else {
      Validator.showSuccess(emailInput);
    }

    // Validate password
    if (!passInput.value) {
      Validator.showError(passInput, 'Password is required');
      valid = false;
    } else if (passInput.value.length < 6) {
      Validator.showError(passInput, 'Password must be at least 6 characters');
      valid = false;
    } else {
      Validator.showSuccess(passInput);
    }

    if (!valid) return;

    // Real login
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value,
          password: passInput.value
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Session.setToken(data.token);
        const userObj = {
          id: data.user_id,
          role: data.role,
          full_name: data.full_name
        };
        Session.setUser(userObj);
        Toast.success(`Welcome back, ${data.full_name || 'User'}! 👋`);
        await delay(800);
        window.location.href = data.role === 'doctor' ? 'doctor-dashboard.html' : 'patient-dashboard.html';
      } else {
        Toast.error(data.message || 'Invalid email or password.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        Validator.showError(passInput, data.message || 'Incorrect email or password');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Connection to server failed. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });

  // Real-time validation
  emailInput?.addEventListener('blur', () => {
    if (emailInput.value && !Validator.email(emailInput.value)) {
      Validator.showError(emailInput, 'Enter a valid email address');
    } else if (emailInput.value) {
      Validator.showSuccess(emailInput);
    }
  });
}

/* ── Signup Form ── */
function initSignupForm() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const fields = {
    name:     document.getElementById('fullName'),
    email:    document.getElementById('email'),
    username: document.getElementById('username'),
    pass:     document.getElementById('password'),
    confirm:  document.getElementById('confirmPassword'),
    terms:    document.getElementById('termsCheck'),
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    // Name
    if (!fields.name?.value.trim() || fields.name.value.trim().length < 2) {
      Validator.showError(fields.name, 'Please enter your full name');
      valid = false;
    } else { Validator.showSuccess(fields.name); }

    // Email
    if (!Validator.email(fields.email?.value || '')) {
      Validator.showError(fields.email, 'Enter a valid email address');
      valid = false;
    } else { Validator.showSuccess(fields.email); }

    // Username
    if (!fields.username?.value.trim() || fields.username.value.length < 3) {
      Validator.showError(fields.username, 'Username must be at least 3 characters');
      valid = false;
    } else { Validator.showSuccess(fields.username); }

    // Password
    if (!Validator.minLen(fields.pass?.value || '', 8)) {
      Validator.showError(fields.pass, 'Password must be at least 8 characters');
      valid = false;
    } else { Validator.showSuccess(fields.pass); }

    // Confirm
    if (fields.pass?.value !== fields.confirm?.value) {
      Validator.showError(fields.confirm, 'Passwords do not match');
      valid = false;
    } else if (fields.confirm?.value) { Validator.showSuccess(fields.confirm); }

    // Terms
    if (!fields.terms?.checked) {
      Toast.warning('Please accept the Terms of Service');
      valid = false;
    }

    if (!valid) return;

    const role = document.querySelector('[name="role"]:checked')?.value || 'patient';
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fields.name.value.trim(),
          email: fields.email.value,
          password: fields.pass.value,
          role: role
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Toast.success('Account created successfully! 🎉 Please sign in.');
        await delay(1500);
        window.location.href = 'login.html';
      } else {
        Toast.error(data.message || 'Registration failed.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    } catch (e) {
      console.error(e);
      Toast.error('Connection to server failed. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

/* ── Forgot Password Mock ── */
function initForgotPassword() {
  const link = document.getElementById('forgotPassLink');
  if (!link) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value;
    if (email && Validator.email(email)) {
      Toast.info(`Password reset email sent to ${email}`);
    } else {
      Toast.warning('Please enter your email address first');
    }
  });
}

/* ── Demo Login Hint ── */
function addDemoHints() {
  const hint = document.getElementById('demoHint');
  if (!hint) return;
  hint.innerHTML = `
    <div style="background:var(--primary-light);border:1px solid var(--border);border-radius:var(--radius);padding:.75rem 1rem;font-size:.8rem;color:var(--text-muted);margin-bottom:1rem;">
      <strong style="color:var(--primary)">Notice</strong><br>
      <span>Live Backend Connected.</span><br>
      <span>Please create a new account to test login.</span>
    </div>`;
}

/* ── Utility ── */
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initPasswordStrength();
  initLoginForm();
  initSignupForm();
  initForgotPassword();
  addDemoHints();
});
