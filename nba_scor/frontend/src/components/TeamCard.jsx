import React from 'react'
import './TeamCard.css'
import { useNavigate } from 'react-router-dom'

export default function TeamCard({ name, abbreviation, teamId }) {
  const navigate = useNavigate()
  const logoAbbreviations = {
    'NOP': 'NO',    // New Orleans Pelicans
    'UTA': 'utah'   // Utah Jazz - lowercase for both CDNs
  }
  const logoAbbr = logoAbbreviations[abbreviation] || abbreviation
  const logoUrl = `https://cdn.nba.com/logos/nba/${logoAbbr}/primary/L/logo.svg`

  return (
    <div className="teams-team-card" onClick={() => navigate(`/teams/${teamId}`)} style={{ cursor: 'pointer' }}>
      <img 
        src={logoUrl} 
        alt={`${name} logo`} 
        className="team-logo"
        onError={(e) => {
          const espnAbbr = logoAbbreviations[abbreviation] || abbreviation.toLowerCase()
          e.target.src = `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`
        }}
      />
      <div className="team-info">
        <div className="team-name">{name}</div>
        <div className="team-abbreviation">{abbreviation}</div>
      </div>
    </div>
  )
}