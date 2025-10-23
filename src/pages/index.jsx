import Layout from "./Layout.jsx";

import Feed from "./Feed";

import Sources from "./Sources";

import TelegramSettings from "./TelegramSettings";

import ChannelSettings from "./ChannelSettings";

import CodeDoctor from "./CodeDoctor";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Feed: Feed,
    
    Sources: Sources,
    
    TelegramSettings: TelegramSettings,
    
    ChannelSettings: ChannelSettings,
    
    CodeDoctor: CodeDoctor,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Feed />} />
                
                
                <Route path="/Feed" element={<Feed />} />
                
                <Route path="/Sources" element={<Sources />} />
                
                <Route path="/TelegramSettings" element={<TelegramSettings />} />
                
                <Route path="/ChannelSettings" element={<ChannelSettings />} />
                
                <Route path="/CodeDoctor" element={<CodeDoctor />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}