# API_SERVER

First of all, you need mongoDB to be installed and running
To do so : 
- find where you installed it
- launch mongod.exe
- your Database is working :D


To start the server: 
- open node command prompt
- go to project folder
- type : node bin/www
- DONE ! you server is on localhost:3000

API documentation is on http://localhost:3000
API swagger file is on http://localhost:3000/api-docs.json



# JSDOC
npm install -g jsdoc
npm install ink-docstrap
jsdoc -c jsdoc.conf.json -t ./node_modules/ink-docstrap/template -r ./red_modules

files are in ./out