module.exports = function(sequelize, DataTypes) {
    const Organization = sequelize.define('Organization', {
        socn : {
            type: DataTypes.STRING,
            allowNull: true
        },
        org_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        jurisdiction: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subjurisdiction: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        is_accredited: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        application_status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        org_status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        remarks: {
            type: DataTypes.STRING,
            allowNull: true
        },
        membership_period: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    });

    // Associate with Org_Application Model
    Organization.associate = (models) => {
        Organization.hasMany(models.Org_Application, {
            foreignKey: {
                allowNull: false
            }
        });
    };
    return Organization;
}