const mushvigSlangLines=[
'👑 Олигархия начинается там, где обычный отдых уже закончился.',
'👌 Козырно. Грамотно. Вопросов нет.',
'🍽️ Пора дать на кишку, иначе система уйдёт в аварийный режим.',
'🚽 Пятно давит — требуется срочная техническая остановка.',
'🐿️ Ширка-курка — схема-белка. Всё на мази.',
'💰 Буржуи снова зажрались и заказали ещё один кальян.',
'🥩 Дали на кишку — уровень стабильности восстановлен.',
'🍺 Козырно посидели. Главное — не смотреть статистику утром.'
];
phrases.push(
'👑 До уровня «Олигархия» осталось совсем немного…',
'👌 Всё идёт козырно и максимально грамотно…',
'🍽️ Организм просит дать на кишку…',
'🚽 Пятно давит. Система запрашивает технический перерыв…',
'🐿️ Ширка-курка — схема-белка. Всё на мази…',
'💰 Буржуи опять выбрали самый дорогой стол…'
);
mushvigQuotes.push(
'«Олигархия — это когда уже не считаешь, сколько заказал.»',
'«Козырно сделали. Грамотно получилось.»',
'«Надо сначала дать на кишку, потом решать вопросы.»',
'«Ширка-курка — схема-белка. Всё на мази.»',
'«Буржуи зажрались. Но стол хороший.»'
);
achievements.push(
{icon:'👌',title:'Козырно',hint:'Набрать 100 очков при опасности ниже 25%',test:()=>getScore()>=100&&getDanger()<25},
{icon:'🍽️',title:'Дали на кишку',hint:'Съесть 10 порций шашлыка',test:s=>s.kebab>=10},
{icon:'💰',title:'Буржуи',hint:'Набрать 400 очков',test:()=>getScore()>=400},
{icon:'👑',title:'Олигархия',hint:'Высший уровень — 800 очков',test:()=>getScore()>=800}
);

const originalRenderScore=renderScore;
renderScore=function(){
  originalRenderScore();
  const score=getScore(),danger=getDanger();
  const rank=document.querySelector('#rank');
  const status=document.querySelector('#status');
  const hint=document.querySelector('#statusHint');
  if(score>=400)rank.textContent='Буржуи';
  if(score>=800){rank.textContent='👑 Олигархия';status.textContent='👑 Мушвиг достиг уровня «Олигархия»';hint.textContent=`Высший уровень отдыха • опасность ${danger}%`;}
  else if(score>=100&&danger<25){status.textContent='👌 Всё козырно и грамотно';hint.textContent=`Ширка-курка — схема-белка • опасность ${danger}%`;}
  else if(state.kebab>=5&&danger>=45){hint.textContent=`Пора дать на кишку • опасность ${danger}%`;}
};

const originalChangeValue=changeValue;
changeValue=function(id,amount){
  originalChangeValue(id,amount);
  if(amount<=0)return;
  if(id==='kebab')showMessage('🍽️ Дали на кишку. Состояние стало стабильнее!');
  if(id==='beer'&&state.beer%5===0)showMessage('💰 Буржуи зажрались: ещё пять бутылок в протоколе.');
};

function changeSlangLine(){
  const box=document.querySelector('#slangLive');
  if(!box)return;
  box.classList.add('changing');
  setTimeout(()=>{box.textContent=mushvigSlangLines[Math.floor(Math.random()*mushvigSlangLines.length)];box.classList.remove('changing');},180);
}
setInterval(changeSlangLine,7000);

const secretMissions=[
  'Произнести торжественный тост за бакинскую олигархию.',
  'Сделать общее фото всей команды без единого серьёзного лица.',
  'Заказать шашлык и лично проконтролировать наличие лаваша.',
  'Сказать незнакомому человеку: «Ширка-курка — схема-белка».',
  'Станцевать минимум 30 секунд, даже если музыка ещё не началась.',
  'Выбрать место для следующей поездки на море.',
  'Устроить 20 минут отдыха без телефона.',
  'Придумать новое слово для словаря Мушвига.',
  'Сделать легендарное фото на фоне ночного Баку.',
  'Угостить кого-нибудь кофе и объявить это актом олигархии.',
  'Рассказать историю, которую никто из компании раньше не слышал.',
  'Назначить ответственного за воду на ближайший час.',
  'Записать короткое видеопослание Мушвигу из будущего.',
  'Организовать голосование: море, шашлык или кальян.',
  'Сказать: «Вообще козырно получилось» — строго в подходящий момент.'
];
const SECRET_KEY='mushvig-secret-missions-v1';
let secretState={current:-1,done:0};
try{secretState={...secretState,...JSON.parse(localStorage.getItem(SECRET_KEY)||'{}')}}catch{}
function saveSecret(){localStorage.setItem(SECRET_KEY,JSON.stringify(secretState));}
function newSecretMission(){let next=Math.floor(Math.random()*secretMissions.length);if(secretMissions.length>1&&next===secretState.current)next=(next+1)%secretMissions.length;secretState.current=next;saveSecret();renderSecretMission();vibrate('medium');}
function completeSecretMission(){if(secretState.current<0)return;secretState.done++;secretState.current=-1;saveSecret();renderSecretMission();launchConfetti();showMessage(`🎖 Секретная миссия выполнена! Всего выполнено: ${secretState.done}`);}
function renderSecretMission(){const text=document.querySelector('#secretMissionText');const count=document.querySelector('#secretMissionCount');const done=document.querySelector('#secretMissionDone');if(!text)return;count.textContent=`Выполнено миссий: ${secretState.done}`;if(secretState.current<0){text.textContent='Нажмите кнопку, чтобы получить засекреченное задание.';done.disabled=true;done.textContent='Сначала получить миссию';}else{text.textContent=`🎯 Миссия №${secretState.current+1}: ${secretMissions[secretState.current]}`;done.disabled=false;done.textContent='✅ Миссия выполнена';}}
function installSecretMission(){
  const target=document.querySelector('.status-card')||document.querySelector('.summary-card');if(!target)return;
  const section=document.createElement('section');section.className='card secret-mission-card';section.innerHTML=`<p class="eyebrow">🔐 СЕКРЕТНЫЙ ПРОТОКОЛ</p><h2>Задание для Мушвиг Муалима</h2><div class="secret-stamp">СОВЕРШЕННО СЕКРЕТНО</div><p id="secretMissionText" class="secret-mission-text"></p><small id="secretMissionCount" class="secret-mission-count"></small><div class="secret-mission-actions"><button id="secretMissionNew" class="ghost">Получить задание</button><button id="secretMissionDone" class="primary">Миссия выполнена</button></div>`;
  target.insertAdjacentElement('afterend',section);
  const style=document.createElement('style');style.textContent=`.secret-mission-card{position:relative;overflow:hidden;border:1px solid rgba(255,190,60,.35);background:radial-gradient(circle at top right,rgba(255,170,40,.14),transparent 42%),var(--card,#11151d)}.secret-mission-card:before{content:'TOP SECRET';position:absolute;right:-28px;top:22px;transform:rotate(35deg);font-size:11px;font-weight:900;letter-spacing:.18em;color:rgba(255,190,60,.24)}.secret-stamp{display:inline-block;margin:8px 0 14px;padding:6px 10px;border:2px solid #d74b4b;border-radius:6px;color:#ff6b6b;font-weight:900;font-size:12px;letter-spacing:.12em;transform:rotate(-2deg)}.secret-mission-text{min-height:70px;padding:16px;border-radius:16px;background:rgba(255,255,255,.045);font-size:18px;font-weight:750;line-height:1.45}.secret-mission-count{display:block;margin:10px 0 14px;opacity:.65}.secret-mission-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:10px}.secret-mission-actions button:disabled{opacity:.45;filter:grayscale(1)}@media(max-width:520px){.secret-mission-actions{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  document.querySelector('#secretMissionNew').onclick=newSecretMission;
  document.querySelector('#secretMissionDone').onclick=completeSecretMission;
  renderSecretMission();
}

renderAll();
installSecretMission();