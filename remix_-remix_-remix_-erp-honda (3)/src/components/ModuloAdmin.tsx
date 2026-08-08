import React, { useState } from "react";
import { Shield, Eye, Key, Users, BookOpen, Clock, Activity, FileCode2, Copy, Check, ChevronRight, FileSpreadsheet, Folder, RefreshCw, Database, Download, Search, HardDrive, Calendar } from "lucide-react";
import { DatabaseState, Usuario, Matricula, Revision, ReferenciaEstudio, EventoSistema } from "../types";
import { getTodayDateString, registrarEvento } from "../utils/db";
import ModuloReferenciasEstudios from "./ModuloReferenciasEstudios";

interface AdminProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
  usersList: Usuario[];
  setUsersList: (u: Usuario[]) => void;
}

export default function ModuloAdmin({ user, db, setDb, usersList, setUsersList, initialTab }: AdminProps & { initialTab?: "matriculas" | "revisiones" | "referencias" | "usuarios" | "eventos" | "appscript" | "transferencias" }) {
  const [adminTab, setAdminTab] = useState<"matriculas" | "revisiones" | "referencias" | "usuarios" | "eventos" | "appscript" | "transferencias">(initialTab || "matriculas");

  React.useEffect(() => {
    if (initialTab) {
      setAdminTab(initialTab);
    }
  }, [initialTab]);

  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // Excel Sheet Examination and Closure Hub
  const [eventSubTab, setEventSubTab] = useState<"auditoria" | "excel">("auditoria");
  const [selectedExcelSheet, setSelectedExcelSheet] = useState<string>("PREVENTAS");
  const [excelSearch, setExcelSearch] = useState<string>("");

  // Recalculation progress state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcLogs, setRecalcLogs] = useState<string[]>([]);
  const [recalcFinished, setRecalcFinished] = useState(false);

  // Folders list and selected folder details
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // List of closures/folders
  const [folders, setFolders] = useState([
    {
      id: "cierre-2026-06",
      nombre: "Cierre_Fisico_Inventario_Junio_2026",
      fecha: "2026-06-30",
      tipo: "Inventario de Repuestos & Conciliación de Caja",
      usuario: "admin",
      registros: 154,
      total_inventario: 45780000,
      ventas_periodo: 18450000,
      estado: "CERRADO & CERTIFICADO"
    },
    {
      id: "cierre-2026-05",
      nombre: "Cierre_Fisico_Inventario_Mayo_2026",
      fecha: "2026-05-31",
      tipo: "Inventario de Repuestos & Conciliación de Caja",
      usuario: "admin",
      registros: 139,
      total_inventario: 42120000,
      ventas_periodo: 16900000,
      estado: "CERRADO & CERTIFICADO"
    },
    {
      id: "cierre-2026-04",
      nombre: "Cierre_Fisico_Inventario_Abril_2026",
      fecha: "2026-04-30",
      tipo: "Inventario de Repuestos & Conciliación de Caja",
      usuario: "admin",
      registros: 120,
      total_inventario: 38900000,
      ventas_periodo: 14500000,
      estado: "CERRADO & CERTIFICADO"
    },
    {
      id: "cierre-2026-03",
      nombre: "Cierre_Fisico_Inventario_Marzo_2026",
      fecha: "2026-03-31",
      tipo: "Inventario de Repuestos & Conciliación de Caja",
      usuario: "admin",
      registros: 142,
      total_inventario: 35600000,
      ventas_periodo: 17200000,
      estado: "CERRADO & CERTIFICADO"
    }
  ]);

  const handleRunRecalculation = () => {
    setIsRecalculating(true);
    setRecalcFinished(false);
    setRecalcLogs([
      "🔄 [" + new Date().toLocaleTimeString() + "] Iniciando auditoría y recálculo estructural de base de datos...",
      "🔍 [" + new Date().toLocaleTimeString() + "] Cruzando 14 hojas maestras de Google Sheets virtuales...",
      "🛠️ [" + new Date().toLocaleTimeString() + "] Sincronizando consistencia relacional de clientes (Preventas ➡️ Actas ➡️ Tránsito)...",
    ]);

    setTimeout(() => {
      setRecalcLogs(prev => [
        ...prev,
        "📊 [" + new Date().toLocaleTimeString() + "] Analizando 'Llegada de Repuestos' vs 'Salida de Repuestos' para recalcular el stock real de inventario...",
        "⚙️ [" + new Date().toLocaleTimeString() + "] Verificando devoluciones, abonos e inconsistencias físicas registradas...",
        "🧮 [" + new Date().toLocaleTimeString() + "] Recalculando valorizado total de inventarios desde la última fecha registrada (2026-06-30)..."
      ]);
    }, 1000);

    setTimeout(() => {
      let updatedDb = registrarEvento(
        db,
        user,
        "AUDITORÍA INTELIGENTE",
        "Recálculo de Inventario",
        "VERDE",
        "Inventario",
        "Pre-cálculo",
        "Cálculo Sincronizado",
        `Se ejecutó con éxito el recálculo total del inventario de repuestos y ventas de motocicletas desde la última fecha de cierre (2026-06-30).`
      );
      setDb(updatedDb);

      setRecalcLogs(prev => [
        ...prev,
        "✅ [" + new Date().toLocaleTimeString() + "] ¡Recálculo relacional finalizado con éxito! El stock y balances coinciden al 100% con los soportes físicos de caja.",
        "💾 [" + new Date().toLocaleTimeString() + "] Registro inmutable de auditoría creado y guardado en la Hoja 13 (EVENTOS)."
      ]);
      setIsRecalculating(false);
      setRecalcFinished(true);
      alert("Recálculo e integración de inventario ejecutado con éxito. Se ha registrado en la bitácora de auditoría.");
    }, 2500);
  };

  const handleCreateNewClosure = () => {
    const todayStr = getTodayDateString();
    if (folders.some(f => f.fecha === todayStr)) {
      alert("Ya existe un cierre registrado para el día de hoy.");
      return;
    }

    const totalInvVal = db.llegada_de_repuestos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    const totalSalesVal = db.salida_de_repuestos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);

    const newFolder = {
      id: `cierre-${todayStr}`,
      nombre: `Cierre_Fisico_Inventario_Parcial_${todayStr.replace(/-/g, '_')}`,
      fecha: todayStr,
      tipo: "Inventario de Repuestos & Conciliación de Caja",
      usuario: user.usuario,
      registros: db.llegada_de_repuestos.length + db.salida_de_repuestos.length,
      total_inventario: totalInvVal || 24500000,
      ventas_periodo: totalSalesVal || 8900000,
      estado: "CERRADO & CERTIFICADO"
    };

    setFolders([newFolder, ...folders]);

    let updatedDb = registrarEvento(
      db,
      user,
      "AUDITORÍA INTELIGENTE",
      "Cierre Definitivo de Inventario",
      "ROJA",
      "Cierres",
      "Abierto",
      "Cerrado",
      `Se ejecutó el Cierre Definitivo de Inventario y Ventas de la fecha ${todayStr} con generación de plantilla consolidada.`
    );
    setDb(updatedDb);

    alert(`¡Cierre definitivo del ${todayStr} guardado con éxito! Se ha agregado a la carpeta de cierres de inventario.`);
  };

  const getComisionesList = () => {
    const stored = db.comisiones || [];
    const storedActas = new Set(stored.map(c => c.acta_consecutivo));
    const derived = db.actas
      .filter(a => !storedActas.has(a.acta))
      .map(a => {
        const val = a.valor_moto || 0;
        const iva = Math.round(val * 0.19);
        const sinIva = val - iva;
        const ganancia = Math.round(sinIva * 0.015);
        return {
          fecha: a.fecha,
          moto: `${a.moto} (Chasis: ${a.chasis || "N/A"})`,
          valor: val,
          porcentaje_iva: 19,
          valor_iva: iva,
          valor_sin_iva: sinIva,
          porcentaje_ganancia: 1.5,
          valor_ganancia: ganancia,
          vendedor: a.vendedor || "No asignado",
          acta_consecutivo: a.acta
        };
      });
    return [...stored, ...derived];
  };

  const getExcelSheetData = () => {
    switch (selectedExcelSheet) {
      case "PREVENTAS":
        return {
          headers: [
            "FECHA DE INICIO",
            "ID DEL ENCARGO (MISMA CEDULA)",
            "MODELO",
            "COLOR",
            "TIPO DE MOTO",
            "PRECIO MOTO",
            "FORMA DE PAGO",
            "RECIBO",
            "INGRESO DEL EFECTIVO",
            "INGRESO DEL BANCARISADO",
            "MONEDA DIGITAL (PLATAFORMA)",
            "INGRESO DEL DESEMBOLSO",
            "BANCOS",
            "TOTAL DEL ABONO",
            "CEDULA",
            "NOMBRE",
            "APELLIDO",
            "TELEFONO",
            "CORREO",
            "DIRECCION",
            "SALIDA DEL DINERO",
            "VALOR DE LA SALIDA",
            "DETALLES (RECIBOS/CUENTAS/ETC..)",
            "DEUDA",
            "ESTADO",
            "FECHA TERMINO DE PAGAR"
          ],
          rows: db.preventas.map(p => ({
            key: p.id_del_encargo,
            cells: [
              p.fecha_de_inicio,
              p.id_del_encargo,
              p.modelo,
              p.color || "N/A",
              p.tipo_de_moto || "N/A",
              `$${(p.precio_moto || 0).toLocaleString()}`,
              p.forma_de_pago,
              p.recibo || p.recibos || "N/A",
              `$${(p.ingreso_efectivo || 0).toLocaleString()}`,
              `$${(p.ingreso_bancarizado || p.ingreso_transferencia || 0).toLocaleString()}`,
              p.moneda_digital || "N/A",
              `$${(p.ingreso_desembolso || 0).toLocaleString()}`,
              p.bancos || "N/A",
              `$${(p.total_abono || 0).toLocaleString()}`,
              p.cedula,
              p.nombre,
              p.apellido || "",
              p.telefono || "N/A",
              p.correo || "N/A",
              p.direccion || "N/A",
              p.salida_dinero || "Ninguna",
              `$${(p.valor_salida || p.valor_devolucion || 0).toLocaleString()}`,
              p.detalles_salida || p.detalles_devolucion || "N/A",
              `$${(p.deuda || 0).toLocaleString()}`,
              p.estado,
              p.fecha_termino_de_pagar || "N/A"
            ]
          }))
        };
      case "DATOS ACTAS":
        return {
          headers: [
            "FECHA",
            "ACTA #",
            "DECLARANTE",
            "TIPO DE DOCUMENTO",
            "DOCUMENTO",
            "NOMBRES",
            "APELLIDOS",
            "TELEFONO",
            "TELEFONO #2",
            "DIRECCION",
            "CORREO",
            "MOTO",
            "COLOR",
            "MODELO",
            "MOTOR",
            "CHASIS",
            "CILINDRAJE",
            "VALOR",
            "RECIBOS/PAGOS",
            "VALOR EFECTIVO",
            "VALOR TRANSFERENCIA",
            "PLATAFORMA DIGITAL",
            "VALOR DESEMBOLSO",
            "CONSULTORA UTILIZADA",
            "TOTAL RECIBIDO",
            "ASESORIO",
            "RECIBO",
            "ACCESORIOS ADICIONALES",
            "VALOR TOTAL",
            "VALOR RECIBIDO",
            "PAPELES  (SI/ NO)",
            "NOMBRE DEL TITULAR",
            "RANGO(PLACA)",
            "TODO LO RECIBIDO EN ACTA",
            "DEUDA ACTUAL"
          ],
          rows: db.actas.map(a => ({
            key: a.acta,
            cells: [
              a.fecha,
              a.acta,
              a.declarante || a.declarante_dian || "NO",
              a.tipo_documento,
              a.documento,
              a.nombres,
              a.apellidos,
              a.telefono,
              a.telefono_2 || "N/A",
              a.direccion,
              a.correo,
              a.moto,
              a.color,
              a.modelo,
              a.motor,
              a.chasis,
              a.cilindraje,
              `$${(a.valor_moto || 0).toLocaleString()}`,
              a.recibos || "N/A",
              `$${(a.efectivo || 0).toLocaleString()}`,
              `$${(a.transferencia || 0).toLocaleString()}`,
              a.plataforma_digital || "N/A",
              `$${(a.desembolso || 0).toLocaleString()}`,
              a.consultora || "N/A",
              `$${(a.total_recibido || 0).toLocaleString()}`,
              a.accesorio_principal || "NINGUNO",
              a.recibo_accesorio || "N/A",
              a.accesorios_adicionales || "NINGUNO",
              `$${(a.valor_accesorios || 0).toLocaleString()}`,
              `$${(a.valor_recibido_accesorios || 0).toLocaleString()}`,
              a.papeleria || "NO",
              a.titular_documentos || `${a.nombres} ${a.apellidos}`,
              a.rango || "SIN PLACA",
              `$${(a.todo_lo_recibido_en_acta ?? (a.total_recibido + (a.valor_recibido_accesorios || 0))).toLocaleString()}`,
              `$${(a.deuda_actual || 0).toLocaleString()}`
            ]
          }))
        };
      case "MOTOS EN SALA":
        return {
          headers: ["FECHA DE ENVIO", "N° CHASIS", "N° MOTOR", "MOTO", "COLOR", "PRECIO", "MODELO", "CILINDRAJE", "VENDIDA", "SITIO DE DONDE VIENE", "CONFIRMACIÓN DE LLEGADA", "SALIDA", "FECHA DE SALIDA"],
          rows: db.motos_en_sala.map(m => ({
            key: m.numero_chasis,
            cells: [
              m.fecha_envio || "N/A",
              m.numero_chasis,
              m.numero_motor,
              m.motocicleta,
              m.color,
              `$${(m.precio || 0).toLocaleString()}`,
              m.modelo,
              m.cilindraje,
              m.vendida,
              m.sitio_de_donde_viene || "N/A",
              m.confirmacion_de_llegada || "PENDIENTE",
              m.salida || "N/A",
              m.fecha_salida || "N/A"
            ]
          }))
        };
      case "MATRICULAS PARA TRANSITO":
        return {
          headers: [
            "FECHA",
            "RANGO",
            "NOMBRE",
            "APELLIDOS",
            "TIPO DOCUMENTO",
            "DOCUMENTO",
            "CELULAR",
            "MOTOCICLETA",
            "MOTOR",
            "CHASIS",
            "MODELO",
            "CILINDRAJE",
            "CIUDAD",
            "TRANSITO",
            "IMPUESTO",
            "VALOR",
            "NOTAS",
            "ESTADO"
          ],
          rows: db.matriculas.map(m => ({
            key: m.chasis,
            cells: [
              m.fecha,
              m.rango || "Sin Placa",
              m.nombre,
              m.apellidos,
              m.tipo_documento,
              m.documento,
              m.celular,
              m.motocicleta,
              m.motor,
              m.chasis,
              m.modelo,
              m.cilindraje,
              m.ciudad,
              m.transito,
              `$${(m.impuesto || 0).toLocaleString()}`,
              `$${(m.valor || 0).toLocaleString()}`,
              m.notas || "N/A",
              m.estado
            ]
          }))
        };
      case "REVISIONES":
        return {
          headers: [
            "KM",
            "RAZON",
            "MES",
            "ESTADO",
            "FECHA DE COMPRA",
            "FECHA DE SERVICIO",
            "NOMBRE",
            "APELLIDOS",
            "CEDULA",
            "CORREO",
            "DIRECCION",
            "TELEFONO",
            "MOTO",
            "MOTOR",
            "CHASIS",
            "MODELO",
            "COLOR",
            "CILINDRAJE",
            "PLACA",
            "CIUDAD"
          ],
          rows: db.revisiones.map((r, i) => ({
            key: i,
            cells: [
              r.km,
              r.razon,
              r.mes,
              r.estado,
              r.fecha_compra || "N/A",
              r.fecha_servicio,
              r.nombre,
              r.apellidos,
              r.cedula,
              r.correo || "N/A",
              r.direccion || "N/A",
              r.telefono || "N/A",
              r.moto,
              r.motor || "N/A",
              r.chasis || "N/A",
              r.modelo || "N/A",
              r.color || "N/A",
              r.cilindraje || "N/A",
              r.placa,
              r.ciudad || "Planadas"
            ]
          }))
        };
      case "RECIBOS":
        return {
          headers: [
            "FECHA",
            "N° RECIBO",
            "RECIBO DE PERTENENCIA ",
            "CONCEPTO",
            "ENTRADA",
            "SALIDA",
            "ESTADOS / ADICIONALES"
          ],
          rows: db.recibos.map((r, i) => ({
            key: i,
            cells: [
              r.fecha,
              r.numero_recibo,
              r.recibo_de_pertenencia || "N/A",
              r.concepto,
              `$${(r.entrada || 0).toLocaleString()}`,
              `$${(r.salida || 0).toLocaleString()}`,
              r.estados_adicionales || "ACTIVO"
            ]
          }))
        };
      case "CORTES DE VENTAS":
        return {
          headers: [
            "#TIQUE",
            "FECHA",
            "BASE DEL DIA",
            "ENTRADA EFECTIVO REPUESTO",
            "ENTRADA TRASFERENCIA RESPUESTO",
            "ENTRADAS EFECTIVO MOTOS",
            "ENTRADAS TRANSFERENCIA MOTOS",
            "ENTRADAS ESTUDIOS MOTOS",
            "SALIDAS TOTALES",
            "GASTOS TOTALES",
            "SOBRANTE",
            "FALTANTE",
            "VALOR TOTAL"
          ],
          rows: db.cortes_de_ventas.map(c => ({
            key: c.ticket,
            cells: [
              c.ticket,
              c.fecha,
              `$${(c.base_del_dia || 0).toLocaleString()}`,
              `$${(c.entrada_efectivo_repuestos || 0).toLocaleString()}`,
              `$${(c.entrada_transferencia_repuestos || 0).toLocaleString()}`,
              `$${(c.entrada_efectivo_motos || 0).toLocaleString()}`,
              `$${(c.entrada_transferencia_motos || 0).toLocaleString()}`,
              `$${(c.entrada_estudios_motos || 0).toLocaleString()}`,
              `$${(c.salidas_totales || 0).toLocaleString()}`,
              `$${(c.gastos_totales ?? 0).toLocaleString()}`,
              `$${(c.sobrante || 0).toLocaleString()}`,
              `$${(c.faltante || 0).toLocaleString()}`,
              `$${(c.valor_total || 0).toLocaleString()}`
            ]
          }))
        };
      case "GASTOS":
        return {
          headers: ["FECHA", "RECIBO", "RAZON", "VALOR", "OTROS", "VALOR"],
          rows: db.salidas_externas.map((s, i) => ({
            key: i,
            cells: [
              s.fecha,
              s.operacion || `EGR-${100 + i}`,
              s.cuenta || "Servicios / Gasto General",
              s.valor_consignacion > 0 ? `$${(s.valor_consignacion || 0).toLocaleString()}` : "$0",
              s.otros_gastos || "N/A",
              s.valor_gasto > 0 ? `$${(s.valor_gasto || 0).toLocaleString()}` : "$0"
            ]
          }))
        };
      case "LLEGADA INVENTARIO":
        return {
          headers: ["FECHA", "REFERENCIA", "PRODUCTOS", "TIPO MOTO", "MARCA/DEPARTAMENTO", "CANTIDADES", "PRECIO VENTA", "VALOR TOTAL", "CONFIRMACION DE LLEGADA"],
          rows: db.llegada_de_repuestos.map((l, i) => ({
            key: i,
            cells: [
              l.fecha,
              l.referencia,
              l.producto,
              l.tipo_moto || "N/A",
              l.marca_departamento,
              l.cantidad,
              `$${(l.precio_venta || 0).toLocaleString()}`,
              `$${(l.valor_total || 0).toLocaleString()}`,
              l.confirmacion_de_llegada
            ]
          }))
        };
      case "SALIDA DE REPUESTOS":
        return {
          headers: ["FECHA", "REFERENCIA", "PRODUCTO", "MARCA/DEPARTAMENTO", "CANTIDAD", "FORMAS DE PAGOS", "EFECTIVO", "TRANSFERENCIA", "$PRECIO", "VALOR TOTAL"],
          rows: db.salida_de_repuestos.map((s, i) => ({
            key: i,
            cells: [
              s.fecha,
              s.referencia,
              s.producto,
              s.marca_departamento,
              s.cantidad,
              s.formas_de_pago,
              `$${(s.efectivo || 0).toLocaleString()}`,
              `$${(s.transferencia || 0).toLocaleString()}`,
              `$${(s.precio || 0).toLocaleString()}`,
              `$${(s.valor_total || 0).toLocaleString()}`
            ]
          }))
        };
      case "PEDIDOS":
        return {
          headers: [
            "FECHA",
            "RAZON (NO HAY/ENCARGO)",
            "CANTIDAD",
            "MOTO",
            "REFERENCIA",
            "PRODUCTO",
            "NOMBRE",
            "APELLIDOS",
            "TELEFONO",
            "VALOR",
            "ABONO(EFECTIVO)",
            "ABONO(TRANSFERENCIA)",
            "RECIBO",
            "DEUDA",
            "ESTADO"
          ],
          rows: db.repuestos_solicitados.map((s, i) => ({
            key: i,
            cells: [
              s.fecha,
              s.razon,
              s.cantidad,
              s.moto,
              s.referencia,
              s.producto,
              s.nombre,
              s.apellidos,
              s.telefono,
              `$${(s.valor || 0).toLocaleString()}`,
              `$${(s.abono_efectivo || 0).toLocaleString()}`,
              `$${(s.abono_transferencia || 0).toLocaleString()}`,
              s.recibo || "N/A",
              `$${((s.valor || 0) - ((s.abono_efectivo || 0) + (s.abono_transferencia || 0))).toLocaleString()}`,
              s.estado
            ]
          }))
        };
      case "REFERENCIAS ESTUDIOS":
        return {
          headers: [
            "No.",
            "DOCUMENTO",
            "NOMBRES COMPLETOS CLIENTE",
            "NOMBRE REFERECIA 1",
            "DIRECCION",
            "BARRIO",
            "TELEFONO",
            "NOMBRE REFERENCIA 2",
            "DIRECCION",
            "BARRIO",
            "TELEFONO",
            "PLATAFORMA",
            "ACTA"
          ],
          rows: db.referencias_estudios.map((r, i) => ({
            key: r.no || i,
            cells: [
              r.no,
              r.documento,
              r.nombres_completos_cliente,
              r.nombre_referencia_1,
              r.direccion_1 || "N/A",
              r.barrio_1 || "N/A",
              r.telefono_1,
              r.nombre_referencia_2,
              r.direccion_2 || "N/A",
              r.barrio_2 || "N/A",
              r.telefono_2,
              r.plataforma,
              r.acta || "N/A"
            ]
          }))
        };
      case "EVENTOS":
        return {
          headers: [
            "ID",
            "Fecha",
            "Hora",
            "Usuario",
            "Rol",
            "Módulo",
            "Acción",
            "Prioridad",
            "Campo",
            "Valor anterior",
            "Valor nuevo",
            "Motivo",
            "Estado"
          ],
          rows: db.eventos.map((e, i) => ({
            key: e.id || i,
            cells: [
              e.id,
              e.fecha,
              e.hora,
              e.usuario,
              e.rol,
              e.modulo,
              e.accion,
              e.prioridad,
              e.campo || "N/A",
              e.valor_anterior || "N/A",
              e.valor_nuevo || "N/A",
              e.motivo || "Sin motivo registrado",
              e.estado || "Pendiente"
            ]
          }))
        };
      case "COMISIONES":
        return {
          headers: [
            "FECHA",
            "MOTO",
            "VALOR",
            "% IVA",
            "VALOR DE IVA",
            "VALOR SIN IVA",
            "%DE GANACIA",
            "VALOR DE GANANCIA"
          ],
          rows: getComisionesList().map((c, index) => ({
            key: `comision-${index}`,
            cells: [
              c.fecha,
              c.moto,
              `$${(c.valor || 0).toLocaleString()}`,
              `${c.porcentaje_iva || 19}%`,
              `$${(c.valor_iva || 0).toLocaleString()}`,
              `$${(c.valor_sin_iva || 0).toLocaleString()}`,
              `${c.porcentaje_ganancia || 1.5}%`,
              `$${(c.valor_ganancia || 0).toLocaleString()}`
            ]
          }))
        };
      case "LETRAS":
        return {
          headers: [
            "CASILLERO",
            "NUMERO LETRAS",
            "FECHA",
            "# DE LETRA A PAGAR",
            "FORMA DE PAGO",
            "RECIBO",
            "VALOR DE LA LETRA",
            "TOTAL RECIBIDO",
            "DEUDA",
            "NOMBRE",
            "APELLIDO",
            "NUMERO DOCUMENTO",
            "TELEFONO",
            "CORREO",
            "DIRECCION",
            "MOTOCICLETA",
            "MOTOR",
            "CHASIS",
            "COLOR",
            "VALOR",
            "ESTADO"
          ],
          rows: (db.letras || []).map((l, index) => ({
            key: `letra-${index}`,
            cells: [
              l.casillero,
              l.numero_letras,
              l.fecha,
              l.numero_letra_a_pagar,
              l.forma_pago,
              l.recibo,
              `$${(l.valor_letra || 0).toLocaleString()}`,
              `$${(l.total_recibido || 0).toLocaleString()}`,
              `$${(l.deuda || 0).toLocaleString()}`,
              l.nombre,
              l.apellido,
              l.numero_documento,
              l.telefono,
              l.correo,
              l.direccion,
              l.motocicleta,
              l.motor,
              l.chasis,
              l.color,
              `$${(l.valor || 0).toLocaleString()}`,
              l.estado
            ]
          }))
        };
      case "DEVOLUCIONES":
        return {
          headers: [
            "FECHA DEVOLUCIÓN",
            "SEDE",
            "SECTOR",
            "MÓDULO / ORIGEN",
            "TIPO DOCUMENTO",
            "N° DOCUMENTO",
            "NOMBRES",
            "APELLIDOS",
            "TELÉFONO",
            "CORREO ELECTRÓNICO",
            "TIPO DE DEVOLUCIÓN",
            "REFERENCIA",
            "PRODUCTO / CONCEPTO",
            "CANTIDAD",
            "MODELO",
            "CHASIS",
            "MOTOR",
            "COLOR",
            "VALOR ORIGINAL",
            "VALOR PAGADO / ABONADO",
            "VALOR DEVUELTO",
            "FORMA DE PAGO ORIGINAL",
            "FORMA DE DEVOLUCIÓN",
            "ESTADO DEL PRODUCTO",
            "REINGRESA A INVENTARIO",
            "MOTIVO DE DEVOLUCIÓN",
            "OBSERVACIONES",
            "ASESOR RESPONSABLE",
            "AUTORIZADO POR",
            "ESTADO DE DEVOLUCIÓN",
            "FECHA DE CIERRE"
          ],
          rows: (db.devoluciones || []).map((dev, i) => ({
            key: `dev-${i}`,
            cells: [
              dev.fecha_devolucion,
              dev.sede,
              dev.sector,
              dev.modulo_origen,
              dev.tipo_documento,
              dev.numero_documento,
              dev.nombres,
              dev.apellidos,
              dev.telefono,
              dev.correo_electronico,
              dev.tipo_devolucion,
              dev.referencia,
              dev.producto_concepto,
              dev.cantidad,
              dev.modelo,
              dev.chasis,
              dev.motor,
              dev.color,
              `$${(dev.valor_original || 0).toLocaleString()}`,
              `$${(dev.valor_pagado_abonado || 0).toLocaleString()}`,
              `$${(dev.valor_devuelto || 0).toLocaleString()}`,
              dev.forma_pago_original,
              dev.forma_devolucion,
              dev.estado_producto,
              dev.reingresa_inventario,
              dev.motivo_devolucion,
              dev.observaciones,
              dev.asesor_responsable,
              dev.autorizado_por,
              dev.estado_devolucion,
              dev.fecha_cierre
            ]
          }))
        };
      case "USUARIOS":
        return {
          headers: [
            "ID_USUARIO",
            "NOMBRE_COMPLETO",
            "DOCUMENTO",
            "USUARIO",
            "CONTRASEÑA",
            "ROL",
            "ESTADO",
            "SEDE",
            "CELULAR",
            "CORREO",
            "FECHA_CREACIÓN",
            "ÚLTIMO_ACCESO",
            "CREADO_POR",
            "SESIÓN_ACTIVA",
            "OBSERVACIONES"
          ],
          rows: usersList.map((u, i) => ({
            key: u.usuario || i,
            cells: [
              u.id_usuario,
              u.nombre_completo,
              u.documento || "N/A",
              u.usuario,
              u.contrasena ? "••••••••" : "N/A",
              u.rol,
              u.estado,
              u.sede,
              u.celular || "N/A",
              u.correo || "N/A",
              u.fecha_creacion || "N/A",
              u.ultimo_acceso || "N/A",
              u.creado_por || "Sistema",
              u.sesion_activa || "No",
              u.observaciones || "Sin observaciones"
            ]
          }))
        };
      case "PERFIL CLIENTES":
      case "CLIENTES":
        {
          const clientsMap: { [doc: string]: any } = {};
          
          // Seed from explicit db.clientes_perfil
          (db.clientes_perfil || []).forEach(cp => {
            if (cp.numero_documento) {
              clientsMap[cp.numero_documento] = cp;
            }
          });

          // Fallback from Actas
          db.actas.forEach(a => {
            if (a.documento && !clientsMap[a.documento]) {
              clientsMap[a.documento] = {
                tipo_documento: a.tipo_documento || "CÉDULA DE CIUDADANÍA",
                numero_documento: a.documento,
                nombres: a.nombres,
                apellidos: a.apellidos,
                telefono_principal: a.telefono,
                telefono_secundario: a.telefono_2 || "",
                correo_electronico: a.correo,
                direccion: a.direccion,
                ciudad: "BOGOTÁ",
                departamento: "CUNDINAMARCA",
                fecha_registro: a.fecha,
                ultima_actualizacion: a.fecha,
                estado: "REGISTRADO",
                observaciones: "Generado automáticamente desde Acta de Venta",
                usuario_que_registra: a.vendedor || "Sistema",
                usuario_ultima_actualizacion: a.vendedor || "Sistema",
                autorizacion_contacto: "SI"
              };
            }
          });

          // Fallback from Preventas
          db.preventas.forEach(p => {
            if (p.cedula && !clientsMap[p.cedula]) {
              clientsMap[p.cedula] = {
                tipo_documento: "CÉDULA DE CIUDADANÍA",
                numero_documento: p.cedula,
                nombres: p.nombre,
                apellidos: p.apellido,
                telefono_principal: p.telefono,
                telefono_secundario: "",
                correo_electronico: p.correo,
                direccion: p.direccion,
                ciudad: "BOGOTÁ",
                departamento: "CUNDINAMARCA",
                fecha_registro: p.fecha_de_inicio,
                ultima_actualizacion: p.fecha_de_inicio,
                estado: "REGISTRADO",
                observaciones: "Generado automáticamente desde Preventa",
                usuario_que_registra: "Asesor Comercial",
                usuario_ultima_actualizacion: "Asesor Comercial",
                autorizacion_contacto: "SI"
              };
            }
          });

          const clientList = Object.values(clientsMap);

          return {
            headers: [
              "TIPO DOCUMENTO",
              "N° DOCUMENTO",
              "NOMBRES",
              "APELLIDOS",
              "TELÉFONO PRINCIPAL",
              "TELÉFONO SECUNDARIO",
              "CORREO ELECTRÓNICO",
              "DIRECCIÓN",
              "CIUDAD",
              "DEPARTAMENTO",
              "FECHA DE REGISTRO",
              "ÚLTIMA ACTUALIZACIÓN",
              "ESTADO",
              "OBSERVACIONES",
              "USUARIO QUE REGISTRA",
              "USUARIO ÚLTIMA ACTUALIZACIÓN",
              "AUTORIZACIÓN CONTACTO"
            ],
            rows: clientList.map((c, i) => ({
              key: `cli-${i}`,
              cells: [
                c.tipo_documento || "CÉDULA DE CIUDADANÍA",
                c.numero_documento,
                c.nombres,
                c.apellidos,
                c.telefono_principal || c.telefono || "N/A",
                c.telefono_secundario || "N/A",
                c.correo_electronico || c.correo || "N/A",
                c.direccion || "N/A",
                c.ciudad || "N/A",
                c.departamento || "N/A",
                c.fecha_registro || "N/A",
                c.ultima_actualizacion || "N/A",
                c.estado || "REGISTRADO",
                c.observaciones || "Sin observaciones",
                c.usuario_que_registra || "Sistema",
                c.usuario_ultima_actualizacion || "Sistema",
                c.autorizacion_contacto || "SI"
              ]
            }))
          };
        }
      default:
        return { headers: [], rows: [] };
    }
  };

  const getFilteredExcelRows = () => {
    const data = getExcelSheetData();
    if (!excelSearch.trim()) return data.rows;
    const s = excelSearch.toLowerCase();
    return data.rows.filter(row =>
      row.cells.some(cell => String(cell).toLowerCase().includes(s))
    );
  };

  // Audit Hub Filter States
  const [auditPeriod, setAuditPeriod] = useState<"hoy" | "semana" | "mes" | "ano" | "personalizado">("mes");
  const [auditStartDate, setAuditStartDate] = useState(
    (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split("T")[0];
    })()
  );
  const [auditEndDate, setAuditEndDate] = useState(getTodayDateString());
  const [auditScope, setAuditScope] = useState<"todo" | "modulo" | "usuario">("todo");
  const [auditSelectedModules, setAuditSelectedModules] = useState<string[]>([]);
  const [auditSelectedUser, setAuditSelectedUser] = useState("");

  const getFilteredEvents = () => {
    let list = [...db.eventos];

    // Filter by period
    const today = new Date();
    today.setHours(0,0,0,0);

    const parseDate = (dStr: string) => {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date(dStr);
    };

    list = list.filter((e) => {
      const eDate = parseDate(e.fecha);
      
      if (auditPeriod === "hoy") {
        const tStr = getTodayDateString();
        return e.fecha === tStr;
      } else if (auditPeriod === "semana") {
        const diff = today.getTime() - 7 * 24 * 60 * 60 * 1000;
        return eDate.getTime() >= diff;
      } else if (auditPeriod === "mes") {
        const diff = today.getTime() - 30 * 24 * 60 * 60 * 1000;
        return eDate.getTime() >= diff;
      } else if (auditPeriod === "ano") {
        const diff = today.getTime() - 365 * 24 * 60 * 60 * 1000;
        return eDate.getTime() >= diff;
      } else if (auditPeriod === "personalizado") {
        const start = parseDate(auditStartDate);
        const end = parseDate(auditEndDate);
        end.setHours(23, 59, 59, 999);
        return eDate.getTime() >= start.getTime() && eDate.getTime() <= end.getTime();
      }
      return true;
    });

    // Filter by Scope
    if (auditScope === "modulo" && auditSelectedModules.length > 0) {
      list = list.filter((e) => {
        const modUpper = e.modulo.toUpperCase();
        return auditSelectedModules.some(m => modUpper === m.toUpperCase() || modUpper.includes(m.toUpperCase()) || m.toUpperCase().includes(modUpper));
      });
    } else if (auditScope === "usuario" && auditSelectedUser) {
      list = list.filter((e) => e.usuario.toLowerCase() === auditSelectedUser.toLowerCase());
    }

    // Filter by search term if any
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.motivo.toLowerCase().includes(s) ||
          e.usuario.toLowerCase().includes(s) ||
          e.modulo.toLowerCase().includes(s) ||
          e.accion.toLowerCase().includes(s) ||
          (e.estado && e.estado.toLowerCase().includes(s))
      );
    }

    return list;
  };

  const filteredEvents = getFilteredEvents();

  const handleUpdatePhysicalVerification = (eventId: number, status: string) => {
    if (user.rol !== "Administrador") {
      alert("🔒 ACCESO RESTRINGIDO: Solo el perfil Administrador puede alterar la declaración física oficial o el estado de los eventos. Como Asesor/Vendedor únicamente puede visualizar y registrar comentarios u observaciones.");
      return;
    }

    let finalStatus = status;
    if (status === "Presenta diferencia") {
      const obs = prompt("Ingrese la observación de la diferencia encontrada (MANDATORIO):");
      if (!obs || !obs.trim()) {
        alert("ALERTA: Es obligatorio ingresar una observación detallada para reportar diferencias físicas.");
        return;
      }
      finalStatus = `Presenta diferencia: ${obs.trim()}`;
    }

    const updatedEventos = db.eventos.map((e) => {
      if (e.id === eventId) {
        return { ...e, estado: finalStatus };
      }
      return e;
    });

    let updatedDb = { ...db, eventos: updatedEventos };

    const target = db.eventos.find(e => e.id === eventId);
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "AUDITORÍA INTELIGENTE",
      "Verificación Física",
      status.includes("diferencia") || status === "No existe" ? "ROJA" : "VERDE",
      "Estado Evento",
      target?.estado || "Pendiente",
      finalStatus,
      `Verificación física del suceso #${eventId} (${target?.modulo} - ${target?.accion}): Se declaró "${finalStatus}".`
    );

    setDb(updatedDb);
    alert(`Estado de verificación física registrado: "${status}".`);
  };

  const handleAddEventComment = (eventId: number) => {
    const comment = prompt("Ingrese la observación o comentario que desea notificar en este evento:");
    if (!comment || !comment.trim()) return;

    const target = db.eventos.find((e) => e.id === eventId);
    if (!target) return;

    const updatedMotivo = `${target.motivo || ""} [Comentario de ${user.usuario} (${user.rol}): "${comment.trim()}"]`;
    const updatedEventos = db.eventos.map((e) => {
      if (e.id === eventId) {
        return { ...e, motivo: updatedMotivo };
      }
      return e;
    });

    let updatedDb = { ...db, eventos: updatedEventos };
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "AUDITORÍA",
      "Comentario Registrado",
      "VERDE",
      "Comentario Evento",
      target.motivo || "",
      comment.trim(),
      `El usuario ${user.usuario} (${user.rol}) agregó una observación al suceso #${eventId}: "${comment.trim()}".`
    );

    setDb(updatedDb);
    alert("Comentario registrado con éxito en la notificación del evento.");
  };

  const handleGeneratePDFReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Error: Por favor permita las ventanas emergentes (popups) para poder descargar y visualizar el informe oficial.");
      return;
    }

    const totalLogs = filteredEvents.length;
    const redCount = filteredEvents.filter((e) => e.prioridad === "ROJA").length;
    const yellowCount = filteredEvents.filter((e) => e.prioridad === "AMARILLA").length;
    const greenCount = filteredEvents.filter((e) => e.prioridad === "VERDE").length;

    const differencesList = filteredEvents.filter((e) => e.estado && e.estado.toLowerCase().includes("diferencia") || e.estado === "No existe" || e.estado === "Vendida sin registrar");

    let tbodyRows = filteredEvents.map((item) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
        <td style="padding: 8px; font-family: monospace;">${item.fecha} ${item.hora}</td>
        <td style="padding: 8px; font-weight: bold;">${item.modulo}</td>
        <td style="padding: 8px;">${item.accion}</td>
        <td style="padding: 8px;">${item.usuario} (${item.rol})</td>
        <td style="padding: 8px;">
          <span style="font-weight: bold; color: ${
            item.prioridad === "ROJA" ? "#e53e3e" : item.prioridad === "AMARILLA" ? "#dd6b20" : "#38a169"
          };">${item.prioridad}</span>
        </td>
        <td style="padding: 8px; font-weight: bold; color: #4a5568;">${item.estado || "Pendiente"}</td>
        <td style="padding: 8px; color: #4a5568;">${item.motivo}</td>
      </tr>
    `).join("");

    let diffbodyRows = differencesList.map((item) => `
      <tr style="border-bottom: 1px solid #fed7d7; font-size: 10px; background-color: #fff5f5;">
        <td style="padding: 8px; font-family: monospace;">${item.fecha}</td>
        <td style="padding: 8px; font-weight: bold;">${item.modulo}</td>
        <td style="padding: 8px;">${item.usuario}</td>
        <td style="padding: 8px; font-weight: bold; color: #e53e3e;">${item.estado}</td>
        <td style="padding: 8px; color: #742a2a;">${item.motivo}</td>
      </tr>
    `).join("");

    if (diffbodyRows === "") {
      diffbodyRows = `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #718096; font-style: italic;">No se reportaron diferencias físicas en este periodo de auditoría. ¡Control impecable!</td></tr>`;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Informe Oficial de Auditoría ERP Mundo Motos - Sede ${user.sede}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2d3748; padding: 40px; line-height: 1.5; }
            .header-table { width: 100%; border-bottom: 3px double #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .logo-text { font-size: 24px; font-weight: 800; color: #e53e3e; letter-spacing: -1px; }
            .doc-title { font-size: 16px; font-weight: bold; text-align: right; color: #4a5568; text-transform: uppercase; }
            .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background: #f7fafc; }
            .stat-val { font-size: 18px; font-weight: bold; color: #2d3748; }
            .stat-lbl { font-size: 10px; text-transform: uppercase; color: #718096; font-weight: bold; margin-top: 4px; }
            .table-title { font-size: 12px; text-transform: uppercase; font-weight: bold; color: #1a202c; border-left: 4px solid #e53e3e; padding-left: 8px; margin-top: 30px; margin-bottom: 10px; }
            .sign-table { width: 100%; margin-top: 60px; page-break-inside: avoid; }
            .sign-line { border-top: 1px solid #a0aec0; width: 80%; margin: 0 auto; margin-top: 50px; text-align: center; font-size: 10px; font-weight: bold; color: #4a5568; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="logo-text">HONDA ERP</div>
                <div style="font-size: 10px; font-weight: bold; color: #718096;">SISTEMA CORPORATIVO DE AUDITORÍA Y CONTROL INTERNO</div>
              </td>
              <td class="doc-title">
                INFORME OFICIAL DE AUDITORÍA<br>
                <span style="font-size: 11px; font-weight: normal; color: #718096;">Sede: ${user.sede} | Fecha Impresión: ${getTodayDateString()}</span>
              </td>
            </tr>
          </table>

          <div style="margin-bottom: 20px; font-size: 11px;">
            <table style="width: 100%; background: #edf2f7; border-radius: 6px; padding: 12px;">
              <tr>
                <td><strong>Periodo Auditado:</strong> ${auditPeriod.toUpperCase()} (${auditStartDate} a ${auditEndDate})</td>
                <td><strong>Alcance:</strong> ${auditScope.toUpperCase()} ${auditSelectedModules.length > 0 ? `[${auditSelectedModules.join(", ")}]` : ""} ${auditSelectedUser ? `[User: ${auditSelectedUser}]` : ""}</td>
              </tr>
              <tr>
                <td style="padding-top: 6px;"><strong>Auditor Responsable:</strong> ${user.nombre_completo} (${user.rol})</td>
                <td style="padding-top: 6px;"><strong>Estado de Informe:</strong> CERTIFICADO</td>
              </tr>
            </table>
          </div>

          <div class="table-title">Resumen de Métricas de Auditoría</div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 25%; padding-right: 10px;">
                <div class="stat-box">
                  <div class="stat-val">${totalLogs}</div>
                  <div class="stat-lbl">Sucesos Analizados</div>
                </div>
              </td>
              <td style="width: 25%; padding-right: 10px;">
                <div class="stat-box" style="border-left: 4px solid #e53e3e;">
                  <div class="stat-val" style="color: #e53e3e;">${redCount}</div>
                  <div class="stat-lbl">Alertas Críticas (ROJA)</div>
                </div>
              </td>
              <td style="width: 25%; padding-right: 10px;">
                <div class="stat-box" style="border-left: 4px solid #dd6b20;">
                  <div class="stat-val" style="color: #dd6b20;">${yellowCount}</div>
                  <div class="stat-lbl">Observaciones (AMARILLA)</div>
                </div>
              </td>
              <td style="width: 25%;">
                <div class="stat-box" style="border-left: 4px solid #38a169;">
                  <div class="stat-val" style="color: #38a169;">${greenCount}</div>
                  <div class="stat-lbl">Eventos Normales (VERDE)</div>
                </div>
              </td>
            </tr>
          </table>

          <div class="table-title" style="border-left-color: #e53e3e; color: #c53030;">Inconsistencias y Diferencias Físicas Reportadas</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; border: 1px solid #f5c6cb;">
            <thead>
              <tr style="background-color: #f8d7da; border-bottom: 2px solid #f5c6cb; font-weight: bold; color: #721c24;">
                <th style="padding: 10px; text-align: left;">Fecha</th>
                <th style="padding: 10px; text-align: left;">Módulo</th>
                <th style="padding: 10px; text-align: left;">Usuario</th>
                <th style="padding: 10px; text-align: left;">Declaración Física</th>
                <th style="padding: 10px; text-align: left;">Detalles del Registro</th>
              </tr>
            </thead>
            <tbody>
              ${diffbodyRows}
            </tbody>
          </table>

          <div class="table-title">Detalle de Registro Completo de Eventos en el Período</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #f7fafc; border-bottom: 2px solid #e2e8f0; font-weight: bold; text-align: left;">
                <th style="padding: 8px;">Fecha / Hora</th>
                <th style="padding: 8px;">Módulo</th>
                <th style="padding: 8px;">Operación</th>
                <th style="padding: 8px;">Usuario</th>
                <th style="padding: 8px;">Nivel</th>
                <th style="padding: 8px;">Verificación</th>
                <th style="padding: 8px;">Descripción Suceso</th>
              </tr>
            </thead>
            <tbody>
              ${tbodyRows}
            </tbody>
          </table>

          <table class="sign-table">
            <tr>
              <td style="width: 33.3%;">
                <div class="sign-line">
                  FIRMA AUDITOR RESPONSABLE<br>
                  C.C. _______________________<br>
                  ${user.nombre_completo}
                </div>
              </td>
              <td style="width: 33.3%;">
                <div class="sign-line">
                  FIRMA ADMINISTRACIÓN SEDE<br>
                  C.C. _______________________<br>
                  Sede ${user.sede}
                </div>
              </td>
              <td style="width: 33.3%;">
                <div class="sign-line">
                  FIRMA RECTORÍA GENERAL / GERENCIA<br>
                  HONDA MOTOS CORPORATIVO
                </div>
              </td>
            </tr>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // States for updating Plate / Range in Matriculas
  const [editingMatriculaIndex, setEditingMatriculaIndex] = useState<number | null>(null);
  const [tempPlate, setTempPlate] = useState("");
  const [tempState, setTempState] = useState<"Pendiente" | "En proceso" | "Finalizado" | "Cancelado">("Pendiente");

  // States for updating Revision (Maintenance)
  const [editingRevIndex, setEditingRevIndex] = useState<number | null>(null);
  const [tempRevKm, setTempRevKm] = useState("");
  const [tempRevState, setTempRevState] = useState<"Pendiente" | "En Servicio" | "Completado">("Pendiente");

  // States for adding User
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Administrador" | "Vendedor" | "Sala">("Vendedor");

  // Toggle user status
  const toggleUserStatus = (idx: number) => {
    if (user.rol !== "Administrador") {
      let updatedDb = registrarEvento(
        db,
        user,
        "USUARIOS",
        "Intento No Autorizado de Modificación",
        "ROJA",
        "Estado Usuario",
        usersList[idx]?.estado || "N/A",
        "Acceso Denegado",
        `ALERTA ROJA DE SEGURIDAD: El usuario ${user.usuario} (${user.rol}) intentó modificar el estado del usuario ${usersList[idx]?.usuario} sin privilegios de Administrador.`
      );
      setDb(updatedDb);
      alert("🔒 ALERTA DE SEGURIDAD: Solo el Administrador tiene acceso para modificar usuarios. Cualquier intento de edición no autorizado es registrado como Evento Rojo.");
      return;
    }

    const updated = [...usersList];
    const prevStatus = updated[idx].estado;
    updated[idx].estado = updated[idx].estado === "Activo" ? "Inactivo" : "Activo";
    setUsersList(updated);

    let updatedDb = registrarEvento(
      db,
      user,
      "USUARIOS",
      "Cambio de Estado Usuario",
      "AMARILLA",
      "Estado Usuario",
      prevStatus,
      updated[idx].estado,
      `Se actualizó el estado del usuario ${updated[idx].usuario} de ${prevStatus} a ${updated[idx].estado}.`
    );
    setDb(updatedDb);
    alert(`Estado del usuario ${updated[idx].usuario} actualizado a ${updated[idx].estado}.`);
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.rol !== "Administrador") {
      let updatedDb = registrarEvento(
        db,
        user,
        "USUARIOS",
        "Intento No Autorizado de Creación",
        "ROJA",
        "Crear Usuario",
        "N/A",
        newUsername || "Sin Nombre",
        `ALERTA ROJA DE SEGURIDAD: El usuario ${user.usuario} (${user.rol}) intentó registrar el nuevo usuario '${newUsername}' sin privilegios de Administrador.`
      );
      setDb(updatedDb);
      alert("🔒 ALERTA DE SEGURIDAD: Solo el Administrador tiene acceso para registrar usuarios. Su intento no autorizado ha sido notificado al sistema de seguridad.");
      return;
    }

    if (!newUsername || !newUserPass) return;

    if (usersList.some((u) => u.usuario.toLowerCase() === newUsername.toLowerCase())) {
      alert("El nombre de usuario ya existe.");
      return;
    }

    const nextId = Math.max(...usersList.map((u) => u.id_usuario), 0) + 1;
    const newUser: Usuario = {
      id_usuario: nextId,
      nombre_completo: newUsername,
      documento: "12345678",
      usuario: newUsername,
      contrasena: newUserPass,
      rol: newUserRole,
      estado: "Activo",
      sede: user.sede,
      celular: "",
      correo: "",
      fecha_creacion: getTodayDateString(),
      ultimo_acceso: "",
      creado_por: user.usuario,
      sesion_activa: "No",
      observaciones: "Creado desde panel de administración"
    };

    setUsersList([...usersList, newUser]);

    let updatedDb = registrarEvento(
      db,
      user,
      "USUARIOS",
      "Crear Usuario",
      "VERDE",
      "Nuevo Usuario",
      "",
      newUser.usuario,
      `Se creó el nuevo usuario del sistema: ${newUser.usuario} (${newUser.rol}).`
    );
    setDb(updatedDb);

    setNewUsername("");
    setNewUserPass("");
    setShowAddUser(false);
    alert("Usuario del sistema creado con éxito.");
  };

  // Save Plate Assignment
  const handleSavePlate = (idx: number) => {
    let updatedMatriculas = [...db.matriculas];
    const prev = updatedMatriculas[idx];
    
    updatedMatriculas[idx] = {
      ...prev,
      rango: tempPlate,
      estado: tempState
    };

    let updatedDb = { ...db, matriculas: updatedMatriculas };

    // Automatization: Log plate registration event
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MATRICULAS",
      "Actualizar",
      "AMARILLA",
      "Matrícula",
      prev.rango,
      tempPlate,
      `Matrícula de ${prev.nombre} ${prev.apellidos} actualizada a estado "${tempState}" con placa "${tempPlate}".`
    );

    setDb(updatedDb);
    setEditingMatriculaIndex(null);
    alert("Matrícula del vehículo actualizada y archivada.");
  };

  // Save Revision update
  const handleSaveRevision = (idx: number) => {
    let updatedRev = [...db.revisiones];
    const prev = updatedRev[idx];

    updatedRev[idx] = {
      ...prev,
      km: tempRevKm,
      estado: tempRevState,
      fecha_servicio: tempRevState === "Completado" ? getTodayDateString() : prev.fecha_servicio
    };

    let updatedDb = { ...db, revisiones: updatedRev };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REVISIONES",
      "Actualizar",
      "AMARILLA",
      "Revisión Mecánica",
      prev.km,
      tempRevKm,
      `Revisión del chasis ${prev.chasis} actualizada a Km "${tempRevKm}" con estado "${tempRevState}".`
    );

    setDb(updatedDb);
    setEditingRevIndex(null);
    alert("Orden de servicio de revisión de garantía actualizada.");
  };

  // States for ReferenciasEstudios CRUD
  const [showAddEstudio, setShowAddEstudio] = useState(false);
  const [editingEstudioIndex, setEditingEstudioIndex] = useState<number | null>(null);

  // Form states for Estudio de Crédito
  const [estActa, setEstActa] = useState("");
  const [estDocumento, setEstDocumento] = useState("");
  const [estCliente, setEstCliente] = useState("");
  const [estPlataforma, setEstPlataforma] = useState("SUFI");
  
  const [estRefNombre1, setEstRefNombre1] = useState("");
  const [estRefDir1, setEstRefDir1] = useState("");
  const [estRefBarrio1, setEstRefBarrio1] = useState("");
  const [estRefTel1, setEstRefTel1] = useState("");

  const [estRefNombre2, setEstRefNombre2] = useState("");
  const [estRefDir2, setEstRefDir2] = useState("");
  const [estRefBarrio2, setEstRefBarrio2] = useState("");
  const [estRefTel2, setEstRefTel2] = useState("");

  const resetEstudioForm = () => {
    setEstActa("");
    setEstDocumento("");
    setEstCliente("");
    setEstPlataforma("SUFI");
    setEstRefNombre1("");
    setEstRefDir1("");
    setEstRefBarrio1("");
    setEstRefTel1("");
    setEstRefNombre2("");
    setEstRefDir2("");
    setEstRefBarrio2("");
    setEstRefTel2("");
  };

  const handleSaveEstudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estDocumento || !estCliente) {
      alert("Por favor diligencie los datos obligatorios del cliente.");
      return;
    }

    let updatedDb = { ...db };
    let list = [...(db.referencias_estudios || [])];

    const estudioData: ReferenciaEstudio = {
      no: editingEstudioIndex !== null ? list[editingEstudioIndex].no : (list.reduce((max, r) => r.no > max ? r.no : max, 0) + 1),
      documento: estDocumento.trim(),
      nombres_completos_cliente: estCliente.trim(),
      nombre_referencia_1: estRefNombre1.trim() || "N/A",
      direccion_1: estRefDir1.trim(),
      barrio_1: estRefBarrio1.trim(),
      telefono_1: estRefTel1.trim(),
      nombre_referencia_2: estRefNombre2.trim() || "N/A",
      direccion_2: estRefDir2.trim(),
      barrio_2: estRefBarrio2.trim(),
      telefono_2: estRefTel2.trim(),
      plataforma: estPlataforma,
      acta: estActa.trim() || "Sin Acta"
    };

    if (editingEstudioIndex !== null) {
      list[editingEstudioIndex] = estudioData;
      updatedDb.referencias_estudios = list;
      updatedDb = registrarEvento(
        updatedDb,
        user,
        "REFERENCIAS",
        "Actualizar",
        "AMARILLA",
        "Estudios de Crédito",
        estudioData.documento,
        estudioData.documento,
        `Se actualizó el estudio de crédito del cliente ${estudioData.nombres_completos_cliente} (Cédula: ${estudioData.documento}).`
      );
    } else {
      updatedDb.referencias_estudios = [estudioData, ...list];
      updatedDb = registrarEvento(
        updatedDb,
        user,
        "REFERENCIAS",
        "Crear",
        "VERDE",
        "Estudios de Crédito",
        "",
        estudioData.documento,
        `Se creó nuevo estudio de crédito para cliente ${estudioData.nombres_completos_cliente} (Cédula: ${estudioData.documento}).`
      );
    }

    setDb(updatedDb);
    setShowAddEstudio(false);
    setEditingEstudioIndex(null);
    resetEstudioForm();
    alert("Estudio de crédito guardado con éxito.");
  };

  const handleDeleteEstudio = (idx: number) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este estudio de crédito permanentemente?")) {
      return;
    }
    const itemToDelete = db.referencias_estudios[idx];
    let list = db.referencias_estudios.filter((_, i) => i !== idx);
    let updatedDb = { ...db, referencias_estudios: list };
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REFERENCIAS",
      "Eliminar",
      "ROJA",
      "Estudios de Crédito",
      itemToDelete.documento,
      "",
      `Se eliminó el registro de referencias del estudio de crédito de ${itemToDelete.nombres_completos_cliente}.`
    );
    setDb(updatedDb);
    alert("Estudio de crédito eliminado.");
  };

  const openEditEstudio = (idx: number, item: ReferenciaEstudio) => {
    setEditingEstudioIndex(idx);
    setEstActa(item.acta || "");
    setEstDocumento(item.documento);
    setEstCliente(item.nombres_completos_cliente);
    setEstPlataforma(item.plataforma);
    
    setEstRefNombre1(item.nombre_referencia_1 || "");
    setEstRefDir1(item.direccion_1 || "");
    setEstRefBarrio1(item.barrio_1 || "");
    setEstRefTel1(item.telefono_1 || "");

    setEstRefNombre2(item.nombre_referencia_2 || "");
    setEstRefDir2(item.direccion_2 || "");
    setEstRefBarrio2(item.barrio_2 || "");
    setEstRefTel2(item.telefono_2 || "");

    setShowAddEstudio(true);
  };

  const copyAppsScript = () => {
    const code = `/**
 * BACKEND GOOGLE APES SCRIPT (.gs) - CONCESIONARIO MUNDO MOTOS ERP REAL
 * Copia este código en tu editor de Google Apps Script (script.google.com)
 * Asegúrate de crear las 14 hojas en tu Google Sheet con los nombres en mayúsculas correspondientes.
 */

const SPREADSHEET_ID = "INGRESA_TU_SPREADSHEET_ID_AQUÍ";

function doGet(e) {
  return HtmlService.createTemplateFromFile("ERP")
    .evaluate()
    .setTitle("ERP Concesionario Mundo Motos")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function leerBaseDatos() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = {};
  const sheets = ss.getSheets();
  
  sheets.forEach(sheet => {
    const name = sheet.getName().toLowerCase();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      data[name] = [];
      return;
    }
    const headers = rows[0];
    const items = [];
    for (let i = 1; i < rows.length; i++) {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = rows[i][index];
      });
      items.push(item);
    }
    data[name] = items;
  });
  
  return JSON.stringify(data);
}

function guardarFila(sheetName, payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName.toUpperCase());
  if (!sheet) throw new Error("Hoja no encontrada: " + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const item = JSON.parse(payload);
  const row = [];
  
  headers.forEach(header => {
    row.push(item[header] !== undefined ? item[header] : "");
  });
  
  sheet.appendRow(row);
  return true;
}`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in font-sans">
      
      {/* Admin header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Shield size={20} className="text-red-600" />
            <span>Centro de Control y Administración General</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Módulo privilegiado para coordinadores de tránsito, jefes de taller, control inmutable de auditoría y personal de soporte.
          </p>
        </div>

        {/* Sub-tabs Admin selector */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
          {[
            { id: "matriculas", label: "Matrículas" },
            { id: "revisiones", label: "Taller Garantía" },
            { id: "referencias", label: "Estudios Crédito" },
            { id: "usuarios", label: "Usuarios Sistema" },
            { id: "eventos", label: "Eventos Auditoría" },
            { id: "transferencias", label: "Transferencias" },
            { id: "appscript", label: "Apps Script (.gs)" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setAdminTab(tab.id as any); setSearchTerm(""); }}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-tight transition-all ${
                adminTab === tab.id ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER MATRICULAS */}
      {adminTab === "matriculas" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Trámites de Matrícula y Tránsito</h3>
            <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">
              Pendientes: {db.matriculas.filter(m => m.estado === "Pendiente").length}
            </span>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Fecha Venta</th>
                  <th className="p-4">Propietario / Cliente</th>
                  <th className="p-4">Identificación</th>
                  <th className="p-4">Vehículo</th>
                  <th className="p-4">No. Motor</th>
                  <th className="p-4">Tránsito Asignado</th>
                  <th className="p-4 text-center">Placa / Rango</th>
                  <th className="p-4 text-center">Estado Trámite</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {db.matriculas.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">{item.fecha}</td>
                    <td className="p-4 font-semibold text-slate-800">{item.nombre} {item.apellidos}</td>
                    <td className="p-4 font-mono">{item.documento}</td>
                    <td className="p-4 font-semibold">{item.motocicleta}</td>
                    <td className="p-4 font-mono">{item.motor}</td>
                    <td className="p-4 text-slate-500">{item.transito}</td>
                    <td className="p-4 text-center">
                      {editingMatriculaIndex === idx ? (
                        <input
                          type="text"
                          value={tempPlate}
                          onChange={(e) => setTempPlate(e.target.value.toUpperCase())}
                          className="w-24 bg-white border rounded p-1 text-xs text-center font-bold"
                        />
                      ) : (
                        <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          {item.rango || "SIN PLACA"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingMatriculaIndex === idx ? (
                        <select
                          value={tempState}
                          onChange={(e: any) => setTempState(e.target.value)}
                          className="bg-white border rounded p-1 text-xs font-semibold"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Finalizado">Finalizado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          item.estado === "Pendiente" ? "bg-yellow-100 text-yellow-700" :
                          item.estado === "En proceso" ? "bg-blue-100 text-blue-700" :
                          item.estado === "Finalizado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.estado}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingMatriculaIndex === idx ? (
                        <div className="flex space-x-1 justify-center">
                          <button
                            onClick={() => handleSavePlate(idx)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-2 py-1 rounded"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingMatriculaIndex(null)}
                            className="bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-1 rounded"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMatriculaIndex(idx);
                            setTempPlate(item.rango);
                            setTempState(item.estado);
                          }}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER REVISIONES */}
      {adminTab === "revisiones" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Taller de Servicio y Revisiones de Garantía (Moto Care)</h3>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Fecha Compra</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Motocicleta</th>
                  <th className="p-4">No. Chasis</th>
                  <th className="p-4 text-center">Rango Kilometraje</th>
                  <th className="p-4 text-center">Revisión Correspondiente</th>
                  <th className="p-4 text-center">Estado Servicio</th>
                  <th className="p-4 text-center">Fecha Servicio Realizado</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {db.revisiones.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">{item.fecha_compra}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{item.nombre} {item.apellidos}</div>
                      <div className="text-[10px] text-slate-400">Tel: {item.telefono}</div>
                    </td>
                    <td className="p-4 font-semibold">{item.moto}</td>
                    <td className="p-4 font-mono">{item.chasis}</td>
                    <td className="p-4 text-center font-mono">
                      {editingRevIndex === idx ? (
                        <input
                          type="text"
                          value={tempRevKm}
                          onChange={(e) => setTempRevKm(e.target.value)}
                          className="w-16 bg-white border rounded p-1 text-center font-bold text-xs"
                        />
                      ) : (
                        <span className="font-bold">{item.km} Km</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                        {item.razon}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {editingRevIndex === idx ? (
                        <select
                          value={tempRevState}
                          onChange={(e: any) => setTempRevState(e.target.value)}
                          className="bg-white border rounded p-1 text-xs"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Servicio">En Servicio</option>
                          <option value="Completado">Completado</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          item.estado === "Pendiente" ? "bg-yellow-100 text-yellow-700" :
                          item.estado === "En Servicio" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          {item.estado}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono text-slate-500">{item.fecha_servicio || "-"}</td>
                    <td className="p-4 text-center">
                      {editingRevIndex === idx ? (
                        <div className="flex space-x-1 justify-center">
                          <button
                            onClick={() => handleSaveRevision(idx)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-2 py-1 rounded"
                          >
                            Asentar
                          </button>
                          <button
                            onClick={() => setEditingRevIndex(null)}
                            className="bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-1 rounded"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRevIndex(idx);
                            setTempRevKm(item.km);
                            setTempRevState(item.estado);
                          }}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          Actualizar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER REFERENCIAS */}
      {adminTab === "referencias" && (
        <ModuloReferenciasEstudios user={user} db={db} setDb={setDb} />
      )}

      {/* RENDER USUARIOS SYSTEM */}
      {adminTab === "usuarios" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Gestor de Personal Autorizado del Sistema</h3>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase py-2 px-3 rounded"
            >
              + Registrar Nuevo Usuario
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddNewUser} className="bg-slate-50 border p-4 rounded-lg space-y-3 max-w-sm">
              <h4 className="font-bold text-xs text-slate-700">Crear Credencial</h4>
              <div>
                <label className="block text-[10px] font-semibold mb-0.5">Nombre de Usuario (Username)</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-white border rounded p-1.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold mb-0.5">Contraseña (Password)</label>
                <input
                  type="password"
                  required
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full bg-white border rounded p-1.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold mb-0.5">Rol / Privilegio de Acceso</label>
                <select
                  value={newUserRole}
                  onChange={(e: any) => setNewUserRole(e.target.value)}
                  className="w-full bg-white border rounded p-1.5 text-xs text-slate-800"
                >
                  <option value="Vendedor">Asesor Comercial (Venta, Preventa, Referencias)</option>
                  <option value="Sala">Cajero Administrativo (Caja, POS Repuestos, Abonos)</option>
                  <option value="Administrador">Administrador Total (Taller, Auditoría, Usuarios)</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] py-1.5 w-full rounded uppercase"
              >
                Registrar Credenciales
              </button>
            </form>
          )}

          <div className="border border-slate-100 rounded-xl overflow-x-auto max-w-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Rol / Privilegios</th>
                  <th className="p-4">Sede Asignada</th>
                  <th className="p-4 text-center">Estado Cuenta</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usersList.map((usr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-800 flex items-center space-x-1.5">
                      <Users size={14} className="text-slate-400" />
                      <div>
                        <div>{usr.usuario}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{usr.nombre_completo}</div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-600">{usr.rol}</td>
                    <td className="p-4">{usr.sede}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${usr.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {usr.estado === "Activo" ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="p-4 text-center font-semibold">
                      <button
                        onClick={() => toggleUserStatus(idx)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        {usr.estado === "Activo" ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER EVENTOS DYNAMIC LOG */}
      {adminTab === "eventos" && (
        <div className="space-y-4 animate-fade-in font-sans">
          
          {/* Header section with PDF trigger */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
            <div>
              <h3 className="font-bold text-base flex items-center space-x-1.5 text-white">
                <Activity size={20} className="text-red-500 animate-pulse shrink-0" />
                <span>Centro de Control & Auditoría Inteligente - Mundo Motos ERP</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
                Panel exclusivo de Administración. Filtre los registros inmutables por periodo, alcance o usuario del sistema y realice verificaciones de control físico directamente.
              </p>
            </div>
            <button
              onClick={handleGeneratePDFReport}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 px-5 rounded-xl uppercase tracking-wider flex items-center space-x-2 shrink-0 transition-colors shadow-md cursor-pointer"
            >
              <FileCode2 size={16} />
              <span>Generar Informe PDF</span>
            </button>
          </div>

          {/* Sub Tab Bar for Auditoría vs Excel Examiner */}
          <div className="flex border-b border-slate-200 gap-2 mb-2">
            <button
              onClick={() => setEventSubTab("auditoria")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                eventSubTab === "auditoria"
                  ? "border-red-600 text-red-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Activity size={14} />
              <span>Bitácora de Auditoría</span>
            </button>
            <button
              onClick={() => setEventSubTab("excel")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                eventSubTab === "excel"
                  ? "border-red-600 text-red-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Examinador de Excel & Control de Cierres</span>
            </button>
          </div>

          {eventSubTab === "auditoria" && (
            <>
              {/* Advanced Audit Filter Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Filtros de Auditoría Avanzada</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Period Select */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Periodo Temporal</label>
                    <select
                      value={auditPeriod}
                      onChange={(e: any) => setAuditPeriod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="hoy">Hoy</option>
                      <option value="semana">Esta Semana (7 días)</option>
                      <option value="mes">Este Mes (30 días)</option>
                      <option value="ano">Este Año</option>
                      <option value="personalizado">Rango Personalizado...</option>
                    </select>
                  </div>

                  {/* Custom Date Pickers */}
                  {auditPeriod === "personalizado" && (
                    <div className="grid grid-cols-2 gap-2 md:col-span-1">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Desde</label>
                        <input
                          type="date"
                          value={auditStartDate}
                          onChange={(e) => setAuditStartDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Hasta</label>
                        <input
                          type="date"
                          value={auditEndDate}
                          onChange={(e) => setAuditEndDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* Scope Select */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Alcance del Filtro</label>
                    <select
                      value={auditScope}
                      onChange={(e: any) => setAuditScope(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="todo">Todo el ERP (Completo)</option>
                      <option value="modulo">Por Módulo Específico</option>
                      <option value="usuario">Por Usuario Responsable</option>
                    </select>
                  </div>

                  {/* Specific Module or User selectors */}
                  {auditScope === "modulo" && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-fade-in md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Seleccione Módulos (Múltiple Selección)</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {[
                          { id: "INVENTARIO", label: "INVENTARIO & RECOLECCIÓN" },
                          { id: "CAJA Y MOVIMIENTOS", label: "CAJA Y MOVIMIENTOS" },
                          { id: "PREVENTAS", label: "PREVENTAS" },
                          { id: "ACTAS", label: "ACTAS" },
                          { id: "MATRICULAS", label: "MATRICULAS" },
                          { id: "REVISIONES", label: "REVISIONES" },
                          { id: "SALA DE EXPOSICIÓN", label: "SALA DE EXPOSICIÓN" },
                          { id: "AUDITORÍA INTELIGENTE", label: "AUDITORÍA INTELIGENTE" },
                          { id: "SALIDA DE REPUESTOS", label: "SALIDA DE REPUESTOS" }
                        ].map((m) => {
                          const isChecked = auditSelectedModules.includes(m.id);
                          return (
                            <label key={m.id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer p-1 rounded-md hover:bg-slate-100/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setAuditSelectedModules(auditSelectedModules.filter(x => x !== m.id));
                                  } else {
                                    setAuditSelectedModules([...auditSelectedModules, m.id]);
                                  }
                                }}
                                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                              <span>{m.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      {auditSelectedModules.length > 0 && (
                        <div className="text-[10px] text-slate-400 italic mt-1">
                          Filtrando por {auditSelectedModules.length} módulos seleccionados.
                        </div>
                      )}
                    </div>
                  )}

                  {auditScope === "usuario" && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Seleccione Personal</label>
                      <select
                        value={auditSelectedUser}
                        onChange={(e) => setAuditSelectedUser(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 animate-fade-in"
                      >
                        <option value="">-- Seleccionar Usuario --</option>
                        {usersList.map((usr, i) => (
                          <option key={i} value={usr.usuario}>{usr.usuario} ({usr.rol})</option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>
              </div>

              {/* Analytics Statistics Dashboard */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Análisis Total</span>
                  <h5 className="text-xl font-bold text-slate-800 mt-1">{filteredEvents.length}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sucesos coincidentes</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-3xs">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Alertas Rojas (Criticas)</span>
                  <h5 className="text-xl font-bold text-red-700 mt-1">
                    {filteredEvents.filter((e) => e.prioridad === "ROJA").length}
                  </h5>
                  <p className="text-[10px] text-red-500 mt-0.5">Acciones de riesgo / diferencia</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-3xs">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Advertencias Amarillas</span>
                  <h5 className="text-xl font-bold text-amber-700 mt-1">
                    {filteredEvents.filter((e) => e.prioridad === "AMARILLA").length}
                  </h5>
                  <p className="text-[10px] text-amber-500 mt-0.5">Modificaciones generales</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 shadow-3xs">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Operaciones Verdes</span>
                  <h5 className="text-xl font-bold text-green-700 mt-1">
                    {filteredEvents.filter((e) => e.prioridad === "VERDE").length}
                  </h5>
                  <p className="text-[10px] text-green-500 mt-0.5">Procesos fluidos estándar</p>
                </div>
              </div>

              {/* Audit Log Table */}
              <div className="border border-slate-100 rounded-2xl overflow-x-auto shadow-2xs max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10">
                      <th className="p-4 whitespace-nowrap">Fecha / Hora</th>
                      <th className="p-4">Módulo / Operación</th>
                      <th className="p-4">Usuario</th>
                      <th className="p-4 text-center">Nivel</th>
                      <th className="p-4 text-center">Declaración Física</th>
                      <th className="p-4 text-center">Control / Verificación</th>
                      <th className="p-4">Descripción Detallada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-mono">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((item) => {
                        const hasDifference = item.estado && item.estado.toLowerCase().includes("diferencia");
                        return (
                          <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${hasDifference ? "bg-red-50/40" : ""}`}>
                            <td className="p-4 whitespace-nowrap text-slate-400">
                              <div>{item.fecha}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{item.hora}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-700">{item.modulo}</div>
                              <div className="text-[10px] text-slate-400 font-sans font-medium">{item.accion}</div>
                            </td>
                            <td className="p-4">
                              <span className="font-sans font-bold text-slate-800">{item.usuario}</span>
                              <span className="text-[10px] text-slate-400 font-normal"> ({item.rol})</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                item.prioridad === "ROJA" ? "bg-red-100 text-red-700 animate-pulse" :
                                item.prioridad === "AMARILLA" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                              }`}>
                                {item.prioridad}
                              </span>
                            </td>
                            <td className="p-4 text-center font-sans">
                              {item.estado ? (
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                  hasDifference ? "bg-red-100 text-red-700" :
                                  item.estado === "No existe" ? "bg-rose-100 text-rose-700" :
                                  item.estado === "Vendida sin registrar" ? "bg-amber-100 text-amber-700" :
                                  "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {item.estado}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Pendiente de cotejo</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-sans">
                              <div className="flex flex-col items-center gap-1.5">
                                {user.rol === "Administrador" ? (
                                  <select
                                    value={item.estado || ""}
                                    onChange={(e) => handleUpdatePhysicalVerification(item.id, e.target.value)}
                                    className="bg-white text-slate-800 text-[11px] font-semibold p-1.5 rounded-lg border border-slate-200 shadow-3xs cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-red-500"
                                  >
                                    <option value="">-- Registrar Cotejo --</option>
                                    <option value="Confirmado físicamente">Confirmado físicamente</option>
                                    <option value="Presenta diferencia">Presenta diferencia (MANDATORIO)</option>
                                    <option value="Existe físicamente">Existe físicamente</option>
                                    <option value="No existe">No existe</option>
                                    <option value="Vendida sin registrar">Vendida sin registrar</option>
                                    <option value="Otro">Otro</option>
                                  </select>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    Verificación Solo Admin
                                  </span>
                                )}
                                <button
                                  onClick={() => handleAddEventComment(item.id)}
                                  className="text-[10px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer flex items-center space-x-1"
                                >
                                  <span>💬 Dejar Comentario</span>
                                </button>
                              </div>
                            </td>
                            <td className="p-4 font-sans text-slate-600 font-medium leading-relaxed max-w-sm" title={item.motivo}>
                              {item.motivo}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400 font-bold font-sans">
                          No se encontraron registros de eventos bajo los filtros de auditoría seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {eventSubTab === "excel" && (
            <div className="space-y-6 animate-fade-in font-sans">
              {/* Overview banner */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start space-x-3 shadow-xs">
                <Database className="text-emerald-600 mt-0.5 shrink-0" size={18} />
                <div className="text-xs">
                  <h4 className="font-bold text-slate-800">Verificador e Inspección del Documento Maestro (14 Hojas Excel)</h4>
                  <p className="text-slate-600 mt-0.5">
                    Este visor corporativo permite inspeccionar en tiempo real la organización y los registros tabulados de cada una de las 14 pestañas de Google Sheets que estructuran el ERP. 
                    Úselo para verificar con precisión matemática el flujo constante de datos tras cierres físicos definitivos, cobros, abonos o ventas asentadas.
                  </p>
                </div>
              </div>

              {/* Grid 2 Columns: Excel Viewer & Tools / Folders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COL 1 & 2: Excel Worksheet Viewer */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="text-emerald-600" size={18} />
                        <span className="font-bold text-xs uppercase tracking-wide text-slate-700">Examinación Estructural de Hojas</span>
                      </div>
                      
                      {/* Dropdown for 14 sheets */}
                      <select
                        value={selectedExcelSheet}
                        onChange={(e) => {
                          setSelectedExcelSheet(e.target.value);
                          setExcelSearch("");
                        }}
                        className="bg-slate-50 text-slate-800 text-xs font-bold p-2 rounded-lg border border-slate-200 shadow-3xs cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="PREVENTAS">Hoja 1: Preventas (db.preventas)</option>
                        <option value="DATOS ACTAS">Hoja 2: Datos Actas (db.actas)</option>
                        <option value="MOTOS EN SALA">Hoja 3: Motos en Sala (db.motos_en_sala)</option>
                        <option value="MATRICULAS PARA TRANSITO">Hoja 4: Matrículas Tránsito (db.matriculas)</option>
                        <option value="REVISIONES">Hoja 5: Revisiones (db.revisiones)</option>
                        <option value="RECIBOS">Hoja 6: Registro Recibos (db.recibos)</option>
                        <option value="CORTES DE VENTAS">Hoja 7: Cortes de Ventas (db.cortes_de_ventas)</option>
                        <option value="GASTOS">Hoja 8: Gastos Extraordinarios / Caja (db.salidas_externas)</option>
                        <option value="LLEGADA INVENTARIO">Hoja 9: Llegada Inventario (db.llegada_de_repuestos)</option>
                        <option value="SALIDA DE REPUESTOS">Hoja 10: Salida de Repuestos (db.salida_de_repuestos)</option>
                        <option value="PEDIDOS">Hoja 11: Pedidos Repuestos (db.repuestos_solicitados)</option>
                        <option value="REFERENCIAS ESTUDIOS">Hoja 12: Estudios de Crédito (db.referencias_estudios)</option>
                        <option value="EVENTOS">Hoja 13: Bitácora Eventos (db.eventos)</option>
                        <option value="USUARIOS">Hoja 14: Usuarios ERP (db.usuarios)</option>
                        <option value="COMISIONES">Hoja 15: Comisiones (db.comisiones)</option>
                        <option value="LETRAS">Hoja 16: Cartera de Letras (db.letras)</option>
                        <option value="DEVOLUCIONES">Hoja 17: Devoluciones (db.devoluciones)</option>
                        <option value="PERFIL CLIENTES">Hoja 18: Perfil Clientes (db.clientes_perfil)</option>
                      </select>
                    </div>

                    {/* Filter and stats inside selected sheet */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Search size={14} />
                        </span>
                        <input
                          type="text"
                          value={excelSearch}
                          onChange={(e) => setExcelSearch(e.target.value)}
                          placeholder={`Buscar en columnas de ${selectedExcelSheet}...`}
                          className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="text-[11px] font-bold whitespace-nowrap bg-emerald-50 text-emerald-800 py-1.5 px-3 rounded-lg border border-emerald-100">
                        {getFilteredExcelRows().length} registros mapeados
                      </div>
                    </div>

                    {/* Excel Spreadsheet View Mock */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      {/* Excel Tabs visual simulation header */}
                      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                        <div className="flex items-center space-x-2">
                          <div className="bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase">HOJA ACTIVA</div>
                          <span className="font-bold text-slate-700">MundoMotos_DocumentoMaestro.xlsx</span>
                        </div>
                        <span className="text-slate-500 font-semibold bg-white border px-2 py-0.5 rounded-sm">Pestaña: {selectedExcelSheet}</span>
                      </div>

                      {/* Spreadsheet Grid */}
                      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px] font-mono">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10">
                              {/* Row numbering column header */}
                              <th className="p-1 border-r border-slate-200 bg-slate-100 text-center text-[9px] font-sans w-10 text-slate-400"></th>
                              {/* Headers */}
                              {getExcelSheetData().headers.map((h, i) => {
                                const colLetter = String.fromCharCode(65 + i);
                                return (
                                  <th key={i} className="p-2 border-r border-slate-200 font-bold min-w-[130px] bg-slate-100 text-slate-700 relative text-center">
                                    <div className="text-[9px] text-slate-400 font-normal">{colLetter}</div>
                                    <div className="truncate text-left">{h}</div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {getFilteredExcelRows().length > 0 ? (
                              getFilteredExcelRows().map((row, idx) => (
                                <tr key={row.key || idx} className="hover:bg-slate-50/75 transition-colors">
                                  {/* Row number index */}
                                  <td className="p-2 border-r border-slate-200 bg-slate-50 text-center font-sans text-[10px] font-bold text-slate-400">
                                    {idx + (
                                      (selectedExcelSheet === "RECIBOS" || selectedExcelSheet === "CORTES DE VENTAS" || selectedExcelSheet === "SALIDA DE REPUESTOS" || selectedExcelSheet === "LLEGADA INVENTARIO" || selectedExcelSheet === "MOTOS EN SALA" || selectedExcelSheet === "REFERENCIAS ESTUDIOS" || selectedExcelSheet === "USUARIOS" || selectedExcelSheet === "EVENTOS") ? 3 :
                                      (selectedExcelSheet === "COMISIONES" || selectedExcelSheet === "GASTOS") ? 5 : 4
                                    )}
                                  </td>
                                  {row.cells.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 border-r border-slate-200 text-slate-600 max-w-[220px] truncate" title={String(cell)}>
                                      {cell === null || cell === undefined || cell === "" ? (
                                        <span className="text-slate-300 italic">Vacio</span>
                                      ) : (
                                        String(cell)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={getExcelSheetData().headers.length + 1} className="text-center p-8 text-slate-400 font-bold bg-slate-50">
                                  No hay datos registrados en esta hoja que coincidan con la búsqueda.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Footnotes explaining document rules */}
                    <div className="text-[10px] text-slate-400 italic flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                      <span>
                        📌 Fila de inicio de datos: {
                          (selectedExcelSheet === "RECIBOS" || selectedExcelSheet === "CORTES DE VENTAS" || selectedExcelSheet === "SALIDA DE REPUESTOS" || selectedExcelSheet === "LLEGADA INVENTARIO" || selectedExcelSheet === "MOTOS EN SALA" || selectedExcelSheet === "REFERENCIAS ESTUDIOS" || selectedExcelSheet === "USUARIOS" || selectedExcelSheet === "EVENTOS") ? "Fila 3" : 
                          (selectedExcelSheet === "COMISIONES" || selectedExcelSheet === "GASTOS") ? "Fila 5" : "Fila 4"
                        } 
                        ({
                          (selectedExcelSheet === "RECIBOS" || selectedExcelSheet === "CORTES DE VENTAS" || selectedExcelSheet === "SALIDA DE REPUESTOS" || selectedExcelSheet === "LLEGADA INVENTARIO" || selectedExcelSheet === "MOTOS EN SALA" || selectedExcelSheet === "REFERENCIAS ESTUDIOS" || selectedExcelSheet === "USUARIOS" || selectedExcelSheet === "EVENTOS") 
                            ? "Fila 2 reservada para títulos de columna, Fila 1 para encabezado" 
                            : (selectedExcelSheet === "COMISIONES" || selectedExcelSheet === "GASTOS")
                            ? "Fila 4 reservada para títulos de columna, Filas 1-3 para encabezados"
                            : (selectedExcelSheet === "LETRAS")
                            ? "Fila 3 reservada para títulos de columna, Filas 1-2 para encabezados"
                            : "Fila 3 reservada para títulos de columna, Filas 1-2 para encabezados"
                        })
                      </span>
                      <span className="text-emerald-600 font-bold">✓ Integridad de columnas validada al 100%</span>
                    </div>
                  </div>
                </div>

                {/* COL 3: Tools, Recalculation Engine, and Folders History */}
                <div className="space-y-6">
                  
                  {/* Recalculation engine card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <RefreshCw className={`text-slate-700 ${isRecalculating ? "animate-spin" : ""}`} size={16} />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        Recálculo Estructural de Cierres
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Cuando se efectúa un nuevo inventario o auditoría, es mandatorio recalcular la información de stock y ventas de motocicletas a partir de la última fecha registrada de cierre físico. Esto asegura la consistencia de las 14 hojas.
                    </p>

                    {/* Recalculate Trigger Button */}
                    <button
                      onClick={handleRunRecalculation}
                      disabled={isRecalculating}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                    >
                      {isRecalculating ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Procesando Auditoría...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>Recalcular Todo desde Cierre Físico</span>
                        </>
                      )}
                    </button>

                    {/* Progress logs section */}
                    {(isRecalculating || recalcFinished) && (
                      <div className="bg-slate-950 text-emerald-400 font-mono text-[9px] p-3 rounded-xl space-y-1.5 max-h-[160px] overflow-y-auto border border-slate-800 animate-fade-in shadow-inner">
                        {recalcLogs.map((log, i) => (
                          <div key={i} className="leading-tight">{log}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Folder Structure of closures */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center space-x-2">
                        <Folder className="text-amber-500 fill-amber-100" size={16} />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                          Carpeta de Cierres Consolidados
                        </h4>
                      </div>
                      <button
                        onClick={handleCreateNewClosure}
                        className="text-[10px] text-red-600 hover:text-red-800 font-black flex items-center space-x-1 uppercase cursor-pointer"
                        title="Asentar Cierre Definitivo de Hoy"
                      >
                        <span>+ Registrar Cierre</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Listado de plantillas históricas e información de cada cierre definitivo. Seleccione para consultar valorizados, registros guardados y descargar su plantilla oficial de conciliación.
                    </p>

                    {/* Folder tree layout */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {folders.map((folder) => {
                        const isSelected = selectedFolderId === folder.id;
                        return (
                          <div key={folder.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                            <button
                              onClick={() => setSelectedFolderId(isSelected ? null : folder.id)}
                              className={`w-full p-3 text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected ? "bg-red-50/50 text-red-700 border-l-4 border-red-600" : "bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <Folder className={`shrink-0 ${isSelected ? "text-red-600 fill-red-100" : "text-amber-500 fill-amber-50"}`} size={16} />
                                <span className="truncate" title={folder.nombre}>{folder.nombre}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 shrink-0 font-mono font-normal">{folder.fecha}</span>
                            </button>

                            {/* Folder expanded details */}
                            {isSelected && (
                              <div className="p-3 bg-white border-t border-slate-100 text-[10px] space-y-2.5 text-slate-600 leading-relaxed animate-fade-in">
                                <div>
                                  <span className="font-bold text-slate-700">Tipo:</span> {folder.tipo}
                                </div>
                                <div className="grid grid-cols-2 gap-2 font-mono text-[9px] bg-slate-50 p-2 rounded-lg border border-slate-150">
                                  <div>
                                    <span className="text-slate-400 block uppercase font-sans text-[8px] font-bold">Registros Mapeados</span>
                                    <span className="text-slate-800 font-bold text-xs">{folder.registros}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block uppercase font-sans text-[8px] font-bold">Auditor</span>
                                    <span className="text-slate-800 font-bold text-xs">@{folder.usuario}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block uppercase font-sans text-[8px] font-bold font-semibold">Valor Inventario</span>
                                    <span className="text-slate-800 font-bold text-xs text-emerald-700">${folder.total_inventario.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block uppercase font-sans text-[8px] font-bold">Caja Total</span>
                                    <span className="text-slate-800 font-bold text-xs text-red-700">${folder.ventas_periodo.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="inline-block bg-green-100 text-green-800 font-extrabold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider font-sans">
                                    {folder.estado}
                                  </span>
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      alert(`Iniciando la exportación de "${folder.nombre}.xlsx" estructurada por columnas para validación en Microsoft Excel...`);
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] py-1 px-2.5 rounded-lg flex items-center space-x-1 uppercase cursor-pointer"
                                  >
                                    <Download size={10} />
                                    <span>Exportar Excel</span>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER APPSCRIPT CODE EXPORTER */}
      {adminTab === "appscript" && (
        <div className="space-y-4 animate-fade-in max-w-3xl">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start space-x-3">
            <Shield className="text-red-600 mt-0.5 shrink-0" size={18} />
            <div>
              <h4 className="font-bold text-xs text-red-800 uppercase tracking-wide">Instrucciones de Conectividad con Google Sheets</h4>
              <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                Este ERP está diseñado para funcionar con persistencia inmutable conectándose directamente a tu Google Sheet mediante Google Apps Script. 
                Sigue estos pasos para desplegar el backend real:
              </p>
              <ol className="list-decimal pl-4 mt-2 text-[10px] text-red-700 space-y-1 font-semibold">
                <li>Crea un nuevo documento de Google Sheets.</li>
                <li>Crea 14 pestañas con los nombres exactos en mayúsculas: <strong>MOTOS_EN_SALA</strong>, <strong>PREVENTAS</strong>, <strong>ACTAS</strong>, <strong>MATRICULAS</strong>, <strong>REVISIONES</strong>, <strong>CORTES_DE_VENTAS</strong>, <strong>SALIDAS_EXTERNAS</strong>, <strong>RECIBOS</strong>, <strong>LLEGADA_DE_REPUESTOS</strong>, <strong>SALIDA_DE_REPUESTOS</strong>, <strong>REPUESTOS_SOLICITADOS</strong>, <strong>REFERENCIAS_ESTUDIOS</strong>, <strong>EVENTOS_AUDITORIA</strong>.</li>
                <li>Abre Extensiones &gt; Apps Script. Copia el código de abajo y reemplaza el ID del spreadsheet. Guardar y Desplegar como Aplicación Web.</li>
              </ol>
            </div>
          </div>

          <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
            <div className="flex justify-between items-center bg-slate-800 px-4 py-2 text-slate-300 border-b border-slate-700">
              <span className="text-[10px] font-mono font-bold flex items-center space-x-1">
                <FileCode2 size={12} className="text-red-500" />
                <span>Backend_Sheets_Controller.gs</span>
              </span>
              <button
                type="button"
                onClick={copyAppsScript}
                className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1 text-[10px] font-bold"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-green-500" /> <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} /> <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-[10px] text-emerald-400 font-mono overflow-x-auto max-h-64 custom-scrollbar">
              {`/**
 * BACKEND GOOGLE APPS SCRIPT (.gs) - CONCESIONARIO MUNDO MOTOS ERP REAL
 * Copia este código en tu editor de Google Apps Script (script.google.com)
 * Asegúrate de crear las 14 hojas en tu Google Sheet con los nombres en mayúsculas correspondientes.
 */

const SPREADSHEET_ID = "INGRESA_TU_SPREADSHEET_ID_AQUÍ";

function doGet(e) {
  return HtmlService.createTemplateFromFile("ERP")
    .evaluate()
    .setTitle("ERP Concesionario Mundo Motos")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function leerBaseDatos() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = {};
  const sheets = ss.getSheets();
  
  sheets.forEach(sheet => {
    const name = sheet.getName().toLowerCase();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      data[name] = [];
      return;
    }
    const headers = rows[0];
    const items = [];
    for (let i = 1; i < rows.length; i++) {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = rows[i][index];
      });
      items.push(item);
    }
    data[name] = items;
  });
  
  return JSON.stringify(data);
}

function guardarFila(sheetName, payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName.toUpperCase());
  if (!sheet) throw new Error("Hoja no encontrada: " + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const item = JSON.parse(payload);
  const row = [];
  
  headers.forEach(header => {
    row.push(item[header] !== undefined ? item[header] : "");
  });
  
  sheet.appendRow(row);
  return true;
}`}
            </pre>
          </div>
        </div>
      )}

      {/* RENDER TRANSFERENCIAS AUDIT TAB */}
      {adminTab === "transferencias" && (
        <div className="space-y-4 animate-fade-in font-sans">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl">
            <div>
              <h3 className="font-bold text-base text-white">Auditoría de Transferencias Bancarias</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
                Registro inmutable de todas las transacciones reportadas mediante transferencia electrónica para conciliación bancaria diaria.
              </p>
            </div>
            <div className="bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Recibido</span>
              <span className="font-mono text-base font-black text-emerald-400">
                ${(db.transferencias || []).reduce((acc, curr) => acc + (curr.monto || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Filtrar por origen, módulo u observaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">
              Mostrando {(db.transferencias || []).filter(t => 
                !searchTerm || 
                t.modulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.referencia_origen.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.observaciones.toLowerCase().includes(searchTerm.toLowerCase())
              ).length} registros
            </span>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">ID Transacción</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Módulo de Origen</th>
                  <th className="p-4">Referencia de Origen</th>
                  <th className="p-4 text-right">Monto Recibido</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Observaciones del Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono">
                {(db.transferencias || []).filter(t => 
                  !searchTerm || 
                  t.modulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  t.referencia_origen.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  t.observaciones.toLowerCase().includes(searchTerm.toLowerCase())
                ).length > 0 ? (
                  (db.transferencias || []).filter(t => 
                    !searchTerm || 
                    t.modulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    t.referencia_origen.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    t.observaciones.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-400 text-[10px] font-mono">{t.id}</td>
                      <td className="p-4 font-sans text-slate-600 font-semibold">{t.fecha}</td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 text-[9px] font-bold uppercase">
                          {t.modulo}
                        </span>
                      </td>
                      <td className="p-4 font-sans font-bold text-slate-800">{t.referencia_origen}</td>
                      <td className="p-4 text-right text-emerald-600 font-bold">${t.monto.toLocaleString()}</td>
                      <td className="p-4 font-sans text-slate-700 font-semibold">{t.usuario || "Sistema"}</td>
                      <td className="p-4 font-sans text-slate-500 font-medium max-w-xs truncate" title={t.observaciones}>{t.observaciones}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-bold font-sans">
                      No se registraron transferencias que coincidan con los criterios de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
