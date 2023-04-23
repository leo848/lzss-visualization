let width = 20;
let height = 1;
let scaleSize = 40;

const padding = 2;
const random = true;

let grid = [];
let highlight = null;
let fonts = [];

const poem = strings[random ? Math.floor(Math.random() * strings.length) : strings.length - 1];
let { content: string, author, title } = poem;
let index = 0;

function addMetadata() {
  for (let i = 0; i < title.length; i++) {
    grid.push(new InvertedLetterCell(i, title[i]));
  }
  while (grid.length % width !== 0) {
    grid.push(new EmptyCell(grid.length));
  }

  for (let i = 0; i < author.length; i++) {
    grid.push(new InvertedLetterCell(grid.length, author[i]));
  }
  while (grid.length % width !== 0) {
    grid.push(new EmptyCell(grid.length));
  }
}

function setup() {
  let button = document.getElementById("options-button");
  button.addEventListener("click", openOptions);

  grid = [];
  createCanvas(width * scaleSize, height * scaleSize);

  fonts[0] = loadFont("./iosevka.ttf");

  addEventListeners();

  addMetadata();
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
  }
}

function openOptions() {
  const options = document.getElementById("options");
  const optionsButton = document.getElementById("options-button");
  const widthInput = document.getElementById("input-width"); // slider
  const widthLabel = document.getElementById("label-width"); // label
  const poemInput = document.getElementById("input-poem"); // select

  const textInput = document.getElementById("input-text"); // textarea

  textInput.value = string;


  widthInput.value = Math.log(width);
  widthLabel.innerText = width;

  if (options.classList.contains("closed")) {
    options.classList.remove("closed");
    optionsButton.innerText = "❌";
    noLoop();
  } else {
    options.classList.add("closed");
    optionsButton.innerText = "⚙️";
    fullRedraw();
    loop();
  }
}


function addEventListeners() {
  const options = document.getElementById("options");
  const optionsButton = document.getElementById("options-button");
  const widthInput = document.getElementById("input-width"); // slider
  const widthLabel = document.getElementById("label-width"); // label
  const poemInput = document.getElementById("input-poem"); // select

  const textInput = document.getElementById("input-text"); // textarea

  // Clear children, and add all poems as options
  while (poemInput.firstChild) {
    poemInput.removeChild(poemInput.firstChild);
  }
  let poems = strings.slice().sort((a, b) => a.title.localeCompare(b.title));
  let optionCustom = document.createElement("option");
  optionCustom.value = -1;
  optionCustom.innerText = "Eigene Eingabe";
  poemInput.appendChild(optionCustom);

  for (let i = 0; i < poems.length; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.innerText = poems[i].title;
    poemInput.appendChild(option);
  }

  poemInput.addEventListener("change", () => {
    let poemIndex = poemInput.value;
    poemInput.value = -1;
    if (poemIndex == -1) {
      string = textInput.value;
      index = 0;
      grid = [];
      // addMetadata();
    } else {
      let { content: newString, author: newAuthor, title: newTitle } = poems[poemIndex];
      textInput.value = newString;
      string = newString;
      author = newAuthor;
      title = newTitle;
      index = 0;
      grid = [];
      addMetadata();
    }
  });

  textInput.addEventListener("input", () => {
    string = textInput.value;
    index = 0;
    grid = [];
    // addMetadata();
  })

  widthInput.addEventListener("input", () => {
    width = Math.floor(Math.exp(widthInput.value));
    widthLabel.innerText = width;
    scaleSize = Math.floor(800 / width);
  });
}
