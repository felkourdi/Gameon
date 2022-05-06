const mongoCollections = require('../config/mongoCollections');
const gameEvents = mongoCollections.gameEvent;
const {
    ObjectId
} = require('mongodb');
const check = require('../task/validation');

/* returns gameEvent by gameEvent Id */
async function getGameEvent(id) {
    id = check.checkId(id);
    const gameEventCollection = await gameEvents();
    const gameEvent = await gameEventCollection.findOne({
        _id: ObjectId(id)
    });

    if (gameEvent === null) {
        throw "Error: gameEvent not found"
    }
    gameEvent._id = gameEvent._id.toString();
    gameEvent.userId = gameEvent.userId.toString();

    if (gameEvent.participants.length !== 0) {
        for (let participant of gameEvent.participants) {
            participant = participant.toString();
        }
    }
    return gameEvent;
}

async function getGameEventbyArea(area) {
    const now = new Date(Date.now());
    const gameEventCollection = await gameEvents();
    const gameEvent = (await gameEventCollection.find({
        area: area,
        startTime: {$gte : now}
    }).sort({startTime: 1})).toArray();

    return gameEvent;
}

async function getGameEventbySearchArea(searchText, area) {
    const now = new Date(Date.now());
    const gameEventCollection = await gameEvents();
    const gameEvent = (await gameEventCollection.find({
        title: {$regex: ".*" + searchText + ".*", $options : 'i'},
        area: area,
        startTime: {$gte : now}
    }).sort({startTime: 1})).toArray();

    return gameEvent;
}

async function getGameEventbyAreaLimit(area, limitCount) {
    const now = new Date(Date.now());
    const gameEventCollection = await gameEvents();
    const eventList = (await gameEventCollection.find({
        area: area,
        startTime: {$gte : now}
    }).limit(limitCount).sort({startTime: -1})).toArray();

    return eventList;
}

async function getGameEventLandingPage() {
    const now = new Date(Date.now());
    const gameEventCollection = await gameEvents();
    const eventList = (await gameEventCollection.find({
        startTime: {$gte : now}
    }).limit(10).sort({startTime: -1})).toArray();

    return eventList;
}

/***
 * NEEDS TO check validity of Longitude and Latitude
 */

/*create a gameEvent and insert it into the database*/
async function create(userId, title, status, sportCategory, description, area, address,
    latitude, longitude, startTime, endTime, minimumParticipants,
    maximumParticipants) {
    
    userId = check.checkId(userId);
    title = check.checkString(title, 'title');
    status = check.checkString(status, 'status');
    sportCategory = check.checkString(sportCategory, 'sportCategory');
    description = check.checkString(description, 'description');
    area = check.checkString(area, 'area');
    address = check.checkString(address, 'address');
   // area = area.userArea;
    /* NEED to check if valid address */

    if (!check.checkCoordinates(longitude, latitude)) {
        throw "Error: coordinates are NOT valid"
    }

    startTime = check.checkDate(startTime, 'startTime');
    endTime = check.checkDate(endTime, 'endTime');

    if (!check.areValidTimes(startTime, endTime)) {
        throw "Error: endTime must be at least 1 hour after startTime"
    }

    minimumParticipants = check.checkNum(minimumParticipants, 'minimumParticipants');
    if (!check.validMinParticipantLimit(sportCategory, minimumParticipants)) {
        throw "Error: minimum participation limit is not valid"
    }
    maximumParticipants = check.checkNum(maximumParticipants, 'maximumParticipants');
    if (!check.validMaxParticipantLimit(sportCategory, maximumParticipants)) {
        throw "Error: maximum participation limit is not valid"
    }
    if (!check.validNumParticipants(minimumParticipants, maximumParticipants)) {
        throw "Error: minimum participants is greater than maximum participants"
    }

        let newGameEvent = {
            userId: userId, 
            title: title,
            status: status,
            sportCategory: sportCategory,
            description: description,
            area: area,
            address: address,
            startTime: startTime, 
            endTime: endTime, 
            minimumParticipants: minimumParticipants,
            maximumParticipants: maximumParticipants,
            currentNumberOfParticipants: 1,
            participants: [ObjectId(userId)]
        };
    let spots = maximumParticipants - minimumParticipants;
    // return spots;
    const gameEventCollection = await gameEvents();

        const insert = await gameEventCollection.insertOne(newGameEvent);
        if(!insert.acknowledged || !insert.insertedId){
            throw "Error: could not add gameEvent";
        }
        newGameEvent._id = insert.insertedId;
        return newGameEvent;
}

async function checkStatus() {
    const now = new Date(Date.now());
    const gameEventCollection = await gameEvents();
        const eventList = await gameEventCollection.find({}).toArray();
            /* $nor: [ { status: 'Finished' }, { status: 'Canceled' } ] */
    for(let i=0; i<eventList.length; i++){
        
        let event = eventList[i];
        console.log(JSON.stringify(event));
        let id = event._id;
        let status = event.status;
        let newStatus = 'same';
        let minParticipants = event.minimumParticipants;
        let curParticipants = event.currentNumberOfParticipants;
        let dayBefore = new Date(event.startTime - 86400000);
        console.log(dayBefore.toUTCString());
        console.log(event.startTime.toUTCString());
        if(status === 'Ongoing'){
            if(event.endTime < now){
                console.log('setting to finished');
                newStatus = 'Finished';
            }
        }
        if(status === 'Upcoming'){
            if(event.startTime > now && dayBefore < now){
                if(curParticipants < minParticipants){
                    console.log('setting event [' + id + '] to canceled');
                    newStatus = 'Canceled';
                }
            }
            if(event.startTime < now && event.endTime > now){
                console.log('setting event [' + id + '] to ongoing');
                newStatus = 'Ongoing';
            }
            if(event.endTime < now){
                console.log('setting event [' + id + '] to finished');
                newStatus = 'Finished';
            }
        }
        if(newStatus != 'same'){
            let updateInfo;
            try{
                updateInfo = await gameEventCollection.updateOne({_id: id}, {$set: {status: newStatus}});
            }
            catch(e){
                throw 'checkStatus: ' + e.toString();
            }
            if (updateInfo.modifiedCount === 0) throw 'checkStatus: encountered an error updating event ' + id.toString() + ' status';
        }
    }
}

module.exports = {
    create,
    getGameEvent,
    getGameEventbyArea,
    getGameEventbyAreaLimit,
    getGameEventLandingPage,
    getGameEventbySearchArea,
    checkStatus
}