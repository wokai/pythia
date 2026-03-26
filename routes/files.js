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
const colors      = require('colors');
const path        = require('path');
const fsp         = require('fs').promises;

const json        = require(path.join('.', '..', 'model', 'json'));
const config      = require(path.join('.', '..', 'config', 'config'));
const win         = require(path.join('.', '..', 'logger', 'logger'));

/// ////////////////////////////////////////////////////////////////////////////
/// C Configure two nested routers
/// ////////////////////////////////////////////////////////////////////////////

/// Parent router: Manages database access 
const router = express.Router();


/// //////////////////////////////////////////////////////////////////////// ///
/// Return Collection statistics
/// curl http://localhost:9000/files/number
/// //////////////////////////////////////////////////////////////////////// ///

router.get('/number', (request, result, next) => {
  json.repo.getFileNames().then(filenames => {
    result.status(200).json({ number: filenames.length });
  })
  .catch(err => {
    result.status(500).json({ message: err.message });
  });
});


/// ////////////////////////////////////////////////////////////////////// ///
/// Performs a full-text search on titles
/// curl -w "\nstatus=%{http_code}\n" http://localhost:9000/files/read/19833758
/// curl -w "\nstatus=%{http_code}\n" http://localhost:9000/files/read/19833759
/// ////////////////////////////////////////////////////////////////////// ///
  
router.get('/read/:name', (request, result, next) => {
  console.log(`[routes/files] Read file: ${request.params.name}`.brightGreen);
  json.repo.readFile(request.params.name).then(json => {
    result.status(200).json(json);
  }).catch(err => {
    /// 404 = Not found
    result.status(404).json(err); 
  });
});


/// ////////////////////////////////////////////////////////////////////// ///
/// curl -w "\nstatus=%{http_code}\n" -XPOST -d '{"pmids": [13168976, 622185] }' -H 'content-type: application/json' http://localhost:9000/files/read
/// ////////////////////////////////////////////////////////////////////// ///
router.post('/read', (request, result, next) => {
  const pmids = request.body.pmids;
  console.log(`[routes/files/read] Received ${pmids.length} PubMed Id's:`.brightYellow);
  
  let promises = [];
  let success = [];
  let failure = [];
  
  pmids.forEach((id) => {
    let p = new Promise((resolve, reject) => {
      json.repo.readFile(id).then(json => {
        win.def.log({ level: 'info', file: 'routes/files', func: 'post|read', message: `Found json file for Pubmed Id: ${id}.`});
        success.push(json);
        resolve(id);
      }).catch(err => {
        win.def.log({ level: 'warn', file: 'routes/files', func: 'post|read', message: `id: ${id}: No such file`});
        failure.push(id);
        reject({ id: id, message: `File not found` });
      }); 
    }); /// Promise
    promises.push(p);
  });   /// forEach
  

  /// Promise.all will terminate upon the first reject
  Promise.allSettled(promises).then((values) => {
    /// Throw away results
    result.status(200).json({ status: 'OK', body: { success: success, failure: failure }});
  });

});


module.exports = router;
/// //////////////////////////////////////////////////////////////// ///
/// End of file
/// //////////////////////////////////////////////////////////////// ///
