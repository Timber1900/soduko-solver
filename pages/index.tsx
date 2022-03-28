import Head from 'next/head'
import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react'
import { BoardContext } from '../contexts/BoardContext';

export default function Home() {
  const [edit, setEdit] = useState(false);
  const shape = Array(9).fill(Array(9).fill(0));
  const {grid, changeGridIndex, randomGrid, gridPossible, changeGridPossibleIndex, delay, changeDelay, solve, curnum, runBenchmark} = useContext(BoardContext);

  const solveButton = async () => {
    const result = await solve(grid, 0, false, 0, gridPossible)
    global.breaked = false;
    const tempGridPossible = [...gridPossible];
    tempGridPossible.fill([], 0, 81);
    changeGridPossibleIndex(0, [], tempGridPossible);
  }

  const onValChange = (event: KeyboardEvent<HTMLParagraphElement>) => {
    event.preventDefault()

    //check if event.key is a number
    if (event.key.match(/^[0-9]$/)) {
      const { id } = event.currentTarget as HTMLParagraphElement;
      changeGridIndex(parseInt(id), parseInt(event.key), grid);
      const nextTarget = parseInt(id) + 1;

      const mainDiv = event.currentTarget.parentElement.parentElement.parentElement;

      for(let i = 0; i < mainDiv.children.length; i++) {
        const child = mainDiv.children[i];
        for(let j = 0; j < child.children.length; j++) {
          const grandChild = child.children[j];
          for(let k = 0; k < grandChild.children.length; k++) {
            const greatGrandChild = grandChild.children[k];
            if(greatGrandChild.id === nextTarget.toString()) {
              //@ts-expect-error
              greatGrandChild.focus();
              return;
            }
          }
        }
      }

      event.currentTarget.blur();
    }

    const moveBy = (n) => {
      const { id } = event.currentTarget as HTMLParagraphElement;
      const nextTarget = parseInt(id) + n;

      const mainDiv = event.currentTarget.parentElement.parentElement.parentElement;

      for(let i = 0; i < mainDiv.children.length; i++) {
        const child = mainDiv.children[i];
        for(let j = 0; j < child.children.length; j++) {
          const grandChild = child.children[j];
          for(let k = 0; k < grandChild.children.length; k++) {
            const greatGrandChild = grandChild.children[k];
            if(greatGrandChild.id === nextTarget.toString()) {
              //@ts-expect-error
              greatGrandChild.focus();
              return;
            }
          }
        }
      }
    }

    if (event.key === 'Tab') moveBy(1)
    if (event.key === 'Backspace') moveBy(-1)
    if (event.key === 'ArrowUp') moveBy(-9)
    if (event.key === 'ArrowDown') moveBy(9)
    if (event.key === 'ArrowLeft') moveBy(-1)
    if (event.key === 'ArrowRight') moveBy(1)
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-gray-300">
      <Head>
        <title>Soduko Solver</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className='max-h-[80%] max-w-[80%] w-4/5 aspect-square grid grid-cols-3 grid-rows-3 border_custom rounded-sm text-2xl bg-white'>
        {shape.map((row, largeSquareIndex) => {
          return <div className='grid w-full h-full grid-cols-3 grid-rows-3 border border-black' key={largeSquareIndex}>
            {row.map((val, smallSquareIndex) => {
              const row = Math.floor(largeSquareIndex / 3) * 3 + Math.floor(smallSquareIndex / 3)
              const col = (largeSquareIndex % 3) * 3 + (smallSquareIndex % 3)
              const index = row * 9 + col

              return <div className={`${grid[index] ?? 0 == 0 ? "text-black": "text-gray-400"} border-[.5px] border-gray-400 w-full h-full grid place-content-center relative focus-within:text-3xl md:text-2xl sm:text-lg text-base transition-all ${index === curnum ? "bg-red-200" : "bg-white"}`} key={`col${smallSquareIndex}row${largeSquareIndex}`}>
                <p id={`${index}`} className='focus:outline-none' inputMode='decimal' contentEditable={edit} onKeyDown={onValChange} suppressContentEditableWarning={true}>{grid[index] ?? 0}</p>
                <div className='absolute inset-0 flex flex-col items-end justify-end text-xs text-gray-500 pointer-events-none md:text-sm'>
                  <p className='max-w-full truncate px-0.5'>
                    {gridPossible[index]?.reduce((acc, val) => acc ? `${acc}, ${val}` : `${val}`, "") ?? ""}
                  </p>
                </div>
              </div>
            })}
          </div>
        })}
      </div>
      <div className='flex flex-row flex-wrap items-center justify-center gap-12 mt-12 text-xl'>
        <button className='px-4 py-1 bg-white rounded-md outline outline-black' onClick={solveButton}>Solve</button>
        <button className='px-4 py-1 bg-white rounded-md outline outline-black' onClick={randomGrid}>Reset</button>
        <div className='flex flex-row items-center justify-center px-4 py-1 bg-white rounded-md outline outline-black'>
          <input className="float-left w-4 h-4 mt-1 mr-2 align-top transition duration-200 bg-white bg-center bg-no-repeat bg-contain border border-gray-300 rounded-sm appearance-none cursor-pointer form-check-input checked:bg-blue-600 checked:border-blue-600 focus:outline-none" type="checkbox" onChange={val => setEdit(val.currentTarget.checked)}/>
          <label className="inline-block text-gray-800 form-check-label">
            Edit mode
          </label>
        </div>
        <div className='flex flex-row items-center justify-center px-4 py-1 bg-white rounded-md outline outline-black'>
          <input max={1000} min={0} type="number" defaultValue={delay ?? 0} onChange={val => changeDelay(parseInt(val.currentTarget.value))}/>
          <label>Delay</label>
        </div>
        <button className='px-4 py-1 bg-white rounded-md outline outline-black' onClick={() =>{runBenchmark(200)}}>Benchmark</button>
      </div>
    </div>
  )
}
