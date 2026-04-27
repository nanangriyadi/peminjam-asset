// ============================================================
// APPS SCRIPT - Peminjaman Barang Dashboard API
// Deploy sebagai: Web App > Execute as: Me > Anyone can access
// ============================================================

const SHEET_NAME = "Form Responses 1";

// Allowed origins untuk CORS - tambahkan URL GitHub Pages kamu
const ALLOWED_ORIGIN = "*"; // Ganti dengan URL GitHub Pages kamu jika mau lebih aman

function doGet(e) {
  const action = e.parameter.action || "getData";
  
  let result;
  
  try {
    if (action === "getData") {
      result = getData(e);
    } else if (action === "getStats") {
      result = getStats();
    } else if (action === "updateStatus") {
      result = updateStatus(e);
    } else if (action === "deleteRow") {
      result = deleteRow(e);
    } else {
      result = { success: false, message: "Action tidak dikenal" };
    }
  } catch (err) {
    result = { success: false, message: err.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: "Invalid JSON" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = body.action || "";
  let result;

  try {
    if (action === "updateStatus") {
      result = updateStatusPost(body);
    } else if (action === "deleteRow") {
      result = deleteRowPost(body);
    } else if (action === "addManual") {
      result = addManualEntry(body);
    } else {
      result = { success: false, message: "Action tidak dikenal" };
    }
  } catch (err) {
    result = { success: false, message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================== GET DATA =====================
function getData(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return { success: false, message: "Sheet tidak ditemukan: " + SHEET_NAME };
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [], total: 0 };
  
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  // Cek apakah kolom Status & Keterangan sudah ada, jika belum buat
  ensureExtraColumns(sheet, headers, lastCol);
  
  // Ambil ulang data setelah memastikan kolom ada
  const updatedLastCol = sheet.getLastColumn();
  const updatedHeaders = sheet.getRange(1, 1, 1, updatedLastCol).getValues()[0];
  const updatedRows = lastRow > 1 
    ? sheet.getRange(2, 1, lastRow - 1, updatedLastCol).getValues()
    : [];
  
  const data = updatedRows.map((row, index) => {
    const obj = { _rowIndex: index + 2 };
    updatedHeaders.forEach((h, i) => {
      if (h) obj[h.toString().trim()] = row[i] !== undefined ? row[i] : "";
    });
    return obj;
  });
  
  // Filter berdasarkan parameter
  const filterStatus = e && e.parameter.status ? e.parameter.status : "";
  const filterBarang = e && e.parameter.barang ? e.parameter.barang : "";
  const search = e && e.parameter.search ? e.parameter.search.toLowerCase() : "";
  const page = e && e.parameter.page ? parseInt(e.parameter.page) : 1;
  const limit = e && e.parameter.limit ? parseInt(e.parameter.limit) : 20;
  
  let filtered = data.filter(row => {
    let match = true;
    if (filterStatus && row["Status"] !== filterStatus) match = false;
    if (filterBarang && row["Barang Yang Di pinjam"] !== filterBarang) match = false;
    if (search) {
      const rowStr = JSON.stringify(row).toLowerCase();
      if (!rowStr.includes(search)) match = false;
    }
    return match;
  });
  
  // Sort terbaru dulu
  filtered.sort((a, b) => {
    const ta = new Date(a["Timestamp"] || 0).getTime();
    const tb = new Date(b["Timestamp"] || 0).getTime();
    return tb - ta;
  });
  
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    success: true,
    data: paginated,
    total,
    page,
    totalPages,
    limit
  };
}

// ===================== GET STATS =====================
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return { success: false, message: "Sheet tidak ditemukan" };
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { 
    success: true, 
    stats: { total: 0, dipinjam: 0, dikembalikan: 0, terlambat: 0, byBarang: {}, byBulan: {} } 
  };
  
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  const headerMap = {};
  headers.forEach((h, i) => { if (h) headerMap[h.toString().trim()] = i; });
  
  let total = 0, dipinjam = 0, dikembalikan = 0, terlambat = 0;
  const byBarang = {};
  const byBulan = {};
  
  rows.forEach(row => {
    if (!row[0]) return; // skip empty
    total++;
    
    const status = headerMap["Status"] !== undefined ? (row[headerMap["Status"]] || "Dipinjam") : "Dipinjam";
    const barang = headerMap["Barang Yang Di pinjam"] !== undefined ? row[headerMap["Barang Yang Di pinjam"]] : "";
    const tgl = headerMap["Tanggal Peminjaman Asset"] !== undefined ? row[headerMap["Tanggal Peminjaman Asset"]] : "";
    
    if (status === "Dikembalikan") dikembalikan++;
    else if (status === "Terlambat") terlambat++;
    else dipinjam++;
    
    if (barang) byBarang[barang] = (byBarang[barang] || 0) + 1;
    
    if (tgl) {
      const d = new Date(tgl);
      if (!isNaN(d.getTime())) {
        const key = (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
        byBulan[key] = (byBulan[key] || 0) + 1;
      }
    }
  });
  
  return {
    success: true,
    stats: { total, dipinjam, dikembalikan, terlambat, byBarang, byBulan }
  };
}

// ===================== UPDATE STATUS VIA GET =====================
function updateStatus(e) {
  const rowIndex = parseInt(e.parameter.row);
  const newStatus = e.parameter.status;
  const keterangan = e.parameter.keterangan || "";
  return doUpdateStatus(rowIndex, newStatus, keterangan);
}

function updateStatusPost(body) {
  const rowIndex = parseInt(body.row);
  const newStatus = body.status;
  const keterangan = body.keterangan || "";
  return doUpdateStatus(rowIndex, newStatus, keterangan);
}

function doUpdateStatus(rowIndex, newStatus, keterangan) {
  if (!rowIndex || !newStatus) return { success: false, message: "Parameter row dan status diperlukan" };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  ensureExtraColumns(sheet, headers, lastCol);
  
  const updatedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = updatedHeaders.findIndex(h => h && h.toString().trim() === "Status");
  const ketCol = updatedHeaders.findIndex(h => h && h.toString().trim() === "Keterangan");
  const tglKembaliCol = updatedHeaders.findIndex(h => h && h.toString().trim() === "Tanggal Kembali");
  
  if (statusCol === -1) return { success: false, message: "Kolom Status tidak ditemukan" };
  
  sheet.getRange(rowIndex, statusCol + 1).setValue(newStatus);
  if (ketCol !== -1) sheet.getRange(rowIndex, ketCol + 1).setValue(keterangan);
  if (tglKembaliCol !== -1 && newStatus === "Dikembalikan") {
    sheet.getRange(rowIndex, tglKembaliCol + 1).setValue(new Date());
  }
  
  return { success: true, message: "Status berhasil diperbarui" };
}

// ===================== DELETE ROW =====================
function deleteRow(e) {
  return doDeleteRow(parseInt(e.parameter.row));
}

function deleteRowPost(body) {
  return doDeleteRow(parseInt(body.row));
}

function doDeleteRow(rowIndex) {
  if (!rowIndex) return { success: false, message: "Parameter row diperlukan" };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  sheet.deleteRow(rowIndex);
  
  return { success: true, message: "Data berhasil dihapus" };
}

// ===================== ADD MANUAL ENTRY =====================
function addManualEntry(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  ensureExtraColumns(sheet, headers, lastCol);
  
  const updatedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const newRow = updatedHeaders.map(h => {
    if (!h) return "";
    const key = h.toString().trim();
    if (key === "Timestamp") return new Date();
    return body[key] || "";
  });
  
  sheet.appendRow(newRow);
  
  return { success: true, message: "Data berhasil ditambahkan" };
}

// ===================== ENSURE EXTRA COLUMNS =====================
function ensureExtraColumns(sheet, headers, lastCol) {
  const needed = ["Status", "Keterangan", "Tanggal Kembali"];
  needed.forEach(colName => {
    const exists = headers.some(h => h && h.toString().trim() === colName);
    if (!exists) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(colName);
      // Set default "Dipinjam" untuk kolom Status
      if (colName === "Status") {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const range = sheet.getRange(2, lastCol, lastRow - 1, 1);
          const values = range.getValues().map(() => ["Dipinjam"]);
          range.setValues(values);
        }
      }
      headers.push(colName); // update local array
    }
  });
}

// ===================== TEST FUNCTION =====================
function testGetData() {
  const result = getData(null);
  Logger.log(JSON.stringify(result));
}
