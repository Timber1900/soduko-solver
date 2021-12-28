import { createContext, ReactNode, useEffect, useState } from 'react';

export interface BoardContextData {
  grid: number[],
  gridPossible: number[][],
  delay: number,
  changeGrid: (newGrid: number[]) => void,
  changeGridPossibleIndex: (index: number, value: number[], curGrid: number[][]) => Promise<void>,
  randomGrid: () => void,
  changeGridIndex: (index: number, value: number, curGrid: number[]) => Promise<void>,
  changeDelay: (newDelay: number) => void,
  solve: (grid: any[], n: number, solved: boolean, depth: number, gridPossible: number[][]) => Promise<void>
}

export const BoardContext = createContext({} as BoardContextData);

interface BoardProviderProps {
  children: ReactNode;
}

export default function BoardProvider({ children }: BoardProviderProps) {
  const [delay, setDelay] = useState(0.1);
  const [grid, setGrid] = useState([]);
  const [gridPossible, setGridPossible] = useState([]);

  useEffect(() => {
    gridPossible.fill([], 0, 81);
    randomGrid();
    global.breaked = false;
  }, [])

  useEffect(() => {
    global.delay = delay;
  }, [delay])

  const changeGrid = (newGrid: number[]) => {
    setGrid(newGrid);
  };

  const randomGrid = () => {
    global.breaked = true
    //fetch a new grid
    fetch("https://sugoku.herokuapp.com/board?difficulty=hard")
      .then(res => res.json())
      .then(data => {
        //reduce 2d array to 1d array
        setGrid(data.board.reduce((acc, value) => [...acc, ...value], []));
      }
    );
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

  const solve = async (grid: any[], n: number, solved: boolean, depth=0, gridPossible: number[][]) => {
    if(solved || global.breaked) return {grid, solved};

    if(grid.reduce((acc, val) => {
      if(val == 0) return false
      return acc
    }, true)) {
      return {grid, solved: true}
    }

    if(grid[n] != 0) return await solve(grid, n+1, false, depth+1, gridPossible);

    let possibleOptions: number[] = returnPossibleOptions(grid, n)
    if(possibleOptions.length == 0) return {grid, solved: false}

    possibleOptions = possibleOptions.reverse();

    for(let i = possibleOptions.length - 1; i >= 0; i--) {
      const tempGrid = [...grid];
      tempGrid[n] = possibleOptions[i];
      await changeGridIndex(n, possibleOptions[i], grid);
      possibleOptions.pop();
      const tempGridPossible = [...gridPossible]
      tempGridPossible[n] = possibleOptions;
      await changeGridPossibleIndex(n, possibleOptions, gridPossible);
      const resolved = await solve(tempGrid, n+1, false, depth+1, tempGridPossible);
      if(resolved.solved) {
        if(global.breaked) return {grid, solved: true}
        return {grid: resolved.grid, solved: true}
      }
    }
    return {grid, solved: false}
  }

  return (
    <BoardContext.Provider
      value={{
        grid,
        gridPossible,
        delay,
        changeGrid,
        randomGrid,
        changeGridIndex,
        changeGridPossibleIndex,
        changeDelay,
        solve
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}
