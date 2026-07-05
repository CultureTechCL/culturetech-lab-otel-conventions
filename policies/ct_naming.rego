# =============================================================================
# Policy: ct_naming — convención de nombres del registro CultureTech
# =============================================================================
# Exige que TODO atributo definido en un grupo propio de CultureTech (id que
# empieza con `registry.ct.`) use el prefijo `ct.`. Los atributos IMPORTADOS de
# OpenTelemetry (o de cualquier otra dependencia) viven en grupos con OTRO
# prefijo de id (p. ej. `registry.error`, `registry.http`), por lo que quedan
# naturalmente EXCLUIDOS de esta regla: no se rechaza nada estándar de OTel.
#
# FASE: `after_resolution`. En Weaver el NOMBRE DEL PAQUETE determina la fase en
# que corre la policy. `after_resolution` opera sobre el registro YA RESUELTO:
#   - `input.groups[_]`        -> cada grupo resuelto, con su `.id`.
#   - `group.attributes[_]`    -> cada atributo resuelto, con su `.name`
#                                  (el nombre totalmente calificado del atributo).
# Corremos after_resolution (y no before_resolution) a propósito: así la regla
# ve el nombre final del atributo tras resolver refs/extends, que es exactamente
# lo que consumirán los templates y los servicios.
#
# PUNTO DE EXTENSIÓN (registro jerárquico): la regla se basa SOLO en el prefijo
# de id del grupo (`registry.ct.`), no en un supuesto de "registro único plano".
# Si en el futuro los dominios se extraen a registros anidados, sus grupos
# seguirán usando `registry.ct.<dominio>` y la regla los seguirá cubriendo sin
# cambios.
# =============================================================================
package after_resolution

import rego.v1

# Un atributo de un grupo `registry.ct.*` cuyo `name` NO empieza con `ct.` es una
# violación del contrato de nombres.
deny contains finding if {
	group := input.groups[_]
	startswith(group.id, "registry.ct.")

	attr := group.attributes[_]
	not startswith(attr.name, "ct.")

	finding := {
		"id": "ct_attribute_prefix_required",
		"level": "violation",
		"message": sprintf(
			"El atributo '%s' del grupo '%s' debe usar el prefijo obligatorio 'ct.' (convención de nombres del registro CultureTech). Renómbralo a 'ct.%s' o muévelo a un grupo que no empiece con 'registry.ct.'.",
			[attr.name, group.id, attr.name],
		),
		"context": {
			"group_id": group.id,
			"attribute_name": attr.name,
		},
	}
}
