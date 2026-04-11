# Seed Data

SQL scripts to populate the local database with fake tournament data for testing.

## Usage

Clean, migrate, then load common data + a stage:

    ./mvnw flyway:clean flyway:migrate \
        -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast \
        -Dflyway.user=goalcast -Dflyway.password=goalcast_dev \
        -Dflyway.cleanDisabled=false

    psql -h localhost -p 5433 -U goalcast -d goalcast \
        -f src/main/resources/seed/00_common.sql \
        -f src/main/resources/seed/02_mid_group.sql

## Stages

- 00_common.sql — Tournament, 8 teams (3 players each), 16 games (12 group + 4 knockout). Always run first.
- 01_before_start.sql — All games not_started. Clean slate.
- 02_mid_group.sql — 6 group games finished with scores. 10 still to play.
- 03_mid_knockout.sql — All 12 group games + 2 knockouts finished. Goals with scorers for knockout games.
- 04_after_final.sql — Everything finished. Winner (Brazil) and top scorer (Vinicius) set.
