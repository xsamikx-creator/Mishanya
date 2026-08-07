(() => {
  const BUCKET='Mushing esim';
  const FILE='esim-qr.jpeg';
  const cfg=window.MUSHVIG_SUPABASE;
  let signedUrl='';

  function canOpen(){return !!window.MushvigAccess?.canUseEsim?.();}
  function showMessage(text){if(window.Telegram?.WebApp?.showAlert)window.Telegram.WebApp.showAlert(text);else alert(text);}

  function inject(){
    const app=document.querySelector('#app'); if(!app||document.querySelector('#esimCard'))return;
    const card=document.createElement('section'); card.id='esimCard'; card.className='card esim-card';
    card.innerHTML=`<p class="eyebrow">СВЯЗЬ В БАКУ</p><h2>📱 eSIM Мушвиг Муалима</h2><div id="esimLocked"><div class="esim-lock">🔒</div><p>QR-код откроется только после подтверждения прибытия.</p></div><div id="esimOpen" hidden><p class="note">Подключись к Wi‑Fi перед установкой. QR предназначен только для Мушвиг Муалима.</p><div class="esim-preview" id="esimPreview"><span>📶</span><b>eSIM готова к выдаче</b></div><div class="esim-actions"><button class="primary" id="showEsimQr">📷 Показать QR-код</button><button class="ghost" id="downloadEsimQr">⬇️ Скачать QR-код</button></div><details class="esim-help"><summary>Как установить на iPhone</summary><p>Настройки → Сотовая связь → Добавить eSIM → Использовать QR-код. Если QR сохранён на этом же iPhone, удобнее открыть его на другом устройстве или воспользоваться распознаванием QR из Фото, если эта функция доступна.</p></details></div>`;
    const summary=document.querySelector('.summary-card'); (summary||app.lastElementChild)?.before(card);

    const style=document.createElement('style'); style.textContent=`.esim-card{text-align:center}.esim-lock{font-size:42px;margin:8px}.esim-preview{min-height:150px;border:1px dashed rgba(255,255,255,.18);border-radius:18px;display:grid;place-items:center;gap:8px;margin:14px 0;padding:20px}.esim-preview span{font-size:42px}.esim-preview img{width:min(100%,420px);border-radius:18px;background:#fff}.esim-actions{display:grid;gap:10px}.esim-help{text-align:left;margin-top:14px}.esim-help summary{font-weight:800;cursor:pointer}.esim-help p{opacity:.8;line-height:1.5}`; document.head.appendChild(style);
    document.querySelector('#showEsimQr').onclick=showQr;
    document.querySelector('#downloadEsimQr').onclick=downloadQr;
    render();
  }

  async function getSignedUrl(){
    if(signedUrl)return signedUrl;
    if(!cfg?.url||!cfg?.anonKey)throw new Error('Supabase не настроен');
    const initData=window.Telegram?.WebApp?.initData||'';
    const startParam=window.Telegram?.WebApp?.initDataUnsafe?.start_param||new URLSearchParams(location.search).get('start')||'';
    const response=await fetch(`${cfg.url}/functions/v1/esim-access`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${cfg.anonKey}`,'apikey':cfg.anonKey},body:JSON.stringify({initData,startParam,bucket:BUCKET,path:FILE})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.signedUrl)throw new Error(data.error||'Не удалось получить QR-код');
    signedUrl=data.signedUrl; setTimeout(()=>signedUrl='',4*60*1000); return signedUrl;
  }

  async function showQr(){
    if(!canOpen())return showMessage('QR-код ещё закрыт. Сначала нужно подтвердить прибытие.');
    const preview=document.querySelector('#esimPreview'); preview.innerHTML='<b>Загружаю защищённый QR…</b>';
    try{const url=await getSignedUrl();preview.innerHTML=`<img src="${url}" alt="QR-код eSIM" />`;}
    catch(e){preview.innerHTML='<span>⚠️</span><b>QR пока недоступен</b>';showMessage(e.message);}
  }

  async function downloadQr(){
    if(!canOpen())return showMessage('QR-код ещё закрыт.');
    try{const url=await getSignedUrl();const r=await fetch(url);if(!r.ok)throw new Error('Не удалось скачать QR');const blob=await r.blob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mushvig-esim-qr.jpeg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
    catch(e){showMessage(e.message);}
  }

  function render(){const open=canOpen();const locked=document.querySelector('#esimLocked');const body=document.querySelector('#esimOpen');if(locked)locked.hidden=open;if(body)body.hidden=!open;}
  window.addEventListener('mushvig:access-change',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();