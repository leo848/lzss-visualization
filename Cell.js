class Cell {
  draw() {
    abstract();
  }

  bytes() {
    abstract();
  }
}

class EmptyCell extends Cell {
  constructor(index) {
    super();
    this.index = index;
    this.x = index % width;
    this.y = Math.floor(index / width);
  }
  draw() {
    fill(this.fillColor());
    stroke(this.strokeColor());
    strokeWeight(2);
    rect(
      this.x * scaleSize + padding,
      this.y * scaleSize + padding,
      scaleSize - padding * 2,
      scaleSize - padding * 2,
      5
    );
  }

  bytes() {
    return 0;
  }

  fillColor() {
    return color(200);
  }

  strokeColor() {
    return color(0);
  }

  resetCoords() {
    this.x = this.index % width;
    this.y = Math.floor(this.index / width);
  }

  highlight() {
    colorMode(HSL);

    stroke((noise(this.x / 10, this.y / 10, frameCount / 30) * 360 + frameCount * 2) % 360, 100, 50);
    strokeWeight(map(scaleSize, 20, 80, 3, 7));
    noFill();

    rect(
      this.x * scaleSize + padding,
      this.y * scaleSize + padding,
      scaleSize - padding * 2,
      scaleSize - padding * 2,
      5
    );

    colorMode(RGB);
  }
}

class LetterCell extends EmptyCell {
  constructor(index, letter) {
    assert(
      typeof letter === "string" && (letter.length === 1 ||
        letter.startsWith("\\")),
      "LetterCell: letter must be a string of length 1, got: " + letter
    );
    super(index);
    this.letter = letter;
  }
  draw() {
    super.draw();

    fill(this.strokeColor());

    if (this.letter === "\n") {
      // draw arrow instead
      this.drawEnter();
    } else if (this.letter === " ") {
      this.drawSpace();
    }

    strokeWeight(map(scaleSize, 20, 80, 1, 2));
    textSize(scaleSize - 10);
    textAlign(CENTER, CENTER);
    textFont("Inter, Helvetica");
    text(
      this.letter,
      this.x * scaleSize + scaleSize / 2,
      this.y * scaleSize + scaleSize / 2
    );
  }

  bytes() {
    return 1;
  }

  drawEnter() {
      const height = 0.3;
      const width = 0.4;
      const buttWidth = 0.1;
      const buttHeight = 0.1;

      stroke(100);
      strokeWeight(map(scaleSize, 20, 80, 2, 7));
      noFill();

      beginShape();

      vertex(
        this.x * scaleSize + scaleSize * (0.5 + width / 2),
        this.y * scaleSize + scaleSize * (0.4 - height / 2)
      );
      vertex(
        this.x * scaleSize + scaleSize * (0.5 + width / 2),
        this.y * scaleSize + scaleSize * (0.4 + height / 2)
      );
      vertex(
        this.x * scaleSize + scaleSize * (0.5 - width / 2),
        this.y * scaleSize + scaleSize * (0.4 + height / 2)
      );

      endShape()

      fill(0);

      triangle(
        this.x * scaleSize + scaleSize * (0.5 - width / 2),
        this.y * scaleSize + scaleSize * (0.4 + height / 2),
        this.x * scaleSize + scaleSize * (0.5 - width / 2 + buttWidth),
        this.y * scaleSize + scaleSize * (0.4 + height / 2 - buttHeight),
        this.x * scaleSize + scaleSize * (0.5 - width / 2 + buttWidth),
        this.y * scaleSize + scaleSize * (0.4 + height / 2 + buttHeight)
      );
  }

  drawSpace() {
    const y = 0.7;
    const height = 0.15;
    const width = 0.5;

    stroke(180);
    strokeWeight(map(scaleSize, 20, 80, 2, 6));
    strokeCap(SQUARE);
    noFill();

    beginShape();
    vertex(
      this.x * scaleSize + scaleSize * (0.5 - width / 2),
      this.y * scaleSize + scaleSize * (y - height / 2)
    );
    vertex(
      this.x * scaleSize + scaleSize * (0.5 - width / 2),
      this.y * scaleSize + scaleSize * (y + height / 2)
    );
    vertex(
      this.x * scaleSize + scaleSize * (0.5 + width / 2),
      this.y * scaleSize + scaleSize * (y + height / 2)
    );
    vertex(
      this.x * scaleSize + scaleSize * (0.5 + width / 2),
      this.y * scaleSize + scaleSize * (y - height / 2)
    );
    endShape();
  }
}

class InvertedLetterCell extends LetterCell {
  constructor(index, letter) {
    super(index, letter);
  }

  fillColor() {
    return color(0);
  }

  strokeColor() {
    return color(200);
  }

  drawSpace() {
    // noop
  }
}

class MarkerCell extends EmptyCell {
  constructor(index, offset, len) {
    assert(typeof len === "number", "MarkerCell: len must be a number");
    assert(len >= 0, "MarkerCell: len must be non-negative");
    super(index);
    this.len = len;
    this.offset = offset;

    colorMode(HSL);

    this.color = getColor(len);
    this.darkColor = getColor(len, "darker");

    colorMode(RGB);
  }

  draw() {
    fill(this.color);
    stroke(this.darkColor);

    strokeWeight(2);

    rect(
      this.x * scaleSize + padding,
      this.y * scaleSize + padding,
      scaleSize - padding * 2,
      scaleSize - padding * 2,
      5
    );

    const delta = 0.08;
    for (let raw = 0.0; raw < 1.0; raw += delta) {
      let perc = Math.pow(raw, 1.7);
      let i = lerp(padding * 2, scaleSize - padding, perc);
      line(
        this.x * scaleSize + i,
        this.y * scaleSize + padding,
        this.x * scaleSize + padding,
        this.y * scaleSize + i
      );
      line(
        (this.x + 1) * scaleSize - padding,
        this.y * scaleSize + scaleSize - i,
        this.x * scaleSize + scaleSize - i,
        (this.y + 1) * scaleSize - padding
      );
    }
  }

  bytes() {
    return this.len;
  }

  getHighlight() {
    let counter = this.offset;
    let gridIndex = this.index;

    while (counter > 0) {
      gridIndex--;
      counter -= grid[gridIndex].bytes();
    }

    let start = gridIndex;

    while (counter < this.len) {
      counter += grid[gridIndex].bytes();
      gridIndex++;
    }

    let end = gridIndex;
    return [ start, end ];
  }
}

class ReferenceCell extends EmptyCell {
  constructor(index, dist, len) {
    super(index);
    this.dist = dist;
    this.len = len;

    colorMode(HSL);
    this.color = getColor(len);
    this.darkColor = getColor(len, "darker");
    colorMode(RGB);
  }

  draw() {
    fill(this.color);
    stroke(this.darkColor);
    strokeWeight(2);

    rect(
      this.x * scaleSize + padding,
      this.y * scaleSize + padding,
      scaleSize - padding * 2,
      scaleSize - padding * 2,
      5
    );

    stroke(0);
    fill(0);

    const arrowY = 0.35;
    const arrowTipHeight = 0.08;
    const arrowTipWidth = 0.1;

    for (const y of [arrowY, 1 - arrowY]) {
      line(
        this.x * scaleSize + scaleSize * 0.15,
        this.y * scaleSize + scaleSize * y,
        this.x * scaleSize + scaleSize * 0.5,
        this.y * scaleSize + scaleSize * y
      );
    }
    triangle(
      this.x * scaleSize + scaleSize * 0.15,
      this.y * scaleSize + scaleSize * arrowY,
      this.x * scaleSize + scaleSize * (0.15 + arrowTipWidth),
      this.y * scaleSize + scaleSize * (arrowY - arrowTipHeight),
      this.x * scaleSize + scaleSize * (0.15 + arrowTipWidth),
      this.y * scaleSize + scaleSize * (arrowY + arrowTipHeight)
    );

    triangle(
      this.x * scaleSize + scaleSize * 0.5,
      this.y * scaleSize + scaleSize * (1 - arrowY),
      this.x * scaleSize + scaleSize * (0.5 - arrowTipWidth),
      this.y * scaleSize + scaleSize * ((1 - arrowY) - arrowTipHeight),
      this.x * scaleSize + scaleSize * (0.5 - arrowTipWidth),
      this.y * scaleSize + scaleSize * ((1 - arrowY) + arrowTipHeight)
    );

    textSize(scaleSize * 0.3);
    textAlign(CENTER, CENTER);
    textFont(fonts[0]);

    text(
      this.dist,
      this.x * scaleSize + scaleSize * 0.75,
      this.y * scaleSize + scaleSize * 0.30,
    );

    text(
      this.len,
      this.x * scaleSize + scaleSize * 0.75,
      this.y * scaleSize + scaleSize * 0.60,
    );
  }

  bytes() {
    return 0;
  }
}

class HalfReferenceCell extends EmptyCell {
  constructor(index, dist, len, arrowLeft, marker) {
    super(index);
    this.dist = dist;
    this.len = len;
    this.arrowLeft = arrowLeft;
    this.marker = marker;

    colorMode(HSL);
    this.color = getColor(len);
    this.darkColor = getColor(len, "darker");
    colorMode(RGB);
  }

  draw() {
    fill(this.color);

    stroke(this.darkColor);

    strokeWeight(2);

    rect(
      this.x * scaleSize + padding,
      this.y * scaleSize + padding,
      scaleSize - padding * 2,
      scaleSize - padding * 2,
      5
    );

    stroke(0);
    strokeWeight(2);
    fill(0);

    const arrowY = 0.3;
    const arrowTipHeight = 0.08;
    const arrowTipWidth = 0.1;

    line(
      this.x * scaleSize + scaleSize * 0.3,
      this.y * scaleSize + scaleSize * arrowY,
      this.x * scaleSize + scaleSize * 0.7,
      this.y * scaleSize + scaleSize * arrowY
    );

    triangle(
      this.x * scaleSize + scaleSize * (this.arrowLeft ? 0.3 : 0.7),
      this.y * scaleSize + scaleSize * arrowY,
      this.x * scaleSize + scaleSize * (this.arrowLeft ? 0.3 + arrowTipWidth : 0.7 - arrowTipWidth),
      this.y * scaleSize + scaleSize * (arrowY - arrowTipHeight),
      this.x * scaleSize + scaleSize * (this.arrowLeft ? 0.3 + arrowTipWidth : 0.7 - arrowTipWidth),
      this.y * scaleSize + scaleSize * (arrowY + arrowTipHeight)
    );

    textSize(scaleSize * 0.45);
    textAlign(CENTER, CENTER);
    textFont(fonts[0]);
    strokeWeight(map(scaleSize, 20, 80, 1, 2));

    text(
      this.arrowLeft ? this.dist : this.len,
      this.x * scaleSize + scaleSize * 0.5,
      this.y * scaleSize + scaleSize * 0.65,
    );
  }

  bytes() {
    return 0;
  }
}

function getColor(len, kind) {
  let c;
  let preparedLen = -Math.log(len) * 70 + 300;
  if (!kind) {
    c = color(preparedLen % 360, 100, 50);
  } else if (kind === "darker") {
    c = color(preparedLen % 360, 100, 30);
  } else {
    assert(false, "getColor: invalid kind");
  }
  return c;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function abstract() {
  assert(false, "Abstract method");
}
