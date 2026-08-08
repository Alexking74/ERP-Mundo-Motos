# EMPALME DE AUDITORÍA Y SINCRONIZACIÓN: ERP HONDA vs. DOCUMENTO MAESTRO

Este documento detalla el **empalme total y definitivo** realizado entre el sistema ERP digital desarrollado en **React + Node.js (Express) + Google Apps Script** y las especificaciones exactas de columnas y hojas del **Documento Maestro ERP Honda (Versión 1.0)**. 

Se ha auditado hoja por hoja, asegurando que todos los formularios, cálculos en tiempo real, validaciones y automatizaciones escriban exactamente en el orden posicional y con las claves de datos requeridas por el modelo relacional de Google Sheets.

---

## FILOSOFÍA DE LA INTEGRACIÓN DE DATOS (MÓDULOS VIRTUALES)
Como se especifica en las directrices de diseño del Documento Maestro, el sistema **no posee tablas físicas duplicadas** para ciertos perfiles o inventarios. En su lugar, el ERP calcula dinámicamente en tiempo real:
1. **Perfil del Cliente:** Reunido dinámicamente mediante la búsqueda indexada de la **Cédula / Documento** en *Preventas*, *Datos Actas*, *Matrículas para Tránsito*, *Revisiones*, *Referencias Estudios* y *Recibos*. Siempre prioriza la información de contacto más reciente y completa.
2. **Perfil de la Motocicleta:** Rastreado por **Chasis o Motor** como llaves naturales únicas en *Motos en Sala*, *Datos Actas*, *Matrículas*, y *Revisiones*.
3. **Inventario General de Repuestos:** Calculado en tiempo real sustrayendo el acumulado de *Salida de Repuestos* (ventas/tickets) del acumulado de *Llegada de Repuestos* (compras/entradas).

---

## AUDITORÍA DETALLADA DE LAS 14 HOJAS DEL SISTEMA

### HOJA 1: MATRÍCULAS PARA TRANSITO
* **Fila de Inicio de Información:** Fila 4 (Filas 1 a 3 reservadas para títulos y encabezados).
* **Total de Columnas:** 18 columnas (A - R).
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA                      | `fecha`                       | Automática. Fecha de creación del trámite. |
| **B** | RANGO                      | `rango`                       | Placa asignada. Autocompletable o modificable posteriormente. |
| **C** | NOMBRE                     | `nombre`                      | Autocompletado automático desde *Datos Actas* (Inmutable manual). |
| **D** | APELLIDOS                  | `apellidos`                   | Autocompletado automático desde *Datos Actas* (Inmutable manual). |
| **E** | TIPO DOCUMENTO             | `tipo_documento`              | Autocompletado automático desde *Datos Actas*. |
| **F** | DOCUMENTO                  | `documento`                   | Llave de relación del cliente. Permite abrir Perfil del Cliente. |
| **G** | CELULAR                    | `celular`                     | Autocompletado automático de contacto más reciente del cliente. |
| **H** | MOTOCICLETA                | `motocicleta`                 | Autocompletado desde el acta de venta vinculada. |
| **I** | MOTOR                      | `motor`                       | Llave única del vehículo. Validación: Bloquea duplicados. Alerta Roja. |
| **J** | CHASIS                     | `chasis`                      | Llave única del vehículo. Validación: Bloquea duplicados. Alerta Roja. |
| **K** | MODELO                     | `modelo`                      | Autocompletado desde *Motos en Sala*. |
| **L** | CILINDRAJE                 | `cilindraje`                  | Autocompletado desde *Motos en Sala*. |
| **M** | CIUDAD                     | `ciudad`                      | Ciudad donde se realiza el trámite. Modificable. |
| **N** | TRÁNSITO                   | `transito`                    | Organismo de tránsito (Seleccionable de lista predefinida). |
| **O** | IMPUESTO                   | `impuesto`                    | Valor del impuesto. Editable. Cambios generan Evento de Auditoría. |
| **P** | VALOR                      | `valor`                       | Valor del trámite. Alerta verde (Admin) o Alerta Roja (Vendedor). |
| **Q** | NOTAS                      | `notas`                       | Observaciones del estado del trámite de matrícula. |
| **R** | ESTADO                     | `estado`                      | Pendiente \| En proceso \| Finalizado \| Cancelado. |

---

### HOJA 2: DATOS ACTAS
* **Fila de Inicio de Información:** Fila 4 (Filas 1 a 3 reservadas para títulos y encabezados).
* **Total de Columnas:** 35 columnas (A - AI / AJ). El "Corazón del ERP" que conecta toda la venta.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA                      | `fecha`                       | Automática. Ineditable tras el guardado del acta. |
| **B** | ACTA                       | `acta`                        | Número único. Validación estricta de duplicación (Alerta Roja). |
| **C** | DECLARANTE DIAN            | `declarante_dian`             | SI \| NO (Marca internamente si usa facturación electrónica). |
| **D** | TIPO DOCUMENTO             | `tipo_documento`              | Manual de lista desplegable (CC, CE, NIT, TI, PASAPORTE, PEP). |
| **E** | DOCUMENTO                  | `documento`                   | Llave principal del cliente. Carga Perfil de forma automática. |
| **F** | NOMBRES                    | `nombres`                     | Autocompletado. Editable (Genera Evento Verde/Amarillo según rol). |
| **G** | APELLIDOS                  | `apellidos`                   | Autocompletado. Mismo comportamiento que Nombres. |
| **H** | TELÉFONO                   | `telefono`                    | Autocompletado. Actualiza el perfil global del cliente. |
| **I** | TELÉFONO 2                 | `telefono_2`                  | Manual independiente del historial de contactos. |
| **J** | DIRECCIÓN                  | `direccion`                   | Autocompletado. Editable. |
| **K** | CORREO                     | `correo`                      | Autocompletado. Editable. |
| **L** | MOTO                       | `moto`                        | Nombre comercial del modelo vendido. |
| **M** | COLOR                      | `color`                       | Color de la motocicleta vendida (Cargado de inventario). |
| **N** | MODELO                     | `modelo`                      | Año modelo de la motocicleta vendida. |
| **O** | MOTOR                      | `motor`                       | Buscador principal. Bloquea si la moto ya fue marcada como "Vendida". |
| **P** | CHASIS                     | `chasis`                      | Buscador secundario. Mismas restricciones estrictas que Motor. |
| **Q** | CILINDRAJE                 | `cilindraje`                  | Autocompletado del cilindraje de la moto. |
| **R** | VALOR MOTO                 | `valor_moto`                  | Valor base de venta. Vendedor genera Alerta Roja al modificarlo. |
| **S** | RECIBOS                    | `recibos`                     | Visor estructurado de recibos asociados provenientes de Preventas. |
| **T** | EFECTIVO                   | `efectivo`                    | Ingreso de dinero en caja física. Recalcula abonos de forma activa. |
| **U** | TRANSFERENCIA              | `transferencia`               | Valor pagado vía digital. Actualiza bancos y genera Auditoría. |
| **V** | DESEMBOLSO / PLATAFORMA    | `desembolso_plataforma`       | Carga créditos de estudios financieros aprobados de forma directa. |
| **W** | CONSULTORA                 | `consultora`                  | Si la preventa asociada tenía una consultora, se asume directamente. |
| **X** | TOTAL RECIBIDO             | `total_recibido`              | Sumatoria automática ineditable: Efectivo + Transferencia + Desembolso. |
| **Y** | ACCESORIO PRINCIPAL        | `accesorio_principal`         | Entrega básica (CASCO, CHALECO, CASCO + CHALECO, PENDIENTE). |
| **Z** | RECIBO ACCESORIO           | `recibo_accesorio`            | Numeración independiente exclusiva del flujo de accesorios. |
| **AA**| ACCESORIOS ADICIONALES     | `accesorios_adicionales`      | Carrito POS conectado directamente con el Inventario General. |
| **AB**| REFERENCIAS                | `referencias`                 | Referencias de los accesorios adicionales vendidos para descontar stock. |
| **AC**| VALOR ACCESORIOS           | `valor_accesorios`            | Sumatoria monetaria de los accesorios agregados en el ticket. |
| **AD**| VALOR RECIBIDO ACCESORIOS  | `valor_recibido_accesorios`   | Control del dinero pagado por accesorios. |
| **AE**| PAPELERÍA                  | `papeleria`                   | SI \| NO (¿Realiza la documentación de tránsito con nosotros?). |
| **AF**| TITULAR DOCUMENTOS         | `titular_documentos`          | Nombre de la persona a quien quedará matriculado el vehículo. |
| **AG**| RANGO                      | `rango`                       | Placa final (Se sincroniza bidireccionalmente con *Matrículas*). |
| **AH**| ESTADO                     | `estado`                      | Pendiente \| Completa \| En Matrícula \| En Revisiones \| Finalizada. |
| **AI**| DEUDA ACTUAL               | `deuda_actual`                | Fórmula exacta: (Valor Moto + Valor Accesorios) - Total Recibido. |

---

### HOJA 3: PREVENTAS
* **Fila de Inicio de Información:** Fila 4.
* **Total de Columnas:** 23 columnas (A - W).
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA DE INICIO            | `fecha_de_inicio`             | Automática. Vendedor genera alerta si intenta modificarla. |
| **B** | ID DEL ENCARGO             | `id_del_encargo`              | Consecutivo de preventas del cliente + Cédula (e.g. `02-80808080`). |
| **C** | MODELO                     | `modelo`                      | Modelo de encargo general (Aún no se asigna motor/chasis específico). |
| **D** | COLOR                      | `color`                       | Color preferido por el cliente. |
| **E** | TIPO DE MOTO               | `tipo_de_moto`                | Tipo de segmento (e.g. Enduro, Calle, Scooter). |
| **F** | PRECIO MOTO                | `precio_moto`                 | Precio acordado. Cambio por Vendedor genera Alerta Roja. |
| **G** | FORMA DE PAGO              | `forma_de_pago`               | Contado \| Crédito \| Mixto \| Desembolso. |
| **H** | INGRESO EFECTIVO           | `ingreso_efectivo`            | Abono inicial en caja física. |
| **I** | INGRESO TRANSFERENCIA      | `ingreso_transferencia`       | Abono inicial vía digital. Genera Evento Amarillo en Auditoría. |
| **J** | INGRESO DESEMBOLSO         | `ingreso_desembolso`          | Monto financiado aprobado por la entidad crediticia. |
| **K** | TOTAL ABONO                | `total_abonado`               | Sumatoria ineditable de los abonos e ingresos acumulados. |
| **L** | CÉDULA                     | `cedula`                      | Documento del cliente. Llave natural para auto-llenar datos. |
| **M** | NOMBRE                     | `nombre`                      | Nombre del cliente. Editable con trazabilidad de eventos. |
| **N** | APELLIDO                   | `apellido`                    | Apellido del cliente. Editable con trazabilidad de eventos. |
| **O** | TELÉFONO                   | `telefono`                    | Teléfono del cliente. Actualiza Perfil del Cliente de forma activa. |
| **P** | CORREO                     | `correo`                      | Correo electrónico del cliente. |
| **Q** | DIRECCIÓN                  | `direccion`                   | Dirección física registrada para correspondencia. |
| **R** | RECIBOS                    | `recibos`                     | Visor estructurado de los números de recibos de caja emitidos. |
| **S** | DEUDA                      | `deuda`                       | Diferencia calculada: Precio Moto - Total Abono. |
| **T** | ESTADO                     | `estado`                      | ACTIVA \| PENDIENTE \| EN ESPERA \| FINALIZADA \| DEVUELTA. |
| **U** | VALOR DEVOLUCIÓN           | `valor_devolucion`            | Solo en caso de devolución de reserva por cancelación. |
| **V** | DETALLES DEVOLUCIÓN        | `detalles_devolucion`         | Justificación detallada obligatoria para la devolución. Alerta Roja. |
| **W** | FECHA DE SALIDA            | `fecha_salida`                | Fecha de conversión en Acta o fecha en que se canceló el encargo. |

---

### HOJA 4: RECIBOS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 6 columnas (A - F). Funciona como un Libro Diario completo e inmutable del dinero que ingresa/sale con soporte de recibo de caja.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA                      | `fecha`                       | Fecha de registro del movimiento. |
| **B** | NÚMERO RECIBO              | `numero_recibo`               | Consecutivo estrictamente único. Validación: Bloquea duplicados. |
| **C** | RECIBO DE PERTENENCIA      | `recibo_de_pertenencia`       | Titular/Beneficiario (e.g. Cliente Juan Pérez, Honda Planadas, etc). |
| **D** | CONCEPTO                   | `concepto`                    | Detalle del movimiento (e.g. Abono Preventa, Compra de Repuestos). |
| **E** | ENTRADA                    | `entrada`                     | Valor positivo de ingreso. Entrada y Salida son mutuamente excluyentes. |
| **F** | SALIDA                     | `salida`                      | Valor positivo de egreso (e.g. Gastos Administrativos). |

---

### HOJA 5: MOTOS EN SALA
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 13 columnas (A - M). Control de existencias físicas en el showroom y bodegas.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA DE ENVÍO             | `fecha_envio`                 | Fecha de despacho o llegada a la sede correspondiente. |
| **B** | NÚMERO CHASIS              | `numero_chasis`               | Llave principal única del ERP (Inmutable. Bloqueo de duplicados). |
| **C** | NÚMERO MOTOR               | `numero_motor`                | Llave principal única del ERP (Inmutable. Bloqueo de duplicados). |
| **D** | MOTOCICLETA                | `motocicleta`                 | Nombre comercial del vehículo. |
| **E** | COLOR                      | `color`                       | Color físico exacto. |
| **F** | PRECIO                     | `precio`                      | Precio base sugerido de venta de la motocicleta. |
| **G** | MODELO                     | `modelo`                      | Año de fabricación. |
| **H** | CILINDRAJE                 | `cilindraje`                  | Cilindraje del motor. |
| **I** | VENDIDA                    | `vendida`                     | SI \| NO (Se cambia a SI automáticamente al asentar un Acta). |
| **J** | SITIO DE DONDE VIENE       | `sitio_de_donde_viene`        | Sede de origen (e.g. Bodega Principal, Honda Ibagué). |
| **K** | CONFIRMACIÓN DE LLEGADA    | `confirmacion_de_llegada`     | CONFIRMADA \| NO CONFIRMADA \| CON NOVEDAD (Genera Alerta Roja). |
| **L** | SALIDA                     | `salida`                      | Concepto de salida (e.g. Vendida, Traslado a Purificación). |
| **M** | FECHA DE SALIDA            | `fecha_salida`                | Fecha de venta o despacho por traslado. |

---

### HOJA 6: REVISIONES
* **Fila de Inicio de Información:** Fila 4.
* **Total de Columnas:** 20 columnas (A - T).
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | KM                         | `km`                          | Kilometraje de entrada. Validación: No puede ser inferior al anterior. |
| **B** | RAZÓN                      | `razon`                       | Motivo del servicio (lista de opciones o personalizado). |
| **C** | MES                        | `mes`                         | Mes de control (e.g. ENERO, FEBRERO). No se repite para un ciclo. |
| **D** | ESTADO                     | `estado`                      | Pendiente \| Realizada \| Cancelada \| Garantía \| Reprogramada. |
| **E** | FECHA COMPRA               | `fecha_compra`                | Inmutable. Cargado automáticamente de *Datos Actas*. |
| **F** | FECHA SERVICIO             | `fecha_servicio`              | Fecha de ejecución técnica. Modificable. |
| **G** | NOMBRE                     | `nombre`                      | Nombre del cliente (Autocompletado). |
| **H** | APELLIDOS                  | `apellidos`                   | Apellido del cliente (Autocompletado). |
| **I** | CÉDULA                     | `cedula`                      | Documento de identidad del cliente (Llave del Perfil del Cliente). |
| **J** | CORREO                     | `correo`                      | Correo del cliente. Si se cambia, actualiza su perfil global. |
| **K** | DIRECCIÓN                  | `direccion`                   | Dirección del cliente. |
| **L** | TELÉFONO                   | `telefono`                    | Teléfono del cliente. |
| **M** | MOTO                       | `moto`                        | Nombre de la motocicleta (Autocompletado). |
| **N** | MOTOR                      | `motor`                       | Llave única del motor (Permite abrir el Perfil de la Moto). |
| **O** | CHASIS                     | `chasis`                      | Llave única del chasis (Permite abrir el Perfil de la Moto). |
| **P** | MODELO                     | `modelo`                      | Año modelo del vehículo. |
| **Q** | COLOR                      | `color`                       | Color de la moto. |
| **R** | CILINDRAJE                 | `cilindraje`                  | Cilindraje de la moto. |
| **S** | PLACA                      | `placa`                       | Placa actual. Si se actualiza, modifica de inmediato el Perfil Moto. |
| **T** | CIUDAD                     | `ciudad`                      | Ciudad física donde se realiza técnicamente el servicio de taller. |

---

### HOJA 7: CORTES DE VENTAS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 12 columnas (A - L).
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | # TICKET                   | `ticket`                      | Consecutivo de cierre diario. Solo modificable por Administrador. |
| **B** | FECHA                      | `fecha`                       | Día del corte contable. |
| **C** | BASE DEL DÍA               | `base_del_dia`                | Dinero inicial. Se obtiene de forma automática del corte anterior. |
| **D** | ENTRADA EFECTIVO REPUESTOS | `entrada_efectivo_repuestos`  | Suma automática de ventas de repuestos y accesorios en efectivo. |
| **E** | ENTRADA TRANSFERENCIA REP. | `entrada_transf_repuestos`    | Suma automática de ventas de repuestos pagadas vía digital. |
| **F** | ENTRADA EFECTIVO MOTOS     | `entrada_efectivo_motos`      | Suma automática de abonos y saldos de actas/preventas en efectivo. |
| **G** | ENTRADA TRANSFERENCIA MOTOS| `entrada_transf_motos`        | Suma automática de abonos y saldos de motos vía digital. |
| **H** | ENTRADA ESTUDIOS MOTOS     | `entrada_estudios_motos`      | Suma automática de desembolsos crediticios aplicados en el día. |
| **I** | SALIDAS TOTALES            | `salidas_totales`             | Suma totalizada proveniente del módulo de *Salidas Externas*. |
| **J** | SOBRANTE                   | `sobrante`                    | Ingreso manual. Diferencia positiva de arqueo físico. |
| **K** | FALTANTE                   | `faltante`                    | Ingreso manual. Diferencia negativa de arqueo físico. |
| **L** | VALOR TOTAL                | `valor_total`                 | Total de caja al cierre. Fórmula: (Base + Entradas) - Salidas. |

---

### HOJA 8: SALIDAS EXTERNAS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 6 columnas (A - F). Módulo unificado para gastos del concesionario y consignaciones bancarias.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA                      | `fecha`                       | Automática por defecto. |
| **B** | CUENTA                     | `cuenta`                      | Cuenta bancaria o caja principal de donde sale el dinero. |
| **C** | OPERACIÓN                  | `operacion`                   | Número de transacción/egreso. Identificador único de consignación. |
| **D** | VALOR (CONSIGNACIÓN)       | `valor_consignacion`          | Mayor a cero. Solo aplica si se registra una Consignación. |
| **E** | OTROS (GASTOS)             | `otros_gastos`                | Categoría/descripción del gasto (Aseo, Papelería, Almuerzo, etc). |
| **F** | VALOR (GASTO)              | `valor_gasto`                 | Mayor a cero. Gastos &gt; $500.000 generan de inmediato Alerta Roja. |

---

### HOJA 9: LLEGADA DE REPUESTOS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 8 columnas (A - H). Historial de ingresos de mercancía a stock.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA                      | `fecha`                       | Fecha de ingreso físico de la mercancía. |
| **B** | REFERENCIA                 | `referencia`                  | Código único de producto o escaneo de código de barras. |
| **C** | PRODUCTO                   | `producto`                    | Nombre comercial del repuesto/accesorio. |
| **D** | MARCA / DEPARTAMENTO       | `marca_departamento`          | Categoría (Yamalube, Honda, Aceites, Llantas, etc). |
| **E** | CANTIDAD                   | `cantidad`                    | Unidades recibidas (Mayor a cero). |
| **F** | PRECIO VENTA               | `precio_venta`                | Valor unitario al público. Cambios por vendedor generan Alerta Roja. |
| **G** | VALOR TOTAL                | `valor_total`                 | Calculado automáticamente: Cantidad × Precio Venta. |
| **H** | CONFIRMACIÓN DE LLEGADA    | `confirmacion_de_llegada`     | CONFIRMADA \| NO RECIBIDA \| CON NOVEDAD (Genera Alerta Roja). |

---

### HOJA 10: SALIDA DE REPUESTOS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 10 columnas (A - J). Historial contable de ventas de mostrador y accesorios adicionales de Actas.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA                      | `fecha`                       | Fecha en que se asienta y factura el ticket. |
| **B** | REFERENCIA                 | `referencia`                  | Código único del repuesto descontado del inventario. |
| **C** | PRODUCTO                   | `producto`                    | Nombre del repuesto vendido. |
| **D** | MARCA / DEPARTAMENTO       | `marca_departamento`          | Categoría o departamento del repuesto. |
| **E** | CANTIDAD                   | `cantidad`                    | Unidades vendidas (Valida stock disponible para no caer en negativo). |
| **F** | FORMAS DE PAGO             | `formas_de_pago`              | Efectivo \| Transferencia \| Mixto. |
| **G** | EFECTIVO                   | `efectivo`                    | Valor pagado físicamente. Alimenta *Cortes de Ventas*. |
| **H** | TRANSFERENCIA              | `transferencia`               | Valor pagado vía digital. Alimenta *Cortes de Ventas* y bancos. |
| **I** | PRECIO                     | `precio`                      | Precio unitario de venta. |
| **J** | VALOR TOTAL                | `valor_total`                 | Calculado automáticamente: Cantidad × Precio. |

---

### HOJA 11: REPUESTOS SOLICITADOS (PEDIDOS)
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 15 columnas (A - O). Gestión de backorders para retener ventas y encargar productos agotados.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | FECHA                      | `fecha`                       | Fecha en la que el cliente solicita el repuesto. |
| **B** | RAZÓN                      | `razon`                       | NO HAY (Agotado temporal) \| ENCARGO (Especial). |
| **C** | CANTIDAD                   | `cantidad`                    | Cantidad de unidades encargadas (Mayor a cero). |
| **D** | MOTO                       | `moto`                        | Línea de moto para la cual aplica (e.g. XR150, CB125F). |
| **E** | REFERENCIA                 | `referencia`                  | Identificador de repuesto para el cruce de llegada automático. |
| **F** | PRODUCTO                   | `producto`                    | Nombre del repuesto solicitado. |
| **G** | DOCUMENTO                  | `documento`                   | Documento de identidad del cliente solicitante (Llave Perfil). |
| **H** | NOMBRE                     | `nombre`                      | Nombre del cliente solicitante. |
| **I** | APELLIDOS                  | `apellidos`                   | Apellidos del cliente solicitante. |
| **J** | TELÉFONO                   | `telefono`                    | Teléfono del cliente. |
| **K** | VALOR                      | `valor`                       | Valor total cotizado del repuesto solicitado. |
| **L** | ABONO (EFECTIVO)           | `abono_efectivo`              | Se asienta en el formulario de abonos con su propio **Recibo**. |
| **M** | ABONO (TRANSFERENCIA)      | `abono_transferencia`         | Se asienta con su recibo y genera Alerta de Auditoría si es digital. |
| **N** | RECIBO                     | `recibo`                      | **Número del Recibo Oficial**. Es un campo mandatorio en cada abono. |
| **O** | ESTADO                     | `estado`                      | PENDIENTE \| SOLICITADO \| EN CAMINO \| DISPONIBLE \| ENTREGADO \| CANCELADO. |

---

### HOJA 12: REFERENCIAS ESTUDIOS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 13 columnas (A - M). Registro estructurado de codeudores y referencias de viabilidad de crédito.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | No.                        | `no`                          | Número consecutivo inmutable y único de estudio financiero. |
| **B** | DOCUMENTO                  | `documento`                   | Documento de identidad del cliente (Llave del Perfil del Cliente). |
| **C** | NOMBRES COMPLETOS CLIENTE  | `nombres_completos_cliente`   | Nombre completo del cliente (Autocompletado o manual). |
| **D** | NOMBRE REFERENCIA 1        | `nombre_referencia_1`         | Nombre de la primera referencia (Mandatorio). |
| **E** | DIRECCIÓN                  | `direccion_1`                 | Dirección de domicilio de la primera referencia. |
| **F** | BARRIO                     | `barrio_1`                    | Barrio de la primera referencia. |
| **G** | TELÉFONO                   | `telefono_1`                  | Celular de contacto de la primera referencia (Validado). |
| **H** | NOMBRE REFERENCIA 2        | `nombre_referencia_2`         | Nombre de la segunda referencia (Mandatorio). |
| **I** | DIRECCIÓN                  | `direccion_2`                 | Dirección de domicilio de la segunda referencia. |
| **J** | BARRIO                     | `barrio_2`                    | Barrio de la segunda referencia. |
| **K** | TELÉFONO                   | `telefono_2`                  | Celular de contacto de la segunda referencia (Validado). |
| **L** | PLATAFORMA                 | `plataforma`                  | Entidad que otorga el crédito (SUFI, Brilla, Finandina, etc). |
| **M** | ACTA                       | `acta`                        | Número de acta asociada (Funciona como enlace directo de navegación). |

---

### HOJA 13: EVENTOS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 13 columnas (A - M). La caja negra de auditoría inalterable del ERP.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | ID                         | `id`                          | Consecutivo de auditoría inmutable e incremental. |
| **B** | FECHA                      | `fecha`                       | Automático. Día del evento. |
| **C** | HORA                       | `hora`                        | Automático. Hora exacta del suceso (Formato: `HH:MM:SS`). |
| **D** | USUARIO                    | `usuario`                     | Nombre del empleado que ejecuta la acción (No el cliente). |
| **E** | ROL                        | `rol`                         | Cargo del usuario (Administrador, Vendedor, Sala). |
| **F** | MÓDULO                     | `modulo`                      | Módulo donde ocurre la acción (PREVENTAS, ACTAS, RECIBOS, etc). |
| **G** | ACCIÓN                     | `accion`                      | Tipo de operación (Crear, Editar, Eliminar, Iniciar Sesión, etc). |
| **H** | PRIORIDAD                  | `prioridad`                   | VERDE \| AMARILLA \| ROJA. |
| **I** | CAMPO                      | `campo`                       | Nombre exacto de la variable que sufrió modificación (e.g. Precio). |
| **J** | VALOR ANTERIOR             | `valor_anterior`              | Estado del dato previo a la modificación. |
| **K** | VALOR NUEVO                | `valor_nuevo`                 | Estado del dato posterior a la modificación. |
| **L** | MOTIVO                     | `motivo`                      | Justificación obligatoria para eventos Amarillos y Rojos. |
| **M** | ESTADO                     | `estado`                      | Pendiente \| Confirmado físicamente \| Presenta diferencia \| etc. |

---

### HOJA 14: USUARIOS
* **Fila de Inicio de Información:** Fila 3.
* **Total de Columnas:** 15 columnas (A - O). Gestión de personal de acceso.
* **Mapeo de Campos de Escritura:**

| Letra | Columna Documento Maestro | Clave del Modelo de Datos ERP | Origen del Campo / Comportamiento |
| :---: | :------------------------- | :---------------------------- | :--------------------------------- |
| **A** | ID_USUARIO                 | `id_usuario`                  | Consecutivo incremental único generado automáticamente. |
| **B** | NOMBRE_COMPLETO            | `nombre_completo`             | Nombre completo del empleado. |
| **C** | DOCUMENTO                  | `documento`                   | Documento de identidad del empleado. Llave única. |
| **D** | USUARIO                    | `usuario`                     | Identificador de acceso (Username). Debe ser único. |
| **E** | CONTRASEÑA                 | `contrasena`                  | Credencial encriptada (Hash). Admin solo puede verla con reautenticación. |
| **F** | ROL                        | `rol`                         | Administrador \| Vendedor \| Sala. |
| **G** | ESTADO                     | `estado`                      | Activo \| Inactivo \| Suspendido \| Bloqueado. |
| **H** | SEDE                       | `sede`                        | Chaparral \| Planadas \| Purificación \| Ibagué \| etc. |
| **I** | CELULAR                    | `celular`                     | Número de contacto telefónico del empleado. |
| **J** | CORREO                     | `correo`                      | Correo electrónico institucional o personal del empleado. |
| **K** | FECHA_CREACIÓN             | `fecha_creacion`              | Fecha de alta del usuario en el sistema. |
| **L** | ÚLTIMO_ACCESO              | `ultimo_acceso`               | Timestamp del último login exitoso del usuario. |
| **M** | CREADO_POR                 | `creado_por`                  | Nombre del Administrador que otorgó los privilegios. |
| **N** | SESIÓN_ACTIVA              | `sesion_activa`               | Sí \| No (Indica en tiempo real los empleados conectados). |
| **O** | OBSERVACIONES              | `observaciones`               | Anotaciones administrativas (e.g. Vacaciones, Reintegro). |

---

## CONCLUSIÓN DEL DIAGNÓSTICO
1. **Perfecto Empalme Posicional:** Todas las llamadas al backend para guardar o actualizar datos (`appendRowToSheet` y `updateRowInSheet`) se envían de forma secuencial exacta respetando este orden de columnas A-Z.
2. **Cero Duplicación Innecesaria:** Se previene de forma exitosa el ingreso manual de información preexistente mediante las relaciones bidireccionales automáticas guiadas por llaves naturales.
3. **Caja Negra Asegurada:** La hoja `EVENTOS` captura de manera transparente todas las operaciones críticas con sus debidos motivos y estados de verificación, proporcionando la máxima trazabilidad exigida para las auditorías.
