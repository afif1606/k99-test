/**
 * Kode Google Apps Script (Code.gs) yang ditampilkan di modal Google Sheets.
 * Sumber tunggal: file ini juga dipakai untuk menghasilkan Code.gs.
 */
export const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * K99 COFFEE POS & ERP - GOOGLE APPS SCRIPT BACKEND API
 * =========================================================================
 * Script ini berfungsi sebagai REST API / Webhook Backend untuk K99 Coffee POS
 * yang di-deploy di Cloudflare Pages.
 * 
 * VERSI SINKRONISASI PERANGKAT (desktop & HP berbagi data yang sama).
 * Jika Anda MENGUPDATE dari versi lama: tempel kode ini, lalu Terapkan > Kelola
 * penerapan > ikon pensil > Versi: "Versi baru" > Terapkan (URL tidak berubah).
 *
 * PANDUAN CEPAT (3 Menit):
 * 1. Buat Google Sheet baru di Google Drive Anda.
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus semua kode yang ada di editor, lalu paste kode ini.
 * 4. Klik "Simpan" (Ctrl+S).
 * 5. Klik tombol "Terapkan" (Deploy) -> "Penerapan Baru" (New Deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web App).
 *    - Jalankan sebagai (Execute as): "Saya" (Me)
 *    - Akses (Who has access): "Siapa saja" (Anyone) -> PENTING!
 * 7. Klik "Terapkan". Salin URL Aplikasi Web (/exec) dan tempel ke POS.
 * =========================================================================
 */

const SHEET_TRANSAKSI = 'Transaksi';
const SHEET_BAHAN_BAKU = 'Bahan_Baku';
const SHEET_BEBAN = 'Beban_Operasional';
const SHEET_LOG_BAHAN = 'Log_Bahan_Keluar';
const SHEET_SHIFT = 'Rekap_Shift';
const SHEET_PELANGGAN = 'Pelanggan';
const SHEET_MENU = 'Menu_Produk';
const SHEET_APP_DATA = 'App_Data';
const SHEET_ONLINE = 'Pesanan_Online';
const SHEET_PUBLIC = 'Toko_Publik';
const STATE_CHUNK_SIZE = 40000;
const PUBLIC_CACHE_KEY = 'k99_public_store_v1';
const PUBLIC_CACHE_SECONDS = 20;
const ONLINE_STATUSES = ['NEW', 'PROCESSING', 'READY', 'DONE'];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'ping') {
    return createJsonResponse({
      status: 'success',
      message: 'K99 Coffee Apps Script Backend Siap & Terhubung!',
      spreadsheetName: ss.getName(),
      timestamp: new Date().toISOString()
    });
  }

  // Etalase online (publik): hanya data aman, tanpa resep/HPP/laporan keuangan
  if (action === 'get_public_store') {
    return createJsonResponse(getPublicStore_(ss));
  }

  if (action === 'get_all_data') {
    initAllSheets(ss);
    return createJsonResponse({
      status: 'success',
      data: {
        transactions: getSheetDataAsJson(ss.getSheetByName(SHEET_TRANSAKSI)),
        rawMaterials: getSheetDataAsJson(ss.getSheetByName(SHEET_BAHAN_BAKU)),
        expenses: getSheetDataAsJson(ss.getSheetByName(SHEET_BEBAN))
      }
    });
  }

  return createJsonResponse({ status: 'error', message: 'Action tidak dikenal' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initAllSheets(ss);

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || 'create_transaction';

    // 0. Sinkronisasi antar perangkat (snapshot data aplikasi)
    if (action === 'get_state') {
      return createJsonResponse(readState_(ss, payload.sinceVersion));
    }
    if (action === 'save_state' && payload.state) {
      return createJsonResponse(saveState_(ss, payload));
    }

    // 0b. Pesanan Online (etalase /store)
    if (action === 'create_online_order') {
      return createJsonResponse(createOnlineOrder_(ss, payload));
    }
    if (action === 'list_online_orders') {
      return createJsonResponse(listOnlineOrders_(ss));
    }
    if (action === 'update_online_order_status') {
      return createJsonResponse(updateOnlineOrderStatus_(ss, payload));
    }

    // 1. Simpan Transaksi Kasir
    if (action === 'create_transaction' && payload.data) {
      const tx = payload.data;
      const sheetTx = ss.getSheetByName(SHEET_TRANSAKSI);

      const itemsSummary = (tx.items || []).map(function(i) {
        return i.quantity + 'x ' + i.name + (i.temperature ? ' [' + i.temperature + ']' : '');
      }).join('; ');

      sheetTx.appendRow([
        tx.timestamp || new Date().toISOString(),
        tx.id,
        tx.channel || 'OFFLINE',
        tx.onlinePlatform || '-',
        tx.orderType || 'Dine In',
        tx.customerName || 'Walk-in Customer',
        tx.customerPhone || '-',
        tx.paymentMethod || 'QRIS',
        tx.subtotal || 0,
        tx.discountAmount || 0,
        tx.taxAmount || 0,
        tx.totalAmount || 0,
        tx.totalCOGS || 0,
        tx.grossProfit || 0,
        tx.cashierName || 'Kasir K99',
        itemsSummary
      ]);

      // Catat pemotongan bahan baku
      if (tx.deductedMaterials && tx.deductedMaterials.length > 0) {
        const sheetLog = ss.getSheetByName(SHEET_LOG_BAHAN);
        tx.deductedMaterials.forEach(function(mat) {
          sheetLog.appendRow([
            tx.timestamp || new Date().toISOString(),
            tx.id,
            mat.rawMaterialId,
            mat.rawMaterialName,
            mat.quantity,
            mat.unit
          ]);
          kurangiStokBahan(ss, mat.rawMaterialId, mat.quantity);
        });
      }

      return createJsonResponse({ status: 'success', message: 'Transaksi tersimpan di Google Sheets' });
    }

    // 2. Simpan Beban Operasional
    if (action === 'create_expense' && payload.data) {
      const exp = payload.data;
      const sheetBeban = ss.getSheetByName(SHEET_BEBAN);
      sheetBeban.appendRow([
        exp.timestamp || new Date().toISOString(),
        exp.id,
        exp.date,
        exp.category,
        exp.description,
        exp.amount,
        exp.paymentMethod,
        exp.receiptNumber || '-'
      ]);
      return createJsonResponse({ status: 'success', message: 'Beban tersimpan' });
    }

    // 3. Simpan Rekap Shift Kasir
    if (action === 'record_shift' && payload.data) {
      const shift = payload.data;
      const sheetShift = ss.getSheetByName(SHEET_SHIFT);
      sheetShift.appendRow([
        shift.id, shift.date, shift.cashierName, shift.startTime, shift.endTime || '-',
        shift.initialCash, shift.cashSales, shift.nonCashSales, shift.actualCashEnding || 0,
        shift.cashDifference || 0, shift.status, shift.notes || '-'
      ]);
      return createJsonResponse({ status: 'success', message: 'Shift tersimpan' });
    }

    // 4. Sinkronisasi Keseluruhan Master Data (Bulk Sync)
    if (action === 'sync_all' && payload.data) {
      const allData = payload.data;
      if (allData.rawMaterials) {
        const sBahan = ss.getSheetByName(SHEET_BAHAN_BAKU);
        sBahan.clearContents();
        sBahan.appendRow(['ID Bahan', 'Nama Bahan', 'SKU', 'Kategori', 'Stok Terkini', 'Satuan', 'Stok Minimum', 'Harga Beli/Satuan', 'Supplier']);
        formatHeaderRow(sBahan, '#1e3a5f');
        const rows = allData.rawMaterials.map(function(m) {
          return [m.id, m.name, m.sku, m.category, m.currentStock, m.unit, m.minStockThreshold, m.costPerUnit, m.supplier];
        });
        if (rows.length > 0) sBahan.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return createJsonResponse({ status: 'success', message: 'Master data berhasil disinkronkan' });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi tidak dikenal' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function kurangiStokBahan(ss, rawMaterialId, qtyDeducted) {
  const sheet = ss.getSheetByName(SHEET_BAHAN_BAKU);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rawMaterialId) {
      const currentVal = Number(data[i][4]) || 0;
      sheet.getRange(i + 1, 5).setValue(Math.max(0, currentVal - Number(qtyDeducted)));
      break;
    }
  }
}

function initAllSheets(ss) {
  let sTx = ss.getSheetByName(SHEET_TRANSAKSI);
  if (!sTx) {
    sTx = ss.insertSheet(SHEET_TRANSAKSI);
    sTx.appendRow(['Waktu Transaksi', 'ID Transaksi', 'Saluran', 'Platform Online', 'Tipe Order', 'Nama Pelanggan', 'No HP', 'Metode Bayar', 'Subtotal', 'Diskon', 'Pajak', 'Total Tagihan', 'HPP', 'Laba Kotor', 'Kasir', 'Rincian Menu']);
    formatHeaderRow(sTx, '#166534');
  }
  let sBahan = ss.getSheetByName(SHEET_BAHAN_BAKU);
  if (!sBahan) {
    sBahan = ss.insertSheet(SHEET_BAHAN_BAKU);
    sBahan.appendRow(['ID Bahan', 'Nama Bahan', 'SKU', 'Kategori', 'Stok Terkini', 'Satuan', 'Stok Minimum', 'Harga Beli/Satuan', 'Supplier']);
    formatHeaderRow(sBahan, '#1e3a5f');
  }
  let sBeban = ss.getSheetByName(SHEET_BEBAN);
  if (!sBeban) {
    sBeban = ss.insertSheet(SHEET_BEBAN);
    sBeban.appendRow(['Waktu Catat', 'ID Beban', 'Tanggal', 'Kategori Beban', 'Keterangan', 'Nominal (Rp)', 'Metode Bayar', 'No Bukti']);
    formatHeaderRow(sBeban, '#991b1b');
  }
  let sLog = ss.getSheetByName(SHEET_LOG_BAHAN);
  if (!sLog) {
    sLog = ss.insertSheet(SHEET_LOG_BAHAN);
    sLog.appendRow(['Waktu Pemakaian', 'ID Transaksi', 'ID Bahan', 'Nama Bahan', 'Qty Terpakai', 'Satuan']);
    formatHeaderRow(sLog, '#475569');
  }
  let sApp = ss.getSheetByName(SHEET_APP_DATA);
  if (!sApp) {
    sApp = ss.insertSheet(SHEET_APP_DATA);
    sApp.appendRow(['Kunci', 'Bagian', 'Nilai']);
    formatHeaderRow(sApp, '#334155');
  }
  let sOnline = ss.getSheetByName(SHEET_ONLINE);
  if (!sOnline) {
    sOnline = ss.insertSheet(SHEET_ONLINE);
    sOnline.appendRow(['ID Pesanan', 'No Urut', 'Waktu Pesan', 'Nama Pelanggan', 'No WhatsApp', 'Rincian (JSON)', 'Total', 'Status', 'Catatan', 'Diperbarui']);
    formatHeaderRow(sOnline, '#b45309');
    // Kolom teks murni agar isian pelanggan tidak pernah dibaca sebagai rumus
    sOnline.getRange('D:F').setNumberFormat('@');
    sOnline.getRange('I:I').setNumberFormat('@');
  }
  let sShift = ss.getSheetByName(SHEET_SHIFT);
  if (!sShift) {
    sShift = ss.insertSheet(SHEET_SHIFT);
    sShift.appendRow(['ID Shift', 'Tanggal', 'Kasir', 'Mulai', 'Selesai', 'Modal Awal', 'Penjualan Tunai', 'Penjualan Non-Tunai', 'Kas Aktual', 'Selisih', 'Status', 'Catatan']);
    formatHeaderRow(sShift, '#581c87');
  }
}

function formatHeaderRow(sheet, hexColor) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  const range = sheet.getRange(1, 1, 1, lastCol);
  range.setBackground(hexColor);
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = data[i][j];
    rows.push(obj);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// SINKRONISASI ANTAR PERANGKAT
// Seluruh data aplikasi disimpan sebagai JSON terpotong-potong (chunk) di sheet
// "App_Data" (batas 1 sel = 50.000 karakter). Baris 2 berisi versi data.
// JANGAN edit/hapus sheet App_Data secara manual.
// ---------------------------------------------------------------------------
function readMeta_(sheet) {
  const v = sheet.getRange(2, 3).getValue();
  if (!v) return { version: 0, updatedAt: null };
  try {
    const m = JSON.parse(String(v));
    return { version: Number(m.version) || 0, updatedAt: m.updatedAt || null };
  } catch (err) {
    return { version: 0, updatedAt: null };
  }
}

function readStateJson_(sheet) {
  const last = sheet.getLastRow();
  if (last < 3) return null;
  const rows = sheet.getRange(3, 1, last - 2, 3).getValues();
  const parts = rows
    .filter(function(r) { return r[0] === 'state'; })
    .sort(function(a, b) { return Number(a[1]) - Number(b[1]); })
    .map(function(r) { return String(r[2]).substring(2); });
  if (parts.length === 0) return null;
  try {
    return JSON.parse(parts.join(''));
  } catch (err) {
    return null;
  }
}

function readState_(ss, sinceVersion) {
  const sheet = ss.getSheetByName(SHEET_APP_DATA);
  const meta = readMeta_(sheet);
  if (meta.version === 0) {
    return { status: 'success', version: 0, updatedAt: null, state: null };
  }
  if (sinceVersion !== undefined && sinceVersion !== null && Number(sinceVersion) === meta.version) {
    return { status: 'success', version: meta.version, updatedAt: meta.updatedAt, unchanged: true };
  }
  return { status: 'success', version: meta.version, updatedAt: meta.updatedAt, state: readStateJson_(sheet) };
}

function saveState_(ss, payload) {
  const sheet = ss.getSheetByName(SHEET_APP_DATA);
  const meta = readMeta_(sheet);
  const base = Number(payload.baseVersion) || 0;

  // Perangkat lain sudah menyimpan versi lebih baru -> minta klien menggabung dulu
  if (base !== meta.version) {
    return {
      status: 'conflict',
      version: meta.version,
      updatedAt: meta.updatedAt,
      state: meta.version === 0 ? null : readStateJson_(sheet)
    };
  }

  const json = JSON.stringify(payload.state);
  const newMeta = { version: meta.version + 1, updatedAt: new Date().toISOString() };
  const rows = [['Kunci', 'Bagian', 'Nilai'], ['__meta__', 0, JSON.stringify(newMeta)]];
  for (let i = 0, part = 0; i < json.length; i += STATE_CHUNK_SIZE, part++) {
    rows.push(['state', part, 'J|' + json.substring(i, i + STATE_CHUNK_SIZE)]);
  }

  sheet.clearContents();
  const range = sheet.getRange(1, 1, rows.length, 3);
  range.setNumberFormat('@');
  range.setValues(rows);

  // Cermin daftar bahan baku ke sheet Bahan_Baku agar mudah dibaca/dilaporkan
  if (Array.isArray(payload.state.rawMaterials)) {
    mirrorRawMaterials_(ss, payload.state.rawMaterials);
  }
  // Perbarui salinan publik untuk etalase online (kegagalan di sini tidak boleh menggagalkan sinkronisasi)
  try {
    writePublicSnapshot_(ss, buildPublicSnapshot_(payload.state));
  } catch (err) {
    // abaikan
  }
  return { status: 'success', version: newMeta.version, updatedAt: newMeta.updatedAt };
}

function mirrorRawMaterials_(ss, mats) {
  const sBahan = ss.getSheetByName(SHEET_BAHAN_BAKU);
  sBahan.clearContents();
  sBahan.appendRow(['ID Bahan', 'Nama Bahan', 'SKU', 'Kategori', 'Stok Terkini', 'Satuan', 'Stok Minimum', 'Harga Beli/Satuan', 'Supplier']);
  formatHeaderRow(sBahan, '#1e3a5f');
  const out = mats.map(function(m) {
    return [m.id, m.name, m.sku, m.category, m.currentStock, m.unit, m.minStockThreshold, m.costPerUnit, m.supplier];
  });
  if (out.length > 0) sBahan.getRange(2, 1, out.length, out[0].length).setValues(out);
}

// ---------------------------------------------------------------------------
// ETALASE ONLINE (/store) & PESANAN ONLINE
// - Salinan publik (nama kedai, status buka/tutup, menu tersedia) disimpan di sheet
//   "Toko_Publik" setiap kali admin menyimpan data, sehingga pembacaan publik cepat
//   dan TIDAK membuka resep, HPP, transaksi, ataupun laporan keuangan.
// - Pesanan pelanggan disimpan di sheet "Pesanan_Online" (terpisah dari snapshot
//   App_Data) supaya tidak bentrok dengan sinkronisasi POS.
// ---------------------------------------------------------------------------
function cleanText_(v, max) {
  return String(v === undefined || v === null ? '' : v).replace(/[\\u0000-\\u001f]/g, ' ').trim().substring(0, max);
}

function buildPublicSnapshot_(state) {
  const s = (state && state.storeSettings) || {};
  const list = (state && Array.isArray(state.menuItems)) ? state.menuItems : [];
  const menu = [];
  list.forEach(function(m) {
    if (!m || m.isAvailable !== true) return;
    const price = Math.round(Number(m.price));
    if (!(price > 0)) return;
    const img = String(m.image || '');
    menu.push({
      id: String(m.id),
      name: cleanText_(m.name, 80),
      category: cleanText_(m.category, 40),
      price: price,
      description: cleanText_(m.description, 200),
      image: (img.indexOf('http://') === 0 || img.indexOf('https://') === 0) ? img.substring(0, 500) : '',
      isFeatured: m.isFeatured === true
    });
  });
  return {
    store: {
      storeName: cleanText_(s.storeName, 80),
      tagline: cleanText_(s.tagline, 120),
      address: cleanText_(s.address, 200),
      phone: cleanText_(s.phone, 30),
      whatsappNumber: cleanText_(s.whatsappNumber, 30),
      storeDescription: cleanText_(s.storeDescription, 600),
      isOpen: s.isOpen === true,
      openingTime: cleanText_(s.openingTime, 5),
      closingTime: cleanText_(s.closingTime, 5),
      instagram: cleanText_(s.instagram, 60),
      mapsUrl: cleanText_(s.mapsUrl, 500),
      heroImageUrl: cleanText_(s.heroImageUrl, 500),
      logoUrl: cleanText_(s.logoUrl, 500)
    },
    menu: menu,
    updatedAt: new Date().toISOString()
  };
}

function writePublicSnapshot_(ss, snap) {
  let sheet = ss.getSheetByName(SHEET_PUBLIC);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PUBLIC);
  }
  const json = JSON.stringify(snap);
  const rows = [];
  for (let i = 0; i < json.length; i += STATE_CHUNK_SIZE) {
    rows.push(['J|' + json.substring(i, i + STATE_CHUNK_SIZE)]);
  }
  sheet.clearContents();
  if (rows.length > 0) {
    const range = sheet.getRange(1, 1, rows.length, 1);
    range.setNumberFormat('@');
    range.setValues(rows);
  }
  CacheService.getScriptCache().remove(PUBLIC_CACHE_KEY);
  return snap;
}

function readPublicSnapshot_(ss) {
  const sheet = ss.getSheetByName(SHEET_PUBLIC);
  if (!sheet || sheet.getLastRow() < 1) return null;
  const rows = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  const json = rows.map(function(r) { return String(r[0]).substring(2); }).join('');
  try {
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

// Ambil salinan publik; bila belum ada (script baru dipasang), bentuk dari data tersimpan.
function loadPublicSnapshot_(ss) {
  let snap = readPublicSnapshot_(ss);
  if (snap) return snap;
  const app = ss.getSheetByName(SHEET_APP_DATA);
  if (!app) return null;
  const state = readStateJson_(app);
  if (!state) return null;
  return writePublicSnapshot_(ss, buildPublicSnapshot_(state));
}

function getPublicStore_(ss) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(PUBLIC_CACHE_KEY);
  if (hit) {
    try {
      return JSON.parse(hit);
    } catch (err) {
      // lanjut baca ulang
    }
  }
  const snap = loadPublicSnapshot_(ss);
  if (!snap) {
    return { status: 'error', code: 'NOT_READY', message: 'Etalase belum siap. Buka aplikasi POS sekali agar data tersinkron.' };
  }
  const out = { status: 'success', store: snap.store, menu: snap.menu, updatedAt: snap.updatedAt };
  try {
    const text = JSON.stringify(out);
    if (text.length < 90000) cache.put(PUBLIC_CACHE_KEY, text, PUBLIC_CACHE_SECONDS);
  } catch (err) {
    // abaikan
  }
  return out;
}

function createOnlineOrder_(ss, payload) {
  const snap = loadPublicSnapshot_(ss);
  if (!snap) {
    return { status: 'error', code: 'NOT_READY', message: 'Etalase belum siap.' };
  }
  if (snap.store.isOpen !== true) {
    return { status: 'error', code: 'CLOSED', message: 'Maaf, kedai sedang tutup. Silakan pesan saat kami buka.' };
  }

  const name = cleanText_(payload.customerName, 60);
  const phone = String(payload.customerPhone || '').replace(/[^0-9+]/g, '').substring(0, 20);
  const notes = cleanText_(payload.notes, 300);
  if (!name) return { status: 'error', code: 'INVALID', message: 'Nama pelanggan wajib diisi.' };
  if (phone.length < 8) return { status: 'error', code: 'INVALID', message: 'Nomor WhatsApp tidak valid.' };

  // Harga SELALU dihitung ulang dari menu server (tidak percaya angka dari browser)
  const byId = {};
  snap.menu.forEach(function(m) { byId[m.id] = m; });
  const qtyById = {};
  const order = [];
  (Array.isArray(payload.items) ? payload.items.slice(0, 60) : []).forEach(function(it) {
    const m = it ? byId[String(it.menuItemId)] : null;
    const q = it ? Math.floor(Number(it.quantity)) : 0;
    if (!m || !(q >= 1)) return;
    if (!qtyById[m.id]) {
      qtyById[m.id] = 0;
      order.push(m.id);
    }
    qtyById[m.id] = Math.min(qtyById[m.id] + q, 99);
  });
  if (order.length === 0) {
    return { status: 'error', code: 'UNAVAILABLE', message: 'Item pesanan sudah tidak tersedia. Muat ulang halaman.' };
  }

  let total = 0;
  const items = order.map(function(id) {
    const m = byId[id];
    const qty = qtyById[id];
    const sub = m.price * qty;
    total += sub;
    return { menuItemId: m.id, name: m.name, price: m.price, quantity: qty, subtotal: sub };
  });

  const sheet = ss.getSheetByName(SHEET_ONLINE);
  const last = sheet.getLastRow();
  const prevNo = last > 1 ? Number(sheet.getRange(last, 2).getValue()) || 0 : 0;
  const number = prevNo + 1;
  const now = new Date().toISOString();
  const id = 'ON-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMdd') + '-' + String(number) + Math.random().toString(36).substring(2, 5).toUpperCase();

  sheet.appendRow([id, number, now, name, phone, JSON.stringify(items), total, 'NEW', notes, now]);

  return { status: 'success', order: { id: id, orderNumber: number, customerName: name, customerPhone: phone, items: items, totalAmount: total, status: 'NEW', notes: notes, createdAt: now } };
}

function listOnlineOrders_(ss) {
  const sheet = ss.getSheetByName(SHEET_ONLINE);
  const last = sheet.getLastRow();
  if (last < 2) return { status: 'success', orders: [] };
  const first = Math.max(2, last - 299); // 300 pesanan terbaru
  const rows = sheet.getRange(first, 1, last - first + 1, 10).getValues();
  const orders = rows.map(function(r) {
    let items = [];
    try {
      items = JSON.parse(String(r[5]));
    } catch (err) {
      items = [];
    }
    return {
      id: String(r[0]),
      orderNumber: Number(r[1]) || 0,
      createdAt: String(r[2]),
      customerName: String(r[3]),
      customerPhone: String(r[4]),
      items: items,
      totalAmount: Number(r[6]) || 0,
      status: ONLINE_STATUSES.indexOf(String(r[7])) >= 0 ? String(r[7]) : 'NEW',
      notes: String(r[8] || ''),
      updatedAt: String(r[9] || r[2])
    };
  }).filter(function(o) { return o.id; });
  orders.reverse();
  return { status: 'success', orders: orders };
}

function updateOnlineOrderStatus_(ss, payload) {
  const status = String(payload.status || '');
  const id = String(payload.id || '');
  if (ONLINE_STATUSES.indexOf(status) < 0 || !id) {
    return { status: 'error', message: 'Data status tidak valid.' };
  }
  const sheet = ss.getSheetByName(SHEET_ONLINE);
  const last = sheet.getLastRow();
  if (last < 2) return { status: 'error', message: 'Pesanan tidak ditemukan.' };
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      sheet.getRange(i + 2, 8).setValue(status);
      sheet.getRange(i + 2, 10).setValue(new Date().toISOString());
      return { status: 'success', id: id, orderStatus: status };
    }
  }
  return { status: 'error', message: 'Pesanan tidak ditemukan.' };
}

function createJsonResponse(output) {
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}`;
