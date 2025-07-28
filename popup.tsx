import { useState, useEffect } from "react"
import type { CreditCard, MerchantCategory, SavingsStats, StorageData } from "~types"
import { storageService } from "~services/storage"
import { savingsTracker } from "~services/savingsTracker"
import { achievementsService } from "~services/achievementsService"

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<'cards' | 'savings' | 'achievements' | 'settings'>('cards')
  const [cards, setCards] = useState<CreditCard[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [savingsStats, setSavingsStats] = useState<SavingsStats | null>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [totalPoints, setTotalPoints] = useState<number>(0)
  const [settings, setSettings] = useState<StorageData['settings']>({
    enableNotifications: true,
    trackSpending: true,
    darkMode: false
  })
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
    loadSettings()
    if (activeTab === 'savings') {
      loadSavingsStats()
    }
    if (activeTab === 'achievements') {
      loadAchievements()
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

  const loadAchievements = async () => {
    const userAchievements = await achievementsService.getUserAchievements()
    setAchievements(userAchievements)
    
    const points = await achievementsService.getTotalPoints()
    setTotalPoints(points)
  }

  const loadSettings = async () => {
    const savedSettings = await storageService.getSettings()
    setSettings(savedSettings)
  }

  const updateSettings = async (newSettings: Partial<StorageData['settings']>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    await storageService.updateSettings(updatedSettings)
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

  // Theme system
  const lightTheme = {
    background: "#ffffff",
    cardBackground: "#ffffff",
    text: "#000000",
    textSecondary: "#666666",
    textMuted: "#999999",
    border: "#e5e7eb",
    primary: "#4F46E5",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    inputBackground: "#ffffff",
    inputBorder: "#d1d5db",
    emptyStateBackground: "#f9fafb"
  }

  const darkTheme = {
    background: "#1f2937",
    cardBackground: "#374151",
    text: "#f9fafb",
    textSecondary: "#d1d5db",
    textMuted: "#9ca3af",
    border: "#4b5563",
    primary: "#6366f1",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    inputBackground: "#374151",
    inputBorder: "#4b5563",
    emptyStateBackground: "#374151"
  }

  const theme = settings.darkMode ? darkTheme : lightTheme

  return (
    <div style={{ width: 400, minHeight: 500, padding: 16, fontFamily: "system-ui", background: theme.background, color: theme.text }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, marginBottom: 12, color: theme.text }}>💳 Credit Card Assistant</h3>
        
        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, marginBottom: 16 }}>
          {[
            { key: 'cards', label: 'Cards' },
            { key: 'savings', label: 'Savings' },
            { key: 'achievements', label: '🏆' },
            { key: 'settings', label: '⚙️' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: tab.key === 'achievements' || tab.key === 'settings' ? 'none' : 1,
                minWidth: tab.key === 'achievements' || tab.key === 'settings' ? 40 : 'auto',
                padding: "8px 12px",
                border: "none",
                background: "none",
                borderBottom: activeTab === tab.key ? `2px solid ${theme.primary}` : "2px solid transparent",
                color: activeTab === tab.key ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === tab.key ? 600 : 400,
                cursor: "pointer",
                fontSize: 14
              }}
            >
              {tab.label}
            </button>
          ))}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
      ) : activeTab === 'achievements' ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, color: theme.text }}>Achievements</h4>
            <div style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
              color: "#1f2937",
              padding: "4px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <span>⭐</span>
              <span>{totalPoints} points</span>
            </div>
          </div>

          {achievements.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {achievements.map((achievement, idx) => (
                <div key={achievement.id} style={{
                  background: achievement.isUnlocked 
                    ? `linear-gradient(135deg, ${achievementsService.getDifficultyColor(achievement.difficulty)}20 0%, ${achievementsService.getDifficultyColor(achievement.difficulty)}10 100%)`
                    : theme.cardBackground,
                  border: achievement.isUnlocked 
                    ? `2px solid ${achievementsService.getDifficultyColor(achievement.difficulty)}40`
                    : `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: 12,
                  opacity: achievement.isUnlocked ? 1 : 0.7
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ 
                      fontSize: 24, 
                      opacity: achievement.isUnlocked ? 1 : 0.5,
                      filter: achievement.isUnlocked ? 'none' : 'grayscale(100%)'
                    }}>
                      {achievement.icon}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: 13, 
                          color: theme.text,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          {achievement.title}
                          <span style={{ 
                            fontSize: 8,
                            background: achievementsService.getDifficultyColor(achievement.difficulty),
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: 4,
                            textTransform: "uppercase",
                            fontWeight: 500
                          }}>
                            {achievement.difficulty}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: theme.success,
                          fontWeight: 600
                        }}>
                          +{achievement.pointsReward}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        color: theme.textSecondary, 
                        marginBottom: 8,
                        lineHeight: 1.4
                      }}>
                        {achievement.description}
                      </div>
                      
                      <div style={{ 
                        width: "100%", 
                        height: 4, 
                        background: theme.border, 
                        borderRadius: 2, 
                        overflow: "hidden",
                        marginBottom: 4
                      }}>
                        <div style={{
                          width: `${achievement.progress}%`,
                          height: "100%",
                          background: achievement.isUnlocked 
                            ? achievementsService.getDifficultyColor(achievement.difficulty)
                            : theme.textMuted,
                          transition: "width 0.3s ease-in-out"
                        }} />
                      </div>
                      
                      <div style={{ 
                        fontSize: 10, 
                        color: theme.textMuted,
                        display: "flex",
                        justifyContent: "space-between"
                      }}>
                        <span>
                          {achievement.currentValue} / {achievement.target}
                        </span>
                        <span>
                          {achievement.progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏆</div>
              <p style={{ margin: 0, color: theme.textSecondary }}>Loading achievements...</p>
            </div>
          )}
        </div>
      ) : activeTab === 'settings' ? (
        <div>
          <h4 style={{ margin: 0, marginBottom: 16, color: theme.text }}>Settings</h4>
          
          {/* Dark Mode Toggle */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            marginBottom: 12,
            background: theme.cardBackground
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: theme.text }}>🌙 Dark Mode</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>Toggle between light and dark themes</div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => updateSettings({ darkMode: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.darkMode ? theme.primary : "#ccc",
                transition: "0.4s",
                borderRadius: 24
              }}>
                <span style={{
                  position: "absolute",
                  height: 18,
                  width: 18,
                  left: settings.darkMode ? 23 : 3,
                  bottom: 3,
                  backgroundColor: "white",
                  transition: "0.4s",
                  borderRadius: "50%"
                }} />
              </span>
            </label>
          </div>

          {/* Notifications Toggle */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            marginBottom: 12,
            background: theme.cardBackground
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: theme.text }}>🔔 Smart Notifications</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>Get alerts for better card choices</div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24 }}>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => updateSettings({ enableNotifications: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.enableNotifications ? theme.primary : "#ccc",
                transition: "0.4s",
                borderRadius: 24
              }}>
                <span style={{
                  position: "absolute",
                  height: 18,
                  width: 18,
                  left: settings.enableNotifications ? 23 : 3,
                  bottom: 3,
                  backgroundColor: "white",
                  transition: "0.4s",
                  borderRadius: "50%"
                }} />
              </span>
            </label>
          </div>

          {/* Extension Info */}
          <div style={{
            background: theme.emptyStateBackground,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: 16,
            textAlign: "center"
          }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>💳</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: theme.text }}>SmartCard AI Assistant</div>
            <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>Version 1.0.0</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>
              Get optimal credit card recommendations and track your savings across 60+ merchants
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default IndexPopup
