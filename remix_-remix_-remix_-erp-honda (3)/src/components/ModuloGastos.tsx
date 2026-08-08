import React, { useState } from "react";
import { Plus, Search, Calendar, DollarSign, FileText, CheckCircle, AlertCircle, History, Filter, Edit, Trash2, PieChart, ShieldAlert, Tag, ArrowRight } from "lucide-react";
import { DatabaseState, Usuario, Gasto, HistorialCambioGasto } from "../types";
import { getTodayDateString, registrarEvento } from "../utils/db";

interface ModuloGastosProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
}

export default function ModuloGastos({ user, db, setDb }: ModuloGastosProps) {
  // Main view modes
  const [activeTab, setActiveTab] = useState<"tabla" | "estadisticas">("tabla");
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSoporte, setFilterSoporte] = useState<"TODOS" | "CON_SOPORTE" | "SIN_SOPORTE">("TODOS");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedAuditGasto, setSelectedAuditGasto] = useState<Gasto | null>(null);

  // Form states
  const [formFecha, setFormFecha] = useState(getTodayDateString());
  const [formRecibo, setFormRecibo] = useState("");
  const [formSinSoporte, setFormSinSoporte] = useState(false);
  const [formRazon, setFormRazon] = useState("");
  const [formValor, setFormValor] = useState<number>(0);
  const [formOtros, setFormOtros] = useState("");
  const [formValorOtros, setFormValorOtros] = useState<number>(0);
  const [formMotivoEdicion, setFormMotivoEdicion] = useState("");

  const gastosList = db.gastos || [];

  // Common preset reasons for expenses
  const RAZONES_PREDETERMINADAS = [
    "Compra de Papelería y Elementos de Oficina",
    "Pago de Transporte, Fletes y Domicilios",
    "Servicios Públicos (Luz, Agua, Teléfono, Internet)",
    "Aseo, Limpieza e Insumos de Cafetería",
    "Reparación y Mantenimiento de Instalaciones",
    "Compra de Herramientas e Insumos de Taller",
    "Alimentación y Viáticos Operativos",
    "Publicidad y Volanteo Local",
    "Gastos Bancarios y Comisiones de Giro",
    "Otro Gasto Operativo"
  ];

  const resetForm = () => {
    setEditingGasto(null);
    setFormFecha(getTodayDateString());
    setFormRecibo("");
    setFormSinSoporte(false);
    setFormRazon("");
    setFormValor(0);
    setFormOtros("");
    setFormValorOtros(0);
    setFormMotivoEdicion("");
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setFormFecha(gasto.fecha);
    if (gasto.recibo === "SIN SOPORTE" || !gasto.recibo) {
      setFormRecibo("");
      setFormSinSoporte(true);
    } else {
      setFormRecibo(gasto.recibo);
      setFormSinSoporte(false);
    }
    setFormRazon(gasto.razon);
    setFormValor(gasto.valor);
    setFormOtros(gasto.otros || "");
    setFormValorOtros(gasto.valor_otros || 0);
    setFormMotivoEdicion("");
    setShowFormModal(true);
  };

  const openAuditTrail = (gasto: Gasto) => {
    setSelectedAuditGasto(gasto);
    setShowAuditModal(true);
  };

  const handleSaveGasto = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formRazon.trim()) {
      alert("Por favor indique la RAZÓN principal del gasto.");
      return;
    }

    if (formValor <= 0 && formValorOtros <= 0) {
      alert("El gasto debe tener un valor mayor a cero en la razón principal o en otros conceptos.");
      return;
    }

    const finalRecibo = formSinSoporte ? "SIN SOPORTE" : (formRecibo.trim() || "SIN SOPORTE");

    if (editingGasto) {
      // Editing existing expense
      if (user.rol !== "Administrador" && !formMotivoEdicion.trim()) {
        alert("Atención: Debe proporcionar un motivo o justificación para modificar este gasto histórico.");
        return;
      }

      const cambioLog: HistorialCambioGasto = {
        fecha: `${getTodayDateString()} ${new Date().toLocaleTimeString()}`,
        usuario: user.nombre_completo,
        campo: "Modificación de Registro",
        valor_anterior: `Razón: ${editingGasto.razon} | Val: $${editingGasto.valor} | Recibo: ${editingGasto.recibo}`,
        valor_nuevo: `Razón: ${formRazon} | Val: $${formValor} | Recibo: ${finalRecibo}`,
        motivo: formMotivoEdicion.trim() || "Actualización de datos por usuario autorizatorio"
      };

      const updatedGasto: Gasto = {
        ...editingGasto,
        fecha: formFecha,
        recibo: finalRecibo,
        razon: formRazon,
        valor: Number(formValor),
        otros: formOtros,
        valor_otros: Number(formValorOtros),
        historial_cambios: [cambioLog, ...(editingGasto.historial_cambios || [])]
      };

      const updatedGastosList = gastosList.map(g => g.id === editingGasto.id ? updatedGasto : g);
      let updatedDb = { ...db, gastos: updatedGastosList };

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "GASTOS",
        "Modificar Gasto",
        "AMARILLA",
        "Gasto ID",
        editingGasto.id || editingGasto.recibo,
        editingGasto.id || finalRecibo,
        `Se modificó el gasto de ${editingGasto.razon} ($${editingGasto.valor + (editingGasto.valor_otros || 0)}) a ${formRazon} ($${Number(formValor) + Number(formValorOtros)}). Motivo: ${formMotivoEdicion || "Corrección"}`
      );

      setDb(updatedDb);
      setShowFormModal(false);
      resetForm();
      alert("Gasto modificado y registrado exitosamente en la trazabilidad.");

    } else {
      // Creating new expense
      const newId = `GST-${Date.now().toString().slice(-6)}`;
      const newGasto: Gasto = {
        id: newId,
        fecha: formFecha,
        recibo: finalRecibo,
        razon: formRazon,
        valor: Number(formValor),
        otros: formOtros,
        valor_otros: Number(formValorOtros),
        sede: user.sede || "Sede Principal",
        usuario_registro: user.nombre_completo,
        historial_cambios: [
          {
            fecha: `${getTodayDateString()} ${new Date().toLocaleTimeString()}`,
            usuario: user.nombre_completo,
            campo: "Creación de Gasto",
            valor_anterior: "N/A",
            valor_nuevo: `$${Number(formValor) + Number(formValorOtros)} (${formRazon})`,
            motivo: "Registro inicial de egreso en hoja GASTOS ERP"
          }
        ]
      };

      let updatedDb = { ...db, gastos: [newGasto, ...gastosList] };

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "GASTOS",
        "Registrar Gasto",
        "VERDE",
        "Gasto",
        "",
        newId,
        `Se registró un nuevo gasto: ${formRazon} por $${Number(formValor) + Number(formValorOtros)} (Recibo: ${finalRecibo})`
      );

      setDb(updatedDb);
      setShowFormModal(false);
      resetForm();
      alert(`Gasto #${newId} registrado con éxito.`);
    }
  };

  const handleDeleteGasto = (gasto: Gasto) => {
    if (user.rol !== "Administrador") {
      alert("Acceso Restringido: Solo el Administrador General puede eliminar registros históricos de gastos.");
      return;
    }

    if (!confirm(`¿Está seguro de eliminar permanentemente este registro de gasto?\n\n- Razón: ${gasto.razon}\n- Total: $${(gasto.valor + (gasto.valor_otros || 0)).toLocaleString()}\n- Recibo: ${gasto.recibo}`)) {
      return;
    }

    const updatedList = gastosList.filter(g => g.id !== gasto.id);
    let updatedDb = { ...db, gastos: updatedList };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "GASTOS",
      "Eliminar Gasto",
      "ROJA",
      "Gasto ID",
      gasto.id || gasto.recibo,
      "",
      `Se eliminó permanentemente el registro de gasto: ${gasto.razon} por $${gasto.valor + (gasto.valor_otros || 0)}`
    );

    setDb(updatedDb);
    alert("Registro de gasto eliminado correctamente del sistema.");
  };

  // -------------------------
  // STATS CALCULATIONS
  // -------------------------
  const totalGastoAcumulado = gastosList.reduce((acc, g) => acc + g.valor + (g.valor_otros || 0), 0);
  
  const currentMonthStr = getTodayDateString().slice(0, 7); // YYYY-MM
  const gastosMesActual = gastosList.filter(g => g.fecha.startsWith(currentMonthStr));
  const totalMesActual = gastosMesActual.reduce((acc, g) => acc + g.valor + (g.valor_otros || 0), 0);

  const gastosConSoporte = gastosList.filter(g => g.recibo && g.recibo !== "SIN SOPORTE");
  const totalConSoporte = gastosConSoporte.reduce((acc, g) => acc + g.valor + (g.valor_otros || 0), 0);

  const gastosSinSoporte = gastosList.filter(g => !g.recibo || g.recibo === "SIN SOPORTE");
  const totalSinSoporte = gastosSinSoporte.reduce((acc, g) => acc + g.valor + (g.valor_otros || 0), 0);

  // -------------------------
  // FILTERING LOGIC
  // -------------------------
  const filteredGastos = gastosList.filter(g => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      g.razon.toLowerCase().includes(term) ||
      g.recibo.toLowerCase().includes(term) ||
      (g.otros || "").toLowerCase().includes(term) ||
      (g.usuario_registro || "").toLowerCase().includes(term) ||
      (g.sede || "").toLowerCase().includes(term);

    let matchSoporte = true;
    if (filterSoporte === "CON_SOPORTE") matchSoporte = g.recibo && g.recibo !== "SIN SOPORTE";
    if (filterSoporte === "SIN_SOPORTE") matchSoporte = !g.recibo || g.recibo === "SIN SOPORTE";

    let matchFecha = true;
    if (fechaInicio && g.fecha < fechaInicio) matchFecha = false;
    if (fechaFin && g.fecha > fechaFin) matchFecha = false;

    const totalFila = g.valor + (g.valor_otros || 0);
    let matchValor = true;
    if (valorMin && totalFila < Number(valorMin)) matchValor = false;
    if (valorMax && totalFila > Number(valorMax)) matchValor = false;

    return matchSearch && matchSoporte && matchFecha && matchValor;
  });

  // Calculate statistics breakdown by Razón
  const statsByRazon: { [key: string]: { cantidad: number; total: number } } = {};
  gastosList.forEach(g => {
    // Simplify reason for grouping
    let key = "Otros Gastos Operativos";
    for (const preset of RAZONES_PREDETERMINADAS) {
      if (g.razon.toLowerCase().includes(preset.slice(0, 10).toLowerCase())) {
        key = preset;
        break;
      }
    }
    if (!statsByRazon[key]) statsByRazon[key] = { cantidad: 0, total: 0 };
    statsByRazon[key].cantidad += 1;
    statsByRazon[key].total += (g.valor + (g.valor_otros || 0));
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">DOCUMENTO MAESTRO ERP</span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">HOJA GASTOS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro y control de egresos de dinero. Estructura oficial de 6 columnas (Col A-F): FECHA | RECIBO | RAZÓN | VALOR | OTROS | VALOR.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("tabla")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "tabla" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Registros de Gastos
          </button>
          <button
            onClick={() => setActiveTab("estadisticas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              activeTab === "estadisticas" ? "bg-red-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <PieChart size={13} />
            <span>Estadísticas</span>
          </button>
          <button
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus size={15} />
            <span>Registrar Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Gastos Registrados</span>
            <DollarSign size={16} className="text-red-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">${totalGastoAcumulado.toLocaleString()}</div>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{gastosList.length} egresos en base de datos</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gastos Mes Actual</span>
            <Calendar size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">${totalMesActual.toLocaleString()}</div>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{gastosMesActual.length} registros este mes</p>
        </div>

        <div className="bg-green-50/60 border border-green-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-green-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Con Soporte (Recibo)</span>
            <CheckCircle size={16} />
          </div>
          <div className="text-xl font-black text-green-800 mt-1">${totalConSoporte.toLocaleString()}</div>
          <p className="text-[10px] text-green-600 font-semibold mt-0.5">{gastosConSoporte.length} egresos respaldados</p>
        </div>

        <div className="bg-yellow-50/60 border border-yellow-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-yellow-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sin Soporte / Pendiente</span>
            <AlertCircle size={16} />
          </div>
          <div className="text-xl font-black text-yellow-800 mt-1">${totalSinSoporte.toLocaleString()}</div>
          <p className="text-[10px] text-yellow-700 font-semibold mt-0.5">{gastosSinSoporte.length} egresos sin recibo</p>
        </div>
      </div>

      {activeTab === "tabla" ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Buscar por razón, recibo, concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <select
                value={filterSoporte}
                onChange={(e: any) => setFilterSoporte(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-bold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
              >
                <option value="TODOS">Soporte: Todos</option>
                <option value="CON_SOPORTE">Con Recibo / Soporte</option>
                <option value="SIN_SOPORTE">Sin Soporte</option>
              </select>

              <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="text-xs font-mono font-semibold text-slate-700 border-none bg-transparent focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="text-xs font-mono font-semibold text-slate-700 border-none bg-transparent focus:outline-hidden"
                />
              </div>

              {(searchTerm || filterSoporte !== "TODOS" || fechaInicio || fechaFin || valorMin || valorMax) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterSoporte("TODOS");
                    setFechaInicio("");
                    setFechaFin("");
                    setValorMin("");
                    setValorMax("");
                  }}
                  className="text-xs text-red-600 hover:underline font-bold px-2 py-1"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Official 6-Columns ERP Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-[11px] tracking-wide uppercase divide-x divide-slate-700">
                  <th className="p-3 text-slate-300 whitespace-nowrap">A - FECHA</th>
                  <th className="p-3 text-slate-300 whitespace-nowrap">B - RECIBO</th>
                  <th className="p-3 text-slate-300">C - RAZÓN</th>
                  <th className="p-3 text-right text-slate-300 whitespace-nowrap">D - VALOR</th>
                  <th className="p-3 text-slate-300">E - OTROS</th>
                  <th className="p-3 text-right text-slate-300 whitespace-nowrap">F - VALOR (OTROS)</th>
                  <th className="p-3 text-right text-slate-100 bg-slate-900 whitespace-nowrap">TOTAL GASTO</th>
                  <th className="p-3 text-center text-slate-300 whitespace-nowrap">ACCIONES / TRAZABILIDAD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredGastos.length > 0 ? (
                  filteredGastos.map((item, idx) => {
                    const valorPrincipal = item.valor || 0;
                    const valorOtros = item.valor_otros || 0;
                    const totalFila = valorPrincipal + valorOtros;
                    const tieneSoporte = item.recibo && item.recibo !== "SIN SOPORTE";

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors divide-x divide-slate-100">
                        <td className="p-3 font-mono font-semibold text-slate-600 whitespace-nowrap">{item.fecha}</td>
                        <td className="p-3 whitespace-nowrap">
                          {tieneSoporte ? (
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.recibo}
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded text-[10px]">
                              SIN SOPORTE
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {item.razon}
                          {item.sede && (
                            <span className="block text-[10px] text-slate-400 font-normal">Sede: {item.sede}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                          ${valorPrincipal.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-700">
                          {item.otros ? (
                            <span className="font-semibold text-slate-800">{item.otros}</span>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-600 whitespace-nowrap">
                          {valorOtros > 0 ? `$${valorOtros.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-red-600 bg-slate-50/50 whitespace-nowrap">
                          ${totalFila.toLocaleString()}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => openAuditTrail(item)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[10px] flex items-center space-x-1"
                              title="Ver Trazabilidad / Historial de Cambios"
                            >
                              <History size={12} />
                              <span>Historial</span>
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-100"
                              title="Editar Registro de Gasto"
                            >
                              <Edit size={14} />
                            </button>
                            {user.rol === "Administrador" && (
                              <button
                                onClick={() => handleDeleteGasto(item)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                title="Eliminar Registro (Solo Admin)"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No se encontraron gastos registrados que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STATISTICS & ANALYTICS SUBTAB */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fade-in">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Análisis y Estadísticas de Egresos ERP</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribución de salidas de dinero por razón principal y nivel de respaldo documental.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2">Gastos por Razón / Categoría</h4>
              <div className="space-y-3">
                {Object.entries(statsByRazon).map(([razonKey, data], i) => {
                  const pct = totalGastoAcumulado > 0 ? (data.total / totalGastoAcumulado) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate pr-2">{razonKey} ({data.cantidad} reg.)</span>
                        <span className="font-mono font-bold text-slate-900">${data.total.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Support vs Non-Support breakdown */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2">Auditoría de Respaldos y Soportes</h4>
              
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-green-100 text-green-700 rounded-xl">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">Gastos con Soporte / Recibo</h5>
                      <p className="text-[11px] text-slate-500">{gastosConSoporte.length} movimientos respaldados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-green-700">${totalConSoporte.toLocaleString()}</span>
                    <span className="block text-[10px] text-slate-400 font-bold">
                      {totalGastoAcumulado > 0 ? ((totalConSoporte / totalGastoAcumulado) * 100).toFixed(1) : 0}% del total
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-yellow-100 text-yellow-700 rounded-xl">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">Gastos sin Soporte Registrado</h5>
                      <p className="text-[11px] text-slate-500">{gastosSinSoporte.length} egresos pendientes de soporte</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-yellow-800">${totalSinSoporte.toLocaleString()}</span>
                    <span className="block text-[10px] text-slate-400 font-bold">
                      {totalGastoAcumulado > 0 ? ((totalSinSoporte / totalGastoAcumulado) * 100).toFixed(1) : 0}% del total
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 font-medium">
                💡 <span className="font-bold">Recomendación ERP:</span> Para asegurar la validez fiscal y pasar auditorías de fin de mes, adjunte los recibos de soporte a los gastos etiquetados como <span className="font-bold text-yellow-800">SIN SOPORTE</span>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR / EDITAR GASTO */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveGasto} className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">HOJA GASTOS</span>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  {editingGasto ? "Editar Registro de Gasto" : "Registrar Salida de Dinero (Gasto)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                Cerrar (X)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              {/* COL A: FECHA */}
              <div>
                <label className="block mb-1 text-slate-700">A - FECHA DE OPERACIÓN *</label>
                <input
                  type="date"
                  required
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold text-slate-800 focus:outline-hidden"
                />
              </div>

              {/* COL B: RECIBO */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700">B - N° RECIBO / SOPORTE</label>
                  <label className="flex items-center space-x-1 cursor-pointer text-[10px] text-slate-500 font-bold">
                    <input
                      type="checkbox"
                      checked={formSinSoporte}
                      onChange={(e) => {
                        setFormSinSoporte(e.target.checked);
                        if (e.target.checked) setFormRecibo("");
                      }}
                      className="rounded text-red-600"
                    />
                    <span>Sin Soporte</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={formSinSoporte}
                  placeholder={formSinSoporte ? "SIN SOPORTE" : "Ej: REC-1029 / FAC-882"}
                  value={formSinSoporte ? "SIN SOPORTE" : formRecibo}
                  onChange={(e) => setFormRecibo(e.target.value)}
                  className={`w-full border rounded-lg p-2.5 font-mono text-xs font-bold ${
                    formSinSoporte ? "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-800"
                  }`}
                />
              </div>

              {/* COL C: RAZON */}
              <div className="md:col-span-2">
                <label className="block mb-1 text-slate-700">C - RAZÓN PRINCIPAL DEL GASTO *</label>
                <div className="space-y-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value !== "OTRO_CUSTOM") setFormRazon(e.target.value);
                    }}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Seleccionar Razón Común o Escribir Abajo --</option>
                    {RAZONES_PREDETERMINADAS.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Escriba o detalle el motivo del gasto de manera clara para auditoría..."
                    value={formRazon}
                    onChange={(e) => setFormRazon(e.target.value)}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* COL D: VALOR PRINCIPAL */}
              <div>
                <label className="block mb-1 text-slate-700">D - VALOR MONETARIO PRINCIPAL ($) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formValor || ""}
                  onChange={(e) => setFormValor(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono text-sm font-black text-slate-900"
                />
              </div>

              {/* COL E: OTROS */}
              <div>
                <label className="block mb-1 text-slate-700">E - OTROS (CONCEPTO ADICIONAL)</label>
                <input
                  type="text"
                  placeholder="Ej: Insumos adicionales, flete secundario..."
                  value={formOtros}
                  onChange={(e) => setFormOtros(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                />
              </div>

              {/* COL F: VALOR OTROS */}
              <div>
                <label className="block mb-1 text-slate-700">F - VALOR OTROS ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formValorOtros || ""}
                  onChange={(e) => setFormValorOtros(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono text-sm font-bold text-slate-800"
                />
              </div>

              {/* REAL-TIME TOTAL CALCULATOR */}
              <div className="bg-red-50/80 border border-red-200 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">VALOR TOTAL DEL GASTO</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Valor Principal + Valor Otros</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-black text-red-700">
                    ${(Number(formValor) + Number(formValorOtros)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* MANDATORY EDIT REASON IF EDITING */}
              {editingGasto && (
                <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 p-3 rounded-xl space-y-1">
                  <label className="block font-bold text-yellow-900 text-xs">
                    MOTIVO DE LA MODIFICACIÓN / AUDITORÍA {user.rol !== "Administrador" && "*"}
                  </label>
                  <input
                    type="text"
                    required={user.rol !== "Administrador"}
                    placeholder="Justifique el motivo de esta modificación para el historial de trazabilidad..."
                    value={formMotivoEdicion}
                    onChange={(e) => setFormMotivoEdicion(e.target.value)}
                    className="w-full bg-white border border-yellow-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                {editingGasto ? "Guardar Modificación" : "Registrar Gasto ERP"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL AUDIT TRAIL / HISTORIAL DE TRAZABILIDAD */}
      {showAuditModal && selectedAuditGasto && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <History className="text-red-600" size={18} />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Trazabilidad de Gasto #{selectedAuditGasto.id || selectedAuditGasto.recibo}
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                Cerrar (X)
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedAuditGasto.razon}</p>
              <p className="font-mono text-slate-600">
                Fecha: {selectedAuditGasto.fecha} | Total: <span className="font-bold text-red-600">${(selectedAuditGasto.valor + (selectedAuditGasto.valor_otros || 0)).toLocaleString()}</span> | Recibo: {selectedAuditGasto.recibo}
              </p>
              {selectedAuditGasto.usuario_registro && (
                <p className="text-[11px] text-slate-500">Registrado por: {selectedAuditGasto.usuario_registro}</p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Historial de Cambios y Modificaciones</h4>
              
              {selectedAuditGasto.historial_cambios && selectedAuditGasto.historial_cambios.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedAuditGasto.historial_cambios.map((h, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500 text-[10px] font-bold">
                        <span>{h.fecha}</span>
                        <span className="text-slate-800">{h.usuario}</span>
                      </div>
                      <p className="font-bold text-slate-800">{h.campo}</p>
                      <p className="text-[11px] text-slate-600">Anterior: {h.valor_anterior}</p>
                      <p className="text-[11px] text-slate-900 font-bold">Nuevo: {h.valor_nuevo}</p>
                      <p className="text-[10px] text-slate-500 italic">Motivo: {h.motivo}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic p-4 text-center border rounded-xl bg-slate-50">
                  Este registro no ha sufrido modificaciones posteriores a su creación.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
              >
                Cerrar Trazabilidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
