/**
 * Blockly Games: Chip
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
 * @fileoverview JavaScript for Blockly's Chip application.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Chip');

goog.require('Blockly.FieldDropdown');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Chip.Blocks');

BlocklyGames.NAME = 'variables';

/**
 * Go to the next level.
 * @suppress {duplicate}
 */
BlocklyInterface.nextLevel = function () {
    if (BlocklyGames.LEVEL < BlocklyGames.MAX_LEVEL) {
        window.location = window.location.protocol + '//' +
                window.location.host + window.location.pathname +
                '?lang=' + BlocklyGames.LANG + '&level=' + (BlocklyGames.LEVEL + 1) +
                '&skin=' + Chip.SKIN_ID;
    } else {
        BlocklyInterface.indexPage();
    }
};

Chip.MAX_BLOCKS = [undefined, // Level 0.
    7, Infinity, 14, 8, 9, 13, Infinity, 18, 8, 13][BlocklyGames.LEVEL];

Chip.MIN_GARBAGE = [undefined, // Level 0.
    2, 3, 3, 4, 5, 8, 5, 5, 8, 5][BlocklyGames.LEVEL]

// Crash type constants.
Chip.CRASH_STOP = 1;
Chip.CRASH_SPIN = 2;
Chip.CRASH_FALL = 3;

Chip.SKINS = [
    // sprite: A 1029x51 set of 21 avatar images.
    // tiles: A 250x200 set of 20 map images.
    // marker: A 20x34 goal image.
    // background: An optional 400x450 background image, or false.
    // graph: Colour of optional grid lines, or false.
    // look: Colour of sonar-like look icon.
    // winSound: List of sounds (in various formats) to play when the player wins.
    // crashSound: List of sounds (in various formats) for player crashes.
    // crashType: Behaviour when player crashes (stop, spin, or fall).
    {
        sprite: 'variables/mbot-arrow.png',
        tiles: 'variables/tiles_pegman.png',
        marker: 'variables/marker.png',
        garbage: 'variables/garbage-mini.png',
        background: false,
        graph: false,
        look: '#000',
        winSound: ['maze/win.mp3', 'maze/win.ogg'],
        crashSound: ['maze/fail_pegman.mp3', 'maze/fail_pegman.ogg'],
        crashType: Chip.CRASH_STOP
    },
    {
        sprite: 'maze/astro.png',
        tiles: 'maze/tiles_astro.png',
        marker: 'maze/marker.png',
        background: 'maze/bg_astro.jpg',
        // Coma star cluster, photo by George Hatfield, used with permission.
        graph: false,
        look: '#fff',
        winSound: ['maze/win.mp3', 'maze/win.ogg'],
        crashSound: ['maze/fail_astro.mp3', 'maze/fail_astro.ogg'],
        crashType: Chip.CRASH_SPIN
    },
    {
        sprite: 'maze/panda.png',
        tiles: 'maze/tiles_panda.png',
        marker: 'maze/marker.png',
        background: 'maze/bg_panda.jpg',
        // Spring canopy, photo by Rupert Fleetingly, CC licensed for reuse.
        graph: false,
        look: '#000',
        winSound: ['maze/win.mp3', 'maze/win.ogg'],
        crashSound: ['maze/fail_panda.mp3', 'maze/fail_panda.ogg'],
        crashType: Chip.CRASH_FALL
    }
];
Chip.SKIN_ID = BlocklyGames.getNumberParamFromUrl('skin', 0, Chip.SKINS.length);
Chip.SKIN = Chip.SKINS[Chip.SKIN_ID];

/**
 * Milliseconds between each animation frame.
 */
Chip.stepSpeed;

/**
 * The types of squares in the maze, which is represented
 * as a 2D array of SquareType values.
 * @enum {number}
 */
Chip.SquareType = {
    WALL: 0,
    OPEN: 1,
    START: 2,
    FINISH: 3,
    GARBAGE: 4,
    COLLECTED: 5,
};

/**
 * Constants for cardinal directions.  Subsequent code assumes these are
 * in the range 0..3 and that opposites have an absolute difference of 2.
 * @enum {number}
 */
Chip.DirectionType = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3,
    HERE: -1
};

/**
 * Outcomes of running the user program.
 */
Chip.ResultType = {
    UNSET: 0,
    SUCCESS: 1,
    FAILURE: -1,
    TIMEOUT: 2,
    ERROR: -2
};

/**
 * Result of last execution.
 */
Chip.result = Chip.ResultType.UNSET;

/**
 * Starting direction.
 */
Chip.startDirection = Chip.DirectionType.EAST;

/**
 * PIDs of animation tasks currently executing.
 */
Chip.pidList = [];

// Map each possible shape to a sprite.
// Input: Binary string representing Centre/North/West/South/East squares.
// Output: [x, y] coordinates of each tile's sprite in tiles.png.
Chip.tile_SHAPES = {
    '10010': [4, 0], // Dead ends
    '10001': [3, 3],
    '11000': [0, 1],
    '10100': [0, 2],
    '11010': [4, 1], // Vertical
    '10101': [3, 2], // Horizontal
    '10110': [0, 0], // Elbows
    '10011': [2, 0],
    '11001': [4, 2],
    '11100': [2, 3],
    '11110': [1, 1], // Junctions
    '10111': [1, 0],
    '11011': [2, 1],
    '11101': [1, 2],
    '11111': [2, 2], // Cross
    'null0': [4, 3], // Empty
    'null1': [3, 0],
    'null2': [3, 1],
    'null3': [0, 3],
    'null4': [1, 3]
};

/**
 * Create and layout all the nodes for the path, scenery, Pegman, and goal.
 */
Chip.drawMap = function () {
    var svg = document.getElementById('svgChip');
    var scale = Math.max(Chip.ROWS, Chip.COLS) * Chip.SQUARE_SIZE;
    svg.setAttribute('viewBox', '0 0 ' + scale + ' ' + scale);
    // Draw the outer square.
    var square = document.createElementNS(Blockly.SVG_NS, 'rect');
    square.setAttribute('width', Chip.MAZE_WIDTH);
    square.setAttribute('height', Chip.MAZE_HEIGHT);
    square.setAttribute('fill', '#F1EEE7');
    square.setAttribute('stroke-width', 1);
    square.setAttribute('stroke', '#CCB');
    svg.appendChild(square);

    if (Chip.SKIN.background) {
        var tile = document.createElementNS(Blockly.SVG_NS, 'image');
        tile.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
                Chip.SKIN.background);
        tile.setAttribute('height', Chip.MAZE_HEIGHT);
        tile.setAttribute('width', Chip.MAZE_WIDTH);
        tile.setAttribute('x', 0);
        tile.setAttribute('y', 0);
        svg.appendChild(tile);
    }

    if (Chip.SKIN.graph) {
        // Draw the grid lines.
        // The grid lines are offset so that the lines pass through the centre of
        // each square.  A half-pixel offset is also added to as standard SVG
        // practice to avoid blurriness.
        var offset = Chip.SQUARE_SIZE / 2 + 0.5;
        for (var k = 0; k < Chip.ROWS; k++) {
            var h_line = document.createElementNS(Blockly.SVG_NS, 'line');
            h_line.setAttribute('y1', k * Chip.SQUARE_SIZE + offset);
            h_line.setAttribute('x2', Chip.MAZE_WIDTH);
            h_line.setAttribute('y2', k * Chip.SQUARE_SIZE + offset);
            h_line.setAttribute('stroke', Chip.SKIN.graph);
            h_line.setAttribute('stroke-width', 1);
            svg.appendChild(h_line);
        }
        for (var k = 0; k < Chip.COLS; k++) {
            var v_line = document.createElementNS(Blockly.SVG_NS, 'line');
            v_line.setAttribute('x1', k * Chip.SQUARE_SIZE + offset);
            v_line.setAttribute('x2', k * Chip.SQUARE_SIZE + offset);
            v_line.setAttribute('y2', Chip.MAZE_HEIGHT);
            v_line.setAttribute('stroke', Chip.SKIN.graph);
            v_line.setAttribute('stroke-width', 1);
            svg.appendChild(v_line);
        }
    }

    // Draw the tiles making up the maze map.

    // Return a value of '0' if the specified square is wall or out of bounds,
    // '1' otherwise (empty, start, finish).
    var normalize = function (x, y) {
        if (x < 0 || x >= Chip.COLS || y < 0 || y >= Chip.ROWS) {
            return '0';
        }
        return (Chip.map[y][x] == Chip.SquareType.WALL) ? '0' : '1';
    };

    // Compute and draw the tile for each square.
    var tileId = 0;
    for (var y = 0; y < Chip.ROWS; y++) {
        for (var x = 0; x < Chip.COLS; x++) {
            // Compute the tile index.
            var tile = normalize(x, y) +
                    normalize(x, y - 1) + // North.
                    normalize(x + 1, y) + // West.
                    normalize(x, y + 1) + // South.
                    normalize(x - 1, y);   // East.

            // Draw the tile.
            if (!Chip.tile_SHAPES[tile]) {
                // Empty square.  Use null0 for large areas, with null1-4 for borders.
                // Add some randomness to avoid large empty spaces.
                if (tile == '00000' && Math.random() > 0.3) {
                    tile = 'null0';
                } else {
                    tile = 'null' + Math.floor(1 + Math.random() * 4);
                }
            }
            var left = Chip.tile_SHAPES[tile][0];
            var top = Chip.tile_SHAPES[tile][1];
            // Tile's clipPath element.
            var tileClip = document.createElementNS(Blockly.SVG_NS, 'clipPath');
            tileClip.setAttribute('id', 'tileClipPath' + tileId);
            var clipRect = document.createElementNS(Blockly.SVG_NS, 'rect');
            clipRect.setAttribute('width', Chip.SQUARE_SIZE);
            clipRect.setAttribute('height', Chip.SQUARE_SIZE);

            clipRect.setAttribute('x', x * Chip.SQUARE_SIZE);
            clipRect.setAttribute('y', y * Chip.SQUARE_SIZE);

            tileClip.appendChild(clipRect);
            svg.appendChild(tileClip);
            // Tile sprite.
            var tile = document.createElementNS(Blockly.SVG_NS, 'image');
            tile.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
                    Chip.SKIN.tiles);
            // Position the tile sprite relative to the clipRect.
            tile.setAttribute('height', Chip.SQUARE_SIZE * 4);
            tile.setAttribute('width', Chip.SQUARE_SIZE * 5);
            tile.setAttribute('clip-path', 'url(#tileClipPath' + tileId + ')');
            tile.setAttribute('x', (x - left) * Chip.SQUARE_SIZE);
            tile.setAttribute('y', (y - top) * Chip.SQUARE_SIZE);
            svg.appendChild(tile);

            // aggiungo le icone della mondezza
            if (Chip.map[y][x] == Chip.SquareType.GARBAGE) {
                var garbageMarker = document.createElementNS(Blockly.SVG_NS, 'image');
                garbageMarker.setAttribute('id', 'garbage_' + (Chip.map.length * y + x));
                garbageMarker.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
                        Chip.SKIN.garbage);
                garbageMarker.setAttribute('height', 34);
                garbageMarker.setAttribute('width', 34);
                garbageMarker.setAttribute('x', (x + 0.2) * Chip.SQUARE_SIZE);
                garbageMarker.setAttribute('y', y * Chip.SQUARE_SIZE);
                svg.appendChild(garbageMarker);
            }
            tileId++;
        }
    }

    // Add finish marker.
    var finishMarker = document.createElementNS(Blockly.SVG_NS, 'image');
    finishMarker.setAttribute('id', 'finish');
    finishMarker.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
            Chip.SKIN.marker);
    finishMarker.setAttribute('height', 34);
    finishMarker.setAttribute('width', 20);
    svg.appendChild(finishMarker);

    // Pegman's clipPath element, whose (x, y) is reset by Chip.displayPegman
    var pegmanClip = document.createElementNS(Blockly.SVG_NS, 'clipPath');
    pegmanClip.setAttribute('id', 'pegmanClipPath');
    var clipRect = document.createElementNS(Blockly.SVG_NS, 'rect');
    clipRect.setAttribute('id', 'clipRect');
    clipRect.setAttribute('width', Chip.PEGMAN_WIDTH);
    clipRect.setAttribute('height', Chip.PEGMAN_HEIGHT);
    pegmanClip.appendChild(clipRect);
    svg.appendChild(pegmanClip);

    // Add Pegman.
    var pegmanIcon = document.createElementNS(Blockly.SVG_NS, 'image');
    pegmanIcon.setAttribute('id', 'pegman');
    pegmanIcon.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
            Chip.SKIN.sprite);
    pegmanIcon.setAttribute('height', Chip.PEGMAN_HEIGHT);
    pegmanIcon.setAttribute('width', Chip.PEGMAN_WIDTH * 21); // 49 * 21 = 1029
    pegmanIcon.setAttribute('clip-path', 'url(#pegmanClipPath)');
    svg.appendChild(pegmanIcon);
};

Chip.onInit = function () {

};

Chip.onResize = function(){
    
}

/**
 * Initialize Blockly and the maze.  Called on page load.
 */
Chip.init = function () {
    // Render the Soy template.
    document.body.innerHTML = app.soy.start({}, null,
            {lang: BlocklyGames.LANG,
                level: BlocklyGames.LEVEL,
                maxLevel: BlocklyGames.MAX_LEVEL,
                skin: Chip.SKIN_ID,
                html: BlocklyGames.IS_HTML});

    BlocklyInterface.init();

    Chip.DirectionName = [
        BlocklyGames.getMsg('Chip_dirUp'),
        BlocklyGames.getMsg('Chip_dirRight'),
        BlocklyGames.getMsg('Chip_dirDown'),
        BlocklyGames.getMsg('Chip_dirLeft')
    ];

    // Setup the Pegman menu.
    var pegmanImg = document.querySelector('#pegmanButton>img');
    pegmanImg.style.backgroundImage = 'url(' + Chip.SKIN.sprite + ')';
    var pegmanMenu = document.getElementById('pegmanMenu');
    var handlerFactory = function (n) {
        return function () {
            Chip.changePegman(n);
        };
    };
    for (var i = 0; i < Chip.SKINS.length; i++) {
        if (i == Chip.SKIN_ID) {
            continue;
        }
        var div = document.createElement('div');
        var img = document.createElement('img');
        img.src = 'common/1x1.gif';
        img.style.backgroundImage = 'url(' + Chip.SKINS[i].sprite + ')';
        div.appendChild(img);
        pegmanMenu.appendChild(div);
        Blockly.bindEvent_(div, 'mousedown', null, handlerFactory(i));
    }
    Blockly.bindEvent_(window, 'resize', null, Chip.hidePegmanMenu);
    var pegmanButton = document.getElementById('pegmanButton');
    Blockly.bindEvent_(pegmanButton, 'mousedown', null, Chip.showPegmanMenu);
    var pegmanButtonArrow = document.getElementById('pegmanButtonArrow');
    var arrow = document.createTextNode(Blockly.FieldDropdown.ARROW_CHAR);
    pegmanButtonArrow.appendChild(arrow);

    var rtl = BlocklyGames.isRtl();
    var blocklyDiv = document.getElementById('blockly');
    var visualization = document.getElementById('visualization');
    var onresize = function (e) {
        var top = visualization.offsetTop;
        blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
        blocklyDiv.style.left = rtl ? '10px' : '420px';
        blocklyDiv.style.width = (window.innerWidth - 440) + 'px';
        Chip.onResize();
    };
    window.addEventListener('scroll', function () {
        onresize();
        Blockly.svgResize(BlocklyGames.workspace);
    });
    window.addEventListener('resize', onresize);
    onresize();

    var toolbox = document.getElementById('toolbox');
    var scale = 1 + (1 - (BlocklyGames.LEVEL / BlocklyGames.MAX_LEVEL)) / 3;
    BlocklyGames.workspace = Blockly.inject('blockly',
            {'media': 'third-party/blockly/media/',
                'maxBlocks': Chip.MAX_BLOCKS,
                'rtl': rtl,
                'toolbox': toolbox,
                'trashcan': true,
                'zoom': {'startScale': scale}});
    BlocklyGames.workspace.loadAudio_(Chip.SKIN.winSound, 'win');
    BlocklyGames.workspace.loadAudio_(Chip.SKIN.crashSound, 'fail');
    // Not really needed, there are no user-defined functions or variables.
    Blockly.JavaScript.addReservedWords('moveForward,moveBackward,' +
            'turnRight,turnLeft,isPathForward,isPathRight,isPathBackward,isPathLeft');

    Chip.drawMap();

    if(!Chip.defaultXml){
        var defaultXml =
            '<xml>' +
            '  <block movable="' + (BlocklyGames.LEVEL != 1) + '" ' +
            'type="maze_moveForward" x="70" y="70"></block>' +
            '</xml>';
    }else{
        defaultXml = Chip.defaultXml;
    }
    BlocklyInterface.loadBlocks(defaultXml, false);

    // Locate the start and finish squares.
    for (var y = 0; y < Chip.ROWS; y++) {
        for (var x = 0; x < Chip.COLS; x++) {
            if (Chip.map[y][x] == Chip.SquareType.START) {
                Chip.start_ = {x: x, y: y};
            } else if (Chip.map[y][x] == Chip.SquareType.FINISH) {
                Chip.finish_ = {x: x, y: y};
            }
        }
    }

    Chip.reset(true);
    BlocklyGames.workspace.addChangeListener(function () {
        Chip.updateCapacity()
    });

    document.body.addEventListener('mousemove', Chip.updatePegSpin_, true);

    BlocklyGames.bindClick('runButton', Chip.runButtonClick);
    BlocklyGames.bindClick('resetButton', Chip.resetButtonClick);

    if (BlocklyGames.LEVEL == 1) {
        // Make connecting blocks easier for beginners.
        Blockly.SNAP_RADIUS *= 2;
    }

    if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
            BlocklyGames.LEVEL)) {
        // Level 10 gets an introductory modal dialog.
        // Skip the dialog if the user has already won.
        var content = document.getElementById('dialogInit');
        if (content != null) {
            var style = {
                'width': '30%',
                'left': '35%',
                'top': '12em'
            };
            BlocklyDialogs.showDialog(content, null, false, true, style,
                    BlocklyDialogs.stopDialogKeyDown);
            BlocklyDialogs.startDialogKeyDown();
            setTimeout(BlocklyDialogs.abortOffer, 5 * 60 * 1000);
        }
    }


    // Add the spinning Pegman icon to the done dialog.
    // <img id="pegSpin" src="common/1x1.gif">
    var buttonDiv = document.getElementById('dialogDoneButtons');
    var pegSpin = document.createElement('img');
    pegSpin.id = 'pegSpin';
    pegSpin.src = 'common/1x1.gif';
    pegSpin.style.backgroundImage = 'url(' + Chip.SKIN.sprite + ')';
    buttonDiv.parentNode.insertBefore(pegSpin, buttonDiv);

    // Lazy-load the JavaScript interpreter.
    setTimeout(BlocklyInterface.importInterpreter, 1);
    // Lazy-load the syntax-highlighting.
    setTimeout(BlocklyInterface.importPrettify, 1);

    Chip.onInit();
};



/**
 * When the workspace changes, update the help as needed.
 * @param {Blockly.Events.Abstract} opt_event Custom data for event.
 */
Chip.levelHelp = function (opt_event) {

    BlocklyDialogs.hideDialog(false);
};

/**
 * Reload with a different Pegman skin.
 * @param {number} newSkin ID of new skin.
 */
Chip.changePegman = function (newSkin) {
    Chip.saveToStorage();
    window.location = window.location.protocol + '//' +
            window.location.host + window.location.pathname +
            '?lang=' + BlocklyGames.LANG + '&level=' + BlocklyGames.LEVEL +
            '&skin=' + newSkin;
};

Chip.updateServer = function(solved){
    var xml = Blockly.Xml.workspaceToDom(BlocklyGames.workspace);
    var text = Blockly.Xml.domToText(xml);
    BlocklyGames.ajax(
                "/blockly-chip/HTML5Application/public_html/appengine/server/logger.php",
                function(){console.log('soluzione inviata');},
                "app=" + appId +
                "&level="+ BlocklyGames.LEVEL + 
                "&solved=" + (solved ? 1: 0) +
                "&solution=" + text 
        );
};

/**
 * Save the blocks for a one-time reload.
 */
Chip.saveToStorage = function () {
    // MSIE 11 does not support sessionStorage on file:// URLs.
    if (typeof Blockly != undefined && window.sessionStorage) {
        var xml = Blockly.Xml.workspaceToDom(BlocklyGames.workspace);
        var text = Blockly.Xml.domToText(xml);
        window.sessionStorage.loadOnceBlocks = text;
        
        
    }
};

/**
 * Display the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Chip.showPegmanMenu = function (e) {
    var menu = document.getElementById('pegmanMenu');
    if (menu.style.display == 'block') {
        // Menu is already open.  Close it.
        Chip.hidePegmanMenu(e);
        return;
    }
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    var button = document.getElementById('pegmanButton');
    Blockly.addClass_(button, 'buttonHover');
    menu.style.top = (button.offsetTop + button.offsetHeight) + 'px';
    menu.style.left = button.offsetLeft + 'px';
    menu.style.display = 'block';
    Chip.pegmanMenuMouse_ = Blockly.bindEvent_(document.body, 'mousedown',
            null, Chip.hidePegmanMenu);
    // Close the skin-changing hint if open.
    var hint = document.getElementById('dialogHelpSkins');
    if (hint && hint.className != 'dialogHiddenContent') {
        BlocklyDialogs.hideDialog(false);
    }
    Chip.showPegmanMenu.activatedOnce = true;
};

/**
 * Hide the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Chip.hidePegmanMenu = function (e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    document.getElementById('pegmanMenu').style.display = 'none';
    Blockly.removeClass_(document.getElementById('pegmanButton'), 'buttonHover');
    if (Chip.pegmanMenuMouse_) {
        Blockly.unbindEvent_(Chip.pegmanMenuMouse_);
        delete Chip.pegmanMenuMouse_;
    }
};


/**
 * Reset the maze to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
Chip.reset = function (first) {
    // Kill all tasks.
    for (var x = 0; x < Chip.pidList.length; x++) {
        window.clearTimeout(Chip.pidList[x]);
    }
    Chip.pidList = [];

    // Move Pegman into position.
    Chip.pegmanX = Chip.start_.x;
    Chip.pegmanY = Chip.start_.y;
    Chip.garbage = 0;
    if (first) {
        Chip.pegmanD = Chip.startDirection + 1;
        document.getElementById('direction-dsp').innerHTML = Chip.DirectionName[Chip.pegmanD];
        var minGarbage = document.getElementById('min-garbage');
        minGarbage.innerHTML = minGarbage.innerHTML.replace('%0', Chip.MIN_GARBAGE);
        Chip.scheduleFinish(false);
        Chip.pidList.push(setTimeout(function () {
            Chip.stepSpeed = 100;
            Chip.schedule([Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4],
                    [Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4 - 4]);
            Chip.pegmanD--;
            document.getElementById('direction-dsp').innerHTML = Chip.DirectionName[Chip.pegmanD];
        }, Chip.stepSpeed * 5));
    } else {
        Chip.pegmanD = Chip.startDirection;
        Chip.displayPegman(Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4);
        document.getElementById('direction-dsp').innerHTML = Chip.DirectionName[Chip.pegmanD];
    }

    // Move the finish icon into position.
    var finishIcon = document.getElementById('finish');
    finishIcon.setAttribute('x', Chip.SQUARE_SIZE * (Chip.finish_.x + 0.5) -
            finishIcon.getAttribute('width') / 2);
    finishIcon.setAttribute('y', Chip.SQUARE_SIZE * (Chip.finish_.y + 0.6) -
            finishIcon.getAttribute('height'));

    // Make 'look' icon invisible and promote to top.
    var lookIcon = document.getElementById('look');
    lookIcon.style.display = 'none';
    lookIcon.parentNode.appendChild(lookIcon);
    var paths = lookIcon.getElementsByTagName('path');
    for (var i = 0, path; path = paths[i]; i++) {
        path.setAttribute('stroke', Chip.SKIN.look);
    }
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Chip.runButtonClick = function (e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    BlocklyDialogs.hideDialog(false);
    // Only allow a single top block on level 1.
    if (BlocklyGames.LEVEL == 1 &&
            BlocklyGames.workspace.getTopBlocks().length > 1 &&
            Chip.result != Chip.ResultType.SUCCESS &&
            !BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                    BlocklyGames.LEVEL)) {
        Chip.levelHelp();
        return;
    }
    var runButton = document.getElementById('runButton');
    var resetButton = document.getElementById('resetButton');
    // Ensure that Reset button is at least as wide as Run button.
    if (!resetButton.style.minWidth) {
        resetButton.style.minWidth = runButton.offsetWidth + 'px';
    }
    runButton.style.display = 'none';
    resetButton.style.display = 'block';
    runButton.style.margin = 'auto';
    resetButton.style.margin = 'auto';
    BlocklyGames.workspace.traceOn(true);
    Chip.reset(false);
    Chip.execute();
};

/**
 * Updates the document's 'capacity' element with a message
 * indicating how many more blocks are permitted.  The capacity
 * is retrieved from BlocklyGames.workspace.remainingCapacity().
 */
Chip.updateCapacity = function () {
    var cap = BlocklyGames.workspace.remainingCapacity();
    var p = document.getElementById('capacity');
    if (cap == Infinity) {
        p.style.display = 'none';
    } else {
        p.style.display = 'inline';
        p.innerHTML = '';
        cap = Number(cap);
        var capSpan = document.createElement('span');
        capSpan.className = 'capacityNumber';
        capSpan.appendChild(document.createTextNode(cap));
        if (cap == 0) {
            var msg = BlocklyGames.getMsg('Chip_capacity0');
        } else if (cap == 1) {
            var msg = BlocklyGames.getMsg('Chip_capacity1');
        } else {
            var msg = BlocklyGames.getMsg('Chip_capacity2');
        }
        var parts = msg.split(/%\d/);
        for (var i = 0; i < parts.length; i++) {
            p.appendChild(document.createTextNode(parts[i]));
            if (i != parts.length - 1) {
                p.appendChild(capSpan.cloneNode(true));
            }
        }
    }
};

/**
 * Click the reset button.  Reset the maze.
 * @param {!Event} e Mouse or touch event.
 */
Chip.resetButtonClick = function (e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    var runButton = document.getElementById('runButton');
    runButton.style.display = 'block';
    document.getElementById('resetButton').style.display = 'none';

    // put garbage back again
    for (var y = 0; y < Chip.ROWS; y++) {
        for (var x = 0; x < Chip.COLS; x++) {
            if (Chip.map[y][x] == Chip.SquareType.GARBAGE || Chip.map[y][x] == Chip.SquareType.COLLECTED) {
                var garbageMarker = document.getElementById('garbage_' + (Chip.map.length * y + x));
                garbageMarker.style.display = 'inline';
                Chip.map[y][x] = Chip.SquareType.GARBAGE;
            }
        }
    }
    BlocklyGames.workspace.traceOn(false);
    Chip.reset(false);
    document.getElementById('garbage-cnt').innerHTML = '' + Chip.garbage;
    Chip.levelHelp();
};

/**
 * Inject the Chip API into a JavaScript interpreter.
 * @param {!Object} scope Global scope.
 * @param {!Interpreter} interpreter The JS interpreter.
 */
Chip.initInterpreter = function (interpreter, scope) {
    // API
    var wrapper;

    // [davide] chip instruction set
    wrapper = function (id) {
        Chip.collect(id.toString());
    };
    interpreter.setProperty(scope, 'collect',
            interpreter.createNativeFunction(wrapper));

    // end chip instruction set 

    wrapper = function (id) {
        Chip.move(0, id.toString());
    };
    interpreter.setProperty(scope, 'moveForward',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        Chip.move(2, id.toString());
    };
    interpreter.setProperty(scope, 'moveBackward',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        Chip.turn(Chip.constrainDirection4(Chip.pegmanD - 1), id.toString());
    };
    interpreter.setProperty(scope, 'rotateLeft',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        Chip.turn(Chip.constrainDirection4(Chip.pegmanD + 1), id.toString());
    };
    interpreter.setProperty(scope, 'rotateRight',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        Chip.turn(Chip.DirectionType.WEST, id.toString());
    };
    interpreter.setProperty(scope, 'turnLeft',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        Chip.turn(Chip.DirectionType.EAST, id.toString());
    };
    interpreter.setProperty(scope, 'turnRight',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        Chip.turn(Chip.DirectionType.NORTH, id.toString());
    };
    interpreter.setProperty(scope, 'turnUp',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        Chip.turn(Chip.DirectionType.SOUTH, id.toString());
    };
    interpreter.setProperty(scope, 'turnDown',
            interpreter.createNativeFunction(wrapper));
            
    // movement conditions 
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.DirectionType.EAST, id.toString()));
    };
    interpreter.setProperty(scope, 'isPathRight',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.DirectionType.NORTH, id.toString()));
    };
    interpreter.setProperty(scope, 'isPathUp',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.DirectionType.WEST, id.toString()));
    };
    interpreter.setProperty(scope, 'isPathLeft',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.DirectionType.SOUTH, id.toString()));
    };
    interpreter.setProperty(scope, 'isPathDown',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.pegmanD, id.toString()));
    };
    interpreter.setProperty(scope, 'isPathForward',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.constrainDirection4(Chip.pegmanD + 2), id.toString()));
    };
    interpreter.setProperty(scope, 'isPathBack',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.constrainDirection4(Chip.pegmanD + 1), id.toString()));
    };
    interpreter.setProperty(scope, 'isPathOnRight',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isPath(Chip.constrainDirection4(Chip.pegmanD - 1), id.toString()));
    };
    interpreter.setProperty(scope, 'isPathOnLeft',
            interpreter.createNativeFunction(wrapper));
    
    // garbage conditions
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.DirectionType.HERE, id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageHere',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.DirectionType.EAST, id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageRight',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.DirectionType.NORTH, id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageUp',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.DirectionType.WEST, id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageLeft',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.DirectionType.SOUTH, id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageDown',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.pegmanD, id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageForward',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.constrainDirection4(Chip.pegmanD + 2), id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageBack',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.constrainDirection4(Chip.pegmanD + 1), id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageOnRight',
            interpreter.createNativeFunction(wrapper));
    wrapper = function (id) {
        return interpreter.createPrimitive(Chip.isGarbage(Chip.constrainDirection4(Chip.pegmanD - 1), id.toString()));
    };
    interpreter.setProperty(scope, 'isGarbageOnLeft',
            interpreter.createNativeFunction(wrapper));
    
    // end program
    wrapper = function () {
        return interpreter.createPrimitive(Chip.notDone());
    };
    interpreter.setProperty(scope, 'notDone',
            interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Chip.execute = function () {
    if (!('Interpreter' in window)) {
        // Interpreter lazy loads and hasn't arrived yet.  Try again later.
        setTimeout(Chip.execute, 250);
        return;
    }

    Chip.log = [];
    var code = Blockly.JavaScript.workspaceToCode(BlocklyGames.workspace);
    Chip.result = Chip.ResultType.UNSET;
    var interpreter = new Interpreter(code, Chip.initInterpreter);

    // Try running the user's code.  There are four possible outcomes:
    // 1. If pegman reaches the finish [SUCCESS], true is thrown.
    // 2. If the program is terminated due to running too long [TIMEOUT],
    //    false is thrown.
    // 3. If another error occurs [ERROR], that error is thrown.
    // 4. If the program ended normally but without solving the maze [FAILURE],
    //    no error or exception is thrown.
    try {
        var ticks = 10000;  // 10k ticks runs Pegman for about 8 minutes.
        while (interpreter.step()) {
            if (ticks-- == 0) {
                throw Infinity;
            }
        }
        Chip.result = Chip.notDone() ?
                Chip.ResultType.FAILURE : Chip.ResultType.SUCCESS;
    } catch (e) {
        // A boolean is thrown for normal termination.
        // Abnormal termination is a user error.
        if (e === Infinity) {
            Chip.result = Chip.ResultType.TIMEOUT;
        } else if (e === false) {
            Chip.result = Chip.ResultType.ERROR;
        } else if (e === true) {
            Chip.result = Chip.ResultType.SUCCESS;
        } else {
            // Syntax error, can't happen.
            Chip.result = Chip.ResultType.ERROR;
            alert(e);
        }
    }

    Chip.updateServer(Chip.result == Chip.ResultType.SUCCESS);
    // Fast animation if execution is successful.  Slow otherwise.
    if (Chip.result == Chip.ResultType.SUCCESS) {
        Chip.stepSpeed = 100;
        Chip.log.push(['finish', null]);
    } else {
        Chip.stepSpeed = 150;
    }

    // Chip.log now contains a transcript of all the user's actions.
    // Reset the maze and animate the transcript.
    Chip.reset(false);
    Chip.pidList.push(setTimeout(Chip.animate, 100));
};

/**
 * Iterate through the recorded path and animate pegman's actions.
 */
Chip.animate = function () {
    var action = Chip.log.shift();
    if (!action) {
        BlocklyInterface.highlight(null);
        Chip.levelHelp();
        return;
    }
    BlocklyInterface.highlight(action[1]);

    switch (action[0]) {
        case 'north':
            Chip.schedule([Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4],
                    [Chip.pegmanX, Chip.pegmanY - 1, Chip.pegmanD * 4]);
            Chip.pegmanY--;
            break;
        case 'east':
            Chip.schedule([Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4],
                    [Chip.pegmanX + 1, Chip.pegmanY, Chip.pegmanD * 4]);
            Chip.pegmanX++;
            break;
        case 'south':
            Chip.schedule([Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4],
                    [Chip.pegmanX, Chip.pegmanY + 1, Chip.pegmanD * 4]);
            Chip.pegmanY++;
            break;
        case 'west':
            Chip.schedule([Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4],
                    [Chip.pegmanX - 1, Chip.pegmanY, Chip.pegmanD * 4]);
            Chip.pegmanX--;
            break;
        case 'look_here':
            Chip.scheduleLook(Chip.DirectionType.HERE, action[2]);
            break;
        case 'look_north':
            Chip.scheduleLook(Chip.DirectionType.NORTH, action[2]);
            break;
        case 'look_east':
            Chip.scheduleLook(Chip.DirectionType.EAST, action[2]);
            break;
        case 'look_south':
            Chip.scheduleLook(Chip.DirectionType.SOUTH, action[2]);
            break;
        case 'look_west':
            Chip.scheduleLook(Chip.DirectionType.WEST, action[2]);
            break;
        case 'fail_forward':
            Chip.scheduleFail(true);
            break;
        case 'fail_backward':
            Chip.scheduleFail(false);
            break;
        case 'left':
            Chip.schedule([Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4],
                    [Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4 - 4]);
            Chip.pegmanD = Chip.constrainDirection4(Chip.pegmanD - 1);
            break;
        case 'right':
            Chip.schedule([Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4],
                    [Chip.pegmanX, Chip.pegmanY, Chip.pegmanD * 4 + 4]);
            Chip.pegmanD = Chip.constrainDirection4(Chip.pegmanD + 1);
            break;
        case 'finish':
            Chip.scheduleFinish(true);
            BlocklyInterface.saveToLocalStorage();
            setTimeout(BlocklyDialogs.congratulations, 1000);
            break;
        case 'update_direction':
            Chip.scheduleVariableUpdate('direction-dsp', Chip.DirectionName[action[2]]);
            break;
        case 'update_garbage':
            Chip.scheduleVariableUpdate('garbage-cnt', action[2]);
            Chip.scheduleFinish(false);
            Chip.scheduleGarbageCollection('garbage_' + (action[4] * Chip.map.length + action[3]));
            Chip.map[action[4]][action[3]] = Chip.SquareType.COLLECTED;
            break;
        case 'showlowgarbage':
            var content = document.getElementById('dialogLowGarbage');
            content.innerHTML = content.innerHTML.replace("%0", Chip.MIN_GARBAGE);
            var style = {
                'width': '30%',
                'left': '35%',
                'top': '12em'
            };
            BlocklyDialogs.showDialog(content, null, true, true, style,
                    BlocklyDialogs.stopDialogKeyDown);
            BlocklyDialogs.startDialogKeyDown();
            setTimeout(BlocklyDialogs.abortOffer, 5 * 60 * 1000);
            break;
    }

    Chip.pidList.push(setTimeout(Chip.animate, Chip.stepSpeed * 5));
};

/**
 * Point the congratulations Pegman to face the mouse.
 * @param {Event} e Mouse move event.
 * @private
 */
Chip.updatePegSpin_ = function (e) {
    if (document.getElementById('dialogDone').className ==
            'dialogHiddenContent') {
        return;
    }
    var pegSpin = document.getElementById('pegSpin');
    var bBox = BlocklyDialogs.getBBox_(pegSpin);
    var x = bBox.x + bBox.width / 2 - window.pageXOffset;
    var y = bBox.y + bBox.height / 2 - window.pageYOffset;
    var dx = e.clientX - x;
    var dy = e.clientY - y;
    var angle = Math.atan(dy / dx);
    // Convert from radians to degrees because I suck at math.
    angle = angle / Math.PI * 180;
    // 0: North, 90: East, 180: South, 270: West.
    if (dx > 0) {
        angle += 90;
    } else {
        angle += 270;
    }
    // Divide into 16 quads.
    var quad = Math.round(angle / 360 * 16);
    if (quad == 16) {
        quad = 15;
    }
    // Display correct Pegman sprite.
    pegSpin.style.backgroundPosition = (-quad * Chip.PEGMAN_WIDTH) + 'px 0px';
};


Chip.scheduleVariableUpdate = function (elementId, value) {
    Chip.pidList.push(setTimeout(function () {
        var directionDsp = document.getElementById(elementId);
        directionDsp.innerHTML = '' + value;
        directionDsp.style.backgroundColor = 'gold';
    }, Chip.stepSpeed * 1));
    Chip.pidList.push(setTimeout(function () {
        var directionDsp = document.getElementById(elementId);
        directionDsp.style.backgroundColor = 'white';
    }, Chip.stepSpeed * 3));
}

Chip.scheduleGarbageCollection = function (elementId) {
    Chip.pidList.push(setTimeout(function () {
        var bag = document.getElementById(elementId);
        bag.style.display = 'none';
    }, Chip.stepSpeed * 1));
}

/**
 * Schedule the animations for a move or turn.
 * @param {!Array.<number>} startPos X, Y and direction starting points.
 * @param {!Array.<number>} endPos X, Y and direction ending points.
 */
Chip.schedule = function (startPos, endPos) {
    var deltas = [(endPos[0] - startPos[0]) / 4,
        (endPos[1] - startPos[1]) / 4,
        (endPos[2] - startPos[2]) / 4];
    Chip.displayPegman(startPos[0] + deltas[0],
            startPos[1] + deltas[1],
            Chip.constrainDirection16(startPos[2] + deltas[2]));
    Chip.pidList.push(setTimeout(function () {
        Chip.displayPegman(startPos[0] + deltas[0] * 2,
                startPos[1] + deltas[1] * 2,
                Chip.constrainDirection16(startPos[2] + deltas[2] * 2));
    }, Chip.stepSpeed));
    Chip.pidList.push(setTimeout(function () {
        Chip.displayPegman(startPos[0] + deltas[0] * 3,
                startPos[1] + deltas[1] * 3,
                Chip.constrainDirection16(startPos[2] + deltas[2] * 3));
    }, Chip.stepSpeed * 2));
    Chip.pidList.push(setTimeout(function () {
        Chip.displayPegman(endPos[0], endPos[1],
                Chip.constrainDirection16(endPos[2]));
    }, Chip.stepSpeed * 3));
};

/**
 * Schedule the animations and sounds for a failed move.
 * @param {boolean} forward True if forward, false if backward.
 */
Chip.scheduleFail = function (forward) {
    var deltaX = 0;
    var deltaY = 0;
    switch (Chip.pegmanD) {
        case Chip.DirectionType.NORTH:
            deltaY = -1;
            break;
        case Chip.DirectionType.EAST:
            deltaX = 1;
            break;
        case Chip.DirectionType.SOUTH:
            deltaY = 1;
            break;
        case Chip.DirectionType.WEST:
            deltaX = -1;
            break;
    }
    if (!forward) {
        deltaX = -deltaX;
        deltaY = -deltaY;
    }
    if (Chip.SKIN.crashType == Chip.CRASH_STOP) {
        // Bounce bounce.
        deltaX /= 4;
        deltaY /= 4;
        var direction16 = Chip.constrainDirection16(Chip.pegmanD * 4);
        Chip.displayPegman(Chip.pegmanX + deltaX,
                Chip.pegmanY + deltaY,
                direction16);
        BlocklyGames.workspace.playAudio('fail', 0.5);
        Chip.pidList.push(setTimeout(function () {
            Chip.displayPegman(Chip.pegmanX,
                    Chip.pegmanY,
                    direction16);
        }, Chip.stepSpeed));
        Chip.pidList.push(setTimeout(function () {
            Chip.displayPegman(Chip.pegmanX + deltaX,
                    Chip.pegmanY + deltaY,
                    direction16);
            BlocklyGames.workspace.playAudio('fail', 0.5);
        }, Chip.stepSpeed * 2));
        Chip.pidList.push(setTimeout(function () {
            Chip.displayPegman(Chip.pegmanX, Chip.pegmanY, direction16);
        }, Chip.stepSpeed * 3));
    } else {
        // Add a small random delta away from the grid.
        var deltaZ = (Math.random() - 0.5) * 10;
        var deltaD = (Math.random() - 0.5) / 2;
        deltaX += (Math.random() - 0.5) / 4;
        deltaY += (Math.random() - 0.5) / 4;
        deltaX /= 8;
        deltaY /= 8;
        var acceleration = 0;
        if (Chip.SKIN.crashType == Chip.CRASH_FALL) {
            acceleration = 0.01;
        }
        Chip.pidList.push(setTimeout(function () {
            BlocklyGames.workspace.playAudio('fail', 0.5);
        }, Chip.stepSpeed * 2));
        var setPosition = function (n) {
            return function () {
                var direction16 = Chip.constrainDirection16(Chip.pegmanD * 4 +
                        deltaD * n);
                Chip.displayPegman(Chip.pegmanX + deltaX * n,
                        Chip.pegmanY + deltaY * n,
                        direction16,
                        deltaZ * n);
                deltaY += acceleration;
            };
        };
        // 100 frames should get Pegman offscreen.
        for (var i = 1; i < 100; i++) {
            Chip.pidList.push(setTimeout(setPosition(i),
                    Chip.stepSpeed * i / 2));
        }
    }
};

/**
 * Schedule the animations and sound for a victory dance.
 * @param {boolean} sound Play the victory sound.
 */
Chip.scheduleFinish = function (sound) {
    var direction16 = Chip.constrainDirection16(Chip.pegmanD * 4);
    Chip.displayPegman(Chip.pegmanX, Chip.pegmanY, 16);
    if (sound) {
        BlocklyGames.workspace.playAudio('win', 0.5);
    }
    Chip.stepSpeed = 150;  // Slow down victory animation a bit.
    Chip.pidList.push(setTimeout(function () {
        Chip.displayPegman(Chip.pegmanX, Chip.pegmanY, 18);
    }, Chip.stepSpeed));
    Chip.pidList.push(setTimeout(function () {
        Chip.displayPegman(Chip.pegmanX, Chip.pegmanY, 16);
    }, Chip.stepSpeed * 2));
    Chip.pidList.push(setTimeout(function () {
        Chip.displayPegman(Chip.pegmanX, Chip.pegmanY, direction16);
    }, Chip.stepSpeed * 3));
};

/**
 * Display Pegman at the specified location, facing the specified direction.
 * @param {number} x Horizontal grid (or fraction thereof).
 * @param {number} y Vertical grid (or fraction thereof).
 * @param {number} d Direction (0 - 15) or dance (16 - 17).
 * @param {number} opt_angle Optional angle (in degrees) to rotate Pegman.
 */
Chip.displayPegman = function (x, y, d, opt_angle) {
    var pegmanIcon = document.getElementById('pegman');
    pegmanIcon.setAttribute('x',
            x * Chip.SQUARE_SIZE - d * Chip.PEGMAN_WIDTH + 1);
    pegmanIcon.setAttribute('y',
            Chip.SQUARE_SIZE * (y + 0.5) - Chip.PEGMAN_HEIGHT / 2 - 8);
    if (opt_angle) {
        pegmanIcon.setAttribute('transform', 'rotate(' + opt_angle + ', ' +
                (x * Chip.SQUARE_SIZE + Chip.SQUARE_SIZE / 2) + ', ' +
                (y * Chip.SQUARE_SIZE + Chip.SQUARE_SIZE / 2) + ')');
    } else {
        pegmanIcon.setAttribute('transform', 'rotate(0, 0, 0)');
    }

    var clipRect = document.getElementById('clipRect');
    clipRect.setAttribute('x', x * Chip.SQUARE_SIZE + 1);
    clipRect.setAttribute('y', pegmanIcon.getAttribute('y'));
};

/**
 * Display the look icon at Pegman's current location,
 * in the specified direction.
 * @param {!Chip.DirectionType} d Direction (0 - 3).
 */
Chip.scheduleLook = function (d, color) {
    var x = Chip.pegmanX;
    var y = Chip.pegmanY;
    var id = 'look';
    var tagName = 'path';
    switch (d) {
        case Chip.DirectionType.HERE:
            // shows the ray on the same square
            y += 1;
            x += 0.5;
            tagName = 'circle';
            break;
        case Chip.DirectionType.NORTH:
            x += 0.5;
            break;
        case Chip.DirectionType.EAST:
            x += 1;
            y += 0.5;
            break;
        case Chip.DirectionType.SOUTH:
            x += 0.5;
            y += 1;
            break;
        case Chip.DirectionType.WEST:
            y += 0.5;
            break;
    }
    x *= Chip.SQUARE_SIZE;
    y *= Chip.SQUARE_SIZE;
    d = d * 90 - 45;

    var lookIcon = document.getElementById(id);
    lookIcon.setAttribute('transform',
            'translate(' + x + ', ' + y + ') ' +
            'rotate(' + d + ' 0 0) scale(.4)');
    var paths = lookIcon.getElementsByTagName(tagName);
    lookIcon.style.display = 'inline';
    for (var x = 0, path; path = paths[x]; x++) {
        path.style.stroke = color;
        Chip.scheduleLookStep(path, Chip.stepSpeed * x);
    }
};

/**
 * Schedule one of the 'look' icon's waves to appear, then disappear.
 * @param {!Element} path Element to make appear.
 * @param {number} delay Milliseconds to wait before making wave appear.
 */
Chip.scheduleLookStep = function (path, delay) {
    Chip.pidList.push(setTimeout(function () {
        path.style.display = 'inline';
        setTimeout(function () {
            path.style.display = 'none';
        }, Chip.stepSpeed * 2);
    }, delay));
};

/**
 * Keep the direction within 0-3, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Chip.constrainDirection4 = function (d) {
    d = Math.round(d) % 4;
    if (d < 0) {
        d += 4;
    }
    return d;
};

/**
 * Keep the direction within 0-15, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Chip.constrainDirection16 = function (d) {
    d = Math.round(d) % 16;
    if (d < 0) {
        d += 16;
    }
    return d;
};

Chip.collect = function (id) {
    if (Chip.map[Chip.pegmanY][Chip.pegmanX] !== Chip.SquareType.GARBAGE) {
        Chip.log.push(['fail_forward', id]);
        throw false;
    }

    Chip.garbage++;
    Chip.map[Chip.pegmanY][Chip.pegmanX] = Chip.SquareType.COLLECTED;
    Chip.log.push(['update_garbage', id, Chip.garbage, Chip.pegmanX, Chip.pegmanY]);
}


// Core functions.

/**
 * Attempt to move pegman forward or backward.
 * @param {number} direction Direction to move (0 = forward, 2 = backward).
 * @param {string} id ID of block that triggered this action.
 * @throws {true} If the end of the maze is reached.
 * @throws {false} If Pegman collides with a wall.
 */
Chip.move = function (direction, id) {
    var error = 0;


    if (Chip.map[Chip.pegmanY][Chip.pegmanX] === Chip.SquareType.FINISH) {
        if (Chip.garbage < Chip.MIN_GARBAGE) {
            error = true;
            Chip.log.push(['fail_' + (direction ? 'backward' : 'forward'), id]);
            Chip.log.push(['showlowgarbage', id]);
        } else {
            Chip.log.push(['finish', id]);
            throw true;
        }
    } else {
        if (!Chip.isPath(Chip.pegmanD, null)) {
            error = true;
            Chip.log.push(['fail_' + (direction ? 'backward' : 'forward'), id]);
        }
    }

    if (error) {
        throw false;
    }

    // If moving backward, flip the effective direction.
    var effectiveDirection = Chip.pegmanD + direction;
    var command;
    switch (Chip.constrainDirection4(effectiveDirection)) {
        case Chip.DirectionType.NORTH:
            Chip.pegmanY--;
            command = 'north';
            break;
        case Chip.DirectionType.EAST:
            Chip.pegmanX++;
            command = 'east';
            break;
        case Chip.DirectionType.SOUTH:
            Chip.pegmanY++;
            command = 'south';
            break;
        case Chip.DirectionType.WEST:
            Chip.pegmanX--;
            command = 'west';
            break;
    }
    Chip.log.push([command, id]);

};

/**
 * Turn pegman north, south, est or west
 * @param {number} direction Direction to turn (0 = left, 1 = right).
 * @param {string} id ID of block that triggered this action.
 */
Chip.turn = function (direction, id) {
    var steps = Chip.pegmanD - direction;
    if (steps < 0) {
        for (var i = 0; i < -steps; i++) {
            // Right turn (clockwise).
            //Chip.pegmanD--;
            Chip.log.push(['right', id, ]);
        }
    } else {
        for (var i = 0; i < steps; i++) {
            // Left turn (counterclockwise).
            //Chip.pegmanD++;
            Chip.log.push(['left', id]);
        }
    }
    Chip.pegmanD = direction;
    Chip.log.push(['update_direction', id, direction]);
};

/**
 * Is there a path next to pegman?
 * @param {number} direction Direction to look
 *     (0 = forward, 1 = right, 2 = backward, 3 = left).
 * @param {?string} id ID of block that triggered this action.
 *     Null if called as a helper function in Chip.move().
 * @return {boolean} True if there is a path.
 */
Chip.isPath = function (direction, id) {
    //var effectiveDirection = Chip.pegmanD + direction;
    var effectiveDirection = direction;
    var square;
    var command;
    switch (effectiveDirection) {
        case Chip.DirectionType.NORTH:
            square = Chip.map[Chip.pegmanY - 1] &&
                    Chip.map[Chip.pegmanY - 1][Chip.pegmanX];
            command = 'look_north';
            break;
        case Chip.DirectionType.EAST:
            square = Chip.map[Chip.pegmanY][Chip.pegmanX + 1];
            command = 'look_east';
            break;
        case Chip.DirectionType.SOUTH:
            square = Chip.map[Chip.pegmanY + 1] &&
                    Chip.map[Chip.pegmanY + 1][Chip.pegmanX];
            command = 'look_south';
            break;
        case Chip.DirectionType.WEST:
            square = Chip.map[Chip.pegmanY][Chip.pegmanX - 1];
            command = 'look_west';
            break;
    }
    if (id) {
        Chip.log.push([command, id, '#182655']);
    }
    return square !== Chip.SquareType.WALL && square !== undefined;
};

Chip.isGarbage = function (direction, id) {
    var effectiveDirection = direction;
    var square;
    var command;
    switch (effectiveDirection) {
        case Chip.DirectionType.HERE:
            square = Chip.map[Chip.pegmanY] &&
                    Chip.map[Chip.pegmanY][Chip.pegmanX];
            command = 'look_here';
            break;
        case Chip.DirectionType.NORTH:
            square = Chip.map[Chip.pegmanY - 1] &&
                    Chip.map[Chip.pegmanY - 1][Chip.pegmanX];
            command = 'look_north';
            break;
        case Chip.DirectionType.EAST:
            square = Chip.map[Chip.pegmanY][Chip.pegmanX + 1];
            command = 'look_east';
            break;
        case Chip.DirectionType.SOUTH:
            square = Chip.map[Chip.pegmanY + 1] &&
                    Chip.map[Chip.pegmanY + 1][Chip.pegmanX];
            command = 'look_south';
            break;
        case Chip.DirectionType.WEST:
            square = Chip.map[Chip.pegmanY][Chip.pegmanX - 1];
            command = 'look_west';
            break;
    }
    if (id) {
        Chip.log.push([command, id, '#dd4b39']);
    }
    return square == Chip.SquareType.GARBAGE && square !== undefined;
};

/**
 * Is the player at the finish marker?
 * @return {boolean} True if not done, false if done.
 */
Chip.notDone = function () {
    return Chip.pegmanX != Chip.finish_.x ||
            Chip.pegmanY != Chip.finish_.y ||
            Chip.garbage < Chip.MIN_GARBAGE;
};


