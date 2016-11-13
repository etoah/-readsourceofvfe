'use strict';

var express = require('express')
var path = require('path')
var app = express()
var env = process.env.NODE_ENV
/**
 *  static folder
 **/
app.use(express.static(path.join(__dirname, (env == 'prod' || env == 'production') ? 'release' : 'dev')))

/**
 *  server and port
 **/
var port = process.env.PORT || 1024
app.listen(port, function () {
    console.log('Server is listen on port', port)
})