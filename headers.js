// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var tabId = parseInt(window.location.search.substring(1));

window.addEventListener("load", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.onEvent.addListener(onEvent);
});

window.addEventListener("unload", function() {
  chrome.debugger.detach({tabId:tabId});
});

//object to store requests
var requests = {};

function onEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
    return;
  else if (message == "Network.requestWillBeSent") {
    onRequestSent(params)
  } else if (message == "Network.responseReceived" && params.response.url.includes("bolt.com")){  
    onResponseReveived(params)
  }
}

function appendResponse(requestId, response) {
  var requestDiv = document.getElementById(requestId);
  var statusLine = document.createElement("h3");
  console.log(response)
  var statusText = response.status == 200 ? 'OK' : response.statusText;
  var className = response.status > 199 && response.status < 300 ? "success"
  : response.status > 399 ? "error"
  : "other"

  statusLine.textContent = `${response.status} ${statusText}` ;
  statusLine.className = className;
  requestDiv.appendChild(statusLine);
  requestDiv.appendChild(formatHeaders(response.headers));
}

function formatHeaders(headers) {
  var headerList = document.createElement("ul")
  var htmlString = ``
  for (h in headers){
    htmlString += `<li>${h}</li>`
  }
  headerList.innerHTML = htmlString
  return headerList;
}

function formatPostData(request) {
    var textArea = document.createElement("textarea")
    var jsonObj = JSON.parse(request.postData);
    var jsonStr = JSON.stringify(jsonObj,null,'\t')
    textArea.innerHTML = jsonStr;
    return textArea;
}

function parseURL(url) {
  var result = {};
  var match = url.match(
      /^([^:]+):\/\/([^\/:]*)(?::([\d]+))?(?:(\/[^#]*)(?:#(.*))?)?$/i);
  if (!match)
    return result;
  result.scheme = match[1].toLowerCase();
  result.host = match[2];
  result.port = match[3];
  result.path = match[4] || "/";
  result.fragment = match[5];
  return result;
}

function onResponseReveived(params) {
  appendResponse(params.requestId, params.response);
}

function onRequestSent(params) {
    
   // check to see if the request is from Bolt 
   if(params.request.url && params.request.url.includes("bolt.com")) {
     console.log("request params", params)
    //create a new div with the id of the request
    var requestDiv = document.createElement("div");
    requestDiv.className = "request";
    requestDiv.id=params.requestId
    //
    var urlLine = document.createElement("h2");
    urlLine.textContent = params.request.url;
    requestDiv.appendChild(urlLine);
  

  // create a new div for the request line and give it the 
  
  var requestLine = document.createElement("h3");

  requestLine.textContent = `${params.request.method} request sent to ${params.request.url}`

  requestDiv.appendChild(requestLine);
  if (params.request.hasPostData) {
    console.log('post data', params.request.postData)
    var postDataTitle = document.createElement("h3") 
    postDataTitle.innerText="Data included in POST request"
    requestDiv.appendChild(postDataTitle)
    requestDiv.appendChild(formatPostData(params.request))
  }
  document.getElementById("container").appendChild(requestDiv);
   }
}
