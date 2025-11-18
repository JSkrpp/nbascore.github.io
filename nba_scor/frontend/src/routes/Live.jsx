import React from 'react'
import LiveGameCard from '../components/LiveGameCard'
import './Live.css'

export default function Live() {
  const [games, setGames] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [lastUpdate, setLastUpdate] = React.useState(null)

  const fetchLiveGames = React.useCallback(() => {
    fetch('/api/live/')
      .then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      })
      .then((data) => {
        setGames(data)
        setLastUpdate(new Date())
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || String(err))
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchLiveGames()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveGames, 30000)

    return () => clearInterval(interval)
  }, [fetchLiveGames])

  if (loading) return <div className="live-loading">Loading live games...</div>
  if (error) return <div className="live-error">Error loading live games: {error}</div>

  return (
    <div className="live-page">
      <div className="live-header">
        <h1>Live Games</h1>
        <div className="live-info">
          {lastUpdate && (
            <span className="last-update">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button className="refresh-btn" onClick={fetchLiveGames}>
            Refresh
          </button>
        </div>
      </div>
      
      {games.length === 0 ? (
        <div className="no-games">
          <p>No live games at the moment</p>
          <p className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
            <LiveGameCard key={game.gameId} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
