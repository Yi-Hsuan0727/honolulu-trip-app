// Static trip content: the parts of the design that are never user-edited.
// Editable content (schedule rows, posts, prep checklist) lives in SQLite — see db.js.

const PHOTOS = {
  waikiki: { src: '/img/aussieactive-VxFQCqaI7pk-unsplash.jpg', alt: 'Waikiki beach and hotel towers with Diamond Head beyond' },
  lifeguard: { src: '/img/marcus-lenk-gI-xTuBrG2E-unsplash.jpg', alt: 'Palms and a lifeguard tower on an Oʻahu beach' },
  coast: { src: '/img/pono-lopez-5EFw1JT7S0M-unsplash.jpg', alt: 'Palms over a quiet Oʻahu shoreline with mountains behind' },
  surf: { src: '/img/brandon-cormier-nKAX3iIRjwM-unsplash.jpg', alt: 'Surfers crossing the sand toward small morning waves' },
  crater: { src: '/img/cosmin-serban-Rc8yKBRPdco-unsplash.jpg', alt: 'Aerial view of Diamond Head crater with Waikiki and the ocean beyond' }
};

// English name leads; the Hawaiian name rides alongside it, small.
const DAYS = [
  {
    num: '1', dow: 'Mon', date: 'Oct 12', title: 'Waikiki Beach', local: 'Waikīkī', eng: 'Arrive',
    photo: PHOTOS.waikiki, icon: 'ph-bold ph-airplane-landing',
    sub: 'Land 1:54 p.m. Nothing scheduled on purpose.',
    intro: 'Waikīkī means spouting fresh water. This was wetland, fishpond and taro long before it was hotels — a retreat for aliʻi, and where Duke Kahanamoku learned to surf. You will have been up since 5 a.m. Arizona time, so the day ends early.',
    alert: { tag: 'Ask at the desk', body: 'Confirm breakfast covers two, not one. Ask how the $100 resort credit can be spent — and request Friday luggage storage now, not Friday morning.' },
    sites: [
      { label: 'Hyatt Regency', href: 'https://www.hyatt.com/hyatt-regency/en-US/hnlhr-hyatt-regency-waikiki-beach-resort-and-spa' },
      { label: 'Go Hawaiʻi · Waikīkī', href: 'https://www.gohawaii.com/islands/oahu/regions/honolulu/waikiki' }
    ],
    rows: [
      { time: '1:54 pm', what: 'Land at HNL', where: 'Daniel K. Inouye International' },
      { time: '2:45 pm', what: 'Airport transfer', where: 'Included in the package' },
      { time: '3:00 pm', what: 'Check in', where: 'Hyatt Regency · high-floor city view' },
      { time: 'late pm', what: 'First swim', where: 'Kūhiō Beach, across the street', hi: true },
      { time: '6:10 pm', what: 'Sunset', where: 'Beach or hotel terrace' },
      { time: 'evening', what: 'Dinner in Waikīkī', where: 'Walkable' }
    ],
    notes: [
      { tag: 'Evening idea', icon: 'ph-bold ph-music-notes', body: 'Free hula and Hawaiian music often runs at the Kūhiō Beach Hula Mound, a few minutes down Kalākaua. Check the current schedule when you arrive — usually early evening, several nights a week.', tone: 'cream' },
      { tag: 'Ask at the desk', icon: 'ph-bold ph-bell', body: 'Confirm breakfast covers two, not one. Ask how the $100 resort credit can be spent and whether it expires daily. Request Friday luggage storage now.', tone: 'teal' }
    ]
  },
  {
    num: '2', dow: 'Tue', date: 'Oct 13', title: 'Turtle Canyon', local: 'honu', eng: 'Snorkel tour',
    photo: PHOTOS.lifeguard, icon: 'ph-bold ph-sailboat',
    sub: 'Booked: 10:15 a.m. with Honolulu Snorkel Co. Check in 30 minutes early.',
    intro: 'Honu — green sea turtles — are protected under federal law. Look, do not touch, do not chase, do not feed. Roughly ten feet of berth in the water. The crew will brief you; follow it. Wetsuits and a locker are already booked and paid for.',
    alert: { tag: 'Check in 30 min early', body: 'Arrive by 9:45 a.m. at 1085 Ala Moana Blvd, Suite 104 — that’s the office, not the dock. Sign the boat passenger waiver before you go, and bring your own reef-safe mineral sunscreen; none is sold on site.' },
    sites: [
      { label: 'Honolulu Snorkel Co.', href: 'https://honolulusnorkelcompany.com' },
      { label: 'Kewalo Basin Harbor', href: 'https://kewalobasinharbor.com' }
    ],
    rows: [
      { time: 'morning', what: 'Breakfast at the hotel', where: 'Included, both travelers' },
      { time: '9:45 am', what: 'Check in for the snorkel tour', where: '1085 Ala Moana Blvd, Suite 104', hi: true },
      { time: '10:15 am', what: 'Turtle Canyon snorkel tour departs', where: 'Kewalo Basin Harbor · Honolulu Snorkel Co.', link: 'https://fareharbor.com/embeds/book/honolulusnorkelcompany/orders/3a28b307-2d95-477c-81b6-27caec0855e5/?language=en-us' },
      { time: '12:15 pm', what: 'Back on land', where: 'Kewalo Basin Harbor' },
      { time: 'afternoon', what: 'Free — beach, nap, Ala Moana', where: 'Waikīkī' },
      { time: 'evening', what: 'Dinner', where: 'Waikīkī, walk' }
    ],
    notes: [
      { tag: 'Sign the waiver', icon: 'ph-bold ph-file-text', body: 'Every guest, including minors, signs the boat passenger waiver before boarding — do it from the confirmation email ahead of time to skip the line.', tone: 'teal' },
      { tag: 'No full-face masks', icon: 'ph-bold ph-prohibit', body: 'Wetsuits and a locker are already booked and paid for ($29.90 total, Booking #379314728). If you bring your own gear, full-face snorkel masks aren’t allowed for safety.', tone: 'coral' },
      { tag: 'Parking & check-in', icon: 'ph-bold ph-map-pin', body: 'Two lots flank the harbor at $1–3/hour — Diamond Parking enforces strictly, so pay up. Check in at Suite 104, not the boat. Easy to get turned around in the harbor — call (808) 556-7557 if you can’t find it.', tone: 'sun' }
    ]
  },
  {
    num: '3', dow: 'Wed', date: 'Oct 14', title: 'Pearl Harbor', local: 'Puʻuloa', eng: 'USS Arizona Memorial Plus City Tour',
    photo: PHOTOS.coast, icon: 'ph-bold ph-flag',
    sub: 'Booked: pickup 10:55 a.m., tour 11–4. A free morning first, then a full afternoon.',
    intro: 'Puʻuloa — long water — is the Hawaiian name for the harbor, once ringed by fishponds. The Arizona program runs forty-five minutes and the tone is set the moment you arrive. This booking bundles it with a short guided tour past Downtown Honolulu on the way back.',
    alert: { tag: 'Before you walk out', body: 'Pearl Harbor admits no bags of any kind — no purse, backpack, or camera bag. Phone, wallet, a slim wallet (no clutches), ID, camera. Pickup is 10:55 a.m. under the green awning on Koa Ave, not the main lobby.' },
    sites: [
      { label: 'NPS · Pearl Harbor', href: 'https://www.nps.gov/valr/index.htm' },
      { label: 'Book the memorial', href: 'https://www.recreation.gov/ticket/facility/233338' }
    ],
    rows: [
      { time: 'morning', what: 'Free morning — sleep in, breakfast', where: 'Hotel · included, both travelers' },
      { time: '10:55 am', what: 'Pickup at the hotel', where: 'Green awning, Koa Ave entrance', hi: true },
      { time: '11:00 am', what: 'USS Arizona Memorial Plus City Tour', where: 'Pearl Harbor Visitor Center · Booking #379315930', link: 'https://fareharbor.com/embeds/book/alohatrikke/items/544383/booking/7b5fda83-9959-4798-8fd6-36f279fba6af/' },
      { time: 'mid pm', what: 'Downtown Honolulu stop', where: 'Historic buildings, statues, shops' },
      { time: '4:00 pm', what: 'Tour ends, back to Waikīkī', where: 'Drop-off at the hotel' },
      { time: 'evening', what: 'Quiet dinner', where: 'Waikīkī, walk' }
    ],
    notes: [
      { tag: 'Bag policy', icon: 'ph-bold ph-prohibit', body: 'No bags of any kind enter the visitor center — no purse, backpack, camera bag, or fanny pack. Phone, wallet, ID, camera only. Paid storage is $10/bag if you need it.', tone: 'coral' },
      { tag: 'Dress code', icon: 'ph-bold ph-t-shirt', body: 'Casual and respectful — sundresses, shorts, and t-shirts are fine. No swimwear, cover-ups, or anything too revealing; it’s a memorial.', tone: 'teal' },
      { tag: 'Pickup', icon: 'ph-bold ph-clock-countdown', body: 'Meet under the green awning on Koa Ave at 10:55 a.m. — not the lobby. A few minutes early is safer than on time.', tone: 'sun' },
      { tag: 'Respect', icon: 'ph-bold ph-hand-heart', body: '1,177 of the Arizona’s crew died here and many remain aboard. This is a grave site. Keep your voice down; photographs are fine, posing is not.', tone: 'cream' }
    ]
  },
  {
    num: '4', dow: 'Thu', date: 'Oct 15', title: 'Surf & Bishop', local: 'nalu', eng: 'Waves, then Hawaiian Hall',
    photo: PHOTOS.surf, icon: 'ph-bold ph-wave-triangle',
    sub: 'Tiring morning, air-conditioned afternoon. Recovery disguised as sightseeing.',
    intro: 'Nalu is the wave. October is small-wave season on the south shore, which is exactly what you want — Waikīkī’s breaks are long, gentle and forgiving, and beginners have learned here for a century.',
    alert: { tag: 'Wear a rash guard', body: 'Two hours of Waikīkī sun on wet shoulders is no joke. Rent from a beach stand and ask which break suits your level.' },
    sites: [
      { label: 'Bishop Museum', href: 'https://www.bishopmuseum.org' },
      { label: 'Surf forecast', href: 'https://www.surfnewsnetwork.com' }
    ],
    rows: [
      { time: 'morning', what: 'Breakfast at the hotel', where: 'Included' },
      { time: '9:30 am', what: 'Surfboard rental', where: 'Waikiki Beach · two-minute walk', hi: true },
      { time: '1:30 pm', what: 'Bishop Museum', where: '1525 Bernice St · rideshare 15 min, ~$22', hi: true },
      { time: '4:30 pm', what: 'Back to Waikīkī', where: 'Rideshare' },
      { time: 'evening', what: 'Dinner', where: 'Waikīkī, walk' }
    ],
    notes: [
      { tag: 'On the surf', icon: 'ph-bold ph-person-simple-swim', body: 'Rent from a beach stand and ask which break suits your level. Wear a rash guard — two hours of Waikīkī sun on wet shoulders is no joke.', tone: 'teal' },
      { tag: 'Bishop Museum', icon: 'ph-bold ph-bank', body: 'The Hawaiʻi state museum of natural and cultural history: Hawaiian Hall, Pacific Hall, a planetarium. Budget two hours minimum and buy online for the advance discount.', tone: 'cream' }
    ]
  },
  {
    num: '5', dow: 'Fri', date: 'Oct 16', title: 'Diamond Head', local: 'Lēʻahi', eng: 'The crater, then home',
    photo: PHOTOS.crater, icon: 'ph-bold ph-mountains',
    sub: 'Shuttle leaves 7:45 a.m. sharp. The flight is 8:40 p.m. — a full day, not a travel day.',
    intro: 'Lēʻahi is the brow of the ʻahi fish. The Western name came from British sailors who mistook calcite crystals in the rock for diamonds. This tour rides a shuttle both ways — no self-driving or rideshare to the trailhead.',
    alert: { tag: 'The hike', body: 'Closed-toe shoes are required, not just recommended — no sandals or flip-flops. Bring your own water and a light snack; nothing is sold at the crater. Shuttle-only both ways: no self-driving or rideshare.' },
    sites: [
      { label: 'Diamond Head State Monument', href: 'https://dlnr.hawaii.gov/dsp/parks/oahu/diamond-head-state-monument/' },
      { label: 'Honolulu Zoo', href: 'https://www.honoluluzoo.org' }
    ],
    rows: [
      { time: '7:45 am', what: 'Shuttle pickup at the hotel', where: 'Green awning, Koa Ave', hi: true },
      { time: '8:00 am', what: 'Diamond Head hike', where: '0.8 mi each way · ~560 ft climb · ~1 hr', link: 'https://fareharbor.com/embeds/book/alohatrikke/items/593452/booking/57b4b3ab-5b4a-4521-81ac-5b61afc4205a/' },
      { time: '10:30 am', what: 'Tour ends, shuttle back', where: 'Waikīkī drop-off' },
      { time: '11:00 am', what: 'Check out, store bags', where: 'Hyatt Regency' },
      { time: 'midday', what: 'Last swim, Kapiʻolani Park, long lunch', where: 'All walkable' },
      { time: '5:45 pm', what: 'Collect bags, transfer to HNL', where: 'Package transfer' },
      { time: '8:40 pm', what: 'Depart HNL', where: 'AA 144 to LAX' }
    ],
    notes: [
      { tag: 'The hike', icon: 'ph-bold ph-sneaker', body: 'Paved, then uneven, with stairs and a narrow tunnel near the top. Steep and almost no shade — the crater bowl holds heat. Closed-toe shoes are required; bring more water than you think, plus a hat.', tone: 'coral' },
      { tag: 'Shuttle only', icon: 'ph-bold ph-bus', body: 'This tour is shuttle-only both ways — no self-driving, Uber, or taxi to the trailhead, and no pickup along the route. Be at the green awning by 7:45 a.m.; the driver won’t wait.', tone: 'sun' },
      { tag: 'Sign the waiver', icon: 'ph-bold ph-file-text', body: 'Sign the tour waiver from the confirmation email before you go.', tone: 'teal' },
      { tag: 'Six free hours', icon: 'ph-bold ph-park', body: 'Showered and free by 11. Kapiʻolani Park, the Honolulu Zoo, the Waikīkī Aquarium, or the beach with your bags in storage. Eat a real dinner before the airport.', tone: 'cream' }
    ]
  }
];

const PREP = [
  { title: 'Do this first', icon: 'ph-bold ph-star', items: ['Sign the Turtle Canyon boat passenger waiver (Honolulu Snorkel Co.)', 'Sign the Diamond Head Shuttle Tour waiver', 'Screenshot or save all three FareHarbor booking confirmations offline'] },
  { title: 'Then', icon: 'ph-bold ph-list-checks', items: ['Buy Bishop Museum tickets online for the discount', 'Confirm hotel breakfast covers two people', 'Ask how the $100 resort credit can be spent', 'Request Friday luggage storage', 'Download offline maps for Oʻahu', 'Screenshot every confirmation — service is patchy at Diamond Head', 'Check the surf and weather forecast the week before'] },
  { title: 'Pack — non-negotiable', icon: 'ph-bold ph-suitcase-rolling', items: ['Reef-safe mineral sunscreen (zinc or titanium)', 'Rash guard', 'Closed-toe shoes with grip for Diamond Head', 'Reusable water bottle', 'Photo ID for Pearl Harbor', 'Warm layer, eye mask, earplugs for the red-eye'] },
  { title: 'Water days', icon: 'ph-bold ph-drop', items: ['Two swimsuits — one is always wet', 'Quick-dry towel', 'Dry bag for the boat', 'Motion sickness tablets', 'Waterproof phone pouch'] },
  { title: 'Leave at home', icon: 'ph-bold ph-house', items: ['Hair dryer and beach towels', 'Heavy jackets', 'Any bag you might carry on Wednesday'] }
];

const PLACES = [
  { name: 'Kuhio Beach', local: 'Kūhiō', addr: 'Kalākaua Ave', from: '2 min walk', lat: 21.2735, lon: -157.8257, icon: 'ph-duotone ph-umbrella', site: 'https://www.honolulu.gov/parks' },
  { name: 'Hyatt Regency Waikiki', local: 'Waikīkī', addr: '2424 Kalākaua Ave', from: 'base', lat: 21.2765, lon: -157.8256, home: true, icon: 'ph-duotone ph-bed', site: 'https://www.hyatt.com/hyatt-regency/en-US/hnlhr-hyatt-regency-waikiki-beach-resort-and-spa' },
  { name: 'Kewalo Basin Harbor', local: 'Kewalo', addr: '1125 Ala Moana Blvd', from: '12 min drive', lat: 21.2917, lon: -157.8556, icon: 'ph-duotone ph-sailboat', site: 'https://kewalobasinharbor.com' },
  { name: 'Pearl Harbor Visitor Center', local: 'Puʻuloa', addr: '1 Arizona Memorial Pl', from: '30 min drive', lat: 21.3670, lon: -157.9390, icon: 'ph-duotone ph-flag', site: 'https://www.nps.gov/valr/index.htm' },
  { name: 'Bishop Museum', local: 'Hale Hōʻikeʻike', addr: '1525 Bernice St', from: '15 min drive', lat: 21.3330, lon: -157.8707, icon: 'ph-duotone ph-bank', site: 'https://www.bishopmuseum.org' },
  { name: 'Diamond Head Monument', local: 'Lēʻahi', addr: '4200 Diamond Head Rd', from: '12 min drive', lat: 21.2620, lon: -157.8055, icon: 'ph-duotone ph-mountains', site: 'https://dlnr.hawaii.gov/dsp/parks/oahu/diamond-head-state-monument/' },
  { name: 'Kapiolani Park', local: 'Kapiʻolani', addr: '3840 Paki Ave', from: '12 min walk', lat: 21.2690, lon: -157.8210, icon: 'ph-duotone ph-tree', site: 'https://www.honolulu.gov/parks' },
  { name: 'HNL Airport', local: 'Honolulu', addr: '300 Rodgers Blvd', from: '25 min drive', lat: 21.3187, lon: -157.9225, icon: 'ph-duotone ph-airplane-tilt', site: 'https://www.airports.hawaii.gov/hnl' }
];

const FLIGHTS = [
  { code: 'AA 693 · nonstop · A321neo', route: 'PHX → HNL', times: 'Mon Oct 12 · 10:06 a.m. → 1:54 p.m. HST', dur: '6h 48m', icon: 'ph-duotone ph-airplane-takeoff', tone: 'dark' },
  { code: 'AA 144 · overnight', route: 'HNL → LAX', times: 'Fri Oct 16 · 8:40 p.m. → 5:09 a.m. +1', dur: '5h 29m', icon: 'ph-duotone ph-moon', tone: 'ink' },
  { code: 'AA 3076 · after a 4h 41m layover', route: 'LAX → PHX', times: 'Sat Oct 17 · 9:50 a.m. → 11:17 a.m.', dur: '1h 27m', icon: 'ph-duotone ph-airplane-landing', tone: 'ink' }
];

const PERKS = [
  { k: 'Room', v: 'High-floor city view' },
  { k: 'Breakfast', v: 'Mimi & Wellen, daily' },
  { k: 'Resort credit', v: '$100 per stay' },
  { k: 'Resort fee', v: 'Waived' },
  { k: 'Transfers', v: 'Included both ways' },
  { k: 'Check-out', v: 'Fri 11:00 a.m.' }
];

const PREPAID = [
  { k: 'Costco Travel package', v: '$3,010.26' },
  { k: 'Taxes and fees', v: '$367.95' },
  { k: 'Travel insurance', v: '$152.02' },
  { k: 'Go City pass, 2 adults', v: '$238.00' },
  { k: 'Turtle Canyon snorkel tour, 2', v: '$29.90' }
];

const GROUND = [
  { k: 'Meals (~$120/day for two)', v: '$480' },
  { k: 'Rideshares, about six trips', v: '$110–140' },
  { k: 'Bishop Museum, two', v: '$56–78' },
  { k: 'Surfboard rental', v: '$40–80' },
  { k: 'Tips, incidentals, souvenirs', v: '$150+' },
  { k: 'USS Arizona booking fee', v: '$2' }
];

const REFS = [
  { k: 'Flight confirmation', v: 'LPROPF' },
  { k: 'Insurance policy', v: '723ZD300491' },
  { k: 'Go City order', v: '2438517889' },
  { k: 'Pearl Harbor tour', v: '379315930' },
  { k: 'Snorkel tour', v: '379314728' }
];

const WORDS = [
  { haw: 'aloha', en: 'hello, goodbye, love, breath' },
  { haw: 'mahalo', en: 'thank you' },
  { haw: 'e komo mai', en: 'welcome, come in' },
  { haw: 'kuleana', en: 'responsibility, and the privilege of it' },
  { haw: 'pono', en: 'righteous, balanced, correct' },
  { haw: 'honu', en: 'green sea turtle' },
  { haw: 'mauka / makai', en: 'toward the mountains / toward the sea — how locals give directions' }
];

const ETIQUETTE = [
  { t: 'Remove your shoes', b: 'Before entering someone’s home, and many small businesses too.' },
  { t: 'Do not touch turtles or monk seals', b: 'Both are protected by federal law. Keep your distance in the water and on the sand.' },
  { t: 'Leave the rocks, sand and coral', b: 'Beyond the superstition, it is ecologically and legally discouraged.' },
  { t: 'Walk and drive with patience', b: 'The shaka and a wave go a long way. Horns do not.' },
  { t: 'Pearl Harbor is a grave site', b: '1,177 of the Arizona’s crew died aboard and many remain entombed there. Keep your voice down. Photographs are permitted; posing is not the moment.' }
];

const NAMES = [
  { en: 'Diamond Head', haw: 'Lēʻahi', b: 'The brow of the ʻahi fish. British sailors mistook calcite crystals in the rock for diamonds and the English name stuck.', site: 'https://dlnr.hawaii.gov/dsp/parks/oahu/diamond-head-state-monument/', siteLabel: 'State monument' },
  { en: 'Waikiki', haw: 'Waikīkī', b: 'Spouting fresh water. Wetland and fishpond, farmed in taro, a retreat for aliʻi long before it was hotels. Duke Kahanamoku, who carried surfing to the world, learned here.', site: 'https://www.gohawaii.com/islands/oahu/regions/honolulu/waikiki', siteLabel: 'Go Hawaiʻi' },
  { en: 'Bishop Museum', haw: 'est. 1889', b: 'Built by Charles Reed Bishop in memory of his wife, Princess Bernice Pauahi Bishop — the last direct descendant of Kamehameha I. It holds the world’s largest collection of Hawaiian and Polynesian artifacts.', site: 'https://www.bishopmuseum.org', siteLabel: 'bishopmuseum.org' }
];

const CONTACTS = [
  { who: 'Emergency', note: 'Police, fire, medical', num: '911', href: 'tel:911', icon: 'ph-duotone ph-siren', tone: 'coral' },
  { who: 'Ocean Safety', note: 'Lifeguard dispatch', num: '808 922-3888', href: 'tel:+18089223888', icon: 'ph-duotone ph-lifebuoy' },
  { who: 'Hyatt Regency Waikiki', note: '2424 Kalākaua Ave', num: '808 923-1234', href: 'tel:+18089231234', icon: 'ph-duotone ph-bed' },
  { who: 'Go City Tours', note: 'Pearl Harbor & Diamond Head bookings', num: '808 926-3090', href: 'tel:+18089263090', icon: 'ph-duotone ph-ticket' },
  { who: 'Honolulu Snorkel Co.', note: 'Turtle Canyon tour · 7am–5pm', num: '808 556-7557', href: 'tel:+18085567557', icon: 'ph-duotone ph-fish-simple' },
  { who: 'Cover-More', note: 'Travel insurance · policy 723ZD300491', num: '844 246-8470', href: 'tel:+18442468470', icon: 'ph-duotone ph-shield-check' },
  { who: 'Costco Travel', note: 'Package and transfers', num: '866 921-7925', href: 'tel:+18669217925', icon: 'ph-duotone ph-briefcase' },
  { who: 'American Airlines', note: 'No change fee · $200 to cancel', num: '800 433-7300', href: 'tel:+18004337300', icon: 'ph-duotone ph-airplane-tilt' },
  { who: 'Honolulu police', note: 'Non-emergency', num: '808 529-3111', href: 'tel:+18085293111', icon: 'ph-duotone ph-shield' }
];

const BOOK_LINKS = [
  { label: 'Recreation.gov', href: 'https://www.recreation.gov/ticket/facility/233338' },
  { label: 'Go City Oʻahu', href: 'https://gocity.com/oahu/en-us' },
  { label: 'Honolulu Snorkel Co.', href: 'https://honolulusnorkelcompany.com' },
  { label: 'Bishop Museum', href: 'https://www.bishopmuseum.org' },
  { label: 'Diamond Head', href: 'https://dlnr.hawaii.gov/dsp/parks/oahu/diamond-head-state-monument/' },
  { label: 'Go Hawaiʻi', href: 'https://www.gohawaii.com/islands/oahu' }
];

module.exports = { DAYS, PREP, PLACES, FLIGHTS, PERKS, PREPAID, GROUND, REFS, WORDS, ETIQUETTE, NAMES, CONTACTS, BOOK_LINKS };
