# Mishanya — Baku Survival Tour

Telegram Mini App и обычный мобильный сайт с таймером до прилёта Мишани в Баку 8 августа 2026 года.

## Возможности

- живой обратный отсчёт;
- счётчики пива, кальянов, водки, шашлыков, моря и ночных поездок;
- автоматическое сохранение на устройстве;
- очки легендарности;
- отправка результата через Telegram;
- поддержка Telegram Web App API.

## Публикация через GitHub Pages

1. Откройте **Settings → Pages**.
2. В разделе **Build and deployment** выберите **Deploy from a branch**.
3. Branch: **main**, папка: **/(root)**.
4. Нажмите **Save**.

Адрес сайта после публикации:

`https://xsamikx-creator.github.io/Mishanya/`

## Подключение к Telegram

В BotFather откройте своего бота, затем:

1. **Bot Settings → Menu Button → Configure menu button**.
2. Вставьте URL GitHub Pages.
3. Назовите кнопку, например **Открыть тур**.

Дата и время прилёта задаются в начале файла `app.js`:

```js
const ARRIVAL = new Date('2026-08-08T12:00:00+04:00');
```
