const moment = require("moment-timezone");
const {toStringFromDate} = require("../middlewares/time_handler");
moment.locale('id-ID')

module.exports = (Sequelize, Datatypes) => {
    return Sequelize.define('Complaint', {
        id_complaint: {
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
        tujuan: {
            type: Datatypes.STRING,
            defaultValue: "ADMINOPD",
            allowNull: false
        },
        isi: {
            type: Datatypes.TEXT,
            allowNull: true
        },
        bukti_complaint: {
            type: Datatypes.TEXT,
            allowNull: true
        },
        status: {
            type: Datatypes.STRING,
            allowNull: true
        },
        catatan: {
            type: Datatypes.TEXT,
            allowNull: true
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
        tableName: 'complaint',
        timestamps: false
    })
}