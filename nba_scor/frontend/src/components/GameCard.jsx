import React from 'react'
import { Link } from 'react-router-dom'
import './GameCard.css'

export default function GameCard({ game }) {
  if (!game) return null

  const homeTeam = game.homeTeam
  const awayTeam = game.awayTeam
  const gameStatus = game.gameStatus || 1
  const gameClock = game.gameClock || ''
  const period = game.period || 0


  return (
    <Link to={`/games/${game.gameId}`} className="game-card">
      <div className="teams">
        <div className="team-row">
          <span className="team-code">{awayTeam.teamTricode}</span>
          <span className="team-score">{awayTeam.score}</span>
        </div>
        <div className="team-row">
          <span className="team-code">{homeTeam.teamTricode}</span>
          <span className="team-score">{homeTeam.score}</span>
        </div>
      </div>
    </Link>
  )
}
