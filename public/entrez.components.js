/*******************************************************************************
 * The MIT License
 * Copyright 2021, Wolfgang Kaisers
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

(function(angular) {
'use strict';

var app = angular.module('globalModule');

app.component('twoStepQuery', {
  bindings: { 
    out: '&'
  },
  templateUrl: 'twoStepQuery.html',
  controller: function($scope, $element, EntrezService){
    
    console.log('[twoStepQuery.component] controller.');
    
    var preprocess = function(x) {
      x = x.trim();
      // Replace all commas by empty space
      x = x.replace(/,/g, ' ');
      // Replace multiple empty spaces (tabs, ...) with one space
      x = x.replace(/\s\s+/g, ' ');
      // Split string into array
      var a = x.split(' ');
      // Parse array elements to Integer
      a = a.map(x => Number.parseInt(x));
      // Remove NaN (non integral)
      return a.filter(x => !Number.isNaN(x));
    }
    
    this.doQuery = function() {
      EntrezService.queryTwoStep(preprocess(this.qry));
    }
    
    this.clear = function() {
      this.qry = '';
      $element.find('input').focus();
    }
  }
});

app.component('titleQuery', {
  templateUrl: 'titleQuery.html',
  controller: function($scope, $element, EntrezService){
    
    
    this.submit = function() {
      EntrezService.queryTitles(this.qry);
    }
    
    this.clear = function() {
      this.qry = '';
      $element.find('input').focus();
    }
  }
});

app.component('pmidDbQuery', {
  templateUrl: 'pmidDbQuery.html',
  controller: function($scope, $element, EntrezService){
    
    this.dbPubMed = { pmids: [] }
    this.$onInit = function() {  this.dbPubMed = EntrezService.dbPubMed; }
    
    this.submit = function(){
      let pmid = Number.parseInt(this.qry);
      if(Number.isNaN(pmid)){
        console.log('[pmid-db-query] Query "%s" is not numeric.', this.qry)
      } else {
        EntrezService.queryPmid(pmid.toString())
      }
    }
    
    this.clear = function(){ this.qry = '' }
  }
});

app.component('authorDbQuery', {
  templateUrl: 'authorDbQuery.html',
  controller: function($scope, $element, EntrezService){
    this.submit = function(){
      EntrezService.queryAuthors(this.qry);
    }
    this.clear = function(){ this.qry = '' }
  }
});


app.component('pmidSelector', {
  templateUrl: 'pmidSelector.html',
  controller: function(EntrezService){
    this.dbPubmed = EntrezService.dbPubMed;
  }
});


// https://stackoverflow.com/questions/34071097/angularjs-binding-a-javascript-object-to-a-directive-attribute
app.component('bibTexItem',{
  templateUrl: 'bibTexItem.html',
  bindings: { data: '='},
  controller : function(){
    const ctrl = this;
    this.$onInit = function() {
      
      let doc = this.data.doc;
      const authorlist = doc.authors.map(author => 
        { return author.lastname + ', ' + author.firstnames.join('. ') + '.'});
      
      this.id = doc.uid;
      this.author = authorlist.join(' and ');
      this.title = doc.title;
      this.journal = doc.fulljournalname;
      this.year = doc.pubdate.substring(0, 4);
      this.volume = doc.volume;
      this.number = doc.issue;
      this.pages = doc.pages;
      this.month = doc.pubdate.substring(5);
      this.firstAuthor = doc.authors[0].lastname;
    }
  }
});

app.component('pmidDetail', {
  templateUrl: 'pmidDetail.html',
  bindings: {
    data: '='
  },
  controller: function(EntrezService){
    const ctrl = this;
    
    ctrl.refElem = '(empty)';
    ctrl.bibTexElem = '(empty)';
    ctrl.postDatabase = EntrezService.postDatabase;
    
    function prepareReferenceElement(){
      
      if(ctrl.data.error){
        ctrl.refElem = 'Error: ' + ctrl.data.error;
        return;
      }
      
      // Compose 
      // <ref name="..."> ... </ref> 
      // reference element for use as mediawiki reference
      
      // Pubmed-id
      const pmid = ctrl.data.uid;
      
      // Left element delimiter including name attribute
      const left_delim = '<ref name="pmid' + pmid + '">';
      
      // Reference element
      var ref_elem = ctrl.data.title + ' ' + ctrl.data.fulljournalname + '. ' + ctrl.data.pubdate + '; ' + ctrl.data.volume;
      
      // Add issue when present
      if(ctrl.data.issue & ctrl.data.issue.length > 0){
        ref_elem = ref_elem + '(' + ctrl.data.issue + ')';
      }
      ref_elem = ref_elem + '. p.' + ctrl.data.pages;
      
      // Link of reference on Pubmed Server
      const pmid_link = ' [https://www.ncbi.nlm.nih.gov/pubmed/' + pmid + ' PubMed ' + pmid + '] ';
      
      // Link to pdf in local directory
      const pdf_link = '[http://{{SERVERNAME}}/lit/' + pmid + '.pdf PDF]';
      
      // Right element delimiter
      const right_delim = '</ref>';
      
      // Copy composition to property
      ctrl.refElem = left_delim + ref_elem + pmid_link + pdf_link + right_delim;
    }
    
    function prepareBibTexElement(){
      
      if(ctrl.data.error){
        ctrl.bibTexElem = 'Error: ' + ctrl.data.error;
        return;
      }
      
      const prefix = '@Article{pmid' + ctrl.data.uid + ',\n\t';
      const title = 'Title="{' + ctrl.data.title + '}",\n\t';
      const journal = 'Journal={' + ctrl.data.fulljournalname + '},\n\t';
      const year = 'Year="' + ctrl.data.pubdate.substring(0, 4) + '",\n\t';
      const volume = 'Volume="' + ctrl.data.volume + '",\n\t';
      const number = 'Number="' + ctrl.data.issue + '",\n\t';
      const pages = 'Pages="' + ctrl.data.pages + '",\n\t';
      const month = 'Month="' + ctrl.data.pubdate.substring(5) + '"\n}'; 
      
           
      const authorlist = ctrl.data.authors.map(author => { return author.lastname + ', ' + author.firstnames.join('. ') + '.'});
      const author = 'Author="' + authorlist.join(' and ') + '",\n\t';
      
      ctrl.bibTexElem = prefix + author + title + journal + year + volume + number + pages + month;
    }
    
    
    // Lifecycle hook of component: Called on each digest cycle
    ctrl.$doCheck = function() { 
      prepareReferenceElement();
      prepareBibTexElement();
    }
    
  }
});

app.component('twoStepDetail', {
  templateUrl: 'twoStepDetail.html',
  bindings: {
    data: '='
  },
  controller: function(EntrezService){
    const ctrl = this;
    
    ctrl.refElem = '(empty)';
    ctrl.bibTexElem = '(empty)';
    
    function prepareReferenceElement(){
      
      if(ctrl.data.error){
        ctrl.refElem = 'Error: ' + ctrl.data.error;
        return;
      }
      
      // Compose 
      // <ref name="..."> ... </ref> 
      // reference element for use as mediawiki reference
      
      // Pubmed-id
      const pmid = ctrl.data.uid;
      
      // Left element delimiter including name attribute
      const left_delim = `<ref name="pmid${pmid}">`;
      
      // Reference element
      var ref_elem = ctrl.data.title + ' ' + ctrl.data.fulljournalname + '. ' + ctrl.data.pubdate + '; ' + ctrl.data.volume;
      
      // Add issue when present
      if(ctrl.data.issue & ctrl.data.issue.length > 0){
        ref_elem = ref_elem + '(' + ctrl.data.issue + ')';
      }
      ref_elem = ref_elem + '. p.' + ctrl.data.pages;
      
      // Link of reference on Pubmed Server
      const pmid_link = ' [https://www.ncbi.nlm.nih.gov/pubmed/' + pmid + ' PubMed ' + pmid + '] ';
      
      // Link to pdf in local directory
      const pdf_link = '[http://{{SERVERNAME}}/lit/' + pmid + '.pdf PDF]';
      
      // Right element delimiter
      const right_delim = '</ref>';
      
      // Copy composition to property
      ctrl.refElem = left_delim + ref_elem + pmid_link + pdf_link + right_delim;
    }
    
    function prepareBibTexElement(){
      
      if(ctrl.data.error){
        ctrl.bibTexElem = 'Error: ' + ctrl.data.error;
        return;
      }
      
      const prefix = '@Article{pmid' + ctrl.data.uid + ',\n\t';
      const title = 'Title="{' + ctrl.data.title + '}",\n\t';
      const journal = 'Journal={' + ctrl.data.fulljournalname + '},\n\t';
      const year = 'Year="' + ctrl.data.pubdate.substring(0, 4) + '",\n\t';
      const volume = 'Volume="' + ctrl.data.volume + '",\n\t';
      const number = 'Number="' + ctrl.data.issue + '",\n\t';
      const pages = 'Pages="' + ctrl.data.pages + '",\n\t';
      const month = 'Month="' + ctrl.data.pubdate.substring(5) + '"\n}'; 
      
      /// Requires preprocessing of author names in entrez.service
      const authorlist = ctrl.data.authors.map(author => { return author.lastname + ', ' + author.firstnames.join('. ') + '.'});
      const author = 'Author="' + authorlist.join(' and ') + '",\n\t';
      
      ctrl.bibTexElem = prefix + author + title + journal + year + volume + number + pages + month;
    }
    
    
    // Lifecycle hook of component: Called on each digest cycle
    ctrl.$doCheck = function() { 
      prepareReferenceElement();
      prepareBibTexElement();
    }
    
  }
});


app.directive('ngEnter', function () {
  return function (scope, element, attrs) {
    element.bind("keydown keypress", function (event) {
      if (event.which === 13) {
        scope.$apply(function () {
          scope.$eval(attrs.ngEnter);
        });
        event.preventDefault();
      }
    });
  };
});



})(window.angular);
