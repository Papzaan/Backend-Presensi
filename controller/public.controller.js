const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const {Pegawai, Opd, Kegiatan, Izin, Presensi} = require('../models')
const {Op, QueryTypes} = require("sequelize");

module.exports = {
    login: async (req, res) => {
        try {
            const query = `SELECT level, id_pegawai, nip_pegawai, nama_pegawai, url_foto_pegawai, o.id_opd, id_atasan, nama_opd, first_time, password FROM pegawai JOIN dash_pringsewukab.opd o on pegawai.id_opd = o.id_opd WHERE nip_pegawai='${req.body.nip_pegawai}'`
            const pegawai = await Pegawai.sequelize.query(query, {type: QueryTypes.SELECT})
            const token = jwt.sign({pegawai: pegawai[0]}, process.env.TOKEN_AUTH, {
                expiresIn: "1h"
            }, null)

            if (pegawai.length === 0){
                return res.json({
                    message: "NIP salah. Silahkan periksa kembali",
                    code: 400
                })
            }

            if (pegawai[0].first_time === 0 && req.body.password === pegawai[0].nip_pegawai) {
                return res.json({
                    message: "Berhasil Masuk",
                    code: 200,
                    data: {
                        level: pegawai[0].level,
                        id_pegawai: pegawai[0].id_pegawai,
                        nip_pegawai: pegawai[0].nip_pegawai,
                        nama_pegawai: pegawai[0].nama_pegawai,
                        url_foto_pegawai: pegawai[0].url_foto_pegawai,
                        id_opd: pegawai[0].id_opd,
                        nama_opd: pegawai[0].nama_opd,
                        first_time: pegawai[0].first_time,
                        id_atasan: pegawai[0].id_atasan,
                        token: token
                    }
                })
            }

            const result = await bcrypt.compare(req.body.password, pegawai[0].password)

            if (result){
                return res.json({
                    message: "Berhasil Masuk",
                    code: 200,
                    data: {
                        level: pegawai[0].level,
                        id_pegawai: pegawai[0].id_pegawai,
                        nip_pegawai: pegawai[0].nip_pegawai,
                        nama_pegawai: pegawai[0].nama_pegawai,
                        url_foto_pegawai: pegawai[0].url_foto_pegawai,
                        id_opd: pegawai[0].id_opd,
                        nama_opd: pegawai[0].nama_opd,
                        first_time: pegawai[0].first_time,
                        id_atasan: pegawai[0].id_atasan,
                        token: token
                    }
                })
            } else {
                return res.json({
                    message: "Password Salah",
                    code: 400
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    updatePassword: async (req, res) => {
        if (req.body.password.length < 8 ) {
            return res.json({
                message: 'Password tidak boleh kurang dari 8 karakter',
                code: 400
            })
        }

        try {
            const salt = bcrypt.genSaltSync(10);
            let encPass = bcrypt.hashSync(req.body.password, salt);

            await Pegawai.update({
                password: encPass,
                first_time: 1
            }, {
                where: {
                    nip_pegawai: req.body.nip_pegawai
                }
            })

            return res.json({
                message: "Berhasil mengubah password",
                code: 200
            });
        } catch (error) {
            return res.json({
                message: "Ubah password gagal. Silahkan ulang kembali nanti",
                code: 400
            });
        }
    },
    dashboard: async (req, res) => {
        const pegawai = await Pegawai.findOne({
            attributes: ['nama_pegawai'],
            where: {
                id_pegawai: req.query.id_pegawai,
                level: req.query.level
            }
        })

        const total_asn = await Pegawai.findAndCountAll()
        const total_opd = await Opd.findAndCountAll()
        const total_laporan = await Kegiatan.findAndCountAll()
        const total_lapkin = await Kegiatan.findAndCountAll({
            where: {
                id_pegawai: req.query.id_pegawai,
                tanggal_kegiatan: {
                    [Op.like]: '%/' + (new Date().getMonth() + 1) + '/' + (new Date().getFullYear()) + '%'
                }
            }
        })

        const total_kehadiran = await Presensi.findAndCountAll({
            where: {
                id_pegawai: req.query.id_pegawai,
                created_at: {
                    [Op.like]: '%/' + (new Date().getMonth() + 1) + '/' + (new Date().getFullYear()) + '%'
                }
            }
        })

        const total_izin = await Izin.findAndCountAll({
            where: {
                id_pegawai: req.query.id_pegawai,
                created_at: {
                    [Op.like]: '%/' + (new Date().getMonth() + 1) + '/' + (new Date().getFullYear()) + '%'
                }
            }
        })

        if (req.query.level === "ADMIN") {
            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: {
                    nama_pegawai: pegawai.nama_pegawai,
                    total_asn: total_asn.count,
                    total_opd: total_opd.count,
                    total_laporan: total_laporan.count
                }
            })
        } else {
            return res.json({
                message: "Berhasil mengambil data",
                code: 200,
                data: {
                    nama_pegawai: pegawai.nama_pegawai,
                    total_lapkin: total_lapkin.count,
                    total_kehadiran: total_kehadiran.count,
                    total_izin: total_izin.count,
                    tukin_bulan_ini: 0
                }
            })
        }
    }
}