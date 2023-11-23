module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('Users', {
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false
        },

        profile_picture: {
            type: DataTypes.STRING,
            allowNull: true
        },

        description: {
            type: DataTypes.STRING,
            allowNull: true
        },

        role: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
    Users.associate = function(models) {
        Users.hasOne(models.Students, {
            foreignKey: 'userId',
            as: 'student',
            onDelete: 'CASCADE'
        });

        Users.hasOne(models.Organization, {
            foreignKey: 'userId',
            as: 'organization',
            onDelete: 'CASCADE'
        });

        Users.hasMany(models.Org_Announcement, {
            foreignKey: 'orgId',
            as: 'organization_announcements',
            onDelete: 'CASCADE'
        });
    };
    return Users;
};
