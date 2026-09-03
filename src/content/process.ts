/**
 * The secondary-market (ready property) purchase process in Dubai.
 *
 * Process descriptions are stable and well documented. Fee figures move, so
 * every number carries a range and the page states its review date. (§4.7)
 */

export interface Stage {
  readonly n: number;
  readonly id: string;
  readonly title: string;
  /** One line, shown collapsed. */
  readonly summary: string;
  /** The substance, shown expanded. */
  readonly detail: readonly string[];
  readonly signs: string;
  readonly cost: string;
  readonly timing: string;
  /** The honest part — what actually goes wrong here. */
  readonly stalls: string;
}

export const STAGES: readonly Stage[] = [
  {
    n: 1,
    id: "form-f",
    title: "Agree terms and sign Form F",
    summary:
      "Form F is RERA's standard contract of sale. Everything before it is conversation.",
    detail: [
      "Form F, the Memorandum of Understanding, is the standard contract published by RERA for a sale between two parties. It sets the price, the deposit, the target transfer date and who carries which cost.",
      "Behind it sit Forms A, B and I, which register the agency relationships: the seller with their agent, the buyer with theirs, and the two agents with each other. If an agent cannot show you a Form A for the property, they are not instructed to sell it.",
      "Read the completion date clause carefully. It is the clause that decides what happens when the seller's bank is slow, and it is the clause most often left at a default that suits neither party.",
    ],
    signs: "Buyer, seller, and both agents",
    cost: "No fee for the form itself",
    timing: "Same day, once terms are agreed",
    stalls:
      "Sellers who have not asked their bank for a settlement figure. If the mortgage outstanding is higher than they think, the sale can be underwater at the agreed price and everything stops.",
  },
  {
    n: 2,
    id: "deposit",
    title: "Place the 10% deposit",
    summary:
      "A security cheque, not a payment. Who holds it matters more than most buyers realise.",
    detail: [
      "The buyer provides a manager's cheque for 10% of the price. It is security against the buyer walking away, not an instalment, and it should not reach the seller's account before transfer.",
      "Convention is that the seller's agent holds it. Establish in writing what triggers its release and what triggers its return, because Form F alone does not always spell this out.",
      "If either side defaults, the deposit is the agreed remedy. That cuts both ways: it is also roughly what you can expect if the seller changes their mind.",
    ],
    signs: "Buyer issues; seller's agent holds",
    cost: "10% of the price, held rather than spent",
    timing: "At or immediately after Form F",
    stalls:
      "Ambiguity about who holds the cheque and on what condition it is released. Settle this before handing it over, not after.",
  },
  {
    n: 3,
    id: "mortgage",
    title: "Mortgage pre-approval, then valuation",
    summary:
      "Pre-approval comes before Form F. The valuation that follows is where deals most often collapse.",
    detail: [
      "Get pre-approval before you sign anything. It tells you your real budget and it makes your offer credible.",
      "Once you are under contract, the bank instructs its own valuation. The bank lends against that valuation, not against the price you agreed.",
      "If the valuation lands below the agreed price, the shortfall is yours to fund in cash on top of your deposit. On a property agreed at AED 3,000,000 valued at AED 2,850,000, you find the AED 150,000 difference yourself, or you renegotiate, or you walk.",
      "Loan-to-value caps differ for residents and non-residents, and by whether it is your first purchase. Confirm your specific cap with the lender rather than relying on a published figure.",
    ],
    signs: "Buyer and lender",
    cost: "Valuation typically AED 2,500–3,500; arrangement fee around 1% of the loan",
    timing: "Pre-approval 3–7 days; valuation 3–5 days after instruction",
    stalls:
      "The valuation shortfall. It is the single most common reason a Dubai transaction falls apart, and it surfaces only after you are committed.",
  },
  {
    n: 4,
    id: "settlement",
    title: "The seller clears their mortgage",
    summary:
      "The longest and least predictable stage. Bank timelines are outside everyone's control.",
    detail: [
      "A property cannot transfer with a charge on it. If the seller has a mortgage, it must be settled and the bank must release the title deed first.",
      "In practice the buyer often funds the settlement directly to the seller's bank before transfer, against a liability letter stating the exact figure and its expiry date. That letter is time-limited, which is why delays here cascade.",
      "Where the buyer is also financing, the two banks have to coordinate. Build slack into the Form F completion date for this.",
    ],
    signs: "Seller and their bank; buyer funds the settlement",
    cost: "Early-settlement charge, typically capped at 1% of the outstanding balance",
    timing: "5–10 working days, sometimes longer",
    stalls:
      "Bank processing times, and liability letters that expire before the transfer is booked. Neither agent can accelerate a bank.",
  },
  {
    n: 5,
    id: "noc",
    title: "Obtain the developer's NOC",
    summary:
      "The developer confirms service charges are clear. Arrears become visible here and nowhere earlier.",
    detail: [
      "The No Objection Certificate is the developer's confirmation that nothing is outstanding on the unit and that they do not object to the transfer.",
      "The application usually needs the title deed, both parties' identification, Form F and the settlement of any service charge arrears.",
      "Service charges are billed per square foot and vary widely between buildings. Ask for the current rate and the last two years of statements before you reach this stage. Not because the NOC will fail, but because the ongoing cost is a real part of what you are buying.",
    ],
    signs: "Seller applies; developer issues",
    cost: "AED 500–5,000 depending on the developer",
    timing: "3–10 working days",
    stalls:
      "Unpaid service charges. They must be cleared before the NOC is issued, and the amount is often larger than the seller has admitted.",
  },
  {
    n: 6,
    id: "transfer",
    title: "Transfer at the DLD trustee office",
    summary:
      "Both parties attend in person or by power of attorney. About an hour, if the paperwork is right.",
    detail: [
      "Transfer happens at a Dubai Land Department registration trustee office, which is a private office licensed to process registrations on DLD's behalf rather than a government counter.",
      "The buyer brings manager's cheques for the balance, made out as the trustee directs. The DLD transfer fee and trustee fee are paid here.",
      "You do not need to be in the country. A properly notarised and attested power of attorney lets a representative sign for you, but it must be drafted for this purpose specifically. A general POA is often rejected.",
    ],
    signs: "Buyer and seller, in person or by POA",
    cost: "4% DLD transfer fee, plus trustee fee of roughly AED 4,000 including VAT",
    timing: "One appointment, about an hour",
    stalls:
      "Cheques drawn incorrectly, an expired liability letter, or a POA that does not specifically authorise property transfer.",
  },
  {
    n: 7,
    id: "title-deed",
    title: "Title deed issued",
    summary: "Issued electronically, usually the same day. You are the registered owner.",
    detail: [
      "The title deed is issued in your name, normally within hours of the transfer appointment. It is a digital record, so there is no paper certificate to safeguard.",
      "Handover of keys and access is arranged separately with the seller or the building management. Register for the utilities and, if you intend to let the property, for Ejari.",
      "Keep the title deed, the Form F and the transfer receipt together. You will need them for a future sale, for a mortgage, and for a Golden Visa application if the value qualifies.",
    ],
    signs: "Issued by DLD to the buyer",
    cost: "Title deed issuance AED 580 for apartments and offices",
    timing: "Same day in most cases",
    stalls:
      "Rarely anything. If the transfer completed, this is administrative.",
  },
];

export interface CostRow {
  readonly item: string;
  readonly amount: string;
  readonly payer: string;
  readonly note?: string;
}

export const COSTS: readonly CostRow[] = [
  {
    item: "DLD transfer fee",
    amount: "4% of the price",
    payer: "Buyer",
    note: "Nominally split 2% each, but market practice is that the buyer pays all of it.",
  },
  {
    item: "Registration trustee fee",
    amount: "≈ AED 4,000 + 5% VAT",
    payer: "Buyer",
    note: "Lower for properties under AED 500,000.",
  },
  {
    item: "Title deed issuance",
    amount: "AED 580",
    payer: "Buyer",
    note: "Apartments and offices. AED 430 for land; AED 40 for an off-plan Oqood registration.",
  },
  {
    item: "Agency commission",
    amount: "2% + 5% VAT",
    payer: "Buyer",
    note: "Customary rather than fixed. It is negotiable.",
  },
  {
    item: "Developer NOC",
    amount: "AED 500–5,000",
    payer: "Seller",
    note: "Varies by developer. Who pays is negotiable and should be written into Form F.",
  },
  {
    item: "Mortgage registration",
    amount: "0.25% of the loan + AED 290",
    payer: "Buyer",
    note: "Only if you are financing.",
  },
  {
    item: "Bank valuation",
    amount: "AED 2,500–3,500",
    payer: "Buyer",
    note: "Only if you are financing.",
  },
];

export interface Faq {
  readonly q: string;
  readonly a: string;
}

export const FAQS: readonly Faq[] = [
  {
    q: "Can foreign nationals buy property in Dubai?",
    a: "Yes. Foreign nationals can own freehold property in designated freehold areas, which cover most of the districts buyers are familiar with. Outside those areas ownership is leasehold or restricted, so the area determines what you can actually own.",
  },
  {
    q: "How long does a purchase take from agreement to title deed?",
    a: "A cash purchase with no seller mortgage typically completes in two to four weeks. Add a buyer mortgage and it is four to eight weeks. A seller mortgage that has to be settled is the main variable and can extend it further.",
  },
  {
    q: "Is there annual property tax in Dubai?",
    a: "There is no annual property tax. The significant one-off cost is the 4% DLD transfer fee at purchase. The significant ongoing cost is the building's service charge, billed per square foot and set per community, which varies far more than buyers expect.",
  },
  {
    q: "Do I need to be in Dubai to complete a purchase?",
    a: "No. A representative can act for you under a power of attorney, but it must be notarised, attested and drafted to authorise property transfer specifically. A general power of attorney is often rejected at the trustee office.",
  },
  {
    q: "Does buying property qualify me for a residence visa?",
    a: "Property at or above AED 2 million can qualify for the 10-year Golden Visa. Since February 2026 the previous requirement to have paid a minimum share of the price no longer applies to off-plan purchases, so the full contract value counts toward the threshold. Eligibility is assessed by the immigration authority, not by the seller or the agent.",
  },
  {
    q: "What is different about buying off-plan?",
    a: "You buy from the developer rather than an owner, payments follow a construction-linked schedule into a regulated escrow account, and your interest is recorded as an Oqood registration rather than a title deed until handover. There is no NOC stage and no seller mortgage to settle, so the process is shorter. But you carry delivery risk that a ready property does not have.",
  },
];

/** Every figure on this page traces back to here. */
export const SOURCE = {
  name: "Dubai Land Department published fee schedules",
  reviewed: "2026-09-03",
} as const;
