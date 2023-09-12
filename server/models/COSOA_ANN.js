module.exports = (sequelize, DataTypes) => {
    //COSOA Announcements
    const COSOA_ANN = sequelize.define('COSOA_ANN', {
        cosoa_ann_photo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cosoa_ann_title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        cosoa_ann_sub_title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cosoa_ann_body: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
    return COSOA_ANN;
};