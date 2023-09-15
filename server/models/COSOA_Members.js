module.exports = (sequelize, DataTypes) => {
    const COSOA_Members = sequelize.define('COSOA_Members', {
        position: {
            type: DataTypes.STRING,
            allowNull: false
        },

        studentId : {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });

    // Associate with Student Model and Org_Application Model
    COSOA_Members.associate = (models) => {
        COSOA_Members.hasOne(models.Org_Application, {
            foreignKey:"cosoaId",
            as:"cosoa",
            onDelete: 'CASCADE'
        });
    };
    return COSOA_Members;
};