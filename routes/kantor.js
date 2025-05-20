const express = require('express');
const {isToken} = require("../middlewares/token_validator");
const {detailKantor, listKantor, tambahKantor, ubahKantor, hapusKantor} = require("../controller/kantor.controller");
const router = express.Router();

router.get('/:id_kantor', isToken, detailKantor)
router.get('/', isToken, listKantor)
router.post('/', isToken, tambahKantor)
router.put('/:id_kantor', isToken, ubahKantor)
router.delete('/:id_kantor', isToken, hapusKantor)

module.exports = router;