module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('Student', {
        student_lname: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        student_fname: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        student_mname: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        department: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        cor: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        remarks: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        is_cosoa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        is_web_admin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    })

    return Student
}