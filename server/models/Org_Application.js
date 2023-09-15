module.exports = (sequelize, DataTypes) => {
    const Org_Application = sequelize.define('Org_Application', {
        cosoaId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        orgId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        application_status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        feedback: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return Org_Application;
};