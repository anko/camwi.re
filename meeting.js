// Generated by LiveScript 1.2.0
(function(){
  var RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, isFirefox, isChrome, STUN, TURN, iceServers, optionalArgument, offerAnswerConstraints, getToken, onSdpSuccess, onSdpError, Offer, Answer, swap, VideoChat;
  RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
  RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
  RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
  navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
  isFirefox = !!navigator.mozGetUserMedia;
  isChrome = !!navigator.webkitGetUserMedia;
  STUN = {
    url: isChrome ? 'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
  };
  TURN = {
    url: 'turn:homeo@turn.bistri.com:80',
    credential: 'homeo'
  };
  iceServers = {
    iceServers: [STUN]
  };
  if (isChrome) {
    if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2] >= 28)) {
      TURN = {
        url: 'turn:turn.bistri.com:80',
        credential: 'homeo',
        username: 'homeo'
      };
    }
    iceServers.iceServers = [STUN, TURN];
  }
  optionalArgument = {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  };
  offerAnswerConstraints = {
    optional: [],
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }
  };
  getToken = function(){
    return Math.round(Math.random() * 9999999999) + 9999999999;
  };
  onSdpSuccess = function(){};
  onSdpError = function(it){
    console.error('sdp error:', it.name, it.message);
  };
  Offer = {
    createOffer: function(config){
      var peer, sdpCallback;
      peer = new RTCPeerConnection(iceServers, optionalArgument);
      if (config.stream) {
        peer.addStream(config.stream);
      }
      if (config.onaddstream) {
        peer.onaddstream = function(event){
          config.onaddstream(event.stream, config.to);
        };
      }
      peer.onicecandidate = function(event){
        if (!event.candidate) {
          sdpCallback();
        }
      };
      peer.ongatheringchange = function(event){
        if (event.currentTarget && event.currentTarget.iceGatheringState === 'complete') {
          sdpCallback();
        }
      };
      peer.createOffer(function(sdp){
        peer.setLocalDescription(sdp);
        if (isFirefox) {
          config.onsdp(sdp, config.to);
        }
      }, onSdpError, offerAnswerConstraints);
      sdpCallback = function(){
        config.onsdp(peer.localDescription, config.to);
      };
      this.peer = peer;
      return this;
    },
    setRemoteDescription: function(sdp){
      this.peer.setRemoteDescription(new RTCSessionDescription(sdp, onSdpSuccess, onSdpError));
    },
    addIceCandidate: function(candidate){
      this.peer.addIceCandidate(new RTCIceCandidate({
        sdpMLineIndex: candidate.sdpMLineIndex,
        candidate: candidate.candidate
      }));
    }
  };
  Answer = {
    createAnswer: function(config){
      var peer;
      peer = new RTCPeerConnection(iceServers, optionalArgument);
      if (config.stream) {
        peer.addStream(config.stream);
      }
      if (config.onaddstream) {
        peer.onaddstream = function(event){
          config.onaddstream(event.stream, config.to);
        };
      }
      peer.onicecandidate = function(event){
        config.onicecandidate(event.candidate, config.to);
      };
      peer.setRemoteDescription(new RTCSessionDescription(config.sdp, onSdpSuccess, onSdpError));
      peer.createAnswer(function(sdp){
        peer.setLocalDescription(sdp);
        config.onsdp(sdp, config.to);
      }, onSdpError, offerAnswerConstraints);
      this.peer = peer;
      return this;
    },
    addIceCandidate: function(candidate){
      this.peer.addIceCandidate(new RTCIceCandidate({
        sdpMLineIndex: candidate.sdpMLineIndex,
        candidate: candidate.candidate
      }));
    }
  };
  swap = function(arr){
    var swapped, i$, len$, e;
    swapped = [];
    for (i$ = 0, len$ = arr.length; i$ < len$; ++i$) {
      e = arr[i$];
      if (e != null && e !== true) {
        swapped.push(i);
      }
    }
    return swapped;
  };
  window.VideoChat = VideoChat = (function(){
    VideoChat.displayName = 'VideoChat';
    var prototype = VideoChat.prototype, constructor = VideoChat;
    function VideoChat(){
      var self;
      this.sig = new Signaler(this);
      this.roomid = getToken();
      self = this;
      window.addEventListener('beforeunload', function(){
        self.part();
      });
    }
    prototype.onuserleft = function(){};
    prototype._captureUserMedia = function(callback){
      var self, constraints, onstream, onerror;
      self = this;
      constraints = {
        audio: true,
        video: true
      };
      onstream = function(stream){
        var video;
        stream.onended = function(){
          self.onuserleft('self');
        };
        self.stream = stream;
        video = document.createElement('video');
        video.id = 'self';
        video[isFirefox ? 'mozSrcObject' : 'src'] = isFirefox
          ? stream
          : window.webkitURL.createObjectURL(stream);
        video.autoplay = true;
        video.controls = false;
        video.muted = true;
        video.volume = 0;
        video.play();
        self.onaddstream(video);
        callback(stream);
      };
      onerror = function(it){
        console.error(it);
      };
      navigator.getUserMedia(constraints, onstream, onerror);
    };
    prototype.join = function(roomid){
      var self;
      this.roomid = roomid;
      self = this;
      this._captureUserMedia(function(){
        self.sig.join(roomid, function(exists){
          self.sig.isHost = !exists;
        });
      });
    };
    prototype.part = function(){
      var ref$;
      this.sig.signal('part');
      if ((ref$ = this.stream) != null) {
        ref$.stop();
      }
    };
    return VideoChat;
  }());
  return window.Signaler = function(root){
    var userid, self, peers, participants, createOffer, repeatedlyCreateOffer, options;
    this.userid = userid = getToken();
    this.isHost = false;
    self = this;
    peers = {};
    participants = {};
    this.connect = function(it){
      var socket, x$;
      socket = io.connect(it);
      this.signal = function(event, data){
        data = data || {};
        data.userid = this.userid;
        console.log('> ', event, data);
        socket.emit(event, data);
      };
      x$ = socket;
      x$.on('join', function(userid){
        console.log('< ', 'join', userid);
        if (!self.creatingOffer) {
          self.creatingOffer = true;
          createOffer(userid);
          setTimeout(function(){
            self.creatingOffer = false;
            if (self.participants && self.participants.length) {
              repeatedlyCreateOffer();
            }
          }, 1000);
        } else {
          if (!self.participants) {
            self.participants = [];
          }
          self.participants[self.participants.length] = userid;
        }
      });
      x$.on('part', function(data){
        console.log('< ', 'part', data);
        root.onuserleft(data.userid);
        return;
      });
      x$.on('sdp', function(data){
        console.log('< ', 'sdp', data);
        if (data.to == userid) {
          self.onsdp(data);
        }
      });
      x$.on('ice', function(data){
        console.log('< ', 'ice', data);
        if (data.to == userid) {
          self.onice(data);
        }
      });
      x$.on('new', function(data){
        console.log('< ', 'new', data);
        if (data.conferencing && data.newcomer != userid && !!participants[data.newcomer] == false) {
          participants[data.newcomer] = data.newcomer;
          root.stream && self.signal('joinUsr', {
            to: data.newcomer
          }, function(){});
        }
      });
    };
    createOffer = function(unto){
      var _options;
      _options = options;
      _options.to = unto;
      _options.stream = root.stream;
      peers[unto] = Offer.createOffer(_options);
    };
    repeatedlyCreateOffer = function(){
      var firstParticipant;
      firstParticipant = self.participants[0];
      if (!firstParticipant) {
        return;
      }
      self.creatingOffer = true;
      createOffer(firstParticipant);
      delete self.participants[0];
      self.participants = swap(self.participants);
      setTimeout(function(){
        self.creatingOffer = false;
        if (self.participants[0]) {
          repeatedlyCreateOffer();
        }
      }, 1000);
    };
    this.onsdp = function(message){
      var sdp, _options;
      sdp = message.sdp;
      if (sdp.type === 'offer') {
        _options = options;
        _options.stream = root.stream;
        _options.sdp = sdp;
        _options.to = message.userid;
        peers[message.userid] = Answer.createAnswer(_options);
      }
      if (sdp.type === 'answer') {
        peers[message.userid].setRemoteDescription(sdp);
      }
    };
    this.onice = function(message){
      var peer;
      peer = peers[message.userid];
      if (peer) {
        peer.addIceCandidate(message.candidate);
      }
    };
    options = {
      onsdp: function(sdp, to){
        self.signal('sdp', {
          sdp: sdp,
          to: to
        });
      },
      onicecandidate: function(candidate, to){
        self.signal('ice', {
          candidate: candidate,
          to: to
        });
      },
      onaddstream: function(stream, _userid){
        var video, onRemoteStreamStartsFlowing, afterRemoteStreamStartedFlowing;
        stream.onended = function(){
          root.onuserleft(_userid);
        };
        video = document.createElement('video');
        video.id = _userid;
        video[isFirefox ? 'mozSrcObject' : 'src'] = isFirefox
          ? stream
          : window.webkitURL.createObjectURL(stream);
        video.autoplay = true;
        video.controls = false;
        video.play();
        onRemoteStreamStartsFlowing = function(){
          if (!(video.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || video.paused || video.currentTime <= 0)) {
            afterRemoteStreamStartedFlowing();
          } else {
            setTimeout(onRemoteStreamStartsFlowing, 300);
          }
        };
        afterRemoteStreamStartedFlowing = function(){
          self.isHost && self.signal('new', {
            conferencing: true,
            newcomer: _userid
          });
          if (typeof root.onaddstream === 'function') {
            root.onaddstream(video);
          }
        };
        return onRemoteStreamStartsFlowing();
      }
    };
    this.join = function(roomid, callback){
      this.signal('join', {
        roomid: roomid
      }, callback);
    };
    this.signal = function(){
      console.error('No signalling function set!');
    };
  };
})();