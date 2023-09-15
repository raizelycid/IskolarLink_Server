module.exports = (sequelize, DataTypes) => {
    const Org_Application = sequelize.define('Org_Application', {
        application_status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        feedback: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    // Associate with Student Model and Organization Model
    // Optional association with Student Model
    Org_Application.associate = (models) => {
        Org_Application.belongsTo(models.Organization, {
            foreignKey: {
                allowNull: false
            }
        });
        Org_Application.belongsTo(models.Student, {
            foreignKey: {
                allowNull: true
            }
        });
        Org_Application.hasOne(models.COSOA_Members, {
            foreignKey: {
                allowNull: true
            }
        });
    };
    return Org_Application;
};