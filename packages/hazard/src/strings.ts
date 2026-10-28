import type { HazardId } from "./tiers";
import type { Locale } from "./locale";

/**
 * The safety-critical copy, in every language this app speaks.
 *
 * The safety-critical copy came first, deliberately: the sentence that says
 * "water goes over an adult's head" was worth translating before the word
 * "Barangays". `ui` now carries the navigation, the map panel and the Reports
 * page; the map controls, legends and the long-form pages (Barangays, Hazard
 * levels, The data) are still English.
 *
 * English is the source and the type. Every other locale must satisfy the
 * same shape, so a missing string is a compile error rather than a blank
 * space on a hazard map.
 *
 * The Bisaya and Tagalog entries are DRAFTS — see locale.ts. They were not
 * written by native speakers, the UI says so, and English is always one tap
 * away. If you speak Bisaya, the most valuable contribution you can make to
 * this project is to correct this file.
 */

const EN = {
  disclaimer: {
    short: "This is a hazard map, not a flood sensor.",
    long: "DavFlood shows modelled flood hazard — how deep water is expected to get in a given area during a storm of a given severity. It does not show water on the ground right now. For live warnings, follow PAGASA and your barangay's disaster risk reduction office.",
    pill: "Modelled hazard · not live conditions",
    independence:
      "DavFlood is an independent project. It is not affiliated with, endorsed by, or operated on behalf of the City Government of Davao, PAGASA, the OCD, or the University of the Philippines. It uses their published data under the terms those bodies made it available.",
  },

  /** The three depth bands. The most important strings in the app. */
  tiers: {
    low: {
      name: "Shallow flooding",
      summary: "Ankle to knee deep.",
      human:
        "Water reaches your ankles or knees. Streets become impassable to motorcycles and small cars. Anything stored on the floor gets wet.",
      action:
        "Move belongings off the floor. Avoid driving through it — half a metre of moving water can float a small car.",
    },
    medium: {
      name: "Moderate flooding",
      summary: "Waist to chest deep.",
      human:
        "Water reaches your waist or chest. A single-storey house takes water throughout. Electrical outlets are submerged. Wading becomes dangerous once it moves.",
      action:
        "Evacuate early, before the water reaches this depth. Cut power at the breaker if it is safe to do so.",
    },
    high: {
      name: "Deep flooding",
      summary: "Above head height.",
      human:
        "Water goes over an adult's head. Single-storey homes are fully submerged. This depth is life-threatening regardless of how well you swim, because of current and debris.",
      action:
        "Do not wait. Evacuate as soon as a storm is forecast — not when the water arrives.",
    },
  },

  /**
   * The joined rain/river/hazard line. Whole clauses rather than words,
   * because word-by-word substitution produces grammatical nonsense in
   * languages whose sentences are not shaped like English ones.
   */
  /**
   * EVERY CLAUSE HERE STARTS LOWERCASE, including the ones that usually open
   * the sentence. floodOutlook capitalises whichever clause ends up first,
   * and which one that is now depends on the weather — `soak` goes in front
   * of the rain when three days of it have already fallen. Pre-capitalised
   * clauses produced "…, and Heavy rain forecast today" the first time that
   * happened. Lowercase here, capitalised once at the join, is the only
   * arrangement that reads correctly in every order.
   */
  outlook: {
    heavyToday: "heavy rain forecast today — {mm} mm",
    heavyTomorrow: "heavy rain forecast tomorrow — {mm} mm",
    rainToday: "rain forecast today — {mm} mm",
    rainTomorrow: "rain forecast tomorrow — {mm} mm",
    riverHigh: "the Davao River is forecast to run high",
    riverAbove: "the Davao River is forecast to run above normal",
    /**
     * Rain that has already fallen. Past tense and a bare quantity on
     * purpose: it says what came down and leaves what that means about the
     * ground to the reader, because the ground is not something this app can
     * see. See soakClause in ../outlook.ts.
     */
    soak: "{mm} mm has already fallen over the last {days} days",
    /** joins the last clause to the rest */
    and: ", and ",
    /** separates the earlier clauses when there are three of them */
    listSep: ", ",
    /** joins the weather to the place — never a causal word */
    zone: ", while the {years}-year model puts {where} at {depth} ({summary}).",
    city:
      ", while the {years}-year model floods about {km2} km² of the city.",
    tapped: "the spot you tapped",
    caveat:
      "Forecast rainfall and modelled hazard — not a measurement of water on the ground. For live warnings follow PAGASA and your barangay.",
  },

  emergency: {
    kicker: "Emergency",
    title: "Who to call in Davao City",
    intro:
      "If water is rising where you are, stop reading and dial 911. The rest of this page is for before and after.",
    dialBlurb: "Central 911 — fire, medical, rescue. Answers 24 hours.",
    offices: "Offices",
    centres: "Evacuation centres",
    serves: "Built to serve {list}.",
    persons: "persons",
    announced: "Announced {date}",
    publishedBy: "Published by the City Government of Davao",
    incompleteList:
      "Davao City has not published a complete directory of evacuation centres. In a real evacuation your barangay opens schools, covered courts and halls that appear on no public list — the CDRRMO and your barangay hall hold that list, and they are the ones to ask.",
    sourceNote:
      "Every number and address on this page was transcribed from a page published by the City Government of Davao and last checked on {date}. Nothing here is supplied by DavFlood — if a number has changed, the city's own page is right and this one is wrong.",
    roles: {
      "central-911":
        "Davao City's emergency response centre — fire, medical, rescue. The number to call while it is happening.",
      cdrrmo:
        "The office that runs preemptive evacuation and holds the official list of evacuation centres for every barangay.",
    },
  },

  elevation: {
    label: "About {m} m above sea level",
    seaLevel: "At or below sea level",
    /** why the number may disagree with what you know about your own street */
    note: "From the elevation model the 3D view is drawn from. It reads the block, not your doorstep — a raised lot or a high floor is not in it.",
  },

  place: {
    title: "Your place",
    save: "Save this place",
    saved: "Saved",
    forget: "Forget",
    show: "Show on map",
    nameIt: "What do you call this place?",
    namePlaceholder: "Home",
    /** when the scenario floods it */
    inFootprint: "In a {years}-year storm, the model puts your place at {depth}.",
    /** when it does not — the sentence most people are hoping for */
    dry: "The {years}-year model does not flood your place. That is the model, not a promise: it says nothing about the road you would leave by.",
    privacy: "Kept on this device only. DavFlood has no accounts and no server to send it to.",
  },

  vcard: {
    save: "Save these numbers to your phone",
    blurb:
      "Adds Central 911 and the CDRRMO to your contacts. They stay there with no app, no signal and no battery spent opening this page.",
  },

  ui: {
    navMap: "Map",
    navBarangays: "Barangays",
    navReports: "Reports",
    navHazard: "Hazard",
    navHazardLong: "Hazard levels",
    navData: "Data",
    navDataLong: "The data",
    emergencyHotlines: "Emergency hotlines",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    whatsNew: "What’s new",
    sourceOnGithub: "Source on GitHub",
    language: "Language",
    toLightTheme: "Switch to light theme",
    toDarkTheme: "Switch to dark theme",
    rightNow: "Right now",
    liveForecasts: "Live forecasts",
    floodMap: "Flood map",
    modelledNotLive: "Modelled, not live",
    rain: "Rain",
    checking: "Checking…",
    unavailable: "Unavailable — map still works",
    mmToday: "mm today",
    rainChance: "{n}% chance of rain",
    timesUsual: "{n}× the usual flow",
    bandLight: "Light",
    bandModerate: "Moderate",
    bandHeavy: "Heavy",
    weatherClear: "Clear",
    weatherPartlyCloudy: "Partly cloudy",
    weatherFog: "Fog",
    weatherDrizzle: "Drizzle",
    weatherRain: "Rain",
    weatherShowers: "Showers",
    weatherHeavyShowers: "Heavy showers",
    weatherSqualls: "Squalls",
    weatherThunderstorm: "Thunderstorm",
    lastDays: "Last {n} days",
    alreadyFallen: "{mm} mm already fallen",
    soakNote: "Rain forecast below lands on ground that has already taken this much.",
    next4Days: "Next 4 days",
    mmTotal: "{mm} mm total",
    wettest: "wettest {day}",
    today: "Today",
    todayLower: "today",
    dryHint: "No meaningful rain in the next four days — select a day for the hours",
    selectDay: "Select a day for its hour-by-hour forecast",
    rainContext: "Rain is context, not a flood warning — follow PAGASA for advisories.",
    dayAria: "{day}: {mm} mm, {p} percent chance. Open hourly detail.",
    riverName: "Davao River",
    riverLowLabel: "Low",
    riverLowBlurb: "Running below its usual level for the year.",
    riverNormalLabel: "Normal",
    riverNormalBlurb: "Running about as it usually does.",
    riverElevatedLabel: "Elevated",
    riverElevatedBlurb: "Higher than nine days in ten. Worth watching if rain continues.",
    riverHighLabel: "High",
    riverHighBlurb: "In the top 5% of the last five years.",
    riverVeryHighLabel: "Very high",
    riverVeryHighBlurb: "In the top 1% of the last five years.",
    riverPeak: "Forecast to peak around {q} m³/s on {day}.",
    trendTitle: "Recent flow and outlook",
    channelTitle: "How full the river is",
    riverView: "River view",
    viewChart: "Chart",
    viewRiver: "River",
    recent: "Recent",
    forecast: "Forecast",
    forecastLower: "forecast",
    riverNote: "Modelled flow upstream of the city. Dashed line: elevated above {p90} m³/s, from its {from}–{to} range. It shows how hard the river is running, not that anywhere is flooded.",
    channelUsual: "usual",
    channelElevated: "elevated",
    channelHigh: "5-yr high",
    day: "Day",
    channelAria: "Cross-section of the Davao River, {when}: {q} cubic metres per second, {pct} percent of the way to its five-year high.",
    stormYr: "{n}-yr storm",
    perYear: "{p} a year",
    scenarioGroup: "Flood scenario",
    scenarioAria: "{n}-year flood scenario",
    yearStorm: "{n}-year storm",
    chanceAYear: "{p} chance a year",
    cityFloods: "of Davao City floods",
    measuring: "Measuring the {n}-year footprint…",
    overlayOff: "The overlay is switched off — the map is showing the basemap only.",
    cityAria: "Flooded area in this scenario",
    tapHint: "Tap a coloured zone for the expected depth at that spot.",
    findBarangay: "Find your barangay",
    findBarangaySub: "Search all {n} and fly straight to it",
    handleFloods: "About {km} km² floods · {storm}",
    expandPanel: "Expand the panel",
    collapsePanel: "Collapse the panel",
    savedOffline: "Saved for offline",
    useWithoutSignal: "Use without a signal",
    savingPct: "Saving… {pct}%",
    opensNoConnection: "The map opens with no connection",
    packSize: "Davao City and all three scenarios · ~{mb} MB",
    save: "Save",
    remove: "Remove",
    tilesFailed: "{failed} of {total} tiles did not save. Those areas fall back to the network, so the rest of the map still works without one.",
    offlineNote: "Saves the hazard map itself. Rain, the river and the news still need a connection — they describe right now, and a stored copy of “right now” would be worse than nothing.",
    inTheNews: "In the news",
    showAllReports: "Show all {n} reports",
    newsNote: "Reported by others, not verified by DavFlood. Headlines and pictures are shown as published.",
    reportsTitle: "Flood reports",
    reportsIntro: "What the news has carried about flooding in Davao City over the last two months, newest first. Reported by others — not verified by DavFlood, and not a statement about conditions right now.",
    loadingReports: "Loading reports",
    noReports: "No reports on record.",
    noReportsBody: "Nothing has been published in the window we keep, or the feed has not run yet. The hazard map does not depend on this.",
    reportsFooter: "{n} reports, refreshed automatically. Headlines and pictures are shown as published, and link back to the publisher. Reports older than two months are dropped.",
    onTheMap: "{name} on the map",
  },

  locale: {
    /** shown wherever draft copy is displayed */
    draftNotice:
      "This translation is a draft — not yet checked by a native speaker. Where the wording matters, read it in English.",
    draftBadge: "Draft translation",
    readInEnglish: "Read in English",
    switchTo: "Switch to {language}",
  },
} as const;

/** English is the shape every other language must fill. */
export type Strings = {
  disclaimer: Record<keyof (typeof EN)["disclaimer"], string>;
  tiers: Record<HazardId, Record<keyof (typeof EN)["tiers"]["low"], string>>;
  outlook: Record<keyof (typeof EN)["outlook"], string>;
  emergency: Omit<Record<keyof (typeof EN)["emergency"], string>, "roles"> & {
    roles: Record<keyof (typeof EN)["emergency"]["roles"], string>;
  };
  elevation: Record<keyof (typeof EN)["elevation"], string>;
  place: Record<keyof (typeof EN)["place"], string>;
  vcard: Record<keyof (typeof EN)["vcard"], string>;
  locale: Record<keyof (typeof EN)["locale"], string>;
  ui: Record<keyof (typeof EN)["ui"], string>;
};

/**
 * Cebuano / Bisaya — DRAFT.
 *
 * Written with care but not by a native speaker. The depth bands were kept
 * concrete on purpose ("abot sa tuhod", "labaw sa ulo") because a person
 * reading this while it rains needs a picture, not a measurement.
 */
const CEB: Strings = {
  disclaimer: {
    short: "Mapa kini sa peligro sa baha, dili sensor sa tubig.",
    long: "Gipakita sa DavFlood ang gimodelo nga peligro sa baha — kung unsa ka lawom ang tubig nga gidahom sa usa ka dapit panahon sa bagyo nga adunay maong kakusog. Wala kini nagpakita sa tubig nga naa sa yuta karon. Para sa live nga pasidaan, sunda ang PAGASA ug ang disaster risk reduction office sa inyong barangay.",
    pill: "Gimodelo nga peligro · dili live nga kahimtang",
    independence:
      "Ang DavFlood usa ka independente nga proyekto. Wala kini kalambigitan sa, wala gi-endorso sa, ug wala gipadagan alang sa Panlungsod nga Gobyerno sa Davao, PAGASA, OCD, o sa Unibersidad sa Pilipinas. Gigamit lamang niini ang ilang gipatik nga datos sumala sa mga termino nga ilang gihatag.",
  },
  tiers: {
    low: {
      name: "Mabaw nga baha",
      summary: "Abot sa buolbuol hangtod tuhod.",
      human:
        "Ang tubig moabot sa imong buolbuol o tuhod. Dili na maagian sa motor ug gagmay nga sakyanan ang mga dalan. Mabasa ang tanan nga gibutang sa salog.",
      action:
        "Ipataas ang mga butang gikan sa salog. Ayaw pag-agi niini sakay sa sakyanan — ang tunga sa metro nga nagdagayday nga tubig makapalutaw sa gamay nga awto.",
    },
    medium: {
      name: "Kasarangan nga baha",
      summary: "Abot sa hawak hangtod dughan.",
      human:
        "Ang tubig moabot sa imong hawak o dughan. Malunopan ang tibuok usa ka andana nga balay. Malunod ang mga saksakan sa kuryente. Delikado na ang paglakaw niini kung nagdagayday na ang tubig.",
      action:
        "Bakwit og sayo, sa dili pa moabot ang tubig niini nga giladmon. Palunga ang kuryente sa breaker kung luwas kini buhaton.",
    },
    high: {
      name: "Lawom nga baha",
      summary: "Labaw sa gitas-on sa ulo.",
      human:
        "Ang tubig molapaw sa ulo sa usa ka hamtong. Malunod sa hingpit ang mga usa ka andana nga balay. Makamatay kini nga giladmon bisan kung maayo ka molangoy, tungod sa kusog sa sulog ug sa mga anod.",
      action:
        "Ayaw paghulat. Bakwit dayon inig forecast pa lang sa bagyo — dili inig abot na sa tubig.",
    },
  },
  outlook: {
    heavyToday: "kusog nga ulan ang forecast karong adlawa — {mm} mm",
    heavyTomorrow: "kusog nga ulan ang forecast ugma — {mm} mm",
    rainToday: "adunay ulan nga forecast karong adlawa — {mm} mm",
    rainTomorrow: "adunay ulan nga forecast ugma — {mm} mm",
    riverHigh: "gidahom nga motaas ang Davao River",
    riverAbove: "gidahom nga labaw sa normal ang Davao River",
    soak: "{mm} mm na ang nahulog sulod sa milabay nga {days} ka adlaw",
    and: ", ug ",
    listSep: ", ",
    zone: ", samtang ang {years}-ka-tuig nga modelo nagbutang sa {where} sa {depth} ({summary}).",
    city:
      ", samtang ang {years}-ka-tuig nga modelo naglunop og mga {km2} km² sa siyudad.",
    tapped: "ang dapit nga imong gi-tap",
    caveat:
      "Forecast nga ulan ug gimodelo nga peligro — dili kini sukod sa tubig nga naa sa yuta karon. Para sa live nga pasidaan, sunda ang PAGASA ug ang inyong barangay.",
  },
  emergency: {
    kicker: "Emerhensya",
    title: "Kinsa ang tawagan sa Davao City",
    intro:
      "Kung nagsaka na ang tubig kung asa ka, hunong sa pagbasa ug i-dial ang 911. Ang uban niini nga panid para sa dili pa ug human na.",
    dialBlurb: "Central 911 — sunog, medikal, rescue. Motubag 24 ka oras.",
    offices: "Mga opisina",
    centres: "Mga evacuation center",
    serves: "Gitukod para sa {list}.",
    persons: "ka tawo",
    announced: "Gipahibalo {date}",
    publishedBy: "Gipatik sa Panlungsod nga Gobyerno sa Davao",
    incompleteList:
      "Wala pa gipatik sa Davao City ang kompleto nga listahan sa mga evacuation center. Sa tinuod nga bakwit, ang inyong barangay magbukas og mga eskwelahan, covered court ug hall nga wala sa bisan unsang publiko nga listahan — ang CDRRMO ug ang inyong barangay hall ang naghupot niana nga listahan, ug sila ang pangutan-on.",
    sourceNote:
      "Ang matag numero ug adres niini nga panid gikuha gikan sa panid nga gipatik sa Panlungsod nga Gobyerno sa Davao ug kataposang gisusi niadtong {date}. Walay bisan unsa dinhi nga gikan sa DavFlood — kung nausab ang usa ka numero, ang panid sa siyudad ang husto ug kini ang sayop.",
    roles: {
      "central-911":
        "Ang emergency response center sa Davao City — sunog, medikal, rescue. Kini ang tawagan samtang nahitabo pa.",
      cdrrmo:
        "Ang opisina nga nagdumala sa preemptive evacuation ug naghupot sa opisyal nga listahan sa mga evacuation center sa matag barangay.",
    },
  },
  elevation: {
    label: "Mga {m} ka metro ibabaw sa lebel sa dagat",
    seaLevel: "Sama o ubos sa lebel sa dagat",
    note: "Gikan sa elevation model nga gigamit sa 3D nga panglantaw. Gibasa niini ang tibuok bloke, dili ang imong pultahan — ang gitaas nga lote o taas nga andana wala apil niini.",
  },

  place: {
    title: "Ang imong dapit",
    save: "I-save kini nga dapit",
    saved: "Na-save",
    forget: "Kalimti",
    show: "Ipakita sa mapa",
    nameIt: "Unsay tawag nimo niini nga dapit?",
    namePlaceholder: "Balay",
    inFootprint: "Sa {years}-ka-tuig nga bagyo, ang modelo nagbutang sa imong dapit sa {depth}.",
    dry: "Ang {years}-ka-tuig nga modelo wala naglunop sa imong dapit. Modelo kini, dili saad: wala kini nag-ingon bahin sa dalan nga imong agian pagbiya.",
    privacy: "Gitipigan lamang niini nga device. Ang DavFlood walay account ug walay server nga padad-an niini.",
  },

  vcard: {
    save: "I-save kini nga mga numero sa imong telepono",
    blurb:
      "Idugang ang Central 911 ug ang CDRRMO sa imong mga kontak. Magpabilin sila didto bisan walay app, walay signal ug walay bateryang magasto sa pag-abli niini nga panid.",
  },

  ui: {
    navMap: "Mapa",
    navBarangays: "Mga Barangay",
    navReports: "Mga Report",
    navHazard: "Peligro",
    navHazardLong: "Lebel sa peligro",
    navData: "Datos",
    navDataLong: "Ang datos",
    emergencyHotlines: "Mga emergency hotline",
    openMenu: "Ablihi ang menu",
    closeMenu: "Sirad-i ang menu",
    whatsNew: "Unsay bag-o",
    sourceOnGithub: "Source sa GitHub",
    language: "Pinulongan",
    toLightTheme: "Ilisi sa hayag nga tema",
    toDarkTheme: "Ilisi sa ngitngit nga tema",
    rightNow: "Karon dayon",
    liveForecasts: "Live nga forecast",
    floodMap: "Mapa sa baha",
    modelledNotLive: "Modelo, dili live",
    rain: "Ulan",
    checking: "Gisusi…",
    unavailable: "Wala karon — molihok gihapon ang mapa",
    mmToday: "mm karong adlawa",
    rainChance: "{n}% tsansa sa ulan",
    timesUsual: "{n}× sa naandan nga agos",
    bandLight: "Gamay",
    bandModerate: "Kasarangan",
    bandHeavy: "Kusog",
    weatherClear: "Klaro",
    weatherPartlyCloudy: "Medyo dag-umon",
    weatherFog: "Gabon",
    weatherDrizzle: "Taligsik",
    weatherRain: "Ulan",
    weatherShowers: "Pag-ulan",
    weatherHeavyShowers: "Kusog nga ulan",
    weatherSqualls: "Unos",
    weatherThunderstorm: "Dalugdog ug kilat",
    lastDays: "Miaging {n} ka adlaw",
    alreadyFallen: "{mm} mm na ang ninaog",
    soakNote: "Ang ulan nga gitagna sa ubos motugpa sa yuta nga nakadawat na niining kadaghana.",
    next4Days: "Sunod nga 4 ka adlaw",
    mmTotal: "{mm} mm tanan",
    wettest: "pinakabasa: {day}",
    today: "Karon",
    todayLower: "karon",
    dryHint: "Walay igo nga ulan sa sunod nga upat ka adlaw — pilia ang adlaw para sa matag oras",
    selectDay: "Pilia ang adlaw para sa forecast matag oras",
    rainContext: "Konteksto ang ulan, dili pasidaan sa baha — sunda ang PAGASA para sa mga abiso.",
    dayAria: "{day}: {mm} mm, {p} porsyento nga tsansa. Ablihi ang matag oras.",
    riverName: "Suba sa Davao",
    riverLowLabel: "Ubos",
    riverLowBlurb: "Mas ubos sa naandan nga lebel karong tuiga.",
    riverNormalLabel: "Normal",
    riverNormalBlurb: "Sama ra sa naandan.",
    riverElevatedLabel: "Taas-taas",
    riverElevatedBlurb: "Mas taas kaysa siyam sa napulo ka adlaw. Bantayi kung magpadayon ang ulan.",
    riverHighLabel: "Taas",
    riverHighBlurb: "Sulod sa pinakataas nga 5% sa miaging lima ka tuig.",
    riverVeryHighLabel: "Taas kaayo",
    riverVeryHighBlurb: "Sulod sa pinakataas nga 1% sa miaging lima ka tuig.",
    riverPeak: "Gitagna nga mosaka hangtod {q} m³/s sa {day}.",
    trendTitle: "Bag-ong agos ug panan-aw",
    channelTitle: "Unsa ka puno ang suba",
    riverView: "Pagtan-aw sa suba",
    viewChart: "Tsart",
    viewRiver: "Suba",
    recent: "Bag-o",
    forecast: "Forecast",
    forecastLower: "forecast",
    riverNote: "Modelo sa agos sa ibabaw sa siyudad. Putol-putol nga linya: taas-taas lapas sa {p90} m³/s, gikan sa datos sa {from}–{to}. Gipakita niini kung unsa ka kusog ang suba, dili nga naay lugar nga gibahaan.",
    channelUsual: "naandan",
    channelElevated: "taas-taas",
    channelHigh: "taas sa 5 ka tuig",
    day: "Adlaw",
    channelAria: "Hulagway sa Suba sa Davao, {when}: {q} cubic metro matag segundo, {pct} porsyento paingon sa pinakataas sa lima ka tuig.",
    stormYr: "{n}-ka-tuig nga bagyo",
    perYear: "{p} matag tuig",
    scenarioGroup: "Senaryo sa baha",
    scenarioAria: "{n} ka tuig nga senaryo sa baha",
    yearStorm: "{n} ka tuig nga bagyo",
    chanceAYear: "{p} tsansa matag tuig",
    cityFloods: "sa Dakbayan sa Davao ang mabahaan",
    measuring: "Gisukod ang sakop sa {n} ka tuig…",
    overlayOff: "Gipalong ang overlay — ang base nga mapa ra ang makita.",
    cityAria: "Lugar nga mabahaan niini nga senaryo",
    tapHint: "I-tap ang may kolor nga sona para sa gilawmon nga gilauman diha.",
    findBarangay: "Pangitaa ang imong barangay",
    findBarangaySub: "Pangitaa sa tanang {n} ug adto dayon",
    handleFloods: "Mga {km} km² ang mabahaan · {storm}",
    expandPanel: "Ipadako ang panel",
    collapsePanel: "Gamyi ang panel",
    savedOffline: "Na-save para offline",
    useWithoutSignal: "Gamita bisan walay signal",
    savingPct: "Gi-save… {pct}%",
    opensNoConnection: "Maablihan ang mapa bisan walay koneksyon",
    packSize: "Dakbayan sa Davao ug tanang tulo ka senaryo · ~{mb} MB",
    save: "I-save",
    remove: "Tangtanga",
    tilesFailed: "{failed} sa {total} ka tile ang wala ma-save. Kana nga mga lugar mogamit sa network, busa molihok gihapon ang ubang bahin sa mapa bisan wala.",
    offlineNote: "Ang mapa sa peligro ra ang ma-save. Ang ulan, ang suba ug ang balita nagkinahanglan gihapon og koneksyon — naghulagway sila sa karon, ug ang daan nga kopya sa “karon” mas daotan pa kaysa wala.",
    inTheNews: "Sa balita",
    showAllReports: "Ipakita ang tanang {n} ka report",
    newsNote: "Gi-report sa uban, wala gisusi sa DavFlood. Gipakita ang mga ulohan ug hulagway sama sa pagkapatik.",
    reportsTitle: "Mga report sa baha",
    reportsIntro: "Unsay gibalita bahin sa baha sa Dakbayan sa Davao sulod sa miaging duha ka bulan, ang pinakabag-o una. Gi-report sa uban — wala gisusi sa DavFlood, ug dili pahayag bahin sa kahimtang karon.",
    loadingReports: "Gikarga ang mga report",
    noReports: "Walay report nga natala.",
    noReportsBody: "Walay napatik sulod sa panahon nga among gitipigan, o wala pa modagan ang feed. Dili kini gisaligan sa mapa sa peligro.",
    reportsFooter: "{n} ka report, awtomatikong gi-refresh. Gipakita ang mga ulohan ug hulagway sama sa pagkapatik, ug nag-link balik sa nagpatik. Ang mga report nga sobra duha ka bulan ang edad gitangtang.",
    onTheMap: "{name} sa mapa",
  },

  locale: {
    draftNotice:
      "Kini nga hubad usa ka draft — wala pa masusi sa usa ka tinuod nga mamumulong og Bisaya. Kung importante ang eksakto nga pulong, basaha kini sa English.",
    draftBadge: "Draft nga hubad",
    readInEnglish: "Basaha sa English",
    switchTo: "Ilisan sa {language}",
  },
};

/**
 * Tagalog / Filipino — DRAFT.
 *
 * Same caveat as the Bisaya above. Included because Davao is a city people
 * move to, and the second language in the room is not always the first.
 */
const FIL: Strings = {
  disclaimer: {
    short: "Ito ay mapa ng panganib sa baha, hindi sensor ng tubig.",
    long: "Ipinapakita ng DavFlood ang modelong panganib ng baha — kung gaano kalalim ang inaasahang tubig sa isang lugar sa panahon ng bagyong may ganitong lakas. Hindi nito ipinapakita ang tubig na nasa lupa ngayon. Para sa live na babala, sundan ang PAGASA at ang disaster risk reduction office ng inyong barangay.",
    pill: "Modelong panganib · hindi live na kalagayan",
    independence:
      "Ang DavFlood ay isang independiyenteng proyekto. Hindi ito kaugnay ng, hindi ineendorso ng, at hindi pinapatakbo para sa Pamahalaang Lungsod ng Davao, PAGASA, OCD, o Unibersidad ng Pilipinas. Ginagamit lamang nito ang kanilang inilathalang datos ayon sa mga tuntuning ibinigay nila.",
  },
  tiers: {
    low: {
      name: "Mababaw na baha",
      summary: "Abot bukung-bukong hanggang tuhod.",
      human:
        "Aabot ang tubig sa iyong bukung-bukong o tuhod. Hindi na madaanan ng motorsiklo at maliliit na sasakyan ang mga kalsada. Mababasa ang lahat ng nakalagay sa sahig.",
      action:
        "Iangat ang mga gamit mula sa sahig. Huwag dumaan dito sakay ng sasakyan — kayang palutangin ng kalahating metro ng umaagos na tubig ang maliit na kotse.",
    },
    medium: {
      name: "Katamtamang baha",
      summary: "Abot baywang hanggang dibdib.",
      human:
        "Aabot ang tubig sa iyong baywang o dibdib. Mababaha nang buo ang isang palapag na bahay. Lulubog ang mga saksakan ng kuryente. Delikado nang lakarin ito kapag umaagos na.",
      action:
        "Lumikas nang maaga, bago pa umabot ang tubig sa lalim na ito. Patayin ang kuryente sa breaker kung ligtas itong gawin.",
    },
    high: {
      name: "Malalim na baha",
      summary: "Lampas sa taas ng ulo.",
      human:
        "Lalampas ang tubig sa ulo ng isang matanda. Lubog nang tuluyan ang mga isang palapag na bahay. Nakamamatay ang lalim na ito kahit magaling kang lumangoy, dahil sa agos at sa mga anod.",
      action:
        "Huwag maghintay. Lumikas agad sa oras na may forecast na bagyo — hindi kapag dumating na ang tubig.",
    },
  },
  outlook: {
    heavyToday: "malakas na ulan ang forecast ngayong araw — {mm} mm",
    heavyTomorrow: "malakas na ulan ang forecast bukas — {mm} mm",
    rainToday: "may ulan na forecast ngayong araw — {mm} mm",
    rainTomorrow: "may ulan na forecast bukas — {mm} mm",
    riverHigh: "inaasahang tataas ang Davao River",
    riverAbove: "inaasahang lalagpas sa normal ang Davao River",
    soak: "{mm} mm na ang bumagsak sa nakalipas na {days} araw",
    and: ", at ",
    listSep: ", ",
    zone: ", habang inilalagay ng {years}-taong modelo ang {where} sa {depth} ({summary}).",
    city:
      ", habang binabaha ng {years}-taong modelo ang humigit-kumulang {km2} km² ng lungsod.",
    tapped: "ang lugar na iyong pinindot",
    caveat:
      "Forecast na ulan at modelong panganib — hindi ito sukat ng tubig na nasa lupa ngayon. Para sa live na babala, sundan ang PAGASA at ang inyong barangay.",
  },
  emergency: {
    kicker: "Emerhensya",
    title: "Sino ang tatawagan sa Davao City",
    intro:
      "Kung tumataas na ang tubig kung nasaan ka, itigil ang pagbabasa at i-dial ang 911. Ang iba pang nasa pahinang ito ay para sa bago at pagkatapos.",
    dialBlurb: "Central 911 — sunog, medikal, rescue. Sumasagot 24 na oras.",
    offices: "Mga opisina",
    centres: "Mga evacuation center",
    serves: "Itinayo para sa {list}.",
    persons: "katao",
    announced: "Inanunsyo {date}",
    publishedBy: "Inilathala ng Pamahalaang Lungsod ng Davao",
    incompleteList:
      "Hindi pa naglalathala ang Davao City ng kumpletong listahan ng mga evacuation center. Sa totoong paglikas, nagbubukas ang inyong barangay ng mga paaralan, covered court at bulwagan na wala sa anumang pampublikong listahan — ang CDRRMO at ang inyong barangay hall ang may hawak ng listahang iyon, at sila ang dapat tanungin.",
    sourceNote:
      "Ang bawat numero at adres sa pahinang ito ay kinuha mula sa pahinang inilathala ng Pamahalaang Lungsod ng Davao at huling sinuri noong {date}. Walang anuman dito ang galing sa DavFlood — kung nagbago ang isang numero, ang pahina ng lungsod ang tama at ito ang mali.",
    roles: {
      "central-911":
        "Ang emergency response center ng Davao City — sunog, medikal, rescue. Ito ang tatawagan habang nangyayari pa.",
      cdrrmo:
        "Ang opisinang nagpapatakbo ng preemptive evacuation at may hawak ng opisyal na listahan ng mga evacuation center sa bawat barangay.",
    },
  },
  elevation: {
    label: "Mga {m} metro sa ibabaw ng antas ng dagat",
    seaLevel: "Kapantay o mas mababa sa antas ng dagat",
    note: "Mula sa elevation model na pinagbabatayan ng 3D na tanawin. Binabasa nito ang buong bloke, hindi ang pintuan mo — hindi kasama rito ang nataasang lote o mataas na palapag.",
  },

  place: {
    title: "Ang lugar mo",
    save: "I-save ang lugar na ito",
    saved: "Nai-save",
    forget: "Kalimutan",
    show: "Ipakita sa mapa",
    nameIt: "Ano ang tawag mo sa lugar na ito?",
    namePlaceholder: "Bahay",
    inFootprint: "Sa {years}-taong bagyo, inilalagay ng modelo ang lugar mo sa {depth}.",
    dry: "Hindi binabaha ng {years}-taong modelo ang lugar mo. Modelo ito, hindi pangako: wala itong sinasabi tungkol sa daan na dadaanan mo palabas.",
    privacy: "Nasa device mo lang ito. Walang account ang DavFlood at walang server na pagpapadalhan nito.",
  },

  vcard: {
    save: "I-save ang mga numerong ito sa telepono mo",
    blurb:
      "Idaragdag ang Central 911 at ang CDRRMO sa iyong mga kontak. Mananatili sila doon kahit walang app, walang signal at walang bateryang gagastusin sa pagbukas ng pahinang ito.",
  },

  ui: {
    navMap: "Mapa",
    navBarangays: "Mga Barangay",
    navReports: "Mga Ulat",
    navHazard: "Panganib",
    navHazardLong: "Antas ng panganib",
    navData: "Datos",
    navDataLong: "Ang datos",
    emergencyHotlines: "Mga emergency hotline",
    openMenu: "Buksan ang menu",
    closeMenu: "Isara ang menu",
    whatsNew: "Ano ang bago",
    sourceOnGithub: "Source sa GitHub",
    language: "Wika",
    toLightTheme: "Lumipat sa maliwanag na tema",
    toDarkTheme: "Lumipat sa madilim na tema",
    rightNow: "Ngayon mismo",
    liveForecasts: "Live na forecast",
    floodMap: "Mapa ng baha",
    modelledNotLive: "Modelo, hindi live",
    rain: "Ulan",
    checking: "Sinusuri…",
    unavailable: "Hindi available — gumagana pa rin ang mapa",
    mmToday: "mm ngayong araw",
    rainChance: "{n}% tsansa ng ulan",
    timesUsual: "{n}× ng karaniwang agos",
    bandLight: "Mahina",
    bandModerate: "Katamtaman",
    bandHeavy: "Malakas",
    weatherClear: "Maaliwalas",
    weatherPartlyCloudy: "Bahagyang maulap",
    weatherFog: "Hamog",
    weatherDrizzle: "Ambon",
    weatherRain: "Ulan",
    weatherShowers: "Pag-ulan",
    weatherHeavyShowers: "Malakas na ulan",
    weatherSqualls: "Bugso ng hangin at ulan",
    weatherThunderstorm: "Kulog at kidlat",
    lastDays: "Nakaraang {n} araw",
    alreadyFallen: "{mm} mm na ang bumuhos",
    soakNote: "Ang ulang tinataya sa ibaba ay babagsak sa lupang nakatanggap na ng ganito karami.",
    next4Days: "Susunod na 4 na araw",
    mmTotal: "{mm} mm kabuuan",
    wettest: "pinakamaulan: {day}",
    today: "Ngayon",
    todayLower: "ngayon",
    dryHint: "Walang makabuluhang ulan sa susunod na apat na araw — pumili ng araw para sa bawat oras",
    selectDay: "Pumili ng araw para sa forecast bawat oras",
    rainContext: "Konteksto ang ulan, hindi babala sa baha — sundin ang PAGASA para sa mga abiso.",
    dayAria: "{day}: {mm} mm, {p} porsyentong tsansa. Buksan ang bawat oras.",
    riverName: "Ilog Davao",
    riverLowLabel: "Mababa",
    riverLowBlurb: "Mas mababa sa karaniwang antas nito ngayong taon.",
    riverNormalLabel: "Normal",
    riverNormalBlurb: "Gaya ng karaniwan.",
    riverElevatedLabel: "Mataas-taas",
    riverElevatedBlurb: "Mas mataas kaysa siyam sa sampung araw. Bantayan kung magpapatuloy ang ulan.",
    riverHighLabel: "Mataas",
    riverHighBlurb: "Nasa pinakamataas na 5% ng nakaraang limang taon.",
    riverVeryHighLabel: "Napakataas",
    riverVeryHighBlurb: "Nasa pinakamataas na 1% ng nakaraang limang taon.",
    riverPeak: "Inaasahang aabot sa {q} m³/s sa {day}.",
    trendTitle: "Kamakailang agos at pananaw",
    channelTitle: "Gaano kapuno ang ilog",
    riverView: "Tingin sa ilog",
    viewChart: "Tsart",
    viewRiver: "Ilog",
    recent: "Kamakailan",
    forecast: "Forecast",
    forecastLower: "forecast",
    riverNote: "Modelo ng agos sa itaas ng lungsod. Putol-putol na linya: mataas-taas lampas {p90} m³/s, mula sa datos ng {from}–{to}. Ipinapakita nito kung gaano kalakas ang ilog, hindi na may lugar na binabaha.",
    channelUsual: "karaniwan",
    channelElevated: "mataas-taas",
    channelHigh: "5-taong pinakamataas",
    day: "Araw",
    channelAria: "Larawan ng Ilog Davao, {when}: {q} metro kubiko bawat segundo, {pct} porsyento patungo sa pinakamataas nito sa limang taon.",
    stormYr: "{n}-taong bagyo",
    perYear: "{p} bawat taon",
    scenarioGroup: "Senaryo ng baha",
    scenarioAria: "{n}-taong senaryo ng baha",
    yearStorm: "{n}-taong bagyo",
    chanceAYear: "{p} tsansa bawat taon",
    cityFloods: "ng Lungsod ng Davao ang binabaha",
    measuring: "Sinusukat ang sakop ng {n}-taon…",
    overlayOff: "Naka-off ang overlay — base na mapa lang ang ipinapakita.",
    cityAria: "Lugar na babahain sa senaryong ito",
    tapHint: "I-tap ang may kulay na sona para sa inaasahang lalim doon.",
    findBarangay: "Hanapin ang iyong barangay",
    findBarangaySub: "Hanapin sa lahat ng {n} at pumunta agad",
    handleFloods: "Mga {km} km² ang babahain · {storm}",
    expandPanel: "Palakihin ang panel",
    collapsePanel: "Paliitin ang panel",
    savedOffline: "Naka-save para offline",
    useWithoutSignal: "Gamitin kahit walang signal",
    savingPct: "Sine-save… {pct}%",
    opensNoConnection: "Bubukas ang mapa kahit walang koneksyon",
    packSize: "Lungsod ng Davao at lahat ng tatlong senaryo · ~{mb} MB",
    save: "I-save",
    remove: "Alisin",
    tilesFailed: "{failed} sa {total} na tile ang hindi na-save. Gagamit ng network ang mga lugar na iyon, kaya gumagana pa rin ang natitirang mapa kahit wala nito.",
    offlineNote: "Ang mapa ng panganib lang ang sine-save. Kailangan pa rin ng koneksyon ang ulan, ang ilog at ang balita — inilalarawan nila ang ngayon, at mas masama pa sa wala ang lumang kopya ng “ngayon”.",
    inTheNews: "Sa balita",
    showAllReports: "Ipakita ang lahat ng {n} ulat",
    newsNote: "Iniulat ng iba, hindi bineripika ng DavFlood. Ipinapakita ang mga headline at larawan gaya ng pagkalathala.",
    reportsTitle: "Mga ulat ng baha",
    reportsIntro: "Ang naibalita tungkol sa baha sa Lungsod ng Davao sa nakaraang dalawang buwan, pinakabago muna. Iniulat ng iba — hindi bineripika ng DavFlood, at hindi pahayag tungkol sa kalagayan ngayon.",
    loadingReports: "Nilo-load ang mga ulat",
    noReports: "Walang naitalang ulat.",
    noReportsBody: "Walang nailathala sa panahong iniingatan namin, o hindi pa tumatakbo ang feed. Hindi ito inaasahan ng mapa ng panganib.",
    reportsFooter: "{n} ulat, awtomatikong nire-refresh. Ipinapakita ang mga headline at larawan gaya ng pagkalathala, at may link pabalik sa naglathala. Inaalis ang mga ulat na lampas dalawang buwan.",
    onTheMap: "{name} sa mapa",
  },

  locale: {
    draftNotice:
      "Draft pa ang pagsasaling ito — hindi pa nasusuri ng isang katutubong nagsasalita. Kung mahalaga ang eksaktong salita, basahin ito sa English.",
    draftBadge: "Draft na salin",
    readInEnglish: "Basahin sa English",
    switchTo: "Palitan sa {language}",
  },
};

export const STRINGS: Record<Locale, Strings> = {
  en: EN,
  ceb: CEB,
  fil: FIL,
};

/**
 * `{name}` substitution. Deliberately not a template-literal helper: the
 * strings above are data, they come from a different file than the call site,
 * and translators must be able to move a placeholder to wherever their
 * grammar puts it.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}
