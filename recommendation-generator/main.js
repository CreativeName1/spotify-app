const express = require('express');
const url = require('url');
const event = require('events');
const querystring = require('querystring');
const request = require('request');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

var eventEmitter = new event.EventEmitter();

const client_id = '012d2078f2e240eeaf3941067d15a398'; // Your client id
const client_secret = 'f554274d7a204791970458586ceb3a56'; // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

app.use(cookieParser())
    .use(cors());

app.get('/', function (req, res) {

    if (!req.cookies || !req.cookies['access token']) {
        res.send("not logged in");
        return;
    }

    else {

        res.sendFile("/Users/hua00/ben/spotify/node-js-tutorial/index.html");
        return;
    }

});

app.get('/getRecommendations', function (req, res) {
    var accessToken = req.cookies['access token'];

    var seed_tracks = [];

    req.query.seed_tracks.forEach(function(track) {
        var url = new URL(track);
        //spotify song url of structure: 
        //https://open.spotify.com/track/4rHIfYRQw6ittRQXAlurk0?si=36d7c6fb8d614969
        //takes just the pathname, and finds ID of song (chars 6 to 22)
        seed_tracks.push(url.pathname.slice(7, 29));
    });

    console.log(seed_tracks[0]);

    var getRecommendationsOptions = {
        url: 'https://api.spotify.com/v1/recommendations?'
        + querystring.stringify({
            seed_artists: "",
            seed_genres: "",
            seed_tracks: seed_tracks.join(","),
            min_popularity: req.query.min_popularity,
            max_popularity: req.query.max_popularity
        }),

        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
    }

    request.get(getRecommendationsOptions, function(error, response, body) {
        if (error) {
            res.send(response);
            return;
        }

        //parse response body, make giant string of all song 

        recommendation_data = JSON.parse(body)

        let outputString = "";

        outputString = outputString.concat("number of tracks: " + recommendation_data.tracks.length + "<br>");

        recommendation_data.tracks.forEach(
            function(track) {

                var url = track.external_urls[0]

                outputString = outputString.concat(track.name + " by " + track.artists[0].name + "<br>")
            }
        )

        res.send(body);
    });


})

app.get('/login', function (req, res) {
    res.redirect(
        'https://accounts.spotify.com/authorize?'
        + querystring.stringify({
            client_id: client_id,
            response_type: 'code',
            redirect_uri: redirect_uri,
            scope: 'user-read-private user-read-email'
        }));
});

app.get('/callback', function (req, res) {

    var auth_code = req.query.code;

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: auth_code,
            redirect_uri: redirect_uri,
            grant_type: "authorization_code"
        },
        headers: {
            'Authorization': 'Basic ' + Buffer.from(client_id + ":" + client_secret).toString('base64')
        },
        json:true
    }

    request.post(authOptions, function(error, response, body) {
        if (response.statusCode != 200) {
            res.send(response);
            return;
        }

        res.cookie('access token', body.access_token);
        res.cookie('refresh token', body.refresh_token)
        res.redirect('/')
    });

});

app.listen(8888);
