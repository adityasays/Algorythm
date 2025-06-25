import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/nav';
import ProfilePage from './components/pages/profile';
import Resources from './components/pages/resources';
import Home from './components/pages/home';

import AuthWrapper from './components/AuthWrapper';
import PreviousContests from './components/pages/previouscontests';
import Footer from './components/ui/footer';
import BlogDetailPage from './components/BlogDetailPage';

import BlogPage from './components/pages/Blogpage';
function App() {
  return (
    <BrowserRouter>
      <div>
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resources" element={<Resources />} />
            
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/username/:username" element={<ProfilePage />} />
            <Route path="/user" element={<AuthWrapper />} />
            <Route path="/past-contests" element={<PreviousContests />} />
             <Route path="/blogs" element={<BlogPage />} />
       <Route path="/blogs/:blogId" element={<BlogDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;