"""Convenciones semánticas `ct.*` de CultureTech (generadas por OpenTelemetry Weaver).

Reexporta las clases de atributos por dominio para un import conveniente:

    from culturetech_otel import OrderAttributes, PaymentAttributes
    span.set_attribute(OrderAttributes.ORDER_ID, order_id)
"""

from .attributes import (
    CommonAttributes,
    FulfillmentAttributes,
    OrderAttributes,
    PaymentAttributes,
    ShippingAttributes,
)

__all__ = [
    "CommonAttributes",
    "OrderAttributes",
    "PaymentAttributes",
    "FulfillmentAttributes",
    "ShippingAttributes",
]

__version__ = "0.1.0"
