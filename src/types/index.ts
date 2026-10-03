export type MaterialUnit = 'g' | 'ml' | 'pcs' | 'sheet' | 'pack';

export type MaterialCategory =
  | 'Biji Kopi'
  | 'Susu & Dairy'
  | 'Pemanis & Sirup'
  | 'Bubuk Minuman'
  | 'Kemasan'
  | 'Bahan Makanan';

export interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  category: MaterialCategory;
  currentStock: number;
  unit: MaterialUnit;
  minStockThreshold: number;
  costPerUnit: number; // in IDR
  lastPurchaseDate: string;
  supplier: string;
}

export interface RecipeItem {
  rawMaterialId: string;
  quantity: number;
  unit: MaterialUnit;
}

export type MenuCategory =
  | 'Signature Coffee'
  | 'Espresso Based'
  | 'Milk & Latte'
  | 'Manual Brew'
  | 'Non-Coffee'
  | 'Pastry & Snacks'
  | 'Beans';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  image?: string;
  recipe: RecipeItem[];
  isAvailable: boolean;
  allowsTemperatureChoice?: boolean;
  allowsSizeChoice?: boolean;
  allowsSugarLevel?: boolean;
  allowsMilkOptions?: boolean;
  isFeatured?: boolean; // tampil di "Menu Favorit" pada halaman /store (opsional)
}

export interface CustomChoice {
  id: string;
  label: string;
  price: number; // tambahan harga jual (Rp)
  cost: number; // tambahan HPP (Rp) di luar bahan baku terhubung
  extraPercent?: number; // tambahan takaran resep (%) -> memengaruhi pemotongan stok & HPP
  materialId?: string; // bahan baku yang ikut dipotong
  materialQty?: number; // jumlah bahan yang dipotong per porsi
}

export type CustomGroupKey = 'temperature' | 'size' | 'sugar' | 'milk' | 'addons';

export interface CustomizationConfig {
  temperature: CustomChoice[];
  size: CustomChoice[];
  sugar: CustomChoice[];
  milk: CustomChoice[];
  addons: CustomChoice[];
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  // Pilihan kustomisasi disimpan sebagai label teks (bisa diubah di Pengaturan > Kustomisasi Kasir)
  temperature?: string;
  size?: string;
  sugarLevel?: string;
  milkType?: string;
  addons?: string[];
  extraShot?: boolean; // legacy (data lama)
  recipeMultiplier?: number; // pengali takaran resep (mis. 1.25 untuk Large)
  extraDeductions?: { rawMaterialId: string; quantity: number }[]; // bahan tambahan yang dipotong per 1 porsi
  notes?: string;
  itemTotal: number;
  calculatedCost: number; // HPP per item configuration
}

export type PaymentMethod =
  | 'Tunai'
  | 'QRIS'
  | 'Transfer Bank'
  | 'EDC/Debit'
  | 'ShopeePay Settlement'
  | 'GrabPay Settlement'
  | 'GoPay Settlement';

export type SalesChannel = 'OFFLINE' | 'ONLINE';
export type OnlinePlatform = 'ShopeeFood' | 'GrabFood' | 'GoFood';

export interface DeductedMaterialRecord {
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  unit: MaterialUnit;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  points: number;
  totalSpent: number;
  totalOrders: number;
  joinedDate: string;
  lastVisitDate: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  channel: SalesChannel;
  onlinePlatform?: OnlinePlatform;
  onlineOrderNumber?: string;
  onlineNetIncome?: number; // Pendapatan bersih manual dari platform online yang tersambung ke laporan keuangan
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  items: CartItem[];
  orderType: 'Dine In' | 'Take Away' | 'Online Delivery';
  cashierName: string;
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  totalAmount: number; // For offline: total tagihan. For online: menu price total
  totalCOGS: number; // Total HPP Bahan Baku
  grossProfit: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  changeAmount?: number;
  status: 'COMPLETED' | 'CANCELLED';
  deductedMaterials: DeductedMaterialRecord[];
}

export type StockMovementType =
  | 'SALE_DEDUCTION'
  | 'PURCHASE_RESTOCK'
  | 'WASTE_SPOIL'
  | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  stockAfter: number;
  unit: MaterialUnit;
  referenceId?: string;
  date: string;
  timestamp: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Sewa Tempat'
  | 'Listrik, Air & Gas'
  | 'Gaji Karyawan'
  | 'Es Batu & Galon'
  | 'Internet & POS'
  | 'Perawatan Alat'
  | 'Pembelian Bahan Baku'
  | 'Operasional Lainnya';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  timestamp: string;
  paymentMethod: 'Kas Tunai' | 'Rekening Bank';
  receiptNumber?: string;
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  date: string;
  initialCash: number;
  cashSales: number;
  nonCashSales: number;
  actualCashEnding?: number;
  cashDifference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  wifiInfo: string;
  taxRatePercent: number;
  enableTax: boolean;
  receiptFooter: string;
  pointsPerAmount: number; // e.g., 1 point per 10,000 IDR
  redemptionRate: number; // e.g., 1 point = 1,000 IDR discount
  customization?: CustomizationConfig; // pilihan kustomisasi kasir (opsional, ada nilai bawaan)

  // --- Etalase online /store (semua opsional supaya data lama tetap kompatibel) ---
  isOpen?: boolean; // status kedai untuk pelanggan online (kosong = tutup)
  openingTime?: string; // "HH:mm"
  closingTime?: string; // "HH:mm"
  whatsappNumber?: string; // tujuan pesanan WhatsApp (kosong = pakai `phone`)
  storeDescription?: string;
  instagram?: string; // username atau URL
  mapsUrl?: string; // link Google Maps (kosong = dibuat dari alamat)
  heroImageUrl?: string;
  logoUrl?: string;
}

/** Bagian StoreSettings yang hanya diatur dari kartu "Toko Online" */
export const STOREFRONT_SETTING_KEYS = [
  'isOpen',
  'openingTime',
  'closingTime',
  'whatsappNumber',
  'storeDescription',
  'instagram',
  'mapsUrl',
  'heroImageUrl',
  'logoUrl',
] as const;
export type StorefrontSettings = Pick<StoreSettings, (typeof STOREFRONT_SETTING_KEYS)[number]>;

// ---------------------------------------------------------------------------
// Pesanan Online (dari halaman /store)
// ---------------------------------------------------------------------------
export type OnlineOrderStatus = 'NEW' | 'PROCESSING' | 'READY' | 'DONE';

export interface OnlineOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OnlineOrder {
  id: string;
  orderNumber: number; // nomor urut tampil, mis. #001
  customerName: string;
  customerPhone: string;
  items: OnlineOrderItem[];
  totalAmount: number;
  status: OnlineOrderStatus;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

/** Data toko yang aman ditampilkan ke publik (tanpa resep/HPP/keuangan) */
export interface PublicStoreInfo {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  storeDescription: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  instagram: string;
  mapsUrl: string;
  heroImageUrl: string;
  logoUrl: string;
}

export interface PublicMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  isFeatured: boolean;
}

// ---------------------------------------------------------------------------
// Utang & Piutang (mis. bahan baku yang dipesan tempo dari supplier)
// ---------------------------------------------------------------------------
export type DebtKind = 'UTANG' | 'PIUTANG'; // UTANG = kita berutang ke pihak lain; PIUTANG = pihak lain berutang ke kita

export interface DebtPayment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: 'Kas Tunai' | 'Rekening Bank';
  notes?: string;
}

export interface DebtRecord {
  id: string;
  kind: DebtKind;
  party: string; // nama supplier / pihak terkait
  description: string; // mis. "Kopi Arabika 5 kg"
  totalAmount: number;
  date: string; // tanggal transaksi
  dueDate?: string; // jatuh tempo (opsional)
  payments: DebtPayment[];
  notes?: string;
  materialId?: string; // bahan baku terkait (bila berasal dari restock)
  timestamp: string;
}
