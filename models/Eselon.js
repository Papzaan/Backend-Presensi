const moment = require("moment-timezone");
const {toStringFromDate} = require("../middlewares/time_handler");
moment.locale('id-ID')



module.exports = (Sequelize, Datatypes) => {
    return Sequelize.define('Presensi', {
        id_presensi: {
            type: Datatypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        id_pegawai: {
            type: Datatypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        jam_masuk: {
            type: Datatypes.STRING,
            allowNull: false,
            defaultValue: moment.now()
        },
        ket_masuk: {
            type: Datatypes.STRING,
            allowNull: false
        },
        foto_masuk: {
            type: Datatypes.TEXT,
            allowNull: false
        },
        foto_siang: {
            type: Datatypes.TEXT,
            allowNull: true,
        },
        jam_siang: {
            type: Datatypes.STRING,
            allowNull: true,
        },
        ket_siang: {
            type: Datatypes.STRING,
            allowNull: true,
        },
        jam_pulang: {
            type: Datatypes.STRING,
            allowNull: true
        },
        foto_pulang: {
            type: Datatypes.TEXT,
            allowNull: true
        },
        ket_pulang: {
            type: Datatypes.STRING,
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
        },
        nama_pegawai: {
            type: Datatypes.STRING,
            allowNull: true
        },
        id_opd: {
            type: Datatypes.STRING,
            allowNull: true
        },
        id_jabatan: {
            type: Datatypes.STRING,
            allowNull: true
        },
        eselon: {
            type: Datatypes.STRING,
            allowNull: true
        },
        no_whatsapp: {
            type: Datatypes.STRING,
            allowNull: true
        }

    }, {
        tableName: 'presensi',
        timestamps: false
    })
}