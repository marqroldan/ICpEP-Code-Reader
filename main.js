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
            started = true;
            
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
            let segments = [];
            let polyCount = 0;
            //let centroids = [];


            cv.findContours(img, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

            // approximates each contour to polygon
            for (let i = 0; i < contours.size(); ++i) {
                //We're only going to look for exactly 2 hexagons.
                let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                Math.round(Math.random() * 255));
                if(poly.size() == 2)  {
                    doCheck();
                    break;
                }
                let tmp = new cv.Mat();
                let cnt = contours.get(i);
                //let moment = cv.moments(cnt, false);
                //centroids.push({x: moment.m10/moment.m00, y: moment.m01/moment.m00});

                cv.approxPolyDP(cnt, tmp, 30, true);
                let vertices = tmp.size().width * tmp.size().height

                if(vertices >= 6 || vertices <= 10)  {
                    let circle = cv.minEnclosingCircle(tmp);
                    if( circle.radius >= 130 && circle.radius <= 300) {
                        circles.push(circle);
                        poly.push_back(tmp);
                        cv.drawContours(src, poly, polyCount, color, 1, 8, hierarchy, 0);
                        polyCount++;
                    }
                }
                cnt.delete(); tmp.delete();
                if(i==contours.size()-1) {
                    started = false;
                }
                //test

                //let tmp2 = new cv.Mat();
                //let cnt2 = contours.get(i);

                //cv.approxPolyDP(cnt2, tmp2, 0, true);
                //poly2.push_back(tmp2);

                //cv.drawContours(src, contours, i, color, 1, 8, hierarchy, 0);

                //cv.imshow('edit', src);


                //cnt2.delete(); tmp2.delete();

            }

            if(poly.size()<2) {
                started = false;
                return;
            }

            function doCheck() {
            //Get the biggest hexagon and the circle 
            let biggestCircle = circles[0]['radius'] > circles[1]['radius'] ? circles[0] : circles[1];
            let biggestHexagon = circles[0]['radius'] > circles[1]['radius'] ? poly.get(0) : poly.get(1);
            let circlesDistance = Math.abs(circles[0]['radius'] - circles[1]['radius']);
            const newRadius = biggestCircle.radius + (circlesDistance * 4);
            
            if (circlesDistance<10) {
                console.log('too small');
                started = false;
                return;
            }
            if (circlesDistance>15) {
                console.log('too big');
                started = false;
                return;
            }


            //Pie
            //console.log('Circle Radius',biggestCircle.radius)
            console.log(biggestCircle);

            for(let i = 0; i<6; i++) {
                const startPoint = [
                    biggestHexagon.intPtr(i%6)[0] - biggestCircle.center.x,
                    //y: (startPoint[1] > biggestCircle.center.y) ? biggestCircle.center.y - startPoint[1] : startPoint[1] - biggestCircle.center.y,
                    biggestCircle.center.y - biggestHexagon.intPtr(i%6)[1],
                ]

                const endPoint = [
                    biggestHexagon.intPtr((i+1)%6)[0] - biggestCircle.center.x,
                    //y: (endPoint[1] > biggestCircle.center.y) ? biggestCircle.center.y - endPoint[1] : endPoint[1] - biggestCircle.center.y,
                    biggestCircle.center.y - biggestHexagon.intPtr((i+1)%6)[1],
                ];

                //wrt to circle center
                /*
                startPoint[0] = startPoint[0] - biggestCircle.center.x;
                startPoint[1] = startPoint[1] - biggestCircle.center.y;
                endPoint[0] = endPoint[0] - biggestCircle.center.x;
                endPoint[1] = endPoint[1] - biggestCircle.center.y;*/


                const slope = (endPoint[1] - startPoint[1]) / (endPoint[0] - startPoint[0]);

                const cx = startPoint[0];
                const cy = startPoint[1];
                const distCP = Math.hypot(cx,cy);

                const dx = startPoint[0] - endPoint[0];
                const dy = startPoint[1] - endPoint[1];
                const distSP = Math.hypot(dx,dy) / 2;

                const angle = 2 * (180/Math.PI) * (Math.asin(distSP/distCP));

                segments.push( {
                    startPoint,
                    endPoint,
                    slope,
                    hyp: distCP,
                    angle
                });

               // console.log('Vert:',i,'points',[startPoint,endPoint],'dist hex', distSP, 'dist circ', distCP, 'angle', angle)
            }


            console.log(segments);

            let cropping = {
                topLeft: {
                    x: biggestCircle.center.x - biggestCircle.radius - (circlesDistance * 3),
                    y: biggestCircle.center.y - biggestCircle.radius - (circlesDistance * 3),
                },
            }
            cropping.width = (biggestCircle.center.x + biggestCircle.radius + (circlesDistance * 3)) - cropping.topLeft.x;
            cropping.height = (biggestCircle.center.y + biggestCircle.radius + (circlesDistance * 3)) - cropping.topLeft.y;

            //Crop the image
            //let croppingRect = new cv.Rect(cropping.topLeft.x, cropping.topLeft.y, cropping.width, cropping.height);
            //img = src.roi(croppingRect);

            let donePoints = {};
            let findBase = [];



            console.log(circlesDistance, Math.PI * Math.pow((circlesDistance),2), circlesDistance/2, Math.PI * Math.pow((circlesDistance/2),2));


            for (let i = 0; i < contours.size(); ++i) {
                let cnt = contours.get(i);
                let bound = cv.boundingRect(cnt);
                const area = bound.width * bound.height;
                //if(bound.width * bound.height > (Math.PI * Math.pow(circlesDistance,2)) || bound.width * bound.height < (Math.PI * Math.pow(circlesDistance*0.5,2))) continue;
                
                // || area < Math.pow(circlesDistance*0.4,2) 
                //|| area < (Math.PI * Math.pow((circlesDistance/2)*0.8,2))
                // || (area < (Math.PI * Math.pow((circlesDistance/2) * 0.88,2)))
                // || (area < (Math.PI * Math.pow((circlesDistance/2) * 0.5,2)))
                
                //Getting rid of large and really small shapes part 1
                if((area > (Math.PI * Math.pow((circlesDistance/2) * 1.75,2))) || (area < (Math.PI * Math.pow((circlesDistance/2) * 0.25,2)))) continue;
                //Getting rid of unwanted shapes part 2
                /*
                if(!(bound.width >= (circlesDistance * 0.5) && bound.width <= (circlesDistance * 1.5) && bound.height >= (circlesDistance * 0.5) && bound.width <= (circlesDistance * 1.5))) {
                    console.log(bound.width, bound.height);
                    continue;
                }*/
                
                let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                Math.round(Math.random() * 255));


                //console.log(bound.width * bound.height, (Math.PI * Math.pow(circlesDistance*0.5,2)))
                let xc = bound.x + (bound.width/2);
                let yc = bound.y + (bound.height/2);

                //wrt to circle
                xc = xc - biggestCircle.center.x;
                yc = biggestCircle.center.y - yc;

                const distanceFromCircle = Math.hypot(xc,yc)

                if(distanceFromCircle <= newRadius) {

                let lastx = 0;
                let lasty = 0;
                // j is the segment number
                for(let j = 0; j<6; j++) {
                    let distLast = 0;
                    if( lastx==0 && lasty==0) {
                        lastx = segments[j].startPoint[0];
                        lasty = segments[j].startPoint[1];
                    }
                    else {
                        //get distance of last x and last y vs new points and replace lastx and lasty
                        distLast = Math.hypot(segments[j].startPoint[0] - lastx, segments[j].startPoint[1] - lasty);
                        lastx = segments[j].startPoint[0];
                        lasty = segments[j].startPoint[1];
                        if (distLast < (circlesDistance * 0.8)) continue;
                    }
                    if(!(j in donePoints)) donePoints[j] = [];

                    let pointSlope = (segments[j].startPoint[1] - yc) / (segments[j].startPoint[0] - xc);

                    const distanceFromStart = Math.hypot(segments[j].startPoint[0] - xc, segments[j].startPoint[1] - yc);
                    const angle = (180/Math.PI) * (Math.acos((Math.pow(segments[j].hyp,2) + Math.pow(distanceFromCircle,2) - Math.pow(distanceFromStart,2))/(2 * segments[j].hyp * distanceFromCircle)));

                    //xDiff
                    const xDiff = xc - segments[j].startPoint[0];

                    const deets = {
                        bound,
                        xc,
                        yc,
                        area,
                        distLast,
                        angle,
                        xDiff,
                        pointSlope,
                        distanceFromCircle,
                        distanceFromStart,
                    }
                    //check if slopes are equal and also within the radius
                    if (  
                        distanceFromCircle <= newRadius && (((pointSlope*segments[j].slope > 0) && angle <= segments[j].angle) || angle <  7) && 
                        (bound.width >= (circlesDistance * 0.5) && bound.width <= (circlesDistance * 1.5) && bound.height >= (circlesDistance * 0.5) && bound.width <= (circlesDistance * 1.5))
                    ) {
                        if(angle < 7) {
                            findBase.push(j);
                        }
                        else {
                            donePoints[j].push(deets);
                            polyCirc.push_back(cnt);
                            cv.drawContours(src, contours, i, color, 1, 8, hierarchy, 0);
                        }
                        break;
                    }
                    else {

                        if(xc > 121 && xc < 121 + 21 && yc > -52 - 21 && yc < -52 ) console.log(deets);
                        if(xc > 126 - 15 && xc < 121 + 15 && yc > 84 - 10 && yc < 84 + 10 ) console.log(deets);

                        //cv.drawContours(src, contours, i, color, 1, 8, hierarchy, 0);
                        //if(distanceFromCircle <= newRadius) console.log(deets);
                        //console.log(deets);
                    }
                }

                    //console.log(distanceFromCircle, bound.x + (bound.width/2), bound.y + (bound.height/2))
                }


                let newSet = {};
                if(i==contours.size()-1) {
                    if(findBase.length == 2) {
                        cv.imshow('edit', src);
                        console.log(findBase);
                        console.log("donePoints", donePoints);
                        started = true;
                        //loop through the segments
                        for(let j = 0; j<6; j++) {
                            //Check if the points in the segments contain only 9 or less
                            if(donePoints[j].length > 9) {
                                started = false;
                                break;
                            }
                            if(!(j in newSet)) newSet[j] = {};
                            let doneInPoints = [];

                            let angle = segments[j].angle;
                            let startAngle = (angle * 0.23227383863);
                            let increment = (angle - startAngle) / 8;
                            console.log(donePoints[j], donePoints[j].length);
                            for(let a = startAngle, ctr = 0; a < angle; a+=increment, ctr++) {
                                if(!(ctr in newSet[j])) newSet[j][ctr] = [];
                                for(let b = 0; b < donePoints[j].length; b++) {
                                    if (doneInPoints.includes(b))continue;
                                    if (donePoints[j][b].angle <= a) {
                                        console.log("angle",angle,"seg",a, "index", ctr, "pointAng", donePoints[j][b] );
                                        doneInPoints.push(b);
                                        newSet[j][ctr].push(donePoints[j][b]);
                                    }
                                }
                                if(doneInPoints.length==donePoints[j].length) break;
                            }
                        }
                        console.log(newSet);
                    }
                    else {
                        started = false;
                    }
                    
                }
            }
        }
            /*
            if( (bound.width >= circlesDistance -3 && bound.width <= circlesDistance + 3 ) && 
            (bound.height >= circlesDistance && bound.height <= circlesDistance + 3 ) ) {
            }
            */
           /*

            if(bound.x >= cropping.topLeft.x && bound.x <= cropping.topLeft.x+cropping.width && bound.y >= cropping.topLeft.y && bound.y <= cropping.topLeft.y+cropping.height) {
                if( 
                //(bound.width >= (circlesDistance * 0.7) && bound.width <= (circlesDistance * 1.3)  && bound.height >= (circlesDistance * 0.7) && bound.height <= (circlesDistance * 1.3)) 
                //&& 
                (bound.width * bound.height >= Math.pow((circlesDistance * 0.5),2) && bound.width * bound.height <= Math.pow((circlesDistance * 1.5),2) ) 
                && 
                (bound.width / bound.height >= 0.8 && bound.width/bound.height <= 1.2)
                )
                {
                polyCirc.push_back(cnt);
                cv.drawContours(src, contours, i, color, 1, 8, hierarchy, 0);
                }
            }
            */
            

            

            //cv.drawContours(src, contours, i, color, 1, 8, hierarchy, 0);

            /*
            let contours1 = new cv.MatVector();
            cv.findContours(img, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
            // approximates each contour to polygon
            for (let i = 0; i < contours.size(); ++i) {
                let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                          Math.round(Math.random() * 255));
                cv.drawContours(img, contours, i, color, 1, 8, hierarchy, 0);
                cv.imshow('edit', img);
            }

            //Let's do another contour checking 

            //square on the vertices 
            //(circlesDistance * 2.91) => diagonal distance of the square
            //center is at the vertex
            
            /*
            let vercs = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
            //loop through the vertices of 
            for(let i = 0; i<6; i++) {
                const [x, y] = biggestHexagon.intPtr(i);

            }



            //Loops through the 2 polygons; there should only be exactly 2 hexagons.
            /*
            for(let i = 0; i < poly.size(); i++) {
                let cnt = poly.get(i);
                circle = circles[i];
                let circleColor = new cv.Scalar(255, 0, 0);
                cv.circle(src, circle.center, circle.radius, circleColor);
                let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                                          Math.round(Math.random() * 255));

                for(let j = 0; j<cnt.size().width * cnt.size().height; j++) {
                    const [x,y] = cnt.intPtr(j);
                }
                console.log("Color:", color)
                cv.drawContours(src, poly, i, color, 1, 8, hierarchy, 0);
                
                if(i==poly.size()-1) {
                    dst = src.roi(croppingRect);
                    cv.imshow('edit', dst);
                    poly.delete();
                    src.delete(); dst.delete(); hierarchy.delete(); contours.delete();
                    return foundT;
                }
            }*/




            /*
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