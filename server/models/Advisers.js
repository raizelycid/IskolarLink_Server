module.exports = function(sequelize, DataTypes){
    const Advisers = sequelize.define('Advisers', {
        orgId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        adviser_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    return Advisers;
};