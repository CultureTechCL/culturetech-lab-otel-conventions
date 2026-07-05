# culturetech-lab-otel-conventions

**Contrato de telemetría central** del laboratorio de observabilidad de CultureTech.
Fuente única de verdad de las convenciones semánticas `ct.*` (atributos y métricas)
que consumen de forma gobernada y consistente todos los servicios del lab, en múltiples
lenguajes (Go, Python, Java, TypeScript).

Construido con [**OpenTelemetry Weaver**](https://github.com/open-telemetry/weaver).

---

## Propósito

Emular, a escala organizacional, la arquitectura de OpenTelemetry: un **contrato de
telemetría central** definido una sola vez y consumido de forma **tipada y consistente**
por servicios heterogéneos. En vez de que cada servicio invente sus propios nombres de
atributos (`order_id`, `orderId`, `id_orden`, …), todos parten de una definición común
(`ct.order.id`), y las constantes de cada lenguaje se **generan** desde esa definición.

Beneficios:

- **Consistencia:** un solo nombre por concepto, en todos los servicios y lenguajes.
- **Gobernanza:** las convenciones se validan con políticas (Rego) en cada cambio.
- **Reutilización del estándar:** el contrato referencia atributos de OpenTelemetry
  (p. ej. `error.type`) en vez de redefinirlos.
- **Cero drift:** las constantes por lenguaje son **generadas**, nunca escritas a mano.

---

## Estructura

```
culturetech-lab-otel-conventions/
├── CLAUDE.md                       # Guía para Claude Code + decisiones de arranque
├── README.md                       # Este archivo
├── CODEOWNERS                      # Propiedad federada por dominio
├── model/                          # ← EL REGISTRO (raíz para `--registry model/`)
│   ├── registry_manifest.yaml      #   Identidad del registro + dependencia OTel v1.40.0
│   ├── common/organizational.yaml  #   ct.team, ct.cost_center, ct.compliance_level (enum)
│   ├── orders/attributes.yaml      #   ct.order.id, ct.order.total, ct.order.items_count
│   ├── payments/
│   │   ├── attributes.yaml         #   ct.payment.method (enum), ct.payment.transaction_id
│   │   └── metrics.yaml            #   ct.payment.processed (counter), ct.payment.duration (histogram)
│   ├── fulfillment/attributes.yaml #   ct.fulfillment.warehouse_id, ct.fulfillment.stock_reserved
│   └── shipping/attributes.yaml    #   ct.shipping.courier, ct.shipping.tracking_code,
│                                   #   ct.shipping.runtime_variant (enum: jvm|graalvm)
├── policies/ct_naming.rego         # Policy: prefijo `ct.` obligatorio en grupos registry.ct.*
├── templates/                      # Moldes Jinja2 (uno por lenguaje) + su weaver.yaml
│   ├── go/{attributes.go.j2, weaver.yaml}
│   ├── python/{attributes.py.j2, weaver.yaml}
│   ├── java/{Attributes.java.j2, weaver.yaml}
│   └── typescript/{attributes.ts.j2, weaver.yaml}
├── scripts/generate.sh             # Regenera los 4 paquetes desde model/
├── go.mod                          # Módulo Go raíz (se consume por tag, sin registry)
├── otel/ctattributes/attributes.go # ← Go generado (paquete ctattributes)
├── packages/                       # Paquetes publicables por lenguaje
│   ├── typescript/                 #   npm @culturetechcl/lab-otel-conventions
│   │   ├── package.json · tsconfig.json
│   │   └── src/attributes.ts       #   ← TS generado
│   ├── java/                       #   Maven cl.culturetech.otel:lab-otel-conventions
│   │   ├── pom.xml
│   │   └── src/main/java/cl/culturetech/otel/CtAttributes.java  # ← Java generado
│   └── python/                     #   wheel culturetech-lab-otel-conventions
│       ├── pyproject.toml · README.md
│       └── src/culturetech_otel/{__init__.py, attributes.py}    # ← Python generado
└── .github/
    ├── actions/setup-weaver/       # Acción compuesta: instala Weaver en CI
    └── workflows/{ci.yml, release.yml}
```

> La **salida generada** (los archivos `attributes.*` / `CtAttributes.java`) se versiona
> dentro de cada paquete para que sean consumibles directo del repo y revisables. Los
> **artefactos de build** (`dist/`, `target/`, `*.whl`, `node_modules/`) NO se versionan.

> **Nota de ubicación del manifiesto.** A diferencia de un árbol donde el manifiesto
> estaría en la raíz del repo, aquí `registry_manifest.yaml` vive **dentro de `model/`**.
> Weaver escanea recursivamente todo `*.yaml` bajo el directorio de `--registry` como
> archivos semconv; manteniendo el registro autocontenido en `model/`, el comando
> canónico `--registry model/` funciona y `templates/`, `policies/`, `docs/` quedan fuera
> del escaneo. Ver `CLAUDE.md § Decisiones de arranque`.

---

## Requisitos

- [OpenTelemetry Weaver](https://github.com/open-telemetry/weaver) **≥ 0.24.2** en el PATH.
  ```bash
  # macOS (Apple Silicon), desde releases:
  gh release download v0.24.2 --repo open-telemetry/weaver \
    --pattern 'weaver-aarch64-apple-darwin.tar.xz'
  tar -xf weaver-aarch64-apple-darwin.tar.xz
  cp weaver-aarch64-apple-darwin/weaver ~/.cargo/bin/   # o cualquier dir del PATH
  weaver --version   # -> weaver 0.24.2
  ```
- Para **verificar** la salida generada: `go`, `python3`, `javac` (JDK 17+), `tsc` (TypeScript 5+).

---

## Validar y generar localmente

### 1) Validar el registro (check + policies)

```bash
weaver registry check --registry model/ --policy policies/
```

Debe salir en **verde** (`✔ No 'after_resolution' policy violation`, exit `0`). La primera
ejecución descarga y cachea la dependencia OTel v1.40.0 en `~/.weaver/vdir_cache/`.

> El único warning esperado es el de renombrar `registry_manifest.yaml` a `manifest.yaml`
> (cosmético; se conserva el nombre a propósito).

### 2) Generar las constantes en cada paquete

```bash
./scripts/generate.sh
```

Escribe la salida en las ubicaciones canónicas de cada paquete (`otel/ctattributes/`,
`packages/*/src/...`). Es idempotente y marca cada archivo `DO NOT EDIT`.

### 3) Verificar que compila/importa

```bash
go build ./...                                                   # Go (módulo raíz)
( cd packages/typescript && npm install && npm run build )       # TypeScript
( cd packages/java && mvn -q compile )                           # Java
( cd packages/python && python -m build && pip install dist/*.whl ) # Python
```

> Los archivos generados se versionan; los artefactos de build (`dist/`, `target/`,
> `*.whl`) no. La CI (`.github/workflows/ci.yml`) corre esto en cada push/PR e incluye
> **detección de drift** (falla si la salida commiteada no coincide con el modelo).

---

## Publicación y consumo

La publicación la dispara un **tag `vX.Y.Z`** (workflow `.github/workflows/release.yml`),
que valida, publica y crea un GitHub Release con los artefactos adjuntos.

| Lenguaje | Destino | Coordenada | Consumo |
|---|---|---|---|
| **TypeScript** | GitHub Packages (npm) | `@culturetechcl/lab-otel-conventions` | `npm i @culturetechcl/lab-otel-conventions` (con `.npmrc` apuntando a `npm.pkg.github.com`) |
| **Java** | GitHub Packages (Maven) | `cl.culturetech.otel:lab-otel-conventions` | dependencia Maven (repo `maven.pkg.github.com`) |
| **Python** | Asset del GitHub Release (wheel) | `culturetech-lab-otel-conventions` | `pip install "git+https://github.com/CultureTechCL/culturetech-lab-otel-conventions.git@v0.1.0#subdirectory=packages/python"` |
| **Go** | El tag mismo (sin registry) | `github.com/CultureTechCL/culturetech-lab-otel-conventions` | `go get github.com/CultureTechCL/culturetech-lab-otel-conventions@v0.1.0` |

### Cómo consumir el contrato (ejemplo)

Un servicio no re-declara los nombres: importa las constantes generadas.

```typescript
// TypeScript
import { OrderAttributes, PaymentMethodValues } from "@culturetechcl/lab-otel-conventions";

span.setAttribute(OrderAttributes.ORDER_ID, order.id);
span.setAttribute("ct.payment.method", PaymentMethodValues.CREDIT_CARD);
```

```go
// Go
import ct "github.com/CultureTechCL/culturetech-lab-otel-conventions/otel/ctattributes"

span.SetAttributes(attribute.String(ct.OrderId, order.ID))
span.SetAttributes(attribute.String(ct.PaymentMethod, ct.PaymentMethodCreditCard))
```

```python
# Python
from culturetech_otel import OrderAttributes, PaymentAttributes

span.set_attribute(OrderAttributes.ORDER_ID, order_id)
span.set_attribute(PaymentAttributes.PAYMENT_METHOD, PaymentAttributes.PaymentMethodValues.CREDIT_CARD)
```

---

## Evolución a registro jerárquico

Hoy `model/` es **un único registro plano** con carpetas por dominio. Esto es una decisión
de **arranque**, no un límite de Weaver, que soporta hasta **10 niveles** de registros
anidados con dependencias entre sí. Cuando un dominio crezca lo suficiente (equipo propio,
cadencia de release propia, necesidad de versionar por separado), se extrae a su propio
registro **sin reescribir** el resto.

### Estado actual (plano)

```
model/                         # registro "culturetech" (schema_url .../lab-otel/0.1.0)
├── registry_manifest.yaml     #   dependencia: OTel semconv v1.40.0
├── common/ orders/ payments/ fulfillment/ shipping/
```

Dependencias: `culturetech → OTel`.

### Estado objetivo (multinivel) — ejemplo concreto extrayendo `payments`

Supongamos que `payments` pasa a tener su propio equipo y ciclo de vida. Se convierte en un
registro independiente que **depende** del registro base de CultureTech (para reutilizar
`ct.common.*`) y, transitivamente, de OTel:

```
registries/
├── culturetech-base/                 # registro base (ex-model/, sin payments)
│   ├── registry_manifest.yaml        #   dep: OTel v1.40.0
│   │   #   name: culturetech-base
│   │   #   schema_url: https://schemas.culturetech.cl/lab-otel-base/0.2.0
│   └── common/ orders/ fulfillment/ shipping/
│
└── culturetech-payments/             # registro de dominio extraído
    ├── registry_manifest.yaml
    │   #   name: culturetech-payments
    │   #   schema_url: https://schemas.culturetech.cl/lab-otel-payments/0.1.0
    │   #   dependencies:
    │   #     - schema_url: https://schemas.culturetech.cl/lab-otel-base/0.2.0
    │   #       registry_path: ../culturetech-base        # (o URL git/zip del repo base)
    │   #     - schema_url: https://opentelemetry.io/schemas/1.40.0
    │   #       registry_path: https://github.com/open-telemetry/semantic-conventions/archive/refs/tags/v1.40.0.zip[model]
    └── attributes.yaml  metrics.yaml   # los mismos archivos, movidos SIN cambios
```

Grafo de dependencias resultante:

```
culturetech-payments ──► culturetech-base ──► OTel v1.40.0
                     └──────────────────────► OTel v1.40.0   (declarada explícitamente)
```

**Por qué la extracción es trivial en este repo:**

- Cada dominio ya está en su **carpeta autocontenida**; mover `payments/` a un registro nuevo
  es un `git mv` + un `registry_manifest.yaml` propio.
- La **policy** `ct_naming` filtra por prefijo de id (`registry.ct.`), no por topología: sigue
  cubriendo los grupos `registry.ct.payment` estén donde estén.
- Los **templates** derivan el nombre de clase del `id` del grupo (`registry.ct.payment` →
  `PaymentAttributes`); no asumen "registro único plano".
- Los **consumidores** siguen importando `ct.payment.*`; el nombre del atributo no cambia al
  reubicar su definición.

No hay nada en el código ni en la CI que asuma un registro plano; por eso plano → multinivel
es una **migración de organización de archivos**, no una reescritura.

---

## Licencia y estado

Laboratorio interno de CultureTech. **Fase 1 + 1b** completas: el registro valida en verde,
genera los cuatro paquetes, y cuenta con CI (gate de gobernanza) y publicación por tag
(npm + Maven en GitHub Packages, wheel de Python en el Release, Go por tag).
