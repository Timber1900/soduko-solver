import Head from 'next/head'
import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react'
import { BoardContext } from '../contexts/BoardContext';

export default function Home() {
  const [edit, setEdit] = useState(false);
  const shape = Array(9).fill(Array(9).fill(0));
  const {grid, changeGridIndex, randomGrid, gridPossible, changeGridPossibleIndex, delay, changeDelay, solve} = useContext(BoardContext);

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

    //check if event.key is tab
    if (event.key === 'Tab') moveBy(1)
    //check if event.key is backspace
    if (event.key === 'Backspace') moveBy(-1)
    //cehck if event.key is up arrow
    if (event.key === 'ArrowUp') moveBy(-9)
    //check if event.key is down arrow
    if (event.key === 'ArrowDown') moveBy(9)
    //check if event.key is left arrow
    if (event.key === 'ArrowLeft') moveBy(-1)
    //check if event.key is right arrow
    if (event.key === 'ArrowRight') moveBy(1)

    console.log(event.key)
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-gray-300">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className='max-h-[80%] max-w-[80%] w-4/5 aspect-square grid grid-cols-3 grid-rows-3 border_custom rounded-sm text-2xl bg-white'>
        {shape.map((row, largeSquareIndex) => {
          return <div className='border border-black w-full h-full grid grid-cols-3 grid-rows-3' key={largeSquareIndex}>
            {row.map((val, smallSquareIndex) => {
              //convert from large square index and small square index to row and col
              const row = Math.floor(largeSquareIndex / 3) * 3 + Math.floor(smallSquareIndex / 3)
              const col = (largeSquareIndex % 3) * 3 + (smallSquareIndex % 3)
              //convert from row and col to index
              const index = row * 9 + col

              return <div className={`${grid[index] ?? 0 == 0 ? "text-black": "text-gray-400"} border-[.5px] border-gray-400 w-full h-full grid place-content-center relative focus-within:text-3xl transition-all`} key={`col${smallSquareIndex}row${largeSquareIndex}`}>
                <p id={`${index}`} className='focus:outline-none' contentEditable={edit} onKeyDown={onValChange} suppressContentEditableWarning={true}>{grid[index] ?? 0}</p>
                <div className='absolute text-sm text-gray-500 right-0 bottom-0'>
                  <p>
                    {gridPossible[index]?.reduce((acc, val) => acc ? `${acc}, ${val}` : `${val}`, "") ?? ""}
                  </p>
                </div>
              </div>
            })}
          </div>
        })}
      </div>
      <div className='mt-12 flex flex-row flex-wrap gap-12 text-xl items-center justify-center'>
        <button className='px-4 py-1 outline outline-black bg-white rounded-md' onClick={solveButton}>Solve</button>
        <button className='px-4 py-1 outline outline-black bg-white rounded-md' onClick={randomGrid}>Reset</button>
        <div className='flex flex-row justify-center items-center px-4 py-1 outline outline-black bg-white rounded-md'>
          <input className="form-check-input appearance-none h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer" type="checkbox" onChange={val => setEdit(val.currentTarget.checked)}/>
          <label className="form-check-label inline-block text-gray-800">
            Edit mode
          </label>
        </div>
        <div className='flex flex-row justify-center items-center px-4 py-1 outline outline-black bg-white rounded-md'>
          <input max={1000} min={0} type="number" defaultValue={delay ?? 0} onChange={val => changeDelay(parseInt(val.currentTarget.value))}/>
          <label>Delay</label>
        </div>
      </div>
    </div>
  )
}
