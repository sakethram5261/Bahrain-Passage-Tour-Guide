export default function ShopPanel({
  shopOpen,
  goldFils,
  shopItems,
  purchasedItems,
  onBuyItem,
  onClose
}) {
  if (!shopOpen) return null

  return (
    <div
      className="jn-modal-overlay glass-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Heritage Collector Kiosk"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="jn-shop-modal glass-card relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Tactile Paper Grain Overlay */}
        <div className="paper-grain" style={{ opacity: 0.038 }} />
        <div className="jn-shop-header">
          <div>
            <span className="jn-shop-eyebrow">Manama Heritage Kiosk</span>
            <h3 className="jn-shop-title">Collector's Kiosk</h3>
          </div>
          <button className="jn-shop-close" onClick={onClose} aria-label="Close kiosk">✕ Close</button>
        </div>

        <div className="jn-shop-fils-bar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="flex justify-between w-full">
            <span>Your Fils Balance</span>
            <strong>{(goldFils || 0).toLocaleString()} Fils</strong>
          </div>
          <span style={{ fontSize: '9px', opacity: 0.65, fontFamily: 'var(--bp-font-body)', marginTop: '2px', fontWeight: 'bold' }}>
            Note: 1,000 Fils = 1 BHD (Bahraini Dinar)
          </span>
        </div>

        <div className="jn-shop-grid">
          {shopItems.map((item) => {
            const owned = purchasedItems[item.id] || 0
            return (
              <div key={item.id} className="jn-shop-card">
                <div className="jn-shop-emoji" role="img" aria-label={item.name}>
                  {item.emoji}
                </div>
                <div className="jn-shop-card-info">
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="jn-shop-card-title">{item.name}</h4>
                    {owned > 0 && <span className="jn-shop-owned-tag">Owned: {owned}</span>}
                  </div>
                  <p className="jn-shop-card-desc">{item.desc}</p>
                </div>
                <button
                  className="jn-shop-buy-btn"
                  onClick={() => onBuyItem(item)}
                  disabled={goldFils < item.cost}
                >
                  {item.cost.toLocaleString()} Fils
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
