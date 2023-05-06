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

  let width = video.clientWidth;
  let height = video.clientHeight;

  let videoMat1 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat2 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat3 = new cv.Mat(height, width, cv.CV_8UC4);
  let videoMat4 = new cv.Mat(height, width, cv.CV_8UC4);

  let outMat = cv.Mat.zeros(height, width, cv.CV_8UC3);

  let read_flag = -1;

  let sum = [0, 0, 0];

  let data1 = [];
  let data2 = [];
  let data3 = [];
  let data4 = [];

  let frame_num = 4;

  canvas.width = width;
  canvas.height = height;

  processVideo();

  function processVideo() {
    try{
      const begin = Date.now();

      if(width != video.clientWidth || height != video.clientHeight){
        width = video.clientWidth;
        height = video.clientHeight;
        canvas.width = width;
        canvas.height = height;
        videoMat1 = new cv.Mat(height, width, cv.CV_8UC4);
        videoMat2 = new cv.Mat(height, width, cv.CV_8UC4);
        videoMat3 = new cv.Mat(height, width, cv.CV_8UC4);
        videoMat4 = new cv.Mat(height, width, cv.CV_8UC4);
        outMat = cv.Mat.zeros(height, width, cv.CV_8UC3);
        read_flag = 0;
      }

      ctx.drawImage(video, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
      // ctx.drawImage(video, 0, 0, width, height);

      // videoMatNow = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      videoMat1 = cv.matFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if(read_flag<0){
        ; // 何もしない
      }
      else if(read_flag<1){
        videoMat2 = videoMat1.clone();
        read_flag += 1;
      }
      else if(read_flag<2){
        videoMat3 = videoMat2.clone();
        videoMat2 = videoMat1.clone();
        read_flag += 1;
      }
      else if(read_flag<3){
        videoMat4 = videoMat3.clone();
        videoMat3 = videoMat2.clone();
        videoMat2 = videoMat1.clone();
        read_flag += 1;
      }else{
        for(let col=0; col<width;col++){
          for(let row=0; row<height; row++){
            sum = [0, 0, 0];
            data1 = videoMat1.ucharPtr(row,col);
            data2 = videoMat2.ucharPtr(row,col);
            data3 = videoMat3.ucharPtr(row,col);
            data4 = videoMat4.ucharPtr(row,col);
            for(let c=0; c<3; c++){
              sum[c] += data1[c]/frame_num;
              sum[c] += data2[c]/frame_num;
              sum[c] += data3[c]/frame_num;
              sum[c] += data4[c]/frame_num;
            }
            // if(sum[0]>90 & sum[0]<105 & sum[1]<120 & sum[2]>110){ // only iPhone
            //   outMat.ucharPtr(row,col)[0] = sum[0];
            //   outMat.ucharPtr(row,col)[1] = sum[1];
            //   outMat.ucharPtr(row,col)[2] = sum[2];
            //   // console.log("x:", col, " y:", row, " sum:", sum);
            // }
            // if(80<sum[0] & sum[0]<120 & sum[1]<120 & sum[2]>110){ // loose threshold
            //   outMat.ucharPtr(row,col)[0] = sum[0];
            //   outMat.ucharPtr(row,col)[1] = sum[1];
            //   outMat.ucharPtr(row,col)[2] = sum[2];
            // }
            if(125<sum[0] & sum[0]<165 & sum[1]<90 & 90<sum[2] & sum[2]<130){ // display
              outMat.ucharPtr(row,col)[0] = sum[0];
              outMat.ucharPtr(row,col)[1] = sum[1];
              outMat.ucharPtr(row,col)[2] = sum[2];
              // console.log("x:", col, " y:", row, " sum:", sum);
            }
          }
        }

        // hough lines detection
        houghDetection(outMat, height, width, videoMat1);

        // count pixels
        CountPixels(outMat, height, width, videoMat1);
 
        read_flag = 0;
      }

      let delay = 1000 / FPS - (Date.now() - begin);
      if(delay<0){
        delay = 0;
      }
      setTimeout(processVideo, delay);
      
    }catch(e){
      location.reload();
    }
  }
}

// hough detection only long length
function houghDetection(tMat, height, width, MatImage1){
  // set variables
  let num = width*0.1;
  let outMat = tMat.clone();
  let imgMat = MatImage1.clone();
  let GrayMat = new cv.Mat(height, width, cv.CV_8UC1);
  let lines = new cv.Mat(); // 検出された直線を格納
  let horizontal_lines = []; // 水平な直線を格納

  // RGB to GRAY scale
  cv.cvtColor(outMat, GrayMat, cv.COLOR_RGB2GRAY);

  // エッジ検出
  cv.Canny(GrayMat, GrayMat, 50, 200, 3);

  // ハフ変換で直線の始点と終点を取得
  cv.HoughLinesP(GrayMat, lines, 1, Math.PI/180, 2, 0, 0);
  // 水平の直線を探す
  for(let i = 0; i<lines.rows; i++){
    let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
    let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);

    // 点を除去
    if(startPoint.x == endPoint.x & startPoint.y == endPoint.y){
      continue;
    }

    // 線分の角度を求める
    let theta;
    if(startPoint.x != endPoint.x){
      theta = Math.atan(Math.abs((startPoint.y-endPoint.y)/(startPoint.x-endPoint.x)));
    }
    else{ // 垂直の場合
      continue;
    }

    if(theta>0.1745){ // if theta > 10[rad] -> delete
      continue;
    }
    horizontal_lines.push([startPoint, endPoint, theta]);
  }
  let fuse_lines = fusion(horizontal_lines);
  let max_length = 0;
  let max_id = -1;
  for(let i=0; i<fuse_lines.length; i++){ // check longest line
    let tmp = Math.abs(fuse_lines[i][0].x-fuse_lines[i][1].x);
    if(tmp>max_length){
      max_length = tmp;
      max_id = i;
    }
  }
  if(max_id != -1){ // if line is detected

    // set variables
    let mid_x = parseInt((fuse_lines[max_id][0].x+fuse_lines[max_id][1].x)/2);
    let mid_y = fuse_lines[max_id][0].y;
    let tmp_length = max_length/4;
    let diff_length = parseInt(tmp_length/2);
    let l_sum = [0,0,0];
    let r_sum = [0,0,0];
    let l_max = 0;
    let l_idx = 0;
    let r_max = 0;
    let r_idx = 0;

    // check left brightness
    for(let i=mid_x-diff_length-2; i<mid_x-diff_length+2; i++){
      let data = MatImage1.ucharPtr(mid_y, i);
      for(let j=0; j<3; j++){
        l_sum[j] += data[j]/4;
      }
    }
    // check right brightness
    for(let i=mid_x+diff_length-2; i<mid_x+diff_length+2; i++){
      data = MatImage1.ucharPtr(mid_y, i);
      for(let j=0; j<3; j++){
        r_sum[j] += data[j]/4;
      }
    }

    // check color
    for(let i=0; i<3; i++){
      if(l_sum[i]>l_max){
        l_max = l_sum[i];
        l_idx = i;
      }
      if(r_sum[i]>r_max){
        r_max = r_sum[i];
        r_idx = i;
      }
    }

    let tmp_color = ["red", "green", "blue"];
    console.log('hough detection');
    console.log('left color:', l_sum, ' right color:', r_sum);
    console.log('left color:', tmp_color[l_idx], ' right color:', tmp_color[r_idx]);
    // cv.line(outMat, fuse_lines[max_id][0], fuse_lines[max_id][1], new cv.Scalar(255,0,0), thickness=3);
    cv.line(imgMat, new cv.Point(mid_x-diff_length-2, mid_y), new cv.Point(mid_x-diff_length+2, mid_y), new cv.Scalar(255,0,0), thickness=3);
    cv.line(imgMat, new cv.Point(mid_x+diff_length-2, mid_y), new cv.Point(mid_x+diff_length+2, mid_y), new cv.Scalar(255,0,0), thickness=3);
  }
  // cv.imshow("canvasOutput3", imgMat);
  // cv.imshow("canvasOutput3", outMat);
}

// detected lines by count pixels(loose)
function CountPixels(tMat, height, width, MatImage){
  // set variables
  let outMat = tMat.clone();
  let imgMat = MatImage.clone();
  let num = width*0.1;
  let cnt = 0;
  let start_x = width;
  let end_x = 0;
  let lines = []; // [startPoint, endPoint]
  let delta = 3;

  for(let row=0; row<height; row++){
    // reset variables
    cnt = 0; // rowで検出されたピクセルをカウント
    start_x = width;
    end_x = 0;

    for(let r=row-delta; r<=row+delta; r++){
      if(r>height){
        continue;
      }
      // detect lines
      for(let col=0; col<width; col++){
        data = outMat.ucharPtr(r, col);
        for(let c = col-delta; c<=col+delta; c++){
        // 検出されているピクセルならカウント
        if(data[0]!=0 || data[1]!=0 || data[2]!=0){
          cnt++;
          if(col<start_x){
            start_x = col;
          }
          if(col>end_x){
            end_x = col;
          }
        }}
      }
      if(cnt>num){
        lines.push([new cv.Point(start_x, row), new cv.Point(end_x, row)]);
      }
    }
  }

  let max_length = 0;
  let max_id = -1;
  for(let i=0; i<lines.length; i++){ // check longest line
    let tmp = Math.abs(lines[i][0].x-lines[i][1].x);
    if(tmp>max_length){
      if(10<lines[i][0].y & lines[i][0].y<1000){
        max_length = tmp;
        max_id = i;
      }
    }
  }
  if(max_id != -1){ // if line is detected

    // set variables
    let mid_x = parseInt((lines[max_id][0].x+lines[max_id][1].x)/2);
    let mid_y = lines[max_id][0].y;
    let tmp_length = max_length/4;
    let diff_length = parseInt(tmp_length/2);
    let l_sum = [0,0,0];
    let r_sum = [0,0,0];
    let l_max = 0;
    let l_idx = 0;
    let r_max = 0;
    let r_idx = 0;

    console.log('mid_y:', mid_y);

    // check left brightness
    for(let i=mid_x-diff_length-2; i<mid_x-diff_length+2; i++){
      let data = imgMat.ucharPtr(mid_y, i);
      for(let j=0; j<3; j++){
        l_sum[j] += data[j]/4;
      }
    }
    // check right brightness
    for(let i=mid_x+diff_length-2; i<mid_x+diff_length+2; i++){
      data = imgMat.ucharPtr(mid_y, i);
      for(let j=0; j<3; j++){
        r_sum[j] += data[j]/4;
      }
    }

    // check color
    for(let i=0; i<3; i++){
      if(l_sum[i]>l_max){
        l_max = l_sum[i];
        l_idx = i;
      }
      if(r_sum[i]>r_max){
        r_max = r_sum[i];
        r_idx = i;
      }
    }

    let tmp_color = ["red", "green", "blue"];
    console.log('count pixels');
    console.log('left color:', l_sum, ' right color:', r_sum);
    console.log('left color:', tmp_color[l_idx], ' right color:', tmp_color[r_idx]);
    cv.line(imgMat, new cv.Point(mid_x-diff_length-2, mid_y), new cv.Point(mid_x-diff_length+2, mid_y), new cv.Scalar(255,0,0), thickness=3);
    cv.line(imgMat, new cv.Point(mid_x+diff_length-2, mid_y), new cv.Point(mid_x+diff_length+2, mid_y), new cv.Scalar(255,0,0), thickness=3);
  }

  // cv.imshow("canvasOutput5", imgMat);
}


function fusion(para_lines){
  // 各直線が他の直線と重なっているかを確認し重なっていれば融合
  if(para_lines.length <1){
    return para_lines;
  }

  let fuse_lines = [];
  let fused_list = [];

  for(let i=0; i<para_lines.length; i++){
    if(fused_list.indexOf(i)>-1){
      continue;
    }
    let new_line = para_lines[i].concat();
    for(let j=0; j<para_lines.length; j++){
      if(i != j){
        let tmp = fusion_lines(new_line, para_lines[j]);
        new_line = tmp[0].concat();
        if(tmp[1]==1){
          fused_list.push(j);
        }
      }
    }
    fuse_lines.push(new_line);
  }

  return fuse_lines;
}

function fusion_lines(lineA, lineB){
  const distance = Math.abs(lineA[0].y - lineB[0].y);
  const pA = [Math.min(lineA[0].x, lineA[1].x), Math.max(lineA[0].x, lineA[1].x)];
  const pB = [Math.min(lineB[0].x, lineB[1].x), Math.max(lineB[0].x, lineB[1].x)];
  // const cnt = Math.max(lineA[3], lineB[3]);

  if(distance > 7){
    // ２つの線が十分に離れていれば終了
    return [lineA, 0];
  }
  // if(pA[0] > pB[1]+30 & pB[0] > pA[1]+30){
  //   // 重なっていなければ終了
  //   return [lineA, 0];
  // }

  let tmp = (lineA[0].y + lineA[1].y + lineB[0].y + lineB[1].y)/4;
  let y = parseInt(tmp);
  let tmpp = tmp-y // tmpの小数点以下の値
  if(tmpp>=0.5){ // 切り捨てではなく、四捨五入
    y += 1;
  }
  let x1 = Math.min(lineA[0].x, lineA[1].x, lineB[0].x, lineB[1].x);
  let x2 = Math.max(lineA[0].x, lineA[1].x, lineB[0].x, lineB[1].x);
  // let new_line = [new cv.Point(x1, y), new cv.Point(x2, y), 0, cnt];
  let new_line = [new cv.Point(x1, y), new cv.Point(x2, y), 0];

  return [new_line, 1];
}


function errorCallback(err) {
  alert(err);
};