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
var rejectAll = false;
var distFromCircleMultiplier = [
    999,
    0.9047619048,
    0.8977591036,
    0.8963585434,
    0.9005602241,
    0.9243697479,
    0.9481792717,
    999
];
var distFromStartMultiplier = [
    999,
    0.3652811736,
    0.4572127139,
    0.5657701711,
    0.6591687042,
    0.7594132029,
    0.8596577017,
]
var secondDistFromStartMultiplier = [
    0.7261613692,
    0.8244498778,
    0.626405868
]

var angleMultiplier = 0.3088595203;

var stat = function() {
    var donePoints = {};
    var t = 0;
    var distLast = 0;
    var lastx = 0;
    var lasty = 0;
    var findBase = [];
    var findBaseDetails = [];
    started = true;
    
    let src = cv.imread('stream');
    let roi = new cv.Mat();
    let roirect = new cv.Rect((_width/2) - (_boxDim/2), (_height/2) - (_boxDim/2), _boxDim, _boxDim)
    roi = src.roi(roirect);
    cv.imshow('roi',roi)
    let img = cv.imread('roi');

    cv.cvtColor(img, img, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(img, img, 100,  255, cv.THRESH_BINARY);
    cv.imshow('edit', img);

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
        let tmp2 = new cv.Mat();
        let tmp3 = new cv.Mat.zeros(_boxDim, _boxDim, cv.CV_8UC3);
        let cnt = contours.get(i);
        //let moment = cv.moments(cnt, false);
        //centroids.push({x: moment.m10/moment.m00, y: moment.m01/moment.m00});

        if(false) {
            cv.approxPolyDP(cnt, tmp, 60, true);
            let vertices = tmp.size().width * tmp.size().height
            if(vertices == 6)  {
                let edgeLength = [];
                for(let k = 0; k < 5; k++) {
                    const [x1, y1] = tmp.intPtr(k);
                    const [x2, y2] = tmp.intPtr((k+1)%6);
                    edgeLength.push(Math.hypot(x2-x1, y2-y1));
                }
    
                if(Math.max(...edgeLength) - Math.min(...edgeLength) > 30) {
                    console.log("BAD", Math.max(...edgeLength) - Math.min(...edgeLength))
                    rejectAll = true;
                    break;
                }
    
                let circle = cv.minEnclosingCircle(tmp);
                if( circle.radius >= 80 && circle.radius <= 162) {
                    poly.push_back(tmp);
                    circles.push(circle)
                    cv.circle(src, circle.center, circle.radius, color)
                    cv.drawContours(src, poly, polyCount, color, 1, 8, hierarchy, 0);
                    cv.imshow('edit', src);
                    polyCount++;
                }
                else {
                    console.log("bad circle!");
                }
            }
        }
        else {
            cv.convexHull(cnt, tmp, false, true);
                let edgeLength = [];
                for(let k = 0; k < 5; k++) {
                    const [x1, y1] = tmp.intPtr(k);
                    const [x2, y2] = tmp.intPtr((k+1)%6);
                    edgeLength.push(Math.hypot(x2-x1, y2-y1));
                }
                
                let vertices = tmp.size().width * tmp.size().height
                /*
                if(Math.max(...edgeLength) - Math.min(...edgeLength) > 13) {
                    console.log("BAD", Math.max(...edgeLength) - Math.min(...edgeLength))
                    rejectAll = true;
                    break;
                }*/
                let circle = cv.minEnclosingCircle(tmp);
                if( circle.radius >= _boxDim * 0.25 && circle.radius <= _boxDim * 0.4) {
                    
                    //if center is within bounds
                    let centerBox = _boxDim * 0.05;
                    let xCircle = circle.center.x - (_boxDim * 0.5);
                    let yCircle = (_boxDim * 0.5) - circle.center.y;

                    //Ignore if out of bounds
                    if(!((xCircle >= (centerBox * -1) && xCircle <= centerBox) && (yCircle >= (centerBox * -1) && yCircle <= centerBox))) continue;

                    poly.push_back(tmp);


                    circles.push(circle)
                    cv.circle(roi, circle.center, circle.radius, color)
                    cv.drawContours(roi, poly, polyCount, color, 1, 8, hierarchy, 0);
                    cv.imshow('edit', roi);
                    polyCount++;

                    if(polyCount==2) {
                        let fCircle = {}, sCircle = {};

                        fCircle = cv.moments(poly.get(0));
                        fCircle.x = fCircle.m10/fCircle.m00;
                        fCircle.y = (fCircle.m01/fCircle.m00);

                        sCircle = cv.moments(poly.get(1));
                        sCircle.x = (sCircle.m10/sCircle.m00);
                        sCircle.y = sCircle.m01/sCircle.m00;

                        if(Math.hypot(fCircle.y - sCircle.y, fCircle.x - sCircle.y) > 10) {
                            console.log('User is moving', Math.hypot(fCircle.y - sCircle.y, fCircle.x - sCircle.y));
                            rejectAll = true;
                        }

                        fCircle = circles[0].center;
                        sCircle = circles[1].center;
                        if(Math.hypot(fCircle.y - sCircle.y, fCircle.x - sCircle.y) > 10) {
                            console.log('Circle - User is moving',Math.hypot(fCircle.y - sCircle.y, fCircle.x - sCircle.y));
                            rejectAll = true;
                        }

                    }
                }
        }
        cnt.delete(); tmp.delete(); tmp2.delete(); tmp3.delete();
        if(i==contours.size()-1) {
            started = false;
        }
    }

    if(rejectAll) {
        trash();
        return;
    }

    function doCheck() {
        console.log('Checking for validity..');
        console.log(poly.get(0).size())
        console.log(poly.get(1).size())
        if(passes.length < 3) {
            passes.push(Math.abs(circles[0]['radius'] - circles[1]['radius']));
            rejectAll = true;
            return;
        }
        else {
            if(Math.max(...passes) - Math.min(...passes) < 5) {
                //good to go
                console.log('good')
                rejectAll = false;
            }
            else {
                console.log('Difference', Math.max(...passes) - Math.min(...passes))
                passes = [];
                rejectAll = true;
                return;
            }
        }


        let biggestCircle = circles[0]['radius'] > circles[1]['radius'] ? circles[0] : circles[1];
        let biggestHexagon = circles[0]['radius'] > circles[1]['radius'] ? poly.get(0) : poly.get(1);
        let verticesDiff = {};

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

        /*

            if (i>0) {
                //get the distance at i-1
                let pastDistance = verticesDiff[i-1];
                if(Math.abs(pastDistance - distance) < 10) continue;
            }
            */


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
        let rotation = 0;
        //Arrange them in one order and get the rotation
        //If rotation is positive, then the point goes counterclockwise
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
                if(i==0) rotation = (point2.y - point.y) / (point2.x - point.y);
                if(Math.hypot(point2.x - point.x, point2.y-point.y) <= biggestCircle.radius * 1.25) {
                    pointsInOrder.push(point2);
                    donePointsSort.push(k);
                    break;
                }
            }
        }

        console.log(rotation);
        console.log(pointsInOrder);

        //Loop through the points that are now in order



        

        return;

        //Get the biggest hexagon and the circle 
        circlesDistance = Math.abs(circles[0]['radius'] - circles[1]['radius']);
        const newRadius = biggestCircle.radius + (circlesDistance * 1.5);
        
        
        /*
        if (circlesDistance<6 || circlesDistance>15) {
            console.log('not within range');
            rejectAll = true;
            return;
        }*/

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
            const cx = startPoint[0];
            const cy = startPoint[1];
            const distCP = Math.hypot(cx,cy);
            const dx = startPoint[0] - endPoint[0];
            const dy = startPoint[1] - endPoint[1];
            const distSP = Math.hypot(dx,dy) / 2;
            const angle = 2 * (180/Math.PI) * (Math.asin(distSP/distCP));

            segments.push( {startPoint, endPoint, hyp: distCP, angle, segLength: distSP * 2 });
        }
        console.log("Segments", segments);

        //Looping to check the dots
        for (let i = 0; i < contours.size(); i++) {
            if(findBase.length>2) {
                console.log(findBase);
                console.log('Break daw');
                rejectAll = true;
                break;
            }
            let cnt = contours.get(i);
            let bound = cv.boundingRect(cnt);
            const moment = cv.moments(cnt);
            const area = moment.m00;

            //Filter unimportant contours with area not in range
            if((area > (Math.PI * Math.pow((circlesDistance/2) * 1.75,2))) || (area < (Math.PI * Math.pow((circlesDistance/2) * 0.3,2)))) continue;
            
            let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),Math.round(Math.random() * 255));
            let xc = moment.m10/moment.m00 - biggestCircle.center.x;
            let yc = biggestCircle.center.y - moment.m01/moment.m00;
            const distanceFromCircle = Math.hypot(xc,yc)

            //Filter similar points by getting the difference of the last point and the next point, comparing if it's greater than the circlesDistance
            if( lastx==0 && lasty==0) {
                lastx = xc;
                lasty = yc;
            }
            else {
                distLast = Math.hypot(xc - lastx, yc - lasty);
                lastx = xc;
                lasty = yc;
                if (distLast < circlesDistance ) continue;
            }

            if(distanceFromCircle <= newRadius) {
                t++;
                // j is the segment number
                for(let j = 0; j<6; j++) {
                    if(!(j in donePoints)) donePoints[j] = [];

                    const distanceFromStart = Math.hypot(segments[j].startPoint[0] - xc, segments[j].startPoint[1] - yc);
                    const distanceFromEnd = Math.hypot(segments[j].endPoint[0] - xc, segments[j].endPoint[1] - yc);
                    const angle = (180/Math.PI) * (Math.acos((Math.pow(segments[j].hyp,2) + Math.pow(distanceFromCircle,2) - Math.pow(distanceFromStart,2))/(2 * segments[j].hyp * distanceFromCircle)));
                    
                    const deets = {bound, xc, yc, area, distLast, angle,  distanceFromCircle, distanceFromStart,distanceFromEnd}
                    //check if slopes are equal and also within the radius
                    if (  
                        ( distanceFromCircle <= newRadius && distanceFromStart <= segments[j].segLength && distanceFromEnd <= segments[j].segLength )
                    ) {
                        if(angle <= segments[j].angle * angleMultiplier) {
                            if(findBase.includes(j)) continue;
                            findBase.push(j);
                            if(distBaseAverage==0) {
                                distBaseAverage = distanceFromCircle;
                            }
                            else {
                                distBaseAverage = (distBaseAverage + distanceFromCircle) / 2;
                                distBaseAllowance = Math.abs(distBaseAverage - distanceFromCircle)
                            }
                            console.log("One circ", distBaseAverage);
                        }
                        else {
                            donePoints[j].push(deets);
                            polyCirc.push_back(cnt);
                            cv.drawContours(src, contours, i, color, 1, 8, hierarchy, 0);
                            cv.imshow('edit', src);
                        }
                        break;
                    }
                    /*
                    else {
                        if( distanceFromCircle <= newRadius) {
                            console.log(distanceFromStart, distanceFromEnd)
                            console.log(segments[j], distanceFromStart <= segments[j].segLength, distanceFromEnd <= segments[j].segLength)
                        }
                    }
                    */
                }
            }
        }

        if(!rejectAll) {
            started = true;
            sorting();
        }
        if (rejectAll) {
            return;
        }
    }


    function sorting() {
        let newSet = {};
        if(findBase.length == 2) {
            console.log('nice');
            cv.imshow('edit', src);

            //findBase[0] - (findBase[1] % 6) should always be positive
            /*
            if(findBase[0] - (findBase[1] % 6) < 0) {
                console.log('Wrong direction');
                started = false;
                return
            } */                       
            console.log("findBase", findBase);
            console.log("donePoints", donePoints);
            console.log("distBaseAverage", distBaseAverage);
            console.log("circlesDistance", circlesDistance)
            console.log("Segments", segments)
            //loop through the segments
            for(let j = 0; j<6; j++) {
                //Check if the points in the segments contain only 9 or less
                if(donePoints[j].length > 9) {
                    rejectAll = true;
                    break;
                }
                if(!(j in newSet)) newSet[j] = {};
                let doneInPoints = [];
                let angle = segments[j].angle;	
                let startAngle = (angle * 0.31029411764) //0.3054331865); //0.23227383863	
                let increment = (angle - startAngle) / 7;
                //Point Check Loop Part 2
                //For the 0th line
                for(let a = startAngle, k = 0; a < angle+(increment/2); a+=increment, k++) {
                    if(!(k in newSet[j])) newSet[j][k] = {};
                    for(let p = 0; p < donePoints[j].length; p++) {
                        if (doneInPoints.includes(p)) continue;
                        let point = donePoints[j][p];
                        if (point.angle <= a) {

                        let circRatioDiff = Math.abs((point.distanceFromCircle/distBaseAverage) - distFromCircleMultiplier[k]);
                        let startRatioDiff = Math.abs((point.distanceFromStart / segments[j].segLength) - distFromStartMultiplier[k]);
                        console.log(a, k, circRatioDiff, startRatioDiff, point.angle, point.bound)
                        doneInPoints.push(p);
                        if(circRatioDiff <= 0.07 && startRatioDiff <= 0.07 && false) {
                            newSet[j][k][0] = point;
                            doneInPoints.push(p);
                        
                            console.log(`
                            Segment: ${j}
                            Frac: ${k}
                            Point: ${p}
                            distBaseAverage ${distBaseAverage}
                            Circle Diameter ${circlesDistance}
                            CIrcle Radius ${circlesDistance/2}
    
                            Circle Distance ${point.distanceFromCircle}
                            Ratio ${point.distanceFromCircle/distBaseAverage}
                            Treshold ${distFromCircleMultiplier[k]}
                            Allowance ${distBaseAllowance}
    
                            Start Distance ${point.distanceFromStart}
                            Ratio ${point.distanceFromStart / segments[j].segLength}
                            Threshold ${distFromStartMultiplier[k]}
    
                            Coords ${point.bound.x}, ${point.bound.y}
                            Centroid ${point.xc}, ${point.yc}
    
                            Circ Diff ${Math.abs(point.distanceFromCircle - distBaseAverage)}
                            Circ Ratio Diff ${Math.abs((point.distanceFromCircle/distBaseAverage) - distFromCircleMultiplier[k])}
                            Start Ratio Diff ${startRatioDiff}
    
                            `)
                        }
                        else {
                            continue;
                            if(k>=2 && k<=4) {
                                let secondStartRatioDiff = Math.abs((point.distanceFromStart / segments[j].segLength) - secondDistFromStartMultiplier[k%3])

                                //It could be [1]
                                if(secondStartRatioDiff <= 0.025) {
                                    if(circRatioDiff <= 0.5) {
                                        //Definitely a [0]
                                        newSet[j][k][0] = point;
                                        doneInPoints.push(p);
                                    }
                                    else {
                                        newSet[j][k][1] = point;
                                        doneInPoints.push(p);
                                    }
                                    /*
                                    if(startRatioDiff <= 0.8 && circRatioDiff <= 0.025 && secondStartRatioDiff > 0.02) {
                                        newSet[j][k][0] = point;
                                        doneInPoints.push(p);
                                    }
                                    else
                                        newSet[j][k][1] = point;
                                        doneInPoints.push(p);
                                    }*/
                                }

                                console.log(`
                                Segment: ${j}
                                Frac: ${k}
                                Point: ${p}
                                distBaseAverage ${distBaseAverage}
                                Circle Diameter ${circlesDistance}
                                CIrcle Radius ${circlesDistance/2}
            
                                Circle Distance ${point.distanceFromCircle}
                                Ratio ${point.distanceFromCircle/distBaseAverage}
                                Treshold ${distFromCircleMultiplier[k]}
                                Allowance ${distBaseAllowance}
            
                                Start Distance ${point.distanceFromStart}
                                Ratio ${point.distanceFromStart / segments[j].segLength}
                                Threshold ${distFromStartMultiplier[k]}
            
                                Coords ${point.bound.x}, ${point.bound.y}
                                Centroid ${point.xc}, ${point.yc}

                                ${startRatioDiff <= 0.1}
                                ${circRatioDiff <= 0.025}
                                ${secondStartRatioDiff > 0.025}
            
                                Circ Diff ${Math.abs(point.distanceFromCircle - distBaseAverage)}
                                Circ Ratio Diff ${Math.abs((point.distanceFromCircle/distBaseAverage) - distFromCircleMultiplier[k])}
                                Start Ratio Diff ${startRatioDiff}
                                Second Start Ratio Diff ${secondStartRatioDiff}
            
                                `)

                            }
                        }
                    }
                    }

                }


                //Check if the number of points in the section has the same number of points
                let counter = 0;
                //Loop through the sections
                for(let k = 0; k<6; k++) {
                    counter += Object.keys(newSet[j][k]).length;
                }

                if(counter>=donePoints[j].length - 4) {
                    console.log("Wrong number of points")
                    //rejectAll = true;
                }

                if(rejectAll) {
                    console.log("I broke");
                    break;
                }
            }
            
            if(rejectAll)  {
                //leave sorting function
                return;
            }
            
            console.log(newSet);
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
        else {
            if(findBase.length < 2) console.log('lacks ')
            else console.log('sobra')
            started = false;
        }
        
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
