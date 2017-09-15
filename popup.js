
/*
   Popup script gets executed when the user clicks on the extension icon in the toolbar. 
   It is the main script which controls all the other parts, gathering data before downloading the assets.

   - ask content script to download the "Dynamic Paths" CSV file
   - listen for 'complete' message from background script to indicate CSV has finished downloading
   - request number of checked/selected rows from content script
   - request the folder details for each one of those rows from content script
   - prompt the user to select the downloaded CSV file, in order to read the contents
   - merge the folder base paths from the content script, with the asset paths from the CSV file
   - download the assets to the Downloads folder
*/

window.onload = function() {

	var allCheckedCreativesClicked = false;
	var numberOfCheckedCreatives;
	var basePaths = [];
	var assetList = [];
	var inputbutton = document.getElementById('inputButton');
	var fileDisplayArea = document.getElementById('list');

	downloadCSV();

	/* 
	** Listen for messages being sent from other parts of the extension. 
	** Analyse the request and direct it to appropriate function.
	*/
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
		// If the message text is 'complete', the background.js script is letting you know the CSV file has finished downloading.
		if(request.message === "complete"){
			// If you have not yet got the folder name and base path for all the checked rows, request the next row to be clicked.
			if (allCheckedCreativesClicked == false){
		  		getCheckedCreatives();
		  	} else {
		  		chrome.extension.sendMessage({message: "showDownloadsFolder"});
		  	}
		} else {
			// The content script is sending you details for the currently highlighted row. 
			// Log it and request the next one if required.
		  	basePaths.push(request.message);
		  	if(basePaths.length < numberOfCheckedCreatives.length){
		    	getFolderDetails();
		    } else {
		    	// reset things because you're finished
		    	numberOfCheckedCreatives = 0;
		    	// set a flag to say you've got all of the folder details you need
		    	allCheckedCreativesClicked = true;
		    	// and show the button to allow user to select the downloaded csv file
		    	document.getElementById("wait").classList.add("hidden");
		    	document.getElementById("csvDownloaded").classList.remove("hidden");
		    }
		  }
	});

	/* 
	** Listen for changes to the input button. When the user has selected the download button, read the file contents.
	*/
	inputbutton.addEventListener('change', function(){
		// Get the file the user just selected
		var file = inputbutton.files[0];
	 	// Read the contents of the file to get the list of assets you need to download
	 	var reader = new FileReader();
	 	reader.readAsText(file);
	 	// When the file contents have been read, start parsing the file contents to make an array you can easily work with
		reader.onload = function(e) {
		  var fileContents = reader.result;
		  var fileContentsSplitIntoArray = CSVToArray(fileContents, ",");
		  fileContentsSplitIntoArray.forEach(function(element){
		  	assetList.push(element[0]);
		  });
		  // for some reason an empty element gets put on the end. remove it so you can work with the array properly
		  assetList.pop(); 
		  // You now have the elements you need (CSV file contents, folder names and folder base paths)
		  // to create the urls for Chrome to download. Go and create them.
		  createUrls();
		}
	});

	// function showDownloadsFolder(){
	// 	chrome.extension.sendMessage({message: "showDownloadsFolder"});
	// }

	/*
	** Asks the content script to start the "Dynamic paths" CSV file downloading
	*/
	function downloadCSV(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		  	// chrome.tabs.sendMessage(tabs[0].id, {action: "downloadCSV"});
		  	ensureSendMessage(tabs[0].id, {action: "downloadCSV"});
		});
	}

	function ensureSendMessage(tabId, message, callback){
	  chrome.tabs.sendMessage(tabId, {ping: true}, function(response){
	    if(response && response.pong) { // Content script ready
	    	console.log("Response received. Content script ready. Sending message.");
	      chrome.tabs.sendMessage(tabId, message, callback);
	    } else { // No listener on the other end
	    	console.log("Nothing received. Injecting Content script before sending message.");
	      chrome.tabs.executeScript(tabId, {file: "content.js"}, function(){
	        if(chrome.runtime.lastError) {
	          throw Error("Unable to inject script into tab " + tabId);
	        }
	        // OK, now it's injected and ready
	        console.log("Script has now been injected but it's still not responding to messages.")
	        chrome.tabs.sendMessage(tabId, message, callback);
	      });
	    }
	  });
	}

	/*
	** Asks the content script to find out which rows the user has ticked to download (E.G. 120x600, 728x90)
	*/
	function getCheckedCreatives(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		  chrome.tabs.sendMessage(tabs[0].id, {action: "getCheckedCreatives"}, function(response) {
		    numberOfCheckedCreatives = response.response;
		    getFolderDetails();
		  });
		});
	}

	/*
	** Ask the content script to get the folder details (Folder Name and Folder Base Path) for the currently highlighted row.
	** This function gets called as many times as necessary to get the details for each of the rows the user has selected.
	*/
	function getFolderDetails(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		  chrome.tabs.sendMessage(tabs[0].id, {action: "getFolderDetails"});
		});
	}

	/*
	** You now have the list of paths from the csv file, and the folder base paths from the page. 
	** Merge them and create urls for Chrome to download
	*/
	function createUrls(){
		var downloadUrls = [];
		// Start with the base path for the first row you checked (E.G. 120x600)
		for (currentBasePath = 0; currentBasePath < basePaths.length; currentBasePath++){
			// Then loop over all the assets from the file and if their folder name matches, join them to create a full url
			for(i = 0; i < assetList.length; i++){
				var asset = assetList[i];
				var folderName = basePaths[currentBasePath][0];
				var basePath = basePaths[currentBasePath][1];

				if(asset.includes(folderName)){
					var assetStripped = asset.split("/").pop();
					var url = basePath + assetStripped;

					downloadUrls.push({
						url: url,
				  	 	filename: asset
					})
				}
			}
		}

		// Loop over your array of download urls (each one representing an asset) sending them to Chrome to download
		for(i = 0 ; i < downloadUrls.length ; i++){
	  		var downUrl = downloadUrls[i].url;
	  		var filename = downloadUrls[i].filename;
	  		chrome.downloads.download({
				url: downUrl,
				filename: filename
			});
	  	}

	  	document.getElementById("csvDownloaded").classList.add("hidden");
		document.getElementById("complete").classList.remove("hidden");
	}

	/*
	** Process the CSV file and create an array from its contents
	*/
	function CSVToArray( strData, strDelimiter ){
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );

        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }

            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return( arrData );
    }
};
