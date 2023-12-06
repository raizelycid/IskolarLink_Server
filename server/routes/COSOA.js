const express = require('express');
const router = express.Router();
const { COSOA_Members, Org_Application, Organization, Application_Period, Requirements } = require('../models');
const validateToken = require('../middleware/AuthMiddleware');
const { Op, Sequelize } = require('sequelize');
const cookieParser = require('cookie-parser');
const cors = require('cors');

router.use(cors(
    {
        origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app'],
        credentials: true
    }
));


const Acronyms = {
    'College of Accountancy and Finance': 'CAF',
    'College of Architecture, Design, and Built Environment': 'CADBE',
    'College of Arts and Letters': 'CAL',
    'College of Business Administration': 'CBA',
    'College of Communication': 'COC',
    'College of Computer and Information Sciences': 'CCIS',
    'College of Education': 'COED',
    'College of Engineering': 'CE',
    'College of Human Kinetics': 'CHK',
    'College of Law': 'CL',
    'College of Political Science and Public Administration': 'CPSPA',
    'College of Social Sciences and Development': 'CSSD',
    'College of Science': 'CS',
    'College of Tourism, Hospitality, and Transportation Management': 'CTHTM',
    'Institute of Technology': 'ITECH',
    'Open University System': 'OUS',
    'Graduate School': 'GS',
    'Senior High School': 'SHS'
}

// Add a COSOA member and determine the position
router.post('/:studentId', validateToken, async (req, res) => {
    // Find first if the user is the chairperson
    const chairperson = await COSOA_Members.findOne({
        where: {
            position: 'Chairperson'
        }
    });
    if (chairperson.studentId === req.decoded.student_id){
        try{
            const studentId = req.params.studentId;
            const { position } = req.body;
            if (req.decoded.is_web_admin === false){
                res.json(`You are not authorized to add COSOA members!`);
            }else{
                try{
                    const cosoa_member = await COSOA_Members.create({
                        position: position,
                        studentId: studentId
                    });
                    res.json(`COSOA member added!`);
                }catch(err){
                    res.json(err);
                }
            }
        }catch(err){
            res.json(err);
        }
    }else{
        res.json(`You are not authorized to add COSOA members!`);
    }
});

// Update an Org_Application application_status to IE2
router.post('/ie2/:org_applicationId', validateToken, async (req, res) => {
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    const org_application = await Org_Application.findOne({
        where: {
            id: req.params.org_applicationId
        }
    });
    const reqs = await Requirements.findAll({
        where: {
            orgId: org_application.orgId
        }
    });
    // if all the status of requirements is not 'Approved', then return an error
    let isApproved = true;
    for (let i = 0; i < reqs.length; i++){
        if (reqs[i].status !== 'Approved'){
            isApproved = false;
        }
    }
    if (isApproved === false){
        res.json({error: `Not all requirements are approved!`});
    }else{
    const org_student_id = org_application.studentId;
    const org_org_id = org_application.orgId;
    if (pos === 'Chairperson' || pos === 'Vice Chairperson' || pos === 'General Staff'){
        try{
            const org_applicationId = req.params.org_applicationId;
            await Org_Application.create({
                cosoaId: cosoa_id,
                studentId: org_student_id,
                orgId: org_org_id,
                application_status: 'IE2'
            });

            // Reset all the requirements' status to Pending
            await Requirements.update({
                status: 'Pending'
            }, {
                where: {
                    orgId: org_org_id
                }
            });
            res.json(`Org Application with id ${org_applicationId} is now in Initial Evaluation 2!`);
        }catch(err){
            res.json(err);
        }
    }else{
        res.json({error: `You are not authorized to update the Application!`});
    }
}
});

router.post('/ie1/:org_applicationId/:requirementId', validateToken, async (req, res) => {
    const { feedback, all } = req.body;
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    const { org_applicationId, requirementId } = req.params;
    const org_application = await Org_Application.findOne({
        where: {
            id: org_applicationId
        }
    });
    if (pos === 'Chairperson' || pos === 'Vice Chairperson' || pos === 'General Staff'){
        try{
            if(feedback){
                await Requirements.update({
                    status:'Revision',
                    remarks: feedback
                },{
                    where: {
                        id: requirementId
                    }
                });
                if(org_application.feedback !== 'Revision'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_application.orgId,
                    application_status: 'IE1',
                    feedback: 'Revision'
                });
                }
                res.json(`Successfully returned the application with id ${org_applicationId}!`);
            }else{
                //if all is true, update all the requirements' status to Approved
                if(all){
                    await Requirements.update({
                        status:'Approved'
                    },{
                        where: {
                            orgId: org_application.orgId
                        }
                    })

                    if(org_application.application_status !== 'IE1'){
                    await Org_Application.create({
                        cosoaId: cosoa_id,
                        studentId: org_application.studentId,
                        orgId: org_application.orgId,
                        application_status: 'IE1',
                    });
                }

                    res.json(`Successfully approved all the requirements!`);
                }else{
                await Requirements.update({
                    status:'Approved'
                },{
                    where: {
                        id: requirementId
                    }
                })

                if(org_application.application_status !== 'IE1'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_application.orgId,
                    application_status: 'IE1',
                });
            }

                res.json(`Successfully approved the requirement with id ${requirementId}!`);
            }}}catch(err){
                res.json(err);
            }
        }
    });

    router.post('/ie2/:org_applicationId/:requirementId', validateToken, async (req, res) => {
    const { feedback, all } = req.body;
    console.log(all)

    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    const { org_applicationId, requirementId } = req.params;
    const org_application = await Org_Application.findOne({
        where: {
            id: org_applicationId
        }
    });
    if (pos === 'Chairperson' || pos === 'Vice Chairperson' || pos === 'General Staff'){
        try{
            if(feedback){
                await Requirements.update({
                    status:'Revision',
                    remarks: feedback
                },{
                    where: {
                        id: requirementId
                    }
                });
                if(org_application.feedback !== 'Revision'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_application.orgId,
                    application_status: 'IE1',
                    feedback: 'Revision'
                });
                }
                res.json(`Successfully returned the application with id ${org_applicationId}!`);
            }else{
                //if all is true, update all the requirements' status to Approved
                if(all){
                    await Requirements.update({
                        status:'Approved'
                    },{
                        where: {
                            orgId: org_application.orgId
                        }
                    })

                    if(org_application.application_status !== 'IE1'){
                    await Org_Application.create({
                        cosoaId: cosoa_id,
                        studentId: org_application.studentId,
                        orgId: org_application.orgId,
                        application_status: 'IE1',
                    });
                }

                    res.json(`Successfully approved all the requirements!`);
            }else{
                await Requirements.update({
                    status:'Approved'
                },{
                    where: {
                        id: requirementId
                    }
                })

                if(org_application.application_status !== 'IE1'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_application.orgId,
                    application_status: 'IE1',
                });
            }

                res.json(`Successfully approved the requirement with id ${requirementId}!`);
            }
        }
            }catch(err){
                res.json(err);
            }
        }
    });


// Update an Org_Application application_status to FE1
router.post('/fe1/:org_applicationId', validateToken, async (req, res) => {
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    
    const org_application = await Org_Application.findOne({
        where: {
            id: req.params.org_applicationId
        }
    });

    const reqs = await Requirements.findAll({
        where: {
            orgId: org_application.orgId
        }
    });
    // if all the status of requirements is not 'Approved', then return an error
    let isApproved = true;
    for (let i = 0; i < reqs.length; i++){
        if (reqs[i].status !== 'Approved'){
            isApproved = false;
        }
    }
    if (isApproved === false){
        res.json({error: `Not all requirements are approved!`});
    }else{
    const org_student_id = org_application.studentId;
    const org_org_id = org_application.orgId;
    if (pos === 'Chairperson' || pos === 'Vice Chairperson' || pos === 'Document Management'){
        try{
            const org_applicationId = req.params.org_applicationId;
            await Org_Application.create({
                cosoaId: cosoa_id,
                studentId: org_student_id,
                orgId: org_org_id,
                application_status: 'FE1'
            })
            await Requirements.update({
                status: 'Pending'
            }, {
                where: {
                    orgId: org_org_id
                }
            });
            res.json(`Org Application with id ${org_applicationId} is now in Final Evaluation 1!`);
        }catch(err){
            res.json(err);
        }
    }else{
        res.json({error: `You are not authorized to update the Application!`});
    }
}
});

router.post('/fe1/:org_applicationId/:requirementId', validateToken, async (req, res) => {
    const { feedback, all } = req.body;
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    const { org_applicationId, requirementId } = req.params;
    const org_application = await Org_Application.findOne({
        where: {
            id: org_applicationId
        }
    });
    if (pos === 'Chairperson' || pos === 'Vice Chairperson' || pos === 'Document Management'){
        try{
            if(feedback){
                await Requirements.update({
                    status:'Revision',
                    remarks: feedback
                },{
                    where: {
                        id: requirementId
                    }
                });
                if(org_application.feedback !== 'Revision'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_application.orgId,
                    application_status: 'IE2',
                    feedback: 'Revision'
                });
                }
                res.json(`Successfully returned the application with id ${org_applicationId}!`);
            }else{
                //if all is true, update all the requirements' status to Approved
                if(all){
                    await Requirements.update({
                        status:'Approved'
                    },{
                        where: {
                            orgId: org_application.orgId
                        }
                    })

                    if(org_application.application_status !== 'IE2'){
                    await Org_Application.create({
                        cosoaId: cosoa_id,
                        studentId: org_application.studentId,
                        orgId: org_application.orgId,
                        application_status: 'IE2',
                    });
                }

                    res.json(`Successfully approved all the requirements!`);
            }else{
                await Requirements.update({
                    status:'Approved'
                },{
                    where: {
                        id: requirementId
                    }
                })

                res.json(`Successfully approved the requirement with id ${requirementId}!`);
            }
        }
            }catch(err){
                res.json(err);
            }
        }
    });

// Update an Org_Application application_status to FE2
router.post('/fe2/:org_applicationId', validateToken, async (req, res) => {
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    
    const org_application = await Org_Application.findOne({
        where: {
            id: req.params.org_applicationId
        }
    });

    const reqs = await Requirements.findAll({
        where: {
            orgId: org_application.orgId
        }
    });
    // if all the status of requirements is not 'Approved', then return an error
    let isApproved = true;
    for (let i = 0; i < reqs.length; i++){
        if (reqs[i].status !== 'Approved'){
            isApproved = false;
        }
    }
    if (isApproved === false){
        res.json({error: `Not all requirements are approved!`});
    }else{
    const org_student_id = org_application.studentId;
    const org_org_id = org_application.orgId;
    if (pos === 'Chairperson' || pos === 'Vice Chairperson' || pos === 'Vice Chairperson (Asst.)' || pos === 'Executive Director' || pos === 'External Affairs' || pos === 'Internal Affairs'){
        try{
            const org_applicationId = req.params.org_applicationId;
            await Org_Application.create({
                cosoaId: cosoa_id,
                studentId: org_student_id,
                orgId: org_org_id,
                application_status: 'FE2'
            });
            await Requirements.update({
                status: 'Pending'
            }, {
                where: {
                    orgId: org_org_id
                }
            });
            res.json(`Org Application with id ${org_applicationId} is now in Final Evaluation 2!`);
        }catch(err){
            res.json(err);
        }
    }else{
        res.json({error: `You are not authorized to update the Application!`});
    }
}
});

router.post('/fe2/:org_applicationId/:requirementId', validateToken, async (req, res) => {
    const { feedback, all } = req.body;
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    const { org_applicationId, requirementId } = req.params;
    const org_application = await Org_Application.findOne({
        where: {
            id: org_applicationId
        }
    });
    if (pos === 'Chairperson' || pos === 'Vice Chairperson' || pos === 'Vice Chairperson (Asst.)' || pos === 'Executive Director' || pos === 'External Affairs' || pos === 'Internal Affairs'){
        try{
            if(feedback){
                await Requirements.update({
                    status:'Revision',
                    remarks: feedback
                },{
                    where: {
                        id: requirementId
                    }
                });
                if(org_application.feedback !== 'Revision'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_application.orgId,
                    application_status: 'FE1',
                    feedback: 'Revision'
                });
                }
                res.json(`Successfully returned the application with id ${org_applicationId}!`);
            }else{
                //if all is true, update all the requirements' status to Approved
                if(all){
                    await Requirements.update({
                        status:'Approved'
                    },{
                        where: {
                            orgId: org_application.orgId
                        }
                    })

                    if(org_application.application_status !== 'FE1'){
                    await Org_Application.create({
                        cosoaId: cosoa_id,
                        studentId: org_application.studentId,
                        orgId: org_application.orgId,
                        application_status: 'FE1',
                    });
                }

                    res.json(`Successfully approved all the requirements!`);
            }else{

                await Requirements.update({
                    status:'Approved'
                },{
                    where: {
                        id: requirementId
                    }
                })

                res.json(`Successfully approved the requirement with id ${requirementId}!`);
            }
        }
            }catch(err){
                res.json(err);
            }
        }
    });

// Update an Org_Application application_status to Accredited/Revalidated
router.post('/accredit/:org_applicationId', validateToken, async (req, res) => {

    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    console.log("FINDING ORG APPLICATION")
    const org_application = await Org_Application.findOne({
        where: {
            id: req.params.org_applicationId
        }
    });
    console.log("FOUND. FINDING ORGANIZATION")
    const org = await Organization.findOne({
        where: {
            id: org_application.orgId
        }
    });

    const reqs = await Requirements.findAll({
        where: {
            orgId: org_application.orgId
        }
    });
    // if all the status of requirements is not 'Approved', then return an error
    let isApproved = true;
    for (let i = 0; i < reqs.length; i++){
        if (reqs[i].status !== 'Approved'){
            isApproved = false;
        }
    }
    if (isApproved === false){
        res.json({error: `Not all requirements are approved!`});
    }else{

    let academic_year = new Date().getFullYear();
    let academic_year2 = new Date().getFullYear() + 1;
    let academic_year3 = academic_year.toString().slice(-2) + academic_year2.toString().slice(-2);
    const latest_org = await Organization.findOne({
        attributes: [
            [Sequelize.fn('MAX', Sequelize.cast(Sequelize.fn('substring', Sequelize.col('socn'), 6, 9), 'SIGNED')), 'latest_socn']
        ],
        where: {
            socn: {
                [Op.like]: `${academic_year3}%`
            }
        }
    });

    let latest_socn = latest_org.dataValues.latest_socn + 1;
    latest_socn = latest_socn.toString();
    while (latest_socn.length < 3){
        latest_socn = '0' + latest_socn;
    }
    let new_socn = academic_year3 + '-' + latest_socn;

    const org_id = org_application.orgId;

    const organization = await Organization.findOne({
        where: {
            id: org_id
        }
    });

    const status = organization.application_status;

    if (status === 'Accreditation'){
        new_socn = new_socn + '-A';
    }else{
        new_socn = new_socn + '-R';
    }

    if(organization.jurisdiction !== 'University-Wide Student Organization'){
    const sub_jurisdiction = organization.subjurisdiction;
    const sub_jurisdiction2 = sub_jurisdiction.split('|');
    const sub_jurisdiction3 = sub_jurisdiction2[1].trim();

    new_socn = new_socn + '-' + sub_jurisdiction3;
    }else{
        new_socn = new_socn + '-' + 'U-WIDE';
    }

    const cosoa_id = cosoa_member.id;
    const org_student_id = org_application.studentId;
    const org_org_id = org_application.orgId;
    const pos = cosoa_member.position;
    
    if (pos === 'Chairperson' || pos === 'Chairperson (Asst.)'){
        try{
            console.log(org.application_status)
            // If org.application_status is Accreditation, update to Accredited else update to Revalidated
            if (org.application_status === 'Accreditation'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_student_id,
                    orgId: org_org_id,
                    application_status: 'Accredited'
                })
                await Organization.update({ socn: new_socn, application_status: 'Accredited', org_status: 'Active', is_accredited: true}, {
                    where: {
                        id: org_org_id
                    }
                });
                res.json(`The organization ${org.org_name} is now accredited!`)
                
            }else if (org.application_status === 'Revalidation'){
                console.log('Revalidation')
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_student_id,
                    orgId: org_org_id,
                    application_status: 'Revalidated'
                })
                await Organization.update({ socn: new_socn, application_status: 'Revalidated', org_status: 'Active', is_accredited: true }, {
                    where: {
                        id: org_org_id
                    }
                });
                res.json(`The organization ${org.org_name} is now revalidated!`)
            }

        }catch(err){
            console.log(err);
            res.json(err);
        }
    }else{
        res.json({error: `You are not authorized to update the Application!`});
    }
}
});

router.post('/acc/:org_applicationId/:requirementId', validateToken, async (req, res) => {
    const { feedback, all } = req.body;
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    const { org_applicationId, requirementId } = req.params;
    const org_application = await Org_Application.findOne({
        where: {
            id: org_applicationId
        }
    });
    if (pos === 'Chairperson' || pos === 'Chairperson (Asst.)'){
        try{
            if(feedback){
                await Requirements.update({
                    status:'Revision',
                    remarks: feedback
                },{
                    where: {
                        id: requirementId
                    }
                });
                if(org_application.feedback !== 'Revision'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_application.orgId,
                    application_status: 'FE2',
                    feedback: 'Revision'
                });
                }
                res.json(`Successfully returned the application with id ${org_applicationId}!`);
            }else{
                //if all is true, update all the requirements' status to Approved
                if(all){
                    await Requirements.update({
                        status:'Approved'
                    },{
                        where: {
                            orgId: org_application.orgId
                        }
                    })

                    if(org_application.application_status !== 'FE2'){
                    await Org_Application.create({
                        cosoaId: cosoa_id,
                        studentId: org_application.studentId,
                        orgId: org_application.orgId,
                        application_status: 'FE2',
                    });
                }

                    res.json(`Successfully approved all the requirements!`);
            }else{
                await Requirements.update({
                    status:'Approved'
                },{
                    where: {
                        id: requirementId
                    }
                })

                res.json(`Successfully approved the requirement with id ${requirementId}!`);
            }
        }
            }catch(err){
                res.json(err);
            }
        }
    });


router.get('/application_period', async (req, res) => {
    try{
        const application_period = await Application_Period.findOne({
            where: {
                id: 1
            }
        });
        res.json(application_period);
    }catch(err){
        res.json(err);
    }
});


router.put('/application_period', validateToken, async (req, res) => {
    try{
        if(!req.decoded.student_id){
            res.json(`You are not authorized to update the Application Period!`)
        }else{
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    if(!cosoa_member){
        return res.json(`You are not authorized to update the Application Period!`)
    }else{
    const application_period = await Application_Period.findOne({
        where: {
            id: 1
        }
    });
    const period = application_period.application_period;
    const pos = cosoa_member.position;
    if (pos === 'Chairperson' || pos === 'Vice Chairperson'){
        try{
            const { application_period } = req.body;
            if (period === false){
                await Application_Period.update({ application_period: true }, {
                    where: {
                        id: 1
                    }
                });
                console.log(`Application Period updated to true!`);
                // Update all orgs' application_status to Revalidation, org_status to Pending, is_accredited to false
                await Organization.update({ application_status: 'Revalidation', org_status: 'Pending', is_accredited: false, membership_period: false }, {
                    where: {
                        is_accredited: true
                    }
                });
                res.json({success:`Application Period updated to true!`, period: true});
            }else if (period === true){
                await Application_Period.update({ application_period: false }, {
                    where: {
                        id: 1
                    }
                });
                res.json({success:`Application Period updated to false!`, period: false});
            }
        }catch(err){
            res.json(err);
        }
    }else{
        res.json(`You are not authorized to update the Application Period!`);
    }
}
}
}catch(err){
    res.json(err);
}
});

router.get('/test/:org_applicationId',async (req, res) => {
    const org_applicationId = req.params.org_applicationId;
    let academic_year = new Date().getFullYear();
    let academic_year2 = new Date().getFullYear() + 1;
    let academic_year3 = academic_year.toString().slice(-2) + academic_year2.toString().slice(-2);
    const org = await Organization.findOne({
        attributes: [
            [Sequelize.fn('MAX', Sequelize.cast(Sequelize.fn('substring', Sequelize.col('socn'), 6, 9), 'SIGNED')), 'latest_socn']
        ],
        where: {
            socn: {
                [Op.like]: `${academic_year3}%`
            }
        }
    });

    // Convert the latest_socn to string (if 1 then 001, if 21 then 021)
    let latest_socn = org.dataValues.latest_socn + 1;
    latest_socn = latest_socn.toString();
    // Add 0s if the length of the latest_socn is less than 3
    while (latest_socn.length < 3){
        latest_socn = '0' + latest_socn;
    }
    let new_socn = academic_year3 + '-' + latest_socn;

    const org_application = await Org_Application.findOne({
        where: {
            id: org_applicationId
        }
    });

    const org_id = org_application.orgId;

    const organization = await Organization.findOne({
        where: {
            id: org_id
        }
    });

    const status = organization.application_status;

    if (status === 'Accreditation'){
        new_socn = new_socn + '-A';
    }else{
        new_socn = new_socn + '-R';
    }

    if(organization.jurisdiction !== 'University-Wide Student Organization'){
    const sub_jurisdiction = organization.subjurisdiction;
    const sub_jurisdiction2 = sub_jurisdiction.split('|');
    const sub_jurisdiction3 = sub_jurisdiction2[1].trim();

    new_socn = new_socn + '-' + sub_jurisdiction3;
    }else{
        new_socn = new_socn + '-' + 'U-WIDE';
    }

    res.json(new_socn);

});

router.post('/feedback/:org_applicationId', validateToken, async (req, res) => {
    const { feedback } = req.body;
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const pos = cosoa_member.position;
    const cosoa_id = cosoa_member.id;
    const org_application = await Org_Application.findOne({
        where: {
            id: req.params.org_applicationId
        }
    });
    const org_org_id = org_application.orgId;
    //if pos is not null
    if (pos != null){
        try{
            const org_applicationId = req.params.org_applicationId;
            await Org_Application.create({
                cosoaId: cosoa_id,
                orgId: org_org_id,
                studentId: org_application.studentId,
                application_status: org_application.application_status,
                feedback: feedback,
            })
            res.json(`Org Application with id ${org_applicationId} is now returned with Feedback!`);
        }catch(err){
            res.json(err);
        }
    }else{
        res.json(`You are not authorized to update Org Applications!`);
    }
});

router.post('/reject/:org_applicationId', validateToken, async (req, res) => {
    const cosoa_member = await COSOA_Members.findOne({
        where: {
            studentId: req.decoded.student_id
        }
    });
    const org_application = await Org_Application.findOne({
        where: {
            id: req.params.org_applicationId
        }
    });
    //if pos is not null
    if (cosoa_member){
        try{
            const org = await Organization.findOne({
                where:{id:org_application.orgId}
            })
            org.destroy()
            res.json({success: "Organization has been rejected"});
        }catch(err){
            res.json(err);
        }
    }else{
        res.json(`You are not authorized to update Org Applications!`);
    }
});

module.exports = router;

