-- 6 of 12 group games finished
UPDATE games SET status = 'finished' WHERE id IN (1, 2, 3, 4, 7, 8);

-- Scores
UPDATE game_teams SET score = 2 WHERE game_id = 1 AND team_id = 1;  -- Brazil 2
UPDATE game_teams SET score = 1 WHERE game_id = 1 AND team_id = 2;  -- Germany 1
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 3;  -- Argentina 1
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 4;  -- France 1
UPDATE game_teams SET score = 3 WHERE game_id = 3 AND team_id = 1;  -- Brazil 3
UPDATE game_teams SET score = 0 WHERE game_id = 3 AND team_id = 3;  -- Argentina 0
UPDATE game_teams SET score = 0 WHERE game_id = 4 AND team_id = 2;  -- Germany 0
UPDATE game_teams SET score = 2 WHERE game_id = 4 AND team_id = 4;  -- France 2
UPDATE game_teams SET score = 2 WHERE game_id = 7 AND team_id = 5;  -- Spain 2
UPDATE game_teams SET score = 0 WHERE game_id = 7 AND team_id = 6;  -- England 0
UPDATE game_teams SET score = 1 WHERE game_id = 8 AND team_id = 7;  -- Italy 1
UPDATE game_teams SET score = 3 WHERE game_id = 8 AND team_id = 8;  -- Portugal 3
