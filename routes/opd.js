const express = require('express');
const {isToken} = require("../middlewares/token_validator");
const {detailOpd, listOpd, tambahOpd, ubahOpd, hapusOpd} = require("../controller/opd.controller");
const router = express.Router();

router.get('/:id_opd', isToken, detailOpd)
router.get('/', isToken, listOpd)
router.post('/', isToken, tambahOpd)
router.put('/:id_opd', isToken, ubahOpd)
router.delete('/:id_opd', isToken, hapusOpd)

module.exports = router;