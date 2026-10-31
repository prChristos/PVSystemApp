const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser'); 

let loginWindow;
let mainWindow;
let predictionsWindow; 
let statisticsWindow; 
let mergeWindow;
let featureAnalysisWindow;
let trendsWindow;
let outliersWindow;
let featureWindow;
let normalizeWindow; 
let featureSelectionWindow;
let trainSplitWindow;
let trainModelWindow;
let datasets = [];

function createLoginWindow() {
    loginWindow = new BrowserWindow({
        width: 400,
        height: 500,
        resizable: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    loginWindow.loadFile('login.html');
    loginWindow.on('closed', () => (loginWindow = null));
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        fullscreen: true, // Set window to full-screen
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.once('did-finish-load', () => {
        if (datasets.length > 0) {
            mainWindow.webContents.send('datasets-updated', datasets); // Send datasets back to index.html
        }
    });

    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Upload Weather Data',
                    click: () => uploadFile(),
                },
            ],
        },
        {
            label: 'Exit',
            submenu: [
                {
                    label: 'Quit Application',
                    role: 'quit',
                },
            ],
        },
        {
            label: 'Other Actions',
            submenu: [
                {
                    label: 'About',
                    click: () => showAboutDialog(),
                },
                {
                    label: 'Settings',
                    click: () => showSettingsDialog(),
                },
            ],
        },
    ]);

    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => (mainWindow = null));
}

function createPredictionsWindow(dataset) {
    predictionsWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    predictionsWindow.loadFile('predictions.html');

    predictionsWindow.webContents.once('did-finish-load', () => {
        predictionsWindow.webContents.send('load-datasets', datasets); // Send all datasets to predictions.html
    });
    
    // Define the menu
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save Dataset',
                    click: () => {
                        // Placeholder for saving the dataset
                        console.log('Save dataset option selected');
                    },
                },
                {
                    label: 'Open Dataset',
                    click: () => {
                        // Placeholder for opening another dataset
                        console.log('Open dataset option selected');
                    },
                },
            ],
        },
        {
            label: 'Back',
            click: () => {
                if (predictionsWindow) predictionsWindow.close();
                createMainWindow(); // Reopen the main window
            },
        },
        {
            label: 'About',
            click: () => showAboutDialog(),
        },
        {
            label: 'Exit',
            role: 'quit', // Built-in quit functionality
        },
    ]);

    Menu.setApplicationMenu(menu); // Apply the menu to the predictions window

    predictionsWindow.on('closed', () => (predictionsWindow = null));
}

function uploadFile() {
    dialog
        .showOpenDialog(mainWindow, {
            title: 'Upload Weather Data File',
            buttonLabel: 'Upload',
            filters: [{ name: 'CSV or JSON Files', extensions: ['csv', 'json'] }],
            properties: ['openFile'],
        })
        .then((result) => {
            if (!result.canceled) {
                const filePath = result.filePaths[0];
                const fileExtension = path.extname(filePath).toLowerCase();

                if (fileExtension === '.csv') {
                    parseCSV(filePath);
                } else if (fileExtension === '.json') {
                    parseJSON(filePath);
                } else {
                    dialog.showErrorBox(
                        'Invalid File Type',
                        'Only CSV and JSON files are allowed. Please select a valid file.'
                    );
                }
            }
        })
        .catch((err) => console.error('File upload failed:', err));
}

function parseCSV(filePath) {
    if (datasets.length >= 3) {
        dialog.showErrorBox('Dataset Limit Reached', 'You can only upload up to 3 datasets.');
        return;
    }

    const records = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => records.push(row))
        .on('end', () => {
            if (records.length > 0) {
                datasets.push({ name: path.basename(filePath), type: 'csv', data: records });
                mainWindow.webContents.send('datasets-updated', datasets); // Notify renderer
            } else {
                dialog.showErrorBox('Empty CSV File', 'The selected file contains no data.');
            }
        });
}


function parseJSON(filePath) {
    if (datasets.length >= 3) {
        dialog.showErrorBox('Dataset Limit Reached', 'You can only upload up to 3 datasets.');
        return;
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        if (Array.isArray(jsonData) && jsonData.length > 0) {
            datasets.push({ name: path.basename(filePath), type: 'json', data: jsonData });
            mainWindow.webContents.send('datasets-updated', datasets); // Notify renderer
        } else {
            dialog.showErrorBox('Invalid JSON Format', 'The JSON file must contain an array of objects.');
        }
    } catch (error) {
        dialog.showErrorBox('JSON Parsing Error', 'Failed to parse JSON file. Please check the file format.');
        console.error('Error parsing JSON:', error);
    }
}


function showAboutDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About PV System App',
        message: 'PV System App\nVersion 1.0.0\nPredict solar power production based on weather data.',
        buttons: ['OK'],
    });
}

function showSettingsDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Settings',
        message: 'Settings feature is under development!',
        buttons: ['OK'],
    });
}

function createStatisticsWindow() {
    statisticsWindow = new BrowserWindow({
        fullscreen: true, // Fullscreen mode
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    statisticsWindow.loadFile('statistics.html');

    statisticsWindow.webContents.once('did-finish-load', () => {
        if (datasets.length > 0) {
            statisticsWindow.webContents.send('load-dataset', datasets);
        } else {
            console.error('No datasets to load!');
        }
    });

    statisticsWindow.on('closed', () => {
        statisticsWindow = null;
    });
}

app.on('ready', createLoginWindow);

const { ipcMain } = require('electron');

// Handle Go for Predictions action
ipcMain.on('go-for-predictions', (event, datasets) => {
    if (mainWindow) mainWindow.close();
    createPredictionsWindow(datasets);
});


// Handle Back Button action
ipcMain.on('go-back-to-main', () => {
    if (predictionsWindow) predictionsWindow.close();
    createMainWindow(); // Recreate the main window
});

ipcMain.on('login-success', () => {
    if (loginWindow) loginWindow.close();
    createMainWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (loginWindow === null && mainWindow === null) createLoginWindow();
});

function createStatisticsWindow(dataset) {
    statisticsWindow = new BrowserWindow({
        fullscreen: true, // Fullscreen mode
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    statisticsWindow.loadFile('statistics.html');

    statisticsWindow.webContents.once('did-finish-load', () => {
        statisticsWindow.webContents.send('load-dataset', dataset); // Send dataset to statistics.html
    });

    // Handle window close
    statisticsWindow.on('closed', () => {
        statisticsWindow = null; // Properly dispose of the window
    });

    // Define the menu
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save Results',
                    click: () => {
                        // Placeholder for saving statistics results
                        console.log('Save results option selected');
                    },
                },
            ],
        },
        {
            label: 'Back',
            click: () => {
                if (statisticsWindow) statisticsWindow.close();
                createPredictionsWindow(dataset); // Reopen predictions window
            },
        },
        {
            label: 'About',
            click: () => showAboutDialog(),
        },
        {
            label: 'Exit',
            role: 'quit', // Built-in quit functionality
        },
    ]);

    Menu.setApplicationMenu(menu); // Apply the menu to the statistics window
}

ipcMain.on('perform-statistical-analysis', (event) => {
    createStatisticsWindow();
});

function createStatisticsWindow() {
    statisticsWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    statisticsWindow.loadFile('statistics.html');

    statisticsWindow.webContents.once('did-finish-load', () => {
        statisticsWindow.webContents.send('load-dataset', datasets);
    });

    statisticsWindow.on('closed', () => (statisticsWindow = null));
}

ipcMain.on('open-merge-window', (event, datasets) => {
    if (predictionsWindow) {
        predictionsWindow.close();
        predictionsWindow = null;
    }
    mergeWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mergeWindow.loadFile('merge.html'); // Load a new HTML file for merging

    const mergeMenu = Menu.buildFromTemplate([
        {
            label: 'Back',
            click: () => {
                if (mergeWindow) {
                    mergeWindow.close(); // Close merge.html
                    createPredictionsWindow(datasets); // Reopen predictions.html
                }
            },
        },
        {
            label: 'Exit',
            role: 'quit',
        },
    ]);

    Menu.setApplicationMenu(mergeMenu);

    mergeWindow.webContents.once('did-finish-load', () => {
        mergeWindow.webContents.send('load-datasets-for-merge', datasets); // Send datasets to merge.html
    });

    mergeWindow.on('closed', () => (mergeWindow = null));
});


function createFeatureAnalysisWindow() {
    featureAnalysisWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    featureAnalysisWindow.loadFile('feature-analysis.html');

    featureAnalysisWindow.webContents.once('did-finish-load', () => {
        console.log('Sending datasets to feature-analysis.html:', datasets); // Debugging log
        featureAnalysisWindow.webContents.send('load-datasets-for-feature-analysis', datasets);
    });

    featureAnalysisWindow.on('closed', () => {
        featureAnalysisWindow = null;
    });
}

// IPC Listener for Feature Analysis
ipcMain.on('perform-feature-analysis', (event) => {
    createFeatureAnalysisWindow();
});

ipcMain.on('open-trends-window', (event, datasets) => {
    if (BrowserWindow.getFocusedWindow()) BrowserWindow.getFocusedWindow().close(); // Close current window
    
    trendsWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    trendsWindow.loadFile('trends.html');

    trendsWindow.webContents.once('did-finish-load', () => {
        trendsWindow.webContents.send('load-datasets-for-trends', datasets); // Send datasets to trends.html
    });

    trendsWindow.on('closed', () => trendsWindow = null);
});

ipcMain.on('open-outliers-window', (event, datasets) => {
    outliersWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    outliersWindow.loadFile('outliers.html'); // Load a new HTML file for outliers

    outliersWindow.webContents.once('did-finish-load', () => {
        outliersWindow.webContents.send('load-datasets-for-outliers', datasets); // Send datasets to outliers.html
    });

    outliersWindow.on('closed', () => (outliersWindow = null));
});

ipcMain.on('handle-missing-values', (event, { index, method }) => {
    const dataset = datasets[index].data;

    // Apply the selected method
    Object.keys(dataset[0]).forEach(column => {
        const values = dataset.map(row => parseFloat(row[column])).filter(v => !isNaN(v));

        switch (method) {
            case 'mean': // Mean Imputation
                const meanValue = values.reduce((a, b) => a + b, 0) / values.length;
                dataset.forEach(row => {
                    if (row[column] === '' || row[column] === null || row[column] === undefined) {
                        row[column] = meanValue.toFixed(2);
                    }
                });
                break;

            case 'interpolation': // Linear Interpolation
                dataset.forEach((row, i) => {
                    if (row[column] === '' || row[column] === null || row[column] === undefined) {
                        const prev = i > 0 ? parseFloat(dataset[i - 1][column]) : null;
                        const next = i < dataset.length - 1 ? parseFloat(dataset[i + 1][column]) : null;
                        row[column] = ((prev || 0) + (next || 0)) / 2; // Simple linear interpolation
                    }
                });
                break;

            case 'discard': // Discard Incomplete Rows
                datasets[index].data = dataset.filter(row =>
                    Object.values(row).every(value => value !== '' && value !== null && value !== undefined)
                );
                break;
        }
    });

    console.log(`Missing values handled for Dataset ${index + 1} using ${method}`);
    event.sender.send('load-dataset', datasets); // Reload the updated dataset
});

ipcMain.on('open-extract-features-window', (event, datasets) => {
    featureWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    featureWindow.loadFile('extract-new-features.html');
    featureWindow.webContents.once('did-finish-load', () => {
        featureWindow.webContents.send('load-datasets-for-feature-extraction', datasets);
    });

    featureWindow.on('closed', () => (featureWindow = null));
});


ipcMain.on('save-extracted-features', (event, modifiedDatasets) => {
    datasets = datasets.concat(modifiedDatasets); // Append new datasets
    mainWindow.webContents.send('datasets-updated', datasets); // Update dropdowns in all windows
    console.log('New datasets added:', modifiedDatasets);
});



ipcMain.on('open-normalize-data-window', (event, datasets) => {
    if (featureWindow) {
        featureWindow.close();
        featureWindow = null;
    }

    normalizeWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    normalizeWindow.loadFile('normalize_data.html');

    normalizeWindow.webContents.once('did-finish-load', () => {
        normalizeWindow.webContents.send('load-datasets-for-normalization', datasets);
    });

    normalizeWindow.on('closed', () => {
        normalizeWindow = null;
    });
});

ipcMain.on('save-modified-dataset', (event, modifiedDatasets) => {
    modifiedDatasets.forEach((dataset, index) => {
        // Update in-memory dataset with normalized data
        datasets[index] = { ...datasets[index], data: dataset.data };

        const filePath = path.join(app.getPath('documents'), `${dataset.name}_normalized.json`);
        fs.writeFileSync(filePath, JSON.stringify(dataset.data, null, 2), 'utf-8');
        console.log(`Dataset saved to ${filePath}`);
    });

    dialog.showMessageBox({
        message: 'Normalized dataset saved and updated successfully!',
        buttons: ['OK']
    });
});

ipcMain.on('open-feature-selection-window', (event, datasets) => {
    featureSelectionWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    featureSelectionWindow.loadFile('feature_selection.html'); // Load the new HTML file

    featureSelectionWindow.webContents.once('did-finish-load', () => {
        featureSelectionWindow.webContents.send('load-datasets-for-feature-selection', datasets);
    });

    featureSelectionWindow.on('closed', () => {
        featureSelectionWindow = null;
    });
});

ipcMain.on('save-updated-dataset', (event, newDatasets) => {
    newDatasets.forEach(newDataset => {
        datasets.push(newDataset); // Add the new dataset to the global list
    });

    console.log('Updated Datasets:', datasets);

    // Send the updated datasets to all open windows
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('datasets-updated', datasets);
    });
});

ipcMain.on('open-other-window', (event) => {
    const targetWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    targetWindow.loadFile('other-page.html');
    targetWindow.webContents.on('did-finish-load', () => {
        targetWindow.webContents.send('load-updated-dataset', global.modifiedDataset);
    });
});

ipcMain.on('perform-train-test-split', (event, datasets) => {
    if (predictionsWindow) {
        predictionsWindow.close(); // Close predictions.html
        predictionsWindow = null;
    }

    trainSplitWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    trainSplitWindow.loadFile('train-valid-test.html'); // Load train-valid-test.html

    const trainMenu = Menu.buildFromTemplate([
        {
            label: 'Back',
            click: () => {
                if (trainSplitWindow) {
                    trainSplitWindow.close(); // Close train-valid-test.html
                    createPredictionsWindow(datasets); // Reopen predictions.html
                }
            },
        },
        {
            label: 'Exit',
            role: 'quit',
        },
    ]);

    Menu.setApplicationMenu(trainMenu); // Apply the menu to the train split window

    trainSplitWindow.webContents.once('did-finish-load', () => {
        trainSplitWindow.webContents.send('load-datasets', datasets); // Send datasets to train-valid-test.html
    });

    // Listen for split results
    ipcMain.once('split-datasets', (event, splitDatasets) => {
        datasets = [...datasets, ...splitDatasets]; // Append the new datasets
        saveDatasetsToFiles(splitDatasets); // Save the datasets to files
        updateAllWindows(); // Broadcast updates
    });

    trainSplitWindow.on('closed', () => (trainSplitWindow = null));
});

ipcMain.on('split-datasets', (event, splitDatasets) => {
    // Add the new datasets to the global list
    datasets = [...datasets, ...splitDatasets];

    // Save datasets to files or handle further processing if needed
    saveDatasetsToFiles(splitDatasets);

    // Broadcast the updated datasets to all windows
    updateAllWindows();
});

function saveDatasetsToFiles(datasetsToSave) {
    datasetsToSave.forEach(dataset => {
        const filePath = path.join(app.getPath('documents'), `${dataset.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(dataset.data, null, 2), 'utf-8');
        console.log(`Dataset saved to ${filePath}`);
    });
}

// Helper function to broadcast updated datasets
function updateAllWindows() {
    BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('datasets-updated', datasets);
    });
    console.log('Updated datasets broadcasted to all windows.');
}

ipcMain.on('train-model', (event, datasets) => {
    if (predictionsWindow) {
        predictionsWindow.close(); // Close current window
        predictionsWindow = null;
    }

    trainModelWindow = new BrowserWindow({
        fullscreen: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    trainModelWindow.loadFile('train-model.html');
    // Define the menu for navigation
     const trainMenu = Menu.buildFromTemplate([
        {
            label: 'Back',
            click: () => {
                if (trainModelWindow) {
                    trainModelWindow.close(); 
                    createPredictionsWindow(datasets); 
                }
            },
        },
        {
            label: 'Exit',
            role: 'quit',
        },
    ]);

    Menu.setApplicationMenu(trainMenu);

    trainModelWindow.webContents.once('did-finish-load', () => {
        trainModelWindow.webContents.send('load-datasets-for-training', datasets); // Send datasets to the training page
    });

    trainModelWindow.on('closed', () => (trainModelWindow = null));
});

ipcMain.on('pass-new-datasets', (event, newDatasets) => {
    console.log('Passing datasets to previous page:', newDatasets);
    // Forward datasets to the previous page
    mainWindow.webContents.send('receive-new-datasets', newDatasets);
});


