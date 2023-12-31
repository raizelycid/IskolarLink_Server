const express = require('express');

const app = express();

const db = require('./models');

const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

app.use(cors(
  {
    origin: ['http://localhost:3000', 'https://iskolarlink.netlify.app', 'https://iskolarlink.com'],
    credentials: true
  }
));

app.use(express.json());
app.use(cookieParser());

app.use(express.static('public'));
app.use(express.static('temp'));
app.use(express.static('org_applications'));
app.use(express.static('cor'))
app.use(express.static('templates'));

// Routes
const usersRouter = require('./routes/Users');
app.use('/auth', usersRouter);
const studentsRouter = require('./routes/Students');
app.use('/student', studentsRouter);
const cosoa_annRouter = require('./routes/COSOA_ANN');
app.use('/cosoa_ann', cosoa_annRouter);
const org_appdocs = require('./routes/Application_Docs');
app.use('/appdocs', org_appdocs);
const orgRouter = require('./routes/Organization');
app.use('/org', orgRouter);
const org_appRouter = require('./routes/Org_Application');
app.use('/org_app', org_appRouter);
const adminRouter = require('./routes/Admin');
app.use('/admin', adminRouter);
const cosoaRouter = require('./routes/COSOA');
app.use('/cosoa', cosoaRouter);
const menuRouter = require('./routes/Menu');
app.use('/menu', menuRouter);
const cosoa_dashboardRouter = require('./routes/COSOA_Dashboard');
app.use('/cosoa_dashboard', cosoa_dashboardRouter);
const requirementRouter = require('./routes/Requirement');
app.use('/requirement', requirementRouter);
const cosoa_profileRouter = require('./routes/COSOA_Profile');
app.use('/cosoa_profile', cosoa_profileRouter);
const org_portalRouter = require('./routes/Organization_Portal');
app.use('/org_portal', org_portalRouter);
const lukeRouter = require('./routes/Luke')
app.use('/luke', lukeRouter )
const studentPortalRouter = require('./routes/Student_Profile');
app.use('/student_portal', studentPortalRouter);
const accreditedOrgRouter = require('./routes/AccreditedOrg');
app.use('/accredited/org', accreditedOrgRouter);
const adminDashboardRouter = require('./routes/Admin_Dashboard');
app.use('/admin', adminDashboardRouter);
const membershipRouter = require('./routes/Membership');
app.use('/membership', membershipRouter);
const feedbackRouter = require('./routes/Feedback');
app.use('/feedback', feedbackRouter);
const cosoaMembers = require('./routes/COSOA_Members');
app.use('/cosoa_member', cosoaMembers)
const landingPage = require('./routes/LandingPage');
app.use('/landingpage', landingPage)
const mailing = require('./routes/Mailing');
app.use('/mailing', mailing)
const archive = require('./routes/Archive');
app.use('/archive', archive)

db.sequelize.sync().then(() => {
  app.listen(process.env.PORT || 3001, "0.0.0.0", () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
  });
});
