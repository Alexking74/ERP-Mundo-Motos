import React, { useState, useEffect } from "react";
import { User, Phone, Mail, MapPin, X, CheckCircle2, Search, Plus, Edit2, ShieldCheck } from "lucide-react";
import { DatabaseState, ClientePerfil, Usuario } from "../types";
import { getTodayDateString } from "../utils/db";

interface ModalCrearClienteProps {
  isOpen: boolean;
  onClose: () => void;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
  user: Usuario;
  onSelectClient: (cliente: {
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    telefono_principal: string;
    telefono_secundario: string;
    correo_electronico: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    autorizacion_contacto: "SI" | "NO";
  }) => void;
  initialDocumento?: string;
}

export default function ModalCrearCliente({
  isOpen,
  onClose,
  db,
  setDb,
  user,
  onSelectClient,
  initialDocumento = ""
}: ModalCrearClienteProps) {
  const [searchTerm, setSearchTerm] = useState(initialDocumento);
  const [isNewProfile, setIsNewProfile] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [tipoDoc, setTipoDoc] = useState("CC");
  const [numDoc, setNumDoc] = useState(initialDocumento);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telPrincipal, setTelPrincipal] = useState("");
  const [telSecundario, setTelSecundario] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("Planadas");
  const [departamento, setDepartamento] = useState("Tolima");
  const [autorizacion, setAutorizacion] = useState<"SI" | "NO">("SI");

  // Sync initial Document input if passed
  useEffect(() => {
    if (initialDocumento) {
      setNumDoc(initialDocumento);
      setSearchTerm(initialDocumento);
      checkAndAutofill(initialDocumento);
    }
  }, [initialDocumento]);

  if (!isOpen) return null;

  // Check if client document exists in DB and autofill
  const checkAndAutofill = (docToSearch: string) => {
    const cleanDoc = docToSearch.trim();
    if (!cleanDoc) return;

    const existingInPerfil = (db.clientes_perfil || []).find(
      (c) => c.numero_documento.trim() === cleanDoc
    );

    if (existingInPerfil) {
      setTipoDoc(existingInPerfil.tipo_documento || "CC");
      setNumDoc(existingInPerfil.numero_documento);
      setNombres(existingInPerfil.nombres);
      setApellidos(existingInPerfil.apellidos);
      setTelPrincipal(existingInPerfil.telefono_principal || "");
      setTelSecundario(existingInPerfil.telefono_secundario || "");
      setCorreo(existingInPerfil.correo_electronico || "");
      setDireccion(existingInPerfil.direccion || "");
      setCiudad(existingInPerfil.ciudad || "Planadas");
      setDepartamento(existingInPerfil.departamento || "Tolima");
      setAutorizacion(existingInPerfil.autorizacion_contacto || "SI");
      setIsNewProfile(false);
      setSuccessMsg("Cliente encontrado en base de datos. Se han cargado sus datos para actualizar o usar.");
      return;
    }

    // Fallback search in Actas or Preventas
    const existingActa = db.actas.find((a) => a.documento.trim() === cleanDoc);
    if (existingActa) {
      setTipoDoc(existingActa.tipo_documento || "CC");
      setNumDoc(existingActa.documento);
      setNombres(existingActa.nombres);
      setApellidos(existingActa.apellidos);
      setTelPrincipal(existingActa.telefono);
      setTelSecundario(existingActa.telefono_2 || "");
      setCorreo(existingActa.correo || "");
      setDireccion(existingActa.direccion || "");
      setIsNewProfile(true);
      setSuccessMsg("Cliente ubicado desde expedientes anteriores. Puede formalizar su Perfil Completo.");
      return;
    }

    const existingPreventa = db.preventas.find((p) => p.cedula.trim() === cleanDoc);
    if (existingPreventa) {
      setTipoDoc("CC");
      setNumDoc(existingPreventa.cedula);
      setNombres(existingPreventa.nombre);
      setApellidos(existingPreventa.apellido);
      setTelPrincipal(existingPreventa.telefono);
      setCorreo(existingPreventa.correo || "");
      setDireccion(existingPreventa.direccion || "");
      setIsNewProfile(true);
      setSuccessMsg("Cliente ubicado desde Pre-ventas. Puede formalizar su Perfil Completo.");
      return;
    }

    setIsNewProfile(true);
    setSuccessMsg("");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkAndAutofill(searchTerm);
  };

  const handleSaveAndSelect = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numDoc.trim()) {
      alert("El Número de Documento es obligatorio.");
      return;
    }
    if (!nombres.trim() || !apellidos.trim()) {
      alert("Los Nombres y Apellidos son obligatorios.");
      return;
    }

    const today = getTodayDateString();
    const currentClientes = db.clientes_perfil || [];

    const existingIdx = currentClientes.findIndex(
      (c) => c.numero_documento.trim() === numDoc.trim()
    );

    let updatedClientes = [...currentClientes];

    if (existingIdx >= 0) {
      // UPDATE existing client profile without creating duplicate
      updatedClientes[existingIdx] = {
        ...updatedClientes[existingIdx],
        tipo_documento: tipoDoc,
        numero_documento: numDoc.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono_principal: telPrincipal.trim(),
        telefono_secundario: telSecundario.trim(),
        correo_electronico: correo.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
        autorizacion_contacto: autorizacion,
        ultima_actualizacion: today,
        usuario_ultima_actualizacion: user.usuario || user.nombre_completo
      };
    } else {
      // CREATE new client profile
      const newPerfil: ClientePerfil = {
        tipo_documento: tipoDoc,
        numero_documento: numDoc.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono_principal: telPrincipal.trim(),
        telefono_secundario: telSecundario.trim(),
        correo_electronico: correo.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
        fecha_registro: today,
        ultima_actualizacion: today,
        estado: "ACTIVO",
        observaciones: "Registrado desde módulo de ventas",
        usuario_que_registra: user.usuario || user.nombre_completo,
        usuario_ultima_actualizacion: user.usuario || user.nombre_completo,
        autorizacion_contacto: autorizacion
      };
      updatedClientes.unshift(newPerfil);
    }

    // Update global db state
    setDb({
      ...db,
      clientes_perfil: updatedClientes
    });

    // Callback to parent form
    onSelectClient({
      tipo_documento: tipoDoc,
      numero_documento: numDoc.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      telefono_principal: telPrincipal.trim(),
      telefono_secundario: telSecundario.trim(),
      correo_electronico: correo.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      departamento: departamento.trim(),
      autorizacion_contacto: autorizacion
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 my-auto space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Gestión & Registro de Cliente
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Consulte por documento o cree/actualice el expediente en Perfil Clientes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Document Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por N.º de Documento (Cédula/NIT)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-slate-900 font-bold border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={() => checkAndAutofill(searchTerm)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center space-x-1"
          >
            <span>Buscar Documento</span>
          </button>
        </form>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Client Form */}
        <form onSubmit={handleSaveAndSelect} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Tipo de Documento *
              </label>
              <select
                value={tipoDoc}
                onChange={(e) => setTipoDoc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              >
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="NIT">NIT Empresa</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="PEP">Permiso Especial (PEP)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                N.º Documento (Identificador Principal) *
              </label>
              <input
                type="text"
                required
                value={numDoc}
                onChange={(e) => {
                  setNumDoc(e.target.value);
                  checkAndAutofill(e.target.value);
                }}
                placeholder="Ej: 1110543987"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Nombres *
              </label>
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej: Carlos Alberto"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Ej: Rodríguez Gómez"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Teléfono / Celular Principal *
              </label>
              <input
                type="text"
                required
                value={telPrincipal}
                onChange={(e) => setTelPrincipal(e.target.value)}
                placeholder="Ej: 3124567890"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Teléfono Secundario
              </label>
              <input
                type="text"
                value={telSecundario}
                onChange={(e) => setTelSecundario(e.target.value)}
                placeholder="Ej: 3189876543"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Dirección Residencial / Comercial
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Cra 5 # 10-20 Barrio Centro"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Ciudad / Municipio
              </label>
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej: Planadas"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ej: Tolima"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-800">
                Autorización de Tratamiento de Datos y Contacto
              </span>
            </div>
            <select
              value={autorizacion}
              onChange={(e) => setAutorizacion(e.target.value as "SI" | "NO")}
              className="bg-white border border-slate-300 text-xs font-black p-1.5 rounded-lg text-slate-900"
            >
              <option value="SI">SÍ AUTORIZA</option>
              <option value="NO">NO AUTORIZA</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isNewProfile ? "Guardar & Seleccionar Cliente" : "Actualizar & Seleccionar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
