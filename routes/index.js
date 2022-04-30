const landingPageApi = require('./landingPageApi');
const userEvents = require('./userEvents');
const createGameEvent = require('./createGameEvent');
const viewGameEvent = require('./viewGameEvent');
const user = require('./users');
const contactus = require('./contactus');
const comments =  require('./comments');

const constructorMethod = (app) => {
  app.use('/user', user);
  app.use('/contactus', contactus);
  app.use('/userEvents', userEvents)
  app.use('/createGameEvent', createGameEvent)
  app.use('/viewGameEvent', viewGameEvent)
  app.use('/comments', comments);
  app.use('/', landingPageApi);
};

module.exports = constructorMethod;