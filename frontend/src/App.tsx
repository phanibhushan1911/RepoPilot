import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import WorkspacePage from './pages/WorkspacePage'

function App() {
    return (
        <>
            <div className="gradient-bg" />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
            </Routes>
        </>
    )
}

export default App
