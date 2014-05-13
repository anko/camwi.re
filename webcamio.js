// Generated by LiveScript 1.2.0
window.WCIO = {};
window.WCIO.main = function(){
  var vc, thumbs, roomID, ref$;
  vc = new VideoChat();
  thumbs = document.getElementById('thumbnails');
  vc.onaddstream = function(it){
    thumbs.appendChild(it);
  };
  vc.onuserleft = function(it){
    var video;
    video = document.getElementById(it);
    video && video.parentNode.removeChild(video);
  };
  vc.sig.connect("http://amar.io:9980");
  roomID = (ref$ = window.location.href.match(/[^/]+$/g)) != null ? ref$[0] : void 8;
  if (!roomID) {
    roomID = 'xxxxxx'.replace(/[x]/g, function(){
      return (Math.random() * 36 | 0).toString(36);
    });
    window.history.replaceState({}, "New Session ID", "/" + roomID);
  }
  console.log("Joining room " + roomID);
  return vc.join("webcamio-" + roomID);
};