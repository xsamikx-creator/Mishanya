const ARRIVAL = new Date('2026-08-08T12:00:00+04:00');
const STORAGE_KEY = 'mishanya-baku-stats-v2';

const items = [
  { id: 'beer', icon: '🍺', title: 'Выпито пива', unit: 'бутылок', points: 2 },
  { id: 'hookah', icon: '💨', title: 'Выкурено кальянов', unit: 'кальянов', points: 5 },
  { id: 'vodka', icon: '🥃', title: 'Выпито водки', unit: 'бутылок', points: 8 },
  { id: 'kebab', icon: '🥩', title: 'Съедено шашлыков', unit: 'порций', points: 4 },
  { id: 'sea', icon: '🌊', title: 'Поездок на море', unit: 'раз', points: 10 },
  { id: 'taxi', icon: '🚕', title: 'Ночных поездок', unit: 'поездок', points: 6 },
  { id: 'coffee', icon: '☕', title: 'Выпито кофе', unit: 'чашек', points: 2 },
  { id: 'sleep', icon: '😴', title: 'Проспано до обеда', unit: 'дней', points: 4 },
  { id: 'memes', icon: '😂', title: 'Создано мемов', unit: 'штук', points: 1 },
  { id: 'photos', icon: '📸', title: 'Сделано фотографий', unit: 'кадров', points: 1 }
];

const phrases = [
  '🍺 Запас пива пополняется...',
  '🥩 Мангал уже разогревается...',
  '🌊 Каспий волнуется в ожидании...',
  '💨 Кальянщики натирают колбы...',
  '🫀 Печень подаёт заявление на отпуск...',
  '🚕 Таксисты уже ищут Мишаню...',
  '☀️ Бакинское солнце готовит испытание...',
  '✈️ Самолёт ещё далеко, а легенда уже началась...',
  '⚠️ Уровень безумия постепенно растёт...',
  '🍢 Шашлык просит не забыть про лаваш...'
];

const state = loadState();
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0b0d12');
  tg.setBackgroundColor('#080a0f');
  tg.disableVerticalSwipes?.();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Object.fromEntries(items.map(item => [item.id, Number(saved?.[item.id]) || 0]));
  } catch {
    return Object.fromEntries(items.map(item => [item.id, 0]));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function vibrate(type = 'light') {
  tg?.HapticFeedback?.impactOccurred(type);
}

function getScore() {
  return items.reduce((sum, item) => sum + state[item.id] * item.points, 0);
}

function renderStats() {
  const container = document.querySelector('#stats');
  const template = document.querySelector('#statTemplate');
  container.innerHTML = '';

  items.forEach(item => {
    const node = template.content.cloneNode(true);
    node.querySelector('.stat-icon').textContent = item.icon;
    node.querySelector('h3').textContent = item.title;
    node.querySelector('p').textContent = item.unit;
    node.querySelector('.stat-controls strong').textContent = state[item.id];

    node.querySelector('.plus').addEventListener('click', () => changeValue(item.id, 1));
    node.querySelector('.minus').addEventListener('click', () => changeValue(item.id, -1));
    container.appendChild(node);
  });
}

function changeValue(id, amount) {
  state[id] = Math.max(0, state[id] + amount);
  saveState();
  vibrate(amount > 0 ? 'medium' : 'light');
  renderAll();
}

function renderScore() {
  const score = getScore();
  document.querySelector('#score').textContent = score;

  let status = '🟢 Мишаня пока держится';
  if (score >= 50) status = '🟡 Уже начинает путать дни недели';
  if (score >= 120) status = '🟠 Опасный уровень веселья';
  if (score >= 250) status = '🔴 Требуется срочный шашлык';
  if (score >= 500) status = '🏆 Мишаня официально стал легендой Баку';
  document.querySelector('#status').textContent = status;

  let achievement = '🏆 Первое достижение ещё впереди';
  if (state.beer >= 1) achievement = '🏆 Открыто достижение: первое пиво';
  if (state.hookah >= 1) achievement = '🏆 Открыто достижение: первый кальян';
  if (state.sea >= 1) achievement = '🏆 Открыто достижение: Каспий увиден';
  if (state.kebab >= 5) achievement = '🏆 Открыто достижение: шашлычный мастер';
  if (state.beer >= 10) achievement = '🏆 Открыто достижение: десять бутылок пива';
  if (score >= 500) achievement = '👑 Главное достижение: легенда Баку';
  document.querySelector('#achievement').textContent = achievement;
}

function updateCountdown() {
  let diff = ARRIVAL - new Date();
  const label = document.querySelector('#countdownLabel');

  if (diff <= 0) {
    diff = 0;
    label.textContent = '🎉 Мишаня прибыл! Выживание официально началось!';
  }

  document.querySelector('#days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
  document.querySelector('#hours').textContent = String(Math.floor(diff / 3600000) % 24).padStart(2, '0');
  document.querySelector('#minutes').textContent = String(Math.floor(diff / 60000) % 60).padStart(2, '0');
  document.querySelector('#seconds').textContent = String(Math.floor(diff / 1000) % 60).padStart(2, '0');
}

function changePhrase() {
  document.querySelector('#funLine').textContent = phrases[Math.floor(Math.random() * phrases.length)];
}

function buildShareText() {
  const lines = items.filter(item => state[item.id] > 0).map(item => `${item.icon} ${item.title}: ${state[item.id]}`);
  return `🍻 ВЫЖИВАНИЕ МИШАНИ В БАКУ\n\n${lines.length ? lines.join('\n') : 'Статистика пока по нулям 😴'}\n\n🏆 Уровень легендарности: ${getScore()}`;
}

function renderAll() {
  renderStats();
  renderScore();
}

document.querySelector('#resetBtn').addEventListener('click', () => {
  const reset = () => {
    items.forEach(item => state[item.id] = 0);
    saveState();
    vibrate('heavy');
    renderAll();
  };
  if (tg?.showConfirm) tg.showConfirm('Точно сбросить всю статистику?', ok => ok && reset());
  else if (confirm('Точно сбросить всю статистику?')) reset();
});

document.querySelector('#shareBtn').addEventListener('click', async () => {
  const text = buildShareText();
  const url = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else if (navigator.share) await navigator.share({ title: 'Выживание Мишани в Баку', text, url: location.href });
  else await navigator.clipboard.writeText(text);
});

renderAll();
updateCountdown();
changePhrase();
setInterval(updateCountdown, 1000);
setInterval(changePhrase, 4500);
