const express = require('express');
const router = express.Router();
const {
    detailPegawai,
    listPegawai,
    tambahPegawai,
    ubahPegawai,
    hapusPegawai
} = require("../controller/pegawai.controller");
const {isToken, isAdmin} = require("../middlewares/token_validator");
const multer = require('multer')
const upload = multer({
    dest: global.appRoot + '/files/foto/'
})

router.get('/:nip_pegawai', isToken, detailPegawai)
router.get('/', isToken, listPegawai)
router.post('/', upload.single('foto'), isAdmin, tambahPegawai)
router.put('/:nip_pegawai', upload.single('foto'), isToken, ubahPegawai)
router.delete('/:nip_pegawai', isAdmin, hapusPegawai)

module.exports = router;