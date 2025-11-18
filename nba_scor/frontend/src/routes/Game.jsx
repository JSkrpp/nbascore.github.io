import React from 'react'
import { useParams } from 'react-router-dom'
import GameBoxscore from '../components/GameBoxscore'
import './Game.css'

export default function Game() {
  const { gameId } = useParams()

  return (
    <div className="game-page">
      <GameBoxscore gameId={gameId} />
    </div>
  )
}
