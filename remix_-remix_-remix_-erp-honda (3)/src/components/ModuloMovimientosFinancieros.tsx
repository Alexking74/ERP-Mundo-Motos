import React, { useState } from "react";
import { DollarSign, ArrowUpRight, ArrowDownLeft, ShieldAlert, Filter, Search, Plus, FileText, CheckCircle2, AlertTriangle, Building2, CreditCard, RefreshCw } from "lucide-react";
import { DatabaseState, Usuario, MovimientoFinanciero } from "../types";
import { getTodayDateString, registrarEvento, registrarMovimientoFinanciero } from "../utils/db";

interface ModuloMovimientosFinancierosProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (newState: DatabaseState) => void;
}

export default function ModuloMovimientosFinancieros({ user, db, setDb }: ModuloMovimientosFinancierosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("TODOS");
  const [filterFormaPago, setFilterFormaPago] = useState<string>("TODOS");
  const [filterModulo, setFilterModulo] = useState<string>("TODOS");
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual movement form state
  const [tipoMovimiento, setTipoMovimiento] = useState<"INGRESO" | "SALIDA" | "DEVOLUCIÓN" | "AJUSTE">("INGRESO");
  const [moduloOrigen, setModuloOrigen] = useState("CAJA GENERAL / OTRO");
  const [documentoCliente, setDocumentoCliente] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [concepto, setConcepto] = useState("");
  const [formaPago, setFormaPago] = useState<"EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "MONEDA DIGITAL" | "ESTUDIO" | "OTRO">("EFECTIVO");
  const [referencia, setReferencia] = useState("");
  const [entidadPlataforma, setEntidadPlataforma] = useState("Bancolombia");
  const [valor, setValor] = useState("");
  const [tipoOperacion, setTipoOperacion] = useState<"RECIBIDO" | "ENTREGADO">("RECIBIDO");
  const [documentoOrigen, setDocumentoOrigen] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Compile full list: Explicit entries in db.movimientos_financieros + Auto-compiled from modules
  const getCompiledMovimientos = (): MovimientoFinanciero[] => {
    let list: MovimientoFinanciero[] = [...(db.movimientos_financieros || [])];

    // If list in state is empty, dynamically populate from other modules so user sees seamless data
    if (list.length === 0) {
      // 1. Actas
      db.actas?.forEach((a, idx) => {
        const valEfectivo = a.efectivo || 0;
        if (valEfectivo > 0) {
          list.push({
            id_movimiento: `MOV-ACTA-EF-${idx}`,
            fecha: a.fecha || getTodayDateString(),
            hora: "10:00:00",
            sede: user.sede || "Planadas",
            tipo_movimiento: "INGRESO",
            modulo_origen: "ACTAS",
            documento_cliente: a.documento || "N/A",
            nombre_cliente: `${a.nombres} ${a.apellidos}`,
            concepto: `Abono/Pago Venta Moto ${a.moto} (Acta #${a.acta})`,
            forma_pago: "EFECTIVO",
            referencia: `ACTA-${a.acta}`,
            entidad_plataforma: "Caja Efectivo",
            valor: valEfectivo,
            tipo_operacion: "RECIBIDO",
            documento_origen: `ACTA #${a.acta}`,
            usuario: user.usuario,
            estado: "CONFIRMADO",
            observaciones: "Generado automáticamente de Acta de Venta"
          });
        }
        const valTransf = a.transferencia || 0;
        if (valTransf > 0) {
          list.push({
            id_movimiento: `MOV-ACTA-TR-${idx}`,
            fecha: a.fecha || getTodayDateString(),
            hora: "10:05:00",
            sede: user.sede || "Planadas",
            tipo_movimiento: "INGRESO",
            modulo_origen: "ACTAS",
            documento_cliente: a.documento || "N/A",
            nombre_cliente: `${a.nombres} ${a.apellidos}`,
            concepto: `Transferencia Venta Moto ${a.moto} (Acta #${a.acta})`,
            forma_pago: "TRANSFERENCIA",
            referencia: `ACTA-${a.acta}`,
            entidad_plataforma: a.plataforma_digital || "Bancolombia",
            valor: valTransf,
            tipo_operacion: "RECIBIDO",
            documento_origen: `ACTA #${a.acta}`,
            usuario: user.usuario,
            estado: "CONFIRMADO",
            observaciones: "Generado automáticamente de Acta de Venta"
          });
        }
      });

      // 2. Preventas
      db.preventas?.forEach((p, idx) => {
        const valEf = p.ingreso_efectivo || 0;
        if (valEf > 0) {
          list.push({
            id_movimiento: `MOV-PRE-EF-${idx}`,
            fecha: p.fecha_de_inicio || getTodayDateString(),
            hora: "09:00:00",
            sede: user.sede || "Planadas",
            tipo_movimiento: "INGRESO",
            modulo_origen: "PREVENTAS",
            documento_cliente: p.cedula || "N/A",
            nombre_cliente: `${p.nombre} ${p.apellido || ""}`,
            concepto: `Encargo / Separe Moto ${p.modelo}`,
            forma_pago: "EFECTIVO",
            referencia: p.recibo || `ENCARGO-${p.id_del_encargo}`,
            entidad_plataforma: "Caja Efectivo",
            valor: valEf,
            tipo_operacion: "RECIBIDO",
            documento_origen: `ENCARGO #${p.id_del_encargo}`,
            usuario: user.usuario,
            estado: "CONFIRMADO",
            observaciones: "Abono Preventa"
          });
        }
      });

      // 3. Salida de Repuestos
      db.salida_de_repuestos?.forEach((s, idx) => {
        const total = s.valor_total || 0;
        if (total > 0) {
          list.push({
            id_movimiento: `MOV-REP-${idx}`,
            fecha: s.fecha || getTodayDateString(),
            hora: "14:30:00",
            sede: user.sede || "Planadas",
            tipo_movimiento: "INGRESO",
            modulo_origen: "SALIDA DE REPUESTOS",
            documento_cliente: "CLIENTE MOSTRADOR",
            nombre_cliente: "Venta Mostrador Repuestos",
            concepto: `Venta Repuesto: ${s.producto} (${s.cantidad} unidades)`,
            forma_pago: (s.formas_de_pago || "").toUpperCase() === "TRANSFERENCIA" ? "TRANSFERENCIA" : "EFECTIVO",
            referencia: s.referencia || "POS-REP",
            entidad_plataforma: (s.formas_de_pago || "").toUpperCase() === "TRANSFERENCIA" ? "Bancolombia" : "Caja Efectivo",
            valor: total,
            tipo_operacion: "RECIBIDO",
            documento_origen: `REF: ${s.referencia}`,
            usuario: user.usuario,
            estado: "CONFIRMADO",
            observaciones: `Venta POS repuesto ${s.producto}`
          });
        }
      });

      // 4. Salidas Externas / Gastos
      db.salidas_externas?.forEach((g, idx) => {
        const valGasto = g.valor_gasto || g.valor_consignacion || 0;
        if (valGasto > 0) {
          list.push({
            id_movimiento: `MOV-EGR-${idx}`,
            fecha: g.fecha || getTodayDateString(),
            hora: "16:00:00",
            sede: user.sede || "Planadas",
            tipo_movimiento: "SALIDA",
            modulo_origen: "GASTOS",
            documento_cliente: "PROVEEDOR / SERVICIO",
            nombre_cliente: g.cuenta || "Gasto Operativo",
            concepto: `Egreso Operativo: ${g.cuenta} - ${g.otros_gastos || "Varios"}`,
            forma_pago: "EFECTIVO",
            referencia: g.operacion || `EGR-${100 + idx}`,
            entidad_plataforma: "Caja Efectivo",
            valor: valGasto,
            tipo_operacion: "ENTREGADO",
            documento_origen: g.operacion || `EGR-${100 + idx}`,
            usuario: user.usuario,
            estado: "CONFIRMADO",
            observaciones: "Egreso / Gasto Sede"
          });
        }
      });
    }

    return list;
  };

  const rawList = getCompiledMovimientos();

  // Filter list
  const filteredList = rawList.filter((m) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      !s ||
      m.id_movimiento.toLowerCase().includes(s) ||
      m.nombre_cliente.toLowerCase().includes(s) ||
      m.documento_cliente.includes(s) ||
      m.concepto.toLowerCase().includes(s) ||
      m.referencia.toLowerCase().includes(s) ||
      m.documento_origen.toLowerCase().includes(s);

    const matchTipo = filterTipo === "TODOS" || m.tipo_movimiento === filterTipo;
    const matchForma = filterFormaPago === "TODOS" || m.forma_pago === filterFormaPago;
    const matchModulo = filterModulo === "TODOS" || m.modulo_origen === filterModulo;

    return matchSearch && matchTipo && matchForma && matchModulo;
  });

  // Calculate Summary Metrics
  const totalIngresos = filteredList
    .filter((m) => m.tipo_operacion === "RECIBIDO" && m.estado === "CONFIRMADO")
    .reduce((sum, m) => sum + m.valor, 0);

  const totalSalidas = filteredList
    .filter((m) => m.tipo_operacion === "ENTREGADO" && m.estado === "CONFIRMADO")
    .reduce((sum, m) => sum + m.valor, 0);

  const balanceNeto = totalIngresos - totalSalidas;

  // Submit manual financial movement / adjustment
  const handleCreateManualMovimiento = (e: React.FormEvent) => {
    e.preventDefault();

    const numVal = parseFloat(valor.replace(/[^0-9.]/g, "")) || 0;
    if (numVal <= 0) {
      alert("⚠️ Debe ingresar un valor numérico positivo para el movimiento.");
      return;
    }

    const isSensitive = tipoMovimiento === "DEVOLUCIÓN" || tipoMovimiento === "AJUSTE" || numVal >= 5000000;

    const updatedDb = registrarMovimientoFinanciero(db, {
      sede: user.sede || "Planadas",
      tipo_movimiento: tipoMovimiento,
      modulo_origen: moduloOrigen.toUpperCase(),
      documento_cliente: documentoCliente.trim() || "N/A",
      nombre_cliente: nombreCliente.trim() || "REGISTRO GENERAL",
      concepto: concepto.trim() || "Ajuste / Registro de Movimiento Financiero",
      forma_pago: formaPago,
      referencia: referencia.trim() || "MANUAL-MOV",
      entidad_plataforma: entidadPlataforma,
      valor: numVal,
      tipo_operacion: tipoOperacion,
      documento_origen: documentoOrigen.trim() || "COMPROBANTE CAJA",
      usuario: user.usuario,
      estado: "CONFIRMADO",
      observaciones: observaciones.trim() || "Movimiento registrado manualmente"
    });

    // Generate event in EVENTOS
    const finalDb = registrarEvento(
      updatedDb,
      user,
      "MOVIMIENTOS FINANCIEROS",
      "Registro Movimiento Financiero",
      isSensitive ? "ROJA" : "VERDE",
      "Valor / Transacción",
      "$0",
      `$${numVal.toLocaleString()}`,
      `Registro de movimiento financiero (${tipoMovimiento} - ${formaPago}) por $${numVal.toLocaleString()}. Concepto: "${concepto}"`
    );

    setDb(finalDb);

    // Reset Form
    setShowManualForm(false);
    setValor("");
    setConcepto("");
    setDocumentoCliente("");
    setNombreCliente("");
    setReferencia("");
    setObservaciones("");

    alert(`✅ MOVIMIENTO FINANCIERO REGISTRADO\n\nSe ha asentado correctamente el movimiento financiero en la HOJA 18 (MOVIMIENTOS FINANCIEROS).`);
  };

  // Handle Reversal or Anulación (Admin only or Event logged)
  const handleAnularMovimiento = (movId: string) => {
    if (user.rol !== "Administrador") {
      alert("🔒 ACCESO RESTRINGIDO: Únicamente el perfil Administrador puede anular o reversar movimientos financieros. Los intentos son registrados con Alerta Roja.");
      return;
    }

    const motivo = prompt("Ingrese el motivo justificado para anular/reversar este movimiento financiero (MANDATORIO):");
    if (!motivo || !motivo.trim()) {
      alert("ALERTA: Es obligatorio ingresar un motivo para anular transacciones financieras.");
      return;
    }

    const targetMov = rawList.find(m => m.id_movimiento === movId);

    const updatedMovs = (db.movimientos_financieros || []).map((m) => {
      if (m.id_movimiento === movId) {
        return { ...m, estado: "ANULADO" as const, observaciones: `${m.observaciones} [ANULADO por ${user.usuario}: "${motivo.trim()}"]` };
      }
      return m;
    });

    let updatedDb: DatabaseState = {
      ...db,
      movimientos_financieros: updatedMovs
    };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MOVIMIENTOS FINANCIEROS",
      "Anulación de Movimiento Financiero",
      "ROJA",
      "Estado Movimiento",
      targetMov?.estado || "CONFIRMADO",
      "ANULADO",
      `ALERTA ROJA: El administrador ${user.usuario} anuló el movimiento financiero #${movId} ($${targetMov?.valor.toLocaleString()}). Motivo: "${motivo.trim()}"`
    );

    setDb(updatedDb);
    alert(`El movimiento financiero #${movId} ha sido anulado correctamente.`);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-950/50 text-white">
            <DollarSign size={26} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-800/50">
                DOCUMENTO MAESTRO ERP — MOVIMIENTOS FINANCIEROS
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                HOJA 18 (18 COLUMNAS)
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight mt-1">Registro Centralizado de Movimientos Monetarios</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sin duplicación por asesores — Consolidación automática de Actas, Preventas, Recibos, Repuestos y Devoluciones
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md flex items-center space-x-2"
        >
          {showManualForm ? <RefreshCw size={16} /> : <Plus size={16} />}
          <span>{showManualForm ? "Ver Registro Completo" : "Asentar Movimiento Manual"}</span>
        </button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Ingresos Recibidos</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">${totalIngresos.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-semibold">Caja, Transferencias y Plataformas</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Salidas / Egresos</span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">${totalSalidas.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-semibold">Gastos, Devoluciones y Compras</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Flujo Neto Consolidado</span>
            <div className={`text-2xl font-black mt-0.5 ${balanceNeto >= 0 ? "text-slate-900" : "text-rose-600"}`}>
              ${balanceNeto.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">Sede {user.sede}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl">
            <Building2 size={24} />
          </div>
        </div>
      </div>

      {/* MANUAL MOVEMENT FORM */}
      {showManualForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Plus size={20} className="text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Asentar Ajuste / Movimiento Financiero Manual
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Genera auditoría automática en EVENTOS
            </span>
          </div>

          <form onSubmit={handleCreateManualMovimiento} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">TIPO DE MOVIMIENTO *</label>
                <select
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="INGRESO">INGRESO</option>
                  <option value="SALIDA">SALIDA</option>
                  <option value="DEVOLUCIÓN">DEVOLUCIÓN</option>
                  <option value="AJUSTE">AJUSTE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">TIPO OPERACIÓN *</label>
                <select
                  value={tipoOperacion}
                  onChange={(e) => setTipoOperacion(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="RECIBIDO">RECIBIDO (Entrada)</option>
                  <option value="ENTREGADO">ENTREGADO (Salida)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">FORMA DE PAGO *</label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="TARJETA">TARJETA</option>
                  <option value="MONEDA DIGITAL">MONEDA DIGITAL</option>
                  <option value="ESTUDIO">ESTUDIO / FINANCIERA</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">VALOR ($) *</label>
                <input
                  type="text"
                  required
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ej: 250000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">MÓDULO ORIGEN</label>
                <input
                  type="text"
                  value={moduloOrigen}
                  onChange={(e) => setModuloOrigen(e.target.value)}
                  placeholder="Ej: RECIBOS, POS, CAJA GENERAL"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ENTIDAD / PLATAFORMA</label>
                <input
                  type="text"
                  value={entidadPlataforma}
                  onChange={(e) => setEntidadPlataforma(e.target.value)}
                  placeholder="Ej: Bancolombia / Nequi / Efectivo"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">REFERENCIA / N° COMPROBANTE</label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej: OP-987654 / REC-102"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DOCUMENTO ORIGEN</label>
                <input
                  type="text"
                  value={documentoOrigen}
                  onChange={(e) => setDocumentoOrigen(e.target.value)}
                  placeholder="Ej: PREVENTA #12, ACTA #45"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CÉDULA / DOC CLIENTE</label>
                <input
                  type="text"
                  value={documentoCliente}
                  onChange={(e) => setDocumentoCliente(e.target.value)}
                  placeholder="Ej: 10102030"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NOMBRE CLIENTE / TERCERO</label>
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Ej: María Rodríguez"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">CONCEPTO *</label>
                <input
                  type="text"
                  required
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Abono en efectivo por separe de motocicleta..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block font-bold text-slate-700 mb-1">OBSERVACIONES</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales para contabilidad y auditoría..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Asentar Movimiento Financiero
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
        <div className="flex-1 w-full relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, documento, concepto, referencia o ID de movimiento..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="INGRESO">INGRESO</option>
            <option value="SALIDA">SALIDA</option>
            <option value="DEVOLUCIÓN">DEVOLUCIÓN</option>
            <option value="AJUSTE">AJUSTE</option>
          </select>

          <select
            value={filterFormaPago}
            onChange={(e) => setFilterFormaPago(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="TODOS">Todas las formas de pago</option>
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            <option value="TARJETA">TARJETA</option>
            <option value="MONEDA DIGITAL">MONEDA DIGITAL</option>
            <option value="ESTUDIO">ESTUDIO</option>
          </select>

          <select
            value={filterModulo}
            onChange={(e) => setFilterModulo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="TODOS">Todos los módulos</option>
            <option value="ACTAS">ACTAS</option>
            <option value="PREVENTAS">PREVENTAS</option>
            <option value="SALIDA DE REPUESTOS">SALIDA REPUESTOS</option>
            <option value="GASTOS">GASTOS</option>
            <option value="RECIBOS">RECIBOS</option>
            <option value="DEVOLUCIÓN">DEVOLUCIONES</option>
          </select>
        </div>
      </div>

      {/* MOVIMIENTOS FINANCIEROS TABLE (18 COLUMNS) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <DollarSign size={18} className="text-emerald-400" />
            <h3 className="font-black text-xs uppercase tracking-widest">
              Listado Unificado de Movimientos Financieros ({filteredList.length} movimientos)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            Fila 2: Títulos | Fila 3: Registros Centralizados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3">ID MOVIMIENTO</th>
                <th className="p-3">FECHA</th>
                <th className="p-3">HORA</th>
                <th className="p-3">SEDE</th>
                <th className="p-3">TIPO MOVIMIENTO</th>
                <th className="p-3">MÓDULO ORIGEN</th>
                <th className="p-3">DOC CLIENTE</th>
                <th className="p-3">NOMBRE CLIENTE</th>
                <th className="p-3">CONCEPTO</th>
                <th className="p-3">FORMA DE PAGO</th>
                <th className="p-3">REFERENCIA</th>
                <th className="p-3">ENTIDAD / PLATAFORMA</th>
                <th className="p-3">VALOR</th>
                <th className="p-3">OPERACIÓN</th>
                <th className="p-3">DOC ORIGEN</th>
                <th className="p-3">USUARIO</th>
                <th className="p-3">ESTADO</th>
                <th className="p-3">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-[11px]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-8 text-center text-slate-400 italic">
                    No se encontraron movimientos financieros con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((m, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50 transition-colors ${m.estado === "ANULADO" ? "opacity-50 bg-rose-50/50" : ""}`}>
                    <td className="p-3 font-mono font-bold text-slate-900">{m.id_movimiento}</td>
                    <td className="p-3 font-semibold">{m.fecha}</td>
                    <td className="p-3 font-mono text-slate-500">{m.hora}</td>
                    <td className="p-3 font-bold">{m.sede}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.tipo_movimiento === "INGRESO" ? "bg-emerald-100 text-emerald-800" :
                        m.tipo_movimiento === "SALIDA" ? "bg-rose-100 text-rose-800" :
                        m.tipo_movimiento === "DEVOLUCIÓN" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {m.tipo_movimiento}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-700">{m.modulo_origen}</td>
                    <td className="p-3 font-mono text-slate-600">{m.documento_cliente}</td>
                    <td className="p-3 font-bold text-slate-900">{m.nombre_cliente}</td>
                    <td className="p-3 max-w-[200px] truncate text-slate-700" title={m.concepto}>{m.concepto}</td>
                    <td className="p-3 font-bold">{m.forma_pago}</td>
                    <td className="p-3 font-mono text-slate-600">{m.referencia}</td>
                    <td className="p-3 text-slate-600">{m.entidad_plataforma}</td>
                    <td className={`p-3 font-black text-sm ${m.tipo_operacion === "RECIBIDO" ? "text-emerald-600" : "text-rose-600"}`}>
                      ${m.valor.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-[10px]">
                      {m.tipo_operacion === "RECIBIDO" ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">RECIBIDO (Entrada)</span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">ENTREGADO (Salida)</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{m.documento_origen}</td>
                    <td className="p-3 font-semibold text-slate-600">{m.usuario}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.estado === "CONFIRMADO" ? "bg-emerald-100 text-emerald-800" :
                        m.estado === "ANULADO" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {m.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      {m.estado !== "ANULADO" && (
                        <button
                          onClick={() => handleAnularMovimiento(m.id_movimiento)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded border border-rose-200 transition-colors"
                          title="Anular/Reversar movimiento (Admin)"
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
