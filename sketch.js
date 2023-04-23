let width = 21;
let height = 1;
let scaleSize = 40;

const padding = 2;
const random = true;

let grid = [];
let highlight = null;
let font;

const poem = strings[random ? Math.floor(Math.random() * strings.length) : strings.length - 1];
const { content: string, author, title } = poem;
let index = 0;

function setup() {
  grid = [];
  createCanvas(width * scaleSize, height * scaleSize);

  font = loadFont("./iosevka.ttf");

  for (let i = 0; i < title.length; i++) {
    grid.push(new InvertedLetterCell(i, title[i]));
  }
  grid.push(new EmptyCell(grid.length));
  for (let i = 0; i < author.length; i++) {
    grid.push(new InvertedLetterCell(grid.length, author[i]));
  }
  while (grid.length % width !== 0) {
    grid.push(new EmptyCell(grid.length));
  }
}

function draw() {
  if (index < string.length) {
    continueCompression();
  } else {
    frameRate(10);
  }

  if (grid.length > width * height) {
    height = Math.ceil(grid.length / width);
    resizeCanvas(width * scaleSize, height * scaleSize);
    fullRedraw();
  }

  if (highlight !== null) {
    for (let i = highlight[0]; i < highlight[1]; i++) {
      grid[i].highlight();
    }
  }

  for (let i = Math.max(grid.length - 3, 0); i < grid.length; i++) {
    grid[i].draw();
    if (highlight !== null) {
      if (highlight[0] <= i && i < highlight[1]) {
        grid[i].highlight();
      }
    }
  }
}

function fullRedraw() {
  resizeCanvas(width * scaleSize, height * scaleSize);
  background(255);
  for (let i = 0; i < grid.length; i++) {
    grid[i].resetCoords();
    grid[i].draw();
  }
}

function continueCompression() {
  let [isMarker, data] = lzss(string, index);
  let gridIndex = grid.length;
  if (isMarker) {
    let [offset, length] = data;
    let marker = new MarkerCell(
      gridIndex,
      offset,
      length,
    );
    grid.push(marker);
    // grid.push(new ReferenceCell(gridIndex + 1, offset, length));
    grid.push(
      new HalfReferenceCell(
        gridIndex + 1,
        offset,
        length,
        true,
        marker
      )
    );
    grid.push(
      new HalfReferenceCell(
        gridIndex + 2,
        offset,
        length,
        false,
        marker
      )
    );
    index += length;
  } else {
    let letter = data;
    grid.push(
      new LetterCell(gridIndex, letter)
    );
    index++;
  }
}

function mousePressed() {
  let x = Math.floor(mouseX / scaleSize);
  let y = Math.floor(mouseY / scaleSize);
  let cell = grid[y * width + x];
  if (cell && cell.getHighlight) {
    let newHighlight = cell.getHighlight();
    if (!highlight) {
      highlight = newHighlight;
      fullRedraw();
      loop();
    } else if (newHighlight[0] == highlight[0] && newHighlight[1] == highlight[1]) {
      highlight = null;
      fullRedraw();
      noLoop();
    } else {
      highlight = newHighlight;
      fullRedraw();
      loop();
    }
  } else {
    highlight = null;
    fullRedraw();
    noLoop();
  }
}
