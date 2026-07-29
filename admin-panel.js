(() => {
  const ARRIVAL_AT = new Date('2026-08-08T14:05:00+04:00');
  const DEPARTURE_AT = new Date('2026-08-22T23:59:00+04:00');
  const KEY = 'mushvig-admin-state-v1';

  const defaults = {
    preview: false,
    travelStatus: 'waiting',
    arrivalApproved: false,
    esimUnlocked: false,
    missionsUnlocked: false,
    rewardsUnlocked: false
  };

  let adminState = load();
  let tapCount = 0;
  let tapTimer = null;

  function load() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch { return { ...defaults }; }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(adminState));
  }

  function el(tag, attrs = {}, html = '') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') node.className = value;
      else if (key === 'style') node.style.cssText = value;
      else node.setAttribute(key, value);
    });
    node.innerHTML = html;
    return node;
  }

  function injectStyles() {
    const style = el('style');
    style.textContent = `
      .admin-hidden{display:none!important}
      .admin-arrival-card{margin-top:14px;text-align:center}
      .admin-arrival-card h2{margin:8px 0}
      .admin-arrival-card p{opacity:.78;line-height:1.45}
      .admin-actions{display:grid;gap:10px;margin-top:14px}
      .admin-actions button,.admin-panel button{border:0;border-radius:14px;padding:14px 12px;font-weight:800;font-size:15px;background:#f5c84b;color:#111}
      .admin-actions button.secondary,.admin-panel button.secondary{background:#202631;color:#fff}
      .admin-panel-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.72);backdrop-filter:blur(7px);display:none;padding:18px;overflow:auto}
      .admin-panel-backdrop.open{display:block}
      .admin-panel{max-width:520px;margin:30px auto;background:#11151d;border:1px solid #343b48;border-radius:24px;padding:18px;color:#fff;box-shadow:0 20px 70px rgba(0,0,0,.55)}
      .admin-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
      .admin-panel-head h2{margin:0}
      .admin-close{width:42px;padding:10px!important;background:#252b35!important;color:#fff!important}
      .admin-grid{display:grid;gap:10px;margin-top:16px}
      .admin-panel .danger{background:#7a2430;color:#fff}
      .admin-note{font-size:13px;opacity:.7;margin-top:12px}
      .admin-badge{position:fixed;right:12px;bottom:12px;z-index:9997;background:#f5c84b;color:#111;border-radius:999px;padding:8px 12px;font-weight:900;font-size:12px;box-shadow:0 8px 30px rgba(0,0,0,.4)}
    `;
    document.head.appendChild(style);
  }

  function buildArrivalCard() {
    const card = el('section', { class: 'card admin-arrival-card', id: 'arrivalControlCard' });
    card.innerHTML = `
      <p class="eyebrow">СТАТУС ОПЕРАЦИИ</p>
      <h2 id="arrivalControlTitle"></h2>
      <p id="arrivalControlText"></p>
      <div class="admin-actions" id="arrivalControlActions"></div>
    `;
    const hero = document.querySelector('.hero');
    hero?.after(card);
    renderArrivalCard();
  }

  function renderArrivalCard() {
    const title = document.querySelector('#arrivalControlTitle');
    const text = document.querySelector('#arrivalControlText');
    const actions = document.querySelector('#arrivalControlActions');
    if (!title || !text || !actions) return;
    actions.innerHTML = '';

    if (adminState.arrivalApproved) {
      title.textContent = '✅ Прибытие подтверждено';
      text.textContent = 'Полная версия операции разблокирована.';
      return;
    }

    if (adminState.travelStatus === 'pending') {
      title.textContent = '⏳ Ожидается подтверждение';
      text.textContent = 'Мушвиг сообщил, что уже в Баку. Администратор должен подтвердить прибытие.';
      return;
    }

    if (adminState.travelStatus === 'flying') {
      title.textContent = '✈️ Мушвиг в пути';
      text.textContent = 'Самолёт направляется в Баку. После посадки нужно нажать «Я на месте».';
      const arrived = el('button', {}, '📍 Я на месте');
      arrived.onclick = () => { adminState.travelStatus = 'pending'; save(); applyMode(); };
      actions.appendChild(arrived);
      return;
    }

    title.textContent = '🕒 Ожидание вылета';
    text.textContent = 'До прилёта доступна только подготовительная часть операции.';
    const fly = el('button', {}, '✈️ Я вылетел');
    fly.onclick = () => { adminState.travelStatus = 'flying'; save(); applyMode(); };
    actions.appendChild(fly);
  }

  function buildPanel() {
    const backdrop = el('div', { class: 'admin-panel-backdrop', id: 'adminPanelBackdrop' });
    backdrop.innerHTML = `
      <div class="admin-panel">
        <div class="admin-panel-head"><h2>👑 Панель управления</h2><button class="admin-close" id="adminClose">×</button></div>
        <div class="admin-grid">
          <button id="togglePreview"></button>
          <button id="approveArrival">✅ Подтвердить прибытие</button>
          <button class="secondary" id="cancelArrival">↩️ Отменить прибытие</button>
          <button class="secondary" id="unlockEsim">📱 Открыть eSIM</button>
          <button class="secondary" id="unlockMissions">🎯 Разблокировать задания</button>
          <button class="secondary" id="unlockRewards">🏆 Разблокировать награды</button>
          <button class="secondary" id="testAll">🧪 Открыть всё для теста</button>
          <button class="danger" id="resetVacation">🔄 Сбросить отпуск</button>
        </div>
        <div class="admin-note">Чтобы снова открыть эту панель, нажми 7 раз по заголовку «Операция “Выжить в Баку”».</div>
      </div>`;
    document.body.appendChild(backdrop);

    const close = () => backdrop.classList.remove('open');
    document.querySelector('#adminClose').onclick = close;
    backdrop.onclick = e => { if (e.target === backdrop) close(); };

    document.querySelector('#togglePreview').onclick = () => {
      adminState.preview = !adminState.preview; save(); close(); applyMode();
    };
    document.querySelector('#approveArrival').onclick = () => {
      adminState.arrivalApproved = true; adminState.travelStatus = 'approved'; save(); applyMode();
    };
    document.querySelector('#cancelArrival').onclick = () => {
      adminState.arrivalApproved = false; adminState.travelStatus = 'waiting'; save(); applyMode();
    };
    document.querySelector('#unlockEsim').onclick = () => { adminState.esimUnlocked = true; save(); alertBox('eSIM разблокирована'); };
    document.querySelector('#unlockMissions').onclick = () => { adminState.missionsUnlocked = true; save(); alertBox('Задания разблокированы'); };
    document.querySelector('#unlockRewards').onclick = () => { adminState.rewardsUnlocked = true; save(); alertBox('Награды разблокированы'); };
    document.querySelector('#testAll').onclick = () => {
      adminState.arrivalApproved = true; adminState.travelStatus = 'approved'; adminState.esimUnlocked = true; adminState.missionsUnlocked = true; adminState.rewardsUnlocked = true; save(); applyMode();
    };
    document.querySelector('#resetVacation').onclick = () => {
      if (!confirm('Полностью сбросить статус отпуска и тестовый режим?')) return;
      adminState = { ...defaults }; save(); close(); applyMode();
    };
  }

  function alertBox(message) {
    if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(message);
    else alert(message);
  }

  function openPanel() {
    const backdrop = document.querySelector('#adminPanelBackdrop');
    const toggle = document.querySelector('#togglePreview');
    if (toggle) toggle.textContent = adminState.preview ? '👑 Вернуться в режим администратора' : '👀 Предпросмотр как Мушвиг';
    backdrop?.classList.add('open');
  }

  function setSecretTrigger() {
    const title = document.querySelector('.hero h1');
    if (!title) return;
    title.style.userSelect = 'none';
    title.addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => tapCount = 0, 2200);
      if (tapCount >= 7) { tapCount = 0; openPanel(); }
    });
  }

  function applyMode() {
    const app = document.querySelector('#app');
    if (!app) return;
    const sections = [...app.querySelectorAll(':scope > section')];
    const restricted = sections.filter(section => !section.classList.contains('hero') && section.id !== 'arrivalControlCard');
    const mushvigView = adminState.preview || !adminState.arrivalApproved;
    restricted.forEach(section => section.classList.toggle('admin-hidden', mushvigView));

    let badge = document.querySelector('#adminModeBadge');
    if (!badge) {
      badge = el('div', { class: 'admin-badge', id: 'adminModeBadge' });
      badge.onclick = openPanel;
      document.body.appendChild(badge);
    }
    badge.textContent = adminState.preview ? '👀 Режим Мушвига' : '👑 Администратор';
    badge.style.display = mushvigView && !adminState.preview ? 'none' : 'block';

    renderArrivalCard();
    updateCorrectCountdown();
  }

  function updateCorrectCountdown() {
    let diff = ARRIVAL_AT - new Date();
    const label = document.querySelector('#countdownLabel');
    if (diff <= 0) {
      diff = 0;
      if (label) label.textContent = adminState.arrivalApproved ? '🎉 Операция официально началась!' : 'Самолёт прибыл. Ждём подтверждения Мушвига.';
    } else if (label) {
      label.textContent = 'До прилёта Мушвига 8 августа в 14:05 осталось';
    }
    const values = {
      days: Math.floor(diff / 86400000),
      hours: Math.floor(diff / 3600000) % 24,
      minutes: Math.floor(diff / 60000) % 60,
      seconds: Math.floor(diff / 1000) % 60
    };
    Object.entries(values).forEach(([id, value]) => {
      const node = document.querySelector('#' + id);
      if (node) node.textContent = String(value).padStart(2, '0');
    });
  }

  function init() {
    injectStyles();
    buildArrivalCard();
    buildPanel();
    setSecretTrigger();
    applyMode();
    setInterval(updateCorrectCountdown, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
