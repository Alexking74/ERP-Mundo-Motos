import React, { useState } from "react";
import { Plus, Search, UserCheck, Shield, FileText, CheckCircle, AlertCircle, PieChart, Edit, Trash2, Link, Building2, MapPin, Phone, Hash, Filter } from "lucide-react";
import { DatabaseState, Usuario, ReferenciaEstudio } from "../types";
import { getTodayDateString, registrarEvento } from "../utils/db";

interface ModuloReferenciasEstudiosProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
}

export default function ModuloReferenciasEstudios({ user, db, setDb }: ModuloReferenciasEstudiosProps) {
  const [activeTab, setActiveTab] = useState<"tabla" | "estadisticas">("tabla");
  const [viewMode, setViewMode] = useState<"13_COLUMNAS" | "TARJETAS">("13_COLUMNAS");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlataforma, setFilterPlataforma] = useState<string>("TODAS");
  const [filterActa, setFilterActa] = useState<"TODOS" | "CON_ACTA" | "SIN_ACTA">("TODOS");

  // Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEstudio, setEditingEstudio] = useState<ReferenciaEstudio | null>(null);

  // Form Fields
  const [estDocumento, setEstDocumento] = useState("");
  const [estCliente, setEstCliente] = useState("");
  const [estActa, setEstActa] = useState("");
  const [estPlataforma, setEstPlataforma] = useState("SUFI");

  // Reference 1 Fields
  const [estRefNombre1, setEstRefNombre1] = useState("");
  const [estRefDir1, setEstRefDir1] = useState("");
  const [estRefBarrio1, setEstRefBarrio1] = useState("");
  const [estRefTel1, setEstRefTel1] = useState("");

  // Reference 2 Fields
  const [estRefNombre2, setEstRefNombre2] = useState("");
  const [estRefDir2, setEstRefDir2] = useState("");
  const [estRefBarrio2, setEstRefBarrio2] = useState("");
  const [estRefTel2, setEstRefTel2] = useState("");

  // Client Auto-Lookup notification
  const [foundClientNotice, setFoundClientNotice] = useState<string | null>(null);

  const estudiosList = db.referencias_estudios || [];

  const PLATAFORMAS_DISPONIBLES = [
    "SUFI (Bancolombia)",
    "Progreso (Financiera Aliada)",
    "Finandina",
    "Coofipop",
    "Crediorbe",
    "Brilla",
    "Bancolombia Directo",
    "Sistecredito",
    "Addi",
    "Crédito Directo Casa"
  ];

  const resetForm = () => {
    setEditingEstudio(null);
    setEstDocumento("");
    setEstCliente("");
    setEstActa("");
    setEstPlataforma("SUFI (Bancolombia)");
    setEstRefNombre1("");
    setEstRefDir1("");
    setEstRefBarrio1("");
    setEstRefTel1("");
    setEstRefNombre2("");
    setEstRefDir2("");
    setEstRefBarrio2("");
    setEstRefTel2("");
    setFoundClientNotice(null);
  };

  // Auto-fill client name when typing document
  const handleDocumentoChange = (docVal: string) => {
    setEstDocumento(docVal);
    const cleanDoc = docVal.trim();
    if (cleanDoc.length >= 4) {
      // 1. Search in clientes_perfil
      const matchedPerfil = (db.clientes_perfil || []).find(
        c => (c.numero_documento || "").trim() === cleanDoc
      );
      if (matchedPerfil) {
        setEstCliente(`${matchedPerfil.nombres} ${matchedPerfil.apellidos}`.trim());
        setFoundClientNotice(`Cliente localizado en PERFIL CLIENTES: ${matchedPerfil.nombres} ${matchedPerfil.apellidos}`);
        return;
      }

      // 2. Search in preventas
      const matchedPreventa = (db.preventas || []).find(
        p => (p.cedula || "").trim() === cleanDoc
      );
      if (matchedPreventa) {
        setEstCliente(`${matchedPreventa.nombre} ${matchedPreventa.apellido || ""}`.trim());
        setFoundClientNotice(`Cliente localizado en PREVENTAS: ${matchedPreventa.nombre} ${matchedPreventa.apellido || ""}`);
        return;
      }

      setFoundClientNotice(null);
    } else {
      setFoundClientNotice(null);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (estudio: ReferenciaEstudio) => {
    setEditingEstudio(estudio);
    setEstDocumento(estudio.documento);
    setEstCliente(estudio.nombres_completos_cliente);
    setEstActa(estudio.acta || "");
    setEstPlataforma(estudio.plataforma || "SUFI (Bancolombia)");

    setEstRefNombre1(estudio.nombre_referencia_1 || "");
    setEstRefDir1(estudio.direccion_1 || "");
    setEstRefBarrio1(estudio.barrio_1 || "");
    setEstRefTel1(estudio.telefono_1 || "");

    setEstRefNombre2(estudio.nombre_referencia_2 || "");
    setEstRefDir2(estudio.direccion_2 || "");
    setEstRefBarrio2(estudio.barrio_2 || "");
    setEstRefTel2(estudio.telefono_2 || "");

    setFoundClientNotice(null);
    setShowFormModal(true);
  };

  const handleSaveEstudio = (e: React.FormEvent) => {
    e.preventDefault();

    if (!estDocumento.trim() || !estCliente.trim()) {
      alert("Atención: El número de DOCUMENTO y el NOMBRE DEL CLIENTE son obligatorios.");
      return;
    }

    if (!estRefNombre1.trim() || !estRefTel1.trim()) {
      alert("Atención: Debe proporcionar al menos la Referencia 1 con Nombre y Teléfono de contacto.");
      return;
    }

    let updatedDb = { ...db };
    let list = [...estudiosList];

    if (editingEstudio) {
      // Editing existing study
      const updatedItem: ReferenciaEstudio = {
        ...editingEstudio,
        documento: estDocumento.trim(),
        nombres_completos_cliente: estCliente.trim(),
        nombre_referencia_1: estRefNombre1.trim(),
        direccion_1: estRefDir1.trim() || "N/A",
        barrio_1: estRefBarrio1.trim() || "N/A",
        telefono_1: estRefTel1.trim(),
        nombre_referencia_2: estRefNombre2.trim() || "N/A",
        direccion_2: estRefDir2.trim() || "N/A",
        barrio_2: estRefBarrio2.trim() || "N/A",
        telefono_2: estRefTel2.trim() || "N/A",
        plataforma: estPlataforma,
        acta: estActa.trim() || "Sin Acta"
      };

      list = list.map(item => item.no === editingEstudio.no ? updatedItem : item);
      updatedDb.referencias_estudios = list;

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "REFERENCIAS",
        "Modificar Estudio",
        "AMARILLA",
        "Documento Cliente",
        editingEstudio.documento,
        estDocumento.trim(),
        `Se actualizó el registro de estudio de crédito para el cliente ${estCliente} (Cédula: ${estDocumento}).`
      );

      setDb(updatedDb);
      setShowFormModal(false);
      resetForm();
      alert("Estudio de crédito actualizado correctamente.");

    } else {
      // Creating new study
      const nextNo = list.reduce((max, r) => (r.no > max ? r.no : max), 0) + 1;

      const newItem: ReferenciaEstudio = {
        no: nextNo,
        documento: estDocumento.trim(),
        nombres_completos_cliente: estCliente.trim(),
        nombre_referencia_1: estRefNombre1.trim(),
        direccion_1: estRefDir1.trim() || "N/A",
        barrio_1: estRefBarrio1.trim() || "N/A",
        telefono_1: estRefTel1.trim(),
        nombre_referencia_2: estRefNombre2.trim() || "N/A",
        direccion_2: estRefDir2.trim() || "N/A",
        barrio_2: estRefBarrio2.trim() || "N/A",
        telefono_2: estRefTel2.trim() || "N/A",
        plataforma: estPlataforma,
        acta: estActa.trim() || "Sin Acta"
      };

      updatedDb.referencias_estudios = [newItem, ...list];

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "REFERENCIAS",
        "Registrar Estudio",
        "VERDE",
        "Documento Cliente",
        "",
        estDocumento.trim(),
        `Se registró nuevo estudio de crédito (#${nextNo}) para ${estCliente} (Cédula: ${estDocumento}).`
      );

      setDb(updatedDb);
      setShowFormModal(false);
      resetForm();
      alert(`Estudio de crédito #${nextNo} registrado exitosamente.`);
    }
  };

  const handleDeleteEstudio = (estudio: ReferenciaEstudio) => {
    if (user.rol !== "Administrador") {
      alert("Acceso Restringido: Solo el Administrador puede eliminar registros de estudios de crédito.");
      return;
    }

    if (!confirm(`¿Está seguro de eliminar permanentemente el estudio de crédito de:\n\nClient: ${estudio.nombres_completos_cliente}\nDocumento: ${estudio.documento}\nNo. Consecutivo: #${estudio.no}?`)) {
      return;
    }

    const updatedList = estudiosList.filter(item => item.no !== estudio.no);
    let updatedDb = { ...db, referencias_estudios: updatedList };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REFERENCIAS",
      "Eliminar Estudio",
      "ROJA",
      "Documento Cliente",
      estudio.documento,
      "",
      `Se eliminó el estudio de crédito #${estudio.no} perteneciente a ${estudio.nombres_completos_cliente}.`
    );

    setDb(updatedDb);
    alert("Estudio de crédito eliminado del sistema.");
  };

  // -------------------------
  // FILTERING LOGIC
  // -------------------------
  const filteredEstudios = estudiosList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      item.documento.toLowerCase().includes(term) ||
      item.nombres_completos_cliente.toLowerCase().includes(term) ||
      (item.nombre_referencia_1 || "").toLowerCase().includes(term) ||
      (item.nombre_referencia_2 || "").toLowerCase().includes(term) ||
      (item.plataforma || "").toLowerCase().includes(term) ||
      (item.acta || "").toLowerCase().includes(term) ||
      item.no.toString().includes(term);

    let matchPlataforma = true;
    if (filterPlataforma !== "TODAS") {
      matchPlataforma = (item.plataforma || "").toLowerCase().includes(filterPlataforma.slice(0, 5).toLowerCase());
    }

    let matchActa = true;
    if (filterActa === "CON_ACTA") matchActa = Boolean(item.acta && item.acta !== "Sin Acta" && item.acta !== "N/A");
    if (filterActa === "SIN_ACTA") matchActa = !item.acta || item.acta === "Sin Acta" || item.acta === "N/A";

    return matchSearch && matchPlataforma && matchActa;
  });

  // KPI Calculations
  const totalEstudios = estudiosList.length;
  const estudiosConActa = estudiosList.filter(e => e.acta && e.acta !== "Sin Acta" && e.acta !== "N/A");
  const estudiosSinActa = estudiosList.filter(e => !e.acta || e.acta === "Sin Acta" || e.acta === "N/A");

  // Platform Breakdown Stats
  const platformStats: { [key: string]: number } = {};
  estudiosList.forEach(e => {
    const plat = e.plataforma || "Sin Plataforma";
    platformStats[plat] = (platformStats[plat] || 0) + 1;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">HOJA REFERENCIAS ESTUDIOS</span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">REFERENCIAS ESTUDIOS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro y trazabilidad de referencias personales para estudio de crédito. Estructura oficial de 13 columnas (Col A-M).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("tabla")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "tabla" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Registros de Estudios
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
            <span>Registrar Nuevo Estudio</span>
          </button>
        </div>
      </div>

      {/* KPI Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Estudios Registrados</span>
            <FileText size={16} className="text-slate-700" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalEstudios}</div>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Estudios de crédito históricos</p>
        </div>

        <div className="bg-green-50/60 border border-green-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-green-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Con Acta Vinculada</span>
            <CheckCircle size={16} />
          </div>
          <div className="text-xl font-black text-green-800 mt-1">{estudiosConActa.length}</div>
          <p className="text-[10px] text-green-600 font-semibold mt-0.5">Formalizados con venta</p>
        </div>

        <div className="bg-yellow-50/60 border border-yellow-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-yellow-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pendientes de Acta</span>
            <AlertCircle size={16} />
          </div>
          <div className="text-xl font-black text-yellow-800 mt-1">{estudiosSinActa.length}</div>
          <p className="text-[10px] text-yellow-700 font-semibold mt-0.5">En proceso de aprobación / estudio</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Plataforma Principal</span>
            <Building2 size={16} className="text-red-500" />
          </div>
          <div className="text-base font-black text-slate-800 mt-1 truncate">
            {Object.keys(platformStats).length > 0 ? Object.keys(platformStats)[0] : "N/A"}
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            {Object.keys(platformStats).length} plataformas utilizadas
          </p>
        </div>
      </div>

      {activeTab === "tabla" ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          
          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Buscar por Documento, Nombre, Ref 1, Ref 2, Acta, No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <select
                value={filterPlataforma}
                onChange={(e) => setFilterPlataforma(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-bold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
              >
                <option value="TODAS">Plataforma: Todas</option>
                {PLATAFORMAS_DISPONIBLES.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={filterActa}
                onChange={(e: any) => setFilterActa(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-bold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
              >
                <option value="TODOS">Acta: Todos</option>
                <option value="CON_ACTA">Con Acta Vinculada</option>
                <option value="SIN_ACTA">Sin Acta (Pendiente)</option>
              </select>

              <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-bold">
                <button
                  onClick={() => setViewMode("13_COLUMNAS")}
                  className={`px-2 py-1 rounded ${viewMode === "13_COLUMNAS" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  Hoja 13 Cols
                </button>
                <button
                  onClick={() => setViewMode("TARJETAS")}
                  className={`px-2 py-1 rounded ${viewMode === "TARJETAS" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  Vista Resumen
                </button>
              </div>

              {(searchTerm || filterPlataforma !== "TODAS" || filterActa !== "TODOS") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterPlataforma("TODAS");
                    setFilterActa("TODOS");
                  }}
                  className="text-xs text-red-600 hover:underline font-bold px-2 py-1"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* OFFICIAL 13 COLUMNS ERP TABLE VIEW */}
          {viewMode === "13_COLUMNAS" ? (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold tracking-wide uppercase divide-x divide-slate-700">
                    <th className="p-3 whitespace-nowrap text-slate-300">A - No.</th>
                    <th className="p-3 whitespace-nowrap text-slate-300">B - DOCUMENTO</th>
                    <th className="p-3 text-slate-300 min-w-[160px]">C - NOMBRES COMPLETOS CLIENTE</th>
                    <th className="p-3 text-slate-300 min-w-[140px]">D - NOMBRE REFERENCIA 1</th>
                    <th className="p-3 text-slate-300">E - DIRECCION 1</th>
                    <th className="p-3 text-slate-300">F - BARRIO 1</th>
                    <th className="p-3 text-slate-300 whitespace-nowrap">G - TELEFONO 1</th>
                    <th className="p-3 text-slate-300 min-w-[140px]">H - NOMBRE REFERENCIA 2</th>
                    <th className="p-3 text-slate-300">I - DIRECCION 2</th>
                    <th className="p-3 text-slate-300">J - BARRIO 2</th>
                    <th className="p-3 text-slate-300 whitespace-nowrap">K - TELEFONO 2</th>
                    <th className="p-3 text-slate-300 whitespace-nowrap">L - PLATAFORMA</th>
                    <th className="p-3 text-slate-300 whitespace-nowrap bg-slate-900">M - ACTA</th>
                    <th className="p-3 text-center text-slate-300 whitespace-nowrap">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredEstudios.length > 0 ? (
                    filteredEstudios.map((item) => {
                      const tieneActa = item.acta && item.acta !== "Sin Acta" && item.acta !== "N/A";
                      return (
                        <tr key={item.no} className="hover:bg-slate-50 transition-colors divide-x divide-slate-100 font-medium">
                          <td className="p-3 font-mono font-bold text-slate-500 text-center">{item.no}</td>
                          <td className="p-3 font-mono font-bold text-red-600 whitespace-nowrap bg-red-50/30">{item.documento}</td>
                          <td className="p-3 font-bold text-slate-900">{item.nombres_completos_cliente}</td>
                          <td className="p-3 text-slate-800 font-semibold">{item.nombre_referencia_1}</td>
                          <td className="p-3 text-slate-600">{item.direccion_1 || "N/A"}</td>
                          <td className="p-3 text-slate-600">{item.barrio_1 || "N/A"}</td>
                          <td className="p-3 font-mono font-semibold text-slate-700 whitespace-nowrap">{item.telefono_1}</td>
                          <td className="p-3 text-slate-800 font-semibold">{item.nombre_referencia_2 || "N/A"}</td>
                          <td className="p-3 text-slate-600">{item.direccion_2 || "N/A"}</td>
                          <td className="p-3 text-slate-600">{item.barrio_2 || "N/A"}</td>
                          <td className="p-3 font-mono font-semibold text-slate-700 whitespace-nowrap">{item.telefono_2 || "N/A"}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {item.plataforma}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold whitespace-nowrap bg-slate-50">
                            {tieneActa ? (
                              <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200">
                                {item.acta}
                              </span>
                            ) : (
                              <span className="text-amber-700 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200 text-[10px]">
                                Sin Acta
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-slate-600 hover:text-slate-900 p-1 hover:bg-slate-100 rounded"
                                title="Editar Registro de Estudio"
                              >
                                <Edit size={14} />
                              </button>
                              {user.rol === "Administrador" && (
                                <button
                                  onClick={() => handleDeleteEstudio(item)}
                                  className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
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
                      <td colSpan={14} className="p-8 text-center text-slate-400">
                        No se encontraron estudios de crédito registrados que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* RESUMEN DE TARJETAS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEstudios.map((item) => (
                <div key={item.no} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">ESTUDIO #{item.no}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{item.nombres_completos_cliente}</h4>
                      <p className="text-xs font-mono font-bold text-red-600">CC: {item.documento}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                      {item.plataforma}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Referencia 1 (Familiar):</span>
                      <p className="font-bold text-slate-800">{item.nombre_referencia_1}</p>
                      <p className="text-[11px] text-slate-500">{item.direccion_1} ({item.barrio_1})</p>
                      <p className="font-mono text-slate-700 font-semibold">Tel: {item.telefono_1}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Referencia 2 (Personal):</span>
                      <p className="font-bold text-slate-800">{item.nombre_referencia_2}</p>
                      <p className="text-[11px] text-slate-500">{item.direccion_2} ({item.barrio_2})</p>
                      <p className="font-mono text-slate-700 font-semibold">Tel: {item.telefono_2}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2.5 text-xs">
                    <span className="font-mono text-[11px] font-bold text-slate-600">
                      Acta: <span className="text-slate-900">{item.acta || "Sin Acta"}</span>
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                      >
                        <Edit size={14} />
                      </button>
                      {user.rol === "Administrador" && (
                        <button
                          onClick={() => handleDeleteEstudio(item)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* STATISTICS SUBTAB */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fade-in">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Estadísticas Administrativas de Estudios</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribución de solicitudes por plataforma evaluadora y grado de formalización con actas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2">Estudios por Plataforma Evaluadora</h4>
              <div className="space-y-3">
                {Object.entries(platformStats).map(([platKey, count], i) => {
                  const pct = totalEstudios > 0 ? (count / totalEstudios) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{platKey}</span>
                        <span className="font-mono font-bold text-slate-900">{count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-slate-800 h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2">Vinculación con Venta (Actas)</h4>
              
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-green-100 text-green-700 rounded-xl">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">Estudios con Venta (Acta Asignada)</h5>
                      <p className="text-[11px] text-slate-500">{estudiosConActa.length} solicitudes convertidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-green-700">
                      {totalEstudios > 0 ? ((estudiosConActa.length / totalEstudios) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-yellow-100 text-yellow-700 rounded-xl">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">Estudios Sin Venta Aún</h5>
                      <p className="text-[11px] text-slate-500">{estudiosSinActa.length} estudios en trámite o cotización</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-yellow-800">
                      {totalEstudios > 0 ? ((estudiosSinActa.length / totalEstudios) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL REGISTRAR / EDITAR ESTUDIO */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <form onSubmit={handleSaveEstudio} className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">HOJA REFERENCIAS</span>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  {editingEstudio ? `Editar Estudio #${editingEstudio.no}` : "Registrar Nuevo Estudio de Crédito"}
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

            {/* Auto-Lookup Notice Banner */}
            {foundClientNotice && (
              <div className="bg-green-50 border border-green-200 p-2.5 rounded-xl text-xs font-bold text-green-800 flex items-center space-x-2">
                <UserCheck size={16} className="text-green-600" />
                <span>{foundClientNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              
              {/* DOCUMENTO CLIENTE (B) */}
              <div>
                <label className="block mb-1 text-slate-800">B - DOCUMENTO DE IDENTIDAD CLIENTE *</label>
                <input
                  type="text"
                  required
                  placeholder="Escriba la Cédula o Nit del Cliente..."
                  value={estDocumento}
                  onChange={(e) => handleDocumentoChange(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-black text-red-600 focus:outline-hidden"
                />
              </div>

              {/* NOMBRES COMPLETOS CLIENTE (C) */}
              <div>
                <label className="block mb-1 text-slate-800">C - NOMBRES COMPLETOS CLIENTE *</label>
                <input
                  type="text"
                  required
                  placeholder="Nombres y Apellidos del postulante..."
                  value={estCliente}
                  onChange={(e) => setEstCliente(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold text-slate-900 focus:outline-hidden"
                />
              </div>

              {/* PLATAFORMA (L) */}
              <div>
                <label className="block mb-1 text-slate-800">L - PLATAFORMA FINANCIERA EVALUADORA *</label>
                <select
                  value={estPlataforma}
                  onChange={(e) => setEstPlataforma(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold text-slate-800 focus:outline-hidden"
                >
                  {PLATAFORMAS_DISPONIBLES.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* ACTA VINCULADA (M) */}
              <div>
                <label className="block mb-1 text-slate-800">M - ACTA CONSECUTIVO VINCULADA</label>
                <input
                  type="text"
                  placeholder="Ej: ACTA-1029 (Opcional)"
                  value={estActa}
                  onChange={(e) => setEstActa(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold text-slate-800 focus:outline-hidden"
                />
              </div>

              {/* REFERENCIA 1 (D, E, F, G) */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border space-y-3">
                <h4 className="font-bold text-xs text-red-600 uppercase tracking-wider border-b pb-1">
                  REFERENCIA 1 (Familiar / Personal Principal) *
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-slate-600 text-[11px]">D - NOMBRE REFERENCIA 1 *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombres y Apellidos completados..."
                      value={estRefNombre1}
                      onChange={(e) => setEstRefNombre1(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600 text-[11px]">E - DIRECCIÓN 1</label>
                    <input
                      type="text"
                      placeholder="Dirección residencia..."
                      value={estRefDir1}
                      onChange={(e) => setEstRefDir1(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600 text-[11px]">F - BARRIO 1</label>
                    <input
                      type="text"
                      placeholder="Barrio..."
                      value={estRefBarrio1}
                      onChange={(e) => setEstRefBarrio1(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-slate-600 text-[11px]">G - TELÉFONO / CELULAR 1 *</label>
                    <input
                      type="text"
                      required
                      placeholder="Número telefónico de contacto..."
                      value={estRefTel1}
                      onChange={(e) => setEstRefTel1(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* REFERENCIA 2 (H, I, J, K) */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border space-y-3">
                <h4 className="font-bold text-xs text-red-600 uppercase tracking-wider border-b pb-1">
                  REFERENCIA 2 (Personal / Comercial Secundario)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-slate-600 text-[11px]">H - NOMBRE REFERENCIA 2</label>
                    <input
                      type="text"
                      placeholder="Nombres y Apellidos segunda referencia..."
                      value={estRefNombre2}
                      onChange={(e) => setEstRefNombre2(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600 text-[11px]">I - DIRECCIÓN 2</label>
                    <input
                      type="text"
                      placeholder="Dirección..."
                      value={estRefDir2}
                      onChange={(e) => setEstRefDir2(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600 text-[11px]">J - BARRIO 2</label>
                    <input
                      type="text"
                      placeholder="Barrio..."
                      value={estRefBarrio2}
                      onChange={(e) => setEstRefBarrio2(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-slate-600 text-[11px]">K - TELÉFONO / CELULAR 2</label>
                    <input
                      type="text"
                      placeholder="Número telefónico..."
                      value={estRefTel2}
                      onChange={(e) => setEstRefTel2(e.target.value)}
                      className="w-full bg-white border rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

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
                {editingEstudio ? "Guardar Modificación" : "Registrar Estudio de Crédito"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
