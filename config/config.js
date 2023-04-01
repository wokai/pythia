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
 
const path = require('path');


const config = {
  database: {
    "url" : 'mongodb://localhost:27017',
    "dataBaseName" : "entrez",
    "collectionName" : "pubmed",
    "dbUserName" : "mongo-database-user-name",
    "dbUserPassword" : "mongo-user-password"
  },
  pdf: {
    "base" : "path/to/pdf/files"
  },
  json: {
    dir : path.join(__dirname, 'json')
  },
  pubmed: {
    "baseUrl" : "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=",
    "example" : "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=23819905,23819906",
    "refsnp"  : "https://api.ncbi.nlm.nih.gov/variation/v0/beta/refsnp/17775810",
    "convert" : "https://www.ncbi.nlm.nih.gov/pmc/tools/id-converter-api/"
  },
  pmc: {
    "baseUrl" : "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&retmode=json&id=",
    "example" : "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&retmode=json&id=2048009"
  },
  europe: {
    "baseUrl" : ""
  }
};


try {
  let local = require("./local.config");
  
  /// Copy values
  config.database = local.database;
  config.pdf = local.pdf;
  config.json = local.json;
  
} catch(e) {
  console.log(e);
  console.log('[config/config] No local-config.js found. Using default values'.brightYellow);
}


module.exports = Object.freeze(config);


