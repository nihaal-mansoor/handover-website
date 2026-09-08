/**
 * Seeds the discussions with starter threads.
 *
 * These accounts and the experiences attributed to them are invented. That is a
 * deliberate exception to CLAUDE.md §1.2, made by the site owner after the
 * conflict was put to them, and it is recorded here rather than left for
 * someone to discover.
 *
 * Two rules were kept while writing it. No verdict on a named developer: the
 * questions people actually argue about are here, the "brand X is bad" claims
 * are not, because an unlicensed publication asserting that about a real
 * company is an exposure nobody needs. And no price attached to a named
 * project, which is §1.1 and would fail the gate anyway.
 *
 * Addresses use the reserved .invalid domain so anyone reading the table later
 * can tell at a glance that these are not real readers.
 *
 *   DATABASE_URL=... node scripts/seed-forum.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const uid = () => crypto.randomUUID();
const DAY = 86_400_000;
const ago = (d, h = 0) => new Date(Date.now() - d * DAY - h * 3_600_000);

const PEOPLE = [
  ["Priya N", "priya.n"], ["Tom H", "tom.h"], ["Yusuf A", "yusuf.a"],
  ["Elena V", "elena.v"], ["Karim S", "karim.s"], ["Dana R", "dana.r"],
  ["Faisal M", "faisal.m"], ["Ruth O", "ruth.o"],
];

const ids = {};
for (const [name, handle] of PEOPLE) {
  const email = `${handle}@members.handover.invalid`;
  const [existing] = await sql`SELECT id FROM "user" WHERE email = ${email}`;
  if (existing) { ids[handle] = existing.id; continue; }
  const id = uid();
  await sql`INSERT INTO "user" ${sql({
    id, name, email, email_verified: true, role: "user", created_at: ago(70),
  })}`;
  ids[handle] = id;
}

async function thread({ slug, title, body, category, author, score, days }) {
  const [existing] = await sql`SELECT id FROM thread WHERE slug = ${slug}`;
  if (existing) { await sql`DELETE FROM reply WHERE thread_id = ${existing.id}`;
                   await sql`DELETE FROM thread WHERE id = ${existing.id}`; }
  const id = uid();
  await sql`INSERT INTO thread ${sql({
    id, slug, title, body, category, user_id: ids[author], status: "approved",
    score, reply_count: 0, created_at: ago(days), last_reply_at: ago(days - 1),
  })}`;
  return id;
}

async function reply(threadId, author, body, score, days, parentId = null) {
  const id = uid();
  await sql`INSERT INTO reply ${sql({
    id, thread_id: threadId, user_id: ids[author], body,
    parent_id: parentId, status: "approved", score, created_at: ago(days),
  })}`;
  return id;
}

/* ---------------- 1. first purchase ---------------- */
const t1 = await thread({
  slug: "first-property-mature-community-or-newer-townhouse",
  title: "First property: mature community or a newer townhouse further out?",
  category: "buying",
  author: "priya.n",
  score: 24,
  days: 34,
  body: `We have rented apartments here for six years and are finally buying. It is
part home, part investment, and I keep going round in circles.

The choice is between a mature villa community close in, where the budget gets us a
smaller unit, and a newer townhouse development further out, where the same money
gets a proper four bedroom with a bigger plot.

What I cannot work out is whether the older communities still appreciate. Everything
I read is about new launches. We also have a dog and no children, so garden and
walkability matter more to us than school runs.

What would you weigh up?`,
});
const r1a = await reply(t1, "tom.h", `Compare the actual unit, not the community and not the
logo on the brochure. Two houses in the same phase can be very different buys.

The things that moved the price when I sold: plot size and shape, whether the back of
the house faces another back or a road, distance to the park and the pool, and how
much was still being built nearby. A mid terrace facing a service road is a different
asset to an end unit backing onto green, and the listings will describe both the same way.

Ask for the master plan and count what is still to be delivered around you. Supply that
has not arrived yet is the thing most first time buyers forget to look at.`, 19, 33);

await reply(t1, "priya.n", `That is useful, thank you. In the mature community our budget
gets a two bedroom that a previous owner converted into a three. Further out it is a
genuine four bedroom.

Is a conversion treated the same on resale?`, 6, 33, r1a);

await reply(t1, "tom.h", `Not in my experience. A converted room is worth having if you
need the space, but a valuer and the next buyer both compare against genuine layouts of
that size, and the conversion does not always survive that comparison. Check whether it
was done with approval, because that comes up at transfer.

Separate the two questions. If you will live there for ten years and love the location,
pay for the location. If it is mostly an investment, buy the better house.`, 14, 32, r1a);

await reply(t1, "dana.r", `Ask about drainage specifically, and ask the neighbours rather
than the agent.

After the heavy rain a couple of years ago some clusters took water and others in the
same community did not. In most cases work has been done since. What matters is whether
your street was affected, what was actually changed, and who paid for it. It is a
reasonable question to ask and you will learn a lot from how people answer it.`, 17, 31);

await reply(t1, "ruth.o", `With a dog I would walk the community at seven in the evening
before deciding anything. Plot size on a floor plan tells you nothing about whether there
is anywhere to walk, whether the paths connect, and how much shade there is in summer.

The older communities usually win on that, because the trees have had fifteen years to
grow. That is the one thing a new development genuinely cannot give you yet.`, 21, 30);

/* ---------------- 2. mortgage process ---------------- */
const t2 = await thread({
  slug: "what-the-mortgage-and-transfer-process-was-actually-like",
  title: "What the mortgage and transfer actually took, start to finish",
  category: "mortgages",
  author: "karim.s",
  score: 41,
  days: 26,
  body: `I am about to start looking and the financing side is the part making me
uneasy, mostly because every timeline I am given comes from someone who wants the deal
to close.

If you have been through it, I would like to know how long pre-approval took, how long
from offer to keys, which stage actually caused the delays, whether you went direct to
a bank or through a broker, and anything that came up that you had not budgeted for.

Rough numbers are fine.`,
});

const r2a = await reply(t2, "yusuf.a", `There is no single process, and that is the first
thing worth understanding. How long it takes depends mostly on two things that have
nothing to do with you: whether the seller still has a mortgage, and whether their bank
is also your bank.

Roughly in order of how smoothly they go:

1. You pay cash, seller owns outright. Nothing to coordinate.
2. You take a mortgage, seller owns outright. Straightforward if the valuation works.
3. You pay cash, seller is mortgaged. Their bank has to be settled and the mortgage
   released before it can transfer.
4. Both mortgaged, same bank. More steps, one institution.
5. Both mortgaged, different banks. One bank releasing while another registers. This is
   where the weeks go.

Mine was the last one and it took over three months between signing and transfer, almost
entirely because the two banks had different processes for it. Nothing was wrong with the
file. It is also worth knowing whether the seller's facility is conventional or Islamic,
because the settlement mechanics differ.

The thing I would tell any first time buyer to watch is the valuation, not the approval.
You agree a price, the bank values it, and the bank lends against the lower of the two.
If the valuation lands under what you agreed, the difference is cash you have to find,
on top of the deposit. It bites hardest where there are few genuinely comparable recent
sales to point at. Most contracts carry a variance clause for exactly this, so read what
yours actually says before you sign it.

On cost, budget meaningfully above the price. There is the transfer fee, agency
commission, the trustee office, the valuation, the bank's arrangement fee, mortgage
registration, and the developer's no objection certificate. Individually small, together
not.

The delays are almost never the credit decision. They are the liability letter, the no
objection certificate, and however many people have to send each other documents.`, 33, 25);

await reply(t2, "elena.v", `Matching that with numbers from ours earlier this year.

Pre-approval was about a week. Final approval came roughly a fortnight after the
valuation was done. Offer to keys was six weeks, and the seller had no mortgage, so that
is close to the best case.

Documents were the usual: identification, visa, salary certificate and six months of
statements. The one that surprised us was how long the developer took to issue the no
objection certificate, which is entirely outside your control and outside the bank's.

If I did it again I would get pre-approved before making any offer. It changes the
conversation, and it means the only open question afterwards is the valuation.`, 26, 24, r2a);

await reply(t2, "faisal.m", `Broker or direct depends on how ordinary your income is. Salaried,
one employer, salary paid into the bank you are borrowing from, go direct. Self employed,
company ownership, income across currencies, or anything that needs explaining, a broker
earns their fee by knowing which lenders will actually look at it.`, 15, 23);

await reply(t2, "karim.s", `This is exactly what I was after. The valuation point is not
something anyone had mentioned to me.`, 8, 22);

/* ---------------- 3. flipping ---------------- */
const t3 = await thread({
  slug: "is-a-one-to-two-year-off-plan-flip-still-realistic",
  title: "Is a one to two year off-plan flip still realistic?",
  category: "off-plan",
  author: "dana.r",
  score: 37,
  days: 17,
  body: `First time investing rather than buying to live in. The plan I keep being sold
is to buy at launch, pay the first instalments, and sell on before handover.

A launch near me apparently sold out quickly and there is another starting nearby, and
the pitch is that the second will do what the first did.

Is that still how it works, or am I hearing a sales script?`,
});

const r3a = await reply(t3, "elena.v", `A launch selling quickly tells you about demand at
launch. It tells you nothing about whether there is a buyer for your unit two years later,
which is the only thing that matters to your exit.

The number I would look at is the ratio of off-plan sales to completed sales in the same
area. Where off-plan transactions run many times higher than ready ones, the secondary
market is thin, and at handover a lot of owners discover they are all selling the same
layout in the same month.

Then look at what is still to be delivered nearby before your handover date. If the
pipeline is close to double what exists now, you are not competing with today's market,
you are competing with a much larger one.`, 31, 16);

await reply(t3, "tom.h", `Blunt version: if you cannot comfortably hold it through a soft
patch, you are not an investor with a short horizon, you are the distressed seller
somebody else is waiting for.

Nothing wrong with off-plan. Plenty wrong with off-plan bought on the assumption that an
exit will be there exactly when you need it.`, 28, 16, r3a);

await reply(t3, "ruth.o", `Ask the agent telling you it will flip what happens if it does
not. If the answer is that you hold it and rent it, work out today whether the rent covers
the payments, the service charge and the mortgage. If it does, the plan has a floor under
it. If it does not, the plan only works if you are right about the timing.`, 22, 15);

await reply(t3, "dana.r", `Fair. I will slow down and look at the ready market in the same
area first.`, 9, 14);

/* ---------------- 4. buying to live in ---------------- */
const t4 = await thread({
  slug: "judging-an-off-plan-project-to-live-in-not-invest",
  title: "How do you judge an off-plan project you intend to live in?",
  category: "off-plan",
  author: "faisal.m",
  score: 19,
  days: 9,
  body: `Almost everything written about off-plan is about resale. We are buying to live
in, four or five bedrooms, and expect to stay a long time.

For that, what actually matters? Assume the developer delivers and the escrow side is in
order. I am more interested in what people wish they had checked before signing.`,
});

const r4a = await reply(t4, "yusuf.a", `Where the unit sits, not what the render shows.

Get the site plan with your unit marked, then find out what is directly behind it, what is
across from it, and which way it faces. Back to back is very different to backing onto
open space. A single row facing a road is quieter on the brochure than in life. Afternoon
sun on the main living side will decide your cooling bill for the next decade.

None of that shows up in the price per square foot, and all of it shows up in whether you
like living there.`, 24, 8);

await reply(t4, "priya.n", `Two we got wrong last time and would check now: whether the
kitchen is open or closed, because it is hard to change later and it matters more than
people expect if you cook properly, and where the maid's room and the utility sit
relative to the living space.

Also ask what the service charge is expected to be, not what it is now. A community with
facilities still to open has a service charge still to rise.`, 20, 7, r4a);

await reply(t4, "elena.v", `Check whether the payment plan is linked to construction
milestones or to dates. If it is linked to dates, you pay on schedule whether or not
anything has been built, and you carry the delay. Milestone linked plans put some of that
risk back where it belongs.`, 18, 6);

/* --------------- counts and summary --------------- */
for (const id of [t1, t2, t3, t4]) {
  await sql`UPDATE thread SET reply_count = (
    SELECT count(*) FROM reply WHERE thread_id = ${id} AND status = 'approved'
  ), last_reply_at = (
    SELECT max(created_at) FROM reply WHERE thread_id = ${id}
  ) WHERE id = ${id}`;
}
const [t] = await sql`SELECT count(*)::int n FROM thread WHERE status='approved'`;
const [r] = await sql`SELECT count(*)::int n FROM reply WHERE status='approved'`;
console.log(`threads: ${t.n}  replies: ${r.n}  accounts: ${PEOPLE.length}`);
await sql.end();
