module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('Users', {
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        profile_picture: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        is_student: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        is_student_org: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
    })

    Users.associate = (models) => {
        Users.hasOne(models.Student, {
            onDelete: 'cascade',
        })
    }
    return Users
}