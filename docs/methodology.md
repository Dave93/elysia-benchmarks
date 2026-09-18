# Методика и границы выводов

## Что сравниваем

Полные API-стеки, а не «стоимость одного framework»: меняются runtime, ORM, SQL client, HTTP server, валидатор и сериализация. Исходный проект `../elysia_vs_nest` не изменялся; старые результаты сюда не импортированы.

| ID | Реализация | Конкурентность приложения | База |
|---|---|---|---|
| E | Elysia 2.0.0-beta.12, Bun 1.4.2, обычная сборка | один процесс/event loop | Drizzle 0.45.2 + Bun SQL, max 10 |
| N-sync | Django 6.1.1 + Ninja 1.7.0, CPython 3.14.6, Gunicorn 26.2.0 gthread | 1 application worker, 10 threads + master | Django ORM, psycopg binary 3.3.5 + pool max 10 |
| N-async | то же Django/Ninja, Uvicorn 0.53.0 + uvloop 0.22.1 + httptools 0.8.0 | 1 application worker, ASGI, per-request sync bridge ORM | тот же ORM/пул |
| E-aot | та же Elysia, AOT build | sensitivity, не входит в default main | тот же драйвер/пул |

Наличие Python 3.14.7 в upstream установлено ресёрчем, но **фактически стенд использует локальный 3.14.6**. Это осознанно зафиксированное ограничение, не утверждение «latest everywhere». Gunicorn обновлён до проверенного 26.2.0 до сравнения. Elysia beta сохранена для преемственности; stable 1.4.x и latest beta не подменяются автоматически. Lockfiles фиксируют транзитивные зависимости. `collectEnv()` записывает версии, команды и SHA256 lockfiles.

Рекомендованные research sensitivities (Granian, DRF, native async SQL, LTS, free-threaded CPython) **не реализованы в первом проходе** и не должны появляться в таблицах как измеренные. Конкурирующие советы о выборе ASGI/Granian разрешены не выбором ожидаемого победителя, а двумя заранее заданными sync/async профилями. Перед публикацией добавить Granian sensitivity и equal-resource Linux lane.

## Данные и маршрутная эквивалентность

Одна локальная база `bench_elysia_django`, 50 000 пользователей / 200 000 заказов. SQL-схема, индексы и seed PRNG взяты из исходного проекта. Seed не трогает `bench_saas`, не делает FORCE DROP, отказывается заменять уже существующую fixture без `RESEED=1`.

Семь исходных маршрутов. Health возвращает новый объект, echo валидирует и возвращает payload, me проверяет HS256 и читает пользователя, single/list выполняют один SELECT (list без COUNT), order один INSERT RETURNING всех полей, CPU 15 000 SHA256 над HEX-текстом предыдущего результата. CPU seed `elysia-vs-nest` сохранён намеренно. Нельзя включать CPU synthetic в единый «скорость Django API» показатель: это разные bindings криптобиблиотек, не только интерпретатор.

Django `.values()` — штатная проекция DTO без hydration. INSERT использует Django ORM с локальными subclasses полей `db_returning=True`, чтобы вернуть все столбцы, а не только ID. Это небольшая зависимость от ORM field/compiler hook: `api/tests.py` проверяет реальный SQL вне timed window. Не вводятся COUNT, SELECT после INSERT, full_clean, предварительный FK lookup или response schemas только на Python стороне. БД сама проверяет FK/precision; это fixture, не готовый commerce API.

## Валидация и сериализация

Pydantic 2 (Rust core), orjson renderer; input JSON parser Ninja оставлен стандартным. Нет искусственного native-JSON parser бонуса; orjson — документированный Ninja renderer. Output schemas отсутствуют у обеих реализаций. Для non-200 Python возвращает HttpResponse с тем же orjson, чтобы не добавлять response validation.

Типы JSON, keys, массивы и timestamps совпадают; canonical comparison не зависит от порядка ключей. `amount` — строка с двумя знаками; Decimal.from_float + ROUND_HALF_UP соответствует положительному JS toFixed для проверенных пограничных значений. Не заявляем математически полную эквивалентность всех IEEE754/Unicode inputs. Order ID/time проверяются на тип, формат, давность и существование вставки, затем исключаются из cross-run сравнения.

Elysia в pinned beta автоматически приводит integer-strings в body, но не строковый amount; unknown body keys удаляются. Python согласует это через BeforeValidator/extra=ignore/strict fields. Email использует тот же ASCII grammar TypeBox, без нормализации/DNS; это **aligned contract**, а не benchmark native EmailStr. Семантика Unicode length и extreme numbers требует расширенной матрицы до обобщения за пределы workload. 422 error bodies оставлены нативными и могут различаться: проверяется одинаковый отказ/HTTP status, а не искусственно одинаковая диагностика. Непроверенные malformed JSON / duplicate query / DB-overflow cases не выдаются за покрытые.

JWT использует библиотеки jose/PyJWT с allowlist HS256; общий fixture key унаследован из original и имеет 31 byte. PyJWT предупреждает при первом использовании; предупреждение не скрыто. Это не production key; предупредительный первый auth вызов происходит в parity/warmup, не в steady measurement. Issuer/audience не настроены, истёкшие и будущие nbf токены отклоняются; подпись и алгоритм проверяются. Частные coercion правила JWT subject остаются ограничением edge-case parity.

## Сервер, ресурсы и безопасность

Только loopback `127.0.0.1:3100`, без reload/request logging/session/auth middleware/admin. Django DEBUG=False; Bun NODE_ENV=production. CONN_MAX_AGE=0 + psycopg pool возвращает connection в пул, а не создаёт TCP connection на каждом запросе. SQL autocommit, стандартные durability settings. Django preparation/client-side binding и Bun driver defaults не выданы за один идентичный DB driver: это часть stack comparison.

Gunicorn мастер и потомки учитываются в tree resource sampling. Один worker не означает один зарезервированный CPU: Python/GIL, Rust/C helper threads и Bun runtime используют ядра по-разному. macOS не обеспечивает здесь quota/affinity. Tree RSS — сумма RSS, shared pages могут считаться дважды. CPU берётся из дельты cumulative CPU time, не ps lifetime percent; умершие/перезапущенные workers должны инвалидировать интерпретацию CPU-efficiency. Клиент и Postgres на том же ноутбуке. Нельзя из этих данных напрямую получить cloud bill или performance на N CPU.

## Измерение

`bench/bench.ts` запускает parity перед нагрузкой. Полный режим: warmup 5s, 3 повтора по 30s, c=10/100/500; quick: 1s + 3s, один повтор, c=10. Конфигурации ротируются между повторами. Полная матрица/очередность и raw Bombardier JSON сохраняются. Successful RPS = req2xx / actual seconds, отдельно attempted RPS, HTTP failures и transport/unknown outcomes. Ошибки не считаются выигрышем в скорости, latency при ошибках не называется success-only latency.

Order reset до warmup и повторно после warmup перед каждым measured write window. Reset DELETE id>200000, sequence=200000, VACUUM FULL ANALYZE, вне timed window; другие приложения не должны писать fixture. Процесс shutdown должен освободить порт прежде следующего старта. Артефакты не перезаписываются молча. Smoke JSON — диагностика plumbing, не publication-quality numbers.

Шум и OS load — диагностические данные, не формальный confidence interval. Range/CV из пяти повторов не доказывает статистическую значимость. Multi-hour pass не запускался автоматически во время разработки; нагрузка от сборок/браузера/агентов испортила бы его. DX и cost не скопированы: у Python нет эквивалентного обязательного bundle build, а CPU-only cost extrapolation исходника непригоден для новой пары.

## Предварительные проверки

`bun run parity`: 38 cases на E/N-sync/N-async, включает все 7 routes, defaults, 404, invalid JWT, boundary/coercion/extra keys и rejected orders. Проверка query count/RETURNING/decimal rounding — `api.tests` вне HTTP measurement. Отдельный реальный Uvicorn запуск через shell/curl подтвердил 200/201/401/404/422 и освобождение process group/порта. Контрольный E2E всех семи маршрутов вне harness записан в `results/authoritative-e2e.txt`: команды, точные тела, stdout/stderr, curl exit code 0, SQL persistence assertion и FINAL=PASS. Дополнительно parity прошёл E-aot. Полный список команд — README.
