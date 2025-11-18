import React from 'react'
import { Link } from 'react-router-dom'
import './LeadersContainer.css'

export default function BlockLeaders({ leaders }) {
  if (!leaders) return null

  return (
    <div className="blocks-leaders-container">
      <h3>Blocks Leaders</h3>
      <div className="leaders-table">
        <div className="table-header">
          <div className="rank-col">Rank</div>
          <div className="player-col">Player</div>
          <div className="team-col">Team</div>
          <div className="stat-col">GP</div>
          <div className="stat-col">BPG</div>
        </div>
        {leaders.map((leader) => (
          <Link
            to={`/players/${leader.player_id}`}
            key={leader.player_id}
            className="leader-row"
          >
            <div className="rank-col">
              <span className="rank-badge">{leader.rank}</span>
            </div>
            <div className="player-col">{leader.player_name}</div>
            <div className="team-col">{leader.team}</div>
            <div className="stat-col">{leader.games_played}</div>
            <div className="stat-col blocks-highlight">{leader.blocks.toFixed(1)}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
