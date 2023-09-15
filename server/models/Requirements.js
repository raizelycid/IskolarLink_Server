module.exports = function(sequelize, DataTypes){
    const Requirements = sequelize.define('Requirements', {
        orgId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requirement_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        requirement:{
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    return Requirements;
}