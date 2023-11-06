const {Application_Period} = require('../models');

const checkPeriod = async (req, res, next) => {
    const period = await Application_Period.findOne({
        where: {
            id: 1
        }
    });
    const application_period = period.application_period;
    if (application_period === true){
        next();
    }else{
        res.json({error: 'Application period is closed'});
    }
}

module.exports = checkPeriod;