/**
 * Blockly Games: Maze Blocks
 *
 * Copyright 2012 Google Inc.
 * https://github.com/google/blockly-games
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Blocks for Blockly's Maze application.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Chip.Blocks');

goog.require('Blockly');
goog.require('Blockly.JavaScript');
goog.require('BlocklyGames');


/**
 * Common HSV hue for all movement blocks.
 */
Chip.Blocks.MOVEMENT_HUE = 290;

/**
 * HSV hue for loop block.
 */
Chip.Blocks.LOOPS_HUE = 120;

/**
 * Common HSV hue for all logic blocks.
 */
Chip.Blocks.LOGIC_HUE = 210;

/**
 * Left turn arrow to be appended to messages.
 */
Chip.Blocks.LEFT_TURN = ' \u21BA';

/**
 * Left turn arrow to be appended to messages.
 */
Chip.Blocks.RIGHT_TURN = ' \u21BB';

// Extension for collecting garbage
Blockly.Blocks['variables_collect'] = {
  /**
   * Block for moving forward.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": BlocklyGames.getMsg('Chip_collect'),
      "previousStatement": null,
      "nextStatement": null,
      "colour": Chip.Blocks.MOVEMENT_HUE,
      "tooltip": BlocklyGames.getMsg('Chip_collect_help')
    });
  }
};

Blockly.JavaScript['variables_collect'] = function(block) {
  // Generate JavaScript for moving forward.
  return 'collect(\'block_id_' + block.id + '\');\n';
};



// Extensions to Blockly's language and JavaScript generator.

Blockly.Blocks['maze_moveForward'] = {
  /**
   * Block for moving forward.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": BlocklyGames.getMsg('Maze_moveForward'),
      "previousStatement": null,
      "nextStatement": null,
      "colour": Chip.Blocks.MOVEMENT_HUE,
      "tooltip": BlocklyGames.getMsg('Maze_moveForwardTooltip')
    });
  }
};

Blockly.JavaScript['maze_moveForward'] = function(block) {
  // Generate JavaScript for moving forward.
  return 'moveForward(\'block_id_' + block.id + '\');\n';
};

Blockly.Blocks['maze_turn'] = {
  /**
   * Block for turning left or right.
   * @this Blockly.Block
   */
  init: function() {
    //var DIRECTIONS =
    //    [[BlocklyGames.getMsg('Maze_turnLeft'), 'turnLeft'],
    //     [BlocklyGames.getMsg('Maze_turnRight'), 'turnRight']];
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_up'), 'turnUp'],
         [BlocklyGames.getMsg('Chip_down'), 'turnDown'],
    	 [BlocklyGames.getMsg('Chip_left'), 'turnLeft'],
         [BlocklyGames.getMsg('Chip_right'), 'turnRight']];
    // Append arrows to direction messages.
    //DIRECTIONS[0][0] += Chip.Blocks.LEFT_TURN;
    //DIRECTIONS[1][0] += Chip.Blocks.RIGHT_TURN;
    this.setColour(Chip.Blocks.MOVEMENT_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(BlocklyGames.getMsg('Maze_turnTooltip'));
  }
};

Blockly.JavaScript['maze_turn'] = function(block) {
  // Generate JavaScript for turning left or right.
  var dir = block.getFieldValue('DIR');
  return dir + '(\'block_id_' + block.id + '\');\n';
};

Blockly.Blocks['maze_rotate'] = {
  /**
   * Block for turning left or right.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_rotateLeft'), 'rotateLeft'],
         [BlocklyGames.getMsg('Chip_rotateRight'), 'rotateRight']];
    // Append arrows to direction messages.
    //DIRECTIONS[0][0] += Chip.Blocks.LEFT_TURN;
    //DIRECTIONS[1][0] += Chip.Blocks.RIGHT_TURN;
    this.setColour(Chip.Blocks.MOVEMENT_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(BlocklyGames.getMsg('Maze_turnTooltip'));
  }
};

Blockly.JavaScript['maze_rotate'] = function(block) {
  // Generate JavaScript for turning left or right.
  var dir = block.getFieldValue('DIR');
  return dir + '(\'block_id_' + block.id + '\');\n';
};

Blockly.Blocks['maze_if'] = {
  /**
   * Block for 'if' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_pathUp'), 'isPathUp'],
         [BlocklyGames.getMsg('Chip_pathDown'), 'isPathDown'],
	 [BlocklyGames.getMsg('Chip_pathLeft'), 'isPathLeft'],
         [BlocklyGames.getMsg('Chip_pathRight'), 'isPathRight']];
    // Append arrows to direction messages.
    //DIRECTIONS[1][0] += Chip.Blocks.LEFT_TURN;
    //DIRECTIONS[2][0] += Chip.Blocks.RIGHT_TURN;
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['maze_if'] = function(block) {
  // Generate JavaScript for 'if' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  var code = 'if (' + argument + ') {\n' + branch + '}\n';
  return code;
};

Blockly.Blocks['maze_if_fwd'] = {
  /**
   * Block for 'if' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_pathForward'), 'isPathForward'],
         [BlocklyGames.getMsg('Chip_pathBack'), 'isPathBack'],
         [BlocklyGames.getMsg('Chip_pathOnLeft'), 'isPathOnLeft'],
         [BlocklyGames.getMsg('Chip_pathOnRight'), 'isPathOnRight']];
    // Append arrows to direction messages.
    //DIRECTIONS[1][0] += Chip.Blocks.LEFT_TURN;
    //DIRECTIONS[2][0] += Chip.Blocks.RIGHT_TURN;
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['maze_if_fwd'] = function(block) {
  // Generate JavaScript for 'if' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  var code = 'if (' + argument + ') {\n' + branch + '}\n';
  return code;
};

Blockly.Blocks['maze_ifElse'] = {
  /**
   * Block for 'if/else' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
         [[BlocklyGames.getMsg('Chip_pathUp'), 'isPathUp'],
         [BlocklyGames.getMsg('Chip_pathDown'), 'isPathDown'],
	 [BlocklyGames.getMsg('Chip_pathLeft'), 'isPathLeft'],
         [BlocklyGames.getMsg('Chip_pathRight'), 'isPathRight']];
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.appendStatementInput('ELSE')
        .appendField(BlocklyGames.getMsg('Maze_elseCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifelseTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['maze_ifElse'] = function(block) {
  // Generate JavaScript for 'if/else' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch0 = Blockly.JavaScript.statementToCode(block, 'DO');
  var branch1 = Blockly.JavaScript.statementToCode(block, 'ELSE');
  var code = 'if (' + argument + ') {\n' + branch0 +
             '} else {\n' + branch1 + '}\n';
  return code;
};


Blockly.Blocks['maze_ifElse_fwd'] = {
  /**
   * Block for 'if/else' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_pathForward'), 'isPathForward'],
         [BlocklyGames.getMsg('Chip_pathBack'), 'isPathBack'],
         [BlocklyGames.getMsg('Chip_pathOnLeft'), 'isPathOnLeft'],
         [BlocklyGames.getMsg('Chip_pathOnRight'), 'isPathOnRight']];
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.appendStatementInput('ELSE')
        .appendField(BlocklyGames.getMsg('Maze_elseCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifelseTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['maze_ifElse_fwd'] = function(block) {
  // Generate JavaScript for 'if/else' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch0 = Blockly.JavaScript.statementToCode(block, 'DO');
  var branch1 = Blockly.JavaScript.statementToCode(block, 'ELSE');
  var code = 'if (' + argument + ') {\n' + branch0 +
             '} else {\n' + branch1 + '}\n';
  return code;
};


Blockly.Blocks['garbage_if'] = {
  /**
   * Block for 'if' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_garbageHere'), 'isGarbageHere'],
         [BlocklyGames.getMsg('Chip_garbageUp'), 'isGarbageUp'],
         [BlocklyGames.getMsg('Chip_garbageDown'), 'isGarbageDown'],
	 [BlocklyGames.getMsg('Chip_garbageLeft'), 'isGarbageLeft'],
         [BlocklyGames.getMsg('Chip_garbageRight'), 'isGarbageRight']];
    // Append arrows to direction messages.
    //DIRECTIONS[1][0] += Chip.Blocks.LEFT_TURN;
    //DIRECTIONS[2][0] += Chip.Blocks.RIGHT_TURN;
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['garbage_if'] = function(block) {
  // Generate JavaScript for 'if' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  var code = 'if (' + argument + ') {\n' + branch + '}\n';
  return code;
};

Blockly.Blocks['garbage_ifElse'] = {
  /**
   * Block for 'if/else' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_garbageHere'), 'isGarbageHere'],
         [BlocklyGames.getMsg('Chip_garbageUp'), 'isGarbageUp'],
         [BlocklyGames.getMsg('Chip_garbageDown'), 'isGarbageDown'],
	 [BlocklyGames.getMsg('Chip_garbageLeft'), 'isGarbageLeft'],
         [BlocklyGames.getMsg('Chip_garbageRight'), 'isGarbageRight']];
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.appendStatementInput('ELSE')
        .appendField(BlocklyGames.getMsg('Maze_elseCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifelseTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['garbage_ifElse'] = function(block) {
  // Generate JavaScript for 'if/else' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch0 = Blockly.JavaScript.statementToCode(block, 'DO');
  var branch1 = Blockly.JavaScript.statementToCode(block, 'ELSE');
  var code = 'if (' + argument + ') {\n' + branch0 +
             '} else {\n' + branch1 + '}\n';
  return code;
};

Blockly.Blocks['garbage_if_fwd'] = {
  /**
   * Block for 'if' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
    var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_garbageHere'), 'isGarbageHere'],
         [BlocklyGames.getMsg('Chip_garbageForward'), 'isGarbageForward'],
         [BlocklyGames.getMsg('Chip_garbageBack'), 'isGarbageBack'],
         [BlocklyGames.getMsg('Chip_garbageOnLeft'), 'isGarbageOnLeft'],
         [BlocklyGames.getMsg('Chip_garbageOnRight'), 'isGarbageOnRight']];
    // Append arrows to direction messages.
    //DIRECTIONS[1][0] += Chip.Blocks.LEFT_TURN;
    //DIRECTIONS[2][0] += Chip.Blocks.RIGHT_TURN;
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['garbage_if_fwd'] = function(block) {
  // Generate JavaScript for 'if' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  var code = 'if (' + argument + ') {\n' + branch + '}\n';
  return code;
};

Blockly.Blocks['garbage_ifElse_fwd'] = {
  /**
   * Block for 'if/else' conditional if there is a path.
   * @this Blockly.Block
   */
  init: function() {
     var DIRECTIONS =
        [[BlocklyGames.getMsg('Chip_garbageHere'), 'isGarbageHere'],
         [BlocklyGames.getMsg('Chip_garbageForward'), 'isGarbageForward'],
         [BlocklyGames.getMsg('Chip_garbageBack'), 'isGarbageBack'],
         [BlocklyGames.getMsg('Chip_garbageOnLeft'), 'isGarbageOnLeft'],
         [BlocklyGames.getMsg('Chip_garbageOnRight'), 'isGarbageOnRight']];
    this.setColour(Chip.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.appendStatementInput('ELSE')
        .appendField(BlocklyGames.getMsg('Maze_elseCode'));
    this.setTooltip(BlocklyGames.getMsg('Maze_ifelseTooltip'));
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['garbage_ifElse_fwd'] = function(block) {
  // Generate JavaScript for 'if/else' conditional if there is a path.
  var argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  var branch0 = Blockly.JavaScript.statementToCode(block, 'DO');
  var branch1 = Blockly.JavaScript.statementToCode(block, 'ELSE');
  var code = 'if (' + argument + ') {\n' + branch0 +
             '} else {\n' + branch1 + '}\n';
  return code;
};

Blockly.Blocks['maze_forever'] = {
  /**
   * Block for repeat loop.
   * @this Blockly.Block
   */
  init: function() {
    this.setColour(Chip.Blocks.LOOPS_HUE);
    this.appendDummyInput()
        .appendField(BlocklyGames.getMsg('Maze_repeatUntil'))
        .appendField(new Blockly.FieldImage(Chip.SKIN.marker, 12, 16));
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.getMsg('Maze_doCode'));
    this.setPreviousStatement(true);
    this.setTooltip(BlocklyGames.getMsg('Maze_whileTooltip'));
  }
};

Blockly.JavaScript['maze_forever'] = function(block) {
  // Generate JavaScript for repeat loop.
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
    branch = Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'block_id_' + block.id + '\'') + branch;
  }
  return 'while (notDone()) {\n' + branch + '}\n';
};
