/* Based on work done initially by George MacKerron */
const L = require('leaflet');

const twoPi = Math.PI * 2;
const defaults = {
  map: null,
  keep: false,
  viewportOnly: true,
  nearbyDistance: 20,
  circleSpiralSwitchover: 9,
  circleFootSeparation: 25,
  circleStartAngle: 1,
  spiralFootSeparation: 28,
  spiralLengthStart: 11,
  spiralLengthFactor: 5,
  legWeight: 1.5,
  legColors: {
    usual: '#222',
    highlighted: '#f00'
  },
  offEvents: ['click', 'zoomend'],
  onEvents: ['click'],
  body: {
    color: '#222',
    radius: 3,
    opacity: 0.9,
    fillOpacity: 0.9
  },
  msg: {
    buttonEnabled: 'spiderfy enabled - click to disable',
    buttonDisabled: 'spiderfy disabled - click to enable'
  },
  icon: '<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n   <g id="2">\n     <g id="1">\n       <circle cy="60" r="20"/>\n       <path d="M 0,0 v 60" stroke="black" stroke-width="10"/>\n     </g>\n     <use xlink:href="#1" transform="scale(-1)"/>\n   </g>\n   <use xlink:href="#2" transform="rotate(60)"/>\n  <use xlink:href="#2" transform="rotate(-60)"/>\n</svg>'
};

export default class Spiderfy {
  static VERSION: '1.0.0';
  static get defaults() {
    return defaults;
  }
  constructor(settings = {}) {
    var e, j, key, len, ref;
    const defaults = this.constructor.defaults;
    for (const key in defaults) {
      if (defaults.hasOwnProperty(key) === false) continue;
      this[key] = opts.hasOwnProperty(key) ? opts[key] : defaults[key];
    }
    this.isEnabled = true;
    this.initMarkerArrays();
    this.listeners = {};
    this.bounds = null;
    this.ne = null;
    this.sw = null;
    this.visibleMarkers = [];
    this.isActivating = false;
    this.isDeactivating = false;
    this.data = {};
    if (this.viewportOnly) {
      this.updateBounds();
      this.map.on('moveend', this.updateBounds.bind(this));
    }
    if (this.offEvents && this.offEvents.length) {
      ref = this.offEvents;
      for (j = 0, len = ref.length; j < len; j++) {
        e = ref[j];
        this.map.on(e, this.deactivate.bind(this));
      }
    }
  }
  initMarkerArrays() {
    this.markers = [];
    this.markerListeners = [];
    return this.bodies = [];
  }
  addMarker(marker) {
    var e, j, len, markerListener, ref;
    if (this.data.hasOwnProperty(marker._leaflet_id)) {
      return this;
    }
    markerListener = (function(_this) {
      return function() {
        return _this.activateMarker(marker);
      };
    })(this);
    if (this.onEvents.constructor === Array && this.onEvents.length > 0) {
      ref = this.onEvents;
      for (j = 0, len = ref.length; j < len; j++) {
        e = ref[j];
        marker.on(e, markerListener);
      }
    }
    this.markerListeners.push(markerListener);
    this.markers.push(marker);
    return this;
  }
  getMarkers() {
    return this.markers.slice(0);
  }
  removeMarker(marker) {
    var e, i, j, len, markerListener, ref;
    if (this.data.hasOwnProperty(marker._leaflet_id)) {
      this.deactivate();
    }
    i = this.arrIndexOf(this.markers, marker);
    if (i < 0) {
      return this;
    }
    markerListener = this.markerListeners.splice(i, 1)[0];
    if (this.onEvents && this.onEvents.length) {
      ref = this.onEvents;
      for (j = 0, len = ref.length; j < len; j++) {
        e = ref[j];
        marker.removeEventListener(e, markerListener);
      }
    }
    delete this.data[marker._leaflet_id];
    this.markers.splice(i, 1);
    return this;
  }
  clearMarkers() {
    var e, i, j, k, len, len1, marker, markerListener, ref, ref1;
    this.deactivate();
    ref = this.markers;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      marker = ref[i];
      markerListener = this.markerListeners[i];
      if (this.onEvents && this.onEvents.length > 0) {
        ref1 = this.onEvents;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          e = ref1[k];
          marker.removeEventListener(e, markerListener);
        }
      }
      delete this.data[marker._leaflet_id];
    }
    this.initMarkerArrays();
    return this;
  }
  addListener(event, func) {
    var base;
    ((base = this.listeners)[event] != null ? base[event] : base[event] = []).push(func);
    return this;
  }
  removeListener(event, func) {
    var i;
    i = this.arrIndexOf(this.listeners[event], func);
    if (!(i < 0)) {
      this.listeners[event].splice(i, 1);
    }
    return this;
  }
  clearListeners(event) {
    this.listeners[event] = [];
    return this;
  }
  trigger() {
    var args, event, func, j, len, ref, ref1, results;
    event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    ref1 = (ref = this.listeners[event]) != null ? ref : [];
    results = [];
    for (j = 0, len = ref1.length; j < len; j++) {
      func = ref1[j];
      results.push(func.apply(null, args));
    }
    return results;
  }
  generatePtsCircle(count, centerPt) {
    var angle, angleStep, calculatedStartAngle, circumference, i, j, legLength, ref, results;
    circumference = this.circleFootSeparation * (2 + count);
    legLength = count > 6 ? circumference / twoPi : this.circleFootSeparation;
    angleStep = twoPi / count;
    calculatedStartAngle = this.circleStartAngle * (Math.PI / 180);
    results = [];
    for (i = j = 0, ref = count; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      angle = calculatedStartAngle + i * angleStep;
      results.push(new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle)));
    }
    return results;
  }
  generatePtsSpiral(count, centerPt) {
    var angle, i, j, legLength, pt, ref, results;
    legLength = this.spiralLengthStart;
    angle = 0;
    results = [];
    for (i = j = 0, ref = count; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      angle += this.spiralFootSeparation / legLength + i * 0.0005;
      pt = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle));
      legLength += twoPi * this.spiralLengthFactor / angle;
      results.push(pt);
    }
    return results;
  }
  activateMarker(marker) {
    var isActive, j, latLng, len, m, mPt, markerPt, nearbyMarkerData, nonNearbyMarkers, pxSq, ref;
    isActive = this.data.hasOwnProperty(marker._leaflet_id);
    if (this.keep === false) {
      if (!isActive) {
        this.deactivate();
      }
    }
    latLng = marker.getLatLng();
    if (this.viewportOnly && this.isInViewPort(latLng) === false) {
      return this;
    }
    if (isActive || this.isEnabled === false) {
      this.trigger('click', marker);
    } else {
      nearbyMarkerData = [];
      nonNearbyMarkers = [];
      pxSq = this.nearbyDistance * this.nearbyDistance;
      markerPt = this.map.latLngToLayerPoint(latLng);
      ref = this.markers;
      for (j = 0, len = ref.length; j < len; j++) {
        m = ref[j];
        if (!this.map.hasLayer(m)) {
          continue;
        }
        mPt = this.map.latLngToLayerPoint(m.getLatLng());
        if (this.ptDistanceSq(mPt, markerPt) < pxSq) {
          nearbyMarkerData.push({
            marker: m,
            markerPt: mPt
          });
        } else {
          nonNearbyMarkers.push(m);
        }
      }
      if (nearbyMarkerData.length === 1) {
        this.trigger('click', marker);
      } else if (nearbyMarkerData.length > 0) {
        this.activate(nearbyMarkerData, nonNearbyMarkers);
      }
    }
    return this;
  }
  setColorStyle(item, color) {
    return item.setStyle({
      color: color
    });
  }
  activate(markerData, nonNearbyMarkers) {
    var activeMarkers, body, bodyPt, data, footLl, footPt, footPts, j, lastMarkerCoords, leg, len, marker, markerCoords, md, nearestMarkerDatum, numFeet, oldData;
    if (!this.isEnabled) {
      return this;
    }
    if (this.isActivating) {
      return this;
    }
    this.isActivating = true;
    if (this.viewportOnly === true) {
      this.updateBounds();
    }
    numFeet = markerData.length;
    bodyPt = this.ptAverage((function() {
      var j, len, results;
      results = [];
      for (j = 0, len = markerData.length; j < len; j++) {
        md = markerData[j];
        results.push(md.markerPt);
      }
      return results;
    })());
    footPts = numFeet >= this.circleSpiralSwitchover ? this.generatePtsSpiral(numFeet, bodyPt).reverse() : this.generatePtsCircle(numFeet, bodyPt);
    lastMarkerCoords = null;
    activeMarkers = [];
    for (j = 0, len = footPts.length; j < len; j++) {
      footPt = footPts[j];
      footLl = this.map.layerPointToLatLng(footPt);
      nearestMarkerDatum = this.minExtract(markerData, (function(_this) {
        return function(md) {
          return _this.ptDistanceSq(md.markerPt, footPt);
        };
      })(this));
      marker = nearestMarkerDatum.marker;
      markerCoords = marker.getLatLng();
      lastMarkerCoords = markerCoords;
      leg = new L.Polyline([markerCoords, footLl], {
        color: this.legColors.usual,
        weight: this.legWeight,
        clickable: false
      });
      this.map.addLayer(leg);
      if (this.data.hasOwnProperty(marker._leaflet_id)) {
        oldData = this.data[marker._leaflet_id];
        this.map.removeLayer(oldData.leg);
      }
      data = this.data[marker._leaflet_id] = {
        usualPosition: marker.getLatLng(),
        leg: leg
      };
      if (this.legColors.highlighted !== this.legColors.usual) {
        marker.on('mouseover', data.over = this.setColorStyle.bind(this, data.leg, this.legColors.highlighted));
        marker.on('mouseout', data.out = this.setColorStyle.bind(this, data.leg, this.legColors.usual));
      }
      marker.setLatLng(footLl);
      if (marker.hasOwnProperty('setZIndexOffset')) {
        marker.setZIndexOffset(1000000);
      }
      this.visibleMarkers.push(marker);
      activeMarkers.push(marker);
    }
    this.isActivating = false;
    this.isActive = true;
    if (this.body && lastMarkerCoords) {
      body = L.circleMarker(lastMarkerCoords, this.body);
      this.map.addLayer(body);
      this.bodies.push(body);
      this.data[marker._leaflet_id].body = body;
    }
    return this.trigger('activate', activeMarkers, nonNearbyMarkers);
  }
  deactivate(markerNotToMove) {
    var activeMarkerIndex, body, data, inactiveMarkers, j, k, len, len1, marker, nonNearbyMarkers, ref, ref1;
    if (markerNotToMove == null) {
      markerNotToMove = null;
    }
    if (this.isActive === false) {
      return this;
    }
    if (this.isDeactivating) {
      return this;
    }
    this.isDeactivating = true;
    inactiveMarkers = [];
    nonNearbyMarkers = [];
    ref = this.visibleMarkers;
    for (j = 0, len = ref.length; j < len; j++) {
      marker = ref[j];
      if (this.data.hasOwnProperty(marker._leaflet_id)) {
        data = this.data[marker._leaflet_id];
        delete this.data[marker._leaflet_id];
        this.map.removeLayer(data.leg);
        if (marker !== markerNotToMove) {
          marker.setLatLng(data.usualPosition);
        }
        if (marker.hasOwnProperty('setZIndexOffset')) {
          marker.setZIndexOffset(0);
        }
        if (data.hasOwnProperty('over')) {
          marker.off('mouseover', data.over);
          marker.off('mouseout', data.out);
        }
        inactiveMarkers.push(marker);
        activeMarkerIndex = this.visibleMarkers.indexOf(marker);
        if (activeMarkerIndex > -1) {
          this.visibleMarkers.splice(activeMarkerIndex, -1);
        }
      } else {
        nonNearbyMarkers.push(marker);
      }
    }
    ref1 = this.bodies;
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      body = ref1[k];
      this.map.removeLayer(body);
    }
    this.isDeactivating = false;
    this.isActive = false;
    this.trigger('deactivate', inactiveMarkers, nonNearbyMarkers);
    return this;
  }
  ptDistanceSq(pt1, pt2) {
    var dx, dy;
    dx = pt1.x - pt2.x;
    dy = pt1.y - pt2.y;
    return dx * dx + dy * dy;
  }
  ptAverage(pts) {
    var j, len, numPts, pt, sumX, sumY;
    sumX = 0;
    sumY = 0;
    for (j = 0, len = pts.length; j < len; j++) {
      pt = pts[j];
      sumX += pt.x;
      sumY += pt.y;
    }
    numPts = pts.length;
    return new L.Point(sumX / numPts, sumY / numPts);
  }
  minExtract(array, func) {
    var bestIndex, bestVal, index, item, j, len, val;
    for (index = j = 0, len = array.length; j < len; index = ++j) {
      item = array[index];
      val = func(item);
      if ((typeof bestIndex === "undefined" || bestIndex === null) || val < bestVal) {
        bestVal = val;
        bestIndex = index;
      }
    }
    return array.splice(bestIndex, 1)[0];
  }
  arrIndexOf(array, obj) {
    var i, j, len, o;
    if (array.constructor === Array) {
      return array.indexOf(obj);
    }
    for (i = j = 0, len = array.length; j < len; i = ++j) {
      o = array[i];
      if (o === obj) {
        return i;
      }
    }
    return -1;
  }
  enable: function() {
    this.isEnabled = true;
    return this;
  }
  disable() {
    this.isEnabled = false;
    return this;
  }
  updateBounds() {
    var bounds;
    bounds = this.bounds = this.map.getBounds();
    this.ne = bounds._northEast;
    this.sw = bounds._southWest;
    return this;
  }
  isInViewPort(latLng) {
    return latLng.lat > this.sw.lat && latLng.lat < this.ne.lat && latLng.lng > this.sw.lng && latLng.lng < this.ne.lng;
  }
}

L.Spiderfy = L.Control.extend({
  options: {
    position: 'topleft',
    markers: [],
    click: null,
    activate: null,
    deactivate: null,
    enable: null,
    disable: null,
    keep: defaults.keep,
    nearbyDistance: defaults.nearbyDistance,
    circleSpiralSwitchover: defaults.circleSpiralSwitchover,
    circleFootSeparation: defaults.circleFootSeparation,
    circleStartAngle: defaults.circleStartAngle,
    spiralFootSeparation: defaults.spiralFootSeparation,
    spiralLengthStart: defaults.spiralLengthStart,
    spiralLengthFactor: defaults.spiralLengthFactor,
    legWeight: defaults.legWeight,
    legColors: defaults.legColors,
    offEvents: defaults.offEvents,
    onEvents: defaults.onEvents,
    body: defaults.body,
    msg: defaults.msg,
    icon: defaults.icon
  },
  onAdd: function(map) {
    var _spiderfy, button, buttonDisabled, buttonEnabled, isActive, j, len, marker, options, ref, style;
    options = this.options;
    _spiderfy = this._spiderfy = new Spiderfy(map, options);
    if (options.click) {
      _spiderfy.addListener('click', options.click);
    }
    if (options.activate) {
      _spiderfy.addListener('activate', options.activate);
    }
    if (options.deactivate) {
      _spiderfy.addListener('deactivate', options.deactivate);
    }
    isActive = true;
    buttonEnabled = options.msg.buttonEnabled;
    buttonDisabled = options.msg.buttonDisabled;
    button = L.DomUtil.create('a', 'leaflet-bar leaflet-control leaflet-control-spiderfy');
    button.setAttribute('href', '#');
    button.setAttribute('title', buttonEnabled);
    button.innerHTML = options.icon;
    style = button.style;
    style.backgroundColor = 'white';
    style.width = '30px';
    style.height = '30px';
    ref = options.markers;
    for (j = 0, len = ref.length; j < len; j++) {
      marker = ref[j];
      _spiderfy.addMarker(marker);
    }
    button.onclick = function() {
      if (isActive) {
        isActive = false;
        button.setAttribute('title', buttonDisabled);
        style.opacity = 0.5;
        _spiderfy.deactivate().disable();
        if (options.disable) {
          return options.disable();
        }
      } else {
        isActive = true;
        button.setAttribute('title', buttonEnabled);
        style.opacity = 1;
        _spiderfy.enable();
        if (options.enable) {
          return options.enable();
        }
      }
    };
    return button;
  },
  VERSION: Spiderfy.prototype.VERSION,
  initMarkerArrays: function() {
    this._spiderfy.initMarkerArrays();
    return this;
  },
  addMarker: function(marker) {
    this._spiderfy.addMarker(marker);
    return this;
  },
  getMarkers: function() {
    return this._spiderfy.getMarkers();
  },
  removeMarker: function(marker) {
    this._spiderfy.removeMarker(marker);
    return this;
  },
  clearMarkers: function() {
    this._spiderfy.clearMarkers();
    return this;
  },
  addListener: function(event, func) {
    this._spiderfy.addListener(event, func);
    return this;
  },
  removeListener: function(event, func) {
    this._spiderfy.removeListener(event, func);
    return this;
  },
  clearListeners: function(event) {
    this._spiderfy.clearListeners(event);
    return this;
  },
  trigger: function() {
    var args, event;
    event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    this._spiderfy.trigger(event, args);
    return this;
  },
  generatePtsCircle: function(count, centerPt) {
    this._spiderfy.generatePtsCircle(count, centerPt);
    return this;
  },
  generatePtsSpiral: function(count, centerPt) {
    return this._spiderfy.generatePtsSpiral(count, centerPt);
  },
  activateMarker: function(marker) {
    this._spiderfy.activateMarker(marker);
    return this;
  },
  activate: function(markerData, nonNearbyMarkers) {
    this._spiderfy.activate(markerData, nonNearbyMarkers);
    return this;
  },
  deactivate: function(markerNotToMove) {
    this._spiderfy.deactivate(markerNotToMove);
    return this;
  },
  hideVisibleMarkers: function() {
    this._spiderfy.hideVisibleMarkers();
    return this;
  },
  ptDistanceSq: function(pt1, pt2) {
    return this._spiderfy.ptDistanceSq(pt1, pt2);
  },
  ptAverage: function(pts) {
    return this._spiderfy.ptAverage(pts);
  },
  minExtract: function(array, func) {
    return this._spiderfy.minExtract(array, func);
  },
  arrIndexOf: function(arr, obj) {
    return this._spiderfy.arrIndexOf(arr, obj);
  },
  enable: function() {
    this._spiderfy.enable();
    return this;
  },
  disable: function() {
    this._spiderfy.disable();
    return this;
  },
  updateBounds: function() {
    this._spiderfy.updateBounds();
    return this;
  },
  isInViewPort: function(latLng) {
    return this._spiderfy.isInViewPort(latLng);
  }
});

L.spiderfy = function(options) {
  var spiderfy;
  spiderfy = new L.Spiderfy(options);
  map.addControl(spiderfy);
  return spiderfy;
};
