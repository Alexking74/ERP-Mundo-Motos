export interface SedeConfig {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  spreadsheetId: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export const SEDES_DISPONIBLES: SedeConfig[] = [
  {
    id: "mundo_motos",
    nombre: "MUNDO MOTOS",
    codigo: "MM-01",
    descripcion: "Concesionario & Taller Principal Mundo Motos",
    spreadsheetId: "1_MUNDO_MOTOS_SPREADSHEET_ID_MASTER",
    color: "#dc2626", // Red-600
    badgeBg: "bg-red-950/80 border-red-800/80",
    badgeText: "text-red-400"
  },
  {
    id: "almacen_central",
    nombre: "ALMACÉN CENTRAL",
    codigo: "AC-02",
    descripcion: "Almacén Central & Distribuidora de Repuestos",
    spreadsheetId: "2_ALMACEN_CENTRAL_SPREADSHEET_ID_MASTER",
    color: "#2563eb", // Blue-600
    badgeBg: "bg-blue-950/80 border-blue-800/80",
    badgeText: "text-blue-400"
  }
];

// Helper to resolve active Sede ID from URL parameter or localStorage
export function getActiveSedeId(): string {
  if (typeof window === "undefined") return "mundo_motos";
  
  const urlParams = new URLSearchParams(window.location.search);
  const paramSede = urlParams.get("sede") || urlParams.get("branch");

  if (paramSede) {
    const cleanParam = paramSede.toLowerCase().replace(/ /g, "_");
    const found = SEDES_DISPONIBLES.find(
      (s) => s.id === cleanParam || s.codigo.toLowerCase() === cleanParam
    );
    if (found) {
      localStorage.setItem("erp_active_sede_id", found.id);
      return found.id;
    }
  }

  // Fallback to localStorage
  const stored = localStorage.getItem("erp_active_sede_id");
  if (stored && SEDES_DISPONIBLES.some((s) => s.id === stored)) {
    return stored;
  }

  return "mundo_motos";
}

export function getSedeConfig(sedeId: string): SedeConfig {
  return (
    SEDES_DISPONIBLES.find((s) => s.id === sedeId) || SEDES_DISPONIBLES[0]
  );
}
