const CFonts = require('cfonts');

const showWelcomeMessage = () => {
  CFonts.say('OpenKeystone', {
    font: 'chrome',
    colors: ['cyan', 'yellow', '#00ff15'],
    letterSpacing: 1,
    lineHeight: 1,
    space: true,
    maxLength: '0',
  });
  console.log("Answer a few questions and we'll generate a starter project for you.\n");
};
module.exports = { showWelcomeMessage };
