import { useState, useEffect } from 'react';
import './App.css';

// Import our components
import Canvas from './components/Canvas';
import type { ThemeMode } from './components/Canvas';

// Import the AI service
import { generateSubtopics, generateMindMapStructure } from './services/aiService';

// Import html2canvas
import html2canvas from 'html2canvas';

// Define types for our mind map data
interface NodeData {
  id: string;
  text: string;
  children: NodeData[];
  x?: number;
  y?: number;
  isCollapsed?: boolean;
}

function App() {
  const [topic, setTopic] = useState('');
  const [mindMap, setMindMap] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Apply dark mode class to body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  const handleGenerateMap = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    
    try {
      // Generate a comprehensive mind map structure
      const structuredMindMap = await generateMindMapStructure(topic);
      
      // Create the root node
      const rootNode: NodeData = {
        id: 'root',
        text: topic,
        children: [],
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      
      // Convert the structured mind map to our NodeData format
      if (structuredMindMap && structuredMindMap.children) {
        // Process the first level of children
        const childNodes = structuredMindMap.children.map((child, index) => {
          // Calculate position in a circle around the root node
          const angle = (Math.PI * 2 / structuredMindMap.children.length) * index;
          const distance = 200; // Distance from root node
          
          const nodeId = `node-${Date.now()}-${index}`;
          
          // Create the child node
          const childNode: NodeData = {
            id: nodeId,
            text: child.text,
            children: [],
            x: rootNode.x! + Math.cos(angle) * distance,
            y: rootNode.y! + Math.sin(angle) * distance,
          };
          
          // Process the second level of children (sub-subtopics)
          if (child.children && child.children.length > 0) {
            childNode.children = child.children.map((subChild, subIndex) => {
              // Calculate position in a smaller circle around the child node
              const subAngle = (Math.PI * 2 / child.children.length) * subIndex;
              const subDistance = 120; // Distance from parent node
              
              return {
                id: `${nodeId}-sub-${subIndex}`,
                text: subChild.text,
                children: [],
                x: childNode.x! + Math.cos(subAngle) * subDistance,
                y: childNode.y! + Math.sin(subAngle) * subDistance,
              };
            });
          }
          
          return childNode;
        });
        
        rootNode.children = childNodes;
      } else {
        // Fallback to simple subtopics if the structure is invalid
        const subtopics = await generateSubtopics(topic);
        
        // Add subtopics as children to the root node
        const childNodes = subtopics.map((subtopic, index) => {
          // Calculate position in a circle around the root node
          const angle = (Math.PI * 2 / subtopics.length) * index;
          const distance = 150; // Distance from root node
          
          return {
            id: `node-${Date.now()}-${index}`,
            text: subtopic,
            children: [],
            x: rootNode.x! + Math.cos(angle) * distance,
            y: rootNode.y! + Math.sin(angle) * distance,
          };
        });
        
        rootNode.children = childNodes;
      }
      
      setMindMap(rootNode);
    } catch (error) {
      console.error('Error generating mind map:', error);
      
      // Fallback to a simple mind map structure
      const newMindMap = {
        id: 'root',
        text: topic,
        children: [],
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      
      setMindMap(newMindMap);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!mindMap) return;
    
    try {
      // Get the canvas element
      const canvasElement = document.querySelector('canvas');
      if (!canvasElement) {
        throw new Error('Canvas element not found');
      }
      
      // Create a screenshot of the canvas
      const canvas = await html2canvas(canvasElement);
      
      // Convert to PNG and trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `mind-map-${mindMap.text.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting mind map:', error);
      alert('Failed to export mind map. Please try again.');
    }
  };

  // Apply theme to header
  const getHeaderStyle = () => {
    if (theme === 'dark') {
      return { background: 'var(--dark-topbar)' };
    } else { // vibrant
      return { background: 'var(--vibrant-topbar-gradient)' };
    }
  };

  // Apply theme to button
  const getButtonStyle = () => {
    if (theme === 'dark') {
      return { 
        background: 'var(--dark-node-2)', 
        minWidth: '180px',
        boxShadow: '0 8px 12px rgba(0, 0, 0, 0.5)'
      };
    } else { // vibrant
      return { 
        background: 'var(--vibrant-node-2)', 
        minWidth: '180px',
        boxShadow: '0 8px 12px rgba(0, 0, 0, 0.3)'
      };
    }
  };

  // Apply theme to export button
  const getExportButtonStyle = () => {
    if (theme === 'dark') {
      return { background: 'var(--dark-node-1)' };
    } else { // vibrant
      return { background: 'var(--vibrant-node-1)' };
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}
    >
      {/* Top Bar */}
      <header 
        className="p-6 flex flex-col items-center shadow-md" 
        style={getHeaderStyle()}
      >
        <h1 className="text-3xl font-bold mb-5 font-poppins" style={{ color: theme === 'dark' ? 'white' : 'inherit' }}>Mind Map Builder</h1>
        
        {/* Centered Search Box */}
        <div className="flex items-center justify-center w-full max-w-3xl mb-5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 p-4 rounded-l-lg border-0 outline-none font-poppins text-xl"
            style={{ 
              backgroundColor: theme === 'dark' ? 'var(--gray-700)' : 'white',
              color: theme === 'dark' ? 'white' : 'inherit'
            }}
          />
          <button
            onClick={handleGenerateMap}
            className="px-10 py-4 rounded-r-lg font-poppins flex items-center justify-center text-2xl font-bold w-full max-w-xs"
            disabled={isLoading}
            style={{ 
              ...getButtonStyle(),
              color: theme === 'dark' ? 'white' : 'white'
            }}
          >
            {isLoading ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : 'Generate'}
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleExport}
            className="px-6 py-3 rounded-lg font-poppins flex items-center text-lg font-semibold"
            style={{ 
              ...getExportButtonStyle(),
              color: 'white'
            }}
          >
            <span className="mr-2">📥</span> Export PNG
          </button>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--background-color)' }}>
        {mindMap ? (
          <Canvas mindMap={mindMap} setMindMap={setMindMap} theme={theme} setTheme={setTheme} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div 
              className="text-center max-w-md p-6 rounded-lg shadow-lg"
              style={{ 
                backgroundColor: theme === 'dark' ? 'var(--dark-node-1)' : 'white',
                color: theme === 'dark' ? 'white' : 'inherit'
              }}
            >
              <h2 className="text-xl font-semibold mb-4 font-poppins">Welcome to Mind Map Builder!</h2>
              <p className="mb-6 font-poppins" style={{ color: theme === 'dark' ? 'var(--gray-300)' : 'var(--gray-600)' }}>
                Enter a topic in the search box above and click "Generate" to create an interactive mind map.
              </p>
              <div className="flex justify-center">
                <div 
                  className="w-16 h-16 rounded-full animate-pulse"
                  style={{ 
                    backgroundColor: theme === 'dark' ? 'var(--dark-node-2)' : 
                                   theme === 'vibrant' ? 'var(--vibrant-node-2)' : 
                                   'var(--pastel-blue)' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
