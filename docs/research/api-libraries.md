# API-библиотеки для честного Django vs Elysia benchmark

Дата среза: **2026-09-16**. Исследование первичных источников и локальная проверка Python-библиотек; реализации HTTP-приложения здесь нет. Семь заданных нагрузок: health, echo, me, users/:id, users с пагинацией, orders insert, cpu SHA256. Полный существующий контракт маршрутов в этой подзадаче не предоставлен, поэтому перечисленные ниже поля и политики — рекомендации к согласованию, а не утверждения о текущем приложении.

## Краткий вывод

**Основная современная Python-линия: CPython 3.14.7 (обычная GIL-сборка), Django 6.1.1 + Django Ninja 1.7.0 + Pydantic 2.13.5, orjson 3.12.0 для JSON, Django ORM с явной проекцией `.values(...)` для read-only DTO и PyJWT 2.14.0 для HS256.** Сервер: производственный Granian 2.8.3; ASGI и WSGI надо сопоставить на одинаковом CPU-бюджете, а не заранее объявлять ASGI победителем. Альтернатива сервера — Uvicorn 0.53.0 с `uvloop` и `httptools`, не его медленная h11-конфигурация как единственный соперник Bun.

**DRF 3.18.1 нужен отдельной репрезентативной линией**, поскольку Django != DRF, а стоимость DRF serializers/negotiation нельзя приписывать Python в целом. DRF также заслуживает orjson, корректного SQL, разумной пагинации и production-сервера. Не сравнивать оптимизированный Elysia с Django `runserver`, старым CPython, `DEBUG=True`, N+1, загрузкой всех моделей и лишним `COUNT(*)`.

Это рекомендация конфигураций для измерения, **не прогноз RPS и не доказательство победы Ninja/Granian**. Даже официальный микробенчмарк валидатора или JSON не предсказывает семь HTTP-нагрузок.

## 1. Какие версии действительно доступны

Проверены непосредственно Python.org, JSON API PyPI (`info.version`, файлы релиза, время первой загрузки, `yanked`) и npm registry. Все Python-пакеты таблицы имеют невозванные stable-релизы, опубликованные до даты среза. `requires_python` одного пакета не гарантирует совместимость всего стека — нужна установка и contract suite на выбранном Python.

| Компонент | Проверенная версия | Дата публикации (UTC, PyPI если не оговорено) | Роль |
|---|---:|---|---|
| CPython | **3.14.7** | 2026-08-05, Python.org | Текущий stable; **3.15 ещё prerelease** |
| CPython предыдущая ветка | 3.13.15 | 2026-08-05, Python.org | Runtime sensitivity |
| Django | **6.1.1** | 2026-09-02 | Основная новая ветка, Python >=3.12 |
| django-ninja | **1.7.0** | 2026-08-30 | Современный API-слой |
| djangorestframework | **3.18.1** | 2026-09-07 | Отдельная DRF-линия |
| pydantic | **2.13.5** | 2026-08-28 | Валидация; core тоже фиксировать lockfile |
| orjson | **3.12.0** | 2026-08-14 | JSON bytes |
| PyJWT | **2.14.0** | 2026-09-11 | JWT verify |
| granian | **2.8.3** | 2026-09-14 | ASGI/WSGI server |
| uvicorn | **0.53.0** | 2026-09-14 | Server sensitivity |
| psycopg | **3.3.5** | 2026-08-31 | PostgreSQL driver, если workload использует PostgreSQL |
| email-validator | **2.3.0** | 2025-08-26 | Только профиль EmailStr |
| uv | **0.12.15** | 2026-09-15 | Фиксировать версию инструмента сборки |
| Elysia npm `latest` | **1.4.30** | 2026-08-26 | Stable comparator |
| Elysia npm `next` | **2.0.0-beta.14** | 2026-09-07 | Только отдельно помеченный beta-профиль |

Первичные version sources: [Python downloads](https://www.python.org/downloads/), [Django JSON](https://pypi.org/pypi/Django/json), [Ninja JSON](https://pypi.org/pypi/django-ninja/json), [DRF JSON](https://pypi.org/pypi/djangorestframework/json), [Pydantic JSON](https://pypi.org/pypi/pydantic/json), [orjson JSON](https://pypi.org/pypi/orjson/json), [PyJWT JSON](https://pypi.org/pypi/PyJWT/json), [Granian JSON](https://pypi.org/pypi/granian/json), [Uvicorn JSON](https://pypi.org/pypi/uvicorn/json), [psycopg JSON](https://pypi.org/pypi/psycopg/json), [email-validator JSON](https://pypi.org/pypi/email-validator/json), [uv JSON](https://pypi.org/pypi/uv/json), [Elysia npm registry](https://registry.npmjs.org/elysia).

Локально обнаружены **CPython 3.13.12 и uv 0.9.15**: это не последние версии на дату среза. Во временном изолированном uv-проекте успешно установлены Django/Ninja/DRF/Pydantic/orjson/PyJWT из таблицы; разрешился `pydantic-core==2.46.5`, `asgiref==3.12.1`. Проверка была на **3.13.12**, а не на 3.14.7. Не выдавать этот факт за проверенную production-совместимость 3.14.7, драйвера, сервера и всех маршрутов.

## 2. Ninja + Pydantic 2 против DRF

Ninja предоставляет декларативные входные и выходные схемы. Его `response=` не только документирует: он **конвертирует, валидирует и ограничивает набор выходных полей**. DRF `Serializer` отдельно выполняет входную валидацию и преобразование объектов в representation; `ModelSerializer` автоматически добавляет поля, validators и CRUD-поведение. Это разные объёмы работы, а не два названия для одного JSON encoder. [S1, S2]

Рекомендуется:

- На Python modern baseline использовать обычные Ninja `Schema`, Pydantic 2 и стандартный маршрут Ninja, без обхода framework через готовый `HttpResponse` ради красивого health RPS.
- Схемы объявлять при импорте, `TypeAdapter` создавать один раз, не на каждый запрос. Конкретные `list`/`dict` предпочтительнее абстрактных `Sequence`/`Mapping`, когда тип известен. Не строить динамические ModelSchema для каждого объекта. [S3]
- На DRF использовать явный `Serializer` там, где API задаёт DTO, а не требует autogenerated model validation. Не заставлять DRF создавать отдельный serializer на каждый элемент списка: стандартный `many=True` — нормальная оптимизация.
- `ModelSerializer` + модели — отдельный **idiomatic DRF** профиль. Автоматические unique/FK validators могут делать дополнительные запросы; их нельзя молча удалить, если Elysia выполняет эквивалентные проверки. И наоборот, нельзя добавить их только Python и назвать SQL-workload одинаковым.
- Выходную проверку либо включить на обеих сторонах, либо выключить симметрично отдельным профилем. DRF `.data` не эквивалентна повторному `is_valid()` на response, а сериализация Pydantic сама по себе не всегда означает повторную валидацию уже существующей модели.
- Возвращаемые DTO должны содержать одинаковый allowlist полей. Нельзя ускорять Python/Elysia ценой возврата скрытых полей модели.

## 3. JSON: orjson — нормальная базовая оптимизация, но не магическая замена

Официальная документация Ninja прямо показывает `ORJSONRenderer`. Проверенный исходник установленного Ninja 1.7.0 использует по умолчанию `json.loads(request.body)` и `json.dumps(..., cls=NinjaJSONEncoder)`. Поэтому **установка Pydantic 2 не переводит весь JSON-path Ninja на Rust**, а смена renderer не меняет parser. [S4, S5]

Для основного оптимизированного профиля разумны `orjson.loads` входного JSON и `orjson.dumps` выходного DTO. Использовать официальные hooks parser/renderer, не переписывать Ninja. orjson возвращает UTF-8 `bytes`; не делать лишнее `.decode()` с последующим `.encode()` в Django. DRF предоставить такую же JSON-библиотеку для отдельного optimized-профиля. Ошибки parsing должны оставаться корректными 4xx, а не превращаться в 500. [S4, S6]

Семантические ограничения:

- Compact JSON, без indentation/sort_keys и без несимметричного gzip. Для stdlib-контроля — compact separators и `ensure_ascii=False`.
- Числа, `Decimal`, даты и timezone привести к общему контракту. orjson не сериализует `Decimal` нативно: нельзя использовать `default=str` для всех неизвестных объектов и случайно менять типы. Денежные величины лучше задавать одинаково: integer minor units либо decimal strings.
- Ограничить integer-поля безопасным диапазоном JavaScript (`±(2^53−1)`) или передавать bigint строками на обеих сторонах. Python int не равен JS Number.
- orjson отвергает входные `NaN`/`Infinity` и невалидный UTF-8, но на выходе нечисловые float превращает в `null`. Валидировать конечность чисел, а не считать разные JSON defaults одинаковыми.
- Согласовать даты `Z`/`+00:00`, точность времени, null/omitted, Unicode и content-type. Сравнивать разобранные значения, отдельно регистрировать размер payload; byte-identical JSON требовать только там, где это часть контракта.

Pydantic рекомендует `model_validate_json()` вместо `json.loads()` + `model_validate()` в общем случае. Но это **не drop-in настройка Ninja parser**: parser уже возвращает dict, а прямой вызов может создать второй validation pass и изменить strict-date поведение. Такой fast path — отдельная sensitivity-конфигурация после проверки HTTP-контракта, не обязательное вмешательство в baseline. [S3]

## 4. Strict validation: нельзя сравнивать только happy path

Pydantic по умолчанию делает coercion, а `ConfigDict(strict=True)` ограничивает его. Строгость и неизвестные ключи — **разные оси**: `extra='forbid'` нужно задавать отдельно; проверять вложенные объекты также. Строгая валидация JSON и Python dict различается, например для строковых дат. [S7]

Elysia автоматически приводит подходящие query-поля к типу схемы. `normalize` по документации по умолчанию включён и очищает неизвестные поля; `normalize:false` меняет поведение на ошибку для полей, не разрешённых схемой. Следовательно, `additionalProperties:false` без учёта normalizer ещё не доказывает совпадение с `extra='forbid'`. Для строгого профиля нужны явно согласованные schema/normalize settings и проверки на закреплённой версии Elysia. [S8, S9]

Локальная проверка Ninja/Pydantic и DRF (не Elysia) на версиях из таблицы, обычное поле int/bool/string и default serializers:

| Вход | Ninja default | Ninja strict + forbid | DRF default |
|---|---|---|---|
| int-поле: `"123"` | преобразует в 123 | ошибка | преобразует в 123 |
| int-поле: `true` | преобразует в 1 | ошибка | ошибка |
| int-поле: `123.0` | преобразует в 123 | ошибка | преобразует в 123 |
| bool-поле: `"true"` | преобразует в true | ошибка | преобразует в true |
| неизвестный ключ | отбрасывает | ошибка | отбрасывает |
| string-поле: `123` | ошибка | ошибка | преобразует в `"123"` |

DRF поведение подтверждается исходником: `CharField` допускает числовой input, `IntegerField` приводит строковое представление, `EmailField` использует Django EmailValidator. [S10]

**Рекомендуемый контракт:** JSON body — настоящие строки/числа/boolean без строковой coercion; body extras запрещены; numeric path/query — явно разрешённое преобразование текстовых параметров плюс bounds. Не включать глобальный strict int для query так, чтобы законное `?limit=20` перестало приниматься. Для JSON `1` против `1.0` отдельно решить: JS после JSON.parse не сохраняет лексическое различие; Pydantic StrictInt отвергает Python float. Нужна политика математически целого значения либо явно ограниченный набор fixtures, а не ложное обещание полной эквивалентности StrictInt и `t.Integer()`.

Contract suite до RPS: missing/null/empty, границы длины и диапазонов, дробный id, boolean вместо int, число вместо строки, вложенные extras, пустые/повторяющиеся query keys, nonfinite numbers, Unicode, одинаковая политика 400/422, структура и полнота ошибок. Нагрузку с невалидными запросами измерять отдельно: default error bodies различаются по объёму и production-политике Elysia. [S9]

### Email — особенно частая скрытая асимметрия

`EmailStr` вызывает `email-validator`, нормализует адрес и в проверенной версии Pydantic передаёт **`check_deliverability=False`**. DNS/MX в этом пути нет. Но проверки/нормализация гораздо богаче, чем наличие `@` или простой regexp. [S11]

Локально проверено с `email-validator==2.3.0`:

| Вход | Pydantic EmailStr | DRF EmailField |
|---|---|---|
| `User@EXAMPLE.COM` | `User@example.com` | сохраняет регистр домена |
| ` User@example.com ` | убирает внешние пробелы | убирает внешние пробелы |
| `John Doe <user@example.com>` | принимает, возвращает адрес | ошибка |
| `user@localhost` | ошибка | принимает |
| `a@b.c` | принимает | ошибка |
| `юзер@example.com` | принимает | ошибка |

Не объявлять `t.String({format:'email'})`, DRF EmailField и EmailStr эквивалентными без тестов. Для основного paired workload выбрать одинаково описанный ограниченный синтаксис (например, конкретный ASCII-поднабор), bounds и политику normalization, реализуемые штатными validators. Либо сохранить idiomatic email validators, но честно назвать это **разными библиотечными политиками** и вынести в отдельный профиль. Один успешный `user@example.com` не доказывает семантической эквивалентности.

Для GET-ответов, где email уже проверен при записи и TS проверяет только строку, Python не должен повторно запускать EmailStr на каждой строке списка. Выходная `str` здесь не отключение входной бизнес-валидации. Если повторная email-validation нужна — включить одинаковую работу на обеих сторонах.

## 5. ORM: проекция не является обходом Django

Официальная Django optimization guide рекомендует `values()`/`values_list()`, когда требуются значения, а не модельные объекты. `only()`/`defer()` ограничивают колонки, но **не устраняют создание model instances**; доступ к deferred field может породить дополнительный запрос. [S12]

- Для `users/:id` и страницы пользователей: `.values('id', ...явные поля...)`, фильтр по индексируемому id, одинаковые WHERE/ORDER BY/LIMIT/OFFSET, одинаковые типы DTO. Это сопоставимо с lightweight ORM, возвращающим JS row objects.
- Вариант `get()`/модели + схема полезен как hydration sensitivity. Сначала одинаковая проекция SQL; иначе delta смешивает лишние данные и создание объектов.
- Не хранить уже вычисленный QuerySet глобально: его cache превратит часть HTTP benchmark в in-memory ответы. Строить запрос на каждый запрос, как TS.
- Пагинация: одинаковый стабильный порядок, размер и offset, одинаковое наличие total. Если контракт — только список, не добавлять Ninja/DRF paginator, делающий count. Если total входит в контракт, оба стека считают его одинаково. Offset и keyset — разные сценарии, не незаметная оптимизация одной стороны.
- Orders: единичный insert на запрос, одинаковая транзакционная граница и durability, FK/unique checks, возвращаемые поля и момент ответа. Не сравнивать Python transaction+readback против TS одиночного insert без commit. Не подменять одиночную запись batch insert.
- Зафиксировать SQL, число round trips и результат query plan вне timed run. Разницу схем/индексов/пулов не списывать на framework.

Async ORM APIs не означают, что исчезли все синхронные границы. Django 6.1 по-прежнему документирует отсутствие async transactions и рекомендует sync-функцию для транзакционного блока с одним `sync_to_async` переходом. Для ASGI `CONN_MAX_AGE` отключить; использовать поддержанный pool. Размер пула считать **суммарно по процессам**, а не только «10 на worker» против «10 всего». Не включать `DJANGO_ALLOW_ASYNC_UNSAFE`. [S13]

## 6. JWT: PyJWT HS256 без искусственной нагрузки

PyJWT — достаточный прямой dependency для HS256; RSA/EC-пакеты не требуются только ради HMAC. `jwt.decode` действительно проверяет подпись. Список алгоритмов фиксированный **`['HS256']`**, не полученный из token header. Ключ одинаковой длины, минимум 32 случайных байта для реального HS256; тестовый секрет отдельный от production. [S14]

Согласовать `sub` строкой, наличие и проверку `exp`, `nbf`, `iat`, `iss`, `aud`, leeway. **Проверить claim, если присутствует, не равно требовать его наличие**: PyJWT `options['require']` и claim verification решают разные задачи. Не отключать подпись/expiration ради RPS и не кешировать результат декодирования одного токена.

Для `/me` заранее определить: это «JWT claims → JSON» или «JWT → lookup user → JSON». Дополнительный DB lookup через стандартный Django auth/SimpleJWT на одной стороне делает сценарии разными. Брать PyJWT напрямую нормально для claims-only endpoint; не добавлять session auth, blacklist, refresh rotation или permissions DB там, где Elysia их не делает.

Генерировать действительные токены до timed run, не подписывать новый JWT внутри каждого `/me`. Использовать фиксированный набор токенов сопоставимого размера, срок жизни покрывает warm-up и измерение, одинаковый алгоритм и secret encoding. Expired/missing-claim случаи — отдельные функциональные тесты.

## 7. Привязка к семи маршрутам

| Маршрут | Одинаковая измеряемая работа | Типичная нечестная разница |
|---|---|---|
| health | handler → небольшой JSON, без DB/auth | Elysia native static response против динамического Python handler |
| echo | JSON parse → input validation → DTO/response → JSON | возврат исходных bytes без parsing, разные extras/email policies |
| me | bearer parse + HS256 verify + agreed claims (+ DB только если нужен обоим) | Python дополнительно грузит auth.User |
| users/:id | path parse + один lookup с одинаковой проекцией | Python hydration всех колонок против TS selected row |
| users pagination | query coercion, stable order, одинаковая страница и total policy | только Python делает COUNT или N+1 |
| orders insert | body validation + согласованный insert/commit/return | разные транзакции/FK validation, рост таблицы между прогонами |
| cpu SHA256 | одинаковые bytes, iterations, digest chaining/encoding | Python pure loop SHA против native crypto TS или разное число хешей |

Elysia документирует `nativeStaticResponse` для inline values: если хочется сохранить этот production fast path, показать его отдельно как **static health**, а не как общую скорость API. [S9]

Для CPU использовать нормальный `hashlib.sha256`, а не SHA256, написанный на Python. Это benchmark native crypto + вызовов/runtime, **не чистой скорости языка**. CPython отпускает GIL, когда constructor/update получает **больше 2047 байт за один вызов**; цепочка хешей 32-байтовых digest устроена иначе. Размер блоков, OpenSSL/build и способ hex/binary перехода фиксируются. Для CPU concurrency дополнительные threads не обещают линейного ускорения. [S15]

## 8. Минимальная sensitivity-матрица

Не нужен полный комбинаторный взрыв. Менять одну ось относительно документированного baseline и не выбирать задним числом лучший результат каждого route для общего «победителя».

1. **Ninja optimized**: Pydantic 2, orjson parse/render, ORM projection, PyJWT, response schemas на обеих сторонах.
2. **DRF optimized**: explicit serializers + orjson, то же SQL/auth и контракт. Отдельно **DRF idiomatic**: ModelSerializer + hydrated models; явно показать дополнительную функциональность.
3. **JSON**: Ninja stdlib vs orjson, parser и renderer менять раздельно, затем вместе. Pydantic direct JSON fast path — дополнительный эксперимент, если действительно интегрирован без двойной валидации.
4. **ORM**: одинаковые SQL projection с dict vs hydrated models; затем при необходимости обычная full-model линия с честной маркировкой другой проекции.
5. **Validation**: matched strict contract vs idiomatic defaults; common email subset vs EmailStr/родные email validators; response validation on/off симметрично.
6. **Server/concurrency**: Granian ASGI vs Granian WSGI для подходящих views; Uvicorn+uvloop+httptools как контроль ASGI. Сначала 1 CPU budget, затем одинаковые N CPU/memory и total DB connections. Один worker не обязательно означает один физический поток/ядро.
7. **Runtime**: CPython 3.14.7 vs 3.13.15 при неизменном stack. Free-threaded/JIT — экспериментальные отдельные профили только после проверки поддержки extensions; не смешивать их с обычным CPython. Elysia stable 1.4.30 и beta 2.x не объединять.

Granian официально поддерживает ASGI/WSGI и документирован Django. Его собственные сравнения показывают зависимость от HTTP server/event loop, но это источник гипотез, а не готовая оценка Django workload. [S16, S17]

На всех линиях: `DEBUG=False`, без reload/watch, без access/SQL debug logging и profiler; одинаковая нужная middleware/security functionality, protocol/keepalive/compression/body limits. Для stateless bearer API отсутствие session middleware допустимо, но не переносится автоматически на cookie-auth API. Cold start отдельно, warm-up всех маршрутов до основного измерения. Отдельные route results, повторные прогоны с перемешанным порядком, median/разброс, p95/p99 и errors, CPU/RSS/DB saturation. Не включать время загрузки зависимостей в request latency.

## 9. Воспроизводимость: uv и lock

Зафиксировать `.python-version` с **3.14.7**, `pyproject.toml`, `uv.lock` с транзитивными версиями/артефактами, версию uv и базовый container image digest/CPU architecture. `requires-python` задаёт совместимость проекта, а не идентичный interpreter build. Сохранить фактические `python -VV`, `sysconfig` build flags, OpenSSL version, package list и server command. [S18]

Рекомендуемый процесс подготовки (не выполнялся в основном проекте):

```sh
uv python pin 3.14.7
uv lock
uv sync --locked --no-dev
uv run --locked python -VV
```

`uv sync --locked` отказывается обновлять неактуальный lock; `--frozen` использует lock **без проверки соответствия pyproject**. Поэтому frozen не «более строгая проверка». Обычный `uv run` может автоматически обновлять lock/sync; для воспроизводимого запуска использовать `--locked`, либо запускать заранее синхронизированный interpreter напрямую. Версию uv 0.12.15 фиксировать в build tooling; uv сам по себе не ускоряет сервер после запуска. [S19]

## 10. Локальная диагностическая проверка, не HTTP benchmark

В отдельном временном uv-проекте запущена небольшая проверка на macOS arm64, CPython **3.13.12**, uv **0.9.15**. Объект: `id=123`, `name='User'`, `active=True`, `tags=['api','bench']`; 7 повторов по 10 000 операций, ниже median. В обоих validation loops одинаковые входные bytes и orjson, создаётся новый результат; DRF serializer создаётся заново. Совпадение успешного JSON проверено assertion.

| Операция | Median, мкс/операцию |
|---|---:|
| Ninja Schema: orjson parse + model_validate + model_dump + orjson dump | 3.375 |
| DRF Serializer: orjson parse + is_valid + `.data` + orjson dump | 50.132 |
| stdlib compact UTF-8 dumps→bytes | 1.436 |
| orjson dumps→bytes | 0.076 |
| PyJWT HS256 verify, required sub/exp | 16.578 |

**Не использовать отношения этой таблицы как «Ninja быстрее DRF в X раз»**: отсутствуют HTTP, middleware, DB и отдельная выходная Ninja response-validation; native serializers имеют разную политику ошибок/дополнительных проверок, которую таблица coercion выше специально демонстрирует. GC в `timeit` по умолчанию отключён, CPU не изолирован, один маленький payload. Проверка полезна только для выявления потенциально дорогих библиотечных участков и обнаружения несовпадающих defaults. Итоговые выводы делать по семи эквивалентным HTTP маршрутам на основном закреплённом runtime.

## Первичные источники

Все ссылки просмотрены/проверены 2026-09-16; ссылки `latest`, `stable`, `master` со временем меняются. Для публикуемого benchmark сохранить версии/commit hashes и результаты contract tests.

- **S1 — Django Ninja, Response Schema:** https://django-ninja.dev/guides/response/ — выходная валидация, преобразование, фильтрация полей и caveat lazy QuerySet в async.
- **S2 — DRF, Serializers:** https://www.django-rest-framework.org/api-guide/serializers/ — Serializer/ModelSerializer, many=True, validation и representation.
- **S3 — Pydantic, Performance tips:** https://docs.pydantic.dev/latest/concepts/performance/ — direct JSON validation, reuse TypeAdapter, стоимость wrap/nested schemas.
- **S4 — Ninja, Response renderers:** https://django-ninja.dev/guides/response/response-renderers/ — официальный ORJSONRenderer.
- **S5 — Ninja, Request parsers:** https://django-ninja.dev/guides/input/request-parsers/ ; исходник установленной версии дополнительно проверен через `inspect.getsource(ninja.parser.Parser)` и `ninja.renderers.JSONRenderer`.
- **S6 — orjson, официальный README:** https://github.com/ijl/orjson — bytes/UTF-8, числа, Decimal/default, GIL, поддерживаемые Python и воспроизводимые library benchmarks.
- **S7 — Pydantic, Strict Mode:** https://docs.pydantic.dev/latest/concepts/strict_mode/ ; configuration: https://docs.pydantic.dev/latest/api/config/ — strict/coercion/extra.
- **S8 — Elysia, Validation:** https://elysiajs.com/essential/validation — query coercion, body/response schemas.
- **S9 — Elysia, Configuration:** https://elysiajs.com/patterns/configuration — normalize, nativeStaticResponse, production validation details.
- **S10 — DRF 3.18.1 fields source:** https://github.com/encode/django-rest-framework/blob/3.18.1/rest_framework/fields.py — CharField/IntegerField/BooleanField/EmailField.
- **S11 — Pydantic network types:** https://docs.pydantic.dev/latest/api/networks/ ; https://github.com/pydantic/pydantic/blob/v2.13.5/pydantic/networks.py — EmailStr, normalization, check_deliverability=False; локально также прочитан исходник установленной 2.13.5.
- **S12 — Django 6.1, Database access optimization:** https://docs.djangoproject.com/en/6.1/topics/db/optimization/ — values, only/defer, query evaluation/cache, count/exists, FK ids.
- **S13 — Django 6.1, Asynchronous support:** https://docs.djangoproject.com/en/6.1/topics/async/ — async ORM, transactions, connection pooling, sync/async transitions.
- **S14 — PyJWT API и Usage:** https://pyjwt.readthedocs.io/en/stable/api.html ; https://pyjwt.readthedocs.io/en/stable/usage.html — algorithms allowlist, signature/claims, HMAC key length.
- **S15 — CPython 3.14 hashlib:** https://docs.python.org/3.14/library/hashlib.html — native hashing, GIL threshold, OpenSSL/HACL fallback.
- **S16 — Django deployment with Granian:** https://docs.djangoproject.com/en/6.1/howto/deployment/asgi/granian/ ; https://docs.djangoproject.com/en/6.1/howto/deployment/wsgi/granian/ .
- **S17 — Granian maintainer benchmarks:** https://github.com/emmett-framework/granian/blob/master/benchmarks/vs.md — server configuration/methodology, не Django application benchmark.
- **S18 — uv Python versions:** https://docs.astral.sh/uv/concepts/python-versions/ — version pinning и interpreter selection.
- **S19 — uv locking and syncing:** https://docs.astral.sh/uv/concepts/projects/sync/ — locked/frozen/no-sync и automatic lock updates.
