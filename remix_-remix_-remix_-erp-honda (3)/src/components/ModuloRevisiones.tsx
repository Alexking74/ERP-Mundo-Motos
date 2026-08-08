import React, { useState } from "react";
import { Wrench, Search, Plus, Calendar, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck, Bike, History, RefreshCw, FileText } from "lucide-react";
import { DatabaseState, Usuario, Revision } from "../types";
import { getTodayDateString, registrarEvento, validarKilometrajeRevision, autocompletarRevisionData } from "../utils/db";

interface ModuloRevisionesProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (newState: DatabaseState) => void;
  selectedEntityId?: string;
}

export default function ModuloRevisiones({ user, db, setDb, selectedEntityId }: ModuloRevisionesProps) {
  const [searchTerm, setSearchTerm] = useState(selectedEntityId || "");
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");

  // Form states
  const [searchLookup, setSearchLookup] = useState("");
  const [km, setKm] = useState("");
  const [razonPreset, setRazonPreset] = useState("Primera revisión");
  const [razonCustom, setRazonCustom] = useState("");
  const [mes, setMes] = useState(new Date().toLocaleString("es-CO", { month: "long" }).toUpperCase());
  const [estado, setEstado] = useState<string>("Realizada");
  const [fechaCompra, setFechaCompra] = useState("");
  const [fechaServicio, setFechaServicio] = useState(getTodayDateString());
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [moto, setMoto] = useState("");
  const [motor, setMotor] = useState("");
  const [chasis, setChasis] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [cilindraje, setCilindraje] = useState("");
  const [placa, setPlaca] = useState("");
  const [ciudad, setCiudad] = useState("Planadas");

  // KM validation alert states
  const [kmJustification, setKmJustification] = useState("");
  const [kmWarningActive, setKmWarningActive] = useState(false);
  const [maxKmHistorico, setMaxKmHistorico] = useState(0);

  // Auto-complete handler when searching Motor/Chasis/Cedula
  const handleAutoLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLookup.trim()) return;

    const data = autocompletarRevisionData(db, searchLookup, searchLookup);

    if (data.motor) setMotor(data.motor);
    if (data.chasis) setChasis(data.chasis);
    if (data.moto) setMoto(data.moto);
    if (data.modelo) setModelo(data.modelo);
    if (data.color) setColor(data.color);
    if (data.cilindraje) setCilindraje(data.cilindraje);
    if (data.placa) setPlaca(data.placa);
    if (data.fecha_compra) setFechaCompra(data.fecha_compra);
    if (data.cedula) setCedula(data.cedula);
    if (data.nombre) setNombre(data.nombre);
    if (data.apellidos) setApellidos(data.apellidos);
    if (data.correo) setCorreo(data.correo);
    if (data.direccion) setDireccion(data.direccion);
    if (data.telefono) setTelefono(data.telefono);
    if (data.ciudad) setCiudad(data.ciudad);

    alert(`🔍 Búsqueda realizada para "${searchLookup}". Se recuperaron automáticamente los datos relacionados del cliente y vehículo.`);
  };

  // KM change checker
  const handleKmChange = (val: string) => {
    setKm(val);
    const numKm = parseInt(val.replace(/\D/g, ""), 10) || 0;
    if (motor || chasis) {
      const check = validarKilometrajeRevision(db, motor, chasis, numKm);
      setMaxKmHistorico(check.maxHistoricoKm);
      setKmWarningActive(check.disminuyeKm);
    }
  };

  const handleSubmitNewRevision = (e: React.FormEvent) => {
    e.preventDefault();

    if (!motor.trim() && !chasis.trim()) {
      alert("⚠️ Debe especificar al menos el número de Motor o Chasis para vincular el historial del vehículo.");
      return;
    }

    if (!cedula.trim() || !nombre.trim()) {
      alert("⚠️ Debe ingresar la cédula y nombre del cliente.");
      return;
    }

    const numKm = parseInt(km.replace(/\D/g, ""), 10) || 0;
    const checkKm = validarKilometrajeRevision(db, motor, chasis, numKm);

    if (checkKm.disminuyeKm) {
      if (user.rol !== "Administrador" && !kmJustification.trim()) {
        alert(`🚨 ALERTA DE KILOMETRAJE: El kilometraje ingresado (${numKm} KM) es menor al registro máximo anterior (${checkKm.maxHistoricoKm} KM).\n\nComo Asesor de ventas/servicio, debe proporcionar obligatoriamente una justificación detallada para proceder.`);
        return;
      }
    }

    const finalRazon = razonPreset === "Otro (Personalizada)" ? razonCustom.trim() || "Mantenimiento general" : razonPreset;

    const newRevisionRecord: Revision = {
      km: `${numKm} KM`,
      razon: finalRazon,
      mes: mes.toUpperCase(),
      estado: estado,
      fecha_compra: fechaCompra || getTodayDateString(),
      fecha_servicio: fechaServicio || getTodayDateString(),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      cedula: cedula.trim(),
      correo: correo.trim() || "No registrado",
      direccion: direccion.trim() || "No registrada",
      telefono: telefono.trim() || "No registrado",
      moto: moto.trim() || "MOTO HONDA",
      motor: motor.trim().toUpperCase(),
      chasis: chasis.trim().toUpperCase(),
      modelo: modelo.trim() || "2026",
      color: color.trim() || "ESTÁNDAR",
      cilindraje: cilindraje.trim() || "125 cc",
      placa: placa.trim().toUpperCase() || "SIN PLACA",
      ciudad: ciudad.trim() || "Planadas"
    };

    // Add new record to database (NEVER OVERWRITES)
    let updatedDb: DatabaseState = {
      ...db,
      revisiones: [newRevisionRecord, ...db.revisiones]
    };

    // Log Event in EVENTOS (Sheet 13)
    const priority = checkKm.disminuyeKm ? "AMARILLA" : "VERDE";
    const eventDetail = checkKm.disminuyeKm 
      ? `REGISTRO DE REVISIÓN CON DISMINUCIÓN DE KM: Servido en ${numKm} KM (Máx previo: ${checkKm.maxHistoricoKm} KM). Justificación: "${kmJustification || "Autorizado por Admin"}"`
      : `Registro de nueva revisión técnica de servicio postventa (${finalRazon}) para la moto ${moto} (Motor: ${motor}, Chasis: ${chasis}).`;

    updatedDb = registrarEvento(
      updatedDb,
      user,
      "REVISIONES",
      "Registro de Servicio Postventa",
      priority,
      "Mantenimiento / KM",
      `${checkKm.maxHistoricoKm} KM`,
      `${numKm} KM`,
      eventDetail
    );

    setDb(updatedDb);

    // Reset form
    setShowNewForm(false);
    setKm("");
    setRazonCustom("");
    setKmJustification("");
    setKmWarningActive(false);

    alert(`✅ REVISIÓN Y SERVICIO REGISTRADO CON ÉXITO\n\nEl servicio de postventa para el vehículo Motor: ${motor} / Chasis: ${chasis} fue registrado en la base inmutable de REVISIONES y notificado al historial del cliente.`);
  };

  // Filter list
  const filteredList = db.revisiones.filter((r) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      !s ||
      r.motor?.toLowerCase().includes(s) ||
      r.chasis?.toLowerCase().includes(s) ||
      r.cedula?.includes(s) ||
      r.nombre?.toLowerCase().includes(s) ||
      r.apellidos?.toLowerCase().includes(s) ||
      r.placa?.toLowerCase().includes(s) ||
      r.razon?.toLowerCase().includes(s) ||
      r.moto?.toLowerCase().includes(s);

    const matchEstado = filterEstado === "TODOS" || r.estado === filterEstado;

    return matchSearch && matchEstado;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-red-600 rounded-2xl shadow-lg shadow-red-950/50 text-white">
            <Wrench size={26} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-red-950 text-red-300 px-2.5 py-0.5 rounded border border-red-800/50">
                DOCUMENTO MAESTRO ERP — REVISIONES
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                HOJA 8 (20 COLUMNAS)
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight mt-1">Historial de Servicio Postventa y Revisiones</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control inmutable de mantenimientos, garantías y revisiones técnicas de motocicletas
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md flex items-center space-x-2"
        >
          {showNewForm ? <RefreshCw size={16} /> : <Plus size={16} />}
          <span>{showNewForm ? "Ver Listado de Revisiones" : "Registrar Nueva Revisión"}</span>
        </button>
      </div>

      {/* NEW REVISION FORM */}
      {showNewForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Plus size={20} className="text-red-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Formulario de Servicio Postventa
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Relaciones: PERFIL CLIENTES | DATOS ACTAS | PERFIL MOTO
            </span>
          </div>

          {/* AUTO LOOKUP BAR */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              🔍 Recuperación Automática por Motor, Chasis o Cédula:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchLookup}
                onChange={(e) => setSearchLookup(e.target.value)}
                placeholder="Ingrese N° de Motor, Chasis o Cédula para autocompletar..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAutoLookup}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <Search size={14} />
                <span>Autocompletar</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitNewRevision} className="space-y-6">
            
            {/* MOTOCICLETA SECTION */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-100 pb-2">
                <Bike size={16} className="text-red-600" />
                <span>Datos de la Motocicleta (Identificación Natural: Motor + Chasis)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° MOTOR *</label>
                  <input
                    type="text"
                    required
                    value={motor}
                    onChange={(e) => setMotor(e.target.value.toUpperCase())}
                    placeholder="Ej: KC08E-12345"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° CHASIS *</label>
                  <input
                    type="text"
                    required
                    value={chasis}
                    onChange={(e) => setChasis(e.target.value.toUpperCase())}
                    placeholder="Ej: 3C1KC08E-98765"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">MOTOCICLETA / LÍNEA</label>
                  <input
                    type="text"
                    required
                    value={moto}
                    onChange={(e) => setMoto(e.target.value)}
                    placeholder="Ej: CB 125F DLX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">MODELO</label>
                  <input
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ej: 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">COLOR</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej: ROJO CÉDULA"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CILINDRAJE</label>
                  <input
                    type="text"
                    value={cilindraje}
                    onChange={(e) => setCilindraje(e.target.value)}
                    placeholder="Ej: 125 cc"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PLACA</label>
                  <input
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Ej: HND12G"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CIUDAD ATENCIÓN</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* CLIENTE SECTION */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-100 pb-2">
                <UserCheck size={16} className="text-red-600" />
                <span>Datos del Cliente (Llave Natural: Cédula / Documento)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CÉDULA / DOCUMENTO *</label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej: 10102030"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NOMBRES *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Carlos Mario"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">APELLIDOS *</label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej: Gómez Pérez"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">TELÉFONO / CELULAR</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 3101234567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">DIRECCIÓN</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle 5 # 4-20 Centro"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* SERVICE DETALS SECTION */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-100 pb-2">
                <Wrench size={16} className="text-red-600" />
                <span>Detalles del Servicio Realizado</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">KILOMETRAJE (KM) *</label>
                  <input
                    type="text"
                    required
                    value={km}
                    onChange={(e) => handleKmChange(e.target.value)}
                    placeholder="Ej: 2500"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">RAZÓN DE REVISIÓN</label>
                  <select
                    value={razonPreset}
                    onChange={(e) => setRazonPreset(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Primera revisión">Primera revisión</option>
                    <option value="Cambio de aceite">Cambio de aceite</option>
                    <option value="Garantía">Garantía</option>
                    <option value="Mantenimiento preventivo">Mantenimiento preventivo</option>
                    <option value="Revisión general">Revisión general</option>
                    <option value="Reparación">Reparación</option>
                    <option value="Diagnóstico">Diagnóstico</option>
                    <option value="Cambio de kit">Cambio de kit</option>
                    <option value="Cambio de llantas">Cambio de llantas</option>
                    <option value="Otro (Personalizada)">Otro (Personalizada)</option>
                  </select>
                </div>

                {razonPreset === "Otro (Personalizada)" && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ESPECIFIQUE RAZÓN</label>
                    <input
                      type="text"
                      required
                      value={razonCustom}
                      onChange={(e) => setRazonCustom(e.target.value)}
                      placeholder="Escriba motivo personalizado..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ESTADO DEL SERVICIO</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Realizada">Realizada</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Garantía">Garantía</option>
                    <option value="Reprogramada">Reprogramada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">MES DE CONTROL</label>
                  <input
                    type="text"
                    value={mes}
                    onChange={(e) => setMes(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">FECHA DE COMPRA</label>
                  <input
                    type="date"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">FECHA DE SERVICIO</label>
                  <input
                    type="date"
                    required
                    value={fechaServicio}
                    onChange={(e) => setFechaServicio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>

              {/* KM WARNING BOX (RULE 5) */}
              {kmWarningActive && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-extrabold">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <span>ALERTA REGLA 5 ERP: EL KILOMETRAJE INGRESADO ES INFERIOR AL REGISTRO MÁXIMO ANTERIOR ({maxKmHistorico} KM)</span>
                  </div>
                  <p className="text-amber-800">
                    {user.rol === "Administrador"
                      ? "Como Administrador puede autorizar esta disminución de kilometraje tras verificar la sustitución de velocímetro o ajuste técnico."
                      : "Como Asesor/Vendedor, el sistema requiere obligatoriamente una justificación para generar una alerta administrativa en EVENTOS."}
                  </p>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">JUSTIFICACIÓN DEL CAMBIO DE KM *</label>
                    <input
                      type="text"
                      required={user.rol !== "Administrador"}
                      value={kmJustification}
                      onChange={(e) => setKmJustification(e.target.value)}
                      placeholder="Ej: Cambio autorizado de guaya y tablero digital por garantía..."
                      className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Guardar Registro de Servicio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
        <div className="flex-1 w-full relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en historial de revisiones (Motor, Chasis, Cédula, Cliente, Placa)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="font-bold text-slate-500 uppercase text-[10px]">Filtrar Estado:</span>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Realizada">Realizada</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Garantía">Garantía</option>
            <option value="Reprogramada">Reprogramada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* REVISIONES TABLE (20 COLUMNS) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <History size={18} className="text-red-500" />
            <h3 className="font-black text-xs uppercase tracking-widest">
              Historial Completo de Mantenimientos e Inspecciones ({filteredList.length} registros)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            Fila 2: Títulos | Fila 3: Registros Inmutables
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3">KM</th>
                <th className="p-3">RAZÓN</th>
                <th className="p-3">MES</th>
                <th className="p-3">ESTADO</th>
                <th className="p-3">FECHA COMPRA</th>
                <th className="p-3">FECHA SERVICIO</th>
                <th className="p-3">NOMBRE</th>
                <th className="p-3">APELLIDOS</th>
                <th className="p-3">CÉDULA</th>
                <th className="p-3">CORREO</th>
                <th className="p-3">DIRECCIÓN</th>
                <th className="p-3">TELÉFONO</th>
                <th className="p-3">MOTO</th>
                <th className="p-3">MOTOR</th>
                <th className="p-3">CHASIS</th>
                <th className="p-3">MODELO</th>
                <th className="p-3">COLOR</th>
                <th className="p-3">CILINDRAJE</th>
                <th className="p-3">PLACA</th>
                <th className="p-3">CIUDAD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-[11px]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={20} className="p-8 text-center text-slate-400 italic">
                    No se encontraron registros de revisiones o servicios con el filtro especificado.
                  </td>
                </tr>
              ) : (
                filteredList.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-red-600">{r.km}</td>
                    <td className="p-3 font-semibold">{r.razon}</td>
                    <td className="p-3 font-semibold">{r.mes}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.estado === "Realizada" ? "bg-emerald-100 text-emerald-800" :
                        r.estado === "Pendiente" ? "bg-amber-100 text-amber-800" :
                        r.estado === "Garantía" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{r.fecha_compra || "N/A"}</td>
                    <td className="p-3 font-bold text-slate-900">{r.fecha_servicio}</td>
                    <td className="p-3 font-bold">{r.nombre}</td>
                    <td className="p-3 font-bold">{r.apellidos}</td>
                    <td className="p-3 font-mono text-slate-600">{r.cedula}</td>
                    <td className="p-3 text-slate-500">{r.correo || "N/A"}</td>
                    <td className="p-3 text-slate-500">{r.direccion || "N/A"}</td>
                    <td className="p-3 text-slate-600 font-mono">{r.telefono || "N/A"}</td>
                    <td className="p-3 font-bold text-slate-900">{r.moto}</td>
                    <td className="p-3 font-mono text-slate-700">{r.motor || "N/A"}</td>
                    <td className="p-3 font-mono text-slate-700">{r.chasis || "N/A"}</td>
                    <td className="p-3 text-slate-600">{r.modelo || "N/A"}</td>
                    <td className="p-3 text-slate-600">{r.color || "N/A"}</td>
                    <td className="p-3 text-slate-600">{r.cilindraje || "N/A"}</td>
                    <td className="p-3 font-bold font-mono text-red-700">{r.placa || "SIN PLACA"}</td>
                    <td className="p-3 text-slate-600">{r.ciudad || "Planadas"}</td>
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
