module.exports = (sequelize, DataTypes) => {
    const Students = sequelize.define('Students', {
        student_num:{
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },

        student_Lname: {
            type: DataTypes.STRING,
            allowNull: false
        },

        student_Fname: {
            type: DataTypes.STRING,
            allowNull: false
        },

        student_Mname: {
            type: DataTypes.STRING,
            allowNull: true
        },

        student_suffix: {
            type: DataTypes.STRING,
            allowNull: true
        },

        department: {
            type: DataTypes.STRING,
            allowNull: false
        },

        year_level: {
            type: DataTypes.STRING,
            allowNull: false
        },

        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },

        //Certificate of Recognition (COR)
        cor: {
            type: DataTypes.STRING,
            allowNull: true
        },

        //Remarks from COR
        cor_remarks: {
            type: DataTypes.STRING,
            allowNull: true
        },

        // if user is part of COSOA
        is_cosoa: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },

        // if user is a Web Admin
        is_web_admin: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            
        }
    });

    // Associate with User Model and Organization Model
    Students.associate = (models) => {
        Students.hasMany(models.Org_Application, {
            foreignKey: "studentId",
            as: "org_application",
            onDelete: 'CASCADE'
        });
        Students.hasOne(models.COSOA_Members, {
            foreignKey: "studentId",
            as: "cosoa_member",
            onDelete: 'CASCADE'
        });
        Students.hasOne(models.Membership, {
            foreignKey: "studentId",
            as: "membership",
            onDelete: 'CASCADE'
        });
    };

    return Students;
};