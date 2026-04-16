CREATE TABLE games (
    id            BIGSERIAL PRIMARY KEY,
    api_id        INTEGER UNIQUE,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    stage         VARCHAR(100) NOT NULL,
    phase         VARCHAR(20) NOT NULL CHECK (
        phase IN ('group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'final_3_4', 'final')
    ),
    status        VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (
        status IN ('not_started', 'ongoing', 'finished')
    ),
    started_at    TIMESTAMP NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE game_teams (
    id      BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id),
    team_id BIGINT NOT NULL REFERENCES teams(id),
    is_away BOOLEAN NOT NULL DEFAULT FALSE,
    score   INTEGER,
    CONSTRAINT uq_game_team UNIQUE (game_id, team_id)
);

CREATE TABLE game_goals (
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT NOT NULL REFERENCES games(id),
    player_id   BIGINT NOT NULL REFERENCES players(id),
    team_id     BIGINT NOT NULL REFERENCES teams(id),
    is_own_goal BOOLEAN NOT NULL DEFAULT FALSE,
    scored_at   INTEGER
);

CREATE INDEX idx_games_tournament_id ON games (tournament_id);
CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_started_at ON games (started_at);
CREATE INDEX idx_game_teams_game_id ON game_teams (game_id);
CREATE INDEX idx_game_goals_game_id ON game_goals (game_id);
