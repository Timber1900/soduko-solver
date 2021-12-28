import BoardProvider from '../contexts/BoardContext'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return(
    <BoardProvider>
      <Component {...pageProps} />
    </BoardProvider>
  )
}

export default MyApp
