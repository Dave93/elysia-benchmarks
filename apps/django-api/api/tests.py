"""Untimed contract/SQL checks against the isolated fixture; no Django test DB."""
import unittest
from decimal import Decimal
from django.test import RequestFactory
from django.db import connection
from .models import User, Order
from .routes import USER_FIELDS, order_values
from .schemas import EchoBody, OrderBody


class ContractTests(unittest.TestCase):
    def test_integer_coercion(self):
        data = {"name": "Jane", "email": "jane@example.com", "age": "30", "tags": []}
        self.assertEqual(EchoBody(**data).age, 30)
        for age in [True, "30.0", " 30", 1.5]:
            with self.assertRaises(ValueError):
                EchoBody(**{**data, "age": age})

    def test_money_rounding(self):
        for value, expected in [(19.99, "19.99"), (2.675, "2.67"), (1.125, "1.13"), (0, "0.00")]:
            body = OrderBody(userId=4242, amount=value, currency="USD")
            self.assertEqual(str(order_values(body)["amount"]), expected)

    def test_query_shapes(self):
        captured = []
        def record(execute, sql, params, many, context):
            captured.append(sql)
            return execute(sql, params, many, context)
        connection.ensure_connection()
        order = None
        try:
            with connection.execute_wrapper(record):
                rows = list(User.objects.filter(id=4242).values(*USER_FIELDS)[:1])
            self.assertEqual(len(captured), 1)
            self.assertIn("LIMIT 1", captured.pop())
            self.assertEqual(rows[0]["id"], 4242)
            with connection.execute_wrapper(record):
                rows = list(User.objects.order_by("id").values(*USER_FIELDS)[120:140])
            self.assertEqual(len(captured), 1)
            query = captured.pop()
            self.assertIn("LIMIT 20 OFFSET 120", query)
            self.assertNotIn("COUNT(", query)
            self.assertEqual([row["id"] for row in rows], list(range(121, 141)))
            with connection.execute_wrapper(record):
                order = Order.objects.create(**order_values(OrderBody(userId=4242, amount=19.99, currency="USD")))
            self.assertEqual(len(captured), 1)
            returning = captured.pop().split(" RETURNING ")[1]
            for field in ["id", "user_id", "amount", "currency", "created_at"]:
                self.assertIn(f'"orders"."{field}"', returning)
        finally:
            if order is not None:
                order.delete()
            connection.close()
