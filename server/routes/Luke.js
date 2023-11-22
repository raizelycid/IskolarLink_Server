const express = require('express');
const router = express.Router();
const { Users, Students, Organization, Advisers, Org_Application,Requirements } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const validateToken = require('../middleware/AuthMiddleware');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');

router.post('/register', async (req, res) => {
    const students = req.body; // Expecting an array of students

    try {
        // Map each student to a promise of creating user and student records
        const creationPromises = students.map(async (studentData) => {
            const { email, password, student_num, student_Lname, student_Fname, student_Mname, student_suffix, department, year_level } = studentData;

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await Users.create({
                email: email,
                password: hashedPassword,
                role: 'student',
            });

            return Students.create({
                student_num: student_num,
                student_Lname: student_Lname,
                student_Fname: student_Fname,
                student_Mname: student_Mname,
                student_suffix: student_suffix,
                department: department,
                year_level: year_level,
                is_verified: false,
                is_cosoa: false,
                is_web_admin: false,
                userId: user.id
            });
        });

        // Wait for all the student records to be created
        await Promise.all(creationPromises);

        res.json(`Students created successfully!`);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.json(`A student number already exists in the submitted data!`);
        } else {
            res.json(err.message);
        }
    }
});

router.post('/addorg', validateToken, async (req, res) => {
    const { orgName, jurisdiction, subjurisdiction, orgType, advisers, id, student_id} = req.body;
    try {
        const organization = await Organization.create({
            org_name: orgName,
            jurisdiction: jurisdiction,
            subjurisdiction: subjurisdiction,
            type: orgType,
            is_accredited: false,
            application_status: 'Accreditation',
            org_status: 'Pending',
            membership_period: false,
            userId: id,
        });

        const orgId = organization.id;

        const org_application = await Org_Application.create({
            studentId: student_id,
            orgId: orgId,
            application_status: 'Pending',
        });

        // convert advisers to array
        let advisers_array = advisers.split(',');
        
        // Create Adviser for Each Adviser
        for (let i = 0; i < advisers_array.length; i++){
            await Advisers.create({
                adviser_name: advisers_array[i],
                orgId: orgId
            });
        }
        if (!fs.existsSync(`./org_applications/accreditation/${orgId}`)){
            fs.mkdirSync(`./org_applications/accreditation/${orgId}`);
        }

        const Forms = ['AD001','AD002','AD003','AD004','AD004X','AD005','AD006','AD007','AD009','AF001'];

        for (let i = 0; i < Forms.length; i++){
            await Requirements.create({
                orgId: orgId,
                requirement_name: Forms[i],
                requirement: Forms[i] + '.pdf',
            });
        }

        res.json(`Organization ${orgName} created successfully!`);
        
    } catch (err) {
        res.json(err);
        console.log(err);
    }
});


router.post('/accredit', validateToken, async (req, res) => {
    const { orgId} = req.body;

    //find the latest org_application of the org
    const org_application = await Org_Application.findOne({
        where: {
            orgId: orgId
        },
        order: [
            ['createdAt', 'DESC']
        ]
    });

    const reqs = await Requirements.findAll({
        where: {
            orgId: org_application.orgId
        }
    });

    //Approve all requirements
    for (let i = 0; i < reqs.length; i++){
        await Requirements.update({ status: 'Approved' }, {
            where: {
                id: reqs[i].id
            }
        });
    }

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


    let pos = 'Chairperson';
    let cosoa_id = "1";
    
    if (pos === 'Chairperson' || pos === 'Chairperson (Asst.)'){
        try{
            // If org.application_status is Accreditation, update to Accredited else update to Revalidated
            if (organization.application_status === 'Accreditation'){
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_id,
                    application_status: 'Accredited'
                })
                await Organization.update({ socn: new_socn, application_status: 'Accredited', org_status: 'Active', is_accredited: true}, {
                    where: {
                        id: org_id
                    }
                });
                res.json(`The organization ${organization.org_name} is now accredited!`)
                
            }else if (organization.application_status === 'Revalidation'){
                console.log('Revalidation')
                await Org_Application.create({
                    cosoaId: cosoa_id,
                    studentId: org_application.studentId,
                    orgId: org_id,
                    application_status: 'Revalidated'
                })
                await Organization.update({ socn: new_socn, application_status: 'Revalidated', org_status: 'Active', is_accredited: true }, {
                    where: {
                        id: org_id
                    }
                });
                res.json(`The organization ${organization.org_name} is now revalidated!`)
            }

        }catch(err){
            console.log(err);
            res.json(err);
        }
    }else{
        res.json({error: `You are not authorized to update the Application!`});
    }
});


router.post('/add_org', async (req, res) => {
    const {email, password,orgId} = req.body;
    try{
        await bcrypt.hash(password, 10).then((hash) => {
            const user = Users.create({
                email: email,
                password: hash,
                role: 'organization',
            }).then((user) => {
                const userId = user.id;
                Organization.update({
                    userId: userId,
                },{
                    where: {
                        id: orgId,
                    }
                });
            });
        });

        
        res.json('User created!');
    }catch(err){
        res.json(err);
    }
});


module.exports = router;
