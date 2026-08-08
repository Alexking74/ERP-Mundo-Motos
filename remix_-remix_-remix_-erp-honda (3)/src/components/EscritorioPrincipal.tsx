import React, { useState } from "react";
import { 
  Users, Bike, Wrench, Wallet, ShieldAlert, BarChart3, 
  Database, UserSquare, CalendarDays, Search, ExternalLink, CodeXml, LayoutDashboard, RotateCcw
} from "lucide-react";
import { Usuario, ViewType, DatabaseState } from "../types";
import { buscadorGlobal, GlobalSearchResult } from "../utils/db";

interface EscritorioProps {
  user: Usuario;
  db: DatabaseState;
  setView: (v: ViewType) => void;
  setSelectedEntityId?: (id: string) => void;
}

export default function EscritorioPrincipal({ user, db, setView, setSelectedEntityId }: EscritorioProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length >= 3) {
      setSearchResults(buscadorGlobal(db, query));
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (item: GlobalSearchResult) => {
    if (setSelectedEntityId) {
      setSelectedEntityId(item.llave);
    }
    setView(item.tipoView);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Helper to render area cards
  const renderCard = (title: string, desc: string, icon: any, view: ViewType, disabled = false) => {
    if (disabled) return null;
    return (
      <button
        id={`card-${view.toLowerCase()}`}
        onClick={() => setView(view)}
        className="flex items-start p-5 bg-white rounded-xl shadow-xs border border-slate-100 hover:border-red-200 transition-all text-left duration-200 group"
      >
        <div className="p-3 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-200 mr-4">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-sm group-hover:text-red-600 transition-colors">
            {title}
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {desc}
          </p>
        </div>
      </button>
    );
  };

  // Check roles
  const isAdmin = user.rol === "Administrador";
  const isVendedor = user.rol === "Vendedor";
  const isSala = user.rol === "Sala";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Bike size={240} className="transform translate-x-12 translate-y-12" />
        </div>
        <div className="max-w-2xl relative z-10">
          <span className="bg-red-500 text-red-100 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sede: {user.sede}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mt-3">
            ¡Hola, {user.nombre_completo}!
          </h2>
          <p className="text-red-100 text-sm mt-2 leading-relaxed">
            Bienvenido al Escritorio Principal del ERP Mundo Motos. Toda la información comercial, repuestos y caja está integrada y automatizada en tiempo real.
          </p>
        </div>
      </div>

      {/* Pending Arrivals Notification Alert */}
      {db.llegada_de_repuestos.filter((l) => l.confirmacion_de_llegada === "PENDIENTE").length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🔔</span>
            <div>
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Llegadas de Repuestos Pendientes</h4>
              <p className="text-xs text-amber-700 font-semibold mt-1">
                El Administrador ha enviado nuevos repuestos desde otra sede. Existen repuestos pendientes por verificar y recibir en el inventario de su sede.
              </p>
            </div>
          </div>
          <button
            onClick={() => setView("LlegadaDeRepuestos")}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-xs shrink-0 whitespace-nowrap"
          >
            Entrar a Llegadas Pendientes
          </button>
        </div>
      )}

      {/* Intelligent Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={20} />
        </div>
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscador Inteligente (Motos, Clientes, Actas, Recompras, Encargos)..."
          className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-xs"
        />
        
        {/* Search Results Drawer */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
            <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 tracking-wider">
              Resultados del Buscador Inteligente
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => selectSearchResult(item)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-red-50 text-red-600 p-1.5 rounded text-xs font-bold uppercase tracking-tight">
                    {item.modulo}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800 group-hover:text-red-600 transition-colors">
                      {item.descripcion}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Llave: {item.llave}
                    </div>
                  </div>
                </div>
                <ExternalLink size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of operational areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CLIENTES */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
            <Users size={20} className="text-red-600" />
            <h3>Área Clientes</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderCard("Preventas", "Administración de abonos y encargos de motos.", <CalendarDays size={18} />, "Preventas", isSala)}
            {renderCard("Actas", "Venta oficial, generación de factura y salida de motos.", <Bike size={18} />, "Actas", isSala)}
            {renderCard("Matrículas Tránsito", "Trámite de placas y pago de impuestos.", <Database size={18} />, "Matriculas", isSala)}
            {renderCard("Revisiones Técnicas", "Historial completo de mantenimientos posventa.", <Wrench size={18} />, "Revisiones", false)}
            {renderCard("Perfil Cliente", "Vista integrada de toda la actividad de un cliente.", <UserSquare size={18} />, "ClientesPerfil", false)}
          </div>
        </div>

        {/* MOTOS */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
            <Bike size={20} className="text-red-600" />
            <h3>Área Ventas de Motos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderCard("Motos en Sala", "Inventario físico de motocicletas por sedes.", <Bike size={18} />, "MotosPerfil", false)}
            {renderCard("Estudios de Crédito", "Gestión de referencias personales y bancos.", <ShieldAlert size={18} />, "ReferenciasEstudios", isSala)}
            {renderCard("Placas y Rango", "Asignación de placas y matrículas asociadas.", <Database size={18} />, "Matriculas", isSala)}
          </div>
        </div>

        {/* REPUESTOS */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
            <Wrench size={20} className="text-red-600" />
            <h3>Área Repuestos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderCard("Inventario Repuestos", "Stock consolidado calculado automáticamente.", <Database size={18} />, "InventarioGeneral", false)}
            {renderCard("Llegada Repuestos", "Ingreso y recepción de mercancía de proveedores.", <CalendarDays size={18} />, "LlegadaDeRepuestos", isSala)}
            {renderCard("Salida / POS", "Ticket de venta de repuestos y accesorios.", <Wallet size={18} />, "SalidaDeRepuestos", isSala)}
            {renderCard("Encargos Faltantes", "Registro de repuestos solicitados sin existencias.", <ShieldAlert size={18} />, "RepuestosSolicitados", isSala)}
          </div>
        </div>

        {/* CAJA & AUDITORIA */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
            <Wallet size={20} className="text-red-600" />
            <h3>Área Caja & Auditoría</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderCard("Recibos Oficiales", "Libro de ingresos y salidas económicas.", <Wallet size={18} />, "CortesDeVentas", isSala)}
            {renderCard("Cierre Diario", "Verificación diaria del efectivo y arqueo físico.", <BarChart3 size={18} />, "CortesDeVentas", isSala)}
            {renderCard("Salidas Externas", "Consignaciones y gastos no relacionados con ventas.", <Wallet size={18} />, "SalidasExternas", isSala)}
            {renderCard("Hoja Gastos ERP", "Base de egresos de 6 columnas A-F y control de recibos.", <Wallet size={18} />, "Gastos", isSala)}
            {renderCard("Devoluciones ERP", "Gestión transversal de devoluciones de dinero y productos.", <RotateCcw size={18} />, "Devoluciones")}
            {renderCard("Código Google Sheets", "Código Apps Script copiable listo para producción.", <CodeXml size={18} />, "AppsScriptTab", !isAdmin)}
          </div>
        </div>

      </div>

      {/* Admin exclusive Quick Access Dashboard */}
      {isAdmin && (
        <div className="bg-slate-100 rounded-xl p-6 border border-slate-200 mt-8">
          <div className="flex items-center space-x-2 text-slate-800 font-bold mb-4">
            <LayoutDashboard size={20} className="text-red-600" />
            <h3>Módulo Administrativo Seguro</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Como Administrador, tiene acceso total a la auditoría, registro inmutable de eventos, gestión de permisos de personal y configuración centralizada de cuentas de Google Sheets.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setView("Usuarios")}
              className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 font-semibold text-xs py-2 px-4 rounded-lg shadow-2xs transition-colors flex items-center space-x-2"
            >
              <Users size={14} />
              <span>Gestionar Usuarios ({db.usuarios.length})</span>
            </button>
            <button
              onClick={() => setView("Eventos")}
              className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 font-semibold text-xs py-2 px-4 rounded-lg shadow-2xs transition-colors flex items-center space-x-2"
            >
              <ShieldAlert size={14} />
              <span>Bitácora de Eventos ({db.eventos.length})</span>
            </button>
            <button
              onClick={() => setView("AppsScriptTab")}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-2xs transition-colors flex items-center space-x-2"
            >
              <CodeXml size={14} />
              <span>Exportar Código Apps Script</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
