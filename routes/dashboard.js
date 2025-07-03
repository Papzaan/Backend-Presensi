const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const moment = require('moment-timezone');

// Route to get OPD list
router.get('/opd-list', async (req, res) => {
  try {
    const opdListQuery = `
      SELECT id_opd, nama_opd FROM opd ORDER BY nama_opd ASC;
    `;
    const opdList = await sequelize.query(opdListQuery, {
      type: QueryTypes.SELECT
    });
    res.json(opdList); // Sending response as JSON
  } catch (err) {
    console.error('Error fetching OPD list:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route to get Izin list
router.get('/izin-list', async (req, res) => {
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
      type: QueryTypes.SELECT
    });
    res.json(izinList); // Sending response as JSON
  } catch (err) {
    console.error('Error fetching Izin list:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route to fetch Pegawai list by OPD
router.get('/pegawai-list', async (req, res) => {
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
      replacements: { id_opd }
    });

    // Ensure that the result is always an array
    res.json(Array.isArray(pegawaiList) ? pegawaiList : []);
  } catch (err) {
    console.error('Error fetching Pegawai list:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/presensi', async (req, res) => {
  const { id_opd, id_pegawai, date, limit, search, page } = req.query;

  const selectedDate = date ? new Date(date) : new Date();
  const selectedDateFormatted = selectedDate.toISOString().split('T')[0]; // Ensure correct date format

  console.log('Selected Date (formatted):', selectedDateFormatted); // Debugging the selected date

  // Convert lateness threshold to GMT+7 time zone for any given date
  function convertToGMTPlus7(timeString, date) {
    const threshold = moment.tz(timeString, 'HH:mm:ss', 'Asia/Jakarta');
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
      replacements: { selectedDate: selectedDateFormatted }
    });

    let latenessThreshold = '07:31:00'; // Default lateness threshold for normal day
    let holidayName = null;
    let isWeekend = false;
    let isHoliday = false;
    let isRamadan = false;

    // Check if the selected date is a weekend (Saturday or Sunday)
    const dayOfWeek = selectedDate.getDay();  // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // If it's a weekend, do not calculate lateness
      isWeekend = true;
      latenessThreshold = 'No lateness calculation for weekends';
    }

    // If it's a holiday, handle accordingly
    if (holidays.length > 0) {
      const holiday = holidays[0];
      holidayName = holiday.holiday_name;

      // If it's a holiday (type = 2), set threshold to normal (no lateness)
      if (holiday.type === 2) {
        latenessThreshold = 'No lateness calculation for holidays';
        isHoliday = true;
      }
      // If it's Ramadan (type = 1), set threshold to 08:01:00
      else if (holiday.type === 1) {
        latenessThreshold = '08:01:00';  // Ramadan lateness threshold
        isRamadan = true;
      }
    }

    // Prepare the query to get the actual attendance data for the whole day
    const startEpoch = new Date(selectedDate.setHours(0, 0, 0, 0)).getTime();  // 00:00:00 of the selected day
    const endEpoch = new Date(selectedDate).setHours(23, 59, 59, 999);  // 23:59:59 of the selected day

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
      baseWhere.push(`(b.nip_pegawai LIKE :search OR b.nama_pegawai LIKE :search)`);
      replacements.search = `%${search}%`;
    }

    const totalCountQuery = `
      SELECT COUNT(*) AS totalRecords
      FROM presensi AS p
      JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
      WHERE ${baseWhere.join(' AND ')}
    `;

    // Get the total count of records
    const totalCountResult = await sequelize.query(totalCountQuery, {
      type: QueryTypes.SELECT,
      replacements
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
      WHERE ${baseWhere.join(' AND ')}
      ORDER BY p.jam_masuk ASC
      LIMIT :limit OFFSET :offset
    `;

    const updatedData = await sequelize.query(updatedQuery, {
      type: QueryTypes.SELECT,
      replacements: { ...replacements, limit: limitNum, offset }
    });

    let totalLateness = 0; // Counter for total lateness
    let totalOntime = 0;  // Counter for total on-time

    // Process each record to determine lateness and holiday status
    updatedData.forEach(record => {
      const jamMasukEpoch = record.jam_masuk;
      const jamMasuk = new Date(jamMasukEpoch); // Convert epoch to Date object
      let lateness = 'On time';  // Default lateness status

      // Convert jam_masuk to GMT+7 (adjust time by +7 hours)
      const jamMasukGMT7 = moment.utc(jamMasuk).tz('Asia/Jakarta').valueOf(); // Adjust to GMT+7

      // Convert lateness threshold to the same date as jam_masuk (on the same day as jam_masuk)
      const latenessTimeGMT7 = convertToGMTPlus7(latenessThreshold, jamMasuk);

      // If jam_masuk is later than the lateness threshold, calculate minutes late
      if (!isWeekend && !isHoliday && !isRamadan && jamMasukGMT7 > latenessTimeGMT7) {
        const latenessMinutes = Math.floor((jamMasukGMT7 - latenessTimeGMT7) / 60000); // Calculate lateness in minutes
        lateness = `${latenessMinutes} menit`;
        totalLateness++; // Increment lateness counter
      } else if (isRamadan && jamMasukGMT7 > latenessTimeGMT7) {
        const latenessMinutes = Math.floor((jamMasukGMT7 - latenessTimeGMT7) / 60000); // Calculate lateness in minutes
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
      totalOntime,   // Total on-time count
      data: updatedData
    });

  } catch (err) {
    console.error('Error fetching presensi data:', err.message);
    res.status(500).json({
      message: 'Error retrieving attendance data',
      code: 500,
      error: err.message
    });
  }
});

//Route to get Pangkat dan golongan
router.get('/pangkat-list', async (req, res) => {
  try {
    const golonganListQuery = `
      SELECT id_pangkat, nama_pangkat, golongan
      FROM pangkat
      ORDER BY nama_pangkat ASC;
    `;
    const golonganList = await sequelize.query(golonganListQuery, {
      type: QueryTypes.SELECT
    });
    res.json(golonganList); // Send as JSON
  } catch (err) {
    console.error('Error fetching Pangkat list:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get Jabatan list
router.get('/jabatan-list', async (req, res) => {
  try {
    const jabatanListQuery = `
      SELECT j.id_jabatan, j.nama_jabatan, j.id_opd, o.nama_opd
      FROM jabatan j
      JOIN opd o ON j.id_opd = o.id_opd
      GROUP BY j.nama_jabatan ASC
      ORDER BY j.nama_jabatan ASC;
    `;
    const jabatanList = await sequelize.query(jabatanListQuery, {
      type: QueryTypes.SELECT
    });
    res.json(jabatanList); // Send as JSON
  } catch (err) {
    console.error('Error fetching Jabatan list:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//rekap dashboard
router.get('/rekap', async (req, res) => {
  const { start_date, end_date, id_opd } = req.query;
  const start = new Date(start_date);
  const end = new Date(end_date);

  const startEpoch = start.setHours(0, 0, 0, 0);
  const endEpoch = end.setHours(23, 59, 59, 999);
  const replacements = { startEpoch, endEpoch, id_opd };

  try {
    // Presensi
    const presensiData = await sequelize.query(`
      SELECT p.jam_masuk, p.ket_masuk, p.foto_masuk, b.id_pegawai, b.nama_pegawai, b.nip_pegawai, b.id_opd, c.nama_opd
      FROM presensi p
      JOIN pegawai b ON p.id_pegawai = b.id_pegawai
      LEFT JOIN opd c ON b.id_opd = c.id_opd
      WHERE p.jam_masuk BETWEEN :startEpoch AND :endEpoch
        ${id_opd ? 'AND b.id_opd = :id_opd' : 'AND b.id_opd != 0'}
    `, { type: QueryTypes.SELECT, replacements });

    // Izin
    const izinData = await sequelize.query(`
      SELECT a.tanggal_izin, a.tanggal_selesai, a.id_pegawai, b.nama_pegawai, b.nip_pegawai, b.id_opd, c.nama_opd
      FROM izin a
      JOIN pegawai b ON a.id_pegawai = b.id_pegawai
      LEFT JOIN opd c ON b.id_opd = c.id_opd
      WHERE a.verifikasi = 1
        ${id_opd ? 'AND b.id_opd = :id_opd' : 'AND b.id_opd != 0'}
    `, { type: QueryTypes.SELECT, replacements });

    // Pegawai
    const pegawaiList = await sequelize.query(`
      SELECT b.id_pegawai, b.nama_pegawai, b.nip_pegawai, b.id_opd, c.nama_opd
      FROM pegawai b
      LEFT JOIN opd c ON b.id_opd = c.id_opd
      ${id_opd ? 'WHERE b.id_opd = :id_opd' : 'WHERE b.id_opd != 0'}
    `, { type: QueryTypes.SELECT, replacements });

    
    const rekap = {};
    const detailPegawai = {};

    // Inisialisasi
    pegawaiList.forEach(({ nama_opd }) => {
      const opd = nama_opd || 'Tidak Diketahui';
      if (!rekap[opd]) {
        rekap[opd] = {};
        detailPegawai[opd] = { biasa: [], khusus: [], izin: [], tanpa_keterangan: [] };
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split('T')[0];
          rekap[opd][key] = { biasa: 0, khusus: 0, izin: 0, tanpa_keterangan: 0 };
        }
      }
    });

    // Presensi
    presensiData.forEach(p => {
      const tanggal = new Date(p.jam_masuk).toISOString().split('T')[0];
      const opd = p.nama_opd || 'Tidak Diketahui';
      if (!rekap[opd]?.[tanggal]) return;

      if ((p.ket_masuk || '').startsWith('Biasa')) {
        rekap[opd][tanggal].biasa++;
        detailPegawai[opd].biasa.push({ ...p, tanggal });
      } else if ((p.ket_masuk || '').startsWith('Khusus')) {
        rekap[opd][tanggal].khusus++;
        detailPegawai[opd].khusus.push({ ...p, tanggal });
      }
    });

    // Izin
    izinData.forEach(i => {
      const opd = i.nama_opd || 'Tidak Diketahui';
      const izinStart = new Date(i.tanggal_izin);
      const izinEnd = new Date(i.tanggal_selesai);

      for (let d = new Date(izinStart); d <= izinEnd; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (rekap[opd]?.[key]) {
          rekap[opd][key].izin++;
          detailPegawai[opd].izin.push({ ...i, tanggal: key });
        }
      }
    });
    
    // Tanpa Keterangan
    Object.entries(rekap).forEach(([opd, tanggalMap]) => {
      const totalPegawai = pegawaiList.filter(p => p.nama_opd === opd).length;
      const hadirKeySet = new Set([
        ...detailPegawai[opd].biasa,
        ...detailPegawai[opd].khusus,
        ...detailPegawai[opd].izin
      ].map(p => `${p.tanggal}_${p.id_pegawai}`));

      Object.entries(tanggalMap).forEach(([tanggal, count]) => {
        const hadir = count.biasa + count.khusus + count.izin;
        count.tanpa_keterangan = Math.max(totalPegawai - hadir, 0);

        pegawaiList.forEach(p => {
          const key = `${tanggal}_${p.id_pegawai}`;
          if (p.nama_opd === opd && !hadirKeySet.has(key)) {
            detailPegawai[opd].tanpa_keterangan.push({ ...p, tanggal });
          }
        });
      });
    });

    res.json({
      message: 'Berhasil rekap presensi',
      code: 200,
      data: rekap,
      detail: detailPegawai
    });
  } catch (err) {
    console.error('Rekap Presensi Error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan', code: 500, error: err.message });
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


module.exports = router;
