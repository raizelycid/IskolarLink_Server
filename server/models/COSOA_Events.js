module.exports = (sequelize, DataTypes) => {
    const COSOA_Events = sequelize.define('COSOA_Events', {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },

        description: {
            type: DataTypes.STRING,
            allowNull: true
        },

        link: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    return COSOA_Events;

}