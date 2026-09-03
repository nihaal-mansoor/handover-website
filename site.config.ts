import { defineSiteConfig, DEFAULT_CONTACT } from "@uaeprop/site-kit";

export default defineSiteConfig({
  brand: "Handover",
  domain: "dubairealestateadvice.com",
  tagline: "An independent guide to buying property in Dubai.",
  topic: "the Dubai property buying process",
  contact: DEFAULT_CONTACT,
  analytics: {
    // Set per environment. Empty disables the tag entirely.
    ga4MeasurementId: "",
    clarityProjectId: "",
  },
  og: {
    image: "/og.png",
    imageAlt: "Handover, an independent guide to buying property in Dubai",
  },
  contentReviewedAt: "2026-09-03",
});
