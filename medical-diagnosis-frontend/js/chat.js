/* ============================================================
   MediDiagnose - Chat JS
   AI Diagnosis chat interface with mock responses
   ============================================================ */

'use strict';

const ChatManager = (() => {
  const MOCK_RESPONSES = [
    {
      triggers: ['blood', 'hemoglobin', 'anemia', 'iron'],
      response: `Based on your blood test results, I've analyzed several key markers:\n\n**Hemoglobin Levels:** Your hemoglobin is at 11.5 g/dL, which is slightly below the normal range. This suggests mild iron-deficiency anemia.\n\n**Recommendations:**\n• Increase iron-rich foods (spinach, red meat, lentils)\n• Consider iron supplementation (consult doctor first)\n• Follow-up blood test in 6-8 weeks\n\n⚠️ *This is an AI-generated analysis. Please consult your healthcare provider for medical advice.*`
    },
    {
      triggers: ['chest', 'xray', 'x-ray', 'lung', 'pulmonary'],
      response: `I've reviewed the chest X-ray report parameters you've shared:\n\n**Findings:**\n• Lung fields appear clear bilaterally\n• No consolidation or pleural effusion detected\n• Cardiac silhouette within normal limits\n• Costophrenic angles are sharp\n\n**Assessment:** The chest X-ray appears within normal limits for your age group. No immediate concerns detected.\n\n⚠️ *Always have your radiologist review imaging results for a definitive diagnosis.*`
    },
    {
      triggers: ['mri', 'brain', 'neuro', 'headache', 'scan'],
      response: `Analyzing the MRI report data provided:\n\n**Neurological Assessment:**\n• Brain parenchyma shows no abnormal signal intensity\n• Ventricles appear normal in size and configuration\n• No midline shift detected\n• White matter appears intact\n\n**Conclusion:** No significant intracranial pathology identified. Routine neurological follow-up recommended.\n\n⚠️ *MRI interpretation requires specialist review. This AI analysis is supplementary only.*`
    },
    {
      triggers: ['heart', 'ecg', 'cardiac', 'rhythm', 'pulse'],
      response: `ECG Analysis Summary:\n\n**Rhythm:** Normal sinus rhythm — 72 BPM\n**Intervals:**\n• PR interval: 160ms (Normal: 120-200ms) ✅\n• QRS duration: 90ms (Normal: <120ms) ✅\n• QTc: 420ms (Normal: <450ms) ✅\n\n**ST Segment:** No significant ST elevation or depression\n\n**Overall Assessment:** ECG within normal parameters. Cardiac function appears stable.\n\n⚠️ *Cardiac diagnoses must be confirmed by a cardiologist.*`
    },
    {
      triggers: ['urine', 'kidney', 'uti', 'infection', 'protein'],
      response: `Urinalysis Report Interpretation:\n\n**Findings:**\n• Protein: Trace (1+) — Mildly elevated\n• WBC Count: 10-15/hpf — Elevated (Normal: 0-5)\n• RBC: Negative ✅\n• Glucose: Negative ✅\n• pH: 6.5 (Normal range) ✅\n\n**Clinical Interpretation:** Results suggest possible urinary tract infection or early kidney inflammation. Prompt medical attention recommended.\n\n**Action Items:**\n• Stay well hydrated (2-3L water daily)\n• Antibiotic sensitivity testing recommended\n• Consult physician within 24-48 hours\n\n⚠️ *Please seek medical care promptly for potential infection.*`
    },
    {
      triggers: ['diabetes', 'glucose', 'sugar', 'insulin', 'hba1c'],
      response: `Glucose & Diabetes Screening Analysis:\n\n**Key Markers:**\n• Fasting Blood Glucose: Based on your report\n• HbA1c interpretation: Indicator of 3-month glucose control\n\n**Diabetes Risk Categories:**\n• Normal: FBG < 100 mg/dL, HbA1c < 5.7%\n• Prediabetes: FBG 100-125 mg/dL, HbA1c 5.7-6.4%\n• Diabetes: FBG ≥ 126 mg/dL, HbA1c ≥ 6.5%\n\n**Lifestyle Recommendations:**\n• Balanced diet low in refined carbohydrates\n• Regular physical activity (150 min/week)\n• Regular monitoring of blood glucose\n\n⚠️ *Diabetes management requires comprehensive care from your endocrinologist.*`
    },
    {
      triggers: ['cholesterol', 'lipid', 'triglyceride', 'ldl', 'hdl'],
      response: `Lipid Panel Analysis:\n\n**Your Lipid Profile:**\n• Total Cholesterol: Analyzed from your report\n• LDL (Bad Cholesterol): Target < 100 mg/dL\n• HDL (Good Cholesterol): Target > 60 mg/dL\n• Triglycerides: Target < 150 mg/dL\n\n**Heart Risk Assessment:**\nThe Framingham Risk Score considers age, cholesterol, blood pressure, and smoking status.\n\n**Dietary Recommendations:**\n• Increase omega-3 fatty acids (fish, flaxseed)\n• Reduce saturated and trans fats\n• Increase soluble fiber intake\n• Regular aerobic exercise\n\n⚠️ *Consult your cardiologist for personalized treatment plans.*`
    }
  ];

  const DEFAULT_RESPONSE = `Thank you for your question! I've analyzed your medical report and here's my assessment:\n\n**AI Medical Assistant Analysis:**\nI've reviewed the uploaded report data carefully. Based on the information provided, I recommend scheduling a follow-up appointment with your healthcare provider to discuss these results in detail.\n\n**General Health Tips:**\n• Maintain regular check-ups\n• Keep a record of all your medical reports\n• Follow prescribed medications consistently\n• Maintain a healthy lifestyle with balanced diet and exercise\n\n**Remember:** While I can provide general health information and help interpret reports, a qualified medical professional should always review your specific case.\n\n⚠️ *This AI diagnosis is for informational purposes only and should not replace professional medical advice.*`;

  let messages = [];
  let sessionId = Date.now();
  let isTyping = false;

  const messagesEl = document.getElementById('chatMessages');
  const inputEl    = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSendBtn');
  const sessions   = document.getElementById('chatSessions');

  function getResponse(question) {
    const q = question.toLowerCase();
    const match = MOCK_RESPONSES.find(r => r.triggers.some(t => q.includes(t)));
    return match ? match.response : DEFAULT_RESPONSE;
  }

  function formatMessage(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^• /gm, '&bull; ')
      .replace(/\n/g, '<br>');
  }

  function addMessage(text, role, id) {
    const msgId = id || `msg-${Date.now()}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const msg = { id: msgId, text, role, time: now.toISOString() };
    messages.push(msg);

    if (!messagesEl) return;

    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.id = msgId;

    if (role === 'ai') {
      div.innerHTML = `
        <div class="msg-avatar ai">🤖</div>
        <div>
          <div class="msg-bubble">${formatMessage(text)}</div>
          <div class="msg-time">${timeStr}</div>
        </div>`;
    } else {
      const user = Session.get();
      const initials = user.name.split(' ').map(n=>n[0]).join('').toUpperCase();
      div.innerHTML = `
        <div>
          <div class="msg-bubble">${escapeHtml(text)}</div>
          <div class="msg-time">${timeStr}</div>
        </div>
        <div class="msg-avatar user">${initials}</div>`;
    }

    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTyping() {
    if (!messagesEl || isTyping) return;
    isTyping = true;
    const div = document.createElement('div');
    div.className = 'chat-msg ai';
    div.id = 'typingIndicator';
    div.innerHTML = `
      <div class="msg-avatar ai">🤖</div>
      <div class="msg-bubble" style="padding:.6rem 1rem">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>`;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    document.getElementById('typingIndicator')?.remove();
    isTyping = false;
  }

  function scrollToBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const text = inputEl?.value.trim();
    if (!text || isTyping) return;

    inputEl.value = '';
    autoResizeInput();
    addMessage(text, 'user');

    showTyping();
    if (sendBtn) sendBtn.disabled = true;

    // Simulate AI response delay
    const delay = 1200 + Math.random() * 800;
    await new Promise(r => setTimeout(r, delay));

    hideTyping();
    const response = getResponse(text);
    addMessage(response, 'ai');

    if (sendBtn) sendBtn.disabled = false;
    inputEl?.focus();

    // Update sessions sidebar
    updateSessionsList(text);
  }

  function updateSessionsList(lastMessage) {
    if (!sessions) return;
    const existingNew = sessions.querySelector('.chat-session-item.new-session');
    if (existingNew) return; // Already has an item

    const item = document.createElement('div');
    item.className = 'chat-session-item new-session active';
    item.innerHTML = `
      <div class="session-name">New Consultation</div>
      <div class="session-preview">${lastMessage.substring(0, 50)}…</div>
      <div class="session-date">Just now</div>`;
    sessions.prepend(item);
  }

  function autoResizeInput() {
    if (!inputEl) return;
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  }

  function initWelcomeMessage() {
    if (!messagesEl) return;
    addMessage(
      `Hello! 👋 I'm **MediAI**, your AI-powered medical diagnosis assistant.\n\nI can help you:\n• **Interpret** your medical reports (blood tests, X-rays, MRIs)\n• **Explain** medical terminology in simple terms\n• **Provide** general health insights and recommendations\n\nPlease upload a report first, then ask me any questions about it. How can I help you today?`,
      'ai'
    );
  }

  function initSessions() {
    if (!sessions) return;
    const mockSessions = [
      { name: 'Blood Test Analysis',  preview: 'Hemoglobin levels…', date: '2 hours ago' },
      { name: 'MRI Interpretation',   preview: 'Brain scan results…', date: 'Yesterday' },
      { name: 'ECG Checkup',          preview: 'Heart rhythm analysis…', date: '3 days ago' },
    ];
    sessions.innerHTML = mockSessions.map((s, i) => `
      <div class="chat-session-item ${i===0?'active':''}">
        <div class="session-name">${s.name}</div>
        <div class="session-preview">${s.preview}</div>
        <div class="session-date">${s.date}</div>
      </div>`).join('');

    sessions.querySelectorAll('.chat-session-item').forEach(item => {
      item.addEventListener('click', () => {
        sessions.querySelectorAll('.chat-session-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  function escapeHtml(text) {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function init() {
    if (!messagesEl) return;

    initWelcomeMessage();
    initSessions();

    sendBtn?.addEventListener('click', sendMessage);

    inputEl?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    inputEl?.addEventListener('input', autoResizeInput);

    // Quick questions
    document.querySelectorAll('[data-quick-question]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (inputEl) inputEl.value = btn.dataset.quickQuestion;
        sendMessage();
      });
    });

    // New session btn
    document.getElementById('newChatBtn')?.addEventListener('click', () => {
      if (messagesEl) messagesEl.innerHTML = '';
      messages = [];
      sessionId = Date.now();
      initWelcomeMessage();
      Toast.info('New consultation started');
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => ChatManager.init());
