import { createProgram, createShader } from "./shader";
import vertexShaderSource from "./shader.vert"
import fragmentShaderSource from "./shader.frag"
import matrixVideoUrl from "./matrix.mp4"
import Stats from "stats.js";

const button = document.createElement("button")
button.textContent = "start"
button.style.position = "absolute"
button.style.top = "0"
button.style.right = "0"
button.style.zIndex = "1000"
button.addEventListener("click", () => {
  main()
  document.body.removeChild(button)
})
document.body.appendChild(button)

const stats = new Stats()
document.body.appendChild(stats.dom)


function main() {
  const video = document.createElement("video");
  const videoCanvas = document.createElement("canvas")
  const videoContext = videoCanvas.getContext("2d")
  const matrixVideo = document.createElement("video")
  matrixVideo.src = matrixVideoUrl
  matrixVideo.autoplay = true;
  matrixVideo.loop = true
  matrixVideo.style.width = "100vw";
  matrixVideo.style.height = "100vh";
  matrixVideo.style.position = "absolute";
  matrixVideo.style.top = "0"
  matrixVideo.style.left = "0"
  matrixVideo.style.zIndex = "1"
  document.body.appendChild(matrixVideo)

  const canvas = document.createElement("canvas")
  canvas.style.height = "100vh"
  canvas.style.width = "100vw"
  canvas.style.position = "relative"
  canvas.style.zIndex = "100"
  document.body.appendChild(canvas)

  const gl = canvas.getContext("webgl")
  if (!gl) {
    throw new Error("no webgl")
  }
  if (!videoContext) {
    throw new Error("no video context")
  }
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
    })
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function (e) {
      console.log(e)
      console.log("Something went wrong!");
    });
  } else {
    alert("getUserMedia not supported on your browser!");
  }

  function process() {
    if (!videoContext) {
      throw new Error("no video context")
    }
    if (!gl) {
      throw new Error("no webgl context")
    }
    stats.begin()
    videoContext.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height)
    const data = videoContext.getImageData(0, 0, videoCanvas.width, videoCanvas.height)
    render(gl, data)
    stats.end()
    requestAnimationFrame(process)
  }
  video.addEventListener("playing", () => {
    const vw = video.videoWidth
    const vh = video.videoHeight
    videoCanvas.width = vw
    videoCanvas.height = vh
    requestAnimationFrame(process)
    canvas.width = vw;
    canvas.height = vh;
    canvas.style.maxHeight = `calc(100vw * ${vh / vw})`
    canvas.style.maxWidth = `calc(100vh * ${vw / vh})`
  })
}

function render(gl: WebGLRenderingContext, image: HTMLImageElement | ImageData) {
  const vertShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  if (!vertShader || !fragShader) {
    throw new Error("unable to create shader")
  }

  var program = createProgram(gl, vertShader, fragShader);
  if (!program) {
    throw new Error("program creation failed")
  }

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, image.width, image.height);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
  ]), gl.STATIC_DRAW);

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // lookup uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset);

  // Turn on the texcoord attribute
  gl.enableVertexAttribArray(texcoordLocation);

  // bind the texcoord buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      texcoordLocation, size, type, normalize, stride, offset);

  // set the resolution
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}