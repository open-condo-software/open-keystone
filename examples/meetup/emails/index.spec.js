jest.mock('mailgun-js', () => {
  const send = jest.fn().mockResolvedValue({ id: 'queued' });
  const messages = jest.fn(() => ({ send }));
  return jest.fn(() => ({ messages }));
});

const Mailgun = require('mailgun-js');
const { sendEmail } = require('./index');

describe('meetup email sender', () => {
  test('smoke: renders meetup template and sends with mailgun', async () => {
    await sendEmail(
      'password-updated.jsx',
      {
        recipientEmail: 'user@example.com',
        signinUrl: 'http://localhost:3000/signin',
      },
      {
        subject: 'Your password has been updated',
        to: 'user@example.com',
        from: 'no-reply@example.com',
        domain: 'mg.example.com',
        apiKey: 'key-test',
      }
    );

    expect(Mailgun).toHaveBeenCalledWith({ apiKey: 'key-test', domain: 'mg.example.com' });

    const mailgunClient = Mailgun.mock.results[0].value;
    const send = mailgunClient.messages.mock.results[0].value.send;

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'no-reply@example.com',
        to: 'user@example.com',
        subject: 'Your password has been updated',
        html: expect.stringContaining('Your password has been updated you can log in'),
      })
    );
  });
});
