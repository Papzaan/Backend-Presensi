const express = require("express");
// const {isToken} = require("../middlewares/token_validator");
const {getEselonList, getEselonByOpd} = require("../controller/eselon.controller");
const router = express.Router();

// Route GET untuk mengambil data presensi eselon 2 dan 3
router.get('/', getEselonList)
router.get('/:id_opd', getEselonByOpd)

module.exports = router;