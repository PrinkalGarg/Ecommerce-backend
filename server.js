import express from "express";
import cors from "cors";
import connectDB from "./config/mongoos.js";
import ConnectCloudify from "./config/cloudify.js";

import { userRoute } from "./routes/userRoutes.js";
import productrouter from "./routes/productRoutes.js";
import cartRoutes from "./routes/CartRoutes.js";
import { OrderRoute } from "./routes/OrderRoutes.js";

const app = express();
const port = 3000;

const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log("Database connected successfully!");

    // Connect to Cloudinary
    await ConnectCloudify();
    console.log("Cloudinary connected successfully!");

    // Middleware
    app.use(express.json());
    app.use(cors());


    // Routes
    app.use("/api/user", userRoute);
    app.use("/api/product", productrouter);
    app.use("/api/cart", cartRoutes);
    app.use("/api/order", OrderRoute);

    // Test route
    app.get("/", (req, res) => {
      res.send("Hello World!");
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error initializing server:", error.message);
    process.exit(1); // Exit if any initialization step fails
  }
};

startServer();
