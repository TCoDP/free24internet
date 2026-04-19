/**
 * Запрос одноразовой ссылки привязки Telegram (POST JSON → { url }).
 * Открытие во вкладке — только через явный клик по <a target="_blank"> (иначе браузер блокирует popup после await fetch).
 */
export async function fetchTelegramBindDeepLink(linkPostUrl) {
    const m = typeof document !== 'undefined' && document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    const xsrf = m ? decodeURIComponent(m[1]) : '';
    try {
        const res = await fetch(linkPostUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        const fromErrors = data.errors?.telegram;
        const errMsg =
            (Array.isArray(fromErrors) && fromErrors[0]) ||
            (typeof fromErrors === 'string' ? fromErrors : null) ||
            (typeof data.message === 'string' ? data.message : null) ||
            (!res.ok ? `Ошибка (${res.status})` : '');
        if (!res.ok || !data.url) {
            return { ok: false, error: errMsg || 'Не удалось получить ссылку' };
        }
        return { ok: true, url: data.url };
    } catch {
        return { ok: false, error: 'Нет соединения с сайтом' };
    }
}
