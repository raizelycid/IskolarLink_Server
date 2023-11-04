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

db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log('Server running on port 3001');
  });
});
