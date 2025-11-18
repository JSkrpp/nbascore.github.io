import React from 'react'
import './TeamOverview.css'

export default function TeamOverview({ stats }) {
  if (!stats) return null

  return (
    <div className="team-overview">
      <h2>Team Overview</h2>
      <div className="team-stats-grid">
        <div className="team-stat-item">
          <div className="team-stat-value">{stats.wins}-{stats.losses}</div>
          <div className="team-stat-label">Record</div>
        </div>
        <div className="team-stat-item">
          <div className="team-stat-value">{(stats.win_percentage * 100).toFixed(1)}%</div>
          <div className="team-stat-label">Win Percentage</div>
        </div>
        <div className="team-stat-item">
            <div className="team-stat-value">{stats.conference}</div>
            <div className="team-stat-label">Conference</div>
        </div>
        <div className="team-stat-item">
          <div className="team-stat-value">{stats.conference_rank}</div>
          <div className="team-stat-label">Conference Place</div>
        </div>
        <div className="team-stat-item">
          <div className="team-stat-value">{stats.league_rank}</div>
          <div className="team-stat-label">League Place</div>
        </div>
        <div className="team-stat-item">
          <div className="team-stat-value">{stats.home_record}</div>
          <div className="team-stat-label">Home Record</div>
        </div> 
        <div className="team-stat-item">
          <div className="team-stat-value">{stats.road_record}</div>
          <div className="team-stat-label">Road Record</div>
        </div> 
        <div className="team-stat-item">
          <div className="team-stat-value">{stats.last_10}</div>
          <div className="team-stat-label">Last 10 Games</div>
        </div>  
      </div>
    </div>
  )
}
