from django.shortcuts import render
from django.http import JsonResponse, Http404
from nba_api.stats.static import teams, players
import pandas as pd
from nba_api.stats.endpoints import playercareerstats, playergamelog, commonallplayers, playerdashboardbyyearoveryear, leagueleaders, leaguestandingsv3, boxscoretraditionalv2, scoreboardv2, PlayerGameLog, teamdashboardbygeneralsplits, commonteamroster, teamgamelogs
from nba_api.live.nba.endpoints import scoreboard, boxscore
from datetime import date


def get_current_season():
    today = date.today()
    year = today.year
    month = today.month
    if month >= 10:  # Season starts in October
        return f"{year}-{str(year + 1)[-2:]}"
    else:
        return f"{year - 1}-{str(year)[-2:]}"
    
def get_player_game_log(request, player_id):
    try:
        season = get_current_season()

        response = PlayerGameLog(
            player_id=player_id,
            season=season
        )

        gamelog = response.get_data_frames()[0].to_dict(orient='records')

        return JsonResponse(gamelog, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)      
    

def live_game(request):
    try:
        # Get the lightweight scoreboard first
        scoreboard_data = scoreboard.ScoreBoard()
        games_json = scoreboard_data.get_dict()
        games = games_json['scoreboard']['games']
        
        # For games that are live (gameStatus == 2), fetch real-time boxscore data
        enhanced_games = []
        for game in games:
            game_status = game.get('gameStatus', 1)
            
            # If game is live (status 2), get real-time scores from boxscore
            if game_status == 2:
                try:
                    game_id = game.get('gameId')
                    live_boxscore = boxscore.BoxScore(game_id=game_id)
                    boxscore_data = live_boxscore.get_dict()
                    
                    # Extract real-time scores and update the game object
                    box_game = boxscore_data.get('game', {})
                    game['homeTeam']['score'] = box_game.get('homeTeam', {}).get('score', game['homeTeam'].get('score', 0))
                    game['awayTeam']['score'] = box_game.get('awayTeam', {}).get('score', game['awayTeam'].get('score', 0))
                    game['period'] = box_game.get('period', game.get('period', 0))
                    game['gameClock'] = box_game.get('gameClock', game.get('gameClock', ''))
                    
                    # Also update period scores if available
                    game['homeTeam']['periods'] = box_game.get('homeTeam', {}).get('periods', game['homeTeam'].get('periods', []))
                    game['awayTeam']['periods'] = box_game.get('awayTeam', {}).get('periods', game['awayTeam'].get('periods', []))
                except Exception as box_error:
                    # If boxscore fetch fails, keep the scoreboard data
                    pass
            
            enhanced_games.append(game)
        
        return JsonResponse(enhanced_games, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_all_teams(request):
    try:
        all_teams = teams.get_teams()
        return JsonResponse(all_teams, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_all_players(request):
    try:
        response = commonallplayers.CommonAllPlayers(is_only_current_season=1)
        all_players = response.get_data_frames()[0].to_dict(orient='records')
        return JsonResponse(all_players, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_player_stats(request, player_id):
    try:
        career_stats = playercareerstats.PlayerCareerStats(player_id=player_id)
        stats_dict = career_stats.get_dict()
        
        # Get player info from static data
        all_players = players.get_players()
        player_info = next((player for player in all_players if player['id'] == int(player_id)), None)
        
        if not player_info:
            raise Http404("Player not found")
        
        # Get current team from CommonAllPlayers
        current_players = commonallplayers.CommonAllPlayers(is_only_current_season=1)
        current_players_df = current_players.get_data_frames()[0]
        player_current = current_players_df[current_players_df['PERSON_ID'] == int(player_id)]
        
        team_info = None
        if not player_current.empty:
            team_id = player_current.iloc[0].get('TEAM_ID')
            team_abbr = player_current.iloc[0].get('TEAM_ABBREVIATION')
            team_name = player_current.iloc[0].get('TEAM_NAME')
            team_city = player_current.iloc[0].get('TEAM_CITY')
            
            team_info = {
                'team_id': int(team_id) if team_id else None,
                'team_abbreviation': team_abbr if team_abbr else None,
                'team_name': team_name if team_name else None,
                'team_city': team_city if team_city else None
            }
            
        response_data = {
            'player_info': player_info,
            'team_info': team_info,
            'career_stats': stats_dict
        }
        
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_player_current_stats(request, player_id):
    try:
        # Define current season (2025-26)
        current_season = '2025-26'
        
        # Get current season stats (year-over-year dashboard)
        dashboard = playerdashboardbyyearoveryear.PlayerDashboardByYearOverYear(
            player_id=player_id,
            per_mode_detailed='PerGame'
        )
        
        # Get the dataframe with per-game stats
        stats_df = dashboard.get_data_frames()[1]  # OverallPlayerDashboard contains the stats
        
        if stats_df.empty:
            raise Http404("No stats found for this player")
        
        # Filter for current season only
        current_season_data = stats_df[stats_df['GROUP_VALUE'] == current_season]
        
        if current_season_data.empty:
            # Player hasn't played this season yet
            return JsonResponse({
                'points': 0.0,
                'rebounds': 0.0,
                'assists': 0.0,
                'steals': 0.0,
                'blocks': 0.0,
                'games_played': 0,
                'field_goal_pct': 0.0,
                'three_point_pct': 0.0,
                'free_throw_pct': 0.0,
                'season': current_season,
                'has_played': False
            })
        
        # Get the current season stats
        season_stats = current_season_data.iloc[0]
        
        # Extract basic stats
        basic_stats = {
            'points': float(season_stats.get('PTS', 0)),
            'rebounds': float(season_stats.get('REB', 0)),
            'assists': float(season_stats.get('AST', 0)),
            'steals': float(season_stats.get('STL', 0)),
            'blocks': float(season_stats.get('BLK', 0)),
            'games_played': int(season_stats.get('GP', 0)),
            'field_goal_pct': float(season_stats.get('FG_PCT', 0)),
            'three_point_pct': float(season_stats.get('FG3_PCT', 0)),
            'free_throw_pct': float(season_stats.get('FT_PCT', 0)),
            'season': current_season,
            'has_played': True
        }
        
        return JsonResponse(basic_stats)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_points_leaders(request):
    try:
        # Get league leaders for points per game
        leaders = leagueleaders.LeagueLeaders(
            league_id='00',
            per_mode48='PerGame',
            scope='S',
            season='2025-26',
            season_type_all_star='Regular Season',
            stat_category_abbreviation='PTS'
        )
        
        leaders_df = leaders.get_data_frames()[0]
        
        top_10 = leaders_df.head(10)
        
        # Format the response
        leaders_list = []
        for _, row in top_10.iterrows():
            leaders_list.append({
                'rank': int(row['RANK']),
                'player_id': int(row['PLAYER_ID']),
                'player_name': row['PLAYER'],
                'team': row.get('TEAM_ABBREVIATION', row.get('TEAM', 'N/A')),
                'games_played': int(row['GP']),
                'points': float(row['PTS']),
            })
        
        return JsonResponse(leaders_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_rebound_leaders(request):
    try:
        # Get league leaders for points per game
        leaders = leagueleaders.LeagueLeaders(
            league_id='00',
            per_mode48='PerGame',
            scope='S',
            season='2025-26',
            season_type_all_star='Regular Season',
            stat_category_abbreviation='REB'
        )
        
        leaders_df = leaders.get_data_frames()[0]
        
        top_10 = leaders_df.head(10)
        
        # Format the response
        leaders_list = []
        for _, row in top_10.iterrows():
            leaders_list.append({
                'rank': int(row['RANK']),
                'player_id': int(row['PLAYER_ID']),
                'player_name': row['PLAYER'],
                'team': row.get('TEAM_ABBREVIATION', row.get('TEAM', 'N/A')),
                'games_played': int(row['GP']),
                'rebounds': float(row['REB']),
            })
        
        return JsonResponse(leaders_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_assist_leaders(request):
    try:
        # Get league leaders for assists per game
        leaders = leagueleaders.LeagueLeaders(
            league_id='00',
            per_mode48='PerGame',
            scope='S',
            season='2025-26',
            season_type_all_star='Regular Season',
            stat_category_abbreviation='AST'
        )
        
        leaders_df = leaders.get_data_frames()[0]
        
        top_10 = leaders_df.head(10)
        
        # Format the response
        leaders_list = []
        for _, row in top_10.iterrows():
            leaders_list.append({
                'rank': int(row['RANK']),
                'player_id': int(row['PLAYER_ID']),
                'player_name': row['PLAYER'],
                'team': row.get('TEAM_ABBREVIATION', row.get('TEAM', 'N/A')),
                'games_played': int(row['GP']),
                'assists': float(row['AST']),
            })
        
        return JsonResponse(leaders_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
def get_blocks_leaders(request):
    try:
        # Get league leaders for assists per game
        leaders = leagueleaders.LeagueLeaders(
            league_id='00',
            per_mode48='PerGame',
            scope='S',
            season='2025-26',
            season_type_all_star='Regular Season',
            stat_category_abbreviation='BLK'
        )
        
        leaders_df = leaders.get_data_frames()[0]
        
        top_10 = leaders_df.head(10)
        
        # Format the response
        leaders_list = []
        for _, row in top_10.iterrows():
            leaders_list.append({
                'rank': int(row['RANK']),
                'player_id': int(row['PLAYER_ID']),
                'player_name': row['PLAYER'],
                'team': row.get('TEAM_ABBREVIATION', row.get('TEAM', 'N/A')),
                'games_played': int(row['GP']),
                'blocks': float(row['BLK']),
            })
        
        return JsonResponse(leaders_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)    
    
def get_steals_leaders(request):
    try:
        # Get league leaders for assists per game
        leaders = leagueleaders.LeagueLeaders(
            league_id='00',
            per_mode48='PerGame',
            scope='S',
            season='2025-26',
            season_type_all_star='Regular Season',
            stat_category_abbreviation='STL'
        )
        
        leaders_df = leaders.get_data_frames()[0]
        
        top_10 = leaders_df.head(10)
        
        # Format the response
        leaders_list = []
        for _, row in top_10.iterrows():
            leaders_list.append({
                'rank': int(row['RANK']),
                'player_id': int(row['PLAYER_ID']),
                'player_name': row['PLAYER'],
                'team': row.get('TEAM_ABBREVIATION', row.get('TEAM', 'N/A')),
                'games_played': int(row['GP']),
                'steals': float(row['STL']),
            })
        
        return JsonResponse(leaders_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)    
    
def get_fgm_leaders(request):
    try:
        leaders = leagueleaders.LeagueLeaders(
            league_id='00',
            per_mode48='PerGame',
            scope='S',
            season='2025-26',
            season_type_all_star='Regular Season',
            stat_category_abbreviation='FGM'
        )
        
        leaders_df = leaders.get_data_frames()[0]
        
        top_10 = leaders_df.head(10)
        
        # Format the response
        leaders_list = []
        for _, row in top_10.iterrows():
            leaders_list.append({
                'rank': int(row['RANK']),
                'player_id': int(row['PLAYER_ID']),
                'player_name': row['PLAYER'],
                'team': row.get('TEAM_ABBREVIATION', row.get('TEAM', 'N/A')),
                'games_played': int(row['GP']),
                'field_goals': float(row['FGM']),
            })
        
        return JsonResponse(leaders_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400) 

def get_league_standings(request):
    try:
        standings = leaguestandingsv3.LeagueStandingsV3(
            league_id='00',
            season='2025-26',
            season_type='Regular Season'
        )
        
        standings_df = standings.get_data_frames()[0]
        
        # Separate by conference
        eastern_conf = standings_df[standings_df['Conference'] == 'East'].copy()
        western_conf = standings_df[standings_df['Conference'] == 'West'].copy()
        
        # Sort by win percentage
        eastern_conf = eastern_conf.sort_values('WinPCT', ascending=False)
        western_conf = western_conf.sort_values('WinPCT', ascending=False)
        
        # Format Eastern Conference
        eastern_standings = []
        for idx, (_, row) in enumerate(eastern_conf.iterrows(), 1):
            eastern_standings.append({
                'rank': idx,
                'team_id': int(row['TeamID']),
                'team_name': row['TeamName'],
                'team_city': row['TeamCity'],
                'team_abbreviation': row.get('TeamSlug', 'N/A'),
                'wins': int(row['WINS']),
                'losses': int(row['LOSSES']),
                'win_pct': float(row['WinPCT']),
                'games_back': row.get('ConferenceGamesBack', '0'),
                'conference': 'East',
                'division': row.get('Division', 'N/A'),
                'home_record': row.get('HOME', 'N/A'),
                'road_record': row.get('ROAD', 'N/A'),
                'last_10': row.get('L10', 'N/A'),
                'streak': row.get('strCurrentStreak', 'N/A')
            })
        
        # Format Western Conference
        western_standings = []
        for idx, (_, row) in enumerate(western_conf.iterrows(), 1):
            western_standings.append({
                'rank': idx,
                'team_id': int(row['TeamID']),
                'team_name': row['TeamName'],
                'team_city': row['TeamCity'],
                'team_abbreviation': row.get('TeamSlug', 'N/A'),
                'wins': int(row['WINS']),
                'losses': int(row['LOSSES']),
                'win_pct': float(row['WinPCT']),
                'games_back': row.get('ConferenceGamesBack', '0'),
                'conference': 'West',
                'division': row.get('Division', 'N/A'),
                'home_record': row.get('HOME', 'N/A'),
                'road_record': row.get('ROAD', 'N/A'),
                'last_10': row.get('L10', 'N/A'),
                'streak': row.get('strCurrentStreak', 'N/A')
            })
        
        response_data = {
            'eastern_conference': eastern_standings,
            'western_conference': western_standings,
            'season': '2025-26'
        }
        
        return JsonResponse(response_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_game_boxscore(request, game_id):
    try:
        # Get live boxscore data (works for live, finished, and recent games)
        game_boxscore = boxscore.BoxScore(game_id=game_id)
        boxscore_data = game_boxscore.get_dict()
        
        # Extract game info
        game_info = boxscore_data.get('game', {})
        
        # Extract team stats
        home_team = game_info.get('homeTeam', {})
        away_team = game_info.get('awayTeam', {})
        
        # Format player stats for home team
        home_players = []
        for player in home_team.get('players', []):
            stats = player.get('statistics', {})
            home_players.append({
                'player_id': player.get('personId'),
                'name': player.get('name', ''),
                'jersey_num': player.get('jerseyNum', ''),
                'position': player.get('position', ''),
                'starter': player.get('starter', '0') == '1',
                'minutes': stats.get('minutes', '0'),
                'points': stats.get('points', 0),
                'rebounds': stats.get('reboundsTotal', 0),
                'assists': stats.get('assists', 0),
                'steals': stats.get('steals', 0),
                'blocks': stats.get('blocks', 0),
                'turnovers': stats.get('turnovers', 0),
                'fouls': stats.get('foulsPersonal', 0),
                'fg_made': stats.get('fieldGoalsMade', 0),
                'fg_attempted': stats.get('fieldGoalsAttempted', 0),
                'fg_percentage': stats.get('fieldGoalsPercentage', 0),
                'three_pt_made': stats.get('threePointersMade', 0),
                'three_pt_attempted': stats.get('threePointersAttempted', 0),
                'three_pt_percentage': stats.get('threePointersPercentage', 0),
                'ft_made': stats.get('freeThrowsMade', 0),
                'ft_attempted': stats.get('freeThrowsAttempted', 0),
                'ft_percentage': stats.get('freeThrowsPercentage', 0),
                'plus_minus': stats.get('plusMinusPoints', 0)
            })
        
        # Format player stats for away team
        away_players = []
        for player in away_team.get('players', []):
            stats = player.get('statistics', {})
            away_players.append({
                'player_id': player.get('personId'),
                'name': player.get('name', ''),
                'jersey_num': player.get('jerseyNum', ''),
                'position': player.get('position', ''),
                'starter': player.get('starter', '0') == '1',
                'minutes': stats.get('minutes', '0'),
                'points': stats.get('points', 0),
                'rebounds': stats.get('reboundsTotal', 0),
                'assists': stats.get('assists', 0),
                'steals': stats.get('steals', 0),
                'blocks': stats.get('blocks', 0),
                'turnovers': stats.get('turnovers', 0),
                'fouls': stats.get('foulsPersonal', 0),
                'fg_made': stats.get('fieldGoalsMade', 0),
                'fg_attempted': stats.get('fieldGoalsAttempted', 0),
                'fg_percentage': stats.get('fieldGoalsPercentage', 0),
                'three_pt_made': stats.get('threePointersMade', 0),
                'three_pt_attempted': stats.get('threePointersAttempted', 0),
                'three_pt_percentage': stats.get('threePointersPercentage', 0),
                'ft_made': stats.get('freeThrowsMade', 0),
                'ft_attempted': stats.get('freeThrowsAttempted', 0),
                'ft_percentage': stats.get('freeThrowsPercentage', 0),
                'plus_minus': stats.get('plusMinusPoints', 0)
            })
        
        # Format team statistics
        home_team_stats = home_team.get('statistics', {})
        away_team_stats = away_team.get('statistics', {})
        
        response_data = {
            'game_id': game_id,
            'game_status': game_info.get('gameStatus'),
            'game_status_text': game_info.get('gameStatusText', ''),
            'period': game_info.get('period', 0),
            'game_clock': game_info.get('gameClock', ''),
            'home_team': {
                'team_id': home_team.get('teamId'),
                'team_name': home_team.get('teamName', ''),
                'team_city': home_team.get('teamCity', ''),
                'team_tricode': home_team.get('teamTricode', ''),
                'score': home_team.get('score', 0),
                'periods': home_team.get('periods', []),
                'statistics': {
                    'points': home_team_stats.get('points', 0),
                    'fg_made': home_team_stats.get('fieldGoalsMade', 0),
                    'fg_attempted': home_team_stats.get('fieldGoalsAttempted', 0),
                    'fg_percentage': home_team_stats.get('fieldGoalsPercentage', 0),
                    'three_pt_made': home_team_stats.get('threePointersMade', 0),
                    'three_pt_attempted': home_team_stats.get('threePointersAttempted', 0),
                    'three_pt_percentage': home_team_stats.get('threePointersPercentage', 0),
                    'ft_made': home_team_stats.get('freeThrowsMade', 0),
                    'ft_attempted': home_team_stats.get('freeThrowsAttempted', 0),
                    'ft_percentage': home_team_stats.get('freeThrowsPercentage', 0),
                    'rebounds_total': home_team_stats.get('reboundsTotal', 0),
                    'rebounds_offensive': home_team_stats.get('reboundsOffensive', 0),
                    'rebounds_defensive': home_team_stats.get('reboundsDefensive', 0),
                    'assists': home_team_stats.get('assists', 0),
                    'steals': home_team_stats.get('steals', 0),
                    'blocks': home_team_stats.get('blocks', 0),
                    'turnovers': home_team_stats.get('turnovers', 0),
                    'fouls': home_team_stats.get('foulsPersonal', 0)
                },
                'players': home_players
            },
            'away_team': {
                'team_id': away_team.get('teamId'),
                'team_name': away_team.get('teamName', ''),
                'team_city': away_team.get('teamCity', ''),
                'team_tricode': away_team.get('teamTricode', ''),
                'score': away_team.get('score', 0),
                'periods': away_team.get('periods', []),
                'statistics': {
                    'points': away_team_stats.get('points', 0),
                    'fg_made': away_team_stats.get('fieldGoalsMade', 0),
                    'fg_attempted': away_team_stats.get('fieldGoalsAttempted', 0),
                    'fg_percentage': away_team_stats.get('fieldGoalsPercentage', 0),
                    'three_pt_made': away_team_stats.get('threePointersMade', 0),
                    'three_pt_attempted': away_team_stats.get('threePointersAttempted', 0),
                    'three_pt_percentage': away_team_stats.get('threePointersPercentage', 0),
                    'ft_made': away_team_stats.get('freeThrowsMade', 0),
                    'ft_attempted': away_team_stats.get('freeThrowsAttempted', 0),
                    'ft_percentage': away_team_stats.get('freeThrowsPercentage', 0),
                    'rebounds_total': away_team_stats.get('reboundsTotal', 0),
                    'rebounds_offensive': away_team_stats.get('reboundsOffensive', 0),
                    'rebounds_defensive': away_team_stats.get('reboundsDefensive', 0),
                    'assists': away_team_stats.get('assists', 0),
                    'steals': away_team_stats.get('steals', 0),
                    'blocks': away_team_stats.get('blocks', 0),
                    'turnovers': away_team_stats.get('turnovers', 0),
                    'fouls': away_team_stats.get('foulsPersonal', 0)
                },
                'players': away_players
            }
        }
        
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_games_by_date(request, date):
    try:
        # Date should be in format YYYY-MM-DD (e.g., "2025-11-15")
        from datetime import datetime
        
        # Validate date format
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
        # Convert to MM/DD/YYYY format for the stats API
        formatted_date = date_obj.strftime('%m/%d/%Y')
        
        # Use the stats API ScoreboardV2 which accepts a game_date parameter
        scoreboard_data = scoreboardv2.ScoreboardV2(game_date=formatted_date)

        games_df = scoreboard_data.get_data_frames()[0]  # GameHeader dataframe

        if games_df.empty:
            return JsonResponse([], safe=False)

        teams_list = teams.get_teams()
        teams_by_id = {int(t['id']): t for t in teams_list}

        # Format the response to match the minimal structure needed by the frontend
        games = []
        for _, game_row in games_df.iterrows():
            game_id = str(game_row['GAME_ID'])

            # Lookup team metadata
            home_id = int(game_row['HOME_TEAM_ID'])
            away_id = int(game_row['VISITOR_TEAM_ID'])
            home_meta = teams_by_id.get(home_id, {})
            away_meta = teams_by_id.get(away_id, {})

            # Team tricodes from static metadata
            home_tricode = home_meta.get('abbreviation', '')
            away_tricode = away_meta.get('abbreviation', '')
            
            # Special cases: adjust team codes to match NBA.com conventions
            if home_tricode == 'UTA':
                home_tricode = 'UTAH'
            elif home_tricode == 'NOP':
                home_tricode = 'NO'
            
            if away_tricode == 'UTA':
                away_tricode = 'UTAH'
            elif away_tricode == 'NOP':
                away_tricode = 'NO'

            # Get scores from boxscore for finished games
            home_score = 0
            away_score = 0
            try:
                bs = boxscore.BoxScore(game_id=game_id)
                bs_data = bs.get_dict()
                game_data = bs_data.get('game', {})
                home_score = game_data.get('homeTeam', {}).get('score', 0)
                away_score = game_data.get('awayTeam', {}).get('score', 0)
            except Exception:
                pass  # Game not available in boxscore, keep scores at 0

            game_obj = {
                'gameId': game_id,

                'homeTeam': {
                    'teamId': home_id,
                    'teamTricode': home_tricode,
                    'score': home_score,
                },
                'awayTeam': {
                    'teamId': away_id,
                    'teamTricode': away_tricode,
                    'score': away_score,
                }
            }
            
            games.append(game_obj)

        return JsonResponse(games, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_team_stats(request, team_id):
    try:
        # Get league standings to find team record and rankings
        standings = leaguestandingsv3.LeagueStandingsV3(
            league_id='00',
            season='2025-26',
            season_type='Regular Season'
        )
        
        standings_df = standings.get_data_frames()[0]
        
        # Find the team in standings
        team_data = standings_df[standings_df['TeamID'] == int(team_id)]
        
        if team_data.empty:
            return JsonResponse({'error': 'Team not found in standings'}, status=404)
        
        team_row = team_data.iloc[0]
        
        # Get conference and league rankings
        conference = team_row['Conference']
        
        # Calculate conference rank
        conf_teams = standings_df[standings_df['Conference'] == conference].copy()
        conf_teams = conf_teams.sort_values('WinPCT', ascending=False)
        conf_rank = conf_teams.index.tolist().index(team_row.name) + 1
        
        # Calculate league rank
        league_teams = standings_df.copy()
        league_teams = league_teams.sort_values('WinPCT', ascending=False)
        league_rank = league_teams.index.tolist().index(team_row.name) + 1
        
        # Format response
        team_stats = {
            'team_id': int(team_id),
            'team_name': team_row['TeamName'],
            'team_city': team_row['TeamCity'],
            'wins': int(team_row['WINS']),
            'losses': int(team_row['LOSSES']),
            'win_percentage': float(team_row['WinPCT']),
            'conference': conference,
            'conference_rank': conf_rank,
            'league_rank': league_rank,
            'home_record': team_row.get('HOME', 'N/A'),
            'road_record': team_row.get('ROAD', 'N/A'),
            'last_10': team_row.get('L10', 'N/A'),
        }
        
        return JsonResponse(team_stats)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_team_averages(request, team_id):
    try:
        # Get all teams' stats to calculate rankings
        from nba_api.stats.endpoints import leaguedashteamstats
        
        # Get league-wide team stats
        league_stats = leaguedashteamstats.LeagueDashTeamStats(
            season='2025-26',
            per_mode_detailed='PerGame',
            season_type_all_star='Regular Season'
        )
        
        league_df = league_stats.get_data_frames()[0]
        
        # Get team dashboard with general splits for current season
        dashboard = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
            team_id=team_id,
            season='2025-26',
            per_mode_detailed='PerGame',
            season_type_all_star='Regular Season'
        )
        
        # Get the overall team stats (first dataframe)
        stats_df = dashboard.get_data_frames()[0]
        
        if stats_df.empty:
            return JsonResponse({'error': 'No stats found for this team'}, status=404)
        
        # Get the first row (overall stats)
        team_row = stats_df.iloc[0]
        
        # Calculate rankings for each stat
        def get_rank(stat_column, ascending=False):
            sorted_teams = league_df.sort_values(stat_column, ascending=ascending)
            rank = sorted_teams[sorted_teams['TEAM_ID'] == int(team_id)].index[0] + 1
            return int(rank)
        
        # Format response with per-game averages and rankings
        team_averages = {
            'team_id': int(team_id),
            'games_played': int(team_row.get('GP', 0)),
            'wins': int(team_row.get('W', 0)),
            'losses': int(team_row.get('L', 0)),
            'points': float(team_row.get('PTS', 0)),
            'points_rank': get_rank('PTS'),
            'field_goals_made': float(team_row.get('FGM', 0)),
            'field_goals_attempted': float(team_row.get('FGA', 0)),
            'field_goal_pct': float(team_row.get('FG_PCT', 0)),
            'three_point_pct': float(team_row.get('FG3_PCT', 0)),
            'free_throw_pct': float(team_row.get('FT_PCT', 0)),
            'total_rebounds': float(team_row.get('REB', 0)),
            'assists': float(team_row.get('AST', 0)),
            'turnovers': float(team_row.get('TOV', 0)),
            'steals': float(team_row.get('STL', 0)),
            'blocks': float(team_row.get('BLK', 0)),
        }
        
        return JsonResponse(team_averages)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_team_roster(request, team_id):
    try:
        # Get team roster
        roster = commonteamroster.CommonTeamRoster(
            team_id=team_id,
            season='2025-26'
        )
        
        roster_df = roster.get_data_frames()[0]
        
        if roster_df.empty:
            return JsonResponse({'error': 'No roster found for this team'}, status=404)
        
        # Format roster
        roster_list = []
        for _, player in roster_df.iterrows():
            roster_list.append({
                'player_id': int(player['PLAYER_ID']),
                'player_name': player['PLAYER'],
                'jersey_number': player.get('NUM', 'N/A'),
                'position': player.get('POSITION', 'N/A'),
                'height': player.get('HEIGHT', 'N/A'),
                'weight': player.get('WEIGHT', 'N/A'),
                'birth_date': player.get('BIRTH_DATE', 'N/A'),
                'age': player.get('AGE', 'N/A'),
            })
        
        return JsonResponse(roster_list, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def get_team_game_log(request, team_id):
    try:
        # Get team game log using TeamGameLogs
        game_log = teamgamelogs.TeamGameLogs(
            team_id_nullable=team_id,
            season_nullable='2025-26',
            season_type_nullable='Regular Season'
        )
        
        game_log_df = game_log.get_data_frames()[0]
        
        if game_log_df.empty:
            return JsonResponse([], safe=False)
        
        # Sort by date descending
        game_log_df = game_log_df.sort_values('GAME_ID', ascending=False)
        
        # Filter to only include fields that match player game log structure
        filtered_games = []
        for _, game in game_log_df.iterrows():
    
            game_id_str = str(game.get('GAME_ID', ''))
            if game_id_str and game_id_str[0] == '1':
                continue  # Skip preseason games (starting with '1')
            
            filtered_games.append({
                'Game_ID': game.get('GAME_ID'),
                'GAME_DATE': game.get('GAME_DATE'),
                'MATCHUP': game.get('MATCHUP'),
                'WL': game.get('WL'),
                'MIN': game.get('MIN'),
                'PTS': game.get('PTS'),
                'REB': game.get('REB'),
                'AST': game.get('AST'),
                'STL': game.get('STL'),
                'BLK': game.get('BLK'),
                'FGM': game.get('FGM'),
                'FGA': game.get('FGA'),
                'FG_PCT': game.get('FG_PCT'),
                'FG3M': game.get('FG3M'),
                'FG3A': game.get('FG3A'),
                'FG3_PCT': game.get('FG3_PCT'),
                'FTM': game.get('FTM'),
                'FTA': game.get('FTA'),
                'FT_PCT': game.get('FT_PCT'),
                'TOV': game.get('TOV')
            })
        
        return JsonResponse(filtered_games, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)