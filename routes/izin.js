const express = require('express');
const {isToken} = require("../middlewares/token_validator");
const {detailIzin, listIzin, tambahIzin, ubahIzin, hapusIzin} = require("../controller/izin.controller");
const router = express.Router();
const multer = require('multer')
const upload = multer({
    dest: global.appRoot + '/files/bukti-izin/'
})

router.get('/:id_izin', isToken, detailIzin)
router.get('/', isToken, listIzin)
router.post('/', upload.single('bukti_izin'), isToken, tambahIzin)
router.put('/:id_izin', upload.single('bukti_izin'), isToken, ubahIzin)
router.delete('/:id_izin', isToken, hapusIzin)

module.exports = router;