import React from 'react'
import { Link } from 'react-router-dom'
import './LiveGameCard.css'

export default function LiveGameCard({ game }) {
  const homeTeam = game.homeTeam
  const awayTeam = game.awayTeam

  // Status info
  const gameStatus = game.gameStatusText || 'Scheduled'
  const period = game.period || 0
  const gameClock = game.gameClock || ''

  // Convert game time to user's local timezone
  const getLocalGameTime = () => {
    if (game.gameTimeUTC) { // default is UTC time
      const gameDate = new Date(game.gameTimeUTC)
      return gameDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    if (game.gameEt) {
      return gameStatus
    }
    return gameStatus
  }
 
  // Helper: team logo (with a couple of special cases)
  const getTeamLogo = (teamTricode) => {
    const logoAbbreviations = {
      UTA: 'utah',
      NOP: 'NO',
    }
    const logoAbbr = logoAbbreviations[teamTricode] || teamTricode
    return `https://a.espncdn.com/i/teamlogos/nba/500/${logoAbbr}.png`
  }

  // Period label text
  const getPeriodLabel = (p) => {
    if (p === 0) return 'Not Started'
    if (p <= 4) return `Q${p}`
    return `OT${p - 4}`
  }

  // Per-period scores (ensure 4 quarters minimum, add OTs dynamically)
  const getPeriodScores = (team) => {
    if (!team.periods || team.periods.length === 0) {
      return ['-', '-', '-', '-']
    }
    const scores = team.periods.map((p) => p.score || 0)
    while (scores.length < 4) scores.push('-')
    return scores
  }

  const homeScores = getPeriodScores(homeTeam)
  const awayScores = getPeriodScores(awayTeam)

  const isLive = game.gameStatus === 2
  const isFinished = game.gameStatus === 3
  const isScheduled = game.gameStatus === 1

  return (
    <Link to={`/games/${game.gameId}`} className="game-card-link">
      <div className={`live-game-card ${isLive ? 'live' : ''} ${isFinished ? 'finished' : ''}`}>
        {/* Header */}
        <div className="game-status-header">
          <span className="game-time">
            {isLive && <span className="live-indicator">● LIVE</span>}
            {isScheduled && getLocalGameTime()}
            {isFinished && 'FINAL'}
          </span>
          {isLive && <span className="game-clock">{getPeriodLabel(period)} {gameClock}</span>}
        </div>

      {/* Teams */}
      <div className="teams-section">
        {/* Away */}
        <div className="team-row">
          <div className="team-info-left">
            <img
              src={getTeamLogo(awayTeam.teamTricode)}
              alt={`${awayTeam.teamName} logo`}
              className="team-logo-small"
            />
            <div className="team-name-info">
              <span className="team-city">{awayTeam.teamCity}</span>
              <span className="team-name">{awayTeam.teamName}</span>
            </div>
          </div>
          <div className="team-score">{isScheduled ? 0 : (awayTeam.score || 0)}</div>
        </div>

        {/* Home */}
        <div className="team-row">
          <div className="team-info-left">
            <img
              src={getTeamLogo(homeTeam.teamTricode)}
              alt={`${homeTeam.teamName} logo`}
              className="team-logo-small"
            />
            <div className="team-name-info">
              <span className="team-city">{homeTeam.teamCity}</span>
              <span className="team-name">{homeTeam.teamName}</span>
            </div>
          </div>
          <div className="team-score">{isScheduled ? 0 : (homeTeam.score || 0)}</div>
        </div>
      </div>

      {/* Quarter by Quarter */}
      {!isScheduled && (
        <div className="quarters-section">
          <table className="quarters-table">
            <thead>
              <tr>
                <th className="team-col">Team</th>
                <th>Q1</th>
                <th>Q2</th>
                <th>Q3</th>
                <th>Q4</th>
                {awayTeam.periods && awayTeam.periods.length > 4 &&
                  awayTeam.periods.slice(4).map((_, idx) => (
                    <th key={`ot-head-${idx}`}>OT{idx + 1}</th>
                  ))}
                <th className="total-col">T</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="team-abbr">{awayTeam.teamTricode}</td>
                {awayScores.map((s, i) => (
                  <td key={`a-${i}`}>{s}</td>
                ))}
                {awayTeam.periods && awayTeam.periods.length > 4 &&
                  awayTeam.periods.slice(4).map((p, idx) => (
                    <td key={`a-ot-${idx}`}>{p.score || 0}</td>
                  ))}
                <td className="total-score">{awayTeam.score || 0}</td>
              </tr>
              <tr>
                <td className="team-abbr">{homeTeam.teamTricode}</td>
                {homeScores.map((s, i) => (
                  <td key={`h-${i}`}>{s}</td>
                ))}
                {homeTeam.periods && homeTeam.periods.length > 4 &&
                  homeTeam.periods.slice(4).map((p, idx) => (
                    <td key={`h-ot-${idx}`}>{p.score || 0}</td>
                  ))}
                <td className="total-score">{homeTeam.score || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      </div>
    </Link>
  )
}
