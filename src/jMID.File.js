var jMID = (function(jMID) {

  var _toMilliseconds = function(ms) { return ms / 1000; };
  var _toSeconds = function(ms) { return ms / 1000000; };

  jMID.File = function(decoded) {
    for (var key in decoded) {
      if (decoded.hasOwnProperty(key)) {
        this[key] = decoded[key];
      }
    }

    this.timeSignature = { // Defaults
      beatsPerBar : 4,
      beatValue : 4
    };

    this.timing = {
      MicroSPB : 500000
    };

    this.processMetaEvents();
    this.processChannelEventTimes();
  };

  jMID.File.prototype = {
    processMetaEvents : function() {
      var meta = jMID.Query(this).filter("type:meta")
                                 .not("subtype:endOfTrack, subtype:trackName")
                                 .toArray();
      
      for (var i = 0, _len = meta.length; i < _len; i++) {
        switch (meta[i].subtype) {
          case "timeSignature":
            this.timeSignature.beatsPerBar = meta[i].numerator;
            this.timeSignature.beatValue = meta[i].denominator;
            break;
          case "setTempo":
            this.timing.MicroSPB = meta[i].microsecondsPerBeat;
            break;
        }
      }

      this.calculateBPM();
      this.timing.MSPQN = this.timing.MicroSPB / 1000;
      this.timing.MSPT = this.timing.MSPQN / this.header.ticksPerBeat;
    },
    processChannelEventTimes : function() {
      var MSPT = this.timing.MSPT;
      
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        var track = this.tracks[i];
        var runningTime = 0;

        for (var x = 0, _len2 = track.events.length; x < _len2; x++) {
          var event = track.events[x];          
          var time = event.deltaTime * MSPT;

          event.set('time', runningTime + time);
          runningTime += time;
        }
      }
    },
    calculateBPM : function() {
      var microsecondsPerMinute = 60000000;
      this.timing.BPM = (microsecondsPerMinute / this.timing.MicroSPB) *
                        (this.timeSignature.beatValue / 4);
    },
    getHeader : function() {
      return this.header;
    },
    encode : function() {
      return new jMID.Encoder().encode(this);
    },
    base64Encode : function() {
      return btoa(this.encode());
    }
  };

  return jMID;

}(jMID || {}));