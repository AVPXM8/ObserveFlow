const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { Log } = require('./models');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Log Collector: MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Submit Log
app.post('/api/logs', async (req, res) => {
  try {
    const { serviceId, logLevel, message, metadata, timestamp } = req.body;
    const log = new Log({
      serviceId,
      logLevel,
      message,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    await log.save();
    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch Logs
app.get('/api/logs', async (req, res) => {
  try {
    const { service, level, search, start, end, limit = 100 } = req.query;
    const query = {};
    
    if (service) query.serviceId = service;
    if (level) query.logLevel = level;
    if (search) query.message = { $regex: search, $options: 'i' };
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stats for Dashboard
app.get('/api/logs/stats', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = await Log.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      { $group: {
        _id: "$logLevel",
        count: { $sum: 1 }
      }}
    ]);

    const serviceHealth = await Log.aggregate([
      { $match: { timestamp: { $gte: twentyFourHoursAgo } } },
      { $group: {
        _id: "$serviceId",
        lastSeen: { $max: "$timestamp" },
        errorCount: {
          $sum: { $cond: [{ $eq: ["$logLevel", "ERROR"] }, 1, 0] }
        }
      }}
    ]);

    res.json({
      levelStats: stats,
      serviceHealth: serviceHealth
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/logs/download', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(1000);
    let csv = 'Timestamp,Service,Level,Message\n';
    logs.forEach(log => {
      csv += `${log.timestamp.toISOString()},${log.serviceId},${log.logLevel},"${log.message.replace(/"/g, '""')}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Log Collector running on port ${PORT}`);
});
