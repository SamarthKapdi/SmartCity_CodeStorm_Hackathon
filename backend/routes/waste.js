const express = require('express');
const WasteData = require('../models/WasteData');
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const wasteService = require('../services/wasteService');
const router = express.Router();

// GET /api/waste - Get all waste data
router.get('/', auth, async (req, res, next) => {
  try {
    const { zone, fillStatus, collectionStatus } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (fillStatus) filter.fillStatus = fillStatus;
    if (collectionStatus) filter.collectionStatus = collectionStatus;

    const data = await WasteData.find(filter).sort({ fillLevel: -1 });
    const total = await WasteData.countDocuments(filter);

    res.json({ success: true, data, total });
  } catch (error) {
    next(error);
  }
});

// GET /api/waste/stats - Get waste statistics
router.get('/stats', auth, async (req, res, next) => {
  try {
    const stats = await WasteData.aggregate([
      {
        $group: {
          _id: '$zone',
          avgFillLevel: { $avg: '$fillLevel' },
          fullBins: { $sum: { $cond: [{ $eq: ['$fillStatus', 'full'] }, 1, 0] } },
          halfBins: { $sum: { $cond: [{ $eq: ['$fillStatus', 'half'] }, 1, 0] } },
          emptyBins: { $sum: { $cond: [{ $eq: ['$fillStatus', 'empty'] }, 1, 0] } },
          missedPickups: { $sum: { $cond: ['$missedPickup', 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const overall = {
      totalBins: await WasteData.countDocuments(),
      fullBins: await WasteData.countDocuments({ fillStatus: 'full' }),
      missedPickups: await WasteData.countDocuments({ missedPickup: true }),
      pendingCollection: await WasteData.countDocuments({ collectionStatus: 'pending' })
    };

    res.json({ success: true, data: { zoneStats: stats, overall } });
  } catch (error) {
    next(error);
  }
});

// POST /api/waste - Create waste bin
router.post('/', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const data = await WasteData.create(req.body);

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Created Waste Bin',
      module: 'waste',
      details: `Added bin ${data.binId} at ${data.location}`
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// PUT /api/waste/:id - Update waste bin data
router.put('/:id', auth, async (req, res, next) => {
  try {
    const bin = await WasteData.findById(req.params.id);
    if (!bin) return res.status(404).json({ success: false, message: 'Waste bin not found.' });

    Object.assign(bin, req.body);
    await bin.save(); // Triggers pre-save hook for fillStatus

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Updated Waste Bin',
      module: 'waste',
      details: `Updated bin ${bin.binId} - Fill: ${bin.fillLevel}%`
    });

    res.json({ success: true, data: bin });
  } catch (error) {
    next(error);
  }
});

// POST /api/waste/:id/collect - Mark bin as collected
router.post('/:id/collect', auth, async (req, res, next) => {
  try {
    const bin = await WasteData.findById(req.params.id);
    if (!bin) return res.status(404).json({ success: false, message: 'Waste bin not found.' });

    bin.fillLevel = 0;
    bin.collectionStatus = 'completed';
    bin.lastCollected = new Date();
    bin.missedPickup = false;
    await bin.save();

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Collected Waste Bin',
      module: 'waste',
      details: `Bin ${bin.binId} collected at ${bin.location}`
    });

    res.json({ success: true, data: bin, message: 'Bin marked as collected.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/waste/optimize-routes/:zone - Optimize routes for zone
router.post('/optimize-routes/:zone', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const result = await wasteService.optimizeRoutes(req.params.zone);

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Optimized Waste Routes',
      module: 'waste',
      details: `Optimized routes for ${req.params.zone} zone - ${result.totalBins || 0} bins scheduled`
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/waste/detect-missed - Detect missed pickups
router.post('/detect-missed', auth, async (req, res, next) => {
  try {
    const missed = await wasteService.detectMissedPickups();
    res.json({ success: true, data: missed, count: missed.length });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
