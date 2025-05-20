const {Complaint} = require('../models')
const {toString} = require("../middlewares/time_handler");
const moment = require('moment-timezone')
const fs = require("fs");
const path = require('path')
const {QueryTypes} = require("sequelize");

module.exports = {
    detailComplaint: async (req, res) => {
        const id = req.params.id_complaint
        try {
            const complaint = await Complaint.findOne({where: {id_complaint: id}})

            if (complaint === null) {
                return res.json({
                    message: "Keluhan tidak ditemukan",
                    code: 404,
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: complaint
                })
            }
        } catch (err) {
            return res.json({
                message: err.message,
                code: 500
            })
        }
    },
    listComplaint: async (req, res) => {
        try {
            let query = "SELECT a.*, p.nama_pegawai, o.nama_opd FROM complaint AS a JOIN pegawai p on a.id_pegawai = p.id_pegawai JOIN opd o on a.id_opd = o.id_opd"
            let complaint = await Complaint.sequelize.query(query, {type: QueryTypes.SELECT})
            if (req.query.id_pegawai) complaint = complaint.filter(data => data.id_pegawai === parseInt(req.query.id_pegawai))
            if (req.query.id_opd) complaint = complaint.filter(data => data.id_opd === parseInt(req.query.id_opd))
            if (req.query.tujuan) complaint = complaint.filter(data => data.tujuan === req.query.tujuan)
            if (complaint.length === 0) {
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi",
                    code: 200
                })
            }

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: complaint
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahComplaint: async (req, res) => {
        if (!req.file) {
            try {
                const complaint = await Complaint.create({
                    id_pegawai: req.body.id_pegawai,
                    id_opd: req.body.id_opd,
                    tujuan: req.body.tujuan,
                    isi: req.body.isi,
                    created_at: toString(moment.now())
                })

                return res.json({
                    message: "Berhasil menambah Keluhan Pegawai",
                    code: 201,
                    data: complaint
                })
            } catch (e) {
                return res.json({
                    message: e.message,
                    code: 500
                })
            }
        } else {
            const random = moment.now() + path.extname(req.file.originalname)
            const file = global.appRoot + '/files/bukti-complaint/' + random
            const url = 'https://dev.pringsewukab.go.id/bukti-complaint/' + random

            fs.rename(req.file.path, file, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Complaint.create({
                        id_pegawai: req.body.id_pegawai,
                        id_opd: req.body.id_opd,
                        tujuan: req.body.tujuan,
                        isi: req.body.isi,
                        bukti_complaint: url,
                        created_at: toString(moment.now())
                    }).then(() => {
                        return res.json({
                            message: "Berhasil menambah data Keluhan",
                            code: 201
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
    ubahComplaint: async (req, res) => {
        const find = await Complaint.findOne({where: {id_complaint: req.params.id_complaint}})

        if (!req.file) {
            if (find === null) {
                return res.json({
                    message: `Keluhan ${req.params.id_complaint} tidak terdaftar.`,
                    code: 404
                })
            } else {
                try {
                    await Complaint.update({
                        isi: req.body.isi,
                        status: req.body.status,
                        catatan: req.body.tanggal_izin,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_complaint: req.params.id_complaint
                        }
                    })

                    return res.json({
                        message: `Berhasil mengubah data Keluhan ${req.params.id_complaint}`,
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
            const foto = global.appRoot + '/files/bukti-complaint/' + random
            const url = 'https://dev.pringsewukab.go.id/bukti-complaint' + random

            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Complaint.update({
                        isi: req.body.isi,
                        bukti_complaint: url,
                        status: req.body.status,
                        catatan: req.body.tanggal_izin,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_complaint: req.params.id_complaint
                        }
                    }).then(() => {
                        return res.json({
                            message: 'Berhasil mengubah data Keluhan.',
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
    hapusComplaint: async (req, res) => {
        const find = await Complaint.findOne({where: {id_complaint: req.params.id_complaint}})

        if (find === null) {
            return res.json({
                message: "Keluhan tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Complaint.destroy({
                    where: {
                        id_complaint: req.params.id_complaint
                    }
                })

                return res.json({
                    message: "Berhasil menghapus Keluhan.",
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