const express = require('express')
const {
    detailPresensi,
    listPresensi,
    tambahPresensi,
    ubahPresensi,
    hapusPresensi,
    presensiHariIni,
    presensiPulang, presensiSiang
} = require("../controller/presensi.controller");
const {isToken} = require("../middlewares/token_validator");
const router = express.Router()
const multer = require('multer')
const upload = multer({
    dest: global.appRoot + '/files/foto/'
})

router.get('/today/:id_pegawai', isToken, presensiHariIni)
router.get('/:id_presensi', isToken, detailPresensi)
router.get('/', isToken, listPresensi)
router.post('/', upload.single("foto_masuk"), isToken, tambahPresensi)
router.put('/:id_presensi', upload.single("foto_masuk"), isToken, ubahPresensi)
router.put('/siang/:id_presensi', upload.single("foto_siang"), isToken, presensiSiang)

//get id pegawai
// router.put('/siang/:id_presensi/:id_pegawai', upload.single("foto_siang"), isToken, presensiSiang)
router.put('/pulang/:id_presensi', upload.single("foto_pulang"), isToken, presensiPulang)
router.delete('/:id_presensi', isToken, hapusPresensi)

module.exports = router