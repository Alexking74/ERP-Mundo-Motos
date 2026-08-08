import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Edit2, Trash2, Shield, Award, CheckCircle, ListFilter, 
  MapPin, Clipboard, CheckSquare, RefreshCw, UserCheck, Eye, EyeOff, Hash, ShieldAlert
} from "lucide-react";
import { DatabaseState, Usuario, Matricula, RangoPlaca, Acta, ReferenciaEstudio } from "../types";
import { getTodayDateString, registrarEvento } from "../utils/db";
import PerfilCliente from "./PerfilCliente";
import ModuloReferenciasEstudios from "./ModuloReferenciasEstudios";

interface PapeleriaClientesProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
  initialTab?: "matriculas" | "perfiles" | "placas";
}

export default function ModuloPapeleriaClientes({ user, db, setDb, initialTab }: PapeleriaClientesProps) {
  const [activeTab, setActiveTab] = useState<"matriculas" | "perfiles" | "placas" | "estudios">(initialTab || "matriculas");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // States for ReferenciasEstudios CRUD (ported for Asesores)
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
  
  // Matrículas States
  const [matriculaSearch, setMatriculaSearch] = useState("");
  const [showMatriculaForm, setShowMatriculaForm] = useState(false);
  const [editingMatriculaIndex, setEditingMatriculaIndex] = useState<number | null>(null);

  // Matrícula Form Fields
  const [matFecha, setMatFecha] = useState(getTodayDateString());
  const [matNombre, setMatNombre] = useState("");
  const [matApellidos, setMatApellidos] = useState("");
  const [matTipoDoc, setMatTipoDoc] = useState("CC");
  const [matDocumento, setMatDocumento] = useState("");
  const [matCelular, setMatCelular] = useState("");
  const [matMoto, setMatMoto] = useState("");
  const [matMotor, setMatMotor] = useState("");
  const [matChasis, setMatChasis] = useState("");
  const [matModelo, setMatModelo] = useState("");
  const [matCilindraje, setMatCilindraje] = useState("");
  const [matCiudad, setMatCiudad] = useState("Planadas");
  const [matTransito, setMatTransito] = useState("Secretaría de Tránsito Planadas");
  const [matImpuesto, setMatImpuesto] = useState(150000);
  const [matValor, setMatValor] = useState(320000);
  const [matNotas, setMatNotas] = useState("");
  const [matEstado, setMatEstado] = useState<"Pendiente" | "En proceso" | "Finalizado" | "Cancelado">("Pendiente");
  const [matRango, setMatRango] = useState("");

  // Placas y Rangos States
  const [placaSearch, setPlacaSearch] = useState("");
  const [showRangoForm, setShowRangoForm] = useState(false);
  
  // Rango Generator Fields
  const [genPrefijo, setGenPrefijo] = useState("");
  const [genInicio, setGenInicio] = useState(1);
  const [genFin, setGenFin] = useState(10);
  const [genSufijo, setGenSufijo] = useState("");
  const [genCiudad, setGenCiudad] = useState("Planadas");

  // Initializing missing fields if any
  const rangosPlacas = db.rangos_placas || [];

  // -------------------------
  // MATRÍCULAS CRUD FUNCTIONS
  // -------------------------
  const openNewMatricula = () => {
    setEditingMatriculaIndex(null);
    setMatFecha(getTodayDateString());
    setMatNombre("");
    setMatApellidos("");
    setMatTipoDoc("CC");
    setMatDocumento("");
    setMatCelular("");
    setMatMoto("");
    setMatMotor("");
    setMatChasis("");
    setMatModelo("");
    setMatCilindraje("");
    setMatCiudad("Planadas");
    setMatTransito("Secretaría de Tránsito Planadas");
    setMatImpuesto(150000);
    setMatValor(320000);
    setMatNotas("");
    setMatEstado("Pendiente");
    setMatRango("");
    setShowMatriculaForm(true);
  };

  const handleEditMatricula = (idx: number, item: Matricula) => {
    setEditingMatriculaIndex(idx);
    setMatFecha(item.fecha);
    setMatNombre(item.nombre);
    setMatApellidos(item.apellidos);
    setMatTipoDoc(item.tipo_documento);
    setMatDocumento(item.documento);
    setMatCelular(item.celular);
    setMatMoto(item.motocicleta);
    setMatMotor(item.motor);
    setMatChasis(item.chasis);
    setMatModelo(item.modelo);
    setMatCilindraje(item.cilindraje);
    setMatCiudad(item.ciudad);
    setMatTransito(item.transito);
    setMatImpuesto(item.impuesto);
    setMatValor(item.valor);
    setMatNotas(item.notas);
    setMatEstado(item.estado);
    setMatRango(item.rango || "");
    setShowMatriculaForm(true);
  };

  const handleSaveMatricula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matNombre || !matApellidos || !matDocumento || !matChasis) {
      alert("Por favor rellene los campos obligatorios (*).");
      return;
    }

    let updatedMatriculas = [...db.matriculas];
    const newMatData: Matricula = {
      fecha: matFecha,
      nombre: matNombre,
      apellidos: matApellidos,
      tipo_documento: matTipoDoc,
      documento: matDocumento,
      celular: matCelular,
      motocicleta: matMoto,
      motor: matMotor,
      chasis: matChasis,
      modelo: matModelo,
      cilindraje: matCilindraje,
      ciudad: matCiudad,
      transito: matTransito,
      impuesto: Number(matImpuesto),
      valor: Number(matValor),
      notas: matNotas,
      estado: matEstado,
      rango: matRango
    };

    let updatedDb = { ...db };

    if (editingMatriculaIndex !== null) {
      // Edit mode
      const prev = updatedMatriculas[editingMatriculaIndex];
      updatedMatriculas[editingMatriculaIndex] = newMatData;
      updatedDb.matriculas = updatedMatriculas;

      // Log event
      updatedDb = registrarEvento(
        updatedDb,
        user,
        "MATRICULAS",
        "Actualizar",
        "AMARILLA",
        "Matrícula",
        prev.chasis,
        matChasis,
        `Se actualizó la matrícula de ${matNombre} ${matApellidos} (Chasis: ${matChasis}).`
      );
    } else {
      // Create mode
      updatedDb.matriculas = [newMatData, ...db.matriculas];

      // Log event
      updatedDb = registrarEvento(
        updatedDb,
        user,
        "MATRICULAS",
        "Crear",
        "VERDE",
        "Matrícula",
        "",
        matChasis,
        `Se registró manualmente una nueva matrícula para ${matNombre} ${matApellidos} (Chasis: ${matChasis}).`
      );
    }

    // Sync back to Actas if plate changed
    if (matRango) {
      updatedDb.actas = updatedDb.actas.map(a => {
        if (a.chasis === matChasis || a.documento === matDocumento) {
          return { ...a, rango: matRango };
        }
        return a;
      });
    }

    setDb(updatedDb);
    setShowMatriculaForm(false);
    setEditingMatriculaIndex(null);
    alert("Trámite de matrícula guardado con éxito.");
  };

  const handleDeleteMatricula = (idx: number) => {
    if (!window.confirm("¿Está completamente seguro de eliminar este registro de matrícula? Esta acción es irreversible.")) {
      return;
    }

    const itemToDelete = db.matriculas[idx];
    let updatedMatriculas = db.matriculas.filter((_, i) => i !== idx);
    let updatedDb = { ...db, matriculas: updatedMatriculas };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MATRICULAS",
      "Eliminar",
      "ROJA",
      "Matrícula",
      itemToDelete.chasis,
      "",
      `Se eliminó el trámite de matrícula de ${itemToDelete.nombre} ${itemToDelete.apellidos}.`
    );

    setDb(updatedDb);
    alert("Registro de matrícula eliminado.");
  };

  // -------------------------
  // PLACAS Y RANGOS FUNCTIONS
  // -------------------------
  const handleGenerateRango = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPrefijo) {
      alert("Ingrese las letras del prefijo (ej. KDX o AAA).");
      return;
    }
    if (genFin < genInicio) {
      alert("El número final debe ser mayor o igual al inicial.");
      return;
    }

    const generatedPlates: string[] = [];
    for (let i = genInicio; i <= genFin; i++) {
      // Pad numbers (e.g., KDX01F or KDX10F)
      const numStr = String(i).padStart(2, "0");
      const plate = `${genPrefijo.toUpperCase()}${numStr}${genSufijo.toUpperCase()}`;
      generatedPlates.push(plate);
    }

    const newRango: RangoPlaca = {
      id: String(Math.floor(100 + Math.random() * 900)),
      rango_inicial: generatedPlates[0],
      rango_final: generatedPlates[generatedPlates.length - 1],
      transito_ciudad: genCiudad,
      estado: "Activo",
      placas_disponibles: generatedPlates,
      placas_utilizadas: []
    };

    let updatedDb: DatabaseState = {
      ...db,
      rangos_placas: [newRango, ...rangosPlacas]
    };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "PLACAS Y RANGOS",
      "Crear",
      "VERDE",
      "Rango Placas",
      "",
      newRango.id,
      `Se generó un nuevo rango de placas ${newRango.rango_inicial} - ${newRango.rango_final} para el tránsito de ${genCiudad}.`
    );

    setDb(updatedDb);
    setShowRangoForm(false);
    setGenPrefijo("");
    setGenSufijo("");
    alert(`Se registraron ${generatedPlates.length} nuevas placas con éxito.`);
  };

  const handleAutoAssignPlate = (matIdx: number, matricula: Matricula) => {
    // 1. Find an active range matching the city of transit
    const availableRanges = rangosPlacas.filter(r => 
      r.estado === "Activo" && 
      r.placas_disponibles.length > 0 &&
      r.transito_ciudad.toLowerCase() === matricula.ciudad.toLowerCase()
    );

    // Fallback: search any active range with plates
    const matchedRange = availableRanges[0] || rangosPlacas.find(r => r.estado === "Activo" && r.placas_disponibles.length > 0);

    if (!matchedRange) {
      alert("ALERTA: No hay placas disponibles registradas para el tránsito de " + matricula.ciudad + ". Por favor registre un nuevo rango de placas primero.");
      return;
    }

    const assignedPlate = matchedRange.placas_disponibles[0];

    // 2. Update Matrícula
    let updatedMatriculas = [...db.matriculas];
    updatedMatriculas[matIdx] = {
      ...matricula,
      rango: assignedPlate,
      estado: "Finalizado"
    };

    let updatedDb = { ...db };
    updatedDb.matriculas = updatedMatriculas;

    // 3. Move plate in Placas y Rangos
    updatedDb.rangos_placas = rangosPlacas.map(r => {
      if (r.id === matchedRange.id) {
        const remaining = r.placas_disponibles.filter(p => p !== assignedPlate);
        return {
          ...r,
          placas_disponibles: remaining,
          placas_utilizadas: [...r.placas_utilizadas, assignedPlate],
          estado: remaining.length === 0 ? ("Agotado" as const) : ("Activo" as const)
        };
      }
      return r;
    });

    // 4. Sync with corresponding Acta
    updatedDb.actas = updatedDb.actas.map(a => {
      if (a.chasis === matricula.chasis || a.documento === matricula.documento) {
        return {
          ...a,
          rango: assignedPlate,
          estado: "Finalizada"
        };
      }
      return a;
    });

    // 5. Sync with corresponding Revisiones if any
    updatedDb.revisiones = updatedDb.revisiones.map(rev => {
      if (rev.chasis === matricula.chasis) {
        return { ...rev, placa: assignedPlate };
      }
      return rev;
    });

    // 6. Log dynamic audit event
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MATRICULAS",
      "Actualizar",
      "VERDE",
      "Asignación Automática",
      "",
      assignedPlate,
      `Asignación automática de placa exitosa. Placa "${assignedPlate}" asignada a ${matricula.nombre} ${matricula.apellidos} para su motocicleta.`
    );

    setDb(updatedDb);
    alert(`¡Placa asignada con éxito! Se asignó la placa ${assignedPlate} de forma automatizada y se actualizó el acta de venta.`);
  };

  const handleManualMarkAsUsed = (rangoId: string, plate: string) => {
    if (!window.confirm(`¿Seguro que desea marcar la placa ${plate} como utilizada manualmente?`)) return;

    let updatedDb = { ...db };
    updatedDb.rangos_placas = rangosPlacas.map(r => {
      if (r.id === rangoId) {
        const remaining = r.placas_disponibles.filter(p => p !== plate);
        return {
          ...r,
          placas_disponibles: remaining,
          placas_utilizadas: [...r.placas_utilizadas, plate],
          estado: remaining.length === 0 ? ("Agotado" as const) : ("Activo" as const)
        };
      }
      return r;
    });

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "PLACAS Y RANGOS",
      "Actualizar",
      "AMARILLA",
      "Estado Placa",
      plate,
      "Utilizada",
      `Placa ${plate} marcada como utilizada manualmente por el administrador.`
    );

    setDb(updatedDb);
    alert(`Placa ${plate} marcada como utilizada.`);
  };

  // Filtered Lists
  const filteredMatriculas = db.matriculas.filter((m) => {
    const term = matriculaSearch.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(term) ||
      m.apellidos.toLowerCase().includes(term) ||
      m.documento.includes(term) ||
      m.chasis.toLowerCase().includes(term) ||
      (m.rango || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper Module Menu Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("matriculas")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "matriculas" ? "bg-red-600 text-white shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Clipboard size={14} />
            <span>Matrículas de Tránsito</span>
          </button>
          <button
            onClick={() => setActiveTab("perfiles")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "perfiles" ? "bg-red-600 text-white shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <UserCheck size={14} />
            <span>Expediente de Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab("placas")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "placas" ? "bg-red-600 text-white shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Hash size={14} />
            <span>Placas y Rangos</span>
          </button>
          <button
            onClick={() => setActiveTab("estudios")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "estudios" ? "bg-red-600 text-white shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Estudios de Crédito</span>
          </button>
        </div>
        
        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full uppercase">
          ÁREA PAPELERÍA & ARCHIVO
        </span>
      </div>

      {/* RENDER ACTIVE SCREEN */}
      {activeTab === "matriculas" && (
        <div className="space-y-4">
          
          {/* List Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar trámites por nombre, cédula, chasis, placa..."
                value={matriculaSearch}
                onChange={(e) => setMatriculaSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>
            
            <button
              onClick={openNewMatricula}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Registrar Matrícula</span>
            </button>
          </div>

          {/* Form Modal/Section */}
          {showMatriculaForm && (
            <div className="bg-slate-50 border rounded-2xl p-6 relative animate-fade-in">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="font-bold text-sm text-slate-800">
                  {editingMatriculaIndex !== null ? "Editar Trámite de Matrícula" : "Registrar Nuevo Trámite de Matrícula"}
                </h3>
                <button 
                  onClick={() => setShowMatriculaForm(false)} 
                  className="text-slate-400 hover:text-slate-800 text-sm font-bold"
                >
                  Cancelar (X)
                </button>
              </div>

              <form onSubmit={handleSaveMatricula} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 mb-1">Fecha Registro *</label>
                  <input
                    type="date"
                    required
                    value={matFecha}
                    onChange={(e) => setMatFecha(e.target.value)}
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Nombres Propietario *</label>
                  <input
                    type="text"
                    required
                    value={matNombre}
                    onChange={(e) => setMatNombre(e.target.value)}
                    placeholder="Nombres"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Apellidos Propietario *</label>
                  <input
                    type="text"
                    required
                    value={matApellidos}
                    onChange={(e) => setMatApellidos(e.target.value)}
                    placeholder="Apellidos"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Tipo Identificación</label>
                  <select
                    value={matTipoDoc}
                    onChange={(e) => setMatTipoDoc(e.target.value)}
                    className="w-full bg-white border rounded p-2 text-xs"
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="NIT">NIT (Empresas)</option>
                    <option value="CE">Cédula Extranjería (CE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">No. Documento *</label>
                  <input
                    type="text"
                    required
                    value={matDocumento}
                    onChange={(e) => setMatDocumento(e.target.value)}
                    placeholder="Documento"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Celular Propietario</label>
                  <input
                    type="text"
                    value={matCelular}
                    onChange={(e) => setMatCelular(e.target.value)}
                    placeholder="Celular"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Motocicleta (Referencia)</label>
                  <input
                    type="text"
                    value={matMoto}
                    onChange={(e) => setMatMoto(e.target.value)}
                    placeholder="Ej. CB125F o similar"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Número Motor</label>
                  <input
                    type="text"
                    value={matMotor}
                    onChange={(e) => setMatMotor(e.target.value)}
                    placeholder="No. Motor"
                    className="w-full bg-white border rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Número Chasis *</label>
                  <input
                    type="text"
                    required
                    value={matChasis}
                    onChange={(e) => setMatChasis(e.target.value)}
                    placeholder="No. Chasis"
                    className="w-full bg-white border rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Modelo (Año)</label>
                  <input
                    type="text"
                    value={matModelo}
                    onChange={(e) => setMatModelo(e.target.value)}
                    placeholder="Año"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Cilindraje</label>
                  <input
                    type="text"
                    value={matCilindraje}
                    onChange={(e) => setMatCilindraje(e.target.value)}
                    placeholder="Cilindraje"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Municipio / Tránsito</label>
                  <input
                    type="text"
                    value={matCiudad}
                    onChange={(e) => setMatCiudad(e.target.value)}
                    placeholder="Tránsito Municipio"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Entidad Tránsito Asignado</label>
                  <input
                    type="text"
                    value={matTransito}
                    onChange={(e) => setMatTransito(e.target.value)}
                    placeholder="Entidad"
                    className="w-full bg-white border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Valor Impuestos ($)</label>
                  <input
                    type="number"
                    value={matImpuesto}
                    onChange={(e) => setMatImpuesto(Number(e.target.value) || 0)}
                    className="w-full bg-white border rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Valor Trámite Completo ($)</label>
                  <input
                    type="number"
                    value={matValor}
                    onChange={(e) => setMatValor(Number(e.target.value) || 0)}
                    className="w-full bg-white border rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Placa Rango Asignado</label>
                  <input
                    type="text"
                    value={matRango}
                    onChange={(e) => setMatRango(e.target.value.toUpperCase())}
                    placeholder="Placa"
                    className="w-full bg-white border rounded p-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Estado de Trámite</label>
                  <select
                    value={matEstado}
                    onChange={(e: any) => setMatEstado(e.target.value)}
                    className="w-full bg-white border rounded p-2 text-xs"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="col-span-full">
                  <label className="block text-slate-500 mb-1">Notas / Observaciones de Tránsito</label>
                  <textarea
                    value={matNotas}
                    onChange={(e) => setMatNotas(e.target.value)}
                    placeholder="Detalles sobre radicación, demoras, entrega de carpeta física..."
                    className="w-full bg-white border rounded p-2 text-xs h-16 font-sans font-medium"
                  />
                </div>

                <div className="col-span-full flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMatriculaForm(false)}
                    className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg"
                  >
                    Guardar Trámite
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Matrículas Table */}
          <div className="bg-white rounded-xl shadow-xs border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-bold">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Propietario / CC</th>
                    <th className="p-4">Celular</th>
                    <th className="p-4">Vehículo / Chasis</th>
                    <th className="p-4">Tránsito</th>
                    <th className="p-4 text-center">Placa</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Costo Trámite</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatriculas.length > 0 ? (
                    filteredMatriculas.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono whitespace-nowrap">{item.fecha}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{item.nombre} {item.apellidos}</div>
                          <div className="text-[10px] text-slate-400 font-mono">CC {item.documento}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-500">{item.celular || "-"}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-700">{item.motocicleta}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Chasis: {item.chasis}</div>
                        </td>
                        <td className="p-4 text-slate-500">{item.transito} ({item.ciudad})</td>
                        <td className="p-4 text-center font-mono">
                          {item.rango ? (
                            <span className="font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded">
                              {item.rango}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAutoAssignPlate(idx, item)}
                              className="bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 font-bold px-2.5 py-1 rounded transition-colors text-[10px]"
                              title="Asignar placa del stock automáticamente"
                            >
                              ⚡ Asignación Auto
                            </button>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            item.estado === "Pendiente" ? "bg-yellow-100 text-yellow-700" :
                            item.estado === "En proceso" ? "bg-blue-100 text-blue-700" :
                            item.estado === "Finalizado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {item.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold">${item.valor.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleEditMatricula(idx, item)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800"
                              title="Editar Matrícula"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteMatricula(idx)}
                              className="p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-800"
                              title="Eliminar Registro"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400">
                        No se encontraron trámites de matrículas con los filtros indicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === "perfiles" && (
        <div className="bg-white rounded-xl border border-slate-100 p-2 animate-fade-in">
          {/* Re-use the master PerfilCliente element directly as it's fully autonomous! */}
          <PerfilCliente clientId="" db={db} onBack={() => setActiveTab("matriculas")} />
        </div>
      )}

      {activeTab === "placas" && (
        <div className="space-y-6">
          
          {/* Rango generator header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Administrador de Placas y Rangos de Fábrica</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gestione y genere consecutivos de placas oficiales entregadas por el Tránsito Nacional.</p>
            </div>

            <button
              onClick={() => setShowRangoForm(!showRangoForm)}
              className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Generar Nuevo Rango</span>
            </button>
          </div>

          {/* Generator Form panel */}
          {showRangoForm && (
            <form onSubmit={handleGenerateRango} className="bg-slate-50 border p-5 rounded-xl space-y-4 animate-fade-in max-w-xl text-xs font-semibold">
              <h4 className="font-bold text-xs text-slate-800 border-b pb-1.5 uppercase">Generar Consecutivos Automáticos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Prefijo (3 Letras) *</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="AAA"
                    value={genPrefijo}
                    onChange={(e) => setGenPrefijo(e.target.value.toUpperCase())}
                    className="w-full bg-white border rounded p-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">No. Inicial *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={genInicio}
                    onChange={(e) => setGenInicio(Number(e.target.value) || 0)}
                    className="w-full bg-white border rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">No. Final *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={genFin}
                    onChange={(e) => setGenFin(Number(e.target.value) || 0)}
                    className="w-full bg-white border rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Sufijo (Ej. Letra Moto)</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="F"
                    value={genSufijo}
                    onChange={(e) => setGenSufijo(e.target.value.toUpperCase())}
                    className="w-full bg-white border rounded p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Secretaría / Oficina de Tránsito Asignada</label>
                <select
                  value={genCiudad}
                  onChange={(e) => setGenCiudad(e.target.value)}
                  className="w-full bg-white border rounded p-2 text-xs text-slate-700"
                >
                  <option value="Planadas">Secretaría de Tránsito Planadas</option>
                  <option value="Neiva">Secretaría de Tránsito Neiva</option>
                  <option value="Ibagué">Secretaría de Tránsito Ibagué</option>
                  <option value="Bogotá">Secretaría de Tránsito Bogotá</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-1 border-t">
                <button
                  type="button"
                  onClick={() => setShowRangoForm(false)}
                  className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg"
                >
                  ⚡ Generar Placas
                </button>
              </div>
            </form>
          )}

          {/* Rangos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rangosPlacas.length > 0 ? (
              rangosPlacas.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start border-b pb-2 mb-3">
                      <div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase">
                          ID Lote #{r.id}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">
                          Consecutivo: {r.rango_inicial} - {r.rango_final}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tránsito: {r.transito_ciudad}</p>
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        r.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {r.estado.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                      <div className="flex justify-between">
                        <span>Disponibles en Stock:</span>
                        <span className="font-bold text-green-600">{r.placas_disponibles.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilizadas en Matrículas:</span>
                        <span className="font-bold text-slate-700">{r.placas_utilizadas.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Placas list inside this Rango */}
                  <div className="border-t pt-3 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Visor de Placas Disponibles:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 border border-dashed rounded-lg">
                      {r.placas_disponibles.map((p) => (
                        <button
                          key={p}
                          onClick={() => handleManualMarkAsUsed(r.id, p)}
                          className="text-[10px] font-mono font-black text-green-700 bg-green-50 hover:bg-red-100 hover:text-red-700 border border-green-200 hover:border-red-200 px-2 py-0.5 rounded transition-colors"
                          title="Click para marcar utilizada manualmente"
                        >
                          {p}
                        </button>
                      ))}
                      {r.placas_disponibles.length === 0 && (
                        <span className="text-xs text-slate-400 font-bold p-2 italic">Lote agotado. Todas las placas fueron asignadas.</span>
                      )}
                    </div>
                  </div>

                  {r.placas_utilizadas.length > 0 && (
                    <div className="space-y-1.5 border-t pt-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Historial de Placas Utilizadas:</span>
                      <div className="flex flex-wrap gap-1 text-[9px] font-mono font-semibold">
                        {r.placas_utilizadas.map(p => (
                          <span key={p} className="bg-slate-100 border text-slate-500 px-2 py-0.5 rounded">
                            🚫 {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-dashed rounded-xl">
                No hay lotes de rangos de placas oficiales registrados. Genere uno arriba para habilitar la asignación en trámites.
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER ESTUDIOS DE CRÉDITO TAB */}
      {activeTab === "estudios" && (
        <ModuloReferenciasEstudios user={user} db={db} setDb={setDb} />
      )}

    </div>
  );
}
