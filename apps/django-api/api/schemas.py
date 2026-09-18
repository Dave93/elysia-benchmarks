"""Input contract aligned with the pinned Elysia fixture; not Pydantic defaults."""
import re
from typing import Annotated, Literal
from ninja import Schema
from pydantic import BeforeValidator, ConfigDict, Field, field_validator


def integer(value):
    # Elysia's recursive IntegerString coercion also applies inside JSON bodies.
    if isinstance(value, str) and re.fullmatch(r"[+-]?[0-9]+", value):
        return int(value)
    if type(value) is int:
        return value
    if type(value) is float and value.is_integer():
        return int(value)
    raise ValueError("expected integer or integer string")


Integer = Annotated[int, BeforeValidator(integer)]
Positive = Annotated[Integer, Field(ge=1)]
# Same ASCII/email grammar as TypeBox 1.3.1 format/email (MIT, sinclairzx81).
# No DNS lookup or normalization; native EmailStr has different semantics.
EMAIL_PATTERN = r'''(?i)^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[^"\\]|\\[\x20-\x7e])*")@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*|\[(?:IPv6:[a-f0-9:]+|(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?:\.(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3})\])$'''


class EchoBody(Schema):
    model_config = ConfigDict(extra="ignore", strict=True)
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(pattern=EMAIL_PATTERN)
    age: Annotated[Integer, Field(ge=0, le=150)]
    tags: list[str] = Field(max_length=10)


class OrderBody(Schema):
    model_config = ConfigDict(extra="ignore", strict=True)
    userId: Positive
    amount: float = Field(ge=0, allow_inf_nan=False)
    currency: Literal["USD", "EUR", "GBP"]

    @field_validator("amount", mode="before")
    @classmethod
    def numeric_amount(cls, value):
        if type(value) not in (int, float):
            raise ValueError("expected JSON number")
        return value
