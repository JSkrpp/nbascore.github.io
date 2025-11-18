import React from 'react'
import './ConferenceContainer.css'
import { useNavigate } from 'react-router-dom'

export default function ConferenceContainer({ conference, standings }) {
  const navigate = useNavigate()
  if (!standings) return null

  return (
    <div className="conference-container">
      <h2>{conference} Conference</h2>
      <div className="standings-table">
        <div className="standings-header">
          <div className="rank-col">#</div>
          <div className="team-col">Team</div>
          <div className="record-col">W</div>
          <div className="record-col">L</div>
          <div className="pct-col">PCT</div>
          <div className="gb-col">GD</div>
          <div className="streak-col">Streak</div>
        </div>
        {standings.map((team) => (
          <div key={team.team_id} className="standings-row">
            <div className="rank-col">
              <span className="rank-number">{team.rank}</span>
            </div>
            <div className="team-col" onClick={() => navigate(`/teams/${team.team_id}`)} style={{ cursor: 'pointer' }}>
              <span className="team-city">{team.team_city}</span>
              <span className="team-name-text">{team.team_name}</span>
            </div>
            <div className="record-col wins">{team.wins}</div>
            <div className="record-col losses">{team.losses}</div>
            <div className="pct-col">{team.win_pct.toFixed(3)}</div>
            <div className="gb-col">{team.games_back === '0' ? '-' : team.games_back}</div>
            <div className="streak-col">{team.streak}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
