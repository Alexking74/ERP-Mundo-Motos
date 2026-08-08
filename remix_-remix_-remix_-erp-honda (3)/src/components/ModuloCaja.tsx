import React, { useState } from "react";
import { Plus, Search, Calendar, ChevronLeft, Wallet, TrendingUp, TrendingDown, CheckSquare, BarChart3, AlertCircle, Edit, Trash2, Receipt } from "lucide-react";
import { DatabaseState, Usuario, Recibo, SalidaExterna, CorteDeVenta } from "../types";
import { getTodayDateString, registrarEvento } from "../utils/db";
import ModuloGastos from "./ModuloGastos";

interface CajaProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
}

export default function ModuloCaja({ user, db, setDb }: CajaProps) {
  const [activeSubTab, setActiveSubTab] = useState<"recibos" | "salidas" | "gastos" | "cortes">("recibos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSalidaForm, setShowSalidaForm] = useState(false);
  const [showCorteForm, setShowCorteForm] = useState(false);

  // Form Recibo states
  const [showReciboForm, setShowReciboForm] = useState(false);
  const [editingRecibo, setEditingRecibo] = useState<Recibo | null>(null);
  const [reciboFecha, setReciboFecha] = useState(getTodayDateString());
  const [reciboNumero, setReciboNumero] = useState("");
  const [reciboAsignarManual, setReciboAsignarManual] = useState(false);
  const [reciboPertenencia, setReciboPertenencia] = useState("");
  const [reciboConcepto, setReciboConcepto] = useState("");
  const [reciboTipo, setReciboTipo] = useState<"entrada" | "salida">("entrada");
  const [reciboValor, setReciboValor] = useState(0);
  const [reciboEstadosAdicionales, setReciboEstadosAdicionales] = useState("ACTIVO");

  const generarNumeroReciboAuto = () => {
    const numeros = db.recibos
      .map((r) => parseInt(r.numero_recibo))
      .filter((num) => !isNaN(num));
    if (numeros.length > 0) {
      const max = Math.max(...numeros);
      return String(max + 1);
    }
    return String(Math.floor(10000 + Math.random() * 90000));
  };

  const resetReciboForm = () => {
    setEditingRecibo(null);
    setReciboFecha(getTodayDateString());
    setReciboNumero("");
    setReciboAsignarManual(false);
    setReciboPertenencia("");
    setReciboConcepto("");
    setReciboTipo("entrada");
    setReciboValor(0);
    setReciboEstadosAdicionales("ACTIVO");
  };

  const startEditRecibo = (recibo: Recibo) => {
    setEditingRecibo(recibo);
    setReciboFecha(recibo.fecha);
    setReciboNumero(recibo.numero_recibo);
    setReciboAsignarManual(true);
    setReciboPertenencia(recibo.recibo_de_pertenencia);
    setReciboConcepto(recibo.concepto);
    if (recibo.entrada > 0) {
      setReciboTipo("entrada");
      setReciboValor(recibo.entrada);
    } else {
      setReciboTipo("salida");
      setReciboValor(recibo.salida);
    }
    setReciboEstadosAdicionales(recibo.estados_adicionales || "ACTIVO");
    setShowReciboForm(true);
  };

  const handleSaveRecibo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reciboPertenencia || !reciboConcepto || reciboValor <= 0) {
      alert("Por favor complete todos los campos obligatorios (*) y asigne un valor mayor a 0.");
      return;
    }

    let finalNumero = "";
    if (reciboAsignarManual) {
      if (!reciboNumero.trim()) {
        alert("Por favor ingrese el número de recibo manual.");
        return;
      }
      finalNumero = reciboNumero.trim();

      const isDuplicate = db.recibos.some(
        (r) => r.numero_recibo.toLowerCase() === finalNumero.toLowerCase() && (!editingRecibo || editingRecibo.numero_recibo !== r.numero_recibo)
      );
      if (isDuplicate) {
        alert("El número de recibo ya existe en el sistema.");
        return;
      }
    } else {
      if (editingRecibo) {
        finalNumero = editingRecibo.numero_recibo;
      } else {
        finalNumero = generarNumeroReciboAuto();
      }
    }

    const valueEntry = reciboTipo === "entrada" ? reciboValor : 0;
    const valueExit = reciboTipo === "salida" ? reciboValor : 0;

    const savedRecibo: Recibo = {
      fecha: reciboFecha,
      numero_recibo: finalNumero,
      recibo_de_pertenencia: reciboPertenencia,
      concepto: reciboConcepto,
      entrada: valueEntry,
      salida: valueExit,
      estados_adicionales: reciboEstadosAdicionales || "ACTIVO"
    };

    let updatedDb = { ...db };
    if (editingRecibo) {
      updatedDb.recibos = db.recibos.map((r) => r.numero_recibo === editingRecibo.numero_recibo ? savedRecibo : r);
      updatedDb = registrarEvento(
        updatedDb,
        user,
        "CAJA Y MOVIMIENTOS",
        "Editar Recibo",
        "AMARILLA",
        "Recibo",
        editingRecibo.numero_recibo,
        finalNumero,
        `Se editó el recibo #${editingRecibo.numero_recibo} (Titular: ${reciboPertenencia}, Concepto: ${reciboConcepto}, Valor: $${reciboValor})`
      );
    } else {
      updatedDb.recibos = [savedRecibo, ...db.recibos];
      updatedDb = registrarEvento(
        updatedDb,
        user,
        "CAJA Y MOVIMIENTOS",
        "Crear Recibo",
        "AMARILLA",
        "Recibo",
        "",
        finalNumero,
        `Se creó un nuevo recibo #${finalNumero} (Titular: ${reciboPertenencia}, Concepto: ${reciboConcepto}, Tipo: ${reciboTipo}, Valor: $${reciboValor})`
      );
    }

    setDb(updatedDb);
    setShowReciboForm(false);
    resetReciboForm();
    alert(editingRecibo ? "Recibo modificado exitosamente." : `Recibo #${finalNumero} creado con éxito.`);
  };

  const handleDeleteRecibo = (recibo: Recibo) => {
    if (user.rol !== "Administrador") {
      alert("Acceso denegado: Solo el Administrador general puede eliminar recibos del sistema.");
      return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar permanentemente el recibo #${recibo.numero_recibo}? Esta acción no se puede deshacer.`)) {
      return;
    }

    const valueStr = recibo.entrada > 0 ? `Entrada $${recibo.entrada}` : `Salida $${recibo.salida}`;
    let updatedDb = { ...db };
    updatedDb.recibos = db.recibos.filter((r) => r.numero_recibo !== recibo.numero_recibo);
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "CAJA Y MOVIMIENTOS",
      "Eliminar Recibo",
      "ROJA",
      "Recibo",
      recibo.numero_recibo,
      "",
      `Se eliminó permanentemente el recibo #${recibo.numero_recibo} (Titular: ${recibo.recibo_de_pertenencia}, Concepto: ${recibo.concepto}, Valor: ${valueStr})`
    );

    setDb(updatedDb);
    alert(`Recibo #${recibo.numero_recibo} eliminado exitosamente de los registros.`);
  };

  // Form Salida Externa states
  const [salidaType, setSalidaType] = useState<"Consignación" | "Gasto">("Consignación");
  const [salidaCuenta, setSalidaCuenta] = useState("Servicio de Energía Eléctrica (Luz)");
  const [otraCuentaManual, setOtraCuentaManual] = useState("");
  const [salidaOperacion, setSalidaOperacion] = useState("");
  const [salidaGastoConcepto, setSalidaGastoConcepto] = useState("Papelería");
  const [salidaValor, setSalidaValor] = useState(0);

  // Form Corte de Caja states
  const [corteFecha, setCorteFecha] = useState(getTodayDateString());
  const [corteSobrante, setCorteSobrante] = useState(0);
  const [corteFaltante, setCorteFaltante] = useState(0);

  // Cortes de Ventas listing, filter & detail states
  const [corteSearchTerm, setCorteSearchTerm] = useState("");
  const [corteFilterStatus, setCorteFilterStatus] = useState<"TODOS" | "SOBRANTE" | "FALTANTE" | "CUADRADO">("TODOS");
  const [corteFechaInicio, setCorteFechaInicio] = useState("");
  const [corteFechaFin, setCorteFechaFin] = useState("");
  const [selectedCorteDetail, setSelectedCorteDetail] = useState<CorteDeVenta | null>(null);

  // Save Salida Externa (Gasto Mayor o Gasto Menor)
  const handleSaveSalida = (e: React.FormEvent) => {
    e.preventDefault();
    if (salidaValor <= 0) {
      alert("El valor de la transacción debe ser mayor a cero.");
      return;
    }

    if (salidaType === "Consignación" && !salidaOperacion) {
      alert("El número de recibo/comprobante es obligatorio para registrar gastos mayores.");
      return;
    }

    // Uniqueness validation on receipts
    if (salidaType === "Consignación") {
      const isDuplicate = db.salidas_externas.some(
        (s) => s.operacion.toLowerCase() === salidaOperacion.toLowerCase() && s.operacion !== ""
      );
      if (isDuplicate) {
        alert("ALERTA ROJA: El número de recibo/comprobante ya existe en el sistema.");
        return;
      }
    }

    const newSalida: SalidaExterna = {
      fecha: getTodayDateString(),
      cuenta: salidaType === "Consignación" ? (salidaCuenta === "Otra razón" ? otraCuentaManual : salidaCuenta) : "Caja Principal (Gastos Menores)",
      operacion: salidaType === "Consignación" ? salidaOperacion : `REC-${Math.floor(100 + Math.random() * 900)}`,
      valor_consignacion: salidaType === "Consignación" ? salidaValor : 0,
      otros_gastos: salidaType === "Gasto" ? salidaGastoConcepto : "",
      valor_gasto: salidaType === "Gasto" ? salidaValor : 0
    };

    let updatedDb = { ...db, salidas_externas: [newSalida, ...db.salidas_externas] };

    // Automatization: write transaction to official RECIBOS list
    const recNo = String(Math.floor(1000 + Math.random() * 9000));
    const newRec: Recibo = {
      fecha: getTodayDateString(),
      numero_recibo: recNo,
      recibo_de_pertenencia: salidaType === "Consignación" ? `Egreso Sede ${user.sede}` : "Administración / Caja Chica",
      concepto: salidaType === "Consignación" ? `Gasto Mayor (${salidaCuenta === "Otra razón" ? otraCuentaManual : salidaCuenta}) Comprobante: ${salidaOperacion}` : `Gasto Menor: ${salidaGastoConcepto}`,
      entrada: 0,
      salida: salidaValor
    };
    updatedDb.recibos = [newRec, ...updatedDb.recibos];

    // Check if expense exceeds $500,000 for critical security auditing
    const exceedsLimit = salidaType === "Gasto" && salidaValor > 500000;
    
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "SALIDAS EXTERNAS",
      "Crear",
      exceedsLimit ? "ROJA" : "AMARILLA",
      salidaType,
      "",
      String(salidaValor),
      `Se registró una salida de caja de tipo ${salidaType} por valor de $${salidaValor}.` + 
      (exceedsLimit ? " ¡ALERTA: Gasto excede límite de $500.000!" : "")
    );

    setDb(updatedDb);
    setShowSalidaForm(false);
    setSalidaValor(0);
    setSalidaOperacion("");
    alert("Salida de caja registrada y asentada en el libro de recibos.");
  };

  // Automated calculator for Cortes de Ventas details for selected date
  const calcularDetalleCorte = (fecha: string) => {
    // 1. Fetch closing cash balance from previous cut
    let baseDelDia = 3200000; // default initial if first time
    if (db.cortes_de_ventas && db.cortes_de_ventas.length > 0) {
      // Sort cuts chronologically and find previous
      const sortedCuts = [...db.cortes_de_ventas].sort((a, b) => a.fecha.localeCompare(b.fecha));
      const matchIndex = sortedCuts.findIndex((c) => c.fecha === fecha);
      if (matchIndex > 0) {
        baseDelDia = sortedCuts[matchIndex - 1].valor_total;
      } else if (sortedCuts.length > 0) {
        baseDelDia = sortedCuts[sortedCuts.length - 1].valor_total;
      }
    }

    // 2. Parts cash and transfer calculations (POS / Repuestos)
    let partsCash = 0;
    let partsTransfer = 0;
    (db.salida_de_repuestos || []).forEach((sale) => {
      if (sale.fecha === fecha) {
        partsCash += sale.efectivo || 0;
        partsTransfer += sale.transferencia || 0;
      }
    });

    // 3. Motorcycles cash, transfer and credit calculations (Actas, Recibos)
    let motoCash = 0;
    let motoTransfer = 0;
    let motoCredits = 0;

    // Set of actas on this date to prevent double counting if receipts also exist on same date
    const actasTodaySet = new Set<string>();

    (db.actas || []).forEach((acta) => {
      if (acta.fecha === fecha) {
        motoCash += acta.efectivo || 0;
        motoTransfer += acta.transferencia || 0;
        motoCredits += acta.desembolso || 0;
        if (acta.acta) actasTodaySet.add(acta.acta.toLowerCase());
      }
    });

    // Add abonos made via receipts today (excluding those tied to an acta created on the exact same date to prevent double counting)
    (db.recibos || []).forEach((rec) => {
      if (rec.fecha === fecha && rec.entrada > 0) {
        const isActaToday = rec.concepto && Array.from(actasTodaySet).some(aNo => rec.concepto.toLowerCase().includes(aNo));
        if (!isActaToday) {
          if (rec.concepto.toLowerCase().includes("preventa") || rec.concepto.toLowerCase().includes("reserva") || rec.concepto.toLowerCase().includes("abono") || rec.concepto.toLowerCase().includes("cuota")) {
            motoCash += rec.entrada;
          }
        }
      }
    });

    // 4. Salidas totales & Gastos from Salidas Externas & Devoluciones for this date
    let outTotals = 0; // Consignations (salidas)
    let gastosTotales = 0; // Expenses (gastos)

    (db.salidas_externas || []).forEach((out) => {
      if (out.fecha === fecha) {
        outTotals += out.valor_consignacion || 0;
        gastosTotales += out.valor_gasto || 0;
      }
    });

    // Include official GASTOS sheet entries
    (db.gastos || []).forEach((gasto) => {
      if (gasto.fecha === fecha) {
        gastosTotales += (gasto.valor || 0) + (gasto.valor_otros || 0);
      }
    });

    // Include refunds from Devoluciones if money was paid out on this date
    (db.devoluciones || []).forEach((dev) => {
      if (dev.fecha_devolucion === fecha && (dev.estado_devolucion === "PROCESADA" || dev.estado_devolucion === "AUTORIZADA")) {
        outTotals += dev.valor_devuelto || 0;
      }
    });

    const expectedTotal = baseDelDia + partsCash + partsTransfer + motoCash + motoTransfer + motoCredits - outTotals - gastosTotales;

    return {
      baseDelDia,
      partsCash,
      partsTransfer,
      motoCash,
      motoTransfer,
      motoCredits,
      outTotals,
      gastosTotales,
      expectedTotal
    };
  };

  const handleSaveCorte = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if cut already exists for selected date
    const alreadyExists = db.cortes_de_ventas.some((c) => c.fecha === corteFecha);
    if (alreadyExists) {
      alert("ALERTA ROJA: Ya existe un corte de caja cerrado para la fecha seleccionada.");
      return;
    }

    const { baseDelDia, partsCash, partsTransfer, motoCash, motoTransfer, motoCredits, outTotals, gastosTotales, expectedTotal } = calcularDetalleCorte(corteFecha);

    const ticketNo = String(db.cortes_de_ventas.length + 101);
    const finalValorTotal = expectedTotal + corteSobrante - corteFaltante;

    const newCorte: CorteDeVenta = {
      ticket: ticketNo,
      fecha: corteFecha,
      base_del_dia: baseDelDia,
      entrada_efectivo_repuestos: partsCash,
      entrada_transferencia_repuestos: partsTransfer,
      entrada_efectivo_motos: motoCash,
      entrada_transferencia_motos: motoTransfer,
      entrada_estudios_motos: motoCredits,
      salidas_totales: outTotals,
      gastos_totales: gastosTotales,
      sobrante: corteSobrante,
      faltante: corteFaltante,
      valor_total: finalValorTotal,
      identidad: user.documento || user.nombre_completo
    };

    let updatedDb = { ...db, cortes_de_ventas: [newCorte, ...db.cortes_de_ventas] };

    // Log cut event
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "CORTES DE VENTAS",
      "Cerrar Caja",
      "AMARILLA",
      "Caja",
      String(baseDelDia),
      String(finalValorTotal),
      `Cierre diario de caja #${ticketNo} realizado exitosamente para fecha ${corteFecha}.`
    );

    setDb(updatedDb);
    setShowCorteForm(false);
    setCorteSobrante(0);
    setCorteFaltante(0);
    alert(`Arqueo de caja #${ticketNo} cerrado exitosamente. Saldo final: $${finalValorTotal.toLocaleString()}`);
  };

  // Filter Recibos
  const filteredRecibos = db.recibos.filter((r) => {
    return r.numero_recibo.includes(searchTerm) ||
           r.recibo_de_pertenencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.concepto.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeCorteData = calcularDetalleCorte(corteFecha);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in">
      
      {/* Caja subnavigation tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Módulo Caja y Movimientos</h2>
          <p className="text-xs text-slate-500 mt-1">
            Control de arqueo de caja diario, registro oficial de recibos e ingresos/salidas secundarias.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg space-x-1 self-start">
          <button
            onClick={() => { setActiveSubTab("recibos"); setShowSalidaForm(false); setShowCorteForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all ${
              activeSubTab === "recibos" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Libro de Recibos
          </button>
          <button
            onClick={() => { setActiveSubTab("salidas"); setShowSalidaForm(false); setShowCorteForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all ${
              activeSubTab === "salidas" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Salidas Externas
          </button>
          <button
            onClick={() => { setActiveSubTab("gastos"); setShowSalidaForm(false); setShowCorteForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all flex items-center space-x-1 ${
              activeSubTab === "gastos" ? "bg-white text-red-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt size={13} />
            <span>Hoja Gastos ERP</span>
          </button>
          <button
            onClick={() => { setActiveSubTab("cortes"); setShowSalidaForm(false); setShowCorteForm(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-tight transition-all ${
              activeSubTab === "cortes" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Arqueo / Cierre Diario
          </button>
        </div>
      </div>

      {/* RENDER LIBRO RECIBOS */}
      {activeSubTab === "recibos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por recibo, cliente o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            {!showReciboForm && (
              <button
                onClick={() => { resetReciboForm(); setShowReciboForm(true); }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-center"
              >
                <Plus size={14} />
                <span>Nuevo Recibo</span>
              </button>
            )}
          </div>

          {showReciboForm ? (
            <form onSubmit={handleSaveRecibo} className="space-y-4 max-w-lg bg-slate-50 p-6 rounded-xl border border-slate-100 animate-fade-in font-sans">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingRecibo ? `Editar Recibo #${editingRecibo.numero_recibo}` : "Registrar Nuevo Recibo de Caja"}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha del Movimiento *</label>
                  <input
                    type="date"
                    required
                    value={reciboFecha}
                    onChange={(e) => setReciboFecha(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Movimiento *</label>
                  <select
                    value={reciboTipo}
                    onChange={(e) => setReciboTipo(e.target.value as "entrada" | "salida")}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  >
                    <option value="entrada">Entrada (Ingreso de dinero)</option>
                    <option value="salida">Salida (Egreso de dinero)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Número de Recibo</label>
                {!editingRecibo && (
                  <div className="mb-2">
                    <label className="inline-flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reciboAsignarManual}
                        onChange={(e) => {
                          setReciboAsignarManual(e.target.checked);
                          if (!e.target.checked) setReciboNumero("");
                        }}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span className="text-xs font-medium text-slate-700">Usar número manual</span>
                    </label>
                  </div>
                )}
                {reciboAsignarManual || editingRecibo ? (
                  <input
                    type="text"
                    required
                    value={reciboNumero}
                    onChange={(e) => setReciboNumero(e.target.value)}
                    placeholder="Escriba el número de recibo manual autorizado"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-hidden"
                    disabled={!!editingRecibo}
                  />
                ) : (
                  <input
                    type="text"
                    disabled
                    value="(Se generará automáticamente al guardar)"
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 font-medium italic"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Recibo de Pertenencia (Titular/Cliente) *</label>
                <input
                  type="text"
                  required
                  value={reciboPertenencia}
                  onChange={(e) => setReciboPertenencia(e.target.value)}
                  placeholder="Ej: Cliente Juan Pérez, Taller Repuestos, etc."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Concepto / Motivo Detallado *</label>
                <textarea
                  required
                  value={reciboConcepto}
                  onChange={(e) => setReciboConcepto(e.target.value)}
                  placeholder="Describa claramente el motivo del ingreso o egreso de caja..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Valor de la Transacción ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={reciboValor || ""}
                    onChange={(e) => setReciboValor(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estados / Adicionales</label>
                  <input
                    type="text"
                    value={reciboEstadosAdicionales}
                    onChange={(e) => setReciboEstadosAdicionales(e.target.value)}
                    placeholder="Ej: ACTIVO, DEVUELTO, ANULADO"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowReciboForm(false); resetReciboForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs"
                >
                  {editingRecibo ? "Guardar Cambios" : "Guardar Recibo"}
                </button>
              </div>
            </form>
          ) : (
            <div className="border border-slate-100 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Número Recibo</th>
                    <th className="p-4">Recibo Pertenencia (Titular)</th>
                    <th className="p-4">Concepto / Motivo</th>
                    <th className="p-4 text-right text-green-600">Entrada (Ingreso)</th>
                    <th className="p-4 text-right text-red-600">Salida (Egreso)</th>
                    <th className="p-4 text-center">Estados / Adicionales</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecibos.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 whitespace-nowrap">{item.fecha}</td>
                      <td className="p-4 font-mono font-bold text-red-600">{item.numero_recibo}</td>
                      <td className="p-4 font-semibold text-slate-800">{item.recibo_de_pertenencia}</td>
                      <td className="p-4">{item.concepto}</td>
                      <td className="p-4 text-right font-mono font-semibold text-green-600">
                        {item.entrada > 0 ? `$${item.entrada.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-red-600">
                        {item.salida > 0 ? `$${item.salida.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700 uppercase">
                          {item.estados_adicionales || "ACTIVO"}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => startEditRecibo(item)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar Recibo"
                          >
                            <Edit size={14} />
                          </button>
                          {user.rol === "Administrador" && (
                            <button
                              onClick={() => handleDeleteRecibo(item)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Eliminar Recibo (Permisos de Admin)"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RENDER SALIDAS EXTERNAS */}
      {activeSubTab === "salidas" && (
        <div className="space-y-4">
          {!showSalidaForm ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-sm">Registro de Salidas de Caja Extraordinarias</h3>
                <button
                  onClick={() => setShowSalidaForm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Plus size={14} />
                  <span>Registrar Movimiento Egreso</span>
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="p-4">Fecha</th>
                      <th className="p-4">Tipo Egreso</th>
                      <th className="p-4">Razón / Detalle (Mayor)</th>
                      <th className="p-4">Comprobante / Recibo</th>
                      <th className="p-4">Gasto Menor</th>
                      <th className="p-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {db.salidas_externas.map((item, idx) => {
                      const isCons = item.valor_consignacion > 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">{item.fecha}</td>
                          <td className="p-4 font-semibold text-slate-800">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${isCons ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}>
                              {isCons ? "GASTO MAYOR" : "GASTO MENOR"}
                            </span>
                          </td>
                          <td className="p-4">{isCons ? item.cuenta : "-"}</td>
                          <td className="p-4 font-mono text-slate-500">{item.operacion || "-"}</td>
                          <td className="p-4 font-semibold text-slate-800">{item.otros_gastos || "-"}</td>
                          <td className="p-4 text-right font-mono font-bold text-red-600">
                            ${(isCons ? item.valor_consignacion : item.valor_gasto).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>
          ) : (
            <form onSubmit={handleSaveSalida} className="space-y-4 max-w-lg bg-slate-50 p-6 rounded-xl border border-slate-100 animate-fade-in">
              <h3 className="font-bold text-slate-800 text-sm">Registrar Salida / Egreso Extraordinario</h3>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                Nota: Esta sección registra egresos reales de caja (no consignaciones bancarias). Alude a gastos mayores del negocio o gastos menores operativos.
              </p>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Egreso / Gasto *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSalidaType("Consignación");
                      setSalidaCuenta("Servicio de Energía Eléctrica (Luz)");
                    }}
                    className={`py-2 px-1 rounded-lg font-bold text-[10px] sm:text-xs uppercase transition-all ${
                      salidaType === "Consignación" ? "bg-red-600 text-white" : "bg-white text-slate-500 border border-slate-200"
                    }`}
                  >
                    Gasto Mayor (Luz, Agua, Sede)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSalidaType("Gasto");
                    }}
                    className={`py-2 px-1 rounded-lg font-bold text-[10px] sm:text-xs uppercase transition-all ${
                      salidaType === "Gasto" ? "bg-red-600 text-white" : "bg-white text-slate-500 border border-slate-200"
                    }`}
                  >
                    Gastos Menores / Otros
                  </button>
                </div>
              </div>

              {salidaType === "Consignación" ? (
                /* Major expense fields */
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Razón / Concepto de Gasto Mayor *</label>
                    <select
                      value={salidaCuenta}
                      onChange={(e) => setSalidaCuenta(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-bold"
                    >
                      <option value="Servicio de Energía Eléctrica (Luz)">Servicio de Energía Eléctrica (Luz)</option>
                      <option value="Servicio de Agua / Acueducto">Servicio de Agua / Acueducto</option>
                      <option value="Servicio de Internet / Comunicaciones">Servicio de Internet / Comunicaciones</option>
                      <option value="Arrendamiento / Alquiler Sede">Arrendamiento / Alquiler Sede</option>
                      <option value="Pago Proveedor Fanalca">Pago Proveedor Fanalca</option>
                      <option value="Otra razón">Otra razón / gasto mayor...</option>
                    </select>
                  </div>
                  {salidaCuenta === "Otra razón" && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Describa la otra razón *</label>
                      <input
                        type="text"
                        required
                        value={otraCuentaManual}
                        onChange={(e) => setOtraCuentaManual(e.target.value)}
                        placeholder="Descripción del gasto mayor"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Número de Recibo / Comprobante de Pago *</label>
                    <input
                      type="text"
                      required
                      value={salidaOperacion}
                      onChange={(e) => setSalidaOperacion(e.target.value)}
                      placeholder="e.g. REC-5920 o N° Factura"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                    />
                  </div>
                </div>
              ) : (
                /* Minor expense fields */
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Concepto Gasto Menor / Otros *</label>
                    <select
                      value={salidaGastoConcepto}
                      onChange={(e) => setSalidaGastoConcepto(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                    >
                      <option value="Papelería">Papelería / Útiles de oficina</option>
                      <option value="Aseo">Insumos de Aseo / Limpieza</option>
                      <option value="Café">Cafetería / Alimentación</option>
                      <option value="Parqueadero">Parqueadero</option>
                      <option value="Almuerzo">Almuerzos autorizados</option>
                      <option value="Mensajería">Servicio de Mensajería / Taxi</option>
                      <option value="Otros Gastos Menores">Otros Gastos Menores</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valor de la Transacción ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={salidaValor || ""}
                  onChange={(e) => setSalidaValor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold"
                />
              </div>

              {salidaType === "Gasto" && salidaValor > 500000 && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-xs">
                  <AlertCircle size={16} />
                  <span>ALERTA: Los gastos mayores a $500.000 generarán auditoría y un Evento Rojo inmutable.</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSalidaForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs"
                >
                  Confirmar Salida
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* RENDER HOJA GASTOS ERP */}
      {activeSubTab === "gastos" && (
        <ModuloGastos user={user} db={db} setDb={setDb} />
      )}

      {/* RENDER ARQUEO / CORTES DE CAJA */}
      {activeSubTab === "cortes" && (
        <div className="space-y-4">
          {!showCorteForm ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">CORTES DE VENTAS — Consolidación Económica Diaria</h3>
                  <p className="text-xs text-slate-500">Conciliación de entradas, salidas, gastos, sobrantes y faltantes de caja.</p>
                </div>
                <button
                  onClick={() => setShowCorteForm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 self-end sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Realizar Arqueo y Cierre Diario</span>
                </button>
              </div>

              {/* KPI Summary Cards for Cortes de Ventas */}
              {(() => {
                const cortesList = db.cortes_de_ventas || [];
                const totalEntradas = cortesList.reduce((acc, c) => 
                  acc + (c.base_del_dia || 0) + (c.entrada_efectivo_repuestos || 0) + (c.entrada_transferencia_repuestos || 0) + 
                  (c.entrada_efectivo_motos || 0) + (c.entrada_transferencia_motos || 0) + (c.entrada_estudios_motos || 0), 0);
                const totalSalidasGastos = cortesList.reduce((acc, c) => acc + (c.salidas_totales || 0) + (c.gastos_totales || 0), 0);
                const totalFaltantes = cortesList.reduce((acc, c) => acc + (c.faltante || 0), 0);
                const totalSaldoCaja = cortesList.reduce((acc, c) => acc + (c.valor_total || 0), 0);

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tot. Entradas Conciliadas</div>
                      <div className="text-sm font-bold font-mono text-green-700 mt-1">${totalEntradas.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Salidas & Gastos</div>
                      <div className="text-sm font-bold font-mono text-red-600 mt-1">${totalSalidasGastos.toLocaleString()}</div>
                    </div>
                    <div className={`border p-3 rounded-xl ${totalFaltantes > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                        <span>Faltantes Auditados</span>
                        {totalFaltantes > 0 && <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">ALERTA</span>}
                      </div>
                      <div className={`text-sm font-bold font-mono mt-1 ${totalFaltantes > 0 ? "text-red-700" : "text-slate-600"}`}>
                        ${totalFaltantes.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xs">
                      <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Saldo Final Consolidado</div>
                      <div className="text-sm font-bold font-mono text-amber-400 mt-1">${totalSaldoCaja.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Filters & Search Bar for Cortes */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por #Ticket, Fecha o Usuario..."
                      value={corteSearchTerm}
                      onChange={(e) => setCorteSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="flex items-center space-x-1 text-slate-600 font-medium">
                    <span>Estado:</span>
                    <select
                      value={corteFilterStatus}
                      onChange={(e) => setCorteFilterStatus(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden"
                    >
                      <option value="TODOS">Todos los Cortes</option>
                      <option value="CUADRADO">Sin Diferencias (Cuadrados)</option>
                      <option value="SOBRANTE">Con Sobrante (+)</option>
                      <option value="FALTANTE">Con Faltante (-)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1 text-slate-600 font-medium">
                    <span>Desde:</span>
                    <input
                      type="date"
                      value={corteFechaInicio}
                      onChange={(e) => setCorteFechaInicio(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
                    />
                    <span>Hasta:</span>
                    <input
                      type="date"
                      value={corteFechaFin}
                      onChange={(e) => setCorteFechaFin(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
                    />
                  </div>

                  {(corteSearchTerm || corteFilterStatus !== "TODOS" || corteFechaInicio || corteFechaFin) && (
                    <button
                      onClick={() => {
                        setCorteSearchTerm("");
                        setCorteFilterStatus("TODOS");
                        setCorteFechaInicio("");
                        setCorteFechaFin("");
                      }}
                      className="text-xs text-red-600 underline font-medium hover:text-red-800 ml-1"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Complete 13 Columns Table (A through M) */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-2.5 whitespace-nowrap text-center">Col A<br/>#TIQUE</th>
                      <th className="p-2.5 whitespace-nowrap">Col B<br/>FECHA</th>
                      <th className="p-2.5 whitespace-nowrap text-right">Col C<br/>BASE DÍA</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-green-700">Col D<br/>EFEC. REP.</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-green-700">Col E<br/>TRANSF. REP.</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-green-700">Col F<br/>EFEC. MOTOS</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-green-700">Col G<br/>TRANSF. MOTOS</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-blue-700">Col H<br/>ESTUDIOS MOTOS</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-red-600">Col I<br/>SALIDAS TOT.</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-red-600">Col J<br/>GASTOS TOT.</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-purple-700">Col K<br/>SOBRANTE</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-red-700">Col L<br/>FALTANTE</th>
                      <th className="p-2.5 whitespace-nowrap text-right text-slate-900 font-black">Col M<br/>VALOR TOTAL</th>
                      <th className="p-2.5 whitespace-nowrap text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(() => {
                      const filteredCortes = (db.cortes_de_ventas || []).filter((item) => {
                        const term = corteSearchTerm.toLowerCase();
                        const matchText = !corteSearchTerm || 
                          (item.ticket || "").toLowerCase().includes(term) ||
                          (item.fecha || "").toLowerCase().includes(term) ||
                          (item.identidad || "").toLowerCase().includes(term);

                        const discrepancy = (item.sobrante || 0) - (item.faltante || 0);
                        let matchStatus = true;
                        if (corteFilterStatus === "CUADRADO") matchStatus = discrepancy === 0;
                        if (corteFilterStatus === "SOBRANTE") matchStatus = (item.sobrante || 0) > 0;
                        if (corteFilterStatus === "FALTANTE") matchStatus = (item.faltante || 0) > 0;

                        let matchDate = true;
                        if (corteFechaInicio && item.fecha < corteFechaInicio) matchDate = false;
                        if (corteFechaFin && item.fecha > corteFechaFin) matchDate = false;

                        return matchText && matchStatus && matchDate;
                      });

                      if (filteredCortes.length === 0) {
                        return (
                          <tr>
                            <td colSpan={14} className="p-8 text-center text-slate-400">
                              No se encontraron registros de Cortes de Ventas con los criterios aplicados.
                            </td>
                          </tr>
                        );
                      }

                      return filteredCortes.map((item, idx) => {
                        const discrepancy = (item.sobrante || 0) - (item.faltante || 0);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors font-medium text-slate-800">
                            <td className="p-2.5 font-mono font-bold text-red-600 text-center whitespace-nowrap">
                              #{item.ticket}
                            </td>
                            <td className="p-2.5 whitespace-nowrap font-mono">{item.fecha}</td>
                            <td className="p-2.5 text-right font-mono">${(item.base_del_dia || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-green-700">${(item.entrada_efectivo_repuestos || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-green-700">${(item.entrada_transferencia_repuestos || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-green-700">${(item.entrada_efectivo_motos || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-green-700">${(item.entrada_transferencia_motos || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-blue-700">${(item.entrada_estudios_motos || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-red-600">${(item.salidas_totales || 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-red-600">${(item.gastos_totales ?? 0).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-purple-700">
                              {item.sobrante > 0 ? `+$${item.sobrante.toLocaleString()}` : "$0"}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-red-700">
                              {item.faltante > 0 ? `-$${item.faltante.toLocaleString()}` : "$0"}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-slate-900 bg-amber-50/50">
                              ${(item.valor_total || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedCorteDetail(item)}
                                className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-bold transition-colors"
                              >
                                Ver Detalle
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CLOSE DIARIO WIZARD */
            <form onSubmit={handleSaveCorte} className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button type="button" onClick={() => setShowCorteForm(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1">
                  <ChevronLeft size={14} /> <span>Volver al listado</span>
                </button>
                <span className="text-sm font-bold text-red-600">Arqueo de Caja y Diagnóstico de Salud de Cierre</span>
              </div>

              {/* Step 1: Select date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">1. Seleccione Fecha a Cerrar</label>
                  <input
                    type="date"
                    required
                    value={corteFecha}
                    onChange={(e) => setCorteFecha(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">
                    El sistema buscará todas las transacciones, ventas y egresos asentados para esta fecha.
                  </p>
                </div>

                {/* Expected values calculation panel */}
                <div className="md:col-span-2 space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-2">
                    <BarChart3 size={14} className="text-red-500" />
                    <span>Balance Calculado por el Sistema para {corteFecha}</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>(+) Base inicial de caja (anterior):</span>
                      <span className="font-mono">${activeCorteData.baseDelDia.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(+) Entradas Efectivo Motos:</span>
                      <span className="font-mono text-green-600">${activeCorteData.motoCash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(+) Entradas Efectivo Repuestos:</span>
                      <span className="font-mono text-green-600">${activeCorteData.partsCash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(-) Consignaciones Bancarias:</span>
                      <span className="font-mono text-red-600">${activeCorteData.outTotals.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>(-) Gastos de Caja del Día:</span>
                      <span className="font-mono text-red-600">${activeCorteData.gastosTotales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 col-span-2 pt-2 bg-slate-50 p-2 rounded">
                      <span>TOTAL EFECTIVO ESPERADO EN CAJA:</span>
                      <span className="font-mono">${activeCorteData.expectedTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Audit inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">2. Arqueo de Dinero Físico</h4>
                  <p className="text-[10px] text-slate-400">
                    Cuente el dinero en efectivo que se encuentra físicamente en la caja del concesionario. Si coincide exactamente, deje Sobrante y Faltante en 0.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Sobrante ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={corteSobrante || ""}
                        onChange={(e) => {
                          setCorteSobrante(parseFloat(e.target.value) || 0);
                          setCorteFaltante(0);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-green-700 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Faltante ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={corteFaltante || ""}
                        onChange={(e) => {
                          setCorteFaltante(parseFloat(e.target.value) || 0);
                          setCorteSobrante(0);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-red-700 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Audit Health Check before close */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center space-x-2">
                    <CheckSquare size={14} className="text-red-500" />
                    <span>Centro de Salud de Cierre</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center space-x-2 text-green-600 font-semibold">
                      <span className="bg-green-100 p-0.5 rounded text-[10px]">OK</span>
                      <span>Motos vendidas hoy registradas correctamente.</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-600 font-semibold">
                      <span className="bg-green-100 p-0.5 rounded text-[10px]">OK</span>
                      <span>Stock de accesorios adicionales descontado.</span>
                    </div>
                    {(db.matriculas || []).some(m => m.estado === "Pendiente") ? (
                      <div className="flex items-center space-x-2 text-yellow-600 font-semibold">
                        <span className="bg-yellow-100 p-0.5 rounded text-[10px]">INFO</span>
                        <span>Existen trámites de Matrícula pendientes de rango.</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-green-600 font-semibold">
                        <span className="bg-green-100 p-0.5 rounded text-[10px]">OK</span>
                        <span>Todas las matrículas procesadas.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save cut buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCorteForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancelar Cierre
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wide rounded-lg shadow-xs"
                >
                  Cerrar y Archivar Arqueo Diario
                </button>
              </div>
            </form>
          )}

          {/* Modal for Detailed View of a Cut */}
          {selectedCorteDetail && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-red-600 uppercase">DOCUMENTO MAESTRO ERP — HOJA CORTES DE VENTAS</span>
                    <h3 className="text-base font-extrabold text-slate-800">Corte de Ventas Tique #{selectedCorteDetail.ticket}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedCorteDetail(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fecha del Arqueo:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedCorteDetail.fecha}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Registrado por:</span>
                    <span className="font-bold text-slate-800">{selectedCorteDetail.identidad || "Administración"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estado Auditoría:</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white">CERRADO</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Desglose de las 13 Columnas del Registro</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col C — Base del Día:</span>
                      <span className="font-mono font-bold">${(selectedCorteDetail.base_del_dia || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col D — Efec. Repuestos:</span>
                      <span className="font-mono font-bold text-green-700">${(selectedCorteDetail.entrada_efectivo_repuestos || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col E — Transf. Repuestos:</span>
                      <span className="font-mono font-bold text-green-700">${(selectedCorteDetail.entrada_transferencia_repuestos || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col F — Efec. Motos:</span>
                      <span className="font-mono font-bold text-green-700">${(selectedCorteDetail.entrada_efectivo_motos || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col G — Transf. Motos:</span>
                      <span className="font-mono font-bold text-green-700">${(selectedCorteDetail.entrada_transferencia_motos || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col H — Estudios Motos:</span>
                      <span className="font-mono font-bold text-blue-700">${(selectedCorteDetail.entrada_estudios_motos || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col I — Salidas Totales:</span>
                      <span className="font-mono font-bold text-red-600">${(selectedCorteDetail.salidas_totales || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600 font-medium">Col J — Gastos Totales:</span>
                      <span className="font-mono font-bold text-red-600">${(selectedCorteDetail.gastos_totales ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-purple-50 rounded border border-purple-100">
                      <span className="text-purple-800 font-medium">Col K — Sobrante:</span>
                      <span className="font-mono font-bold text-purple-800">${(selectedCorteDetail.sobrante || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-red-50 rounded border border-red-100">
                      <span className="text-red-800 font-medium">Col L — Faltante:</span>
                      <span className="font-mono font-bold text-red-800">${(selectedCorteDetail.faltante || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 mt-2 text-sm font-bold text-slate-900">
                    <span>Col M — VALOR TOTAL CONSOLIDADO:</span>
                    <span className="font-mono text-base text-amber-900">${(selectedCorteDetail.valor_total || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedCorteDetail(null)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
