const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

router.get('/presensi', async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  const { id_opd, id_pegawai, date, limit, search, page } = req.query;

  // Validate query parameters
  const selectedDate = date ? new Date(date) : new Date();
  const startEpoch = new Date(selectedDate.setHours(0, 0, 0, 0)).getTime();
  const endEpoch = new Date(selectedDate).setHours(23, 59, 59, 999);

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

// Check if search term is provided (nip_pegawai or nama_pegawai)
if (search) {
  baseWhere.push(`(b.nip_pegawai LIKE :search OR b.nama_pegawai LIKE :search)`);
  replacements.search = `%${search}%`;
}

  let lastTimestamp = startEpoch;

  // Query to get total record count
  const totalCountQuery = `
    SELECT COUNT(*) AS totalRecords
    FROM presensi AS p
    JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
    WHERE ${baseWhere.join(' AND ')}
  `;

  try {
    const totalCountResult = await sequelize.query(totalCountQuery, {
      type: QueryTypes.SELECT,
      replacements
    });
    const totalRecords = totalCountResult[0].totalRecords;
    const totalPages = Math.ceil(totalRecords / limit); 

    // Ensure the limit and page are valid
    const pageNum = Math.max(1, Math.min(totalPages, parseInt(page, 10) || 1));
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    // const updatedQuery = `
    //   SELECT p.*, b.nama_pegawai, b.id_opd
    //   FROM presensi AS p
    //   JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
    //   WHERE ${baseWhere.join(' AND ')} AND p.jam_masuk > :lastTimestamp
    //   ORDER BY p.jam_masuk ASC
    //   LIMIT :limit OFFSET :offset
    // `;

    const updatedQuery = `
    SELECT p.*, b.nama_pegawai, b.nip_pegawai, c.nama_opd
    FROM presensi AS p
    JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
    LEFT JOIN opd AS c ON b.id_opd = c.id_opd
    WHERE ${baseWhere.join(' AND ')} AND p.jam_masuk > :lastTimestamp
    ORDER BY p.jam_masuk ASC
    LIMIT :limit OFFSET :offset
`;


    const offset = (pageNum - 1) * limitNum;

    const updatedData = await sequelize.query(updatedQuery, {
      type: QueryTypes.SELECT,
      replacements: { ...replacements, lastTimestamp, limit: limitNum, offset }
    });

    // Send the initial data
    res.write(`data: ${JSON.stringify({ totalRecords, totalPages, data: updatedData })}\n\n`);

    if (updatedData.length > 0) {
      lastTimestamp = updatedData[updatedData.length - 1].jam_masuk;
    }

  } catch (err) {
    console.error('SSE error:', err.message);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }

  const interval = setInterval(async () => {
    try {
      const updatedData = await sequelize.query(updatedQuery, {
        type: QueryTypes.SELECT,
        replacements: { ...replacements, lastTimestamp, limit: parseInt(limit, 10) || 10 }
      });

      if (updatedData.length > 0) {
        res.write(`data: ${JSON.stringify({ data: updatedData })}\n\n`);
        if (updatedData.length > 0 && updatedData[updatedData.length - 1].jam_masuk > lastTimestamp) {
          lastTimestamp = updatedData[updatedData.length - 1].jam_masuk;
        }
      }

    } catch (err) {
      console.error('SSE error:', err.message);
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 5000);

  const heartbeatInterval = setInterval(() => {
    res.write(':\n\n');
  }, 60000);

  req.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
    clearInterval(heartbeatInterval);
    res.end();
  });
});

router.get('/opd-list', async (req, res) => {
  try {
    const opdListQuery = `
      SELECT id_opd, nama_opd FROM opd
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
// Express route to fetch Pegawai list by OPD
router.get('/pegawai-list', async (req, res) => {
  const { id_opd } = req.query;

  try {
      let pegawaiListQuery = `
          SELECT id_pegawai, nama_pegawai FROM pegawai
      `;
      // Only filter by OPD if the id_opd is provided
      if (id_opd) {
          pegawaiListQuery += ` WHERE id_opd = :id_opd`;
      }

      const pegawaiList = await sequelize.query(pegawaiListQuery, {
          type: QueryTypes.SELECT,
          replacements: { id_opd }
      });

      // Ensure that the result is always an array
      if (Array.isArray(pegawaiList)) {
          res.json(pegawaiList); // Sending response as JSON if the result is an array
      } else {
          res.json([]); // Return an empty array if the result is not an array
      }
  } catch (err) {
      console.error('Error fetching Pegawai list:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = router;
