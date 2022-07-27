
/// ////////////////////////////////////////////////////////////////////////////
/// A Setup
/// ////////////////////////////////////////////////////////////////////////////

const express     = require('express');
const MongoClient = require('mongodb').MongoClient;
const colors      = require('colors');
const path        = require('path');
const fs          = require('fs/promises');

const config = require(path.join('.', '..', 'config', 'config'));

/// ////////////////////////////////////////////////////////////////////////////
/// B Local utils
/// ////////////////////////////////////////////////////////////////////////////

/// ////////////////////////////////////////////////////////////////////////////
/// B.1 difference:
/// Generates Difference a-b (elements from |a| which are not present in |b|)
/// Requirement: arrays |a| and |b| must be sorted in ascending order!
/// ////////////////////////////////////////////////////////////////////////////

const difference = function (a, b)
{
  var ai=0, bi=0;
  var result = [];

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ) { result.push(a[ai]); ++ai; }
     else if (a[ai] > b[bi] ) { ++bi; }
     else                     { ++ai; ++bi; }
  }
  /// Fill up reminings from a
  while( ai < a.length )      { result.push(a[ai]); ++ai; }

  return result;
}


/// ////////////////////////////////////////////////////////////////////////////
/// C Conrigure two nested routers
/// ////////////////////////////////////////////////////////////////////////////

/// Parent router: Manages database access 
const router = express.Router();

/// Child router: Access to local JSON files
/// Allows access params from parent router
const file = express.Router({ mergeParams: true });

/// Child router is nested as middleware:
router.use('/:pmid/file', file);



/// ////////////////////////////////////////////////////////////////////////////
/// D Access to MongoDB
/// ////////////////////////////////////////////////////////////////////////////


/// //////////////////////////////////////////////////////////////////////// ///
/// Return Collection statistics
/// curl http://localhost:9000/db/stats
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/stats', (request, result, next) => {
  request.app.locals.con.stats()
    .then(r => {
      result.status(200).json(r);
    })
    .catch(err => res.status(500).json({ message: err.message }));
});




/// https://stackoverflow.com/questions/5667888/counting-the-occurrences-frequency-of-array-elements

/// //////////////////////////////////////////////////////////////////////// ///
/// Returns name of all collections in database
/// curl http://localhost:9000/db/collections  
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/collections', (request, result, next) => {
  request.app.locals.con.collections().then(cols => {
    return cols.map(c => c.collectionName)
  })
  .then(c => {
    result.status(200).json({ collectionNames: c });
  })
  .catch(error =>{
    next(error)
  })
});

/// //////////////////////////////////////////////////////////////////////// ///
/// Return number of documents in collection
/// curl http://localhost:9000/db/count  
/// //////////////////////////////////////////////////////////////////////// ///
router.get('/count', (request, result, next) =>{
  
  request.app.locals.con.stats()
    .then(r => { 
      result.status(200).json({ count: r.objects})
    })
    .catch(err => result.status(500).json({ message: err.message }));
});
/// curl http://localhost:9000/db/count

/// //////////////////////////////////////////////////////////////////////// ///
/// Creates two indexes:
///   - uid  : unique
///   - title: text
///
/// See: https://docs.mongodb.com/manual/text-search/
/// Can't be done using 'createIndexes' because text-Index and unique option
/// contradict each other...
/// Usage: col.find( { $text: { $search: "java coffee shop" } } )
///
/// curl http://localhost:9000/db/index  
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/index', (request, result) => {
  request.app.locals.col.createIndex(
      {
        'uid': 1        /// ascending order
      }, {
        unique: true,   /// No insertion of duplicates
        sparse: true    /// Index only documents with the specified field
      }
    )
    .then(index => {
      console.log('[db.index] uid index: %s'.brightGreen, index);
      /// Only one text search index in collection allowed
      return col.createIndex({ title: 'text' }, { default_language: "english" });
    })
    .then(index => {
      console.log('[db.index] title *text* index: %s'.brightGreen, index);
      result.status(200).json({ index: index });
    })
    .catch(error => {
      console.log('[db.index] Error: %s'.brightRed, error);
      result.status(500).json({ message: error });
    });
  
});


/// //////////////////////////////////////////////////////////////////////// ///
/// Returns all stored documents
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/all', (request, result, next) => {
  request.app.locals.col.find()
    .then(res => {
      console.log('[db.js] found %i items.'.brightYellow, res.length);
      result.json(res);
    })
    .catch(err => res.status(500).json({ message: err.message }));
});


router.get('/journals', (request, result, next) => {
  request.app.locals.col.distinct('fulljournalname')
    .then(res => {
      console.log('[db.js] Journals: Found %i items'.brightGreen, res.length)
      result.status(200).json(res);
    })
    .catch(err => res.status(500).json({ message: err.message }));
});


router.get('/authors/:name', (request, result, next) => {
  
  console.log('[db.get.authors] Name: %s '.brightGreen, request.params.name)
  
  try {
    request.app.locals.col.find({
      'authors.name': new RegExp(request.params.name) })
    .toArray().then((ans) => {
      result.status(200).json(ans);
    });

  } catch(err) {
    result.status(500).json({ message: err.message });
  }
});

router.post('/authors', (request, result) => {
  let qry = request.body;
  
  console.log('[db.post.authors] Name: %s'.brightGreen, qry.search);
  try {
    request.app.locals.col.find({
      'authors.name': new RegExp(qry.search) 
      })
      .toArray().then((ans) => {
        result.status(200).json(ans)
      })
  } catch(err) {
    result.status(500).json({ message: err.message });
  }
});



/// //////////////////////////////////////////////////////////////////////// ///
/// Inserts one new object into entrez collection and returns ID
/// //////////////////////////////////////////////////////////////////////// ///

router.post('/insert', (request, result) => {
  request.app.locals.col.insertOne(request.body)
    .then((res) => {
      console.log('[db.post] Inserted %i records. ID = %s'.brightGreen, 
        res.insertedCount, res.insertedId);
      result.status(200).json(res.insertedId);
    })
    .catch(err => result.status(500).json({ message: err.message }));
});


/// //////////////////////////////////////////////////////////////////////// ///
/// Find single document by PMID
/// //////////////////////////////////////////////////////////////////////// ///

router.post('/query/pmid', (request, result) => {
  let qry = request.body;
  console.log('[db.post.query.pmid] Query pmid: %s'.brightGreen, qry)
  
  request.app.locals.col.findOne({ uid : qry.search })
    .then(doc => {
      console.log('[db.post.query.pmid] Found id: %s'.brightGreen, doc._id)
      result.status(201).json(doc) /// 201: Created
    })
    .catch(error => {
      console.log('[db.post.query.pmid] Error: %s'.brightRed, error.message);
    })
  
});


/// Example: 
/// http://localhost:9000/db/pmid/13682
router.get('/pmid/:pmid', (request, result) => {
  console.log('[db.get.pmid] Query pmid: %s'.brightGreen, request.params.pmid)
  
  request.app.locals.col.findOne({ uid : request.params.pmid })
    .then(doc => {
      console.log('[db.get.pmid] Found id: %s'.brightGreen, doc._id)
      result.status(201).json(doc) /// 201: Created
    })
    .catch(error => {
      console.log('[db.get.pmid] Error: %s'.brightRed, error.message);
    })
  
});

/// //////////////////////////////////////////////////////////////////////// ///
/// Find documents by text search in titles
/// //////////////////////////////////////////////////////////////////////// ///

router.post('/query/title', (request, result) => {
  
  let qry = request.body;
  console.log('[db.post.query.title] Query term: %s '.brightGreen, qry)

  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// The default values for further settings are:
  /// $caseSensitive: false,
  /// $diacriticSensitive: false
  /// $language: default_language (en)
  ///
  /// By providing a language selector, the list of stop words and the 
  /// rules for the stemmer and tokenizer for the search string are applied.
  /// ////////////////////////////////////////////////////////////////////// ///

  if(qry.type == 'text') {
    
    /// //////////////////////////////////////////////////////////////////// ///
    /// Pass string of words parsed by the $text operator in order to 
    /// query the text index.
    /// //////////////////////////////////////////////////////////////////// ///
    request.app.locals.col.find({ 
      $text: { 
        $search: qry.search
        }
      })
      .toArray()
      .then(docs => { result.status(200).json(docs) })
      
  } else if (qry.type == 'phrase') {
    
    /// //////////////////////////////////////////////////////////////////// ///
    /// Search for a phrase
    /// //////////////////////////////////////////////////////////////////// ///
    request.app.locals.col.find({
      $text: { 
        $search: '"\"' + qry.search +'\""'
        }
      })
      .toArray()
      .then(docs => { result.status(200).json(docs) })      
    
  } else {
    
    /// //////////////////////////////////////////////////////////////////// ///
    /// Error
    /// //////////////////////////////////////////////////////////////////// ///
    result
      .status(400)
      .send('[db.post.query.title] Unknown query type: ' + qry.type)
  }
  

});


/// ////////////////////////////////////////////////////////////////////////////
/// E Local JSON files
/// ////////////////////////////////////////////////////////////////////////////

/*******************************************************************************
 * Return file content as JSON (testing file access...)
 ******************************************************************************/

file.route('/').get(function (request, result) {
  console.log('[db.file.route] pmid: %s'.brightYellow, request.params.pmid);
  
  const pmid = request.params.pmid;
  /// Get Content from file
  let filename = path.join(file_path, pmid + '.json')
  fs.readFile(filename, "utf8")
  .then(content => {
    result.json(JSON.parse(content));
  })
  .catch(reason => {
    /// Caught by Express ...
    throw new Error(reason);
  });
});
/// curl http://localhost:9000/db/10066724/file/


/*******************************************************************************
 * Share database connection:
 *  - Node server needs to be restarted when MongoDB-Service was down
 ******************************************************************************/


MongoClient.connect(config.database.url,  {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(connection => {
  
  const db = connection.db(config.database.dataBaseName);
  const col = db.collection(config.database.collectionName);
  var uidIndexName;
  
  
  ///Async: Returns array with numeric pmid's from database
  const getPmids = function() {
    return new Promise(function(resolve, reject) {
     col.find({}, { projection: { _id: 0, uid: 1 } }).toArray()
    .then(docs => {
      return docs.filter(obj => { 
        if(obj.uid)
          return true;
        return false;
      });
    })
    .then(res => { return res.map(x => parseInt(x.uid)) })
    .then(res => { console.log('[db.getPmids]'.brightGreen); resolve(res); })   
    .catch(err => { reject(err.message); });
    });
  }
  

  /// ////////////////////////////////////////////////////////////////////// ///
  /// Returns all pmids
  /// curl http://localhost:9000/db/pmids  
  /// ////////////////////////////////////////////////////////////////////// ///
  
  router.get('/pmids', (request, result, next) => {
    getPmids()
    .then(res => { result.status(200).json({ pmids: res }); })
    .catch(error => { next(error) });
  });

  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Performs a full-text search on titles
  /// curl http://localhost:9000/db/query/Syncytial   
  /// ////////////////////////////////////////////////////////////////////// ///
  
  router.get('/query/:term', (request, result, next) => {
    console.log('Query term: %s '.brightGreen, request.params.term)
    /// col.find({ $text: { $search: request.params.term }}, { projection: { _id: 0, uid: 1 } }).toArray()
    col.find({ $text: { $search: request.params.term }}).toArray()
    .then(docs => {
        console.log(docs);
        result.status(200).json(docs);
    })
    .catch(error => { next(error) });
  });

  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Transfer of Pubmed datasets from file into database
  ///  - in Chunks of 500
  ///  - using collection.insertMany([ ... ])
  /// curl -XPOST -d '{"pmids": [30050694,30154345] }' -H 'content-type: application/json' http://localhost:9000/db/transfer
  /// ////////////////////////////////////////////////////////////////////// ///
  
  router.post('/transfer', (request, result, next) => {
    const pmids = request.body.pmids;
    console.log('[db.rile.route.transfer] Received %i pmids.'.brightYellow, pmids.length);
    console.log(request.body);
  });
  
  
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Transfer content of JSON-file to Mongo database
  /// curl http://localhost:9000/db/10066724/file/transfer
  /// //////////////////////////////////////////////////////////////////////////
  
  file.route('/transfer').get((request, result) => {
    console.log('[db.file.route] pmid: %s'.brightYellow, request.params.pmid);
    
    const pmid = request.params.pmid;
    /// Get Content from file
    let filename = path.join(file_path, pmid + '.json')
    fs.readFile(filename, "utf8")
    .then(content => { return col.insertOne(JSON.parse(content)); })
    .then(res => {
      console.log('[db.file.route] /transfer: Transferred %i. ID = %s', 
        res.insertedCount, res.insertedId);
        
      result.json(res.result);
    })
    .catch(reason => {
      /// Caught by Express ...
      throw new Error(reason);
    });
  });
  
  
})
.catch(error => { throw new Error(error); })



module.exports = router;


/// Test:
/// curl -is http://localhost:9000/file/ -H 'accept: text/plain'

