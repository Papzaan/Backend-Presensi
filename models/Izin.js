const moment = require("moment-timezone");
const {toStringFromDate} = require("../middlewares/time_handler");
moment.locale('id-ID')

module.exports = (Sequelize, Datatypes) => {
    return Sequelize.define('Izin', {
        id_izin: {
            type: Datatypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        id_pegawai: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        id_opd: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        keterangan: {
            type: Datatypes.STRING,
            defaultValue: "-",
            allowNull: false
        },
        bukti: {
            type: Datatypes.STRING,
            allowNull: true
        },
        verifikasi: {
            type: Datatypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        tanggal_izin: {
            type: Datatypes.STRING,
            allowNull: true
        },
        tanggal_selesai: {
            type: Datatypes.STRING,
            allowNull: true
        },
        jenis_izin: {
            type: Datatypes.ENUM({
                values: ["WFH", "DL", "SAKIT", "IZIN"],
                default: "SAKIT"
            }),
            allowNull: false
        },
        edited_by: {
            type: Datatypes.INTEGER,
            allowNull: true
        },
        created_at: {
            type: Datatypes.STRING,
            defaultValue: toStringFromDate(moment.now()),
            allowNull: false
        },
        updated_at: {
            type: Datatypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'izin',
        timestamps: false
    })
}