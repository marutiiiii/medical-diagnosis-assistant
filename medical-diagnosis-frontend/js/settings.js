/* ============================================================
   MediDiagnose - Settings JS
   Profile, settings form, toggles, security
   ============================================================ */

'use strict';

/* ── Profile Form ── */
function initProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  const user = Session.get();

  // Pre-fill form fields
  const fields = {
    name:     document.getElementById('profileName'),
    email:    document.getElementById('profileEmail'),
    username: document.getElementById('profileUsername'),
    role:     document.getElementById('profileRole'),
    phone:    document.getElementById('profilePhone'),
    dob:      document.getElementById('profileDob'),
    bio:      document.getElementById('profileBio'),
  };

  if (fields.name)     fields.name.value     = user.name     || '';
  if (fields.email)    fields.email.value    = user.email    || '';
  if (fields.username) fields.username.value = user.username || '';
  if (fields.role)     fields.role.value     = user.role     || 'patient';
  if (fields.phone)    fields.phone.value    = user.phone    || '+1 (555) 000-0000';
  if (fields.dob)      fields.dob.value      = user.dob      || '1990-01-01';
  if (fields.bio)      fields.bio.value      = user.bio      || 'Healthcare professional focused on patient-centered care.';

  // Profile avatar initials
  const initials = user.name?.split(' ').map(n=>n[0]).join('').toUpperCase() || 'U';
  document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = initials);
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name || 'User');
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.role || 'patient');
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email || '');

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedUser = {
      ...user,
      name:     fields.name?.value.trim()     || user.name,
      email:    fields.email?.value.trim()    || user.email,
      username: fields.username?.value.trim() || user.username,
      phone:    fields.phone?.value.trim()    || '',
      bio:      fields.bio?.value.trim()      || '',
    };

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    await new Promise(r => setTimeout(r, 800));

    Session.set(updatedUser);
    Toast.success('Profile updated successfully! ✅');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
    Session.initUI();
  });
}

/* ── Settings Toggles ── */
function initSettingsToggles() {
  const SETTINGS_KEY = 'medi-settings';

  const defaults = {
    emailNotifs:   true,
    smsNotifs:     false,
    diagnosisAlerts: true,
    reportUploads: true,
    doctorReviews: true,
    marketingEmails: false,
    twoFactor:     false,
    sessionTimeout: true,
    loginAlerts:   true,
  };

  let settings = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (saved) settings = { ...defaults, ...saved };
  } catch {}

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // Apply toggle states
  Object.entries(settings).forEach(([key, val]) => {
    const toggle = document.getElementById(`toggle-${key}`);
    if (toggle) toggle.checked = val;
  });

  // Listen for changes
  document.querySelectorAll('.toggle input').forEach(toggle => {
    const key = toggle.id?.replace('toggle-', '');
    if (key && key in settings) {
      toggle.addEventListener('change', () => {
        settings[key] = toggle.checked;
        saveSettings();
        Toast.info(`${toggle.checked ? 'Enabled' : 'Disabled'} successfully`);
      });
    }
  });
}

/* ── Password Change Form ── */
function initPasswordChange() {
  const form = document.getElementById('passwordForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = document.getElementById('currentPassword')?.value;
    const newPass  = document.getElementById('newPassword')?.value;
    const confirm  = document.getElementById('confirmNewPassword')?.value;

    if (!current) { Toast.error('Please enter your current password'); return; }
    if (!newPass || newPass.length < 8) { Toast.error('New password must be at least 8 characters'); return; }
    if (newPass !== confirm) { Toast.error('Passwords do not match'); return; }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = 'Updating…';

    await new Promise(r => setTimeout(r, 900));

    Toast.success('Password updated successfully! 🔒');
    form.reset();
    btn.disabled = false; btn.textContent = 'Update Password';
  });
}

/* ── Danger Zone ── */
function initDangerZone() {
  document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
    Modal.open('deleteAccountModal');
  });

  document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('deleteConfirmInput')?.value;
    if (input !== 'DELETE') {
      Toast.error('Please type DELETE to confirm');
      return;
    }
    await new Promise(r => setTimeout(r, 600));
    Toast.warning('Account deletion requested. You will receive a confirmation email.');
    Modal.close('deleteAccountModal');
  });
}

/* ── Avatar Upload (Mock) ── */
function initAvatarUpload() {
  const btn   = document.getElementById('changeAvatarBtn');
  const input = document.getElementById('avatarInput');
  if (!btn || !input) return;

  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { Toast.error('Please select an image file'); return; }

    const reader = new FileReader();
    reader.onload = ev => {
      document.querySelectorAll('[data-user-avatar]').forEach(el => {
        el.style.backgroundImage = `url(${ev.target.result})`;
        el.textContent = '';
      });
      Toast.success('Avatar updated! 🎨');
    };
    reader.readAsDataURL(file);
  });
}

/* ── Session Management ── */
function initSessionManagement() {
  document.getElementById('logoutAllBtn')?.addEventListener('click', async () => {
    await new Promise(r => setTimeout(r, 500));
    Toast.warning('Logged out from all devices');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProfileForm();
  initSettingsToggles();
  initPasswordChange();
  initDangerZone();
  initAvatarUpload();
  initSessionManagement();
});
