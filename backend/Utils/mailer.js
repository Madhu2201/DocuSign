import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendRegistrationConfirmation = async (email, name) => {
  try {
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Registration Successful',
      text: `Hello ${name},\n\nThank you for registering with our service. Your account has been successfully created.\n\nBest regards,\nYour App Team`
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};



export const sendResetEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/resetpassword?token=${token}`;

  const mailOptions = {
    from: '"Your App" <no-reply@yourapp.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>Hello,</p>
      <p>You requested to reset your password. Click the button below:</p>
      <p><a href="${resetLink}" style="padding:10px 20px;background:#007BFF;color:white;text-decoration:none;border-radius:5px;">Reset Password</a></p>
      <p>This link expires in 15 minutes. If you didn't request this, please ignore it.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};