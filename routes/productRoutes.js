import express from "express";
import {
    listProduct,
    singleProduct,
    addProduct,
    removeProduct,
    ListSingleProduct,
    searchImage
} from "../controller/ProductControler.js";
import upload from "../middleware/muter.js";
import AdminAuth from "../middleware/AdminAuth.js";

const productrouter = express.Router();

// Route to get a single product
productrouter.get("/single", singleProduct);
productrouter.post("/search-image", upload.single("image"), searchImage);
// Route to add a new product
productrouter.post(
  "/add",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct
);

// Route to remove a product
productrouter.post("/remove", removeProduct);

// Route to list all products
productrouter.get("/list", listProduct);
productrouter.post("/listsingle",ListSingleProduct);
export default productrouter;
