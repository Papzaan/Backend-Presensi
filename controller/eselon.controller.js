const {Eselon} = require('../models')
const moment = require('moment-timezone')
const {toString, toDate, toTime} = require("../middlewares/time_handler");
const fs = require("fs");
const path = require("path")
const {QueryTypes} = require("sequelize");
const db = require("../models"); 
// 

const getEselonList = async (req, res) => {
  try {
    const query = `
      SELECT 
    pr.*, pg.nama_pegawai, pg.id_opd, pg.no_whatsapp, j.id_jabatan, j.eselon,  
    o.id_opd, o.nama_opd
    FROM jabatan j
    JOIN pegawai pg ON pg.id_jabatan = j.id_jabatan
    JOIN opd o ON o.id_opd = pg.id_opd
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


// const getEselon = async (req, res) => {
//   try {
//     const query = `
//       SELECT 
//     pg.*, pg.nama_pegawai, pg.id_opd, pg.no_whatsapp, j.id_jabatan, j.eselon,  
//     o.id_opd, o.nama_opd
//     FROM jabatan j
//     JOIN pegawai pg ON pg.id_jabatan = j.id_jabatan
//     JOIN opd o ON o.id_opd = pg.id_opd
//     WHERE j.eselon IN ('2' ,'3');
//     `;

//     const results = await db.sequelize.query(query, {
//       type: QueryTypes.SELECT,
//     });

//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Gagal mengambil data Eselon:", error.message);
//     res.status(500).json({ error: "Gagal mengambil data Eselon" });
//   }
// };


const getEselonByOpd = async (req, res) => {
  const { id_opd } = req.query;

  if (!id_opd) {
    return res.status(400).json({ error: "id_opd wajib diisi sebagai query parameter" });
  }

  try {
    const query = `
      SELECT 
        pg.id_pegawai,
        pg.nama_pegawai,
        pg.id_opd,
        o.nama_opd,
        pg.no_whatsapp,
        j.id_jabatan,
        j.eselon
      FROM jabatan j
      JOIN pegawai pg ON pg.id_jabatan = j.id_jabatan
      JOIN opd o ON o.id_opd = pg.id_opd
      WHERE j.eselon IN ('2', '3')
        AND pg.id_opd = :id_opd
    `;

    const results = await db.sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements: { id_opd },
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Gagal mengambil data eselon berdasarkan OPD:", error.message);
    res.status(500).json({ error: "Gagal mengambil data eselon" });
  }
};


module.exports = {
  getEselonList,  getEselonByOpd,
};
