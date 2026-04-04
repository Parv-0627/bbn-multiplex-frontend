const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

// Upload folder
const uploadDir = '/tmp/uploads';
const outputDir = '/tmp/outputs';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Test route
app.get('/', (req, res) => {
  res.json({ status: 'BBN Backend Running ✅' });
});

// Upload + Convert route
app.post('/convert', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const inputPath = req.file.path;
  const outputPath = path.join(outputDir, Date.now() + '.mp4');

  ffmpeg(inputPath)
    .output(outputPath)
    .videoCodec('libx264')
    .audioCodec('aac')
    .on('end', () => {
      res.download(outputPath, 'converted.mp4', () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', (err) => {
      res.status(500).json({ error: err.message });
    })
    .run();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
