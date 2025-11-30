import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import { useStore } from './store/useStore';

function App() {
  const loadPolygons = useStore((state) => state.loadPolygons);

  useEffect(() => {
    // Load polygons from localStorage on mount
    loadPolygons();
  }, [loadPolygons]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Right Map */}
      <div className="flex-1 relative" style={{ pointerEvents: 'auto' }}>
        <Map />
      </div>
    </div>
  );
}

export default App;



// import Sidebar from "./components/Sidebar";
// import SearchBar from "./components/SearchBar";
// import Map from "./components/Map";
// import DrawControls from "./components/DrawControls";

// export default function App() {
//   return (
//     <div className="w-full h-screen flex overflow-hidden">
//       {/* LEFT SIDEBAR (Fixed Width) */}
//       <div className="w-[350px] min-w-[350px] h-full border-r bg-white overflow-y-auto">
//         <Sidebar />
//       </div>

//       {/* RIGHT SIDE (Map + UI) */}
//       <div className="flex-1 relative">
//         {/* Search Bar */}
//         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[400px]">
//           <SearchBar />
//         </div>

//         {/* Map */}
//         <Map />

//         {/* Draw Controls */}
//         <DrawControls />
//       </div>
//     </div>
//   );
// }
