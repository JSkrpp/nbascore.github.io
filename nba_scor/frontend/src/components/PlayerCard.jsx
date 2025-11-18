import React from "react";
import "./PlayerCard.css";

export default function PlayerCard({firstName, lastName}){
    return (
        <div className="player-card">
            <div className="player-last-name">{lastName}, </div>
            <div className="player-first-name"> {firstName}</div>
        </div>
    )
}