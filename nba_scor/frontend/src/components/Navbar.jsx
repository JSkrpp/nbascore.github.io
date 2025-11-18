import React from 'react'
import './Navbar.css'
import { Link, Routes, Route } from 'react-router-dom'
import logo from '../assets/logo.webp'
import Teams from '../routes/Teams'
import Players from '../routes/Players'
import PlayerStats from '../routes/PlayerStats'
import Leaders from '../routes/Leaders'
import Standings from '../routes/Standings'
import Live from '../routes/Live'
import Game from '../routes/Game'
import Games from '../routes/Games'
import TeamPage from '../components/TeamPage'

function Home() {
  return (
    <div>
      <h1 style={{ fontFamily: 'system-ui, Arial, sans-serif', color: '#222' }}>Welcome</h1>
    </div>
  )
}

export default function Navbar() {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            <img src={logo} alt="NBA Scores" className="logo-image" />
          </Link>
        </div>
        <div className="navbar-links">
          <Link to="/live" className="nav-link">🔴 Live</Link>
          <Link to="/games" className="nav-link">Games</Link>
          <Link to="/players" className="nav-link">Players</Link>
          <Link to="/teams" className="nav-link">Teams</Link>
          <Link to="/leaders" className="nav-link">Leaders</Link>
          <Link to="/standings" className="nav-link">Standings</Link>
        </div>
        <div className="navbar-spacer"></div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:gameId" element={<Game />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:playerId" element={<PlayerStats />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamPage />} />
          <Route path="/leaders" element={<Leaders />} />
          <Route path="/standings" element={<Standings />} />
        </Routes>
      </main>
    </>
  )
}