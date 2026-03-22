const WasteData = require('../models/WasteData');
const notificationService = require('./notificationService');

const wasteService = {
  /**
   * Optimize waste collection routes based on fill levels
   * Groups bins by zone and prioritizes full bins
   */
  async optimizeRoutes(zone) {
    try {
      // Get all bins in zone sorted by fill level (highest first)
      const bins = await WasteData.find({ zone, collectionStatus: { $ne: 'completed' } })
        .sort({ fillLevel: -1 });

      if (bins.length === 0) return { routes: [], message: 'No bins need collection' };

      // Create optimized routes: prioritize full bins, then half, skip empty
      const urgentBins = bins.filter(b => b.fillLevel > 70);
      const moderateBins = bins.filter(b => b.fillLevel > 30 && b.fillLevel <= 70);
      
      const routes = [];
      const routeId = `ROUTE-${zone.toUpperCase()}-${Date.now()}`;

      // Route 1: Urgent (full bins first)
      if (urgentBins.length > 0) {
        routes.push({
          routeId: `${routeId}-URG`,
          priority: 'high',
          bins: urgentBins.map(b => ({ binId: b.binId, location: b.location, fillLevel: b.fillLevel })),
          estimatedTime: `${urgentBins.length * 10} minutes`
        });

        // Update bins with route assignment
        for (const bin of urgentBins) {
          bin.routeId = `${routeId}-URG`;
          bin.collectionStatus = 'scheduled';
          await bin.save();
        }
      }

      // Route 2: Moderate (half-full bins)
      if (moderateBins.length > 0) {
        routes.push({
          routeId: `${routeId}-MOD`,
          priority: 'medium',
          bins: moderateBins.map(b => ({ binId: b.binId, location: b.location, fillLevel: b.fillLevel })),
          estimatedTime: `${moderateBins.length * 10} minutes`
        });

        for (const bin of moderateBins) {
          bin.routeId = `${routeId}-MOD`;
          bin.collectionStatus = 'scheduled';
          await bin.save();
        }
      }

      return { routes, totalBins: urgentBins.length + moderateBins.length };
    } catch (error) {
      console.error('Route optimization error:', error.message);
      throw error;
    }
  },

  /**
   * Detect missed pickups (bins scheduled but not collected within 24 hours)
   */
  async detectMissedPickups() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const missedBins = await WasteData.find({
        collectionStatus: 'scheduled',
        updatedAt: { $lt: oneDayAgo }
      });

      for (const bin of missedBins) {
        bin.missedPickup = true;
        bin.collectionStatus = 'missed';
        await bin.save();

        await notificationService.createWarning(
          'waste',
          `Missed Pickup - Bin ${bin.binId}`,
          `Waste bin at ${bin.location} (${bin.zone} zone) missed scheduled pickup. Fill level: ${bin.fillLevel}%`
        );
      }

      return missedBins;
    } catch (error) {
      console.error('Missed pickup detection error:', error.message);
      throw error;
    }
  }
};

module.exports = wasteService;
