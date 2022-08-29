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

/// ////////////////////////////////////////////////////////////////////////////
/// 
/// ////////////////////////////////////////////////////////////////////////////

const colors    = require('colors');
const path      = require('path');
const fs        = require('fs');

const config = require(path.join(__dirname, '..', 'config', 'config'));


class JsonRepository {
  
  #nFiles
  
  constructor(){
    this.#nFiles = 0;
  }
   
  
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
    return fs.promises.writeFile(filename, js)
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


}

const json = new JsonRepository;

module.exports = {
  json : json
}

