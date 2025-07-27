import { useState, useEffect } from "react"
import type { CreditCard, MerchantCategory, SavingsStats } from "~types"
import { storageService } from "~services/storage"
import { savingsTracker } from "~services/savingsTracker"

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<'cards' | 'savings'>('cards')
  const [cards, setCards] = useState<CreditCard[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [savingsStats, setSavingsStats] = useState<SavingsStats | null>(null)
  const [newCard, setNewCard] = useState({
    name: "",
    category: "general" as MerchantCategory,
    rewardRate: "",
    hasCap: false,
    capAmount: "",
    capPeriod: "quarterly" as "monthly" | "quarterly" | "yearly"
  })

  useEffect(() => {
    loadCards()
    if (activeTab === 'savings') {
      loadSavingsStats()
    }
  }, [activeTab])

  const loadCards = async () => {
    const savedCards = await storageService.getCards()
    setCards(savedCards)
  }

  const loadSavingsStats = async () => {
    const stats = await savingsTracker.getSavingsStats()
    setSavingsStats(stats)
  }

  const addCard = async () => {
    if (!newCard.name || !newCard.rewardRate) return

    const card: CreditCard = {
      id: Date.now().toString(),
      name: newCard.name,
      rewardStructure: [{
        category: newCard.category,
        rewardRate: parseFloat(newCard.rewardRate) / 100,
        ...(newCard.hasCap && {
          cap: {
            amount: parseFloat(newCard.capAmount),
            period: newCard.capPeriod,
            currentUsage: 0
          }
        })
      }],
      isActive: true,
      createdAt: new Date()
    }

    await storageService.saveCard(card)
    await loadCards()
    setShowAddForm(false)
    setNewCard({
      name: "",
      category: "general",
      rewardRate: "",
      hasCap: false,
      capAmount: "",
      capPeriod: "quarterly"
    })
  }

  const deleteCard = async (cardId: string) => {
    await storageService.deleteCard(cardId)
    await loadCards()
  }

  return (
    <div style={{ width: 400, minHeight: 500, padding: 16, fontFamily: "system-ui" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, marginBottom: 12 }}>💳 Credit Card Assistant</h3>
        
        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('cards')}
            style={{
              flex: 1,
              padding: "8px 0",
              border: "none",
              background: "none",
              borderBottom: activeTab === 'cards' ? "2px solid #4F46E5" : "2px solid transparent",
              color: activeTab === 'cards' ? "#4F46E5" : "#6B7280",
              fontWeight: activeTab === 'cards' ? 600 : 400,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            My Cards
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            style={{
              flex: 1,
              padding: "8px 0",
              border: "none",
              background: "none",
              borderBottom: activeTab === 'savings' ? "2px solid #4F46E5" : "2px solid transparent",
              color: activeTab === 'savings' ? "#4F46E5" : "#6B7280",
              fontWeight: activeTab === 'savings' ? 600 : 400,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Savings
          </button>
        </div>
      </div>

      {activeTab === 'cards' && !showAddForm ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Your Cards ({cards.length})</h4>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              + Add Card
            </button>
          </div>

          {cards.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: 40, 
              background: "#f9fafb", 
              borderRadius: 8,
              border: "2px dashed #d1d5db"
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
              <p style={{ margin: 0, color: "#666" }}>No cards added yet</p>
              <p style={{ margin: 0, fontSize: 12, color: "#999" }}>
                Add your credit cards to start getting recommendations
              </p>
            </div>
          ) : (
            <div style={{ space: 8 }}>
              {cards.map(card => (
                <div key={card.id} style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  background: "white"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.name}</div>
                      {card.rewardStructure.map((rule, idx) => (
                        <div key={idx} style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                          {(rule.rewardRate * 100).toFixed(1)}% on {rule.category}
                          {rule.cap && ` (${rule.cap.period} cap: $${rule.cap.amount})`}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => deleteCard(card.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: 4,
                        fontSize: 12
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'cards' && showAddForm ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Add New Card</h4>
            <button
              onClick={() => setShowAddForm(false)}
              style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}
            >
              ×
            </button>
          </div>

          <div style={{ space: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
                Card Name
              </label>
              <input
                type="text"
                value={newCard.name}
                onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                placeholder="e.g., Chase Freedom"
                style={{
                  width: "100%",
                  padding: 8,
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
                Category
              </label>
              <select
                value={newCard.category}
                onChange={(e) => setNewCard({...newCard, category: e.target.value as MerchantCategory})}
                style={{
                  width: "100%",
                  padding: 8,
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  fontSize: 14
                }}
              >
                <option value="general">General</option>
                <option value="groceries">Groceries</option>
                <option value="gas">Gas</option>
                <option value="travel">Travel</option>
                <option value="dining">Dining</option>
                <option value="online">Online</option>
                <option value="department_stores">Department Stores</option>
                <option value="electronics">Electronics</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="warehouse_clubs">Warehouse Clubs</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
                Reward Rate (%)
              </label>
              <input
                type="number"
                value={newCard.rewardRate}
                onChange={(e) => setNewCard({...newCard, rewardRate: e.target.value})}
                placeholder="5"
                step="0.1"
                style={{
                  width: "100%",
                  padding: 8,
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", fontSize: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newCard.hasCap}
                  onChange={(e) => setNewCard({...newCard, hasCap: e.target.checked})}
                  style={{ marginRight: 8 }}
                />
                Has spending cap
              </label>
            </div>

            {newCard.hasCap && (
              <div style={{ marginBottom: 12, paddingLeft: 20 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
                      Cap Amount ($)
                    </label>
                    <input
                      type="number"
                      value={newCard.capAmount}
                      onChange={(e) => setNewCard({...newCard, capAmount: e.target.value})}
                      placeholder="500"
                      style={{
                        width: "100%",
                        padding: 8,
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        fontSize: 14
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
                      Period
                    </label>
                    <select
                      value={newCard.capPeriod}
                      onChange={(e) => setNewCard({...newCard, capPeriod: e.target.value as any})}
                      style={{
                        width: "100%",
                        padding: 8,
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        fontSize: 14
                      }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={addCard}
              disabled={!newCard.name || !newCard.rewardRate}
              style={{
                width: "100%",
                background: newCard.name && newCard.rewardRate ? "#4F46E5" : "#d1d5db",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: 12,
                fontSize: 14,
                cursor: newCard.name && newCard.rewardRate ? "pointer" : "not-allowed",
                marginTop: 8
              }}
            >
              Add Card
            </button>
          </div>
        </div>
      ) : activeTab === 'savings' ? (
        <div>
          {savingsStats ? (
            <div>
              <h4 style={{ margin: 0, marginBottom: 16 }}>Your Savings</h4>
              
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  padding: 16,
                  borderRadius: 8,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
                    ${savingsStats.totalSaved.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>Total Saved</div>
                </div>
                
                <div style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  padding: 16,
                  borderRadius: 8,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
                    ${savingsStats.totalMissed.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>Missed Savings</div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div style={{ marginBottom: 20 }}>
                <h5 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
                  Monthly Breakdown
                </h5>
                <div style={{ space: 8 }}>
                  {savingsStats.monthlyStats.map((monthData, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: idx < savingsStats.monthlyStats.length - 1 ? "1px solid #f3f4f6" : "none"
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {monthData.month}
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                        <span style={{ color: "#10b981" }}>
                          +${monthData.saved.toFixed(2)}
                        </span>
                        <span style={{ color: "#f59e0b" }}>
                          -${monthData.missed.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 12
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: "#475569" }}>
                  💡 Tip
                </div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                  {savingsStats.totalMissed > savingsStats.totalSaved
                    ? "You could be saving more! Check our recommendations when shopping."
                    : "Great job optimizing your credit card usage! Keep it up."}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
              <p style={{ margin: 0, color: "#666" }}>Loading savings data...</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default IndexPopup
