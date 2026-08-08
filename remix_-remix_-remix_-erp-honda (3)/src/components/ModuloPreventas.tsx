import React, { useState } from "react";
import { Plus, Search, Calendar, ChevronLeft, ArrowRight, User, Phone, MapPin, Mail, DollarSign, Ban, Bike, UserPlus } from "lucide-react";
import { DatabaseState, Usuario, Preventa, Recibo } from "../types";
import { getTodayDateString, generarIdEncargo, registrarEvento } from "../utils/db";
import ModalCrearCliente from "./ModalCrearCliente";

interface PreventasProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
  setView: (v: any) => void;
  setSelectedEntityId?: (id: string) => void;
}

export default function ModuloPreventas({ user, db, setDb, setView, setSelectedEntityId }: PreventasProps) {
  const [searchTerm, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [showForm, setShowForm] = useState(false);
  const [selectedPreventa, setSelectedPreventa] = useState<Preventa | null>(null);

  // Abonos state variables
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedPreventaForAbono, setSelectedPreventaForAbono] = useState<Preventa | null>(null);
  const [abonoFecha, setAbonoFecha] = useState(getTodayDateString());
  const [abonoValor, setAbonoValor] = useState(0);
  const [abonoFormaPago, setAbonoFormaPago] = useState<"Efectivo" | "Transferencia" | "Desembolso">("Efectivo");
  const [abonoObservaciones, setAbonoObservaciones] = useState("");

  const handleOpenAbonar = (prev: Preventa) => {
    setSelectedPreventaForAbono(prev);
    setAbonoFecha(getTodayDateString());
    setAbonoValor(0);
    setAbonoFormaPago("Efectivo");
    setAbonoObservaciones("");
    setShowAbonoModal(true);
  };

  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreventaForAbono) return;
    if (abonoValor <= 0) {
      alert("El valor del abono debe ser mayor a cero.");
      return;
    }
    if (abonoValor > selectedPreventaForAbono.deuda) {
      alert(`El valor del abono no puede superar el saldo pendiente ($${selectedPreventaForAbono.deuda.toLocaleString()}).`);
      return;
    }

    let updatedDb = { ...db };
    const currentRecibos = updatedDb.recibos || [];
    let maxReciboNo = currentRecibos.reduce((max, r) => {
      const num = parseInt(r.numero_recibo) || 0;
      return num > max ? num : max;
    }, 10000);

    const finalNumero = String(maxReciboNo + 1);

    const newRec: Recibo = {
      fecha: abonoFecha,
      numero_recibo: finalNumero,
      recibo_de_pertenencia: `Cliente: ${selectedPreventaForAbono.nombre} ${selectedPreventaForAbono.apellido}`,
      concepto: `Abono Preventa ${selectedPreventaForAbono.id_del_encargo} (${abonoFormaPago})${abonoObservaciones ? ` - Obs: ${abonoObservaciones}` : ""}`,
      entrada: abonoValor,
      salida: 0
    };

    const updatedPreventas = db.preventas.map((p) => {
      if (p.id_del_encargo === selectedPreventaForAbono.id_del_encargo) {
        const pastHistorial = p.abonos_historial || [];
        // Add initial payment if history is empty
        const listWithInitial = pastHistorial.length === 0 && p.total_abono > 0 ? [
          {
            fecha: p.fecha_de_inicio,
            valor: p.total_abono,
            forma_pago: p.forma_de_pago,
            observaciones: "Abono inicial registrado en la creación",
            numero_recibo: p.recibos
          }
        ] : pastHistorial;

        const newTotalAbono = p.total_abono + abonoValor;
        const newDeuda = Math.max(0, p.precio_moto - newTotalAbono);

        const newAbonoItem = {
          fecha: abonoFecha,
          valor: abonoValor,
          forma_pago: abonoFormaPago,
          observaciones: abonoObservaciones,
          numero_recibo: finalNumero
        };

        const nextHistorial = [...listWithInitial, newAbonoItem];

        return {
          ...p,
          total_abono: newTotalAbono,
          deuda: newDeuda,
          fecha_ultimo_abono: abonoFecha,
          recibos: p.recibos ? `${p.recibos}, ${finalNumero}` : finalNumero,
          abonos_historial: nextHistorial
        };
      }
      return p;
    });

    updatedDb.preventas = updatedPreventas;
    updatedDb.recibos = [newRec, ...currentRecibos];

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "PREVENTAS",
      "Actualizar",
      "AMARILLA",
      "Abono",
      selectedPreventaForAbono.id_del_encargo,
      finalNumero,
      `Se registró abono de $${abonoValor.toLocaleString()} en ${abonoFormaPago} para la preventa ${selectedPreventaForAbono.id_del_encargo}. Recibo: ${finalNumero}.`
    );

    setDb(updatedDb);
    setShowAbonoModal(false);
    setSelectedPreventaForAbono(null);
    alert(`Abono de $${abonoValor.toLocaleString()} registrado con éxito. Se generó el Recibo #${finalNumero}.`);
  };

  // New pre-sale form states
  const [showClientModal, setShowClientModal] = useState(false);
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [tipoMoto, setTipoMoto] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [precio, setPrecio] = useState(0);
  const [formaPago, setFormaPago] = useState("Contado");
  const [efectivo, setEfectivo] = useState(0);
  const [transferencia, setTransferencia] = useState(0);
  const [desembolso, setDesembolso] = useState(0);

  // Expanded fields based on new PREVENTAS sheet structure
  const [bancos, setBancos] = useState("");
  const [salidaDinero, setSalidaDinero] = useState("");
  const [valorSalida, setValorSalida] = useState(0);
  const [detallesSalida, setDetallesSalida] = useState("");
  const [valor, setValor] = useState(0);
  const [detalles, setDetalles] = useState("");
  const [fechaTerminoDePagar, setFechaTerminoDePagar] = useState("");

  const defaultMotoSuggestions = ["XR190L", "CB125F", "XRE 300", "Navi", "Dio", "XR150L", "CB190R", "PCX160", "GL150", "Wave110S", "XRE190", "CB300F", "CB1000R"];
  const getMotoSuggestions = () => {
    const existing = new Set(defaultMotoSuggestions);
    if (db.motos_en_sala) {
      db.motos_en_sala.forEach(m => { if (m.motocicleta) existing.add(m.motocicleta); });
    }
    if (db.actas) {
      db.actas.forEach(a => { if (a.moto) existing.add(a.moto); });
    }
    if (db.preventas) {
      db.preventas.forEach(p => { if (p.tipo_de_moto) existing.add(p.tipo_de_moto); });
    }
    return Array.from(existing);
  };

  // Search when document is entered to auto-fill details if they exist in DB
  const handleCedulaBlur = () => {
    const doc = cedula.trim();
    if (!doc) return;
    
    // Find customer in previous preventas or actas
    const prevMatch = db.preventas.find((p) => p.cedula === doc);
    const actasMatch = db.actas.find((a) => a.documento === doc);
    
    if (prevMatch) {
      setNombre(prevMatch.nombre);
      setApellido(prevMatch.apellido);
      setTelefono(prevMatch.telefono);
      setCorreo(prevMatch.correo);
      setDireccion(prevMatch.direccion);
    } else if (actasMatch) {
      setNombre(actasMatch.nombres);
      setApellido(actasMatch.apellidos);
      setTelefono(actasMatch.telefono);
      setCorreo(actasMatch.correo);
      setDireccion(actasMatch.direccion);
    }
  };

  const handleSavePreventa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula || !nombre || !tipoMoto || !modelo || precio <= 0) {
      alert("Por favor complete todos los campos obligatorios (*)");
      return;
    }

    const idEncargo = generarIdEncargo(db, cedula);
    const totalAbono = efectivo + transferencia + desembolso;
    const deuda = Math.max(0, precio - totalAbono);
    const generatedReceipt = totalAbono > 0 ? String(Math.floor(10000 + Math.random() * 90000)) : "";

    const newPre: Preventa = {
      fecha_de_inicio: getTodayDateString(),
      id_del_encargo: idEncargo,
      modelo, // stores only the year (e.g., 2024)
      color,
      tipo_de_moto: tipoMoto, // stores commercial name (e.g., XR190L, CB125F, Navi, Dio)
      precio_moto: precio,
      forma_de_pago: formaPago,
      recibo: generatedReceipt,
      ingreso_efectivo: efectivo,
      ingreso_bancarizado: transferencia,
      bancos: bancos || "",
      ingreso_desembolso: desembolso,
      total_abono: totalAbono,
      cedula,
      nombre,
      apellido,
      telefono,
      correo,
      direccion,
      salida_dinero: salidaDinero || "",
      valor_salida: valorSalida || 0,
      detalles_salida: detallesSalida || "",
      valor: valor || 0,
      detalles: detalles || "",
      fecha_de_salida: "",
      deuda,
      estado: "ACTIVA",
      fecha_termino_de_pagar: fechaTerminoDePagar || "",

      // Compatibility
      recibos: generatedReceipt,
      ingreso_transferencia: transferencia,
      valor_devolucion: 0,
      detalles_devolucion: "",
      fecha_salida: ""
    };

    let updatedDb = { ...db };

    // Register receipt automatically in RECIBOS if money was paid
    if (totalAbono > 0) {
      const recNo = newPre.recibo || newPre.recibos;
      const newRec: Recibo = {
        fecha: getTodayDateString(),
        numero_recibo: recNo,
        recibo_de_pertenencia: `Cliente ${nombre} ${apellido}`,
        concepto: `Abono Inicial Preventa ${idEncargo}`,
        entrada: totalAbono,
        salida: 0
      };
      updatedDb.recibos = [newRec, ...updatedDb.recibos];
    }

    // Add preventa and log event
    updatedDb.preventas = [newPre, ...updatedDb.preventas];
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "PREVENTAS",
      "Crear",
      "AMARILLA",
      "Id del Encargo",
      "",
      idEncargo,
      `Creación de preventa para motocicleta ${tipoMoto} Modelo ${modelo}`
    );

    setDb(updatedDb);
    setShowForm(false);
    resetForm();
    alert(`Preventa registrada exitosamente con ID: ${idEncargo}`);
  };

  const handleDevolucion = (prev: Preventa) => {
    const valDevStr = prompt(`Ingrese el valor a devolver (Máximo $${prev.total_abono}):`, String(prev.total_abono));
    if (valDevStr === null) return;
    const valDev = parseFloat(valDevStr);
    
    if (isNaN(valDev) || valDev < 0 || valDev > prev.total_abono) {
      alert("Valor de devolución inválido o mayor que el abono total.");
      return;
    }

    const motivoDev = prompt("Ingrese la justificación de la devolución (Obligatorio):");
    if (!motivoDev) {
      alert("La justificación es obligatoria para registrar la devolución.");
      return;
    }

    const updatedPre = db.preventas.map((p) => {
      if (p.id_del_encargo === prev.id_del_encargo) {
        return {
          ...p,
          estado: "DEVUELTA" as const,
          valor_devolucion: valDev,
          detalles_devolucion: motivoDev,
          fecha_salida: getTodayDateString(),
          
          // New fields support
          salida_dinero: "Devolución",
          valor_salida: valDev,
          detalles_salida: motivoDev,
          valor: valDev,
          fecha_de_salida: getTodayDateString(),
          fecha_termino_de_pagar: getTodayDateString()
        };
      }
      return p;
    });

    let updatedDb = { ...db, preventas: updatedPre };

    // Generate output receipt automatically in RECIBOS
    const nextRecNo = String(Math.floor(10000 + Math.random() * 90000));
    const devReceipt: Recibo = {
      fecha: getTodayDateString(),
      numero_recibo: nextRecNo,
      recibo_de_pertenencia: `Cliente ${prev.nombre} ${prev.apellido}`,
      concepto: `Devolución de Abonos Preventa ${prev.id_del_encargo}`,
      entrada: 0,
      salida: valDev
    };

    updatedDb.recibos = [devReceipt, ...updatedDb.recibos];
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "PREVENTAS",
      "Editar",
      "ROJA",
      "Estado",
      prev.estado,
      "DEVUELTA",
      `Devolución registrada de $${valDev}. Motivo: ${motivoDev}`
    );

    setDb(updatedDb);
    alert(`Devolución de abono completada. Recibo de salida #${nextRecNo} creado.`);
  };

  const resetForm = () => {
    setCedula("");
    setNombre("");
    setApellido("");
    setTelefono("");
    setCorreo("");
    setDireccion("");
    setModelo("");
    setTipoMoto("");
    setColor("");
    setPrecio(0);
    setEfectivo(0);
    setTransferencia(0);
    setDesembolso(0);
    setBancos("");
    setSalidaDinero("");
    setValorSalida(0);
    setDetallesSalida("");
    setValor(0);
    setDetalles("");
    setFechaTerminoDePagar("");
  };

  // Filter items
  const filteredList = db.preventas.filter((item) => {
    const matchSearch =
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cedula.includes(searchTerm) ||
      item.id_del_encargo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "TODOS") return matchSearch;
    return matchSearch && item.estado === filterStatus;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Módulo Preventas</h2>
          <p className="text-xs text-slate-500 mt-1">
            Administración, registro de abonos y control pre-venta de motocicletas.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors flex items-center space-x-2 w-max self-start"
          >
            <Plus size={16} />
            <span>Crear Nueva Preventa</span>
          </button>
        )}
      </div>

      {showForm ? (
        /* Form creation wizard style */
        <form onSubmit={handleSavePreventa} className="space-y-6">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-4">
            <button type="button" onClick={() => setShowForm(false)} className="hover:text-slate-800 flex items-center space-x-1">
              <ChevronLeft size={14} /> <span>Volver al Listado</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 font-bold">Nuevo Registro</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
            {/* Cliente */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <User size={16} className="text-red-500" />
                <span>Información del Cliente</span>
              </h3>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600">Cédula / Documento *</label>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear / Buscar Cliente</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  onBlur={handleCedulaBlur}
                  placeholder="Escriba el documento o busque en perfil de clientes"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Celular / Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dirección de Vivienda</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Negociación Motocicleta */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Bike size={16} className="text-red-500" />
                <span>Detalle de la Motocicleta</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Motocicleta (Línea) *</label>
                  <input
                    type="text"
                    required
                    value={tipoMoto}
                    onChange={(e) => {
                      setTipoMoto(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                    placeholder="Ej: XR190L, CB125F, Navi, Dio"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-red-500"
                  />
                  {showSuggestions && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto divide-y divide-slate-50">
                      {getMotoSuggestions()
                        .filter(m => m.toLowerCase().includes(tipoMoto.toLowerCase()))
                        .slice(0, 6)
                        .map((suggestion, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => {
                              setTipoMoto(suggestion);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))
                      }
                      {getMotoSuggestions().filter(m => m.toLowerCase().includes(tipoMoto.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400 italic">No hay coincidencias (se guardará como nuevo)</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Color Solicitado</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej: Rojo, Negro, Blanco"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Modelo (Año del Vehículo) *</label>
                  <select
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                  >
                    <option value="">Seleccione Año...</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Precio Moto *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={precio || ""}
                    onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-tight mb-2">Abono Inicial de Reserva</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Efectivo ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={efectivo || ""}
                      onChange={(e) => setEfectivo(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Transferencia ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={transferencia || ""}
                      onChange={(e) => setTransferencia(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Crédito / Desembolso ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={desembolso || ""}
                      onChange={(e) => setDesembolso(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-between bg-slate-200 p-3 rounded-lg text-xs font-mono font-bold text-slate-700">
                  <span>TOTAL ABONADO: ${efectivo + transferencia + desembolso}</span>
                  <span className="text-red-700">DEUDA RESTANTE: ${Math.max(0, precio - (efectivo + transferencia + desembolso))}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Entidad Bancaria / Banco</label>
                    <input
                      type="text"
                      value={bancos}
                      onChange={(e) => setBancos(e.target.value)}
                      placeholder="Ej: Bancolombia, Nequi, Daviplata"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Límite de Pago / Término</label>
                    <input
                      type="date"
                      value={fechaTerminoDePagar}
                      onChange={(e) => setFechaTerminoDePagar(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Forma de Pago Principal</label>
                    <select
                      value={formaPago}
                      onChange={(e) => setFormaPago(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden"
                    >
                      <option value="Contado">Contado</option>
                      <option value="Crédito">Crédito</option>
                      <option value="Mixto">Mixto</option>
                      <option value="Financiado">Financiado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Detalles / Observaciones Generales</label>
                    <input
                      type="text"
                      value={detalles}
                      onChange={(e) => setDetalles(e.target.value)}
                      placeholder="Ej: Trámite de crédito en curso"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
            >
              Guardar Preventa
            </button>
          </div>
        </form>
      ) : (
        /* List and Filter view */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por cédula, nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            {/* Status filters */}
            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {["TODOS", "ACTIVA", "PENDIENTE", "EN ESPERA", "FINALIZADA", "DEVUELTA"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`text-[10px] font-semibold uppercase tracking-wider py-1.5 px-3 rounded-full border transition-all ${
                    filterStatus === status
                      ? "bg-red-600 text-white border-red-600 shadow-xs"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table display */}
          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">ID Encargo</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Vehículo</th>
                  <th className="p-4 text-right">Precio Base</th>
                  <th className="p-4 text-right">Abonos</th>
                  <th className="p-4 text-right">Saldo Restante</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredList.length > 0 ? (
                  filteredList.map((item, idx) => {
                    const isDevuelta = item.estado === "DEVUELTA";
                    const isFinalizada = item.estado === "FINALIZADA";
                    return (
                      <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${isFinalizada ? "line-through text-slate-400" : ""}`}>
                        <td className="p-4 font-medium whitespace-nowrap">{item.fecha_de_inicio}</td>
                        <td className="p-4 font-mono font-bold text-red-600">{item.id_del_encargo}</td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{item.nombre} {item.apellido}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Doc: {item.cedula}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{item.tipo_de_moto}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Mod. {item.modelo} {item.color ? `· ${item.color}` : ""}</div>
                        </td>
                        <td className="p-4 text-right font-mono font-semibold">${item.precio_moto.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono font-semibold text-green-600">${item.total_abono.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono font-semibold text-red-600">${item.deuda.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.estado === "ACTIVA"
                                ? "bg-blue-100 text-blue-700"
                                : item.estado === "FINALIZADA"
                                ? "bg-slate-200 text-slate-600"
                                : item.estado === "DEVUELTA"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.estado}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            {item.estado === "ACTIVA" && (
                              <button
                                onClick={() => handleDevolucion(item)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition-colors"
                                title="Registrar Devolución de Abono"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                            {item.estado === "ACTIVA" && item.deuda > 0 && (
                              <button
                                onClick={() => handleOpenAbonar(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded-md text-[10px] uppercase transition-colors"
                              >
                                Abonar
                              </button>
                            )}
                            {item.estado === "ACTIVA" && item.deuda <= 0 && (
                              <button
                                onClick={() => {
                                  if (setSelectedEntityId) {
                                    setSelectedEntityId(item.cedula);
                                  }
                                  setView("Actas");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-md text-[10px] uppercase transition-all duration-300 animate-pulse"
                              >
                                Convertir en Acta
                              </button>
                            )}
                            {item.estado === "ACTIVA" && (
                              <button
                                onClick={() => {
                                  if (setSelectedEntityId) {
                                    setSelectedEntityId(item.cedula);
                                  }
                                  setView("Devoluciones");
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-700 py-1 px-2 rounded-md font-bold text-[10px] uppercase transition-colors"
                                title="Procesar devolución oficial"
                              >
                                ↩ Devolución
                              </button>
                            )}
                            {item.estado === "ACTIVA" && (
                              <button
                                onClick={() => {
                                  if (setSelectedEntityId) {
                                    setSelectedEntityId(item.cedula);
                                  }
                                  setView("Actas");
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded-md font-bold text-[10px] uppercase transition-colors"
                              >
                                Facturar
                              </button>
                            )}
                            {isDevuelta && (
                              <span className="text-[10px] text-slate-400 italic">
                                Devuelto ${item.valor_devolucion.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-slate-400">
                      No se encontraron registros de preventas que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE ABONOS */}
      {showAbonoModal && selectedPreventaForAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-red-600">
              <div>
                <h3 className="font-bold text-sm">Registrar Nuevo Abono</h3>
                <p className="text-[10px] text-slate-300">ID Encargo: {selectedPreventaForAbono.id_del_encargo}</p>
              </div>
              <button
                onClick={() => { setShowAbonoModal(false); setSelectedPreventaForAbono(null); }}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveAbono} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-800">{selectedPreventaForAbono.nombre} {selectedPreventaForAbono.apellido}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Precio Motocicleta:</span>
                  <span className="font-mono font-bold">${selectedPreventaForAbono.precio_moto.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-bold">
                  <span className="text-slate-600">Total Abonado Anterior:</span>
                  <span className="text-green-600 font-mono">${selectedPreventaForAbono.total_abono.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Saldo Pendiente:</span>
                  <span className="font-mono">${selectedPreventaForAbono.deuda.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Abono *</label>
                <input
                  type="date"
                  required
                  value={abonoFecha}
                  onChange={(e) => setAbonoFecha(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Valor del Abono ($) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={selectedPreventaForAbono.deuda}
                  value={abonoValor || ""}
                  onChange={(e) => setAbonoValor(parseFloat(e.target.value) || 0)}
                  placeholder="Ingrese el valor a abonar"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
                <p className="text-[9px] text-slate-400 mt-1">El valor máximo permitido es el saldo pendiente.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Forma de Pago *</label>
                <select
                  value={abonoFormaPago}
                  onChange={(e) => setAbonoFormaPago(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Desembolso">Crédito / Desembolso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones / Detalles</label>
                <textarea
                  value={abonoObservaciones}
                  onChange={(e) => setAbonoObservaciones(e.target.value)}
                  placeholder="Ej: Consignación Davivienda, Recibo físico..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 h-16 resize-none focus:outline-none"
                />
              </div>

              {/* History list of past payments */}
              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-tight mb-2">Historial de Abonos Registrados</h4>
                {((selectedPreventaForAbono.abonos_historial && selectedPreventaForAbono.abonos_historial.length > 0) || selectedPreventaForAbono.total_abono > 0) ? (
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                    {/* Initial payment fallback */}
                    {(!selectedPreventaForAbono.abonos_historial || selectedPreventaForAbono.abonos_historial.length === 0) && (
                      <div className="text-[10px] bg-slate-50 p-2 rounded flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800">Abono Inicial (Creación)</p>
                          <p className="text-slate-400 font-mono text-[9px]">{selectedPreventaForAbono.fecha_de_inicio}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono text-green-600">${selectedPreventaForAbono.total_abono.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Recibo: {selectedPreventaForAbono.recibos}</p>
                        </div>
                      </div>
                    )}
                    {selectedPreventaForAbono.abonos_historial?.map((ab, hIdx) => (
                      <div key={hIdx} className="text-[10px] bg-slate-50 p-2 rounded flex justify-between items-center pt-2">
                        <div>
                          <p className="font-bold text-slate-800">{ab.forma_pago} {ab.observaciones ? `· ${ab.observaciones}` : ""}</p>
                          <p className="text-slate-400 font-mono text-[9px]">{ab.fecha}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono text-green-600">${ab.valor.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Recibo: {ab.numero_recibo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No hay abonos registrados para este encargo.</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAbonoModal(false); setSelectedPreventaForAbono(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / SELECCIONAR CLIENTE */}
      <ModalCrearCliente
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        db={db}
        setDb={setDb}
        user={user}
        initialDocumento={cedula}
        onSelectClient={(c) => {
          setCedula(c.numero_documento);
          setNombre(c.nombres);
          setApellido(c.apellidos);
          setTelefono(c.telefono_principal);
          setCorreo(c.correo_electronico);
          setDireccion(c.direccion);
        }}
      />
    </div>
  );
}
