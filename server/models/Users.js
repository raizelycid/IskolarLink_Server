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
    };
    return Users;
};