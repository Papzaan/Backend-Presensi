const {Opd} = require('../models')
const moment = require("moment-timezone")
moment.locale('id-ID')
const {toString} = require("../middlewares/time_handler");

module.exports = {
    detailOpd: async (req, res) => {
        const nip = req.params.id_opd
        try {
            const opd = await Opd.findOne({where: {id_opd: nip}})

            if (opd === null) {
                return res.json({
                    message: "OPD tidak terdaftar",
                    code: 404
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: opd
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    listOpd: async (req, res) => {
        try {
            let opd = await Opd.findAll({
                order: [
                    ['nama_opd', 'ASC']
                ]
            })

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: opd
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahOpd: async (req, res) => {
        try {
            const opd = await Opd.create({
                nama_opd: req.body.nama_opd,
                alamat_opd: req.body.alamat_opd,
                created_at: toString(moment.now())
            })

            return res.json({
                message: "Berhasil menambah opd",
                code: 201,
                data: opd
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    ubahOpd: async (req, res) => {
        const find = await Opd.findOne({where: {id_opd: req.params.id_opd}})

        if (find === null) {
            return res.json({
                message: `OPD ${req.params.id_opd} tidak terdaftar.`,
                code: 404
            })
        } else {
            try {
                await Opd.update({
                    nama_opd: req.body.nama_opd,
                    alamat_opd: req.body.alamat_opd,
                    id_kepala_opd: req.body.id_kepala_opd,
                    lat_opd: req.body.lat_opd,
                    long_opd: req.body.long_opd,
                    nominal_tukin: req.body.nominal_tukin,
                    edited_by: req.body.edited_by,
                    updated_at: toString(moment.now())
                }, {
                    where: {
                        id_opd: req.params.id_opd
                    }
                })

                return res.json({
                    message: `Berhasil mengubah data opd ${req.params.id_opd}`,
                    code: 200
                })
            } catch (e) {
                return res.json({
                    message: e.message,
                    code: 500
                })
            }
        }
    },
    hapusOpd: async (req, res) => {
        const find = await Opd.findOne({where: {id_opd: req.params.id_opd}})

        if (find === null) {
            return res.json({
                message: "OPD tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Opd.destroy({
                    where: {
                        id_opd: req.params.id_opd
                    }
                })

                return res.json({
                    message: "Berhasil menghapus OPD.",
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