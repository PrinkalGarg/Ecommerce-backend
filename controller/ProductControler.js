import { v2 as cloudinary } from "cloudinary";

import Product from "../models/Product.js";

const listProduct = async (req, res) => {
  const AllProduct = await Product.find({});
  res.json({ items: AllProduct ,success:"true" });
};
const singleProduct = async (req, res) => {s
  try {
    const { productid } = req.body;
    const product = await Product.findById(productid);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the product." });
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subcategory,
      sizes,
      bestseller,
    } = req.body;
    // Validate required fields
    
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !subcategory ||
      !bestseller ||
      !sizes
    ) {
      console.log("1");
      
      return res.status(400).json({ error: "Missing required fields." });
    }

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const image = [image1, image2, image3, image4].filter(
      (item) => item != undefined
    );

    const imageUrls = await Promise.all(
      image.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: "image",
        });

        return String(result.secure_url);
      })
    );

    const sizesArray = JSON.parse(sizes.replace(/'/g, '"'));
    const productDetails = {
      name,
      description,
      price: Number(price),
      category,
      subcategory,
      sizes: sizesArray,
      bestSeller: Boolean(bestseller),
      images: imageUrls,
    };
   
    const result = await Product.create(productDetails);

    res.json({result, sucess: true});
  } catch (error) {
    console.log(error);

    res.json(error);
  }
};

const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
     console.log("dsgfdfsg");
     

    await Product.findByIdAndDelete(id);
    return res.json({success:"true"});
  } catch (e) {
    console.log("1");
    
    res.json(e);
  }
};
const ListSingleProduct = async (req, res) => {
  try {
    
    const {_id} = req.body;
      
    // Check if _id is provided
    if (!_id) {
    console.log(1);
    
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Fetch product by ID
    const product = await Product.findById(_id);
    

    // If product not found, return 404
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Return the product if found
    res.status(200).json({ success: true, product });
  } catch (e) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: e.message });
  }
};


export { listProduct, singleProduct, addProduct, removeProduct,ListSingleProduct };
