import { GameDifficulty } from '../utils/gamificationEngine';

export interface CrosswordGridWord {
  word: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface WordscapesLevel {
  levelNumber: number;
  themeTitle: string;
  difficulty: GameDifficulty;
  letters: string[];
  gridWords: CrosswordGridWord[];
  gridDimensions: { rows: number; cols: number };
  funFact: string;
}

export const CROSSWORD_50_LEVELS: WordscapesLevel[] = [
  {
    "levelNumber": 1,
    "themeTitle": "Morning Light",
    "difficulty": "easy",
    "letters": [
      "L",
      "I",
      "G",
      "H",
      "T"
    ],
    "gridDimensions": {
      "rows": 3,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "LIGHT",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "HIT",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "LIT",
        "row": 0,
        "col": 0,
        "direction": "down"
      }
    ],
    "funFact": "Let there be light: and there was light."
  },
  {
    "levelNumber": 2,
    "themeTitle": "Living Water",
    "difficulty": "easy",
    "letters": [
      "W",
      "A",
      "T",
      "E",
      "R"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "WATER",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "TEAR",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "RATE",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "RAW",
        "row": 0,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "He leadeth me beside the still waters."
  },
  {
    "levelNumber": 3,
    "themeTitle": "Starry Night",
    "difficulty": "easy",
    "letters": [
      "N",
      "I",
      "G",
      "H",
      "T"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "NIGHT",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "THIN",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "HINT",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "HIT",
        "row": 0,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "The heavens declare the glory of God by day and night."
  },
  {
    "levelNumber": 4,
    "themeTitle": "Daily Bread",
    "difficulty": "easy",
    "letters": [
      "B",
      "R",
      "E",
      "A",
      "D"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "BREAD",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "BEAR",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "READ",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "DARE",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "BED",
        "row": 0,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "Give us this day our daily bread."
  },
  {
    "levelNumber": 5,
    "themeTitle": "Sacred Earth",
    "difficulty": "easy",
    "letters": [
      "E",
      "A",
      "R",
      "T",
      "H"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "EARTH",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "HEAT",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "HEAR",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "HAT",
        "row": 0,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "The earth is the Lord's, and the fulness thereof."
  },
  {
    "levelNumber": 6,
    "themeTitle": "Sweet Fruit",
    "difficulty": "easy",
    "letters": [
      "F",
      "R",
      "U",
      "I",
      "T"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "FRUIT",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "RUT",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "FIT",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "FUR",
        "row": 0,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "A tree is known by its good fruit."
  },
  {
    "levelNumber": 7,
    "themeTitle": "Corner Stone",
    "difficulty": "easy",
    "letters": [
      "S",
      "T",
      "O",
      "N",
      "E"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "STONE",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "TONE",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "NOSE",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "NET",
        "row": 0,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "SON",
        "row": 1,
        "col": 0,
        "direction": "down"
      }
    ],
    "funFact": "The stone the builders rejected became the cornerstone."
  },
  {
    "levelNumber": 8,
    "themeTitle": "Gentle Peace",
    "difficulty": "easy",
    "letters": [
      "P",
      "E",
      "A",
      "C",
      "E"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "PEACE",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "CAPE",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "PACE",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "APE",
        "row": 0,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "Blessed are the peacemakers, for they shall be called children of God."
  },
  {
    "levelNumber": 9,
    "themeTitle": "Royal Crown",
    "difficulty": "easy",
    "letters": [
      "C",
      "R",
      "O",
      "W",
      "N"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "CROWN",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "CORN",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "CROW",
        "row": 0,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "ROW",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "NOW",
        "row": 1,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "Be faithful unto death, and I will give thee a crown of life."
  },
  {
    "levelNumber": 10,
    "themeTitle": "River of Life",
    "difficulty": "easy",
    "letters": [
      "R",
      "I",
      "V",
      "E",
      "R"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "RIVER",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "RIVE",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "ERR",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "REV",
        "row": 0,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "And he showed me a pure river of water of life, clear as crystal."
  },
  {
    "levelNumber": 11,
    "themeTitle": "Open Heaven",
    "difficulty": "easy",
    "letters": [
      "H",
      "E",
      "A",
      "V",
      "E",
      "N"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "HEAVEN",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "HAVE",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "EVEN",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "VANE",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "HEN",
        "row": 0,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "In the beginning God created the heaven and the earth."
  },
  {
    "levelNumber": 12,
    "themeTitle": "Holy Angel",
    "difficulty": "easy",
    "letters": [
      "A",
      "N",
      "G",
      "E",
      "L"
    ],
    "gridDimensions": {
      "rows": 6,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "ANGEL",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "GLEAN",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "LANE",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "LEAN",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "ALE",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "AGE",
        "row": 4,
        "col": 2,
        "direction": "across"
      }
    ],
    "funFact": "He shall give his angels charge over thee."
  },
  {
    "levelNumber": 13,
    "themeTitle": "Living Faith",
    "difficulty": "easy",
    "letters": [
      "F",
      "A",
      "I",
      "T",
      "H"
    ],
    "gridDimensions": {
      "rows": 3,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "FAITH",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "HAT",
        "row": 0,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "FAT",
        "row": 0,
        "col": 0,
        "direction": "down"
      }
    ],
    "funFact": "Now faith is the substance of things hoped for."
  },
  {
    "levelNumber": 14,
    "themeTitle": "Eternal Glory",
    "difficulty": "easy",
    "letters": [
      "G",
      "L",
      "O",
      "R",
      "Y"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "GLORY",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "GYRO",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "LOG",
        "row": 0,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "The whole earth is full of his divine glory."
  },
  {
    "levelNumber": 15,
    "themeTitle": "Sacred Temple",
    "difficulty": "easy",
    "letters": [
      "T",
      "E",
      "M",
      "P",
      "L",
      "E"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "TEMPLE",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "MELT",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "MEET",
        "row": 0,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "PET",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "LET",
        "row": 1,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "Know ye not that ye are the temple of God?"
  },
  {
    "levelNumber": 16,
    "themeTitle": "Earnest Prayer",
    "difficulty": "medium",
    "letters": [
      "P",
      "R",
      "A",
      "Y",
      "E",
      "R"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "PRAYER",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "PRAY",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "YEAR",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "REAP",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "PEAR",
        "row": 0,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "PAY",
        "row": 0,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "Pray without ceasing with a joyful thankful heart."
  },
  {
    "levelNumber": 17,
    "themeTitle": "Holy Mountain",
    "difficulty": "medium",
    "letters": [
      "M",
      "O",
      "U",
      "N",
      "T"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "MOUNT",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "NOT",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "NUT",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "OUT",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "TOM",
        "row": 1,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "I will lift up mine eyes unto the hills."
  },
  {
    "levelNumber": 18,
    "themeTitle": "Divine Wisdom",
    "difficulty": "medium",
    "letters": [
      "W",
      "I",
      "S",
      "D",
      "O",
      "M"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "WISDOM",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SWIM",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "MOW",
        "row": 1,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "DIM",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "SOW",
        "row": 0,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "The fear of the Lord is the beginning of wisdom."
  },
  {
    "levelNumber": 19,
    "themeTitle": "Good Shepherd",
    "difficulty": "medium",
    "letters": [
      "S",
      "H",
      "E",
      "E",
      "P"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "SHEEP",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SEEP",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "SEE",
        "row": 0,
        "col": 0,
        "direction": "down"
      }
    ],
    "funFact": "The Lord is my shepherd; I shall not want."
  },
  {
    "levelNumber": 20,
    "themeTitle": "Pillar of Cloud",
    "difficulty": "medium",
    "letters": [
      "C",
      "L",
      "O",
      "U",
      "D"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "CLOUD",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "LOUD",
        "row": 0,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "COLD",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "OLD",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "DUO",
        "row": 0,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "The Lord went before them by day in a pillar of cloud."
  },
  {
    "levelNumber": 21,
    "themeTitle": "Mustard Seed",
    "difficulty": "medium",
    "letters": [
      "S",
      "E",
      "E",
      "D",
      "S"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "SEEDS",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SEED",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "SEES",
        "row": 0,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "SEE",
        "row": 0,
        "col": 0,
        "direction": "down"
      }
    ],
    "funFact": "Faith like a grain of mustard seed can move mountains!"
  },
  {
    "levelNumber": 22,
    "themeTitle": "Faithful Shield",
    "difficulty": "medium",
    "letters": [
      "S",
      "H",
      "I",
      "E",
      "L",
      "D"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "SHIELD",
        "row": 3,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SLIDE",
        "row": 3,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "HIDE",
        "row": 3,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "HELD",
        "row": 2,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "SHED",
        "row": 0,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "LED",
        "row": 3,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "The Lord is my strength and my shield."
  },
  {
    "levelNumber": 23,
    "themeTitle": "Sacred Cross",
    "difficulty": "medium",
    "letters": [
      "C",
      "R",
      "O",
      "S",
      "S"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "CROSS",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "ROCS",
        "row": 0,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "ORCS",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "SOC",
        "row": 0,
        "col": 3,
        "direction": "down"
      }
    ],
    "funFact": "Grace and redemption flow through divine love."
  },
  {
    "levelNumber": 24,
    "themeTitle": "Holy Spirit",
    "difficulty": "medium",
    "letters": [
      "S",
      "P",
      "I",
      "R",
      "I",
      "T"
    ],
    "gridDimensions": {
      "rows": 6,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "SPIRIT",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "STRIP",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "TRIP",
        "row": 1,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "TIPS",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "PITS",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "SIT",
        "row": 0,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "The fruit of the Spirit is love, joy, peace, and patience."
  },
  {
    "levelNumber": 25,
    "themeTitle": "Still Small Voice",
    "difficulty": "medium",
    "letters": [
      "V",
      "O",
      "I",
      "C",
      "E"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "VOICE",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "COVE",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "VICE",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "ICE",
        "row": 0,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "And after the fire came a still small voice."
  },
  {
    "levelNumber": 26,
    "themeTitle": "Pure Truth",
    "difficulty": "medium",
    "letters": [
      "T",
      "R",
      "U",
      "T",
      "H"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "TRUTH",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "HURT",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "RUTH",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "HUT",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "RUT",
        "row": 1,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "And ye shall know the truth, and the truth shall make you free."
  },
  {
    "levelNumber": 27,
    "themeTitle": "Pure Heart",
    "difficulty": "medium",
    "letters": [
      "H",
      "E",
      "A",
      "R",
      "T"
    ],
    "gridDimensions": {
      "rows": 6,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "HEART",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "EARTH",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "HEAT",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "HEAR",
        "row": 0,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "HATE",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "ART",
        "row": 0,
        "col": 3,
        "direction": "down"
      }
    ],
    "funFact": "Blessed are the pure in heart: for they shall see God."
  },
  {
    "levelNumber": 28,
    "themeTitle": "Morning Star",
    "difficulty": "medium",
    "letters": [
      "S",
      "T",
      "A",
      "R",
      "S"
    ],
    "gridDimensions": {
      "rows": 4,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "STARS",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "STAR",
        "row": 0,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "ARTS",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "RATS",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "TAR",
        "row": 0,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "I am the root and the offspring of David, and the bright and morning star."
  },
  {
    "levelNumber": 29,
    "themeTitle": "Grace Abounding",
    "difficulty": "medium",
    "letters": [
      "G",
      "R",
      "A",
      "C",
      "E"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "GRACE",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "RACE",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "CARE",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "CAGE",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "AGE",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "EAR",
        "row": 1,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "My grace is sufficient for thee: for my strength is made perfect in weakness."
  },
  {
    "levelNumber": 30,
    "themeTitle": "Mighty Power",
    "difficulty": "medium",
    "letters": [
      "P",
      "O",
      "W",
      "E",
      "R"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 5
    },
    "gridWords": [
      {
        "word": "POWER",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "ROPE",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "PORE",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "WORE",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "ROW",
        "row": 0,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "PER",
        "row": 0,
        "col": 3,
        "direction": "down"
      }
    ],
    "funFact": "For thine is the kingdom, and the power, and the glory, for ever."
  },
  {
    "levelNumber": 31,
    "themeTitle": "Olive Branch",
    "difficulty": "medium",
    "letters": [
      "B",
      "R",
      "A",
      "N",
      "C",
      "H"
    ],
    "gridDimensions": {
      "rows": 6,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "BRANCH",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "BARN",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "CRAB",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "ARCH",
        "row": 2,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "CHAR",
        "row": 1,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "RAN",
        "row": 2,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "CAN",
        "row": 0,
        "col": 3,
        "direction": "down"
      }
    ],
    "funFact": "I am the vine, ye are the branches: he that abideth in me bringeth forth much fruit."
  },
  {
    "levelNumber": 32,
    "themeTitle": "Abundant Harvest",
    "difficulty": "medium",
    "letters": [
      "H",
      "A",
      "R",
      "V",
      "E",
      "S",
      "T"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "HARVEST",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "HEARTS",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "STARVE",
        "row": 2,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "SHARE",
        "row": 0,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "EARTH",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "HEART",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "STAR",
        "row": 2,
        "col": 5,
        "direction": "down"
      }
    ],
    "funFact": "The harvest truly is plenteous, but the labourers are few."
  },
  {
    "levelNumber": 33,
    "themeTitle": "Pillar of Fire",
    "difficulty": "medium",
    "letters": [
      "P",
      "I",
      "L",
      "L",
      "A",
      "R"
    ],
    "gridDimensions": {
      "rows": 5,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "PILLAR",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "PALL",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "PAIR",
        "row": 0,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "RAIL",
        "row": 1,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "LIP",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "ALL",
        "row": 0,
        "col": 3,
        "direction": "down"
      }
    ],
    "funFact": "The pillar of cloud by day and the pillar of fire by night departed not."
  },
  {
    "levelNumber": 34,
    "themeTitle": "Golden Altar",
    "difficulty": "medium",
    "letters": [
      "A",
      "L",
      "T",
      "A",
      "R",
      "S"
    ],
    "gridDimensions": {
      "rows": 7,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "ALTARS",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "ALTAR",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "ATLAS",
        "row": 2,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "RATS",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "STAR",
        "row": 2,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "ART",
        "row": 0,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "Incense rose before the golden altar in fragrant reverence."
  },
  {
    "levelNumber": 35,
    "themeTitle": "Holy Covenant",
    "difficulty": "medium",
    "letters": [
      "C",
      "O",
      "V",
      "E",
      "N",
      "A",
      "N",
      "T"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 8
    },
    "gridWords": [
      {
        "word": "COVENANT",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "CANNOT",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "CANOE",
        "row": 1,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "CONE",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "COTE",
        "row": 0,
        "col": 7,
        "direction": "down"
      },
      {
        "word": "NET",
        "row": 2,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "I will establish my covenant between me and thee and thy seed."
  },
  {
    "levelNumber": 36,
    "themeTitle": "Everlasting Kingdom",
    "difficulty": "hard",
    "letters": [
      "K",
      "I",
      "N",
      "G",
      "D",
      "O",
      "M"
    ],
    "gridDimensions": {
      "rows": 7,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "KINGDOM",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "DOING",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "MIND",
        "row": 2,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "KIND",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "KING",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "DIG",
        "row": 0,
        "col": 3,
        "direction": "down"
      }
    ],
    "funFact": "Thy kingdom is an everlasting kingdom throughout all generations."
  },
  {
    "levelNumber": 37,
    "themeTitle": "Fruitful Olive",
    "difficulty": "hard",
    "letters": [
      "O",
      "L",
      "I",
      "V",
      "E",
      "S"
    ],
    "gridDimensions": {
      "rows": 7,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "OLIVES",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SOLVE",
        "row": 2,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "VOLES",
        "row": 2,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "LIVES",
        "row": 2,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "LOVE",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "SOIL",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "OIL",
        "row": 1,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "I am like a green olive tree in the house of God."
  },
  {
    "levelNumber": 38,
    "themeTitle": "Living Fountain",
    "difficulty": "hard",
    "letters": [
      "F",
      "O",
      "U",
      "N",
      "T",
      "A",
      "I",
      "N"
    ],
    "gridDimensions": {
      "rows": 6,
      "cols": 8
    },
    "gridWords": [
      {
        "word": "FOUNTAIN",
        "row": 0,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "NATION",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "INFANT",
        "row": 0,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "UNION",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "AUNT",
        "row": 0,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "OUT",
        "row": 0,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "With thee is the fountain of life: in thy light shall we see light."
  },
  {
    "levelNumber": 39,
    "themeTitle": "Silver Trumpet",
    "difficulty": "hard",
    "letters": [
      "T",
      "R",
      "U",
      "M",
      "P",
      "E",
      "T"
    ],
    "gridDimensions": {
      "rows": 7,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "TRUMPET",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "MUTTER",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "TRUMP",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "RUMP",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "PURE",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "TERM",
        "row": 1,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "PET",
        "row": 0,
        "col": 5,
        "direction": "down"
      }
    ],
    "funFact": "Praise him with the sound of the trumpet!"
  },
  {
    "levelNumber": 40,
    "themeTitle": "Chariot of Fire",
    "difficulty": "hard",
    "letters": [
      "C",
      "H",
      "A",
      "R",
      "I",
      "O",
      "T"
    ],
    "gridDimensions": {
      "rows": 6,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "CHARIOT",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "CHAIR",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "TORCH",
        "row": 1,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "ARCH",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "COAT",
        "row": 0,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "RICH",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "HAT",
        "row": 1,
        "col": 1,
        "direction": "down"
      }
    ],
    "funFact": "Behold, there appeared a chariot of fire, and horses of fire."
  },
  {
    "levelNumber": 41,
    "themeTitle": "Sacred Tabernacle",
    "difficulty": "hard",
    "letters": [
      "T",
      "A",
      "B",
      "L",
      "E",
      "S"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "TABLES",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "STABLE",
        "row": 2,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "BLEST",
        "row": 2,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "TABLE",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "BEAST",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "TALES",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "SLATE",
        "row": 1,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "BAT",
        "row": 0,
        "col": 0,
        "direction": "down"
      }
    ],
    "funFact": "The tabernacle of God is with men, and he will dwell with them."
  },
  {
    "levelNumber": 42,
    "themeTitle": "Heavenly Manna",
    "difficulty": "hard",
    "letters": [
      "M",
      "A",
      "N",
      "N",
      "A",
      "S"
    ],
    "gridDimensions": {
      "rows": 7,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "MANNAS",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "MANNA",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "SAMAN",
        "row": 2,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "MANS",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "ANAS",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "MASA",
        "row": 0,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "NAM",
        "row": 2,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "SAN",
        "row": 1,
        "col": 4,
        "direction": "down"
      }
    ],
    "funFact": "He gave them bread from heaven to eat in the wilderness."
  },
  {
    "levelNumber": 43,
    "themeTitle": "Tall Cedars of Lebanon",
    "difficulty": "hard",
    "letters": [
      "C",
      "E",
      "D",
      "A",
      "R",
      "S"
    ],
    "gridDimensions": {
      "rows": 10,
      "cols": 6
    },
    "gridWords": [
      {
        "word": "CEDARS",
        "row": 4,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SCARED",
        "row": 4,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "CADRES",
        "row": 4,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "CEDAR",
        "row": 3,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "CARED",
        "row": 3,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "ACRES",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "RACES",
        "row": 0,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "RED",
        "row": 2,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "The righteous shall flourish like a palm tree and grow like a cedar in Lebanon."
  },
  {
    "levelNumber": 44,
    "themeTitle": "Covenant Rainbow",
    "difficulty": "hard",
    "letters": [
      "R",
      "A",
      "I",
      "N",
      "B",
      "O",
      "W"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "RAINBOW",
        "row": 3,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "BRAIN",
        "row": 3,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "BARON",
        "row": 2,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "BROWN",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "ROBIN",
        "row": 2,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "RAIN",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "BARN",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "BOW",
        "row": 1,
        "col": 6,
        "direction": "down"
      }
    ],
    "funFact": "I do set my bow in the cloud, and it shall be for a token of a covenant."
  },
  {
    "levelNumber": 45,
    "themeTitle": "Quiet Shelter",
    "difficulty": "hard",
    "letters": [
      "S",
      "H",
      "E",
      "L",
      "T",
      "E",
      "R"
    ],
    "gridDimensions": {
      "rows": 7,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "SHELTER",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "STEEL",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "SHEER",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "THERE",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "THREE",
        "row": 0,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "LEST",
        "row": 2,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "LET",
        "row": 1,
        "col": 2,
        "direction": "down"
      }
    ],
    "funFact": "Thou hast been a shelter for me, and a strong tower from the enemy."
  },
  {
    "levelNumber": 46,
    "themeTitle": "Sacred Sanctuary",
    "difficulty": "hard",
    "letters": [
      "S",
      "A",
      "N",
      "C",
      "T",
      "U",
      "S"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "SANCTUS",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SANCTS",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "CANTUS",
        "row": 2,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "ACUS",
        "row": 2,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "NUTS",
        "row": 2,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "CATS",
        "row": 0,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "SCAN",
        "row": 2,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "SUN",
        "row": 1,
        "col": 5,
        "direction": "down"
      }
    ],
    "funFact": "Lift up your hands in the sanctuary, and bless the Lord."
  },
  {
    "levelNumber": 47,
    "themeTitle": "Golden Seraphim",
    "difficulty": "hard",
    "letters": [
      "P",
      "R",
      "A",
      "I",
      "S",
      "E",
      "S"
    ],
    "gridDimensions": {
      "rows": 7,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "PRAISES",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "SPIRES",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "PRAISE",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "RASPS",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "SPEAR",
        "row": 1,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "PAIRS",
        "row": 0,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "RIPES",
        "row": 0,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "SEA",
        "row": 0,
        "col": 5,
        "direction": "down"
      }
    ],
    "funFact": "Holy, holy, holy, is the Lord of hosts: the whole earth is full of his glory."
  },
  {
    "levelNumber": 48,
    "themeTitle": "Heavenly Paradise",
    "difficulty": "hard",
    "letters": [
      "P",
      "A",
      "R",
      "A",
      "D",
      "I",
      "S",
      "E"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 8
    },
    "gridWords": [
      {
        "word": "PARADISE",
        "row": 1,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "ASPIRED",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "DESPAIR",
        "row": 1,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "PRAISED",
        "row": 1,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "RADIES",
        "row": 1,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "SPIDER",
        "row": 1,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "RAISED",
        "row": 0,
        "col": 3,
        "direction": "down"
      }
    ],
    "funFact": "Today shalt thou be with me in paradise."
  },
  {
    "levelNumber": 49,
    "themeTitle": "Mighty Deliverer",
    "difficulty": "hard",
    "letters": [
      "D",
      "E",
      "L",
      "I",
      "V",
      "E",
      "R"
    ],
    "gridDimensions": {
      "rows": 9,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "DELIVER",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "RELIVED",
        "row": 2,
        "col": 6,
        "direction": "down"
      },
      {
        "word": "VEILED",
        "row": 2,
        "col": 4,
        "direction": "down"
      },
      {
        "word": "LIVER",
        "row": 2,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "ELDER",
        "row": 2,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "LEVER",
        "row": 1,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "DEVIL",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "RED",
        "row": 0,
        "col": 0,
        "direction": "down"
      }
    ],
    "funFact": "The Lord is my rock, and my fortress, and my deliverer."
  },
  {
    "levelNumber": 50,
    "themeTitle": "Divine Restoration",
    "difficulty": "hard",
    "letters": [
      "R",
      "E",
      "S",
      "T",
      "O",
      "R",
      "E"
    ],
    "gridDimensions": {
      "rows": 8,
      "cols": 7
    },
    "gridWords": [
      {
        "word": "RESTORE",
        "row": 2,
        "col": 0,
        "direction": "across"
      },
      {
        "word": "RESORT",
        "row": 2,
        "col": 0,
        "direction": "down"
      },
      {
        "word": "ROSTER",
        "row": 2,
        "col": 5,
        "direction": "down"
      },
      {
        "word": "STORE",
        "row": 2,
        "col": 2,
        "direction": "down"
      },
      {
        "word": "TREES",
        "row": 2,
        "col": 3,
        "direction": "down"
      },
      {
        "word": "RESET",
        "row": 1,
        "col": 1,
        "direction": "down"
      },
      {
        "word": "STERO",
        "row": 0,
        "col": 6,
        "direction": "down"
      }
    ],
    "funFact": "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."
  }
];
