(() => {
  const DEFAULT_MISSIONS = [
    {id:'toast',title:'Произнести олигархический тост',description:'Торжественно и с чувством объявить о начале великой бакинской олигархии.',points:30,visible:true,completed:false},
    {id:'doner',title:'Дать на кишку бакинский доняр',description:'Только культурный. Факт поедания должен быть зафиксирован.',points:30,visible:true,completed:false},
    {id:'banya',title:'Сгонять в баню',description:'Пройти банный обряд восстановления после тяжёлой олигархической службы.',points:40,visible:true,completed:false},
    {id:'outdoor',title:'Пивкануть на открытом воздухе',description:'Разумеется, с кальяном. Операция считается выполненной только при правильной атмосфере.',points:40,visible:true,completed:false},
    {id:'style',title:'Пришмотиться по масти',description:'Обновить гардероб так, чтобы Главное управление одобрило уровень олигархии.',points:30,visible:true,completed:false},
    {id:'soh',title:'Сказать прохожему «Сох ицивя!»',description:'Максимально уверенно. Объяснять смысл запрещается.',points:30,visible:true,completed:false}
  ];

  const PATH='data/mushvig-missions.json';
  const REWARD_POINTS=200;
  let missions=DEFAULT_MISSIONS.map(x=>({...x}));
  let client=null;

  function cfg(){return window.MUSHVIG_SUPABASE||{};}
  function bucket(){return cfg().bucket||'mushvig-photos';}
  function access(){return window.MushvigAccess?.getState?.()||{isAdmin:false,adminPreview:false,approved:false};}
  function msg(text){if(window.Telegram?.WebApp?.showAlert)window.Telegram.WebApp.showAlert(text);else alert(text);}
  function esc(text){return String(text??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function uid(){return 'm'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
  function normalize(raw={}){
    return {
      id:String(raw.id||uid()),
      title:String(raw.title||'').trim(),
      description:String(raw.description||'').trim(),
      points:Math.max(0,Math.min(999,Number(raw.points)||0)),
      visible:raw.visible!==false,
      completed:!!raw.completed
    };
  }
  function score(){return missions.filter(m=>m.completed).reduce((s,m)=>s+m.points,0);}

  function initClient(){
    const c=cfg();
    if(!c.url||!c.anonKey||!window.supabase?.createClient)return false;
    client=window.supabase.createClient(c.url,c.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    return true;
  }

  async function loadMissions(){
    if(!client){renderAll();return;}
    try{
      const url=client.storage.from(bucket()).getPublicUrl(PATH).data.publicUrl+`?t=${Date.now()}`;
      const r=await fetch(url,{cache:'no-store'});
      if(r.ok){
        const data=await r.json();
        if(Array.isArray(data?.missions))missions=data.missions.map(normalize).filter(m=>m.title);
      }
    }catch(e){console.warn('Missions cloud load failed',e);}
    renderAll();
  }

  async function saveMissions(){
    if(!client)throw new Error('Supabase не подключён');
    const payload=new Blob([JSON.stringify({missions,updatedAt:new Date().toISOString()},null,2)],{type:'application/json'});
    const {error}=await client.storage.from(bucket()).upload(PATH,payload,{contentType:'application/json',cacheControl:'0',upsert:true});
    if(error)throw error;
    renderAll();
    window.dispatchEvent(new CustomEvent('mushvig:missions-updated',{detail:{missions:missions.map(x=>({...x})),score:score()}}));
  }

  function injectStyles(){
    const s=document.createElement('style');
    s.textContent=`
      .missions-card .mission-list{display:grid;gap:10px;margin-top:14px}
      .mission-item{border:1px solid #2c3340;border-radius:16px;padding:13px;background:#121720}
      .mission-item.done{border-color:#4a7657;opacity:.9}
      .mission-item h3{margin:0 0 6px;font-size:17px}.mission-item p{margin:0;opacity:.76;line-height:1.45}
      .mission-meta{display:flex;justify-content:space-between;gap:10px;margin-top:10px;font-size:13px;opacity:.8}
      .mission-complete{margin-top:10px;width:100%;border:0;border-radius:12px;padding:11px;font-weight:800;background:#f5c84b;color:#111}
      .mission-reward{margin-top:14px;padding:13px;border-radius:16px;background:#171d27;border:1px solid #30394a}
      .mission-reward strong{display:block;font-size:20px;margin-bottom:4px}
      .mission-progress{height:8px;background:#242b36;border-radius:999px;overflow:hidden;margin-top:9px}.mission-progress i{display:block;height:100%;background:#f5c84b}
      .mission-admin-backdrop{position:fixed;inset:0;z-index:10060;background:rgba(0,0,0,.78);backdrop-filter:blur(8px);display:none;padding:18px;overflow:auto}.mission-admin-backdrop.open{display:block}
      .mission-admin{max-width:580px;margin:20px auto;background:#11151d;border:1px solid #343b48;border-radius:24px;padding:18px;color:#fff}
      .mission-admin-head{display:flex;justify-content:space-between;align-items:center}.mission-admin-head h2{margin:0}.mission-admin-close{border:0;border-radius:12px;background:#252b35;color:#fff;font-size:22px;width:42px;height:42px}
      .mission-form{display:grid;gap:9px;margin:16px 0}.mission-form input,.mission-form textarea{width:100%;box-sizing:border-box;border:1px solid #343b48;border-radius:13px;background:#090c11;color:#fff;padding:12px;font:inherit}.mission-form textarea{min-height:80px;resize:vertical}
      .mission-form-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mission-form label{font-size:13px;opacity:.8;display:flex;align-items:center;gap:8px}.mission-form button,.mission-admin-row button{border:0;border-radius:11px;padding:11px;font-weight:800}.mission-save{background:#f5c84b;color:#111}
      .mission-admin-list{display:grid;gap:10px}.mission-admin-row{border:1px solid #2b3240;border-radius:15px;background:#171c25;padding:12px}.mission-admin-row h3{margin:0 0 5px}.mission-admin-row p{margin:0 0 8px;opacity:.75;line-height:1.4}.mission-admin-actions{display:flex;flex-wrap:wrap;gap:7px}.mission-edit{background:#2a3342;color:#fff}.mission-toggle{background:#28472f;color:#fff}.mission-delete{background:#722a34;color:#fff}
    `;
    document.head.appendChild(s);
  }

  function buildPublicCard(){
    if(document.querySelector('#missionsCard'))return;
    const app=document.querySelector('#app');if(!app)return;
    const card=document.createElement('section');card.id='missionsCard';card.className='card missions-card';
    card.innerHTML=`<p class="eyebrow">СЕКРЕТНЫЙ ОТДЕЛ</p><h2>🎯 Секретные задания Мушвига</h2><p class="note" id="missionsNote"></p><div class="mission-list" id="missionList"></div><div class="mission-reward" id="missionReward"></div>`;
    const summary=document.querySelector('.summary-card');(summary||app.lastElementChild)?.before(card);
  }

  function renderPublic(){
    const card=document.querySelector('#missionsCard');if(!card)return;
    const st=access();
    const unlocked=st.isAdmin||st.approved;
    card.style.display=unlocked?'block':'none';
    if(!unlocked)return;
    const isAdminFull=st.isAdmin&&!st.adminPreview;
    const visible=missions.filter(m=>m.visible||isAdminFull);
    const box=document.querySelector('#missionList');box.innerHTML='';
    visible.forEach(m=>{
      const row=document.createElement('div');row.className='mission-item'+(m.completed?' done':'');
      row.innerHTML=`<h3>${m.completed?'✅':'🕵️'} ${esc(m.title)}</h3>${m.description?`<p>${esc(m.description)}</p>`:''}<div class="mission-meta"><span>${m.visible?'👁 Видимое':'🔒 Скрытое'}</span><b>+${m.points} очков</b></div>`;
      if(isAdminFull){
        const btn=document.createElement('button');btn.className='mission-complete';btn.textContent=m.completed?'↩️ Отменить выполнение':'✅ Засчитать выполнение';
        btn.onclick=async()=>{const old=m.completed;m.completed=!old;try{await saveMissions();}catch(e){m.completed=old;msg('Не удалось сохранить статус.');}};
        row.appendChild(btn);
      }
      box.appendChild(row);
    });
    if(!visible.length)box.innerHTML='<div class="empty">🕵️ Пока секретных заданий нет</div>';
    const s=score();const pct=Math.min(100,Math.round(s/REWARD_POINTS*100));
    document.querySelector('#missionReward').innerHTML=`<strong>${s>=REWARD_POINTS?'🏆 Награда разблокирована!':'🔐 Награда за 200 очков'}</strong><span>${s} / ${REWARD_POINTS} очков</span><div class="mission-progress"><i style="width:${pct}%"></i></div>`;
    document.querySelector('#missionsNote').textContent=isAdminFull?'Админ видит также скрытые задания и может засчитывать выполнение.':'Выполняй задания и набери 200 очков, чтобы открыть награду.';
  }

  function buildAdmin(){
    if(!access().isAdmin)return;
    const grid=document.querySelector('#adminPanelBackdrop .admin-grid');
    if(!grid||document.querySelector('#manageMissions'))return;
    const button=document.createElement('button');button.id='manageMissions';button.className='secondary';button.textContent='🎯 Редактор секретных заданий';
    grid.insertBefore(button,grid.querySelector('#resetVacation'));

    const backdrop=document.createElement('div');backdrop.id='missionAdminBackdrop';backdrop.className='mission-admin-backdrop';
    backdrop.innerHTML=`<div class="mission-admin"><div class="mission-admin-head"><h2>🎯 Секретные задания</h2><button class="mission-admin-close" id="missionAdminClose">×</button></div><div class="mission-form"><input id="missionTitle" placeholder="Название нового задания"><textarea id="missionDescription" placeholder="Описание задания"></textarea><div class="mission-form-row"><input id="missionPoints" type="number" min="0" max="999" value="30" placeholder="Очки"><label><input id="missionVisible" type="checkbox" checked> Видно Мушвигу</label></div><button class="mission-save" id="createMission">➕ Создать новое задание</button></div><div class="mission-admin-list" id="missionAdminList"></div></div>`;
    document.body.appendChild(backdrop);
    const close=()=>backdrop.classList.remove('open');
    button.onclick=()=>{renderAdminList();backdrop.classList.add('open');};
    document.querySelector('#missionAdminClose').onclick=close;
    backdrop.onclick=e=>{if(e.target===backdrop)close();};
    document.querySelector('#createMission').onclick=async()=>{
      const title=document.querySelector('#missionTitle').value.trim();
      if(!title)return msg('Напиши название задания.');
      const mission=normalize({id:uid(),title,description:document.querySelector('#missionDescription').value,points:document.querySelector('#missionPoints').value,visible:document.querySelector('#missionVisible').checked,completed:false});
      missions.unshift(mission);
      try{
        await saveMissions();
        document.querySelector('#missionTitle').value='';document.querySelector('#missionDescription').value='';document.querySelector('#missionPoints').value='30';document.querySelector('#missionVisible').checked=true;
        renderAdminList();msg('✅ Новое секретное задание создано.');
      }catch(e){missions.shift();msg('Не удалось создать задание: '+(e.message||e));}
    };
  }

  function renderAdminList(){
    const box=document.querySelector('#missionAdminList');if(!box)return;box.innerHTML='';
    missions.forEach((m,index)=>{
      const row=document.createElement('div');row.className='mission-admin-row';
      row.innerHTML=`<h3>${m.completed?'✅':'🎯'} ${esc(m.title)}</h3><p>${esc(m.description||'Без описания')}</p><p><b>${m.points} очков</b> • ${m.visible?'👁 видно':'🔒 скрыто'}</p><div class="mission-admin-actions"><button class="mission-edit">✏️ Изменить</button><button class="mission-toggle">${m.visible?'🔒 Скрыть':'👁 Показать'}</button><button class="mission-toggle" data-complete>${m.completed?'↩️ Отменить выполнение':'✅ Выполнено'}</button><button class="mission-delete">🗑 Удалить</button></div>`;
      row.querySelector('.mission-edit').onclick=async()=>{
        const title=prompt('Название задания:',m.title)?.trim();if(!title)return;
        const description=prompt('Описание:',m.description??'');if(description===null)return;
        const pointsRaw=prompt('Сколько очков?',String(m.points));if(pointsRaw===null)return;
        const old={...m};m.title=title;m.description=description.trim();m.points=Math.max(0,Math.min(999,Number(pointsRaw)||0));
        try{await saveMissions();renderAdminList();}catch(e){missions[index]=old;msg('Не удалось сохранить изменение.');}
      };
      row.querySelector('.mission-toggle:not([data-complete])').onclick=async()=>{const old=m.visible;m.visible=!old;try{await saveMissions();renderAdminList();}catch(e){m.visible=old;msg('Не удалось изменить видимость.');}};
      row.querySelector('[data-complete]').onclick=async()=>{const old=m.completed;m.completed=!old;try{await saveMissions();renderAdminList();}catch(e){m.completed=old;msg('Не удалось изменить статус.');}};
      row.querySelector('.mission-delete').onclick=()=>{
        const remove=async()=>{const old=missions.splice(index,1)[0];try{await saveMissions();renderAdminList();}catch(e){missions.splice(index,0,old);msg('Не удалось удалить задание.');}};
        if(window.Telegram?.WebApp?.showConfirm)window.Telegram.WebApp.showConfirm('Удалить это секретное задание?',ok=>ok&&remove());else if(confirm('Удалить это секретное задание?'))remove();
      };
      box.appendChild(row);
    });
  }

  function renderAll(){renderPublic();renderAdminList();}

  async function init(){
    injectStyles();initClient();buildPublicCard();buildAdmin();await loadMissions();
    window.addEventListener('mushvig:access-change',()=>{buildAdmin();renderPublic();});
    setInterval(()=>{if(!document.hidden)loadMissions();},30000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
