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
/// 
/// ////////////////////////////////////////////////////////////////////////////

const colors    = require('colors');
const path      = require('path');
const fsp       = require('fs').promises;

const config        = require(path.join(__dirname, '..', 'config', 'config'));
const win           = require(path.join(__dirname, '..', 'logger', 'logger'));
const Reference     = require(path.join(__dirname, 'reference'));
const { Database }  = require(path.join(__dirname, 'database'));


class JsonRepository {
  
  #nFiles
  
  constructor(){
    this.#nFiles = 0;
  }
   
  /**
   * @param{filename}   : Name [string] of file without path and extension
   * @returns{Promise}  : json object
   **/
  readFile = async (filename) => {
    let f = path.join(config.json.dir, `${filename}.json`);
    console.log(`[model/json] readFile: ${f}`.brightGreen);
    win.def.log({ level: 'info', file: 'model/json', func: 'readFile', message: `filename: ${filename}`});
    return new Promise((resolve, reject) => {
      fsp.readFile(f, "utf8")
        .then(value => {
          let j = JSON.parse(value);
          console.log(`[model/json] readFile: Received uid ${j.uid}`.brightGreen);
          resolve(j);
        })
        .catch(err => {
          if(err.code == 'ENOENT') {
            win.def.log({ level: 'warn', file: 'model/json', func: 'readFile', message: `filename: ${f}: No such file`});
            reject({ filename: filename, code: err.code, call: err.syscall, message: 'No such file' });
          } else {
            reject({ filename: filename, code: err.code, call: err.syscall });
          }
        });
    });
  }; /// readFile

  /**
   * @param{filename}   : Name [string] of file without path and extension
   * @returns{Promise}  : Resolves to Reference object
   **/
  readRef = async (filename) => {
    return new Promise((resolve, reject) => {
      console.log(`[model/json] readRef: Received filename ${filename}`.brightCyan);
      this.readFile(filename).then(j => {
        console.log(`[model/json] readRef: Received uid ${j.uid}`.brightCyan);
        const r = Reference.fromPubmed(j);
        console.log(`[model/json] readRef.id: ${r.id}`.brightCyan);
        resolve(r);
      }).catch(err => {
        reject(err);
      }); /// readFile
    });   /// Promise
  };      /// readRef
  
  
  readAndSave = async (filename) => {
    return new Promise((resolve, reject) => {
      this.readRef(filename).then(ref => {
        console.log(`[model/json] readAndSave: Received Ref`.brightCyan);
        //console.log(ref);
        Database.createRef(ref).then(res => {
          win.def.log({ level: 'info', file: 'model/json', func: 'createRef', message: `Insert Record success.`});
          resolve(res);
        }).catch((e) => {
          //console.log(`[model/json] readAndSave Error: name ${e.name} | message: ${e.message}`.brightCyan);
          win.def.log({ level: 'error', file: 'model/json', func: 'readAndSave', message: `${e.name}: ${e.message}`});
          reject(e);
        });
      });
    }); /// Promise
  }     /// readAndSave
  
  /**
   * @param{obj}  - (Object representing Pubmed record)
   * @param{name} - (File name [.json will be added]: Pubmed-id)
   * @returns{Promise}
   **/
  writeSingleJson = async (obj, name) => {
    let filename = path.join(config.json.dir, name + '.json');
    /// //////////////////////////////////////////////////////////////////////////
    /// Object validation
    /// Failing validation will impede insertion into MongoDb collection
    /// //////////////////////////////////////////////////////////////////////////
    if(!obj.hasOwnProperty('title')){
      throw new Error('[json.writeJson] Required property *title* not found.'); 
    }
    /// Include spacer for readability
    let js = JSON.stringify(obj, null, 2);
    return fsp.writeFile(filename, js)
        .then(() => {
          ++this.#nFiles;
          console.log(`[json.js] File ${p} written.`.brightYellow)
        })
        .catch(reason => {console.log('[model/json.js] writeSingleJson: writeFile Rejected: %s'.brightRed, reason) });
  }

  /**
   * @param{entrez} - (Object: Returned by entrez query)
   * @returns{Promise}
   **/ 
  writeArray = async (entrez) => {
    let promises = [];
    let pmids = entrez.result.uids;
    pmids.forEach(p => { promises.push( this.writeSingleJson(entrez.result[p], p)) });
    return Promise.all(promises);
  }

  /**
   * @returns(Promise)
   **/
  getFileNames = async () => {
    return fsp.readdir(config.json.dir);
  }
  

}

const json = new JsonRepository;

module.exports = {
  repo : json
}
/// //////////////////////////////////////////////////////////////// ///
/// End of file
/// //////////////////////////////////////////////////////////////// ///
