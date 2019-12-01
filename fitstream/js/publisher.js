/* global tf */

import { cocoColors, cocoParts } from './coco-common.js'
import { estimatePoses } from './pose-estimator.js'
import { loadVideo, preferredVideoSize } from './camera-util.js'
import { playNote, getMidiDevices, getAnalyzerValue } from './audio-controller.js'
import { drawBodyParts, drawPoseLines, drawBox, drawWave } from './canvas-overlay.js'
import { guiState, setupGui } from './control-panel.js'
import { circleNumberBadgeShow } from './interactions.js'

const MODELURL = 'model/model.json'

const LEFTWRIST = 'LWrist'
const RIGHTWRIST = 'RWrist'

const ZONEOFFSET = 5
const ZONEHEIGHTFACTOR = 1.0
const ZONEWIDTHFACTOR = 0.7

let VIDEOSIZE = {
  width: 320,
  height: 320
}
const VIDEOZONE = {
  width: VIDEOSIZE.width * ZONEWIDTHFACTOR,
  height: VIDEOSIZE.height * ZONEHEIGHTFACTOR
}

let overlaySize = {
  width: 320,
  height: 320
}

let openposeModel = null
let waveCtx = null
let canvas = null
let canvasCtx = null
let streamer = true

const setUserMedia = function () {
  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia
}

const resetCanvasOverlaySize = function (video, canvas) {
  //overlaySize = preferredVideoSize(video, VIDEOSIZE.width, VIDEOSIZE.height)
  overlaySize = {
      width: VIDEOSIZE.width,
      height: VIDEOSIZE.height
    }

    if(streamer)
    {
     // overlaySize.width = window.wid
    }

  if (canvas) {
      canvas.setAttribute('width', overlaySize.width)
      canvas.setAttribute('height', overlaySize.height)
  }
}

const resize = function () {
  const video = document.getElementById('video')
  resetCanvasOverlaySize(video, canvas)
}

/**
 * convert image/video to Tensor input required by the model
 *
 * @param {HTMLImageElement|HTMLVideoElement} imageOrVideoInput - the image or video element
 */
function preprocessInput (imageOrVideoInput) {
  return tf.tidy(() => {
    // create tensor from input element
    return tf.browser
      .fromPixels(imageOrVideoInput)
      .reverse(1) // reverse since images are being fed from a webcam
      .toFloat()
      .expandDims()
  })
}

/**
 * Feeds an image frame from a video to the model to estimate poses
 * Looping through frames with `tf.nextFrame()`
 */
const detectPoseInRealTime = function (video) {
  resetCanvasOverlaySize(video)
  canvas.width = overlaySize.width
  canvas.height = overlaySize.height
  if(streamer)
  {
    canvas.style.width = "800px"
    canvas.style.height = "800px"
    canvas.style.marginLeft = "-200px";

  }
  

  //let name = "ethan"
//  let name = "Peter"
  var inScreen = false
  let inScreenCount = 0
  let score = 0 

  async function poseDetectionFrame () {
    let inputTensor = preprocessInput(video)

    let outputTensor = openposeModel.predict(inputTensor)

    let poses = estimatePoses(outputTensor)

    canvasCtx.clearRect(0, 0, overlaySize.width, overlaySize.height)

    if (guiState.canvas.showVideo) {
      canvasCtx.save()
      canvasCtx.scale(-1, 1)
      canvasCtx.translate(-overlaySize.width, 0)
      canvasCtx.drawImage(video, 0, 0, overlaySize.width, overlaySize.height)
      canvasCtx.restore()
    }

    if (guiState.canvas.showZones) {
      // draw left zone
      drawBox(ZONEOFFSET, ZONEOFFSET, (overlaySize.width * ZONEWIDTHFACTOR), (overlaySize.height * ZONEHEIGHTFACTOR), canvasCtx)
      // draw right zone
      drawBox(ZONEOFFSET, ZONEOFFSET, (overlaySize.width - ZONEOFFSET), (overlaySize.height * ZONEHEIGHTFACTOR), canvasCtx)
    }

    // determine the main figure in frame (i.e., person most centered in the image)
    const noseId = cocoParts.indexOf('Nose')
    const neckId = cocoParts.indexOf('Neck')
    const mainPose = poses.sort((p1, p2) => {
      let a = p1.bodyParts.filter(bp => bp.partId === noseId || bp.partId === neckId)
      let b = p2.bodyParts.filter(bp => bp.partId === noseId || bp.partId === neckId)
      if (a.length && b.length) {
        return Math.abs(VIDEOZONE.width - a[0].x) - Math.abs(VIDEOZONE.width - b[0].x)
      } else {
        return a.length - b.length
      }
    })[0]

    // draw the skeleton for the pose detected and trigger note playing
    if (mainPose) {
      inScreenCount = 0
      score = score + 0.05
      // when person in screen
/*
      if (!streamer){
        pubnub.publish({
          channel : "pubnub_onboarding_channel",
          message : {"sender": uuid,
                     "name": name,
                     "score": score,
                     "inScreen": inScreen,
                     }
        }, function(status, response) {
          //Handle error here
        });
      }

      if (!inScreen && !streamer){
        console.log("In Screen")
        inScreen = true
        pubnub.publish({
          channel : "pubnub_onboarding_channel",
          message : {"sender": uuid,
                     "name": name,
                     "score": score,
                     "inScreen": inScreen,
                     }
        }, function(status, response) {
          //Handle error here
        });
      }
*/
      const leftWrist = mainPose.bodyParts.filter(bp => bp.partName === LEFTWRIST)[0]
      const rightWrist = mainPose.bodyParts.filter(bp => bp.partName === RIGHTWRIST)[0]


      if (leftWrist && rightWrist) {
        // Normalize keypoints to values between 0 and 1 (horizontally & vertically)
        const position = normalizePositions(leftWrist, rightWrist)
        console.log("Left:")
        console.log(position.left.vertical)
        console.log("Right:")
        console.log(position.right.vertical)


        if (position.right.vertical > 0.2 || position.left.vertical > 0.2) {
          score = score + 0.1
          console.log("Publishing Score")
          console.log(score)

          if (!streamer){
            pubnub.publish({
              channel : "pubnub_onboarding_channel",
              message : {"sender": uuid,
                         "name": name,
                         "score": score,
                         "position": position,
                         "inScreen": inScreen}
            }, function(status, response) {
              //Handle error here
            });
          }
        }
      }

/*
      if (leftWrist && rightWrist) {
        // Normalize keypoints to values between 0 and 1 (horizontally & vertically)
        const position = normalizePositions(leftWrist, rightWrist)

        if (position.right.vertical > 0 && position.left.horizontal > 0) {
          playNote(
            position.right.vertical, // note
            position.left.horizontal, // volume
            guiState.noteDuration,
            guiState.chordIntervals === 'default' ? null : guiState.chordIntervals
          )
        } else {
          playNote(0, 0)
        }
      } else {
        playNote(0, 0)
      }
*/
      drawBodyParts(canvasCtx, mainPose.bodyParts, [LEFTWRIST, RIGHTWRIST], cocoColors, [overlaySize.width / VIDEOSIZE.width, overlaySize.height / VIDEOSIZE.height])
      drawPoseLines(canvasCtx, mainPose.poseLines, cocoColors, [overlaySize.width / VIDEOSIZE.width, overlaySize.height / VIDEOSIZE.height])
    }else{
      //only consecutive not in screen we change to not in screen
      inScreenCount = inScreenCount + 1
      if (inScreenCount >= 100){
        if (inScreen){
          console.log("Not In Screen")
          inScreen = false
        }
      }
    }

/*
    if (guiState.canvas.showWaveform) {
      const value = getAnalyzerValue()
      //drawWave(value, waveCtx)
    }
*/
    await tf.nextFrame()
    poseDetectionFrame()
  }

  poseDetectionFrame()
}

/**
 * Returns an object the horizontal and vertical positions of left and right wrist normalized between 0 and 1
 *
 * @param {Object} leftWrist - 'leftWrist' keypoints (corresponds to user's right hand)
 * @param {Object} rightWrist - 'rightWrist' keypoints (corresponds to user's left hand)
 */
const normalizePositions = function (leftWrist, rightWrist) {
  const leftZone = rightWrist
  const rightZone = leftWrist

  const leftEdge = ZONEOFFSET
  const verticalSplit = VIDEOZONE.width
  const rightEdge = overlaySize.width - ZONEOFFSET
  const topEdge = ZONEOFFSET
  const bottomEdge = VIDEOZONE.height

  let position = {
    right: {
      vertical: 0,
      horizontal: 0
    },
    left: {
      vertical: 0,
      horizontal: 0
    }
  }

  if (rightZone.x >= verticalSplit && rightZone.x <= rightEdge) {
    position.right.horizontal = computePercentage(rightZone.x, verticalSplit, rightEdge)
  }
  if (rightZone.y <= bottomEdge && rightZone.y >= topEdge) {
    position.right.vertical = computePercentage(rightZone.y, bottomEdge, topEdge)
  }
  if (leftZone.x >= leftEdge && leftZone.x <= verticalSplit) {
    position.left.horizontal = computePercentage(leftZone.x, verticalSplit, leftEdge)
  }
  if (leftZone.y <= bottomEdge && leftZone.y >= topEdge) {
    position.left.vertical = computePercentage(leftZone.y, bottomEdge, topEdge)
  }

  return position
}

/**
 * Compute percentage of the provided value in the given range
 *
 * @param {Number} value - a number between 'low' and 'high' to compute percentage
 * @param {Number} low - corresponds to a number that should produce value 0
 * @param {Number} high - corresponds to a number that should produce value 1
 */
const computePercentage = function (value, low, high) {
  const dist = isNaN(value) ? 0 : value
  const minDist = isNaN(low) ? 0 : low
  const maxDist = isNaN(high) ? dist + 1 : high

  return (dist - minDist) / (maxDist - minDist)
}


async function resizeVideo (domNode = 'videopublisher', size) {
  

  const video = typeof domNode === 'string' ? document.getElementById(domNode) : domNode

  video.width = size.width
  video.height = size.height
  let constraint = {
    'video': {
    
    }
  }

  //if (!isSafari()) {
    constraint.video.width = size.width
    constraint.video.height = size.height
  //}

  video.srcObject = await navigator.mediaDevices.getUserMedia(constraint)

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video)
    }
  })
}


/**
 * Kicks off the demo by loading the model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */
const bindPage = async function () {
  // https://js.tensorflow.org/api/1.0.0/#loadGraphModel
  openposeModel = await tf.loadGraphModel(MODELURL)

  const body = document.getElementsByTagName('body')[0]

  var video = await resizeVideo('videopublisher', VIDEOSIZE)

  try {
    await setupGui([])
    body.className = 'ready'
    detectPoseInRealTime(video)
  } catch (e) {
    body.className = 'error'
    const info = document.getElementById('info')
    info.textContent = 'Browser does not support video capture or this device does not have a camera'
    throw e
  }

  window.onresize = resize
}

var apiKey = "46433932";
var sessionId = "1_MX40NjQzMzkzMn5-MTU3MDM4MDUxMTg2OX5iaFNjdW9uZnpJaUhXTFBnQTdHVnRjN3Z-fg";
var token = "T1==cGFydG5lcl9pZD00NjQzMzkzMiZzaWc9Nzc0YTlhNDVmMzAxMmQ0M2FlZjMyNTQ3ZDg4YTQ2MGNjNjE2YmU3MzpzZXNzaW9uX2lkPTFfTVg0ME5qUXpNemt6TW41LU1UVTNNRE00TURVeE1UZzJPWDVpYUZOamRXOXVabnBKYVVoWFRGQm5RVGRIVm5Sak4zWi1mZyZjcmVhdGVfdGltZT0xNTcxODExOTE0Jm5vbmNlPTAuMzk4MTE4MjAwNzQwMjAxNzcmcm9sZT1wdWJsaXNoZXImZXhwaXJlX3RpbWU9MTU3NDQwNzUxMyZjb25uZWN0aW9uX2RhdGE9c3RyZWFtZXImaW5pdGlhbF9sYXlvdXRfY2xhc3NfbGlzdD0=";

// Create PubNub
const uuid = PubNub.generateUUID();
const pubnub = new PubNub({
  publishKey: "pub-c-0f22c5e7-a0d5-4694-bd0c-73da75b0db21",
  subscribeKey: "sub-c-8fc78270-e7dd-11e9-914e-0a6be83abca1",
  uuid: uuid
});

function handleError(error) {
  if (error) {
    alert(error.message);
  }
}

// init the app
const init2 = function () {
  
    canvas = document.getElementById('output')
    canvasCtx = canvas.getContext('2d')
    setUserMedia()
    bindPage()
}

var subscriberCount = 0
// init the app
const init = function () {

  circleNumberBadgeShow(4);
  var session = OT.initSession(apiKey, sessionId);

  session.on('connectionCreated', function(e) {
    subscriberCount++;
    //circleNumberBadgeShow(subscriberCount);
  });

  session.on('connectionDestroyed', function(e) {
    subscriberCount--;
    //circleNumberBadgeShow(subscriberCount);
  });

  // Create a publisher
  var publisher;
  if(navigator.platform == 'Linux armv8l')
  {
    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      name: 'streamer'
    }, handleError);
  }
  else
  {
    publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      name: 'viewer'
    }, handleError);
  }
  publisher.publishAudio(true);

  // Connect to the session
  session.connect(token, function(error) {
    // If the connection is successful, initialize a publisher and publish to the session
    if (error) {
      handleError(error);
    } else {
      session.publish(publisher, handleError);
    }
  });
 
  document.getElementById('engagement').style.visibility = "visible";

  publisher.on('videoElementCreated', function(event) {
    event.element.id = "videopublisher";
    document.getElementById("publisher").style.visibility = "hidden";
  });
  setTimeout(init2, 1000)
} 

// run the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  setTimeout(init, 500)
}
