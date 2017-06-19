
// Called when the user clicks on the browser action
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(null, {file: "download_assets.js"});
});

// Called when download_assets.js sends a message back to this script
// Loops through the array of assets to download them
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	var assetsToDownload = request;
  	for(i = 0 ; i < assetsToDownload.length ; i++){
  		var url = assetsToDownload[i].url;
  		var filename = assetsToDownload[i].filename;
  		chrome.downloads.download({
			url: url,
			filename: filename
		});
  	}
});
