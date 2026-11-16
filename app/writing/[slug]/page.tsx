/* eslint-disable react/jsx-no-comment-textnodes */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { JSX } from "react";

interface ArticleSection {
  type: "prose" | "code" | "divider" | "callout";
  lang?: string;
  content?: string | JSX.Element;
  label?: string;
}

interface Article {
  slug: string;
  number: string;
  title: string;
  tag: string;
  project: string;
  date: string;
  readTime: string;
  lede: string;
  tagColor: string;
  sections: ArticleSection[];
}

const ARTICLES: Record<string, Article> = {
  "live-fixture-separation": {
    slug: "live-fixture-separation",
    number: "01",
    title: "Why I Isolated Live Match Data Into Its Own Collection",
    tag: "ARCHITECTURE",
    project: "CampScore / FSM",
    date: "2025",
    readTime: "8 min read",
    lede: "When FSM went live, the naive approach was obvious: a match is a fixture, live data belongs on the fixture. That broke fast. Here's why it was wrong, what I replaced it with, and how WebSocket rooms tie the two together without ever polluting the archive.",
    tagColor: "border-yellow-400 text-yellow-400",
    sections: [
      {
        type: "prose",
        content: (
          <>
            When FSM went live, the naive approach was obvious: a match is a
            fixture, live data belongs on the fixture. Goals happen — update{" "}
            <code>fixture.result</code>. Cards happen — push to{" "}
            <code>fixture.matchEvents</code>. It&apos;s one document, one source
            of truth.
            <br />
            <br />
            That broke fast. Here&apos;s why it was wrong, what I replaced it
            with, and how WebSocket rooms tie the two together without ever
            polluting the archive.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "The Problem With Updating Fixtures In-Place",
        content: <>A fixture document in V1 looked roughly like this:</>,
      },
      {
        type: "code",
        lang: "js",
        content: `{
  homeTeam: ObjectId,
  awayTeam: ObjectId,
  competition: ObjectId,
  date: Date,
  status: 'upcoming' | 'live' | 'completed' | 'postponed',
  result: { homeScore: 0, awayScore: 0 },
  matchEvents: [],
  homeLineup: { startingXI: [], subs: [] },
  awayLineup: { startingXI: [], subs: [] },
  statistics: ObjectId,
}`,
      },
      {
        type: "prose",
        content: (
          <>
            During a live match, <code>status</code> flips to{" "}
            <code>&apos;live&apos;</code>, and every goal, card, and
            substitution gets pushed into <code>matchEvents</code>. The score
            updates in <code>result</code>. The document is the match — past,
            present, and future — all in one.
            <br />
            <br />
            Three things went wrong immediately.
            <br />
            <br />
            <strong>First, writes became contention-prone.</strong> A live match
            generates events fast. Minute updates, score changes, substitutions,
            cards — these are all separate write operations hitting the same
            document. MongoDB document-level locking means each update blocks
            the next. Under real match conditions this created noticeable lag
            between an event happening and it appearing for clients.
            <br />
            <br />
            <strong>
              Second, the fixture document was never designed for high-frequency
              mutation.
            </strong>{" "}
            It was designed to be a record — scheduled date, teams, competition,
            result. Embedding a live event stream into it means that when the
            match ends and you query the fixture for historical stats,
            you&apos;re loading the entire event stream too. Every future read
            pays the cost of what happened in ninety minutes of football.
            <br />
            <br />
            <strong>Third, recovery was fragile.</strong> If a live admin
            refreshed their panel mid-match, the system re-fetched the fixture.
            But the fixture was also the source of truth for the competition
            standings calculator and the player stats aggregator — systems that
            ran on <code>status === &apos;completed&apos;</code>. During a live
            match, those systems had to defensively guard against reading
            partial state. That&apos;s coupling, and it meant a bug in live
            match handling could corrupt historical data.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "The Fix: Separate the Live State",
        content: (
          <>
            By V2, live match data lives in its own <code>LiveFixture</code>{" "}
            collection. The document is created when a match is initialized and
            deleted when it ends. The original fixture document is untouched
            until the match is over.
            <br />
            <br />
            The <code>LiveFixture</code> schema holds everything that changes
            during ninety minutes:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `{
  fixture: ObjectId,          // reference back to the permanent record
  homeTeam: ObjectId,
  awayTeam: ObjectId,
  status: LiveStatus,         // LIVE | HALFTIME | FINISHED | ...
  currentMinute: number,
  injuryTime: number,
  result: {
    homeScore: number,
    awayScore: number,
    halftimeHomeScore: number,
    halftimeAwayScore: number,
    homePenalty: number,
    awayPenalty: number,
  },
  goalScorers: [...],
  timeline: [...],            // goals, cards, subs — in order
  substitutions: [...],
  lineups: { home: ..., away: ... },
  statistics: { home: ..., away: ... },
  playerOfTheMatch: { official: ..., userVotes: [...], fanVotes: [...] },
  playerRatings: [...],
  cheerMeter: { official: ..., unofficial: ..., userVotes: [...] },
  weather: { condition, humidity, temperature },
  attendance: number,
  referee: string,
  kickoffTime: Date,
  admin: ObjectId,
}`,
      },
      {
        type: "prose",
        content: (
          <>
            The permanent <code>Fixture</code> document gets exactly one update
            during the match: its <code>status</code> flips to <code>LIVE</code>{" "}
            when the live fixture is initialized. That&apos;s it.
            <br />
            <br />
            When the match ends, <code>endCompetitionLiveFixture</code> runs a
            coordinated teardown:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `// 1. Pull the final state from the live document
const liveFixture = await db.V2FootballLiveFixture.findById(liveFixtureId);

// 2. Write the result back to the permanent fixture
await liveFixtureHelperFunctions.updateFixtureDocument({ liveFixture });

// 3. Update standings (league tables, group stages)
await liveFixtureHelperFunctions.updateLeagueStandings({ competition, fixture: updatedFixture });

// 4. Update player stats from match events
await liveFixtureHelperFunctions.updatePlayerStats({ liveFixture, competition });

// 5. Update team stats
await liveFixtureHelperFunctions.updateTeamStats({ liveFixture, result: updatedFixture.result });

// 6. Update competition-level stats
await liveFixtureHelperFunctions.updateCompetitionStats({ competition, fixture: updatedFixture });

// 7. Delete the live document — it has served its purpose
await db.V2FootballLiveFixture.deleteOne({ _id: liveFixtureId });`,
      },
      {
        type: "prose",
        content: (
          <>
            The permanent fixture gets a clean, finalized result. The live
            document is gone. No partial state survives.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "How WebSocket Rooms Fit In",
        content: (
          <>
            Clients don&apos;t poll the database. They join a Socket.IO room
            keyed on the fixture ID and receive targeted events as match state
            changes.
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `// Client connects and joins the match room
socket.on("joinMatch", (matchId) => {
  socket.join(\`match-\${matchId}\`);
});`,
      },
      {
        type: "prose",
        content: (
          <>
            Every mutation in the live fixture service emits a specific event to
            that room:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `// Score changed
emitScoreUpdate(fixture.fixture.toString(), fixture.result);

// Goal added — emit score, scorers, and timeline entry
emitScoreUpdate(fixture.fixture.toString(), fixture.result);
emitGoalScorersUpdate(fixture.fixture.toString(), updatedFixture.goalScorers);
emitTimelineUpdate(fixture.fixture.toString(), timelineEvent);

// Minute ticked over
emitMinuteUpdate(livefixture.fixture.toString(), livefixture.currentMinute, livefixture.injuryTime);

// Substitution made
emitSubstitutionUpdate(fixture.fixture.toString(), substitution);
emitTimelineUpdate(fixture.fixture.toString(), timelineEvent);`,
      },
      {
        type: "prose",
        content: (
          <>
            Each emit function is a thin wrapper around{" "}
            <code>io.to(roomId).emit(event, data)</code>:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `export const emitScoreUpdate = (
  roomId: string,
  result: IV2FootballLiveFixture['result']
) => {
  getIO().to(roomId).emit('score-update', result);
};`,
      },
      {
        type: "prose",
        content: (
          <>
            The room ID is always the permanent fixture&apos;s <code>_id</code>{" "}
            — not the live fixture&apos;s ID. This matters: the permanent
            fixture is stable across the match&apos;s lifecycle. Clients connect
            once using a URL or ID they already know (<code>/fixtures/:id</code>
            ), and the room they join remains valid from kickoff to final
            whistle.
            <br />
            <br />
            Clients never read the <code>LiveFixture</code> collection directly.
            They receive only the specific fields that changed. A goal
            doesn&apos;t send them the full 40-field live document — it sends
            the updated <code>result</code> object and the new timeline entry.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "The Tradeoffs",
        content: (
          <>
            This separation is not free. You now have two documents that must
            stay consistent — the live document&apos;s <code>fixture</code>{" "}
            field must always point to a valid fixture, and the teardown
            sequence must be atomic enough that a crash mid-teardown
            doesn&apos;t leave the system in a bad state.
            <br />
            <br />
            In V2, the teardown isn&apos;t wrapped in a transaction. If{" "}
            <code>updateLeagueStandings</code> succeeds but{" "}
            <code>updatePlayerStats</code> throws, standings are updated but
            player stats are not. This is a known gap. The correct fix is a
            MongoDB multi-document transaction with retry logic, which I
            didn&apos;t implement in V2 but would in a production build.
            <br />
            <br />
            The other tradeoff: querying live data requires knowing to look in{" "}
            <code>LiveFixture</code>, not <code>Fixture</code>. Any service that
            wants to know &quot;is this match currently live?&quot; has to check
            both collections or rely on the <code>status</code> field on{" "}
            <code>Fixture</code>. In practice this was fine — the{" "}
            <code>status</code> field on the permanent fixture is the canonical
            signal.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "What I'd Do Differently",
        content: (
          <>
            The separation itself was the right call. What I&apos;d change:
            <br />
            <br />
            <strong>Wrap the teardown in a transaction.</strong> All six steps
            in <code>endCompetitionLiveFixture</code> should either all succeed
            or all roll back. A partial teardown is worse than a failed one
            because it&apos;s silent.
            <br />
            <br />
            <strong>Add a recovery mechanism.</strong> If the server crashes
            mid-match, the live fixture document survives but the permanent
            fixture is stuck in <code>LIVE</code> status. A startup
            reconciliation job that detects orphaned live fixtures and either
            resumes or cleanly terminates them would fix this.
            <br />
            <br />
            <strong>Emit a single composite event on teardown.</strong> Right
            now, each step emits its own socket event. Clients receive a burst
            of events at match end rather than one clean{" "}
            <code>match-ended</code> payload. A single final snapshot event
            would be cleaner.
            <br />
            <br />
            The core insight — mutable live state and immutable historical
            records should not share a document — holds. It&apos;s the same
            reason you don&apos;t put a running balance in the same row as a
            transaction ledger.
          </>
        ),
      },
    ],
  },

  "recommendation-48h": {
    slug: "recommendation-48h",
    number: "02",
    title: "Building a Recommendation Engine in 48 Hours Without ML",
    tag: "BACKEND · ALGORITHMS",
    project: "Hilite",
    date: "2025",
    readTime: "10 min read",
    lede: "No external services. No training data. Just a 48-hour deadline and a football social platform that needed to surface the right content to the right users. Multi-factor scoring, cold-start prevention, position matching, engagement decay — and it had to stay under 100ms at 10K+ posts.",
    tagColor: "border-red-500 text-red-400",
    sections: [
      {
        type: "prose",
        content: (
          <>
            Hilite is a social platform for footballers. Players post skill
            videos, fans discover them, agents scout. The feed is the product.
            <br />
            <br />
            The client needed a recommendation system. No ML pipeline, no
            training data, no external services. 48 hours. It had to surface the
            right content — players to fans who&apos;d care, skill videos to
            agents who&apos;d act on them — and it had to stay under 100ms at
            10K+ posts.
            <br />
            <br />
            Here&apos;s exactly how I built it, why it works, and what I&apos;d
            do differently.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "The Constraints That Shaped Everything",
        content: (
          <>
            Before writing a line of code, the constraints ruled out most
            standard approaches.
            <br />
            <br />
            <strong>No external ML services.</strong> No AWS Personalize, no
            TensorFlow Serving, no embeddings API. Cost and timeline made them
            non-starters.
            <br />
            <br />
            <strong>No historical interaction data.</strong> New platform, no
            prior engagement to train on. A pure collaborative filtering
            approach (&quot;users like you liked X&quot;) had nothing to work
            with.
            <br />
            <br />
            <strong>Cold-start problem was the common case.</strong> Most users
            on a new platform are new users. Any system that degrades for new
            users would degrade for almost everyone.
            <br />
            <br />
            <strong>Sub-100ms at scale.</strong> A recommendation call that
            blocks the feed endpoint can&apos;t be slow. MongoDB aggregation
            pipelines are fine; chained sequential queries are not.
            <br />
            <br />
            What was available: user profile data (role, position, location),
            social graph (followers/following), post metadata (type, tags,
            timestamps), and engagement signals (likes, views, bookmarks).
            <br />
            <br />
            The answer was a multi-factor scoring function — a hand-tuned
            weighted sum that combines signals into a single relevance score per
            post. No ML, just math with good inputs.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "The Scoring Function",
        content: (
          <>
            Every candidate post gets a score. Posts are sorted by score
            descending. The top N are returned.
          </>
        ),
      },
      {
        type: "code",
        lang: "js",
        content: `function calculatePostScore(post, user, hasViewed) {
  let score = 0;

  // 1. Recency
  const hoursOld = (new Date() - new Date(post.createdAt)) / (1000 * 60 * 60);
  if (hoursOld < 24)       score += 60;
  else if (hoursOld < 72)  score += 40;
  else                     score += Math.max(0, 30 - (hoursOld / 24));

  // 2. Already viewed — large penalty
  if (hasViewed) {
    score -= 100;
    if (post.likes.some(l => l._id.equals(user._id))) score += 20;
  }

  // 3. Author relationship
  const isFollowing = user.following.some(f => f._id.equals(post.author._id));
  if (isFollowing) score += 60;

  const isMutual = isFollowing && post.author.followers?.some(f => f.equals(user._id));
  if (isMutual) score += 35;

  // Social proof: author followed by user's followers
  const commonFollowers = user.followers.filter(f =>
    post.author.followers?.some(af => af.equals(f._id))
  );
  score += commonFollowers.length * 8;

  // 4. Engagement
  score += post.likes.length * 3;
  score += Math.log(post.views.length + 1) * 2;

  // 5. Content match
  if (matchesUserInterests(post, user)) score += 45;

  // 6. Over-exposure penalty
  if (post.views.length > 5000) score -= 15;

  // 7. Engagement rate bonus
  if (post.views.length > 0) {
    const engagementRate = post.likes.length / post.views.length;
    if (engagementRate > 0.1) score += 25;
  }

  return score;
}`,
      },
      {
        type: "prose",
        content: (
          <>
            Each factor is deliberate.
            <br />
            <br />
            <strong>Recency decay</strong> uses a step function for the first 72
            hours (60 → 40 → linear decay) rather than a smooth exponential.
            This gives fresh content a significant advantage without completely
            burying older posts that are still accumulating engagement. Smooth
            exponential decay would age out good content too fast on a platform
            where posts aren&apos;t published by the hundreds per hour.
            <br />
            <br />
            <strong>The -100 viewed penalty</strong> is the most important
            factor. Without it, high-engagement posts dominate every feed
            forever. The penalty ensures users see new content on every request.
            The +20 liked recovery means a post a user genuinely engaged with
            can resurface if it&apos;s accumulated significant new engagement.
            <br />
            <br />
            <strong>Author relationship scores are stacked,</strong> not
            mutually exclusive. Following someone adds 60 points. Mutual
            following adds another 35 on top. Content from people who follow you
            back scores 95 points from relationship alone — nearly a full
            recency bonus — which is the right behaviour for a social platform
            where mutuality signals genuine connection.
            <br />
            <br />
            <strong>
              Logarithmic view weighting (<code>Math.log(views + 1) * 2</code>)
            </strong>{" "}
            prevents viral posts from dominating. A post with 10,000 views
            doesn&apos;t score 1,000x better than a post with 10 views — it
            scores about 4x better. On a discovery platform you want to surface
            emerging content, not just amplify what&apos;s already viral.
            <br />
            <br />
            <strong>The engagement rate bonus</strong> (&gt;10% like-to-view
            ratio) rewards quality over quantity. A post with 100 views and 15
            likes scores better than one with 10,000 views and 200 likes. This
            surfaces genuinely good content that hasn&apos;t been exposed to a
            wide audience yet.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Cold-Start Prevention",
        content: (
          <>
            New users have no social graph. <code>user.following</code> is
            empty. Without graph-based signals, the recommendation function
            would return near-random results weighted only by recency and
            engagement — which isn&apos;t terrible, but isn&apos;t personalised.
            <br />
            <br />
            The fix is a fail-open query strategy combined with role matching.
          </>
        ),
      },
      {
        type: "code",
        lang: "js",
        content: `// Standard query: exclude self and blocked users
let baseQuery = {
  isPublic: true,
  isDeleted: false,
  author: { $nin: [userId, ...blockedIds] }
};

let candidatePosts = await db.Post.find(baseQuery).populate([...]);

// If nothing survives the filter, retry without author exclusion
if (candidatePosts.length === 0) {
  const relaxedQuery = { isPublic: true, isDeleted: false };
  candidatePosts = await db.Post.find(relaxedQuery).populate([...]);
}`,
      },
      {
        type: "prose",
        content: (
          <>
            For new users specifically, <code>matchesUserInterests</code>{" "}
            catches what graph signals can&apos;t:
          </>
        ),
      },
      {
        type: "code",
        lang: "js",
        content: `function matchesUserInterests(post, user) {
  if (user.bookmarks.some(b => b._id.equals(post._id))) return true;
  if (post.author.role === user.role) return true;
  return false;
}`,
      },
      {
        type: "prose",
        content: (
          <>
            A new player with zero follows still gets a feed weighted toward
            player content. A new agent gets agent content. The 45-point bonus
            for an interest match puts role-matched content ahead of generic
            popular content for users with no engagement history.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "User Recommendations: A Different Problem",
        content: (
          <>
            Post recommendations score individual items. User recommendations
            have a different goal: surface people worth following. The signal
            set is different, the diversity requirements are different.
            <br />
            <br />
            After scoring, users are categorised and mixed with weighted
            randomness:
          </>
        ),
      },
      {
        type: "code",
        lang: "js",
        content: `const weights = { mutual: 0.50, popular: 0.25, new: 0.15, active: 0.10 };

while (mixed.length < limit) {
  const rand = Math.random();

  if (rand < 0.50 && indices.mutual < categories.mutual.length)
    selected = 'mutual';
  else if (rand < 0.75 && indices.popular < categories.popular.length)
    selected = 'popular';
  else if (rand < 0.90 && indices.new < categories.new.length)
    selected = 'new';
  else
    selected = 'active';

  mixed.push(categories[selected][indices[selected]++]);
}`,
      },
      {
        type: "prose",
        content: (
          <>
            The mixing matters. If you just sort by score and return the top 20,
            you get 20 popular users every time. The weighted random draw
            ensures mutual connections dominate (50%), popular users appear but
            don&apos;t monopolise (25%), new users get discovered (15%), and
            active users fill the rest (10%). Different requests return
            different orderings even for the same user.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Keeping It Under 100ms",
        content: (
          <>
            The scoring function is fast — it&apos;s in-memory arithmetic on
            already-fetched documents. The bottleneck is fetching candidates.
            <br />
            <br />
            <strong>One population query, not N individual queries.</strong> All
            candidate posts are fetched in a single <code>db.Post.find()</code>{" "}
            with <code>populate()</code>. No per-post queries inside the scoring
            loop. This was the make-or-break architectural decision — any
            approach that queries per-post at 10K+ posts is immediately
            disqualified.
            <br />
            <br />
            <strong>Bookmark counts in a single aggregation.</strong> Rather
            than querying per post, one aggregation unwinds the{" "}
            <code>bookmarks</code> arrays and groups by post ID:
          </>
        ),
      },
      {
        type: "code",
        lang: "js",
        content: `const bookmarkCountsAgg = await db.User.aggregate([
  { $match: { bookmarks: { $in: postIds } } },
  { $unwind: "$bookmarks" },
  { $match: { bookmarks: { $in: postIds } } },
  { $group: { _id: "$bookmarks", count: { $sum: 1 } } }
]);

// One map lookup per post — O(1), not O(n)
const bookmarkCountMap = bookmarkCountsAgg.reduce((acc, item) => {
  acc[item._id.toString()] = item.count;
  return acc;
}, {});`,
      },
      {
        type: "prose",
        content: (
          <>
            Scoring and sorting are pure JavaScript — no database round-trips
            during the ranking phase. Fetch everything upfront, score in memory,
            sort, slice. In practice on Render&apos;s free tier, responses came
            back between 80–120ms for feeds up to 10K candidates.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "What's Missing (And Why)",
        content: (
          <>
            This algorithm has real gaps.
            <br />
            <br />
            <strong>
              <code>matchesUserInterests</code> is shallow.
            </strong>{" "}
            Right now it checks role and bookmarks. A proper implementation
            would track which post types a user engages with most, which
            positions they interact with, which hashtags appear in liked posts.
            I left stubs in the comments —{" "}
            <code>// Would require additional query in production</code> —
            because building a proper interest profile was out of scope for the
            timeline.
            <br />
            <br />
            <strong>No A/B testing.</strong> The weights (60 for recency under
            24h, 45 for interest match, etc.) are intuitions, not measurements.
            On a live platform you&apos;d run experiments to find which weights
            actually improve engagement metrics.
            <br />
            <br />
            <strong>
              The viewed-penalty approach doesn&apos;t scale cleanly.
            </strong>{" "}
            Storing viewer IDs in <code>post.views</code> means the views array
            grows unboundedly. At high view counts, checking{" "}
            <code>post.views.some(viewerId =&gt; ...)</code> becomes slow. The
            right approach at scale is a separate{" "}
            <code>UserPostInteraction</code> collection with compound indexes on{" "}
            <code>(userId, postId)</code> — O(1) lookup instead of O(n) array
            scan.
            <br />
            <br />
            <strong>No position-aware football scoring.</strong> Hilite is for
            footballers, but the algorithm doesn&apos;t know that an agent
            specialising in forwards should see forward content. The{" "}
            <code>playerDetails.position</code> field exists on user profiles —
            it just isn&apos;t wired into the scoring function. That&apos;s a
            straightforward addition that would meaningfully improve relevance
            for the core use case.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        content: (
          <>
            For what it was — a from-scratch recommendation system built under a
            48-hour deadline with no ML infrastructure — the results were solid.
            The feed felt personalised from day one for users with even a small
            social graph. New users got a usable default feed. And it stayed
            fast.
            <br />
            <br />
            The biggest thing I learned: when you can&apos;t use ML, the quality
            of your signals matters more than the sophistication of your model.
            Garbage in, garbage out — and on a social platform, the signal you
            have to get right first is the social graph.
          </>
        ),
      },
    ],
  },
  "live-event-log": {
    slug: "live-event-log",
    number: "05",
    title: "Live Scores, Take Two: Nothing Is Stored, Everything Is Replayed",
    tag: "REAL-TIME · ARCHITECTURE",
    project: "CampScore",
    date: "2026",
    readTime: "9 min read",
    lede: "Moving live data into its own collection fixed FSM. When I rebuilt it as CampScore I went one step further: the live console stores no score at all. It stores what happened, in order, and works the score out every time.",
    tagColor: "border-orange-400 text-orange-400",
    sections: [
      {
        type: "prose",
        content: (
          <>
            In <Link href="/writing/live-fixture-separation" className="underline decoration-yellow-400/40 hover:text-white">the first live-match article</Link>{" "}
            I moved live match data off the fixture and into its own collection.
            That stopped live writes from fighting with historical reads, and it
            worked for a semester of real competitions.
            <br />
            <br />
            CampScore changed the shape of the problem. It isn&apos;t one
            campus any more. It&apos;s organisations running football and
            basketball, several operators on one match (one per team, sometimes
            on bad mobile data), and fans watching from a public page. A live
            document that gets mutated in place — <code>score.home += 1</code>{" "}
            — falls apart under all three. So the rebuilt console follows one
            rule.
          </>
        ),
      },
      {
        type: "callout",
        content: (
          <>
            The event log is the only source of truth. Nothing is edited in
            place. Every score, stat, minute played and possession figure is
            replayed from the log, and a correction is just another event.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Replay, Don't Mutate",
        content: (
          <>
            A live fixture holds a list of events: <code>period_start</code>,{" "}
            <code>goal</code>, <code>card</code>, <code>substitution</code>,{" "}
            <code>possession</code> and so on. Each one has a server-assigned
            sequence number. Everything a client sees — the score, the box
            score, possession percentages — is a <em>projection</em> built by
            replaying that list from the start:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `/** Rebuilds the projection from the log. Events must be in \`seq\` order; voided events are skipped. */
export function replay(events: LiveEventRecord[], pack: LivePack, ctx: LiveContext): LiveProjection {
    const p = emptyProjection();
    // ...seed every player in both lineups so they appear even with no events
    const voided = voidedIds(events);
    p.voided = [...voided];
    for (const e of events) {
        p.lastSeq = Math.max(p.lastSeq, e.seq);
        p.eventCount++;
        if (e.type === CoreEventType.VOID || voided.has(e.id)) continue;
        applyEvent(e, p, pack, ctx);
    }
    pack.finish(p, ctx);
    // ...possession % from match-clock seconds per side
    return p;
}`,
      },
      {
        type: "prose",
        content: (
          <>
            The <code>pack</code> is the sport. Football and basketball each
            have a sport pack that knows what a goal or a three-pointer does to
            the projection, how periods work and what a valid event looks like.
            The replay engine itself knows nothing about either sport, which is
            why adding basketball didn&apos;t mean forking the console.
            <br />
            <br />
            Replaying a whole match on every write sounds expensive. In
            practice a match is a few hundred events, and the replay is
            a pure function over an in-memory array. It&apos;s the cheapest part
            of the request.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Corrections Are Events Too",
        content: (
          <>
            Operators make mistakes: the wrong scorer, a goal that was
            disallowed, a card given to the wrong player. In a mutable document,
            fixing that means finding the right fields and decrementing them,
            and hoping every derived number got the same fix.
            <br />
            <br />
            Here a correction is a <code>void</code> event pointing at the
            event it cancels. The next replay simply skips the voided event, so
            every figure that depended on it is correct again at once —
            including ones I didn&apos;t think about when I wrote the void.
            There are a few guard rails: a void can&apos;t itself be voided
            (you re-enter the event instead), and a period start or end can
            only be voided while nothing valid has happened after it.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Retries Must Be Harmless",
        content: (
          <>
            Console operators are often on mobile data at the side of a pitch.
            Requests time out, and the app retries. Sometimes it queues events
            offline and sends them all when the signal comes back. If the same
            goal can arrive twice, it must only count once.
            <br />
            <br />
            So the console generates a UUID — a <code>clientEventId</code> —
            for every event, and the server stores each id once. A batch of
            events is planned before anything is written:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `const stored = new Map(o.log.map(e => [e.clientEventId, e]));
const seenInBatch = new Set<string>();

o.inputs.forEach((input, index) => {
    const existing = stored.get(input.clientEventId);
    if (existing || seenInBatch.has(input.clientEventId)) {
        results[index] = { clientEventId: input.clientEventId, status: 'duplicate', seq: existing?.seq ?? null };
        return;
    }
    seenInBatch.add(input.clientEventId);
    fresh.push({ index, input });
});`,
      },
      {
        type: "prose",
        content: (
          <>
            Each fresh event is then placed in the match, validated against
            the projection <em>as it was just before it</em>, and applied, so
            event five in a batch is checked against the state after events one
            to four. The response tells the console, per event, whether it was
            accepted, rejected (with a reason) or a duplicate. A retry gets
            &quot;duplicate&quot; back, not a second goal.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Two Operators, One Match",
        content: (
          <>
            A match can have one operator per team plus one for the clock.
            Most of their events don&apos;t conflict: a home-team card and an
            away-team substitution can arrive in any order. The server numbers
            them as they come, accepts them, and catches each console up in the
            response.
            <br />
            <br />
            Some events change the structure of the match, though:{" "}
            <code>period_start</code>, <code>period_end</code>,{" "}
            <code>shootout_start</code> and <code>void</code>. Ending the half
            while another operator&apos;s goal is still in flight changes which
            half that goal belongs to. For those, the console has to send the
            last sequence number it has seen. If it is behind, the server
            answers <code>409 LIVE_SEQUENCE_CONFLICT</code>, and the console
            has to catch up before it can try again. Cheap events stay
            optimistic; only the dangerous ones are strict.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "A Clock That Doesn't Need Writing",
        content: (
          <>
            A running match clock is the most predictable number in the
            system, so it shouldn&apos;t cost a write every second or every
            minute. CampScore stores two values per period —
            the seconds already played and when the clock last started — and
            lets everyone compute the rest:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `/** Match-clock seconds at wall time \`at\` (never negative). */
export function clockSecondsAt(clock: LiveProjection['clock'], at: Date): number {
    if (!clock.running || !clock.lastStartedAt) return clock.baseSeconds;
    return Math.max(0, clock.baseSeconds + Math.floor((at.getTime() - clock.lastStartedAt.getTime()) / 1000));
}`,
      },
      {
        type: "prose",
        content: (
          <>
            Football counts up and basketball counts down from the period
            length, but both are the same two numbers. Pausing the clock is an
            event; ticking is free.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Why Fans Get SSE, Not Socket.IO",
        content: (
          <>
            FSM used Socket.IO rooms. For CampScore I looked at who actually
            sends what. Fans only listen to a match; they don&apos;t push live
            data back over a socket. Operators write through ordinary REST calls, which already have auth,
            validation, idempotency and error codes.
            <br />
            <br />
            For one-way updates, Server-Sent Events are plain HTTP: no
            handshake library on the client, the browser&apos;s{" "}
            <code>EventSource</code> reconnects on its own, and it goes through
            the same proxies as everything else. The server side is a small
            registry of open responses grouped into rooms:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `emit(room: string, eventType: string, payload: unknown): void {
    const ids = this.rooms.get(room);
    if (!ids) return;
    const frame = \`event: \${eventType}\\ndata: \${JSON.stringify(payload)}\\n\\n\`;
    for (const id of ids) {
        const conn = this.connections.get(id);
        if (conn) {
            try { conn.res.write(frame); }
            catch { this.remove(id); }   // dead connection — reap it
        }
    }
}`,
      },
      {
        type: "prose",
        content: (
          <>
            The live service never sees this class. It talks to a broadcast
            port with <code>toFixture</code>, <code>toLeague</code> and{" "}
            <code>watcherCount</code>, and the SSE adapter implements it. That
            seam matters because the registry is per process: a fan connected
            to one instance won&apos;t hear an event emitted on another. When
            CampScore needs more than one instance, a Redis pub/sub backplane
            goes behind the same port and the service doesn&apos;t change.
            I&apos;d rather write that limit down than pretend it isn&apos;t
            there.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Finishing a Match",
        content: (
          <>
            When staff finalize the console, the last replay becomes the
            fixture result: the score, period scores, team stats and every
            player&apos;s box score. That result goes through the fixture
            module&apos;s normal result path, so standings and player career
            totals update exactly as they would for a result typed in by hand.
            There is one path into the archive, not two.
            <br />
            <br />
            Finalize also refuses to run in states that would produce a bad
            archive: a period still in progress, regulation periods not played,
            or — when the match is tracked at player level — a goal or basket
            with no player attached. Then the log is locked.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "What Changed in How I Think",
        content: (
          <>
            The first version of this article was about separating live state
            from history. This one is about not having live state at all, only
            a history that happens to still be growing. Once the log is the
            truth, the hard features stop being hard: corrections, offline
            retries, late entries, two operators, a public stream and a final
            result all read from the same list.
            <br />
            <br />
            The cost is discipline. Every new event type needs a schema, a rule
            in the sport pack, and a decision about whether it is structural.
            That&apos;s a fair price for never having to ask &quot;which number
            is right?&quot; during a live final.
          </>
        ),
      },
    ],
  },
  "hashed-api-keys": {
    slug: "hashed-api-keys",
    number: "06",
    title: "API Keys That Are Useless to Whoever Steals Your Database",
    tag: "SECURITY · API DESIGN",
    project: "Healthwise HMO",
    date: "2026",
    readTime: "7 min read",
    lede: "Hospitals and HMOs don't only use the Healthwise dashboard. Their own systems call the API to request pre-authorisations and submit claims. That makes every API key a long-lived password held by a machine — so I designed them to be worthless if my database ever leaks.",
    tagColor: "border-violet-400 text-violet-400",
    sections: [
      {
        type: "prose",
        content: (
          <>
            A user password has a lot of protection around it: two-factor
            login, short-lived access tokens, refresh-token rotation. An API key
            has none of that. A hospital&apos;s system sends the same key on
            every call, possibly for months. If it leaks, whoever has it
            <em> is</em> that hospital until someone notices.
            <br />
            <br />
            The question I designed around was: what happens if the{" "}
            <code>api_keys</code> collection itself is copied? The answer
            should be &quot;nothing useful&quot;.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Shown Once, Stored as a Hash",
        content: (
          <>
            A key is 32 random bytes, prefixed with the environment it belongs
            to:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `const rawKey = \`\${dto.environment}_sk_\${crypto.randomBytes(32).toString('hex')}\`;
// e.g. live_sk_9f2c… or test_sk_41ab…

const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
const keyPrefix = rawKey.substring(0, 12);`,
      },
      {
        type: "prose",
        content: (
          <>
            The raw key is returned to the caller exactly once, in the response
            that creates it. The database stores only the SHA-256 hash and the
            first 12 characters, so a key can still be recognised in a listing
            (&quot;live_sk_9f2c…&quot;) without being usable. If an
            organisation loses its key, it can&apos;t be shown again — they
            revoke it and create a new one.
            <br />
            <br />
            The <code>live_</code> / <code>test_</code> prefix isn&apos;t
            decoration. It means a developer can tell at a glance which key is
            in a config file, and secret scanners can match the pattern.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Why SHA-256 and Not bcrypt",
        content: (
          <>
            My first instinct was bcrypt, because that&apos;s what passwords
            get. It&apos;s the wrong tool here, for two reasons.
            <br />
            <br />
            <strong>bcrypt exists to slow down guessing.</strong> Passwords are
            chosen by people, so the space of likely passwords is small and an
            attacker with the hashes can try them fast. A 256-bit random key
            has no &quot;likely&quot; values. Brute-forcing it is hopeless
            whether each guess costs a nanosecond or a second, so the slowness
            buys nothing.
            <br />
            <br />
            <strong>bcrypt can&apos;t be looked up.</strong> Each bcrypt hash
            has its own salt, so to find which key a request is using you would
            have to compare it against every stored key. A plain SHA-256 of a
            high-entropy key is deterministic: hash the incoming key, then do
            one indexed <code>findOne(&#123; keyHash &#125;)</code>. That
            matters on an endpoint every partner system hits on every call.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "What Every Request Goes Through",
        content: (
          <>
            One middleware handles every system caller. It accepts the key as a
            Bearer token or an <code>X-Api-Key</code> header, so partners can
            use whichever their HTTP client makes easier:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
const key = await keyRepo.findByHash(keyHash);
if (!key) return next(new InvalidApiKeyError());
if (!key.isActive || key.revokedAt) return next(new ApiKeyRevokedError());
if (key.expiresAt && key.expiresAt < new Date()) {
    keyRepo.revoke(key.id).catch(/* log and move on */);
    return next(new ApiKeyExpiredError());
}

keyRepo.updateLastUsed(key.id).catch(/* log and move on */);

await assertOrganisationActive(key.organisationId);
req.system = {
    id: key.id,
    organisationId: key.organisationId,
    organisationType: key.organisationType,
    environment: key.environment,
    authType: 'system',
};
req.apiKeyScopes = key.scopes;`,
      },
      {
        type: "prose",
        content: (
          <>
            A few choices in there are deliberate.
            <br />
            <br />
            <strong>Expired keys revoke themselves.</strong> The first call
            with an expired key marks it revoked, so the dashboard shows the
            truth without a cron job.
            <br />
            <br />
            <strong>Bookkeeping never blocks the request.</strong> Updating{" "}
            <code>lastUsedAt</code> and the self-revoke are fire-and-forget: a
            failure is logged, and the partner&apos;s call is not slowed down
            or failed because of a timestamp.
            <br />
            <br />
            <strong>The organisation is checked, not just the key.</strong> If
            an organisation is suspended, all of its keys stop working at once,
            without anyone revoking them one by one.
            <br />
            <br />
            <strong>The caller is a system, not a user.</strong> Downstream
            code reads <code>req.system</code> and knows it is talking to an
            integration with an organisation, not a person with a role.
            Services that act for both use one &quot;org caller&quot; shape, so
            access rules are written once.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Scopes by Organisation Type",
        content: (
          <>
            A valid key isn&apos;t permission to do everything. Each key carries
            scopes, and routes declare the one they need with{" "}
            <code>requireScope</code>. The defaults come from what kind of
            organisation owns the key:
          </>
        ),
      },
      {
        type: "code",
        lang: "ts",
        content: `export const DEFAULT_HOSPITAL_ORG_API_KEY_SCOPES: ApiKeyScope[] = [
    ApiKeyScope.PREAUTH_REQUEST,
    ApiKeyScope.PREAUTH_READ,
    ApiKeyScope.CLAIM_SUBMIT,
    ApiKeyScope.CLAIM_READ,
    // ...invoices, services, prices, events
];

export const DEFAULT_HMO_ORG_API_KEY_SCOPES: ApiKeyScope[] = [
    ApiKeyScope.PREAUTH_DECIDE,
    ApiKeyScope.PREAUTH_READ,
    ApiKeyScope.CLAIM_DECIDE,
    ApiKeyScope.CLAIM_READ,
    // ...invoices, services, prices, events
];`,
      },
      {
        type: "prose",
        content: (
          <>
            A hospital&apos;s key can request a pre-authorisation and submit a
            claim. It can&apos;t approve either. An HMO&apos;s key can decide,
            but it can&apos;t submit a claim on a hospital&apos;s behalf. Even
            a stolen key can only do what that side of the relationship is
            allowed to do. Extra scopes can be added to a key when it is
            created, on top of the defaults.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "Live and Test Never Mix",
        content: (
          <>
            Partners need somewhere to build their integration without filing
            real claims against real patients. So every pre-auth, claim and
            invoice carries a <code>livemode</code> flag, and the two modes
            never meet:
            <br />
            <br />
            — an API key&apos;s mode is its environment, so a{" "}
            <code>test_sk_</code> key can only ever touch test records;
            <br />
            — a signed-in user picks the mode with an{" "}
            <code>X-Livemode</code> header (live when it&apos;s missing, and
            anything other than <code>true</code> or <code>false</code> is a
            400);
            <br />
            — a claim can only be made from a pre-auth in the same mode, and
            reference numbers are unique per mode;
            <br />
            — only live records send notifications.
            <br />
            <br />
            The test mode is the whole system, not a mock of it. A partner who
            gets their flow working against test keys has exercised exactly the
            code their live keys will hit.
          </>
        ),
      },
      { type: "divider" },
      {
        type: "prose",
        label: "The Short Version",
        content: (
          <>
            Treat an API key like a password the user never typed: make it
            long and random, show it once, store a hash you can index, and
            check more than the key on every call — its status, its expiry,
            its organisation, its scope and its mode. Then a copy of the
            database is a list of hashes and prefixes, and nothing more.
          </>
        ),
      },
    ],
  },
};

// ─── Article Page ─────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  ARCHITECTURE: "border-yellow-400 text-yellow-400",
  "BACKEND · ALGORITHMS": "border-red-500 text-red-400",
  "CACHING · REDIS": "border-green-500 text-green-400",
  "TYPESCRIPT · REFACTORING": "border-blue-400 text-blue-400",
  "REAL-TIME · ARCHITECTURE": "border-orange-400 text-orange-400",
  "SECURITY · API DESIGN": "border-violet-400 text-violet-400",
};

function CodeBlock({ lang, content }: { lang?: string; content: string }) {
  return (
    <div className="my-8 border border-white/10 overflow-hidden">
      {lang && (
        <div className="px-4 py-2 border-b border-white/10 bg-white/3 flex items-center justify-between">
          <span className="font-mono text-xs text-white/25 font-bold uppercase tracking-widest">
            {lang}
          </span>
          <span className="w-2 h-2 rounded-full bg-yellow-400/40" />
        </div>
      )}
      <pre className="overflow-x-auto p-5 bg-white/2">
        <code className="font-mono text-sm text-white/70 leading-relaxed">
          {content}
        </code>
      </pre>
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="font-mono font-black text-white text-xl md:text-2xl uppercase tracking-tight mt-14 mb-5 flex items-center gap-3">
      <span className="text-yellow-400/40 text-sm font-bold">/</span>
      {label}
    </h2>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = ARTICLES[slug];
  if (!article) notFound();

  const tagColor = TAG_COLORS[article.tag] ?? "border-white/20 text-white/30";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-400 selection:text-black">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b-2 border-white/10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-xs text-white/40 font-bold tracking-widest uppercase hover:text-white transition-colors duration-100 flex items-center gap-2"
          >
            <ArrowLeft size={12} /> GLORY UMUERRI
          </Link>
          <Link
            href="/#writing"
            className="font-mono text-xs text-white/25 font-bold tracking-widest uppercase hover:text-white/60 transition-colors duration-100"
          >
            ALL WRITING
          </Link>
        </div>
      </nav>

      <main className="pt-4">
        {/* Header */}
        <header className="border-b-2 border-white/10">
          <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="font-mono text-xs text-white/20 font-bold">
                {article.number}
              </span>
              <span
                className={`font-mono text-xs font-bold border px-2 py-0.5 ${tagColor}`}
              >
                {article.tag}
              </span>
              <span className="font-mono text-xs text-white/20 border border-white/10 px-2 py-0.5">
                {article.project}
              </span>
              <span className="font-mono text-xs text-white/15">
                {article.date} · {article.readTime}
              </span>
            </div>

            <h1 className="font-mono font-black text-white text-3xl md:text-5xl uppercase tracking-tight leading-tight mb-8">
              {article.title}
            </h1>

            <p className="text-white/50 text-lg leading-relaxed max-w-2xl border-l-2 border-yellow-400/30 pl-5">
              {article.lede}
            </p>
          </div>
        </header>

        {/* Body */}
        <article className="max-w-3xl mx-auto px-6 py-16">
          {article.sections.map((section, i) => {
            if (section.type === "divider") {
              return (
                <hr
                  key={i}
                  className="border-none border-t-2 border-white/8 my-12"
                />
              );
            }

            if (section.type === "code") {
              return (
                <CodeBlock
                  key={i}
                  lang={section.lang}
                  content={section.content as string}
                />
              );
            }

            if (section.type === "callout") {
              return (
                <div
                  key={i}
                  className="my-8 border-l-2 border-yellow-400 pl-5 py-1"
                >
                  <p className="text-white/60 text-sm leading-relaxed">
                    {section.content}
                  </p>
                </div>
              );
            }

            // prose
            return (
              <div key={i}>
                {section.label && <SectionHeading label={section.label} />}
                <p className="text-white/60 text-base md:text-[17px] leading-[1.85] [&_code]:font-mono [&_code]:text-yellow-300/80 [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_strong]:text-white/80 [&_strong]:font-bold">
                  {section.content}
                </p>
              </div>
            );
          })}
        </article>

        {/* Footer nav */}
        <div className="border-t-2 border-white/10">
          <div className="max-w-3xl mx-auto px-6 py-12 flex items-center justify-between gap-6">
            <Link
              href="/#writing"
              className="flex items-center gap-2 font-mono text-xs font-bold text-white/30 hover:text-white uppercase tracking-widest transition-colors duration-100"
            >
              <ArrowLeft size={12} /> All Writing
            </Link>
            <a
              href="https://github.com/WebDeveloperGlory"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-xs font-bold text-yellow-400/60 hover:text-yellow-400 uppercase tracking-widest transition-colors duration-100"
            >
              GitHub <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
