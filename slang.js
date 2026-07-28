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
renderAll();