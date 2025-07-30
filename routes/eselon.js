const express = require("express");
const {isToken} = require("../middlewares/token_validator");
const {getEselonList} = require("../controller/eselon.controller");
const router = express.Router();

// Route GET untuk mengambil data presensi eselon 2 dan 3
router.get('/', isToken, getEselonList)

module.exports = router;