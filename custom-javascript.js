const channels = [
  {
    handle: "madisonforall_channel",
    name: "Madison for All",
    location: "🇺🇸 Madison, Wisconsin, USA",
    coordinates: [43.073051, -89.40123],
  },
  {
    handle: "andres4ny_channel",
    name: "Andres4NY",
    location: "🇺🇸 Queens, NY USA",
    coordinates: [40.742054, -73.769417],
  },
  {
    handle: "seabikeblog_channel",
    name: "seabikeblog_tv",
    location: "🇺🇸 Seattle, WA USA",
    coordinates: [47.608013, -122.335167],
  },
  {
    handle: "heartlandurbanist_channel",
    name: "Heartland Urbanist",
    location: "🇺🇸 Columbus, OH USA",
    coordinates: [39.983334, -82.98333],
  },
  {
    handle: "madison.bikes_channel",
    name: "Madison Bikes",
    location: "🇺🇸 Madison, Wisconsin, USA",
    coordinates: [43.073051, -89.40123],
  },
];

(async function (d, script) {
  let injected = false;
  let waiting = false;

  // initial load
  await onChange();

  // https://stackoverflow.com/a/67825703/1319878
  let previousUrl = "";
  const observer = new MutationObserver(function (mutations) {
    if (location.href !== previousUrl) {
      previousUrl = location.href;

      onChange();
    }
  });
  const config = { subtree: true, childList: true };
  observer.observe(document, config);

  async function onChange() {
    if (waiting) return;
    waiting = true;
    await waitForElement('[style="map:container"]');
    waiting = false;

    // if (location.pathname !== "/home" && location.pathname !== "/") return;
    // if (!(document.querySelector('.menu-link.active') && document.querySelector('.menu-link.active').href.endsWith('/home'))) return;
    if (!document.querySelector('[style="map:container"]')) return;
    if (document.querySelector("#map")) return;

    const _injected = injected;

    injected = true;

    if (!_injected) {
      await Promise.all([
        loadStyle("https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"),
        loadJS("https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"),
        loadStyle(
          "https://unpkg.com/leaflet.fullscreen@2.4.0/Control.FullScreen.css"
        ),
        loadStyle(
          "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
        ),
      ]);

      await Promise.all([
        loadJS(
          "https://unpkg.com/leaflet.fullscreen@2.4.0/Control.FullScreen.js"
        ),
        loadJS(
          "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"
        ),
      ]);
    }

    var container = await waitForElement('[style="map:container"]');
    container.id = "map-container";

    if (document.querySelector("#map")) return;

    const mapEl = document.createElement("div");
    mapEl.id = "map";
    container.append(mapEl);

    // remote script has loaded
    // Creating map options
    var mapOptions = {
      center:
        document.body.clientWidth < 800
          ? [38.008008, -93.942861]
          : [36.518487, -41.468113],
      zoom: 3,
      minZoom: 3,
      maxZoom: 18,
      zoomSnap: 0,
      dragging: matchMedia("(pointer:fine)").matches,
      fullscreenControl: {
        pseudoFullscreen: true, // if true, fullscreen to page width and height
      },
      fullscreenControlOptions: {
        position: "topleft",
      },
      scrollWheelZoom: false,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 0.8,
    };

    // Creating a map object
    var map = new L.map("map", mapOptions);

    // Creating a Layer object
    var layer = new L.TileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    // Adding layer to the map
    map.addLayer(layer);

    let intervalNum = 0;
    const intervalTimerId = setInterval(onInterval, 100);

    function onInterval() {
      intervalNum++;
      if (intervalNum > 10) clearInterval(intervalTimerId);
      map.invalidateSize();
    }

    const markers = L.markerClusterGroup({
      maxClusterRadius: 70,
      spiderLegPolylineOptions: { weight: 1.5, color: "#eee", opacity: 0.5 },
      removeOutsideVisibleBounds: false,
      zoomToBoundsOnClick: false,
    });

    for (const channel of channels) {
      const marker = L.marker(channel.coordinates);
      marker.bindPopup(
        `<a href='/c/${channel.handle}/videos'>${channel.name}</a><br>${channel.location}`,
        { autoPanPadding: [60, 20] }
      );

      markers.addLayer(marker);
    }

    map.addLayer(markers);

    markers.on("clusterclick", function (e) {
      var cluster = e.layer,
        bottomCluster = cluster;

      if (
        e.type === "clusterkeypress" &&
        e.originalEvent &&
        e.originalEvent.keyCode !== 13
      ) {
        return;
      }

      while (bottomCluster._childClusters.length === 1) {
        bottomCluster = bottomCluster._childClusters[0];
      }

      if (
        // bottomCluster._zoom === this._maxZoom &&
        bottomCluster._zoom === 18 &&
        bottomCluster._childCount === cluster._childCount
      ) {
        // All child markers are contained in a single cluster from this._maxZoom to this cluster.
        cluster.spiderfy();
      } else {
        console.log("go!");
        cluster.zoomToBounds({ padding: [100, 100] });
      }

      // Focus the map again for keyboard users.
      if (e.originalEvent && e.originalEvent.keyCode === 13) {
        this._map._container.focus();
      }
    });

    map.on("enterFullscreen exitFullscreen", function () {
      setTimeout(() => {
        if (map.fullscreenControl._map._isFullscreen) {
          map.dragging.enable();
        } else {
          if (matchMedia("(pointer:fine)").matches) {
            map.dragging.enable();
          } else {
            map.dragging.disable();
          }
        }
      }, 0);
    });

    if (document.body.clientWidth < 800) {
      map.fitBounds(markers.getBounds()).pad(0.2);
    }
  }
})(document);

function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function loadStyle(src) {
  return new Promise(function (resolve, reject) {
    let link = document.createElement("link");
    link.href = src;
    link.rel = "stylesheet";

    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Style load error for ${src}`));

    document.head.append(link);
  });
}

function loadJS(src) {
  return new Promise(function (resolve, reject) {
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;

    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`JS load error for ${src}`));

    document.head.append(script);
  });
}

// PWA changes below

document.querySelector('[name="theme-color"]').setAttribute("content", "#111");

document
  .querySelector('[name="viewport"]')
  .setAttribute(
    "content",
    "width=device-width, viewport-fit=cover, initial-scale=1"
  );

const headTag = document.getElementsByTagName("HEAD")[0];
const statusBarTag = document.createElement("META");
statusBarTag.setAttribute("name", "apple-mobile-web-app-status-bar-style");
statusBarTag.setAttribute("content", "black-translucent");
headTag.appendChild(statusBarTag);
