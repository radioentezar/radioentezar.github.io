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

// Instantiate a map and platform object:
var platform = new H.service.Platform({
  app_id: "S1l6Ytl6LQj6Jv2e85Jr",
  app_code: "ZVDIaS77COAlZFXgKPtUHw",
  useHTTPS: true
});
// Retrieve the target element for the map:
var targetElement = document.getElementById("mapContainer");

// Get default map types from the platform object:
var defaultLayers = platform.createDefaultLayers();

// Instantiate the map:
var map = new H.Map(
  document.getElementById("mapContainer"),
  defaultLayers.normal.map,
  {
    zoom: 0,
    center: { lat: 0, lng: 0 }
  }
);

// Create the parameters for the geocoding request:
var geocodingParams = {
  searchText: "200 S Mathilda Ave, Sunnyvale, CA"
};

// Define a callback function to process the geocoding response:
var onResult = function(result) {
  var locations = result.Response.View[0].Result,
    position,
    marker;
  // Add a marker for each location found
  for (i = 0; i < locations.length; i++) {
    position = {
      lat: locations[i].Location.DisplayPosition.Latitude,
      lng: locations[i].Location.DisplayPosition.Longitude
    };

    marker = new H.map.Marker(position);
    //console.log(result);
    map.addObject(marker);

    map.setCenter(position);
    map.setZoom(8);
  }
};

// Get an instance of the geocoding service:
var geocoder = platform.getGeocodingService();

function enterCity(cityname) {
  //make keyboard go away
  var hideKeyboard = function() {
    document.activeElement.blur();
    $("#city-input").blur();
  };

  if (cityname === "") {
    cityname = $("#city-input").val();
  } else {
  }
  var geocodingParams = {
    searchText: cityname
  };

  var searchstr = `https://geocoder.api.here.com/6.2/geocode.json?app_id=S1l6Ytl6LQj6Jv2e85Jr&app_code=ZVDIaS77COAlZFXgKPtUHw&searchtext=${cityname}&gen=9&locationattributes=tz`;
  fetch(searchstr).then(function(data) {
    data.json().then(function(obj) {
      var rawOffset =
        obj.Response.View[0].Result[0].Location.AdminInfo.TimeZone.rawOffset;
      var position = {
        lat:
          obj.Response.View[0].Result[0].Location.NavigationPosition[0]
            .Latitude,
        lng:
          obj.Response.View[0].Result[0].Location.NavigationPosition[0]
            .Longitude
      };

      marker = new H.map.Marker(position);
      // console.log(obj);
      map.addObject(marker);
      var lat1 =
        obj.Response.View[0].Result[0].Location.MapView.TopLeft.Latitude;
      var lng1 =
        obj.Response.View[0].Result[0].Location.MapView.TopLeft.Longitude;
      var lat2 =
        obj.Response.View[0].Result[0].Location.MapView.BottomRight.Latitude;
      var lng2 =
        obj.Response.View[0].Result[0].Location.MapView.BottomRight.Longitude;
      var bbox = new H.geo.Rect(lat1, lng1, lat2, lng2);
      map.setViewBounds(bbox);

      //console.log("raw offset = "+rawOffset);

      gmtOffset = rawOffset / 3600;

      var date = new Date(); // today
      //var times = prayTimes.getTimes(date, [lat, lng], timeoffset);
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

      // check if anything can be played
      shouldPlay = false;

      fajrTimeStr = times["fajr"].split(":");
      fajrHour = parseInt(fajrTimeStr[0]);
      fajrMin = parseInt(fajrTimeStr[1]);

      maghribTimeStr = times["maghrib"].split(":");
      maghribHour = parseInt(maghribTimeStr[0]);
      maghribMin = parseInt(maghribTimeStr[1]);

      //console.log(times);

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
      //console.log(todayIndex, " is today's index");

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
      } else if (nextEvent === "none") {
      }
      console.log(nextEvent);
      var startMinute = startTotalMinute % 60;
      var startHour = Math.floor(startTotalMinute / 60);
      var startTimeString =
        startHour.toString().padStart(2, "0") +
        ":" +
        startMinute.toString().padStart(2, "0");

      if (nextEvent === "fajr") {
        //console.log("its fajr");
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
      } else {
        shouldPlay = false;
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
          "play-large", // The large play button in the center
          //'restart', // Restart playback
          //'rewind', // Rewind by the seek time (default 10 seconds)
          "play", // Play/pause playback
          //'fast-forward', // Fast forward by the seek time (default 10 seconds)
          //'progress', // The progress bar and scrubber for playback and buffering
          //'current-time', // The current time of playback
          //'duration', // The full duration of the media
          "mute", // Toggle mute
          "volume", // Volume control
          //'captions', // Toggle captions
          //'settings', // Settings menu
          //'pip', // Picture-in-picture (currently Safari only)
          "airplay" // Airplay (currently Safari only)
          //'download', // Show a download button with a link to either the current source or a custom URL you specify in your options
          //'fullscreen', // Toggle fullscreen
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

        scheduleEvent(startTimeString,reloadPage);
      }
    });
  });
}



$("#city-input").on("input", function(e) {
  var searchstr = `https://geocoder.api.here.com/6.2/geocode.json?app_id=S1l6Ytl6LQj6Jv2e85Jr&app_code=ZVDIaS77COAlZFXgKPtUHw&searchtext=${
    e.target.value
  }&gen=9&locationattributes=tz`;
  fetch(searchstr).then(function(data) {
    data.json().then(function(obj) {
      availableTags = [];
      for (var i = 0; i < obj.Response.View[0].Result.length; i++) {
        var adr = obj.Response.View[0].Result[i].Location.Address;

        availableTags.push(adr.Label);
      }

      $("#city-input").autocomplete({
        minLength: 1,
        source: availableTags,
        focus: function() {
          return false;
        },
        //select
        select: function(e, ui) {
          enterCity(ui.item.value);
        }
      });
      $("#city-input").autocomplete("search");
    });
  });
});

$(document).ready(() => {
  $(".toast").toast("show");

  $(".toast").on("hidden.bs.toast", e => {
    $(e.currentTarget).remove();
  });

  enterCity("Los Angeles");
});
