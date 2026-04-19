# Free24Internet

Проект **Free24Internet** — сайт и инфраструктура для доступа к VPN (VLESS / Reality через панель **3X-UI**): регистрация, личный кабинет, тарифы, оплата, пробный период, рефералы, поддержка и связка с **Telegram-ботом**.

Публичный сайт: [free24internet.vip](https://free24internet.vip)

## Состав репозитория

| Каталог | Назначение |
|--------|------------|
| **`laravel/`** | Основное веб-приложение: **Laravel 11** + **Inertia.js** (Vue), Breeze-аутентификация, кабинет пользователя и админка, интеграции оплаты (Platega, Moneta), синхронизация сроков клиента VPN с `users.subscription_until`, импорт подписки по ссылке `/sub/{token}`. |
| **`vpn_bot/`** | Python-бот (**pyTelegramBotAPI**): меню, оплата через API сайта, выдача/продление ключей, те же пользователи в общей БД (поля `uuid`, `port`, `expire_time` и т.д.). |

Ранее в корне лежало приложение на Next.js — оно **снято с сопровождения**; актуальный стек — Laravel в `laravel/`.

## Возможности (кратко)

- Регистрация, вход, смена пароля, верификация e-mail (по настройкам).
- Личный кабинет: профиль, привязка Telegram, тарифы, баланс, рефералы, тикеты поддержки.
- Оплата тарифов и пополнение баланса; уведомления об успешной оплате.
- Пробный VPN с сайта и выдача VLESS; напоминания об окончании подписки/пробного периода (кабинет, e-mail при наличии адреса, Telegram при привязанном `tg_id`) — интервалы и включение: `laravel/config/subscription_reminders.php`, cron: `subscriptions:send-expiry-reminders` в `laravel/routes/console.php`.
- Админ-панель: пользователи, поддержка, платежи, настройки тарифов и др.
- Статьи и раздел мануалов на сайте.

## Требования

- **PHP** ≥ 8.2, расширения как у Laravel 11 (pdo_mysql, openssl, mbstring, …).
- **Composer**, **Node.js** + npm (сборка фронтенда Inertia/Vite).
- **MySQL** (общая база для сайта и бота).
- Для бота: **Python 3** и зависимости из `vpn_bot/` (виртуальное окружение рекомендуется).

## Быстрый старт (сайт)

```bash
cd laravel
cp .env.example .env
php artisan key:generate
# Укажите DB_*, APP_URL, почту, ключи платежей, VPN_PANEL_* и т.д.
composer install
php artisan migrate --force
npm ci
npm run build
php artisan storage:link   # при необходимости
```

Планировщик Laravel (напоминания, очереди при использовании `database`):

```bash
* * * * * cd /path/to/laravel && php artisan schedule:run >> /dev/null 2>&1
```

Подробности по командам Artisan — в [документации Laravel](https://laravel.com/docs).

## Telegram-бот

```bash
cd vpn_bot
cp .env.example .env
# Настройте BOT_TOKEN, доступ к MySQL, SITE_API_BASE, секреты оплаты и панели по примеру.
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python bot.py
```

Бот и сайт должны смотреть в **одну и ту же** базу пользователей и согласованные настройки API/секретов.

## Конфиденциальность

Не коммитьте файлы **`.env`** в корне `laravel/` и `vpn_bot/`. В репозитории только **`.env.example`** с плейсхолдерами. Секреты храните на сервере и в менеджере секретов.

## Репозиторий

Исходный код: [github.com/TCoDP/free24internet](https://github.com/TCoDP/free24internet)

## Лицензия

Уточните лицензию у владельцев репозитория; при отсутствии явного файла `LICENSE` использование кода третьими лицами не следует предполагать без разрешения.
