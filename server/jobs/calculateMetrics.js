function calculateDerivedMetrics({ impressions, spend, ctr, contentViews, addToCarts, initiateCheckouts, purchases }) {
  return {
    costPerMille: impressions > 0 ? spend / (impressions / 1000) : null,
    clickThroughRate: ctr,
    costPerContentView: contentViews > 0 ? spend / contentViews : null,
    costPerAddToCart: addToCarts > 0 ? spend / addToCarts : null,
    costPerInitiateCheckout: initiateCheckouts > 0 ? spend / initiateCheckouts : null,
    costPerPurchase: purchases > 0 ? spend / purchases : null,
    costPerAcquisition: purchases > 0 ? spend / purchases : null,
    roas: purchases > 0 ? (purchases * 50) / spend : null, // Assuming avg purchase = $50
    aov: purchases > 0 ? (purchases * 50) / purchases : null, // avg order value
  };
}

module.exports = calculateDerivedMetrics;
