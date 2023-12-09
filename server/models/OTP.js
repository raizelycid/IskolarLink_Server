module.exports = function(sequelize, DataTypes){
    const OTP = sequelize.define('OTP', {
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
    });

    return OTP;
}