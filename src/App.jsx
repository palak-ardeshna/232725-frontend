import React from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './routes/index.jsx'
import './index.css'
import './styles/index.scss'
import { ThemeProvider } from './common/theme/ThemeContext'
import { AnimatePresence } from 'framer-motion'


function App() {

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        <RouterProvider
          router={router}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        />
      </AnimatePresence>
    </ThemeProvider>
  )
}

export default App;

