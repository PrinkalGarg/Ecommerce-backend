import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
    required: true,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  sizes:
  {
    type:Array,
    require :true,
  },
  date: {
    type: Number,
    require: true,
  },
});

const Product = mongoose.model("Product", productSchema);

export default Product;
