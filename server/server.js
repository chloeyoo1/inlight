const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the React app
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // For GLTF files, preserve original filename to maintain references
    if (path.extname(file.originalname).toLowerCase() === '.gltf') {
      cb(null, file.originalname);
    } else {
      // Generate unique filename with timestamp for other files
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow 3D model file types and binary files that GLTF might reference
    const allowedTypes = ['.glb', '.gltf', '.obj', '.bin', '.png', '.jpg', '.jpeg'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only 3D model files and related assets are allowed.'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Serve static files from uploads directory
app.use('/models', express.static(uploadsDir));

// Upload endpoint - now handles multiple files
app.post('/upload', upload.array('model', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Find the main model file (GLTF, GLB, or OBJ)
    const mainFile = req.files.find(file => {
      const ext = path.extname(file.originalname).toLowerCase();
      return ['.gltf', '.glb', '.obj'].includes(ext);
    });

    if (!mainFile) {
      return res.status(400).json({ error: 'No valid 3D model file found' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/models/${mainFile.filename}`;
    
    res.json({
      success: true,
      filename: mainFile.filename,
      originalName: mainFile.originalname,
      url: fileUrl,
      size: mainFile.size,
      uploadedFiles: req.files.map(file => file.originalname)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all uploaded models
app.get('/models', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const models = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        originalName: filename,
        url: `${req.protocol}://${req.get('host')}/models/${filename}`,
        size: stats.size,
        uploadedAt: stats.mtime
      };
    });
    
    res.json(models);
  } catch (error) {
    console.error('Error reading models:', error);
    res.status(500).json({ error: 'Failed to read models' });
  }
});

// Delete a model
app.delete('/models/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Model deleted successfully' });
    } else {
      res.status(404).json({ error: 'Model not found' });
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
}); 