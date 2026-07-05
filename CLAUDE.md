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
  registro (repo o subcarpeta con su propio `registry_manifest.yaml`) debe ser trivial.
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
   El formato v2 (`definition/2`) cambia el modelo de datos: los atributos se definen en
   una lista `attributes:` de nivel superior con `key:`, y los `attribute_groups` pasan a
   ser **solo colecciones de referencias**. Ese modelo es **incompatible** con el diseño
   de este repo (grupos con `id: registry.ct.<dominio>` que **definen** atributos con
   `id: ct.*`, sobre los que operan la policy y los templates). El formato v1 `groups:`
   es el que usan OpenTelemetry semantic-conventions y el propio Weaver hoy, y es el que
   hace funcionar la policy (`input.groups[_]`, `group.id`, `attr.name`) y los templates
   (nombre de clase derivado del `id` del grupo). Migrar a v2 en el futuro es posible pero
   implica reescribir modelo + policy + templates de forma coordinada.

2. **`registry_manifest.yaml` vive dentro de `model/`.**
   Weaver escanea recursivamente TODO `*.yaml` bajo el directorio de `--registry` como
   archivos semconv. Manteniendo el registro autocontenido en `model/`, el comando
   canónico `--registry model/` funciona y `templates/`, `policies/`, `docs/` quedan
   **fuera** del escaneo (si no, Weaver intenta parsear los `weaver.yaml` de `templates/`
   como semconv y falla).

3. **Manifiesto con `schema_url` (campo canónico en 0.24.2).**
   `name` y `semconv_version` se conservan como documentación humana, pero Weaver deriva
   nombre y versión de `schema_url`. Usar `schema_url` evita el warning de deprecación.

4. **Dependencia OTel vía URL de archivo del tag** (`.../archive/refs/tags/v1.40.0.zip[model]`),
   no la forma git `@v1.40.0` (cuyo fetch de refspec no está completamente implementado).
   El archivo fija la versión de forma 100% reproducible.

5. **Warning aceptado:** Weaver sugiere renombrar `registry_manifest.yaml` a `manifest.yaml`.
   Es un warning cosmético; conservamos `registry_manifest.yaml`. No rompe el check.

---

## Comandos

Requiere `weaver` (OpenTelemetry Weaver) ≥ 0.24.2 en el PATH.

```bash
# Validar el registro + policies (debe salir en verde, exit 0)
weaver registry check --registry model/ --policy policies/

# Generar las constantes de los 4 lenguajes en sus paquetes (idempotente)
./scripts/generate.sh
```

## Empaquetado y publicación (Fase 1b)

- La salida generada vive en ubicaciones canónicas de paquete: `otel/ctattributes/`,
  `packages/typescript/src/`, `packages/java/src/main/java/...`, `packages/python/src/...`.
- **CI** (`.github/workflows/ci.yml`): en push/PR corre `weaver check`, regenera, verifica
  compilación de los 4 y hace **detección de drift** (`git diff --exit-code` sobre la salida
  generada). Runner GitHub-hosted `ubuntu-latest`.
- **Release** (`.github/workflows/release.yml`): al empujar un tag `vX.Y.Z` publica
  TS→npm y Java→Maven en **GitHub Packages**, Python (wheel) como asset del Release, y Go
  queda publicado por el tag (`go get`). La publicación usa el `GITHUB_TOKEN` de Actions
  (`permissions: packages: write`); no requiere secretos adicionales.
- **Versionado:** las versiones en `package.json`/`pom.xml`/`pyproject.toml` deben coincidir
  con el tag; el workflow valida la consistencia antes de publicar. Para una versión nueva:
  bumpear los 3 manifiestos + `__init__.py` y empujar el tag correspondiente.

---

## Convenciones de contribución

- **Atributos nuevos:** `id: ct.<dominio>.<nombre>` dentro del grupo
  `registry.ct.<dominio>`. La policy `ct_naming` rechaza atributos `registry.ct.*` sin
  prefijo `ct.` (con mensaje en español).
- **Conjuntos cerrados** (p. ej. métodos de pago, niveles de cumplimiento) → modelar como
  **enum** con `members`, no como `string` libre.
- **`stability: development`** mientras el contrato esté en v0.x. No usar `stable` aún.
- **Nunca** reutilizar/redefinir un atributo estándar de OTel: referenciarlo con `ref:`
  (la dependencia OTel v1.40.0 está declarada en el manifiesto).
- **No romper contratos:** renombrar/eliminar un atributo ya publicado requiere versión y
  (a futuro) política de evolución de schema.
- Todo cambio debe pasar `weaver registry check` en verde antes de commit/PR.

## Fuera de alcance (no hacer sin autorización)

- Migrar a `file_format: definition/2` (implica reescribir modelo + policy + templates).
- Cambiar los destinos de publicación o el esquema de versionado sin acuerdo.
