radioprogram = {};
fetch("./js/data.json")
  .then(function(response) {
    console.log(response);
    return response.json();
  })
  .then(function(myJson) {
    radioprogram = myJson;
  });

function reloadPage(){
  console.log("now reloading");
  location.reload();
}

function scheduleEvent(time, triggerThis) {
  // get hour and minute from hour:minute param received, ex.: '16:00'
  const hour = Number(time.split(":")[0]);
  const minute = Number(time.split(":")[1]);

  // create a Date object at the desired timepoint
  const startTime = new Date();
  startTime.setHours(hour, minute,0);
  const now = new Date();

  // get the interval in ms from now to the timepoint when to trigger the alarm
  var firstTriggerAfterMs = startTime.getTime() - now.getTime() -60000  +1000;

  console.log(firstTriggerAfterMs/1000,"will be triggered");
  // trigger the function triggerThis() at the timepoint
  // create setInterval when the timepoint is reached to trigger it every day at this timepoint
  setTimeout(triggerThis, firstTriggerAfterMs);
}

// Global variables 
var map = null;
var marker = null;
var mapContainer = null;
var searchResults = null;
var searchResultsList = null;
var searchInput = null;
var searchButton = null;
var mapEnabled = true;

// Initialize the map
async function initMap() {
  mapContainer = document.getElementById('mapContainer');
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }

  try {
    // Initialize Google Maps
    map = new google.maps.Map(mapContainer, {
      center: { lat: 34.0549076, lng: -118.242643 },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // Create a marker using AdvancedMarkerElement if available
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
      marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: map.getCenter()
      });
    } else {
      marker = new google.maps.Marker({
        map: map,
        position: map.getCenter()
      });
    }
  } catch (error) {
    console.error('Error initializing map:', error);
    if (mapContainer) {
      mapContainer.innerHTML = '<div class="alert alert-danger">Failed to initialize map. Please try again later.</div>';
    }
  }
}

// Load Maps API
function loadMapsApi() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://firebase-replacement.www-ehsan-com.workers.dev/?maps=true&origin=${encodeURIComponent(window.location.origin)}`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      console.error('Error loading Maps API:', error);
      if (mapContainer) {
        mapContainer.innerHTML = '<div class="alert alert-danger">Failed to load map. Please try again later.</div>';
      }
      reject(error);
    };
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// Search for a location
function searchLocation() {
    var query = searchInput.value;
    if (query.trim() === '') return;

    searchResultsList.innerHTML = '<div class="loading">Searching...</div>';
    searchResults.classList.add('active');

    // Use the proxy for geocoding
    fetch(`https://firebase-replacement.www-ehsan-com.workers.dev/?address=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.geocode) {
                displaySearchResults([data.geocode]);
            } else {
                searchResultsList.innerHTML = '<div class="error">No results found</div>';
            }
        })
        .catch(error => {
            searchResultsList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        });
}

// Display search results
function displaySearchResults(results) {
    searchResultsList.innerHTML = '';
    
    if (results.length === 0) {
        searchResultsList.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    results.forEach(result => {
        var item = document.createElement('div');
        item.className = 'search-result-item';
        
        var title = document.createElement('div');
        title.className = 'search-result-title';
        title.textContent = result.formatted_address || 'Unknown location';
        
        item.appendChild(title);
        
        item.addEventListener('click', function() {
            selectLocation(result);
        });
        
        searchResultsList.appendChild(item);
    });
}

// Select a location from search results
function selectLocation(result) {
    searchResults.classList.remove('active');
    searchInput.value = result.formatted_address || '';
    
    if (mapEnabled && map) {
        var location = result.geometry.location;
        
        // Center the map on the selected location
        map.setCenter(location);
        map.setZoom(14);
        
        // Remove existing marker if any
        if (marker) {
            marker.setMap(null);
        }
        
        // Add a marker for the selected location
        marker = new google.maps.Marker({
            map: map,
            position: location,
            animation: google.maps.Animation.DROP
        });
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
  // Get DOM elements
  mapContainer = document.getElementById('mapContainer');
  searchInput = document.getElementById('search-input');
  searchButton = document.getElementById('search-button');
  const cityInput = document.getElementById('city-input');

  // Check if map should be disabled
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('nomap')) {
    mapEnabled = false;
    if (mapContainer) {
      mapContainer.style.display = 'none';
    }
  }
  
  // Initialize the map if enabled
  if (mapEnabled && mapContainer) {
    try {
      await loadMapsApi();
      window.initMap = initMap;
    } catch (error) {
      console.error('Failed to load Maps API:', error);
    }
  }
  
  // Setup event listeners with null checks
  if (searchButton) {
    searchButton.addEventListener('click', searchLocation);
  }
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') searchLocation();
    });
  }

  // Setup city input autocomplete with debouncing
  if (cityInput) {
    let debounceTimer;
    
    $(cityInput).on("input", function(e) {
      const query = sanitizeInput(e.target.value);
      
      // Clear previous timer
      clearTimeout(debounceTimer);
      
      // Don't make request for empty or very short queries
      if (query.length < 2) {
        $("#city-input").autocomplete("close");
        return;
      }
      
      // Set new timer
      debounceTimer = setTimeout(() => {
        const searchstr = `https://firebase-replacement.www-ehsan-com.workers.dev/?address=${encodeURIComponent(query)}&autocomplete=true`;
        
        fetch(searchstr)
          .then(response => response.json())
          .then(function(data) {
            const suggestions = data.predictions?.map(prediction => ({
              label: prediction.description,
              value: prediction.description
            })) || [];

            $("#city-input").autocomplete({
              minLength: 2,
              source: suggestions,
              select: function(e, ui) {
                enterCity(ui.item.value);
                return false;
              }
            }).autocomplete("instance")._renderItem = function(ul, item) {
              return $("<li>")
                .append(`<div>${item.label}</div>`)
                .appendTo(ul);
            };
            
            if (suggestions.length > 0) {
              $("#city-input").autocomplete("search", query);
            }
          })
          .catch(error => {
            console.error('Error fetching suggestions:', error);
          });
      }, 300); // 300ms delay
    });
  }

  // Show toast and initialize with Los Angeles
  $(".toast").toast("show");
  $(".toast").on("hidden.bs.toast", e => {
    $(e.currentTarget).remove();
  });

  // Initial city
  setTimeout(() => enterCity("Los Angeles"), 1000);
});

function enterCity(cityname) {
  if (cityname === "") {
    cityname = document.getElementById("city-input")?.value || "";
  }

  // Use the proxy to geocode the city name
  var searchstr = `https://firebase-replacement.www-ehsan-com.workers.dev/?address=${encodeURIComponent(cityname)}`;
  fetch(searchstr)
    .then(response => response.json())
    .then(function(obj) {
      // Get raw offset from the timezone data
      var rawOffset = obj.timezone?.rawOffset || 0;

      // Get lat/lng from the geocode result
      var position = {
        lat: obj.geocode?.geometry?.location?.lat || 0,
        lng: obj.geocode?.geometry?.location?.lng || 0
      };

      // Update map marker
      if (marker) {
        marker.setMap(null);
      }
      
      if (map) {
        marker = new google.maps.Marker({
          position: position,
          map: map
        });

        // If bounds exist, fit map to them
        if (obj.geocode?.geometry?.bounds) {
          var ne = obj.geocode.geometry.bounds.northeast;
          var sw = obj.geocode.geometry.bounds.southwest;
          var bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(sw.lat, sw.lng),
            new google.maps.LatLng(ne.lat, ne.lng)
          );
          map.fitBounds(bounds);
        } else {
          map.setCenter(position);
          map.setZoom(8);
        }
      }

      gmtOffset = rawOffset / 3600;

      var date = new Date(); // today
      prayTimes.setMethod("Tehran");
      var times = prayTimes.getTimes(
        date,
        [position.lat, position.lng],
        gmtOffset
      );
      var list = ["Fajr", "Sunrise", "Dhuhr", "Maghrib", "Midnight"];
      var listText = [
        "اذان صبح",
        "طلوع آفتاب",
        "اذان ظهر",
        "اذان مغرب",
        "نیمه شب شرعی"
      ];

      var html = '<table class="table table-sm text-white" id="timetable">';
      html += "<thead>";
      html +=
        '<tr><th scope="col" colspan="2">' +
        date.toLocaleDateString() +
        "</th></tr>";
      html += "</thead> <tbody>";
      for (var i in list) {
        html += "<tr><td>" + times[list[i].toLowerCase()] + "</td>";
        html += "<td>" + listText[i] + "</td></tr>";
      }
      html += "</tbody></table>";
      document.getElementById("table").innerHTML = html;

      // Check if anything can be played
      shouldPlay = false;

      fajrTimeStr = times["fajr"].split(":");
      fajrHour = parseInt(fajrTimeStr[0]);
      fajrMin = parseInt(fajrTimeStr[1]);

      maghribTimeStr = times["maghrib"].split(":");
      maghribHour = parseInt(maghribTimeStr[0]);
      maghribMin = parseInt(maghribTimeStr[1]);

      var nowDate = new Date();
      var now_utc = Date.UTC(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate(),
        nowDate.getHours(),
        nowDate.getMinutes(),
        nowDate.getSeconds()
      );

      var fajr_utc = Date.UTC(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate(),
        fajrHour,
        fajrMin,
        0
      );
      var maghrib_utc = Date.UTC(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate(),
        maghribHour,
        maghribMin,
        0
      );

      var diff = now_utc - fajr_utc;
      var minutesToFajr = Math.floor(diff / 1000 / 60);
      diff = now_utc - maghrib_utc;
      var minutesToMaghrib = Math.floor(diff / 1000 / 60);
      var seek = 0;
      console.log("minutes to fajr = "+ minutesToFajr);
      console.log("minutes to maghrib = "+ minutesToMaghrib);

      //nextEvent = "fajr" , "maghrib" , "none"
      var nextEvent = "";
      if (minutesToFajr < 30) {
        nextEvent = "fajr";
      } else {
        if (minutesToMaghrib < 30) {
          nextEvent = "maghrib";
        } else {
          nextEvent = "none";
        }
      }

      var today = new Date(Date.now());
      var todayIndex = 0;
      var todayArray = today
        .toLocaleDateString()
        .replace(/\u200E/g, "")
        .split("/");
      for (var i = 0; i < radioprogram.sahar.length; i++) {
        var dateArray = radioprogram.sahar[i].date
          .replace(/\u200E/g, "")
          .split("/");
        if (
          parseInt(todayArray[0]) === parseInt(dateArray[0]) &&
          parseInt(todayArray[1]) === parseInt(dateArray[1]) &&
          parseInt(todayArray[2]) === parseInt(dateArray[2])
        ) {
          todayIndex = i;
          break;
        }
      }

      var fajrURL = radioprogram.sahar[todayIndex].url;
      var maghribURL = radioprogram.eftar[todayIndex].url;

      var mp3url = "";
      var minutes = 0;

      var messageString = "";
      var startTotalMinute = 0;

      var programEarlyTime = 0;
      var programDuration = 0;
      if (nextEvent === "fajr") {
        var azantimeString = radioprogram.sahar[todayIndex].azanTime;
        var durationStr = radioprogram.sahar[todayIndex].duration;
        programDuration =
          parseInt(durationStr.split(":")[0]) * 60 +
          parseInt(durationStr.split(":")[1]);
        mp3url = fajrURL;
        minutes = minutesToFajr;
        programEarlyTime = parseInt(azantimeString.split(":")[1]);
        startTotalMinute = fajrHour * 60 + fajrMin - programEarlyTime;
      } else if (nextEvent === "maghrib") {
        var azantimeString = radioprogram.eftar[todayIndex].azanTime;
        var durationStr = radioprogram.eftar[todayIndex].duration;
        programDuration =
          parseInt(durationStr.split(":")[0]) * 60 +
          parseInt(durationStr.split(":")[1]);
        mp3url = maghribURL;
        minutes = minutesToMaghrib;
        programEarlyTime = parseInt(azantimeString.split(":")[1]);
        startTotalMinute = maghribHour * 60 + maghribMin - programEarlyTime;
      }

      var startMinute = startTotalMinute % 60;
      var startHour = Math.floor(startTotalMinute / 60);
      var startTimeString =
        startHour.toString().padStart(2, "0") +
        ":" +
        startMinute.toString().padStart(2, "0");

      if (nextEvent === "fajr") {
        messageString = `<h5 class="text-white" dir='rtl'> هم اکنون برنامه ای آماده ی پخش نیست. برنامه بعدی ساعت
         ${startTimeString} پخش میشود. 
        </h5>`;
      } else if (nextEvent === "maghrib") {
        messageString = `<h5 class="text-white" dir='rtl'> هم اکنون برنامه ای آماده ی پخش نیست. برنامه بعدی ساعت
         ${startTimeString} پخش میشود. 
        </h5>`;
      } else if (nextEvent === "none") {
        messageString = `<h5 class="text-white" dir='rtl'> هم اکنون برنامه ای آماده ی پخش نیست.
        </h5>`;
      }

      if (
        minutes >= -programEarlyTime &&
        minutes < programDuration - programEarlyTime
      ) {
        shouldPlay = true;
        seek = (programEarlyTime + minutes) * 60;
      }

      var source = {
        type: "audio",
        title: "Example title",
        sources: [
          {
            src: mp3url,
            type: "audio/mp3"
          }
        ]
      };

      var ctrl = {
        controls: [
          "play-large",
          "play",
          "mute",
          "volume",
          "airplay"
        ]
      };

      if (shouldPlay) {
        if (nextEvent == "fajr") {
          $("#messagePlace").html(
            `<h5> ${radioprogram.sahar[todayIndex].name} </h5>`
          );
        } else if (nextEvent == "maghrib") {
          $("#messagePlace").html(
            `<h5> ${radioprogram.eftar[todayIndex].name} </h5>`
          );
        }

        $("#playerPlace").html(`<audio id="player" controls></audio>`);
        const player = new Plyr("#player", ctrl);
        player.source = source;
        player.on("loadeddata", event => {
          player.forward(seek);
        });
        player.play();
      } else {
        $("#messagePlace").html(messageString);
        var startTimeString =
          startHour.toString().padStart(2, "0") +
          ":" +
          (startMinute + 1).toString().padStart(2, "0");

        scheduleEvent(startTimeString, reloadPage);
      }
    });
}

// Add error handling for API quota exceeded
function handleApiError(error) {
  if (error.status === 429) {
    console.error('API quota exceeded');
    // Show user-friendly message
    return;
  }
  // Handle other errors
}

// Add input sanitization
function sanitizeInput(input) {
  return input.replace(/[<>]/g, '').trim().substring(0, 100);
}
