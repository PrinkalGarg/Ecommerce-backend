import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const ConnectCloudify = async function () {
  cloudinary.config({
    cloud_name: process.env.Cloudinary_NAME,
    api_key: process.env.Cloudinary_API_Key,
    api_secret: process.env.Cloudinary_API_SECRETE,
    secure: true,
  });
};
export default ConnectCloudify;
