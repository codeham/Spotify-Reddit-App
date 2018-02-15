const express = require('express')
const app = express()
const SpotifyWebApi = require('spotify-web-api-node');
const bodyParser = require('body-parser')
const querystring = require('querystring');
const cookieParser = require('cookie-parser')
const request = require('request');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const sa = require('./spotify_auth')
const snoowrap = require('snoowrap')

const keys = require('./keys')

let global_access_token;

const spotifyApi = new SpotifyWebApi();

const r = new snoowrap(keys.redditKeys);

app.use(express.static(__dirname + '/public')).use(cookieParser())

app.get('/', (req, res) => res.sendFile(__dirname + '/public/main.html'))

app.get('/login', (req, res) => {
  // res.send('<h1>greetings from the response page !</h1>')
  const state = sa.generateRandomString(16)
  res.cookie(sa.stateKey, state)

  const scope = 'user-read-private user-read-email playlist-modify-public user-read-currently-playing'
  res.redirect('http://accounts.spotify.com/authorize?' + querystring.stringify({
    response_type: 'code',
    client_id: sa.client_id,
    scope: scope,
    redirect_uri: sa.redirect_uri,
    state: state
  }))
})

app.get('/callback/', (req, res) => {
  const code = req.query.code || null
  const state = req.query.state || null
  const storedState = req.cookies ? req.cookies[sa.stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' + querystring.stringify({
      error: 'state_mismatch'
    }))
  }else{
    res.clearCookie(sa.stateKey)
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {code: code, redirect_uri: sa.redirect_uri, grant_type: 'authorization_code'},
      headers: {'Authorization': 'Basic ' + (new Buffer(sa.client_id + ':' + sa.client_secret).toString('base64'))},
      json: true
    }

    request.post(authOptions, (error, response, body) => {
      if(!error && response.statusCode === 200){

        const access_token = body.access_token,
        refresh_token = body.refresh_token

        // store token in a global variable for outside access
        global_access_token = body.access_token

        console.log('access token: ' + access_token)
        console.log('expires in: ' + body.expires_in)
        spotifyApi.setAccessToken(access_token);

        const options = {
          url: 'https://api.spotify.com/v1/me',
          headers: {'Authorization': 'Bearer ' + access_token},
          json: true
        }

        request.get(options, (error, response, body)=> {
          console.log(body)
        })

        // pass the token to the browser to make requests from there
        res.redirect('/#' + querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        }))
      }else{
        res.redirect('/#' + querystring.stringify({
          error: 'invalid_token'
        }))
      }
    })
  }
})

app.get('/refresh_token', (req, res) => {
  const refresh_token = req.query.refresh_token
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(sa.client_id + ':' + sa.client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  }

  request.post(authOptions, (error, response, body) => {
    if(!error && response.statusCode == 200){
      const access_token = body.access_token
      res.send({
        'access_token': access_token
      })
    }
  })
})

app.get('/create_playlist', (req, res) => {
// Algorithm
// Request subreddit data from reddit
// return payloads from multiple subreddits
// parse through titles in the json payload
// store titles in dynamic array to randomize shuffle
//
// Example
// Subreddits : /r/listentothis , /r/rock, /r/rap
// Request(subreddits) -> reddit API
// return top 5 in "hot" from each subreddit (payload)
// store results inside a dynamic data structure






    console.log('GLOBAL TOKEN ' + global_access_token)

    // search tracks whose artist's name contains 'Love'
    spotifyApi.searchTracks('artist:Snoop Dogg')
      .then(function(data) {
        // console.log('Search tracks by "Love" in the artist name', data);
        res.send(data)
      }, function(err) {
        console.error(err);
      });

    // Get the authenticated user
    // spotifyApi.getMe()
    //   .then(function(data) {
    //     res.send(data.body);
    //   }, function(err) {
    //     console.log('Something went wrong!', err);
    //   });

    // var headers = {
    //     'Accept': 'application/json',
    //     'Authorization': 'Bearer ' + global_access_token,
    //     'Content-Type': 'application/json'
    // };
    //
    // var dataString = '{"description":"Newplaylistdescription","public":true,"name":"API TEST"}';
    //
    // var options = {
    //     url: 'https://api.spotify.com/v1/users/1250149838/playlists',
    //     method: 'POST',
    //     headers: headers,
    //     body: dataString
    // };
    //
    // function callback(error, response, body) {
    //     if (!error && response.statusCode === 201) {
    //         console.log(body);
    //         res.redirect('/')
    //         // res.send('It Worked !!!')
    //     }else{
    //       console.log(response.statusCode)
    //       res.redirect('/#' + querystring.stringify({error: 'post-fail'}))
    //     }
    // }
    //
    // request(options, callback);
})

// POST /api/users gets JSON bodies
app.post('/api/playlist', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  console.log(req.body)
  console.log(Object.keys(req.body))

  let formData = req.body
  const playlistName = formData['playlist_name']
  console.log(playlistName)
  console.log(formData['subreddit_box'])


  // test api callback
  r.getSubreddit(formData['subreddit_box']).getHot().map(post => post.title).then((data) => { return data })

  // for (const key of Object.keys(formData)) {
  //   if(key === 'subreddit_box'){
  //     r.getSubreddit(formData[key]).getHot().map(post => post.title).then(console.log)
  //   }
  // }
  // console.log(payload)
  res.send('nothing')
})

app.get('/reddit_api', (req, res) => {
  r.getHot().map(post => post.title).then(console.log);
  res.send('Greeting from the reddit test page !')
})
 app.listen(3000, () => console.log('Sample app listening on port 3000'))
