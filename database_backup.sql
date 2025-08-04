--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archetype_primary_skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.archetype_primary_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    archetype_id uuid NOT NULL,
    skill_id uuid NOT NULL
);


ALTER TABLE public.archetype_primary_skills OWNER TO neondb_owner;

--
-- Name: archetype_secondary_skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.archetype_secondary_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    archetype_id uuid NOT NULL,
    skill_id uuid NOT NULL
);


ALTER TABLE public.archetype_secondary_skills OWNER TO neondb_owner;

--
-- Name: archetypes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.archetypes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.archetypes OWNER TO neondb_owner;

--
-- Name: candle_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.candle_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.candle_transactions OWNER TO neondb_owner;

--
-- Name: chapters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chapters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chapters OWNER TO neondb_owner;

--
-- Name: character_achievements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.character_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.character_achievements OWNER TO neondb_owner;

--
-- Name: characters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.characters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    player_name text NOT NULL,
    heritage uuid NOT NULL,
    culture uuid NOT NULL,
    archetype uuid NOT NULL,
    body integer NOT NULL,
    stamina integer NOT NULL,
    experience integer DEFAULT 0 NOT NULL,
    user_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    skills text[] DEFAULT '{}'::text[] NOT NULL,
    is_retired boolean DEFAULT false NOT NULL,
    retired_at timestamp without time zone,
    retired_by uuid,
    retirement_reason text,
    total_xp_spent integer DEFAULT 0 NOT NULL,
    second_archetype text
);


ALTER TABLE public.characters OWNER TO neondb_owner;

--
-- Name: culture_secondary_skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.culture_secondary_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    culture_id uuid NOT NULL,
    skill_id uuid NOT NULL
);


ALTER TABLE public.culture_secondary_skills OWNER TO neondb_owner;

--
-- Name: cultures; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cultures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    heritage_id uuid NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cultures OWNER TO neondb_owner;

--
-- Name: custom_achievements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.custom_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon_name text DEFAULT 'trophy'::text NOT NULL,
    rarity text DEFAULT 'common'::text NOT NULL,
    condition_type text DEFAULT 'manual'::text NOT NULL,
    condition_value integer,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_achievements_condition_type_check CHECK ((condition_type = ANY (ARRAY['manual'::text, 'xp_spent'::text, 'skill_count'::text, 'attribute_value'::text]))),
    CONSTRAINT custom_achievements_rarity_check CHECK ((rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text])))
);


ALTER TABLE public.custom_achievements OWNER TO neondb_owner;

--
-- Name: custom_milestones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.custom_milestones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    threshold integer NOT NULL,
    icon_name text DEFAULT 'star'::text NOT NULL,
    color text DEFAULT 'text-blue-600'::text NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.custom_milestones OWNER TO neondb_owner;

--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    character_id uuid NOT NULL,
    xp_purchases integer DEFAULT 0 NOT NULL,
    xp_candle_purchases integer DEFAULT 0 NOT NULL,
    attended boolean DEFAULT false,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_rsvps OWNER TO neondb_owner;

--
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    event_date timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    chapter_id uuid NOT NULL
);


ALTER TABLE public.events OWNER TO neondb_owner;

--
-- Name: experience_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.experience_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    character_id uuid NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    event_id uuid,
    awarded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    rsvp_id uuid
);


ALTER TABLE public.experience_entries OWNER TO neondb_owner;

--
-- Name: heritage_secondary_skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.heritage_secondary_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    heritage_id uuid NOT NULL,
    skill_id uuid NOT NULL
);


ALTER TABLE public.heritage_secondary_skills OWNER TO neondb_owner;

--
-- Name: heritages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.heritages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    body integer NOT NULL,
    stamina integer NOT NULL,
    icon text NOT NULL,
    description text NOT NULL,
    costume_requirements text NOT NULL,
    benefit text NOT NULL,
    weakness text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.heritages OWNER TO neondb_owner;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL
);


ALTER TABLE public.permissions OWNER TO neondb_owner;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6B7280'::text NOT NULL,
    is_system_role boolean DEFAULT false NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    prerequisite_skill_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.skills OWNER TO neondb_owner;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    player_number text,
    chapter_id uuid,
    player_name text,
    candles integer DEFAULT 0,
    role text DEFAULT 'user'::text NOT NULL,
    role_id uuid,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    title text
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: archetype_primary_skills; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.archetype_primary_skills (id, archetype_id, skill_id) FROM stdin;
798da1b3-dd7a-4adc-ae43-c92795dd1208	b2a09817-89f4-4b08-8427-fcaa401057e9	801dc7f0-3392-4229-a973-bc6962a487d0
7dd41aa7-4243-4b15-b462-b1ed3a4737ae	b2a09817-89f4-4b08-8427-fcaa401057e9	27bbec26-b679-4046-b8bf-b570fa99564d
\.


--
-- Data for Name: archetype_secondary_skills; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.archetype_secondary_skills (id, archetype_id, skill_id) FROM stdin;
7545a96f-122b-4347-b63f-4267192176f2	b2a09817-89f4-4b08-8427-fcaa401057e9	cb23e645-2b77-4ef1-a4f5-f65a1fc52796
f76fae6e-b35e-4e42-9c2a-c3138efc3e6b	b2a09817-89f4-4b08-8427-fcaa401057e9	45fedae9-2167-4cca-8da9-b56a2d904976
\.


--
-- Data for Name: archetypes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.archetypes (id, name, description, is_active, created_by, created_at, updated_at) FROM stdin;
b3010c13-6a11-4cd4-aae6-b730dbbf8a00	Chef	Toiling away in front of a hot stove	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 00:49:30.625087
113bd310-dc2b-4d6a-9230-fb77a0542184	Entertainer	Perhaps you would like to hear a song?	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 00:49:30.625087
671fe6b7-3d5c-4863-85fa-019c0e8680c2	Wizard		t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 02:00:07.859487	2025-08-03 02:00:07.859487
49743edf-71ca-40b7-a0d4-9d23f07b5a63	Adviser	I give council where it is most needed.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:01:23.087
13455b5c-5cd0-4b92-8301-88537effd734	Apothecary	All things may be transformed.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:01:34.197
d10ebe4b-b7ae-4474-a312-8f745fb8686e	Archer	Aim straight, aim true, and let your arrow fly.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:01:43.915
dd33a6f2-d5ef-44fb-a59b-0f8ce21d7762	Berserker	Rage...	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:01:55.282
b9d1004c-4f90-46db-9b73-7b013bf1478b	Brute	I don't have time to bleed...	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:02:23.787
0f8a0de0-45c0-455b-a91e-6ea23b58a890	Courtesan	“Serving others is a delight.”	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:02:43.887
3c11c264-a734-4e19-868a-b5d50e97e5fc	Ecomancer	Nature is red in tooth and claw.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:02:53.964
f23d8325-8126-411f-b0ea-da2c530aa46a	Elementalist	Fire and ice shall bend to my will.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:03:05.839
6a9abfc3-546b-4aa9-8c77-cda16b5588b3	Erudite	Speak not wisdom to those that are incapable of\nunderstanding.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:03:23.857
632ec8ac-3b8e-4ea3-9d45-7859babf90b3	Farmer	It’s honest work.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:03:32.405
cdef75df-054c-4af0-962e-9b5e3db750de	Forester	The woods are lovely, dark and deep...	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:03:42.901
b99fe80c-5ff2-4e27-9532-3f5896bfe100	Forgewright	My hammer sings on steel, and crushes bone.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:03:52.5
e3c7c405-75a6-4a37-be4a-3a3b324b19f4	Gunslinger	Masters of firearms, a Gunslinger deals in lead.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:04:06.986
8fea29d7-2beb-403c-a71f-c2240fd4716d	Juggernaut	Trust your steel.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:04:16.357
66364975-ec9a-4143-97f6-41e94c7ddb43	Merchant	Everything and everyone has their price.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:04:26.753
0f8c79ce-721d-4842-983f-d6b73d60c5c0	Mystic	Master that which lies within.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:04:35.187
9d9791e9-000b-4b78-a230-458a5ccaee8c	Physician	Save lives and tend to the wellbeing of others.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:04:47.849
6e30b1ca-7179-4566-b70c-c2fdc0256c51	Rogue	It’s only wrong if you get caught.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:04:58.081
0897f044-4b2d-4fa4-8623-7a755db34347	Scholar	Knowledge is power.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:05:10.048
904bb214-dfc0-4458-87c0-8c10ba01b304	Scoundrel	All is fair in love and war... and cards.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:05:24.235
f93f4806-2a11-4071-b79d-12d8081a8dca	Shadowcaster	In shadows are the lost treasures of hidden knowledge.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:05:36.421
614d1c5d-ac04-42d5-a413-7657dbe9b923	Skirmisher	Keep your wits as sharp as your steel.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:05:46.772
830186df-597f-4f49-9351-e1af7b9d1715	Slayer	Sometimes you must become a monster to hunt the monsters.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:06:04.028
ca0a8599-e5fa-4299-a235-d2dfbf69f9ce	Soldier	The Soldier is unique in that they are the only\nArchetype that has the capability to effectively use\nall weapon and armor types.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:06:25.725
caf9f0c4-600a-4176-842f-f1c4d7d7aa2c	Spellblade	By steel and sorcery I slay my foes.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 02:06:49.011706	2025-08-03 02:06:49.011706
7c543f5c-0b20-488a-9386-742ffdbd1678	Sorcerer	The eldritch power of the arcane flows through my blood.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 02:07:08.975472	2025-08-03 02:07:08.975472
a9586b95-e0b1-4de9-b506-55d84234928e	Thaumaturgist	Through the arcane, I unlock powers unknown to other\nmortals.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 02:07:31.398524	2025-08-03 02:07:31.398524
b2a09817-89f4-4b08-8427-fcaa401057e9	Tinker	I can fix anything... with the right tools.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:07:52.123
6288fff3-136c-4564-9df7-2afc0b2311eb	Warden	The world is a dangerous place...	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:30.625087	2025-08-03 02:08:12.315
\.


--
-- Data for Name: candle_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.candle_transactions (id, user_id, amount, reason, created_by, created_at) FROM stdin;
8524f4cf-ffac-4555-99c7-75c0d804b990	88d7cc4b-22fc-4694-a7c9-a5497a211a22	111	donation of goods	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 17:25:39.42755
f1c98c23-045c-40f1-85f3-b6f747e01b95	b1dccec1-0d8e-4854-a2e1-92722188643a	9001	because	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:11:26.597152
26360f24-dedd-4eca-9240-789076e78883	b1dccec1-0d8e-4854-a2e1-92722188643a	9001	because	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:11:59.021387
6ecaccf8-2b24-4924-85e8-e0c9ff3dd886	b1dccec1-0d8e-4854-a2e1-92722188643a	9001	because	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:13:58.639323
560bc511-e8bf-45bc-a612-c405b822317c	f9afd461-db82-4e0c-8c2a-30eb7cc8d845	9001	because	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:14:11.654109
0c17e212-baf3-4260-9225-91a6e25e684d	88d7cc4b-22fc-4694-a7c9-a5497a211a22	500	because	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:14:31.822535
ee158bcd-46b9-4124-9337-85f8f295a3da	f9afd461-db82-4e0c-8c2a-30eb7cc8d845	500	because	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:14:43.778134
46b0b76e-3011-4b38-aef6-ba481926d181	88d7cc4b-22fc-4694-a7c9-a5497a211a22	10	test	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:15:57.189693
5db1197b-eb33-42fc-b74b-8cf077fd9cf1	b1dccec1-0d8e-4854-a2e1-92722188643a	500	test	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:17:01.927162
2c1fcdb6-03f0-4658-94bc-d1db2cfa598f	f9afd461-db82-4e0c-8c2a-30eb7cc8d845	500	test	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:17:10.684123
8ba550a3-140d-4b08-9051-2f6b1105a4d1	88d7cc4b-22fc-4694-a7c9-a5497a211a22	-500	test fixed	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:18:08.580414
42b1b50e-022d-4051-bcee-7dce5ebcf09a	88d7cc4b-22fc-4694-a7c9-a5497a211a22	-10	correction	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:18:22.26454
692982be-5608-4cee-8a92-eea744ed937a	88d7cc4b-22fc-4694-a7c9-a5497a211a22	-20	XP candle purchases for event RSVP (2 purchases)	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-07-31 18:49:50.968809
240c608d-1d53-44e7-839c-62b64ebe4806	88d7cc4b-22fc-4694-a7c9-a5497a211a22	-20	XP candle purchases for event RSVP (2 purchases)	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-07-31 18:50:10.578067
a9a8b7e8-acee-4561-8a3b-49f3a1f8a90a	b1dccec1-0d8e-4854-a2e1-92722188643a	-10	XP candle purchases for event RSVP (1 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:51:31.822426
780d5369-e65e-4f3a-a2fc-388f3e6c02d1	b1dccec1-0d8e-4854-a2e1-92722188643a	-20000	test	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 19:27:55.619679
b84d5f97-54f6-4c50-8c7e-e55ee960b5b6	f9afd461-db82-4e0c-8c2a-30eb7cc8d845	-9800	test	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 19:28:10.190768
ce8bcbcc-97c0-4712-99b5-3ea2fa13dcab	88d7cc4b-22fc-4694-a7c9-a5497a211a22	50	test	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 19:28:19.724934
7e88e0c4-4150-4b44-b2d2-86ad5faf5673	88d7cc4b-22fc-4694-a7c9-a5497a211a22	-20	XP candle purchases for event RSVP (2 purchases)	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-07-31 21:51:38.21197
e7e728d9-335e-4e65-aada-c710902ac1c4	88d7cc4b-22fc-4694-a7c9-a5497a211a22	-20	XP candle purchases for event RSVP (2 purchases)	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-07-31 21:51:48.223968
7e297945-884a-4dbb-9320-ce3c7ea7980e	88d7cc4b-22fc-4694-a7c9-a5497a211a22	60	missing	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 21:52:58.778445
323b273a-b9e6-4de6-b4e2-3365fdc796a4	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:15:59.270977
9e58d443-39f6-4492-a0ef-cf48b3a79ca7	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:16:12.748965
282b97f8-bd48-4b2c-b410-325173419bf9	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:16:26.277183
c63a4e42-a158-4991-a0e6-d0962afcb177	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:16:41.863716
d71445b6-27c2-4016-bfab-865a8d483d38	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:16:59.139453
34ccd3c3-14b4-4dfd-a3e0-89c1a5409835	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:17:14.382687
6af18769-52ad-49d8-9e25-981ef7ad8d2b	b1dccec1-0d8e-4854-a2e1-92722188643a	2756	because	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 23:18:22.730639
9503e0c6-d749-42fc-8e5c-e8c606224824	88d7cc4b-22fc-4694-a7c9-a5497a211a22	50	donation	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 23:18:36.241289
a133954f-115e-46a0-b7b7-690108a45019	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:41:35.490264
5c880c2c-f3ee-4cce-a625-303f7a761716	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:41:45.663802
5a3b1abf-b5b3-4c1f-b06e-5a43d611294d	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:41:53.005997
26bdf2d7-25d4-4c29-ba4b-a01bf0357038	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:41:59.405489
e9a62bce-a193-4f69-b110-42dbf70b0e78	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:42:05.002199
1f0efd2b-8e35-411c-916a-e3c8969a1881	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:42:12.669402
8ee6d394-5aa3-4255-a5fc-9605a91359c3	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:42:18.553066
6affeb29-e278-489b-92e2-ad8523f05632	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:42:24.213107
dd54aed1-db19-4282-81da-43918b78e658	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:59:32.802316
d0b25ce9-e47f-476e-bec2-ec3257630428	b1dccec1-0d8e-4854-a2e1-92722188643a	-20	XP candle purchases for event RSVP (2 purchases)	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 16:59:39.191124
c3e9bb2b-8220-4941-b887-9101e9dee227	88d7cc4b-22fc-4694-a7c9-a5497a211a22	-20	XP candle purchases for event RSVP (2 purchases)	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 22:48:17.985516
d10349df-92e8-40ac-a74d-0a72519eb2e0	f9afd461-db82-4e0c-8c2a-30eb7cc8d845	2	testing candle management after api fail	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 23:04:52.609439
fe10cfdc-4893-4dff-97fa-520eff691fe9	f1112722-7f77-45df-8d65-0515a3222b60	5000	he good	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 18:53:26.743312
\.


--
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chapters (id, name, code, description, is_active, created_by, created_at, updated_at) FROM stdin;
f71b49e4-4f37-4511-958f-b40f28e728bc	Wanderer's Hope - Florida	FL	The primary Florida chapter for Thrune LARP events and campaigns.	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 16:11:18.566241	2025-08-02 00:03:23.104
2beb7d4a-15fc-4326-b610-8f9100672069	Test Chapter - Nowhere	TT	For testing purposes	f	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-02 00:05:34.663172	2025-08-02 00:18:55.362
\.


--
-- Data for Name: character_achievements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.character_achievements (id, character_id, achievement_id, unlocked_at) FROM stdin;
\.


--
-- Data for Name: characters; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.characters (id, name, player_name, heritage, culture, archetype, body, stamina, experience, user_id, is_active, created_at, updated_at, skills, is_retired, retired_at, retired_by, retirement_reason, total_xp_spent, second_archetype) FROM stdin;
348fad91-700c-4e07-be12-713f1ecf2c77	Theogrun	Spauldinacus	b5259a95-f5d6-4d79-8638-93ef28d5106c	bdf23bed-aa7c-4631-b20a-146833a8a219	b2a09817-89f4-4b08-8427-fcaa401057e9	15	25	15	88d7cc4b-22fc-4694-a7c9-a5497a211a22	t	2025-08-01 17:21:42.007959	2025-08-03 02:31:00.154	{Blacksmithing,"Lore (Engineering)",Mining,Scavenging,"Weapon Smithing",Trapper}	f	\N	\N	\N	80	\N
f7dbab14-048e-4b87-912d-42d3d0f16bda	bill	Travis_	c84bb8cc-3d21-499e-b284-f02c8c3858dd	20c10836-c8e8-48fc-9f6c-40650389957b	8fea29d7-2beb-403c-a71f-c2240fd4716d	22	11	-10	f1112722-7f77-45df-8d65-0515a3222b60	t	2025-08-02 16:04:36.717303	2025-08-03 02:31:00.851	{"Shield Master"}	f	\N	\N	\N	35	\N
c4f0ea98-a408-40ea-8836-181817b17f66	not bill	Travis_	c84bb8cc-3d21-499e-b284-f02c8c3858dd	6faa5bb5-2b05-4a94-a41f-e9f3aa6a8352	13455b5c-5cd0-4b92-8301-88537effd734	10	25	-15	f1112722-7f77-45df-8d65-0515a3222b60	t	2025-08-02 16:14:46.715824	2025-08-03 02:31:01.549	{Alchemy}	f	\N	\N	\N	40	\N
\.


--
-- Data for Name: culture_secondary_skills; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.culture_secondary_skills (id, culture_id, skill_id) FROM stdin;
\.


--
-- Data for Name: cultures; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cultures (id, name, heritage_id, description, is_active, created_by, created_at, updated_at) FROM stdin;
87fd0eb8-d7ce-4f49-8b82-20eff37ac97b	Eisolae	c84bb8cc-3d21-499e-b284-f02c8c3858dd	Ar-Nura culture focused on magic and meditation	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
c6e7fa6e-fd40-43a2-8826-0832d885df0b	Jhani'ada	c84bb8cc-3d21-499e-b284-f02c8c3858dd	Ar-Nura warrior culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
73bcc00c-b9a5-4c30-9481-1262288c7022	Viskela	c84bb8cc-3d21-499e-b284-f02c8c3858dd	Ar-Nura social and mercantile culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
6faa5bb5-2b05-4a94-a41f-e9f3aa6a8352	Erdanian	d3294da1-f713-4163-a82f-0af5aeb736fd	Human warrior culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
840c5354-17fd-444a-bae6-16397f2e932c	Khemasuri	d3294da1-f713-4163-a82f-0af5aeb736fd	Human merchant culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
20c10836-c8e8-48fc-9f6c-40650389957b	Saronean	d3294da1-f713-4163-a82f-0af5aeb736fd	Human ranger culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
4c41c174-4b40-42df-b5b9-8a0d9eb0fd36	Vyaldur	d3294da1-f713-4163-a82f-0af5aeb736fd	Human scavenger culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
d84ddfa0-ef97-41f5-8215-c07e1c3d417a	Dargadian	b5259a95-f5d6-4d79-8638-93ef28d5106c	Stoneborn warrior culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
bdf23bed-aa7c-4631-b20a-146833a8a219	Akhunrasi	b5259a95-f5d6-4d79-8638-93ef28d5106c	Stoneborn crafting culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
7bcb1dc5-0beb-4673-8c6b-31629355e6a4	Kahrnuthaen	b5259a95-f5d6-4d79-8638-93ef28d5106c	Stoneborn engineering culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
c4d6d6e8-8359-4aba-876d-2c469b6955c0	Gragrimn	84076bc5-843b-47a4-a3b4-e6c7e2d66314	Ughol warrior culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
5dd5fdd5-16e5-45ee-8e25-1d031ae43ec9	Skraata	84076bc5-843b-47a4-a3b4-e6c7e2d66314	Ughol stealth culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
c5db8876-7654-4854-86b8-01b5fa000cee	Voruk	84076bc5-843b-47a4-a3b4-e6c7e2d66314	Ughol nature culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
211381d3-1942-44e5-8a89-1c5968a10001	Maolawki	25882721-3f6c-4fb4-861d-ff1d975862e9	Rystarri mystic culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
e617b00c-0cd4-4c6b-bf14-b7e2c85b162f	Yarowi	25882721-3f6c-4fb4-861d-ff1d975862e9	Rystarri trader culture	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:11.61779	2025-08-03 00:49:11.61779
\.


--
-- Data for Name: custom_achievements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.custom_achievements (id, title, description, icon_name, rarity, condition_type, condition_value, is_active, created_by, created_at, updated_at) FROM stdin;
142366d3-da41-46da-b862-b1746dcf72fc	Ultimate Answer	Spend 42 XP to show that you know the ultimate answer to life, the universe, and everything.	trophy	common	xp_spent	42	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 20:30:28.655318	2025-07-31 20:36:45.025
\.


--
-- Data for Name: custom_milestones; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.custom_milestones (id, title, description, threshold, icon_name, color, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_rsvps; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.event_rsvps (id, event_id, character_id, xp_purchases, xp_candle_purchases, attended, user_id, created_at, updated_at) FROM stdin;
2a21d122-7d9a-4037-87cb-6f6247f8dc88	01613ba2-543d-44dd-9ce6-78669d831aba	348fad91-700c-4e07-be12-713f1ecf2c77	0	0	t	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:24:17.204089	2025-08-01 17:36:59.07587
95c9c5c3-631e-4411-81c0-9bf0162591a5	139239de-05eb-465f-86ab-46e99038ea0a	348fad91-700c-4e07-be12-713f1ecf2c77	0	0	t	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:24:03.808204	2025-08-01 17:36:59.07587
87a9bd2d-435a-41eb-941f-859e8571e8f4	46bd830e-5e06-414f-8b13-fa3e6a6dc45c	348fad91-700c-4e07-be12-713f1ecf2c77	0	0	t	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:24:12.90086	2025-08-01 17:36:59.07587
b41e2193-0853-45f3-9412-6e63497b4089	5dd36664-0f44-4577-b937-3a7500d3a3fe	348fad91-700c-4e07-be12-713f1ecf2c77	0	0	t	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:23:59.175597	2025-08-01 17:36:59.07587
22f47b1d-313d-4c9c-87ac-c770bca3a3b0	67f2cfe5-1f7c-41cd-a798-3c7c72ced957	348fad91-700c-4e07-be12-713f1ecf2c77	0	0	t	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:23:46.939097	2025-08-01 17:36:59.07587
f8ad80e5-b714-42e5-ba9c-d6c3146bcc1d	6ade100a-7008-4acc-ba56-b32eb072564f	348fad91-700c-4e07-be12-713f1ecf2c77	0	0	t	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:23:53.671207	2025-08-01 17:36:59.07587
e454ca3e-384c-4c39-9171-0ab8d2236517	bd210653-66ed-4998-9e60-437b1a46def2	348fad91-700c-4e07-be12-713f1ecf2c77	0	0	t	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:24:08.758749	2025-08-01 17:36:59.07587
7e32e5f4-0a70-440b-98df-ca37286596a3	cc6c0781-8df3-4d99-85ed-19bf59098591	348fad91-700c-4e07-be12-713f1ecf2c77	2	2	f	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 22:48:18.053304	2025-08-01 22:48:18.053304
dcceb955-9448-443b-895b-179ecf96733e	cc6c0781-8df3-4d99-85ed-19bf59098591	f7dbab14-048e-4b87-912d-42d3d0f16bda	2	0	f	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:19:43.982042	2025-08-02 16:19:43.982042
1af0a3f8-1043-43f6-8365-a46071493e3c	cc6c0781-8df3-4d99-85ed-19bf59098591	c4f0ea98-a408-40ea-8836-181817b17f66	2	0	f	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:20:03.412569	2025-08-02 16:20:03.412569
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, name, description, event_date, is_active, created_by, created_at, chapter_id) FROM stdin;
cc6c0781-8df3-4d99-85ed-19bf59098591	Season 2 Opener		2025-08-23 23:26:00	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 19:26:41.072296	f71b49e4-4f37-4511-958f-b40f28e728bc
01613ba2-543d-44dd-9ce6-78669d831aba	Summer Event 2	Not a physically held event, available for XP purchase at reduced cost.	2025-07-02 06:05:00	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:07:11.069425	f71b49e4-4f37-4511-958f-b40f28e728bc
46bd830e-5e06-414f-8b13-fa3e6a6dc45c	Summer Event 1	Not a physically held event, available for XP purchase at reduced cost.	2025-06-02 06:05:00	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:06:48.896516	f71b49e4-4f37-4511-958f-b40f28e728bc
67f2cfe5-1f7c-41cd-a798-3c7c72ced957	First Event		2025-01-01 22:47:00	f	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 17:47:55.688368	f71b49e4-4f37-4511-958f-b40f28e728bc
6ade100a-7008-4acc-ba56-b32eb072564f	Second Event		2025-02-02 03:05:00	f	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:05:22.316457	f71b49e4-4f37-4511-958f-b40f28e728bc
5dd36664-0f44-4577-b937-3a7500d3a3fe	Third Event		2025-03-02 03:05:00	f	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:05:39.718845	f71b49e4-4f37-4511-958f-b40f28e728bc
139239de-05eb-465f-86ab-46e99038ea0a	Fourth Event		2025-04-02 02:05:00	f	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:05:57.143787	f71b49e4-4f37-4511-958f-b40f28e728bc
bd210653-66ed-4998-9e60-437b1a46def2	Fifth Event		2025-05-02 02:05:00	f	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 22:06:11.704983	f71b49e4-4f37-4511-958f-b40f28e728bc
\.


--
-- Data for Name: experience_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.experience_entries (id, character_id, amount, reason, event_id, awarded_by, created_at, rsvp_id) FROM stdin;
6bca4084-243f-4aa1-8bec-e3b078048a72	348fad91-700c-4e07-be12-713f1ecf2c77	25	Character creation	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.044358	\N
1623c5c2-76d6-4a5f-95f7-c1a49d8dc7ca	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Stamina increase: 5→6	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.141511	\N
ad776a11-68df-42a0-bb3e-e33c28910107	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Stamina increase: 6→7	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.243729	\N
943cbb41-aac8-405d-8371-07f66e7d3f3d	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Stamina increase: 7→8	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.338482	\N
68ce3d0a-5ec6-41e7-a5da-cdf70f1c31ba	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Stamina increase: 8→9	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.426163	\N
6865a14f-39fe-498e-b317-3cfb8259073f	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Stamina increase: 9→10	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.520962	\N
3d05a896-fd0b-49b5-ad6a-c9b3af5ec794	348fad91-700c-4e07-be12-713f1ecf2c77	10	Event attendance: First Event	67f2cfe5-1f7c-41cd-a798-3c7c72ced957	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:23:46.939097	\N
7e359f33-b25d-475e-b840-7b1da4475fa6	348fad91-700c-4e07-be12-713f1ecf2c77	10	Event attendance: Second Event	6ade100a-7008-4acc-ba56-b32eb072564f	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:23:53.671207	\N
fa4cd8f6-eb3c-4f0e-87de-f624a2c19d8a	348fad91-700c-4e07-be12-713f1ecf2c77	10	Event attendance: Third Event	5dd36664-0f44-4577-b937-3a7500d3a3fe	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:23:59.175597	\N
50e1e658-9f12-42f6-a7ae-aabd723581f4	348fad91-700c-4e07-be12-713f1ecf2c77	10	Event attendance: Fourth Event	139239de-05eb-465f-86ab-46e99038ea0a	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:24:03.808204	\N
a2e6e0bd-af1f-42cb-a521-75572eb15edb	348fad91-700c-4e07-be12-713f1ecf2c77	10	Event attendance: Fifth Event	bd210653-66ed-4998-9e60-437b1a46def2	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:24:08.758749	\N
90cbc73b-9083-4b60-aff8-ed476a85afc0	348fad91-700c-4e07-be12-713f1ecf2c77	10	Event attendance: Summer Event 1	46bd830e-5e06-414f-8b13-fa3e6a6dc45c	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:24:12.90086	\N
c9ea30df-df72-42c9-aff6-13a4566c9d7e	348fad91-700c-4e07-be12-713f1ecf2c77	10	Event attendance: Summer Event 2	01613ba2-543d-44dd-9ce6-78669d831aba	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:24:17.204089	\N
6b0ad2bd-14bc-45ab-8bce-e4d9f99a1071	348fad91-700c-4e07-be12-713f1ecf2c77	-10	Admin added skill: Weapon Smithing	\N	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:24:40.978501	\N
6dcff300-59ab-407a-80de-d73074d9ccf0	348fad91-700c-4e07-be12-713f1ecf2c77	-5	Admin added skill: Trapper	\N	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:24:48.640317	\N
5cadc32a-8edf-4ef5-a61b-a74f3f2a02ba	348fad91-700c-4e07-be12-713f1ecf2c77	-20	Increased stamina by 15 points	\N	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-01 17:25:38.448559	\N
69ccfd2b-019e-4a1d-9002-95d86495e84f	f7dbab14-048e-4b87-912d-42d3d0f16bda	25	Character creation	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:36.769123	\N
38ee6b18-3c52-4a66-a96c-ebddde3e15a5	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 10→11	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:36.886025	\N
7705db98-e39a-45a2-929d-511e34068752	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 11→12	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:36.977923	\N
cc86ae52-05bc-40c8-a1e8-af2838462f36	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 12→13	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.069434	\N
c827475a-14f5-46d1-a5c8-e93421e1f126	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 13→14	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.162481	\N
73e62f3a-3eca-4025-ba8d-c636305f4083	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 14→15	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.254307	\N
5d38d514-317b-41b8-8e90-464668824595	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 15→16	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.346997	\N
a091aa20-b0c2-4ba5-87e9-83251709037d	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 16→17	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.438935	\N
7a3f7a79-2621-40f9-a246-aa7719bcef08	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 17→18	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.530974	\N
f88b3000-f1c9-4afe-9621-4fe9c95ac2e5	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 18→19	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.624619	\N
147c1662-bd20-4a5b-9684-b6f11fb3f5e2	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Body increase: 19→20	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.71599	\N
bf93aba8-e76c-441b-bfb1-faa38a84b292	f7dbab14-048e-4b87-912d-42d3d0f16bda	-2	Body increase: 20→21	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.808666	\N
7743ec89-87c0-4099-92f0-498845448d35	f7dbab14-048e-4b87-912d-42d3d0f16bda	-2	Body increase: 21→22	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.899232	\N
b652b36d-8569-48df-8128-0641fcdfefb5	f7dbab14-048e-4b87-912d-42d3d0f16bda	-1	Stamina increase: 10→11	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:37.990257	\N
d304c28a-c353-47ef-bf5a-a2c3e99f4c23	c4f0ea98-a408-40ea-8836-181817b17f66	25	Character creation	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:46.789002	\N
a45c4a87-97f6-4ec6-aafb-ba7bc49f48c3	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 10→11	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:46.888499	\N
6ed8f832-43ba-4e72-91c8-8cab98769292	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 11→12	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:46.979624	\N
590a5cb9-f3b3-4d98-b04a-5e8cffb854df	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 12→13	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.067295	\N
d60be025-03ff-4e62-83cb-0e339a37bd48	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 13→14	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.157074	\N
4d5dadcd-ccda-4e60-bd1f-18932f79ad77	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 14→15	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.244869	\N
5647760e-231e-4a39-b47a-f07540afffb4	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 15→16	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.33354	\N
b924ebe5-029b-4f8a-b9df-087954cbef3c	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 16→17	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.42286	\N
7c5fa1dc-df07-4aac-a8ce-2356c40afda2	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 17→18	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.51182	\N
9d9e381c-a0cd-4bca-9718-6b3a51000d26	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 18→19	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.601074	\N
225b0eee-bd22-445e-ba2e-d934d2461785	c4f0ea98-a408-40ea-8836-181817b17f66	-1	Stamina increase: 19→20	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.68908	\N
88bd4664-60d2-4a2c-bac2-a17c79d7c1cd	c4f0ea98-a408-40ea-8836-181817b17f66	-2	Stamina increase: 20→21	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.777798	\N
450bbdfd-06ff-4e63-9dff-1cebe3dbbe6c	c4f0ea98-a408-40ea-8836-181817b17f66	-2	Stamina increase: 21→22	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.866477	\N
11ec536b-b102-4cb3-8311-9109c99d6752	c4f0ea98-a408-40ea-8836-181817b17f66	-2	Stamina increase: 22→23	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:47.956206	\N
a99b1966-54b3-4da5-ab22-55aeaea9433d	c4f0ea98-a408-40ea-8836-181817b17f66	-2	Stamina increase: 23→24	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:48.045116	\N
3be96b68-8c90-4811-9299-1309be0b9a89	c4f0ea98-a408-40ea-8836-181817b17f66	-2	Stamina increase: 24→25	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:48.133879	\N
23d43928-0a5a-4985-89b8-a6e87ceedef3	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Body increase: 10→11	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.007	\N
4b9eb52d-07fb-4103-8f6b-2fd882913ace	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Body increase: 11→12	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.007	\N
a23b9591-1d48-4c31-b999-29fb2eb32aff	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Body increase: 12→13	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.007	\N
890f23d3-a385-4d42-894c-f6082dbf8f0f	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Body increase: 13→14	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.007	\N
b923c1e4-31d3-4dc9-a42b-df9daf7a41cd	348fad91-700c-4e07-be12-713f1ecf2c77	-1	Body increase: 14→15	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.007	\N
4f22db8c-8866-43a9-b276-449553df0c72	348fad91-700c-4e07-be12-713f1ecf2c77	-10	Skill purchase: Mining	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.794162	\N
1a53b33a-86ac-41f6-a7ae-42b8574068a3	348fad91-700c-4e07-be12-713f1ecf2c77	-10	Skill purchase: Scavenging	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.881045	\N
a04b0f84-4a93-43bc-ab54-e6afd77afa42	f7dbab14-048e-4b87-912d-42d3d0f16bda	-20	Skill purchase: Shield Master	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:04:38.083499	\N
c48eef82-5e49-4125-b6b5-4c071c7aed70	c4f0ea98-a408-40ea-8836-181817b17f66	-20	Skill purchase: Alchemy	\N	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-02 16:14:48.224044	\N
1e1e0aee-2449-4740-b1a6-1be892791d07	348fad91-700c-4e07-be12-713f1ecf2c77	-5	Skill purchase: Blacksmithing	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.60598	\N
6ecf2365-b41d-44ac-9216-ddcbd2a12a73	348fad91-700c-4e07-be12-713f1ecf2c77	-10	Skill purchase: Lore (Engineering)	\N	88d7cc4b-22fc-4694-a7c9-a5497a211a22	2025-08-01 17:21:42.709433	\N
\.


--
-- Data for Name: heritage_secondary_skills; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.heritage_secondary_skills (id, heritage_id, skill_id) FROM stdin;
dcce08da-647d-4f51-b6f2-e915c6a66d28	b5259a95-f5d6-4d79-8638-93ef28d5106c	30b26004-4a7b-4ff6-a4c2-dc21a0e66557
50de3b5a-6828-4208-834f-2af5fb0de9e7	b5259a95-f5d6-4d79-8638-93ef28d5106c	2265a701-cbdf-4549-86b8-bb2cee289a6e
\.


--
-- Data for Name: heritages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.heritages (id, name, body, stamina, icon, description, costume_requirements, benefit, weakness, is_active, created_by, created_at, updated_at) FROM stdin;
c84bb8cc-3d21-499e-b284-f02c8c3858dd	Ar-Nura	8	12	zap	The eldest heritage, claiming to be firstborn with vast empires and ancient libraries	Pointed ears	Corruption Resistance - Spend 10 Stamina to negate a point of Corruption (except when returning from death)	Arcane Susceptibility - Take double damage from Magic attacks	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:48:52.600233	2025-08-03 00:48:52.600233
d3294da1-f713-4163-a82f-0af5aeb736fd	Human	10	10	user	The most populous and widespread people throughout the realm	None	Human - No inherent benefit or weakness	Human - No inherent benefit or weakness	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:48:52.600233	2025-08-03 00:48:52.600233
b5259a95-f5d6-4d79-8638-93ef28d5106c	Stoneborn	15	5	mountain	Sturdy and stoic people from beneath the mountains, known for craftsmanship	A full beard minimum 6 inches long (all genders)	One More Hammer - Reduce crafting time by 5 minutes for Alchemy, Smithing, Cooking, and Trapper skills	Arcane Disruption - Spend double Stamina to cast spells	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:48:52.600233	2025-08-03 00:48:52.600233
84076bc5-843b-47a4-a3b4-e6c7e2d66314	Ughol	12	8	leaf	Commonly called greenskins, they band together in motley crews for protection	Green or grey skin	Regeneration - Regain 1 Body per minute (as long as not in Bleed Out)	Weak to Corruption - Take 2 points of Corruption instead of 1	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:48:52.600233	2025-08-03 00:48:52.600233
25882721-3f6c-4fb4-861d-ff1d975862e9	Rystarri	12	8	moon	A nomadic feline people known as Bringers of the Lost	Cat ears or feline mask, with a tail attached to exterior of clothing	Claws - Always equipped with unarmed claws that inflict 2 base damage	Call of the Far Realms - Bleeding Out period is only 1 minute long	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:48:52.600233	2025-08-03 00:48:52.600233
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.permissions (id, name, description, category) FROM stdin;
2b17d7f4-a386-4569-8edb-5279d93bec7e	view_users	View user list and details	users
6aff39b7-b6af-4f12-bd3a-de73e88de98f	edit_users	Edit user information and settings	users
04688934-5f1d-4b21-8485-5610ff23e736	delete_users	Delete user accounts	users
5e5a77bb-f07f-4c17-86f4-0dadd5daed25	view_characters	View character information	characters
426c2876-f7a3-4734-9e01-ffd3e263b096	edit_characters	Edit character details and stats	characters
c8694d33-3b7c-4cd5-a5d8-da624d93f86f	create_characters	Create new characters	characters
003f8a55-bdf0-4c26-bf72-f0a9fd2c5fd1	delete_characters	Delete characters	characters
56dd9358-60e4-4f0e-8f1a-3ebba26c296b	view_events	View events and RSVPs	events
fca16e31-7834-489c-a137-fbaeecd9f7dd	create_events	Create new events	events
020952ef-fd6c-4e3c-b4e6-204da6a08514	edit_events	Edit event details	events
b6aa14d3-d637-446b-8909-4f5d5f7c612a	delete_events	Delete events	events
9e0a98e7-eaf7-45d6-91f3-ee09d22ec359	manage_roles	Create and edit roles and permissions	system
9dedc159-27b6-45c1-8cb9-3c49ff1fd7d0	manage_chapters	Manage LARP chapters	system
51ecea59-b650-4981-b82d-8dd0a44fd409	manage_candles	Award and spend player candles	system
58c3c818-cb6c-4f0c-b314-8819be7d880e	view_admin_stats	View administrative statistics	system
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (id, role_id, permission_id) FROM stdin;
623b7158-5b67-4d51-8d0b-60b7bad449b7	4bd53b9a-179f-457d-91fa-3084989acc1a	2b17d7f4-a386-4569-8edb-5279d93bec7e
880c7c75-45cc-4f25-a0fd-cd56940faaf6	b6244c68-af8d-4609-956f-87ddcea776e7	2b17d7f4-a386-4569-8edb-5279d93bec7e
9942fa81-db12-4ccc-8adb-3c0edf1236a2	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	2b17d7f4-a386-4569-8edb-5279d93bec7e
293c39d5-ee39-44cd-b194-782a7276dad9	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	2b17d7f4-a386-4569-8edb-5279d93bec7e
707333d3-5d9b-401c-9c83-09cf6267bd8b	4bd53b9a-179f-457d-91fa-3084989acc1a	6aff39b7-b6af-4f12-bd3a-de73e88de98f
e492d1d6-e020-4fbe-9777-b408d613fe28	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	6aff39b7-b6af-4f12-bd3a-de73e88de98f
0edc6bb5-c807-4ea6-a679-6bda5baef8ab	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	6aff39b7-b6af-4f12-bd3a-de73e88de98f
969c5151-12c9-42bc-bc9c-87a6faf80cae	4bd53b9a-179f-457d-91fa-3084989acc1a	04688934-5f1d-4b21-8485-5610ff23e736
939c6a7e-796c-4bcc-b929-b44064b864a9	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	04688934-5f1d-4b21-8485-5610ff23e736
158f3859-c98a-48b9-a7a4-5d4d46ee877f	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	04688934-5f1d-4b21-8485-5610ff23e736
8744ed79-36c8-4f1e-a1dd-d51f5b053cdd	4bd53b9a-179f-457d-91fa-3084989acc1a	5e5a77bb-f07f-4c17-86f4-0dadd5daed25
373265b9-f401-4a7e-a0d2-23ccad0813fb	b6244c68-af8d-4609-956f-87ddcea776e7	5e5a77bb-f07f-4c17-86f4-0dadd5daed25
584092b6-d2d1-41cb-beac-82bf7fad3f30	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	5e5a77bb-f07f-4c17-86f4-0dadd5daed25
0024162c-ee50-40c4-a95e-5599b189aa13	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	5e5a77bb-f07f-4c17-86f4-0dadd5daed25
48da00e3-4d41-4fd0-b1fb-a6e0e0d55c11	4bd53b9a-179f-457d-91fa-3084989acc1a	426c2876-f7a3-4734-9e01-ffd3e263b096
efbd9239-77a7-469c-ab3e-2b58249225af	b6244c68-af8d-4609-956f-87ddcea776e7	426c2876-f7a3-4734-9e01-ffd3e263b096
c97c74c7-ce08-4327-98da-6ef6eb663160	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	426c2876-f7a3-4734-9e01-ffd3e263b096
0815cf25-3d98-4dd9-8f8a-4862c171dd74	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	426c2876-f7a3-4734-9e01-ffd3e263b096
6cd0516d-a813-470f-af91-56c53f0ef5fa	4bd53b9a-179f-457d-91fa-3084989acc1a	c8694d33-3b7c-4cd5-a5d8-da624d93f86f
6b59b12b-6799-49df-b194-d43b1cbb4ce5	b6244c68-af8d-4609-956f-87ddcea776e7	c8694d33-3b7c-4cd5-a5d8-da624d93f86f
199b9f0d-10e5-401a-9f84-5578166ba4aa	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	c8694d33-3b7c-4cd5-a5d8-da624d93f86f
5ee76fcc-e575-4cc4-924a-a8560b879778	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	c8694d33-3b7c-4cd5-a5d8-da624d93f86f
292058b2-f2db-4e85-9cd5-54f1ade331d1	4bd53b9a-179f-457d-91fa-3084989acc1a	003f8a55-bdf0-4c26-bf72-f0a9fd2c5fd1
3c88eae8-04e4-457e-b20f-99ee611e0921	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	003f8a55-bdf0-4c26-bf72-f0a9fd2c5fd1
917e4627-dcad-49e4-9d51-92b05ae981b8	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	003f8a55-bdf0-4c26-bf72-f0a9fd2c5fd1
be29b793-958c-4be2-8ba1-836e97dbcce9	4bd53b9a-179f-457d-91fa-3084989acc1a	56dd9358-60e4-4f0e-8f1a-3ebba26c296b
1ed2e488-e2b2-479b-a640-7c75f919acc5	b6244c68-af8d-4609-956f-87ddcea776e7	56dd9358-60e4-4f0e-8f1a-3ebba26c296b
b4e0c3b1-af21-491b-9dd6-deed1260f046	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	56dd9358-60e4-4f0e-8f1a-3ebba26c296b
dd8d3f53-1dd4-49ee-a352-f402106aa6f6	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	56dd9358-60e4-4f0e-8f1a-3ebba26c296b
d09eb9bb-85bf-4e2e-a2a1-073d953de6df	4bd53b9a-179f-457d-91fa-3084989acc1a	fca16e31-7834-489c-a137-fbaeecd9f7dd
97736faa-980a-4073-9d28-d101840c446f	b6244c68-af8d-4609-956f-87ddcea776e7	fca16e31-7834-489c-a137-fbaeecd9f7dd
6b445d03-9a8d-4116-be48-d17609ef4556	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	fca16e31-7834-489c-a137-fbaeecd9f7dd
69f9a935-2212-4895-9140-3e7de0b11d1a	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	fca16e31-7834-489c-a137-fbaeecd9f7dd
34a0786a-329b-4f62-ad7a-3eaaeca686e0	4bd53b9a-179f-457d-91fa-3084989acc1a	020952ef-fd6c-4e3c-b4e6-204da6a08514
ec77726b-52d6-4a6c-916f-80f6acbbceb5	b6244c68-af8d-4609-956f-87ddcea776e7	020952ef-fd6c-4e3c-b4e6-204da6a08514
c4b4e391-a809-4cc5-bbbe-ff0eadae99d7	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	020952ef-fd6c-4e3c-b4e6-204da6a08514
432cc875-d4d7-48bc-938d-fb9178d8258a	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	020952ef-fd6c-4e3c-b4e6-204da6a08514
b220ada5-d8d9-4b1b-a786-659e5b311e24	4bd53b9a-179f-457d-91fa-3084989acc1a	b6aa14d3-d637-446b-8909-4f5d5f7c612a
3dc282ed-05db-4dbe-9876-d5d2460c7ba4	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	b6aa14d3-d637-446b-8909-4f5d5f7c612a
59ba66f3-24dc-4512-8e20-fb835d5ed25c	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	b6aa14d3-d637-446b-8909-4f5d5f7c612a
281459b0-39cb-489f-898c-55d10901d381	4bd53b9a-179f-457d-91fa-3084989acc1a	9e0a98e7-eaf7-45d6-91f3-ee09d22ec359
af93005c-14de-4ac8-9687-9ba2b672fe46	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	9e0a98e7-eaf7-45d6-91f3-ee09d22ec359
d80fba54-2e34-45c5-846e-ba673f6b599c	4bd53b9a-179f-457d-91fa-3084989acc1a	9dedc159-27b6-45c1-8cb9-3c49ff1fd7d0
7cd4c04c-c0c3-4e89-8baa-e60eacf1f652	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	9dedc159-27b6-45c1-8cb9-3c49ff1fd7d0
86facb7d-a928-46d3-99c5-c1bfbd5f6f3d	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	9dedc159-27b6-45c1-8cb9-3c49ff1fd7d0
c9595077-743b-4342-9d86-30b952f48c05	4bd53b9a-179f-457d-91fa-3084989acc1a	51ecea59-b650-4981-b82d-8dd0a44fd409
571b9bb7-2361-4946-8ba8-bb2f20923ee3	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	51ecea59-b650-4981-b82d-8dd0a44fd409
8c11bd58-0bf5-4759-83dd-35159e280382	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	51ecea59-b650-4981-b82d-8dd0a44fd409
c8c9c0c3-cc5a-43a6-bb12-d69eba40f2b3	4bd53b9a-179f-457d-91fa-3084989acc1a	58c3c818-cb6c-4f0c-b314-8819be7d880e
d3a9b100-beee-4f5a-b31f-05ec90e2dc9f	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	58c3c818-cb6c-4f0c-b314-8819be7d880e
2b27e52a-d1a6-4e91-8c87-a6fdf5b26b88	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	58c3c818-cb6c-4f0c-b314-8819be7d880e
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, description, color, is_system_role, created_by, created_at, updated_at) FROM stdin;
4bd53b9a-179f-457d-91fa-3084989acc1a	User	Basic user with limited permissions	#6B7280	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:23:51.949945	2025-07-31 18:23:51.949945
b6244c68-af8d-4609-956f-87ddcea776e7	Moderator	Moderator with character and event management permissions	#3B82F6	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:23:51.949945	2025-07-31 18:23:51.949945
e31822d2-2f33-40bd-a0f4-8bf18e7847a6	Admin	Administrator with full permissions except role management	#EF4444	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:23:51.949945	2025-07-31 18:23:51.949945
b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	Super Admin	Full system administrator with all permissions	#9333EA	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-07-31 18:23:51.949945	2025-07-31 18:23:51.949945
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
nzrM-64edNgnztMrvuXFzfzVoK7llH9_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T16:56:28.572Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 16:56:29
VHFvlis0OEE2Qw3rJ2vIY3CqF_PUJb5N	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T02:30:11.504Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 02:30:14
BHwec_JECyI94uR5TVHk7Q2i4-MKa0SZ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T23:36:05.192Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"31497e70-8be6-4cab-9a9b-d02a09c54e84","isAdmin":false,"userRole":"user"}	2025-08-08 01:20:15
AUFxSMlY9cMI7YuXyJ1jAkswWRsfX1Un	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T18:28:53.824Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 18:28:55
fyu_aBUwc_AkLfjKZSoRNPCOTOmFfRwC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T02:22:05.431Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 02:22:25
XopWRezv031GoFq1XFShSq0OWMxryrce	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T18:55:00.684Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 18:55:03
1XdF8azgc81W_KVwD_bct3MBayjsqAv7	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T17:08:50.364Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 17:08:52
QIyHqaGWBuUB9A3_42RChVAoFbrUpDl4	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T02:41:11.193Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 02:51:05
-_MQ96-e6vjDz5X2e8BgZYV-EdAWTJZh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-09T16:38:16.077Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-09 17:28:46
OITq-bU2Lr8DELCYNVpHy8Ja1M434XlG	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T23:09:06.319Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"4fbb2c1c-a069-4850-9ad4-59b0cb01d707","isAdmin":false,"userRole":"user"}	2025-08-09 17:59:19
t7LlD8Kyw2BniyjkzO5V7v9iaoMmjK12	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T19:11:01.777Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-10 02:40:19
e4gh9vl10fiNGBzT_xtkENV8qSxrgbCz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-10T18:44:03.225Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"4fbb2c1c-a069-4850-9ad4-59b0cb01d707","isAdmin":false,"userRole":"e31822d2-2f33-40bd-a0f4-8bf18e7847a6"}	2025-08-10 18:49:26
FH3VLKjoFMLg-41C8ycLAJp3gP7k_RWA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T23:05:14.638Z","secure":true,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 23:05:15
DNKOLX2K5ZTrIYLEOE5AujhFu0IZSFGt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T19:01:04.176Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 19:01:08
i3VLpurvMtCx7XeGco6WkuHov276iDTe	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T18:31:13.590Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 18:31:14
aKC-ejHKmboLAjEqrK6bWVabebqQuuRe	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T18:37:24.357Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 18:37:26
i_k7_RYLu4jRMjWqJXxev-8w0OlaGYs8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T23:06:00.116Z","secure":true,"httpOnly":true,"path":"/"},"userId":"88d7cc4b-22fc-4694-a7c9-a5497a211a22","isAdmin":false,"userRole":"4bd53b9a-179f-457d-91fa-3084989acc1a"}	2025-08-07 23:06:01
SaiI0LSsicdIVKYOkGEkr_-rf2nY70Jc	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T19:05:19.206Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 19:07:46
XEakiJnW9gWfbY2Y8VsqLmkJL43anm-h	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T18:37:38.016Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 18:37:59
OKJ3kfjfxGvKrGDTv4hKc4FYFCzNA-jC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T01:21:11.980Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"17fcc04e-cfc0-45f7-b37c-467affac367f","isAdmin":false,"userRole":"user"}	2025-08-09 21:07:46
9JV-cHzyzOvyZ_2usC5g-MBxE86Snqb2	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T23:08:56.781Z","secure":true,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 23:08:57
aj0w-Os7kP8xpqAZp5wxiyzr-VtoQGhd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T18:51:02.070Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 18:51:06
H3g_wuxRM8nQKifgAhSITfiG3h1YqiLn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T18:51:18.868Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 18:51:33
WNmUFN7PGBt3LzxiaU2_atee562T-yNJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-07T19:03:12.406Z","secure":false,"httpOnly":true,"path":"/"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-07 19:03:25
4oUJsTvoJ0WU0hpoW0MUDZpcD4e8_iHH	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T17:09:13.457Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 17:09:15
QO3OYJNIrWTIQFZrpgH0WtfxVs_hOsVp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-10T01:51:15.218Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-11 00:26:40
ZVrvSbVQGkEKJw6go_HI30CfyKCS1pyx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-09T18:52:44.549Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"f1112722-7f77-45df-8d65-0515a3222b60","isAdmin":true,"userRole":"e31822d2-2f33-40bd-a0f4-8bf18e7847a6"}	2025-08-10 02:55:13
bXtSf162HqBatPzXbBr5FmWlpgwokYH7	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-10T00:37:20.607Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-10 19:28:10
ruJYhJAQMrmZPz2vKBzK-ZFIVED4AUgs	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T17:09:28.903Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 17:09:30
5AeXkGl_ikSL8wqFR6aIjXQZGdD9goBd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-08T17:09:42.962Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-08 17:09:44
XC3je_GlEv7v5P1-t5hMu9-2mqshJdrT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-09T17:02:02.176Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"88d7cc4b-22fc-4694-a7c9-a5497a211a22","isAdmin":false,"userRole":"b6244c68-af8d-4609-956f-87ddcea776e7"}	2025-08-09 17:02:31
L-zEizzs0AgfNd-aBwLaaUcXYWd8xDUC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-08-09T00:29:49.433Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"b1dccec1-0d8e-4854-a2e1-92722188643a","isAdmin":true,"userRole":"b7e97e4a-d42b-4e2a-a070-a94d689d4f6f"}	2025-08-09 00:31:04
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.skills (id, name, description, prerequisite_skill_id, is_active, created_by, created_at, updated_at) FROM stdin;
0eec4086-4646-4ca6-84a0-0071418b54e4	First Aid	Basic medical knowledge to treat wounds	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
efec1320-301e-4565-b67b-a3bcd8f217be	Weapon Focus (Medium)	Specialized training with medium weapons	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
9d17f4cd-6e98-4923-836c-f6e002be57ba	Weapon Focus (Small)	Specialized training with small weapons	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
64a83e90-988b-43d1-a469-8d17c8f72f0b	Weapon Focus (Large)	Specialized training with large weapons	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
c3f9d1aa-0f9d-4921-9e81-27ac292f7f59	Weapon Focus (Bow)	Specialized training with bows	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
c4242883-41f9-4ca4-9de6-68b865e58f02	Armor Training (Light)	Training to wear light armor effectively	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
ce70b0e4-8c70-43ab-a39d-4d7a040f56d3	Armor Training (Medium)	Training to wear medium armor effectively	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
46eac00b-061f-4d76-ad8c-11759b003c7a	Armor Training (Heavy)	Training to wear heavy armor effectively	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
876c93cb-14ba-4c30-94b2-512b98b86a28	Alchemy	Knowledge of mixing magical potions and compounds	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
801dc7f0-3392-4229-a973-bc6962a487d0	Blacksmithing	Skill in forging metal tools and weapons	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
d5321578-e049-4592-9884-987bd04827bb	Cooking	Culinary expertise and food preparation	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
a4a32300-0ad8-4519-8c78-b2ed512790cc	Herbalism	Knowledge of plants and their medicinal properties	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
10d90284-f57a-43cb-9d71-9315ee6e7081	Meditation	Mental discipline and spiritual focus	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
108c358b-eb18-4323-8fcd-522eb5e2d73e	Bard	Musical and performance abilities	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
dafbb43e-cea6-4139-b22b-ab3584ba04b2	Socialite	Social graces and networking skills	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
bd21617a-8148-4f55-a90e-5f542ddad95b	Mercantile	Trading and business acumen	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
30b26004-4a7b-4ff6-a4c2-dc21a0e66557	Scavenging	Ability to find useful items in unlikely places	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
d1bb9ec4-023e-4e6f-a5c4-a01d4912a5d7	Hide	Stealth and concealment abilities	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
b7ff706e-10f2-4f9c-897e-ccc486620123	Hunting	Tracking and survival in the wilderness	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
c8f808e0-7d0b-44a4-afd0-34b1570b4a0f	Alertness	Enhanced awareness and perception	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
2e9bb1b7-ae19-4edd-853b-55a7daceb414	Courage	Bravery in the face of danger	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
da31fd12-740d-4b2b-b745-dafd7122121c	Intimidation	Ability to frighten and dominate opponents	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
e8faf6b6-d9b0-4d0e-ac2f-26db5cfdc7ad	Dodge	Evasive maneuvers in combat	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
0832bc77-9759-4eb7-a995-2a75e4054ff8	Parry	Defensive combat techniques	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
71bc9a9e-f347-409c-b60f-5f7713cf26b5	Shield	Proficiency with shields in combat	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
0257396f-89c2-457d-8a61-d9142f3753ad	Toughness	Enhanced physical resilience	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
0e46afdb-34e8-4b14-9cf7-799daa1837f0	Lore (Magic)	Academic knowledge of magical theory	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
65c86a89-db2e-499f-ad88-0aa804b3cc39	Lore (Nature)	Understanding of natural world and creatures	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
8dbcdf0b-fa5e-45a0-b04b-caca23e9aeea	Wealth	Financial resources and connections	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
fbe2dd0d-25f5-43cd-b72e-0be9f20e8cd9	Stealth	Moving unseen and unheard	\N	t	b1dccec1-0d8e-4854-a2e1-92722188643a	2025-08-03 00:49:51.511937	2025-08-03 00:49:51.511937
ee0494ba-69d9-4765-a1e7-4afaafe0ddea	Ambidexterity	Allows the use of weapons in both hands	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
ce56b74b-d5e3-4c9f-b417-6bfbd9f3fae8	Armor Smithing	Create and repair armor	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
767185fa-2223-4035-a4ec-53c59b1f868d	Backstab	Strike from behind for additional damage	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
1090c1ef-3098-4da1-a657-231e4b95c39a	Blinding	Temporarily blind opponents	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
6333e30a-0230-4c59-ba49-1d492f57b31d	Brutal Blow	Deal devastating attacks	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
95bd6f23-4c3e-4461-95c1-039b3bfe7d67	Cheat	Use underhanded tactics in games and contests	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
a30793f1-2aad-4b98-a21b-97ab0e4031ad	Chirurgeon	Advanced medical knowledge and surgical skills	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
657f6240-1f4e-4edb-8ca5-bd3b0291ac15	Counterspell	Counter enemy magic	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
4e03a83c-5dc2-4793-9ca6-3d25b96f5c50	Dexterity Armor	Use agility instead of heavy armor	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
d832f2d5-e461-484b-95c6-5668b38b4da5	Disarm	Remove weapons from opponents	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
b124d718-f824-4e44-833c-1e84da8acb6f	Farming	Agricultural knowledge and skills	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
19adfae2-c76f-4464-a5ab-0229f388a7d3	Fortify Armor	Enhance armor effectiveness	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
c2dcb743-030f-43eb-a013-75e9202121ee	Hamstring	Cripple opponent movement	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
592f84d8-208d-4263-ad0e-777bb577b888	Healing	Restore health to others	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
3a0b8abd-64f9-42a5-b3a3-484946fbc0c9	Intercept	Block attacks intended for others	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
e905c618-ec73-441c-9d46-4a5fef8b987b	Iron Will	Resist mental effects	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
7b153aa4-01a4-4eac-b3b8-29a74efa4002	Knockback	Force opponents backward	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
5602ae8f-134c-4034-ae18-9de4bc321adb	Knockout Strike	Non-lethal takedown attacks	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
46b14ad4-491f-4a14-86c5-fbacb90cb0cf	Lockpicking	Open locks and containers	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
a72424f6-f9ff-43e1-8c55-31dabb0aa38f	Lore (Any)	General knowledge on any subject	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
cb23e645-2b77-4ef1-a4f5-f65a1fc52796	Lore (Engineering)	Engineering and mechanical knowledge	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
9b19f16d-111c-48b3-959e-8d0cc448daaf	Lore (Monster)	Knowledge of creatures and monsters	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
2c5373e1-4350-4b4c-8d77-fa9ab79f9042	Lumberjack	Woodcutting and forestry skills	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
4fb5c723-82ff-4b61-8939-ed85231d26c9	Marksmanship	Improved accuracy with ranged weapons	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
2265a701-cbdf-4549-86b8-bb2cee289a6e	Mining	Extract ore and precious materials	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:17.224805	2025-08-03 01:03:17.224805
9f3df10d-883b-46e8-a368-787ce7e461c5	Magic Path (Apprentice): Path of Arcane Mind	Beginning mental magic studies	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
b467596a-33cd-490a-952b-44953eda7423	Magic Path (Master): Path of Arcane Mind	Advanced mental magic mastery	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
3464aeaa-6c02-437e-a934-b6f6c0189589	Magic Path (Apprentice): Path of Flesh	Beginning healing and body magic	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
b61cca5b-d59c-438f-a952-841a0eb47e17	Magic Path (Master): Path of Flesh	Advanced healing and body magic mastery	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
24c24ac8-c889-4cc8-8d70-03beadcbb6c2	Magic Path (Apprentice): Path of Thorns	Beginning nature magic studies	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
a20f25a7-c589-411a-bc8a-37413d5bf2e3	Magic Path (Journeyman): Path of Flesh	Intermediate healing and body magic	3464aeaa-6c02-437e-a934-b6f6c0189589	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:08:08.903
c729916b-799c-4541-b2da-015438658055	Magic Path (Master): Path of Thorns	Advanced nature magic mastery	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
1ce317f3-e4c8-4830-8338-09c3ea96a856	Magic Path (Apprentice): Path of the Chill Wind	Beginning ice magic studies	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
78d55c33-9885-43ba-87f4-4eed374c98c3	Magic Path (Master): Path of the Chill Wind	Advanced ice magic mastery	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
08e00a00-f082-49ce-b66e-e373e40e1219	Magic Path (Apprentice): Path of the Eternal Flame	Beginning fire magic studies	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
1d52efab-1dbc-4259-ae06-6f86c00c0e17	Magic Path (Master): Path of the Eternal Flame	Advanced fire magic mastery	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
781278bb-0f28-42ee-8033-549e79d094c5	Magic Path (Apprentice): Path of Shadows	Beginning shadow magic studies	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
668330af-405b-4e2d-ae3b-175a620890f5	Magic Path (Master): Path of Shadows	Advanced shadow magic mastery	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
c74de66d-d225-4498-9fa8-adf94e1e502e	Piercing Strike	Bypass armor with precise attacks	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
039b0bbe-4ca6-43b2-a4a3-20cf316ad910	Play Dead	Feign death to avoid danger	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
5a316612-6b22-4108-9006-257c0ee281d7	Plead for Mercy	Convince opponents to spare you	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
b133aa6d-2b8f-44e0-a0e5-577757fb1d4c	Quick Search	Rapidly search areas and containers	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
9085fa64-4927-4602-aba2-633d759c468d	Rapidfire	Increase rate of fire with ranged weapons	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
3b1bf325-594a-4d92-abe4-0be88e9f9c45	Riposte	Counter-attack after successful parry	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
ed845069-ba1f-4263-94eb-05df45e7a54f	Scribe	Writing and documentation skills	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:03:27.898204
b8548af5-33c0-4fc9-b177-92a0fcb8a1ab	Shield Master	Advanced shield techniques	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
88778b0b-9f5d-43d9-9eee-49f8dd1db429	Stored Spell	Store magical energy for later use	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
2890b3e8-83ac-4a45-a023-81855ace60df	Taunt	Provoke enemies into attacking you	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
ae268a1e-a31b-4c32-a6c0-406b4c5176d9	Trader	Skilled in commerce and trade	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
45fedae9-2167-4cca-8da9-b56a2d904976	Trapper	Set and disarm traps	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
477cd7c4-bd31-469d-be67-bbdf1794bd7e	Weapon Focus (Any)	Specialize in any weapon type	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
a2742e1a-12ca-4a60-88ba-24c576bef618	Weapon Focus (Crossbow)	Specialize in crossbow combat	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
a3d37185-15ee-4ad6-ba84-97e800bd6f97	Weapon Focus (Firearms)	Specialize in firearm combat	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
8ab62faa-31da-460e-9895-1d6d1478bb8a	Weapon Focus (Polearm)	Specialize in polearm combat	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
f96ede3b-f176-4452-aa64-8c4ef1a5ab0b	Weapon Focus (Staff)	Specialize in staff combat	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
36f111ea-6f42-491d-9a37-5c77a478faf6	Weapon Focus (Thrown)	Specialize in thrown weapon combat	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
47dad00c-a041-4b63-b642-a5c273c3c36f	Weapon Focus (Unarmed)	Specialize in unarmed combat	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
ee02c2f8-0cd5-4b45-8969-d4078c26aaee	Weapon Proficiency (Small)	Basic training with small weapons	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
06433cd2-cff9-4bc6-b061-0a23f86a352c	Weapon Proficiency (Medium)	Basic training with medium weapons	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
08bacb91-b314-4225-a1b5-4c7657d7e90a	Weapon Proficiency (Large)	Basic training with large weapons	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
9923426d-8658-4427-8cf4-94033e22caff	Weapon Proficiency (Bow)	Basic training with bows	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
074386f7-07e1-4777-8b0f-a6cf2f02362c	Weapon Proficiency (Crossbow)	Basic training with crossbows	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
d855774c-448e-47be-a1ae-bf96dc1919a3	Weapon Proficiency (Firearms)	Basic training with firearms	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
e566e09a-b256-42d1-b7e6-bc84a53ef181	Weapon Proficiency (Polearm)	Basic training with polearms	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
e6f7d85a-d728-4116-b297-f024ca437eb7	Weapon Proficiency (Staff)	Basic training with staves	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
60229fb3-46dc-4d7e-9f64-d7231d270a01	Weapon Proficiency (Thrown)	Basic training with thrown weapons	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
27bbec26-b679-4046-b8bf-b570fa99564d	Weapon Smithing	Create and repair weapons	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
703f4656-29fa-46d2-a2b7-629e8ee2b842	Withdraw	Safely retreat from combat	\N	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:43.813555	2025-08-03 01:03:43.813555
407c6563-9374-4ad3-b69f-5143d42cb2fc	Magic Path (Journeyman): Path of Arcane Mind	Intermediate mental magic studies	9f3df10d-883b-46e8-a368-787ce7e461c5	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:07:41.048
7be9ff7d-47b5-4002-aee6-86bbaa13740f	Magic Path (Journeyman): Path of Shadows	Intermediate shadow magic studies	781278bb-0f28-42ee-8033-549e79d094c5	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:08:45.58
d37a5c66-67ee-419a-8a2c-b683d991810e	Magic Path (Journeyman): Path of Thorns	Intermediate nature magic studies	24c24ac8-c889-4cc8-8d70-03beadcbb6c2	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:09:03.487
84bca12c-d734-4a88-91b6-83afac02b9f1	Magic Path (Journeyman): Path of the Chill Wind	Intermediate ice magic studies	1ce317f3-e4c8-4830-8338-09c3ea96a856	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:09:35.414
f619dc14-8095-4c0c-931b-b75ebef21edb	Magic Path (Journeyman): Path of the Eternal Flame	Intermediate fire magic studies	08e00a00-f082-49ce-b66e-e373e40e1219	t	f1112722-7f77-45df-8d65-0515a3222b60	2025-08-03 01:03:27.898204	2025-08-03 01:09:53.662
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.system_settings (id, key, value, updated_at) FROM stdin;
5d620962-6205-4be0-8d81-f5fb2cd2cef4	achievement_rarity_settings	{"commonThreshold":50,"rareThreshold":25,"epicThreshold":10,"legendaryThreshold":2,"enableDynamicRarity":true}	2025-07-31 20:25:56.351
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, email, password, is_admin, created_at, player_number, chapter_id, player_name, candles, role, role_id, updated_at, title) FROM stdin;
f1112722-7f77-45df-8d65-0515a3222b60	Travis_	travis_hartwig@hotmail.com	$2b$10$noD1W6suBFWmqLc.KpajHeAZ.Qfsp9I.NpPHJuMYV7uMu8.FsZiey	t	2025-08-02 15:57:32.752808	FL2508003	f71b49e4-4f37-4511-958f-b40f28e728bc	Travis Ha	5000	user	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	2025-08-02 15:57:32.752808	\N
b1dccec1-0d8e-4854-a2e1-92722188643a	admin	admin@thrune.larp	$2b$10$CRuWBUL9K7OKk14uvoRA5emguT3NL4o/TGGN107C8d9VMpYqZU/Vu	t	2025-07-31 14:49:18.128921	\N	2beb7d4a-15fc-4326-b610-8f9100672069	Administrator	9599	user	b7e97e4a-d42b-4e2a-a070-a94d689d4f6f	2025-08-01 16:55:48.478476	\N
31497e70-8be6-4cab-9a9b-d02a09c54e84	bishopofcain	bishopofcain@gmail.com	$2b$10$965AKwavREbzrGV1Fe6stumC.Vu2YXIw45cfamtnIA4SOyovukpe6	t	2025-07-31 23:36:05.172276	FL2507003	f71b49e4-4f37-4511-958f-b40f28e728bc	Jacob Stewart	0	user	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	2025-08-01 18:20:38.064	Owner
4fbb2c1c-a069-4850-9ad4-59b0cb01d707	PinkHatter	pinkscraps84@gmail.com	$2b$10$fIZErI9P15iYGrhQv2WNrevjdMTY/cNuMan1j2mkdHySx/hlERjKS	f	2025-08-01 23:09:06.291237	FL2508002	f71b49e4-4f37-4511-958f-b40f28e728bc	Beth B	0	user	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	2025-08-01 23:09:06.291237	Head of Logistics
88d7cc4b-22fc-4694-a7c9-a5497a211a22	Spauldinacus	doctorevol@gmail.com	$2b$10$vDPKO2w9exdHnSjI8VZKH.Pv4zcR0TC6iMebh0bIOA2h/bfzk9I5a	f	2025-07-31 15:11:45.730173	FL2501019	f71b49e4-4f37-4511-958f-b40f28e728bc	James Spaulding	71	user	b6244c68-af8d-4609-956f-87ddcea776e7	2025-08-01 16:55:48.478476	\N
17fcc04e-cfc0-45f7-b37c-467affac367f	Simetradon	loremastersimon@gmail.com	$2b$10$JmrchhBwr5/9HunhEuc/AuAAJiolxbOGpE/Z2jyLWYBkqIGslfmr6	t	2025-08-01 01:21:11.959931	FL2508001	f71b49e4-4f37-4511-958f-b40f28e728bc	Simon	0	user	e31822d2-2f33-40bd-a0f4-8bf18e7847a6	2025-08-01 18:20:30.408	Lore Master
f9afd461-db82-4e0c-8c2a-30eb7cc8d845	Tester	Tester@test.com	$2b$10$bIf8bIu8ZBem8n2CKpsd5uwSTkUOQ.rGdMXxsrk.YMMIWReCaZgqK	f	2025-07-31 17:48:31.682781	FL0000000	2beb7d4a-15fc-4326-b610-8f9100672069	Tester	203	user	4bd53b9a-179f-457d-91fa-3084989acc1a	2025-08-02 00:12:55.134	\N
\.


--
-- Name: archetype_primary_skills archetype_primary_skills_archetype_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_primary_skills
    ADD CONSTRAINT archetype_primary_skills_archetype_id_skill_id_key UNIQUE (archetype_id, skill_id);


--
-- Name: archetype_primary_skills archetype_primary_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_primary_skills
    ADD CONSTRAINT archetype_primary_skills_pkey PRIMARY KEY (id);


--
-- Name: archetype_secondary_skills archetype_secondary_skills_archetype_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_secondary_skills
    ADD CONSTRAINT archetype_secondary_skills_archetype_id_skill_id_key UNIQUE (archetype_id, skill_id);


--
-- Name: archetype_secondary_skills archetype_secondary_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_secondary_skills
    ADD CONSTRAINT archetype_secondary_skills_pkey PRIMARY KEY (id);


--
-- Name: archetypes archetypes_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetypes
    ADD CONSTRAINT archetypes_name_key UNIQUE (name);


--
-- Name: archetypes archetypes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetypes
    ADD CONSTRAINT archetypes_pkey PRIMARY KEY (id);


--
-- Name: candle_transactions candle_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.candle_transactions
    ADD CONSTRAINT candle_transactions_pkey PRIMARY KEY (id);


--
-- Name: chapters chapters_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_code_key UNIQUE (code);


--
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);


--
-- Name: character_achievements character_achievements_character_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.character_achievements
    ADD CONSTRAINT character_achievements_character_id_achievement_id_key UNIQUE (character_id, achievement_id);


--
-- Name: character_achievements character_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.character_achievements
    ADD CONSTRAINT character_achievements_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: culture_secondary_skills culture_secondary_skills_culture_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.culture_secondary_skills
    ADD CONSTRAINT culture_secondary_skills_culture_id_skill_id_key UNIQUE (culture_id, skill_id);


--
-- Name: culture_secondary_skills culture_secondary_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.culture_secondary_skills
    ADD CONSTRAINT culture_secondary_skills_pkey PRIMARY KEY (id);


--
-- Name: cultures cultures_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultures
    ADD CONSTRAINT cultures_pkey PRIMARY KEY (id);


--
-- Name: custom_achievements custom_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_achievements
    ADD CONSTRAINT custom_achievements_pkey PRIMARY KEY (id);


--
-- Name: custom_milestones custom_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_milestones
    ADD CONSTRAINT custom_milestones_pkey PRIMARY KEY (id);


--
-- Name: event_rsvps event_rsvps_event_id_character_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_character_id_key UNIQUE (event_id, character_id);


--
-- Name: event_rsvps event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: experience_entries experience_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experience_entries
    ADD CONSTRAINT experience_entries_pkey PRIMARY KEY (id);


--
-- Name: heritage_secondary_skills heritage_secondary_skills_heritage_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.heritage_secondary_skills
    ADD CONSTRAINT heritage_secondary_skills_heritage_id_skill_id_key UNIQUE (heritage_id, skill_id);


--
-- Name: heritage_secondary_skills heritage_secondary_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.heritage_secondary_skills
    ADD CONSTRAINT heritage_secondary_skills_pkey PRIMARY KEY (id);


--
-- Name: heritages heritages_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.heritages
    ADD CONSTRAINT heritages_name_key UNIQUE (name);


--
-- Name: heritages heritages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.heritages
    ADD CONSTRAINT heritages_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: skills skills_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_name_key UNIQUE (name);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_unique UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_player_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_player_number_key UNIQUE (player_number);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: archetype_primary_skills archetype_primary_skills_archetype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_primary_skills
    ADD CONSTRAINT archetype_primary_skills_archetype_id_fkey FOREIGN KEY (archetype_id) REFERENCES public.archetypes(id) ON DELETE CASCADE;


--
-- Name: archetype_primary_skills archetype_primary_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_primary_skills
    ADD CONSTRAINT archetype_primary_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: archetype_secondary_skills archetype_secondary_skills_archetype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_secondary_skills
    ADD CONSTRAINT archetype_secondary_skills_archetype_id_fkey FOREIGN KEY (archetype_id) REFERENCES public.archetypes(id) ON DELETE CASCADE;


--
-- Name: archetype_secondary_skills archetype_secondary_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetype_secondary_skills
    ADD CONSTRAINT archetype_secondary_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: archetypes archetypes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.archetypes
    ADD CONSTRAINT archetypes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: candle_transactions candle_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.candle_transactions
    ADD CONSTRAINT candle_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: candle_transactions candle_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.candle_transactions
    ADD CONSTRAINT candle_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chapters chapters_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: character_achievements character_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.character_achievements
    ADD CONSTRAINT character_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.custom_achievements(id);


--
-- Name: character_achievements character_achievements_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.character_achievements
    ADD CONSTRAINT character_achievements_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- Name: characters characters_retired_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_retired_by_fkey FOREIGN KEY (retired_by) REFERENCES public.users(id);


--
-- Name: characters characters_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: culture_secondary_skills culture_secondary_skills_culture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.culture_secondary_skills
    ADD CONSTRAINT culture_secondary_skills_culture_id_fkey FOREIGN KEY (culture_id) REFERENCES public.cultures(id) ON DELETE CASCADE;


--
-- Name: culture_secondary_skills culture_secondary_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.culture_secondary_skills
    ADD CONSTRAINT culture_secondary_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: cultures cultures_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultures
    ADD CONSTRAINT cultures_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cultures cultures_heritage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cultures
    ADD CONSTRAINT cultures_heritage_id_fkey FOREIGN KEY (heritage_id) REFERENCES public.heritages(id) ON DELETE CASCADE;


--
-- Name: custom_achievements custom_achievements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_achievements
    ADD CONSTRAINT custom_achievements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: custom_milestones custom_milestones_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_milestones
    ADD CONSTRAINT custom_milestones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: event_rsvps event_rsvps_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- Name: event_rsvps event_rsvps_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_rsvps event_rsvps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: events events_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id);


--
-- Name: events events_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: experience_entries experience_entries_awarded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experience_entries
    ADD CONSTRAINT experience_entries_awarded_by_users_id_fk FOREIGN KEY (awarded_by) REFERENCES public.users(id);


--
-- Name: experience_entries experience_entries_character_id_characters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experience_entries
    ADD CONSTRAINT experience_entries_character_id_characters_id_fk FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- Name: experience_entries experience_entries_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experience_entries
    ADD CONSTRAINT experience_entries_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: experience_entries experience_entries_rsvp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.experience_entries
    ADD CONSTRAINT experience_entries_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES public.event_rsvps(id);


--
-- Name: heritage_secondary_skills heritage_secondary_skills_heritage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.heritage_secondary_skills
    ADD CONSTRAINT heritage_secondary_skills_heritage_id_fkey FOREIGN KEY (heritage_id) REFERENCES public.heritages(id) ON DELETE CASCADE;


--
-- Name: heritage_secondary_skills heritage_secondary_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.heritage_secondary_skills
    ADD CONSTRAINT heritage_secondary_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: heritages heritages_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.heritages
    ADD CONSTRAINT heritages_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: skills skills_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: skills skills_prerequisite_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_prerequisite_skill_id_fkey FOREIGN KEY (prerequisite_skill_id) REFERENCES public.skills(id);


--
-- Name: users users_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

