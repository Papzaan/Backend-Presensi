const express = require("express");
const router = express.Router();
const { sequelize } = require("../models");
const { QueryTypes } = require("sequelize");
const moment = require("moment-timezone");
//const { generateDateList } = require("../utils/dateUtils");

// Route to get OPD list
router.get("/opd-list", async (req, res) => {
  try {
    const opdListQuery = `
      SELECT id_opd, nama_opd FROM opd ORDER BY nama_opd ASC;
    `;
    const opdList = await sequelize.query(opdListQuery, {
      type: QueryTypes.SELECT,
    });
    res.json(opdList); // Sending response as JSON
  } catch (err) {
    console.error("Error fetching OPD list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get Izin list
router.get("/izin-list", async (req, res) => {
  try {
    const izinListQuery = `
      SELECT keterangan, jenis_izin, tanggal_izin, tanggal_selesai, verifikasi, bukti, izin.id_izin, 
      pegawai.nama_pegawai AS users,
      opd.nama_opd 
      FROM izin 
      JOIN pegawai ON izin.id_izin = pegawai.id_pegawai
      JOIN opd ON izin.id_opd = opd.id_opd
      ORDER BY id_izin ASC;
    `;
    const izinList = await sequelize.query(izinListQuery, {
      type: QueryTypes.SELECT,
    });
    res.json(izinList); // Sending response as JSON
  } catch (err) {
    console.error("Error fetching Izin list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to fetch Pegawai list by OPD
router.get("/pegawai-list", async (req, res) => {
  const { id_opd } = req.query;

  try {
    let pegawaiListQuery = `
        SELECT id_pegawai, nama_pegawai FROM pegawai ORDER BY id_opd ASC, nama_pegawai ASC;
    `;
    // Only filter by OPD if the id_opd is provided
    if (id_opd) {
      pegawaiListQuery += ` WHERE id_opd = :id_opd ORDER BY nama_pegawai ASC;`;
    }

    const pegawaiList = await sequelize.query(pegawaiListQuery, {
      type: QueryTypes.SELECT,
      replacements: { id_opd },
    });

    // Ensure that the result is always an array
    res.json(Array.isArray(pegawaiList) ? pegawaiList : []);
  } catch (err) {
    console.error("Error fetching Pegawai list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/presensi", async (req, res) => {
  const { id_opd, id_pegawai, date, limit, search, page } = req.query;

  const selectedDate = date ? new Date(date) : new Date();
  const selectedDateFormatted = selectedDate.toISOString().split("T")[0]; // Ensure correct date format

  console.log("Selected Date (formatted):", selectedDateFormatted); // Debugging the selected date

  // Convert lateness threshold to GMT+7 time zone for any given date
  function convertToGMTPlus7(timeString, date) {
    const threshold = moment.tz(timeString, "HH:mm:ss", "Asia/Jakarta");
    threshold.set({
      year: date.getFullYear(),
      month: date.getMonth(),
      date: date.getDate(),
    });
    return threshold.valueOf(); // Return in epoch time
  }

  let holidayQuery = `
    SELECT * FROM hari_libur
    WHERE DATE(date_start) <= :selectedDate
    AND (date_end IS NULL OR DATE(date_end) >= :selectedDate)
  `;

  try {
    const holidays = await sequelize.query(holidayQuery, {
      type: QueryTypes.SELECT,
      replacements: { selectedDate: selectedDateFormatted },
    });

    let latenessThreshold = "07:31:00"; // Default lateness threshold for normal day
    let holidayName = null;
    let isWeekend = false;
    let isHoliday = false;
    let isRamadan = false;

    // Check if the selected date is a weekend (Saturday or Sunday)
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // If it's a weekend, do not calculate lateness
      isWeekend = true;
      latenessThreshold = "No lateness calculation for weekends";
    }

    // If it's a holiday, handle accordingly
    if (holidays.length > 0) {
      const holiday = holidays[0];
      holidayName = holiday.holiday_name;

      // If it's a holiday (type = 2), set threshold to normal (no lateness)
      if (holiday.type === 2) {
        latenessThreshold = "No lateness calculation for holidays";
        isHoliday = true;
      }
      // If it's Ramadan (type = 1), set threshold to 08:01:00
      else if (holiday.type === 1) {
        latenessThreshold = "08:01:00"; // Ramadan lateness threshold
        isRamadan = true;
      }
    }

    // Prepare the query to get the actual attendance data for the whole day
    const startEpoch = new Date(selectedDate.setHours(0, 0, 0, 0)).getTime(); // 00:00:00 of the selected day
    const endEpoch = new Date(selectedDate).setHours(23, 59, 59, 999); // 23:59:59 of the selected day

    const baseWhere = [];
    const replacements = { startEpoch, endEpoch };

    baseWhere.push(`p.jam_masuk BETWEEN :startEpoch AND :endEpoch`);

    if (id_opd) {
      baseWhere.push(`b.id_opd = :id_opd`);
      replacements.id_opd = id_opd;
    }

    if (id_pegawai) {
      baseWhere.push(`b.id_pegawai = :id_pegawai`);
      replacements.id_pegawai = id_pegawai;
    }

    if (search) {
      baseWhere.push(
        `(b.nip_pegawai LIKE :search OR b.nama_pegawai LIKE :search)`
      );
      replacements.search = `%${search}%`;
    }

    const totalCountQuery = `
      SELECT COUNT(*) AS totalRecords
      FROM presensi AS p
      JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
      WHERE ${baseWhere.join(" AND ")}
    `;

    // Get the total count of records
    const totalCountResult = await sequelize.query(totalCountQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });
    const totalRecords = totalCountResult[0].totalRecords;
    const totalPages = Math.ceil(totalRecords / limit);

    // Ensure the limit and page are valid
    const pageNum = Math.max(1, Math.min(totalPages, parseInt(page, 10) || 1));
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    // Query to get the actual data
    const updatedQuery = `
      SELECT p.*, b.nama_pegawai, b.nip_pegawai, c.nama_opd
      FROM presensi AS p
      JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
      LEFT JOIN opd AS c ON b.id_opd = c.id_opd
      WHERE ${baseWhere.join(" AND ")}
      ORDER BY p.jam_masuk ASC
      LIMIT :limit OFFSET :offset
    `;

    const updatedData = await sequelize.query(updatedQuery, {
      type: QueryTypes.SELECT,
      replacements: { ...replacements, limit: limitNum, offset },
    });

    let totalLateness = 0; // Counter for total lateness
    let totalOntime = 0; // Counter for total on-time

    // Process each record to determine lateness and holiday status
    updatedData.forEach((record) => {
      const jamMasukEpoch = record.jam_masuk;
      const jamMasuk = new Date(jamMasukEpoch); // Convert epoch to Date object
      let lateness = "On time"; // Default lateness status

      // Convert jam_masuk to GMT+7 (adjust time by +7 hours)
      const jamMasukGMT7 = moment.utc(jamMasuk).tz("Asia/Jakarta").valueOf(); // Adjust to GMT+7

      // Convert lateness threshold to the same date as jam_masuk (on the same day as jam_masuk)
      const latenessTimeGMT7 = convertToGMTPlus7(latenessThreshold, jamMasuk);

      // If jam_masuk is later than the lateness threshold, calculate minutes late
      if (
        !isWeekend &&
        !isHoliday &&
        !isRamadan &&
        jamMasukGMT7 > latenessTimeGMT7
      ) {
        const latenessMinutes = Math.floor(
          (jamMasukGMT7 - latenessTimeGMT7) / 60000
        ); // Calculate lateness in minutes
        lateness = `${latenessMinutes} menit`;
        totalLateness++; // Increment lateness counter
      } else if (isRamadan && jamMasukGMT7 > latenessTimeGMT7) {
        const latenessMinutes = Math.floor(
          (jamMasukGMT7 - latenessTimeGMT7) / 60000
        ); // Calculate lateness in minutes
        lateness = `${latenessMinutes} menit`;
        totalLateness++; // Increment lateness counter
      } else {
        totalOntime++; // Increment on-time counter
      }

      // Add the lateness and holiday information to the record
      record.lateness = lateness;
      record.isWeekend = isWeekend;
      record.isHoliday = isHoliday;
      record.isRamadan = isRamadan;
      record.holidayName = holidayName;
    });

    // Respond with the data in JSON format, including total lateness and total on-time counts
    res.json({
      message: "Successfully fetched attendance data",
      code: 200,
      totalRecords,
      totalPages,
      totalLateness, // Total lateness count
      totalOntime, // Total on-time count
      data: updatedData,
    });
  } catch (err) {
    console.error("Error fetching presensi data:", err.message);
    res.status(500).json({
      message: "Error retrieving attendance data",
      code: 500,
      error: err.message,
    });
  }
});

router.get("/opd-list", async (req, res) => {
  try {
    const opdListQuery = `
      SELECT id_opd, nama_opd,
      FROM opd
      ORDER BY nama_opd ASC;
    `;
    const opdList = await sequelize.query(opdListQuery, {
      type: QueryTypes.SELECT,
    });
    res.json(opdList); // Send as JSON
  } catch (err) {
    console.error("Error fetching OPS list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Route to get Pangkat dan golongan
router.get("/pangkat-list", async (req, res) => {
  try {
    const golonganListQuery = `
      SELECT id_pangkat, nama_pangkat, golongan
      FROM pangkat
      ORDER BY nama_pangkat ASC;
    `;
    const golonganList = await sequelize.query(golonganListQuery, {
      type: QueryTypes.SELECT,
    });
    res.json(golonganList); // Send as JSON
  } catch (err) {
    console.error("Error fetching Pangkat list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get Jabatan list
router.get("/jabatan-list", async (req, res) => {
  try {
    const jabatanListQuery = `
      SELECT j.id_jabatan, j.nama_jabatan, j.id_opd, o.nama_opd
      FROM jabatan j
      JOIN opd o ON j.id_opd = o.id_opd
      GROUP BY j.nama_jabatan ASC
      ORDER BY j.nama_jabatan ASC;
    `;
    const jabatanList = await sequelize.query(jabatanListQuery, {
      type: QueryTypes.SELECT,
    });
    res.json(jabatanList); // Send as JSON
  } catch (err) {
    console.error("Error fetching Jabatan list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//rekap dashboard
router.get("/rekap-global", async (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({
      code: 400,
      message: "start_date dan end_date wajib diisi",
    });
  }

  const startEpoch = new Date(start_date + "T00:00:00Z").getTime();
  const endEpoch = new Date(end_date + "T23:59:59Z").getTime();

  try {
    // Hari libur
    const libur = await sequelize.query(
      `SELECT date_start, date_end FROM hari_libur
       WHERE (date_start BETWEEN :start_date AND :end_date)
         OR (date_end BETWEEN :start_date AND :end_date)
         OR (:start_date BETWEEN date_start AND date_end)
         OR (:end_date BETWEEN date_start AND date_end)`,
      {
        type: QueryTypes.SELECT,
        replacements: { start_date, end_date },
      }
    );

    // Set hari libur
    const hariLiburSet = new Set();
    libur.forEach((l) => {
      let curr = new Date(l.date_start);
      const end = new Date(l.date_end);
      while (curr <= end) {
        hariLiburSet.add(curr.toISOString().split("T")[0]);
        curr = new Date(curr.getTime() + 86400000);
      }
    });

    // Tanggal kerja
    const tanggalSet = new Set();
    let loopDate = new Date(start_date);
    const loopEnd = new Date(end_date);
    while (loopDate <= loopEnd) {
      const day = loopDate.getDay();
      const tglStr = loopDate.toISOString().split("T")[0];
      if (day !== 0 && day !== 6 && !hariLiburSet.has(tglStr)) {
        tanggalSet.add(tglStr);
      }
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // Presensi
    const presensi = await sequelize.query(
      `
      SELECT p.*, b.nama_pegawai
      FROM presensi p
      JOIN pegawai b ON p.id_pegawai = b.id_pegawai
      WHERE p.jam_masuk BETWEEN :startEpoch AND :endEpoch
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { startEpoch, endEpoch },
      }
    );

    // Izin
    const izin = await sequelize.query(
      `
      SELECT a.*, b.nama_pegawai
      FROM izin a
      JOIN pegawai b ON a.id_pegawai = b.id_pegawai
      WHERE a.verifikasi = 1 AND a.tanggal_izin BETWEEN :startEpoch AND :endEpoch
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { startEpoch, endEpoch },
      }
    );

    // Semua pegawai
    const pegawaiList = await sequelize.query(
      `
      SELECT id_pegawai, nama_pegawai FROM pegawai
    `,
      { type: QueryTypes.SELECT }
    );

    const rekap = {};
    const detail = {
      biasa: [],
      khusus: [],
      izin: [],
      tanpa_keterangan: [],
    };

    // PRESENSI
    presensi.forEach((p) => {
      const tanggal = new Date(p.jam_masuk).toISOString().split("T")[0];
      if (!tanggalSet.has(tanggal)) return;
      if (!rekap[tanggal]) {
        rekap[tanggal] = { biasa: 0, khusus: 0, izin: 0, tanpa_keterangan: 0 };
      }

      if ((p.ket_masuk || "").startsWith("Biasa")) {
        rekap[tanggal].biasa++;
        detail.biasa.push({ ...p, tanggal });
      } else if ((p.ket_masuk || "").startsWith("Khusus")) {
        rekap[tanggal].khusus++;
        detail.khusus.push({ ...p, tanggal });
      }
    });

    // IZIN
    izin.forEach((i) => {
      const tanggal = new Date(i.tanggal_izin).toISOString().split("T")[0];
      if (!tanggalSet.has(tanggal)) return;
      if (!rekap[tanggal]) {
        rekap[tanggal] = { biasa: 0, khusus: 0, izin: 0, tanpa_keterangan: 0 };
      }
      rekap[tanggal].izin++;
      detail.izin.push({ ...i, tanggal });
    });

    // TANPA KETERANGAN
    pegawaiList.forEach((p) => {
      tanggalSet.forEach((tgl) => {
        const hadir = detail.biasa
          .concat(detail.khusus, detail.izin)
          .some((d) => d.id_pegawai === p.id_pegawai && d.tanggal === tgl);
        if (!hadir) {
          if (!rekap[tgl]) {
            rekap[tgl] = { biasa: 0, khusus: 0, izin: 0, tanpa_keterangan: 0 };
          }
          rekap[tgl].tanpa_keterangan++;
          detail.tanpa_keterangan.push({ ...p, tanggal: tgl });
        }
      });
    });

    // Sorting tanggal
    const sortedRekap = Object.keys(rekap)
      .sort()
      .reduce((acc, key) => {
        acc[key] = rekap[key];
        return acc;
      }, {});

    return res.json({
      code: 200,
      message: "Berhasil rekap global",
      data: sortedRekap,
      detail,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      code: 500,
      message: "Error",
      error: err.message,
    });
  }
});

// REKAP UTAMA
router.get("/rekap", async (req, res) => {
  const { start_date, end_date, id_opd, id_jabatan, id_pangkat } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({
      code: 400,
      message: "start_date dan end_date wajib diisi",
    });
  }

  // Hitung epoch dengan zona WIB (UTC+7)
  const startEpoch = new Date(start_date + "T00:01:00+07:00").getTime();
  const endEpoch = new Date(end_date + "T23:59:59+07:00").getTime();

  const replacements = {
    startEpoch,
    endEpoch,
    id_opd,
    id_jabatan,
    id_pangkat,
  };

  const filterOPD = id_opd ? "AND b.id_opd = :id_opd" : "";
  const filterJabatan = id_jabatan ? "AND b.id_jabatan = :id_jabatan" : "";
  const filterPangkat = id_pangkat ? "AND b.id_pangkat = :id_pangkat" : "";

  try {
    // Ambil daftar hari libur
    const libur = await sequelize.query(
      `
      SELECT date_start, date_end FROM hari_libur
      WHERE (date_start BETWEEN :start_date AND :end_date)
         OR (date_end BETWEEN :start_date AND :end_date)
         OR (:start_date BETWEEN date_start AND date_end)
         OR (:end_date BETWEEN date_start AND date_end)
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          start_date,
          end_date,
        },
      }
    );

    // Siapkan set tanggal libur
    const hariLiburSet = new Set();
    libur.forEach((l) => {
      let curr = new Date(l.date_start);
      const end = new Date(l.date_end);

      while (curr <= end) {
        const year = curr.getFullYear();
        const month = String(curr.getMonth() + 1).padStart(2, "0");
        const day = String(curr.getDate()).padStart(2, "0");
        const tgl = `${year}-${month}-${day}`;
        hariLiburSet.add(tgl);

        curr = new Date(curr.getTime() + 86400000); // +1 hari
      }
    });

    // Generate hanya hari kerja
    const tanggalSet = new Set();
    let loopDate = new Date(start_date + "T00:00:00+07:00");
    const loopEndDate = new Date(end_date + "T00:00:00+07:00");
    while (loopDate <= loopEndDate) {
      const day = loopDate.getDay();
      const year = loopDate.getFullYear();
      const month = String(loopDate.getMonth() + 1).padStart(2, "0");
      const date = String(loopDate.getDate()).padStart(2, "0");
      const tglStr = `${year}-${month}-${date}`;
      if (day !== 0 && day !== 6 && !hariLiburSet.has(tglStr)) {
        tanggalSet.add(tglStr);
      }
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // PRESENSI
    const presensi = await sequelize.query(
      `
      SELECT p.*, b.nama_pegawai, b.nip_pegawai, c.nama_opd
      FROM presensi p
      JOIN pegawai b ON p.id_pegawai = b.id_pegawai
      LEFT JOIN opd c ON b.id_opd = c.id_opd
      WHERE p.jam_masuk BETWEEN :startEpoch AND :endEpoch
      ${filterOPD} ${filterJabatan} ${filterPangkat}
    `,
      { type: QueryTypes.SELECT, replacements }
    );

    // IZIN
    const startEpochSec = Math.floor(startEpoch / 1000);
    const endEpochSec = Math.floor(endEpoch / 1000);

    const izin = await sequelize.query(
      `
      SELECT a.*, b.nama_pegawai, b.nip_pegawai, c.nama_opd
      FROM izin a
      JOIN pegawai b ON a.id_pegawai = b.id_pegawai
      LEFT JOIN opd c ON b.id_opd = c.id_opd
      WHERE 
        a.tanggal_izin REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$'
        AND UNIX_TIMESTAMP(STR_TO_DATE(a.tanggal_izin, '%d/%m/%Y')) 
            BETWEEN :startEpochSec AND :endEpochSec
        ${filterOPD} ${filterJabatan} ${filterPangkat}
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          startEpochSec,
          endEpochSec,
          ...replacements,
        },
      }
    );

    // PEGAWAI
    const pegawaiList = await sequelize.query(
      `
      SELECT b.id_pegawai, b.nama_pegawai, b.nip_pegawai, c.nama_opd
      FROM pegawai b
      LEFT JOIN opd c ON b.id_opd = c.id_opd
      WHERE 1=1 ${filterOPD} ${filterJabatan} ${filterPangkat}
    `,
      { type: QueryTypes.SELECT, replacements }
    );

    const rekap = {};
    const detail = {};

    pegawaiList.forEach((p) => {
      const opd = p.nama_opd || "Tidak Diketahui";
      if (!rekap[opd]) {
        rekap[opd] = {};
        detail[opd] = {
          biasa: [],
          khusus: [],
          izin: [],
          tanpa_keterangan: [],
        };
      }
    });

    // PRESENSI
    presensi.forEach((p) => {
      const opd = p.nama_opd || "Tidak Diketahui";
      const d = new Date(p.jam_masuk); // WIB lokal
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const tanggal = `${year}-${month}-${day}`;

      if (!tanggalSet.has(tanggal)) return;

      if (!rekap[opd][tanggal]) {
        rekap[opd][tanggal] = {
          biasa: 0,
          khusus: 0,
          izin: 0,
          tanpa_keterangan: 0,
        };
      }

      if ((p.ket_masuk || "").startsWith("Biasa")) {
        rekap[opd][tanggal].biasa++;
        detail[opd].biasa.push({ ...p, tanggal });
      } else if ((p.ket_masuk || "").startsWith("Khusus")) {
        rekap[opd][tanggal].khusus++;
        detail[opd].khusus.push({ ...p, tanggal });
      }
    });

    // IZIN Count
    izin.forEach((i) => {
      const opd = i.nama_opd || "Tidak Diketahui";

      let tanggal = null;
      if (i.tanggal_izin && i.tanggal_izin.includes("/")) {
        const [d, m, y] = i.tanggal_izin.split("/");
        tanggal = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(
          2,
          "0"
        )}`;
      }

      if (!tanggal || !tanggalSet.has(tanggal)) return;

      if (!rekap[opd][tanggal]) {
        rekap[opd][tanggal] = {
          biasa: 0,
          khusus: 0,
          izin: 0,
          tanpa_keterangan: 0,
        };
      }

      rekap[opd][tanggal].izin++;
      detail[opd].izin.push({ ...i, tanggal });
    });

    // TANPA KETERANGAN
    pegawaiList.forEach((p) => {
      const opd = p.nama_opd || "Tidak Diketahui";
      tanggalSet.forEach((tgl) => {
        if (!rekap[opd][tgl]) {
          rekap[opd][tgl] = {
            biasa: 0,
            khusus: 0,
            izin: 0,
            tanpa_keterangan: 0,
          };
        }

        const hadir = detail[opd].biasa
          .concat(detail[opd].khusus, detail[opd].izin)
          .some((d) => d.id_pegawai === p.id_pegawai && d.tanggal === tgl);

        if (!hadir) {
          rekap[opd][tgl].tanpa_keterangan++;
          detail[opd].tanpa_keterangan.push({ ...p, tanggal: tgl });
        }
      });
    });

    // SORTING
    Object.keys(rekap).forEach((opd) => {
      const sorted = Object.keys(rekap[opd])
        .sort()
        .reduce((acc, key) => {
          acc[key] = rekap[opd][key];
          return acc;
        }, {});
      rekap[opd] = sorted;
    });

    return res.json({
      code: 200,
      message: "Berhasil rekap",
      data: rekap,
      detail,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      code: 500,
      message: "Error",
      error: err.message,
    });
  }
});

// Route to get Presensi data with lateness calculation considering holidays, Ramadan, and weekends
// router.get('/presensi', async (req, res) => {
//   const { id_opd, id_pegawai, date, limit, search, page } = req.query;

//   const selectedDate = date ? new Date(date) : new Date();
//   const startEpoch = new Date(selectedDate.setHours(0, 0, 0, 0)).getTime();
//   const endEpoch = new Date(selectedDate).setHours(23, 59, 59, 999);

//   // Query to fetch the holiday data and check if it's a holiday or Ramadan
//   let holidayQuery = `
//     SELECT * FROM hari_libur
//     WHERE date_start <= :selectedDate AND (date_end >= :selectedDate OR date_end IS NULL)
//   `;

//   try {
//     const holidays = await sequelize.query(holidayQuery, {
//       type: QueryTypes.SELECT,
//       replacements: { selectedDate: selectedDate.toISOString().split('T')[0] }
//     });

//     // Determine if the selected date is a holiday or Ramadan or weekend
//     let latenessThreshold = '07:31:00'; // Default to normal day
//     let holidayName = null;
//     let isWeekend = false;

//     // Check if the selected date is a weekend (Saturday or Sunday)
//     const dayOfWeek = selectedDate.getDay();  // 0 = Sunday, 6 = Saturday
//     if (dayOfWeek === 0 || dayOfWeek === 6) {
//       // If it's a weekend, do not calculate lateness
//       isWeekend = true;
//       latenessThreshold = 'No lateness calculation for weekends';
//     }

//     // If it's a holiday, handle accordingly
//     if (holidays.length > 0) {
//       const holiday = holidays[0];
//       holidayName = holiday.holiday_name;

//       // If it's a holiday (type = 1), set threshold to normal (no lateness)
//       if (holiday.type === 1) {
//         latenessThreshold = 'No lateness calculation for holidays';
//       }
//       // If it's Ramadan (type = 2), set threshold to 08:30:00
//       else if (holiday.type === 2) {
//         latenessThreshold = '08:30:00'; // Ramadan lateness threshold
//       }
//     }

//     const baseWhere = [];
//     const replacements = { startEpoch, endEpoch };

//     baseWhere.push(`p.jam_masuk BETWEEN :startEpoch AND :endEpoch`);

//     if (id_opd) {
//       baseWhere.push(`b.id_opd = :id_opd`);
//       replacements.id_opd = id_opd;
//     }

//     if (id_pegawai) {
//       baseWhere.push(`b.id_pegawai = :id_pegawai`);
//       replacements.id_pegawai = id_pegawai;
//     }

//     if (search) {
//       baseWhere.push(`(b.nip_pegawai LIKE :search OR b.nama_pegawai LIKE :search)`);
//       replacements.search = `%${search}%`;
//     }

//     const totalCountQuery = `
//       SELECT COUNT(*) AS totalRecords
//       FROM presensi AS p
//       JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
//       WHERE ${baseWhere.join(' AND ')}
//     `;

//     // Get the total count of records
//     const totalCountResult = await sequelize.query(totalCountQuery, {
//       type: QueryTypes.SELECT,
//       replacements
//     });
//     const totalRecords = totalCountResult[0].totalRecords;
//     const totalPages = Math.ceil(totalRecords / limit);

//     // Ensure the limit and page are valid
//     const pageNum = Math.max(1, Math.min(totalPages, parseInt(page, 10) || 1));
//     const limitNum = Math.max(1, parseInt(limit, 10) || 10);
//     const offset = (pageNum - 1) * limitNum;

//     // Query to get the actual data
//     const updatedQuery = `
//       SELECT p.*, b.nama_pegawai, b.nip_pegawai, c.nama_opd
//       FROM presensi AS p
//       JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
//       LEFT JOIN opd AS c ON b.id_opd = c.id_opd
//       WHERE ${baseWhere.join(' AND ')}
//       ORDER BY p.jam_masuk ASC
//       LIMIT :limit OFFSET :offset
//     `;

//     const updatedData = await sequelize.query(updatedQuery, {
//       type: QueryTypes.SELECT,
//       replacements: { ...replacements, limit: limitNum, offset }
//     });

//     // Respond with the data in JSON format
//     res.json({
//       message: "Successfully fetched attendance data",
//       code: 200,
//       totalRecords,
//       totalPages,
//       holidayName, // Send the holiday name if available
//       latenessThreshold, // Send the lateness threshold (e.g., "No lateness calculation for weekends")
//       isWeekend, // Send the weekend status
//       data: updatedData
//     });

//   } catch (err) {
//     console.error('Error fetching presensi data:', err.message);
//     res.status(500).json({
//       message: 'Error retrieving attendance data',
//       code: 500,
//       error: err.message
//     });
//   }
// });

// router.get('/presensi', async (req, res) => {
//   const { id_opd, id_pegawai, date, limit, search, page } = req.query;

//   // If no date is provided, use today's date
//   const selectedDate = date ? new Date(date) : new Date();

//   // Get the first and last day of the month from the selected date
//   const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
//   const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

//   // Convert to start and end epoch times for querying
//   const startEpoch = new Date(firstDayOfMonth.setHours(0, 0, 0, 0)).getTime();
//   const endEpoch = new Date(lastDayOfMonth.setHours(23, 59, 59, 999)).getTime();

//   // Query to fetch the holiday data
//   let holidayQuery = `
//     SELECT * FROM hari_libur
//     WHERE date_start <= :endDate AND (date_end >= :startDate OR date_end IS NULL)
//   `;

//   try {
//     const holidays = await sequelize.query(holidayQuery, {
//       type: QueryTypes.SELECT,
//       replacements: {
//         startDate: firstDayOfMonth.toISOString().split('T')[0],
//         endDate: lastDayOfMonth.toISOString().split('T')[0]
//       }
//     });

//     // Build base conditions for the query
//     const baseWhere = [];
//     const replacements = { startEpoch, endEpoch };

//     baseWhere.push(`p.jam_masuk BETWEEN :startEpoch AND :endEpoch`);

//     if (id_opd) {
//       baseWhere.push(`b.id_opd = :id_opd`);
//       replacements.id_opd = id_opd;
//     }

//     if (id_pegawai) {
//       baseWhere.push(`b.id_pegawai = :id_pegawai`);
//       replacements.id_pegawai = id_pegawai;
//     }

//     if (search) {
//       baseWhere.push(`(b.nip_pegawai LIKE :search OR b.nama_pegawai LIKE :search)`);
//       replacements.search = `%${search}%`;
//     }

//     const totalCountQuery = `
//       SELECT COUNT(*) AS totalRecords
//       FROM presensi AS p
//       JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
//       WHERE ${baseWhere.join(' AND ')}
//     `;

//     // Get the total count of records
//     const totalCountResult = await sequelize.query(totalCountQuery, {
//       type: QueryTypes.SELECT,
//       replacements
//     });
//     const totalRecords = totalCountResult[0].totalRecords;
//     const totalPages = Math.ceil(totalRecords / limit);

//     // Ensure the limit and page are valid
//     const pageNum = Math.max(1, Math.min(totalPages, parseInt(page, 10) || 1));
//     const limitNum = Math.max(1, parseInt(limit, 10) || 10);
//     const offset = (pageNum - 1) * limitNum;

//     // Query to get the actual data
//     const updatedQuery = `
//       SELECT p.*, b.nama_pegawai, b.nip_pegawai, c.nama_opd
//       FROM presensi AS p
//       JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
//       LEFT JOIN opd AS c ON b.id_opd = c.id_opd
//       WHERE ${baseWhere.join(' AND ')}
//       ORDER BY p.jam_masuk ASC
//       LIMIT :limit OFFSET :offset
//     `;

//     const updatedData = await sequelize.query(updatedQuery, {
//       type: QueryTypes.SELECT,
//       replacements: { ...replacements, limit: limitNum, offset }
//     });

//     // Process each record to determine lateness and holiday status
//     updatedData.forEach(record => {
//       const jamMasuk = new Date(record.jam_masuk);
//       const currentDayOfWeek = jamMasuk.getDay(); // 0 = Sunday, 6 = Saturday
//       let latenessThreshold = '07:31:00'; // Default lateness threshold for normal day
//       let holidayName = null;
//       let isWeekend = false;
//       let isHoliday = false;
//       let isRamadan = false;

//       // Check if the day is a weekend (Saturday or Sunday)
//       if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
//         isWeekend = true;
//         latenessThreshold = 'No lateness calculation for weekends';
//       }

//       // Check if the current date is a holiday
//       const holiday = holidays.find(h => {
//         const holidayDate = new Date(h.date_start);
//         return holidayDate.toISOString().split('T')[0] === jamMasuk.toISOString().split('T')[0];
//       });

//       if (holiday) {
//         holidayName = holiday.holiday_name;
//         isHoliday = true;
//         // If it's a holiday (type = 1), set threshold to normal
//         if (holiday.type === 1) {
//           latenessThreshold = 'No lateness calculation for holidays';
//         }
//         // If it's Ramadan (type = 2), set threshold to 08:30:00
//         else if (holiday.type === 2) {
//           latenessThreshold = '08:30:00'; // Ramadan lateness threshold
//           isRamadan = true;
//         }
//       }

//       // Calculate lateness if not weekend or holiday
//       if (!isWeekend && !isHoliday) {
//         const latenessTime = new Date(`1970-01-01T${latenessThreshold}Z`).getTime(); // Convert lateness threshold to timestamp
//         const jamMasukTime = jamMasuk.getTime();

//         // If jam_masuk is later than the lateness threshold, calculate minutes late
//         if (jamMasukTime > latenessTime) {
//           const latenessMinutes = Math.floor((jamMasukTime - latenessTime) / 60000); // Calculate lateness in minutes
//           record.lateness = `${latenessMinutes} minutes late`;
//         } else {
//           record.lateness = 'On time';
//         }
//       } else {
//         record.lateness = 'No lateness calculation (Weekend or Holiday)';
//       }

//       // Add the additional fields for clarity
//       record.isWeekend = isWeekend;
//       record.isHoliday = isHoliday;
//       record.isRamadan = isRamadan;
//       record.holidayName = holidayName;
//     });

//     // Respond with the data in JSON format
//     res.json({
//       message: "Successfully fetched attendance data",
//       code: 200,
//       totalRecords,
//       totalPages,
//       data: updatedData
//     });

//   } catch (err) {
//     console.error('Error fetching presensi data:', err.message);
//     res.status(500).json({
//       message: 'Error retrieving attendance data',
//       code: 500,
//       error: err.message
//     });
//   }
// });

router.get("/rekap-tabel", async (req, res) => {
  const { start_date, end_date, id_opd, id_jabatan, id_pangkat } = req.query;

  if (!start_date || !end_date) {
    return res
      .status(400)
      .json({ message: "Tanggal mulai dan akhir wajib diisi", code: 400 });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  const datesInRange = generateDateList(start, end);

  try {
    // 1. Hari libur
    const libur = await sequelize.query(
      `
      SELECT * FROM hari_libur
      WHERE DATE(date_start) <= :end_date AND (date_end IS NULL OR DATE(date_end) >= :start_date)
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { start_date, end_date },
      }
    );

    const hariLiburSet = new Set();
    for (const lib of libur) {
      const libStart = new Date(lib.date_start);
      const libEnd = lib.date_end ? new Date(lib.date_end) : libStart;
      const range = generateDateList(libStart, libEnd);
      range.forEach((d) => hariLiburSet.add(d));
    }

    // 2. Filter hanya tanggal kerja (bukan hari libur atau akhir pekan)
    const tanggalKerja = datesInRange.filter((dateStr) => {
      const day = new Date(dateStr).getDay();
      return !hariLiburSet.has(dateStr) && day !== 0 && day !== 6;
    });

    if (tanggalKerja.length === 0) {
      return res.json({
        message: "Tidak ada hari kerja di rentang ini",
        code: 200,
        data: [],
      });
    }

    // 3. Query Pegawai
    let pegawaiQuery = `
      SELECT b.*, c.nama_opd 
      FROM pegawai AS b
      LEFT JOIN opd AS c ON b.id_opd = c.id_opd 
      WHERE b.id_opd != 0
    `;
    const replacements = {};

    if (id_opd) {
      pegawaiQuery += " AND b.id_opd = :id_opd";
      replacements.id_opd = id_opd;
    }
    if (id_jabatan) {
      pegawaiQuery += " AND b.id_jabatan = :id_jabatan";
      replacements.id_jabatan = id_jabatan;
    }
    if (id_pangkat) {
      pegawaiQuery += " AND b.id_pangkat = :id_pangkat";
      replacements.id_pangkat = id_pangkat;
    }

    const pegawaiList = await sequelize.query(pegawaiQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });

    // 4. Query Presensi
    const startEpoch = new Date(start).setHours(0, 0, 0, 0);
    const endEpoch = new Date(end).setHours(23, 59, 59, 999);

    const presensiData = await sequelize.query(
      `
      SELECT p.ket_masuk, p.jam_masuk, b.id_pegawai, c.nama_opd 
      FROM presensi AS p
      JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
      LEFT JOIN opd AS c ON b.id_opd = c.id_opd
      WHERE p.jam_masuk BETWEEN :startEpoch AND :endEpoch
      ${id_opd ? "AND b.id_opd = :id_opd" : ""}
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { ...replacements, startEpoch, endEpoch },
      }
    );

    // 5. Query Izin
    const izinData = await sequelize.query(
      `
      SELECT a.id_pegawai, a.tanggal_izin, a.tanggal_selesai, c.nama_opd
      FROM izin AS a
      JOIN pegawai AS b ON a.id_pegawai = b.id_pegawai
      LEFT JOIN opd AS c ON b.id_opd = c.id_opd
      WHERE a.verifikasi = 1
      ${id_opd ? "AND b.id_opd = :id_opd" : ""}
    `,
      {
        type: QueryTypes.SELECT,
        replacements,
      }
    );

    // 6. Inisialisasi Struktur Data
    const hasil = {};
    const pegawaiMap = {};
    pegawaiList.forEach((p) => {
      pegawaiMap[p.id_pegawai] = p.nama_opd;
      const opd = p.nama_opd || "Tidak Diketahui";
      if (!hasil[opd]) {
        hasil[opd] = {
          nama_opd: opd,
          jumlah_pegawai: 0,
          per_tanggal: {},
          pegawai: [],
        };
      }
      hasil[opd].jumlah_pegawai++;
      hasil[opd].pegawai.push({
        id_pegawai: p.id_pegawai,
        nama_pegawai: p.nama_pegawai,
        nip_pegawai: p.nip_pegawai,
      });

      tanggalKerja.forEach((tgl) => {
        if (!hasil[opd].per_tanggal[tgl]) {
          hasil[opd].per_tanggal[tgl] = {
            biasa: 0,
            khusus: 0,
            izin: 0,
            tanpa_keterangan: 0,
          };
        }
      });
    });

    // 7. Hitung presensi
    for (const presensi of presensiData) {
      const dateKey = new Date(presensi.jam_masuk).toISOString().split("T")[0];
      const opd = presensi.nama_opd;
      if (!tanggalKerja.includes(dateKey)) continue;
      if (!hasil[opd]) continue;

      if (presensi.ket_masuk.startsWith("Biasa")) {
        hasil[opd].per_tanggal[dateKey].biasa++;
      } else if (presensi.ket_masuk.startsWith("Khusus")) {
        hasil[opd].per_tanggal[dateKey].khusus++;
      }
    }

    // 8. Hitung izin
    for (const izin of izinData) {
      const opd = izin.nama_opd;
      if (!hasil[opd]) continue;

      const startIzin = new Date(izin.tanggal_izin);
      const endIzin = new Date(izin.tanggal_selesai);
      const izinRange = generateDateList(startIzin, endIzin);
      izinRange.forEach((tgl) => {
        if (tanggalKerja.includes(tgl)) {
          hasil[opd].per_tanggal[tgl].izin++;
        }
      });
    }

    // 9. Hitung tanpa keterangan
    for (const opd in hasil) {
      const total = hasil[opd].jumlah_pegawai;
      for (const tanggal of tanggalKerja) {
        const hadir =
          hasil[opd].per_tanggal[tanggal].biasa +
          hasil[opd].per_tanggal[tanggal].khusus +
          hasil[opd].per_tanggal[tanggal].izin;
        hasil[opd].per_tanggal[tanggal].tanpa_keterangan = Math.max(
          total - hadir,
          0
        );
      }
    }

    return res.json({
      message: "Berhasil mengambil data rekap tabel",
      code: 200,
      data: hasil,
      hari_libur: [...hariLiburSet],
    });
  } catch (err) {
    console.error("Rekap Tabel Error:", err);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", code: 500, error: err.message });
  }
});
module.exports = router;
