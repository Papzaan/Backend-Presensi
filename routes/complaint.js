const express = require('express');
const {isToken} = require("../middlewares/token_validator");
const {
    detailComplaint,
    listComplaint,
    tambahComplaint,
    ubahComplaint,
    hapusComplaint
} = require("../controller/complaint.controller");
const router = express.Router();
const multer = require('multer')
const upload = multer({
    dest: global.appRoot + '/files/bukti-complaint/'
})

router.get('/:id_complaint', isToken, detailComplaint)
router.get('/', isToken, listComplaint)
router.post('/', upload.single('bukti_complaint'), isToken, tambahComplaint)
router.put('/:id_complaint', upload.single('bukti_complaint'), isToken, ubahComplaint)
router.delete('/:id_complaint', isToken, hapusComplaint)

module.exports = router;