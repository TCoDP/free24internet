import type { ManualGuideCopy, ManualPlatform } from "./types";

const ru: Record<ManualPlatform, ManualGuideCopy> = {
  ios: {
    metaTitle: "Инструкция VPN для iOS",
    title: "Инструкция для iOS",
    intro:
      "Чтобы подключить VPN на iPhone или iPad, выполните шаги ниже. Рекомендуем клиент Happ; также подойдут V2Box и V2rayTun.",
    notices: [
      "Нужна актуальная версия iOS (в оригинальных материалах указан минимум iOS 17 — при необходимости обновите систему).",
      "Скриншоты ниже на примере V2rayTun — в Happ и V2Box шаги обычно те же: найдите импорт профиля из буфера обмена.",
    ],
    backToList: "Все инструкции",
    steps: [
      {
        heading: "1. Скопируйте ключ",
        paragraphs: [
          "Скопируйте ключ подписки из Telegram-бота или из личного кабинета на сайте. Поддерживаются VLESS, Trojan и другие форматы, которые понимают Happ, V2Box и V2rayTun.",
        ],
        links: [
          { text: "Telegram-бот", href: "https://t.me/free24_internet_bot" },
          { text: "Happ в App Store", href: "https://apps.apple.com/us/app/happ-proxy-utility/id6504287215" },
          { text: "V2Box в App Store", href: "https://apps.apple.com/nl/app/v2box-v2ray-client/id6446814690" },
          { text: "V2rayTun в App Store", href: "https://apps.apple.com/app/v2raytun/id6476628951" },
        ],
      },
      {
        heading: "2. Установите и откройте Happ (или другое приложение)",
        paragraphs: [
          "Установите Happ из App Store (предпочтительно) или V2Box / V2rayTun — затем откройте приложение.",
        ],
      },
      {
        heading: "3. Добавьте ключ из буфера обмена",
        paragraphs: [
          "Нажмите «+» в правом верхнем углу и выберите вариант добавления из буфера обмена.",
        ],
        images: [
          { file: "ios/01.png", caption: "Нажмите на значок плюса" },
          { file: "ios/02.png", caption: "Нажмите «Добавить из буфера»" },
        ],
      },
      {
        heading: "4. Подключитесь",
        paragraphs: [
          "После появления профиля нажмите кнопку подключения на главном экране приложения.",
        ],
        images: [{ file: "ios/03.png", caption: "VPN успешно подключён" }],
      },
    ],
  },
  android: {
    metaTitle: "Инструкция VPN для Android",
    title: "Инструкция для Android",
    intro:
      "Ниже на скриншотах показан пример на HiddifyNG (установка из APK). Также можно использовать клиенты из Google Play — V2Box, Happ или Hiddify: установите приложение и импортируйте ключ из буфера обмена (обычно пункт вроде «Import from clipboard» / «Добавить из буфера»).",
    notices: [
      "Ссылки на приложения в Google Play: V2Box, Happ, Hiddify — см. шаг 1.",
    ],
    backToList: "Все инструкции",
    steps: [
      {
        heading: "1. Скопируйте ключ",
        paragraphs: [
          "Скопируйте ключ из Telegram-бота или личного кабинета. Обычно поддерживаются Outline, VLESS, Trojan — конкретный список зависит от выданного вам ключа.",
        ],
        links: [
          { text: "Telegram-бот", href: "https://t.me/free24_internet_bot" },
          {
            text: "Скачать HiddifyNG (APK)",
            href: "https://github.com/hiddify/HiddifyNG/releases/download/v6.0.4/HiddifyNG.apk",
          },
          {
            text: "V2Box — Google Play",
            href: "https://play.google.com/store/apps/details?id=dev.hexasoftware.v2box",
          },
          {
            text: "Happ — Google Play",
            href: "https://play.google.com/store/apps/details?id=com.happproxy",
          },
          {
            text: "Hiddify — Google Play",
            href: "https://play.google.com/store/apps/details?id=app.hiddify.com",
          },
        ],
      },
      {
        heading: "2. Откройте приложение",
        paragraphs: [
          "Запустите HiddifyNG. На главном экране вы увидите кнопки импорта и подключения.",
        ],
        images: [{ file: "android/01.png", caption: "Главный экран приложения" }],
      },
      {
        heading: "3. Импорт из буфера",
        paragraphs: [
          "Нажмите «Import from clipboard», затем подтвердите добавление профиля.",
        ],
        images: [
          { file: "android/02.png", caption: "Нажмите «Подтвердить»" },
          { file: "android/03.png", caption: "Ключ успешно добавлен" },
        ],
      },
      {
        heading: "4. Подключение",
        paragraphs: ["Нажмите «Click to connect», затем подтвердите запрос «ОК»."],
        images: [
          { file: "android/04.png", caption: "Нажмите «ОК»" },
          { file: "android/05.png", caption: "VPN успешно подключён" },
        ],
      },
      {
        heading: "Замечание по сообщениям об ошибках",
        paragraphs: [
          "Если появляется сообщение timeout или похожая ошибка, это часто не означает, что VPN не работает — приложение может некорректно измерять пинг. Попробуйте открыть сайт в браузере с включённым VPN.",
        ],
        images: [{ file: "android/06.png", caption: "Такое сообщение не всегда означает проблему с доступом" }],
      },
    ],
  },
  macos: {
    metaTitle: "Инструкция VPN для macOS",
    title: "Инструкция для macOS",
    intro: "Подключение через клиент V2Box из App Store.",
    notices: [
      "Рекомендуется macOS 14 (Sonoma) или новее — на более старых версиях клиент или протоколы могут быть недоступны.",
    ],
    backToList: "Все инструкции",
    steps: [
      {
        heading: "1. Скопируйте ключ",
        paragraphs: [
          "Скопируйте ключ из Telegram-бота или личного кабинета. Для V2Box обычно подходят Outline, VLESS, Trojan и другие распространённые форматы.",
        ],
        links: [
          { text: "Telegram-бот", href: "https://t.me/free24_internet_bot" },
          { text: "V2Box в App Store", href: "https://apps.apple.com/app/v2box-v2ray-client/id6446814690" },
        ],
      },
      {
        heading: "2. Установите V2Box",
        paragraphs: [
          "Откройте V2Box. Если приложения нет — установите его из Mac App Store.",
        ],
      },
      {
        heading: "3. Вставьте ключ из буфера",
        paragraphs: [
          "Нажмите «+» в правом верхнем углу и выберите вставку ключа из буфера обмена.",
        ],
        images: [
          { file: "macos/01.png", caption: "Кнопка «+» в правом верхнем углу" },
          { file: "macos/02.png", caption: "Импорт из буфера обмена" },
        ],
      },
      {
        heading: "4. Активируйте профиль и подключитесь",
        paragraphs: [
          "Ключ появится в списке — выберите его. Затем откройте вкладку «Home» и нажмите подключение. Зелёный статус означает успешное соединение.",
        ],
        images: [
          { file: "macos/03.png", caption: "Профиль добавлен и выбран" },
          { file: "macos/04.png", caption: "VPN успешно подключён" },
        ],
      },
    ],
  },
  windows: {
    metaTitle: "Инструкция VPN для Windows",
    title: "Инструкция для Windows",
    intro: "Подключение через приложение Hiddify (Microsoft Store). Запускайте клиент от имени администратора.",
    notices: [
      "Рекомендуется Windows 10 или новее.",
      "Для Windows часто выдаётся ключ VLESS — копируйте его целиком из бота или кабинета.",
    ],
    backToList: "Все инструкции",
    steps: [
      {
        heading: "1. Скопируйте ключ",
        paragraphs: [
          "Скопируйте VLESS-ключ (или выданную вам ссылку подписки) в буфер обмена.",
        ],
        links: [
          { text: "Telegram-бот", href: "https://t.me/free24_internet_bot" },
          {
            text: "Найти Hiddify в Microsoft Store",
            href: "https://apps.microsoft.com/store/search/Hiddify",
          },
        ],
      },
      {
        heading: "2. Установите и запустите Hiddify от имени администратора",
        paragraphs: [
          "Установите Hiddify из Microsoft Store. Затем запустите программу от имени администратора (через меню ПКМ по ярлыку или исполняемому файлу).",
        ],
      },
      {
        heading: "3. Новый профиль из буфера",
        paragraphs: [
          "В приложении нажмите «Новый профиль», чтобы добавить ключ из буфера обмена.",
        ],
        images: [
          { file: "windows/01.jpg", caption: "Новый профиль" },
          { file: "windows/02.jpg", caption: "Подтверждение добавления ключа" },
        ],
      },
      {
        heading: "4. Режим VPN и подключение",
        paragraphs: [
          "При необходимости откройте быстрые настройки и включите режим VPN, затем нажмите «Подключиться».",
        ],
        images: [
          { file: "windows/03.jpg", caption: "Включение режима VPN" },
          { file: "windows/04.jpg", caption: "Кнопка «Подключиться»" },
        ],
      },
      {
        heading: "Если приложение просит перезапуск от администратора",
        paragraphs: [
          "Полностью закройте Hiddify: нажатие на крестик часто лишь сворачивает окно. Закройте приложение и из области уведомлений (трей), затем снова запустите его от имени администратора.",
        ],
        images: [{ file: "windows/05.jpg", caption: "Пример сообщения — следуйте подсказке и перезапустите клиент" }],
      },
      {
        heading: "Ошибка «Таймаут»",
        paragraphs: [
          "Сообщение о таймауте при проверке пинга часто не влияет на работу туннеля: клиент может не доходить до сервера проверки. Проверьте доступ к сайтам с включённым VPN.",
        ],
      },
    ],
  },
};

const en: Record<ManualPlatform, ManualGuideCopy> = {
  ios: {
    metaTitle: "VPN setup for iOS",
    title: "iOS setup",
    intro:
      "Follow the steps below to connect on iPhone or iPad. We recommend Happ; V2Box and V2rayTun also work.",
    notices: [
      "Use a recent iOS version (the original guide mentioned iOS 17+; update if the app is unavailable).",
      "The screenshots below use V2rayTun as an example — in Happ and V2Box the flow is usually the same: find import from clipboard.",
    ],
    backToList: "All guides",
    steps: [
      {
        heading: "1. Copy your key",
        paragraphs: [
          "Copy the subscription key from our Telegram bot or from your account dashboard. Happ, V2Box, and V2rayTun support VLESS, Trojan, and other formats we issue.",
        ],
        links: [
          { text: "Telegram bot", href: "https://t.me/free24_internet_bot" },
          { text: "Happ on the App Store", href: "https://apps.apple.com/us/app/happ-proxy-utility/id6504287215" },
          { text: "V2Box on the App Store", href: "https://apps.apple.com/nl/app/v2box-v2ray-client/id6446814690" },
          { text: "V2rayTun on the App Store", href: "https://apps.apple.com/app/v2raytun/id6476628951" },
        ],
      },
      {
        heading: "2. Install and open Happ (or another client)",
        paragraphs: [
          "Install Happ from the App Store (preferred) or V2Box / V2rayTun, then open the app.",
        ],
      },
      {
        heading: "3. Add from clipboard",
        paragraphs: ["Tap “+” in the top-right corner and choose the option to add from the clipboard."],
        images: [
          { file: "ios/01.png", caption: "Tap the plus button" },
          { file: "ios/02.png", caption: "Choose “Add from clipboard”" },
        ],
      },
      {
        heading: "4. Connect",
        paragraphs: ["After the profile appears, tap the connect button on the main screen."],
        images: [{ file: "ios/03.png", caption: "VPN connected" }],
      },
    ],
  },
  android: {
    metaTitle: "VPN setup for Android",
    title: "Android setup",
    intro:
      "The screenshots below use HiddifyNG (APK install). You can also use Google Play clients — V2Box, Happ, or Hiddify: install the app, then import the key from the clipboard (often “Import from clipboard” or similar).",
    notices: ["Google Play links for V2Box, Happ, and Hiddify are in step 1."],
    backToList: "All guides",
    steps: [
      {
        heading: "1. Copy your key",
        paragraphs: [
          "Copy the key from the Telegram bot or your dashboard. Supported formats depend on your key (Outline, VLESS, Trojan, etc.).",
        ],
        links: [
          { text: "Telegram bot", href: "https://t.me/free24_internet_bot" },
          {
            text: "Download HiddifyNG (APK)",
            href: "https://github.com/hiddify/HiddifyNG/releases/download/v6.0.4/HiddifyNG.apk",
          },
          {
            text: "V2Box — Google Play",
            href: "https://play.google.com/store/apps/details?id=dev.hexasoftware.v2box",
          },
          {
            text: "Happ — Google Play",
            href: "https://play.google.com/store/apps/details?id=com.happproxy",
          },
          {
            text: "Hiddify — Google Play",
            href: "https://play.google.com/store/apps/details?id=app.hiddify.com",
          },
        ],
      },
      {
        heading: "2. Open the app",
        paragraphs: ["Launch HiddifyNG. You should see import and connect controls on the home screen."],
        images: [{ file: "android/01.png", caption: "App home screen" }],
      },
      {
        heading: "3. Import from clipboard",
        paragraphs: ["Tap “Import from clipboard”, then confirm adding the profile."],
        images: [
          { file: "android/02.png", caption: "Tap Confirm" },
          { file: "android/03.png", caption: "Profile added" },
        ],
      },
      {
        heading: "4. Connect",
        paragraphs: ["Tap “Click to connect”, then approve the “OK” prompt."],
        images: [
          { file: "android/04.png", caption: "Tap OK" },
          { file: "android/05.png", caption: "VPN connected" },
        ],
      },
      {
        heading: "About timeout / error messages",
        paragraphs: [
          "A timeout warning does not always mean the VPN is broken—the app may fail to measure ping. Try browsing with VPN enabled.",
        ],
        images: [{ file: "android/06.png", caption: "This type of message is not always a connectivity failure" }],
      },
    ],
  },
  macos: {
    metaTitle: "VPN setup for macOS",
    title: "macOS setup",
    intro: "Using the V2Box client from the Mac App Store.",
    notices: ["macOS 14 (Sonoma) or newer is recommended for best compatibility."],
    backToList: "All guides",
    steps: [
      {
        heading: "1. Copy your key",
        paragraphs: [
          "Copy the key from the Telegram bot or your dashboard. V2Box typically supports Outline, VLESS, Trojan, and similar formats.",
        ],
        links: [
          { text: "Telegram bot", href: "https://t.me/free24_internet_bot" },
          { text: "V2Box on the App Store", href: "https://apps.apple.com/app/v2box-v2ray-client/id6446814690" },
        ],
      },
      {
        heading: "2. Install V2Box",
        paragraphs: ["Open V2Box, or install it from the Mac App Store first."],
      },
      {
        heading: "3. Paste from clipboard",
        paragraphs: ["Click “+” in the top-right corner and choose paste / import from clipboard."],
        images: [
          { file: "macos/01.png", caption: "The plus button" },
          { file: "macos/02.png", caption: "Import from clipboard" },
        ],
      },
      {
        heading: "4. Select profile and connect",
        paragraphs: [
          "The profile appears in the list—select it. Open the “Home” tab and start the connection. A green status means you are connected.",
        ],
        images: [
          { file: "macos/03.png", caption: "Profile added and selected" },
          { file: "macos/04.png", caption: "VPN connected" },
        ],
      },
    ],
  },
  windows: {
    metaTitle: "VPN setup for Windows",
    title: "Windows setup",
    intro: "Using Hiddify from the Microsoft Store. Run the app as Administrator when prompted.",
    notices: ["Windows 10 or newer is recommended.", "Keys are often VLESS—copy the full string from the bot or dashboard."],
    backToList: "All guides",
    steps: [
      {
        heading: "1. Copy your key",
        paragraphs: ["Copy the VLESS key (or subscription URL) to the clipboard."],
        links: [
          { text: "Telegram bot", href: "https://t.me/free24_internet_bot" },
          { text: "Find Hiddify in the Microsoft Store", href: "https://apps.microsoft.com/store/search/Hiddify" },
        ],
      },
      {
        heading: "2. Install and run as Administrator",
        paragraphs: [
          "Install Hiddify from the Microsoft Store, then launch it as Administrator (right-click the shortcut or executable).",
        ],
      },
      {
        heading: "3. New profile from clipboard",
        paragraphs: ["In the app, use “New profile” to add the key from the clipboard."],
        images: [
          { file: "windows/01.jpg", caption: "New profile" },
          { file: "windows/02.jpg", caption: "Confirm adding the key" },
        ],
      },
      {
        heading: "4. VPN mode and connect",
        paragraphs: [
          "If needed, open quick settings, enable VPN mode, then press Connect.",
        ],
        images: [
          { file: "windows/03.jpg", caption: "Enable VPN mode" },
          { file: "windows/04.jpg", caption: "Connect" },
        ],
      },
      {
        heading: "If you are asked to restart as Administrator",
        paragraphs: [
          "Fully quit Hiddify: the close button may only minimize the window. Exit from the system tray, then start the app again as Administrator.",
        ],
        images: [{ file: "windows/05.jpg", caption: "Example prompt — follow it and restart the client" }],
      },
      {
        heading: "“Timeout” errors",
        paragraphs: [
          "Ping timeouts are often cosmetic—the client may not reach the measurement servers. Try browsing with VPN enabled.",
        ],
      },
    ],
  },
};

export const manualsGuideByLocale = {
  ru,
  en,
} as const;
