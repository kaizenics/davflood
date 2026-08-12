/**
 * The questions people actually ask, answered once.
 *
 * These serve two readers at the same time, which is the whole design. A
 * Dabawenyo scanning the hazard page gets a direct answer without reading the
 * page around it; an assistant asked "how deep does it flood in Davao City"
 * gets a passage it can quote with attribution. Writing separate copy for the
 * second reader would be both worse writing and, by Google's own spam policy,
 * a liability — so there is one set of answers and both get it.
 *
 * Rules for anything added here:
 *
 *   ANSWER FIRST. The first sentence must stand alone if it is lifted out of
 *   the page entirely, because that is exactly what will happen to it.
 *
 *   40–60 WORDS. Long enough to be complete, short enough to be quoted whole
 *   rather than truncated mid-clause.
 *
 *   NO CLAIM THE APP CANNOT BACK. Every figure here traces to the UP NOAH
 *   bands, the city's published numbers, or the app's own behaviour. An
 *   answer that flatters the product is the kind that gets quoted back at you
 *   during a flood.
 */

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ: FaqItem[] = [
  {
    question: "How deep does flooding get in Davao City?",
    answer:
      "It depends on the place and the size of the storm. The UP NOAH model sorts ground into three bands: 0.1–0.5 metres (ankle to knee), 0.5–1.5 metres (waist to chest), and over 1.5 metres, which is above an adult's head. DavFlood shows which band any point in the city falls into.",
  },
  {
    question: "What does a 5-year, 25-year or 100-year flood mean?",
    answer:
      "It is the chance of that flood in any single year, not a schedule. A 5-year storm has a 20% chance each year, a 25-year storm 4%, and a 100-year storm 1%. Two 100-year floods can happen in consecutive years — the name describes probability, not spacing.",
  },
  {
    question: "How do I check whether my barangay floods?",
    answer:
      "Open the map and tap your street, or search your barangay by name. DavFlood gives the expected depth at that exact point for the storm size you choose, the ground elevation there, and the nearest public building the model does not flood in that scenario.",
  },
  {
    question: "Does DavFlood show flooding that is happening right now?",
    answer:
      "No. DavFlood is a hazard map, not a flood sensor. It shows modelled depth for a storm of a given severity, and it has no gauges, no cameras and no live measurements behind it. For current warnings, follow PAGASA and your barangay's disaster risk reduction office.",
  },
  {
    question: "What number do I call during a flood in Davao City?",
    answer:
      "Dial 911. Davao City's Central 911 answers 24 hours for fire, medical and rescue. The City Disaster Risk Reduction and Management Office, which runs preemptive evacuation, can be reached during office hours on (082) 295-2387, (082) 224-2535 or (082) 285-8984.",
  },
  {
    question: "Where are the evacuation centres in Davao City?",
    answer:
      "Davao City has not published a complete public directory. In an actual evacuation your barangay opens schools, covered courts and halls that appear on no public list, so the CDRRMO and your barangay hall are the ones to ask. DavFlood shows public buildings the model leaves dry, which is not the same thing.",
  },
  {
    question: "Where does DavFlood's flood data come from?",
    answer:
      "The hazard model is UP NOAH's — the University of the Philippines' Nationwide Operational Assessment of Hazards. Rainfall comes from Open-Meteo, river discharge from GloFAS, the basemap from OpenStreetMap, and elevation from AWS Open Data terrain tiles. DavFlood produces none of this data itself.",
  },
];

/**
 * schema.org FAQPage, built from the list above.
 *
 * Generated rather than hand-written so the markup cannot disagree with the
 * page — structured data that describes content a reader cannot see is a
 * manual-action risk, and two copies of the same answer is how that starts.
 */
export function faqJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
}
