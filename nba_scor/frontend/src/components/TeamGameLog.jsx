import React from 'react'
import { useNavigate } from 'react-router-dom'
import './TeamGameLog.css'

export default function TeamGameLog({ gameLog }) {
  const navigate = useNavigate()

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatMatchup = (matchup) => {
    if (!matchup) return '-'
    return matchup.replace(/\s+/g, ' ')
  }

  const handleGameClick = (gameId) => {
    if (gameId) {
      navigate(`/games/${gameId}`)
    }
  }

  if (!gameLog || gameLog.length === 0) {
    return <div className="team-gamelog-empty">No games found</div>
  }

  return (
    <div className="team-game-log">
      <h3>Game Log</h3>
      <div className="team-gamelog-table-container">
        <table className="team-gamelog-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Matchup</th>
              <th>WL</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>BLK</th>
              <th>FG</th>
              <th>FG%</th>
              <th>3PT</th>
              <th>3P%</th>
              <th>FT</th>
              <th>FT%</th>
              <th>TO</th>
            </tr>
          </thead>
          <tbody>
            {gameLog.map((game, index) => (
              <tr 
                key={index} 
                className={`${game.WL === 'W' ? 'win' : 'loss'} clickable`}
                onClick={() => handleGameClick(game.Game_ID)}
              >
                <td>{formatDate(game.GAME_DATE)}</td>
                <td className="matchup">{formatMatchup(game.MATCHUP)}</td>
                <td className={`wl ${game.WL === 'W' ? 'win-text' : 'loss-text'}`}>{game.WL || '-'}</td>
                <td className="pts">{game.PTS || 0}</td>
                <td>{game.REB || 0}</td>
                <td>{game.AST || 0}</td>
                <td>{game.STL || 0}</td>
                <td>{game.BLK || 0}</td>
                <td>{game.FGM || 0}/{game.FGA || 0}</td>
                <td>{game.FG_PCT ? (game.FG_PCT * 100).toFixed(1) + '%' : '-'}</td>
                <td>{game.FG3M || 0}/{game.FG3A || 0}</td>
                <td>{game.FG3_PCT ? (game.FG3_PCT * 100).toFixed(1) + '%' : '-'}</td>
                <td>{game.FTM || 0}/{game.FTA || 0}</td>
                <td>{game.FT_PCT ? (game.FT_PCT * 100).toFixed(1) + '%' : '-'}</td>
                <td>{game.TOV || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
