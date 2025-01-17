/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1 && decodeURIComponent(getUrlVars()[parameter]) != "" ){
        urlparameter = decodeURIComponent(getUrlVars()[parameter]);
    }
    return urlparameter;
}

// Look up the url parameter "param" using "defaultValue" if not found
// then set the form option with id "elementId" to that value
function setDropdown(param, elementId, defaultValue, insertValueIfMissing) {
    var value = getUrlParam(param, defaultValue);
    var select = document.getElementById(elementId);
    var found = false
    for(var i = 0;i < select.options.length; i++){
        if(select.options[i].value == value ) {
            select.options[i].selected = true;
            found = true
        }
    }
    if (!found && insertValueIfMissing) {
        select.append( new Option(value, value, false, true))
    }
    return value
}

// Look up the url parameter "param" using "defaultValue" if not found
// then set the form text input with id "elementId" to that value
function setText(param, elementId, defaultValue) {
    var value = getUrlParam(param, defaultValue);
    var inpt = document.getElementById(elementId);
    inpt.value = value
    return value
}

// Look up the url parameter "param" using "defaultValue" if not found
// then set the radio checked value to true and call the function when checked
function setRadio(param, elementId, defaultValue) {
    let value = getUrlParam(param, defaultValue);
    document.getElementById(value).checked = true;
    queryChange(document.getElementById(value));
    return value
}

// Get a list of values from queryUrl (in the form of a json array)
// Insert those into drop down with id equal "elementId"
// And when you find a value matching url param "param" set it to selected
function populateDropdownFromQuery(param, elementId, defaultValue, queryUrl) {
    var value = getUrlParam(param, defaultValue);
    var element = document.getElementById(elementId);
    // Start off with just an option for the value from the URL
    element.append( new Option(value, value, false, true))
    namespaces = d3.json(queryUrl);
    namespaces.then(function (result) {
        element.remove(0)
        var found = false
        result.forEach(
          function(row) {
              isSelected = (value == row)
              element.append( new Option(row, row, false, isSelected) );
              if (isSelected) {
                  found = true
              }
        });
        if (!found) {
            element.append( new Option(value, value, false, true))
        }
    })
    return value
}

$(document).ready(function(e) {
    $('#selectedEndTime').on('blur', function(evt) {
        var dateTimeValue = document.getElementById('selectedEndTime').value;
        var selectedEndTimeValue = dateTimeValue.toString();
        sessionStorage.setItem('selectedEndTime', selectedEndTimeValue);
        sessionStorage.setItem('setSelectedEndTime', new Date().toISOString());
    });
});

function setFiltersAndReturnQueryUrl(defaultLookback, defaultKind, defaultNamespace) {
    // Keep this in sync with pkg/sloop/queries/params.go

    // Some of these need to hit the backend which takes a little time
    // Do the fast ones first
    // TODO: Query the back-end async
    // TODO: Also, we may consider initially populating the drop-down with the value from url params as a placholder
    //       until we get the full list back

    selectedEndTime = sessionStorage.getItem('selectedEndTime')
    // If user shut down the old window and open a new window, set the default ui displayed time to now
    if (selectedEndTime === null) {
        var now =  new Date().toISOString()
        selectedEndTime = now.substring(0, now.length-5)
    }

    lookback =        setDropdown("lookback", "filterlookback", defaultLookback, true)
    sort =            setDropdown("sort",     "filtersort",     "start_time", false)

    namematch = setText("namematch", "filternamematch", "")

    windowLocation = window.location.pathname.toString()
    query =           populateDropdownFromQuery("query",     "filterquery",     "EventHeatMap",  windowLocation+"/data?query=Queries&lookback="+lookback);
    ns =              populateDropdownFromQuery("namespace", "filternamespace", defaultNamespace, windowLocation+"/data?query=Namespaces&lookback="+lookback);
    kind =            populateDropdownFromQuery("kind",      "filterkind",      defaultKind,      windowLocation+"/data?query=Kinds&lookback="+lookback);

    dataQuery = windowLocation+"/data?query="+query+"&namespace="+ns+"&lookback="+lookback+"&kind="+kind+"&sort="+sort+"&namematch="+namematch+"&end_time="+selectedEndTime
    return dataQuery
}

