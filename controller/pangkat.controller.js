const {Pangkat} = require('../models')
const {toString} = require("../middlewares/time_handler");
const moment = require("moment-timezone");

module.exports = {
    detailPangkat: async (req, res) => {
        const id = req.params.id_pangkat
        try {
            const pangkat = await Pangkat.findOne({where: {id_pangkat: id}})

            if (pangkat === null) {
                return res.json({
                    message: "Pangkat tidak ditemukan",
                    code: 404
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: pangkat
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    listPangkat: async (req, res) => {
        try {
            let pangkat = await Pangkat.findAll({
                order: [
                    ['id_pangkat', 'DESC']
                ]
            })

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: pangkat
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahPangkat: async (req, res) => {
        try {
            const pangkat = await Pangkat.create({
                nama_pangkat: req.body.nama_pangkat,
                golongan: req.body.golongan,
                created_at: toString(moment.now())
            })

            return res.json({
                message: "Berhasil menambah Pegawai",
                code: 201,
                data: pangkat
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    ubahPangkat: async (req, res) => {
        const find = await Pangkat.findOne({where: {id_pangkat: req.params.id_pangkat}})

        if (find === null) {
            return res.json({
                message: `Pangkat ${req.params.id_pangkat} tidak terdaftar.`,
                code: 404
            })
        } else {
            try {
                await Pangkat.update({
                    nama_pangkat: req.body.nama_pangkat,
                    golongan: req.body.golongan,
                    edited_by: req.body.edited_by,
                    updated_at: toString(moment.now())
                }, {
                    where: {
                        id_pangkat: req.params.id_pangkat
                    }
                })

                return res.json({
                    message: `Berhasil mengubah data pangkat ${req.params.id_pangkat}`,
                    code: 200
                })
            } catch (e) {
                return res.json({
                    message: e.message,
                    code: 400
                })
            }
        }
    },
    hapusPangkat: async (req, res) => {
        const find = await Pangkat.findOne({where: {id_pangkat: req.params.id_pangkat}})

        if (find === null) {
            return res.json({
                message: "Pangkat tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Pangkat.destroy({
                    where: {
                        id_pangkat: req.params.id_pangkat
                    }
                })

                return res.json({
                    message: "Berhasil menghapus Pangkat.",
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