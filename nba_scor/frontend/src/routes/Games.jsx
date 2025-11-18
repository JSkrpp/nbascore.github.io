import React from 'react'
import GameCard from '../components/GameCard'
import './Games.css'

export default function Games() {
  const [selectedDate, setSelectedDate] = React.useState(new Date())
  const [games, setGames] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  // Format date for display
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Format date for API calls (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Handle date picker change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value + 'T00:00:00')
    setSelectedDate(newDate)
  }

  // Go to previous day
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  // Go to next day
  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  // Fetch games when date changes
  React.useEffect(() => {
    const dateStr = formatDateForAPI(selectedDate)
    setLoading(true)
    
    fetch(`/api/games/date/${dateStr}/`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      })
      .then((data) => {
        setGames(data)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || String(err))
        setLoading(false)
      })
  }, [selectedDate])

  return (
    <div className="games-page">
      <h1>Games</h1>
      
      <div className="date-selector">
        <button onClick={handlePreviousDay} className="nav-btn" aria-label="Previous day">
          ◀
        </button>
        
        <div className="date-input-wrapper">
          <input
            id="game-date"
            type="date"
            value={formatDateForAPI(selectedDate)}
            onChange={handleDateChange}
            className="date-input"
          />
          <button 
            className="calendar-btn" 
            onClick={() => document.getElementById('game-date').showPicker()}
            aria-label="Open calendar"
          >
            📅
          </button>
        </div>
        
        <button onClick={handleNextDay} className="nav-btn" aria-label="Next day">
          ▶
        </button>
      </div>

      <div className="date-display">
        <h2>{formatDateDisplay(selectedDate)}</h2>
      </div>

      {loading && <div className="games-loading">Loading games...</div>}
      {error && <div className="games-error">Error: {error}</div>}
      
      {!loading && !error && games.length === 0 && (
        <div className="no-games">No games scheduled for this date</div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="games-grid">
          {games.map((game) => (
            <GameCard key={game.gameId} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
