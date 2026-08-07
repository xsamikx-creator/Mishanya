(() => {
  function el(tag, attrs = {}, html = '') {
    const node=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>k==='class'?node.className=v:node.setAttribute(k,v));
    node.innerHTML=html; return node;
  }
  function alertBox(message){if(window.Telegram?.WebApp?.showAlert)window.Telegram.WebApp.showAlert(message);else alert(message);}
  function init(){
    const access=window.MushvigAccess;
    if(!access?.isAdmin) return;

    const style=el('style');
    style.textContent=`.admin-panel-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.72);backdrop-filter:blur(7px);display:none;padding:18px;overflow:auto}.admin-panel-backdrop.open{display:block}.admin-panel{max-width:520px;margin:30px auto;background:#11151d;border:1px solid #343b48;border-radius:24px;padding:18px;color:#fff;box-shadow:0 20px 70px rgba(0,0,0,.55)}.admin-panel-head{display:flex;justify-content:space-between;align-items:center}.admin-panel-head h2{margin:0}.admin-panel button{border:0;border-radius:14px;padding:14px 12px;font-weight:800;font-size:15px;background:#f5c84b;color:#111}.admin-panel .secondary{background:#202631;color:#fff}.admin-panel .danger{background:#7a2430;color:#fff}.admin-grid{display:grid;gap:10px;margin-top:16px}.admin-note{font-size:13px;opacity:.7;margin-top:12px}.admin-badge{position:fixed;right:12px;bottom:12px;z-index:9997;background:#f5c84b;color:#111;border-radius:999px;padding:8px 12px;font-weight:900;font-size:12px;box-shadow:0 8px 30px rgba(0,0,0,.4)}`;
    document.head.appendChild(style);

    const backdrop=el('div',{class:'admin-panel-backdrop',id:'adminPanelBackdrop'},`<div class="admin-panel"><div class="admin-panel-head"><h2>👑 Панель управления</h2><button id="adminClose">×</button></div><div class="admin-grid"><button id="togglePreview"></button><button id="approveArrival">✅ Подтвердить прибытие</button><button class="secondary" id="setFlying">✈️ Поставить статус «В пути»</button><button class="secondary" id="setWaiting">↩️ Вернуть в ожидание</button><button class="secondary" id="testAll">🧪 Открыть всё для теста</button><button class="danger" id="resetVacation">🔄 Сбросить отпуск</button></div><div class="admin-note">Панель можно открыть кнопкой 👑 внизу или 7 нажатиями по заголовку.</div></div>`);
    document.body.appendChild(backdrop);

    const badge=el('div',{class:'admin-badge',id:'adminModeBadge'},'👑 Администратор'); document.body.appendChild(badge);
    const close=()=>backdrop.classList.remove('open');
    const open=()=>{const state=access.getState();document.querySelector('#togglePreview').textContent=state.adminPreview?'👑 Вернуться в режим администратора':'👀 Предпросмотр как Мушвиг';backdrop.classList.add('open');};
    badge.onclick=open; document.querySelector('#adminClose').onclick=close; backdrop.onclick=e=>{if(e.target===backdrop)close();};
    document.querySelector('#togglePreview').onclick=()=>{const s=access.getState();access.setPreview(!s.adminPreview);close();};
    document.querySelector('#approveArrival').onclick=()=>{access.setStage('approved');alertBox('Прибытие подтверждено. Полный доступ открыт.');};
    document.querySelector('#setFlying').onclick=()=>access.setStage('travelling');
    document.querySelector('#setWaiting').onclick=()=>access.setStage('waiting');
    document.querySelector('#testAll').onclick=()=>{access.setPreview(false);access.setStage('approved');alertBox('Всё открыто для тестирования.');};
    document.querySelector('#resetVacation').onclick=()=>{if(confirm('Сбросить статус отпуска?')){access.setPreview(false);access.setStage('waiting');close();}};

    let taps=0,timer; const title=document.querySelector('.hero h1');
    title?.addEventListener('click',()=>{taps++;clearTimeout(timer);timer=setTimeout(()=>taps=0,2200);if(taps>=7){taps=0;open();}});
    window.addEventListener('mushvig:access-change',e=>{badge.textContent=e.detail.adminPreview?'👀 Режим Мушвига':'👑 Администратор';});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();