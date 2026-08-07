(() => {
  const tg = window.Telegram?.WebApp;
  const params = new URLSearchParams(location.search);
  const startParam = tg?.initDataUnsafe?.start_param || params.get('start') || '';
  const ADMIN_DEVICE_KEY = 'mushvig-admin-device-v1';
  const STAGE_KEY = 'mushvig-arrival-stage-v1';
  const ARRIVAL = new Date('2026-08-08T14:05:00+04:00');
  const DEPARTURE_TEXT = '22 августа 2026';

  if (startParam.startsWith('admin_') || params.get('admin') === '1') {
    localStorage.setItem(ADMIN_DEVICE_KEY, '1');
  }

  const isAdmin = localStorage.getItem(ADMIN_DEVICE_KEY) === '1';
  let adminPreview = false; // только на текущую сессию
  let stage = localStorage.getItem(STAGE_KEY) || 'waiting';

  const main = document.querySelector('#app');
  if (!main) return;
  const hero = main.querySelector('.hero');
  const protectedCards = [...main.querySelectorAll(':scope > section.card')].filter(card => card !== hero);

  const access = document.createElement('section');
  access.id = 'arrivalAccessCard';
  access.className = 'card access-card';
  hero.insertAdjacentElement('afterend', access);

  function haptic(type = 'light') { tg?.HapticFeedback?.impactOccurred?.(type); }
  function notify() { window.dispatchEvent(new CustomEvent('mushvig:access-change', { detail: getState() })); }

  function setStage(next) {
    stage = next;
    localStorage.setItem(STAGE_KEY, stage);
    render(); haptic('medium'); notify();
  }

  function setPreview(value) {
    if (!isAdmin) return;
    adminPreview = !!value;
    render(); notify();
  }

  function getState() {
    return { isAdmin, adminPreview, stage, approved: stage === 'approved', startParam };
  }

  function getContent() {
    if (stage === 'travelling') return {cls:'access-travelling',icon:'✈️',badge:'СТАТУС: В ПУТИ',title:'Мушвиг Муалим направляется в Баку',text:`Прилёт 8 августа в 14:05. Отпуск продлится до ${DEPARTURE_TEXT}. По прибытии нажми кнопку ниже.`,buttons:'<button class="access-primary" data-action="arrived">📍 Я на месте</button>'};
    if (stage === 'pending') return {cls:'access-pending',icon:'🕵️',badge:'ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ',title:'Запрос отправлен в Главное управление',text:'Самир должен подтвердить прибытие. До подтверждения секретные разделы остаются закрыты.',buttons:isAdmin&&!adminPreview?'<button class="access-primary" data-action="approve">✅ Подтвердить прибытие</button><button class="access-secondary" data-action="travelling">Отменить запрос</button>':''};
    if (stage === 'approved') return {cls:'access-approved',icon:'✅',badge:'ПРИБЫТИЕ ПОДТВЕРЖДЕНО',title:'Операция «Выжить в Баку» началась',text:`Полный доступ открыт до вылета ${DEPARTURE_TEXT}.`,buttons:isAdmin&&!adminPreview?'<button class="access-secondary" data-action="waiting">Сбросить тестовый статус</button>':''};
    return {cls:'',icon:'⏳',badge:'СТАТУС: ОЖИДАНИЕ',title:'Главное управление ожидает Мушвиг Муалима',text:`Прилёт в Баку — 8 августа 2026 в 14:05. Вылет — ${DEPARTURE_TEXT}. До начала операции доступно только главное табло.`,buttons:'<button class="access-primary" data-action="travelling">✈️ Я вылетел</button>'};
  }

  function renderAdminBar() {
    let bar = document.querySelector('#adminPreviewBar');
    if (!isAdmin) { bar?.remove(); return; }
    if (!bar) { bar=document.createElement('div');bar.id='adminPreviewBar';bar.className='admin-preview-bar';document.body.insertBefore(bar,main); }
    bar.innerHTML=`<b>${adminPreview?'👁 Предпросмотр как Мушвиг':'👑 Полная админ-версия'}</b><button data-preview>${adminPreview?'Вернуться в админ':'Как Мушвиг'}</button>`;
    bar.querySelector('[data-preview]').onclick=()=>setPreview(!adminPreview);
  }

  function render() {
    const content=getContent();
    access.className=`card access-card ${content.cls}`;
    access.innerHTML=`<div class="access-icon">${content.icon}</div><div class="access-status">${content.badge}</div><h2>${content.title}</h2><p>${content.text}</p><div class="access-actions">${content.buttons}</div>`;
    access.querySelectorAll('[data-action]').forEach(button=>{button.onclick=()=>{const a=button.dataset.action;if(a==='arrived')setStage('pending');else if(a==='approve')setStage('approved');else setStage(a);};});

    // Админ видит всё всегда, кроме добровольного предпросмотра.
    const shouldLock = isAdmin ? adminPreview : stage !== 'approved';
    protectedCards.forEach(card=>card.classList.toggle('locked-preview',shouldLock));
    renderAdminBar();
  }

  function updateExactCountdown() {
    let diff=ARRIVAL-new Date(); const label=document.querySelector('#countdownLabel'); if(!label)return;
    if(diff<=0){diff=0;label.textContent=stage==='approved'?'🎉 Операция официально началась!':'🎉 Время прилёта наступило — ждём подтверждение Мушвига!';}
    else label.textContent='До прилёта Мушвига 8 августа в 14:05 осталось';
    const values={days:Math.floor(diff/86400000),hours:Math.floor(diff/3600000)%24,minutes:Math.floor(diff/60000)%60,seconds:Math.floor(diff/1000)%60};
    Object.entries(values).forEach(([id,value])=>{const el=document.querySelector('#'+id);if(el)el.textContent=String(value).padStart(2,'0');});
  }

  window.MushvigAccess={getState,setStage,setPreview,render,isAdmin,canUseEsim:()=>isAdmin||stage==='approved'};
  render(); updateExactCountdown(); setInterval(updateExactCountdown,1000); notify();
})();