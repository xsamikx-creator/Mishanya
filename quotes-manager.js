(() => {
  const DEFAULT_QUOTES = [
    '«Сначала прилетим, потом разберёмся.»',
    '«Один кальян — это не статистика.»',
    '«На море поедем. Вопрос только — в какой день проснёмся.»',
    '«Шашлык без лаваша — это просто мясо с проблемами.»',
    '«Я не опоздал. Я появился в нужный момент.»',
    '«План отличный. Главное — никому его не показывать.»',
    '«Завтра точно спокойно посидим.»',
    '«Это была не ошибка, а дополнительное приключение.»',
    '«Сначала кофе. Потом можно обсуждать спасение мира.»',
    '«Кто считает бутылки, тот отвечает за отчёт.»'
  ];
  const FOLDER='data';
  const FILE='mushvig-quotes.json';
  const PATH=`${FOLDER}/${FILE}`;
  let quotes=[...DEFAULT_QUOTES];
  let client=null;
  let currentIndex=0;

  function cfg(){return window.MUSHVIG_SUPABASE||{};}
  function bucket(){return cfg().bucket||'mushvig-photos';}
  function msg(text){if(window.Telegram?.WebApp?.showAlert)window.Telegram.WebApp.showAlert(text);else alert(text);}
  function escapeHtml(text){return String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function normalize(text){let s=String(text||'').trim();if(!s)return '';if(!s.startsWith('«'))s='«'+s;if(!s.endsWith('»'))s=s+'»';return s;}

  function initClient(){
    const c=cfg();
    if(!c.url||!c.anonKey||!window.supabase?.createClient)return false;
    client=window.supabase.createClient(c.url,c.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    return true;
  }

  async function loadQuotes(){
    if(!client)return;
    try{
      const url=client.storage.from(bucket()).getPublicUrl(PATH).data.publicUrl+`?t=${Date.now()}`;
      const r=await fetch(url,{cache:'no-store'});
      if(!r.ok)return;
      const data=await r.json();
      if(Array.isArray(data?.quotes)&&data.quotes.length){quotes=data.quotes.map(normalize).filter(Boolean);currentIndex=Math.floor(Math.random()*quotes.length);showCurrent();}
    }catch(e){console.warn('Quotes cloud load failed',e);}
  }

  async function saveQuotes(){
    if(!client)throw new Error('Supabase не подключён');
    const payload=new Blob([JSON.stringify({quotes,updatedAt:new Date().toISOString()},null,2)],{type:'application/json'});
    const {error}=await client.storage.from(bucket()).upload(PATH,payload,{contentType:'application/json',cacheControl:'0',upsert:true});
    if(error)throw error;
    window.dispatchEvent(new CustomEvent('mushvig:quotes-updated',{detail:{quotes:[...quotes]}}));
  }

  function showCurrent(){
    const el=document.querySelector('#mushvigQuote');
    if(!el||!quotes.length)return;
    currentIndex=(currentIndex+quotes.length)%quotes.length;
    el.textContent=quotes[currentIndex];
  }

  function nextQuote(){
    if(!quotes.length)return;
    if(quotes.length===1)return showCurrent();
    let next=currentIndex;
    while(next===currentIndex)next=Math.floor(Math.random()*quotes.length);
    currentIndex=next;showCurrent();
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
  }

  function takeOverQuoteButton(){
    const btn=document.querySelector('#quoteBtn');
    if(!btn)return;
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();nextQuote();},true);
    currentIndex=Math.floor(Math.random()*quotes.length);showCurrent();
  }

  function injectStyles(){
    const s=document.createElement('style');
    s.textContent=`.quote-admin-backdrop{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.76);backdrop-filter:blur(8px);display:none;padding:18px;overflow:auto}.quote-admin-backdrop.open{display:block}.quote-admin{max-width:560px;margin:24px auto;background:#11151d;border:1px solid #343b48;border-radius:24px;padding:18px;color:#fff}.quote-admin-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.quote-admin-head h2{margin:0}.quote-admin-close{border:0;border-radius:12px;background:#252b35;color:#fff;font-size:22px;width:42px;height:42px}.quote-admin-form{display:grid;gap:10px;margin:16px 0}.quote-admin-form textarea{width:100%;min-height:88px;resize:vertical;box-sizing:border-box;border:1px solid #343b48;border-radius:14px;background:#090c11;color:#fff;padding:12px;font:inherit}.quote-admin-form button,.quote-row button{border:0;border-radius:12px;padding:11px 12px;font-weight:800}.quote-add{background:#f5c84b;color:#111}.quote-list{display:grid;gap:10px}.quote-row{background:#171c25;border:1px solid #2b3240;border-radius:16px;padding:12px}.quote-row p{margin:0 0 10px;line-height:1.45}.quote-row-actions{display:flex;gap:8px}.quote-edit{background:#2a3342;color:#fff}.quote-delete{background:#722a34;color:#fff}.quote-admin-note{font-size:12px;opacity:.65;margin-top:12px}`;
    document.head.appendChild(s);
  }

  function buildAdmin(){
    if(!window.MushvigAccess?.getState?.().isAdmin)return;
    const grid=document.querySelector('#adminPanelBackdrop .admin-grid');
    if(!grid||document.querySelector('#manageQuotes'))return;
    const button=document.createElement('button');button.id='manageQuotes';button.className='secondary';button.textContent='💬 Цитатник Мушвига';grid.insertBefore(button,grid.querySelector('#resetVacation'));

    const backdrop=document.createElement('div');backdrop.className='quote-admin-backdrop';backdrop.id='quoteAdminBackdrop';
    backdrop.innerHTML=`<div class="quote-admin"><div class="quote-admin-head"><h2>💬 Цитатник Мушвига</h2><button class="quote-admin-close" id="quoteAdminClose">×</button></div><div class="quote-admin-form"><textarea id="newMushvigQuote" placeholder="Напиши новую фразу Мушвига…"></textarea><button class="quote-add" id="addMushvigQuote">➕ Добавить фразу</button></div><div class="quote-list" id="quoteAdminList"></div><div class="quote-admin-note">Фразы сохраняются в Supabase и сразу становятся общими для обоих телефонов.</div></div>`;
    document.body.appendChild(backdrop);
    const close=()=>backdrop.classList.remove('open');
    button.onclick=()=>{renderAdminList();backdrop.classList.add('open');};
    document.querySelector('#quoteAdminClose').onclick=close;
    backdrop.onclick=e=>{if(e.target===backdrop)close();};
    document.querySelector('#addMushvigQuote').onclick=async()=>{
      const input=document.querySelector('#newMushvigQuote');const q=normalize(input.value);if(!q)return msg('Напиши фразу.');
      if(quotes.includes(q))return msg('Такая фраза уже есть.');
      quotes.unshift(q);input.value='';
      try{await saveQuotes();renderAdminList();currentIndex=0;showCurrent();msg('✅ Фраза добавлена.');}
      catch(e){quotes.shift();msg('Не удалось сохранить фразу: '+(e.message||e));}
    };
  }

  function renderAdminList(){
    const box=document.querySelector('#quoteAdminList');if(!box)return;box.innerHTML='';
    quotes.forEach((q,index)=>{
      const row=document.createElement('div');row.className='quote-row';
      row.innerHTML=`<p>${escapeHtml(q)}</p><div class="quote-row-actions"><button class="quote-edit">✏️ Изменить</button><button class="quote-delete">🗑 Удалить</button></div>`;
      row.querySelector('.quote-edit').onclick=async()=>{const next=normalize(prompt('Изменить фразу:',q));if(!next||next===q)return;const old=quotes[index];quotes[index]=next;try{await saveQuotes();renderAdminList();showCurrent();}catch(e){quotes[index]=old;msg('Не удалось сохранить изменение.');}};
      row.querySelector('.quote-delete').onclick=()=>{const remove=async()=>{if(quotes.length<=1)return msg('Нужно оставить хотя бы одну фразу.');const old=quotes.splice(index,1)[0];try{await saveQuotes();currentIndex=0;renderAdminList();showCurrent();}catch(e){quotes.splice(index,0,old);msg('Не удалось удалить фразу.');}};if(window.Telegram?.WebApp?.showConfirm)window.Telegram.WebApp.showConfirm('Удалить эту фразу?',ok=>ok&&remove());else if(confirm('Удалить эту фразу?'))remove();};
      box.appendChild(row);
    });
  }

  async function init(){
    injectStyles();initClient();takeOverQuoteButton();await loadQuotes();
    buildAdmin();
    window.addEventListener('mushvig:access-change',buildAdmin);
    setInterval(()=>{if(!document.hidden)loadQuotes();},30000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();