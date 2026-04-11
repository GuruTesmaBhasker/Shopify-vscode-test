import React, { useState, useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import devicesData from './devices.json';

const CASE_TYPES = {
  plastic: { price: 15, name: 'Plastic Case' },
  glass: { price: 25, name: 'Glass Case' }
};

function App({ baseVariantId, customMockupUrl }) {
  const [brands] = useState(Object.keys(devicesData));
  const [selectedBrand, setSelectedBrand] = useState(brands[0]);
  const [selectedModel, setSelectedModel] = useState(devicesData[brands[0]][0]);
  const [selectedCaseType, setSelectedCaseType] = useState('plastic');
  
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);

  // Initialize Canvas
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 300,
      height: 600,
      backgroundColor: '#f3f4f6'
    });

    // Load a mockup frame (Prefer the client's uploaded image if available, else fallback)
    const finalMockupUrl = (customMockupUrl && customMockupUrl !== 'null' && !customMockupUrl.includes('no-image')) 
      ? customMockupUrl 
      : "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='600' viewBox='0 0 300 600'%3E%3Crect x='10' y='10' width='280' height='580' rx='40' ry='40' fill='none' stroke='%23333' stroke-width='25' pointer-events='none'/%3E%3Crect x='100' y='10' width='100' height='30' rx='15' ry='15' fill='%23333' pointer-events='none'/%3E%3C/svg%3E";
    
    fabric.Image.fromURL(finalMockupUrl, function(img) {
      // Fit user image to our 300x600 canvas gracefully
      img.scaleToWidth(300);
      canvas.setOverlayImage(img, canvas.renderAll.bind(canvas));
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update models when brand changes
  useEffect(() => {
    setSelectedModel(devicesData[selectedBrand][0]);
  }, [selectedBrand]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        // Scale to fit width roughly
        img.scaleToWidth(200);
        // Center image
        img.set({ left: 50, top: 150 });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = async () => {
    if (!fabricCanvas) return;
    
    // Generate final base64 image (Warning: keep resolution low for Shopify Line Item Properties)
    // Over 2-3MB base64 strings might fail Shopify's cart API limits.
    const designImage = fabricCanvas.toDataURL('image/jpeg', 0.5);

    // In a real scenario, you'd find the real Shopify Variant ID 
    // based on selectedBrand / selectedModel / selectedCaseType via Liquid.
    const actualVariantId = baseVariantId; // Uses the selected product from Shopify Theme settings!

    try {
      // Add to Shopify Cart API
      const response = await fetch(window.Shopify?.routes?.root + 'cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: actualVariantId,
          quantity: 1,
          properties: {
            'Brand': selectedBrand,
            'Model': selectedModel,
            'Case Type': CASE_TYPES[selectedCaseType].name,
            '_Custom_Design': designImage // Using _ makes it hidden in the cart UI natively
          }
        })
      });

      if (response.ok) {
        alert('Added to Cart! (You may need to redirect to /cart or trigger drawer update)');
      } else {
        alert('Failed to add to cart. Ensure you have a valid variant ID.');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding to cart.');
    }
  };

  return (
    <div className="customizer-wrapper">
      
      {/* Left Canvas Preview */}
      <div className="customizer-canvas-container">
        <div className="canvas-shadow">
          <canvas ref={canvasRef} id="canvas" />
        </div>
      </div>

      {/* Right Controls Panel */}
      <div className="customizer-controls">
        <h2 className="customizer-title">Create Your Case</h2>
        
        {/* Step 1: Device Selection */}
        <div className="step-block">
          <div className="step-label">1. Choose Your Phone</div>
          <div className="select-row">
            <select 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="premium-select"
            >
              {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="premium-select"
            >
              {devicesData[selectedBrand].map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Material Selection */}
        <div className="step-block">
          <div className="step-label">2. Case Material</div>
          <div className="radio-group">
            {Object.keys(CASE_TYPES).map(type => (
              <label 
                key={type} 
                className={`radio-label ${selectedCaseType === type ? 'active' : ''}`}
                onClick={() => setSelectedCaseType(type)}
              >
                <strong>{CASE_TYPES[type].name}</strong>
                <span className="price">+${CASE_TYPES[type].price}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Step 3: Image Upload */}
        <div className="step-block">
          <div className="step-label">3. Personalize It</div>
          <div className="upload-btn-wrapper">
            <button className="upload-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path><polyline points="16 16 12 12 8 16"></polyline></svg>
              Upload Your Photo
            </button>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
          <div className="upload-hint">Drag, rotate, or pinch to resize image on canvas</div>
        </div>

        {/* Checkout Footer */}
        <div className="checkout-area">
          <div className="total-price">
            ${CASE_TYPES[selectedCaseType].price}.00
          </div>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;
