CREATE TABLE tournaments (
    id               BIGSERIAL PRIMARY KEY,
    api_id           INTEGER NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    country          VARCHAR(100) NOT NULL,
    logo             VARCHAR(500),
    season           INTEGER NOT NULL,
    is_cup           BOOLEAN NOT NULL DEFAULT FALSE,
    started_at       TIMESTAMP,
    final_started_at TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE teams (
    id          BIGSERIAL PRIMARY KEY,
    api_id      INTEGER NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(10),
    logo        VARCHAR(500),
    is_national BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE players (
    id              BIGSERIAL PRIMARY KEY,
    api_id          INTEGER NOT NULL UNIQUE,
    displayed_name  VARCHAR(255) NOT NULL,
    club_id         BIGINT REFERENCES teams(id),
    national_id     BIGINT REFERENCES teams(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_club_national_differ CHECK (
        club_id IS NULL OR national_id IS NULL OR club_id <> national_id
    )
);

CREATE TABLE team_tournaments (
    id            BIGSERIAL PRIMARY KEY,
    team_id       BIGINT NOT NULL REFERENCES teams(id),
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    is_winner     BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_team_tournament UNIQUE (team_id, tournament_id)
);

CREATE TABLE player_tournaments (
    id            BIGSERIAL PRIMARY KEY,
    player_id     BIGINT NOT NULL REFERENCES players(id),
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    is_top_scorer BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_player_tournament UNIQUE (player_id, tournament_id)
);

CREATE INDEX idx_tournaments_api_id ON tournaments (api_id);
CREATE INDEX idx_teams_api_id ON teams (api_id);
CREATE INDEX idx_players_api_id ON players (api_id);
CREATE INDEX idx_players_national_id ON players (national_id);
