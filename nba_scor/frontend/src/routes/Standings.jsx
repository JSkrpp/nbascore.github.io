import React from 'react'
import ConferenceContainer from '../components/ConferenceContainer'
import './Standings.css'

export default function Standings() {
  const [easternStandings, setEasternStandings] = React.useState(null)
  const [westernStandings, setWesternStandings] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    
    fetch('/api/standings/')
      .then(res => {
        if (!res.ok) throw new Error(res.statusText || 'Network error')
        return res.json()
      })
      .then((data) => {
        if (mounted) {
          setEasternStandings(data.eastern_conference)
          setWesternStandings(data.western_conference)
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

  if (loading) return <div className="standings-loading">Loading standings...</div>
  if (error) return <div className="standings-error">Error loading standings: {error}</div>

  return (
    <div className="standings-page">
      <h1>League Standings</h1>
      <div className="standings-content">
        <ConferenceContainer conference="Western" standings={westernStandings} />
        <ConferenceContainer conference="Eastern" standings={easternStandings} />
      </div>
    </div>
  )
}
