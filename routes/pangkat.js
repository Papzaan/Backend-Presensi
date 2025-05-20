const express = require('express');
const {isToken} = require("../middlewares/token_validator");
const {
    detailPangkat,
    listPangkat,
    tambahPangkat,
    ubahPangkat,
    hapusPangkat
} = require("../controller/pangkat.controller");
const router = express.Router();

router.get('/:id_pangkat', isToken, detailPangkat)
router.get('/', isToken, listPangkat)
router.post('/', isToken, tambahPangkat)
router.put('/:id_pangkat', isToken, ubahPangkat)
router.delete('/:id_pangkat', isToken, hapusPangkat)

module.exports = router;