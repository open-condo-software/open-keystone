const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const Mailgun = require('mailgun-js');

const sendEmail = async (templatePath, rendererProps, options) => {
  if (!templatePath) {
    throw new Error('No template path provided');
  }

  const { domain, apiKey, subject, to, from, ...mailData } = options || {};

  if (!domain || !apiKey || !subject || !to || !from) {
    throw new Error('Missing required mail options: domain, apiKey, subject, to, from');
  }

  const template = require(path.join(__dirname, templatePath));
  const html = renderToStaticMarkup(React.createElement(template, rendererProps));

  const mailgun = Mailgun({ apiKey, domain });

  return mailgun.messages().send({
    ...mailData,
    from,
    to,
    subject,
    html,
  });
};

module.exports = {
  sendEmail,
};
