import { DatabaseState, Usuario, EventoSistema, MotoEnSala, Preventa, Acta, Recibo, Revision, CorteDeVenta, SalidaExterna, LlegadaRepuesto, SalidaRepuesto, RepuestoSolicitado, ReferenciaEstudio, Matricula, ViewType, MovimientoFinanciero } from "../types";

// Helper to format Date as YYYY-MM-DD
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper to format Time as HH:MM:SS
export function getNowTimeString(): string {
  return new Date().toTimeString().split(" ")[0];
}

// Dynamically calculates the current stock for all spare parts references in the inventory
export interface StockItem {
  referencia: string;
  producto: string;
  tipo_moto?: string;
  marca_departamento: string;
  entradas: number;
  salidas: number;
  stock: number;
  precio_venta: number;
  valor_inventario: number;
}

export function calcularInventarioGeneral(db: DatabaseState): StockItem[] {
  const stockMap: { [ref: string]: StockItem } = {};

  // Accumulate all arrivals (Llegadas)
  db.llegada_de_repuestos.forEach((llegada) => {
    if (llegada.confirmacion_de_llegada === "NO CONFIRMADA" || llegada.confirmacion_de_llegada === "PENDIENTE") return;
    const ref = llegada.referencia;
    if (!stockMap[ref]) {
      stockMap[ref] = {
        referencia: ref,
        producto: llegada.producto,
        tipo_moto: llegada.tipo_moto,
        marca_departamento: llegada.marca_departamento,
        entradas: 0,
        salidas: 0,
        stock: 0,
        precio_venta: llegada.precio_venta,
        valor_inventario: 0
      };
    }
    stockMap[ref].entradas += (llegada.cantidad - (llegada.cantidad_devuelta || 0));
    stockMap[ref].precio_venta = llegada.precio_venta; // newest price has priority
  });

  // Accumulate all departures (Salidas de repuestos)
  db.salida_de_repuestos.forEach((salida) => {
    const ref = salida.referencia;
    if (!stockMap[ref]) {
      stockMap[ref] = {
        referencia: ref,
        producto: salida.producto,
        marca_departamento: salida.marca_departamento,
        entradas: 0,
        salidas: 0,
        stock: 0,
        precio_venta: salida.precio,
        valor_inventario: 0
      };
    }
    stockMap[ref].salidas += salida.cantidad;
  });

  // Re-enter inventory from approved Devoluciones
  (db.devoluciones || []).forEach((dev) => {
    if (
      dev.reingresa_inventario === "SI" &&
      dev.referencia &&
      dev.estado_devolucion !== "RECHAZADA" &&
      dev.estado_devolucion !== "CANCELADA"
    ) {
      const ref = dev.referencia;
      if (!stockMap[ref]) {
        stockMap[ref] = {
          referencia: ref,
          producto: dev.producto_concepto || "Repuesto Deuelto",
          marca_departamento: "DEVOLUCIONES",
          entradas: 0,
          salidas: 0,
          stock: 0,
          precio_venta: dev.valor_original ? dev.valor_original / (dev.cantidad || 1) : 0,
          valor_inventario: 0
        };
      }
      stockMap[ref].salidas -= (dev.cantidad || 1);
    }
  });

  // Calculate remaining stock and values
  return Object.values(stockMap).map((item) => {
    const stock = item.entradas - item.salidas;
    return {
      ...item,
      stock: stock,
      valor_inventario: stock * item.precio_venta
    };
  });
}

// Generates the ID_DEL_ENCARGO for a Preventa: XX-CÉDULA
// where XX is the consecutive number of preventas this client has had.
export function generarIdEncargo(db: DatabaseState, cedula: string): string {
  const clientPreventasCount = db.preventas.filter(
    (p) => String(p.cedula).trim() === String(cedula).trim()
  ).length;
  const consecutive = String(clientPreventasCount + 1).padStart(2, "0");
  return `${consecutive}-${cedula}`;
}

// Log a system event
export function registrarEvento(
  db: DatabaseState,
  usuario: Usuario,
  modulo: string,
  accion: string,
  prioridad: "VERDE" | "AMARILLA" | "ROJA",
  campo: string,
  valorAnterior: string,
  valorNuevo: string,
  motivo: string
): DatabaseState {
  const nextId = db.eventos.length > 0 
    ? Math.max(...db.eventos.map((e) => e.id || 0)) + 1 
    : 1;

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0];

  const newEvent: EventoSistema = {
    id: nextId,
    fecha: dateStr,
    hora: timeStr,
    usuario: usuario.nombre_completo,
    rol: usuario.rol,
    modulo: modulo,
    accion: accion,
    prioridad: prioridad,
    campo: campo,
    valor_anterior: valorAnterior,
    valor_nuevo: valorNuevo,
    motivo: motivo,
    estado: "Pendiente"
  };

  return {
    ...db,
    eventos: [newEvent, ...db.eventos]
  };
}

// Real-time calculation of Perfil de Cliente
export interface ClientProfile {
  documento: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  direccion: string;
  actas: Acta[];
  preventas: Preventa[];
  revisiones: Revision[];
  matriculas: Matricula[];
  estudios: ReferenciaEstudio[];
  recibos: Recibo[];
  repuestos_solicitados: RepuestoSolicitado[];
}

export function construirPerfilCliente(db: DatabaseState, documento: string): ClientProfile | null {
  const docToSearch = String(documento).trim();
  if (!docToSearch) return null;

  // Let's gather all transactions linked to this document
  const clientActas = db.actas.filter((a) => String(a.documento).trim() === docToSearch);
  const clientPreventas = db.preventas.filter((p) => String(p.cedula).trim() === docToSearch);
  const clientRevisiones = db.revisiones.filter((r) => String(r.cedula).trim() === docToSearch);
  const clientMatriculas = db.matriculas.filter((m) => String(m.documento).trim() === docToSearch);
  const clientEstudios = db.referencias_estudios.filter((e) => String(e.documento).trim() === docToSearch);
  const clientRequests = db.repuestos_solicitados.filter((s) => String(s.documento).trim() === docToSearch);

  // No transactions found? Let's check if there's any trace of this document.
  if (
    clientActas.length === 0 &&
    clientPreventas.length === 0 &&
    clientRevisiones.length === 0 &&
    clientMatriculas.length === 0 &&
    clientEstudios.length === 0 &&
    clientRequests.length === 0
  ) {
    return null;
  }

  // To implement the Priority update rule: "Always load the most recent and complete information"
  // Let's find the newest record to extract basic profile contact details (Nombres, Apellidos, Correo, Telefono, Direccion)
  // Let's collect all possible contacts and select the latest valid one.
  let newestContact = {
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    direccion: ""
  };

  // Check Actas (often the most complete)
  if (clientActas.length > 0) {
    const latest = clientActas[clientActas.length - 1];
    newestContact.nombre = latest.nombres;
    newestContact.apellido = latest.apellidos;
    newestContact.correo = latest.correo;
    newestContact.telefono = latest.telefono;
    newestContact.direccion = latest.direccion;
  } else if (clientPreventas.length > 0) {
    const latest = clientPreventas[clientPreventas.length - 1];
    newestContact.nombre = latest.nombre;
    newestContact.apellido = latest.apellido;
    newestContact.correo = latest.correo;
    newestContact.telefono = latest.telefono;
    newestContact.direccion = latest.direccion;
  } else if (clientRevisiones.length > 0) {
    const latest = clientRevisiones[clientRevisiones.length - 1];
    newestContact.nombre = latest.nombre;
    newestContact.apellido = latest.apellidos;
    newestContact.correo = latest.correo;
    newestContact.telefono = latest.telefono;
    newestContact.direccion = latest.direccion;
  } else if (clientMatriculas.length > 0) {
    const latest = clientMatriculas[clientMatriculas.length - 1];
    newestContact.nombre = latest.nombre;
    newestContact.apellido = latest.apellidos;
    newestContact.telefono = latest.celular;
  }

  // Get receipts associated
  const clientRecibos = db.recibos.filter((r) => {
    return r.recibo_de_pertenencia.toLowerCase().includes(docToSearch.toLowerCase()) ||
           r.recibo_de_pertenencia.toLowerCase().includes(newestContact.nombre.toLowerCase());
  });

  return {
    documento: docToSearch,
    nombre_completo: `${newestContact.nombre} ${newestContact.apellido}`.trim() || "Cliente Sin Nombre",
    correo: newestContact.correo || "No registrado",
    telefono: newestContact.telefono || "No registrado",
    direccion: newestContact.direccion || "No registrada",
    actas: clientActas,
    preventas: clientPreventas,
    revisiones: clientRevisiones,
    matriculas: clientMatriculas,
    estudios: clientEstudios,
    recibos: clientRecibos,
    repuestos_solicitados: clientRequests
  };
}

// Real-time calculation of Perfil de Motocicleta
export interface MotoProfile {
  chasis: string;
  motor: string;
  motocicleta: string;
  color: string;
  modelo: string;
  cilindraje: string;
  precio_base: number;
  vendida: string;
  placa: string;
  sede: string;
  envio_fecha: string;
  acta: Acta | null;
  matricula: Matricula | null;
  revisiones: Revision[];
}

export function construirPerfilMoto(db: DatabaseState, identificador: string): MotoProfile | null {
  const value = String(identificador).trim().toLowerCase();
  if (!value) return null;

  // Search in showroom stock
  const showroomMoto = db.motos_en_sala.find(
    (m) => m.numero_chasis.toLowerCase() === value || m.numero_motor.toLowerCase() === value
  );

  // If not in stock, look for associated records in Actas, Revisions, Matriculas
  const associatedActa = db.actas.find(
    (a) => a.chasis.toLowerCase() === value || a.motor.toLowerCase() === value
  );

  const associatedMatricula = db.matriculas.find(
    (m) => m.chasis.toLowerCase() === value || m.motor.toLowerCase() === value
  );

  const associatedRevisiones = db.revisiones.filter(
    (r) => r.chasis.toLowerCase() === value || r.motor.toLowerCase() === value
  );

  if (!showroomMoto && !associatedActa && !associatedMatricula && associatedRevisiones.length === 0) {
    return null;
  }

  // Plate Priority rule: Matrículas plate first, then Revisiones newest plate
  let plate = "Sin Placa";
  if (associatedMatricula && associatedMatricula.rango) {
    plate = associatedMatricula.rango;
  } else if (associatedActa && associatedActa.rango) {
    plate = associatedActa.rango;
  } else if (associatedRevisiones.length > 0) {
    const withPlates = associatedRevisiones.filter((r) => r.placa);
    if (withPlates.length > 0) {
      plate = withPlates[withPlates.length - 1].placa;
    }
  }

  return {
    chasis: showroomMoto?.numero_chasis || associatedActa?.chasis || associatedMatricula?.chasis || "N/A",
    motor: showroomMoto?.numero_motor || associatedActa?.motor || associatedMatricula?.motor || "N/A",
    motocicleta: showroomMoto?.motocicleta || associatedActa?.moto || associatedMatricula?.motocicleta || "N/A",
    color: showroomMoto?.color || associatedActa?.color || "N/A",
    modelo: showroomMoto?.modelo || associatedActa?.modelo || associatedMatricula?.modelo || "N/A",
    cilindraje: showroomMoto?.cilindraje || associatedActa?.cilindraje || associatedMatricula?.cilindraje || "N/A",
    precio_base: showroomMoto?.precio || associatedActa?.valor_moto || 0,
    vendida: showroomMoto?.vendida || (associatedActa ? "SI" : "NO"),
    placa: plate,
    sede: showroomMoto?.sitio_de_donde_viene || "No registrada",
    envio_fecha: showroomMoto?.fecha_envio || "No registrada",
    acta: associatedActa || null,
    matricula: associatedMatricula || null,
    revisiones: associatedRevisiones
  };
}

// Global search utility mapping matching modules
export interface GlobalSearchResult {
  modulo: string;
  llave: string; // e.g. "90909090"
  tipoView: ViewType;
  descripcion: string;
}

export function buscadorGlobal(db: DatabaseState, query: string): GlobalSearchResult[] {
  const val = query.trim().toLowerCase();
  if (!val || val.length < 3) return [];

  const results: GlobalSearchResult[] = [];

  // Search users
  db.usuarios.forEach((u) => {
    if (
      u.nombre_completo.toLowerCase().includes(val) ||
      u.documento.includes(val) ||
      u.usuario.toLowerCase().includes(val)
    ) {
      results.push({
        modulo: "Usuarios",
        llave: u.documento,
        tipoView: "Usuarios",
        descripcion: `Empleado: ${u.nombre_completo} (${u.rol})`
      });
    }
  });

  // Search motorcycles
  db.motos_en_sala.forEach((m) => {
    if (
      m.numero_chasis.toLowerCase().includes(val) ||
      m.numero_motor.toLowerCase().includes(val) ||
      m.motocicleta.toLowerCase().includes(val)
    ) {
      results.push({
        modulo: "Motos en Sala",
        llave: m.numero_chasis,
        tipoView: "MotosPerfil",
        descripcion: `Motocicleta: ${m.motocicleta} (${m.color})`
      });
    }
  });

  // Search sales acts
  db.actas.forEach((a) => {
    if (
      a.acta.includes(val) ||
      a.documento.includes(val) ||
      a.nombres.toLowerCase().includes(val) ||
      a.apellidos.toLowerCase().includes(val)
    ) {
      results.push({
        modulo: "Datos Actas",
        llave: a.acta,
        tipoView: "Actas",
        descripcion: `Acta #${a.acta} - Cliente: ${a.nombres} ${a.apellidos}`
      });
    }
  });

  // Search pre-sales
  db.preventas.forEach((p) => {
    if (
      p.id_del_encargo.toLowerCase().includes(val) ||
      p.cedula.includes(val) ||
      p.nombre.toLowerCase().includes(val) ||
      p.apellido.toLowerCase().includes(val)
    ) {
      results.push({
        modulo: "Preventas",
        llave: p.id_del_encargo,
        tipoView: "Preventas",
        descripcion: `Encargo: ${p.id_del_encargo} - Cliente: ${p.nombre} ${p.apellido}`
      });
    }
  });

  // Search backorders / requested spare parts
  db.repuestos_solicitados.forEach((s) => {
    if (
      s.referencia.toLowerCase().includes(val) ||
      s.producto.toLowerCase().includes(val) ||
      s.documento.includes(val) ||
      s.nombre.toLowerCase().includes(val)
    ) {
      results.push({
        modulo: "Repuestos Solicitados",
        llave: s.referencia,
        tipoView: "RepuestosSolicitados",
        descripcion: `Pedido de Repuesto: ${s.producto} (Ref: ${s.referencia})`
      });
    }
  });

  // Search credit studies platform
  db.referencias_estudios.forEach((e) => {
    if (e.documento.includes(val) || e.nombres_completos_cliente.toLowerCase().includes(val)) {
      results.push({
        modulo: "Referencias Estudios",
        llave: e.documento,
        tipoView: "ReferenciasEstudios",
        descripcion: `Estudio Crédito: ${e.nombres_completos_cliente} (${e.plataforma})`
      });
    }
  });

  // De-duplicate results slightly
  return results.slice(0, 15);
}

export function registrarTransferencia(
  db: DatabaseState,
  modulo: string,
  referenciaOrigen: string,
  monto: number,
  observaciones: string,
  usuario: string
): DatabaseState {
  if (monto <= 0) return db;
  const newTransfer = {
    id: `trans-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fecha: getTodayDateString(),
    modulo,
    referencia_origen: referenciaOrigen,
    monto,
    observaciones,
    usuario
  };
  return {
    ...db,
    transferencias: [newTransfer, ...(db.transferencias || [])]
  };
}

// Auto-register monetary movement in MOVIMIENTOS FINANCIEROS (Sheet 18)
export function registrarMovimientoFinanciero(
  db: DatabaseState,
  mov: Omit<MovimientoFinanciero, "id_movimiento" | "fecha" | "hora">
): DatabaseState {
  const nextId = `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const dateStr = getTodayDateString();
  const timeStr = getNowTimeString();

  const newMov: MovimientoFinanciero = {
    id_movimiento: nextId,
    fecha: dateStr,
    hora: timeStr,
    ...mov
  };

  return {
    ...db,
    movimientos_financieros: [newMov, ...(db.movimientos_financieros || [])]
  };
}

// KM validation according to DOCUMENTO MAESTRO ERP - REVISIONES rule 5
// Returns max previous KM and whether new KM is lower than historical max.
export function validarKilometrajeRevision(
  db: DatabaseState,
  motor: string,
  chasis: string,
  nuevoKm: number
): { maxHistoricoKm: number; disminuyeKm: boolean } {
  const motorNorm = (motor || "").trim().toLowerCase();
  const chasisNorm = (chasis || "").trim().toLowerCase();

  const previousRevisions = db.revisiones.filter((r) => {
    const rMotor = (r.motor || "").trim().toLowerCase();
    const rChasis = (r.chasis || "").trim().toLowerCase();
    return (
      (rMotor && rMotor === motorNorm) ||
      (rChasis && rChasis === chasisNorm)
    );
  });

  let maxKm = 0;
  previousRevisions.forEach((r) => {
    const val = parseInt(String(r.km).replace(/\D/g, ""), 10) || 0;
    if (val > maxKm) maxKm = val;
  });

  return {
    maxHistoricoKm: maxKm,
    disminuyeKm: maxKm > 0 && nuevoKm < maxKm
  };
}

// Auto-retrieves motorcycle and client information for REVISIONES according to rules 4, 11, 12
export function autocompletarRevisionData(
  db: DatabaseState,
  identificadorMoto: string, // Motor or Chasis
  documentoCliente: string  // Cedula
): Partial<Revision> {
  const motoNorm = (identificadorMoto || "").trim().toLowerCase();
  const docNorm = (documentoCliente || "").trim();

  let autoData: Partial<Revision> = {};

  // 1. Retrieve Moto details (DATOS ACTAS, MATRICULAS, MOTOS EN SALA, previous REVISIONES)
  if (motoNorm) {
    const matchActa = db.actas.find(
      (a) => a.chasis?.toLowerCase() === motoNorm || a.motor?.toLowerCase() === motoNorm
    );
    const matchMatricula = db.matriculas.find(
      (m) => m.chasis?.toLowerCase() === motoNorm || m.motor?.toLowerCase() === motoNorm
    );
    const matchSala = db.motos_en_sala.find(
      (s) => s.numero_chasis?.toLowerCase() === motoNorm || s.numero_motor?.toLowerCase() === motoNorm
    );
    const matchRev = db.revisiones.find(
      (r) => r.chasis?.toLowerCase() === motoNorm || r.motor?.toLowerCase() === motoNorm
    );

    if (matchActa) {
      autoData.moto = matchActa.moto;
      autoData.motor = matchActa.motor;
      autoData.chasis = matchActa.chasis;
      autoData.modelo = matchActa.modelo;
      autoData.color = matchActa.color;
      autoData.cilindraje = matchActa.cilindraje;
      autoData.placa = matchActa.rango || "Sin Placa";
      autoData.fecha_compra = matchActa.fecha;
      autoData.cedula = matchActa.documento;
      autoData.nombre = matchActa.nombres;
      autoData.apellidos = matchActa.apellidos;
      autoData.correo = matchActa.correo;
      autoData.direccion = matchActa.direccion;
      autoData.telefono = matchActa.telefono;
    } else if (matchMatricula) {
      autoData.moto = matchMatricula.motocicleta;
      autoData.motor = matchMatricula.motor;
      autoData.chasis = matchMatricula.chasis;
      autoData.modelo = matchMatricula.modelo;
      autoData.cilindraje = matchMatricula.cilindraje;
      autoData.placa = matchMatricula.rango || "Sin Placa";
      autoData.ciudad = matchMatricula.ciudad;
      autoData.cedula = matchMatricula.documento;
      autoData.nombre = matchMatricula.nombre;
      autoData.apellidos = matchMatricula.apellidos;
      autoData.telefono = matchMatricula.celular;
    } else if (matchSala) {
      autoData.moto = matchSala.motocicleta;
      autoData.motor = matchSala.numero_motor;
      autoData.chasis = matchSala.numero_chasis;
      autoData.modelo = matchSala.modelo;
      autoData.color = matchSala.color;
      autoData.cilindraje = matchSala.cilindraje;
    } else if (matchRev) {
      autoData = { ...matchRev };
    }
  }

  // 2. Retrieve newest Client details from PERFIL CLIENTE / PREVENTAS / ACTAS if document provided
  if (docNorm) {
    const profile = construirPerfilCliente(db, docNorm);
    if (profile) {
      autoData.cedula = docNorm;
      const nameParts = profile.nombre_completo.split(" ");
      autoData.nombre = nameParts[0] || autoData.nombre || "";
      autoData.apellidos = nameParts.slice(1).join(" ") || autoData.apellidos || "";
      if (profile.correo && profile.correo !== "No registrado") autoData.correo = profile.correo;
      if (profile.telefono && profile.telefono !== "No registrado") autoData.telefono = profile.telefono;
      if (profile.direccion && profile.direccion !== "No registrada") autoData.direccion = profile.direccion;
    }
  }

  return autoData;
}
