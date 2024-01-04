'use strict';

//---------------------------------------------------------------------------
// CONSTANTS
//---------------------------------------------------------------------------

const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 800;
//console.log(screen.width);
const WINDOW_SCREEN_DIFFERENCE = (screen.width/2)-(SCREEN_WIDTH/2) - 9;
//console.log("diff " + WINDOW_SCREEN_DIFFERENCE);
const TILE_WIDTH = 130; // 390/3 so 10 pixels of border
const TILE_HEIGHT = 130; // 780/6 so 20 pixels of border
const HORIZONTAL_MARGIN = 5;
const VERTICAL_MARGIN = 10;
//---------------------------------------------------------------------------
// GLOBALS
//---------------------------------------------------------------------------
var canvas;
var ctx;

var board = Array(18);
var pieces = [];
var playerColour;
var playersTurn = false;
var pieceSelectedNumber = -1;
var pieceSelectedMoves = [];
var gameStarted = false;
var counter = 0;
var oldTimeStamp = 0;
var movingPieceNumber = -1;

//---------------------------------------------------------------------------
// INTERRUPTS
//---------------------------------------------------------------------------
document.addEventListener("mousedown", event => {
    //console.log(screen.width);
    //console.log("x " + (event.clientX-WINDOW_SCREEN_DIFFERENCE) + " y " + event.clientY);
    //console.log("clientx " + (event.clientX) + " clienty " + event.clientY);
    //let cheese = document.getElementById("game").style.margin;
    //console.log(cheese);
    if(!gameStarted){
        gameStarted = true;
        //createWorld();
        drawScreen();
        runGame(0);
    }
    if(gameStarted && playersTurn && movingPieceNumber == -1){
        if(pieceSelectedNumber == -1){
            for(let i = 0; i < board.length; i++){
                if(clickingTile(i, event.clientX-WINDOW_SCREEN_DIFFERENCE, event.clientY) && board[i].piece != null){
                    //console.log("clicking " + i);
                    //console.log("x " + (event.clientX-WINDOW_SCREEN_DIFFERENCE) + " y " + event.clientY);
                    if(pieces[board[i].piece].colour == playerColour){
                        pieceSelectedNumber = board[i].piece;
                        //console.log("clicking tile " + i + ". Piece: " + pieces[board[i].piece].type);
                        pieceSelectedMoves = viableMoves(pieceSelectedNumber, playerColour);
                        // for(let i = 0; i < board.length; i++){
                        //     if(board[i].piece != null) console.log("board " + i + ": " + pieces[board[i].piece].colour + " " + pieces[board[i].piece].type + " #" + board[i].piece);
                        // }
                    }
                }
             }
        }else{
            for(let i = 0; i < board.length; i++){
                if(clickingTile(i, event.clientX-WINDOW_SCREEN_DIFFERENCE, event.clientY)){
                    if(board[i].piece != null && board[i].piece == pieceSelectedNumber){
                        pieceSelectedNumber = -1;
                        drawScreen();
                    }else{
                        for(let m = 0; m < pieceSelectedMoves.length; m++){
                            if(pieceSelectedMoves[m] == i){
                                if(board[i].piece != null){
                                    if(pieceSelectedNumber >= board[i].piece) pieceSelectedNumber -= 1;
                                    removePiece(i);
                                }
                                let selectedTile = findPieceTile(pieceSelectedNumber);
                                board[selectedTile].piece = null;
                                board[i].piece = pieceSelectedNumber;
                                movingPieceNumber = pieceSelectedNumber;
                                pieceSelectedNumber = -1;
                            }
                        }
                    }
                }
            }
        }
    }
});



//---------------------------------------------------------------------------
// CLASS Tile
//---------------------------------------------------------------------------
class Tile{
    constructor(left, top, width, height, colour){
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.image = null;
        this.status = "empty";
        this.piece = null;
        this.colour = colour;
        this.createImage();
    }
    getColour(){ return this.colour; }
    setImage(image){ this.image = image; }
    setColour(colour){ this.colour = colour; }
    createImage(){
        if(this.colour == "white"){
            this.image = new Image(500, 500);
            this.image.src = "Beige Tile.png";
        }else if(this.colour == "black"){
            this.image = new Image(500, 500);
            this.image.src = "Brown Tile.png";
        }
    }
    draw(){
        ctx.drawImage(
            this.image,                 //actually spritesheet
            0, 0, //start of current sprite (x, y) on spritesheet
            500, 500,  //width, height(on spritesheet)
            this.left, //x position of sprite on canvas
            this.top, //y position of sprite on canvas
            TILE_WIDTH, //width on canvas (stretched to fit)
            TILE_HEIGHT, //height on canvas (stretched to fit)
        );
    }
}

//---------------------------------------------------------------------------
// CLASS Piece
//---------------------------------------------------------------------------
class Piece{
    constructor(left, top, width, height, colour, type){
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.image = null;
        this.type = type;
        this.colour = colour;
        //this.tile = null;
        this.selected = false;
        this.createImage();
    }
    setImage(image){ this.image = image; }
    getType(){ return this.type; }
    getColour(){ return this.colour; }
    setType(type){ this.type = type; }
    createImage(){
        if(this.type == "king" && this.colour == "white"){
            this.image = new Image(500, 500);
            this.image.src = "White King.png";
        }else if(this.type == "king" && this.colour == "black"){
            this.image = new Image(500, 500);
            this.image.src = "Black King.png";
        }else if(this.type == "knight" && this.colour == "white"){
            this.image = new Image(500, 500);
            this.image.src = "White Knight.png";
        }else if(this.type == "knight" && this.colour == "black"){
            this.image = new Image(500, 500);
            this.image.src = "Black Knight.png";
        }else if(this.type == "pawn" && this.colour == "white"){
            this.image = new Image(500, 500);
            this.image.src = "White Pawn.png";
        }else if(this.type == "pawn" && this.colour == "black"){
            this.image = new Image(500, 500);
            this.image.src = "Black Pawn.png";
        }
    }
    draw(){
        ctx.drawImage(
            this.image,                 //actually spritesheet
            0, 0, //start of current sprite (x, y) on spritesheet
            500, 500,  //width, height(on spritesheet)
            this.left, //x position of sprite on canvas
            this.top, //y position of sprite on canvas
            TILE_WIDTH, //width on canvas (stretched to fit)
            TILE_HEIGHT, //height on canvas (stretched to fit)
        );
    }
}


//---------------------------------------------------------------------------
// ACTUAL GAME
//---------------------------------------------------------------------------

function setUp(){
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
}

function createWorld(){
    let left = HORIZONTAL_MARGIN;
    let top = VERTICAL_MARGIN;
    playerColour = findPieceColour();
    let colour = playerColour;
    for(let i = 0; i < board.length; i++){
        board[i] = new Tile(left, top, TILE_WIDTH, TILE_HEIGHT, colour);
        makePiece(i, left, top, playerColour);
        if(left >= SCREEN_WIDTH - (HORIZONTAL_MARGIN) - TILE_WIDTH){
            left = HORIZONTAL_MARGIN;
            top += TILE_HEIGHT;
        }else{ left += TILE_WIDTH; }
        colour = swapColour(colour);
    }

    // board[9].piece = board[12].piece;
    // board[12].piece = null;
    // movingPieceNumber = board[9].piece;
    //console.log("pieces 9: " + pieces[9].left + " " + pieces[9].top);
    if(playerColour == "white") playersTurn = true;
}

function runGame(timeStamp){
    let currentTime = timeStamp;
    let secondsPassed = timeStamp - oldTimeStamp;
    oldTimeStamp = currentTime;
    counter += secondsPassed;
    if(movingPieceNumber != -1) movePieces(secondsPassed);
    if(counter >= 1000){
        //console.log("Second");
        counter = 0;
    }
    if(movingPieceNumber != -1 || pieceSelectedNumber != -1) drawScreen();
    window.requestAnimationFrame(runGame);
}

function drawScreen(){
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = "gray";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    for(let i = 0; i < board.length; i++){
        board[i].draw();
    }
    if(pieceSelectedNumber != -1) showAvailableMoves(pieceSelectedNumber);
    for(let i = 0; i < pieces.length; i++){
        //console.log("pieces " + pieces[i]);
        pieces[i].draw();
    }
    if(!gameStarted){
        makeMenu();
    }
}

function makeMenu(){
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = "BurlyWood";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = "blue";
    ctx.font = "30px Arial";
    ctx.fillText("Mini-Chess", SCREEN_WIDTH/2 - (SCREEN_WIDTH/6) - 10, SCREEN_HEIGHT / 3);
    ctx.fillText("Click Here To Play!", SCREEN_WIDTH/2 - (SCREEN_WIDTH/3), SCREEN_HEIGHT / 3 + 60);
}


function movePieces(secondsPassed){
    let tileX = (toTileX(findPieceTile(movingPieceNumber)) * TILE_WIDTH) + HORIZONTAL_MARGIN;
    let tileY = (toTileY(findPieceTile(movingPieceNumber)) * TILE_HEIGHT) + VERTICAL_MARGIN;
    let pixels = 10;
    if(tileX > pieces[movingPieceNumber].left){
        if(tileX > pieces[movingPieceNumber].left + pixels) pieces[movingPieceNumber].left += pixels;
        else pieces[movingPieceNumber].left = tileX;
    }
    if(tileX < pieces[movingPieceNumber].left){
        if(tileX < pieces[movingPieceNumber].left - pixels) pieces[movingPieceNumber].left -= pixels;
        else pieces[movingPieceNumber].left = tileX;
    }
    if(tileY > pieces[movingPieceNumber].top){
        if(tileY > pieces[movingPieceNumber].top + pixels) pieces[movingPieceNumber].top += pixels;
        else pieces[movingPieceNumber].top = tileY;
    }
    if(tileY < pieces[movingPieceNumber].top){
        if(tileY < pieces[movingPieceNumber].top - pixels) pieces[movingPieceNumber].top -= pixels;
        else pieces[movingPieceNumber].top = tileY;
    }
    
    if(pieces[movingPieceNumber].left == tileX && pieces[movingPieceNumber].top == tileY){
        movingPieceNumber = -1;
        //console.log("left " + tileX);
        //console.log("top " + tileY);
        drawScreen();
        if(checkGameOver() != -1){
            endGame(checkGameOver());
        }else{
            //console.log("players turn: " + playersTurn);
            if(!playersTurn) playersTurn = true;
            else{
                playersTurn = false;
                opponentsTurn();
            }
        }
    }
    //if(pieces[movingPieceNumber].left == tileX && pieces[movingPieceNumber].top == tileY) pieces[movingPieceNumber].setImgPosition(tileX+TILE_WIDTH, tileY+TILE_HEIGHT);
}

function makePiece(tile, left, top, playerColour){
    //Computer pieces
    let piece = null;
    //console.log("making tile: " + tile);
    if((tile == 0|| tile == 1)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, swapColour(playerColour), "knight");
    }
    if(tile == 2){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, swapColour(playerColour), "king");
    }
    if((tile >= 3) && (tile <= 5)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, swapColour(playerColour), "pawn");
    }
    //Player pieces
    if((tile == board.length-1) || (tile == board.length-2)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, playerColour, "knight");
    }
    if(tile == board.length-3){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, playerColour, "king");
    }
    if((tile >= 12) && (tile <= 14)){
        piece = new Piece(left, top, TILE_WIDTH, TILE_HEIGHT, playerColour, "pawn");
    }
    //if(typeof piece !== undefined){
    if(piece != null){
        pieces.push(piece);
        let num = pieces.length - 1;
        //pieces[num].tile = tile;
        board[tile].piece = num;
        //console.log("piece made " + piece);
    }
}

function findPieceColour(){
    return "white";
}

function swapColour(colour){
    if(colour == "white") return "black";
    if(colour == "black") return "white";
}

function clickingTile(tile, mouseX, mouseY){
    let withinLeft = (mouseX <= board[tile].left+TILE_WIDTH);
    let withinRight = (mouseX >= board[tile].left);
    let withinTop = (mouseY <= board[tile].top+TILE_HEIGHT);
    let withinBottom = (mouseY >= board[tile].top);
    if(withinLeft && withinRight && withinTop && withinBottom) return true;
    return false;
}

function findPieceTile(pieceNum){
    for(let i = 0; i < board.length; i++){
        if(board[i].piece == pieceNum) return i;
    }
}

function viableMoves(pieceNum, colour){
    //console.log("viable moves");
    let moves = [];
    let tile = findPieceTile(pieceNum);
    let tileX = toTileX(tile);
    let position = -1;
    if(pieces[pieceNum].type == "knight"){
        if(tileX == 0){
            //position = pieces[pieceNum].tile + 2 + 3;
            position = tile + 2 + 3;
            if(isViable(position, colour)) moves.push(position);

            position = tile + 2 - 3;
            if(isViable(position, colour)) moves.push(position);
        }else{
            position = tile - 1 + 6;
            if(isViable(position, colour)) moves.push(position);

            position = tile - 1 - 6;
            if(isViable(position, colour)) moves.push(position);
        }
        if(tileX == 2){
            position = tile - 2 + 3;
            if(isViable(position, colour)) moves.push(position);

            position = tile - 2 - 3;
            if(isViable(position, colour)) moves.push(position);
        }else{
            position = tile + 1 + 6;
            if(isViable(position, colour)) moves.push(position);
    
            position = tile + 1 - 6;
            if(isViable(position, colour)) moves.push(position);
        }
    }

    if(pieces[pieceNum].type == "king"){
        if(tileX != 0){
            position = tile -1;
            if(isViable(position, colour)) moves.push(position);

            //diagonals
            position = tile - 1 + 3;
            if(isViable(position, colour)) moves.push(position);

            position = tile - 1 - 3;
            if(isViable(position, colour)) moves.push(position);
        }
        if(tileX != 2){
            let position = tile + 1;
            if(isViable(position, colour)) moves.push(position);

            //diagonals
            position = tile + 1 + 3;
            if(isViable(position, colour)) moves.push(position);
            
            position = tile + 1 - 3;
            if(isViable(position, colour)) moves.push(position);
        }
        position = tile + 3;
        if(isViable(position, colour)) moves.push(position);
            
        position = tile -3;
        if(isViable(position, colour)) moves.push(position);
    }

    if(pieces[pieceNum].type == "pawn"){
        if(colour == "white"){
            position = tile - 3;
            if(isViable(position, colour, "moving")) moves.push(position);

            if(tileX != 0){
                position = tile - 1 - 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
            if(tileX !=  2){
                position = tile + 1 - 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
        }else{
            position = tile + 3;
            if(isViable(position, colour, "moving")) moves.push(position);

            if(tileX != 0){
                position = tile - 1 + 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
            if(tileX !=  2){
                position = tile + 1 + 3;
                if(isViable(position, colour, "attacking")) moves.push(position);
            }
        }
        //for(let i = 0; i < moves.length; i++) console.log("moves " + i + ": " + moves[i]);
    } 
    //console.log("x " + moves[0].x);
    return moves;
}

function isViable(position, colour, pawnStatus = "none"){
    //let tileX = position % 3;
    //let tileY = position % 6;
    //if(tileX > (board.length-1) % 3 || tileX < 0) return false;
    //if(tileY > (board.length-1) % 6 || tileY < 0) return false;

    if(position < 0 || position >= board.length) return false;
    if(board[position].piece != null){
        if(pieces[board[position].piece].colour == colour) return false;
        if(pawnStatus == "moving") return false;
        if(pawnStatus == "attacking") return true;
    }
    if(pawnStatus == "attacking") return false;

    //console.log("y " + position.y);
    //console.log("x " + position.x);
    return true;
}

function showAvailableMoves(pieceNum){
    //console.log("showAvailableMoves");
    //console.log("pieceNumber " + pieceNumber);
    ctx.fillStyle = "blue";
    let tile = findPieceTile(pieceNum);
    let tileX = toTileX(tile);
    let tileY = toTileY(tile);
    ctx.fillRect((tileX * TILE_WIDTH) + HORIZONTAL_MARGIN, (tileY * TILE_HEIGHT) + VERTICAL_MARGIN, TILE_WIDTH, TILE_HEIGHT);
    let moves = pieceSelectedMoves;
    for(let i = 0; i < moves.length; i++){
        tileX = toTileX(moves[i]);
        tileY = toTileY(moves[i]);
        //console.log("tileX " + tileX);
        //console.log("tileY " + tileY);
        ctx.fillRect((tileX * TILE_WIDTH) + HORIZONTAL_MARGIN, (tileY * TILE_WIDTH) + VERTICAL_MARGIN, TILE_WIDTH, TILE_HEIGHT);
        //console.log("x: " + ((tileX * TILE_WIDTH) + HORIZONTAL_MARGIN));
        //console.log("y: " + ((tileY * TILE_WIDTH) + VERTICAL_MARGIN));
    }
}

function removePiece(tile){
    // console.log("before splice");
    // for(let i = 0; i < board.length; i++){
    //     if(board[i].piece != null) console.log("board " + i + ": " + pieces[board[i].piece].colour + " " + pieces[board[i].piece].type + " #" + board[i].piece);
    // }

    let index = board[tile].piece;
    board[tile].piece = null;
    pieces.splice(index, 1);
    for(let i = 0; i < board.length; i++){
        if(board[i].piece != null && board[i].piece >= index) board[i].piece -= 1;
    }

    // console.log();
    // console.log("after splice");
    // for(let i = 0; i < board.length; i++){
    //     if(board[i].piece != null) console.log("board " + i + ": " + pieces[board[i].piece].colour + " " + pieces[board[i].piece].type + " #" + board[i].piece);
    // }
}

function opponentsTurn(){
    console.log("opponents turn");
    if(gameStarted){
        let pieceChoice = null;
        let moveChoice = null;
        let finished = false;

        //First check if there is a piece that can take an opponents piece
        for(let i = 0; i < pieces.length; i++){
            if(pieces[i].colour != playerColour){
                let moves = viableMoves(i, swapColour(playerColour));
                for(let j = 0; j < moves.length; j++){
                    if(board[moves[j]].piece != null){
                        pieceChoice = i;
                        moveChoice = j;
                        j = moves.length;
                        i = pieces.length;
                    }
                }
            }
        }

        //Then check if there is a piece that can move
        if(pieceChoice == null){
            for(let i = 0; i < pieces.length; i++){
                if(pieces[i].colour != playerColour){
                    let moves = viableMoves(i, swapColour(playerColour));
                    if(moves.length > 0) pieceChoice = i;
                }
            }
        }

        //Moving the piece
        if(pieceChoice != null){
            let moves = viableMoves(pieceChoice, swapColour(playerColour));
            if(moveChoice == null) moveChoice = 0;
            if(board[moves[moveChoice]].piece != null){
                if(pieceChoice >= board[moves[moveChoice]].piece) pieceChoice -= 1;
                removePiece(moves[moveChoice]);
            }
            let tile = findPieceTile(pieceChoice);
            board[tile].piece = null;
            //pieces[pieceChoice].setTile(moves[moveChoice]);
            board[moves[moveChoice]].piece = pieceChoice;
            movingPieceNumber = pieceChoice;
        }else{
            //playerTurn = true; here because in movePieces it sets that after the pieces move: so one is needed here if the opponent can't move
            playersTurn = true;
        }

        /*
        while(finished == false){
            pieceChoice = randomNumber(0, pieces.length - 1);
            if(pieces[pieceChoice].colour != playerColour){
                moves = viableMoves(pieceChoice, swapColour(playerColour));
                // This statement was removed because it would cause an infinite loop if no piece could move: if(moves.length >= 1) finished = true;
                finished = true;
            }
        }
        //If a piece has no moves, than the opponent might skip it's turn
        if(moves.length != 0){
            let moveChoice = randomNumber(0, moves.length - 1);
            if(board[moves[moveChoice]].piece != null){
                if(pieceChoice >= board[moves[moveChoice]].piece) pieceChoice -= 1;
                removePiece(moves[moveChoice]);
            }
            let tile = findPieceTile(pieceChoice);
            board[tile].piece = null;
            //pieces[pieceChoice].setTile(moves[moveChoice]);
            board[moves[moveChoice]].piece = pieceChoice;
            movingPieceNumber = pieceChoice;
            //console.log("Moved " + pieces[pieceChoice].colour + " "  + pieces[pieceChoice].type + " to " + moves[moveChoice]);
            //pieces[pieceChoice].setImgPosition(toTileX(moves[moveChoice]) * TILE_WIDTH, toTileY(moves[moveChoice]) * TILE_HEIGHT);
        }else{
            playersTurn = true;
        }
        */
    }
}

function checkGameOver(){
    let playerPieces = 0;
    let opponentPieces = 0;
    let playerHasKing = false;
    let opponentHasKing = false;
    for(let i = 0; i < pieces.length; i++){
        if(pieces[i].colour == playerColour){
            playerPieces ++;
            if(pieces[i].type == "king") playerHasKing = true;
        }else{
            opponentPieces ++;
            if(pieces[i].type == "king") opponentHasKing = true;
        }
    }
    //console.log("player: " + playerPieces + " opponent: " + opponentPieces);
    if(!playerHasKing) return swapColour(playerColour);
    if(!opponentHasKing) return playerColour;
    if(playerPieces == 0) return swapColour(playerColour);
    if(opponentPieces == 0) return playerColour;
    return -1;
}

function endGame(colour){
    console.log("endGame: colour: " + colour);
    ctx.font = "30px Arial";
    ctx.fillStyle = "blue";
    if(colour == playerColour){
        ctx.fillText("YOU WON!", SCREEN_WIDTH/2 - (TILE_WIDTH/2), SCREEN_HEIGHT/2);
    }else{
        ctx.fillText("YOU LOST", SCREEN_WIDTH/2 - (TILE_WIDTH/2), SCREEN_HEIGHT/2);
    }
}

function randomNumber(num1, num2){
    return Math.floor(Math.random() * (num2 - num1 + 1) ) + num1;
}

function toTileX(tile){
    return (tile % 3);
}

function toTileY(tile){
    return (Math.floor(tile / 3));
}

function toTileNum(x, y){
    return x + (y * 3);
}

//---------------------------------------------------------------------------
// MAIN
//---------------------------------------------------------------------------

setUp();
createWorld();
drawScreen();

