const moment = require("moment-timezone");
moment.locale('id-ID')

module.exports = (Sequelize, Datatypes) => {
    return Sequelize.define('Kegiatan', {
        id_kegiatan: {
            type: Datatypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        id_pegawai: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        id_presensi: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        kegiatan: {
            type: Datatypes.TEXT,
            allowNull: false
        },
        url_file: {
            type: Datatypes.STRING,
            allowNull: false
        },
        tanggal_kegiatan: {
            type: Datatypes.STRING,
            allowNull: false
        },
        catatan: {
            type: Datatypes.TEXT,
            allowNull: true
        },
        verifikasi: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        edited_by: {
            type: Datatypes.INTEGER,
            allowNull: true
        },
        created_at: {
            type: Datatypes.STRING,
            allowNull: false
        },
        updated_at: {
            type: Datatypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'kegiatan',
        timestamps: false
    })
}