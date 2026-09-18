from django.db import models


class User(models.Model):
    name = models.TextField()
    email = models.TextField(unique=True)
    age = models.IntegerField()
    created_at = models.DateTimeField()

    class Meta:
        db_table = "users"
        managed = False  # Physical schema is shared and created by bench/schema.sql.


# Ask Django's INSERT compiler to return all columns, matching Drizzle RETURNING.
# db_returning is the field hook also used by AutoField / db_default fields.
# Captured SQL is asserted by the untimed query audit; no insert-then-select.
class ReturningIntegerField(models.IntegerField):
    db_returning = True


class ReturningDecimalField(models.DecimalField):
    db_returning = True


class ReturningCharField(models.CharField):
    db_returning = True


class ReturningDateTimeField(models.DateTimeField):
    db_returning = True


class Order(models.Model):
    user_id = ReturningIntegerField()
    amount = ReturningDecimalField(max_digits=12, decimal_places=2)
    currency = ReturningCharField(max_length=3)
    created_at = ReturningDateTimeField()

    class Meta:
        db_table = "orders"
        managed = False
