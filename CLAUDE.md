# CLAUDE.md — culturetech-lab-otel-conventions

> Instrucciones para Claude Code al trabajar en este repositorio.
> **Idioma:** español de Chile en documentación, comentarios y commits. Identificadores
> de código en inglés técnico, siguiendo la convención OpenTelemetry (`ct.order.id`).

---

## Qué es este repo

Este es el **contrato de telemetría central** del laboratorio de observabilidad de
CultureTech: la **fuente única de verdad** de las convenciones semánticas `ct.*`
(atributos y métricas) que consumen, de forma gobernada y consistente, todos los
servicios del lab en distintos lenguajes.

Está construido con [**OpenTelemetry Weaver**](https://github.com/open-telemetry/weaver),
el motor oficial de OTel para registros de convenciones semánticas. El flujo es:

```
model/ (YAML semconv)  ──weaver check──►  validación + policies (Rego)
        │
        └──weaver generate──►  gen/<lenguaje>/  (constantes tipadas: Go, Python, Java, TS)
```

---

## ⚠️ NOTA ARQUITECTÓNICA CRÍTICA — registro plano hoy, jerárquico mañana

El registro se construye **plano**: un único registro (`model/`) organizado por
**carpetas de dominio** (`common/`, `orders/`, `payments/`, `fulfillment/`, `shipping/`).

**Esto es una decisión pragmática de ARRANQUE, NO una limitación de Weaver.**
Weaver soporta hasta **10 niveles** de registros anidados con dependencias entre sí,
sin dependencias circulares. El diseño DEBE poder evolucionar a una jerarquía
multinivel **sin reescritura**. Reglas que este repo respeta y que tú DEBES mantener:

- **Cada dominio vive en su carpeta autocontenida.** Extraer un dominio a su propio
  registro (repo o subcarpeta con su propio `manifest.yaml`) debe ser trivial.
- **No hardcodear supuestos de "registro único plano"** en templates ni en CI. Los
  filtros de template y la policy se basan en el **prefijo de id** (`registry.ct.`),
  no en la topología del registro.
- El **README** incluye la sección **"Evolución a registro jerárquico"** con un ejemplo
  concreto (plano → multinivel). Manténla actualizada.
- Los archivos clave llevan comentarios marcando los **PUNTOS DE EXTENSIÓN**.

El objetivo es que las empresas vean **su** realidad reflejada; el lab no debe inducir
la idea errónea de que "si se hizo plano, solo se puede hacer plano".

---

## Decisiones de arranque (validadas contra Weaver 0.24.2)

Durante la Fase 1 se validó la sintaxis **contra el binario y los schemas oficiales de
Weaver** (no contra supuestos). Estas decisiones difieren en detalles de un enunciado
inicial y están documentadas a propósito:

1. **Formato de modelo: v1 `groups:` (no `file_format: definition/2`).**
   Se usa el formato v1 `groups:` porque es la sintaxis ESTABLE y de PRODUCCIÓN de las
   convenciones semánticas: es la que usan las OpenTelemetry semantic-conventions oficiales
   y el propio Weaver hoy, y la que hace funcionar la policy (`input.groups[_]`, `group.id`,
   `attr.name` en fase `after_resolution`) y los templates (nombre de clase derivado del
   `id` del grupo).
   El formato v2 (`file_format: definition/2`) está en estado **Alpha**, bajo desarrollo
   activo, y reorganiza el modelo de datos por tipo de señal (atributos con `key:` y señales
   que los referencian con `ref:`). Migrar a v2 será un trabajo DELIBERADO a futuro (modelo +
   policy + templates de forma coordinada), no un conflicto del diseño actual. La conclusión
   —quedarse en v1— es por madurez de la sintaxis, no porque el diseño esté "peleado" con v2.

2. **`manifest.yaml` vive dentro de `model/`.**
   Weaver escanea recursivamente TODO `*.yaml` bajo el directorio de `--registry` como
   archivos semconv. Manteniendo el registro autocontenido en `model/`, el comando
   canónico `--registry model/` funciona y `templates/`, `policies/`, `docs/` quedan
   **fuera** del escaneo (si no, Weaver intenta parsear los `weaver.yaml` de `templates/`
   como semconv y falla). El archivo se llama `manifest.yaml` (nombre canónico que Weaver
   prefiere); antes se llamaba `registry_manifest.yaml`, renombrado en Fase 1b.

3. **Manifiesto con `schema_url` (campo canónico en 0.24.x).**
   `name` y `semconv_version` se conservan como documentación humana, pero Weaver deriva
   nombre y versión de `schema_url`. Usar `schema_url` evita el warning de deprecación.

4. **Dependencia OTel vía URL de archivo del tag** (`.../archive/refs/tags/v1.42.0.zip[model]`),
   no la forma git `@v1.42.0` (cuyo fetch de refspec no está completamente implementado).
   El archivo fija la versión de forma 100% reproducible.

5. **Nombre del manifiesto:** `model/manifest.yaml` es el nombre canónico que Weaver
   prefiere; con él, `weaver registry check` no emite el warning de "legacy file name".

---

## Comandos

Requiere `weaver` (OpenTelemetry Weaver) ≥ 0.24.1 en el PATH.

```bash
# Validar el registro + policies (debe salir en verde, exit 0)
weaver registry check --registry model/ --policy policies/
```

Para generar las constantes por lenguaje, ver **§ "Comandos de generación
(weaver registry generate)"** más abajo (fuente única de verdad de la sintaxis).

## Comandos de generación (weaver registry generate)

Sintaxis **verificada contra Weaver 0.24.1** (la misma versión que usan los
workflows). La forma correcta es `weaver registry generate --registry <reg>
--templates <raíz-de-templates> <TARGET> <OUTPUT>`, donde `<TARGET>` es el nombre
de la subcarpeta bajo `templates/` (no `single`; `single` es el `application_mode`
que se declara dentro de cada `templates/<target>/weaver.yaml`).

```bash
# TypeScript
weaver registry generate --registry model/ --templates templates/ typescript gen/typescript
# Java
weaver registry generate --registry model/ --templates templates/ java       gen/java
# Python
weaver registry generate --registry model/ --templates templates/ python     gen/python
# Go
weaver registry generate --registry model/ --templates templates/ go         gen/go
```

La salida va a `gen/<lenguaje>/` (efímera, no versionada; ver `.gitignore`).

> **Nota:** la sintaxis puede cambiar entre versiones de Weaver; verificar contra
> el release notes antes de actualizar la versión del binario en los workflows.

## Empaquetado y publicación (Fase 1b)

La publicación la dispara un **tag `vX.Y.Z`** mediante `.github/workflows/release.yml`. La
versión sale **siempre del tag** (fuente de verdad); no hay versiones hardcodeadas en el repo.

**Principio anti-contaminación:** el repo contiene SOLO el contrato Weaver. Los templates
generan los archivos de constantes (`attributes.*` / `CtAttributes.java`) y, para Go, además
el `go.mod` (template `templates/go/go.mod.j2`). Los **manifiestos de empaquetado restantes**
(`package.json`, `pom.xml`, `pyproject.toml`, `__init__.py`) NO los generan los templates: los
**sintetiza `release.yml` en CI**, dentro de `gen/` (efímero). Nada de empaquetado se versiona
en el repo (la raíz no es módulo de ningún lenguaje).

| Lenguaje | Destino | Coordenada |
|---|---|---|
| **TypeScript** | GitHub Packages (npm) | `@culturetechcl/lab-otel-conventions` |
| **Java** | GitHub Packages (Maven) | `cl.culturetech.otel:lab-otel-conventions` |
| **Python** | Asset del GitHub Release (wheel + sdist) | `culturetech-lab-otel-conventions` |
| **Go** | Módulo generado (compila); `go get` remoto pendiente | `github.com/CultureTechCL/culturetech-lab-otel-conventions/gen/go` |

**Go — módulo generado (`go.mod` por template).** `templates/go/go.mod.j2` genera
`gen/go/go.mod` con el **module path canónico**
`github.com/CultureTechCL/culturetech-lab-otel-conventions/gen/go`, de modo que `gen/go/` es un
módulo Go válido: el job `publish-go` verifica `go vet` **y** `go build` (compila). **Para
habilitar el consumo remoto** `go get <module>@<tag>` (p. ej. desde `checkout-go` en Fase 3)
falta UN requisito: `gen/go/` (con `go.mod` + `attributes.go`) debe estar **presente en el árbol
del repositorio en ese tag**. Hoy `gen/` es efímero (gitignored), por lo que `go get` remoto
todavía no resuelve, aunque el módulo ya es válido y compila. Versionar `gen/go/` en el tag es
una **decisión de gobernanza pendiente** (contrapesa el principio anti-contaminación con la
necesidad de consumo Go por tag); no se toma en este PR.

**Versionado:** la primera versión publicable legítima es **0.1.1**. La `0.1.0` fue publicada
por error (Hito 1b no autorizado), fue revertida y sus paquetes se eliminaron de GitHub
Packages; ese número no se reutiliza (GitHub Packages no permite republicar bajo un
namespace+versión eliminado). Para una versión nueva: empujar el tag `vX.Y.Z` correspondiente.

---

## Convenciones de contribución

- **Atributos nuevos:** `id: ct.<dominio>.<nombre>` dentro del grupo
  `registry.ct.<dominio>`. La policy `ct_naming` rechaza atributos `registry.ct.*` sin
  prefijo `ct.` (con mensaje en español).
- **Conjuntos cerrados** (p. ej. métodos de pago, niveles de cumplimiento) → modelar como
  **enum** con `members`, no como `string` libre.
- **`stability: development`** mientras el contrato esté en v0.x. No usar `stable` aún.
- **Nunca** reutilizar/redefinir un atributo estándar de OTel: referenciarlo con `ref:`
  (la dependencia OTel v1.42.0 está declarada en el manifiesto).
- **No romper contratos:** renombrar/eliminar un atributo ya publicado requiere versión y
  (a futuro) política de evolución de schema.
- Todo cambio debe pasar `weaver registry check` en verde antes de commit/PR.

## Política de exposición de enums (idiomática por lenguaje, DELIBERADA)

Los atributos enum del contrato (`ct.compliance_level`, `ct.payment.method`,
`ct.shipping.runtime_variant`) exponen sus valores permitidos con el patrón **natural de
cada ecosistema**. La diferencia estructural entre lenguajes es **una decisión explícita, no
un accidente**: NO se fuerza consistencia estructural entre lenguajes.

| Lenguaje | Dónde vive el valor | Forma |
|---|---|---|
| **Python** | Clase interna `<Atributo>Values` anidada en la clase de atributos del dominio | `PaymentAttributes.PaymentMethodValues.CREDIT_CARD == "credit_card"` |
| **TypeScript** | Constante `as const` de **nivel superior** + tipo unión derivado (NO `enum` de TS ni namespaces) | `PaymentMethodValues.CREDIT_CARD` · `type PaymentMethodValue = …` |
| **Java** | Clase interna `<Atributo>Values` con `public static final String` (NO `enum` de Java) | `CtAttributes.PaymentAttributes.PaymentMethodValues.CREDIT_CARD` |
| **Go** | Constantes de nivel de paquete en un bloque `const ( … )` por atributo, con prefijo | `ct.PaymentMethodCreditCard` |

**Regla transversal (invariante):** el **VALOR** que representa cada constante es SIEMPRE el
**string canónico OTel exacto** (`"credit_card"`, `"standard"`, `"graalvm"`, …), idéntico en
los cuatro lenguajes. Lo único que cambia entre lenguajes es **dónde vive** la constante, no
su contenido.

**Por qué idiomática y no uniforme:** la tesis del lab es "contrato común, mecanismo de
consumo específico del runtime". Un mismo contrato de telemetría se consume de forma
**gobernada** respetando la idiomática de cada ecosistema (clase anidada en Python/Java,
`as const` en TS, constantes de paquete en Go). Forzar una estructura uniforme entre lenguajes
iría en contra de esa tesis y produciría código no idiomático en al menos tres de los cuatro.
Las decisiones concretas (p. ej. Java con `public static final String` en vez de `enum`, para
que el valor sea el string OTel directamente usable por el SDK) quedan declaradas en el
comentario de cabecera de cada template en `templates/<lenguaje>/`.

## Fuera de alcance (no hacer sin autorización)

- Migrar a `file_format: definition/2`: fuera de alcance por MADUREZ (v2 en Alpha), no por
  incompatibilidad. Será un trabajo deliberado y coordinado a futuro.
- Cambiar los destinos de publicación o el esquema de versionado sin acuerdo.
