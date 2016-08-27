#!/bin/bash
nodemon --ignore build/ app.js &
nodemon --ignore build/ build.js &
wait
