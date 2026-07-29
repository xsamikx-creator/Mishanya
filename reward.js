const REWARD_TARGET=200;
const REWARD_UNLOCK_KEY='mushvig-reward-200-unlocked-v1';
let rewardCelebrated=localStorage.getItem(REWARD_UNLOCK_KEY)==='1';

function renderReward(){
  const card=document.querySelector('#rewardCard');
  if(!card||typeof getScore!=='function')return;
  const score=getScore();
  const unlocked=score>=REWARD_TARGET;
  const percent=Math.min(100,Math.round(score/REWARD_TARGET*100));
  const bar=document.querySelector('#rewardProgressBar');
  const points=document.querySelector('#rewardPoints');
  const lock=document.querySelector('#rewardLock');
  const title=document.querySelector('#rewardTitle');
  if(bar)bar.style.width=`${percent}%`;
  if(points)points.textContent=unlocked?'200 / 200 — НАГРАДА ОТКРЫТА':`${Math.min(score,REWARD_TARGET)} / ${REWARD_TARGET} очков`;
  card.classList.toggle('unlocked',unlocked);
  if(lock)lock.textContent=unlocked?'🎁':'🔒';
  if(title)title.textContent=unlocked?'СЕКРЕТНАЯ НАГРАДА РАЗБЛОКИРОВАНА!':'Секретная награда';
  if(unlocked&&!rewardCelebrated){
    rewardCelebrated=true;
    localStorage.setItem(REWARD_UNLOCK_KEY,'1');
    setTimeout(()=>{
      if(typeof launchConfetti==='function')launchConfetti();
      if(typeof vibrate==='function')vibrate('heavy');
      if(typeof showMessage==='function')showMessage('🎁 200 очков набрано! Мушвиг разблокировал секретный подарок от Самира!');
    },350);
  }
}

const originalRewardRenderAll=window.renderAll;
if(typeof originalRewardRenderAll==='function'){
  window.renderAll=function(){originalRewardRenderAll();renderReward();};
}
renderReward();
setInterval(renderReward,1000);
