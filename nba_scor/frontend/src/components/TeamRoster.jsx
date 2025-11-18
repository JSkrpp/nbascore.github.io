import React from 'react'
import { useNavigate } from 'react-router-dom'
import './TeamRoster.css'

export default function TeamRoster({ roster }) {
  const navigate = useNavigate()

  if (!roster || roster.length === 0) {
    return <div className="roster-empty">No roster data available</div>
  }

  const handlePlayerClick = (playerId) => {
    if (playerId) {
      navigate(`/players/${playerId}`)
    }
  }

  return (
    <div className="team-roster">
      <h3>Roster</h3>
      <div className="roster-table-container">
        <table className="roster-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Height</th>
              <th>Weight</th>
              <th>Age</th>
              <th>Exp</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((player, index) => (
              <tr 
                key={index}
                className="clickable"
                onClick={() => handlePlayerClick(player.player_id)}
              >
                <td>{player.jersey_number || '-'}</td>
                <td className="player-name">{player.player_name}</td>
                <td>{player.position || '-'}</td>
                <td>{player.height || '-'}</td>
                <td>{player.weight || '-'}</td>
                <td>{player.age || '-'}</td>
                <td>{player.experience || 'R'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
