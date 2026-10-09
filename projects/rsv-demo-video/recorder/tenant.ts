import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { hashPassword } from "@/lib/password";
import { SECTORS } from "@/lib/sectors";
import type { FootageSource, History, Locale } from "../config/types";

// Puts the recording clinic back to its starting state: the business row as configured, a fresh password
// nobody keeps, five months of closed history, today's open leads in the language being recorded, and last
// month's report built by the app's own report engine and published. Nothing outside this one business is
// read or written. Returns the session version a sign-in cookie has to carry.
export async function resetTenant(pool: Pool, source: FootageSource, locale: Locale): Promise<number> {
  const { business, leads, sector: sectorKey } = source;
  const sector = SECTORS[sectorKey];
  const known = new Set(sector.stages.map((s) => s.key));
  for (const lead of leads) {
    if (!known.has(lead.stage)) throw new Error(`Fixture lead ${lead.name.en} has unknown stage "${lead.stage}"`);
  }
  for (const stage of source.moveTo) {
    if (!known.has(stage)) throw new Error(`moveTo has unknown stage "${stage}"`);
  }

  // A client session only counts while the business has a password, so it gets one — random, never
  // stored or shown, and replaced on the next take. Demos skip the sign-in page, so the recorder signs in
  // with a session cookie instead (see record.ts).
  const hash = await hashPassword(randomBytes(18).toString("base64url"));
  let sessionVersion = 0;

  const client = await pool.connect();
  try {
    await client.query("begin");
    // A demo, so it is never billed and anyone who stumbles on it can only look. The password bump signs
    // out whatever session the previous take left behind.
    const upserted = await client.query<{ session_version: number }>(
      `insert into businesses (id, name, sector, accent, plan, city, seats, is_demo, is_internal, languages, password_hash)
       values ($1, $2, $3, $4, $5, $6, 4, true, false, 'both', $7)
       on conflict (id) do update set
         name = excluded.name, sector = excluded.sector, accent = excluded.accent, plan = excluded.plan,
         city = excluded.city, is_demo = true, is_internal = false, languages = 'both',
         password_hash = excluded.password_hash, session_version = businesses.session_version + 1
       returning session_version`,
      [business.id, business.name, sectorKey, business.accent, business.plan, business.city, hash],
    );
    sessionVersion = upserted.rows[0].session_version;
    await client.query(`delete from activity where business_id = $1`, [business.id]);
    await client.query(`delete from records where business_id = $1`, [business.id]);
    await client.query(`delete from reports where business_id = $1`, [business.id]);

    await insertHistory(client, source, locale);

    const col = <T,>(pick: (lead: (typeof leads)[number]) => T) => leads.map(pick);
    await client.query(
      `insert into records
         (business_id, name, phone, stage, subject, source, value, owner, note, first_response_mins,
          created_at, last_contact_at, next_action_at, updated_at)
       select $1, t.name, t.phone, t.stage, t.subject, t.source, t.value, t.owner, t.note, t.response,
         now() - make_interval(days => t.created_days) - interval '3 hours',
         now() - make_interval(days => t.contact_days) - interval '2 hours',
         case when t.next_days is null then null else now() + make_interval(days => t.next_days) end,
         now() - make_interval(days => t.contact_days) - interval '2 hours'
       from unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::bigint[], $8::text[], $9::text[],
                   $10::int[], $11::int[], $12::int[], $13::int[])
         as t(name, phone, stage, subject, source, value, owner, note, response, created_days, contact_days, next_days)`,
      [
        business.id,
        col((l) => l.name[locale]),
        col((l) => l.phone),
        col((l) => l.stage),
        col((l) => l.subject),
        col((l) => l.source),
        col((l) => l.value),
        col((l) => l.owner?.[locale] ?? null),
        col((l) => l.note?.[locale] ?? null),
        col((l) => l.firstResponseMins),
        col((l) => l.createdDaysAgo),
        col((l) => l.lastContactDaysAgo),
        col((l) => l.nextActionInDays),
      ],
    );

    // The same shape the app writes, so each record panel shows a real history: how it arrived, and the
    // move that put it where it is.
    const first = sector.stages[0].key;
    await client.query(
      `insert into activity (business_id, record_id, actor, kind, detail, to_stage, created_at)
       select r.business_id, r.id, 'System', 'created', coalesce(r.source, ''), $2, r.created_at
       from records r
       where r.business_id = $1
         and not exists (select 1 from activity a where a.record_id = r.id)`,
      [business.id, first],
    );
    await client.query(
      `insert into activity (business_id, record_id, actor, kind, detail, from_stage, to_stage, created_at)
       select r.business_id, r.id, 'Team', 'stage', 'Moved from ' || $2 || ' to ' || r.stage, $2, r.stage, r.last_contact_at
       from records r
       where r.business_id = $1 and r.stage <> $2
         and (select count(*) from activity a where a.record_id = r.id) = 1`,
      [business.id, first],
    );
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  await publishLastMonthReport(source);
  return sessionVersion;
}

// A small seeded random generator, so the history is the same on every take.
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Step = { from: string | null; to: string; day: number };

// Closed leads in the months before this one: each arrives, is worked through the stages, and ends won or
// lost inside its month, exactly as the app would have logged it. Lost leads drop out at different stages,
// so the report's funnel has a real shape.
async function insertHistory(client: import("pg").PoolClient, source: FootageSource, locale: Locale) {
  const history: History = source.history;
  const sector = SECTORS[source.sector];
  const ladder = sector.funnel;
  const won = sector.wonStages[0];
  const lost = sector.lostStages[0];
  const sources = sector.sources.filter((s) => s !== "Telegram");
  const rnd = random(history.seed);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];

  const rows: {
    name: string; phone: string; stage: string; subject: string; source: string; value: number; owner: string;
    response: number; monthsAgo: number; day: number; hour: number; steps: Step[];
  }[] = [];
  history.perMonth.forEach((count, i) => {
    const monthsAgo = history.perMonth.length - i;
    for (let n = 0; n < count; n++) {
      const isWon = rnd() < history.wonShare;
      // How far a lost lead got before it was lost: most drop early, a few after booking.
      const reach = isWon ? ladder.length - 1 : Math.min(ladder.length - 2, Math.floor(Math.pow(rnd(), 1.6) * (ladder.length - 1)));
      const steps: Step[] = [];
      let day = 0;
      for (let k = 1; k <= reach; k++) {
        day += 1 + Math.floor(rnd() * 3);
        steps.push({ from: ladder[k - 1], to: ladder[k], day });
      }
      if (!isWon) steps.push({ from: ladder[reach], to: lost, day: day + 1 + Math.floor(rnd() * 3) });
      const digits = String(10_000_000 + Math.floor(rnd() * 89_999_999));
      rows.push({
        name: pick(history.names)[locale],
        phone: `${pick(["010", "011", "012", "015"])} ${digits.slice(0, 4)} ${digits.slice(4)}`,
        stage: isWon ? won : lost,
        subject: pick(sector.subjects),
        source: pick(sources),
        value: Math.round((1500 + rnd() * 26000) / 500) * 500,
        owner: pick(history.owners)[locale],
        // Spread around the month's typical reply time, so the figures are believable rather than perfect.
        response: Math.max(2, Math.round(history.replyMinutes[i] * (0.45 + rnd() * 1.1))),
        monthsAgo,
        day: 1 + Math.floor(rnd() * 16),
        hour: 9 + Math.floor(rnd() * 10),
        steps,
      });
    }
  });

  // Phones are unique per lead, which is how the activity insert finds each new record's id.
  await client.query(
    `with input as (
       select * from unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::bigint[], $8::text[],
                            $9::int[], $10::int[], $11::int[], $12::int[], $13::jsonb[])
         as t(name, phone, stage, subject, source, value, owner, response, months_ago, day, hour, steps)
     ), timed as (
       select *, ((date_trunc('month', now() at time zone 'Africa/Cairo') - make_interval(months => months_ago)
                  + make_interval(days => day - 1, hours => hour)) at time zone 'Africa/Cairo') as born
       from input
     ), ins as (
       insert into records (business_id, name, phone, stage, subject, source, value, owner, first_response_mins,
                            created_at, last_contact_at, updated_at)
       select $1, name, phone, stage, subject, source, value, owner, response, born,
              born + make_interval(days => (select max((s->>'day')::int) from jsonb_array_elements(steps) s)),
              born + make_interval(days => (select max((s->>'day')::int) from jsonb_array_elements(steps) s))
       from timed
       returning id, phone, created_at
     ), created as (
       insert into activity (business_id, record_id, actor, kind, detail, to_stage, created_at)
       select $1, ins.id, 'System', 'created', t.source, $14, ins.created_at
       from ins join timed t on t.phone = ins.phone
     )
     insert into activity (business_id, record_id, actor, kind, detail, from_stage, to_stage, created_at)
     select $1, ins.id, t.owner, 'stage', 'Moved from ' || (s->>'from') || ' to ' || (s->>'to'),
            s->>'from', s->>'to', ins.created_at + make_interval(days => (s->>'day')::int)
     from ins join timed t on t.phone = ins.phone cross join jsonb_array_elements(t.steps) s`,
    [
      source.business.id,
      rows.map((r) => r.name), rows.map((r) => r.phone), rows.map((r) => r.stage), rows.map((r) => r.subject),
      rows.map((r) => r.source), rows.map((r) => r.value), rows.map((r) => r.owner), rows.map((r) => r.response),
      rows.map((r) => r.monthsAgo), rows.map((r) => r.day), rows.map((r) => r.hour),
      rows.map((r) => JSON.stringify(r.steps)),
      sector.stages[0].key,
    ],
  );
}

// Last month's report, built and published the way the operator would: the app's own report engine,
// including the assistant's written summary, not numbers typed in for the video. Imported late because the
// app's database module reads DATABASE_URL when it loads, which is after .env.local has been read.
async function publishLastMonthReport(source: FootageSource) {
  const [{ getBusiness }, { buildReport }, { setReportStatus }, { lastCompleteMonth }] = await Promise.all([
    import("@/lib/data"),
    import("@/lib/report-summary"),
    import("@/lib/report"),
    import("@/lib/month"),
  ]);
  const business = await getBusiness(source.business.id);
  if (!business) throw new Error("Recording clinic vanished before its report could be built");
  const month = lastCompleteMonth();
  const { summary } = await buildReport(business, month);
  if (!summary) console.warn("  (report built without a written summary — the assistant didn't answer)");
  await setReportStatus(business.id, month, "published");
}

// Ends the app's own database pool, which the report engine opened, so the recorder can exit.
export async function closeAppPool() {
  const { pool } = await import("@/lib/db");
  await pool.end();
}

// Removes the recording clinic entirely. Not called by the recorder; here for when the video pipeline
// is retired or a source is renamed.
export async function dropTenant(pool: Pool, source: FootageSource): Promise<void> {
  await pool.query(`delete from businesses where id = $1`, [source.business.id]);
}
