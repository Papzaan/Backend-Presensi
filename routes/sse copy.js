const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

router.get('/presensi', async (req, res) => {
  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',  // Allow cross-origin requests
  });
  res.flushHeaders();

  const { id_opd, id_pegawai, date } = req.query;

  const selectedDate = date ? new Date(date) : new Date();
  const startEpoch = new Date(selectedDate.setHours(0, 0, 0, 0)).getTime();
  const endEpoch = new Date(selectedDate).setHours(23, 59, 59, 999);  // End of day timestamp

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

  let lastTimestamp = startEpoch;

  // Interval to fetch updates every 5 seconds
  const interval = setInterval(async () => {
    try {
      // Build the dynamic query based on the filters
      const updatedQuery = `
        SELECT p.*, b.nama_pegawai, b.id_opd
        FROM presensi AS p
        JOIN pegawai AS b ON p.id_pegawai = b.id_pegawai
        WHERE ${baseWhere.join(' AND ')} AND p.jam_masuk > :lastTimestamp
        ORDER BY p.jam_masuk ASC
      `;

      const updatedData = await sequelize.query(updatedQuery, {
        type: QueryTypes.SELECT,
        replacements: { ...replacements, lastTimestamp }
      });

      // Send updated data as stream if any data is found
      if (updatedData.length > 0) {
        for (const row of updatedData) {
          // Send each row of data wrapped in a data object
          res.write(`data: ${JSON.stringify({ data: row })}\n\n`);

          // Update the last sent timestamp to prevent re-sending old data
          if (row.jam_masuk > lastTimestamp) {
            lastTimestamp = row.jam_masuk;
          }
        }
      }

    } catch (err) {
      console.error('SSE error:', err.message);
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      clearInterval(interval);  // Stop the interval in case of error
      res.end();
    }
  }, 5000);  // Stream updates every 5 seconds

  // Send a heartbeat message every minute to keep the connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(':\n\n');  // Send a comment to keep the connection alive
  }, 60000);  // Send every 60 seconds

  // Handle client disconnection
  req.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
    clearInterval(heartbeatInterval);  // Clear heartbeat interval on disconnect
    res.end();
  });
});

module.exports = router;
