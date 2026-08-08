import React, { useState } from "react";
import { Plus, Search, Calendar, ChevronLeft, ShoppingCart, Ban, ShoppingBag, ArrowRight, BarChart3, AlertTriangle, FileCheck, CheckCircle2, Printer, UserPlus, FileText } from "lucide-react";
import { DatabaseState, Usuario, LlegadaRepuesto, SalidaRepuesto, RepuestoSolicitado, Recibo, Transferencia } from "../types";
import { calcularInventarioGeneral, StockItem, getTodayDateString, registrarEvento, registrarTransferencia } from "../utils/db";
import ModuloPedidosSolicitados from "./ModuloPedidosSolicitados";
import ModalCrearCliente from "./ModalCrearCliente";

interface RepuestosProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
}

interface POSTicket {
  id: string;
  customer: string;
  items: { reference: string; quantity: number }[];
  paymentType: "Efectivo" | "Transferencia" | "Mixto";
  efectivo: number;
  transferencia: number;
}

export default function ModuloRepuestos({ user, db, setDb }: RepuestosProps) {
  const pendingArrivals = db.llegada_de_repuestos.filter((l) => l.confirmacion_de_llegada === "PENDIENTE");
  const [activeTab, setActiveTab] = useState<"entradas_repuestos" | "salida_repuestos" | "inventario" | "pos" | "pedidos">(
    pendingArrivals.length > 0 ? "entradas_repuestos" : "inventario"
  );
  const [entradasSubTab, setEntradasSubTab] = useState<"pendientes" | "manual">("pendientes");
  const [pedidosSubTab, setPedidosSubTab] = useState<"agotados" | "realizados">("agotados");

  // States for SALIDA DE REPUESTOS module
  const [salidaSearchTerm, setSalidaSearchTerm] = useState("");
  const [salidaFilterForma, setSalidaFilterForma] = useState("TODAS");
  const [salidaFilterMarca, setSalidaFilterMarca] = useState("TODAS");
  const [salidaFilterFechaInicio, setSalidaFilterFechaInicio] = useState("");
  const [salidaFilterFechaFin, setSalidaFilterFechaFin] = useState("");

  const [showManualSalidaModal, setShowManualSalidaModal] = useState(false);
  const [manualSalidaFecha, setManualSalidaFecha] = useState(getTodayDateString());
  const [manualSalidaRef, setManualSalidaRef] = useState("");
  const [manualSalidaProd, setManualSalidaProd] = useState("");
  const [manualSalidaMarca, setManualSalidaMarca] = useState("Honda");
  const [manualSalidaQty, setManualSalidaQty] = useState(1);
  const [manualSalidaPrecio, setManualSalidaPrecio] = useState(0);
  const [manualSalidaForma, setManualSalidaForma] = useState<"Efectivo" | "Transferencia" | "Mixto">("Efectivo");
  const [manualSalidaEfectivo, setManualSalidaEfectivo] = useState(0);
  const [manualSalidaTransferencia, setManualSalidaTransferencia] = useState(0);
  const [manualSalidaProductSearch, setManualSalidaProductSearch] = useState("");

  // New States for Abonos & Devoluciones in Pedidos Realizados (repuestos_solicitados)
  const [showPedidoAbonoModal, setShowPedidoAbonoModal] = useState(false);
  const [pedidoAbonoIdx, setPedidoAbonoIdx] = useState<number | null>(null);
  const [pedidoAbonoValor, setPedidoAbonoValor] = useState(0);
  const [pedidoAbonoForma, setPedidoAbonoForma] = useState<"Efectivo" | "Transferencia">("Efectivo");
  const [pedidoAbonoObs, setPedidoAbonoObs] = useState("");
  const [pedidoAbonoRecibo, setPedidoAbonoRecibo] = useState("");
  const [pedidoAbonoFecha, setPedidoAbonoFecha] = useState(getTodayDateString());
  const [expandedPedidoIdx, setExpandedPedidoIdx] = useState<number | null>(null);

  const [showPedidoDevolucionModal, setShowPedidoDevolucionModal] = useState(false);
  const [pedidoDevolucionIdx, setPedidoDevolucionIdx] = useState<number | null>(null);
  const [pedidoDevolucionMotivo, setPedidoDevolucionMotivo] = useState("");
  const [pedidoDevolucionObs, setPedidoDevolucionObs] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddLlegadaForm, setShowLlegadaForm] = useState(false);
  const [showAddSolicitadoForm, setShowSolicitadoForm] = useState(false);
  const [editingArrivalIndex, setEditingArrivalIndex] = useState<number | null>(null);

  // Brand Filter for Inventario
  const [filterMarca, setFilterMarca] = useState("TODAS");

  // Multiple Tickets POS states
  const [tickets, setTickets] = useState<POSTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const activeTicket = tickets.find((t) => t.id === activeTicketId);

  const handleCreateNewTicket = () => {
    const newId = `ticket-${Date.now()}`;
    const nextNum = tickets.length + 1;
    const newTicket: POSTicket = {
      id: newId,
      customer: `Ticket #${nextNum}`,
      items: [],
      paymentType: "Efectivo",
      efectivo: 0,
      transferencia: 0
    };
    setTickets(prev => [...prev, newTicket]);
    setActiveTicketId(newId);
  };

  const updateActiveTicket = (updatedFields: Partial<POSTicket>) => {
    if (!activeTicketId) return;
    setTickets(prev => prev.map((t) => t.id === activeTicketId ? { ...t, ...updatedFields } : t));
  };

  const cartCustomer = activeTicket ? activeTicket.customer : "";
  const cartItems = activeTicket ? activeTicket.items : [];
  const posPaymentType = activeTicket ? activeTicket.paymentType : "Efectivo";
  const posEfectivo = activeTicket ? activeTicket.efectivo : 0;
  const posTransferencia = activeTicket ? activeTicket.transferencia : 0;
  const showCartForm = tickets.length > 0 && activeTicketId !== null;

  const setCartCustomer = (val: string) => updateActiveTicket({ customer: val });
  const setCartCartItems = (val: any) => {
    if (typeof val === "function") {
      updateActiveTicket({ items: val(cartItems) });
    } else {
      updateActiveTicket({ items: val });
    }
  };
  const setPosPaymentType = (val: "Efectivo" | "Transferencia" | "Mixto") => updateActiveTicket({ paymentType: val });
  const setPosEfectivo = (val: any) => {
    if (typeof val === "function") {
      updateActiveTicket({ efectivo: val(posEfectivo) });
    } else {
      updateActiveTicket({ efectivo: val });
    }
  };
  const setPosTransferencia = (val: any) => {
    if (typeof val === "function") {
      updateActiveTicket({ transferencia: val(posTransferencia) });
    } else {
      updateActiveTicket({ transferencia: val });
    }
  };
  const setShowCartForm = (val: boolean) => {
    if (!val) {
      if (activeTicketId) {
        setTickets(prev => prev.filter(t => t.id !== activeTicketId));
        setActiveTicketId(prev => {
          const remaining = tickets.filter(t => t.id !== activeTicketId);
          return remaining.length > 0 ? remaining[0].id : null;
        });
      }
    } else {
      if (tickets.length === 0) {
        handleCreateNewTicket();
      }
    }
  };

  // Client Modal & Thermal Printer states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [thermalReceiptData, setThermalReceiptData] = useState<{
    ticketNo: string;
    fecha: string;
    cliente: string;
    items: { producto: string; cantidad: number; precio: number; subtotal: number }[];
    total: number;
    formaPago: string;
    efectivo: number;
    transferencia: number;
    cajero: string;
  } | null>(null);

  // Abonos state for Provider/Supplier
  const [showAbonarModal, setShowAbonarModal] = useState(false);
  const [abonarIdx, setAbonarIdx] = useState<number | null>(null);
  const [abonoFecha, setAboFecha] = useState(getTodayDateString());
  const [abonoValor, setAboValor] = useState(0);
  const [abonoForma, setAboForma] = useState("Efectivo");
  const [abonoObs, setAboObs] = useState("");

  // Devolución state for Provider/Supplier
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devolucionIdx, setDevolucionIdx] = useState<number | null>(null);
  const [devProd, setDevProd] = useState("");
  const [devQty, setDevQty] = useState(1);
  const [devMotivo, setDevMotivo] = useState("");
  const [devObs, setDevObs] = useState("");

  // Form Arrivals States
  const [arrFecha, setArrFecha] = useState(getTodayDateString());
  const [arrRef, setArrRef] = useState("");
  const [arrName, setArrName] = useState("");
  const [arrTipoMoto, setArrTipoMoto] = useState("Universal / General");
  const [arrDept, setArrDept] = useState("Honda");
  const [arrQty, setArrQty] = useState(1);
  const [arrPrice, setArrPrice] = useState(0);
  const [arrArrivalState, setArrArrivalState] = useState<"CONFIRMADA" | "NO CONFIRMADA" | "CON NOVEDAD" | "PENDIENTE">("PENDIENTE");

  // Llegadas Filters States
  const [llegadaSearchTerm, setLlegadaSearchTerm] = useState("");
  const [llegadaFilterEstado, setLlegadaFilterEstado] = useState("TODAS");
  const [llegadaFilterMarca, setLlegadaFilterMarca] = useState("TODAS");
  const [llegadaFilterFechaInicio, setLlegadaFilterFechaInicio] = useState("");
  const [llegadaFilterFechaFin, setLlegadaFilterFechaFin] = useState("");

  // Form Solicited backorder states
  const [solRef, setSolRef] = useState("");
  const [solName, setSolName] = useState("");
  const [solQty, setSolQty] = useState(1);
  const [solMoto, setSolMoto] = useState("");
  const [solDoc, setSolDoc] = useState("");
  const [solClientName, setSolClientName] = useState("");
  const [solClientLastname, setSolClientLastname] = useState("");
  const [solPhone, setSolPhone] = useState("");
  const [solVal, setSolVal] = useState(0);
  const [solAbonoEf, setSolAbonoEf] = useState(0);
  const [solAbonoTr, setSolAbonoTr] = useState(0);

  const stockList = calcularInventarioGeneral(db);
  const outOfStockItems = stockList.filter((item) => item.stock === 0 || item.stock <= 3);

  // Auto-completes part name if reference is entered in arrivals or backorders
  const handleRefAutocomplete = (
    refVal: string,
    setName: (n: string) => void,
    setPrice?: (p: number) => void,
    setDept?: (d: string) => void,
    setTipoMoto?: (m: string) => void
  ) => {
    const existing = stockList.find((s) => s.referencia.toLowerCase() === refVal.toLowerCase());
    if (existing) {
      setName(existing.producto);
      if (setPrice) setPrice(existing.precio_venta);
      if (setDept) setDept(existing.marca_departamento);
      if (setTipoMoto) setTipoMoto(existing.tipo_moto || "Universal / General");
    }
  };

  const handleSolicitarPedido = (item: StockItem) => {
    const qtyStr = prompt(`¿Cuántas unidades de "${item.producto}" (Ref: ${item.referencia}) desea solicitar al Administrador?`, "5");
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr) || 1;
    if (qty <= 0) {
      alert("La cantidad debe ser mayor a cero.");
      return;
    }

    const newRequest = {
      fecha: getTodayDateString(),
      razon: "NO HAY" as const,
      cantidad: qty,
      moto: "General (Inventario Sede)",
      referencia: item.referencia,
      producto: item.producto,
      documento: "ADMIN",
      nombre: "Solicitud",
      apellidos: "Automática (Stock Bajo)",
      telefono: "N/A",
      valor: item.precio_venta * qty,
      abono_efectivo: 0,
      abono_transferencia: 0,
      recibo: "",
      estado: "PENDIENTE" as const
    };

    let updatedDb = {
      ...db,
      repuestos_solicitados: [newRequest, ...db.repuestos_solicitados]
    };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "INVENTARIO",
      "Solicitud de Repuesto",
      "AMARILLA",
      "RepuestoSolicitado",
      "",
      item.referencia,
      `Se generó una solicitud automática de pedido de ${qty} unidades de "${item.producto}" (Ref: ${item.referencia}) al Administrador debido a bajo stock.`
    );

    setDb(updatedDb);
    alert(`Solicitud de ${qty} unidades de "${item.producto}" enviada al Administrador con éxito.`);
  };

  // Add/Edit Arrivals
  const handleSaveArrival = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.rol !== "Administrador") {
      alert("Solo el Administrador puede ingresar o modificar llegadas de repuestos.");
      return;
    }
    if (!arrRef || !arrName || arrQty <= 0 || arrPrice <= 0) {
      alert("Por favor complete todos los datos requeridos (Referencia, Producto, Cantidad mayor a 0 y Precio mayor a 0)");
      return;
    }

    if (editingArrivalIndex !== null) {
      const original = db.llegada_de_repuestos[editingArrivalIndex];
      const editedArrival: LlegadaRepuesto = {
        fecha: arrFecha || original.fecha,
        referencia: arrRef,
        producto: arrName,
        tipo_moto: arrTipoMoto || "Universal / General",
        marca_departamento: arrDept,
        cantidad: arrQty,
        precio_venta: arrPrice,
        valor_total: arrQty * arrPrice,
        confirmacion_de_llegada: arrArrivalState
      };

      let updatedLlegadas = [...db.llegada_de_repuestos];
      updatedLlegadas[editingArrivalIndex] = editedArrival;

      let updatedDb = { ...db, llegada_de_repuestos: updatedLlegadas };

      // Automation if confirmed and there are pending backorders
      if (arrArrivalState === "CONFIRMADA" && original.confirmacion_de_llegada !== "CONFIRMADA") {
        const pendingBackorders = db.repuestos_solicitados.filter(
          (s) => s.referencia === arrRef && s.estado === "PENDIENTE"
        );
        if (pendingBackorders.length > 0) {
          alert(`¡ATENCIÓN! Se encontraron ${pendingBackorders.length} pedidos pendientes de clientes para este repuesto. Serán notificados y actualizados a estado "DISPONIBLE".`);
          updatedDb.repuestos_solicitados = updatedDb.repuestos_solicitados.map((s) => {
            if (s.referencia === arrRef && s.estado === "PENDIENTE") {
              return { ...s, estado: "DISPONIBLE" as const };
            }
            return s;
          });
        }
      }

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "LLEGADA DE REPUESTOS",
        "Editar",
        "AMARILLA",
        "Modificación",
        original.referencia,
        arrRef,
        `Se editó el ingreso de inventario del repuesto ${arrName} (Ref: ${arrRef}).`
      );

      setDb(updatedDb);
      setEditingArrivalIndex(null);
      setShowLlegadaForm(false);
      // Reset
      setArrFecha(getTodayDateString());
      setArrRef("");
      setArrName("");
      setArrTipoMoto("Universal / General");
      setArrQty(1);
      setArrPrice(0);
      setArrArrivalState("PENDIENTE");
      alert("Ingreso de repuesto editado exitosamente.");
      return;
    }

    const newArrival: LlegadaRepuesto = {
      fecha: arrFecha || getTodayDateString(),
      referencia: arrRef,
      producto: arrName,
      tipo_moto: arrTipoMoto || "Universal / General",
      marca_departamento: arrDept,
      cantidad: arrQty,
      precio_venta: arrPrice,
      valor_total: arrQty * arrPrice,
      confirmacion_de_llegada: arrArrivalState
    };

    let updatedDb = { ...db, llegada_de_repuestos: [newArrival, ...db.llegada_de_repuestos] };

    // Automatization: When a product arrives, search if there are matching pending special backorders
    const pendingBackorders = db.repuestos_solicitados.filter(
      (s) => s.referencia === arrRef && s.estado === "PENDIENTE"
    );

    if (pendingBackorders.length > 0 && arrArrivalState === "CONFIRMADA") {
      alert(`¡ATENCIÓN! Se encontraron ${pendingBackorders.length} pedidos pendientes de clientes para este repuesto. Serán notificados y actualizados a estado "DISPONIBLE".`);
      
      updatedDb.repuestos_solicitados = updatedDb.repuestos_solicitados.map((s) => {
        if (s.referencia === arrRef && s.estado === "PENDIENTE") {
          return { ...s, estado: "DISPONIBLE" as const };
        }
        return s;
      });
    }

    // Trigger Novelty Red alert
    const isNovelty = arrArrivalState === "CON NOVEDAD";
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "LLEGADA DE REPUESTOS",
      "Crear",
      isNovelty ? "ROJA" : "AMARILLA",
      "Confirmación",
      "",
      arrArrivalState,
      `Ingreso de inventario: ${arrQty} unidades de ${arrName} (Ref: ${arrRef}).` + (isNovelty ? " ¡REPORTE CON NOVEDAD!" : "")
    );

    setDb(updatedDb);
    setShowLlegadaForm(false);
    // Reset
    setArrFecha(getTodayDateString());
    setArrRef("");
    setArrName("");
    setArrTipoMoto("Universal / General");
    setArrQty(1);
    setArrPrice(0);
    setArrArrivalState("PENDIENTE");
    alert("Llegada de inventario registrada con éxito.");
  };

  const handleConfirmarRecepcionFisica = (idx: number) => {
    const original = db.llegada_de_repuestos[idx];
    const updated: LlegadaRepuesto = {
      ...original,
      confirmacion_de_llegada: "CONFIRMADA"
    };

    let updatedLlegadas = [...db.llegada_de_repuestos];
    updatedLlegadas[idx] = updated;

    let updatedDb = { ...db, llegada_de_repuestos: updatedLlegadas };

    // Trigger backlog check if pending
    const pendingBackorders = db.repuestos_solicitados.filter(
      (s) => s.referencia === original.referencia && s.estado === "PENDIENTE"
    );
    if (pendingBackorders.length > 0) {
      alert(`¡ATENCIÓN! Se encontraron ${pendingBackorders.length} pedidos pendientes de clientes para este repuesto. Serán notificados y actualizados a estado "DISPONIBLE".`);
      updatedDb.repuestos_solicitados = updatedDb.repuestos_solicitados.map((s) => {
        if (s.referencia === original.referencia && s.estado === "PENDIENTE") {
          return { ...s, estado: "DISPONIBLE" as const };
        }
        return s;
      });
    }

    // Register Event in Auditoria
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "AUDITORIA_Y_VERIFICACION",
      "Verificación Física",
      "VERDE",
      "Confirmación",
      original.referencia,
      `Cantidad: ${original.cantidad}`,
      `Se verificó físicamente el ingreso de ${original.cantidad} unidades del repuesto ${original.producto} (Ref: ${original.referencia}). Estado de recepción: CONFIRMADA.`
    );

    setDb(updatedDb);
    alert(`La recepción física del repuesto ${original.producto} ha sido VERIFICADA y CONFIRMADA con éxito.`);
  };

  const handleDerogarNovedadFisica = (idx: number) => {
    const original = db.llegada_de_repuestos[idx];
    const motivo = window.prompt(
      `Escriba el motivo de la novedad o por qué se deroga la llegada de ${original.producto} (Ref: ${original.referencia}):`
    );
    if (motivo === null) return; // User cancelled
    if (!motivo.trim()) {
      alert("Debe ingresar un motivo para reportar la novedad.");
      return;
    }

    const updated: LlegadaRepuesto = {
      ...original,
      confirmacion_de_llegada: "CON NOVEDAD"
    };

    let updatedLlegadas = [...db.llegada_de_repuestos];
    updatedLlegadas[idx] = updated;

    let updatedDb = { ...db, llegada_de_repuestos: updatedLlegadas };

    // Register Event in Auditoria
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "AUDITORIA_Y_VERIFICACION",
      "Reporte de Novedad",
      "ROJA",
      "Derogación",
      original.referencia,
      `Cantidad: ${original.cantidad}`,
      `Se reportó novedad / derogación física del repuesto ${original.producto} (Ref: ${original.referencia}). Motivo de la novedad: ${motivo.trim()}.`
    );

    setDb(updatedDb);
    alert(`Novedad registrada con éxito. Se ha generado un evento de Auditoría para su posterior revisión.`);
  };

  const openEditArrival = (idx: number, item: LlegadaRepuesto) => {
    if (user.rol !== "Administrador") {
      alert("Solo el Administrador puede editar llegadas de repuestos.");
      return;
    }
    setEditingArrivalIndex(idx);
    setArrFecha(item.fecha || getTodayDateString());
    setArrRef(item.referencia);
    setArrName(item.producto);
    setArrTipoMoto(item.tipo_moto || "Universal / General");
    setArrDept(item.marca_departamento);
    setArrQty(item.cantidad);
    setArrPrice(item.precio_venta);
    setArrArrivalState(item.confirmacion_de_llegada);
    setShowLlegadaForm(true);
  };

  const handleConfirmReceipt = (idx: number, status: "CONFIRMADA" | "NO CONFIRMADA" | "CON NOVEDAD") => {
    const original = db.llegada_de_repuestos[idx];
    const updated = { ...original, confirmacion_de_llegada: status };

    let updatedLlegadas = [...db.llegada_de_repuestos];
    updatedLlegadas[idx] = updated;

    let updatedDb = { ...db, llegada_de_repuestos: updatedLlegadas };

    if (status === "CONFIRMADA") {
      const pendingBackorders = db.repuestos_solicitados.filter(
        (s) => s.referencia === original.referencia && s.estado === "PENDIENTE"
      );
      if (pendingBackorders.length > 0) {
        alert(`¡ATENCIÓN! Se encontraron ${pendingBackorders.length} pedidos pendientes de clientes para este repuesto. Serán notificados y actualizados a estado "DISPONIBLE".`);
        updatedDb.repuestos_solicitados = updatedDb.repuestos_solicitados.map((s) => {
          if (s.referencia === original.referencia && s.estado === "PENDIENTE") {
            return { ...s, estado: "DISPONIBLE" as const };
          }
          return s;
        });
      }
    }

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "LLEGADA DE REPUESTOS",
      "Confirmar Recepción",
      status === "CON NOVEDAD" ? "ROJA" : "VERDE",
      "Confirmación",
      "",
      original.referencia,
      `Se actualizó el estado de recepción de ${original.producto} (Ref: ${original.referencia}) a ${status} por el usuario ${user.nombre_completo}.`
    );

    setDb(updatedDb);
    alert(`Estado de recepción de repuesto actualizado a ${status}.`);
  };

  const handleProcessArrival = (idx: number, confirmedQty: number, note: string) => {
    const original = db.llegada_de_repuestos[idx];
    
    let finalStatus: "CONFIRMADA" | "CON NOVEDAD" = "CONFIRMADA";
    if (confirmedQty !== original.cantidad || note.trim().length > 0) {
      finalStatus = "CON NOVEDAD";
    }

    const updated: LlegadaRepuesto = {
      ...original,
      cantidad: confirmedQty,
      valor_total: confirmedQty * original.precio_venta,
      confirmacion_de_llegada: finalStatus
    };

    let updatedLlegadas = [...db.llegada_de_repuestos];
    updatedLlegadas[idx] = updated;

    let updatedDb = { ...db, llegada_de_repuestos: updatedLlegadas };

    if (finalStatus === "CONFIRMADA") {
      const pendingBackorders = db.repuestos_solicitados.filter(
        (s) => s.referencia === original.referencia && s.estado === "PENDIENTE"
      );
      if (pendingBackorders.length > 0) {
        alert(`¡ATENCIÓN! Se encontraron ${pendingBackorders.length} pedidos pendientes de clientes para este repuesto. Serán notificados y actualizados a estado "DISPONIBLE".`);
        updatedDb.repuestos_solicitados = updatedDb.repuestos_solicitados.map((s) => {
          if (s.referencia === original.referencia && s.estado === "PENDIENTE") {
            return { ...s, estado: "DISPONIBLE" as const };
          }
          return s;
        });
      }
    }

    const commentLog = `Recepción de repuestos: ${confirmedQty} unidades de ${original.producto} (Enviado original: ${original.cantidad}). ` + 
      (note.trim() ? `Novedad reportada: ${note}` : "");

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "LLEGADA DE REPUESTOS",
      "Confirmar Recepción",
      finalStatus === "CON NOVEDAD" ? "ROJA" : "VERDE",
      "Confirmación",
      `Sede Principal Envió: ${original.cantidad}`,
      `Confirmado Recibido: ${confirmedQty}`,
      commentLog
    );

    setDb(updatedDb);
    alert(`Recepción del repuesto confirmada con éxito. Unidades ingresadas al inventario: ${confirmedQty}.`);
  };

  const handleProcessArrivalNoRecibido = (idx: number) => {
    const original = db.llegada_de_repuestos[idx];
    if (!window.confirm(`¿Está seguro de rechazar la recepción del envío de ${original.producto}? Se marcará como NO CONFIRMADA y no entrará al stock.`)) {
      return;
    }

    const updated: LlegadaRepuesto = {
      ...original,
      confirmacion_de_llegada: "NO CONFIRMADA"
    };

    let updatedLlegadas = [...db.llegada_de_repuestos];
    updatedLlegadas[idx] = updated;

    let updatedDb = { ...db, llegada_de_repuestos: updatedLlegadas };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "LLEGADA DE REPUESTOS",
      "Confirmar Recepción",
      "ROJA",
      "Confirmación",
      `Sede Principal Envió: ${original.cantidad}`,
      "Rechazado",
      `Se rechazó la recepción de ${original.producto} (Ref: ${original.referencia}).`
    );

    setDb(updatedDb);
    alert("Envío marcado como NO CONFIRMADA.");
  };

  const handleDeleteArrival = (idx: number) => {
    if (!window.confirm("¿Está seguro de eliminar este registro de llegada de repuestos? Esto afectará el stock de repuestos.")) {
      return;
    }
    const original = db.llegada_de_repuestos[idx];
    const updatedLlegadas = db.llegada_de_repuestos.filter((_, i) => i !== idx);
    let updatedDb = { ...db, llegada_de_repuestos: updatedLlegadas };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "LLEGADA DE REPUESTOS",
      "Eliminar",
      "ROJA",
      "Modificación",
      original.referencia,
      "",
      `Se eliminó el ingreso de inventario del repuesto ${original.producto} (Ref: ${original.referencia}).`
    );

    setDb(updatedDb);
    alert("Registro de llegada de repuestos eliminado.");
  };

  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (abonarIdx === null) return;
    if (abonoValor <= 0) {
      alert("El valor del abono debe ser mayor a cero.");
      return;
    }

    const original = db.llegada_de_repuestos[abonarIdx];
    const abonos = original.abonos_historial || [];
    const totalAbonado = abonos.reduce((sum, ab) => sum + ab.valor, 0);
    const pending = original.valor_total - totalAbonado;

    if (abonoValor > pending) {
      alert(`El abono ($${abonoValor.toLocaleString()}) no puede superar el saldo pendiente ($${pending.toLocaleString()}).`);
      return;
    }

    const nuevoAbonoItem = {
      fecha: abonoFecha,
      valor: abonoValor,
      forma_pago: abonoForma,
      observaciones: abonoObs
    };

    const updatedAbonos = [...abonos, nuevoAbonoItem];
    const updatedArrival: LlegadaRepuesto = {
      ...original,
      abonos_historial: updatedAbonos
    };

    let updatedArrivals = [...db.llegada_de_repuestos];
    updatedArrivals[abonarIdx] = updatedArrival;

    let updatedDb = {
      ...db,
      llegada_de_repuestos: updatedArrivals
    };

    if (abonoForma === "Transferencia") {
      updatedDb = registrarTransferencia(
        updatedDb,
        "REPUESTOS (PEDIDOS)",
        `Abono Proveedor - ${original.producto} (Ref: ${original.referencia})`,
        abonoValor,
        `Abono registrado al proveedor. Observaciones: ${abonoObs}`,
        user.nombre_completo
      );
    }

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "LLEGADA DE REPUESTOS",
      "Abono Proveedor",
      "VERDE",
      "Abono",
      original.referencia,
      `Abonado: $${abonoValor.toLocaleString()}`,
      `Se registró abono de $${abonoValor.toLocaleString()} al proveedor por el pedido de ${original.producto} (Ref: ${original.referencia}). Medio de pago: ${abonoForma}.`
    );

    setDb(updatedDb);
    setShowAbonarModal(false);
    setAbonarIdx(null);
    setAboValor(0);
    setAboObs("");
    alert("Abono registrado al proveedor y acumulado con éxito.");
  };

  const handleSaveDevolucion = (e: React.FormEvent) => {
    e.preventDefault();
    if (devolucionIdx === null) return;
    if (devQty <= 0) {
      alert("La cantidad a devolver debe ser mayor a cero.");
      return;
    }

    const original = db.llegada_de_repuestos[devolucionIdx];
    const currentReturned = original.cantidad_devuelta || 0;
    const maxAllowed = original.cantidad - currentReturned;

    if (devQty > maxAllowed) {
      alert(`No puede devolver más unidades de las disponibles en este pedido (${maxAllowed} unidades disponibles de un total de ${original.cantidad}).`);
      return;
    }

    const devHistory = original.devoluciones_historial || [];
    const nuevaDevolucionItem = {
      fecha: getTodayDateString(),
      producto: original.producto,
      cantidad: devQty,
      motivo: devMotivo,
      observaciones: devObs
    };

    const updatedArrival: LlegadaRepuesto = {
      ...original,
      cantidad_devuelta: currentReturned + devQty,
      devoluciones_historial: [...devHistory, nuevaDevolucionItem]
    };

    let updatedArrivals = [...db.llegada_de_repuestos];
    updatedArrivals[devolucionIdx] = updatedArrival;

    let updatedDb = {
      ...db,
      llegada_de_repuestos: updatedArrivals
    };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "LLEGADA DE REPUESTOS",
      "Devolución Proveedor",
      "ROJA",
      "Devolución",
      original.referencia,
      `Devuelto: ${devQty} uds`,
      `Se registró la devolución de ${devQty} unidades de ${original.producto} (Ref: ${original.referencia}) al proveedor. Motivo: ${devMotivo}.`
    );

    setDb(updatedDb);
    setShowDevolucionModal(false);
    setDevolucionIdx(null);
    setDevQty(1);
    setDevMotivo("");
    setDevObs("");
    alert("Devolución registrada con éxito. Inventario actualizado automáticamente.");
  };

  // Add backorder request
  const handleSaveBackorder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solRef || !solName || !solDoc || !solClientName) {
      alert("Por favor rellene los campos obligatorios");
      return;
    }

    const recNo = String(Math.floor(1000 + Math.random() * 9000));
    const totalAbono = solAbonoEf + solAbonoTr;

    const initialHistorial: Array<{
      fecha: string;
      valor: number;
      forma_pago: "Efectivo" | "Transferencia";
      numero_recibo: string;
      usuario: string;
      observaciones?: string;
    }> = [];

    if (solAbonoEf > 0) {
      initialHistorial.push({
        fecha: getTodayDateString(),
        valor: solAbonoEf,
        forma_pago: "Efectivo",
        numero_recibo: recNo,
        usuario: user.nombre_completo,
        observaciones: "Abono inicial en efectivo"
      });
    }

    if (solAbonoTr > 0) {
      initialHistorial.push({
        fecha: getTodayDateString(),
        valor: solAbonoTr,
        forma_pago: "Transferencia",
        numero_recibo: recNo,
        usuario: user.nombre_completo,
        observaciones: "Abono inicial por transferencia"
      });
    }

    const newBackorder: RepuestoSolicitado = {
      fecha: getTodayDateString(),
      razon: "NO HAY",
      cantidad: solQty,
      moto: solMoto,
      referencia: solRef,
      producto: solName,
      documento: solDoc,
      nombre: solClientName,
      apellidos: solClientLastname,
      telefono: solPhone,
      valor: solVal,
      abono_efectivo: solAbonoEf,
      abono_transferencia: solAbonoTr,
      recibo: totalAbono > 0 ? recNo : "",
      estado: "PENDIENTE",
      abonos_historial: initialHistorial.length > 0 ? initialHistorial : undefined
    };

    let updatedDb = { ...db };

    // Register receipt in RECIBOS
    if (totalAbono > 0) {
      const newRec: Recibo = {
        fecha: getTodayDateString(),
        numero_recibo: recNo,
        recibo_de_pertenencia: `Cliente ${solClientName} ${solClientLastname}`,
        concepto: `Abono Reserva Repuesto Solicitado Ref: ${solRef}`,
        entrada: totalAbono,
        salida: 0
      };
      updatedDb.recibos = [newRec, ...updatedDb.recibos];
    }

    if (solAbonoTr > 0) {
      updatedDb = registrarTransferencia(
        updatedDb,
        "REPUESTOS (PEDIDOS CLIENTES)",
        `Abono Inicial - ${solName} (Ref: ${solRef})`,
        solAbonoTr,
        `Abono inicial de transferencia registrado en la creación. Recibo: ${recNo}`,
        user.nombre_completo
      );

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "AUDITORIA_Y_VERIFICACION",
        "Abono Transferencia Pedido",
        "AMARILLA",
        "Transferencia",
        "",
        recNo,
        `Se registró un abono inicial de $${solAbonoTr.toLocaleString()} por TRANSFERENCIA para el pedido del repuesto ${solName} (Ref: ${solRef}) del cliente ${solClientName} ${solClientLastname}. Recibo: ${recNo}.`
      );
    }

    updatedDb.repuestos_solicitados = [newBackorder, ...updatedDb.repuestos_solicitados];
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REPUESTOS SOLICITADOS",
      "Crear",
      "AMARILLA",
      "Referencia",
      "",
      solRef,
      `Encargo registrado de ${solQty} unidades de ${solName} para el cliente ${solClientName}.`
    );

    setDb(updatedDb);
    setShowSolicitadoForm(false);
    // Reset
    setSolRef("");
    setSolName("");
    setSolQty(1);
    setSolDoc("");
    setSolClientName("");
    setSolClientLastname("");
    setSolPhone("");
    setSolVal(0);
    setSolAbonoEf(0);
    setSolAbonoTr(0);
    alert("Pedido solicitado y abono guardados con éxito.");
  };

  const handleSavePedidoAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (pedidoAbonoIdx === null) return;
    if (pedidoAbonoValor <= 0) {
      alert("El valor del abono debe ser mayor a cero.");
      return;
    }

    const receiptNo = pedidoAbonoRecibo.trim();
    if (!receiptNo) {
      alert("Por favor ingrese el número del recibo correspondente.");
      return;
    }

    const currentRecibos = db.recibos || [];
    const isDuplicate = currentRecibos.some((r) => r.numero_recibo === receiptNo);
    if (isDuplicate) {
      alert(`ALERTA: El número de recibo #${receiptNo} ya existe en el sistema. Por favor ingrese un número diferente para continuar.`);
      return;
    }

    const original = db.repuestos_solicitados[pedidoAbonoIdx];
    const totalAbonado = original.abono_efectivo + original.abono_transferencia;
    const pending = original.valor - totalAbonado;

    if (pedidoAbonoValor > pending) {
      alert(`El abono ($${pedidoAbonoValor.toLocaleString()}) no puede superar el saldo pendiente ($${pending.toLocaleString()}).`);
      return;
    }

    const pastHistorial = original.abonos_historial || [];
    let listWithInitial = [...pastHistorial];

    if (listWithInitial.length === 0 && totalAbonado > 0) {
      if (original.abono_efectivo > 0) {
        listWithInitial.push({
          fecha: original.fecha,
          valor: original.abono_efectivo,
          forma_pago: "Efectivo",
          numero_recibo: original.recibo || "Inicial",
          usuario: "Sistema / Registro Inicial",
          observaciones: "Abono inicial en efectivo"
        });
      }
      if (original.abono_transferencia > 0) {
        listWithInitial.push({
          fecha: original.fecha,
          valor: original.abono_transferencia,
          forma_pago: "Transferencia",
          numero_recibo: original.recibo || "Inicial",
          usuario: "Sistema / Registro Inicial",
          observaciones: "Abono inicial por transferencia"
        });
      }
    }

    const newAbonoItem = {
      fecha: pedidoAbonoFecha,
      valor: pedidoAbonoValor,
      forma_pago: pedidoAbonoForma,
      numero_recibo: receiptNo,
      usuario: user.nombre_completo,
      observaciones: pedidoAbonoObs
    };

    const isEf = pedidoAbonoForma === "Efectivo";
    const updatedPedido: RepuestoSolicitado = {
      ...original,
      abono_efectivo: original.abono_efectivo + (isEf ? pedidoAbonoValor : 0),
      abono_transferencia: original.abono_transferencia + (!isEf ? pedidoAbonoValor : 0),
      recibo: receiptNo,
      abonos_historial: [...listWithInitial, newAbonoItem]
    };

    let updatedSolicitados = [...db.repuestos_solicitados];
    updatedSolicitados[pedidoAbonoIdx] = updatedPedido;

    let updatedDb: DatabaseState = {
      ...db,
      repuestos_solicitados: updatedSolicitados
    };

    // Create Recibo
    const newRec: Recibo = {
      fecha: pedidoAbonoFecha,
      numero_recibo: receiptNo,
      recibo_de_pertenencia: `Cliente ${original.nombre} ${original.apellidos}`,
      concepto: `Abono adicional Reserva Repuesto Solicitado Ref: ${original.referencia}${pedidoAbonoObs ? ` - Obs: ${pedidoAbonoObs}` : ""}`,
      entrada: pedidoAbonoValor,
      salida: 0
    };
    updatedDb.recibos = [newRec, ...updatedDb.recibos];

    if (!isEf) {
      updatedDb = registrarTransferencia(
        updatedDb,
        "REPUESTOS (PEDIDOS CLIENTES)",
        `Abono Cliente - ${original.producto} (Ref: ${original.referencia})`,
        pedidoAbonoValor,
        `Abono adicional registrado por el cliente. Recibo: ${receiptNo}. Obs: ${pedidoAbonoObs}`,
        user.nombre_completo
      );

      // Audit log specifically for Transferencia
      updatedDb = registrarEvento(
        updatedDb,
        user,
        "AUDITORIA_Y_VERIFICACION",
        "Abono Transferencia Pedido",
        "AMARILLA",
        "Transferencia",
        "",
        receiptNo,
        `Se registró un abono de $${pedidoAbonoValor.toLocaleString()} por TRANSFERENCIA para el pedido del repuesto ${original.producto} (Ref: ${original.referencia}) del cliente ${original.nombre} ${original.apellidos}. Recibo: ${receiptNo}.`
      );
    }

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REPUESTOS SOLICITADOS",
      "Abono Cliente",
      "VERDE",
      "Abono",
      original.referencia,
      `Abonado: $${pedidoAbonoValor.toLocaleString()}`,
      `Se registró abono adicional de $${pedidoAbonoValor.toLocaleString()} del cliente ${original.nombre} ${original.apellidos} por el pedido de ${original.producto} (Ref: ${original.referencia}). Medio: ${pedidoAbonoForma}. Recibo: ${receiptNo}.`
    );

    setDb(updatedDb);
    setShowPedidoAbonoModal(false);
    setPedidoAbonoIdx(null);
    setPedidoAbonoValor(0);
    setPedidoAbonoObs("");
    setPedidoAbonoRecibo("");
    setPedidoAbonoFecha(getTodayDateString());
    alert("Abono del cliente registrado y acumulado con éxito.");
  };

  const handleSavePedidoDevolucion = (e: React.FormEvent) => {
    e.preventDefault();
    if (pedidoDevolucionIdx === null) return;

    const original = db.repuestos_solicitados[pedidoDevolucionIdx];
    
    // Devolve the request
    const updatedPedido: RepuestoSolicitado = {
      ...original,
      estado: "CANCELADO" as const
    };

    let updatedSolicitados = [...db.repuestos_solicitados];
    updatedSolicitados[pedidoDevolucionIdx] = updatedPedido;

    let updatedDb: DatabaseState = {
      ...db,
      repuestos_solicitados: updatedSolicitados
    };

    // Register refund (egreso) if they had abonos
    const totalAbonado = original.abono_efectivo + original.abono_transferencia;
    if (totalAbonado > 0) {
      const refundRecNo = String(Math.floor(1000 + Math.random() * 9000));
      const refundRec: Recibo = {
        fecha: getTodayDateString(),
        numero_recibo: refundRecNo,
        recibo_de_pertenencia: `Cliente ${original.nombre} ${original.apellidos}`,
        concepto: `Devolución/Reembolso de Abono Reserva Repuesto Solicitado Ref: ${original.referencia}`,
        entrada: 0,
        salida: totalAbonado
      };
      updatedDb.recibos = [refundRec, ...updatedDb.recibos];
    }

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REPUESTOS SOLICITADOS",
      "Devolución Cliente",
      "ROJA",
      "Devolución",
      original.referencia,
      "CANCELADO",
      `Se registró la devolución/cancelación del pedido del cliente ${original.nombre} ${original.apellidos} para el producto ${original.producto} (Ref: ${original.referencia}). Motivo: ${pedidoDevolucionMotivo}. Reembolso total abonos: $${totalAbonado.toLocaleString()}`
    );

    setDb(updatedDb);
    setShowPedidoDevolucionModal(false);
    setPedidoDevolucionIdx(null);
    setPedidoDevolucionMotivo("");
    setPedidoDevolucionObs("");
    alert("Devolución y cancelación del pedido registrada con éxito. Evento registrado en Auditoría.");
  };

  // Manual Registration for Salida de Repuestos
  const handleSaveManualSalida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSalidaRef || !manualSalidaProd || manualSalidaQty <= 0 || manualSalidaPrecio <= 0) {
      alert("Por favor complete todos los datos requeridos (Referencia, Producto, Cantidad > 0 y Precio > 0).");
      return;
    }

    // Check stock
    const stockItem = stockList.find((s) => s.referencia.toLowerCase() === manualSalidaRef.toLowerCase());
    const currentStock = stockItem ? stockItem.stock : 0;
    if (manualSalidaQty > currentStock) {
      const proceed = window.confirm(
        `¡ATENCIÓN! La cantidad a retirar (${manualSalidaQty}) supera el stock disponible actual (${currentStock} unidades).\n\n¿Desea autorizar esta salida de inventario?`
      );
      if (!proceed) return;
    }

    // Payment validation: EFECTIVO + TRANSFERENCIA = VALOR TOTAL
    const totalCalculado = manualSalidaQty * manualSalidaPrecio;
    const totalIngresado = manualSalidaEfectivo + manualSalidaTransferencia;
    if (Math.abs(totalIngresado - totalCalculado) > 0.01) {
      alert(
        `VALIDACIÓN DE PAGOS: La suma de Efectivo ($${manualSalidaEfectivo.toLocaleString()}) + Transferencia ($${manualSalidaTransferencia.toLocaleString()}) = $${totalIngresado.toLocaleString()} no coincide con el Valor Total ($${totalCalculado.toLocaleString()}).`
      );
      return;
    }

    const newSalida: SalidaRepuesto = {
      fecha: manualSalidaFecha,
      referencia: manualSalidaRef,
      producto: manualSalidaProd,
      marca_departamento: manualSalidaMarca || "General",
      cantidad: manualSalidaQty,
      formas_de_pago: manualSalidaForma,
      efectivo: manualSalidaEfectivo,
      transferencia: manualSalidaTransferencia,
      precio: manualSalidaPrecio,
      valor_total: totalCalculado
    };

    let updatedDb = {
      ...db,
      salida_de_repuestos: [newSalida, ...db.salida_de_repuestos]
    };

    if (manualSalidaTransferencia > 0) {
      updatedDb = registrarTransferencia(
        updatedDb,
        "SALIDA DE REPUESTOS",
        `Ref: ${manualSalidaRef} - ${manualSalidaProd}`,
        manualSalidaTransferencia,
        `Consignación/Transferencia por salida de repuestos ${manualSalidaProd}`,
        user.nombre_completo
      );
    }

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "SALIDA DE REPUESTOS",
      "Registro Manual",
      "VERDE",
      "Salida Inventario",
      manualSalidaRef,
      `Cantidad: ${manualSalidaQty}`,
      `Salida de repuesto registrada: ${manualSalidaQty} uds de ${manualSalidaProd} (Ref: ${manualSalidaRef}). Total: $${totalCalculado.toLocaleString()}. Medio de pago: ${manualSalidaForma}.`
    );

    setDb(updatedDb);
    setShowManualSalidaModal(false);
    // Reset form
    setManualSalidaRef("");
    setManualSalidaProd("");
    setManualSalidaMarca("Honda");
    setManualSalidaQty(1);
    setManualSalidaPrecio(0);
    setManualSalidaEfectivo(0);
    setManualSalidaTransferencia(0);
    setManualSalidaProductSearch("");
    alert("Salida de repuesto registrada y confirmada con éxito. Inventario descontado.");
  };

  // Add Item to POS cart
  const handleAddItemToCart = (refVal: string) => {
    const stockItem = stockList.find((s) => s.referencia === refVal);
    if (!stockItem || stockItem.stock <= 0) {
      alert("No se puede vender un repuesto con Stock = 0. Registre un pedido faltante.");
      return;
    }

    const existing = cartItems.find((c) => c.reference === refVal);
    if (existing) {
      if (existing.quantity + 1 > stockItem.stock) {
        alert("No existe suficiente inventario disponible para incrementar la cantidad de este repuesto.");
        return;
      }
      setCartCartItems(cartItems.map((c) => c.reference === refVal ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCartCartItems([...cartItems, { reference: refVal, quantity: 1 }]);
    }
  };

  // Checkout POS Cart
  const handleCheckoutCart = () => {
    if (!cartCustomer) {
      alert("Por favor escriba el nombre o identificador del ticket de venta");
      return;
    }
    if (cartItems.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    // Calculate total cost
    let totalValue = 0;
    cartItems.forEach((item) => {
      const catalog = stockList.find((s) => s.referencia === item.reference);
      if (catalog) {
        totalValue += catalog.precio_venta * item.quantity;
      }
    });

    // Check payment matching total
    const totalPay = posPaymentType === "Efectivo" ? posEfectivo : posPaymentType === "Transferencia" ? posTransferencia : (posEfectivo + posTransferencia);
    if (totalPay !== totalValue) {
      alert(`La suma ingresada de los medios de pago ($${totalPay}) no coincide exactamente con el valor total de la venta ($${totalValue})`);
      return;
    }

    let updatedDb = { ...db };

    // Register all items into SALIDA DE REPUESTOS
    cartItems.forEach((item) => {
      const catalog = stockList.find((s) => s.referencia === item.reference)!;
      const checkoutRec: SalidaRepuesto = {
        fecha: getTodayDateString(),
        referencia: item.reference,
        producto: catalog.producto,
        marca_departamento: catalog.marca_departamento,
        cantidad: item.quantity,
        formas_de_pago: posPaymentType,
        efectivo: posPaymentType === "Efectivo" ? (catalog.precio_venta * item.quantity) : posPaymentType === "Mixto" ? Math.min(posEfectivo, catalog.precio_venta * item.quantity) : 0,
        transferencia: posPaymentType === "Transferencia" ? (catalog.precio_venta * item.quantity) : posPaymentType === "Mixto" ? Math.max(0, (catalog.precio_venta * item.quantity) - posEfectivo) : 0,
        precio: catalog.precio_venta,
        valor_total: catalog.precio_venta * item.quantity
      };
      updatedDb.salida_de_repuestos = [checkoutRec, ...updatedDb.salida_de_repuestos];
    });

    // Register Transfer if applicable
    const transferMonto = posPaymentType === "Transferencia" ? totalValue : (posPaymentType === "Mixto" ? posTransferencia : 0);
    if (transferMonto > 0) {
      updatedDb = registrarTransferencia(
        updatedDb,
        "REPUESTOS POS",
        cartCustomer,
        transferMonto,
        `Venta POS de accesorios/repuestos - Ticket: ${cartCustomer}`,
        user.usuario
      );
    }

    // Log Event
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "SALIDA DE REPUESTOS",
      "Cerrar Ticket",
      "AMARILLA",
      "Ticket Venta",
      "",
      cartCustomer,
      `Venta POS de accesorios/repuestos por un valor de $${totalValue}. Cliente temporal: ${cartCustomer}`
    );

    setDb(updatedDb);
    setCartCartItems([]);
    setCartCustomer("");
    setShowCartForm(false);
    setPosEfectivo(0);
    setPosTransferencia(0);
    alert("Ticket de repuestos facturado y cerrado con éxito. Inventario actualizado.");
  };

  const filteredStock = stockList.filter((item) => {
    const matchesSearch = item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.marca_departamento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarca = filterMarca === "TODAS" || item.marca_departamento.toLowerCase() === filterMarca.toLowerCase();
    return matchesSearch && matchesMarca;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in">
      
      {/* Sub tabs header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Módulo de Repuestos y Accesorios</h2>
          <p className="text-xs text-slate-500 mt-1">
            Control integrado de compras (Llegadas), ventas rápidas (POS / Tickets) y pedidos faltantes.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg space-x-1 self-start flex-wrap gap-y-1">
          <button
            onClick={() => { setActiveTab("entradas_repuestos"); setShowLlegadaForm(false); setShowSolicitadoForm(false); setShowCartForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all relative ${
              activeTab === "entradas_repuestos" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📥 Entradas</span>
            {pendingArrivals.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {pendingArrivals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("salida_repuestos"); setShowLlegadaForm(false); setShowSolicitadoForm(false); setShowCartForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all relative ${
              activeTab === "salida_repuestos" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📤 Salida de Repuestos</span>
            {db.salida_de_repuestos.length > 0 && (
              <span className="ml-1 bg-slate-200 text-slate-700 font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                {db.salida_de_repuestos.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("inventario"); setShowLlegadaForm(false); setShowSolicitadoForm(false); setShowCartForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all ${
              activeTab === "inventario" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📦 Inventario
          </button>
          <button
            onClick={() => { setActiveTab("pos"); setShowLlegadaForm(false); setShowSolicitadoForm(false); setShowCartForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all ${
              activeTab === "pos" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🛒 POS / Ticket
          </button>
          <button
            onClick={() => { setActiveTab("pedidos"); setShowLlegadaForm(false); setShowSolicitadoForm(false); setShowCartForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all relative ${
              activeTab === "pedidos" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📋 Pedidos</span>
            {outOfStockItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {outOfStockItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUBTABS FOR ENTRADAS DE REPUESTOS */}
      {activeTab === "entradas_repuestos" && (
        <div className="flex space-x-2 border-b border-slate-100 pb-3 mb-6">
          <button
            onClick={() => setEntradasSubTab("pendientes")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              entradasSubTab === "pendientes" ? "bg-slate-800 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pendientes por confirmar ({pendingArrivals.length})
          </button>
          <button
            onClick={() => setEntradasSubTab("manual")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              entradasSubTab === "manual" ? "bg-slate-800 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Historial Maestro (Llegada Inventario)
          </button>
        </div>
      )}

      {/* SUBTABS FOR PEDIDOS */}
      {activeTab === "pedidos" && (
        <div className="flex space-x-2 border-b border-slate-100 pb-3 mb-6">
          <button
            onClick={() => setPedidosSubTab("agotados")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              pedidosSubTab === "agotados" ? "bg-slate-800 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Productos agotados automáticamente ({outOfStockItems.length})
          </button>
          <button
            onClick={() => setPedidosSubTab("realizados")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              pedidosSubTab === "realizados" ? "bg-slate-800 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pedidos realizados ({db.repuestos_solicitados.length})
          </button>
        </div>
      )}

      {/* RENDER LLEGADAS PENDIENTES TAB */}
      {activeTab === "entradas_repuestos" && entradasSubTab === "pendientes" && (
        <div className="space-y-4 font-sans animate-fade-in">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start space-x-3 shadow-xs">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider">Llegadas de Repuestos Pendientes de Sede Principal</h4>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">
                A continuación se muestra la lista de repuestos enviados al inventario de su sede.
                Por favor, verifique físicamente las cantidades de cada repuesto antes de confirmar el ingreso, para evitar inconsistencias de inventario entre sedes.
              </p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Fecha Envío</th>
                  <th className="p-4">Referencia</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Marca / Depto</th>
                  <th className="p-4 text-center">Cantidad Enviada</th>
                  <th className="p-4 text-right">Precio Venta</th>
                  <th className="p-4 text-center">Acciones de Verificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {db.llegada_de_repuestos
                  .map((item, idx) => ({ ...item, originalIdx: idx }))
                  .filter((item) => item.confirmacion_de_llegada === "PENDIENTE")
                  .map((item) => {
                    return (
                      <tr key={item.originalIdx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 whitespace-nowrap">{item.fecha}</td>
                        <td className="p-4 font-mono font-bold text-red-600">{item.referencia}</td>
                        <td className="p-4 font-semibold text-slate-800">{item.producto}</td>
                        <td className="p-4">{item.marca_departamento}</td>
                        <td className="p-4 text-center">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {item.cantidad}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono">${item.precio_venta.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-w-md space-y-3">
                            {/* Quantity verification */}
                            <div className="flex items-center justify-between gap-4">
                              <label className="text-[11px] font-bold text-slate-600 uppercase">Confirmar Cantidad Recibida:</label>
                              <input
                                type="number"
                                min="0"
                                max={item.cantidad * 2}
                                defaultValue={item.cantidad}
                                id={`pending-qty-${item.originalIdx}`}
                                className="w-20 bg-white border border-slate-200 rounded p-1 text-center font-mono font-bold text-xs"
                              />
                            </div>

                            {/* Difference note */}
                            <div className="flex items-center justify-between gap-4">
                              <label className="text-[11px] font-bold text-slate-600 uppercase">Novedad / Comentario:</label>
                              <input
                                type="text"
                                placeholder="Escribe si hay diferencias (opcional)..."
                                id={`pending-note-${item.originalIdx}`}
                                className="flex-1 bg-white border border-slate-200 rounded p-1 text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-2 pt-1.5 justify-end">
                              <button
                                onClick={() => {
                                  const qtyInput = document.getElementById(`pending-qty-${item.originalIdx}`) as HTMLInputElement;
                                  const noteInput = document.getElementById(`pending-note-${item.originalIdx}`) as HTMLInputElement;
                                  const qty = parseInt(qtyInput?.value) || 0;
                                  const note = noteInput?.value || "";
                                  handleProcessArrival(item.originalIdx, qty, note);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors uppercase tracking-tight cursor-pointer"
                              >
                                Confirmar y Recibir
                              </button>
                              <button
                                onClick={() => {
                                  handleProcessArrivalNoRecibido(item.originalIdx);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors uppercase tracking-tight cursor-pointer"
                              >
                                Rechazar / No Recibido
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {db.llegada_de_repuestos.filter((l) => l.confirmacion_de_llegada === "PENDIENTE").length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-400 font-bold">
                      No existen envíos de repuestos pendientes por recibir. ¡Excelente control de inventario!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER LLEGADA INVENTARIO HISTORIAL & MANUAL ENTRY TAB */}
      {activeTab === "entradas_repuestos" && entradasSubTab === "manual" && (
        <div className="space-y-4 font-sans animate-fade-in">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Módulo ERP</span>
                <h3 className="font-bold text-sm tracking-tight uppercase">Documento Maestro — LLEGADA INVENTARIO</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Control y registro oficial de productos que ingresan físicamente al inventario. Estructura oficial de 9 columnas (A a I).
                Permite verificar cantidades, gestionar abonos/devoluciones a proveedores y sincronizar automáticamente el stock del POS.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingArrivalIndex(null);
                setArrFecha(getTodayDateString());
                setArrRef("");
                setArrName("");
                setArrTipoMoto("Universal / General");
                setArrDept("Honda");
                setArrQty(1);
                setArrPrice(0);
                setArrArrivalState("PENDIENTE");
                setShowLlegadaForm(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Registrar Llegada de Inventario</span>
            </button>
          </div>

          {/* Filter and stats calculations */}
          {(() => {
            const allLlegadas = db.llegada_de_repuestos.map((item, originalIdx) => ({
              ...item,
              originalIdx
            }));

            const filteredLlegadas = allLlegadas.filter((item) => {
              // Search match
              const search = llegadaSearchTerm.toLowerCase().trim();
              const matchesSearch =
                !search ||
                item.referencia.toLowerCase().includes(search) ||
                item.producto.toLowerCase().includes(search) ||
                (item.tipo_moto && item.tipo_moto.toLowerCase().includes(search)) ||
                item.marca_departamento.toLowerCase().includes(search);

              // Status match
              const matchesEstado =
                llegadaFilterEstado === "TODAS" ||
                item.confirmacion_de_llegada === llegadaFilterEstado;

              // Brand match
              const matchesMarca =
                llegadaFilterMarca === "TODAS" ||
                item.marca_departamento === llegadaFilterMarca;

              // Date range match
              const matchesFechaInicio =
                !llegadaFilterFechaInicio || item.fecha >= llegadaFilterFechaInicio;
              const matchesFechaFin =
                !llegadaFilterFechaFin || item.fecha <= llegadaFilterFechaFin;

              return matchesSearch && matchesEstado && matchesMarca && matchesFechaInicio && matchesFechaFin;
            });

            // Summary stats
            const totalRegistros = filteredLlegadas.length;
            const confirmedItems = filteredLlegadas.filter(
              (i) => i.confirmacion_de_llegada === "CONFIRMADA" || i.confirmacion_de_llegada === "CON NOVEDAD"
            );
            const totalUnidadesConfirmadas = confirmedItems.reduce((sum, i) => sum + i.cantidad, 0);
            const totalValorConfirmado = confirmedItems.reduce((sum, i) => sum + i.valor_total, 0);
            const totalPendientesCount = filteredLlegadas.filter((i) => i.confirmacion_de_llegada === "PENDIENTE").length;

            return (
              <>
                {/* KPI Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Registros</span>
                    <span className="text-lg font-black text-slate-800 font-mono">{totalRegistros}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Unidades Ingresadas</span>
                    <span className="text-lg font-black text-emerald-600 font-mono">{totalUnidadesConfirmadas} uds</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Valor Total Ingresado</span>
                    <span className="text-lg font-black text-slate-900 font-mono">${totalValorConfirmado.toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pendientes Confirmación</span>
                    <span className="text-lg font-black text-amber-600 font-mono">{totalPendientesCount}</span>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-1">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Buscar ref, producto, moto, marca..."
                        value={llegadaSearchTerm}
                        onChange={(e) => setLlegadaSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <select
                        value={llegadaFilterEstado}
                        onChange={(e) => setLlegadaFilterEstado(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                      >
                        <option value="TODAS">Todos los Estados de Confirmación</option>
                        <option value="PENDIENTE">PENDIENTE por Confirmar</option>
                        <option value="CONFIRMADA">CONFIRMADA (En Stock)</option>
                        <option value="CON NOVEDAD">CON NOVEDAD</option>
                        <option value="NO CONFIRMADA">NO CONFIRMADA (Rechazada)</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={llegadaFilterMarca}
                        onChange={(e) => setLlegadaFilterMarca(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                      >
                        <option value="TODAS">Todas las Marcas / Departamentos</option>
                        <option value="Honda">Honda</option>
                        <option value="Yamaha">Yamaha</option>
                        <option value="Suzuki">Suzuki</option>
                        <option value="AKT">AKT</option>
                        <option value="Genérico">Genérico</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={llegadaFilterFechaInicio}
                        onChange={(e) => setLlegadaFilterFechaInicio(e.target.value)}
                        placeholder="Fecha Inicio"
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700"
                      />
                      <input
                        type="date"
                        value={llegadaFilterFechaFin}
                        onChange={(e) => setLlegadaFilterFechaFin(e.target.value)}
                        placeholder="Fecha Fin"
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Official 9-Column Table A to I */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                    <span>Estructura Oficial Excel (Columnas A - I)</span>
                    <span>Fila 2: Encabezados | Fila 3+: Registros ({filteredLlegadas.length})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                          <th className="p-3 text-center border-r border-slate-700">A - FECHA</th>
                          <th className="p-3 border-r border-slate-700">B - REFERENCIA</th>
                          <th className="p-3 border-r border-slate-700">C - PRODUCTOS</th>
                          <th className="p-3 border-r border-slate-700">D - TIPO MOTO</th>
                          <th className="p-3 border-r border-slate-700">E - MARCA / DEPTO.</th>
                          <th className="p-3 text-center border-r border-slate-700">F - CANTIDAD</th>
                          <th className="p-3 text-right border-r border-slate-700">G - PRECIO VENTA</th>
                          <th className="p-3 text-right border-r border-slate-700">H - VALOR TOTAL</th>
                          <th className="p-3 text-center border-r border-slate-700">I - CONFIRMACIÓN</th>
                          <th className="p-3 text-center">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLlegadas.length > 0 ? (
                          filteredLlegadas.map((item) => {
                            const isPending = item.confirmacion_de_llegada === "PENDIENTE";
                            const isConfirmed = item.confirmacion_de_llegada === "CONFIRMADA";
                            const isNovelty = item.confirmacion_de_llegada === "CON NOVEDAD";

                            return (
                              <tr key={item.originalIdx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-center font-mono text-slate-600 whitespace-nowrap">{item.fecha}</td>
                                <td className="p-3 font-mono font-bold text-red-600 whitespace-nowrap">{item.referencia}</td>
                                <td className="p-3 font-semibold text-slate-800">{item.producto}</td>
                                <td className="p-3 text-slate-600 whitespace-nowrap">{item.tipo_moto || "Universal / General"}</td>
                                <td className="p-3 text-slate-600 whitespace-nowrap">{item.marca_departamento}</td>
                                <td className="p-3 text-center font-mono font-bold">
                                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                                    {item.cantidad}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono text-slate-600">
                                  ${item.precio_venta.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                                  ${item.valor_total.toLocaleString()}
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                      isConfirmed
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : isPending
                                        ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                                        : isNovelty
                                        ? "bg-orange-100 text-orange-800 border border-orange-200"
                                        : "bg-red-100 text-red-800 border border-red-200"
                                    }`}
                                  >
                                    {item.confirmacion_de_llegada}
                                  </span>
                                </td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {isPending && (
                                      <button
                                        onClick={() => {
                                          setEntradasSubTab("pendientes");
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors uppercase cursor-pointer"
                                        title="Verificar y confirmar recepción"
                                      >
                                        Verificar
                                      </button>
                                    )}
                                    {user.rol === "Administrador" && (
                                      <button
                                        onClick={() => openEditArrival(item.originalIdx, item)}
                                        className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors uppercase cursor-pointer"
                                        title="Editar registro de llegada"
                                      >
                                        Editar
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setAbonarIdx(item.originalIdx);
                                        setAboFecha(getTodayDateString());
                                        setAboValor(0);
                                        setAboForma("Efectivo");
                                        setAboObs("");
                                        setShowAbonarModal(true);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors uppercase cursor-pointer"
                                      title="Registrar abono a proveedor"
                                    >
                                      Abonar
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDevolucionIdx(item.originalIdx);
                                        setDevProd(item.producto);
                                        setDevQty(1);
                                        setDevMotivo("");
                                        setDevObs("");
                                        setShowDevolucionModal(true);
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2 py-1 rounded transition-colors uppercase cursor-pointer"
                                      title="Registrar devolución a proveedor"
                                    >
                                      Devolver
                                    </button>
                                    {user.rol === "Administrador" && (
                                      <button
                                        onClick={() => handleDeleteArrival(item.originalIdx)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] px-1.5 py-1 rounded transition-colors uppercase cursor-pointer"
                                        title="Eliminar de historial"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={10} className="text-center p-8 text-slate-400 font-bold">
                              No existen registros de llegada de inventario con los filtros seleccionados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* RENDER INVENTARIO TAB */}
      {activeTab === "inventario" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Filtrar por referencia, repuesto, categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
                {searchTerm.trim().length >= 1 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {stockList
                      .filter(s =>
                        s.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.marca_departamento.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSearchTerm(s.producto)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col cursor-pointer"
                        >
                          <span className="font-bold text-slate-800">{s.producto}</span>
                          <span className="text-[10px] text-slate-400">Ref: {s.referencia} | Cat: {s.marca_departamento} | Stock: {s.stock}</span>
                        </button>
                      ))
                    }
                    {stockList.filter(s =>
                      s.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.marca_departamento.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">No hay sugerencias</div>
                    )}
                  </div>
                )}
              </div>

              {/* BRAND FILTER */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Marca:</span>
                <select
                  value={filterMarca}
                  onChange={(e) => setFilterMarca(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="TODAS">Todas las Marcas</option>
                  <option value="Honda">Honda</option>
                  <option value="Yamaha">Yamaha</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="AKT">AKT</option>
                  <option value="Genérico">Genérico</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              <span className="font-mono font-bold text-slate-800">
                Valor Total del Inventario: ${stockList.reduce((acc, curr) => acc + curr.valor_inventario, 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Referencia</th>
                  <th className="p-4">Repuesto / Accesorio</th>
                  <th className="p-4">Marca / Categoría</th>
                  <th className="p-4 text-center">Entradas Totales</th>
                  <th className="p-4 text-center">Salidas Totales</th>
                  <th className="p-4 text-center">Stock Disponible</th>
                  <th className="p-4 text-right">Precio Unitario</th>
                  <th className="p-4 text-right">Valor Total Stock</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStock.length > 0 ? (
                  filteredStock.map((item, idx) => {
                    const isLowStock = item.stock <= 3;
                    const isOutOfStock = item.stock === 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-red-600">{item.referencia}</td>
                        <td className="p-4 font-semibold text-slate-800">{item.producto}</td>
                        <td className="p-4">{item.marca_departamento}</td>
                        <td className="p-4 text-center font-mono">{item.entradas}</td>
                        <td className="p-4 text-center font-mono">{item.salidas}</td>
                        <td className="p-4 text-center font-mono font-bold">
                          <span className={isOutOfStock ? "text-red-600 font-black" : isLowStock ? "text-yellow-600" : "text-green-600"}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold">${item.precio_venta.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono font-semibold">${item.valor_inventario.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isOutOfStock
                                ? "bg-red-100 text-red-700"
                                : isLowStock
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isOutOfStock ? "SIN STOCK" : isLowStock ? "STOCK BAJO" : "DISPONIBLE"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-slate-400">
                      No se encontraron productos en el inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER LLEGADAS TAB */}
      {activeTab === "entradas_repuestos" && entradasSubTab === "manual" && (
        <div className="space-y-4">
          {!showAddLlegadaForm ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-sm">Historial de Entradas de Mercancía</h3>
                {user.rol === "Administrador" && (
                  <button
                    onClick={() => setShowLlegadaForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Ingresar Nueva Llegada</span>
                  </button>
                )}
              </div>

              <div className="border border-slate-100 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Referencia</th>
                      <th className="p-4">Producto</th>
                      <th className="p-4">Marca / Depto</th>
                      <th className="p-4 text-center">Cantidad</th>
                      <th className="p-4 text-right">Precio Entrada</th>
                      <th className="p-4 text-right">Total Valor</th>
                      <th className="p-4 text-center">Recepción</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {db.llegada_de_repuestos.map((item, idx) => {
                      const totalAbonado = (item.abonos_historial || []).reduce((sum, ab) => sum + ab.valor, 0);
                      const saldoPendiente = item.valor_total - totalAbonado;
                      const hasDevoluciones = (item.cantidad_devuelta || 0) > 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 whitespace-nowrap">{item.fecha}</td>
                          <td className="p-4 font-mono font-bold text-red-600">{item.referencia}</td>
                          <td className="p-4 font-semibold text-slate-800">{item.producto}</td>
                          <td className="p-4">{item.marca_departamento}</td>
                          <td className="p-4 text-center font-mono font-bold">
                            <div>
                              <span>{item.cantidad}</span>
                              {hasDevoluciones && (
                                <div className="text-[10px] text-red-500 font-normal">
                                  Devuelto: {item.cantidad_devuelta} uds
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono">${item.precio_venta.toLocaleString()}</td>
                          <td className="p-4 text-right font-mono">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-800">${item.valor_total.toLocaleString()}</div>
                              <div className="text-[10px] text-slate-500">
                                Abonado: <span className="font-semibold text-green-600">${totalAbonado.toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Saldo: <span className={`font-semibold ${saldoPendiente > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                  {saldoPendiente > 0 ? `$${saldoPendiente.toLocaleString()}` : "PAGADO"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                item.confirmacion_de_llegada === "CONFIRMADA"
                                  ? "bg-green-100 text-green-700"
                                  : item.confirmacion_de_llegada === "CON NOVEDAD"
                                  ? "bg-red-100 text-red-700"
                                  : item.confirmacion_de_llegada === "PENDIENTE"
                                  ? "bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.confirmacion_de_llegada}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditArrival(idx, item)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Editar Entrada de Repuesto"
                              >
                                Editar
                              </button>
                              {user.rol === "Administrador" && (
                                <button
                                  onClick={() => handleDeleteArrival(idx)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Eliminar Registro de Entrada"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveArrival} className="space-y-4 max-w-xl bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingArrivalIndex !== null ? "Editar Entrada de Repuesto" : "Registrar Entrada de Repuesto"}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Referencia / Código de barras *</label>
                  <input
                    type="text"
                    required
                    value={arrRef}
                    onChange={(e) => {
                      setArrRef(e.target.value);
                      handleRefAutocomplete(e.target.value, setArrName, setArrPrice);
                    }}
                    placeholder="e.g. REP-001"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del Repuesto *</label>
                  <input
                    type="text"
                    required
                    value={arrName}
                    onChange={(e) => setArrName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Marca / Depto</label>
                  <select
                    value={arrDept}
                    onChange={(e) => setArrDept(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamalube">Yamalube</option>
                    <option value="Aceites">Aceites</option>
                    <option value="Lubricantes">Lubricantes</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Llantas">Llantas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={arrQty || ""}
                    onChange={(e) => setArrQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Precio Unitario ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={arrPrice || ""}
                    onChange={(e) => setArrPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Estado de Recepción</label>
                <select
                  value={arrArrivalState}
                  onChange={(e: any) => setArrArrivalState(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                >
                  <option value="PENDIENTE">PENDIENTE por Confirmar (No ingresa stock)</option>
                  <option value="CONFIRMADA">CONFIRMADA (Ingreso Normal)</option>
                  <option value="CON NOVEDAD">CON NOVEDAD (Genera Alerta de Daños / Diferencias)</option>
                  <option value="NO CONFIRMADA">NO RECIBIDA / RECHAZADA (No ingresa stock)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLlegadaForm(false);
                    setEditingArrivalIndex(null);
                    setArrRef("");
                    setArrName("");
                    setArrQty(1);
                    setArrPrice(0);
                    setArrArrivalState("PENDIENTE");
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg"
                >
                  {editingArrivalIndex !== null ? "Guardar Cambios" : "Guardar Entrada"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* RENDER POS CHECKOUT TAB */}
      {activeTab === "pos" && (
        <div className="space-y-6">
          {/* Ticket Switcher Bar */}
          {tickets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight mr-2">Tickets Activos:</span>
              {tickets.map((t) => {
                const isActive = t.id === activeTicketId;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      isActive
                        ? "bg-slate-900 border-slate-950 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setActiveTicketId(t.id)}
                  >
                    <span>{t.customer || "Ticket sin nombre"}</span>
                    {t.items.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {t.items.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete/close ticket
                        const nextTickets = tickets.filter((tk) => tk.id !== t.id);
                        setTickets(nextTickets);
                        if (activeTicketId === t.id) {
                          setActiveTicketId(nextTickets.length > 0 ? nextTickets[0].id : null);
                        }
                      }}
                      className={`hover:text-red-500 font-bold ml-1 text-[11px] p-0.5 rounded-full ${
                        isActive ? "text-slate-400 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"
                      }`}
                      title="Cerrar Ticket"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleCreateNewTicket}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-dashed border-red-300 hover:border-red-500 bg-red-50/50 hover:bg-red-50 text-red-600 font-bold text-xs transition-colors cursor-pointer"
              >
                <span>+ Nuevo</span>
              </button>
            </div>
          )}

          {!showCartForm ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-4">
              <ShoppingCart size={48} className="text-red-500" />
              <div className="text-center">
                <h3 className="font-bold text-slate-800 text-sm">Punto de Venta Rápido (POS)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Abra un ticket de venta para realizar facturación instantánea de accesorios y repuestos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowCartForm(true); }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase py-2.5 px-6 rounded-lg shadow-xs tracking-wider transition-colors"
              >
                + Nuevo Ticket de Venta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Product Catalog Picker (Left side) */}
              <div className="lg:col-span-7 bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Añadir Productos al Carrito</h4>
                
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Escriba para filtrar repuestos disponibles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-800 focus:outline-hidden"
                  />
                  {searchTerm.trim().length >= 1 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                      {stockList
                        .filter(s =>
                          s.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.marca_departamento.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice(0, 5)
                        .map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSearchTerm(s.producto)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col cursor-pointer"
                          >
                            <span className="font-bold text-slate-800">{s.producto}</span>
                            <span className="text-[10px] text-slate-400">Ref: {s.referencia} | Stock: {s.stock} | ${s.precio_venta.toLocaleString()}</span>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredStock.map((prod, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col justify-between hover:border-red-200 transition-colors">
                      <div>
                        <div className="font-bold text-slate-800 text-xs truncate">{prod.producto}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {prod.referencia}</div>
                        <div className="text-[10px] font-semibold text-slate-600 mt-1">
                          Stock: <span className={prod.stock === 0 ? "text-red-600 font-bold" : "text-green-600"}>{prod.stock}</span> unidades
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
                        <span className="font-mono text-xs font-bold text-red-600">${prod.precio_venta.toLocaleString()}</span>
                        <button
                          type="button"
                          disabled={prod.stock === 0}
                          onClick={() => handleAddItemToCart(prod.referencia)}
                          className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white disabled:bg-slate-100 disabled:text-slate-400 font-bold text-[10px] px-2.5 py-1.5 rounded-md uppercase transition-all"
                        >
                          {prod.stock === 0 ? "Sin Stock" : "Agregar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Summary & payment (Right side) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <ShoppingCart size={14} className="text-red-600" />
                    <span>Resumen del Ticket</span>
                  </h4>
                  <button type="button" onClick={() => setShowCartForm(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">
                    Cancelar Ticket
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Identificador del Ticket *</label>
                  <input
                    type="text"
                    required
                    value={cartCustomer}
                    onChange={(e) => setCartCustomer(e.target.value)}
                    placeholder="e.g. Cliente Juan Pérez, Taller"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                {/* Items loop */}
                <div className="divide-y divide-slate-50 max-h-40 overflow-y-auto pr-1">
                  {cartItems.length > 0 ? (
                    cartItems.map((item, idx) => {
                      const catalog = stockList.find((s) => s.referencia === item.reference)!;
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">{catalog.producto}</div>
                            <div className="text-[10px] text-slate-400">
                              {item.quantity} x ${catalog.precio_venta.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-mono font-bold text-slate-700">
                              ${(catalog.precio_venta * item.quantity).toLocaleString()}
                            </span>
                            <button
                              onClick={() => setCartCartItems(cartItems.filter((c) => c.reference !== item.reference))}
                              className="text-red-500 font-bold hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Seleccione productos del catálogo para agregarlos al ticket.
                    </div>
                  )}
                </div>

                {/* Totals */}
                {cartItems.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                      <span className="font-bold text-xs text-red-800">TOTAL FACTURA:</span>
                      <span className="font-mono font-black text-sm text-red-600">
                        ${cartItems.reduce((acc, curr) => {
                          const cat = stockList.find((s) => s.referencia === curr.reference);
                          return acc + (cat ? cat.precio_venta * curr.quantity : 0);
                        }, 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Form of Payment */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight">Forma de Pago</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Efectivo", "Transferencia", "Mixto"].map((method: any) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPosPaymentType(method)}
                            className={`py-1.5 rounded-lg border font-semibold text-[10px] tracking-wide text-center uppercase transition-all ${
                              posPaymentType === method
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-white text-slate-500 border-slate-200"
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      {/* Inputs depending on form of payment */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {(posPaymentType === "Efectivo" || posPaymentType === "Mixto") && (
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Efectivo Recibido ($)</label>
                            <input
                              type="number"
                              min="0"
                              value={posEfectivo || ""}
                              onChange={(e) => setPosEfectivo(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                            />
                          </div>
                        )}
                        {(posPaymentType === "Transferencia" || posPaymentType === "Mixto") && (
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Transferencia Recibida ($)</label>
                            <input
                              type="number"
                              min="0"
                              value={posTransferencia || ""}
                              onChange={(e) => setPosTransferencia(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                            />
                          </div>
                        )}
                      </div>

                      {/* Live customer payment breakdown & change display */}
                      {cartItems.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 font-sans">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-600">Total Entregado por Cliente:</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              ${(posEfectivo + posTransferencia).toLocaleString()}
                            </span>
                          </div>

                          {(() => {
                            const currentCartTotal = cartItems.reduce((acc, curr) => {
                              const cat = stockList.find((s) => s.referencia === curr.reference);
                              return acc + (cat ? cat.precio_venta * curr.quantity : 0);
                            }, 0);
                            const posTotalEntregado = posEfectivo + posTransferencia;
                            const diferencia = posTotalEntregado - currentCartTotal;

                            if (posTotalEntregado === 0) {
                              return (
                                <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200 text-center font-medium">
                                  Ingrese el valor entregado para calcular la devuelta.
                                </div>
                              );
                            }

                            if (diferencia >= 0) {
                              return (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg flex items-center justify-between">
                                  <div className="font-bold text-xs">
                                    {diferencia === 0 ? "Pago Exacto Recibido" : "Devueltas al Cliente:"}
                                  </div>
                                  <div className="font-mono font-bold text-sm text-emerald-700">
                                    ${diferencia.toLocaleString()}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-lg flex items-center justify-between">
                                  <div className="font-bold text-xs">
                                    Saldo Faltante:
                                  </div>
                                  <div className="font-mono font-bold text-sm text-amber-700">
                                    ${Math.abs(diferencia).toLocaleString()}
                                  </div>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckoutCart}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase py-2.5 rounded-lg tracking-wider shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 size={16} />
                      <span>Cerrar y Facturar Venta</span>
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>
      )}

      {/* RENDER PEDIDOS FALTANTES TAB */}
      {activeTab === "pedidos" && pedidosSubTab === "realizados" && (
        <ModuloPedidosSolicitados user={user} db={db} setDb={setDb} />
      )}

      {/* RENDER SALIDA DE REPUESTOS TAB */}
      {activeTab === "salida_repuestos" && (
        <div className="space-y-6 font-sans animate-fade-in">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                  Hoja Maestra ERP
                </span>
                <h3 className="font-bold text-lg text-white">SALIDA DE REPUESTOS</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                Registro oficial de salidas de repuestos del inventario por venta (POS / Venta directa).
                Estructura de 10 columnas (A-J). Fila 2 encabezados, Fila 3+ registros. Cada salida confirmada descuenta el stock del inventario.
              </p>
            </div>
            <button
              onClick={() => setShowManualSalidaModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>+ Registrar Salida de Repuesto</span>
            </button>
          </div>

          {/* Filtering and KPIs */}
          {(() => {
            const filteredSalidas = db.salida_de_repuestos.filter((s) => {
              const matchesSearch =
                s.producto.toLowerCase().includes(salidaSearchTerm.toLowerCase()) ||
                s.referencia.toLowerCase().includes(salidaSearchTerm.toLowerCase()) ||
                s.marca_departamento.toLowerCase().includes(salidaSearchTerm.toLowerCase());

              const matchesForma =
                salidaFilterForma === "TODAS" ||
                s.formas_de_pago.toLowerCase() === salidaFilterForma.toLowerCase();

              const matchesMarca =
                salidaFilterMarca === "TODAS" ||
                s.marca_departamento.toLowerCase() === salidaFilterMarca.toLowerCase();

              const matchesFechaInicio = !salidaFilterFechaInicio || s.fecha >= salidaFilterFechaInicio;
              const matchesFechaFin = !salidaFilterFechaFin || s.fecha <= salidaFilterFechaFin;

              return matchesSearch && matchesForma && matchesMarca && matchesFechaInicio && matchesFechaFin;
            });

            const totalMonto = filteredSalidas.reduce((sum, s) => sum + s.valor_total, 0);
            const totalUnidades = filteredSalidas.reduce((sum, s) => sum + s.cantidad, 0);
            const totalEfectivo = filteredSalidas.reduce((sum, s) => sum + s.efectivo, 0);
            const totalTransferencia = filteredSalidas.reduce((sum, s) => sum + s.transferencia, 0);

            return (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Valor Salidas</p>
                    <p className="text-lg font-black text-slate-800 font-mono mt-1">${totalMonto.toLocaleString()}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">{filteredSalidas.length} registros</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unidades Salientes</p>
                    <p className="text-lg font-black text-slate-800 font-mono mt-1">{totalUnidades.toLocaleString()} uds</p>
                    <span className="text-[10px] text-slate-400 font-semibold">Productos descontados</span>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl">
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Ingresos en Efectivo</p>
                    <p className="text-lg font-black text-emerald-700 font-mono mt-1">${totalEfectivo.toLocaleString()}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">Caja Física</span>
                  </div>

                  <div className="bg-blue-50/60 border border-blue-200/80 p-4 rounded-xl">
                    <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Ingresos Transferencia</p>
                    <p className="text-lg font-black text-blue-700 font-mono mt-1">${totalTransferencia.toLocaleString()}</p>
                    <span className="text-[10px] text-blue-600 font-semibold">Banco / Nequi / Billetera</span>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar por Referencia, Producto o Marca..."
                        value={salidaSearchTerm}
                        onChange={(e) => setSalidaSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <select
                        value={salidaFilterForma}
                        onChange={(e) => setSalidaFilterForma(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                      >
                        <option value="TODAS">Forma de Pago: TODAS</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Mixto">Mixto (Efectivo + Transferencia)</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="date"
                        value={salidaFilterFechaInicio}
                        onChange={(e) => setSalidaFilterFechaInicio(e.target.value)}
                        placeholder="Fecha Inicio"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <input
                        type="date"
                        value={salidaFilterFechaFin}
                        onChange={(e) => setSalidaFilterFechaFin(e.target.value)}
                        placeholder="Fecha Fin"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Official 10-Column Table A to J */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                    <span>Estructura Oficial Excel (Columnas A - J)</span>
                    <span>Fila 2: Encabezados | Fila 3+: Registros ({filteredSalidas.length})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                          <th className="p-3 text-center border-r border-slate-700">A - FECHA</th>
                          <th className="p-3 border-r border-slate-700">B - REFERENCIA</th>
                          <th className="p-3 border-r border-slate-700">C - PRODUCTO</th>
                          <th className="p-3 border-r border-slate-700">D - MARCA / DEPT.</th>
                          <th className="p-3 text-center border-r border-slate-700">E - CANTIDAD</th>
                          <th className="p-3 text-center border-r border-slate-700">F - FORMA DE PAGO</th>
                          <th className="p-3 text-right border-r border-slate-700">G - EFECTIVO</th>
                          <th className="p-3 text-right border-r border-slate-700">H - TRANSFERENCIA</th>
                          <th className="p-3 text-right border-r border-slate-700">I - $PRECIO</th>
                          <th className="p-3 text-right">J - VALOR TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSalidas.length > 0 ? (
                          filteredSalidas.map((item, idx) => {
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-center font-mono text-slate-600 whitespace-nowrap">{item.fecha}</td>
                                <td className="p-3 font-mono font-bold text-red-600 whitespace-nowrap">{item.referencia}</td>
                                <td className="p-3 font-semibold text-slate-800">{item.producto}</td>
                                <td className="p-3 text-slate-600 whitespace-nowrap">{item.marca_departamento}</td>
                                <td className="p-3 text-center font-mono font-bold">
                                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                                    {item.cantidad}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      item.formas_de_pago === "Efectivo"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : item.formas_de_pago === "Transferencia"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-purple-100 text-purple-800"
                                    }`}
                                  >
                                    {item.formas_de_pago}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                                  ${item.efectivo.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-mono font-semibold text-blue-700">
                                  ${item.transferencia.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-600">
                                  ${item.precio.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                                  ${item.valor_total.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={10} className="text-center p-8 text-slate-400 font-bold">
                              No hay registros de salidas de repuestos con los filtros aplicados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* RENDER PRODUCTOS AGOTADOS TAB */}
      {activeTab === "pedidos" && pedidosSubTab === "agotados" && (
        <div className="space-y-4 font-sans animate-fade-in">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Productos Agotados o con Stock Crítico (≤ 3 unidades)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Lista de repuestos y accesorios con stock cero o por debajo de las existencias mínimas de seguridad.
              Presione <strong className="text-red-600 font-bold">Solicitar Pedido</strong> para registrar un encargo preventivo para el Administrador.
            </p>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Referencia</th>
                  <th className="p-4">Repuesto / Accesorio</th>
                  <th className="p-4">Marca / Categoría</th>
                  <th className="p-4 text-center">Stock Actual</th>
                  <th className="p-4 text-right">Precio Unitario</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {outOfStockItems.length > 0 ? (
                  outOfStockItems.map((item, idx) => {
                    const isOutOfStock = item.stock === 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-red-600">{item.referencia}</td>
                        <td className="p-4 font-semibold text-slate-800">{item.producto}</td>
                        <td className="p-4">{item.marca_departamento}</td>
                        <td className="p-4 text-center font-mono font-bold">
                          <span className={isOutOfStock ? "text-red-600 font-black text-xs" : "text-amber-600"}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold">${item.precio_venta.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              isOutOfStock
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isOutOfStock ? "AGOTADO" : "STOCK CRÍTICO"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleSolicitarPedido(item)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-colors uppercase tracking-tight cursor-pointer"
                          >
                            Solicitar Pedido
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-400 font-bold">
                      No hay productos agotados o críticos en el inventario. ¡Excelente gestión de compras!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO CLIENTE (PEDIDO) */}
      {showPedidoAbonoModal && pedidoAbonoIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Registrar Abono de Cliente (Pedido)</h3>
            <p className="text-xs text-slate-500">
              Registre un abono adicional para la reserva del repuesto del cliente. Esto generará un recibo de caja y se registrará en Auditoría.
            </p>
            <form onSubmit={handleSavePedidoAbono} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Número de Recibo *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REC-5912"
                    value={pedidoAbonoRecibo}
                    onChange={(e) => setPedidoAbonoRecibo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-xs font-bold text-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha del Abono *</label>
                  <input
                    type="date"
                    required
                    value={pedidoAbonoFecha}
                    onChange={(e) => setPedidoAbonoFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valor del Abono ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={pedidoAbonoValor || ""}
                  onChange={(e) => setPedidoAbonoValor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Medio de Pago *</label>
                <select
                  value={pedidoAbonoForma}
                  onChange={(e: any) => setPedidoAbonoForma(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold animate-pulse-once"
                >
                  <option value="Efectivo">Efectivo (Ingresa a Caja Física)</option>
                  <option value="Transferencia">Transferencia (Cuenta Bancaria)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={pedidoAbonoObs}
                  onChange={(e) => setPedidoAbonoObs(e.target.value)}
                  placeholder="e.g. Abono por saldo del pedido..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPedidoAbonoModal(false); setPedidoAbonoIdx(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR DEVOLUCION / CANCELACION CLIENTE (PEDIDO) */}
      {showPedidoDevolucionModal && pedidoDevolucionIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-tight">Registrar Devolución / Cancelación de Pedido</h3>
            <p className="text-xs text-slate-500">
              ¿Está seguro de cancelar este pedido? Se actualizará el estado de la reserva a "CANCELADO". Si el cliente realizó abonos, se emitirá un egreso para el reembolso de los fondos.
            </p>
            <form onSubmit={handleSavePedidoDevolucion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Motivo de la Cancelación / Devolución *</label>
                <select
                  required
                  value={pedidoDevolucionMotivo}
                  onChange={(e) => setPedidoDevolucionMotivo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-red-600"
                >
                  <option value="Cancelación por el cliente">Cancelación voluntaria por el cliente</option>
                  <option value="No disponibilidad de producto">No disponibilidad del producto a largo plazo</option>
                  <option value="Garantía / Defecto">Garantía o defecto en el repuesto recibido</option>
                  <option value="Otro motivo">Otro motivo administrativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones / Detalles</label>
                <input
                  type="text"
                  value={pedidoDevolucionObs}
                  onChange={(e) => setPedidoDevolucionObs(e.target.value)}
                  placeholder="Escriba aquí los detalles..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPedidoDevolucionModal(false); setPedidoDevolucionIdx(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Registrar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR SALIDA DIRECTA DE REPUESTOS */}
      {showManualSalidaModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Registrar Salida de Repuesto</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seleccione el producto del inventario o ingrese la referencia. El sistema calculará el total y validará los medios de pago.
              </p>
            </div>

            <form onSubmit={handleSaveManualSalida} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar y Seleccionar Producto del Inventario</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Escriba la referencia o nombre del repuesto..."
                    value={manualSalidaProductSearch}
                    onChange={(e) => setManualSalidaProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                {manualSalidaProductSearch.trim().length > 0 && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto divide-y divide-slate-100 z-10 relative">
                    {stockList
                      .filter(
                        (s) =>
                          s.referencia.toLowerCase().includes(manualSalidaProductSearch.toLowerCase()) ||
                          s.producto.toLowerCase().includes(manualSalidaProductSearch.toLowerCase())
                      )
                      .slice(0, 6)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setManualSalidaRef(item.referencia);
                            setManualSalidaProd(item.producto);
                            setManualSalidaMarca(item.marca_departamento);
                            setManualSalidaPrecio(item.precio_venta);
                            const total = item.precio_venta * manualSalidaQty;
                            if (manualSalidaForma === "Efectivo") {
                              setManualSalidaEfectivo(total);
                              setManualSalidaTransferencia(0);
                            } else if (manualSalidaForma === "Transferencia") {
                              setManualSalidaTransferencia(total);
                              setManualSalidaEfectivo(0);
                            } else {
                              setManualSalidaEfectivo(Math.round(total / 2));
                              setManualSalidaTransferencia(total - Math.round(total / 2));
                            }
                            setManualSalidaProductSearch("");
                          }}
                          className="p-2 hover:bg-slate-50 cursor-pointer text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-mono font-bold text-red-600 mr-2">{item.referencia}</span>
                            <span className="font-semibold text-slate-700">{item.producto}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold mr-2">Stock: {item.stock}</span>
                            <span className="font-mono font-bold text-slate-900">${item.precio_venta.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Operación *</label>
                  <input
                    type="date"
                    required
                    value={manualSalidaFecha}
                    onChange={(e) => setManualSalidaFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Referencia *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REF-102"
                    value={manualSalidaRef}
                    onChange={(e) => {
                      setManualSalidaRef(e.target.value);
                      handleRefAutocomplete(e.target.value, setManualSalidaProd, setManualSalidaPrecio);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs font-bold text-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre / Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Descripción del repuesto"
                    value={manualSalidaProd}
                    onChange={(e) => setManualSalidaProd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Marca / Departamento</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda / Repuestos"
                    value={manualSalidaMarca}
                    onChange={(e) => setManualSalidaMarca(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualSalidaQty || ""}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      setManualSalidaQty(qty);
                      const total = qty * manualSalidaPrecio;
                      if (manualSalidaForma === "Efectivo") {
                        setManualSalidaEfectivo(total);
                        setManualSalidaTransferencia(0);
                      } else if (manualSalidaForma === "Transferencia") {
                        setManualSalidaTransferencia(total);
                        setManualSalidaEfectivo(0);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Unitario ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={manualSalidaPrecio || ""}
                    onChange={(e) => {
                      const pr = parseFloat(e.target.value) || 0;
                      setManualSalidaPrecio(pr);
                      const total = manualSalidaQty * pr;
                      if (manualSalidaForma === "Efectivo") {
                        setManualSalidaEfectivo(total);
                        setManualSalidaTransferencia(0);
                      } else if (manualSalidaForma === "Transferencia") {
                        setManualSalidaTransferencia(total);
                        setManualSalidaEfectivo(0);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700">VALOR TOTAL DE LA OPERACIÓN:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    ${(manualSalidaQty * manualSalidaPrecio).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Forma de Pago *</label>
                  <select
                    value={manualSalidaForma}
                    onChange={(e: any) => {
                      const forma = e.target.value;
                      setManualSalidaForma(forma);
                      const total = manualSalidaQty * manualSalidaPrecio;
                      if (forma === "Efectivo") {
                        setManualSalidaEfectivo(total);
                        setManualSalidaTransferencia(0);
                      } else if (forma === "Transferencia") {
                        setManualSalidaTransferencia(total);
                        setManualSalidaEfectivo(0);
                      } else {
                        setManualSalidaEfectivo(Math.round(total / 2));
                        setManualSalidaTransferencia(total - Math.round(total / 2));
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value="Efectivo">Efectivo Completo</option>
                    <option value="Transferencia">Transferencia Completa</option>
                    <option value="Mixto">Mixto (Efectivo + Transferencia)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Efectivo ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualSalidaEfectivo || ""}
                      onChange={(e) => setManualSalidaEfectivo(parseFloat(e.target.value) || 0)}
                      disabled={manualSalidaForma === "Transferencia"}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Transferencia ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualSalidaTransferencia || ""}
                      onChange={(e) => setManualSalidaTransferencia(parseFloat(e.target.value) || 0)}
                      disabled={manualSalidaForma === "Efectivo"}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Live validation warning */}
                {Math.abs((manualSalidaEfectivo + manualSalidaTransferencia) - (manualSalidaQty * manualSalidaPrecio)) > 0.01 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-bold flex items-center justify-between">
                    <span>⚠️ La suma de pagos no coincide con el Valor Total</span>
                    <span>Diferencia: ${(manualSalidaEfectivo + manualSalidaTransferencia - (manualSalidaQty * manualSalidaPrecio)).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualSalidaModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Confirmar Salida de Repuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR / EDITAR LLEGADA DE INVENTARIO */}
      {showAddLlegadaForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                  {editingArrivalIndex !== null ? "Editar Registro de Llegada" : "Registrar Llegada de Inventario"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingrese los datos del producto recibido. El sistema calculará automáticamente el valor total.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowLlegadaForm(false); setEditingArrivalIndex(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArrival} className="space-y-4">
              {/* Product Autocomplete Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Buscar Producto Existente en Inventario (Opcional)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Escriba la referencia o nombre para autocompletar..."
                    onChange={(e) => {
                      const query = e.target.value;
                      handleRefAutocomplete(
                        query,
                        setArrName,
                        setArrPrice,
                        setArrDept,
                        setArrTipoMoto
                      );
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Recepción (Col A) *</label>
                  <input
                    type="date"
                    required
                    value={arrFecha}
                    onChange={(e) => setArrFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Referencia (Col B) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REF-101"
                    value={arrRef}
                    onChange={(e) => {
                      setArrRef(e.target.value);
                      handleRefAutocomplete(
                        e.target.value,
                        setArrName,
                        setArrPrice,
                        setArrDept,
                        setArrTipoMoto
                      );
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-xs font-bold text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Producto / Repuesto (Col C) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aceite 4T 1L Multigrado"
                  value={arrName}
                  onChange={(e) => setArrName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Motocicleta (Col D)</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda CB 125F / Universal"
                    value={arrTipoMoto}
                    onChange={(e) => setArrTipoMoto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Marca / Departamento (Col E) *</label>
                  <select
                    value={arrDept}
                    onChange={(e) => setArrDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="AKT">AKT</option>
                    <option value="Genérico">Genérico</option>
                    <option value="Lubricantes">Lubricantes</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad (Col F) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={arrQty || ""}
                    onChange={(e) => setArrQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Venta (Col G) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={arrPrice || ""}
                    onChange={(e) => setArrPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Total (Col H)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-black text-slate-900">
                    ${(arrQty * arrPrice).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmación de Llegada (Col I) *</label>
                <select
                  value={arrArrivalState}
                  onChange={(e: any) => setArrArrivalState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="PENDIENTE">PENDIENTE (Requiere Verificación Física para Sumar Stock)</option>
                  <option value="CONFIRMADA">CONFIRMADA (Ingresa Inmediatamente al Stock)</option>
                  <option value="CON NOVEDAD">CON NOVEDAD (Verificado con Diferencias/Observación)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowLlegadaForm(false); setEditingArrivalIndex(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  {editingArrivalIndex !== null ? "Guardar Cambios" : "Guardar Llegada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO PROVEEDOR */}
      {showAbonarModal && abonarIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Registrar Abono a Proveedor</h3>
            <p className="text-xs text-slate-500">
              Registre un abono al proveedor para el pago de esta llegada de mercancía.
            </p>
            <form onSubmit={handleSaveAbono} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha del Abono *</label>
                <input
                  type="date"
                  required
                  value={abonoFecha}
                  onChange={(e) => setAboFecha(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valor del Abono ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={abonoValor || ""}
                  onChange={(e) => setAboValor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Medio de Pago *</label>
                <select
                  value={abonoForma}
                  onChange={(e) => setAboForma(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={abonoObs}
                  onChange={(e) => setAboObs(e.target.value)}
                  placeholder="Detalles del pago..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAbonarModal(false); setAbonarIdx(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR DEVOLUCION PROVEEDOR */}
      {showDevolucionModal && devolucionIdx !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-tight">Registrar Devolución a Proveedor</h3>
            <p className="text-xs text-slate-500">
              Devolución de unidades defectuosas o erróneas al proveedor para el producto <strong className="text-slate-800">{devProd}</strong>.
            </p>
            <form onSubmit={handleSaveDevolucion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad a Devolver *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={devQty || ""}
                  onChange={(e) => setDevQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Motivo de Devolución *</label>
                <select
                  required
                  value={devMotivo}
                  onChange={(e) => setDevMotivo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-red-600"
                >
                  <option value="">Seleccione un motivo...</option>
                  <option value="Producto Defectuoso / Dañado">Producto Defectuoso / Dañado</option>
                  <option value="Referencia Incorrecta">Referencia Incorrecta</option>
                  <option value="Empaque Averiado">Empaque Averiado</option>
                  <option value="Exceso de Inventario">Exceso de Inventario enviado</option>
                  <option value="Otro Motivo">Otro Motivo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={devObs}
                  onChange={(e) => setDevObs(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDevolucionModal(false); setDevolucionIdx(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Confirmar Devolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
