-- All 12 group games finished
UPDATE games SET status = 'finished' WHERE id BETWEEN 1 AND 12;

-- Group scores (games 1-4, 7-8 same as mid_group)
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

-- QF1 finished: Brazil 2-1 Spain
UPDATE games SET status = 'finished' WHERE id = 13;
UPDATE game_teams SET score = 2 WHERE game_id = 13 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 13 AND team_id = 5;

-- QF2 finished: Argentina 0-1 England
UPDATE games SET status = 'finished' WHERE id = 14;
UPDATE game_teams SET score = 0 WHERE game_id = 14 AND team_id = 3;
UPDATE game_teams SET score = 1 WHERE game_id = 14 AND team_id = 6;

-- Goals for knockout games (scorers matter)
INSERT INTO game_goals (game_id, player_id, team_id, is_own_goal, scored_at) VALUES
(13, 1, 1, FALSE, 23),   -- Vinicius 23' for Brazil
(13, 2, 1, FALSE, 67),   -- Rodrygo 67' for Brazil
(13, 13, 5, FALSE, 55),  -- Yamal 55' for Spain
(14, 16, 6, FALSE, 78);  -- Kane 78' for England
