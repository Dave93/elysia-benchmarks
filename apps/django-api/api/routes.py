import hashlib
import os
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Annotated

import jwt
import orjson
from ninja import NinjaAPI
from ninja.renderers import BaseRenderer
from django.http import HttpResponse


def reply(status, data):
    return HttpResponse(orjson.dumps(data), status=status, content_type="application/json")
from pydantic import Field

from .models import Order, User
from .schemas import EchoBody, Integer, OrderBody, Positive


class ORJSONRenderer(BaseRenderer):
    media_type = "application/json"

    def render(self, request, data, *, response_status):
        return orjson.dumps(data)


api = NinjaAPI(renderer=ORJSONRenderer(), docs_url=None, openapi_url=None)
USER_FIELDS = ("id", "name", "email", "age", "created_at")
KEY = os.environ.get("JWT_SECRET", "bench-secret-do-not-use-in-prod")


def serialize_user(user):
    if user is None:
        return reply(404, {"error": "not found"})
    return {"id": user["id"], "name": user["name"], "email": user["email"], "age": user["age"], "createdAt": user["created_at"].isoformat(timespec="milliseconds").replace("+00:00", "Z")}


def user_id(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(header[7:], KEY, algorithms=["HS256"], options={"verify_aud": False})
        value = float(payload.get("sub", "nan"))
        return int(value) if value.is_integer() else None
    except (jwt.PyJWTError, ValueError, TypeError, OverflowError):
        return None


def cpu_work(n):
    value = "elysia-vs-nest"
    for _ in range(n):
        value = hashlib.sha256(value.encode()).hexdigest()
    return {"n": n, "hash": value}


def order_values(body):
    # Match positive JS Number.toFixed(2), including binary-float half-way behavior.
    amount = Decimal.from_float(body.amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    now = datetime.now(timezone.utc)
    now = now.replace(microsecond=(now.microsecond // 1000) * 1000)
    return {"user_id": body.userId, "amount": amount, "currency": body.currency, "created_at": now}


def serialize_order(order):
    return reply(201, {"id": order.id, "userId": order.user_id, "amount": format(order.amount, ".2f"), "currency": order.currency, "createdAt": order.created_at.isoformat(timespec="milliseconds").replace("+00:00", "Z")})


# No output schemas: Elysia also performs serialization without response validation.
# Non-200 replies use HttpResponse to avoid adding output-schema validation.

if os.environ.get("API_MODE", "sync") == "async":
    @api.get("/health")
    async def health(request):
        return {"status": "ok"}

    @api.post("/echo")
    async def echo(request, body: EchoBody):
        return body.model_dump()

    @api.get("/cpu")
    async def cpu(request, n: Annotated[Integer, Field(ge=1, le=1_000_000)]):
        return cpu_work(n)

    @api.get("/users/{id}")
    async def user(request, id: Positive):
        rows = [row async for row in User.objects.filter(id=id).values(*USER_FIELDS)[:1]]
        return serialize_user(rows[0] if rows else None)

    @api.get("/users")
    async def users(request, page: Positive = 1, limit: Annotated[Integer, Field(ge=1, le=100)] = 20):
        offset = (page - 1) * limit
        rows = [serialize_user(row) async for row in User.objects.order_by("id").values(*USER_FIELDS)[offset:offset+limit]]
        return {"page": page, "limit": limit, "items": rows}

    @api.post("/orders")
    async def orders(request, body: OrderBody):
        return serialize_order(await Order.objects.acreate(**order_values(body)))

    @api.get("/me")
    async def me(request):
        id = user_id(request)
        if not id:
            return reply(401, {"error": "unauthorized"})
        rows = [row async for row in User.objects.filter(id=id).values(*USER_FIELDS)[:1]]
        return serialize_user(rows[0] if rows else None)
else:
    @api.get("/health")
    def health(request):
        return {"status": "ok"}

    @api.post("/echo")
    def echo(request, body: EchoBody):
        return body.model_dump()

    @api.get("/cpu")
    def cpu(request, n: Annotated[Integer, Field(ge=1, le=1_000_000)]):
        return cpu_work(n)

    @api.get("/users/{id}")
    def user(request, id: Positive):
        rows = list(User.objects.filter(id=id).values(*USER_FIELDS)[:1])
        return serialize_user(rows[0] if rows else None)

    @api.get("/users")
    def users(request, page: Positive = 1, limit: Annotated[Integer, Field(ge=1, le=100)] = 20):
        offset = (page - 1) * limit
        return {"page": page, "limit": limit, "items": [serialize_user(row) for row in User.objects.order_by("id").values(*USER_FIELDS)[offset:offset+limit]]}

    @api.post("/orders")
    def orders(request, body: OrderBody):
        return serialize_order(Order.objects.create(**order_values(body)))

    @api.get("/me")
    def me(request):
        id = user_id(request)
        if not id:
            return reply(401, {"error": "unauthorized"})
        rows = list(User.objects.filter(id=id).values(*USER_FIELDS)[:1])
        return serialize_user(rows[0] if rows else None)
