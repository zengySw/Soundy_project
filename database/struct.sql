-- public.albums определение

-- Drop table

-- DROP TABLE public.albums;

CREATE TABLE public.albums (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	title varchar(255) NOT NULL,
	"year" int4 NULL,
	cover_path text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT albums_pkey PRIMARY KEY (id)
);


-- public.albums_compositors определение

-- Drop table

-- DROP TABLE public.albums_compositors;

CREATE TABLE public.albums_compositors (
	artist_id uuid NOT NULL,
	album_id uuid NOT NULL,
	CONSTRAINT albums_compositors_unique UNIQUE (album_id),
	CONSTRAINT albums_compositors_unique_1 UNIQUE (artist_id)
);


-- public.artists определение

-- Drop table

-- DROP TABLE public.artists;

CREATE TABLE public.artists (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	search_vector tsvector NULL,
	subscribers int4 NULL,
	CONSTRAINT artists_name_key UNIQUE (name),
	CONSTRAINT artists_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_artists_search_vector_gin ON public.artists USING gin (search_vector);

-- Table Triggers

create trigger trg_artists_search_vector before
insert
    or
update
    on
    public.artists for each row execute function artists_search_vector_update();


-- public.tracks определение

-- Drop table

-- DROP TABLE public.tracks;

CREATE TABLE public.tracks (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	album_id uuid NULL,
	title varchar(255) NOT NULL,
	"year" int4 NULL,
	genre varchar(120) NULL,
	duration_ms int4 NULL,
	is_explicit bool DEFAULT false NOT NULL,
	play_count int4 DEFAULT 0 NOT NULL,
	"path" text NOT NULL,
	cover_path text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	embedding public.vector NULL,
	search_vector tsvector NULL,
	CONSTRAINT tracks_path_key UNIQUE (path),
	CONSTRAINT tracks_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_tracks_created_at ON public.tracks USING btree (created_at DESC);
CREATE INDEX ix_tracks_embedding_ivfflat ON public.tracks USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');
CREATE INDEX ix_tracks_search_vector_gin ON public.tracks USING gin (search_vector);
CREATE INDEX ix_tracks_title_lower ON public.tracks USING btree (lower((title)::text));

-- Table Triggers

create trigger trg_tracks_set_updated_at before
update
    on
    public.tracks for each row execute function set_catalog_updated_at();
create trigger trg_tracks_search_vector before
insert
    or
update
    on
    public.tracks for each row execute function tracks_search_vector_update();


-- public.tracks_compositors определение

-- Drop table

-- DROP TABLE public.tracks_compositors;

CREATE TABLE public.tracks_compositors (
	author_id uuid NOT NULL,
	track_id uuid NOT NULL
);


-- public.users определение

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	email varchar(255) NOT NULL,
	username varchar(64) NOT NULL,
	password_hash text NOT NULL,
	avatar_url text NULL,
	is_premium bool DEFAULT false NOT NULL,
	country_code varchar(2) NULL,
	is_active bool DEFAULT true NOT NULL,
	theme_config jsonb DEFAULT jsonb_build_object('primary', '#6366f1', 'accent', '#8b5cf6', 'bg', '#0a0a0f', 'preset', 'dark') NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT users_email_not_blank CHECK ((length(TRIM(BOTH FROM email)) > 0)),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_username_not_blank CHECK ((length(TRIM(BOTH FROM username)) > 0))
);
CREATE UNIQUE INDEX users_email_unique_idx ON public.users USING btree (lower((email)::text));
CREATE INDEX users_name_trgm_idx ON public.users USING gin (username gin_trgm_ops);
CREATE UNIQUE INDEX users_username_unique_idx ON public.users USING btree (lower((username)::text));

-- Table Triggers

create trigger trg_users_set_updated_at before
update
    on
    public.users for each row execute function set_users_updated_at();


-- public.favorites определение

-- Drop table

-- DROP TABLE public.favorites;

CREATE TABLE public.favorites (
	user_id uuid NOT NULL,
	track_id uuid NOT NULL,
	added_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT favorites_pk PRIMARY KEY (user_id, track_id),
	CONSTRAINT favorites_track_fk FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE,
	CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);


-- public.listening_events определение

-- Drop table

-- DROP TABLE public.listening_events;

CREATE TABLE public.listening_events (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NULL,
	track_id uuid NOT NULL,
	artist_id uuid NULL,
	"source" text NULL,
	country_code varchar(8) NULL,
	city text NULL,
	played_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT listening_events_pkey PRIMARY KEY (id),
	CONSTRAINT listening_events_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE SET NULL,
	CONSTRAINT listening_events_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE,
	CONSTRAINT listening_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);
CREATE INDEX ix_listening_events_artist_played_at ON public.listening_events USING btree (artist_id, played_at DESC);
CREATE INDEX ix_listening_events_track_played_at ON public.listening_events USING btree (track_id, played_at DESC);
CREATE INDEX ix_listening_events_user_played_at ON public.listening_events USING btree (user_id, played_at DESC);


-- public.playlists определение

-- Drop table

-- DROP TABLE public.playlists;

CREATE TABLE public.playlists (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	owner_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	search_vector tsvector NULL,
	CONSTRAINT playlists_owner_name_unique UNIQUE (owner_id, name),
	CONSTRAINT playlists_pkey PRIMARY KEY (id),
	CONSTRAINT playlists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX ix_playlists_owner_created_at ON public.playlists USING btree (owner_id, created_at DESC);
CREATE UNIQUE INDEX ix_playlists_owner_name_unique ON public.playlists USING btree (owner_id, lower((name)::text));
CREATE INDEX ix_playlists_search_vector_gin ON public.playlists USING gin (search_vector);

-- Table Triggers

create trigger trg_playlists_set_updated_at before
update
    on
    public.playlists for each row execute function set_catalog_updated_at();
create trigger trg_playlists_search_vector before
insert
    or
update
    on
    public.playlists for each row execute function playlists_search_vector_update();


-- public.user_sessions определение

-- Drop table

-- DROP TABLE public.user_sessions;

CREATE TABLE public.user_sessions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	device_info text DEFAULT 'unknown'::text NOT NULL,
	refresh_token text NOT NULL,
	expires_at timestamptz NOT NULL,
	last_used_at timestamptz DEFAULT now() NOT NULL,
	revoked bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT user_sessions_expires_after_created CHECK ((expires_at > created_at)),
	CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
	CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX user_sessions_active_idx ON public.user_sessions USING btree (user_id, expires_at) WHERE (revoked = false);
CREATE INDEX user_sessions_expires_at_idx ON public.user_sessions USING btree (expires_at);
CREATE UNIQUE INDEX user_sessions_refresh_token_unique_idx ON public.user_sessions USING btree (refresh_token);
CREATE INDEX user_sessions_user_id_idx ON public.user_sessions USING btree (user_id);


-- public.playlist_collaborators определение

-- Drop table

-- DROP TABLE public.playlist_collaborators;

CREATE TABLE public.playlist_collaborators (
	playlist_id uuid NOT NULL,
	user_id uuid NOT NULL,
	"role" text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT playlist_collaborators_pkey PRIMARY KEY (playlist_id, user_id),
	CONSTRAINT playlist_collaborators_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text]))),
	CONSTRAINT playlist_collaborators_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE,
	CONSTRAINT playlist_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX ix_playlist_collaborators_user_id ON public.playlist_collaborators USING btree (user_id);


-- public.playlist_invites определение

-- Drop table

-- DROP TABLE public.playlist_invites;

CREATE TABLE public.playlist_invites (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	playlist_id uuid NOT NULL,
	created_by uuid NOT NULL,
	"token" text NOT NULL,
	"role" text NOT NULL,
	expires_at timestamptz NOT NULL,
	revoked bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT playlist_invites_pkey PRIMARY KEY (id),
	CONSTRAINT playlist_invites_role_check CHECK ((role = ANY (ARRAY['editor'::text, 'viewer'::text]))),
	CONSTRAINT playlist_invites_token_key UNIQUE (token),
	CONSTRAINT playlist_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT playlist_invites_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE
);
CREATE INDEX ix_playlist_invites_playlist_created_at ON public.playlist_invites USING btree (playlist_id, created_at DESC);


-- public.playlist_tracks определение

-- Drop table

-- DROP TABLE public.playlist_tracks;

CREATE TABLE public.playlist_tracks (
	playlist_id uuid NOT NULL,
	track_id uuid NOT NULL,
	added_by uuid NULL,
	added_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT playlist_tracks_pkey PRIMARY KEY (playlist_id, track_id),
	CONSTRAINT playlist_tracks_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id) ON DELETE SET NULL,
	CONSTRAINT playlist_tracks_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE,
	CONSTRAINT playlist_tracks_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE
);
CREATE INDEX ix_playlist_tracks_track_id ON public.playlist_tracks USING btree (track_id);