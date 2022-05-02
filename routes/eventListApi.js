const express = require('express');
const router = express.Router();
const gameEvent = require('../data/gameEvent');

// Router configuration

router.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }


    let defaultArea = 'hoboken';
    // TO-DO show list of events near user area
    if (req.session.user) {
        defaultArea = req.session.user.userArea;
    }
    let events = await gameEvent.getGameEventbyArea(defaultArea);
    if (events) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        };
        events.forEach(event => {
            event._id = event._id.toString();
            let startTime = new Date(event.startTime);
            let endTime = new Date(event.endTime);
            event.startTime = startTime.toLocaleDateString("en-US", options);
            event.endTime = endTime.toLocaleDateString("en-US", options);
        });
    }
    res.render('eventList/eventList', {
        title: "Event List",
        userDetails: req.session.user,
        gameEvents: events
    });
});

router.post('/search', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    let searchText = req.body.searchText;


    let defaultArea = 'hoboken';
    // TO-DO show list of events near user area
    if (req.session.user) {
        defaultArea = req.session.user.userArea;
    }
    let events = await gameEvent.getGameEventbySearchArea(searchText, defaultArea);
    if (events) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        };
        events.forEach(event => {
            event._id = event._id.toString();
            let startTime = new Date(event.startTime);
            let endTime = new Date(event.endTime);
            event.startTime = startTime.toLocaleDateString("en-US", options);
            event.endTime = endTime.toLocaleDateString("en-US", options);
        });
    }
    res.render('eventList/eventList', {
        title: "Event List",
        userDetails: req.session.user,
        gameEvents: events,
        searchText: searchText
    });
});

module.exports = router;