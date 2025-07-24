const {Presensi} = require('../models')
const moment = require('moment-timezone')
const {toString, toDate, toTime} = require("../middlewares/time_handler");
const fs = require("fs");
const path = require("path")
const {Op, QueryTypes} = require("sequelize");

module.exports = {
    presensiHariIni: async (req, res) => {
        const id = req.params.id_pegawai

        try {
            const presensi = await Presensi.findOne({
                where: {
                    id_pegawai: id,
                    created_at: {
                        [Op.like]: '%' + toDate(moment.now()) + '%'
                    }
                }
            })
            if (presensi !== null) {
                presensi.jam_masuk = toTime(presensi.jam_masuk)
                presensi.jam_siang = toTime(presensi.jam_siang)
                presensi.jam_pulang = toTime(presensi.jam_pulang)

                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: presensi
                })
            } else {
                return res.json({
                    message: "Kamu belum mengisi kehadiran hari ini!. Ketuk tombol dibawah untuk mengisi kehadiran",
                    code: 404,
		    data: presensi
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500,
		data: presensi
            })
        }
    },
    detailPresensi: async (req, res) => {
        const id = req.params.id_presensi
        try {
            const find = await Presensi.findAll({
                where: {
                    id_presensi: id
                }
            })

            if (find === null) {
                return res.json({
                    message: "Presensi belum dibuat",
                    code: 404
                })
            } else {
                find.jam_masuk = toTime(find.jam_masuk)
                find.jam_siang = toTime(find.jam_siang)
                find.jam_pulang = toTime(find.jam_pulang)

                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: find
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    listPresensi: async (req, res) => {
//        const query = "SELECT a.id_presensi, a.id_pegawai, id_opd, b.nama_pegawai, url_foto_pegawai, b.nip_pegawai, a.jam_masuk, a.ket_masuk, a.foto_masuk , a.jam_siang, a.ket_siang, a.foto_siang, a.jam_pulang, a.ket_pulang, a.foto_pulang, a.edited_by, a.created_at, a.updated_at FROM presensi a JOIN pegawai b WHERE a.id_pegawai = b.id_pegawai"
	const query = `SELECT pre.*, b.id_opd, b.nama_pegawai FROM (SELECT p.* FROM presensi AS p WHERE p.created_at LIKE '%/${req.query.bulan}/${req.query.tahun}%') AS pre JOIN pegawai AS b WHERE pre.id_pegawai = b.id_pegawai AND b.id_opd = ${req.query.id_opd} GROUP BY pre.id_presensi ORDER BY pre.jam_masuk ASC`

        try {
            let presensi = await Presensi.sequelize.query(query, {
                type: QueryTypes.SELECT
            })
            if (req.query.id_pegawai) presensi = presensi.filter(data => data.id_pegawai === parseInt(req.query.id_pegawai))
//            if (req.query.id_opd) presensi = presensi.filter(data => data.id_opd === parseInt(req.query.id_opd))
//            if (req.query.bulan) presensi = presensi.filter(data => data.created_at.includes(`/${req.query.bulan}/`))
//	    if (req.query.tahun) presensi = presensi.filter(data => data.created_at.includes(`/${req.query.tahun}`))
            if (presensi.length === 0) {
                return res.json({
                    message: "Tidak ada data yang memenuhi kondisi",
                    code: 200
                })
            }

            presensi.forEach((element) => {
                element.jam_masuk = toTime(element.jam_masuk)
                element.jam_siang = toTime(element.jam_siang)
                element.jam_pulang = toTime(element.jam_pulang)
            })

            return res.json({
                message: "Berhasil mengambil data presensi",
                code: 200,
                data: presensi
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahPresensi: async (req, res) => {
        const find = await Presensi.findOne({
            where: {
                id_pegawai: req.body.id_pegawai,
                created_at: {
                    [Op.like] : `%${toDate(moment.now())}%`
                }
            }
        })

        if (!find) {
            try {
                if (!req.file) {
                    return res.json({
                        message: "Foto tidak boleh kosong",
                        code: 403
                    })
                } else {
                    const random = moment.now() +'' + req.body.id_pegawai+ path.extname(req.file.originalname) 
                    const foto = global.appRoot + '/files/foto/' + random 
                    const url = 'http://localhost:3000/foto/' + random

                    fs.rename(req.file.path, foto, function (err) {
                        if (err) {
                            return res.json({
                                message: err.message,
                                code: 400
                            })
                        } else {
                            Presensi.create({
                                id_pegawai: req.body.id_pegawai,
                                jam_masuk: moment.now(),
                                ket_masuk: req.body.ket_masuk,
                                foto_masuk: url,
                                created_at: toString(moment.now())
                            }).then(data => {
                                return res.json({
                                    message: "Berhasil menandai kehadiran",
                                    code: 201,
                                    data: data
                                })
                            }).catch(er => {
                                return res.json({
                                    message: er.message,
                                    code: 500
                                })
                            })
                        }
                    })
                }
            } catch (e) {
                return res.json({
                    message: e.message,
                    code: 500
                })
            }
        } else {
            return res.json ({
                message: "Kamu sudah membuat presensi pagi hari ini",
                code: 403
            })
        }
    },
    presensiSiang: async (req, res) => {
        const id_pegawai = req.user?.pegawai?.id_pegawai;
        const find = await Presensi.findOne({where: {id_presensi: req.params.id_presensi}})

        if (!id_pegawai) {
            return res.json({
                message: "ID Pegawai tidak ditemukan dari token",
                code: 400
            });
        }

        if (!req.file) {
            return res.json({
                message: `Foto tidak boleh kosong`,
                code: 403
            })
        } else {
            const random = moment.now() + '' + id_pegawai + path.extname(req.file.originalname)
            const foto = global.appRoot + '/files/foto/' + random
            const url = 'http://localhost:3000/foto/' + random

            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else if (find == null) {
                    return res.json({
                        message: "Data tidak ada",
                        code: 404
                    })
                } else {
                    Presensi.update({
                        jam_siang: moment.now(),
                        ket_siang: req.body.ket_siang,
                        foto_siang: url,
                        edited_by: req.body.id_pegawai,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_presensi: req.params.id_presensi
                        }
                    }).then(() => {
                        return res.json({
                            message: "Berhasil mengubah data presensi",
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
    presensiPulang: async (req, res) => {
        const id_pegawai = req.user?.pegawai?.id_pegawai;
        const find = await Presensi.findOne({where: {id_presensi: req.params.id_presensi}})

        if (!id_pegawai) {
            return res.json({
                message: "ID Pegawai tidak ditemukan dari token",
                code: 400
            });
        }

        if (!req.file) {
            return res.json({
                message: `Foto tidak boleh kosong`,
                code: 403
            })
        } else {
            const random = moment.now() + '' + id_pegawai+ path.extname(req.file.originalname)
            const foto = global.appRoot + '/files/foto/' + random
            const url = 'http://localhost:3000/foto/' + random

            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else if (find == null) {
                    return res.json({
                        message: "Data tidak ada",
                        code: 404
                    })
                } else {
                    Presensi.update({
                        id_pegawai: req.body.id_pegawai,
                        jam_pulang: moment.now(),
                        ket_pulang: req.body.ket_pulang,
                        foto_pulang: url,
                        edited_by: req.body.id_pegawai,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_presensi: req.params.id_presensi
                        }
                    }).then(() => {
                        return res.json({
                            message: "Berhasil mengubah data presensi",
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
    ubahPresensi: async (req, res) => {
        const id_pegawai = req.user?.pegawai?.id_pegawai;
        const find = await Presensi.findOne({where: {id_presensi: req.params.id_presensi}})

        if (!id_pegawai) {
            return res.json({
                message: "ID Pegawai tidak ditemukan dari token",
                code: 400
            });
        }


        if (!req.file) {
            if (find === null) {
                return res.json({
                    message: `Presensi ${req.params.id_presensi} belum dibuat.`,
                    code: 404
                })
            } else {
                try {
                    await Presensi.update({
                        id_pegawai: req.body.id_pegawai,
                        jam_masuk: req.body.jam_masuk,
                        ket_masuk: req.body.ket_masuk,
                        jam_pulang: req.body.jam_pulang,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_presensi: req.params.id_presensi
                        }
                    })

                    return res.json({
                        message: `Berhasil mengubah data presensi ${req.params.id_presensi}`,
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
            const random = moment.now() +'' + id_pegawai+ path.extname(req.file.originalname)
            const foto = global.appRoot + '/files/foto/' + random
            const url = 'http://localhost:3000/foto/' + random

            fs.rename(req.file.path, foto, function (err) {
                if (err) {
                    return res.json({
                        message: err.message,
                        code: 400
                    })
                } else {
                    Presensi.update({
                        id_pegawai: req.body.id_pegawai,
                        jam_masuk: req.body.jam_masuk,
                        jam_pulang: req.body.jam_pulang,
                        foto_masuk: url,
                        edited_by: req.body.edited_by,
                        updated_at: toString(moment.now())
                    }, {
                        where: {
                            id_presensi: req.params.id_presensi
                        }
                    }).then(() => {
                        return res.json({
                            message: "Berhasil mengubah data presensi",
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
    hapusPresensi: async (req, res) => {
        const find = await Presensi.findOne({where: {id_presensi: req.params.id_presensi}})

        if (find === null) {
            return res.json({
                message: "Presensi belum dibuat.",
                code: 404
            })
        } else {
            try {
                await Presensi.destroy({
                    where: {
                        id_presensi: req.params.id_presensi
                    }
                })

                return res.json({
                    message: "Berhasil menghapus data Presensi.",
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
