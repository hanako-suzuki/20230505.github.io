const medias = {
  audio: false,
  video: {
    facingMode: {
      exact: "environment"
    }
  }
};
const video = document.getElementById("video");
video.autoplay = true;
video.muted = true;
video.playsInline = true;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const promise = navigator.mediaDevices.getUserMedia(medias);
const textArea = document.getElementById("textArea");

let pilot_flag = 0;

// import LSD from './lsd/lsd';

promise.then(successCallback)
       .catch(errorCallback);

function successCallback(stream) {
  video.srcObject = stream;
  const FPS = 30;

  // const width = canvas.width*1.5;
  // const height = canvas.height*4;

  const width = video.width/4;
  const height = video.height/4;

  let videoMatNow = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat1 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat2 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat3 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat4 = new cv.Mat(height, width, cv.CV_8UC4);

  let read_flag = 0;

  canvas.width = width;
  canvas.height = height;

  processVideo();

  function processVideo() {
    try{
      const begin = Date.now();

      // ctx.drawImage(video, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, width, height);

      // videoMatNow = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      videoMat1 = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));

      let delay = 1000 / FPS - (Date.now() - begin);
      if(delay<0){
        delay = 0;
      }
      setTimeout(processVideo, delay);

      // if(read_flag<1){
      //   videoMat2 = videoMat1.clone();
      //   read_flag += 1;
      //   let delay = 1000 / FPS - (Date.now() - begin);
      //   if(delay<0){
      //     delay = 0;
      //   }
      //   setTimeout(processVideo, delay);
      // }
      // else if(read_flag<2){
      //   videoMat3 = videoMat2.clone();
      //   videoMat2 = videoMat1.clone();
      //   read_flag += 1;
      //   let delay = 1000 / FPS - (Date.now() - begin);
      //   if(delay<0){
      //     delay = 0;
      //   }
      //   setTimeout(processVideo, delay);
      // }
      // else if(read_flag<3){
      //   videoMat4 = videoMat3.clone();
      //   videoMat3 = videoMat2.clone();
      //   videoMat2 = videoMat1.clone();
      //   read_flag += 1;
      //   let delay = 1000 / FPS - (Date.now() - begin);
      //   if(delay<0){
      //     delay = 0;
      //   }
      //   setTimeout(processVideo, delay);
      // }else{



      //   videoMat4 = videoMat3.clone();
      //   videoMat3 = videoMat2.clone();
      //   videoMat2 = videoMat1.clone();
      //   read_flag = 0;
      //   let delay = 1000 / FPS - (Date.now() - begin);
      //   if(delay<0){
      //     delay = 0;
      //   }
      //   setTimeout(processVideo, delay);
      // }
      
    }catch(e){
      location.reload();
    }
  }
}

function errorCallback(err) {
  alert(err);
};