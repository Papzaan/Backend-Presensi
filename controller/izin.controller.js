const {Izin} = require('../models')
const {toString, toDate} = require("../middlewares/time_handler");
const moment = require('moment-timezone')
const fs = require("fs");
const path = require('path')
const {QueryTypes} = require("sequelize");

module.exports = {
    detailIzin: async (req, res) => {
        const id = req.params.id_izin
        try {
            const izin = await Izin.findOne({where: {id_izin: id}})

            if (izin === null) {
                return res.json({
                    message: "Izin tidak ditemukan",
                    code: 404
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: izin
                })
            }
        } catch (err) {
            return res.json({
                message: err.message,
                code: 500
            })
        }
    },
    listIzin: async (req, res) => {
        try {
            let query = "SELECT a.*, nama_pegawai FROM izin AS a JOIN pegawai AS b WHERE a.id_pegawai = b.id_pegawai"
            let izin = await Izin.sequelize.query(query, {type: QueryTypes.SELECT});
            if (req.query.id_opd) izin = izin.filter(data => data.id_opd === parseInt(req.query.id_opd))
            if (req.query.verifikasi) izin = izin.filter( data => data.verifikasi === parseInt(req.query.verifikasi))
            if (izin.length === null) {
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi",
                    code: 404
                })
            }

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: izin
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahIzin: async (req, res) => {
        if (!req.file) {
            try {
                const izin = await Izin.create({
                    id_pegawai: req.body.id_pegawai,
                    id_opd: req.body.id_opd,
                    keterangan: req.body.keterangan,
                    tanggal_izin: toDate(req.body.tanggal_izin),
                    tanggal_selesai: toDate(req.body.tanggal_selesai),
                    jenis_izin: req.body.jenis_izin,
                    created_at: toString(moment.now())
                })

                return res.json({
                    message: "Berhasil menambah Izin Pegawai",
                    code: 201,
                    data: izin
                })
            } catch (e) {
                return res.json({
                    message: e.message,
                    code: 500
                })
            }
        } else {
            const random = moment.now() + path.extname(req.file.originalname)
            const file = global.appRoot + '/files/bukti-izin/' + random
            const url = 'https://dev.pringsewukab.go.id/bukti-izin/' + random

            fs.rename(req.file.path, file, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Izin.create({
                        id_pegawai: req.body.id_pegawai,
                        id_opd: req.body.id_opd,
                        keterangan: req.body.keterangan,
                        bukti: url,
                        tanggal_izin: toDate(req.body.tanggal_izin),
                        tanggal_selesai: toDate(req.body.tanggal_selesai),
                        jenis_izin: req.body.jenis_izin,
                        created_at: toString(moment.now())
                    }).then((data) => {
                        return res.json({
                            message: "Berhasil menambah data izin",
                            code: 201,
                            data: data
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
    ubahIzin: async (req, res) => {
        const find = await Izin.findOne({where: {id_izin: req.params.id_izin}})

        if (!req.file) {
            if (find === null) {
                return res.json({
                    message: `Izin ${req.params.id_izin} tidak terdaftar.`,
                    code: 404
                })
            } else {
                try {
                    await Izin.update({
                        keterangan: req.body.keterangan,
                        bukti: req.body.bukti,
                        verifikasi: req.body.verifikasi,
                        tanggal_izin: req.body.tanggal_izin,
                        tanggal_selesai: req.body.tanggal_selesai,
                        jenis_izin: req.body.jenis_izin,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_izin: req.params.id_izin
                        }
                    })

                    return res.json({
                        message: `Berhasil mengubah data izin ${req.params.id_izin}`,
                        code: 200
                    })
                } catch (e) {
                    return res.json({
                        message: e.message,
                        code: 400
                    })
                }
            }
        } else {
            const random = moment.now() + path.extname(req.file.originalname)
            const foto = global.appRoot + '/files/bukti-izin/' + random
            const url = 'https://dev.pringsewukab.go.id/bukti-izin' + random

            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Izin.update({
                        keterangan: req.body.keterangan,
                        bukti: url,
                        verifikasi: req.body.verifikasi,
                        tanggal_izin: req.body.tanggal_izin,
                        tanggal_selesai: req.body.tanggal_selesai,
                        jenis_izin: req.body.jenis_izin,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_izin: req.params.id_izin
                        }
                    }).then(() => {
                        return res.json({
                            message: 'Berhasil mengubah data izin.',
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
    hapusIzin: async (req, res) => {
        const find = await Izin.findOne({where: {id_izin: req.params.id_izin}})

        if (find === null) {
            return res.json({
                message: "Izin tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Izin.destroy({
                    where: {
                        id_izin: req.params.id_izin
                    }
                })

                return res.json({
                    message: "Berhasil menghapus Izin.",
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