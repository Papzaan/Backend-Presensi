const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

global.appRoot = __dirname;

const complaintRouter = require('./routes/complaint');
const indexRouter = require('./routes/index');
const izinRouter = require('./routes/izin');
const jabatanRouter = require('./routes/jabatan');
const kegiatanRouter = require('./routes/kegiatan');
const opdRouter = require('./routes/opd');
const pangkatRouter = require('./routes/pangkat');
const pegawaiRouter = require('./routes/pegawai');
const presensiRouter = require('./routes/presensi');
const hariLiburRouter = require('./routes/hariLibur');
const kantor = require('./routes/kantor');
const sseRouter = require('./routes/sse'); 
const dashboardRouter = require('./routes/dashboard');  // Import the dashboard.js router
const tokenValidationRouter = require('./routes/tokenValidation');

const app = express();

app.use(logger('dev'));
app.use(cors({
    origin: '*', // Only allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'files')));

app.use('/api/v1', indexRouter);
app.use('/api/v1/complaint', complaintRouter);
app.use('/api/v1/izin', izinRouter);
app.use('/api/v1/jabatan', jabatanRouter);
app.use('/api/v1/kegiatan', kegiatanRouter);
app.use('/api/v1/opd', opdRouter);
app.use('/api/v1/pangkat', pangkatRouter);
app.use('/api/v1/pegawai', pegawaiRouter);
app.use('/api/v1/presensi', presensiRouter);
app.use('/api/v1/hari-libur', hariLiburRouter);
app.use('/api/v1/kantor', kantor);

app.use('/api/v1/stream', sseRouter); // make sure the path doesn't conflict with other routes
app.use('/api/v1/dashboard', dashboardRouter); 
app.use('/api/v1', tokenValidationRouter); 

module.exports = app;
