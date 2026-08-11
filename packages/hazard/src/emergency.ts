/**
 * Who to actually call, and where the city says to go.
 *
 * This module exists because of the honest gap in ./evacuation.ts: the sites
 * it offers are OpenStreetMap buildings that the model does not flood, and it
 * says so — "NOT designated evacuation centres. That is the barangay's
 * decision and the DRRM office's list." A hazard map that can tell you the
 * water reaches your chest and cannot tell you the number to ring is a map
 * that stops one step short of being useful.
 *
 * Two rules govern everything in here, and neither is negotiable:
 *
 * 1. NOTHING IS INVENTED. Every number, address and centre below is
 *    transcribed from a page published by the City Government of Davao, and
 *    carries the URL it came from and the date it was checked. A wrong
 *    emergency number at 2am is worse than no number at all, so an entry that
 *    cannot be sourced does not get added — it gets left out and the gap gets
 *    stated in the UI.
 *
 * 2. THE LIST IS NOT CLAIMED TO BE COMPLETE. The city has not published a
 *    machine-readable directory of barangay evacuation centres; what exists
 *    is held by each barangay and by the CDRRMO. So this ships what is
 *    published, names what is missing, and points at the office that holds
 *    the rest. See INCOMPLETE_LIST_NOTE.
 *
 * Build-time data, like ./evacuation-data.ts: no runtime cost, works in the
 * offline pack, and available when the network is not — which is the whole
 * point of a page like this.
 */

/** When a human last opened the source pages and compared them, line by line. */
export const VERIFIED_ON = "2026-08-11";

export type EmergencyNumber = {
  /** "Emergency", "Landline", "Fax" — what this particular line is for */
  label: string;
  /** as printed by the source, in the local convention */
  display: string;
  /** what a `tel:` link dials — E.164, except the short code */
  dial: string;
  /** short codes and 24-hour lines are the ones to show first and biggest */
  kind: "emergency" | "office" | "fax";
};

export type EmergencyContact = {
  id: string;
  name: string;
  /** what this office does, in the app's voice */
  role: string;
  numbers: EmergencyNumber[];
  emails: string[];
  address: string | null;
  /** "24 hours" or the published office hours — the difference matters at 2am */
  hours: string;
  /** the page this was transcribed from */
  source: string;
};

/**
 * Ordered by who to ring first in an emergency, not alphabetically.
 *
 * Central 911 is first and stays first: it is the number that answers at
 * 3am, and the one a person in water should be dialling rather than reading
 * a directory.
 */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "central-911",
    name: "Central 911",
    role: "Davao City's emergency response centre — fire, medical, rescue. The number to call while it is happening.",
    numbers: [
      {
        label: "Emergency",
        display: "911",
        dial: "911",
        kind: "emergency",
      },
      {
        label: "Landline",
        display: "(082) 296-1433",
        dial: "+63822961433",
        kind: "office",
      },
      {
        label: "Landline",
        display: "(082) 296-9626",
        dial: "+63822969626",
        kind: "office",
      },
      {
        label: "Fax",
        display: "(082) 296-0443",
        dial: "+63822960443",
        kind: "fax",
      },
    ],
    emails: ["911@davaocity.gov.ph"],
    address: "911 Building, Daang Patnubay St., SIR Matina, Davao City",
    hours: "24 hours",
    source: "https://davaocity.gov.ph/departments/social-services/central-911/",
  },
  {
    id: "cdrrmo",
    name: "City Disaster Risk Reduction and Management Office",
    role: "The office that runs preemptive evacuation and holds the official list of evacuation centres for every barangay.",
    numbers: [
      {
        label: "Landline",
        display: "(082) 295-2387",
        dial: "+63822952387",
        kind: "office",
      },
      {
        label: "Landline",
        display: "(082) 224-2535",
        dial: "+63822242535",
        kind: "office",
      },
      {
        label: "Landline",
        display: "(082) 285-8984",
        dial: "+63822858984",
        kind: "office",
      },
    ],
    emails: ["cdrrmo@davaocity.gov.ph", "drrmodvocity@ymail.com"],
    address:
      "Central 911 Compound, Daang Patnubay, Sandawa, Matina, Davao City",
    hours: "8:00 AM – 5:00 PM",
    source:
      "https://davaocity.gov.ph/departments/social-services/cmo-disaster-council/",
  },
];

/**
 * A permanent evacuation centre the city built and announced.
 *
 * Deliberately WITHOUT coordinates. The published announcements give a purok
 * and a barangay, not a point, and a pin dropped at a guessed location on a
 * safety map is a lie told precisely — worse than an address a person can
 * read out to a driver. If the city publishes coordinates, add them then.
 */
export type OfficialCentre = {
  name: string;
  barangay: string;
  district: string;
  /** persons, as announced */
  capacity: number | null;
  /** the districts or barangays it was built to serve */
  serves: string[];
  source: string;
  /** when the source announced it — these are years-old announcements */
  announced: string;
};

export const OFFICIAL_CENTRES: OfficialCentre[] = [
  {
    name: "Davao City Evacuation Center (2nd District)",
    barangay: "Barangay Mahayag, Purok 9",
    district: "Bunawan District",
    capacity: 300,
    serves: [
      "Paquibato District",
      "Bunawan District",
      "Buhangin District A",
      "Buhangin District B",
    ],
    source:
      "https://www.davaocity.gov.ph/disaster-risk-reduction-mitigation/davao-city-opens-evacuation-center-for-2nd-district/",
    announced: "2022-02-04",
  },
];

/**
 * The sentence that has to appear anywhere OFFICIAL_CENTRES is shown.
 *
 * Not a disclaimer bolted on — the honest description of what this list is.
 * One purpose-built centre is what the city has publicly announced as data;
 * in an actual evacuation the barangay opens schools and covered courts that
 * appear on no published list at all.
 */
export const INCOMPLETE_LIST_NOTE =
  "Davao City has not published a complete directory of evacuation centres. In a real evacuation your barangay opens schools, covered courts and halls that appear on no public list — the CDRRMO and your barangay hall hold that list, and they are the ones to ask.";

/** `tel:` target. Short codes are dialled as-is; everything else is E.164. */
export function telHref(number: EmergencyNumber): string {
  return `tel:${number.dial}`;
}

/** vCard escaping: backslash, comma, semicolon, and literal newlines. */
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * The numbers as a contact card, for the phone's own address book.
 *
 * The most robust version of this page is the one that is not this page.
 * An installed PWA still needs a browser, a working screen and enough battery
 * to render a map; a contact in the address book needs none of that, survives
 * the app being deleted, and can be found by a neighbour who picked up your
 * phone. It is also the only form of this data that works on the handset of
 * someone who has never heard of DavFlood.
 *
 * vCard 3.0 rather than 4.0: it is what Android and iOS both import without
 * argument, which is the only compatibility question that matters here.
 * CRLF line endings are required by the spec — some parsers are forgiving,
 * and the ones that are not fail silently, which is the worst outcome.
 */
export function emergencyVcard(): string {
  const cards = EMERGENCY_CONTACTS.map((contact) => {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${esc(contact.name)};;;;`,
      `FN:${esc(contact.name)}`,
      "ORG:City Government of Davao",
    ];

    for (const number of contact.numbers) {
      // fax is in the source data for completeness; nobody dials it in a flood
      if (number.kind === "fax") continue;
      const type = number.kind === "emergency" ? "MAIN" : "WORK";
      lines.push(`TEL;TYPE=${type},VOICE:${esc(number.dial)}`);
    }

    for (const email of contact.emails) {
      lines.push(`EMAIL;TYPE=WORK:${esc(email)}`);
    }

    if (contact.address) {
      lines.push(`ADR;TYPE=WORK:;;${esc(contact.address)};;;;`);
    }

    /* The note carries the provenance with the contact. A number sitting in
       someone's phone for two years with no idea where it came from is a
       number nobody can check when it stops working. */
    lines.push(
      `NOTE:${esc(
        `${contact.role} ${contact.hours}. From ${contact.source}, checked ${VERIFIED_ON}. Saved from DavFlood.`,
      )}`,
    );
    lines.push("END:VCARD");

    return lines.join("\r\n");
  });

  return `${cards.join("\r\n")}\r\n`;
}

export const VCARD_FILENAME = "davao-emergency-numbers.vcf";
