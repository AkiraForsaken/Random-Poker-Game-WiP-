// script.js
class Players{
    constructor(isPlayer){
        this.isPlayer = isPlayer;
        this.hand = [];
        this.budget = 2500;
        this.currentBet = 0;
    }
    bet(number){
        if (this.budget === 0){
            console.log("THIS IS NOT SUPPOSED TO HAPPEN YOU HAVE NO MONEY PLS FIX");
            return;
        }
        if (number > this.budget){
            this.currentBet += this.budget;
            this.budget = 0;
            pot += this.currentBet;
            return;
        }
        this.budget -= number;
        this.currentBet += number;
        pot += number;
        return;
    }
    resetHand(){
        this.hand = [];
    }
}
const player = new Players(true);
const opponent = new Players(false);
let deck = [];
let communityCards = [];
let pot = 0;
let firstBigBlind = (Math.random() < 0.5); // false is player, true is opponent
let smallBlind = 100;
let bigBlind = 200;
let bigBlindRaise = true;
let currentBet = 0;
let isPlayerTurn = true;
let lastRaise = player; 
let checkCounter = 0;
let gameState = "initial"; // -> preflop -> flop -> turn -> river -> showdown

function createDeck(){
    const suits = ['spades', 'clubs', 'diamonds', 'hearts'];
    const values = ['2','3','4','5','6','7','8','9','10','jack','queen','king','ace'];
    deck = [];
    for (let i = 0; i < suits.length; i++){
        for (let y = 0; y < values.length; y++){
            let card = { Value: values[y], Suit: suits[i] };
            deck.push(card);
        }
    }
}
function shuffleDeck(){
    for (let i = deck.length - 1; i > 0; i--){
        let j = Math.floor(Math.random() * i);
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
}
function dealCards(){
    player.hand = deck.splice(0,2);
    opponent.hand = deck.splice(0,2);
    communityCards = deck.splice(0,5);
}
function blinds(){
    if (firstBigBlind === true){ // opponent big blind 
        player.bet(smallBlind);
        opponent.bet(bigBlind);
        isPlayerTurn = true;
        lastRaise = opponent;
    } else { // player is big blind
        player.bet(bigBlind);
        opponent.bet(smallBlind);
        isPlayerTurn = false;
        lastRaise = player;
    }
    if (player.budget === 0){
        currentBet = player.currentBet;

    } else if (opponent.budget === 0){
        currentBet = opponent.currentBet;
    } else {
        currentBet = bigBlind;
    }
}
function alternateBlinds(){
    firstBigBlind = !firstBigBlind;
}
function determineWinner(){
    function getBestHand(hand){
        const allCombinations = generateCombinations(hand,5);
        let bestHand = {rank: 0, highCards: []};
        for (let combination of allCombinations){ 
            // for (let x in object): x is a key, use object[x] to access the values (can still be used for arrays since arrays are objects)
            // for (let x of object): x is a variable, lets you loop over iterable objects such as Arrays, Strings, Maps, NodeLists,...
            const evaluation = evaluateCombinations(combination);
            if ((evaluation.rank > bestHand.rank) ||
                (evaluation.rank === bestHand.rank && compareHighCards(evaluation.highCards, bestHand.highCards) === -1)){
                    bestHand = evaluation;
                }
        }
        return bestHand;
    };
    function evaluateCombinations(combination){
        let evaluation = {rank: 0, highCards: []};
        const sortedHand = combination.slice().sort((a,b) => cardValueToNum(b.Value) - cardValueToNum(a.Value)); 
        // still an array of cards
        // decending order => b - a, ascending order => a - b (ace, king, queen,...)
        // Sort function: if negative then a comes before b, else b comes before a
        if (isRoyalFlush(sortedHand)){
            evaluation.rank = 10;
            evaluation.highCards = [14]; // ace
        } else if (isStraightFlush(sortedHand)){
            evaluation.rank = 9;
            evaluation.highCards = getHighCards(sortedHand,9);
        } else if (isQuads(sortedHand)){
            evaluation.rank = 8;
            evaluation.highCards = getHighCards(sortedHand,8);
        } else if (isFullHouse(sortedHand)){
            evaluation.rank = 7;
            evaluation.highCards = getHighCards(sortedHand,7);
        } else if (isFlush(sortedHand)){
            evaluation.rank = 6;
            evaluation.highCards = getHighCards(sortedHand,6);
        } else if (isStraight(sortedHand)){
            evaluation.rank = 5;
            evaluation.highCards = getHighCards(sortedHand,5);
        } else if (isToAK(sortedHand)){
            evaluation.rank = 4;
            evaluation.highCards = getHighCards(sortedHand,4);
        } else if (isTwoPair(sortedHand)){
            evaluation.rank = 3;
            evaluation.highCards = getHighCards(sortedHand,3);
        } else if (isPair(sortedHand)){
            evaluation.rank = 2;
            evaluation.highCards = getHighCards(sortedHand,2);
        } else {
            evaluation.rank = 1;
            evaluation.highCards = getHighCards(sortedHand,1);
        }
        return evaluation;
    };
    function getHighCards(combination, rank){  
        let counts = countCardsFreq(combination)
        if (rank === 8){ // quads
            let quads = Object.keys(counts).find(val => counts[val] === 4);
            let kicker = Object.keys(counts).find(val => counts[val] === 1);
            // Object.keys(object): returns an array of STRINGS from an object
            return [parseInt(quads), parseInt(kicker)];
        } else if (rank === 7){ // full house
            let triples = Object.keys(counts).find(val => counts[val] === 3);
            let pair = Object.keys(counts).find(val => counts[val] === 2);
            return [parseInt(triples),parseInt(pair)]; 
        } else if (rank === 4){
            let triples = Object.keys(counts).find(val => counts[val] === 3);
            let kickers = Object.keys(counts).filter(val => counts[val] === 1).map(Number).sort((a,b) => b - a);
            return [parseInt(triples), ...kickers];
        } else if (rank === 3){ // two pairs
            let pairs = Object.keys(counts).filter(val => counts[val] === 2).map(Number).sort((a,b) => b - a);
            let kicker = Object.keys(counts).find(val => counts[val] === 1);
            return [...pairs,parseInt(kicker)];
        } else if (rank === 2){ // one pair
            let pair = Object.keys(counts).find(val => counts[val] === 2);
            let kickers = Object.keys(counts).filter(val => counts[val] === 1).map(Number).sort((a,b) => b - a);
            return [parseInt(pair),...kickers];
        }
        let valueArray = combination.map(card => cardValueToNum(card.Value));
        if (rank === 5 && valueArray.join(",") === "14,5,4,3,2"){
            valueArray = [5,4,3,2,1];
        }
        return valueArray;
    };
    function compareHighCards(highCards1, highCards2){
        for (let i = 0; i < highCards1.length; i++){
            if (highCards1[i] < highCards2[i]) return 1;
            if (highCards1[i] > highCards2[i]) return -1;
        }
        return 0;
    }
    function cardValueToNum(cardValue){ // Can use mapping to be more efficient: map = {"2":2,...}
        if (!isNaN(Number(cardValue))){
            return Number(cardValue);
        } else {
            switch (cardValue) {
                case 'jack':
                    return 11;
                case 'queen':
                    return 12;
                case 'king':
                    return 13;
                case 'ace':
                    return 14;
                default:
                    return -1;
            }
        }
    }; 

    function NumToCardString(num){
        if (num <= 10){
            return String(num);
        } else{
            switch (num) {
                case 11:
                    return `Jack`;
                case 12:
                    return `Queen`;
                case 13:
                    return `King`; 
                case 14:
                    return `Ace`;
            }
        }
    }
    
    function generateCombinations(arr, size){
        if (size > arr.length) { return [];}
        if (size === arr.length) { return [arr];}
        if (size === 1){
            return arr.map(x => [x]);
        }

        let combinations = [];
        for (let i = 0; i < arr.length - size + 1; i++){
            const head = arr.slice(i,i+1);
            let tailCombinations = generateCombinations(arr.slice(i+1), size - 1);
            tailCombinations.forEach(tail => combinations.push(head.concat(tail)));
        }
        return combinations;
    };

    function isRoyalFlush(combination){
        return (isStraightFlush(combination) && combination.some(card => card.Value === `ace`)); 
        // some(): checks if any (at least 1) of the elements in the array passes the predicate function
    };
    function isStraightFlush(combination){
        return (isFlush(combination) && isStraight(combination));
    };
    function isQuads(combination){
        let counts = countCardsFreq(combination);
        return (Object.values(counts).includes(4));
    };
    function isFullHouse(combination){
        let counts = countCardsFreq(combination);
        return (Object.values(counts).includes(3) && Object.values(counts).includes(2));
    };
    function isFlush(combination){
        let suitArr = combination.map(card => card.Suit);
        for (let i = 0; i < suitArr.length - 1; i++){
            if (suitArr[i] !== suitArr[i+1]) return false;
        }
        return true;
    };
    function isStraight(combination){
        let valArr = combination.map(card => cardValueToNum(card.Value));
        // Bicycle: A 2 3 4 5 
        if (valArr.join(",") === "14,5,4,3,2") return true;
        for (let i = 0; i < valArr.length - 1; i++){
            if (valArr[i]-1 !== valArr[i+1]) return false;
        }
        return true;
    };
    function isToAK(combination){
        let counts = countCardsFreq(combination);
        return (Object.values(counts).includes(3) && !(Object.values(counts).includes(2)));
    };
    function isTwoPair(combination){
        let counts = countCardsFreq(combination);
        return (Object.values(counts).filter(val => val === 2).length === 2);
        // filter(callback fnc): array method used to filter according to the function;
    };
    function isPair(combination){
        let counts = countCardsFreq(combination);
        return Object.values(counts).includes(2);
        // values(object): returns an array containing all values
        // Object.values(object): has to do this way because counts is a regular object, not a Map or Set.
    };
    function countCardsFreq(cards){
        let cardsFrequency = {};
        for (let card of cards){
            const val = cardValueToNum(card.Value);
            cardsFrequency[val] = (cardsFrequency[val] || 0) + 1;
        }
        return cardsFrequency;
    }

    const playerCards = player.hand.concat(communityCards);
    const opponentCards = opponent.hand.concat(communityCards);

    const playerBestHand = getBestHand(playerCards);
    const opponentBestHand = getBestHand(opponentCards);
    console.log(`Player Rank: ${playerBestHand.rank}`);
    console.log(`Player highcards: ${playerBestHand.highCards}`);
    console.log(`Opponent Rank: ${opponentBestHand.rank}`);
    console.log(`Opponent highcards: ${opponentBestHand.highCards}`);

    let playerRank;
    let opponentRank;
    switch (playerBestHand.rank) {
        case 10:
            playerRank = `(Royal Flush)`;
            break;
        case 9:
            playerRank = `(Straight Flush)`;
            break;
        case 8:
            playerRank = `(${NumToCardString(playerBestHand.highCards[0])} Quads)`;
            break;
        case 7:
            playerRank = `(Full House)`;
            break;
        case 6:
            playerRank = `(Flush)`;
            break;
        case 5:
            playerRank = `(Straight: ${NumToCardString(playerBestHand.highCards[0])} High)`;
            break;
        case 4:
            playerRank = `(Three ${NumToCardString(playerBestHand.highCards[0])})`;
            break;
        case 3:
            playerRank = `(Two pairs)`;
            break;
        case 2:
            playerRank = `(${NumToCardString(playerBestHand.highCards[0])} Pair)`;
            break;
        case 1:
            playerRank = `(${NumToCardString(playerBestHand.highCards[0])} High)`
            break;
    }
    switch (opponentBestHand.rank) {
        case 10:
            opponentRank = `(Royal Flush)`;
            break;
        case 9:
            opponentRank = `(Straight Flush)`;
            break;
        case 8:
            opponentRank = `(${NumToCardString(opponentBestHand.highCards[0])} Quads)`;
            break;
        case 7:
            opponentRank = `(Full House)`;
            break;
        case 6:
            opponentRank = `(Flush)`;
            break;
        case 5:
            opponentRank = `(Straight: ${NumToCardString(opponentBestHand.highCards[0])} High)`;
            break;
        case 4:
            opponentRank = `(Three ${NumToCardString(opponentBestHand.highCards[0])})`;
            break;
        case 3:
            opponentRank = `(Two pairs)`;
            break;
        case 2:
            opponentRank = `(${NumToCardString(opponentBestHand.highCards[0])} Pair)`;
            break;
        case 1:
            opponentRank = `(${NumToCardString(opponentBestHand.highCards[0])} High)`
            break;
    }
    document.getElementById(`player-hand`).textContent = `Your Hand: ${playerRank}`;
    document.getElementById(`opponent-hand`).textContent = `Opponent Hand: ${opponentRank}`;
    if (playerBestHand.rank > opponentBestHand.rank){
        console.log(`You got lucky this time. I'm not done yet!`);
        return 0; // player wins
    } else if (playerBestHand.rank < opponentBestHand.rank){
        console.log(`What a fool! You thought you could get me?`);
        return 1; // opponent wins
    } 

    if (compareHighCards(playerBestHand.highCards, opponentBestHand.highCards) === -1){
        console.log(`You got lucky this time. I'm not done yet!`);
        return 0; // player wins
    } else if (compareHighCards(playerBestHand.highCards, opponentBestHand.highCards) === 1){
        console.log(`What a fool! You thought you could get me?`);
        return 1; // opponent wins
    }
    console.log("Its a tie!");
    return -1;
}
function toggleControl(enable){
    if (player.budget === 0){ // all-in
        foldButton.disabled = true;
        checkButton.disabled = true;
        raiseButton.disabled = true;
        foldButton.classList.add("disabled");
        checkButton.classList.add("disabled");
        raiseButton.classList.add("disabled");
        return;
    }
    foldButton.disabled = !enable;
    checkButton.disabled = !enable;
    raiseButton.disabled = !enable;
    if (enable){
        foldButton.classList.remove("disabled");
        checkButton.classList.remove("disabled");
        raiseButton.classList.remove("disabled");
    } else {
        foldButton.classList.add("disabled");
        checkButton.classList.add("disabled");
        raiseButton.classList.add("disabled");
    }
    if (currentBet === player.currentBet){ // changes the Check and call button name appropriately
        checkButton.textContent = "Check";
        foldButton.disabled = true;
        foldButton.classList.add("disabled");
    } else {
        checkButton.textContent = "Call";
    }
    if (opponent.budget === 0){
        raiseButton.disabled = true;
        raiseButton.classList.add("disabled");
    }
}
function updateUI(){
    playerBudgetElement.textContent = `Player Budget: ${player.budget}`;
    opponentBudgetElement.textContent = `Opponent Budget: ${opponent.budget}`;
    potHtml.textContent = `Pot: ${pot}`;
    currentBetHtml.textContent = `Current Bet: ${currentBet}`;
    if (player.budget === 0 || opponent.budget === 0){
        toggleControl(false);
    }
}
const turnIndicator = document.getElementById(`turn`);
const blindIndicator = document.getElementById(`blind`);
const resultDisplay = document.getElementById(`result`);
const opponentAction = document.getElementById(`opponent-action`);
const playerAction = document.getElementById(`player-action`);
function updateTurnIndicator(){
    if (gameState === `preflop`){
        if (firstBigBlind === false) {
            blindIndicator.textContent = "(You are big blind)";
        } else if (firstBigBlind === true) {
            blindIndicator.textContent = "(You are small blind)";
        }
        turnIndicator.textContent = isPlayerTurn ? "Your Turn" : "Opponent's Turn";
    } else {
        blindIndicator.textContent = "";
        turnIndicator.textContent = isPlayerTurn ? "Your Turn" : "Opponent's Turn";
    }
}
function revealFlop(){
    card1.src = `refs/PNG-cards-1.3/${communityCards[0].Value}_of_${communityCards[0].Suit}.png`;
    card1.alt = `${communityCards[0].Value}_of_${communityCards[0].Suit} card`;
    card2.src = `refs/PNG-cards-1.3/${communityCards[1].Value}_of_${communityCards[1].Suit}.png`;
    card2.alt = `${communityCards[1].Value}_of_${communityCards[1].Suit} card`;
    card3.src = `refs/PNG-cards-1.3/${communityCards[2].Value}_of_${communityCards[2].Suit}.png`;
    card3.alt = `${communityCards[2].Value}_of_${communityCards[2].Suit} card`;
    console.log("The Flop");
}
function revealTurn(){
    card4.src = `refs/PNG-cards-1.3/${communityCards[3].Value}_of_${communityCards[3].Suit}.png`;
    card4.alt = `${communityCards[3].Value}_of_${communityCards[3].Suit} card`;
    console.log("The Turn");
}
function revealRiver(){
    card5.src = `refs/PNG-cards-1.3/${communityCards[4].Value}_of_${communityCards[4].Suit}.png`;
    card5.alt = `${communityCards[4].Value}_of_${communityCards[4].Suit} card`;
    console.log("The River");
}
function showDownTime(){
    console.log("Let's see who have the better hand.");
    opponentCard1.src = `refs/PNG-cards-1.3/${opponent.hand[0].Value}_of_${opponent.hand[0].Suit}.png`;
    opponentCard1.alt = `${opponent.hand[0].Value}_of_${opponent.hand[0].Suit} card`;
    opponentCard2.src = `refs/PNG-cards-1.3/${opponent.hand[1].Value}_of_${opponent.hand[1].Suit}.png`;
    opponentCard2.alt = `${opponent.hand[1].Value}_of_${opponent.hand[1].Suit} card`;
    const winner = determineWinner();
    let resultText = "";
    let finalPot = Math.min(player.currentBet, opponent.currentBet) * 2;
    let excess = Math.abs(player.currentBet - opponent.currentBet);
    switch (winner) {
        case 0: // player wins
            player.budget += finalPot;
            if (player.currentBet > opponent.currentBet) player.budget += excess;
            resultText = "Player Wins !!!";
            resultDisplay.style.backgroundImage = "url('refs/smiley.png')";
            pot = 0;
            break;
        case 1: // opponent wins
            opponent.budget += finalPot;
            if (player.currentBet < opponent.currentBet) opponent.budget += excess;
            resultText = "Opponent Wins !?!";
            resultDisplay.style.backgroundImage = "url('refs/sad.png')";
            pot = 0;
            break;
        case -1: // tie
            player.budget += finalPot/2;
            opponent.budget += finalPot/2;
            resultText = "Tie Game !!"
            pot = excess;
            break;
        default:
            console.log(`UNIDENTIFIED RESULT`);
            break;
    }
    resultDisplay.textContent = resultText;
    resultDisplay.style.display = `block`;
    resultDisplay.style.animation = `fadeIn 1s ease-in-out forwards`;
    updateUI();
    checkGameOver();
}
function checkGameOver(){
    if (player.budget === 0){
        document.getElementById("game-over-message").textContent = "You lost. Better luck next time.";
        document.getElementById(`game-over`).style.display = `block`;
        setTimeout(() => {gameArea.style.display = `none`}, 10000);
    } else if (opponent.budget === 0) {
        document.getElementById("game-over-message").textContent = "You won. Lucky dog!";
        document.getElementById("game-over").style.display = `block`;
        setTimeout(() => {gameArea.style.display = `none`}, 10000);
    } else {
        toggleControl(false);
        newRoundButton.style.display = `block`;
    }
}
const potHtml = document.getElementById(`pot`);
const currentBetHtml = document.getElementById(`current-bet`);
function startGame(){
    checkCounter = 1;
    bigBlindRaise = true;
    console.log("Game has started. Preflop stage");
    startButton.style.display = `none`;
    foldButton.style.display = `inline-block`;
    checkButton.style.display = `inline-block`;
    raiseButton.style.display = `inline-block`;
    gameState = "preflop";
    player.resetHand();
    opponent.resetHand();
    communityCards = [];
    createDeck();
    shuffleDeck();
    dealCards();
    blinds();
    updateUI();
    playerCard1.src = `refs/PNG-cards-1.3/${player.hand[0].Value}_of_${player.hand[0].Suit}.png`;
    playerCard1.alt = `${player.hand[0].Value}_of_${player.hand[0].Suit} card`;
    playerCard2.src = `refs/PNG-cards-1.3/${player.hand[1].Value}_of_${player.hand[1].Suit}.png`;
    playerCard2.alt = `${player.hand[1].Value}_of_${player.hand[1].Suit} card`;
    updateTurnIndicator();
    toggleControl(isPlayerTurn);

    if (isPlayerTurn === false){
        setTimeout(opponentTurn,3000);
    }
}
function resetGame(){
    console.clear("Clear for new round");
    currentBet = 0;
    player.currentBet = 0;
    opponent.currentBet = 0;
    gameArea.style.display = `flex`;
    opponentAction.textContent = ``;
    playerAction.textContent = ``;
    resultDisplay.style.display = `none`;
    newRoundButton.style.display = `none`;
    document.getElementById(`player-hand`).textContent = "Your Hand: ";
    document.getElementById(`opponent-hand`).textContent = "Opponent Hand: ";
    card1.src = "refs/PNG-cards-1.3/red_joker.png";
    card2.src = "refs/PNG-cards-1.3/red_joker.png";
    card3.src = "refs/PNG-cards-1.3/red_joker.png";
    card4.src = "refs/PNG-cards-1.3/red_joker.png";
    card5.src = "refs/PNG-cards-1.3/red_joker.png";
    playerCard1.src = "refs/PNG-cards-1.3/red_joker.png";
    playerCard2.src = "refs/PNG-cards-1.3/red_joker.png";
    opponentCard1.src = "refs/PNG-cards-1.3/red_joker.png";
    opponentCard2.src = "refs/PNG-cards-1.3/red_joker.png";
    alternateBlinds();
    startGame();
}
function nextStage(){
    checkCounter = 0;
    if (gameState === "preflop"){
        revealFlop();
        gameState = "flop";
    } else if (gameState === "flop"){
        revealTurn();
        gameState = "turn";
    } else if (gameState === "turn"){
        revealRiver();
        gameState = "river";
    } else if (gameState === "river"){
        showDownTime();
        gameState = "showdown";
        return;
    }

    if (player.budget === 0 || opponent.budget === 0){ // all-in
        revealFlop();
        revealTurn();
        revealRiver();
        showDownTime();
        gameState = "showdown";
        updateUI();
        return;
    }
    if (lastRaise === player){
        isPlayerTurn = true;
    } else {
        isPlayerTurn = false;
    }
    updateTurnIndicator();
    toggleControl(isPlayerTurn);

    if (isPlayerTurn === false){ 
        setTimeout(opponentTurn, 3000); // Wait 5s before opponent makes move
    }
}

function playerTurn(action){
    if (isPlayerTurn === false) return;
    if (opponent.budget === 0 && currentBet < player.currentBet){
        nextStage();
        return;
    }
    if (action === `fold`){
        fold(player);
    } else if (action === `check`){
        const temp = checkOrCall(player);
        if (temp === `call`){
            if (player.budget < currentBet - player.currentBet){
                currentBet = player.budget + player.currentBet;
            }
            player.bet(currentBet - player.currentBet);
            // player.currentBet = currentBet;
            updateUI();
            if (bigBlindRaise === true && gameState === `preflop` && firstBigBlind === true && opponent.budget !== 0){
                isPlayerTurn = false;
                bigBlindRaise = false;
                updateTurnIndicator();
                toggleControl(isPlayerTurn);
                setTimeout(opponentTurn,3000);
                return;
            }
            nextStage();
        } else if (temp === `check`){
            if (checkCounter === 1){
                nextStage();
            } else {
                checkCounter++;
                isPlayerTurn = false;
                updateTurnIndicator();
                toggleControl(isPlayerTurn);
                if (isPlayerTurn === false){ 
                    setTimeout(opponentTurn, 3000); // Wait 5s before opponent makes move
                }
            }
        }
    } else if (action === `raise`){
        lastRaise = player;
        isPlayerTurn = false; // to opponent
        updateTurnIndicator();
        toggleControl(isPlayerTurn);
        if (isPlayerTurn === false){ 
            setTimeout(opponentTurn, 3000); // Wait 5s before opponent makes move
        }
    }
}

function opponentTurn(){
    let decisionToken = Math.random(); // always lower than 1
    if (opponent.budget === 0){
        console.log(`Im all`);
        lastRaise = opponent;
        isPlayerTurn = true; // Back to player
        updateUI();
        updateTurnIndicator();
        toggleControl(isPlayerTurn);
        return;
    }
    if (player.budget === 0){ // fold or call
        if (opponent.currentBet >= currentBet){ // automatically call
            nextStage();
            return;
        } else{ // decision
            if (decisionToken < 0.7){
                opponent.bet(currentBet - opponent.currentBet);
                nextStage();
            } else {
                fold(opponent);
            }
            return;
        }
    }

    if (decisionToken < 0.3 && (opponent.currentBet + opponent.budget) > currentBet){ // raise
        const min = Math.min(opponent.budget + opponent.currentBet, currentBet + 10);
        const max = Math.min(player.budget + player.currentBet,opponent.budget + opponent.currentBet);
        const raiseAmount = Math.floor(Math.random() * ((Math.floor(max / 10) * 10 - Math.floor(min / 10) * 10) / 10 + 1)) * 10 + Math.ceil(min / 10) * 10;
        // let raiseAmount = Math.floor(Math.random() * ((maxRaise - currentBet) / 10 + 1)) * 10 + currentBet;
        // = random*(max-min+1) + min, max = player.budget + player.currentBet, min = currentBet + 10 
        opponent.bet(raiseAmount - opponent.currentBet);
        opponent.currentBet = raiseAmount;
        currentBet = raiseAmount;
        if (raiseAmount === max){
            console.log(`I shove`);
            opponentAction.textContent = "(Opponent Goes ALL IN!?!)"
        } else {
            console.log(`I raise to ${raiseAmount}. Dare to call?`);
            opponentAction.textContent = `(Opponent raises to ${raiseAmount})!?`;
        }
        lastRaise = opponent;
        isPlayerTurn = true; // Back to player
        updateUI();
        updateTurnIndicator();
        toggleControl(isPlayerTurn);
    } else if (decisionToken < 0.8 || opponent.currentBet === currentBet){ // check or call
        const temp = checkOrCall(opponent);
        if (temp === `call`){
            if (opponent.budget < currentBet - opponent.currentBet){
                currentBet = opponent.budget + opponent.currentBet;
            }
            opponent.bet(currentBet - opponent.currentBet);
            // opponent.currentBet = currentBet;
            updateUI();
            if (bigBlindRaise === true && gameState === `preflop` && firstBigBlind === false && player.budget !== 0){
                bigBlindRaise = false;
                isPlayerTurn = true;
                updateTurnIndicator();
                toggleControl(isPlayerTurn);
                return;
            }
            nextStage();
        } else if (temp === `check`){
            if (checkCounter === 1){
                nextStage();
            } else {
                checkCounter++;
                isPlayerTurn = true;
                updateTurnIndicator();
                toggleControl(isPlayerTurn);
            }
        }
    } else{ // fold
        fold(opponent);
    }
}
function fold(target){
    if (target.isPlayer){
        console.log(`Hah you lost. You suck!`)
        playerAction.textContent = `(Player folded)`;
        opponent.budget += pot;
        resultDisplay.textContent = `Opponent Wins !?!`;
        pot = 0;
    } else {
        console.log(`You got lucky this time. I got next!`)
        opponentAction.textContent = `(Opponent folded)`;
        player.budget += pot;
        resultDisplay.textContent = `Player Wins !!!`;
        pot = 0;
    }
    resultDisplay.style.display = `block`;
    resultDisplay.style.animation = `fadeIn 1s ease-in-out forwards`;
    updateUI();
    checkGameOver();
}
function checkOrCall(target){
    if (currentBet > target.currentBet){ // call
        if (target.isPlayer){
            console.log("You called? You fool!");
            playerAction.textContent = "(Player called)"
        } else {
            console.log("You think i wouldn't call that? Hah!")
            opponentAction.textContent = "(Opponent called)";
        }
        return `call`;
    } else if (currentBet <= target.currentBet){ // check
        if (target.isPlayer){
            console.log("Checking? Interesting...");
            playerAction.textContent = "(Player checked)"
        } else {
            console.log("I check.")
            opponentAction.textContent = "(Opponent checked)";
        }
        return `check`;
    }
}

function raise(){  // The raise value is the new current bet value
    slider.max = Math.min(opponent.budget + opponent.currentBet,player.budget + player.currentBet); // set max raise amount
    slider.min = Math.min(player.budget + player.currentBet, currentBet + 10); // set minimum raise amount
    inputValue.max = (player.budget + player.currentBet);
    inputValue.min = Math.min(player.budget + player.currentBet, currentBet + 10);
    slider.value = Math.min(player.budget + player.currentBet, currentBet + 10);
    inputValue.value = Math.min(player.budget + player.currentBet, currentBet + 10);
    inputValue.textContent = slider.value;
    confirmRaise.textContent = `Confirm`;
    sliderContainer.style.display = `block`;
}
const sliderContainer = document.getElementById(`raise-container`);
const slider = document.getElementById(`raise-slider`);
const inputValue = document.getElementById(`raise-input`); //input
const confirmRaise = document.getElementById(`confirm-raise`);
const cancelRaise = document.getElementById(`cancel-raise`);
slider.addEventListener(`input`, ()=> {
    inputValue.value = slider.value;
    if (slider.value == slider.max){
        confirmRaise.textContent = `ALL IN!`;
    } else {
        confirmRaise.textContent = `Confirm`;
    }
    inputValue.value = slider.value;
})
inputValue.addEventListener(`input`, ()=> {
    slider.value = Number(inputValue.value); //to sync
    if (Number(inputValue.value) == Number(inputValue.max)){
        confirmRaise.textContent = `ALL IN!`;
    } else {
        confirmRaise.textContent = `Confirm`;
    }
})
inputValue.addEventListener(`change`, () => {
    if (Number(inputValue.value) > Number(inputValue.max)){
        inputValue.value = Number(inputValue.max);
    } else if (Number(inputValue.value) < Number(inputValue.min)){
        inputValue.value = Number(inputValue.min);
    }
})
confirmRaise.addEventListener(`click`, ()=> {
    player.bet(Number(inputValue.value) - player.currentBet);
    player.currentBet = Number(inputValue.value);
    currentBet = Number(inputValue.value);
    console.log(`You raised to ${Number(inputValue.value)}! Ballsy`);
    if (Number(inputValue.value === Number(inputValue.max))){
        playerAction.textContent = `(Player Goes ALL IN!!)`;
    }
    playerAction.textContent = `(Player raise to ${Number(inputValue.value)})!`;
    updateUI();
    sliderContainer.style.display = `none`;
    playerTurn(`raise`);
})
cancelRaise.addEventListener(`click`, ()=> {
    sliderContainer.style.display = `none`;
})

let username;
document.getElementById(`mySubmit`).onclick = function(){
    username = document.getElementById(`username-input`).value;
    document.getElementById(`title`).textContent = `Try to beat me in poker ${username}`; 
    console.log(username);
}

const toGame = document.getElementById(`to-game`);
const startButton = document.getElementById(`start`);
const backButton = document.getElementById(`back-button`);
const newGameButton = document.getElementById(`play-again`);
const newRoundButton = document.getElementById(`new-round`);
const foldButton = document.getElementById(`fold`);
const checkButton = document.getElementById(`check`);
const raiseButton = document.getElementById(`raise`);
const titlePage = document.getElementById(`title-page`);
const gameArea = document.getElementById(`game-area`);
const playerCard1 = document.getElementById(`player-1`);
const playerCard2 = document.getElementById(`player-2`);
const opponentCard1 = document.getElementById(`opponent-1`);
const opponentCard2 = document.getElementById(`opponent-2`);
const card1 = document.getElementById(`flop-1`);
const card2 = document.getElementById(`flop-2`);
const card3 = document.getElementById(`flop-3`);
const card4 = document.getElementById(`the-turn`);
const card5 = document.getElementById(`the-river`);
const opponentBudgetElement = document.getElementById(`opponent-budget`);
const playerBudgetElement = document.getElementById(`player-budget`);

toGame.addEventListener(`click`, () => {
    titlePage.style.display=`none`;
    gameArea.style.display=`flex`;
    document.getElementById(`title`).style.display = `none`;
})
backButton.addEventListener(`click`, () => {
    titlePage.style.display = 'block';
    gameArea.style.display = 'none';
    document.getElementById(`title`).style.display = `block`;
    console.log(`Back to title`);
})
newGameButton.addEventListener(`click`, () => {
    document.getElementById(`game-over`).style.display = `none`;
    player.budget = 2500;
    opponent.budget = 2500;
    console.clear();
    resetGame();
})