const AWS = require("aws-sdk");
const crypto = require("crypto");
const cognito = require("../config/cognitoConfig");

// 🔹 Function to generate SECRET_HASH
const calculateSecretHash = (email) => {
    const message = email + process.env.COGNITO_CLIENT_ID;
    return crypto
        .createHmac("sha256", process.env.COGNITO_CLIENT_SECRET)
        .update(message)
        .digest("base64");
};

// 🔹 Signup (Register User)
exports.signUp = async (req, res) => {
    const { email, password } = req.body;

    const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email, // 👈 Use email directly
        Password: password,
        UserAttributes: [{ Name: "email", Value: email }],
        SecretHash: calculateSecretHash(email),
    };

    try {
        await cognito.signUp(params).promise();
        res.status(200).json({ message: "✅ User registered successfully! Please verify your OTP." });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 🔹 Login User
exports.login = async (req, res) => {
    const { email, password } = req.body;

    const params = {
        AuthFlow: "ADMIN_NO_SRP_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID,
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        AuthParameters: {
            USERNAME: email,  // 👈 Cognito expects USERNAME, but we pass email
            PASSWORD: password,
            SECRET_HASH: calculateSecretHash(email),
        },
    };

    try {
        const response = await cognito.adminInitiateAuth(params).promise();
        res.status(200).json({ token: response.AuthenticationResult.IdToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 🔹 Verify OTP
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    const params = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email, // 👈 Ensure email is used
        ConfirmationCode: otp,
        SecretHash: calculateSecretHash(email),
    };

    try {
        await cognito.confirmSignUp(params).promise();
        res.status(200).json({ message: "✅ OTP verified successfully!" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
