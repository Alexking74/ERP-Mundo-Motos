import React, { useState, useEffect } from "react";
import { DatabaseState, Usuario, Devolucion, ViewType } from "../types";
import { getTodayDateString, registrarEvento } from "../utils/db";
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  Bike,
  Package,
  Eye,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  Building2,
  Printer
} from "lucide-react";

interface ModuloDevolucionesProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (newState: DatabaseState) => void;
  selectedEntityId?: string;
  onNavigate?: (view: ViewType, entityId?: string) => void;
}

export default function ModuloDevoluciones({
  user,
  db,
  setDb,
  selectedEntityId,
  onNavigate
}: ModuloDevolucionesProps) {
  const devoluciones = db.devoluciones || [];

  // Tab & Modal States
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDevolucion, setSelectedDevolucion] = useState<Devolucion | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterSector, setFilterSector] = useState("TODOS");
  const [filterEstado, setFilterEstado] = useState("TODOS");

  // Form Creation / Editing States
  const [sector, setSector] = useState<string>("PREVENTAS");
  const [moduloOrigen, setModuloOrigen] = useState<string>("Preventas");
  const [numDocumento, setNumDocumento] = useState<string>("");
  const [tipoDocumento, setTipoDocumento] = useState<string>("CÉDULA");
  const [nombres, setNombres] = useState<string>("");
  const [apellidos, setApellidos] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");

  // Operation selection from client matching
  const [matchedOps, setMatchedOps] = useState<any[]>([]);
  const [selectedOpId, setSelectedOpId] = useState<string>("");

  // Product / Transaction details
  const [tipoDevolucion, setTipoDevolucion] = useState<string>("TOTAL");
  const [referencia, setReferencia] = useState<string>("");
  const [productoConcepto, setProductoConcepto] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [modelo, setModelo] = useState<string>("");
  const [chasis, setChasis] = useState<string>("");
  const [motor, setMotor] = useState<string>("");
  const [color, setColor] = useState<string>("");

  // Economics
  const [valorOriginal, setValorOriginal] = useState<number>(0);
  const [valorPagadoAbonado, setValorPagadoAbonado] = useState<number>(0);
  const [valorDevuelto, setValorDevuelto] = useState<number>(0);
  const [formaPagoOriginal, setFormaPagoOriginal] = useState<string>("Efectivo");
  const [formaDevolucion, setFormaDevolucion] = useState<string>("Efectivo");

  // Product & Inventory status
  const [estadoProducto, setEstadoProducto] = useState<string>("Nuevo / Excelente");
  const [reingresaInventario, setReingresaInventario] = useState<"SI" | "NO">("NO");
  const [motivoDevolucion, setMotivoDevolucion] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");
  const [autorizadoPor, setAutorizadoPor] = useState<string>(
    user.rol === "Administrador" ? user.nombre_completo : "Pendiente Autorización"
  );
  const [estadoDevolucion, setEstadoDevolucion] = useState<
    "PENDIENTE" | "EN REVISIÓN" | "AUTORIZADA" | "PROCESADA" | "RECHAZADA" | "CERRADA" | "CANCELADA"
  >(user.rol === "Administrador" ? "AUTORIZADA" : "PENDIENTE");

  // Pre-populate if selectedEntityId passed (e.g., from another module's "Devolución" button)
  useEffect(() => {
    if (selectedEntityId) {
      setNumDocumento(selectedEntityId);
      setShowNewModal(true);
      buscarInfoCliente(selectedEntityId, sector);
    }
  }, [selectedEntityId]);

  // Handle Sector Change -> adjust default module origin
  const handleSectorChange = (newSector: string) => {
    setSector(newSector);
    if (newSector === "MOTOS") setModuloOrigen("Datos Actas");
    else if (newSector === "PREVENTAS") setModuloOrigen("Preventas");
    else if (newSector === "REPUESTOS") setModuloOrigen("Salida / POS");
    else if (newSector === "ACCESORIOS") setModuloOrigen("Salida / POS");
    else if (newSector === "POS") setModuloOrigen("Salida / POS");
    else setModuloOrigen("Otro");

    if (numDocumento.trim()) {
      buscarInfoCliente(numDocumento, newSector);
    }
  };

  // Cross-module Client Search by Document
  const buscarInfoCliente = (doc: string, currentSector = sector) => {
    const cleanDoc = doc.trim().toLowerCase();
    if (!cleanDoc) return;

    let foundNombres = "";
    let foundApellidos = "";
    let foundTel = "";
    let foundCorreo = "";
    let ops: any[] = [];

    // Search in Preventas
    db.preventas.forEach((p) => {
      if (p.cedula && p.cedula.toLowerCase().includes(cleanDoc)) {
        if (!foundNombres) {
          foundNombres = p.nombre || "";
          foundApellidos = p.apellido || "";
          foundTel = p.telefono || "";
          foundCorreo = p.correo || "";
        }
        ops.push({
          id: p.id_del_encargo || `prev-${p.cedula}`,
          origen: "Preventas",
          sector: "PREVENTAS",
          concepto: `Preventa ${p.id_del_encargo} - ${p.tipo_de_moto || "Moto"}`,
          referencia: p.tipo_de_moto || "MOTO",
          modelo: p.modelo || "",
          chasis: "",
          motor: "",
          color: p.color || "",
          valorOriginal: p.precio_moto || 0,
          valorPagado: p.total_abono || 0,
          formaPago: "Abonos / Mixto",
          raw: p
        });
      }
    });

    // Search in Actas
    db.actas.forEach((a) => {
      if (a.documento && a.documento.toLowerCase().includes(cleanDoc)) {
        if (!foundNombres) {
          foundNombres = a.nombres || "";
          foundApellidos = a.apellidos || "";
          foundTel = a.telefono || "";
          foundCorreo = a.correo || "";
        }
        ops.push({
          id: `acta-${a.acta}`,
          origen: "Datos Actas",
          sector: "MOTOS",
          concepto: `Acta #${a.acta} - ${a.moto} ${a.color}`,
          referencia: a.moto || "MOTO",
          modelo: a.modelo || "",
          chasis: a.chasis || "",
          motor: a.motor || "",
          color: a.color || "",
          valorOriginal: a.valor_moto || 0,
          valorPagado: a.total_recibido || 0,
          formaPago: a.efectivo > 0 ? "Efectivo" : a.transferencia > 0 ? "Transferencia" : "Desembolso / Crédito",
          raw: a
        });
      }
    });

    // Search in Salida de Repuestos / POS
    db.salida_de_repuestos.forEach((s, idx) => {
      if (s.referencia && cleanDoc && (s.producto.toLowerCase().includes(cleanDoc) || s.referencia.toLowerCase().includes(cleanDoc))) {
        ops.push({
          id: `pos-${idx}`,
          origen: "Salida / POS",
          sector: "REPUESTOS",
          concepto: `${s.producto} (Ref: ${s.referencia})`,
          referencia: s.referencia,
          cantidad: s.cantidad || 1,
          valorOriginal: s.valor_total || (s.precio * s.cantidad),
          valorPagado: s.valor_total || (s.precio * s.cantidad),
          formaPago: s.formas_de_pago || "Efectivo",
          raw: s
        });
      }
    });

    // Search in Revisiones
    db.revisiones.forEach((r, idx) => {
      if (r.cedula && r.cedula.toLowerCase().includes(cleanDoc)) {
        if (!foundNombres) {
          foundNombres = r.nombre || "";
          foundTel = r.telefono || "";
        }
        ops.push({
          id: `rev-${idx}`,
          origen: "Revisiones",
          sector: "OTRO",
          concepto: `Revisión Técnica - Chasis: ${r.chasis || "N/A"}`,
          chasis: r.chasis || "",
          motor: r.motor || "",
          valorOriginal: 0,
          valorPagado: 0,
          formaPago: "Efectivo",
          raw: r
        });
      }
    });

    if (foundNombres) setNombres(foundNombres);
    if (foundApellidos) setApellidos(foundApellidos);
    if (foundTel) setTelefono(foundTel);
    if (foundCorreo) setCorreo(foundCorreo);

    setMatchedOps(ops);
  };

  // Handle selecting an operation from the matched list
  const handleSelectOperation = (op: any) => {
    setSelectedOpId(op.id);
    setModuloOrigen(op.origen);
    setProductoConcepto(op.concepto || "");
    setReferencia(op.referencia || "");
    setCantidad(op.cantidad || 1);
    setModelo(op.modelo || "");
    setChasis(op.chasis || "");
    setMotor(op.motor || "");
    setColor(op.color || "");
    setValorOriginal(op.valorOriginal || 0);
    setValorPagadoAbonado(op.valorPagado || 0);
    setValorDevuelto(op.valorPagado || 0);
    setFormaPagoOriginal(op.formaPago || "Efectivo");

    // Auto toggle reingreso if repuestos
    if (op.sector === "REPUESTOS" || op.sector === "ACCESORIOS" || op.sector === "POS") {
      setReingresaInventario("SI");
    } else {
      setReingresaInventario("NO");
    }
  };

  // Reset Form
  const resetForm = () => {
    setSector("PREVENTAS");
    setModuloOrigen("Preventas");
    setNumDocumento("");
    setTipoDocumento("CÉDULA");
    setNombres("");
    setApellidos("");
    setTelefono("");
    setCorreo("");
    setMatchedOps([]);
    setSelectedOpId("");
    setTipoDevolucion("TOTAL");
    setReferencia("");
    setProductoConcepto("");
    setCantidad(1);
    setModelo("");
    setChasis("");
    setMotor("");
    setColor("");
    setValorOriginal(0);
    setValorPagadoAbonado(0);
    setValorDevuelto(0);
    setFormaPagoOriginal("Efectivo");
    setFormaDevolucion("Efectivo");
    setEstadoProducto("Nuevo / Excelente");
    setReingresaInventario("NO");
    setMotivoDevolucion("");
    setObservaciones("");
    setAutorizadoPor(user.rol === "Administrador" ? user.nombre_completo : "Pendiente Autorización");
    setEstadoDevolucion(user.rol === "Administrador" ? "AUTORIZADA" : "PENDIENTE");
  };

  // Submit & Save Devolución
  const handleSaveDevolucion = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations (Section 23)
    if (!numDocumento.trim()) {
      alert("❌ VALIDACIÓN FALLIDA: El N° de Documento del cliente es obligatorio.");
      return;
    }
    if (!nombres.trim()) {
      alert("❌ VALIDACIÓN FALLIDA: Los Nombres del cliente son obligatorios.");
      return;
    }
    if (!productoConcepto.trim()) {
      alert("❌ VALIDACIÓN FALLIDA: El Producto o Concepto a devolver es obligatorio.");
      return;
    }
    if (valorDevuelto <= 0) {
      alert("❌ VALIDACIÓN FALLIDA: El valor a devolver debe ser mayor a $0.");
      return;
    }
    if (valorPagadoAbonado > 0 && valorDevuelto > valorPagadoAbonado) {
      alert(
        `❌ ROJA - ALERTA DE SEGURIDAD: No se puede devolver un valor ($${valorDevuelto.toLocaleString()}) mayor al valor abonado/pagado originalmente ($${valorPagadoAbonado.toLocaleString()}).`
      );
      return;
    }
    if (!motivoDevolucion.trim()) {
      alert("❌ VALIDACIÓN FALLIDA: Debe ingresar el motivo detallado de la devolución.");
      return;
    }

    const today = getTodayDateString();
    const isClosed = estadoDevolucion === "CERRADA" || estadoDevolucion === "PROCESADA";

    const newDev: Devolucion = {
      fecha_devolucion: today,                          // Col A
      sede: user.sede || "SEDE PRINCIPAL",               // Col B
      sector: sector,                                   // Col C
      modulo_origen: moduloOrigen,                      // Col D
      tipo_documento: tipoDocumento,                    // Col E
      numero_documento: numDocumento.trim(),            // Col F
      nombres: nombres.trim(),                          // Col G
      apellidos: apellidos.trim(),                      // Col H
      telefono: telefono.trim(),                        // Col I
      correo_electronico: correo.trim(),                // Col J
      tipo_devolucion: tipoDevolucion,                  // Col K
      referencia: referencia.trim(),                    // Col L
      producto_concepto: productoConcepto.trim(),        // Col M
      cantidad: cantidad || 1,                          // Col N
      modelo: modelo.trim(),                            // Col O
      chasis: chasis.trim(),                            // Col P
      motor: motor.trim(),                              // Col Q
      color: color.trim(),                              // Col R
      valor_original: valorOriginal,                    // Col S
      valor_pagado_abonado: valorPagadoAbonado,         // Col T
      valor_devuelto: valorDevuelto,                    // Col U
      forma_pago_original: formaPagoOriginal,           // Col V
      forma_devolucion: formaDevolucion,                // Col W
      estado_producto: estadoProducto,                  // Col X
      reingresa_inventario: reingresaInventario,        // Col Y
      motivo_devolucion: motivoDevolucion.trim(),       // Col Z
      observaciones: observaciones.trim(),              // Col AA
      asesor_responsable: user.nombre_completo,         // Col AB
      autorizado_por: autorizadoPor,                    // Col AC
      estado_devolucion: estadoDevolucion,              // Col AD
      fecha_cierre: isClosed ? today : "PENDIENTE"      // Col AE
    };

    let updatedDb: DatabaseState = {
      ...db,
      devoluciones: [newDev, ...(db.devoluciones || [])]
    };

    // Determine Alert Priority (Section 22)
    let alertPriority: "VERDE" | "AMARILLA" | "ROJA" = "AMARILLA";
    if (user.rol === "Administrador") alertPriority = "VERDE";
    if (valorDevuelto > 1000000 || estadoDevolucion === "CERRADA") alertPriority = "ROJA";

    // Register Event (Section 21)
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "Devoluciones",
      `Registro de Devolución ${tipoDevolucion} por $${valorDevuelto.toLocaleString()}`,
      alertPriority,
      "Devolución",
      "N/A",
      `Doc: ${numDocumento} | Módulo: ${moduloOrigen} | Devuelto: $${valorDevuelto}`,
      `Motivo: ${motivoDevolucion} | Estado: ${estadoDevolucion}`
    );

    // If sector is PREVENTAS and state is cancel/processed, update Preventa status
    if (sector === "PREVENTAS" && selectedOpId) {
      updatedDb.preventas = updatedDb.preventas.map((p) => {
        if (p.id_del_encargo === selectedOpId || p.cedula === numDocumento) {
          return {
            ...p,
            estado: "DEVUELTA",
            detalles: `${p.detalles || ""} [CANCELADA POR DEVOLUCIÓN - ${today}: Devuelto $${valorDevuelto}]`
          };
        }
        return p;
      });
    }

    setDb(updatedDb);
    setShowNewModal(false);
    resetForm();
    alert(`✅ DEVOLUCIÓN REGISTRADA CON ÉXITO: Se registró correctamente bajo el estado "${estadoDevolucion}".`);
  };

  // Change Status Action (e.g. Admin Authorize/Close)
  const handleChangeStatus = (index: number, newStatus: Devolucion["estado_devolucion"]) => {
    const list = [...(db.devoluciones || [])];
    const dev = list[index];
    if (!dev) return;

    if (dev.estado_devolucion === "CERRADA" && user.rol !== "Administrador") {
      alert("🔴 ROJA: Una devolución cerrada no se puede modificar por un Vendedor.");
      return;
    }

    const today = getTodayDateString();
    const updatedDev: Devolucion = {
      ...dev,
      estado_devolucion: newStatus,
      autorizado_por: user.rol === "Administrador" ? user.nombre_completo : dev.autorizado_por,
      fecha_cierre: newStatus === "CERRADA" || newStatus === "PROCESADA" ? today : dev.fecha_cierre
    };

    list[index] = updatedDev;
    let updatedDb: DatabaseState = { ...db, devoluciones: list };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "Devoluciones",
      `Cambio de Estado Devolución #${index + 1} a ${newStatus}`,
      user.rol === "Administrador" ? "VERDE" : "AMARILLA",
      "estado_devolucion",
      dev.estado_devolucion,
      newStatus,
      `Actualizado por ${user.nombre_completo}`
    );

    setDb(updatedDb);
    setSelectedDevolucion(updatedDev);
    alert(`Estado de la devolución actualizado a: ${newStatus}`);
  };

  // Filter List
  const filteredDevoluciones = devoluciones.filter((d) => {
    const search = filterText.toLowerCase();
    const matchesSearch =
      !search ||
      d.numero_documento.toLowerCase().includes(search) ||
      d.nombres.toLowerCase().includes(search) ||
      d.apellidos.toLowerCase().includes(search) ||
      d.producto_concepto.toLowerCase().includes(search) ||
      d.referencia.toLowerCase().includes(search) ||
      d.sector.toLowerCase().includes(search) ||
      d.modulo_origen.toLowerCase().includes(search);

    const matchesSector = filterSector === "TODOS" || d.sector === filterSector;
    const matchesEstado = filterEstado === "TODOS" || d.estado_devolucion === filterEstado;

    return matchesSearch && matchesSector && matchesEstado;
  });

  // Calculate Summary Statistics
  const totalDevoluciones = devoluciones.length;
  const totalMontoDevuelto = devoluciones.reduce(
    (sum, d) => (d.estado_devolucion !== "RECHAZADA" && d.estado_devolucion !== "CANCELADA" ? sum + d.valor_devuelto : sum),
    0
  );
  const totalPendientes = devoluciones.filter(
    (d) => d.estado_devolucion === "PENDIENTE" || d.estado_devolucion === "EN REVISIÓN"
  ).length;
  const totalCerradas = devoluciones.filter(
    (d) => d.estado_devolucion === "CERRADA" || d.estado_devolucion === "PROCESADA"
  ).length;

  return (
    <div className="space-y-6 font-sans pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600/30 rounded-xl border border-red-500/30 text-red-400">
              <RotateCcw size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Módulo Devoluciones ERP</h1>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Gestión transversal de devoluciones de dinero, productos e inventario. Base de datos oficial (Hoja DEVOLUCIONES, Filas 2 y 3+).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowNewModal(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Registrar Nueva Devolución</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Devoluciones</span>
            <FileText size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800">{totalDevoluciones}</p>
          <span className="text-[10px] text-slate-500 font-medium">Registros guardados</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Dinero Devuelto</span>
            <DollarSign size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600">${totalMontoDevuelto.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 font-medium font-mono">Efectivo / Transferencias</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendientes Revisión</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{totalPendientes}</p>
          <span className="text-[10px] text-amber-700 font-medium">Requieren autorización</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Procesadas / Cerradas</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalCerradas}</p>
          <span className="text-[10px] text-emerald-700 font-medium">Proceso finalizado</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por cliente, documento, referencia, concepto..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Sectores</option>
              <option value="PREVENTAS">Sector: Preventas</option>
              <option value="MOTOS">Sector: Motos</option>
              <option value="REPUESTOS">Sector: Repuestos</option>
              <option value="ACCESORIOS">Sector: Accesorios</option>
              <option value="POS">Sector: POS</option>
              <option value="OTRO">Sector: Otro</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN REVISIÓN">EN REVISIÓN</option>
              <option value="AUTORIZADA">AUTORIZADA</option>
              <option value="PROCESADA">PROCESADA</option>
              <option value="CERRADA">CERRADA</option>
              <option value="RECHAZADA">RECHAZADA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Database Sheet DEVOLUCIONES (Columnas A - AE) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Hoja de Registro ERP — DEVOLUCIONES</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Estructura: Fila 2 (Títulos) | Filas 3+ (Registros). Columnas A (Fecha) hasta AE (Fecha Cierre).
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-md">
            Total: {filteredDevoluciones.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">A. Fecha Dev.</th>
                <th className="p-3">B. Sede</th>
                <th className="p-3">C. Sector</th>
                <th className="p-3">D. Módulo Origen</th>
                <th className="p-3">F. Documento</th>
                <th className="p-3">G-H. Cliente</th>
                <th className="p-3">M. Producto / Concepto</th>
                <th className="p-3 text-right">T. Abonado</th>
                <th className="p-3 text-right">U. Devuelto</th>
                <th className="p-3">W. Forma Dev.</th>
                <th className="p-3 text-center">Y. Reingresa Stock</th>
                <th className="p-3 text-center">AD. Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevoluciones.map((dev, idx) => {
                const badgeColor =
                  dev.estado_devolucion === "CERRADA" || dev.estado_devolucion === "PROCESADA"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : dev.estado_devolucion === "AUTORIZADA"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : dev.estado_devolucion === "RECHAZADA" || dev.estado_devolucion === "CANCELADA"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse";

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 whitespace-nowrap font-mono">{dev.fecha_devolucion}</td>
                    <td className="p-3 font-semibold text-slate-700">{dev.sede}</td>
                    <td className="p-3">
                      <span className="font-bold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {dev.sector}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-600">{dev.modulo_origen}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{dev.numero_documento}</td>
                    <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                      {dev.nombres} {dev.apellidos}
                    </td>
                    <td className="p-3 max-w-xs truncate font-medium text-slate-800" title={dev.producto_concepto}>
                      {dev.producto_concepto}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      ${(dev.valor_pagado_abonado || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600">
                      ${(dev.valor_devuelto || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{dev.forma_devolucion}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          dev.reingresa_inventario === "SI"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {dev.reingresa_inventario}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${badgeColor}`}>
                        {dev.estado_devolucion}
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedDevolucion(dev)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          title="Ver Detalle Completo de Devolución"
                        >
                          <Eye size={12} />
                          <span>Ver</span>
                        </button>

                        {onNavigate && dev.numero_documento && (
                          <button
                            onClick={() => onNavigate("ClientesPerfil", dev.numero_documento)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-1 rounded transition-colors cursor-pointer"
                            title="Ir al Perfil del Cliente"
                          >
                            <User size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDevoluciones.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center p-8 text-slate-400 font-bold">
                    No se encontraron devoluciones registradas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Nueva Devolución (Flujo Sección 6) */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto font-sans animate-fade-in border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-600 rounded-lg text-white">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-base">Registrar Nueva Devolución</h2>
                  <p className="text-xs text-slate-300">
                    Proceso guiado según Sección 6 del Documento Maestro ERP (Mapeo por N° Documento)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDevolucion} className="p-6 space-y-6">
              {/* Step 1 & 2: Sector y Módulo Origen */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                  <Building2 size={14} className="text-red-600" />
                  <span>1. Selección de Sector y Módulo Origen</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Sector de la Devolución *
                    </label>
                    <select
                      value={sector}
                      onChange={(e) => handleSectorChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-800"
                    >
                      <option value="PREVENTAS">PREVENTAS (Abonos / Encargos)</option>
                      <option value="MOTOS">MOTOS (Venta oficial / Actas)</option>
                      <option value="REPUESTOS">REPUESTOS (Mostrador / Inventario)</option>
                      <option value="ACCESORIOS">ACCESORIOS (Cascos, Chalecos, etc.)</option>
                      <option value="POS">POS / Venta Rápida</option>
                      <option value="OTRO">OTRO CONCEPTO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Módulo / Origen *
                    </label>
                    <select
                      value={moduloOrigen}
                      onChange={(e) => setModuloOrigen(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-800"
                    >
                      <option value="Preventas">Preventas</option>
                      <option value="Datos Actas">Datos Actas</option>
                      <option value="Salida / POS">Salida / POS</option>
                      <option value="Revisiones">Revisiones Técnicas</option>
                      <option value="Otro">Otro Origen</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3 & 4: Llave Transversal - N° Documento */}
              <div className="bg-red-50/40 p-4 rounded-xl border border-red-100 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-red-900 flex items-center space-x-1">
                  <User size={14} className="text-red-600" />
                  <span>2. Identificación del Cliente (Llave Transversal N° Documento)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Documento</label>
                    <select
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="CÉDULA">Cédula de Ciudadanía</option>
                      <option value="CÉDULA EXTRANJERÍA">Cédula Extranjería</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="NIT">NIT</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      N° Documento Cliente * (Presione Buscar o Enter)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={numDocumento}
                        onChange={(e) => {
                          setNumDocumento(e.target.value);
                          buscarInfoCliente(e.target.value);
                        }}
                        placeholder="Ingrese N° Cédula o NIT..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => buscarInfoCliente(numDocumento)}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Search size={14} />
                        <span>Mapear Cliente</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto-populated Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Nombres *</label>
                    <input
                      type="text"
                      required
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Apellidos</label>
                    <input
                      type="text"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Teléfono</label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Correo Electrónico</label>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Matched Operations Selection */}
              {matchedOps.length > 0 && (
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center justify-between">
                    <span>3. Operaciones Encontradas para este Cliente</span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {matchedOps.length} registros
                    </span>
                  </h4>
                  <p className="text-[11px] text-blue-800 font-medium">
                    Seleccione la operación específica para autorellenar datos económicos, producto y motocicleta:
                  </p>

                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {matchedOps.map((op) => (
                      <div
                        key={op.id}
                        onClick={() => handleSelectOperation(op)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex justify-between items-center ${
                          selectedOpId === op.id
                            ? "bg-blue-600 text-white border-blue-700 shadow-2xs font-bold"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-blue-50"
                        }`}
                      >
                        <div>
                          <div className="font-bold">{op.concepto}</div>
                          <div className="text-[10px] opacity-80 font-mono">
                            Origen: {op.origen} | Ref: {op.referencia || "N/A"}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div>Valor Pagado: ${(op.valorPagado || 0).toLocaleString()}</div>
                          <div className="text-[10px] opacity-80">Forma: {op.formaPago}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Informacion del Producto / Concepto / Motocicleta */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                  <Package size={14} className="text-slate-600" />
                  <span>4. Datos del Producto, Concepto y Motocicleta</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Producto / Concepto *</label>
                    <input
                      type="text"
                      required
                      value={productoConcepto}
                      onChange={(e) => setProductoConcepto(e.target.value)}
                      placeholder="Ej: Devolución de abono Preventa NMAX, Casco con detalle, etc."
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Referencia / Código</label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Ej: CASCO-001, PREV-01"
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Modelo</label>
                    <input
                      type="text"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Chasis</label>
                    <input
                      type="text"
                      value={chasis}
                      onChange={(e) => setChasis(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Motor</label>
                    <input
                      type="text"
                      value={motor}
                      onChange={(e) => setMotor(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500">Color</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Step 6: Información Económica y Validación */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center space-x-1">
                  <DollarSign size={14} className="text-emerald-700" />
                  <span>5. Información Económica & Validación de Abonos</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Original ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={valorOriginal || ""}
                      onChange={(e) => setValorOriginal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Valor Pagado / Abonado ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={valorPagadoAbonado || ""}
                      onChange={(e) => setValorPagadoAbonado(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-red-700 mb-1">VALOR A DEVOLVER ($) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={valorDevuelto || ""}
                      onChange={(e) => setValorDevuelto(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border-2 border-red-500 rounded p-2 text-sm font-mono font-black text-red-600"
                    />
                    {valorPagadoAbonado > 0 && valorDevuelto > valorPagadoAbonado && (
                      <p className="text-[10px] text-red-600 font-bold mt-1">
                        ⚠️ ALERTA ROJA: El valor devuelto no puede superar el abonado (${valorPagadoAbonado.toLocaleString()}).
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Forma de Pago Original</label>
                    <select
                      value={formaPagoOriginal}
                      onChange={(e) => setFormaPagoOriginal(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Forma de Devolución *</label>
                    <select
                      value={formaDevolucion}
                      onChange={(e) => setFormaDevolucion(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-bold text-slate-800"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta (Reversión)</option>
                      <option value="Mixto">Mixto</option>
                      <option value="Crédito a Favor">Crédito a Favor del Cliente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 7: Estado del Producto & Reingreso a Inventario */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center space-x-1">
                  <ShieldCheck size={14} className="text-amber-700" />
                  <span>6. Control de Inventario y Estado del Producto</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Estado del Producto</label>
                    <select
                      value={estadoProducto}
                      onChange={(e) => setEstadoProducto(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="Nuevo / Excelente">Nuevo / Excelente Estado</option>
                      <option value="Apto para Venta">Apto para Reventa</option>
                      <option value="Con Detalle / Defectuoso">Con Detalle / Defectuoso</option>
                      <option value="Usado / Mantenimiento">Usado / Requiere Mantenimiento</option>
                      <option value="No Aplica (Dinero/Servicio)">No Aplica (Dinero/Servicio)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Reingresa a Inventario *</label>
                    <select
                      value={reingresaInventario}
                      onChange={(e) => setReingresaInventario(e.target.value as "SI" | "NO")}
                      className={`w-full border rounded p-2 text-xs font-bold ${
                        reingresaInventario === "SI"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-slate-300 text-slate-800"
                      }`}
                    >
                      <option value="NO">NO (No suma unidades al stock)</option>
                      <option value="SI">SI (Reingresa automáticamente al inventario)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 8: Motivo, Observaciones, Estado & Autorización */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo Detallado de la Devolución *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={motivoDevolucion}
                    onChange={(e) => setMotivoDevolucion(e.target.value)}
                    placeholder="Explique el motivo justificado de la devolución de dinero o producto..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones Adicionales</label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas internas de la operación..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100 p-3 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Autorizado Por</label>
                    <input
                      type="text"
                      value={autorizadoPor}
                      onChange={(e) => setAutorizadoPor(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Estado de Devolución</label>
                    <select
                      value={estadoDevolucion}
                      onChange={(e) => setEstadoDevolucion(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="PENDIENTE">PENDIENTE (Sujeto a Revisión)</option>
                      <option value="EN REVISIÓN">EN REVISIÓN</option>
                      <option value="AUTORIZADA">AUTORIZADA</option>
                      <option value="PROCESADA">PROCESADA</option>
                      <option value="CERRADA">CERRADA (Finalizada)</option>
                      <option value="RECHAZADA">RECHAZADA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false);
                    resetForm();
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <RotateCcw size={16} />
                  <span>Guardar y Registrar Devolución</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Details (31 Columns Detail Viewer) */}
      {selectedDevolucion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto font-sans animate-fade-in border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  {selectedDevolucion.sector} — {selectedDevolucion.modulo_origen}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Detalle de Devolución — {selectedDevolucion.producto_concepto}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Fecha: {selectedDevolucion.fecha_devolucion} | Sede: {selectedDevolucion.sede}
                </p>
              </div>

              <button
                onClick={() => setSelectedDevolucion(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Complete 31 Columns Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border">
                <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b pb-1">
                  Cliente & Identificación
                </h3>
                <p><span className="text-slate-500">Documento:</span> <strong className="font-mono">{selectedDevolucion.tipo_documento} {selectedDevolucion.numero_documento}</strong></p>
                <p><span className="text-slate-500">Nombres / Apellidos:</span> <strong>{selectedDevolucion.nombres} {selectedDevolucion.apellidos}</strong></p>
                <p><span className="text-slate-500">Teléfono:</span> {selectedDevolucion.telefono || "N/A"}</p>
                <p><span className="text-slate-500">Correo:</span> {selectedDevolucion.correo_electronico || "N/A"}</p>
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border">
                <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b pb-1">
                  Producto / Motocicleta
                </h3>
                <p><span className="text-slate-500">Tipo Dev.:</span> <strong>{selectedDevolucion.tipo_devolucion}</strong></p>
                <p><span className="text-slate-500">Referencia:</span> <strong className="font-mono">{selectedDevolucion.referencia || "N/A"}</strong></p>
                <p><span className="text-slate-500">Cantidad:</span> {selectedDevolucion.cantidad}</p>
                <p><span className="text-slate-500">Modelo / Color:</span> {selectedDevolucion.modelo} {selectedDevolucion.color}</p>
                <p><span className="text-slate-500">Chasis / Motor:</span> <span className="font-mono">{selectedDevolucion.chasis} / {selectedDevolucion.motor}</span></p>
              </div>

              <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                <h3 className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider border-b pb-1">
                  Valores Económicos
                </h3>
                <p><span className="text-slate-500">Valor Original:</span> ${(selectedDevolucion.valor_original || 0).toLocaleString()}</p>
                <p><span className="text-slate-500">Valor Pagado/Abonado:</span> ${(selectedDevolucion.valor_pagado_abonado || 0).toLocaleString()}</p>
                <p><span className="text-slate-500">VALOR DEVUELTO:</span> <strong className="text-red-600 font-mono text-sm">${(selectedDevolucion.valor_devuelto || 0).toLocaleString()}</strong></p>
                <p><span className="text-slate-500">Forma Original:</span> {selectedDevolucion.forma_pago_original}</p>
                <p><span className="text-slate-500">Forma Devolución:</span> <strong>{selectedDevolucion.forma_devolucion}</strong></p>
              </div>

              <div className="space-y-2 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                <h3 className="font-bold text-amber-900 text-[11px] uppercase tracking-wider border-b pb-1">
                  Estado & Auditoría
                </h3>
                <p><span className="text-slate-500">Estado Producto:</span> {selectedDevolucion.estado_producto}</p>
                <p><span className="text-slate-500">Reingresa Inventario:</span> <strong>{selectedDevolucion.reingresa_inventario}</strong></p>
                <p><span className="text-slate-500">Asesor Responsable:</span> {selectedDevolucion.asesor_responsable}</p>
                <p><span className="text-slate-500">Autorizado Por:</span> {selectedDevolucion.autorizado_por}</p>
                <p><span className="text-slate-500">Estado Devolución:</span> <strong className="text-slate-900">{selectedDevolucion.estado_devolucion}</strong></p>
                <p><span className="text-slate-500">Fecha Cierre:</span> {selectedDevolucion.fecha_cierre}</p>
              </div>

              <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border space-y-1">
                <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Motivo Devolución</h3>
                <p className="text-slate-700 italic">{selectedDevolucion.motivo_devolucion}</p>
                {selectedDevolucion.observaciones && (
                  <p className="text-slate-500 text-[11px] mt-1 font-medium">Obs: {selectedDevolucion.observaciones}</p>
                )}
              </div>
            </div>

            {/* Quick Actions in View Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t">
              <div className="flex gap-2">
                {user.rol === "Administrador" && selectedDevolucion.estado_devolucion !== "CERRADA" && (
                  <button
                    onClick={() => handleChangeStatus(devoluciones.indexOf(selectedDevolucion), "CERRADA")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Cerrar y Certificar Devolución</span>
                  </button>
                )}

                {user.rol === "Administrador" && selectedDevolucion.estado_devolucion === "PENDIENTE" && (
                  <button
                    onClick={() => handleChangeStatus(devoluciones.indexOf(selectedDevolucion), "AUTORIZADA")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Autorizar
                  </button>
                )}
              </div>

              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Comprobante</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
