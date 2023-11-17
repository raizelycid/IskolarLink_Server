module.exports = (sequelize, DataTypes) => {
    const COSOA_Profile = sequelize.define('COSOA_Profile', {
        org_name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        org_picture: {
            type: DataTypes.STRING,
            allowNull: false
        },

        mission: {
            type: DataTypes.STRING,
            allowNull: false
        },

        vision: {
            type: DataTypes.STRING,
            allowNull: false
        },

        contact_number: {
            type: DataTypes.STRING,
            allowNull: false
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false
        },

        social1: {
            type: DataTypes.STRING,
            allowNull: true
        },

        social2: {
            type: DataTypes.STRING,
            allowNull: true
        },

        social3: {
            type: DataTypes.STRING,
            allowNull: true
        },

        social4: {
            type: DataTypes.STRING,
            allowNull: true
        },

    });

    return COSOA_Profile;
}