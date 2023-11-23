module.exports = (sequelize, DataTypes) => {
    const Org_Announcement = sequelize.define('Org_Announcement', {
        org_ann_photo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        org_ann_title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        org_ann_link: {
            type: DataTypes.STRING,
            allowNull: false
        },
        org_ann_body: {
            type: DataTypes.STRING,
            allowNull: false
        },
        orgId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });

    Org_Announcement.associate = (models) => {
        Org_Announcement.belongsTo(models.Users, {
            foreignKey:"orgId",
            as:"organization",
            onDelete: 'CASCADE'
        });
    };
    return Org_Announcement;
}