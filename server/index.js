const express = require('express');

const app = express();

const db = require('./models');

const cors = require('cors');
const cookieParser = require('cookie-parser');


app.use(cors(
  {
    origin: ["http://localhost:3000"],
    credentials: true
  }
));
app.use(express.json());
app.use(cookieParser());

app.use(express.static('public'));
app.use(express.static('temp'));
app.use(express.static('org_applications'));


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

db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log('Server running on port 3001');
  });
});
