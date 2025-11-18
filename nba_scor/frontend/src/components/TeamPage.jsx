import React from 'react'
import { useParams } from 'react-router-dom'
import TeamOverview from './TeamOverview'
import TeamAverages from './TeamAverages'
import TeamRoster from './TeamRoster'
import TeamGameLog from './TeamGameLog'
import './TeamPage.css'

export default function TeamPage() {
  const { teamId } = useParams()
  const [team, setTeam] = React.useState(null)
  const [teamStats, setTeamStats] = React.useState(null)
  const [teamAverages, setTeamAverages] = React.useState(null)
  const [teamRoster, setTeamRoster] = React.useState(null)
  const [teamGameLog, setTeamGameLog] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    
    // Fetch all team data in parallel
    Promise.all([
      fetch(`/api/teams/`).then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      }),
      fetch(`/api/teams/${teamId}/stats/`).then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      }),
      fetch(`/api/teams/${teamId}/averages/`).then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      }),
      fetch(`/api/teams/${teamId}/roster/`).then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      }),
      fetch(`/api/teams/${teamId}/gamelog/`).then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      })
    ])
      .then(([teamsData, statsData, averagesData, rosterData, gameLogData]) => {
        if (mounted) {
          const foundTeam = teamsData.find(t => t.id === parseInt(teamId))
          setTeam(foundTeam)
          setTeamStats(statsData)
          setTeamAverages(averagesData)
          setTeamRoster(rosterData)
          setTeamGameLog(gameLogData)
          setError(null)
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || String(err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [teamId])

  if (loading) return <div>Loading team...</div>
  if (error) return <div>Error loading team: {error}</div>
  if (!team) return <div>Team not found</div>

  const logoAbbreviations = {
    'NOP': 'NO',
    'UTA': 'utah'
  }
  const logoAbbr = logoAbbreviations[team.abbreviation] || team.abbreviation
  const logoUrl = `https://cdn.nba.com/logos/nba/${logoAbbr}/primary/L/logo.svg`

  return (
    <div className='teams-team-page'>
      <img 
        src={logoUrl} 
        alt={`${team.full_name} logo`}
        style={{ width: '200px', height: '200px' }}
        onError={(e) => {
          const espnAbbr = logoAbbreviations[team.abbreviation] || team.abbreviation.toLowerCase()
          e.target.src = `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`
        }}
      />
      <h1>{team.full_name}</h1>
      <div className='team-stats-row'>
        <TeamOverview stats={teamStats} />
        <TeamAverages averages={teamAverages} />
      </div>
      <div className='team-stats-row'>
        <TeamRoster roster={teamRoster} />
        <TeamGameLog gameLog={teamGameLog} />
      </div>
    </div>
  )
}
