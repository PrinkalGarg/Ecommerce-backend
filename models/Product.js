// models/Product.js
import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String },
  embedding: { type: [Number], default: [] } // per-image embedding
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: { type: [ImageSchema], default: [] }, // array of image objects
  price: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  bestSeller: { type: Boolean, default: false },
  sizes: { type: [String], required: true },
  // aggregated product-level embedding (mean of image embeddings)
  embedding: { type: [Number], default: [] },
}, {
  timestamps: true, // createdAt, updatedAt
});

const Product = mongoose.model("Product", productSchema);
export default Product;
