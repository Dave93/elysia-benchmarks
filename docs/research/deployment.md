# Django/Python deployment для честного Elysia vs Django API benchmark

**Срез: 2026-09-16.** Исследование официальной документации, release metadata и исходников; приложения не реализовывались, производительность не измерялась. Ниже отдельно обозначены подтверждённые факты и предлагаемая методика.

## Краткая рекомендация

Основной современный профиль: **CPython 3.14.7 с GIL + Django 6.1.1 + Uvicorn 0.53.0 + uvloop 0.22.1 + httptools 0.8.0**, Django ASGI, psycopg 3.3.5 с ускоренной реализацией и явным пулом psycopg-pool 3.3.1. Но **обязательный парный результат для ORM-нагрузки — синхронный Django под Gunicorn gthread**: async ORM в Django 6.1.1 остаётся адаптером синхронной работы, поэтому ASGI не следует заранее объявлять лучшим вариантом Django.

Granian 2.8.3 — обязательная проверка чувствительности к HTTP-серверу, не доказанный победитель до измерений. Результаты маркировать полным стеком, а не просто «Python»/«Django». Разделить ORM и raw SQL; прямой `AsyncConnectionPool` — native-async DB-профиль **без Django ORM**, а не настройка, превращающая ORM в native async.

## 1. Проверенные стабильные версии

Проверены PyPI JSON (`info.version`, даты загрузки артефактов, отсутствие `yanked`) и официальные страницы Python/Django. Все приведённые PyPI версии финальные, опубликованы не позднее даты среза. Это доступность пакета, **не проверка совместной установки и работоспособности на целевой платформе**.

| Компонент | Версия | Дата выпуска/загрузки | Первичный источник |
|---|---:|---|---|
| CPython | 3.14.7 | 2026-08-05 | [Python release](https://www.python.org/downloads/release/python-3147/), [Downloads](https://www.python.org/downloads/) |
| Django | 6.1.1 | 2026-09-02 | [Downloads](https://www.djangoproject.com/download/), [PyPI JSON](https://pypi.org/pypi/Django/json) |
| Uvicorn | 0.53.0 | 2026-09-14 | [PyPI JSON](https://pypi.org/pypi/uvicorn/json) |
| uvloop | 0.22.1 | 2025-10-16 | [PyPI JSON](https://pypi.org/pypi/uvloop/json) |
| httptools | 0.8.0 | 2026-05-25 | [PyPI JSON](https://pypi.org/pypi/httptools/json) |
| Granian | 2.8.3 | 2026-09-14 | [PyPI JSON](https://pypi.org/pypi/granian/json) |
| Gunicorn | 26.2.0 | 2026-08-24 | [PyPI JSON](https://pypi.org/pypi/gunicorn/json) |
| psycopg | 3.3.5 | 2026-08-31 | [PyPI JSON](https://pypi.org/pypi/psycopg/json) |
| psycopg-pool | 3.3.1 | 2026-05-01 | [PyPI JSON](https://pypi.org/pypi/psycopg-pool/json) |
| asgiref | 3.12.1 | 2026-07-14 | [PyPI JSON](https://pypi.org/pypi/asgiref/json) |

Django 6.1 поддерживает Python 3.12–3.14; 6.2 — ещё development, а не основной кандидат. Для LTS-чувствительности доступен **Django 5.2.17** по официальной странице downloads. Не выводить доступность релиза из roadmap. Psycopg docs на момент чтения озаглавлены `3.3.6.dev1`: это **не** подтверждение стабильной 3.3.6. Источники `main/master/latest` могут меняться; ниже ключевые выводы подкреплены release-tag исходниками. Зафиксировать lockfile, wheel hashes, Python build и digest образа до запуска.

## 2. Async-синтаксис не означает native-async PostgreSQL

**Подтверждено для Django 6.1.1:**

- `async def` view под ASGI позволяет event loop обслуживать другие запросы во время `await`. Под WSGI async view запускается в отдельном одноразовом loop; это не полноценный async request stack.
- ORM предоставляет `aget()`, `acreate()`, `acount()`, async iteration. Однако [исходник QuerySet 6.1.1](https://raw.githubusercontent.com/django/django/6.1.1/django/db/models/query.py) прямо показывает `aget → await sync_to_async(self.get)(...)`, аналогично `acount` и `acreate`. Это **синхронный ORM/DB-путь в потоке**, а не вызов psycopg `AsyncConnection`.
- [PostgreSQL backend 6.1.1](https://raw.githubusercontent.com/django/django/6.1.1/django/db/backends/postgresql/base.py) использует `ConnectionPool`, не `AsyncConnectionPool`; при отсутствии пула — `Database.connect()` в sync `get_new_connection()`.
- Транзакции в async ORM-режиме пока не поддержаны: транзакционную операцию следует целиком выполнять в одной sync-функции через `sync_to_async()`. Не разбивать одну транзакцию на независимо адаптированные шаги.
- Нельзя «ускорять» ORM через `DJANGO_ALLOW_ASYNC_UNSAFE` или бездумное `thread_sensitive=False`.
- Важная поправка к распространённому утверждению «весь ASGI ORM сериализуется в один поток»: [ASGIHandler 6.1.1](https://raw.githubusercontent.com/django/django/6.1.1/django/core/handlers/asgi.py) создаёт `ThreadSensitiveContext()` на запрос. Thread-sensitive операции одного запроса сериализуются, но разные запросы получают свои контексты/потоки. Пул соединений и GIL остаются общими ограничителями процесса.

Основание: [Django 6.1 asynchronous support](https://docs.djangoproject.com/en/6.1/topics/async/). Sync middleware добавляет адаптацию; встроенное middleware поддерживает оба режима, стороннее следует проверять. Не закладывать фиксированную «штрафную 1 ms» как закон: стоимость зависит от версии, пути адаптации и GIL contention.

**Native-async DB:** psycopg предоставляет `AsyncConnection`, `AsyncCursor`, `AsyncConnectionPool`; ожидание DB происходит через asyncio, без переноса каждого запроса в thread-sensitive ORM. Но обращения через **одно** соединение всё равно сериализуются, курсоры разделяют транзакцию. Для параллельных запросов нужны разные соединения. См. [Psycopg concurrent operations](https://www.psycopg.org/psycopg3/docs/advanced/async.html).

Следствие для выводов: Elysia + async SQL-driver против Django ORM — допустимое сравнение прикладных стеков, но не изолированное сравнение HTTP-framework overhead. Для последнего нужны отдельно no-DB и одинаковый raw SQL, одинаковые возвращаемые данные и транзакционная семантика.

## 3. Пулы и бюджет PostgreSQL

[Django database notes](https://docs.djangoproject.com/en/6.1/ref/databases/#connection-pool) подтверждают:

- `OPTIONS["pool"]` — `True` либо словарь параметров psycopg `ConnectionPool`; требуется psycopg 3 и отдельный пакет pool.
- При пуле **`CONN_MAX_AGE=0` обязателен**. «Закрытие» Django connection возвращает физическое соединение в пул, а не создаёт новый TCP connection на каждый request.
- ASGI без пула тоже требует отключённых persistent connections; поэтому сравнивать такой cold-connect Django с постоянно прогретым пулом Elysia — плохой основной дизайн.
- Пул отдельный **на alias и процесс**. Для одного alias суммарный максимум = `W × P`, где `W` — процессы, `P` — `max_size` одного пула. `min_size` также умножается.

**Предложение:** одинаковый глобальный DB-budget `B` у обоих стеков, распределённый по worker-пулам. Например `B=32`: при `W=1` пул 32, при `W=4` каждый пул 8. Это стартовая точка, не универсальный optimum; sensitivity `B=8/32/64` при неизменном CPU-budget. Для steady-state можно фиксировать `min_size=max_size=P`; дождаться прогрева **всех** worker-пулов до измерений. Одинаковыми сделать pool timeout, политику проверок, idle/lifetime и DB isolation/autocommit.

[Psycopg pool docs](https://www.psycopg.org/psycopg3/docs/advanced/pool.html) описывают очередь при исчерпании пула, фоновые потоки создания соединений, `wait()` и `get_stats()`. Записывать `requests_waiting`, `requests_queued`, `requests_wait_ms`, ошибки и фактические DB connections. Это отличает HTTP/GIL bottleneck от ожидания свободного соединения. Не открывать DB connections до fork; psycopg connections не process-safe.

Для driver-варианта выбрать `psycopg[binary]` либо `psycopg[c]`, проверить фактический `psycopg.pq.__impl__` и версию libpq; не допустить случайной pure-Python реализации только на одной конфигурации. Отдельно учитывать prepared statements: Django backend по умолчанию использует client-side binding и `prepare_threshold=None`; raw-driver/Bun defaults могут отличаться. Их нужно согласовать в raw-SQL comparison или явно назвать частью сравнения стеков.

## 4. Серверы: что реально меняется

### Uvicorn + uvloop + httptools

[Settings release 0.53.0](https://raw.githubusercontent.com/Kludex/uvicorn/0.53.0/docs/settings.md) выделяют uvloop и httptools как высокопроизводительные реализации. Указывать оба явно, а не полагаться на `auto`/случайно установленные extras. uvloop не подходит для Windows/PyPy, httptools — для PyPy. Основной стенд лучше Linux, одинаковый для обоих стеков.

[Deployment 0.53.0](https://raw.githubusercontent.com/Kludex/uvicorn/0.53.0/docs/deployment/index.md): встроенный `--workers` использует spawn; Gunicorn — pre-fork. Модуль `uvicorn.workers` deprecated, несмотря на оставшиеся примеры с ним в документации; для такого production manager нужен отдельный `uvicorn-worker`. Для бенчмарка встроенного manager Uvicorn достаточно, дополнительный supervisor не обязан улучшать throughput.

В 0.53.0 появились и другие варианты loop/parser; `zttp` отмечен experimental. Не подменять проверенный uvloop/httptools новейшей экспериментальной конфигурацией без отдельной маркировки. `--limit-concurrency` возвращает 503 при превышении, а не просто ставит запросы в очередь.

### Granian

[README release 2.8.3](https://raw.githubusercontent.com/emmett-framework/granian/v2.8.3/README.md): HTTP на Rust Hyper/Tokio, поддержаны ASGI и WSGI; **Django не следует запускать как RSGI**. Для GIL-build `workers` — процессы; `runtime-threads` — Rust I/O threads, не Python application workers. `blocking-threads` относится к sync/WSGI interop; в ASGI его настройка не управляет потоками ORM, создаваемыми asgiref.

Для обычного Django без lifespan использовать `--interface asginl`: [dispatch в common.py 2.8.3](https://raw.githubusercontent.com/emmett-framework/granian/v2.8.3/granian/server/common.py) направляет ASGINL в ASGI worker без lifespan, ASGI — в lifespan worker. При собственном native-async DB-pool lifecycle потребуется ASGI lifespan wrapper и обычный `asgi`.

Caveat: `backpressure` фактически ограничивает accept/соединения, включая keep-alive, а не только активные SQL-запросы. Не приравнивать его автоматически к pool size: это может блокировать новые соединения при наличии idle keep-alive. Семантика не эквивалентна Uvicorn 503 limit.

### Gunicorn WSGI gthread

[Официальный design](https://gunicorn.org/design/) описывает gthread как пул потоков на процесс с keep-alive. Default `sync` worker обслуживает один request и **закрывает соединение после ответа**; это плохой единственный соперник keep-alive Elysia. Поэтому для ORM-сравнения использовать `gthread`, явно указать threads и keep-alive, а view оставить синхронным.

Рекомендация Gunicorn `(2×cores)+1` — стартовая production-эвристика, **не правило честности бенчмарка**. В главном resource-normalized тесте число процессов и CPU-budget задаются протоколом; oversubscription исследуется отдельно.

## 5. Предлагаемая матрица (не результаты измерений)

Все команды ниже — спецификация будущего запуска, не реализованные приложения. `project.*` — placeholders. Основной транспорт: HTTP/1.1, keep-alive, без TLS/proxy/compression, только изолированный нагрузочный стенд; одинаковые bytes/status/content type и middleware-функции. Production deployment с proxy/TLS измерять отдельным профилем у обеих сторон.

| Профиль | Конфигурация | Назначение |
|---|---|---|
| **A: главный ASGI** | Uvicorn; async view + async ORM API; pool | Современный типичный async-facing Django, честно обозначенный thread-adapted ORM |
| **B: обязательный ORM companion** | Gunicorn gthread; sync view + тот же ORM; тот же pool-budget | Не наказывать Django за ненужные sync↔async crossings |
| C: сервер sensitivity | Granian ASGINL; **то же приложение A** | Изолирует замену HTTP-сервера |
| D: native-async SQL | Uvicorn + psycopg AsyncConnectionPool, без ORM | Сравнение равного raw SQL с async SQL Elysia; отдельно от ORM |
| E: дополнительные | Uvicorn asyncio+h11; Granian WSGI для B; Django 5.2.17 | Loop/parser, sync server, LTS sensitivity — менять один фактор за раз |

Примеры главных launch-параметров:

```sh
# A: обычный Django ASGI без собственного lifespan
uvicorn project.asgi:application --host 0.0.0.0 --port 8000 \
  --workers W --loop uvloop --http httptools --interface asgi3 \
  --lifespan off --ws none --no-access-log --no-proxy-headers \
  --timeout-keep-alive 5 --backlog 2048

# B: T=8 как старт; обязательный sweep T=1/4/8/16/32 для ORM
# Access log оставить выключенным; не использовать --preload с открытыми DB-пулами.
gunicorn project.wsgi:application --bind 0.0.0.0:8000 \
  --worker-class gthread --workers W --threads T --keep-alive 5 --backlog 2048

# C: HTTP/1, без lifespan; uvloop тот же, что в A
granian project.asgi:application --host 0.0.0.0 --port 8000 \
  --interface asginl --http 1 --workers W --runtime-threads 1 \
  --loop uvloop --task-impl asyncio --no-ws --no-access-log --backlog 2048
```

`W`/`T` заменить числами. У C явно зафиксировать backpressure по уровню клиентских connections так, чтобы он не становился случайным ограничителем; записать effective default/значение. Для D **не** копировать `lifespan off`: async pool открывается/прогревается/закрывается в корректном lifecycle каждого worker. У B высокая клиентская concurrency не равна числу одновременно исполняемых views: максимум `W×T`, DB параллелизм дополнительно ограничен `B`.

### Учёт workers, GIL и CPU

1. **Одноядерный профиль:** один application worker у обеих сторон и одинаковый лимит в 1 CPU для **всего дерева процессов/потоков** приложения. Один процесс без affinity/quota не гарантирует один core: Rust I/O, driver/pool threads и runtime threads тоже потребляют CPU.
2. **Многоядерный профиль:** одинаковые `N` доступных CPU, старт `W=N` у Django и эквивалентное масштабирование Elysia/Bun. Дополнительный sweep `W` под неизменной CPU/memory quota. Не сравнивать 1 Bun worker с Django на всех cores без явной метки.
3. GIL обычного CPython ограничивает параллельное исполнение Python-кода внутри одного интерпретатора; ожидание I/O и часть native-кода не эквивалентны Python CPU-work. Потоки gthread помогают перекрывать DB I/O, но не превращают `T=32` в 32 независимых Python CPU-core. Granian Rust HTTP path также не делает Django ORM без-GIL.
4. CPU, memory и thread count измерять для master + всех workers и служебных потоков, а не одного PID. DB и load generator — отдельные ресурсы. Сумма RSS может повторно учитывать shared pages; для Linux предпочесть также cgroup memory/PSS.
5. Free-threaded CPython 3.14 **официально поддержан Python**, но это отдельный build, не default и не гарантия готовности всех расширений. [Python HOWTO](https://docs.python.org/3.14/howto/free-threading-python.html) предупреждает, что import расширения может включить GIL обратно; проверять `sys._is_gil_enabled()` после imports. Granian 2.8.3 отдельно называет свою free-threaded поддержку experimental; там workers уже **потоки одного интерпретатора**, не процессы. Только дополнительная серия, с отдельным пересчётом пулов/памяти и compatibility tests.

Итоговый отчёт должен показывать throughput **успешных** ответов, p50/p95/p99, errors/timeouts/503, CPU, memory, DB pool waits и число соединений. Прогрев, повторения, перемешивание порядка конфигураций и проверка корректности ответов обязательны. Не выбирать победившую конфигурацию задним числом без публикации всей заранее заданной матрицы.
