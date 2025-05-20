const express = require('express');
const {isToken} = require("../middlewares/token_validator");
const {
    detailJabatan,
    listJabatan,
    tambahJabatan,
    ubahJabatan,
    hapusJabatan
} = require("../controller/jabatan.controller");
const router = express.Router();

router.get('/:id_jabatan', isToken, detailJabatan)
router.get('/', isToken, listJabatan)
router.post('/', isToken, tambahJabatan)
router.put('/:id_jabatan', isToken, ubahJabatan)
router.delete('/:id_jabatan', isToken, hapusJabatan)

module.exports = router;