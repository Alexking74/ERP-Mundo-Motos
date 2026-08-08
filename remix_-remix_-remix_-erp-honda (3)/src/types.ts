export type ViewType =
  | "Login"
  | "Escritorio"
  | "Preventas"
  | "Actas"
  | "Matriculas"
  | "Placas"
  | "Revisiones"
  | "CortesDeVentas"
  | "SalidasExternas"
  | "LlegadaDeRepuestos"
  | "SalidaDeRepuestos"
  | "RepuestosSolicitados"
  | "ReferenciasEstudios"
  | "Eventos"
  | "Usuarios"
  | "MovimientosFinancieros"
  | "ClientesPerfil"
  | "MotosPerfil"
  | "InventarioGeneral"
  | "AppsScriptTab"
  | "Comisiones"
  | "Letras"
  | "Devoluciones"
  | "Gastos";

export interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  documento: string;
  usuario: string;
  contrasena: string;
  rol: "Administrador" | "Vendedor" | "Sala";
  estado: "Activo" | "Inactivo" | "Suspendido" | "Bloqueado";
  sede: string;
  celular: string;
  correo: string;
  fecha_creacion: string;
  ultimo_acceso: string;
  creado_por: string;
  sesion_activa: "Sí" | "No";
  observaciones: string;
}

export interface MotoEnSala {
  fecha_envio: string;
  numero_chasis: string;
  numero_motor: string;
  motocicleta: string;
  color: string;
  precio: number;
  modelo: string;
  cilindraje: string;
  vendida: "SI" | "NO";
  sitio_de_donde_viene: string;
  confirmacion_de_llegada: "CONFIRMADA" | "NO CONFIRMADA" | "CON NOVEDAD";
  salida: string;
  fecha_salida: string;
}

export interface Preventa {
  fecha_de_inicio: string;
  id_del_encargo: string; // XX-DOCUMENTO
  modelo: string;
  color: string;
  tipo_de_moto: string;
  precio_moto: number;
  forma_de_pago: string;
  recibo: string; // "RECIBO"
  ingreso_efectivo: number; // "INGRESO DEL EFECTIVO"
  ingreso_bancarizado: number; // "INGRESO DEL BANCARISADO"
  moneda_digital?: string; // "MONEDA DIGITAL (PLATAFORMA)"
  ingreso_desembolso: number; // "INGRESO DEL DESEMBOLSO"
  bancos: string; // "BANCOS"
  total_abono: number; // "TOTAL DEL ABONO"
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  direccion: string;
  salida_dinero: string; // "SALIDA DEL DINERO"
  valor_salida: number; // "VALOR DE LA SALIDA"
  detalles_salida: string; // "DETALLES (RECIBOS/CUENTAS/ETC..)"
  deuda: number;
  estado: "ACTIVA" | "PENDIENTE" | "EN ESPERA" | "FINALIZADA" | "DEVUELTA";
  fecha_termino_de_pagar: string; // "FECHA TERMINO DE PAGAR"

  // Compatibility / optional fields from original structure
  valor?: number;
  detalles?: string;
  fecha_de_salida?: string;
  recibos?: string; 
  ingreso_transferencia?: number;
  valor_devolucion?: number;
  detalles_devolucion?: string;
  fecha_salida?: string;
  fecha_ultimo_abono?: string;
  abonos_historial?: Array<{
    fecha: string;
    valor: number;
    forma_pago: string;
    observaciones: string;
    numero_recibo: string;
  }>;
}

export interface Acta {
  fecha: string; // "FECHA"
  acta: string; // "ACTA #"
  declarante: string; // "DECLARANTE"
  tipo_documento: string; // "TIPO DE DOCUMENTO"
  documento: string; // "DOCUMENTO"
  nombres: string; // "NOMBRES"
  apellidos: string; // "APELLIDOS"
  telefono: string; // "TELEFONO"
  telefono_2: string; // "TELEFONO #2"
  direccion: string; // "DIRECCION"
  correo: string; // "CORREO"
  moto: string; // "MOTO"
  color: string; // "COLOR"
  modelo: string; // "MODELO"
  motor: string; // "MOTOR"
  chasis: string; // "CHASIS"
  cilindraje: string; // "CILINDRAJE"
  valor_moto: number; // "VALOR"
  recibos: string; // "RECIBOS/PAGOS"
  efectivo: number; // "VALOR EFECTIVO"
  transferencia: number; // "VALOR TRANSFERENCIA"
  plataforma_digital: string; // "PLATAFORMA DIGITAL" (e.g. Bancolombia, Nequi, etc.)
  desembolso: number; // "VALOR DESEMBOLSO"
  consultora: string; // "CONSULTORA UTILIZADA"
  total_recibido: number; // "TOTAL RECIBIDO"
  accesorio_principal: string; // "ASESORIO" (e.g. CASCO + CHALECO)
  recibo_accesorio: string; // "RECIBO"
  accesorios_adicionales: string; // "ACCESORIOS ADICIONALES"
  valor_accesorios: number; // "VALOR TOTAL" (accessory cost)
  valor_recibido_accesorios: number; // "VALOR RECIBIDO" (accessory payment)
  papeleria: string; // "PAPELES  (SI/ NO)"
  titular_documentos: string; // "NOMBRE DEL TITULAR"
  rango: string; // "RANGO(PLACA)"
  todo_lo_recibido_en_acta: number; // "TODO LO RECIBIDO EN ACTA"
  deuda_actual: number; // "DEUDA ACTUAL"
  vendedor?: string; // "VENDEDOR" / "ASESOR COMERCIAL"

  // Compatibility / optional fields:
  declarante_dian?: "SI" | "NO";
  abono_preventa?: number;
  referencias?: string;
  estado?: string; // e.g. "Pendiente", "Completa", etc.
  abonos_adicionales?: Array<{
    fecha: string;
    efectivo: number;
    transferencia: number;
    consignacion: number;
    observaciones: string;
    numero_recibo: string;
  }>;
}

export interface Comision {
  fecha: string; // Col A: "FECHA"
  moto: string; // Col B: "MOTO"
  valor: number; // Col C: "VALOR"
  porcentaje_iva: number; // Col D: "% IVA"
  valor_iva: number; // Col E: "VALOR DE IVA"
  valor_sin_iva: number; // Col F: "VALOR SIN IVA"
  porcentaje_ganancia: number; // Col G: "%DE GANACIA"
  valor_ganancia: number; // Col H: "VALOR DE GANANCIA"
  vendedor: string; // ASESOR COMERCIAL
  acta_consecutivo: string; // ACTA ID ORIGEN
  cedula_cliente?: string;
  nombre_cliente?: string;
  estado?: "ACTIVA" | "DEVUELTA" | "AJUSTADA" | "REVERTIDA";
  observaciones_ajuste?: string;
  modificado_por?: string;
  fecha_modificacion?: string;
}

export interface Recibo {
  fecha: string;
  numero_recibo: string; // unique consecutive
  recibo_de_pertenencia: string;
  concepto: string;
  entrada: number;
  salida: number;
  estados_adicionales?: string; // "ESTADOS / ADICIONALES"
}

export interface Revision {
  km: string;
  razon: string;
  mes: string;
  estado: string; // "Pendiente" | "Realizada" | "Cancelada" | "Garantía" | "Reprogramada"
  fecha_compra: string;
  fecha_servicio: string;
  nombre: string;
  apellidos: string;
  cedula: string;
  correo: string;
  direccion: string;
  telefono: string;
  moto: string;
  motor: string;
  chasis: string;
  modelo: string;
  color: string;
  cilindraje: string;
  placa: string;
  ciudad: string;
}

export interface CorteDeVenta {
  ticket: string; // automatic consecutive ID
  fecha: string;
  base_del_dia: number;
  entrada_efectivo_repuestos: number;
  entrada_transferencia_repuestos: number;
  entrada_efectivo_motos: number;
  entrada_transferencia_motos: number;
  entrada_estudios_motos: number;
  salidas_totales: number;
  gastos_totales?: number; // Added for "GASTOS TOTALES"
  sobrante: number;
  faltante: number;
  valor_total: number;
  identidad?: string; // identity of creator
}

export interface HistorialCambioGasto {
  fecha: string;
  usuario: string;
  campo: string;
  valor_anterior: string;
  valor_nuevo: string;
  motivo: string;
}

export interface Gasto {
  id?: string;
  fecha: string;          // Col A: "FECHA"
  recibo: string;         // Col B: "RECIBO"
  razon: string;          // Col C: "RAZON"
  valor: number;          // Col D: "VALOR"
  otros?: string;         // Col E: "OTROS"
  valor_otros?: number;   // Col F: "VALOR" (asociado a otros)
  sede?: string;
  usuario_registro?: string;
  historial_cambios?: HistorialCambioGasto[];
}

export interface SalidaExterna {
  fecha: string;
  cuenta: string;
  operacion: string;
  valor_consignacion: number;
  otros_gastos: string;
  valor_gasto: number;
}

export interface LlegadaRepuesto {
  fecha: string;
  referencia: string;
  producto: string;
  tipo_moto?: string;
  marca_departamento: string;
  cantidad: number;
  precio_venta: number;
  valor_total: number;
  confirmacion_de_llegada: "CONFIRMADA" | "NO CONFIRMADA" | "CON NOVEDAD" | "PENDIENTE";
  abono_proveedor?: number;
  abonos_historial?: Array<{
    fecha: string;
    valor: number;
    forma_pago: string;
    observaciones: string;
  }>;
  cantidad_devuelta?: number;
  devoluciones_historial?: Array<{
    fecha: string;
    producto: string;
    cantidad: number;
    motivo: string;
    observaciones: string;
  }>;
}

export interface SalidaRepuesto {
  fecha: string;
  referencia: string;
  producto: string;
  marca_departamento: string;
  cantidad: number;
  formas_de_pago: "Efectivo" | "Transferencia" | "Mixto";
  efectivo: number;
  transferencia: number;
  precio: number;
  valor_total: number;
}

export interface RepuestoSolicitado {
  id?: string;
  fecha: string;
  razon: "NO HAY" | "ENCARGO";
  cantidad: number;
  moto: string;
  referencia: string;
  producto: string;
  documento?: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  valor: number;
  abono_efectivo: number;
  abono_transferencia: number;
  recibo: string;
  deuda?: number;
  estado: "PENDIENTE" | "ENCARGADO" | "RECIBIDO" | "ENTREGADO" | "CANCELADO" | "SOLICITADO" | "EN CAMINO" | "DISPONIBLE";
  abonos_historial?: Array<{
    fecha: string;
    valor: number;
    forma_pago: "Efectivo" | "Transferencia";
    numero_recibo: string;
    usuario: string;
    observaciones?: string;
  }>;
  devolucion_motivo?: string;
  devolucion_obs?: string;
}

export interface ReferenciaEstudio {
  no: number;
  documento: string;
  nombres_completos_cliente: string;
  nombre_referencia_1: string;
  direccion_1: string;
  barrio_1: string;
  telefono_1: string;
  nombre_referencia_2: string;
  direccion_2: string;
  barrio_2: string;
  telefono_2: string;
  plataforma: string; // e.g. SUFI, Brilla, etc.
  acta: string;
}

export interface EventoSistema {
  id: number;
  fecha: string;
  hora: string;
  usuario: string;
  rol: string;
  modulo: string;
  accion: string;
  prioridad: "VERDE" | "AMARILLA" | "ROJA";
  campo: string;
  valor_anterior: string;
  valor_nuevo: string;
  motivo: string;
  estado: string; // "Pendiente", "Revisado", "Aprobado", "Observado", "Archivado"
}

export interface Matricula {
  fecha: string;
  rango: string;
  nombre: string;
  apellidos: string;
  tipo_documento: string;
  documento: string;
  celular: string;
  motocicleta: string;
  motor: string;
  chasis: string;
  modelo: string;
  cilindraje: string;
  ciudad: string;
  transito: string;
  impuesto: number;
  valor: number;
  notas: string;
  estado: "Pendiente" | "En proceso" | "Finalizado" | "Cancelado";
}

export interface RangoPlaca {
  id: string;
  rango_inicial: string;
  rango_final: string;
  transito_ciudad: string;
  estado: "Activo" | "Agotado";
  placas_disponibles: string[];
  placas_utilizadas: string[];
}

export interface MovimientoFinanciero {
  id_movimiento: string;            // Col A: ID MOVIMIENTO
  fecha: string;                    // Col B: FECHA
  hora: string;                     // Col C: HORA
  sede: string;                     // Col D: SEDE
  tipo_movimiento: "INGRESO" | "SALIDA" | "DEVOLUCIÓN" | "AJUSTE"; // Col E: TIPO DE MOVIMIENTO
  modulo_origen: string;            // Col F: MÓDULO ORIGEN
  documento_cliente: string;        // Col G: DOCUMENTO CLIENTE
  nombre_cliente: string;           // Col H: NOMBRE CLIENTE
  concepto: string;                 // Col I: CONCEPTO
  forma_pago: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "MONEDA DIGITAL" | "ESTUDIO" | "OTRO"; // Col J: FORMA DE PAGO
  referencia: string;               // Col K: REFERENCIA
  entidad_plataforma: string;       // Col L: ENTIDAD / PLATAFORMA
  valor: number;                    // Col M: VALOR
  tipo_operacion: "RECIBIDO" | "ENTREGADO"; // Col N: TIPO DE OPERACIÓN
  documento_origen: string;         // Col O: DOCUMENTO ORIGEN
  usuario: string;                  // Col P: USUARIO
  estado: "CONFIRMADO" | "PENDIENTE" | "ANULADO" | "REVERSADO"; // Col Q: ESTADO
  observaciones: string;            // Col R: OBSERVACIONES
}

export interface DatabaseState {
  usuarios: Usuario[];
  motos_en_sala: MotoEnSala[];
  preventas: Preventa[];
  actas: Acta[];
  recibos: Recibo[];
  revisiones: Revision[];
  cortes_de_ventas: CorteDeVenta[];
  salidas_externas: SalidaExterna[];
  llegada_de_repuestos: LlegadaRepuesto[];
  salida_de_repuestos: SalidaRepuesto[];
  repuestos_solicitados: RepuestoSolicitado[];
  referencias_estudios: ReferenciaEstudio[];
  eventos: EventoSistema[];
  matriculas: Matricula[];
  rangos_placas?: RangoPlaca[];
  transferencias?: Transferencia[];
  comisiones: Comision[];
  letras: Letra[];
  devoluciones?: Devolucion[];
  movimientos_financieros?: MovimientoFinanciero[];
  clientes_perfil?: ClientePerfil[];
  gastos: Gasto[];
}

export interface ClientePerfil {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  telefono_principal: string;
  telefono_secundario: string;
  correo_electronico: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  fecha_registro: string;
  ultima_actualizacion: string;
  estado: string;
  observaciones: string;
  usuario_que_registra: string;
  usuario_ultima_actualizacion: string;
  autorizacion_contacto: "SI" | "NO";
}

export interface Devolucion {
  fecha_devolucion: string;        // Col A
  sede: string;                    // Col B
  sector: string;                  // Col C (MOTOS, PREVENTAS, REPUESTOS, ACCESORIOS, POS, OTRO)
  modulo_origen: string;           // Col D
  tipo_documento: string;          // Col E
  numero_documento: string;        // Col F
  nombres: string;                 // Col G
  apellidos: string;               // Col H
  telefono: string;                // Col I
  correo_electronico: string;      // Col J
  tipo_devolucion: string;         // Col K (TOTAL, PARCIAL, REVERSIÓN, CANCELACIÓN)
  referencia: string;              // Col L
  producto_concepto: string;       // Col M
  cantidad: number;                // Col N
  modelo: string;                  // Col O
  chasis: string;                  // Col P
  motor: string;                   // Col Q
  color: string;                   // Col R
  valor_original: number;          // Col S
  valor_pagado_abonado: number;    // Col T
  valor_devuelto: number;          // Col U
  forma_pago_original: string;     // Col V
  forma_devolucion: string;        // Col W
  estado_producto: string;         // Col X
  reingresa_inventario: "SI" | "NO"; // Col Y
  motivo_devolucion: string;       // Col Z
  observaciones: string;           // Col AA
  asesor_responsable: string;      // Col AB
  autorizado_por: string;          // Col AC
  estado_devolucion: "PENDIENTE" | "EN REVISIÓN" | "AUTORIZADA" | "PROCESADA" | "RECHAZADA" | "CERRADA" | "CANCELADA"; // Col AD
  fecha_cierre: string;            // Col AE
}

export interface Letra {
  casillero: string;              // "CASILLERO"
  numero_letras: number;          // "NUMERO LETRAS"
  fecha: string;                  // "FECHA"
  numero_letra_a_pagar: number;   // "# DE LETRA A PAGAR"
  forma_pago: string;             // "FORMA DE PAGO"
  recibo: string;                 // "RECIBO"
  valor_letra: number;            // "VALOR DE LA LETRA"
  total_recibido: number;         // "TOTAL RECIBIDO"
  deuda: number;                  // "DEUDA"
  nombre: string;                 // "NOMBRE"
  apellido: string;               // "APELLIDO"
  numero_documento: string;       // "NUMERO DOCUMENTO"
  telefono: string;               // "TELEFONO"
  correo: string;                 // "CORREO"
  direccion: string;              // "DIRECCION"
  motocicleta: string;            // "MOTOCICLETA"
  motor: string;                  // "MOTOR"
  chasis: string;                 // "CHASIS"
  color: string;                  // "COLOR"
  valor: number;                  // "VALOR"
  estado: string;                 // "ESTADO"
}

export interface Transferencia {
  id: string;
  fecha: string;
  modulo: string;
  referencia_origen: string;
  monto: number;
  observaciones?: string;
  usuario: string;
}

// Spare parts catalog template to help match names and check stock
export interface CatalogoItem {
  referencia: string;
  producto: string;
  marca_departamento: string;
  precio_venta: number;
}
