import './blobdetect.js'
 
 
function webcam() {
   navigator.mediaDevices.getUserMedia({ video: true })
   .then(function(stream) {
       video.srcObject = stream;
       video.onloadedmetadata = function(e) {
           video.play();
           mido();
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
       var started = false;

       var stat = function() {
           started = true;
           /*
           let src = cv.imread('stream');
           let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
           cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
           cv.medianBlur(src, src, 5);
           cv.Canny(src, src, 255, 255, 3);
           cv.threshold(src, src, 120, 200, cv.THRESH_BINARY);
           let contours = new cv.MatVector();
           let hierarchy = new cv.Mat();
           // You can try more different parameters
           cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
           console.log(contours.size())
           // draw contours with random Scalar
           for (let i = 0; i < contours.size(); ++i) {
               let cnt = contours.get(i);
               let vertices = cnt.size().width * cnt.size().height;


               for(let j = 0; j<vertices; j++) {
                   const [x,y] = cnt.intPtr(j);
                   console.log('x',x,'y',y);
               }
               //if(vertices < 400) continue;
               //if(vertices!=24) continue;
               //if(hierarchy.intPtr(0,i)[3]==-1) continue;

               let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                         Math.round(Math.random() * 255));
               console.log("Vertices:", vertices, "Color:", color, "Hierarchy", hierarchy.intPtr(0,i))
               cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
           }
           cv.imshow('edit', dst);
           src.delete(); dst.delete(); contours.delete(); hierarchy.delete();

           */
           let src = cv.imread('stream');
           let img = cv.imread('stream');
           let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
           cv.cvtColor(img, img, cv.COLOR_RGBA2GRAY, 0);
           cv.threshold(img, img, 100,  180, cv.THRESH_BINARY);
           //cv.Laplacian(img, img, cv.CV_8U, 1, 1, 0, cv.BORDER_DEFAULT);
           let contours = new cv.MatVector();
           let hierarchy = new cv.Mat();
           let poly = new cv.MatVector();
           let polyCirc = new cv.MatVector();
           let poly2 = new cv.MatVector();
           let circles = [];
           let polyCount = 0;
           cv.findContours(img, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
           //console.log(contours.size());
           if(contours.size() > 0) {
               
           for (let i = 0; i < contours.size(); ++i) {
            let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                      Math.round(Math.random() * 255));
               //We're only going to look for exactly 2 hexagons.
               if(poly.size() == 2)  {
                  doCheck();
                  break;
               }
               let tmp = new cv.Mat();
               let cnt = contours.get(i);
               cv.approxPolyDP(cnt, tmp, 20, true);
               let vertices = tmp.size().width * tmp.size().height
               
               if(true) {
                if(vertices==6)  {
                    let circle = cv.minEnclosingCircle(tmp);
                    if( circle.radius >= 130 && circle.radius <= 175) {
                        circles.push(circle);
                        poly.push_back(tmp);
                        cv.drawContours(src, poly, polyCount, color, 1, cv.LINE_8, hierarchy, 0);
                        cv.imshow('edit', src);
                        polyCount++;
                    }
                }
               }
               else {
                cv.drawContours(src, contours, i, color, 1, cv.LINE_8, hierarchy, 0);
                cv.imshow('edit', src);
               }
               cnt.delete(); tmp.delete();
               if(i==contours.size()-1) {
                   started= false;
               }
           }
        }else {
            started = false;
        }

           function doCheck() {
               started = true;
               let vdist = [];

               for(let i=0; i<6; i++) {
                const [x1,y1] = poly.get(0).intPtr(i);
                const [x2,y2] = poly.get(1).intPtr(i);
                    const xd = Math.abs(x2-x1);
                    const yd = Math.abs(y2-y1);
                    const dist = Math.hypot(xd,yd)
                    vdist.push(dist);
               }

            let mindist = Math.min(...vdist);
            let maxdist = Math.max(...vdist);
            if(Math.abs(maxdist-mindist) < 50) {
                started = true;
                //show image
                console.log("min", mindist, "max", maxdist, "dist",Math.abs(maxdist-mindist))
                cv.imshow('edit', src);
            }
            else {
                started = false;
            }

            src.delete(); img.delete(); dst.delete(); hierarchy.delete(); contours.delete();
           }

           /*
                       cv.drawContours(src, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
                       cv.imshow('edit', src);
          if (poly.size()>0) {

           // draw contours with random Scalar
           for (let i = 0; i < poly.size(); ++i) {
               let xc = poly.get(i);
               let vertices = (xc.size().width * xc.size().height);
               if(vertices!=6) continue;
               let vals = [];
                
               for(let j = 0; j<3; j++) {
                    const startPoint = {
                        x: xc.intPtr(j)[0],
                        y: xc.intPtr(j)[1],
                    }
                    const endPoint = {
                        x: xc.intPtr(j+3)[0],
                        y: xc.intPtr(j+3)[1],
                    }

                    const distance = Math.hypot(Math.abs(startPoint.x - endPoint.x), Math.abs(startPoint.y - endPoint.y));

                    vals.push(distance);

                   console.log('start',startPoint,'end',endPoint, 'distance', distance);
               }

               let vals_min = Math.min(...vals);
               vals.forEach(function(val) {
                    console.log("difference", Math.abs(vals_min-val), "<10? ", Math.abs(vals_min-x) <= 2)
               });
               let ok = vals.every(x=>Math.abs(vals_min-x) <= 10);

               if(ok) console.log("OK?", ok, "Vertices:", vertices, "Color:", color, "Hierarchy", hierarchy.intPtr(0,i))
               if(ok) 
           }
           cv.imshow('edit', src);
           poly.delete();
           return true;
          }
          else {
           src.delete(); dst.delete(); hierarchy.delete(); contours.delete();
           poly.delete();
           return false;
          }
          */
       }

       var mido = function() {
         //draw the stream to the canvas
         stream.getContext('2d').drawImage(video, 0, 0, 640, 480);

           if(!started) stat();

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
