import React, { useState } from "react";
import { Plus, Search, Calendar, Filter, CheckCircle2, Clock, AlertTriangle, PackageCheck, ShoppingBag, XCircle, ArrowRight, DollarSign, FileSpreadsheet, ChevronDown, ChevronUp, Eye, Edit3, Trash2, Shield, User, Phone, Check } from "lucide-react";
import { DatabaseState, Usuario, RepuestoSolicitado, Recibo } from "../types";
import { calcularInventarioGeneral, getTodayDateString, registrarEvento } from "../utils/db";

interface PedidosSolicitadosProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
}

export default function ModuloPedidosSolicitados({ user, db, setDb }: PedidosSolicitadosProps) {
  const isAdmin = user.rol === "Administrador";

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRazon, setFilterRazon] = useState("TODAS");
  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [filterFechaInicio, setFilterFechaInicio] = useState("");
  const [filterFechaFin, setFilterFechaFin] = useState("");

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form Fields for Order
  const [formFecha, setFormFecha] = useState(getTodayDateString());
  const [formRazon, setFormRazon] = useState<"NO HAY" | "ENCARGO">("NO HAY");
  const [formCantidad, setFormCantidad] = useState(1);
  const [formMoto, setFormMoto] = useState("");
  const [formReferencia, setFormReferencia] = useState("");
  const [formProducto, setFormProducto] = useState("");
  const [formDocumento, setFormDocumento] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formApellidos, setFormApellidos] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formValor, setFormValor] = useState(0);
  const [formAbonoEfectivo, setFormAbonoEfectivo] = useState(0);
  const [formAbonoTransferencia, setFormAbonoTransferencia] = useState(0);
  const [formRecibo, setFormRecibo] = useState("");
  const [formEstado, setFormEstado] = useState<RepuestoSolicitado["estado"]>("PENDIENTE");

  // Autocomplete / Search States in Modal
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [showProdSearchResults, setShowProdSearchResults] = useState(false);
  const [clientLookupNotice, setClientLookupNotice] = useState("");

  // Additional Modal: Abono
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [abonoTargetIndex, setAbonoTargetIndex] = useState<number | null>(null);
  const [abonoValor, setAbonoValor] = useState(0);
  const [abonoForma, setAbonoForma] = useState<"Efectivo" | "Transferencia">("Efectivo");
  const [abonoRecibo, setAbonoRecibo] = useState("");
  const [abonoObs, setAbonoObs] = useState("");
  const [abonoFecha, setAbonoFecha] = useState(getTodayDateString());

  // Additional Modal: Cancel
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetIndex, setCancelTargetIndex] = useState<number | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("Cancelación voluntaria del cliente");
  const [cancelObs, setCancelObs] = useState("");

  // Table row expansion for payment history
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

  // Calculate stock inventory list for product lookup
  const stockInventory = calcularInventarioGeneral(db);

  // Helper reset form
  const resetForm = () => {
    setFormFecha(getTodayDateString());
    setFormRazon("NO HAY");
    setFormCantidad(1);
    setFormMoto("");
    setFormReferencia("");
    setFormProducto("");
    setFormDocumento("");
    setFormNombre("");
    setFormApellidos("");
    setFormTelefono("");
    setFormValor(0);
    setFormAbonoEfectivo(0);
    setFormAbonoTransferencia(0);
    setFormRecibo("");
    setFormEstado("PENDIENTE");
    setProdSearchQuery("");
    setShowProdSearchResults(false);
    setClientLookupNotice("");
  };

  // Open Edit Form
  const openEditForm = (idx: number, item: RepuestoSolicitado) => {
    setEditingIndex(idx);
    setFormFecha(item.fecha || getTodayDateString());
    setFormRazon(item.razon || "NO HAY");
    setFormCantidad(item.cantidad || 1);
    setFormMoto(item.moto || "");
    setFormReferencia(item.referencia || "");
    setFormProducto(item.producto || "");
    setFormDocumento(item.documento || "");
    setFormNombre(item.nombre || "");
    setFormApellidos(item.apellidos || "");
    setFormTelefono(item.telefono || "");
    setFormValor(item.valor || 0);
    setFormAbonoEfectivo(item.abono_efectivo || 0);
    setFormAbonoTransferencia(item.abono_transferencia || 0);
    setFormRecibo(item.recibo || "");
    setFormEstado(item.estado || "PENDIENTE");
    setShowFormModal(true);
  };

  // Search Client in Perfil Clientes / Preventas
  const handleClientDocLookup = (docVal: string) => {
    setFormDocumento(docVal);
    const cleanDoc = docVal.trim();
    if (cleanDoc.length >= 4) {
      // Search in clientes_perfil
      const matchedPerfil = (db.clientes_perfil || []).find(
        (c) => (c.numero_documento || "").trim() === cleanDoc
      );
      if (matchedPerfil) {
        setFormNombre(matchedPerfil.nombres || "");
        setFormApellidos(matchedPerfil.apellidos || "");
        setFormTelefono(matchedPerfil.telefono_principal || "");
        setClientLookupNotice(`Cliente localizado en PERFIL CLIENTES: ${matchedPerfil.nombres} ${matchedPerfil.apellidos}`);
        return;
      }

      // Search in preventas
      const matchedPreventa = (db.preventas || []).find(
        (p) => (p.cedula || "").trim() === cleanDoc
      );
      if (matchedPreventa) {
        setFormNombre(matchedPreventa.nombre || "");
        setFormApellidos(matchedPreventa.apellido || "");
        setFormTelefono(matchedPreventa.telefono || "");
        setClientLookupNotice(`Cliente localizado en PREVENTAS: ${matchedPreventa.nombre} ${matchedPreventa.apellido || ""}`);
        return;
      }

      setClientLookupNotice("No se encontró perfil existente con esta cédula. Complete los datos manualmente.");
    } else {
      setClientLookupNotice("");
    }
  };

  // Handle Save Order
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formReferencia.trim() || !formProducto.trim() || !formNombre.trim()) {
      alert("Por favor complete los campos obligatorios: Referencia, Producto y Nombre del cliente.");
      return;
    }

    const totalAbonos = formAbonoEfectivo + formAbonoTransferencia;
    const deudaCalc = Math.max(0, formValor - totalAbonos);

    // Auto-generate Recibo if there is down payment and no receipt number provided
    let finalRecibo = formRecibo.trim();
    if (totalAbonos > 0 && !finalRecibo) {
      finalRecibo = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newOrder: RepuestoSolicitado = {
      fecha: formFecha,
      razon: formRazon,
      cantidad: formCantidad,
      moto: formMoto,
      referencia: formReferencia.toUpperCase(),
      producto: formProducto,
      documento: formDocumento,
      nombre: formNombre,
      apellidos: formApellidos,
      telefono: formTelefono,
      valor: formValor,
      abono_efectivo: formAbonoEfectivo,
      abono_transferencia: formAbonoTransferencia,
      recibo: finalRecibo,
      deuda: deudaCalc,
      estado: formEstado,
    };

    let updatedList = [...(db.repuestos_solicitados || [])];
    let newRecibos = [...(db.recibos || [])];

    if (editingIndex !== null) {
      // Preserve existing payment history if editing
      const existingHistory = updatedList[editingIndex]?.abonos_historial;
      newOrder.abonos_historial = existingHistory;
      updatedList[editingIndex] = newOrder;
    } else {
      // New Order
      if (totalAbonos > 0) {
        newOrder.abonos_historial = [
          {
            fecha: formFecha,
            valor: totalAbonos,
            forma_pago: formAbonoEfectivo > 0 && formAbonoTransferencia > 0 ? "Efectivo" : formAbonoEfectivo > 0 ? "Efectivo" : "Transferencia",
            numero_recibo: finalRecibo,
            usuario: user.nombre_completo || user.usuario,
            observaciones: "Abono inicial al registrar pedido",
          },
        ];

        // Register official Recibo entry
        const nuevoReciboObj: Recibo = {
          fecha: formFecha,
          numero_recibo: finalRecibo,
          recibo_de_pertenencia: `${formNombre} ${formApellidos}`.trim(),
          concepto: `Abono a pedido repuesto: ${formProducto} (${formReferencia})`,
          entrada: totalAbonos,
          salida: 0,
        };
        newRecibos.unshift(nuevoReciboObj);
      }

      updatedList.unshift(newOrder);
    }

    let tempDb: DatabaseState = {
      ...db,
      repuestos_solicitados: updatedList,
      recibos: newRecibos,
    };

    tempDb = registrarEvento(
      tempDb,
      user,
      "PEDIDOS Y PRODUCTOS SOLICITADOS",
      editingIndex !== null ? "Modificación Pedido" : "Registro Pedido",
      "VERDE",
      "repuestos_solicitados",
      "N/A",
      formReferencia,
      `Pedido ${formReferencia} para ${formNombre} ${formApellidos}. Valor: $${formValor}`
    );

    setDb(tempDb);
    setShowFormModal(false);
    resetForm();
  };

  // Quick Change Status
  const handleUpdateStatus = (index: number, newStatus: RepuestoSolicitado["estado"]) => {
    const list = [...(db.repuestos_solicitados || [])];
    if (!list[index]) return;

    const item = list[index];
    const prevStatus = item.estado;
    item.estado = newStatus;

    let tempDb: DatabaseState = {
      ...db,
      repuestos_solicitados: list,
    };

    tempDb = registrarEvento(
      tempDb,
      user,
      "PEDIDOS Y PRODUCTOS SOLICITADOS",
      "Cambio Estado",
      "VERDE",
      "estado",
      prevStatus,
      newStatus,
      `Pedido ${item.referencia} (${item.producto}) cambió a ${newStatus}`
    );

    setDb(tempDb);
  };

  // Confirm Additional Abono
  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (abonoTargetIndex === null) return;

    const list = [...(db.repuestos_solicitados || [])];
    const order = list[abonoTargetIndex];
    if (!order) return;

    if (abonoValor <= 0) {
      alert("El valor del abono debe ser mayor a 0.");
      return;
    }

    const finalRecibo = abonoRecibo.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`;

    if (abonoForma === "Efectivo") {
      order.abono_efectivo += abonoValor;
    } else {
      order.abono_transferencia += abonoValor;
    }

    const totalAbonos = order.abono_efectivo + order.abono_transferencia;
    order.deuda = Math.max(0, order.valor - totalAbonos);

    if (!order.abonos_historial) {
      order.abonos_historial = [];
    }

    order.abonos_historial.push({
      fecha: abonoFecha,
      valor: abonoValor,
      forma_pago: abonoForma,
      numero_recibo: finalRecibo,
      usuario: user.nombre_completo || user.usuario,
      observaciones: abonoObs || "Abono adicional a pedido",
    });

    // Create Recibo entry
    const nuevoReciboObj: Recibo = {
      fecha: abonoFecha,
      numero_recibo: finalRecibo,
      recibo_de_pertenencia: `${order.nombre} ${order.apellidos}`.trim(),
      concepto: `Abono adicional a pedido: ${order.producto} (${order.referencia})`,
      entrada: abonoValor,
      salida: 0,
    };

    const newRecibos = [nuevoReciboObj, ...(db.recibos || [])];

    let tempDb: DatabaseState = {
      ...db,
      repuestos_solicitados: list,
      recibos: newRecibos,
    };

    tempDb = registrarEvento(
      tempDb,
      user,
      "PEDIDOS Y PRODUCTOS SOLICITADOS",
      "Abono Adicional",
      "VERDE",
      "abonos",
      "N/A",
      `$${abonoValor}`,
      `Abono de $${abonoValor} (${abonoForma}) a pedido ${order.referencia}`
    );

    setDb(tempDb);
    setShowAbonoModal(false);
    setAbonoTargetIndex(null);
  };

  // Save Order Cancellation
  const handleSaveCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    if (cancelTargetIndex === null) return;

    const list = [...(db.repuestos_solicitados || [])];
    const order = list[cancelTargetIndex];
    if (!order) return;

    const prevStatus = order.estado;
    order.estado = "CANCELADO";
    order.devolucion_motivo = cancelMotivo;
    order.devolucion_obs = cancelObs;

    let tempDb: DatabaseState = {
      ...db,
      repuestos_solicitados: list,
    };

    tempDb = registrarEvento(
      tempDb,
      user,
      "PEDIDOS Y PRODUCTOS SOLICITADOS",
      "Cancelación Pedido",
      "AMARILLA",
      "estado",
      prevStatus,
      "CANCELADO",
      `Cancelación pedido ${order.referencia}. Motivo: ${cancelMotivo}`
    );

    setDb(tempDb);
    setShowCancelModal(false);
    setCancelTargetIndex(null);
  };

  // Filter List Logic
  const filteredOrders = (db.repuestos_solicitados || []).filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (item.producto || "").toLowerCase().includes(term) ||
      (item.referencia || "").toLowerCase().includes(term) ||
      (item.nombre || "").toLowerCase().includes(term) ||
      (item.apellidos || "").toLowerCase().includes(term) ||
      (item.telefono || "").toLowerCase().includes(term) ||
      (item.moto || "").toLowerCase().includes(term) ||
      (item.recibo || "").toLowerCase().includes(term) ||
      (item.documento || "").toLowerCase().includes(term);

    const matchesRazon = filterRazon === "TODAS" || item.razon === filterRazon;

    const matchesEstado = filterEstado === "TODOS" || item.estado === filterEstado;

    const matchesFechaInicio = !filterFechaInicio || item.fecha >= filterFechaInicio;
    const matchesFechaFin = !filterFechaFin || item.fecha <= filterFechaFin;

    return matchesSearch && matchesRazon && matchesEstado && matchesFechaInicio && matchesFechaFin;
  });

  // Calculate Statistics & KPIs
  const totalPedidosCount = filteredOrders.length;
  const pendientesCount = filteredOrders.filter((o) => o.estado === "PENDIENTE").length;
  const encargadosCount = filteredOrders.filter((o) => o.estado === "ENCARGADO" || o.estado === "SOLICITADO" || o.estado === "EN CAMINO").length;
  const recibidosCount = filteredOrders.filter((o) => o.estado === "RECIBIDO" || o.estado === "DISPONIBLE").length;
  const entregadosCount = filteredOrders.filter((o) => o.estado === "ENTREGADO").length;
  const canceladosCount = filteredOrders.filter((o) => o.estado === "CANCELADO").length;

  const totalValorSolicitado = filteredOrders.reduce((acc, o) => acc + (o.valor || 0), 0);
  const totalAbonosRecibidos = filteredOrders.reduce(
    (acc, o) => acc + (o.abono_efectivo || 0) + (o.abono_transferencia || 0),
    0
  );
  const totalDeudaPendiente = filteredOrders.reduce((acc, o) => {
    const totalAbono = (o.abono_efectivo || 0) + (o.abono_transferencia || 0);
    return acc + Math.max(0, (o.valor || 0) - totalAbono);
  }, 0);

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded tracking-widest uppercase">
              Hoja Maestra ERP
            </span>
            <h2 className="font-extrabold text-xl text-white tracking-tight">
              PEDIDOS Y PRODUCTOS SOLICITADOS
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Módulo oficial de trazabilidad para encargos, faltantes de inventario ("NO HAY"), abonos (Efectivo/Transferencia) y control del ciclo del pedido desde la solicitud hasta la entrega final o cancelación.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingIndex(null);
            setShowFormModal(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>+ Registrar Solicitud / Encargo</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pedidos</p>
          <p className="text-lg font-black text-slate-800 font-mono mt-0.5">{totalPedidosCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">Registros en hoja</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pendientes</p>
          <p className="text-lg font-black text-amber-700 font-mono mt-0.5">{pendientesCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Sin encargar aún</span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Encargados</p>
          <p className="text-lg font-black text-blue-700 font-mono mt-0.5">{encargadosCount}</p>
          <span className="text-[10px] text-blue-600 font-medium">En gestión con proveedor</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Recibidos / Listos</p>
          <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">{recibidosCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Disponibles para entrega</span>
        </div>

        <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Entregados</p>
          <p className="text-lg font-black text-slate-800 font-mono mt-0.5">{entregadosCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Proceso finalizado</span>
        </div>

        <div className="bg-emerald-100/60 border border-emerald-300 p-3.5 rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Total Abonos</p>
          <p className="text-base font-black text-emerald-800 font-mono mt-0.5">${totalAbonosRecibidos.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Efectivo + Transf.</span>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Deuda Pendiente</p>
          <p className="text-base font-black text-rose-700 font-mono mt-0.5">${totalDeudaPendiente.toLocaleString()}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Por cobrar</span>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Main search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Buscar por cliente, referencia, producto, teléfono, recibo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Razón filter */}
          <div>
            <select
              value={filterRazon}
              onChange={(e) => setFilterRazon(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
            >
              <option value="TODAS">Razón: TODAS</option>
              <option value="NO HAY">Razón: NO HAY</option>
              <option value="ENCARGO">Razón: ENCARGO</option>
            </select>
          </div>

          {/* Estado filter */}
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
            >
              <option value="TODOS">Estado: TODOS</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="ENCARGADO">ENCARGADO</option>
              <option value="RECIBIDO">RECIBIDO</option>
              <option value="ENTREGADO">ENTREGADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex gap-1.5 items-center">
            <input
              type="date"
              value={filterFechaInicio}
              onChange={(e) => setFilterFechaInicio(e.target.value)}
              className="w-1/2 bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-700"
              title="Fecha Inicio"
            />
            <span className="text-slate-400 font-bold text-xs">-</span>
            <input
              type="date"
              value={filterFechaFin}
              onChange={(e) => setFilterFechaFin(e.target.value)}
              className="w-1/2 bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-700"
              title="Fecha Fin"
            />
          </div>
        </div>
      </div>

      {/* Official Excel 15-Column Table (A - O) */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="bg-slate-900 px-4 py-2.5 flex justify-between items-center text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider">
          <span className="flex items-center space-x-2">
            <FileSpreadsheet size={13} className="text-red-500" />
            <span>ESTRUCTURA OFICIAL EXCEL (COLUMNAS A - O)</span>
          </span>
          <span>FILA 2: ENCABEZADOS | FILA 3+: REGISTROS ({filteredOrders.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3 text-center border-r border-slate-700">A - FECHA</th>
                <th className="p-3 text-center border-r border-slate-700">B - RAZÓN</th>
                <th className="p-3 text-center border-r border-slate-700">C - CANT.</th>
                <th className="p-3 border-r border-slate-700">D - MOTO</th>
                <th className="p-3 border-r border-slate-700">E - REFERENCIA</th>
                <th className="p-3 border-r border-slate-700">F - PRODUCTO</th>
                <th className="p-3 border-r border-slate-700">G - NOMBRE</th>
                <th className="p-3 border-r border-slate-700">H - APELLIDOS</th>
                <th className="p-3 border-r border-slate-700">I - TELÉFONO</th>
                <th className="p-3 text-right border-r border-slate-700">J - VALOR</th>
                <th className="p-3 text-right border-r border-slate-700">K - ABONO (EFECTIVO)</th>
                <th className="p-3 text-right border-r border-slate-700">L - ABONO (TRANSF.)</th>
                <th className="p-3 text-center border-r border-slate-700">M - RECIBO</th>
                <th className="p-3 text-right border-r border-slate-700">N - DEUDA</th>
                <th className="p-3 text-center border-r border-slate-700">O - ESTADO</th>
                <th className="p-3 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((item, idx) => {
                  const totalAbono = (item.abono_efectivo || 0) + (item.abono_transferencia || 0);
                  const deudaCalc = Math.max(0, (item.valor || 0) - totalAbono);
                  const isExpanded = expandedRowIndex === idx;

                  return (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-600 whitespace-nowrap">{item.fecha}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              item.razon === "NO HAY" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {item.razon}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">{item.cantidad}</td>
                        <td className="p-3 text-slate-600 whitespace-nowrap font-medium">{item.moto || "Generica"}</td>
                        <td className="p-3 font-mono font-bold text-red-600 whitespace-nowrap">{item.referencia}</td>
                        <td className="p-3 font-semibold text-slate-800">{item.producto}</td>
                        <td className="p-3 font-medium text-slate-800">{item.nombre}</td>
                        <td className="p-3 text-slate-600">{item.apellidos}</td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{item.telefono}</td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                          ${(item.valor || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                          ${(item.abono_efectivo || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-blue-700 font-semibold">
                          ${(item.abono_transferencia || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-red-600 whitespace-nowrap">
                          {item.recibo || "N/A"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold bg-slate-50/50">
                          <span className={deudaCalc > 0 ? "text-rose-600" : "text-emerald-600"}>
                            ${deudaCalc.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              item.estado === "PENDIENTE"
                                ? "bg-amber-100 text-amber-800"
                                : item.estado === "ENCARGADO" || item.estado === "SOLICITADO" || item.estado === "EN CAMINO"
                                ? "bg-blue-100 text-blue-800"
                                : item.estado === "RECIBIDO" || item.estado === "DISPONIBLE"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.estado === "ENTREGADO"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {item.estado}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Workflow status advance buttons */}
                            {item.estado === "PENDIENTE" && (
                              <button
                                onClick={() => handleUpdateStatus(idx, "ENCARGADO")}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] px-2 py-1 rounded uppercase cursor-pointer"
                                title="Marcar como ENCARGADO con proveedor"
                              >
                                Encargar
                              </button>
                            )}

                            {(item.estado === "ENCARGADO" || item.estado === "SOLICITADO" || item.estado === "EN CAMINO") && (
                              <button
                                onClick={() => handleUpdateStatus(idx, "RECIBIDO")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded uppercase cursor-pointer"
                                title="Marcar como RECIBIDO en tienda"
                              >
                                Recibido
                              </button>
                            )}

                            {(item.estado === "RECIBIDO" || item.estado === "DISPONIBLE") && (
                              <button
                                onClick={() => handleUpdateStatus(idx, "ENTREGADO")}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] px-2 py-1 rounded uppercase cursor-pointer"
                                title="Entregar a cliente"
                              >
                                Entregar
                              </button>
                            )}

                            {/* Add Abono button if debt exists & not cancelled */}
                            {item.estado !== "CANCELADO" && item.estado !== "ENTREGADO" && deudaCalc > 0 && (
                              <button
                                onClick={() => {
                                  setAbonoTargetIndex(idx);
                                  setAbonoValor(deudaCalc);
                                  setAbonoForma("Efectivo");
                                  setAbonoRecibo("");
                                  setAbonoObs("");
                                  setAbonoFecha(getTodayDateString());
                                  setShowAbonoModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded uppercase cursor-pointer"
                                title="Registrar nuevo Abono"
                              >
                                + Abono
                              </button>
                            )}

                            {/* History Toggle */}
                            {(item.abonos_historial && item.abonos_historial.length > 0) && (
                              <button
                                onClick={() => setExpandedRowIndex(isExpanded ? null : idx)}
                                className="text-slate-500 hover:text-slate-800 font-bold p-1 hover:bg-slate-100 rounded"
                                title="Ver historial de abonos"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => openEditForm(idx, item)}
                              className="text-slate-500 hover:text-slate-800 font-bold p-1 hover:bg-slate-100 rounded"
                              title="Editar Pedido"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Cancel */}
                            {item.estado !== "CANCELADO" && item.estado !== "ENTREGADO" && (
                              <button
                                onClick={() => {
                                  setCancelTargetIndex(idx);
                                  setCancelMotivo("Cancelación voluntaria del cliente");
                                  setCancelObs("");
                                  setShowCancelModal(true);
                                }}
                                className="text-rose-500 hover:text-rose-700 font-bold p-1 hover:bg-rose-50 rounded"
                                title="Cancelar Pedido"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Payment History Sub-row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={16} className="p-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1">
                                  <DollarSign size={14} className="text-emerald-600" />
                                  <span>Historial de Movimientos de Pago / Abonos</span>
                                </h4>
                                <span className="text-[10px] font-bold text-slate-500">
                                  Total Abonado: ${(totalAbono).toLocaleString()}
                                </span>
                              </div>
                              <div className="divide-y divide-slate-100 text-[11px]">
                                {item.abonos_historial?.map((ab, aIdx) => (
                                  <div key={aIdx} className="py-2 grid grid-cols-5 gap-3 items-center">
                                    <div>
                                      <span className="block text-[10px] text-slate-400 font-semibold">Fecha</span>
                                      <span className="font-mono text-slate-700">{ab.fecha}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] text-slate-400 font-semibold">Monto</span>
                                      <span className="font-mono font-bold text-emerald-600">${ab.valor.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] text-slate-400 font-semibold">Forma de Pago</span>
                                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 uppercase">
                                        {ab.forma_pago}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] text-slate-400 font-semibold">N° Recibo</span>
                                      <span className="font-mono font-bold text-red-600">{ab.numero_recibo}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] text-slate-400 font-semibold">Registrado por</span>
                                      <span className="text-slate-600 font-medium">{ab.usuario}</span>
                                      {ab.observaciones && (
                                        <p className="text-[9px] text-slate-400 italic mt-0.5">{ab.observaciones}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={16} className="text-center p-10 text-slate-400 italic">
                    No hay registros de pedidos o productos solicitados que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: CREATE / EDIT ORDER */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <form
            onSubmit={handleSaveOrder}
            className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base uppercase tracking-tight">
                  {editingIndex !== null ? "Editar Pedido / Producto Solicitado" : "Registrar Nuevo Pedido / Encargo de Cliente"}
                </h3>
                <p className="text-xs text-slate-500">Mapeo oficial ERP con Inventario y Perfil Clientes.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold p-1 rounded"
              >
                Cerrar (X)
              </button>
            </div>

            {/* SECTION 1: PRODUCT BUSCADOR INTELIGENTE */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                <ShoppingBag size={14} className="text-red-600" />
                <span>1. Buscador Inteligente de Productos en Inventario</span>
              </h4>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Escriba la referencia o nombre del repuesto (Ej: 'filtr', 'REP-001')..."
                  value={prodSearchQuery}
                  onChange={(e) => {
                    setProdSearchQuery(e.target.value);
                    setShowProdSearchResults(true);
                  }}
                  onFocus={() => setShowProdSearchResults(true)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />

                {showProdSearchResults && prodSearchQuery.trim().length > 0 && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-100 z-20 relative">
                    {stockInventory
                      .filter(
                        (item) =>
                          item.referencia.toLowerCase().includes(prodSearchQuery.toLowerCase()) ||
                          item.producto.toLowerCase().includes(prodSearchQuery.toLowerCase())
                      )
                      .slice(0, 8)
                      .map((item, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => {
                            setFormReferencia(item.referencia);
                            setFormProducto(item.producto);
                            setFormMoto(item.marca_departamento || "");
                            const valTotal = item.precio_venta * formCantidad;
                            setFormValor(valTotal);
                            setProdSearchQuery("");
                            setShowProdSearchResults(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-mono font-bold text-red-600 mr-2">{item.referencia}</span>
                            <span className="font-semibold text-slate-800">{item.producto}</span>
                            {item.marca_departamento && (
                              <span className="text-[10px] text-slate-400 ml-2">({item.marca_departamento})</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold mr-2 text-slate-600">
                              Stock: {item.stock}
                            </span>
                            <span className="font-mono font-bold text-slate-900">${item.precio_venta.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    {stockInventory.filter(
                      (item) =>
                        item.referencia.toLowerCase().includes(prodSearchQuery.toLowerCase()) ||
                        item.producto.toLowerCase().includes(prodSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-center text-slate-400 text-xs italic">
                        No hay coincidencias en inventario actual. Puede ingresar los datos del producto manualmente abajo.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Razón *</label>
                  <select
                    value={formRazon}
                    onChange={(e: any) => setFormRazon(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-red-600"
                  >
                    <option value="NO HAY">NO HAY (Agotado)</option>
                    <option value="ENCARGO">ENCARGO (Especial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Referencia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: REP-005"
                    value={formReferencia}
                    onChange={(e) => setFormReferencia(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-red-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Filtro de aceite Tornado 250"
                    value={formProducto}
                    onChange={(e) => setFormProducto(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Moto / Aplicación</label>
                  <input
                    type="text"
                    placeholder="Ej: Honda XRE 190"
                    value={formMoto}
                    onChange={(e) => setFormMoto(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formCantidad}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      setFormCantidad(qty);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Valor Total Pedido ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formValor || ""}
                    onChange={(e) => setFormValor(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CLIENT MAPPER / PERFIL CLIENTES */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                <User size={14} className="text-red-600" />
                <span>2. Información del Cliente (Mapeo con Perfil Clientes)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cédula / Documento</label>
                  <input
                    type="text"
                    placeholder="Escriba documento..."
                    value={formDocumento}
                    onChange={(e) => handleClientDocLookup(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombres"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Apellidos</label>
                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={formApellidos}
                    onChange={(e) => setFormApellidos(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Teléfono Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="Celular contacto"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {clientLookupNotice && (
                <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  {clientLookupNotice}
                </p>
              )}
            </div>

            {/* SECTION 3: ABONOS & DEUDA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                <DollarSign size={14} className="text-emerald-600" />
                <span>3. Abonos Económicos y Control de Deuda</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Abono Efectivo ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formAbonoEfectivo || ""}
                    onChange={(e) => setFormAbonoEfectivo(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Abono Transferencia ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formAbonoTransferencia || ""}
                    onChange={(e) => setFormAbonoTransferencia(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">N° Recibo Caja</label>
                  <input
                    type="text"
                    placeholder="Ej: REC-1002"
                    value={formRecibo}
                    onChange={(e) => setFormRecibo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Deuda Restante ($)</label>
                  <div className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-black text-rose-600 text-right">
                    ${Math.max(0, formValor - (formAbonoEfectivo + formAbonoTransferencia)).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Estado Inicial del Pedido</label>
                <select
                  value={formEstado}
                  onChange={(e: any) => setFormEstado(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="PENDIENTE">PENDIENTE (Solicitud ingresada)</option>
                  <option value="ENCARGADO">ENCARGADO (Pedido a proveedor en camino)</option>
                  <option value="RECIBIDO">RECIBIDO (Producto en tienda listo para entrega)</option>
                  <option value="ENTREGADO">ENTREGADO (Proceso finalizado)</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
              >
                Guardar Pedido
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ABONO MODAL */}
      {showAbonoModal && abonoTargetIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <form
            onSubmit={handleSaveAbono}
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                Registrar Nuevo Abono a Pedido
              </h3>
              <p className="text-xs text-slate-500">
                Se actualizará la deuda del cliente y se emitirá el recibo oficial de caja.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Monto del Abono ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={abonoValor || ""}
                  onChange={(e) => setAbonoValor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-emerald-700 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Medio de Pago *</label>
                <select
                  value={abonoForma}
                  onChange={(e: any) => setAbonoForma(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                >
                  <option value="Efectivo">Efectivo (Ingresa a Caja)</option>
                  <option value="Transferencia">Transferencia (Cuenta Bancaria)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Número de Recibo</label>
                <input
                  type="text"
                  placeholder="Ej: REC-2045"
                  value={abonoRecibo}
                  onChange={(e) => setAbonoRecibo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-red-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="Observaciones adicionales..."
                  value={abonoObs}
                  onChange={(e) => setAbonoObs(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAbonoModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
              >
                Confirmar Abono
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {showCancelModal && cancelTargetIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <form
            onSubmit={handleSaveCancellation}
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="border-b pb-3">
              <h3 className="font-bold text-rose-600 text-sm uppercase tracking-tight">
                Registrar Cancelación de Pedido
              </h3>
              <p className="text-xs text-slate-500">
                El pedido pasará a estado CANCELADO sin borrar el registro histórico.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Motivo de Cancelación *</label>
                <select
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-rose-700"
                >
                  <option value="Cancelación voluntaria del cliente">Cancelación voluntaria del cliente</option>
                  <option value="No disponibilidad en mercado">No disponibilidad en mercado</option>
                  <option value="Inconformidad en tiempo de entrega">Inconformidad en tiempo de entrega</option>
                  <option value="Garantía o defecto">Garantía o defecto</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Observaciones / Detalles</label>
                <textarea
                  rows={3}
                  value={cancelObs}
                  onChange={(e) => setCancelObs(e.target.value)}
                  placeholder="Escriba los detalles de la cancelación..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg"
              >
                Procesar Cancelación
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
