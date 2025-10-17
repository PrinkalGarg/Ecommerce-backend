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

    // 1️⃣ Validate required fields
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

    // 2️⃣ Collect files from multer
    let files = [];
    if (req.files) {
      const maybeFields = ["image1", "image2", "image3", "image4"];
      const found = maybeFields
        .map((k) => (req.files[k] && req.files[k][0] ? req.files[k][0] : undefined))
        .filter(Boolean);

      if (found.length > 0) files = found;
      else if (Array.isArray(req.files.images) && req.files.images.length > 0) files = req.files.images;
      else if (Array.isArray(req.files)) files = req.files;
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }

    // 3️⃣ Upload images to Cloudinary
    const uploadToCloudinary = (file) =>
      new Promise((resolve, reject) => {
        if (file.buffer) {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "ecom_products" },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          stream.end(file.buffer);
        } else if (file.path) {
          cloudinary.uploader.upload(file.path, { folder: "ecom_products", resource_type: "image" })
            .then(resolve)
            .catch(reject);
        } else reject(new Error("File has no buffer or path"));
      });

    const uploadResults = await Promise.all(files.map((f) => uploadToCloudinary(f)));
    const imageUrls = uploadResults.map((r) => r.secure_url);

    // Optional: delete local temp files
    for (const f of files) {
      if (f.path) fs.unlink(f.path, (err) => err && console.warn("Failed to remove temp file:", err));
    }

    // 4️⃣ Parse sizes
    let sizesArray = [];
    if (typeof sizes === "string") {
      try {
        sizesArray = JSON.parse(sizes.replace(/'/g, '"'));
      } catch {
        sizesArray = sizes.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(sizes)) sizesArray = sizes;
    else sizesArray = [];

    // 5️⃣ Compute embeddings using Jina
    const JINA_API_KEY = process.env.JINA_API_KEY;
    const embeddings = [];

    for (const url of imageUrls) {
      try {
        const resp = await axios.post(
          "https://api.jina.ai/v1/embeddings",
          { model: "jina-clip-v1", input: [{ image: url }] },
          { headers: { Authorization: `Bearer ${JINA_API_KEY}`, "Content-Type": "application/json" }, timeout: 60000 }
        );
        const emb = resp?.data?.data?.[0]?.embedding || [];
        embeddings.push(emb);
      } catch (err) {
        console.error("Jina embedding error for", url, err?.response?.data || err.message || err);
        embeddings.push([]); // fallback empty embedding
      }
    }

    // 6️⃣ Assemble images with embedding
    const images = uploadResults.map((r, idx) => ({
      url: r.secure_url,
      public_id: r.public_id,
      embedding: embeddings[idx] || [],
    }));

    // 7️⃣ Compute aggregated product embedding (mean pooling)
    let aggEmbedding = [];
    if (embeddings.length > 0) {
      const dim = embeddings[0].length || 0;
      aggEmbedding = new Array(dim).fill(0);
      for (const e of embeddings) {
        for (let i = 0; i < dim; i++) aggEmbedding[i] += (e[i] || 0);
      }
      for (let i = 0; i < dim; i++) aggEmbedding[i] /= embeddings.length;
    }

    // 8️⃣ Save product to DB
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

    // 1️⃣ Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "ecom_queries",
      resource_type: "image",
    });

    // Delete local file
    try { await fs.unlink(req.file.path); } 
    catch (e) { console.warn("Failed to remove temp file:", e.message); }

    const queryImageUrl = uploadResult.secure_url;

    // 2️⃣ Get Jina embedding (correct input format)
    const JINA_API_KEY = process.env.JINA_API_KEY;
    const resp = await axios.post(
      "https://api.jina.ai/v1/embeddings",
      {
        model: "jina-clip-v1",
        input: [{ image: queryImageUrl }] // ✅ correct format
      },
      {
        headers: {
          Authorization: `Bearer ${JINA_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const queryEmb = resp?.data?.data?.[0]?.embedding;
    if (!Array.isArray(queryEmb) || queryEmb.length === 0) {
      return res.status(500).json({ error: "Failed to compute embedding for query image." });
    }

    // 3️⃣ Cosine similarity helper
    const cosine = (a = [], b = []) => {
      let dot = 0, na = 0, nb = 0;
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) {
        const x = a[i] || 0, y = b[i] || 0;
        dot += x * y; na += x * x; nb += y * y;
      }
      return (!na || !nb) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
    };

    // 4️⃣ Fetch products from DB
    const sampleSize = Number(process.env.SEARCH_SAMPLE_SIZE || 2000);
    const docs = await Product.find({}, {
      name: 1, price: 1, category: 1, subcategory: 1, bestSeller: 1, images: 1, embedding: 1
    }).limit(sampleSize).lean();

    // 5️⃣ Compute similarity and top-k
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
