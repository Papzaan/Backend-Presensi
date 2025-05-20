const moment = require("moment-timezone");
moment.locale('id-ID')

module.exports = (Sequelize, Datatypes) => {
    return Sequelize.define('HariLibur', {
        id_hari: {
            type: Datatypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        hari: {
            type: Datatypes.STRING,
            allowNull: false
        },
        keterangan: {
            type: Datatypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'hari_libur',
        timestamps: false
    })
}