const express = require('express');
const {isToken} = require("../middlewares/token_validator");
const {
    detailHariLibur,
    listHariLibur,
    tambahHariLibur,
    ubahHariLibur,
    hapusHariLibur
} = require("../controller/harilibur.controller");
const router = express.Router();

router.get('/:id_hari', isToken, detailHariLibur)
router.get('/', isToken, listHariLibur)
router.post('/',  isToken, tambahHariLibur)
router.put('/:id_hari',  isToken, ubahHariLibur)
router.delete('/:id_hari', isToken, hapusHariLibur)

module.exports = router;