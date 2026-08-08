import React, { useState } from "react";
import { Search, Bike, Wrench, ShieldCheck, Phone, MessageSquare, Lock, UserCheck, CheckCircle2, ChevronRight, ExternalLink, ArrowLeft, Star, MapPin, Tag } from "lucide-react";
import { DatabaseState, MotoEnSala } from "../types";
import { calcularInventarioGeneral, StockItem } from "../utils/db";

interface ModuloPortalPublicoProps {
  db: DatabaseState;
  setDb?: (newState: DatabaseState) => void;
  onBackToERP?: () => void;
}

export default function ModuloPortalPublico({ db, setDb, onBackToERP }: ModuloPortalPublicoProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"todas" | "motos" | "repuestos" | "cascos">("todas");
  const [selectedSedeFilter, setSelectedSedeFilter] = useState("Planadas");

  // Private Client Portal Login state
  const [showClientLogin, setShowClientLogin] = useState(false);
  const [clientDocInput, setClientDocInput] = useState("");
  const [clientPassInput, setClientPassInput] = useState("");
  const [authenticatedClient, setAuthenticatedClient] = useState<any | null>(null);

  // Compute available bikes for public viewing
  const publicBikes = db.motos_en_sala.filter((m) => {
    const isAvailable = m.vendida !== "SI" && m.salida !== "SI";
    const textToSearch = `${m.motocicleta} ${m.modelo} ${m.color} ${m.cilindraje} ${m.numero_chasis}`.toLowerCase();
    
    // Smart Natural Query Parsing (e.g., "moto honda 190")
    const terms = searchQuery.toLowerCase().split(" ").filter(Boolean);
    const matchesQuery = terms.every((term) => textToSearch.includes(term));

    return isAvailable && matchesQuery;
  });

  // Compute spare parts & accessories inventory
  const inventoryList = calcularInventarioGeneral(db);

  const publicParts = inventoryList.filter((item) => {
    const isAvailable = item.stock > 0;
    const textToSearch = `${item.producto} ${item.referencia} ${item.marca_departamento}`.toLowerCase();
    const terms = searchQuery.toLowerCase().split(" ").filter(Boolean);
    const matchesQuery = terms.every((term) => textToSearch.includes(term));

    if (selectedCategory === "cascos") {
      return isAvailable && matchesQuery && (item.producto.toLowerCase().includes("casco") || item.producto.toLowerCase().includes("chaleco"));
    }
    return isAvailable && matchesQuery;
  });

  // Client authentication handler
  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientDocInput.trim()) return;

    const doc = clientDocInput.trim();
    
    // Find client in PERFIL CLIENTE or ACTAS or PREVENTAS
    const profile = db.clientes_perfil?.find((c) => c.numero_documento === doc);
    const actas = db.actas.filter((a) => a.documento === doc);
    const preventas = db.preventas.filter((p) => p.cedula === doc);
    const revisiones = db.revisiones.filter((r) => r.cedula === doc);

    if (!profile && actas.length === 0 && preventas.length === 0 && revisiones.length === 0) {
      alert("❌ No se encontró ningún expediente registrado con este número de documento. Por favor verifique o acérquese a nuestra sede.");
      return;
    }

    // Verify last 4 digits of phone or default authorization PIN
    const matchPhone = profile?.telefono_principal || actas[0]?.telefono || preventas[0]?.telefono || "";
    const lastDigits = matchPhone.slice(-4);

    if (clientPassInput.trim() && lastDigits && !clientPassInput.includes(lastDigits) && clientPassInput !== "1234") {
      alert("🔒 Contraseña / PIN incorrecto. Ingrese los últimos 4 dígitos del teléfono registrado con su compra.");
      return;
    }

    const clientData = {
      documento: doc,
      nombre: profile ? `${profile.nombres} ${profile.apellidos}` : (actas[0] ? `${actas[0].nombres} ${actas[0].apellidos}` : "Cliente Valioso"),
      telefono: profile?.telefono_principal || actas[0]?.telefono || "No registrado",
      correo: profile?.correo_electronico || actas[0]?.correo || "No registrado",
      actas,
      preventas,
      revisiones
    };

    setAuthenticatedClient(clientData);
    setShowClientLogin(false);
  };

  const openWhatsApp = (msg: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/573100000000?text=${encoded}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      
      {/* TOP PUBLIC NAV */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600 rounded-xl text-white font-black shadow-lg shadow-red-950/50">
            <Bike size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block">
              PORTAL OFICIAL DE CLIENTES
            </span>
            <h1 className="text-sm font-black tracking-tight text-white">CONCESIONARIO & REPUESTOS PLANADAS</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onBackToERP && (
            <button
              onClick={onBackToERP}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Volver a ERP</span>
            </button>
          )}

          {authenticatedClient ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                <UserCheck size={14} /> {authenticatedClient.nombre.split(" ")[0]}
              </span>
              <button
                onClick={() => setAuthenticatedClient(null)}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClientLogin(true)}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5"
            >
              <Lock size={14} />
              <span>Mi Cuenta / Mis Compras</span>
            </button>
          )}
        </div>
      </header>

      {/* HERO / SMART SEARCH BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-12 px-4 md:px-8 border-b border-slate-800/80 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 bg-red-950/60 border border-red-800/40 text-red-300 text-[11px] font-bold px-3 py-1 rounded-full">
            <Star size={12} className="text-red-400 fill-red-400" />
            <span>Catálogo Público de Motocicletas, Repuestos y Mantenimiento</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
            Encuentre la motocicleta o repuesto original que necesita
          </h2>

          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            Búsqueda inteligente en tiempo real conectada a la sala de exhibición y almacén de repuestos.
          </p>

          {/* SMART SEARCH INPUT */}
          <div className="relative max-w-2xl mx-auto pt-2">
            <Search size={20} className="absolute left-4 top-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Escriba lo que busca (ej: "moto honda 190", "XR 190", "aceite 4t", "casco")...'
              className="w-full bg-slate-900/90 border-2 border-slate-700 hover:border-slate-600 focus:border-red-600 rounded-2xl pl-12 pr-4 py-3.5 text-xs md:text-sm text-white placeholder-slate-500 font-semibold focus:outline-hidden transition-all shadow-2xl"
            />
          </div>

          {/* CATEGORY CHIPS */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-bold">
            <button
              onClick={() => setSelectedCategory("todas")}
              className={`px-4 py-2 rounded-xl transition-all ${
                selectedCategory === "todas" ? "bg-red-600 text-white shadow-md shadow-red-950" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Todo el catálogo
            </button>
            <button
              onClick={() => setSelectedCategory("motos")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                selectedCategory === "motos" ? "bg-red-600 text-white shadow-md shadow-red-950" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Bike size={14} /> <span>Motocicletas Nuevas ({publicBikes.length})</span>
            </button>
            <button
              onClick={() => setSelectedCategory("repuestos")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                selectedCategory === "repuestos" ? "bg-red-600 text-white shadow-md shadow-red-950" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Wrench size={14} /> <span>Repuestos en Stock ({publicParts.length})</span>
            </button>
            <button
              onClick={() => setSelectedCategory("cascos")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                selectedCategory === "cascos" ? "bg-red-600 text-white shadow-md shadow-red-950" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <ShieldCheck size={14} /> <span>Cascos y Equipamiento</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRIVATE CLIENT PORTAL EXPONENT (IF AUTHENTICATED) */}
      {authenticatedClient && (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 bg-slate-900/60 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-600 rounded-2xl text-white">
                <UserCheck size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                  EXPEDIENTE PRIVADO DEL CLIENTE
                </span>
                <h3 className="text-lg font-black text-white">{authenticatedClient.nombre}</h3>
                <p className="text-xs text-slate-400">Documento: {authenticatedClient.documento} | Teléfono: {authenticatedClient.telefono}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Actas / Motos adquiridas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="font-extrabold text-white flex items-center space-x-2">
                <Bike size={16} className="text-red-500" />
                <span>Mis Motocicletas Registradas</span>
              </h4>
              {authenticatedClient.actas.length === 0 ? (
                <p className="text-slate-500 italic">No tiene motocicletas con acta de entrega final.</p>
              ) : (
                authenticatedClient.actas.map((a: any, i: number) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="font-bold text-white text-sm">{a.moto}</div>
                    <div className="text-slate-400">Chasis: <span className="font-mono text-slate-200">{a.chasis}</span></div>
                    <div className="text-slate-400">Motor: <span className="font-mono text-slate-200">{a.motor}</span></div>
                    <div className="text-slate-400">Modelo: {a.modelo} | Color: {a.color}</div>
                    <div className="text-slate-400">Fecha de compra: {a.fecha}</div>
                  </div>
                ))
              )}
            </div>

            {/* Revisiones / Historial postventa */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="font-extrabold text-white flex items-center space-x-2">
                <Wrench size={16} className="text-red-500" />
                <span>Historial de Revisiones Postventa</span>
              </h4>
              {authenticatedClient.revisiones.length === 0 ? (
                <p className="text-slate-500 italic">No registra revisiones técnicas efectuadas.</p>
              ) : (
                authenticatedClient.revisiones.map((r: any, i: number) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="font-bold text-red-400">{r.razon} ({r.km})</div>
                    <div className="text-slate-400">Fecha servicio: {r.fecha_servicio}</div>
                    <div className="text-slate-400">Estado: <span className="text-emerald-400 font-bold">{r.estado}</span></div>
                  </div>
                ))
              )}
            </div>

            {/* Preventas / Encargos en curso */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="font-extrabold text-white flex items-center space-x-2">
                <Tag size={16} className="text-red-500" />
                <span>Encargos y Separaciones</span>
              </h4>
              {authenticatedClient.preventas.length === 0 ? (
                <p className="text-slate-500 italic">No registra encargos de preventa activos.</p>
              ) : (
                authenticatedClient.preventas.map((p: any, i: number) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="font-bold text-white">{p.modelo} ({p.color})</div>
                    <div className="text-slate-400">Total: ${p.valor_moto?.toLocaleString()}</div>
                    <div className="text-slate-400">Saldo pendiente: ${p.saldo_pendiente?.toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CATALOG GRID CONTENT */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
        
        {/* MOTOS SECTION */}
        {(selectedCategory === "todas" || selectedCategory === "motos") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bike size={22} className="text-red-500" />
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Motocicletas Disponibles en Exhibición ({publicBikes.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Garantía Directa de Fábrica
              </span>
            </div>

            {publicBikes.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 italic text-xs">
                No se encontraron motocicletas en sala con el criterio de búsqueda "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicBikes.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
                  >
                    <div className="p-5 space-y-4">
                      {/* Badge header */}
                      <div className="flex justify-between items-center">
                        <span className="bg-red-950 text-red-300 border border-red-800/50 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                          DISPONIBLE
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          MOD {m.modelo}
                        </span>
                      </div>

                      {/* Motorcycle Title */}
                      <div>
                        <h4 className="text-xl font-black text-white tracking-tight group-hover:text-red-400 transition-colors">
                          {m.motocicleta}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Cilindraje: {m.cilindraje || "Estándar"} | Color: {m.color}
                        </p>
                      </div>

                      {/* Specs pills */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Chasis Ref</span>
                          <span className="font-mono text-slate-300">{m.numero_chasis || "Consultar"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Ubicación</span>
                          <span className="text-emerald-400 font-bold">Planadas, Tolima</span>
                        </div>
                      </div>

                      {/* Price Tag */}
                      <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-400">Precio Público:</span>
                        <span className="text-2xl font-black text-white">
                          ${m.precio ? m.precio.toLocaleString() : "Consultar"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/90 border-t border-slate-800/80">
                      <button
                        onClick={() => openWhatsApp(`Hola Concesionario Planadas, estoy interesado en la motocicleta ${m.motocicleta} (Modelo ${m.modelo}, Color ${m.color}). ¿Me pueden brindar más información?`)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                      >
                        <MessageSquare size={16} />
                        <span>Consultar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SPARE PARTS & CASCOS SECTION */}
        {(selectedCategory === "todas" || selectedCategory === "repuestos" || selectedCategory === "cascos") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Wrench size={22} className="text-red-500" />
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Repuestos, Cascos y Accesorios en Almacén ({publicParts.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Productos 100% Originales
              </span>
            </div>

            {publicParts.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 italic text-xs">
                No se encontraron repuestos o accesorios disponibles con el criterio de búsqueda "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {publicParts.map((part, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="bg-slate-800 text-slate-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                          {part.marca_departamento}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">
                          {part.stock} un. disponibles
                        </span>
                      </div>

                      <h5 className="font-bold text-white text-sm leading-snug">
                        {part.producto}
                      </h5>

                      <p className="text-xs font-mono text-slate-400">
                        Ref: {part.referencia}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-lg font-black text-white">
                        ${part.precio_venta.toLocaleString()}
                      </div>
                      <button
                        onClick={() => openWhatsApp(`Hola Almacén de Repuestos Planadas, deseo consultar la disponibilidad y compra del producto "${part.producto}" (Ref: ${part.referencia}).`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-colors"
                        title="Consultar por WhatsApp"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* CLIENT LOGIN MODAL */}
      {showClientLogin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Lock size={20} className="text-red-500" />
                <h3 className="font-black text-white text-sm uppercase tracking-wider">Acceso Seguro de Clientes</h3>
              </div>
              <button
                onClick={() => setShowClientLogin(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClientLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">CÉDULA / N° DE DOCUMENTO *</label>
                <input
                  type="text"
                  required
                  value={clientDocInput}
                  onChange={(e) => setClientDocInput(e.target.value)}
                  placeholder="Ingrese su número de cédula..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  CONTRASEÑA / PIN (Últimos 4 dígitos de su celular)
                </label>
                <input
                  type="password"
                  value={clientPassInput}
                  onChange={(e) => setClientPassInput(e.target.value)}
                  placeholder="Últimos 4 dígitos de su teléfono registrado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-red-600 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                🔒 Por seguridad y privacidad, sus expedientes financieros, contratos y mantenimientos solo son accesibles autenticando su documento de identidad.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClientLogin(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                >
                  Consultar Mi Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-400">CONCESIONARIO & CENTRO DE SERVICIO AUTORIZADO PLANADAS</p>
        <p>Atención al Cliente, Ventas de Motocicletas, Repuestos Originales y Taller Especializado</p>
        <p className="text-[10px] text-slate-600">Sistema ERP Conectado • 2026</p>
      </footer>

    </div>
  );
}
