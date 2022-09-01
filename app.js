/// ////////////////////////////////////////////////////////////////////////////
/// A Setup
/// ////////////////////////////////////////////////////////////////////////////

const express       = require('express');
const path          = require('path');
const cookieParser  = require('cookie-parser');
const morgan        = require('morgan');
const fetch         = require('node-fetch');
const colors        = require('colors');
const fs            = require('fs');
const MongoClient   = require('mongodb').MongoClient;

const index   = require('./routes/index');
const entrez  = require('./routes/entrez');
const local   = require('./routes/local');
const db      = require('./routes/db');


/// Database configuration
const config  = require(path.join(__dirname, 'config', 'config'));

const app = express();


/// //////////////////////////////////////////////////////////////////////// ///
/// Logger
/// //////////////////////////////////////////////////////////////////////// ///

const win = require('./logger/logger');

/// //////////////////////////////////////////////////////////////////////// ///
/// morgan
/// //////////////////////////////////////////////////////////////////////// ///

/// Daily rotating write stream
const filename = `morgan_${new Date().toISOString().substr(0, 10)}.log`;
const log = fs.createWriteStream(path.join(__dirname, 'logfiles', filename), { flags: 'a' })
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { 
  stream: log
}));


/// ////////////////////////////////////////////////////////////////////////////
/// B Establish Database connection and install routes
/// ////////////////////////////////////////////////////////////////////////////

/// ////////////////////////////////////////////////////////////////////////////
/// Share database connection:
/// - Node server needs to be restarted when MongoDB-Service was down
/// ////////////////////////////////////////////////////////////////////////////


MongoClient.connect(config.database.url,  {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(connection => {
  
  app.locals.json = config.json.dir;
  
  /// Accessible within the whole application
  app.locals.con = connection.db(config.database.dataBaseName);
  app.locals.col = app.locals.con.collection(config.database.collectionName);
  
  app.locals.con.stats().then(res => {
    win.def.log({ level: 'info', file: 'app', func: 'DB setup', message: `DB setup: Database: ${res.db}, Objects: ${res.objects}, Data-size: ${res.dataSize}`});
  });
  
  
  app.use('/', index);
  app.use('/entrez', entrez);
  app.use('/local', local);
  app.use('/db', db);
  
});

/// Middleware before routes (order matters)
app.use(express.static('views', {'extensions': ['html']}));
//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/// Static middleware
app.use(express.static(path.join(__dirname, 'public')));
/// Bootstrap
app.use('/jquery',    express.static(path.join(__dirname , 'node_modules', 'jquery', 'dist')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/css',       express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
app.use('/feather',   express.static(path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));
app.use('/angular',   express.static(path.join(__dirname, 'node_modules', 'angular')));
app.use('/icons',     express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons', 'icons')));
app.use('/chart',     express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist')));
app.use('/json',      express.static(config.json.dir));
app.use('/pdf',       express.static(config.pdf.base));     /// Base directory for retrieval of PDF documents



app.get('/config', (request, result) => {
  result.status(200).json({
    dataBaseName : config.database.dataBaseName,
    collectionName : config.database.collectionName,
    pdf : config.pdf,
    json: config.json,
    pubmed : config.pubmed.baseUrl
  });
})



/// ////////////////////////////////////////////////////////////////////////////
/// Error Handling
/// ////////////////////////////////////////////////////////////////////////////
app.use((err, req, res, next) => {
  /// Eventually log errors here ... ?
  console.log('[app.js] Error caught: %s'.brightRed, err.stack);
  res.status(500).send(err.stack);
});


module.exports = app;
