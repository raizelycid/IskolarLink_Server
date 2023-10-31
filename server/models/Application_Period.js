module.exports = function(sequelize, DataTypes){
    const Application_Period = sequelize.define('Application_Period', {
        application_period: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    });
    return Application_Period;
};