const moment = require("moment-timezone");
const {toStringFromDate} = require("../middlewares/time_handler");
moment.locale('id-ID')

module.exports = (Sequelize, DataTypes) => {
    return Sequelize.define('Pangkat', {
        id_pangkat: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        nama_pangkat: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "-"
        },
        golongan: {
            type: DataTypes.STRING,
            max: 5,
            allowNull: false
        },
        edited_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        created_at: {
            type: DataTypes.STRING,
            defaultValue: toStringFromDate(moment.now()),
            allowNull: true
        },
        updated_at: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'pangkat',
        timestamps: false
    })
}