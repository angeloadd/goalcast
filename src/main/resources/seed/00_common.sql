-- Tournament
INSERT INTO tournaments (id, api_id, name, country, logo, season, is_cup, started_at, final_started_at)
VALUES (1, 1, 'World Cup 2026', 'International', 'https://example.com/wc2026.png', 2026, TRUE,
        '2026-06-11 18:00:00', '2026-07-05 18:00:00');

-- 8 teams
INSERT INTO teams (id, api_id, name, code, logo, is_national) VALUES
(1, 101, 'Brazil',    'BRA', 'https://example.com/bra.png', TRUE),
(2, 102, 'Germany',   'GER', 'https://example.com/ger.png', TRUE),
(3, 103, 'Argentina', 'ARG', 'https://example.com/arg.png', TRUE),
(4, 104, 'France',    'FRA', 'https://example.com/fra.png', TRUE),
(5, 105, 'Spain',     'ESP', 'https://example.com/esp.png', TRUE),
(6, 106, 'England',   'ENG', 'https://example.com/eng.png', TRUE),
(7, 107, 'Italy',     'ITA', 'https://example.com/ita.png', TRUE),
(8, 108, 'Portugal',  'POR', 'https://example.com/por.png', TRUE);

INSERT INTO team_tournaments (team_id, tournament_id, is_winner) VALUES
(1,1,FALSE),(2,1,FALSE),(3,1,FALSE),(4,1,FALSE),
(5,1,FALSE),(6,1,FALSE),(7,1,FALSE),(8,1,FALSE);

-- 3 players per team (24 total)
INSERT INTO players (id, api_id, displayed_name, national_id) VALUES
(1,  1001, 'Vinicius Jr.',  1), (2,  1002, 'Rodrygo',     1), (3,  1003, 'Endrick',      1),
(4,  1004, 'Musiala',       2), (5,  1005, 'Havertz',     2), (6,  1006, 'Wirtz',        2),
(7,  1007, 'Messi',         3), (8,  1008, 'Alvarez',     3), (9,  1009, 'Lautaro',      3),
(10, 1010, 'Mbappe',        4), (11, 1011, 'Griezmann',   4), (12, 1012, 'Dembele',      4),
(13, 1013, 'Yamal',         5), (14, 1014, 'Morata',      5), (15, 1015, 'Olmo',         5),
(16, 1016, 'Kane',          6), (17, 1017, 'Saka',        6), (18, 1018, 'Bellingham',   6),
(19, 1019, 'Retegui',       7), (20, 1020, 'Chiesa',      7), (21, 1021, 'Raspadori',    7),
(22, 1022, 'Ronaldo',       8), (23, 1023, 'B. Silva',    8), (24, 1024, 'R. Leao',      8);

INSERT INTO player_tournaments (player_id, tournament_id, is_top_scorer) VALUES
(1,1,FALSE),(2,1,FALSE),(3,1,FALSE),(4,1,FALSE),(5,1,FALSE),(6,1,FALSE),
(7,1,FALSE),(8,1,FALSE),(9,1,FALSE),(10,1,FALSE),(11,1,FALSE),(12,1,FALSE),
(13,1,FALSE),(14,1,FALSE),(15,1,FALSE),(16,1,FALSE),(17,1,FALSE),(18,1,FALSE),
(19,1,FALSE),(20,1,FALSE),(21,1,FALSE),(22,1,FALSE),(23,1,FALSE),(24,1,FALSE);

-- 16 games: 12 group (2 groups of 4) + 4 knockout (QF, QF, SF, Final)
INSERT INTO games (id, api_id, tournament_id, stage, phase, status, started_at) VALUES
-- Group A: Brazil, Germany, Argentina, France
(1,  2001, 1, 'Group A - 1', 'group', 'not_started', '2026-06-11 18:00:00'),
(2,  2002, 1, 'Group A - 1', 'group', 'not_started', '2026-06-11 21:00:00'),
(3,  2003, 1, 'Group A - 2', 'group', 'not_started', '2026-06-15 18:00:00'),
(4,  2004, 1, 'Group A - 2', 'group', 'not_started', '2026-06-15 21:00:00'),
(5,  2005, 1, 'Group A - 3', 'group', 'not_started', '2026-06-19 18:00:00'),
(6,  2006, 1, 'Group A - 3', 'group', 'not_started', '2026-06-19 21:00:00'),
-- Group B: Spain, England, Italy, Portugal
(7,  2007, 1, 'Group B - 1', 'group', 'not_started', '2026-06-12 18:00:00'),
(8,  2008, 1, 'Group B - 1', 'group', 'not_started', '2026-06-12 21:00:00'),
(9,  2009, 1, 'Group B - 2', 'group', 'not_started', '2026-06-16 18:00:00'),
(10, 2010, 1, 'Group B - 2', 'group', 'not_started', '2026-06-16 21:00:00'),
(11, 2011, 1, 'Group B - 3', 'group', 'not_started', '2026-06-20 18:00:00'),
(12, 2012, 1, 'Group B - 3', 'group', 'not_started', '2026-06-20 21:00:00'),
-- Knockout
(13, 2013, 1, 'Quarter-Final 1', 'quarter', 'not_started', '2026-07-05 18:00:00'),
(14, 2014, 1, 'Quarter-Final 2', 'quarter', 'not_started', '2026-07-05 21:00:00'),
(15, 2015, 1, 'Semi-Final',      'semi',    'not_started', '2026-07-09 21:00:00'),
(16, 2016, 1, 'Final',           'final',   'not_started', '2026-07-13 21:00:00');

-- Game teams
INSERT INTO game_teams (game_id, team_id, is_away, score) VALUES
(1,1,FALSE,NULL),(1,2,TRUE,NULL),   (2,3,FALSE,NULL),(2,4,TRUE,NULL),
(3,1,FALSE,NULL),(3,3,TRUE,NULL),   (4,2,FALSE,NULL),(4,4,TRUE,NULL),
(5,1,FALSE,NULL),(5,4,TRUE,NULL),   (6,2,FALSE,NULL),(6,3,TRUE,NULL),
(7,5,FALSE,NULL),(7,6,TRUE,NULL),   (8,7,FALSE,NULL),(8,8,TRUE,NULL),
(9,5,FALSE,NULL),(9,7,TRUE,NULL),   (10,6,FALSE,NULL),(10,8,TRUE,NULL),
(11,5,FALSE,NULL),(11,8,TRUE,NULL), (12,6,FALSE,NULL),(12,7,TRUE,NULL),
(13,1,FALSE,NULL),(13,5,TRUE,NULL), (14,3,FALSE,NULL),(14,6,TRUE,NULL),
(15,1,FALSE,NULL),(15,3,TRUE,NULL), (16,1,FALSE,NULL),(16,6,TRUE,NULL);

-- Reset sequences
SELECT setval('tournaments_id_seq', (SELECT MAX(id) FROM tournaments));
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));
SELECT setval('players_id_seq', (SELECT MAX(id) FROM players));
SELECT setval('games_id_seq', (SELECT MAX(id) FROM games));
