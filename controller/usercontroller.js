import { compare, hash } from "bcrypt";
import Customer from "../models/Customer.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const createToken = async (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET);
  return token;
};
const loginUser = async (req, res) => {
  try {
    console.log("1");
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log("2");
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user in the database
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success:false, message: "Invalid email or password" });
    }

    // Respond with success
    const token = await createToken(user._id);
    return res.status(200).json({ success:true, message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      message: "An error occurred during login. Please try again later.",
    });
  }
};

const registerUser = async (req, res) => {
  try {
    console.log("1");
    
    const { name, password, email } = req.body; // Extract query parameters

    // Validate input
    if (!email || !password || !name) {
      console.log("2");
      return res
        .status(400)
        .json({ error: "All fields are required: name, email, password" });
    }

    // Check if the email is already in use
    const exists = await Customer.findOne({ email });
    if (exists) {
      console.log("3");
      return res.status(200).json({ success:false , message: "User already exists" });
    }

    // Validate password length
    if (password.length < 8) {
      console.log("5");
      return res
        .status(400)
        .json({ success:false, message: "Password must be at least 8 characters long" });
    }
    console.log("6");
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await hash(password, saltRounds);
    console.log("7");
    // Create the new user object
    const newUser = {
      name,
      email,
      password: hashedPassword,
    };
    console.log("8");
    // Save the user to the database
    const result = await Customer.create(newUser);

    //Creating Token
    const token = await createToken(result._id);
    console.log("9");
    // Respond with success
    return res.status(201).json({
      success:true,
      message: "User registered successfully",
      userId: result._id,
      token,
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ error: "An error occurred while registering the user" });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if email and password match with the ones in .env
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Create JWT token

      const id = email + password;

      const token = await createToken(id);

      return res.status(200).json({ success: "true", token });
    } else {

      return res
        .status(401)
        .json({ success: "false", message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error during admin login:", error);

    return res
      .status(500)
      .json({
        message:
          "An error occurred during admin login. Please try again later.",
      });
  }
};

export { loginUser, registerUser, adminLogin };
