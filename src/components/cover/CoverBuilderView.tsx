import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  Check,
  LayoutTemplate,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  Eye,
  Sliders,
  AlertCircle,
  BookMarked
} from 'lucide-react';
import { useBookStore } from '../../lib/store';
import { useSeriesStore } from '../../lib/seriesStore';
import { Book, TrimSize, PaperType } from '../../types/index';
import { getCoverDimensions, getTrimDimensions } from '../../lib/kdp';
import { CoverToolbar, CoverToolType } from './CoverToolbar';
import { CoverPropertiesPanel } from './CoverPropertiesPanel';
import { CoverSetupModal } from './CoverSetupModal';
import { CoverAiDrawer } from './CoverAiDrawer';
import { CoverExportModal } from './CoverExportModal';
import { CoverElementsDrawer } from './CoverElementsDrawer';
import { CoverTemplatesDrawer } from './CoverTemplatesDrawer';
import { CoverBackgroundDrawer } from './CoverBackgroundDrawer';
import { Cover3DMockupModal } from './Cover3DMockupModal';
import { CoverPreflightModal } from './CoverPreflightModal';
import { GraphicElementItem, GenreTemplatePreset, MeshGradient } from '../../lib/coverTemplates';
import { generateIsbnBarcodeSvg } from '../../lib/kdpBarcode';
import { CoverStyleSuggestion } from '../../lib/imagen';
import { useBrandStore } from '../../lib/brandStore';

const DPI_SCREEN = 96;

export const CoverBuilderView: React.FC = () => {
  const { books, currentBook, updateBook } = useBookStore();
  const book = currentBook || books[0] || null;

  // Cover configuration
  const [trimSize, setTrimSize] = useState<TrimSize>(book?.trimSize || '6x9');
  const [paperType, setPaperType] = useState<PaperType>(book?.paperType || 'white');
  const [pageCount, setPageCount] = useState<number>(150);
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#1e1b4b');

  // Tools & Panels
  const [activeTool, setActiveTool] = useState<CoverToolType>('select');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [isTemplatesDrawerOpen, setIsTemplatesDrawerOpen] = useState<boolean>(false);
  const [isElementsDrawerOpen, setIsElementsDrawerOpen] = useState<boolean>(false);
  const [isBackgroundDrawerOpen, setIsBackgroundDrawerOpen] = useState<boolean>(false);
  const [is3DMockupModalOpen, setIs3DMockupModalOpen] = useState<boolean>(false);
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Zoom & Canvas View State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [isMobilePropsOpen, setIsMobilePropsOpen] = useState<boolean>(false);

  // History for Undo/Redo (30 steps)
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isHistoryActionRef = useRef<boolean>(false);

  // Canvas element refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dimensions
  const coverDims = getCoverDimensions(trimSize, pageCount, paperType);
  const trimDims = getTrimDimensions(trimSize);

  const canvasWidthPx = Math.round(coverDims.totalWidth * DPI_SCREEN);
  const canvasHeightPx = Math.round(coverDims.totalHeight * DPI_SCREEN);
  const spineWidthPx = Math.round(coverDims.spineWidth * DPI_SCREEN);
  const trimWidthPx = Math.round(trimDims.width * DPI_SCREEN);
  const bleedPx = Math.round(coverDims.bleed * DPI_SCREEN);

  // Save current canvas state to history stack
  const saveStateToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isHistoryActionRef.current) return;

    try {
      const json = JSON.stringify(canvas.toJSON());
      const curIndex = historyIndexRef.current;
      const newHistory = historyRef.current.slice(0, curIndex + 1);
      newHistory.push(json);

      // Max 30 actions
      if (newHistory.length > 30) {
        newHistory.shift();
      }

      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
    } catch (e) {
      console.warn('Could not save history snapshot', e);
    }
  }, []);

  // Update Layers List
  const updateLayersList = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const layerItems = objects.map((obj: any, idx: number) => {
      let name = 'Object';
      if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
        name = `Text: "${obj.text?.slice(0, 14) || '...'}"`;
      } else if (obj.type === 'rect') {
        name = obj.isBarcode ? 'KDP Barcode Box' : 'Rectangle';
      } else if (obj.type === 'circle') {
        name = 'Circle Badge';
      } else if (obj.type === 'image') {
        name = 'Image Layer';
      } else if (obj.type === 'line') {
        name = 'Divider Line';
      }

      return {
        id: obj.id || `layer-${idx}`,
        type: obj.type,
        name,
        visible: obj.visible !== false,
        selected: canvas.getActiveObject() === obj,
        rawObject: obj,
      };
    });

    // Reverse to show top objects at the top of the layer list
    setLayers(layerItems.reverse());
  }, []);

  // Auto-Fit Canvas to Screen
  const fitCanvasToContainer = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const containerWidth = canvasContainerRef.current.clientWidth - 80;
    const containerHeight = canvasContainerRef.current.clientHeight - 80;

    if (containerWidth <= 0 || containerHeight <= 0) return;

    const scaleX = containerWidth / canvasWidthPx;
    const scaleY = containerHeight / canvasHeightPx;
    const fitScale = Math.min(scaleX, scaleY, 1.2);

    setZoomLevel(Math.max(0.2, fitScale));
  }, [canvasWidthPx, canvasHeightPx]);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasElementRef.current) return;

    // Dispose old canvas if any
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: canvasWidthPx,
      height: canvasHeightPx,
      backgroundColor: canvasBgColor,
      preserveObjectStacking: true,
      selection: true,
    });

    fabricCanvasRef.current = canvas;

    // Bind Canvas Events
    const handleSelection = () => {
      const active = canvas.getActiveObject();
      setSelectedObject(active || null);
      updateLayersList();
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
      updateLayersList();
    });

    canvas.on('object:modified', () => {
      saveStateToHistory();
      updateLayersList();
      setIsSaved(false);
    });

    canvas.on('object:added', () => {
      updateLayersList();
    });

    canvas.on('object:removed', () => {
      updateLayersList();
    });

    // Load saved cover data if exists
    if (currentBook?.coverData) {
      try {
        canvas.loadFromJSON(currentBook.coverData).then(() => {
          canvas.renderAll();
          updateLayersList();
          saveStateToHistory();
        });
      } catch (err) {
        console.warn('Failed to load saved cover data:', err);
      }
    } else {
      // Default: create initial KDP template
      createDefaultKdpLayout(canvas);
      saveStateToHistory();
    }

    fitCanvasToContainer();

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [canvasWidthPx, canvasHeightPx]);

  // Window Resize Listener
  useEffect(() => {
    const handleResize = () => {
      fitCanvasToContainer();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitCanvasToContainer]);

  // Undo / Redo Handlers
  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;

    isHistoryActionRef.current = true;
    historyIndexRef.current -= 1;
    const json = historyRef.current[historyIndexRef.current];

    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      updateLayersList();
      setSelectedObject(canvas.getActiveObject() || null);
      isHistoryActionRef.current = false;
    });
  };

  const handleRedo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    isHistoryActionRef.current = true;
    historyIndexRef.current += 1;
    const json = historyRef.current[historyIndexRef.current];

    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      updateLayersList();
      setSelectedObject(canvas.getActiveObject() || null);
      isHistoryActionRef.current = false;
    });
  };

  // Keyboard Shortcuts (Undo/Redo/Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = fabricCanvasRef.current;
        const active = canvas?.getActiveObject();
        if (active && !((active as any).isEditing)) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update Canvas Background Color
  const handleSetCanvasBgColor = (color: string) => {
    setCanvasBgColor(color);
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.backgroundColor = color;
      canvas.renderAll();
      saveStateToHistory();
      setIsSaved(false);
    }
  };

  // Default KDP Layout Generator
  const createDefaultKdpLayout = (canvas: fabric.Canvas) => {
    canvas.clear();
    canvas.backgroundColor = canvasBgColor;

    const bookTitle = currentBook?.title || 'THE ART OF WRITING';
    const bookSubtitle = currentBook?.subtitle || 'A Practical Guide to Publishing';
    const authorName = currentBook?.author || 'Alex Mercer';

    // Front Cover Center Coordinates
    const frontCenterX = bleedPx + trimWidthPx + spineWidthPx + trimWidthPx / 2;
    const backCenterX = bleedPx + trimWidthPx / 2;
    const spineCenterX = bleedPx + trimWidthPx + spineWidthPx / 2;

    // 1. Front Cover Title
    const titleText = new fabric.IText(bookTitle.toUpperCase(), {
      left: frontCenterX,
      top: canvasHeightPx * 0.28,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Playfair Display',
      fontSize: Math.min(48, Math.round(canvasWidthPx * 0.045)),
      fill: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.6)',
        blur: 15,
        offsetX: 2,
        offsetY: 4,
      }),
    });

    // 2. Front Cover Subtitle
    const subtitleText = new fabric.IText(bookSubtitle, {
      left: frontCenterX,
      top: canvasHeightPx * 0.42,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Montserrat',
      fontSize: Math.min(20, Math.round(canvasWidthPx * 0.02)),
      fill: '#f3f4f6',
      fontWeight: 'normal',
      textAlign: 'center',
    });

    // 3. Front Cover Author
    const authorText = new fabric.IText(authorName.toUpperCase(), {
      left: frontCenterX,
      top: canvasHeightPx * 0.82,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Montserrat',
      fontSize: Math.min(22, Math.round(canvasWidthPx * 0.022)),
      fill: '#fbbf24',
      fontWeight: 'bold',
      charSpacing: 150,
      textAlign: 'center',
    });

    // 4. Spine Title (Rotated 90 degrees)
    const spineText = new fabric.IText(`${bookTitle}  •  ${authorName}`, {
      left: spineCenterX,
      top: canvasHeightPx / 2,
      originX: 'center',
      originY: 'center',
      angle: 90,
      fontFamily: 'Montserrat',
      fontSize: Math.min(13, Math.max(9, Math.round(spineWidthPx * 0.45))),
      fill: '#ffffff',
      fontWeight: 'bold',
      charSpacing: 80,
      textAlign: 'center',
    });

    // 5. Back Cover Blurb Text
    const backBlurb = new fabric.Textbox(
      'Discover the timeless principles of craft, focus, and creativity. Whether you are publishing your debut manuscript or polishing your next masterpiece, this definitive volume equips you with every tool necessary to thrive as an author.\n\n"An indispensable handbook for modern storytelling and bookcraft."',
      {
        left: backCenterX,
        top: canvasHeightPx * 0.35,
        width: trimWidthPx * 0.75,
        originX: 'center',
        originY: 'center',
        fontFamily: 'EB Garamond',
        fontSize: Math.min(16, Math.round(canvasWidthPx * 0.016)),
        fill: '#f8fafc',
        lineHeight: 1.5,
        textAlign: 'left',
      }
    );

    // 6. KDP Barcode Placeholder Box (2" x 1.2")
    const barcodeWidthPx = 2 * DPI_SCREEN;
    const barcodeHeightPx = 1.2 * DPI_SCREEN;
    const barcodeBox = new fabric.Rect({
      left: backCenterX + trimWidthPx * 0.15,
      top: canvasHeightPx * 0.78,
      width: barcodeWidthPx,
      height: barcodeHeightPx,
      fill: '#ffffff',
      stroke: '#94a3b8',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
    });
    (barcodeBox as any).isBarcode = true;

    const barcodeLabel = new fabric.IText('KDP Barcode (2" × 1.2")', {
      left: backCenterX + trimWidthPx * 0.15 + barcodeWidthPx / 2,
      top: canvasHeightPx * 0.78 + barcodeHeightPx / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Montserrat',
      fontSize: 10,
      fill: '#64748b',
      fontWeight: 'bold',
      selectable: false,
      evented: false,
    });

    canvas.add(titleText, subtitleText, authorText, spineText, backBlurb, barcodeBox, barcodeLabel);
    canvas.setActiveObject(titleText);
    canvas.renderAll();
  };

  // Add Typography Objects
  const handleAddText = (type: 'title' | 'subtitle' | 'author' | 'spine' | 'body') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const frontCenterX = bleedPx + trimWidthPx + spineWidthPx + trimWidthPx / 2;
    const backCenterX = bleedPx + trimWidthPx / 2;
    const spineCenterX = bleedPx + trimWidthPx + spineWidthPx / 2;

    let textObj: fabric.IText | fabric.Textbox;

    if (type === 'title') {
      textObj = new fabric.IText('BOOK TITLE', {
        left: frontCenterX,
        top: canvasHeightPx * 0.3,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Playfair Display',
        fontSize: 48,
        fill: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
      });
    } else if (type === 'subtitle') {
      textObj = new fabric.IText('A Novel of Wonder and Mystery', {
        left: frontCenterX,
        top: canvasHeightPx * 0.42,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Montserrat',
        fontSize: 20,
        fill: '#f3f4f6',
        textAlign: 'center',
      });
    } else if (type === 'author') {
      textObj = new fabric.IText('AUTHOR NAME', {
        left: frontCenterX,
        top: canvasHeightPx * 0.8,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Montserrat',
        fontSize: 22,
        fill: '#fbbf24',
        fontWeight: 'bold',
        charSpacing: 140,
        textAlign: 'center',
      });
    } else if (type === 'spine') {
      textObj = new fabric.IText('BOOK TITLE  •  AUTHOR NAME', {
        left: spineCenterX,
        top: canvasHeightPx / 2,
        originX: 'center',
        originY: 'center',
        angle: 90,
        fontFamily: 'Montserrat',
        fontSize: Math.min(14, Math.max(9, Math.round(spineWidthPx * 0.45))),
        fill: '#ffffff',
        fontWeight: 'bold',
        charSpacing: 80,
      });
    } else {
      textObj = new fabric.Textbox('Enter your back cover summary blurb, praise, or synopsis here...', {
        left: backCenterX,
        top: canvasHeightPx * 0.4,
        width: trimWidthPx * 0.7,
        originX: 'center',
        originY: 'center',
        fontFamily: 'EB Garamond',
        fontSize: 16,
        fill: '#f8fafc',
        lineHeight: 1.4,
      });
    }

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
  };

  // Add Geometric Shapes
  const handleAddShape = (type: 'rect' | 'circle' | 'line' | 'barcode_placeholder') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const frontCenterX = bleedPx + trimWidthPx + spineWidthPx + trimWidthPx / 2;

    if (type === 'rect') {
      const rect = new fabric.Rect({
        left: frontCenterX - 120,
        top: canvasHeightPx * 0.5 - 75,
        width: 240,
        height: 150,
        fill: 'rgba(255, 255, 255, 0.1)',
        stroke: '#fbbf24',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
    } else if (type === 'circle') {
      const circle = new fabric.Circle({
        left: frontCenterX,
        top: canvasHeightPx * 0.5,
        radius: 60,
        originX: 'center',
        originY: 'center',
        fill: 'rgba(251, 191, 36, 0.2)',
        stroke: '#fbbf24',
        strokeWidth: 2,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
    } else if (type === 'line') {
      const line = new fabric.Line([frontCenterX - 100, canvasHeightPx * 0.38, frontCenterX + 100, canvasHeightPx * 0.38], {
        stroke: '#fbbf24',
        strokeWidth: 2,
      });
      canvas.add(line);
      canvas.setActiveObject(line);
    } else if (type === 'barcode_placeholder') {
      const barcodeWidthPx = 2 * DPI_SCREEN;
      const barcodeHeightPx = 1.2 * DPI_SCREEN;
      const rect = new fabric.Rect({
        left: bleedPx + trimWidthPx * 0.65,
        top: canvasHeightPx * 0.78,
        width: barcodeWidthPx,
        height: barcodeHeightPx,
        fill: '#ffffff',
        stroke: '#94a3b8',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      });
      (rect as any).isBarcode = true;
      canvas.add(rect);
      canvas.setActiveObject(rect);
    }

    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
  };

  // Image Upload Trigger & Loading
  const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      try {
        const imgElement = new Image();
        imgElement.src = dataUrl;
        imgElement.onload = () => {
          const fabricImg = new fabric.FabricImage(imgElement, {
            left: canvasWidthPx / 2,
            top: canvasHeightPx / 2,
            originX: 'center',
            originY: 'center',
          });

          // Scale nicely within view
          const maxDim = Math.min(canvasWidthPx * 0.6, canvasHeightPx * 0.6);
          if (fabricImg.width! > maxDim || fabricImg.height! > maxDim) {
            const scale = maxDim / Math.max(fabricImg.width!, fabricImg.height!);
            fabricImg.scale(scale);
          }

          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.renderAll();
          saveStateToHistory();
          setIsSaved(false);
        };
      } catch (err) {
        console.error('Error loading image onto canvas:', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Apply AI Generated Image to Canvas
  const handleApplyAiImage = (imageUrl: string, placement: 'full' | 'front' | 'custom') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const imgElement = new Image();
    if (!imageUrl.startsWith('data:')) {
      imgElement.crossOrigin = 'anonymous';
    }
    imgElement.onload = () => {
      try {
        const frontCenterX = bleedPx + trimWidthPx + spineWidthPx + trimWidthPx / 2;
        let fabricImg: fabric.FabricImage;

        if (placement === 'full') {
          fabricImg = new fabric.FabricImage(imgElement, {
            left: 0,
            top: 0,
            originX: 'left',
            originY: 'top',
          });
          fabricImg.scaleX = canvasWidthPx / (fabricImg.width || 1);
          fabricImg.scaleY = canvasHeightPx / (fabricImg.height || 1);
          canvas.add(fabricImg);
          if (typeof canvas.sendObjectToBack === 'function') {
            canvas.sendObjectToBack(fabricImg);
          }
        } else if (placement === 'front') {
          const frontWidth = trimWidthPx + bleedPx;
          fabricImg = new fabric.FabricImage(imgElement, {
            left: bleedPx + trimWidthPx + spineWidthPx,
            top: 0,
            originX: 'left',
            originY: 'top',
          });
          fabricImg.scaleX = frontWidth / (fabricImg.width || 1);
          fabricImg.scaleY = canvasHeightPx / (fabricImg.height || 1);
          canvas.add(fabricImg);
          if (typeof canvas.sendObjectToBack === 'function') {
            canvas.sendObjectToBack(fabricImg);
          }
        } else {
          fabricImg = new fabric.FabricImage(imgElement, {
            left: frontCenterX,
            top: canvasHeightPx / 2,
            originX: 'center',
            originY: 'center',
          });
          const maxDim = Math.min(trimWidthPx * 0.85, canvasHeightPx * 0.65);
          const scale = maxDim / Math.max(fabricImg.width || 1, fabricImg.height || 1);
          fabricImg.scale(scale);
          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
        }

        canvas.renderAll();
        saveStateToHistory();
        setIsSaved(false);
        setIsAiDrawerOpen(false);
      } catch (err) {
        console.error('Error applying AI image to canvas:', err);
      }
    };
    imgElement.onerror = (err) => {
      console.error('Error loading image source:', err);
    };
    imgElement.src = imageUrl;
  };

  // Apply AI Style Suggestion
  const handleApplyStyleSuggestion = (suggestion: CoverStyleSuggestion) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    handleSetCanvasBgColor(suggestion.backgroundColor);

    // Apply primary font to any existing title, secondary font to subtitles
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.type === 'i-text' || obj.type === 'text') {
        if (obj.fontSize && obj.fontSize > 30) {
          obj.set({ fontFamily: suggestion.primaryFont, fill: suggestion.textColor });
        } else if (obj.fontSize && obj.fontSize > 18) {
          obj.set({ fontFamily: suggestion.secondaryFont, fill: suggestion.accentColor });
        }
      }
    });

    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
  };

  // Property Panel Object Updaters
  const handleUpdateObject = (props: Record<string, any>) => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;

    active.set(props);
    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
  };

  const handleDeleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;

    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObject(null);
    saveStateToHistory();
    setIsSaved(false);
  };

  const handleDuplicateSelected = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;

    active.clone().then((cloned: any) => {
      cloned.set({
        left: (active.left || 0) + 20,
        top: (active.top || 0) + 20,
        evented: true,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveStateToHistory();
      setIsSaved(false);
    });
  };

  const handleReorderObject = (direction: 'up' | 'down' | 'front' | 'back') => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;

    if (direction === 'front') {
      canvas.bringObjectToFront(active);
    } else if (direction === 'back') {
      canvas.sendObjectToBack(active);
    } else if (direction === 'up') {
      canvas.bringObjectForward(active);
    } else if (direction === 'down') {
      canvas.sendObjectBackwards(active);
    }

    canvas.renderAll();
    updateLayersList();
    saveStateToHistory();
    setIsSaved(false);
  };

  const handleRotateSpine = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;

    const curAngle = active.angle || 0;
    const nextAngle = curAngle === 90 ? 0 : 90;
    active.set({ angle: nextAngle });
    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
  };

  // Layers interactions
  const handleSelectLayer = (layer: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !layer.rawObject) return;

    canvas.setActiveObject(layer.rawObject);
    canvas.renderAll();
    setSelectedObject(layer.rawObject);
  };

  const handleToggleLayerVisibility = (layer: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !layer.rawObject) return;

    layer.rawObject.set({ visible: !layer.visible });
    canvas.renderAll();
    updateLayersList();
  };

  const handleDeleteLayer = (layer: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !layer.rawObject) return;

    canvas.remove(layer.rawObject);
    canvas.renderAll();
    updateLayersList();
    saveStateToHistory();
  };

  // Save to Zustand
  const handleSaveToStore = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !book) return;

    const json = canvas.toJSON();
    updateBook(book.id, {
      coverData: json,
      updatedAt: new Date(),
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Export 300 DPI Cover (PDF / JPG)
  const handleExportCover = async (format: 'pdf' | 'jpg') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // High quality export data URL (multiplier scales screen 96 DPI to 300 DPI: 300 / 96 ~= 3.125)
    const multiplier = 300 / DPI_SCREEN;
    const imageDataUrl = canvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : 'png',
      multiplier,
      quality: 1,
    });

    const response = await fetch('/api/export-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataUrl,
        coverDimensions: coverDims,
        exportFormat: format,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to export cover file from server');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(book?.title || 'Book').toLowerCase().replace(/\s+/g, '_')}_kdp_cover_300dpi.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Apply Author Brand Kit to Canvas
  const handleApplyBrandKit = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const brand = useBrandStore.getState().brandKit;
    if (!brand) {
      alert('No Brand Kit found. Please configure your Brand Kit in Settings first.');
      return;
    }

    if (!window.confirm('This will update cover fonts, text colors, and background to match your Author Brand Kit. Continue?')) {
      return;
    }

    if (brand.backgroundColor) {
      canvas.backgroundColor = brand.backgroundColor;
    }

    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
        const text = (obj.text || '').toLowerCase();
        if (text.includes((book?.title || '').toLowerCase()) || text.includes('title')) {
          obj.set({ fontFamily: brand.headingFont || brand.accentFont, fill: brand.primaryColor });
        } else if (text.includes((book?.author || '').toLowerCase()) || text.includes('author')) {
          obj.set({ fontFamily: brand.accentFont || brand.bodyFont, fill: brand.primaryColor });
        } else if (text.includes('subtitle') || text.includes('by')) {
          obj.set({ fontFamily: brand.bodyFont, fill: brand.secondaryColor });
        } else {
          obj.set({ fontFamily: brand.bodyFont, fill: brand.textColor });
        }
      }
    });

    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
  };

  // Find if current book belongs to any Series
  const { seriesList } = useSeriesStore();
  const matchedSeries = seriesList.find(
    (s) => (book as any)?.seriesId === s.id || s.bookIds.includes(book?.id || '')
  );

  const handleApplySeriesStyle = () => {
    if (!matchedSeries) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (canvas.getObjects().length > 0) {
      if (!window.confirm(`This will apply the visual branding and volume badges from "${matchedSeries.title}" to this cover. Continue?`)) {
        return;
      }
    }

    const volIndex = matchedSeries.bookIds.indexOf(book?.id || '');
    const volNum = (book as any)?.volumeNumber || (volIndex >= 0 ? volIndex + 1 : 1);

    // 1. Calculate Volume Color
    const volColor =
      matchedSeries.colorScheme.primaryColors?.[volNum - 1] ||
      matchedSeries.colorScheme.palette?.[0] ||
      '#7c3aed';

    setCanvasBgColor(volColor);
    canvas.backgroundColor = volColor;

    const frontCenterX = bleedPx + trimWidthPx + spineWidthPx + trimWidthPx / 2;

    // 2. Add/Position Series Title
    if (matchedSeries.coverStyle.seriesTitleVisible) {
      const seriesTitleObj = new fabric.IText(matchedSeries.title.toUpperCase(), {
        left: frontCenterX,
        top: canvasHeightPx * 0.12,
        originX: 'center',
        originY: 'center',
        fontSize: 16,
        fontFamily: 'Montserrat',
        fontWeight: 'bold',
        fill: '#ffffff',
        letterSpacing: 4,
      });
      canvas.add(seriesTitleObj);
    }

    // 3. Add Volume Badge
    const badgeText = matchedSeries.coverStyle.volumeNumberStyle.replace('1', volNum.toString());
    const badgeObj = new fabric.IText(badgeText.toUpperCase(), {
      left: frontCenterX,
      top: matchedSeries.coverStyle.volumeNumberPosition === 'top' ? canvasHeightPx * 0.22 : canvasHeightPx * 0.85,
      originX: 'center',
      originY: 'center',
      fontSize: 14,
      fontFamily: 'Montserrat',
      fontWeight: 'bold',
      fill: '#fcd34d',
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: 6,
    });
    canvas.add(badgeObj);

    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
  };

  // Add Vector SVG Element (Badges, Flourishes, Silhouettes) to Canvas
  const handleAddSvgElementToCanvas = (el: GraphicElementItem) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(el.svgString);
    const imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';
    imgElement.src = dataUrl;
    imgElement.onload = () => {
      const frontCenterX = bleedPx + trimWidthPx + spineWidthPx + trimWidthPx / 2;
      const fabricImg = new fabric.FabricImage(imgElement, {
        left: frontCenterX,
        top: canvasHeightPx * 0.48,
        originX: 'center',
        originY: 'center',
      });
      if (el.defaultWidth) {
        fabricImg.scaleToWidth(Math.min(el.defaultWidth, trimWidthPx * 0.7));
      }
      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      saveStateToHistory();
      setIsSaved(false);
    };
  };

  // Add EAN-13 ISBN Barcode Box to back cover
  const handleAddBarcodeToCanvas = (svgString: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    const imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';
    imgElement.src = dataUrl;
    imgElement.onload = () => {
      const backLeft = bleedPx + Math.round(0.25 * DPI_SCREEN);
      const barcodeWidth = Math.round(2.0 * DPI_SCREEN);
      const barcodeHeight = Math.round(1.2 * DPI_SCREEN);
      const barcodeBottom = canvasHeightPx - bleedPx - Math.round(0.25 * DPI_SCREEN) - barcodeHeight;

      const fabricImg = new fabric.FabricImage(imgElement, {
        left: backLeft,
        top: barcodeBottom,
        originX: 'left',
        originY: 'top',
      });
      fabricImg.scaleToWidth(barcodeWidth);
      (fabricImg as any).isBarcode = true;
      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      saveStateToHistory();
      setIsSaved(false);
    };
  };

  // Apply Mesh Gradient Preset
  const handleApplyMeshGradient = (gradient: MeshGradient) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Linear gradient across canvas
    const grad = new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: { x1: 0, y1: 0, x2: canvasWidthPx, y2: canvasHeightPx },
      colorStops: gradient.stops.map((color, i) => ({
        color,
        offset: i / (gradient.stops.length - 1),
      })),
    });

    canvas.backgroundColor = grad as any;
    setCanvasBgColor(gradient.stops[0]);
    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
    setIsBackgroundDrawerOpen(false);
  };

  // 1-Click Apply Genre Cover Template
  const handleApplyGenreTemplate = (tmpl: GenreTemplatePreset) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = tmpl.bgColor;
    setCanvasBgColor(tmpl.bgColor);

    const frontCenterX = bleedPx + trimWidthPx + spineWidthPx + trimWidthPx / 2;
    const backCenterX = bleedPx + trimWidthPx / 2;
    const spineCenterX = bleedPx + trimWidthPx + spineWidthPx / 2;

    // 1. Front Title
    const titleObj = new fabric.IText(tmpl.titleText, {
      left: frontCenterX,
      top: canvasHeightPx * 0.32,
      originX: 'center',
      originY: 'center',
      fontFamily: tmpl.titleFont,
      fontSize: tmpl.titleSize,
      fontWeight: 'bold',
      fill: tmpl.titleColor,
      textAlign: 'center',
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 10, offsetX: 2, offsetY: 2 }),
    });
    canvas.add(titleObj);

    // 2. Subtitle
    const subtitleObj = new fabric.IText(tmpl.subtitleText, {
      left: frontCenterX,
      top: canvasHeightPx * 0.44,
      originX: 'center',
      originY: 'center',
      fontFamily: tmpl.subtitleFont,
      fontSize: 14,
      fill: tmpl.subtitleColor,
      textAlign: 'center',
    });
    canvas.add(subtitleObj);

    // 3. Author Name
    const authorObj = new fabric.IText(tmpl.authorText, {
      left: frontCenterX,
      top: canvasHeightPx * 0.84,
      originX: 'center',
      originY: 'center',
      fontFamily: tmpl.authorFont,
      fontSize: 20,
      fontWeight: 'bold',
      fill: tmpl.authorColor,
      textAlign: 'center',
      letterSpacing: 2,
    });
    canvas.add(authorObj);

    // 4. Spine Text
    if (pageCount >= 79) {
      const spineObj = new fabric.IText(tmpl.spineText, {
        left: spineCenterX,
        top: canvasHeightPx * 0.5,
        originX: 'center',
        originY: 'center',
        angle: 90,
        fontFamily: tmpl.titleFont,
        fontSize: Math.min(13, Math.max(8, Math.round(spineWidthPx * 0.45))),
        fontWeight: 'bold',
        fill: tmpl.titleColor,
        textAlign: 'center',
      });
      canvas.add(spineObj);
    }

    // 5. Back Cover Blurb
    const blurbObj = new fabric.Textbox(tmpl.blurbText, {
      left: backCenterX,
      top: canvasHeightPx * 0.35,
      originX: 'center',
      originY: 'center',
      width: trimWidthPx * 0.75,
      fontFamily: tmpl.subtitleFont,
      fontSize: 12,
      fill: '#f8fafc',
      textAlign: 'left',
      lineHeight: 1.4,
    });
    canvas.add(blurbObj);

    // 6. Default KDP Barcode Box
    const barcodeSvg = generateIsbnBarcodeSvg('9781234567890');
    handleAddBarcodeToCanvas(barcodeSvg);

    canvas.renderAll();
    saveStateToHistory();
    setIsSaved(false);
    setIsTemplatesDrawerOpen(false);
  };

  // Open 3D Mockup Modal with snapshot
  const handleOpen3DMockupModal = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1.5 });
      setCanvasDataUrl(dataUrl);
    } catch (e) {
      console.warn('Could not capture canvas data URL for 3D mockup:', e);
    }
    setIs3DMockupModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/70 text-slate-900 overflow-hidden select-none">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleImageFileSelected}
        className="hidden"
      />

      {/* Main Workspace: Left Toolbar + Canvas Viewport + Right Properties Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Left Toolbar (80px) */}
        <CoverToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onAddText={handleAddText}
          onAddShape={handleAddShape}
          onTriggerImageUpload={() => fileInputRef.current?.click()}
          onOpenAiDrawer={() => {
            setIsAiDrawerOpen(true);
            setIsTemplatesDrawerOpen(false);
            setIsElementsDrawerOpen(false);
            setIsBackgroundDrawerOpen(false);
          }}
          onOpenTemplatesDrawer={() => {
            setIsTemplatesDrawerOpen(!isTemplatesDrawerOpen);
            setIsAiDrawerOpen(false);
            setIsElementsDrawerOpen(false);
            setIsBackgroundDrawerOpen(false);
          }}
          onOpenElementsDrawer={() => {
            setIsElementsDrawerOpen(!isElementsDrawerOpen);
            setIsAiDrawerOpen(false);
            setIsTemplatesDrawerOpen(false);
            setIsBackgroundDrawerOpen(false);
          }}
          onOpenBackgroundDrawer={() => {
            setIsBackgroundDrawerOpen(!isBackgroundDrawerOpen);
            setIsAiDrawerOpen(false);
            setIsTemplatesDrawerOpen(false);
            setIsElementsDrawerOpen(false);
          }}
          onOpen3DMockupModal={handleOpen3DMockupModal}
          onOpenPreflightModal={() => setIsPreflightModalOpen(true)}
          onApplyBrandKit={handleApplyBrandKit}
          onOpenSetupModal={() => setIsSetupModalOpen(true)}
        />

        {/* 2. Center Canvas Stage */}
        <div
          ref={canvasContainerRef}
          className="flex-1 relative flex flex-col items-center justify-center bg-slate-100/70 overflow-auto p-8"
        >
          {/* Series Continuity Banner if book belongs to series */}
          {matchedSeries && (
            <div
              className="mb-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between gap-4 text-xs shadow-md border border-purple-700/60 transition-all"
              style={{ width: `${canvasWidthPx * zoomLevel}px` }}
            >
              <div className="flex items-center gap-2">
                <BookMarked size={16} className="text-purple-300 shrink-0" />
                <span>
                  This book is part of <strong>"{matchedSeries.title}"</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplySeriesStyle}
                className="px-3 py-1 rounded-lg bg-white hover:bg-purple-50 text-purple-950 font-extrabold text-[11px] transition-all cursor-pointer shrink-0 shadow-xs"
              >
                Apply Series Style
              </button>
            </div>
          )}

          {/* Top Zone Headers Bar Overlay */}
          <div
            className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 pointer-events-none transition-all"
            style={{
              width: `${canvasWidthPx * zoomLevel}px`,
            }}
          >
            <div className="text-center flex-1 bg-white/80 py-1 rounded-lg shadow-2xs border border-slate-200/60 mx-1">
              ⬅ Back Cover
            </div>
            <div className="text-center px-3 py-1 bg-purple-50 text-purple-700 font-mono rounded-lg shadow-2xs border border-purple-200 mx-1">
              Spine ({coverDims.spineWidth}")
            </div>
            <div className="text-center flex-1 bg-white/80 py-1 rounded-lg shadow-2xs border border-slate-200/60 mx-1">
              Front Cover ➡
            </div>
          </div>

          {/* Scaled Canvas Container with Guides */}
          <div
            className="relative shadow-2xl rounded-sm transition-transform duration-75 origin-top-left border border-slate-300/80"
            style={{
              width: `${canvasWidthPx * zoomLevel}px`,
              height: `${canvasHeightPx * zoomLevel}px`,
            }}
          >
            {/* Inner scaled canvas wrapper */}
            <div
              style={{
                width: `${canvasWidthPx}px`,
                height: `${canvasHeightPx}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
              }}
              className="relative shadow-lg"
            >
              {/* Actual Fabric Canvas Element */}
              <canvas ref={canvasElementRef} />

              {/* Guidelines Overlay (Dashed Red Safe Zones & Spine Dividers) */}
              {showGuides && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Bleed / Safe Zone Inset (0.125" all around) */}
                  <div
                    className="absolute border border-dashed border-red-500/60"
                    style={{
                      top: `${bleedPx}px`,
                      bottom: `${bleedPx}px`,
                      left: `${bleedPx}px`,
                      right: `${bleedPx}px`,
                    }}
                  />

                  {/* Spine Left Fold Line */}
                  <div
                    className="absolute top-0 bottom-0 border-r border-dashed border-purple-500/70"
                    style={{
                      left: `${bleedPx + trimWidthPx}px`,
                    }}
                  />

                  {/* Spine Right Fold Line */}
                  <div
                    className="absolute top-0 bottom-0 border-r border-dashed border-purple-500/70"
                    style={{
                      left: `${bleedPx + trimWidthPx + spineWidthPx}px`,
                    }}
                  />

                  {/* Spine Safe Margin Lines (0.0625" inside spine) */}
                  <div
                    className="absolute top-0 bottom-0 border-r border-dotted border-red-400/40"
                    style={{
                      left: `${bleedPx + trimWidthPx + Math.round(0.0625 * DPI_SCREEN)}px`,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 border-r border-dotted border-red-400/40"
                    style={{
                      left: `${bleedPx + trimWidthPx + spineWidthPx - Math.round(0.0625 * DPI_SCREEN)}px`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Canvas Dimensions Readout */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600 font-mono bg-white/90 px-4 py-1.5 rounded-full border border-slate-200 shadow-2xs backdrop-blur-xs">
            <span>
              Total: <strong className="text-slate-900">{coverDims.totalWidth}" × {coverDims.totalHeight}"</strong> ({canvasWidthPx} × {canvasHeightPx} px)
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Spine: <strong className="text-purple-700">{coverDims.spineWidth}"</strong> ({pageCount}p, {paperType})
            </span>
            <span className="text-slate-300">•</span>
            <span>Trim: <strong className="text-slate-900">{trimSize}</strong></span>
          </div>
        </div>

        {/* 3. Right Properties Panel (280px) — responsive drawer on mobile */}
        {isMobilePropsOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
            onClick={() => setIsMobilePropsOpen(false)}
          />
        )}
        <div className={`fixed inset-y-0 right-0 z-50 lg:static lg:block ${isMobilePropsOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="h-full relative flex flex-col">
            <button
              onClick={() => setIsMobilePropsOpen(false)}
              className="lg:hidden absolute top-3 right-3 z-50 p-1.5 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
              aria-label="Close properties"
            >
              ✕
            </button>
            <CoverPropertiesPanel
              selectedObject={selectedObject}
              canvasBgColor={canvasBgColor}
              onSetCanvasBgColor={handleSetCanvasBgColor}
              onUpdateObject={handleUpdateObject}
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onReorderObject={handleReorderObject}
              onRotateSpine={handleRotateSpine}
              layers={layers}
              onSelectLayer={handleSelectLayer}
              onToggleLayerVisibility={handleToggleLayerVisibility}
              onDeleteLayer={handleDeleteLayer}
              coverDimensions={{
                totalWidth: coverDims.totalWidth,
                totalHeight: coverDims.totalHeight,
                spineWidth: coverDims.spineWidth,
                trimSize,
                pageCount,
                paperType,
              }}
              onQuickAdd={(type) => {
                if (type === 'barcode') handleAddShape('barcode_placeholder');
                else handleAddText(type);
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Bottom Control Bar */}
      <footer
        id="cover-bottom-bar"
        className="h-14 bg-white border-t border-slate-200 px-6 flex items-center justify-between z-30 select-none shrink-0 shadow-2xs"
      >
        {/* Left: Undo / Redo & Guides Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            title="Redo (Ctrl+Y)"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          {/* Toggle Guides */}
          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showGuides
                ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showGuides ? 'KDP Guides On' : 'Guides Hidden'}</span>
          </button>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.2, z - 0.1))}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-xs font-bold text-slate-900 px-2 min-w-14 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.1))}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={fitCanvasToContainer}
            title="Fit to Screen"
            className="px-2 py-1 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <Maximize className="w-3 h-3" />
            <span>Fit</span>
          </button>
        </div>

        {/* Right: Save & Export Buttons & Mobile Props Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsMobilePropsOpen(!isMobilePropsOpen)}
            className="lg:hidden px-3 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Properties</span>
          </button>

          <button
            type="button"
            id="btn-save-cover-state"
            onClick={handleSaveToStore}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-2xs'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-open-cover-export"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 sm:px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export 300 DPI Cover</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </footer>

      {/* Setup Modal */}
      <CoverSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        books={books}
        selectedBook={book}
        onApplySetup={(cfg) => {
          setTrimSize(cfg.trimSize);
          setPageCount(cfg.pageCount);
          setPaperType(cfg.paperType);
        }}
      />

      {/* 1-Click Genre Templates Drawer */}
      <CoverTemplatesDrawer
        isOpen={isTemplatesDrawerOpen}
        onClose={() => setIsTemplatesDrawerOpen(false)}
        onApplyTemplate={handleApplyGenreTemplate}
      />

      {/* Graphic Elements & Badges Drawer */}
      <CoverElementsDrawer
        isOpen={isElementsDrawerOpen}
        onClose={() => setIsElementsDrawerOpen(false)}
        onAddElementToCanvas={handleAddSvgElementToCanvas}
      />

      {/* Backgrounds & Mesh Gradients Drawer */}
      <CoverBackgroundDrawer
        isOpen={isBackgroundDrawerOpen}
        onClose={() => setIsBackgroundDrawerOpen(false)}
        onApplyGradient={handleApplyMeshGradient}
        onApplySolidColor={handleSetCanvasBgColor}
        currentBgColor={canvasBgColor}
      />

      {/* 3D Book Mockup Studio Modal */}
      <Cover3DMockupModal
        isOpen={is3DMockupModalOpen}
        onClose={() => setIs3DMockupModalOpen(false)}
        canvasDataUrl={canvasDataUrl}
        bookTitle={book?.title || 'Book Title'}
        spineWidthInch={coverDims.spineWidth}
      />

      {/* KDP Pre-Flight Inspector & ISBN Barcode Modal */}
      <CoverPreflightModal
        isOpen={isPreflightModalOpen}
        onClose={() => setIsPreflightModalOpen(false)}
        coverDimensions={{
          totalWidth: coverDims.totalWidth,
          totalHeight: coverDims.totalHeight,
          spineWidth: coverDims.spineWidth,
          trimSize,
          pageCount,
          paperType,
        }}
        hasSpineText={Boolean(
          fabricCanvasRef.current
            ?.getObjects()
            .some(
              (o: any) =>
                (o.type === 'i-text' || o.type === 'text') &&
                (o.angle === 90 || o.angle === 270 || Math.abs(o.left - (bleedPx + trimWidthPx + spineWidthPx / 2)) < spineWidthPx / 2)
            )
        )}
        onAddBarcodeToCanvas={handleAddBarcodeToCanvas}
      />

      {/* AI Cover Generation Drawer */}
      <CoverAiDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        currentBook={book}
        onApplyImageToCanvas={handleApplyAiImage}
        onApplyStyleSuggestion={handleApplyStyleSuggestion}
      />

      {/* Export Modal */}
      <CoverExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        coverDimensions={{
          totalWidth: coverDims.totalWidth,
          totalHeight: coverDims.totalHeight,
          spineWidth: coverDims.spineWidth,
          trimSize,
          pageCount,
          paperType,
        }}
        onExport={handleExportCover}
      />
    </div>
  );
};
