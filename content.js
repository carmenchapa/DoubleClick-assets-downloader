
/*
** Content script executes on the DoubleClick page. 
** It can interact with the DOM and return data to other parts of the extension.
*/

window.onload = function() {

	console.log("Content Script running...");

	var detailsPanelChanged = false;
	var currentFolderName = "";
	var currentFolderBasePath = "";
	var checkedCreatives = [];
	var currentCheckedCreative = 0;
	var folderBasePath;

	addObserverIfDesiredNodeAvailable();

	/* 
	** Listen for messages being sent from other parts of the extension. 
	** Analyse the request and direct it to appropriate function.
	*/
	chrome.runtime.onMessage.addListener(
	  	function(request, sender, sendResponse) {
	  		if(request.ping) { sendResponse({pong: true}); return; }

		  	if (request.action == 'downloadCSV'){
		  		console.log("Content Script: Received message to download CSV.");
		  		downloadCSV();
		  	} else if (request.action == 'getCheckedCreatives'){
				var checkedCreatives = getCheckedCreatives();
				sendResponse({response: checkedCreatives});
			} else if (request.action == 'getFolderDetails'){
				var folderBasePaths = getFolderDetails();
				sendResponse({response: folderBasePaths});
			}
		}
	);

	/* 
	** Watch for changes to the details panel on the right hand side of the page.
	** When you detect a change (i.e. the details for the row that's just been clicked on have loaded),
	** get the name and base path for that row, then set a flag to say the next row can now be clicked on.
	*/
	var observer = new MutationObserver(function(mutations) {
	  mutations.forEach(function(mutation) {
	    if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName === "DIV"){
	    	if (document.getElementById("gwt-debug-assets-details-panel-name")){
	    		currentFolderName = document.getElementById("gwt-debug-assets-details-panel-name").innerHTML;
	    	}
	    	if (document.getElementById("gwt-debug-assets-details-panel-folder-base-path")){
	    		currentFolderBasePath = document.getElementById("gwt-debug-assets-details-panel-folder-base-path").value;
	    	}
	    	detailsPanelChanged = true;
	    }
	  });    
	});

	/*
	** Add the mutation observer to the details panel. If it's not yet been created (i.e. the page is still loading),
	** then retry every 500ms.
	*/
	function addObserverIfDesiredNodeAvailable() {
	    var target = document.getElementById('gwt-debug-assets-details-panel');
	    if(!target) {
	        // The node we need does not exist yet. Wait 500ms and try again
	        window.setTimeout(addObserverIfDesiredNodeAvailable,500);
	        return;
	    }
	    var config = { childList: true, characterData: true, subtree: true };
	    observer.observe(target, config);
	}

	/*
	** Click on the "Dynamic Paths" button, to download a CSV file with a list of assets into the downloads folder
	*/
	function downloadCSV(){
		var csvDownloadButton = document.querySelector('a[title="Download dynamic paths"]');
		if (csvDownloadButton){
			csvDownloadButton.click();
		} else {
			// For some reason when DoubleClick loads the page, sometimes the "Dynamic Paths" button does not get it's title value set.
			// If this happens, get its child image instead, and then get the parent element to get the Dynamic Paths button that way.
			csvDownloadButton = document.querySelector("img[alt='Dynamic paths']").parentElement;
			csvDownloadButton.click();
		}
	}

	/*
	** The user can choose which folders to download. Get all of the rows they have checked.
	*/
	function getCheckedCreatives(){
		$("input[type='checkbox']:checked").each(function(){
			if( $(this).parents(".HDO65V-b-Qd").length ){
				checkedCreatives.push($(this).parents(".HDO65V-b-Qd"));
			}
		});
		return checkedCreatives;
	}

	/*
	** Get the details for the currently highlighted folder/row. You have to force a click on the row, and then wait for the flag
	** to be set by the mutatiom observer, before sending the data from the details panel back to the popup
	*/
	function getFolderDetails(){
		detailsPanelChanged = false;
		checkedCreatives[currentCheckedCreative].click();
		currentCheckedCreative++;
		checkFlag();
	}

	/*
	** This constantly checks for a flag to be set to true by the mutation observer. When the row has been clicked, and then details panel
	** has finished loading, the flag gets set to true and the Folder Name (E.G. 120x600) and Folder Base Path can be retrieved and sent 
	** back to the popup.
	*/
	function checkFlag() {
	    if(detailsPanelChanged == false) {
	    	// The details pane has not yet loaded. Keep checking the flag every 100 milliseconds until it is set by the mutation observer.
	       	window.setTimeout(checkFlag, 100); 
	    } else {
		    // The details pane has now loaded. Get the details for the currently highlted row and send it back to the popup to use.
		    chrome.runtime.sendMessage({message: [currentFolderName, currentFolderBasePath]});
		    // If you've now got the details for all the checked rows, reset things ready for the next use.
		    if (currentCheckedCreative == checkedCreatives.length){
		    	currentCheckedCreative = 0;
		      	checkedCreatives = [];
		    }
	    }
	}
}
