/* HOMEWORK 1 - 
    LORENZI FLAVIO - 
        MAT 1662963 */

"use strict";

var canvas;
var gl;
var numVertices  = 36;

var program;

var flag = true;

var pointsArray = [];
//var colorsArray = [];  //no more useful!
var normalsArray = [];  //for normals
var texCoordsArray = []; //for texture

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];


//No more useful : colors replaced with material properties
/*
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];
*/


//point7 coordinates for texture
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(4, 1),
    vec2(4, 0)
];




var translation = [   //3 elements at the bottom left decide the translation tx,ty,tz respectively the [12],[13],[14]
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

var scale = [         //3 elements of the main diagonal decide the scaling sx,sy,sz respectively the [0],[5],[10]
     1, 0, 0, 0,
     0, 1, 0, 0,
     0, 0, 1, 0,
     0, 0, 0, 1
];

//var thetaLoc;


//Point 7
//taking in example textureCubev2 from executable source code:

//Create a checkerboard pattern using floats
var texSize = 32;   //tryed also with 16, 64 and 1024

//making it through 2 images: first one of support and second to create it.
var image1 = new Array()
    for (var i =0; i<texSize; i++)  image1[i] = new Array();
    for (var i =0; i<texSize; i++)
        for ( var j = 0; j < texSize; j++)
           image1[i][j] = new Float32Array(4);
    for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
        var c = (((i & 0x8) == 1) ^ ((j & 0x8)  == 0));  //first value of c was 0 set to 1
        image1[i][j] = [1, c, c, 1];    //first value was c set to 1 for red color [RGBA]
    }
var image2 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ )
        for ( var j = 0; j < texSize; j++ )
           for(var k =0; k<4; k++)
                image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];



//making the texture object
function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}







//parameters for the view and the projections
var eye;

var radius = 5.0;
var theta  = 0.0;
var phi    = 0.0;

var  fovy = 25.0;  // Field-of-view in Y direction angle (in degrees) //reduced by 45.0

var  aspect;       // Viewport aspect ratio

var mvMatrix, pMatrix;  //pointers matrices
var modelView, projection, transLoc, scaleLoc;  //main matrices for locations

//var ortoMatrix, ortoProjection;  //no more useful because also this projection is put into pMatrix

const at = vec3(0.0, 0.0, 0.0);     //direction where I look
const up = vec3(0.0, 1.0, 0.0);     //normals to the eye


/*PUNTO 3; main params (x y -x -y) */
var left = -1.0;
var right = 1.0;
var bottom = -1.0;
var ytop = 1.0;
//near and far planes: they must works for both proj.
var near = 0.1;
var far = 5.0;




/* PUNTO 5 */

//Light and material properties taken by default from "shadedCube" of website    //YELLOW-ORANGE COLOR
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );  //position of the light
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;  //Shininess coefficient 



//products
var ambientProduct;
var diffuseProduct;
var specularProduct;


//var ctm;
//var viewerPos;
var program;




//adding normals for quads (slide 8 ) and replace colors
function quad(a, b, c, d) {    

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     //N = (b-a)x(x-b);
     var normal = cross(t1, t2);    //cross product 
     var normal = vec3(normal);
     //normal = normalize(normal);


     //devo trasformare i colorsArray in normalsArray
     pointsArray.push(vertices[a]);
     normalsArray.push(normal);             //pushing vertex normals
     //colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[0]);      //texture for each one . . .

     pointsArray.push(vertices[b]);
     normalsArray.push(normal);
     //colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     normalsArray.push(normal);
     //colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[a]);
     normalsArray.push(normal);
     //colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[c]);
     normalsArray.push(normal);
     //colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     normalsArray.push(normal);
     //colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[3]);
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    aspect =  canvas.width/canvas.height;

    gl.enable(gl.DEPTH_TEST);


    //                                                 //
    //  Load shaders and initialize attribute BUFFERS  //  
    //                                                 //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();

    //POINT 5:
    //----//
    //MODIFY HERE COLORS ARRAY AND cBuffer with a new one: nBuffer

/*  var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW ); */

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    //REPLACE IT WITH:
/*  var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );                           */

    //REPLACE IT WITH:
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    //----//
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );


    //POINT 7
    //linking with shaders and new tBuffer for texCoordsArray
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture(image2); //configure checkboard





    /* POINT 5 */
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    //NB: gl.uniformVfv and gl.getUnformLocation in a compact form to do first! ! ! 

    //vertex shader
    gl.uniform4fv(gl.getUniformLocation(program, "vAmbientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "vDiffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "vSpecularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(program, "vShininess"), materialShininess);
    //fragment
    gl.uniform4fv(gl.getUniformLocation(program, "fAmbientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "fDiffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "fSpecularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(program, "fShininess"), materialShininess);
    //light link
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));





    //linking between js main matrices and html vectors
    modelView = gl.getUniformLocation(program, "modelView" );
    projection = gl.getUniformLocation(program, "projection" );
    transLoc = gl.getUniformLocation(program, "translate");
    scaleLoc = gl.getUniformLocation(program, "scale");
    //POINT 3 :orthoProjection made separated in first time, but no more useful in this form
    //ortoProjection = gl.getUniformLocation( program, "ortoProjection" );

   



    //ALL REQUIRED SLIDERS:
    //four main params for view volume
    document.getElementById("radius").onchange = function(event) {
       radius = event.target.value;
    };
    document.getElementById("theta").onchange = function(event) {
        theta = event.target.value * Math.PI/180.0;
    };
    document.getElementById("phi").onchange = function(event) {
        phi = event.target.value * Math.PI/180.0;
    };
    //field of view per il volume
    document.getElementById("fov").onchange = function(event) {
        fovy = event.target.value;
    };



    //Near and Far for both proj.
    document.getElementById("FarSlider").onchange = function(event) {
        far = this.valueAsNumber;
    };
    document.getElementById("NearSlider").onchange = function(event) {
        near = this.valueAsNumber;
    };



    //Translations X Y Z
    document.getElementById("translationX").onchange = function(event) {
       translation[12] = event.target.value;
    };
    document.getElementById("translationY").onchange = function(event) {
        translation[13] = event.target.value;
    };
    document.getElementById("translationZ").onchange = function(event) {
        translation[14] = event.target.value;
    };



    //Uniform scaling
    document.getElementById("scale").onchange = function(event) {
       scale[0] = event.target.value;
       scale[5] = event.target.value;
       scale[10] = event.target.value;
    };



    //POINT 6 : Switching
    document.getElementById("switching").onclick = function(event) {
    flag =! flag;   //allows 2 types
    if (flag) {
        document.getElementById('info').innerHTML = "Phong Shading"; //modify with Phong the label
        document.getElementById('switching').innerHTML = "switch";  //button label

        } else {
            document.getElementById('info').innerHTML = "Gouraud Shading";  //modify with Gouraud the label
            document.getElementById('switching').innerHTML = "switch";  //button label
            }
    };

    render();
}

var render = function() { 

    gl.clearColor(0.1, 0.8, 0.6, 1.0); //green-colored background

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //formula that makes eye parametric to give the required movements
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta),radius*Math.cos(phi));

    //View Matrix creation with lookAt function
    mvMatrix = lookAt(eye, at , up); 

    //first projection created
    pMatrix = perspective(fovy, aspect, near, far);


    //passing information from the pointers to the main matrices
    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    gl.uniformMatrix4fv(transLoc, false, flatten(translation));
    gl.uniformMatrix4fv(scaleLoc, false, flatten(scale));


    //Linking with the flag
    gl.uniform1i(gl.getUniformLocation(program, "flag"), flag);


    //split the screen
    //rename for canvas width and height
    var w = gl.canvas.width;
    var h = gl.canvas.height;

    //move everything done so far into a box
    gl.scissor(0,h/2,w/2,h/2);     
    gl.viewport(0,h/2, w/2,h/2);                        //y = h/4 for the center
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );  

    //put the orthoprojection (rivisited for point 4 ----> everything inside pMatrix)
    pMatrix = ortho(left, right, bottom, ytop, near, far);
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );

    //make another box so that the screen is divided into two (PERSPECTIVE + ORTHOGRAPHIC)
    gl.scissor(w/2,h/2,w/2,h/2);
    gl.viewport(w/2,h/2,w/2,h/2);                       //y = h/4 for the center
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );



    requestAnimFrame(render);

}
