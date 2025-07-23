--- Creating table notes

BEGIN;

DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY NOT NULL,
        content VARCHAR(255) NOT NULL,
        times_sent INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
END $$;

COMMIT;
