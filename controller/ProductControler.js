import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
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

// updated addProduct controller
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

    // Validate required fields (allow false for boolean bestseller)
    if (
      name === undefined ||
      description === undefined ||
      price === undefined ||
      category === undefined ||
      subcategory === undefined ||
      sizes === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Collect files from either grouped fields or an array 'images'
    // Support both patterns: req.files.image1..image4 OR req.files.images (array)
    let files = [];

    // If multer used with named fields (image1..image4)
    if (req.files) {
      // if files grouped by field names (e.g., req.files.image1)
      const maybeFields = ["image1", "image2", "image3", "image4"];
      const found = maybeFields
        .map((k) => (req.files[k] && req.files[k][0] ? req.files[k][0] : undefined))
        .filter(Boolean);

      if (found.length > 0) {
        files = found;
      } else if (Array.isArray(req.files.images) && req.files.images.length > 0) {
        // if multer used upload.array("images")
        files = req.files.images;
      } else if (Array.isArray(req.files)) {
        // some multer setups put files directly as an array
        files = req.files;
      }
    }

    // If no files found, reject
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }

    // Helper to upload a single file to Cloudinary supporting buffer or path
    const uploadToCloudinary = (file) =>
      new Promise((resolve, reject) => {
        // If multer memoryStorage produced a buffer, use upload_stream
        if (file.buffer) {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "ecom_products" },
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
          stream.end(file.buffer);
        } else if (file.path) {
          // fallback to upload from path
          cloudinary.uploader
            .upload(file.path, { folder: "ecom_products", resource_type: "image" })
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else {
          reject(new Error("File has no buffer or path"));
        }
      });

    // 1) Upload all images to Cloudinary in parallel
    const uploadResults = await Promise.all(files.map((f) => uploadToCloudinary(f)));
    const imageUrls = uploadResults.map((r) => r.secure_url);

    // 2) Parse sizes (support JSON string with single or double quotes)
    let sizesArray = [];
    if (typeof sizes === "string") {
      try {
        // convert single quotes to double so JSON.parse works if client sent single quotes
        sizesArray = JSON.parse(sizes.replace(/'/g, '"'));
      } catch (err) {
        // fallback: comma-separated
        sizesArray = sizes.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(sizes)) {
      sizesArray = sizes;
    } else {
      sizesArray = [];
    }

    // 3) Call ML service to compute embeddings for each uploaded image (batch)
    const mlBase = (process.env.ML_SERVICE_URL || "http://localhost:5000").replace(/\/$/, "");
    // prefer /embed_batch endpoint (expects { image_urls: [...] })
    let embeddings = [];
    try {
      const mlResponse = await axios.post(
        `${mlBase}/embed_batch`,
        { image_urls: imageUrls },
        { timeout: 120000 }
      );
      if (mlResponse?.data?.embeddings && Array.isArray(mlResponse.data.embeddings)) {
        embeddings = mlResponse.data.embeddings;
      } else {
        // Fallback: call single embed for each (slower)
        embeddings = [];
        for (const url of imageUrls) {
          const r = await axios.post(`${mlBase}/embed`, { image_url: url }, { timeout: 60000 });
          embeddings.push(r.data.embedding || []);
        }
      }
    } catch (err) {
      console.error("ML service error:", err?.response?.data || err.message || err);
      return res.status(500).json({ error: "Failed to compute image embeddings" });
    }

    // 4) Assemble images array with url, public_id, embedding
    const images = uploadResults.map((r, idx) => ({
      url: r.secure_url,
      public_id: r.public_id,
      embedding: embeddings[idx] || [],
    }));

    // 5) Compute aggregated product embedding (mean pooling)
    let aggEmbedding = [];
    if (embeddings.length > 0) {
      const dim = embeddings[0].length || 0;
      aggEmbedding = new Array(dim).fill(0);
      for (const e of embeddings) {
        for (let i = 0; i < dim; i++) {
          aggEmbedding[i] += (e[i] || 0);
        }
      }
      for (let i = 0; i < dim; i++) aggEmbedding[i] = aggEmbedding[i] / embeddings.length;
    }

    // 6) Create product document (images as objects, plus aggregated embedding)
    const productDetails = {
      name,
      description,
      price: Number(price),
      category,
      subcategory,
      sizes: sizesArray,
      bestSeller: Boolean(bestseller),
      images,
      embedding: aggEmbedding,
    };

    const result = await Product.create(productDetails);

    return res.status(201).json({ result, success: true });
  } catch (error) {
    console.error("addProduct error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
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
// Controller: search by image
// Usage: router.post('/search/image', upload.single('image'), searchImage);
// Assumes: cloudinary.v2 configured, axios imported, Product model imported.

 import fs from "fs/promises";

 const searchImage = async (req, res) => {
  try {
    const k = Number(req.query.k || 12);

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required (field 'image')." });
    }

    // Ensure Cloudinary is configured. If you used a central config, skip this.
    // cloudinary.config({...}) // only if not configured elsewhere

    // Upload file path (diskStorage) to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "ecom_queries",
      resource_type: "image",
    });

    // Optionally delete the local file to free disk space
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      // non-fatal; just log
      console.warn("Failed to remove temp file:", req.file.path, e.message || e);
    }

    const queryImageUrl = uploadResult.secure_url;

    // Request embedding from ML service
    const mlBase = (process.env.ML_SERVICE_URL || "http://localhost:5000").replace(/\/$/, "");
    const mlResp = await axios.post(`${mlBase}/embed`, { image_url: queryImageUrl }, { timeout: 60000 });
    const queryEmb = mlResp?.data?.embedding;
    if (!Array.isArray(queryEmb) || queryEmb.length === 0) {
      return res.status(500).json({ error: "Failed to compute embedding for query image." });
    }

    // cosine helper
    const cosine = (a = [], b = []) => {
      let dot = 0, na = 0, nb = 0;
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) {
        const x = a[i] || 0, y = b[i] || 0;
        dot += x * y; na += x * x; nb += y * y;
      }
      if (!na || !nb) return 0;
      return dot / (Math.sqrt(na) * Math.sqrt(nb));
    };

    // Fallback in-memory search (dev). For production use vector DB / Atlas Vector Search.
    const sampleSize = Number(process.env.SEARCH_SAMPLE_SIZE || 2000);
    const docs = await Product.find({}, {
      name: 1, price: 1, category: 1, subcategory: 1, bestSeller: 1, images: 1, embedding: 1
    }).limit(sampleSize).lean();

    const results = docs
      .map(p => {
        const aggCos = cosine(queryEmb, p.embedding || []);
        const perImageMax = (p.images || []).reduce((m, img) => Math.max(m, cosine(queryEmb, img?.embedding || [])), 0);
        const similarity = Math.max(perImageMax, aggCos * 0.6);
        return { ...p, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    return res.json({ queryImageUrl, count: results.length, products: results });
  } catch (err) {
    console.error("searchImage error:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: "Server error", details: err?.message || String(err) });
  }
};




export { listProduct, singleProduct,searchImage, addProduct, removeProduct,ListSingleProduct };
