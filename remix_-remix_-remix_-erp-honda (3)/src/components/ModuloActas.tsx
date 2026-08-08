import React, { useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, User, Bike, Wallet, FileText, CheckCircle2, ShieldAlert, Award, FileCheck, DollarSign, Package, Tag, ShoppingBag, UserPlus } from "lucide-react";
import { DatabaseState, Usuario, Acta, MotoEnSala, Recibo, Matricula, Revision } from "../types";
import { getTodayDateString, registrarEvento, calcularInventarioGeneral, registrarTransferencia } from "../utils/db";
import ModalCrearCliente from "./ModalCrearCliente";

// Helper function to return intuitive category/product icon emojis
function getProductIcon(producto: string, marca: string): string {
  const p = (producto || "").toLowerCase();
  const m = (marca || "").toLowerCase();
  if (p.includes("casco") || m.includes("casco")) return "🪖";
  if (p.includes("chaleco") || m.includes("chaleco")) return "🦺";
  if (p.includes("aceite") || p.includes("lubricante") || m.includes("aceite") || m.includes("lubricantes")) return "🛢️";
  if (p.includes("llanta") || p.includes("neumatico") || p.includes("rueda")) return "🛞";
  if (p.includes("bateria")) return "🔋";
  if (p.includes("freno") || p.includes("pastilla") || p.includes("disco")) return "🛑";
  if (p.includes("guante")) return "🧤";
  if (p.includes("impermeable") || p.includes("chaqueta")) return "🧥";
  if (p.includes("cadena") || p.includes("arrastre")) return "⚙️";
  if (p.includes("filtro") || p.includes("bujia") || p.includes("repuesto") || p.includes("pieza")) return "🔧";
  return "📦";
}

// Smart Autocomplete Product Search Component for Inventory
interface SmartProductSearchProps {
  label?: string;
  placeholder?: string;
  stockList: ReturnType<typeof calcularInventarioGeneral>;
  selectedRef: string;
  onSelectProduct: (product: ReturnType<typeof calcularInventarioGeneral>[0] | null) => void;
  categoryFilter?: string;
}

function BuscadorInteligenteProducto({
  label,
  placeholder = "Escriba nombre, marca o referencia...",
  stockList,
  selectedRef,
  onSelectProduct,
  categoryFilter
}: SmartProductSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedProduct = stockList.find((s) => s.referencia === selectedRef);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = stockList.filter((item) => {
    if (categoryFilter) {
      const cat = categoryFilter.toLowerCase();
      const matchCat = item.producto.toLowerCase().includes(cat) || (item.marca_departamento || "").toLowerCase().includes(cat);
      if (!matchCat && !query.trim()) return false;
    }

    if (!query.trim()) return true;

    const q = query.trim().toLowerCase();
    const matchRef = item.referencia.toLowerCase().includes(q);
    const matchName = item.producto.toLowerCase().includes(q);
    const matchBrand = (item.marca_departamento || "").toLowerCase().includes(q);

    return matchRef || matchName || matchBrand;
  });

  return (
    <div className="relative w-full space-y-1.5 font-sans" ref={containerRef}>
      {label && <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-tight">{label}</label>}

      {selectedProduct ? (
        <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getProductIcon(selectedProduct.producto, selectedProduct.marca_departamento)}</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xs text-slate-800">{selectedProduct.producto}</span>
                <span className="bg-emerald-200 text-emerald-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                  REF: {selectedProduct.referencia}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium flex items-center space-x-2 mt-0.5">
                <span>Marca: <strong className="text-slate-700">{selectedProduct.marca_departamento || "General"}</strong></span>
                <span>•</span>
                <span>Stock: <strong className={`font-mono font-bold ${selectedProduct.stock > 0 ? "text-emerald-700" : "text-rose-600"}`}>{selectedProduct.stock} unid.</strong></span>
                <span>•</span>
                <span>Precio: <strong className="font-mono text-slate-800 font-bold">${selectedProduct.precio_venta.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectProduct(null);
              setQuery("");
            }}
            className="text-xs bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold px-2.5 py-1 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
            title="Cambiar o Quitar Selección"
          >
            ✕ Cambiar
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full bg-white border border-slate-200 focus:border-red-500 rounded-xl py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Results Popup */}
          {isOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
              <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Coincidencias en Inventario ({filteredItems.length})</span>
                <span>Referencia · Stock · Precio</span>
              </div>
              {filteredItems.slice(0, 15).map((item) => {
                const icon = getProductIcon(item.producto, item.marca_departamento);
                const hasStock = item.stock > 0;
                return (
                  <button
                    key={`prod-${item.referencia}`}
                    type="button"
                    onClick={() => {
                      onSelectProduct(item);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-slate-800 group-hover:text-red-600 transition-colors">
                            {item.producto}
                          </span>
                          {item.marca_departamento && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded-md uppercase">
                              {item.marca_departamento}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          REF: <strong className="text-slate-600">{item.referencia}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="font-mono text-xs font-black text-slate-800">
                        ${item.precio_venta.toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full font-mono mt-0.5 ${hasStock ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                        {hasStock ? `Disponible: ${item.stock}` : "Agotado: 0"}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No se encontraron productos coincidentes en el inventario.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Universal Selector for Additional Accessories
function BuscadorUniversalAccesorios({
  stockList,
  onAddAccessory
}: {
  stockList: ReturnType<typeof calcularInventarioGeneral>;
  onAddAccessory: (item: ReturnType<typeof calcularInventarioGeneral>[0], qty: number) => void;
}) {
  const [selectedProduct, setSelectedProduct] = useState<ReturnType<typeof calcularInventarioGeneral>[0] | null>(null);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-3 font-sans">
      <BuscadorInteligenteProducto
        label="Buscador Inteligente de Accesorios / Productos"
        placeholder="🔍 Escribe nombre, referencia (ej: CAS-001, REP-05) o marca..."
        stockList={stockList}
        selectedRef={selectedProduct?.referencia || ""}
        onSelectProduct={(prod) => {
          setSelectedProduct(prod);
          setQuantity(1);
        }}
      />

      {selectedProduct && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-2xs">
          <div className="text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Producto Seleccionado del Inventario</span>
            <span className="font-extrabold text-slate-800 text-xs">{selectedProduct.producto}</span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              Ref: <strong className="text-slate-700">{selectedProduct.referencia}</strong> · Precio Unit: <strong className="text-slate-700">${selectedProduct.precio_venta.toLocaleString()}</strong> · Disponible: <strong className="text-emerald-700 font-bold">{selectedProduct.stock} unid.</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="w-24">
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Cantidad</label>
              <input
                type="number"
                min="1"
                max={selectedProduct.stock || 999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-center"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedProduct) {
                  onAddAccessory(selectedProduct, quantity);
                  setSelectedProduct(null);
                  setQuantity(1);
                }
              }}
              className="mt-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Añadir al Ticket</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActasProps {
  user: Usuario;
  db: DatabaseState;
  setDb: (state: DatabaseState) => void;
  setView: (v: any) => void;
  setSelectedEntityId?: (id: string) => void;
  selectedEntityId?: string;
}

export default function ModuloActas({ user, db, setDb, setView, setSelectedEntityId, selectedEntityId }: ActasProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Acta | null>(null);

  // Auto-load client and launch wizard if selectedEntityId is provided
  React.useEffect(() => {
    if (selectedEntityId) {
      const doc = selectedEntityId.trim();
      if (doc) {
        setDocumento(doc);
        setShowWizard(true);
        setWizardStep(1);

        const actaMatch = db.actas.find((a) => a.documento === doc);
        const prevMatch = db.preventas.find((p) => p.cedula === doc);
        const revMatch = db.revisiones.find((r) => r.cedula === doc);

        if (actaMatch) {
          setNombres(actaMatch.nombres);
          setApellidos(actaMatch.apellidos);
          setCorreo(actaMatch.correo);
          setDireccion(actaMatch.direccion);
          setTelefono(actaMatch.telefono);
        } else if (prevMatch) {
          setNombres(prevMatch.nombre);
          setApellidos(prevMatch.apellido);
          setCorreo(prevMatch.correo);
          setDireccion(prevMatch.direccion);
          setTelefono(prevMatch.telefono);
          if (prevMatch.estado === "ACTIVA" || prevMatch.estado === "EN ESPERA" || prevMatch.estado === "PENDIENTE") {
            setAssociatedPreventaId(prevMatch.id_del_encargo);
            setPreventaAbono(prevMatch.total_abono);
            // reset new values
            setEfectivo(0);
            setTransferencia(0);
            setDesembolso(0);
          }
        } else if (revMatch) {
          setNombres(revMatch.nombre);
          setApellidos(revMatch.apellidos);
          setCorreo(revMatch.correo);
          setDireccion(revMatch.direccion);
          setTelefono(revMatch.telefono);
        }

        // Clear selection so returning to this tab won't re-trigger
        if (setSelectedEntityId) {
          setSelectedEntityId("");
        }
      }
    }
  }, [selectedEntityId]);

  // States for Abonos Adicionales form
  const [selectedActaForAbono, setSelectedActaForAbono] = useState<Acta | null>(null);
  const [newAbonoEfectivo, setNewAbonoEfectivo] = useState(0);
  const [newAbonoTransferencia, setNewAbonoTransferencia] = useState(0);
  const [newAbonoConsignacion, setNewAbonoConsignacion] = useState(0);
  const [newAbonoObservaciones, setNewAbonoObservaciones] = useState("");
  const [newAbonoManualRecibo, setNewAbonoManualRecibo] = useState(false);
  const [newAbonoManualReciboNo, setNewAbonoManualReciboNo] = useState("");

  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActaForAbono) return;

    const totalAbonoNuevo = newAbonoEfectivo + newAbonoTransferencia + newAbonoConsignacion;
    if (totalAbonoNuevo <= 0) {
      alert("Ingrese un valor de abono mayor a cero.");
      return;
    }

    let updatedDb = { ...db };
    const currentRecibos = updatedDb.recibos || [];
    let maxReciboNo = currentRecibos.reduce((max, r) => {
      const num = parseInt(r.numero_recibo) || 0;
      return num > max ? num : max;
    }, 10000);

    const recNo = newAbonoManualRecibo ? newAbonoManualReciboNo : String(maxReciboNo + 1);
    if (!recNo.trim()) {
      alert("Ingrese un número de recibo válido.");
      return;
    }

    // Verify duplicate receipt number
    const isDuplicate = currentRecibos.some(r => r.numero_recibo === recNo);
    if (isDuplicate) {
      alert("ALERTA: El número de recibo ya existe en el sistema.");
      return;
    }

    // Create the Receipt
    const concepts: string[] = [];
    if (newAbonoEfectivo > 0) concepts.push(`Efectivo ($${newAbonoEfectivo.toLocaleString()})`);
    if (newAbonoTransferencia > 0) concepts.push(`Transferencia ($${newAbonoTransferencia.toLocaleString()})`);
    if (newAbonoConsignacion > 0) concepts.push(`Consignación ($${newAbonoConsignacion.toLocaleString()})`);
    const finalConcept = `Abono Acta #${selectedActaForAbono.acta} (${concepts.join(" + ")})${newAbonoObservaciones ? ` - Obs: ${newAbonoObservaciones}` : ""}`;

    const newRec: Recibo = {
      fecha: getTodayDateString(),
      numero_recibo: recNo,
      recibo_de_pertenencia: `${selectedActaForAbono.nombres} ${selectedActaForAbono.apellidos}`,
      concepto: finalConcept,
      entrada: totalAbonoNuevo,
      salida: 0
    };

    // Update Acta
    const updatedActas = db.actas.map(a => {
      if (a.acta === selectedActaForAbono.acta) {
        const previousAbonos = a.abonos_adicionales || [];
        const newAbonoItem = {
          fecha: getTodayDateString(),
          efectivo: newAbonoEfectivo,
          transferencia: newAbonoTransferencia,
          consignacion: newAbonoConsignacion,
          observaciones: newAbonoObservaciones,
          numero_recibo: recNo
        };
        const updatedAbonos = [...previousAbonos, newAbonoItem];
        const newTotalRecibido = a.total_recibido + totalAbonoNuevo;
        const valorAccesorios = a.valor_accesorios || 0;
        const valorTotal = a.valor_moto + valorAccesorios;
        const newDeuda = Math.max(0, valorTotal - newTotalRecibido);

        return {
          ...a,
          abonos_adicionales: updatedAbonos,
          total_recibido: newTotalRecibido,
          deuda_actual: newDeuda,
          estado: newDeuda === 0 ? "Completa" : a.estado
        };
      }
      return a;
    });

    updatedDb.actas = updatedActas;
    updatedDb.recibos = [newRec, ...currentRecibos];

    // Log Event
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "ACTAS",
      "Actualizar",
      "VERDE",
      "Abono",
      selectedActaForAbono.acta,
      recNo,
      `Se registró un nuevo abono de $${totalAbonoNuevo.toLocaleString()} para el Acta #${selectedActaForAbono.acta} (Recibo: ${recNo}).`
    );

    setDb(updatedDb);
    setSelectedActaForAbono(null);
    setNewAbonoEfectivo(0);
    setNewAbonoTransferencia(0);
    setNewAbonoConsignacion(0);
    setNewAbonoObservaciones("");
    setNewAbonoManualRecibo(false);
    setNewAbonoManualReciboNo("");
    alert(`Abono registrado con éxito. Se asignó el Recibo #${recNo}.`);
  };

  // WIZARD STATE VARIABLES (18 Steps compressed into 4 Sections)
  const [showClientModal, setShowClientModal] = useState(false);
  // Section 1: Venta & Cliente (Steps 1-7)
  const [actaNo, setActaNo] = useState("");
  const [declaranteDian, setDeclaranteDian] = useState<"SI" | "NO">("NO");
  const [tipoDoc, setTipoDoc] = useState("CC");
  const [documento, setDocumento] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [telefono2, setTelefono2] = useState("");
  const [direccion, setDireccion] = useState("");
  const [correo, setCorreo] = useState("");
  const [vendedorSelected, setVendedorSelected] = useState(user.nombre_completo);

  // Section 2: Vehículo (Steps 8-9)
  const [motoSearchQuery, setMotoSearchQuery] = useState("");
  const [selectedMoto, setSelectedMoto] = useState<MotoEnSala | null>(null);
  const [valorMoto, setValorMoto] = useState(0);

  // Section 3: Caja & Recibos (Steps 10-12)
  const [efectivo, setEfectivo] = useState(0);
  const [transferencia, setTransferencia] = useState(0);
  const [desembolso, setDesembolso] = useState(0);
  const [plataformaDigital, setPlataformaDigital] = useState("");
  const [consultora, setConsultora] = useState("");
  const [associatedPreventaId, setAssociatedPreventaId] = useState("");
  const [preventaAbono, setPreventaAbono] = useState(0);

  // Section 4: Accesorios, Papelería & Cierre (Steps 13-17)
  const [accesorioPrincipal, setAccesorioPrincipal] = useState<"CASCO + CHALECO" | "CASCO" | "CHALECO" | "PENDIENTE">("PENDIENTE");
  const [selectedCascoRef, setSelectedCascoRef] = useState("");
  const [selectedChalecoRef, setSelectedChalecoRef] = useState("");
  const [reciboAccesorio, setReciboAccesorio] = useState("");
  const [papeleria, setPapeleria] = useState<"SI" | "NO">("NO");
  const [titularDocumentos, setTitularDocumentos] = useState("");
  // Additional parts accessory ticket
  const [selectedAddPartRef, setSelectedAddPartRef] = useState("");
  const [selectedAddPartQty, setSelectedAddPartQty] = useState(1);
  const [addedAccessories, setAddedAccessories] = useState<{ reference: string; quantity: number }[]>([]);
  const [accessorySearchQuery, setAccessorySearchQuery] = useState("");
  const [accessorySearchOpen, setAccessorySearchOpen] = useState(false);

  // New state variables for manual receipts in Paso 3
  const [newReceipts, setNewReceipts] = useState<{ numero_recibo: string; fecha: string; valor: number; observaciones: string }[]>([]);
  const [isAddingReceipt, setIsAddingReceipt] = useState(false);
  const [tempReceiptNo, setTempReceiptNo] = useState("");
  const [tempReceiptFecha, setTempReceiptFecha] = useState(getTodayDateString());
  const [tempReceiptValor, setTempReceiptValor] = useState(0);
  const [tempReceiptObservaciones, setTempReceiptObservaciones] = useState("");

  // Pago de Accesorios states
  const [accesorioEfectivo, setAccesorioEfectivo] = useState(0);
  const [accesorioTransferencia, setAccesorioTransferencia] = useState(0);

  const stockList = calcularInventarioGeneral(db);

  // Step 1 check if Acta already exists
  const handleActaNoBlur = () => {
    if (!actaNo.trim()) return;
    const exists = db.actas.some((a) => a.acta.trim() === actaNo.trim());
    if (exists) {
      alert("ALERTA ROJA: Ya existe un acta registrada con este número consecutivo.");
      setActaNo("");
    }
  };

  // Auto-complete client from database when document is typed
  const handleDocumentBlur = () => {
    const doc = documento.trim();
    if (!doc) return;

    // Search historical records
    const actaMatch = db.actas.find((a) => a.documento === doc);
    const prevMatch = db.preventas.find((p) => p.cedula === doc);
    const revMatch = db.revisiones.find((r) => r.cedula === doc);

    if (actaMatch) {
      setNombres(actaMatch.nombres);
      setApellidos(actaMatch.apellidos);
      setCorreo(actaMatch.correo);
      setDireccion(actaMatch.direccion);
      setTelefono(actaMatch.telefono);
    } else if (prevMatch) {
      setNombres(prevMatch.nombre);
      setApellidos(prevMatch.apellido);
      setCorreo(prevMatch.correo);
      setDireccion(prevMatch.direccion);
      setTelefono(prevMatch.telefono);
      // Auto-load matching active preventa
      if (prevMatch.estado === "ACTIVA") {
        setAssociatedPreventaId(prevMatch.id_del_encargo);
        setPreventaAbono(prevMatch.total_abono);
        setEfectivo(0);
        setTransferencia(0);
        setDesembolso(0);
        alert(`¡PREVENTA ENCONTRADA! Se pre-cargó el abono inicial de $${prevMatch.total_abono.toLocaleString()} de la preventa. En el Paso 3, podrá registrar nuevos abonos si el cliente realiza pagos adicionales.`);
      }
    } else if (revMatch) {
      setNombres(revMatch.nombre);
      setApellidos(revMatch.apellidos);
      setCorreo(revMatch.correo);
      setDireccion(revMatch.direccion);
      setTelefono(revMatch.telefono);
    }
  };

  // Search motorcycle in Showroom (Motos en Sala)
  const handleSearchMotorcycle = () => {
    const query = motoSearchQuery.trim().toLowerCase();
    if (!query) return;

    const match = db.motos_en_sala.find(
      (m) => m.numero_motor.toLowerCase() === query || m.numero_chasis.toLowerCase() === query
    );

    if (!match) {
      alert("La motocicleta con el número de motor o chasis ingresado no existe.");
      return;
    }

    if (match.vendida === "SI") {
      alert("ALERTA ROJA: Esta motocicleta ya fue vendida y no se puede facturar.");
      return;
    }

    setSelectedMoto(match);
    setValorMoto(match.precio);
  };

  // Add parts accessories
  const handleAddPartAccessory = () => {
    if (!selectedAddPartRef) return;
    const stockItem = stockList.find((s) => s.referencia === selectedAddPartRef);
    if (!stockItem || stockItem.stock < selectedAddPartQty) {
      alert("ALERTA: No hay suficiente stock de este accesorio.");
      return;
    }

    setAddedAccessories([...addedAccessories, { reference: selectedAddPartRef, quantity: selectedAddPartQty }]);
    setSelectedAddPartRef("");
    setSelectedAddPartQty(1);
    setAccessorySearchQuery("");
    setAccessorySearchOpen(false);
  };

  // Save the complete Sales Acta
  const handleSaveActa = () => {
    if (!actaNo || !documento || !nombres || !selectedMoto) {
      alert("Por favor rellene todos los datos obligatorios.");
      return;
    }

    const totalRecibido = preventaAbono + efectivo + transferencia + desembolso;
    let valorAccesorios = 0;
    const refList: string[] = [];

    if ((accesorioPrincipal === "CASCO" || accesorioPrincipal === "CASCO + CHALECO") && selectedCascoRef) {
      refList.push(`CASCO:${selectedCascoRef}`);
    }
    if ((accesorioPrincipal === "CHALECO" || accesorioPrincipal === "CASCO + CHALECO") && selectedChalecoRef) {
      refList.push(`CHALECO:${selectedChalecoRef}`);
    }
    
    addedAccessories.forEach((item) => {
      const p = stockList.find((s) => s.referencia === item.reference)!;
      if (p) {
        valorAccesorios += p.precio_venta * item.quantity;
        refList.push(p.referencia);
      }
    });

    const valorTotal = valorMoto + valorAccesorios;
    const deudaActual = Math.max(0, valorTotal - totalRecibido);

    // UNIFY RECEIPTS FOR DATOS ACTAS RECIBOS/PAGOS COLUMN:
    // Gather receipts from preventa
    const associatedPre = db.preventas.find((p) => p.id_del_encargo === associatedPreventaId);
    const preventaReceipts: { numero_recibo: string; valor: number }[] = [];
    if (associatedPre) {
      if (associatedPre.abonos_historial && associatedPre.abonos_historial.length > 0) {
        associatedPre.abonos_historial.forEach((ab) => {
          preventaReceipts.push({
            numero_recibo: ab.numero_recibo,
            valor: ab.valor
          });
        });
      } else if (associatedPre.total_abono > 0) {
        preventaReceipts.push({
          numero_recibo: associatedPre.recibos || "S/N",
          valor: associatedPre.total_abono
        });
      }
    }

    const preventaReceiptIds = preventaReceipts.map(r => r.numero_recibo.trim()).filter(Boolean);
    const newReceiptIds = newReceipts.map(r => r.numero_recibo.trim()).filter(Boolean);
    const allReceiptIds = [...preventaReceiptIds, ...newReceiptIds];
    
    let unifiedRecibosString = "";
    if (allReceiptIds.length > 0) {
      unifiedRecibosString = allReceiptIds.join("-");
    } else if (totalRecibido > 0) {
      // Fallback
      unifiedRecibosString = String(Math.floor(1000 + Math.random() * 9000));
    }

    const newActa: Acta = {
      fecha: getTodayDateString(),
      acta: actaNo,
      declarante: declaranteDian,
      declarante_dian: declaranteDian,
      tipo_documento: tipoDoc,
      documento,
      nombres,
      apellidos,
      telefono,
      telefono_2: telefono2,
      direccion,
      correo,
      moto: selectedMoto.motocicleta,
      color: selectedMoto.color,
      modelo: selectedMoto.modelo,
      motor: selectedMoto.numero_motor,
      chasis: selectedMoto.numero_chasis,
      cilindraje: selectedMoto.cilindraje,
      valor_moto: valorMoto,
      recibos: unifiedRecibosString, // unified list of receipts hyphen-separated
      abono_preventa: preventaAbono,
      efectivo,
      transferencia,
      plataforma_digital: plataformaDigital,
      desembolso,
      consultora,
      total_recibido: totalRecibido,
      accesorio_principal: accesorioPrincipal,
      recibo_accesorio: reciboAccesorio,
      accesorios_adicionales: addedAccessories.map((a) => stockList.find((s) => s.referencia === a.reference)!.producto).join(", "),
      referencias: refList.join(", "),
      valor_accesorios: valorAccesorios, // Valor Total is valor_accesorios
      valor_recibido_accesorios: accesorioEfectivo + accesorioTransferencia, // Valor Recibido sum of efectivo + transferencia
      papeleria,
      titular_documentos: titularDocumentos || `${nombres} ${apellidos}`,
      rango: "", // Plate range starts empty
      todo_lo_recibido_en_acta: totalRecibido + (accesorioEfectivo + accesorioTransferencia),
      estado: "Pendiente",
      deuda_actual: deudaActual,
      vendedor: vendedorSelected
    };

    let updatedDb = { ...db };

    // 0. Register new payments to the historical "recibos" table for complete auditing
    const currentRecibos = updatedDb.recibos || [];
    let maxReciboNo = currentRecibos.reduce((max, r) => {
      const num = parseInt(r.numero_recibo) || 0;
      return num > max ? num : max;
    }, 10000);

    if (newReceipts.length > 0) {
      // Register manually added receipts
      const manualAuditReceipts = newReceipts.map((r) => ({
        fecha: r.fecha || getTodayDateString(),
        numero_recibo: r.numero_recibo,
        recibo_de_pertenencia: `Acta #${actaNo}`,
        concepto: `Abono Acta #${actaNo} - ${r.observaciones || "Pago registrado en paso 3"}`,
        entrada: r.valor,
        salida: 0
      }));
      updatedDb.recibos = [...manualAuditReceipts, ...currentRecibos];
    } else {
      // Fallback
      if (efectivo > 0) {
        maxReciboNo += 1;
        updatedDb.recibos = [
          ...currentRecibos,
          {
            fecha: getTodayDateString(),
            numero_recibo: String(maxReciboNo),
            recibo_de_pertenencia: `Acta #${actaNo}`,
            concepto: `Abono nuevo en efectivo por venta de moto ${selectedMoto.motocicleta} (Chasis: ${selectedMoto.numero_chasis})`,
            entrada: efectivo,
            salida: 0
          }
        ];
      }

      if (transferencia > 0) {
        maxReciboNo += 1;
        updatedDb.recibos = [
          ...updatedDb.recibos,
          {
            fecha: getTodayDateString(),
            numero_recibo: String(maxReciboNo),
            recibo_de_pertenencia: `Acta #${actaNo}`,
            concepto: `Abono nuevo por transferencia por venta de moto ${selectedMoto.motocicleta} (Chasis: ${selectedMoto.numero_chasis})`,
            entrada: transferencia,
            salida: 0
          }
        ];
      }

      if (desembolso > 0) {
        maxReciboNo += 1;
        updatedDb.recibos = [
          ...updatedDb.recibos,
          {
            fecha: getTodayDateString(),
            numero_recibo: String(maxReciboNo),
            recibo_de_pertenencia: `Acta #${actaNo}`,
            concepto: `Abono nuevo por desembolso de crédito por venta de moto ${selectedMoto.motocicleta} (Chasis: ${selectedMoto.numero_chasis})`,
            entrada: desembolso,
            salida: 0
          }
        ];
      }
    }

    // Generate Transfer Audit Event if applicable (for main vehicle purchase)
    if (transferencia > 0) {
      updatedDb = registrarTransferencia(
        updatedDb,
        "ACTAS MOTO",
        `Acta #${actaNo}`,
        transferencia,
        `Pago por transferencia por compra de motocicleta ${selectedMoto.motocicleta} (Chasis: ${selectedMoto.numero_chasis}) - Acta #${actaNo}`,
        user.usuario
      );
    }

    // Generate Transfer Audit Event if applicable (for accessories purchase)
    if (accesorioTransferencia > 0) {
      updatedDb = registrarTransferencia(
        updatedDb,
        "ACTAS ACCESORIOS",
        `Acta #${actaNo}`,
        accesorioTransferencia,
        `Pago por transferencia por accesorios adicionales - Acta #${actaNo}`,
        user.usuario
      );
    }

    // 1. Mark motorcycle as sold in MOTOS EN SALA and record date
    updatedDb.motos_en_sala = updatedDb.motos_en_sala.map((m) => {
      if (m.numero_chasis === selectedMoto.numero_chasis) {
        return {
          ...m,
          vendida: "SI" as const,
          salida: "Vendida",
          fecha_salida: getTodayDateString()
        };
      }
      return m;
    });

    // 2. Mark associated Preventa as FINALIZADA (if used)
    if (associatedPreventaId) {
      updatedDb.preventas = updatedDb.preventas.map((p) => {
        if (p.id_del_encargo === associatedPreventaId) {
          return {
            ...p,
            estado: "FINALIZADA" as const,
            fecha_salida: getTodayDateString()
          };
        }
        return p;
      });
    }

    // 3. Subtract added accessories & main factory accessories (Casco/Chaleco) from stock
    if ((accesorioPrincipal === "CASCO" || accesorioPrincipal === "CASCO + CHALECO") && selectedCascoRef) {
      const cascoCatalog = stockList.find((s) => s.referencia === selectedCascoRef);
      if (cascoCatalog) {
        updatedDb.salida_de_repuestos.push({
          fecha: getTodayDateString(),
          referencia: selectedCascoRef,
          producto: cascoCatalog.producto,
          marca_departamento: cascoCatalog.marca_departamento,
          cantidad: 1,
          formas_de_pago: "Efectivo",
          efectivo: 0,
          transferencia: 0,
          precio: cascoCatalog.precio_venta,
          valor_total: 0
        });
      }
    }

    if ((accesorioPrincipal === "CHALECO" || accesorioPrincipal === "CASCO + CHALECO") && selectedChalecoRef) {
      const chalecoCatalog = stockList.find((s) => s.referencia === selectedChalecoRef);
      if (chalecoCatalog) {
        updatedDb.salida_de_repuestos.push({
          fecha: getTodayDateString(),
          referencia: selectedChalecoRef,
          producto: chalecoCatalog.producto,
          marca_departamento: chalecoCatalog.marca_departamento,
          cantidad: 1,
          formas_de_pago: "Efectivo",
          efectivo: 0,
          transferencia: 0,
          precio: chalecoCatalog.precio_venta,
          valor_total: 0
        });
      }
    }

    const totalAccRecibido = accesorioEfectivo + accesorioTransferencia;
    addedAccessories.forEach((item) => {
      const catalog = stockList.find((s) => s.referencia === item.reference)!;
      const itemTotal = catalog.precio_venta * item.quantity;
      
      let itemEfectivo = 0;
      let itemTransferencia = 0;
      if (totalAccRecibido > 0) {
        itemEfectivo = Math.round((accesorioEfectivo / totalAccRecibido) * itemTotal);
        itemTransferencia = itemTotal - itemEfectivo;
      } else {
        // Default to efectivo if no payment registered yet
        itemEfectivo = itemTotal;
      }
      
      let itemFormas: "Efectivo" | "Transferencia" | "Mixto" = "Efectivo";
      if (accesorioEfectivo > 0 && accesorioTransferencia > 0) {
        itemFormas = "Mixto";
      } else if (accesorioTransferencia > 0) {
        itemFormas = "Transferencia";
      }

      updatedDb.salida_de_repuestos.push({
        fecha: getTodayDateString(),
        referencia: item.reference,
        producto: catalog.producto,
        marca_departamento: catalog.marca_departamento,
        cantidad: item.quantity,
        formas_de_pago: itemFormas,
        efectivo: itemEfectivo,
        transferencia: itemTransferencia,
        precio: catalog.precio_venta,
        valor_total: itemTotal
      });
    });

    // 4. Populate pre-filled record in MATRÍCULAS PARA TRANSITO as Pendiente
    const newMatricula: Matricula = {
      fecha: getTodayDateString(),
      rango: "",
      nombre: nombres,
      apellidos,
      tipo_documento: tipoDoc,
      documento,
      celular: telefono,
      motocicleta: selectedMoto.motocicleta,
      motor: selectedMoto.numero_motor,
      chasis: selectedMoto.numero_chasis,
      modelo: selectedMoto.modelo,
      cilindraje: selectedMoto.cilindraje,
      ciudad: "Planadas",
      transito: "Secretaría de Tránsito Planadas",
      impuesto: 150000,
      valor: 320000,
      notas: "Pre-llenado de matrícula pendiente de asignación de placa",
      estado: "Pendiente"
    };
    updatedDb.matriculas = [...updatedDb.matriculas, newMatricula];

    // 5. Pre-fill records in REVISIONES
    const newRevision: Revision = {
      km: "0",
      razon: "Primera revisión de fábrica (Garantía)",
      mes: "ENERO",
      estado: "Pendiente",
      fecha_compra: getTodayDateString(),
      fecha_servicio: "",
      nombre: nombres,
      apellidos,
      cedula: documento,
      correo,
      direccion,
      telefono,
      moto: selectedMoto.motocicleta,
      motor: selectedMoto.numero_motor,
      chasis: selectedMoto.numero_chasis,
      modelo: selectedMoto.modelo,
      color: selectedMoto.color,
      cilindraje: selectedMoto.cilindraje,
      placa: "",
      ciudad: "Planadas"
    };
    updatedDb.revisiones = [...updatedDb.revisiones, newRevision];

    // 5.5 Auto-create Credit Study reference if there is a credit desembolso
    if (desembolso > 0) {
      const maxNo = (updatedDb.referencias_estudios || []).reduce((max, r) => r.no > max ? r.no : max, 0);
      const nextNo = maxNo + 1;
      const newCreditStudy = {
        no: nextNo,
        documento,
        nombres_completos_cliente: `${nombres} ${apellidos}`,
        nombre_referencia_1: "Pendiente",
        direccion_1: "",
        barrio_1: "",
        telefono_1: "",
        nombre_referencia_2: "Pendiente",
        direccion_2: "",
        barrio_2: "",
        telefono_2: "",
        plataforma: "SUFI",
        acta: actaNo
      };
      updatedDb.referencias_estudios = [...(updatedDb.referencias_estudios || []), newCreditStudy];
    }

    // 6. Log Events (Red Event if price or values changed, Yellow otherwise)
    const isPriceChanged = valorMoto !== selectedMoto.precio;
    updatedDb = registrarEvento(
      updatedDb,
      user,
      "ACTAS",
      "Crear",
      isPriceChanged ? "ROJA" : "AMARILLA",
      "Acta",
      "",
      actaNo,
      `Venta oficial cerrada. Acta #${actaNo}. Motocicleta: ${selectedMoto.motocicleta}.` +
      (isPriceChanged ? ` ¡Alerta: Precio moto modificado de $${selectedMoto.precio} a $${valorMoto}!` : "")
    );

    // Save database
    const newComision = {
      fecha: getTodayDateString(),
      moto: `${selectedMoto.motocicleta} (Chasis: ${selectedMoto.numero_chasis})`,
      valor: valorMoto,
      porcentaje_iva: 19,
      valor_iva: Math.round(valorMoto * 0.19),
      valor_sin_iva: valorMoto - Math.round(valorMoto * 0.19),
      porcentaje_ganancia: 1.5,
      valor_ganancia: Math.round((valorMoto - Math.round(valorMoto * 0.19)) * 0.015),
      vendedor: vendedorSelected || user.nombre_completo,
      acta_consecutivo: actaNo
    };
    updatedDb.comisiones = [newComision, ...(updatedDb.comisiones || [])];

    updatedDb.actas = [newActa, ...updatedDb.actas];
    setDb(updatedDb);
    setShowWizard(false);
    resetWizard();
    alert(`Acta de entrega #${actaNo} cerrada y archivada exitosamente. Se pre-llenaron los módulos de Matrículas, Revisiones, Salida de Repuestos y Comisiones.`);
  };

  const resetWizard = () => {
    setActaNo("");
    setDeclaranteDian("NO");
    setTipoDoc("CC");
    setDocumento("");
    setNombres("");
    setApellidos("");
    setTelefono("");
    setTelefono2("");
    setDireccion("");
    setCorreo("");
    setVendedorSelected(user.nombre_completo);
    setMotoSearchQuery("");
    setSelectedMoto(null);
    setValorMoto(0);
    setEfectivo(0);
    setTransferencia(0);
    setDesembolso(0);
    setPlataformaDigital("");
    setConsultora("");
    setAssociatedPreventaId("");
    setPreventaAbono(0);
    setAccesorioPrincipal("PENDIENTE");
    setReciboAccesorio("");
    setPapeleria("NO");
    setTitularDocumentos("");
    setAddedAccessories([]);
    setNewReceipts([]);
    setIsAddingReceipt(false);
    setTempReceiptNo("");
    setTempReceiptFecha(getTodayDateString());
    setTempReceiptValor(0);
    setTempReceiptObservaciones("");
    setAccesorioEfectivo(0);
    setAccesorioTransferencia(0);
    setWizardStep(1);
  };

  // Filter list
  const filteredActas = db.actas.filter((item) => {
    return item.acta.includes(searchTerm) ||
           item.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.documento.includes(searchTerm);
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-4 font-sans">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Módulo de Actas de Entrega</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y archivo oficial del despacho de motocicletas. Es el centro operativo principal del sistema.
          </p>
        </div>
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors flex items-center space-x-2 self-start sm:self-center"
          >
            <Plus size={16} />
            <span>Crear Nueva Acta (Wizard)</span>
          </button>
        )}
      </div>

      {showWizard ? (
        /* WIZARD LAYOUT */
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b pb-3 mb-4">
            <button type="button" onClick={() => { setShowWizard(false); resetWizard(); }} className="hover:text-slate-800 flex items-center space-x-1">
              <ChevronLeft size={14} /> <span>Volver al Listado</span>
            </button>
            <span className="text-red-600 font-bold uppercase tracking-wider">
              Asistente de Registro: Paso {wizardStep} de 4
            </span>
          </div>

          {/* Stepper Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
            <div className={`h-full bg-red-600 transition-all duration-300 ${wizardStep === 1 ? "w-1/4" : wizardStep === 2 ? "w-2/4" : wizardStep === 3 ? "w-3/4" : "w-full"}`}></div>
          </div>

          {/* STEP 1: Datos Cliente */}
          {wizardStep === 1 && (
            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100 animate-fade-in">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <User size={16} className="text-red-500" />
                <span>Paso 1: Información de Venta & Cliente</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Acta Consecutivo No. *</label>
                  <input
                    type="text"
                    required
                    value={actaNo}
                    onChange={(e) => setActaNo(e.target.value)}
                    onBlur={handleActaNoBlur}
                    placeholder="e.g. 10002"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Declarante DIAN</label>
                  <select
                    value={declaranteDian}
                    onChange={(e: any) => setDeclaranteDian(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                  >
                    <option value="NO">NO (Persona Natural)</option>
                    <option value="SI">SI (Facturación Electrónica)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Documento</label>
                  <select
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="NIT">NIT (Empresas)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600">Documento Identidad *</label>
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Crear / Buscar Cliente</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    onBlur={handleDocumentBlur}
                    placeholder="Ingrese documento o busque en perfil"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombres *</label>
                    <input
                      type="text"
                      required
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Apellidos</label>
                    <input
                      type="text"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Celular Principal</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Celular Secundario (Teléfono 2)</label>
                  <input
                    type="text"
                    value={telefono2}
                    onChange={(e) => setTelefono2(e.target.value)}
                    placeholder="Manual (Opcional)"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección de Residencia</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Vehículo */}
          {wizardStep === 2 && (
            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100 animate-fade-in">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Bike size={16} className="text-red-500" />
                <span>Paso 2: Selección del Vehículo de Sala</span>
              </h3>

              <div className="flex items-end space-x-2 bg-white p-4 rounded-lg border">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar por Motor o Chasis de Motocicleta</label>
                  <input
                    type="text"
                    value={motoSearchQuery}
                    onChange={(e) => setMotoSearchQuery(e.target.value)}
                    placeholder="e.g. MOTOR-XR150L-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchMotorcycle}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-4 rounded"
                >
                  Consultar Stock
                </button>
              </div>

              {selectedMoto && (
                <div className="bg-white p-5 rounded-lg border border-red-100 space-y-4">
                  <h4 className="font-bold text-red-600 text-xs uppercase tracking-wide">Motocicleta Encontrada</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
                    <div>
                      <span className="text-slate-400">Modelo comercial:</span>
                      <p className="text-slate-800 font-bold">{selectedMoto.motocicleta}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Año Modelo:</span>
                      <p className="text-slate-800 font-bold">{selectedMoto.modelo}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Color:</span>
                      <p className="text-slate-800 font-bold">{selectedMoto.color}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Cilindraje:</span>
                      <p className="text-slate-800 font-bold">{selectedMoto.cilindraje} cc</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">No. Motor:</span>
                      <p className="text-slate-800 font-mono font-bold">{selectedMoto.numero_motor}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">No. Chasis:</span>
                      <p className="text-slate-800 font-mono font-bold">{selectedMoto.numero_chasis}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Venta Motocicleta ($) *</label>
                    <input
                      type="number"
                      required
                      value={valorMoto}
                      onChange={(e) => setValorMoto(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono font-bold"
                    />
                    {valorMoto !== selectedMoto.precio && (
                      <p className="text-[10px] text-yellow-600 font-semibold mt-1">
                        INFO: El precio de venta difiere del precio base de stock (${selectedMoto.precio.toLocaleString()}). Esto generará una alerta de auditoría.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Caja & Recibos */}
          {wizardStep === 3 && (
            <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-100 animate-fade-in">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Wallet size={16} className="text-red-500" />
                <span>Paso 3: Caja, Abonos & Financiación</span>
              </h3>

              {associatedPreventaId ? (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200/60 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-green-800">
                    <span>Sincronizado con Preventa activa <strong>#{associatedPreventaId}</strong></span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Abono Inicial Seguro</span>
                  </div>
                  <p className="text-[11px] text-green-700 font-medium">
                    Esta venta ya tiene un abono de preventa por valor de <strong className="font-mono">${preventaAbono.toLocaleString()}</strong>.
                    Por favor, registre a continuación únicamente si el cliente va a aportar un <strong>nuevo pago adicional hoy</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-100 p-3 rounded-lg text-slate-500 text-[11px] font-semibold">
                  Esta venta no registra preventa previa vinculada. Ingrese los abonos del día directamente abajo.
                </div>
              )}

              {/* BLOQUE CONSOLIDADO DE CAPTURA DE PAGOS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  Registro de Valores Recibidos y Recibos Correspondientes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Efectivo recibido ($)</label>
                    <input
                      type="number"
                      value={efectivo}
                      onChange={(e) => setEfectivo(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-green-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Transferencia recibida ($)</label>
                    <input
                      type="number"
                      value={transferencia}
                      onChange={(e) => setTransferencia(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-green-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Desembolso ($)</label>
                    <input
                      type="number"
                      value={desembolso}
                      onChange={(e) => setDesembolso(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-green-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Plataforma Digital (Bancos)</label>
                    <input
                      type="text"
                      value={plataformaDigital}
                      onChange={(e) => setPlataformaDigital(e.target.value)}
                      placeholder="Ej: Bancolombia, Nequi, Daviplata"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-hidden focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Entidad / Consultora de Crédito</label>
                    <input
                      type="text"
                      value={consultora}
                      onChange={(e) => setConsultora(e.target.value)}
                      placeholder="e.g. SUFI, Finandina (Opcional)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center space-y-1.5 shadow-xs">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      <span>(-) Abono Inicial Preventa:</span>
                      <span className="font-mono text-slate-600 font-extrabold">${preventaAbono.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      <span>(+) Nuevos Abonos Acta:</span>
                      <span className="font-mono text-slate-600 font-extrabold">${(efectivo + transferencia + desembolso).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-150 pt-1.5 text-slate-800 font-black uppercase text-xs">
                      <span>Total Abonos Recibidos:</span>
                      <span className="font-mono text-red-600 text-sm">${(preventaAbono + efectivo + transferencia + desembolso).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Recibo(s) correspondientes block */}
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Recibo(s) correspondientes</span>
                    {!isAddingReceipt && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingReceipt(true);
                          const currentRecibos = db.recibos || [];
                          const maxDbNo = currentRecibos.reduce((max, r) => {
                            const num = parseInt(r.numero_recibo) || 0;
                            return num > max ? num : max;
                          }, 10000);
                          const maxNewNo = newReceipts.reduce((max, r) => {
                            const num = parseInt(r.numero_recibo) || 0;
                            return num > max ? num : max;
                          }, 0);
                          const nextSuggested = String(Math.max(maxDbNo, maxNewNo) + 1);
                          setTempReceiptNo(nextSuggested);
                          setTempReceiptFecha(getTodayDateString());
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-dashed border-red-300 hover:border-red-500 bg-red-50/50 hover:bg-red-50 text-red-600 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <span>+ Agregar Recibo</span>
                      </button>
                    )}
                  </div>

                  {isAddingReceipt && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <h5 className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Detalles del Nuevo Recibo</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Número de Recibo *</label>
                          <input
                            type="text"
                            required
                            value={tempReceiptNo}
                            onChange={(e) => setTempReceiptNo(e.target.value)}
                            placeholder="e.g. 1270"
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Fecha *</label>
                          <input
                            type="date"
                            required
                            value={tempReceiptFecha}
                            onChange={(e) => setTempReceiptFecha(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Valor ($) *</label>
                          <input
                            type="number"
                            required
                            value={tempReceiptValor || ""}
                            onChange={(e) => setTempReceiptValor(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-mono font-bold text-green-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Observaciones</label>
                        <input
                          type="text"
                          value={tempReceiptObservaciones}
                          onChange={(e) => setTempReceiptObservaciones(e.target.value)}
                          placeholder="Ej: Pago de saldo en efectivo, consignación..."
                          className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingReceipt(false);
                            setTempReceiptNo("");
                            setTempReceiptValor(0);
                            setTempReceiptObservaciones("");
                          }}
                          className="px-3 py-1.5 border border-slate-200 text-slate-500 font-semibold text-[11px] rounded-lg hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!tempReceiptNo.trim() || tempReceiptValor <= 0) {
                              alert("Por favor ingrese un número de recibo válido y un valor mayor a cero.");
                              return;
                            }
                            const existsInNew = newReceipts.some(r => r.numero_recibo.trim() === tempReceiptNo.trim());
                            const existsInDb = (db.recibos || []).some(r => r.numero_recibo.trim() === tempReceiptNo.trim());
                            if (existsInNew || existsInDb) {
                              alert("ALERTA: Este número de recibo ya existe en el sistema.");
                              return;
                            }

                            setNewReceipts([
                              ...newReceipts,
                              {
                                numero_recibo: tempReceiptNo.trim(),
                                fecha: tempReceiptFecha,
                                valor: tempReceiptValor,
                                observaciones: tempReceiptObservaciones.trim()
                              }
                            ]);

                            setTempReceiptNo("");
                            setTempReceiptValor(0);
                            setTempReceiptObservaciones("");
                            setIsAddingReceipt(false);
                          }}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg"
                        >
                          Confirmar Recibo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* READ-ONLY HISTORY AND SUMMARY OF RECEIPTS */}
              <div className="bg-slate-100/80 p-5 rounded-xl border border-slate-200/60 space-y-4">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck size={14} className="text-slate-600" />
                  Historial y Resumen de Recibos de Caja (Lectura)
                </h4>

                {/* Recibos provenientes de Preventas */}
                {(() => {
                  const associatedPre = db.preventas.find((p) => p.id_del_encargo === associatedPreventaId);
                  const preventaReceipts: { numero_recibo: string; valor: number }[] = [];
                  if (associatedPre) {
                    if (associatedPre.abonos_historial && associatedPre.abonos_historial.length > 0) {
                      associatedPre.abonos_historial.forEach((ab) => {
                        preventaReceipts.push({
                          numero_recibo: ab.numero_recibo,
                          valor: ab.valor
                        });
                      });
                    } else if (associatedPre.total_abono > 0) {
                      preventaReceipts.push({
                        numero_recibo: associatedPre.recibos || "S/N",
                        valor: associatedPre.total_abono
                      });
                    }
                  }

                  return (
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-150">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recibos provenientes de Preventas</span>
                      {preventaReceipts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {preventaReceipts.map((rec, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Recibo</span>
                              <span className="font-mono text-xs font-black text-slate-700">{rec.numero_recibo}</span>
                              <span className="font-mono text-xs font-bold text-emerald-600 border-t border-dashed border-slate-200 mt-1 pt-1">${rec.valor.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No se registran recibos de preventa vinculados.</p>
                      )}
                    </div>
                  );
                })()}

                {/* Nuevos Recibos de esta Acta */}
                <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nuevos recibos de esta Acta</span>
                  {newReceipts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                      {newReceipts.map((rec, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex justify-between items-start">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1">
                              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wide">Recibo</span>
                              <span className="font-mono text-xs font-black text-slate-800">{rec.numero_recibo}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium">Fecha: {rec.fecha}</p>
                            {rec.observaciones && <p className="text-[9px] text-slate-500 italic">Obs: {rec.observaciones}</p>}
                          </div>
                          <div className="text-right flex flex-col justify-between h-full items-end">
                            <button
                              type="button"
                              onClick={() => {
                                setNewReceipts(newReceipts.filter((_, i) => i !== idx));
                              }}
                              className="text-slate-400 hover:text-red-500 text-xs p-0.5 cursor-pointer"
                              title="Eliminar Recibo"
                            >
                              ✕
                            </button>
                            <span className="font-mono text-xs font-bold text-emerald-600 mt-1">${rec.valor.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No se han registrado nuevos recibos para esta acta.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Accesorios, Papelería & Cierre */}
          {wizardStep === 4 && (
            <div className="space-y-5 bg-slate-50 p-6 rounded-xl border border-slate-100 animate-fade-in font-sans">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <FileText size={16} className="text-red-500" />
                <span>Paso 4: Accesorios Incluidos, Papelería & Cierre</span>
              </h3>

              {/* ASESORIO PRINCIPAL DE FÁBRICA */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <Package size={15} className="text-red-500" />
                  <span>Accesorio Principal de Fábrica (ASESORIO)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Accesorio Principal de Fábrica
                    </label>
                    <select
                      value={accesorioPrincipal}
                      onChange={(e: any) => setAccesorioPrincipal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:border-red-500"
                    >
                      <option value="CASCO + CHALECO">CASCO + CHALECO</option>
                      <option value="CASCO">CASCO</option>
                      <option value="CHALECO">CHALECO</option>
                      <option value="PENDIENTE">PENDIENTE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      No. Recibo Especial de Accesorios
                    </label>
                    <input
                      type="text"
                      value={reciboAccesorio}
                      onChange={(e) => setReciboAccesorio(e.target.value)}
                      placeholder="e.g. ACC-5002"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Referencia de Casco con Buscador Inteligente */}
                {(accesorioPrincipal === "CASCO" || accesorioPrincipal === "CASCO + CHALECO") && (
                  <div className="pt-2">
                    <BuscadorInteligenteProducto
                      label="🪖 Seleccionar Casco de Fábrica (Buscador Inteligente)"
                      placeholder="🔎 Escriba nombre del casco o referencia (ej: cas, CAS-001, HJC)..."
                      stockList={stockList}
                      selectedRef={selectedCascoRef}
                      onSelectProduct={(product) => {
                        setSelectedCascoRef(product ? product.referencia : "");
                      }}
                      categoryFilter="CASCO"
                    />
                  </div>
                )}

                {/* Referencia de Chaleco con Buscador Inteligente */}
                {(accesorioPrincipal === "CHALECO" || accesorioPrincipal === "CASCO + CHALECO") && (
                  <div className="pt-2">
                    <BuscadorInteligenteProducto
                      label="🦺 Seleccionar Chaleco de Fábrica (Buscador Inteligente)"
                      placeholder="🔎 Escriba nombre del chaleco o referencia (ej: chal, CHAL-001, Reflectivo)..."
                      stockList={stockList}
                      selectedRef={selectedChalecoRef}
                      onSelectProduct={(product) => {
                        setSelectedChalecoRef(product ? product.referencia : "");
                      }}
                      categoryFilter="CHALECO"
                    />
                  </div>
                )}
              </div>

              {/* ACCESORIOS ADICIONALES - UNIVERSAL PRODUCT SELECTOR */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                    <ShoppingBag size={15} className="text-red-600" />
                    <span>Accesorios Adicionales (Ticket Conectado al Inventario)</span>
                  </h4>
                  <span className="text-[10px] bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded-full border border-red-100">
                    Buscador Universal
                  </span>
                </div>

                <BuscadorUniversalAccesorios
                  stockList={stockList}
                  onAddAccessory={(item, quantity) => {
                    if (item.stock < quantity) {
                      alert(`ALERTA: Solo hay ${item.stock} unidades disponibles en inventario de ${item.producto}.`);
                      return;
                    }
                    setAddedAccessories([...addedAccessories, { reference: item.referencia, quantity }]);
                  }}
                />

                {/* Lista de Accesorios Agregados en Ticket */}
                {addedAccessories.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 mt-2">
                    <div className="bg-slate-50 px-3.5 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex justify-between">
                      <span>Producto / Accesorio Añadido</span>
                      <span>Cant. × Precio Unit = Subtotal</span>
                    </div>
                    {addedAccessories.map((acc, idx) => {
                      const itemData = stockList.find((s) => s.referencia === acc.reference);
                      if (!itemData) return null;
                      const icon = getProductIcon(itemData.producto, itemData.marca_departamento);
                      const subtotal = itemData.precio_venta * acc.quantity;
                      return (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white hover:bg-slate-50/60 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{icon}</span>
                            <div>
                              <span className="font-extrabold text-slate-800 block">{itemData.producto}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                REF: {itemData.referencia} · {itemData.marca_departamento || "General"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <span className="font-mono text-xs font-black text-slate-800 block">
                                ${subtotal.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {acc.quantity} unid. × ${itemData.precio_venta.toLocaleString()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAddedAccessories(addedAccessories.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Quitar producto"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pago de Accesorios */}
              {addedAccessories.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 animate-fade-in">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide border-b pb-1">
                    Pago de Accesorios
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor recibido en efectivo ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={accesorioEfectivo || ""}
                        onChange={(e) => setAccesorioEfectivo(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor recibido por transferencia ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={accesorioTransferencia || ""}
                        onChange={(e) => setAccesorioTransferencia(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Calculations & Comparison */}
                  {(() => {
                    const totalTicketValue = addedAccessories.reduce((acc, curr) => {
                      const itemData = stockList.find((s) => s.referencia === curr.reference);
                      return acc + (itemData ? itemData.precio_venta * curr.quantity : 0);
                    }, 0);
                    const totalAccesorioRecibido = accesorioEfectivo + accesorioTransferencia;
                    const diff = totalTicketValue - totalAccesorioRecibido;
                    let statusLabel = "";
                    let statusClass = "";
                    if (diff === 0) {
                      statusLabel = "Pago Completo";
                      statusClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                    } else if (diff > 0) {
                      statusLabel = `Pago Pendiente: $${diff.toLocaleString()}`;
                      statusClass = "bg-amber-50 text-amber-800 border-amber-200";
                    } else {
                      statusLabel = `Pago Excedido por: $${Math.abs(diff).toLocaleString()}`;
                      statusClass = "bg-rose-50 text-rose-800 border-rose-200";
                    }

                    return (
                      <div className={`p-3 rounded-lg border flex flex-col sm:flex-row justify-between items-center text-xs font-bold ${statusClass}`}>
                        <div className="space-y-1 text-center sm:text-left">
                          <div>Total Ticket: <span className="font-mono">${totalTicketValue.toLocaleString()}</span></div>
                          <div>Total Recibido: <span className="font-mono">${totalAccesorioRecibido.toLocaleString()}</span></div>
                        </div>
                        <span className="uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-full bg-white shadow-xs mt-2 sm:mt-0 font-extrabold">
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">¿Realiza Papelería con Concesionario?</label>
                  <select
                    value={papeleria}
                    onChange={(e: any) => setPapeleria(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold"
                  >
                    <option value="NO">NO</option>
                    <option value="SI">SI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo del Titular del Trámite</label>
                  <input
                    type="text"
                    value={titularDocumentos}
                    onChange={(e) => setTitularDocumentos(e.target.value)}
                    placeholder="Comprador por defecto"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation controls */}
          <div className="flex justify-between border-t pt-4">
            <button
              type="button"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep(wizardStep - 1)}
              className="px-4 py-2 border border-slate-200 text-slate-500 disabled:opacity-40 font-semibold text-xs rounded-lg hover:bg-slate-50 flex items-center space-x-1"
            >
              <ChevronLeft size={14} /> <span>Atrás</span>
            </button>
            
            {wizardStep < 4 ? (
              <button
                type="button"
                disabled={wizardStep === 2 && !selectedMoto}
                onClick={() => setWizardStep(wizardStep + 1)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-40 font-semibold text-xs rounded-lg flex items-center space-x-1"
              >
                <span>Siguiente</span> <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveActa}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wide rounded-lg flex items-center space-x-1.5 shadow-md"
              >
                <CheckCircle2 size={16} />
                <span>Guardar y Cerrar Venta</span>
              </button>
            )}
          </div>

        </div>
      ) : (
        /* STANDARD HISTORY LIST VIEW */
        <div className="space-y-4 font-sans">
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar actas por consecutivo, cliente o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
              {searchTerm.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {db.actas
                    .filter(a => 
                      a.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.documento.includes(searchTerm) ||
                      a.acta.includes(searchTerm) ||
                      a.moto.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((a, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSearchTerm(a.nombres + " " + a.apellidos)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col cursor-pointer"
                      >
                        <span className="font-bold text-slate-800">{a.nombres} {a.apellidos}</span>
                        <span className="text-[10px] text-slate-400">Acta: #{a.acta} | Moto: {a.moto} | CC: {a.documento}</span>
                      </button>
                    ))
                  }
                  {db.actas.filter(a => 
                    a.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.documento.includes(searchTerm) ||
                    a.acta.includes(searchTerm) ||
                    a.moto.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">No hay sugerencias</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-4">Fecha Venta</th>
                  <th className="p-4">No. Acta</th>
                  <th className="p-4">Cliente (Comprador)</th>
                  <th className="p-4">Motocicleta Despachada</th>
                  <th className="p-4 text-right">Valor Moto</th>
                  <th className="p-4 text-right text-green-600">Total Abonos</th>
                  <th className="p-4 text-right text-red-600">Saldo Pendiente</th>
                  <th className="p-4 text-center">Papelería</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredActas.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 whitespace-nowrap">{item.fecha}</td>
                    <td className="p-4 font-mono font-bold text-red-600">#{item.acta}</td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.nombres} {item.apellidos}</div>
                      <div className="text-[10px] text-slate-400 font-mono">CC: {item.documento}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold">{item.moto} ({item.color})</div>
                      <div className="text-[10px] text-slate-400">Motor: {item.motor}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-semibold">${item.valor_moto.toLocaleString()}</td>
                    <td className="p-4 text-right font-mono font-semibold text-green-600">${item.total_recibido.toLocaleString()}</td>
                    <td className="p-4 text-right font-mono font-semibold text-red-600">${item.deuda_actual.toLocaleString()}</td>
                    <td className="p-4 text-center font-bold text-slate-700">{item.papeleria}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700">
                        {item.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          if (setSelectedEntityId) {
                            setSelectedEntityId(item.documento);
                          }
                          setView("ClientesPerfil");
                        }}
                        className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white p-1 rounded-md transition-colors"
                        title="Ver Perfil Maestro de Cliente"
                      >
                        <User size={14} />
                      </button>
                      <button
                        onClick={() => setSelectedInvoice(item)}
                        className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white p-1 rounded-md transition-colors"
                        title="Ver Documento Acta PDF"
                      >
                        <FileText size={14} />
                      </button>
                      {item.deuda_actual > 0 && (
                        <button
                          onClick={() => {
                            setSelectedActaForAbono(item);
                            setNewAbonoEfectivo(0);
                            setNewAbonoTransferencia(0);
                            setNewAbonoConsignacion(0);
                            setNewAbonoObservaciones("");
                            setNewAbonoManualRecibo(false);
                            setNewAbonoManualReciboNo("");
                          }}
                          className="bg-green-50 hover:bg-green-600 text-green-600 hover:text-white p-1 rounded-md transition-colors"
                          title="Registrar Nuevo Abono"
                        >
                          <DollarSign size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (setSelectedEntityId) {
                            setSelectedEntityId(item.documento);
                          }
                          setView("Devoluciones");
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 py-1 px-2 rounded-md font-bold text-[10px] uppercase transition-colors"
                        title="Procesar devolución oficial"
                      >
                        ↩ Devolución
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PRINTABLE PDF INVOICE SIMULATOR */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl border max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded">MUNDO MOTOS ERP</span>
                <h3 className="font-black text-lg text-slate-900 mt-2">ACTA DE ENTREGA DE VEHÍCULO</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Bitácora Oficial - Concesionario Mundo Motos Tolima</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400">NÚMERO DE ACTA</div>
                <div className="text-sm font-black text-red-600 font-mono">#{selectedInvoice.acta}</div>
                <div className="text-[10px] text-slate-500 font-semibold mt-1">Fecha: {selectedInvoice.fecha}</div>
              </div>
            </div>

            {/* Client and bike fields grid */}
            <div className="grid grid-cols-2 gap-6 text-xs border-b pb-4">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-tight mb-2">Datos del Comprador</h4>
                <div className="space-y-1 text-slate-600 font-semibold">
                  <p>Titular: <span className="text-slate-800 font-bold">{selectedInvoice.nombres} {selectedInvoice.apellidos}</span></p>
                  <p>Identificación: <span className="text-slate-800 font-bold">{selectedInvoice.tipo_documento} {selectedInvoice.documento}</span></p>
                  <p>Teléfono: <span className="text-slate-800 font-bold">{selectedInvoice.telefono}</span></p>
                  <p>Dirección: <span className="text-slate-800 font-bold">{selectedInvoice.direccion}</span></p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-tight mb-2">Datos de la Motocicleta</h4>
                <div className="space-y-1 text-slate-600 font-mono">
                  <p>Modelo: <span className="text-slate-800 font-bold font-sans">{selectedInvoice.moto} {selectedInvoice.modelo}</span></p>
                  <p>Motor: <span className="text-slate-800 font-bold">{selectedInvoice.motor}</span></p>
                  <p>Chasis: <span className="text-slate-800 font-bold">{selectedInvoice.chasis}</span></p>
                  <p>Color: <span className="text-slate-800 font-bold font-sans">{selectedInvoice.color} ({selectedInvoice.cilindraje}cc)</span></p>
                </div>
              </div>
            </div>

            {/* Financial summaries */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border">
              <h4 className="font-bold text-slate-800 uppercase tracking-tight border-b pb-1 mb-2">Resumen Económico</h4>
              <div className="flex justify-between">
                <span>Precio base motocicleta:</span>
                <span className="font-mono font-bold">${selectedInvoice.valor_moto.toLocaleString()}</span>
              </div>
              {selectedInvoice.valor_accesorios > 0 && (
                <div className="flex justify-between">
                  <span>Accesorios adicionales ({selectedInvoice.accesorios_adicionales}):</span>
                  <span className="font-mono font-bold">${selectedInvoice.valor_accesorios.toLocaleString()}</span>
                </div>
              )}
              
              {/* Detailed Payment History Breakdown */}
              <div className="border-t border-dashed my-2 pt-2 space-y-1 text-slate-500 font-semibold text-[11px]">
                <p className="font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wide">Historial de Abonos Consolidados:</p>
                {selectedInvoice.abono_preventa && selectedInvoice.abono_preventa > 0 ? (
                  <div className="flex justify-between pl-2">
                    <span>Abono Inicial (Seguro Preventa):</span>
                    <span className="font-mono">${selectedInvoice.abono_preventa.toLocaleString()}</span>
                  </div>
                ) : null}
                {selectedInvoice.efectivo > 0 && (
                  <div className="flex justify-between pl-2 text-green-600">
                    <span>Abono Efectivo (Asentado en Acta):</span>
                    <span className="font-mono">+${selectedInvoice.efectivo.toLocaleString()}</span>
                  </div>
                )}
                {selectedInvoice.transferencia > 0 && (
                  <div className="flex justify-between pl-2 text-green-600">
                    <span>Abono Transferencia {selectedInvoice.plataforma_digital ? `(${selectedInvoice.plataforma_digital})` : "(Asentado en Acta)"}:</span>
                    <span className="font-mono">+${selectedInvoice.transferencia.toLocaleString()}</span>
                  </div>
                )}
                {selectedInvoice.desembolso > 0 && (
                  <div className="flex justify-between pl-2 text-green-600">
                    <span>Abono Desembolso Crédito (Asentado en Acta):</span>
                    <span className="font-mono">+${selectedInvoice.desembolso.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-green-600 font-bold border-t pt-1.5">
                <span>(-) Total abonos de venta recibidos:</span>
                <span className="font-mono">${selectedInvoice.total_recibido.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold border-t pt-1.5">
                <span>Todo lo Recibido en Acta (Venta + Accesorios):</span>
                <span className="font-mono">${(selectedInvoice.todo_lo_recibido_en_acta ?? (selectedInvoice.total_recibido + (selectedInvoice.valor_recibido_accesorios || 0))).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold border-t pt-1.5 text-sm bg-red-50/50 p-2 rounded">
                <span>DEUDA O SALDO RESTANTE:</span>
                <span className="font-mono">${selectedInvoice.deuda_actual.toLocaleString()}</span>
              </div>
            </div>

            {/* Delivery terms */}
            <div className="text-[10px] text-slate-400 leading-relaxed space-y-1">
              <p>1. El cliente declara recibir la motocicleta a entera satisfacción, con los accesorios indicados ({selectedInvoice.accesorio_principal}).</p>
              <p>2. Este documento constituye el soporte de salida física de stock del inventario general de motocicletas.</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs font-semibold text-slate-500 border-t">
              <div className="border-t border-slate-300 pt-2">
                <p className="text-slate-800 font-bold">{selectedInvoice.nombres} {selectedInvoice.apellidos}</p>
                <p className="text-[10px] text-slate-400 font-normal">Firma del Comprador</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800">Concesionario Mundo Motos S.A.</p>
                <p className="text-[10px] text-slate-400 font-normal">Sello de Despacho y Entrega</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg"
              >
                Imprimir Documento
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-5 rounded-lg"
              >
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO ADICIONAL */}
      {selectedActaForAbono && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Registrar Nuevo Abono</h3>
                <p className="text-xs text-slate-500">Acta #{selectedActaForAbono.acta} - Cliente: {selectedActaForAbono.nombres} {selectedActaForAbono.apellidos}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActaForAbono(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Existing Payments Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-xs font-semibold text-slate-600">
              <h4 className="text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b pb-1">Soporte de Pagos Consolidados</h4>
              {selectedActaForAbono.abono_preventa ? (
                <div className="flex justify-between">
                  <span>Pagos provenientes de Preventa:</span>
                  <span className="font-mono text-slate-800">${selectedActaForAbono.abono_preventa.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-500">
                <span>Efectivo Inicial:</span>
                <span className="font-mono">${selectedActaForAbono.efectivo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Transferencia Inicial:</span>
                <span className="font-mono">${selectedActaForAbono.transferencia.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 border-b pb-1.5">
                <span>Desembolso Inicial:</span>
                <span className="font-mono">${selectedActaForAbono.desembolso.toLocaleString()}</span>
              </div>

              {/* Aditional abonos list if any */}
              {selectedActaForAbono.abonos_adicionales && selectedActaForAbono.abonos_adicionales.length > 0 && (
                <div className="space-y-1.5 pt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Abonos Adicionales Registrados:</span>
                  {selectedActaForAbono.abonos_adicionales.map((item, index) => {
                    const sum = item.efectivo + item.transferencia + item.consignacion;
                    return (
                      <div key={index} className="flex justify-between text-[11px] text-green-700 bg-green-50/50 p-1.5 rounded">
                        <span>{item.fecha} (Recibo: #{item.numero_recibo})</span>
                        <span className="font-mono font-bold">+${sum.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-1 border-t text-slate-800 font-bold">
                <span>Total Abonos Recibidos:</span>
                <span className="font-mono font-black text-green-700">${selectedActaForAbono.total_recibido.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold text-sm pt-1 border-t">
                <span>SALDO PENDIENTE (DEUDA):</span>
                <span className="font-mono font-black">${selectedActaForAbono.deuda_actual.toLocaleString()}</span>
              </div>
            </div>

            {/* Form to add a new abono */}
            <form onSubmit={handleSaveAbono} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Efectivo ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAbonoEfectivo || ""}
                    onChange={(e) => setNewAbonoEfectivo(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 text-xs font-mono font-bold text-green-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Transferencia ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAbonoTransferencia || ""}
                    onChange={(e) => setNewAbonoTransferencia(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 text-xs font-mono font-bold text-green-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Consignación ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAbonoConsignacion || ""}
                    onChange={(e) => setNewAbonoConsignacion(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 text-xs font-mono font-bold text-green-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones / Comentarios</label>
                <input
                  type="text"
                  placeholder="e.g. Abono para saldo de placas y matrícula"
                  value={newAbonoObservaciones}
                  onChange={(e) => setNewAbonoObservaciones(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              {/* Manual Receipt Number selection */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chkManualRecibo"
                    checked={newAbonoManualRecibo}
                    onChange={(e) => {
                      setNewAbonoManualRecibo(e.target.checked);
                      if (!e.target.checked) setNewAbonoManualReciboNo("");
                    }}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="chkManualRecibo" className="text-xs font-semibold text-slate-700 select-none">
                    Ingresar número de recibo manualmente
                  </label>
                </div>

                {newAbonoManualRecibo ? (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Número de Recibo Manual *</label>
                    <input
                      type="text"
                      required
                      value={newAbonoManualReciboNo}
                      onChange={(e) => setNewAbonoManualReciboNo(e.target.value)}
                      placeholder="e.g. RC-4581"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 font-semibold">
                    El número de recibo se generará automáticamente de manera secuencial.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedActaForAbono(null)}
                  className="px-4 py-2 border text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Guardar Abono
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
        initialDocumento={documento}
        onSelectClient={(c) => {
          setTipoDoc(c.tipo_documento);
          setDocumento(c.numero_documento);
          setNombres(c.nombres);
          setApellidos(c.apellidos);
          setTelefono(c.telefono_principal);
          setCorreo(c.correo_electronico);
          setDireccion(c.direccion);
        }}
      />

    </div>
  );
}
