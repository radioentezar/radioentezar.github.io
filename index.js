function enterCity(cityname) {
  //make keyboard go away
  var hideKeyboard = function() {
    document.activeElement.blur();
    $("#city-input").blur();
  };

  if (cityname === "") {
    cityname = $("#city-input").val();
  }

  // Use your proxy to geocode the city name
  var searchstr = `https://firebase-replacement.www-ehsan-com.workers.dev/?address=${encodeURIComponent(cityname)}`;
  fetch(searchstr).then(function(data) {
    data.json().then(function(obj) {
      // Get raw offset from the timezone data
      var rawOffset = obj.timezone?.rawOffset || 0;

      // Get lat/lng from the geocode result
      var position = {
        lat: obj.geocode?.geometry?.location?.lat || 0,
        lng: obj.geocode?.geometry?.location?.lng || 0
      };

      // Remove any HERE references; instead, place a Google Maps marker
      if (marker) {
        marker.setMap(null);
      }
      marker = new google.maps.Marker({
        position: position,
        map: map
      });

      // If bounds exist, fit map to them
      if (obj.geocode?.geometry?.bounds) {
        // Example uses northeast & southwest fields in geometry.bounds
        var ne = obj.geocode.geometry.bounds.northeast;
        var sw = obj.geocode.geometry.bounds.southwest;
        var bbox = new google.maps.LatLngBounds(
          new google.maps.LatLng(sw.lat, sw.lng),
          new google.maps.LatLng(ne.lat, ne.lng)
        );
        map.fitBounds(bbox);
      } else {
        // Otherwise, just center and set a reasonable zoom
        map.setCenter(position);
        map.setZoom(8);
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

      // check if anything can be played
      shouldPlay = false;
      // existing code for program playback...
    });
  });
} 