// Create array to hold all the assets we want to download
var assetsToDownload = [];


// document.getElementById("gwt-debug-assets-details-panel-folder-base-path").removeAttribute('readonly');


/*
// Adding listener
var folderPath = document.getElementById("gwt-debug-assets-details-panel-folder-base-path");
folderPath.addEventListener("change", function(e) {
    setTimeout(function() {
        console.log('changed');
        console.log(folderPath.value);
    }, 3000);
});

// Create event and fire it.
var changeEvent = new Event("HTMLEvents");
changeEvent.initEvent("change", true, true);
folderPath.dispatchEvent(changeEvent);
*/


//Save all folder base paths
var saveFolderBasePaths = document.getElementsByClassName('KPLCD5C-b-Qd');

saveFolderBasePaths[0].click();
console.log('clicked');
var arrFolderBasePaths = [];

var i = 0;

function myLoop() {
    setTimeout(function() {
        saveFolderBasePaths[i].click();
        var folderPath = document.getElementById("gwt-debug-assets-details-panel-folder-base-path");
        setTimeout(function() {
            console.log('changed');
            console.log(document.getElementById("gwt-debug-assets-details-panel-folder-base-path").value);
            arrFolderBasePaths.push(document.getElementById("gwt-debug-assets-details-panel-folder-base-path").value);
            i++;
            if (i < saveFolderBasePaths.length) {
                myLoop();
            }
        }, 3000);

    }, 1000)
}

myLoop();
console.log(arrFolderBasePaths);

//Check all the boxes
/*
var saveCheckboxes = document.getElementsByClassName("gwt-CheckBox")
for (i = 0; i < saveCheckboxes.length; i++) {
    saveCheckboxes[i].childNodes[0].checked = true;
}

document.querySelector('a[title="Download dynamic paths"]').click();
*/

// var saveCheckbox = document.getElementsByClassName("gwt-CheckBox")[0].childNodes[0];
// console.log(saveCheckbox[0]);
// saveCheckbox.checked = true;

/*
// Get the name of the folder you are currently viewing. The assets will be saved to the same folder name when downloaded locally.
var saveToDirectoryHTMLElement = document.getElementById("gwt-debug-assets-details-panel-name");
var saveToDirectory = saveToDirectoryHTMLElement.title;

// Get the 'folder base path' which will be combined with each asset name
var folderBasePathHTMLElement = document.getElementById("gwt-debug-assets-details-panel-folder-base-path");
var folderBasePath = folderBasePathHTMLElement.value;

// Get all of the assets from the page
var assets = document.getElementsByClassName("KPLCD5C-b-Sd");

// If the asset is an image, it will contain this string
var substring = "assets-table-asset";

// Loop through all of the assets and add them to the array
for (i = 0; i < assets.length; i++) {
    // Get the ID of the asset. Need to determine if it's an image or a folder. Only want to download the images.
    var assetId = assets[i].id;
    // If the asset is an image, add it to the array to be downloaded
    if (assetId.includes(substring)) {
        var imageSrc = folderBasePath + assets[i].innerText;
        console.log(imageSrc);
        var filepath = saveToDirectory + "/" + assets[i].innerText;
        console.log(filepath);
        assetsToDownload.push({
            url: imageSrc,
            filename: filepath
        })
        console.log(assetsToDownload);
    }
}

// Now you've got an array of the assets you want, pass it back to listener.js to download
chrome.runtime.sendMessage(assetsToDownload);
*/
