 import './blobdetect.js'
 
 var _width = 0;
 var _height = 0;
 var _boxDim = 0;
 
 function webcam() {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        video.srcObject = stream;
        video.onloadedmetadata = function(e) {
            video.play();
            _width = this.videoWidth;
            _height = this.videoHeight;

            document.querySelector('#stream').width = _width;
            document.querySelector('#stream').height = _height;
            document.querySelector('#edit').width = _width;
            document.querySelector('#edit').height = _height;

            _boxDim = Math.min(_width, _height) * (2/3);
            document.querySelector('#roi').width = _boxDim;
            document.querySelector('#roi').height = _boxDim;
            document.querySelector('#thresh').width = _boxDim;
            document.querySelector('#thresh').height = _boxDim;

            setTimeout(function() {
                mido();
            }, 3000)
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
var passes = [];
var started = false;


var stat = function() {
    var rejectAll = true;
    var donePoints = {};
    var donePointsD = {};
    var t = 0;
    var distLast = 0;
    var lastx = 0;
    var lasty = 0;
    var findBase = [];
    var findBaseDetails = [[],[]];
    started = true;
    
    let src = cv.imread('stream');
    let roi = new cv.Mat();
    let roi1 = new cv.Mat();
    let roirect = new cv.Rect((_width/2) - (_boxDim/2), (_height/2) - (_boxDim/2), _boxDim, _boxDim)
    roi = src.roi(roirect);
    cv.imshow('roi',roi)
    let img = cv.imread('roi');
    let dst = new cv.Mat();

    cv.cvtColor(img, img, cv.COLOR_RGBA2GRAY, 0);
    //cv.adaptiveThreshold(img, img, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 3, 2);
    cv.Canny(img, img, 90, 255, 3, true);
    //cv.threshold(img, img, 90,  255, cv.THRESH_BINARY);
    cv.imshow('edit', img);
    cv.imshow('thresh', img);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let poly = new cv.MatVector();
    let polyCirc = new cv.MatVector();
    let circles = [];
    let segments = [];
    let polyCount = 0;
    let circlesDistance = 0;
    let distBaseAverage = 0;
    let distBaseAllowance = 0;
    let biggestCircle = {};
    let ignoreIndex = [];

    cv.findContours(img, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    console.log("Starting this check", contours.size())
    // approximates each contour to polygon
    for (let i = 0; i < contours.size(); ++i) {
        //We're only going to look for exactly 2 hexagons.
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
        Math.round(Math.random() * 255));
        let tmp = new cv.Mat();
        let tmp2 = new cv.Mat();
        let tmp3 = new cv.Mat.zeros(_boxDim, _boxDim, cv.CV_8UC3);
        let cnt = contours.get(i);
        cv.convexHull(cnt, tmp, false, true);
            
        let circle = cv.minEnclosingCircle(tmp);
        if( circle.radius >= _boxDim * 0.25 && circle.radius <= _boxDim * 0.4) {
            
            //if center is within bounds
            let centerBox = _boxDim * 0.05;
            circle.x = circle.center.x - (_boxDim * 0.5);
            circle.y = (_boxDim * 0.5) - circle.center.y;

            //Ignore if out of bounds
            if(!((circle.x >= (centerBox * -1) && circle.x <= centerBox) && (circle.y >= (centerBox * -1) && circle.y <= centerBox))) continue;


            if(poly.size() > 0) {
                let firstCircle = circles[0];
                biggestCircle = circles[0]['radius'] > circle['radius'] ? circles[0] : circle;
                circlesDistance = Math.abs(circles[0]['radius'] - circle['radius']);
                //Check if the radius is within bounds
                if(circlesDistance > biggestCircle.radius * 0.1379310345 ||  circlesDistance <= biggestCircle.radius * 0.04) {
                    console.log("Bad circle distance")
                    continue;
                }
                //Check if distances of two circles aren't that great
                if(Math.hypot(firstCircle.y - circle.y, firstCircle.x - circle.y) > 6) {
                    console.log('User is moving', Math.hypot(firstCircle.y - circle.y, firstCircle.x - circle.y));
                    break;
                }

            }
            ignoreIndex.push(i);
            poly.push_back(tmp);
            circles.push(circle)
            cv.circle(roi, circle.center, circle.radius, color)
            cv.drawContours(roi, poly, polyCount, color, 1, 8, hierarchy, 0);
            cv.imshow('edit', roi);
            polyCount++;

            if(polyCount==2) {

                //check if 

                /*
                fCircle = cv.boundingRect(poly.get(0));
                fCircle.xc = fCircle.x - (_boxDim * 0.5);
                fCircle.yc = (_boxDim * 0.5) - fCircle.y;

                sCircle = cv.boundingRect(poly.get(1));
                sCircle.xc = sCircle.x - (_boxDim * 0.5);
                sCircle.yc = (_boxDim * 0.5) - sCircle.y;


                fCircle = circles[0].center;
                sCircle = circles[1].center;
                if(Math.hypot(fCircle.y - sCircle.y, fCircle.x - sCircle.y) > 15) {
                    console.log('Circle - User is moving',Math.hypot(fCircle.y - sCircle.y, fCircle.x - sCircle.y));
                    rejectAll = true;
                    break;
                }*/



            }
        }
        cnt.delete(); tmp.delete(); tmp2.delete(); tmp3.delete();
        if(poly.size() == 2)  {
            rejectAll = false;
            doCheck();
            break;
        }
    }

    //Execute this
    if(rejectAll) trash();

    function doCheck() {
        console.log('Checking for validity..');
        console.log(poly.get(0).size())
        console.log(poly.get(1).size())
        if(passes.length < 5) {
            passes.push(Math.abs(circles[0]['radius'] - circles[1]['radius']))//contours.size());
            rejectAll = true;
            console.log("Testy2")
            return;
        }
        else {
            if(Math.max(...passes) - Math.min(...passes) < 15) {
                //good to go
                console.log('good')
                rejectAll = false;
            }
            else {
                console.log('Difference', Math.max(...passes) - Math.min(...passes))
                passes = [];
                rejectAll = true;
                console.log("Testy1")
                return;
            }
        }


        //Get the biggest hexagon and the circle 
        let biggestHexagon = circles[0]['radius'] > circles[1]['radius'] ? poly.get(0) : poly.get(1);
        let verticesDiff = {};
        //circlesDistance = Math.abs(circles[0]['radius'] - circles[1]['radius']);
        const newRadius = biggestCircle.radius + (circlesDistance * 2.25);

        /*
        // Make sure the difference is not too big or not too small
        if(circlesDistance > biggestCircle.radius * 0.1379310345 ||  circlesDistance <= biggestCircle * 0.02) {
            rejectAll = true;
            console.log("Bad circle distance")
            return;
        }
        */

        biggestCircle.x = biggestCircle.center.x - (_boxDim * 0.5);
        biggestCircle.y = (_boxDim * 0.5) - biggestCircle.center.y;
        console.log(biggestCircle);

        for(let i = 0; i < biggestHexagon.size().height * biggestHexagon.size().width; i++) {
            let point = {coords: biggestHexagon.intPtr(i)};
            point.x = point.coords[0] - (_boxDim * 0.5);
            point.y = (_boxDim * 0.5) - point.coords[1];

            let distance = Math.hypot (biggestCircle.x - point.x, biggestCircle.y - point.y);
            verticesDiff[i] = distance;
        }

        console.log(verticesDiff);

        let sortedKeys = Object.keys(verticesDiff).sort(function(a, b) { return verticesDiff[b] - verticesDiff[a] })
        
        console.log(sortedKeys);
        let newSorted = [];
        let doneReadPoints = [];

        //Grouping them and making sure we only get 6 points
        for(let i = 0; i<sortedKeys.length; i++) {
            if(doneReadPoints.includes(i)) continue;
            let key = parseInt(sortedKeys[i]);
            let point = biggestHexagon.intPtr(key);
            const newPoint = {
                coords: point,
                x: point[0] - (_boxDim * 0.5),
                y: (_boxDim * 0.5) - point[1],
            }
            newSorted.push(newPoint);
            doneReadPoints.push(i);
            for(let k = 0; k < sortedKeys.length; k++) {
                if(doneReadPoints.includes(k)) continue;
                let key2 = parseInt(sortedKeys[k]);
                let point2 = biggestHexagon.intPtr(key2);
                if(Math.hypot(point2[0] - point[0], point2[1] - point[1]) < 60) {
                    //They are in the same area
                    doneReadPoints.push(k);
                }
            }
        }

        if(newSorted.length!=6) {
            console.log('Wrong number of vertices');
            rejectAll = true;
            return
        }

        let donePointsSort = [];
        let pointsInOrder = [];
        let rotation = -1;
        //Arrange them in one order and get the rotation
        //If rotation is positive (0), then the point goes counterclockwise(1)
        //Else it's clockwise;
        for(let i = 0; i < 6; i++) {
            let point = newSorted[i];
            if(i==0) {
                pointsInOrder.push(point);
                donePointsSort.push(i);
            }
            point = pointsInOrder[pointsInOrder.length - 1];
            for(let k = 0; k < newSorted.length; k++ ) {
                if(donePointsSort.includes(k)) continue;
                let point2 = newSorted[k];
                if(i==0) rotation = ((point2.y - point.y) / (point2.x - point.y)) > 0 ? 0 : 1;
                if(Math.hypot(point2.x - point.x, point2.y-point.y) <= biggestCircle.radius * 1.25) {
                    pointsInOrder.push(point2);
                    donePointsSort.push(k);
                    break;
                }
            }
        }

        console.log(rotation);
        console.log(pointsInOrder);

        let diagonalDiff = [];

        //Looping to check if it's skewed or not 
        for(let i = 0; i < 3; i++) {
            let point = pointsInOrder[i];
            let point2 = pointsInOrder[(i+3)%6];

            diagonalDiff.push(Math.hypot(point.x - point2.x, point.y - point2.y))
        }

        if(Math.max(...diagonalDiff) - Math.min(...diagonalDiff) > 9) {
            console.log("It's most likely skewed", Math.max(...diagonalDiff) - Math.min(...diagonalDiff))
            rejectAll = true;
            return;
        }


        //Looping to make segments 
        for(let i = 0; i<6; i++) {
            let startPoint = pointsInOrder[i];
            let endPoint = pointsInOrder[(i+1)%6];
            let distCP = Math.hypot(startPoint.x,startPoint.y);
            const distSP = Math.hypot(startPoint.x - endPoint.x,startPoint.y - endPoint.y) / 2;
            const angle = 2 * (180/Math.PI) * (Math.asin(distSP/distCP));
            const height = Math.sqrt(Math.pow(distCP,2) - Math.pow(distSP,2));
            const slope = (endPoint.y - startPoint.y) / (endPoint.x - startPoint.x);
            const c = startPoint.y - (slope * startPoint.x)
            segments.push( {startPoint, endPoint, hyp: distCP, height, angle, segLength: distSP * 2, slope, intercept: c});
        }
        console.log("Segments", segments);

        console.log("Contours Size: ", contours.size())
        //Looping for grouping the dots to its specific segments
        for (let i = 0; i < contours.size(); i++) {
            if(ignoreIndex.includes(i)) continue;
            let alreadyDrawn = false;
            if(findBaseDetails[0].length>2 || findBaseDetails[1].length > 2) {
                console.log(findBaseDetails);
                console.log('Break daw');
                rejectAll = true;
                break;
            }
            let tmp = new cv.Mat();
            let cnt = contours.get(i);
            cv.convexHull(cnt, tmp, false, true);
            let bound = cv.boundingRect(tmp);
            const moment = cv.moments(tmp);
            const area = moment.m00;
            let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),Math.round(Math.random() * 255));

            //Filter unimportant contours with area not in range
            if((area > (Math.PI * Math.pow((circlesDistance/2) * 1.75,2))) || (area < (Math.PI * Math.pow((circlesDistance/2) * 0.5,2)))) {
                //But if the bounding box is at least within the range of the circles distance, then all is good
                if(!(bound.width >= circlesDistance * 0.8 && bound.width <= circlesDistance * 1.2 && bound.height >= circlesDistance * 0.8 && bound.height <= circlesDistance * 1.2)) {
                    //cv.rectangle(roi, {x: bound.x, y: bound.y}, {x: bound.x + bound.width, y: bound.y + bound.height}, color, 1)
                    alreadyDrawn = true;
                    console.log('Yeah skip these', area, bound);
                    continue;
                }
            }
            //Computing for based from center equivalent
            let xc = (bound.x + (bound.width/2)) - (_boxDim * 0.5);
            let yc = (_boxDim * 0.5) - (bound.y + (bound.height/2));
            const distanceFromCircle = Math.hypot(biggestCircle.x - xc,biggestCircle.y - yc)

            /*
            //If the point is waaay inside the circle, ignore those
            if(distanceFromCircle <= biggestCircle.radius - (circlesDistance * 2.5)) {
                console.log("La sa range eh, sad", bound, distanceFromCircle, biggestCircle.radius - (circlesDistance * 1.5))
                continue;
            }*/

            
            //Filter similar points by getting the difference of the last point and the next point, comparing if it's greater than the circlesDistance
            if( lastx==0 && lasty==0) {
                lastx = xc;
                lasty = yc;
            }
            else {
                distLast = Math.hypot(xc - lastx, yc - lasty);
                if (distLast < circlesDistance * 0.75 ) {
                    lastx = xc;
                    lasty = yc;
                    console.log("Bleep bleep", bound);
                    continue;
                }
            }

            if(!alreadyDrawn) cv.rectangle(roi, {x: bound.x, y: bound.y}, {x: bound.x + 1, y: bound.y + 1}, color, 1)
            // j is the segment number
            for(let j = 0; j<6; j++) {
                if(!(j in donePoints)) donePoints[j] = [];
                if(!(j in donePointsD)) donePointsD[j] = [];

                const distanceFromStart = Math.hypot(segments[j].startPoint.x - xc, segments[j].startPoint.y - yc);
                const distanceFromEnd = Math.hypot(segments[j].endPoint.x - xc, segments[j].endPoint.y - yc);
                const angle = (180/Math.PI) * (Math.acos((Math.pow(segments[j].hyp,2) + Math.pow(distanceFromCircle,2) - Math.pow(distanceFromStart,2))/(2 * segments[j].hyp * distanceFromCircle)));
                const perpDistance = Math.abs((segments[j].slope * xc) - yc + segments[j].intercept) / Math.hypot(segments[j].slope, 1);
                const deets = {bound, xc, yc, area, distLast, angle, perpDistance, distanceFromCircle, distanceFromStart,distanceFromEnd}
                if(distanceFromCircle >= segments[j].height - (circlesDistance * 1.5) && distanceFromCircle <= segments[j].segLength + (circlesDistance * 2)) {
                    if (  
                        (distanceFromStart <= segments[j].segLength && distanceFromEnd <= segments[j].segLength )
                    ) {

                        let meep = false;
                        if(Math.abs(distanceFromStart/segments[j].segLength - 0.1044703596) < 0.03 || Math.abs(distanceFromEnd/segments[j].segLength - 0.1044703596) < 0.03) {
                        meep = true;
                            let dirDist = [distanceFromStart, distanceFromEnd];
                            if(findBaseDetails[dirDist.indexOf(Math.min(...dirDist))].includes(j)) continue;
    
                            findBaseDetails[dirDist.indexOf(Math.min(...dirDist))].push(j);
                            if(distBaseAverage==0) {
                                distBaseAverage = distanceFromCircle;
                            }
                            else {
                                distBaseAverage = (distBaseAverage + distanceFromCircle) / 2;
                                distBaseAllowance = Math.abs(distBaseAverage - distanceFromCircle)
                            }
                            console.log("Average Distance of Base", distBaseAverage);
                        }
                        else {
                            cv.rectangle(roi, {x: bound.x, y: bound.y}, {x: bound.x + bound.width, y: bound.y + bound.height}, color, 1)
                            console.log("Yep, found a point");
                            let pointOk = true;
                            //check if point is already in segment
                            for(let g = 0; g < donePoints[j].length; g++) {
                                let pointCheck = donePoints[j][g];
                                if(pointCheck.bound.x == bound.x && pointCheck.bound.y == bound.y) {
                                    pointOk = false;
                                    break;
                                }
                            }
                            if(pointOk) {
                                t++;
                                donePoints[j].push(deets);
                                polyCirc.push_back(cnt);
                                cv.drawContours(roi, contours, i, color, 1, 8, hierarchy, 0);
                                cv.imshow('edit', roi);
                            }
                        }
                        if(!meep) console.log("Found Point", j, 
                        "Start", {distStart: distanceFromStart/segments[j].segLength, distDiff: Math.abs(distanceFromStart/segments[j].segLength - 0.1044703596)}, 
                        "End", {distStart: distanceFromEnd/segments[j].segLength, distDiff: Math.abs(distanceFromEnd/segments[j].segLength - 0.1044703596)}, 
                        
                        area, bound)
                        break;
                    }   
                }
                else {
                    console.log('Di eh', distanceFromCircle, j, segments[j].height, segments[j].segLength, circlesDistance, bound);
                }
            }
        }

        console.log(t);
        console.log(findBaseDetails);
        console.log(donePoints);

        if(findBaseDetails[0].length!=2 || findBaseDetails[0].length!=2) {
            console.log("There should be at least two entries in one of the index!")
            rejectAll = true;
            return
        }

        for(let i = 0; i<2;i++) {
            if(findBaseDetails[i].length>0) {
                //They should always be adjacent
                if(Math.abs(findBaseDetails[i][0] - findBaseDetails[i][1]) > 1 && (Math.abs(findBaseDetails[i][0] - findBaseDetails[i][1]) != 5)) {
                    console.log('Base are not adjacent, bad')
                    rejectAll = true;
                    break;
                }
            }
        }

        labelling();

        rejectAll = false;
        return;
    }


    function labelling() {
        let newSet = {};
        
        //Loop through the segments
        for(let i = 0; i < 6; i++) {
            if(!(i in newSet)) newSet[i] = {};

            //Loop through the specific points


            //loop through the points in the segments
            for(let k = 0; k < donePoints[j].length; k++) {
                let point = donePoints[j][k];


            }
        }


        if(rejectAll)  {
            //leave sorting function
            return;
        }
        
    }

    function displaying() {
        let bits = {};
            for(let i = 0; i<6; i++) {
                let bitPart = '000000000'.split("");
                //close
                if('0' in newSet[i][0]) bitPart[8] = '1'
                if('0' in newSet[i][1]) bitPart[7] = '1'
                if('0' in newSet[i][2]) bitPart[6] = '1'
                if('0' in newSet[i][3]) bitPart[5] = '1'
                if('0' in newSet[i][4]) bitPart[4] = '1'
                if('0' in newSet[i][5]) bitPart[3] = '1'
                //far
                if('1' in newSet[i][2]) bitPart[0] = '1'
                if('1' in newSet[i][3]) bitPart[1] = '1'
                if('1' in newSet[i][4]) bitPart[2] = '1'
            
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

                let highestSide = Math.max(...findBase);
                let _bLeft = highestSide;
                let _bRight = (highestSide +5) % 6;
                let _tLeft = (_bLeft + 2) % 6;
                let _tRight = (_bLeft + 3) % 6;
                let _left = (_bLeft + 1) % 6;
                let _right = (_bLeft + 4) % 6;

                let finalString = `${bits[_tLeft]}${bits[_tRight]}${bits[_left]}${bits[_right]}${bits[_bLeft]}${bits[_bRight]}`;
                document.querySelector('#text').textContent = finalString;
        
        started = true;
    }

    function trash(reject=false) {
        started = reject;
        rejectAll = reject;
        src.delete(); 
        roi.delete();
        img.delete(); 
        hierarchy.delete(); 
        contours.delete();
        poly.delete(); 
        polyCirc.delete();
    }
}

        var mido = function() {
          //draw the stream to the canvas
          stream.getContext('2d').drawImage(video, 0, 0, _width, _height);
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
