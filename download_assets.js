// Create array to hold all the assets we want to download
var assetsToDownload = [];
var arrFolderBasePaths = [];
var titles = [];


//Save all folder base paths
var saveFolderBasePaths = document.getElementsByClassName('KPLCD5C-b-Qd');


var i = 0;

function myLoop() {
    setTimeout(function() {
        saveFolderBasePaths[i].click();
        // var folderPath = document.getElementById("gwt-debug-assets-details-panel-folder-base-path");
        setTimeout(function() {
            arrFolderBasePaths.push({
                url: document.getElementById("gwt-debug-assets-details-panel-folder-base-path").value,
                folder: document.getElementById("gwt-debug-assets-details-panel-name").title
            });
            i++;
            if (i < saveFolderBasePaths.length) {
                myLoop();
            } else {
                checkAndDownload();
                // displayInput();
            }
        }, 3000);

    }, 1000)
}

//We should find a way to detect the change instead use setTimeout here, webKitMutationObserver could work


myLoop();
console.log(arrFolderBasePaths);

//Check all the boxes and download de CSV file
function checkAndDownload() {
    var saveCheckboxes = document.getElementsByClassName("gwt-CheckBox")
    for (i = 0; i < saveCheckboxes.length; i++) {
        saveCheckboxes[i].childNodes[0].checked = true;
    }
    document.querySelector('a[title="Download dynamic paths"]').click();
    displayInput();
}




//When the paths are saved and the file is downloaded display the input button
function displayInput() {
    var menu = document.getElementsByClassName('KPLCD5C-b-R');
    console.log(menu);

    var fileChooser = document.createElement("input");
    fileChooser.type = 'file';
    console.log('appending input');
    fileChooser.addEventListener('change', function(evt) {
        console.log('inside content script change event');
        var f = evt.target.files[0];
        if (f) {
            var reader = new FileReader();
            reader.onload = function(e) {
                setFileData(event.target.result);
            }
            reader.readAsText(f);
        }
    });
    document.getElementsByClassName('KPLCD5C-b-R')[0].appendChild(fileChooser);
}

function setFileData(data) {
    fileData = data;
    getDirtyData();
}

function getDirtyData() {
    var data = fileData;
    var dirtyData = data.split('\n');
    dirtyData.pop();
    createTitlesArray(dirtyData);
}

function createTitlesArray(data) {
    titles = data.map(function(val) {
        var comma = val.indexOf(",");
        var slash = val.indexOf("/");
        var name = val.substring(0, comma);
        var imgName = name.substring(slash + 1);
        console.log(imgName);
        var folder = val.substring(0, slash);
        return { name: imgName, folder: folder, filename: name };
    });
    console.log(titles);
    createAssetsToDownload();
}


function createAssetsToDownload() {
    var assetsToDownload = titles.map(function(val) {
        var obj = {};
        console.log(val.folder);
        var folderUrl = arrFolderBasePaths.filter(function(v) {
            return v.folder === val.folder;
        });
        obj['url'] = folderUrl[0].url + val.name;
        obj['filename'] = val.filename;
        return obj;
    })
    console.log(assetsToDownload);

    // Now you've got an array of the assets you want, pass it back to listener.js to download
    chrome.runtime.sendMessage(assetsToDownload);
}
