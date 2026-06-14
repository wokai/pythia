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

const Reference = require(path.join(__dirname, 'reference'));
const config    = require(path.join(__dirname, '..', 'config', 'config'));
const win       = require(path.join(__dirname, '..', 'logger', 'logger'));

/// ////////////////////////////////////////////////////////////////////
/// Europe-PMC
/// https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=p53&format=json
/// Query pubmed:
/// https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id:25404529&format=json
/// Query DOI
/// https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1007/bf00197367&format=json
///

/// URL Endoding 
/// https://www.eso.org/~ndelmott/url_encode.html

/// HELP: https://europepmc.org/help
/// PMIDs are unique when used in conjunction with a data source.
/// When searching for a PMID that yields more than one result, 
/// the data source can be specified to find the exact match.
/// Specifying the data source using the 'SRC:' search term, 
/// along with the PMID will find a unique result, 
/// https://europepmc.org/search?query=EXT_ID%3A526631%20AND%20SRC%3AMED
/// https://europepmc.org/search?query=ext_id%3a526631%20and%20src%3amed
/// https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id%3a526631%20and%20src%3amed&format=json
/// ////////////////////////////////////////////////////////////////////


class Europe {
  constructor(){}
  
  fetch = async (pmid) => {
    return new Promise((resolve, reject) => {
      pmid = parseInt(pmid);
      if(Number.isNaN(pmid)) {
        win.def.log({ level: 'warn', file: '/model/europe', func: 'fetch', message: `Argument ${pmid} is not an integer.`});
        reject({
          status: "Error",
          message: `Argument '${pmid}' is not an integer`
        });
      } else {
        const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id:${pmid}&format=json`;
        fetch(url).then(response => {
          if(!response.ok) {
            win.def.log({ level: 'warn', file: '/model/europe', func: 'fetch', message: `Status-Text: ${response.statusText}.`});
            // https://developer.mozilla.org/en-US/docs/Web/API/Response
            reject(response); 
          } else {
            resolve(response.json());
          }   /// if-else
        });   /// fetch.then
      }       /// else
    });       /// Promise
  }           /// fetch
  

  fetchReference = async (pmid) => {
    return new Promise((resolve, reject) => {
      pmid = parseInt(pmid);
      if(Number.isNaN(pmid)) {
        win.def.log({ level: 'warn', file: '/model/europe', func: 'fetchReference', message: `Argument ${pmid} is not an integer.`});
        reject({
          status: "Error",
          message: `Argument '${pmid}' is not an integer`
        });
      } else {
        const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id:${pmid}&format=json`;
        fetch(url).then(response => {
          if(!response.ok) {
            win.def.log({ level: 'warn', file: '/model/europe', func: 'fetchReference', message: `Status-Text: ${response.statusText}.`});
            // https://developer.mozilla.org/en-US/docs/Web/API/Response
            reject(response); 
          } else {
            response.json().then(json => {
              resolve(json.resultList.result[0]);
              //resolve(Response.fromEuropePmc(json.resultList.result[0]));
            });
          }   /// if-else
        });   /// fetch.then
      }       /// else
    });       /// Promise
  }       /// fetchReference
}

const europe = new Europe();

module.exports = {
  europe: europe
}
