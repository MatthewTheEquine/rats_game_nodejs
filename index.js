const program = require('commander')

const {QUERY, PHASE, SLEM, COMMAND} = require('./constants')
const utils = require('./utils')
const communicationLayer = require('./communicationLayer')
const {comparison, comparer, cardsStrategy, averageRank} = require('./cardUtils')

program
  .version('0.0.1')
  .option('-n, --name <name>', 'client name', 'rats-game-js')
  .option('-t, --token <token>', 'player token given to you which is used as authentication')
  .option('-s, --server <server>', 'game server url (containing /)')
  .parse(process.argv)

const {log, wait} = utils(program.name)
const {query, command} = communicationLayer(program.server, program.token, log)

const selectCard = async ({cards_in_hand, cards_on_table, scoring_mode}) => {
  const { cards, extremum } = cardsStrategy(cards_in_hand, cards_on_table)
  const cardToPlay = cards.reduce((x, y) => extremum(comparison(scoring_mode, x, y)) ? x : y);
  await command(COMMAND.SELECT_CARD, {card: cardToPlay})
}

const selectSlem = async ({cards_in_hand, cards_on_table, scoring_mode}) => {
  const slem = averageRank(cards_in_hand) > 6 ? SLEM.GRAND : SLEM.SMALL
  await command(COMMAND.SELECT_SLEM, {slem: slem})
}

const discardCards = async ({cards_in_hand, cards_on_table, scoring_mode}) => {
  const toDiscard = cards_in_hand.sort(comparer(scoring_mode)).slice(0, 3)
  await command(COMMAND.DISCARD, {cards: toDiscard})
}

const gameLoop = async () => {
  let abort = false
  while(!abort) {
    let state = null
    try {
      state = await query(QUERY.STATE)

      if (state.phase === PHASE.DISCARD || state.current_player === state.your_position_at_table) {
        switch(state.phase) {
        case PHASE.SELECT_CARD:
          await selectCard(state)
          break
        case PHASE.SELECT_SLEM:
          await selectSlem(state)
          break
        case PHASE.DISCARD:
          await discardCards(state)
          break
        }
      } else {
        log('something went wrong')
        log(state)
      }

      await query(QUERY.WAIT)
    } catch (e) {
      if (e.code && e.code === 418) {
        log('game not started yet, waiting 1 sec')
      } else {
        console.error('[ERROR]', e)
        console.error('at', state)
      }
      await wait(1000)
    }
  }
}

gameLoop()
