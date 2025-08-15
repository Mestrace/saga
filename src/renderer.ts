import './index.css';

// Define the shape of our custom API for TypeScript
interface ICustomAPI {
  selectFolder: () => Promise<string | null>;
}

// Tell TypeScript that the 'window' object will have our 'api' property
declare global {
  interface Window {
    api: ICustomAPI;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const selectCollectionBtn = document.getElementById('select-collection-btn');
  const selectedFolderPath = document.getElementById('selected-folder-path');

  if (selectCollectionBtn && selectedFolderPath) {
    selectCollectionBtn.addEventListener('click', async () => {
      const folderPath = await window.api.selectFolder();
      
      if (folderPath) {
        selectedFolderPath.innerText = folderPath;
      } else {
        console.log('User canceled folder selection.');
      }
    });
  }
});