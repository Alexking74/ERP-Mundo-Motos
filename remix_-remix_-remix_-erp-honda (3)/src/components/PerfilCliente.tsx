import React, { useState } from "react";
import { 
  User, Phone, Mail, MapPin, ChevronLeft, ShoppingBag, Calendar, 
  Wrench, Package, Search, Award, FileText, TrendingUp, RefreshCw 
} from "lucide-react";
import { DatabaseState } from "../types";

interface PerfilClienteProps {
  clientId: string;
  db: DatabaseState;
  onBack: () => void;
}

export default function PerfilCliente({ clientId, db, onBack }: PerfilClienteProps) {
  const [activeClientId, setActiveClientId] = useState<string>(clientId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [profileTab, setProfileTab] = useState<"compras" | "preventas" | "matriculas" | "estudios" | "revisiones" | "movimientos">("compras");

  // Helper to extract unique clients from database (both Actas and Preventas)
  const getUniqueClientsDirectory = () => {
    const clientsMap: { [key: string]: { doc: string; name: string; lastName: string; phone: string; email: string; source: string } } = {};

    // 1. Process from Actas
    db.actas.forEach((a) => {
      const doc = a.documento.trim();
      if (doc && !clientsMap[doc]) {
        clientsMap[doc] = {
          doc,
          name: a.nombres.trim(),
          lastName: a.apellidos.trim(),
          phone: a.telefono.trim(),
          email: a.correo.trim(),
          source: "Compra Moto"
        };
      }
    });

    // 2. Process from Preventas
    db.preventas.forEach((p) => {
      const doc = p.cedula.trim();
      if (doc && !clientsMap[doc]) {
        clientsMap[doc] = {
          doc,
          name: p.nombre.trim(),
          lastName: p.apellido.trim(),
          phone: p.telefono.trim(),
          email: p.correo.trim(),
          source: "Pre-venta / Reserva"
        };
      }
    });

    return Object.values(clientsMap);
  };

  const directory = getUniqueClientsDirectory();

  // Filter directory based on search term
  const filteredDirectory = directory.filter((c) => {
    const fullSearch = `${c.name} ${c.lastName} ${c.doc} ${c.phone}`.toLowerCase();
    return fullSearch.includes(searchTerm.toLowerCase());
  });

  // -------------------------
  // DIRECTORY MODE (NO CLIENT SELECTED)
  // -------------------------
  if (!activeClientId) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Directorio Consolidado de Clientes</h2>
            <p className="text-xs text-slate-500 mt-1">
              Consulte el expediente histórico completo (Ventas, Pre-ventas, Mantenimientos en Taller y Repuestos de Garantía) de cada cliente.
            </p>
          </div>
          <button
            onClick={onBack}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 px-4 rounded-lg transition-colors self-start sm:self-center"
          >
            Volver al Escritorio
          </button>
        </div>

        {/* Directory Search */}
        <div className="relative w-full max-w-md mb-6">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar cliente por nombre, apellido, cédula, celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.length > 0 ? (
            filteredDirectory.map((c) => {
              const purchasesCount = db.actas.filter(a => a.documento === c.doc).length;
              const reservesCount = db.preventas.filter(p => p.cedula === c.doc).length;

              return (
                <div 
                  key={c.doc}
                  className="bg-slate-50 border hover:border-red-200 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="bg-red-50 text-red-600 p-2 rounded-lg">
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{c.name} {c.lastName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">CC {c.doc}</span>
                        </div>
                      </div>
                      <span className="bg-slate-200 text-slate-700 font-bold text-[8px] px-1.5 py-0.5 rounded uppercase">
                        {c.source}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <Phone size={11} className="text-slate-400" />
                        <span>{c.phone || "No registrado"}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Mail size={11} className="text-slate-400" />
                        <span className="truncate">{c.email || "No registrado"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                    <div className="flex space-x-2 text-slate-400 text-[10px] font-bold">
                      <span className="bg-white border px-1.5 py-0.5 rounded text-slate-700">🛒 {purchasesCount} Compras</span>
                      <span className="bg-white border px-1.5 py-0.5 rounded text-slate-700">📋 {reservesCount} Reservas</span>
                    </div>
                    <button
                      onClick={() => setActiveClientId(c.doc)}
                      className="text-red-600 hover:text-red-700 font-bold hover:underline"
                    >
                      Ver Expediente →
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-50 border border-dashed rounded-xl">
              <p className="text-sm text-slate-400">No se encontraron clientes registrados que coincidan con los filtros.</p>
            </div>
          )}
        </div>

      </div>
    );
  }

  // -------------------------
  // CONSOLIDATED EXPEDIENT VIEW MODE
  // -------------------------
  // Find all matches across sheets
  const actas = db.actas.filter((a) => a.documento === activeClientId);
  const preventas = db.preventas.filter((p) => p.cedula === activeClientId);
  const revisiones = db.revisiones.filter((r) => r.cedula === activeClientId);
  const solicitados = db.repuestos_solicitados.filter((s) => s.documento === activeClientId);
  const matriculas = db.matriculas.filter((m) => m.documento === activeClientId);
  const estudios = db.referencias_estudios.filter((e) => e.documento === activeClientId);

  // Determine basic info from any matching record
  const primaryName = actas[0]?.nombres || preventas[0]?.nombre || revisiones[0]?.nombre || "Cliente";
  const primaryLastName = actas[0]?.apellidos || preventas[0]?.apellido || revisiones[0]?.apellidos || "";
  const primaryEmail = actas[0]?.correo || preventas[0]?.correo || revisiones[0]?.correo || "No registrado";
  const primaryPhone = actas[0]?.telefono || preventas[0]?.telefono || revisiones[0]?.telefono || "No registrado";
  const primaryAddress = actas[0]?.direccion || preventas[0]?.direccion || revisiones[0]?.direccion || "No registrado";

  // Consolidate receipts matching client name or CC
  const matchingRecibos = db.recibos.filter((r) => {
    const belongsToMatch = r.recibo_de_pertenencia.toLowerCase().includes(primaryName.toLowerCase()) || 
                          r.recibo_de_pertenencia.toLowerCase().includes(primaryLastName.toLowerCase()) ||
                          r.recibo_de_pertenencia.toLowerCase().includes(activeClientId);
    const conceptMatch = r.concepto.toLowerCase().includes(activeClientId) || 
                         r.concepto.toLowerCase().includes(primaryName.toLowerCase());
    return belongsToMatch || conceptMatch;
  });

  const totalSpent = actas.reduce((acc, curr) => acc + curr.valor_moto, 0);
  const totalDebt = actas.reduce((acc, curr) => acc + curr.deuda_actual, 0);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in font-sans">
      
      {/* Back button and profile header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (clientId) {
                onBack(); // Go back to Escritorio
              } else {
                setActiveClientId(""); // Go back to Directory List
              }
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
          >
            <ChevronLeft size={16} />
            <span>{clientId ? "Volver al Escritorio" : "Volver al Directorio"}</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Perfil Consolidado del Cliente</span>
        </div>
        {!clientId && (
          <button
            onClick={() => setActiveClientId("")}
            className="text-xs text-red-600 hover:underline font-bold"
          >
            Buscar otro cliente
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Contact Card & KPI */}
        <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
          <div className="flex items-center space-x-3.5">
            <div className="bg-red-600 text-white p-3 rounded-full shadow-md">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">{primaryName} {primaryLastName}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Identificación: CC {activeClientId}</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs font-semibold text-slate-600 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Phone size={14} className="text-slate-400" />
              <span>{primaryPhone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={14} className="text-slate-400" />
              <span>{primaryEmail}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={14} className="text-slate-400" />
              <span>{primaryAddress}</span>
            </div>
          </div>

          {/* Financial KPI */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Motos Adquiridas</span>
              <span className="font-black text-slate-800 font-mono text-base">{actas.length}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Cartera</span>
              <span className={`font-black font-mono text-base ${totalDebt > 0 ? "text-red-600" : "text-green-600"}`}>
                ${totalDebt.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Tabular summary grids of actions */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Sub-tabs inside client file */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-1 pb-px scrollbar-none">
            <button
              onClick={() => setProfileTab("compras")}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap border-b-2 transition-all ${
                profileTab === "compras" ? "border-red-600 text-red-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🛒 Compras ({actas.length})
            </button>
            <button
              onClick={() => setProfileTab("preventas")}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap border-b-2 transition-all ${
                profileTab === "preventas" ? "border-red-600 text-red-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📋 Pre-ventas ({preventas.length})
            </button>
            <button
              onClick={() => setProfileTab("matriculas")}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap border-b-2 transition-all ${
                profileTab === "matriculas" ? "border-red-600 text-red-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📝 Matrículas ({matriculas.length})
            </button>
            <button
              onClick={() => setProfileTab("estudios")}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap border-b-2 transition-all ${
                profileTab === "estudios" ? "border-red-600 text-red-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              💳 Estudios Crédito ({estudios.length})
            </button>
            <button
              onClick={() => setProfileTab("revisiones")}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap border-b-2 transition-all ${
                profileTab === "revisiones" ? "border-red-600 text-red-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🔧 Taller/Revisiones ({revisiones.length})
            </button>
            <button
              onClick={() => setProfileTab("movimientos")}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap border-b-2 transition-all ${
                profileTab === "movimientos" ? "border-red-600 text-red-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              💰 Historial de Caja ({matchingRecibos.length})
            </button>
          </div>

          {/* TAB CONTENT: COMPRAS DE MOTOS & REPUESTOS */}
          {profileTab === "compras" && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                  <ShoppingBag size={14} className="text-red-500" />
                  <span>Motos Compradas (Actas de Entrega)</span>
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  {actas.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Acta No.</th>
                          <th className="p-3">Vehículo</th>
                          <th className="p-3">Chasis</th>
                          <th className="p-3 text-right">Valor Moto</th>
                          <th className="p-3 text-right">Saldo Deuda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {actas.map((a, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-500">{a.fecha}</td>
                            <td className="p-3 font-mono font-bold text-red-600">#{a.acta}</td>
                            <td className="p-3 font-semibold">{a.moto}</td>
                            <td className="p-3 font-mono">{a.chasis}</td>
                            <td className="p-3 text-right font-mono">${a.valor_moto.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-red-600">${a.deuda_actual.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed rounded-lg">No registra compras completas de vehículos.</p>
                  )}
                </div>
              </div>

              {/* Repuestos solicitados / apartados */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                  <Package size={14} className="text-red-500" />
                  <span>Apartado de Repuestos y Accesorios Especiales</span>
                </h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  {solicitados.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                          <th className="p-3">Fecha Solicitud</th>
                          <th className="p-3">Repuesto / Producto</th>
                          <th className="p-3">Referencia</th>
                          <th className="p-3 text-right">Valor Total</th>
                          <th className="p-3 text-right">Abonado</th>
                          <th className="p-3 text-center">Estado Entrega</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {solicitados.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-500">{s.fecha}</td>
                            <td className="p-3 font-semibold">{s.producto}</td>
                            <td className="p-3 font-mono">{s.referencia}</td>
                            <td className="p-3 text-right font-mono">${s.valor.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-green-600">${(s.abono_efectivo + s.abono_transferencia).toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                s.estado === "ENTREGADO" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {s.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed rounded-lg">No registra solicitud de repuestos especiales.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PRE-VENTAS */}
          {profileTab === "preventas" && (
            <div className="space-y-2 animate-fade-in">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <Calendar size={14} className="text-red-500" />
                <span>Encargos y Reservas Previas (Preventas)</span>
              </h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                {preventas.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                        <th className="p-3">Fecha Reserva</th>
                        <th className="p-3">Cód Encargo</th>
                        <th className="p-3">Vehículo</th>
                        <th className="p-3 text-right">Valor Negociado</th>
                        <th className="p-3 text-right text-green-600">Abono Total</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {preventas.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{p.fecha_de_inicio}</td>
                          <td className="p-3 font-mono text-slate-500">#{p.id_del_encargo}</td>
                          <td className="p-3 font-semibold">{p.modelo} {p.color}</td>
                          <td className="p-3 text-right font-mono">${p.precio_moto.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-green-600">${p.total_abono.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              p.estado === "ACTIVA" ? "bg-yellow-100 text-yellow-700" :
                              p.estado === "FINALIZADA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {p.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed rounded-lg">No registra pedidos o pre-ventas previas.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: MATRICULAS */}
          {profileTab === "matriculas" && (
            <div className="space-y-2 animate-fade-in">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <FileText size={14} className="text-red-500" />
                <span>Trámites de Matrícula y Documentación de Tránsito</span>
              </h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                {matriculas.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                        <th className="p-3">Fecha Registro</th>
                        <th className="p-3">Motocicleta</th>
                        <th className="p-3">Chasis</th>
                        <th className="p-3">Organismo Tránsito</th>
                        <th className="p-3 text-right">Valor Trámite</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {matriculas.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{m.fecha}</td>
                          <td className="p-3 font-semibold">{m.motocicleta} ({m.modelo})</td>
                          <td className="p-3 font-mono">{m.chasis}</td>
                          <td className="p-3">{m.transito || "Por Definir"}</td>
                          <td className="p-3 text-right font-mono">${m.valor.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              m.estado === "Finalizado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {m.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed rounded-lg">No registra trámites de matrícula activos ni completados.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: ESTUDIOS CREDITO */}
          {profileTab === "estudios" && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <TrendingUp size={14} className="text-red-500" />
                <span>Estudios de Crédito & Referencias del Cliente</span>
              </h4>
              {estudios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {estudios.map((est, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-red-600">Estudio #{est.no}</span>
                        <span className="bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                          Plataforma: {est.plataforma || "Sufi / Aliado Cred"}
                        </span>
                      </div>
                      <div className="space-y-2 text-slate-600">
                        <div>
                          <p className="font-bold text-slate-800 mb-0.5">Referencia Personal 1:</p>
                          <p className="font-medium text-[11px]">{est.nombre_referencia_1} - Cel: {est.telefono_1}</p>
                          <p className="text-[10px] text-slate-400">{est.direccion_1} ({est.barrio_1})</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <p className="font-bold text-slate-800 mb-0.5">Referencia Personal 2:</p>
                          <p className="font-medium text-[11px]">{est.nombre_referencia_2} - Cel: {est.telefono_2}</p>
                          <p className="text-[10px] text-slate-400">{est.direccion_2} ({est.barrio_2})</p>
                        </div>
                        {est.acta && (
                          <div className="pt-1.5 text-[10px] text-red-600 font-bold">
                            Vinculado al Acta de Entrega: #{est.acta}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed rounded-lg text-xs">No registra estudios de crédito formalizados para este cliente.</p>
              )}
            </div>
          )}

          {/* TAB CONTENT: TALLER Y REVISIONES */}
          {profileTab === "revisiones" && (
            <div className="space-y-2 animate-fade-in">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <Wrench size={14} className="text-red-500" />
                <span>Mantenimientos de Garantía & Historial Técnico</span>
              </h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                {revisiones.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                        <th className="p-3">Vehículo</th>
                        <th className="p-3">Chasis</th>
                        <th className="p-3">Km Registrado</th>
                        <th className="p-3">Tipo Mantenimiento</th>
                        <th className="p-3 text-center">Estado</th>
                        <th className="p-3 text-center">Fecha Servicio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {revisiones.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold">{r.moto}</td>
                          <td className="p-3 font-mono text-slate-500">{r.chasis}</td>
                          <td className="p-3 font-mono">{r.km} Km</td>
                          <td className="p-3">{r.razon}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              r.estado === "Completado" || r.estado === "Realizada" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {r.estado}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-500">{r.fecha_servicio || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed rounded-lg">No registra ingresos a talleres de garantía o revisiones técnicas.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: HISTORIAL DE MOVIMIENTOS Y CAJA */}
          {profileTab === "movimientos" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                  <Award size={14} className="text-red-500" />
                  <span>Historial de Movimientos de Caja y Pagos</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded">
                  Consolidado Libro de Caja
                </span>
              </div>
              
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                {matchingRecibos.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Recibo No.</th>
                        <th className="p-3">Detalle / Concepto de Pago</th>
                        <th className="p-3 text-right text-green-600">Entrada</th>
                        <th className="p-3 text-right text-red-600">Salida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {matchingRecibos.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{rec.fecha}</td>
                          <td className="p-3 font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded inline-block my-1.5 ml-3">
                            #{rec.numero_recibo}
                          </td>
                          <td className="p-3 text-slate-700">{rec.concepto}</td>
                          <td className="p-3 text-right font-mono text-green-600">
                            {rec.entrada > 0 ? `$${rec.entrada.toLocaleString()}` : "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-red-600">
                            {rec.salida > 0 ? `$${rec.salida.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 border border-dashed rounded-lg space-y-2">
                    <p className="text-xs">No se encontraron recibos oficiales indexados directamente con el nombre o cédula del cliente.</p>
                    <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                      Sugerencia: Verifique los abonos en la pestaña de <b>Pre-ventas</b> y <b>Compras</b> para revisar los dineros ingresados por reservas de motocicletas y accesorios.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
