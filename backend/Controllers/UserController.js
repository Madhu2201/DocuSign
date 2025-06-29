import User from "../Models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'
import {sendRegistrationConfirmation} from '../Utils/mailer.js';
 import { sendResetEmail } from "../Utils/mailer.js";
export const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'System Admin',
        email: 'madhumathi2201@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};


export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'sender'
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );


    await sendRegistrationConfirmation(email, name);

    res.status(201).json({
      message: 'User registered and email sent',
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// export const assignRole = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { role } = req.body;

//     if (!['admin', 'sender', 'signer'].includes(role)) {
//       return res.status(400).json({ message: 'Invalid role' });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Only admins can assign roles' });
//     }

//     user.role = role;
//     await user.save();

//     res.json({ 
//       message: `User role updated to ${role}`,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const requestPasswordReset = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const token = crypto.randomBytes(32).toString('hex');
//     user.resetToken = token;
//     user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; 
//     await user.save();

//     await sendResetEmail(email, token);

//     res.json({ message: 'Reset link sent to email',token});
//   } catch (err) {
//     console.error('Error requesting password reset:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
// export const resetPassword = async (req, res) => {
//   const { token, newPassword } = req.body;

//   try {
//     const user = await User.findOne({
//       resetToken: token,
//       resetTokenExpiry: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     user.resetToken = undefined;
//     user.resetTokenExpiry = undefined;

//     await user.save();

//     res.json({ message: 'Password has been reset successfully' });
//   } catch (err) {
//     console.error('Error resetting password:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    await sendResetEmail(email, token);

    res.json({ message: 'Reset link sent to your email' });
  } catch (err) {
    console.error('Error requesting password reset:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req, res) => {
  // Just respond with success
  res.json({ message: 'Logout successful. Please remove the token on the client side.' });
};
