'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2022, Wolfgang Kaisers
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

const express   = require('express');
const fetch     = require('node-fetch');
const path      = require('path');
const fs        = require('fs/promises');
const colors    = require('colors');

const config      = require(path.join(__dirname, '..', 'config', 'config'));    /// Database
const win         = require(path.join(__dirname, '..', 'logger', 'logger'));
const { mongo }   = require(path.join(__dirname, '..', 'model', 'mongo'));
const { json  }   = require(path.join(__dirname, '..', 'model', 'json'));
const { entrez }  = require(path.join(__dirname, '..', 'model', 'entrez'));

const router = express.Router();

/// ////////////////////////////////////////////////////////////////////////////
/// https://www.ncbi.nlm.nih.gov/pmc/tools/id-converter-api/
/// ////////////////////////////////////////////////////////////////////////////


function writeJson(obj, name){
  let filename = 'json/' + name + '.json';
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Object validation
  /// Failing validation will impede insertion into MongoDb collection
  /// //////////////////////////////////////////////////////////////////////////
  if(!obj.hasOwnProperty('title')){
    throw new Error('[entrez.writeJson] Required property *title* not found.');
    win.def.log({ level: 'warn', file: 'entrez', func: 'writeJson', message: `Required property *title* not found`});
  }
  /// Include spacer for readability
  let js = JSON.stringify(obj, null, 2);
  return fs.writeFile(filename, js);
}

/// Fetch example data from pubmed
router.get('/', function(request, result, next) {
  fetch(config.pubmed.example)
    .then(res => res.json())
    .then(json => {
  result.send(json);
  })
  .catch(err => {
    console.log('[pythia] get Error: %s'.brightRed, err.message)
    result.send(err.toString())
  });
    
});

router.get('/:pmid', function(request, result, next){
  var url = config.baseUrl + request.params.pmid;
  console.log('[pythia] GET pmid: %s'.green, request.params.pmid);
  console.log('[pythia] GET url: %s'.green, url);
  
  let status;
  fetch(url)
    .then(res => {
      status = res.status;
      return res.json();
    })
    .then(json => {
        
      let pmid = json.result.uids[0];
      let fn = pmid + '.json';
      let fp = 'json/' + fn;
      let s = JSON.stringify(json.result[json.result.uids[0]], null, 2);
      
      fs.writeFile(fp, s)
      .then(() => { console.log('[entrez.js] File %s written.'.brightYellow, fn); })
      .catch(reason => {console.log('[entrez.js] Rejected: %s'.brightRed, reason); });
      
        console.log('[pythia] GET status: %s'.brightYellow, status);
        console.log('[pythia] GET json: %s'.brightMagenta, json.result.uids[0]);
        console.log('[pythia] GET json: %s'.brightMagenta, json.result[json.result.uids[0]].source);
        result.send(json); 
    })
    .catch(err => {
      console.log('[pythia] get pmid Error: %s'.brightRed, err.message)
      result.send(err.toString())
    });
});


router.get('/pmc/:pmcid', function(request, result, next) {
  
  var url = config.pmc.baseUrl + request.params.pmcid;
  console.log(`[pythia] GET PMC: ${request.params.pmid}`.green);
  
  let status;
  fetch(url)
    .then(res => {
      status = res.status;
      return res.json();
    })
    .then(json => {
        
      let pmid = json.result.uids[0];
      let filename = `PMC${request.params.pmcid}.json`;
      let fp = path.join(__dirname, '..', 'json', filename);
      let s = JSON.stringify(json.result, null, 2);
      
      fs.writeFile(fp, s)
      .then(() => { console.log('[entrez.js] File %s written.'.yellow, filename); })
      .catch(reason => {console.log('[entrez.js] Rejected: %s'.red, reason); });
      
        console.log('[pythia] GET status: %s'.yellow, status);
        console.log('[pythia] GET json: %s'.cyan, json.result.uids[0]);
        console.log('[pythia] GET json: %s'.cyan, json.result[json.result.uids[0]].source);
        result.send(json); 
    })
    .catch(err => {
      console.log('[pythia] get pmid Error: %s'.red, err.message)
      result.send(err.toString())
    });
});


router.post('/', (request, result, next) => {
   
  /// Ensure, that only integral numbers are processed
  const pmint = request.body.pmid.map(function(x) { return parseInt(x); } );
  const pmid = pmint.filter(function (x) { return !Number.isNaN(x); });
  const pms = pmid.join();
  
  let url = config.pubmed.baseUrl + pms;
  console.log('[pythia] POST: '.green, request.body.pmid);
  console.log('[pythia] POST: %s'.green, pms);
  console.log('[pythia] POST url: %s'.green, url);
  fetch(url)
    .then(res => res.json())
    .then(json => {
      let pmids = json.result.uids;
      pmids.forEach(p =>{
        writeJson(json.result[p], p)
          .then(() => (console.log('[routes/entrez] File %s written.'.brightYellow, p)))
          .catch(reason => {console.log('[routes/entrez] writeJson Rejected: %s'.brightRed, reason) });
        try{
          /// Insert into database without check ...
          request.app.locals.col.insertOne(json.result[p])
            .catch(e => console.log('[entrez.js] Database insert of PMID %s failed.'.brightRed, p, e.message))
          console.log('[pythia] Database PMID %s written.'.brightGreen, p)
        } catch(error) {
          console.log('[entrez.js] Database insert of PMID %s failed.'.brightRed, p)
        }
        
      });
      result.send(json)
    })
    .catch(err => result.send(err.toString()));
});

 

/// curl -d "{ \"pmid\": [ 28969617 ] }" -X POST http://localhost:9000/entrez/twostep -H "Content-Type: application/json" -w "\nSize: %{size_download} bytes\n"
/// curl -d "{ \"pmid\": [1, 10000, 13682, 100000, 1148076, 234567] }" -X POST http://localhost:9000/entrez/twostep -H "Content-Type: application/json" -w "\nSize: %{size_download} bytes\n"
/// curl -d "{ \"pmid\": [ 19343057 ] }" -X POST http://localhost:9000/entrez/twostep -H "Content-Type: application/json" -w "\nSize: %{size_download} bytes\n"
/// {"contained":[{"uid":"10000"},{"uid":"1148076"},{"uid":"13682"}],"unknown":["1","100000","234567"]}

router.post('/twostep', (request, result, next) => {
  if(request.body.pmid){
    win.def.log({ level: 'info', file: 'entrez', func: 'Post /twostep', message: `PMID's: ${request.body.pmid}`});
    console.log(`[routes/entrez] Post /twostep: pmid's: ${request.body.pmid}`.yellow)
    mongo.getFilteredDatasets(request.app.locals.col, mongo.toPmidArray(request.body.pmid))
      .then(res => {
        win.def.log({ level: 'info', file: 'entrez', func: 'Post /twostep', message: `Fetching from Entrez because unknown: ${res.unknown}.`});
        console.log('[routes/entrez] /twostep unknown: %s'.yellow, res.unknown)
        
        if(res.unknown.length > 0) {
          entrez.fetch(res.unknown)
           .then(e => {
              res.entrez = e;
              e.forEach(p => {
                try {
                  /// Insert into database without check ...
                  request.app.locals.col.insertOne(p)
                    .catch(e => {
                      win.def.log({ level: 'warn', file: 'entrez', func: 'Post /twostep', message: `Database insert of PMID ${p} failed.`});
                      //console.log(`[routes/entrez/twostep] Database insert of PMID ${p} failed.`.brightRed, e.message)
                    })
                } catch(error) {
                  win.def.log({ level: 'warn', file: 'entrez', func: 'Post /twostep', message: `Database insert of PMID ${p} failed.`});
                  //console.log(`[routes/entrez/twostep] Database insert of PMID ${p} failed.`.brightRed)
                }
              });
              result.status(200).json(res);
            })
        } else {
          res.entrez = [];
          result.status(200).json(res);
        }
      })
  } else {
    win.def.log({ level: 'warn', file: 'entrez', func: 'Post /twostep', message: `Error: No PUBMED-id provided`});
    result.status(200).json({ status: 'Error', message: 'No pmid provided' });
  }
});


module.exports = router;
