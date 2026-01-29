const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   ✅ MIDDLEWARE (FIXED)
   ======================= */
app.use(cors({
  origin: '*'
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   ✅ SCHEMAS & MODELS
   ======================= */
const activitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', activitySchema);
const Complaint = mongoose.model('Complaint', complaintSchema);

/* =======================
   ✅ MONGODB CONNECTION
   ======================= */
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

/* =======================
   ✅ HEALTH CHECK
   ======================= */
app.get('/', (req, res) => {
  res.json({ message: '🚀 Naveen Seva Mitra Backend Running!' });
});

/* =======================
   ✅ COMPLAINT ROUTES
   ======================= */
app.post('/api/complaints', async (req, res) => {
  try {
    const { phoneNumber, category, description, status } = req.body;

    if (!phoneNumber || !category || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const complaint = new Complaint({
      phoneNumber,
      category,
      description,
      status: status || 'pending'
    });

    const savedComplaint = await complaint.save();
    res.status(201).json(savedComplaint);
  } catch (error) {
    console.error('❌ Complaint Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/complaints/phone/:phoneNumber', async (req, res) => {
  try {
    const complaints = await Complaint.find({ phoneNumber: req.params.phoneNumber });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/complaints/:id/status', async (req, res) => {
  try {
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(updatedComplaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* =======================
   ✅ ACTIVITY ROUTES
   ======================= */
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ date: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const activity = new Activity(req.body);
    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/activities/:id', async (req, res) => {
  try {
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/activities/:id', async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   ✅ 404 HANDLER
   ======================= */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

/* =======================
   ✅ START SERVER
   ======================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
