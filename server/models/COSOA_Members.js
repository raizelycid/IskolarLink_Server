module.exports = (sequelize, DataTypes) => {
    const COSOA_Members = sequelize.define('COSOA_Members', {
        position: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    // Associate with Student Model and Org_Application Model
    COSOA_Members.associate = (models) => {
        COSOA_Members.belongsTo(models.Student, {
            foreignKey: {
                allowNull: true
            }
        });
        COSOA_Members.belongsTo(models.Org_Application, {
            foreignKey: {
                allowNull: true
            }
        });
    };
};