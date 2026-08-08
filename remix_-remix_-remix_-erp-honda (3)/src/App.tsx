import React, { useState, useEffect } from "react";
import { DatabaseState, Usuario, ViewType } from "./types";
import { getActiveSedeId, getSedeConfig, SEDES_DISPONIBLES } from "./config/sedes";
import EscritorioPrincipal from "./components/EscritorioPrincipal";
import ModuloPreventas from "./components/ModuloPreventas";
import ModuloActas from "./components/ModuloActas";
import ModuloRepuestos from "./components/ModuloRepuestos";
import ModuloCaja from "./components/ModuloCaja";
import ModuloAdmin from "./components/ModuloAdmin";
import PerfilCliente from "./components/PerfilCliente";
import PerfilMoto from "./components/PerfilMoto";
import ModuloPapeleriaClientes from "./components/ModuloPapeleriaClientes";
import ModuloComisiones from "./components/ModuloComisiones";
import ModuloLetras from "./components/ModuloLetras";
import ModuloDevoluciones from "./components/ModuloDevoluciones";
import ModuloRevisiones from "./components/ModuloRevisiones";
import ModuloMovimientosFinancieros from "./components/ModuloMovimientosFinancieros";
import ModuloPortalPublico from "./components/ModuloPortalPublico";
import { 
  LogOut, 
  ChevronRight, 
  ChevronDown, 
  Menu, 
  X, 
  Layers, 
  Grid, 
  Building2, 
  Sparkles, 
  Home, 
  ShoppingBag, 
  Package, 
  Users, 
  Wallet, 
  Settings, 
  Globe,
  ArrowRight
} from "lucide-react";

export type ModuleType =
  | "escritorio"
  | "preventas"
  | "actas"
  | "repuestos"
  | "caja"
  | "admin"
  | "motos"
  | "papeleria"
  | "clientes_perfil"
  | "letras"
  | "comisiones"
  | "revisiones"
  | "movimientos_financieros"
  | "devoluciones"
  | "portal_publico";

export interface SectorConfig {
  id: string;
  nombre: string;
  icon: string;
  badgeColor: string;
  badgeBg: string;
  descripcion: string;
  modulos: {
    id: ModuleType;
    nombre: string;
    icon: string;
    descripcion: string;
    roles?: string[];
  }[];
}

export const SECTORES: SectorConfig[] = [
  {
    id: "inicio",
    nombre: "Inicio & Panel",
    icon: "🏠",
    badgeColor: "text-red-400",
    badgeBg: "bg-red-950/70 border-red-800/80",
    descripcion: "Visión general, KPIs del negocio y portal de clientes",
    modulos: [
      {
        id: "escritorio",
        nombre: "Escritorio Principal",
        icon: "💻",
        descripcion: "Consola de mando con KPIs y alertas de operación"
      },
      {
        id: "portal_publico",
        nombre: "Portal Público Clientes",
        icon: "🌐",
        descripcion: "Vista pública de catálogo y consulta para clientes"
      }
    ]
  },
  {
    id: "ventas",
    nombre: "Sector Ventas",
    icon: "🏍️",
    badgeColor: "text-amber-400",
    badgeBg: "bg-amber-950/70 border-amber-800/80",
    descripcion: "Gestión comercial, reservas, actas y comisiones",
    modulos: [
      {
        id: "preventas",
        nombre: "Pre-ventas / Reservas",
        icon: "📋",
        descripcion: "Módulo de cotización y reservas de motocicletas",
        roles: ["Administrador", "Vendedor"]
      },
      {
        id: "actas",
        nombre: "Actas de Entrega",
        icon: "📜",
        descripcion: "Emisión de actas oficiales de entrega de motos"
      },
      {
        id: "comisiones",
        nombre: "Mis Comisiones",
        icon: "💰",
        descripcion: "Liquidación y reporte de comisiones de venta",
        roles: ["Administrador", "Vendedor"]
      },
      {
        id: "devoluciones",
        nombre: "Devoluciones ERP",
        icon: "↩️",
        descripcion: "Gestión de notas de crédito y devoluciones"
      }
    ]
  },
  {
    id: "inventario",
    nombre: "Inventario & Postventa",
    icon: "📦",
    badgeColor: "text-emerald-400",
    badgeBg: "bg-emerald-950/70 border-emerald-800/80",
    descripcion: "Motos en sala, repuestos, POS y taller de revisiones",
    modulos: [
      {
        id: "motos",
        nombre: "Motos en Sala",
        icon: "🏍️",
        descripcion: "Catálogo de motos físicas, bóveda y traslados"
      },
      {
        id: "repuestos",
        nombre: "Repuestos & Accesorios POS",
        icon: "⚙️",
        descripcion: "Punto de venta POS e inventario de repuestos"
      },
      {
        id: "revisiones",
        nombre: "Revisiones Postventa",
        icon: "🔧",
        descripcion: "Control de mantenimientos y revisiones periódicas"
      }
    ]
  },
  {
    id: "clientes",
    nombre: "Clientes & Cartera",
    icon: "👥",
    badgeColor: "text-cyan-400",
    badgeBg: "bg-cyan-950/70 border-cyan-800/80",
    descripcion: "Expedientes de clientes, papelería y cartera de letras",
    modulos: [
      {
        id: "papeleria",
        nombre: "Perfil Clientes & Papelería",
        icon: "📂",
        descripcion: "Documentación, matrículas y perfil de clientes"
      },
      {
        id: "letras",
        nombre: "Cartera de Letras",
        icon: "📑",
        descripcion: "Financiamiento, letras y cobros a cuotas"
      }
    ]
  },
  {
    id: "finanzas",
    nombre: "Caja & Finanzas",
    icon: "💰",
    badgeColor: "text-indigo-400",
    badgeBg: "bg-indigo-950/70 border-indigo-800/80",
    descripcion: "Caja general, arqueos, egresos y movimientos",
    modulos: [
      {
        id: "caja",
        nombre: "Caja General & Gastos",
        icon: "💵",
        descripcion: "Movimientos diarios de caja e ingresos/egresos"
      },
      {
        id: "movimientos_financieros",
        nombre: "Movimientos Financieros",
        icon: "💎",
        descripcion: "Saldos bancarios y transferencias de la empresa"
      }
    ]
  },
  {
    id: "admin",
    nombre: "Administración",
    icon: "⚙️",
    badgeColor: "text-rose-400",
    badgeBg: "bg-rose-950/70 border-rose-800/80",
    descripcion: "Configuración global, usuarios y sincronización",
    modulos: [
      {
        id: "admin",
        nombre: "Módulo Administrador",
        icon: "🛡️",
        descripcion: "Gestión de usuarios, auditoría y Google Sheets",
        roles: ["Administrador"]
      }
    ]
  }
];

function findSectorForModule(modId: ModuleType): SectorConfig {
  for (const sec of SECTORES) {
    if (sec.modulos.some((m) => m.id === modId)) {
      return sec;
    }
  }
  return SECTORES[0];
}

// Default initial user credentials conforming to types.ts 'Usuario' interface
const INITIAL_USERS: Usuario[] = [
  {
    id_usuario: 1,
    nombre_completo: "Administrador General",
    documento: "10101010",
    usuario: "admin",
    contrasena: "admin123",
    rol: "Administrador",
    estado: "Activo",
    sede: "Sede Central Mundo Motos",
    celular: "3001234567",
    correo: "admin@mundomotos.com",
    fecha_creacion: "2026-01-01",
    ultimo_acceso: "2026-07-01",
    creado_por: "Sistema",
    sesion_activa: "No",
    observaciones: "Administrador central"
  },
  {
    id_usuario: 2,
    nombre_completo: "Asesor de Ventas Tolima",
    documento: "20202020",
    usuario: "asesor",
    contrasena: "asesor123",
    rol: "Vendedor",
    estado: "Activo",
    sede: "Sede Central Mundo Motos",
    celular: "3007654321",
    correo: "asesor@mundomotos.com",
    fecha_creacion: "2026-01-01",
    ultimo_acceso: "2026-07-01",
    creado_por: "Sistema",
    sesion_activa: "No",
    observaciones: "Asesor de motocicleta"
  },
  {
    id_usuario: 3,
    nombre_completo: "Cajero Principal",
    documento: "30303030",
    usuario: "cajero",
    contrasena: "cajero123",
    rol: "Sala",
    estado: "Activo",
    sede: "Sede Central Mundo Motos",
    celular: "3009998887",
    correo: "cajero@mundomotos.com",
    fecha_creacion: "2026-01-01",
    ultimo_acceso: "2026-07-01",
    creado_por: "Sistema",
    sesion_activa: "No",
    observaciones: "Caja y cierres"
  }
];

export default function App() {
  const [activeSedeId, setActiveSedeId] = useState<string>(getActiveSedeId());
  const activeSede = getSedeConfig(activeSedeId);

  const [db, setDb] = useState<DatabaseState | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [usersList, setUsersList] = useState<Usuario[]>(INITIAL_USERS);

  // Navigation and detail view states
  const [activeSectorId, setActiveSectorId] = useState<string>("inicio");
  const [currentModule, setCurrentModule] = useState<ModuleType>("escritorio");
  const [activeProfileView, setActiveProfileView] = useState<"client" | "moto" | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [adminInitialTab, setAdminInitialTab] = useState<"matriculas" | "revisiones" | "referencias" | "usuarios" | "eventos" | "appscript">("matriculas");
  const [papeleriaInitialTab, setPapeleriaInitialTab] = useState<"matriculas" | "perfiles" | "placas" | "estudios">("matriculas");
  const [motosInitialSubTab, setMotosInitialSubTab] = useState<"inventario" | "revisiones">("inventario");

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Login form states
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginSede, setLoginSede] = useState(activeSede.nombre);
  const [loginError, setLoginError] = useState("");

  // Switch active sede (updates URL parameter and reloads database)
  const handleSwitchSede = (newSedeId: string) => {
    localStorage.setItem("erp_active_sede_id", newSedeId);
    setActiveSedeId(newSedeId);
    const newConfig = getSedeConfig(newSedeId);
    setLoginSede(newConfig.nombre);
    
    // Update URL query param without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set("sede", newSedeId);
    window.history.pushState({}, "", url.toString());
  };

  // Fetch full state from backend Express server for active Sede
  useEffect(() => {
    setDb(null); // loader state
    fetch(`/api/db?sede=${activeSedeId}`)
      .then((res) => res.json())
      .then((data) => {
        setDb(data);
      })
      .catch((err) => {
        console.error("Error cargando base de datos: ", err);
      });
  }, [activeSedeId]);

  // Update backend db for active Sede on any local changes
  const handleUpdateDb = (newState: DatabaseState) => {
    setDb(newState);
    fetch(`/api/db?sede=${activeSedeId}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Sede-ID": activeSedeId
      },
      body: JSON.stringify(newState),
    })
      .then((res) => {
        if (!res.ok) console.error("Error al guardar cambios de base de datos");
      })
      .catch((err) => console.error("Fallo de red al guardar base de datos", err));
  };

  const handleSelectModule = (modId: ModuleType) => {
    setCurrentModule(modId);
    setActiveProfileView(null);
    const parentSector = findSectorForModule(modId);
    setActiveSectorId(parentSector.id);
    setMobileDrawerOpen(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const found = usersList.find(
      (u) => u.usuario.toLowerCase() === loginUser.trim().toLowerCase() && u.contrasena === loginPass
    );

    if (!found) {
      setLoginError("Credenciales de acceso incorrectas. Intente nuevamente.");
      return;
    }

    if (found.estado !== "Activo") {
      setLoginError("Esta cuenta ha sido desactivada temporalmente por la gerencia.");
      return;
    }

    // Set logged user with current active branch
    const logged: Usuario = {
      ...found,
      sede: activeSede.nombre
    };
    setCurrentUser(logged);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentModule("escritorio");
    setActiveSectorId("inicio");
    setActiveProfileView(null);
    setSelectedEntityId("");
  };

  // Maps nested or custom sub-views to their parent layouts & sectors
  const handleSetView = (view: ViewType) => {
    if (view === "ClientesPerfil") {
      setActiveProfileView("client");
    } else if (view === "MotosPerfil") {
      setActiveProfileView("moto");
    } else if (view === "Preventas") {
      handleSelectModule("preventas");
    } else if (view === "Actas") {
      handleSelectModule("actas");
    } else if (view === "LlegadaDeRepuestos" || view === "SalidaDeRepuestos" || view === "RepuestosSolicitados" || view === "InventarioGeneral") {
      handleSelectModule("repuestos");
    } else if (view === "CortesDeVentas" || view === "SalidasExternas" || view === "Gastos") {
      handleSelectModule("caja");
    } else if (view === "Revisiones") {
      handleSelectModule("revisiones");
    } else if (view === "MovimientosFinancieros") {
      handleSelectModule("movimientos_financieros");
    } else if (view === "Matriculas" || view === "Placas" || view === "ReferenciasEstudios" || view === "Usuarios" || view === "Eventos" || view === "AppsScriptTab") {
      const isAdmin = currentUser?.rol === "Administrador";
      
      if (view === "Matriculas") {
        if (isAdmin) {
          handleSelectModule("admin");
          setAdminInitialTab("matriculas");
        } else {
          handleSelectModule("papeleria");
          setPapeleriaInitialTab("matriculas");
        }
      } else if (view === "Placas") {
        if (isAdmin) {
          handleSelectModule("admin");
          setAdminInitialTab("matriculas");
        } else {
          handleSelectModule("papeleria");
          setPapeleriaInitialTab("placas");
        }
      } else if (view === "ReferenciasEstudios") {
        if (isAdmin) {
          handleSelectModule("admin");
          setAdminInitialTab("referencias");
        } else {
          handleSelectModule("papeleria");
          setPapeleriaInitialTab("estudios");
        }
      } else {
        if (isAdmin) {
          handleSelectModule("admin");
          if (view === "Usuarios") setAdminInitialTab("usuarios");
          else if (view === "Eventos") setAdminInitialTab("eventos");
          else if (view === "AppsScriptTab") setAdminInitialTab("appscript");
        } else {
          handleSelectModule("escritorio");
        }
      }
    } else if (view === "Letras") {
      handleSelectModule("letras");
    } else if (view === "Devoluciones") {
      handleSelectModule("devoluciones");
    } else if (view === "Escritorio") {
      handleSelectModule("escritorio");
    }
  };

  if (!db) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans p-6 text-white text-center">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 bg-red-600/20 rounded-full blur-xl animate-pulse"></div>
          <div className="animate-spin h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full relative z-10 shadow-lg shadow-red-500/50"></div>
        </div>
        <h3 className="text-base font-black uppercase tracking-wider text-white">Cargando Sede Operativa</h3>
        <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs">
          Sincronizando la base de datos de <span className="text-red-400 font-bold">{activeSede.nombre}</span>...
        </p>
      </div>
    );
  }

  // Handle Login State Screen with Liquid Glass Styling
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center font-sans p-4 select-none relative overflow-hidden text-slate-100">
        
        {/* Ambient backlighting glow decorations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] tracking-widest px-3 py-1 rounded-full uppercase inline-block shadow-md shadow-red-950/50 border border-red-400/30">
              MUNDO MOTOS ERP • MULTISEDE
            </span>
            <h1 className="text-2xl font-black text-white mt-3 tracking-tight">Acceso Oficial de Personal</h1>
            <p className="text-xs text-slate-400 mt-1">Concesionario Oficial & Almacén Central</p>
          </div>

          {/* Prominent Active Sede Badge */}
          <div className={`p-4 rounded-2xl mb-6 border backdrop-blur-md flex flex-col items-center justify-center text-center space-y-1 shadow-lg ${activeSede.badgeBg}`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sede Operativa Activa (Identificada por Link):</span>
            <div className={`text-base font-extrabold uppercase tracking-tight flex items-center space-x-2 ${activeSede.badgeText}`}>
              <Building2 className="w-4 h-4" />
              <span>SEDE: {activeSede.nombre}</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">{activeSede.descripcion}</span>
          </div>

          {/* Quick Links Selector for Multi-Sede Access */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10 mb-6 space-y-2 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-center">Seleccionar Link de Sede:</span>
            <div className="grid grid-cols-2 gap-2">
              {SEDES_DISPONIBLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSwitchSede(s.id)}
                  className={`px-3 py-2.5 rounded-xl text-[11px] font-extrabold transition-all border flex flex-col items-center justify-center text-center ${
                    activeSedeId === s.id
                      ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white border-red-500 shadow-md ring-1 ring-red-500/50"
                      : "bg-slate-900/40 text-slate-400 border-slate-800/80 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">Link {s.codigo}</span>
                  <span className="truncate w-full font-black mt-0.5">{s.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Nombre de Usuario</label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Ej: admin, asesor, cajero"
                className="w-full bg-slate-950/80 text-white border border-white/10 rounded-xl p-3.5 text-xs focus:outline-hidden focus:border-red-500/80 font-semibold transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 text-white border border-white/10 rounded-xl p-3.5 text-xs focus:outline-hidden focus:border-red-500/80 font-semibold transition-all shadow-inner"
              />
            </div>

            {loginError && (
              <p className="text-red-400 font-bold text-xs text-center bg-red-950/60 border border-red-800/60 p-2.5 rounded-xl">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider p-4 rounded-xl transition-all shadow-lg shadow-red-950/50 border border-red-400/30 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Ingresar a SEDE: {activeSede.nombre}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 flex justify-between text-[10px] text-slate-400">
            <span>Soporte: erphonda@tolima.com</span>
            <span>Versión MultiSede 2.5</span>
          </div>
        </div>
      </div>
    );
  }

  const activeSector = SECTORES.find((s) => s.id === activeSectorId) || SECTORES[0];
  const activeModuleConfig = activeSector.modulos.find((m) => m.id === currentModule) || 
    SECTORES.flatMap((s) => s.modulos).find((m) => m.id === currentModule) || 
    SECTORES[0].modulos[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans select-none antialiased flex flex-col">
      
      {/* Top Liquid Glass Navigation Header */}
      <header className="bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 px-4 md:px-6 py-3 shadow-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 rounded-xl font-black tracking-widest text-xs text-white shadow-md shadow-red-950/50 border border-red-400/30 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HONDA ERP</span>
          </div>
          
          {/* Prominent Active Sede Badge */}
          <div className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase flex items-center space-x-1.5 border backdrop-blur-md shadow-xs ${activeSede.badgeBg} ${activeSede.badgeText}`}>
            <Building2 className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px] sm:max-w-none">SEDE: {activeSede.nombre}</span>
          </div>
        </div>

        {/* User state & Sede indicator widget */}
        <div className="flex items-center space-x-3">
          {/* Quick link switcher dropdown */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            <span className="text-[9px] font-black uppercase text-slate-400 px-1.5">Link Sede:</span>
            {SEDES_DISPONIBLES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSwitchSede(s.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                  activeSedeId === s.id
                    ? "bg-red-600 text-white shadow-xs border border-red-400/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
                title={`Cambiar a ${s.nombre}`}
              >
                {s.nombre}
              </button>
            ))}
          </div>

          <div className="text-right text-xs hidden sm:block">
            <span className="text-slate-400">Usuario: </span>
            <span className="font-extrabold text-red-400 uppercase">{currentUser.usuario}</span>
            <span className="ml-1.5 bg-slate-900 text-slate-300 font-bold text-[9px] px-2 py-0.5 rounded-lg border border-white/10">
              {currentUser.rol}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800/80 rounded-xl transition-all border border-transparent hover:border-white/10 flex items-center space-x-1 cursor-pointer"
            title="Cerrar sesión del sistema"
          >
            <LogOut size={16} />
            <span className="text-xs font-bold hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main operational tabbed layout */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Navigation Sidebar (Desktop view - Liquid Glass) */}
        <aside className="hidden md:block w-72 shrink-0 bg-slate-950/60 backdrop-blur-2xl border-r border-white/10 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-60px)] sticky top-[60px]">
          <div>
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-red-500" />
                <span>Sectores del ERP</span>
              </span>
              <span className="text-[9px] bg-slate-900 border border-white/10 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                Multi-Sector
              </span>
            </div>

            <nav className="space-y-3">
              {SECTORES.map((sector) => {
                const isSectorActive = activeSectorId === sector.id;

                return (
                  <div key={sector.id} className="space-y-1">
                    {/* Sector Card Header Button */}
                    <button
                      onClick={() => {
                        setActiveSectorId(sector.id);
                        // If selecting sector, switch to first module in sector
                        if (sector.modulos.length > 0) {
                          const firstAllowed = sector.modulos.find((m) => !m.roles || m.roles.includes(currentUser.rol));
                          if (firstAllowed) handleSelectModule(firstAllowed.id);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between border cursor-pointer ${
                        isSectorActive
                          ? "bg-slate-900/90 text-white border-red-500/60 shadow-lg shadow-red-950/40 ring-1 ring-red-500/30"
                          : "bg-slate-900/30 text-slate-300 border-white/5 hover:border-white/15 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="text-base">{sector.icon}</span>
                        <span className="truncate tracking-tight">{sector.nombre}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform text-slate-400 ${isSectorActive ? "rotate-90 text-red-400" : ""}`} />
                    </button>

                    {/* Sector Modules Sub-list */}
                    {isSectorActive && (
                      <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-red-500/40 ml-4 animate-in fade-in duration-200">
                        {sector.modulos.map((mod) => {
                          if (mod.roles && !mod.roles.includes(currentUser.rol)) return null;
                          const isModuleActive = currentModule === mod.id && !activeProfileView;

                          return (
                            <button
                              key={mod.id}
                              onClick={() => handleSelectModule(mod.id)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                isModuleActive
                                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white font-black shadow-md shadow-red-950/60 border border-red-400/40"
                                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className="text-xs">{mod.icon}</span>
                                <span className="truncate">{mod.nombre}</span>
                              </div>
                              {isModuleActive && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-white/10 text-center space-y-1.5 backdrop-blur-md">
            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              🟢 MultiSede Sincronizada
            </span>
            <p className="text-[10px] text-slate-400 font-medium">
              Conectado a Google Sheets de <strong className="text-white">{activeSede.nombre}</strong>.
            </p>
          </div>
        </aside>

        {/* Content body pane */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
          
          {/* Breadcrumb Bar (Liquid Glass Header) */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-300">
              <span className="text-base">{activeSector.icon}</span>
              <span className="text-slate-400">{activeSector.nombre}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-white font-black flex items-center space-x-1.5">
                <span>{activeModuleConfig.icon}</span>
                <span>{activeProfileView ? "Perfil de Expediente" : activeModuleConfig.nombre}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-400 font-medium hidden sm:inline">{activeSector.descripcion}</span>
              <span className="bg-red-950/60 border border-red-800/80 text-red-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeSede.codigo}
              </span>
            </div>
          </div>

          {/* PROFILE DETAIL ROUTER (IF CLICKED) */}
          {activeProfileView === "client" && (
            <PerfilCliente
              clientId={selectedEntityId}
              db={db}
              onBack={() => setActiveProfileView(null)}
            />
          )}

          {activeProfileView === "moto" && (
            <PerfilMoto
              motoChasis={selectedEntityId}
              db={db}
              setDb={handleUpdateDb}
              onBack={() => setActiveProfileView(null)}
              user={currentUser}
            />
          )}

          {/* STANDARD TAB ROUTER */}
          {!activeProfileView && (
            <>
              {currentModule === "escritorio" && (
                <EscritorioPrincipal
                  user={currentUser}
                  db={db}
                  setView={handleSetView}
                  setSelectedEntityId={setSelectedEntityId}
                />
              )}

              {currentModule === "preventas" && (
                <ModuloPreventas
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                  setView={handleSetView}
                  setSelectedEntityId={setSelectedEntityId}
                />
              )}

              {currentModule === "actas" && (
                <ModuloActas
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                  setView={handleSetView}
                  setSelectedEntityId={setSelectedEntityId}
                  selectedEntityId={selectedEntityId}
                />
              )}

              {currentModule === "repuestos" && (
                <ModuloRepuestos
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                />
              )}

              {currentModule === "caja" && (
                <ModuloCaja
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                />
              )}

              {currentModule === "comisiones" && (
                <ModuloComisiones
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                />
              )}

              {currentModule === "letras" && (
                <ModuloLetras
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                />
              )}

              {currentModule === "revisiones" && (
                <ModuloRevisiones
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                  selectedEntityId={selectedEntityId}
                />
              )}

              {currentModule === "movimientos_financieros" && (
                <ModuloMovimientosFinancieros
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                />
              )}

              {currentModule === "devoluciones" && (
                <ModuloDevoluciones
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                  selectedEntityId={selectedEntityId}
                  onNavigate={(view, id) => {
                    handleSetView(view);
                    if (id) setSelectedEntityId(id);
                  }}
                />
              )}

              {currentModule === "admin" && (
                <ModuloAdmin
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                  usersList={usersList}
                  setUsersList={setUsersList}
                  initialTab={adminInitialTab}
                />
              )}

              {currentModule === "motos" && (
                <PerfilMoto
                  motoChasis=""
                  db={db}
                  setDb={handleUpdateDb}
                  onBack={() => handleSelectModule("escritorio")}
                  user={currentUser}
                  initialSubTab={motosInitialSubTab}
                />
              )}

              {currentModule === "papeleria" && (
                <ModuloPapeleriaClientes
                  user={currentUser}
                  db={db}
                  setDb={handleUpdateDb}
                  initialTab={papeleriaInitialTab}
                />
              )}

              {currentModule === "portal_publico" && (
                <ModuloPortalPublico
                  db={db}
                  setDb={handleUpdateDb}
                />
              )}
            </>
          )}

        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Liquid Glass Mobile App Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-white/15 px-2 py-2 flex justify-around items-center shadow-2xl">
        {/* 1. Inicio */}
        <button
          onClick={() => {
            setActiveSectorId("inicio");
            handleSelectModule("escritorio");
          }}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
            currentModule === "escritorio"
              ? "bg-red-600 text-white shadow-md shadow-red-950/50"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Inicio</span>
        </button>

        {/* 2. Ventas */}
        <button
          onClick={() => {
            setActiveSectorId("ventas");
            handleSelectModule("preventas");
          }}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
            activeSectorId === "ventas"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Ventas</span>
        </button>

        {/* 3. POS & Inventario */}
        <button
          onClick={() => {
            setActiveSectorId("inventario");
            handleSelectModule("repuestos");
          }}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
            activeSectorId === "inventario"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>POS / Inv</span>
        </button>

        {/* 4. Clientes */}
        <button
          onClick={() => {
            setActiveSectorId("clientes");
            handleSelectModule("papeleria");
          }}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
            activeSectorId === "clientes"
              ? "bg-cyan-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Clientes</span>
        </button>

        {/* 5. Caja / Finanzas */}
        <button
          onClick={() => {
            setActiveSectorId("finanzas");
            handleSelectModule("caja");
          }}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
            activeSectorId === "finanzas"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>Caja</span>
        </button>

        {/* 6. Más / Drawer */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
            mobileDrawerOpen
              ? "bg-slate-800 text-white border border-white/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span>Sectores</span>
        </button>
      </nav>

      {/* MOBILE SECTOR & MODULE DRAWER SHEET (Liquid Glass App Sheet) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
          ></div>

          {/* Liquid Glass Bottom Drawer Container */}
          <div className="relative z-10 bg-slate-950/95 border-t border-white/20 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Explorar Sectores ERP
                </h3>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Seleccione un sector comercial para desplegar sus funciones operativas:
            </p>

            <div className="space-y-4">
              {SECTORES.map((sector) => (
                <div key={sector.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm font-black text-white">
                      <span>{sector.icon}</span>
                      <span>{sector.nombre}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sector.badgeBg} ${sector.badgeColor}`}>
                      {sector.modulos.length} módulos
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{sector.descripcion}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {sector.modulos.map((mod) => {
                      if (mod.roles && !mod.roles.includes(currentUser.rol)) return null;
                      const isModuleActive = currentModule === mod.id && !activeProfileView;

                      return (
                        <button
                          key={mod.id}
                          onClick={() => handleSelectModule(mod.id)}
                          className={`p-3 rounded-xl text-xs font-extrabold text-left transition-all border flex items-center justify-between min-h-[44px] cursor-pointer ${
                            isModuleActive
                              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-400/40 shadow-lg"
                              : "bg-slate-950/80 text-slate-300 border-white/5 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="text-base">{mod.icon}</span>
                            <div>
                              <div className="font-bold">{mod.nombre}</div>
                              <div className="text-[10px] text-slate-400 font-normal line-clamp-1">{mod.descripcion}</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-500 font-medium">
              Sede Operativa: {activeSede.nombre} • Versión Móvil
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
