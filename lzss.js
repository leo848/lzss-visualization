const BUF_CAP = 255;

function lzss(string, index) {
  let input = string;

  let [ offset, length ] = findLongestMatch(input, index);
  if (length > 3) {
    return[ true, [offset, length] ];
  } else {
    return[ false, input[index] ];
  }
}

function findLongestMatch(array, index) {
  let length = 0;
  let startIndex = 0;
  for (let i = Math.max(index - 255, 0); i < index; i++) {
    let match_len = 0;
    for (let l = 0; l < array.length; l++) {
      if (array[i + l] === array[index + l]) {
        match_len++;
      } else {
        break;
      }
    }
    if (match_len >= length) {
      length = match_len;
      startIndex = i;
    }
  }


  let offset = index - startIndex;

  return [offset, length];
}
