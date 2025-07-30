const {Eselon} = require('../models')
const moment = require('moment-timezone')
const {toString, toDate, toTime} = require("../middlewares/time_handler");
const fs = require("fs");
const path = require("path")
const {QueryTypes} = require("sequelize");
const db = require("../models")


const getEselonList = async (req, res) => {
  try {
    const query = `
      SELECT 
    pr.*, 
    pg.nama_pegawai, 
    pg.id_opd, 
    j.id_jabatan, 
    j.eselon
FROM jabatan j
JOIN pegawai pg ON pg.id_jabatan = j.id_jabatan
JOIN presensi pr ON pr.id_pegawai = pg.id_pegawai
WHERE j.eselon IN ('2' ,'3')
  AND DATE(STR_TO_DATE(pr.created_at, '%d/%m/%Y %H.%i.%s')) = CURDATE();
    `;

    const results = await db.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Gagal mengambil data Eselon:", error.message);
    res.status(500).json({ error: "Gagal mengambil data Eselon" });
  }
};

module.exports = {
  getEselonList,
};
