const express = require('express');
const trip = require('../data/trip');

const router = express.Router();

router.get('/trip', (req, res) => {
  const days = trip.DAYS.map(d => ({
    num: d.num, dow: d.dow, date: d.date, title: d.title, local: d.local, eng: d.eng,
    photo: d.photo, icon: d.icon, sub: d.sub, intro: d.intro, alert: d.alert, sites: d.sites, notes: d.notes
  }));
  res.json({
    days,
    places: trip.PLACES,
    flights: trip.FLIGHTS,
    perks: trip.PERKS,
    prepaid: trip.PREPAID,
    ground: trip.GROUND,
    refs: trip.REFS,
    words: trip.WORDS,
    etiquette: trip.ETIQUETTE,
    names: trip.NAMES,
    contacts: trip.CONTACTS,
    bookLinks: trip.BOOK_LINKS
  });
});

module.exports = router;
