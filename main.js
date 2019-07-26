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
        
    }
}       
        var started = false;
        var rejectAll = false;

var stat = function() {
    started = true;
    
    let src = cv.imread('stream');
    let img = cv.imread('stream');
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    cv.cvtColor(img, img, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(img, img, 90,  255, cv.THRESH_BINARY);
    cv.imshow('edit', img);
    /*
    started = false;
    src.delete(); dst.delete();  img.delete(); 
    return
    */
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
        if(vertices == 6)  {
            let vertDist = [];
            for(let k = 0; k < 3; k++) {
                const [x1, y1] = tmp.intPtr(k);
                const [x2, y2] = tmp.intPtr(k+3);
                vertDist.push(Math.hypot(x2-x1, y2-y1));
            }

            if(Math.max(...vertDist) - Math.min(...vertDist) > 6) {
                rejectAll = true;
                break;
            }

            let circle = cv.minEnclosingCircle(tmp);
            if( circle.radius >= 130 && circle.radius <= 300) {
                circles.push(circle);
                poly.push_back(tmp);
                cv.circle(src, circle.center, circle.radius, color)
                cv.drawContours(src, poly, polyCount, color, 1, 8, hierarchy, 0);
                polyCount++;
            }
        }
        cnt.delete(); tmp.delete();
        if(i==contours.size()-1) {
            started = false;
        }
    }

    if(rejectAll) {
        trash();
        started = false;
        rejectAll = false;
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

        //Looping for the finding of hexagons
        for(let i = 0; i<6; i++) {
            const startPoint = [
                biggestHexagon.intPtr(i%6)[0] - biggestCircle.center.x,
                biggestCircle.center.y - biggestHexagon.intPtr(i%6)[1],
            ]
            const endPoint = [
                biggestHexagon.intPtr((i+1)%6)[0] - biggestCircle.center.x,
                biggestCircle.center.y - biggestHexagon.intPtr((i+1)%6)[1],
            ];
            const slope = (endPoint[1] - startPoint[1]) / (endPoint[0] - startPoint[0]);
            const cx = startPoint[0];
            const cy = startPoint[1];
            const distCP = Math.hypot(cx,cy);
            const dx = startPoint[0] - endPoint[0];
            const dy = startPoint[1] - endPoint[1];
            const distSP = Math.hypot(dx,dy) / 2;
            const angle = 2 * (180/Math.PI) * (Math.asin(distSP/distCP));
            segments.push( {startPoint, endPoint, slope, hyp: distCP, angle });
        }
        console.log("Segments", segments);

        let donePoints = {};
        var findBase = [];
        let distBase = 0;

        //Looping to check the dots
        for (let i = 0; i < contours.size(); ++i) {
            if(findBase.length>2) {
                console.log('Break daw');
                started = false;
                break;
            }
            let cnt = contours.get(i);
            let bound = cv.boundingRect(cnt);
            const moment = cv.moments(cnt);
            const area = moment.m00;
            if((area > (Math.PI * Math.pow((circlesDistance/2) * 1.75,2))) || (area < (Math.PI * Math.pow((circlesDistance/2) * 0.25,2)))) continue;
            
            let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),Math.round(Math.random() * 255));
            let xc = moment.m10/moment.m00 - biggestCircle.center.x;
            let yc = biggestCircle.center.y - moment.m01/moment.m00;
            const distanceFromCircle = Math.hypot(xc,yc)
            if(distanceFromCircle <= newRadius) {
                console.log('Dots');
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
                        bound, xc, yc, area, distLast, angle, xDiff, minDist, pointSlope, distanceFromCircle, distanceFromStart,
                    }
                    //check if slopes are equal and also within the radius
                    if (  
                        distanceFromCircle <= newRadius && (((pointSlope*segments[j].slope > 0) && angle <= segments[j].angle) || angle <  7) && 
                        (bound.width >= (circlesDistance * 0.5) && bound.width <= (circlesDistance * 1.5) && bound.height >= (circlesDistance * 0.5) && bound.width <= (circlesDistance * 1.5))
                    ) {
                        if(angle < 7) {
                            findBase.push(j);
                            if(distBase==0) {
                                distBase = distanceFromCircle;
                            }
                            else {
                                distBase = (distBase + distanceFromCircle) / 2;
                            }
                        }
                        else {
                            donePoints[j].push(deets);
                            polyCirc.push_back(cnt);
                            cv.drawContours(src, contours, i, color, 1, 8, hierarchy, 0);
                            cv.imshow('edit', src);
                        }
                        break;
                    }
                }
            }
            if(i==contours.size()-1) {
                started = true;
                sorting();
                console.log('called 1');
            }
        }
    }

    function sorting() {
        let newSet = {};
        if(findBase.length == 2) {
            cv.imshow('edit', src);
            //findBase[0] - (findBase[1] % 6) should always be positive
            if(findBase[0] - (findBase[1] % 6) < 0) {
                console.log('Wrong direction');
                started = false;
                return
            }                        
            console.log("findBase", findBase);
            console.log("distBase", distBase);
            console.log("donePoints", donePoints);
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
                let startAngle = (angle * 0.31396484375); //0.23227383863
                let increment = (angle - startAngle) / 8;

                for(let a = startAngle, ctr = 0; a < angle+(increment/2); a+=increment, ctr++) {
                    if(!(ctr in newSet[j])) newSet[j][ctr] = {};

                    for(let b = 0; b < donePoints[j].length; b++) {
                        if (doneInPoints.includes(b)) continue;

                        if (donePoints[j][b].angle <= a) {
                            //There shouldn't be an item in the before the starting angle
                            if(ctr==0) {
                                started = false;
                                rejectAll = true;
                                break;
                            }

                            //Reject if found a very near angle but different section
                            if(ctr!=0) {
                                for(let key in newSet[j][ctr-1]) {
                                    if(Math.abs(newSet[j][ctr-1][key].angle - donePoints[j][b].angle) < 3.5) {
                                        console.log("BAD ANGLE", j, b, newSet[j][ctr-1][key].angle, donePoints[j][b].angle);
                                        rejectAll = true;
                                        break;
                                    }
                                }
                                if(rejectAll) {
                                    started = false;
                                    break;
                                }
                            }
                            if(Object.keys(newSet[j][ctr]).length==2) {
                                //Rejecting because there are already 2 objects in the same seciton
                                rejectAll = true;
                                break;
                            }
                            if ('0' in newSet[j][ctr]) {
                                //check which of the two is nearer
                                let tmp = newSet[j][ctr][0];
                                if(tmp.distanceFromCircle >= donePoints[j][b]) {
                                    //meaning the one in 0 should be 1
                                    newSet[j][ctr][0] = donePoints[j][b];
                                    newSet[j][ctr][1] = tmp;
                                }
                                else {
                                    newSet[j][ctr][1] = donePoints[j][b];
                                }
                            }
                            else {
                                if(donePoints[j][b].minDist <= distBase * 0.98 || donePoints[j][b].distanceFromCircle <= distBase * 0.98) {
                                    newSet[j][ctr][0] = donePoints[j][b];
                                }
                                else {
                                    newSet[j][ctr][1] = donePoints[j][b];
                                }
                            }
                                doneInPoints.push(b);
                        }
                    }
                    //if(doneInPoints.length==donePoints[j].length) break;
                    if(rejectAll)  {
                        console.log('Had to break')
                        started = false;
                        break;
                    }
                }
                /*
                if(rejectAll)  {
                    started = false;
                    break;
                }*/
            }
            
            if(rejectAll)  {
                started = false;
                //leave sorting function
                return;
            }
            
            console.log(newSet);
            let bits = {};
                for(let i = 0; i<6; i++) {
                    let bitPart = '000000000'.split("");
                    //close
                    if('0' in newSet[i][1]) bitPart[8] = '1'
                    if('0' in newSet[i][2]) bitPart[7] = '1'
                    if('0' in newSet[i][3]) bitPart[6] = '1'
                    if('0' in newSet[i][4]) bitPart[5] = '1'
                    if('0' in newSet[i][5]) bitPart[4] = '1'
                    if('0' in newSet[i][6]) bitPart[3] = '1'
                    //far
                    if('1' in newSet[i][4]) bitPart[0] = '1'
                    if('1' in newSet[i][5]) bitPart[1] = '1'
                    if('1' in newSet[i][6]) bitPart[2] = '1'
                
                    console.log("i", i, bitPart.join(''));
                    bits[i] = String(parseInt(bitPart.join(''),2)).padStart(3,'0');
                }

                    console.log(bits);

                    /*
//Number Conversion
$topleft = substr($idnum, 0, 3);            1 0
$topright = substr($idnum, 3, 3);           2 1
$left = substr($idnum, 6, 3);               3 2
$right = substr($idnum, 9, 3);              4 3
$bottomleft = substr($idnum, 12, 3);        5 4
$bottomright = substr($idnum, 15, 3);     6 5
*/
                    let finalString = '';
                    let _right = findBase[0];
                    let _bRight = findBase[1];
                    let _tLeft = _right + 2;
                    console.log(bits[findBase[0]], bits[findBase[1]]);
        }
        else {
            started = false;
        }
        
    }



    function trash() {
        src.delete(); img.delete(); dst.delete(); hierarchy.delete(); contours.delete();
    }

    trash();
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
