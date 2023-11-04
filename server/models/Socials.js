module.exports = (sequelize, DataTypes) => {
    const Socials = sequelize.define('Socials', {
        facebook: {
            type: DataTypes.STRING,
            allowNull: true
        },
        twitter: {
            type: DataTypes.STRING,
            allowNull: true
        },
        instagram: {
            type: DataTypes.STRING,
            allowNull: true
        },
        linkedin: {
            type: DataTypes.STRING,
            allowNull: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });

    // Associate with User Model
    Socials.associate = (models) => {
        Socials.belongsTo(models.Users, {
            foreignKey:"userId",
            as:"user",
            onDelete: 'CASCADE'
        });
    };

    return Socials;

};