// Passenger needs a CommonJS entry point to start the app.
// Since the app is an ES Module, we dynamically import it.
// We also explicitly call startServer() because Passenger's 
// node-loader.js is the main process, bypassing the typical
// "import.meta.url === process.argv[1]" execution block.

import('./dist/index.js').then(module => {
    return module.startServer();
}).catch(err => {
    console.error("Failed to start application via Passenger:", err);
    process.exit(1);
});
