// DOM Elements
const panel = document.getElementById('fontInfo');
const highlightBox = document.getElementById('highlightBox');
const themeToggle = document.getElementById('themeToggle');
const htmlUpload = document.getElementById('htmlUpload');
const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const urlStatus = document.getElementById('urlStatus');
const currentYear = document.getElementById('currentYear');
const infoPanel = document.getElementById('infoPanel');

// Global Variables
let latestCSS = '';
let currentElement = null;
let fontData = {};
let currentHTMLContent = '';
let activeIframe = null;

// Initialize the application
function init() {
  initTheme();
  setupEventListeners();
  setCurrentYear();
  showAlert('Welcome to FontPeek Pro! Click any element to inspect its fonts.', 'info');
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

// Toggle theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
}

// Update theme button icon
function updateThemeButton(theme) {
  const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
  themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
}

// Set current year in footer
function setCurrentYear() {
  currentYear.textContent = new Date().getFullYear();
}

// Setup event listeners
function setupEventListeners() {
  themeToggle.addEventListener('click', toggleTheme);
  fetchBtn.addEventListener('click', fetchAndAnalyzeURL);
  htmlUpload.addEventListener('change', handleHTMLUpload);
  
  // Initialize element inspection on the main content
  initializeElementInspection(document.body);
}

// Fetch and analyze URL
async function fetchAndAnalyzeURL() {
  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showStatus('Please include http:// or https://', 'error');
    return;
  }

  try {
    showStatus('Fetching URL content...', 'loading');
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = '<span class="spinner"></span> Loading...';
    
    // Clean up previous iframe if exists
    if (activeIframe) {
      document.body.removeChild(activeIframe);
      activeIframe = null;
    }

    // Use a proxy to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch URL. Please try another URL or check your internet connection.');
    }

    const data = await response.json();
    currentHTMLContent = data.contents;
    
    // Create a sandboxed iframe to parse the HTML
    activeIframe = document.createElement('iframe');
    activeIframe.sandbox = 'allow-same-origin';
    activeIframe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      z-index: 9990;
      background: white;
    `;
    document.body.appendChild(activeIframe);
    
    activeIframe.contentDocument.open();
    activeIframe.contentDocument.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <base href="${url}" target="_blank">
        <style>
          * { 
            cursor: crosshair !important; 
          }
          :hover { 
            outline: 2px dashed ${getComputedStyle(document.documentElement).getPropertyValue('--highlight-color')} !important; 
          }
          body {
            margin: 0;
            padding: 20px;
          }
        </style>
      </head>
      <body>${currentHTMLContent}</body>
      </html>
    `);
    activeIframe.contentDocument.close();
    
    // Initialize inspection on the iframe content
    initializeElementInspection(activeIframe.contentDocument.body);
    
    showStatus(`Successfully loaded: ${url}`, 'success');
    showAlert('URL loaded successfully! Click any element to inspect fonts.', 'success');
    
  } catch (error) {
    console.error('Error fetching URL:', error);
    showStatus(`Error: ${error.message}`, 'error');
    showAlert(error.message, 'error');
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.innerHTML = '<i class="fas fa-search"></i> Analyze URL';
  }
}

// Show status message
function showStatus(message, type) {
  urlStatus.textContent = message;
  urlStatus.className = 'status-message';
  
  switch(type) {
    case 'error':
      urlStatus.style.color = '#ff6b6b';
      break;
    case 'success':
      urlStatus.style.color = '#51cf66';
      break;
    case 'loading':
      urlStatus.style.color = '#339af0';
      break;
    default:
      urlStatus.style.color = 'inherit';
  }
}

// Initialize element inspection
function initializeElementInspection(element) {
  // Remove previous event listeners if any
  element.removeEventListener('mouseover', handleMouseOver);
  element.removeEventListener('click', handleElementClick);
  element.removeEventListener('click', stopEvent, true);
  
  // Add new event listeners
  element.addEventListener('mouseover', handleMouseOver);
  element.addEventListener('click', handleElementClick);
  element.addEventListener('click', stopEvent, true);
}

// Stop event propagation
function stopEvent(e) {
  e.stopPropagation();
  e.preventDefault();
}

// Handle mouseover event
function handleMouseOver(e) {
  const rect = e.target.getBoundingClientRect();
  highlightBox.style.display = 'block';
  highlightBox.style.top = rect.top + window.scrollY + 'px';
  highlightBox.style.left = rect.left + window.scrollX + 'px';
  highlightBox.style.width = rect.width + 'px';
  highlightBox.style.height = rect.height + 'px';
}

// Handle element click
function handleElementClick(e) {
  currentElement = e.target;
  inspectElement(currentElement);
  highlightBox.style.display = 'none';
}

// Inspect element
function inspectElement(el) {
  try {
    const style = window.getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const fontFamily = style.fontFamily;
    const fontSize = style.fontSize;
    const fontWeight = style.fontWeight;
    const fontStyle = style.fontStyle;
    const lineHeight = style.lineHeight;
    const color = style.color;
    const className = el.className || 'none';
    const id = el.id || 'none';
    const textContent = el.textContent ? el.textContent.trim().substring(0, 50) + (el.textContent.trim().length > 50 ? '...' : '') : '';

    latestCSS = `
font-family: ${fontFamily};
font-size: ${fontSize};
font-weight: ${fontWeight};
font-style: ${fontStyle};
line-height: ${lineHeight};
color: ${color};`;

    fontData = {
      tag,
      className,
      id,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      lineHeight,
      color,
      textContent,
      fullCSS: latestCSS.trim(),
      timestamp: new Date().toISOString(),
      sourceUrl: urlInput.value.trim() || window.location.href
    };

    panel.innerHTML = `
<b>Tag:</b> &lt;${tag}&gt;<br>
<b>Class:</b> ${className}<br>
<b>ID:</b> ${id}<br>
<b>Text:</b> ${textContent}<br>
<b>Font:</b> ${fontFamily}<br>
<b>Size:</b> ${fontSize}<br>
<b>Weight:</b> ${fontWeight}<br>
<b>Style:</b> ${fontStyle}<br>
<b>Line Height:</b> ${lineHeight}<br>
<b>Color:</b> <span style="color:${color}">${color}</span><br><br>
<pre>${latestCSS.trim()}</pre>`;
  } catch (error) {
    console.error('Error inspecting element:', error);
    showAlert('Error inspecting element. Please try another element.', 'error');
  }
}

// Copy CSS to clipboard
function copyCSS() {
  if (!latestCSS) {
    showAlert("No CSS to copy. Please inspect an element first.", 'error');
    return;
  }
  navigator.clipboard.writeText(latestCSS.trim()).then(() => {
    showAlert("CSS copied to clipboard!", 'success');
  }).catch(err => {
    showAlert("Failed to copy CSS. Please try again.", 'error');
    console.error('Copy failed:', err);
  });
}

// Export as PDF
function exportAsPDF() {
  if (!fontData || !fontData.tag) {
    showAlert("No font data to export. Please inspect an element first.", 'error');
    return;
  }
  
  // In a real implementation, you would use a PDF generation library like jsPDF
  showAlert("PDF export would be generated here. In a real implementation, this would use a library like jsPDF.", 'info');
  console.log("PDF Export Data:", fontData);
}

// Export as JSON
function exportAsJSON() {
  if (!fontData || !fontData.tag) {
    showAlert("No font data to export. Please inspect an element first.", 'error');
    return;
  }
  
  try {
    const dataStr = JSON.stringify(fontData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fontpeek-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert("JSON exported successfully!", 'success');
  } catch (error) {
    showAlert("Failed to export JSON. Please try again.", 'error');
    console.error('Export failed:', error);
  }
}

// Upload HTML
function uploadHTML() {
  htmlUpload.click();
}

// Handle HTML upload
function handleHTMLUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    showStatus('Loading HTML file...', 'loading');
    const reader = new FileReader();
    reader.onload = function(e) {
      currentHTMLContent = e.target.result;
      
      // Clean up previous iframe if exists
      if (activeIframe) {
        document.body.removeChild(activeIframe);
        activeIframe = null;
      }

      // Create a sandboxed iframe to parse the HTML
      activeIframe = document.createElement('iframe');
      activeIframe.sandbox = 'allow-same-origin';
      activeIframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 9990;
        background: white;
      `;
      document.body.appendChild(activeIframe);
      
      activeIframe.contentDocument.open();
      activeIframe.contentDocument.write(currentHTMLContent);
      activeIframe.contentDocument.close();
      
      // Initialize inspection on the iframe content
      initializeElementInspection(activeIframe.contentDocument.body);
      
      showStatus('HTML file loaded successfully', 'success');
      showAlert('HTML file loaded! Click any element to inspect fonts.', 'success');
    };
    reader.onerror = function() {
      throw new Error('Failed to read file');
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('Error loading HTML:', error);
    showStatus(`Error: ${error.message}`, 'error');
    showAlert(error.message, 'error');
  }
}

// Show alert message
function showAlert(message, type) {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.style.opacity = '0';
    setTimeout(() => {
      alertDiv.remove();
    }, 300);
  }, 3000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
