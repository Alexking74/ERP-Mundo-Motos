import React, { useState, useEffect } from "react";
import { 
  Bike, Tag, Calendar, ChevronLeft, ShieldCheck, UserCheck, Wrench, 
  BarChart3, Plus, Search, Trash2, Edit, AlertCircle, RefreshCw, Clipboard,
  Clock, CheckCircle, Info
} from "lucide-react";
import { DatabaseState, Usuario, MotoEnSala, Revision } from "../types";
import { getTodayDateString, registrarEvento } from "../utils/db";

interface PerfilMotoProps {
  motoChasis: string;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
  onBack: () => void;
  user: Usuario;
  initialSubTab?: "inventario" | "revisiones";
}

export default function PerfilMoto({ motoChasis, db, setDb, onBack, user, initialSubTab }: PerfilMotoProps) {
  // Navigation states
  const [activeSubTab, setActiveSubTab] = useState<"inventario" | "revisiones">(initialSubTab || "inventario");

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [selectedChasis, setSelectedChasis] = useState<string>(motoChasis || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSede, setFilterSede] = useState("Todas");
  const [filterVendida, setFilterVendida] = useState("Todas");
  const [filterConfirmacion, setFilterConfirmacion] = useState("Todas");
  const [filterSalida, setFilterSalida] = useState("Todas");

  // Show forms & modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMoto, setEditingMoto] = useState<MotoEnSala | null>(null);

  // Modal Control de Identificación al Recibir (Verification)
  const [showVerificarLlegadaModal, setShowVerificarLlegadaModal] = useState(false);
  const [verificarIdx, setVerificarIdx] = useState<number | null>(null);
  const [verChasisChecked, setVerChasisChecked] = useState(true);
  const [verMotorChecked, setVerMotorChecked] = useState(true);
  const [verModeloChecked, setVerModeloChecked] = useState(true);
  const [verColorChecked, setVerColorChecked] = useState(true);
  const [verCilindrajeChecked, setVerCilindrajeChecked] = useState(true);
  const [verEstadoSelect, setVerEstadoSelect] = useState<"CONFIRMADA" | "NO CONFIRMADA" | "CON NOVEDAD" | "PENDIENTE">("CONFIRMADA");
  const [verObs, setVerObs] = useState("");

  // Modal Control de Salida de Sala
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [salidaIdx, setSalidaIdx] = useState<number | null>(null);
  const [salidaMotivo, setSalidaMotivo] = useState("Venta Entregada");
  const [salidaFechaInput, setSalidaFechaInput] = useState(getTodayDateString());

  // Customer / Commercial View Mode
  const [isCustomerViewMode, setIsCustomerViewMode] = useState(false);

  // Form states for Motorcycle
  const [fechaEnvio, setFechaEnvio] = useState(getTodayDateString());
  const [chasisForm, setChasisForm] = useState("");
  const [motorForm, setMotorForm] = useState("");
  const [motocicletaForm, setMotocicletaForm] = useState("");
  const [colorForm, setColorForm] = useState("");
  const [precioForm, setPrecioForm] = useState(0);
  const [modeloForm, setModeloForm] = useState("");
  const [cilindrajeForm, setCilindrajeForm] = useState("");
  const [sitioViene, setSitioViene] = useState("");
  const [confirmacionLlegada, setConfirmacionLlegada] = useState<"CONFIRMADA" | "NO CONFIRMADA" | "CON NOVEDAD" | "PENDIENTE">("CONFIRMADA");
  const [vendidaForm, setVendidaForm] = useState<"SI" | "NO">("NO");
  const [salidaForm, setSalidaForm] = useState("NO");
  const [fechaSalidaForm, setFechaSalidaForm] = useState("");

  // Revisions States
  const [revisionSearch, setRevisionSearch] = useState("");
  const [filterRevEstado, setFilterRevEstado] = useState("Todas");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [editingRevisionIndex, setEditingRevisionIndex] = useState<number | null>(null);

  // Revision Form Fields
  const [revChasis, setRevChasis] = useState("");
  const [revKm, setRevKm] = useState("0");
  const [revRazon, setRevRazon] = useState("Primera revisión de garantía (500 Km)");
  const [revMes, setRevMes] = useState("1 Mes");
  const [revEstado, setRevEstado] = useState("Pendiente");
  const [revFechaServicio, setRevFechaServicio] = useState(getTodayDateString());
  
  // Revision Client Fields (Pre-populated but editable)
  const [revNombre, setRevNombre] = useState("");
  const [revApellidos, setRevApellidos] = useState("");
  const [revCedula, setRevCedula] = useState("");
  const [revCorreo, setRevCorreo] = useState("");
  const [revDireccion, setRevDireccion] = useState("");
  const [revTelefono, setRevTelefono] = useState("");
  const [revPlaca, setRevPlaca] = useState("");

  // Revision Bike Fields (Automated)
  const [revMotoName, setRevMotoName] = useState("");
  const [revMotorNo, setRevMotorNo] = useState("");
  const [revModelo, setRevModelo] = useState("");
  const [revColor, setRevColor] = useState("");
  const [revCilindraje, setRevCilindraje] = useState("");
  const [revCiudad, setRevCiudad] = useState("Planadas");

  // -------------------------
  // MOTORCYCLE CRUD FUNCTIONS
  // -------------------------
  const handleAddMotorcycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chasisForm.trim() || !motorForm.trim() || !motocicletaForm.trim()) {
      alert("Por favor ingrese el número de chasis, motor y modelo de motocicleta.");
      return;
    }

    const chasisExists = db.motos_en_sala.some(
      (m) => m.numero_chasis.toUpperCase().trim() === chasisForm.toUpperCase().trim()
    );
    const motorExists = db.motos_en_sala.some(
      (m) => m.numero_motor.toUpperCase().trim() === motorForm.toUpperCase().trim()
    );

    if (chasisExists) {
      alert("ALERTA: El número de chasis ya existe en el sistema.");
      return;
    }
    if (motorExists) {
      alert("ALERTA: El número de motor ya existe en el sistema.");
      return;
    }

    const newMoto: MotoEnSala = {
      fecha_envio: fechaEnvio,
      numero_chasis: chasisForm.toUpperCase().trim(),
      numero_motor: motorForm.toUpperCase().trim(),
      motocicleta: motocicletaForm.trim(),
      color: colorForm.trim() || "N/D",
      precio: precioForm || 0,
      modelo: modeloForm.trim() || "2026",
      cilindraje: cilindrajeForm.trim() || "125",
      vendida: vendidaForm,
      sitio_de_donde_viene: sitioViene.trim() || "Bodega Principal",
      confirmacion_de_llegada: confirmacionLlegada,
      salida: vendidaForm === "SI" ? "Venta Directa" : "",
      fecha_salida: vendidaForm === "SI" ? getTodayDateString() : ""
    };

    let updatedDb = { ...db, motos_en_sala: [newMoto, ...db.motos_en_sala] };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MOTOS EN SALA",
      "Crear",
      "VERDE",
      "Chasis",
      "",
      newMoto.numero_chasis,
      `Se registró motocicleta ${newMoto.motocicleta} (Chasis: ${newMoto.numero_chasis}) en el inventario.`
    );

    setDb(updatedDb);
    setShowAddForm(false);
    resetForm();
    alert("Motocicleta ingresada con éxito.");
  };

  const handleEditMotorcycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMoto) return;

    const originalChasis = editingMoto.numero_chasis;
    const updatedMotos = db.motos_en_sala.map((m) => {
      if (m.numero_chasis === originalChasis) {
        return {
          ...m,
          fecha_envio: fechaEnvio,
          numero_motor: motorForm.toUpperCase().trim(),
          motocicleta: motocicletaForm.trim(),
          color: colorForm.trim(),
          precio: precioForm,
          modelo: modeloForm.trim(),
          cilindraje: cilindrajeForm.trim(),
          vendida: vendidaForm,
          sitio_de_donde_viene: sitioViene.trim(),
          confirmacion_de_llegada: confirmacionLlegada,
          salida: vendidaForm === "SI" ? (m.salida || "Venta") : "",
          fecha_salida: vendidaForm === "SI" ? (m.fecha_salida || getTodayDateString()) : ""
        };
      }
      return m;
    });

    let updatedDb = { ...db, motos_en_sala: updatedMotos };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MOTOS EN SALA",
      "Actualizar",
      "AMARILLA",
      "Chasis",
      originalChasis,
      originalChasis,
      `Se actualizaron los datos técnicos de la motocicleta con Chasis: ${originalChasis}.`
    );

    setDb(updatedDb);
    setEditingMoto(null);
    resetForm();
    alert("Motocicleta actualizada con éxito.");
  };

  const handleDeleteMotorcycle = (chasis: string) => {
    const motoToDelete = db.motos_en_sala.find((m) => m.numero_chasis === chasis);
    if (!motoToDelete) return;

    if (motoToDelete.vendida === "SI") {
      alert("No es posible eliminar una motocicleta que ya figura como VENDIDA. Se requiere anulación de su acta de venta.");
      return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar permanentemente la motocicleta con Chasis ${chasis}? Esta acción es irreversible.`)) {
      return;
    }

    const updatedMotos = db.motos_en_sala.filter((m) => m.numero_chasis !== chasis);
    let updatedDb = { ...db, motos_en_sala: updatedMotos };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MOTOS EN SALA",
      "Eliminar",
      "ROJA",
      "Chasis",
      chasis,
      "",
      `Se eliminó la motocicleta ${motoToDelete.motocicleta} (Chasis: ${chasis}) del stock de sala.`
    );

    setDb(updatedDb);
    alert("Registro de motocicleta eliminado de sala.");
  };

  const openEditModal = (moto: MotoEnSala) => {
    setEditingMoto(moto);
    setFechaEnvio(moto.fecha_envio);
    setChasisForm(moto.numero_chasis);
    setMotorForm(moto.numero_motor);
    setMotocicletaForm(moto.motocicleta);
    setColorForm(moto.color);
    setPrecioForm(moto.precio);
    setModeloForm(moto.modelo);
    setCilindrajeForm(moto.cilindraje);
    setSitioViene(moto.sitio_de_donde_viene);
    setConfirmacionLlegada(moto.confirmacion_de_llegada || "PENDIENTE");
    setVendidaForm(moto.vendida || "NO");
    setSalidaForm(moto.salida || "NO");
    setFechaSalidaForm(moto.fecha_salida || "");
  };

  const resetForm = () => {
    setFechaEnvio(getTodayDateString());
    setChasisForm("");
    setMotorForm("");
    setMotocicletaForm("");
    setColorForm("");
    setPrecioForm(0);
    setModeloForm("");
    setCilindrajeForm("");
    setSitioViene("");
    setConfirmacionLlegada("CONFIRMADA");
    setVendidaForm("NO");
    setSalidaForm("NO");
    setFechaSalidaForm("");
  };

  // -------------------------
  // VERIFICATION & SALIDA HANDLERS
  // -------------------------
  const openVerificarLlegadaModal = (chasis: string) => {
    const idx = db.motos_en_sala.findIndex(m => m.numero_chasis === chasis);
    if (idx === -1) return;
    setVerificarIdx(idx);
    const m = db.motos_en_sala[idx];
    setVerChasisChecked(true);
    setVerMotorChecked(true);
    setVerModeloChecked(true);
    setVerColorChecked(true);
    setVerCilindrajeChecked(true);
    setVerEstadoSelect(m.confirmacion_de_llegada === "CONFIRMADA" ? "CONFIRMADA" : "CONFIRMADA");
    setVerObs("");
    setShowVerificarLlegadaModal(true);
  };

  const handleSaveVerificacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificarIdx === null) return;
    const target = db.motos_en_sala[verificarIdx];
    if (!target) return;

    const updatedMotos = db.motos_en_sala.map((m, idx) => {
      if (idx === verificarIdx) {
        return {
          ...m,
          confirmacion_de_llegada: verEstadoSelect,
        };
      }
      return m;
    });

    let updatedDb = { ...db, motos_en_sala: updatedMotos };
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MOTOS EN SALA",
      "Actualizar",
      verEstadoSelect === "CONFIRMADA" ? "VERDE" : "AMARILLA",
      "Chasis",
      target.numero_chasis,
      target.numero_chasis,
      `Verificación de llegada física para ${target.motocicleta} (Chasis: ${target.numero_chasis}) actualizada a estado: ${verEstadoSelect}.${verObs ? " Obs: " + verObs : ""}`
    );

    setDb(updatedDb);
    setShowVerificarLlegadaModal(false);
    setVerificarIdx(null);
    alert(`Confirmación de llegada actualizada a: ${verEstadoSelect}`);
  };

  const openSalidaModal = (chasis: string) => {
    const idx = db.motos_en_sala.findIndex(m => m.numero_chasis === chasis);
    if (idx === -1) return;
    setSalidaIdx(idx);
    const m = db.motos_en_sala[idx];
    setSalidaMotivo(m.salida && m.salida !== "NO" ? m.salida : "Venta Entregada");
    setSalidaFechaInput(m.fecha_salida || getTodayDateString());
    setShowSalidaModal(true);
  };

  const handleSaveSalida = (e: React.FormEvent) => {
    e.preventDefault();
    if (salidaIdx === null) return;
    const target = db.motos_en_sala[salidaIdx];
    if (!target) return;

    const updatedMotos = db.motos_en_sala.map((m, idx) => {
      if (idx === salidaIdx) {
        return {
          ...m,
          salida: salidaMotivo,
          fecha_salida: salidaFechaInput,
        };
      }
      return m;
    });

    let updatedDb = { ...db, motos_en_sala: updatedMotos };
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "MOTOS EN SALA",
      "Actualizar",
      "AMARILLA",
      "Chasis",
      target.numero_chasis,
      target.numero_chasis,
      `Salida de sala registrada para ${target.motocicleta} (Chasis: ${target.numero_chasis}). Motivo: ${salidaMotivo}, Fecha: ${salidaFechaInput}.`
    );

    setDb(updatedDb);
    setShowSalidaModal(false);
    setSalidaIdx(null);
    alert("Salida de sala de motocicleta registrada con éxito.");
  };

  // -------------------------
  // REVISIONS CRUD FUNCTIONS
  // -------------------------
  const handleChasisSelectionChange = (chasisVal: string) => {
    setRevChasis(chasisVal);
    if (!chasisVal) {
      setRevMotoName("");
      setRevMotorNo("");
      setRevModelo("");
      setRevColor("");
      setRevCilindraje("");
      return;
    }

    // Auto-populate bike fields
    const foundBike = db.motos_en_sala.find(m => m.numero_chasis === chasisVal);
    if (foundBike) {
      setRevMotoName(foundBike.motocicleta);
      setRevMotorNo(foundBike.numero_motor);
      setRevModelo(foundBike.modelo);
      setRevColor(foundBike.color);
      setRevCilindraje(foundBike.cilindraje);
      setRevCiudad(foundBike.sitio_de_donde_viene || "Planadas");

      // Auto-populate customer fields from corresponding sales Actas if sold!
      const matchedActa = db.actas.find(a => a.chasis === foundBike.numero_chasis);
      if (matchedActa) {
        setRevNombre(matchedActa.nombres);
        setRevApellidos(matchedActa.apellidos);
        setRevCedula(matchedActa.documento);
        setRevCorreo(matchedActa.correo || "");
        setRevDireccion(matchedActa.direccion || "");
        setRevTelefono(matchedActa.telefono || "");
        setRevPlaca(matchedActa.rango || "");
      } else {
        // Clear customer fields for fresh entry
        setRevNombre("");
        setRevApellidos("");
        setRevCedula("");
        setRevCorreo("");
        setRevDireccion("");
        setRevTelefono("");
        setRevPlaca("");
      }
    }
  };

  const openNewRevision = (prefilledChasis?: string) => {
    setEditingRevisionIndex(null);
    setRevKm("0");
    setRevRazon("Primera revisión de garantía (500 Km)");
    setRevMes("1 Mes");
    setRevEstado("Pendiente");
    setRevFechaServicio(getTodayDateString());
    
    if (prefilledChasis) {
      handleChasisSelectionChange(prefilledChasis);
    } else {
      setRevChasis("");
      handleChasisSelectionChange("");
    }
    
    setShowRevisionForm(true);
  };

  const openEditRevision = (idx: number, rev: Revision) => {
    setEditingRevisionIndex(idx);
    setRevChasis(rev.chasis);
    setRevKm(rev.km);
    setRevRazon(rev.razon);
    setRevMes(rev.mes);
    setRevEstado(rev.estado);
    setRevFechaServicio(rev.fecha_servicio || getTodayDateString());

    setRevNombre(rev.nombre);
    setRevApellidos(rev.apellidos);
    setRevCedula(rev.cedula);
    setRevCorreo(rev.correo || "");
    setRevDireccion(rev.direccion || "");
    setRevTelefono(rev.telefono || "");
    setRevPlaca(rev.placa || "");

    setRevMotoName(rev.moto);
    setRevMotorNo(rev.motor);
    setRevModelo(rev.modelo);
    setRevColor(rev.color);
    setRevCilindraje(rev.cilindraje);
    setRevCiudad(rev.ciudad || "Planadas");

    setShowRevisionForm(true);
  };

  const handleSaveRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revChasis) {
      alert("Debe seleccionar o ingresar el número de chasis de la motocicleta.");
      return;
    }

    const newRevData: Revision = {
      km: revKm,
      razon: revRazon,
      mes: revMes,
      estado: revEstado,
      fecha_compra: db.actas.find(a => a.chasis === revChasis)?.fecha || getTodayDateString(),
      fecha_servicio: revFechaServicio,
      nombre: revNombre || "Cliente",
      apellidos: revApellidos || "Genérico",
      cedula: revCedula || "00000",
      correo: revCorreo,
      direccion: revDireccion,
      telefono: revTelefono,
      moto: revMotoName,
      motor: revMotorNo,
      chasis: revChasis,
      modelo: revModelo,
      color: revColor,
      cilindraje: revCilindraje,
      placa: revPlaca,
      ciudad: revCiudad
    };

    let updatedDb = { ...db };
    let updatedRevisiones = [...db.revisiones];

    if (editingRevisionIndex !== null) {
      // Edit
      const prev = updatedRevisiones[editingRevisionIndex];
      updatedRevisiones[editingRevisionIndex] = newRevData;
      updatedDb.revisiones = updatedRevisiones;

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "REVISIONES",
        "Actualizar",
        "AMARILLA",
        "Servicios Técnicos",
        prev.chasis,
        revChasis,
        `Se actualizó servicio técnico de garantía (${revRazon}) para la moto con Chasis ${revChasis}.`
      );
    } else {
      // Create
      updatedDb.revisiones = [newRevData, ...db.revisiones];

      updatedDb = registrarEvento(
        updatedDb,
        user,
        "REVISIONES",
        "Crear",
        "VERDE",
        "Servicios Técnicos",
        "",
        revChasis,
        `Se registró ingreso por servicio de revisión preventiva de garantía (${revRazon}) para la moto con Chasis ${revChasis}.`
      );
    }

    setDb(updatedDb);
    setShowRevisionForm(false);
    setEditingRevisionIndex(null);
    alert("Revisión técnica guardada exitosamente.");
  };

  const handleDeleteRevision = (idx: number) => {
    if (!window.confirm("¿Está completamente seguro de eliminar este registro de revisión técnica? Esta acción es irreversible.")) {
      return;
    }

    const itemToDelete = db.revisiones[idx];
    let updatedRevisiones = db.revisiones.filter((_, i) => i !== idx);
    let updatedDb = { ...db, revisiones: updatedRevisiones };

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REVISIONES",
      "Eliminar",
      "ROJA",
      "Servicios Técnicos",
      itemToDelete.chasis,
      "",
      `Se eliminó revisión técnica de garantía (${itemToDelete.razon}) de ${itemToDelete.nombre} ${itemToDelete.apellidos}.`
    );

    setDb(updatedDb);
    alert("Revisión técnica eliminada del sistema.");
  };

  // -------------------------
  // DETAIL VIEW MODE
  // -------------------------
  if (selectedChasis) {
    const moto = db.motos_en_sala.find(
      (m) => m.numero_chasis === selectedChasis || m.numero_motor === selectedChasis
    );

    if (!moto) {
      return (
        <div className="bg-white rounded-xl shadow-xs border p-6 text-center animate-fade-in font-sans">
          <p className="text-sm text-slate-500">Motocicleta no encontrada en los registros de inventario.</p>
          <button onClick={() => setSelectedChasis("")} className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold">
            Volver al Inventario
          </button>
        </div>
      );
    }

    const sale = db.actas.find((a) => a.chasis === moto.numero_chasis || a.motor === moto.numero_motor);
    const revisiones = db.revisiones.filter((r) => r.chasis === moto.numero_chasis);

    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in font-sans">
        
        {/* Back navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
          <button
            onClick={() => {
              if (motoChasis) {
                onBack(); // Go back to Escritorio Principal
              } else {
                setSelectedChasis(""); // Go back to Showroom List
              }
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
          >
            <ChevronLeft size={16} />
            <span>{motoChasis ? "Volver al Escritorio" : "Volver a Sala de Ventas"}</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Historial Técnico del Vehículo</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Specifications Card */}
          <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
            <div className="flex items-center space-x-3.5">
              <div className="bg-slate-800 text-white p-3 rounded-full shadow-md">
                <Bike size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight">{moto.motocicleta}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Modelo comercial: {moto.modelo}</p>
              </div>
            </div>

            <div className="divide-y divide-slate-200/60 text-xs font-medium text-slate-600">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Número de Motor:</span>
                <span className="font-mono font-bold text-slate-800">{moto.numero_motor}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Número de Chasis:</span>
                <span className="font-mono font-bold text-slate-800">{moto.numero_chasis}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Color Comercial:</span>
                <span className="font-bold text-slate-800">{moto.color}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Cilindraje exacto:</span>
                <span className="font-bold text-slate-800">{moto.cilindraje} cc</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Fecha de Envío:</span>
                <span className="font-bold text-slate-800">{moto.fecha_envio}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Sitio de Procedencia:</span>
                <span className="font-bold text-slate-800">{moto.sitio_de_donde_viene}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Confirmación Recepción:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  moto.confirmacion_de_llegada === "CONFIRMADA" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>{moto.confirmacion_de_llegada}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400 font-semibold">Precio Base Lista:</span>
                <span className="font-bold font-mono text-red-600">${moto.precio.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Estado de Venta</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                moto.vendida === "SI" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}>
                {moto.vendida === "SI" ? "VENDIDA - ENTREGADA" : "DISPONIBLE EN SALA DE VENTAS"}
              </span>
            </div>
          </div>

          {/* Right Column: Historical links & Buyer records */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Buyer Panel */}
            <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5 border-b pb-2">
                <UserCheck size={14} className="text-red-500" />
                <span>Información Comercial y Adquirente</span>
              </h4>
              
              {moto.vendida === "SI" && sale ? (
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-normal">Cliente Propietario:</span>
                    <span className="text-slate-800 font-bold">{sale.nombres} {sale.apellidos}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal">Identificación:</span>
                    <span className="text-slate-800 font-mono font-bold">CC {sale.documento}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal">Fecha de Venta Oficial:</span>
                    <span>{sale.fecha}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal">Soporte Despacho Acta:</span>
                    <span className="text-red-600 font-mono font-bold">#{sale.acta}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t mt-1 flex justify-between bg-slate-50 p-2.5 rounded">
                    <span>Valor Neto de Despacho Facturado:</span>
                    <span className="font-mono font-black text-slate-800">${sale.valor_moto.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Esta motocicleta no registra compras o traspasos vigentes en el ERP. Está disponible para facturar inmediatamente.</p>
              )}
            </div>

            {/* Warranty checkups logs */}
            <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                  <Wrench size={14} className="text-red-500" />
                  <span>Servicios Técnicos Preventivos de Garantía ({revisiones.length})</span>
                </h4>
                
                <button
                  onClick={() => openNewRevision(moto.numero_chasis)}
                  className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-[10px] py-1 px-2.5 rounded transition-colors flex items-center space-x-1"
                >
                  <Plus size={10} />
                  <span>Registrar Servicio</span>
                </button>
              </div>
              
              {revisiones.length > 0 ? (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {revisiones.map((rev, idx) => {
                    const globalIdx = db.revisiones.findIndex(r => r.chasis === rev.chasis && r.razon === rev.razon && r.km === rev.km);
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{rev.razon}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Km: <span className="font-bold font-mono">{rev.km} Km</span> | Mes: {rev.mes} | Sede: {rev.ciudad}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Técnico: {rev.nombre} {rev.apellidos}</div>
                        </div>
                        <div className="flex items-center space-x-3 text-right">
                          <div className="space-y-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                              rev.estado === "Completado" || rev.estado === "Realizada" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {rev.estado.toUpperCase()}
                            </span>
                            <div className="text-[9px] text-slate-400 font-semibold">{rev.fecha_servicio || "En espera"}</div>
                          </div>
                          
                          <div className="flex items-center space-x-1 border-l pl-2.5">
                            <button
                              onClick={() => openEditRevision(globalIdx, rev)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900"
                              title="Editar Revisión"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteRevision(globalIdx)}
                              className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-900"
                              title="Eliminar Revisión"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No registra entradas, mantenimientos ni revisiones preventivas programadas para este vehículo en el centro técnico.</p>
              )}
            </div>

          </div>

        </div>

      </div>
    );
  }

  // -------------------------
  // SHOWROOM GENERAL LIST MODE & REVISIONS TABS
  // -------------------------
  
  // STATS & COUNTERS
  const totalCount = db.motos_en_sala.length;
  const availCount = db.motos_en_sala.filter(m => m.confirmacion_de_llegada === "CONFIRMADA" && m.vendida === "NO" && (m.salida === "NO" || !m.salida)).length;
  const soldCount = db.motos_en_sala.filter(m => m.vendida === "SI").length;
  const pendingCount = db.motos_en_sala.filter(m => m.confirmacion_de_llegada !== "CONFIRMADA").length;
  const salidaCount = db.motos_en_sala.filter(m => m.salida && m.salida !== "NO").length;

  const totalRevs = db.revisiones.length;
  const pendingRevs = db.revisiones.filter(r => r.estado.toLowerCase() === "pendiente").length;
  const completedRevs = db.revisiones.filter(r => r.estado.toLowerCase() === "completado" || r.estado.toLowerCase() === "realizada").length;

  // FILTERS FOR 13 COLUMNS
  const filteredMotos = db.motos_en_sala.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      m.motocicleta.toLowerCase().includes(term) ||
      m.numero_chasis.toLowerCase().includes(term) ||
      m.numero_motor.toLowerCase().includes(term) ||
      m.color.toLowerCase().includes(term) ||
      m.modelo.toLowerCase().includes(term) ||
      (m.cilindraje || "").toLowerCase().includes(term);

    const matchSede = filterSede === "Todas" || m.sitio_de_donde_viene.toLowerCase().includes(filterSede.toLowerCase());
    const matchVendida = filterVendida === "Todas" || m.vendida === filterVendida;
    const matchConfirmacion = filterConfirmacion === "Todas" || m.confirmacion_de_llegada === filterConfirmacion;
    const matchSalida = filterSalida === "Todas" || 
      (filterSalida === "NO" ? (!m.salida || m.salida === "NO") : (m.salida && m.salida !== "NO"));

    return matchSearch && matchSede && matchVendida && matchConfirmacion && matchSalida;
  });

  const filteredRevisions = db.revisiones.filter((r) => {
    const term = revisionSearch.toLowerCase();
    const matchSearch = 
      r.nombre.toLowerCase().includes(term) ||
      r.apellidos.toLowerCase().includes(term) ||
      r.cedula.includes(term) ||
      r.chasis.toLowerCase().includes(term) ||
      r.razon.toLowerCase().includes(term) ||
      (r.placa || "").toLowerCase().includes(term);

    const matchSede = filterSede === "Todas" || r.ciudad.toLowerCase().includes(filterSede.toLowerCase());
    const matchEstado = filterRevEstado === "Todas" || r.estado.toLowerCase() === filterRevEstado.toLowerCase();

    return matchSearch && matchSede && matchEstado;
  });

  const sedes = Array.from(new Set(db.motos_en_sala.map((m) => m.sitio_de_donde_viene).filter(Boolean)));

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in font-sans space-y-6">
      
      {/* Upper sub-tab toggle menu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
        <div className="flex space-x-1.5">
          <button
            onClick={() => setActiveSubTab("inventario")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSubTab === "inventario" ? "bg-red-600 text-white shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Bike size={14} />
            <span>Inventario Motos en Sala ({totalCount})</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab("revisiones")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSubTab === "revisiones" ? "bg-red-600 text-white shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Wrench size={14} />
            <span>Revisiones Técnicas de Garantía ({totalRevs})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCustomerViewMode(!isCustomerViewMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 transition-colors ${
              isCustomerViewMode ? "bg-amber-500 text-white border-amber-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
            }`}
          >
            <UserCheck size={14} />
            <span>{isCustomerViewMode ? "Vista Cliente (Activa)" : "Buscador Sector Cliente"}</span>
          </button>
          <span className="text-[10px] bg-red-50 text-red-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            MOTOS EN SALA (13 COLS)
          </span>
        </div>
      </div>

      {/* TAB 1: INVENTARIO DE MOTOS */}
      {activeSubTab === "inventario" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dashed pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">DOCUMENTO MAESTRO ERP</span>
                <h3 className="text-base font-bold text-slate-800">Hoja MOTOS EN SALA</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Control de inventario físico, confirmación de llegada, disponibilidad y registro de salida (Estructura oficial Col A-M).</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddForm(true); }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-center"
            >
              <Plus size={15} />
              <span>Ingresar Motocicleta</span>
            </button>
          </div>

          {/* Stats Board */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 border p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Recibidas</span>
              <div className="text-lg font-black text-slate-800 mt-0.5">{totalCount} unidades</div>
            </div>
            <div className="bg-green-50 border border-green-100 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-green-600 uppercase">Disponibles Sala</span>
              <div className="text-lg font-black text-green-700 mt-0.5">{availCount} unidades</div>
            </div>
            <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-red-600 uppercase">Vendidas</span>
              <div className="text-lg font-black text-red-700 mt-0.5">{soldCount} unidades</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-yellow-600 uppercase">Pendientes / Novedad</span>
              <div className="text-lg font-black text-yellow-700 mt-0.5">{pendingCount} unidades</div>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Salida de Sala</span>
              <div className="text-lg font-black text-slate-800 mt-0.5">{salidaCount} unidades</div>
            </div>
          </div>

          {/* Filters Area */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por moto, chasis, motor, color, modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={filterSede}
                onChange={(e) => setFilterSede(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
              >
                <option value="Todas">Origen: Todos</option>
                {sedes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={filterConfirmacion}
                onChange={(e) => setFilterConfirmacion(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
              >
                <option value="Todas">Confirmación: Todas</option>
                <option value="CONFIRMADA">CONFIRMADA</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="CON NOVEDAD">CON NOVEDAD</option>
                <option value="NO CONFIRMADA">NO CONFIRMADA</option>
              </select>

              <select
                value={filterVendida}
                onChange={(e) => setFilterVendida(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
              >
                <option value="Todas">Venta: Todas</option>
                <option value="NO">Disponibles (NO)</option>
                <option value="SI">Vendidas (SI)</option>
              </select>

              <select
                value={filterSalida}
                onChange={(e) => setFilterSalida(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
              >
                <option value="Todas">Salida: Todas</option>
                <option value="NO">En Sala (NO)</option>
                <option value="SI">Fuera de Sala (SI)</option>
              </select>
            </div>
          </div>

          {/* Official ERP 13-Columns Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-[11px] tracking-wide uppercase divide-x divide-slate-700">
                  <th className="p-3 text-slate-300">A - FECHA ENVÍO</th>
                  <th className="p-3 text-slate-300">B - N° CHASIS</th>
                  <th className="p-3 text-slate-300">C - N° MOTOR</th>
                  <th className="p-3 text-slate-300">D - MOTO</th>
                  <th className="p-3 text-slate-300">E - COLOR</th>
                  <th className="p-3 text-right text-slate-300">F - PRECIO</th>
                  <th className="p-3 text-slate-300">G - MODELO</th>
                  <th className="p-3 text-slate-300">H - CILINDRAJE</th>
                  <th className="p-3 text-center text-slate-300">I - VENDIDA</th>
                  {!isCustomerViewMode && <th className="p-3 text-slate-300">J - ORIGEN</th>}
                  <th className="p-3 text-center text-slate-300">K - CONFIRMACIÓN</th>
                  <th className="p-3 text-center text-slate-300">L - SALIDA</th>
                  <th className="p-3 text-center text-slate-300">M - FECHA SALIDA</th>
                  <th className="p-3 text-center text-slate-300">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredMotos.length > 0 ? (
                  filteredMotos.map((item, idx) => {
                    const isAvailable = item.confirmacion_de_llegada === "CONFIRMADA" && item.vendida === "NO" && (!item.salida || item.salida === "NO");
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors divide-x divide-slate-100">
                        <td className="p-3 font-semibold text-slate-600 whitespace-nowrap">{item.fecha_envio || "N/D"}</td>
                        <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">{item.numero_chasis}</td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{item.numero_motor}</td>
                        <td className="p-3 font-bold text-slate-900">{item.motocicleta}</td>
                        <td className="p-3 text-slate-700">{item.color}</td>
                        <td className="p-3 text-right font-mono font-bold text-red-600 whitespace-nowrap">${item.precio.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-slate-700">{item.modelo}</td>
                        <td className="p-3 font-semibold text-slate-700">{item.cilindraje} cc</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.vendida === "SI" ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"
                          }`}>
                            {item.vendida === "SI" ? "SÍ (VENDIDA)" : "NO (DISPONIBLE)"}
                          </span>
                        </td>
                        {!isCustomerViewMode && (
                          <td className="p-3 text-slate-600 font-medium">{item.sitio_de_donde_viene || "Bodega Principal"}</td>
                        )}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.confirmacion_de_llegada === "CONFIRMADA" ? "bg-green-100 text-green-700" :
                            item.confirmacion_de_llegada === "NO CONFIRMADA" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {item.confirmacion_de_llegada || "PENDIENTE"}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.salida && item.salida !== "NO" ? "bg-slate-200 text-slate-800" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {item.salida && item.salida !== "NO" ? item.salida : "NO (EN SALA)"}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">{item.fecha_salida || "N/A"}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setSelectedChasis(item.numero_chasis)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                              title="Ver Ficha Histórica"
                            >
                              Ficha
                            </button>
                            <button
                              onClick={() => openVerificarLlegadaModal(item.numero_chasis)}
                              className="bg-green-50 hover:bg-green-600 hover:text-white text-green-700 border border-green-200 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                              title="Verificar Llegada Física"
                            >
                              Verificar
                            </button>
                            <button
                              onClick={() => openSalidaModal(item.numero_chasis)}
                              className="bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 border border-amber-200 px-2 py-1 rounded text-[10px] font-bold transition-colors"
                              title="Registrar Salida de Sala"
                            >
                              Salida
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-slate-500 hover:text-slate-800 p-1"
                              title="Editar Registro"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteMotorcycle(item.numero_chasis)}
                              className="text-slate-400 hover:text-red-600 p-1"
                              title="Eliminar Registro"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isCustomerViewMode ? 13 : 14} className="p-8 text-center text-slate-400">
                      No se encontraron motocicletas en la base de datos de sala.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: REVISIONES TÉCNICAS */}
      {activeSubTab === "revisiones" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dashed pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Centro Técnico: Revisiones de Garantía</h3>
              <p className="text-xs text-slate-500">Módulo centralizado para radicaciones de mantenimiento, servicios mecánicos de primer control y revisiones programadas.</p>
            </div>
            <button
              onClick={() => openNewRevision()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-center"
            >
              <Plus size={15} />
              <span>Ingresar Nueva Revisión</span>
            </button>
          </div>

          {/* Revisiones Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 border p-4 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Radicadas</span>
              <div className="text-xl font-black text-slate-800 mt-1">{totalRevs} órdenes</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-center">
              <span className="text-[10px] font-bold text-yellow-600 uppercase">En Espera / Pendientes</span>
              <div className="text-xl font-black text-yellow-700 mt-1">{pendingRevs} órdenes</div>
            </div>
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
              <span className="text-[10px] font-bold text-green-600 uppercase">Completadas / Listas</span>
              <div className="text-xl font-black text-green-700 mt-1">{completedRevs} órdenes</div>
            </div>
          </div>

          {/* Revisions Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, documento, chasis, placa..."
                value={revisionSearch}
                onChange={(e) => setRevisionSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div>
                <select
                  value={filterSede}
                  onChange={(e) => setFilterSede(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
                >
                  <option value="Todas">Todas las Sedes</option>
                  {sedes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterRevEstado}
                  onChange={(e) => setFilterRevEstado(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg py-1.5 px-3 text-xs focus:outline-hidden"
                >
                  <option value="Todas">Todos los Estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Completado">Completado</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Revisions Table */}
          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Fecha Servicio</th>
                  <th className="p-4">Cliente / Cédula</th>
                  <th className="p-4">Vehículo</th>
                  <th className="p-4">Chasis</th>
                  <th className="p-4 text-center">Placa</th>
                  <th className="p-4">Tipo Control</th>
                  <th className="p-4 text-center">Kilometraje</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRevisions.length > 0 ? (
                  filteredRevisions.map((rev, idx) => {
                    const globalIdx = db.revisiones.indexOf(rev);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 whitespace-nowrap font-mono">{rev.fecha_servicio || "En espera"}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{rev.nombre} {rev.apellidos}</div>
                          <div className="text-[10px] text-slate-400 font-mono">CC {rev.cedula}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          <div>{rev.moto}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Modelo: {rev.modelo}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-500">
                          <button 
                            onClick={() => setSelectedChasis(rev.chasis)}
                            className="text-red-600 hover:underline hover:text-red-700"
                            title="Ver Ficha Histórica de Vehículo"
                          >
                            {rev.chasis}
                          </button>
                        </td>
                        <td className="p-4 text-center font-mono font-bold">
                          {rev.placa ? (
                            <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-[10px]">{rev.placa}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-700">{rev.razon}</td>
                        <td className="p-4 text-center font-mono font-semibold">{rev.km} Km</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            rev.estado === "Pendiente" ? "bg-yellow-100 text-yellow-700" :
                            rev.estado === "Cancelada" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}>
                            {rev.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => openEditRevision(globalIdx, rev)}
                              className="text-slate-500 hover:text-slate-800 p-0.5"
                              title="Editar Orden de Servicio"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteRevision(globalIdx)}
                              className="text-slate-400 hover:text-red-600 p-0.5"
                              title="Eliminar Orden"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      No se encontraron órdenes de revisión técnica programadas con los filtros indicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MOTORCYCLE GENERAL REGISTRATION MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleAddMotorcycle} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center space-x-2">
                <Bike className="text-red-600" size={18} />
                <span>Registrar Ingreso de Motocicleta</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Fecha de Ingreso / Envío *</label>
                <input
                  type="date"
                  required
                  value={fechaEnvio}
                  onChange={(e) => setFechaEnvio(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Sitio de Procedencia *</label>
                <input
                  type="text"
                  required
                  value={sitioViene}
                  onChange={(e) => setSitioViene(e.target.value)}
                  placeholder="Ej: Bodega Principal"
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Número de Chasis *</label>
                <input
                  type="text"
                  required
                  value={chasisForm}
                  onChange={(e) => setChasisForm(e.target.value)}
                  placeholder="Ej: CHASIS-XR150L-00X"
                  className="w-full bg-slate-50 border rounded-lg p-2 font-mono uppercase focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Número de Motor *</label>
                <input
                  type="text"
                  required
                  value={motorForm}
                  onChange={(e) => setMotorForm(e.target.value)}
                  placeholder="Ej: MOTOR-XR150L-00X"
                  className="w-full bg-slate-50 border rounded-lg p-2 font-mono uppercase focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-1">Modelo / Referencia Motocicleta *</label>
                <input
                  type="text"
                  required
                  value={motocicletaForm}
                  onChange={(e) => setMotocicletaForm(e.target.value)}
                  placeholder="Ej: CB 125F"
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Año Modelo *</label>
                <input
                  type="text"
                  required
                  value={modeloForm}
                  onChange={(e) => setModeloForm(e.target.value)}
                  placeholder="Ej: 2026"
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Color *</label>
                <input
                  type="text"
                  required
                  value={colorForm}
                  onChange={(e) => setColorForm(e.target.value)}
                  placeholder="Ej: Rojo, Negro, Tricolor"
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Cilindraje exacto (cc) *</label>
                <input
                  type="text"
                  required
                  value={cilindrajeForm}
                  onChange={(e) => setCilindrajeForm(e.target.value)}
                  placeholder="Ej: 125, 150, 190"
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Precio Base de Lista ($) *</label>
                <input
                  type="number"
                  required
                  value={precioForm || ""}
                  onChange={(e) => setPrecioForm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border rounded-lg p-2 font-mono font-bold focus:outline-hidden text-red-600"
                />
              </div>
              <div>
                <label className="block mb-1">Confirmación Recepción</label>
                <select
                  value={confirmacionLlegada}
                  onChange={(e: any) => setConfirmacionLlegada(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-slate-800"
                >
                  <option value="CONFIRMADA">CONFIRMADA</option>
                  <option value="NO CONFIRMADA">NO CONFIRMADA</option>
                  <option value="CON NOVEDAD">CON NOVEDAD</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Estado de Venta</label>
                <select
                  value={vendidaForm}
                  onChange={(e: any) => setVendidaForm(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-slate-800"
                >
                  <option value="NO">DISPONIBLE (NO)</option>
                  <option value="SI">VENDIDA (SI)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
              >
                Confirmar Ingreso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MOTORCYCLE EDITING FORM MODAL */}
      {editingMoto && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleEditMotorcycle} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center space-x-2">
                <Edit className="text-red-600" size={18} />
                <span>Editar Motocicleta - Chasis {editingMoto.numero_chasis}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingMoto(null)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Fecha de Envío *</label>
                <input
                  type="date"
                  required
                  value={fechaEnvio}
                  onChange={(e) => setFechaEnvio(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Ubicación / Sede *</label>
                <input
                  type="text"
                  required
                  value={sitioViene}
                  onChange={(e) => setSitioViene(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-400">Número de Chasis (Inmutable)</label>
                <input
                  type="text"
                  disabled
                  value={chasisForm}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-lg p-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block mb-1">Número de Motor *</label>
                <input
                  type="text"
                  required
                  value={motorForm}
                  onChange={(e) => setMotorForm(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 font-mono uppercase focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-1">Referencia Motocicleta *</label>
                <input
                  type="text"
                  required
                  value={motocicletaForm}
                  onChange={(e) => setMotocicletaForm(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Modelo Comercial *</label>
                <input
                  type="text"
                  required
                  value={modeloForm}
                  onChange={(e) => setModeloForm(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Color *</label>
                <input
                  type="text"
                  required
                  value={colorForm}
                  onChange={(e) => setColorForm(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Cilindraje *</label>
                <input
                  type="text"
                  required
                  value={cilindrajeForm}
                  onChange={(e) => setCilindrajeForm(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block mb-1">Precio de Lista ($) *</label>
                <input
                  type="number"
                  required
                  value={precioForm || ""}
                  onChange={(e) => setPrecioForm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border rounded-lg p-2 font-mono font-bold focus:outline-hidden text-red-600"
                />
              </div>
              <div>
                <label className="block mb-1">Confirmación Recepción</label>
                <select
                  value={confirmacionLlegada}
                  onChange={(e: any) => setConfirmacionLlegada(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-slate-800"
                >
                  <option value="CONFIRMADA">CONFIRMADA</option>
                  <option value="NO CONFIRMADA">NO CONFIRMADA</option>
                  <option value="CON NOVEDAD">CON NOVEDAD</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Venta / Disponibilidad</label>
                <select
                  value={vendidaForm}
                  onChange={(e: any) => setVendidaForm(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-slate-800"
                >
                  <option value="NO">DISPONIBLE</option>
                  <option value="SI">VENDIDA</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setEditingMoto(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REVISION FORM MODAL */}
      {showRevisionForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSaveRevision} className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center space-x-2">
                <Wrench className="text-red-600" size={18} />
                <span>{editingRevisionIndex !== null ? "Editar Orden de Servicio Técnico" : "Registrar Entrada a Servicio Técnico"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionForm(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                Cerrar (X)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              
              {/* Left Column: Bike Selection and Specs */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                <h4 className="font-bold text-[11px] text-slate-800 border-b pb-1 flex items-center space-x-1 uppercase">
                  <Bike size={12} className="text-red-600" />
                  <span>Información del Vehículo</span>
                </h4>
                
                <div>
                  <label className="block mb-1 text-slate-500">Seleccionar Chasis de Stock *</label>
                  <select
                    value={revChasis}
                    onChange={(e) => handleChasisSelectionChange(e.target.value)}
                    className="w-full bg-white border rounded p-2 text-xs font-mono font-bold"
                  >
                    <option value="">-- Seleccionar Chasis --</option>
                    {db.motos_en_sala.map(m => (
                      <option key={m.numero_chasis} value={m.numero_chasis}>
                        {m.numero_chasis} ({m.motocicleta})
                      </option>
                    ))}
                  </select>
                </div>

                {revChasis && (
                  <div className="space-y-1.5 text-[11px] text-slate-500 font-medium">
                    <div className="flex justify-between border-b border-dashed pb-1">
                      <span>Referencia:</span>
                      <span className="font-bold text-slate-800">{revMotoName}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-1">
                      <span>Motor:</span>
                      <span className="font-mono font-bold text-slate-800">{revMotorNo}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-1">
                      <span>Modelo comercial:</span>
                      <span className="font-bold text-slate-800">{revModelo}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-1">
                      <span>Cilindraje / Color:</span>
                      <span className="font-bold text-slate-800">{revCilindraje}cc / {revColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Placa Asignada:</span>
                      <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 rounded">{revPlaca || "SIN PLACA"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Customer Details (Pre-filled on match) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                <h4 className="font-bold text-[11px] text-slate-800 border-b pb-1 flex items-center space-x-1 uppercase">
                  <UserCheck size={12} className="text-red-600" />
                  <span>Datos del Propietario</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-slate-500">Nombres *</label>
                    <input
                      type="text"
                      required
                      value={revNombre}
                      onChange={(e) => setRevNombre(e.target.value)}
                      className="w-full bg-white border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-500">Apellidos *</label>
                    <input
                      type="text"
                      required
                      value={revApellidos}
                      onChange={(e) => setRevApellidos(e.target.value)}
                      className="w-full bg-white border rounded p-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-500">Documento Identificación *</label>
                  <input
                    type="text"
                    required
                    value={revCedula}
                    onChange={(e) => setRevCedula(e.target.value)}
                    className="w-full bg-white border rounded p-1.5 text-xs font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-slate-500">Celular / Teléfono</label>
                    <input
                      type="text"
                      value={revTelefono}
                      onChange={(e) => setRevTelefono(e.target.value)}
                      className="w-full bg-white border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-500">Placa Vehículo</label>
                    <input
                      type="text"
                      value={revPlaca}
                      onChange={(e) => setRevPlaca(e.target.value.toUpperCase())}
                      className="w-full bg-white border rounded p-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Control Details */}
              <div className="col-span-full space-y-3 border-t pt-3">
                <h4 className="font-bold text-[11px] text-slate-800 border-b pb-1 flex items-center space-x-1 uppercase">
                  <Clipboard size={12} className="text-red-600" />
                  <span>Detalles de Control Técnico & Servicio</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-500 font-semibold">Fecha Radicación *</label>
                    <input
                      type="date"
                      required
                      value={revFechaServicio}
                      onChange={(e) => setRevFechaServicio(e.target.value)}
                      className="w-full bg-white border rounded p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 font-semibold">Kilometraje Entrada *</label>
                    <input
                      type="text"
                      required
                      value={revKm}
                      onChange={(e) => setRevKm(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-white border rounded p-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 font-semibold">Estado de Orden</label>
                    <select
                      value={revEstado}
                      onChange={(e) => setRevEstado(e.target.value)}
                      className="w-full bg-white border rounded p-2 text-xs"
                    >
                      <option value="Pendiente">Pendiente (En Taller)</option>
                      <option value="Realizada">Realizada (Listo)</option>
                      <option value="Completado">Completado (Entregado)</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-500 font-semibold">Concepto / Razón de Servicio</label>
                    <select
                      value={revRazon}
                      onChange={(e) => setRevRazon(e.target.value)}
                      className="w-full bg-white border rounded p-2 text-xs text-slate-700"
                    >
                      <option value="Primera revisión de garantía (500 Km)">Primera revisión de garantía (500 Km)</option>
                      <option value="Segunda revisión de garantía (3.000 Km)">Segunda revisión de garantía (3.000 Km)</option>
                      <option value="Tercera revisión de garantía (6.000 Km)">Tercera revisión de garantía (6.000 Km)</option>
                      <option value="Mantenimiento preventivo general">Mantenimiento preventivo general</option>
                      <option value="Servicio de reparación mecánica">Servicio de reparación mecánica</option>
                      <option value="Revisión de sistema eléctrico">Revisión de sistema eléctrico</option>
                      <option value="Cambio de kit de arrastre y llantas">Cambio de kit de arrastre y llantas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 font-semibold">Mes de Control Programado</label>
                    <select
                      value={revMes}
                      onChange={(e) => setRevMes(e.target.value)}
                      className="w-full bg-white border rounded p-2 text-xs text-slate-700"
                    >
                      <option value="1 Mes">1 Mes</option>
                      <option value="3 Meses">3 Meses</option>
                      <option value="6 Meses">6 Meses</option>
                      <option value="9 Meses">9 Meses</option>
                      <option value="12 Meses">12 Meses</option>
                      <option value="Mantenimiento puntual">Mantenimiento puntual</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowRevisionForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
              >
                Guardar Orden
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VERIFICACIÓN DE LLEGADA FÍSICA MODAL (CONTROL DE IDENTIFICACIÓN) */}
      {showVerificarLlegadaModal && verificarIdx !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <form onSubmit={handleSaveVerificacion} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={18} />
                <span>Control de Identificación al Recibir</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowVerificarLlegadaModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                Cerrar (X)
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">
                Motocicleta: {db.motos_en_sala[verificarIdx]?.motocicleta} ({db.motos_en_sala[verificarIdx]?.modelo})
              </p>
              <p className="font-mono text-slate-600">
                Chasis: <span className="font-bold">{db.motos_en_sala[verificarIdx]?.numero_chasis}</span> | Motor: <span className="font-bold">{db.motos_en_sala[verificarIdx]?.numero_motor}</span>
              </p>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-700 bg-slate-50 p-4 rounded-xl border">
              <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2">Checklist de Verificación Física</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={verChasisChecked} onChange={(e) => setVerChasisChecked(e.target.checked)} className="rounded text-green-600" />
                <span>N° CHASIS Coincide con la placa física en chasis</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={verMotorChecked} onChange={(e) => setVerMotorChecked(e.target.checked)} className="rounded text-green-600" />
                <span>N° MOTOR Coincide con la numeración grabada</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={verModeloChecked} onChange={(e) => setVerModeloChecked(e.target.checked)} className="rounded text-green-600" />
                <span>MODELO Y REFERENCIA Comercial verificados</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={verColorChecked} onChange={(e) => setVerColorChecked(e.target.checked)} className="rounded text-green-600" />
                <span>COLOR Comercial coincide con el manifiesto</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={verCilindrajeChecked} onChange={(e) => setVerCilindrajeChecked(e.target.checked)} className="rounded text-green-600" />
                <span>CILINDRAJE y fichas técnicas recibidas</span>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-700">Estado de Confirmación de Llegada *</label>
                <select
                  value={verEstadoSelect}
                  onChange={(e: any) => setVerEstadoSelect(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold text-slate-800"
                >
                  <option value="CONFIRMADA">CONFIRMADA (Llegó en perfecto estado - Disponible en Stock)</option>
                  <option value="CON NOVEDAD">CON NOVEDAD (Llegó con rayones / detalles / faltantes)</option>
                  <option value="NO CONFIRMADA">NO CONFIRMADA (No coincide / Rechazada)</option>
                  <option value="PENDIENTE">PENDIENTE (En tránsito)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-600">Observaciones o Notas de Recepción</label>
                <textarea
                  rows={2}
                  value={verObs}
                  onChange={(e) => setVerObs(e.target.value)}
                  placeholder="Detalles sobre el estado físico, novedades o confirmación..."
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowVerificarLlegadaModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Guardar Confirmación
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REGISTRO DE SALIDA DE SALA MODAL */}
      {showSalidaModal && salidaIdx !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <form onSubmit={handleSaveSalida} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center space-x-2">
                <AlertCircle className="text-amber-600" size={18} />
                <span>Control de Salida de Sala</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSalidaModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                Cerrar (X)
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-1 text-amber-900">
              <p className="font-bold">
                Motocicleta: {db.motos_en_sala[salidaIdx]?.motocicleta} ({db.motos_en_sala[salidaIdx]?.numero_chasis})
              </p>
              <p>Esta acción registrará que la motocicleta física saldrá de las instalaciones de la sala de ventas.</p>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Motivo de Salida *</label>
                <select
                  value={salidaMotivo}
                  onChange={(e) => setSalidaMotivo(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold text-slate-800"
                >
                  <option value="Venta Entregada">Venta Entregada al Cliente</option>
                  <option value="Traslado a otra Sede">Traslado a otra Sede / Bodega</option>
                  <option value="Demostración / Exhibición">Demostración / Evento de Exhibición</option>
                  <option value="Garantía Taller">Ingreso a Taller / Garantía Externa</option>
                  <option value="Devolución a Proveedor">Devolución a Proveedor</option>
                  <option value="Otro">Otro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Fecha de Salida *</label>
                <input
                  type="date"
                  required
                  value={salidaFechaInput}
                  onChange={(e) => setSalidaFechaInput(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowSalidaModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Registrar Salida
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
