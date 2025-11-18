import React from 'react'
import TeamCard from '../components/TeamCard'
import './Teams.css'

export default function Teams() {
  const [teams, setTeams] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/teams/')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      })
      .then((data) => {
        if (mounted) {
          setTeams(data)
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
  }, [])

  if (loading) return <div>Loading teams...</div>
  if (error) return <div>Error loading teams: {error}</div>

  const sortedTeams = teams?.slice().sort((a, b) => 
    a.abbreviation.localeCompare(b.abbreviation)
  ) || []

  return (
    <div style={{ textAlign: 'left' }}>
      <h2>Teams</h2>
      <div className="teams-grid">
        {sortedTeams.map(team => (
          <TeamCard
            key={team.abbreviation}
            name={team.full_name}
            abbreviation={team.abbreviation}
            teamId={team.id}
          />
        ))}
      </div>
    </div>
  )
}

