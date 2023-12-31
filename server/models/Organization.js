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
        },

        mission: {
            type: DataTypes.STRING,
            allowNull: true
        },

        vision: {
            type: DataTypes.STRING,
            allowNull: true
        },

        strict: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });

    // Associate with Org_Application Model
    Organization.associate = (models) => {
        Organization.hasMany(models.Org_Application, {
            foreignKey: "orgId",
            as: "org_application",
            onDelete: 'CASCADE'
        });
        Organization.hasMany(models.Requirements, {
            foreignKey: "orgId",
            as: "requirements",
            onDelete: 'CASCADE'
        });
        Organization.hasMany(models.Advisers, {
            foreignKey: "orgId",
            as: "advisers",
            onDelete: 'CASCADE'
        });
        Organization.hasMany(models.Membership, {
            foreignKey: "orgId",
            as: "membership",
            onDelete: 'CASCADE'
        });
    };

    Organization.associate = (models) => {
        Organization.belongsTo(models.Users, {
            foreignKey: "userId",
            onDelete: 'CASCADE'
        });
    }
    return Organization;
}