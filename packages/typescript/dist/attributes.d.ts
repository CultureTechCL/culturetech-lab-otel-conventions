/** Atributos organizacionales transversales: propiedad de equipo, centro de costo y nivel de cumplimiento. Aplicables a cualquier señal del ecosistema. */
export declare const CommonAttributes: {
    /** Nivel de clasificación de cumplimiento/sensibilidad de los datos que maneja la operación. Controla políticas de retención y enmascarado. */
    readonly COMPLIANCE_LEVEL: "ct.compliance_level";
    /** Centro de costo al que se imputa el consumo de infraestructura y la operación del servicio. Habilita correlación costo/telemetría. */
    readonly COST_CENTER: "ct.cost_center";
    /** Identificador del equipo (squad) dueño del servicio o de la operación que emite la telemetría. */
    readonly TEAM: "ct.team";
};
export type CommonAttributesKey = (typeof CommonAttributes)[keyof typeof CommonAttributes];
/** Valores permitidos para el atributo enum "ct.compliance_level". */
export declare const ComplianceLevelValues: {
    /** Información pública, sin restricciones de divulgación. */
    readonly PUBLIC: "public";
    /** Uso interno de la organización. */
    readonly INTERNAL: "internal";
    /** Información confidencial; acceso restringido por necesidad. */
    readonly CONFIDENTIAL: "confidential";
    /** Información altamente restringida (p. ej. datos regulados); máximo control de acceso y auditoría. */
    readonly RESTRICTED: "restricted";
};
export type ComplianceLevelValue = (typeof ComplianceLevelValues)[keyof typeof ComplianceLevelValues];
/** Atributos de preparación de pedidos y reserva de inventario. */
export declare const FulfillmentAttributes: {
    /** Indica si el stock necesario para la orden quedó efectivamente reservado en la bodega. */
    readonly FULFILLMENT_STOCK_RESERVED: "ct.fulfillment.stock_reserved";
    /** Identificador de la bodega/centro de distribución que atiende la orden. */
    readonly FULFILLMENT_WAREHOUSE_ID: "ct.fulfillment.warehouse_id";
};
export type FulfillmentAttributesKey = (typeof FulfillmentAttributes)[keyof typeof FulfillmentAttributes];
/** Atributos que describen una orden de compra. */
export declare const OrderAttributes: {
    /** Identificador único de la orden. */
    readonly ORDER_ID: "ct.order.id";
    /** Cantidad de líneas (ítems distintos) contenidas en la orden. */
    readonly ORDER_ITEMS_COUNT: "ct.order.items_count";
    /** Monto total de la orden, expresado en la unidad menor o mayor según la moneda de la transacción (el contrato no fija la moneda; se acompaña de los atributos monetarios estándar de OTel cuando aplica). */
    readonly ORDER_TOTAL: "ct.order.total";
};
export type OrderAttributesKey = (typeof OrderAttributes)[keyof typeof OrderAttributes];
/** Atributos que describen una transacción de pago. */
export declare const PaymentAttributes: {
    /** Método de pago utilizado en la transacción. */
    readonly PAYMENT_METHOD: "ct.payment.method";
    /** Identificador único de la transacción de pago asignado por el motor de pagos. NO debe contener PAN ni datos de tarjeta. */
    readonly PAYMENT_TRANSACTION_ID: "ct.payment.transaction_id";
};
export type PaymentAttributesKey = (typeof PaymentAttributes)[keyof typeof PaymentAttributes];
/** Valores permitidos para el atributo enum "ct.payment.method". */
export declare const PaymentMethodValues: {
    /** Tarjeta de crédito. */
    readonly CREDIT_CARD: "credit_card";
    /** Tarjeta de débito. */
    readonly DEBIT_CARD: "debit_card";
    /** Transferencia bancaria. */
    readonly BANK_TRANSFER: "bank_transfer";
    /** Efectivo (p. ej. pago contra entrega). */
    readonly CASH: "cash";
    /** Billetera digital (p. ej. wallet de terceros). */
    readonly DIGITAL_WALLET: "digital_wallet";
};
export type PaymentMethodValue = (typeof PaymentMethodValues)[keyof typeof PaymentMethodValues];
/** Atributos de envío/despacho de una orden. */
export declare const ShippingAttributes: {
    /** Nombre del courier/transportista responsable del envío. */
    readonly SHIPPING_COURIER: "ct.shipping.courier";
    /** Variante de runtime sobre la que corre el servicio de shipping que emite la telemetría. Permite correlacionar métricas/latencias con la plataforma de ejecución. */
    readonly SHIPPING_RUNTIME_VARIANT: "ct.shipping.runtime_variant";
    /** Código de seguimiento (tracking) del envío entregado por el courier. */
    readonly SHIPPING_TRACKING_CODE: "ct.shipping.tracking_code";
};
export type ShippingAttributesKey = (typeof ShippingAttributes)[keyof typeof ShippingAttributes];
/** Valores permitidos para el atributo enum "ct.shipping.runtime_variant". */
export declare const ShippingRuntimeVariantValues: {
    /** Ejecución sobre la JVM estándar (HotSpot). */
    readonly JVM: "jvm";
    /** Ejecución sobre GraalVM (p. ej. imagen nativa). */
    readonly GRAALVM: "graalvm";
};
export type ShippingRuntimeVariantValue = (typeof ShippingRuntimeVariantValues)[keyof typeof ShippingRuntimeVariantValues];
