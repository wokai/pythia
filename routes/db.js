'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2026, Wolfgang Kaisers
 * Permission is hereby granted, free of charge, to any person obtaining a 
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included 
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/
 
/// ////////////////////////////////////////////////////////////////////////////
/// A Setup
/// ////////////////////////////////////////////////////////////////////////////

const express     = require('express');
const MongoClient = require('mongodb').MongoClient;
const colors      = require('colors');
const path        = require('path');
const fsp         = require('fs').promises;

const json        = require(path.join('.', '..', 'model', 'json'));
const config      = require(path.join('.', '..', 'config', 'config'));
const win         = require(path.join('.', '..', 'logger', 'logger'));

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
/// B.1 transferOne:
/// Reads one file from json directory and inserts content into mongodb
/// ////////////////////////////////////////////////////////////////////////////




/// ////////////////////////////////////////////////////////////////////////////
/// C Configure two nested routers
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


/// //////////////////////////////////////////////////////////////////////// ///
/// Returns name of all collections in database
/// curl -w "\nstatus=%{http_code}\n" http://localhost:9000/db/collections  
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
/// curl -w "\nstatus=%{http_code}\n" http://localhost:9000/db/count  
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
        win.def.log({ level: 'info', file: 'routes/db', func: 'post|insert', 
          message: `Database insert id: ${res.insertedId}, ${res.insertedCount} records.`});
      result.status(200).json(res.insertedId);
    })
    .catch(err => result.status(500).json({ message: err.message }));
});


/// //////////////////////////////////////////////////////////////////////// ///
/// Find single document by PMID
/// //////////////////////////////////////////////////////////////////////// ///

/**
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
**/

/// //////////////////////////////////////////////////////////////////////// ///
/// Find single document by Pubmed-ID
/// http://localhost:9000/db/pmid/622185
/// //////////////////////////////////////////////////////////////////////// ///
router.get('/pmid/:pmid', (request, result) => {
  ///console.log('[db.get.pmid] Query pmid: %s'.brightGreen, request.params.pmid)
  
  request.app.locals.col.findOne({ uid : request.params.pmid })
    .then(doc => {
      /// Returns null when no record is found.
      result.status(200).json(doc)
    })
    .catch(error => {
      /// 404 = Not found
      result.status(500).json({ 
        status: 'Error',
        uid: request.params.pmid,
        message: error.message
      }); 
      
      win.def.log({ level: 'warn', file: 'routes/db', func: 'get|pmid|:pmid', 
        message: `Uid: ${request.params.pmid} error. Message: ${error.message}.`});
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


/// //////////////////////////////////////////////////////////////////////// ///
/// Share database connection
/// Node server needs to be restarted when MongoDB-Service was down
/// //////////////////////////////////////////////////////////////////////// ///

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
  /// curl -w "\n" http://localhost:9000/db/delete/622185
  /// ////////////////////////////////////////////////////////////////////// ///

  router.get('/delete/:term', (request, result, next) => {
    win.def.log({ level: 'info', file: 'routes/db', func: 'delete/:term', message: `Database deleted Id ${request.params.term}`});
    col.deleteOne({ uid: request.params.term }).then(dbres => {
        result.status(200).json({ deleted: dbres.deletedCount });
    });
  });
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// curl -w "\nstatus=%{http_code}\n" -XPOST -d '{"pmids": [13168976, 622185] }' -H 'content-type: application/json' http://localhost:9000/db/source
  /// ////////////////////////////////////////////////////////////////////// ///
  router.post('/source', (request, result, next) => {
    const pmids = request.body.pmids;
    console.log(`[routes/db/transfer] Received ${pmids.length} pmids:`.brightYellow);
    
    let promises = [];
    let src = [];
    pmids.forEach((id) => {
      promises.push(
        json.repo.readFile(id).then(json => {
          console.log(`[routes/db/source] Received ${pmids.length} id's`.brightGreen);
          src.push(json.source);
        })); 
    });
    
    console.log(`[routes/db/source] Number of promises: ${promises.length}`);
    Promise.allSettled(promises).then((values) => {
      
    });
  });
  
  /// ////////////////////////////////////////////////////////////////////// ///
  /// Transfer of Pubmed datasets from file into database
  ///  - in Chunks of 500
  ///  - using collection.insertMany([ ... ])
  /// 
  /// Prepare:
  /// db.pubmed.deleteOne({ uid: "13168976" });
  /// db.pubmed.deleteOne({ uid: "622185" });
  /// curl -w "\nstatus=%{http_code}\n" -XPOST -d '{"pmids": [13168976, 622185, 111222333] }' -H 'content-type: application/json' http://localhost:9000/db/transfer
  /// ////////////////////////////////////////////////////////////////////// ///
  
  
  /// ToDo: allSettled will not use filled success and failure arrays
  /// Alternative: Do one by one ?
  /// Alternative: Import directly from files using mongo-tools
  router.post('/transfer', (request, result, next) => {
    const pmids = request.body.pmids;
    console.log(`[routes/db/transfer] Received ${pmids.length} pmids:`.brightYellow);
    let promises = [];

    pmids.forEach((id) => {
      
      let p = new Promise((resolve, reject) => {
        
        json.repo.readFile(id).then(json => {
          col.insertOne(json).then(ins => {
            console.log(`[Resolve] Insert id: ${id}`.brightGreen);
            win.def.log({ level: 'info', file: 'routes/db', func: 'post|transfer', message: `Database insert success for id: ${id}.`});
            resolve(id);
          }).catch(err => {
            console.log(`[Reject] Insert id: ${err.keyValue.uid}`.brightYellow);
            win.def.log({ level: 'warn', file: 'routes/db', func: 'post|transfer', message: `Database insert failed for id: ${err.keyValue.uid}, code: ${err.code}.`});
            reject({ id: id, message: `Database insert failed: ${err.code}` });
          }) 
        }).catch(err => {
            console.log(`[Reject] readFile id: ${id}`.brightYellow);
            win.def.log({ level: 'warn', file: 'routes/db', func: 'post|transfer', message: `id: ${id}: No such file`});
            reject({ id: id, message: `File not found` });
        });
        
      });
      promises.push(p);
      
    }); /// pmids.forEach
    
    console.log(`[routes/db/transfer] Number of promises: ${promises.length}`.brightYellow);
    
    let success = [];
    let failure = [];
    /// .all will terminate upon the first reject

    Promise.allSettled(promises).then((results) => {
      results.forEach((result) => { 
        console.log(result); 
        if(result.status == 'rejected'){
          failure.push(result.reason);
        } else {
          success.push(result.reason);
        }
      });
      
    }).then((value) => {
      result.status(200).json({ status: 'OK', body: { number: pmids.length, success: success, failure: failure }});
    });
  });
  

  /// //////////////////////////////////////////////////////////////////////////
  /// Transfer content of JSON-file to Mongo database
  /// curl http://localhost:9000/db/31400638/file/transfer
  /// //////////////////////////////////////////////////////////////////////////
  
  file.route('/transfer').get((request, result) => {
    console.log('[db.file.route] pmid: %s'.brightYellow, request.params.pmid);
    
    const pmid = request.params.pmid;
    /// Get Content from file
    let filename = path.join(config.json.dir, pmid + '.json');
    
    try {
      fsp.readFile(filename, "utf8")
        .then(content => { return col.insertOne(JSON.parse(content)); })
        .then(res => {
          console.log('[db.file.route] /transfer: Transferred %i. ID = %s', 
          res.insertedCount, res.insertedId);
          result.status(200).json({ status: 'OK', result: res.result });
        })
    } catch(reason) {
      result.status(500).json({ status: 'Error', reason: reason });
    };
  })
})
.catch(error => {
  win.def.log({ level: 'error', file: 'routes/db', func: 'MongoClient.connect', message: `${error.codeName} (code: ${error.code})`});
  console.log(`[routes/db] MongoClient.connect Error (${error.code}): ${error.codeName}`.brightRed)
  console.log('[Exit process]'.brightYellow);
  /// Gracefully
  process.exit(0);
})



module.exports = router;


/// Test:
/// curl -is http://localhost:9000/file/ -H 'accept: text/plain'

