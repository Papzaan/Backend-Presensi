const {Jabatan} = require('../models')
const {toString} = require("../middlewares/time_handler");
const moment = require('moment-timezone')

module.exports = {
    detailJabatan: async (req, res) => {
        const id = req.params.id_jabatan
        try {
            const jabatan = await Jabatan.findOne({where: {id_jabatan: id}})

            if (jabatan === null) {
                return res.json({
                    message: "Jabatan tidak ditemukan",
                    code: 404
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: jabatan
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    listJabatan: async (req, res) => {
        try {
            let jabatan = Jabatan.findAll();
            if (req.query.id_opd) jabatan = jabatan.filter(data => data.id_opd === parseInt(req.query.id_opd))
            if (jabatan.length === 0){
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi",
                    code: 404
                })
            }

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: jabatan
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahJabatan: async (req, res) => {
        try {
            const jabatan = await Jabatan.create({
                id_opd: req.body.id_opd,
                nama_jabatan: req.body.nama_jabatan,
                tupoksi: req.body.tupoksi,
                created_at: toString(moment.now())
            })

            return res.json({
                message: "Berhasil menambah Pegawai",
                code: 201,
                data: jabatan
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    ubahJabatan: async (req, res) => {
        const find = await Jabatan.findOne({where: {id_jabatan: req.params.id_jabatan}})

        if (find === null) {
            return res.json({
                message: `Jabatan ${req.params.id_jabatan} tidak terdaftar.`,
                code: 404
            })
        } else {
            try {
                await Jabatan.update({
                    id_opd: req.body.id_opd,
                    nama_jabatan: req.body.nama_jabatan,
                    tupoksi: req.body.tupoksi,
                    edited_by: req.body.edited_by,
                    updated_at: toString(moment.now())
                }, {
                    where: {
                        id_jabatan: req.params.id_jabatan
                    }
                })

                return res.json({
                    message: `Berhasil mengubah data jabatan ${req.params.id_jabatan}`,
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
    hapusJabatan: async (req, res) => {
        const find = await Jabatan.findOne({where: {id_jabatan: req.params.id_jabatan}})

        if (find === null) {
            return res.json({
                message: "Jabatan tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Jabatan.destroy({
                    where: {
                        id_jabatan: req.params.id_jabatan
                    }
                })

                return res.json({
                    message: "Berhasil menghapus Jabatan.",
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