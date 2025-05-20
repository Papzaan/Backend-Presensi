const {Pegawai, Opd, Jabatan} = require('../models')
const {toString} = require("../middlewares/time_handler");
const moment = require('moment-timezone')
const fs = require("fs");
const path = require('path')

module.exports = {
    detailPegawai: async (req, res) => {
        const nip = req.params.nip_pegawai
        try {
            const pegawai = await Pegawai.findOne({where: {nip_pegawai: nip}})

            if (pegawai === null) {
                return res.json({
                    message: "NIP tidak terdaftar",
                    code: 404
                })
            } else {
                const opd = await Opd.findOne({where: {id_opd: pegawai.id_opd}})
                const jabatan = await Jabatan.findOne({where: {id_jabatan: pegawai.id_jabatan}})

                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: {
                        id_pegawai: pegawai.id_pegawai,
                        nama_pegawai: pegawai.nama_pegawai,
                        nip_pegawai: pegawai.nip_pegawai,
                        opd: opd.nama_opd,
                        jabatan: jabatan.nama_jabatan,
                        url_foto_pegawai: pegawai.url_foto_pegawai,
                        tukin: pegawai.tukin
                    }
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    listPegawai: async (req, res) => {
        try {
            const { col, literal } = require('sequelize');
            const whereCondition = {};
            if (req.query.id_opd) {
                whereCondition.id_opd = parseInt(req.query.id_opd);
            }
            let pegawai = await Pegawai.findAll({
                    where: whereCondition,
                    attributes: {
                        include: [
                            [col('opd.nama_opd'), 'nama_opd'] //include field
                        ]
                    },
                    include: [{
                        model: Opd,
                        as: 'opd',
                        attributes: [] 
                    }]
            });

           if (req.query.id_opd) pegawai = pegawai.filter(data => data.id_opd === parseInt(req.query.id_opd));
            if (pegawai.length === 0) {
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi",
                    code: 404
                })
            }

            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: pegawai
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahPegawai: async (req, res) => {
        const find = await Pegawai.findOne({
            where: {
                nip_pegawai: req.body.nip_pegawai
            }
        })

        if (!req.file) {
            if (find === null) {
                try {
                    await Pegawai.create({
                        nama_pegawai: req.body.nama_pegawai,
                        nip_pegawai: req.body.nip_pegawai,
                        id_opd: req.body.id_opd,
                        id_jabatan: req.body.id_jabatan,
                        id_pangkat: req.body.id_pangkat,
                        id_atasan: req.body.id_atasan,
                        tukin: req.body.tukin,
                        password: "a",
                        first_time: 0,
                        level: "USER",
                        created_at: toString(moment.now())
                    })

                    return res.json({
                        message: "Berhasil menambah Pegawai",
                        code: 201
                    })
                } catch (e) {
                    return res.json({
                        message: e.message,
                        code: 500
                    })
                }
            } else {
                return res.json({
                    message: "NIP sudah terdaftar",
                    code: 400
                })
            }
        } else {
            const random = moment.now() + path.extname(req.file.originalname)
            const foto = global.appRoot + '/files/foto/' + random
            const url = 'https://dev.pringsewukab.go.id/foto/' + random
            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Pegawai.create({
                        nama_pegawai: req.body.nama_pegawai,
                        nip_pegawai: req.body.nip_pegawai,
                        id_opd: req.body.id_opd,
                        id_jabatan: req.body.id_jabatan,
                        id_pangkat: req.body.id_pangkat,
                        tukin: req.body.tukin,
                        password: "",
                        first_time: 0,
                        level: "USER",
                        url_foto_pegawai: url,
                        created_at: toString(moment.now())
                    }).then(() => {
                        return res.json({
                            message: "Berhasil menambah Pegawai",
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
    ubahPegawai: async (req, res) => {
        const find = await Pegawai.findOne({where: {nip_pegawai: req.params.nip_pegawai}})

        if (!req.file) {
            if (find === null) {
                return res.json({
                    message: `NIP ${req.params.nip_pegawai} tidak terdaftar.`,
                    code: 404
                })
            } else {
                try {
                    let pegawai = await Pegawai.update({
                        nama_pegawai: req.body.nama_pegawai,
                        id_opd: req.body.id_opd,
                        id_jabatan: req.body.id_jabatan,
                        id_pangkat: req.body.id_pangkat,
                        id_atasan: req.body.id_atasan,
                        level: req.body.level,
                        edited_by: req.body.edited_by,
                        tukin: req.body.tukin,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            nip_pegawai: req.params.nip_pegawai
                        }
                    })

                    return res.json({
                        message: `Berhasil mengubah data pegawai ${req.params.nip_pegawai}`,
                        code: 200,
                        data: pegawai
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
            const foto = global.appRoot + '/files/foto/' + random
            const url = 'https://dev.pringsewukab.go.id/foto/' + random
            fs.rename(req.file.path, foto, async function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    try {
                        await Pegawai.update({
                            nama_pegawai: req.body.nama_pegawai,
                            id_opd: req.body.id_opd,
                            id_jabatan: req.body.id_jabatan,
                            id_pangkat: req.body.id_pangkat,
                            id_atasan: req.body.id_atasan,
                            level: req.body.level,
                            tukin: req.body.tukin,
                            url_foto_pegawai: url,
                            edited_by: req.body.edited_by,
                            updated_at: toString(moment.now())
                        }, {
                            where: {
                                nip_pegawai: req.params.nip_pegawai
                            }
                        })

                        const pegawai = await Pegawai.findOne({
                            where: {
                                nip_pegawai: req.params.nip_pegawai
                            }
                        })

                        return res.json({
                            message: `Berhasil mengubah data pegawai ${req.params.nip_pegawai}`,
                            code: 200,
                            data: {
                                id_pegawai: pegawai.id_pegawai,
                                nama_pegawai: pegawai.nama_pegawai,
                                nip_pegawai: pegawai.nip_pegawai,
                                id_opd: pegawai.id_opd,
                                id_jabatan: pegawai.id_jabatan,
                                id_pangkat: pegawai.id_pangkat,
                                id_atasan: pegawai.id_atasan,
                                level: pegawai.level,
                                url_foto_pegawai: pegawai.url_foto_pegawai,
                                tukin: pegawai.tukin,
                            }
                        })
                    } catch (err) {
                        return res.json({
                            message: err.message,
                            code: 500
                        })
                    }
                }
            })
        }
    },
    hapusPegawai: async (req, res) => {
        const find = await Pegawai.findOne({where: {nip_pegawai: req.params.nip_pegawai}})

        if (find === null) {
            return res.json({
                message: "NIP tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await Pegawai.destroy({
                    where: {
                        nip_pegawai: req.params.nip_pegawai
                    }
                })

                return res.json({
                    message: "Berhasil menghapus pegawai.",
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