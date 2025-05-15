const panel = document.getElementById('fontInfo');
const highlightBox = document.getElementById('highlightBox');
const themeToggle = document.getElementById('themeToggle');
const htmlUpload = document.getElementById('htmlUpload');
const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const urlStatus = document.getElementById('urlStatus');

let latestCSS = '';
let currentElement = null;
let fontData = {};
let currentHTMLContent = '';

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
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// Handle URL fetching and analysis
fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    urlStatus.textContent = 'Please enter a valid URL';
    urlStatus.style.color = 'red';
    return;
  }

  try {
    urlStatus.textContent = 'Fetching URL content...';
    urlStatus.style.color = 'inherit';

    // Use a proxy to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const data = await response.json();
    currentHTMLContent = data.contents;
    
    // Create a temporary iframe to parse the HTML
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.contentDocument.open();
    iframe.contentDocument.write(currentHTMLContent);
    iframe.contentDocument.close();
    
    // Replace the current document with the fetched content
    document.body.innerHTML = iframe.contentDocument.body.innerHTML;
    
    // Re-initialize event listeners on the new content
    initializeEventListeners();
    
    urlStatus.textContent = `Successfully loaded: ${url}`;
    urlStatus.style.color = 'green';
    
    // Remove the iframe after use
    setTimeout(() => document.body.removeChild(iframe), 1000);
    
  } catch (error) {
    console.error('Error fetching URL:', error);
    urlStatus.textContent = `Error: ${error.message}`;
    urlStatus.style.color = 'red';
  }
});

// Initialize event listeners for element inspection
function initializeEventListeners() {
  document.addEventListener('mouseover', function(e) {
    const rect = e.target.getBoundingClientRect();
    highlightBox.style.top = rect.top + window.scrollY + 'px';
    highlightBox.style.left = rect.left + window.scrollX + 'px';
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    currentElement = e.target;
    inspectElement(currentElement);
  });
}

function inspectElement(el) {
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
    timestamp: new Date().toISOString()
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
}

function copyCSS() {
  if (!latestCSS) {
    alert("No CSS to copy. Please inspect an element first.");
    return;
  }
  navigator.clipboard.writeText(latestCSS.trim()).then(() => {
    alert("CSS copied to clipboard!");
  });
}

function exportAsPDF() {
  if (!fontData || !fontData.tag) {
    alert("No font data to export. Please inspect an element first.");
    return;
  }
  
  // In a real implementation, you would use a PDF generation library like jsPDF
  alert("PDF export would be generated here. In a real implementation, this would use a library like jsPDF.");
  console.log("PDF Export Data:", fontData);
}

function exportAsJSON() {
  if (!fontData || !fontData.tag) {
    alert("No font data to export. Please inspect an element first.");
    return;
  }
  
  const dataStr = JSON.stringify(fontData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `fontpeek-${new Date().toISOString().slice(0,10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

function uploadHTML() {
  htmlUpload.click();
}

htmlUpload.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    currentHTMLContent = e.target.result;
    
    // Create a temporary iframe to parse the HTML
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.contentDocument.open();
    iframe.contentDocument.write(currentHTMLContent);
    iframe.contentDocument.close();
    
    // Replace the current document with the uploaded content
    document.body.innerHTML = iframe.contentDocument.body.innerHTML;
    
    // Re-initialize event listeners on the new content
    initializeEventListeners();
    
    alert("HTML file loaded successfully. You can now inspect elements.");
    
    // Remove the iframe after use
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
  reader.readAsText(file);
});

// Initialize
initTheme();
themeToggle.addEventListener('click', toggleTheme);
initializeEventListeners();
