"use client";
import React, { useState, useEffect } from 'react';
import { Terminal, Github, Linkedin, Twitter, ArrowUp, Mail, Code, Star, Coffee, Heart } from 'lucide-react';

const Footer = () => {
  const [hoverIcon, setHoverIcon] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Show scroll-to-top button when page is scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const links = [
    { 
      title: "Resources", 
      items: [
        { name: "Algorithms", href: "" },
        { name: "Data Structures", href: "" },
        { name: "Problem Sets", href: "" },
        { name: "Prior OA Questions", href: "" },
        { name: "Tutorials", href: "" }
      ] 
    },
    { 
      title: "Leaderboard", 
      items: [
        { name: "College Rankings", href: "" },
        { name: "Hall of Fame", href: "" },
        { name: "Past Challenges", href: "" },
        { name: "POTD", href: "" }
      ] 
    },
    { 
      title: "Community", 
      items: [
        { name: "Discussion Forum", href: "" },
        { name: "Study Groups", href: "" },
        { name: "Events", href: "" },
        { name: "Contribute", href: "" }
      ] 
    },
  ];

  const socialLinks = [
    { icon: <Github />, name: "github", href: "https://github.com/algorythm-org", ariaLabel: "Visit GitHub" },
    { icon: <Twitter />, name: "twitter", href: "https://twitter.com/algorythm_org", ariaLabel: "Visit Twitter" },
    { icon: <Linkedin />, name: "linkedin", href: "https://linkedin.com/company/algorythm-org", ariaLabel: "Visit LinkedIn" },
    { icon: <Mail />, name: "mail", href: "mailto:contact@algorythm.org", ariaLabel: "Send Email" }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-neutral-800/70 relative overflow-hidden" aria-label="Site footer">
      {/* Gradient orbs in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative">
        {/* Back to top button - shows only when scrolled and has clear accessibility */}
        {showScrollButton && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 transform transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5 text-white" />
          </button>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="transform transition-all duration-500 hover:rotate-180">
                <Terminal className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              </div>
              <span className="ml-2 text-white font-mono text-xl tracking-tight">
                <span className="font-bold">Algo</span>
                <span className="text-cyan-400">rythm</span>
              </span>
            </div>
            <p className="text-neutral-400 text-sm max-w-xs">
              Empowering competitive programmers with resources, contests, and community to sharpen their algorithmic skills.
            </p>
            
            {/* Social links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-all duration-200 transform hover:scale-110 hover:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  onMouseEnter={() => setHoverIcon(social.name)}
                  onMouseLeave={() => setHoverIcon(null)}
                  aria-label={social.ariaLabel}
                >
                  {React.cloneElement(social.icon, { 
                    className: `h-4 w-4 ${hoverIcon === social.name ? 'text-cyan-400' : 'text-neutral-400'}`,
                    'aria-hidden': 'true'
                  })}
                </a>
              ))}
            </div>
          </div>
          
          {/* Links columns - properly aligned in a row */}
          {links.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className="text-white text-base font-semibold mb-2">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a
                      href={link.href}
                      className="text-neutral-400 hover:text-cyan-400 text-sm flex items-center transition-all duration-200 hover:translate-x-1 group focus:outline-none focus:text-cyan-400"
                    >
                      <Code className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500" aria-hidden="true" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom bar */}
      <div className="border-t border-neutral-800/70 backdrop-blur-md py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-500 text-sm text-center md:text-left">
            © {currentYear} AlgoRythm. All rights reserved.
          </p>
          
          <div className="flex items-center flex-wrap justify-center mt-4 md:mt-0 text-neutral-500 text-sm gap-3">
            <a 
              href="https://github.com/algorythm-org/algorythm" 
              className="flex items-center hover:text-cyan-400 transition-colors focus:outline-none focus:text-cyan-400"
              aria-label="Star our GitHub repository"
            >
              <Star className="h-3 w-3 mr-1 text-amber-400" aria-hidden="true" />
              <span>Star Repository</span>
            </a>
            
            <span className="text-neutral-700 hidden sm:inline">•</span>
            
            <a 
              href="/sponsor" 
              className="flex items-center hover:text-cyan-400 transition-colors focus:outline-none focus:text-cyan-400"
              aria-label="Sponsor AlgoRythm"
            >
              <Coffee className="h-3 w-3 mr-1 text-amber-600" aria-hidden="true" />
              <span>Sponsor</span>
            </a>
            
            <span className="text-neutral-700 hidden sm:inline">•</span>
            
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1 text-red-500" aria-hidden="true" />
              <span>Made with passion</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;