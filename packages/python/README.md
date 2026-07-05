# culturetech-lab-otel-conventions (Python)

Constantes tipadas de las convenciones semánticas OpenTelemetry (`ct.*`) del
laboratorio CultureTech. **Código generado** por OpenTelemetry Weaver desde el
registro central; no editar a mano.

## Instalación

GitHub Packages no aloja paquetes Python, por lo que el wheel se distribuye como
asset del GitHub Release, o se instala directo desde el repositorio:

```bash
pip install "git+https://github.com/CultureTechCL/culturetech-lab-otel-conventions.git@v0.1.0#subdirectory=packages/python"
```

## Uso

```python
from culturetech_otel import OrderAttributes, PaymentAttributes
from culturetech_otel.attributes import PaymentAttributes as P

span.set_attribute(OrderAttributes.ORDER_ID, order_id)
span.set_attribute(PaymentAttributes.PAYMENT_METHOD, P.PaymentMethodValues.CREDIT_CARD)
```
