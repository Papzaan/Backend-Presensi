const {Kegiatan} = require('../models')
const moment = require('moment-timezone')
const {toString, toDate, toTime} = require("../middlewares/time_handler");
const fs = require("fs");
const path = require("path")
//const {QueryTypes} = require("sequelize");
const {Op, QueryTypes} = require("sequelize");

module.exports = {
    kegiatanHariIni: async (req, res) => {
        const id = req.params.id_pegawai

        try {
            const kegiatan = await Kegiatan.findOne({
                where: {
                    id_pegawai: id,
                    created_at: {
                        [Op.like]: '%' + toDate(moment.now()) + '%'
                    }
                }
            })
            if (kegiatan === null) {
                return res.json({
                    message: "Kegiatan hari ini tidak ditemukan",
                    code: 404,
                    data: kegiatan
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: kegiatan
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    detailKegiatan: async (req, res) => {
        const id = req.params.id_kegiatan
        try {
            const kegiatan = await Kegiatan.findOne({where: {id_kegiatan: id}})

            if (kegiatan === null) {
                return res.json({
                    message: "Kegiatan tidak ditemukan",
                    code: 404,
		    data: kegiatan
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: kegiatan
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500,
		data: kegiatan
            })
        }
    },
  listKegiatan: async (req, res) => {
        // const query = 'SELECT id_kegiatan, a.id_pegawai,  a.id_presensi,  kegiatan, url_file, tanggal_kegiatan, catatan, verifikasi, , a.created_at, a.updated_at FROM kegiatan a JOIN pegawai b JOIN presensi c WHERE a.id_pegawai = b.id_pegawai AND a.id_presensi = c.id_presensi';

        const query = `SELECT keg.*, b.nama_pegawai, b.nip_pegawai, b.url_foto_pegawai, b.id_opd, b.id_atasan, c.jam_masuk, c.jam_siang, c.jam_pulang FROM (SELECT k.* FROM kegiatan AS k WHERE k.tanggal_kegiatan LIKE '%/${req.query.bulan}/${req.query.tahun}%' AND k.id_pegawai = ${req.query.id_pegawai}) AS keg JOIN pegawai b JOIN presensi c WHERE keg.id_pegawai = b.id_pegawai AND keg.id_presensi = c.id_presensi GROUP BY keg.id_kegiatan ORDER BY str_to_date(keg.tanggal_kegiatan,'%d/%m/%Y') ASC`;


        try {
            let kegiatan = await Kegiatan.sequelize.query(query, {type: QueryTypes.SELECT})

            kegiatan.forEach((element) => {
                element.jam_masuk = toTime(element.jam_masuk)
                element.jam_siang = toTime(element.jam_siang)
                element.jam_pulang = toTime(element.jam_pulang)
            })
            // if (req.query.id_pegawai) kegiatan = kegiatan.filter(data => data.id_pegawai === parseInt(req.query.id_pegawai))
            // if (req.query.id_opd) kegiatan = kegiatan.filter(data => data.id_opd === parseInt(req.query.id_opd))
            if (req.query.verifikasi) kegiatan = kegiatan.filter(data => data.verifikasi === parseInt(req.query.verifikasi))
            if (req.query.id_atasan) kegiatan = kegiatan.filter(data => data.id_atasan === parseInt(req.query.id_atasan))
            // if (req.query.bulan) kegiatan = kegiatan.filter(data => data.created_at.includes(`/${req.query.bulan}/`))
            if (kegiatan.length === 0) {
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi.",
                    code: 200
                })
            }

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: kegiatan
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
      listKegiatanOpd: async (req, res) => {
        // const query = 'SELECT id_kegiatan, a.id_pegawai,  a.id_presensi,  kegiatan, url_file, tanggal_kegiatan, catatan, verifikasi, , a.created_at, a.updated_at FROM kegiatan a JOIN pegawai b JOIN presensi c WHERE a.id_pegawai = b.id_pegawai AND a.id_presensi = c.id_presensi';

         const query = `SELECT keg.*, b.nama_pegawai, b.nip_pegawai, b.url_foto_pegawai, b.id_opd, b.id_atasan, c.jam_masuk, c.jam_siang, c.jam_pulang FROM (SELECT k.* FROM kegiatan AS k WHERE k.tanggal_kegiatan LIKE '%/${req.query.bulan}/${req.query.tahun}%') AS keg JOIN pegawai b JOIN presensi c WHERE keg.id_pegawai = b.id_pegawai AND keg.id_presensi = c.id_presensi  AND b.id_opd = ${req.query.id_opd} GROUP BY keg.id_kegiatan ORDER BY str_to_date(keg.tanggal_kegiatan,'%d/%m/%Y') ASC`;



        try {
            let kegiatan = await Kegiatan.sequelize.query(query, {type: QueryTypes.SELECT})

            kegiatan.forEach((element) => {
                element.jam_masuk = toTime(element.jam_masuk)
                element.jam_siang = toTime(element.jam_siang)
                element.jam_pulang = toTime(element.jam_pulang)
            })
            if (req.query.id_pegawai) kegiatan = kegiatan.filter(data => data.id_pegawai === parseInt(req.query.id_pegawai))
            // if (req.query.id_opd) kegiatan = kegiatan.filter(data => data.id_opd === parseInt(req.query.id_opd))
            if (req.query.verifikasi) kegiatan = kegiatan.filter(data => data.verifikasi === parseInt(req.query.verifikasi))
            if (req.query.id_atasan) kegiatan = kegiatan.filter(data => data.id_atasan === parseInt(req.query.id_atasan))
            // if (req.query.bulan) kegiatan = kegiatan.filter(data => data.created_at.includes(`/${req.query.bulan}/`))
            if (kegiatan.length === 0) {
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi.",
                    code: 200
                })
            }

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: kegiatan
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    listKegiatan22: async (req, res) => {
        //const query = 'SELECT id_kegiatan, a.id_pegawai, nama_pegawai, nip_pegawai, url_foto_pegawai, b.id_opd, a.id_presensi, c.jam_masuk, c.jam_siang, c.jam_pulang, kegiatan, url_file, tanggal_kegiatan, catatan, verifikasi, id_atasan, a.created_at, a.updated_at FROM kegiatan a JOIN pegawai b JOIN presensi c WHERE a.id_pegawai = b.id_pegawai AND a.id_presensi = c.id_presensi';
	const query = `SELECT keg.*, b.nama_pegawai, b.nip_pegawai, b.url_foto_pegawai, b.id_opd, b.id_atasan, c.jam_masuk, c.jam_siang, c.jam_pulang FROM (SELECT k.* FROM kegiatan AS k WHERE k.created_at LIKE '%/2024%') AS keg JOIN pegawai b JOIN presensi c WHERE keg.id_pegawai = b.id_pegawai AND keg.id_presensi = c.id_presensi`;

        try {
            let kegiatan = await Kegiatan.sequelize.query(query, {type: QueryTypes.SELECT})

            kegiatan.forEach((element) => {
                element.jam_masuk = toTime(element.jam_masuk)
                element.jam_siang = toTime(element.jam_siang)
                element.jam_pulang = toTime(element.jam_pulang)
            })
            if (req.query.id_pegawai) kegiatan = kegiatan.filter(data => data.id_pegawai === parseInt(req.query.id_pegawai))
            if (req.query.id_opd) kegiatan = kegiatan.filter(data => data.id_opd === parseInt(req.query.id_opd))
            if (req.query.verifikasi) kegiatan = kegiatan.filter(data => data.verifikasi === parseInt(req.query.verifikasi))
            if (req.query.id_atasan) kegiatan = kegiatan.filter(data => data.id_atasan === parseInt(req.query.id_atasan))
            if (req.query.bulan) kegiatan = kegiatan.filter(data => data.created_at.includes(`/${req.query.bulan}/`))
	    //if (req.query.tahun) presensi = presensi.filter(data => data.created_at.includes(`/${req.query.tahun}`))
            if (kegiatan.length === 0) {
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi.",
                    code: 200,
		    data: kegiatan
                })
            }

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: kegiatan
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500,
		data: kegiatan
            })
        }
    },
    tambahKegiatan: async (req, res) => {
        if (!req.file) {
            try {
                await Kegiatan.create({
                    id_pegawai: req.body.id_pegawai,
                    id_presensi: req.body.id_presensi,
                    kegiatan: req.body.kegiatan,
                    tanggal_kegiatan: toDate(req.body.tanggal_kegiatan),
                    catatan: req.body.catatan,
                    verifikasi: req.body.verifikasi,
                    created_at: toString(moment.now())
                })

                return res.json({
                    message: "Berhasil menambah Kegiatan",
                    code: 201
                })
            } catch (e) {
                return res.json({
                    message: e.message,
                    code: 500
                })
            }
        } else {
            const random = moment.now() + path.extname(req.file.originalname)
            const foto = global.appRoot + '/files/bukti-kegiatan/' + random
            const url = 'https://dev.pringsewukab.go.id/bukti-kegiatan/' + random

            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Kegiatan.create({
                        id_pegawai: req.body.id_pegawai,
                        id_presensi: req.body.id_presensi,
                        kegiatan: req.body.kegiatan,
                        url_file: url,
                        tanggal_kegiatan: toDate(req.body.tanggal_kegiatan),
                        verifikasi: 0,
                        created_at: toString(moment.now())
                    }).then(() => {
                        return res.json({
                            message: "Berhasil menambah kegiatan",
                            code: 201
                        })
                    }).catch(err => {
                        return res.json({
                            message: err.message,
                            code: 400
                        })
                    })
                }
            })
        }
    },
    ubahKegiatan: async (req, res) => {
        const find = await Kegiatan.findOne({where: {id_kegiatan: req.params.id_kegiatan}})

        if (!req.file) {
            if (find === null) {
                return res.json({
                    message: `Kegiatan ${req.params.id_kegiatan} tidak terdaftar.`,
                    code: 404
                })
            } else {
                try {
                    await Kegiatan.update({
                        id_pegawai: req.body.id_pegawai,
                        id_presensi: req.body.id_presensi,
                        kegiatan: req.body.kegiatan,
                        url_file: req.body.url_file,
                        tanggal_kegiatan: req.body.tanggal_kegiatan,
                        catatan: req.body.catatan,
                        verifikasi: req.body.verifikasi,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_kegiatan: req.params.id_kegiatan
                        }
                    })

                    return res.json({
                        message: `Berhasil mengubah data kegiatan ${req.params.id_kegiatan}`,
                        code: 200
                    })
                } catch (e) {
                    return res.json({
                        message: e.message,
                        code: 500
                    })
                }
            }
        } else {
            const random = moment.now() + path.extname(req.file.originalname)
            const foto = global.appRoot + '/files/bukti-kegiatan/' + random
            const url = 'https://dev.pringsewukab.go.id/bukti-kegiatan/' + random

            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Kegiatan.update({
                        id_pegawai: req.body.id_pegawai,
                        id_presensi: req.body.id_presensi,
                        kegiatan: req.body.kegiatan,
                        url_file: url,
                        tanggal_kegiatan: req.body.tanggal_kegiatan,
                        catatan: req.body.catatan,
                        verifikasi: req.body.verifikasi,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_kegiatan: req.params.id_kegiatan
                        }
                    }).then(() => {
                        return res.json({
                            message: "Berhasil mengubah data kegiatan.",
                            code: 200
                        })
                    }).catch(err => {
                        return res.json({
                            message: err.message,
                            code: 500
                        })
                    })
                }
            })
        }
    },
    hapusKegiatan: async (req, res) => {
        const find = await Kegiatan.findOne({where: {id_kegiatan: req.params.id_kegiatan}})

        if (find === null) {
            return res.json({
                message: "Kegiatan tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Kegiatan.destroy({
                    where: {
                        id_kegiatan: req.params.id_kegiatan
                    }
                })

                return res.json({
                    message: "Berhasil menghapus Kegiatan.",
                    code: 200
                })
            } catch (e) {
                return res.json({
                    message: e.message,
                    code: 500
                })
            }
        }
    }
}
