///**
// * Blockly Games: Variables
// *
// * Copyright 2012 Google Inc.
// * https://github.com/google/blockly-games
// *
// * Licensed under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with the License.
// * You may obtain a copy of the License at
// *
// *   http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS,
// * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// * See the License for the specific language governing permissions and
// * limitations under the License.
// */
//
///**
// * @fileoverview JavaScript for Blockly's Variables application.
// * @author fraser@google.com (Neil Fraser)
// */
//'use strict';
//
goog.provide('Conditional');

goog.require("Chip");
goog.require("Chip.Blocks");
goog.require('Conditional.soy');

// the chip.js and chip-block.js are not repeated in each folder, they are
// symbolic links. It is a quick-and-dirty way for sharing the maze interpreter
// among all levels. 

app = Conditional;
appId = 2;
BlocklyGames.NAME = "conditional"

// configure mazes for Variables lesson

Chip.MAX_BLOCKS = [undefined, // Level 0.
    4, 4,
    8, 8,
    Infinity, Infinity,
    6, 6,
    8, 8,
    Infinity, Infinity,
    Infinity, Infinity, 
    Infinity, Infinity,
    Infinity, Infinity, 
    8, 8][BlocklyGames.LEVEL];

Chip.MIN_GARBAGE = [undefined, // Level 0.
	3, 3,
        1, 1,
        2, 2,
        3, 3,
        3, 3,
        4, 4,
        2, 2,
        3, 2,
        5, 5,
        5, 5][BlocklyGames.LEVEL]

// The maze square constants defined above are inlined here
// for ease of reading and writing the static mazes.
Chip.map = [
// Level 0.
 undefined,
// Level 1.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 4, 1, 4, 1, 4, 3],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 1b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [2, 4, 1, 4, 1, 4, 1, 3],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 2.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 1, 4, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 3, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 2b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 2, 1, 1, 1, 1, 4, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 3.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 1, 4, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 4, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 3b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 4, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 2, 1, 1, 1, 1, 4, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 4.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 1, 1, 1, 4, 0, 0],
  [0, 3, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 4, 1, 1, 1, 4, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 4b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 1, 4, 1, 1, 0, 0],
  [0, 3, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 4, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 4, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 5.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 4, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 4, 1, 1, 4, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 3, 0]],
// Level 5b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 4, 1, 1, 4, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [2, 1, 1, 4, 0, 0, 0, 0]],
// Level 6.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 4, 1, 3],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 4, 1, 4, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 2, 1, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 6b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [2, 4, 1, 0, 0, 0, 0, 0],
  [0, 0, 4, 0, 0, 0, 0, 0],
  [0, 0, 1, 4, 1, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0],
  [0, 0, 0, 0, 1, 4, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 7.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 0, 0, 0, 0, 3, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 4, 0, 0, 0, 0, 4, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 7b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 0, 0, 0, 0, 3, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 4, 1, 1, 1, 1, 4, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 8.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 1, 1, 4, 1, 1, 4],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 8b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 4, 1, 1, 2, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 4, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 3, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 9.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 4, 1, 1, 1, 1, 1],
  [0, 1, 0, 4, 0, 1, 0, 1],
  [0, 1, 1, 1, 4, 1, 1, 1],
  [0, 1, 0, 1, 0, 4, 0, 1],
  [0, 1, 1, 1, 1, 1, 4, 3],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 9b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 1, 1, 1, 1, 1, 1],
  [0, 4, 0, 1, 0, 1, 0, 1],
  [0, 1, 4, 1, 1, 1, 1, 1],
  [0, 1, 0, 4, 0, 1, 0, 1],
  [0, 1, 1, 1, 4, 1, 1, 1],
  [0, 1, 0, 1, 0, 4, 0, 1],
  [0, 1, 1, 1, 1, 3, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 10.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 0, 4, 0],
  [1, 1, 1, 1, 1, 4, 1, 1],
  [1, 0, 4, 0, 0, 3, 0, 1],
  [1, 0, 1, 0, 0, 4, 0, 1],
  [1, 1, 1, 4, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 10b.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 4, 0, 0, 1, 0],
  [1, 1, 4, 1, 1, 1, 1, 3],
  [4, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 4],
  [1, 4, 1, 1, 1, 1, 4, 1],
  [0, 0, 0, 0, 0, 0, 0, 0]]
][BlocklyGames.LEVEL];

/**
 * Measure maze dimensions and set sizes.
 * ROWS: Number of tiles down.
 * COLS: Number of tiles across.
 * SQUARE_SIZE: Pixel height and width of each maze square (i.e. tile).
 */
Chip.ROWS = Chip.map.length;
Chip.COLS = Chip.map[0].length;
Chip.SQUARE_SIZE = 50;
Chip.PEGMAN_HEIGHT = 52;
Chip.PEGMAN_WIDTH = 49;

Chip.MAZE_WIDTH = Chip.SQUARE_SIZE * Chip.COLS;
Chip.MAZE_HEIGHT = Chip.SQUARE_SIZE * Chip.ROWS;
Chip.PATH_WIDTH = Chip.SQUARE_SIZE / 3;

BlocklyGames.MAX_LEVEL = 20;

switch(BlocklyGames.LEVEL){
    default:
        Chip.defaultXml = '<xml>' +
            '  <block movable="false" ' +
            'type="maze_forever" x="70" y="70"></block>' +
            '</xml>';
        break;
}


Chip.onResize = function(){
    if(BlocklyGames.LEVEL % 2 === 0){
         var blocklyDiv = document.getElementById('blockly');
         var el = document.getElementById('stopInteraction');
         if(el){
            el.style.width =  '' + blocklyDiv.clientWidth + 'px';
            el.style.height ='' + blocklyDiv.clientHeight + 'px';
         }
         
    }
};


Chip.onInit = function(){
    if(BlocklyGames.LEVEL % 2 === 0){
        // in this lesson we do not use a flyout on even levels
        Blockly.mainWorkspace.getFlyout_().hide();
        
        // disable interaction with the workspace
        var el = document.createElement('div');
        var blocklyDiv = document.getElementById('blockly');
        el.class = 'blocklyWorkspace';
        el.id = 'stopInteraction'
        el.style.zIndex = 10;
        el.style.position = 'absolute';
        el.style.width =  '' + blocklyDiv.clientWidth + 'px';
        el.style.height ='' + blocklyDiv.clientHeight + 'px';
        
        
        blocklyDiv.insertBefore(el, blocklyDiv.firstChild);
        
        
        // load last maze solution
        var restore = BlocklyGames.loadFromLocalStorage(
                BlocklyGames.NAME, BlocklyGames.LEVEL-1);
        if(restore){
            BlocklyInterface.setCode(restore);
        }
                           
    }
}

window.addEventListener('load', Chip.init);
