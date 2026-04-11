-- All games finished
UPDATE games SET status = 'finished' WHERE id BETWEEN 1 AND 16;

-- All group scores (same as mid_knockout)
UPDATE game_teams SET score = 2 WHERE game_id = 1 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 1 AND team_id = 2;
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 3;
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 4;
UPDATE game_teams SET score = 3 WHERE game_id = 3 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 3 AND team_id = 3;
UPDATE game_teams SET score = 0 WHERE game_id = 4 AND team_id = 2;
UPDATE game_teams SET score = 2 WHERE game_id = 4 AND team_id = 4;
UPDATE game_teams SET score = 1 WHERE game_id = 5 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 5 AND team_id = 4;
UPDATE game_teams SET score = 2 WHERE game_id = 6 AND team_id = 2;
UPDATE game_teams SET score = 2 WHERE game_id = 6 AND team_id = 3;
UPDATE game_teams SET score = 2 WHERE game_id = 7 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 7 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 8 AND team_id = 7;
UPDATE game_teams SET score = 3 WHERE game_id = 8 AND team_id = 8;
UPDATE game_teams SET score = 1 WHERE game_id = 9 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 9 AND team_id = 7;
UPDATE game_teams SET score = 2 WHERE game_id = 10 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 10 AND team_id = 8;
UPDATE game_teams SET score = 3 WHERE game_id = 11 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 11 AND team_id = 8;
UPDATE game_teams SET score = 1 WHERE game_id = 12 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 12 AND team_id = 7;

-- QF scores
UPDATE game_teams SET score = 2 WHERE game_id = 13 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 13 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 14 AND team_id = 3;
UPDATE game_teams SET score = 1 WHERE game_id = 14 AND team_id = 6;

-- SF: Brazil 2-0 Argentina
UPDATE game_teams SET score = 2 WHERE game_id = 15 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 15 AND team_id = 3;

-- Final: Brazil 3-1 England
UPDATE game_teams SET score = 3 WHERE game_id = 16 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 16 AND team_id = 6;

-- All knockout goals
INSERT INTO game_goals (game_id, player_id, team_id, is_own_goal, scored_at) VALUES
-- QF1: Brazil 2-1 Spain
(13, 1, 1, FALSE, 23), (13, 2, 1, FALSE, 67), (13, 13, 5, FALSE, 55),
-- QF2: Argentina 0-1 England
(14, 16, 6, FALSE, 78),
-- SF: Brazil 2-0 Argentina
(15, 1, 1, FALSE, 34), (15, 3, 1, FALSE, 71),
-- Final: Brazil 3-1 England
(16, 1, 1, FALSE, 12), (16, 1, 1, FALSE, 56), (16, 3, 1, FALSE, 80), (16, 16, 6, FALSE, 44);

-- Brazil wins, Vinicius top scorer
UPDATE team_tournaments SET is_winner = TRUE WHERE team_id = 1 AND tournament_id = 1;
UPDATE player_tournaments SET is_top_scorer = TRUE WHERE player_id = 1 AND tournament_id = 1;
