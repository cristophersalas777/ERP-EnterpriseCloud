import { useState } from "react";
import {
  LayoutDashboard, Handshake, Truck, Warehouse, Landmark, Files,
  ChartNoAxesCombined, Cloud, ShieldCheck, Search, Bell, ChevronDown,
  Menu, ArrowUpRight, ArrowDownRight, ShoppingCart, CircleDollarSign,
  Package, Users, Plus, Download, Clock3, CheckCircle2,
  AlertTriangle, Zap, Database, Server, HardDrive, Activity, X, Settings,
  FileText, CreditCard, Banknote, RefreshCw, TrendingUp, TrendingDown,
  ClipboardList, ArrowLeftRight, UserCheck, Lock, Eye,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────
const money = (v: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(v);

const today = "25 oct. 2026";
const pad = (n: number) => String(n).padStart(4, "0");

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Customer   = { id: number; name: string; contact: string; email: string; ruc: string; status: string };
type Supplier   = { id: number; name: string; contact: string; email: string; ruc: string; status: string };
type Product    = { id: string; name: string; category: string; stock: number; price: number; warehouse: string };
type Quote      = { id: string; customerId: number; customerName: string; date: string; items: QuoteItem[]; total: number; status: "Borrador" | "Enviada" | "Aprobada" | "Rechazada" };
type QuoteItem  = { productId: string; productName: string; qty: number; price: number };
type Sale       = { id: string; quoteId?: string; customerId: number; customerName: string; date: string; amount: number; status: string; type: "Venta" | "Compra" };
type Invoice    = { id: string; saleId: string; customerId: number; customerName: string; date: string; amount: number; status: "Emitida" | "Cobrada" | "Vencida" };
type PurchaseOrder = { id: string; supplierId: number; supplierName: string; date: string; items: POItem[]; total: number; status: "Pendiente" | "Recibida" | "Cancelada" };
type POItem     = { productId: string; productName: string; qty: number; price: number };
type Reception  = { id: string; poId: string; supplierName: string; date: string; items: POItem[]; status: "Completa" | "Parcial" };
type KardexEntry = { id: string; date: string; productId: string; productName: string; type: "Entrada" | "Salida"; qty: number; reason: string; ref: string; stockAfter: number };
type Transfer   = { id: string; date: string; productId: string; productName: string; from: string; to: string; qty: number; status: "Completada" | "Pendiente" };
type Receivable = { id: string; invoiceId: string; customerName: string; amount: number; dueDate: string; status: "Pendiente" | "Cobrada" | "Vencida" };
type Payable    = { id: string; poId: string; supplierName: string; amount: number; dueDate: string; status: "Pendiente" | "Pagada" | "Vencida" };
type CashEntry  = { id: string; date: string; type: "Ingreso" | "Egreso"; concept: string; ref: string; amount: number };
type DocFile    = { id: string; name: string; type: string; size: string; ref: string; date: string; category: "Factura" | "Contrato" | "Orden de compra" | "Reporte" };
type AuditEntry = { id: string; date: string; user: string; action: string; module: string };
type AppUser    = { id: number; initials: string; name: string; role: string; email: string; status: string };

// ─── Datos iniciales ──────────────────────────────────────────────────────────
const INIT_CUSTOMERS: Customer[] = [
  { id: 1, name: "Comercial Andina S.A.C.",      contact: "María Torres",   email: "compras@andina.pe",        ruc: "20512345678", status: "Activo" },
  { id: 2, name: "Grupo Nova S.A.C.",             contact: "Carlos Mendoza", email: "contacto@nova.pe",         ruc: "20598765432", status: "Activo" },
  { id: 3, name: "Inversiones del Pacífico",      contact: "Lucía Ramos",    email: "ventas@pacifico.pe",       ruc: "20476543219", status: "Activo" },
  { id: 4, name: "Distribuidora Central",         contact: "Jorge Salas",    email: "central@distribuidora.pe", ruc: "20312345609", status: "Pendiente" },
];

const INIT_SUPPLIERS: Supplier[] = [
  { id: 1, name: "Importaciones Tech S.A.C.",  contact: "Roberto Vega",   email: "ventas@importech.pe",   ruc: "20411122334", status: "Activo" },
  { id: 2, name: "Suministros del Norte",      contact: "Ana Castillo",   email: "compras@sumnorte.pe",   ruc: "20533445566", status: "Activo" },
  { id: 3, name: "Distribuidora Lima S.A.",    contact: "Pedro Quispe",   email: "pedidos@distlima.pe",   ruc: "20677889900", status: "Activo" },
  { id: 4, name: "Proveedora Central E.I.R.L.",contact: "Elena Flores",   email: "eflores@procentral.pe", ruc: "20199887766", status: "Inactivo" },
];

const INIT_PRODUCTS: Product[] = [
  { id: "PR-001", name: "Laptop empresarial",       category: "Electrónica", stock: 24, price: 2850, warehouse: "Almacén Principal" },
  { id: "PR-002", name: "Monitor profesional 24\"", category: "Electrónica", stock: 8,  price: 620,  warehouse: "Almacén Principal" },
  { id: "PR-003", name: "Teclado inalámbrico",      category: "Accesorios",  stock: 56, price: 95,   warehouse: "Almacén Secundario" },
  { id: "PR-004", name: "Silla ergonómica",         category: "Oficina",     stock: 5,  price: 480,  warehouse: "Almacén Principal" },
  { id: "PR-005", name: "Mouse empresarial",        category: "Accesorios",  stock: 42, price: 65,   warehouse: "Almacén Secundario" },
];

// Lógica de datos iniciales coherente:
// COT-0021 (Aprobada) → VTA-0842 (Completada) → FAC-0082 (Emitida) → CXC-002 (Pendiente)
// COT-0022 (Enviada)  → pendiente de aprobación del cliente
// COT-0023 (Borrador) → pendiente de envío al cliente
// VTA-0841 fue venta directa (sin cotización previa) → FAC-0081 (Cobrada) → CXC-001 (Cobrada)
// VTA-0840 fue venta directa → FAC-0080 (Vencida)   → CXC-003 (Vencida)
const INIT_QUOTES: Quote[] = [
  { id: "COT-2026-0021", customerId: 1, customerName: "Comercial Andina S.A.C.", date: "15 oct. 2026", items: [{ productId: "PR-001", productName: "Laptop empresarial",       qty: 2, price: 2850 }], total: 5700, status: "Aprobada" },
  { id: "COT-2026-0022", customerId: 2, customerName: "Grupo Nova S.A.C.",       date: "16 oct. 2026", items: [{ productId: "PR-003", productName: "Teclado inalámbrico",       qty: 10, price: 95  }], total: 950,  status: "Enviada"  },
  { id: "COT-2026-0023", customerId: 3, customerName: "Inversiones del Pacífico",date: "17 oct. 2026", items: [{ productId: "PR-002", productName: "Monitor profesional 24\"", qty: 3,  price: 620 }], total: 1860, status: "Borrador" },
];

const INIT_SALES: Sale[] = [
  { id: "VTA-2026-0842", quoteId: "COT-2026-0021", customerId: 1, customerName: "Comercial Andina S.A.C.", date: "15 oct. 2026", amount: 5700,  status: "Completada", type: "Venta"  },
  { id: "VTA-2026-0841", customerId: 2,             customerName: "Grupo Nova S.A.C.",                     date: "16 oct. 2026", amount: 3150,  status: "Completada", type: "Venta"  },
  { id: "VTA-2026-0840", customerId: 3,             customerName: "Inversiones del Pacífico",              date: "17 oct. 2026", amount: 1860,  status: "Completada", type: "Venta"  },
];

const INIT_INVOICES: Invoice[] = [
  { id: "FAC-2026-0082", saleId: "VTA-2026-0842", customerId: 1, customerName: "Comercial Andina S.A.C.", date: "15 oct. 2026", amount: 5700, status: "Emitida" },
  { id: "FAC-2026-0081", saleId: "VTA-2026-0841", customerId: 2, customerName: "Grupo Nova S.A.C.",       date: "16 oct. 2026", amount: 3150, status: "Cobrada" },
  { id: "FAC-2026-0080", saleId: "VTA-2026-0840", customerId: 3, customerName: "Inversiones del Pacífico",date: "17 oct. 2026", amount: 1860, status: "Vencida" },
];

const INIT_PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "OC-2026-0318", supplierId: 2, supplierName: "Suministros del Norte",    date: "14 oct. 2026", items: [{ productId: "PR-001", productName: "Laptop empresarial",       qty: 5,  price: 2500 }], total: 12500, status: "Recibida" },
  { id: "OC-2026-0319", supplierId: 1, supplierName: "Importaciones Tech S.A.C.",date: "17 oct. 2026", items: [{ productId: "PR-002", productName: "Monitor profesional 24\"", qty: 10, price: 500  }], total: 5000,  status: "Pendiente" },
  { id: "OC-2026-0320", supplierId: 3, supplierName: "Distribuidora Lima S.A.",  date: "18 oct. 2026", items: [{ productId: "PR-003", productName: "Teclado inalámbrico",       qty: 20, price: 75   }], total: 1500,  status: "Pendiente" },
];

const INIT_RECEPTIONS: Reception[] = [
  { id: "REC-2026-0201", poId: "OC-2026-0318", supplierName: "Suministros del Norte", date: "15 oct. 2026", items: [{ productId: "PR-001", productName: "Laptop empresarial", qty: 5, price: 2500 }], status: "Completa" },
];

const INIT_KARDEX: KardexEntry[] = [
  { id: "KX-001", date: "14 oct. 2026", productId: "PR-001", productName: "Laptop empresarial",       type: "Entrada", qty: 5,  reason: "Recepción OC-2026-0318",    ref: "OC-2026-0318",  stockAfter: 26 },
  { id: "KX-002", date: "15 oct. 2026", productId: "PR-001", productName: "Laptop empresarial",       type: "Salida",  qty: 2,  reason: "Venta COT-2026-0021",        ref: "VTA-2026-0842", stockAfter: 24 },
  { id: "KX-003", date: "16 oct. 2026", productId: "PR-002", productName: "Monitor profesional 24\"", type: "Salida",  qty: 1,  reason: "Venta directa",              ref: "VTA-2026-0841", stockAfter: 8  },
  { id: "KX-004", date: "16 oct. 2026", productId: "PR-003", productName: "Teclado inalámbrico",      type: "Salida",  qty: 5,  reason: "Transferencia TRF-2026-0001",ref: "TRF-2026-0001", stockAfter: 56 },
];

const INIT_TRANSFERS: Transfer[] = [
  { id: "TRF-2026-0001", date: "16 oct. 2026", productId: "PR-003", productName: "Teclado inalámbrico", from: "Almacén Principal", to: "Almacén Secundario", qty: 5, status: "Completada" },
];

const INIT_RECEIVABLES: Receivable[] = [
  { id: "CXC-001", invoiceId: "FAC-2026-0082", customerName: "Comercial Andina S.A.C.", amount: 5700, dueDate: "15 nov. 2026", status: "Pendiente" },
  { id: "CXC-002", invoiceId: "FAC-2026-0081", customerName: "Grupo Nova S.A.C.",        amount: 3150, dueDate: "16 oct. 2026", status: "Cobrada"  },
  { id: "CXC-003", invoiceId: "FAC-2026-0080", customerName: "Inversiones del Pacífico", amount: 1860, dueDate: "01 oct. 2026", status: "Vencida"  },
];

const INIT_PAYABLES: Payable[] = [
  { id: "CXP-001", poId: "OC-2026-0319", supplierName: "Importaciones Tech S.A.C.", amount: 5000, dueDate: "17 nov. 2026", status: "Pendiente" },
  { id: "CXP-002", poId: "OC-2026-0318", supplierName: "Suministros del Norte",    amount: 12500, dueDate: "14 oct. 2026", status: "Pagada"   },
  { id: "CXP-003", poId: "OC-2026-0320", supplierName: "Distribuidora Lima S.A.",  amount: 1500,  dueDate: "03 oct. 2026", status: "Vencida"  },
];

const INIT_CASH: CashEntry[] = [
  { id: "CAJ-001", date: "16 oct. 2026", type: "Ingreso", concept: "Cobro de factura FAC-2026-0081", ref: "FAC-2026-0081", amount: 3150  },
  { id: "CAJ-002", date: "14 oct. 2026", type: "Egreso",  concept: "Pago a proveedor OC-2026-0318",  ref: "OC-2026-0318",  amount: 12500 },
  { id: "CAJ-003", date: "18 oct. 2026", type: "Egreso",  concept: "Gastos operativos del mes",      ref: "GTO-2026-001",  amount: 800   },
];

const INIT_DOCS: DocFile[] = [
  { id: "DOC-001", name: "FAC-2026-0082.pdf",        type: "PDF",  size: "2.4 MB", ref: "FAC-2026-0082", date: "15 oct. 2026", category: "Factura"         },
  { id: "DOC-002", name: "FAC-2026-0081.pdf",        type: "PDF",  size: "1.9 MB", ref: "FAC-2026-0081", date: "16 oct. 2026", category: "Factura"         },
  { id: "DOC-003", name: "FAC-2026-0080.pdf",        type: "PDF",  size: "1.7 MB", ref: "FAC-2026-0080", date: "17 oct. 2026", category: "Factura"         },
  { id: "DOC-004", name: "OC-2026-0318.pdf",         type: "PDF",  size: "1.1 MB", ref: "OC-2026-0318",  date: "14 oct. 2026", category: "Orden de compra" },
  { id: "DOC-005", name: "OC-2026-0319.pdf",         type: "PDF",  size: "1.0 MB", ref: "OC-2026-0319",  date: "17 oct. 2026", category: "Orden de compra" },
  { id: "DOC-006", name: "OC-2026-0320.pdf",         type: "PDF",  size: "1.0 MB", ref: "OC-2026-0320",  date: "18 oct. 2026", category: "Orden de compra" },
  { id: "DOC-007", name: "Contrato-Andina-2026.pdf", type: "PDF",  size: "3.8 MB", ref: "COT-2026-0021", date: "10 oct. 2026", category: "Contrato"        },
  { id: "DOC-008", name: "Contrato-Nova-2026.pdf",   type: "PDF",  size: "2.9 MB", ref: "COT-2026-0022", date: "12 oct. 2026", category: "Contrato"        },
  { id: "DOC-009", name: "Inventario-Oct-2026.xlsx", type: "XLSX", size: "860 KB", ref: "INV-2026-10",   date: "17 oct. 2026", category: "Reporte"         },
];

const INIT_USERS: AppUser[] = [
  { id: 1, initials: "AL", name: "Ángel Lezama",    role: "Administrador", email: "alezama@empresa.pe",   status: "Activo"   },
  { id: 2, initials: "MT", name: "María Torres",    role: "Analista",      email: "mtorres@empresa.pe",   status: "Activo"   },
  { id: 3, initials: "CM", name: "Carlos Mendoza",  role: "Vendedor",      email: "cmendoza@empresa.pe",  status: "Activo"   },
  { id: 4, initials: "LR", name: "Lucía Ramos",     role: "Analista",      email: "lramos@empresa.pe",    status: "Inactivo" },
  { id: 5, initials: "JS", name: "Jorge Salas",     role: "Vendedor",      email: "jsalas@empresa.pe",    status: "Activo"   },
];

const INIT_AUDIT: AuditEntry[] = [
  { id: "AUD-001", date: "17 oct. 2026 17:42", user: "Ángel Lezama",   action: "Registró venta VTA-2026-0842",      module: "Gestión comercial"   },
  { id: "AUD-002", date: "17 oct. 2026 16:10", user: "María Torres",   action: "Emitió factura FAC-2026-0082",      module: "Gestión comercial"   },
  { id: "AUD-003", date: "16 oct. 2026 15:30", user: "Carlos Mendoza", action: "Creó cotización COT-2026-0023",     module: "Gestión comercial"   },
  { id: "AUD-004", date: "15 oct. 2026 11:05", user: "Ángel Lezama",   action: "Recibió OC-2026-0318",              module: "Abastecimiento"      },
  { id: "AUD-005", date: "14 oct. 2026 09:20", user: "María Torres",   action: "Creó orden de compra OC-2026-0318", module: "Abastecimiento"      },
  { id: "AUD-006", date: "16 oct. 2026 14:00", user: "Jorge Salas",    action: "Realizó transferencia TRF-2026-0001","module": "Control de inventario" },
];

const salesData = [
  { month: "May", ventas: 28500, compras: 18200 },
  { month: "Jun", ventas: 34200, compras: 21500 },
  { month: "Jul", ventas: 31800, compras: 19400 },
  { month: "Ago", ventas: 42100, compras: 24800 },
  { month: "Sep", ventas: 38900, compras: 22700 },
  { month: "Oct", ventas: 48250, compras: 26900 },
];

const WAREHOUSES = ["Almacén Principal", "Almacén Secundario", "Almacén Norte"];

const navigation = [
  { title: "GENERAL", items: [{ label: "Dashboard ejecutivo", icon: LayoutDashboard }] },
  { title: "GESTIÓN EMPRESARIAL", items: [
    { label: "Gestión comercial",    icon: Handshake },
    { label: "Abastecimiento",       icon: Truck },
    { label: "Control de inventario",icon: Warehouse },
    { label: "Gestión financiera",   icon: Landmark },
    { label: "Centro documental",    icon: Files },
  ]},
  { title: "ANÁLISIS Y CONTROL", items: [
    { label: "Inteligencia de negocios", icon: ChartNoAxesCombined },
    { label: "Centro Cloud",             icon: Cloud },
  ]},
  { title: "SISTEMA", items: [
    { label: "Administración y seguridad", icon: ShieldCheck },
  ]},
];

// ─── Componentes UI reutilizables ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls =
    ["Completada","Activo","Disponible","Cobrada","Pagada","Recibida","Completa","Aprobada"].includes(status) ? "success" :
    ["Pendiente","Enviada","Stock bajo","Parcial"].includes(status) ? "warning" :
    ["En proceso","Borrador","Emitida"].includes(status) ? "info" :
    ["Vencida","Inactivo","Rechazada","Cancelada"].includes(status) ? "danger" : "neutral";
  return <span className={`status-badge ${cls}`}><span />{status}</span>;
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="empty-table">No se encontraron registros.</td></tr>;
}

function StatCard({ icon: Icon, label, value, note, trend, positive, color }: {
  icon: typeof LayoutDashboard; label: string; value: string; note: string;
  trend?: string; positive?: boolean; color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${color}`}><Icon size={20} strokeWidth={1.8} /></div>
        {trend && <span className={`stat-trend ${positive ? "positive" : ""}`}>{positive && <ArrowUpRight size={14} />}{trend}</span>}
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, actionLabel, onAction }: {
  eyebrow: string; title: string; description: string; actionLabel: string; onAction: () => void;
}) {
  return (
    <div className="welcome-row page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}<span className="title-period">.</span></h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">
        <button className="button-primary" onClick={onAction}><Plus size={18} /> {actionLabel}</button>
      </div>
    </div>
  );
}

function CardHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="card-heading">
      <div><h3>{title}</h3><p>{subtitle}</p></div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="form-field"><span>{label}</span>{children}</label>;
}

function QuickAction({ icon: Icon, title, description, onClick }: {
  icon: typeof Users; title: string; description: string; onClick: () => void;
}) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className="quick-icon"><Icon size={19} /></div>
      <div><strong>{title}</strong><small>{description}</small></div>
      <ArrowUpRight size={16} className="quick-arrow" />
    </button>
  );
}

// ─── Buscador de texto (reemplaza select para clientes/proveedores) ────────────
function SearchableSelect({ label, items, value, onChange, placeholder }: {
  label: string;
  items: { id: number; name: string }[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <label className="form-field" style={{ position: "relative" }}>
      <span>{label}</span>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="searchable-dropdown">
          {filtered.map(i => (
            <button key={i.id} type="button" onClick={() => { onChange(String(i.id), i.name); setQuery(i.name); setOpen(false); }}>
              {i.name}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

// ─── App principal ────────────────────────────────────────────────────────────
function App() {
  const [activePage, setActivePage] = useState("Dashboard ejecutivo");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Estado global compartido entre módulos
  const [customers, setCustomers]   = useState<Customer[]>(INIT_CUSTOMERS);
  const [suppliers, setSuppliers]   = useState<Supplier[]>(INIT_SUPPLIERS);
  const [products, setProducts]     = useState<Product[]>(INIT_PRODUCTS);
  const [quotes, setQuotes]         = useState<Quote[]>(INIT_QUOTES);
  const [sales, setSales]           = useState<Sale[]>(INIT_SALES);
  const [invoices, setInvoices]     = useState<Invoice[]>(INIT_INVOICES);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INIT_PURCHASE_ORDERS);
  const [receptions, setReceptions] = useState<Reception[]>(INIT_RECEPTIONS);
  const [kardex, setKardex]         = useState<KardexEntry[]>(INIT_KARDEX);
  const [transfers, setTransfers]   = useState<Transfer[]>(INIT_TRANSFERS);
  const [receivables, setReceivables] = useState<Receivable[]>(INIT_RECEIVABLES);
  const [payables, setPayables]     = useState<Payable[]>(INIT_PAYABLES);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(INIT_CASH);
  const [docs, setDocs]             = useState<DocFile[]>(INIT_DOCS);
  const [auditLog, setAuditLog]     = useState<AuditEntry[]>(INIT_AUDIT);
  const [appUsers, setAppUsers] = useState<AppUser[]>(INIT_USERS);

  // Modal activo
  type ModalType = "cliente"|"proveedor"|"cotizacion"|"venta"|"producto"|"ordencompra"|"recepcion"|"transferencia"|"cobro"|"pago"|"usuario"|"documento"|null;
  const [modal, setModal] = useState<ModalType>(null);

  // Campos del formulario
  const [fName, setFName]       = useState("");
  const [fContact, setFContact] = useState("");
  const [fEmail, setFEmail]     = useState("");
  const [fRuc, setFRuc]         = useState("");
  const [fPrice, setFPrice]     = useState("");
  const [fStock, setFStock]     = useState("10");
  const [fWarehouse, setFWarehouse] = useState(WAREHOUSES[0]);
  const [fCustomerId, setFCustomerId] = useState("");
  const [fCustomerName, setFCustomerName] = useState("");
  const [fSupplierId, setFSupplierId] = useState("");
  const [fSupplierName, setFSupplierName] = useState("");
  const [fProductId, setFProductId] = useState("PR-001");
  const [fQty, setFQty]         = useState("1");
  const [fQtyPO, setFQtyPO]     = useState("1");
  const [fPricePO, setFPricePO] = useState("");
  const [fPoId, setFPoId]       = useState("");
  const [fFromWh, setFFromWh]   = useState(WAREHOUSES[0]);
  const [fToWh, setFToWh]       = useState(WAREHOUSES[1]);
  const [fRefId, setFRefId]     = useState("");
  const [fAmount, setFAmount]   = useState("");
  const [fRole, setFRole]       = useState("Vendedor");
  const [fDocCategory, setFDocCategory] = useState<DocFile["category"]>("Contrato");

  const addAudit = (action: string, module: string) => {
    setAuditLog(prev => [{
      id: `AUD-${pad(prev.length + 1)}`,
      date: `${today} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`,
      user: "Ángel Lezama", action, module,
    }, ...prev]);
  };

  const goTo = (page: string) => { setActivePage(page); setSidebarOpen(false); setSearch(""); };

  const resetModal = () => {
    setModal(null);
    setFName(""); setFContact(""); setFEmail(""); setFRuc("");
    setFPrice(""); setFStock("10"); setFWarehouse(WAREHOUSES[0]);
    setFCustomerId(""); setFCustomerName(""); setFSupplierId(""); setFSupplierName("");
    setFProductId("PR-001"); setFQty("1"); setFQtyPO("1"); setFPricePO("");
    setFPoId(""); setFFromWh(WAREHOUSES[0]); setFToWh(WAREHOUSES[1]);
    setFRefId(""); setFAmount(""); setFRole("Vendedor"); setFDocCategory("Contrato");
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (modal === "cliente") {
      if (!fName.trim() || !fEmail.trim()) return;
      const newC: Customer = { id: Math.max(0, ...customers.map(c => c.id)) + 1, name: fName.trim(), contact: fContact.trim() || "Sin contacto", email: fEmail.trim(), ruc: fRuc.trim() || "—", status: "Activo" };
      setCustomers(prev => [...prev, newC]);
      addAudit(`Registró cliente ${newC.name}`, "Gestión comercial");
    }

    if (modal === "proveedor") {
      if (!fName.trim() || !fEmail.trim()) return;
      const newS: Supplier = { id: Math.max(0, ...suppliers.map(s => s.id)) + 1, name: fName.trim(), contact: fContact.trim() || "Sin contacto", email: fEmail.trim(), ruc: fRuc.trim() || "—", status: "Activo" };
      setSuppliers(prev => [...prev, newS]);
      addAudit(`Registró proveedor ${newS.name}`, "Abastecimiento");
    }

    if (modal === "cotizacion") {
      if (!fCustomerId || !fProductId) return;
      const prod = products.find(p => p.id === fProductId);
      const qty = parseInt(fQty) || 1;
      if (!prod) return;
      const newQ: Quote = {
        id: `COT-2026-${pad(quotes.length + 24)}`,
        customerId: parseInt(fCustomerId),
        customerName: fCustomerName,
        date: today,
        items: [{ productId: prod.id, productName: prod.name, qty, price: prod.price }],
        total: prod.price * qty,
        status: "Borrador",
      };
      setQuotes(prev => [newQ, ...prev]);
      addAudit(`Creó cotización ${newQ.id}`, "Gestión comercial");
      goTo("Gestión comercial");
    }

    if (modal === "venta") {
      const prod = products.find(p => p.id === fProductId);
      const qty = parseInt(fQty) || 1;
      if (!prod || !fCustomerId || prod.stock < qty) return;
      const newSale: Sale = {
        id: `VTA-2026-${pad(sales.filter(s => s.type === "Venta").length + 843)}`,
        customerId: parseInt(fCustomerId),
        customerName: fCustomerName,
        date: today,
        amount: prod.price * qty,
        status: "Completada",
        type: "Venta",
      };
      // Baja de stock + kardex
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, stock: p.stock - qty } : p));
      setKardex(prev => [{ id: `KX-${pad(prev.length + 1)}`, date: today, productId: prod.id, productName: prod.name, type: "Salida", qty, reason: "Venta", ref: newSale.id, stockAfter: prod.stock - qty }, ...prev]);
      // Factura automática
      const newInv: Invoice = { id: `FAC-2026-${pad(invoices.length + 83)}`, saleId: newSale.id, customerId: parseInt(fCustomerId), customerName: fCustomerName, date: today, amount: newSale.amount, status: "Emitida" };
      setInvoices(prev => [newInv, ...prev]);
      // Cuenta por cobrar automática
      const newRec: Receivable = { id: `CXC-${pad(receivables.length + 4)}`, invoiceId: newInv.id, customerName: fCustomerName, amount: newSale.amount, dueDate: "25 nov. 2026", status: "Pendiente" };
      setReceivables(prev => [newRec, ...prev]);
      // Documento
      setDocs(prev => [{ id: `DOC-${pad(prev.length + 1)}`, name: `${newInv.id}.pdf`, type: "PDF", size: "1.8 MB", ref: newInv.id, date: today, category: "Factura" }, ...prev]);
      setSales(prev => [newSale, ...prev]);
      addAudit(`Registró venta ${newSale.id}`, "Gestión comercial");
      goTo("Gestión comercial");
    }

    if (modal === "producto") {
      const price = parseFloat(fPrice);
      const stock = parseInt(fStock);
      if (!fName.trim() || !isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return;
      const newP: Product = { id: `PR-${pad(products.length + 1)}`, name: fName.trim(), category: "Otros", stock, price, warehouse: fWarehouse };
      setProducts(prev => [...prev, newP]);
      addAudit(`Agregó producto ${newP.name}`, "Control de inventario");
    }

    if (modal === "ordencompra") {
      if (!fSupplierId || !fProductId) return;
      const prod = products.find(p => p.id === fProductId);
      const qty = parseInt(fQtyPO) || 1;
      const price = parseFloat(fPricePO);
      if (!prod || !isFinite(price) || price <= 0) return;
      const newPO: PurchaseOrder = {
        id: `OC-2026-${pad(purchaseOrders.length + 321)}`,
        supplierId: parseInt(fSupplierId),
        supplierName: fSupplierName,
        date: today,
        items: [{ productId: prod.id, productName: prod.name, qty, price }],
        total: price * qty,
        status: "Pendiente",
      };
      // Cuenta por pagar automática
      const newPay: Payable = { id: `CXP-${pad(payables.length + 4)}`, poId: newPO.id, supplierName: fSupplierName, amount: newPO.total, dueDate: "25 nov. 2026", status: "Pendiente" };
      setPayables(prev => [newPay, ...prev]);
      setDocs(prev => [{ id: `DOC-${pad(prev.length + 1)}`, name: `${newPO.id}.pdf`, type: "PDF", size: "1.0 MB", ref: newPO.id, date: today, category: "Orden de compra" }, ...prev]);
      setPurchaseOrders(prev => [newPO, ...prev]);
      addAudit(`Creó orden de compra ${newPO.id}`, "Abastecimiento");
      goTo("Abastecimiento");
    }

    if (modal === "recepcion") {
      const po = purchaseOrders.find(o => o.id === fPoId);
      if (!po || po.status !== "Pendiente") return;
      const newRec: Reception = { id: `REC-2026-${pad(receptions.length + 202)}`, poId: po.id, supplierName: po.supplierName, date: today, items: po.items, status: "Completa" };
      // Sube stock + kardex
      po.items.forEach(item => {
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: p.stock + item.qty } : p));
        setKardex(prev => [{ id: `KX-${pad(prev.length + 1)}`, date: today, productId: item.productId, productName: item.productName, type: "Entrada", qty: item.qty, reason: "Recepción de compra", ref: po.id, stockAfter: (products.find(p => p.id === item.productId)?.stock ?? 0) + item.qty }, ...prev]);
      });
      setPurchaseOrders(prev => prev.map(o => o.id === po.id ? { ...o, status: "Recibida" } : o));
      setReceptions(prev => [newRec, ...prev]);
      addAudit(`Recibió orden de compra ${po.id}`, "Abastecimiento");
      goTo("Abastecimiento");
    }

    if (modal === "transferencia") {
      const prod = products.find(p => p.id === fProductId);
      const qty = parseInt(fQty) || 1;
      if (!prod || prod.stock < qty || fFromWh === fToWh) return;
      const newTrf: Transfer = { id: `TRF-2026-${pad(transfers.length + 2)}`, date: today, productId: prod.id, productName: prod.name, from: fFromWh, to: fToWh, qty, status: "Completada" };
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, warehouse: fToWh } : p));
      setKardex(prev => [{ id: `KX-${pad(prev.length + 1)}`, date: today, productId: prod.id, productName: prod.name, type: "Salida", qty, reason: "Transferencia", ref: newTrf.id, stockAfter: prod.stock }, ...prev]);
      setTransfers(prev => [newTrf, ...prev]);
      addAudit(`Realizó transferencia ${newTrf.id}`, "Control de inventario");
      goTo("Control de inventario");
    }

    if (modal === "cobro") {
      const rec = receivables.find(r => r.id === fRefId);
      if (!rec || rec.status === "Cobrada") return;
      setReceivables(prev => prev.map(r => r.id === fRefId ? { ...r, status: "Cobrada" } : r));
      setInvoices(prev => prev.map(inv => inv.id === rec.invoiceId ? { ...inv, status: "Cobrada" } : inv));
      const entry: CashEntry = { id: `CAJ-${pad(cashEntries.length + 5)}`, date: today, type: "Ingreso", concept: "Cobro de factura", ref: rec.invoiceId, amount: rec.amount };
      setCashEntries(prev => [entry, ...prev]);
      addAudit(`Registró cobro de ${rec.invoiceId}`, "Gestión financiera");
      goTo("Gestión financiera");
    }

    if (modal === "pago") {
      const pay = payables.find(p => p.id === fRefId);
      if (!pay || pay.status === "Pagada") return;
      setPayables(prev => prev.map(p => p.id === fRefId ? { ...p, status: "Pagada" } : p));
      const entry: CashEntry = { id: `CAJ-${pad(cashEntries.length + 5)}`, date: today, type: "Egreso", concept: "Pago a proveedor", ref: pay.poId, amount: pay.amount };
      setCashEntries(prev => [entry, ...prev]);
      addAudit(`Registró pago de ${pay.poId}`, "Gestión financiera");
      goTo("Gestión financiera");
    }

    if (modal === "usuario") {
      if (!fName.trim() || !fEmail.trim()) return;
      const initials = fName.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      const newUser: AppUser = {
        id: Math.max(0, ...appUsers.map(u => u.id)) + 1,
        initials,
        name: fName.trim(),
        role: fRole,
        email: fEmail.trim(),
        status: "Activo",
      };
      setAppUsers(prev => [...prev, newUser]);
      addAudit(`Creó usuario ${newUser.name} con rol ${newUser.role}`, "Administración y seguridad");
      goTo("Administración y seguridad");
    }

    if (modal === "documento") {
      if (!fName.trim() || !fRuc.trim()) return;
      const newDoc: DocFile = {
        id: `DOC-${pad(docs.length + 1)}`,
        name: fName.trim().endsWith(".pdf") || fName.trim().endsWith(".xlsx") ? fName.trim() : `${fName.trim()}.pdf`,
        type: "PDF",
        size: "—",
        ref: fRuc.trim(),
        date: today,
        category: fDocCategory,
      };
      setDocs(prev => [newDoc, ...prev]);
      addAudit(`Cargó documento ${newDoc.name}`, "Centro documental");
      goTo("Centro documental");
    }

    resetModal();
  };

  // Envío de cotización: Borrador → Enviada
  const sendQuote = (quoteId: string) => {
    setQuotes(prev => prev.map(q => q.id === quoteId && q.status === "Borrador" ? { ...q, status: "Enviada" } : q));
    addAudit(`Envió cotización ${quoteId} al cliente`, "Gestión comercial");
  };

  // Rechazo de cotización: Enviada → Rechazada
  const rejectQuote = (quoteId: string) => {
    setQuotes(prev => prev.map(q => q.id === quoteId && q.status === "Enviada" ? { ...q, status: "Rechazada" } : q));
    addAudit(`Rechazó cotización ${quoteId}`, "Gestión comercial");
  };

  // Aprobación de cotización → genera venta automática
  const approveQuote = (quoteId: string) => {
    const q = quotes.find(qt => qt.id === quoteId);
    if (!q || q.status !== "Enviada") return;
    setQuotes(prev => prev.map(qt => qt.id === quoteId ? { ...qt, status: "Aprobada" } : qt));
    const newSale: Sale = { id: `VTA-2026-${pad(sales.filter(s => s.type === "Venta").length + 843)}`, quoteId, customerId: q.customerId, customerName: q.customerName, date: today, amount: q.total, status: "Completada", type: "Venta" };
    q.items.forEach(item => {
      setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p));
      setKardex(prev => [{ id: `KX-${pad(prev.length + 1)}`, date: today, productId: item.productId, productName: item.productName, type: "Salida", qty: item.qty, reason: "Venta por cotización", ref: newSale.id, stockAfter: Math.max(0, (products.find(p => p.id === item.productId)?.stock ?? 0) - item.qty) }, ...prev]);
    });
    const newInv: Invoice = { id: `FAC-2026-${pad(invoices.length + 83)}`, saleId: newSale.id, customerId: q.customerId, customerName: q.customerName, date: today, amount: q.total, status: "Emitida" };
    setInvoices(prev => [newInv, ...prev]);
    setReceivables(prev => [{ id: `CXC-${pad(prev.length + 4)}`, invoiceId: newInv.id, customerName: q.customerName, amount: q.total, dueDate: "25 nov. 2026", status: "Pendiente" }, ...prev]);
    setDocs(prev => [{ id: `DOC-${pad(prev.length + 1)}`, name: `${newInv.id}.pdf`, type: "PDF", size: "1.8 MB", ref: newInv.id, date: today, category: "Factura" }, ...prev]);
    setSales(prev => [newSale, ...prev]);
    addAudit(`Aprobó cotización ${quoteId} → ${newSale.id}`, "Gestión comercial");
  };

  const lowStock = products.filter(p => p.stock < 10);

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Zap size={23} fill="currentColor" /></div>
          <div className="brand-copy">
            <strong>Enterprise<span>Cloud</span></strong>
            <small>BUSINESS MANAGEMENT</small>
          </div>
          <button className="icon-button sidebar-close" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        </div>
        <div className="workspace">
          <div className="workspace-avatar">EC</div>
          <div className="workspace-copy"><strong>Empresa Demo S.A.C.</strong><small>Plan empresarial</small></div>
          <ChevronDown size={16} className="muted-icon" />
        </div>
        <nav className="navigation">
          {navigation.map(group => (
            <div className="nav-group" key={group.title}>
              <p className="nav-heading">{group.title}</p>
              {group.items.map(({ label, icon: Icon }) => (
                <button key={label} onClick={() => goTo(label)} className={`nav-item ${activePage === label ? "active" : ""}`}>
                  <Icon size={19} strokeWidth={1.8} />
                  <span>{label}</span>
                  {label === "Centro Cloud" && <span className="nav-dot" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="cloud-status">
            <div className="cloud-status-icon"><Cloud size={19} /></div>
            <div><strong>Cloud Center</strong><small><span className="status-dot" /> Entorno de demostración</small></div>
          </div>
          <div className="sidebar-footer"><span>ERP EnterpriseCloud</span><span>v1.0.0</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <div className="breadcrumb">
              <span>EnterpriseCloud</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <label className="global-search">
              <Search size={17} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en esta sección..." aria-label="Buscar" />
              <kbd>⌘ K</kbd>
            </label>
            <div className="popover-wrap">
              <button className="icon-button notification-button" aria-label="Notificaciones" onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}>
                <Bell size={19} /><span className="notification-indicator" />
              </button>
              {showNotifications && (
                <div className="popover-panel">
                  <strong>Notificaciones</strong>
                  {lowStock.length > 0 && <p><AlertTriangle size={16} /> {lowStock.length} producto(s) con stock bajo.</p>}
                  {receivables.filter(r => r.status === "Vencida").length > 0 && <p><AlertTriangle size={16} /> {receivables.filter(r => r.status === "Vencida").length} cuenta(s) por cobrar vencida(s).</p>}
                  {purchaseOrders.filter(o => o.status === "Pendiente").length > 0 && <p><Clock3 size={16} /> {purchaseOrders.filter(o => o.status === "Pendiente").length} orden(es) de compra pendiente(s).</p>}
                  <small>Alertas generadas del estado actual del sistema.</small>
                </div>
              )}
            </div>
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}>
                <div className="avatar">AL</div>
                <div className="profile-info"><strong>Ángel Lezama</strong><small>Administrador</small></div>
                <ChevronDown size={16} />
              </button>
              {showProfile && (
                <div className="profile-menu">
                  <button onClick={() => goTo("Administración y seguridad")}><Settings size={16} /> Configuración</button>
                  <button onClick={() => goTo("Administración y seguridad")}><ShieldCheck size={16} /> Mi perfil y permisos</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Dashboard ejecutivo" ? (
            <DashboardPage onNavigate={goTo} onNewSale={() => setModal("venta")} sales={sales} products={products} customers={customers} receivables={receivables} payables={payables} />
          ) : activePage === "Gestión comercial" ? (
            <ComercialPage search={search} customers={customers} quotes={quotes} sales={sales} invoices={invoices}
              onNewCustomer={() => setModal("cliente")} onNewQuote={() => setModal("cotizacion")} onNewSale={() => setModal("venta")}
              onSendQuote={sendQuote} onApproveQuote={approveQuote} onRejectQuote={rejectQuote} />
          ) : activePage === "Abastecimiento" ? (
            <AbastecimientoPage search={search} suppliers={suppliers} purchaseOrders={purchaseOrders} receptions={receptions}
              onNewSupplier={() => setModal("proveedor")} onNewPO={() => setModal("ordencompra")} onReceive={() => setModal("recepcion")} pendingPOs={purchaseOrders.filter(o => o.status === "Pendiente")} />
          ) : activePage === "Control de inventario" ? (
            <InventarioPage search={search} products={products} kardex={kardex} transfers={transfers}
              onNewProduct={() => setModal("producto")} onNewTransfer={() => setModal("transferencia")} />
          ) : activePage === "Gestión financiera" ? (
            <FinanzasPage search={search} receivables={receivables} payables={payables} cashEntries={cashEntries}
              onCobrar={() => setModal("cobro")} onPagar={() => setModal("pago")} pendingReceivables={receivables.filter(r => r.status === "Pendiente")} pendingPayables={payables.filter(p => p.status === "Pendiente")} />
          ) : activePage === "Centro documental" ? (
            <DocumentosPage search={search} docs={docs} invoices={invoices} purchaseOrders={purchaseOrders} onNewDoc={() => setModal("documento")} />
          ) : activePage === "Inteligencia de negocios" ? (
            <AnalyticsPage sales={sales} products={products} customers={customers} receivables={receivables} payables={payables} invoices={invoices} kardex={kardex} />
          ) : activePage === "Centro Cloud" ? (
            <CloudPage />
          ) : (
            <AdminPage users={appUsers} auditLog={auditLog} onNewUser={() => setModal("usuario")}
              onToggleUser={(id) => {
                const u = appUsers.find(u => u.id === id);
                if (!u || id === 1) return; // No puede desactivar al administrador principal
                const newStatus = u.status === "Activo" ? "Inactivo" : "Activo";
                setAppUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
                addAudit(`${newStatus === "Inactivo" ? "Desactivó" : "Reactivó"} usuario ${u.name}`, "Administración y seguridad");
              }}
            />
          )}
        </div>

        <footer className="app-footer">
          <span>© 2026 EnterpriseCloud · Sistema empresarial de demostración</span>
          <span><span className="status-dot" /> Datos simulados · Sin conexión a servicios reales</span>
        </footer>
      </main>

      {/* ── Modales ── */}
      {modal && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) resetModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">ENTERPRISECLOUD</span>
                <h2>{{ cliente:"Nuevo cliente", proveedor:"Nuevo proveedor", cotizacion:"Nueva cotización", venta:"Registrar venta", producto:"Nuevo producto", ordencompra:"Orden de compra", recepcion:"Recibir mercadería", transferencia:"Transferencia de stock", cobro:"Registrar cobro", pago:"Registrar pago", usuario:"Nuevo usuario", documento:"Registrar documento" }[modal]}</h2>
                <p>Completa los datos del formulario.</p>
              </div>
              <button className="icon-button" onClick={resetModal} aria-label="Cerrar"><X size={20} /></button>
            </div>
            <form onSubmit={submitForm} className="modal-form">

              {(modal === "cliente" || modal === "proveedor") && (<>
                <FormField label="Razón social o nombre"><input required value={fName} onChange={e => setFName(e.target.value)} placeholder="Ej. Empresa del Norte S.A.C." /></FormField>
                <FormField label="RUC"><input value={fRuc} onChange={e => setFRuc(e.target.value)} placeholder="20XXXXXXXXX" /></FormField>
                <FormField label="Nombre del contacto"><input value={fContact} onChange={e => setFContact(e.target.value)} placeholder="Nombre del responsable" /></FormField>
                <FormField label="Correo electrónico"><input required type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="contacto@empresa.pe" /></FormField>
              </>)}

              {modal === "cotizacion" && (<>
                <SearchableSelect label="Cliente" items={customers} value={fCustomerName} onChange={(id, name) => { setFCustomerId(id); setFCustomerName(name); }} placeholder="Escribe el nombre del cliente..." />
                <FormField label="Producto">
                  <select value={fProductId} onChange={e => setFProductId(e.target.value)}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}
                  </select>
                </FormField>
                <FormField label="Cantidad"><input required type="number" min="1" value={fQty} onChange={e => setFQty(e.target.value)} /></FormField>
                <div className="sale-total"><span>Total estimado</span><strong>{money((products.find(p => p.id === fProductId)?.price ?? 0) * (parseInt(fQty) || 0))}</strong></div>
              </>)}

              {modal === "venta" && (<>
                <SearchableSelect label="Cliente" items={customers} value={fCustomerName} onChange={(id, name) => { setFCustomerId(id); setFCustomerName(name); }} placeholder="Escribe el nombre del cliente..." />
                <FormField label="Producto">
                  <select value={fProductId} onChange={e => setFProductId(e.target.value)}>
                    {products.map(p => <option key={p.id} value={p.id} disabled={p.stock < 1}>{p.name} — {money(p.price)} (stock: {p.stock})</option>)}
                  </select>
                </FormField>
                <FormField label="Cantidad"><input required type="number" min="1" max={products.find(p => p.id === fProductId)?.stock ?? 1} value={fQty} onChange={e => setFQty(e.target.value)} /></FormField>
                <div className="sale-total"><span>Total</span><strong>{money((products.find(p => p.id === fProductId)?.price ?? 0) * (parseInt(fQty) || 0))}</strong></div>
                <p className="form-disclaimer">Se generará factura y cuenta por cobrar automáticamente.</p>
              </>)}

              {modal === "producto" && (<>
                <FormField label="Nombre del producto"><input required value={fName} onChange={e => setFName(e.target.value)} placeholder="Ej. Teclado mecánico" /></FormField>
                <FormField label="Precio unitario (S/)"><input required type="number" min="0" step="0.01" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="150.00" /></FormField>
                <FormField label="Stock inicial"><input required type="number" min="0" value={fStock} onChange={e => setFStock(e.target.value)} /></FormField>
                <FormField label="Almacén"><select value={fWarehouse} onChange={e => setFWarehouse(e.target.value)}>{WAREHOUSES.map(w => <option key={w}>{w}</option>)}</select></FormField>
              </>)}

              {modal === "ordencompra" && (<>
                <SearchableSelect label="Proveedor" items={suppliers} value={fSupplierName} onChange={(id, name) => { setFSupplierId(id); setFSupplierName(name); }} placeholder="Escribe el nombre del proveedor..." />
                <FormField label="Producto">
                  <select value={fProductId} onChange={e => setFProductId(e.target.value)}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Cantidad"><input required type="number" min="1" value={fQtyPO} onChange={e => setFQtyPO(e.target.value)} /></FormField>
                <FormField label="Precio unitario acordado (S/)"><input required type="number" min="0" step="0.01" value={fPricePO} onChange={e => setFPricePO(e.target.value)} placeholder="0.00" /></FormField>
                <div className="sale-total"><span>Total OC</span><strong>{money((parseFloat(fPricePO) || 0) * (parseInt(fQtyPO) || 0))}</strong></div>
                <p className="form-disclaimer">Se generará una cuenta por pagar automáticamente.</p>
              </>)}

              {modal === "recepcion" && (<>
                <FormField label="Orden de compra pendiente">
                  <select value={fPoId} onChange={e => setFPoId(e.target.value)}>
                    <option value="">— Selecciona una OC —</option>
                    {purchaseOrders.filter(o => o.status === "Pendiente").map(o => (
                      <option key={o.id} value={o.id}>{o.id} · {o.supplierName} · {money(o.total)}</option>
                    ))}
                  </select>
                </FormField>
                {fPoId && <p className="form-disclaimer">Al confirmar, el stock de los productos subirá automáticamente en el inventario.</p>}
              </>)}

              {modal === "transferencia" && (<>
                <FormField label="Producto">
                  <select value={fProductId} onChange={e => setFProductId(e.target.value)}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                  </select>
                </FormField>
                <FormField label="Desde almacén"><select value={fFromWh} onChange={e => setFFromWh(e.target.value)}>{WAREHOUSES.map(w => <option key={w}>{w}</option>)}</select></FormField>
                <FormField label="Hacia almacén"><select value={fToWh} onChange={e => setFToWh(e.target.value)}>{WAREHOUSES.filter(w => w !== fFromWh).map(w => <option key={w}>{w}</option>)}</select></FormField>
                <FormField label="Cantidad"><input required type="number" min="1" max={products.find(p => p.id === fProductId)?.stock ?? 1} value={fQty} onChange={e => setFQty(e.target.value)} /></FormField>
              </>)}

              {modal === "cobro" && (<>
                <FormField label="Cuenta por cobrar pendiente">
                  <select value={fRefId} onChange={e => setFRefId(e.target.value)}>
                    <option value="">— Selecciona —</option>
                    {receivables.filter(r => r.status === "Pendiente").map(r => (
                      <option key={r.id} value={r.id}>{r.invoiceId} · {r.customerName} · {money(r.amount)}</option>
                    ))}
                  </select>
                </FormField>
                <p className="form-disclaimer">Al confirmar, se registrará un ingreso en Caja y Bancos.</p>
              </>)}

              {modal === "pago" && (<>
                <FormField label="Cuenta por pagar pendiente">
                  <select value={fRefId} onChange={e => setFRefId(e.target.value)}>
                    <option value="">— Selecciona —</option>
                    {payables.filter(p => p.status === "Pendiente").map(p => (
                      <option key={p.id} value={p.id}>{p.poId} · {p.supplierName} · {money(p.amount)}</option>
                    ))}
                  </select>
                </FormField>
                <p className="form-disclaimer">Al confirmar, se registrará un egreso en Caja y Bancos.</p>
              </>)}

              {modal === "usuario" && (<>
                <FormField label="Nombre completo"><input required value={fName} onChange={e => setFName(e.target.value)} placeholder="Ej. Ana García López" /></FormField>
                <FormField label="Correo electrónico"><input required type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="usuario@empresa.pe" /></FormField>
                <FormField label="Rol asignado">
                  <select value={fRole} onChange={e => setFRole(e.target.value)}>
                    <option>Administrador</option>
                    <option>Analista</option>
                    <option>Vendedor</option>
                  </select>
                </FormField>
                <p className="form-disclaimer">El usuario se registrará como Activo. La acción quedará en el registro de auditoría.</p>
              </>)}

              {modal === "documento" && (<>
                <FormField label="Nombre del documento">
                  <input required value={fName} onChange={e => setFName(e.target.value)} placeholder="Ej. Contrato-Proveedor-2026.pdf" />
                </FormField>
                <FormField label="Categoría">
                  <select value={fDocCategory} onChange={e => setFDocCategory(e.target.value as DocFile["category"])}>
                    <option value="Contrato">Contrato</option>
                    <option value="Factura">Factura</option>
                    <option value="Orden de compra">Orden de compra</option>
                    <option value="Reporte">Reporte</option>
                  </select>
                </FormField>
                <FormField label="Número de referencia (OC, FAC, contrato, etc.)">
                  <input required value={fRuc} onChange={e => setFRuc(e.target.value)} placeholder="Ej. OC-2026-0320 o CTR-2026-005" />
                </FormField>
                <p className="form-disclaimer">El documento quedará registrado en el repositorio. La acción se registrará en Auditoría.</p>
              </>)}

              <div className="modal-actions">
                <button type="button" className="button-secondary" onClick={resetModal}>Cancelar</button>
                <button type="submit" className="button-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({ onNavigate, onNewSale, sales, products, customers, receivables, payables }: {
  onNavigate: (p: string) => void; onNewSale: () => void;
  sales: Sale[]; products: Product[]; customers: Customer[]; receivables: Receivable[]; payables: Payable[];
}) {
  const totalVentas = sales.filter(s => s.type === "Venta").reduce((a, s) => a + s.amount, 0);
  const lowStock = products.filter(p => p.stock < 10);
  const pendCobrar = receivables.filter(r => r.status === "Pendiente").reduce((a, r) => a + r.amount, 0);
  const pendPagar  = payables.filter(p => p.status === "Pendiente").reduce((a, p) => a + p.amount, 0);

  return (
    <section>
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> DOMINGO, 25 DE OCTUBRE DE 2026</div>
          <h1>Resumen ejecutivo<span className="title-period">.</span></h1>
          <p>Estado general de la empresa. Indicadores en tiempo real del sistema.</p>
        </div>
        <div className="heading-actions">
          <button className="button-secondary" onClick={() => window.print()}><Download size={17} /> Exportar</button>
          <button className="button-primary" onClick={onNewSale}><Plus size={18} /> Nueva venta</button>
        </div>
      </div>

      <div className="demo-banner">
        <div className="demo-banner-icon"><Activity size={20} /></div>
        <div><strong>Entorno de demostración</strong><p>Los datos son simulados. Todas las operaciones generan consecuencias reales entre módulos (ventas bajan stock, OC genera cuentas por pagar, etc.).</p></div>
        <span className="demo-tag">DEMO</span>
      </div>

      <div className="stats-grid">
        <StatCard icon={CircleDollarSign} label="Ventas del periodo"       value={money(totalVentas)} note="Importe acumulado" trend="+12.8%" positive color="blue" />
        <StatCard icon={ShoppingCart}    label="Operaciones registradas"  value={String(sales.length)} note="Ventas y compras" trend="+8.2%" positive color="violet" />
        <StatCard icon={Banknote}        label="Por cobrar"               value={money(pendCobrar)} note="Facturas pendientes" color="green" />
        <StatCard icon={CreditCard}      label="Por pagar"                value={money(pendPagar)}  note="A proveedores" color="orange" />
      </div>

      <div className="dashboard-grid">
        <div className="content-card chart-card">
          <div className="card-heading">
            <div><h3>Rendimiento empresarial</h3><p>Comparativa mensual de ventas y compras</p></div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot sales-dot" /> Ventas</span>
            <span><i className="legend-dot purchases-dot" /> Compras</span>
          </div>
          <div className="main-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 12, right: 5, left: -17, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3578E5" stopOpacity={0.18} /><stop offset="100%" stopColor="#3578E5" stopOpacity={0} /></linearGradient>
                  <linearGradient id="purchasesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#13B8A6" stopOpacity={0.13} /><stop offset="100%" stopColor="#13B8A6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#EDF0F5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8993A5" }} axisLine={false} tickLine={false} dy={9} />
                <YAxis tick={{ fontSize: 11, fill: "#8993A5" }} axisLine={false} tickLine={false} tickFormatter={v => `${Number(v) / 1000}k`} />
                <Tooltip formatter={v => money(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #E9EDF4", fontSize: 12 }} />
                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#3578E5" strokeWidth={2.5} fill="url(#salesFill)" />
                <Area type="monotone" dataKey="compras" name="Compras" stroke="#13B8A6" strokeWidth={2.5} fill="url(#purchasesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="content-card quick-card">
          <div className="card-heading"><div><h3>Accesos rápidos</h3><p>Operaciones frecuentes</p></div></div>
          <div className="quick-list">
            <QuickAction icon={Users}              title="Clientes"           description="Directorio y cotizaciones"  onClick={() => onNavigate("Gestión comercial")} />
            <QuickAction icon={Package}            title="Inventario"         description="Stock y kardex"             onClick={() => onNavigate("Control de inventario")} />
            <QuickAction icon={Truck}              title="Órdenes de compra"  description="Abastecimiento"             onClick={() => onNavigate("Abastecimiento")} />
            <QuickAction icon={ChartNoAxesCombined}title="Inteligencia"       description="KPIs y reportes"           onClick={() => onNavigate("Inteligencia de negocios")} />
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="content-card">
          <div className="card-heading"><div><h3>Últimas operaciones</h3><p>Movimientos recientes</p></div><button className="text-action" onClick={() => onNavigate("Gestión comercial")}>Ver todas <ArrowUpRight size={15} /></button></div>
          <SalesTable rows={sales.slice(0, 5)} />
        </div>
        <div className="content-card inventory-card">
          <div className="card-heading"><div><h3>Alertas de inventario</h3><p>Stock bajo o crítico</p></div><span className="count-badge">{lowStock.length}</span></div>
          {lowStock.length === 0 ? (
            <div className="empty-state"><CheckCircle2 size={23} /><p>Sin alertas de inventario.</p></div>
          ) : (
            <div className="alert-list">
              {lowStock.map(p => (
                <div className="alert-item" key={p.id}>
                  <div className="alert-product-icon"><Package size={18} /></div>
                  <div className="alert-product-info"><strong>{p.name}</strong><small>{p.id}</small></div>
                  <span className={`stock-pill ${p.stock === 0 ? "stock-empty" : ""}`}>{p.stock} un.</span>
                </div>
              ))}
            </div>
          )}
          <button className="inventory-link" onClick={() => onNavigate("Control de inventario")}>Ir al inventario <ArrowUpRight size={15} /></button>
        </div>
      </div>

      <div className="cloud-overview">
        <div className="cloud-overview-copy">
          <div className="cloud-overview-icon"><Cloud size={23} /></div>
          <div><span className="eyebrow">INFRAESTRUCTURA</span><h3>Centro Cloud</h3><p>Vista de la arquitectura y servicios AWS de referencia.</p></div>
        </div>
        <div className="cloud-metrics">
          <div><Server size={17} /><span>EC2</span><strong>Simulado</strong></div>
          <div><HardDrive size={17} /><span>S3</span><strong>Simulado</strong></div>
          <div><Database size={17} /><span>RDS</span><strong>Simulado</strong></div>
        </div>
        <button className="button-secondary" onClick={() => onNavigate("Centro Cloud")}>Explorar <ArrowUpRight size={16} /></button>
      </div>
    </section>
  );
}

function SalesTable({ rows }: { rows: Sale[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>REFERENCIA</th><th>CLIENTE / PROVEEDOR</th><th>FECHA</th><th>IMPORTE</th><th>TIPO</th><th>ESTADO</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td><span className="code-cell">{r.id}</span></td>
              <td><div className="transaction-name"><span className={`transaction-type ${r.type === "Venta" ? "sale-type" : "purchase-type"}`}>{r.type === "Venta" ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}</span><strong>{r.customerName}</strong></div></td>
              <td>{r.date}</td>
              <td className="amount-cell">{money(r.amount)}</td>
              <td><span className={`doc-tag ${r.type === "Venta" ? "tag-sale" : "tag-purchase"}`}>{r.type}</span></td>
              <td><StatusBadge status={r.status} /></td>
            </tr>
          ))}
          {rows.length === 0 && <EmptyRow colSpan={6} />}
        </tbody>
      </table>
    </div>
  );
}

// ─── Gestión Comercial ────────────────────────────────────────────────────────
function ComercialPage({ search, customers, quotes, sales, invoices, onNewCustomer, onNewQuote, onNewSale, onSendQuote, onApproveQuote, onRejectQuote }: {
  search: string; customers: Customer[]; quotes: Quote[]; sales: Sale[]; invoices: Invoice[];
  onNewCustomer: () => void; onNewQuote: () => void; onNewSale: () => void;
  onSendQuote: (id: string) => void; onApproveQuote: (id: string) => void; onRejectQuote: (id: string) => void;
}) {
  const [tab, setTab] = useState("Clientes");
  const q = search.toLowerCase();

  const filteredCustomers = customers.filter(c => `${c.name} ${c.contact} ${c.email} ${c.ruc}`.toLowerCase().includes(q));
  const filteredQuotes    = quotes.filter(ct => `${ct.id} ${ct.customerName} ${ct.status}`.toLowerCase().includes(q));
  const filteredSales     = sales.filter(s => s.type === "Venta" && `${s.id} ${s.customerName} ${s.status}`.toLowerCase().includes(q));
  const filteredInvoices  = invoices.filter(inv => `${inv.id} ${inv.customerName} ${inv.status}`.toLowerCase().includes(q));

  const totalVentas = sales.filter(s => s.type === "Venta").reduce((a, s) => a + s.amount, 0);

  return (
    <section>
      <PageHeading eyebrow="GESTIÓN EMPRESARIAL / COMERCIAL" title="Gestión comercial"
        description="Administra clientes, cotizaciones, ventas y facturación desde un solo lugar."
        actionLabel={tab === "Clientes" ? "Nuevo cliente" : tab === "Cotizaciones" ? "Nueva cotización" : tab === "Ventas" ? "Nueva venta" : "—"}
        onAction={tab === "Clientes" ? onNewCustomer : tab === "Cotizaciones" ? onNewQuote : onNewSale} />

      <div className="stats-grid stats-grid-four">
        <StatCard icon={Users}          label="Clientes registrados" value={String(customers.length)}                               note="Directorio comercial"    color="blue"   />
        <StatCard icon={ClipboardList}  label="Cotizaciones"         value={String(quotes.length)}                                  note="Enviadas y en borrador"  color="violet" />
        <StatCard icon={ShoppingCart}   label="Ventas registradas"   value={String(sales.filter(s => s.type === "Venta").length)}   note="Operaciones de venta"    color="green"  />
        <StatCard icon={FileText}       label="Facturación total"    value={money(totalVentas)}                                     note="Monto acumulado"         color="orange" />
      </div>

      <div className="subnav">
        {["Clientes","Cotizaciones","Ventas","Facturación"].map(t => (
          <button key={t} className={tab === t ? "subnav-active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Clientes" && (
        <div className="content-card">
          <CardHeading title="Directorio de clientes" subtitle="Empresas y contactos registrados" />
          <div className="table-wrap">
            <table>
              <thead><tr><th>EMPRESA</th><th>RUC</th><th>CONTACTO</th><th>CORREO</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td><div className="table-person"><div className="company-avatar">{c.name[0]}</div><strong>{c.name}</strong></div></td>
                    <td className="code-cell">{c.ruc}</td><td>{c.contact}</td><td>{c.email}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && <EmptyRow colSpan={5} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Cotizaciones" && (
        <div className="content-card">
          <CardHeading title="Cotizaciones" subtitle="Flujo: Borrador → Enviar al cliente → Aprobar (genera venta) o Rechazar" />
          <div className="table-wrap">
            <table>
              <thead><tr><th>COTIZACIÓN</th><th>CLIENTE</th><th>FECHA</th><th>TOTAL</th><th>ESTADO</th><th>ACCIONES</th></tr></thead>
              <tbody>
                {filteredQuotes.map(ct => (
                  <tr key={ct.id}>
                    <td className="code-cell">{ct.id}</td>
                    <td><strong>{ct.customerName}</strong></td>
                    <td>{ct.date}</td>
                    <td className="amount-cell">{money(ct.total)}</td>
                    <td><StatusBadge status={ct.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {ct.status === "Borrador" && (
                          <button className="button-secondary" style={{ minHeight: 28, fontSize: 9, padding: "0 8px" }} onClick={() => onSendQuote(ct.id)}>
                            Enviar al cliente
                          </button>
                        )}
                        {ct.status === "Enviada" && (<>
                          <button className="button-primary" style={{ minHeight: 28, fontSize: 9, padding: "0 8px" }} onClick={() => onApproveQuote(ct.id)}>
                            <CheckCircle2 size={13} /> Aprobar
                          </button>
                          <button className="button-secondary" style={{ minHeight: 28, fontSize: 9, padding: "0 8px", color: "#b33a3a" }} onClick={() => onRejectQuote(ct.id)}>
                            <X size={13} /> Rechazar
                          </button>
                        </>)}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredQuotes.length === 0 && <EmptyRow colSpan={6} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Ventas" && (
        <div className="content-card">
          <CardHeading title="Registro de ventas" subtitle="Todas las ventas realizadas. Cada venta genera una factura automáticamente." />
          <SalesTable rows={filteredSales} />
        </div>
      )}

      {tab === "Facturación" && (
        <div className="content-card">
          <CardHeading title="Facturas emitidas" subtitle="Cada venta genera su factura. Las facturas cobradas pasan a Caja y Bancos." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>FACTURA</th><th>VENTA</th><th>CLIENTE</th><th>FECHA</th><th>MONTO</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="code-cell">{inv.id}</td>
                    <td className="code-cell">{inv.saleId}</td>
                    <td><strong>{inv.customerName}</strong></td>
                    <td>{inv.date}</td>
                    <td className="amount-cell">{money(inv.amount)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && <EmptyRow colSpan={6} />}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Abastecimiento ───────────────────────────────────────────────────────────
function AbastecimientoPage({ search, suppliers, purchaseOrders, receptions, onNewSupplier, onNewPO, onReceive, pendingPOs }: {
  search: string; suppliers: Supplier[]; purchaseOrders: PurchaseOrder[]; receptions: Reception[];
  onNewSupplier: () => void; onNewPO: () => void; onReceive: () => void; pendingPOs: PurchaseOrder[];
}) {
  const [tab, setTab] = useState("Proveedores");
  const q = search.toLowerCase();

  const filteredSuppliers = suppliers.filter(s => `${s.name} ${s.contact} ${s.email} ${s.ruc}`.toLowerCase().includes(q));
  const filteredPOs       = purchaseOrders.filter(o => `${o.id} ${o.supplierName} ${o.status}`.toLowerCase().includes(q));
  const filteredRecs      = receptions.filter(r => `${r.id} ${r.poId} ${r.supplierName}`.toLowerCase().includes(q));

  return (
    <section>
      <PageHeading eyebrow="GESTIÓN EMPRESARIAL / COMPRAS" title="Abastecimiento"
        description="Gestiona proveedores, genera órdenes de compra y registra recepciones. La recepción sube el stock automáticamente."
        actionLabel={tab === "Proveedores" ? "Nuevo proveedor" : tab === "Órdenes de compra" ? "Nueva orden" : "Registrar recepción"}
        onAction={tab === "Proveedores" ? onNewSupplier : tab === "Órdenes de compra" ? onNewPO : onReceive} />

      <div className="stats-grid stats-grid-three">
        <StatCard icon={Users}         label="Proveedores"            value={String(suppliers.length)}                                 note="Directorio de proveedores"  color="blue"   />
        <StatCard icon={ClipboardList} label="Órdenes de compra"      value={String(purchaseOrders.length)}                            note="Total registradas"           color="violet" />
        <StatCard icon={Clock3}        label="Pendientes de recepción" value={String(pendingPOs.length)}                               note="Requieren recepción"         color="orange" />
      </div>

      <div className="subnav">
        {["Proveedores","Órdenes de compra","Recepciones"].map(t => (
          <button key={t} className={tab === t ? "subnav-active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Proveedores" && (
        <div className="content-card">
          <CardHeading title="Directorio de proveedores" subtitle="Empresas que abastecen a la organización" />
          <div className="table-wrap">
            <table>
              <thead><tr><th>PROVEEDOR</th><th>RUC</th><th>CONTACTO</th><th>CORREO</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredSuppliers.map(s => (
                  <tr key={s.id}>
                    <td><div className="table-person"><div className="company-avatar">{s.name[0]}</div><strong>{s.name}</strong></div></td>
                    <td className="code-cell">{s.ruc}</td><td>{s.contact}</td><td>{s.email}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && <EmptyRow colSpan={5} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Órdenes de compra" && (
        <div className="content-card">
          <CardHeading title="Órdenes de compra" subtitle="Cada OC genera una cuenta por pagar en Gestión Financiera automáticamente." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>ORDEN</th><th>PROVEEDOR</th><th>FECHA</th><th>PRODUCTO</th><th>CANT.</th><th>TOTAL</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredPOs.map(o => (
                  <tr key={o.id}>
                    <td className="code-cell">{o.id}</td>
                    <td><strong>{o.supplierName}</strong></td>
                    <td>{o.date}</td>
                    <td>{o.items[0]?.productName}</td>
                    <td>{o.items[0]?.qty} un.</td>
                    <td className="amount-cell">{money(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
                {filteredPOs.length === 0 && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Recepciones" && (
        <div className="content-card">
          <CardHeading title="Recepciones de mercadería" subtitle="Al recibir una OC, el stock sube automáticamente en el inventario y se registra en el kardex." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>RECEPCIÓN</th><th>ORDEN</th><th>PROVEEDOR</th><th>FECHA</th><th>PRODUCTO</th><th>CANT.</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredRecs.map(r => (
                  <tr key={r.id}>
                    <td className="code-cell">{r.id}</td>
                    <td className="code-cell">{r.poId}</td>
                    <td><strong>{r.supplierName}</strong></td>
                    <td>{r.date}</td>
                    <td>{r.items[0]?.productName}</td>
                    <td>{r.items[0]?.qty} un.</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                {filteredRecs.length === 0 && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Control de inventario ────────────────────────────────────────────────────
function InventarioPage({ search, products, kardex, transfers, onNewProduct, onNewTransfer }: {
  search: string; products: Product[]; kardex: KardexEntry[]; transfers: Transfer[];
  onNewProduct: () => void; onNewTransfer: () => void;
}) {
  const [tab, setTab] = useState("Productos");
  const q = search.toLowerCase();

  const filteredProducts  = products.filter(p => `${p.id} ${p.name} ${p.category} ${p.warehouse}`.toLowerCase().includes(q));
  const filteredKardex    = kardex.filter(k => `${k.ref} ${k.productName} ${k.reason} ${k.type}`.toLowerCase().includes(q));
  const filteredTransfers = transfers.filter(t => `${t.id} ${t.productName} ${t.from} ${t.to}`.toLowerCase().includes(q));

  const byWarehouse = WAREHOUSES.map(w => ({ name: w, count: products.filter(p => p.warehouse === w).length }));

  return (
    <section>
      <PageHeading eyebrow="GESTIÓN EMPRESARIAL / INVENTARIO" title="Control de inventario"
        description="Gestiona productos, almacenes y movimientos de stock. El kardex registra cada entrada y salida automáticamente."
        actionLabel={tab === "Transferencias" ? "Nueva transferencia" : "Nuevo producto"}
        onAction={tab === "Transferencias" ? onNewTransfer : onNewProduct} />

      <div className="stats-grid stats-grid-four">
        <StatCard icon={Package}       label="Productos"           value={String(products.length)}                                   note="Catálogo total"              color="blue"   />
        <StatCard icon={Warehouse}     label="Stock total"         value={products.reduce((a, p) => a + p.stock, 0).toLocaleString()} note="Unidades disponibles"       color="green"  />
        <StatCard icon={AlertTriangle} label="Stock crítico"       value={String(products.filter(p => p.stock < 10).length)}         note="Menos de 10 unidades"        color="orange" />
        <StatCard icon={ArrowLeftRight}label="Transferencias"      value={String(transfers.length)}                                  note="Movimientos entre almacenes" color="violet" />
      </div>

      <div className="subnav">
        {["Productos","Almacenes","Kardex","Transferencias"].map(t => (
          <button key={t} className={tab === t ? "subnav-active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Productos" && (
        <div className="content-card">
          <CardHeading title="Catálogo de productos" subtitle="Precios, stock y ubicación de almacén" />
          <div className="table-wrap">
            <table>
              <thead><tr><th>CÓDIGO</th><th>PRODUCTO</th><th>CATEGORÍA</th><th>ALMACÉN</th><th>STOCK</th><th>PRECIO</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td className="code-cell">{p.id}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.category}</td>
                    <td>{p.warehouse}</td>
                    <td>{p.stock} un.</td>
                    <td className="amount-cell">{money(p.price)}</td>
                    <td><StatusBadge status={p.stock === 0 ? "Sin stock" : p.stock < 10 ? "Stock bajo" : "Disponible"} /></td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Almacenes" && (
        <div className="content-card">
          <CardHeading title="Almacenes" subtitle="Distribución del inventario por almacén" />
          <div className="warehouse-grid">
            {byWarehouse.map(w => (
              <div className="warehouse-card" key={w.name}>
                <div className="warehouse-icon"><Warehouse size={22} /></div>
                <strong>{w.name}</strong>
                <span className="warehouse-count">{w.count} producto(s)</span>
                <div className="warehouse-products">
                  {products.filter(p => p.warehouse === w.name).map(p => (
                    <div key={p.id} className="warehouse-product-row">
                      <span>{p.name}</span>
                      <span className={`stock-pill ${p.stock < 10 ? "" : ""}`}>{p.stock} un.</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Kardex" && (
        <div className="content-card">
          <CardHeading title="Kardex de inventario" subtitle="Historial de cada entrada y salida. Se actualiza automáticamente con ventas, compras y transferencias." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>FECHA</th><th>PRODUCTO</th><th>TIPO</th><th>CANT.</th><th>MOTIVO</th><th>REFERENCIA</th><th>STOCK FINAL</th></tr></thead>
              <tbody>
                {filteredKardex.map(k => (
                  <tr key={k.id}>
                    <td>{k.date}</td>
                    <td><strong>{k.productName}</strong><br /><small className="code-cell">{k.productId}</small></td>
                    <td>
                      <span className={`kardex-type ${k.type === "Entrada" ? "kardex-in" : "kardex-out"}`}>
                        {k.type === "Entrada" ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />} {k.type}
                      </span>
                    </td>
                    <td>{k.qty} un.</td>
                    <td>{k.reason}</td>
                    <td className="code-cell">{k.ref}</td>
                    <td><strong>{k.stockAfter} un.</strong></td>
                  </tr>
                ))}
                {filteredKardex.length === 0 && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Transferencias" && (
        <div className="content-card">
          <CardHeading title="Transferencias entre almacenes" subtitle="Movimientos internos de stock entre ubicaciones" />
          <div className="table-wrap">
            <table>
              <thead><tr><th>TRANSFERENCIA</th><th>PRODUCTO</th><th>DESDE</th><th>HACIA</th><th>CANT.</th><th>FECHA</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredTransfers.map(t => (
                  <tr key={t.id}>
                    <td className="code-cell">{t.id}</td>
                    <td><strong>{t.productName}</strong></td>
                    <td>{t.from}</td>
                    <td>{t.to}</td>
                    <td>{t.qty} un.</td>
                    <td>{t.date}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
                {filteredTransfers.length === 0 && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Gestión Financiera ───────────────────────────────────────────────────────
function FinanzasPage({ search, receivables, payables, cashEntries, onCobrar, onPagar, pendingReceivables, pendingPayables }: {
  search: string; receivables: Receivable[]; payables: Payable[]; cashEntries: CashEntry[];
  onCobrar: () => void; onPagar: () => void; pendingReceivables: Receivable[]; pendingPayables: Payable[];
}) {
  const [tab, setTab] = useState("Cuentas por cobrar");
  const q = search.toLowerCase();

  const filteredRec  = receivables.filter(r => `${r.invoiceId} ${r.customerName} ${r.status}`.toLowerCase().includes(q));
  const filteredPay  = payables.filter(p => `${p.poId} ${p.supplierName} ${p.status}`.toLowerCase().includes(q));
  const filteredCash = cashEntries.filter(c => `${c.concept} ${c.ref} ${c.type}`.toLowerCase().includes(q));

  const totalCobrar  = receivables.filter(r => r.status === "Pendiente").reduce((a, r) => a + r.amount, 0);
  const totalPagar   = payables.filter(p => p.status === "Pendiente").reduce((a, p) => a + p.amount, 0);
  const totalIngresos = cashEntries.filter(c => c.type === "Ingreso").reduce((a, c) => a + c.amount, 0);
  const totalEgresos  = cashEntries.filter(c => c.type === "Egreso").reduce((a, c) => a + c.amount, 0);
  const saldoCaja     = totalIngresos - totalEgresos;

  return (
    <section>
      <PageHeading eyebrow="GESTIÓN EMPRESARIAL / FINANZAS" title="Gestión financiera"
        description="Controla las cuentas por cobrar (de ventas), cuentas por pagar (de compras) y el movimiento de caja y bancos."
        actionLabel={tab === "Cuentas por cobrar" ? "Registrar cobro" : tab === "Cuentas por pagar" ? "Registrar pago" : "—"}
        onAction={tab === "Cuentas por cobrar" ? onCobrar : onPagar} />

      <div className="stats-grid stats-grid-four">
        <StatCard icon={TrendingUp}   label="Por cobrar (pendiente)" value={money(totalCobrar)}  note={`${pendingReceivables.length} factura(s) pendiente(s)`} color="blue"   />
        <StatCard icon={TrendingDown} label="Por pagar (pendiente)"  value={money(totalPagar)}   note={`${pendingPayables.length} OC(s) pendiente(s)`}        color="orange" />
        <StatCard icon={Banknote}     label="Ingresos en caja"       value={money(totalIngresos)} note="Cobros recibidos"                                      color="green"  />
        <StatCard icon={CreditCard}   label="Saldo en caja"          value={money(saldoCaja)}    note="Ingresos menos egresos" positive={saldoCaja >= 0}       color="violet" />
      </div>

      <div className="subnav">
        {["Cuentas por cobrar","Cuentas por pagar","Caja y bancos"].map(t => (
          <button key={t} className={tab === t ? "subnav-active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Cuentas por cobrar" && (
        <div className="content-card">
          <CardHeading title="Cuentas por cobrar" subtitle="Generadas automáticamente desde cada factura de venta. Al cobrar, pasa a Caja y Bancos." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>REFERENCIA</th><th>FACTURA</th><th>CLIENTE</th><th>MONTO</th><th>VENCIMIENTO</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredRec.map(r => (
                  <tr key={r.id}>
                    <td className="code-cell">{r.id}</td>
                    <td className="code-cell">{r.invoiceId}</td>
                    <td><strong>{r.customerName}</strong></td>
                    <td className="amount-cell">{money(r.amount)}</td>
                    <td>{r.dueDate}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                {filteredRec.length === 0 && <EmptyRow colSpan={6} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Cuentas por pagar" && (
        <div className="content-card">
          <CardHeading title="Cuentas por pagar" subtitle="Generadas automáticamente desde cada orden de compra. Al pagar, pasa a Caja y Bancos." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>REFERENCIA</th><th>ORDEN</th><th>PROVEEDOR</th><th>MONTO</th><th>VENCIMIENTO</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filteredPay.map(p => (
                  <tr key={p.id}>
                    <td className="code-cell">{p.id}</td>
                    <td className="code-cell">{p.poId}</td>
                    <td><strong>{p.supplierName}</strong></td>
                    <td className="amount-cell">{money(p.amount)}</td>
                    <td>{p.dueDate}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
                {filteredPay.length === 0 && <EmptyRow colSpan={6} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Caja y bancos" && (
        <div className="content-card">
          <CardHeading title="Caja y bancos" subtitle="Registro de ingresos (cobros de facturas) y egresos (pagos a proveedores) del periodo." />
          <div className="cash-summary">
            <div className="cash-box green-box"><TrendingUp size={18} /><span>Total ingresos</span><strong>{money(totalIngresos)}</strong></div>
            <div className="cash-box red-box"><TrendingDown size={18} /><span>Total egresos</span><strong>{money(totalEgresos)}</strong></div>
            <div className="cash-box blue-box"><Banknote size={18} /><span>Saldo neto</span><strong>{money(saldoCaja)}</strong></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>FECHA</th><th>TIPO</th><th>CONCEPTO</th><th>REFERENCIA</th><th>MONTO</th></tr></thead>
              <tbody>
                {filteredCash.map(c => (
                  <tr key={c.id}>
                    <td>{c.date}</td>
                    <td><span className={`kardex-type ${c.type === "Ingreso" ? "kardex-in" : "kardex-out"}`}>{c.type === "Ingreso" ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />} {c.type}</span></td>
                    <td>{c.concept}</td>
                    <td className="code-cell">{c.ref}</td>
                    <td className={`amount-cell ${c.type === "Egreso" ? "amount-egreso" : ""}`}>{c.type === "Egreso" ? "−" : "+"}{money(c.amount)}</td>
                  </tr>
                ))}
                {filteredCash.length === 0 && <EmptyRow colSpan={5} />}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Centro Documental ────────────────────────────────────────────────────────
function DocumentosPage({ search, docs, invoices, purchaseOrders, onNewDoc }: {
  search: string; docs: DocFile[]; invoices: Invoice[]; purchaseOrders: PurchaseOrder[]; onNewDoc: () => void;
}) {
  const [tab, setTab] = useState("Todos");
  const q = search.toLowerCase();

  const filtered = docs.filter(d =>
    (tab === "Todos" || d.category === tab) &&
    `${d.name} ${d.ref} ${d.category}`.toLowerCase().includes(q)
  );

  const catIcons: Record<string, typeof Files> = {
    "Factura": FileText, "Orden de compra": ClipboardList, "Contrato": UserCheck, "Reporte": ChartNoAxesCombined,
  };

  return (
    <section>
      <PageHeading eyebrow="GESTIÓN EMPRESARIAL / DOCUMENTOS" title="Centro documental"
        description="Repositorio de facturas, órdenes de compra, contratos y reportes. Los documentos del sistema se generan automáticamente; también puedes registrar contratos y documentos externos."
        actionLabel="Registrar documento" onAction={onNewDoc} />

      <div className="stats-grid stats-grid-four">
        <StatCard icon={Files}         label="Total documentos"  value={String(docs.length)}                                         note="En el repositorio"   color="blue"   />
        <StatCard icon={FileText}      label="Facturas"          value={String(docs.filter(d => d.category === "Factura").length)}   note="Emitidas"            color="green"  />
        <StatCard icon={ClipboardList} label="Órdenes de compra" value={String(docs.filter(d => d.category === "Orden de compra").length)} note="Registradas" color="violet" />
        <StatCard icon={UserCheck}     label="Contratos"         value={String(docs.filter(d => d.category === "Contrato").length)} note="Vigentes"             color="orange" />
      </div>

      <div className="subnav">
        {["Todos","Factura","Orden de compra","Contrato","Reporte"].map(t => (
          <button key={t} className={tab === t ? "subnav-active" : ""} onClick={() => setTab(t)}>{t === "Todos" ? "Todos" : t + "s"}</button>
        ))}
      </div>

      <div className="content-card">
        <CardHeading title="Documentos del sistema" subtitle="Los documentos se generan automáticamente desde las operaciones del ERP." />
        <div className="document-list">
          {filtered.map(d => {
            const Icon = catIcons[d.category] ?? Files;
            return (
              <div className="document-row" key={d.id}>
                <div className="document-icon"><Icon size={20} /></div>
                <div className="document-info">
                  <strong>{d.name}</strong>
                  <small>{d.category} · Ref: {d.ref} · {d.date}</small>
                </div>
                <span className="document-type">{d.type}</span>
                <span className="document-size">{d.size}</span>
                <StatusBadge status={
                  invoices.find(inv => inv.id === d.ref)?.status ??
                  purchaseOrders.find(po => po.id === d.ref)?.status ??
                  "Disponible"
                } />
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="module-placeholder" style={{ minHeight: 150 }}>
              <p>No hay documentos en esta categoría.</p>
            </div>
          )}
        </div>
      </div>

      <div className="info-banner">
        <Cloud size={20} />
        <div>
          <strong>Almacenamiento cloud simulado</strong>
          <p>En producción, los archivos se almacenarían en Amazon S3 y sus metadatos en una base de datos RDS.</p>
        </div>
      </div>
    </section>
  );
}

// ─── Inteligencia de Negocios ─────────────────────────────────────────────────
function AnalyticsPage({ sales, products, customers, receivables, payables, invoices, kardex }: {
  sales: Sale[]; products: Product[]; customers: Customer[]; receivables: Receivable[]; payables: Payable[]; invoices: Invoice[]; kardex: KardexEntry[];
}) {
  const totalVentas   = sales.filter(s => s.type === "Venta").reduce((a, s) => a + s.amount, 0);
  const totalCompras  = sales.filter(s => s.type === "Compra").reduce((a, s) => a + s.amount, 0);
  const margenBruto   = totalVentas - totalCompras;
  const rotacion      = kardex.filter(k => k.type === "Salida").reduce((a, k) => a + k.qty, 0);
  const ventasSolo    = sales.filter(s => s.type === "Venta");
  const ticketProm    = ventasSolo.length > 0 ? totalVentas / ventasSolo.length : 0;
  const cobradas      = invoices.filter(i => i.status === "Cobrada").length;
  const cobradoRate   = invoices.length > 0 ? Math.round((cobradas / invoices.length) * 100) : 0;

  // Gráfica con datos reales: agrupa ventas y compras del sistema por mes
  const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const monthMap: Record<string, { ventas: number; compras: number }> = {};
  // Inicializar los últimos 6 meses
  const now = new Date(2026, 9, 25); // Oct 2026
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = MONTHS[d.getMonth()];
    monthMap[key] = { ventas: 0, compras: 0 };
  }
  // Mapeo de nombres de mes en español a índice
  const esMonth: Record<string, number> = {
    "ene": 0, "feb": 1, "mar": 2, "abr": 3, "may": 4, "jun": 5,
    "jul": 6, "ago": 7, "sep": 8, "oct": 9, "nov": 10, "dic": 11,
  };
  sales.forEach(s => {
    const parts = s.date.toLowerCase().split(" ");
    const monthName = parts[2] ?? parts[1] ?? "";
    const monthIdx = esMonth[monthName.slice(0, 3)];
    if (monthIdx === undefined) return;
    const monthKey = MONTHS[monthIdx];
    if (!monthMap[monthKey]) return;
    if (s.type === "Venta")  monthMap[monthKey].ventas  += s.amount;
    if (s.type === "Compra") monthMap[monthKey].compras += s.amount;
  });
  // Base histórica simulada para meses sin datos reales (para que la gráfica tenga contexto)
  const baseVentas:  Record<string, number> = { May: 28500, Jun: 34200, Jul: 31800, Ago: 42100, Sep: 38900 };
  const baseCompras: Record<string, number> = { May: 18200, Jun: 21500, Jul: 19400, Ago: 24800, Sep: 22700 };
  const chartData = Object.entries(monthMap).map(([month, v]) => ({
    month,
    ventas:  v.ventas  > 0 ? v.ventas  : (baseVentas[month]  ?? 0),
    compras: v.compras > 0 ? v.compras : (baseCompras[month] ?? 0),
  }));

  const categoryData = [
    { name: "Electrónica", value: Math.round(products.filter(p => p.category === "Electrónica").reduce((a, p) => a + p.price * p.stock, 0) / 1000) },
    { name: "Accesorios",  value: Math.round(products.filter(p => p.category === "Accesorios").reduce((a, p)  => a + p.price * p.stock, 0) / 1000) },
    { name: "Oficina",     value: Math.round(products.filter(p => p.category === "Oficina").reduce((a, p)     => a + p.price * p.stock, 0) / 1000) },
    { name: "Otros",       value: Math.round(products.filter(p => p.category === "Otros").reduce((a, p)       => a + p.price * p.stock, 0) / 1000) },
  ];
  const maxCat = Math.max(...categoryData.map(c => c.value), 1);

  return (
    <section>
      <PageHeading eyebrow="ANÁLISIS Y CONTROL" title="Inteligencia de negocios"
        description="Indicadores generados en tiempo real desde los datos del sistema: ventas, inventario, finanzas y clientes."
        actionLabel="Imprimir reporte" onAction={() => window.print()} />

      <div className="stats-grid stats-grid-four">
        <StatCard icon={TrendingUp}        label="Ventas totales"     value={money(totalVentas)}    note="Acumulado del sistema"  positive trend="+12.8%" color="blue"   />
        <StatCard icon={CircleDollarSign}  label="Margen bruto"       value={money(margenBruto)}    note="Ventas − compras"       color="green"  />
        <StatCard icon={RefreshCw}         label="Unidades rotadas"   value={`${rotacion} un.`}     note="Salidas del inventario" color="violet" />
        <StatCard icon={ShoppingCart}      label="Ticket promedio"    value={money(ticketProm)}     note="Por operación de venta" color="orange" />
      </div>

      <div className="dashboard-grid">
        <div className="content-card chart-card">
          <CardHeading title="Ventas vs. Compras" subtitle="Datos reales del sistema — últimos 6 meses" />
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#EDF0F5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8993A5" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8993A5" }} axisLine={false} tickLine={false} tickFormatter={v => `${Number(v)/1000}k`} />
                <Tooltip formatter={v => money(Number(v))} />
                <Bar dataKey="ventas"  name="Ventas"  fill="#3578E5" radius={[5,5,0,0]} />
                <Bar dataKey="compras" name="Compras" fill="#13B8A6" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="content-card">
          <CardHeading title="KPIs financieros" subtitle="Indicadores clave calculados del sistema" />
          <div className="kpi-list">
            <div className="kpi-row"><span>Facturas cobradas</span><div className="report-track"><div style={{ width: `${cobradoRate}%` }} /></div><strong>{cobradoRate}%</strong></div>
            <div className="kpi-row"><span>Clientes activos</span><div className="report-track"><div style={{ width: `${Math.round(customers.filter(c => c.status === "Activo").length / (customers.length || 1) * 100)}%` }} /></div><strong>{customers.filter(c => c.status === "Activo").length}/{customers.length}</strong></div>
            <div className="kpi-row"><span>Stock suficiente</span><div className="report-track"><div style={{ width: `${Math.round(products.filter(p => p.stock >= 10).length / (products.length || 1) * 100)}%` }} /></div><strong>{products.filter(p => p.stock >= 10).length}/{products.length}</strong></div>
            <div className="kpi-row"><span>CxC vencidas</span><div className="report-track"><div style={{ width: `${Math.round(receivables.filter(r => r.status === "Vencida").length / (receivables.length || 1) * 100)}%`, background: "#e05151" }} /></div><strong>{receivables.filter(r => r.status === "Vencida").length}</strong></div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <CardHeading title="Valor de inventario por categoría" subtitle="Stock valorizado en miles de soles (S/ miles)" />
        <div className="report-list">
          {categoryData.map(c => (
            <div className="report-row" key={c.name}>
              <span>{c.name}</span>
              <div className="report-track"><div style={{ width: `${Math.round(c.value / maxCat * 100)}%` }} /></div>
              <strong>S/ {c.value}k</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Centro Cloud ─────────────────────────────────────────────────────────────
function CloudPage() {
  const services = [
    { name: "Amazon EC2",        short: "EC2",    desc: "Cómputo para ejecutar la aplicación web del ERP",              icon: Server,    detail: "Instancias t3.medium para frontend y backend." },
    { name: "Amazon S3",         short: "S3",     desc: "Almacenamiento de documentos, facturas y contratos",          icon: HardDrive, detail: "Bucket privado con políticas de acceso por rol." },
    { name: "Amazon RDS",        short: "RDS",    desc: "Base de datos relacional PostgreSQL administrada",             icon: Database,  detail: "Multi-AZ para alta disponibilidad." },
    { name: "Amazon CloudFront", short: "CDN",    desc: "Distribución de contenido estático con baja latencia",        icon: Cloud,     detail: "Caché de assets del frontend." },
    { name: "AWS IAM",           short: "IAM",    desc: "Gestión de identidades, roles y permisos de acceso",         icon: Lock,      detail: "Roles por módulo: admin, analista, vendedor." },
    { name: "Amazon CloudWatch", short: "CW",     desc: "Monitoreo de logs, métricas y alertas del sistema",           icon: Activity,  detail: "Alarmas por uso de CPU y errores 5xx." },
  ];

  return (
    <section>
      <PageHeading eyebrow="INFRAESTRUCTURA / AWS" title="Centro Cloud"
        description="Arquitectura de referencia del ERP en AWS. Cada servicio cumple una función específica en el sistema."
        actionLabel="Ver diagrama" onAction={() => { document.getElementById("cloud-diagram")?.scrollIntoView({ behavior: "smooth" }); }} />

      <div className="info-banner">
        <Cloud size={21} />
        <div>
          <strong>Arquitectura de referencia académica</strong>
          <p>Los servicios son reales de AWS pero no están conectados. Esta vista explica cómo se deployaría el ERP en producción.</p>
        </div>
      </div>

      <div className="stats-grid stats-grid-three">
        <StatCard icon={Server}    label="Cómputo"        value="EC2"  note="Aplicación web"       color="blue"   />
        <StatCard icon={HardDrive} label="Almacenamiento" value="S3"   note="Documentos y archivos" color="violet" />
        <StatCard icon={Database}  label="Base de datos"  value="RDS"  note="PostgreSQL gestionado" color="green"  />
      </div>

      <div className="content-card">
        <CardHeading title="Servicios de la arquitectura" subtitle="Función de cada componente en el sistema ERP" />
        <div className="service-grid">
          {services.map(({ name, short, desc, icon: Icon, detail }) => (
            <div className="service-card" key={short}>
              <div className="service-card-top">
                <div className="service-icon"><Icon size={23} /></div>
                <span className="coming-tag">REFERENCIA</span>
              </div>
              <h3>{name}</h3>
              <p>{desc}</p>
              <small style={{ color: "#8a95a6", fontSize: 9 }}>{detail}</small>
              <div className="service-status"><span className="status-dot neutral-dot" /> No conectado</div>
            </div>
          ))}
        </div>
      </div>

      <div className="content-card" id="cloud-diagram">
        <CardHeading title="Flujo de arquitectura" subtitle="Cómo interactúan los componentes en producción" />
        <div className="architecture-flow">
          <div className="architecture-node"><Eye size={22} /><strong>Usuario</strong><small>Navegador web</small></div>
          <span className="architecture-arrow">→</span>
          <div className="architecture-node"><Cloud size={22} /><strong>CloudFront + EC2</strong><small>Frontend + API</small></div>
          <span className="architecture-arrow">→</span>
          <div className="architecture-node"><Database size={22} /><strong>RDS + S3</strong><small>Datos y archivos</small></div>
          <span className="architecture-arrow">→</span>
          <div className="architecture-node"><Activity size={22} /><strong>CloudWatch</strong><small>Monitoreo</small></div>
        </div>
      </div>
    </section>
  );
}

// ─── Administración y Seguridad ───────────────────────────────────────────────
function AdminPage({ users, auditLog, onNewUser, onToggleUser }: { users: AppUser[]; auditLog: AuditEntry[]; onNewUser: () => void; onToggleUser: (id: number) => void }) {
  const [tab, setTab] = useState("Usuarios");

  const roles = [
    { name: "Administrador", desc: "Acceso completo a todos los módulos", perms: ["Gestión comercial","Abastecimiento","Inventario","Finanzas","Documentos","Analítica","Cloud","Administración"], color: "blue" },
    { name: "Analista",      desc: "Acceso a reportes y consultas",       perms: ["Gestión comercial","Inventario","Finanzas","Documentos","Analítica"],                                            color: "violet" },
    { name: "Vendedor",      desc: "Acceso a clientes, cotizaciones y ventas", perms: ["Gestión comercial","Inventario"],                                                                          color: "green" },
  ];

  return (
    <section>
      <PageHeading eyebrow="SISTEMA / GOBIERNO Y CONTROL" title="Administración y seguridad"
        description="Gestiona usuarios, roles, permisos y el registro de auditoría de todas las operaciones del sistema."
        actionLabel="Nuevo usuario" onAction={onNewUser} />

      <div className="stats-grid stats-grid-four">
        <StatCard icon={Users}      label="Usuarios activos"    value={String(users.filter(u => u.status === "Activo").length)} note="De un total de 5"             color="blue"   />
        <StatCard icon={Lock}       label="Roles definidos"     value="3"                                                        note="Admin, Analista, Vendedor"   color="violet" />
        <StatCard icon={ShieldCheck}label="Módulos protegidos"  value="8"                                                        note="Control por rol"             color="green"  />
        <StatCard icon={Activity}   label="Eventos de auditoría"value={String(auditLog.length)}                                  note="Todas las operaciones"       color="orange" />
      </div>

      <div className="admin-tabs">
        {["Usuarios","Roles y permisos","Auditoría","Configuración"].map(t => (
          <button key={t} className={tab === t ? "admin-tab-active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Usuarios" && (
        <div className="content-card">
          <CardHeading title="Usuarios del sistema" subtitle="Solo el administrador puede activar o desactivar usuarios. No se eliminan para mantener la trazabilidad." />
          <div className="table-wrap">
            <table>
              <thead><tr><th>USUARIO</th><th>CORREO</th><th>ROL</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><div className="table-person"><div className="company-avatar">{u.initials}</div><strong>{u.name}</strong></div></td>
                    <td>{u.email}</td>
                    <td><span className="coming-tag">{u.role}</span></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>
                      {u.id === 1 ? (
                        <span style={{ color: "#a0aab8", fontSize: 9 }}>Administrador principal</span>
                      ) : (
                        <button
                          className={u.status === "Activo" ? "button-secondary" : "button-primary"}
                          style={{ minHeight: 28, fontSize: 9, padding: "0 10px", color: u.status === "Activo" ? "#b33a3a" : undefined }}
                          onClick={() => onToggleUser(u.id)}
                        >
                          {u.status === "Activo" ? "Desactivar" : "Reactivar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Roles y permisos" && (
        <div className="content-card">
          <CardHeading title="Roles y permisos" subtitle="Cada rol define a qué módulos puede acceder el usuario" />
          <div className="roles-grid">
            {roles.map(r => (
              <div className="role-card" key={r.name}>
                <div className="role-card-top">
                  <div className={`stat-icon ${r.color}`}><Lock size={18} /></div>
                  <strong>{r.name}</strong>
                </div>
                <p>{r.desc}</p>
                <div className="role-perms">
                  {r.perms.map(p => <span key={p} className="perm-tag">{p}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Auditoría" && (
        <div className="content-card">
          <CardHeading title="Registro de auditoría" subtitle="Todas las operaciones realizadas en el sistema quedan registradas" />
          <div className="table-wrap">
            <table>
              <thead><tr><th>FECHA Y HORA</th><th>USUARIO</th><th>ACCIÓN</th><th>MÓDULO</th></tr></thead>
              <tbody>
                {auditLog.map(a => (
                  <tr key={a.id}>
                    <td className="code-cell">{a.date}</td>
                    <td><strong>{a.user}</strong></td>
                    <td>{a.action}</td>
                    <td><span className="coming-tag">{a.module}</span></td>
                  </tr>
                ))}
                {auditLog.length === 0 && <EmptyRow colSpan={4} />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Configuración" && (
        <div className="content-card">
          <CardHeading title="Configuración del sistema" subtitle="Parámetros generales del ERP" />
          <div className="config-list">
            {[
              ["Nombre de la empresa", "Empresa Demo S.A.C."],
              ["RUC",                  "20123456789"],
              ["Moneda",               "Soles (PEN)"],
              ["Zona horaria",         "America/Lima (UTC-5)"],
              ["Versión del sistema",  "ERP EnterpriseCloud v1.0.0"],
              ["Entorno",              "Demostración académica"],
            ].map(([key, val]) => (
              <div className="config-row" key={key}>
                <span>{key}</span>
                <strong>{val}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-banner">
        <ShieldCheck size={20} />
        <div>
          <strong>Seguridad del sistema</strong>
          <p>En producción, la autenticación se implementaría con JWT o AWS Cognito. Los roles controlarían el acceso a cada endpoint de la API.</p>
        </div>
      </div>
    </section>
  );
}

export default App;
