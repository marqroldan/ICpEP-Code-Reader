 import simpleBlobDetector from '/blobdetect.js';

 function webcam() {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        video.srcObject = stream;
        video.onloadedmetadata = function(e) {
            video.play();
        };
    });
}

function picker() {
    if(document.querySelector('video')) {
        webcam();
    }
    else {
        var video = {};
        
        video = document.querySelector('img');
        stream.getContext('2d').drawImage(video, 0, 0, video.width, video.height);


        ///Overlay a hexagon mask to limit the area of checking
        

    }
}   

        var stat = function() {
            let src = cv.imread('stream');
            let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
            cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
            cv.medianBlur(src, src, 5);
            cv.Canny(src, src, 255, 255, 3);
            cv.threshold(src, src, 120, 200, cv.THRESH_BINARY);
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            // You can try more different parameters
            cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
            console.log(contours.size())
            // draw contours with random Scalar
            for (let i = 0; i < contours.size(); ++i) {
                let cnt = contours.get(i);
                let vertices = cnt.size().width * cnt.size().height;

                //if(vertices!=24) continue;
                //if(hierarchy.intPtr(0,i)[3]==-1) continue;

                let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                          Math.round(Math.random() * 255));
                console.log("Vertices:", vertices, "Color:", color, "Hierarchy", hierarchy.intPtr(0,i))
                cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
            }
            cv.imshow('edit', dst);
            src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
        }

        var mido = function() {
          //draw the stream to the canvas
          stream.getContext('2d').drawImage(video, 0, 0, 640, 480);
            //makesure it loops back
            setTimeout(function() {
                mido();
            }, 50);
            
        }
        var x = document.querySelector("#capture")
        if(x) x.addEventListener('click',mido);
        var y = document.querySelector("#stat");
        if(y) y.addEventListener('click',stat);

        
    document.addEventListener('DOMContentLoaded', picker);


    

    /*
    let src = cv.imread('stream');
    console.log(simpleBlobDetector(src));
    
    cv.cvtColor(src, src, cv.COLOR_RGBA2RGB);
    let dst = new cv.Mat();
    let M = new cv.Mat();
    let ksize = new cv.Size(5, 5);
    // You can try more different parameters
    M = cv.getStructuringElement(cv.MORPH_CROSS, ksize);
    cv.morphologyEx(src, dst, cv.MORPH_GRADIENT, M);
    console.log(dst);
    src.delete(); dst.delete(); M.delete();

    ///////////////////////////////////////////////////


    let src = cv.imread('stream');
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    let lines = new cv.Mat();
    let color = new cv.Scalar(255, 0, 0);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, src, 50, 200, 3);
    // You can try more different parameters
    cv.HoughLinesP(src, lines, 1, Math.PI / 180, 2, 0, 0);
    console.log(lines.data32S);
    // draw lines
    for (let i = 0; i < lines.rows; ++i) {
        let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
        let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
        cv.line(dst, startPoint, endPoint, color);
    }
    cv.imshow('edit', dst);
    src.delete(); dst.delete(); lines.delete();
    */


    //This is a better code for detecting features
   /*
    let src = cv.imread('stream');
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
                cv.Canny(src, src, ts1, ts2, aperture);
    //cv.threshold(src, src, fx, fy, cv.THRESH_BINARY);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    // You can try more different parameters
    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    // draw contours with random Scalar
    console.log(contours.size());
    for (let i = 0; i < contours.size(); ++i) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                Math.round(Math.random() * 255));
        cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
    }
    cv.imshow('edit', dst);
    src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
    */