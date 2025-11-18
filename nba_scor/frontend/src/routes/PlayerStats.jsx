import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PlayerStatsCard from '../components/PlayerStatsCard'
import GameByGame from '../components/GameByGame'
import './PlayerStats.css'

export default function PlayerStats() {
  const { playerId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [playerName, setPlayerName] = React.useState('')
  const [teamInfo, setTeamInfo] = React.useState(null)
  const [photoUrl, setPhotoUrl] = React.useState('')
  const [currentStats, setCurrentStats] = React.useState(null)
  const [statsLoading, setStatsLoading] = React.useState(true)
  const [statsError, setStatsError] = React.useState(null)


  const getTeamLogoUrl = (abbreviation) => { // special abbreviation cases
    const logoAbbreviations = {
      'NOP': 'NO',    
      'UTA': 'utah'   
    }
    const logoAbbr = logoAbbreviations[abbreviation] || abbreviation
    return `https://cdn.nba.com/logos/nba/${logoAbbr}/primary/L/logo.svg`
  }

  const handleLogoError = (e, abbreviation) => {
    const logoAbbreviations = {
      'NOP': 'NO',
      'UTA': 'utah'
    }
    const espnAbbr = logoAbbreviations[abbreviation] || abbreviation.toLowerCase()
    e.target.src = `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`
  }

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`/api/players/${playerId}/`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      })
      .then((data) => {
        if (!mounted) return
        
        // The backend returns player_info as an object with full_name, first_name, last_name, etc.
        if (data.player_info) {
          const info = data.player_info
          // Try full_name first, then construct from first_name + last_name
          const name = info.full_name || `${info.first_name || ''} ${info.last_name || ''}`.trim() || 'Unknown Player'
          setPlayerName(name)
        } else {
          setPlayerName('Unknown Player')
        }

        // Set team info if available
        if (data.team_info) {
          setTeamInfo(data.team_info)
        }

        setPhotoUrl('https://cdn.nba.com/headshots/nba/latest/1040x760/' + playerId + '.png')
        setError(null)
      })
      .catch((err) => {
        setError(err.message || String(err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [playerId])

  React.useEffect(() => {
    let mounted = true
    setStatsLoading(true)
    fetch(`/api/players/${playerId}/current/`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      })
      .then((data) => {
        if (!mounted) return
        setCurrentStats(data)
        setStatsError(null)
      })
      .catch((err) => {
        if (mounted) setStatsError(err.message || String(err))
      })
      .finally(() => {
        if (mounted) setStatsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [playerId])

  if (loading) return <div>Loading player...</div>
  if (error) return <div>Error loading player: {error}</div>

  return (
    <div className="player-stats-container">
      <h2>{playerName}</h2>
      {photoUrl && (
        <div className="player-photo-container">
          <img src={photoUrl} alt={playerName} className="player-photo" />
        </div>
      )}
      
      {teamInfo && teamInfo.team_abbreviation && (

        <div className="player-team">
          <h3 >Team: </h3>
          <img
            onClick={() => navigate(`/teams/${teamInfo.team_id}`)} style={{ cursor: 'pointer' }}
            src={getTeamLogoUrl(teamInfo.team_abbreviation)} 
            alt={`${teamInfo.team_name} logo`}
            className="team-logo-small"
            onError={(e) => handleLogoError(e, teamInfo.team_abbreviation)}
          />
          <span className="player-team-name" onClick={() => navigate(`/teams/${teamInfo.team_id}`)} style={{ cursor: 'pointer' }}>
            {teamInfo.team_city} {teamInfo.team_name} ({teamInfo.team_abbreviation})
          </span>
        </div>
      )}
      <div className = "player-stats-section">
        <PlayerStatsCard stats={currentStats} loading={statsLoading} error={statsError} />
        <GameByGame playerId={playerId} />
      </div>
    </div>
  )
}
