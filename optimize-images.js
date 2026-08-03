"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const projectDir = process.cwd();

const candidateFolders = ["assets", "images", "img", "public/images", "public/assets"];

const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function findImageRoot() {
  for (const folder of candidateFolders) {
    const fullPath = path.join(projectDir, folder);

    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  throw new Error(
    "Nenhuma pasta de imagens encontrada. Use assets, images, img, public/images ou public/assets.",
  );
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getAllImages(dir) {
  const entries = fs.readdirSync(dir, {
    withFileTypes: true,
  });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getAllImages(fullPath);
    }

    const extension = path.extname(entry.name).toLowerCase();

    return supportedExtensions.has(extension) ? [fullPath] : [];
  });
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getOptimizationSettings(relativePath) {
  const normalizedPath = relativePath.toLowerCase();

  if (normalizedPath.includes("favicon")) {
    return {
      maxWidth: 192,
      quality: 90,
    };
  }

  if (normalizedPath.includes("logo")) {
    return {
      maxWidth: 800,
      quality: 88,
    };
  }

  if (normalizedPath.includes("hero") || normalizedPath.includes("banner")) {
    return {
      maxWidth: 1600,
      quality: 78,
    };
  }

  if (normalizedPath.includes("service") || normalizedPath.includes("card")) {
    return {
      maxWidth: 900,
      quality: 76,
    };
  }

  return {
    maxWidth: 1200,
    quality: 78,
  };
}

async function optimizeImage(filePath, imageRoot, backupRoot) {
  const relativePath = path.relative(imageRoot, filePath);
  const extension = path.extname(filePath).toLowerCase();
  const originalSize = fs.statSync(filePath).size;

  const backupPath = path.join(backupRoot, relativePath);

  ensureDir(path.dirname(backupPath));

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  const metadata = await sharp(filePath).metadata();
  const settings = getOptimizationSettings(relativePath);

  const tempPath = `${filePath}.tmp`;

  let pipeline = sharp(filePath).rotate();

  if (metadata.width && metadata.width > settings.maxWidth) {
    pipeline = pipeline.resize({
      width: settings.maxWidth,
      withoutEnlargement: true,
    });
  }

  if (extension === ".png") {
    await pipeline
      .png({
        compressionLevel: 9,
        palette: true,
        quality: settings.quality,
      })
      .toFile(tempPath);
  } else if (extension === ".webp") {
    await pipeline
      .webp({
        quality: settings.quality,
        effort: 6,
        smartSubsample: true,
      })
      .toFile(tempPath);
  } else {
    await pipeline
      .jpeg({
        quality: settings.quality,
        mozjpeg: true,
      })
      .toFile(tempPath);
  }

  const optimizedSize = fs.statSync(tempPath).size;

  if (optimizedSize < originalSize) {
    fs.rmSync(filePath);
    fs.renameSync(tempPath, filePath);

    return {
      file: relativePath,
      originalSize,
      optimizedSize,
      saved: originalSize - optimizedSize,
      status: "optimized",
    };
  }

  fs.rmSync(tempPath);

  return {
    file: relativePath,
    originalSize,
    optimizedSize: originalSize,
    saved: 0,
    status: "skipped",
  };
}

async function run() {
  const imageRoot = findImageRoot();
  const rootName = path.basename(imageRoot);

  const backupRoot = path.join(projectDir, `${rootName}-backup`);

  ensureDir(backupRoot);

  const images = getAllImages(imageRoot);

  if (images.length === 0) {
    console.log("Nenhuma imagem encontrada.");
    return;
  }

  console.log(`Pasta detectada: ${imageRoot}`);
  console.log(`Imagens encontradas: ${images.length}`);
  console.log(`Backup: ${backupRoot}\n`);

  let totalOriginal = 0;
  let totalFinal = 0;
  let totalSaved = 0;

  for (const imagePath of images) {
    try {
      const result = await optimizeImage(imagePath, imageRoot, backupRoot);

      totalOriginal += result.originalSize;
      totalFinal += result.optimizedSize;
      totalSaved += result.saved;

      if (result.status === "optimized") {
        const percentage = ((result.saved / result.originalSize) * 100).toFixed(1);

        console.log(
          `OK   ${result.file} | ${formatSize(result.originalSize)} -> ${formatSize(
            result.optimizedSize,
          )} | -${percentage}%`,
        );
      } else {
        console.log(`SKIP ${result.file} | já estava otimizada`);
      }
    } catch (error) {
      console.error(`ERRO ${imagePath}: ${error.message}`);
    }
  }

  const totalPercentage =
    totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : "0.0";

  console.log("\nOtimização concluída.");
  console.log(`Antes: ${formatSize(totalOriginal)}`);
  console.log(`Depois: ${formatSize(totalFinal)}`);
  console.log(`Economia: ${formatSize(totalSaved)} (${totalPercentage}%)`);
}

run().catch((error) => {
  console.error(`ERRO: ${error.message}`);
  process.exit(1);
});
