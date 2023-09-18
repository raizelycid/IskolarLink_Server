const express = require('express');

const app = express();

const db = require('./models');

const cors = require('cors');

app.use(cors());
app.use(express.json());

// Routes
const usersRouter = require('./routes/Users');
app.use('/auth', usersRouter);
const studentsRouter = require('./routes/Students');
app.use('/students', studentsRouter);
const cosoa_annRouter = require('./routes/COSOA_ANN');
app.use('/cosoa_ann', cosoa_annRouter);
const org_appdocs = require('./routes/Application_Docs');
app.use('/appdocs', org_appdocs);
const orgRouter = require('./routes/Organization');
app.use('/org', orgRouter);
const org_appRouter = require('./routes/Org_Application');
app.use('/org_app', org_appRouter);

db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log('Server running on port 3001');
  });
});
