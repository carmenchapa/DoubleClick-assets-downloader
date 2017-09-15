
/*
** Listen for the message from the popup to open the downloads folder when done
*/
chrome.extension.onMessage.addListener( function(request,sender,sendResponse){
  if( request.message === "showDownloadsFolder" ){
    chrome.downloads.showDefaultFolder();
  }
});

/*
** Monitor all changes to the downloads folder. When you detect a completed download, alert the popup.
*/
chrome.downloads.onChanged.addListener(function(delta){
  if (delta.state && delta.state.current === "complete") {
  	// downloadItemID = delta.id;
  	// downloadItem = chrome.downloads.search({
	  //   query: [downloadItemID]
	  // }, function(){});
  	// console.log();
    chrome.runtime.sendMessage({message: "complete"});
  }
});