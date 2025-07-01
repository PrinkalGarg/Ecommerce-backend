import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const AdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.token;

    if (!token) {
     
      
      return res
        .status(401)
        .json({ message: "Access Denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const id = process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD;

    if (decoded.id != id) {
      console.log("2");
      return res
        .status(403)
        .json({ message: "Access Denied. You are not an admin." });
    }
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token.", error });
  }
};

export default AdminAuth;
