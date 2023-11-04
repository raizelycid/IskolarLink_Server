module.exports = (sequelize, DataTypes) => {
    const Membership = sequelize.define('Membership', {
        orgId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });

    // Associate with Student Model and Org_Application Model
    Membership.associate = (models) => {
        Membership.belongsTo(models.Students, {
            foreignKey:"studentId",
            as:"student",
            onDelete: 'CASCADE'
        });
        Membership.belongsTo(models.Organization, {
            foreignKey:"orgId",
            as:"organization",
            onDelete: 'CASCADE'
        });
    };

    return Membership;
};