const express = require('express');
const router = express.Router();
const {login, updatePassword, dashboard} = require("../controller/public.controller");
const {isToken} = require("../middlewares/token_validator");

router.post('/login', login);
router.put('/ubah-password', isToken, updatePassword)
router.get('/dashboard', isToken, dashboard)

module.exports = router;
