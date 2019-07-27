 import './blobdetect.js'
 
 var _width = 0;
 var _height = 0;
 
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
var distMultiplier = [
    0.9112978525,
    0.8991596639,
    0.8972922502,
    0.9056956116,
    0.9243697479,
    0.9533146592,
];

var dMulti2 = [
    0.9883286648,
    1.00140056,
    1.027544351,
];

var rangeMultiplier = [
    0.3631913852,
    0.4620655898,
    0.5599608419,
    0.6573666177,
    0.7572197748,
    0.8575624082
];

var rMulti2 = [
    0.7268722467,
    0.8296622614,
    0.6294664709,
];


var distFromCircleMultiplier = [
    0.9047619048,
    0.8977591036,
    0.8963585434,
    0.9005602241,
    0.9243697479,
    0.9481792717,
];

var distFromStartMultiplier = [
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
    let img = cv.imread('stream');
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
        let cnt = contours.get(i);
        //let moment = cv.moments(cnt, false);
        //centroids.push({x: moment.m10/moment.m00, y: moment.m01/moment.m00});
        cv.approxPolyDP(cnt, tmp, 20, true);
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
            if( circle.radius >= 80 && circle.radius <= 162) {
                poly.push_back(tmp);
                circles.push(circle)
                cv.circle(src, circle.center, circle.radius, color)
                cv.drawContours(src, poly, polyCount, color, 1, 8, hierarchy, 0);
                polyCount++;
            }
            else {
                console.log("bad circle!");
            }
        }
        cnt.delete(); tmp.delete();
        if(i==contours.size()-1) {
            started = false;
        }
    }

    if(rejectAll) {
        trash();
        return;
    }

    function doCheck() {
        if(passes.length < 5) {
            passes.push(Math.abs(circles[0]['radius'] - circles[1]['radius']));
            rejectAll = true;
            return;
        }
        else {
            if(Math.max(...passes) - Math.min(...passes) < 1.25) {
                //good to go
                rejectAll = false;
            }
            else {
                console.log('Difference', Math.max(...passes) - Math.min(...passes))
                passes = [];
                rejectAll = true;
                return;
            }
        }

        //Get the biggest hexagon and the circle 
        let biggestCircle = circles[0]['radius'] > circles[1]['radius'] ? circles[0] : circles[1];
        let biggestHexagon = circles[0]['radius'] > circles[1]['radius'] ? poly.get(0) : poly.get(1);
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

                //Point Check Loop Part 2
                //For the 0th line
                for(let k = 0; k < 6; k++) {
                    if(!(k in newSet[j])) newSet[j][k] = {};
                    for(let p = 0; p < donePoints[j].length; p++) {
                        if (doneInPoints.includes(p)) continue;

                        let point = donePoints[j][p];
                        let circRatioDiff = Math.abs((point.distanceFromCircle/distBaseAverage) - distFromCircleMultiplier[k]);
                        let startRatioDiff = Math.abs((point.distanceFromStart / segments[j].segLength) - distFromStartMultiplier[k]);

                        if(startRatioDiff <= 0.0255) {
                            newSet[j][k][0] = point;
                            doneInPoints.push(p);
                        }
                        else {
                            if(k>=2 && k<=4) {
                                startRatioDiff = Math.abs((point.distanceFromStart / segments[j].segLength) - secondDistFromStartMultiplier[k%3])
                                if(startRatioDiff <= 0.0255) {
                                    newSet[j][k][1] = point;
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
                                    Condition: 
                                    Condition Result: ${distFromCircleMultiplier[k]  <= (point.distanceFromCircle/(distBaseAverage-distBaseAllowance))
                                         && distFromCircleMultiplier[k]  >= (point.distanceFromCircle/(distBaseAverage+distBaseAllowance))}
            
                                    PcondRes1 ${(point.distanceFromCircle/(distBaseAverage+distBaseAllowance))}
                                    PcondRes2 ${(point.distanceFromCircle/(distBaseAverage-distBaseAllowance))}
            
                                    Point Distance Minus Allowance Divided by Average 
                                    Minus ${(point.distanceFromCircle - distBaseAllowance) / distBaseAverage}
                                    Plus ${(point.distanceFromCircle + distBaseAllowance) / distBaseAverage}
            
                                    Pcond1 ${distFromCircleMultiplier[k]  <= (point.distanceFromCircle/(distBaseAverage-distBaseAllowance))}
                                    Pcond2 ${distFromCircleMultiplier[k]  >= (point.distanceFromCircle/(distBaseAverage+distBaseAllowance))}
            
                                    //Difference checking
            
                                    Circ Diff ${Math.abs(point.distanceFromCircle - distBaseAverage)}
                                    Circ Ratio Diff ${Math.abs((point.distanceFromCircle/distBaseAverage) - distFromCircleMultiplier[k])}
                                    Start Ratio Diff ${startRatioDiff}
            
                                    `)
                                }
                                else {
                                }
                            }
                        }
                    }

                }

                
                //Point Check Loop
                /*
                for(let ctr = 0; ctr < 6; ctr++) {
                    if(!(ctr in newSet[j])) newSet[j][ctr] = {};
                    const lineDist = distBaseAverage * distMultiplier[ctr];
                    const lineDist2 = distBaseAverage * dMulti2[ctr%3];
                    const spDist = rangeMultiplier[ctr] * segments[j].segLength;
                    const spDist2 = rMulti2[ctr%3] * segments[j].segLength;

                    //loop through all the points in the segment
                    for(let n = 0; n < donePoints[j].length; n++) {
                        if (doneInPoints.includes(n)) continue;

                        let spDiff = Math.abs(spDist - donePoints[j][n].distanceFromStart);
                        let spDiff2 = Math.abs(spDist2 - donePoints[j][n].distanceFromStart);
                        let lineDiff = Math.abs(lineDist - donePoints[j][n].distanceFromCircle);
                        let lineDiff2 = Math.abs(lineDist2 - donePoints[j][n].distanceFromCircle);
                        const spDist3 = (donePoints[j][n].distanceFromStart / segments[j].segLength);
                        

                        let check1 = (lineDiff <= circlesDistance * distMultiplier[ctr]) 
                        //let check2 = (spDiff < circlesDistance * 1.1 && lineDiff2 <= circlesDistance * 0.51 && spDiff2 <= circlesDistance * 0.51) 
                        let check2 = (spDist3 >= rMulti2[ctr%3] * 0.95 && spDist3 <= rMulti2[ctr%3] * 1.05 );
                        //check if line difference is within circle distance range and within range from the starting point 
                        if(check1) {
                            newSet[j][ctr][0] = donePoints[j][n];
                            doneInPoints.push(n);
                        }
                        else {
                            /*
                            if((ctr >= 2 && ctr <= 4) && check2) {
                                newSet[j][ctr][1] = donePoints[j][n];
                                doneInPoints.push(n);
                            }*/
                        /*
                        }
                        console.log(`
                        Segment: ${j}
                        Frac: ${ctr}
                        Point: ${n}
                        Segment Length: ${segments[j].segLength}
                        Average Distance of SP to Circle: ${distBaseAverage}
                        Distance From Start: ${donePoints[j][n].distanceFromStart}
                        Distance From Circle: ${donePoints[j][n].distanceFromCircle}
                        Coords: ${donePoints[j][n].bound.x}, ${donePoints[j][n].bound.y}
                        Condition: ${check1}
                        Condition2: ${check2}

                        Ratio Start ${spDist3}
                        Multiplier1 ${rangeMultiplier[ctr] }
                        Multiplier2 ${rMulti2[ctr%3]}

                        lDist ${lineDist}
                        lDist2 ${lineDist2}
                        spDist ${spDist}
                        spDist2 ${spDist2}

                        lDiff ${lineDiff}
                        lDiff2 ${lineDiff2}
                        spDiff ${spDiff}
                        spDiff2 ${spDiff2}
                        `)
                    }
                }
                */

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
