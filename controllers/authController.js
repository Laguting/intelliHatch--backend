const admin = require('firebase-admin');
const { database, ref, set } = require('../config/firebase');

// Utility function to map a username to a secure virtual email
function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@intellihatch.local`;
}

// Password validation check
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required.' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }

  // Check for at least one letter
  const hasLetter = /[a-zA-Z]/.test(password);
  // Check for at least one number
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: 'Password must contain both letters and numbers.' };
  }

  return { isValid: true };
}

// Controller methods
const authController = {
  // Sign up a new user
  async signup(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Username is required.'
        });
      }

      const cleanUsername = username.trim();
      if (cleanUsername.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Username must be at least 3 characters long.'
        });
      }

      // Check if username has invalid characters (e.g. spaces, special chars)
      if (/\s/.test(cleanUsername)) {
        return res.status(400).json({
          success: false,
          error: 'Username must not contain spaces.'
        });
      }

      // Validate Password
      const passValidation = validatePassword(password);
      if (!passValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: passValidation.message
        });
      }

      const email = usernameToEmail(cleanUsername);

      // Create the user in Firebase Auth using the Admin SDK
      let userRecord;
      try {
        userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: cleanUsername
        });
      } catch (authError) {
        console.error('[Firebase Auth Error] code:', authError.code, 'message:', authError.message);
        if (authError.code === 'auth/email-already-exists') {
          return res.status(400).json({
            success: false,
            error: 'Username is already taken.'
          });
        }
        return res.status(400).json({
          success: false,
          error: authError.message || 'Failed to create user in Firebase Auth.'
        });
      }

      // Save additional user details in Firebase Realtime Database
      if (database) {
        try {
          await set(ref(database, `/users/${userRecord.uid}`), {
            username: cleanUsername,
            email: email,
            createdAt: new Date().toISOString()
          });
        } catch (dbError) {
          console.warn('[Firebase DB Error] Could not write user details to database:', dbError.message);
          // Don't fail the signup if just the DB profile creation fails (user is already created in Auth)
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Account created successfully! You can now log in.'
      });

    } catch (err) {
      console.error('[Signup Controller Error]:', err);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred during signup.'
      });
    }
  },

  // Log in an existing user
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required.'
        });
      }

      const cleanUsername = username.trim();
      const email = usernameToEmail(cleanUsername);

      // Enforce invalid input checks for password on login request
      const passValidation = validatePassword(password);
      if (!passValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: passValidation.message
        });
      }

      // Firebase Authentication Sign In REST endpoint
      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        console.error('[Auth Config Error] FIREBASE_API_KEY is not defined in .env.');
        return res.status(500).json({
          success: false,
          error: 'Firebase is not properly configured on this server.'
        });
      }

      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

      const response = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error?.message || '';
        console.error('[Firebase Sign-In Error Response]:', errorMsg);

        // Map Firebase technical errors to user-friendly notifications
        let clientError = 'Incorrect username or password.';
        if (errorMsg.includes('EMAIL_NOT_FOUND')) {
          clientError = 'Username not found. Please sign up first.';
        } else if (errorMsg.includes('INVALID_PASSWORD') || errorMsg.includes('INVALID_LOGIN_CREDENTIALS')) {
          clientError = 'Incorrect password. Please try again.';
        } else if (errorMsg.includes('USER_DISABLED')) {
          clientError = 'This user account has been disabled.';
        } else if (errorMsg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
          clientError = 'Too many login attempts. Access is temporarily locked. Please try again later.';
        }

        return res.status(400).json({
          success: false,
          error: clientError
        });
      }

      // Login successful!
      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token: data.idToken,
        localId: data.localId,
        username: cleanUsername
      });

    } catch (err) {
      console.error('[Login Controller Error]:', err);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred during login.'
      });
    }
  }
};

module.exports = authController;
