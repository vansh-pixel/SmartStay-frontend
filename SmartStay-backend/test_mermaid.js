const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('../UML_Diagrams.html', 'utf8');

const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable"
});

dom.window.document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded");
});

dom.window.console.error = function(...args) {
    console.log("BROWSER ERROR:", ...args);
};

dom.window.console.log = function(...args) {
    console.log("BROWSER LOG:", ...args);
};

dom.window.onerror = function(msg, source, lineno, colno, error) {
    console.log("BROWSER EXCEPTION:", msg, error);
}

setTimeout(() => {
    console.log("Exiting test...");
    process.exit(0);
}, 5000);
