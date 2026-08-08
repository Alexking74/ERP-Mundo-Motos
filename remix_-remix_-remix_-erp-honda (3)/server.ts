import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DEFAULT_DB_FILE = path.join(process.cwd(), "db.json");

function getDbFilePath(sedeId?: string): string {
  if (!sedeId) return DEFAULT_DB_FILE;
  const clean = sedeId.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (!clean || clean === "mundo_motos") {
    return path.join(process.cwd(), "db_mundo_motos.json");
  }
  return path.join(process.cwd(), `db_${clean}.json`);
}

// Helper to read DB
async function readDB(sedeId?: string) {
  const filePath = getDbFilePath(sedeId);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.gastos) parsed.gastos = [];
    return parsed;
  } catch (error) {
    try {
      const defaultData = await fs.readFile(DEFAULT_DB_FILE, "utf-8");
      const parsed = JSON.parse(defaultData);
      if (!parsed.gastos) parsed.gastos = [];
      await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), "utf-8");
      return parsed;
    } catch (e) {
      console.error("Error reading database file, returning default schema", e);
      return {
        usuarios: [],
        motos_en_sala: [],
        preventas: [],
        actas: [],
        recibos: [],
        revisiones: [],
        cortes_de_ventas: [],
        salidas_externas: [],
        llegada_de_repuestos: [],
        salida_de_repuestos: [],
        repuestos_solicitados: [],
        referencias_estudios: [],
        eventos: [],
        matriculas: [],
        comisiones: [],
        letras: [],
        gastos: []
      };
    }
  }
}

// Helper to write DB
async function writeDB(data: any, sedeId?: string) {
  const filePath = getDbFilePath(sedeId);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Helper to record an Event to the DB
async function logEvent(
  db: any,
  usuarioName: string,
  rol: string,
  modulo: string,
  accion: string,
  prioridad: "VERDE" | "AMARILLA" | "ROJA",
  campo: string,
  valorAnterior: string,
  valorNuevo: string,
  motivo: string
) {
  const nextId = db.eventos.length > 0 
    ? Math.max(...db.eventos.map((e: any) => e.id || 0)) + 1 
    : 1;

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0];

  const newEvent = {
    id: nextId,
    fecha: dateStr,
    hora: timeStr,
    usuario: usuarioName,
    rol: rol,
    modulo: modulo,
    accion: accion,
    prioridad: prioridad,
    campo: campo,
    valor_anterior: valorAnterior,
    valor_nuevo: valorNuevo,
    motivo: motivo,
    estado: "Pendiente"
  };

  db.eventos.push(newEvent);
}

// API Routes
app.get("/api/db", async (req, res) => {
  const sedeId = (req.query.sede as string) || (req.headers["x-sede-id"] as string);
  const db = await readDB(sedeId);
  res.json(db);
});

app.post("/api/db", async (req, res) => {
  try {
    const sedeId = (req.query.sede as string) || (req.headers["x-sede-id"] as string) || req.body?.sede;
    const newDb = req.body;
    await writeDB(newDb, sedeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/db/save", async (req, res) => {
  try {
    const sedeId = (req.query.sede as string) || (req.headers["x-sede-id"] as string) || req.body?.sede;
    const newDb = req.body;
    await writeDB(newDb, sedeId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication endpoint
app.post("/api/login", async (req, res) => {
  const { usuario, contrasena, sede: requestedSede } = req.body;
  const sedeId = (req.query.sede as string) || (req.headers["x-sede-id"] as string) || requestedSede || "mundo_motos";
  const db = await readDB(sedeId);
  
  const user = db.usuarios.find(
    (u: any) => u.usuario.toLowerCase() === usuario.toLowerCase() && u.contrasena === contrasena
  );

  if (!user) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  if (user.estado !== "Activo") {
    return res.status(403).json({ error: `La cuenta de este usuario está ${user.estado}` });
  }

  // Update last access and set active session
  user.ultimo_acceso = new Date().toISOString().replace("T", " ").substring(0, 19);
  user.sesion_activa = "Sí";

  // Log Login event
  await logEvent(
    db,
    user.nombre_completo,
    user.rol,
    "USUARIOS",
    "Iniciar Sesión",
    "VERDE",
    "Sesión",
    "Cerrada",
    "Abierta",
    "Inicio de sesión exitoso en el ERP"
  );

  await writeDB(db, sedeId);

  res.json({
    success: true,
    user: {
      id_usuario: user.id_usuario,
      nombre_completo: user.nombre_completo,
      documento: user.documento,
      usuario: user.usuario,
      rol: user.rol,
      sede: user.sede,
      celular: user.celular,
      correo: user.correo
    }
  });
});

app.post("/api/logout", async (req, res) => {
  const { username, sede: requestedSede } = req.body;
  const sedeId = (req.query.sede as string) || (req.headers["x-sede-id"] as string) || requestedSede || "mundo_motos";
  const db = await readDB(sedeId);
  const user = db.usuarios.find((u: any) => u.nombre_completo === username);
  
  if (user) {
    user.sesion_activa = "No";
    
    await logEvent(
      db,
      user.nombre_completo,
      user.rol,
      "USUARIOS",
      "Cerrar Sesión",
      "VERDE",
      "Sesión",
      "Abierta",
      "Cerrada",
      "Cierre de sesión manual"
    );
    await writeDB(db, sedeId);
  }

  res.json({ success: true });
});

// Serve Google Apps Script deployable codes
app.get("/api/apps-script-code", (req, res) => {
  res.json({
    codigoGs: getCodigoGs(),
    erpHtml: getErpHtml()
  });
});

// Return the Apps Script companion Código.gs
function getCodigoGs() {
  return `/**
 * ERP Mundo Motos - Backend Google Apps Script (Código.gs)
 * Copiar y pegar este código en la sección Editor de Secuencias de Comandos de su Hoja de Cálculo de Google.
 * Versión 1.0 - Totalmente sincronizada con el Documento Maestro ERP Mundo Motos.
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('ERP');
  return template.evaluate()
    .setTitle('ERP Concesionario Mundo Motos')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Retorna todos los datos de las 14 hojas del ERP de forma centralizada.
 */
function getCompleteDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = [
    "MATRÍCULAS PARA TRANSITO", "DATOS ACTAS", "PREVENTAS", "RECIBOS", 
    "MOTOS EN SALA", "REVISIONES", "CORTES DE VENTAS", "SALIDAS EXTERNAS", 
    "LLEGADA DE REPUESTOS", "SALIDA DE REPUESTOS", "REPUESTOS SOLICITADOS", 
    "REFERENCIAS ESTUDIOS", "EVENTOS", "USUARIOS"
  ];
  
  var result = {};
  
  sheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      result[sheetName] = [];
      return;
    }
    
    // El inicio de información depende de la hoja (fila 3 o 4)
    var startRow = 4; // Por defecto fila 4
    if (sheetName === "RECIBOS" || sheetName === "MOTOS EN SALA" || 
        sheetName === "CORTES DE VENTAS" || sheetName === "SALIDAS EXTERNAS" || 
        sheetName === "LLEGADA DE REPUESTOS" || sheetName === "SALIDA DE REPUESTOS" || 
        sheetName === "REPUESTOS SOLICITADOS" || sheetName === "REFERENCIAS ESTUDIOS" || 
        sheetName === "EVENTOS" || sheetName === "USUARIOS") {
      startRow = 3;
    }
    
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    
    if (lastRow < startRow) {
      result[sheetName] = [];
      return;
    }
    
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, lastColumn).getValues();
    result[sheetName] = data;
  });
  
  return JSON.stringify(result);
}

/**
 * Guarda una fila en una hoja específica
 */
function appendRowToSheet(sheetName, rowData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("La hoja " + sheetName + " no existe.");
  sheet.appendRow(rowData);
  return { success: true };
}

/**
 * Actualiza una celda o fila en una hoja buscando por una llave (e.g. Chasis, Documento, etc.)
 */
function updateRowInSheet(sheetName, searchColIndex, searchValue, updateData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("La hoja " + sheetName + " no existe.");
  
  var startRow = 4;
  if (sheetName === "RECIBOS" || sheetName === "MOTOS EN SALA" || 
      sheetName === "CORTES DE VENTAS" || sheetName === "SALIDAS EXTERNAS" || 
      sheetName === "LLEGADA DE REPUESTOS" || sheetName === "SALIDA DE REPUESTOS" || 
      sheetName === "REPUESTOS SOLICITADOS" || sheetName === "REFERENCIAS ESTUDIOS" || 
      sheetName === "EVENTOS" || sheetName === "USUARIOS") {
    startRow = 3;
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return { success: false, message: "Sin datos" };
  
  var range = sheet.getRange(startRow, 1, lastRow - startRow + 1, sheet.getLastColumn());
  var values = range.getValues();
  
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][searchColIndex]).trim() === String(searchValue).trim()) {
      var rowNum = startRow + i;
      // Actualizar toda la fila con updateData
      sheet.getRange(rowNum, 1, 1, updateData.length).setValues([updateData]);
      return { success: true, row: rowNum };
    }
  }
  
  return { success: false, message: "Llave no encontrada" };
}
`;
}

function getErpHtml() {
  return `<!-- ERP HTML - Interfaz de Apps Script -->
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <title>Mundo Motos ERP</title>
    <!-- Tailwind CSS desde CDN para Apps Script -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
      }
    </style>
  </head>
  <body class="bg-slate-50 text-slate-800">
    <div id="app" class="p-8">
      <h1 class="text-2xl font-bold mb-4">ERP Concesionario Mundo Motos</h1>
      <p class="mb-4">Este HTML se integra con el backend Google Apps Script. En su entorno de desarrollo local, interactúa con el simulador de base de datos persistente local en tiempo real.</p>
      <!-- El frontend reactivo se renderiza aquí -->
    </div>
  </body>
</html>`;
}

// Vite middleware setup or production static files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
