/* globals describe, it, before */
/* eslint no-unused-expressions: 0 */

const chai = require('chai')
const expect = chai.expect
const config = require('config')

const Constants = require('../../../const')
const GameModel = require('../game-model')

const VALID_PLAYER_HEALTH = config.client.playerHealth
const VALID_GAME_SERVER_URL = config.client.serverUrl

const INVALID_PLAYER_HEALTH = 0

const MOCK_PATH_ROOM_0_1 = '/room/0/1'
const MOCK_PATH_ROOM_0_2 = '/room/0/2'
const MOCK_PATH_ROOM_0_3 = '/room/0/3'
const MOCK_PATH_ROOM_0_4 = '/room/0/4' // This is an invalid room for a 4 x 4 map
const MOCK_PATH_ROOM_1_3 = '/room/1/3'
const MOCK_PATH_ROOM_1_2 = '/room/1/2'

describe('game-model tests', () => {
  it('should have correct config for testing environment', () => {
    expect(VALID_PLAYER_HEALTH).to.equal(5)
  })
  describe('Module structure tests', () => {
    it('should have creating function create(playerHealth, gameServerUrl, fetchLib)', () => {
      expect(GameModel.create, 'Im too lazy to implement this function').to.exist
    })
  })
  describe('game object creating function tests', () => {
    let game
    let invalidGame
    const responseForValidRoom = (text) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => {
          return Promise.resolve(text)
        }
      })
    }
    const responseForInvalidRoom = () => {
      return Promise.resolve({
        ok: false,
        status: 400,
        text: () => {
          return Promise.resolve('')
        }
      })
    }
    const mockFetchLib = async (url) => {
      switch (url) {
        case VALID_GAME_SERVER_URL + MOCK_PATH_ROOM_0_1:
          // Room 0,1
          return responseForValidRoom(Constants.DUNGEON_ROOM_WITH_GOLD_STRING)
        case VALID_GAME_SERVER_URL + MOCK_PATH_ROOM_0_2:
          // Room 0,2
          return responseForValidRoom(Constants.DUNGEON_ROOM_WITH_MONSTER_STRING)
        case VALID_GAME_SERVER_URL + MOCK_PATH_ROOM_0_3:
          // Room 0,3
          return responseForValidRoom(Constants.DUNGEON_ROOM_WITH_MONSTER_STRING)
        case VALID_GAME_SERVER_URL + MOCK_PATH_ROOM_0_4:
          // Room 0,4
          return responseForInvalidRoom()
        case VALID_GAME_SERVER_URL + MOCK_PATH_ROOM_1_3:
          // Room 1,3
          return responseForValidRoom(Constants.DUNGEON_ROOM_WITH_GOLD_STRING)
        case VALID_GAME_SERVER_URL + MOCK_PATH_ROOM_1_2:
          // Room 1,2
          return responseForValidRoom(Constants.DUNGEON_ROOM_WITH_MONSTER_STRING)
        default:
          throw new Error('Not implemented mockup')
      }
    }
    before(() => {
      // A game object has following functions
      // Storing player's HEALTH
      // Storing room x,y the player has visited
      // Moving/Blocking player to new room and sending resquest to game server for the content of certain rooms
      // Modifing players HEALTH deponds on the content of rooms
      // Return current players status

      game = GameModel.create(VALID_PLAYER_HEALTH, VALID_GAME_SERVER_URL, mockFetchLib)
      invalidGame = GameModel.create(INVALID_PLAYER_HEALTH, VALID_GAME_SERVER_URL, mockFetchLib)
    })
    it('should create a valid Game object for valid parameters', () => {
      expect(game, 'Game object should be created').to.exist
    })
    it('should place player at start room', () => {
      // Ready player one
      const player = game.getPlayer()
      expect(player.health, 'Player should have 5 health').to.equal(5)
      expect(player.x, 'Player should at x 0').to.equal(0)
      expect(player.y, 'Player should at y 0').to.equal(0)
      expect(player.gold, 'Player should NOT have any Gold').to.equal(0)
    })
    it('should move player around on the map', async () => {
      // This test will simulate movements as following
      // East -> East -> East -> East -> North -> West -> South
      // As a result, the game client will try to move player as following
      // 0,0 -> 0,1 -> 0,2 -> 0,3 -> 0,4 (Invalid, stay at 0,3) -> 1,3 -> 1,2 -> 0,2

      // Moving EAST
      let result = await game.move(Constants.DIRECTION_EAST)
      let player = result.player
      // Gold o(*￣▽￣*)o
      expect(result.isMoved, 'Player should move').to.be.true
      expect(result.isVisited, 'Player should NOT visite this room').to.be.false
      expect(result.isMonster, 'Player should NOT encounter a Monster').to.be.false
      expect(player.health, 'Player should have 5 health').to.equal(5)
      expect(player.x, 'Player should at x 0').to.equal(0)
      expect(player.y, 'Player should at y 1').to.equal(1)
      expect(player.gold, 'Player should earn a Gold').to.equal(1)
      // Moving EAST
      result = await game.move(Constants.DIRECTION_EAST)
      player = result.player
      // Monster (╯°Д°)╯︵ ┻━┻
      expect(result.isMoved, 'Player should move').to.be.true
      expect(result.isVisited, 'Player should NOT visite this room').to.be.false
      expect(result.isMonster, 'Player should encounter a Monster').to.be.true
      expect(player.health, 'Player should lose 1 health').to.equal(4)
      expect(player.x, 'Player should at x 0').to.equal(0)
      expect(player.y, 'Player should at y 1').to.equal(2)
      expect(player.gold, 'Player should have 1 Gold').to.equal(1)
      // Moving EAST
      result = await game.move(Constants.DIRECTION_EAST)
      player = result.player
      // Monster
      expect(result.isMoved, 'Player should move').to.be.true
      expect(result.isVisited, 'Player should NOT visite this room').to.be.false
      expect(result.isMonster, 'Player should encounter a Monster').to.be.true
      expect(player.health, 'Player should lose 1 health').to.equal(3)
      expect(player.x, 'Player should at x 0').to.equal(0)
      expect(player.y, 'Player should at y 3').to.equal(3)
      expect(player.gold, 'Player should have 1 Gold').to.equal(1)
      // Moving EAST
      result = await game.move(Constants.DIRECTION_EAST)
      player = result.player
      // Wall, so stay at 0,3
      expect(result.isMoved, 'Player should NOT move').to.be.false
      expect(result.isVisited, 'Player should NOT visite this room').to.be.false
      expect(result.isMonster, 'Player should NOT encounter a Monster').to.be.false
      expect(player.health, 'Player should have 3 health').to.equal(3)
      expect(player.x, 'Player should at x 0').to.equal(0)
      expect(player.y, 'Player should at y 3').to.equal(3)
      expect(player.gold, 'Player should have 1 Gold').to.equal(1)
      // Moving NORTH
      result = await game.move(Constants.DIRECTION_NORTH)
      player = result.player
      // Gold
      expect(result.isMoved, 'Player should move').to.be.true
      expect(result.isVisited, 'Player should NOT visite this room').to.be.false
      expect(result.isMonster, 'Player should NOT encounter a Monster').to.be.false
      expect(player.health, 'Player should have 3 health').to.equal(3)
      expect(player.x, 'Player should at x 1').to.equal(1)
      expect(player.y, 'Player should at y 3').to.equal(3)
      expect(player.gold, 'Player should earn another Gold').to.equal(2)
      // Moving WEST
      result = await game.move(Constants.DIRECTION_WEST)
      player = result.player
      // Monster
      expect(result.isMoved, 'Player should move').to.be.true
      expect(result.isVisited, 'Player should NOT visite this room').to.be.false
      expect(result.isMonster, 'Player should encounter a Monster').to.be.true
      expect(player.health, 'Player should lose 1 health').to.equal(2)
      expect(player.x, 'Player should at x 1').to.equal(1)
      expect(player.y, 'Player should at y 2').to.equal(2)
      expect(player.gold, 'Player should have 2 Gold').to.equal(2)
      // Moving SOUTH
      result = await game.move(Constants.DIRECTION_SOUTH)
      player = result.player
      // Visted before, empty room
      expect(result.isMoved, 'Player should move').to.be.true
      expect(result.isVisited, 'Player should visite this room').to.be.true
      expect(result.isMonster, 'Player should NOT encounter a Monster').to.be.false
      expect(player.health, 'Player should have 2 health').to.equal(2)
      expect(player.x, 'Player should at x 0').to.equal(0)
      expect(player.y, 'Player should at y 2').to.equal(2)
      expect(player.gold, 'Player should have 2 Gold').to.equal(2)
    })
    it('should NOT create a game object for invalid parameters', () => {
      expect(invalidGame, 'Game with invalid parameters should NOT be created').to.not.exist
    })
  })
})
