const MUSHVIG_BIRTHDAY=new Date('2026-08-20T00:00:00+04:00');
let birthdayCelebrated=sessionStorage.getItem('mushvigBirthdayCelebrated')==='1';
function updateBirthdayCountdown(){
  const card=document.querySelector('#birthdayCard');
  if(!card)return;
  const now=new Date();
  const end=new Date('2026-08-21T00:00:00+04:00');
  const title=document.querySelector('#birthdayTitle');
  const subtitle=document.querySelector('#birthdaySubtitle');
  const phrase=document.querySelector('#birthdayPhrase');
  if(now>=MUSHVIG_BIRTHDAY&&now<end){
    card.classList.add('today');
    title.textContent='👑 ДЕНЬ ВЕЛИКОЙ ОЛИГАРХИИ МУШВИГА';
    subtitle.textContent='Сегодня правила отменены. Мушвиг официально повышен до пожизненного олигарха бакинского отдыха.';
    phrase.textContent='🥂 Козырно родился — культурно отмечаем!';
    if(!birthdayCelebrated){birthdayCelebrated=true;sessionStorage.setItem('mushvigBirthdayCelebrated','1');launchConfetti?.();}
    return;
  }
  card.classList.remove('today');
  let diff=MUSHVIG_BIRTHDAY-now;
  if(diff<0){
    title.textContent='👑 ОЛИГАРХИЯ СОСТОЯЛАСЬ';
    subtitle.textContent='20 августа вошло в историю как официальный День великой олигархии Мушвига.';
    phrase.textContent='Ширка-курка — схема-белка. День рождения прошёл козырно.';
    diff=0;
  }
  const ids=['birthdayDays','birthdayHours','birthdayMinutes','birthdaySeconds'];
  const values=[Math.floor(diff/86400000),Math.floor(diff/3600000)%24,Math.floor(diff/60000)%60,Math.floor(diff/1000)%60];
  ids.forEach((id,i)=>{const el=document.querySelector('#'+id);if(el)el.textContent=String(values[i]).padStart(2,'0');});
}
updateBirthdayCountdown();
setInterval(updateBirthdayCountdown,1000);