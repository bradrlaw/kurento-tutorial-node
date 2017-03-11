/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var path = require('path');
var url = require('url');
var express = require('express');
var minimist = require('minimist');
var fs    = require('fs');
var https = require('https');

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://localhost:8443/',
        ws_uri: 'ws://localhost:8888/kurento',
        dev: false
    }
});

var options;
if (argv.dev == false) {
    options = {
        key: fs.readFileSync('keys/privkey.pem'),
        cert: fs.readFileSync('keys/fullchain.pem'),
        ca: fs.readFileSync('keys/chain.pem')
    };
} else {
    argv.as_uri = "https://mediaserver.butterflymx.com:8443/";
    options = {
        key: fs.readFileSync('keys/server.key'),
        cert: fs.readFileSync('keys/server.crt')
    };
}

var app = express();

var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function() {
    console.log('Kurento Tutorial With Signal Server started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

app.use(express.static(path.join(__dirname, 'static')));
