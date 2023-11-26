module.exports = (sequelize, DataTypes) => {
    const Feedback = sequelize.define('Feedback', {
        fullName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        subject:{
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    return Feedback;
}