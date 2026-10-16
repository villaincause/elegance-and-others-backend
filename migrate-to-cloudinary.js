require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const db = require('./db');

const targetFolder = process.env.CLOUDINARY_FOLDER || 'elegance-and-others';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function getFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

async function migrate() {
  console.log(`🚀 Starting migration to Cloudinary folder: "${targetFolder}"...`);

  const imagesDir = path.join(__dirname, 'public/images');
  const filePaths = getFilesRecursively(imagesDir);
  console.log(`📸 Found ${filePaths.length} image files locally in ${imagesDir}.`);

  const urlMap = new Map();

  for (const filePath of filePaths) {
    const filename = path.basename(filePath);
    if (urlMap.has(filename)) continue;

    try {
      console.log(`Uploading ${filename}...`);
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: targetFolder,
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });

      urlMap.set(filename, uploadResult.secure_url);
      console.log(`✅ Uploaded: ${filename} -> ${uploadResult.secure_url}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${filename}:`, err.message);
    }
  }

  console.log("\n🔄 Updating Database records in TiDB...");

  // 1. Update Products Table
  const [products] = await db.query('SELECT id, name, image_url, images FROM products');
  for (const product of products) {
    let updatedImageUrl = product.image_url;
    let updatedImages = product.images;

    if (product.image_url) {
      const baseName = path.basename(product.image_url);
      if (urlMap.has(baseName)) {
        updatedImageUrl = urlMap.get(baseName);
      }
    }

    if (product.images) {
      try {
        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsed)) {
          const newArray = parsed.map(img => {
            const baseName = path.basename(img);
            return urlMap.has(baseName) ? urlMap.get(baseName) : img;
          });
          updatedImages = JSON.stringify(newArray);
        }
      } catch (e) {
        console.warn(`Could not parse images for product #${product.id}`);
      }
    }

    if (updatedImageUrl !== product.image_url || updatedImages !== product.images) {
      await db.query(
        'UPDATE products SET image_url = ?, images = ? WHERE id = ?',
        [updatedImageUrl, updatedImages, product.id]
      );
      console.log(`✅ Updated Product #${product.id} ("${product.name}")`);
    } else {
      console.log(`ℹ️ Product #${product.id} already up to date`);
    }
  }

  // 2. Update Users Table
  const [users] = await db.query('SELECT id, full_name, profile_picture FROM users');
  for (const user of users) {
    if (user.profile_picture) {
      const baseName = path.basename(user.profile_picture);
      if (urlMap.has(baseName)) {
        const newUrl = urlMap.get(baseName);
        if (newUrl !== user.profile_picture) {
          await db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [newUrl, user.id]);
          console.log(`✅ Updated User #${user.id} ("${user.full_name}") profile picture`);
        }
      }
    }
  }

  console.log("\n🎉 Cloudinary migration completed successfully!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

