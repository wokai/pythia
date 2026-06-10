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
const { database }  = require(path.join(__dirname, 'database'));


class JsonRepository {
  
  #nFiles
  
  constructor(){
    this.#nFiles = 0;
  }
  
  /**
   * @param{filename}   : Name [string] of file without path and extension
   * @returns{Promise}  : json object
   **/
  getFileStats = async (filename) => {
    /// Remove file extension
    filename = filename.replace(/\.[^/.]+$/, "");
    let f = path.join(config.json.dir, `${filename}.json`);
    win.def.log({ level: 'info', file: 'model/json', func: 'getFileStats', message: `filename: ${filename}`});
    return new Promise((resolve, reject) => {
      fsp.stat(f).then((stat) => {
        stat.mtime = new Date(stat.mtimeMs).toISOString();
        resolve(stat);
      }).catch((err) => {
        reject(err);
      });
    });
  }

   
  /*****
   * Reads content of a single .json file from config.json.dir
   * @param{filename}   : Name [string] of file without path and extension
   * @returns{Promise}  : json object
   * @rejects           : File not found or syscall error
   *****/
  readFile = async (filename) => {
    /// Remove file extension
    filename = filename.replace(/\.[^/.]+$/, "");   
    let f = path.join(config.json.dir, `${filename}.json`);
    win.def.log({ level: 'info', file: 'model/json', func: 'readFile', message: `filename: ${filename}`});
    return new Promise((resolve, reject) => {
      fsp.readFile(f, "utf8")
        .then(value => {
          resolve(JSON.parse(value));
        }).catch(err => {
          if(err.code == 'ENOENT') {
            win.def.log({ level: 'warn', file: 'model/json', func: 'readFile', message: `filename: ${f}: No such file`});
            reject({ filename: filename, code: err.code, call: err.syscall, message: 'No such file' });
          } else {
            reject({ filename: filename, code: err.code, call: err.syscall });
          }
        });
    });
  }; /// readFile

  /*****
   * Reads content of a single .json file from config.json.dir
   * @param{filename}   : Name [string] of file without path and extension
   * @returns{Promise}  : Resolves to Reference object
   * @rejects           : File not found or syscall error
   *****/
  readRef = async (filename) => {
    return new Promise((resolve, reject) => {
      this.readFile(filename).then(j => {
        const r = Reference.fromPubmed(j);
        resolve(r);
      }).catch(err => {
        reject(err);
      }); /// readFile
    });   /// Promise
  };      /// readRef
  
  
  /*****
   * Reads content of a single .json file from config.json.dir,
   * adds jsonCreated (mtimeMs) property and writes a database record
   * @param{filename}   : Name [string] of file without path and extension
   * @returns{Promise}  : Resolves to Json object (returned by model/database/createRef)
   * @rejects           : File not found or syscall error
   *****/
  
  restoreJsonToDb = async (filename) => {
    return new Promise((resolve, reject) => {
      this.readRef(filename).then(ref => {
        this.getFileStats(filename).then(stat => {
          ref.jsonCreated = stat.mtimeMs;
          database.createRef(ref).then(res => {
            win.def.log({ level: 'info', file: 'model/json', func: 'restoreJsonToDb', message: `Insert Record id ${res.id} success.`});
            resolve(res);
          }).catch(err => {
            win.def.log({ level: 'error', file: 'model/json', func: 'restoreJsonToDb', message: `createRef error: ${err.name}: ${err.message}`});
            reject(err);
          });
      }).catch(err => {
        win.def.log({ level: 'error', file: 'model/json', func: 'restoreJsonToDb', message: `getFileStats error ${err.name}: ${err.message}`});
        reject(err);
      });
    }).catch(err => {
      win.def.log({ level: 'error', file: 'model/json', func: 'restoreJsonToDb', message: `readRef error ${err.name}: ${err.message}`});
      reject(err);
    }); /// catch readRef
    }); /// Promise
  }     /// restoreJsonToDb

  /**
   * Iterates all Files in json.dir
   * 
  **/
  
  async restoreAllJsonToDb() {
    return new Promise((resolve, reject) => {
      
      fsp.readdir(config.json.dir).then(filenames => {
        var result = {
          success : 0,
          error : []
        };

        Promise.all(filenames.map(async (filename) => {
          try {
            var res = await this.restoreJsonToDb(filename);
            result.success++;
          } catch (err) {
            result.error.push(err);
          }
        })).then(r => {
          win.def.log({ level: 'info', file: 'model/json', func: 'restoreAllJsonToDb', message: `Success ${result.success}, Errors ${result.error.length}`});
          resolve(result);
        });
      }).catch(err => {
        win.def.log({ level: 'error', file: 'model/json', func: 'restoreAllJsonToDb', message: `readdir error ${err.name}: ${err.message}`});
        reject(err);
      });
    });
  }



  /**
   * Saves a single Record in Json format to disk
   * @param{obj}  - (Object representing Reference record)
   * @param{name} - (File name [.json will be added]: Pubmed-id)
   * @returns{Promise}
   **/
  writeSingleJson = async (obj, name) => {
    let filename = path.join(config.json.dir, name + '.json');
    /// Include spacer for readability
    let js = JSON.stringify(obj, null, 2);
    return fsp.writeFile(filename, js)
      .then(() => {
        ++this.#nFiles;
        console.log(`[json.js] File ${p} written.`.brightYellow)
      })
      .catch(reason => {
        console.log('[model/json.js] writeSingleJson: writeFile Rejected: %s'.brightRed, reason)
      });
  }

  /**
   * Writes a small number of reference objects to disk
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
  getFileNames = async () => { return fsp.readdir(config.json.dir); }
  
}

const json = new JsonRepository;

module.exports = {
  repo : json
}
/// //////////////////////////////////////////////////////////////// ///
/// End of file
/// //////////////////////////////////////////////////////////////// ///
