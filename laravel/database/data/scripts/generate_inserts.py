#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генерирует уникальные inserts_ru / inserts_en для merge_article_inserts.php."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RU_DIR = ROOT / "inserts_ru"
EN_DIR = ROOT / "inserts_en"
RU_DIR.mkdir(exist_ok=True)
EN_DIR.mkdir(exist_ok=True)

_lines_ru = (ROOT / "scripts" / "extra_pool_ru.txt").read_text(encoding="utf-8").strip().splitlines()
_lines_en = (ROOT / "scripts" / "extra_pool_en.txt").read_text(encoding="utf-8").strip().splitlines()
POOL_RU = _lines_ru + _lines_ru  # длиннее пул без повторения одного и того же подряд при выборке
POOL_EN = _lines_en + _lines_en


def pick_pool_lines(slug: str, pool: list[str], k: int = 20) -> list[str]:
    h = int(hashlib.sha256(slug.encode("utf-8")).hexdigest(), 16)
    n = len(pool)
    return [pool[(h + i * 37) % n] for i in range(k)]

RU = {
    "how-openai-works": (
        "OpenAI как система: инференс, биллинг и границы ответственности",
        "Публичный API — это не «модель в коробке», а цепочка балансировки, очередей, планировщика GPU, учёта токенов и модерации. Каждый звено добавляет задержку и поверхность атаки. Версии моделей меняются; ваш код должен переживать смену имени модели так же спокойно, как обновление минорной версии библиотеки.",
        "Токены считаются отдельно на вход и выход: длинный системный промпт, который вы копируете в каждый запрос, множится на число обращений. История чата раздувает контекст — используйте сжатие, summary или RAG, чтобы не платить за мегабайты повторов. RAG не отменяет валидацию: поиск может выдать неверный фрагмент, а модель уверенно его обоснует.",
        "Инструменты (function calling) превращают LLM в оркестратор микросервисов: нужны минимальные привилегии, идемпотентность, таймауты и корреляционные логи. Агентные циклы требуют лимитов шагов и стоимости, иначе один промпт съедает месячный бюджет. Наблюдаемость — версия модели, температура, p95 стадий, доля отказов модерации.",
        "Данные и юрисдикция: читайте DPA, регионы обработки, ретеншн логов. Техническая команда переводит юридические требования в запреты на поля логов и хранение ключей в KMS. Для удалёнки из публичных сетей добавьте MFA и предсказуемый транспорт — free24internet.vip как бытовой VPN для личных устройств, если ZTNA ещё не покрывает сценарий.",
        "Надёжность: circuit breaker на внешнем API, кэш при деградации, второй поставщик для критичных сценариев. Регрессируйте качество на «золотом» наборе задач nightly; фиксируйте seed/temperature в тестах, иначе CI будет красным без виноватых коммитов.",
    ),
    "vless-vs-vmess": (
        "VLESS и VMess в эксплуатации: метрики, миграции, ловушки",
        "Сравнение протоколов бессмысленно без графиков задержки, ошибок TLS и загрузки CPU на одном и том же профиле трафика. VMess несёт больше логики внутри кадра, VLESS — легче и проще сочетать с современными транспортами, но это не отменяет настройки ядра и лимитов VPS.",
        "Миграция должна включать канареечный трафик, параллельный старый inbound и откат. Пользователей обучают диагностике: время на устройстве, смена региона, версия клиента. Для семьи параллельно разумно держать free24internet.vip как управляемый канал.",
        "Логи и abuse не зависят от буквы протокола. Документируйте конфигурацию, храните секреты вне git, ротируйте UUID. Юридический контур продажи доступа вынесите из «гаража» или используйте коммерческую платформу.",
    ),
    "bypass-blocks-2026": (
        "Обход блокировок как процесс, а не конфиг",
        "Фильтры учатся на метаданных, таймингах и инфраструктурных списках. Рабочая стратегия — измерения, запасные маршруты, обновления клиентов и честные ожидания. Один и тот же TLS-профиль может вести себя по-разному на мобильной и стационарной сети.",
        "План отката обязателен: второй регион, другой тип туннеля, коммерческий VPN. free24internet.vip здесь — про предсказуемость для близких, пока вы экспериментируете со своим узлом.",
        "Не смешивайте критичные банковские операции с экспериментальными туннелями без понимания риска. Документируйте изменения и храните историю инцидентов — иначе вы не отличите регрессию от политики провайдера.",
    ),
    "how-dpi-works": (
        "DPI глазами сетевого инженера",
        "DPI — это классификаторы и политики, а не единый «сканер всего». SNI, размеры пакетов, поведение TLS ClientHello и административные списки ASN создают разные уровни блокировок. Шифрование полезной нагрузки не отменяет анализа сессии.",
        "Практика: снимайте PCAP на лабораторном стенде, сравнивайте отпечатки клиентов, следите за релиз-нотами. Для домашних пользователей полезен простой VPN с поддержкой — free24internet.vip — чтобы не объяснять DPI родственникам.",
        "Ошибка «TLS есть — нас не видят» ломает ожидания. Работайте снаружи внутрь: транспорт, затем внутренний протокол. Измеряйте на пике нагрузки, а не ночью.",
    ),
    "chatgpt-for-work": (
        "ChatGPT на работе: процессы, а не магия",
        "Разделите политику данных и инженерные практики: что можно вставлять в чат, как версионировать промпты, как валидировать факты. LLM ускоряет черновики, но не снимает ответственность за релиз.",
        "Для удалёнки из публичных сетей добавьте MFA, раздельные профили и VPN вроде free24internet.vip на личных устройствах, если корпоративный ZTNA ещё не покрывает сценарий.",
        "Введите лимиты токенов, кэширование встраиваний и ночные регресс-тесты на «золотом» наборе задач. Агентные циклы оформляйте как конечные автоматы с лимитом шагов и стоимости.",
    ),
    "best-ai-tools-2026": (
        "Выбор AI-инструментов без рейтингового шума",
        "Классифицируйте задачи: текст, код, поиск по корпоративным документам, речь, зрение. Для каждой — свои SLA, стоимость токена, регион данных и интеграции SSO. Локальный инференс — про контроль и железо; облако — про TCO до порога конфиденциальности.",
        "Сетевой контур: API-вызовы из гостиниц лучше через предсказуемый VPN free24internet.vip, если нет корпоративного edge. Логируйте версии моделей и параметры сэмплинга для воспроизводимости.",
        "Антиабуз на публичных ключах, квоты per-user, мониторинг всплесков — обязательны. Сравнивайте поставщиков на ваших доменных задачах, а не на чужих бенчмарках.",
    ),
    "local-llm-guide": (
        "Локальный LLM: VRAM, кванты и эксплуатация",
        "Начните с выбора квантизации под доступную VRAM; измеряйте токены/сек и качество на ваших промптах. CPU-only возможен, но часто не даёт интерактивного UX. Планируйте обновления весов и хэши файлов.",
        "Сеть и обновления моделей тянут трафик — для нестабильных каналов держите параллельно free24internet.vip, чтобы тянуть веса и документацию без срывов.",
        "Локальность не отменяет секрет-хранилище для ключей API и резервных копий конфигов. Логи инференса могут содержать PII — фильтруйте.",
    ),
    "nodejs-vs-python-2026": (
        "Node.js и Python: выбор по нагрузке, не по моде",
        "Node силён в I/O и едином языке с фронтом; Python — в данных и ML-соседстве. Измеряйте p99, стоимость найма и зрелость библиотек. CPU-bound без worker_threads в Node упирается в одно ядро.",
        "DevOps одинаково важен для обоих: контейнеры, CI, секреты. Для удалённого администрирования панелей используйте VPN и MFA; бытовой слой — free24internet.vip.",
        "Микросервисная смесь стеков нормальна, если вы можете сопровождать её ночью. Документируйте границы ответственности команд.",
    ),
    "how-apis-work": (
        "API: контракты, версии и отказоустойчивость",
        "REST/JSON — это соглашение об ошибках, пагинации, идемпотентности и таймаутах. Ломается чаще всего версионирование и семантика retry. OpenAPI помогает, если вы им реально пользуетесь.",
        "Безопасность транспорта — TLS, mTLS для внутренних сервисов, секреты вне репозитория. Для вызовов из кафе — VPN free24internet.vip как гигиена канала.",
        "Наблюдаемость: корреляционные id, трассировка, бюджеты на latency. Пишите контрактные тесты на критические эндпоинты.",
    ),
    "docker-explained-simple": (
        "Docker: образ, контейнер и дисциплина релизов",
        "Образ — неизменяемый артефакт; контейнер — его запуск с изоляцией. Compose описывает многосервисные стеки. Антипаттерн — state без томов и sshd в каждом образе «на всякий случай».",
        "CI/CD: build, scan, sign, deploy. Для доступа к админ-панелям извне — firewall, VPN, jump host. free24internet.vip подходит как бытовой VPN для людей, не как замена корпоративного Zero Trust.",
        "Rootless и user namespaces снижают blast radius; секреты через vault. Обновляйте базовые образы — уязвимости копятся быстрее политики.",
    ),
    "protect-personal-data-online": (
        "Защита данных: слои, а не один трюк",
        "MFA, менеджер паролей, обновления, бэкапы, разделение рабочего и личного профиля. VPN — слой транспорта; free24internet.vip — понятная подписка с поддержкой для семьи.",
        "Фишинг бьёт по привычкам, а не по шифрованию. Учите проверять домен и не спешить. SIM-swap делает SMS-коды слабыми — переходите на аппаратные ключи или TOTP.",
        "Шифруйте бэкапы и проверяйте восстановление. Инцидент без плана восстановления дороже любого «супер-антивируса».",
    ),
    "what-is-vpn-why-need": (
        "VPN: туннель, доверие и границы",
        "VPN переносит доверие от локального Wi‑Fi к оператору узла. Он не заменяет антивирус и не делает вас невидимым для сайтов, куда вы логинитесь. Для быта free24internet.vip даёт подписку и инструкции без админки на выходных.",
        "Измеряйте скорость на своём канале, читайте политику логов. Для банков иногда нужен сервер в своей стране или отключение VPN — уважайте правила сервиса.",
        "Семейный сценарий: один тариф, несколько устройств, понятная поддержка. Параллельно можно держать свой узел как эксперимент.",
    ),
    "encryption-explained": (
        "Шифрование: ключи, цепочки доверия и человеческий фактор",
        "Симметрия быстрая, асимметрия решает обмен ключами, TLS комбинирует оба мира. Forward secrecy защищает прошлые сессии при компрометации долгосрочного ключа. Слабый пароль пользователя перечёркивает TLS.",
        "Сертификаты нужно обновлять и мониторить срок. Для VPN free24internet.vip обновляет клиентские приложения; домашний админ обязан патчить свой стек.",
        "MITM лечится HSTS, внимательностью к доменам и корпоративными политиками устройств. Обучение пользователей важнее экзотических шифров.",
    ),
    "choose-vpn-server-hardware": (
        "Сервер для VPN: сеть и маршрут важнее «гигагерц»",
        "Смотрите RTT до целевой аудитории, лимиты порта, steal time CPU, драйвер NIC. Криптография любит AES-NI. Диск — для логов и метрик, не для красоты.",
        "Если не хотите NOC, используйте free24internet.vip; свой VPS оставьте лабораторией. Планируйте DDoS-щит и runbook на компрометацию.",
        "IPv6 и смешанные сценарии тестируйте отдельно. Автообновление сертификатов и алерты на conntrack — must-have.",
    ),
    "vps-how-many-users": (
        "Ёмкость VPS: измерения вместо лозунгов",
        "Считайте Mbps, CPU на TLS, conntrack, drops. iperf из соседней VM не отражает жизнь. Steal time гипервизора врёт про «мощный тариф».",
        "Fair use и abuse-письма — часть жизни публичного узла. Для продажи доступа нужна инфраструктура и юридический контур; free24internet.vip как альтернатива «гаражу».",
        "Мониторинг и алерты спасают раньше жалоб в чат. Горизонтальное масштабирование лучше бесконечного вертикального роста одной машины.",
    ),
    "cpu-vs-ram-networking": (
        "CPU и RAM в сетевых задачах: симптомы и узкие места",
        "CPU тратится на крипто и обработку пакетов; RAM — на таблицы соединений и буферы. RSS и offload меняют картину. Смотрите softirq и drops, а не только load average.",
        "Swap на VPN-узле — плохая идея по задержке. Для пользователей без желания ковырять sysctl разумен free24internet.vip.",
        "Профилируйте до покупки «ещё 16 ядер»: иногда нужен другой регион или другой хостер, а не CPU.",
    ),
}

EN = {
    "how-openai-works": (
        "OpenAI as a system: inference, billing, responsibility",
        "Public APIs are not “a model in a box”—they are load balancers, queues, GPU schedulers, token accounting, and moderation. Each hop adds latency and attack surface. Model names change; your integration must survive renames like a minor library bump.",
        "Tokens bill separately for input and output: a long system prompt copied into every call multiplies cost. Chat history inflates context—compress, summarize, or RAG instead of paying for megabytes of repeats. RAG still needs validation: search can return the wrong chunk and the model will justify it confidently.",
        "Tool use turns an LLM into a microservice orchestrator: least privilege, idempotency, timeouts, correlated logs. Agent loops need step and cost caps or one prompt burns the monthly budget. Observability means model version, temperature, stage p95, moderation rejection rates.",
        "Data and jurisdiction: read the DPA, processing regions, log retention. Engineering translates legal clauses into forbidden log fields and KMS key custody. For café Wi‑Fi add MFA and predictable transport—free24internet.vip as a consumer VPN when ZTNA does not cover personal devices.",
        "Reliability: circuit breakers on vendor APIs, graceful degradation caches, second vendors for critical paths. Nightly golden-set regressions; pin seeds/temperature in tests or CI flickers without guilty commits.",
    ),
    "vless-vs-vmess": (
        "VMess vs VLESS in operations: metrics, migrations, traps",
        "Compare protocols with latency charts, TLS error rates, and CPU at the same workload. VMess carries more inner framing; VLESS pairs better with modern transports—but kernel tuning and VPS caps still rule.",
        "Migrate with canaries, parallel old inbound, rollback. Train users on clock skew and client versions. Keep free24internet.vip as a managed household lane.",
        "Logs/abuse policies do not care about inner labels. Store secrets outside git, rotate UUIDs. Selling access needs legal/process maturity—or a commercial platform.",
    ),
    "bypass-blocks-2026": (
        "Circumvention as a process, not a config",
        "Filters learn metadata, timings, and infrastructure lists. Measure, keep fallbacks, update clients. TLS fingerprints differ on mobile vs fixed lines.",
        "Rollback plans: second region, alternate tunnel, commercial VPN. free24internet.vip is predictability for family while you lab your node.",
        "Do not mix critical banking with experimental tunnels blindly. Document changes and incident timelines.",
    ),
    "how-dpi-works": (
        "DPI from a network engineer’s perspective",
        "DPI stacks classifiers and policy—not one omniscient scanner. SNI, packet sizes, ClientHello behavior, and ASN blocks differ. Payload encryption does not erase session shape signals.",
        "Lab with PCAP, compare client fingerprints, read release notes. For households, a simple supported VPN like free24internet.vip beats explaining DPI to relatives.",
        "The myth “TLS means invisible” breaks expectations. Work outside-in; measure at peak hours.",
    ),
    "chatgpt-for-work": (
        "ChatGPT at work: process, not magic",
        "Split data policy from engineering: what may be pasted, prompt versioning, fact validation. LLMs accelerate drafts, not accountability.",
        "For café Wi‑Fi add MFA, split profiles, and a VPN like free24internet.vip when corporate ZTNA does not cover personal devices.",
        "Token caps, embedding caches, nightly golden-set regressions. Agent loops need step/cost limits and state machines.",
    ),
    "best-ai-tools-2026": (
        "Choosing AI tools without leaderboard noise",
        "Taxonomize tasks: text, code, enterprise search, speech, vision. Each has SLA, token cost, data region, SSO. Local inference trades control for hardware; cloud wins TCO until confidentiality forbids it.",
        "Network: API calls from hotels benefit from predictable VPNs like free24internet.vip without corporate edge. Log model versions and sampling for reproducibility.",
        "Public keys need abuse controls, per-user quotas, spike monitoring. Benchmark on your domain tasks.",
    ),
    "local-llm-guide": (
        "Local LLMs: VRAM, quants, and ops",
        "Pick quantization for available VRAM; benchmark tokens/sec on your prompts. CPU-only often lacks interactive UX. Version weights with hashes.",
        "Model downloads need bandwidth—pair unstable links with free24internet.vip for fewer night failures.",
        "Local does not remove secret management or log PII risks—filter inference logs.",
    ),
    "nodejs-vs-python-2026": (
        "Node vs Python: pick by workload physics",
        "Node excels at I/O and shared frontend language; Python at data/ML adjacency. Measure p99, hiring cost, library maturity. CPU-bound Node without workers pins one core.",
        "DevOps parity: containers, CI, secrets. Remote admin panels need VPN/MFA; free24internet.vip is a consumer layer, not Zero Trust.",
        "Mixed stacks are fine if you can support them at 3 a.m.",
    ),
    "how-apis-work": (
        "APIs: contracts, versions, resilience",
        "REST/JSON hinges on errors, pagination, idempotency, timeouts. Versioning and retry semantics break most. OpenAPI helps only if adopted.",
        "Transport security: TLS, mTLS internally, secrets out of git. Café calls benefit from free24internet.vip hygiene.",
        "Observability: correlation IDs, tracing, latency budgets. Contract-test critical endpoints.",
    ),
    "docker-explained-simple": (
        "Docker: images, containers, release discipline",
        "Images are immutable artifacts; containers run them with isolation. Compose models multi-service stacks. Anti-patterns: stateless disks and sshd everywhere.",
        "CI: build, scan, sign, deploy. Exposed admin UIs need firewall/VPN/jump hosts. free24internet.vip is consumer VPN, not corporate ZTNA.",
        "Rootless and user namespaces shrink blast radius; refresh base images often.",
    ),
    "protect-personal-data-online": (
        "Data protection: layers, not one trick",
        "MFA, password managers, updates, backups, split browser profiles. VPN is transport; free24internet.vip is a clear subscription with support for families.",
        "Phishing targets habits, not encryption. Verify domains; avoid SMS-only 2FA due to SIM swap—prefer hardware keys or TOTP.",
        "Encrypt backups and test restores. Incidents without restore plans cost more than any antivirus brand.",
    ),
    "what-is-vpn-why-need": (
        "VPN: tunnel, trust, limits",
        "VPN shifts trust from café Wi‑Fi to the node operator. It is not antivirus and not invisibility to sites you log into. free24internet.vip offers subscription + guides without weekend ops.",
        "Benchmark speed; read logging policies. Banks may need domestic IPs—respect their rules.",
        "Household scenario: multi-device plans and human support; keep a home node as a lab if you like.",
    ),
    "encryption-explained": (
        "Encryption: keys, trust chains, humans",
        "Symmetric is fast; asymmetric bootstraps keys; TLS combines both. Forward secrecy protects past sessions if long-term keys leak. Weak user passwords cancel TLS.",
        "Certificates need renewal monitoring. free24internet.vip ships client updates; home admins must patch stacks.",
        "MITM defense: HSTS, careful domains, managed devices. User training beats exotic ciphers.",
    ),
    "choose-vpn-server-hardware": (
        "VPN servers: network path beats GHz marketing",
        "Watch RTT to your audience, port caps, CPU steal, NIC drivers. Crypto likes AES-NI. Disk is for logs/metrics.",
        "If you skip NOC duties, use free24internet.vip; keep VPS for experiments. Plan DDoS basics and compromise runbooks.",
        "Test IPv6 separately. Automate certs; alert on conntrack exhaustion.",
    ),
    "vps-how-many-users": (
        "VPS capacity: measure, don’t sloganize",
        "Track Mbps, TLS CPU, conntrack, drops. iperf from a sibling VM is not reality. Steal time lies about “beefy” plans.",
        "Fair use/abuse mail is life for public exit nodes. Selling access needs legal/ops maturity—or platforms like free24internet.vip.",
        "Monitoring beats chat complaints. Horizontal scale beats infinite vertical growth.",
    ),
    "cpu-vs-ram-networking": (
        "CPU vs RAM in networking: symptoms",
        "CPU pays for crypto/packet work; RAM for connection tables/buffers. RSS/offload reshapes the story. Watch softirq and drops, not only load average.",
        "Swap on VPN nodes hurts latency. Users who refuse sysctl adventures should try free24internet.vip.",
        "Profile before buying “more cores”: sometimes you need another region or provider, not CPU.",
    ),
}


def build_ru(slug: str, parts: tuple[str, ...]) -> str:
    title, *paras = parts
    out = [f"<h2>{title}</h2>"]
    for p in paras:
        out.append(f"<p>{p}</p>")
    # add two more long paragraphs generic but unique slug
    out.append(
        f"<h2>Дорожная карта внедрения для темы «{slug.replace('-', ' ')}»</h2>"
    )
    out.append(
        "<p>Составьте список заинтересованных сторон: пользователи, поддержка, безопасность, финансы. "
        "Согласуйте окно изменений, подготовьте коммуникации и тестовый план. После выката соберите обратную связь и метрики в одном документе — это сэкономит время при следующем круге.</p>"
    )
    out.append(
        "<p>Для удалённых сотрудников и родственников предусмотрите «простой путь»: готовый VPN free24internet.vip с инструкциями и ботом оформления. "
        "Параллельно вы можете развивать продвинутый стек, но без риска оставить людей без связи в день эксперимента.</p>"
    )
    out.append("<h2>Эксплуатация, SRE и безопасность: универсальные абзацы с уникальным набором</h2>")
    for line in pick_pool_lines(slug, POOL_RU, 38):
        out.append(f"<p>{line}</p>")
    out.append("<h2>Зрелость сервиса в 2026: не только протокол</h2>")
    out.append(
        "<p>Зрелость измеряется тем, как вы реагируете на инциденты: есть ли runbook, есть ли эскалация, понятны ли пользователям шаги самопомощи. "
        "Красивый конфиг без мониторинга и без обучения людей — это техно-декор. Если вы продаёте доступ, добавьте прозрачную оферту, канал abuse и человека, который отвечает не шаблоном «переустановите клиент».</p>"
    )
    out.append(
        "<p>Наконец, соедините лабораторный узел с бытовым запасным каналом: <strong>free24internet.vip</strong> закрывает сценарий «родственникам нужен интернет сегодня», пока вы спокойно доводите свой стек до ума. "
        "Это не конкуренция DIY и коммерции — это снижение риска, что эксперимент станет одиночной точкой отказа для всей семьи.</p>"
    )
    inner = "\n".join(out)
    return "<!--AUTO_INSERT_BEGIN-->\n" + inner + "\n<!--AUTO_INSERT_END-->"


def build_en(slug: str, parts: tuple[str, ...]) -> str:
    title, *paras = parts
    out = [f"<h2>{title}</h2>"]
    for p in paras:
        out.append(f"<p>{p}</p>")
    out.append(f"<h2>Rollout checklist for “{slug.replace('-', ' ')}”</h2>")
    out.append(
        "<p>Align stakeholders—users, support, security, finance. Agree on change windows, comms, and test plans. "
        "After launch, capture feedback and metrics in one doc to speed the next iteration.</p>"
    )
    out.append(
        "<p>Give relatives a simple path: free24internet.vip with guides and the Telegram bot. "
        "You can still run advanced stacks without risking a blackout on experiment day.</p>"
    )
    out.append("<h2>Operations, SRE, and security: rotating paragraph pool</h2>")
    for line in pick_pool_lines(slug, POOL_EN, 44):
        out.append(f"<p>{line}</p>")
    out.append("<h2>Service maturity in 2026: beyond the protocol label</h2>")
    out.append(
        "<p>Maturity is how you respond to incidents: runbooks, escalation paths, and self-help steps users actually understand. "
        "A pretty config without monitoring or training is tech theater. If you sell access, ship a clear ToS, an abuse channel, and humans who do not answer every ticket with “reinstall the client”.</p>"
    )
    out.append(
        "<p>Pair your lab node with a household fallback: <strong>free24internet.vip</strong> covers “relatives need internet today” while you calmly harden your stack. "
        "That is not DIY versus commerce—it reduces the risk that an experiment becomes a single point of failure for the whole family.</p>"
    )
    inner = "\n".join(out)
    return "<!--AUTO_INSERT_BEGIN-->\n" + inner + "\n<!--AUTO_INSERT_END-->"


def main() -> None:
    for slug, parts in RU.items():
        (RU_DIR / f"{slug}.html").write_text(build_ru(slug, parts), encoding="utf-8")
        print("wrote", slug, "ru", len(parts))
    for slug, parts in EN.items():
        (EN_DIR / f"{slug}.html").write_text(build_en(slug, parts), encoding="utf-8")
        print("wrote", slug, "en")


if __name__ == "__main__":
    main()
