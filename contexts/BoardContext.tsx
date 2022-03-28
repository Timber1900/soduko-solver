import { createContext, ReactNode, useEffect, useState } from 'react';

export interface BoardContextData {
  grid: number[],
  gridPossible: number[][],
  delay: number,
  curnum: number,
  changeGrid: (newGrid: number[]) => void,
  changeGridPossibleIndex: (index: number, value: number[], curGrid: number[][]) => Promise<void>,
  randomGrid: () => void,
  changeGridIndex: (index: number, value: number, curGrid: number[]) => Promise<void>,
  changeDelay: (newDelay: number) => void,
  solve: (grid: any[], n: number, solved: boolean, depth: number, gridPossible: number[][]) => Promise<void>
  runBenchmark: (iterations: number) => Promise<void>
}

export const BoardContext = createContext({} as BoardContextData);

interface BoardProviderProps {
  children: ReactNode;
}

export default function BoardProvider({ children }: BoardProviderProps) {
  const [delay, setDelay] = useState(0.1);
  const [grid, setGrid] = useState([]);
  const [gridPossible, setGridPossible] = useState([]);
  const [curnum, setCurnum] = useState(0);

  useEffect(() => {
    gridPossible.fill([], 0, 81);
    randomGrid();
    global.breaked = false;
    global.benchmark = false;
  }, [])

  useEffect(() => {
    global.delay = delay;
  }, [delay])

  const changeGrid = (newGrid: number[]) => {
    setGrid(newGrid);
  };

  const randomGrid = () => {
    return new Promise<void>(async (res, rej) => {
      global.breaked = true
      const result = await fetch("https://sugoku.herokuapp.com/board?difficulty=hard")
      const data = await result.json();
      setGrid(data.board.reduce((acc, value) => [...acc, ...value], []));
      res();
    })
  };

  const changeGridIndex = (index: number, value: number, curGrid: number[]) => {
    return new Promise<void>((res, rej) => {
      if(global.breaked) res()
      const newGrid = [...curGrid];
      newGrid[index] = value;
      setGrid(newGrid);
      setTimeout(() => res(), global.delay ?? 0);
    });
  };

  const changeGridPossibleIndex = (index: number, value: number[], curGrid: number[][]) => {
    return new Promise<void>((res, rej) => {
      if(global.breaked) res()
      const newGrid = [...curGrid];
      newGrid[index] = value;
      setGridPossible(newGrid);
      setTimeout(() => res(), global.delay ?? 0);
    });
  };

  const changeDelay = (newDelay: number) => {
    setDelay(newDelay);
  };

  const LINE_NUM = 9;

  const getLineValues = (grid, n) => {
    return grid.reduce((acc, value, index) => {
      if (Math.floor(index / LINE_NUM) === n) {
        return [...acc, value];
      }
      return acc;
    }, []);
  }

  const getColumnValues = (grid, n) => {
    return grid.reduce((acc, value, index) => {
      if (index - (Math.floor(index / LINE_NUM) * LINE_NUM) === n) {
        return [...acc, value];
      }
      return acc;
    }, []);
  }

  const getSquareValues = (grid, n) => {
    const startLine = Math.floor(n / 3) * 3;
    const startCol = (n % 3) * 3;
    return grid.reduce((acc, value, index) => {
      if (Math.floor(index / LINE_NUM) >= startLine && Math.floor(index / LINE_NUM) < startLine + 3 &&
          index - (Math.floor(index / LINE_NUM) * LINE_NUM) >= startCol && index - (Math.floor(index / LINE_NUM) * LINE_NUM) < startCol + 3) {
        return [...acc, value];
      }
      return acc;
    }, []);
  }

  const returnPossibleOptions = (grid, index) => {
    if(grid[index] != 0) return []
    const line = Math.floor(index / LINE_NUM);
    const lineValues = getLineValues(grid, line);
    const col = index - (line * LINE_NUM);
    const columnValues = getColumnValues(grid, col);
    const square = Math.floor(line / 3) * 3 + Math.floor(col / 3);
    const squareValues = getSquareValues(grid, square);
    const values = [...lineValues, ...columnValues, ...squareValues];
    const uniqueValuesSet = new Set(values);
    const uniqueValues = Array.from(uniqueValuesSet.values())
    return uniqueValues.reduce((acc, value) => acc.filter(v => v != value), [1,2,3,4,5,6,7,8,9]);
  }

  const getUniqueNumbers = (numbersArray: number[][]) => {
    const checkedNumbers = new Set<number>();
    const nonUniqueNumbers = new Set<number>();

    for (const numbers of numbersArray) {
      if(numbers) {
        for (const number of numbers) {
          if (!checkedNumbers.has(number)) {
            checkedNumbers.add(number);
          } else {
            nonUniqueNumbers.add(number);
          }
        }
      }
    }

    //get numbers of checkedNumbers that are not in nonUniqueNumbers
    const uniqueNumbers = Array.from(checkedNumbers).filter(number => !nonUniqueNumbers.has(number));

    const returnVal = [];

    for (const numb of uniqueNumbers) {
      const array = numbersArray.filter(n => n?.includes(numb))[0];
      const index = numbersArray.findIndex(val => val === array);
      returnVal.push({number: numb, index})
    }

    return returnVal;
  }

  const solve = async (grid: any[], n: number, solved: boolean, depth=0, gridPossible: number[][]) => {
    if(!global.benchmark) setCurnum(n)
    if(solved || global.breaked) return {grid, solved};
    if(grid.reduce((acc, val) => {
      if(val == 0) return false
      return acc
    }, true)) {
      return {grid, solved: true}
    }
    if(grid[n] != 0) return await solve(grid, n+1, false, depth+1, gridPossible);
    let tempGrid = [...grid];
    let tempGridPossible = [...gridPossible];
    let flag = false;
    for(let i = 0; i < grid.length; i++) {
      const value = grid[i];
      if(value == 0) {
        const possibleOptions = returnPossibleOptions(tempGrid, i);
        tempGridPossible[i] = [...possibleOptions];
        if(possibleOptions.length == 1 && i !== n) {
          tempGrid[i] = possibleOptions[0];
          flag = true;
        }
        if(possibleOptions.length === 0) {
          return {grid, solved: false}
        }
      }
    }

    for(let i = 0; i < LINE_NUM; i++) {
      const lineValuesPossible: number[][] = getLineValues(tempGridPossible, i);
      const colValuesPossible: number[][] = getColumnValues(tempGridPossible, i);
      const squareValuesPossible: number[][] = getSquareValues(tempGridPossible, i);

      for(const numbers of getUniqueNumbers(lineValuesPossible)) {
        const index = numbers.index;
        const number = numbers.number;
        const gridIndex = i * LINE_NUM + index;
        if(tempGrid[gridIndex] == 0) {
          tempGrid[gridIndex] = number;
          tempGridPossible[gridIndex] = [];
          flag = true;
        }
      }
      // for(const numbers of getUniqueNumbers(colValuesPossible)) {
      //   const index = numbers.index;
      //   const number = numbers.number;
      //   const gridIndex = i + index * LINE_NUM;
      //   if(tempGrid[gridIndex] == 0) {
      //     tempGrid[gridIndex] = number;
      //     tempGridPossible[gridIndex] = [];
      //     flag = true;
      //   }
      // }
      // for(const numbers of getUniqueNumbers(squareValuesPossible)) {
      //   const index = numbers.index;
      //   const number = numbers.number;
      //   //get grid index knowing that square is 3x3, i is the square number and index is the index of the number in the square
      //   const gridIndex = Math.floor(i / 3) * 3 + Math.floor(index / 3) * LINE_NUM + (i % 3) * 3 + (index % 3);
      //   if(tempGrid[gridIndex] == 0) {
      //     tempGrid[gridIndex] = number;
      //     tempGridPossible[gridIndex] = [];
      //     flag = true;
      //   }
      // }

    }


    if(!global.benchmark) await changeGridPossibleIndex(n, gridPossible[n], tempGridPossible);
    if(flag) {
      if(!global.benchmark) await changeGridIndex(n, grid[n], tempGrid);
      return await solve(tempGrid, n, false, depth+1, gridPossible);
    }
    let possibleOptions: number[] = tempGridPossible[n]
    possibleOptions = possibleOptions.reverse();
    for(let i = possibleOptions.length - 1; i >= 0; i--) {
      const tempGrid = [...grid];
      tempGrid[n] = possibleOptions[i];
      if(!global.benchmark) await changeGridIndex(n, possibleOptions[i], grid);
      possibleOptions.pop();
      const resolved = await solve(tempGrid, n+1, false, depth+1, tempGridPossible);
      if(resolved.solved) {
        if(global.breaked) return {grid, solved: true}
        return {grid: resolved.grid, solved: true}
      }
    }
    return {grid, solved: false}
  }

  const runBenchmark = async (iterations: number) => {
    global.benchmark = true;
    const times = [];
    for(let i = 0; i < iterations; i++) {
      await randomGrid();
      global.breaked = false;
      const startTime = new Date().getTime();
      const result = await solve(grid, 0, false, 0, gridPossible);
      if(!result.solved) {
        console.log(`Failed to solve in iteration ${i}`);
        return;
      }
      const endTime = new Date().getTime();
      times.push(endTime - startTime)
    }

    global.benchmark = false;
    console.log(`${iterations} iterations took ${times.reduce((acc, cur) => acc + cur, 0)} ms`);
    //display average iteration time
    const averageTime = times.reduce((acc, cur) => acc + cur, 0) / iterations;
    console.log(`Average iteration time: ${averageTime} ms`);
  }

  return (
    <BoardContext.Provider
      value={{
        grid,
        gridPossible,
        delay,
        curnum,
        changeGrid,
        randomGrid,
        changeGridIndex,
        changeGridPossibleIndex,
        changeDelay,
        solve,
        runBenchmark
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}
