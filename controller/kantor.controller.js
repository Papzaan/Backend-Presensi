const {Kantor} = require('../models')
const moment = require("moment-timezone")
moment.locale('id-ID')
const {toString} = require("../middlewares/time_handler");

module.exports = {
    detailKantor: async (req, res) => {
        const nip = req.params.id_kantor
        try {
            const kantor = await Kantor.findOne({where: {id_kantor: nip}})

            if (kantor === null) {
                return res.json({
                    message: "Kantor tidak terdaftar",
                    code: 404
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: kantor
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    listKantor: async (req, res) => {
        try {
            let kantor = await Kantor.findAll({
                order: [
                    ['id_kantor', 'ASC']
                ]
            })
            if (req.query.id_opd) kantor = kantor.filter(data => data.id_opd === parseInt(req.query.id_opd))

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: kantor
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahKantor: async (req, res) => {
        try {
            const kantor = await Kantor.create({
                id_opd: req.body.id_opd,
                nama_kantor: req.body.nama_kantor,
                lat_kantor: req.body.lat_kantor,
                long_kantor: req.body.long_kantor,
                created_at: toString(moment.now())
            })

            return res.json({
                message: "Berhasil menambah kantor",
                code: 201,
                data: kantor
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    ubahKantor: async (req, res) => {
        const find = await Kantor.findOne({where: {id_kantor: req.params.id_kantor}})

        if (find === null) {
            return res.json({
                message: `Kantor ${req.params.id_kantor} tidak terdaftar.`,
                code: 404
            })
        } else {
            try {
                await Kantor.update({
                    id_opd: req.body.id_opd,
                    nama_kantor: req.body.nama_kantor,
                    lat_kantor: req.body.lat_kantor,
                    long_kantor: req.body.long_kantor,
                    edited_by: req.body.edited_by,
                    updated_at: toString(moment.now())
                }, {
                    where: {
                        id_kantor: req.params.id_kantor
                    }
                })

                return res.json({
                    message: `Berhasil mengubah data kantor ${req.params.id_kantor}`,
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
    hapusKantor: async (req, res) => {
        const find = await Kantor.findOne({where: {id_kantor: req.params.id_kantor}})

        if (find === null) {
            return res.json({
                message: "Kantor tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Kantor.destroy({
                    where: {
                        id_kantor: req.params.id_kantor
                    }
                })

                return res.json({
                    message: "Berhasil menghapus Kantor.",
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