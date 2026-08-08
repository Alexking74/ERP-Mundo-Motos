import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Percent, 
  DollarSign, 
  Award, 
  FileSpreadsheet, 
  Search, 
  Calculator, 
  User, 
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Eye,
  Sliders,
  HelpCircle,
  X,
  Save,
  Filter,
  Check,
  ShieldCheck,
  Info
} from "lucide-react";
import { DatabaseState, Usuario, Comision } from "../types";

interface ComisionesProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
}

export default function ModuloComisiones({ user, db, setDb }: ComisionesProps) {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [adminSelectedVendedor, setAdminSelectedVendedor] = useState<string>("TODOS");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "ACTIVA" | "DEVUELTA" | "AJUSTADA" | "REVERTIDA">("TODOS");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Interactive Simulator State
  const [calcValor, setCalcValor] = useState<number>(10000000); // Default 10M COP
  const [calcPorcentajeIva, setCalcPorcentajeIva] = useState<number>(19); // Default 19%
  const [calcPorcentajeGanancia, setCalcPorcentajeGanancia] = useState<number>(1.5); // Default 1.5%

  // Selected Detail Modal
  const [selectedComisionDetail, setSelectedComisionDetail] = useState<Comision | null>(null);

  // Edit / Adjust Modal (Admin only)
  const [editingComision, setEditingComision] = useState<Comision | null>(null);
  const [editPorcentajeIva, setEditPorcentajeIva] = useState<number>(19);
  const [editPorcentajeGanancia, setEditPorcentajeGanancia] = useState<number>(1.5);
  const [editEstado, setEditEstado] = useState<"ACTIVA" | "DEVUELTA" | "AJUSTADA" | "REVERTIDA">("ACTIVA");
  const [editObservaciones, setEditObservaciones] = useState<string>("");

  // Active Tab View: "lista" vs "analisis"
  const [activeTab, setActiveTab] = useState<"lista" | "analisis" | "simulador">("lista");

  // Build the complete set of commissions from DB (stored overrides + mapped actas)
  const fullComisiones = useMemo(() => {
    const stored = db.comisiones || [];
    const storedMap = new Map<string, Comision>();
    stored.forEach(c => storedMap.set(c.acta_consecutivo, c));

    // Get all returned actas or returned sales from Devoluciones
    const devolucionesList = db.devoluciones || [];
    const returnedActaIds = new Set<string>();
    devolucionesList.forEach(dev => {
      if (dev.estado_devolucion === "PROCESADA" || dev.estado_devolucion === "AUTORIZADA") {
        if (dev.numero_documento) returnedActaIds.add(dev.numero_documento.toLowerCase());
        if (dev.referencia) returnedActaIds.add(dev.referencia.toLowerCase());
      }
    });

    // Map formal sales from db.actas
    const derivedFromActas: Comision[] = (db.actas || []).map((a) => {
      // Check if stored override exists
      if (storedMap.has(a.acta)) {
        return storedMap.get(a.acta)!;
      }

      // Default calculation logic
      const val = a.valor_moto || a.total_recibido || 0;
      const pctIva = 19;
      const ivaVal = Math.round(val * (pctIva / 100));
      const valSinIva = val - ivaVal;
      const pctGanancia = 1.5;
      const valGanancia = Math.round(valSinIva * (pctGanancia / 100));

      // Check if this acta is returned/cancelled
      const isDevuelta = returnedActaIds.has(a.acta.toLowerCase()) || 
                         (a.estado && a.estado.toLowerCase().includes("devuel")) ||
                         (a.estado && a.estado.toLowerCase().includes("cancel"));

      return {
        fecha: a.fecha,
        moto: `${a.moto} (Mod: ${a.modelo || "N/A"}, Chasis: ${a.chasis || "N/A"})`,
        valor: val,
        porcentaje_iva: pctIva,
        valor_iva: ivaVal,
        valor_sin_iva: valSinIva,
        porcentaje_ganancia: pctGanancia,
        valor_ganancia: valGanancia,
        vendedor: a.vendedor || "Asesor General",
        acta_consecutivo: a.acta,
        cedula_cliente: a.documento || "N/A",
        nombre_cliente: a.titular_documentos || `${a.nombres || ""} ${a.apellidos || ""}`.trim() || "Cliente Registrado",
        estado: isDevuelta ? "DEVUELTA" : "ACTIVA"
      };
    });

    return derivedFromActas;
  }, [db.comisiones, db.actas, db.devoluciones]);

  // Unique list of sellers for Admin dropdown filter
  const vendedoresList = useMemo(() => {
    const sellers = new Set<string>();
    fullComisiones.forEach((c) => {
      if (c.vendedor) sellers.add(c.vendedor);
    });
    (db.usuarios || []).forEach((u) => {
      if (u.rol === "Vendedor" || u.rol === "Administrador") {
        sellers.add(u.nombre_completo);
      }
    });
    return Array.from(sellers).filter(Boolean);
  }, [fullComisiones, db.usuarios]);

  // Filtered list based on search, status, role, and seller selection
  const visibleComisiones = useMemo(() => {
    let list = fullComisiones;

    // Role restriction: Vendedores only see their own sales
    if (user.rol === "Vendedor") {
      list = list.filter((c) => (c.vendedor || "").toLowerCase() === user.nombre_completo.toLowerCase());
    } else {
      if (adminSelectedVendedor !== "TODOS") {
        list = list.filter((c) => (c.vendedor || "").toLowerCase() === adminSelectedVendedor.toLowerCase());
      }
    }

    // Filter by Status
    if (filterStatus !== "TODOS") {
      list = list.filter((c) => (c.estado || "ACTIVA") === filterStatus);
    }

    // Filter by Date range
    if (fechaInicio) {
      list = list.filter((c) => c.fecha >= fechaInicio);
    }
    if (fechaFin) {
      list = list.filter((c) => c.fecha <= fechaFin);
    }

    // Text search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((c) =>
        (c.moto || "").toLowerCase().includes(q) ||
        (c.vendedor || "").toLowerCase().includes(q) ||
        (c.acta_consecutivo || "").toLowerCase().includes(q) ||
        (c.cedula_cliente || "").toLowerCase().includes(q) ||
        (c.nombre_cliente || "").toLowerCase().includes(q) ||
        (c.fecha || "").includes(q)
      );
    }

    return list;
  }, [fullComisiones, user, adminSelectedVendedor, filterStatus, fechaInicio, fechaFin, searchTerm]);

  // Metrics summary
  const metrics = useMemo(() => {
    const totalVentasValor = visibleComisiones.reduce((acc, c) => acc + (c.valor || 0), 0);
    const totalIva = visibleComisiones.reduce((acc, c) => acc + (c.valor_iva || 0), 0);
    const totalValorSinIva = visibleComisiones.reduce((acc, c) => acc + (c.valor_sin_iva || 0), 0);
    
    // Active commissions vs returned commissions
    const activeComisiones = visibleComisiones.filter(c => c.estado !== "DEVUELTA" && c.estado !== "REVERTIDA");
    const totalComisionActiva = activeComisiones.reduce((acc, c) => acc + (c.valor_ganancia || 0), 0);
    const totalComisionDevuelta = visibleComisiones
      .filter(c => c.estado === "DEVUELTA" || c.estado === "REVERTIDA")
      .reduce((acc, c) => acc + (c.valor_ganancia || 0), 0);

    const countMotos = visibleComisiones.length;
    const avgComision = countMotos > 0 ? Math.round(totalComisionActiva / (activeComisiones.length || 1)) : 0;

    return {
      totalVentasValor,
      totalIva,
      totalValorSinIva,
      totalComisionActiva,
      totalComisionDevuelta,
      countMotos,
      avgComision
    };
  }, [visibleComisiones]);

  // Breakdown by model/motorcycle for Analysis view
  const gananciaPorModelo = useMemo(() => {
    const map = new Map<string, { cantidad: number; totalVenta: number; totalGanancia: number }>();

    visibleComisiones.forEach(c => {
      // Extract model name
      const modelName = c.moto.split("(")[0].trim() || c.moto;
      const current = map.get(modelName) || { cantidad: 0, totalVenta: 0, totalGanancia: 0 };
      map.set(modelName, {
        cantidad: current.cantidad + 1,
        totalVenta: current.totalVenta + (c.valor || 0),
        totalGanancia: current.totalGanancia + (c.estado !== "DEVUELTA" ? (c.valor_ganancia || 0) : 0)
      });
    });

    return Array.from(map.entries()).map(([modelo, stats]) => ({
      modelo,
      ...stats
    })).sort((a, b) => b.totalGanancia - a.totalGanancia);
  }, [visibleComisiones]);

  // Live Simulator calculation
  const calcResults = useMemo(() => {
    const val = calcValor || 0;
    const pctIva = calcPorcentajeIva || 0;
    const iva = Math.round(val * (pctIva / 100));
    const sinIva = val - iva;
    const pctGanancia = calcPorcentajeGanancia || 0;
    const ganancia = Math.round(sinIva * (pctGanancia / 100));

    return {
      valor: val,
      porcentajeIva: pctIva,
      valorIva: iva,
      valorSinIva: sinIva,
      porcentajeGanancia: pctGanancia,
      valorGanancia: ganancia
    };
  }, [calcValor, calcPorcentajeIva, calcPorcentajeGanancia]);

  // Open Edit Modal for Admin
  const handleOpenEdit = (comision: Comision) => {
    setEditingComision(comision);
    setEditPorcentajeIva(comision.porcentaje_iva ?? 19);
    setEditPorcentajeGanancia(comision.porcentaje_ganancia ?? 1.5);
    setEditEstado(comision.estado || "ACTIVA");
    setEditObservaciones(comision.observaciones_ajuste || "");
  };

  // Save Edit / Adjustment (Admin)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComision) return;

    const val = editingComision.valor || 0;
    const ivaVal = Math.round(val * (editPorcentajeIva / 100));
    const sinIvaVal = val - ivaVal;
    const gananciaVal = Math.round(sinIvaVal * (editPorcentajeGanancia / 100));

    const updatedRecord: Comision = {
      ...editingComision,
      porcentaje_iva: editPorcentajeIva,
      valor_iva: ivaVal,
      valor_sin_iva: sinIvaVal,
      porcentaje_ganancia: editPorcentajeGanancia,
      valor_ganancia: gananciaVal,
      estado: editEstado,
      observaciones_ajuste: editObservaciones,
      modificado_por: user.nombre_completo,
      fecha_modificacion: new Date().toISOString().split("T")[0]
    };

    // Update in stored DB comisiones
    const currentStored = db.comisiones || [];
    const index = currentStored.findIndex(c => c.acta_consecutivo === editingComision.acta_consecutivo);
    
    let newStored: Comision[] = [];
    if (index >= 0) {
      newStored = [...currentStored];
      newStored[index] = updatedRecord;
    } else {
      newStored = [...currentStored, updatedRecord];
    }

    setDb({
      ...db,
      comisiones: newStored
    });

    setEditingComision(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="modulo-comisiones">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">
              Hoja Maestra ERP
            </span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
              Capa de Análisis Económico
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase flex items-center space-x-2 mt-1">
            <Award className="text-red-600" size={24} />
            <span>Módulo COMISIONES — Rentabilidad y Ganancias por Moto</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Desglose automático de Valor Venta, IVA (19%), Base Sin IVA, % Ganancia y Ganancia Neta sobre ventas de motocicletas.
          </p>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab("lista")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "lista" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Registros (8 Cols)
            </button>
            <button
              onClick={() => setActiveTab("analisis")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "analisis" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Análisis por Modelo
            </button>
            <button
              onClick={() => setActiveTab("simulador")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "simulador" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Simulador Vivo
            </button>
          </div>

          {user.rol === "Administrador" && (
            <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
              <User size={14} className="text-slate-400" />
              <span className="font-bold text-slate-500 text-[11px]">Asesor:</span>
              <select
                value={adminSelectedVendedor}
                onChange={(e) => setAdminSelectedVendedor(e.target.value)}
                className="text-xs font-bold text-slate-800 focus:outline-hidden bg-slate-50 p-1 rounded-md border border-slate-200"
              >
                <option value="TODOS">Todos los Asesores</option>
                {vendedoresList.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Col C — Venta Brut</span>
          <h3 className="text-sm font-black text-slate-800 font-mono mt-0.5">
            ${metrics.totalVentasValor.toLocaleString()}
          </h3>
          <span className="text-[9px] text-slate-500 font-semibold">{metrics.countMotos} motos en total</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Col E — Total IVA (19%)</span>
          <h3 className="text-sm font-black text-red-600 font-mono mt-0.5">
            ${metrics.totalIva.toLocaleString()}
          </h3>
          <span className="text-[9px] text-slate-500 font-semibold">Impuesto discriminado</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Col F — Total Sin IVA</span>
          <h3 className="text-sm font-black text-slate-700 font-mono mt-0.5">
            ${metrics.totalValorSinIva.toLocaleString()}
          </h3>
          <span className="text-[9px] text-slate-500 font-semibold">Base de cálculo</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Col H — Ganancia Neta</span>
          <h3 className="text-sm font-black text-emerald-700 font-mono mt-0.5">
            ${metrics.totalComisionActiva.toLocaleString()}
          </h3>
          <span className="text-[9px] text-emerald-600 font-semibold">1.5% sin IVA devengado</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Promedio / Moto</span>
          <h3 className="text-sm font-black text-blue-700 font-mono mt-0.5">
            ${metrics.avgComision.toLocaleString()}
          </h3>
          <span className="text-[9px] text-slate-500 font-semibold">Ganancia promedio</span>
        </div>

        <div className={`border rounded-xl p-3 shadow-2xs ${metrics.totalComisionDevuelta > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Revertidas / Devol.</span>
          <h3 className={`text-sm font-black font-mono mt-0.5 ${metrics.totalComisionDevuelta > 0 ? "text-red-700" : "text-slate-400"}`}>
            ${metrics.totalComisionDevuelta.toLocaleString()}
          </h3>
          <span className="text-[9px] text-slate-500 font-semibold">Ajustadas por devolución</span>
        </div>
      </div>

      {/* TAB 1: OFFICIAL 8-COLUMN LIST TABLE & FILTERS */}
      {activeTab === "lista" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
              <div className="relative w-full">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por Moto, Acta #, Asesor o Cédula Cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              <div className="flex items-center space-x-1 text-slate-600 font-medium">
                <span>Estado:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="ACTIVA">Comisiones Activas</option>
                  <option value="DEVUELTA">Devueltas / Canceladas</option>
                  <option value="AJUSTADA">Ajustadas por Admin</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 text-slate-600 font-medium">
                <span>Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
                />
                <span>Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
                />
              </div>

              {(searchTerm || filterStatus !== "TODOS" || fechaInicio || fechaFin) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("TODOS");
                    setFechaInicio("");
                    setFechaFin("");
                  }}
                  className="text-xs text-red-600 underline font-medium hover:text-red-800 ml-1"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Table displaying exact 8 columns (A through H) as per SHEET spec */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-2.5 whitespace-nowrap">Col A<br/>FECHA</th>
                  <th className="p-2.5 whitespace-nowrap">Col B<br/>MOTO</th>
                  <th className="p-2.5 whitespace-nowrap text-right">Col C<br/>VALOR</th>
                  <th className="p-2.5 whitespace-nowrap text-center">Col D<br/>% IVA</th>
                  <th className="p-2.5 whitespace-nowrap text-right text-red-600">Col E<br/>VALOR IVA</th>
                  <th className="p-2.5 whitespace-nowrap text-right">Col F<br/>VALOR SIN IVA</th>
                  <th className="p-2.5 whitespace-nowrap text-center">Col G<br/>% GANANCIA</th>
                  <th className="p-2.5 whitespace-nowrap text-right text-emerald-700 font-black">Col H<br/>VALOR GANANCIA</th>
                  <th className="p-2.5 whitespace-nowrap">ORIGEN / ACTA</th>
                  <th className="p-2.5 whitespace-nowrap">ASESOR</th>
                  <th className="p-2.5 whitespace-nowrap text-center">ESTADO</th>
                  <th className="p-2.5 whitespace-nowrap text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleComisiones.length > 0 ? (
                  visibleComisiones.map((c, idx) => {
                    const isDevuelta = c.estado === "DEVUELTA" || c.estado === "REVERTIDA";
                    const isAjustada = c.estado === "AJUSTADA";

                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors font-medium ${isDevuelta ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50"}`}
                      >
                        <td className="p-2.5 whitespace-nowrap font-mono text-slate-600">{c.fecha}</td>
                        <td className="p-2.5 max-w-[180px] truncate font-semibold text-slate-800" title={c.moto}>
                          {c.moto}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ${(c.valor || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-500">
                          {c.porcentaje_iva}%
                        </td>
                        <td className="p-2.5 text-right font-mono text-red-600">
                          ${(c.valor_iva || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-700">
                          ${(c.valor_sin_iva || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                          {c.porcentaje_ganancia}%
                        </td>
                        <td className={`p-2.5 text-right font-mono font-black bg-emerald-50/50 ${isDevuelta ? "line-through text-slate-400" : "text-emerald-700"}`}>
                          ${(c.valor_ganancia || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-red-600">#{c.acta_consecutivo}</span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-slate-800 font-semibold">
                          {c.vendedor}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {isDevuelta ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-600 text-white">
                              DEVUELTA
                            </span>
                          ) : isAjustada ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                              AJUSTADA
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                              ACTIVA
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap space-x-1">
                          <button
                            onClick={() => setSelectedComisionDetail(c)}
                            className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-bold transition-colors inline-flex items-center space-x-1"
                            title="Ver Hoja de Cálculo Completa"
                          >
                            <Eye size={12} />
                            <span>Detalle</span>
                          </button>

                          {user.rol === "Administrador" && (
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] px-2 py-1 rounded font-bold transition-colors inline-flex items-center space-x-1"
                              title="Ajustar Parámetros o Porcentajes"
                            >
                              <Edit3 size={12} />
                              <span>Ajustar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400 italic">
                      No se encontraron registros de comisiones con los criterios de búsqueda o fecha seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-slate-400 italic">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Fórmula Estándar ERP: VALOR DE GANANCIA = (VALOR − VALOR IVA) × % GANANCIA. Trazabilidad con módulo de Actas.</span>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYSIS BY MODEL */}
      {activeTab === "analisis" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">Análisis Económico de Rentabilidad por Modelo</h3>
              <p className="text-xs text-slate-500">Agrupación de ganancias y margen libre de IVA generado por cada línea de motocicleta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gananciaPorModelo.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-xs text-slate-800">{item.modelo}</span>
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.cantidad} unidades
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Ventas Totales:</span>
                      <span className="font-mono font-bold text-slate-800">${item.totalVenta.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Ganancia Asesores:</span>
                      <span className="font-mono font-bold text-emerald-700">${item.totalGanancia.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SIMULATOR & CALCULATOR */}
      {activeTab === "simulador" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight flex items-center space-x-2">
                <Calculator className="text-red-600" size={18} />
                <span>Simulador de Cascada Económica</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ajuste los parámetros para proyectar exactamente la comisión según la regla comercial definida.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Valor Comercial Moto (COP)
                </label>
                <input
                  type="number"
                  value={calcValor || ""}
                  onChange={(e) => setCalcValor(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  % IVA Configurado
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calcPorcentajeIva}
                  onChange={(e) => setCalcPorcentajeIva(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  % Ganancia Asesor
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calcPorcentajeGanancia}
                  onChange={(e) => setCalcPorcentajeGanancia(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Visual Waterfall Flow */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flujo de Cálculo Paso a Paso:</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 block font-bold">1. VALOR</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">${calcResults.valor.toLocaleString()}</span>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                  <span className="text-[9px] text-red-600 block font-bold">2. VALOR IVA ({calcResults.porcentajeIva}%)</span>
                  <span className="font-mono font-bold text-red-700 text-xs">${calcResults.valorIva.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 block font-bold">3. VALOR SIN IVA</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">${calcResults.valorSinIva.toLocaleString()}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <span className="text-[9px] text-blue-600 block font-bold">4. % GANANCIA</span>
                  <span className="font-mono font-bold text-blue-700 text-xs">{calcResults.porcentajeGanancia}%</span>
                </div>
                <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-xs">
                  <span className="text-[9px] text-emerald-100 block font-bold">5. GANANCIA NETA</span>
                  <span className="font-mono font-black text-sm">${calcResults.valorGanancia.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xs space-y-4">
            <h4 className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <Info size={16} />
              <span>Reglas de Negocio Oficiales</span>
            </h4>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                1. <strong>Capa de Análisis Económico:</strong> El módulo de comisiones no reemplaza el valor pagado en caja ni altera el dinero en banco.
              </p>
              <p>
                2. <strong>No duplicación:</strong> Las comisiones provienen del módulo formal de <strong>DATOS ACTAS</strong>. Las preventas solo alimentan comisiones cuando se convierten en Venta Efectiva (Acta).
              </p>
              <p>
                3. <strong>Devoluciones:</strong> Si un acta es cancelada o devuelta, el registro histórico se conserva pero pasa a estado <strong>DEVUELTA / REVERTIDA</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL VIEW OF 8 COLUMNS */}
      {selectedComisionDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">DOCUMENTO ERP — HOJA COMISIONES</span>
                <h3 className="text-base font-extrabold text-slate-800">Detalle de Comisión — Acta #{selectedComisionDetail.acta_consecutivo}</h3>
              </div>
              <button
                onClick={() => setSelectedComisionDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Fecha Operación:</span>
                <span className="font-bold text-slate-800 font-mono">{selectedComisionDetail.fecha}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Asesor Comercial:</span>
                <span className="font-bold text-slate-800">{selectedComisionDetail.vendedor}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Cliente Comprador:</span>
                <span className="font-bold text-slate-800">{selectedComisionDetail.nombre_cliente || "Registrado en Acta"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Documento Cliente:</span>
                <span className="font-bold text-slate-800 font-mono">{selectedComisionDetail.cedula_cliente || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Desglose Matemático de las 8 Columnas</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded flex justify-between">
                  <span>Col A — Fecha:</span>
                  <span className="font-mono font-bold">{selectedComisionDetail.fecha}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded flex justify-between">
                  <span>Col B — Moto:</span>
                  <span className="font-bold truncate max-w-[120px]">{selectedComisionDetail.moto}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded flex justify-between">
                  <span>Col C — Valor Venta:</span>
                  <span className="font-mono font-bold">${(selectedComisionDetail.valor || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded flex justify-between">
                  <span>Col D — % IVA:</span>
                  <span className="font-mono font-bold">{selectedComisionDetail.porcentaje_iva}%</span>
                </div>
                <div className="p-2 bg-red-50 text-red-800 rounded flex justify-between">
                  <span>Col E — Valor IVA:</span>
                  <span className="font-mono font-bold">${(selectedComisionDetail.valor_iva || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded flex justify-between">
                  <span>Col F — Valor Sin IVA:</span>
                  <span className="font-mono font-bold">${(selectedComisionDetail.valor_sin_iva || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded flex justify-between">
                  <span>Col G — % Ganancia:</span>
                  <span className="font-mono font-bold">{selectedComisionDetail.porcentaje_ganancia}%</span>
                </div>
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded flex justify-between font-bold">
                  <span>Col H — Valor Ganancia:</span>
                  <span className="font-mono">${(selectedComisionDetail.valor_ganancia || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedComisionDetail.observaciones_ajuste && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block text-[10px]">Justificación / Auditoría de Ajuste:</span>
                <p className="text-amber-800 italic">{selectedComisionDetail.observaciones_ajuste}</p>
                <div className="text-[9px] text-amber-700 pt-1">
                  Modificado por: {selectedComisionDetail.modificado_por || "Administrador"} en {selectedComisionDetail.fecha_modificacion || "Fecha reciente"}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedComisionDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN ADJUSTMENT & PARAMETER OVERRIDE */}
      {editingComision && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">PANEL ADMINISTRATIVO</span>
                <h3 className="text-base font-extrabold text-slate-800">Ajuste de Parámetros Económicos</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingComision(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800">Acta #{editingComision.acta_consecutivo} — {editingComision.moto}</div>
              <div className="text-slate-500">Valor Base Operación: <strong className="font-mono text-slate-900">${(editingComision.valor || 0).toLocaleString()} COP</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Porcentaje IVA (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editPorcentajeIva}
                  onChange={(e) => setEditPorcentajeIva(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Porcentaje Ganancia (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editPorcentajeGanancia}
                  onChange={(e) => setEditPorcentajeGanancia(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estado del Registro</label>
              <select
                value={editEstado}
                onChange={(e) => setEditEstado(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
              >
                <option value="ACTIVA">ACTIVA — Comisión Vigente</option>
                <option value="AJUSTADA">AJUSTADA — Parámetros Modificados por Admin</option>
                <option value="DEVUELTA">DEVUELTA — Venta Cancelada / Revertida</option>
                <option value="REVERTIDA">REVERTIDA — Ajuste Contable por Devolución</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Justificación del Ajuste</label>
              <textarea
                value={editObservaciones}
                onChange={(e) => setEditObservaciones(e.target.value)}
                placeholder="Indique el motivo de la modificación (ej: Bonificación especial, Ajuste fiscal, etc.)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden h-20"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingComision(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 shadow-xs flex items-center space-x-1"
              >
                <Save size={14} />
                <span>Guardar Ajuste Auditado</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
