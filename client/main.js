import { Meteor } from 'meteor/meteor'
import React from 'react'
import { render } from 'react-dom'
import CONSTANTS from './constants'

const { EMP, BLK, WHT } = CONSTANTS

// create 8x8 matrix and initialize values on the board
function getInitData() {
  const data = new Array(8).fill().map(() => new Array(8).fill(EMP))
  data[3][3] = BLK
  data[4][4] = BLK
  data[3][4] = WHT
  data[4][3] = WHT
  return data
}

class GameContainer extends React.Component {
  state = {
    currentStep: 0,
    currentPlayer: 1,
    isAIThinking: false,
    data: getInitData(),
  }

  getCurrentPlayerColor() {
    return this.state.currentPlayer === 1 ? BLK : WHT
  }

  getNextPlayerColor() {
    return this.state.currentPlayer === 1 ? WHT : BLK
  }

  checkSlots(slotsNeedsToChange, row, col, dx, dy) {
    const data = this.state.data
    const currentSlot = data[row][col]
    if (currentSlot !== EMP) return
    const tempSlots = []

    while(col >= 0 && col < 8 && row >= 0 && row < 8) {
      row += dx
      col += dy

      if (col < 0 || col >= 8 || row < 0 || row >= 8) return
      const currentSlot = data[row][col]
      if (currentSlot === this.getCurrentPlayerColor()) {
        if (tempSlots.length > 0) {
          slotsNeedsToChange.splice(0, 0, ...tempSlots)
          break
        } else {
          break
        }
      } else if (currentSlot === EMP) {
        break
      } else if (currentSlot === this.getNextPlayerColor()) {
        tempSlots.push([row, col])
      }
    }
  }

  clickSlot = (rowIndex, colIndex, isTest) => {
    const slotsNeedsToChange = []
    const currentPlayer = this.state.currentPlayer
    
    // check all 8 directions
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, 1, 0) // vertical down
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, -1, 0) // vertical up
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, 0, 1)
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, 0, -1)
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, 1, 1)
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, 1, -1)
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, -1, 1)
    this.checkSlots(slotsNeedsToChange, rowIndex, colIndex, -1, -1)

    if (currentPlayer === 2 || isTest) {
      return slotsNeedsToChange
    }

    this.putInSlot(rowIndex, colIndex, slotsNeedsToChange)
  }

  putInSlot(rowIndex, colIndex, slotsNeedsToChange) {
    const { currentPlayer, data } = this.state
    let currentStep = this.state.currentStep
    let switchPlayer = false
    let nextPlayer
    const currentPlayerColor = this.getCurrentPlayerColor()

    // check if current slot is valid
    if (slotsNeedsToChange.length > 0) {
      data[rowIndex][colIndex] = currentPlayerColor
      slotsNeedsToChange.forEach((dataXY) => {
        data[dataXY[0]][dataXY[1]] = currentPlayerColor
      })
      slotsNeedsToChange.length = 0
      switchPlayer = true
      currentStep++
      if (currentPlayer === 1) {
        nextPlayer = 2
      } else {
        nextPlayer = 1
      }
      this.setState({ currentStep, data, currentPlayer: switchPlayer ? nextPlayer : currentPlayer })
    }
  }

  endGame(options = {}) {
    let blackCount = 0
    let whiteCount = 0
    this.state.data.forEach((rows) => {
      rows.forEach((status) => {
        if (status === BLK) {
          blackCount++
        } else if (status === WHT) {
          whiteCount++
        }
      })
    })
    const winner = blackCount > whiteCount ? 'You' : 'AI'
    const resetedData = getInitData()
    alert(`Game Over ${options.noMoreValidStep ? '(No more valid step)' : ''}\n\n Black: ${blackCount}\n White: ${whiteCount}\n\n ${winner} Won!`)
    this.setState({
      data: resetedData,
      currentStep: 0,
      currentPlayer: 1,
    })
  }

  AIRun(options = {}) {
    const { data, currentStep } = this.state
    const nextStepChoices = []
    data.forEach((rows, rowIndex) => {
      rows.forEach((status, colIndex) => {
        const slotsNeedsToChange = this.clickSlot(rowIndex, colIndex, options.test)
        if (slotsNeedsToChange.length > 0) {
          nextStepChoices.push({ rowIndex, colIndex, slotsNeedsToChange })
        }
      })
    })

    if (nextStepChoices.length === 0 && currentStep < 60) {
      return setTimeout(() => {
        this.endGame({ noMoreValidStep: true })
      }, 500)
    }

    if (options.test) {
      return
    }

    let max = 0
    let maxIndex
    nextStepChoices.forEach((choice, index) => {
      const len = choice.slotsNeedsToChange.length
      if (choice.slotsNeedsToChange.length > max) {
        max = len
        maxIndex = index
      }
    })
    const { rowIndex, colIndex, slotsNeedsToChange } = nextStepChoices[maxIndex]
    setTimeout(() => {
      this.putInSlot(rowIndex, colIndex, slotsNeedsToChange)
    }, 500)
  }

  componentDidUpdate() {
    const { currentStep, currentPlayer, isAIThinking } = this.state
    
    if (currentPlayer === 2 && !isAIThinking) {
      this.AIRun()
    } else if (currentPlayer === 1) {
      this.AIRun({ test: true })
    }
    if (currentStep === 60) {
      // end game when board is full
      return setTimeout(() => {
        this.endGame()
      }, 500)
    }
  }

  render() {
    const { currentPlayer, data } = this.state
    return (
      <div>
        <h1>Current Player: </h1>
        <h2>{currentPlayer === 1 ? 'Black' : 'White'}</h2>
        <div id="bg">
          {data.map((rows, rowIndex) => (
            rows.map((status, index) =>
              <div key={`${rowIndex}${index}`} className="slot" onClick={() => this.clickSlot(rowIndex, index)}>
                <Slot status={status} />
              </div>,
            )
          ))}
        </div>
      </div>
    )
  }
}

const Slot = ({ status }) => {
  return <div className={`slot ${status}`} />
}

Meteor.startup(() => {
  render(<GameContainer />, document.getElementById('react-root'))
})
