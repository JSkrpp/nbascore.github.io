import React from 'react'
import './PlayerStatsCard.css'

export default function PlayerStatsCard({ stats, loading, error }) {
  if (loading) return <div className="stats-loading">Loading stats...</div>
  if (error) return <div className="stats-error">Error loading stats: {error}</div>
  if (!stats) return null

  // Check if player hasn't played this season
  if (stats.has_played === false || stats.games_played === 0) {
    return (
      <div className="player-stats-card">
        <h3>Current Season Stats (Per Game)</h3>
        <div className="no-stats-message">
          <p>This player has not played any games in the {stats.season || '2024-25'} season yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="player-stats-card">
      <h3>Current Season Stats (Per Game) - {stats.season || '2024-25'}</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.points?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Points</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.rebounds?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Rebounds</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.assists?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Assists</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.steals?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Steals</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.blocks?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Blocks</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.games_played || 0}</div>
          <div className="stat-label">Games Played</div>
        </div>
      </div>
      <div className="shooting-stats">
        <h4>Shooting Percentages</h4>
        <div className="percentages-grid">
          <div className="percentage-item">
            <div className="percentage-value">{((stats.field_goal_pct || 0) * 100).toFixed(1)}%</div>
            <div className="percentage-label">FG%</div>
          </div>
          <div className="percentage-item">
            <div className="percentage-value">{((stats.three_point_pct || 0) * 100).toFixed(1)}%</div>
            <div className="percentage-label">3P%</div>
          </div>
          <div className="percentage-item">
            <div className="percentage-value">{((stats.free_throw_pct || 0) * 100).toFixed(1)}%</div>
            <div className="percentage-label">FT%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
