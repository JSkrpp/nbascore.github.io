import React, { use } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './GameBoxscore.css'

export default function GameBoxscore({ gameId }) {
  const navigate = useNavigate()
  const [boxscore, setBoxscore] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    if (!gameId) return

    setLoading(true)
    fetch(`/api/games/${gameId}/`)
      .then(res => {
        if (!res.ok) {
          // Check if it's a bad request (400) which likely means game hasn't started
          if (res.status === 400) {
            throw new Error('GAME_NOT_STARTED')
          }
          throw new Error(res.statusText || 'Network error')
        }
        return res.json()
      })
      .then((data) => {
        setBoxscore(data)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        const errorMsg = err.message === 'GAME_NOT_STARTED' 
          ? 'Game has not started yet, boxscore not available'
          : (err.message || String(err))
        setError(errorMsg)
        setLoading(false)
      })
  }, [gameId])

  if (loading) return <div className="boxscore-loading">Loading boxscore...</div>
  if (error) return <div className="boxscore-error">Error loading boxscore: {error}</div>
  if (!boxscore) return null

  const { home_team, away_team, game_status_text, period, game_clock } = boxscore

  // Helpers for status/clock display
  const getPeriodLabel = (p) => {
    if (!p || p <= 0) return ''
    return p <= 4 ? `Q${p}` : `OT${p - 4}`
  }

  const formatClock = (clock) => {
    if (!clock) return ''
    // Expected formats like "PT05M23.12S" or "PT00M00.00S"
    if (typeof clock === 'string' && clock.startsWith('PT')) {
      const m = clock.match(/^PT(\d{1,2})M(\d{1,2}(?:\.\d{1,2})?)S$/)
      if (m) {
        const mm = m[1].padStart(2, '0')
        const ss = m[2]
        return `${mm}:${ss}`
      }
      // Fallback: strip PT/M/S characters
      return clock.replace(/^PT/, '').replace('M', ':').replace('S', '')
    }
    return String(clock)
  }

  // Ensure minutes display as MM:SS for player minutes
  const formatMinutes = (value) => {
    if (value === null || value === undefined) return '00:00'
    const v = String(value)
    if (v === '0' || v === '0.0') return '00:00'
    if (v.includes(':')) return v // already in MM:SS (or M:SS)
    if (v.startsWith('PT')) {
      const m = v.match(/^PT(\d{1,3})M(\d{1,2})(?:\.\d+)?S$/)
      if (m) {
        const mm = m[1].padStart(2, '0')
        const ssInt = String(Math.floor(Number(m[2]))).padStart(2, '0')
        return `${mm}:${ssInt}`
      }
      // generic strip if pattern unexpected
      const stripped = v.replace(/^PT/, '').replace('S', '')
      const parts = stripped.split('M')
      if (parts.length === 2) {
        const mm = parts[0].padStart(2, '0')
        const ssInt = String(Math.floor(Number(parts[1]))).padStart(2, '0')
        return `${mm}:${ssInt}`
      }
    }
    // If it's a pure number of seconds, convert to mm:ss
    if (!Number.isNaN(Number(v))) {
      const total = Math.floor(Number(v))
      const mm = String(Math.floor(total / 60)).padStart(2, '0')
      const ss = String(total % 60).padStart(2, '0')
      return `${mm}:${ss}`
    }
    return v
  }

  const isFinished = typeof game_status_text === 'string' && game_status_text.toLowerCase().includes('final')
  const isLive = !isFinished && !!game_clock

  // Format percentages to 0-100 with 1 decimal place
  const formatPct = (value) => {
    if (value === null || value === undefined) return '-'
    const num = Number(value)
    if (Number.isNaN(num)) return '-'
    const scaled = num <= 1 ? num * 100 : num
    return `${scaled.toFixed(1)}%`
  }

  const renderPlayerCell = (player) => {
    const id = player.player_id
    const display = (
      <>
        {player.name} {player.position && `(${player.position})`}
      </>
    )
    if (!id) return display
    return (
      <Link className="player-link" to={`/players/${id}`}>
        {display}
      </Link>
    )
  }

  return (
    <div className="game-boxscore">
      {/* Game Header */}
      <div className="boxscore-header">
        <h2>Game Boxscore</h2>
        <div className="game-status">
          {isFinished
            ? (period > 4 ? `Final - OT${period - 4}` : 'Final')
            : (isLive
                ? `${getPeriodLabel(period)} ${formatClock(game_clock)}`
                : game_status_text)}
        </div>
      </div>

      {/* Score Summary */}
      <div className="score-summary">
        <div className="team-summary">
          <h3 className = "box-team-name" onClick={() => navigate(`/teams/${away_team.team_id}`)} style={{ cursor: 'pointer' }}>{away_team.team_city} {away_team.team_name}</h3>
          <div className="team-score-big">{away_team.score}</div>
        </div>
        <div className="team-summary">
          <h3 className = "box-team-name" onClick={() => navigate(`/teams/${home_team.team_id}`)} style={{ cursor: 'pointer' }}>{home_team.team_city} {home_team.team_name}</h3>
          <div className="team-score-big">{home_team.score}</div>
        </div>
      </div>

      {/* Team Statistics Comparison */}
      <div className="team-stats-comparison">
        <h3>Team Statistics</h3>
        <table className="stats-table">
          <thead>
            <tr>
              <th>{away_team.team_tricode}</th>
              <th>Stat</th>
              <th>{home_team.team_tricode}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{away_team.statistics.fg_made}/{away_team.statistics.fg_attempted}</td>
              <td>FG</td>
              <td>{home_team.statistics.fg_made}/{home_team.statistics.fg_attempted}</td>
            </tr>
            <tr>
              <td>{formatPct(away_team.statistics.fg_percentage)}</td>
              <td>FG%</td>
              <td>{formatPct(home_team.statistics.fg_percentage)}</td>
            </tr>
            <tr>
              <td>{away_team.statistics.three_pt_made}/{away_team.statistics.three_pt_attempted}</td>
              <td>3PT</td>
              <td>{home_team.statistics.three_pt_made}/{home_team.statistics.three_pt_attempted}</td>
            </tr>
            <tr>
              <td>{formatPct(away_team.statistics.three_pt_percentage)}</td>
              <td>3PT%</td>
              <td>{formatPct(home_team.statistics.three_pt_percentage)}</td>
            </tr>
            <tr>
              <td>{away_team.statistics.ft_made}/{away_team.statistics.ft_attempted}</td>
              <td>FT</td>
              <td>{home_team.statistics.ft_made}/{home_team.statistics.ft_attempted}</td>
            </tr>
            <tr>
              <td>{formatPct(away_team.statistics.ft_percentage)}</td>
              <td>FT%</td>
              <td>{formatPct(home_team.statistics.ft_percentage)}</td>
            </tr>
            <tr>
              <td>{away_team.statistics.rebounds_total}</td>
              <td>REB</td>
              <td>{home_team.statistics.rebounds_total}</td>
            </tr>
            <tr>
              <td>{away_team.statistics.assists}</td>
              <td>AST</td>
              <td>{home_team.statistics.assists}</td>
            </tr>
            <tr>
              <td>{away_team.statistics.steals}</td>
              <td>STL</td>
              <td>{home_team.statistics.steals}</td>
            </tr>
            <tr>
              <td>{away_team.statistics.blocks}</td>
              <td>BLK</td>
              <td>{home_team.statistics.blocks}</td>
            </tr>
            <tr>
              <td>{away_team.statistics.turnovers}</td>
              <td>TO</td>
              <td>{home_team.statistics.turnovers}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Player Stats - Side by Side */}
      <div className="player-stats-container">
        {/* Away Team Player Stats */}
        <div className="boxscore-players-section">
          <h3>{away_team.team_city} {away_team.team_name}</h3>
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>MIN</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>STL</th>
                  <th>BLK</th>
                  <th>FG</th>
                  <th>3PT</th>
                  <th>FT</th>
                  <th>+/-</th>
                </tr>
              </thead>
              <tbody>
                {away_team.players
                  .filter(p => p.starter)
                  .map((player) => (
                    <tr key={player.player_id} className="starter">
                      <td className="player-name">{renderPlayerCell(player)}</td>
                      <td>{formatMinutes(player.minutes)}</td>
                      <td>{player.points}</td>
                      <td>{player.rebounds}</td>
                      <td>{player.assists}</td>
                      <td>{player.steals}</td>
                      <td>{player.blocks}</td>
                      <td>{player.fg_made}/{player.fg_attempted}</td>
                      <td>{player.three_pt_made}/{player.three_pt_attempted}</td>
                      <td>{player.ft_made}/{player.ft_attempted}</td>
                      <td>{player.plus_minus > 0 ? '+' : ''}{player.plus_minus}</td>
                    </tr>
                  ))}
                {away_team.players
                  .filter(p => !p.starter)
                  .map((player) => (
                    <tr key={player.player_id}>
                      <td className="player-name">{renderPlayerCell(player)}</td>
                      <td>{formatMinutes(player.minutes)}</td>
                      <td>{player.points}</td>
                      <td>{player.rebounds}</td>
                      <td>{player.assists}</td>
                      <td>{player.steals}</td>
                      <td>{player.blocks}</td>
                      <td>{player.fg_made}/{player.fg_attempted}</td>
                      <td>{player.three_pt_made}/{player.three_pt_attempted}</td>
                      <td>{player.ft_made}/{player.ft_attempted}</td>
                      <td>{player.plus_minus > 0 ? '+' : ''}{player.plus_minus}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Home Team Player Stats */}
        <div className="boxscore-players-section">
          <h3>{home_team.team_city} {home_team.team_name}</h3>
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>MIN</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>STL</th>
                  <th>BLK</th>
                  <th>FG</th>
                  <th>3PT</th>
                  <th>FT</th>
                  <th>+/-</th>
                </tr>
              </thead>
              <tbody>
                {home_team.players
                  .filter(p => p.starter)
                  .map((player) => (
                    <tr key={player.player_id} className="starter">
                      <td className="player-name">{renderPlayerCell(player)}</td>
                      <td>{formatMinutes(player.minutes)}</td>
                      <td>{player.points}</td>
                      <td>{player.rebounds}</td>
                      <td>{player.assists}</td>
                      <td>{player.steals}</td>
                      <td>{player.blocks}</td>
                      <td>{player.fg_made}/{player.fg_attempted}</td>
                      <td>{player.three_pt_made}/{player.three_pt_attempted}</td>
                      <td>{player.ft_made}/{player.ft_attempted}</td>
                      <td>{player.plus_minus > 0 ? '+' : ''}{player.plus_minus}</td>
                    </tr>
                  ))}
                {home_team.players
                  .filter(p => !p.starter)
                  .map((player) => (
                    <tr key={player.player_id}>
                      <td className="player-name">{renderPlayerCell(player)}</td>
                      <td>{formatMinutes(player.minutes)}</td>
                      <td>{player.points}</td>
                      <td>{player.rebounds}</td>
                      <td>{player.assists}</td>
                      <td>{player.steals}</td>
                      <td>{player.blocks}</td>
                      <td>{player.fg_made}/{player.fg_attempted}</td>
                      <td>{player.three_pt_made}/{player.three_pt_attempted}</td>
                      <td>{player.ft_made}/{player.ft_attempted}</td>
                      <td>{player.plus_minus > 0 ? '+' : ''}{player.plus_minus}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
