import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const userAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access Denied. No token provided." });
    }
    const uid = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = uid.id;
    next();
  } catch (error) {
    req.json({ success: false, message: error.message });
  }
};

export default userAuth;
