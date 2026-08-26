import { STEPS, DOCUMENTS, STATES, STORAGE_KEY } from './data.js';

const PARTNER_POINTS = {
  single: { points: 10, label: '單身' },
  pr: { points: 10, label: '配偶為澳洲公民/永居' },
  skills: { points: 10, label: '配偶技能+英文' },
  english: { points: 5, label: '配偶 Competent 英文' },
};

// ── State Management ──────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { steps: {}, docs: {}, notes: {}, calc: {} };
  } catch {
    return { steps: {}, docs: {}, notes: {}, calc: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let appState = loadState();

// ── Navigation ────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(section).classList.add('active');
  });
});

// ── Render Steps ──────────────────────────────────────────────
function renderSteps() {
  const container = document.getElementById('steps-container');
  container.innerHTML = STEPS.map((step, i) => {
    const stepKey = step.id;
    const stepData = appState.steps[stepKey] || {};
    const taskStates = stepData.tasks || {};
    const allDone = step.tasks.every((_, ti) => taskStates[ti]);
    const note = appState.notes[stepKey] || '';

    const tasksHtml = step.tasks.map((task, ti) => {
      const checked = taskStates[ti] ? 'checked' : '';
      const doneClass = taskStates[ti] ? 'done' : '';
      return `<li class="${doneClass}">
        <input type="checkbox" id="task-${stepKey}-${ti}" data-step="${stepKey}" data-task="${ti}" ${checked} />
        <label for="task-${stepKey}-${ti}">${task}</label>
      </li>`;
    }).join('');

    const linksHtml = step.links.map(l =>
      `<a class="step-link" href="${l.url}" target="_blank" rel="noopener">${l.label} ↗</a>`
    ).join('');

    return `<div class="step-card ${allDone ? 'completed' : ''}" data-step-id="${stepKey}">
      <div class="step-header" data-toggle="${stepKey}">
        <div class="step-number">${allDone ? '✓' : i + 1}</div>
        <div class="step-title-wrap">
          <div class="step-title">${step.title}</div>
          <div class="step-subtitle">${step.subtitle}</div>
        </div>
        <span class="step-toggle">▼</span>
      </div>
      <div class="step-body">
        <p class="step-description">${step.description}</p>
        <span class="step-duration">⏱ 預計時間：${step.duration}</span>
        <ul class="step-tasks">${tasksHtml}</ul>
        <div class="step-links">${linksHtml}</div>
        <div class="step-notes">
          <label for="note-${stepKey}">我嘅備註：</label>
          <textarea id="note-${stepKey}" data-note="${stepKey}" placeholder="記低重要日期、參考編號、注意事項...">${note}</textarea>
        </div>
      </div>
    </div>`;
  }).join('');

  // Toggle expand
  container.querySelectorAll('.step-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.step-card').classList.toggle('open');
    });
  });

  // Task checkboxes
  container.querySelectorAll('input[type="checkbox"][data-step]').forEach(cb => {
    cb.addEventListener('change', () => {
      const stepKey = cb.dataset.step;
      const taskIdx = cb.dataset.task;
      if (!appState.steps[stepKey]) appState.steps[stepKey] = { tasks: {} };
      appState.steps[stepKey].tasks[taskIdx] = cb.checked;
      saveState(appState);
      renderSteps();
      updateDashboard();
    });
  });

  // Notes
  container.querySelectorAll('textarea[data-note]').forEach(ta => {
    ta.addEventListener('input', () => {
      appState.notes[ta.dataset.note] = ta.value;
      saveState(appState);
    });
  });
}

// ── Render Documents ──────────────────────────────────────────
function renderDocuments() {
  const container = document.getElementById('doc-categories');
  container.innerHTML = DOCUMENTS.map((cat, ci) => {
    const itemsHtml = cat.items.map((item, ii) => {
      const key = `${ci}-${ii}`;
      const checked = appState.docs[key] ? 'checked' : '';
      const doneClass = appState.docs[key] ? 'done' : '';
      return `<li class="${doneClass}">
        <input type="checkbox" id="doc-${key}" data-doc="${key}" ${checked} />
        <label for="doc-${key}">${item}</label>
      </li>`;
    }).join('');

    return `<div class="doc-category">
      <div class="doc-category-header">${cat.category}</div>
      <ul class="doc-list">${itemsHtml}</ul>
    </div>`;
  }).join('');

  container.querySelectorAll('input[data-doc]').forEach(cb => {
    cb.addEventListener('change', () => {
      appState.docs[cb.dataset.doc] = cb.checked;
      saveState(appState);
      renderDocuments();
    });
  });
}

// ── Render States ─────────────────────────────────────────────
function renderStates() {
  const grid = document.getElementById('states-grid');
  grid.innerHTML = STATES.map(s => `
    <div class="state-card">
      <h4>${s.name}</h4>
      <div class="state-abbr">${s.abbr}</div>
      <p>${s.notes}</p>
      <a href="${s.url}" target="_blank" rel="noopener">前往官網 ↗</a>
    </div>
  `).join('');
}

// ── Timeline Preview ──────────────────────────────────────────
function renderTimeline() {
  const ol = document.getElementById('timeline-preview');
  let foundCurrent = false;
  ol.innerHTML = STEPS.map(step => {
    const stepData = appState.steps[step.id] || {};
    const taskStates = stepData.tasks || {};
    const allDone = step.tasks.every((_, ti) => taskStates[ti]);
    let cls = '';
    if (allDone) cls = 'done';
    else if (!foundCurrent) { cls = 'current'; foundCurrent = true; }
    return `<li class="${cls}">${step.title}</li>`;
  }).join('');
}

// ── Dashboard Update ──────────────────────────────────────────
function updateDashboard() {
  let completedSteps = 0;
  let nextStep = null;

  STEPS.forEach(step => {
    const stepData = appState.steps[step.id] || {};
    const taskStates = stepData.tasks || {};
    const allDone = step.tasks.every((_, ti) => taskStates[ti]);
    if (allDone) completedSteps++;
    else if (!nextStep) nextStep = step;
  });

  const total = STEPS.length;
  const percent = Math.round((completedSteps / total) * 100);

  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('stat-completed').textContent = completedSteps;
  document.getElementById('stat-total').textContent = total;

  const circle = document.getElementById('ring-circle');
  const circumference = 2 * Math.PI * 52;
  circle.style.strokeDashoffset = circumference - (percent / 100) * circumference;

  if (nextStep) {
    document.getElementById('next-action-text').textContent = `下一步：${nextStep.title} — ${nextStep.subtitle}`;
    document.getElementById('go-next-step').onclick = () => {
      document.querySelector('[data-section="steps"]').click();
      const card = document.querySelector(`[data-step-id="${nextStep.id}"]`);
      if (card) {
        card.classList.add('open');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
  } else {
    document.getElementById('next-action-text').textContent = '🎉 所有步驟已完成！祝你移民順利！';
    document.getElementById('go-next-step').style.display = 'none';
  }

  renderTimeline();
}

// ── Points Calculator ─────────────────────────────────────────
function initCalculator() {
  const form = document.getElementById('calc-form');
  const saved = appState.calc || {};

  // Migrate legacy partner checkbox state
  if (!saved['partner-status']) {
    if (saved.partner) saved['partner-status'] = 'skills';
    else if (saved['partner-english']) saved['partner-status'] = 'english';
  }

  // Restore saved values
  Object.entries(saved).forEach(([key, val]) => {
    const el = form.elements[key];
    if (!el) return;
    if (el.type === 'checkbox') el.checked = val;
    else el.value = val;
  });

  function calculate() {
    const age = parseInt(form.elements.age.value) || 0;
    const english = parseInt(form.elements.english.value) || 0;
    const overseas = parseInt(form.elements['overseas-work'].value) || 0;
    const aus = parseInt(form.elements['aus-work'].value) || 0;
    const education = parseInt(form.elements.education.value) || 0;

    let bonus = 0;
    const bonuses = [];
    const partnerKey = form.elements['partner-status'].value;
    const partnerBonus = PARTNER_POINTS[partnerKey];
    if (partnerBonus) {
      bonus += partnerBonus.points;
      bonuses.push([partnerBonus.label, partnerBonus.points]);
    }
    if (form.elements.naati.checked) { bonus += 5; bonuses.push(['NAATI', 5]); }
    if (form.elements['regional-study'].checked) { bonus += 5; bonuses.push(['偏遠地區學習', 5]); }
    if (form.elements.stem.checked) { bonus += 10; bonuses.push(['STEM 學歷', 10]); }
    if (form.elements['professional-year'].checked) { bonus += 5; bonuses.push(['Professional Year', 5]); }
    if (form.elements['state-nomination'].checked) { bonus += 15; bonuses.push(['州提名', 15]); }

    const breakdown = [
      ['年齡', age],
      ['英文', english],
      ['海外工作經驗', overseas],
      ['澳洲工作經驗', aus],
      ['學歷', education],
      ...bonuses,
    ];

    const total = age + english + overseas + aus + education + bonus;
    if (age < 0) {
      document.getElementById('score-number').textContent = '—';
      document.getElementById('score-status').className = 'score-status fail';
      document.getElementById('score-status').textContent = '❌ 45 歲或以上不符合年齡要求';
      document.getElementById('score-breakdown').innerHTML = '';
      document.getElementById('stat-points').textContent = '—';
      return;
    }

    document.getElementById('score-number').textContent = total;
    document.getElementById('stat-points').textContent = total;

    document.getElementById('score-breakdown').innerHTML = breakdown
      .filter(([, v]) => v > 0)
      .map(([label, val]) => `<div><span>${label}</span><span>+${val}</span></div>`)
      .join('');

    const statusEl = document.getElementById('score-status');
    if (total >= 65) {
      statusEl.className = 'score-status pass';
      statusEl.textContent = total >= 80 ? '✅ 分數良好，有競爭力！' : '✅ 達到最低 65 分要求';
    } else {
      statusEl.className = 'score-status warn';
      statusEl.textContent = `⚠️ 未達 65 分（差 ${65 - total} 分），需要提升`;
    }

    // Save calc state
    const calcState = {};
    Array.from(form.elements).forEach(el => {
      if (!el.name) return;
      calcState[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });
    appState.calc = calcState;
    saveState(appState);
  }

  form.addEventListener('change', calculate);
  form.addEventListener('input', calculate);
  calculate();
}

// ── Reset ─────────────────────────────────────────────────────
document.getElementById('reset-progress').addEventListener('click', () => {
  if (confirm('確定要重設所有進度？呢個操作無法復原。')) {
    localStorage.removeItem(STORAGE_KEY);
    appState = { steps: {}, docs: {}, notes: {}, calc: {} };
    renderSteps();
    renderDocuments();
    updateDashboard();
    initCalculator();
  }
});

// ── Init ────────────────────────────────────────────────────────
renderSteps();
renderDocuments();
renderStates();
updateDashboard();
initCalculator();

// Open first incomplete step
const firstIncomplete = STEPS.find(step => {
  const stepData = appState.steps[step.id] || {};
  const taskStates = stepData.tasks || {};
  return !step.tasks.every((_, ti) => taskStates[ti]);
});
if (firstIncomplete) {
  const card = document.querySelector(`[data-step-id="${firstIncomplete.id}"]`);
  if (card) card.classList.add('open');
}
