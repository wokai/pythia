/*******************************************************************************
 * The MIT License
 * Copyright 2020, Wolfgang Kaisers
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
  var processAuthorNames = function(data){
    data.authors = data.authors.map(a => {
      /// Split name at any number of white spaces
      /// "name": "Andersson ML"
      let name = a.name.split(/\s+/);
      a.lastname = name[0];
      /// Convert to character array
      a.firstnames = Array.from(name[1]);
      return a;
      });
      
    /// Construct author string in bibtex style
    const authorlist = data.authors.map(author => 
      { return author.lastname + ', ' + author.firstnames.join('. ') + '.'});
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
      console.log('[EntrezService.getDbPubMedIds] Success.');
      //console.log(response.data.pmids);
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
    
    /// Restore: remove /diff
    $http.post('/entrez/diff', data).then(function(response){

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
 
  var getLocalRef = function(){
    var url = '/local';
    $http.get(url).then(function(response){
      // Raw object
      console.log(response.data);
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
  
  var getFileRef = function(pmid){
    $http.get('/local/' + pmid).then(function(response){
      //localPubMed.refs.length = 0;
      localPubMed.refs.push(response.data);
    }, function(result){
      console.info('[EntrezService.getFileRef] Notification');
      }, function(result){
    }).catch(function(error){
      console.error('[EntrezService.getFileRef] Error: ' + error);
    });
  }
    
    
  return {
    pubMed : pubMed,
    queryEntrez: queryEntrez,
    localPubMed: localPubMed,
    clearFileRef: clearFileRef,
    getLocalRef: getLocalRef,
    getFileRef: getFileRef,
    postDatabase: postDatabase,
    transferRecord: transferRecord,
    getDbPubMedIds: getDbPubMedIds,
    dbPubMed: dbPubMed,
    queryTitles: queryTitles,
    queryPmid: queryPmid,
    queryAuthors: queryAuthors,
    qryResult: qryResult
  }
});                   /// EntrezService
})(window.angular);   /// function(angular)
