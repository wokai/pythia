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
/// https://www.ncbi.nlm.nih.gov/pmc/tools/id-converter-api/
/// ////////////////////////////////////////////////////////////////////////////

(function(angular) {
'use strict';

var app = angular.module('globalModule');



/// ////////////////////////////////////////////////////////////////////////////
app.factory('EntrezService', function($http) {

  /// //////////////////////////////////////////////////////////////////////////
  
  var pubMed = {
    uids: [],
    refs: []
  }
  
  let twoStepPubMed = {
    contained: [],
    unknown: [],
    entrez: []
  }
  
  var localPubMed = {
    filenames: [],
    refs: []
  }
  
  var dbPubMed = {
    pmids: []
  }
  
  /// Contains result of queryTitles or queryPmid
  var qryResult = {
    documents: []
  }
  
  
  /// //////////////////////////////////////////////////////////////////////////
  /// Process author names
  /// //////////////////////////////////////////////////////////////////////////
  
  /// Split name and provide lastname and firstnames
  /// and re-assemble in BibTex style
  /// @param{data}-(object: contains authors member)
  var processAuthorNames = function(data){
    
    data.authors = data.authors.map(a => {
      if(a.authtype == "Author") {
        /// Split name at any number of white spaces
        /// "name": "Anders Johnson AA"        
        let name = a.name.split(/\s+/);
        
        if(name.length > 1) {
          let initiales = name.pop();
          
          /// Re-assemble last names
          a.lastname = name.join("");
                    
          /// Convert into array of initiales
          a.firstnames = Array.from(initiales);  
        } else {
          /// No white spaces
          a.lastname = a.name;
          a.firstnames = [];
        }
      } else {
        /// Example: "CollectiveName"
        
        /// Remove trailing period
        if (a.name[a.name.length-1] === ".")
          a.name = a.name.slice(0,-1);
        
        a.lastname = a.name;
        a.firstnames = [];
      }
      return a;
    });
      
    /// Construct author string in bibtex style
    const authorlist = data.authors.map(author => 
      { 
        if(author.firstnames.length) {
          return author.lastname + ', ' + author.firstnames.join('. ') + '.'
        } else {
          return author.lastname;
        }
      });
    data.author = authorlist.join(' and ');
  }
  
 
  
  var queryPmid = function(pmid) {
    var qry  = {
      search : pmid
    }
    
    $http.post('/db/query/pmid', qry)
      .then(function(response) {
        processAuthorNames(response.data);
        qryResult.documents = [];
        qryResult.documents.push(response.data);
        
        console.log('[EntrezService.queryPmid] Received id ', response.data._id, ', issue: ', response.data.issue)
        console.log('[EntrezService.queryPmid] First author: ', response.data.authors[0].lastname)
        
      }, function(response){
        console.log('[EntrezService.queryPmid] Notification: ', response)
      })
      .catch(function(error){
        console.log('[EntrezService.queryPmid] Error ' + error);
      })
  }
  
  var queryTitles = function(title, type = "text"){
    
    var qry = {
      search : title,
      type : type       // 'text' or 'phrase'
    }
    
    $http.post('/db/query/title', qry).then(function(response){
      
      response.data.forEach(processAuthorNames);
      qryResult.documents = response.data;
      console.log('[EntrezService.queryTitles] Returned %i documents.', response.data.length);
    }, function(response){
      console.log('[EntrezService.queryTitles] Notification: ', response);
    }).catch(function(error){
      console.log('[EntrezService.queryTitles] Error: ' + error);
    });
  }
  
  var queryAuthors = function(author){
    var qry = {
      search : author
    }
    
    $http.post('/db/authors', qry).then(function(response){
      response.data.forEach(processAuthorNames);
      qryResult.documents = response.data;
      console.log('[EntrezService.queryAuthors] Returned %i documents.', response.data.length);
    }, function(response){
      console.log('[EntrezService.queryAuthors] Notification: ', response);
    }).catch(function(error){
      console.log('[EntrezService.queryAuthors] Error: ' + error);
    });
  }
  
  
  var getDbPubMedIds = function(){
    $http.get('/db/pmids').then(function(response) {
      dbPubMed.pmids = response.data.pmids;
    }, function(response){
      console.log('[EntrezService.getDbPubMedIds] Notification: ', response); 
    }).catch(function(error) {
      console.log('[EntrezService.getDbPubMedIds] Error: ' + error); 
    });
  }
  getDbPubMedIds();
  
  var postDatabase = function(d){
    $http.post('/db/insert', d).then(function(response) {
      console.log('[EntrezService.postDatabase] success. Id: %s', response.data); 
    }, function(response){
      console.log('[EntrezService.postDatabase] Notification: ', response);
    }).catch(function(error){
      console.log('[EntrezService.postDatabase] Error: ' + error);
    });
  }
  
  var transferRecord = function(pmid){
    
    var data = {
      pmid: pmid
    };
    
    $http.post('/db/file', data).then(function(response) {
      console.log('[EntrezService.transferRecord] success. Id: %s', response.data); 
    }, function(response){
      console.log('[EntrezService.transferRecord] Notification: ', response);
    }).catch(function(error){
      console.log('[EntrezService.transferRecord] Error: ' + error);
    });
  }
  
  /// //////////////////////////////////////////////////////////////////////////
  ///  Query Entrez for Pubmed-ID's via local endpoint
  /// //////////////////////////////////////////////////////////////////////////
  var queryEntrez = function(p){
    var data = {
      pmid: p
    };
    
    $http.post('/entrez/', data).then(function(response){

      // Clear article array
      pubMed.refs.length = 0; 
      // Raw object
      //$scope.entrez = response.data.result;
      // uids property contains array of received pmid's
      pubMed.uids = response.data.result.uids;
      // Populate elements array
      pubMed.uids.forEach(function(uid) {
        processAuthorNames(response.data.result[uid]);
        pubMed.refs.push(response.data.result[uid]);
      });
      console.log('[EntrezService.queryEntrez]  %i elements processed.', pubMed.uids.length);
    }, function(response) {
      console.log('[EntrezService.queryEntrez] Notification: ', response)
    }).catch(function(error){
      console.error('[EntrezService.queryEntrez] Error: ' + error);
    });
  }
  
  /// //////////////////////////////////////////////////////////////////////////
  ///  Query Entrez for Pubmed-ID's via local endpoint
  /// //////////////////////////////////////////////////////////////////////////
  var queryTwoStep = function(p){
    var data = {
      pmid: p
    };
    
    $http.post('/entrez/twostep', data).then(function(response){

      /// Clear data
      twoStepPubMed.contained.length = 0;
      twoStepPubMed.unknown.length = 0;
      twoStepPubMed.entrez.length = 0;

      twoStepPubMed.contained.push(...response.data.contained);
      twoStepPubMed.unknown.push(...response.data.unknown);
      twoStepPubMed.entrez.push(...response.data.entrez);

      twoStepPubMed.contained.forEach(c => processAuthorNames(c));
      twoStepPubMed.entrez.forEach(e => processAuthorNames(e));
    }, function(response) {
      console.log('[EntrezService.queryTwoStep] Notification: ', response)
    }).catch(function(error){
      console.error('[EntrezService.queryTwoStep] Error: ' + error);
    });
  }
 
  var getLocalRef = function(){
    var url = '/local/paths';
    $http.get(url).then(function(response){
      // Raw object
      localPubMed.filenames.length = 0;
      Array.prototype.push.apply(localPubMed.filenames, response.data);
    }, function(result){
      console.info('[EntrezService.getLocalRef] Notification');
      }, function(result){
    }).catch(function(error){
      console.error('[EntrezService.getLocalRef] Error: ' + error);
    });
  }
 
  var clearFileRef = function(){
    localPubMed.refs.length = 0;
  }
  
  var getFileRef = function(filename){
    let pmid = filename.replace(/\.[^/.]+$/, "")    
    $http.get('/local/' + pmid).then(function(response){
      processAuthorNames(response.data);
      localPubMed.refs.push(response.data);
    }, function(result){
      console.info('[EntrezService.getFileRef] Notification');
      }, function(result){
      console.error('[EntrezService.getFileRef] Error: ' + result);
    }).catch(function(error){
      console.error('[EntrezService.getFileRef] Error: ' + error);
    });
  }
  
  var checkPdfAccess = function(filename) {
    return $http.get('/local/exists/' + filename)
  }
    
    
  return {
    checkPdfAccess: checkPdfAccess,
    clearFileRef: clearFileRef,
    dbPubMed: dbPubMed,
    getDbPubMedIds: getDbPubMedIds,
    getLocalRef: getLocalRef,
    getFileRef: getFileRef,
    localPubMed: localPubMed,
    postDatabase: postDatabase,    
    pubMed : pubMed,
    queryEntrez: queryEntrez,
    queryTitles: queryTitles,
    queryTwoStep: queryTwoStep,
    queryPmid: queryPmid,
    queryAuthors: queryAuthors,
    qryResult: qryResult,
    transferRecord: transferRecord,
    twoStepPubMed: twoStepPubMed
  }
});                   /// EntrezService
})(window.angular);   /// function(angular)

