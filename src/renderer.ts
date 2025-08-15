import './index.css';


document.addEventListener('DOMContentLoaded', () => {
  const selectCollectionBtn = document.getElementById('select-collection-btn');
  const selectedFolderPath = document.getElementById('selected-folder-path');

  if (selectCollectionBtn && selectedFolderPath) {
    selectCollectionBtn.addEventListener('click', async () => {
      const folderPath = await window.api.selectFolder();
      
      if (folderPath) {
        selectedFolderPath.innerText = folderPath;
        console.log('[Renderer] Sending path to main process for scanning...');
        const scanResult = await window.api.scanCollection(folderPath);
        console.log('[Renderer] Received scan result:', scanResult);

      } else {
        console.log('User canceled folder selection.');
      }
    });
  }
});