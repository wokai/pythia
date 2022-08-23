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

(function(angular) {
'use strict';

var app = angular.module('globalModule');

/// ////////////////////////////////////////////////////////////////////////////
app.factory('SessionService', function($http) {
  
  var global = {
    config : {}
  }
  
  var getGlobalConfig = function(){
    $http.get('/config').then(function(response){
        global.config = response.data;
      }, function(repsonse) {
        console.log('[getGlobalConfig] Notification: ', response)
    }).catch(function(error) {
      console.log('[getGlobalConfig] Error: ', error.message);
    });
    
  }
  getGlobalConfig();
  
  return {
    global: global
  }
});                 /// SessionService

app.component('sessionConfig', {
  templateUrl: 'sessionConfig.html',
  controller: function(SessionService) {
    this.global = SessionService.global;
  }
});

})(window.angular); /// function(angular)

