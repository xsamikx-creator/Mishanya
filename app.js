const ARRIVAL = new Date('2026-08-08T12:00:00+04:00');
const STORAGE_KEY = 'mishanya-survival-stats-v1';

const items = [
  { id: 'beer', icon: '🍺', title: 'Пиво', unit: 'бутылок', points: 2 },
  { id: 'hookah', icon: '💨', title: 'Кальяны', unit: 'кальянов', points: 5 },
  { id: 'vodka', icon: '🥃', title: 'Водка', unit: 'бутылок', points: 8 },
  { id: 'kebab', icon: '🍢', title: 'Шашлык', unit: 'порций', points: 4 },
  { id: 'sea', icon: '🌊', title: 'Море', unit: 'походов', points: 10 },
  { id: 'taxi', icon: '🚕', title: 'Ночные покатушки', unit: 'поездок', points: 6 }
];

const state = loadState();
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0b0d12');
  tg.setBackgroundColor('#080a0f');
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

function renderStats() {
  const container = document.querySelector('#stats');
  const template = document.querySelector('#statTemplate');
  container.innerHTML = '';

  items.forEach(item => {
    const node = template.content.cloneNode(true);
    node.querySelector('.stat-icon').textContent = item.icon;
    node.querySelector('h3').textContent = item.title;
    node.querySelector('p').textContent = item.unit;
    const value = node.querySelector('.stat-controls strong');
    value.textContent = state[item.id];

    node.querySelector('.plus').addEventListener('click', () => {
      state[item.id] += 1;
      saveState();
      vibrate('medium');
      renderStats();
      renderScore();
    });

    node.querySelector('.minus').addEventListener('click', () => {
      state[item.id] = Math.max(0, state[item.id] - 1);
      saveState();
      vibrate();
      renderStats();
      renderScore();
    });

    container.appendChild(node);
  });
}

function renderScore() {
  const score = items.reduce((sum, item) => sum + state[item.id] * item.points, 0);
  document.querySelector('#score').textContent = score;
}

function updateCountdown() {
  const now = new Date();
  let diff = ARRIVAL - now;
  const label = document.querySelector('#countdownLabel');

  if (diff <= 0) {
    diff = 0;
    label.textContent = 'Мишаня уже в Баку. Выживание началось!';
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;

  document.querySelector('#days').textContent = String(days).padStart(2, '0');
  document.querySelector('#hours').textContent = String(hours).padStart(2, '0');
  document.querySelector('#minutes').textContent = String(minutes).padStart(2, '0');
  document.querySelector('#seconds').textContent = String(seconds).padStart(2, '0');
}

function buildShareText() {
  const lines = items
    .filter(item => state[item.id] > 0)
    .map(item => `${item.icon} ${item.title}: ${state[item.id]}`);
  const score = items.reduce((sum, item) => sum + state[item.id] * item.points, 0);
  return `MISHANYA SURVIVAL TOUR — BAKU 2026\n\n${lines.length ? lines.join('\n') : 'Статистика пока по нулям 😴'}\n\n🏆 ${score} очков легендарности`;
}

document.querySelector('#resetBtn').addEventListener('click', () => {
  const reset = () => {
    items.forEach(item => state[item.id] = 0);
    saveState();
    renderStats();
    renderScore();
    vibrate('heavy');
  };

  if (tg?.showConfirm) tg.showConfirm('Точно сбросить всю статистику?', ok => ok && reset());
  else if (confirm('Точно сбросить всю статистику?')) reset();
});

document.querySelector('#shareBtn').addEventListener('click', async () => {
  const text = buildShareText();
  const url = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else if (navigator.share) await navigator.share({ title: 'Mishanya Survival Tour', text, url: location.href });
  else await navigator.clipboard.writeText(text);
});

renderStats();
renderScore();
updateCountdown();
setInterval(updateCountdown, 1000);
