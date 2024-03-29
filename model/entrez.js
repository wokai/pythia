'use strict';
/*******************************************************************************
 * The MIT License
 * Copyright 2023, Wolfgang Kaisers
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
const fetch     = require('node-fetch');
const fs        = require('fs/promises');
const { XMLParser } = require("fast-xml-parser");

const config    = require(path.join(__dirname, '..', 'config', 'config'));
const win       = require(path.join(__dirname, '..', 'logger', 'logger'));

/// ////////////////////////////////////////////////////////////////////
/// Documentation
/// https://www.ncbi.nlm.nih.gov/books/NBK25499/
///
/// BaseURl:
/// https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
/// ////////////////////////////////////////////////////////////////////

class Entrez {
  
  constructor(){}
  
  
  /**
   * @param{obj}  - (object: Entrez record)
   * @param{name} - (string: Basename of file)
   * @returns{promise}
   **/
  writeJson = async (obj, name) => {
    let filename = path.join(config.json.dir, name + '.json');
    
    /// //////////////////////////////////////////////////////////////////////////
    /// Object validation
    /// Failing validation will impede insertion into MongoDb collection
    /// //////////////////////////////////////////////////////////////////////////
    if(!obj.hasOwnProperty('title')){
      win.def.log({ level: 'warn', file: 'model/entrez', func: 'writeJson', message: `Required property *title* not found`});
      throw new Error('[model/entrez.writeJson] Required property *title* not found.'); 
    }
    /// Include spacer for readability
    let js = JSON.stringify(obj, null, 2);
    return fs.writeFile(filename, js);
  }
    
  
  /**
   * @param{pmids}     - (Array with Pubmed-Id's)
   * @returns{Promise} - (Array with Pubmed objects)
   **/
  fetch = async (pmids) => {
    let url = config.pubmed.baseUrl + pmids.join();
    console.log(`[model/entrez] Fetching ${pmids.length} datasets:${pmids.join()} `.green);
    console.log(`[model/entrez] POST url: ${url}`.blue);
    return fetch(url).then(res => res.json())
      .then(json => {
          if(json.result !== undefined){
            let pmids = json.result.uids;
            let a = [];
            win.def.log({ level: 'info', file: 'model/entrez', func: 'fetch', message: `Received pmid's:  ${pmids.join()}`});
            pmids.forEach(p => { 
              a.push(json.result[p]);
              this.writeJson(json.result[p], p)
              .then(() => { 
                win.def.log({ level: 'info', file: 'model/entrez', func: 'fetch', message: `File ${p} written.`});
              })
              .catch(reason => {
                win.def.log({ level: 'warn', file: 'model/entrez', func: 'writeJson', message: `Rejected: ${reason}`});
                console.log(`[model/entrez] writeJson Rejected: ${reason}`.brightRed)
               });
            });
            return a;            
          } else {
            win.def.log({ level: 'info', file: 'model/entrez', func: 'fetch', message: `No result returned (host unreachable?)`});
            console.log(`[model/entrez] No result returned (host unreachable?)`.brightYellow);
          }
      })
  }
  
  fetchDbNames = async () => {
    return fetch(config.entrez.baseUrl)
     .then(res => res.text())
     .then(res => {
          const parser = new XMLParser();
          const dbList = parser.parse(res);
          return dbList.eInfoResult.DbList.DbName;
        })
  }
}

const entrez = new Entrez;

module.exports = {
  entrez : entrez
}

