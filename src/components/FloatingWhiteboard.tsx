import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, Eraser, Trash2, X, PenBox, RotateCcw,
  MousePointer2, StickyNote, Wrench, Bot, Palette,
  ZoomOut, ZoomIn, Maximize2, Save, Clock, FolderOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Point = { x: number; y: number };

type Note = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
};

type Path = {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
};

const DottedBackground = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.15]"
    style={{
      backgroundImage: 'radial-gradient(circle, #F97316 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
    }}
  />
);

const PRESET_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#EF4444', '#1F2937'];

export default function FloatingWhiteboard() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Tools state
  const [currentTool, setCurrentTool] = useState<string>('pen');
  const [currentColor, setCurrentColor] = useState(PRESET_COLORS[0]);
  const [currentWidth, setCurrentWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Drawing state
  const [paths, setPaths] = useState<Path[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const currentPathRef = useRef<Path | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);



  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all completed paths
    paths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (path.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = path.width * 5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
      }
      
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length - 1; i++) {
         const curr = path.points[i];
         const next = path.points[i+1];
         ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
      }
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    if (isOpen) {
        const canvas = canvasRef.current;
        if (canvas) {
           canvas.width = canvas.offsetWidth;
           canvas.height = canvas.offsetHeight;
           redraw();
        }
        
        const handleResize = () => {
          if (canvasRef.current) {
             canvasRef.current.width = canvasRef.current.offsetWidth;
             canvasRef.current.height = canvasRef.current.offsetHeight;
             redraw();
          }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen, paths]);

  // Event handlers
  const startDrawing = (x: number, y: number) => {
    setCurrentWidth(currentTool === 'eraser' ? 5 : 3);
    currentPathRef.current = {
       points: [{ x, y }],
       color: currentColor,
       width: currentTool === 'eraser' ? 5 : 3,
       isEraser: currentTool === 'eraser'
    };
  };

  const draw = (x: number, y: number) => {
    if (!currentPathRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    currentPathRef.current.points.push({ x, y });
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
       ctx.beginPath();
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
       
       if (currentPathRef.current.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.lineWidth = currentPathRef.current.width * 5;
       } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = currentPathRef.current.color;
          ctx.lineWidth = currentPathRef.current.width;
       }
       
       const pts = currentPathRef.current.points;
       if (pts.length > 1) {
          ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
       }
    }
  };

  const stopDrawing = () => {
    if (currentPathRef.current) {
       const newPath = currentPathRef.current;
       setPaths(prev => [...prev, newPath]);
       currentPathRef.current = null;
    }
  };
  
  const getPoint = (clientX: number, clientY: number) => {
     if(!canvasRef.current) return { x: 0, y: 0 };
     const rect = canvasRef.current.getBoundingClientRect();
     return {
        x: (clientX - rect.left) / zoom,
        y: (clientY - rect.top) / zoom
     };
  };

  // Mouse mapping wrapper
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
     const pt = getPoint(e.clientX, e.clientY);

     if (currentTool === 'note') {
        const newNote: Note = {
            id: Date.now().toString(),
            x: pt.x - 96, // center somewhat (192/2)
            y: pt.y - 40,
            text: '',
            color: currentColor,
        };
        setNotes([...notes, newNote]);
        setCurrentTool('select');
        return;
     }
     
     if (currentTool === 'generate') {
         toast({ title: 'AI Assistant', description: 'Generating ideas from whiteboard content...' });
         setCurrentTool('select');
         return;
     }

     if (currentTool === 'operate') {
         toast({ title: 'Operate Tool', description: 'Select an object to manipulate.' });
         setCurrentTool('select');
         return;
     }

     if(currentTool !== 'pen' && currentTool !== 'eraser') return;
     startDrawing(pt.x, pt.y);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
     if(currentTool !== 'pen' && currentTool !== 'eraser') return;
     const pt = getPoint(e.clientX, e.clientY);
     draw(pt.x, pt.y);
  };

  // Touch mapping wrapper
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
     if(e.touches.length === 0) return;
     const pt = getPoint(e.touches[0].clientX, e.touches[0].clientY);
     
     if (currentTool === 'note') {
        const newNote: Note = {
            id: Date.now().toString(),
            x: pt.x - 96,
            y: pt.y - 40,
            text: '',
            color: currentColor,
        };
        setNotes([...notes, newNote]);
        setCurrentTool('select');
        return;
     }
     
     if (currentTool === 'generate' || currentTool === 'operate') {
         toast({ title: 'Tool Selected', description: 'Action recorded.' });
         setCurrentTool('select');
         return;
     }

     if(currentTool !== 'pen' && currentTool !== 'eraser') return;
     startDrawing(pt.x, pt.y);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
     if(currentTool !== 'pen' && currentTool !== 'eraser') return;
     if(e.touches.length === 0) return;
     const pt = getPoint(e.touches[0].clientX, e.touches[0].clientY);
     draw(pt.x, pt.y);
  };

  const handleUndo = () => setPaths(prev => prev.slice(0, -1));
  const handleClear = () => { setPaths([]); setNotes([]); };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = dataUrl;
    link.click();
    toast({ title: 'Board Saved', description: 'Your whiteboard has been downloaded.' });
  };

  const handleRecent = () => {
    toast({ title: 'Opening Recent', description: 'This would load cloud saves.' });
  };

  const handleNew = () => {
    setPaths([]);
    setNotes([]);
    setZoom(1);
    toast({ title: 'New Board', description: 'Started a blank whiteboard.' });
  };

  if (!user || role !== 'student') return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center border-[3px] border-white dark:border-background transition-shadow hover:shadow-primary/30"
            title="Open White Board Scratchpad"
          >
            <PenBox className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col overflow-hidden m-4 md:m-8 rounded-2xl border shadow-2xl"
            onMouseMove={e => {
                if(draggingNoteId) {
                    const pt = getPoint(e.clientX, e.clientY);
                    setNotes(prev => prev.map(n => n.id === draggingNoteId ? { ...n, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } : n));
                }
            }}
            onMouseUp={() => setDraggingNoteId(null)}
            onMouseLeave={() => setDraggingNoteId(null)}
            onTouchMove={e => {
                if(draggingNoteId && e.touches.length > 0) {
                    const pt = getPoint(e.touches[0].clientX, e.touches[0].clientY);
                    setNotes(prev => prev.map(n => n.id === draggingNoteId ? { ...n, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } : n));
                }
            }}
            onTouchEnd={() => setDraggingNoteId(null)}
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border/50 bg-card/80 px-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <PenBox className="h-5 w-5" />
                White Board Scratchpad
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors font-medium flex gap-2 items-center text-sm"
              >
                Close <X className="h-4 w-4" />
              </button>
            </div>

            {/* Canvas Area */}
            <div className="relative flex-1 bg-[#fdfbf7] overflow-hidden" style={{ cursor: currentTool === 'eraser' ? 'cell' : currentTool === 'pen' ? 'crosshair' : 'default' }}>
              <div 
                className="absolute inset-0 transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                <DottedBackground />
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={stopDrawing}
                  className="absolute inset-0 z-10 touch-none w-full h-full"
                />
                
                {notes.map(note => (
                   <div
                      key={note.id}
                      style={{
                         position: 'absolute',
                         left: note.x,
                         top: note.y,
                         backgroundColor: note.color + '15',
                         borderColor: note.color + '50',
                      }}
                      className="w-48 min-h-32 border shadow-sm rounded-lg overflow-hidden group z-20 flex flex-col backdrop-blur-sm"
                      onMouseDown={(e) => {
                          if (currentTool === 'select') {
                              e.stopPropagation();
                              setDraggingNoteId(note.id);
                              const pt = getPoint(e.clientX, e.clientY);
                              setDragOffset({ x: pt.x - note.x, y: pt.y - note.y });
                          }
                      }}
                      onTouchStart={(e) => {
                          if (currentTool === 'select' && e.touches.length > 0) {
                              e.stopPropagation();
                              setDraggingNoteId(note.id);
                              const pt = getPoint(e.touches[0].clientX, e.touches[0].clientY);
                              setDragOffset({ x: pt.x - note.x, y: pt.y - note.y });
                          }
                      }}
                   >
                      <div className="h-6 w-full flex justify-end px-1 items-center" style={{ backgroundColor: note.color + '30', cursor: currentTool === 'select' ? 'move' : 'default' }}>
                         <button onClick={(e) => { e.stopPropagation(); setNotes(prev => prev.filter(n => n.id !== note.id)) }} className="text-black/50 hover:text-black hover:bg-black/10 rounded p-0.5">
                            <X className="h-3 w-3" />
                         </button>
                      </div>
                      <textarea
                         className="flex-1 w-full bg-transparent resize-none p-2 outline-none text-gray-800 text-sm focus:ring-1 focus:ring-black/10 placeholder-black/40"
                         value={note.text}
                         onChange={(e) => setNotes(prev => prev.map(n => n.id === note.id ? { ...n, text: e.target.value } : n))}
                         placeholder="Type a note..."
                         onMouseDown={e => e.stopPropagation()}
                         onTouchStart={e => e.stopPropagation()}
                         style={{ cursor: 'text' }}
                      />
                   </div>
                ))}
              </div>
              
              {/* Dock floating at the bottom */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex px-4 py-3 items-center gap-5 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-orange-200/60 overflow-x-auto max-w-[95vw]">
                {/* Tools */}
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentTool('select')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentTool === 'select' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-600 hover:bg-orange-50'}`}>
                    <MousePointer2 className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Select</span>
                  </button>
                  <button onClick={() => setCurrentTool('pen')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentTool === 'pen' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-600 hover:bg-orange-50'}`}>
                    <PenTool className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Pen</span>
                  </button>
                  <button onClick={() => setCurrentTool('eraser')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentTool === 'eraser' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-600 hover:bg-orange-50'}`}>
                    <Eraser className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Eraser</span>
                  </button>
                  <button onClick={() => setCurrentTool('note')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentTool === 'note' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-600 hover:bg-orange-50'}`}>
                    <StickyNote className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Note</span>
                  </button>
                  <button onClick={() => setCurrentTool('operate')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentTool === 'operate' ? 'bg-purple-500 text-white shadow-md' : 'text-purple-600 hover:bg-purple-50'}`}>
                    <Wrench className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Operate</span>
                  </button>
                  <button onClick={() => setCurrentTool('generate')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentTool === 'generate' ? 'bg-purple-500 text-white shadow-md' : 'text-purple-600 hover:bg-purple-50'}`}>
                    <Bot className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Generate</span>
                  </button>
                </div>

                <div className="w-px h-8 bg-orange-200" />
                
                {/* Colors */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-orange-500" />
                    <button onClick={() => colorInputRef.current?.click()} className="w-6 h-6 rounded-full border-2 border-orange-300 shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: currentColor }} />
                    <input type="color" ref={colorInputRef} value={currentColor} onChange={(e) => { setCurrentColor(e.target.value); setCurrentTool('pen'); }} className="sr-only" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="range" min="1" max="20" value={currentWidth} onChange={(e) => setCurrentWidth(Number(e.target.value))} className="w-20 accent-orange-500" />
                    <span className="text-sm text-orange-600 font-medium w-5">{currentWidth}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 text-orange-600">
                    <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-1.5 hover:bg-orange-50 rounded-lg"><ZoomOut className="h-4 w-4" /></button>
                    <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="p-1.5 hover:bg-orange-50 rounded-lg"><ZoomIn className="h-4 w-4" /></button>
                    <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-orange-50 rounded-lg"><Maximize2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="w-px h-8 bg-orange-200 flex-shrink-0" />

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button onClick={handleUndo} disabled={paths.length === 0} className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-30 rounded-lg transition-colors">
                      <RotateCcw className="h-5 w-5" />
                    </button>
                    <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                </div>

                <div className="w-px h-8 bg-orange-200 flex-shrink-0" />

                {/* Files */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={handleSave} className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                    <Save className="h-4 w-4" />
                    <span className="text-[10px] font-medium">Save</span>
                  </button>
                  <button onClick={handleRecent} className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-medium">Recent</span>
                  </button>
                  <button onClick={handleNew} className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors">
                    <FolderOpen className="h-4 w-4" />
                    <span className="text-[10px] font-medium">New</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
