const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { Log, AlertRule, Alert } = require('./models');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Alert Service: MongoDB Connected');
  // Seed default rule if none exist
  const count = await AlertRule.countDocuments();
    if (count === 0) {
      await new AlertRule({
        name: 'High Error Rate',
        type: 'ERROR_COUNT',
        threshold: 10,
        windowMinutes: 1,
        email: 'admin@devops.com'
      }).save();
      await new AlertRule({
        name: 'Database Failure',
        type: 'DB_FAILURE',
        threshold: 1,
        windowMinutes: 5,
        email: 'admin@devops.com'
      }).save();
      console.log('Default Alert Rules seeded');
    }
})
.catch(err => console.error('MongoDB connection error:', err));

// Email Transporter (Mock configuration)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Alert Rule Management
app.get('/api/alerts/rules', async (req, res) => {
  const rules = await AlertRule.find();
  res.json(rules);
});

app.post('/api/alerts/rules', async (req, res) => {
  const rule = new AlertRule(req.body);
  await rule.save();
  res.status(201).json(rule);
});

app.put('/api/alerts/rules/:id', async (req, res) => {
  const rule = await AlertRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(rule);
});

app.delete('/api/alerts/rules/:id', async (req, res) => {
  await AlertRule.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get('/api/alerts', async (req, res) => {
  const alerts = await Alert.find().sort({ timestamp: -1 });
  res.json(alerts);
});

app.post('/api/alerts/:id/resolve', async (req, res) => {
  await Alert.findByIdAndUpdate(req.params.id, { status: 'RESOLVED' });
  res.json({ success: true });
});

// Background Job: Check Rules
cron.schedule('* * * * *', async () => {
  console.log('Running Alert Engine check...');
  const rules = await AlertRule.find({ active: true });

  for (const rule of rules) {
    if (rule.type === 'ERROR_COUNT') {
      const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
      const errorCount = await Log.countDocuments({
        logLevel: 'ERROR',
        timestamp: { $gte: windowStart }
      });

      if (errorCount > rule.threshold) {
        await createAlert(rule, `Error count (${errorCount}) exceeded threshold (${rule.threshold}) in last ${rule.windowMinutes} min`);
      }
    } else if (rule.type === 'HEARTBEAT') {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const services = await Log.distinct('serviceId');
      
      for (const serviceId of services) {
        const lastLog = await Log.findOne({ serviceId }).sort({ timestamp: -1 });
        if (lastLog && lastLog.timestamp < fiveMinAgo) {
          await createAlert(rule, `Service ${serviceId} has been offline for more than 5 minutes`, serviceId);
        }
      }
    } else if (rule.type === 'DB_FAILURE') {
      const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
      const dbFailures = await Log.find({
        message: { $regex: /db|database|connection|timeout/i },
        logLevel: 'ERROR',
        timestamp: { $gte: windowStart }
      });

      if (dbFailures.length > 0) {
        await createAlert(rule, `Database connection failure detected: ${dbFailures[0].message}`);
      }
    }
  }
});

async function createAlert(rule, message, serviceId = null) {
  // Prevent duplicate active alerts for same rule/service in last 10 mins
  const recentAlert = await Alert.findOne({
    ruleId: rule._id,
    serviceId,
    status: 'ACTIVE',
    timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
  });

  if (!recentAlert) {
    const alert = new Alert({
      ruleId: rule._id,
      serviceId,
      message,
      status: 'ACTIVE'
    });
    await alert.save();
    
    console.log(`ALERT TRIGGERED: ${message}`);
    
    // Send Email
    try {
      await transporter.sendMail({
        from: '"Log System" <alerts@devops.com>',
        to: rule.email,
        subject: `🚨 Alert: ${rule.name}`,
        text: message,
      });
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  }
}

app.listen(PORT, () => {
  console.log(`Alert Service running on port ${PORT}`);
});
