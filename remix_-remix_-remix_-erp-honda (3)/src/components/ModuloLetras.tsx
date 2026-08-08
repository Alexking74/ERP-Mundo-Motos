import React, { useState, useMemo } from "react";
import { 
  Layers, 
  Search, 
  Phone, 
  DollarSign, 
  TrendingDown, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertCircle,
  PlusCircle, 
  FolderOpen,
  Send,
  Calculator,
  Eye,
  FileSpreadsheet,
  Filter,
  X,
  Check,
  ShieldCheck,
  ExternalLink,
  Info,
  Clock,
  AlertTriangle
} from "lucide-react";
import { DatabaseState, Usuario, Letra, Recibo, ClientePerfil } from "../types";

interface LetrasProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
}

export default function ModuloLetras({ user, db, setDb }: LetrasProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCasillero, setSelectedCasillero] = useState<string>("TODOS");
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<string>("TODOS");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Active view tab: "expedientes" (portfolios), "tabla21" (official 21-column sheet), "crear" (new obligation)
  const [activeTab, setActiveTab] = useState<"expedientes" | "tabla21">("expedientes");

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClientDoc, setSelectedClientDoc] = useState<string>("");
  
  // Payment form state
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().split("T")[0]);
  const [pagoForma, setPagoForma] = useState("EFECTIVO");
  const [pagoObservaciones, setPagoObservaciones] = useState("");
  const [selectedLetrasToPay, setSelectedLetrasToPay] = useState<number[]>([]);
  const [customPagoMonto, setCustomPagoMonto] = useState<number>(0);

  // New Obligation Modal State (Admin / Asesor creation)
  const [showNewObligationModal, setShowNewObligationModal] = useState(false);
  const [newCasillero, setNewCasillero] = useState("");
  const [newNumLetras, setNewNumLetras] = useState<number>(12);
  const [newValorLetra, setNewValorLetra] = useState<number>(500000);
  const [newFechaInicio, setNewFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [newDocCliente, setNewDocCliente] = useState("");
  const [newNombreCliente, setNewNombreCliente] = useState("");
  const [newApellidoCliente, setNewApellidoCliente] = useState("");
  const [newTelCliente, setNewTelCliente] = useState("");
  const [newCorreoCliente, setNewCorreoCliente] = useState("");
  const [newDirCliente, setNewDirCliente] = useState("");
  const [newMoto, setNewMoto] = useState("");
  const [newMotor, setNewMotor] = useState("");
  const [newChasis, setNewChasis] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newValorMoto, setNewValorMoto] = useState<number>(10000000);

  // Detail Modal for a single row
  const [selectedRowDetail, setSelectedRowDetail] = useState<Letra | null>(null);

  // Initial dummy data generator if db.letras is empty
  const lettersList = useMemo(() => {
    if (db.letras && db.letras.length > 0) {
      return db.letras;
    }

    const initialLetras: Letra[] = [
      // Client 1: Juan Carlos Restrepo - Paid 2 of 6 letters
      {
        casillero: "C-12",
        numero_letras: 6,
        fecha: "2026-06-15",
        numero_letra_a_pagar: 1,
        forma_pago: "EFECTIVO",
        recibo: "RC-8001",
        valor_letra: 500000,
        total_recibido: 500000,
        deuda: 2500000,
        nombre: "Juan Carlos",
        apellido: "Restrepo",
        numero_documento: "1019023456",
        telefono: "3114567890",
        correo: "juan.restrepo@gmail.com",
        direccion: "Calle 10 # 5-40, Planadas",
        motocicleta: "Suzuki GN 125",
        motor: "F402-384920",
        chasis: "9C8GN125K7490",
        color: "Rojo",
        valor: 9500000,
        estado: "En pago"
      },
      {
        casillero: "C-12",
        numero_letras: 6,
        fecha: "2026-07-15",
        numero_letra_a_pagar: 2,
        forma_pago: "TRANSFERENCIA BANCOLOMBIA",
        recibo: "RC-8015",
        valor_letra: 500000,
        total_recibido: 500000,
        deuda: 2000000,
        nombre: "Juan Carlos",
        apellido: "Restrepo",
        numero_documento: "1019023456",
        telefono: "3114567890",
        correo: "juan.restrepo@gmail.com",
        direccion: "Calle 10 # 5-40, Planadas",
        motocicleta: "Suzuki GN 125",
        motor: "F402-384920",
        chasis: "9C8GN125K7490",
        color: "Rojo",
        valor: 9500000,
        estado: "En pago"
      },

      // Client 2: Maria Helena Gomez - Paid 5 of 5 letters (Pagada)
      {
        casillero: "A-04",
        numero_letras: 5,
        fecha: "2026-03-10",
        numero_letra_a_pagar: 1,
        forma_pago: "EFECTIVO",
        recibo: "RC-7120",
        valor_letra: 400000,
        total_recibido: 400000,
        deuda: 1600000,
        nombre: "Maria Helena",
        apellido: "Gomez",
        numero_documento: "41908234",
        telefono: "3201234567",
        correo: "maria.gomez@hotmail.com",
        direccion: "Carrera 4 # 12-34, Planadas",
        motocicleta: "Honda Wave 110",
        motor: "JC53E-928401",
        chasis: "1HFJC530X8490",
        color: "Negro",
        valor: 8200000,
        estado: "En pago"
      },
      {
        casillero: "A-04",
        numero_letras: 5,
        fecha: "2026-04-10",
        numero_letra_a_pagar: 2,
        forma_pago: "EFECTIVO",
        recibo: "RC-7250",
        valor_letra: 400000,
        total_recibido: 400000,
        deuda: 1200000,
        nombre: "Maria Helena",
        apellido: "Gomez",
        numero_documento: "41908234",
        telefono: "3201234567",
        correo: "maria.gomez@hotmail.com",
        direccion: "Carrera 4 # 12-34, Planadas",
        motocicleta: "Honda Wave 110",
        motor: "JC53E-928401",
        chasis: "1HFJC530X8490",
        color: "Negro",
        valor: 8200000,
        estado: "En pago"
      },
      {
        casillero: "A-04",
        numero_letras: 5,
        fecha: "2026-05-10",
        numero_letra_a_pagar: 3,
        forma_pago: "TRANSFERENCIA DAVIPLATA",
        recibo: "RC-7380",
        valor_letra: 400000,
        total_recibido: 400000,
        deuda: 800000,
        nombre: "Maria Helena",
        apellido: "Gomez",
        numero_documento: "41908234",
        telefono: "3201234567",
        correo: "maria.gomez@hotmail.com",
        direccion: "Carrera 4 # 12-34, Planadas",
        motocicleta: "Honda Wave 110",
        motor: "JC53E-928401",
        chasis: "1HFJC530X8490",
        color: "Negro",
        valor: 8200000,
        estado: "En pago"
      },
      {
        casillero: "A-04",
        numero_letras: 5,
        fecha: "2026-06-10",
        numero_letra_a_pagar: 4,
        forma_pago: "EFECTIVO",
        recibo: "RC-7510",
        valor_letra: 400000,
        total_recibido: 400000,
        deuda: 400000,
        nombre: "Maria Helena",
        apellido: "Gomez",
        numero_documento: "41908234",
        telefono: "3201234567",
        correo: "maria.gomez@hotmail.com",
        direccion: "Carrera 4 # 12-34, Planadas",
        motocicleta: "Honda Wave 110",
        motor: "JC53E-928401",
        chasis: "1HFJC530X8490",
        color: "Negro",
        valor: 8200000,
        estado: "En pago"
      },
      {
        casillero: "A-04",
        numero_letras: 5,
        fecha: "2026-07-10",
        numero_letra_a_pagar: 5,
        forma_pago: "EFECTIVO",
        recibo: "RC-7685",
        valor_letra: 400000,
        total_recibido: 400000,
        deuda: 0,
        nombre: "Maria Helena",
        apellido: "Gomez",
        numero_documento: "41908234",
        telefono: "3201234567",
        correo: "maria.gomez@hotmail.com",
        direccion: "Carrera 4 # 12-34, Planadas",
        motocicleta: "Honda Wave 110",
        motor: "JC53E-928401",
        chasis: "1HFJC530X8490",
        color: "Negro",
        valor: 8200000,
        estado: "Pagada"
      },

      // Client 3: Oscar Dario Ortiz - Paid 1 of 10 letters
      {
        casillero: "B-23",
        numero_letras: 10,
        fecha: "2026-07-20",
        numero_letra_a_pagar: 1,
        forma_pago: "EFECTIVO",
        recibo: "RC-8044",
        valor_letra: 300000,
        total_recibido: 300000,
        deuda: 2700000,
        nombre: "Oscar Dario",
        apellido: "Ortiz",
        numero_documento: "1025400192",
        telefono: "3159987744",
        correo: "oscar.ortiz@outlook.com",
        direccion: "Vereda El Rubí, Sector Escuela",
        motocicleta: "Yamaha XTZ 150",
        motor: "G3J6E-401928",
        chasis: "9C6XTZ150J2981",
        color: "Azul",
        valor: 14500000,
        estado: "En pago"
      }
    ];

    setTimeout(() => {
      setDb({ ...db, letras: initialLetras });
    }, 100);

    return initialLetras;
  }, [db, setDb]);

  // Group letters history by unique client document to represent portfolios
  const clientPortfolios = useMemo(() => {
    const portfolios: { [doc: string]: {
      documento: string;
      nombre: string;
      apellido: string;
      telefono: string;
      correo: string;
      direccion: string;
      motocicleta: string;
      motor: string;
      chasis: string;
      color: string;
      valor_moto: number;
      casillero: string;
      numero_letras: number;
      valor_letra: number;
      total_deuda_original: number;
      total_pagado: number;
      deuda_restante: number;
      letras_pagadas: number[];
      letras_totales: number;
      estado: "Pendiente" | "En pago" | "Pagada" | "Con novedad";
      pagos: Letra[];
    }} = {};

    lettersList.forEach(item => {
      const doc = item.numero_documento;
      if (!portfolios[doc]) {
        portfolios[doc] = {
          documento: doc,
          nombre: item.nombre,
          apellido: item.apellido,
          telefono: item.telefono,
          correo: item.correo,
          direccion: item.direccion,
          motocicleta: item.motocicleta,
          motor: item.motor,
          chasis: item.chasis,
          color: item.color,
          valor_moto: item.valor || 0,
          casillero: item.casillero,
          numero_letras: item.numero_letras,
          valor_letra: item.valor_letra,
          total_deuda_original: item.numero_letras * item.valor_letra,
          total_pagado: 0,
          deuda_restante: item.numero_letras * item.valor_letra,
          letras_pagadas: [],
          letras_totales: item.numero_letras,
          estado: "Pendiente",
          pagos: []
        };
      }
      
      portfolios[doc].pagos.push(item);
    });

    // Calculate cumulative debt reductions & Determine state
    Object.keys(portfolios).forEach(doc => {
      const p = portfolios[doc];
      p.pagos.sort((a, b) => a.numero_letra_a_pagar - b.numero_letra_a_pagar);
      
      const totalRecibidoSum = p.pagos.reduce((sum, item) => sum + (item.total_recibido || 0), 0);
      p.total_pagado = totalRecibidoSum;
      p.deuda_restante = Math.max(0, p.total_deuda_original - totalRecibidoSum);
      p.letras_pagadas = Array.from(new Set(p.pagos.map(pay => pay.numero_letra_a_pagar)));
      
      if (p.deuda_restante <= 0 || p.letras_pagadas.length >= p.letras_totales) {
        p.estado = "Pagada";
      } else if (p.letras_pagadas.length > 0) {
        p.estado = "En pago";
      } else {
        p.estado = "Pendiente";
      }
    });

    return Object.values(portfolios);
  }, [lettersList]);

  // Unique list of casilleros
  const casillerosList = useMemo(() => {
    const list = new Set<string>();
    clientPortfolios.forEach(p => {
      if (p.casillero) list.add(p.casillero);
    });
    return Array.from(list).sort();
  }, [clientPortfolios]);

  // Filtered portfolios based on search query, casillero, state
  const filteredPortfolios = useMemo(() => {
    return clientPortfolios.filter(p => {
      const q = searchTerm.trim().toLowerCase();
      const matchText = !q || 
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
        p.documento.includes(q) ||
        p.telefono.includes(q) ||
        p.motocicleta.toLowerCase().includes(q) ||
        p.motor.toLowerCase().includes(q) ||
        p.chasis.toLowerCase().includes(q) ||
        p.casillero.toLowerCase().includes(q);

      const matchCasillero = selectedCasillero === "TODOS" || p.casillero === selectedCasillero;
      const matchEstado = selectedEstadoFilter === "TODOS" || p.estado === selectedEstadoFilter;

      return matchText && matchCasillero && matchEstado;
    });
  }, [clientPortfolios, searchTerm, selectedCasillero, selectedEstadoFilter]);

  // Filtered 21-column raw rows
  const visible21ColumnRows = useMemo(() => {
    let rows = lettersList;

    if (selectedCasillero !== "TODOS") {
      rows = rows.filter(r => r.casillero === selectedCasillero);
    }

    if (selectedEstadoFilter !== "TODOS") {
      rows = rows.filter(r => r.estado === selectedEstadoFilter);
    }

    if (fechaInicio) {
      rows = rows.filter(r => r.fecha >= fechaInicio);
    }

    if (fechaFin) {
      rows = rows.filter(r => r.fecha <= fechaFin);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(r => 
        (r.nombre || "").toLowerCase().includes(q) ||
        (r.apellido || "").toLowerCase().includes(q) ||
        (r.numero_documento || "").includes(q) ||
        (r.casillero || "").toLowerCase().includes(q) ||
        (r.motocicleta || "").toLowerCase().includes(q) ||
        (r.motor || "").toLowerCase().includes(q) ||
        (r.chasis || "").toLowerCase().includes(q) ||
        (r.recibo || "").toLowerCase().includes(q)
      );
    }

    return rows;
  }, [lettersList, selectedCasillero, selectedEstadoFilter, fechaInicio, fechaFin, searchTerm]);

  // Cartera Dashboard Stats
  const stats = useMemo(() => {
    let totalDeudaActiva = 0;
    let totalDineroRecaudado = 0;
    let totalClientesActivos = 0;
    let totalClientesSaldados = 0;

    clientPortfolios.forEach(p => {
      totalDeudaActiva += p.deuda_restante;
      totalDineroRecaudado += p.total_pagado;
      if (p.estado === "Pagada") {
        totalClientesSaldados++;
      } else {
        totalClientesActivos++;
      }
    });

    return {
      totalDeudaActiva,
      totalDineroRecaudado,
      totalClientesActivos,
      totalClientesSaldados,
      totalClientesTotales: clientPortfolios.length
    };
  }, [clientPortfolios]);

  // Selected client portfolio for registering a payment
  const activeClientPortfolio = useMemo(() => {
    return clientPortfolios.find(p => p.documento === selectedClientDoc);
  }, [clientPortfolios, selectedClientDoc]);

  // Open multi-letter payment modal
  const handleOpenPaymentModal = (clientDoc: string) => {
    const p = clientPortfolios.find(item => item.documento === clientDoc);
    if (!p) return;
    
    setSelectedClientDoc(clientDoc);
    setPagoFecha(new Date().toISOString().split("T")[0]);
    setPagoForma("EFECTIVO");
    setPagoObservaciones("");

    // Identify next unpaid letter
    const paidSet = new Set(p.letras_pagadas);
    const pendingNums: number[] = [];
    for (let i = 1; i <= p.letras_totales; i++) {
      if (!paidSet.has(i)) {
        pendingNums.push(i);
      }
    }

    // Default select the first pending letter
    if (pendingNums.length > 0) {
      setSelectedLetrasToPay([pendingNums[0]]);
      setCustomPagoMonto(p.valor_letra);
    } else {
      setSelectedLetrasToPay([]);
      setCustomPagoMonto(0);
    }

    setShowPaymentModal(true);
  };

  // Toggle selection of a letter number in the payment modal
  const handleToggleLetterSelection = (num: number) => {
    if (!activeClientPortfolio) return;

    let newSelected: number[];
    if (selectedLetrasToPay.includes(num)) {
      newSelected = selectedLetrasToPay.filter(n => n !== num);
    } else {
      newSelected = [...selectedLetrasToPay, num].sort((a, b) => a - b);
    }

    setSelectedLetrasToPay(newSelected);
    setCustomPagoMonto(newSelected.length * activeClientPortfolio.valor_letra);
  };

  // Submit payment handler (handles single or multiple letters at once)
  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClientPortfolio) return;

    if (selectedLetrasToPay.length === 0 && customPagoMonto <= 0) {
      alert("Seleccione al menos una letra o ingrese un valor de pago válido.");
      return;
    }

    const paidSet = new Set(activeClientPortfolio.letras_pagadas);
    const doublePaid = selectedLetrasToPay.some(num => paidSet.has(num));
    if (doublePaid) {
      alert("¡Error de Consistencia! Una o más de las letras seleccionadas ya han sido marcadas como pagadas anteriormente.");
      return;
    }

    const baseReceiptNum = `RC-L${8000 + (db.recibos?.length || 0) + 1}`;
    let newRemainingDebt = activeClientPortfolio.deuda_restante;

    const newLetrasToInsert: Letra[] = [];
    const newRecibosToInsert: Recibo[] = [];

    if (selectedLetrasToPay.length > 0) {
      // Split payment proportionally or create a row for each paid letter
      const perLetterVal = Math.round(customPagoMonto / selectedLetrasToPay.length);

      selectedLetrasToPay.forEach((letraNum, idx) => {
        const rcNum = selectedLetrasToPay.length === 1 ? baseReceiptNum : `${baseReceiptNum}-${idx + 1}`;
        newRemainingDebt = Math.max(0, newRemainingDebt - perLetterVal);
        const calculatedState = newRemainingDebt <= 0 ? "Pagada" : "En pago";

        const newLetraItem: Letra = {
          casillero: activeClientPortfolio.casillero,
          numero_letras: activeClientPortfolio.letras_totales,
          fecha: pagoFecha,
          numero_letra_a_pagar: letraNum,
          forma_pago: pagoForma,
          recibo: rcNum,
          valor_letra: activeClientPortfolio.valor_letra,
          total_recibido: perLetterVal,
          deuda: newRemainingDebt,
          nombre: activeClientPortfolio.nombre,
          apellido: activeClientPortfolio.apellido,
          numero_documento: activeClientPortfolio.documento,
          telefono: activeClientPortfolio.telefono,
          correo: activeClientPortfolio.correo,
          direccion: activeClientPortfolio.direccion,
          motocicleta: activeClientPortfolio.motocicleta,
          motor: activeClientPortfolio.motor,
          chasis: activeClientPortfolio.chasis,
          color: activeClientPortfolio.color,
          valor: activeClientPortfolio.valor_moto,
          estado: calculatedState
        };

        const newRcItem: Recibo = {
          fecha: pagoFecha,
          numero_recibo: rcNum,
          recibo_de_pertenencia: `${activeClientPortfolio.nombre} ${activeClientPortfolio.apellido} (CC: ${activeClientPortfolio.documento})`,
          concepto: `Pago Letra #${letraNum} de ${activeClientPortfolio.letras_totales} (Casillero ${activeClientPortfolio.casillero})`,
          entrada: perLetterVal,
          salida: 0,
          estados_adicionales: `FORMA PAGO: ${pagoForma} • Moto: ${activeClientPortfolio.motocicleta}`
        };

        newLetrasToInsert.push(newLetraItem);
        newRecibosToInsert.push(newRcItem);
      });
    }

    const updatedLetras = [...newLetrasToInsert, ...(db.letras || [])];
    const updatedRecibos = [...newRecibosToInsert, ...(db.recibos || [])];
    
    const newEvent = {
      id: Date.now(),
      fecha: pagoFecha,
      hora: new Date().toLocaleTimeString(),
      usuario: user.nombre_completo,
      rol: user.rol,
      modulo: "Letras",
      accion: `Se registró el pago de ${selectedLetrasToPay.length} letra(s) (Letras: ${selectedLetrasToPay.join(", ")}) por $${customPagoMonto.toLocaleString()} para ${activeClientPortfolio.nombre} ${activeClientPortfolio.apellido}.`,
      prioridad: "VERDE" as const,
      campo: "Letras",
      valor_anterior: `Deuda: $${activeClientPortfolio.deuda_restante.toLocaleString()}`,
      valor_nuevo: `Deuda: $${newRemainingDebt.toLocaleString()}`,
      motivo: `Pago de letras programadas. Recibo #${baseReceiptNum}`,
      estado: "Aprobado"
    };

    setDb({
      ...db,
      letras: updatedLetras,
      recibos: updatedRecibos,
      eventos: [newEvent, ...(db.eventos || [])]
    });

    setShowPaymentModal(false);
    alert(`¡Pago de Letra(s) #${selectedLetrasToPay.join(", #")} registrado exitosamente!\nRecibo de Pago: ${baseReceiptNum}\nDeuda Restante: $${newRemainingDebt.toLocaleString()} COP`);
  };

  // Submit New Obligation / Contract
  const handleCreateObligationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCasillero.trim() || !newDocCliente.trim()) {
      alert("Por favor ingrese el Casillero y el Documento del Cliente.");
      return;
    }

    const totalDeudaContrato = newNumLetras * newValorLetra;

    // Create entry for initial obligation setup
    const newInitialRow: Letra = {
      casillero: newCasillero,
      numero_letras: newNumLetras,
      fecha: newFechaInicio,
      numero_letra_a_pagar: 1,
      forma_pago: "POR PAGAR",
      recibo: "PENDIENTE",
      valor_letra: newValorLetra,
      total_recibido: 0,
      deuda: totalDeudaContrato,
      nombre: newNombreCliente,
      apellido: newApellidoCliente,
      numero_documento: newDocCliente,
      telefono: newTelCliente,
      correo: newCorreoCliente,
      direccion: newDirCliente,
      motocicleta: newMoto,
      motor: newMotor,
      chasis: newChasis,
      color: newColor,
      valor: newValorMoto,
      estado: "Pendiente"
    };

    setDb({
      ...db,
      letras: [newInitialRow, ...(db.letras || [])]
    });

    setShowNewObligationModal(false);
    alert(`¡Nueva obligación de ${newNumLetras} letras registrada correctamente en Casillero ${newCasillero}!`);
  };

  // Auto-fill client data if document typed matches ClientePerfil
  const handleClientDocBlur = () => {
    if (!newDocCliente.trim() || !db.clientes_perfil) return;
    const match = db.clientes_perfil.find(c => c.numero_documento === newDocCliente.trim());
    if (match) {
      setNewNombreCliente(match.nombres);
      setNewApellidoCliente(match.apellidos);
      setNewTelCliente(match.telefono_principal);
      setNewCorreoCliente(match.correo_electronico);
      setNewDirCliente(match.direccion);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="modulo-letras">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">
              Hoja Maestra ERP
            </span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
              Control de Deuda y Secuencia de Letras
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase flex items-center space-x-2 mt-1">
            <Layers className="text-red-600" size={24} />
            <span>Módulo LETRA — Cartera Financiada por Casilleros</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Seguimiento de # Letras, Vencimientos, Cobros por Casillero, Pagos Simultáneos/Anticipados y Reducción Acumulativa de Deuda.
          </p>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab("expedientes")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "expedientes" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Expedientes por Casillero
            </button>
            <button
              onClick={() => setActiveTab("tabla21")}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "tabla21" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Hoja Excel Oficial (21 Cols)
            </button>
          </div>

          <button
            onClick={() => setShowNewObligationModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow-2xs transition-colors flex items-center space-x-1"
          >
            <PlusCircle size={15} />
            <span>Nueva Obligación / Letra</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="bg-red-50 text-red-600 p-3 rounded-xl">
            <TrendingDown size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cartera Activa Pendiente</span>
            <h3 className="text-base font-black text-slate-800 mt-0.5">
              ${stats.totalDeudaActiva.toLocaleString()} COP
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">{stats.totalClientesActivos} expedientes pendientes</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recaudo Total Acumulado</span>
            <h3 className="text-base font-black text-emerald-600 mt-0.5">
              ${stats.totalDineroRecaudado.toLocaleString()} COP
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">{lettersList.length} abonos registrados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
            <FolderOpen size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldadas / Pagadas</span>
            <h3 className="text-base font-black text-slate-800 mt-0.5">
              {stats.totalClientesSaldados} Obligaciones
            </h3>
            <span className="text-[10px] text-indigo-600 font-bold">Deuda $0 alcanzada</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center space-x-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <User size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expedientes</span>
            <h3 className="text-base font-black text-slate-800 mt-0.5">
              {stats.totalClientesTotales} Clientes
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Casilleros asignados</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
          <div className="relative w-full">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Cliente, Cédula, Casillero, Moto, Motor, Chasis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex items-center space-x-1 text-slate-600 font-medium">
            <span>Casillero:</span>
            <select
              value={selectedCasillero}
              onChange={(e) => setSelectedCasillero(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden"
            >
              <option value="TODOS">Todos los Casilleros</option>
              {casillerosList.map((c, i) => (
                <option key={i} value={c}>Casillero {c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 text-slate-600 font-medium">
            <span>Estado:</span>
            <select
              value={selectedEstadoFilter}
              onChange={(e) => setSelectedEstadoFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-hidden"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En pago">En pago</option>
              <option value="Pagada">Pagada (Saldada)</option>
              <option value="Con novedad">Con novedad</option>
            </select>
          </div>

          {activeTab === "tabla21" && (
            <div className="flex items-center space-x-1 text-slate-600 font-medium">
              <span>Desde:</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
              />
              <span>Hasta:</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
              />
            </div>
          )}

          {(searchTerm || selectedCasillero !== "TODOS" || selectedEstadoFilter !== "TODOS" || fechaInicio || fechaFin) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCasillero("TODOS");
                setSelectedEstadoFilter("TODOS");
                setFechaInicio("");
                setFechaFin("");
              }}
              className="text-xs text-red-600 underline font-medium hover:text-red-800 ml-1"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: EXPEDIENTES / CARTERA CARDS VIEW */}
      {activeTab === "expedientes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPortfolios.length > 0 ? (
              filteredPortfolios.map((p, idx) => {
                const isPagada = p.estado === "Pagada";

                return (
                  <div 
                    key={idx} 
                    className={`border rounded-2xl p-5 transition-all shadow-3xs space-y-4 ${
                      isPagada 
                        ? "bg-emerald-50/20 border-emerald-200" 
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                    }`}
                  >
                    {/* Header: Locker & Client Name */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-slate-800 text-white p-2.5 rounded-xl font-mono text-xs font-extrabold flex flex-col items-center">
                          <span className="text-[8px] text-slate-400 font-sans uppercase font-bold">Locker</span>
                          <span>{p.casillero}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">
                            {p.nombre} {p.apellido}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-bold font-mono">
                            CC: {p.documento} • Tel: {p.telefono}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Direct phone call button */}
                        <a 
                          href={`tel:${p.telefono}`} 
                          className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 px-2.5 rounded-lg border border-red-100 transition-colors"
                          title="Llamar para Cobro"
                        >
                          <Phone size={13} className="animate-pulse" />
                          <span>Cobrar</span>
                        </a>

                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isPagada 
                            ? "bg-emerald-100 text-emerald-800" 
                            : p.estado === "En pago"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {p.estado}
                        </span>
                      </div>
                    </div>

                    {/* Motorcycle & Financial Progress */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Motocicleta:</span>
                        <p className="font-bold text-slate-800 truncate">{p.motocicleta}</p>
                        <span className="text-[9px] text-slate-500 font-mono block">Chasis: {p.chasis || "N/A"}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Saldo Pendiente:</span>
                        <p className={`font-black font-mono text-sm ${isPagada ? "text-emerald-700" : "text-red-600"}`}>
                          ${p.deuda_restante.toLocaleString()}
                        </p>
                        <span className="text-[9px] text-slate-400 font-mono block">Deuda orig: ${(p.total_deuda_original).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Visual Progress Bar of Letters */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500">Secuencia de Letras Pagadas:</span>
                        <span className="text-slate-800 font-mono">{p.letras_pagadas.length} / {p.letras_totales} Letras</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isPagada ? "bg-emerald-500" : "bg-red-600"}`}
                          style={{ width: `${(p.letras_pagadas.length / p.letras_totales) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Sequential Letter Badges Grid */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Planes de Letras (1 a {p.letras_totales}):</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: p.letras_totales }, (_, i) => i + 1).map((num) => {
                          const isPaid = p.letras_pagadas.includes(num);

                          return (
                            <span 
                              key={num}
                              className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                                isPaid 
                                  ? "bg-emerald-100 border-emerald-200 text-emerald-800 line-through" 
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              L{num} {isPaid ? "✓" : `$${(p.valor_letra / 1000).toFixed(0)}k`}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Valor letra: <strong>${p.valor_letra.toLocaleString()}</strong>
                      </span>

                      {!isPagada && (
                        <button
                          onClick={() => handleOpenPaymentModal(p.documento)}
                          className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
                        >
                          <PlusCircle size={13} />
                          <span>Pagar Letra(s)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center p-12 bg-white rounded-2xl border border-slate-200 text-slate-400 italic">
                No se encontraron expedientes de cartera de letras que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL 21-COLUMN EXCEL SHEET VIEW */}
      {activeTab === "tabla21" && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-2 whitespace-nowrap">Col A<br/>CASILLERO</th>
                  <th className="p-2 whitespace-nowrap text-center">Col B<br/>NUMERO LETRAS</th>
                  <th className="p-2 whitespace-nowrap">Col C<br/>FECHA</th>
                  <th className="p-2 whitespace-nowrap text-center">Col D<br/># LETRA A PAGAR</th>
                  <th className="p-2 whitespace-nowrap">Col E<br/>FORMA DE PAGO</th>
                  <th className="p-2 whitespace-nowrap">Col F<br/>RECIBO</th>
                  <th className="p-2 whitespace-nowrap text-right">Col G<br/>VALOR LETRA</th>
                  <th className="p-2 whitespace-nowrap text-right text-emerald-700">Col H<br/>TOTAL RECIBIDO</th>
                  <th className="p-2 whitespace-nowrap text-right text-red-600">Col I<br/>DEUDA</th>
                  <th className="p-2 whitespace-nowrap">Col J<br/>NOMBRE</th>
                  <th className="p-2 whitespace-nowrap">Col K<br/>APELLIDO</th>
                  <th className="p-2 whitespace-nowrap font-mono">Col L<br/>DOCUMENTO</th>
                  <th className="p-2 whitespace-nowrap">Col M<br/>TELEFONO</th>
                  <th className="p-2 whitespace-nowrap">Col N<br/>CORREO</th>
                  <th className="p-2 whitespace-nowrap">Col O<br/>DIRECCION</th>
                  <th className="p-2 whitespace-nowrap">Col P<br/>MOTOCICLETA</th>
                  <th className="p-2 whitespace-nowrap">Col Q<br/>MOTOR</th>
                  <th className="p-2 whitespace-nowrap">Col R<br/>CHASIS</th>
                  <th className="p-2 whitespace-nowrap">Col S<br/>COLOR</th>
                  <th className="p-2 whitespace-nowrap text-right">Col T<br/>VALOR MOTO</th>
                  <th className="p-2 whitespace-nowrap text-center">Col U<br/>ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible21ColumnRows.length > 0 ? (
                  visible21ColumnRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="p-2 font-mono font-bold text-slate-800 bg-slate-50">{r.casillero}</td>
                      <td className="p-2 text-center font-mono">{r.numero_letras}</td>
                      <td className="p-2 font-mono text-slate-600">{r.fecha}</td>
                      <td className="p-2 text-center font-bold text-red-600 font-mono">#{r.numero_letra_a_pagar}</td>
                      <td className="p-2 whitespace-nowrap text-slate-700">{r.forma_pago}</td>
                      <td className="p-2 font-mono text-blue-700 font-bold">{r.recibo}</td>
                      <td className="p-2 text-right font-mono">${(r.valor_letra || 0).toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-700">${(r.total_recibido || 0).toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-bold text-red-600">${(r.deuda || 0).toLocaleString()}</td>
                      <td className="p-2 whitespace-nowrap">{r.nombre}</td>
                      <td className="p-2 whitespace-nowrap">{r.apellido}</td>
                      <td className="p-2 font-mono whitespace-nowrap font-semibold">{r.numero_documento}</td>
                      <td className="p-2 font-mono whitespace-nowrap">{r.telefono}</td>
                      <td className="p-2 text-slate-500 truncate max-w-[120px]" title={r.correo}>{r.correo}</td>
                      <td className="p-2 text-slate-500 truncate max-w-[120px]" title={r.direccion}>{r.direccion}</td>
                      <td className="p-2 font-semibold text-slate-800 whitespace-nowrap">{r.motocicleta}</td>
                      <td className="p-2 font-mono text-[10px] text-slate-500">{r.motor || "N/A"}</td>
                      <td className="p-2 font-mono text-[10px] text-slate-500">{r.chasis || "N/A"}</td>
                      <td className="p-2">{r.color}</td>
                      <td className="p-2 text-right font-mono">${(r.valor || 0).toLocaleString()}</td>
                      <td className="p-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          r.estado === "Pagada" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={21} className="p-8 text-center text-slate-400 italic">
                      No hay registros de letras que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-slate-400 italic">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Documento Maestro ERP — Fila 2 (Encabezados Columnas A-U), Registros activos desde Fila 3 en adelante.</span>
          </div>
        </div>
      )}

      {/* MODAL: MULTI-LETTER PAYMENT REGISTRATION */}
      {showPaymentModal && activeClientPortfolio && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator size={18} className="text-red-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  Registrar Pago de Letra — Casillero {activeClientPortfolio.casillero}
                </h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-black"
              >
                ×
              </button>
            </div>

            {/* Client summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Cliente:</span>
                <span className="font-extrabold text-slate-800">{activeClientPortfolio.nombre} {activeClientPortfolio.apellido}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Documento / Cédula:</span>
                <span className="font-mono text-slate-800">{activeClientPortfolio.documento}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 pt-1.5">
                <span className="text-slate-500 font-bold">Deuda Actual Pendiente:</span>
                <span className="font-black text-red-600 font-mono">${activeClientPortfolio.deuda_restante.toLocaleString()} COP</span>
              </div>
            </div>

            {/* Selection of Letters to Pay (Allows single, multi, or advance payment) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Seleccione las Letras a Cancelar en esta Operación:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {Array.from({ length: activeClientPortfolio.letras_totales }, (_, i) => i + 1).map((letraNum) => {
                  const isAlreadyPaid = activeClientPortfolio.letras_pagadas.includes(letraNum);
                  const isSelected = selectedLetrasToPay.includes(letraNum);

                  return (
                    <button
                      key={letraNum}
                      type="button"
                      disabled={isAlreadyPaid}
                      onClick={() => handleToggleLetterSelection(letraNum)}
                      className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                        isAlreadyPaid 
                          ? "bg-slate-100 border-slate-200 text-slate-300 line-through cursor-not-allowed"
                          : isSelected
                          ? "bg-red-600 border-red-700 text-white shadow-2xs scale-105"
                          : "bg-white border-slate-200 text-slate-700 hover:border-red-300"
                      }`}
                    >
                      Letra #{letraNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleRegisterPaymentSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Fecha de Pago</label>
                  <input
                    type="date"
                    required
                    value={pagoFecha}
                    onChange={(e) => setPagoFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Forma de Pago</label>
                  <select
                    value={pagoForma}
                    onChange={(e) => setPagoForma(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="TRANSFERENCIA BANCOLOMBIA">TRANSFERENCIA BANCOLOMBIA</option>
                    <option value="TRANSFERENCIA DAVIPLATA">TRANSFERENCIA DAVIPLATA</option>
                    <option value="CONSIGNACION BBVA">CONSIGNACION BBVA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Monto Total Recibido (COP)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={customPagoMonto || ""}
                  onChange={(e) => setCustomPagoMonto(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Observaciones</label>
                <textarea
                  value={pagoObservaciones}
                  onChange={(e) => setPagoObservaciones(e.target.value)}
                  placeholder="Detalles opcionales del recibo o cobro..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 h-16 text-xs focus:outline-hidden"
                />
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex justify-between items-center text-emerald-900 font-bold">
                <span>Nueva Deuda Restante:</span>
                <span className="font-mono text-sm">${Math.max(0, activeClientPortfolio.deuda_restante - customPagoMonto).toLocaleString()} COP</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-2xs flex items-center space-x-1"
                >
                  <Send size={13} />
                  <span>Confirmar y Generar Recibo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW FINANCING OBLIGATION */}
      {showNewObligationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleCreateObligationSubmit} className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">CREACIÓN DE CARTERA</span>
                <h3 className="text-base font-black text-slate-800">Nueva Obligación / Plan de Letras</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewObligationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-black"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Casillero Locker *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: A-15, C-02"
                  value={newCasillero}
                  onChange={(e) => setNewCasillero(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Letras *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newNumLetras}
                  onChange={(e) => setNewNumLetras(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor por Letra (COP) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={newValorLetra}
                  onChange={(e) => setNewValorLetra(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>
            </div>

            {/* Customer Details */}
            <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block">Información del Cliente (Col J-O)</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Documento Cédula *</label>
                  <input
                    type="text"
                    required
                    placeholder="Escriba Cédula..."
                    value={newDocCliente}
                    onChange={(e) => setNewDocCliente(e.target.value)}
                    onBlur={handleClientDocBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={newNombreCliente}
                    onChange={(e) => setNewNombreCliente(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={newApellidoCliente}
                    onChange={(e) => setNewApellidoCliente(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Teléfono Cobro *</label>
                  <input
                    type="text"
                    required
                    value={newTelCliente}
                    onChange={(e) => setNewTelCliente(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newCorreoCliente}
                    onChange={(e) => setNewCorreoCliente(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Dirección Residencia</label>
                  <input
                    type="text"
                    value={newDirCliente}
                    onChange={(e) => setNewDirCliente(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            {/* Motorcycle Details */}
            <div className="border-t border-slate-100 pt-3 space-y-3 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px] block">Información de la Motocicleta (Col P-T)</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Motocicleta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Yamaha XTZ 150"
                    value={newMoto}
                    onChange={(e) => setNewMoto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Motor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Número de Motor..."
                    value={newMotor}
                    onChange={(e) => setNewMotor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Chasis *</label>
                  <input
                    type="text"
                    required
                    placeholder="Número de Chasis..."
                    value={newChasis}
                    onChange={(e) => setNewChasis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Color</label>
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Valor Venta Moto (COP)</label>
                  <input
                    type="number"
                    value={newValorMoto}
                    onChange={(e) => setNewValorMoto(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center text-xs">
              <span>Monto Total del Plan de Financiación:</span>
              <span className="font-mono font-black text-amber-400 text-sm">
                ${(newNumLetras * newValorLetra).toLocaleString()} COP
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewObligationModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-2xs flex items-center space-x-1"
              >
                <SaveIcon size={14} />
                <span>Registrar Obligación</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SaveIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  );
}
