const {HariLibur} = require('../models')

module.exports = {
    detailHariLibur: async (req, res) => {
        const id = req.params.id_hari
        try {
            const hari = await HariLibur.findOne({where: {id_hari: id}})

            if (hari === null) {
                return res.json({
                    message: "Hari Libur tidak ditemukan",
                    code: 404,
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: hari
                })
            }
        } catch (err) {
            return res.json({
                message: err.message,
                code: 500
            })
        }
    },
    listHariLibur: async (req, res) => {
        try {
            let hari = await HariLibur.findAll()

            if (hari.length === 0) {
                return res.json({
                    message: "Data Kosong",
                    code: 200
                })
            } else {
                return res.json({
                    message: "Berhasil mengambil data",
                    code: 200,
                    data: hari
                })
            }
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    tambahHariLibur: async (req, res) => {
        try {
            const hari = await HariLibur.create({
                hari: req.body.hari,
                keterangan: req.body.keterangan
            })

            return res.json({
                message: "Berhasil menambah Hari Libur Pegawai",
                code: 201,
                data: hari
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 500
            })
        }
    },
    ubahHariLibur: async (req, res) => {
        try {
            await HariLibur.update({
                hari: req.body.hari,
                keterangan: req.body.keterangan
            }, {
                where: {
                    id_hari: req.params.id_hari
                }
            })

            return res.json({
                message: `Berhasil mengubah data hari ${req.params.id_hari}`,
                code: 200
            })
        } catch (e) {
            return res.json({
                message: e.message,
                code: 400
            })
        }

    },
    hapusHariLibur: async (req, res) => {
        const find = await HariLibur.findOne({where: {id_hari: req.params.id_hari}})

        if (find === null) {
            return res.json({
                message: "Hari Libur tidak terdaftar.",
                code: 404
            })
        } else {
            try {
                await HariLibur.destroy({
                    where: {
                        id_hari: req.params.id_hari
                    }
                })

                return res.json({
                    message: "Berhasil menghapus HariLibur.",
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