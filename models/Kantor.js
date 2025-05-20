const {toStringFromDate} = require("../middlewares/time_handler");
const moment = require("moment-timezone");

module.exports = (Sequelize, DataTypes) => {
    return Sequelize.define('Kantor', {
        id_kantor: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        id_opd: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        nama_kantor: {
            type: DataTypes.STRING,
            defaultValue: "-",
            allowNull: false
        },
        lat_kantor: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: -5.344282076
        },
        long_kantor: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 105.0043158
        },
        edited_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        created_at: {
            type: DataTypes.STRING,
            defaultValue: toStringFromDate(moment.now()),
            allowNull: false
        },
        updated_at: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: 'kantor',
        timestamps: false
    })
}