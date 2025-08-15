import { Subitem } from './directoryScanner';
import './index.css';

document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the UI sections and elements we'll need
    const selectCollectionBtn = document.getElementById('select-collection-btn');
    const selectedFolderPathEl = document.getElementById('selected-folder-path');
    const collectionSelectionSection = document.getElementById('collection-selection');
    const collectionOverviewSection = document.getElementById('collection-overview');
    const itemsListEl = document.getElementById('items-list');
    const backToSelectionBtn = document.getElementById('back-to-selection-btn');


    // Ensure all elements exist before proceeding
    if (!selectCollectionBtn || !selectedFolderPathEl || !collectionSelectionSection || !collectionOverviewSection || !itemsListEl) {
        console.error('A required UI element is missing from index.html');
        return;
    }

    backToSelectionBtn.addEventListener('click', () => {
        collectionOverviewSection.classList.add('hidden');
        collectionSelectionSection.classList.remove('hidden');
        selectedFolderPathEl.innerText = 'None'; // Reset the path display
    });


    selectCollectionBtn.addEventListener('click', async () => {
        const folderPath = await window.api.selectFolder();
        if (!folderPath) {
            console.log('User canceled folder selection.');
            return;
        }

        selectedFolderPathEl.innerText = folderPath;
        console.log('[Renderer] Sending path to main process for scanning...');
        const state = await window.api.scanCollection(folderPath);
        console.log('[Renderer] Received scan result:', state);

        // Check if the selected folder was valid
        if (state && state.isValid) {
            // If valid, hide the selection UI and show the dashboard
            collectionSelectionSection.classList.add('hidden');
            collectionOverviewSection.classList.remove('hidden');
            // Call the function to render the list of items
            renderItemsList(itemsListEl, state.items);
        } else {
            // If not valid, show an error message
            alert(`Error: ${state.error}`);
        }
    });
    itemsListEl.addEventListener('click', (event) => {
        // Find the item header that was clicked on
        const header = (event.target as HTMLElement).closest('.item-header');
        if (header) {
            // Find the subitems list within that card
            const subitemsList = header.nextElementSibling;
            if (subitemsList) {
                // Toggle the 'collapsed' class to show/hide it
                subitemsList.classList.toggle('collapsed');
            }
        }
    });

});

/**
 * Renders the list of items into the specified container element.
 * @param container The HTML element to render the list into.
 * @param items The array of items to render.
 */
function renderItemsList(container: HTMLElement, items: any[]): void {
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = '<p>No processable items found in the Masters folder.</p>';
        return;
    }

    for (const item of items) {
        const statusClass = `status-${item.status.toLowerCase().replace(' ', '-')}`;
        const isFinished = item.status === 'Finished';

        const subitemsHTML = item.subitems.map((subitem: Subitem) => `
      <li>${subitem.subitemId}: ${subitem.masterFile} - <strong>${subitem.status}</strong></li>
    `).join('');

        const itemCardHTML = `
      <div class="item-card">
        <div class="item-header">
          <span>Item ID: ${item.itemId}</span>
          <span class="status ${statusClass}">${item.processedCount} / ${item.totalCount} Processed</span>
        </div>
        <ul class="subitems-list ${isFinished ? 'collapsed' : ''}">
          ${subitemsHTML}
        </ul>
      </div>
    `;

        container.insertAdjacentHTML('beforeend', itemCardHTML);
    }
}
