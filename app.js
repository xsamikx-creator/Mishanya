const ARRIVAL = new Date('2026-08-08T12:00:00+04:00');
const STORAGE_KEY = 'mushvig-baku-stats-v4';
const PHOTO_KEY = 'mushvig-baku-photos-v1';
const PLAYER_KEY = 'mushvig-baku-players-v1';

const items = [
  { id:'beer',icon:'🍺',title:'Выпито пива',unit:'бутылок',points:2 },
  { id:'hookah',icon:'💨',title:'Выкурено кальянов',unit:'кальянов',points:5 },
  { id:'vodka',icon:'🥃',title:'Выпито водки',unit:'бутылок',points:8 },
  { id:'kebab',icon:'🥩',title:'Съедено шашлыков',unit:'порций',points:4 },
  { id:'sea',icon:'🌊',title:'Поездок на море',unit:'раз',points:10 },
  { id:'taxi',icon:'🚕',title:'Ночных поездок',unit:'поездок',points:6 },
  { id:'coffee',icon:'☕',title:'Выпито кофе',unit:'чашек',points:2 },
  { id:'sleep',icon:'😴',title:'Проспано до обеда',unit:'дней',points:4 },
  { id:'memes',icon:'😂',title:'Создано мемов',unit:'штук',points:1 },
  { id:'photos',icon:'📸',title:'Сделано фотографий',unit:'кадров',points:1 }
];

const phrases = [
  '🍺 Холодильник проходит боевую подготовку…','🥩 Мангал уже требует уголь…',
  '🌊 Каспий волнуется в ожидании Мушвига…','💨 Кальянщики натирают колбы…',
  '🫀 Печень подала заявление на отпуск…','🚕 Таксисты уже вышли на дежурство…',
  '☀️ Бакинское солнце готовит испытание…','✈️ Самолёт ещё далеко, а легенда уже началась…',
  '⚠️ Уровень безумия растёт без разрешения…','🍢 Шашлык просит не забыть про лаваш…',
  '🧊 Лёд заготавливается в промышленных масштабах…','📸 Компромат скоро начнёт накапливаться…',
  '🕶️ План есть. Насколько он хороший — выясним на месте…','🥤 Вода тоже закуплена. Для вида…',
  '🌙 Ночной Баку уже включил подсветку…','📅 Дни недели временно отменяются…'
];

const mushvigQuotes = [
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

const loaderSteps = [
  'Проверяем запасы холодного пива…',
  'Бронируем лучший стол возле мангала…',
  'Предупреждаем Каспий о прибытии…',
  'Настраиваем счётчики приключений…',
  'Загружаем секретные цитаты Мушвига…',
  'Проверяем готовность печени…',
  'Запускаем операцию «Выжить в Баку»…'
];

const achievements = [
  {icon:'🍺',title:'Первый пошёл',hint:'Выпить первое пиво',test:s=>s.beer>=1},
  {icon:'💨',title:'Дым над Баку',hint:'Первый кальян',test:s=>s.hookah>=1},
  {icon:'🌊',title:'Каспий увиден',hint:'Съездить на море',test:s=>s.sea>=1},
  {icon:'🥩',title:'Шашлычный мастер',hint:'5 порций шашлыка',test:s=>s.kebab>=5},
  {icon:'🍻',title:'Десятка',hint:'10 бутылок пива',test:s=>s.beer>=10},
  {icon:'😂',title:'Мемный завод',hint:'20 созданных мемов',test:s=>s.memes>=20},
  {icon:'🌙',title:'Ночная смена',hint:'5 ночных поездок',test:s=>s.taxi>=5},
  {icon:'📸',title:'Компромат собран',hint:'Добавить 5 фотографий',test:s=>s.photos>=5},
  {icon:'☕',title:'Кофейная реанимация',hint:'10 чашек кофе',test:s=>s.coffee>=10},
  {icon:'👑',title:'Легенда Баку',hint:'500 очков',test:()=>getScore()>=500}
];

const tg = window.Telegram?.WebApp;
const state = loadState();
let photos = loadPhotos();
let players = loadPlayers();
let arrivalCelebrated = sessionStorage.getItem('arrivalCelebrated') === '1';
let quoteIndex = Math.floor(Math.random() * mushvigQuotes.length);

if (tg) {
  tg.ready(); tg.expand();
  tg.setHeaderColor('#080a0f'); tg.setBackgroundColor('#07090d');
  tg.disableVerticalSwipes?.();
}

function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));return Object.fromEntries(items.map(x=>[x.id,Number(saved?.[x.id])||0]));}catch{return Object.fromEntries(items.map(x=>[x.id,0]));}}
function loadPhotos(){try{return JSON.parse(localStorage.getItem(PHOTO_KEY))||[];}catch{return[];}}
function loadPlayers(){try{return JSON.parse(localStorage.getItem(PLAYER_KEY))||[{name:'Мушвиг',score:0},{name:'Самир',score:0}];}catch{return[{name:'Мушвиг',score:0},{name:'Самир',score:0}];}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function savePhotos(){try{localStorage.setItem(PHOTO_KEY,JSON.stringify(photos));}catch{showMessage('Память телефона заполнена. Удали часть фотографий.');}}
function savePlayers(){localStorage.setItem(PLAYER_KEY,JSON.stringify(players));}
function vibrate(type='light'){tg?.HapticFeedback?.impactOccurred(type);}
function getScore(){return items.reduce((sum,x)=>sum+state[x.id]*x.points,0);}
function showMessage(text){if(tg?.showAlert)tg.showAlert(text);else alert(text);}

function renderStats(){
  const box=document.querySelector('#stats'); const template=document.querySelector('#statTemplate'); box.innerHTML='';
  items.forEach(item=>{
    const node=template.content.cloneNode(true);
    node.querySelector('.stat-icon').textContent=item.icon;
    node.querySelector('h3').textContent=item.title;
    node.querySelector('p').textContent=item.unit;
    node.querySelector('strong').textContent=state[item.id];
    node.querySelector('.plus').onclick=()=>changeValue(item.id,1);
    node.querySelector('.minus').onclick=()=>changeValue(item.id,-1);
    box.appendChild(node);
  });
}

function changeValue(id,amount){state[id]=Math.max(0,state[id]+amount);saveState();vibrate(amount>0?'medium':'light');renderAll();}

function renderScore(){
  const score=getScore(); document.querySelector('#score').textContent=score;
  let status='🟢 Мушвиг пока держится',hint='Уровень опасности для печени: минимальный',rank='Новичок бакинского выживания';
  if(score>=50){status='🟡 Начинает путать дни недели';hint='Веселье вышло из тестового режима';rank='Стажёр бакинских приключений';}
  if(score>=120){status='🟠 Опасный уровень веселья';hint='Требуется вода, еда и контроль взрослых';rank='Опытный отпускник';}
  if(score>=250){status='🔴 Требуется срочный шашлык';hint='Система работает на пределе возможностей';rank='Командир бакинского загула';}
  if(score>=500){status='👑 Мушвиг официально стал легендой Баку';hint='Миссия почти невыполнима, но выполнена';rank='Легенда Баку';}
  document.querySelector('#status').textContent=status;
  document.querySelector('#statusHint').textContent=hint;
  document.querySelector('#rank').textContent=rank;
  document.querySelector('#progressBar').style.width=`${Math.min(100,score/5)}%`;
}

function renderAchievements(){
  const box=document.querySelector('#achievements'); box.innerHTML='';
  achievements.forEach(a=>{const open=a.test(state);const el=document.createElement('div');el.className=`achievement${open?' unlocked':''}`;el.innerHTML=`<b>${open?'✅':'🔒'} ${a.icon} ${a.title}</b><span>${a.hint}</span>`;box.appendChild(el);});
}

function renderPlayers(){
  const box=document.querySelector('#players'); box.innerHTML='';
  [...players].sort((a,b)=>b.score-a.score).forEach((player,index)=>{
    const row=document.createElement('div'); row.className='player-row';
    row.innerHTML=`<div class="place">${index===0?'👑':index+1}</div><div class="player-name"><b>${escapeHtml(player.name)}</b><span>${player.score} очков приключений</span></div><div class="player-actions"><button data-act="minus">−</button><button data-act="plus">+</button></div>`;
    row.querySelector('[data-act="plus"]').onclick=()=>changePlayer(player.name,1);
    row.querySelector('[data-act="minus"]').onclick=()=>changePlayer(player.name,-1);
    row.querySelector('.player-name').onclick=()=>removePlayer(player.name);
    box.appendChild(row);
  });
}
function changePlayer(name,amount){const player=players.find(x=>x.name===name);if(!player)return;player.score=Math.max(0,player.score+amount);savePlayers();renderPlayers();vibrate(amount>0?'medium':'light');}
function removePlayer(name){const remove=()=>{players=players.filter(x=>x.name!==name);savePlayers();renderPlayers();};if(tg?.showConfirm)tg.showConfirm(`Удалить участника «${name}»?`,ok=>ok&&remove());else if(confirm(`Удалить участника «${name}»?`))remove();}
function addPlayer(){const name=prompt('Имя нового участника:')?.trim();if(!name)return;if(players.some(x=>x.name.toLowerCase()===name.toLowerCase()))return showMessage('Такой участник уже есть.');players.push({name,score:0});savePlayers();renderPlayers();vibrate('medium');}
function escapeHtml(text){return text.replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

function renderGallery(){
  const box=document.querySelector('#gallery'); box.innerHTML='';
  if(!photos.length){box.innerHTML='<div class="empty">📸 Здесь появятся легендарные кадры</div>';return;}
  photos.forEach((src,index)=>{const img=document.createElement('img');img.src=src;img.alt='Фото отпуска';img.onclick=()=>{const remove=()=>{photos.splice(index,1);savePhotos();renderGallery();};if(tg?.showConfirm)tg.showConfirm('Удалить это фото?',ok=>ok&&remove());else if(confirm('Удалить это фото?'))remove();};box.appendChild(img);});
}

function updateCountdown(){
  let diff=ARRIVAL-new Date(); const label=document.querySelector('#countdownLabel');
  if(diff<=0){diff=0;label.textContent='🎉 Мушвиг прибыл! Операция официально началась!';if(!arrivalCelebrated){arrivalCelebrated=true;sessionStorage.setItem('arrivalCelebrated','1');launchConfetti();}}
  document.querySelector('#days').textContent=String(Math.floor(diff/86400000)).padStart(2,'0');
  document.querySelector('#hours').textContent=String(Math.floor(diff/3600000)%24).padStart(2,'0');
  document.querySelector('#minutes').textContent=String(Math.floor(diff/60000)%60).padStart(2,'0');
  document.querySelector('#seconds').textContent=String(Math.floor(diff/1000)%60).padStart(2,'0');
}

function launchConfetti(){const box=document.querySelector('#confetti');for(let i=0;i<55;i++){const p=document.createElement('i');p.textContent=['🎉','🍺','✨','🥩','🌊'][i%5];p.style.left=`${Math.random()*100}%`;p.style.animationDelay=`${Math.random()}s`;p.style.fontSize=`${14+Math.random()*16}px`;box.appendChild(p);}setTimeout(()=>box.innerHTML='',4200);vibrate('heavy');}
function changePhrase(){const line=document.querySelector('#funLine');line.style.opacity='.25';setTimeout(()=>{line.textContent=phrases[Math.floor(Math.random()*phrases.length)];line.style.opacity='1';},180);}
function changeQuote(){quoteIndex=(quoteIndex+1)%mushvigQuotes.length;const quote=document.querySelector('#mushvigQuote');quote.classList.add('changing');setTimeout(()=>{quote.textContent=mushvigQuotes[quoteIndex];quote.classList.remove('changing');},180);vibrate('light');}
function buildShareText(){const lines=items.filter(x=>state[x.id]>0).map(x=>`${x.icon} ${x.title}: ${state[x.id]}`);const leaders=[...players].sort((a,b)=>b.score-a.score).slice(0,3).map((x,i)=>`${i+1}. ${x.name} — ${x.score}`);return `🍻 ОПЕРАЦИЯ «ВЫЖИТЬ В БАКУ»\n\n${lines.length?lines.join('\n'):'Статистика пока по нулям 😴'}\n\n🏆 Уровень легендарности: ${getScore()} очков\n\n👥 Рейтинг:\n${leaders.join('\n')}`;}
function renderAll(){renderStats();renderScore();renderAchievements();renderPlayers();}

function runLoader(){
  const bar=document.querySelector('#loaderBar');const percent=document.querySelector('#loaderPercent');const text=document.querySelector('#loaderText');
  const duration=4200;const started=performance.now();let lastStep=-1;
  function frame(now){const progress=Math.min(1,(now-started)/duration);const value=Math.floor(progress*100);bar.style.width=`${value}%`;percent.textContent=`${value}%`;const step=Math.min(loaderSteps.length-1,Math.floor(progress*loaderSteps.length));if(step!==lastStep){lastStep=step;text.textContent=loaderSteps[step];}if(progress<1){requestAnimationFrame(frame);}else{setTimeout(()=>{document.querySelector('#loader').classList.add('hide');document.querySelector('#app').classList.add('ready');vibrate('medium');},350);}}
  requestAnimationFrame(frame);
}

document.querySelector('#resetBtn').onclick=()=>{const reset=()=>{items.forEach(x=>state[x.id]=0);saveState();renderAll();vibrate('heavy');};if(tg?.showConfirm)tg.showConfirm('Точно сбросить всю статистику?',ok=>ok&&reset());else if(confirm('Точно сбросить всю статистику?'))reset();};
document.querySelector('#shareBtn').onclick=async()=>{const text=buildShareText();const url=`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;if(tg?.openTelegramLink)tg.openTelegramLink(url);else if(navigator.share)await navigator.share({title:'Выживание Мушвига в Баку',text,url:location.href});else{await navigator.clipboard.writeText(text);showMessage('Итоги скопированы');}};
document.querySelector('#quoteBtn').onclick=changeQuote;
document.querySelector('#addPlayerBtn').onclick=addPlayer;
document.querySelector('#photoInput').onchange=event=>{[...event.target.files].slice(0,9-photos.length).forEach(file=>{if(file.size>1200000){showMessage('Фото слишком большое. Выбери файл меньше 1,2 МБ.');return;}const reader=new FileReader();reader.onload=()=>{photos.unshift(reader.result);photos=photos.slice(0,9);state.photos+=1;saveState();savePhotos();renderAll();renderGallery();};reader.readAsDataURL(file);});event.target.value='';};

renderAll();renderGallery();updateCountdown();changePhrase();document.querySelector('#mushvigQuote').textContent=mushvigQuotes[quoteIndex];runLoader();
setInterval(updateCountdown,1000);setInterval(changePhrase,4300);setInterval(changeQuote,12000);