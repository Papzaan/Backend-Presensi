const moment = require("moment-timezone");
const {toStringFromDate} = require("../middlewares/time_handler");
moment.locale('id-ID')

module.exports = (Sequelize, DataTypes) => {
    return Sequelize.define('Jabatan', {
        id_jabatan: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        id_opd: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        nama_jabatan: {
            type: DataTypes.STRING,
            defaultValue: "-",
            allowNull: false
        },
        tupoksi: {
            type: DataTypes.TEXT,
            defaultValue: "-",
            allowNull: false
        },
        edited_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        created_at: {
            type: DataTypes.STRING,
            defaultValue: toStringFromDate(moment.now()),
            allowNull: false
        },
        updated_at: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'jabatan',
        timestamps: false
    })
}