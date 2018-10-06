const { SLEM } = require('./constants')

const rankToNumber = (rank) => {
    switch (rank) {
        case 'J':
            return 11;
        case 'Q':
            return 12;
        case 'K':
            return 13;
        case 'A':
            return 1;
        default:
            return parseInt(rank);
    }
}

const cardToNumber = (card) => rankToNumber(card.rank)

const comparison = (scoringMode, x, y) => scoringMode == SLEM.GRAND ?
    cardToNumber(x) > cardToNumber(y) :
    cardToNumber(x) < cardToNumber(y);

const comparer = (scoringMode) => (x, y) => comparison(scoringMode, x, y) ? 1 : -1

const cardsStrategy = (cardsOnHand, cardsOnTable) => {
    if (cardsOnTable.length > 0) {
        const suit = cardsOnTable[0].suit
        const suitCards = cardsOnHand.filter(x => x.suit == suit)
        return suitCards.length > 0 ? { cards: suitCards, extremum: x => x } : { cards: cardsOnHand, extremum: x => !x } 
    } else {
        return { cards: cardsOnHand, extremum: x => !x }
    }
}

const averageRank = (cards) => cards.map(x => cardToNumber(x)).reduce((x, y) => x + y) / cards.length

module.exports = {
    comparison,
    comparer,
    cardsStrategy,
    averageRank,
}